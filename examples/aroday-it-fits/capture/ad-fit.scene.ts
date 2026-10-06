// Raw ad footage for the Hyperframes "It fits" promo — no narration, no camera
// moves (Hyperframes owns framing). Each clip logs beat marks (seconds from the
// callback start ≈ clip start) to the Hyperframes project's capture/ dir.
import { mkdirSync, writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { scene } from 'video-demo/scene';
import { task, wall } from '../seed/state.ts';

// Beat marks are informational; cuts.sh scene-change times are what ad.config.mjs uses.
const OUT = process.env.AD_MARKS_DIR ?? 'demo-out/marks';

const base = [
  task('t1', 'Finish landing page copy', { priority: 0, estimationMinutes: 90, scheduledAt: wall(10, 0) }),
  task('t2', 'Review pull request', { priority: 1, estimationMinutes: 60, scheduledAt: wall(12, 0) }),
  task('t4', 'Reply to vendor emails', { priority: 3, estimationMinutes: 30, scheduledAt: wall(13, 0) }),
  task('t3', 'Prep team workshop', { priority: 2, estimationMinutes: 90, scheduledAt: wall(15, 0) }),
  task('t6', 'Draft Q4 roadmap', { priority: 1, estimationMinutes: 90, scheduledAt: wall(13, 30) }),
];
// Whole-number story (user ask): 9h day − 2h meetings = 7h; 6h planned → 1h free;
// +2h report → 8h / 7h, over by an hour.
const meetings = [
  { id: 'ev_standup', title: 'Team standup', startAt: wall(9, 30), endAt: wall(10, 0), responseStatus: 'accepted' },
  { id: 'ev_design', title: 'Design review', startAt: wall(11, 0), endAt: wall(12, 0), responseStatus: 'accepted' },
  { id: 'ev_wrap', title: 'Wrap-up sync', startAt: wall(16, 30), endAt: wall(17, 0), responseStatus: 'accepted' },
];
const report = (extra: Record<string, unknown> = {}) =>
  task('t5', 'Write quarterly report', { priority: 1, estimationMinutes: 120, dueAt: wall(17 + 48, 0), ...extra });

function marker(name: string) {
  const t0 = Date.now();
  const marks: Record<string, number> = {};
  return {
    mark: (label: string) => { marks[label] = +((Date.now() - t0) / 1000).toFixed(2); },
    save: () => { mkdirSync(OUT, { recursive: true }); writeFileSync(`${OUT}/${name}.json`, JSON.stringify(marks, null, 2)); },
  };
}

async function openDay(page: Page) {
  await page.locator('.calendar .cal-grid').evaluate((el) => {
    const label = [...el.querySelectorAll('.cal-hour-label')].find((n) => n.textContent?.trim() === '8 AM') as HTMLElement | undefined;
    if (label) el.scrollTop = label.offsetTop + 20;
  });
}

// Invisible drop marker in a day column; 64px/hour mirrors pxPerHour in src/features/calendar-grid.tsx.
async function slot(page: Page, dayIndex: number, h: number, m = 0) {
  const id = `demo-slot-${dayIndex}-${h}-${m}`;
  await page.evaluate(({ id, dayIndex, top }) => {
    const col = document.querySelectorAll('.cal-day-col')[dayIndex] as HTMLElement | undefined;
    if (!col || document.getElementById(id)) return;
    const el = document.createElement('div');
    el.id = id;
    el.style.cssText = `position:absolute;left:20%;width:60%;top:${top}px;height:24px;pointer-events:none;opacity:0`;
    col.appendChild(el);
  }, { id, dayIndex, top: (h + m / 60) * 64 + 8 });
  return page.locator(`#${id}`);
}

const cal = { activeView: 'calendar' };

scene('ad-fit-day', { title: 'ad: the day', blurb: 'Calendar + meter at rest.', preferences: { tasks: [...base, report()], settings: cal, externalEvents: meetings } },
  async ({ actor, page, shot }) => {
    const m = marker('ad-fit-day');
    await openDay(page); await actor.settle(); m.mark('ready');
    await actor.hover(page.locator('.cal-capacity'), 1800); m.mark('meter');
    await shot('day'); await actor.beat(1200); m.mark('end'); m.save();
  });

scene('ad-fit-drag', { title: 'ad: drag + conflict + red', blurb: 'Drop the report on today, force it in.', preferences: { tasks: [...base, report()], settings: cal, externalEvents: meetings } },
  async ({ actor, page, shot }) => {
    const m = marker('ad-fit-drag');
    await openDay(page); await actor.settle(); m.mark('ready');
    const card = page.locator('.cal-rail-card-title', { hasText: 'Write quarterly report' }).first();
    await actor.hover(card, 500); m.mark('grab');
    await actor.dragTo(card, await slot(page, 0, 13, 30), { ms: 750 }); m.mark('drop');
    await page.locator('.app-modal').filter({ hasText: 'Overlaps' }).waitFor(); m.mark('dialog');
    await actor.beat(700); await shot('conflict'); // short hold: drag→dialog→click must fit one continuous ad shot
    await actor.click(page.getByRole('button', { name: 'Schedule anyway' })); m.mark('anyway');
    await actor.settle(); await actor.to(page.locator('.cal-capacity')); m.mark('red');
    await shot('red'); await actor.beat(1800); m.mark('end'); m.save();
  });

scene('ad-fit-move', { title: 'ad: move to Thursday', blurb: 'Overbooked day → move the report → fits.', preferences: { tasks: [...base, report({ scheduledAt: wall(13, 30) })], settings: cal, externalEvents: meetings } },
  async ({ actor, page, shot }) => {
    const m = marker('ad-fit-move');
    await openDay(page); await actor.settle(); m.mark('ready');
    await shot('over');
    const block = page.locator('.cal-block-title', { hasText: 'Write quarterly report' }).first();
    await actor.hover(block, 500); m.mark('grab');
    await actor.dragTo(block, await slot(page, 1, 10, 0), { ms: 750 }); m.mark('drop');
    await actor.settle(); await actor.to(page.locator('.cal-capacity')); m.mark('fits');
    await shot('fits'); await actor.beat(1800); m.mark('end'); m.save();
  });
