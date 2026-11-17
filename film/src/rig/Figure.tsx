import React from 'react';
import {staticFile} from 'remotion';
import {V2, V3, add, dot, hull, mul, norm, spline, sub, v3, UP, lerp, clamp} from '../lib/math';
import {P, Projector} from '../lib/camera';
import {C} from '../lib/palette';
import {DIM, Joints, Pose, solve} from './body';
import {Capsule, ring, toPts} from './draw';

export type Light = {
  /** screen-space direction the cool moonlight comes FROM (-1 left, 1 right) */
  moonFrom: number;
  /** amber lamp rim strength 0..1 and the side it comes from */
  warm: number;
  warmFrom: number;
  /** overall exposure multiplier for the night */
  exposure?: number;
};

export type Extra = {depth: number; node: React.ReactNode};

const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
  const [r1, g1, b1] = ch(pa), [r2, g2, b2] = ch(pb);
  const c = (x: number, y: number) => Math.round(lerp(x, y, t)).toString(16).padStart(2, '0');
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
};
export {mix};

/** Hand seen from behind/side: palm block + finger mass, curls with grip. */
const Hand: React.FC<{wr: P; el: P; s: number; grip: number; fill: string; shade: string}> = ({wr, el, s, grip, fill, shade}) => {
  const dx = wr.x - el.x, dy = wr.y - el.y;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const L = DIM.hand * s;
  const w = 0.043 * s;
  const fl = lerp(L * 0.62, L * 0.32, grip);
  return (
    <g transform={`translate(${wr.x},${wr.y}) rotate(${ang})`}>
      <rect x={-w * 0.2} y={-w * 0.55} width={L * 0.62} height={w * 1.1} rx={w * 0.5} fill={fill} />
      <rect x={L * 0.45} y={-w * 0.5} width={fl} height={w} rx={w * (0.35 + 0.15 * grip)} fill={fill} />
      <path d={`M${L * 0.5},${-w * 0.45} L${L * 0.5},${w * 0.45}`} stroke={shade} strokeWidth={Math.max(0.6, s * 0.002)} opacity={0.5 * grip} />
      <ellipse cx={L * 0.25} cy={w * 0.55} rx={L * 0.2} ry={w * 0.22} fill={shade} opacity={0.6} />
    </g>
  );
};

type Props = {
  id: string;
  proj: Projector;
  pose: Pose;
  light: Light;
  extras?: Extra[];
  /** hide feet/legs (when cropped) */
  showLegs?: boolean;
};

