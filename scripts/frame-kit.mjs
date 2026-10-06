// Shared frame builder for a project's gen-frames.mjs. Everything brand-specific comes
// from ad.config.mjs (palette, fonts, brand); frame files are HyperFrames sub-compositions.
//
//   import { makeKit } from '<skill>/scripts/frame-kit.mjs';
//   const { base, footage, card, OVER } = makeKit(config);
//
// Contract notes (each one cost a failed build):
// - Element ids/classes are prefixed "f": a CSS selector may not start with a digit.
// - Footage is a frame-local <video data-frame-video="approved"> that assemble-index hoists
//   to the host. assemble-index STRIPS it from the frame file — always regenerate frames
//   before every assemble (build.sh does).
// - Footage frames are transparent (OVER) and post-assemble.mjs lifts frames above video,
//   so overlays draw on top of the full-screen app.

export function makeKit(config) {
  const P = { ink: '#1c2330', cream: '#fafbfc', accent: '#2563eb', alert: '#dc2626', muted: '#a3acbb', rule: '#39414f', ...config.palette };
  const F = config.fonts ?? {};
  const fontFaces = [
    ...Object.entries(F.display?.files ?? {}).map(([w, src]) => `@font-face { font-family: "${F.display.family}"; font-weight: ${w}; src: url("${src}") format("woff2"); }`),
    ...Object.entries(F.mono?.files ?? {}).map(([w, src]) => `@font-face { font-family: "${F.mono.family}"; font-weight: ${w}; src: url("${src}") format("woff2"); }`),
  ].join('\n  ');
  const display = F.display?.family ?? 'sans-serif';
  const mono = F.mono?.family ?? 'monospace';
  const brand = config.brand ?? {};

  const base = (id, dur, extraCss, body, js, { bug = true, bg = true, ground = P.ink } = {}) => `<template>
<style>
  ${fontFaces}
  #root { position: absolute; inset: 0; overflow: hidden; font-family: "${display}", sans-serif; color: ${P.cream}; }
  #f${id}-bg { position: absolute; inset: 0; background: ${ground}; }
  .f${id}-t { position: absolute; font-weight: 900; letter-spacing: -0.045em; line-height: .9; white-space: nowrap; }
  .f${id}-label { position: absolute; font-family: "${mono}", monospace; font-size: 28px; letter-spacing: .14em; text-transform: uppercase; color: ${P.muted}; white-space: nowrap; }
  /* overlay card: text over the full-screen app, legible on any UI behind it */
  .f${id}-card { position: absolute; background: ${P.ink}f0; border-radius: 8px; padding: 26px 40px 30px; box-shadow: 0 18px 50px rgba(0,0,0,.25); }
  .f${id}-card .f${id}-t, .f${id}-card .f${id}-label { position: static; display: block; }
  /* corner bug: brand visible on frames that don't already show the product's own logo */
  #f${id}-bug { position: absolute; right: 64px; top: 44px; display: flex; align-items: center; gap: 14px; opacity: .75; }
  #f${id}-bug img { width: 40px; height: 40px; }
  #f${id}-bug span { font-weight: 900; font-size: 36px; letter-spacing: -0.03em; }
  ${extraCss}
</style>
<div id="root" data-composition-id="${id}" data-width="1920" data-height="1080" data-duration="${dur}">
  ${bg ? `<div id="f${id}-bg" class="clip" data-start="0" data-duration="${dur}" data-track-index="0"></div>` : ''}
  ${body}
  ${bug && brand.mark ? `<div id="f${id}-bug"><img src="${brand.mark}" alt=""><span>${brand.name ?? ''}</span></div>` : ''}
</div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script>
  (function () {
    const tl = gsap.timeline({ paused: true });
    const q = (s) => document.querySelector('[data-composition-id="${id}"] ' + s);
    // Slam: drops from 1.15 to 1 with a hard settle — the ad's one type entrance.
    const slam = (el, at) => tl.fromTo(q(el), { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 0.26, ease: 'power4.out' }, at);
    // Punch: emphasis on text already on screen (keeps frame 0 composed for the thumbnail).
    const punch = (el, at) => {
      tl.fromTo(q(el), { scale: 1 }, { scale: 1.05, duration: 0.16, ease: 'power3.out' }, at);
      tl.to(q(el), { scale: 1, duration: 0.32, ease: 'power3.out' }, at + 0.16);
    };
    ${js}
    window.__timelines["${id}"] = tl;
  })();
</script>
</template>
`;

  // Full-screen 1:1 footage: the baked shot (assets/shot-<id>.mp4, see bake-clips.mjs).
  const footage = (id, dur, { x = 0, y = 0, w = 1920, h = 1080 } = {}) => `
  <video id="f${id}-v" src="assets/shot-${id}.mp4" muted playsinline data-frame-video="approved" data-start="0" data-duration="${dur}" data-track-index="1" data-frame-video-x="${x}" data-frame-video-y="${y}" data-frame-video-width="${w}" data-frame-video-height="${h}" data-frame-video-fit="fill"></video>`;

  // Overlay card markup. Place it over an EMPTY region of the app, never over the action.
  const card = (id, name, inner) => `<div id="f${id}-${name}" class="f${id}-card">${inner}</div>`;

  // Footage frames: transparent, no corner bug (the product's own logo is on screen).
  const OVER = { bug: false, bg: false };

  return { base, footage, card, OVER, P };
}
