import { expect, test } from '@playwright/test'
import type { Sim } from '../src/core/sim'

type LiveGame = { sim: Sim; syncSprites(): void; sprites: Map<number, { texture: { key: string } }> }
const URL = 'http://localhost:4321'

for (const enabled of [false, true]) {
  test(`built motion pilot is ${enabled ? 'opted in' : 'off by default'}`, async ({ page }) => {
    const requests: string[] = [], errors: string[] = []
    page.on('request', (r) => { if (/guanyu-(motion|actions)-sheet/.test(r.url()) && r.resourceType() !== 'script') requests.push(r.url()) })
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(`${URL}/?renderer=canvas&autopilot=1${enabled ? '&motion=1' : ''}`)
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 15_000 }).toBe('title')
    expect(await page.evaluate(() => Object.keys(window.__DW_GAME__?.scene.getScene('boot').registry.get('paintedHeroArt')?.motions ?? {}))).toEqual(enabled ? ['guanyu'] : [])
    if (!enabled) expect(requests).toEqual([])
    else expect(requests).toHaveLength(2)
    await page.evaluate(() => window.__DW__?.startGame('guanyu', 42, 'stage1'))
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
    const keys = await page.evaluate(() => {
      const game = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      const p = game.sim.entities.find((e) => e.id === game.sim.playerId)!
      const read = (): string => { game.syncSprites(); return game.sprites.get(p.id)!.texture.key }
      p.state = 'idle'; p.stateTick = 0; p.attackId = null
      const idle = read()
      p.state = 'walk'; p.stateTick = 4
      const walk = read()
      p.state = 'attack'; p.attackId = 'gy.jab1'; p.stateTick = 8
      const strike = read()
      p.state = 'jump'; p.airTicks = 18; p.stateTick = 18; p.z = 48
      const jump = read()
      p.state = 'knockdown'; p.stateTick = 14; p.z = 0
      const down = read()
      p.state = 'getup'; p.stateTick = 11
      const getup = read()
      return { idle, walk, strike, jump, down, getup }
    })
    if (enabled) expect(keys).toEqual({ idle: 'entity:guanyu:motion:walk:0', walk: 'entity:guanyu:motion:walk:2', strike: 'entity:guanyu:motion:jab1:4', jump: 'entity:guanyu:motion:jump:3', down: 'entity:guanyu:motion:fall:6', getup: 'entity:guanyu:motion:getup:4' })
    else expect(Object.values(keys).every((k) => !k.includes(':motion:'))).toBe(true)
    expect(errors).toEqual([])
  })
}