export const Figure: React.FC<Props> = ({id, proj, pose, light, extras = [], showLegs = true}) => {
  const J: Joints = solve(pose);
  const pr = proj.project;
  const camPos = proj.cam.pos;
  const exp = light.exposure ?? 1;
  const t = pose.frame;

  // ---------- colours under this light ----------
  const robeBase = mix(C.robeShade, C.robe, 0.55 * exp + 0.25);
  const robeLit = mix(C.robe, C.robeLit, exp);
  const robeDark = mix(C.robeShade, '#1a1612', 0.35);
  const warmRim = mix(C.amberDeep, C.amberSoft, 0.4);

  // ---------- robe as a cloth hull over body rings ----------
  const F = J.F, R = J.R;
  const chest = add(pose.pelvis, mul(J.spine, 0.28));
  const upperW: V3[] = [
    ...ring(add(J.neck, mul(J.spine, 0.015)), R, F, 0.075, 0.07, 12),
    ...ring(add(J.neck, mul(J.spine, -0.075)), R, F, 0.205, 0.11, 18),
    ...ring(chest, R, F, 0.19, 0.125, 18),
    ...ring(add(pose.pelvis, mul(J.spine, 0.06)), R, F, 0.172, 0.13, 18),
  ];
  const lowerW: V3[] = [...ring(add(pose.pelvis, mul(J.spine, 0.06)), R, F, 0.172, 0.13, 18)];
  const hemPts: V3[] = [];
  const hemFor = (knee: V3, ank: V3, side: number) => {
    const lag = (p: V3) => v3(p.x + pose.cloth.x + side * 0.02, p.y, p.z + pose.cloth.z);
    const wob = (i: number) => 1 + 0.05 * Math.sin(i * 1.7 + t * 0.09 + side) * pose.wind;
    lowerW.push(...ring(knee, R, F, 0.1, 0.1, 10));
    if (knee.y < 0.25) {
      // kneeling leg: the robe pools around the knee and over the resting shin
      const a = ring(lag(v3(knee.x, 0.02, knee.z)), R, F, 0.13, 0.12, 14, wob);
      const b = ring(lag(v3((knee.x + ank.x) / 2, 0.03, (knee.z + ank.z) / 2)), R, F, 0.1, 0.1, 10, wob);
      const c = ring(lag(v3(ank.x, 0.04, ank.z)), R, F, 0.08, 0.08, 10, wob);
      hemPts.push(...a, ...b, ...c);
      return a;
    }
    const hy = Math.max(0.02, Math.min(knee.y - 0.16, pose.pelvis.y - 0.7));
    const span = knee.y - ank.y;
    const k = span > 0.02 ? clamp((knee.y - hy) / span) : 1;
    const c0 = add(knee, mul(sub(ank, knee), k));
    const pts = ring(lag(v3(c0.x, hy, c0.z)), R, F, 0.12, 0.105, 14, wob);
    hemPts.push(...pts);
    return pts;
  };
  const hemL = hemFor(J.kneeL, J.ankL, -1);
  const hemR = hemFor(J.kneeR, J.ankR, 1);
  const upperHull = hull(upperW.map(pr));
  const lowerHull = hull([...lowerW, ...hemPts].map(pr));
  const robePath = spline(upperHull, true, 0.35) + ' ' + spline(lowerHull, true, 0.3);
  const robeHull = [...upperHull, ...lowerHull];
  const minX = Math.min(...robeHull.map((p) => p.x));
  const maxX = Math.max(...robeHull.map((p) => p.x));
  const minY = Math.min(...robeHull.map((p) => p.y));
  const maxY = Math.max(...robeHull.map((p) => p.y));
  const robeDepth = pr(chest).d;
  const sMid = pr(chest).s;

  // folds: from the waist ring down to the hem rings, trailing with the cloth
  const waist = ring(add(pose.pelvis, mul(J.spine, 0.05)), R, F, 0.19, 0.135, 12);
  const toCam = (p: V3) => norm(sub(camPos, p));
  const visible = (c: V3, p: V3) => dot(norm(sub(p, c)), toCam(p)) > -0.05;
  const wc = add(pose.pelvis, mul(J.spine, 0.05));
  const folds = waist
    .map((w, i) => ({w, i}))
    .filter(({w}) => visible(wc, w))
    .map(({w, i}) => {
      const target = i % 2 === 0 ? hemL[(i * 2) % hemL.length] : hemR[(i * 2 + 3) % hemR.length];
      const a = pr(w), b = pr(target);
      const mid = pr(add(lerp3(w, target, 0.5), mul(pose.cloth, 0.6)));
      return `M${a.x},${a.y} Q${mid.x},${mid.y} ${b.x},${b.y}`;
    });
  const sashPts = waist.filter((w) => visible(wc, w)).map(pr);

  // ---------- arms ----------
  const arm = (side: 'L' | 'R') => {
    const sh = pr(side === 'L' ? J.shL : J.shR);
    const el = pr(side === 'L' ? J.elL : J.elR);
    const wr = pr(side === 'L' ? J.wrL : J.wrR);
    const depth = (sh.d + el.d + wr.d) / 3;
    const nearSide = dot(side === 'L' ? mul(R, -1) : R, toCam(J.neck)) > 0;
    const fill = nearSide ? robeBase : mix(robeBase, robeDark, 0.55);
    const grip = side === 'L' ? pose.gripL : pose.gripR;
    const skin = nearSide ? C.skin : C.skinShade;
    return {
      depth,
      node: (
        <g key={`arm${side}`}>
          <Capsule a={sh} b={el} ra={0.072 * sh.s} rb={0.066 * el.s} fill={fill} />
          <Capsule a={el} b={wr} ra={0.066 * el.s} rb={0.058 * wr.s} fill={fill} />
          <Hand wr={wr} el={el} s={wr.s} grip={grip} fill={skin} shade={C.skinShade} />
          <Capsule a={el} b={wr} ra={0.02 * el.s} rb={0.012 * wr.s} fill={robeDark} opacity={0.25} />
        </g>
      ),
    };
  };

  // ---------- legs (only the shins and sandals show below the hem) ----------
  const leg = (side: 'L' | 'R') => {
    const knee = side === 'L' ? J.kneeL : J.kneeR;
    const ank = side === 'L' ? J.ankL : J.ankR;
    const ft = side === 'L' ? J.footL : J.footR;
    const k = pr(knee), a = pr(ank);
    const sideP = (p: V3, w: number) => [pr(add(p, mul(R, -w))), pr(add(p, mul(R, w)))];
    const [hl, hr] = sideP(ft.heel, 0.042);
    const [bl, br] = sideP(ft.ball, 0.05);
    const [tl, tr] = sideP(ft.toe, 0.036);
    const sole = [hl, bl, tl, tr, br, hr];
    const down = (p: V3) => add(p, v3(0, -0.016, 0));
    const [hl2, hr2] = sideP(down(ft.heel), 0.042);
    const [bl2, br2] = sideP(down(ft.ball), 0.05);
    const [tl2, tr2] = sideP(down(ft.toe), 0.036);
    const soleEdge = [hl2, bl2, tl2, tr2, br2, hr2];
    const up = (p: V3, h: number) => add(p, v3(0, h, 0));
    const [fh1, fh2] = sideP(up(ft.heel, 0.035), 0.034);
    const [fa1, fa2] = sideP(ank, 0.03);
    const [ft1, ft2] = sideP(up(ft.toe, 0.012), 0.03);
    const footSkin = [fh1, fa1, ft1, ft2, fa2, fh2];
    const [s1, s2] = sideP(up(ft.ball, 0.03), 0.05);
    const [s3, s4] = sideP(up(ft.heel, 0.03), 0.04);
    return {
      depth: (k.d + a.d) / 2,
      node: (
        <g key={`leg${side}`}>
          <Capsule a={k} b={a} ra={0.046 * k.s} rb={0.033 * a.s} fill={C.skinShade} />
          <polygon points={toPts(soleEdge)} fill={C.sandalSole} />
          <polygon points={toPts(sole)} fill={C.sandal} />
          <polygon points={toPts(footSkin)} fill={C.skin} />
          <line x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} stroke={C.sandal} strokeWidth={0.014 * a.s} strokeLinecap="round" />
          <line x1={s3.x} y1={s3.y} x2={s4.x} y2={s4.y} stroke={C.sandal} strokeWidth={0.012 * a.s} strokeLinecap="round" />
        </g>
      ),
    };
  };

  // ---------- head with plain wrapped covering (never any face) ----------
  const hc = pr(J.head);
  const rH = DIM.headR * hc.s;
  const camSide = dot(R, toCam(J.head)) > 0 ? 1 : -1; // which of his sides faces the camera
  const Rn = mul(R, camSide);
  const fwd2 = pr(add(J.head, mul(F, 0.1)));
  const fdx = (fwd2.x - hc.x) / hc.s / 0.1, fdy = (fwd2.y - hc.y) / hc.s / 0.1;
  const up2 = {x: 0, y: -1};
  const nape: P[] = [
    pr(add(J.head, add(mul(R, -0.075), add(mul(UP, -0.05), mul(F, -0.06))))),
    pr(add(J.head, add(mul(R, 0.075), add(mul(UP, -0.05), mul(F, -0.06))))),
    pr(add(J.neck, add(mul(R, 0.1), add(mul(F, -0.07), mul(J.spine, -0.1))))),
    pr(add(J.neck, add(mul(F, -0.09), add(mul(J.spine, -0.2), v3(pose.cloth.x * 0.4, 0, 0))))),
    pr(add(J.neck, add(mul(R, -0.1), add(mul(F, -0.07), mul(J.spine, -0.1))))),
  ];
  // near-side drape: a plain panel of the head cloth falling past the cheek to the shoulder
  const drape: P[] = [
    pr(add(J.head, add(mul(Rn, 0.1), add(mul(UP, -0.0), mul(F, -0.02))))),
    pr(add(J.head, add(mul(Rn, 0.112), add(mul(UP, -0.01), mul(F, 0.06))))),
    pr(add(J.neck, add(mul(Rn, 0.12), add(mul(F, 0.07), mul(J.spine, 0.02))))),
    pr(add(J.neck, add(mul(Rn, 0.17), add(mul(F, 0.0), mul(J.spine, -0.06))))),
    pr(add(J.neck, add(mul(Rn, 0.13), add(mul(F, -0.06), mul(J.spine, -0.02))))),
  ];
  const sideView = Math.abs(dot(Rn, toCam(J.head)));
  const neckA = pr(J.neck), neckB = pr(add(J.neck, mul(J.headDir, 0.08)));
  const band = (y0: number, y1: number, w: number) => {
    const L0 = {x: hc.x - rH * w, y: hc.y + rH * y0}, R0 = {x: hc.x + rH * w, y: hc.y + rH * y0};
    const sag = rH * (0.18 + 0.15 * Math.abs(fdy));
    return `M${L0.x},${L0.y} Q${hc.x - fdx * rH * 0.4},${hc.y + rH * y0 + sag} ${R0.x},${R0.y} L${hc.x + rH * w * 0.98},${hc.y + rH * y1} Q${hc.x - fdx * rH * 0.4},${hc.y + rH * y1 + sag} ${hc.x - rH * w * 0.98},${hc.y + rH * y1}Z`;
  };
  const headDepth = Math.min(hc.d, robeDepth - 0.01);
  const lightDx = -light.moonFrom;
  const headNode = (
    <g key="head">
      <Capsule a={neckA} b={neckB} ra={0.06 * neckA.s} rb={0.06 * neckB.s} fill={C.headClothShade} />
      <path d={spline(nape, true, 0.45)} fill={`url(#${id}-cloth)`} />
      <ellipse cx={hc.x} cy={hc.y - rH * 0.05} rx={rH * 0.98} ry={rH * 1.1} fill={`url(#${id}-dome)`} />
      <path d={band(-0.02, 0.5, 1.03)} fill={`url(#${id}-cloth)`} />
      <path d={band(0.2, 0.23, 1.0)} fill={C.headClothShade} opacity={0.22} />
      {[-0.42].map((o, i) => (
        <path key={i}
          d={`M${hc.x - rH * (0.8 - 0.1 * i)},${hc.y + rH * o} Q${hc.x - fdx * rH * 0.3},${hc.y + rH * (o + 0.2)} ${hc.x + rH * (0.82 - 0.1 * i)},${hc.y + rH * (o - 0.05)}`}
          fill="none" stroke={C.headClothShade} strokeWidth={0.008 * hc.s} opacity={0.28} strokeLinecap="round" />
      ))}
      {sideView > 0.35 && <path d={spline(drape, true, 0.45)} fill={`url(#${id}-cloth)`} opacity={Math.min(1, (sideView - 0.35) * 4)} />}
      {light.warm > 0.01 && (
        <ellipse cx={hc.x} cy={hc.y - rH * 0.05} rx={rH * 0.98} ry={rH * 1.1} fill="none"
          stroke={`url(#${id}-rim)`} strokeWidth={0.012 * hc.s} opacity={light.warm} />
      )}
    </g>
  );
  void up2;

  const arms = [arm('L'), arm('R')];
  const mixed = [
    ...arms,
    ...extras,
    {
      depth: robeDepth,
      node: (
        <g key="robe">
          <path d={robePath} fill={`url(#${id}-robe)`} />
          <path d={robePath} fill={`url(#${id}-weave)`} opacity={0.22} style={{mixBlendMode: 'multiply'}} />
          <g clipPath={`url(#${id}-clip)`}>
            {folds.map((d, i) => (
              <path key={i} d={d} fill="none" stroke={robeDark} strokeWidth={0.014 * sMid} opacity={0.32} strokeLinecap="round" />
            ))}
            {sashPts.length > 1 && (
              <polyline points={toPts(sashPts)} fill="none" stroke={C.sash} strokeWidth={0.03 * sMid} strokeLinecap="round" opacity={0.85} />
            )}
          </g>
          {light.warm > 0.01 && (
            <path d={robePath} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={0.014 * sMid} opacity={light.warm} />
          )}
        </g>
      ),
    },
    {depth: headDepth, node: headNode},
  ].sort((a, b) => b.depth - a.depth);

  const legs = showLegs ? [leg('L'), leg('R')].sort((a, b) => b.depth - a.depth) : [];
  const gx = (v: number) => (light.moonFrom < 0 ? v : 1 - v);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-robe`} gradientUnits="userSpaceOnUse" x1={minX} y1={minY} x2={maxX} y2={maxY * 0.3 + minY * 0.7}>
          <stop offset={gx(0)} stopColor={robeLit} />
          <stop offset={0.5} stopColor={robeBase} />
          <stop offset={gx(1)} stopColor={robeDark} />
        </linearGradient>
        <linearGradient id={`${id}-cloth`} gradientUnits="userSpaceOnUse" x1={hc.x - rH * 2} y1={hc.y - rH} x2={hc.x + rH * 2} y2={hc.y + rH * 3}>
          <stop offset={gx(0)} stopColor={mix(C.headCloth, C.headClothLit, exp * 0.6)} />
          <stop offset={gx(1)} stopColor={C.headClothShade} />
        </linearGradient>
        <radialGradient id={`${id}-dome`} gradientUnits="userSpaceOnUse" cx={hc.x + lightDx * -rH * 0.5} cy={hc.y - rH * 0.55} r={rH * 1.9}>
          <stop offset="0" stopColor={mix(C.headCloth, C.headClothLit, exp * 0.7)} />
          <stop offset="0.6" stopColor={C.headCloth} />
          <stop offset="1" stopColor={C.headClothShade} />
        </radialGradient>
        <linearGradient id={`${id}-rim`} gradientUnits="userSpaceOnUse" x1={light.warmFrom > 0 ? minX : maxX} y1={0} x2={light.warmFrom > 0 ? maxX : minX} y2={0}>
          <stop offset="0.55" stopColor={warmRim} stopOpacity={0} />
          <stop offset="1" stopColor={warmRim} stopOpacity={0.9} />
        </linearGradient>
        <pattern id={`${id}-weave`} patternUnits="userSpaceOnUse" width={256} height={256} patternTransform={`scale(${(sMid / 1400).toFixed(4)})`}>
          <image href={staticFile('tex/weave.png')} width={256} height={256} />
        </pattern>
        <clipPath id={`${id}-clip`}>
          <path d={spline(upperHull, true, 0.35)} />
          <path d={spline(lowerHull, true, 0.3)} />
        </clipPath>
      </defs>
      {legs.map((l) => l.node)}
      {mixed.map((m) => m.node)}
    </g>
  );
};

const lerp3 = (a: V3, b: V3, t: number): V3 => add(a, mul(sub(b, a), t));
export type {V2};
