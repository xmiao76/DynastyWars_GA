import { devices, expect, test } from '@playwright/test'

/**
 * UIR-7 (V-9, owner decision 1): portrait phones get the rotate-your-phone
 * overlay with gameplay paused behind it; landscape and desktop play on.
 */

const sceneOf = (page: import('@playwright/test').Page): Promise<string | undefined> =>
  page.evaluate(() => window.__DW__?.getSnapshot().scene)
const tickOf = (page: import('@playwright/test').Page): Promise<number> =>
  page.evaluate(() => window.__DW__?.getSnapshot().tick ?? -1)

async function reachGame(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/?renderer=canvas')
  await expect.poll(() => sceneOf(page)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage1'))
  await expect.poll(() => sceneOf(page)).toBe('game')
}

test('portrait phones show the rotate overlay and the sim tick freezes', async ({ browser }) => {
  test.setTimeout(60_000)
  const pageErrors: string[] = []
  const ctx = await browser.newContext({ ...devices['Pixel 7'] })
  const page = await ctx.newPage()
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await reachGame(page)

  const overlay = page.locator('#rotate-overlay')
  await expect(overlay, 'portrait must show the rotate overlay').toBeVisible()
  await expect(overlay).toContainText('ROTATE YOUR PHONE')

  const t1 = await tickOf(page)
  await page.waitForTimeout(600)
  const t2 = await tickOf(page)
  expect(t2, 'the sim tick must not advance behind the overlay').toBe(t1)
  expect(pageErrors).toEqual([])
  await ctx.close()
})

test('landscape phones show no overlay and the sim tick advances', async ({ browser }) => {
  test.setTimeout(60_000)
  const pageErrors: string[] = []
  const ctx = await browser.newContext({ ...devices['Pixel 7 landscape'] })
  const page = await ctx.newPage()
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await reachGame(page)

  await expect(page.locator('#rotate-overlay'), 'landscape must not show the overlay').toBeHidden()
  const t1 = await tickOf(page)
  await page.waitForTimeout(600)
  const t2 = await tickOf(page)
  expect(t2, 'the sim tick must advance in landscape').toBeGreaterThan(t1)
  expect(pageErrors).toEqual([])
  await ctx.close()
})

test('desktop 960x540 shows no overlay', async ({ browser }) => {
  test.setTimeout(60_000)
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 }, hasTouch: false })
  const page = await ctx.newPage()
  await reachGame(page)
  await expect(page.locator('#rotate-overlay'), 'desktop must not show the overlay').toBeHidden()
  await ctx.close()
})
