import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import type { Sim } from '../src/core/sim'
import type { SimEvent } from '../src/core/events'
import type { Entity } from '../src/core/types'
import { makeCombatant } from '../src/core/entities'
import { ENEMIES } from '../src/core/enemies'
import { attackById } from '../src/core/attacks'

const neutral = { up: false, down: false, left: false, right: false, attackPressed: false, jumpPressed: false, specialPressed: false }
type Game = { sim: Sim; syncSprites(): void; sprites: Map<number, { frame: { name: string }; texture: { key: string } }> }

// Outcome states/attacks come only from real inputs + AI/core physics. Initial
// position/HP/idle fixtures are disclosed; injected all-key poses live elsewhere.
for (const renderer of ['canvas', 'webgl'] as const) {
  for (const facing of ['right', 'left'] as const) {
    test(`Xiahou interactions ${renderer}/${facing} mobile landscape`, async ({ page }) => {
      test.setTimeout(180_000)
      await page.setViewportSize({ width: 844, height: 390 })
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(String(e)))
      await page.goto(`/?renderer=${renderer}&autopilot=1&motion=1`)
      await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
      await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage2'))
      await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
      await page.keyboard.press('Enter')
      await expect.poll(() => page.evaluate(() => !!window.__DW_GAME__!.scene.getScene('game').registry.get('paintedHeroArt')?.motions?.xiahoudun)).toBe(true)
      const def = ENEMIES.xiahoudun!
      const boss = makeCombatant(900001, 'xiahoudun', 'enemy', 230, 232, def.maxHp, def.speed, facing)
      await page.evaluate((boss) => {
        const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Game
        g.sim.entities = g.sim.entities.filter((e) => e.id === g.sim.playerId)
        g.sim.entities.push(boss)
        const events: SimEvent[] = []
        const push = g.sim.events.push.bind(g.sim.events)
        g.sim.events.push = (...entries) => { events.push(...entries); return push(...entries) }
        ;(window as unknown as { __XIAHOU_EVENTS__: SimEvent[] }).__XIAHOU_EVENTS__ = events
        g.sim.cameraLocked = true
        g.syncSprites()
      }, boss)
      const direction = facing === 'right' ? 1 : -1
      const fixture = async (distance: number, hp = def.maxHp, thinkTick = 100): Promise<void> => {
        await page.evaluate(({ distance, hp, thinkTick, direction }) => {
          const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Game
          const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
          const b = g.sim.entities.find((e) => e.id === 900001)!
          Object.assign(p, { x: 230 - distance * direction, y: 232, z: 0, state: 'idle', stateTick: 0, hp: p.maxHp, invulnerableTicks: 999999, attackId: null, struck: [], vx: 0, facing: direction === 1 ? 'right' : 'left' })
          Object.assign(b, { x: 230, y: 232, z: 0, state: 'idle', stateTick: 0, hp, thinkTick, invulnerableTicks: 0, attackId: null, struck: [], vx: 0, grabbedBy: null, enraged: false })
          g.sim.freezeTicks = 0
          g.syncSprites()
        }, { distance, hp, thinkTick, direction })
      }
      const run = async (n: number, input: Partial<typeof neutral> = {}): Promise<void> => {
        const tick = await page.evaluate(() => window.__DW__!.getSnapshot().tick)
        await page.evaluate(({ n, input }) => window.__DW__!.run(Array.from({ length: n }, () => input)), { n, input: { ...neutral, ...input } })
        await expect.poll(() => page.evaluate(() => window.__DW__!.getSnapshot().tick)).toBe(tick + n)
      }
      const rows: unknown[] = []
      const read = async (phase: string): Promise<Entity & { key: string }> => {
        const row = await page.evaluate((phase) => {
          const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Game
          g.syncSprites()
          const b = g.sim.entities.find((e) => e.id === 900001)!
          return { ...b, key: g.sprites.get(b.id)!.frame.name, tick: g.sim.tick, phase, origin: 'gameplay', setup: 'initial idle/position/HP fixture only' }
        }, phase)
        expect(row.key).toContain('entity:xiahoudun:motion:')
        rows.push(row)
        return row
      }
      // Real player melee produces actual damage and hitstun.
      await fixture(20)
      await run(1, { attackPressed: true })
      await run(attackById('gy.jab1').startup)
      expect((await read('player-damage')).hp).toBeLessThan(def.maxHp)
      expect(await page.evaluate(() => (window as unknown as { __XIAHOU_EVENTS__: SimEvent[] }).__XIAHOU_EVENTS__.some((e) => e.type === 'hit' && e.targetId === 900001))).toBe(true)
      // Walking toward the boss causes core grab; attack input causes throw.
      await fixture(12)
      await run(1, facing === 'right' ? { right: true } : { left: true })
      expect((await read('core-grab')).state).toBe('grabbed')
      await run(1, { attackPressed: true })
      expect((await read('core-throw')).state).toBe('thrown')
      await run(6)
      expect((await read('throw-flight')).key).toBe('entity:xiahoudun:motion:fall:3')
      await run(30)
      expect(['knockdown', 'getup']).toContain((await read('throw-impact')).state)
      // AI starts the exact long charge, whose active physics moves the boss.
      await fixture(-150, def.maxHp, 1)
      await run(1)
      const startup = await read('AI-charge-start')
      expect(startup.attackId).toBe('charge.dash.long')
      await run(21)
      const active = await read('AI-charge-active')
      expect(active.key).toBe('entity:xiahoudun:motion:charge:3')
      expect(Math.abs(active.x - startup.x)).toBeGreaterThan(30)
      // Threshold HP is a fixture, but enrage flag/event is genuinely AI set.
      await fixture(-20, Math.floor(def.maxHp * def.boss!.enrageRatio), 1)
      await run(1)
      expect((await read('AI-enrage')).enraged).toBe(true)
      const observed = new Set<string>()
      for (let i = 0; i < 120; i++) {
        await run(1)
        const row = await read('AI-mixed')
        if (row.attackId) observed.add(row.attackId)
      }
      expect(observed.size).toBeGreaterThan(0)
      const events = await page.evaluate(() => (window as unknown as { __XIAHOU_EVENTS__: SimEvent[] }).__XIAHOU_EVENTS__)
      expect(events.some((e) => e.type === 'throw' && e.id === 900001)).toBe(true)
      expect(events.some((e) => e.type === 'enrage' && e.id === 900001)).toBe(true)
      expect(errors).toEqual([])
      const out = `artifacts/CMR-14B/default-stage2/interactions/${renderer}-${facing}`
      mkdirSync(out, { recursive: true })
      writeFileSync(`${out}/trace.json`, `${JSON.stringify({ viewport: '844x390 landscape (no touch emulation)', fixture: 'ordinary solo GU start; actual default ZF partner prepared within cap', observedAttacks: [...observed], rows, events }, null, 2)}\n`)
      await page.screenshot({ path: `${out}/scene.png` })
    })
  }
}
