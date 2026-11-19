// Hər səhnədən yoxlama kadrları çıxarır: out/stills/*.png
// İstifadə: npm run stills
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const frames = {
  's1-son': 200, 's2-son': 440, 's3-kart1': 520, 's3-hamisi': 960, 's4-son': 1270,
  's5-son': 1630, 's6-qiymet': 1830, 's6-amiller': 2020, 's7-orta': 2250, 's7-qeyd': 2470, 's8-son': 2699,
};
mkdirSync('out/stills', { recursive: true });
const extra = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];
for (const [name, frame] of Object.entries(frames)) {
  execFileSync('npx', ['remotion', 'still', 'src/index.ts', 'Teqdimat', `out/stills/${name}.png`, `--frame=${frame}`, ...extra], { stdio: 'inherit' });
}
