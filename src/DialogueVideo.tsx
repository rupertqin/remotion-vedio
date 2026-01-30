import { AbsoluteFill, useVideoConfig, Audio } from "remotion";
import { useCurrentFrame } from "remotion";
import audioFile from "./assets/final_audio.wav";
import metadata from "./assets/metadata.json";
import coverImage from "./assets/cover.jpg";

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

// 缓动函数
const easeInOutQuad = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// 声波组件
const AudioWaveform = ({ active }: { active: boolean }) => {
  const bars = 20;

  if (!active) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 120,
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
  const currentImage = imageList[currentIndex % imageList.length];
  const prevImage =
    prevIndex >= 0 ? imageList[prevIndex % imageList.length] : null;

  // 当前图片透明度：淡入
  const currentOpacity = easeInOutQuad(progress);
  // 上一张图片透明度：淡出
  const prevOpacity = 1 - easeInOutQuad(progress);

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
          background: "rgba(0,0,0,0.5)",
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
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
        opacity,
      }}
    >
      {/* 说话者标签 */}
      <div
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: speakerConfig.color,
          marginBottom: 40,
          padding: "10px 30px",
          background: "rgba(0,0,0,0.5)",
          borderRadius: 30,
        }}
      >
        {speakerConfig.name}
      </div>

      {/* 对话内容 */}
      <div
        style={{
          fontSize: 36,
          color: speakerConfig.color,
          textAlign: "center",
          lineHeight: 1.6,
          fontWeight: "500",
          textShadow: "2px 2px 10px rgba(0,0,0,0.5)",
        }}
      >
        {segment?.text || ""}
      </div>

      {/* 声波效果 */}
      <AudioWaveform active={!!segment} />
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

  // 计算背景淡入进度
  const getBgProgress = (index: number) => {
    const segment = metadata.segments[index];
    if (!segment) return 0;
    // 第一张图片直接显示，不做淡入
    if (index === 0) return 1;
    const startFrame = segment.start_time * fps;
    const timeSinceStart = frame - startFrame;
    return Math.min(Math.max(timeSinceStart / FADE_DURATION, 0), 1);
  };

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

  // 获取上一张图片索引
  const prevIdx = segmentIndex > 0 ? segmentIndex - 1 : -1;
  const bgProgress = getBgProgress(segmentIndex);
  const contentOpacity = getContentOpacity(segmentIndex);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      {/* 背景图片 - 交叉淡入淡出 */}
      <ImageBackground
        currentIndex={segmentIndex}
        prevIndex={prevIdx}
        progress={bgProgress}
      />

      {/* 主音频 */}
      <Audio src={audioFile} volume={1} />

      {/* Cover 图片 - 全屏背景 */}
      <div
        style={{
          position: "absolute",
          top: "-10px",
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
          }}
        />
      </div>

      {/* 内容层 - 淡入淡出 */}
      <ContentLayer
        segment={currentSegment}
        speakerConfig={speakerConfig}
        opacity={contentOpacity}
      />
    </AbsoluteFill>
  );
};
