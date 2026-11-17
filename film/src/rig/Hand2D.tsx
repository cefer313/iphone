import React from 'react';
import {lerp} from '../lib/math';

export type Seg = {len: number; w: number};
export type Finger = {base: {x: number; y: number}; dir: number; segs: Seg[]; curl: number[]};

/** One articulated finger: each segment rotates about its own knuckle. Angles in degrees. */
export const fingerJoints = (f: Finger) => {
  const pts = [f.base];
  let a = f.dir;
  f.segs.forEach((s, i) => {
    a += f.curl[i] ?? 0;
    const p = pts[pts.length - 1];
    const r = (a * Math.PI) / 180;
    pts.push({x: p.x + Math.cos(r) * s.len, y: p.y + Math.sin(r) * s.len});
  });
  return pts;
};

export const FingerShape: React.FC<{f: Finger; fill: string; shade: string; crease?: number}> = ({f, fill, shade, crease = 0.5}) => {
  const p = fingerJoints(f);
  return (
    <g>
      {f.segs.map((s, i) => {
        const a = p[i], b = p[i + 1];
        const w0 = s.w, w1 = f.segs[i + 1]?.w ?? s.w * 0.85;
        const dx = b.x - a.x, dy = b.y - a.y;
        const l = Math.hypot(dx, dy) || 1;
        const nx = -dy / l, ny = dx / l;
        return (
          <g key={i}>
            <path d={`M${a.x + (nx * w0) / 2},${a.y + (ny * w0) / 2} L${b.x + (nx * w1) / 2},${b.y + (ny * w1) / 2} L${b.x - (nx * w1) / 2},${b.y - (ny * w1) / 2} L${a.x - (nx * w0) / 2},${a.y - (ny * w0) / 2}Z`} fill={fill} />
            <circle cx={a.x} cy={a.y} r={w0 / 2} fill={fill} />
            <circle cx={b.x} cy={b.y} r={w1 / 2} fill={fill} />
            {i > 0 && <path d={`M${a.x + (nx * w0) / 2.6},${a.y + (ny * w0) / 2.6} L${a.x - (nx * w0) / 2.6},${a.y - (ny * w0) / 2.6}`} stroke={shade} strokeWidth={1.4} opacity={crease} strokeLinecap="round" />}
          </g>
        );
      })}
    </g>
  );
};

export const mixN = (a: number, b: number, t: number) => lerp(a, b, t);
