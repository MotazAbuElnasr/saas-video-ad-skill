// The voice stage, cached: TTS + BGM → SFX → pads → durations, each skipped when its
// inputs are unchanged (TTS is paid and the slowest step — never re-buy an unchanged line).
// Voice settings come from ad.config.mjs → voice: { provider, id, speed }.
// Run (cwd = project root): node <skill>/scripts/voice.mjs [--force | --adopt]
// --adopt: record the current audio as cached (projects voiced before caching) — runs nothing.
//
// Order is load-bearing (each cost a rebuild):
// - TTS and BGM run in ONE audio.mjs pass (`--only tts,bgm`): a separate `--only bgm`
//   pass on a fresh project wrote an audio_meta.json with no voices.
// - fetch-sfx rewrites audio_meta.json and drops pad records → pads run after it.
// - The cache record is saved after EVERY stage, so a crash never forces a re-buy.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { scriptLines } from './align-words.mjs';
import { geminiLines } from './gemini-voice.mjs';

const config = (await import(pathToFileURL(resolve('ad.config.mjs')).href)).default;
const PLV = process.env.PLV_SCRIPTS ?? `${homedir()}/.claude/skills/product-launch-video/scripts`;
const SKILL = process.env.AD_SKILL ?? `${homedir()}/.claude/skills/saas-video-ad`;
const force = process.argv.includes('--force');
const v = { provider: 'heygen', speed: 1.0, ...config.voice };
if (!v.id) throw new Error('voice: set ad.config.mjs → voice.id (a HeyGen voice id, or a Kokoro voice like am_michael)');
// All lines in one wave (engine default 4): Kokoro reloads its model per line, so the
// wall time is the slowest line, not the sum.
process.env.HYPERFRAMES_TTS_CONCURRENCY ??= '8';
// Gemini TTS: the key comes from the macOS keychain (voice.keychain, default "gemini-api-key")
// when no env key is set — never printed. Pacing is a style prompt, not a speed (engine rule).
if (v.provider === 'gemini') {
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    try { process.env.GEMINI_API_KEY = execFileSync('security', ['find-generic-password', '-s', v.keychain ?? 'gemini-api-key', '-w'], { encoding: 'utf8' }).trim(); }
    catch { throw new Error(`voice: no Gemini key — set GEMINI_API_KEY or save one: security add-generic-password -U -a "$USER" -s ${v.keychain ?? 'gemini-api-key'} -w`); }
  }
  v.speed = 1;
}
// Kokoro runs through `npx hyperframes tts`, which needs a python with kokoro-onnx + soundfile.
// video-demo's narration venv has both — reuse it rather than pip-installing into the system python.
if (v.provider === 'kokoro' && !process.env.HYPERFRAMES_PYTHON) {
  const venv = `${homedir()}/.cache/demo-voice/.venv/bin/python`;
  if (existsSync(venv)) process.env.HYPERFRAMES_PYTHON = venv;
}

