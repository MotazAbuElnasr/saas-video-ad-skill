// aro.day — Ad 1 "It fits". The project-specific half of the pipeline: brand, footage
// facts, shots, voice pads. Copied to the HyperFrames project root as ad.config.mjs.
export default {
  brand: { name: 'aro.day', mark: 'assets/aroday-mark.svg' },
  // HeyGen "Ewan — Bright & Energetic" (male, user's pick). Speed 1.0: 1.12 sounded rushed.
  voice: { provider: 'heygen', id: '5f9c155f4108437f970c308c95b06e11', speed: 1.0 },
  // From the app's pearl theme (public/styles/themes.css) — never invented.
  palette: { ink: '#1c2330', cream: '#fafbfc', accent: '#2563eb', alert: '#dc2626', muted: '#a3acbb', rule: '#39414f', canvas: '#fafbfc' },
  fonts: {
    display: { family: 'Inter', files: { 900: 'assets/fonts/Inter-Black.woff2', 700: 'assets/fonts/Inter-Bold.woff2' } },
    mono: { family: 'JetBrains Mono', files: { 400: 'assets/fonts/JetBrainsMono-400.woff2' } },
  },

  // Source-clip event times (s), measured with scripts/cuts.sh — not the recorder's marks.
  marks: {
    dragFrom: 2.6, // frame 03 opens on the cursor's approach — never mid-drag
    drop: 3.92,    // report lands on Wed afternoon → conflict dialog fades in
    red: 6.98,     // "Schedule anyway" clicked → meter flips to 8h / 7h
    moveFrom: 2.3, // frame 05 opens before the grab
  },
  // The capacity meter chip in the 1920×1080 footage, padded — the ring that replaces zooming.
  ring: { x: 1356, y: 70, w: 94, h: 44 },

  // One entry per footage frame (key = frame id). Full screen, 1:1, no camera moves.
  shots({ dur, cue, marks, full, config }) {
    const ring = (from) => [{ ...config.ring, from }];
    const overFrom = marks.dragFrom + dur(3); // 04 continues 03's take at an invisible seam
    return {
      '02-shows-you': full('ad-fit-day.mp4', 0, dur(2), { boxes: ring(cue(2, 'seven')) }),
      '03-add-one': full('ad-fit-drag.mp4', marks.dragFrom, dur(3)),
      '04-over': full('ad-fit-drag.mp4', overFrom, dur(4), { boxes: ring(marks.red - overFrom - 0.05) }),
      '05-thursday': full('ad-fit-move.mp4', marks.moveFrom, dur(5), { boxes: ring(1.5) }),
    };
  },

  // Voice pads (raw = unpadded facts). 04: "Over" lands just after the meter turns red.
  // 05: a 1.5s hold after "Done." so the result reads.
  pads({ dur, firstWord, marks }) {
    const redIn04 = marks.red - (marks.dragFrom + dur(3));
    return [
      { frame: 4, lead: Math.max(0, redIn04 + 0.15 - firstWord(4)) },
      { frame: 5, tail: 1.5 },
    ];
  },

  // For the critic: lines that name an on-screen event must land after it (frame-local s).
  events: [{ frame: 4, word: 'over', at: (marks, dur) => marks.red - (marks.dragFrom + dur(3)) }],
  // Gestures in the source clips (s) — no shot may start or end inside one.
  gestures: [
    { name: 'drag report onto today', src: 'ad-fit-drag.mp4', from: 3.3, to: 3.95 },
    { name: 'click Schedule anyway', src: 'ad-fit-drag.mp4', from: 6.45, to: 7.0 },
    { name: 'drag report to Thursday', src: 'ad-fit-move.mp4', from: 2.85, to: 3.45 },
  ],

  // Spoken "aro dot day" (so TTS says the dot) → subtitles show "aro.day".
  captionMerge: [{ spoken: ['aro', 'dot', 'day'], show: 'aro.day' }],
};
