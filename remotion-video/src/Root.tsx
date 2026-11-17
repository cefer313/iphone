import { Composition } from "remotion";
import { MuhasibPromo, TOTAL_FRAMES, FPS } from "./MuhasibPromo";
import { MuhasibCanli, TOTAL2, FPS2 } from "./MuhasibCanli";
import { MuhasibReal, TOTAL3, FPS3 } from "./MuhasibReal";
import { MuhasibFoto, TOTAL4, FPS4 } from "./MuhasibFoto";

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition id="MuhasibFoto" component={MuhasibFoto} durationInFrames={TOTAL4} fps={FPS4} width={1080} height={1920} />
    <Composition id="MuhasibReal" component={MuhasibReal} durationInFrames={TOTAL3} fps={FPS3} width={1080} height={1920} />
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
