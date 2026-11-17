# The Unknown Benefactor (3D)

A 20-second vertical short (720 × 1280, 30 fps, 600 frames). It is a dramatized
devotional scene supplied by the user, not a documented historical event. The spoken
line is the user's text and is not presented as a quotation.

**What it is:** genuine 3D character animation rendered frame by frame in Blender's
Cycles path tracer (global illumination, subsurface skin, depth of field), then
sequenced, mixed and exported with Remotion.
**What it is not:** Disney-quality. There are no sculpted assets in this environment,
so every character, garment and set piece is built procedurally in Python. The
characters read as stylized, toy-like figures. The voice is espeak-ng's Azerbaijani
synthesis, which is intelligible but mechanical. Replace `audio_src/prayer.wav` with a
real recording and run `npm run audio` to swap it in.

Imam Ali's face is never modelled: the head is a plain skull under a wrapped head
covering, and every shot of him is from behind, from the side-rear or of his hands only.

## Shots

| Frames | Shot | Camera |
|---|---|---|
| 0–119 | The arrival: he walks to the door with the sack on his back; an amber line shows under the door | Rear three-quarter tracking |
| 120–239 | The gift: the sack slides off his shoulder, he squats, it settles and compresses on the ground, his fingers release, the folded top opens on flatbread and dates | Close, behind and to one side; head out of frame |
| 240–263 | The knock: two gentle knocks | Close-up on the hand |
| 264–329 | The departure: he turns and walks around the corner before the door opens; the cloak follows the turn late | Rear medium |
| 330–389 | The door opens inward | From inside, behind the children |
| 390–479 | The sister looks at the sack, scans the empty street both ways, kneels and touches it; the boy's sleepy look turns to quiet relief | Reverse angle from the threshold |
| 480–599 | The private prayer: he slows, bows his head and raises an open hand to his chest. The line plays at 16.5 s and ends at about 19.3 s; then the picture fades to black | Rear medium in a secluded courtyard |

## Build

```bash
npm install
npm run frames     # Blender (bpy) renders public/frames/f0000-f0599.png  (~13 s/frame on 4 CPUs)
npm run audio      # synthesises public/audio/soundscape.wav from the same choreography
npm run render     # Remotion assembles + exports out/unknown-benefactor.mp4 (H.264 yuv420p)
```

`npm run frames` and `npm run audio` need Python with the `bpy` package (`pip install bpy`)
and `espeak-ng` with its Azerbaijani voice.

- `blender/lib.py`: geometry, IK and material helpers.
- `blender/gait.py`: planted-foot walking with turning.
- `blender/characters.py`: the man's rig with per-frame cloth (robe, delayed cloak,
  sleeves), jointed hands, the sack, and the children's faces (eyes, lids, brows, mouth).
- `blender/world.py`: the street, the house, the inward door, the lamp-lit interior,
  the alley and the courtyard.
- `blender/shots.py`: all choreography and cameras as pure functions of the frame.
- `blender/render.py`: renders any frame range.
- `scripts/make_audio.py`: wind, footsteps on the walk's landing frames, cloth, the sack,
  the knocks, the creak and the line.
