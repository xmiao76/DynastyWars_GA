import { expect, test } from '@playwright/test'

test('the display font loads on a normal boot', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  const check = await page.evaluate(() => ({
    latin: document.fonts.check('16px "DynastyDisplay"', 'DYNASTY'),
    cjk: document.fonts.check('16px "DynastyDisplay"', '關羽赤壁'),
  }))
  expect(check, 'bundled display face did not become usable').toEqual({ latin: true, cjk: true })
  expect(errors).toEqual([])
})

test('a blocked font falls back and the game still boots', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  // Abort only the font file itself: aborting the JS bundle that names it
  // would prove nothing (the hero-art suite learned this first).
  await page.route('**/*.woff2', (route) =>
    route.request().resourceType() === 'font' || route.request().url().endsWith('.woff2')
      ? route.abort()
      : route.continue(),
  )
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  expect(errors).toEqual([])
})

test('UI-1 style frame renders through the real kit (review captures)', async ({ page, browser }) => {
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas&autopilot=1&styleframe=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('styleframe')
  await page.waitForTimeout(800)
  const textures = await page.evaluate(() => ({
    keyart: window.__DW_GAME__?.textures.exists('ui:keyart-dusk') === true,
    lockup: window.__DW_GAME__?.textures.exists('dtype:gold:40:DYNASTY WARS') === true,
  }))
  expect(textures).toEqual({ keyart: true, lockup: true })
  await page.screenshot({ path: 'artifacts/look/ui1-styleframe-desktop.png' })

  const ctx = await browser.newContext({ viewport: { width: 412, height: 732 }, hasTouch: true })
  const phone = await ctx.newPage()
  await phone.goto('/?renderer=canvas&autopilot=1&styleframe=1')
  await expect.poll(() => phone.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('styleframe')
  await phone.waitForTimeout(800)
  await phone.screenshot({ path: 'artifacts/look/ui1-styleframe-phone.png' })
  await ctx.close()
})
