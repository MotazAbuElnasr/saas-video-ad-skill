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

Built from published ad research and a long real session making aro.day's ads. **Before
you write a script or film a shot, read [references/lessons.md](references/lessons.md)** (the
user's notes, which win any conflict) **and [references/best-practices.md](references/best-practices.md)**
(the research rules, sources, and how the two were reconciled).

**Fast path** (`scripts/ad.sh`): `new` → `film` → `voice` → `build` → `render` → `critique`, or
`ad.sh all <out.mp4>`. Each stage is timed, and voice / SFX / shots are cached. Target:
2–5 minutes per ad after the script is approved.

## Tools this skill drives

| Tool | Role | Install |
|---|---|---|
| [video-demo](https://github.com/nilbuild/video-demo) | films the app from a pinned build, seeded + mocked, real cursor | `npx skills add nilbuild/video-demo` (engine + Chromium) |
| [HyperFrames](https://github.com/heygen-com/hyperframes) CLI + `product-launch-video` skill | storyboard, TTS/BGM/SFX, captions, assembly, render | `npx hyperframes skills update product-launch-video` |
| HeyGen account (optional) | better voices + music library | `npx hyperframes auth login` (user runs it — browser OAuth). Offline: Kokoro + MusicGen |
| Gemini API key (optional, paid) | best-value natural voices (`Charon`) | aistudio.google.com → API key; the user saves it: `security add-generic-password -U -a "$USER" -s gemini-api-key -w` |
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
**A localized ad is written, not translated** — same story and numbers, the dialect's own words, no
calques or AI phrasing (script.md, "Another language"); show the lines with an English gloss first.
**Gate:** the user approved the exact words. (TTS costs credits — never generate a draft voice.)

### 3. Capture — real footage, one clip per beat
Set up a video-demo workspace for the product repo (`scripts/scaffold.mjs`), seed state so
the UI shows the script's numbers, then film **one scene per beat** from
[templates/capture.scene.ts](templates/capture.scene.ts). Details:
[references/capture.md](references/capture.md). Rules that matter most:
- whole gestures in one take (approach → grab → drag → drop → result), never start mid-drag;
- no camera moves in capture (`spotlight`/`focus` off) — framing happens later, and mostly doesn't;
- after filming, **measure** event times with `bash $SKILL/scripts/cuts.sh assets/*.mp4`
  and **look** at them with `strip.sh` — recorder marks drift by 0.5–2s;
- film the **merged** product: `ad.sh film` reuses the checkout's last `dist/` build — point the
  workspace (`.origin` appRoot + the `app` link) at a worktree of origin/main, `DEMO_BUILD=1`.
**Gate:** stills read correctly (numbers, states) and marks are measured.

### 4. HyperFrames project + storyboard
`npx hyperframes init videos/<brand>-<ad> --non-interactive --example=blank --skill=product-launch-video`,
write `BRIEF.md`, show `npx hyperframes auth status` verbatim, build `frame.md` from a preset
(`build-frame.mjs --preset <p>`), then **check its colour remap by eye** (it once mapped red
onto muted text, and dark ink onto a blue fill — fix in `frame.md`). Write `STORYBOARD.md` +
`SCRIPT.md` (copy the shape from [examples/aroday-it-fits](examples/aroday-it-fits)), with
`sfx:` per frame (comma-separate two effects in one frame), a `- duration:` line under each
voiceover (sync-durations fills them) and `music:` in the frontmatter. Stage footage + fonts into `assets/`.
**Gate:** storyboard approved (optionally after a `storyboard.html` sketch sheet).

### 5. Audio — one cached command
`bash $SKILL/scripts/ad.sh voice` (`voice.mjs`): TTS → bed → SFX → pads → mix → durations, each
step skipped when its inputs are unchanged. What it handles (each cost a rebuild):
- **Voice:** `ad.config.mjs → voice: { provider, id, speed, style, saidAs }`. Paid best value:
  Gemini `Charon` — energy and pace come from `style` (speed stays 1), matched to the ad
  (lessons #10); `saidAs` respells for TTS only (`[[/\baro\b/gi, 'arrow']]`). One line at a
  time with the API's retry-in, cached per line, each take trimmed to 0.08s lead / 0.12s tail.
  Free default: Kokoro `af_heart` at 0.8 (its A-graded voice; the male voices grade C+). Kokoro
  needs a python with kokoro-onnx — `voice.mjs` reuses video-demo's venv; lines run 8 at a time.
  It fails if any SCRIPT line came back missing (the engine drops failed lines silently).
- **Words:** Whisper timings mapped onto the SCRIPT's words (`align-words.mjs`) — captions and
  `cue()` never see "Arrow" for "aro" or "25" for "twenty-five".
- **Bed:** retrieved only when `music:` changes, mixed at `music.volume` (≈0.2–0.3). For
  "natural sounds" ask for a *field recording* and look at its spectrogram before using it —
  steady horizontal bands are notes (a "natural ambience" query returned a pad chord).
- **SFX:** one per event, placed ON the event with `sfxAt()`; no impact/riser in calm ads. Each ends
  with its action: `sfxAt` → `{ at, dur, vol }` (typing until the input parses, quiet); without a
  `dur` an effect is cut 1s past its frame — stock effects are long loops.
- **Pads:** `pads({ dur, word, marks })` — `word(n, w)` aims a lead so that word lands just
  after its event. Pads are re-applied from `NN.raw.wav`, so changing one never re-buys TTS.
- **Listener:** `listen.mjs` (Gemini, needs a key) hears every take against its script line —
  cached per take; the critic FAILs a mismatch ("no crash" for "no clash", a garbled brand).
  `regen-line.mjs <frame> <regex> [tries]` retakes one Gemini line until the listener agrees.
- No TTS left (quota)? `recover-voice.mjs` rebuilds the timings from the wavs on disk.
Never pass `--help` to the engine's `audio.mjs` — it isn't a help flag; it runs a full paid generation.

### 6. Build — config, frames, one script
1. Copy [templates/ad.config.mjs](templates/ad.config.mjs) → `<project>/ad.config.mjs`:
   brand, palette, fonts, measured `marks`, `shots()` (full-screen 1:1 by default),
   `pads()`, `captionMerge`. The knobs that make a series "similar but not the same":
   - `look: { entrance: 'slam'|'rise'|'type'|'wipe', card: 'ink'|'paper'|'outline'|'clear', bug: { left|right, top } }`
     — use `enter(el, at)` in frames; the corner logo is an ink pill placed clear of the app's controls;
   - kinetic type for hooks and payoffs (lessons #38): `hit(el, at, { from, blur })` slams a word in
     on its spoken cue, `shake(group, at, amp)`, `glitch(el, at)`, `flash(at, alpha)` — all seek-safe;
   - right to left (lessons #43): `look.dir: 'rtl'` (wipes/typing from the right), `fonts.script`
     (e.g. `'"SF Arabic", "Geeza Pro"'`, local faces added), the `f<id>-rtl` class on Arabic text,
     `voice.lang: 'ar'` (multilingual timings, RTL subtitles);
   - `palette.captionAccent` / `captionInk` — subtitle highlight + box per ad;
   - `captionMoves({ dur, cue, first })` → `{ from, to, x, y }` / `{ from, to, hide: true }`;
     move or hide only at a frame's `first()` word; `captionMaxChars` for a narrow text zone;
   - `boxes` in shots: rings, or `fill` + `alpha` regions; `to` ends one; `pre: true` draws it
     before the camera so it zooms with the app;
   - `stage` in a shot (premium): the app as a floating panel in space — `{ s, from: { ry, rx, z },
     to: {…}, bg: [c0, c1], radius, shadow }`; rounded corners, a slow 3D turn, a soft shadow, on a
     gradient; the camera and boxes still apply inside the panel;
   - `sfxAt({ dur, word, marks })` → `{ frame: seconds }`.
   Transitions next to footage are always `cut` — a crossfade only fades the frame wrappers,
   the hoisted footage isn't inside them (critic FAIL `crossfade-footage`).
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

### 6½. Critique — before the user sees it
`node $SKILL/scripts/critique.mjs --render renders/<name>.mp4` (automated; every FAIL blocks)
and `bash $SKILL/scripts/review-sheet.sh renders/<name>.mp4`. Then **always** dispatch one
fresh-eyes reviewer sub-agent (prompt in [references/critique.md](references/critique.md)):
frames every 0.5s + around every cut, a transcript, the user's standing notes. On the aro.day
ads it caught what no rule did — three text layers saying the same words, 2s of dead air, a
blank board before the end card, a claim the app's own padding contradicted. Fix, rebuild,
re-run; at most two loops, then show the user what is still open. **After every ad, add its
lessons to `references/lessons.md` and push the skill** (user).

### 7. Render — verify the MP4 itself
`bash $SKILL/scripts/render.sh renders/<name>.mp4` — renders at 8 Mbps with PNG frame
extraction (small UI text survives YouTube's re-encode), asserts the engine's `videoCount`
equals the footage clips, normalises loudness to the destination (YouTube −14 LUFS) and fades
the mix with the picture, writes `-thumbnail.png` (frame 0) and `-strip.png`. **Read the strip before sending.** A clean build/snapshot is not proof — one
render shipped with zero footage.

### 8. Iterate
Feedback lands in one of three places, and nothing else needs touching:
- words / voice / speed → `SCRIPT.md` → step 5 → `build.sh` (re-bakes: every duration changed)
- overlay text or position only → `gen-frames.mjs` → `build.sh --no-bake`
- timing of an event vs the voice → `pads()` in `ad.config.mjs` (lead / tail)
- what's on screen → `gen-frames.mjs` (cards, positions) or a re-shoot (step 3) if the app state is wrong.
Every overlay, ring and cut re-times itself from the new word timestamps.

## Defaults (use unless the brief says otherwise)

- Footage **full screen at 1:1**; emphasis by a baked highlight ring (`boxes`). Zoom only with a
  reason, to make something small readable while nothing moves there: one eased move, hold,
  then out before the next action. **Never during a gesture** (the critic FAILs it).
- Hook over **live** footage (research: open mid-action), value proposition by 3s.
- **Brand said by 5s**, with a hero lockup on the hook frame (`bug: 'hero'`, or your own
  lockup marked `data-brand="hero"`), and the logo pill on every footage frame after it.
- Voice ≈ 150–180 wpm (≈ 75–90 words per 30s). Cards ≤ 42 chars per line, held ≥ chars ÷ 18 s.
- End card: brand, promise, and the CTA **shown and said** ("Start free at <brand>") — the
  user asked for the research's version; the pill appears as it's said; ≥ 1.5s hold.
- Text = overlay cards on empty regions; big kinetic type only on non-footage frames.
- Gemini `Charon` with an ad-matched style when a key exists, else Kokoro `af_heart` (0.8); one idea per line, split
  at its event; ~2–4s per footage beat; 1–1.5s hold after the payoff; no 2s silences.
- Bed: a quiet field recording or ambient texture (≈0.2–0.3) + a few SFX on events.
- Subtitles on, merged to ≥ 0.6s groups, current word highlighted, hidden where on-screen type
  says the line, never over the thing being talked about (or YouTube's bottom-right Skip zone).
- Frame 0 = the real app, undimmed, plus one banner/lockup; no parked cursor. Kinetic hooks keep it
  composed: the headline is whole and solid at frame 0, and each word pops as it is said — never
  outline, faint or translucent type (lessons #50).
- Each ad in a series gets its own look (theme of the footage, accent, entrance, card, hook
  layout, end card, bed) — similar, not the same.
- End card on a neutral/dark ground (never the brand blue) unless the user picks a fill.

## Roadmap (not built yet — say so if asked)
- 9:16 and 1:1 cut-downs: a static crop per beat around the action, inside the platform safe
  zones in `best-practices.md`. Research says to ship all three formats.
- 6s and 15s cut-downs from the same project.

## Files

| Path | What |
|---|---|
| `scripts/timing.mjs` | durations + word cues from `audio_meta.json`, loads `ad.config.mjs` |
| `scripts/bake-clips.mjs` | footage → `assets/shot-<frame>.mp4` (range, framing, eased moves, rings) |
| `scripts/pad-voices.mjs` | normalise voices (raw audio, script-aligned words), then lead/tail pads |
| `scripts/align-words.mjs` | heard (Whisper) timings → the SCRIPT's words |
| `scripts/recover-voice.mjs` | rebuild voice timings from wavs on disk (no TTS) |
| `scripts/caption-moves.mjs` | subtitles: merge short groups, move/hide between groups, per-ad tint |
| `scripts/caption-meta.mjs` | spoken spelling → written brand in subtitles |
| `scripts/frame-kit.mjs` | `makeKit(config)` → `base`, `footage`, `card`, `OVER`, `enter` (per-ad look) |
| `scripts/post-assemble.mjs` | lifts frames above hoisted footage so overlays show |
| `scripts/ad.sh` | one command per stage: `new`, `film`, `voice`, `build`, `render`, `critique`, `all` |
| `scripts/voice.mjs` | cached TTS → BGM → SFX → pads → durations → listener |
| `scripts/gemini-voice.mjs` | Gemini TTS, one line at a time, cached per line, takes trimmed |
| `scripts/listen.mjs` / `regen-line.mjs` | a Gemini listener for every take; retake one line until it is heard right |
| `scripts/critique.mjs` / `review-sheet.sh` | the automated critic and the visual-review contact sheet |
| `scripts/build.sh` / `render.sh` | the build pass and the verified render |
| `scripts/cuts.sh` / `strip.sh` | measure and look at footage |
| `scripts/gif-preview.sh` | silent GIF preview for READMEs (GitHub won't play repo-hosted MP4s inline) |
| `templates/` | `ad.config.mjs`, `gen-frames.mjs`, `capture.scene.ts` |
| `references/` | `intake.md`, `script.md`, `capture.md`, `best-practices.md`, `lessons.md`, `critique.md` |
| `examples/aroday-it-fits/` | the full aro.day ad: config, frames, storyboard, script, capture scenes, the MP4 |
| `examples/aroday-take-a-break/`, `examples/aroday-schedule-for-me/`, `examples/aroday-plan-my-day/` | more looks of the series (calm amber; terminal + glitch; mocha + editorial wipes) |
