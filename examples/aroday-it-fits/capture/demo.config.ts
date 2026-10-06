import { defineDemo } from 'video-demo/define';

import { ANCHOR, TIMEZONE, buildState } from './seed/state.ts';

export default defineDemo({
  name: 'aro.day',

  build: {
    // The repo's real production build: Vite SPA staged at dist/next/ plus
    // the static shell (styles.css, quotes, sounds) at dist/.
    command: './build.sh',
    output: 'dist',
    // Served from 127.0.0.1 so dev:forcePro renders Pro UI; nothing in the
    // bundle should point at a live API host.
    forbid: ['api.aro.day'],
  },

  stage: { width: 1920, height: 1080 },

  clock: { anchor: ANCHOR, timezone: TIMEZONE, locale: 'en-US' },

  themes: ['light'], // engine wants light|dark; storage maps light → pearl (the app default)

  // The app boots synchronously from localStorage "todo:state". Scene
  // `preferences` carry { tasks, settings, groups, externalEvents }.
  storage: (theme, overrides) => ({
    'todo:state': JSON.stringify(buildState(theme === 'dark' ? 'terminal' : 'pearl', overrides as Record<string, unknown>)),
    'dev:forcePro': '1',
    aroday_plannudge_done: '1',
    'todo.companionBannerDismissed': '1',
  }),

  entries: {
    app: {
      path: '/',
      ready: async (page) => {
        // Board shows .new-task; the calendar view shows .cal-header instead.
        await page.locator('.new-task, .cal-header').first().waitFor({ state: 'visible', timeout: 15000 });
        await page.locator('.card, .cal-block').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined);
      },
    },
  },

  mock: (page, ctx) => import('./mock.ts').then((made) => made.mock(page, ctx)),

  voice: { name: 'af_heart', speed: 1, saidAs: [[/\baro\.day\b/gi, 'arrow day']] },

  tour: ['smoke', 'fit', 'arabic', 'ai'],
});
