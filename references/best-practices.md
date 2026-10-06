# Ad best practices (research) — and how this skill applies them

Researched 2026-10 from primary sources (Google/Kantar ABCD, Meta, TikTok, LinkedIn,
Wistia, Vidyard, AES, IAB, Netflix). Items marked *(unverified)* are conventions or
community measurements, not documented findings. Sources at the bottom.

**Precedence:** the user's own notes (`lessons.md`) beat generic research. Where they
conflict, the conflict and its resolution are written down below — don't "fix" it back.

## The rules

**Hook (0–3s)**
1. Value proposition on screen by 3s, hook resolved by 6s — TikTok puts 90% of ad-recall impact in the first 6s. [TT-Help, TT-Codes]
2. Open **mid-action**: live product footage behind the hook, not a still or a logo intro; first cut before 3s. [ABCD]
3. The first 5s must work alone — YouTube's Skip appears at 5s. [DV360]

**Story / structure**
4. One message per ad, shown or teased within 5s; arc: problem → product doing it → payoff → CTA. [ABCD]
5. Plan 6 / 15 / 30s cuts from the start — a 15s cut matched the 30s on brand impact in a 2026 Kantar case. [Kantar26]

**Branding**
6. Logo on screen within 5s **and** the brand name said at about the same moment. ABCD's detector checks logo ≥ 3.5% of the frame (a detector default, not a research finding). [GAds-CG, ABCD-Det]
7. Brand present throughout and in the last 5s; no slow logo intro. [ABCD, Kantar26]

**Product footage**
8. The product is the hero: real UI on screen from start to finish. [ABCD]
9. Lead with a demo in a realistic use case — demos topped completion, engagement and CTR across 3,500+ LinkedIn ads. [LI-21]
10. Show each result next to the control that caused it. [Moonb]

**On-screen text & captions**
11. Burn captions in. LinkedIn autoplays muted (79% of views sound-off); captions gave +12% view time on Meta. [LI-Spec, LI-21, Meta-Cap]
12. Design to read muted, but lead with sound: Reels is >75% sound-on and 95% of YouTube ads are audible ("85% muted" is 2016 publisher data). [Meta-Reels, GBlog17, Digiday16]
13. Cards ≤ 42 characters per line, ≤ 2 lines, held ≥ characters ÷ 18 seconds (≈2s for 35 chars); text echoes the voice-over, CTA included. [Netflix, ABCD-Det]

**Voice-over**
14. Natural human-sounding VO starting by 3s, ≈150 wpm ≈ 2.5 words/s ≈ 75 words per 30s *(pace unverified)*. [GAds-CG, Voices]

**Sound**
15. Social/streaming loudness −16 to −20 LUFS integrated, true peak ≤ −1 dBTP. [AES] YouTube normalizes to about −14 LUFS *(unverified)*.
16. CTV: −24 LKFS ±2 (US) / −23 LUFS ±1 (EU), peaks ≤ −6 dBTP. [IAB]
17. Music 15–20 dB under the voice *(unverified)*. On LinkedIn, one audio source beat VO + music. [LI-21]
18. On sound-on platforms, use sound: audio lifted Shorts conversions >20%. [Shorts, TT-Codes]

**Pacing**
19. Research: average shot ≤ 2s, ≥ 5 visual changes in any 5s window. [ABCD-Det, TT-21] → **see conflict A.**

**CTA / end card**
20. Show the CTA on screen **and** say it; add an offer or urgency. TikTok text CTAs gave +152% conversion, CTA cards +45% recall. [ABCD, TT-21, TT-Codes]

**Thumbnail**
21. Custom 16:9 thumbnail, a legible font, a simple composition, a face or emotion where possible, nothing misleading. [YT-Thumb, YT-Tips]

**Formats & safe zones**
22. YouTube: give each ad group 16:9, 9:16 and 1:1 versions — adding a vertical lifted Shorts view rate by more than 40%. [GAds-Vert]
23. Meta Reels: keep text and logos out of the top 14%, bottom 35% and side 6% (1080×1920: 269 / 672 / 65 px); use 4:5 in feed. [Meta-Guide]
24. TikTok: 9:16 at ≥720p (+312% conversion; 9:16 beat letterboxed by 91%). A box safe across Reels, Shorts and TikTok: x 120–888, y 288–1248 on 1080×1920. [TT-Help, TT-21]
25. LinkedIn: 4:5 recommended; 15–30s qualifies for all placements; upload SRT captions. [LI-Spec]

**Length**
Meta ≤ 15s; TikTok 21–34s; LinkedIn 15–30s; Shorts action 10–30s. Videos under 60s: 52% engagement [Wistia], 65% watched to the end [Vidyard].

## Where research and this user disagree — resolved

