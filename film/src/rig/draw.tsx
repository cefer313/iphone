import React from 'react';
import {V2, V3, add, mul, v3} from '../lib/math';
import {P, Projector} from '../lib/camera';

/** Tapered capsule between two projected joints (a limb segment). */
export const Capsule: React.FC<{a: P; b: P; ra: number; rb: number; fill: string; opacity?: number}> = ({
  a, b, ra, rb, fill, opacity = 1,
}) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  const d = `M${a.x + nx * ra},${a.y + ny * ra} L${b.x + nx * rb},${b.y + ny * rb} L${b.x - nx * rb},${b.y - ny * rb} L${a.x - nx * ra},${a.y - ny * ra}Z`;
  return (
    <g fill={fill} opacity={opacity}>
      <path d={d} />
      <circle cx={a.x} cy={a.y} r={ra} />
      <circle cx={b.x} cy={b.y} r={rb} />
    </g>
  );
};

/** Ring of world points (an ellipse in the plane spanned by u and w). */
export const ring = (c: V3, u: V3, w: V3, ru: number, rw: number, n = 16, wob?: (i: number) => number): V3[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = wob ? wob(i) : 1;
    return add(c, add(mul(u, Math.cos(a) * ru * k), mul(w, Math.sin(a) * rw * k)));
  });

/** Ground-plane soft shadow under a point (projected circle). */
export const GroundShadow: React.FC<{proj: Projector; c: V3; r: number; rz?: number; opacity: number; id: string}> = ({
  proj, c, r, rz, opacity, id,
}) => {
  const pts = ring(v3(c.x, 0.002, c.z), v3(1, 0, 0), v3(0, 0, 1), r, rz ?? r, 24).map(proj.project);
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#05060a" stopOpacity={opacity} />
          <stop offset="0.6" stopColor="#05060a" stopOpacity={opacity * 0.55} />
          <stop offset="1" stopColor="#05060a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <polygon points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill={`url(#${id})`} data-c={`${cx},${cy}`} />
    </g>
  );
};

export const toPts = (p: V2[]) => p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
