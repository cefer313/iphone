import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import T from '../data/timeline.json';
import {add, kf, kf3, lerp3, mul, ramp, v3, UP} from '../lib/math';
import {H, W, makeProjector} from '../lib/camera';
import {C} from '../lib/palette';
import {Figure} from '../rig/Figure';
import {Sack} from '../rig/Sack';
import {Step} from '../rig/gait';
import {walkPose} from '../rig/poses';
import {Doorway} from '../env/Doorway';

const steps = T.steps.s3 as Step[];
const B = T.s3;

export const doorOpen = (f: number) => kf(f, [B.doorStart, B.doorEnd - 3], [0, 1]);

/** SHOT 3 - The doorway: over the shoulder, he settles, knocks twice, waits; the door opens. */
export const Shot3: React.FC = () => {
  const f = useCurrentFrame();
  const proj = makeProjector({pos: v3(-0.95, 1.7, 0.0), target: v3(0.42, 1.22, 1.85), f: 1380, cx: W / 2 - 10, cy: H / 2 + 120});
  const {pose, sack} = walkPose(steps, f);
  // a quiet breath once he is still
  const still = ramp(f, 40, 60);
  pose.pelvis = add(pose.pelvis, v3(0, 0.004 * Math.sin(f * 0.07) * still, 0));

  // knocking hand: rise, two gentle knocks, lower
  const pre = v3(0.2, 1.37, 1.74);
  const hit = v3(0.2, 1.37, 1.818);
  const knock = kf3(f, [B.raiseStart, B.knock1 - 3, B.knock1, B.knock1 + 6, B.knock2 - 3, B.knock2, B.knock2 + 6, B.lowerStart],
    [v3(0.12, 1.1, 1.5), pre, hit, pre, pre, hit, pre, pre]);
  const wIn = ramp(f, B.raiseStart, B.knock1 - 4);
  const wOut = 1 - ramp(f, B.lowerStart, B.lowerEnd);
  const w = Math.min(wIn, wOut);
  pose.handL = lerp3(pose.handL, knock, w);
  pose.gripL = 0.35 + 0.6 * w;
  pose.poleL = add(mul(UP, -1), v3(-0.7, 0, -0.3));
  pose.lean += 0.03 * w;
  pose.headPitch = 0.08 - 0.06 * still;
  pose.yaw = 0.12 * still;

  const open = doorOpen(f);
  return (
    <AbsoluteFill style={{background: C.night}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Doorway
          proj={proj}
          frame={f}
          open={open}
          caregiver={{pos: v3(0.7, 0, 2.15), tension: 1, visible: 1}}
          child={{pos: v3(0.93, 0, 2.4), step: 0, visible: 1}}
        />
        <Figure
          id="s3"
          proj={proj}
          pose={pose}
          light={{moonFrom: -1, warm: open * 0.9, warmFrom: 1, exposure: 0.75}}
          extras={[{depth: proj.project(sack.bottom).d, node: <Sack key="sk" id="s3sk" proj={proj} neck={sack.neck} bottom={sack.bottom} warm={open} />}]}
        />
      </svg>
    </AbsoluteFill>
  );
};
