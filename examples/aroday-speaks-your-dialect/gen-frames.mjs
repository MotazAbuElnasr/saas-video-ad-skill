// aro.day "Speaks your dialect" — frame compositions, Arabic, right to left. Every time is a word
// cue or a footage mark. Look: catppuccin-latte — faint words that light up as they are said (the
// Schedule ad glitches, Day overview wipes; this one lights up), a highlighter drawn from the
// right, plum cards, a dark dialect lineup, a light end card. Arabic text carries the kit's rtl
// class (letter-spacing breaks joined letters); fonts.script supplies the Arabic glyphs.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

const SKILL = process.env.AD_SKILL ?? `${homedir()}/.claude/skills/saas-video-ad`;
const { config, cue, dur, marks } = await import(`${SKILL}/scripts/timing.mjs`);
const from = (n) => config.sourceFrom({ dur, marks }, n);
const { makeKit } = await import(`${SKILL}/scripts/frame-kit.mjs`);
const { base, footage, card, P } = makeKit(config);
const frames = {};
const ON = { bg: false, bug: true }; // footage frames: logo pill on (look.bug: top-right)

// 01 — hook over the live board: in the empty In Progress column (left in RTL, x ≈ 30–800, below
// its faint "no tasks" note at y ≈ 567): lockup + the question, right-aligned. Frame 0 shows the
// question faint (the thumbnail); each word lights up as it is said; «بكرة» gets a highlighter
// drawn from the right; «غدًا»؟ lands with a shake. Subtitles hidden (captionMoves).
{
  const id = '01-hook';
  // [shown, spoken cue, kind] — kind: 'hl' highlighter, 'hit' the impact word
  const lines = [[['بتكتب', cue(1, 'بتكتب')], ['«بكرة»', cue(1, 'بكرة'), 'hl']],
                 [['ولا', cue(1, 'ولا')], ['«غدًا»؟', cue(1, 'غدًا'), 'hit']]];
  let k = 0;
  const filled = lines.map((l) => l.map(([w, , kind]) => `<span id="f${id}-w${k++}"${kind ? ' class="acc"' : ''}>${w}</span>`).join(' ')).join('<br>');
  const ghost = lines.map((l) => l.map(([w, , kind]) => (kind ? `<span class="acc" data-layout-allow-overlap>${w}</span>` : w)).join(' ')).join('<br>');
  const words = lines.flat();
  const hl = words.findIndex(([, , kind]) => kind === 'hl');
  frames[id] = base(id, dur(1), `
    #f${id}-lock { position: absolute; right: 1160px; top: 566px; display: flex; align-items: center; gap: 16px; color: ${P.text}; }
    #f${id}-lock img { width: 64px; height: 64px; }
    #f${id}-lock span { font-weight: 900; font-size: 64px; letter-spacing: -0.03em; }
    #f${id}-type { position: absolute; inset: 0; }
    #f${id}-h, #f${id}-g { position: absolute; right: 1160px; top: 650px; font-weight: 900; font-size: 98px; /* 2 lines end ≈ 910, inside the column (border at 940) */ line-height: 1.32; color: ${P.text}; text-align: right; white-space: nowrap; }
    #f${id}-h .acc, #f${id}-g .acc { color: ${P.accent}; }
    #f${id}-h span { display: inline-block; } /* inline spans ignore transforms */
    #f${id}-g { opacity: .45; } /* the faint question: frame 0 reads (.3 was ~1.6:1), words light up as they are said */
    /* the highlighter: lavender under the bottom of the word, grown from the right (RTL); margin cancels padding so it never shifts off the faint copy */
    #f${id}-w${hl} { background: linear-gradient(transparent 62%, ${P.glow}b0 62%) no-repeat right; background-size: 0% 100%; padding: 0 8px; margin: 0 -8px; }`,
  footage(id, dur(1)) + `
  <div id="f${id}-lock" data-brand="hero"><img src="${config.brand.mark}" alt=""><span>${config.brand.name}</span></div>
  <div id="f${id}-type">
    <div id="f${id}-g" class="f${id}-rtl" data-layout-allow-occlusion data-layout-allow-overlap>${ghost}</div>
    <div id="f${id}-h" class="f${id}-rtl" data-layout-allow-overlap>${filled}</div>
  </div>`, `
    ${words.map(([, at, kind], i) => kind === 'hit'
      ? `hit('#f${id}-w${i}', ${at - 0.04}, { from: 2.4, blur: 16 }); shake('#f${id}-type', ${at + 0.02}, 12); flash(${at + 0.02}, 0.14);`
      : `hit('#f${id}-w${i}', ${at - 0.04}, { from: 1.7, blur: 10 });`).join('\n    ')}
    tl.to(q('#f${id}-w${hl}'), { backgroundSize: '100% 100%', duration: 0.35, ease: 'power2.out' }, ${words[hl][1] + 0.22});`,
  { bg: false, bug: false });
}

