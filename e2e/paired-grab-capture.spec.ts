import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { CHARACTER_ORDER } from '../src/core/characters'
import { ENEMIES } from '../src/core/enemies'
import type { Sim } from '../src/core/sim'

/**
 * CMR-23 paired grab/throw capture harness (deterministic, clone of the
 * xiahoudun-transitions stepSim pattern). For ONE hero (env PAIRED_HERO,
 * default guanyu) x every enemy kind (env PAIRED_KINDS subset, default all
 * six) x both facings (env PAIRED_FACINGS subset): reset the pair, walk into
 * a REAL core grab, sample hold stateTicks 0/4/8, throw by attack input and
 * sample flight+6, the impact tick the throw ends, getup stateTick 12, then a
 * separate re-grab freed by a core hit on the holder. Each sample records the
 * live sim fields + actual sprite frame/display/depth/index of BOTH actors
 * and a union-bbox crop of the pair under
 * artifacts/motion/paired/<hero>/<renderer>/. Contact ROI measurement is a
 * later package and deliberately NOT done here.
 *
 * Renderer via env PAIRED_RENDERER (canvas|webgl, default canvas). The full
 * default matrix is 6 kinds x 2 facings x 7 samples = 84 traces/crops; the
 * Guan Yu extras (hold timeout, hold freeze, death on landing, co-op double
 * grab) land under extras/ and are not part of the 84.
 */
const HERO = process.env.PAIRED_HERO ?? 'guanyu'
const RENDERER = (process.env.PAIRED_RENDERER ?? 'canvas') as 'canvas' | 'webgl'
const ALL_KINDS = Object.keys(ENEMIES)
const KINDS = (process.env.PAIRED_KINDS?.split(',').map((s) => s.trim()).filter(Boolean) ?? ALL_KINDS)
const FACINGS = ((process.env.PAIRED_FACINGS?.split(',').map((s) => s.trim()).filter(Boolean) ?? ['right', 'left']) as Array<'right' | 'left'>)
const COOP_HERO = HERO === 'zhangfei' ? 'guanyu' : 'zhangfei'
const RUN_EXTRAS = HERO === 'guanyu' && process.env.PAIRED_EXTRAS !== '0'
const OUT = `artifacts/motion/paired/${HERO}/${RENDERER}`
const PHASES = ['hold0', 'hold4', 'hold8', 'flight6', 'impact', 'getup12', 'release'] as const

type Sprite = {
  frame: { name: string; realWidth: number; realHeight: number }; texture: { key: string }
  x: number; y: number; scaleX: number; scaleY: number; originX: number; originY: number
  displayOriginX: number; displayOriginY: number; displayWidth: number; displayHeight: number
  flipX: boolean; alpha: number; visible: boolean; depth: number
}
type Live = {
  sim: Sim; paused: boolean; syncSprites(): void; sprites: Map<number, Sprite>
  children: { list: unknown[] }
  cameras: { main: { zoom: number; scrollX: number; scrollY: number } }
}
interface Actor {
  id: number; kind: string; x: number; y: number; z: number; state: string; stateTick: number
  facing: string; grabbedBy: number | null; vx: number; hp: number
  sprite: {
    frame: string; texture: string; realWidth: number; realHeight: number
    display: { x: number; y: number; scaleX: number; scaleY: number; width: number; height: number; originX: number; originY: number; displayOriginX: number; displayOriginY: number; flipX: boolean; alpha: number; visible: boolean }
    depth: number; index: number
  }
}
interface Row {
  phase: string; kind: string; facing: string; tick: number; freezeTicks: number
  holder: Actor; victim: Actor; extraActors: Actor[]
  pin: { dx: number; dy: number }; unionBox: { x: number; y: number; w: number; h: number }
  cropFile: string; png: string; meta?: unknown
}

