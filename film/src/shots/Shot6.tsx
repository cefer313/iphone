import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import T from '../data/timeline.json';
import {ramp, v3} from '../lib/math';
import {H, W, makeProjector} from '../lib/camera';
import {C} from '../lib/palette';
import {Figure} from '../rig/Figure';
import {GroundShadow} from '../rig/draw';
import {Step} from '../rig/gait';
import {walkPose} from '../rig/poses';
import {Street} from '../env/World';

const steps = T.steps.s6 as Step[];

/** SHOT 6 - The departure: rear wide, walking into the blue street; the doorway stays lit behind. */
export const Shot6: React.FC = () => {
  const f = useCurrentFrame();
  const proj = makeProjector({pos: v3(0.25, 1.5, -2.3 + ramp(f, 0, 149) * 0.12), target: v3(0.05, 1.05, 10), f: 1200, cx: W / 2, cy: H / 2 - 40});
  const {pose} = walkPose(steps, f, {emptyHanded: true});
  // he leaves with nothing in his hands; the lamplight falls away behind him
  const warm = 0.7 * (1 - ramp(f, 0, 70));
  return (
    <AbsoluteFill style={{background: C.night}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Street proj={proj} frame={f + 750} homeDoor={{z0: 0.75, z1: 1.65, open: 1}} />
        <GroundShadow proj={proj} c={pose.pelvis} r={0.34} rz={0.26} opacity={0.5} id="s6sh" />
        <Figure id="s6" proj={proj} pose={pose} light={{moonFrom: -1, warm, warmFrom: 1, exposure: 0.8}} />
      </svg>
    </AbsoluteFill>
  );
};
