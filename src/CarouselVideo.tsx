import { AbsoluteFill, useVideoConfig, Audio, useCurrentFrame } from "remotion";
import metadata from "./assets/audio/metadata.json";
import audioFile from "./assets/audio/final_audio.wav";
import { ImageBackground } from "./components/ImageBackground";
import { ScrollingSubtitle } from "./components/ScrollingSubtitle";
import { easeInOutQuad } from "./utils/ease";
import imageList from "./utils/images";

// 渐变时长 0.5秒 = 15帧
const FADE_DURATION = 15;

// 背景切换间隔 10 秒
const BG_SWITCH_INTERVAL = 10;

// 说话者配置
const SPEAKERS: Record<string, { name: string; color: string }> = {
  "vivian.surprise": { name: "Vivian", color: "#ffffff" },
  "man.surprise": { name: "Mr. Zhang", color: "#ffffff" },
};

export const CarouselVideo = () => {
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

  // 计算背景索引（每BG_SWITCH_INTERVAL秒切换一次）
  const bgIndex = Math.floor(currentTime / BG_SWITCH_INTERVAL);
  const prevBgIndex = Math.max(bgIndex - 1, -1);

  // 计算当前图片在列表中的索引（取模循环）
  const currentImageIndex = bgIndex % imageList.length;
  const prevImageIndex = prevBgIndex >= 0 ? prevBgIndex % imageList.length : -1;

  // 计算背景淡入进度（相对于切换时刻）
  const bgSwitchTime = bgIndex * BG_SWITCH_INTERVAL;
  const timeSinceSwitch = currentTime - bgSwitchTime;
  const fadeDurationSec = FADE_DURATION / fps;
  const bgProgress =
    bgIndex === 0
      ? 1
      : Math.min(Math.max(timeSinceSwitch / fadeDurationSec, 0), 1);

  // 计算内容淡入淡出进度
  const getContentOpacity = (index: number) => {
    const segment: any = metadata.segments[index];
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

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      <ImageBackground
        currentIndex={currentImageIndex}
        prevIndex={prevImageIndex}
        progress={bgProgress}
        isPortrait={isPortrait}
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

