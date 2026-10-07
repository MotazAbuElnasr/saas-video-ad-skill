// Raw footage for Ad 6 "Speaks your dialect" — the app in Arabic (RTL), quick-add typed the way
// people talk: «مكالمة العميل بكرة ٣ العصر لمدة ساعة» (Egyptian/Gulf "bukra", "3 in the
// afternoon", "for an hour") → a card scheduled tomorrow 15:00 with a 1h estimate. ONE take.
// A whole hour, not «نص ساعة»: the series keeps durations whole (user: "without halfs").
import { scene } from 'video-demo/scene';
import { task, wall } from '../seed/state.ts';

const tasks = [
  task('t1', 'مراجعة العرض التقديمي', { priority: 1, estimationMinutes: 60, scheduledAt: wall(10, 0) }),
  task('t2', 'الرد على رسائل المورّد', { priority: 3, estimationMinutes: 30, scheduledAt: wall(12, 0) }),
  task('t3', 'تجهيز ورشة الفريق', { priority: 2, estimationMinutes: 90, scheduledAt: wall(15, 0) }),
];
const meetings = [
  { id: 'ev_standup', title: 'اجتماع الفريق اليومي', startAt: wall(9, 30), endAt: wall(10, 0), responseStatus: 'accepted' },
  { id: 'ev_design', title: 'مراجعة التصميم', startAt: wall(11, 0), endAt: wall(12, 0), responseStatus: 'accepted' },
];
const groups = [{ id: 'grp_work', name: 'إطلاق المنتج', order: 0, collapsed: false, color: '#8839ef', updatedAt: wall(8, 0) }];
const prefs = {
  free: true, // quick-add parsing is free
  tasks, groups, externalEvents: meetings,
  settings: {
    theme: 'catppuccin-latte', locale: 'ar', activeView: 'board',
    calendar: { viewMode: null, anchorDate: null, defaultBlockMinutes: 30, defaultGroupId: null, prepLeadMinutes: 30, snapMinutes: 15, weekStartsOn: 1, businessHourStart: 9, businessHourEnd: 18, businessHoursEnabled: true, todayStripVisible: true, pollIntervalMinutes: 10, showOverdueCarryover: false, showDeclinedEvents: false, autoTrackMeetings: false, visibleProjectIds: null },
  },
};

scene('ad-arabic-flow', { title: 'ad: Arabic dialect quick-add', blurb: 'One take.', preferences: prefs },
  async ({ actor, page, shot }) => {
    await actor.settle();
    await actor.overlay(false);                        // no parked cursor in the hook / thumbnail
    const add = page.locator('.new-task').first();
    const box = await add.boundingBox();
    if (box) await actor.moveTo({ x: box.x + box.width / 2, y: box.y - 60 }, 20); // hidden: wait above the input, off the cards
    await actor.beat(6000);                            // the hook + brand lines play over the still board
    await actor.overlay(true);
    await actor.click(add);
    await page.waitForSelector('#new-input');
    await actor.type('مكالمة العميل بكرة ٣ العصر لمدة ساعة', 85);
    await actor.beat(600);
    await page.keyboard.press('Enter');
    await actor.beat(250);
    await page.keyboard.press('Escape');
    await actor.overlay(false);
    await actor.moveTo({ x: 300, y: 980 }, 20);        // off the new card: its hover chips stay dark
    await actor.settle();
    await actor.beat(5000);                            // payoff lines + hold
    await shot('result');
  });
