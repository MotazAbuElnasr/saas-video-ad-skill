// aro.day "It fits" — VERTICAL (9:16) frame compositions. Copy to <project>/.hyperframes/gen-frames.mjs
// with `aspect: '9:16'` in ad.config.mjs and `format: 1080x1920` in STORYBOARD.md.
// Layout rule: every text box sits inside kit.safeBox (x 60–960, y 220–1500): the platform's search
// bar, caption/handle block and button column cover the rest. Subtitles live at y 1300–1500.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

const SKILL = process.env.AD_SKILL ?? `${homedir()}/.claude/skills/saas-video-ad`;
const { config, cue, dur, marks } = await import(`${SKILL}/scripts/timing.mjs`);
const { makeKit } = await import(`${SKILL}/scripts/frame-kit.mjs`);

const { base, footage, card, OVER, P, safeBox: B } = makeKit(config);
const L = B.x0 + 24; // text column's left edge
const frames = {};

// 01 — hook, composed at frame 0 (the thumbnail): stacked lines in the safe column, hero lockup above.
{
  const id = '01-half-list';
  frames[id] = base(id, dur(1), `
    #f${id}-shot { position: absolute; inset: 0; background: url("assets/ad-fit-day-day.png") 8% center / cover no-repeat; opacity: .22; }
    #f${id}-a { left: ${L}px; top: 430px; font-size: 104px; transform-origin: 0 50%; }
    #f${id}-b { left: ${L}px; top: 580px; font-size: 156px; transform-origin: 0 50%; }
    #f${id}-b2 { left: ${L}px; top: 745px; font-size: 156px; transform-origin: 0 50%; }
    #f${id}-c { left: ${L}px; top: 935px; font-size: 128px; color: ${P.accent}; transform-origin: 0 50%; }`, `
  <div id="f${id}-shot"></div>
  <div id="f${id}-a" class="f${id}-t">another day.</div>
  <div id="f${id}-b" class="f${id}-t">half the</div>
  <div id="f${id}-b2" class="f${id}-t">to-do list</div>
  <div id="f${id}-c" class="f${id}-t">still there?</div>`, `
    punch('#f${id}-a', ${cue(1, 'another') - 0.05});
    punch('#f${id}-b', ${cue(1, 'half') - 0.05});
    punch('#f${id}-b2', ${cue(1, 'half') - 0.05});
    punch('#f${id}-c', ${cue(1, 'still') - 0.05});`, { bug: 'hero' });
}

// 02 / 03 — the app as a panel (y ≈ 680–1240); the card sits in the free band above it.
{
  const id = '02-shows-you';
  frames[id] = base(id, dur(2), `
    #f${id}-c { left: ${L}px; top: 340px; }
    #f${id}-free { font-size: 110px; color: ${P.accent}; margin-top: 14px; }`, footage(id, dur(2)) +
    card(id, 'c', `<div class="f${id}-label">7h for real work</div><div id="f${id}-free" class="f${id}-t">1h free</div>`), `
    tl.fromTo(q('#f${id}-c'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }, ${cue(2, 'seven')});
    tl.fromTo(q('#f${id}-free'), { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 0.26, ease: 'power4.out' }, ${cue(2, 'just')});`, OVER);
}
{
  const id = '03-add-one';
  frames[id] = base(id, dur(3), `
    #f${id}-c { left: ${L}px; top: 380px; }
    #f${id}-plus { font-size: 150px; color: ${P.accent}; }`, footage(id, dur(3)) +
    card(id, 'c', `<div id="f${id}-plus" class="f${id}-t">+2h</div>`), `
    slam('#f${id}-c', ${+(marks.drop - marks.dragFrom + 0.03).toFixed(2)});`, OVER);
}
// 04 / 05 — cropped full-bleed footage; the card over the empty lower columns, above the subtitles.
{
  const id = '04-over';
  const redAt = +(marks.red - (marks.dragFrom + dur(3))).toFixed(2);
  frames[id] = base(id, dur(4), `
    #f${id}-c { left: ${L}px; top: 1010px; }
    #f${id}-num { font-size: 120px; color: ${P.alert}; letter-spacing: -0.05em; }
    #f${id}-sub { margin-top: 12px; }`, footage(id, dur(4)) +
    card(id, 'c', `<div id="f${id}-num" class="f${id}-t">8h / 7h</div><div id="f${id}-sub" class="f${id}-label">over by 1h</div>`), `
    slam('#f${id}-c', ${redAt});`, OVER);
}
{
  const id = '05-thursday';
  frames[id] = base(id, dur(5), `
    #f${id}-c { left: ${L}px; top: 1080px; }
    #f${id}-a { font-size: 150px; color: ${P.accent}; }`, footage(id, dur(5)) +
    card(id, 'c', `<div id="f${id}-a" class="f${id}-t">done.</div>`), `
    slam('#f${id}-c', ${cue(5, 'done') - 0.05});`, OVER);
}

// 06 — end card on ink, centred in the safe column.
{
  const id = '06-brand';
  const cx = (B.x0 + B.x1) / 2;
  frames[id] = base(id, dur(6), `
    #f${id}-mark { position: absolute; left: ${cx - 70}px; top: 470px; width: 140px; height: 140px; }
    #f${id}-word { left: ${B.x0}px; width: ${B.x1 - B.x0}px; top: 660px; text-align: center; font-size: 200px; }
    #f${id}-line { left: ${B.x0}px; width: ${B.x1 - B.x0}px; top: 900px; text-align: center; font-size: 76px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; white-space: normal; }
    #f${id}-line b { color: ${P.accent}; font-weight: 900; }
    #f${id}-url { left: ${B.x0}px; width: ${B.x1 - B.x0}px; top: 1130px; text-align: center; font-size: 32px; }
    #f${id}-all { position: absolute; inset: 0; }`, `
    <div id="f${id}-all">
      <img id="f${id}-mark" src="${config.brand.mark}" alt="">
      <div id="f${id}-word" class="f${id}-t">${config.brand.name}</div>
      <div id="f${id}-line" class="f${id}-t">plan a day that<br>actually <b>fits.</b></div>
      <div id="f${id}-url" class="f${id}-label">${config.brand.name}</div>
    </div>`, `
    tl.fromTo(q('#f${id}-mark'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.6)' }, 0.05);
    slam('#f${id}-word', ${cue(6, 'aro') - 0.05});
    tl.fromTo(q('#f${id}-line'), { opacity: 0 }, { opacity: 1, duration: 0.5 }, ${cue(6, 'plan') - 0.05});
    tl.fromTo(q('#f${id}-url'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, ${cue(6, 'fits')});
    tl.to(q('#f${id}-all'), { opacity: 0, duration: 0.3, ease: 'power2.in' }, ${dur(6) - 0.35});`, { bug: false });
}

rmSync('compositions/frames', { recursive: true, force: true });
mkdirSync('compositions/frames', { recursive: true });
for (const [id, html] of Object.entries(frames)) writeFileSync(`compositions/frames/${id}.html`, html);
console.log('wrote', Object.keys(frames).length, 'frames');
