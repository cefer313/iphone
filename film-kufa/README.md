# Kufa Night — a quiet kindness

A 20-second cinematic animated short (1280 × 720, 16:9, 24 fps, exactly 480 frames, H.264 yuv420p, AAC).
It is a dramatized devotional scene supplied by the user. The man represents Imam Ali (peace be upon him)
and is only ever shown from behind or with his face turned away. The spoken line
"İlahi, bunu məndən qəbul elə." is the user's text, not a historical quotation.

Rendered film: `out/kufa-night-kindness.mp4`

## Pipeline

1. **References** (Higgsfield, GPT Image 2.6, high quality): the man from behind in a
   lantern-lit Kufa street, the boy, and the street with the humble door.
2. **Start frames:** one per shot, generated from those references for consistent
   characters, door and lighting.
3. **Animation:** each start frame animated with Kling 3.0 **pro** (image-to-video,
   5 s, silent).
4. **Voice:** ElevenLabs v4 (preset voice "Desmond"), a soft and humble delivery with a
   natural pause after "İlahi". It enters at 15.25 s.
5. **Assembly:** in Remotion. `src/edl.json` lists the shot windows. Clips play at
   native speed, with gentle cross-fades into the last three shots and a fade to
   black over the final half-second.
6. **Sound:** `scripts/make_audio.py` builds the mix on the frames in `edl.json`.
   Footsteps, knocks and the door creak use realistic sound effects generated with
   Mirelo SFX via Higgsfield (`audio_src/sfx_*.wav`): each sandal step is cut out
   individually and placed on the frame where a foot is planted (frames 2, 22, 48,
   72, 94, 270, 286), and the two knuckle knocks land on the frames where the fist
   meets the door (207, 214), found by tracking the fist. The night breeze, cloth
   rustle and the bag settling are synthesized. No music.
7. **Pace:** the opening walk (`k1s.mp4`) is a regenerated, calmer take slowed to 0.8×
   with motion-compensated interpolation (ffmpeg `minterpolate`), giving about one
   step per second.

## Shots

| Frames | Clip | Shot |
|---|---|---|
| 0–95 | k1s | Tracking behind him (slow, measured pace) through the lantern-lit street, bag on his shoulder |
| 96–203 | k2 | He leans, bends and lowers the heavy bag before the door, keeps a hand on it, lets go |
| 204–287 | k3 | Two soft knocks; he steps back, turns away and walks off |
| 288–359 | k4 | The boy opens the door, finds the bag, looks around, and a smile grows |
| 360–437 | k5 | Under the moon, seen from behind, he raises his hands in prayer; the line plays |
| 438–479 | k6 | Wide shot of the peaceful street; fade to black |

## Rebuild

```bash
npm install
python3 scripts/make_audio.py
npm run render
```
