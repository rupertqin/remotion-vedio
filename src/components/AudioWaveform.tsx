import { useCurrentFrame } from "remotion";

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

interface AudioWaveformProps {
  active: boolean;
  isPortrait?: boolean;
}

export const AudioWaveform = ({ active, isPortrait = true }: AudioWaveformProps) => {
  const bars = 20;

  if (!active) return null;

  // 横屏时声波在顶部位置更高
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
