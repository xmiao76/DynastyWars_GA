import { expect, test } from '@playwright/test'
import { driveStageClear } from './harness'

// Producer signal (canonical run): the greedy bot clears stage 1 as Zhao Yun
// with zero invariant violations. Findings feed the eval loop.
test('greedy bot clears stage 1 as zhaoyun', async ({ page }, testInfo) => {
  const result = await driveStageClear(page, 'zhaoyun', 42)

  await page.screenshot({ path: 'artifacts/selfplay-zhaoyun.png' })
  await testInfo.attach('selfplay-report', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  })
  console.log('SELFPLAY REPORT', JSON.stringify(result))

  expect(result.violations).toEqual([])
  expect(result.pageErrors).toEqual([])
  expect(result.cleared).toBe(true)
  // continuesUsed is reported for trend-watching; hit-stop legitimately
  // shifts combat timing, so a spent continue is not a failure.
  // The bot must demonstrably use the survival verbs, not just walk+jab:
  // eat dropped food when hurt, and fire the desperation special when surrounded.
  expect(result.stats.foodEaten).toBeGreaterThanOrEqual(1)
  expect(result.stats.specialsUsed).toBeGreaterThanOrEqual(1)
  // The audio pipeline: a full combat run must queue plenty of sfx.
  expect(result.sfxPlayed).toBeGreaterThan(100)
  // Perf is probed separately (perf.spec.ts); msPerKTick here measures
  // harness round-trip latency and stays informational only.
})
