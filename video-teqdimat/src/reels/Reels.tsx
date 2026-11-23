import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { COURSE_TITLE, CTA, NOTIFS, R_COLORS as C, SCENES, SKILLS } from './content';
import timeline from './timeline.json';

const FONT_HEAD = "'Montserrat', 'Inter', sans-serif";
const FONT_BODY = "'Inter', 'Montserrat', sans-serif";
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const prog = (f: number, start: number, dur = 12) => interpolate(f, [start, start + dur], [0, 1], { ...clamp, easing: EASE });

type TL = { fps: number; total: number; scenes: { id: string; from: number; duration: number; voice: string; voiceOffset: number; clipRate: number }[]; music: string; sfx: { file: string; at: number; volume: number }[] };
const T = timeline as TL;

// ─── Altyazı: *qızılı*, ~çəhrayı~, _yaşıl_ vurğu ─────────────
const renderRich = (text: string) => {
  const parts = text.split(/(\*[^*]+\*|~[^~]+~|_[^_]+_)/g).filter(Boolean);
  return parts.map((p, i) => {
    const mark = p[0];
    const inner = p.slice(1, -1);
    if (mark === '*' && p.endsWith('*')) return <span key={i} style={{ color: C.gold }}>{inner}</span>;
    if (mark === '~' && p.endsWith('~')) return <span key={i} style={{ color: C.rose }}>{inner}</span>;
    if (mark === '_' && p.endsWith('_')) return <span key={i} style={{ color: C.mint }}>{inner}</span>;
    return <span key={i}>{p}</span>;
  });
};

const Caption: React.FC<{ text: string; duration: number; top?: boolean }> = ({ text, duration, top }) => {
  const f = useCurrentFrame();
  const p = prog(f, 3, 12);
  const out = interpolate(f, [duration - 6, duration], [1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        ...(top ? { top: 260 } : { bottom: 420 }),
        display: 'flex',
        justifyContent: 'center',
        opacity: Math.min(p, out),
        transform: `translateY(${((1 - p) * 30).toFixed(1)}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_HEAD,
          fontWeight: 800,
          fontSize: 60,
          lineHeight: 1.22,
          color: C.white,
          textAlign: 'center',
          textShadow: '0 4px 18px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.9)',
          letterSpacing: '-0.01em',
          textWrap: 'balance' as React.CSSProperties['textWrap'],
        }}
      >
        {renderRich(text)}
      </div>
    </div>
  );
};

// ─── İkonlar (sadə xətti) ────────────────────────────────────
const ICONS: Record<string, string[]> = {
  user: ['M24 8a7 7 0 1 0 0.01 0', 'M10 40c0-8 6-13 14-13s14 5 14 13'],
  doc: ['M12 5h17l8 8v30H12z', 'M29 5v8h8', 'M18 22h13', 'M18 29h13', 'M18 36h8'],
  bank: ['M6 18L24 7l18 11z', 'M10 20v15', 'M19 20v15', 'M29 20v15', 'M38 20v15', 'M6 39h36'],
  mail: ['M6 11h36v26H6z', 'M6 12l18 14 18-14'],
  calc: ['M11 5h26v38H11z', 'M16 10h16v8H16z', 'M17 25h0.1', 'M24 25h0.1', 'M31 25h0.1', 'M17 32h0.1', 'M24 32h0.1', 'M31 32h0.1'],
  shield: ['M24 5l16 6v12c0 10-7 17-16 20C15 40 8 33 8 23V11z', 'M17 24l5 5 9-10'],
  check: ['M10 25l9 9 19-19'],
  arrow: ['M6 24h32', 'M28 14l10 10-10 10'],
};
const Ico: React.FC<{ name: string; size?: number; color?: string; stroke?: number }> = ({ name, size = 44, color = C.white, stroke = 3 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ flex: 'none' }}>
    {(ICONS[name] ?? ICONS.doc).map((d, i) => (
      <path key={i} d={d} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    ))}
  </svg>
);

// ─── Telefon bildirişi kartı ────────────────────────────────
const Notif: React.FC<{ icon: string; app: string; text: string; at: number; index: number }> = ({ icon, app, text, at, index }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 14);
  const shake = f >= at && f < at + 10 ? Math.sin((f - at) * 2.2) * (10 - (f - at)) * 0.6 : 0;
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${((1 - p) * -60).toFixed(1)}px) translateX(${shake.toFixed(1)}px) scale(${(0.94 + 0.06 * p).toFixed(3)})`,
        background: 'rgba(250, 250, 252, 0.93)',
        borderRadius: 34,
        padding: '22px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
        marginLeft: index % 2 ? 26 : 0,
        marginRight: index % 2 ? 0 : 26,
      }}
    >
      <div style={{ width: 76, height: 76, borderRadius: 20, background: C.rose, display: 'grid', placeItems: 'center', flex: 'none' }}>
        <Ico name={icon} size={46} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 30, color: '#1A1D26' }}>{app}</span>
          <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 26, color: '#8A8F9C' }}>indi</span>
        </div>
        <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 34, lineHeight: 1.25, color: '#2B2F3A' }}>{text}</span>
      </div>
    </div>
  );
};

