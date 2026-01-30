import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { DialogueVideo } from "./DialogueVideo";
import metadata from "./assets/metadata.json";

const FPS = 30;
const AUDIO_DURATION = Math.ceil(metadata.total_duration * FPS);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={180} // 6秒预览
        fps={FPS}
        width={720}
        height={1280}
      />
      <Composition
        id="DialogueVideo"
        component={DialogueVideo}
        durationInFrames={AUDIO_DURATION}
        fps={FPS}
        width={720}
        height={1280}
      />
    </>
  );
};
