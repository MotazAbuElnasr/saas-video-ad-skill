// Output format: canvas size, safe zones, and the camera maths every script shares.
// ad.config.mjs → format: { width, height } or aspect: '9:16' | '1:1' | '16:9' (default 16:9 = 1920×1080).
// The STORYBOARD frontmatter `format:` must say the same size — product-launch-video's assembler and
// caption builder read the canvas from there (`node format.mjs --check` fails on a mismatch; build.sh runs it).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const ASPECTS = { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350] };

// Platform UI covers these bands of a vertical frame (px at 1080×1920): TikTok/Reels/Shorts put the
// caption + handle at the bottom (~420), the search/tabs at the top (~220), the like/share column on
// the right (~120). best-practices.md #23–24 cite the per-platform numbers; this is the strictest union.
const SAFE_VERTICAL = { top: 220, bottom: 420, left: 60, right: 120 };
// 1:1 / 4:5 feed posts: only the feed's overlays at the very edges.
const SAFE_FEED = { top: 60, bottom: 120, left: 60, right: 60 };

export function formatOf(config = {}) {
  const f = config.format ?? {};
  const [aw, ah] = ASPECTS[config.aspect ?? f.aspect] ?? [];
  const W = f.width ?? aw ?? 1920, H = f.height ?? ah ?? 1080;
  if (W % 2 || H % 2) throw new Error(`format: ${W}×${H} must be even (libx264)`);
  const vertical = H > W, landscape = W > H;
  const scale = Math.min(W, H) / 1080; // type/UI sizes in the kit are written for a 1080 short edge
  const k = (o) => Object.fromEntries(Object.entries(o).map(([key, v]) => [key, Math.round(v * scale)]));
  const safe = { top: 0, bottom: 0, left: 0, right: 0, ...(vertical ? k(SAFE_VERTICAL) : landscape ? {} : k(SAFE_FEED)), ...f.safe };
  return { W, H, vertical, landscape, scale, safe, name: `${W}x${H}` };
}

// Source footage size (video-demo films 1920×1080). Probed once per file.
const sizes = new Map();
export function sourceSize(path) {
  if (!sizes.has(path)) {
    let wh = [1920, 1080];
    if (existsSync(path)) {
      try {
        const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path], { encoding: 'utf8' });
        const [w, h] = out.trim().split(',').map(Number);
        if (w && h) wh = [w, h];
      } catch { /* keep the default */ }
    }
    sizes.set(path, { SW: wh[0], SH: wh[1] });
  }
  return sizes.get(path);
}

// A camera: the source point (fx, fy) lands at view px (tx, ty), s view px per source px.
// crop [x, y, w, h] (source px) → the camera that cover-fits that rectangle into a VW×VH view.
export const cropCam = ([x, y, w, h], VW, VH) => ({ fx: x + w / 2, fy: y + h / 2, s: Math.max(VW / w, VH / h), tx: VW / 2, ty: VH / 2 });
// The whole source, contained (16:9 into 16:9 = s 1, the old default).
export const containCam = (SW, SH, VW, VH) => ({ fx: SW / 2, fy: SH / 2, s: Math.min(VW / SW, VH / SH), tx: VW / 2, ty: VH / 2 });
export const resolveCam = (c, VW, VH, fallback) => (c?.crop ? cropCam(c.crop, VW, VH) : { tx: VW / 2, ty: VH / 2, ...fallback, ...c });

// The footage frame a shot renders into: the canvas, or — for a `stage` panel — the panel's own
// resolution: the crop's (or source's) aspect, contained in the canvas (a landscape app floats as a
// 1080-wide panel in a vertical canvas). stage.view: [w, h] overrides.
export function viewOf(shot, SW, SH) {
  if (!shot.stage) return { VW: shot.W, VH: shot.H };
  if (shot.stage.view) return { VW: shot.stage.view[0], VH: shot.stage.view[1] };
  const aspect = shot.crop ? shot.crop[2] / shot.crop[3] : SW / SH;
  if (Math.abs(aspect - shot.W / shot.H) < 0.01) return { VW: shot.W, VH: shot.H };
  const k = Math.min(shot.W / aspect, shot.H);
  return { VW: Math.round((k * aspect) / 2) * 2, VH: Math.round(k / 2) * 2 };
}

// CLI: node format.mjs --check (cwd = project root) — STORYBOARD format must match the config.
if (process.argv[1]?.endsWith('format.mjs') && process.argv.includes('--check')) {
  const { config } = await import('./timing.mjs');
  const fmt = formatOf(config);
  const sb = existsSync('STORYBOARD.md') ? readFileSync('STORYBOARD.md', 'utf8') : '';
  const raw = sb.match(/^format:\s*(.+)$/m)?.[1]?.trim().toLowerCase() ?? '';
  const presets = { landscape: '1920x1080', portrait: '1080x1920', square: '1080x1080' };
  const said = presets[raw] ?? raw.replace(/\s|×/g, (c) => (c === '×' ? 'x' : ''));
  if ((said || '1920x1080') !== fmt.name) {
    console.error(`✗ format: ad.config.mjs says ${fmt.name}, STORYBOARD.md says "${raw || '(none → 1920x1080)'}" — set "format: ${fmt.name}" in the STORYBOARD frontmatter (the assembler and captions size the canvas from it)`);
    process.exit(1);
  }
  console.log(`✓ format ${fmt.name}${fmt.vertical ? ` · safe zone top ${fmt.safe.top} bottom ${fmt.safe.bottom} right ${fmt.safe.right}` : ''}`);
}
