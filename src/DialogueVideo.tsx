import { AbsoluteFill, useVideoConfig, Audio } from "remotion";
import { useCurrentFrame } from "remotion";
import audioFile from "./assets/final_audio.wav";
import metadata from "./assets/metadata.json";

// 加载图片
const imagesContext = require.context(
  "./assets/images",
  false,
  /\.(jpg|jpeg|png|webp)$/,
);

// 说话者配置
const SPEAKERS: Record<string, { name: string; color: string }> = {
  "vivian.surprise": { name: "Vivian", color: "#ffffff" },
  "man.surprise": { name: "Mr. Zhang", color: "#ffffff" },
};

// 渐变时长 0.5秒 = 15帧
const FADE_DURATION = 15;

// 背景切换间隔 10 秒
const BG_SWITCH_INTERVAL = 10;

// 缓动函数
const easeInOutQuad = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// 清理行尾标点
const cleanLine = (line: string) => line.replace(/[。？！，；]$/, "").trim();

// 按标点符号切割文本
const splitTextByPunctuation = (text: string): string[] => {
  if (!text) return [];
  // 按句号、逗号、问号、感叹号、分号切割
  const parts = text.split(/([。？！，；])/);
  const lines: string[] = [];
  let currentLine = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (part === "。" || part === "！" || part === "？") {
      // 句末标点，直接分割
      if (currentLine.trim()) lines.push(cleanLine(currentLine));
      currentLine = "";
    } else if (part === "，" || part === "；") {
      // 句中标点，直接分割，不保留标点
      if (currentLine.trim()) lines.push(cleanLine(currentLine));
      currentLine = "";
    } else {
      // 普通文字，添加到当前行
      currentLine += part;
      // 如果当前行太长（超过25字），也要分割
      if (currentLine.length > 25) {
        const lastCommaIndex = currentLine.lastIndexOf("，");
        const lastSemicolonIndex = currentLine.lastIndexOf("；");
        const lastPunctuation = Math.max(lastCommaIndex, lastSemicolonIndex);

        if (lastPunctuation > 10) {
          // 在最后一个标点处分割
          const part1 = currentLine.slice(0, lastPunctuation);
          const part2 = currentLine.slice(lastPunctuation);
          if (part1.trim()) lines.push(cleanLine(part1));
          currentLine = part2;
        } else {
          // 没有标点，直接按字数分割
          if (currentLine.trim()) lines.push(cleanLine(currentLine));
          currentLine = "";
        }
      }
    }
  }

  // 处理最后剩余的内容
  if (currentLine.trim()) {
    lines.push(cleanLine(currentLine));
  }

  return lines;
};

// 字幕逐行切换组件
const ScrollingSubtitle = ({
  text,
  duration,
  fps,
  startTime,
  color,
}: {
  text: string;
  duration: number;
  fps: number;
  startTime: number;
  color: string;
}) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const lines = splitTextByPunctuation(text);
  const lineCount = lines.length;

  if (lineCount === 0) return null;

  // 响应式字体大小（以 720p 竖屏 1280 为基准）
  // 横屏用高度计算，竖屏用宽度计算
  const isLandscape = width > height;
  const referenceSize = isLandscape ? 720 : 720;
  const currentSize = isLandscape ? height : width;
  const baseFontSize = 36;
  const fontSize = Math.round(baseFontSize * (currentSize / referenceSize));

  // 横屏时字幕更贴近底部
  const bottomPosition = isLandscape ? "10%" : "20%";
  // 横屏时字幕容器留出左右边距
  const horizontalPadding = isLandscape ? 0 : 50;

  // 计算每行时间（根据字数分配，最少1秒）
  const charsPerLine = lines.map((line) => line.length);
  const totalChars = charsPerLine.reduce((a, b) => a + b, 0);

  // 计算每行的时间：当前行时长 = (字数/总字数) * segment总时长
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

  const fadeFrames = Math.floor(fps * 0.1); // 0.1秒快速淡入淡出
  const fadeOutStart = lineDurationFrames * 0.85; // 前85%时间完全不透明

  // 当前行透明度
  const currentOpacity =
    lineElapsed < fadeOutStart
      ? 1
      : Math.max(0, 1 - (lineElapsed - fadeOutStart) / fadeFrames);

  // 下一行透明度（当前行结束后淡入）
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
      {/* 当前行 */}
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

      {/* 下一行（重叠在当前位置，淡进淡出） */}
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

