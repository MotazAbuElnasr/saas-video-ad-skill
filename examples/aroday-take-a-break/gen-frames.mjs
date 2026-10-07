// aro.day "Take a break" — frame compositions. Every time is a word cue or a footage mark.
// Look: calm (config.look) — rise entrances, paper cards on the board, clear amber type over
// the dark break screen, a dark warm hook banner + orb end card (bookends), a logo pill on
// every footage frame.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

const SKILL = process.env.AD_SKILL ?? `${homedir()}/.claude/skills/saas-video-ad`;
const { config, cue, dur, marks } = await import(`${SKILL}/scripts/timing.mjs`);
const { makeKit } = await import(`${SKILL}/scripts/frame-kit.mjs`);
const { base, footage, card, P } = makeKit(config);
const frames = {};
const from = (n) => config.sourceFrom({ dur, marks }, n);
const local = (n, t) => +(t - from(n)).toFixed(2);
// Footage frames: transparent, logo pill on (the app's own logo is ~70×20px — too small to count).
const ON = { bg: false, bug: true };
const WARM = '#24211d'; // hook banner + end card ground: the bookends

// 01 — hook over the LIVE, undimmed board (three timers ticking): a dark warm banner across the
// empty lower board + the hero lockup in the empty Queued area. Frame 0 is composed — the
// thumbnail. Subtitles hidden (captionMoves): the banner says the line.
{
  const id = '01-juggling';
  frames[id] = base(id, dur(1), `
    #f${id}-lock { position: absolute; left: 372px; top: 584px; display: flex; align-items: center; gap: 20px; color: ${P.ink}; }
    #f${id}-lock img { width: 96px; height: 96px; }
    #f${id}-lock span { font-weight: 900; font-size: 96px; letter-spacing: -0.035em; }
    #f${id}-ban { position: absolute; left: 340px; top: 752px; width: 1550px; box-sizing: border-box; padding: 26px 44px 34px;
      background: ${WARM}; border-radius: 10px; box-shadow: 0 22px 60px rgba(0,0,0,.28); }
    #f${id}-ban .f${id}-label { position: static; display: block; font-size: 32px; color: ${P.glow}; }
    #f${id}-ban .f${id}-t { position: static; display: block; margin-top: 14px; font-size: 92px; color: ${P.cream}; transform-origin: 0 50%; }
    #f${id}-ban em { font-style: normal; color: ${P.glow}; }`,
  footage(id, dur(1)) + `
  <div id="f${id}-lock" data-brand="hero"><img src="${config.brand.mark}" alt=""><span>${config.brand.name}</span></div>
  <div id="f${id}-ban"><div class="f${id}-label">juggling 3 tasks in parallel</div><div id="f${id}-h" class="f${id}-t">when did you last <em>look up?</em></div></div>`, `
    punch('#f${id}-h', ${cue(1, 'when') - 0.05});`, { bg: false, bug: false });
}

// 02 — the reminder toast (ring baked); paper card in the empty Queued column (below the
// "Prep team workshop" card, which ends at y ≈ 526).
{
  const id = '02-reminder';
  frames[id] = base(id, dur(2), `
    #f${id}-c { left: 372px; top: 552px; }
    #f${id}-big { font-size: 88px; margin-top: 10px; }`, footage(id, dur(2)) +
    card(id, 'c', `<div class="f${id}-label">after 25 min</div><div id="f${id}-big" class="f${id}-t">break time.</div>`), `
    enter('#f${id}-c', ${local(2, marks.reminder) + 0.2});`, ON);
}

// 03 — "Take five." as the cursor heads for Start break (toast still ringed).
{
  const id = '03-take-five';
  frames[id] = base(id, dur(3), '', footage(id, dur(3)), '', ON);
}

// 04 — the orb: "Breathe" lands as it fades in. Nothing added — the orb is the beat.
{
  const id = '04-orb';
  frames[id] = base(id, dur(4), '', footage(id, dur(4)), '', ON);
}

// 05 — the quote, zoomed + ringed in the footage; it is on screen, so no subtitle (captionMoves).
{
  const id = '05-quote';
  frames[id] = base(id, dur(5), '', footage(id, dur(5)), '', ON);
}

