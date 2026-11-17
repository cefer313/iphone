import React from 'react';
import {staticFile} from 'remotion';
import {V2, V3, add, lerp, rng, spline, v3} from '../lib/math';
import {Projector} from '../lib/camera';
import {C} from '../lib/palette';
import {ring} from './draw';

type Props = {
  id: string;
  proj: Projector;
  neck: V3;
  bottom: V3;
  /** 0..1 compression when resting on a surface */
  squash?: number;
  /** 0..1 how far the gathered top is opened */
  open?: number;
  moonFrom?: number;
  warm?: number;
};

/** Flatbread disc in screen space. */
export const Flatbread: React.FC<{cx: number; cy: number; rx: number; ry: number; seed?: number; rot?: number}> = ({
  cx, cy, rx, ry, seed = 3, rot = 0,
}) => {
  const r = rng(seed);
  const spots = Array.from({length: 14}, () => ({a: r() * Math.PI * 2, d: Math.sqrt(r()) * 0.78, s: 0.05 + r() * 0.07}));
  return (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
      <ellipse cx={cx} cy={cy + ry * 0.12} rx={rx} ry={ry} fill={C.breadDark} />
      <ellipse cx={cx} cy={cy} rx={rx * 0.98} ry={ry * 0.95} fill={C.bread} />
      <ellipse cx={cx - rx * 0.12} cy={cy - ry * 0.12} rx={rx * 0.7} ry={ry * 0.62} fill={C.breadLight} opacity={0.45} />
      {spots.map((s, i) => (
        <ellipse key={i} cx={cx + Math.cos(s.a) * s.d * rx} cy={cy + Math.sin(s.a) * s.d * ry}
          rx={s.s * rx} ry={s.s * ry * 0.8} fill={C.breadDark} opacity={0.55} />
      ))}
    </g>
  );
};

export const Sack: React.FC<Props> = ({id, proj, neck, bottom, squash = 0, open = 0, moonFrom = -1, warm = 0}) => {
  const N = proj.project(neck);
  const B = proj.project(bottom);
  const mid = proj.project(add(neck, {x: (bottom.x - neck.x) / 2, y: (bottom.y - neck.y) / 2, z: (bottom.z - neck.z) / 2}));
  const s = mid.s;
  const ax = B.x - N.x, ay = B.y - N.y;
  const L = Math.hypot(ax, ay) || 1;
  const ux = ax / L, uy = ay / L;
  const nx = -uy, ny = ux;
  const widen = 1 + 0.07 * squash;
  const shorten = 1 - 0.06 * squash;
  const at = (t: number, w: number): V2 => ({
    x: N.x + ux * L * t * shorten + nx * w * s * widen,
    y: N.y + uy * L * t * shorten + ny * w * s * widen,
  });
  const neckW = lerp(0.03, 0.085, open);
  const prof: [number, number][] = [
    [0.0, neckW], [0.1, lerp(0.04, 0.1, open)], [0.26, 0.11], [0.5, 0.14], [0.74, 0.145], [0.9, 0.12], [1.0, 0.06],
  ];
  const left = prof.map(([t, w]) => at(t, -w));
  const right = prof.map(([t, w]) => at(t, w)).reverse();
  const outline = [...left, at(1.02, 0), ...right];
  const d = spline(outline, true, 0.45);
  const fold = (t0: number, w0: number, t1: number, w1: number, bend: number) => {
    const a = at(t0, w0), b = at(t1, w1), c = at((t0 + t1) / 2, (w0 + w1) / 2 + bend);
    return `M${a.x},${a.y} Q${c.x},${c.y} ${b.x},${b.y}`;
  };
  const tie = [at(0.11, -0.05 - open * 0.05), at(0.13, 0), at(0.11, 0.05 + open * 0.05)];
  const lit = moonFrom < 0 ? 0 : 1;
  // gathered tuft above the tie (closed) or opened rim showing bread (open)
  const tuft = [at(0.0, -0.03), at(-0.07, -0.055), at(-0.11, -0.02), at(-0.1, 0.03), at(-0.06, 0.055), at(0.0, 0.03)];
  const rimPts = ring(v3(neck.x, neck.y + 0.005, neck.z), v3(1, 0, 0), v3(0, 0, 1), 0.075 + 0.02 * open, 0.075 + 0.02 * open, 20).map(proj.project);
  const rc = proj.project(neck);
  const rxR = (Math.max(...rimPts.map((p) => p.x)) - Math.min(...rimPts.map((p) => p.x))) / 2;
  const ryR = (Math.max(...rimPts.map((p) => p.y)) - Math.min(...rimPts.map((p) => p.y))) / 2;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={N.x + nx * 0.2 * s} y1={N.y + ny * 0.2 * s} x2={N.x - nx * 0.2 * s} y2={N.y - ny * 0.2 * s}>
          <stop offset={lit} stopColor={C.sackLit} />
          <stop offset={0.5} stopColor={C.sack} />
          <stop offset={1 - lit} stopColor={C.sackShade} />
        </linearGradient>
        <pattern id={`${id}-p`} patternUnits="userSpaceOnUse" width={256} height={256} patternTransform={`scale(${(s / 1100).toFixed(4)})`}>
          <image href={staticFile('tex/burlap.png')} width={256} height={256} />
        </pattern>
      </defs>
      {open < 0.05 && <path d={spline(tuft, true, 0.5)} fill={C.sack} stroke={C.sackShade} strokeWidth={0.004 * s} />}
      <path d={d} fill={`url(#${id}-g)`} />
      <path d={d} fill={`url(#${id}-p)`} opacity={0.35} style={{mixBlendMode: 'multiply'}} />
      <g fill="none" stroke={C.sackShade} strokeWidth={0.008 * s} strokeLinecap="round" opacity={0.55}>
        <path d={fold(0.12, -0.03, 0.55, -0.12, -0.02)} />
        <path d={fold(0.12, 0.02, 0.62, 0.08, 0.03)} />
        <path d={fold(0.14, 0.0, 0.45, 0.01, 0.015)} />
        <path d={fold(0.7, -0.15, 0.95, -0.06, 0.03)} />
      </g>
      <path d={spline(outline, true, 0.45)} fill="none" stroke={C.sackShade} strokeWidth={0.006 * s} opacity={0.5} />
      {open < 0.6 && (
        <polyline points={tie.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={C.cord}
          strokeWidth={0.013 * s} strokeLinecap="round" opacity={1 - open} />
      )}
      {open > 0.02 && (
        <g opacity={Math.min(1, open * 2)}>
          <ellipse cx={rc.x} cy={rc.y} rx={rxR} ry={ryR} fill={C.sackShade} />
          <ellipse cx={rc.x} cy={rc.y + ryR * 0.12} rx={rxR * 0.86} ry={ryR * 0.78} fill="#2a2016" />
          <g opacity={open}>
            <Flatbread cx={rc.x} cy={rc.y + ryR * 0.08} rx={rxR * 0.74} ry={ryR * 0.62} seed={11} />
            <Flatbread cx={rc.x + rxR * 0.12} cy={rc.y - ryR * 0.08} rx={rxR * 0.62} ry={ryR * 0.5} seed={4} rot={8} />
          </g>
          <ellipse cx={rc.x} cy={rc.y} rx={rxR} ry={ryR} fill="none" stroke={C.sack} strokeWidth={0.02 * s} />
        </g>
      )}
      {warm > 0.01 && (
        <path d={d} fill="none" stroke={C.amber} strokeWidth={0.01 * s} opacity={warm * 0.5} />
      )}
    </g>
  );
};
