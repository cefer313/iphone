import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';

/** Shot boundaries (frames). The picture is the Blender render; Remotion handles timing, audio and the end fade. */
export const SHOTS = [
  {name: 'The arrival', from: 0, to: 120},
  {name: 'The gift', from: 120, to: 240},
  {name: 'The knock', from: 240, to: 264},
  {name: 'The departure', from: 264, to: 330},
  {name: 'The door opens', from: 330, to: 390},
  {name: 'The unknown benefactor', from: 390, to: 480},
  {name: 'The private prayer', from: 480, to: 600},
];

const Frame: React.FC<{offset: number}> = ({offset}) => {
  const f = useCurrentFrame() + offset;
  return (
    <Img
      src={staticFile(`frames/f${String(f).padStart(4, '0')}.png`)}
      style={{width: '100%', height: '100%', objectFit: 'cover'}}
    />
  );
};

const Grade: React.FC = () => (
  <AbsoluteFill
    style={{background: 'radial-gradient(ellipse 80% 62% at 50% 46%, rgba(0,0,0,0) 58%, rgba(3,4,10,0.45) 100%)'}}
  />
);

const EndFade: React.FC = () => {
  const f = useCurrentFrame();
  // the spoken line ends at ~19.3 s; the picture fades to black over the final half-second
  const o = interpolate(f, [585, 599], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#000', opacity: o}} />;
};

export const Film: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {SHOTS.map((s) => (
      <Sequence key={s.name} name={s.name} from={s.from} durationInFrames={s.to - s.from}>
        <Frame offset={s.from} />
      </Sequence>
    ))}
    <Grade />
    <EndFade />
    <Audio src={staticFile('audio/soundscape.wav')} />
  </AbsoluteFill>
);
