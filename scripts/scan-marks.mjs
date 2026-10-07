// Measure footage marks: when does a REGION of the take change? (the cursor appears, a menu opens,
// a drawer slides in, a click lands). cuts.sh finds whole-frame changes; this finds the small ones —
// and the marks move 0.1–0.5s between takes, so re-scan after EVERY re-film.
// Run: node <skill>/scripts/scan-marks.mjs <video> <x> <y> <w> <h> <t0> <t1> [fps=30] [every=1]
//   prints "time diff" for each frame whose region differs from the previous one (diff > 0.4, 0–255
//   mean abs); a burst is a motion, its first time is the mark. every=N prints every Nth hit (pans).
import { execFileSync } from 'node:child_process';

const [v, x, y, w, h, t0, t1, fps = 30, every = 1] = process.argv.slice(2);
if (!t1) {
  console.error('usage: scan-marks.mjs <video> <x> <y> <w> <h> <t0> <t1> [fps] [every]');
  process.exit(1);
}
const W = 64, H = Math.max(8, Math.round((64 * h) / w)); // tiny gray thumbnails: fast, noise-tolerant
const buf = execFileSync('ffmpeg', ['-v', 'error', '-ss', t0, '-to', t1, '-i', v, '-vf', `fps=${fps},crop=${w}:${h}:${x}:${y},scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 28 });
let prev, hits = 0;
for (let i = 0; i < buf.length / (W * H); i++) {
  const f = buf.subarray(i * W * H, (i + 1) * W * H);
  if (prev) {
    let d = 0;
    for (let k = 0; k < f.length; k++) d += Math.abs(f[k] - prev[k]);
    d /= f.length;
    if (d > 0.4 && hits++ % +every === 0) console.log((+t0 + i / fps).toFixed(2), d.toFixed(1));
  }
  prev = f;
}
