---
name: remotion-video
description: Turn a plain-language video request (topic, length, platform) into a finished Remotion video in the remotion-video/ project — scenes, transitions, captions, music and the final MP4 render. Use when the user asks for a promo, explainer or social video made with Remotion.
---

# Remotion video skill

Project: `remotion-video/` (Remotion 4, React + TypeScript). Example composition: `src/MuhasibPromo.tsx`.

## When the user asks for a video
1. **Duration and platform.** Fix the length and the aspect ratio: YouTube 16:9 (1920×1080), Instagram/TikTok 9:16 (1080×1920). Ask only if the request does not say.
2. **Split into scenes.** Divide the content into scenes (about 5–12 s each). Each scene is one entry in a data array, rendered inside its own `<Sequence>`.
3. **Transitions.** Fade or slide between scenes (`interpolate` on the scene's first and last 10 frames); animate text with `spring`.
4. **Captions.** If there is narration or source text, add a caption layer synced to the scene timings.
5. **Audio.** Put music or voiceover in `public/` and add it with `<Audio src={staticFile(...)}/>`.
6. Register the composition in `src/Root.tsx` (id, fps 30, width, height, durationInFrames).

## Render rule
- Typecheck: `npx tsc --noEmit`
- Preview frames first: `npx remotion still <Id> out/x.png --frame=<n>`; look at them, fix what is wrong, render again.
- Final render: `npx remotion render <Id> out/<name>.mp4`
- In this cloud container add `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`. Google Fonts cannot be fetched here; use locally installed fonts (Inter).
- Deliver only the final, merged, rendered video file to the user.

## Tip
The clearer the request (length + platform + key points), the fewer revisions: e.g. "45 seconds, Instagram, explaining these three points".