const KEYS = '.hyperframes/voice-keys.json';
const keys = existsSync(KEYS) ? JSON.parse(readFileSync(KEYS, 'utf8')) : {};
const save = () => writeFileSync(KEYS, JSON.stringify(keys, null, 2));
const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 12);
const sb = readFileSync('STORYBOARD.md', 'utf8');
const spoken = readFileSync('SCRIPT.md', 'utf8').split('\n').filter((l) => /^ {4}\S/.test(l)).join('\n');
const want = {
  tts: hash(`${spoken}|${v.provider}|${v.id}|${v.speed}|${v.style ?? ''}|${v.model ?? ''}|${v.saidAs ?? ''}`),
  bgm: hash(sb.match(/^music:.*$/m)?.[0] ?? ''),
  sfx: hash([...sb.matchAll(/^- sfx:.*$/gm)].map((m) => m[0]).join('\n')),
};
const run = (label, args) => {
  const t0 = Date.now();
  execFileSync('node', args, { stdio: ['ignore', 'pipe', 'inherit'] });
  console.log(`  ${label} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
};
const voicesOk = () => {
  if (!existsSync('audio_meta.json')) return false;
  const m = JSON.parse(readFileSync('audio_meta.json', 'utf8'));
  return (m.voices ?? []).length > 0;
};

if (process.argv.includes('--adopt')) {
  Object.assign(keys, want, { padded: true }); save();
  console.log('  adopted current audio as cached');
  process.exit(0);
}

const needTts = force || !voicesOk() || keys.tts !== want.tts;
const needBgm = force || keys.bgm !== want.bgm || !existsSync('assets/bgm/track.mp3');
// Gemini: our own sequential synth (rate limits) + recover-voice for timings; the engine then
// only fetches the bed, if that changed.
let geminiDone = false;
if (needTts && v.provider === 'gemini') {
  const t0 = Date.now();
  await geminiLines(v);
  execFileSync('node', [`${SKILL}/scripts/recover-voice.mjs`], { stdio: ['ignore', 'pipe', 'inherit'], env: { ...process.env, VOICE_LANG: v.lang ?? 'en' } });
  console.log(`  tts (gemini ${v.id}, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  keys.tts = want.tts; delete keys.padded; delete keys.sfx; save();
  geminiDone = true;
}
if ((needTts && !geminiDone) || needBgm) {
  // Only what changed: a voice-only pass keeps the bed (the engine carries bgm over from its
  // sidecar); re-retrieving an unchanged music prompt cost minutes for nothing.
  const only = [(needTts && !geminiDone) || !voicesOk() ? 'tts' : null, needBgm ? 'bgm' : null].filter(Boolean).join(',');
  // A music-only pass can come back with no voices (the engine rebuilds them from its own
  // sidecar, which may be empty) — keep the voices we already have.
  const before = existsSync('audio_meta.json') ? JSON.parse(readFileSync('audio_meta.json', 'utf8')) : null;
  run(only, [`${PLV}/audio.mjs`, '--script', './SCRIPT.md', '--storyboard', './STORYBOARD.md', '--hyperframes', '.',
    '--out', './audio_meta.json', '--provider', v.provider, '--voice', v.id, '--speed', String(v.speed), '--only', only,
    ...(v.style ? ['--style', v.style] : []), ...(v.model ? ['--tts-model', v.model] : [])]);
  if (!only.includes('tts') && before?.voices?.length && !voicesOk()) {
    const after = JSON.parse(readFileSync('audio_meta.json', 'utf8'));
    writeFileSync('audio_meta.json', JSON.stringify({ ...after, voices: before.voices, padded: before.padded }, null, 2));
    console.log('  kept existing voices (music-only pass)');
  }
  if (!voicesOk()) throw new Error('voice: audio_meta.json has no voices after TTS — check SCRIPT.md lines (4-space indented), the provider, and its quota (HeyGen free voice time runs out)');
  // Every line or nothing: the engine drops a failed line with only a stderr note (4 of 6
  // Kokoro lines once vanished under parallel load) — never cache a partial voiceover.
  const have = new Set(JSON.parse(readFileSync('audio_meta.json', 'utf8')).voices.map((x) => x.frame));
  const missing = scriptLines().filter((l) => !have.has(l.frame)).map((l) => l.frame);
  if (missing.length) throw new Error(`voice: TTS dropped line(s) ${missing.join(', ')} — re-run (lower HYPERFRAMES_TTS_CONCURRENCY if it repeats)`);
  if (only.includes('tts')) { keys.tts = want.tts; delete keys.padded; }
  keys.bgm = want.bgm; delete keys.sfx; save();
} else console.log('  tts + bgm: cached');

const padsKey = hash(String(config.pads ?? ''));
if (force || keys.sfx !== want.sfx || !keys.padded || keys.pads !== padsKey) {
  if (keys.sfx !== want.sfx || force) {
    // fetch-sfx rebuilds voices from the engine sidecar — empty after recover-voice once wiped
    // a whole voiceover. Snapshot and restore.
    const before = JSON.parse(readFileSync('audio_meta.json', 'utf8'));
    run('sfx', [`${PLV}/audio.mjs`, 'fetch-sfx', '--storyboard', './STORYBOARD.md', '--hyperframes', '.']);
    if (!voicesOk() && before.voices?.length) {
      const after = JSON.parse(readFileSync('audio_meta.json', 'utf8'));
      writeFileSync('audio_meta.json', JSON.stringify({ ...after, voices: before.voices, padded: before.padded }, null, 2));
      console.log('  kept existing voices (sfx pass)');
    }
    keys.sfx = want.sfx; save();
  }
  // fetch-sfx rewrote audio_meta.json → re-pad (pad-voices always works from NN.raw.wav).
  run('pads', [`${SKILL}/scripts/pad-voices.mjs`]);
  keys.padded = true; keys.pads = padsKey; save();
} else console.log('  sfx + pads: cached');

// Mix levels from the config (user: "less" music). The engine's default bed was 0.9 —
// nearly as loud as the voice. music.volume / sfxVolume override per ad.
{
  const m = JSON.parse(readFileSync('audio_meta.json', 'utf8'));
  if (m.bgm && config.music?.volume != null) m.bgm.volume = config.music.volume;
  if (config.music?.sfxVolume != null) for (const s of m.sfx ?? []) s.volume = config.music.sfxVolume;
  // An effect lands ON its event (the click, the orb), not at the frame start: config.sfxAt({ dur,
  // word, marks }) → { [frame]: seconds into that frame }. word() is the padded, frame-local start.
  if (config.sfxAt) {
    const v = (n) => m.voices.find((x) => x.frame === n);
    const norm = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, '');
    const word = (n, w) => v(n).words.find((x) => norm(x.text) === norm(w))?.start ?? 0;
    const at = config.sfxAt({ dur: (n) => v(n).duration_s, word, marks: config.marks ?? {} });
    for (const s of m.sfx ?? []) if (at[s.frame] != null) s.offset_s = Math.max(0, +at[s.frame].toFixed(3));
  }
  writeFileSync('audio_meta.json', JSON.stringify(m, null, 2));
}
run('sync-durations', [`${PLV}/audio.mjs`, 'sync-durations', '--audio-meta', './audio_meta.json', '--storyboard', './STORYBOARD.md']);
