import React from 'react';
import {V3, clamp, lerp, v3} from '../lib/math';
import {Projector, W, H} from '../lib/camera';
import {C} from '../lib/palette';
import {mix} from '../rig/Figure';
import {toPts} from '../rig/draw';
import {Caregiver, Child} from '../rig/Household';
import {GroundGlow, LinGrad, Poly, flicker} from './World';

/** Shared geometry: the household's wall and door (identical in shots 3 and 4). */
export const WALL_Z = 1.85;
export const DOOR = {x0: 0.12, x1: 1.02, h: 1.92};

type Props = {
  proj: Projector;
  frame: number;
  /** 0 closed .. 1 fully open (about 78 degrees, swinging inward) */
  open: number;
  caregiver?: {pos: V3; tension: number; visible: number};
  child?: {pos: V3; step: number; visible: number};
  mat?: boolean;
};

/** Small clay oil lamp with a living flame. */
export const OilLamp: React.FC<{x: number; y: number; s: number; frame: number}> = ({x, y, s, frame}) => {
  const fl = flicker(frame);
  const sway = 0.012 * Math.sin(frame * 0.17) + 0.008 * Math.sin(frame * 0.41);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={-0.08} rx={0.45 * fl} ry={0.4 * fl} fill={C.amberSoft} opacity={0.18} />
      <path d="M-0.08,0 Q-0.1,-0.035 -0.03,-0.045 L0.07,-0.04 Q0.1,-0.03 0.11,-0.045 L0.12,-0.03 Q0.06,0.005 0,0.005Z" fill={C.pottery} />
      <path d={`M0.105,-0.045 Q${0.1 + sway},${-0.08 * fl} ${0.108 + sway * 1.8},${-0.115 * fl} Q${0.122 + sway},${-0.075 * fl} 0.115,-0.045Z`} fill={C.amberSoft} />
      <path d={`M0.108,-0.047 Q${0.106 + sway},-0.07 ${0.11 + sway * 1.5},${-0.088 * fl} Q${0.116},-0.065 0.113,-0.047Z`} fill="#fff4dc" />
    </g>
  );
};

