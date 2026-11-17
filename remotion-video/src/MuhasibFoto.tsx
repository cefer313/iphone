import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const FPS4 = 30;
export const TOTAL4 = 82 * FPS4;
const font = "Inter, 'DejaVu Sans', sans-serif";
const gold = "#f2b134", red = "#e04848";
const G = (s: string) => <span style={{ color: gold }}>{s}</span>;
const R = (s: string) => <span style={{ color: red }}>{s}</span>;

type Line = { at: number; text: React.ReactNode; size?: number; weight?: number };
type Sc = { img: string; portrait?: boolean; a: number; b: number; lines: Line[]; pos?: string; panX?: number; mood?: "stress" | "dark" };
const SCENES: Sc[] = [
  { img: "p1", a: 0, b: 7, lines: [{ at: 0.3, text: "TƏSƏVVÜR EDİN...", size: 84, weight: 900 }, { at: 1.8, text: <>Siz {G("mühasib")} vəzifəsinə işə qəbul olunmusunuz.</>, size: 50 }, { at: 3.8, text: "Sabah ilk iş gününüzdür.", size: 50 }] },
  { img: "p2", portrait: true, a: 7, b: 13.5, pos: "center 40%", lines: [{ at: 7.2, text: <>Qarşınızda bir-birinin ardınca {G("tapşırıqlar")} yaranır...</>, size: 54 }, { at: 9, text: "Yeni işçi işə qəbul edilməlidir.", size: 44 }, { at: 10.6, text: "Elektron qaimə göndərilməlidir.", size: 44 }, { at: 12, text: "Bank əməliyyatları yoxlanılmalıdır.", size: 44 }] },
  { img: "p3", a: 13.5, b: 20.2, mood: "stress", lines: [{ at: 13.7, text: "Vergi kabinetinə gələn məktub...", size: 48 }, { at: 15.2, text: <>Ay sonu: {R("əməkhaqqı")}, vergi və sosial sığorta {R("hesabatları")}...</>, size: 52, weight: 900 }] },
  { img: "p4", a: 20.2, b: 27.4, mood: "dark", lines: [{ at: 20.4, text: "İndi özünüzə bir sual verin:", size: 50 }, { at: 21.6, text: <>Bütün bu işləri {G("müstəqil şəkildə")} yerinə yetirməyə hazırsınızmı?</>, size: 66, weight: 900 }] },
  { img: "p5", a: 27.4, b: 40, lines: [{ at: 27.6, text: <>Əgər cavabınız {G("xeyrdirsə")},</>, size: 54 }, { at: 28.8, text: <>bu təlim məhz {G("sizin üçündür!")}</>, size: 70, weight: 900 }, { at: 32, text: "Vergi kabineti · E-müraciətlər · E-qaimə-faktura · ƏMAS · Bank əməliyyatları · Əməkhaqqı · Vergi hesabatları", size: 38 }] },
  { img: "p6", a: 40, b: 54.4, lines: [{ at: 40.2, text: <>Burada sadəcə {G("dinləməyəcəksiniz.")}</>, size: 64, weight: 900 }, { at: 42.6, text: <>Hər mövzunu {G("özünüz tətbiq edəcək")}, fərdi tapşırıqlar yerinə yetirəcəksiniz.</>, size: 46 }, { at: 47, text: <>Öyrəndiklərinizi {G("praktiki bacarığa")} çevirəcəksiniz.</>, size: 46 }] },
  { img: "p7", portrait: true, a: 54.4, b: 64.4, pos: "center 30%", lines: [{ at: 54.6, text: "Bəs bu təlim sizə nə qazandıracaq?", size: 48 }, { at: 55.8, text: <>Ən əsası — {G("özünüzə inam!")}</>, size: 74, weight: 900 }, { at: 58, text: "«Bunu bacararam, yoxsa yox?» tərəddüdü olmayacaq.", size: 40 }, { at: 60.4, text: "Mühasib vəzifəsinə inamla müraciət edəcəksiniz.", size: 40 }] },
  { img: "p8", portrait: true, a: 64.4, b: 71.4, pos: "center 35%", lines: [{ at: 64.6, text: "Çünki məqsədimiz sizə sadəcə mühasibatlığı öyrətmək deyil,", size: 46 }, { at: 66.4, text: <>sizi {G("real iş mühitinə")} hazırlamaqdır!</>, size: 72, weight: 900 }] },
  { img: "p9", a: 71.4, b: 82, lines: [{ at: 71.6, text: "Diplomunuz ola bilər, nəzəri bilikləriniz də ola bilər.", size: 42 }, { at: 73.8, text: <>Amma sizdən {G("praktiki təcrübə")} tələb olunursa —</>, size: 44 }, { at: 76, text: <>gəlin, həmin təcrübəni {G("birlikdə qazanaq!")}</>, size: 76, weight: 900 }] },
];

