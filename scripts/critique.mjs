// The automated critic — reviews an ad project (and its render) the way the first user
// did, note by note. Every check cites the note it encodes (references/lessons.md).
// Run (cwd = project root) after build.sh, and again with --render <mp4> after render.sh:
//   node <skill>/scripts/critique.mjs [--render renders/x.mp4] [--json]
// Exit 1 on any FAIL. WARNs are judgment calls to raise with the user, not blockers.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { config, meta } from './timing.mjs';

const args = process.argv.slice(2);
const renderPath = args.includes('--render') ? args[args.indexOf('--render') + 1] : null;
const out = [];
const add = (level, id, msg, note, fix) => out.push({ level, id, msg, note, fix });

const m = meta();
const voices = m.voices.slice().sort((a, b) => a.frame - b.frame);
const spoken = (v) => v.words.map((w) => w.text).join(' ');
const sb = existsSync('STORYBOARD.md') ? readFileSync('STORYBOARD.md', 'utf8') : '';
const frameIds = [...sb.matchAll(/src: compositions\/frames\/([\w-]+)\.html/g)].map((x) => x[1]);
const footageIds = new Set(Object.keys(config.shots ? config.shots({ dur: () => 1, cue: () => 0, marks: config.marks ?? {}, full: (s, f, d, e = {}) => ({ src: s, from: f, dur: d, W: 1920, H: 1080, ...e }), config }) : {}));

// ── Script / voice ──────────────────────────────────────────────────────────
// listen.mjs (run by voice.mjs): a listener heard each take against its script line.
const heard = existsSync('.hyperframes/listen.json') ? JSON.parse(readFileSync('.hyperframes/listen.json', 'utf8')) : {};
for (const [f, h] of Object.entries(heard)) if (h.match === false)
  add('FAIL', 'heard', `frame ${f}: heard "${h.heard}" for "${h.said}"${h.issues ? ` — ${h.issues}` : ''}`, '"he didn\'t say aro dot day" · reviewer: "no crash"', 'retake the line (regen-line.mjs) or respell it (voice.saidAs)');
