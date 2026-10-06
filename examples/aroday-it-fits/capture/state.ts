// The localStorage blob ("todo:state") the app boots from. Shape mirrors
// scripts/record-demo.mjs in the repo — keep schemaVersion in step with
// src/state/migrations.ts so the app doesn't migrate (and re-stamp) on boot.

export const ANCHOR = '2026-10-07T06:02:00.000Z'; // Wed 09:02 in Africa/Cairo
export const TIMEZONE = 'Africa/Cairo';

const HOUR = 3600000;
const anchor = new Date(ANCHOR).getTime();
// Seeds are written in Cairo wall time: anchor is 09:02 local, so local
// midnight = anchor − 9h02m.
export function wall(h: number, m = 0): string {
  const midnight = anchor - (9 * 60 + 2) * 60000;
  return new Date(midnight + (h * 60 + m) * 60000).toISOString();
}

const past = new Date(anchor - 3 * 24 * HOUR).toISOString();

type Task = Record<string, unknown>;

export function task(id: string, title: string, extra: Task = {}): Task {
  return {
    id, title, groupId: 'grp_work', status: 'queued', priority: 2,
    createdAt: past, updatedAt: past, order: 0,
    notes: '', estimationMinutes: null, scheduledAt: null, dueAt: null,
    ...extra,
  };
}

export function buildState(theme: string, overrides: Record<string, unknown> = {}) {
  const { tasks = [], settings = {}, groups, externalEvents } = overrides as {
    tasks?: Task[]; settings?: Record<string, unknown>; groups?: unknown[]; externalEvents?: unknown[];
  };
  return {
    schemaVersion: 37,
    groups: groups ?? [
      { id: 'grp_work', name: 'Product Launch', order: 0, collapsed: false, color: '#4f8ef7', updatedAt: past },
    ],
    tasks, sessions: [], trash: [], people: [], tombstones: [],
    externalEvents: externalEvents ?? [
      { id: 'ev_standup', title: 'Team standup', startAt: wall(9, 30), endAt: wall(10, 0), responseStatus: 'accepted' },
      { id: 'ev_design', title: 'Design review', startAt: wall(11, 0), endAt: wall(12, 0), responseStatus: 'accepted' },
      { id: 'ev_client', title: 'Client call', startAt: wall(14, 0), endAt: wall(15, 0), responseStatus: 'accepted' },
      { id: 'ev_wrap', title: 'Wrap-up sync', startAt: wall(16, 30), endAt: wall(17, 0), responseStatus: 'accepted' },
    ],
    aiJobs: [], customFieldDefs: [], eventTracking: {},
    settings: {
      theme, locale: 'en', monoFont: 'inter', muted: true, breakStyle: 'orb',
      pomodoroWorkMin: 25, pomodoroBreakMin: 5, pomodoroAutoStart: true,
      hideDone: true, trashTtlEnforcedFrom: past, firstDoneNudgeShown: true,
      dueAlertMinutes: 30, boardLayout: 'multi', activeView: 'board', myId: null,
      privacyBannerAcked: true,
      focusedProjectMode: true, focusedProjectId: 'grp_work',
      focusedViewBadgeDismissed: true, focusedSortMode: 'scheduled',
      activeNowCompact: false, activeNowCompactBadgeDismissed: true,
      lastUsedProjectId: 'grp_work',
      tour: { completedAt: past },
      feedback: {
        firstLaunchAt: past, foregroundMs: 0, promptedAt: [], submittedAt: null,
        dontAskAgain: true, firstPromptMs: 600000,
        phase: { first: { dismissCount: 0, nextPromptAt: null, doneAt: null }, second: { dismissCount: 0, nextPromptAt: null, doneAt: null } },
      },
      google: {
        accessToken: 'demo-token', refreshToken: null,
        tokenExpiresAt: new Date(anchor + 8 * HOUR).toISOString(),
        calendarIds: ['primary'], lastSyncAt: past, syncEnabled: false,
      },
      account: { email: null, name: null, picture: null, signedInAt: null, scopes: [], proWelcomeShown: true },
      calendar: {
        viewMode: null, anchorDate: null, defaultBlockMinutes: 30, defaultGroupId: null,
        prepLeadMinutes: 30, snapMinutes: 15, weekStartsOn: 1,
        businessHourStart: 9, businessHourEnd: 18, businessHoursEnabled: true,
        todayStripVisible: false, pollIntervalMinutes: 10, showOverdueCarryover: false,
        showDeclinedEvents: false, autoTrackMeetings: false, visibleProjectIds: null,
      },
      experimental: { assignees: false },
      ...settings,
    },
    meta: { ownerSub: null, lastModifiedAt: past, lastModifiedBy: 'seed' },
  };
}
