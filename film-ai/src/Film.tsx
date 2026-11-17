import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import EDL from './edl.json';

/**
 * Edit decision list: each shot takes a window of one generated clip.
 * `from`/`dur` are film frames (30 fps); `clipStart` is the offset inside the clip in frames.
 * Clips play at native speed: nothing is time-stretched.
 */
type Shot = {name: string; clip: string; from: number; dur: number; clipStart: number};

const EndFade: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [585, 599], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#000', opacity: o}} />;
};

export const Film: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {(EDL.shots as Shot[]).map((s) => (
      <Sequence key={s.name} name={s.name} from={s.from} durationInFrames={s.dur}>
        <OffthreadVideo src={staticFile(`clips/${s.clip}`)} startFrom={s.clipStart} muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </Sequence>
    ))}
    <EndFade />
    <Audio src={staticFile('audio/soundscape.wav')} />
  </AbsoluteFill>
);
