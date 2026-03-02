// 统一字幕数据入口：词级 + 句子级两级结构
import wordSrtRaw from "../assets/audio/audio.word.srt";
import sentenceSrtRaw from "../assets/audio/audio.srt";
import { parseSrt } from "./parseSrt";
import {
  segmentsToWords,
  buildSentenceHierarchy,
  type WordToken,
  type SentenceGroup,
} from "./groupSentences";

// 每屏最少字数，不足则跨屏联合显示（可配置）
const MIN_CHARS_PER_SCREEN = 12;

// ===== 字幕整体时间偏移（毫秒）=====
// 用于微调字幕与音频的同步：正值 = 字幕整体往后推迟，负值 = 字幕整体提前。
// 例如字幕比声音早 200ms，则设为 200 让其推迟对齐。
export const SUBTITLE_OFFSET_MS: number = -400;

// 词级数据：来自 audio.word.srt
const wordSegments = parseSrt(wordSrtRaw);
const words: WordToken[] = segmentsToWords(wordSegments.segments);

// 应用整体时间偏移（平移所有词的时间戳）
if (SUBTITLE_OFFSET_MS !== 0) {
  for (const w of words) {
    w.startMs += SUBTITLE_OFFSET_MS;
    w.endMs += SUBTITLE_OFFSET_MS;
  }
}

// 句子级数据：由词级派生（按结束标点分组 + 短句合并）
const hierarchy = buildSentenceHierarchy(words, MIN_CHARS_PER_SCREEN);

// 逐句 srt（audio.srt）作为备用/对照
const sentenceSegments = parseSrt(sentenceSrtRaw);

// ===== 导出词级数据 =====
export const subtitleWords: WordToken[] = words;

// ===== 导出句子级数据 =====
export const sentences: SentenceGroup[] = hierarchy.sentences;

// ===== 视频总时长 =====
// 使用【原始未偏移】的 srt 时长（偏移不影响视频总时长，只影响字幕显示时间）
const wordTotalDuration = wordSegments.total_duration;
const sentenceTotalDuration = sentenceSegments.total_duration;
export const totalDuration = Math.max(wordTotalDuration, sentenceTotalDuration);

// ===== 兼容旧接口 metadata =====
export const metadata = {
  segments: hierarchy.sentences.map((s) => ({
    index: s.index,
    text: s.text,
    start_time: s.startMs / 1000,
    end_time: s.endMs / 1000,
    duration: s.durationMs / 1000,
  })),
  total_duration: totalDuration,
};

// ===== 兼容旧接口 subtitleData =====
export const subtitleData = {
  segments: metadata.segments,
  total_duration: totalDuration,
};

// 说话者配置（SRT 无说话人信息，统一使用白色）
export const SPEAKERS: Record<string, { name: string; color: string }> = {
  default: { name: "", color: "#ffffff" },
};
