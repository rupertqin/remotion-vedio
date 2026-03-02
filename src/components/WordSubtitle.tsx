import { useCurrentFrame, useVideoConfig } from "remotion";
import type { SentenceGroup } from "../utils/groupSentences";

// 词淡入帧数
const WORD_FADE_FRAMES = 6;

// 屏末尾需要隐藏的标点（问号 ? 和感叹号 ! 保留显示）
// 只处理词文本末尾的标点，不影响分屏逻辑。
const stripTrailingHiddenPunct = (text: string): string => {
  const chars = text.split("");
  const deleteIdx = new Set<number>();
  for (let i = chars.length - 1; i >= 0; i--) {
    const ch = chars[i];
    if (ch === "？" || ch === "！") {
      break; // 保留问号/感叹号
    } else if ("。，；：、…".includes(ch)) {
      deleteIdx.add(i); // 删除该标点
    } else if (ch === "”" || ch === "’" || ch === "）" || ch === '"' || ch === "'") {
      continue; // 闭引号保留，继续向前看标点
    } else {
      break; // 遇到文字，停止
    }
  }
  return chars.filter((_, i) => !deleteIdx.has(i)).join("");
};

interface WordSubtitleProps {
  sentence: SentenceGroup | null;
  isPortrait?: boolean;
  color?: string;
}

// 逐词显示 + 句子转场字幕组件
export const WordSubtitle = ({
  sentence,
  isPortrait = true,
  color = "#ffffff",
}: WordSubtitleProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  if (!sentence) return null;

  const currentTimeMs = (frame / fps) * 1000;
  const maxDimension = Math.max(width, height);
  const fontSize = Math.round((maxDimension / 1280) * 44);

  const bottomPosition = isPortrait ? "18%" : "8%";
  const horizontalPadding = isPortrait ? 50 : 0;

  // 计算每个词应显示的文本：从屏末尾向前剥离需隐藏的标点
  const displayWords = sentence.words.map((w) => w.text);
  for (let i = displayWords.length - 1; i >= 0; i--) {
    const stripped = stripTrailingHiddenPunct(displayWords[i]);
    displayWords[i] = stripped;
    if (stripped.length > 0) break; // 该词还有内容，停止
    // 剥离后为空（纯标点被删），继续向前
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: bottomPosition,
        left: "50%",
        transform: "translateX(-50%)",
        width: `calc(100% - ${horizontalPadding * 2}px)`,
        padding: `0 ${horizontalPadding}px`,
        textAlign: "center",
        lineHeight: 1.6,
        fontSize,
        color,
        fontWeight: "500",
        textShadow: "2px 2px 10px rgba(0,0,0,0.8)",
        wordSpacing: 0,
        letterSpacing: 0,
      }}
    >
      {sentence.words.map((word, i) => {
        // 当前词是否已到出现时间
        const appeared = currentTimeMs >= word.startMs;
        // 淡入进度（0~1）
        const fadeProgress = appeared
          ? Math.min(
              1,
              Math.max(
                0,
                (currentTimeMs - word.startMs) /
                  ((WORD_FADE_FRAMES / fps) * 1000),
              ),
            )
          : 0;

        return (
          <span
            key={i}
            style={{
              opacity: fadeProgress,
              display: "inline",
            }}
          >
            {displayWords[i]}
          </span>
        );
      })}
    </div>
  );
};
