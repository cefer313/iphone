import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
const fontFamily = "Inter, 'DejaVu Sans', sans-serif";

export const FPS = 30;
const S = (sec: number) => Math.round(sec * FPS);

type Line = { text: React.ReactNode; at: number; size?: number; weight?: number; kind?: "pop" | "up" | "left" | "right" | "card" | "check" };
type Scene = { from: number; to: number; theme: "light" | "dark" | "alert"; emoji?: string; lines: Line[]; caption: string };

const gold = "#f2b134", teal = "#19a7a0", red = "#e04848", navy = "#0f2a4a";
const G = (t: string) => <span style={{ color: gold }}>{t}</span>;
const T = (t: string) => <span style={{ color: teal }}>{t}</span>;
const R = (t: string) => <span style={{ color: red }}>{t}</span>;

const scenes: Scene[] = [
  { from: 0, to: 7, theme: "light", emoji: "💼", caption: "Təsəvvür edin... Sabah ilk iş gününüzdür.", lines: [
    { text: <>TƏSƏVVÜR EDİN{T("...")}</>, at: 0.3, size: 84, weight: 900, kind: "pop" },
    { text: <>Siz {T("mühasib")} vəzifəsinə işə qəbul olunmusunuz.</>, at: 1.6, kind: "up" },
    { text: <>Sabah <b>ilk iş gününüzdür.</b></>, at: 3.4, kind: "up" } ] },
  { from: 7, to: 20.2, theme: "alert", emoji: "😰", caption: "Qarşınızda bir-birinin ardınca tapşırıqlar yaranır.", lines: [
    { text: <>Qarşınızda {R("tapşırıqlar")} yaranır...</>, at: 7.1, size: 50, kind: "up" },
    { text: "Yeni işçi işə qəbul edilməlidir", at: 8.4, kind: "card" },
    { text: "Elektron qaimə göndərilməlidir", at: 9.9, kind: "card" },
    { text: "Bank əməliyyatları yoxlanılmalıdır", at: 11.3, kind: "card" },
    { text: "Vergi kabinetindəki məktub cavablanmalıdır", at: 12.7, kind: "card" },
    { text: "Ay sonu: əməkhaqqı hesablanmalıdır", at: 14.1, kind: "card" },
    { text: "Vergi və sosial sığorta hesabatları", at: 15.5, kind: "card" } ] },
  { from: 20.2, to: 27.4, theme: "dark", emoji: "🤔", caption: "Bütün bu işləri müstəqil yerinə yetirməyə hazırsınızmı?", lines: [
    { text: "İndi özünüzə bir sual verin:", at: 20.4, kind: "up" },
    { text: <>Bütün bu işləri {G("müstəqil şəkildə")} yerinə yetirməyə hazırsınızmı?</>, at: 21.6, size: 76, weight: 900, kind: "pop" } ] },
  { from: 27.4, to: 32.4, theme: "dark", emoji: "🎯", caption: "Bu təlim məhz sizin üçün nəzərdə tutulub!", lines: [
    { text: <>Əgər cavabınız {G("xeyrdirsə")},</>, at: 27.6, kind: "up" },
    { text: <>bu təlim məhz {G("sizin üçündür!")}</>, at: 28.6, size: 80, weight: 900, kind: "pop" } ] },
  { from: 32.4, to: 48.4, theme: "dark", caption: "Mühasibin gündəlik iş proseslərini addım-addım öyrənəcəksiniz.", lines: [
    { text: <>Addım-addım {G("öyrənəcəksiniz:")}</>, at: 32.6, size: 58, weight: 800, kind: "up" },
    { text: "Vergi kabinetində işləmək", at: 34.0, kind: "check" },
    { text: "Elektron müraciətlər hazırlamaq", at: 35.8, kind: "check" },
    { text: "Elektron qaimə-fakturalar", at: 37.6, kind: "check" },
    { text: "ƏMAS-da əmək müqavilələri", at: 39.4, kind: "check" },
    { text: "Bank əməliyyatları", at: 41.2, kind: "check" },
    { text: "Əməkhaqqı və son haqq-hesab", at: 43.0, kind: "check" },
    { text: "Vergi hesabatlarının təqdimi", at: 44.8, kind: "check" } ] },
  { from: 48.4, to: 54.4, theme: "light", emoji: "💻", caption: "Hər mövzunu özünüz tətbiq edəcəksiniz.", lines: [
    { text: <>Sadəcə {R("dinləməyəcəksiniz.")}</>, at: 48.6, size: 70, weight: 900, kind: "pop" },
    { text: <>Hər mövzunu {T("özünüz tətbiq edəcək")}, öyrəndiklərinizi {T("praktiki bacarığa")} çevirəcəksiniz.</>, at: 50.0, kind: "up" } ] },
  { from: 54.4, to: 64.4, theme: "light", emoji: "💪", caption: "Ən əsası — özünüzə inam qazanacaqsınız!", lines: [
    { text: "Bəs bu təlim sizə nə qazandıracaq?", at: 54.6, kind: "up" },
    { text: <>Ən əsası — {T("özünüzə inam!")}</>, at: 55.8, size: 76, weight: 900, kind: "pop" },
    { text: "«Bunu bacararam, yoxsa yox?» tərəddüdü olmayacaq", at: 57.4, kind: "check" },
    { text: "Gündəlik işləri müstəqil icra edəcəksiniz", at: 59.0, kind: "check" },
    { text: "Mühasib vəzifəsinə inamla müraciət edəcəksiniz", at: 60.6, kind: "check" } ] },
  { from: 64.4, to: 71.4, theme: "dark", emoji: "🏢", caption: "Məqsədimiz sizi real iş mühitinə hazırlamaqdır!", lines: [
    { text: "Məqsədimiz sizə sadəcə mühasibatlığı öyrətmək deyil,", at: 64.6, kind: "up" },
    { text: <>sizi {G("real iş mühitinə")} hazırlamaqdır!</>, at: 66.4, size: 80, weight: 900, kind: "pop" } ] },
  { from: 71.4, to: 82, theme: "dark", emoji: "🤝", caption: "Gəlin, həmin təcrübəni birlikdə qazanaq!", lines: [
    { text: "Diplomunuz ola bilər, nəzəri bilikləriniz də ola bilər.", at: 71.6, kind: "up" },
    { text: <>Amma sizdən {G("praktiki təcrübə")} tələb olunursa —</>, at: 73.6, kind: "up" },
    { text: <>gəlin, həmin təcrübəni {G("birlikdə qazanaq!")}</>, at: 76.0, size: 86, weight: 900, kind: "pop" } ] },
];
export const TOTAL_FRAMES = S(82);

