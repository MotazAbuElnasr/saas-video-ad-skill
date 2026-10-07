// A listener for every voice line: Gemini hears the take and says whether it matches what was
// meant to be said (the SCRIPT line after voice.saidAs). Whisper wrote "no crash" for "no clash" and
// can't spell an English brand inside Arabic; a listener that compares against the script can.
// Cached per take (sha1 of the wav) in .hyperframes/listen.json; the critic reads it ("heard").
// Needs a Gemini key (env or the keychain item voice.keychain / "gemini-api-key"); skips without.
// Run (cwd = project root): node <skill>/scripts/listen.mjs   (voice.mjs runs it after TTS)
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { scriptLines } from './align-words.mjs';

const config = (await import(pathToFileURL(resolve('ad.config.mjs')).href)).default;
const v = config.voice ?? {};
let key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
try { key ??= execFileSync('security', ['find-generic-password', '-s', v.keychain ?? 'gemini-api-key', '-w'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* no key */ }
if (!key) { console.log('  listen: no Gemini key — skipped'); process.exit(0); }

const CACHE = '.hyperframes/listen.json';
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const out = {};
for (const { frame, text: written } of scriptLines()) {
  const said = (v.saidAs ?? []).reduce((t, [re, to]) => t.replace(re, to), written);
  const n = String(frame).padStart(2, '0');
  const wav = existsSync(`assets/voice/${n}.raw.wav`) ? `assets/voice/${n}.raw.wav` : `assets/voice/${n}.wav`;
  if (!existsSync(wav)) continue;
  const data = readFileSync(wav);
  const id = createHash('sha1').update(data).update(said).digest('hex').slice(0, 12);
  if (cache[frame]?.id === id) { out[frame] = cache[frame]; continue; }
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.LISTEN_MODEL ?? 'gemini-3.8-flash'}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [
        { text: `This is one line of a product ad voice-over. It is meant to say exactly: «${said}». Listen like a viewer hearing it once. Reply as JSON: {"heard": the exact transcript (English words in Latin letters, Arabic in Arabic script), "match": true if a viewer would hear the intended words (accent and numerals written as digits are fine), "issues": the words heard differently or unclearly, else ""}.` },
        { inline_data: { mime_type: 'audio/wav', data: data.toString('base64') } }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  if (!r.ok) { console.log(`  listen ${n}: HTTP ${r.status} — skipped`); continue; }
  const j = await r.json();
  let res;
  try { res = JSON.parse((j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text).join('')); } catch { continue; }
  out[frame] = { id, said, heard: res.heard ?? '', match: res.match !== false, issues: res.issues ?? '' };
  console.log(`  listen ${n}: ${out[frame].match ? 'ok' : 'MISMATCH'} — ${out[frame].heard}${out[frame].issues ? ` (${out[frame].issues})` : ''}`);
}
writeFileSync(CACHE, JSON.stringify(out, null, 2));
