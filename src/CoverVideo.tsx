import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { sentences } from "./utils/subtitles";
import audioFile from "./assets/audio/audio.wav";
import imageList, { coverImage } from "./utils/images";
import { easeInOutQuad } from "./utils/ease";
import { WordSubtitle } from "./components/WordSubtitle";
import { AudioWaveform } from "./components/AudioWaveform";

// 渐变时长 0.5秒 = 15帧
const FADE_DURATION = 15;

// 说话者配置（SRT 无说话人信息，统一使用默认配置）
const SPEAKERS: Record<string, { name: string; color: string }> = {
  default: { name: "", color: "#ffffff" },
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

  // 查找当前时间段（句子级，毫秒）
  const currentTimeMs = currentTime * 1000;
  const currentSentence = sentences.find(
    (s) => currentTimeMs >= s.startMs && currentTimeMs < s.endMs,
  );

  const speakerConfig = SPEAKERS.default;
  const segmentIndex = currentSentence?.index ?? 0;

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

  // 获取封面图：优先 cover.jpg，否则使用 imageList 第一张
  const coverImageSrc =
    coverImage || (imageList.length > 0 ? imageList[0] : null);

  return (
    <>
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
          <AudioWaveform active={!!currentSentence} isPortrait={isPortrait} />

          <WordSubtitle
            sentence={currentSentence}
            color={speakerConfig.color}
            isPortrait={isPortrait}
          />
        </div>
      </AbsoluteFill>
    </>
  );
};
