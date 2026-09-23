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

test('UI-2 title attract screen renders through the real kit (review captures)', async ({ page, browser }) => {
  await page.setViewportSize({ width: 960, height: 540 })
  // Seed a best so the review capture shows the hi-score line too.
  await page.addInitScript(() => window.localStorage.setItem('dwga-hiscore-v1', '31150'))
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.waitForTimeout(800)
  const textures = await page.evaluate(() => {
    const tex = window.__DW_GAME__?.textures
    const sheen = 'dtype:gold:40:DYNASTY WARS:sheen12'
    return {
      keyart: tex?.exists('ui:keyart-photo') === true,
      lockup: tex?.exists('dtype:gold:40:DYNASTY WARS') === true,
      // Plain frame + 12 glint frames, all named.
      sheenFrames: tex?.exists(sheen) ? tex.get(sheen).getFrameNames().filter((n) => /^f\d+$/.test(n)).length : 0,
    }
  })
  expect(textures).toEqual({ keyart: true, lockup: true, sheenFrames: 13 })
  // The glint actually travels: the logo's frame changes on the scene clock.
  const framesSeen = await page.evaluate(async () => {
    const scene = window.__DW_GAME__?.scene.getScene('title')
    const logo = scene?.children.list.find(
      (c) => c.type === 'Image' && (c as unknown as { texture: { key: string } }).texture.key.endsWith(':sheen12'),
    ) as unknown as { frame: { name: string } } | undefined
    if (!logo) return []
    const seen = new Set<string>()
    for (let i = 0; i < 90; i += 1) {
      seen.add(logo.frame.name)
      await new Promise((r) => setTimeout(r, 50))
    }
    return [...seen]
  })
  expect(framesSeen.length, 'the logo sheen never moved').toBeGreaterThan(3)
  await page.screenshot({ path: 'artifacts/look/ui2-title-desktop.png' })

  const ctx = await browser.newContext({ viewport: { width: 412, height: 732 }, hasTouch: true })
  const phone = await ctx.newPage()
  await phone.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => phone.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await phone.waitForTimeout(800)
  await phone.screenshot({ path: 'artifacts/look/ui2-title-phone.png' })
  await ctx.close()
})

function titleHiscoreLine(): string {
  const list = window.__DW_GAME__?.scene.getScene('title')?.children.list ?? []
  for (const child of list) {
    if (child.type !== 'Text') continue
    const text = (child as { text?: unknown }).text
    if (typeof text === 'string' && text.includes('HI-SCORE')) return text
  }
  return ''
}

test('the title shows the persisted hi-score, and hides it when storage is denied', async ({ browser }) => {
  const withScore = await browser.newContext()
  const page = await withScore.newPage()
  await page.addInitScript(() => window.localStorage.setItem('dwga-hiscore-v1', '31150'))
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await expect.poll(() => page.evaluate(titleHiscoreLine)).toBe('HI-SCORE  31150')
  await withScore.close()

  const denied = await browser.newContext()
  const deniedPage = await denied.newPage()
  const errors: string[] = []
  deniedPage.on('pageerror', (e) => errors.push(String(e)))
  await deniedPage.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get: () => { throw new Error('denied') },
    })
  })
  await deniedPage.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => deniedPage.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  expect(await deniedPage.evaluate(titleHiscoreLine)).toBe('')
  expect(errors).toEqual([])
  await denied.close()
})
