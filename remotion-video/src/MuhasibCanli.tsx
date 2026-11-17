import React from "react";
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Person, BackPerson, LOOKS } from "./people/Person";

export const FPS2 = 30;
export const TOTAL2 = 82 * FPS2;
const font = "Inter, 'DejaVu Sans', sans-serif";
const navy = "#0f2a4a", teal = "#19a7a0", gold = "#f2b134", red = "#e04848";
const cl = (v: number) => Math.max(0, Math.min(1, v));
const k = (t: number, a: number, b: number) => cl((t - a) / (b - a));
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const EVENTS = [8.4, 9.9, 11.3, 12.7, 14.1, 15.5];

// ---------- text overlay ----------
const Txt: React.FC<{ t: number; at: number; top: number; size?: number; weight?: number; color?: string; anim?: "up" | "pop" | "left" | "right"; children: React.ReactNode; card?: "task" | "check" | "pill" }> = ({ t, at, top, size = 50, weight = 700, color = navy, anim = "up", children, card }) => {
  const { fps } = useVideoConfig();
  const f = Math.round((t - at) * fps);
  if (f < 0) return null;
  const p = spring({ frame: f, fps, config: { damping: 14, stiffness: 120 } });
  const o = cl(f / 10);
  const tr = anim === "pop" ? `scale(${0.7 + 0.3 * p})` : anim === "left" ? `translateX(${-(1 - p) * 800}px)` : anim === "right" ? `translateX(${(1 - p) * 800}px)` : `translateY(${(1 - p) * 50}px)`;
  if (card) {
    const isTask = card === "task";
    return (
      <div style={{ position: "absolute", left: 70, right: 70, top, opacity: o, transform: tr, background: card === "check" ? "rgba(255,255,255,.12)" : "#fff", border: card === "check" ? "2px solid rgba(255,255,255,.22)" : "none", borderLeft: isTask ? `12px solid ${red}` : undefined, borderRadius: 22, padding: "16px 26px", display: "flex", alignItems: "center", gap: 20, boxShadow: card === "check" ? "none" : "0 10px 30px rgba(15,42,74,.22)", fontFamily: font, fontWeight: 700, fontSize: size, color: card === "check" ? "#fff" : navy, lineHeight: 1.2 }}>
        <div style={{ width: 50, height: 50, flex: "none", borderRadius: "50%", background: isTask ? "#ffe3e3" : teal, color: isTask ? red : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 30 }}>{isTask ? "!" : "✓"}</div>
        <span>{children}</span>
      </div>
    );
  }
  return <div style={{ position: "absolute", left: 60, right: 60, top, textAlign: "center", opacity: o, transform: tr, fontFamily: font, fontWeight: weight, fontSize: size, color, lineHeight: 1.22 }}>{children}</div>;
};
const C = (c: string, s: string) => <span style={{ color: c }}>{s}</span>;

