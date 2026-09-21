import { expect, test } from '@playwright/test'
import type Phaser from 'phaser'

/**
 * The HUD shows the health the sim actually has.
 *
 * This used to assert that three bar TEXTURES were registered and that the HP
 * bar was an Image using one of them. Both were true, once, while every bar was
 * completely transparent - which is why a separate gate had to be added to ask
 * whether those textures contained any pixels at all. Asserting on the
 * implementation could not see the defect; asserting on the VALUE can.
 *
 * The bars are drawn with Graphics now, which exposes no geometry, so each one
 * records what it drew as `bar` data - the same device `drawSlab` uses for
 * `panelRect`.
 */

interface BarData {
  x: number
  y: number
  w: number
  h: number
  ratio: number
  danger: boolean
}

const readBars = (page: import('@playwright/test').Page): Promise<BarData[]> =>
  page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('hud')
    if (!scene) return []
    return scene.children.list
      .map((c) => (c as unknown as { getData?: (k: string) => unknown }).getData?.('bar'))
      .filter((b): b is BarData => !!b)
  })

test('the HUD draws bars that track the sim', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 20_000 })
    .toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  await page.waitForTimeout(600)

  // Angled plates exist: Graphics at HUD depth.
  const plates = await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('hud')
    if (!scene) return -1
    return scene.children.list.filter(
      (child) => child.type === 'Graphics' && (child as Phaser.GameObjects.Graphics).depth >= 10_000,
    ).length
  })
  expect(plates, 'no HUD plates drawn').toBeGreaterThanOrEqual(2)

  const full = await readBars(page)
  expect(full.length, 'no HUD bars found').toBeGreaterThan(0)
  const hp = full[0]
  expect(hp).toBeTruthy()
  expect(hp?.w ?? 0, 'the HP bar has no width').toBeGreaterThan(20)
  expect(hp?.h ?? 0, 'the HP bar has no height').toBeGreaterThan(2)
  expect(hp?.ratio ?? 0, 'a fresh player should be at full health').toBeGreaterThan(0.95)

  // Spend health on the special, and the bar has to follow it down.
  await page.evaluate(() => {
    window.__DW__?.setInputs({
      up: false,
      down: false,
      left: false,
      right: false,
      attackPressed: false,
      jumpPressed: false,
      specialPressed: true,
    })
    window.__DW__?.step(6)
  })
  await expect
    .poll(async () => (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.hp)) ?? 999)
    .toBeLessThan(999)
  await page.waitForTimeout(300)

  const simRatio = await page.evaluate(() => {
    const sim = window.__DW__?.getSnapshot().sim
    return sim ? sim.player.hp / sim.player.maxHp : -1
  })
  const after = await readBars(page)
  const hpAfter = after[0]
  expect(simRatio, 'the special should have cost health').toBeLessThan(0.99)
  expect(hpAfter?.ratio ?? -1, `HUD bar ${hpAfter?.ratio} vs sim ${simRatio}`).toBeCloseTo(simRatio, 2)

  expect(pageErrors).toEqual([])
})
