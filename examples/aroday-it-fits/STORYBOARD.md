---
format: 1920x1080
duration: 21s
message: "aro.day tells you whether your day actually fits — before it falls apart"
arc: Demo Loop — relatable question → product answers → add (warn) → over → fix → brand
audience: "people juggling many parallel threads with real deadlines"
mode: collaborative
music: ambient minimal pad, warm and airy, soft modern tech underscore, gentle pulse, no drums, low and steady under voice
---

## Changes from v1

- User: "very zoomed in", "the video cut while dragging is disturbing", "something is not clear", "aro.day was read as 'aro day'", "I don't want blue background" on the end card, "need a good thumbnail in the first frame", "aro.day visible all over the video", numbers must be whole (no halves).
- v2: new hook ("Another day. Half the to-do list still there?"); footage re-shot with 2h meetings → 7h for real work, 6h planned, +2h → 8h / 7h (over by an hour); drag + conflict is ONE continuous shot; punch-ins ≤ 2×; corner bug on every frame; frame 01 fully composed at t=0 (poster/thumbnail); end card on ink.

## Video direction

- **Palette:** ink #1c2330 ground on every frame (end card included); type in cream #fafbfc; blue #2563eb is the single accent; red #dc2626 ONLY on the over-committed number in frame 04. Footage sits in a 1px #39414f hairline panel, square corners, no shadow, no glow.
- **Brand:** a corner bug (aro.day mark + wordmark, ~70% opacity) top-right on frames 01–05; the end card carries the full lockup.
- **Type:** display = Inter 900 lowercase, tight negative tracking; labels = JetBrains Mono uppercase 0.14em.
- **Motion grammar:** type SLAMS in (scale 1.15→1 + opacity, power4.out, ~0.25s) on its spoken word; footage never cuts mid-gesture; camera moves are baked into the clip, eased, and never exceed ~2×.
- **Rhythm:** 01 composed poster that comes alive line by line → 02 calm answer → 03 one continuous take → 04 HELD read on the red number → 05 one stamp → 06 calm lockup.
- **Never:** slideshow, screensaver motion, fake UI, gradients/bokeh, narration sentences as on-screen text, content below y=900, a cut in the middle of a drag.

## Frame 1 — Half the list

- scene: Dimmed real calendar behind three lines of huge type, all composed from t=0 (the poster): "another day." / "half the to-do list" / "still there?" — each line lights up as it is spoken.
- voiceover: "Another day. Half the to-do list still there?"
- duration: 2.978s
- transition_in: cut
- status: animated
- src: compositions/frames/01-half-list.html
- type: hook
- persuasion: Pain validation
- beat: frustration
- blueprint: kinetic-type-beats (Adapt)
- focal: type
- roles: ad-fit-day-day.png = background (dim ~80%)
- sfx: impact-soft
- asset_candidates: assets/ad-fit-day-day.png — the real calendar, dimmed behind the type

narrativeRole: the feeling everyone knows — the day ended and the list didn't.
keyMessage: your list keeps outliving your day.

Adapt: keep the kinetic-type signature but the whole layout is present at frame 0 (thumbnail); motion is per-line emphasis, not reveal-from-blank.
Scene 1 (0.0–0.9s): all three lines on screen at 40% cream over the dimmed calendar; "another day." brightens to full and punches on the word.
Scene 2 (0.9–2.2s): "half the to-do list" brightens + punches on "half".
Scene 3 (2.2–end): "still there?" turns blue and punches; hold.

## Frame 2 — It shows you

- scene: Real calendar in a panel, gentle push toward the 6h / 7h meter; under the panel "7h for real work" and a blue "1h free".
- voiceover: "Maybe it never fit. aro dot day shows you: seven hours for real work, just one still free."
- duration: 6.504s
- transition_in: cut
- status: animated
- src: compositions/frames/02-shows-you.html
- type: product_intro
- persuasion: Show-don't-tell proof
- beat: clarity
- blueprint: device-surface-showcase
- focal: assets/ad-fit-day.mp4
- roles: ad-fit-day.mp4 = cutout (panel)
- sfx: whoosh-soft
- asset_candidates: assets/ad-fit-day.mp4 — calendar at rest, cursor settles on the 6h / 7h meter

narrativeRole: the answer — the day never had room; aro.day shows it.
keyMessage: 7h for real work, 1h free.

