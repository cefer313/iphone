import {Easing, interpolate} from 'remotion';

export type V2 = {x: number; y: number};
export type V3 = {x: number; y: number; z: number};

export const v3 = (x: number, y: number, z: number): V3 => ({x, y, z});
export const add = (a: V3, b: V3): V3 => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z});
export const sub = (a: V3, b: V3): V3 => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
export const mul = (a: V3, s: number): V3 => ({x: a.x * s, y: a.y * s, z: a.z * s});
export const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: V3, b: V3): V3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
export const len = (a: V3) => Math.sqrt(dot(a, a));
export const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return mul(a, 1 / l);
};
export const lerp3 = (a: V3, b: V3, t: number): V3 => add(a, mul(sub(b, a), t));
export const UP: V3 = {x: 0, y: 1, z: 0};

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};
/** Smoother (C2) step: gentle starts and stops for human motion, no overshoot. */
export const smoother = (t: number) => {
  const c = clamp(t);
  return c * c * c * (c * (c * 6 - 15) + 10);
};
export const ramp = (f: number, a: number, b: number) => smoother((f - a) / (b - a));

const EASE = Easing.bezier(0.45, 0, 0.25, 1);

/** Keyframed scalar with eased segments; values hold outside the range. */
export const kf = (f: number, frames: number[], values: number[], easing = EASE) =>
  interpolate(f, frames, values, {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** Keyframed 3D point. */
export const kf3 = (f: number, frames: number[], pts: V3[], easing = EASE): V3 => ({
  x: kf(f, frames, pts.map((p) => p.x), easing),
  y: kf(f, frames, pts.map((p) => p.y), easing),
  z: kf(f, frames, pts.map((p) => p.z), easing),
});

/** Critically damped follow of a keyed signal: lag without bounce. */
export const lagged = (fn: (f: number) => number, f: number, tau: number, taps = 18) => {
  let acc = 0;
  let wsum = 0;
  for (let i = 0; i < taps; i++) {
    const w = (i / tau) * Math.exp(-i / tau) + (i === 0 ? 0.0001 : 0);
    acc += fn(f - i) * w;
    wsum += w;
  }
  return acc / wsum;
};

/** Deterministic PRNG (mulberry32). */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Smooth deterministic value noise in 1D (for wind and flame flicker). */
export const noise1 = (x: number, seed = 1) => {
  const i = Math.floor(x);
  const fr = x - i;
  const h = (n: number) => {
    const s = Math.sin((n + seed * 101.7) * 127.1) * 43758.5453;
    return s - Math.floor(s);
  };
  const u = fr * fr * (3 - 2 * fr);
  return lerp(h(i), h(i + 1), u) * 2 - 1;
};

export const pts = (p: V2[]) => p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');

/** Closed Catmull-Rom spline through points, as an SVG path. */
export const spline = (p: V2[], closed = true, tension = 0.5) => {
  if (p.length < 2) return '';
  const n = p.length;
  const get = (i: number) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1 = {x: p1.x + ((p2.x - p0.x) * tension) / 3, y: p1.y + ((p2.y - p0.y) * tension) / 3};
    const c2 = {x: p2.x - ((p3.x - p1.x) * tension) / 3, y: p2.y - ((p3.y - p1.y) * tension) / 3};
    d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return closed ? d + 'Z' : d;
};

/** 2D convex hull (monotone chain). */
export const hull = (input: V2[]): V2[] => {
  const p = [...input].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  if (p.length < 3) return p;
  const c = (o: V2, a: V2, b: V2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: V2[] = [];
  for (const q of p) {
    while (lower.length >= 2 && c(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: V2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && c(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
};