const Bg: React.FC<{ theme: Scene["theme"] }> = ({ theme }) => {
  const f = useCurrentFrame();
  const pulse = theme === "alert" ? 0.35 + 0.25 * Math.sin(f / 5) : 0;
  const base = theme === "light"
    ? "linear-gradient(180deg,#f4f7fb,#e3ecf6)"
    : "linear-gradient(160deg,#0f2a4a 0%,#123d63 55%,#16707a 100%)";
  return (
    <AbsoluteFill style={{ background: theme === "alert" ? "linear-gradient(180deg,#f4f7fb,#f6e3e3)" : base }}>
      <div style={{ position: "absolute", width: 760, height: 760, borderRadius: "50%", left: -260 + Math.sin(f / 40) * 30, top: -220, background: theme === "light" ? "rgba(25,167,160,.12)" : "rgba(25,167,160,.22)" }} />
      <div style={{ position: "absolute", width: 620, height: 620, borderRadius: "50%", right: -220, bottom: -160 + Math.cos(f / 50) * 30, background: "rgba(242,177,52,.15)" }} />
      {theme === "alert" && <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(224,72,72,0) 45%, rgba(224,72,72,${pulse}) 100%)` }} />}
    </AbsoluteFill>
  );
};

const LineView: React.FC<{ line: Line; local: number; dark: boolean; index: number }> = ({ line, local, dark }) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: local, fps, config: { damping: 14, stiffness: 120 } });
  const o = interpolate(local, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const color = dark ? "#fff" : navy;
  if (line.kind === "card" || line.kind === "check") {
    const fromLeft = line.kind === "check";
    return (
      <div style={{ opacity: o, transform: `translateX(${(1 - p) * (fromLeft ? -700 : 700)}px)`, background: line.kind === "card" || !dark ? "#fff" : "rgba(255,255,255,.12)", color: line.kind === "card" ? navy : color,
        border: line.kind === "check" ? "2px solid rgba(255,255,255,.2)" : "none", borderLeft: line.kind === "card" ? `12px solid ${red}` : undefined,
        borderRadius: 24, padding: "22px 30px", margin: "12px 0", fontSize: 36, fontWeight: 700, display: "flex", gap: 22, alignItems: "center",
        boxShadow: line.kind === "card" || !dark ? "0 10px 30px rgba(15,42,74,.2)" : "none" }}>
        <div style={{ width: 56, height: 56, flex: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: line.kind === "card" ? "#ffe3e3" : teal, color: line.kind === "card" ? red : "#fff", fontWeight: 900, fontSize: 32 }}>{line.kind === "card" ? "!" : "✓"}</div>
        <span style={{ color: line.kind === "check" && !dark ? navy : undefined }}>{line.text}</span>
      </div>
    );
  }
  const tr = line.kind === "pop" ? `scale(${0.7 + 0.3 * p})` : `translateY(${(1 - p) * 50}px)`;
  return (
    <div style={{ opacity: o, transform: tr, color, fontSize: line.size ?? 52, fontWeight: line.weight ?? 700, lineHeight: 1.22, textAlign: "center", margin: "24px 0" }}>
      {line.text}
    </div>
  );
};

const SceneView: React.FC<{ scene: Scene }> = ({ scene }) => {
  const f = useCurrentFrame();
  const len = S(scene.to - scene.from);
  const fade = interpolate(f, [0, 10, len - 10, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dark = scene.theme === "dark";
  const lightList = scene.lines.some((l) => l.kind === "check") && !dark;
  return (
    <AbsoluteFill style={{ opacity: fade, fontFamily }}>
      <Bg theme={scene.theme} />
      <AbsoluteFill style={{ padding: "150px 70px 330px", justifyContent: "center" }}>
        {scene.emoji && (
          <div style={{ fontSize: 150, textAlign: "center", transform: `translateY(${Math.sin(f / 12) * 10}px)`, opacity: interpolate(f, [0, 15], [0, 1], { extrapolateRight: "clamp" }) }}>{scene.emoji}</div>
        )}
        {scene.lines.map((l, i) => {
          const local = f - S(l.at - scene.from);
          if (local < 0) return <div key={i} style={{ visibility: "hidden" }}><LineView line={l} local={0} dark={dark} index={i} /></div>;
          return <LineView key={i} line={l} local={local} dark={dark || (lightList && false)} index={i} />;
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const sc = scenes.find((s) => t >= s.from && t < s.to);
  if (!sc) return null;
  const local = f - S(sc.from);
  const o = interpolate(local, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 140 }}>
      <div style={{ opacity: o, maxWidth: 940, background: "rgba(8,20,36,.82)", color: "#fff", fontFamily, fontWeight: 700, fontSize: 40, lineHeight: 1.3, padding: "18px 30px", borderRadius: 18, textAlign: "center" }}>
        {sc.caption}
      </div>
    </AbsoluteFill>
  );
};

export const MuhasibPromo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: navy }}>
      <Audio src={staticFile("music.wav")} />
      {scenes.map((s, i) => (
        <Sequence key={i} from={S(s.from)} durationInFrames={S(s.to - s.from)}>
          <SceneView scene={s} />
        </Sequence>
      ))}
      <Captions />
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 10, background: gold, width: (f / TOTAL_FRAMES) * 1080 }} />
    </AbsoluteFill>
  );
};
