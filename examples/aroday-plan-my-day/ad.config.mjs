// aro.day — Ad 5 "Day overview" (the today strip). See the skill's examples/aroday-it-fits for the pattern.
// Look (series: similar, not the same): the app's mocha theme at UI zoom 1.5 — wipe entrances,
// a highlighter headline, espresso cards, one eased push-in on the strip, a light end card, a brook.
const CAM = { fx: 1320, fy: 338, s: 1.6, tx: 960, ty: 540 };
// 02 ends as the cursor appears; 03 opens on the press — the 0.35s between (the cursor's approach
// and the app's hover card flashing open) is cut: the camera is held, nothing else moves.
const T2 = (m) => m.cursorIn - 0.12, T3 = (m) => m.dragGo + 0.02; // − 0.12: the cursor showed for the last frames of 02 // the strip + agenda: source x 720–1920, y 0–675 (edges stay inside the app)

export default {
  brand: { name: 'aro.day', mark: 'assets/aroday-mark.svg' },
  // Gemini Charon (user's pick, after listening; reviews: the top narration voice). Pacing
  // is a style prompt (speed stays 1); the key comes from the keychain (gemini-api-key).
  voice: { provider: 'gemini', id: 'Charon', style: 'Confident, friendly and welcoming product-ad read, lightly upbeat with a smile. Natural, brisk pace with short pauses, never slow, never hyped or shouty. Lift on the brand name; say the call to action with a smile. Practical: a small fix that feels great.', saidAs: [[/\baro\b/gi, 'arrow']] },
  music: { volume: 0.16, sfxVolume: 0.25 }, // 0.16: the cafe bed swelled ~10 dB in the voice-free payoff hold
  look: { entrance: 'wipe', card: 'ink', bug: { left: 660, top: 24 } }, // the empty gap in the top bar, clear before and after the zoom (top-right sat on Sign in; bottom-left is YouTube's ad badge)
  // From the app's mocha theme (public/styles/themes.css): bg #f0eee9 "Cloud Dancer", accent
  // #a47864 "Mocha Mousse", on-accent #2c1810 espresso. Rings in a deeper mocha so they read on cream.
  palette: { ink: '#2c1810', cream: '#faf8f3', accent: '#8f4f33', mocha: '#a47864', ground: '#f0eee9', captionAccent: '#a47864', captionInk: '#2c1810', alert: '#c0392b', muted: '#8a7a70', rule: '#6b5a50', canvas: '#f0eee9' },
  fonts: {
    display: { family: 'Inter', files: { 900: 'assets/fonts/Inter-Black.woff2', 700: 'assets/fonts/Inter-Bold.woff2' } },
    mono: { family: 'JetBrains Mono', files: { 400: 'assets/fonts/JetBrainsMono-400.woff2' } },
  },

  // assets/ad-plan-flow.mp4 (one take: mocha, free tier, UI zoom 1.5), region-change scans.
  marks: {
    cursorIn: 9.05, // the cursor appears over the roadmap bar
    hover: 9.2,     // its hover card opens (closed again by the mousedown)
    dragGo: 9.4,    // mouse down — the bar snaps 14:15 → 15:00 by 10.30
    drop: 10.7,     // the drop commits: the bar fills 15:00–16:30
    agenda: 10.73,  // the agenda cards re-sort
  },
  rings: {
    clash: { x: 1084, y: 156, w: 260, h: 86 }, // roadmap 14:00–15:30 over the client call 14:00–15:00
    gap: { x: 1246, y: 156, w: 258, h: 86 },   // 15:00–16:30 — the free 90 minutes, then the moved bar
  },

  // Frames 01–04 are one take but for the cut at 02|03 (see T2/T3); 01+02 play over the still day.
  sourceFrom({ dur, marks }, n) {
    const t2 = T2(marks), t3 = T3(marks);
    return { 1: t2 - dur(1) - dur(2), 2: t2 - dur(2), 3: t3, 4: t3 + dur(3) }[n];
  },

  shots(kit) {
    const { dur, cue, marks, full, config } = kit;
    const from = (n) => config.sourceFrom(kit, n);
    const ring = (name, at, extra = {}) => ({ ...config.rings[name], from: Math.max(0, at), pre: true, ...extra });
    // the whole strip stays in view through "whole day"; the push lands on "one line" (review)
    const pushAt = cue(2, 'one');
    const push = { cam0: { fx: 960, fy: 540, s: 1, tx: 960, ty: 540 }, moves: [{ at: pushAt, d: Math.min(0.7, dur(2) - pushAt - 0.05), to: CAM }] };
    const held = { cam0: CAM, moves: [] };
    return {
      '01-clash': full('ad-plan-flow.mp4', from(1), dur(1), { boxes: [ring('clash', 0)] }), // ringed from frame 0: the thumbnail
      '02-one-line': full('ad-plan-flow.mp4', from(2), dur(2), { ...push, boxes: [ring('clash', 0)] }),
      // the clash ring carries over the cut until the bar moves: the cut read as a jump when it vanished on it
      '03-drag': full('ad-plan-flow.mp4', from(3), dur(3), { ...held, boxes: [ring('clash', 0, { to: 0.22 }), ring('gap', 0.3)] }),
      '04-fits': full('ad-plan-flow.mp4', from(4), dur(4), { ...held, boxes: [ring('gap', 0)] }),
    };
  },

  // raw = unpadded facts; leads land a word just AFTER the event it names.
  pads({ dur, word, marks }) {
    const t3 = T3(marks);
    const lead3 = Math.max(0, marks.dragGo + 0.05 - t3 - word(3, 'drag'));
    const tail3 = 0.2;                         // a breath: "three." was cut on its last syllable
    const t4 = t3 + lead3 + dur(3) + tail3;
    const lead4 = Math.max(0, marks.drop + 0.15 - t4 - word(4, 'ninety'));   // "Ninety" after the drop
    return [
      { frame: 1, tail: 0.15 },
      { frame: 2, tail: 0.1 },
      { frame: 3, lead: lead3, tail: tail3 },  // "Drag" as the mouse goes down
      { frame: 4, lead: lead4, tail: 1.0 },    // payoff hold (~1s, review)
      { frame: 5, lead: 0.4, tail: 1.8 },      // the motif snaps in first (0.9 left 2.1s with no voice); end card holds
    ];
  },

  // Effects ON their events: the swipe as the drag starts, the pop on the drop itself (it lands
  // while line 3 is still being said — review: the pop came late, at the next frame).
  sfxAt({ marks }) {
    const t3 = T3(marks);
    return { 3: [marks.dragGo - t3, marks.drop - t3] };
  },

  // Subtitles bottom-left (clear of the strip, the payoff card and YouTube's Skip zone);
  // hidden where on-screen type says the line.
  captionMoves({ dur, first }) {
    const T = { 1: 0 };
    for (let k = 2; k <= 5; k++) T[k] = T[k - 1] + dur(k - 1);
    return [
      { from: 0, to: T[2] + first(2) - 0.02, hide: true },   // hook: the headline says it
      { from: T[2], to: T[4], x: -420, y: -240 },           // y ≈ 700–800: Queued cards, then empty toolbar after the zoom — far above YouTube's ad badge
      { from: T[4], to: T[5] + dur(5) + 1, hide: true },    // payoff card + end card say it
    ];
  },

  // For the critic. at(marks, dur) → seconds into that frame (mirrors sourceFrom).
  events: [
    { frame: 3, word: 'drag', at: (m) => m.dragGo - T3(m) },
    { frame: 4, word: 'ninety', at: (m, d) => m.drop - (T3(m) + d(3)) },
  ],
  gestures: [{ name: 'drag the roadmap bar', src: 'ad-plan-flow.mp4', from: 9.4, to: 10.75 }],

  captionMerge: [{ spoken: ['aro', 'dot', 'day'], show: 'aro.day' }],
};
