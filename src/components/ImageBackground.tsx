import imageList from "../utils/images";

interface ImageBackgroundProps {
  currentIndex: number;
  prevIndex: number;
  progress: number;
  isPortrait?: boolean;
}

export const ImageBackground = ({
  currentIndex,
  prevIndex,
  progress,
  isPortrait = true,
}: ImageBackgroundProps) => {
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
      {prevImage && prevIndex !== currentIndex && (
        <img
          src={prevImage}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: isPortrait ? "center center" : "center 20%",
            opacity: prevOpacity,
          }}
        />
      )}

      <img
        src={currentImage}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: isPortrait ? "center center" : "center 20%",
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