// ---------- backgrounds ----------
const OfficeBg: React.FC<{ t: number; fast?: boolean }> = ({ t, fast }) => {
  const sp = fast ? Math.max(0, t - 8) ** 2 * 8 : t * 2;
  return (
    <g>
      <rect x={0} y={760} width={1080} height={1160} fill="url(#wall)" />
      <rect x={70} y={860} width={260} height={320} rx={10} fill="#bfe0f5" stroke="#fff" strokeWidth={12} />
      {[920, 980, 1040, 1100].map((y) => <line key={y} x1={70} y1={y} x2={330} y2={y} stroke="#fff" strokeWidth={5} opacity={0.8} />)}
      <rect x={770} y={1080} width={250} height={14} fill="#8a6240" />
      {[["#19a7a0", 980], ["#f2b134", 970], ["#0f2a4a", 985], ["#e04848", 975], ["#5d93cc", 990]].map(([c, y], i) => <rect key={i} x={785 + i * 45} y={Number(y)} width={40} height={1080 - Number(y)} fill={String(c)} />)}
      <g transform="translate(560,880)"><circle r={58} fill="#fff" stroke={navy} strokeWidth={8} />
        <line x1={0} y1={0} x2={0} y2={-42} stroke={red} strokeWidth={5} strokeLinecap="round" transform={`rotate(${sp * 6})`} />
        <line x1={0} y1={0} x2={0} y2={-28} stroke={navy} strokeWidth={8} strokeLinecap="round" transform={`rotate(${sp * 0.5 + 60})`} /><circle r={6} fill={navy} /></g>
      <g transform="translate(960,1260)"><rect x={-40} y={60} width={80} height={90} rx={10} fill="#c97b4a" /><ellipse cx={0} cy={40} rx={70} ry={60} fill="#3f8f5a" /><ellipse cx={-30} cy={0} rx={40} ry={55} fill="#4fa56a" /><ellipse cx={30} cy={10} rx={40} ry={50} fill="#3f8f5a" /></g>
    </g>
  );
};
const Desk: React.FC<{ glow?: number }> = ({ glow = 0 }) => (
  <g>
    <rect x={0} y={1440} width={1080} height={40} fill="#c99a6c" />
    <rect x={0} y={1480} width={1080} height={440} fill="url(#desk)" />
    <path d="M400,1255 L680,1255 L700,1445 L380,1445 Z" fill="#9aa7b4" />
    <rect x={380} y={1255} width={320} height={190} fill="#9fe7e0" opacity={glow} />
    <circle cx={540} cy={1345} r={22} fill="#cdd6df" />
    <rect x={370} y={1440} width={340} height={12} rx={6} fill="#7d8a97" />
    <g transform="translate(800,1360)"><rect width={70} height={80} rx={10} fill="#fff" /><path d="M70,18 q30,0 30,24 q0,24 -30,24" stroke="#fff" strokeWidth={10} fill="none" /><rect y={12} width={70} height={12} fill={teal} /></g>
  </g>
);
const Defs = () => (
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dfe8f3" /><stop offset="1" stopColor="#cbd9e8" /></linearGradient>
    <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b98a5e" /><stop offset="1" stopColor="#7a5436" /></linearGradient>
    <linearGradient id="room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3ece2" /><stop offset="1" stopColor="#e2d6c6" /></linearGradient>
  </defs>
);

// ---------- scene 1-3: office stress ----------
const OfficeStory: React.FC<{ t: number }> = ({ t }) => {
  // pile
  const dropped = EVENTS.filter((e) => t >= e).length;
  const pile = [];
  for (let i = 0; i < dropped * 3; i++) {
    const e = EVENTS[Math.floor(i / 3)];
    const land = ease(k(t, e, e + 0.35));
    const y = 1430 - i * 14, x = 110 + ((i * 37) % 50) - 25, r = ((i * 53) % 12) - 6;
    pile.push(<g key={i} transform={`translate(${x + 120},${y - (1 - land) * 160}) rotate(${r})`}><rect x={-120} y={-10} width={240} height={22} rx={3} fill={i % 3 === 0 ? "#f2b134" : "#fff"} stroke="#c9d3de" strokeWidth={2} /></g>);
  }
  // colleagues
  const cols = EVENTS.map((e, i) => {
    const inP = ease(k(t, e - 0.9, e - 0.15)), outP = ease(k(t, e + 0.35, e + 1.1));
    if (t < e - 0.9 || t > e + 1.1) return null;
    const x = -260 + inP * 520 - outP * 520;
    const moving = (t > e - 0.9 && t < e - 0.15) || (t > e + 0.35 && t < e + 1.1);
    const look = i % 2 === 0 ? LOOKS.aysel : LOOKS.orxan;
    return <Person key={i} x={x} y={1430} s={1.2} look={look} pose="hold" pose2="down" mix={k(t, e, e + 0.25)} hold={t < e ? "folder" : null} walk={moving ? t * 12 : 0} expr={i % 2 ? "neutral" : "happy"} flip={outP > 0} t={t * 30} />;
  });
  const worried = k(t, 11, 11.6), stress = k(t, 14.2, 14.7);
  const zoom = 1 + 0.55 * ease(k(t, 20.2, 23));
  const happyWave = t < 6 ? Math.sin(Math.PI * k(t, 1.2, 4)) : 0;
  return (
    <g transform={`translate(540,1100) scale(${zoom}) translate(-540,-1100)`}>
      <OfficeBg t={t} fast />
      <rect x={380} y={1010} width={320} height={420} rx={40} fill="#34495e" />
      {cols}
      <Person x={540} y={1520} s={1.35} seated look={LOOKS.kamran} pose={happyWave > 0.05 ? "type" : "type"} pose2={happyWave > 0.05 ? "wave" : "head"} mix={happyWave > 0.05 ? happyWave : stress}
        expr={worried < 1 ? "happy" : "worried"} expr2={worried < 1 ? "worried" : "stress"} emix={worried < 1 ? worried : stress}
        shake={stress} sweat={stress} flush={stress * 0.16} t={t * 30} />
      <Desk glow={0.12} />
      {pile}
    </g>
  );
};

