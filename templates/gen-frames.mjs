// <brand> — <ad name> frame compositions. Copy to <project>/.hyperframes/gen-frames.mjs.
// Every time is a word cue (cue(frame, word)) or a measured footage mark — never hand-typed.
// Run via build.sh (it must regenerate frames before every assemble).
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

const SKILL = process.env.AD_SKILL ?? `${homedir()}/.claude/skills/saas-video-ad`;
const { config, cue, dur, marks } = await import(`${SKILL}/scripts/timing.mjs`);
const { makeKit } = await import(`${SKILL}/scripts/frame-kit.mjs`);
const { base, footage, card, OVER, P } = makeKit(config);
const frames = {};

// 01 — HOOK. Composed at frame 0 (it is the thumbnail): text on screen from t=0, punched on its words.
{
  const id = '01-hook';
  frames[id] = base(id, dur(1), `
    #f${id}-a { left: 120px; top: 260px; font-size: 170px; transform-origin: 0 50%; }
    #f${id}-b { left: 112px; top: 480px; font-size: 220px; color: ${P.accent}; transform-origin: 0 50%; }`, `
  <div id="f${id}-a" class="f${id}-t">line one.</div>
  <div id="f${id}-b" class="f${id}-t">line two?</div>`, `
    punch('#f${id}-a', ${cue(1, 'line') - 0.05});
    punch('#f${id}-b', ${cue(1, 'line', 1) - 0.05});`);
}

// 02 — FOOTAGE. The app full screen; a card over an EMPTY region, revealed on its word.
{
  const id = '02-answer';
  frames[id] = base(id, dur(2), `
    #f${id}-c { left: 1180px; top: 330px; }
    #f${id}-big { font-size: 110px; color: ${P.accent}; margin-top: 14px; }`, footage(id, dur(2)) +
    card(id, 'c', `<div class="f${id}-label">small label</div><div id="f${id}-big" class="f${id}-t">big value</div>`), `
    slam('#f${id}-c', ${cue(2, 'value')});`, OVER);
}

// NN — END CARD. Ink ground by default; the brand + promise + URL.
{
  const id = '03-brand';
  frames[id] = base(id, dur(3), `
    #f${id}-mark { position: absolute; left: 50%; top: 190px; width: 120px; height: 120px; margin-left: -60px; }
    #f${id}-word { left: 0; right: 0; top: 350px; text-align: center; font-size: 240px; }
    #f${id}-line { left: 0; right: 0; top: 610px; text-align: center; font-size: 72px; font-weight: 700; letter-spacing: -0.02em; }`, `
    <img id="f${id}-mark" src="${config.brand.mark}" alt="">
    <div id="f${id}-word" class="f${id}-t">${config.brand.name}</div>
    <div id="f${id}-line" class="f${id}-t">the promise, said once.</div>`, `
    slam('#f${id}-word', 0.2);
    tl.fromTo(q('#f${id}-line'), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 1.2);`, { bug: false });
}

rmSync('compositions/frames', { recursive: true, force: true });
mkdirSync('compositions/frames', { recursive: true });
for (const [id, html] of Object.entries(frames)) writeFileSync(`compositions/frames/${id}.html`, html);
console.log('wrote', Object.keys(frames).length, 'frames');
