// Usage: node scripts/stills.mjs <Composition> <outDir> <scale> <frame> [frame...]
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const [comp, outDir, scale, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const opts = {serveUrl, browserExecutable: '/opt/pw-browsers/chromium'};
const composition = await selectComposition({...opts, id: comp});
for (const f of frames) {
  const out = path.join(outDir, `${comp}_${String(f).padStart(3, '0')}.png`);
  await renderStill({...opts, composition, frame: Number(f), output: out, scale: Number(scale), overwrite: true});
  console.log(out);
}
