// aro.day "Schedule for me" — frame compositions. Every time is a word cue or a footage mark.
// Look: terminal (config.look) — typewriter entrances, outline cards, the empty In Progress
// column (x ≈ 1120–1890) as the text zone; the app stays fully visible (no scrim).
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

const SKILL = process.env.AD_SKILL ?? `${homedir()}/.claude/skills/saas-video-ad`;
const { config, cue, dur, marks } = await import(`${SKILL}/scripts/timing.mjs`);
const { makeKit } = await import(`${SKILL}/scripts/frame-kit.mjs`);
const { base, footage, P } = makeKit(config);
const frames = {};
const ON = { bg: false, bug: true }; // footage frames: logo pill on (look.bug: bottom-left)

// The empty 17:00–18:00 slot, glowing (pulses: the hook isn't a still) — frames 01–02.
const slot = (id) => `
    #f${id}-slot { position: absolute; left: 1572px; top: 130px; width: 172px; height: 72px; box-sizing: border-box; border-radius: 6px;
      border: 4px solid ${P.accent}; background: ${P.accent}38; box-shadow: 0 0 34px ${P.accent}99; }`;
const pulse = (id, d) => `tl.fromTo(q('#f${id}-slot'), { opacity: 1 }, { opacity: 0.45, duration: 0.8, ease: 'sine.inOut', repeat: ${Math.max(1, Math.floor(d / 0.8))}, yoyo: true }, 0);`;

// 01 — hook: the still day, off-hours shaded (baked), the free slot glowing; lockup + kicker +
// headline in the empty In Progress column below its faint "no tasks" placeholder (y ≈ 568).
// Frame 0 is composed — the thumbnail. Subtitles hidden (captionMoves).
{
  const id = '01-one-free-hour';
  frames[id] = base(id, dur(1), slot(id) + `
    #f${id}-lock { position: absolute; left: 1170px; top: 596px; display: flex; align-items: center; gap: 18px; }
    #f${id}-lock img { width: 84px; height: 84px; }
    #f${id}-lock span { font-weight: 900; font-size: 84px; letter-spacing: -0.03em; } /* ≥ hero size: readable on a phone by 5s */
    #f${id}-k { left: 1174px; top: 716px; font-size: 30px; color: ${P.accent}; }
    #f${id}-a { left: 1164px; top: 770px; font-size: 124px; transform-origin: 0 50%; }
    #f${id}-b { left: 1164px; top: 918px; font-size: 124px; color: ${P.accent}; transform-origin: 0 50%; } /* 148px step (1.19em): line boxes clear */`,
  footage(id, dur(1)) + `
  <div id="f${id}-slot"></div>
  <div id="f${id}-lock" data-brand="hero"><img src="${config.brand.mark}" alt=""><span>${config.brand.name}</span></div>
  <div id="f${id}-k" class="f${id}-label">somewhere in your workday</div>
  <div id="f${id}-a" class="f${id}-t">one free</div>
  <div id="f${id}-b" class="f${id}-t">hour.</div>`, `
    ${pulse(id, dur(1))}
    punch('#f${id}-b', ${cue(1, 'hour') - 0.05});`, { bg: false, bug: false });
}

// 02 — brand promise; the slot keeps glowing while the cursor appears and opens the input.
{
  const id = '02-finds-it';
  frames[id] = base(id, dur(2), slot(id), footage(id, dur(2)) + `<div id="f${id}-slot"></div>`, pulse(id, dur(2)), ON);
}

// 03 — typing; the ⧗ 1h chip ringed (baked) from "1h" to Enter.
{
  const id = '03-type-it';
  frames[id] = base(id, dur(3), '', footage(id, dur(3)), '', ON);
}

// 04 — the menu opens on "menu"; "Schedule for me · Today 05:00 PM" ringed (baked) until the click.
{
  const id = '04-schedule-for-me';
  frames[id] = base(id, dur(4), '', footage(id, dur(4)), '', ON);
}

