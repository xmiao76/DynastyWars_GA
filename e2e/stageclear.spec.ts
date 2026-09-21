import { expect, test } from '@playwright/test'
import { bootGame, driveCurrentStage } from '../selfplay/harness'

// The bot clears stage 1 through the debug bridge, then the result screen
// leads to stage 2 with score carried over (stage-progression machinery).
test('stage clear shows the result screen and progresses to stage 2', async ({ page }, testInfo) => {
  test.setTimeout(180_000)
  const pageErrors = await bootGame(page, 'zhaoyun', 42)

  const result = await driveCurrentStage(page, 'zhaoyun', pageErrors)
  await testInfo.attach('selfplay-report', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  })
  expect(result.cleared).toBe(true)
  expect(result.violations).toEqual([])
  const stage1Score = result.stats.score
  expect(stage1Score).toBeGreaterThan(0)

  // The result scene shows after a short wall-clock celebration delay.
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 10_000 })
    .toBe('result')

  // Enter advances to stage 2 with score and lives carried over.
  await page.keyboard.press('Enter')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.stageId))
    .toBe('stage2')
  const stage2 = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  expect(stage2?.stats.score).toBe(stage1Score)
  // Lives carry over, plus any extra life earned from the score milestone.
  expect(stage2?.lives).toBeGreaterThanOrEqual(3)

  expect(pageErrors).toEqual([])
})
