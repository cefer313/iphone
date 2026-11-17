import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {Shot1} from './shots/Shot1';
import {Shot2} from './shots/Shot2';
import {Shot3} from './shots/Shot3';
import {Shot4} from './shots/Shot4';
import {Shot5} from './shots/Shot5';
import {Shot6} from './shots/Shot6';

const v = {fps: 30, width: 1080, height: 1920};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="WeightOfCompassion" component={Film} durationInFrames={900} {...v} />
    <Composition id="Shot1" component={Shot1} durationInFrames={120} {...v} />
    <Composition id="Shot2" component={Shot2} durationInFrames={120} {...v} />
    <Composition id="Shot3" component={Shot3} durationInFrames={150} {...v} />
    <Composition id="Shot4" component={Shot4} durationInFrames={210} {...v} />
    <Composition id="Shot5" component={Shot5} durationInFrames={150} {...v} />
    <Composition id="Shot6" component={Shot6} durationInFrames={150} {...v} />
  </>
);
