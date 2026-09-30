import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import type { Sim } from '../src/core/sim'
import type { Entity } from '../src/core/types'

test.skip(process.env.GUANYU_ACTIONS !== '1', 'set GUANYU_ACTIONS=1')
const OUT = 'artifacts/wholeframe/actions/interactions'
interface LiveGame { sim: Sim; syncSprites(): void; sprites: Map<number, { texture: { key: string }; y: number; alpha: number }> }

test('Guan Yu receives real hits and reaches a real grab through the unchanged simulation', async ({ page }) => {
  test.setTimeout(150_000); mkdirSync(OUT, { recursive: true })
  await page.setViewportSize({ width: 960, height: 540 })
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto('/?renderer=canvas&autopilot=1&motion=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__!.getSnapshot().scene)).toBe('game')
  const intro = (): Promise<boolean> => page.evaluate(() => !!window.__DW_GAME__?.scene.getScene('hud').children.list.some((o) => o.name === 'introCard'))
  await expect.poll(intro).toBe(true); await page.keyboard.press('Enter'); await expect.poll(intro).toBe(false)
  const outcomes: unknown[] = []
  for (const scenario of ['hurt', 'heavy-fall', 'air-hit', 'grab-throw'] as const) {
    await page.evaluate((name) => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
      Object.assign(p, { state: 'idle', stateTick: 0, airTicks: 0, attackId: null, z: 0, vx: 0, x: 230, y: 216,
        facing: 'right', hp: 130, invulnerableTicks: 0, mountedOn: null, bufferedAttack: false, struck: [] })
      g.sim.phase = 'fight'; g.sim.freezeTicks = 0; g.sim.cameraLocked = false; g.sim.waveIndex = 0
      const e = structuredClone(p) as Entity
      Object.assign(e, { id: 95, kind: name === 'heavy-fall' ? 'spearman' : 'soldier', side: 'enemy', hp: 500, maxHp: 500,
        state: 'attack', stateTick: name === 'heavy-fall' ? 19 : 13, attackId: name === 'heavy-fall' ? 'spear.thrust' : 'soldier.swing',
        facing: 'left', x: 254, y: 216, struck: [], invulnerableTicks: 0 })
      if (name === 'air-hit') e.stateTick = 11 // delay contact until player has risen, after visible airborne frame
      if (name === 'grab-throw') { e.x = 242; e.stateTick = 0 } // within14u walking grab range
      g.sim.entities = [p, e]; g.syncSprites()
    }, scenario)
    const trace = await page.evaluate(async (name) => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
      const out = []; let next = g.sim.tick
      for (let i = 0; i < 75; i++) {
        const input = { up: false, down: false, left: false, right: false, attackPressed: false, jumpPressed: false, specialPressed: false }
        if (name === 'air-hit' && i === 0) input.jumpPressed = true
        if (name === 'grab-throw' && i === 0) input.right = true
        if (name === 'grab-throw' && i === 10) input.attackPressed = true
        next++
        window.__DW__!.run([input])
        while (g.sim.tick < next) await new Promise<void>((r) => requestAnimationFrame(() => r()))
        await new Promise<void>((r) => requestAnimationFrame(() => r()))
        const s = g.sprites.get(p.id)!
        out.push({ i, state: p.state, stateTick: p.stateTick, hp: p.hp, z: p.z, key: s.texture.key, spriteY: s.y,
          freezeTicks: g.sim.freezeTicks,
          enemy: g.sim.entities.find((e) => e.id === 95)?.state,
          image: [0, 1, 2, 3, 5, 8, 10, 13, 18, 30, 40, 50, 60, 74].includes(i) ? window.__DW_GAME__!.canvas.toDataURL('image/png') : null })
      }
      return out
    }, scenario)
    expect(trace.every((f) => f.key.includes(':motion:'))).toBe(true)
    if (scenario === 'hurt') expect(trace.some((f) => f.state === 'hitstun' && f.hp < 130)).toBe(true)
    if (scenario === 'heavy-fall' || scenario === 'air-hit') {
      expect(trace.some((f) => f.state === 'knockdown' && f.hp < 130)).toBe(true)
      expect(trace.some((f) => f.state === 'getup')).toBe(true)
    }
    if (scenario === 'grab-throw') {
      expect(trace.some((f) => f.state === 'grab' && f.enemy === 'grabbed')).toBe(true)
      expect(trace.some((f) => f.enemy === 'thrown')).toBe(true)
    }
    for (const f of trace) if (f.image) writeFileSync(`${OUT}/${scenario}-${String(f.i).padStart(2, '0')}.png`, Buffer.from(f.image.split(',')[1]!, 'base64'))
    outcomes.push({ scenario, frames: trace.map(({ image: _image, ...f }) => { void _image; return f }) })
  }
  writeFileSync(`${OUT}/trace.json`, `${JSON.stringify(outcomes, null, 2)}\n`)
  expect(errors).toEqual([])
})
