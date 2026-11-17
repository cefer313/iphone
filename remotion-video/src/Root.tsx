import { Composition } from "remotion";
import { MuhasibPromo, TOTAL_FRAMES, FPS } from "./MuhasibPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MuhasibPromo"
      component={MuhasibPromo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
