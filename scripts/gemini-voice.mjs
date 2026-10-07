// Gemini TTS for the SCRIPT. Writes assets/voice/NN.wav; recover-voice.mjs then turns the wavs into
// script-aligned timings (Gemini returns no word times). Called by voice.mjs for provider 'gemini'.
//
// ONE performance by default: the whole script in one request, cut into lines at its paragraph
// pauses (user: "better to get one voice request then cut it"). Line-by-line requests gave every
// line its own performance ("every cut has its own voice") and spent one request per line of a
// 100/day cap shared by every session on the key. voice.perLine: one request per line instead
// (a single line is retaken with regen-line.mjs either way).
//
// Every take is archived by its key (.hyperframes/takes/<key>.wav) — trying another model or style
// never loses the approved voice, and switching back restores it free. One request at a time,
// honouring "retry in Ns"; a long wait is the DAILY cap and stops at once with the reset time.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { homedir } from 'node:os';
import { align, scriptLines } from './align-words.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CACHE = '.hyperframes/gemini-lines.json';
const TAKES = '.hyperframes/takes';
const sha = (x) => createHash('sha1').update(JSON.stringify(x)).digest('hex').slice(0, 12);
const probe = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' });
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

// Where to cut a whole-script take into its lines: Whisper word times aligned to the script give an
// expected boundary between line k's last word and line k+1's first; it snaps to the longest pause
// near it. "The N−1 longest pauses" alone failed: a colon or a comma inside a line can pause longer
// than a paragraph break (a 0.43s break lost to a 0.38s comma pause by a hair).
export function splitPoints(full, lineWords, lang = 'en') {
  // silencedetect logs to STDERR (reading stdout found no pauses at all: every cut was a guess)
  const silences = parseSilences(spawnSync('ffmpeg', ['-hide_banner', '-i', full, '-af', 'silencedetect=noise=-38dB:d=0.12', '-f', 'null', '-'], { encoding: 'utf8' }).stderr);
  const end = probe(full);
  // Whisper reads 30s windows and its word times drift past one (a 32.7s take put line 6's first
  // sentence in line 5): transcribe in chunks under 28s, each cut at its longest pause after 14s.
  const heard = [];
  for (let a = 0; a < end - 0.05;) {
    const p = end - a > 28 ? silences.filter((s) => s.start > a + 14 && s.end < a + 28).sort((x, y) => (y.end - y.start) - (x.end - x.start))[0] : null;
    const b = end - a > 28 ? (p ? (p.start + p.end) / 2 : a + 28) : end;
    const chunk = `${dirname(full)}/chunk.wav`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', full, '-ss', String(a), '-to', String(b), '-c:a', 'pcm_s16le', chunk]);
    execFileSync('npx', ['hyperframes', 'transcribe', chunk, '--json', '-m', lang === 'en' ? 'small.en' : 'small', ...(lang === 'en' ? [] : ['--language', lang])], { stdio: ['ignore', 'pipe', 'ignore'] });
    heard.push(...JSON.parse(readFileSync(`${dirname(full)}/transcript.json`, 'utf8')).map((w) => ({ ...w, start: w.start + a, end: w.end + a })));
    a = b;
  }
  return splitFrom(align(lineWords.flat(), heard), lineWords, silences);
}
export const parseSilences = (log) => {
  const out = [], starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  [...log.matchAll(/silence_end: ([\d.]+)/g)].forEach((m, i) => starts[i] != null && out.push({ start: starts[i], end: +m[1] }));
  return out;
};
export function splitFrom(al, lineWords, silences) {
  const cuts = [];
  let idx = 0, prev = 0;
  for (let k = 0; k < lineWords.length - 1; k++) {
    idx += lineWords[k].length;
    const t = (al[idx - 1].end + al[idx].start) / 2;
    // the pause between two lines is the LONGEST one near the expected boundary (Whisper's word ends
    // run late — "nearest" picked the pause's tail and cut 0.3s late, at the next line's onset)
    const near = silences.map((s) => ({ c: (s.start + s.end) / 2, len: s.end - s.start }))
      .filter((s) => s.c > prev + 0.2 && Math.abs(s.c - t) < 0.9)
      .sort((a, b) => b.len - a.len || Math.abs(a.c - t) - Math.abs(b.c - t))[0];
    if (!near) console.log(`  voice: no pause near the line ${k + 1}|${k + 2} boundary — cut on the words (the listener checks it)`);
    prev = near ? near.c : Math.max(t, prev + 0.2);
    cuts.push(+prev.toFixed(3));
  }
  return cuts;
}