// 05 — it lands in the slot; the footage zooms into the timeline (baked); outline card typed in
// voice order — "5:00 PM" on "Five", the line on "The" — bottom-left, the proof top-right.
{
  const id = '05-booked';
  frames[id] = base(id, dur(5), `
    #f${id}-c { position: absolute; left: 24px; top: 600px; /* over the zoomed filter row, not beside it (its counts are inflated by an app bug) */ background: ${P.ink}f2; border: 2px solid ${P.accent}; box-shadow: 0 0 42px ${P.accent}40;
      border-radius: 8px; padding: 22px 40px 30px; }
    #f${id}-big { position: static; display: block; font-size: 124px; color: ${P.accent}; }
    #f${id}-l { position: static; display: block; margin-top: 14px; font-size: 30px; color: ${P.cream}; }`, footage(id, dur(5)) + `
    <div id="f${id}-c"><div id="f${id}-big" class="f${id}-t">5:00 PM</div><div id="f${id}-l" class="f${id}-label">the one free hour — booked.</div></div>`, `
    tl.set(q('#f${id}-l'), { clipPath: 'inset(0 100% 0 0)' }, 0);
    tl.fromTo(q('#f${id}-c'), { opacity: 0 }, { opacity: 1, duration: 0.12 }, ${cue(5, 'five') - 0.08});
    enter('#f${id}-big', ${cue(5, 'five') - 0.05});
    enter('#f${id}-l', ${cue(5, 'the') - 0.05});`, ON);
}

// 06 — end card: near-black, the tagline typed with a blinking block cursor, then the CTA
// pill as it is said; holds (pad) before the fade. Subtitles hidden (captionMoves).
{
  const id = '06-brand';
  const tag = 'type it. it finds the time.';
  frames[id] = base(id, dur(6), `
    #f${id}-lock { position: absolute; left: 0; right: 0; top: 300px; display: flex; justify-content: center; align-items: center; gap: 30px; }
    #f${id}-lock img { width: 120px; height: 120px; }
    #f${id}-word { position: static; font-size: 180px; }
    #f${id}-tag { position: absolute; left: 0; right: 0; top: 560px; text-align: center; font-family: "${config.fonts.mono.family}", monospace; font-size: 54px; color: ${P.cream}; white-space: nowrap; }
    #f${id}-cur { color: ${P.accent}; }
    #f${id}-cta { position: absolute; left: 50%; top: 720px; transform: translateX(-50%); padding: 18px 42px; border-radius: 999px;
      background: ${P.accent}; color: ${P.ink}; font-size: 40px; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; }
    #f${id}-all { position: absolute; inset: 0; }`, `
    <div id="f${id}-all">
      <div id="f${id}-lock"><img src="${config.brand.mark}" alt=""><div id="f${id}-word" class="f${id}-t">${config.brand.name}</div></div>
      <div id="f${id}-tag">${tag}<span id="f${id}-cur">▍</span></div>
      <div id="f${id}-cta">Start free at aro.day</div>
    </div>`, `
    tl.fromTo(q('#f${id}-lock'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.05);
    enter('#f${id}-tag', 0.25);
    // cursor blink (GSAP, not CSS: renders seek the timeline, CSS animations would drift)
    tl.to(q('#f${id}-cur'), { opacity: 0, duration: 0.45, ease: 'steps(1)', repeat: ${Math.max(1, Math.floor((dur(6) - 1.4) / 0.45))}, yoyo: true }, ${0.25 + (tag.length + 1) * 0.035});
    enter('#f${id}-cta', ${cue(6, 'start') - 0.1});
    tl.to(q('#f${id}-all'), { opacity: 0, duration: 0.35, ease: 'power2.in' }, ${dur(6) - 0.4});`, { bug: false });
}

rmSync('compositions/frames', { recursive: true, force: true });
mkdirSync('compositions/frames', { recursive: true });
for (const [id, html] of Object.entries(frames)) writeFileSync(`compositions/frames/${id}.html`, html);
console.log('wrote', Object.keys(frames).length, 'frames');
