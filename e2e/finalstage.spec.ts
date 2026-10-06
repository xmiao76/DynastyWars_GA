import { expect, test } from '@playwright/test'
import { bootGame, driveCurrentStage } from '../selfplay/harness'

// Clearing the final stage (Xu Chu) must lead to the game-complete screen,
// then back to title. The run starts directly at stage 3 via the bridge.
test('clearing stage 3 shows game complete and returns to title', async ({ page }, testInfo) => {
  test.setTimeout(300_000)
  const pageErrors = await bootGame(page, 'zhaoyun', 42, 'stage3')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.stageId))
    .toBe('stage3')

  const result = await driveCurrentStage(page, 'zhaoyun', pageErrors, 900)
  await testInfo.attach('selfplay-report', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  })
  console.log('SELFPLAY FINAL', JSON.stringify(result))
  expect(result.cleared).toBe(true)
  expect(result.violations).toEqual([])

  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 10_000 })
    .toBe('result')
  await page.keyboard.press('Enter')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 10_000 })
    .toBe('gamecomplete')
  await page.keyboard.press('Enter')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 10_000 })
    .toBe('title')

  expect(pageErrors).toEqual([])
})