// 06 — "auto-resumes 3 timers when done" ringed; clear amber type in the dark left margin,
// entering with the line (v2 came in 0.85s late).
{
  const id = '06-timers-wait';
  frames[id] = base(id, dur(6), `
    #f${id}-c { left: 130px; top: 430px; }
    #f${id}-c .f${id}-label { color: ${P.cream}; opacity: .85; }
    #f${id}-big { font-size: 96px; color: ${P.glow}; margin-top: 12px; }`, footage(id, dur(6)) +
    card(id, 'c', `<div class="f${id}-label">your 3 tasks</div><div id="f${id}-big" class="f${id}-t">wait for you.</div>`, 'clear'), `
    enter('#f${id}-c', ${Math.max(0, cue(6, 'your') - 0.05)});`, ON);
}

// 07 — cut over the 5-minute jump to the same board; the card names the jump from the cut;
// the three running cards ringed at "all three" (baked).
{
  const id = '07-back-in';
  frames[id] = base(id, dur(7), `
    #f${id}-c { left: 372px; top: 552px; }
    #f${id}-big { font-size: 88px; margin-top: 10px; }`, footage(id, dur(7)) +
    card(id, 'c', `<div class="f${id}-label">after 5 min</div><div id="f${id}-big" class="f${id}-t">all 3 back on.</div>`), `
    enter('#f${id}-c', 0.1);`, ON);
}

// 08 — the orb end card (cut in): breathing amber glow, lockup, the tagline WITH the voice, the
// CTA as it is said; holds ≥ 1.5s (pad) to the last frame — no fade to blank. Subtitles hidden.
{
  const id = '08-brand';
  frames[id] = base(id, dur(8), `
    #f${id}-orb { position: absolute; left: 50%; top: 250px; width: 360px; height: 360px; margin: -180px 0 0 -180px; border-radius: 50%;
      background: radial-gradient(circle, ${P.glow} 0%, ${P.glow}40 50%, transparent 70%); filter: blur(3px); }
    #f${id}-lock { position: absolute; left: 0; right: 0; top: 420px; display: flex; justify-content: center; align-items: center; gap: 34px; }
    #f${id}-lock img { width: 128px; height: 128px; }
    #f${id}-word { position: static; font-size: 200px; }
    #f${id}-line { left: 0; right: 0; top: 690px; text-align: center; font-size: 70px; font-weight: 700; letter-spacing: -0.02em; }
    #f${id}-line b { color: ${P.glow}; font-weight: 900; }
    #f${id}-cta { position: absolute; left: 50%; top: 830px; transform: translateX(-50%); padding: 18px 40px; border-radius: 999px;
      background: ${P.glow}; color: ${P.ink}; font-size: 40px; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; }
    #f${id}-all { position: absolute; inset: 0; }`, `
    <div id="f${id}-all">
      <div id="f${id}-orb"></div>
      <div id="f${id}-lock"><img src="${config.brand.mark}" alt=""><div id="f${id}-word" class="f${id}-t">${config.brand.name}</div></div>
      <div id="f${id}-line" class="f${id}-t">focus hard. <b>rest on time.</b></div>
      <div id="f${id}-cta">Start free at aro.day</div>
    </div>`, `
    tl.fromTo(q('#f${id}-orb'), { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1.05, duration: 3, ease: 'sine.inOut' }, 0);
    tl.to(q('#f${id}-orb'), { scale: 0.8, opacity: 0.7, duration: 3, ease: 'sine.inOut' }, 3);
    enter('#f${id}-lock', 0.1);
    enter('#f${id}-line', ${cue(8, 'focus') - 0.12});
    enter('#f${id}-cta', ${cue(8, 'start') - 0.12});`, { bug: false, ground: WARM });
}

rmSync('compositions/frames', { recursive: true, force: true });
mkdirSync('compositions/frames', { recursive: true });
for (const [id, html] of Object.entries(frames)) writeFileSync(`compositions/frames/${id}.html`, html);
console.log('wrote', Object.keys(frames).length, 'frames');
