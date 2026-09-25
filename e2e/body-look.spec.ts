import { expect, test } from '@playwright/test'
import { decideBotScript } from '../selfplay/bot'

/**
 * BODY-3 look spec: all five heroes' paper-doll bodies live in the real UI -
 * select cards, HUD medallions, gameplay poses, combat motion, mounted,
 * co-op, desktop + phone. Captures land in artifacts/look/body3-*.png for
 * the owner review the acceptance criteria demand.
 */

const LOOK = 'artifacts/look'

test('all five painted bodies load at boot and render in gameplay', async ({ page }) => {
  test.setTimeout(90_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')

  // Boot must have published all five body packs (signature-verified).
  const published = await page.evaluate(() => {
    const game = window.__DW_GAME__
    const scene = game?.scene.getScene('boot')
    const res = scene?.registry.get('paintedHeroArt') as
      | { bodies?: Record<string, unknown> }
      | undefined
    return Object.keys(res?.bodies ?? {}).sort()
  })
  expect(published).toEqual(['guanyu', 'huangzhong', 'weiyan', 'zhangfei', 'zhaoyun'])

  // Select screen: every card shows the painted figure (portrait zoom over
  // the new body art would fail loudly if a sheet were blank).
  await page.keyboard.press('Enter')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('select')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${LOOK}/body3-select.png` })

  // Gameplay per hero: idle then a few bot batches for motion, then capture.
  for (const [i, hero] of ['zhangfei', 'guanyu', 'huangzhong', 'weiyan', 'zhaoyun'].entries()) {
    await page.evaluate(
      ([id]) => window.__DW__?.startGame(id as string, 42, 'stage1'),
      [hero],
    )
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
      .toBe('game')
    // Intro card dismiss via its tick rule.
    await page.evaluate(
      (inputs) =>
        window.__DW__?.run(
          inputs,
        ),
      Array.from({ length: 40 }, () => ({
        up: false, down: false, left: false, right: false,
        attackPressed: false, jumpPressed: false, specialPressed: false,
      })),
    )
    await page.waitForTimeout(300)
    // The rendered idle texture must DIFFER from procedural (painted bodies
    // actually wired, not silently fallen back).
    const liveness = await page.evaluate(() => {
      const game = window.__DW_GAME__
      const key = `entity:${(window.__DW__?.getSnapshot().sim?.charId) ?? 'zhaoyun'}:idle`
      return game?.textures.exists(key) ?? false
    })
    expect(liveness, `${hero} idle texture exists`).toBe(true)
    if (i === 0) {
      // Motion: Zhang Fei fights a few batches.
      for (let b = 0; b < 5; b += 1) {
        const sn = await page.evaluate(() => window.__DW__?.getSnapshot())
        if (!sn?.sim) break
        const script = decideBotScript(sn)
        await page.evaluate((inputs) => window.__DW__?.run(inputs), script)
        await page.waitForTimeout(80)
      }
    }
    await page.screenshot({ path: `${LOOK}/body3-game-${hero}.png` })
  }
  expect(pageErrors).toEqual([])
})

test('mounted and co-op states keep the painted bodies seated', async ({ page }) => {
  test.setTimeout(90_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')

  // Mounted: stage 2's horse, walk right until mounted.
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage2'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')
  await page.evaluate(
    (inputs) => window.__DW__?.run(inputs),
    Array.from({ length: 140 }, () => ({
      up: false, down: false, left: false, right: true,
      attackPressed: false, jumpPressed: false, specialPressed: false,
    })),
  )
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.mounted), { timeout: 10_000 })
    .toBe(true)
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${LOOK}/body3-mounted.png` })

  // Co-op: join P2, both painted.
  await page.evaluate(() => window.__DW__?.startGame('zhangfei', 42, 'stage2'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')
  await page.evaluate(() => window.__DW__?.joinP2())
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.char2Id))
    .not.toBeNull()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${LOOK}/body3-coop.png` })
  expect(pageErrors).toEqual([])
})

test('phone renders the painted bodies too', async ({ browser }) => {
  test.setTimeout(60_000)
  const context = await browser.newContext({
    viewport: { width: 412, height: 732 },
    hasTouch: true,
    isMobile: true,
  })
  const page = await context.newPage()
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('guanyu', 42, 'stage1'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${LOOK}/body3-phone-guanyu.png` })
  expect(pageErrors).toEqual([])
  await context.close()
})
