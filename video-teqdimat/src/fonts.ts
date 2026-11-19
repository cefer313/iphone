// Şriftlər layihənin içindədir (node_modules/@fontsource) — render internet tələb etmir.
// Montserrat: başlıqlar və qiymətlər. Inter: əsas mətnlər.
// Hər ikisi Azərbaycan hərflərini (Ə ə ı İ ş ç ö ü ğ) tam dəstəkləyir.
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import { continueRender, delayRender } from 'remotion';

const SAMPLE = 'ƏəIıİiŞşÇçÖöÜüĞğ AZN 0123456789 •→';
const FACES = ['700 40px Montserrat', '800 40px Montserrat', '500 40px Inter', '600 40px Inter', '700 40px Inter'];

const handle = delayRender('Şriftlər yüklənir');

Promise.all(FACES.map((face) => document.fonts.load(face, SAMPLE)))
  .then(() => document.fonts.ready)
  .then(() => continueRender(handle))
  .catch((err) => {
    console.error('Şrift yüklənmədi', err);
    continueRender(handle);
  });
