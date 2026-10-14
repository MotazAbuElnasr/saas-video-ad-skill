// build.mjs <project-dir> — words.json (+ optional captions.json) → index.html:
// the untouched source.mp4 + word-synced karaoke captions (chunk pops in, spoken word lifts + recolours).
// captions.json (all optional): { dir:"rtl"|"ltr", top, height, side, maxWords, maxChars, pause,
//   text, active, key, stroke }  — top/height = the caption band in px, chosen to dodge burned-in graphics.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const D = process.argv[2];
const cfg = {
  dir: "rtl", top: 175, height: 260, side: 50, maxWords: 3, maxChars: 20, pause: 0.35,
  text: "#ffffff", active: "#ffd84d", key: "#ff5a4f", stroke: "#111111",
  ...(existsSync(join(D, "captions.json")) ? JSON.parse(readFileSync(join(D, "captions.json"))) : {}),
};
// JSON, not csv: HDR side data makes csv emit a trailing empty field that shifts the duration to 0
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries",
  "stream=width,height:format=duration", "-of", "json", join(D, "source.mp4")]));
const [W, H, DUR] = [probe.streams[0].width, probe.streams[0].height, +(+probe.format.duration).toFixed(2)];

const raw = [];
for (const w of JSON.parse(readFileSync(join(D, "words.json")))) {
  const p = raw.at(-1);
  // RTL only: consecutive English words ("Oral Fluconazole") are one term — one token, one highlight, never split across chunks
  if (cfg.dir === "rtl" && p && /^[A-Za-z0-9]+( [A-Za-z0-9]+)*$/.test(p.w) && /^[A-Za-z0-9]+$/.test(w.w) && !w.br)
    Object.assign(p, { w: p.w + " " + w.w, e: w.e, key: p.key || w.key });
  else raw.push({ ...w });
}
// "الـ" never stands alone: glue it to the next word with an NBSP so a chunk break can't orphan it
const words = [];
raw.forEach((w, i) => (raw[i - 1]?.w === "الـ" ? words.push({ ...w, w: "الـ " + w.w, s: raw[i - 1].s, br: raw[i - 1].br || w.br }) : w.w !== "الـ" && words.push(w)));

const chunks = [];
let cur = [];
const flush = () => cur.length && (chunks.push(cur), (cur = []));
words.forEach((w, i) => {
  const len = cur.reduce((a, x) => a + x.w.length + 1, 0) + w.w.length;
  if (cur.length && (w.br || cur.length >= cfg.maxWords || len > cfg.maxChars || w.s - words[i - 1].e > cfg.pause)) flush();
  cur.push(w);
});
flush();

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
let html = "", js = "";
chunks.forEach((c, ci) => {
  const start = c[0].s;
  const next = chunks[ci + 1]?.[0].s ?? DUR;
  // ≥0.5s readable, ≤0.6s past the last word (no stale text over silence), never past the next chunk (no pile-ups)
  const end = Math.min(next, Math.max(c.at(-1).e + 0.6, start + 0.5), DUR);
  const chars = c.reduce((a, w) => a + w.w.length + 1, 0);
  // long chunks step down so they stay on one or two lines inside the band
  const fs = Math.round((chars <= 15 ? 96 : chars <= 21 ? 84 : 72) * (W / 1080));
  html += `<div class="chunk clip" id="k${ci}" data-start="${start.toFixed(3)}" data-duration="${(end - start).toFixed(3)}" data-track-index="1"><div class="in" id="c${ci}" style="font-size:${fs}px">${c
    .map((w, wi) => `<span class="w" id="c${ci}w${wi}">${esc(w.w)}</span>`).join("")}</div></div>\n`;
  js += `tl.fromTo("#c${ci}", { scale: 0.86, opacity: 0, y: 18 }, { scale: 1, opacity: 1, y: 0, duration: 0.16, ease: "back.out(2)" }, ${start.toFixed(3)});\n`;
  c.forEach((w, wi) => {
    const off = c[wi + 1]?.s ?? end;
    // lift + tiny scale, not a big scale pop: 1.08× on a 600px Latin word grows ~48px and swallows the word gap
    js += `tl.fromTo("#c${ci}w${wi}", { color: "${cfg.text}", scale: 1, y: 0 }, { color: "${w.key ? cfg.key : cfg.active}", scale: 1.03, y: -8, duration: 0.09, ease: "power2.out" }, ${w.s.toFixed(3)});\n`;
    js += `tl.to("#c${ci}w${wi}", { ${w.key ? "" : `color: "${cfg.text}", `}scale: 1, y: 0, duration: 0.12, ease: "power1.inOut" }, ${off.toFixed(3)});\n`;
  });
});

writeFileSync(join(D, "index.html"), `<!doctype html>
<html lang="${cfg.dir === "rtl" ? "ar" : "en"}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
@font-face { font-family: "Alexandria"; src: url("assets/fonts/Alexandria-Arabic.woff2") format("woff2"); font-weight: 100 900; }
@font-face { font-family: "Inter"; font-weight: 900; src: url("assets/fonts/Inter-Black.woff2") format("woff2"); }
html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #000; }
#root { position: relative; width: 100%; height: 100%; overflow: hidden; }
.chunk { position: absolute; left: ${cfg.side}px; right: ${cfg.side}px; top: ${cfg.top}px; height: ${cfg.height}px; display: flex; align-items: center; justify-content: center; }
/* flex gap, not text spaces: a fixed gutter the word lift can't eat; direction lays words in reading order */
.in { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 4px 28px; direction: ${cfg.dir}; unicode-bidi: isolate; text-align: center; line-height: 1.25;
  font-family: "Alexandria", "Inter", sans-serif; font-weight: 800; color: ${cfg.text};
  -webkit-text-stroke: 12px ${cfg.stroke}; paint-order: stroke fill; text-shadow: 0 6px 18px rgba(0,0,0,.35); }
/* whole-word spans only: per-letter splits break Arabic letter joining; letter-spacing stays 0 for the same reason */
.w { display: inline-block; letter-spacing: 0; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}">
<video id="a-roll" class="clip" src="source.mp4" playsinline data-start="0" data-duration="${DUR}" data-track-index="0" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" data-has-audio="true"></video>
${html}</div>
<script>
const tl = gsap.timeline({ paused: true });
${js}window.__timelines["main"] = tl;
</script>
</body>
</html>
`);
console.log(`${words.length} words → ${chunks.length} captions · ${W}x${H} · ${DUR}s`);
