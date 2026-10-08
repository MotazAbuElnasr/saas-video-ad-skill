// Rebuild audio_meta.json voices from voice files already on disk — free, local.
// For when TTS can't be re-run (quota hit, provider down) but assets/voice/NN.wav exist:
// Whisper (hyperframes transcribe) gives word timings; align-words.mjs maps them onto the
// KNOWN script words, so cue() and captions keep the script's words. Keeps bgm/sfx.
// Run (cwd = project root): node <skill>/scripts/recover-voice.mjs   then pad-voices + sync-durations.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { align, scriptLines } from './align-words.mjs';

const dur = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim();

const meta = existsSync('audio_meta.json') ? JSON.parse(readFileSync('audio_meta.json', 'utf8')) : { bgm: null, sfx: [] };
meta.voices = [];
for (const { frame: f, text } of scriptLines()) {
  const path = `assets/voice/${String(f).padStart(2, '0')}.wav`;
  if (!existsSync(path)) throw new Error(`recover-voice: missing ${path}`);
  // NN.raw.wav is the unpadded take: put it back first. Run over padded NN.wav, the next pad pass
  // took them for fresh raws and padded every line twice (a 0.4s lead + 1.8s tail baked into the CTA).
  const raw = path.replace(/\.wav$/, '.raw.wav');
  if (existsSync(raw)) writeFileSync(path, readFileSync(raw));
  // VOICE_LANG (voice.lang): English gets the English model (small: base.en's word starts ran
  // ~0.3s late — the subtitle highlight lagged); any other language the multilingual one, told
  // the language (Whisper's English model can't hear Arabic).
  const lang = process.env.VOICE_LANG ?? 'en';
  execFileSync('npx', ['hyperframes', 'transcribe', path, '--json', '-m', lang === 'en' ? 'small.en' : 'small', ...(lang === 'en' ? [] : ['--language', lang])], { stdio: ['ignore', 'pipe', 'ignore'] });
  const heard = JSON.parse(readFileSync('assets/voice/transcript.json', 'utf8'));
  const words = align(text.split(/\s+/), heard);
  meta.voices.push({ frame: f, path, duration_s: +dur(path).toFixed(3), words });
  console.log(`✓ voice ${f}: ${words.length} words, ${dur(path).toFixed(2)}s`);
}
delete meta.padded; // wavs on disk are unpadded TTS output
writeFileSync('audio_meta.json', JSON.stringify(meta, null, 2));
// The workflow's fetch-sfx / music passes rebuild voices from the engine sidecar — put the
// recovered lines there too, or the next pass wipes them.
const ENG = 'audio_engine_meta.json';
if (existsSync(ENG)) {
  const eng = JSON.parse(readFileSync(ENG, 'utf8'));
  eng.voices = meta.voices.map((v) => ({ id: String(v.frame).padStart(2, '0'), path: v.path, duration_s: v.duration_s, words: v.words }));
  writeFileSync(ENG, JSON.stringify(eng, null, 2));
}
console.log('✓ recover-voice: audio_meta.json voices rebuilt from assets/voice/*.wav');
