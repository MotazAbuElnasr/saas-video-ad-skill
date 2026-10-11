// <brand> — <ad name>. Copy to the HyperFrames project root as ad.config.mjs.
// The project-specific half of the pipeline; everything else in the skill is generic.
// See examples/aroday-it-fits/ad.config.mjs for a filled-in version.
export default {
  brand: { name: 'acme.app', mark: 'assets/brand-mark.svg' },
  // Output canvas. Default 16:9 (1920×1080). Vertical: aspect: '9:16' (or format: { width: 1080, height: 1920 })
  // AND "format: 1080x1920" in STORYBOARD.md; then give every shot a `crop` or a `stage` (see shots below).
  // aspect: '9:16',
  // TTS: HeyGen voice id (list: media-use/audio/scripts/heygen-tts.mjs --list) or Kokoro (am_michael…).
  voice: { provider: 'heygen', id: '<voice-id>', speed: 1.0 },

  // From the product's own theme tokens (read the CSS/theme file) — never invented.
  // ink = dark ground + card fill, cream = text on ink, accent = the one highlight colour,
  // alert = the single "bad state" colour, canvas = the app's page background.
  palette: { ink: '#1c2330', cream: '#fafbfc', accent: '#2563eb', alert: '#dc2626', muted: '#a3acbb', rule: '#39414f', canvas: '#fafbfc' },

  // Fonts must ship as files inside the project (assets/fonts/…) — the render machine has none.
  fonts: {
    display: { family: 'Inter', files: { 900: 'assets/fonts/Inter-Black.woff2', 700: 'assets/fonts/Inter-Bold.woff2' } },
    mono: { family: 'JetBrains Mono', files: { 400: 'assets/fonts/JetBrainsMono-400.woff2' } },
  },

  // Event times in the SOURCE clips (s), measured with scripts/cuts.sh + strip.sh.
  marks: {
    // gestureFrom: 2.6,   // start of a take — before the cursor's approach, never mid-gesture
    // eventAt: 3.92,      // the moment the UI reacts (drop, dialog, state change)
  },

  // Highlight ring around a UI element in 1920×1080 footage px (from the 2× stills ÷ 2).
  ring: { x: 0, y: 0, w: 100, h: 44 },

  // One entry per footage frame (key = frame id = compositions/frames/<id>.html).
  // full(src, from, dur, { boxes, moves }) = full-screen 1:1 — the default. Avoid moves.
  shots({ dur, cue, marks, full, config }) {
    return {
      // '02-answer': full('clip-a.mp4', 0, dur(2), { boxes: [{ ...config.ring, from: cue(2, 'seven') }] }),
      // 9:16 — crop (source px, ~9:16, inside 1920×1080); boxes stay in SOURCE px and map through it:
      // '03-detail': full('clip-a.mp4', 3, dur(3), { crop: [850, 0, 608, 1080], boxes: [{ ...config.ring, from: 1.2 }] }),
      // 9:16 — a gesture across the whole app: the app as a floating panel (≈ 994 px wide), type above/below;
      // a move can push onto a crop inside the panel:
      // '04-wide': full('clip-b.mp4', 2.6, dur(4), { stage: { s: 0.92, from: { ry: 0, rx: 0, z: 1 }, to: { ry: 0, rx: 0, z: 1 } },
      //   moves: [{ at: 1.5, d: 0.6, to: { crop: [1040, 20, 760, 428] } }], boxes: [{ ...config.ring, from: 2.2 }] }),
    };
  },

  // Voice pads (raw facts: dur(n), firstWord(n), marks). lead = line lands after an event;
  // tail = hold after a payoff line.
  pads({ dur, firstWord, marks }) {
    return [
      // { frame: 4, lead: Math.max(0, eventInFrame4 + 0.15 - firstWord(4)) },
      // { frame: 5, tail: 1.5 },
    ];
  },

  // Spoken spelling → written form in subtitles.
  captionMerge: [
    // { spoken: ['acme', 'dot', 'app'], show: 'acme.app' },
  ],
};
