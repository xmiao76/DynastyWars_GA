import { defineConfig } from '@playwright/test'

/**
 * The production-build gate runs from its OWN config.
 *
 * Playwright's `webServer` is a top-level option, not a per-project one, so
 * putting the build+preview server in the main config started it for every
 * suite: `npm run e2e`, `npm run vision` and `npm run signal` each rebuilt
 * dist/ before running a single test, and an unrelated production-build
 * failure would have stopped those suites from starting at all.
 */
export default defineConfig({
  testDir: 'prodbuild',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321 --strictPort',
    url: 'http://localhost:4321',
    // Never reuse: a leftover preview server would serve a STALE dist/ and this
    // gate exists precisely to check what the current build does. Port 4321
    // rather than Vite's default 4173, which another app on this machine
    // occupies - reusing that would have tested it instead.
    reuseExistingServer: false,
    timeout: 120_000,
  },
  use: {
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
  },
  reporter: [['list']],
})
