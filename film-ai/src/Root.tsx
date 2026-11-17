import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';

export const RemotionRoot: React.FC = () => (
  <Composition id="UnknownBenefactor" component={Film} durationInFrames={600} fps={30} width={720} height={1280} />
);