test(`paired grab capture: ${HERO} (${RENDERER})`, async ({ page }) => {
  test.setTimeout(600_000)
  expect(CHARACTER_ORDER, `unknown PAIRED_HERO ${HERO}`).toContain(HERO)
  expect(['canvas', 'webgl']).toContain(RENDERER)
  for (const kind of KINDS) expect(ALL_KINDS, `unknown PAIRED_KINDS ${kind}`).toContain(kind)
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(String(e)))
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto(`/?renderer=${RENDERER}&autopilot=1&motion=1`)
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate((hero) => window.__DW__!.startGame(hero, 42, 'stage1'), HERO)
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  const intro = (): Promise<boolean> => page.evaluate(() => !!window.__DW_GAME__?.scene.getScene('hud').children.list.some((o) => o.name === 'introCard'))
  await expect.poll(intro).toBe(true); await page.keyboard.press('Enter'); await expect.poll(intro).toBe(false)

  const combos = KINDS.map((kind) => ({ kind, maxHp: ENEMIES[kind]!.maxHp, speed: ENEMIES[kind]!.speed }))
  const result = await page.evaluate(async ({ hero, combos, facings, coopHero, runExtras }) => {
    const simPath = '/src/core/sim.ts', combatPath = '/src/core/combat.ts', attackPath = '/src/core/attacks.ts', entityPath = '/src/core/entities.ts', motionPath = '/src/game/adapters/motion-art.ts'
    const { stepSim, joinPlayer2 } = await import(/* @vite-ignore */ simPath) as typeof import('../src/core/sim')
    const { applyHitWithAttack } = await import(/* @vite-ignore */ combatPath) as typeof import('../src/core/combat')
    const { attackById } = await import(/* @vite-ignore */ attackPath) as typeof import('../src/core/attacks')
    const { makeCombatant } = await import(/* @vite-ignore */ entityPath) as typeof import('../src/core/entities')
    const { motionRuntime } = await import(/* @vite-ignore */ motionPath) as typeof import('../src/game/adapters/motion-art')
    const engine = window.__DW_GAME__!, g = engine.scene.getScene('game') as unknown as Live
    const prepare = motionRuntime() as unknown as {
      settle(): Promise<void>
      prepareKinds(scene: unknown, kinds: string[]): Promise<Array<{ kind: string; outcome: { ok: boolean } }>>
    }
    await prepare.settle()
    const kindsToPrepare = [hero, ...(runExtras ? [coopHero] : []), ...combos.map((c) => c.kind)]
    const prepared = await prepare.prepareKinds(g, [...new Set(kindsToPrepare)])
    const failed = prepared.filter((r) => !r.outcome.ok).map((r) => r.kind)
    if (failed.length) throw new Error(`motion prepare failed: ${failed.join(',')}`)

    g.paused = true; g.sim.cameraLocked = true
    const hud = engine.scene.getScene('hud'); hud.scene.pause()
    hud.children.list.forEach((o) => { (o as unknown as { visible: boolean }).visible = false })
    const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
    const neutral = { up: false, down: false, left: false, right: false, attackPressed: false, jumpPressed: false, specialPressed: false }
    const cam = g.cameras.main
    let nextId = 900200
    const rows: Row[] = [], extras: Row[] = []

    const step = (n = 1, input = neutral, input2 = neutral): void => {
      for (let i = 0; i < n; i++) { stepSim(g.sim, input, input2); g.syncSprites() }
    }
    const boxOf = (s: Sprite): { x: number; y: number; w: number; h: number } => ({
      x: Math.round((s.x - s.displayOriginX * Math.abs(s.scaleX) - cam.scrollX) * cam.zoom),
      y: Math.round((s.y - s.displayOriginY * Math.abs(s.scaleY) - cam.scrollY) * cam.zoom),
      w: Math.round(s.frame.realWidth * Math.abs(s.scaleX) * cam.zoom),
      h: Math.round(s.frame.realHeight * Math.abs(s.scaleY) * cam.zoom),
    })
    const actor = (e: typeof p): Actor => {
      const s = g.sprites.get(e.id)
      if (!s) throw new Error(`missing sprite for ${e.kind}#${e.id} in state ${e.state}`)
      return {
        id: e.id, kind: e.kind, x: e.x, y: e.y, z: e.z, state: e.state, stateTick: e.stateTick,
        facing: e.facing, grabbedBy: e.grabbedBy, vx: e.vx, hp: e.hp,
        sprite: {
          frame: s.frame.name, texture: s.texture.key, realWidth: s.frame.realWidth, realHeight: s.frame.realHeight,
          display: { x: s.x, y: s.y, scaleX: s.scaleX, scaleY: s.scaleY, width: s.displayWidth, height: s.displayHeight, originX: s.originX, originY: s.originY, displayOriginX: s.displayOriginX, displayOriginY: s.displayOriginY, flipX: s.flipX, alpha: s.alpha, visible: s.visible },
          depth: s.depth, index: g.children.list.indexOf(s),
        },
      }
    }
    const sample = async (sink: Row[], phase: string, kind: string, facing: string, holder: typeof p, victim: typeof p, extra: Array<typeof p> = [], dirName = '', meta?: unknown): Promise<Row> => {
      g.syncSprites()
      const all = [holder, victim, ...extra]
      const actors = all.map(actor)
      const boxes = all.map((e) => boxOf(g.sprites.get(e.id)!))
      const x0 = Math.min(...boxes.map((b) => b.x)), y0 = Math.min(...boxes.map((b) => b.y))
      const unionBox = { x: x0, y: y0, w: Math.max(...boxes.map((b) => b.x + b.w)) - x0, h: Math.max(...boxes.map((b) => b.y + b.h)) - y0 }
      const keys = actors.map((a) => a.sprite.frame)
      const url = await new Promise<string>((resolve) => engine.renderer.snapshot((snap) => resolve((snap as HTMLImageElement).src)))
      const image = new Image(); image.src = url; await image.decode()
      const cv = document.createElement('canvas'); cv.width = unionBox.w * 2; cv.height = unionBox.h * 2
      // Preserve the crop origin; out-of-viewport area stays blank padding.
      cv.getContext('2d')!.drawImage(image, -unionBox.x * 2, -unionBox.y * 2, image.width * 2, image.height * 2)
      const after = all.map((e) => g.sprites.get(e.id)!.frame.name)
      if (after.some((k, i) => k !== keys[i])) throw new Error(`snapshot frame drift at ${kind}/${facing}/${phase}: ${keys} -> ${after}`)
      const row: Row = {
        phase, kind, facing, tick: g.sim.tick, freezeTicks: g.sim.freezeTicks,
        holder: actors[0]!, victim: actors[1]!, extraActors: actors.slice(2),
        pin: { dx: victim.x - holder.x, dy: victim.y - holder.y }, unionBox,
        cropFile: `${dirName}${kind}-${facing}-${phase}.png`, png: cv.toDataURL('image/png'), meta,
      }
      sink.push(row); return row
    }

    let victim = p // replaced by reset() before any use
    const reset = (def: { kind: string; maxHp: number; speed: number }, facing: 'right' | 'left'): number => {
      const dir = facing === 'right' ? 1 : -1
      // Deletion pass first (forgetMotionEntity on the old victim sprite),
      // then a fresh victim id per attempt: no phantom motion history.
      g.sim.entities = [p]; g.syncSprites()
      victim = makeCombatant(nextId++, def.kind, 'enemy', 240, 220, def.maxHp, def.speed, facing === 'right' ? 'left' : 'right')
      victim.thinkTick = 999999
      g.sim.entities.push(victim)
      Object.assign(p, { x: 240 - 12 * dir, y: 220, z: 0, state: 'idle', stateTick: 0, attackId: null, bufferedAttack: false, struck: [], hp: p.maxHp, invulnerableTicks: 0, facing, vx: 0, airTicks: 0 })
      g.sim.freezeTicks = 0; g.sim.events.length = 0
      g.syncSprites()
      return dir
    }
    const acquire = (dir: number, label: string): void => {
      step(1, { ...neutral, right: dir === 1, left: dir === -1 })
      if (p.state !== 'grab' || victim.state !== 'grabbed' || victim.grabbedBy !== p.id) {
        throw new Error(`real grab not acquired (${label}): holder=${p.state} victim=${victim.state}/${victim.grabbedBy} dx=${victim.x - p.x}`)
      }
    }

    for (const def of combos) for (const facing of facings) {
      const dir = reset(def, facing)
      acquire(dir, `${def.kind}/${facing}`)
      // hold0: acquisition tick - grabbedBy is set, the 16u pin lands next tick.
      await sample(rows, 'hold0', def.kind, facing, p, victim)
      step(4); await sample(rows, 'hold4', def.kind, facing, p, victim)
      step(4); await sample(rows, 'hold8', def.kind, facing, p, victim)
      step(1, { ...neutral, attackPressed: true }) // core throw
      if (victim.state !== 'thrown') throw new Error(`throw did not start (${def.kind}/${facing}): victim=${victim.state}`)
      step(6); await sample(rows, 'flight6', def.kind, facing, p, victim)
      let guard = 0
      while (victim.state === 'thrown' && guard++ < 80) step()
      if (victim.state === 'thrown') throw new Error(`throw never impacted (${def.kind}/${facing})`)
      await sample(rows, 'impact', def.kind, facing, p, victim)
      guard = 0
      while (!(victim.state === 'getup' && victim.stateTick >= 12) && guard++ < 300) step()
      if (victim.state !== 'getup') throw new Error(`getup not reached (${def.kind}/${facing}): victim=${victim.state}/${victim.stateTick}`)
      await sample(rows, 'getup12', def.kind, facing, p, victim)
      // Separate hit-break: fresh real grab, core hit on the holder, stepGrab frees.
      reset(def, facing); acquire(dir, `${def.kind}/${facing} release`)
      step(2)
      applyHitWithAttack(victim, p, attackById('soldier.swing'), g.sim.events, g.sim.entities)
      step()
      await sample(rows, 'release', def.kind, facing, p, victim)
    }

    if (runExtras) {
      const soldier = combos.find((c) => c.kind === 'soldier')!
      const spearman = combos.find((c) => c.kind === 'spearman')!
      // Hold timeout: GRAB_HOLD_TICKS expires to knockdown, holder to idle.
      let dir = reset(soldier, 'right'); acquire(dir, 'timeout')
      let guard = 0
      while (victim.grabbedBy !== null && guard++ < 140) step()
      await sample(extras, 'timeout', 'soldier', 'right', p, victim, [], 'extras/')
      // Freeze during hold: world ticks only, pin and stateTick unchanged.
      dir = reset(soldier, 'right'); acquire(dir, 'freeze'); step(2)
      const frozen = { x: victim.x, stateTick: victim.stateTick }
      g.sim.freezeTicks = 8; step(8)
      await sample(extras, 'freeze', 'soldier', 'right', p, victim, [], 'extras/',
        { before: frozen, unchanged: victim.x === frozen.x && victim.stateTick === frozen.stateTick })
      // Death on landing: landing damage (12) exceeds the victim's hp (5).
      dir = reset(soldier, 'right'); acquire(dir, 'death-on-landing'); step(2)
      victim.hp = 5
      step(1, { ...neutral, attackPressed: true })
      guard = 0
      while (victim.state === 'thrown' && guard++ < 80) step()
      await sample(extras, 'death-on-landing', 'soldier', 'right', p, victim, [], 'extras/')
      // Co-op: player two joins for real and each hero holds its own victim.
      if (!joinPlayer2(g.sim, coopHero)) throw new Error('co-op join failed')
      const p2 = g.sim.entities.find((e) => e.id === g.sim.player2Id)!
      g.sim.entities = [p, p2]; g.syncSprites()
      const v1 = makeCombatant(nextId++, soldier.kind, 'enemy', 192, 220, soldier.maxHp, soldier.speed, 'left'); v1.thinkTick = 999999
      const v2 = makeCombatant(nextId++, spearman.kind, 'enemy', 292, 220, spearman.maxHp, spearman.speed, 'left'); v2.thinkTick = 999999
      g.sim.entities.push(v1, v2)
      Object.assign(p, { x: 180, y: 220, z: 0, state: 'idle', stateTick: 0, attackId: null, hp: p.maxHp, invulnerableTicks: 0, facing: 'right', vx: 0 })
      Object.assign(p2, { x: 280, y: 220, z: 0, state: 'idle', stateTick: 0, attackId: null, facing: 'right', vx: 0 })
      g.sim.freezeTicks = 0; g.sim.events.length = 0; g.syncSprites()
      step(1, { ...neutral, right: true }, { ...neutral, right: true })
      if (v1.grabbedBy !== p.id || v2.grabbedBy !== p2.id) {
        throw new Error(`co-op double grab failed: v1=${v1.state}/${v1.grabbedBy} v2=${v2.state}/${v2.grabbedBy}`)
      }
      step(2)
      await sample(extras, 'coop', 'soldier+spearman', 'right', p, v1, [p2, v2], 'extras/')
    }

    hud.scene.resume()
    return { rows, extras, prepared: prepared.map((r) => r.kind), camera: { zoom: cam.zoom, scrollX: cam.scrollX, scrollY: cam.scrollY } }
  }, { hero: HERO, combos, facings: FACINGS, coopHero: COOP_HERO, runExtras: RUN_EXTRAS })

  const { rows, extras } = result
  const expectActorFrame = (a: Actor, label: string): void => {
    expect(a.sprite.frame, label).toMatch(new RegExp(`^entity:${a.kind}:motion:`))
    expect(a.sprite.texture, label).toMatch(new RegExp(`^motion-(source|actions):${a.kind}(?:-|$)`))
    expect(a.sprite.display.visible, label).toBe(true)
    expect(a.sprite.depth, label).toBe(a.y)
    expect(a.sprite.index, label).toBeGreaterThanOrEqual(0)
  }
  expect(rows).toHaveLength(KINDS.length * FACINGS.length * PHASES.length)
  for (const kind of KINDS) for (const facing of FACINGS) {
    const dir = facing === 'right' ? 1 : -1
    const seq = rows.filter((r) => r.kind === kind && r.facing === facing)
    expect(seq.map((r) => r.phase), `${kind}/${facing}`).toEqual([...PHASES])
    const by = (phase: string): Row => seq.find((r) => r.phase === phase)!
    for (const row of seq) {
      expectActorFrame(row.holder, `${kind}/${facing}/${row.phase} holder`)
      expectActorFrame(row.victim, `${kind}/${facing}/${row.phase} victim`)
      expect(row.holder.kind).toBe(HERO); expect(row.victim.kind).toBe(kind)
      expect(row.holder.facing).toBe(facing)
      expect(row.png.startsWith('data:image/png;base64,')).toBe(true)
      expect(row.unionBox.w).toBeGreaterThan(0); expect(row.unionBox.h).toBeGreaterThan(0)
    }
    for (const [phase, tick] of [['hold0', 0], ['hold4', 4], ['hold8', 8]] as const) {
      const row = by(phase)
      expect(row.holder.state, `${kind}/${facing}/${phase}`).toBe('grab')
      expect(row.victim.state).toBe('grabbed')
      expect(row.victim.stateTick).toBe(tick)
      expect(row.victim.grabbedBy).toBe(row.holder.id)
      expect(row.victim.z).toBe(0)
    }
    // Pin: exactly 16u in the facing direction, same lane (hold0 is the
    // acquisition tick, before the first pin lands - recorded, not asserted).
    for (const phase of ['hold4', 'hold8'] as const) {
      expect(by(phase).pin.dx, `${kind}/${facing}/${phase} pin dx`).toBeCloseTo(16 * dir, 6)
      expect(by(phase).pin.dy).toBe(0)
      expect(by(phase).victim.vx).toBe(0)
    }
    expect(by('hold4').victim.sprite.frame).toBe(by('hold8').victim.sprite.frame)
    const flight = by('flight6')
    expect(flight.victim.state).toBe('thrown'); expect(flight.victim.grabbedBy).toBeNull()
    expect(flight.victim.vx).toBeCloseTo(3.5 * dir, 6); expect(flight.victim.z).toBe(10)
    expect(flight.holder.state).toBe('idle')
    const impact = by('impact')
    expect(impact.victim.state).toBe('knockdown'); expect(impact.victim.z).toBe(0); expect(impact.victim.vx).toBe(0)
    expect(impact.victim.hp).toBeLessThan(flight.victim.hp)
    const getup = by('getup12')
    expect(getup.victim.state).toBe('getup'); expect(getup.victim.stateTick).toBe(12)
    const release = by('release')
    expect(release.victim.grabbedBy).toBeNull(); expect(release.victim.state).toBe('walk')
    expect(release.holder.state).toBe('hitstun')
  }

  if (RUN_EXTRAS) {
    expect(extras.map((r) => r.phase)).toEqual(['timeout', 'freeze', 'death-on-landing', 'coop'])
    for (const row of extras) {
      expectActorFrame(row.holder, `extra ${row.phase} holder`)
      expectActorFrame(row.victim, `extra ${row.phase} victim`)
      for (const a of row.extraActors) expectActorFrame(a, `extra ${row.phase} extra`)
    }
    const by = (phase: string): Row => extras.find((r) => r.phase === phase)!
    expect(by('timeout').victim.state).toBe('knockdown')
    expect(by('timeout').victim.grabbedBy).toBeNull(); expect(by('timeout').holder.state).toBe('idle')
    expect(by('freeze').victim.state).toBe('grabbed')
    expect((by('freeze').meta as { unchanged: boolean }).unchanged).toBe(true)
    expect(by('death-on-landing').victim.state).toBe('dying'); expect(by('death-on-landing').victim.hp).toBeLessThanOrEqual(0)
    const coop = by('coop')
    expect(coop.victim.grabbedBy).toBe(coop.holder.id); expect(coop.victim.state).toBe('grabbed')
    expect(coop.extraActors).toHaveLength(2)
    expect(coop.extraActors[1]!.grabbedBy).toBe(coop.extraActors[0]!.id)
    expect(coop.extraActors[1]!.state).toBe('grabbed')
    expect(coop.extraActors[0]!.kind).toBe(COOP_HERO); expect(coop.extraActors[0]!.state).toBe('grab')
  } else expect(extras).toHaveLength(0)

  expect(errors).toEqual([])
  mkdirSync(`${OUT}/extras`, { recursive: true })
  const strip = (row: Row): Omit<Row, 'png'> => { const { png: _png, ...rest } = row; void _png; return rest }
  for (const row of [...rows, ...extras]) writeFileSync(`${OUT}/${row.cropFile}`, Buffer.from(row.png.split(',')[1]!, 'base64'))
  writeFileSync(`${OUT}/trace.json`, `${JSON.stringify({
    hero: HERO, renderer: RENDERER, kinds: KINDS, facings: FACINGS, preparedKinds: result.prepared,
    camera: result.camera, coreCount: rows.length, extrasCount: extras.length,
    core: rows.map(strip), extras: extras.map(strip), errors,
    method: 'paused GameScene, deterministic stepSim + syncSprites every tick; real walk-in grab and attack-input throw; holder-hit release via core applyHitWithAttack; renderer.snapshot union-bbox crops; never setFrame',
    notMeasured: 'contact ROI / hand-collar gap intentionally not measured in this package',
  }, null, 2)}\n`)
})
