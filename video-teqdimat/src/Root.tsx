import React from 'react';
import { Composition } from 'remotion';
import './fonts';
import { VIDEO } from './config';
import { Teqdimat } from './Teqdimat';
import { MuhasibReels, REELS_TOTAL } from './reels/Reels';

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="Teqdimat"
    component={Teqdimat}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
  <Composition id="MuhasibReels" component={MuhasibReels} durationInFrames={REELS_TOTAL} fps={30} width={1080} height={1920} />
  </>
);
