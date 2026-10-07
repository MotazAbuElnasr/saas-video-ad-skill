// aro.day — Ad 4 "Schedule for me". See the skill's examples/aroday-it-fits for the pattern.
// Look (series: similar, not the same): the app's terminal theme — near-black, phosphor green,
// typewriter entrances, outline cards; the empty In Progress column is the text zone; setup →
// payoff in the same timeline slot; rain for the bed.
// Frame 03 opens 0.45s into the typing, so frame 01 starts at 1.70s — after the parked cursor
// is hidden (1.63s): frame 0 is the thumbnail.
const T3 = (m) => m.typing + 0.45;
const ZOOM = { fx: 1658, fy: 166, s: 1.8, tx: 1460, ty: 290 }; // payoff: the 17–18 slot at 1.8×, frame edges stay inside the app (tx ≥ 1448, ty ≤ 299)

export default {
  brand: { name: 'aro.day', mark: 'assets/aroday-mark.svg' },
  // Gemini Charon (user's pick, after listening; reviews: the top narration voice). Pacing
  // is a style prompt (speed stays 1); the key comes from the keychain (gemini-api-key).
  voice: { provider: 'gemini', id: 'Charon', style: 'Confident, friendly and welcoming product-ad read, lightly upbeat with a smile. Natural, brisk pace with short pauses, never slow, never hyped or shouty. Lift on the brand name; say the call to action with a smile. A little playful.', saidAs: [[/\baro\b/gi, 'arrow']] },
  music: { volume: 0.2, sfxVolume: 0.25 }, // rule 16: less music
  look: { entrance: 'type', card: 'outline', bug: { left: 760, top: 6 } }, // the header's empty stretch, clear before and after the zoom (top-right sat on Sign in + the calendar chip; bottom-left is YouTube's ad badge)
  // From the app's terminal theme (public/styles/themes.css): bg #0a0b0a, accent #5ef07a.
  palette: { ink: '#050705', cream: '#eafbe9', accent: '#5ef07a', captionAccent: '#5ef07a', alert: '#ff5c5c', muted: '#8a9a8c', rule: '#2a3a2c', canvas: '#0a0b0a' },
  fonts: {
    display: { family: 'Inter', files: { 900: 'assets/fonts/Inter-Black.woff2', 700: 'assets/fonts/Inter-Bold.woff2' } },
    mono: { family: 'JetBrains Mono', files: { 400: 'assets/fonts/JetBrainsMono-400.woff2' } },
  },
  captionMaxChars: 26, // subtitles share the In Progress column with the open menu

  // assets/ad-sched-flow.mp4 (one take v2: terminal, free tier, cursor hidden until it acts),
  // measured with region-change scans.
  marks: {
    cursorGo: 6.17,  // cursor appears and heads for "new task"
    inputOpen: 6.37, // the new-task input opens
    typing: 6.88,    // first characters typed
    chip: 8.8,       // "1h" typed → the ⧗ 1h duration chip
    card: 9.28,      // Enter → the card appears; the input clears (chip gone)
    menuGo: 9.55,    // Escape; cursor heads for the card's ⋯
    menu: 10.57,     // the card menu is open: "Schedule for me · Today 05:00 PM"
    click: 11.62,    // the cursor reaches "Schedule for me" and clicks
    booked: 11.92,   // the task lands at 17:00 on the day timeline
  },
  rings: {
    gap: { x: 1566, y: 128, w: 184, h: 76 },     // day timeline 17:00–18:00 (TASKS + GCAL rows)
    chip: { x: 336, y: 598, w: 74, h: 38 },      // the parsed "⧗ 1h" chip under the input
    menuRow: { x: 1024, y: 334, w: 316, h: 42 }, // "Schedule for me · Today 05:00 PM"
  },
  // The timeline pads an hour each side of the 9–18 workday: shade 8–9 and 18–19 so "one free
  // hour in your workday" is what the screen shows (review: 18–19 looked just as free).
  offHours: [{ x: 100, y: 104, w: 164, h: 94 }, { x: 1741, y: 104, w: 163, h: 94 }],

  // Frames 01–05 are ONE take: 01+02 play over the still day and the cursor's entrance.
  sourceFrom({ dur, marks }, n) {
    const t3 = T3(marks);
    return { 1: t3 - dur(1) - dur(2), 2: t3 - dur(2), 3: t3, 4: t3 + dur(3), 5: t3 + dur(3) + dur(4) }[n];
  },

  shots(kit) {
    const { dur, marks, full, config } = kit;
    const from = (n) => config.sourceFrom(kit, n);
    // a light veil, not a dark one: black shading vanished on the black terminal timeline
    const shade = config.offHours.map((b) => ({ ...b, from: 0, fill: true, alpha: 0.24, color: '#9aa59c', pre: true }));
    const ring = (name, at, extra = {}) => ({ ...config.rings[name], from: Math.max(0, at), ...extra });
    const zoom = { cam0: { fx: 960, fy: 540, s: 1, tx: 960, ty: 540 },
      moves: [{ at: marks.booked - from(5) + 0.35, d: 0.7, to: ZOOM }] };
    return {
      '01-one-free-hour': full('ad-sched-flow.mp4', from(1), dur(1), { boxes: shade }), // the slot glow is an HTML overlay (it pulses)
      '02-finds-it': full('ad-sched-flow.mp4', from(2), dur(2), { boxes: shade }),
      '03-type-it': full('ad-sched-flow.mp4', from(3), dur(3), { boxes: [...shade, ring('chip', marks.chip - from(3), { to: marks.card - from(3) })] }),
      '04-schedule-for-me': full('ad-sched-flow.mp4', from(4), dur(4), { boxes: [...shade, ring('menuRow', marks.menu - from(4) + 0.1, { to: marks.click - from(4) })] }),
      // pre: drawn on the source so the shading and the slot ring zoom WITH the timeline
      '05-booked': full('ad-sched-flow.mp4', from(5), dur(5), { ...zoom,
        boxes: [...shade, ring('menuRow', 0, { to: marks.click - from(5), pre: true }), ring('gap', marks.booked - from(5) + 0.05, { pre: true })] }),
    };
  },

  // raw = unpadded facts. Each lead lands a word just AFTER the event it names; the take's
  // clock runs on, so later starts include the earlier pads.
  pads({ dur, word, marks }) {
    const t3 = T3(marks);
    const tail3 = 0.15;
    const t4 = t3 + dur(3) + tail3;
    const lead4 = Math.max(0, marks.menu + 0.1 - t4 - word(4, 'menu'));       // "menu" as it opens
    const t5 = t4 + lead4 + dur(4);
    const lead5 = Math.max(0, marks.booked + 0.15 - t5 - word(5, 'five'));    // "Five" after it lands
    return [
      { frame: 1, tail: 0.55 },   // the inverted "hour." holds a beat (hook < 4s)
      { frame: 2, tail: 0.1 },
      { frame: 3, tail: tail3 },
      { frame: 4, lead: lead4 },
      { frame: 5, lead: lead5, tail: 1.3 },   // payoff hold (the zoom lands under "Five p.m.")
      { frame: 6, lead: 1.0, tail: 1.8 },     // the tagline types first; end card holds
    ];
  },

  // Effects ON their events: typing, the click, the landing.
  sfxAt({ dur, marks }) {
    const t3 = T3(marks), t4 = t3 + dur(3), t5 = t4 + dur(4);
    // typing: only while keys are pressed (until the 1h chip parses), and quiet — a 44s loop
    // ran under the rest of the ad ("typing is still there it's very noisy")
    return { 3: { at: 0, dur: marks.chip - t3, vol: 0.12 }, 4: Math.max(0, marks.click - t4), 5: Math.max(0, marks.booked - t5) };
  },

  // Subtitles high in the In Progress column (clear of the open menu, the bottom-centre toasts
  // and YouTube's bottom-right Skip button); hidden where on-screen type says the line.
  captionMoves({ dur, first }) {
    const T = { 1: 0 };
    for (let k = 2; k <= 6; k++) T[k] = T[k - 1] + dur(k - 1);
    return [
      { from: 0, to: T[2] + first(2) - 0.02, hide: true },          // hook: the type says it
      { from: T[2], to: T[4], x: 540, y: -330 },                   // column centre (1500, 660)
      { from: T[4], to: T[5], x: 660, y: -330 },                   // right of the menu (ends x 1336)
      { from: T[5], to: T[6] + dur(6) + 1, hide: true },           // payoff card + end card say it
    ];
  },

  // For the critic. at(marks, dur) → seconds into that frame (mirrors sourceFrom).
  events: [
    { frame: 4, word: 'menu', at: (m, d) => m.menu - (T3(m) + d(3)) },
    { frame: 5, word: 'five', at: (m, d) => m.booked - (T3(m) + d(3) + d(4)) },
  ],
  gestures: [
    { name: 'click new task', src: 'ad-sched-flow.mp4', from: 6.17, to: 6.4 },
    { name: 'open card menu', src: 'ad-sched-flow.mp4', from: 9.55, to: 10.57 },
    { name: 'click Schedule for me', src: 'ad-sched-flow.mp4', from: 10.85, to: 11.92 },
  ],

  captionMerge: [{ spoken: ['aro', 'dot', 'day'], show: 'aro.day' }],
};
