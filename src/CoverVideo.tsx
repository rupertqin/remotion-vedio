import { AbsoluteFill, useVideoConfig, Audio, useCurrentFrame } from "remotion";
import metadata from "./assets/audio/metadata.json";
import audioFile from "./assets/audio/final_audio.wav";
import imageList, { coverImage } from "./utils/images";
import { easeInOutQuad } from "./utils/ease";

// 渐变时长 0.5秒 = 15帧
const FADE_DURATION = 15;

// 说话者配置
const SPEAKERS: Record<string, { name: string; color: string }> = {
  "vivian.surprise": { name: "Vivian", color: "#ffffff" },
  "man.surprise": { name: "Mr. Zhang", color: "#ffffff" },
};

export const CoverVideo = () => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTime = frame / fps;

  // 根据实际尺寸计算
  const isPortrait = height > width;
  const scale = Math.min(width / 720, height / 1280);
  const padding = {
    horizontal: isPortrait ? Math.round(50 * scale) : Math.round(60 * scale),
    top: Math.round(80 * scale),
    bottom: Math.round(120 * scale),
  };

  // 查找当前时间段
  const currentSegment = metadata.segments.find(
    (seg: any) => currentTime >= seg.start_time && currentTime < seg.end_time,
  );

  const speaker = currentSegment?.voice || "vivian.surprise";
  const speakerConfig = SPEAKERS[speaker];
  const segmentIndex = currentSegment?.index || 0;

  // 计算内容淡入淡出进度
  const getContentOpacity = (index: number) => {
    const segment = metadata.segments[index];
    if (!segment) return 0;

    const startFrame = segment.start_time * fps;
    const endFrame = segment.end_time * fps;
    const segmentStartFadeEnd = startFrame + FADE_DURATION;
    const segmentEndFadeStart = endFrame - FADE_DURATION;

    if (frame < startFrame) {
      return 0;
    } else if (frame < segmentStartFadeEnd) {
      if (index === 0) return 1;
      const progress = (frame - startFrame) / FADE_DURATION;
      return easeInOutQuad(progress);
    } else if (frame < segmentEndFadeStart) {
      return 1;
    } else if (frame < endFrame) {
      const progress = (frame - segmentEndFadeStart) / FADE_DURATION;
      return 1 - easeInOutQuad(progress);
    } else {
      const isLast = index === metadata.segments.length - 1;
      return isLast ? 1 : 0;
    }
  };

  const contentOpacity = getContentOpacity(segmentIndex);

  // 获取封面图：优先 cover.jpg，否则使用 imageList 第一张
  const coverImageSrc = coverImage || (imageList.length > 0 ? imageList[0] : null);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      {/* 封面图片 */}
      {coverImageSrc && (
        <img
          src={coverImageSrc}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.3)",
        }}
      />

      <Audio src={audioFile} volume={1} />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          padding: `${padding.top}px ${padding.horizontal}px ${padding.bottom}px`,
          opacity: contentOpacity,
        }}
      >
        <AudioWaveform active={!!currentSegment} isPortrait={isPortrait} />

        <ScrollingSubtitle
          text={currentSegment?.text || ""}
          duration={currentSegment?.duration || 0}
          fps={fps}
          startTime={currentSegment?.start_time || 0}
          color={speakerConfig.color}
          isPortrait={isPortrait}
        />
      </div>
    </AbsoluteFill>
  );
};

// 声波组件
const AudioWaveform = ({ active, isPortrait }: { active: boolean; isPortrait: boolean }) => {
  const bars = 20;

  if (!active) return null;

  const topPosition = isPortrait ? 80 : 60;

  return (
    <div
      style={{
        position: "absolute",
        top: topPosition,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        height: 40,
      }}
    >
      {[...Array(bars)].map((_, i) => (
        <WaveBar key={i} index={i} />
      ))}
    </div>
  );
};

const WaveBar = ({ index }: { index: number }) => {
  const frame = useCurrentFrame();
  const speed = 0.3 + (index % 5) * 0.1;
  const height =
    15 +
    Math.sin(frame * speed + index * 0.5) * 20 +
    Math.abs(Math.sin(frame * 0.1 + index * 0.3)) * 12;

  return (
    <div
      style={{
        width: 6,
        height: height,
        background: "rgba(255,255,255,0.6)",
        borderRadius: 3,
      }}
    />
  );
};

// 字幕逐行切换组件
const cleanLine = (line: string) => line.replace(/[。？！，；]$/, "").trim();

const splitTextByPunctuation = (text: string): string[] => {
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

const ScrollingSubtitle = ({
  text,
  duration,
  fps,
  startTime,
  color,
  isPortrait,
}: {
  text: string;
  duration: number;
  fps: number;
  startTime: number;
  color: string;
  isPortrait: boolean;
}) => {
  const frame = useCurrentFrame();
  const lines = splitTextByPunctuation(text);
  const lineCount = lines.length;

  if (lineCount === 0) return null;

  const bottomPosition = isPortrait ? "20%" : "10%";
  const horizontalPadding = isPortrait ? 50 : 0;

  const charsPerLine = lines.map((line) => line.length);
  const totalChars = charsPerLine.reduce((a, b) => a + b, 0);

  const lineDurations = charsPerLine.map((chars) =>
    Math.max((chars / totalChars) * duration, 1),
  );

  let accumulatedFrames = 0;
  const lineStartFrames: number[] = [];
  for (let i = 0; i < lineCount; i++) {
    lineStartFrames.push(accumulatedFrames);
    accumulatedFrames += lineDurations[i] * fps;
  }

  const segmentStartFrame = startTime * fps;
  const elapsed = frame - segmentStartFrame;

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

  const currentOpacity =
    lineElapsed < fadeOutStart
      ? 1
      : Math.max(0, 1 - (lineElapsed - fadeOutStart) / fadeFrames);

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
          fontSize: 36,
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
            fontSize: 36,
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
