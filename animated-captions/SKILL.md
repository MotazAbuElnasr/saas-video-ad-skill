---
name: animated-captions
description: Use when adding animated, word-by-word (karaoke / TikTok-style) captions or subtitles to a talking-head reel, short, or phone video — especially Arabic or other RTL speech, Egyptian/dialect Arabic, iPhone HDR footage (HLG / Dolby Vision), or a clip that already has burned-in images or text. Triggers on "كابشنز متحركة", "حط كابشن على الفيديو", "subtitles while I talk", "caption this reel".
---

# Animated Captions

Word-synced captions burned onto the **untouched** source video: a 2–3 word chunk pops in, the word being spoken lifts and turns yellow (emphasis words red). Rendered by HyperFrames (Chrome shapes Arabic correctly; this machine's ffmpeg has no `drawtext`/`libass`). HDR in → HDR out, colours unchanged.

`S=~/.claude/skills/animated-captions/scripts`

## Steps

1. **Probe.** `ffprobe` the clip. `color_transfer=arib-std-b67` or `smpte2084` = HDR.
   **Never show the user a plain `ffmpeg` frame grab of HDR** — it comes out washed-out, and the user will think you changed the colours. Use `swift $S/grab.swift <video> <sec> out.png` (AVFoundation tone-maps correctly).
   Grab ~6 frames across the clip to find where burned-in images/text sit. The caption band goes where nothing else does (often above the head).
2. **Project:** `bash $S/new-project.sh <video> <dir>`.
3. **Transcribe:** `bash $S/transcribe.sh <dir> ar` (`en` etc. for other languages).
4. **Correct.** Read the segments and write `<dir>/fixes.json` — `[["source words","target words"], …]` in spoken order (the format is in the `fix-words.py` header). Then run `python3 -I $S/fix-words.py <dir>`.
   - Spell dialect as spoken (تاني / تالت / عاوز / الجاية).
   - Technical/medical/brand terms go in English if the video's graphics show them that way (`الـ Oral Fluconazole`).
   - Mark 3–6 danger/punch words with `!`. Mark sentence starts with `^` (`^أول حاجة`).
   - A garbled phrase: `bash $S/transcribe.sh <dir> ar <start> <end>` re-runs just that slice. If it's still unclear, write your best guess and **ask the user to confirm that exact line**. Never ship invented words silently.
5. **Build:** if the band isn't the default (top 175px, height 260px on 1080×1920), write `<dir>/captions.json` (keys are listed in the `build.mjs` header). Then run `node $S/build.mjs <dir>`.
6. **QA before rendering:**
   - `npx hyperframes check` must show 0 errors and no `content_overlap`. Studio-only warnings (`studio_missing_editable_id`, `nested_structure…`, `timeline_track_too_dense`) are harmless here.
   - `npx hyperframes snapshot --at <6–8 times incl. long English terms> --no-end -o snaps`, then look at the band: word gaps, no clipping, no collision with burned-in graphics.
7. **Render:** `PRODUCER_BROWSER_GPU_MODE=hardware npx hyperframes render --video-bitrate <source Mbps>M -o renders/out.mp4`. A 1-minute 1080×1920 clip takes about 7 min; run it in the background.
8. **Verify:** `ffprobe` the output and confirm the same `color_transfer` as the source. Grab the same second from both files with `grab.swift`, compare a face crop, then send the file. Name every line you guessed.

## Common mistakes

| Mistake | Result | Do instead |
|---|---|---|
| `hyperframes init --video` | swaps in a ~4 Mbps proxy and writes an English `small.en` transcript of Arabic speech | `new-project.sh` (copies the original) |
| `--quality` default | 3 Mbps output from a 14 Mbps source | `--video-bitrate` matching the source |
| Plain ffmpeg grab of HDR | pale, overexposed preview → "why did you change the colours?" | `grab.swift` |
| `embedded-captions` / per-letter effects on Arabic | letters split apart, joins break | whole-word spans (this skill) |
| Big scale pop on the active word | long English words swell into their neighbour | lift + 1.03 scale (built in) |
| Captions over the source's graphics | text-on-text | move the band via `captions.json` |
| Small/base Whisper on dialect Arabic | confident gibberish | large-v3 (the script's default) |
| Colour-grading "to fix" the look | user's colours were already right | the video ships untouched; captions are the only change |

No music unless the user asks for it.
