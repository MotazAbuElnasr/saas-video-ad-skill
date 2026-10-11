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
import { containCam, formatOf, resolveCam, sourceSize, viewOf } from './format.mjs';

const fmt = formatOf(config);
// A full-screen 1:1 shot of the 1920×1080 source — the default (lesson: zoom confuses).
// Another canvas (format 9:16): the shot is baked at the canvas size; its framing comes from
// `crop: [x, y, w, h]` (source px, cover-fit) or, without one, the whole source contained (letterboxed).
export const full = (src, from, dur, extra = {}) => (fmt.name === '1920x1080'
  ? { src, from, dur, W: 1920, H: 1080, cam0: { fx: 960, fy: 540, s: 1, tx: 960, ty: 540 }, moves: [], ...extra }
  : { src, from, dur, W: fmt.W, H: fmt.H, moves: [], ...extra });

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
const BAKE = 'v2'; // v2: setpts from 0 (stage shots lost the panel on frame 0)

// stage: the app as a floating panel in space (premium look) — scaled to `s` of the frame, rounded
// corners, turned in 3D from `from` to `to` over the shot (ry/rx degrees, z panel scale), a soft
// shadow, on a two-colour gradient. The camera (cam0/moves) and boxes still apply INSIDE the panel.
// from/to: { ry, rx (degrees), z (panel scale), cx, cy (panel centre) }; at/dur: when the turn runs
// inside the shot (seconds; default the whole shot) — e.g. hold the filled week, then pull back.
// s is the panel's LARGEST size in the shot: z ≤ 1 shrinks it (z > 1 upscales the footage — soft).
// rim: a thin light edge (alpha 0–1) — a dark app on a dark ground lost its outline (the shadow
// doesn't show on navy); 0 turns it off. vignette: false keeps the ground flat — a drawn frame next to the
// panel (CSS, no vignette) then shares its backdrop across the cut.
const STAGE = { s: 0.74, d: 2600, radius: 18, shadow: 0.6, rim: 0.22, rimColor: '#ffffff', from: { ry: -14, rx: 6, z: 0.98 }, to: { ry: -7, rx: 3, z: 1.02 } };
// The panel's size: its view (the footage frame — the canvas for 16:9 in 16:9; a landscape app in a
// vertical canvas is a 1080-wide view) contained in the canvas, times s.
const panelSize = (shot, view, s) => {
  const k = Math.min(shot.W / view.VW, shot.H / view.VH);
  return { PW: Math.round((view.VW * k * s) / 2) * 2, PH: Math.round((view.VH * k * s) / 2) * 2 };
};
function stageGraph(shot, inner, view) {
  const st = { ...STAGE, bg: [config.palette?.ink ?? '#0b0f1c', config.palette?.accent ?? '#2a1846'], ...shot.stage };
  const W = shot.W, H = shot.H, { PW, PH } = panelSize(shot, view, st.s);
  // The perspective maps the PADDED canvas (panel + transparent margin) — so the corners projected are
  // the canvas's (W×H in the panel's plane): the panel inside then lands at size s, not s² (the first
  // version shrank a 0.74 panel to ~0.55).
  const quad = ({ ry, rx, z = 1, cx = W / 2, cy = H / 2 }) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => {
    const t = (ry * Math.PI) / 180, p = (rx * Math.PI) / 180, dx = (sx * W * z) / 2, dy = (sy * H * z) / 2;
    const x1 = dx * Math.cos(t), z1 = dx * Math.sin(t), y2 = dy * Math.cos(p) - z1 * Math.sin(p), z2 = dy * Math.sin(p) + z1 * Math.cos(p);
    const k = st.d / (st.d + z2);
    return [cx + x1 * k, cy + y2 * k];
  });
  const A = quad(st.from), B = quad({ ...st.from, ...st.to });
  const at = st.at ?? 0, len = st.dur ?? shot.dur;
  // smoothstep for a move; 'linear' for a slow drift that runs on across a cut (an ease stops dead at it)
  const E = st.ease === 'linear' ? `clip((in/60-${at})/${len},0,1)` : `(st(0,clip((in/60-${at})/${len},0,1))*0+ld(0)*ld(0)*(3-2*ld(0)))`;
  const xy = (i, j) => `${A[i][j].toFixed(1)}+(${(B[i][j] - A[i][j]).toFixed(1)})*${E}`;
  const persp = ['x0', 'y0', 'x1', 'y1', 'x2', 'y2', 'x3', 'y3'].map((k, n) => `${k}='${xy(n >> 1, n & 1)}'`).join(':');
  return [
    `[0:v]${inner},scale=${PW}:${PH}:flags=lanczos,format=rgba[f0]`,
    `[1:v]format=gray,scale=${PW}:${PH}[m]`,
    ...(st.rim ? [`[2:v]format=gray,scale=${PW}:${PH}[rm]`, `color=c=${hex(st.rimColor)}:s=${PW}x${PH}:r=60,format=rgba[rc]`,
      `[rc][rm]alphamerge,colorchannelmixer=aa=${st.rim}[rl]`, '[f0][rl]overlay=0:0:shortest=1[f1]'] : []),
    `[${st.rim ? 'f1' : 'f0'}][m]alphamerge,pad=${W}:${H}:${(W - PW) / 2}:${(H - PH) / 2}:color=black@0,format=rgba,perspective=${persp}:sense=destination:eval=frame:interpolation=linear[p]`,
    '[p]split[fg][s0]',
    `[s0]colorchannelmixer=rr=0:gg=0:bb=0:aa=${st.shadow},boxblur=36:2[sh]`,
    `gradients=s=${W}x${H}:c0=${hex(st.bg[0])}:c1=${hex(st.bg[1])}:x0=0:y0=0:x1=${W}:y1=${H}:n=2:speed=0:d=${shot.dur + 1}:r=60,format=rgba[bg]`,
    '[bg][sh]overlay=x=0:y=46[b1]',
    `[b1][fg]overlay=0:0${st.vignette === false ? '' : ',vignette=PI/5'},format=yuv420p[v]`,
  ].join(';');
}
// the rounded-corner mask (and the rim: the mask's outer 3·s px) for a panel size, made once
function stageMask(shot, view) {
  const st = { ...STAGE, ...shot.stage };
  const { PW, PH } = panelSize(shot, view, st.s), R = st.radius;
  // inside a rounded rect inset by m px with corner radius r (1 or 0)
  const inside = (m, r) => `if(gt(abs(X-W/2),W/2-${m}-${r})*gt(abs(Y-H/2),H/2-${m}-${r}),lte(hypot(abs(X-W/2)-(W/2-${m}-${r}),abs(Y-H/2)-(H/2-${m}-${r})),${r}),lte(abs(X-W/2),W/2-${m})*lte(abs(Y-H/2),H/2-${m}))`;
  const make = (f, lum) => existsSync(f) || execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `color=c=white:s=${PW}x${PH}:d=1`, '-vf', `format=gray,geq=lum='${lum}'`, '-frames:v', '1', f]);
  const mask = `assets/.stage-mask-${PW}x${PH}-r${R}.png`, w = Math.max(1, Math.round(3 * st.s));
  const rim = `assets/.stage-rim-${PW}x${PH}-r${R}-w${w}.png`;
  make(mask, `255*${inside(0, R)}`);
  if (st.rim) make(rim, `255*(${inside(0, R)})*(1-${inside(w, Math.max(1, R - w))})`);
  return st.rim ? [mask, rim] : [mask];
}