// 02 — the push-in on «فاهم» (baked); 03 — typing, the chips ringed (baked). Subtitles carry them.
frames['02-both'] = base('02-both', dur(2), '', footage('02-both', dur(2)), '', ON);

// The payoff band: across the top of the zoomed board, over the filter row (after Enter an app bug
// counts the new card in every chip — "Today 4" beside «بكرة») and the column headers. It arrives
// WITH the card, at Enter inside 03, fully composed; 04 keeps it and punches its parts as said.
const bandCss = (id) => `
    #f${id}-band { position: absolute; left: 40px; right: 40px; top: 60px; height: 236px; box-sizing: border-box; padding: 26px 48px;
      background: ${P.ink}; border-radius: 10px; box-shadow: 0 18px 50px rgba(0,0,0,.28); text-align: right; }
    #f${id}-band .l { font-size: 34px; font-weight: 700; color: ${P.glow}; }
    #f${id}-band .b { margin-top: 6px; font-size: 112px; font-weight: 900; line-height: 1.2; color: ${P.cream}; white-space: nowrap; }
    #f${id}-band .b span { display: inline-block; }
    #f${id}-band .s { color: ${P.glow}; font-size: 64px; font-weight: 800; }`;
const band = (id) => `<div id="f${id}-band" class="f${id}-rtl" data-layout-allow-overlap><div class="l">مكالمة العميل</div><div class="b"><span id="f${id}-time">غدًا ١٥:٠٠</span> <span id="f${id}-dur" class="s">· لمدة ساعة</span></div></div>`;

// 03 — typing, the chips ringed (baked); at Enter the card appears (pop) and the band lands.
{
  const id = '03-type';
  const at = +(marks.enter - from(3)).toFixed(2);
  frames[id] = base(id, dur(3), bandCss(id), footage(id, dur(3)) + band(id), `
    hit('#f${id}-band', ${at - 0.02}, { from: 1.25, blur: 8 });`, ON);
}

// 04 — set: the card's chips ringed (baked); the band (already there from Enter) punches the time on
// the spoken «بكرة» and the duration on «ومدتها». Subtitles hidden (the band says it).
{
  const id = '04-set';
  frames[id] = base(id, dur(4), bandCss(id), footage(id, dur(4)) + band(id), `
    punch('#f${id}-time', ${cue(4, 'بكرة') - 0.04}); flash(${cue(4, 'بكرة') + 0.02}, 0.1);
    punch('#f${id}-dur', ${cue(4, 'ومدتها') - 0.04});`, ON);
}

