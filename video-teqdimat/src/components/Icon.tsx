import React from 'react';
import { useCurrentFrame } from 'remotion';
import { COLORS } from '../config';
import { progress } from './anim';

// Sadə xətti ikonlar (48×48 sahə). Hər forma `pathLength=1` ilə "çəkilərək" görünür.
const SHAPES: Record<string, string[]> = {
  target: ['M24 6a18 18 0 1 0 0.01 0', 'M24 13a11 11 0 1 0 0.01 0', 'M24 20a4 4 0 1 0 0.01 0', 'M24 24L40 8', 'M34 8h6v6'],
  bulb: ['M24 6a12 12 0 0 0-7 21.7c1.3 1 2 2.4 2 4V34h10v-2.3c0-1.6.7-3 2-4A12 12 0 0 0 24 6z', 'M19 39h10', 'M21 43h6'],
  script: ['M12 5h17l8 8v30H12z', 'M29 5v8h8', 'M18 22h13', 'M18 28h13', 'M18 34h8'],
  camera: ['M5 15h26v19H5z', 'M31 21l12-6v19l-12-6', 'M10 10h8'],
  timeline: ['M7 8v32', 'M7 12h16v7H7', 'M26 12h15v7H26z', 'M13 25h20v7H13z', 'M24 5v38'],
  chat: ['M7 9h34v23H21l-8 7v-7H7z', 'M14 18h20', 'M14 24h12'],
  profile: ['M20 8a12 12 0 1 0 0.01 0', 'M29 29l12 12', 'M20 13a4 4 0 1 0 0.01 0', 'M13 27c2-4 12-4 14 0'],
  chart: ['M7 41h34', 'M12 41V29', 'M21 41V21', 'M30 41V25', 'M39 41V13', 'M10 23l10-9 9 5 11-11'],
  users: ['M18 11a6 6 0 1 0 0.01 0', 'M6 39c0-7 5-11 12-11s12 4 12 11', 'M33 14a5 5 0 1 0 0.01 0', 'M34 28c5 0 9 3 9 9'],
  plan: ['M10 6h28v36H10z', 'M16 17l3 3 5-6', 'M28 17h5', 'M16 29l3 3 5-6', 'M28 29h5'],
  compass: ['M24 6a18 18 0 1 0 0.01 0', 'M31 17l-4 10-10 4 4-10z'],
  check: ['M10 25l9 9 19-19'],
  arrow: ['M6 24h32', 'M28 14l10 10-10 10'],
  gift: ['M8 18h32v8H8z', 'M11 26h26v15H11z', 'M24 18v23', 'M24 18c-4-8-12-8-10-2 1 2 6 2 10 2z', 'M24 18c4-8 12-8 10-2-1 2-6 2-10 2z'],
  clockFace: ['M24 6a18 18 0 1 0 0.01 0'],
  instagram: ['M9 9h30v30H9z', 'M24 17a7 7 0 1 0 0.01 0', 'M33 14h0.01'],
  phone: ['M14 5h20v38H14z', 'M21 38h6'],
  dot: ['M24 20a4 4 0 1 0 0.01 0'],
};

export type IconName = keyof typeof SHAPES;

export const Icon: React.FC<{
  name: IconName | string;
  size?: number;
  color?: string;
  stroke?: number;
  drawStart?: number; // kadr; verilməzsə ikon dərhal tam görünür
  drawDuration?: number;
}> = ({ name, size = 56, color = COLORS.gold, stroke = 2.4, drawStart, drawDuration = 30 }) => {
  const frame = useCurrentFrame();
  const p = drawStart === undefined ? 1 : progress(frame, drawStart, drawDuration);
  const paths = SHAPES[name] ?? SHAPES.dot;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ display: 'block', flex: 'none' }}>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={p >= 1 ? undefined : 1}
          strokeDashoffset={p >= 1 ? undefined : 1 - p}
        />
      ))}
    </svg>
  );
};

/** Dairəvi qızılı haşiyəli ikon nişanı. */
export const IconBadge: React.FC<{ name: string; size?: number; drawStart?: number }> = ({ name, size = 112, drawStart }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      flex: 'none',
      display: 'grid',
      placeItems: 'center',
      background: `radial-gradient(circle at 30% 25%, rgba(200,168,107,0.22), rgba(200,168,107,0.06) 70%)`,
      border: `1.5px solid ${COLORS.goldLine}`,
      boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
    }}
  >
    <Icon name={name} size={size * 0.5} drawStart={drawStart} />
  </div>
);
