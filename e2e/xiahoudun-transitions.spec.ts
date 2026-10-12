import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { ENEMIES } from '../src/core/enemies'
import { makeCombatant } from '../src/core/entities'
import type { Sim } from '../src/core/sim'
import type { Entity } from '../src/core/types'

test.use({ video: 'on' })
const OUT = process.env.XIAHOU_TRANSITION_OUT ?? 'artifacts/CMR-14B/transitions-01/browser-final'
type Sprite = { frame: { name: string; realWidth: number; realHeight: number }; texture: { key: string }; x: number; y: number; scaleX: number; scaleY: number; originX: number; originY: number; displayOriginX: number; displayOriginY: number; flipX: boolean }
type Live = { sim: Sim; paused: boolean; syncSprites(): void; sprites: Map<number, Sprite>; cameras: { main: { zoom: number; scrollX: number; scrollY: number } } }
for (const renderer of ['canvas', 'webgl'] as const) for (const facing of ['right', 'left'] as const) {
  test(`Xiahou production boundaries ${renderer}/${facing}`, async ({ page }, info) => {
    test.setTimeout(120000)
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(String(e)))
    await page.setViewportSize({ width: 960, height: 540 })
    await page.goto(`/?renderer=${renderer}&autopilot=1&motion=1`)
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage2'))
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
    await page.keyboard.press('Enter')
    const boss = makeCombatant(900101, 'xiahoudun', 'enemy', 230, 232, ENEMIES.xiahoudun!.maxHp, ENEMIES.xiahoudun!.speed, facing)
    const result = await page.evaluate(async ({ boss, facing }) => {
      const simPath = '/src/core/sim.ts', combatPath = '/src/core/combat.ts', attackPath = '/src/core/attacks.ts', motionPath = '/src/game/adapters/motion-art.ts'
      const { stepSim } = await import(/* @vite-ignore */ simPath) as typeof import('../src/core/sim')
      const { applyHitWithAttack } = await import(/* @vite-ignore */ combatPath) as typeof import('../src/core/combat')
      const { attackById } = await import(/* @vite-ignore */ attackPath) as typeof import('../src/core/attacks')
      const { motionRuntime } = await import(/* @vite-ignore */ motionPath) as typeof import('../src/game/adapters/motion-art')
      const engine = window.__DW_GAME__!, g = engine.scene.getScene('game') as unknown as Live
      await motionRuntime().settle()
      g.paused = true; g.sim.cameraLocked = true
      const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
      g.sim.entities = [p]; g.syncSprites(); g.sim.entities.push(boss)
      const neutral = { up: false, down: false, left: false, right: false, attackPressed: false, jumpPressed: false, specialPressed: false }
      const direction = facing === 'right' ? 1 : -1
      const began = performance.now(), images: Array<{ phase: string; png: string }> = []
      const hud = engine.scene.getScene('hud'); hud.scene.pause(); hud.children.list.forEach((o) => { (o as unknown as { visible: boolean }).visible = false })
      const capture = async (phase: string) => {
        const before = g.sprites.get(boss.id)!.frame.name
        const png = await new Promise<string>((resolve) => engine.renderer.snapshot((snap) => resolve((snap as HTMLImageElement).src)))
        if (g.sprites.get(boss.id)!.frame.name !== before) throw new Error('boundary snapshot drift')
        images.push({ phase, png })
      }
      const rows: Array<{ phase: string; key: string; entity: Entity; tick: number; origin: string; sprite: Sprite }> = []
      const read = (phase: string, origin = 'INJECTED adversarial boundary') => {
        g.syncSprites(); const s = g.sprites.get(boss.id)!
        const row = { phase, wallMs: performance.now() - began, key: s.frame.name.replace('entity:xiahoudun:motion:', ''), tick: g.sim.tick, entity: { ...boss }, origin, sprite: { frame: { name: s.frame.name, realWidth: s.frame.realWidth, realHeight: s.frame.realHeight }, texture: { key: s.texture.key }, x: s.x, y: s.y, scaleX: s.scaleX, scaleY: s.scaleY, originX: s.originX, originY: s.originY, displayOriginX: s.displayOriginX, displayOriginY: s.displayOriginY, flipX: s.flipX } }
        rows.push(row); return row
      }
      const reset = (fields: Partial<Entity> = {}) => {
        // Actual deletion pass calls GameScene's forgetMotionEntity, no phantom
        // seeded display frame and no wholesale clear that hides reuse defects.
        g.sim.entities = [p]; g.syncSprites(); g.sim.entities.push(boss)
        Object.assign(boss, { x: 230, y: 232, z: 0, state: 'idle', stateTick: 0, attackId: null, grabbedBy: null, invulnerableTicks: 0, vx: 0, hp: boss.maxHp, thinkTick: 999999, facing, airTicks: 0, enraged: false }, fields)
        Object.assign(p, { x: 60, y: 232, z: 0, state: 'idle', stateTick: 0, attackId: null, hp: p.maxHp, invulnerableTicks: 999999, facing, vx: 0 }); g.sim.freezeTicks = 0
      }
      const step = (n = 1, input = neutral, render = true) => { for (let i = 0; i < n; i++) { stepSim(g.sim, input); if (render) g.syncSprites() } }
      reset({ state: 'knockdown', stateTick: 30 }); read('DOWN before KO'); await capture('DOWN-before-KO')
      Object.assign(boss, { state: 'dying', stateTick: 0 }); for (let t = 0; t < 9; t++) { boss.stateTick = t; read('DOWN to dying'); if (t === 0) await capture('DOWN-to-dying') }
      for (const start of [10, 14]) for (const target of ['knockdown', 'dying'] as const) {
        reset({ state: 'getup', stateTick: start }); read(`getup${start} before ${target}`); await capture(`getup${start}-before-${target}`)
        Object.assign(boss, { state: target, stateTick: 0 }); for (let t = 0; t <= 10; t++) { boss.stateTick = t; read(`getup${start} interrupted ${target}`); if (t === 0 || t === 10) await capture(`getup${start}-${target}-${t}`) }
      }
      reset({ state: 'attack', stateTick: 20, attackId: 'sword.heavy' }); read('active before hit')
      applyHitWithAttack(p, boss, attackById('gy.jab1'), g.sim.events, g.sim.entities)
      read('core hit interrupts strike', 'CORE hit function on injected active fixture'); await capture('strike-interrupted-hit')
      const frozenTick = boss.stateTick; g.sim.freezeTicks = 8; step(8); read('hitstop world ticks only', 'CORE stepSim freeze')
      const freezeCorrect = frozenTick === boss.stateTick
      step(3, neutral, false); read('skipped hurt renders latest', 'CORE stepSim skipped renders')
      reset({ state: 'attack', stateTick: 8, attackId: 'charge.dash.long' }); read('skip attack before')
      step(27, neutral, false); read('skip attack latest', 'CORE stepSim skipped attack renders')
      reset({ state: 'thrown', stateTick: 0, vx: direction * 3.5, thrownFromX: 230, z: 16 }); read('flight start')
      step(6); read('flight moved', 'CORE throw physics from injected flight'); await capture('throw-flight')
      const frozenX = boss.x; g.sim.freezeTicks = 12; step(12); read('flight freeze', 'CORE stepSim freeze')
      const flightFrozen = boss.x === frozenX
      step(30); read('flight impact low tail', 'CORE throw physics'); await capture('throw-impact')
      // Actual core acquisition, then a core hit breaks the holder's grab. The
      // nearby position and holder-hit call are fixtures, freed walk is NOT set.
      for (let repeat = 0; repeat < 2; repeat++) {
        reset(); Object.assign(p, { x: 230 - 12 * direction, invulnerableTicks: 0 }); step(1, { ...neutral, right: direction === 1, left: direction === -1 })
        read(`held ${repeat}`, 'CORE walk input acquires grab')
        applyHitWithAttack(boss, p, attackById('soldier.swing'), g.sim.events, g.sim.entities)
        step(); read(`freed release ${repeat}`, 'CORE holder hit and stepGrab release'); await capture(`victim-release-${repeat}`)
        const key = read(`release facing before ${repeat}`).key; boss.facing = boss.facing === 'right' ? 'left' : 'right'; read(`release facing after ${repeat}`); boss.facing = facing
        g.sim.freezeTicks = 10; step(10); read(`release frozen ${repeat}`, 'CORE stepSim freeze')
        step(6); read(`release complete ${repeat}`, 'CORE stepSim release completion')
        if (key !== 'misc:4') throw new Error(`victim missing release: ${key}`)
      }
      // Explicit upright registration poses: actual production Sprite transforms,
      // paired later with visible boot pixels, not a lowest-cloak ground proxy.
      reset(); read('ground guard')
      for (let t = 0; t < 32; t += 4) { boss.state = 'walk'; boss.stateTick = t; read('ground walk') }
      for (const [state, stateTick] of [['hitstun', 0], ['hitstun', 4], ['grabbed', 0], ['grab', 4], ['getup', 19]] as const) {
        reset({ state, stateTick }); read('ground upright')
      }
      reset({ state: 'walk', stateTick: 0 }); Object.assign(p, { x: 230 + 150 * direction })
      const walk: typeof rows = []
      for (let t = 0; t <= 32; t++) {
        if (t) step()
        const row = read('AI gait', 'CORE stepBoss real 1.2u/tick, initial position/think fixture')
        walk.push(row)
        if (t % 4 === 0) {
          const url = await new Promise<string>((resolve) => engine.renderer.snapshot((snap) => resolve((snap as HTMLImageElement).src)))
          images.push({ phase: `walk-${t}`, png: url })
        }
      }
      return { rows, walk, images, freezeCorrect, flightFrozen, runtime: { budget: motionRuntime().budget(), published: Object.keys(engine.registry.get('paintedHeroArt').motions).sort() }, camera: { zoom: g.cameras.main.zoom, scrollX: g.cameras.main.scrollX, scrollY: g.cameras.main.scrollY } }
    }, { boss, facing })
    expect(result.runtime.published).toEqual(['guanyu', 'soldier', 'xiahoudun', 'zhangfei'])
    expect(result.runtime.budget.sourceBytes).toBe(12372346)
    expect(result.freezeCorrect).toBe(true); expect(result.flightFrozen).toBe(true)
    expect(result.rows.filter((r) => r.phase === 'DOWN to dying').every((r) => r.key === 'fall:4')).toBe(true)
    for (const row of result.rows.filter((r) => r.phase.includes('interrupted'))) expect(row.key).toMatch(/^(getup:|fall:4)/)
    expect(result.rows.find((r) => r.phase === 'core hit interrupts strike')!.key).toBe('misc:0')
    expect(result.rows.find((r) => r.phase === 'skipped hurt renders latest')!.key).toBe('misc:0')
    expect(result.rows.find((r) => r.phase === 'skip attack latest')!.key).toBe('charge:4')
    expect(result.rows.find((r) => r.phase === 'flight moved')!.key).toBe('fall:3')
    expect(result.rows.find((r) => r.phase === 'flight freeze')!.key).toBe('fall:3')
    expect(result.rows.find((r) => r.phase === 'flight impact low tail')!.key).toMatch(/^(fall:4|getup:)/)
    for (let repeat = 0; repeat < 2; repeat++) {
      expect(result.rows.find((r) => r.phase === `held ${repeat}`)!.entity.state).toBe('grabbed')
      expect(result.rows.find((r) => r.phase === `freed release ${repeat}`)!.key).toBe('misc:4')
      expect(result.rows.find((r) => r.phase === `release frozen ${repeat}`)!.key).toBe('misc:4')
      expect(result.rows.find((r) => r.phase === `release complete ${repeat}`)!.key).toMatch(/^walk:/)
      const before = result.rows.find((r) => r.phase === `release facing before ${repeat}`)!, after = result.rows.find((r) => r.phase === `release facing after ${repeat}`)!
      expect(after.key).toBe(before.key); expect(after.sprite.x).toBe(before.sprite.x); expect(after.sprite.y).toBe(before.sprite.y)
      expect(after.sprite.flipX).not.toBe(before.sprite.flipX); expect(after.entity.stateTick).toBe(before.entity.stateTick)
    }
    for (const row of result.rows) { expect(row.sprite.texture.key).toBe('motion-source:xiahoudun'); expect(row.sprite.scaleX).toBe(0.5); expect(row.sprite.scaleY).toBe(0.5); expect(row.sprite.displayOriginX).toBe(260); expect(row.sprite.displayOriginY).toBe(420) }
    for (let i = 1; i < result.walk.length; i++) expect(Math.abs(result.walk[i]!.entity.x - result.walk[i - 1]!.entity.x)).toBeCloseTo(1.2, 8)
    expect(errors).toEqual([])
    const dir = `${OUT}/${renderer}-${facing}`; mkdirSync(dir, { recursive: true })
    for (const image of result.images) writeFileSync(`${dir}/${image.phase}.png`, Buffer.from(image.png.split(',')[1]!, 'base64'))
    writeFileSync(`${dir}/trace.json`, JSON.stringify({ ...result, images: result.images.map((i) => ({ phase: i.phase })), errors, videoDirectory: info.outputDir, nativeVideoViewed: false, pace: 'manual synchronous core stepping, not native-paced AI', method: 'actual GameScene.syncSprites; never setFrame' }, null, 2))
  })
}
