// Gemini TTS for every SCRIPT line — one request at a time, honouring the API's "retry in Ns"
// (the free tier allows 3 requests a minute: the engine's parallel batch got 429s for all but
// the first). Writes assets/voice/NN.wav; recover-voice.mjs then turns the wavs into
// script-aligned timings (Gemini returns no word times). Called by voice.mjs for provider 'gemini'.
// Per-line cache (.hyperframes/gemini-lines.json): a line whose text/voice/style/model is unchanged
// and whose wav exists is not re-bought — a run that dies mid-way (402: prepaid credits ran out)
// resumes where it stopped.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { scriptLines } from './align-words.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CACHE = '.hyperframes/gemini-lines.json';
const TAKES = '.hyperframes/takes';
// Gemini wraps each take in 0.2–0.5s of silence, different every take — trimmed to a fixed
// 0.08s lead / 0.12s tail so pads() alone place a line (a 0.5s lead-in made "Breathe" land 1s
// late). Idempotent: an already-trimmed take comes out the same.
const trim = (rel) => {
  const tmp = rel.replace(/\.wav$/, '.trim.wav');
  const cut = (keep) => `silenceremove=start_periods=1:start_threshold=-50dB:start_silence=${keep}`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', rel, '-af', `${cut(0.08)},areverse,${cut(0.12)},areverse`, tmp]);
  renameSync(tmp, rel);
};