const NotifStack: React.FC<{ items: { icon: string; app: string; text: string }[]; spacing: number }> = ({ items, spacing }) => (
  <div style={{ position: 'absolute', top: 230, left: 60, right: 60, display: 'flex', flexDirection: 'column', gap: 20 }}>
    {items.map((n, i) => (
      <Notif key={n.text} {...n} at={8 + i * spacing} index={i} />
    ))}
  </div>
);

// ─── Overlay-lər ─────────────────────────────────────────────
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const p = prog(f, 2, 14);
  return (
    <div style={{ position: 'absolute', top: 230, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: p }}>
      <div style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 92, color: C.white, letterSpacing: '0.02em', textShadow: '0 6px 24px rgba(0,0,0,0.8)' }}>
        TƏSƏVVÜR EDİN…
      </div>
    </div>
  );
};

const Question: React.FC = () => {
  const f = useCurrentFrame();
  const p = prog(f, 4, 16);
  return (
    <AbsoluteFill style={{ background: `rgba(10, 12, 20, ${0.35 * p})` }}>
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: p }}>
        <div style={{ width: 150, height: 150, borderRadius: '50%', border: `6px solid ${C.gold}`, display: 'grid', placeItems: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 110, color: C.gold, transform: `scale(${(0.8 + 0.2 * p).toFixed(3)})` }}>
          ?
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CourseBadge: React.FC = () => {
  const f = useCurrentFrame();
  const flash = interpolate(f, [0, 3, 14], [0.9, 0.9, 0], clamp);
  const p = prog(f, 6, 16);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: '#FFFFFF', opacity: flash }} />
      <div style={{ position: 'absolute', top: 240, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: p, transform: `translateY(${((1 - p) * -30).toFixed(1)}px)` }}>
        <div style={{ background: C.mint, borderRadius: 999, padding: '20px 44px', display: 'flex', alignItems: 'center', gap: 18, boxShadow: '0 16px 40px rgba(0,0,0,0.35)' }}>
          <Ico name="check" size={48} color={C.ink} stroke={4} />
          <span style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 46, color: C.ink }}>{COURSE_TITLE}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Skills: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', top: 230, left: 60, right: 60, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
      {SKILLS.map((s, i) => {
        const p = prog(f, 4 + i * 9, 12);
        return (
          <div
            key={s}
            style={{
              opacity: p,
              transform: `scale(${(0.85 + 0.15 * p).toFixed(3)})`,
              background: 'rgba(255,255,255,0.94)',
              borderRadius: 999,
              padding: '16px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 10px 26px rgba(0,0,0,0.3)',
            }}
          >
            <Ico name="check" size={36} color="#12A26A" stroke={4} />
            <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 38, color: C.ink }}>{s}</span>
          </div>
        );
      })}
    </div>
  );
};

const Doubt: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const strike = prog(f, Math.round(duration * 0.45), 14);
  const p = prog(f, 4, 14);
  return (
    <div style={{ position: 'absolute', top: 260, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: p }}>
      <div style={{ position: 'relative', background: C.glass, borderRadius: 30, padding: '22px 40px', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 50, color: C.white }}>
        «Bunu bacararam, yoxsa yox?»
        <div style={{ position: 'absolute', left: 30, top: '50%', height: 8, borderRadius: 4, width: `calc(${(strike * 100).toFixed(1)}% - 60px)`, background: C.rose }} />
      </div>
    </div>
  );
};

