// Raw footage for Ad 4 "Schedule for me" — ONE take: type a task → it appears →
// card menu → "Schedule for me" → it lands in the day. No camera moves (lesson: zoom
// confuses); short holds so the ad never needs to cut inside a gesture.
import { scene } from 'video-demo/scene';
import { task, wall } from '../seed/state.ts';

// Same 7h world as Ad 1 (2h meetings): the only free hour left today is 17:00–18:00.
const tasks = [
  task('t1', 'Finish landing page copy', { priority: 0, estimationMinutes: 60, scheduledAt: wall(10, 0) }), // 10–11: no overlap with the 11:00 design review
  task('t2', 'Review pull request', { priority: 1, estimationMinutes: 60, scheduledAt: wall(12, 0) }),
  task('t4', 'Reply to vendor emails', { priority: 3, estimationMinutes: 30, scheduledAt: wall(13, 0) }),
  task('t6', 'Draft Q4 roadmap', { priority: 1, estimationMinutes: 90, scheduledAt: wall(13, 30) }),
  task('t3', 'Prep team workshop', { priority: 2, estimationMinutes: 90, scheduledAt: wall(15, 0) }),
];
const meetings = [
  { id: 'ev_standup', title: 'Team standup', startAt: wall(9, 30), endAt: wall(10, 0), responseStatus: 'accepted' },
  { id: 'ev_design', title: 'Design review', startAt: wall(11, 0), endAt: wall(12, 0), responseStatus: 'accepted' },
  { id: 'ev_wrap', title: 'Wrap-up sync', startAt: wall(16, 30), endAt: wall(17, 0), responseStatus: 'accepted' },
];
const prefs = {
  free: true, // per-task "Schedule for me" is free (canAutoScheduleTask) — no PRO badge next to "Start free"
  tasks, externalEvents: meetings,
  // Ad 4's look: the app's own "terminal" theme (dark, phosphor green) — the series varies
  // per ad (user: "similar but not the same"); terminal is one of the tour's curated themes.
  settings: { theme: 'terminal', activeView: 'board', calendar: { viewMode: null, anchorDate: null, defaultBlockMinutes: 30, defaultGroupId: null, prepLeadMinutes: 30, snapMinutes: 15, weekStartsOn: 1, businessHourStart: 9, businessHourEnd: 18, businessHoursEnabled: true, todayStripVisible: true, pollIntervalMinutes: 10, showOverdueCarryover: false, showDeclinedEvents: false, autoTrackMeetings: false, visibleProjectIds: null } },
};

scene('ad-sched-flow', { title: 'ad: type a task → Schedule for me', blurb: 'One take.', preferences: prefs },
  async ({ actor, page, shot }) => {
    await actor.settle();
    await actor.overlay(false);                        // no parked cursor in the hook / thumbnail
    await actor.moveTo({ x: 760, y: 520 }, 20);        // hidden: wait above "new task", off the cards (no hover chips)
    await actor.beat(4500);                            // the hook + brand lines play over the still day
    const add = page.locator('.new-task').first();
    await actor.overlay(true);
    await actor.click(add);
    await page.waitForSelector('#new-input');
    await actor.type('Prepare investor update 1h', 62);
    await actor.beat(350);
    await page.keyboard.press('Enter');
    await actor.beat(250);
    await page.keyboard.press('Escape');
    await actor.beat(300);
    const card = page.locator('.card', { hasText: 'Prepare investor update' }).first();
    await actor.click(card.locator('.card-menu-btn'));  // straight to ⋯ — a hover pause popped tooltips
    await actor.beat(250);
    await actor.click(page.getByText('Schedule for me', { exact: true }).first());
    await actor.overlay(false);                        // the payoff is the timeline, not the cursor
    await actor.moveTo({ x: 1500, y: 985 }, 20);       // off the new card: its hover chips stay dark
    await actor.settle();
    await actor.beat(3600);                            // room for the payoff line, the zoom and the hold
    await shot('result');
  });
