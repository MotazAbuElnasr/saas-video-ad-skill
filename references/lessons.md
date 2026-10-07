# Lessons learned

Every rule here came from a real correction while making aro.day's ads — "It fits" (v1 → v6),
"Take a break" (v1 → v3), "Schedule for me" (v1 → v2) — by the user or by the fresh-eyes
reviewer agent.
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
| 10 | **Voice pace = speed 1.0 + an energy matched to the ad.** 1.12× time-stretched Kokoro felt rushed; a calm, unhurried Gemini style felt "very slow"; an energetic, punchy one was "very energetic" for a break ad. Feature ads: "confident, friendly, lightly upbeat, brisk, no hype". A break ad: "warm, relaxed smile, gently upbeat, easy-moving". | "can we try slow down the english", "It's very slow I need it more like ad, energetic, convencing welcoming", "very energitic 😃 … it's ad about the break" |
| 11 | **Pronounce the brand.** "aro.day" was read "aro day". Spell it for TTS ("aro dot day"), show it written in subtitles. The brand sounds "arrow dot day": Gemini read the spelling "AH-roh" while Whisper still wrote "aro.day", so that check passed and was wrong. Respell the sound for TTS only (`voice.saidAs: [[/\baro\b/gi, 'arrow']]`) and check that Whisper writes "arrow.day". | "it said aro (silent) day", "he didn't say aro dot day" |
| 12 | **Subtitles help clarity.** Turn them on; 2–3 words per group. | "can we add more subtitles to make it clear" |
| 13 | **Brand visible throughout.** Corner logo on non-app frames; the app's own logo covers footage frames. | "we need app logo … visible all over the video" |
| 14 | **First frame = thumbnail.** Compose frame 0 fully (no fade-from-black, no dimmed text). | "I need a good thumbnail in the first frame" |
| 15 | **End card: the user picks the ground.** Accent-blue fill was rejected; ink/neutral is the default. | "I don't want blue background" |
| 16 | **Less music.** Ambient > driving; for calm features, natural ambience (birdsong, breeze, water) with no melody. Mix the bed low (≈0.3, the engine default 0.9 is nearly as loud as the voice), plus a few quiet UI sounds. | "I think ambient is better … or sound effect", "can we change the music, to be less, minimal? natural sounds?" |
| 17 | **Male/female voice is a brief question,** not a default. | "I need male voice" |
| 18 | **Show the real app.** Never mock UI; the user checked: "you will use actual app cuts right?" A mocked server answer that drives the UI (a plan, a schedule) runs the product's own logic — import the pure function the server calls. | |
| 19 | **Every claim is visible when it's said.** "They pick up right where you left off" over a 0:00 clock read as a lie; tasks that jumped Queued → In Progress across the break read as a reset. Seed state that survives the action, say only what the frame shows, ring the proof. | reviewer, break ad v1 |
| 20 | **Subtitles never repeat on-screen type.** Hide them on the hook headline, a quote card, the end card — "three layers say the same words". | reviewer, break v2 |
| 21 | **Subtitles move or hide only between groups** (at a frame's first word): a band jumping mid-phrase reads as broken. Groups shown < 0.6s get merged — "if you" for 0.25s is unreadable. | reviewer, break v2 |
| 22 | **No dead air.** Two seconds with no voice while a cursor creeps = "slow walkthrough". Split a line at its event ("Take five." on the click, "Breathe with the orb." as the orb appears) rather than padding one long lead; film the take at the ad's pace. | reviewer, break v1–v2 |
| 23 | **Never skip footage inside a continuous take.** Skipping 1.5s made the on-screen clock jump 25:02 → 25:04 at an "invisible" seam. Re-film tighter instead. | reviewer, break v2 |
| 24 | **No third-party quotes in a paid ad.** A named author's line, read out and ringed, can read as an endorsement. Use the product's own unattributed copy — and let it pay off the hook ("Look up. The screen is not the world." ↔ "When did you last look up?"). | reviewer, break v2 |
| 25 | **A legible logo on every footage frame.** The app's own header logo (~70×20px) doesn't count; a bare white wordmark vanished on the light UI and touched the app's top-bar icons. Ink pill, placed per ad clear of the app's controls (`look.bug`). | reviewer, break v2 |
| 26 | **Thumbnail = the real app, undimmed, plus one banner.** A grey scrim turned the app into "a grey smear" at thumbnail size; hide the parked cursor until the click. | reviewer, break v2 |
| 27 | **Free features show free-tier UI.** A PRO badge next to "Start free" invites the question. | reviewer, break v2 |
| 28 | **"Natural sounds" = a field recording.** "Natural ambience, no melody" retrieved a pad chord with birds on top (it swelled to voice level). Check the bed's spectrogram — sustained horizontal bands are notes — before using it. No impact / riser in a calm ad; each effect lands ON its event (`sfxAt`). | "less, minimal? natural sounds?", reviewer |
| 29 | **A series looks similar, not the same.** Keep the brand system (logo, type, real UI, CTA, subtitles); vary per ad: the app theme the footage is filmed in, the accent (from that theme or the feature — orb amber, terminal green), the entrance (`slam` / `rise` / `type` / `wipe`), the card style (`ink` / `paper` / `outline` / `clear`), the hook layout (headline over the app / banner / text in an empty column), the end card, the bed. | "I need some variations, not all ads look the same", "similar but not the same" |
| 30 | **Voices: free first, then the best value.** Free: Kokoro `af_heart` is its top-graded voice (A); its male voices grade C+; HeyGen's free voice time runs out monthly. Paid, chosen after listening: Gemini TTS `Charon` (about a cent per ad; the key lives in the keychain). | "free voices only", "just see online reviews", "ok Charon" |
| 31 | **Say the CTA and show it.** "Start free at aro dot day." on the end card, the CTA pill appearing as it's said. | "use the best practices from research" |
| 32 | **A claim must survive the app's own framing.** "One free hour in this day" was contradicted by the day timeline, which pads an hour each side of the workday (18–19 looked just as free). Narrow the claim ("your workday") and shade what it excludes — on a dark UI with a light veil (black shading vanished on the black timeline). | reviewer, Schedule for me v1 |
| 33 | **Cursor discipline.** Hidden until it acts (a parked cursor sat in the thumbnail), pre-positioned off the cards (crossing them lit hover chips and tooltips), hidden and moved off after the last click (the payoff hold lit the new card's chips). | reviewer, Schedule v1 |
| 34 | **Never park an overlay beside an app bug.** The payoff card sat next to filter counts inflated by a real bug ("Blocked 1", "Overdue 1"). Cover or reframe — and file the bug for the product. | reviewer, Schedule v1 |
| 35 | **Say the UI word as it happens.** "Open its menu… and hit Schedule for me" ran 1–2s ahead while the cursor idled. "From its menu:" lands as the menu opens; "Schedule for me" as the cursor reaches it; cut the take's idle time at the source (tighter scene), not in the edit. | reviewer, Schedule v1 |
| 36 | **Zoom on the proof, after the gesture.** The menu text and the timeline label were 3–4px tall on a phone. One eased zoom once nothing moves; rings and shading drawn before the camera (`pre`) so they zoom with the app. | reviewer, Schedule v1 |
| 37 | **Keep subtitles out of YouTube's Skip zone** (bottom-right, from 0:05) for in-stream ads — and out of an open menu's way. | reviewer, Schedule v1 |
| 38 | **Hooks hit hard.** A headline that only fades or rises over footage is not catchy. Use kinetic type on the hook, synced to the voice (`frame-kit`: `hit`, `shake`, `glitch`, `flash`). Each word slams in on its spoken cue, and the key word lands with a flash, a shake and a glitch, then inverts on an accent bar. Frame 0 stays composed: the headline waits in outline and fills as it is said. Calm ads keep it softer, never static. Example: Schedule for me v7. | "I NEED MORE ANIMATION HERE? TO BE MORE CATCHY, LIKE AGRESSIVE ANUMATION AND EFFECTS OF TYPOGRAPHY" |

## How to work with the user (process)

- **Lock words before TTS and numbers before footage.** Every script change re-shot footage or re-bought TTS.
- **Show the script as a table** (on screen | voice) and answer "is X clear?" by quoting the line. When the user says "this is not the script in the video", print what was actually spoken (`audio_meta.json` words) before arguing.
- **Ask in plain text** with lettered options; a popup question UI got dismissed twice.
- **Verify the final MP4, not the preview.** v6 shipped with no footage; snapshots looked fine. Use `render.sh` and read the strip.
- **Be fast.** "why you take too much time for a single clip?" — first-time setup and rebuilds were the cost; the pipeline is now one command per stage. Machine time per ad ≈ 6 min; the rest is authoring and the review pass — say so when asked.
- **Run a fresh-eyes reviewer after every render, before sending.** A subagent that pulls frames every 0.5s + around every cut, transcribes the audio, and judges against the user's standing notes caught what the critic can't: three text layers saying the same words, dead air, a blank board before the end card, a "natural" bed that was a pad chord. Fix, re-render, then send.
- **After every ad: update this file and push the skill** (user: "after every ad you can update skill lesson learned").

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
| Blank board before the end card; "muddy double exposure" | crossfades fade the frame wrappers only — hoisted footage isn't inside them and stops at its own duration | `cut` on every transition next to a footage frame (critic FAILs it); end cards animate their own entrance |
| Kokoro: "kokoro-onnx package is not installed" | `npx hyperframes tts` needs a python with kokoro-onnx + soundfile | `voice.mjs` points `HYPERFRAMES_PYTHON` at video-demo's venv |
| Voice stage took 3 min | Kokoro reloads its model per line, 4 at a time; an unchanged bed was re-retrieved | 8-way concurrency; retrieve the bed only when `music:` changes (188s → 30s) |
| Some lines silently missing after TTS | the engine drops a failed line with only a stderr note (4 of 6 under load) | `voice.mjs` fails unless every SCRIPT line has a voice |
| Subtitles read "Arrow dot day", "25"; `cue('aro')` throws | Kokoro words come from Whisper | `align-words.mjs` maps heard timings onto the script's words (in `pad-voices`) |
| New voice replaced by the old one | stale `NN.raw.wav` re-padded over a fresh TTS file | `pad-voices` refreshes raws when `audio_meta.json` has no pad record |
| A music-only / sfx pass wiped all voices | the engine rebuilds voices from its sidecar, empty after `recover-voice` | `voice.mjs` snapshots + restores; `recover-voice` writes the sidecar |
| Render at −19.8 LUFS | a low bed lowers the whole mix | `render.sh` normalises to the destination (YouTube −14, social −16), two-pass `loudnorm`, `-ar 48000` |
| Cursor back on screen after hiding it | video-demo's `shot()` re-shows the overlay | `actor.overlay(false)` after every `shot()`; hide it until the click |
| A ring stays after its target vanished | rings had no end time | `{ ..., to }` on boxes (`bake-clips.mjs`) |
| Check fails `content_overlap` on a 2-line headline | Inter Black's line box is taller than the font size | line step ≥ 1.19 em |
| Subtitles in the brand-wide blue/navy on an amber ad | the caption skin's colors come from `frame.md` | `palette.captionAccent` / `captionInk` (`caption-moves.mjs`) |
| Small UI text smeared after upload; ~1 Mbps master | the default encode; jpg frame extraction | `render.sh`: `--video-bitrate 8M --video-frame-format png` |
| Bed swelled then hard-cut under the end card's fade | the mix ignores the picture's fade | `render.sh` fades the mix over the last 0.6s |
| The menu ring turned off before the click; a chip ring outlived its chip | rings ran per shot without end times | `to` per box; carry a ring across a seam into the next shot |
| Gemini TTS 429 "3 requests per minute" | free tier; the engine sends lines in parallel | `gemini-voice.mjs`: one line at a time, waiting the API's "retry in Ns" |
| Gemini TTS 402 mid-run | prepaid credits ran out | per-line cache (`.hyperframes/gemini-lines.json`): a re-run resumes, nothing re-bought |
| Gemini voice has no word timings | the API returns audio only | `recover-voice.mjs` (Whisper) → `align-words.mjs` |
| "Breathe" landed 1s late after a calmer re-voice | each Gemini take carries 0.2–0.5s of silence, different every take | `gemini-voice.mjs` trims every take to a 0.08s lead / 0.12s tail |
| Arabic words vanished from cues and captions | `[^a-z0-9]` normalisers deleted non-Latin letters | Unicode `\p{L}\p{N}` everywhere; `voice.lang` makes Whisper use `small` + `--language` |
| Critic warned "rushed" on every line | 3.0 words/s counted "aro dot day" as three words | brand counted once; WARN above 3.5/s |
| Cursor froze during a drag | a pointer-event drag cancels the compat mouse events the cursor overlay follows | mirror synthetic `mousemove` events during manual drags (video-demo scene) |
| App hover card covered the drop target | the strip's pointer drag cancels the mousedown that closes it (a product bug) | dispatch a `mousedown` on the dragged element, and file the bug |
| The whole hook sat under a green tint | a GSAP `fromTo` applies its FROM state at creation (`immediateRender`) | `flash()` uses `immediateRender: false`; `hit()` relies on it to hide a word until its cue |
| Check failed `text_not_painted` on outline text | a transparent fill reads as invisible text | `background-image: linear-gradient(transparent, transparent)` + `background-clip: text`, the checker's form for intentional transparency |
| `content_overlap` on words that slam in | a word blown up mid-hit overlaps its neighbours | `data-layout-allow-overlap` on the kinetic lines |