const hook = voices[0] ? spoken(voices[0]) : '';
if (/\b(unlike|other (apps|tools)|than (your|other)|vs\.?|instead of|most (apps|tools|planners)|doesn'?t know)\b/i.test(hook))
  add('FAIL', 'comparison-hook', `hook compares: "${hook}"`, '"don\'t start by comparing"', 'open on a feeling or question the viewer recognises');

const AI_ISMS = [/seamless/i, /\bunlock/i, /streamline/i, /supercharge/i, /game[- ]?chang/i, /effortless/i, /\belevate/i,
  /revolutioni[sz]e/i, /say goodbye/i, /imagine a world/i, /in today'?s/i, /the power of/i, /\bnot at (six|6|five|5|seven|7)\b/i,
  /,\s*not\s+(at\s+)?\w+\s*p\.?m/i, /—/,
  // Arabic lines translated word for word from the English ad (user: «اياك تترجم ترجمة حرفية وبلاش
  // دباجات ال AI»): "each on its own clock", "all three back on", "start again on their own"
  /لوحد(ه|ها|هم)/, /كل\s+(واحد|واحدة|مهمة|تايمر)\s+(ليها|ليه|ب)?\s*(عدّاد|عداد)/, /(التلاتة|الاتنين|كلهم)\s+رجعوا/];
for (const v of voices) {
  const s = spoken(v);
  for (const re of AI_ISMS) if (re.test(s))
    add('WARN', 'ai-ism', `frame ${v.frame}: "${s}" matches ${re}`, '"this is very aish"', 'say it plainly, like a person');
  // Arabic too: «نص ساعة» half an hour, «ساعة ونص» an hour and a half, «ربع ساعة» a quarter hour
  if (/\b(and a half|half an? hours?|quarter|\d+\.\d+\s*(h|hours?))\b|(نص|نصف|ربع)\s*(ساعة|ساعه)|(ساعة|ساعه)\s*و\s*(نص|نصف|ربع)/i.test(s))
    add('FAIL', 'fractions', `frame ${v.frame}: fractional time "${s}"`, '"without halfs to make it simple"', 'whole numbers; re-seed the app so the UI shows them');
  if (config.brand?.name?.includes('.') && s.toLowerCase().includes(config.brand.name.toLowerCase()))
    add('FAIL', 'brand-tts', `frame ${v.frame}: "${config.brand.name}" spoken as written — TTS drops the dot`, '"it said aro (silent) day"', 'spell it ("aro dot day") + captionMerge');
  // A merged brand ("aro dot day") is said as one name, so it counts as one word. 3.5/s: a
  // lively Gemini read sat at 3.0–3.4 and was fine; 1.12× time-stretched Kokoro read rushed.
  const merged = (config.captionMerge ?? []).reduce((n, r) => n + (s.toLowerCase().split(r.spoken.join(' ')).length - 1) * (r.spoken.length - 1), 0);
  const words = v.words.length - merged, talk = v.words.length ? v.words.at(-1).end - v.words[0].start : 0;
  if (talk > 0 && words / talk > 3.5)
    add('WARN', 'rushed', `frame ${v.frame}: ${(words / talk).toFixed(1)} words/s (> 3.5) — reads rushed`, '"can we try slow down the english"', 'TTS speed 1.0, or cut words');
  // and the other way: a "measured, premium narration" style read a long line at 2.4/s — the user
  // called the ad slow; the brisk read that fixed it ran 2.7–2.9 (short lines skip the check)
  // 0.4s allowed per sentence break: a "Ten tasks. Zero left over. Your week, planned." payoff pauses on purpose
  else if (words >= 8 && talk > 0 && v.frame !== voices.at(-1)?.frame) { // the CTA may take its time
    const pace = words / Math.max(0.5, talk - 0.4 * Math.max(0, (s.match(/[.!?](\s|$)/g) ?? []).length - 1));
    if (pace < 2.6) add('WARN', 'slow-read', `frame ${v.frame}: ${pace.toFixed(1)} words/s (< 2.6) — reads slow`, '"it\'s slow"', 'a brisk style (lessons #62), or fewer words');
  }
}
const speedM = readFileSync('SCRIPT.md', 'utf8').match(/speed[^\d]*(\d+(\.\d+)?)/i);
if (speedM && +speedM[1] > 1.05) add('WARN', 'tts-speed', `TTS speed ${speedM[1]}`, '"slow down the english"', 'use 1.0');
if (config.brand?.name?.includes('.') && !(config.captionMerge ?? []).length)
  add('WARN', 'caption-brand', 'no captionMerge rule — subtitles will show the spoken spelling', '"aro dot day" in subtitles', 'add captionMerge');

// Brand early (ABCD "Branding": within the first ~5s, said or shown).
let t = 0, brandAt = null;
const brandTok = (config.captionMerge?.[0]?.spoken?.[0] ?? config.brand?.name?.split(/[.\s]/)[0] ?? '').toLowerCase();
for (const v of voices) {
  const hit = brandTok && v.words.find((w) => w.text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '').startsWith(brandTok));
  if (hit && brandAt === null) brandAt = t + hit.start;
  t += v.duration_s;
}
const total = t;
const hookHasBug = existsSync(`compositions/frames/${frameIds[0]}.html`) && readFileSync(`compositions/frames/${frameIds[0]}.html`, 'utf8').includes('-bug');
if (!(brandAt !== null && brandAt <= 5.0))
  add('WARN', 'brand-late', `brand first said at ${brandAt?.toFixed(1) ?? 'never'}s (ABCD: say it by 5s, with the logo on screen)`, 'research: ABCD Branding', 'name the product in line 1 or 2');
const hookHtml = existsSync(`compositions/frames/${frameIds[0]}.html`) ? readFileSync(`compositions/frames/${frameIds[0]}.html`, 'utf8') : '';
if (!hookHasBug) add('WARN', 'logo-missing', 'no logo in the hook frame', '"we need app logo visible all over the video"', 'base(..., { bug: "hero" })');
else if (!hookHtml.includes('f-bug hero') && !hookHtml.includes('data-brand="hero"')) add('WARN', 'logo-small', 'hook logo is the small corner bug (~0.4% of frame) — hard to read on a phone', 'research: logo readable within 5s (ABCD detector uses 3.5%)', 'base(..., { bug: "hero" }) on the hook frame');
const allWords = voices.reduce((n, v) => n + v.words.length, 0);
if (allWords / total * 30 > 80) add('WARN', 'words-per-30s', `${Math.round(allWords / total * 30)} words per 30s (target ≈ 75 — about 150 wpm)`, 'research: VO pace', 'cut words, not speed');
const endWords = voices.at(-1) ? spoken(voices.at(-1)).toLowerCase() : '';
// Arabic CTAs too (ابدأ start · جرب try · سجل sign up · حمّل download · مجان free): \b is ASCII-only
if (!/\b(try|start|get|visit|download|sign up|join|free|today)\b|ابدأ|جرب|سجل|حمّل|حمل|مجان/.test(endWords))
  add('WARN', 'no-cta', `the last line has no spoken call to action ("${voices.at(-1) ? spoken(voices.at(-1)) : ''}")`, 'research: say the CTA + show it; the user decides', 'e.g. "Start free at <brand>" — ask before adding');

// ── Pacing / holds / sync ───────────────────────────────────────────────────
const fp = voices.filter((v) => footageIds.has(frameIds[v.frame - 1]));
for (const v of voices) {
  const id = frameIds[v.frame - 1] ?? `frame ${v.frame}`;
  const tail = v.duration_s - (v.words.at(-1)?.end ?? 0);
  // the breath between two lines = this line's tail + the next line's lead
  const breath = tail + (voices.find((x) => x.frame === v.frame + 1)?.words[0]?.start ?? 0);
  if (v.frame < voices.length && breath < 0.12)
    add('WARN', 'no-breath', `${id}: line ends ${breath.toFixed(2)}s before the next one`, 'cuts on the last syllable feel abrupt', 'small tail pad');
}
const lastFootage = fp.at(-1);
if (lastFootage) {
  const tail = lastFootage.duration_s - lastFootage.words.at(-1).end;
  if (tail < 1.0) add('FAIL', 'payoff-hold', `payoff frame ${frameIds[lastFootage.frame - 1]} holds ${tail.toFixed(2)}s after the last word (< 1.0s)`,
    '"I need few moment after second 15 … very fast cut"', 'pads(): { frame, tail: 1.5 }');
}
for (const e of config.events ?? []) {
  const v = voices.find((x) => x.frame === e.frame);
  const norm = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''); // both sides: Arabic marks (shadda) are not letters
  const w = v?.words.find((x) => norm(x.text) === norm(e.word));
  if (!w) { add('WARN', 'event-word', `event "${e.word}" not spoken in frame ${e.frame}`, '', 'fix config.events'); continue; }
  const d = w.start - e.at(config.marks ?? {}, (n) => voices.find((x) => x.frame === n).duration_s);
  if (d < -0.05) add('FAIL', 'voice-ahead', `frame ${e.frame}: "${e.word}" is said ${(-d).toFixed(2)}s BEFORE the event it names`, '"over by an hour is not synced with the video"', 'pads(): lead so the word lands just after the event');
  else if (d > 1.0) add('WARN', 'voice-late', `frame ${e.frame}: "${e.word}" lands ${d.toFixed(2)}s after its event`, 'sync', 'reduce the lead pad');
}
if (total < 12 || total > 45) add('WARN', 'length', `total ${total.toFixed(1)}s`, 'ads are 15–40s', 'trim or split into two ads');
if (voices[0] && voices[0].duration_s > 4.0) add('WARN', 'slow-hook', `hook frame is ${voices[0].duration_s.toFixed(1)}s (> 4s)`, 'hook in the first 3s', 'shorter hook line');

