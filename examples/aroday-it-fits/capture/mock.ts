import type { Page, Route } from '@playwright/test';

import type { MockContext } from 'video-demo/define';

export function json(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const LOCAL = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//;
const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

export async function mock(page: Page, _ctx: MockContext): Promise<unknown> {
  // Nothing leaves the machine: Google APIs, analytics, Dodo — all dropped.
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (LOCAL.test(url) || FONTS.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
      return route.fallback();
    }
    return route.abort();
  });

  // Worker API catch-all.
  await page.route('**/api/**', (route) => json(route, {}));

  // pickStorage() probes /api/state to attach to the dev Bun server; a 404
  // makes it fall back to the localStorage adapter the seed lives in.
  await page.route('**/api/state**', (route) => json(route, { error: 'not found' }, 404));

  // Plan-my-day: place each candidate into the next free slot after 10:00,
  // stepping over the seeded meetings, so the preview reads as a real plan.
  await page.route('**/api/plan-my-day', async (route) => {
    const body = route.request().postDataJSON() as { tasks?: { id: string; estimationMinutes?: number }[] };
    const busy = [[9 * 60 + 30, 10 * 60], [11 * 60, 12 * 60], [14 * 60, 15 * 60], [16 * 60 + 30, 17 * 60]];
    const midnight = new Date('2026-10-07T06:02:00.000Z').getTime() - (9 * 60 + 2) * 60000;
    let cursor = 10 * 60;
    const placements = (body.tasks ?? []).map((t) => {
      const dur = t.estimationMinutes ?? 30;
      for (;;) {
        const clash = busy.find(([s, e]) => cursor < e && cursor + dur > s);
        if (!clash) break;
        cursor = clash[1];
      }
      const start = cursor;
      cursor += dur;
      return { taskId: t.id, scheduledAt: new Date(midnight + start * 60000).toISOString(), durationMinutes: dur };
    });
    return json(route, { placements, skipped: [] });
  });

  return {};
}