| | Research says | The user said | This skill does |
|---|---|---|---|
| A | Cut every ≤ 2s; ≥ 5 shots per 5s | "the video cut while dragging is disturbing"; zoom in/out + cuts "hard to follow" | **Change the screen every ~2s with overlays, not cuts**: a card, a ring, the next subtitle group, or a new beat. Never cut inside a gesture; one take per cause→effect. |
| B | Extreme close-ups (≥60% of frame), zoom to the cursor | "camera zooming is not okay, it misses things", "keep this full screen" — then: "some times zooming is fine, it really depends" | **Zoom with a reason, never during a gesture.** Default full screen 1:1 + a ring. Zoom in when something small must be read (a number, a chip, a quote) while nothing moves there: one eased move, hold, ease back out before the next action. Never zoom during a drag / click / typing, never hide what the voice describes, never bounce in and out. Vertical / square cut-downs: a static crop per beat around the action. |
| C | Logo ≥ 3.5% of frame within 5s | wants the brand visible all over — size not discussed | Brand said by 5s **and** a hook-frame lockup big enough to read on a phone (`brandHero` in frame-kit); corner bug afterwards. |
| D | Say a CTA with an offer | approved end lines without a CTA | **Ask** (intake): the default proposes a spoken CTA ("Start free at aro dot day") and the user decides. |

## How the skill applies it

| Rule | Where |
|---|---|
| 1–3 hook timing, mid-action | `script.md` hook rules; the hook frame sits over **live** footage (dimmed), not a still; critic `slow-hook` |
| 6–7 brand by 5s | critic `brand-late` (said ≤ 5s) + `logo-small`; `brandHero` lockup in the hook |
| 11–13 captions, card length + hold | captions always on; critic `card-chars` (≤ 42/line) + `card-hold` (≥ chars ÷ 18 s) |
| 14 VO pace | voice speed 1.0; critic `rushed` (> 3.0 w/s) and `words-per-30s` (> 80) |
| 15–16 loudness | critic `loudness` by destination (YouTube −14 ± 2, social −16 to −20) |
| 20 CTA | intake asks; critic `no-cta` (WARN) |
| 21 thumbnail | frame 0 composed; `render.sh` exports it; critic `thumbnail-empty` / `-dark` |
| 22–25 formats | intake asks the destinations; 9:16 / 1:1 cut-downs (static crop per beat) — **not built yet**, see SKILL.md roadmap |

## Sources
- ABCD playbook (Google/Kantar 2021: +30% short-term sales likelihood) — https://www.thinkwithgoogle.com/_qs/documents/15987/ABCDs_PDFPlaybook_April2022_Final.pdf · https://support.google.com/google-ads/answer/14783551
- GAds-CG creative guidance — https://support.google.com/google-ads/answer/13812351
- ABCD-Det (detector defaults, not research) — https://github.com/google-marketing-solutions/abcds-detector
- Shorts ad specs — https://support.google.com/google-ads/answer/16041697 · GAds-Vert — https://support.google.com/google-ads/answer/9128498
- DV360 YouTube formats — https://support.google.com/displayvideo/answer/6274216 · GBlog17 — https://blog.google/products/marketingplatform/360/bringing-video-ads-into-view/
- YT-Thumb / YT-Tips — https://support.google.com/youtube/answer/72431 · https://support.google.com/youtube/answer/12340300
- Meta-Cap — https://www.facebook.com/business/news/updated-features-for-video-ads · Meta-Guide — https://www.facebook.com/business/ads-guide/update/image/instagram-reels · Meta-Reels — https://developers.facebook.com/blog/post/2024/11/07/unlock-the-power-of-reel-ads/
- Digiday16 — https://www.niemanlab.org/reading/publishers-say-85-percent-of-facebook-video-is-watched-without-sound/
- TT-Help — https://ads.tiktok.com/help/article/creative-best-practices · TT-21 — https://ads.tiktok.com/business/en-US/blog/creative-that-drives-conversions · TT-Codes — https://ads.tiktok.com/business/en-US/blog/creative-best-practices-top-performing-ads
- LI-Spec — https://www.linkedin.com/help/linkedin/answer/a424737 · LI-21 — https://www.linkedin.com/business/marketing/blog/linkedin-ads/4-tips-for-better-video-ads-on-linkedin-in-2021
- Kantar26 — https://www.kantar.com/north-america/company-news/kantar-super-bowl-ad-study-15-second-ads-match-30-second-spots
- Wistia — https://wistia.com/learn/marketing/optimal-video-length · Vidyard — https://www.vidyard.com/business-video-benchmarks/
- AES TD1004 — https://aes.org/wp-content/uploads/2024/01/AESTD1004_1_15_10.pdf · IAB Tech Lab — https://github.com/InteractiveAdvertisingBureau/Ad-Format-Guidelines-for-Digital-Video-CTV/blob/main/v2.0.md
- Netflix Timed Text Style Guide — https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide
- Moonb launch-video teardown — https://www.moonb.io/blog/product-launch-video
