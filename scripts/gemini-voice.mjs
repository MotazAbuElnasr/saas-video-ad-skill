// Gemini TTS for every SCRIPT line — one request at a time, honouring the API's "retry in Ns"
// (the free tier allows 3 requests a minute: the engine's parallel batch got 429s for all but
// the first). Writes assets/voice/NN.wav; recover-voice.mjs then turns the wavs into
// script-aligned timings (Gemini returns no word times). Called by voice.mjs for provider 'gemini'.
// Per-line cache (.hyperframes/gemini-lines.json): a line whose text/voice/style/model is unchanged
// and whose wav exists is not re-bought — a run that dies mid-way (402: prepaid credits ran out)
// resumes where it stopped.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { scriptLines } from './align-words.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CACHE = '.hyperframes/gemini-lines.json';
// Gemini wraps each take in 0.2–0.5s of silence, different every take — trimmed to a fixed
// 0.08s lead / 0.12s tail so pads() alone place a line (a 0.5s lead-in made "Breathe" land 1s
// late). Idempotent: an already-trimmed take comes out the same.
const trim = (rel) => {
  const tmp = rel.replace(/\.wav$/, '.trim.wav');
  const cut = (keep) => `silenceremove=start_periods=1:start_threshold=-50dB:start_silence=${keep}`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', rel, '-af', `${cut(0.08)},areverse,${cut(0.12)},areverse`, tmp]);
  renameSync(tmp, rel);
};

export async function geminiLines({ id, style, model, saidAs = [] }) {
  const { synthesizeGemini } = await import(`${homedir()}/.claude/skills/media-use/audio/scripts/lib/gemini-tts.mjs`);
  mkdirSync('assets/voice', { recursive: true });
  const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
  for (const { frame, text: written } of scriptLines()) {
    // saidAs: TTS-only respellings (aro → arrow); captions and cue() keep the SCRIPT's words
    const text = saidAs.reduce((t, [re, to]) => t.replace(re, to), written);
    const rel = `assets/voice/${String(frame).padStart(2, '0')}.wav`;
    const key = createHash('sha1').update(JSON.stringify([text, id, style ?? '', model ?? ''])).digest('hex').slice(0, 12);
    // .raw.wav: pad-voices pads NN.wav in place — the cached take is the raw file, if present
    if (cache[frame] === key && existsSync(rel)) {
      if (existsSync(rel.replace(/\.wav$/, '.raw.wav'))) writeFileSync(rel, readFileSync(rel.replace(/\.wav$/, '.raw.wav')));
      trim(rel);
      console.log(`  voice ${frame}: cached`);
      continue;
    }
    for (let attempt = 1; ; attempt++) {
      const r = await synthesizeGemini({ text, voiceId: id, style, ...(model ? { model } : {}), wavAbs: `${process.cwd()}/${rel}` });
      if (r.ok) {
        rmSync(rel.replace(/\.wav$/, '.raw.wav'), { force: true }); // stale raw = the previous voice
        trim(rel);
        console.log(`  voice ${frame}: gemini ${id}`); cache[frame] = key; writeFileSync(CACHE, JSON.stringify(cache, null, 2)); break;
      }
      const msg = String(r.error ?? '');
      if (/402|prepayment credits/i.test(msg)) throw new Error('gemini-voice: the API project is out of prepaid credits — top up at https://ai.studio/projects (Billing), then re-run');
      const wait = /429|rate limit/i.test(msg) ? (+(msg.match(/retry in (\d+)s/i)?.[1] ?? 20) + 1) : 0;
      if (!wait || attempt >= 8) throw new Error(`gemini-voice: line ${frame} failed — ${msg.slice(0, 300)}`);
      console.log(`  voice ${frame}: rate-limited, waiting ${wait}s`);
      await sleep(wait * 1000);
    }
  }
}
