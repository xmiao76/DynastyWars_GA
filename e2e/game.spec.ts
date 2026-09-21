import { expect, test } from '@playwright/test'

test('Enter starts the game; arrows move the player; Z attacks', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  await page.goto('/?renderer=canvas')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')

  await page.keyboard.press('Enter')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('select')
  await page.keyboard.press('Enter')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')

  const x0 = await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.x ?? 0)
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(400)
  await page.keyboard.up('ArrowRight')
  const x1 = await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.x ?? 0)
  expect(x1).toBeGreaterThan(x0)

  await page.keyboard.press('z')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.state), {
      timeout: 4000,
    })
    .toBe('attack')

  // Wait out the attack recovery so the jump press lands in idle/walk.
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.state), {
      timeout: 4000,
    })
    .not.toBe('attack')

  await page.keyboard.press('x')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.z ?? 0), {
      timeout: 4000,
    })
    .toBeGreaterThan(0)

  // Land before the special press.
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.z ?? 1), {
      timeout: 4000,
    })
    .toBe(0)

  await page.keyboard.press('c')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.state), {
      timeout: 4000,
    })
    .toBe('special')

  expect(pageErrors).toEqual([])
})
