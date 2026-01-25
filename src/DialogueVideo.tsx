import { AbsoluteFill, useVideoConfig, Audio } from "remotion";
import { useCurrentFrame } from "remotion";
import { useMemo } from "react";
import audioFile from "./assets/final_audio.wav";
import metadata from "./assets/metadata.json";

// 加载图片
const imagesContext = require.context(
  "./assets/images",
  false,
  /\.(jpg|jpeg|png|webp)$/,
);

interface Segment {
  index: number;
  voice: string;
  text: string;
  start_time: number;
  end_time: number;
  duration: number;
  audio_file: string;
}

interface Metadata {
  source_file: string;
  output_audio: string;
  total_duration: number;
  segment_count: number;
  created_at: string;
  model: string;
  segments: Segment[];
}

// 说话者配置
const SPEAKERS: Record<string, { name: string; color: string }> = {
  "vivian.surprise": { name: "Vivian", color: "#ffffff" },
  "man.surprise": { name: "Mr. Zhang", color: "#ffffff" },
};

// 图片背景组件
const ImageBackground = ({
  imageIndex,
  frame,
}: {
  imageIndex: number;
  frame: number;
}) => {
  const imageList = useMemo(() => {
    return imagesContext.keys().map((key: string) => imagesContext(key));
  }, []);

  const currentImage = imageList[imageIndex % imageList.length];

  // 轻微的缩放动画
  const scale = 1 + Math.sin(frame * 0.01) * 0.02;

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
      <img
        src={currentImage}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
      {/* 遮罩层 */}
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

export const DialogueVideo = () => {
  const { fps, width } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTime = frame / fps;

  // 当前时间段
  const currentSegment = metadata.segments.find(
    (seg) => currentTime >= seg.start_time && currentTime < seg.end_time,
  );

  const speaker = currentSegment?.voice || "vivian.surprise";
  const speakerConfig = SPEAKERS[speaker];
  const segmentIndex = currentSegment?.index || 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      {/* 背景图片 */}
      <ImageBackground imageIndex={segmentIndex} frame={frame} />

      {/* 主音频 */}
      <Audio src={audioFile} volume={1} />

      {/* 内容层 */}
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
        }}
      >
        {/* 对话内容 */}
        <div
          style={{
            fontSize: 36,
            color: speakerConfig.color,
            textAlign: "center",
            maxWidth: width - 120,
            lineHeight: 1.6,
            fontWeight: "500",
            textShadow: "2px 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          {currentSegment?.text || ""}
        </div>
      </div>
    </AbsoluteFill>
  );
};
