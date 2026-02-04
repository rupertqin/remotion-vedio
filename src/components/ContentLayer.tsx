import { useVideoConfig } from "remotion";
import { ScrollingSubtitle } from "./ScrollingSubtitle";
import { AudioWaveform } from "./AudioWaveform";

interface Segment {
  text: string;
  duration: number;
  start_time: number;
  voice: string;
}

interface ContentLayerProps {
  segment: Segment | undefined;
  speakerConfig: { name: string; color: string };
  opacity: number;
}

export const ContentLayer = ({
  segment,
  speakerConfig,
  opacity,
}: ContentLayerProps) => {
  const { fps, width, height } = useVideoConfig();
  const isPortrait = height > width;

  // 根据实际尺寸计算内边距
  const scale = Math.min(width / 720, height / 1280);
  const padding = {
    horizontal: isPortrait ? Math.round(50 * scale) : Math.round(60 * scale),
    top: Math.round(80 * scale),
    bottom: Math.round(120 * scale),
  };

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
        padding: `${padding.top}px ${padding.horizontal}px ${padding.bottom}px`,
        opacity,
      }}
    >
      <AudioWaveform active={!!segment} isPortrait={isPortrait} />

      <ScrollingSubtitle
        text={segment?.text || ""}
        duration={segment?.duration || 0}
        fps={fps}
        startTime={segment?.start_time || 0}
        color={speakerConfig.color}
        isPortrait={isPortrait}
      />
    </div>
  );
};
