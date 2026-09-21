import { expect, test } from '@playwright/test'

const ORDER = ['guanyu', 'zhangfei', 'zhaoyun', 'huangzhong', 'weiyan'] as const

// Each of the five heroes must be selectable and boot a game as that hero.
test('character select boots the chosen hero', async ({ page }) => {
  test.setTimeout(120_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  for (const [index, charId] of ORDER.entries()) {
    await page.goto('/?renderer=canvas')
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
      .toBe('title')

    await page.keyboard.press('Enter')
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
      .toBe('select')

    for (let i = 0; i < index; i += 1) {
      await page.keyboard.press('ArrowRight', { delay: 40 })
      // Phaser's keyboard plugin drops what look like duplicate events; rapid
      // back-to-back synthetic presses lose the repeat. Give each press room.
      await page.waitForTimeout(90)
    }
    await page.keyboard.press('Enter')
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
      .toBe('game')
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.charId))
      .toBe(charId)
  }

  expect(pageErrors).toEqual([])
})
