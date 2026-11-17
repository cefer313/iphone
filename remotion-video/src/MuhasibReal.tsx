import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Real-footage version: put clips in public/clips/s1.mp4 ... s9.mp4 (any length, any size; they are cropped to 9:16).
export const FPS3 = 30;
export const TOTAL3 = 82 * FPS3;
const font = "Inter, 'DejaVu Sans', sans-serif";
const gold = "#f2b134";
const G = (s: string) => <span style={{ color: gold }}>{s}</span>;

type Line = { at: number; text: React.ReactNode; size?: number; weight?: number };
type Sc = { clip: string; a: number; b: number; lines: Line[] };
const SCENES: Sc[] = [
  { clip: "s1", a: 0, b: 7, lines: [{ at: 0.3, text: <>TƏSƏVVÜR EDİN...</>, size: 80, weight: 900 }, { at: 1.8, text: <>Siz {G("mühasib")} vəzifəsinə işə qəbul olunmusunuz.</> }, { at: 3.6, text: "Sabah ilk iş gününüzdür." }] },
  { clip: "s2", a: 7, b: 13.5, lines: [{ at: 7.2, text: <>Qarşınızda bir-birinin ardınca {G("tapşırıqlar")} yaranır...</> }, { at: 8.6, text: "Yeni işçi · Elektron qaimə · Bank əməliyyatları", size: 40 }] },
  { clip: "s3", a: 13.5, b: 20.2, lines: [{ at: 13.7, text: "Vergi kabinetinə məktub. Ay sonu: əməkhaqqı, vergi və sosial sığorta hesabatları...", size: 44 }] },
  { clip: "s4", a: 20.2, b: 27.4, lines: [{ at: 20.4, text: "İndi özünüzə bir sual verin:" }, { at: 21.6, text: <>Bütün bu işləri {G("müstəqil şəkildə")} yerinə yetirməyə hazırsınızmı?</>, size: 68, weight: 900 }] },
  { clip: "s5", a: 27.4, b: 40, lines: [{ at: 27.6, text: <>Əgər cavabınız {G("xeyrdirsə")}, bu təlim məhz sizin üçündür!</>, size: 62, weight: 900 }, { at: 31, text: "Vergi kabineti · E-qaimə · ƏMAS · Bank · Əməkhaqqı · Vergi hesabatları", size: 40 }] },
  { clip: "s6", a: 40, b: 54.4, lines: [{ at: 40.2, text: <>Burada sadəcə {G("dinləməyəcəksiniz.")}</>, size: 64, weight: 900 }, { at: 42.5, text: "Hər mövzunu özünüz tətbiq edəcək, praktiki bacarığa çevirəcəksiniz." }] },
  { clip: "s7", a: 54.4, b: 64.4, lines: [{ at: 54.6, text: "Bəs bu təlim sizə nə qazandıracaq?" }, { at: 55.8, text: <>Ən əsası — {G("özünüzə inam!")}</>, size: 72, weight: 900 }] },
  { clip: "s8", a: 64.4, b: 71.4, lines: [{ at: 64.6, text: "Məqsədimiz sizə sadəcə mühasibatlığı öyrətmək deyil," }, { at: 66.4, text: <>sizi {G("real iş mühitinə")} hazırlamaqdır!</>, size: 72, weight: 900 }] },
  { clip: "s9", a: 71.4, b: 82, lines: [{ at: 71.6, text: "Diplomunuz ola bilər, nəzəri bilikləriniz də ola bilər." }, { at: 73.8, text: <>Amma sizdən {G("praktiki təcrübə")} tələb olunursa —</> }, { at: 76, text: <>gəlin, həmin təcrübəni {G("birlikdə qazanaq!")}</>, size: 76, weight: 900 }] },
];

const TextLine: React.FC<{ line: Line; sceneStart: number }> = ({ line, sceneStart }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = f - Math.round((line.at - sceneStart) * fps);
  if (local < 0) return null;
  const p = spring({ frame: local, fps, config: { damping: 14, stiffness: 120 } });
  return (
    <div style={{ opacity: Math.min(1, local / 10), transform: `translateY(${(1 - p) * 40}px)`, fontFamily: font, fontWeight: line.weight ?? 800, fontSize: line.size ?? 50, color: "#fff", textAlign: "center", lineHeight: 1.2, margin: "18px 0", textShadow: "0 4px 18px rgba(0,0,0,.65)" }}>
      {line.text}
    </div>
  );
};

const SceneView: React.FC<{ sc: Sc }> = ({ sc }) => {
  const f = useCurrentFrame();
  const len = Math.round((sc.b - sc.a) * FPS3);
  const fade = interpolate(f, [0, 12, len - 12, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = interpolate(f, [0, len], [1.0, 1.08]);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo src={staticFile(`clips/${sc.clip}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,15,30,.72) 0%, rgba(5,15,30,.15) 45%, rgba(5,15,30,.25) 100%)" }} />
      <AbsoluteFill style={{ padding: "150px 70px", justifyContent: "flex-start" }}>
        {sc.lines.map((l, i) => <TextLine key={i} line={l} sceneStart={sc.a} />)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const MuhasibReal: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("music2.wav")} />
      {SCENES.map((sc, i) => (
        <Sequence key={i} from={Math.round(sc.a * FPS3)} durationInFrames={Math.round((sc.b - sc.a) * FPS3)}>
          <SceneView sc={sc} />
        </Sequence>
      ))}
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, background: gold, width: (f / TOTAL3) * 1080 }} />
    </AbsoluteFill>
  );
};