// ── Footage framing ─────────────────────────────────────────────────────────
const shots = config.shots ? config.shots({ dur: (n) => voices.find((x) => x.frame === n)?.duration_s ?? 1,
  cue: () => 0, marks: config.marks ?? {}, full: (src, from, dur, e = {}) => ({ src, from, dur, W: 1920, H: 1080, cam0: { s: 1 }, moves: [], ...e }), config }) : {};
const list = Object.entries(shots);
// Transitions next to footage must be cuts: a crossfade only fades the frame wrappers — the
// hoisted footage isn't inside them and stops at its own duration (blank board, "muddy dissolve").
{
  const sb = existsSync('STORYBOARD.md') ? readFileSync('STORYBOARD.md', 'utf8') : '';
  const trans = [...sb.matchAll(/^## Frame (\d+)[\s\S]*?^- transition_in:\s*(.+)$/gm)].map((m) => ({ n: +m[1], t: m[2].trim() }));
  for (const { n, t } of trans) {
    if (/^(cut|none|)$/i.test(t)) continue;
    const here = frameIds[n - 1], before = frameIds[n - 2];
    if ((here && footageIds.has(here)) || (before && footageIds.has(before)))
      add('FAIL', 'crossfade-footage', `frame ${n} uses "${t}" next to footage`, 'reviewer: "a muddy grey dissolve", the board vanished 0.4s early', 'transition_in: cut');
  }
}
// A beat is one continuous take: frames joined by an invisible seam read as ONE shot, so only a
// whole beat can be "too fast to follow".
const beats = [];
for (const [id, s] of list) {
  const b = beats.at(-1);
  if (b && b.src === s.src && Math.abs(b.end - s.from) < 0.02) { b.ids.push(id); b.dur += s.dur; b.end = s.from + s.dur; }
  else beats.push({ src: s.src, ids: [id], dur: s.dur, end: s.from + s.dur });
}
for (const b of beats) if (b.dur < 2.0)
  add('WARN', 'beat-too-short', `${b.ids.join(' + ')}: ${b.dur.toFixed(2)}s of footage — too fast to follow`, '"very fast cut"', 'lengthen the line or pad a tail');
for (const [id, s] of list) {
  const fit = Math.min(s.W / 1920, s.H / 1080);
  const maxS = Math.max(s.cam0?.s ?? fit, ...(s.moves ?? []).map((mv) => mv.to.s));
  // Zoom is contextual: fine to make something small readable while nothing moves there;
  // a FAIL only when a move overlaps a gesture (the "hard to follow" case).
  const zoom = maxS / fit;
  const moving = (s.moves ?? []).map((mv) => [s.from + mv.at, s.from + mv.at + mv.d]);
  const hit = (config.gestures ?? []).find((g) => g.src === s.src && moving.some(([a, b]) => a < g.to && b > g.from));
  if (hit) add('FAIL', 'zoom-during-gesture', `${id}: camera moves during "${hit.name}"`, '"zooming in and out make it hard to follow what\'s happening"', 'move before/after the gesture, or hold wide');
  else if (zoom > 2.0) add('WARN', 'zoom', `${id}: zooms ${zoom.toFixed(1)}× — check it doesn't hide what the voice describes`, '"it really depends" — zoom to make something readable, not to decorate', 'ease in, hold, ease out before the next action');
  if ((s.moves ?? []).length > 2) add('WARN', 'camera-busy', `${id}: ${s.moves.length} camera moves in one shot`, '"zooming in and out"', 'one move per beat');
  if (s.W !== 1920 || s.H !== 1080) add('WARN', 'not-full-screen', `${id}: footage ${s.W}×${s.H}, not full screen`, '"can we keep this full screen the full demo"', 'full(...)');
}
for (const g of config.gestures ?? []) {
  for (const [i, [id, s]] of list.entries()) {
    if (s.src !== g.src) continue;
    const end = s.from + s.dur;
    const startsInside = s.from > g.from + 0.05 && s.from < g.to - 0.05;
    const endsInside = end > g.from + 0.05 && end < g.to - 0.05;
    const next = list[i + 1]?.[1], prev = list[i - 1]?.[1];
    const continues = next && next.src === s.src && Math.abs(next.from - end) < 0.02; // invisible seam
    const seamIn = prev && prev.src === s.src && Math.abs(prev.from + prev.dur - s.from) < 0.02;
    if (startsInside && !seamIn) add('FAIL', 'cut-mid-gesture', `${id} starts inside "${g.name}" (${g.from}–${g.to}s)`, '"the video cut while dragging is disturbing"', 'start before the approach');
    if (endsInside && !continues) add('FAIL', 'cut-mid-gesture', `${id} ends inside "${g.name}"`, '"the video cut while dragging"', 'extend the shot or continue the take');
  }
}

// ── Build artefacts ─────────────────────────────────────────────────────────
if (!existsSync('compositions/captions.html')) add('WARN', 'no-subtitles', 'no captions track', '"can we add more subtitles to make it clear"', 'build.sh (captions on)');
const last = frameIds.at(-1) && existsSync(`compositions/frames/${frameIds.at(-1)}.html`) ? readFileSync(`compositions/frames/${frameIds.at(-1)}.html`, 'utf8') : '';
if (config.palette?.accent && new RegExp(`-bg \\{[^}]*background: ${config.palette.accent}`, 'i').test(last))
  add('WARN', 'end-card-accent', 'end card is an accent fill', '"I don\'t want blue background"', 'ink ground unless the user chose otherwise');
// music.upbeat: true = the user asked for energy — a calm bed under a feature ad was "very calm,
// not okay" (Plan your week v3); the ambient default still holds for calm ads (the break ad)
if (!config.music?.upbeat && /driving|energetic|punchy kick|upbeat/i.test(sb.match(/^music:.*$/m)?.[0] ?? ''))
  add('WARN', 'music', 'driving music bed', '"I think ambient is better … or sound effect"', 'ambient bed + UI sfx — or music.upbeat: true when the user asked for energy');
for (const f of frameIds) {
  const p = `compositions/frames/${f}.html`;
  if (!existsSync(p)) continue;
  const html = readFileSync(p, 'utf8');
  const fdur = +(html.match(/data-composition-id="[^"]+"[^>]*data-duration="([\d.]+)"/)?.[1] ?? 0);
  for (const [, txt] of html.matchAll(/class="f[\w-]+-(?:t|label)"[^>]*>([^<]{1,200})</g)) {
    const t = txt.trim();
    if (t.length > 42) add('WARN', 'card-chars', `${f}: "${t}" is ${t.length} chars (> 42 per line)`, 'research: Netflix subtitle rule', 'shorten');
    if (t.split(/\s+/).length > 7) add('WARN', 'card-words', `${f}: on-screen line "${t}" > 7 words`, 'cards are glanced, not read', 'cut to ≤ 7 words');
  }
  // Hold: a card revealed at T must stay ≥ max(1s, chars/18) — Netflix reading speed.
  for (const m2 of html.matchAll(/slam\('#(f[\w-]+)', ([\d.]+)\)/g)) {
    const [, sel, at] = m2;
    const el = html.match(new RegExp(`id="${sel}"[^>]*>([\\s\\S]*?)</div>`))?.[1] ?? '';
    const text = el.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hold = fdur - +at, need = Math.max(1.0, text.length / 18);
    if (text && hold < need) add('WARN', 'card-hold', `${f}: "${text}" visible ${hold.toFixed(1)}s (< ${need.toFixed(1)}s to read)`, '"the viewer can\'t see what\'s (Done), it\'s very fast cut"', 'reveal earlier or pad a tail');
  }
}

// ── Render (optional) ───────────────────────────────────────────────────────
if (renderPath) {
  // ffmpeg prints filter stats on stderr even on success — spawnSync keeps it.
  const ff = (...a) => spawnSync('ffmpeg', ['-hide_banner', '-i', renderPath, ...a, '-f', 'null', '-'], { encoding: 'utf8' }).stderr ?? '';
  const st = ff('-vf', 'select=eq(n\\,0),signalstats,metadata=print', '-frames:v', '1', '-an');
  const num = (re) => +(st.match(re)?.[1] ?? NaN);
  const yavg = num(/YAVG=([\d.]+)/), ymin = num(/YMIN=([\d.]+)/), ymax = num(/YMAX=([\d.]+)/);
  if (!isNaN(ymax) && ymax - ymin < 40) add('FAIL', 'thumbnail-empty', `frame 0 is near-uniform (Y ${ymin}–${ymax}) — a blank thumbnail`, '"I need a good thumbnail in the first frame"', 'compose frame 0 (no fade-in)');
  else if (!isNaN(yavg) && yavg < 18) add('WARN', 'thumbnail-dark', `frame 0 is very dark (YAVG ${yavg})`, 'thumbnail', 'lift the hook frame');
  const lufs = +(ff('-af', 'ebur128', '-vn').match(/I:\s+(-?[\d.]+) LUFS/g)?.at(-1)?.match(/-?[\d.]+/)?.[0] ?? NaN);
  const dest = (existsSync('BRIEF.md') ? readFileSync('BRIEF.md', 'utf8').match(/^destination:\s*(\S+)/m)?.[1] : '') ?? '';
  const [lo, hi] = /youtube/i.test(dest) ? [-16, -12] : /ctv|tv/i.test(dest) ? [-25, -22] : [-20, -15];
  if (!isNaN(lufs) && (lufs < lo || lufs > hi)) add('WARN', 'loudness', `integrated loudness ${lufs} LUFS (target ${lo}…${hi} for ${dest || 'social'})`, 'research: AES TD1004 / IAB / YouTube normalisation', 'normalise the mix');
  else if (!isNaN(lufs)) add('INFO', 'loudness', `integrated loudness ${lufs} LUFS`, '', '');
}

// ── Report ──────────────────────────────────────────────────────────────────
if (args.includes('--json')) { console.log(JSON.stringify(out, null, 2)); }
else {
  const icon = { FAIL: '✗', WARN: '⚠', INFO: '·' };
  for (const r of out.sort((a, b) => (a.level > b.level ? 1 : -1)))
    console.log(`${icon[r.level]} ${r.level} ${r.id}: ${r.msg}${r.note ? `  [${r.note}]` : ''}${r.fix ? `\n    → ${r.fix}` : ''}`);
  const fails = out.filter((r) => r.level === 'FAIL').length, warns = out.filter((r) => r.level === 'WARN').length;
  console.log(`\ncritique: ${fails} FAIL · ${warns} WARN · ${total.toFixed(1)}s total`);
}
process.exit(out.some((r) => r.level === 'FAIL') ? 1 : 0);