// 声波组件
const AudioWaveform = ({ active }: { active: boolean }) => {
  const bars = 20;

  if (!active) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 100,
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

// 图片列表（模块加载时获取）
const imageList = imagesContext.keys().map((key: string) => imagesContext(key));

// 背景图片组件 - 支持交叉淡入淡出
const ImageBackground = ({
  currentIndex,
  prevIndex,
  progress,
}: {
  currentIndex: number;
  prevIndex: number;
  progress: number;
}) => {
  const currentImage = imageList[currentIndex];
  const prevImage = prevIndex >= 0 ? imageList[prevIndex] : null;

  // 当前图片透明度：淡入
  const currentOpacity = progress;
  // 上一张图片透明度：淡出
  const prevOpacity = 1 - progress;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      {/* 上一张图片（淡出） */}
      {prevImage && prevIndex !== currentIndex && (
        <img
          src={prevImage}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: prevOpacity,
          }}
        />
      )}

      {/* 当前图片（淡入） */}
      <img
        src={currentImage}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: currentOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
};

// 内容层组件 - 支持淡入淡出
const ContentLayer = ({
  segment,
  speakerConfig,
  opacity,
}: {
  segment: (typeof metadata.segments)[0] | undefined;
  speakerConfig: { name: string; color: string };
  opacity: number;
}) => {
  const { fps } = useVideoConfig();

  return (
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
        padding: "80px 60px 120px",
        opacity,
      }}
    >
      {/* 声波效果 - 顶部 */}
      <AudioWaveform active={!!segment} />

      {/* 对话内容 - 底部 */}
      <ScrollingSubtitle
        text={segment?.text || ""}
        duration={segment?.duration || 0}
        fps={fps}
        startTime={segment?.start_time || 0}
        color={speakerConfig.color}
      />
    </div>
  );
};

export const DialogueVideo = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTime = frame / fps;

  // 查找当前时间段
  const currentSegment = metadata.segments.find(
    (seg) => currentTime >= seg.start_time && currentTime < seg.end_time,
  );

  const speaker = currentSegment?.voice || "vivian.surprise";
  const speakerConfig = SPEAKERS[speaker];
  const segmentIndex = currentSegment?.index || 0;

  // 计算背景索引（每{BG_SWITCH_INTERVAL}秒切换一次）
  const bgIndex = Math.floor(currentTime / BG_SWITCH_INTERVAL);
  const prevBgIndex = Math.max(bgIndex - 1, -1);

  // 计算当前图片在列表中的索引（取模循环）
  const currentImageIndex = bgIndex % imageList.length;
  const prevImageIndex = prevBgIndex >= 0 ? prevBgIndex % imageList.length : -1;

  // 计算背景淡入进度（相对于切换时刻）
  // 在每次切换时刻，progress 从 0 开始，0.5秒后达到 1
  const bgSwitchTime = bgIndex * BG_SWITCH_INTERVAL;
  const timeSinceSwitch = currentTime - bgSwitchTime;
  const fadeDurationSec = FADE_DURATION / fps; // 0.5秒
  const bgProgress =
    bgIndex === 0
      ? 1
      : Math.min(Math.max(timeSinceSwitch / fadeDurationSec, 0), 1);

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
      // 淡入阶段 - 第一张图片直接显示
      if (index === 0) return 1;
      const progress = (frame - startFrame) / FADE_DURATION;
      return easeInOutQuad(progress);
    } else if (frame < segmentEndFadeStart) {
      // 完全显示阶段
      return 1;
    } else if (frame < endFrame) {
      // 淡出阶段
      const progress = (frame - segmentEndFadeStart) / FADE_DURATION;
      return 1 - easeInOutQuad(progress);
    } else {
      // 结束后
      const isLast = index === metadata.segments.length - 1;
      return isLast ? 1 : 0;
    }
  };

  // 内容淡入淡出进度（仍然基于 segment）
  const contentOpacity = getContentOpacity(segmentIndex);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      {/* 背景图片 - 交叉淡入淡出 */}
      <ImageBackground
        currentIndex={currentImageIndex}
        prevIndex={prevImageIndex}
        progress={bgProgress}
      />

      {/* 主音频 */}
      <Audio src={audioFile} volume={1} />

      {/* 内容层 - 淡入淡出 */}
      <ContentLayer
        segment={currentSegment}
        speakerConfig={speakerConfig}
        opacity={contentOpacity}
      />
    </AbsoluteFill>
  );
};