export const Doorway: React.FC<Props> = ({proj, frame, open, caregiver, child, mat}) => {
  const pr = proj.project;
  const fl = flicker(frame);
  const {x0, x1, h} = DOOR;
  const z = WALL_Z;
  const ang = open * 1.36;
  const dw = x1 - x0;
  const free = (y: number) => v3(x0 + Math.cos(ang) * dw, y, z + Math.sin(ang) * dw);
  const opening = [v3(x0, 0, z), v3(x0, h, z), v3(x1, h, z), v3(x1, 0, z)].map(pr);
  const panel = [v3(x0, 0.01, z), v3(x0, h - 0.01, z), free(h - 0.01), free(0.01)];
  const lampW = v3(0.38, 0.92, 3.9);
  const lamp = pr(lampW);
  const hz = pr(v3(0, 0, 60)).y;
  const lit = clamp(open * 1.6);

  // the interior room, seen only through the doorway
  const back = 4.1;
  const room = (
    <g>
      <defs>
        <radialGradient id="room" gradientUnits="userSpaceOnUse" cx={lamp.x} cy={lamp.y} r={lamp.s * 2.4}>
          <stop offset="0" stopColor={mix(C.plasterWarm, C.amberSoft, 0.35)} />
          <stop offset="0.45" stopColor={C.plasterWarm} />
          <stop offset="1" stopColor={mix(C.plasterWarm, '#2a1d14', 0.7)} />
        </radialGradient>
      </defs>
      <Poly proj={proj} pts={[v3(-1, 0, back), v3(-1, 2.6, back), v3(2.2, 2.6, back), v3(2.2, 0, back)]} fill="url(#room)" tex="plaster" id="roomt" texOpacity={0.35} />
      <Poly proj={proj} pts={[v3(-1, 0, z), v3(2.2, 0, z), v3(2.2, 0, back), v3(-1, 0, back)]} fill={mix(C.mat, '#3a2a1d', 0.45)} tex="earth" id="roomf" texOpacity={0.3} />
      <Poly proj={proj} pts={[v3(-0.2, 0.004, 2.6), v3(1.6, 0.004, 2.6), v3(1.6, 0.004, 3.8), v3(-0.2, 0.004, 3.8)]} fill={C.mat} tex="mat" id="roommat" texOpacity={0.5} />
      {/* niche shelf holding the lamp, and a water jar */}
      <Poly proj={proj} pts={[v3(0.15, 0.85, back - 0.01), v3(0.15, 1.25, back - 0.01), v3(0.62, 1.25, back - 0.01), v3(0.62, 0.85, back - 0.01)]} fill={mix(C.plasterWarm, '#3b2a1c', 0.45)} />
      <OilLamp x={lamp.x} y={lamp.y} s={lamp.s} frame={frame} />
      {(() => {
        const j = pr(v3(1.55, 0, 3.7));
        return (
          <g transform={`translate(${j.x},${j.y}) scale(${j.s * 0.45})`}>
            <path d="M-0.18,-0.98 L-0.16,-0.9 Q-0.45,-0.75 -0.4,-0.4 Q-0.35,-0.05 -0.2,0 L0.2,0 Q0.35,-0.05 0.4,-0.4 Q0.45,-0.75 0.16,-0.9 L0.18,-0.98Z" fill={mix(C.pottery, C.amberDeep, 0.25)} />
          </g>
        );
      })()}
      <rect x={0} y={0} width={W} height={H} fill="#100b07" opacity={0.45 * (1 - fl * 0.9)} />
    </g>
  );

  const people = (
    <g>
      {child && child.visible > 0 && (() => {
        const p = pr(child.pos);
        return (
          <g opacity={child.visible}>
            <Child x={p.x} y={p.y} s={p.s} step={child.step} breathe={Math.sin(frame * 0.09)} warm={1} />
          </g>
        );
      })()}
      {caregiver && caregiver.visible > 0 && (() => {
        const p = pr(caregiver.pos);
        return (
          <g opacity={caregiver.visible}>
            <Caregiver x={p.x} y={p.y} s={p.s} tension={caregiver.tension} breathe={Math.sin(frame * 0.07)} warm={1} />
          </g>
        );
      })()}
    </g>
  );

  const wallA = pr(v3(-2.5, 1.2, z)), wallB = pr(v3(3.5, 1.2, z));
  const groundNear = pr(v3(0, 0, proj.cam.pos.z + 0.3)), groundFar = pr(v3(0, 0, z));
  return (
    <g>
      <rect x={0} y={0} width={W} height={hz + 4} fill={C.sky1} />
      <defs>
        <LinGrad id="dwall" a={wallA} b={wallB} stops={[[0, C.plasterShade], [0.55, mix(C.plasterShade, C.plasterMoon, 0.6)], [1, C.plasterShade]]} />
        <LinGrad id="dgnd" a={groundNear} b={groundFar} stops={[[0, C.earthDark], [1, C.earth]]} />
        <clipPath id="doorclip">
          <polygon points={toPts(opening)} />
        </clipPath>
      </defs>
      <Poly proj={proj} pts={[v3(-4, 0, proj.cam.pos.z + 0.2), v3(5, 0, proj.cam.pos.z + 0.2), v3(5, 0, z), v3(-4, 0, z)]} fill="url(#dgnd)" tex="earth" id="dgt" texOpacity={0.5} texScale={0.7} />
      <Poly proj={proj} pts={[v3(-4, 0, z), v3(-4, 3.2, z), v3(5, 3.2, z), v3(5, 0, z)]} fill="url(#dwall)" tex="plaster" id="dwt" texOpacity={0.6} texScale={0.9} />
      {/* damp base of the wall */}
      <Poly proj={proj} pts={[v3(-4, 0, z - 0.002), v3(-4, 0.3, z - 0.002), v3(5, 0.24, z - 0.002), v3(5, 0, z - 0.002)]} fill="#11131b" opacity={0.4} />
      {/* doorway interior and the door swinging inward */}
      <polygon points={toPts(opening)} fill="#07070a" />
      <g clipPath="url(#doorclip)">
        <g opacity={lit}>{room}</g>
        <g opacity={lit}>{people}</g>
        <Poly proj={proj} pts={panel} fill={mix(C.wood, C.woodLit, lit * 0.6)} />
        {[0.25, 0.5, 0.75].map((k) => {
          const a = pr(lerpV(v3(x0, 0.04, z), free(0.04), k)), b = pr(lerpV(v3(x0, h - 0.04, z), free(h - 0.04), k));
          return <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.woodDark} strokeWidth={a.s * 0.01} opacity={0.55} />;
        })}
        {[0.32, 1.45].map((yy) => {
          const a = pr(v3(x0 + 0.02, yy, z)), b = pr(free(yy));
          return <line key={yy} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.woodDark} strokeWidth={a.s * 0.05} opacity={0.6} />;
        })}
      </g>
      {/* thin line of lamplight before the door opens */}
      <polygon points={toPts([pr(v3(x0 + 0.04, 0.0, z)), pr(v3(x1 - 0.04, 0.0, z)), pr(v3(x1 - 0.04, 0.015, z)), pr(v3(x0 + 0.04, 0.015, z))])}
        fill={C.amberSoft} opacity={(1 - lit) * 0.85 * fl} />
      {/* lintel beam and threshold stone */}
      <Poly proj={proj} pts={[v3(x0 - 0.12, h, z - 0.05), v3(x0 - 0.12, h + 0.16, z - 0.05), v3(x1 + 0.12, h + 0.16, z - 0.05), v3(x1 + 0.12, h, z - 0.05)]} fill={C.woodDark} />
      <Poly proj={proj} pts={[v3(x0 - 0.12, h, z - 0.05), v3(x1 + 0.12, h, z - 0.05), v3(x1 + 0.12, h, z), v3(x0 - 0.12, h, z)]} fill="#1a140f" />
      <Poly proj={proj} pts={[v3(x0 - 0.06, 0.07, z - 0.08), v3(x1 + 0.06, 0.07, z - 0.08), v3(x1 + 0.06, 0.07, z), v3(x0 - 0.06, 0.07, z)]} fill={mix('#6b6560', C.amber, lit * 0.35)} />
      <Poly proj={proj} pts={[v3(x0 - 0.06, 0, z - 0.08), v3(x0 - 0.06, 0.07, z - 0.08), v3(x1 + 0.06, 0.07, z - 0.08), v3(x1 + 0.06, 0, z - 0.08)]} fill={mix('#4a4540', C.amberDeep, lit * 0.3)} />
      {/* light spilling over the threshold onto the street */}
      <Poly proj={proj} pts={[v3(x0, 0.003, z - 0.08), v3(x1, 0.003, z - 0.08), v3(x1 + 0.35, 0.003, z - 0.9), v3(x0 - 0.45, 0.003, z - 0.9)]}
        fill={C.amber} opacity={0.07 * lit * fl} />
      <GroundGlow proj={proj} c={v3((x0 + x1) / 2 + 0.1, 0, z - 0.45)} rx={0.75} rz={0.7} opacity={0.22 * lit * fl} id="spill" />
      {/* a pot by the wall */}
      {(() => {
        const j = pr(v3(-0.55, 0, z - 0.25));
        return (
          <g transform={`translate(${j.x},${j.y}) scale(${j.s * 0.5})`}>
            <ellipse cx={0} cy={0} rx={0.42} ry={0.07} fill="#06070b" opacity={0.5} />
            <path d="M-0.18,-0.98 L-0.16,-0.9 Q-0.45,-0.75 -0.4,-0.4 Q-0.35,-0.05 -0.2,0 L0.2,0 Q0.35,-0.05 0.4,-0.4 Q0.45,-0.75 0.16,-0.9 L0.18,-0.98Z" fill={mix(C.pottery, C.slate, 0.5)} />
            <path d="M0.05,-0.85 Q0.32,-0.65 0.28,-0.3" stroke={C.amberSoft} strokeWidth={0.03} fill="none" opacity={0.2 * lit} />
          </g>
        );
      })()}
      {mat && (
        <g>
          <Poly proj={proj} pts={[v3(-0.2, 0.006, 1.06), v3(0.98, 0.006, 1.06), v3(0.98, 0.006, 1.7), v3(-0.2, 0.006, 1.7)]} fill={mix(C.mat, C.amber, 0.2 * lit)} tex="mat" id="matt" texOpacity={0.6} texScale={0.55} />
          <Poly proj={proj} pts={[v3(-0.2, 0.008, 1.06), v3(0.98, 0.008, 1.06), v3(0.98, 0.008, 1.1), v3(-0.2, 0.008, 1.1)]} fill={C.matShade} />
          <Poly proj={proj} pts={[v3(-0.2, 0.008, 1.66), v3(0.98, 0.008, 1.66), v3(0.98, 0.008, 1.7), v3(-0.2, 0.008, 1.7)]} fill={C.matShade} />
        </g>
      )}
    </g>
  );
};

const lerpV = (a: V3, b: V3, t: number) => v3(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));