const shots = config.shots({ ...kit, full });
const force = process.argv.includes('--force');
// marks.ready = the take's first usable second (the view on screen): a slower read once pulled the
// hook's source back into the app still navigating — the hook opened on the wrong week
for (const [id, s] of Object.entries(shots)) if (config.marks?.ready != null && s.from < config.marks.ready - 0.001)
  console.warn(`⚠ bake: ${id} starts at ${s.from.toFixed(2)}s, before marks.ready (${config.marks.ready}s) — film a longer still, or start later and \`hold\``);
const jobs = Object.entries(shots).map(([id, shot]) => {
  if (shot.W !== fmt.W || shot.H !== fmt.H) console.warn(`⚠ bake: ${id} is ${shot.W}×${shot.H}, the canvas is ${fmt.name} — the assembler stretches it`);
  if (shot.W % 2 || shot.H % 2) throw new Error(`bake: ${id} W/H must be even (libx264)`);
  const out = `assets/shot-${id}.mp4`;
  const keyFile = `assets/.shot-${id}.key`;
  // the stage DEFAULTS are part of the key: a new default (the rim) must re-bake cached panels; and
  // BAKE: bump it when the filter graph changes, or cached shots keep the old bug
  const spec = { ...shot, ...(shot.stage ? { stage: { ...STAGE, ...shot.stage } } : {}) };
  const key = createHash('sha1').update(BAKE + JSON.stringify(spec) + statSync(`assets/${shot.src}`).mtimeMs + (config.palette?.accent ?? '')).digest('hex');
  if (!force && existsSync(out) && existsSync(keyFile) && readFileSync(keyFile, 'utf8') === key) {
    console.log('cached', out);
    return Promise.resolve();
  }
  // zoompan, not scale+crop: crop locks its input size at the first frame, so a
  // per-frame scale makes it clamp to 0,0. Pad to the panel aspect so the window never stretches.
  const { SW, SH } = sourceSize(`assets/${shot.src}`);
  const view = viewOf(shot, SW, SH), { VW, VH } = view;
  // reframe: the footage frame isn't the 1920×1080 source 1:1 (another canvas, a crop, a vertical
  // panel). Its camera comes from `crop` (cover-fit) or contains the whole source; boxes are in SOURCE
  // px and map through the camera. Otherwise the original 16:9 path, unchanged.
  const reframe = !!shot.crop || VW !== SW || VH !== SH;
  if (reframe) {
    const cam0 = resolveCam(shot.crop ? { crop: shot.crop } : shot.cam0, VW, VH, containCam(SW, SH, VW, VH));
    let prev = cam0;
    const moves = (shot.moves ?? []).map((m) => { const to = { ...prev, ...resolveCam(m.to, VW, VH, prev) }; prev = to; return { ...m, to }; });
    shot = { ...shot, cam0, moves };
    const c = shot.crop;
    if (c && (c[0] < 0 || c[1] < 0 || c[0] + c[2] > SW || c[1] + c[3] > SH)) console.warn(`⚠ bake: ${id} crop [${c}] reaches outside the ${SW}×${SH} source — that band paints in palette.canvas`);
    if (!shot.crop && !shot.cam0 && !shot.stage && fmt.name !== '1920x1080') console.warn(`⚠ bake: ${id} has no crop — the whole app is letterboxed in ${fmt.name}; give it crop: [x, y, w, h] (source px) around the action`);
  }
  // reframe: the window the camera sees (source px), over cam0 and every move's end — the source is
  // cropped to it first, so a 1080×1920 view doesn't zoompan a 3840×6826 padded frame
  const win = (c) => [c.fx - c.tx / c.s, c.fy - c.ty / c.s, c.fx + (VW - c.tx) / c.s, c.fy + (VH - c.ty) / c.s];
  let pw, ph, ox, oy, pre = [];
  if (!reframe) {
    const aspect = shot.W / shot.H;
    pw = Math.max(SW, Math.round((SH * aspect) / 2) * 2); ph = Math.max(SH, Math.round(SW / aspect / 2) * 2);
    ox = (pw - SW) / 2; oy = (ph - SH) / 2;
  } else {
    const ws = [shot.cam0, ...shot.moves.map((m) => m.to)].map(win);
    // 8 px margin: a smoothstep between two windows can bow slightly outside both
    let x0 = Math.min(...ws.map((w) => w[0])) - 8, y0 = Math.min(...ws.map((w) => w[1])) - 8;
    let x1 = Math.max(...ws.map((w) => w[2])) + 8, y1 = Math.max(...ws.map((w) => w[3])) + 8;
    // grow the shorter side to the view's aspect around its centre (zoompan's window has the input's aspect)
    const a = VW / VH;
    if ((x1 - x0) / (y1 - y0) < a) { const g = ((y1 - y0) * a - (x1 - x0)) / 2; x0 -= g; x1 += g; }
    else { const g = ((x1 - x0) / a - (y1 - y0)) / 2; y0 -= g; y1 += g; }
    const ev = (v) => Math.round(v / 2) * 2;
    pw = ev(x1 - x0); ph = ev(pw / a); x0 = ev(x0); y0 = ev(y0);
    // the part of the window inside the source, padded with the canvas colour where it isn't
    const cx0 = Math.max(0, x0), cy0 = Math.max(0, y0), cx1 = Math.min(SW, x0 + pw), cy1 = Math.min(SH, y0 + ph);
    pre = [`crop=${cx1 - cx0}:${cy1 - cy0}:${cx0}:${cy0}`, `pad=${pw}:${ph}:${cx0 - x0}:${cy0 - y0}:color=${hex(config.palette?.canvas ?? '#fafbfc')}`];
    ox = -x0; oy = -y0;
  }
  const sub = (k) => expr(shot, k).replaceAll('T', 'in/60'); // `t` is NaN after these filters
  const S = sub('s'), FX = sub('fx'), FY = sub('fy'), TX = sub('tx'), TY = sub('ty');
  const still = !reframe && !(shot.moves ?? []).length && shot.cam0.s === 1 && shot.W === SW && shot.H === SH;
  // reframe: boxes are source px. Static camera → mapped into view px (a crisp t px ring); a moving
  // camera → drawn on the source before it (they follow the zoom; t scaled so it lands ≈ t px).
  const moving = reframe && shot.moves.length > 0, c0 = shot.cam0;
  const boxes = (shot.boxes ?? []).map((b) => {
    if (!reframe || b.pre) return b;
    // t scaled by the camera's zoom when the box switches on (a ring that appears after a push-in
    // came out 13 px thick when scaled by the wide start)
    const sAt = (shot.moves.filter((m) => m.at + m.d <= b.from + 0.01).at(-1)?.to ?? c0).s;
    if (moving) return { ...b, pre: true, t: Math.max(1, Math.round((b.t ?? 5) / sAt)) };
    const X = Math.round((b.x - c0.fx) * c0.s + c0.tx), Y = Math.round((b.y - c0.fy) * c0.s + c0.ty);
    return { ...b, x: X, y: Y, w: Math.round(b.w * c0.s), h: Math.round(b.h * c0.s) };
  });
  const vf = [
    // timestamps from 0: after -ss the first frame's pts isn't 0, and a stage shot's overlay drew only
    // the gradient on frame 0 (an empty thumbnail; a one-frame flash at every panel cut)
    'setpts=PTS-STARTPTS',
    'fps=60',
    // a slower read may outlast the clip — or `hold` ends the source early on purpose (below)
    `tpad=stop_mode=clone:stop_duration=${Math.max(3, Math.ceil(shot.dur))}`,
    // `pre` boxes are drawn on the source, before the camera: they zoom WITH the app (a ring or
    // a shaded region inside a shot that zooms). Times are source-frame based (60 fps capture).
    ...boxes.filter((b) => b.pre).map(box),
    // Full-screen 1:1 shots skip the zoompan path entirely (3–4× faster).
    ...(still ? [] : [
      ...(reframe ? pre : [`pad=${pw}:${ph}:${ox}:${oy}:color=${hex(config.palette?.canvas ?? '#fafbfc')}`]),
      `scale=${pw * UP}:${ph * UP}:flags=lanczos`,
      `zoompan=z='${pw}*(${S})/${VW}':x='${UP}*((${FX})+${ox}-(${TX})/(${S}))':y='${UP}*((${FY})+${oy}-(${TY})/(${S}))':d=1:s=${VW}x${VH}:fps=60`,
    ]),
    // Highlight boxes switch on (and, with `to`, off) by frame number (t is unreliable after
    // zoompan). `to`: the thing ringed disappears mid-shot (a chip that closes with its input).
    ...boxes.filter((b) => !b.pre).map(box),
    ...(shot.stage ? [] : ['format=yuv420p']),
  ].join(',');
  const graph = shot.stage
    ? [...stageMask(shot, view).flatMap((f) => ['-loop', '1', '-t', String(shot.dur), '-i', f]), '-filter_complex', stageGraph(shot, vf, view), '-map', '[v]']
    : ['-vf', vf];
  // hold: a source time where the footage stops and its last frame holds to the shot's end — the
  // line runs longer than the app's idle stretch (a drawer, a preview) before its next event.
  // Only over an idle stretch: a held frame mid-motion reads as a freeze.
  const hold = shot.hold != null ? ['-t', String(Math.max(0.05, shot.hold - shot.from))] : [];
  return new Promise((ok, fail) => {
    // -t AFTER the inputs (an output cap): tpad clones past a short source, the cap keeps the length
    const p = spawn('ffmpeg', ['-v', 'error', '-y', '-ss', String(shot.from), ...hold, '-i', `assets/${shot.src}`,
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
