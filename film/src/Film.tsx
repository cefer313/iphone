import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import T from './data/timeline.json';
import {Shot1} from './shots/Shot1';
import {Shot2} from './shots/Shot2';
import {Shot3} from './shots/Shot3';
import {Shot4} from './shots/Shot4';
import {Shot5} from './shots/Shot5';
import {Shot6} from './shots/Shot6';
import {Title} from './Title';
import {rng} from './lib/math';

const S = T.shots;

/** Film grain and a faint painterly wash, both deterministic per frame. */
const Grade: React.FC = () => {
  const f = useCurrentFrame();
  const r = rng(f * 7919 + 13);
  const ox = Math.floor(r() * 60) - 30, oy = Math.floor(r() * 60) - 30;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <Img src={staticFile('tex/wash.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1, mixBlendMode: 'soft-light'}} />
      <Img
        src={staticFile(`tex/grain${f % 8}.png`)}
        style={{position: 'absolute', left: -40 + ox, top: -40 + oy, width: 1160, height: 2000, opacity: 0.09, mixBlendMode: 'overlay', imageRendering: 'auto'}}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 55%, rgba(4,5,10,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

const FadeOut: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [T.title.fadeOutStart, T.frames - 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#000', opacity: o}} />;
};

export const Film: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence from={S.s1.from} durationInFrames={S.s1.dur} name="1 The quiet street"><Shot1 /></Sequence>
    <Sequence from={S.s2.from} durationInFrames={S.s2.dur} name="2 The weight he carries"><Shot2 /></Sequence>
    <Sequence from={S.s3.from} durationInFrames={S.s3.dur} name="3 The doorway"><Shot3 /></Sequence>
    <Sequence from={S.s4.from} durationInFrames={S.s4.dur} name="4 The act of service"><Shot4 /></Sequence>
    <Sequence from={S.s5.from} durationInFrames={S.s5.dur} name="5 The hands"><Shot5 /></Sequence>
    <Sequence from={S.s6.from} durationInFrames={S.s6.dur} name="6 The departure"><Shot6 /></Sequence>
    <Grade />
    <Title />
    <FadeOut />
    <Audio src={staticFile('soundscape.wav')} />
  </AbsoluteFill>
);