// ---------- training room ----------
const Training: React.FC<{ t: number }> = ({ t }) => {
  const rows = ["Vergi kabineti", "Elektron müraciət", "E-qaimə-faktura", "ƏMAS müqavilə", "Bank əməliyyatı", "Əməkhaqqı", "Vergi hesabatı"];
  const shown = (i: number) => k(t, 34 + i * 1.8, 34.4 + i * 1.8);
  const raise = Math.sin(Math.PI * k(t, 36, 39));
  return (
    <g>
      <rect x={0} y={760} width={1080} height={1160} fill="url(#room)" />
      <rect x={70} y={820} width={700} height={460} rx={16} fill="#1b2633" />
      <rect x={90} y={840} width={660} height={420} rx={8} fill="#f7fafc" />
      <rect x={90} y={840} width={660} height={56} fill={teal} />
      <text x={120} y={878} fontFamily={font} fontWeight={800} fontSize={28} fill="#fff">MÜHASİBAT PRAKTİKUMU</text>
      {rows.map((r, i) => (
        <g key={i} opacity={0.25 + 0.75 * shown(i)}>
          <rect x={115} y={912 + i * 48} width={36} height={36} rx={8} fill={shown(i) > 0.5 ? teal : "#cfd8e3"} />
          {shown(i) > 0.5 && <path d={`M${123},${930 + i * 48} l8,8 l14,-16`} stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" />}
          <text x={168} y={938 + i * 48} fontFamily={font} fontWeight={700} fontSize={26} fill={navy}>{r}</text>
          <rect x={470} y={922 + i * 48} width={250 * shown(i)} height={16} rx={8} fill={gold} />
        </g>
      ))}
      <Person x={900} y={1420} s={1.15} look={LOOKS.trainer} pose="point" flip expr="happy" t={t * 30} nod={k(t, 48, 49)} />
      <rect x={0} y={1600} width={1080} height={320} fill="#cdb79a" />
      <BackPerson x={250} y={1830} s={1.35} look={LOOKS.nigar} type={1} t={t * 30} />
      <BackPerson x={560} y={1860} s={1.45} look={LOOKS.kamran} raise={raise} type={t > 40 ? 1 : 0} t={t * 30} />
      <BackPerson x={870} y={1830} s={1.35} look={LOOKS.elvin} type={1} t={t * 30} />
    </g>
  );
};

// ---------- confident office ----------
const OfficeConfident: React.FC<{ t: number }> = ({ t }) => {
  const conf = k(t, 55.6, 56.2);
  const col = k(t, 57.5, 58.6), colOut = k(t, 61.5, 62.6);
  return (
    <g>
      <OfficeBg t={t} />
      <rect x={380} y={1010} width={320} height={420} rx={40} fill="#34495e" />
      {t > 57.5 && t < 62.6 && <Person x={-200 + ease(col) * 380 - ease(colOut) * 380} y={1430} s={1.2} look={LOOKS.aysel} pose="down" pose2="thumb" mix={k(t, 58.6, 59.1) * (1 - k(t, 61, 61.4))} expr="happy" walk={(col > 0 && col < 1) || (colOut > 0 && colOut < 1) ? t * 12 : 0} flip={colOut > 0} t={t * 30} />}
      <Person x={540} y={1520} s={1.35} seated look={LOOKS.kamran} pose="type" pose2="thumb" mix={k(t, 58.8, 59.4)} expr="happy" expr2="conf" emix={conf} t={t * 30} nod={0.6} />
      <Desk glow={0.3 + 0.1 * Math.sin(t * 4)} />
      <g><rect x={120} y={1400} width={230} height={30} rx={6} fill={teal} /><rect x={128} y={1370} width={215} height={30} rx={6} fill={gold} /><rect x={124} y={1340} width={222} height={30} rx={6} fill="#5d93cc" />
        <path d="M200,1270 l30,30 l60,-70" stroke={teal} strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
    </g>
  );
};

// ---------- meeting ----------
const Meeting: React.FC<{ t: number }> = ({ t }) => {
  const g = (i: number) => ease(k(t, 65 + i * 0.4, 66 + i * 0.4));
  const bars = [120, 170, 150, 230, 300];
  return (
    <g>
      <rect x={0} y={760} width={1080} height={1160} fill="url(#wall)" />
      <rect x={470} y={830} width={540} height={420} rx={14} fill="#fff" stroke="#cfd8e3" strokeWidth={6} />
      <text x={500} y={885} fontFamily={font} fontWeight={800} fontSize={30} fill={navy}>Aylıq hesabat</text>
      {bars.map((h, i) => <rect key={i} x={520 + i * 92} y={1220 - h * g(i)} width={60} height={h * g(i)} rx={6} fill={i === 4 ? teal : "#8fbbe8"} />)}
      <Person x={290} y={1430} s={1.2} look={LOOKS.kamran} pose="point" expr="conf" t={t * 30} />
      <rect x={0} y={1640} width={1080} height={280} fill="#8a6240" />
      <BackPerson x={640} y={1880} s={1.3} look={LOOKS.boss} t={t * 30} />
      <BackPerson x={900} y={1880} s={1.3} look={LOOKS.aysel} t={t * 30} />
    </g>
  );
};

// ---------- final group ----------
const Group: React.FC<{ t: number }> = ({ t }) => {
  const conf = [];
  for (let i = 0; i < 60; i++) {
    const x = (i * 97) % 1080, sp = 120 + (i * 37) % 160, y = 760 + ((t - 71.4) * sp + (i * 53) % 400) % 1160;
    conf.push(<rect key={i} x={x} y={y} width={14} height={22} fill={[gold, teal, red, "#5d93cc"][i % 4]} transform={`rotate(${t * 90 + i * 30} ${x + 7} ${y + 11})`} opacity={0.85} />);
  }
  const p = ease(k(t, 71.6, 72.6));
  return (
    <g>
      <rect x={0} y={760} width={1080} height={1160} fill="url(#room)" />
      <rect x={0} y={1640} width={1080} height={280} fill="#cdb79a" />
      <g opacity={p}>
        <Person x={170} y={1500} s={1.05} look={LOOKS.trainer} pose="clap" expr="happy" t={t * 30} />
        <Person x={410} y={1480} s={1.15} look={LOOKS.kamran} pose="cert" hold="cert" expr="conf" t={t * 30} />
        <Person x={670} y={1500} s={1.08} look={LOOKS.nigar} pose="cert" hold="cert" expr="happy" t={t * 30} />
        <Person x={910} y={1500} s={1.1} look={LOOKS.elvin} pose="cert" hold="cert" expr="happy" t={t * 30} />
      </g>
      {conf}
    </g>
  );
};

type Sc = { a: number; b: number; bg: string; caption: string };
const SC: Sc[] = [
  { a: 0, b: 7, bg: "light", caption: "Təsəvvür edin... Sabah ilk iş gününüzdür." },
  { a: 7, b: 20.2, bg: "light", caption: "Qarşınızda bir-birinin ardınca tapşırıqlar yaranır." },
  { a: 20.2, b: 27.4, bg: "light", caption: "Bütün bu işləri müstəqil yerinə yetirməyə hazırsınızmı?" },
  { a: 27.4, b: 32.4, bg: "dark", caption: "Bu təlim məhz sizin üçün nəzərdə tutulub!" },
  { a: 32.4, b: 48.4, bg: "dark", caption: "Mühasibin gündəlik iş proseslərini addım-addım öyrənəcəksiniz." },
  { a: 48.4, b: 54.4, bg: "dark", caption: "Hər mövzunu özünüz tətbiq edəcəksiniz." },
  { a: 54.4, b: 64.4, bg: "light", caption: "Ən əsası — özünüzə inam qazanacaqsınız!" },
  { a: 64.4, b: 71.4, bg: "dark", caption: "Məqsədimiz sizi real iş mühitinə hazırlamaqdır!" },
  { a: 71.4, b: 82, bg: "dark", caption: "Gəlin, həmin təcrübəni birlikdə qazanaq!" },
];

export const MuhasibCanli: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS2;
  const op = (a: number, b: number) => (t < a || t > b ? 0 : Math.min(cl((t - a) / 0.4) || (a === 0 ? 1 : 0), cl((b - t) / 0.4)));
  const sc = SC.find((s) => t >= s.a && t < s.b) ?? SC[SC.length - 1];
  const dark = sc.bg === "dark";
  const capO = interpolate(t - sc.a, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
  const vign = t > 15 && t < 20.4 ? 0.4 + 0.3 * Math.sin(t * 6) : 0;
  const overlay = t >= 20.2 && t <= 27.4 ? cl((t - 20.2) / 0.6) * cl((27.4 - t) / 0.4) * 0.6 : 0;
  return (
    <AbsoluteFill style={{ background: dark ? "linear-gradient(160deg,#0f2a4a 0%,#123d63 55%,#16707a 100%)" : "linear-gradient(180deg,#f4f7fb,#e3ecf6)" }}>
      <Audio src={staticFile("music2.wav")} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <Defs />
        {t < 27.8 && <g opacity={op(0, 27.4)}><OfficeStory t={t} /></g>}
        {t > 32 && t < 54.8 && <g opacity={op(32.4, 54.4)}><Training t={t} /></g>}
        {t > 54 && t < 64.8 && <g opacity={op(54.4, 64.4)}><OfficeConfident t={t} /></g>}
        {t > 64 && t < 71.8 && <g opacity={op(64.4, 71.4)}><Meeting t={t} /></g>}
        {t > 71 && <g opacity={op(71.4, 82)}><Group t={t} /></g>}
      </svg>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(224,72,72,0) 45%, rgba(224,72,72,${vign}) 100%)` }} />
      <AbsoluteFill style={{ background: `rgba(8,20,36,${overlay})` }} />
      {/* texts */}
      {t < 7.4 && <AbsoluteFill style={{ opacity: op(0, 7) }}>
        <Txt t={t} at={0.3} top={170} size={86} weight={900} anim="pop">TƏSƏVVÜR EDİN{C(teal, "...")}</Txt>
        <Txt t={t} at={1.6} top={340} size={50}>Siz {C(teal, "mühasib")} vəzifəsinə işə qəbul olunmusunuz.</Txt>
        <Txt t={t} at={3.4} top={530} size={50}>Sabah <b>ilk iş gününüzdür.</b></Txt>
      </AbsoluteFill>}
      {t > 7 && t < 20.6 && <AbsoluteFill style={{ opacity: op(7, 20.2) }}>
        <Txt t={t} at={7.1} top={70} size={42}>İşə gəlirsiniz və qarşınızda bir-birinin ardınca {C(red, "tapşırıqlar")} yaranır...</Txt>
        {["Yeni işçi işə qəbul edilməlidir", "Elektron qaimə göndərilməlidir", "Bank əməliyyatları yoxlanılmalıdır", "Vergi kabinetindəki məktub cavablanmalıdır", "Ay sonu: əməkhaqqı hesablanmalıdır", "Vergi və sosial sığorta hesabatları"].map((s, i) =>
          <Txt key={i} t={t} at={EVENTS[i]} top={210 + i * 90} size={30} card="task" anim={i % 2 ? "right" : "left"}>{s}</Txt>)}
      </AbsoluteFill>}
      {t > 20.2 && t < 27.8 && <AbsoluteFill style={{ opacity: op(20.2, 27.4) }}>
        <Txt t={t} at={20.4} top={150} size={50} color="#fff">İndi özünüzə bir sual verin:</Txt>
        <Txt t={t} at={21.6} top={300} size={74} weight={900} color="#fff" anim="pop">Bütün bu işləri {C(gold, "müstəqil şəkildə")} yerinə yetirməyə hazırsınızmı?</Txt>
      </AbsoluteFill>}
      {t > 27.4 && t < 32.8 && <AbsoluteFill style={{ opacity: op(27.4, 32.4) }}>
        <Txt t={t} at={27.6} top={600} size={56} color="#fff">Əgər cavabınız {C(gold, "xeyrdirsə")},</Txt>
        <Txt t={t} at={28.6} top={760} size={84} weight={900} color="#fff" anim="pop">bu təlim məhz {C(gold, "sizin üçün")} nəzərdə tutulub!</Txt>
        <Txt t={t} at={29.8} top={1200} size={44} weight={900} color={navy} anim="pop"><span style={{ background: gold, padding: "16px 44px", borderRadius: 60 }}>PRAKTİKİ TƏLİM</span></Txt>
      </AbsoluteFill>}
      {t > 32.4 && t < 48.8 && <AbsoluteFill style={{ opacity: op(32.4, 48.4) }}>
        <Txt t={t} at={32.6} top={110} size={48} color="#fff">Mühasibin gündəlik iş proseslərini {C(gold, "addım-addım")} öyrənəcəksiniz:</Txt>
        <Txt t={t} at={33.4} top={330} size={36} color="#fff">Vergi kabineti · E-müraciət · E-qaimə · ƏMAS · Bank · Əməkhaqqı · Vergi hesabatları</Txt>
        <Txt t={t} at={36} top={560} size={40} color="#fff" anim="pop">{C(gold, "Sualınız var?")} Təlimçi yanınızdadır.</Txt>
      </AbsoluteFill>}
      {t > 48.4 && t < 54.8 && <AbsoluteFill style={{ opacity: op(48.4, 54.4) }}>
        <Txt t={t} at={48.6} top={120} size={66} weight={900} color="#fff" anim="pop">Burada sadəcə {C(gold, "dinləməyəcəksiniz.")}</Txt>
        <Txt t={t} at={50} top={330} size={44} color="#fff">Hər mövzunu {C(gold, "özünüz tətbiq edəcək")}, öyrəndiklərinizi {C(gold, "praktiki bacarığa")} çevirəcəksiniz.</Txt>
      </AbsoluteFill>}
      {t > 54.4 && t < 64.8 && <AbsoluteFill style={{ opacity: op(54.4, 64.4) }}>
        <Txt t={t} at={54.6} top={60} size={44}>Bəs bu təlim sizə nə qazandıracaq?</Txt>
        <Txt t={t} at={55.8} top={150} size={70} weight={900} anim="pop">Ən əsası — {C(teal, "özünüzə inam!")}</Txt>
        {["«Bunu bacararam, yoxsa yox?» tərəddüdü olmayacaq", "Gündəlik işləri müstəqil icra edəcəksiniz", "Mühasib vəzifəsinə inamla müraciət edəcəksiniz"].map((s, i) =>
          <Txt key={i} t={t} at={57.4 + i * 1.6} top={350 + i * 130} size={30} card="pill" anim="right">{s}</Txt>)}
      </AbsoluteFill>}
      {t > 64.4 && t < 71.8 && <AbsoluteFill style={{ opacity: op(64.4, 71.4) }}>
        <Txt t={t} at={64.6} top={120} size={46} color="#fff">Çünki bizim məqsədimiz sizə sadəcə mühasibatlığı öyrətmək deyil,</Txt>
        <Txt t={t} at={66.4} top={330} size={72} weight={900} color="#fff" anim="pop">sizi {C(gold, "real iş mühitinə")} hazırlamaqdır!</Txt>
      </AbsoluteFill>}
      {t > 71.4 && <AbsoluteFill style={{ opacity: op(71.4, 82) }}>
        <Txt t={t} at={71.6} top={70} size={40} color="#fff">Diplomunuz ola bilər, nəzəri bilikləriniz də ola bilər.</Txt>
        <Txt t={t} at={73.6} top={210} size={40} color="#fff">Amma işə başlayanda sizdən {C(gold, "praktiki təcrübə")} tələb olunursa —</Txt>
        <Txt t={t} at={76} top={380} size={70} weight={900} color="#fff" anim="pop">gəlin, həmin təcrübəni {C(gold, "birlikdə qazanaq!")}</Txt>
      </AbsoluteFill>}
      {/* captions */}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 60 }}>
        <div style={{ opacity: capO, maxWidth: 960, background: "rgba(8,20,36,.85)", color: "#fff", fontFamily: font, fontWeight: 700, fontSize: 36, lineHeight: 1.3, padding: "14px 28px", borderRadius: 16, textAlign: "center" }}>{sc.caption}</div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 10, background: gold, width: (f / TOTAL2) * 1080 }} />
    </AbsoluteFill>
  );
};
