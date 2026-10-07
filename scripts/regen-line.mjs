// Re-take ONE Gemini line until the listener (listen.mjs's, against the script line) hears it right; keeps the take as
// NN.wav (trimmed like gemini-voice.mjs) and leaves the per-line cache key as is (same text/style).
// Run (cwd = project root): node regen-line.mjs <frame> <regex the transcript must also match, or .> [tries]
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

const [frame, must, tries = '4'] = process.argv.slice(2);
const key = process.env.GEMINI_API_KEY ?? execFileSync('security', ['find-generic-password', '-s', 'gemini-api-key', '-w'], { encoding: 'utf8' }).trim();
process.env.GEMINI_API_KEY = key;
const config = (await import(pathToFileURL(`${process.cwd()}/ad.config.mjs`).href)).default;
const { scriptLines } = await import('./align-words.mjs'); // this copy (a skill worktree stays isolated)
const { synthesizeGemini } = await import(`${homedir()}/.claude/skills/media-use/audio/scripts/lib/gemini-tts.mjs`);
const v = config.voice;
const written = scriptLines().find((l) => l.frame === +frame).text;
const text = process.env.TTS_TEXT ?? (v.saidAs ?? []).reduce((t, [re, to]) => t.replace(re, to), written); // TTS_TEXT: try a respelling first
const rel = `assets/voice/${String(frame).padStart(2, '0')}.wav`;
// The same listener as listen.mjs — it hears the take against the script line. A bare transcript
// passed a take as «إمتى» that the listener (and the critic after it) heard as «إنت».
const said = (v.saidAs ?? []).reduce((t, [re, to]) => t.replace(re, to), written);
const listen = async (f) => {
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `This is one line of a product ad voice-over. It is meant to say exactly: «${said}». Listen like a viewer hearing it once. Reply as JSON: {"heard": the exact transcript (English words in Latin letters, Arabic in Arabic script), "match": true if a viewer would hear the intended words (accent and numerals written as digits are fine), "issues": the words heard differently or unclearly, else ""}.` },
        { inline_data: { mime_type: 'audio/wav', data: readFileSync(f).toString('base64') } }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  try {
    const j = JSON.parse(((await r.json()).candidates?.[0]?.content?.parts ?? []).map((p) => p.text).join(''));
    return { heard: j.heard ?? '', match: j.match !== false, issues: j.issues ?? '' };
  } catch { return { heard: '', match: false, issues: 'no answer' }; }
};
// "A || B": each segment is its own take, joined with a 0.15s beat — an English brand at the START
// of an Arabic sentence was garbled 7 of 7 single takes; said alone, it reads.
const segs = text.split('||').map((x) => x.trim()).filter(Boolean);
const cut = (keep) => `silenceremove=start_periods=1:start_threshold=-50dB:start_silence=${keep}`;
const take = async (tmp) => {
  if (segs.length === 1) return synthesizeGemini({ text, voiceId: v.id, style: v.style, ...(v.model ? { model: v.model } : {}), wavAbs: `${process.cwd()}/${tmp}` });
  const parts = [];
  for (const [k, seg] of segs.entries()) {
    const p = tmp.replace(/\.wav$/, `.s${k}.wav`);
    // SEG<k>_STYLE overrides one segment's delivery: an English brand segment read with an Egyptian-
    // Arabic style came back garbled on the Pro model
    const r = await synthesizeGemini({ text: seg, voiceId: v.id, style: process.env[`SEG${k}_STYLE`] ?? v.style, ...(v.model ? { model: v.model } : {}), wavAbs: `${process.cwd()}/${p}` });
    if (!r.ok) return r;
    parts.push(p);
  }
  // trim each segment, then join with 0.15s of silence between them
  const inputs = parts.flatMap((p) => ['-i', p]);
  const chain = parts.map((_, k) => `[${k}:a]${cut(0.02)},areverse,${cut(0.02)},areverse,aresample=24000,aformat=channel_layouts=mono[a${k}]`).join(';');
  const gaps = parts.slice(1).map((_, k) => `aevalsrc=0:d=0.15:s=24000[g${k}]`).join(';');
  const seq = parts.map((_, k) => (k ? `[g${k - 1}][a${k}]` : `[a${k}]`)).join('');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${chain};${gaps};${seq}concat=n=${parts.length * 2 - 1}:v=0:a=1[out]`, '-map', '[out]', tmp]);
  parts.forEach((p) => rmSync(p));
  return { ok: true };
};
for (let i = 1; i <= +tries; i++) {
  const tmp = rel.replace(/\.wav$/, '.try.wav');
  const r = await take(tmp);
  if (!r.ok) { console.log(`try ${i}: TTS failed — ${String(r.error).slice(0, 160)}`); continue; }
  const { heard, match, issues } = await listen(tmp);
  const ok = match && new RegExp(must, 'i').test(heard);
  console.log(`try ${i}: ${ok ? 'OK ' : 'no '} ${heard}${issues ? ` (${issues})` : ''}`);
  if (ok) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', tmp, '-af', `${cut(0.08)},areverse,${cut(0.12)},areverse`, rel]);
    rmSync(tmp); rmSync(rel.replace(/\.wav$/, '.raw.wav'), { force: true }); // the old raw = the garbled take
    // the take archive (gemini-voice.mjs) restores a line by its key — archive the retake under it,
    // or the next TTS pass would bring the rejected take back
    mkdirSync('.hyperframes/takes', { recursive: true });
    copyFileSync(rel, `.hyperframes/takes/${createHash('sha1').update(JSON.stringify([said, v.id, v.style ?? '', v.model ?? ''])).digest('hex').slice(0, 12)}.wav`);
    console.log(`kept → ${rel}`); process.exit(0);
  }
  rmSync(tmp);
}
console.log('no take passed'); process.exit(1);
