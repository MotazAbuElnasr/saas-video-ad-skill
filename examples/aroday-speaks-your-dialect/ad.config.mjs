// aro.day — Ad 6 "Speaks your dialect": the app in Arabic (RTL), quick-add typed the way people
// talk. Look (series: similar, not the same): catppuccin-latte, lavender + plum, right-to-left
// kinetic type (faint words light up as they are said), a zoom on the input, a dark dialect
// lineup, a light end card. See the skill's examples for the pattern.
// 02 ends before the cursor appears; 03 runs on in the same take (click → type → Enter).
const T2 = (m) => m.cursorIn - 0.12, T3 = T2;
// input + chips + the new card, the empty In Progress column on the left; source x 310–1590, y 320–1040 —
// the agenda strip (English times: an app bug) and the cut-off project list stay out of frame
const ZOOM = { fx: 950, fy: 680, s: 1.5, tx: 960, ty: 540 };

export default {
  brand: { name: 'aro.day', mark: 'assets/aroday-mark.svg' },
  // Gemini Charon in Egyptian Arabic; the brand is said in English ("arrow dot day") — saidAs
  // feeds TTS the English, captions keep the script's «أرو دوت داي» (shown as aro.day).
  voice: {
    provider: 'gemini', id: 'Charon', lang: 'ar',
    style: 'Natural, friendly Egyptian (Cairene) Arabic, like a young professional talking to a friend. Confident, friendly and welcoming product-ad read, lightly upbeat with a smile. Natural, brisk pace with short pauses, never slow, never hyped or shouty. Say the brand name "arrow dot day" in English.',
    saidAs: [[/أرو دوت داي/g, 'arrow dot day']],
  },
  music: { volume: 0.2, sfxVolume: 0.22 },
  look: { entrance: 'wipe', card: 'ink', dir: 'rtl', bug: { left: 760, top: 6 } }, // the header's empty stretch (top-right sat under the app's own logo / on a card)
  // From the app's catppuccin-latte theme (public/styles/themes.css): base #eff1f5, text #4c4f69,
  // mauve #8839ef. Dark grounds use the Catppuccin mocha base + mauve for contrast.
  palette: { ink: '#1e1e2e', cream: '#eff1f5', text: '#4c4f69', accent: '#8839ef', glow: '#cba6f7', captionAccent: '#cba6f7', captionInk: '#1e1e2e', alert: '#d20f39', muted: '#7c7f93', rule: '#9ca0b0', canvas: '#eff1f5' },
  fonts: {
    display: { family: 'Inter', files: { 900: 'assets/fonts/Inter-Black.woff2', 700: 'assets/fonts/Inter-Bold.woff2' } },
    mono: { family: 'JetBrains Mono', files: { 400: 'assets/fonts/JetBrainsMono-400.woff2' } },
    script: '"SF Arabic", "Geeza Pro"', // Inter has no Arabic glyphs: Arabic letters fall through to these (macOS)
  },

  // assets/ad-arabic-flow.mp4 (one take: catppuccin-latte, Arabic UI, free tier), region scans.
  marks: {
    cursorGone: 1.75, // the parked cursor leaves the bottom-left corner — frame 01 must start after
    cursorIn: 7.82,   // the cursor appears over the new-task input
    inputOpen: 8.4,   // the input opens (placeholder)
    typing: 8.77,     // first character
    tomorrow: 10.23,  // «بكرة» typed → the «غدًا ٩:٠٠» chip appears under the input
    three: 10.98,     // «٣ العصر» typed → the chip reads «غدًا ١٥:٠٠»
    hour: 11.83,      // «لمدة ساعة» typed → the «١س» chip
    enter: 12.53,     // Enter: the card «مكالمة العميل» is created
  },
  rings: {
    chips: { x: 1416, y: 597, w: 168, h: 40 },     // the parsed chips under the input
    cardChips: { x: 1410, y: 705, w: 145, h: 34 }, // «غدًا ١٥:٠٠ · ١س» on the new card
  },

  sourceFrom({ dur, marks }, n) {
    const t2 = T2(marks), t1 = t2 - dur(1) - dur(2);
    if (t1 < marks.cursorGone) throw new Error(`ad.config: frame 01 would start at ${t1.toFixed(2)}s, before the parked cursor leaves (${marks.cursorGone}s) — re-film with a longer opening beat`);
    return { 1: t1, 2: t2 - dur(2), 3: T3(marks), 4: T3(marks) + dur(3) }[n];
  },

  shots(kit) {
    const { dur, cue, marks, full, config } = kit;
    const from = (n) => config.sourceFrom(kit, n);
    const ring = (name, at, extra = {}) => ({ ...config.rings[name], from: Math.max(0, at), pre: true, ...extra });
    // the whole board through "aro dot day understands both"; the push lands on «فاهم»
    const pushAt = cue(2, 'فاهم');
    const push = { cam0: { fx: 960, fy: 540, s: 1, tx: 960, ty: 540 }, moves: [{ at: pushAt, d: Math.min(0.7, dur(2) - pushAt - 0.05), to: ZOOM }] };
    const held = { cam0: ZOOM, moves: [] };
    return {
      '01-hook': full('ad-arabic-flow.mp4', from(1), dur(1)),
      '02-both': full('ad-arabic-flow.mp4', from(2), dur(2), push),
      '03-type': full('ad-arabic-flow.mp4', from(3), dur(3), { ...held, boxes: [ring('chips', marks.tomorrow - from(3) + 0.05, { to: marks.enter - from(3) - 0.05 })] }), // off before Enter clears the chips
      '04-set': full('ad-arabic-flow.mp4', from(4), dur(4), { ...held, boxes: [ring('cardChips', marks.enter - from(4) + 0.1)] }),
    };
  },

  // raw = unpadded facts; leads land a word just AFTER the event it names.
  pads({ dur, word, marks }) {
    const t3 = T3(marks);
    const lead3 = Math.max(0, marks.tomorrow + 0.1 - t3 - word(3, 'بكرة'));   // «بكرة» as its chip appears
    const tail3 = 0.15;
    const t4 = t3 + lead3 + dur(3) + tail3;
    const lead4 = Math.max(0, marks.enter + 0.15 - t4 - word(4, 'اتحطت'));   // «اتحطت» once the card is there
    return [
      { frame: 1, tail: 0.25 },                // the question hangs a beat
      { frame: 2, tail: 0.1 },
      { frame: 3, lead: lead3, tail: tail3 },
      { frame: 4, lead: lead4, tail: 1.0 },    // payoff hold
      { frame: 5, lead: 0.1, tail: 0.6 },      // the lineup starts on its first word
      { frame: 6, lead: 0.6, tail: 1.8 },      // end card composed first; holds to the last frame
    ];
  },

  // Effects ON their events: the card appearing (inside 03 — Enter lands before 03 ends), «كله مفهوم».
  sfxAt({ word, marks }) {
    return { 3: marks.enter - T3(marks), 5: Math.max(0, word(5, 'كله') - 0.05) };
  },

  // Subtitles (right-to-left) bottom-centre over the zoomed lower cards — clear of the input, the
  // chips, YouTube's ad badge (bottom-left) and Skip button (bottom-right); hidden where type says it.
  captionMoves({ dur, first }) {
    const T = { 1: 0 };
    for (let k = 2; k <= 6; k++) T[k] = T[k - 1] + dur(k - 1);
    return [
      { from: 0, to: T[2] + first(2) - 0.02, hide: true },    // hook: the headline says it
      { from: T[2], to: T[4], x: 0, y: -40 },
      { from: T[4], to: T[6] + dur(6) + 1, hide: true },     // payoff card, lineup, end card say it
    ];
  },
  captionMaxChars: 30,

  // For the critic. at(marks, dur) → seconds into that frame (mirrors sourceFrom).
  events: [
    { frame: 3, word: 'بكرة', at: (m) => m.tomorrow - T3(m) },
    { frame: 4, word: 'اتحطت', at: (m, d) => m.enter - (T3(m) + d(3)) },
  ],
  gestures: [{ name: 'click the new-task input', src: 'ad-arabic-flow.mp4', from: 7.82, to: 8.0 }],

  captionMerge: [{ spoken: ['أرو', 'دوت', 'داي'], show: 'aro.day' }],
};
