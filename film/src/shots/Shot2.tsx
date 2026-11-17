import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import T from '../data/timeline.json';
import {kf, lagged, lerp, ramp} from '../lib/math';
import {H, W} from '../lib/camera';
import {C} from '../lib/palette';
import {mix} from '../rig/Figure';
import {Finger, FingerShape} from '../rig/Hand2D';

const B = T.s2;

/** Hand lift (px) used for the adjustment: up, then a little lower to rest. */
const handLift = (f: number) => kf(f, [B.liftStart, B.liftPeak, B.settleEnd], [0, -30, -12]);

/** SHOT 2 - The weight he carries: close on the hand at the sack's tied neck. */
export const Shot2: React.FC = () => {
  const f = useCurrentFrame();
  const breath = Math.sin((f / 110) * Math.PI * 2) * 5;
  const lift = handLift(f);
  const shoulder = breath + lift * 0.35;
  // sack body trails the hand: critically damped, no bounce
  const bodyLift = lagged(handLift, f, 5, 22);
  const swing = (lagged((t) => handLift(t), f, 3, 10) - lift) * 0.06; // degrees
  const tight = ramp(f, B.tightenStart, B.tightenEnd);
  const heft = ramp(f, B.liftStart - 4, B.liftStart + 8) * (1 - ramp(f, B.liftPeak + 6, B.settleEnd));
  const curl = 0.55 + 0.3 * tight + 0.12 * heft;

  const hx = 470, hy = 560 + lift + breath * 0.5;
  const K = 2.15; // close-up magnification of the hand group
  const knuckles = [0, 1, 2, 3].map((i) => ({x: hx - 52 + i * 36, y: hy + 40 + Math.abs(i - 1.4) * 4}));
  const fingers: Finger[] = knuckles.map((k, i) => ({
    base: k,
    dir: 92 - (i - 1.5) * 3,
    segs: [{len: 46 - Math.abs(i - 1.2) * 4, w: 33 - i * 1.5}, {len: 34 - i, w: 30 - i * 1.4}, {len: 26 - i, w: 27 - i * 1.3}],
    curl: [lerp(-4, 3, curl), lerp(2, 9, curl), lerp(4, 12, curl)],
  }));
  const skin = mix(C.skin, '#8d6a55', 0.25);
  const skinLit = mix(C.skin, '#9fa8c4', 0.2);

  return (
    <AbsoluteFill style={{background: C.night}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#151b2e" />
            <stop offset="1" stopColor="#0c0f19" />
          </linearGradient>
          <radialGradient id="bokehW" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={C.amberSoft} stopOpacity={0.55} />
            <stop offset="1" stopColor={C.amber} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="bokehC" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#6d7aa0" stopOpacity={0.35} />
            <stop offset="1" stopColor="#6d7aa0" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="robe2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.robeLit} />
            <stop offset="0.45" stopColor={C.robe} />
            <stop offset="1" stopColor={C.robeShade} />
          </linearGradient>
          <linearGradient id="sack2" x1="0" y1="0" x2="1" y2="0.6">
            <stop offset="0" stopColor={C.sackLit} />
            <stop offset="0.5" stopColor={C.sack} />
            <stop offset="1" stopColor={C.sackShade} />
          </linearGradient>
          <linearGradient id="head2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.headClothLit} />
            <stop offset="0.6" stopColor={C.headCloth} />
            <stop offset="1" stopColor={C.headClothShade} />
          </linearGradient>
          <pattern id="weave2" patternUnits="userSpaceOnUse" width={256} height={256} patternTransform="scale(0.9)">
            <image href={staticFile('tex/weave.png')} width={256} height={256} />
          </pattern>
          <pattern id="burlap2" patternUnits="userSpaceOnUse" width={256} height={256} patternTransform="scale(0.75)">
            <image href={staticFile('tex/burlap.png')} width={256} height={256} />
          </pattern>
        </defs>
        {/* out-of-focus street behind */}
        <rect width={W} height={H} fill="url(#bg2)" />
        <ellipse cx={880} cy={520} rx={420} ry={700} fill="#3a4360" opacity={0.35} />
        <ellipse cx={170} cy={1150} rx={300} ry={600} fill="#252b40" opacity={0.5} />
        <circle cx={905} cy={600} r={95} fill="url(#bokehW)" />
        <circle cx={905} cy={600} r={26} fill={C.amberSoft} opacity={0.18} />
        {[[760, 330, 60], [990, 260, 44], [640, 210, 38], [1010, 900, 52]].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="url(#bokehC)" />
        ))}

        <g transform={`translate(0, ${shoulder})`}>
          {/* the back of the head covering, mostly out of frame */}
          <path d="M-60,520 C-60,250 40,90 150,60 C230,40 280,120 270,260 C262,360 220,440 150,500 Z" fill="url(#head2)" />
          <path d="M-50,380 C40,420 170,420 262,360" stroke={C.headClothShade} strokeWidth={12} fill="none" opacity={0.22} />
          <path d="M-60,470 C40,520 140,560 210,600 C150,640 60,660 -60,650Z" fill={C.headClothShade} opacity={0.8} />
          {/* robe over the right shoulder and upper back */}
          <path d="M-40,1920 L-40,640 C80,610 250,640 420,700 C600,760 820,840 980,960 C1080,1040 1120,1200 1120,1920 Z" fill="url(#robe2)" />
          <path d="M-40,1920 L-40,640 C80,610 250,640 420,700 C600,760 820,840 980,960 C1080,1040 1120,1200 1120,1920 Z" fill="url(#weave2)" opacity={0.25} style={{mixBlendMode: 'multiply'}} />
          <path d="M-40,650 C80,620 250,650 420,712 C600,772 820,852 980,972" stroke="#9ba5c4" strokeWidth={5} fill="none" opacity={0.2} />
          <path d="M420,1000 C460,1200 470,1500 440,1920" stroke={C.robeShade} strokeWidth={16} fill="none" opacity={0.35} />
          <path d="M760,1060 C800,1250 820,1500 810,1920" stroke={C.robeShade} strokeWidth={12} fill="none" opacity={0.3} />
        </g>

        {/* sack body resting on his back, following the hand with a soft lag */}
        <g transform={`translate(0, ${bodyLift * 0.85 + breath * 0.6}) rotate(${swing} ${hx} ${hy + 300})`}>
          <path d={`M${hx - 70},${hy + 330} C${hx - 330},${hy + 470} ${hx - 470},${hy + 900} ${hx - 440},${hy + 1500} L${hx + 640},${hy + 1500} C${hx + 640},${hy + 900} ${hx + 380},${hy + 470} ${hx + 90},${hy + 330} Z`} fill="url(#sack2)" />
          <path d={`M${hx - 70},${hy + 330} C${hx - 330},${hy + 470} ${hx - 470},${hy + 900} ${hx - 440},${hy + 1500} L${hx + 640},${hy + 1500} C${hx + 640},${hy + 900} ${hx + 380},${hy + 470} ${hx + 90},${hy + 330} Z`} fill="url(#burlap2)" opacity={0.4} style={{mixBlendMode: 'multiply'}} />
          <g stroke={C.sackShade} strokeWidth={9} fill="none" opacity={0.45} strokeLinecap="round">
            <path d={`M${hx - 20},${hy + 350} Q${hx - 220},${hy + 700} ${hx - 230},${hy + 1200}`} />
            <path d={`M${hx + 40},${hy + 350} Q${hx + 230},${hy + 640} ${hx + 330},${hy + 1150}`} />
            <path d={`M${hx + 10},${hy + 360} Q${hx + 30},${hy + 700} ${hx + 60},${hy + 1000}`} />
          </g>
        </g>

        {/* gathered neck, tie, and the hand (magnified close-up) */}
        <g transform={`translate(${hx},${hy}) scale(${K}) translate(${-hx},${-hy})`}>
          <path d={`M${hx - 44},${hy + 25} C${hx - 50},${hy + 80} ${hx - 40},${hy + 130} ${hx - 36},${hy + 160 + (bodyLift - lift) * 0.2}
              L${hx + 46},${hy + 160 + (bodyLift - lift) * 0.2} C${hx + 50},${hy + 120} ${hx + 52},${hy + 70} ${hx + 46},${hy + 25} Z`} fill={C.sack} />
          <path d={`M${hx - 44},${hy + 25} C${hx - 50},${hy + 80} ${hx - 40},${hy + 130} ${hx - 32},${hy + 160}`} stroke={C.sackShade} strokeWidth={6} fill="none" opacity={0.6} />
          <path d={`M${hx - 52},${hy + 112} Q${hx},${hy + 128} ${hx + 54},${hy + 110}`} stroke={C.cord} strokeWidth={17} fill="none" strokeLinecap="round" />
          <path d={`M${hx + 40},${hy + 116} q22,22 10,58`} stroke={C.cord} strokeWidth={9} fill="none" strokeLinecap="round" />
          {/* gathered tuft above the grip */}
          <path d={`M${hx - 40},${hy + 10} C${hx - 70},${hy - 50} ${hx - 30},${hy - 92} ${hx + 6},${hy - 70} C${hx + 50},${hy - 98} ${hx + 82},${hy - 40} ${hx + 44},${hy + 10}Z`} fill={C.sackLit} />
          <path d={`M${hx - 10},${hy - 60} q8,40 -4,66 M${hx + 24},${hy - 66} q-2,40 6,70`} stroke={C.sackShade} strokeWidth={5} fill="none" opacity={0.5} />
          {/* back of the hand */}
          <path d={`M${hx - 70},${hy + 44} C${hx - 80},${hy - 10} ${hx - 60},${hy - 70} ${hx - 10},${hy - 84}
              C${hx + 50},${hy - 96} ${hx + 90},${hy - 50} ${hx + 82},${hy + 48} Z`} fill={skin} />
          <path d={`M${hx - 40},${hy - 70} C${hx - 20},${hy - 40} ${hx - 30},${hy} ${hx - 40},${hy + 36}`} stroke={C.skinShade} strokeWidth={4} fill="none" opacity={0.25 + 0.3 * tight} />
          <path d={`M${hx + 10},${hy - 78} C${hx + 12},${hy - 40} ${hx + 4},${hy} ${hx},${hy + 40}`} stroke={C.skinShade} strokeWidth={4} fill="none" opacity={0.25 + 0.3 * tight} />
          <path d={`M${hx + 50},${hy - 66} C${hx + 50},${hy - 30} ${hx + 44},${hy + 8} ${hx + 40},${hy + 40}`} stroke={C.skinShade} strokeWidth={4} fill="none" opacity={0.2 + 0.3 * tight} />
          {fingers.map((fg, i) => (
            <FingerShape key={i} f={fg} fill={i === 0 ? skinLit : skin} shade={C.skinShade} crease={0.45 + 0.35 * tight} />
          ))}
          {knuckles.map((k, i) => (
            <path key={i} d={`M${k.x - 12},${k.y - 2} Q${k.x},${k.y - 10} ${k.x + 12},${k.y - 2}`} stroke="#b29682" strokeWidth={3}
              fill="none" opacity={0.2 + 0.3 * tight} strokeLinecap="round" />
          ))}
          {/* thumb pressing along the near side of the neck */}
          <FingerShape
            f={{base: {x: hx - 64, y: hy + 6}, dir: 78, segs: [{len: 50, w: 36}, {len: 38, w: 31}], curl: [lerp(4, 10, curl), lerp(-10, -2, curl)]}}
            fill={skinLit} shade={C.skinShade} crease={0.5}
          />
          {/* fabric lip in front of the fingertips: they are tucked around the neck */}
          <path d={`M${hx - 70},${hy + 150} C${hx - 30},${hy + 136} ${hx + 40},${hy + 136} ${hx + 70},${hy + 150} L${hx + 62},${hy + 168} C${hx + 20},${hy + 156} ${hx - 30},${hy + 156} ${hx - 62},${hy + 168}Z`} fill={C.sack} opacity={0.9} />
          {/* the wrist turns forward over the shoulder, away from us, into the sleeve */}
          <path d={`M${hx - 10},${hy - 86} C${hx + 20},${hy - 104} ${hx + 60},${hy - 106} ${hx + 92},${hy - 92} L${hx + 96},${hy - 30} C${hx + 90},${hy - 14} ${hx + 86},${hy + 2} ${hx + 82},${hy + 16} Z`} fill={C.robeShade} opacity={0.92} />
          <path d={`M${hx + 8},${hy - 104} C${hx + 50},${hy - 122} ${hx + 90},${hy - 118} ${hx + 112},${hy - 108}`} stroke={C.robe} strokeWidth={5} fill="none" opacity={0.6} />
        </g>
        <rect width={W} height={H} fill="#0a0e1c" opacity={0.12} />
      </svg>
    </AbsoluteFill>
  );
};
