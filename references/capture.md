# Capturing real footage (video-demo)

The ad uses the real product only — no mock UI, no rebuilt screens. Footage is filmed with
the [video-demo](https://github.com/nilbuild/video-demo) engine from a pinned production
build with every request mocked and the clock pinned, so it is reproducible and contains
no real user data.

## Workspace (once per product)
```bash
VD=~/.claude/skills/video-demo
bash $VD/scripts/doctor.sh                       # then install.sh / install-voice.sh if asked
node $VD/scripts/scaffold.mjs <product-repo>     # → ~/.video-demo/<repo>/
```
Fill `demo.config.ts` (see `examples/aroday-it-fits/capture/demo.config.ts`):
- `build.command` / `output`: the repo's real production build (aro.day: `./build.sh` → `dist`).
  Run `bun install` / `npm ci` first if `node_modules` is missing — the build silently skipped the SPA once.
- `themes`: the engine only accepts `light` / `dark`; map to the app's own theme name in `storage()`.
- `storage(theme, overrides)`: the app's boot-time localStorage, built from a seed function so
  each scene can pass `preferences: { tasks, settings, externalEvents }`.
- Entitlements: if paid features must show, use the app's dev seam (aro.day: `dev:forcePro`
  works on 127.0.0.1 only — the engine serves there).
- `entries.app.ready`: a custom `async (page) => …` waiting for the real shell of every view you
  film (`.new-task, .cal-header`) — testid-only predicates aren't required.
- `mock.ts`: abort every non-local request except fonts; fulfil `/api/**` with `{}`; return a
  non-OK for any "is a dev server attached?" probe so the app uses localStorage.
Smoke test: `DEMO_VOICE=0 DEMO_TOUR=0 $VD/scripts/demo --grep smoke` (run from the product repo),
then READ the still.

## Seed for the script
The numbers in the script must be the numbers the UI computes. Read the app's own logic for
the metric (aro.day: `src/lib/day-capacity.ts`: work window − meetings = available; scheduled
estimates = planned) and seed meetings/tasks so it lands on whole numbers.

## One scene per beat
Start from `templates/capture.scene.ts`:
- No narration (`DEMO_VOICE=0`) and **no `spotlight`/`focus`** — capture is wide and still.
- Each scene = one beat, starting from a state seeded for that beat (e.g. "already overbooked").
- A cause→effect sequence (drag → dialog → confirm → result) is ONE scene, one take.
- **Size every idle stretch to the line said over it**: ≈ words ÷ 2.5 + 0.5s per sentence break
  (a measured, premium read: ÷ 2.2). A settings drawer held 3.4s closed before "…side projects on
  weekends" — the read needed ~6s. Too long is cheap: the next frame anchors on its own mark and
  cuts the excess over a still frame. Too short is a re-film (or bake-clips `hold` over an idle frame).
- **Nothing moves under a ring.** Rings are fixed source boxes. Put a pane in its final scroll
  position BEFORE its first paint: a MutationObserver installed before the click (a scroll after
  the click showed as a jump mid-line):
  ```ts
  await page.evaluate(() => { const mo = new MutationObserver(() => { const c = document.querySelector('.pane');
    if (c && c.scrollHeight > c.clientHeight) { c.scrollTop = c.scrollHeight; mo.disconnect(); } });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); });
  await actor.click(opener);
  ```
- **Smooth scrolls run on requestAnimationFrame inside the page.** 45ms steps from the test runner
  read as a ~20fps stepped scroll:
  ```ts
  await page.evaluate(() => new Promise<void>((done) => { const b = document.querySelector('.body')!;
    const t0 = performance.now(), H = 0.6 * (b.scrollHeight - b.clientHeight);
    const step = (now: number) => { const k = Math.min(1, (now - t0) / 1700); b.scrollTop = H * k * k * (3 - 2 * k);
      k < 1 ? requestAnimationFrame(step) : done(); }; requestAnimationFrame(step); }));
  ```
- **A pan ends on the part that tells the story**, not at the end of the list: 11 AM–5 PM (the
  meeting and the task placed right after it), not 1–7 PM (empty evening rows).
- Drop targets: create an invisible marker element inside the target column and pass the
  **Locator** to `actor.dragTo` — a pre-measured Point goes stale when the camera unzooms.
- A real app dialog that appears mid-action (a conflict warning) is a gift: keep it in the story.

## Measure and look
```bash
cp ~/.video-demo/<repo>/demo-out/light/<scene>.mp4 <project>/assets/
bash $SKILL/scripts/cuts.sh assets/*.mp4          # event times → ad.config.mjs marks
bash $SKILL/scripts/strip.sh assets/x.mp4 out.png 1.6 2.1 2.6 3.1   # see when a drag really starts
node $SKILL/scripts/scan-marks.mjs assets/x.mp4 1100 60 600 400 8 12   # a REGION's changes: cursor, menu, drawer, a click
```
Recorder beat marks drift 0.5–2s from the encoded clip; scene-change times are the truth.
`cuts.sh` only sees whole-frame changes; the cursor appearing, a menu opening or a button press
need `scan-marks.mjs` on a small region (a cursor in a 600×900 box is below its threshold).
**Re-scan after every re-film**: the same scene's marks moved 0.1–1.5s between takes.
A `hold` or a frame boundary must sit on an IDLE frame — scan the cursor's path to find when it
starts moving (it left the button 0.6s before the press region saw it).
Find UI coordinates for highlight rings from the 2× stills (divide by 2 for 1080p video px).