const TextLine: React.FC<{ line: Line; sceneStart: number }> = ({ line, sceneStart }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = f - Math.round((line.at - sceneStart) * fps);
  if (local < 0) return null;
  const p = spring({ frame: local, fps, config: { damping: 15, stiffness: 110 } });
  return (
    <div style={{ opacity: Math.min(1, local / 10), transform: `translateY(${(1 - p) * 40}px)`, fontFamily: font, fontWeight: line.weight ?? 700, fontSize: line.size ?? 50, color: "#fff", textAlign: "center", lineHeight: 1.2, margin: "14px 0", textShadow: "0 4px 20px rgba(0,0,0,.8)" }}>
      {line.text}
    </div>
  );
};

const SceneView: React.FC<{ sc: Sc; idx: number }> = ({ sc, idx }) => {
  const f = useCurrentFrame();
  const len = Math.round((sc.b - sc.a) * FPS4);
  const fade = interpolate(f, [0, 14, len - 14, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = interpolate(f, [0, len], [1.04, 1.16]);
  const pan = interpolate(f, [0, len], [idx % 2 ? -20 : 20, idx % 2 ? 20 : -20]);
  const shake = sc.mood === "stress" ? Math.sin(f * 1.7) * 4 : 0;
  const src = staticFile(`photos/${sc.img}.jpg`);
  const half = Math.ceil(sc.lines.length / 2);
  const top = sc.portrait ? sc.lines.slice(0, 2) : sc.lines.slice(0, half);
  const bottom = sc.portrait ? sc.lines.slice(2) : sc.lines.slice(half);
  const vign = sc.mood === "stress" ? 0.35 + 0.25 * Math.sin(f / 5) : 0;
  return (
    <AbsoluteFill style={{ opacity: fade, background: "#0b1626" }}>
      {sc.portrait ? (
        <AbsoluteFill style={{ transform: `scale(${zoom}) translateX(${pan}px)` }}>
          <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: sc.pos ?? "center" }} />
        </AbsoluteFill>
      ) : (
        <>
          <AbsoluteFill style={{ transform: "scale(1.3)", filter: "blur(40px) brightness(.55)" }}>
            <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </AbsoluteFill>
          <div style={{ position: "absolute", left: 30, right: 30, top: 600, height: 680, overflow: "hidden", borderRadius: 28, boxShadow: "0 30px 80px rgba(0,0,0,.55)", border: "3px solid rgba(255,255,255,.15)" }}>
            <div style={{ width: "100%", height: "100%", transform: `scale(${zoom}) translate(${pan + shake}px, ${shake * 0.6}px)` }}>
              <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        </>
      )}
      <AbsoluteFill style={{ background: sc.portrait ? "linear-gradient(180deg, rgba(5,15,30,.8) 0%, rgba(5,15,30,.25) 42%, rgba(5,15,30,0) 58%, rgba(5,15,30,.8) 100%)" : "none" }} />
      {sc.mood === "dark" && <AbsoluteFill style={{ background: `rgba(5,10,20,${interpolate(f, [0, 60], [0, 0.35], { extrapolateRight: "clamp" })})` }} />}
      {vign > 0 && <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(224,72,72,0) 45%, rgba(224,72,72,${vign}) 100%)` }} />}
      <div style={{ position: "absolute", left: 60, right: 60, top: sc.portrait ? 130 : 110, height: sc.portrait ? 500 : 470, display: "flex", flexDirection: "column", justifyContent: sc.portrait ? "flex-start" : "center" }}>
        {top.map((l, i) => <TextLine key={i} line={l} sceneStart={sc.a} />)}
      </div>
      {bottom.length > 0 && <div style={{ position: "absolute", left: 60, right: 60, top: sc.portrait ? 1400 : 1310, height: sc.portrait ? 420 : 520, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {bottom.map((l, i) => <TextLine key={i} line={l} sceneStart={sc.a} />)}
      </div>}
    </AbsoluteFill>
  );
};

export const MuhasibFoto: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0b1626" }}>
      <Audio src={staticFile("music2.wav")} />
      {SCENES.map((sc, i) => (
        <Sequence key={i} from={Math.round(sc.a * FPS4)} durationInFrames={Math.round((sc.b - sc.a) * FPS4)}>
          <SceneView sc={sc} idx={i} />
        </Sequence>
      ))}
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, background: gold, width: (f / TOTAL4) * 1080 }} />
    </AbsoluteFill>
  );
};
