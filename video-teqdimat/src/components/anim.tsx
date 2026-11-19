import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { SAFE } from '../config';

// Sakit, "inamlı" hərəkət: sürətli başlanğıc, yumşaq dayanma, sıçrayış yoxdur.
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 0→1 irəliləyiş: `start` kadrından `duration` kadr ərzində. */
export const progress = (frame: number, start: number, duration = 24) =>
  interpolate(frame, [start, start + duration], [0, 1], { ...clamp, easing: EASE });

/** Mətn və bloklar üçün yumşaq açılış (şəffaflıq + yuxarı hərəkət + yüngül fokus). */
export const Reveal: React.FC<{
  delay: number;
  duration?: number;
  y?: number;
  blur?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay, duration = 26, y = 36, blur = true, style, children }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, delay, duration);
  const done = p >= 1;
  return (
    <div
      style={{
        opacity: p,
        // Tam açıldıqdan sonra transform/filter götürülür ki, mətn və qiymətlər tam sabit qalsın.
        transform: done ? undefined : `translateY(${((1 - p) * y).toFixed(2)}px)`,
        filter: done || !blur ? undefined : `blur(${((1 - p) * 6).toFixed(2)}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Səhnə qabı: təhlükəsiz kənar boşluqları + yumşaq giriş/çıxış. */
export const SceneShell: React.FC<{
  duration: number;
  fadeOut?: boolean;
  children: React.ReactNode;
  justify?: React.CSSProperties['justifyContent'];
}> = ({ duration, fadeOut = true, children, justify = 'flex-start' }) => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [0, 14], [0, 1], clamp);
  const outP = fadeOut ? interpolate(frame, [duration - 14, duration], [1, 0], clamp) : 1;
  return (
    <AbsoluteFill style={{ opacity: Math.min(inP, outP) }}>
      <AbsoluteFill
        style={{
          paddingTop: SAFE.top,
          paddingBottom: SAFE.bottom,
          paddingLeft: SAFE.side,
          paddingRight: SAFE.side,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: justify,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
