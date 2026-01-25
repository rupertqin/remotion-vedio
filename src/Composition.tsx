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

// 切换效果类型
type TransitionType = "fade" | "slideLeft" | "slideRight" | "zoom" | "blur";

const TRANSITIONS: TransitionType[] = [
  "fade",
  "slideLeft",
  "slideRight",
  "zoom",
  "blur",
];

export const MyComposition = () => {
  const { fps, durationInFrames } = useVideoConfig();

  const imageList = useMemo(() => {
    const all = imagesContext.keys().map((key: string) => imagesContext(key));
    // 只取和字幕段数相同数量的图片
    return all.slice(0, metadata.segments.length);
  }, []);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {imageList.map((src, index) => {
        const segment = metadata.segments[index];
        const startFrame = segment.start_time * fps;
        const endFrame = segment.end_time * fps;
        const transitionType = TRANSITIONS[index % TRANSITIONS.length];

        return (
          <AbsoluteFill
            key={src}
            style={{
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <ImageTransition
              src={src}
              startFrame={startFrame}
              endFrame={endFrame}
              transitionType={transitionType}
            />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

const ImageTransition = ({
  src,
  startFrame,
  endFrame,
  transitionType,
}: {
  src: string;
  startFrame: number;
  endFrame: number;
  transitionType: TransitionType;
}) => {
  const frame = useCurrentFrame();

  const inRange = frame >= startFrame && frame < endFrame;

  if (!inRange) return null;

  const localFrame = frame - startFrame;
  const imageDuration = endFrame - startFrame;

  // 动画参数：进入20%，停留60%，退出20%
  const enterDuration = Math.floor(imageDuration * 0.2);
  const stayDuration = Math.floor(imageDuration * 0.6);
  const exitDuration = Math.floor(imageDuration * 0.2);

  // 计算样式
  const getStyle = () => {
    if (localFrame < enterDuration) {
      const progress = localFrame / enterDuration;
      return getEnterStyle(progress, transitionType);
    } else if (localFrame < enterDuration + stayDuration) {
      return getStayStyle(transitionType);
    } else {
      const exitProgress = (localFrame - enterDuration - stayDuration) / exitDuration;
      return getExitStyle(exitProgress, transitionType);
    }
  };

  return (
    <img
      src={src}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...getStyle(),
      }}
    />
  );
};

// 进入动画
const getEnterStyle = (progress: number, type: TransitionType) => {
  const eased = easeOutQuart(progress);
  switch (type) {
    case "fade":
      return { opacity: eased };
    case "slideLeft":
      return { opacity: eased, transform: `translateX(${(1 - eased) * 100}%)` };
    case "slideRight":
      return { opacity: eased, transform: `translateX(${(eased - 1) * 100}%)` };
    case "zoom":
      return { opacity: eased, transform: `scale(${0.9 + 0.1 * eased})` };
    case "blur":
      return { opacity: eased, transform: `scale(${0.95 + 0.05 * eased})`, filter: `blur(${(1 - eased) * 20}px)` };
    default:
      return { opacity: eased };
  }
};

// 停留动画
const getStayStyle = (type: TransitionType) => {
  switch (type) {
    case "zoom":
      return { transform: "scale(1)" };
    case "blur":
      return { filter: "blur(0px)" };
    default:
      return { opacity: 1 };
  }
};

// 退出动画
const getExitStyle = (progress: number, type: TransitionType) => {
  const eased = easeInQuart(progress);
  switch (type) {
    case "fade":
      return { opacity: 1 - eased };
    case "slideLeft":
      return { opacity: 1 - eased, transform: `translateX(${-eased * 100}%)` };
    case "slideRight":
      return { opacity: 1 - eased, transform: `translateX(${eased * 100}%)` };
    case "zoom":
      return { opacity: 1 - eased, transform: `scale(${1.1 - 0.1 * eased})` };
    case "blur":
      return { opacity: 1 - eased, transform: `scale(${1 - 0.05 * eased})`, filter: `blur(${eased * 10}px)` };
    default:
      return { opacity: 1 - eased };
  }
};

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const easeInQuart = (t: number) => t * t * t * t;
