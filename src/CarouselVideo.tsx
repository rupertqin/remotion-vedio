import { AbsoluteFill, useVideoConfig, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { sentences } from "./utils/subtitles";
import audioFile from "./assets/audio/audio.wav";
import { ImageBackground } from "./components/ImageBackground";
import { WordSubtitle } from "./components/WordSubtitle";
import { AudioWaveform } from "./components/AudioWaveform";
import { easeInOutQuad } from "./utils/ease";
import imageList from "./utils/images";

// 渐变时长 0.5秒 = 15帧
const FADE_DURATION = 15;

// 背景切换间隔 10 秒
const BG_SWITCH_INTERVAL = 10;

// 说话者配置（SRT 无说话人信息，统一使用默认配置）
const SPEAKERS: Record<string, { name: string; color: string }> = {
  default: { name: "", color: "#ffffff" },
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

  // 查找当前时间段（句子级，毫秒）
  const currentTimeMs = currentTime * 1000;
  const currentSentence = sentences.find(
    (s) => currentTimeMs >= s.startMs && currentTimeMs < s.endMs,
  );

  const speakerConfig = SPEAKERS.default;
  const segmentIndex = currentSentence?.index ?? 0;

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
    const seg = sentences[index];
    if (!seg) return 0;

    const startFrame = (seg.startMs / 1000) * fps;
    const endFrame = (seg.endMs / 1000) * fps;
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
      const isLast = index === sentences.length - 1;
      return isLast ? 1 : 0;
    }
  };

  const contentOpacity = getContentOpacity(segmentIndex);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1a2e",
        translate: "-1px 0px",
      }}
    >
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
        <AudioWaveform active={!!currentSentence} isPortrait={isPortrait} />

        <WordSubtitle
          sentence={currentSentence}
          color={speakerConfig.color}
          isPortrait={isPortrait}
        />
      </div>
    </AbsoluteFill>
  );
};
