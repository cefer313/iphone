import React from 'react';
import { Composition } from 'remotion';
import './fonts';
import { VIDEO } from './config';
import { Teqdimat } from './Teqdimat';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Teqdimat"
    component={Teqdimat}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);
