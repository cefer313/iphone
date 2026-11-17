import React from 'react';
import {staticFile} from 'remotion';
import {V3, add, clamp, lerp, noise1, rng, v3} from '../lib/math';
import {P, Projector, W, H} from '../lib/camera';
import {C} from '../lib/palette';
import {mix} from '../rig/Figure';
import {toPts} from '../rig/draw';

/** Projected polygon with optional screen-space texture overlay. */
export const Poly: React.FC<{
  proj: Projector; pts: V3[]; fill: string; tex?: 'plaster' | 'earth' | 'mat' | 'weave'; texOpacity?: number;
  texScale?: number; id?: string; stroke?: string; strokeWidth?: number; opacity?: number;
}> = ({proj, pts, fill, tex, texOpacity = 0.4, texScale = 1, id, stroke, strokeWidth, opacity}) => {
  const p = pts.map(proj.project);
  const P0 = p[0];
  const sc = ((P0.s / 900) * texScale).toFixed(4);
  return (
    <g opacity={opacity}>
      <polygon points={toPts(p)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      {tex && id && (
        <>
          <defs>
            <pattern id={id} patternUnits="userSpaceOnUse" width={512} height={512}
              patternTransform={`translate(${P0.x.toFixed(1)},${P0.y.toFixed(1)}) scale(${sc})`}>
              <image href={staticFile(`tex/${tex}.png`)} width={512} height={512} preserveAspectRatio="none" />
            </pattern>
          </defs>
          <polygon points={toPts(p)} fill={`url(#${id})`} opacity={texOpacity} style={{mixBlendMode: 'overlay'}} />
        </>
      )}
    </g>
  );
};

/** Gradient helper running along two projected points. */
export const LinGrad: React.FC<{id: string; a: P; b: P; stops: [number, string, number?][]}> = ({id, a, b, stops}) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}>
    {stops.map(([o, c, op], i) => (
      <stop key={i} offset={o} stopColor={c} stopOpacity={op ?? 1} />
    ))}
  </linearGradient>
);

export const Sky: React.FC<{proj: Projector; frame: number; seed?: number}> = ({proj, frame, seed = 9}) => {
  const hz = proj.project(v3(0, 0, 400)).y;
  const r = rng(seed);
  const stars = Array.from({length: 70}, () => ({x: r() * W, y: r() * hz * 0.9, s: 0.6 + r() * 1.3, p: r() * 6}));
  return (
    <g>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2={hz} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.sky0} />
          <stop offset="0.7" stopColor={C.sky1} />
          <stop offset="1" stopColor={C.sky2} />
        </linearGradient>
        <radialGradient id="moonglow" cx="18%" cy="6%" r="55%">
          <stop offset="0" stopColor="#8d9bc2" stopOpacity={0.28} />
          <stop offset="1" stopColor="#8d9bc2" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#sky)" />
      <rect x={0} y={0} width={W} height={H} fill="url(#moonglow)" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#c9d3ef" opacity={0.25 + 0.2 * Math.sin(frame * 0.05 + s.p)} />
      ))}
    </g>
  );
};

/** Flame flicker (deterministic). */
export const flicker = (f: number) => 1 + 0.06 * noise1(f * 0.21, 3) + 0.03 * noise1(f * 0.63, 7);

type Seg = {z0: number; z1: number; dx: number; h: number};
const LEFT: Seg[] = [
  {z0: -3, z1: 3.4, dx: 0, h: 3.1}, {z0: 3.4, z1: 7.6, dx: -0.28, h: 2.7}, {z0: 7.6, z1: 12, dx: 0.04, h: 3.4},
  {z0: 12, z1: 17, dx: -0.16, h: 2.9}, {z0: 17, z1: 26, dx: 0, h: 3.2},
];
const RIGHT: Seg[] = [
  {z0: -3, z1: 4.2, dx: 0, h: 2.9}, {z0: 4.2, z1: 9, dx: 0.22, h: 3.3}, {z0: 9, z1: 15.5, dx: 0, h: 2.8},
  {z0: 15.5, z1: 26, dx: 0.16, h: 3.1},
];
const HALF = 1.6;
const END_Z = 26;

