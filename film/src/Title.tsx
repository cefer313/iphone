import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import T from './data/timeline.json';

const FAMILY = 'Cormorant Garamond Film';
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT = 'U+0100-0130, U+0132-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';

/** Loads the title face locally (Latin + Latin Extended, so Ə ə İ ı ö all render). */
export const useTitleFont = () => {
  const [handle] = useState(() => delayRender('title font'));
  useEffect(() => {
    const faces = [500, 600].flatMap((w) => [
      new FontFace(FAMILY, `url(${staticFile(`fonts/CormorantGaramond-${w}-latin.woff2`)}) format('woff2')`, {weight: String(w), unicodeRange: LATIN}),
      new FontFace(FAMILY, `url(${staticFile(`fonts/CormorantGaramond-${w}-latin-ext.woff2`)}) format('woff2')`, {weight: String(w), unicodeRange: LATIN_EXT}),
    ]);
    Promise.all(faces.map((f) => f.load()))
      .then((loaded) => {
        loaded.forEach((f) => (document.fonts as unknown as {add: (x: FontFace) => void}).add(f));
        return document.fonts.ready;
      })
      .then(() => continueRender(handle))
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);
};

/** Closing caption: a thematic line, not a quotation. Absolute film frames. */
export const Title: React.FC = () => {
  useTitleFont();
  const f = useCurrentFrame();
  const o = interpolate(f, [T.title.in, T.title.full], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(f, [T.title.in, T.title.full + 20], [14, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const o2 = interpolate(f, [T.title.in + 10, T.title.full + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 330, paddingLeft: 96, paddingRight: 96}}>
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 760,
          background: 'linear-gradient(to top, rgba(6,8,14,0.78), rgba(6,8,14,0.45) 55%, rgba(6,8,14,0))',
          opacity: o,
        }}
      />
      <div style={{textAlign: 'center', transform: `translateY(${rise}px)`, fontFamily: `'${FAMILY}', serif`, color: '#efe4cf'}}>
        <div style={{fontSize: 104, fontWeight: 600, letterSpacing: '0.02em', lineHeight: 1.1, opacity: o, textShadow: '0 2px 18px rgba(0,0,0,0.55)'}}>
          İmam Əli (ə)
        </div>
        <div style={{width: 120, height: 1.5, background: 'rgba(239,228,207,0.55)', margin: '34px auto 30px', opacity: o2}} />
        <div style={{fontSize: 58, fontWeight: 500, letterSpacing: '0.03em', lineHeight: 1.25, opacity: o2, textShadow: '0 2px 14px rgba(0,0,0,0.55)'}}>
          Ədalət. Mərhəmət. Təvazökarlıq.
        </div>
      </div>
    </AbsoluteFill>
  );
};
