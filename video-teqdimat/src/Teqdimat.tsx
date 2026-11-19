import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from 'remotion';
import { MUSIC, SFX, SFX_VOLUME, TIMING, VIDEO, VOICE } from './config';
import { Backdrop } from './components/Elements';
import { Scene1, Scene2, Scene3, Scene4 } from './scenes/Scenes1to4';
import { Scene5, Scene6, Scene7, Scene8 } from './scenes/Scenes5to8';

// Diktorun danışdığı intervallar (kadr) — musiqinin səsini bu vaxtlarda azaltmaq üçün.
const SPEECH = (Object.keys(VOICE.clips) as (keyof typeof VOICE.clips)[]).map((k) => {
  const start = TIMING[k].from + VOICE.clips[k].offset;
  return [start, start + Math.round(VOICE.clips[k].length * VIDEO.fps)] as const;
});

const duckAt = (f: number) => {
  if (!VOICE.enabled) return 1;
  // 10 kadrlıq yumşaq keçidlə musiqi diktorun altında enir
  let d = 1;
  for (const [a, b] of SPEECH) {
    const v = interpolate(f, [a - 10, a, b, b + 14], [1, VOICE.musicDuck, VOICE.musicDuck, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    d = Math.min(d, v);
  }
  return d;
};

const SCENES: [keyof typeof TIMING, React.FC][] = [
  ['s1', Scene1],
  ['s2', Scene2],
  ['s3', Scene3],
  ['s4', Scene4],
  ['s5', Scene5],
  ['s6', Scene6],
  ['s7', Scene7],
  ['s8', Scene8],
];

export const Teqdimat: React.FC = () => (
  <AbsoluteFill>
    {/* Fon son səhnədə dayanır ki, son ekran tam sabit qalsın. */}
    <Backdrop freezeAt={TIMING.s8.from + 60} />
    {SCENES.map(([key, Comp]) => (
      <Sequence key={key} from={TIMING[key].from} durationInFrames={TIMING[key].duration} name={key}>
        <Comp />
      </Sequence>
    ))}
    {MUSIC.file ? (
      <Audio
        src={staticFile(MUSIC.file)}
        volume={(f) =>
          interpolate(f, [0, 45, VIDEO.durationInFrames - 75, VIDEO.durationInFrames], [0, MUSIC.volume, MUSIC.volume, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }) * duckAt(f)
        }
      />
    ) : null}
    {VOICE.enabled &&
      (Object.keys(VOICE.clips) as (keyof typeof VOICE.clips)[]).map((k) => (
        <Sequence key={`voice-${k}`} from={TIMING[k].from + VOICE.clips[k].offset} name={`diktor ${k}`} layout="none">
          <Audio src={staticFile(VOICE.clips[k].file)} volume={VOICE.volume} />
        </Sequence>
      ))}
    {SFX_VOLUME > 0 &&
      SFX.map((c, i) => (
        <Sequence key={`sfx-${i}`} from={c.at} durationInFrames={VIDEO.durationInFrames - c.at} name={`sfx ${c.file}`} layout="none">
          <Audio src={staticFile(c.file)} volume={c.volume * SFX_VOLUME} />
        </Sequence>
      ))}
  </AbsoluteFill>
);