/**
 * The narrow street. `homeDoor` places the household's lit doorway on the right
 * wall (used when leaving it in the final shot).
 */
export const Street: React.FC<{
  proj: Projector; frame: number; homeDoor?: {z0: number; z1: number; open: number};
}> = ({proj, frame, homeDoor}) => {
  const pr = proj.project;
  const fl = flicker(frame);
  const far = C.sky2;
  const wallFace = (side: -1 | 1, s: Seg, i: number) => {
    const x = side * (HALF + (side === 1 ? s.dx : -s.dx));
    const pts = [v3(x, 0, s.z0), v3(x, s.h, s.z0), v3(x, s.h, s.z1), v3(x, 0, s.z1)];
    const base = side === 1 ? C.plasterMoon : C.plasterShade;
    const gid = `wg${side}${i}`;
    const a = pr(v3(x, 1.2, Math.max(s.z0, proj.cam.pos.z + 0.3)));
    const b = pr(v3(x, 1.2, s.z1));
    const tA = clamp((Math.max(s.z0, proj.cam.pos.z) - proj.cam.pos.z) / 30);
    const tB = clamp((s.z1 - proj.cam.pos.z) / 30);
    return (
      <g key={gid}>
        <defs>
          <LinGrad id={gid} a={a} b={b} stops={[[0, mix(base, far, tA * 0.9)], [1, mix(base, far, tB * 0.9)]]} />
        </defs>
        <Poly proj={proj} pts={pts} fill={`url(#${gid})`} tex="plaster" texOpacity={0.55} id={`${gid}t`} texScale={1.2} />
        {/* top edge catches the moon on the lit side */}
        {side === 1 && (
          <polyline points={toPts([pr(v3(x, s.h, s.z0)), pr(v3(x, s.h, s.z1))])} stroke="#8e98b4" strokeWidth={2} opacity={0.35} fill="none" />
        )}
        {/* weathered base: damp, darker plaster near the ground */}
        <Poly proj={proj} pts={[v3(x, 0, s.z0), v3(x, 0.35, s.z0), v3(x, 0.28, s.z1), v3(x, 0, s.z1)]} fill="#141720" opacity={0.35} />
        {/* beam ends projecting under the roof line */}
        {Array.from({length: Math.floor((s.z1 - s.z0) / 0.9)}, (_, k) => {
          const z = s.z0 + 0.45 + k * 0.9;
          const p1 = pr(v3(x, s.h - 0.32, z - 0.05));
          const p2 = pr(v3(x - side * 0.14, s.h - 0.2, z + 0.05));
          return <rect key={k} x={Math.min(p1.x, p2.x)} y={Math.min(p1.y, p2.y)} width={Math.abs(p2.x - p1.x) + 1} height={Math.abs(p2.y - p1.y) + 1} fill={C.woodDark} opacity={0.8} />;
        })}
      </g>
    );
  };
  // returns connecting faces where a house sets back from its neighbour
  const joins = (side: -1 | 1, segs: Seg[]) =>
    segs.slice(1).map((s, i) => {
      const p = segs[i];
      const x0 = side * (HALF + (side === 1 ? p.dx : -p.dx));
      const x1 = side * (HALF + (side === 1 ? s.dx : -s.dx));
      const h = Math.max(p.h, s.h);
      const z = s.z0;
      const t = clamp((z - proj.cam.pos.z) / 30);
      const facesCam = (x1 - x0) * side > 0 ? 0.7 : 0.4;
      return (
        <Poly key={`j${side}${i}`} proj={proj} pts={[v3(x0, 0, z), v3(x0, h, z), v3(x1, h, z), v3(x1, 0, z)]}
          fill={mix(mix(C.plasterShade, C.plasterMoon, facesCam), far, t * 0.9)} tex="plaster" id={`jt${side}${i}`} texOpacity={0.4} />
      );
    });
  const door = (side: -1 | 1, z0: number, z1: number, key: string, glow = 0) => {
    const x = side * HALF - side * 0.01;
    const hgt = 1.95;
    const t = clamp((z0 - proj.cam.pos.z) / 30);
    const under = [pr(v3(x, 0, z0 + 0.05)), pr(v3(x, 0.03, z0 + 0.05)), pr(v3(x, 0.03, z1 - 0.05)), pr(v3(x, 0, z1 - 0.05))];
    return (
      <g key={key}>
        <Poly proj={proj} pts={[v3(x, 0, z0), v3(x, hgt, z0), v3(x, hgt, z1), v3(x, 0, z1)]} fill={mix(C.wood, far, t * 0.8)} />
        <Poly proj={proj} pts={[v3(x, hgt, z0 - 0.08), v3(x, hgt + 0.13, z0 - 0.08), v3(x, hgt + 0.13, z1 + 0.08), v3(x, hgt, z1 + 0.08)]}
          fill={mix(C.woodDark, far, t * 0.7)} />
        {[0.25, 0.5, 0.75].map((k) => {
          const a = pr(v3(x, 0.05, lerp(z0, z1, k))), b = pr(v3(x, hgt - 0.05, lerp(z0, z1, k)));
          return <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.woodDark} strokeWidth={1.2} opacity={0.6} />;
        })}
        {glow > 0 && (
          <>
            <polygon points={toPts(under)} fill={C.amberSoft} opacity={0.9 * glow * fl} />
            <GroundGlow proj={proj} c={v3(x - side * 0.45, 0, (z0 + z1) / 2)} rx={0.8} rz={0.9} opacity={0.32 * glow * fl} id={`${key}g`} />
          </>
        )}
      </g>
    );
  };

  const ground = [v3(-HALF - 0.4, 0, proj.cam.pos.z + 0.2), v3(HALF + 0.4, 0, proj.cam.pos.z + 0.2), v3(HALF + 0.4, 0, END_Z), v3(-HALF - 0.4, 0, END_Z)];
  const gA = pr(v3(0, 0, proj.cam.pos.z + 0.5)), gB = pr(v3(0, 0, END_Z));
  const jar = (p: V3, k: string, scale = 1) => {
    const q = pr(p);
    const s = q.s * 0.42 * scale;
    return (
      <g key={k} transform={`translate(${q.x},${q.y}) scale(${s})`}>
        <ellipse cx={0} cy={0} rx={0.42} ry={0.08} fill="#07080c" opacity={0.5} />
        <path d="M-0.18,-0.98 L-0.16,-0.9 Q-0.45,-0.75 -0.4,-0.4 Q-0.35,-0.05 -0.2,0 L0.2,0 Q0.35,-0.05 0.4,-0.4 Q0.45,-0.75 0.16,-0.9 L0.18,-0.98Z"
          fill={mix(C.pottery, C.slate, 0.55)} />
        <path d="M0.05,-0.85 Q0.32,-0.65 0.28,-0.3" stroke="#9aa4c0" strokeWidth={0.03} fill="none" opacity={0.25} />
      </g>
    );
  };
  return (
    <g>
      <Sky proj={proj} frame={frame} />
      {/* distant rooftops and a date palm, beyond the end of the street */}
      <DistantRoofs proj={proj} />
      <Poly proj={proj} pts={[v3(-3, 0, END_Z), v3(-3, 3.4, END_Z), v3(3, 3.4, END_Z), v3(3, 0, END_Z)]} fill={mix(C.plasterShade, far, 0.75)} tex="plaster" id="endw" texOpacity={0.3} />
      <Poly proj={proj} pts={[v3(-0.3, 1.5, END_Z - 0.01), v3(-0.3, 2.0, END_Z - 0.01), v3(0.15, 2.0, END_Z - 0.01), v3(0.15, 1.5, END_Z - 0.01)]} fill="#11141e" />
      <defs>
        <LinGrad id="gnd" a={gA} b={gB} stops={[[0, C.earth], [0.5, mix(C.earth, C.earthMoon, 0.5)], [1, mix(C.earthMoon, far, 0.7)]]} />
      </defs>
      <Poly proj={proj} pts={ground} fill="url(#gnd)" tex="earth" id="gndt" texOpacity={0.3} texScale={0.8} />
      {/* foot-worn path down the middle */}
      <Poly proj={proj} pts={[v3(-0.5, 0.001, proj.cam.pos.z + 0.2), v3(0.6, 0.001, proj.cam.pos.z + 0.2), v3(0.35, 0.001, END_Z), v3(-0.25, 0.001, END_Z)]}
        fill="#5a5866" opacity={0.12} />
      {/* moon shadow cast by the left houses */}
      <Poly proj={proj} pts={[v3(-HALF, 0.002, proj.cam.pos.z + 0.2), v3(-HALF + 0.75, 0.002, proj.cam.pos.z + 0.2), v3(-HALF + 0.65, 0.002, END_Z), v3(-HALF, 0.002, END_Z)]}
        fill="#07080e" opacity={0.42} />
      {[...RIGHT].reverse().map((s, i) => wallFace(1, s, RIGHT.length - 1 - i))}
      {joins(1, RIGHT)}
      {[...LEFT].reverse().map((s, i) => wallFace(-1, s, LEFT.length - 1 - i))}
      {joins(-1, LEFT)}
      {door(-1, 10.6, 11.45, 'dl1', 1)}
      {door(-1, 4.6, 5.45, 'dl2')}
      {door(1, 12.6, 13.5, 'dr1')}
      {door(1, 18.5, 19.3, 'dr2')}
      {!homeDoor && door(1, 1.6, 2.45, 'dr3')}
      {/* small window niche */}
      <Poly proj={proj} pts={[v3(-HALF - 0.04, 2.0, 14.0), v3(-HALF - 0.04, 2.45, 14.0), v3(-HALF - 0.04, 2.45, 14.5), v3(-HALF - 0.04, 2.0, 14.5)]} fill="#0b0d15" />
      {jar(v3(HALF - 0.25, 0, 6.2), 'j1')}
      {jar(v3(HALF - 0.2, 0, 6.65), 'j2', 0.75)}
      {jar(v3(-HALF + 0.35, 0, 11.2), 'j3', 0.9)}
      {homeDoor && <HomeDoor proj={proj} frame={frame} {...homeDoor} />}
    </g>
  );
};

