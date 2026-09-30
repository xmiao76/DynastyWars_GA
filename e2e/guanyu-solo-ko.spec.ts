import { mkdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import type { Sim } from '../src/core/sim'

test.skip(process.env.GUANYU_ACTIONS !== '1', 'set GUANYU_ACTIONS=1')
test('solo continue freeze does not trap Guan Yu upright; pause still freezes presentation', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/?renderer=canvas&autopilot=1&motion=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__!.getSnapshot().scene)).toBe('game')
  const intro = (): Promise<boolean> => page.evaluate(() => !!window.__DW_GAME__?.scene.getScene('hud').children.list.some((o) => o.name === 'introCard'))
  await expect.poll(intro).toBe(true); await page.keyboard.press('Enter'); await expect.poll(intro).toBe(false)
  await page.evaluate(() => {
    const g = window.__DW_GAME__!.scene.getScene('game') as unknown as { sim: Sim; syncSprites(): void; showContinueOverlay(): void }
    const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
    p.state = 'dying'; p.stateTick = 0; p.hp = 0; p.z = 0; g.sim.phase = 'gameover'
    g.showContinueOverlay(); g.syncSprites()
  })
  const read = (): Promise<{ frame: string; alpha: number; stateTick: number; simTick: number }> => page.evaluate(() => {
    const g = window.__DW_GAME__!.scene.getScene('game') as unknown as { sim: Sim; sprites: Map<number, { texture: { key: string }; alpha: number }> }
    const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!, s = g.sprites.get(p.id)!
    return { frame: s.texture.key, alpha: s.alpha, stateTick: p.stateTick, simTick: g.sim.tick }
  })
  await expect.poll(async () => (await read()).frame).toBe('entity:guanyu:motion:fall:6')
  await page.keyboard.press('p')
  const paused = await read()
  await page.waitForTimeout(120) // intentional pause negative control
  const still = await read()
  expect(still).toEqual(paused)
  expect(still.stateTick).toBe(0)
  await page.keyboard.press('p')
  await expect.poll(async () => (await read()).alpha).toBeLessThan(paused.alpha)
  mkdirSync('artifacts/wholeframe/actions', { recursive: true })
  await page.screenshot({ path: 'artifacts/wholeframe/actions/solo-ko-continue.png' })
})