// 05 — the lineup on a dark plum ground: five dialects right to left, each with its own word for
// "tomorrow" (every one parses in the app — src/lib/quick-parse-ar.ts), slamming in as the dialect
// is said; «كله مفهوم.» hits with a flash. Subtitles hidden.
{
  const id = '05-dialects';
  const cols = [['مصري', 'بكرة'], ['خليجي', 'باچر'], ['شامي', 'بكرا'], ['مغربي', 'غدا'], ['فصحى', 'غدًا']];
  frames[id] = base(id, dur(5), `
    #f${id}-row { position: absolute; left: 60px; right: 60px; top: 280px; display: flex; justify-content: center; gap: 64px; } /* natural widths + real gaps: fixed 330px columns let the words touch */
    .f${id}-col { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .f${id}-col .n { font-size: 48px; font-weight: 700; color: ${P.cream}c0; } /* readable on a phone: 42px grey was too faint */
    .f${id}-col .w { font-size: 104px; font-weight: 900; color: ${P.glow}; line-height: 1.25; }
    #f${id}-all { position: absolute; left: 0; right: 0; top: 700px; text-align: center; font-size: 140px; font-weight: 900; color: ${P.cream}; line-height: 1.25; }`, `
    <div id="f${id}-row" class="f${id}-rtl" data-layout-allow-overlap>${cols.map(([n, w], i) => `<div class="f${id}-col" id="f${id}-c${i}"><div class="n">${n}</div><div class="w">${w}</div></div>`).join('')}</div>
    <div id="f${id}-all" class="f${id}-rtl" data-layout-allow-overlap>كله مفهوم.</div>`, `
    ${cols.map(([n], i) => `hit('#f${id}-c${i}', ${cue(5, n) - 0.04}, { from: 1.9, blur: 12 }); shake('#f${id}-row', ${cue(5, n) + 0.02}, 6);`).join('\n    ')}
    hit('#f${id}-all', ${cue(5, 'كله') - 0.04}, { from: 2.4, blur: 18 }); flash(${cue(5, 'كله') + 0.02}, 0.22); shake('#f${id}-row', ${cue(5, 'كله') + 0.02}, 14);`, { bug: true, ground: P.ink }); // the pill: brand on screen on the non-app frame too
}

// 06 — light end card, composed from its first frame: lockup (punches), «اكتب زي ما بتتكلم.»
// wiping in from the right, the CTA hitting as it is said; holds to the last frame (no fade).
{
  const id = '06-brand';
  frames[id] = base(id, dur(6), `
    #f${id}-lock { position: absolute; left: 0; right: 0; top: 300px; display: flex; justify-content: center; align-items: center; gap: 30px; color: ${P.ink}; }
    #f${id}-lock img { width: 120px; height: 120px; }
    #f${id}-word { position: static; font-size: 180px; color: ${P.ink}; }
    #f${id}-line { left: 0; right: 0; top: 555px; text-align: center; font-size: 74px; font-weight: 800; color: ${P.text}; line-height: 1.3; }
    #f${id}-line b { color: ${P.accent}; font-weight: 900; }
    #f${id}-cta { position: absolute; left: 50%; top: 740px; transform: translateX(-50%); padding: 18px 46px; border-radius: 999px;
      background: ${P.accent}; color: #ffffff; font-size: 44px; font-weight: 800; white-space: nowrap; }`, `
    <div id="f${id}-lock"><img src="${config.brand.mark}" alt=""><div id="f${id}-word" class="f${id}-t">${config.brand.name}</div></div>
    <div id="f${id}-line" class="f${id}-t f${id}-rtl">اكتب <b>زي ما بتتكلم.</b></div>
    <div id="f${id}-cta" class="f${id}-rtl">ابدأ مجانًا على aro.day</div>`, `
    punch('#f${id}-lock', 0.3);
    hit('#f${id}-cta', ${cue(6, 'ابدأ') - 0.06}, { from: 1.5, blur: 8 });`, { bug: false, ground: P.cream });
}

rmSync('compositions/frames', { recursive: true, force: true });
mkdirSync('compositions/frames', { recursive: true });
for (const [id, html] of Object.entries(frames)) writeFileSync(`compositions/frames/${id}.html`, html);
console.log('wrote', Object.keys(frames).length, 'frames');
