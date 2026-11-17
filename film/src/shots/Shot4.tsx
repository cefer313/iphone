import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import T from '../data/timeline.json';
import {V3, add, kf, kf3, mul, ramp, v3, UP, lagged} from '../lib/math';
import {H, W, makeProjector} from '../lib/camera';
import {C} from '../lib/palette';
import {Figure} from '../rig/Figure';
import {Sack} from '../rig/Sack';
import {solve, Pose} from '../rig/body';
import {basePose} from '../rig/poses';
import {Doorway} from '../env/Doorway';

const B = T.s4;
const SACK_LEN = 0.42;
const MAT_Y = 0.008;

/** Kneeling pose, keyed as world-space targets (IK resolves the joints). */
export const shot4Pose = (f: number): Pose => {
  const p = basePose(v3(0.35, 0.945, 0.8), f);
  const K = [0, 24, 50, 74, 104, 140, 209];
  p.pelvis = kf3(f, K, [v3(0.35, 0.945, 0.8), v3(0.35, 0.9, 0.82), v3(0.36, 0.66, 0.85), v3(0.36, 0.5, 0.87),
    v3(0.37, 0.47, 0.9), v3(0.37, 0.48, 0.89), v3(0.36, 0.5, 0.87)]);
  p.lean = kf(f, [0, 30, 74, 104, 124, 150, 209], [0.05, 0.22, 0.48, 0.78, 0.66, 0.7, 0.42]);
  p.headPitch = kf(f, [0, 60, 110, 209], [0.1, 0.3, 0.38, 0.3]);
  // right foot steps a little forward, then the left knee lowers to the ground
  const r0 = v3(0.45, 0.075, 0.8), r1 = v3(0.47, 0.075, 1.1);
  const rs = ramp(f, 8, 30);
  p.ankleR = add(v3(r0.x + (r1.x - r0.x) * rs, 0.075, r0.z + (r1.z - r0.z) * rs), v3(0, 0.055 * Math.sin(Math.PI * rs), 0));
  p.pitchR = 0.25 * Math.sin(Math.PI * rs);
  p.ankleL = kf3(f, [18, 44, 74], [v3(0.25, 0.075, 0.8), v3(0.25, 0.1, 0.62), v3(0.25, 0.1, 0.5)]);
  p.pitchL = kf(f, [18, 50, 74], [0, 0.8, 1.2]);
  p.roll = kf(f, [0, 30, 74], [0, 0.03, 0]);

  // hands: sack held in front, lowered, released, the top opened, then rest
  const hold = (y: number, z: number) => v3(0.43, y, z);
  p.handR = kf3(f, [0, 40, 74, B.contact, B.release, B.openStart, B.openEnd, 190, 209],
    [hold(1.2, 1.05), hold(1.02, 1.1), hold(0.74, 1.2), hold(0.45, 1.32), hold(0.43, 1.32), v3(0.47, 0.46, 1.34),
      v3(0.53, 0.45, 1.35), v3(0.52, 0.5, 1.24), v3(0.5, 0.52, 1.16)]);
  // left hand steadies the sack's side, then rests on the left thigh
  p.handL = kf3(f, [0, 40, 74, B.contact, B.release + 10, 150, 209],
    [v3(0.3, 0.96, 1.05), v3(0.3, 0.8, 1.1), v3(0.31, 0.53, 1.2), v3(0.31, 0.24, 1.29), v3(0.24, 0.42, 1.08),
      v3(0.22, 0.46, 1.0), v3(0.22, 0.47, 0.99)]);
  p.gripR = kf(f, [0, B.contact, B.release, B.openStart, B.openEnd, 209], [0.95, 0.95, 0.15, 0.5, 0.45, 0.3]);
  p.gripL = kf(f, [0, B.contact, B.release + 6, B.openStart, 209], [0.15, 0.15, 0.3, 0.5, 0.3]);
  p.poleR = add(mul(UP, -1), v3(0.9, 0, -0.3));
  p.poleL = add(mul(UP, -1), v3(-0.9, 0, -0.3));
  p.cloth = v3(0, 0, -0.04 * ramp(f, 30, 74));
  p.wind = 0.6;
  return p;
};

/** Sack follows the actual wrist while held; after release it rests where it was put down. */
export const sackAt = (f: number): {neck: V3; bottom: V3; squash: number} => {
  const g = (t: number) => {
    const J = solve(shot4Pose(t));
    return add(J.wrR, v3(0.0, -0.045, 0.03));
  };
  const t = Math.min(f, B.release);
  const neck = g(t);
  const swayX = lagged((q) => g(Math.min(q, B.release)).x, t, 5, 12) - neck.x;
  const swayZ = lagged((q) => g(Math.min(q, B.release)).z, t, 5, 12) - neck.z;
  const free = v3(neck.x + swayX * 0.8, neck.y - SACK_LEN, neck.z + swayZ * 0.8);
  const bottomY = Math.max(MAT_Y, free.y);
  const squash = Math.max(0, Math.min(1, (MAT_Y - free.y) / 0.03));
  return {neck: v3(neck.x, Math.max(neck.y, MAT_Y + SACK_LEN * 0.9), neck.z), bottom: v3(free.x, bottomY, free.z), squash};
};

/** SHOT 4 - The act of service: low side-rear. He kneels and sets the sack on the mat. */
export const Shot4: React.FC = () => {
  const f = useCurrentFrame();
  const proj = makeProjector({pos: v3(-1.75, 0.98, -0.85), target: v3(0.5, 0.62, 1.5), f: 1900, cx: W / 2 + 40, cy: H / 2 + 300});
  const pose = shot4Pose(f);
  const sk = sackAt(f);
  const open = kf(f, [B.openStart, B.openEnd], [0, 1]);
  const childStep = kf(f, [B.childStepStart, B.childStepEnd], [0, 1]);
  const childPos = v3(0.4 + 0.02 * childStep, 0, 2.3 - 0.24 * childStep);
  const tension = kf(f, [B.softenStart, B.softenEnd], [1, 0]);
  return (
    <AbsoluteFill style={{background: C.night}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Doorway proj={proj} frame={f + 390} open={1} mat
          caregiver={{pos: v3(0.64, 0, 2.0), tension, visible: 1}}
          child={{pos: childPos, step: childStep, visible: 1}} />
        <Figure
          id="s4"
          proj={proj}
          pose={pose}
          light={{moonFrom: -1, warm: 0.85, warmFrom: -1, exposure: 0.75}}
          extras={[{
            depth: proj.project(sk.bottom).d,
            node: <Sack key="sk" id="s4sk" proj={proj} neck={sk.neck} bottom={sk.bottom} squash={sk.squash} open={open} warm={0.8} />,
          }]}
        />
      </svg>
    </AbsoluteFill>
  );
};
