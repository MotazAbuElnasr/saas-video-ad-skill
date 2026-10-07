// Bakes each footage frame into its own clip: source range, framing, optional eased
// camera move, highlight boxes — all in the pixels. Why baked, not animated in HTML:
// assemble-index hoists frame videos to the host with STATIC geometry, so a frame-local
// transform can't follow them.
// Run (cwd = project root): node <skill>/scripts/bake-clips.mjs [--force]
// Shots bake in parallel and are skipped when their spec + source are unchanged.
// Shots come from ad.config.mjs → shots(kit). Output: assets/shot-<frameId>.mp4
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
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
// One highlight box: a ring (t px), or a fill (`fill: true`, `alpha` 0–1) — e.g. shading the
// part of a timeline the claim excludes. `to` switches it off again.
const box = (b) => {
  const on = b.to != null ? `between(n,${Math.round(b.from * 60)},${Math.round(b.to * 60)})` : `gte(n,${Math.round(b.from * 60)})`;
  const color = `${hex(b.color ?? config.palette?.accent)}${b.alpha != null ? `@${b.alpha}` : ''}`;
  return `drawbox=x=${b.x}:y=${b.y}:w=${b.w}:h=${b.h}:color=${color}:t=${b.fill ? 'fill' : (b.t ?? 5)}:enable='${on}'`;
};
const UP = 2; // upscale before zoompan so moves are sub-pixel smooth

// stage: the app as a floating panel in space (premium look) — scaled to `s` of the frame, rounded
// corners, turned in 3D from `from` to `to` over the shot (ry/rx degrees, z panel scale), a soft
// shadow, on a two-colour gradient. The camera (cam0/moves) and boxes still apply INSIDE the panel.
const STAGE = { s: 0.74, d: 2600, radius: 18, shadow: 0.6, from: { ry: -14, rx: 6, z: 0.98 }, to: { ry: -7, rx: 3, z: 1.02 } };
function stageGraph(shot, inner) {
  const st = { ...STAGE, bg: [config.palette?.ink ?? '#0b0f1c', config.palette?.accent ?? '#2a1846'], ...shot.stage };
  const W = shot.W, H = shot.H, PW = Math.round((W * st.s) / 2) * 2, PH = Math.round((H * st.s) / 2) * 2;
  const quad = ({ ry, rx, z = 1 }) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => {
    const t = (ry * Math.PI) / 180, p = (rx * Math.PI) / 180, dx = (sx * PW * z) / 2, dy = (sy * PH * z) / 2;
    const x1 = dx * Math.cos(t), z1 = dx * Math.sin(t), y2 = dy * Math.cos(p) - z1 * Math.sin(p), z2 = dy * Math.sin(p) + z1 * Math.cos(p);
    const k = st.d / (st.d + z2);
    return [W / 2 + x1 * k, H / 2 + y2 * k];
  });
  const A = quad(st.from), B = quad(st.to), N = Math.round(shot.dur * 60);
  const E = `(st(0,clip(in/${N},0,1))*0+ld(0)*ld(0)*(3-2*ld(0)))`; // smoothstep of the shot's progress
  const xy = (i, j) => `${A[i][j].toFixed(1)}+(${(B[i][j] - A[i][j]).toFixed(1)})*${E}`;
  const persp = ['x0', 'y0', 'x1', 'y1', 'x2', 'y2', 'x3', 'y3'].map((k, n) => `${k}='${xy(n >> 1, n & 1)}'`).join(':');
  return [
    `[0:v]${inner},scale=${PW}:${PH}:flags=lanczos,format=rgba[f0]`,
    `[1:v]format=gray,scale=${PW}:${PH}[m]`,
    `[f0][m]alphamerge,pad=${W}:${H}:${(W - PW) / 2}:${(H - PH) / 2}:color=black@0,format=rgba,perspective=${persp}:sense=destination:eval=frame:interpolation=linear[p]`,
    '[p]split[fg][s0]',
    `[s0]colorchannelmixer=rr=0:gg=0:bb=0:aa=${st.shadow},boxblur=36:2[sh]`,
    `gradients=s=${W}x${H}:c0=${hex(st.bg[0])}:c1=${hex(st.bg[1])}:x0=0:y0=0:x1=${W}:y1=${H}:n=2:speed=0:d=${shot.dur + 1}:r=60,format=rgba[bg]`,
    '[bg][sh]overlay=x=0:y=46[b1]',
    '[b1][fg]overlay=0:0,vignette=PI/5,format=yuv420p[v]',
  ].join(';');
}
// the rounded-corner mask for a panel size, made once
function stageMask(shot) {
  const st = { ...STAGE, ...shot.stage };
  const PW = Math.round((shot.W * st.s) / 2) * 2, PH = Math.round((shot.H * st.s) / 2) * 2, R = st.radius;
  const f = `assets/.stage-mask-${PW}x${PH}-r${R}.png`;
  if (!existsSync(f)) {
    const lum = `if(gt(abs(X-W/2),W/2-${R})*gt(abs(Y-H/2),H/2-${R}),if(lte(hypot(abs(X-W/2)-(W/2-${R}),abs(Y-H/2)-(H/2-${R})),${R}),255,0),255)`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `color=c=white:s=${PW}x${PH}:d=1`, '-vf', `format=gray,geq=lum='${lum}'`, '-frames:v', '1', f]);
  }
  return f;
}

