import { expect, test } from '@playwright/test'
import type Phaser from 'phaser'
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

  // Natural boss-clear path uses the actual cleared hero's shared portraits.
  const portraits = await page.evaluate(() => window.__DW_GAME__!.scene.getScene('result').children.list
    .filter(child => child.type === 'Image').map(child => child as Phaser.GameObjects.Image)
    .filter(image => image.texture.key.startsWith('portrait:'))
    .map(image => ({ key: image.texture.key, visible: image.visible, alpha: image.alpha })))
  expect(portraits.map(p => p.key)).toEqual(['portrait:zhaoyun', 'portrait:zhaoyun'])
  expect(portraits.every(p => p.visible && p.alpha > 0)).toBe(true)
  await expect.poll(() => page.evaluate(() => window.__DW_GAME__!.scene.getScene('result').children.list
    .filter(child => child.type === 'Text').map(child => (child as Phaser.GameObjects.Text).text)))
    .toEqual(expect.arrayContaining(['SCORE', 'TIME', `${stage1Score}`]))

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
