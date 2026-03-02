import "./index.css";
import { Composition } from "remotion";
import { CarouselVideo } from "./CarouselVideo";
import { CoverVideo } from "./CoverVideo";
import { subtitleData, SUBTITLE_OFFSET_MS } from "./utils/subtitles";
import { VIDEO_CONFIG } from "./config";

const FPS = 30;
const AUDIO_DURATION = Math.ceil(subtitleData.total_duration * FPS);

// 字幕整体时间偏移（毫秒），用于字幕与音频的同步微调。
// 实际修改位置：src/utils/subtitles.ts 中的 SUBTITLE_OFFSET_MS
// 正值 = 字幕往后推迟；负值 = 字幕提前。
// 当前值：{SUBTITLE_OFFSET_MS} ms

// PORTRAIT_720P: { width: 720, height: 1280 },
// PORTRAIT_1080P: { width: 1080, height: 1920 },
// HD_720P: { width: 1280, height: 720 },
// HD_1080P: { width: 1920, height: 1080 },

export const RemotionRoot: React.FC = () => {
  const VIDEO_TYPE = "PORTRAIT_1080P";
  return (
    <>
      <Composition
        id="CarouselVideo"
        component={CarouselVideo}
        durationInFrames={AUDIO_DURATION}
        fps={FPS}
        width={VIDEO_CONFIG[VIDEO_TYPE].width}
        height={VIDEO_CONFIG[VIDEO_TYPE].height}
      />
      <Composition
        id="CoverVideo"
        component={CoverVideo}
        durationInFrames={AUDIO_DURATION}
        fps={FPS}
        width={VIDEO_CONFIG[VIDEO_TYPE].width}
        height={VIDEO_CONFIG[VIDEO_TYPE].height}
      />
    </>
  );
};
