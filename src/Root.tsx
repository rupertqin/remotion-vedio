import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { DialogueVideo } from "./DialogueVideo";
import metadata from "./assets/metadata.json";

const FPS = 30;
const AUDIO_DURATION = Math.ceil(metadata.total_duration * FPS);

// 画布尺寸配置
const VIDEO_CONFIG = {
  PORTRAIT_720P: { width: 720, height: 1280 },
  PORTRAIT_1080P: { width: 1080, height: 1920 },
  HD_720P: { width: 1280, height: 720 },
  FULL_HD_1080P: { width: 1920, height: 1080 },
} as const;

type VideoConfigKey = keyof typeof VIDEO_CONFIG;

// 当前使用的尺寸配置
const CURRENT_CONFIG: VideoConfigKey = "PORTRAIT_720P";
const { width: VIDEO_WIDTH, height: VIDEO_HEIGHT } =
  VIDEO_CONFIG[CURRENT_CONFIG];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={180} // 6秒预览
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
      <Composition
        id="DialogueVideo"
        component={DialogueVideo}
        durationInFrames={AUDIO_DURATION}
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
    </>
  );
};
