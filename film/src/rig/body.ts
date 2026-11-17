import {V3, add, clamp, cross, dot, len, mul, norm, sub, v3, UP} from '../lib/math';
import {ANKLE_H, TOE} from './gait';

/** Body proportions in metres. Shared by every shot so scale never drifts. */
export const DIM = {
  hipW: 0.1,
  thigh: 0.46,
  shin: 0.45,
  torso: 0.5,
  shoulderW: 0.19,
  upper: 0.29,
  fore: 0.26,
  hand: 0.095,
  headR: 0.108,
  neck: 0.15,
};

export type Pose = {
  pelvis: V3;
  yaw: number;
  roll: number;
  lean: number;
  side: number;
  shoulderRoll: number;
  headPitch: number;
  headTurn: number;
  ankleL: V3;
  ankleR: V3;
  pitchL: number;
  pitchR: number;
  handL: V3;
  handR: V3;
  poleL?: V3;
  poleR?: V3;
  /** 0 open hand .. 1 closed grip */
  gripL: number;
  gripR: number;
  /** trailing offset of the robe hem (cloth lag), metres */
  cloth: V3;
  wind: number;
  frame: number;
};

/** Two-bone IK: returns the middle joint. */
export const ik = (a: V3, c: V3, l1: number, l2: number, pole: V3): V3 => {
  const ac = sub(c, a);
  let d = len(ac);
  d = clamp(d, Math.abs(l1 - l2) + 1e-3, (l1 + l2) * 0.9995);
  const u = norm(ac);
  const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  let p = sub(pole, mul(u, dot(pole, u)));
  if (len(p) < 1e-5) p = cross(u, v3(1, 0, 0));
  p = norm(p);
  return add(add(a, mul(u, x)), mul(p, h));
};

/** Clamp an end effector to the limb's reach so limbs never stretch. */
const reach = (a: V3, c: V3, max: number) => {
  const d = sub(c, a);
  const l = len(d);
  return l > max ? add(a, mul(d, max / l)) : c;
};

export type Joints = ReturnType<typeof solve>;

export const solve = (p: Pose) => {
  const F = v3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
  const R = v3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
  const hipL = add(add(p.pelvis, mul(R, -DIM.hipW)), v3(0, -p.roll * DIM.hipW, 0));
  const hipR = add(add(p.pelvis, mul(R, DIM.hipW)), v3(0, p.roll * DIM.hipW, 0));
  const spine = norm(add(add(mul(UP, Math.cos(p.lean)), mul(F, Math.sin(p.lean))), mul(R, p.side)));
  const neck = add(p.pelvis, mul(spine, DIM.torso));
  const shL = add(add(neck, mul(R, -DIM.shoulderW)), add(mul(spine, -0.035), v3(0, -p.shoulderRoll * DIM.shoulderW, 0)));
  const shR = add(add(neck, mul(R, DIM.shoulderW)), add(mul(spine, -0.035), v3(0, p.shoulderRoll * DIM.shoulderW, 0)));
  const headDir = norm(add(mul(spine, Math.cos(p.headPitch)), add(mul(F, Math.sin(p.headPitch)), mul(R, p.headTurn))));
  const head = add(neck, mul(headDir, DIM.neck));

  const legLen = DIM.thigh + DIM.shin;
  const ankL = reach(hipL, p.ankleL, legLen * 0.999);
  const ankR = reach(hipR, p.ankleR, legLen * 0.999);
  const kneeL = ik(hipL, ankL, DIM.thigh, DIM.shin, add(F, mul(R, -0.12)));
  const kneeR = ik(hipR, ankR, DIM.thigh, DIM.shin, add(F, mul(R, 0.12)));

  const armLen = DIM.upper + DIM.fore;
  const wrL = reach(shL, p.handL, armLen * 0.999);
  const wrR = reach(shR, p.handR, armLen * 0.999);
  const elL = ik(shL, wrL, DIM.upper, DIM.fore, p.poleL ?? add(mul(F, -0.5), add(mul(UP, -0.8), mul(R, -0.45))));
  const elR = ik(shR, wrR, DIM.upper, DIM.fore, p.poleR ?? add(mul(F, -0.5), add(mul(UP, -0.8), mul(R, 0.45))));

  const foot = (ank: V3, pitch: number) => {
    const fd = norm(add(mul(F, Math.cos(pitch)), mul(UP, -Math.sin(pitch))));
    const fu = norm(add(mul(F, Math.sin(pitch)), mul(UP, Math.cos(pitch))));
    return {
      heel: add(ank, add(mul(fd, -0.065), mul(fu, -ANKLE_H))),
      toe: add(ank, add(mul(fd, TOE + 0.02), mul(fu, -ANKLE_H + 0.012))),
      ball: add(ank, add(mul(fd, TOE - 0.03), mul(fu, -ANKLE_H))),
      top: add(ank, mul(fd, 0.07)),
    };
  };

  return {
    F, R, spine, headDir,
    pelvis: p.pelvis, neck, head,
    hipL, hipR, kneeL, kneeR, ankL, ankR,
    footL: foot(ankL, p.pitchL),
    footR: foot(ankR, p.pitchR),
    shL, shR, elL, elR, wrL, wrR,
  };
};