// Retry on the API's "retry in …": a short wait is retried; the DAILY cap ("retry in 13h5m14s",
// 100/day on Tier 1) stops at once, naming the reset; a dropped connection gets a short retry.
async function withRetry(label, call) {
  for (let attempt = 1; ; attempt++) {
    const r = await call();
    if (r.ok) return r;
    const msg = String(r.error ?? '');
    if (/402|prepayment credits/i.test(msg)) throw new Error('gemini-voice: the API project is out of prepaid credits — top up at https://ai.studio/projects (Billing), then re-run');
    const m = msg.match(/retry in (?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?/i);
    const secs = m ? (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + (+(m[3] ?? 0)) : 20;
    if (/429|rate limit/i.test(msg) && secs > 120)
      throw new Error(`gemini-voice: the Gemini TTS quota is used up (${msg.match(/limit: [^).]*/i)?.[0] ?? 'rate limit'}) — it resets in ${Math.round(secs / 3600)}h; upgrade the tier at https://ai.dev/rate-limit or re-run later`);
    const wait = /429|rate limit/i.test(msg) ? Math.ceil(secs) + 1 : /fetch failed|ECONNRESET|ETIMEDOUT|socket|network|HTTP 5\d\d|timed? ?out|aborted/i.test(msg) ? 3 * attempt : 0;
    if (!wait || attempt >= 8) throw new Error(`gemini-voice: ${label} failed — ${msg.slice(0, 300)}`);
    console.log(`  voice ${label}: rate-limited, waiting ${wait}s`);
    await sleep(wait * 1000);
  }
}

// One request for the lines that have no take yet, cut at its pauses (user: "better to get one voice
// request then cut it"): one quota hit per ad instead of one per line — the 100/day cap is shared by
// every session on the key and ran out mid-ad — and one consistent read. The lines go in as
// paragraphs with a pause asked for between them; the take is cut in the middle of its N−1 longest
// silences. False when those pauses don't clearly separate the lines (each ≥ 0.45s) — the caller
// then voices line by line.
async function wholeTake(lines, { id, style, model }, synthesizeGemini) {
  const all = 'assets/voice/script.wav';
  const text = lines.map((l) => l.text).join('\n\n');
  const paced = `${style ?? ''} Leave a clear pause of about one second between paragraphs.`.trim();
  await withRetry('script', () => synthesizeGemini({ text, voiceId: id, style: paced, ...(model ? { model } : {}), wavAbs: `${process.cwd()}/${all}` }));
  const total = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', all], { encoding: 'utf8' });
  const log = spawnSync('ffmpeg', ['-hide_banner', '-i', all, '-af', 'silencedetect=noise=-40dB:d=0.25', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((x) => +x[1]);
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((x) => +x[1]);
  const gaps = starts.map((st, i) => ({ st, en: ends[i] ?? total })).filter((g) => g.st > 0.05 && g.en < total - 0.05);
  const picked = [...gaps].sort((x, y) => (y.en - y.st) - (x.en - x.st)).slice(0, lines.length - 1);
  if (picked.length < lines.length - 1 || picked.some((g) => g.en - g.st < 0.45)) return false;
  const cuts = [0, ...picked.sort((x, y) => x.st - y.st).map((g) => (g.st + g.en) / 2), total];
  lines.forEach((l, k) => {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', all, '-ss', cuts[k].toFixed(3), '-to', cuts[k + 1].toFixed(3), l.rel]);
    rmSync(l.rel.replace(/\.wav$/, '.raw.wav'), { force: true }); // stale raw = the previous voice
    trim(l.rel);
    writeFileSync(l.take, readFileSync(l.rel));
  });
  return true;
}

export async function geminiLines({ id, style, model, saidAs = [], perLine = false }) {
  const { synthesizeGemini } = await import(`${homedir()}/.claude/skills/media-use/audio/scripts/lib/gemini-tts.mjs`);
  mkdirSync('assets/voice', { recursive: true });
  mkdirSync(TAKES, { recursive: true });
  const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
  const save = () => writeFileSync(CACHE, JSON.stringify(cache, null, 2));
  const lines = scriptLines().map(({ frame, text: written }) => {
    // saidAs: TTS-only respellings (aro → arrow); captions and cue() keep the SCRIPT's words
    const text = saidAs.reduce((t, [re, to]) => t.replace(re, to), written);
    const rel = `assets/voice/${String(frame).padStart(2, '0')}.wav`;
    const key = createHash('sha1').update(JSON.stringify([text, id, style ?? '', model ?? ''])).digest('hex').slice(0, 12);
    // Every take is archived by its key (.hyperframes/takes/<key>.wav): trying another model or style
    // never loses the old voice — switching back restores it free (a Pro-model experiment overwrote
    // the approved takes, and "every cut has its own voice" could only be undone by re-buying them).
    return { frame, text, rel, key, take: `${TAKES}/${key}.wav` };
  });
  const todo = [];
  for (const l of lines) {
    if (existsSync(l.take)) {
      writeFileSync(l.rel, readFileSync(l.take));
      if (cache[l.frame] !== l.key) { cache[l.frame] = l.key; save(); }
      rmSync(l.rel.replace(/\.wav$/, '.raw.wav'), { force: true }); // pad-voices re-makes the raw from this take
      console.log(`  voice ${l.frame}: cached`);
    } else if (cache[l.frame] === l.key && existsSync(l.rel)) {
      // .raw.wav: pad-voices pads NN.wav in place — the cached take is the raw file, if present
      if (existsSync(l.rel.replace(/\.wav$/, '.raw.wav'))) writeFileSync(l.rel, readFileSync(l.rel.replace(/\.wav$/, '.raw.wav')));
      trim(l.rel);
      writeFileSync(l.take, readFileSync(l.rel)); // archive takes made before the archive existed
      console.log(`  voice ${l.frame}: cached`);
    } else todo.push(l);
  }
  // voice.perLine: one request per line (a retake of a single line goes through regen-line.mjs)
  if (!perLine && todo.length > 1) {
    if (await wholeTake(todo, { id, style, model }, synthesizeGemini)) {
      for (const l of todo) cache[l.frame] = l.key;
      save();
      console.log(`  voice: one take for ${todo.length} lines, cut at its pauses (gemini ${id})`);
      return;
    }
    console.log("  voice: the take's pauses did not separate the lines — voicing line by line");
  }
  for (const l of todo) {
    await withRetry(`line ${l.frame}`, () => synthesizeGemini({ text: l.text, voiceId: id, style, ...(model ? { model } : {}), wavAbs: `${process.cwd()}/${l.rel}` }));
    rmSync(l.rel.replace(/\.wav$/, '.raw.wav'), { force: true }); // stale raw = the previous voice
    trim(l.rel);
    writeFileSync(l.take, readFileSync(l.rel));
    console.log(`  voice ${l.frame}: gemini ${id}`); cache[l.frame] = l.key; save();
  }
}
