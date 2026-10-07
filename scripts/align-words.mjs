// Script-aligned word timings. TTS without native timings (Kokoro, recovered files) gets its
// words from Whisper, which writes "25" for "twenty-five" and "Arrow" for "aro" — captions
// would show that and cue('aro') would miss. align() keeps the SCRIPT's words and takes the
// times from what was heard: LCS anchors on matching words, gaps share their time span.
import { readFileSync } from 'node:fs';

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** SCRIPT.md → [{ frame, text }] (4-space-indented lines under "## … (Frame N)"). */
export function scriptLines(path = 'SCRIPT.md') {
  const out = [];
  let frame = 0;
  for (const l of readFileSync(path, 'utf8').split('\n')) {
    const h = l.match(/^#{2,3} .*\(Frame (\d+)\)/i);
    if (h) frame = +h[1];
    else if (/^ {4}\S/.test(l) && frame) {
      const prev = out.find((x) => x.frame === frame);
      if (prev) prev.text += ` ${l.trim()}`; else out.push({ frame, text: l.trim() });
    }
  }
  return out;
}

export function align(scriptWords, heard) {
  const a = scriptWords.map(norm), b = heard.map((w) => norm(w.text));
  const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
    L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const pairs = [];
  for (let i = 0, j = 0; i < a.length && j < b.length;) {
    if (a[i] === b[j]) { pairs.push([i, j]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++;
  }
  const out = new Array(scriptWords.length);
  const fill = (i0, i1, t0, t1) => { // script words [i0,i1) share [t0,t1)
    const n = i1 - i0; if (n <= 0) return;
    const step = (t1 - t0) / n;
    for (let k = 0; k < n; k++) out[i0 + k] = { text: scriptWords[i0 + k], start: +(t0 + k * step).toFixed(3), end: +(t0 + (k + 1) * step).toFixed(3) };
  };
  let pi = 0, pj = 0;
  const end = heard.at(-1)?.end ?? 0;
  for (const [i, j] of [...pairs, [scriptWords.length, heard.length]]) {
    const t0 = pj < heard.length ? heard[pj].start : end, t1 = j < heard.length ? heard[j].start : end;
    fill(pi, i, t0, Math.max(t0, t1));
    if (i < scriptWords.length) out[i] = { text: scriptWords[i], start: heard[j].start, end: heard[j].end };
    pi = i + 1; pj = j + 1;
  }
  return out.map((w, k) => ({ id: `w${k}`, ...w }));
}

/** Align every voice in an audio_meta object to its SCRIPT.md line, in place. */
export function alignVoices(meta, path = 'SCRIPT.md') {
  const lines = scriptLines(path);
  for (const v of meta.voices ?? []) {
    const line = lines.find((l) => l.frame === v.frame);
    if (line && v.words?.length) v.words = align(line.text.split(/\s+/), v.words);
  }
  return meta;
}
