// 从词级字幕派生句子级结构：按标点（含逗号）切分 + 短句双向择优合并 + 单屏字数上限

import type { SrtSegment } from "./parseSrt";

export interface WordToken {
  text: string; // 词/标点文本
  startMs: number; // 毫秒
  endMs: number; // 毫秒
  isPunctuation: boolean;
  isSentenceEnd: boolean; // 是否为结束标点（。？！…）
}

export interface SentenceGroup {
  index: number;
  text: string; // 拼接后的完整句文本
  startMs: number; // 首词开始时间（毫秒）
  endMs: number; // 末词结束时间（毫秒）
  durationMs: number;
  words: WordToken[]; // 该句包含的词
}

export interface SubtitleHierarchy {
  words: WordToken[]; // 全部词
  sentences: SentenceGroup[]; // 句子分组（已做短句合并 + 上限约束）
  rawSentences: SentenceGroup[]; // 未合并的原始分句（按所有标点切分）
  total_duration: number;
}

// 结束标点（决定一个"完整句"结束）
const SENTENCE_END_PUNCT = new Set(["。", "？", "！", "…"]);
// 全部切分标点（遇到即切分句）
const PUNCT_SET = new Set([
  "，", "。", "？", "！", "；", "：", "、", "…", "—", ",",
]);
// 引号/括号类（不切分，但影响拼接）
const BRACKET_SET = new Set([
  "“", "”", "‘", "’", "（", "）", "《", "》",
]);

// 判断一个词文本是否为标点
const isPunct = (text: string): boolean => {
  return text.split("").every((ch) => PUNCT_SET.has(ch) || BRACKET_SET.has(ch));
};

// 判断是否以结束标点结尾
const endsWithSentenceEnd = (text: string): boolean => {
  let t = text;
  while (
    t.length > 0 &&
    (t.endsWith("”") || t.endsWith("’") || t.endsWith("）") || t.endsWith('"') || t.endsWith("'"))
  ) {
    t = t.slice(0, -1);
  }
  return SENTENCE_END_PUNCT.has(t);
};

// 把词级 segments（来自逐词 srt）转成 WordToken 数组
export const segmentsToWords = (segments: SrtSegment[]): WordToken[] => {
  return segments.map((seg) => {
    const text = seg.text.trim();
    return {
      text,
      startMs: Math.round(seg.start_time * 1000),
      endMs: Math.round(seg.end_time * 1000),
      isPunctuation: isPunct(text),
      isSentenceEnd: endsWithSentenceEnd(text),
    };
  });
};

// 纯文本词（去掉标点）的数量，用于判断句子长度
const contentCharCount = (words: WordToken[]): number => {
  return words
    .filter((w) => !w.isPunctuation)
    .reduce((sum, w) => sum + w.text.length, 0);
};

// 把词数组拼成句（标点紧贴前词，不加空格）
const joinWords = (words: WordToken[]): string => {
  let out = "";
  for (const w of words) {
    const isOpenBracket =
      w.text.startsWith("“") || w.text.startsWith("‘") || w.text.startsWith("（");
    const isPunctOrClose =
      w.isPunctuation ||
      w.text.endsWith("”") ||
      w.text.endsWith("’") ||
      w.text.endsWith("）");
    const isCjk = (s: string) => /[\u4e00-\u9fff]/.test(s);
    if (out && !isOpenBracket && !isPunctOrClose) {
      const lastChar = out[out.length - 1];
      const curChar = w.text[0];
      if (!isCjk(lastChar) && !isCjk(curChar)) {
        out += " ";
      }
    }
    out += w.text;
  }
  return out.trim();
};

// 辅助：构造一个句子分组
const makeGroup = (index: number, words: WordToken[]): SentenceGroup => {
  const startMs = words[0].startMs;
  const endMs = words[words.length - 1].endMs;
  return {
    index,
    text: joinWords(words),
    startMs,
    endMs,
    durationMs: Math.max(endMs - startMs, 0),
    words,
  };
};

