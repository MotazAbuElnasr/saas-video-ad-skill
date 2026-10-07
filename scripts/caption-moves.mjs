// Post-processes compositions/captions.html for this ad. Run after captions.mjs build (build.sh does). Idempotent.
//
// Merge — the engine splits a group at every comma and caps it at 2–4 words, so groups like
// "if you" flashed for 0.25s (review: unreadable, machine line breaks). A group visible for
// < 0.6s joins its neighbour in the same frame while the line stays ≤ 32 characters.
//
// Moves — the subtitle band gets out of the way while the app's own UI sits under it (a toast,
// a dialog's buttons): subtitles must never cover the thing being talked about.
// config.captionMoves({ dur, cue, first }) → [{ from, to, x, y }]: seconds in the ad, px offset
// of the band (`.caption-stage`, normally the bottom band) during [from, to).
// { from, to, hide: true } hides the band — when on-screen type already says the line (hook
// headline, quote card, end card). Change position or visibility only BETWEEN groups (at a
// frame's first word, `first(n)`), never mid-phrase: a band jumping under a word reads as broken.
//
// Tint — the skin's colors come from frame.md (brand-wide); each ad's look re-tints the
// active-word highlight (palette.captionAccent ?? palette.accent) and the box (palette.captionInk).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { config, cue, dur, meta } from './timing.mjs';

const p = 'compositions/captions.html';
if (!existsSync(p)) process.exit(0);
let html = readFileSync(p, 'utf8');

// ── merge short groups ──
// MAX_CHARS: a narrow text zone (subtitles beside an open menu) wants shorter lines.
const MIN_SHOW = 0.6, MAX_CHARS = config.captionMaxChars ?? 32;
const m = html.match(/var GROUPS = (\[.*\]);\n/);
let merged = 0;
if (m) {
  const groups = JSON.parse(m[1]);
  const shown = (i) => (groups[i + 1] ? Math.min(groups[i + 1].start, groups[i].end + 0.3) : groups[i].end + 0.3) - groups[i].start;
  const join = (a, b) => ({ ...a, end: b.end, text: `${a.text} ${b.text}`, words: [...a.words, ...b.words] });
  for (let changed = true; changed;) {
    changed = false;
    for (let i = 0; i < groups.length; i++) {
      if (shown(i) >= MIN_SHOW) continue;
      const g = groups[i], next = groups[i + 1], prev = groups[i - 1];
      if (next && next.frame === g.frame && `${g.text} ${next.text}`.length <= MAX_CHARS) groups.splice(i, 2, join(g, next));
      else if (prev && prev.frame === g.frame && `${prev.text} ${g.text}`.length <= MAX_CHARS) groups.splice(i - 1, 2, join(prev, g));
      else continue;
      changed = true; merged++;
      break;
    }
  }
  html = html.replace(m[0], `var GROUPS = ${JSON.stringify(groups).replace(/</g, '\\u003c')};\n`);
}

// ── tint ──
const accent = config.palette?.captionAccent ?? config.palette?.accent;
if (accent) html = html.replace(/--cap-accent: [^;]+;/, `--cap-accent: ${accent};`);
if (config.palette?.captionInk) html = html.replace(/--cap-ink: [^;]+;/, `--cap-ink: ${config.palette.captionInk};`);

// ── script / direction ──
// fonts.script joins every caption font stack (Inter has no Arabic glyphs); an RTL voice
// (voice.lang ar | he | fa | ur) reads right-to-left, and letter-spacing breaks joined letters.
const script = config.fonts?.script;
if (script) html = html.replace(/font-family: ([^;]+);/g, (m, fam) => (fam.includes(script) ? m : `font-family: ${fam.replace(',', `, ${script},`)};`));
// system fonts need a local() face, like frame-kit's (the check fails without one)
if (script && !html.includes('/* script faces */'))
  html = html.replace('<style>', `<style>\n      /* script faces */ ${(script.match(/"[^"]+"/g) ?? []).map((q) => `@font-face { font-family: ${q}; src: local(${q}); font-weight: 100 900; }`).join(' ')}`);
if (/^(ar|he|fa|ur)\b/.test(config.voice?.lang ?? '') && !html.includes('/* rtl */'))
  html = html.replace('  .caption-group {', '  /* rtl */ .caption-group { direction: rtl; } .caption-group, .caption-word { letter-spacing: 0 !important; }\n  .caption-group {');

// ── moves / hides ──
const first = (n) => meta().voices.find((v) => v.frame === n)?.words[0]?.start ?? 0;
const moves = typeof config.captionMoves === 'function' ? config.captionMoves({ dur, cue, first }) : (config.captionMoves ?? []);
html = html.replace(/\n {4}\/\* caption-moves \*\/[\s\S]*?\/\* \/caption-moves \*\/\n/, '\n');
if (moves.length) {
  const stage = `document.querySelector('[data-composition-id="captions"] .caption-stage')`;
  const sets = moves.map((mv) => mv.hide
    ? `tl.set(${stage}, { autoAlpha: 0 }, ${mv.from.toFixed(3)});\n    tl.set(${stage}, { autoAlpha: 1 }, ${mv.to.toFixed(3)});`
    : `tl.set(${stage}, { x: ${mv.x ?? 0}, y: ${mv.y ?? 0} }, ${mv.from.toFixed(3)});\n    tl.set(${stage}, { x: 0, y: 0 }, ${mv.to.toFixed(3)});`).join('\n    ');
  html = html.replace('    window.__timelines["captions"] = tl;', `    /* caption-moves */\n    ${sets}\n    /* /caption-moves */\n    window.__timelines["captions"] = tl;`);
}
writeFileSync(p, html);
console.log(`✓ captions: ${merged} short group(s) merged, ${moves.length} move(s)${accent ? `, highlight ${accent}` : ''}`);