const CtaCard: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const start = Math.round(duration * 0.38);
  const p = prog(f, start, 16);
  const pulse = 1 + 0.03 * Math.sin(Math.max(0, f - start - 20) / 6);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(8,10,18,0) 45%, rgba(8,10,18,0.85) 100%)', opacity: p }} />
      <div style={{ position: 'absolute', left: 70, right: 70, bottom: 330, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, opacity: p, transform: `translateY(${((1 - p) * 40).toFixed(1)}px)` }}>
        <div style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 52, color: C.white, textAlign: 'center' }}>{CTA.title}</div>
        <div style={{ transform: `scale(${pulse.toFixed(4)})`, background: C.gold, borderRadius: 999, padding: '28px 48px', display: 'flex', alignItems: 'center', gap: 18, boxShadow: '0 18px 44px rgba(242,193,78,0.45)' }}>
          <span style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 44, color: C.ink }}>{CTA.button}</span>
          <Ico name="arrow" size={46} color={C.ink} stroke={4} />
        </div>
        {CTA.note ? <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 36, color: '#E6E8EE' }}>{CTA.note}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

// ─── Səhnə ───────────────────────────────────────────────────
const SceneView: React.FC<{ idx: number }> = ({ idx }) => {
  const s = SCENES[idx];
  const t = T.scenes[idx];
  const f = useCurrentFrame();
  // Yüngül "kamera" hərəkəti: yavaş yaxınlaşma, səhnələr arasında qısa ağ/qara keçid yoxdur — kəsik keçid (Reels tempi)
  const zoom = interpolate(f, [0, t.duration], [1.0, 1.06], clamp);
  const fadeIn = idx === 0 ? interpolate(f, [0, 8], [0, 1], clamp) : 1;
  const captionTop = s.overlay === 'cta';
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', opacity: fadeIn }}>
      <AbsoluteFill style={{ transform: `scale(${zoom.toFixed(4)})` }}>
        <OffthreadVideo src={staticFile(s.clip)} muted playbackRate={t.clipRate} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
      {/* yuxarı və aşağıda yüngül qaralma — mətnlər hər fonda oxunsun */}
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)' }} />
      {s.overlay === 'hook' && <Hook />}
      {s.overlay === 'tasks1' && <NotifStack items={NOTIFS.tasks1} spacing={Math.round(t.duration * 0.42)} />}
      {s.overlay === 'tasks2' && <NotifStack items={NOTIFS.tasks2} spacing={Math.round(t.duration * 0.42)} />}
      {s.overlay === 'monthend' && <NotifStack items={NOTIFS.monthend} spacing={Math.round(t.duration * 0.26)} />}
      {s.overlay === 'question' && <Question />}
      {s.overlay === 'course' && <CourseBadge />}
      {s.overlay === 'skills' && <Skills />}
      {s.overlay === 'doubt' && <Doubt duration={t.duration} />}
      {s.overlay === 'cta' && <CtaCard duration={t.duration} />}
      <Caption text={s.caption} duration={t.duration} top={captionTop} />
    </AbsoluteFill>
  );
};

export const MuhasibReels: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    {T.scenes.map((t, i) => (
      <Sequence key={t.id} from={t.from} durationInFrames={t.duration} name={t.id}>
        <SceneView idx={i} />
      </Sequence>
    ))}
    {T.scenes.map((t) => (
      <Sequence key={`v-${t.id}`} from={t.from + t.voiceOffset} name={`diktor ${t.id}`} layout="none">
        <Audio src={staticFile(t.voice)} volume={1} />
      </Sequence>
    ))}
    <Audio
      src={staticFile(T.music)}
      volume={(f) => interpolate(f, [0, 10, T.total - 40, T.total], [0, 0.32, 0.32, 0], clamp)}
    />
    {T.sfx.map((c, i) => (
      <Sequence key={`sfx-${i}`} from={c.at} name={`sfx ${c.file}`} layout="none">
        <Audio src={staticFile(c.file)} volume={c.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

export const REELS_TOTAL = T.total;
