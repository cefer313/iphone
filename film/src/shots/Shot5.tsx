import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import T from '../data/timeline.json';
import {V2, kf, lerp, ramp, rng} from '../lib/math';
import {H, W} from '../lib/camera';
import {C} from '../lib/palette';
import {mix} from '../rig/Figure';
import {Finger, FingerShape} from '../rig/Hand2D';
import {flicker} from '../env/World';

const B = T.s5;
const OFFER: V2 = {x: 380, y: 1020};
const BREAD_OFF: V2 = {x: 74, y: -52};

/** His hand (palm centre). It eases in, holds while offering, then withdraws after release. */
const hisHand = (f: number): V2 => ({
  x: kf(f, [0, 24, B.releaseEnd, B.withdrawEnd], [OFFER.x - 70, OFFER.x, OFFER.x - 6, OFFER.x - 190]),
  y: kf(f, [0, 24, B.releaseEnd, B.withdrawEnd], [OFFER.y + 26, OFFER.y, OFFER.y + 10, OFFER.y + 70]),
});
const breadHeld = (f: number): V2 => {
  const h = hisHand(Math.min(f, B.bothEnd));
  return {x: h.x + BREAD_OFF.x, y: h.y + BREAD_OFF.y};
};
/** Where the child's cupped hands meet the bread (contact point, under its right half). */
const CONTACT = (() => {
  const b = breadHeld(B.bothEnd);
  return {x: b.x + 34, y: b.y + 46};
})();
const childHands = (f: number): V2 => {
  const breathe = Math.sin(f * 0.085) * 3 * ramp(f, B.drawEnd, B.drawEnd + 10);
  return {
    x: kf(f, [B.reachStart, B.touch, B.bothEnd, B.drawEnd], [1180, CONTACT.x, CONTACT.x, CONTACT.x + 175]),
    y: kf(f, [B.reachStart, B.touch, B.bothEnd, B.drawEnd], [1090, CONTACT.y, CONTACT.y, CONTACT.y - 22]) + breathe,
  };
};
/** The bread is attached to his hand until he lets go, then to the child's hands. */
const breadAt = (f: number): V2 => {
  if (f <= B.bothEnd) return breadHeld(f);
  const c = childHands(f), c0 = childHands(B.bothEnd), b0 = breadHeld(B.bothEnd);
  return {x: c.x + (b0.x - c0.x), y: c.y + (b0.y - c0.y)};
};

const Bread: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => {
  const r = rng(31);
  const spots = Array.from({length: 16}, () => ({x: -80 + r() * 160, y: -16 + r() * 22, s: 4 + r() * 8}));
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <path d="M-104,12 C-104,-30 -40,-44 20,-42 C80,-40 112,-18 104,10 L88,20 L70,12 L52,24 L30,16 L10,26 L-14,18 L-36,26 L-60,16 L-84,24 Z" fill={C.breadDark} />
      <path d="M-100,4 C-98,-34 -38,-46 20,-44 C78,-42 106,-22 100,2 C60,-8 -40,-10 -100,4Z" fill={C.bread} />
      <path d="M-70,-20 C-30,-36 40,-38 80,-22" stroke={C.breadLight} strokeWidth={10} fill="none" opacity={0.45} strokeLinecap="round" />
      {spots.map((s, i) => <ellipse key={i} cx={s.x} cy={s.y - 18} rx={s.s} ry={s.s * 0.45} fill={C.breadDark} opacity={0.5} />)}
      <path d="M-104,12 L-84,24 L-60,16 L-36,26 L-14,18 L10,26 L30,16 L52,24 L70,12 L88,20" stroke="#e9d2a6" strokeWidth={3} fill="none" opacity={0.6} />
    </g>
  );
};

