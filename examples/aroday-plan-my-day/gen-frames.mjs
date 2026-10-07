// aro.day "Day overview" — frame compositions. Every time is a word cue or a footage mark.
// Look: mocha (config.look) — wipe entrances, a highlighter headline, espresso cards, a light end
// card with a strip motif. The footage pushes in on the strip in 02 (baked); overlays don't zoom.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

const SKILL = process.env.AD_SKILL ?? `${homedir()}/.claude/skills/saas-video-ad`;
const { config, cue, dur, marks } = await import(`${SKILL}/scripts/timing.mjs`);
const { makeKit } = await import(`${SKILL}/scripts/frame-kit.mjs`);
const { base, footage, card, P } = makeKit(config);
const frames = {};
const from = (n) => config.sourceFrom({ dur, marks }, n);
const local = (n, t) => +(t - from(n)).toFixed(2);
const ON = { bg: false, bug: true }; // footage frames: logo pill on (look.bug: bottom-left)

// 01 — hook over the live board (UI zoom 1.5): the clash ringed in the footage from frame 0; in
// the empty In Progress column (x ≈ 1170–1890, below its header at y ≈ 600): lockup, kicker and
// the headline. Kinetic, mocha-style (the Schedule ad glitches; this one is editorial): frame 0
// shows the headline in espresso OUTLINE (the thumbnail), each word wipes in as it is said,
// "landed" hits with a shake, and a highlighter swipes under "roadmap". Subtitles hidden.
{
  const id = '01-clash';
  // [shown word, spoken cue] per line — the voice says "roadmap block"; the screen stops at "roadmap."
  const lines = [[['your', cue(1, 'your')], ['client', cue(1, 'client')], ['call', cue(1, 'call')]],
                 [['just', cue(1, 'just')], ['landed', cue(1, 'landed')], ['on', cue(1, 'on')]],
                 [['your', cue(1, 'your', 1)], ['roadmap.', cue(1, 'roadmap')]]];
  const L = cue(1, 'landed'), R = cue(1, 'roadmap');
  const words = lines.flat();
  frames[id] = base(id, dur(1), `
    #f${id}-lock { position: absolute; left: 1192px; top: 640px; display: flex; align-items: center; gap: 16px; color: ${P.ink}; }
    #f${id}-lock img { width: 64px; height: 64px; }
    #f${id}-lock span { font-weight: 900; font-size: 64px; letter-spacing: -0.03em; }
    #f${id}-k { left: 1196px; top: 728px; font-size: 26px; color: ${P.accent}; }
    #f${id}-type { position: absolute; inset: 0; }
    #f${id}-h, #f${id}-g { position: absolute; left: 1190px; top: 770px; font-weight: 900; font-size: 66px; line-height: 1.22; letter-spacing: -0.035em; color: ${P.ink}; white-space: nowrap; }
    #f${id}-h span { display: inline-block; } /* inline spans ignore transforms and clip-path */
    /* outline: the stroke paints, the fill is meant to be empty (gradient form = intentional for the checker) */
    #f${id}-g { color: transparent !important; background-image: linear-gradient(transparent, transparent); -webkit-background-clip: text; background-clip: text; -webkit-text-stroke: 3px ${P.ink}; } /* 3px, full: 2px at .9 was faint at phone width */
    /* the highlighter: a mocha marker stroke under the bottom of the word; margin cancels padding so it never shifts off the outline */
    #f${id}-w${words.length - 1} { background: linear-gradient(transparent 55%, ${P.mocha}99 55%) no-repeat; background-size: 0% 100%; padding: 0 6px; margin: 0 -6px; }`,
  footage(id, dur(1)) + `
  <div id="f${id}-lock" data-brand="hero"><img src="${config.brand.mark}" alt=""><span>${config.brand.name}</span></div>
  <div id="f${id}-k" class="f${id}-label">wednesday · 2:00 pm</div>
  <div id="f${id}-type">
    <div id="f${id}-g" data-layout-allow-occlusion>${lines.map((l) => l.map(([w]) => w).join(' ')).join('<br>')}</div>
    <div id="f${id}-h" data-layout-allow-overlap>${(() => { let k = 0; return lines.map((l) => l.map(([w]) => `<span id="f${id}-w${k++}">${w}</span>`).join(' ')).join('<br>'); })()}</div>
  </div>`, `
    ${words.map(([w, at], k) => w === 'landed'
      ? `hit('#f${id}-w${k}', ${at - 0.04}, { from: 2.2, blur: 12 }); shake('#f${id}-type', ${at + 0.02}, 9); flash(${at + 0.02}, 0.16);`
      : `tl.fromTo(q('#f${id}-w${k}'), { clipPath: 'inset(-25% 100% -40% -8%)' }, { clipPath: 'inset(-25% -8% -40% -8%)', duration: 0.18, ease: 'power3.out' }, ${at - 0.03});`).join('\n    ')}
    tl.to(q('#f${id}-w${words.length - 1}'), { backgroundSize: '100% 100%', duration: 0.35, ease: 'power2.out' }, ${R + 0.25});`,
  { bg: false, bug: false });
}

// 02 — the push-in on the strip (baked: nothing moves while the camera does).
{
  const id = '02-one-line';
  frames[id] = base(id, dur(2), '', footage(id, dur(2)), '', ON);
}

