import {V3, add, mul, sub, v3, UP, lagged} from '../lib/math';
import {Step, gaitAt} from './gait';
import {Pose, solve} from './body';

export const STRIDE = 1.04;

/** Base pose: standing still, both hands relaxed. */
export const basePose = (pelvis: V3, frame: number): Pose => ({
  pelvis, yaw: 0, roll: 0, lean: 0.03, side: 0, shoulderRoll: 0, headPitch: 0.08, headTurn: 0,
  ankleL: v3(pelvis.x - 0.1, 0.075, pelvis.z), ankleR: v3(pelvis.x + 0.1, 0.075, pelvis.z),
  pitchL: 0, pitchR: 0,
  handL: v3(pelvis.x - 0.23, pelvis.y - 0.02, pelvis.z + 0.02),
  handR: v3(pelvis.x + 0.23, pelvis.y - 0.02, pelvis.z + 0.02),
  gripL: 0.35, gripR: 0.35, cloth: v3(0, 0, 0), wind: 1, frame,
});

/** The sack carried over the right shoulder, gathered neck held in the right hand. */
export const sackOnShoulder = (p: Pose, frame: number, sway: V3) => {
  const J = solve(p);
  const hand = add(J.shR, add(mul(UP, 0.045), add(mul(J.F, 0.09), mul(J.R, -0.03))));
  const neck = add(hand, add(mul(UP, 0.01), mul(J.F, -0.05)));
  const rest = add(J.shR, add(mul(J.F, -0.17), add(mul(UP, -0.34), mul(J.R, -0.08))));
  const bottom = add(rest, sway);
  return {hand, neck, bottom, pole: add(mul(UP, -1), add(mul(J.R, 0.6), mul(J.F, -0.2)))};
};

/** Full walking pose from the planted-foot gait. */
export const walkPose = (steps: Step[], f: number, opts: {standY?: number; emptyHanded?: boolean} = {}) => {
  const g = gaitAt(steps, f, STRIDE, opts.standY);
  const lagP = (k: 'x' | 'z') => lagged((t) => gaitAt(steps, t, STRIDE, opts.standY).pelvis[k], f, 4, 14);
  const cloth = v3((lagP('x') - g.pelvis.x) * 0.9, 0, (lagP('z') - g.pelvis.z) * 0.5);
  const p = basePose(g.pelvis, f);
  p.roll = g.roll;
  p.lean = 0.03 + 0.03 * g.moving;
  p.shoulderRoll = -g.roll * 0.55 - 0.012;
  p.ankleL = g.feet.L.ankle;
  p.ankleR = g.feet.R.ankle;
  p.pitchL = g.feet.L.pitch;
  p.pitchR = g.feet.R.pitch;
  p.cloth = cloth;
  // free (left) arm swings opposite to the left leg
  const J = solve(p);
  p.handL = add(J.shL, add(mul(UP, -0.52), add(mul(J.F, 0.1 * g.armSwing + 0.03), mul(J.R, -0.03))));
  // sack sways, trailing the body's lateral and forward motion
  const sway = v3(cloth.x * 1.4, 0.006 * Math.sin((f / 20) * Math.PI), cloth.z * 0.6 - 0.01 * g.moving);
  const sack = sackOnShoulder(p, f, sway);
  if (opts.emptyHanded) {
    p.handR = add(J.shR, add(mul(UP, -0.52), add(mul(J.F, -0.1 * g.armSwing + 0.03), mul(J.R, 0.03))));
    p.gripR = 0.35;
    return {pose: p, sack, gait: g};
  }
  p.handR = sack.hand;
  p.poleR = sack.pole;
  p.gripR = 0.9;
  return {pose: p, sack, gait: g};
};

export const dist = (a: V3, b: V3) => Math.hypot(...Object.values(sub(a, b)));
