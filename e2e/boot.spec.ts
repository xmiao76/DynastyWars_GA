import { expect, test } from '@playwright/test'

test('game boots to the title scene without errors', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  await page.goto('/?renderer=canvas')

  const canvas = page.locator('#game canvas')
  await expect(canvas).toBeVisible()

  // BootScene preloads the baked-art set before the title screen; wait longer.
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 20_000 })
    .toBe('title')

  const snapshot = await page.evaluate(() => window.__DW__?.getSnapshot())
  expect(snapshot?.tick).toBeGreaterThan(0)
  expect(pageErrors).toEqual([])

  await page.screenshot({ path: 'artifacts/e2e-title.png' })
})