Scene 1 (0.0–2.0s): wide panel of the whole calendar.
Scene 2 (2.0–3.6s): gentle eased push (≤2×) toward the meter in the header as the VO says "aro dot day shows you".
Scene 3 (3.6–end): label "7h for real work" types under the panel on "seven hours"; "1h free" slams in blue on "just one"; hold.

## Frame 3 — Add one more

- scene: ONE continuous take: the cursor grabs "Write quarterly report · 2h" from the rail, drags it onto this afternoon, drops it — the real "Scheduling conflict" dialog fades in. "+2h" slams on the drop.
- voiceover: "Add a two-hour report, and it warns you before it breaks your day."
- duration: 3.709s
- transition_in: cut
- status: animated
- src: compositions/frames/03-add-one.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: tension
- blueprint: cursor-ui-demo
- focal: assets/ad-fit-drag.mp4
- roles: ad-fit-drag.mp4 = cutout (panel, continuous source range from before the grab through the dialog)
- sfx: click-soft, tick
- asset_candidates: assets/ad-fit-drag.mp4 — grab, drag, drop, conflict dialog, one take

narrativeRole: the everyday move that overloads a day — and the app catching it.
keyMessage: it warns you the moment it doesn't fit.

Scene 1 (0.0–2.3s): wide panel; the cursor picks up the card and drags it across — no cut, no zoom.
Scene 2 (2.3–end): on the drop "+2h" slams in blue; the dialog fades in and the shot eases in slightly (≤1.3×) toward it; hold.

## Frame 4 — Over by an hour

- scene: "Schedule anyway" is clicked; the meter flips to red "8h / 7h"; the number repeats huge in red on ink.
- voiceover: "Over by an hour. You see it now."
- duration: 3.177s
- transition_in: cut
- status: animated
- src: compositions/frames/04-over.html
- type: benefit_highlight
- persuasion: Feature-to-benefit translation
- beat: urgency
- blueprint: video-text-pivot
- focal: assets/ad-fit-drag.mp4
- roles: ad-fit-drag.mp4 = cutout (strip panel: click, then meter red)
- sfx: impact-low
- asset_candidates: assets/ad-fit-drag.mp4 — click Schedule anyway, meter turns red 8h / 7h

narrativeRole: the payoff of seeing it early.
keyMessage: over by an hour — visible now.

Scene 1 (0.0–1.2s): strip panel on the dialog; the click on "Schedule anyway".
Scene 2 (1.2–end): the strip eases to the red meter (≤2×); "8h / 7h" slams huge in red; HELD.

## Frame 5 — Thursday

- scene: The report block is dragged to Thursday in one take; the meter settles back to 6h / 7h; "done." slams in blue.
- voiceover: "Drag it to Thursday. Done."
- duration: 3.877s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/05-thursday.html
- type: benefit_highlight
- persuasion: Friction reduction
- beat: relief
- blueprint: panel-edit-live-sync
- focal: assets/ad-fit-move.mp4
- roles: ad-fit-move.mp4 = cutout (panel right, from before the grab)
- sfx: chime-soft
- asset_candidates: assets/ad-fit-move.mp4 — drag report to Thursday, meter back to 6h / 7h

narrativeRole: resolution — one gesture restores a day that fits.
keyMessage: one drag fixes it.

Scene 1 (0.0–1.3s): panel right ~62%, the block is grabbed and dragged to Thursday — no cut.
Scene 2 (1.3–end): "done." slams in blue on the left on "Done"; hold.

## Frame 6 — aro.day

- scene: Ink ground. The aro.day mark, wordmark in cream, line "plan a day that actually fits.", URL in mono.
- voiceover: "aro dot day. Plan a day that actually fits."
- duration: 3.631s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/06-brand.html
- type: branding
- persuasion: Future pacing
- beat: confidence
- blueprint: logo-assemble-lockup
- focal: assets/aroday-mark.svg
- roles: aroday-mark.svg = supporting
- sfx: riser-soft
- asset_candidates: assets/aroday-mark.svg — aro.day mark for the lockup

narrativeRole: brand lockup + the promise, said once, plainly.
keyMessage: aro.day = a day that fits.

Scene 1 (0.0–1.0s): mark scales in, wordmark slams beneath.
Scene 2 (1.0–2.5s): the line types in cream, "fits." in blue.
Scene 3 (2.5–end): mono URL fades up; gentle settle-out (final frame).
