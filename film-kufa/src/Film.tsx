import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import EDL from './edl.json';

/**
 * Edit decision list (24 fps): each shot plays a window of one generated clip at native speed.
 * `xfade` frames: the shot fades in over the previous one (gentle transition), still within its own window.
 */
type Shot = {name: string; clip: string; from: number; dur: number; clipStart: number; xfade?: number};

const Clip: React.FC<{s: Shot}> = ({s}) => {
  const f = useCurrentFrame();
  const o = s.xfade ? interpolate(f, [0, s.xfade], [0, 1], {extrapolateRight: 'clamp'}) : 1;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <OffthreadVideo src={staticFile(`clips/${s.clip}`)} startFrom={s.clipStart} muted
        style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
  );
};

const EndFade: React.FC = () => {
  const f = useCurrentFrame();
  const [a, b] = EDL.fadeOut;
  const o = interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#000', opacity: o}} />;
};

export const Film: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {(EDL.shots as Shot[]).map((s, i) => {
      // keep the previous shot underneath while this one cross-fades in
      const prev = (EDL.shots as Shot[])[i - 1];
      return (
        <React.Fragment key={s.name}>
          {s.xfade && prev ? (
            <Sequence from={s.from} durationInFrames={s.xfade} name={`${prev.name} (tail)`}>
              <OffthreadVideo src={staticFile(`clips/${prev.clip}`)} startFrom={prev.clipStart + prev.dur} muted
                style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </Sequence>
          ) : null}
          <Sequence name={s.name} from={s.from} durationInFrames={s.dur}>
            <Clip s={s} />
          </Sequence>
        </React.Fragment>
      );
    })}
    <EndFade />
    <Audio src={staticFile('audio/soundscape.wav')} />
  </AbsoluteFill>
);
