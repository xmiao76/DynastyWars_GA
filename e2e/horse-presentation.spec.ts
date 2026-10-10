import { expect, test, type Page } from '@playwright/test'
import { neutralInput } from '../src/core/types'
import type { Sim } from '../src/core/sim'
import type Phaser from 'phaser'

type SceneProbe = { sim: Sim; sprites: Map<number, Phaser.GameObjects.Sprite>; syncSprites(): void }
async function pose(page: Page) {
  return page.evaluate(() => {
    const scene = window.__DW_GAME__!.scene.getScene('game') as unknown as SceneProbe
    const horse = scene.sim.entities.find(e => e.kind === 'horse')!
    const sprite = scene.sprites.get(horse.id)!
    return { key: sprite.texture.key, x: horse.x, stateTick: horse.stateTick, tick: scene.sim.tick }
  })
}
async function advance(page: Page, n: number, batch = false) {
  const tick = (await pose(page)).tick
  await page.evaluate(({ n, batch, input }) => {
    if (batch) window.__DW__!.run(Array.from({ length: n }, () => input))
    else window.__DW__!.step(n)
  }, { n, batch, input: neutralInput() })
  await expect.poll(async () => (await pose(page)).tick).toBe(tick + n)
}

test('actual 2P horse sprite follows rider and flee steps, batch, freeze and pause', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e)))
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__!.startGame('zhaoyun', 42, 'stage2'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  await page.evaluate(() => window.__DW__!.joinP2('zhangfei'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.char2Id)).toBe('zhangfei')
  // Scoped existing debug seam: controlled rendered state, not new gameplay.
  await page.evaluate(() => {
    const scene = window.__DW_GAME__!.scene.getScene('game') as unknown as SceneProbe
    const sim = scene.sim
    const horse = sim.entities.find(e => e.kind === 'horse')!
    const rider = sim.entities.find(e => e.id === sim.player2Id)!
    rider.mountedOn = horse.id; rider.x = horse.x; rider.y = horse.y
    rider.state = 'walk'; rider.stateTick = 10
    scene.syncSprites()
  })
  expect((await pose(page)).key).toBe('entity:horse:walk1')
  await page.screenshot({ path: 'artifacts/horse-recovery/2p-mounted-walk1.png' })
  await page.evaluate(() => {
    const scene = window.__DW_GAME__!.scene.getScene('game') as unknown as SceneProbe
    const rider = scene.sim.entities.find(e => e.id === scene.sim.player2Id)!
    rider.state = 'idle'; scene.syncSprites()
  })
  expect((await pose(page)).key).toBe('entity:horse:idle')
  await page.screenshot({ path: 'artifacts/horse-recovery/2p-mounted-idle.png' })
  await page.evaluate(() => {
    const scene = window.__DW_GAME__!.scene.getScene('game') as unknown as SceneProbe
    const horse = scene.sim.entities.find(e => e.kind === 'horse')!
    const rider = scene.sim.entities.find(e => e.id === scene.sim.player2Id)!
    rider.mountedOn = null; rider.x = horse.x - 50
    horse.state = 'fleeing'; horse.stateTick = 0
    scene.syncSprites()
  })
  const before = await pose(page)
  await advance(page, 6, true)
  const run = await pose(page)
  expect(run.x - before.x).toBe(24)
  expect(run.stateTick).toBe(0)
  expect(run.key).toBe('entity:horse:walk1')
  await page.screenshot({ path: 'artifacts/horse-recovery/flee-batch-walk1.png' })
  await page.evaluate(() => {
    const scene = window.__DW_GAME__!.scene.getScene('game') as unknown as SceneProbe
    scene.sim.freezeTicks = 2
  })
  await advance(page, 2)
  expect((await pose(page)).x).toBe(run.x)
  expect((await pose(page)).key).toBe(run.key)
  await page.keyboard.press('p')
  const paused = await pose(page)
  await page.waitForTimeout(200)
  expect(await pose(page)).toEqual(paused)
  await page.keyboard.press('p')
  await advance(page, 6)
  expect((await pose(page)).key).toBe('entity:horse:walk0')
  expect((await pose(page)).x - run.x).toBe(24)
  await page.screenshot({ path: 'artifacts/horse-recovery/flee-resumed-walk0.png' })
  expect(errors).toEqual([])
})
