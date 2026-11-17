import React from 'react';
import {lerp, spline} from '../lib/math';
import {C} from '../lib/palette';
import {mix} from './Figure';

/**
 * The caregiver and child are drawn as front-facing 2.5D cut-outs placed at a
 * projected world anchor (feet on the ground). Units are metres, y up = negative.
 * Faces are deliberately soft and quiet: lit from behind by the lamp.
 */
export const Caregiver: React.FC<{
  x: number; y: number; s: number;
  tension: number; // 1 = guarded shoulders, 0 = softened
  breathe: number; warm: number; turn?: number;
}> = ({x, y, s, tension, breathe, warm, turn = 0}) => {
  const sh = -1.36 + 0.025 * tension + 0.004 * breathe; // shoulder height
  const handY = lerp(-0.86, -0.92, tension);
  const sw = lerp(0.2, 0.185, tension);
  const dress = [
    {x: -sw, y: sh + 0.03}, {x: -sw - 0.03, y: -0.9}, {x: -0.27, y: -0.02}, {x: 0.27, y: -0.02},
    {x: sw + 0.03, y: -0.9}, {x: sw, y: sh + 0.03}, {x: 0, y: sh - 0.02},
  ];
  const scarfD = `M0,-1.715 C0.1,-1.715 0.145,-1.63 0.145,-1.52 C0.145,-1.44 0.19,-1.4 ${sw + 0.02},${sh + 0.03} C${sw + 0.05},-1.22 0.17,-1.12 0,-1.09 C-0.17,-1.12 ${-sw - 0.05},-1.22 ${-sw - 0.02},${sh + 0.03} C-0.19,-1.4 -0.145,-1.44 -0.145,-1.52 C-0.145,-1.63 -0.1,-1.715 0,-1.715Z`;
  const rim = mix(C.amberDeep, C.amberSoft, 0.3);
  return (
    <g transform={`translate(${x},${y}) scale(${s}) skewX(${turn})`}>
      <path d={spline(dress, true, 0.4)} fill={C.cgDress} />
      <path d={spline(dress, true, 0.4)} fill="none" stroke={rim} strokeWidth={0.012} opacity={warm * 0.7} />
      {/* worn hem and a mended patch, presented plainly */}
      <path d="M-0.26,-0.05 Q0,-0.02 0.26,-0.05" stroke={C.cgDressShade} strokeWidth={0.02} fill="none" />
      <rect x={0.06} y={-0.38} width={0.09} height={0.08} fill={mix(C.cgDress, C.cgScarf, 0.35)} opacity={0.8} />
      <path d={`M-0.06,${sh + 0.2} Q-0.07,-0.6 -0.11,-0.08`} stroke={C.cgDressShade} strokeWidth={0.014} fill="none" opacity={0.6} />
      <path d={`M0.07,${sh + 0.2} Q0.08,-0.6 0.13,-0.08`} stroke={C.cgDressShade} strokeWidth={0.014} fill="none" opacity={0.6} />
      {/* forearms meeting at the waist, hands loosely joined */}
      <path d={`M${-sw},${sh + 0.06} Q${-sw - 0.04},${handY + 0.2} -0.03,${handY}`} stroke={C.cgDressShade} strokeWidth={0.085} fill="none" strokeLinecap="round" />
      <path d={`M${sw},${sh + 0.06} Q${sw + 0.04},${handY + 0.2} 0.03,${handY}`} stroke={C.cgDress} strokeWidth={0.085} fill="none" strokeLinecap="round" />
      <ellipse cx={-0.02} cy={handY + 0.01} rx={0.05} ry={0.035} fill={C.skinShade} />
      <ellipse cx={0.025} cy={handY} rx={0.05} ry={0.034} fill={C.skin} />
      {/* head and scarf */}
      <path d={scarfD} fill={C.cgScarf} />
      <path d={scarfD} fill="none" stroke={rim} strokeWidth={0.012} opacity={warm * 0.8} />
      <path d="M-0.1,-1.36 Q0,-1.3 0.1,-1.36" stroke={C.cgScarfShade} strokeWidth={0.012} fill="none" opacity={0.7} />
      <ellipse cx={0} cy={-1.545} rx={0.068} ry={0.088} fill={C.skinShade} />
      <ellipse cx={0.008} cy={-1.55} rx={0.058} ry={0.078} fill={mix(C.skinShade, C.skin, 0.55)} />
      <g opacity={0.75}>
        <path d="M-0.033,-1.567 q0.015,-0.006 0.024,0" stroke="#1f1712" strokeWidth={0.006} fill="none" strokeLinecap="round" />
        <path d="M0.012,-1.567 q0.015,-0.006 0.024,0" stroke="#1f1712" strokeWidth={0.006} fill="none" strokeLinecap="round" />
        <path d="M0.003,-1.548 q0.006,0.016 -0.004,0.022" stroke={C.skinShade} strokeWidth={0.004} fill="none" />
        <path d="M-0.014,-1.51 q0.016,0.004 0.03,0" stroke="#3a2419" strokeWidth={0.004} fill="none" strokeLinecap="round" />
      </g>
      <path d="M-0.07,-1.62 Q0,-1.665 0.07,-1.62" stroke={C.cgScarfShade} strokeWidth={0.014} fill="none" />
    </g>
  );
};

