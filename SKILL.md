---
name: saas-video-ad
description: Make short promotional ads (15–40s) for a SaaS / web app from REAL footage of the app — seeded, scripted recordings of the actual product, cut into a punchy ad with kinetic type, overlay cards, a voice-over, subtitles, ambient music and UI sound effects, rendered locally with HyperFrames. Use when the user asks for a promo video, product ad, launch ad, feature ad, social ad or "an ad like CircleCI's" for their web app, wants several ad variations, or wants to change/re-cut an ad this skill made. Asks for style, colours, voice and storyline (or drafts them); never uses mock UI.
---

# SaaS video ad

Real app footage → a polished ad. The app is recorded from its own production build with
seeded data (so every number on screen is the number in the script), then cut with
HyperFrames: full-screen footage, text as overlay cards, a voice-over that drives every
cue, word-synced subtitles, an ambient bed, a few UI sounds, a composed first frame that
doubles as the thumbnail.

Built from a long real session making aro.day's ads. Every rule below is a scar —
**read [references/lessons.md](references/lessons.md) before you write a script or film a shot.**

## Tools this skill drives

| Tool | Role | Install |
|---|---|---|
| [video-demo](https://github.com/nilbuild/video-demo) | films the app from a pinned build, seeded + mocked, real cursor | `npx skills add nilbuild/video-demo` (engine + Chromium) |
| [HyperFrames](https://github.com/heygen-com/hyperframes) CLI + `product-launch-video` skill | storyboard, TTS/BGM/SFX, captions, assembly, render | `npx hyperframes skills update product-launch-video` |
| HeyGen account (optional) | better voices + music library | `npx hyperframes auth login` (user runs it — browser OAuth). Offline: Kokoro + MusicGen |
| ffmpeg, Node ≥ 22 | baking shots, measuring footage | |

This skill's scripts live in `scripts/` and always run with **cwd = the HyperFrames project root**.
`$SKILL` below = this skill's directory (`~/.claude/skills/saas-video-ad`).

## The run, in order

Each step has a gate. Don't skip ahead — the order exists because the reverse cost a rebuild.

### 1. Intake — ask, don't assume
Run the questions in [references/intake.md](references/intake.md): product + the ONE thing
the ad sells, the user's own storyline/script (verbatim or restructure), destination +
aspect, length, **style** (show presets or use the product's brand), **colours** (from the
app's theme tokens, hex the user gives, or a preset palette), **voice** (provider, gender,
voice id, speed), music (ambient / none / SFX only), captions, end-card text + background,
CTA. Ask in **plain text** with lettered options — question popups get dismissed.
Recommend one option per question; inferred answers are listed separately so the user can correct them.
**Gate:** a written brief the user said yes to.

### 2. Script — before any footage or TTS
Draft the script per [references/script.md](references/script.md). Offer **5–7 hook
variants** (no comparisons to other products, no AI-isms); every number spoken must add up
in whole numbers and match the seeded data; spell the brand for TTS ("aro dot day") and
let captions show it as written. Present it as a table: on-screen | voice | why.
**Gate:** the user approved the exact words. (TTS costs credits — never generate a draft voice.)

### 3. Capture — real footage, one clip per beat
Set up a video-demo workspace for the product repo (`scripts/scaffold.mjs`), seed state so
the UI shows the script's numbers, then film **one scene per beat** from
[templates/capture.scene.ts](templates/capture.scene.ts). Details:
[references/capture.md](references/capture.md). Rules that matter most:
- whole gestures in one take (approach → grab → drag → drop → result), never start mid-drag;
- no camera moves in capture (`spotlight`/`focus` off) — framing happens later, and mostly doesn't;
- after filming, **measure** event times with `bash $SKILL/scripts/cuts.sh assets/*.mp4`
  and **look** at them with `strip.sh` — recorder marks drift by 0.5–2s.
**Gate:** stills read correctly (numbers, states) and marks are measured.

### 4. HyperFrames project + storyboard
`npx hyperframes init videos/<brand>-<ad> --non-interactive --example=blank --skill=product-launch-video`,
write `BRIEF.md`, show `npx hyperframes auth status` verbatim, build `frame.md` from a preset
(`build-frame.mjs --preset <p>`), then **check its colour remap by eye** (it once mapped red
onto muted text, and dark ink onto a blue fill — fix in `frame.md`). Write `STORYBOARD.md` +
`SCRIPT.md` (copy the shape from [examples/aroday-it-fits](examples/aroday-it-fits)), with
`sfx:` per frame and `music:` in the frontmatter. Stage footage + fonts into `assets/`.
**Gate:** storyboard approved (optionally after a `storyboard.html` sketch sheet).

### 5. Audio — order is load-bearing
```bash
P=~/.claude/skills/product-launch-video/scripts
node $P/audio.mjs --script ./SCRIPT.md --storyboard ./STORYBOARD.md --hyperframes . \
  --out ./audio_meta.json --provider heygen --voice <id> --speed 1.0 --only tts
node $P/audio.mjs ... --only bgm                      # if the music mood changed
node $P/audio.mjs fetch-sfx --storyboard ./STORYBOARD.md --hyperframes .
node $SKILL/scripts/pad-voices.mjs                    # AFTER fetch-sfx (it rewrites audio_meta)
node $P/audio.mjs sync-durations --audio-meta ./audio_meta.json --storyboard ./STORYBOARD.md
```
Never pass `--help` to `audio.mjs` — it isn't a help flag; it runs a full paid generation.
If `fetch-sfx` ran after padding, restore with `pad-voices.mjs --meta-only`.

### 6. Build — config, frames, one script
1. Copy [templates/ad.config.mjs](templates/ad.config.mjs) → `<project>/ad.config.mjs`:
   brand, palette, fonts, measured `marks`, `shots()` (full-screen 1:1 by default),
   `pads()`, `captionMerge`.
2. Copy [templates/gen-frames.mjs](templates/gen-frames.mjs) → `<project>/.hyperframes/gen-frames.mjs`
   and write one block per frame using `makeKit(config)` — hook (composed at frame 0),
   footage frames (transparent + overlay `card`s over EMPTY regions of the app), end card.
   Every time is a `cue(frame, word)` or a `marks.*` value — never a hand-typed number.
3. `bash $SKILL/scripts/build.sh` — bakes shots, generates frames, captions, assembles,
   lifts frames above footage, verifies transitions, runs `hyperframes check`.
   **Always rebuild through build.sh**: `assemble-index` strips the videos out of the frame
   files, so assembling twice without regenerating frames renders an ad with no footage.
4. `npx hyperframes snapshot --at <cue times>` and read `snapshots/contact-sheet.jpg`.
**Gate:** check passed and the contact sheet reads right at every cue.

### 7. Render — verify the MP4 itself
`bash $SKILL/scripts/render.sh renders/<name>.mp4` — renders, asserts the engine's
`videoCount` equals the footage clips, checks audio, writes `-thumbnail.png` (frame 0) and
`-strip.png`. **Read the strip before sending.** A clean build/snapshot is not proof — one
render shipped with zero footage.

### 8. Iterate
Feedback lands in one of three places, and nothing else needs touching:
- words / voice / speed → `SCRIPT.md` → step 5 → `build.sh` (re-bakes: every duration changed)
- overlay text or position only → `gen-frames.mjs` → `build.sh --no-bake`
- timing of an event vs the voice → `pads()` in `ad.config.mjs` (lead / tail)
- what's on screen → `gen-frames.mjs` (cards, positions) or a re-shoot (step 3) if the app state is wrong.
Every overlay, ring and cut re-times itself from the new word timestamps.

## Defaults (use unless the brief says otherwise)

- Footage **full screen at 1:1**; emphasis by a baked highlight ring (`boxes`), not zoom.
  If a zoom is unavoidable: ≤ 1.4×, eased, and never during a gesture.
- Text = overlay cards on empty regions; big kinetic type only on non-footage frames.
- Voice at **speed 1.0**; one idea per line; ~2–4s per footage beat; 1–1.5s hold after the payoff.
- **Ambient** bed + 4–6 UI SFX on events (drop, warning, state flip, done, logo).
- Subtitles on, 2–3 words per group, current word highlighted.
- Frame 0 fully composed (it is the thumbnail). Brand corner bug on non-app frames only.
- End card on the ink/neutral ground unless the user picks an accent fill.

## Files

| Path | What |
|---|---|
| `scripts/timing.mjs` | durations + word cues from `audio_meta.json`, loads `ad.config.mjs` |
| `scripts/bake-clips.mjs` | footage → `assets/shot-<frame>.mp4` (range, framing, eased moves, rings) |
| `scripts/pad-voices.mjs` | lead/tail silence so the voice serves the footage |
| `scripts/caption-meta.mjs` | spoken spelling → written brand in subtitles |
| `scripts/frame-kit.mjs` | `makeKit(config)` → `base`, `footage`, `card`, `OVER` for frame files |
| `scripts/post-assemble.mjs` | lifts frames above hoisted footage so overlays show |
| `scripts/build.sh` / `render.sh` | the build pass and the verified render |
| `scripts/cuts.sh` / `strip.sh` | measure and look at footage |
| `templates/` | `ad.config.mjs`, `gen-frames.mjs`, `capture.scene.ts` |
| `references/` | `intake.md`, `script.md`, `capture.md`, `lessons.md` |
| `examples/aroday-it-fits/` | the full aro.day ad: config, frames, storyboard, script, capture scenes, the MP4 |
