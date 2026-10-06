// Pads voice lines so the voice serves the footage. Two uses, both from real feedback:
//   lead — silence before a line so it lands just AFTER the on-screen event it names
//          ("Over by an hour" must not be said before the meter turns red);
//   tail — a hold after a payoff line ("Done." cut too fast to read).
// ORDER: TTS → fetch-sfx → THIS → sync-durations. fetch-sfx rewrites audio_meta.json and
// drops the `padded` record; re-run with --meta-only to restore it without re-padding wavs.
// Idempotent per frame (audio_meta.json → padded).
// Run (cwd = project root): node <skill>/scripts/pad-voices.mjs [--meta-only]
import { execFileSync } from 'node:child_process';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { config, marks } from './timing.mjs';

const META_ONLY = process.argv.includes('--meta-only');
const meta = JSON.parse(readFileSync('audio_meta.json', 'utf8'));
meta.padded ??= {};
const v = (n) => meta.voices.find((x) => x.frame === n);

// config.pads gets raw (unpadded) facts: duration + first word start per frame.
const raw = {
  dur: (n) => v(n).duration_s - (meta.padded[n]?.lead ?? 0) - (meta.padded[n]?.tail ?? 0),
  firstWord: (n) => v(n).words[0].start - (meta.padded[n]?.lead ?? 0),
  marks,
};
for (const { frame: n, lead = 0, tail = 0 } of config.pads?.(raw) ?? []) {
  if (meta.padded[n]) { console.log(`· voice ${n}: already padded`); continue; }
  const f = v(n).path;
  const af = [lead > 0 && `adelay=${Math.round(lead * 1000)}:all=1`, tail > 0 && `apad=pad_dur=${tail}`].filter(Boolean).join(',');
  if (!af) continue;
  if (!META_ONLY) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', f, '-af', af, `${f}.tmp.wav`]);
    renameSync(`${f}.tmp.wav`, f);
  }
  v(n).duration_s = +(v(n).duration_s + lead + tail).toFixed(3);
  for (const w of v(n).words) { w.start += lead; w.end += lead; }
  meta.padded[n] = { lead: +lead.toFixed(3), tail };
  console.log(`✓ voice ${n}: lead ${lead.toFixed(2)}s, tail ${tail}s → ${v(n).duration_s}s`);
}
writeFileSync('audio_meta.json', JSON.stringify(meta, null, 2));
