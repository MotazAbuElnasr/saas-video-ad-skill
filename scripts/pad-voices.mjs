// Normalises every voice (raw audio, script-aligned words), then pads it so the voice serves the footage. Two uses, both from real feedback:
//   lead — silence before a line so it lands just AFTER the on-screen event it names
//          ("Over by an hour" must not be said before the meter turns red);
//   tail — a hold after a payoff line ("Done." cut too fast to read).
// The raw TTS file is kept as NN.raw.wav and every run re-pads FROM it, so changing a pad
// is free and never needs new (paid) TTS. Word times in audio_meta.json are re-based the same way.
// ORDER: TTS → fetch-sfx → THIS → sync-durations (fetch-sfx rewrites audio_meta.json).
// Run (cwd = project root): node <skill>/scripts/pad-voices.mjs
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { alignVoices } from './align-words.mjs';
import { config, marks } from './timing.mjs';

const meta = JSON.parse(readFileSync('audio_meta.json', 'utf8'));
// No pad record = fresh TTS (or recover-voice): the voice files ARE raw — refresh NN.raw.wav
// from them, or a stale raw from the previous voice would be re-padded over the new one.
const fresh = meta.padded == null;
const prev = meta.padded ?? {};
const v = (n) => meta.voices.find((x) => x.frame === n);
const dur = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim();

// Normalise every voice back to raw: raw wav on disk, word times without the previous lead.
for (const voice of meta.voices) {
  const p = prev[voice.frame] ?? prev[String(voice.frame)];
  const raw = voice.path.replace(/\.wav$/, '.raw.wav');
  if (fresh || !existsSync(raw)) {
    if (p && (p.lead || p.tail)) {
      // Padded before raw copies existed: cut the recorded pads back off.
      const d = dur(voice.path);
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(p.lead ?? 0), '-t', String(d - (p.lead ?? 0) - (p.tail ?? 0)), '-i', voice.path, raw]);
    } else copyFileSync(voice.path, raw);
  }
  if (p?.lead) for (const w of voice.words) { w.start -= p.lead; w.end -= p.lead; }
  voice.duration_s = +dur(raw).toFixed(3);
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
const word = (n, w, nth = 0) => {
  const hit = v(n).words.filter((x) => norm(x.text) === norm(w))[nth];
  if (!hit) throw new Error(`pad-voices: "${w}" is not spoken in frame ${n}`);
  return hit.start;
};
// word(n, w): raw start of a word — aim a lead so THAT word lands on the event it names.
// Captions and cues use the SCRIPT's words, whatever the engine heard (Whisper: "Arrow", "25").
alignVoices(meta);
const raw = { dur: (n) => v(n).duration_s, firstWord: (n) => v(n).words[0].start, word, marks };
const want = new Map((config.pads?.(raw) ?? []).map((p) => [p.frame, { lead: Math.max(0, p.lead ?? 0), tail: Math.max(0, p.tail ?? 0) }]));
meta.padded = {};
for (const voice of meta.voices) {
  const { lead = 0, tail = 0 } = want.get(voice.frame) ?? {};
  const rawPath = voice.path.replace(/\.wav$/, '.raw.wav');
  const af = [lead > 0 && `adelay=${Math.round(lead * 1000)}:all=1`, tail > 0 && `apad=pad_dur=${tail}`].filter(Boolean).join(',');
  if (af) execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', rawPath, '-af', af, voice.path]);
  else copyFileSync(rawPath, voice.path);
  voice.duration_s = +(voice.duration_s + lead + tail).toFixed(3);
  for (const w of voice.words) { w.start += lead; w.end += lead; }
  if (lead || tail) {
    meta.padded[voice.frame] = { lead: +lead.toFixed(3), tail };
    console.log(`✓ voice ${voice.frame}: lead ${lead.toFixed(2)}s, tail ${tail}s → ${voice.duration_s}s`);
  }
}
writeFileSync('audio_meta.json', JSON.stringify(meta, null, 2));
