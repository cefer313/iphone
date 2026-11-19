import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONTS, Pkg } from '../config';
import { progress, Reveal } from './anim';
import { Icon } from './Icon';

// ─── Fon: tünd göy, yavaş hərəkət edən yumşaq işıq ───────────
export const Backdrop: React.FC<{ freezeAt?: number }> = ({ freezeAt = Infinity }) => {
  const raw = useCurrentFrame();
  const t = Math.min(raw, freezeAt) / 30;
  const gx = 72 + Math.sin(t * 0.12) * 8;
  const gy = 14 + Math.cos(t * 0.1) * 5;
  const bx = 18 + Math.cos(t * 0.09) * 8;
  const by = 82 + Math.sin(t * 0.11) * 5;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.navy }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at ${gx}% ${gy}%, rgba(200,168,107,0.16), transparent 60%),
            radial-gradient(1000px 1000px at ${bx}% ${by}%, rgba(70,105,170,0.20), transparent 62%)`,
        }}
      />
      {/* kənarlarda yüngül qaralma */}
      <AbsoluteFill style={{ background: 'radial-gradient(130% 90% at 50% 50%, transparent 55%, rgba(5,9,18,0.65) 100%)' }} />
    </AbsoluteFill>
  );
};

// ─── Tipoqrafiya ─────────────────────────────────────────────
export const Kicker: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = COLORS.gold, style }) => (
  <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 38, letterSpacing: '0.04em', color, lineHeight: 1.3, ...style }}>{children}</div>
);

export const Title: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ children, size = 88, style }) => (
  <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: size, lineHeight: 1.12, letterSpacing: '-0.015em', color: COLORS.warm, ...style }}>{children}</div>
);

export const Body: React.FC<{ children: React.ReactNode; size?: number; color?: string; weight?: number; style?: React.CSSProperties }> = ({
  children,
  size = 52,
  color = COLORS.warm,
  weight = 500,
  style,
}) => <div style={{ fontFamily: FONTS.body, fontWeight: weight, fontSize: size, lineHeight: 1.3, color, ...style }}>{children}</div>;

/** Soldan sağa uzanan qızılı xətt. */
export const GoldLine: React.FC<{ start: number; width?: number; duration?: number; style?: React.CSSProperties }> = ({ start, width = 220, duration = 34, style }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, start, duration);
  return (
    <div
      style={{
        height: 4,
        width: width * p,
        borderRadius: 4,
        background: `linear-gradient(90deg, ${COLORS.gold}, rgba(200,168,107,0.25))`,
        boxShadow: '0 0 18px rgba(200,168,107,0.45)',
        ...style,
      }}
    />
  );
};

/** Ümumi kart səthi: yumşaq işıq və kölgə. */
export const cardStyle = (accent = false): React.CSSProperties => ({
  borderRadius: 36,
  background: accent
    ? 'linear-gradient(180deg, rgba(200,168,107,0.12), rgba(200,168,107,0.04))'
    : 'linear-gradient(180deg, rgba(247,245,239,0.075), rgba(247,245,239,0.025))',
  border: `1.5px solid ${accent ? COLORS.goldLine : COLORS.line}`,
  boxShadow: '0 30px 60px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.08)',
});

// ─── Kamera çərçivəsi: künc mötərizələri + REC nişanı ─────────
export const CameraFrame: React.FC<{ start: number; inset?: { top: number; bottom: number; side: number }; rec?: boolean }> = ({
  start,
  inset = { top: 120, bottom: 140, side: 60 },
  rec = true,
}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, start, 40);
  const len = 120 * p;
  const corner = (pos: React.CSSProperties, bt: boolean, lr: boolean): React.CSSProperties => ({
    position: 'absolute',
    width: len,
    height: len,
    borderColor: COLORS.goldLine,
    borderStyle: 'solid',
    borderWidth: 0,
    [bt ? 'borderTopWidth' : 'borderBottomWidth']: 3,
    [lr ? 'borderLeftWidth' : 'borderRightWidth']: 3,
    [bt ? 'borderTopLeftRadius' : 'borderBottomLeftRadius']: lr ? 18 : 0,
    [bt ? 'borderTopRightRadius' : 'borderBottomRightRadius']: lr ? 0 : 18,
    opacity: p,
    ...pos,
  });
  const recOn = Math.floor(frame / 30) % 2 === 0; // saniyədə bir dəfə sakit yanıb-sönmə
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={corner({ top: inset.top, left: inset.side }, true, true)} />
      <div style={corner({ top: inset.top, right: inset.side }, true, false)} />
      <div style={corner({ bottom: inset.bottom, left: inset.side }, false, true)} />
      <div style={corner({ bottom: inset.bottom, right: inset.side }, false, false)} />
      {rec && (
        <div
          style={{
            position: 'absolute',
            top: inset.top + 36,
            right: inset.side + 40,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: interpolate(frame, [start + 30, start + 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#D9534F', opacity: recOn ? 1 : 0.35 }} />
          <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 28, letterSpacing: '0.12em', color: COLORS.muted }}>REC</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── Montaj timeline-ı: yollar, kliplər və hərəkət edən playhead ─
export const Timeline: React.FC<{ start: number; width?: number; height?: number; playheadFrom?: number; playheadTo?: number }> = ({
  start,
  width = 900,
  height = 120,
  playheadFrom,
  playheadTo,
}) => {
  const frame = useCurrentFrame();
  const tracks = [
    [
      [0, 0.28],
      [0.31, 0.62],
      [0.65, 1],
    ],
    [
      [0.08, 0.45],
      [0.5, 0.86],
    ],
    [[0, 1]],
  ];
  const trackH = (height - 16) / 3;
  const ph = progress(frame, playheadFrom ?? start + 20, (playheadTo ?? start + 200) - (playheadFrom ?? start + 20));
  return (
    <div style={{ position: 'relative', width, height }}>
      {tracks.map((clips, ti) =>
        clips.map(([a, b], ci) => {
          const p = progress(frame, start + ti * 8 + ci * 6, 26);
          return (
            <div
              key={`${ti}-${ci}`}
              style={{
                position: 'absolute',
                top: ti * (trackH + 8),
                left: a * width,
                width: (b - a) * width * p,
                height: trackH,
                borderRadius: 8,
                background: ti === 2 ? 'rgba(174,181,194,0.18)' : ti === 0 ? 'rgba(200,168,107,0.45)' : 'rgba(200,168,107,0.24)',
                border: `1px solid ${ti === 2 ? 'rgba(174,181,194,0.3)' : COLORS.goldLine}`,
              }}
            />
          );
        }),
      )}
      <div
        style={{
          position: 'absolute',
          top: -10,
          bottom: -10,
          left: ph * (width - 4),
          width: 3,
          borderRadius: 2,
          background: COLORS.warm,
          boxShadow: '0 0 12px rgba(247,245,239,0.6)',
          opacity: progress(frame, start + 10, 20),
        }}
      />
    </div>
  );
};

// ─── Paket kartı ─────────────────────────────────────────────
export const PackageCard: React.FC<{ pkg: Pkg; delay: number; giftDelay?: number; highlightFrom?: number; highlightTo?: number }> = ({
  pkg,
  delay,
  giftDelay,
  highlightFrom,
  highlightTo,
}) => {
  const frame = useCurrentFrame();
  const c = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  // Açılış zamanı qısa işıq + diktor bu paketi oxuyarkən yumşaq qızılı vurğu.
  const openGlow = interpolate(frame, [delay, delay + 20, delay + 60], [0, 0.7, 0], c);
  const speakGlow =
    highlightFrom !== undefined && highlightTo !== undefined
      ? interpolate(frame, [highlightFrom - 6, highlightFrom + 12, highlightTo - 12, highlightTo], [0, 1, 1, 0], c)
      : 0;
  const glow = Math.max(openGlow, speakGlow);
  return (
    <Reveal delay={delay} y={60} duration={30}>
      <div
        style={{
          ...cardStyle(),
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: `0 30px 60px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 ${40 * glow}px rgba(200,168,107,${0.35 * glow})`,
          borderColor: glow > 0.02 ? `rgba(200,168,107,${0.2 + 0.5 * glow})` : COLORS.line,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 38, letterSpacing: '0.22em', color: COLORS.gold }}>{pkg.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Icon name="camera" size={46} color={COLORS.muted} stroke={2.2} />
            <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 50, color: COLORS.warm }}>{pkg.videos}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 104, lineHeight: 1.05, color: COLORS.warm, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {pkg.price}
          </div>
          <div style={{ fontFamily: FONTS.body, fontWeight: 500, fontSize: 44, color: COLORS.muted }}>{pkg.period}</div>
        </div>
        {pkg.gift && (
          <Reveal delay={giftDelay ?? delay} y={16} style={{ alignSelf: 'flex-start' }}>
          <div
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 26px 12px 18px',
              borderRadius: 999,
              background: COLORS.goldSoft,
              border: `1.5px solid ${COLORS.goldLine}`,
            }}
          >
            <Icon name="gift" size={42} drawStart={(giftDelay ?? delay) + 4} />
            <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 40, color: COLORS.gold }}>{pkg.gift}</div>
          </div>
          </Reveal>
        )}
      </div>
    </Reveal>
  );
};

// ─── Xidmət sətri (ikon + başlıq + alt mətn) ───────────────────
export const ServiceItem: React.FC<{ icon: string; title: string; sub?: string; delay: number; titleSize?: number }> = ({ icon, title, sub, delay, titleSize = 52 }) => (
  <Reveal delay={delay} y={40}>
    <div style={{ ...cardStyle(), padding: '34px 40px', display: 'flex', alignItems: 'center', gap: 34 }}>
      <div
        style={{
          width: 108,
          height: 108,
          borderRadius: 30,
          flex: 'none',
          display: 'grid',
          placeItems: 'center',
          background: COLORS.goldSoft,
          border: `1.5px solid ${COLORS.goldLine}`,
        }}
      >
        <Icon name={icon} size={58} drawStart={delay + 6} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: titleSize, lineHeight: 1.18, color: COLORS.warm }}>{title}</div>
        {sub && <div style={{ fontFamily: FONTS.body, fontWeight: 500, fontSize: 38, lineHeight: 1.3, color: COLORS.muted }}>{sub}</div>}
      </div>
    </div>
  </Reveal>
);
