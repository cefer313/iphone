import {V3, clamp, lerp, smooth, smoother, v3} from '../lib/math';

export type Step = {foot: 'L' | 'R'; lift: number; land: number; x: number; z: number; fromZ?: number};
export type FootState = {ankle: V3; pitch: number; swing: number};
export type GaitState = {
  pelvis: V3;
  roll: number;
  feet: {L: FootState; R: FootState};
  armSwing: number; // >0: left arm forward
  moving: number; // 0..1 how much the body is in a walking rhythm
};

export const ANKLE_H = 0.075;
export const TOE = 0.17;
const HEEL_OFF = 9; // frames the heel peels before lift-off
const HEEL_PITCH = 0.5;
const LIFT = 0.065;

/** Ankle pose while the heel peels off, pivoting about the planted toe. */
const heelOff = (x: number, z: number, p: number): V3 => {
  // vector toe -> ankle is (0, h, -TOE); rotate about the lateral axis
  const y = ANKLE_H * Math.cos(p) + TOE * Math.sin(p);
  const dz = ANKLE_H * Math.sin(p) - TOE * Math.cos(p);
  return v3(x, y, z + TOE + dz);
};

const footAt = (steps: Step[], foot: 'L' | 'R', f: number, stride: number): FootState => {
  const mine = steps.filter((s) => s.foot === foot).sort((a, b) => a.land - b.land);
  const first = mine[0];
  // where this foot stood before its first listed step
  let px = first.x;
  let pz = first.fromZ ?? first.z - stride;
  for (let i = 0; i < mine.length; i++) {
    const s = mine[i];
    if (f < s.lift - HEEL_OFF) break;
    if (f < s.lift) {
      const p = HEEL_PITCH * smooth((f - (s.lift - HEEL_OFF)) / HEEL_OFF);
      return {ankle: heelOff(px, pz, p), pitch: p, swing: 0};
    }
    if (f < s.land) {
      const t = (f - s.lift) / (s.land - s.lift);
      const a0 = heelOff(px, pz, HEEL_PITCH);
      const e = smoother(t);
      const ankle = v3(
        lerp(a0.x, s.x, e),
        lerp(a0.y, ANKLE_H, smooth(t)) + LIFT * Math.sin(Math.PI * t) * (1 - 0.25 * t),
        lerp(a0.z, s.z, e),
      );
      const pitch =
        t < 0.78 ? lerp(HEEL_PITCH, -0.24, smooth(t / 0.78)) : lerp(-0.24, 0, smooth((t - 0.78) / 0.22));
      return {ankle, pitch, swing: Math.sin(Math.PI * t)};
    }
    px = s.x;
    pz = s.z;
  }
  return {ankle: v3(px, ANKLE_H, pz), pitch: 0, swing: 0};
};

/** Cubic Hermite through (t, v) keys with Catmull-Rom tangents. */
const hermite = (keys: [number, number][], f: number) => {
  if (f <= keys[0][0]) return keys[0][1];
  const n = keys.length;
  if (f >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (keys[i + 1][0] < f) i++;
  const [t0, v0] = keys[i];
  const [t1, v1] = keys[i + 1];
  const slope = (j: number) => {
    const a = keys[Math.max(0, j - 1)];
    const b = keys[Math.min(n - 1, j + 1)];
    return b[0] === a[0] ? 0 : (b[1] - a[1]) / (b[0] - a[0]);
  };
  const h = t1 - t0;
  const u = (f - t0) / h;
  const m0 = (i === 0 ? 0 : slope(i)) * h;
  const m1 = (i + 1 === n - 1 ? 0 : slope(i + 1)) * h;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * m1;
};

export const gaitAt = (steps: Step[], f: number, stride: number, standY = 0.945): GaitState => {
  const L = footAt(steps, 'L', f, stride);
  const R = footAt(steps, 'R', f, stride);

  // Pelvis passes between the feet: key it at each landing (double support).
  const sorted = [...steps].sort((a, b) => a.land - b.land);
  const last: Record<'L' | 'R', {x: number; z: number}> = {
    L: {x: 0, z: 0},
    R: {x: 0, z: 0},
  };
  for (const ft of ['L', 'R'] as const) {
    const m = sorted.find((s) => s.foot === ft)!;
    last[ft] = {x: m.x, z: m.fromZ ?? m.z - stride};
  }
  const kz: [number, number][] = [];
  const kx: [number, number][] = [];
  const first = sorted[0];
  kz.push([first.lift - 20, (last.L.z + last.R.z) / 2 - stride / 4]);
  kx.push([first.lift - 20, (last.L.x + last.R.x) / 2]);
  for (const s of sorted) {
    last[s.foot] = {x: s.x, z: s.z};
    kz.push([s.land, (last.L.z + last.R.z) / 2]);
    kx.push([s.land, (last.L.x + last.R.x) / 2]);
  }
  const end = sorted[sorted.length - 1].land;
  kz.push([end + 16, (last.L.z + last.R.z) / 2]);
  kx.push([end + 16, (last.L.x + last.R.x) / 2]);

  const pz = hermite(kz, f);
  let px = hermite(kx, f);

  // weight shifts over the stance foot; the swing-side hip drops slightly
  const swingL = L.swing, swingR = R.swing;
  px += 0.028 * swingL * Math.sign(R.ankle.x - px || 1) + 0.028 * swingR * Math.sign(L.ankle.x - px || -1);
  const single = Math.max(swingL, swingR);
  const moving = clamp(1 - (f - end) / 16);
  const walkY = standY - 0.016 + 0.017 * single;
  const py = lerp(standY, walkY, moving);
  const roll = 0.045 * (swingL - swingR);
  const armSwing = clamp((R.ankle.z - L.ankle.z) / stride, -1, 1) * moving;
  return {pelvis: v3(px, py, pz), roll, feet: {L, R}, armSwing, moving};
};
