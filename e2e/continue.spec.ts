import { expect, test } from '@playwright/test'
import { neutralInput } from '../src/core/types'

// Death and continue flow: an idle player must die, the continue countdown
// revives on Enter, and expiry leads to game over -> title.
test('continue flow: death, revive on Enter, game over on expiry', async ({ page }) => {
  test.setTimeout(120_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')

  const idleUntilGameover = async () => {
    for (let i = 0; i < 100; i += 1) {
      const snapshot = await page.evaluate(() => window.__DW__?.getSnapshot())
      if (snapshot?.sim?.phase === 'gameover') return true
      const tickBefore = snapshot?.tick ?? 0
      await page.evaluate(
        (inputs) => window.__DW__?.run(inputs),
        Array.from({ length: 60 }, () => neutralInput()),
      )
      await expect
        .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().tick), { timeout: 5000 })
        .toBeGreaterThanOrEqual(tickBefore + 60)
    }
    return false
  }

  expect(await idleUntilGameover()).toBe(true)

  // Enter spends a life and revives at full HP.
  await page.keyboard.press('Enter')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.phase))
    .toBe('fight')
  const revived = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  expect(revived?.player.hp).toBe(revived?.player.maxHp)
  expect(revived?.lives).toBe(2)

  // Die again, then let the countdown expire: game over scene, then title.
  expect(await idleUntilGameover()).toBe(true)
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 20_000 })
    .toBe('gameover')

  await page.keyboard.press('Enter')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')

  expect(pageErrors).toEqual([])
})
