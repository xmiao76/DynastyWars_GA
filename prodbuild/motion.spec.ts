import { expect, test } from '@playwright/test'
import type { Sim } from '../src/core/sim'

type MotionSprite = {
  frame: { name: string; x: number; y: number; width: number; height: number; realWidth: number; realHeight: number }
  scaleX: number
  displayOriginX: number
  displayOriginY: number
}
type LiveGame = { sim: Sim; syncSprites(): void; sprites: Map<number, MotionSprite> }
const URL = 'http://localhost:4321'

/**
 * CMR-03 acceptance 6 against the ACTUAL dist build (extended by CMR-06B,
 * CMR-07B): the runtime stays opt-in, nothing downloads or publishes at
 * boot, stage entry fetches exactly the catalogued packs' pages (guanyu's
 * two + the stage's soldier, spearman and archer pages), and both renderers display
 * shared atlas frames whose trim/pivot restores the old per-cell registration.
 */
for (const renderer of ['canvas', 'webgl'] as const) {
  for (const enabled of [false, true]) {
    test(`built motion pilot is ${enabled ? 'opted in' : 'off by default'} (${renderer})`, async ({ page }) => {
      const requests: string[] = [], errors: string[] = []
      page.on('request', (r) => {
        if (/(guanyu-(motion|actions)-sheet|soldier-motion-sheet|spearman-motion-sheet|archer-motion-sheet)/.test(r.url()) && r.resourceType() !== 'script') requests.push(r.url())
      })
      page.on('pageerror', (e) => errors.push(String(e)))
      await page.goto(`${URL}/?renderer=${renderer}&autopilot=1${enabled ? '&motion=1' : ''}`)
      await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 15_000 }).toBe('title')
      // Stage-scoped packs: at title there is NO motion download and NO
      // published motion art - even opted in.
      expect(await page.evaluate(() => Object.keys(window.__DW_GAME__?.scene.getScene('boot').registry.get('paintedHeroArt')?.motions ?? {}))).toEqual([])
      expect(requests, 'no all-cast boot downloads').toEqual([])
      await page.evaluate(() => window.__DW__?.startGame('guanyu', 42, 'stage1'))
      await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
      if (enabled) {
        await expect.poll(() => requests.length, { timeout: 15_000 }).toBe(5)
        expect(Object.keys(await page.evaluate(() => window.__DW_GAME__!.scene.getScene('game').registry.get('paintedHeroArt')?.motions ?? {})).sort()).toEqual(['archer', 'guanyu', 'soldier', 'spearman'])
      } else {
        expect(requests).toEqual([])
      }
      const keys = await page.evaluate(() => {
        const game = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
        const p = game.sim.entities.find((e) => e.id === game.sim.playerId)!
        const read = (): string => { game.syncSprites(); return game.sprites.get(p.id)!.frame.name }
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
      if (enabled) {
        // Shared atlas frame with trim restoration: the trimmed rect draws at
        // (trimX, trimY) inside the FULL 448x288 art cell (repaint of
        // walk:0), and display origin/scale equal the old per-cell clone's -
        // so every displayed pixel and registration is unchanged here.
        const geo = await page.evaluate(() => {
          const game = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
          const p = game.sim.entities.find((e) => e.id === game.sim.playerId)!
          Object.assign(p, { state: 'idle', stateTick: 0, attackId: null })
          game.syncSprites()
          const s = game.sprites.get(p.id)!
          const f = s.frame
          return {
            name: f.name, x: f.x, y: f.y, w: f.width, h: f.height,
            realW: f.realWidth, realH: f.realHeight,
            scale: s.scaleX, ox: s.displayOriginX, oy: s.displayOriginY,
          }
        })
        expect(geo).toEqual({
          name: 'entity:guanyu:motion:walk:0',
          x: 169, y: 36, w: 113, h: 240, // trimmed content rect restored in place
          realW: 448, realH: 288, // full art cell (box 224x144 at density 2)
          // Pivots equal the old per-cell clone's (origin x full cell, unscaled):
          // draw rect [-224+169, +113] and its flip both match the clone path.
          scale: 0.5, ox: 224, oy: 272,
        })
      }
      expect(errors).toEqual([])
    })
  }
}
