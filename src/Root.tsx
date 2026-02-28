import "./index.css";
import { Composition } from "remotion";
import { CarouselVideo } from "./CarouselVideo";
import { CoverVideo } from "./CoverVideo";
import metadata from "./assets/audio/metadata.json";
import { VIDEO_CONFIG } from "./config";

const FPS = 30;
const AUDIO_DURATION = Math.ceil(metadata.total_duration * FPS);

// PORTRAIT_720P: { width: 720, height: 1280 },
// PORTRAIT_1080P: { width: 1080, height: 1920 },
// HD_720P: { width: 1280, height: 720 },
// FULL_HD_1080P: { width: 1920, height: 1080 },

export const RemotionRoot: React.FC = () => {
  const VIDEO_TYPE = "FULL_HD_1080P";
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
