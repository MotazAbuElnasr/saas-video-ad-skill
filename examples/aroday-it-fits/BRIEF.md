---
workflow: product-launch-video
flow: automation
storyboard: yes
message: "aro.day tells you whether your day actually fits — before it falls apart"
destination: youtube
aspect: 1920x1080
language: en
audience: "people juggling many parallel threads with real deadlines — engineers, founders, residents, lawyers, grad students"
length: 25s
angle: feature-reveal
voice: am_michael
style_preset: broadside
---

## Intent

Ad 1 of a five-ad series for aro.day: "It fits" — the day-capacity meter. A punchy
marketing promo in the spirit of CircleCI's ads: bold kinetic type, fast cuts of the
real product, a music bed, short confident male voice lines. Sell, don't tour.

User feedback that shaped this (from the previous narrated-walkthrough attempt):
"very slow, very AIsh … I need it more like marketing / promotional … camera zooming
is not okay, it misses things." Also: "don't start by comparing" and "I need male voice".

Story beats (real app behaviour, verified in the build):
1. "A nine-hour day. Three hours of meetings. Six left for real work." — business
   hours 9–18 minus 3h of meetings = 6h available (src/lib/day-capacity.ts).
2. The meter reads 4h 30m / 6h — every scheduled task weighed against free time.
3. A 2h report is dragged onto this afternoon → the app's own "Scheduling conflict"
   dialog ("Overlaps Prep team workshop. Next free slot is tomorrow 09:00").
4. "Schedule anyway" → the meter flips red: 6h 30m / 6h.
5. Move it to Thursday → back to 4h 30m / 6h.
6. End card: aro.day — "Plan a day that actually fits."

## Assets

- Real product footage + stills captured locally from the production build
  (Playwright, Pro seeded, pinned clock Wed 09:02, pearl theme) — staged into
  capture/assets/ by the capture step. No crawl of the live site.
- /Users/moataz/tradeling/todo/public/favicon.svg — aro.day mark for the end card.

## Customizations

- Footage shots are framed on a tight focal region (meter, dialog, card) so every
  shot survives the 1:1 cutdown.
- Music bed + sparse SFX on key moments (drop, red flip).

## Notes

- Deliver 16:9 (this project) AND a 1:1 version (1080x1080) as a cutdown afterwards.
- Never open with a comparison to other apps.
- Industry-neutral copy (no study streaks / billable hours / on-call flavour).
- The default app theme is pearl (light); brand accent is the app's blue.
- Series to follow with the same look + voice: 2) Type it your way (English / Arabic /
  Egyptian dialect quick-add, RTL), 3) Your AI sees your day (Claude via MCP),
  4) Create a task → "Schedule for me", 5) Day overview + drag scheduling.
