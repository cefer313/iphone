import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';

export const RemotionRoot: React.FC = () => (
  <Composition id="KufaNight" component={Film} durationInFrames={480} fps={24} width={1280} height={720} />
);
