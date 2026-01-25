import { AbsoluteFill, useVideoConfig } from "remotion";
import { useCurrentFrame } from "remotion";
import { useMemo } from "react";
import metadata from "./assets/metadata.json";

// webpack 的 require.context 加载本地图片
const imagesContext = require.context(
  "./assets/images",
  false,
  /\.(jpg|jpeg|png|webp)$/
);

export const MyComposition = () => {
  const { fps } = useVideoConfig();

  const imageList = useMemo(() => {
    const all = imagesContext.keys().map((key: string) => imagesContext(key));
    return all.slice(0, metadata.segments.length);
  }, []);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {imageList.map((src, index) => {
        const segment = metadata.segments[index];
        const startFrame = segment.start_time * fps;
        const endFrame = segment.end_time * fps;

        return (
          <ImageLayer
            key={src}
            src={src}
            startFrame={startFrame}
            endFrame={endFrame}
            isLast={index === imageList.length - 1}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const ImageLayer = ({
  src,
  startFrame,
  endFrame,
  isLast,
}: {
  src: string;
  startFrame: number;
  endFrame: number;
  isLast: boolean;
}) => {
  const frame = useCurrentFrame();
  const totalDuration = endFrame - startFrame;

  // 渐变时长 0.3秒 = 9帧
  const fadeDuration = 9;

  let opacity = 0;

  if (frame < startFrame) {
    // 开始前 - 隐藏
    opacity = 0;
  } else if (frame < startFrame + fadeDuration) {
    // 淡入阶段
    const progress = (frame - startFrame) / fadeDuration;
    opacity = easeInOutCubic(progress);
  } else if (frame < endFrame - fadeDuration) {
    // 停留阶段 - 完全显示
    opacity = 1;
  } else if (frame < endFrame) {
    // 淡出阶段
    const progress = (frame - (endFrame - fadeDuration)) / fadeDuration;
    opacity = 1 - easeInOutCubic(progress);
  } else if (isLast) {
    // 最后一张图片保持显示
    opacity = 1;
  } else {
    // 结束后 - 隐藏
    opacity = 0;
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity,
        }}
      />
    </AbsoluteFill>
  );
};

const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
