// The voice stage, cached: TTS → BGM → SFX → pads → durations, each skipped when its
// inputs are unchanged (TTS is paid and the slowest step — never re-buy an unchanged line).
// Voice settings come from ad.config.mjs → voice: { provider, id, speed }.
// Run (cwd = project root): node <skill>/scripts/voice.mjs [--force | --adopt]
// --adopt: record the current audio as cached (projects voiced before caching) — runs nothing.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const config = (await import(pathToFileURL(resolve('ad.config.mjs')).href)).default;
const PLV = process.env.PLV_SCRIPTS ?? `${homedir()}/.claude/skills/product-launch-video/scripts`;
const SKILL = process.env.AD_SKILL ?? `${homedir()}/.claude/skills/saas-video-ad`;
const force = process.argv.includes('--force');
const v = { provider: 'heygen', speed: 1.0, ...config.voice };
if (!v.id) throw new Error('voice: set ad.config.mjs → voice.id (e.g. a HeyGen voice id or a Kokoro voice like am_michael)');

const KEYS = '.hyperframes/voice-keys.json';
const keys = existsSync(KEYS) ? JSON.parse(readFileSync(KEYS, 'utf8')) : {};
const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 12);
const sb = readFileSync('STORYBOARD.md', 'utf8');
// Only the indented spoken lines matter to TTS (script-format.md).
const spoken = readFileSync('SCRIPT.md', 'utf8').split('\n').filter((l) => /^ {4}\S/.test(l)).join('\n');
const want = {
  tts: hash(`${spoken}|${v.provider}|${v.id}|${v.speed}`),
  bgm: hash(sb.match(/^music:.*$/m)?.[0] ?? ''),
  sfx: hash([...sb.matchAll(/^- sfx:.*$/gm)].map((m) => m[0]).join('\n')),
};
const run = (label, args) => {
  const t0 = Date.now();
  execFileSync('node', args, { stdio: ['ignore', 'pipe', 'inherit'] });
  console.log(`  ${label} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
};
const audio = (only) => [`${PLV}/audio.mjs`, '--script', './SCRIPT.md', '--storyboard', './STORYBOARD.md', '--hyperframes', '.',
  '--out', './audio_meta.json', '--provider', v.provider, '--voice', v.id, '--speed', String(v.speed), '--only', only];

if (process.argv.includes('--adopt')) {
  writeFileSync(KEYS, JSON.stringify({ ...want, padded: true }, null, 2));
  console.log('  adopted current audio as cached');
  process.exit(0);
}
const metaOk = existsSync('audio_meta.json');
let changed = false;
if (force || !metaOk || keys.tts !== want.tts) { run('tts', audio('tts')); keys.tts = want.tts; delete keys.padded; changed = true; }
else console.log('  tts: cached');
if (force || keys.bgm !== want.bgm || !existsSync('assets/bgm/track.mp3')) { run('bgm', audio('bgm')); keys.bgm = want.bgm; changed = true; }
else console.log('  bgm: cached');
if (force || changed || keys.sfx !== want.sfx) {
  run('sfx', [`${PLV}/audio.mjs`, 'fetch-sfx', '--storyboard', './STORYBOARD.md', '--hyperframes', '.']);
  keys.sfx = want.sfx;
  // fetch-sfx rewrote audio_meta.json → restore pad records (wavs are padded already unless TTS just ran).
  run('pads', [`${SKILL}/scripts/pad-voices.mjs`, ...(keys.padded ? ['--meta-only'] : [])]);
  keys.padded = true;
} else console.log('  sfx + pads: cached');
run('sync-durations', [`${PLV}/audio.mjs`, 'sync-durations', '--audio-meta', './audio_meta.json', '--storyboard', './STORYBOARD.md']);
writeFileSync(KEYS, JSON.stringify(keys, null, 2));
