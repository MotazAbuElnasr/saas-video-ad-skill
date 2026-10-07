// aro.day — "Take a break" (the breathing orb). See the skill's examples/aroday-it-fits for the pattern.
// Look (series: similar, not the same): calm — amber from the app's own orb, soft rises, paper
// cards on the board, a dark warm hook banner that bookends the orb end card.
const ZOOM = { s: 1.3, fx: 960, fy: 560 }; // quote beat: small text, nothing moving → a reasoned zoom; fy = the break card's centre
const zoomBox = (b) => ({ ...b, x: Math.round(ZOOM.fx + (b.x - ZOOM.fx) * ZOOM.s), y: Math.round(ZOOM.fy + (b.y - ZOOM.fy) * ZOOM.s), w: Math.round(b.w * ZOOM.s), h: Math.round(b.h * ZOOM.s) });

export default {
  brand: { name: 'aro.day', mark: 'assets/aroday-mark.svg' },
  // Gemini Charon (user's pick, after listening; reviews: the top narration voice). Pacing
  // is a style prompt (speed stays 1); the key comes from the keychain (gemini-api-key).
  voice: { provider: 'gemini', id: 'Charon', style: 'Warm, friendly and welcoming product-ad read with a relaxed smile in the voice: gently upbeat but not hyped, because the ad is about taking a break. Natural, easy-moving pace with only short pauses, never slow or sleepy. A soft lift on the brand name; the call to action said warmly.', saidAs: [[/\baro\b/gi, 'arrow']] },
  // User: "less, minimal, natural sounds" — a field recording (STORYBOARD music:), mixed low.
  music: { volume: 0.22, sfxVolume: 0.25 },
  look: { entrance: 'rise', card: 'paper', bug: { right: 40, top: 50 } },
  // accent: amber dark enough for rings/borders on the light board; glow: the orb's own amber
  // (--bo-amber) for type on the dark break screen; warm ink for the subtitle box (navy clashed).
  palette: { ink: '#1f2328', cream: '#fffaf2', accent: '#e8930c', glow: '#ffb347', captionAccent: '#ffb347', captionInk: '#24211d', alert: '#dc2626', muted: '#a3acbb', rule: '#6b5a40', canvas: '#fafbfc' },
  fonts: {
    display: { family: 'Inter', files: { 900: 'assets/fonts/Inter-Black.woff2', 700: 'assets/fonts/Inter-Bold.woff2' } },
    mono: { family: 'JetBrains Mono', files: { 400: 'assets/fonts/JetBrainsMono-400.woff2' } },
  },

  // assets/ad-break-flow.mp4 (one take, v3: tasks In Progress before AND after; free tier; the
  // cursor shows only for the click; quote "Look up. The screen is not the world.").
  marks: {
    reminder: 13.48, // timers cross 25:00 → the "Break time" toast fades in
    click: 15.85,    // cursor starts toward "Start break" (gesture start; it appears at 15.72)
    startBreak: 17.0, // the click lands: the toast vanishes (toast-region scan)
    orb: 17.08,      // the breathing orb overlay fades in (6s breath cycle starts)
    resume: 36.92,   // after the 5-minute jump: the overlay clears, 3 timers running again
  },
  rings: {
    toast: { x: 662, y: 928, w: 596, h: 100 },
    quote: { x: 798, y: 656, w: 326, h: 46 },
    resumes: { x: 798, y: 810, w: 326, h: 36 },
    cards: { x: 1104, y: 398, w: 784, h: 330 }, // the three running cards, In Progress
  },

  // Frames 01–06 are ONE take with no skipped footage (v2 skipped 1.5s and the clock jumped);
  // the reminder lands 0.3s into 02; 07 cuts over the 5-minute jump to the resumed board.
  sourceFrom({ dur, marks }, n) {
    if (n === 7) return marks.resume + 0.1;
    let t = marks.reminder - dur(1) - 0.3;
    for (let k = 1; k < n; k++) t += dur(k);
    return t;
  },

  shots(kit) {
    const { dur, cue, marks, full, config } = kit;
    const from = (n) => config.sourceFrom(kit, n);
    const r = (name, at, box = config.rings[name]) => [{ ...box, from: Math.max(0, at) }];
    const zoomIn = { cam0: { fx: ZOOM.fx, fy: ZOOM.fy, s: 1, tx: ZOOM.fx, ty: ZOOM.fy },
      moves: [{ at: 0.1, d: 0.8, to: { fx: ZOOM.fx, fy: ZOOM.fy, s: ZOOM.s, tx: ZOOM.fx, ty: ZOOM.fy } }] };
    const held = { cam0: { fx: ZOOM.fx, fy: ZOOM.fy, s: ZOOM.s, tx: ZOOM.fx, ty: ZOOM.fy }, moves: [] };
    return {
      '01-juggling': full('ad-break-flow.mp4', from(1), dur(1)),
      '02-reminder': full('ad-break-flow.mp4', from(2), dur(2), { boxes: r('toast', marks.reminder - from(2) + 0.15) }),
      '03-take-five': full('ad-break-flow.mp4', from(3), dur(3), { boxes: [{ ...config.rings.toast, from: 0, to: marks.startBreak - from(3) }] }),
      '04-orb': full('ad-break-flow.mp4', from(4), dur(4)),
      '05-quote': full('ad-break-flow.mp4', from(5), dur(5), { ...zoomIn, boxes: r('quote', 1.0, zoomBox(config.rings.quote)) }),
      '06-timers-wait': full('ad-break-flow.mp4', from(6), dur(6), { ...held, boxes: r('resumes', cue(6, 'three') - 0.1, zoomBox(config.rings.resumes)) }),
      '07-back-in': full('ad-break-flow.mp4', from(7), dur(7), { boxes: r('cards', cue(7, 'all') - 0.05) }),
    };
  },

  // raw = unpadded facts; leads land a word just AFTER the event it names. The take's clock
  // runs on, so each start includes the pads before it.
  pads({ dur, word, marks }) {
    const t3goal = marks.click - 0.15;                         // "Take five." as the cursor sets off
    const tail2 = Math.max(0.15, t3goal - (marks.reminder - 0.3 + dur(2)));
    const lead3 = 0.05;
    const t4 = t3goal + lead3 + dur(3);
    const lead4 = Math.max(0, marks.orb + 0.2 - t4 - word(4, 'breathe')); // "Breathe" as the orb appears
    return [
      { frame: 1, tail: 0.15 },
      { frame: 2, tail: tail2 },
      { frame: 3, lead: lead3 },
      { frame: 4, lead: lead4 },
      { frame: 5, lead: 0.3 },                 // one breath of the orb before the quote
      { frame: 6, tail: 0.3 },
      { frame: 7, tail: 1.2 },                 // payoff hold
      { frame: 8, lead: 0.5, tail: 1.8 },      // the lockup lands first; end card holds
    ];
  },

  // Effects ON their events: the toast, the click, the orb, the resume.
  sfxAt({ dur, word, marks }) {
    const s3 = marks.reminder - 0.3 + dur(2);  // frame 03's source start (sourceFrom)
    return { 2: 0.25, 3: Math.max(0, marks.click + 0.85 - s3), 4: Math.max(0, marks.orb - (s3 + dur(3))), 7: Math.max(0, word(7, 'all') - 0.1) };
  },

  // Subtitles never cover what they talk about, never repeat type already on screen, and only
  // move or (un)hide BETWEEN groups (at a frame's first word).
  captionMoves({ dur, first }) {
    const T = { 1: 0 };
    for (let k = 2; k <= 8; k++) T[k] = T[k - 1] + dur(k - 1); // frame k's start in the ad
    const lift = { x: 150, y: -170 }; // the empty strip under both board columns (y≈740–900), above the toasts
    return [
      { from: 0, to: T[2] + first(2) - 0.02, hide: true },     // hook: the banner says it
      { from: T[2], to: T[4] + first(4) - 0.02, ...lift },     // over the reminder toast
      { from: T[5], to: T[7] + first(7) - 0.02, hide: true },  // quote + "wait for you" are on screen
      { from: T[7], to: T[8], ...lift },                       // over the "Break over" toast
      { from: T[8], to: T[8] + dur(8) + 1, hide: true },       // the end card says it
    ];
  },

  // For the critic. at(marks, dur) → seconds into that frame.
  events: [
    { frame: 2, word: 'reminds', at: () => 0.3 },
    { frame: 4, word: 'breathe', at: (m, d) => m.orb - (m.reminder - 0.3 + d(2) + d(3)) },
  ],
  gestures: [{ name: 'click Start break', src: 'ad-break-flow.mp4', from: 15.72, to: 17.1 }],

  captionMerge: [{ spoken: ['aro', 'dot', 'day'], show: 'aro.day' }],
};
