# The Unknown Benefactor (AI-animated)

A 20-second vertical short (720 × 1280, 30 fps, 600 frames, H.264 yuv420p).
It is a dramatized devotional scene supplied by the user, not a documented historical event.
The spoken line ("İlahi, bunu məndən qəbul elə.") is the user's text, not a quotation.

Rendered film: `out/unknown-benefactor.mp4`

## How it was made

1. **Look and character references:** three images from Higgsfield (GPT Image 2.6) in a
   rounded, stylized 3D-cartoon style: the man seen only from behind, the two siblings,
   and the street with the door.
2. **Start frames:** one per shot, generated from those references so the clothing,
   faces, door and lighting stay consistent.
3. **Animation:** each start frame animated with Kling 3.0 (image-to-video, silent),
   with prompts that keep the man facing away or cropped at the shoulders.
4. **Assembly:** in Remotion. `src/edl.json` is the edit list (which part of which clip
   fills which film frames). Clips play at native speed, nothing is time-stretched, and
   the shots are contiguous from frame 0 to 600 with no gaps or overlaps.
5. **Sound:** `scripts/make_audio.py` synthesizes the night breeze, footsteps, cloth,
   the sack, two knocks and a soft door settle on the frames listed in `edl.json`. The
   prayer line uses espeak-ng's Azerbaijani voice (`audio_src/prayer.wav`); replace it
   with a real recording and re-run the script. No music.

## Shots

| Frames | Clip | Shot |
|---|---|---|
| 0–119 | s1 | Arrival: walks to the door, sack on his back, amber line under the door |
| 120–239 | s2 | The gift: sack off the shoulder and set down by the door (head out of frame) |
| 240–289 | s3 | Two gentle knocks (hand only) |
| 290–329 | s4 | He walks away and turns the corner, before the door is opened |
| 330–389 | s5 | From inside: the children look out at the empty street |
| 390–479 | s6 | The sister kneels and touches the sack; the boy's sleepiness turns to relief |
| 480–599 | s7 | Private prayer, seen from behind; the line at 16.5 s; fade to black over the last 0.5 s |

## Rebuild

```bash
npm install
python3 scripts/make_audio.py
npm run render
```