// recut: cut the cached whole-script take again (free, no request) — after a bad split (the
// listener FAILs a line holding its neighbour's words) or a cutter fix. Deleting takes by hand
// didn't work: the archive-once step below re-archived the old cuts from assets/voice.
export async function geminiLines({ id, style, model, saidAs = [], perLine = false, lang = 'en' }, { recut = false } = {}) {
  const { synthesizeGemini } = await import(`${homedir()}/.claude/skills/media-use/audio/scripts/lib/gemini-tts.mjs`);
  mkdirSync('assets/voice', { recursive: true });
  mkdirSync(TAKES, { recursive: true });
  const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
  const save = () => writeFileSync(CACHE, JSON.stringify(cache, null, 2));
  const lines = scriptLines().map(({ frame, text: written }) => {
    // saidAs: TTS-only respellings (aro → arrow); captions and cue() keep the SCRIPT's words
    const text = saidAs.reduce((t, [re, to]) => t.replace(re, to), written);
    const rel = `assets/voice/${String(frame).padStart(2, '0')}.wav`;
    const key = sha([text, id, style ?? '', model ?? '']); // regen-line.mjs archives a retake under the same key
    return { frame, written, text, rel, key, take: `${TAKES}/${key}.wav` };
  });
  if (recut && !perLine) for (const l of lines) rmSync(l.take, { force: true });
  const todo = [];
  for (const l of lines) {
    if (existsSync(l.take)) {
      writeFileSync(l.rel, readFileSync(l.take));
      if (cache[l.frame] !== l.key) { cache[l.frame] = l.key; save(); }
      rmSync(l.rel.replace(/\.wav$/, '.raw.wav'), { force: true }); // pad-voices re-makes the raw from this take
      console.log(`  voice ${l.frame}: cached`);
    } else if (!recut && cache[l.frame] === l.key && existsSync(l.rel)) {
      // .raw.wav: pad-voices pads NN.wav in place — the cached take is the raw file, if present
      if (existsSync(l.rel.replace(/\.wav$/, '.raw.wav'))) writeFileSync(l.rel, readFileSync(l.rel.replace(/\.wav$/, '.raw.wav')));
      trim(l.rel);
      writeFileSync(l.take, readFileSync(l.rel)); // archive takes made before the archive existed
      console.log(`  voice ${l.frame}: cached`);
    } else todo.push(l);
  }
  if (!todo.length) return;

  if (!perLine && lines.length > 1) {
    // The WHOLE script, not only the missing lines: one performance across the ad (an edited line
    // re-voices every line, still one request — to keep approved lines, retake just the edited one
    // with regen-line.mjs). The full take is archived by its text: a recut is free.
    const text = lines.map((l) => l.text).join('\n\n');
    const paced = `${style ?? ''} This is one continuous voice-over: keep the same voice, pace and energy throughout. Leave a clear pause of about one second between paragraphs.`.trim();
    const full = `${TAKES}/script-${sha([text, id, style ?? '', model ?? ''])}.wav`;
    if (!existsSync(full)) {
      await withRetry('script', () => synthesizeGemini({ text, voiceId: id, style: paced, ...(model ? { model } : {}), wavAbs: `${process.cwd()}/${full}` }));
      console.log(`  voice: one take of the whole script (gemini ${id})`);
    } else console.log('  voice: whole-script take cached');
    const cuts = splitPoints(full, lines.map((l) => l.written.split(/\s+/).filter(Boolean)), lang);
    const at = [0, ...cuts, probe(full)];
    lines.forEach((l, k) => {
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', full, '-ss', at[k].toFixed(3), '-to', at[k + 1].toFixed(3), '-c:a', 'pcm_s16le', l.rel]);
      rmSync(l.rel.replace(/\.wav$/, '.raw.wav'), { force: true }); // stale raw = the previous voice
      trim(l.rel);
      writeFileSync(l.take, readFileSync(l.rel));
      cache[l.frame] = l.key;
      console.log(`  voice ${l.frame}: cut ${at[k].toFixed(2)}–${at[k + 1].toFixed(2)}s`);
    });
    save();
    return;
  }
  for (const l of todo) {
    await withRetry(`line ${l.frame}`, () => synthesizeGemini({ text: l.text, voiceId: id, style, ...(model ? { model } : {}), wavAbs: `${process.cwd()}/${l.rel}` }));
    rmSync(l.rel.replace(/\.wav$/, '.raw.wav'), { force: true }); // stale raw = the previous voice
    trim(l.rel);
    writeFileSync(l.take, readFileSync(l.rel));
    console.log(`  voice ${l.frame}: gemini ${id}`); cache[l.frame] = l.key; save();
  }
}
