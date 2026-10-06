// aro.day "It fits" — frame compositions. Copied to <project>/.hyperframes/gen-frames.mjs.
// Every time below is a word cue or a footage mark — nothing is hand-timed.
// Run (cwd = project root): node .hyperframes/gen-frames.mjs   (build.sh does)
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

// The skill's shared scripts; AD_SKILL overrides the install location.
const SKILL = process.env.AD_SKILL ?? `${homedir()}/.claude/skills/saas-video-ad`;
const { config, cue, dur, marks } = await import(`${SKILL}/scripts/timing.mjs`);
const { makeKit } = await import(`${SKILL}/scripts/frame-kit.mjs`);

const { base, footage, card, OVER, P } = makeKit(config);
const frames = {};

// 01 — hook, composed at frame 0 (= the thumbnail): lines punch on their words.
{
  const id = '01-half-list';
  frames[id] = base(id, dur(1), `
    #f${id}-shot { position: absolute; inset: 0; background: url("assets/ad-fit-day-day.png") center / cover no-repeat; opacity: .22; }
    #f${id}-a { left: 120px; top: 190px; font-size: 150px; transform-origin: 0 50%; }
    #f${id}-b { left: 112px; top: 370px; font-size: 190px; transform-origin: 0 50%; }
    #f${id}-c { left: 108px; top: 590px; font-size: 230px; color: ${P.accent}; }`, `
  <div id="f${id}-shot"></div>
  <div id="f${id}-a" class="f${id}-t">another day.</div>
  <div id="f${id}-b" class="f${id}-t">half the to-do list</div>
  <div id="f${id}-c" class="f${id}-t">still there?</div>`, `
    punch('#f${id}-a', ${cue(1, 'another') - 0.05});
    punch('#f${id}-b', ${cue(1, 'half') - 0.05});
    punch('#f${id}-c', ${cue(1, 'still') - 0.05});`);
}

// Footage frames: the app full screen; cards over the empty Thu/Fri columns (x ≈ 620–1730).
// 02 — "seven hours for real work, just one still free". Meter ring baked from "seven".
{
  const id = '02-shows-you';
  frames[id] = base(id, dur(2), `
    #f${id}-c { left: 1180px; top: 330px; }
    #f${id}-free { font-size: 110px; color: ${P.accent}; margin-top: 14px; }`, footage(id, dur(2)) +
    card(id, 'c', `<div class="f${id}-label">7h for real work</div><div id="f${id}-free" class="f${id}-t">1h free</div>`), `
    tl.fromTo(q('#f${id}-c'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }, ${cue(2, 'seven')});
    tl.fromTo(q('#f${id}-free'), { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 0.26, ease: 'power4.out' }, ${cue(2, 'just')});`, OVER);
}
// 03 + 04 — one continuous take; "+2h" on the drop, clear of the centred dialog.
{
  const id = '03-add-one';
  frames[id] = base(id, dur(3), `
    #f${id}-c { left: 1300px; top: 700px; }
    #f${id}-plus { font-size: 150px; color: ${P.accent}; }`, footage(id, dur(3)) +
    card(id, 'c', `<div id="f${id}-plus" class="f${id}-t">+2h</div>`), `
    slam('#f${id}-c', ${+(marks.drop - marks.dragFrom + 0.03).toFixed(2)});`, OVER);
}
{
  const id = '04-over';
  const redAt = +(marks.red - (marks.dragFrom + dur(3))).toFixed(2);
  frames[id] = base(id, dur(4), `
    #f${id}-c { left: 1220px; top: 300px; }
    #f${id}-num { font-size: 120px; color: ${P.alert}; letter-spacing: -0.05em; }
    #f${id}-sub { margin-top: 12px; }`, footage(id, dur(4)) +
    card(id, 'c', `<div id="f${id}-num" class="f${id}-t">8h / 7h</div><div id="f${id}-sub" class="f${id}-label">over by 1h</div>`), `
    slam('#f${id}-c', ${redAt});`, OVER);
}
// 05 — drag to Thursday; "done." on the word, then the padded hold.
{
  const id = '05-thursday';
  frames[id] = base(id, dur(5), `
    #f${id}-c { left: 1240px; top: 600px; }
    #f${id}-a { font-size: 150px; color: ${P.accent}; }`, footage(id, dur(5)) +
    card(id, 'c', `<div id="f${id}-a" class="f${id}-t">done.</div>`), `
    slam('#f${id}-c', ${cue(5, 'done') - 0.05});`, OVER);
}

// 06 — end card on ink (user: no accent-filled background). Final frame: settle-out allowed.
{
  const id = '06-brand';
  frames[id] = base(id, dur(6), `
    #f${id}-mark { position: absolute; left: 50%; top: 190px; width: 120px; height: 120px; margin-left: -60px; }
    #f${id}-word { left: 0; right: 0; top: 350px; text-align: center; font-size: 240px; }
    #f${id}-line { left: 0; right: 0; top: 610px; text-align: center; font-size: 72px; font-weight: 700; letter-spacing: -0.02em; }
    #f${id}-line b { color: ${P.accent}; font-weight: 900; }
    #f${id}-url { left: 0; right: 0; top: 740px; text-align: center; font-size: 30px; }
    #f${id}-all { position: absolute; inset: 0; }`, `
    <div id="f${id}-all">
      <img id="f${id}-mark" src="${config.brand.mark}" alt="">
      <div id="f${id}-word" class="f${id}-t">${config.brand.name}</div>
      <div id="f${id}-line" class="f${id}-t">plan a day that actually <b>fits.</b></div>
      <div id="f${id}-url" class="f${id}-label">${config.brand.name}</div>
    </div>`, `
    tl.fromTo(q('#f${id}-mark'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.6)' }, 0.05);
    slam('#f${id}-word', ${cue(6, 'aro') - 0.05});
    tl.fromTo(q('#f${id}-line'), { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'none' }, ${cue(6, 'plan') - 0.05});
    tl.fromTo(q('#f${id}-url'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, ${cue(6, 'fits')});
    tl.to(q('#f${id}-all'), { opacity: 0, duration: 0.3, ease: 'power2.in' }, ${dur(6) - 0.35});`, { bug: false });
}

rmSync('compositions/frames', { recursive: true, force: true });
mkdirSync('compositions/frames', { recursive: true });
for (const [id, html] of Object.entries(frames)) writeFileSync(`compositions/frames/${id}.html`, html);
console.log('wrote', Object.keys(frames).length, 'frames');
