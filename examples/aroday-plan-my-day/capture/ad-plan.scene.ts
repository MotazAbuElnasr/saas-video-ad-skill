// Raw footage for Ad 5 "Day overview" — the board's day overview (the today strip: tasks,
// meetings and deadlines on one timeline). The client call sits on the roadmap block; drag the
// roadmap bar into the free 15:00–16:30 gap — before its 17:00 deadline. ONE take, no camera
// moves; UI zoom 1.5 so the strip reads (a device setting, rendered sharp — not a crop).
import { scene } from 'video-demo/scene';
import { task, wall } from '../seed/state.ts';

const tasks = [
  task('t1', 'Finish landing page copy', { priority: 0, estimationMinutes: 60, scheduledAt: wall(10, 0) }),
  task('t2', 'Review pull request', { priority: 1, estimationMinutes: 60, scheduledAt: wall(12, 0) }),
  task('t3', 'Reply to vendor emails', { priority: 3, estimationMinutes: 30, scheduledAt: wall(13, 0) }),
  // the clash: 14:00–15:30 under the 14:00–15:00 client call; due 17:00 (the ◆)
  task('t4', 'Draft Q4 roadmap', { priority: 1, estimationMinutes: 90, scheduledAt: wall(14, 0), dueAt: wall(17, 0) }),
  task('t5', 'Prep team workshop', { priority: 2, estimationMinutes: 60, scheduledAt: wall(17, 0) }),
];
// 15:00–16:30 is the only gap that fits 90 minutes before the deadline.
const meetings = [
  { id: 'ev_standup', title: 'Team standup', startAt: wall(9, 30), endAt: wall(10, 0), responseStatus: 'accepted' },
  { id: 'ev_design', title: 'Design review', startAt: wall(11, 0), endAt: wall(12, 0), responseStatus: 'accepted' },
  { id: 'ev_client', title: 'Client call', startAt: wall(14, 0), endAt: wall(15, 0), responseStatus: 'accepted' },
  { id: 'ev_wrap', title: 'Wrap-up sync', startAt: wall(16, 30), endAt: wall(17, 0), responseStatus: 'accepted' },
];
const prefs = {
  free: true, // the day overview is free — no PRO badge next to "Start free"
  uiScale: 1.5, // the max: the strip rows + labels render 1.5× (sharp, not a crop)
  tasks, externalEvents: meetings,
  settings: {
    theme: 'mocha', activeView: 'board',
    calendar: { viewMode: null, anchorDate: null, defaultBlockMinutes: 30, defaultGroupId: null, prepLeadMinutes: 30, snapMinutes: 15, weekStartsOn: 1, businessHourStart: 9, businessHourEnd: 18, businessHoursEnabled: true, todayStripVisible: true, pollIntervalMinutes: 10, showOverdueCarryover: false, showDeclinedEvents: false, autoTrackMeetings: false, visibleProjectIds: null },
  },
};

scene('ad-plan-flow', { title: 'ad: day overview — drag the clash away', blurb: 'One take.', preferences: prefs },
  async ({ actor, page, shot }) => {
    await actor.settle();
    await actor.overlay(false);                         // no parked cursor in the hook / thumbnail
    const bar = page.locator('.today-strip-task-grid .today-strip-block[data-task-id="t4"]').first();
    const grid = await page.locator('.today-strip-task-grid').first().boundingBox();
    const b = await bar.boundingBox();
    if (!grid || !b) throw new Error('strip not rendered');
    // hidden: wait just above the bar, off every other bar (no hover states)
    await actor.moveTo({ x: b.x + b.width / 2, y: b.y - 40 }, 20);
    await actor.beat(7200);                              // hook + brand lines over the still day (frame 1 must start after the parked cursor hides)
    // the strip spans 8:00–19:00: one hour = grid width / 11; +1h moves 14:00 → 15:00
    const hour = grid.width / 11;
    const y = b.y + b.height / 2, x0 = b.x + b.width * 0.35;
    // The app's drag is pointer-based and cancels the compat mouse events, so the engine's cursor
    // (it follows mousemove) froze while the bar slid away — "a bar moving by itself" (review).
    // Mirror every pointer step to the cursor with a synthetic mousemove/mousedown/mouseup.
    const mirror = (type: string, x: number, yy: number) => page.evaluate(([t, cx, cy]) => {
      dispatchEvent(new MouseEvent(t as string, { clientX: cx as number, clientY: cy as number }));
    }, [type, x, yy] as const);
    await actor.overlay(true);
    await actor.moveTo({ x: x0, y }, 320);                // quick approach — press before the hover card opens
    await page.mouse.down();
    // mousedown ON the bar (bubbles to the cursor): the app's hover card closes on it, as
    // hover-preview.ts intends — the strip's pointer drag cancels the real one (a product bug,
    // filed separately), which left the card covering the gap the whole drag.
    await page.evaluate(([cx, cy]) => {
      document.querySelector('.today-strip-task-grid .today-strip-block[data-task-id="t4"]')
        ?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: cx, clientY: cy }));
    }, [x0, y] as const);
    const steps = 40;                                      // ~0.9s of travel at ~22ms a step
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, e = t * t * (3 - 2 * t);       // smoothstep
      const x = x0 + hour * e;
      await page.mouse.move(x, y);
      await mirror('mousemove', x, y);
      await page.waitForTimeout(22);
    }
    await actor.beat(180);
    await page.mouse.up();
    await mirror('mouseup', x0 + hour, y);
    await actor.beat(380);
    await actor.overlay(false);                          // the payoff is the strip, not the cursor
    await actor.moveTo({ x: grid.x + grid.width * 0.5, y: grid.y + 420 }, 20); // off the bars
    await actor.settle();
    await actor.beat(4200);                              // payoff line + hold
    await shot('result');
  });