// 03 — the drag, camera held; the free 15:00–16:30 gap ringed (baked) before the bar lands in it.
{
  const id = '03-drag';
  frames[id] = base(id, dur(3), '', footage(id, dur(3)), '', ON);
}

// 04 — it fits; the agenda re-sorts; an OPAQUE espresso card left, over the zoomed board toolbar —
// clear of the strip, the agenda and YouTube's bottom-right Skip zone (review). "90 min" hits on
// "Ninety"; "no clash." wipes in on "No".
{
  const id = '04-fits';
  frames[id] = base(id, dur(4), `
    #f${id}-c { left: 60px; top: 680px; background: ${P.ink}; } /* 680: at 640 it cut into the agenda row's + Plan */
    #f${id}-c .f${id}-label { color: ${P.cream}; opacity: .8; }
    #f${id}-big { font-size: 84px; margin-top: 10px; color: ${P.cream}; }
    #f${id}-big span { display: inline-block; }
    #f${id}-big em { font-style: normal; color: ${P.mocha}; }`, footage(id, dur(4)) +
    card(id, 'c', `<div class="f${id}-label">3:00 – 4:30 pm</div><div id="f${id}-big" class="f${id}-t" data-layout-allow-overlap><span id="f${id}-n">90 min ·</span> <span id="f${id}-nc"><em>no clash.</em></span></div>`), `
    tl.fromTo(q('#f${id}-c'), { opacity: 0 }, { opacity: 1, duration: 0.1 }, ${cue(4, 'ninety') - 0.08});
    hit('#f${id}-n', ${cue(4, 'ninety') - 0.04}, { from: 2.2, blur: 14 });
    shake('#f${id}-c', ${cue(4, 'ninety') + 0.02}, 9); flash(${cue(4, 'ninety') + 0.02}, 0.14);
    tl.fromTo(q('#f${id}-nc'), { clipPath: 'inset(-25% 100% -40% -8%)' }, { clipPath: 'inset(-25% -8% -40% -8%)', duration: 0.3, ease: 'power3.out' }, ${cue(4, 'no') - 0.05});`, ON);
}

// 05 — light end card, composed from its first frame (review: no blank start, no fade to blank):
// the strip motif starts scattered and snaps into one line, the lockup punches as it lands, the
// tagline wipes in, the CTA hits as it is said; holds to the last frame.
{
  const id = '05-brand';
  const bars = [[0, 120, P.mocha], [150, 110, P.accent], [290, 170, P.mocha], [490, 90, P.ink], [610, 150, P.accent]];
  frames[id] = base(id, dur(5), `
    #f${id}-strip { position: absolute; left: 50%; top: 250px; width: 760px; height: 34px; margin-left: -380px; }
    #f${id}-strip .ln { position: absolute; left: 0; right: 0; top: 16px; height: 2px; background: ${P.rule}55; }
    #f${id}-strip .b { position: absolute; top: 4px; height: 26px; border-radius: 6px; }
    #f${id}-lock { position: absolute; left: 0; right: 0; top: 360px; display: flex; justify-content: center; align-items: center; gap: 30px; color: ${P.ink}; }
    #f${id}-lock img { width: 120px; height: 120px; }
    #f${id}-word { position: static; font-size: 180px; color: ${P.ink}; }
    #f${id}-line { left: 0; right: 0; top: 620px; text-align: center; font-size: 66px; font-weight: 700; letter-spacing: -0.02em; color: ${P.ink}; }
    #f${id}-line b { color: ${P.accent}; font-weight: 900; }
    #f${id}-cta { position: absolute; left: 50%; top: 760px; transform: translateX(-50%); padding: 18px 42px; border-radius: 999px;
      background: ${P.ink}; color: ${P.cream}; font-size: 40px; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; }`, `
    <div id="f${id}-strip"><div class="ln"></div>${bars.map(([x, w, c], i) => `<div class="b" id="f${id}-b${i}" style="left:${x}px;width:${w}px;background:${c}"></div>`).join('')}</div>
    <div id="f${id}-lock"><img src="${config.brand.mark}" alt=""><div id="f${id}-word" class="f${id}-t">${config.brand.name}</div></div>
    <div id="f${id}-line" class="f${id}-t">your whole day. <b>one line.</b></div>
    <div id="f${id}-cta">Start free at aro.day</div>`, `
    ${bars.map((_, i) => `tl.fromTo(q('#f${id}-b${i}'), { y: ${i % 2 ? 44 : -44}, x: ${(i - 2) * 18} }, { y: 0, x: 0, duration: 0.34, ease: 'back.out(1.8)' }, ${(0.08 + i * 0.06).toFixed(2)});`).join('\n    ')}
    punch('#f${id}-lock', 0.42);
    enter('#f${id}-line', 0.55);
    hit('#f${id}-cta', ${cue(5, 'start') - 0.06}, { from: 1.5, blur: 8 });`, { bug: false, ground: P.ground });
}

rmSync('compositions/frames', { recursive: true, force: true });
mkdirSync('compositions/frames', { recursive: true });
for (const [id, html] of Object.entries(frames)) writeFileSync(`compositions/frames/${id}.html`, html);
console.log('wrote', Object.keys(frames).length, 'frames');
