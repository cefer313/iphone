import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import T from '../data/timeline.json';
import {lerp, ramp, v3} from '../lib/math';
import {H, W, makeProjector} from '../lib/camera';
import {C} from '../lib/palette';
import {Figure} from '../rig/Figure';
import {Sack} from '../rig/Sack';
import {GroundShadow} from '../rig/draw';
import {Step} from '../rig/gait';
import {walkPose} from '../rig/poses';
import {Poly, Street} from '../env/World';

const steps = T.steps.s1 as Step[];

/** SHOT 1 - The quiet street: rear view, walking away, three depth layers. */
export const Shot1: React.FC = () => {
  const f = useCurrentFrame();
  const push = ramp(f, 0, 119) * 0.22;
  const proj = makeProjector({
    pos: v3(-0.55, 1.45, -0.55 + push),
    target: v3(0.15, 1.0, 9),
    f: 1250, cx: W / 2, cy: H / 2,
  });
  const {pose, sack} = walkPose(steps, f);
  const sackDepth = proj.project(sack.bottom).d;
  return (
    <AbsoluteFill style={{background: C.night}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Street proj={proj} frame={f} />
        <GroundShadow proj={proj} c={pose.pelvis} r={0.34} rz={0.26} opacity={0.5} id="s1sh" />
        <Figure
          id="s1"
          proj={proj}
          pose={pose}
          light={{moonFrom: -1, warm: 0, warmFrom: -1, exposure: 0.8}}
          extras={[{depth: sackDepth, node: <Sack key="sack" id="s1sk" proj={proj} neck={sack.neck} bottom={sack.bottom} />}]}
        />
        {/* foreground layer: the corner of a near house, in moon shadow */}
        <Poly proj={proj} pts={[v3(-1.0, 0, 0.9), v3(-1.0, 3.2, 0.9), v3(-1.0, 3.2, 1.6), v3(-1.0, 0, 1.6)]} fill="#191c28" tex="plaster" id="fg1" texOpacity={0.5} />
        <Poly proj={proj} pts={[v3(-1.7, 0, 0.9), v3(-1.7, 3.2, 0.9), v3(-1.0, 3.2, 0.9), v3(-1.0, 0, 0.9)]} fill="#11131c" tex="plaster" id="fg2" texOpacity={0.45} />
        <Poly proj={proj} pts={[v3(-1.01, 0, 0.9), v3(-1.01, 3.2, 0.9), v3(-0.99, 3.2, 0.9), v3(-0.99, 0, 0.9)]} fill="#59627e" opacity={0.5} />
      </svg>
    </AbsoluteFill>
  );
};
export const shot1Light = lerp;