const DistantRoofs: React.FC<{proj: Projector}> = ({proj}) => {
  const pr = proj.project;
  const r = rng(21);
  const boxes = Array.from({length: 9}, (_, i) => ({x0: -9 + i * 2.1 + r() * 0.6, w: 1.6 + r() * 1.2, h: 3.4 + r() * 2.2, z: 34 + r() * 10}));
  const palm = pr(v3(2.4, 0, 31));
  const ps = palm.s;
  return (
    <g>
      {boxes.map((b, i) => (
        <Poly key={i} proj={proj} pts={[v3(b.x0, 0, b.z), v3(b.x0, b.h, b.z), v3(b.x0 + b.w, b.h, b.z), v3(b.x0 + b.w, 0, b.z)]} fill={mix(C.slate, C.sky2, 0.55)} />
      ))}
      <g transform={`translate(${palm.x},${palm.y}) scale(${ps})`} fill={mix(C.night, C.sky2, 0.35)} stroke={mix(C.night, C.sky2, 0.35)}>
        <path d="M0,0 Q0.25,-3 0.15,-6.2" strokeWidth={0.22} fill="none" />
        {[-150, -120, -80, -40, -10, 20].map((a, i) => (
          <path key={i} d={`M0.15,-6.2 q${Math.cos((a * Math.PI) / 180) * 1.2},${Math.sin((a * Math.PI) / 180) * 0.6 - 0.3} ${Math.cos((a * Math.PI) / 180) * 2.2},${Math.sin((a * Math.PI) / 180) * 0.8 + 0.6}`}
            strokeWidth={0.18} fill="none" strokeLinecap="round" />
        ))}
      </g>
    </g>
  );
};

