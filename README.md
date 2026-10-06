# saas-video-ad-skill

A Claude Code skill that turns your **real web app** into short promotional ads (15–40s).
It films the actual product from its production build with seeded data, then cuts it into
an ad: kinetic type, full-screen app footage with text overlays, a voice-over that drives
every cue, word-synced subtitles, an ambient bed and UI sound effects. Everything renders
locally with [HyperFrames](https://github.com/heygen-com/hyperframes).

It asks you for the style, colours, voice and storyline (or drafts them for you and lets
you pick), and it never uses mock UI.

## Example

[![aro.day — It fits](examples/aroday-it-fits/thumbnail.jpg)](examples/aroday-it-fits/aroday-it-fits.mp4)

▶ [examples/aroday-it-fits/aroday-it-fits.mp4](examples/aroday-it-fits/aroday-it-fits.mp4): a 24s ad for
[aro.day](https://aro.day)'s day-capacity meter. Every frame of the product is the real app.
How it was made, and the six rounds of notes that shaped it: [examples/aroday-it-fits](examples/aroday-it-fits).

## How it works

```
intake (style · colours · voice · story)          references/intake.md
   ↓
script — hooks, whole-number maths, TTS spelling   references/script.md
   ↓
capture — real app, seeded, one take per beat      video-demo  ·  references/capture.md
   ↓            measure events: scripts/cuts.sh
storyboard + voice (HeyGen / Kokoro) + ambient + SFX     HyperFrames product-launch-video
   ↓            pad lines to the footage: scripts/pad-voices.mjs
build — bake shots, frames from word cues,         scripts/build.sh
        subtitles, assemble, overlays above footage
   ↓
render + verify the MP4 (footage count, audio,      scripts/render.sh
        thumbnail, frame strip)
```

The voice's word timestamps are the clock. Change a line or the voice speed, rebuild, and
every overlay, highlight ring and cut re-times itself.

## Requirements

- [Claude Code](https://claude.com/claude-code)
- Node ≥ 22, ffmpeg
- [video-demo](https://github.com/nilbuild/video-demo) skill: `npx skills add nilbuild/video-demo`
- HyperFrames CLI + skills: `npx hyperframes skills update product-launch-video`
- Optional: a HeyGen account (`npx hyperframes auth login`) for better voices and a music
  library. Without it, voice and music use local engines (Kokoro / MusicGen).

## Install

```bash
git clone https://github.com/MotazAbuElnasr/saas-video-ad-skill ~/.claude/skills/saas-video-ad
```

## Use

Ask Claude Code from your app's repo:

```
make a 25s promo ad for this app showing <the feature>
make three ad variations for <feature>, male voice, our brand colours
re-cut the ad: hold longer after "Done", slower voice
```

The skill asks for anything it can't infer: storyline or script (yours verbatim, or
drafted with 5–7 hook options), format (16:9 / 1:1 / 9:16), style (your brand or a preset),
colours, voice, music, subtitles and end card. It then shows the script as a table for
approval before it films or buys any TTS.

## Layout

| Path | What |
|---|---|
| [`SKILL.md`](SKILL.md) | the run, step by step, with gates |
| [`references/`](references) | intake questions, script rules, capture guide, **lessons learned** |
| [`scripts/`](scripts) | timing, shot baking, voice pads, caption merge, frame kit, build / render / measure |
| [`templates/`](templates) | `ad.config.mjs`, `gen-frames.mjs`, `capture.scene.ts` |
| [`examples/aroday-it-fits/`](examples/aroday-it-fits) | a complete ad: config, frames, storyboard, script, capture scenes, the MP4 |

## Lessons baked in

From the session that made the example ([full list](references/lessons.md)):

- **Full screen, no zoom.** Text goes in overlay cards; a highlight ring replaces punch-ins.
- **No cut inside a gesture.** Cause → effect is one take.
- **Hold the payoff** for 1–1.5s.
- **Voice lands after the event it names.**
- **Whole numbers that add up in the viewer's head.**
- **No comparison openers, no AI-isms.**
- **Natural voice speed; spell the brand for TTS and show it written in subtitles.**
- **Frame 0 is the thumbnail.** Brand visible throughout.
- **Verify the final MP4, not the preview.**

## Credits

Built on [HyperFrames](https://github.com/heygen-com/hyperframes) (HeyGen) and
[video-demo](https://github.com/nilbuild/video-demo) (Kamran Ahmed).