/**
 * 从词级数据派生句子级结构。
 *
 * 分屏规则：
 * 1. 遇到任意切分标点（逗号、句号、问号、叹号、分号、冒号、顿号）都切分句，
 *    分句默认各自成屏；
 * 2. 若分句字数 <= minMergeChars（默认3）：过短分句，按末尾标点决定合并方向：
 *    - 末尾是大分隔符（。？！…）→ 与上一句贴合，并入上一屏；
 *    - 否则（小分隔符如逗号等）→ 并入下一分句。
 * 3. 否则，向后并入：仅当"当前屏 + 下一分句 的字数 <= targetChars"时才并入下一分句；
 *    一旦并入会超过 targetChars 就停止、当前屏定稿。
 *    - 例：分句A(10字) + 分句B(18字) = 28 > 12 → 不合并，A/B 各自成屏。
 *    - 例：分句A(10字) + 分句B(1字) = 11 <= 12 → 合并成一屏。
 *    - 例：分句"于是，"(2字) <= 3字 且以逗号结尾 → 并入下一句。
 * 4. 单屏字数不得超过 maxCharsPerScreen（默认 36，约两行），
 *    超过时在分句内部按标点二次拆分。
 *
 * @param words 词级 tokens
 * @param minCharsPerScreen 目标字数（默认 12）：合并后接近该值才合并，用于防止逗号切得太碎
 * @param maxCharsPerScreen 单屏最多字数（默认 36）：防止一屏过长
 * @param minMergeChars 过短阈值（默认 3）：字数小于等于该值的分句强制并入下一句
 */
export const buildSentenceHierarchy = (
  words: WordToken[],
  minCharsPerScreen = 12,
  maxCharsPerScreen = 36,
  minMergeChars = 3,
): SubtitleHierarchy => {
  // ===== 第一步：按所有切分标点切出基础分句 =====
  // 基础分句 = 从上一个切点开始，到当前标点（含标点）为止的词序列。
  // 结束标点后的闭引号（"）归入当前分句。
  const rawSentences: SentenceGroup[] = [];
  let currentWords: WordToken[] = [];
  let pendingCloseQuote: WordToken[] = []; // 结束标点后的闭引号，归入上一分句

  for (const w of words) {
    // 如果上一个是结束标点且当前是闭引号，闭引号归入上一分句
    if (
      pendingCloseQuote.length === 0 &&
      (w.text.startsWith("”") || w.text.startsWith("’") || w.text.startsWith("）"))
    ) {
      // 把闭引号并入当前分句末尾
      currentWords.push(w);
      continue;
    }

    currentWords.push(w);

    // 判断是否达到切分点：当前词以切分标点结尾
    if (isPunct(w.text) && !BRACKET_SET.has(w.text)) {
      // 是切分标点 → 结束当前分句
      rawSentences.push(makeGroup(rawSentences.length, currentWords));
      currentWords = [];
    }
  }
  if (currentWords.length > 0) {
    rawSentences.push(makeGroup(rawSentences.length, currentWords));
  }

  // ===== 第二步：并入组装成屏 =====
  // 规则：
  // 1. 分句默认各自成屏；
  // 2. 若分句字数 <= minMergeChars(默认3)：过短分句，
  //    根据其末尾标点决定合并方向：
  //    - 末尾是大分隔符（。？！…）→ 与上一句贴合，并入上一屏（受上限约束）；
  //    - 否则 → 与下一句贴合，并入下一分句（受上限约束）；
  // 3. 否则，仅当"当前屏 + 下一分句 的字数 <= targetChars(默认12)"时才向后并入；
  //    一旦并入会超过 targetChars 就停止、当前屏定稿。
  //    - 这自然实现了"下一句很长就不合并"（如 10 + 18 = 28 > 12 → 单独成屏）。
  // 4. 单分句若本身超过 maxCharsPerScreen(36)，需在分句内二次拆分（罕见）。
  const merged: SentenceGroup[] = [];

  for (let i = 0; i < rawSentences.length; i++) {
    const part = rawSentences[i];
    const partChars = contentCharCount(part.words);

    // ===== 过短分句（<= minMergeChars）=====
    if (partChars <= minMergeChars) {
      const trailing = getTrailingPunct(part);

      // 大分隔符结尾 → 并入上一屏
      if (SENTENCE_END_PUNCT.has(trailing) && merged.length > 0) {
        const last = merged[merged.length - 1];
        if (contentCharCount(last.words) + partChars <= maxCharsPerScreen) {
          mergeInto(last, part);
          continue;
        }
        // 并入会超上限 → 单独成屏
        merged.push(makeGroup(merged.length, part.words));
        continue;
      }

      // 小分隔符结尾（或大分隔符但无上一屏）→ 并入下一分句
      // 注意：至少并入紧跟的一个分句（避免 2 字单独成屏），
      // 之后遵循"接近 targetChars"的逻辑，而不是一直吞到接近上限。
      let curWords = [...part.words];
      let curChars = partChars;
      let j = i + 1;
      let mergedAny = false;
      while (j < rawSentences.length) {
        const nextChars = contentCharCount(rawSentences[j].words);
        const canMerge = !mergedAny || curChars + nextChars <= minCharsPerScreen;
        if (canMerge && curChars + nextChars <= maxCharsPerScreen) {
          curWords = curWords.concat(rawSentences[j].words);
          curChars += nextChars;
          mergedAny = true;
          j++;
        } else {
          break;
        }
      }
      merged.push(makeGroup(merged.length, curWords));
      i = j - 1;
      continue;
    }

    // ===== 常规分句（> minMergeChars）=====
    // 向后并入：当前屏 + 下一分句 <= targetChars 才并入
    let curWords = [...part.words];
    let curChars = partChars;
    let j = i + 1;
    while (j < rawSentences.length) {
      const nextChars = contentCharCount(rawSentences[j].words);
      if (curChars + nextChars <= minCharsPerScreen) {
        curWords = curWords.concat(rawSentences[j].words);
        curChars += nextChars;
        j++;
      } else {
        break;
      }
    }
    merged.push(makeGroup(merged.length, curWords));
    i = j - 1;
  }

  // 处理"单个分句本身超过上限"的极端情况：在分句内部按逗号二次切分
  const finalScreens: SentenceGroup[] = [];
  for (const sc of merged) {
    const scChars = contentCharCount(sc.words);
    if (scChars > maxCharsPerScreen) {
      // 二次拆分：把过长的屏拆成若干 <= maxCharsPerScreen 的子屏
      splitOversized(sc, finalScreens);
    } else {
      finalScreens.push({ ...sc });
    }
  }

  // 重新编号
  finalScreens.forEach((m, i) => {
    m.index = i;
  });

  const total_duration =
    words.length > 0 ? words[words.length - 1].endMs / 1000 : 0;

  return {
    words,
    sentences: finalScreens,
    rawSentences,
    total_duration,
  };
};

