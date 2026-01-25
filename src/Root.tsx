import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { DialogueVideo } from "./DialogueVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={180} // 6秒预览
        fps={30}
        width={720}
        height={1280}
      />
      <Composition
        id="DialogueVideo"
        component={DialogueVideo}
        durationInFrames={5280} // 176秒 * 30fps
        fps={30}
        width={720}
        height={1280}
      />
    </>
  );
};