/** SHOT 5 - The hands: offering bread at the child's height; a clean, physical handoff. */
export const Shot5: React.FC = () => {
  const f = useCurrentFrame();
  const fl = flicker(f + 600);
  const h = hisHand(f);
  const c = childHands(f);
  const b = breadAt(f);
  const release = ramp(f, B.bothEnd, B.releaseEnd);
  const grasp = ramp(f, B.bothEnd - 4, B.bothEnd + 14);
  const breath = Math.sin(f * 0.07) * 2;
  const skin = mix(C.skin, C.skinWarm, 0.45);
  const skinShade = mix(C.skinShade, C.skin, 0.2);
  const cSkin = mix(mix(C.skin, C.skinWarm, 0.6), '#c08a64', 0.25);

  // his fingers support from below; the thumb holds the bread down until release
  const hisFingers: Finger[] = [0, 1, 2, 3].map((i) => ({
    base: {x: h.x + 58 - i * 4, y: h.y - 12 + i * 9 + breath},
    dir: -4 + i * 3,
    segs: [{len: 40 - i * 3, w: 27 - i * 1.5}, {len: 30 - i * 2, w: 24 - i * 1.4}, {len: 22 - i, w: 21 - i * 1.2}],
    curl: [lerp(-14, -6, release), lerp(-30, -18, release), lerp(-26, -12, release)],
  }));
  const thumb: Finger = {
    base: {x: h.x - 4, y: h.y - 30 + breath},
    dir: lerp(-38, -72, release),
    segs: [{len: 46, w: 30}, {len: 36, w: 26}],
    curl: [lerp(30, 8, release), lerp(42, 14, release)],
  };
  // child's two hands, cupped palms up, coming from the right
  const childHand = (o: V2, k: number, lit: number) => {
    const p = {x: c.x + o.x, y: c.y + o.y};
    const fingers: Finger[] = [0, 1, 2, 3].map((i) => ({
      base: {x: p.x - 36, y: p.y - 6 + i * 6},
      dir: 186 + i * 3,
      segs: [{len: 24 - i * 1.5, w: 17 - i}, {len: 18 - i, w: 15 - i}, {len: 14 - i * 0.5, w: 13 - i * 0.8}],
      curl: [14 + 6 * grasp, 22 + 8 * grasp, 18 + 6 * grasp],
    }));
    return {p, fingers, k, lit};
  };
  const ch = [childHand({x: 0, y: 0}, 0, 1), childHand({x: 44, y: 16}, 1, 0.75)];
  const cThumb = (p: V2): Finger => ({
    base: {x: p.x - 16, y: p.y - 20},
    dir: lerp(-120, -150, grasp),
    segs: [{len: 24, w: 17}, {len: 19, w: 15}],
    curl: [lerp(-10, -38, grasp), lerp(-10, -40, grasp)],
  });

  return (
    <AbsoluteFill style={{background: '#120e10'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="bg5" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#121726" />
            <stop offset="0.45" stopColor="#2a2120" />
            <stop offset="1" stopColor="#6e4a2a" />
          </linearGradient>
          <radialGradient id="lamp5" cx="0.86" cy="0.36" r="0.6">
            <stop offset="0" stopColor={C.amberSoft} stopOpacity={0.55 * fl} />
            <stop offset="0.5" stopColor={C.amber} stopOpacity={0.16 * fl} />
            <stop offset="1" stopColor={C.amber} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="sleeve5" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.robeLit} />
            <stop offset="0.6" stopColor={C.robe} />
            <stop offset="1" stopColor={C.robeShade} />
          </linearGradient>
          <linearGradient id="csleeve5" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mix(C.childTunic, C.amberSoft, 0.2)} />
            <stop offset="1" stopColor={C.childTunicShade} />
          </linearGradient>
          <linearGradient id="fade5" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#120c0a" stopOpacity={0} />
            <stop offset="1" stopColor="#120c0a" stopOpacity={0.85} />
          </linearGradient>
          <pattern id="weave5" patternUnits="userSpaceOnUse" width={256} height={256}>
            <image href={staticFile('tex/weave.png')} width={256} height={256} />
          </pattern>
          <pattern id="mat5" patternUnits="userSpaceOnUse" width={512} height={512} patternTransform="scale(1.6)">
            <image href={staticFile('tex/mat.png')} width={512} height={512} />
          </pattern>
        </defs>
        {/* soft background: night at left, lamplit room at right, mat below */}
        <rect width={W} height={H} fill="url(#bg5)" />
        <rect width={W} height={H} fill="url(#lamp5)" />
        <ellipse cx={860} cy={700} rx={360} ry={720} fill="#8b6040" opacity={0.14} />
        <ellipse cx={600} cy={760} rx={40} ry={760} fill="#1b130e" opacity={0.25} />
        <path d={`M0,1400 L${W},1340 L${W},${H} L0,${H}Z`} fill="#3b2d22" />
        <path d={`M0,1400 L${W},1340 L${W},${H} L0,${H}Z`} fill="url(#mat5)" opacity={0.18} style={{mixBlendMode: 'overlay'}} />
        <rect x={0} y={1300} width={W} height={620} fill="url(#fade5)" />
        <circle cx={930} cy={430} r={120} fill={C.amberSoft} opacity={0.1 * fl} />
        <circle cx={930} cy={430} r={46} fill={C.amberSoft} opacity={0.12 * fl} />
        <g transform="translate(540 1010) scale(1.75) translate(-470 -1010)">

        {/* child's sleeves and cupped hands (slightly farther from us than his hand) */}
        {ch.map(({p, k}) => (
          <path key={`cs${k}`} d={`M${W + 60},${p.y - 60} L${p.x + 70},${p.y - 44} C${p.x + 50},${p.y - 20} ${p.x + 50},${p.y + 24} ${p.x + 72},${p.y + 42} L${W + 60},${p.y + 70}Z`}
            fill="url(#csleeve5)" />
        ))}
        {ch.map(({p, fingers, k, lit}) => (
          <g key={`ch${k}`}>
            <ellipse cx={p.x + 22} cy={p.y + 2} rx={52} ry={30} fill={mix(C.skinShade, cSkin, lit)} />
            <ellipse cx={p.x + 4} cy={p.y + 14} rx={40} ry={12} fill={C.skinShade} opacity={0.35} />
            {fingers.map((fg, i) => <FingerShape key={i} f={fg} fill={mix(C.skinShade, cSkin, lit * (1 - i * 0.08))} shade={C.skinShade} />)}
          </g>
        ))}

        {/* his sleeve, wrist, palm and supporting fingers */}
        <path d={`M-60,${h.y - 100} C${h.x - 300},${h.y - 120} ${h.x - 190},${h.y - 92} ${h.x - 118},${h.y - 70}
            C${h.x - 96},${h.y - 30} ${h.x - 96},${h.y + 40} ${h.x - 116},${h.y + 74} C${h.x - 220},${h.y + 110} ${h.x - 330},${h.y + 130} -60,${h.y + 150}Z`} fill="url(#sleeve5)" />
        <path d={`M-60,${h.y - 100} C${h.x - 300},${h.y - 120} ${h.x - 190},${h.y - 92} ${h.x - 118},${h.y - 70} C${h.x - 96},${h.y - 30} ${h.x - 96},${h.y + 40} ${h.x - 116},${h.y + 74} C${h.x - 220},${h.y + 110} ${h.x - 330},${h.y + 130} -60,${h.y + 150}Z`}
          fill="url(#weave5)" opacity={0.22} style={{mixBlendMode: 'multiply'}} />
        <path d={`M${h.x - 200},${h.y - 40} C${h.x - 170},${h.y} ${h.x - 170},${h.y + 40} ${h.x - 200},${h.y + 90}`} stroke={C.robeShade} strokeWidth={10} fill="none" opacity={0.4} />
        <path d={`M${h.x - 112},${h.y - 40} L${h.x - 40},${h.y - 34 + breath} L${h.x - 40},${h.y + 34 + breath} L${h.x - 112},${h.y + 40}Z`} fill={skinShade} />
        <g transform={`rotate(-5 ${h.x} ${h.y})`}>
          <ellipse cx={h.x + 10} cy={h.y + breath} rx={78} ry={40} fill={skin} />
          <ellipse cx={h.x + 4} cy={h.y + 22 + breath} rx={64} ry={14} fill={C.skinShade} opacity={0.4} />
        </g>
        {[...hisFingers].reverse().map((fg, i) => (
          <FingerShape key={i} f={fg} fill={mix(skinShade, skin, 0.35 + i * 0.2)} shade={C.skinShade} />
        ))}

        {/* the bread */}
        <Bread x={b.x} y={b.y} rot={kf(f, [B.bothEnd, B.drawEnd], [-3, -6])} />

        {/* child's thumbs close over the bread once it is theirs */}
        {ch.map(({p, k, lit}) => (
          <g key={`ct${k}`} opacity={0.35 + 0.65 * grasp}>
            <FingerShape f={cThumb(p)} fill={mix(C.skinShade, cSkin, lit)} shade={C.skinShade} />
          </g>
        ))}
        {/* his thumb rests on top of the bread until he lets go */}
        <FingerShape f={thumb} fill={skin} shade={C.skinShade} crease={0.55} />
        </g>
        <rect width={W} height={H} fill="#1a0f08" opacity={0.08} />
      </svg>
    </AbsoluteFill>
  );
};
