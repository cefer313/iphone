import React from "react";

export type Look = { skin: string; hair: string; hairStyle: "short" | "long" | "grey"; shirt: string; sleeve?: string; pants: string; tie?: string; jacket?: string };
type P = [number, number];
type Pose = { le: P; lh: P; re: P; rh: P };
export const POSES: Record<string, Pose> = {
  down: { le: [-92, -120], lh: [-98, -30], re: [92, -120], rh: [98, -30] },
  type: { le: [-105, -125], lh: [-40, -90], re: [105, -125], rh: [40, -90] },
  head: { le: [-165, -300], lh: [-66, -335], re: [165, -300], rh: [66, -335] },
  thumb: { le: [-105, -125], lh: [-40, -90], re: [140, -150], rh: [150, -255] },
  hold: { le: [-95, -125], lh: [-35, -150], re: [95, -125], rh: [35, -150] },
  point: { le: [-92, -120], lh: [-98, -30], re: [150, -235], rh: [245, -290] },
  cert: { le: [-105, -140], lh: [-50, -175], re: [105, -140], rh: [50, -175] },
  wave: { le: [-92, -120], lh: [-98, -30], re: [150, -250], rh: [160, -360] },
  clap: { le: [-100, -140], lh: [-12, -175], re: [100, -140], rh: [12, -175] },
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lp = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

export type Expr = "happy" | "neutral" | "worried" | "stress" | "conf";
const Face: React.FC<{ e: Expr; o: number; t: number }> = ({ e, o, t }) => {
  if (o <= 0.001) return null;
  const st = { stroke: "#2b2018", strokeWidth: 6, fill: "none", strokeLinecap: "round" as const };
  const brow = { stroke: "#3b2a20", strokeWidth: 7, fill: "none", strokeLinecap: "round" as const };
  let eyes, brows, mouth;
  switch (e) {
    case "happy":
      eyes = <><path d="M-38,-312 q14,-13 28,0" {...st} /><path d="M10,-312 q14,-13 28,0" {...st} /></>;
      brows = <path d="M-42,-340 q20,-9 36,-2 M6,-342 q18,-7 36,2" {...brow} />;
      mouth = <path d="M-24,-274 q24,22 48,0" stroke="#a5452f" strokeWidth={6} fill="none" strokeLinecap="round" />; break;
    case "neutral":
      eyes = <><ellipse cx={-24} cy={-312} rx={7} ry={9} fill="#2b2018" /><ellipse cx={24} cy={-312} rx={7} ry={9} fill="#2b2018" /></>;
      brows = <path d="M-42,-336 q20,-7 36,-1 M6,-337 q18,-6 36,1" {...brow} />;
      mouth = <path d="M-18,-274 q18,10 36,0" stroke="#a5452f" strokeWidth={6} fill="none" strokeLinecap="round" />; break;
    case "worried":
      eyes = <><ellipse cx={-24} cy={-312} rx={7} ry={9} fill="#2b2018" /><ellipse cx={24} cy={-312} rx={7} ry={9} fill="#2b2018" /></>;
      brows = <path d="M-44,-334 q20,-16 38,-14 M6,-348 q18,-2 38,14" {...brow} />;
      mouth = <path d="M-20,-272 q7,-8 14,0 q7,8 14,0 q7,-8 14,0" stroke="#a5452f" strokeWidth={5} fill="none" strokeLinecap="round" />; break;
    case "stress": {
      const pd = Math.sin(t * 0.9) * 4;
      eyes = <><circle cx={-25} cy={-312} r={16} fill="#fff" stroke="#2b2018" strokeWidth={3} /><circle cx={25} cy={-312} r={16} fill="#fff" stroke="#2b2018" strokeWidth={3} />
        <circle cx={-25 + pd} cy={-310} r={6.5} fill="#2b2018" /><circle cx={25 + pd} cy={-310} r={6.5} fill="#2b2018" /></>;
      brows = <path d="M-46,-344 L-8,-334 M8,-334 L46,-344" {...brow} strokeWidth={8} />;
      mouth = <ellipse cx={0} cy={-270} rx={17} ry={13} fill="#6e2a20" />; break;
    }
    case "conf":
      eyes = <><path d="M-38,-310 q14,-14 28,0" {...st} /><path d="M10,-310 q14,-14 28,0" {...st} /></>;
      brows = <path d="M-42,-344 q20,-10 36,-3 M6,-347 q18,-7 36,3" {...brow} />;
      mouth = <path d="M-28,-284 q28,38 56,0 z" fill="#fff" stroke="#a5452f" strokeWidth={4} strokeLinejoin="round" />; break;
  }
  return <g opacity={o}>{eyes}{brows}{mouth}</g>;
};

export const Person: React.FC<{
  x: number; y: number; s: number; look: Look; pose?: string; pose2?: string; mix?: number;
  expr?: Expr; expr2?: Expr; emix?: number; walk?: number; seated?: boolean; flip?: boolean;
  shake?: number; t?: number; hold?: "folder" | "cert" | null; sweat?: number; flush?: number; nod?: number;
}> = ({ x, y, s, look, pose = "down", pose2, mix = 0, expr = "neutral", expr2, emix = 0, walk = 0, seated = false, flip = false, shake = 0, t = 0, hold = null, sweat = 0, flush = 0, nod = 0 }) => {
  const A = POSES[pose], B = POSES[pose2 ?? pose];
  const m = Math.max(0, Math.min(1, mix));
  const pz: Pose = { le: lp(A.le, B.le, m), lh: lp(A.lh, B.lh, m), re: lp(A.re, B.re, m), rh: lp(A.rh, B.rh, m) };
  const sleeve = look.sleeve ?? look.jacket ?? look.shirt;
  const legA = Math.sin(walk) * 18 * (walk ? 1 : 0);
  const hx = Math.sin(t * 0.55) * shake * 7, hr = Math.sin(t * 0.3) * shake * 4 + nod * Math.sin(t * 0.35) * 3;
  const arm = (sh: P, el: P, hd: P, key: string) => (
    <g key={key}>
      <path d={`M${sh[0]},${sh[1]} L${el[0]},${el[1]} L${hd[0]},${hd[1]}`} stroke={sleeve} strokeWidth={36} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${sh[0]},${sh[1]} L${el[0]},${el[1]} L${hd[0]},${hd[1]}`} stroke="#000" strokeOpacity={0.08} strokeWidth={36} fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(3,3)" />
      <circle cx={hd[0]} cy={hd[1]} r={19} fill={look.skin} />
    </g>
  );
  const thumbOn = (pose2 ?? pose) === "thumb" ? m : pose === "thumb" ? 1 - m : 0;
  const hair = look.hairStyle;
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
      {!seated && (
        <g>
          <g transform={`rotate(${legA} -22 0)`}><rect x={-46} y={-8} width={44} height={250} rx={18} fill={look.pants} /><ellipse cx={-26} cy={248} rx={34} ry={16} fill="#2a2a2a" /></g>
          <g transform={`rotate(${-legA} 22 0)`}><rect x={2} y={-8} width={44} height={250} rx={18} fill={look.pants} /><ellipse cx={26} cy={248} rx={34} ry={16} fill="#2a2a2a" /></g>
        </g>
      )}
      <g transform={`translate(${hx},0) rotate(${hr} 0 -250)`}>
        {hair === "long" && <path d="M-80,-320 Q-95,-180 -60,-150 L60,-150 Q95,-180 80,-320 Q70,-400 0,-402 Q-70,-400 -80,-320 Z" fill={look.hair} />}
      </g>
      <path d="M-82,-228 Q-100,-120 -80,6 L80,6 Q100,-120 82,-228 Q0,-250 -82,-228 Z" fill={look.shirt} />
      {look.jacket && <><path d="M-82,-228 Q-100,-120 -80,6 L-22,6 L-8,-200 Z" fill={look.jacket} /><path d="M82,-228 Q100,-120 80,6 L22,6 L8,-200 Z" fill={look.jacket} /></>}
      <path d="M-82,-228 Q-100,-120 -80,6 L-40,6 Q-60,-120 -50,-232 Z" fill="#000" opacity={0.07} />
      <path d="M-26,-236 L0,-196 L26,-236 Z" fill="#fff" />
      {look.tie && <path d="M-9,-206 L9,-206 L16,-110 L0,-88 L-16,-110 Z" fill={look.tie} />}
      <rect x={-19} y={-262} width={38} height={36} fill={look.skin} />
      <rect x={-19} y={-262} width={38} height={14} fill="#000" opacity={0.08} />
      {arm([-70, -215], pz.le, pz.lh, "l")}
      {arm([70, -215], pz.re, pz.rh, "r")}
      {thumbOn > 0.01 && <rect x={pz.rh[0] - 7} y={pz.rh[1] - 52} width={15} height={40} rx={7} fill={look.skin} opacity={thumbOn} />}
      {hold === "folder" && <g transform={`translate(0,${(pz.lh[1] + pz.rh[1]) / 2 + 6})`}><rect x={-62} y={-48} width={124} height={92} rx={6} fill="#f2b134" stroke="#c98c1a" strokeWidth={4} /><rect x={-50} y={-38} width={100} height={8} fill="#fff" opacity={0.7} /></g>}
      {hold === "cert" && <g transform={`translate(0,${(pz.lh[1] + pz.rh[1]) / 2 + 10})`}><rect x={-70} y={-60} width={140} height={100} rx={6} fill="#fffaf0" stroke="#d4a843" strokeWidth={5} /><rect x={-48} y={-40} width={96} height={8} fill="#19a7a0" /><rect x={-40} y={-22} width={80} height={5} fill="#c9b48a" /><rect x={-40} y={-10} width={80} height={5} fill="#c9b48a" /><circle cx={38} cy={18} r={13} fill="#e04848" /></g>}
      {hold && <><circle cx={pz.lh[0]} cy={pz.lh[1]} r={19} fill={look.skin} /><circle cx={pz.rh[0]} cy={pz.rh[1]} r={19} fill={look.skin} /></>}
      <g transform={`translate(${hx},0) rotate(${hr} 0 -250)`}>
        <ellipse cx={-68} cy={-308} rx={14} ry={20} fill={look.skin} /><ellipse cx={68} cy={-308} rx={14} ry={20} fill={look.skin} />
        <ellipse cx={0} cy={-306} rx={66} ry={74} fill={look.skin} />
        <ellipse cx={0} cy={-306} rx={66} ry={74} fill="#e04848" opacity={flush} />
        <ellipse cx={-38} cy={-286} rx={12} ry={7} fill="#e8836b" opacity={0.25} /><ellipse cx={38} cy={-286} rx={12} ry={7} fill="#e8836b" opacity={0.25} />
        <path d="M-4,-300 q4,14 -2,20" stroke="#000" strokeOpacity={0.15} strokeWidth={4} fill="none" strokeLinecap="round" />
        {hair === "short" && <path d="M-68,-318 Q-74,-392 -10,-396 Q50,-402 68,-352 Q72,-330 66,-316 Q60,-352 30,-358 Q0,-344 -30,-356 Q-60,-350 -68,-318 Z" fill={look.hair} />}
        {hair === "long" && <path d="M-70,-300 Q-78,-392 0,-394 Q78,-392 70,-300 Q66,-350 20,-362 Q-30,-340 -56,-350 Q-66,-330 -70,-300 Z" fill={look.hair} />}
        {hair === "grey" && <path d="M-68,-322 Q-66,-378 0,-384 Q66,-378 68,-322 Q60,-350 40,-356 Q0,-364 -40,-356 Q-60,-350 -68,-322 Z" fill={look.hair} />}
        {hair === "grey" && <rect x={-46} y={-322} width={92} height={22} rx={10} fill="none" stroke="#333" strokeWidth={4} />}
        <Face e={expr} o={1 - (expr2 ? emix : 0)} t={t} />
        {expr2 && <Face e={expr2} o={emix} t={t} />}
        {sweat > 0 && <g opacity={sweat}>
          <path d={`M72,${-350 + ((t * 2) % 30) * 2} q10,18 0,26 q-10,-8 0,-26z`} fill="#7fc8f0" />
          <path d={`M-74,${-360 + ((t * 2 + 15) % 30) * 2} q9,16 0,23 q-9,-7 0,-23z`} fill="#7fc8f0" />
        </g>}
      </g>
    </g>
  );
};

export const BackPerson: React.FC<{ x: number; y: number; s: number; look: Look; raise?: number; type?: number; t?: number }> = ({ x, y, s, look, raise = 0, type = 0, t = 0 }) => {
  const r = Math.max(0, Math.min(1, raise));
  const ex = lerp(110, 120, r), ey = lerp(-80, -330, r), hxp = lerp(70, 115, r), hyp = lerp(10, -450, r);
  const tw = type ? Math.sin(t * 1.4) * 6 : 0;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {look.hairStyle === "long" && <path d="M-76,-300 Q-96,-170 -64,-140 L64,-140 Q96,-170 76,-300 Z" fill={look.hair} />}
      <path d="M-110,-200 Q-130,-100 -120,40 L120,40 Q130,-100 110,-200 Q0,-236 -110,-200 Z" fill={look.shirt} />
      <path d="M-110,-200 Q-130,-100 -120,40 L-70,40 Q-90,-100 -80,-206 Z" fill="#000" opacity={0.1} />
      <rect x={-22} y={-240} width={44} height={40} fill={look.skin} />
      <ellipse cx={-64} cy={-300} rx={13} ry={19} fill={look.skin} /><ellipse cx={64} cy={-300} rx={13} ry={19} fill={look.skin} />
      <ellipse cx={0} cy={-300} rx={66} ry={72} fill={look.hair} />
      {r > 0.01 && <g><path d={`M95,-195 L${ex},${ey} L${hxp},${hyp}`} stroke={look.sleeve ?? look.shirt} strokeWidth={40} fill="none" strokeLinecap="round" strokeLinejoin="round" /><circle cx={hxp} cy={hyp} r={22} fill={look.skin} /></g>}
      {type > 0 && <g><circle cx={-60 + tw} cy={30} r={20} fill={look.skin} /><circle cx={60 - tw} cy={30} r={20} fill={look.skin} /></g>}
    </g>
  );
};

export const LOOKS: Record<string, Look> = {
  kamran: { skin: "#f3cfae", hair: "#2f2219", hairStyle: "short", shirt: "#8fbbe8", sleeve: "#7aaee0", pants: "#2d3e55", tie: "#0f2a4a" },
  aysel: { skin: "#f1c9a6", hair: "#5a3a26", hairStyle: "long", shirt: "#f4f4f4", jacket: "#b0485a", pants: "#3a3a46" },
  orxan: { skin: "#e5b892", hair: "#1d1a17", hairStyle: "short", shirt: "#ffffff", jacket: "#4a5a6a", pants: "#2c3440", tie: "#7a1f2c" },
  trainer: { skin: "#f0c6a0", hair: "#2a1d14", hairStyle: "long", shirt: "#ffffff", jacket: "#19a7a0", pants: "#24323f" },
  boss: { skin: "#ecc19c", hair: "#9a9a9a", hairStyle: "grey", shirt: "#ffffff", jacket: "#2b3442", pants: "#2b3442", tie: "#19a7a0" },
  nigar: { skin: "#f4d2b5", hair: "#7a4a2a", hairStyle: "long", shirt: "#f6d36b", pants: "#3a3a46" },
  elvin: { skin: "#e8bc96", hair: "#2a2017", hairStyle: "short", shirt: "#9fd3b0", pants: "#2c3440" },
};
