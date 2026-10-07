# The critique loop — review it the way the user does

Two passes on every cut, before the user sees it. The goal: the user should not have to
say any of the notes in `lessons.md` again.

```bash
node $SKILL/scripts/critique.mjs --render renders/<name>.mp4   # automated: exit 1 on FAIL
bash $SKILL/scripts/review-sheet.sh renders/<name>.mp4          # contact sheet + tile times
```

1. **Automated** (`critique.mjs`) — measurable notes: comparison hook, AI-isms, fractional
   numbers, brand spelled for TTS, words/second, payoff hold, voice-before-event (needs
   `events` in `ad.config.mjs`), cut inside a gesture (needs `gestures`), zoom, not full
   screen, subtitles, end-card fill, music mood, words per card, blank/dark thumbnail,
   loudness. Fix every FAIL before the visual pass.
2. **Visual** — a fresh-eyes reviewer (a sub-agent with no knowledge of how the ad was
   built) reads the review sheet, the tile-time map, the spoken transcript with word
   times, and this rubric, and writes notes **in the user's voice**. Fix what it flags,
   rebuild, re-run both passes. Max two loops; then show the user, listing anything
   unresolved.

## Dispatch prompt for the visual reviewer

> You are reviewing a 15–40s product ad as its demanding founder. Files: `<review.jpg>`
> (frames sampled every second; tile→time map in `<review.txt>`), `<transcript>` (each
> spoken word with its time), `<SCRIPT.md>`. Watch for the problems below. Write
> **timestamped, blunt, one-line notes** like a busy founder would, e.g.
> "from 11 to 16, zooming in and out makes it hard to follow what's happening in the app",
> "after second 15 the viewer can't see the 'done', it's a very fast cut",
> "'over by an hour' is not synced with the video". Then a verdict: SHIP / FIX, and the
> top 3 fixes. No praise, no hedging, max 12 notes.

## Rubric (what the user actually noticed)

| Look for | The user's words |
|---|---|
| Can you tell what is happening in the app at every second? Is any action unexplained? | "hard to follow what's happening in the app" |
| Is the app full screen and readable, or small / letterboxed / cropped? | "can we keep this full screen the full demo" |
| Any zoom that hides context or misses the action? | "camera zooming is not okay, it misses things" |
| Does any cut land in the middle of a drag, click or typing? | "the video cut while dragging is disturbing" |
| Does every result stay on screen long enough to read (≥1s after it appears)? | "the viewer can't see what's (Done), it's very fast cut" |
| Does each spoken line match what is visible at that moment? | "over by an hour is not synced with the video" |
| Does any line sound written by an AI (clever contrasts, slogans, "not at 6 p.m.")? | "this is very aish" |
| In a localized ad: does any line or card sound translated word for word from English, or AI-written, to a native speaker? | «اياك تترجم ترجمة حرفية وبلاش دباجات ال AI» |
| Does the maths add up when heard once? | "how 6 is free?", "6 + 4:30 is 10:30 not 9" |
| Does the opening compare the product to others? | "don't start by comparing" |
| Is the brand visible through the whole ad, and pronounced right? | "app logo … visible all over the video", "it said aro (silent) day" |
| Would frame 0 work as a thumbnail? | "I need a good thumbnail in the first frame" |
| Is it clear without sound (subtitles, overlays)? | "add more subtitles to make it clear" |
| Pace: rushed voice? Dead air? | "slow down the english", "very slow, very AIsh" |
| Anything visually off (a stray drag ghost, a tooltip, a cursor parked on the key number)? | (found in review) |

## Fix map

| Note | Where to fix |
|---|---|
| hard to follow / zoom / cut mid-gesture | `shots()` — full screen, continue the take; re-film with shorter holds if needed |
| too fast to read | `pads()` tail, or a longer line |
| voice ahead of / behind the event | `pads()` lead (computed from `marks`) |
| unclear words / AI-ish / maths | `SCRIPT.md` → re-voice (costs TTS) → rebuild |
| overlay covers the action | card position in `gen-frames.mjs` → `build.sh --no-bake` |
| wrong numbers in the UI | re-seed + re-film (`capture.md`) |
