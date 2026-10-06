# Lessons learned

Every rule here came from a real correction while making aro.day's first ad (v1 → v6).
User notes are quoted where they set the rule. Read this before scripting or filming.

## What the viewer felt (taste)

| # | Rule | From |
|---|---|---|
| 1 | **Promo, not walkthrough.** A narrated tour with a follow-cam read as "very slow, very AIsh". Ads are short lines, big type, real UI, sound. | v0 (video-demo walkthrough) |
| 2 | **Never open by comparing** to other tools. | "don't start by comparing" |
| 3 | **No AI-isms in copy.** Cut flourishes like "not at 6 p.m.", "seamless", "unlock". If a line sounds clever, it's probably the AI one. | "remove not at 6pm, this is very aish" |
| 4 | **Offer hook options, then variations of the chosen one.** First round of 4 hooks was rejected; a second round in a different register found it. | "all not good" → picked "Another day. Half the to-do list still there?" |
| 5 | **The maths must work in the viewer's head.** Whole numbers; say what's left; never two totals the ear will add. | "how 6 is free?", "6 + 4:30 is 10:30 not 9", "without halfs" |
| 6 | **Zoom with a reason, never during a gesture.** 2–4× punch-ins on every beat hid context and missed things; full screen 1:1 + overlays + a ring is the default. A zoom is fine to make something small readable while nothing moves there — one eased move, hold, out before the next action. | "camera zooming is not okay, it misses things", "very zoomed in", "keep this full screen", then "some times zooming is fine, it really depends" |
| 7 | **Never cut inside a gesture.** A drag split across two cuts was "disturbing"; zoom in/out + cuts during cause→effect made the app "hard to follow". One continuous take from approach to result. | v1, v3 notes |
| 8 | **Hold the payoff.** "Done." was on screen 0.6s — "very fast cut". 1–1.5s hold after the payoff line. | "I need few moment after second 15" |
| 9 | **Voice lands after the event it names.** "Over by an hour" was said before the meter turned red. | "over by an hour is not synced" |
| 10 | **Natural voice speed.** 1.12× felt rushed; 1.0 reads as a person. | "can we try slow down the english" |
| 11 | **Pronounce the brand.** "aro.day" was read "aro day". Spell it for TTS ("aro dot day"), show it written in subtitles. | "it said aro (silent) day" |
| 12 | **Subtitles help clarity.** Turn them on; 2–3 words per group. | "can we add more subtitles to make it clear" |
| 13 | **Brand visible throughout.** Corner logo on non-app frames; the app's own logo covers footage frames. | "we need app logo … visible all over the video" |
| 14 | **First frame = thumbnail.** Compose frame 0 fully (no fade-from-black, no dimmed text). | "I need a good thumbnail in the first frame" |
| 15 | **End card: the user picks the ground.** Accent-blue fill was rejected; ink/neutral is the default. | "I don't want blue background" |
| 16 | **Ambient > driving music**, plus a few UI sounds on events. | "I think ambient is better … or sound effect" |
| 17 | **Male/female voice is a brief question,** not a default. | "I need male voice" |
| 18 | **Show the real app.** Never mock UI; the user checked: "you will use actual app cuts right?" | |

## How to work with the user (process)

- **Lock words before TTS and numbers before footage.** Every script change re-shot footage or re-bought TTS.
- **Show the script as a table** (on screen | voice) and answer "is X clear?" by quoting the line. When the user says "this is not the script in the video", print what was actually spoken (`audio_meta.json` words) before arguing.
- **Ask in plain text** with lettered options; a popup question UI got dismissed twice.
- **Verify the final MP4, not the preview.** v6 shipped with no footage; snapshots looked fine. Use `render.sh` and read the strip.
- **Be fast.** "why you take too much time for a single clip?" — first-time setup and rebuilds were the cost; the pipeline is now one command per stage.

## Technical gotchas (each cost a rebuild)

| Symptom | Cause | Fix (where) |
|---|---|---|
| Final render has no app footage, overlays only | `assemble-index` strips hoisted `<video>` from frame files; a 2nd assemble without regenerating frames finds none | always `build.sh` (regenerates first); `render.sh` asserts `videoCount` |
| Overlay text invisible over footage | hoisted videos are appended after scene hosts → paint on top | `post-assemble.mjs` (z-index on `.scene`), footage frames transparent (`OVER`) |
| `<video>` inside a frame fails assembly | product-launch assembler hoists media; frame-local video needs `data-frame-video="approved"` + numeric geometry | `frame-kit.footage()` |
| Zoom/punch-in ignored after hoist | hoisted video keeps static geometry; frame-local transforms don't follow | bake camera into the clip (`bake-clips.mjs`) |
| Punch-in lands top-left | ffmpeg `crop` locks input size at frame 1; `t` is NaN after per-frame scale | `zoompan` on padded+upscaled source, time as `in/60` |
| libx264 "height not divisible by 2" | odd panel size | even W/H (checked in bake) |
| Lint: `id_requires_css_escape` | ids/classes starting with a digit (`#06-…`) | prefix `f` (`frame-kit`) |
| Lost padding / wrong subtitle timing | `fetch-sfx` rewrites `audio_meta.json` | order TTS → fetch-sfx → pad → sync; `pad-voices --meta-only` |
| Paid TTS ran by accident | `audio.mjs --help` is not a help flag | never pass `--help` |
| Subtitles say "aro dot day" | captions come from spoken words | `caption-meta.mjs` + `captionMerge` |
| Line outlasts the recorded clip | slower voice | `tpad` clone in bake; re-film longer if it shows |
| video-demo: `colorScheme` error | engine themes are `light`/`dark` only | map to the app theme in `storage()` |
| video-demo: drag lands in the wrong slot | Point measured while the camera was zoomed | drop on an invisible marker **Locator** |
| Build skipped the SPA silently | `node_modules` missing in the product repo | install deps before filming |
| Footage timing off by 0.5–2s | recorder marks ≠ encoded clip time | `cuts.sh` scene-change times are the truth |
| `build-frame` remap made muted text red, ink on blue unreadable | role mapping by position, not meaning | read `frame.md` after remap; fix roles; light text on accent fills |
| A changelog PreToolUse hook blocked long Bash commands | an LLM-evaluated hook rejecting non-`git push` calls | put multi-step commands in a script file and run that |
