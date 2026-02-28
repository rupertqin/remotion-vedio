import { useCurrentFrame, useVideoConfig } from "remotion";

// 清理行尾标点
const cleanLine = (line: string) => line.replace(/[。？！，；]$/, "").trim();

// 按标点符号切割文本
export const splitTextByPunctuation = (text: string): string[] => {
  if (!text) return [];
  const parts = text.split(/([。？！，；])/);
  const lines: string[] = [];
  let currentLine = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (part === "。" || part === "！" || part === "？") {
      if (currentLine.trim()) lines.push(cleanLine(currentLine));
      currentLine = "";
    } else if (part === "，" || part === "；") {
      if (currentLine.trim()) lines.push(cleanLine(currentLine));
      currentLine = "";
    } else {
      currentLine += part;
      if (currentLine.length > 25) {
        const lastCommaIndex = currentLine.lastIndexOf("，");
        const lastSemicolonIndex = currentLine.lastIndexOf("；");
        const lastPunctuation = Math.max(lastCommaIndex, lastSemicolonIndex);

        if (lastPunctuation > 10) {
          const part1 = currentLine.slice(0, lastPunctuation);
          const part2 = currentLine.slice(lastPunctuation);
          if (part1.trim()) lines.push(cleanLine(part1));
          currentLine = part2;
        } else {
          if (currentLine.trim()) lines.push(cleanLine(currentLine));
          currentLine = "";
        }
      }
    }
  }

  if (currentLine.trim()) {
    lines.push(cleanLine(currentLine));
  }

  return lines;
};

// 字幕逐行切换组件
interface ScrollingSubtitleProps {
  text: string;
  duration: number;
  fps: number;
  startTime: number;
  color: string;
  isPortrait?: boolean;
}

export const ScrollingSubtitle = ({
  text,
  duration,
  fps,
  startTime,
  color,
  isPortrait = true,
}: ScrollingSubtitleProps) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const lines = splitTextByPunctuation(text);
  const lineCount = lines.length;

  if (lineCount === 0) return null;

  // 响应式字体大小 - 根据视频宽度缩放
  // 1080P (1920px) 时字体为 54px，720P (1280px) 时字体为 36px
  const fontSize = Math.round((width / 1920) * 54);

  // 横屏时字幕更贴近底部
  const bottomPosition = isPortrait ? "20%" : "10%";
  const horizontalPadding = isPortrait ? 50 : 0;

  // 计算每行时间（根据字数分配，最少1秒）
  const charsPerLine = lines.map((line) => line.length);
  const totalChars = charsPerLine.reduce((a, b) => a + b, 0);

  const lineDurations = charsPerLine.map((chars) =>
    Math.max((chars / totalChars) * duration, 1),
  );

  // 预计算每行的起始帧
  let accumulatedFrames = 0;
  const lineStartFrames: number[] = [];
  for (let i = 0; i < lineCount; i++) {
    lineStartFrames.push(accumulatedFrames);
    accumulatedFrames += lineDurations[i] * fps;
  }

  // 计算当前在 segment 中的位置
  const segmentStartFrame = startTime * fps;
  const elapsed = frame - segmentStartFrame;

  // 找到当前行
  let currentIndex = 0;
  for (let i = 0; i < lineCount; i++) {
    const lineEndFrame = lineStartFrames[i] + lineDurations[i] * fps;
    if (elapsed < lineEndFrame) {
      currentIndex = i;
      break;
    }
    currentIndex = i;
  }

  const nextIndex = Math.min(currentIndex + 1, lineCount - 1);
  const lineElapsed = elapsed - lineStartFrames[currentIndex];
  const lineDurationFrames = lineDurations[currentIndex] * fps;

  const fadeFrames = Math.floor(fps * 0.1);
  const fadeOutStart = lineDurationFrames * 0.85;

  // 当前行透明度
  const currentOpacity =
    lineElapsed < fadeOutStart
      ? 1
      : Math.max(0, 1 - (lineElapsed - fadeOutStart) / fadeFrames);

  // 下一行透明度
  const nextLineStartFrame = lineStartFrames[nextIndex];
  const nextLineElapsed = elapsed - nextLineStartFrame;
  const nextLineDurationFrames = lineDurations[nextIndex] * fps;
  const nextFadeOutStart = nextLineDurationFrames * 0.85;
  const nextOpacity =
    nextLineElapsed < nextFadeOutStart
      ? nextLineElapsed < fadeFrames
        ? nextLineElapsed / fadeFrames
        : 1
      : Math.max(0, 1 - (nextLineElapsed - nextFadeOutStart) / fadeFrames);

  return (
    <div
      style={{
        position: "absolute",
        bottom: bottomPosition,
        left: "50%",
        transform: "translateX(-50%)",
        width: `calc(100% - ${horizontalPadding * 2}px)`,
        padding: `0 ${horizontalPadding}px`,
        height: 60,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          fontSize,
          color: color,
          textAlign: "center",
          lineHeight: 1.5,
          fontWeight: "500",
          textShadow: "2px 2px 10px rgba(0,0,0,0.8)",
          opacity: currentOpacity,
          transition: "opacity 0.03s",
          padding: "0 20px",
        }}
      >
        {lines[currentIndex]}
      </div>

      {nextIndex !== currentIndex && (
        <div
          style={{
            position: "absolute",
            fontSize,
            color: color,
            textAlign: "center",
            lineHeight: 1.5,
            fontWeight: "500",
            textShadow: "2px 2px 10px rgba(0,0,0,0.5)",
            opacity: nextOpacity,
            transition: "opacity 0.03s",
            padding: "0 20px",
          }}
        >
          {lines[nextIndex]}
        </div>
      )}
    </div>
  );
};
