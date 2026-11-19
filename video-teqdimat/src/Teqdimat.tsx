import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from 'remotion';
import { MUSIC, TIMING, VIDEO } from './config';
import { Backdrop } from './components/Elements';
import { Scene1, Scene2, Scene3, Scene4 } from './scenes/Scenes1to4';
import { Scene5, Scene6, Scene7, Scene8 } from './scenes/Scenes5to8';

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
          })
        }
      />
    ) : null}
  </AbsoluteFill>
);