// 取分句末尾的标点字符（去掉闭引号/括号后）
const getTrailingPunct = (group: SentenceGroup): string => {
  let text = group.text;
  // 去掉末尾的闭引号、闭括号
  while (
    text.length > 0 &&
    (text.endsWith("”") ||
      text.endsWith("’") ||
      text.endsWith("）") ||
      text.endsWith('"') ||
      text.endsWith("'"))
  ) {
    text = text.slice(0, -1);
  }
  return text.length > 0 ? text[text.length - 1] : "";
};

// 把 src 合并进 dst（dst 在前，src 在后）
const mergeInto = (dst: SentenceGroup, src: SentenceGroup): void => {
  dst.words = dst.words.concat(src.words);
  dst.text = joinWords(dst.words);
  dst.endMs = src.endMs;
  dst.durationMs = Math.max(dst.endMs - dst.startMs, 0);
};

// 把超长屏按标点（优先逗号、顿号）二次拆分成若干不超过 maxChars 的子屏
const splitOversized = (
  oversized: SentenceGroup,
  out: SentenceGroup[],
): void => {
  const words = oversized.words;
  let start = 0;
  // 累积当前子屏
  let curStart = 0;
  let curChars = 0;
  // 记录最近一个可切分的标点位置
  let lastSplitIdx = -1;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const isBreak = w.isPunctuation && !BRACKET_SET.has(w.text);
    // 字数累积（标点不计入字数）
    if (!w.isPunctuation) {
      curChars += w.text.length;
    }
    // 记录可切分点（当前词是逗号/句号等切分标点）
    if (isBreak) {
      lastSplitIdx = i;
    }
    // 若已超上限，且在可切分点处截断
    if (curChars > 36 && lastSplitIdx > curStart) {
      const chunkWords = words.slice(curStart, lastSplitIdx + 1);
      out.push(makeGroup(out.length, chunkWords));
      curStart = lastSplitIdx + 1;
      curChars = contentCharCount(words.slice(curStart, i + 1));
      lastSplitIdx = -1;
      start = i;
    }
  }
  // 剩余部分
  const rest = words.slice(curStart);
  if (rest.length > 0) {
    out.push(makeGroup(out.length, rest));
  }
};