/** Soft pool of lamplight on the ground. */
export const GroundGlow: React.FC<{proj: Projector; c: V3; rx: number; rz: number; opacity: number; id: string; color?: string}> = ({
  proj, c, rx, rz, opacity, id, color = C.amber,
}) => {
  const pts = Array.from({length: 28}, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    return proj.project(v3(c.x + Math.cos(a) * rx, 0.003, c.z + Math.sin(a) * rz));
  });
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const rr = Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.y - cy)));
  return (
    <g>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={rr}>
          <stop offset="0" stopColor={color} stopOpacity={opacity} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <polygon points={toPts(pts)} fill={`url(#${id})`} style={{mixBlendMode: 'screen'}} />
    </g>
  );
};

/** The household's doorway on the right wall of the street, open and lamplit. */
const HomeDoor: React.FC<{proj: Projector; frame: number; z0: number; z1: number; open: number}> = ({proj, frame, z0, z1, open}) => {
  const pr = proj.project;
  const fl = flicker(frame);
  const x = HALF - 0.005;
  const hgt = 1.95;
  const opening = [v3(x, 0, z0), v3(x, hgt, z0), v3(x, hgt, z1), v3(x, 0, z1)];
  const ang = open * 1.25;
  const panel = [v3(x, 0.02, z1), v3(x, hgt - 0.02, z1), v3(x + Math.sin(ang) * (z1 - z0), hgt - 0.02, z1 - Math.cos(ang) * (z1 - z0)), v3(x + Math.sin(ang) * (z1 - z0), 0.02, z1 - Math.cos(ang) * (z1 - z0))];
  const a = pr(v3(x, 1.0, z0)), b = pr(v3(x, 1.0, z1));
  return (
    <g>
      <defs>
        <LinGrad id="hdin" a={a} b={b} stops={[[0, C.amberDeep], [0.6, C.amber], [1, C.amberSoft]]} />
      </defs>
      <Poly proj={proj} pts={opening} fill="url(#hdin)" opacity={0.95 * fl} />
      <Poly proj={proj} pts={panel} fill={C.woodLit} />
      <Poly proj={proj} pts={[v3(x, hgt, z0 - 0.08), v3(x, hgt + 0.13, z0 - 0.08), v3(x, hgt + 0.13, z1 + 0.08), v3(x, hgt, z1 + 0.08)]} fill={C.woodDark} />
      <Poly proj={proj} pts={[v3(x - 0.02, 0, z0 - 0.04), v3(x - 0.3, 0, z0 - 0.04), v3(x - 0.3, 0.08, z0 - 0.04), v3(x - 0.02, 0.08, z0 - 0.04)]} fill="#5c4a3a" />
      <Poly proj={proj} pts={[v3(x, 0.002, z0), v3(x - 1.7, 0.002, z0 - 0.5), v3(x - 1.9, 0.002, z1 + 0.9), v3(x, 0.002, z1)]} fill={C.amber} opacity={0.16 * fl} />
      <GroundGlow proj={proj} c={v3(x - 0.55, 0, (z0 + z1) / 2)} rx={1.1} rz={1.0} opacity={0.42 * fl} id="hdg" />
      <GroundGlow proj={proj} c={v3(x - 0.05, 1.0, (z0 + z1) / 2)} rx={0.05} rz={1.4} opacity={0.0} id="hdg2" />
    </g>
  );
};

export {HALF, END_Z};
