import { defineConfig } from '@playwright/test'

// Projects:
//   chromium - human-flow e2e smoke tests (e2e/)
//   selfplay - the LOGIC producer signal: a deterministic autopilot drives the
//              game through the debug bridge and checks invariants (selfplay/)
// The PRODUCTION-BUILD gate lives in playwright.prodbuild.config.ts, not here:
// `webServer` is a top-level option, so its build+preview server would run
// before every suite in this file.
//   vision   - the VISUAL producer signal: self-plays to every core screen,
//              snapshots the renderer, and asserts visual-health metrics
//              (vision/) - the loop's answer to "does it actually look right"
// All use the canvas renderer via ?renderer=canvas to avoid headless WebGL
// flakiness.
export default defineConfig({
  // Keep e2e stable on a single dev machine: each test now boots through the
  // baked-art preload (~1s) before asserting, and too many parallel workers
  // starve each other under contention (recurring flake).
  fullyParallel: false,
  workers: 3,
  webServer: {
    command: 'npm run dev -- --port 5177 --strictPort',
    url: 'http://localhost:5177',
    reuseExistingServer: false,
  },
  /**
   * `expect.poll` takes its default timeout from here, and 5000ms is not
   * enough for the one thing almost every spec waits on first: the game
   * booting to its title screen, which generates the whole cast's art on the
   * way. Measured by over-subscribing the machine to six workers - `game`,
   * `finalstage` and `coop` all failed with
   * "Timeout 5000ms exceeded while waiting on the predicate" on
   * `.toBe('title')`, which reads like a game defect and is a budget.
   *
   * This is a ceiling, not a wait: nothing runs slower in the normal case, and
   * a game that never boots still fails. Specs that set their own timeout keep
   * it.
   */
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:5177',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Tests drive the audio pipeline without a hardware gesture every time.
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    {
      name: 'chromium',
      testDir: 'e2e',
      timeout: 30_000,
      use: { browserName: 'chromium' },
    },
    {
      name: 'selfplay',
      testDir: 'selfplay',
      timeout: 300_000,
      use: { browserName: 'chromium' },
    },
    {
      name: 'vision',
      testDir: 'vision',
      // Rendering at RENDER_SCALE quadrupled the pixels the canvas renderer has
      // to fill and the metrics have to scan, so both visual specs got roughly
      // three times slower. `npm run vision` also pins this project to a single
      // worker: its two specs are the heaviest in the repo and, run together,
      // starved each other past the old 180s budget while each finished
      // comfortably on its own. Contention also adds noise to timing-sensitive
      // snapshots, which is the last thing a gate measuring pixels needs.
      timeout: 300_000,
      use: { browserName: 'chromium' },
    },
  ],
})
