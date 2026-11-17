# The Weight of Compassion

A 30-second vertical (1080 × 1920, 30 fps, 900 frames) animated short made with
[Remotion](https://www.remotion.dev/). It is a historically inspired visual
narrative, not a reconstruction of a specific recorded event: Imam Ali (peace be
upon him) carries a sack of provisions through a quiet night street and leaves it
with a household in need. There is no dialogue, no narration, no music and no
quotation. His face is never shown: every shot is a rear view, an
over-the-shoulder view, a side-rear view or a cropped close-up of his hands.

Rendered film: `out/the-weight-of-compassion.mp4` (H.264, yuv420p, AAC audio).

## Shots

| # | Frames | Shot | What moves |
|---|--------|------|------------|
| 1 | 0–119 | The quiet street | Rear-view walk with planted feet, pelvis weight shift, counter-rotating shoulders, swinging free arm, lagging robe hem and sack; slow camera push; lamplight under a distant door |
| 2 | 120–239 | The weight he carries | Close-up: jointed fingers tighten on the tied neck, he hefts the sack, the sack body follows with a critically damped lag and settles; breathing |
| 3 | 240–389 | The doorway | Over the shoulder: last two steps and the feet close, he settles, raises his hand, knocks twice, lowers it, waits; the door swings inward and lamplight spreads over the threshold onto his shoulder |
| 4 | 390–599 | The act of service | Low side-rear: he kneels (step forward, knee to ground, torso counterbalance), lowers the sack, it touches the mat and compresses, his grip releases only after contact, he opens the top to show flatbread; the child takes one step, the caregiver's shoulders soften |
| 5 | 600–749 | The hands | Close-up handoff: bread held between his thumb and fingers, the child's hands reach and support it, his thumb lifts and his hand withdraws, the child draws it closer; hold |
| 6 | 750–899 | The departure | Rear wide: he walks away empty-handed into the blue street, the doorway lit behind him; closing caption fades in from frame 795, picture fades to black over the last 12 frames |

## How it is built

Everything is deterministic and driven by `useCurrentFrame()`; no CSS
animations, timers, physics or unseeded randomness.

- `src/lib/camera.ts`: a pinhole camera. Shots 1, 3, 4 and 6 share one world
  (metres, y up), so the character's proportions, the door and the mat stay
  consistent from shot to shot.
- `src/rig/gait.ts`: the walk. Footfalls come from `src/data/timeline.json`;
  stance feet stay planted, the heel peels off about the toe, the swing foot
  follows an arc, and the pelvis passes between the feet with a vertical bob and
  a lateral weight shift.
- `src/rig/body.ts` and `src/rig/Figure.tsx`: the articulated rig. It has a pelvis,
  spine, shoulders and head, with two-bone IK for the thigh/shin and upper-arm/forearm.
  Limbs are depth-sorted capsules, and sandals are projected soles. The robe is
  built as cloth hulls over body rings, and its hem trails the body. The head
  covering is plain cloth with a wrap band and nape tail. No facial features are
  ever drawn.
- `src/rig/Sack.tsx`: a burlap sack with a tie cord, contact compression and an opening top.
- `src/rig/Hand2D.tsx`: segmented fingers for the two close-ups.
- `src/env/`: the street (set-back houses, beam ends, doors, jars, distant
  roofs, palm), the household wall, the inward-swinging door, the lamp-lit interior
  and the flickering oil lamp.
- `src/Film.tsx`: assembles the shots, film grain, the painterly wash, the vignette,
  the caption, the fade and the audio.

## Assets (all generated here, no third-party media)

```bash
npm run assets   # timeline.json, textures (public/tex), soundscape (public/soundscape.wav)
```

- Textures (`scripts/make_textures.py`): seeded FFT noise for plaster, earth,
  cloth weave, burlap, reed mat, a painterly wash and eight film-grain frames.
- Sound (`scripts/make_audio.py`): synthesised from seeded noise. It has night
  wind, sandal steps on dry earth placed on each foot's landing frame (getting
  quieter with distance), cloth rustles, two wooden knocks, a hinge creak and the
  soft contact of the sack. The peak is -6 dBFS, and the sound fades out over the
  last 2 seconds.
- Font: Cormorant Garamond (SIL Open Font License), stored locally in `public/fonts`
  with its Latin Extended subset, so Ə, ə, İ, ı and ö render correctly.

## Render

```bash
npm install
npm run render
```

The render script points Remotion at a local Chromium (`--browser-executable`).
Remove that flag if you want Remotion to use its own browser download.

Preview and edit in the studio:

```bash
npm run studio
```
