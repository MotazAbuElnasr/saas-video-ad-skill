// Bakes each footage frame into its own clip: source range, framing, optional eased
// camera move, highlight boxes — all in the pixels. Why baked, not animated in HTML:
// assemble-index hoists frame videos to the host with STATIC geometry, so a frame-local
// transform can't follow them.
// Run (cwd = project root): node <skill>/scripts/bake-clips.mjs
// Shots come from ad.config.mjs → shots(kit). Output: assets/shot-<frameId>.mp4
import { execFileSync } from 'node:child_process';
import { config, kit } from './timing.mjs';

// A full-screen 1:1 shot of the 1920×1080 source — the default (lesson: zoom confuses).
export const full = (src, from, dur, extra = {}) => ({
  src, from, dur, W: 1920, H: 1080, cam0: { fx: 960, fy: 540, s: 1, tx: 960, ty: 540 }, moves: [], ...extra,
});

// Piecewise camera value as an ffmpeg expression of T (frame-time seconds).
function expr(shot, key) {
  let e = `${shot.cam0[key]}`;
  let prev = shot.cam0;
  for (const m of shot.moves ?? []) {
    const u = `clip((T-${m.at})/${m.d},0,1)`;
    const k = `(${u}*${u}*(3-2*${u}))`; // smoothstep ≈ power3.inOut
    e = `(${e})+(${m.to[key] - prev[key]})*${k}`;
    prev = { ...prev, ...m.to };
  }
  return e;
}

const hex = (c) => `0x${(c ?? '#2563eb').replace('#', '')}`;
const UP = 2; // upscale before zoompan so moves are sub-pixel smooth

const shots = config.shots({ ...kit, full });
for (const [id, shot] of Object.entries(shots)) {
  if (shot.W % 2 || shot.H % 2) throw new Error(`bake: ${id} W/H must be even (libx264)`);
  // zoompan, not scale+crop: crop locks its input size at the first frame, so a
  // per-frame scale makes it clamp to 0,0. Pad to the panel aspect so the window never stretches.
  const aspect = shot.W / shot.H;
  const pw = Math.max(1920, Math.round((1080 * aspect) / 2) * 2), ph = Math.max(1080, Math.round(1920 / aspect / 2) * 2);
  const ox = (pw - 1920) / 2, oy = (ph - 1080) / 2;
  const sub = (k) => expr(shot, k).replaceAll('T', 'in/60'); // `t` is NaN after these filters
  const S = sub('s'), FX = sub('fx'), FY = sub('fy'), TX = sub('tx'), TY = sub('ty');
  const vf = [
    'fps=60',
    'tpad=stop_mode=clone:stop_duration=3', // a slower read may outlast the recorded clip
    `pad=${pw}:${ph}:${ox}:${oy}:color=${hex(config.palette?.canvas ?? '#fafbfc')}`,
    `scale=${pw * UP}:${ph * UP}:flags=lanczos`,
    `zoompan=z='${pw}*(${S})/${shot.W}':x='${UP}*((${FX})+${ox}-(${TX})/(${S}))':y='${UP}*((${FY})+${oy}-(${TY})/(${S}))':d=1:s=${shot.W}x${shot.H}:fps=60`,
    // Highlight boxes switch on by frame number (t is unreliable after zoompan).
    ...(shot.boxes ?? []).map((b) =>
      `drawbox=x=${b.x}:y=${b.y}:w=${b.w}:h=${b.h}:color=${hex(b.color ?? config.palette?.accent)}:t=${b.t ?? 5}:enable='gte(n,${Math.round(b.from * 60)})'`),
    'format=yuv420p',
  ].join(',');
  const out = `assets/shot-${id}.mp4`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(shot.from), '-i', `assets/${shot.src}`, '-t', String(shot.dur),
    '-vf', vf, '-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', out], { stdio: 'inherit' });
  console.log('baked', out, `(${shot.dur}s from ${shot.src}@${shot.from})`);
}
