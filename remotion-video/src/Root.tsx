import { Composition } from "remotion";
import { MuhasibPromo, TOTAL_FRAMES, FPS } from "./MuhasibPromo";
import { MuhasibCanli, TOTAL2, FPS2 } from "./MuhasibCanli";

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition id="MuhasibCanli" component={MuhasibCanli} durationInFrames={TOTAL2} fps={FPS2} width={1080} height={1920} />
    <Composition
      id="MuhasibPromo"
      component={MuhasibPromo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
    </>
  );
};
