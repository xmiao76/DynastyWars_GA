import { expect, test } from '@playwright/test'
import { bootGame } from './harness'

// Perf probe: step the sim synchronously in-page and measure wall-clock
// throughput - this measures the GAME, not harness latency. Budget is
// generous: it catches catastrophic slowdowns, not micro-regressions.
const TICKS_PER_RUN = 600
const BUDGET_MS_PER_1000_TICKS = 1000

test('sim throughput stays within budget', async ({ page }, testInfo) => {
  const pageErrors = await bootGame(page, 'zhaoyun', 42)

  const runs: number[] = []
  for (let i = 0; i < 3; i += 1) {
    const ms = await page.evaluate((n) => window.__DW__?.bench(n) ?? -1, TICKS_PER_RUN)
    runs.push(ms)
  }
  const best = Math.min(...runs)
  const msPerKTick = Math.round((best / TICKS_PER_RUN) * 1000)

  const result = { runs, msPerKTick, budget: BUDGET_MS_PER_1000_TICKS }
  await testInfo.attach('selfplay-report', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  })
  console.log('SELFPLAY PERF', JSON.stringify(result))

  expect(pageErrors).toEqual([])
  expect(best).toBeGreaterThanOrEqual(0)
  expect(msPerKTick).toBeLessThan(BUDGET_MS_PER_1000_TICKS)
})
