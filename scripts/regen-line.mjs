// Re-take ONE Gemini line until a listener (Gemini, audio in) hears the brand; keeps the take as
// NN.wav (trimmed like gemini-voice.mjs) and leaves the per-line cache key as is (same text/style).
// Run (cwd = project root): node regen-line.mjs <frame> <regex the transcript must match> [tries]
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

const [frame, must, tries = '4'] = process.argv.slice(2);
const key = process.env.GEMINI_API_KEY ?? execFileSync('security', ['find-generic-password', '-s', 'gemini-api-key', '-w'], { encoding: 'utf8' }).trim();
process.env.GEMINI_API_KEY = key;
const config = (await import(pathToFileURL(`${process.cwd()}/ad.config.mjs`).href)).default;
const { scriptLines } = await import(`${homedir()}/.claude/skills/saas-video-ad/scripts/align-words.mjs`);
const { synthesizeGemini } = await import(`${homedir()}/.claude/skills/media-use/audio/scripts/lib/gemini-tts.mjs`);
const v = config.voice;
const written = scriptLines().find((l) => l.frame === +frame).text;
const text = process.env.TTS_TEXT ?? (v.saidAs ?? []).reduce((t, [re, to]) => t.replace(re, to), written); // TTS_TEXT: try a respelling first
const rel = `assets/voice/${String(frame).padStart(2, '0')}.wav`;
const listen = async (f) => {
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: 'Transcribe this ad voice-over line exactly as spoken. Arabic words in Arabic script, English words in Latin letters as they sound. Output only the transcript.' }, { inline_data: { mime_type: 'audio/wav', data: readFileSync(f).toString('base64') } }] }] }),
  });
  const j = await r.json();
  return (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text).join('').trim();
};
// "A || B": each segment is its own take, joined with a 0.15s beat — an English brand at the START
// of an Arabic sentence was garbled 7 of 7 single takes; said alone, it reads.
const segs = text.split('||').map((x) => x.trim()).filter(Boolean);
const cut = (keep) => `silenceremove=start_periods=1:start_threshold=-50dB:start_silence=${keep}`;
const take = async (tmp) => {
  if (segs.length === 1) return synthesizeGemini({ text, voiceId: v.id, style: v.style, wavAbs: `${process.cwd()}/${tmp}` });
  const parts = [];
  for (const [k, seg] of segs.entries()) {
    const p = tmp.replace(/\.wav$/, `.s${k}.wav`);
    const r = await synthesizeGemini({ text: seg, voiceId: v.id, style: v.style, wavAbs: `${process.cwd()}/${p}` });
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
  const heard = await listen(tmp);
  const ok = new RegExp(must, 'i').test(heard);
  console.log(`try ${i}: ${ok ? 'OK ' : 'no '} ${heard}`);
  if (ok) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', tmp, '-af', `${cut(0.08)},areverse,${cut(0.12)},areverse`, rel]);
    rmSync(tmp); rmSync(rel.replace(/\.wav$/, '.raw.wav'), { force: true }); // the old raw = the garbled take
    console.log(`kept → ${rel}`); process.exit(0);
  }
  rmSync(tmp);
}
console.log('no take passed'); process.exit(1);
