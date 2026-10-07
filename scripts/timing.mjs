// Single source of timing for every script. Run all scripts with cwd = the HyperFrames
// project root. Frame durations and word cues come from audio_meta.json (TTS word
// timestamps), so changing the voice (speed, wording) re-times every overlay, ring and
// footage cut automatically. Footage facts come from the project's ad.config.mjs.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const cfgPath = resolve('ad.config.mjs');
if (!existsSync(cfgPath)) throw new Error('timing: no ad.config.mjs in the project root (copy templates/ad.config.mjs)');
export const config = (await import(pathToFileURL(cfgPath).href)).default;

export const meta = () => JSON.parse(readFileSync('audio_meta.json', 'utf8'));
const voice = (n, m = meta()) => {
  const v = m.voices.find((x) => x.frame === n);
  if (!v) throw new Error(`timing: no voice for frame ${n}`);
  return v;
};

/** Frame n's duration in seconds (its voice line, including any pads). */
export const dur = (n) => +voice(n).duration_s.toFixed(3);

/** Start time (frame-local) of the nth occurrence of `word` in frame n's line. */
export function cue(n, word, nth = 0) {
  const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, '');
  const hits = voice(n).words.filter((w) => norm(w.text) === norm(word));
  if (!hits[nth]) throw new Error(`timing: "${word}" is not spoken in frame ${n}`);
  return +hits[nth].start.toFixed(2);
}

/** Source-clip facts measured with cuts.sh (seconds), e.g. { drop: 3.92 }. */
export const marks = config.marks ?? {};

/** The helpers every config callback receives. */
export const kit = { dur, cue, marks, config };