const shots = config.shots({ ...kit, full });
const force = process.argv.includes('--force');
const jobs = Object.entries(shots).map(([id, shot]) => {
  if (shot.W % 2 || shot.H % 2) throw new Error(`bake: ${id} W/H must be even (libx264)`);
  const out = `assets/shot-${id}.mp4`;
  const keyFile = `assets/.shot-${id}.key`;
  const key = createHash('sha1').update(JSON.stringify(shot) + statSync(`assets/${shot.src}`).mtimeMs + (config.palette?.accent ?? '')).digest('hex');
  if (!force && existsSync(out) && existsSync(keyFile) && readFileSync(keyFile, 'utf8') === key) {
    console.log('cached', out);
    return Promise.resolve();
  }
  // zoompan, not scale+crop: crop locks its input size at the first frame, so a
  // per-frame scale makes it clamp to 0,0. Pad to the panel aspect so the window never stretches.
  const aspect = shot.W / shot.H;
  const pw = Math.max(1920, Math.round((1080 * aspect) / 2) * 2), ph = Math.max(1080, Math.round(1920 / aspect / 2) * 2);
  const ox = (pw - 1920) / 2, oy = (ph - 1080) / 2;
  const sub = (k) => expr(shot, k).replaceAll('T', 'in/60'); // `t` is NaN after these filters
  const S = sub('s'), FX = sub('fx'), FY = sub('fy'), TX = sub('tx'), TY = sub('ty');
  const still = !(shot.moves ?? []).length && shot.cam0.s === 1 && shot.W === 1920 && shot.H === 1080;
  const vf = [
    'fps=60',
    'tpad=stop_mode=clone:stop_duration=3', // a slower read may outlast the recorded clip
    // `pre` boxes are drawn on the source, before the camera: they zoom WITH the app (a ring or
    // a shaded region inside a shot that zooms). Times are source-frame based (60 fps capture).
    ...(shot.boxes ?? []).filter((b) => b.pre).map(box),
    // Full-screen 1:1 shots skip the zoompan path entirely (3–4× faster).
    ...(still ? [] : [
      `pad=${pw}:${ph}:${ox}:${oy}:color=${hex(config.palette?.canvas ?? '#fafbfc')}`,
      `scale=${pw * UP}:${ph * UP}:flags=lanczos`,
      `zoompan=z='${pw}*(${S})/${shot.W}':x='${UP}*((${FX})+${ox}-(${TX})/(${S}))':y='${UP}*((${FY})+${oy}-(${TY})/(${S}))':d=1:s=${shot.W}x${shot.H}:fps=60`,
    ]),
    // Highlight boxes switch on (and, with `to`, off) by frame number (t is unreliable after
    // zoompan). `to`: the thing ringed disappears mid-shot (a chip that closes with its input).
    ...(shot.boxes ?? []).filter((b) => !b.pre).map(box),
    ...(shot.stage ? [] : ['format=yuv420p']),
  ].join(',');
  const graph = shot.stage
    ? ['-loop', '1', '-t', String(shot.dur), '-i', stageMask(shot), '-filter_complex', stageGraph(shot, vf), '-map', '[v]']
    : ['-vf', vf];
  return new Promise((ok, fail) => {
    // -t AFTER the inputs (an output cap): tpad clones past a short source, the cap keeps the length
    const p = spawn('ffmpeg', ['-v', 'error', '-y', '-ss', String(shot.from), '-i', `assets/${shot.src}`,
      ...graph, '-t', String(shot.dur), '-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'veryfast', out], { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('exit', (code) => {
      if (code) return fail(new Error(`bake: ffmpeg failed for ${id}`));
      writeFileSync(keyFile, key);
      console.log('baked', out, `(${shot.dur}s from ${shot.src}@${shot.from})`);
      ok();
    });
  });
});
await Promise.all(jobs);
