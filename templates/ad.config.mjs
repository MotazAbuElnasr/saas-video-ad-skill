// <brand> — <ad name>. Copy to the HyperFrames project root as ad.config.mjs.
// The project-specific half of the pipeline; everything else in the skill is generic.
// See examples/aroday-it-fits/ad.config.mjs for a filled-in version.
export default {
  brand: { name: 'acme.app', mark: 'assets/brand-mark.svg' },

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
