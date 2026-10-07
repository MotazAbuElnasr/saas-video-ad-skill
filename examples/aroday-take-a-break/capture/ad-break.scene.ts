// Raw footage for the break ad — ONE take: three timers tick past 25:00 → the real
// "Break time" reminder → Start break → breathing orb with the chosen quote → the break
// ends → the three timers resume. The engine pins the clock; tick() advances it 1s per
// real second so timers and the countdown visibly run. No camera moves.
import type { Page } from '@playwright/test';
import { scene } from 'video-demo/scene';
import { ANCHOR, task, wall } from '../seed/state.ts';

const startedAgo = (24 * 60 + 48) * 1000; // timers open at 24:48 → the 25:00 reminder lands on camera
const since = new Date(Date.parse(ANCHOR) - startedAgo).toISOString();
// In Progress before the break, so the board looks the same after it (the reviewer saw them
// jump Queued → In Progress); earlier sessions in totalMs so the totals visibly carry over.
const running = { status: 'in-progress', scheduledAt: wall(9, 0), runningSince: since };
const min = 60_000;
const tasks = [
  task('t1', 'Draft Q4 roadmap', { ...running, priority: 1, estimationMinutes: 90, totalMs: 40 * min }),
  task('t2', 'Review pull request', { ...running, priority: 1, estimationMinutes: 60, totalMs: 15 * min }),
  task('t3', 'Reply to vendor emails', { ...running, priority: 3, estimationMinutes: 30 }),
  task('t4', 'Prep team workshop', { priority: 2, estimationMinutes: 90, scheduledAt: wall(15, 0) }),
];
const prefs = {
  free: true, // the break is a free feature — no PRO badge next to "Start free"
  tasks,
  settings: {
    activeView: 'board', breakStyle: 'orb', pomodoroWorkMin: 25, pomodoroBreakMin: 5, pomodoroAutoStart: true,
    notifications: { breakReminders: true, nudgeIntervalMinutes: 15 },
  },
};

// The quote the orb shows — chosen from the app's own BREAK_QUOTES (selection only; the app
// renders it as it always does). The app's own unattributed line: no third-party name read in
// a paid ad, and it pays off the hook ("When did you last look up?").
const QUOTE_START = 'Look up. The screen';

let now = Date.parse(ANCHOR);
async function tick(page: Page, seconds: number) {
  for (let i = 0; i < seconds; i++) {
    now += 1000;
    await page.clock.setFixedTime(new Date(now));
    await page.waitForTimeout(1000);
  }
}

scene('ad-break-flow', { title: 'ad: take a break (one take)', blurb: 'Timers → reminder → orb → resume.', preferences: prefs },
  async ({ actor, page, shot }) => {
    now = Date.parse(ANCHOR);
    await page.evaluate((start) => {
      const w = window as unknown as { BREAK_QUOTES?: { en: { text: string } }[]; pickLocaleQuote?: (q: unknown) => unknown; pickRandomBreakQuote?: () => unknown };
      const q = w.BREAK_QUOTES?.find((x) => x.en.text.startsWith(start));
      if (q && w.pickLocaleQuote) w.pickRandomBreakQuote = () => w.pickLocaleQuote!(q);
    }, QUOTE_START);
    await actor.settle();
    await actor.overlay(false);                        // no parked cursor in the thumbnail / hook
    await tick(page, 12);                              // 24:48 → 25:00: the reminder fires
    await tick(page, 2);                               // ~2s to read it, then the click (no dead air)
    const start = page.getByRole('button', { name: 'Start break' }).first();
    await actor.overlay(true);
    await actor.click(start);
    await actor.overlay(false);                        // cursor off right after the click
    await page.locator('.break-overlay.style-orb').waitFor();
    await tick(page, 13);                              // ~two breaths of the orb (6s cycle)
    await shot('orb');
    await actor.overlay(false);                        // shot() re-shows the cursor — hide it again
    await tick(page, 2);
    now += 4 * 60 * 1000 + 40 * 1000;                  // jump near the end of the 5:00 break
    await page.clock.setFixedTime(new Date(now));
    await tick(page, 6);                               // break ends → timers auto-resume
    await shot('resumed');
    await actor.overlay(false);
    await tick(page, 10);                              // room for the line + the hold
  });
