// Raw ad footage for one ad — a video-demo scene file. Copy to the video-demo workspace
// (~/.video-demo/<repo>/scenes/<ad>.scene.ts) and film with:
//   DEMO_BUILD=0 DEMO_VOICE=0 DEMO_TOUR=0 ~/.claude/skills/video-demo/scripts/demo --grep <ad>
// Rules: one scene per beat; no spotlight/focus (capture stays wide and still); a
// cause→effect sequence is ONE take; seed the state each beat starts from.
import type { Page } from '@playwright/test';
import { scene } from 'video-demo/scene';
// import { task, wall } from '../seed/state.ts';   // your app's seed helpers

const settle = { settings: { /* the view this ad films */ } };

/** Invisible drop target inside a container — passed as a Locator so it is measured
 *  at drag time (a pre-measured Point goes stale if the camera moved). */
async function dropMarker(page: Page, container: string, index: number, top: number) {
  const id = `demo-drop-${index}-${top}`;
  await page.evaluate(({ id, container, index, top }) => {
    const host = document.querySelectorAll(container)[index] as HTMLElement | undefined;
    if (!host || document.getElementById(id)) return;
    const el = document.createElement('div');
    el.id = id;
    el.style.cssText = `position:absolute;left:20%;width:60%;top:${top}px;height:24px;pointer-events:none;opacity:0`;
    host.appendChild(el);
  }, { id, container, index, top });
  return page.locator(`#${id}`);
}

scene('ad-x-beat1', { title: 'ad: beat 1', blurb: 'The state at rest.', preferences: { tasks: [], ...settle } },
  async ({ actor, page, shot }) => {
    await actor.settle();
    await actor.hover(page.locator('.the-metric'), 1800); // let the viewer read it
    await shot('rest');
  });

scene('ad-x-beat2', { title: 'ad: the action, one take', blurb: 'Approach → act → result.', preferences: { tasks: [], ...settle } },
  async ({ actor, page, shot }) => {
    await actor.settle();
    const thing = page.locator('.the-card').first();
    await actor.hover(thing, 500);                       // approach is part of the take
    await actor.dragTo(thing, await dropMarker(page, '.the-column', 0, 600), { ms: 750 });
    await actor.beat(700);                               // short holds: the ad must not need a cut
    await shot('result');
    await actor.beat(1500);
  });