export const Child: React.FC<{
  x: number; y: number; s: number;
  step: number; // 0..1 one small step forward
  breathe: number; warm: number;
}> = ({x, y, s, step, breathe, warm}) => {
  // the stepping foot lifts and plants a little forward (down-screen)
  const lift = Math.sin(Math.PI * step) * 0.05;
  const footR = {x: 0.06, y: -0.02 - lift + 0.035 * step};
  const footL = {x: -0.06, y: -0.02 + 0.035 * Math.max(0, step - 0.85) / 0.15 * 0};
  const sh = -0.88 + 0.003 * breathe;
  const tunic = [
    {x: -0.13, y: sh + 0.02}, {x: -0.16, y: -0.55}, {x: -0.17, y: -0.3}, {x: 0.17, y: -0.3},
    {x: 0.16, y: -0.55}, {x: 0.13, y: sh + 0.02}, {x: 0, y: sh - 0.02},
  ];
  const rim = mix(C.amberDeep, C.amberSoft, 0.3);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d={`M-0.06,-0.32 L${footL.x},${footL.y - 0.02}`} stroke={C.skinShade} strokeWidth={0.05} strokeLinecap="round" />
      <path d={`M0.06,-0.32 L${footR.x},${footR.y - 0.02}`} stroke={C.skin} strokeWidth={0.05} strokeLinecap="round" />
      <ellipse cx={footL.x} cy={footL.y} rx={0.045} ry={0.022} fill={C.skinShade} />
      <ellipse cx={footR.x} cy={footR.y} rx={0.045} ry={0.022} fill={C.skin} />
      <path d={spline(tunic, true, 0.4)} fill={C.childTunic} />
      <path d={spline(tunic, true, 0.4)} fill="none" stroke={rim} strokeWidth={0.012} opacity={warm * 0.7} />
      <path d="M-0.15,-0.33 Q0,-0.3 0.15,-0.33" stroke={C.childTunicShade} strokeWidth={0.02} fill="none" />
      <path d={`M-0.13,${sh + 0.05} Q-0.19,-0.62 -0.15,-0.47`} stroke={C.childTunicShade} strokeWidth={0.06} fill="none" strokeLinecap="round" />
      <path d={`M0.13,${sh + 0.05} Q0.19,-0.62 0.15,-0.47`} stroke={C.childTunic} strokeWidth={0.06} fill="none" strokeLinecap="round" />
      <circle cx={-0.15} cy={-0.45} r={0.03} fill={C.skinShade} />
      <circle cx={0.15} cy={-0.45} r={0.03} fill={C.skin} />
      <rect x={-0.03} y={sh - 0.06} width={0.06} height={0.08} fill={C.skinShade} />
      <ellipse cx={0} cy={sh - 0.13} rx={0.085} ry={0.098} fill={mix(C.skinShade, C.skin, 0.6)} />
      <path d="M-0.088,-1.0 Q-0.09,-1.11 0,-1.115 Q0.09,-1.11 0.088,-1.0 Q0.06,-1.06 0,-1.06 Q-0.06,-1.06 -0.088,-1.0Z" fill={C.hair} />
      <path d="M-0.088,-1.0 Q-0.09,-1.11 0,-1.115 Q0.09,-1.11 0.088,-1.0" fill="none" stroke={rim} strokeWidth={0.01} opacity={warm * 0.8} />
      <g opacity={0.75}>
        <circle cx={-0.03} cy={sh - 0.135} r={0.008} fill="#1c140f" />
        <circle cx={0.03} cy={sh - 0.135} r={0.008} fill="#1c140f" />
        <path d={`M-0.012,${sh - 0.085} q0.012,0.004 0.024,0`} stroke="#3a2419" strokeWidth={0.004} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};
