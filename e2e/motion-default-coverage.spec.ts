import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { attackById } from '../src/core/attacks'
import { CHARACTER_ORDER, characterById } from '../src/core/characters'
import { DYING_TICKS } from '../src/core/constants'
import { ENEMIES } from '../src/core/enemies'
import type { Sim } from '../src/core/sim'

/**
 * CMR-24 default-motion coverage (Canvas, full cast). NO `motion` URL param:
 * motion is default-ON (only `motion=0` selects legacy), so this spec proves
 * the shipped default path for all 11 fighters. Clone of the deterministic
 * paused stepSim pattern (paired-grab-capture) + per-fighter attack tables
 * (motion-capture). WebGL reduced + mobile-viewport + `?motion=0`
 * discrimination tests follow at the bottom (same per-row exact checks).
 *
 * Injected sweep: per kind x both facings, fresh-entity rows for every state
 * its dispatcher supports, at published-clip key ticks +/-1 and attack
 * startup/active boundaries. Natural chains via stepSim: grab->throw->getup
 * (enemy victims, both holder facings), lethal hit->dying->dead/removal (all
 * kinds), jump/jumpattack->land (heroes, as the mutated player).
 *
 * Per row: sprite visible, alpha>0 (dead is the one documented exception -
 * GameScene holds a completed defeat fade at alpha 0, so dead rows assert
 * alpha===0 plus the exact motion frame/rect/pixels instead), frame is
 * entity:<kind>:motion:<frame present in the pack manifest>, texture is that
 * pack's sheet/actions key for the cell, exact cut/trim/full-cell vs the
 * manifest, ground registration, and >=1 alpha pixel per distinct frame.
 * Any legacy/blank/missing row is a FAIL with kind/state/tick/facing.
 */
const OUT = 'artifacts/motion/default-coverage'
const HEROES = [...CHARACTER_ORDER]
const ENEMY_KINDS = Object.keys(ENEMIES)
const ALL_KINDS = [...HEROES, ...ENEMY_KINDS]
const FACINGS = ['right', 'left'] as const
const HERO_STATES = ['idle', 'walk', 'attack', 'jump', 'jumpattack', 'special', 'hitstun', 'knockdown', 'getup', 'grab', 'grabbed', 'thrown', 'dying', 'dead']
const ENEMY_STATES = ['idle', 'walk', 'attack', 'hitstun', 'knockdown', 'getup', 'grab', 'grabbed', 'thrown', 'dying', 'dead']

interface KindCfg {
  kind: string; hero: boolean; maxHp: number; speed: number
  attacks: string[]; jumpAttack: string | null; specialAttack: string | null
}
const kindCfg = (kind: string): KindCfg => {
  if ((HEROES as string[]).includes(kind)) {
    const c = characterById(kind)
    return { kind, hero: true, maxHp: c.maxHp, speed: c.walkSpeed, attacks: [...c.combo], jumpAttack: c.jumpAttack, specialAttack: c.specialAttack }
  }
  const e = ENEMIES[kind]!
  return {
    kind, hero: false, maxHp: e.maxHp, speed: e.speed,
    attacks: e.boss ? [e.boss.charge, e.boss.combo, e.boss.heavy] : (e.attackId ? [e.attackId] : []),
    jumpAttack: null, specialAttack: null,
  }
}
const CFGS = ALL_KINDS.map(kindCfg)

interface Cell { x: number; y: number; w: number; h: number; trimX?: number; trimY?: number; srcW?: number; srcH?: number; sheet?: string }
interface Clip { loop: boolean; duration: number; keys: Array<{ tick: number; frame: string }> }
interface Manifest {
  density: number; box: { width: number; height: number; groundY: number }
  frames: Record<string, Cell>; clips: Record<string, Clip>
  attackBindings?: Record<string, string>; collapseTail?: [string, string]
  sheetKey: string; actionsKey: string
}
interface SpriteRec {
  frame: string; texture: string; visible: boolean; alpha: number
  x: number; y: number; depth: number; flipX: boolean
  originX: number; originY: number; scaleX: number; scaleY: number
  cutX: number; cutY: number; cutWidth: number; cutHeight: number
  frameX: number; frameY: number; frameW: number; frameH: number
  realWidth: number; realHeight: number; trimmed: boolean
  sourceSize: { w: number; h: number }; spriteSourceSize: { x: number; y: number; w: number; h: number }
}
interface Row {
  origin: 'injected' | 'natural'; chain: string; seq: number; role: string
  kind: string; facing: string; state: string; stateTick: number; simTick: number
  attackId: string | null; variant: string; thinkTick: number | null
  x: number; y: number; z: number; airTicks: number; hp: number; lift: number
  sprite: SpriteRec | null
}
interface PlanRow { kind: string; facing: string; state: string; stateTick: number; attackId: string | null; variant: string; clip: string }
interface ChainMeta { chain: string; kind: string; facing: string; steps: number; statesSeen: string[]; terminal: string; ok: boolean; note: string }
interface SweepResult {
  rows: Row[]; plan: PlanRow[]; chains: ChainMeta[]
  manifests: Record<string, Manifest>
  alphaFrames: Record<string, { texture: string; alphaPixels: number; w: number; h: number }>
  preparedAll: Array<{ kind: string; ok: boolean }>
  reprepares: Array<{ kind: string; ok: boolean; readyAfter: boolean; where: string }>
  errors: string[]
}

type FrameLike = {
  name: string; realWidth: number; realHeight: number; trimmed: boolean
  cutX: number; cutY: number; cutWidth: number; cutHeight: number
  x: number; y: number; width: number; height: number
  data?: { sourceSize: { w: number; h: number }; spriteSourceSize: { x: number; y: number; w: number; h: number } }
}
type SpriteLike = {
  frame: FrameLike; texture: { key: string }; visible: boolean; alpha: number
  x: number; y: number; depth: number; flipX: boolean
  originX: number; originY: number; scaleX: number; scaleY: number
}
type Live = {
  sim: Sim & { charId: string }; paused: boolean; syncSprites(): void
  sprites: Map<number, SpriteLike>
  registry: { get(key: string): unknown }
  textures: { exists(key: string): boolean; get(key: string): { getSourceImage(): CanvasImageSource & { width: number; height: number } } }
}

test('default motion coverage: full cast (canvas, no motion param)', async ({ page }) => {
  test.setTimeout(900_000)
  expect(ALL_KINDS).toHaveLength(11)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.setViewportSize({ width: 960, height: 540 })
  // Default path only: renderer+autopilot, deliberately NO motion param.
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage1'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  const intro = (): Promise<boolean> => page.evaluate(() => !!window.__DW_GAME__?.scene.getScene('hud').children.list.some((o) => o.name === 'introCard'))
  await expect.poll(intro).toBe(true)
  await page.keyboard.press('Enter')
  await expect.poll(intro).toBe(false)

  const result = await page.evaluate(async ({ cfgs, facings, dyingTicks }) => {
    const simPath = '/src/core/sim.ts', combatPath = '/src/core/combat.ts', attackPath = '/src/core/attacks.ts', entityPath = '/src/core/entities.ts', motionPath = '/src/game/adapters/motion-art.ts'
    const { stepSim } = await import(/* @vite-ignore */ simPath) as typeof import('../src/core/sim')
    const { applyHitWithAttack } = await import(/* @vite-ignore */ combatPath) as typeof import('../src/core/combat')
    const { attackById } = await import(/* @vite-ignore */ attackPath) as typeof import('../src/core/attacks')
    const { makeCombatant } = await import(/* @vite-ignore */ entityPath) as typeof import('../src/core/entities')
    const motion = await import(/* @vite-ignore */ motionPath) as typeof import('../src/game/adapters/motion-art')
    const engine = window.__DW_GAME__!
    const g = engine.scene.getScene('game') as unknown as Live
    const runtime = motion.motionRuntime() as unknown as {
      settle(): Promise<void>
      prepareKinds(scene: unknown, kinds: string[]): Promise<Array<{ kind: string; outcome: { ok: boolean } }>>
      kindReady(scene: unknown, kind: string): boolean
    }
    const rows: Row[] = [], plan: PlanRow[] = [], chains: ChainMeta[] = [], sweepErrors: string[] = []
    const reprepares: SweepResult['reprepares'] = []
    const alphaFrames: SweepResult['alphaFrames'] = {}
    const manifests: Record<string, Manifest> = {}

    await runtime.settle()
    // Load all 11 up front; the cache may still evict under its byte cap, so
    // every sweep/chain re-checks kindReady and re-prepares (ensureReady).
    const preparedAllRaw = await runtime.prepareKinds(g, cfgs.map((c) => c.kind))
    const preparedAll = preparedAllRaw.map((r) => ({ kind: r.kind, ok: r.outcome.ok }))
    const ensureReady = async (kind: string, where: string): Promise<boolean> => {
      if (runtime.kindReady(g, kind)) return true
      const res = await runtime.prepareKinds(g, [kind])
      const ok = res[0]?.outcome.ok === true
      const readyAfter = runtime.kindReady(g, kind)
      reprepares.push({ kind, ok, readyAfter, where })
      if (!ok || !readyAfter) sweepErrors.push(`prepare failed kind=${kind} where=${where} ok=${ok} readyAfter=${readyAfter}`)
      return ok && readyAfter
    }
    const artOf = (kind: string): Manifest & { frames: Record<string, Cell> } | undefined => {
      const rec = g.registry.get('paintedHeroArt') as { motions?: Record<string, Manifest> } | undefined
      return rec?.motions?.[kind] as (Manifest & { frames: Record<string, Cell> }) | undefined
    }
    const snapshotManifest = (kind: string): void => {
      const art = artOf(kind)
      if (!art || manifests[kind]) return
      const keys = motion.motionTextureKeys(kind)
      manifests[kind] = {
        density: art.density, box: art.box, frames: art.frames, clips: art.clips,
        attackBindings: art.attackBindings, collapseTail: art.collapseTail,
        sheetKey: keys.sheet, actionsKey: keys.actions,
      }
    }

    g.paused = true
    g.sim.cameraLocked = false // no wave spawns while chains run
    const hud = engine.scene.getScene('hud')
    hud.scene.pause()
    hud.children.list.forEach((o) => { (o as unknown as { visible: boolean }).visible = false })
    const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
    const neutral = { up: false, down: false, left: false, right: false, attackPressed: false, jumpPressed: false, specialPressed: false }
    let nextId = 910000
    const step = (input = neutral): void => { stepSim(g.sim, input, neutral); g.syncSprites() }
    const resetPlayer = (x: number, facing: 'right' | 'left'): void => {
      Object.assign(p, { x, y: 220, z: 0, state: 'idle', stateTick: 0, attackId: null, bufferedAttack: false, struck: [], hp: p.maxHp, invulnerableTicks: 0, facing, vx: 0, airTicks: 0, grabbedBy: null })
      g.sim.freezeTicks = 0
      g.sim.events.length = 0
      g.sim.phase = 'fight'
    }

    const alphaCv = document.createElement('canvas')
    const ensureAlpha = (s: SpriteLike): void => {
      const id = s.frame.name
      if (!id.includes(':motion:') || alphaFrames[id]) return
      try {
        const src = g.textures.get(s.texture.key).getSourceImage()
        const { cutX, cutY, cutWidth: w, cutHeight: h } = s.frame
        alphaCv.width = Math.max(1, w); alphaCv.height = Math.max(1, h)
        const ctx = alphaCv.getContext('2d', { willReadFrequently: true })!
        ctx.clearRect(0, 0, w, h)
        ctx.drawImage(src, cutX, cutY, w, h, 0, 0, w, h)
        const data = ctx.getImageData(0, 0, w, h).data
        let n = 0
        for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) n++
        alphaFrames[id] = { texture: s.texture.key, alphaPixels: n, w, h }
      } catch (err) {
        alphaFrames[id] = { texture: s.texture.key, alphaPixels: -1, w: s.frame.cutWidth, h: s.frame.cutHeight }
        sweepErrors.push(`alpha read failed frame=${id}: ${String(err)}`)
      }
    }
    const spriteRec = (s: SpriteLike): SpriteRec => ({
      frame: s.frame.name, texture: s.texture.key, visible: s.visible, alpha: s.alpha,
      x: s.x, y: s.y, depth: s.depth, flipX: s.flipX,
      originX: s.originX, originY: s.originY, scaleX: s.scaleX, scaleY: s.scaleY,
      cutX: s.frame.cutX, cutY: s.frame.cutY, cutWidth: s.frame.cutWidth, cutHeight: s.frame.cutHeight,
      frameX: s.frame.x, frameY: s.frame.y, frameW: s.frame.width, frameH: s.frame.height,
      realWidth: s.frame.realWidth, realHeight: s.frame.realHeight, trimmed: s.frame.trimmed,
      sourceSize: s.frame.data?.sourceSize ?? { w: s.frame.cutWidth, h: s.frame.cutHeight },
      spriteSourceSize: s.frame.data?.spriteSourceSize ?? { x: 0, y: 0, w: s.frame.cutWidth, h: s.frame.cutHeight },
    })
    /** Sync once, then record every actor (missing sprite = recorded, never thrown). */
    const sample = (meta: { origin: Row['origin']; chain: string; seq: number; variant: string }, actors: Array<{ e: typeof p; role: string }>): void => {
      g.syncSprites()
      for (const { e, role } of actors) {
        const s = g.sprites.get(e.id)
        if (s) ensureAlpha(s)
        rows.push({
          origin: meta.origin, chain: meta.chain, seq: meta.seq, role,
          kind: e.kind, facing: e.facing, state: e.state, stateTick: e.stateTick, simTick: g.sim.tick,
          attackId: e.attackId, variant: meta.variant,
          thinkTick: typeof e.thinkTick === 'number' && Number.isFinite(e.thinkTick) ? e.thinkTick : null,
          x: e.x, y: e.y, z: e.z, airTicks: e.airTicks, hp: e.hp,
          lift: motion.motionVisualLift(g as never, e as never),
          sprite: s ? spriteRec(s) : null,
        })
      }
    }

    // ---- tick-edge derivation from the PUBLISHED clips -------------------
    const edges = (clip: Clip | undefined, extra: number[] = []): number[] => {
      const set = new Set<number>([0, 1])
      if (clip) {
        for (const k of clip.keys) { set.add(k.tick - 1); set.add(k.tick); set.add(k.tick + 1) }
        set.add(clip.duration - 1); set.add(clip.duration); set.add(clip.duration + 1)
      }
      for (const t of extra) set.add(t)
      return [...set].filter((t) => t >= 0).sort((a, b) => a - b)
    }
    const attackEdges = (clip: Clip | undefined, attackId: string): number[] => {
      const a = attackById(attackId)
      const total = a.startup + a.active + a.recover
      return edges(clip, [a.startup - 1, a.startup, a.startup + 1, a.startup + a.active - 1, a.startup + a.active, a.startup + a.active + 1, total - 1, total])
    }
    const boundClip = (art: Manifest, attackId: string): string | undefined =>
      art.attackBindings?.[attackId] ?? (art.clips[attackId.slice(3)] ? attackId.slice(3) : undefined)

    interface InjectedSpec { state: string; attackId: string | null; ticks: number[]; clip: string; variant: string; thinkTicks?: Map<number, number> }
    const injectedSpecs = (cfg: KindCfg, art: Manifest): InjectedSpec[] => {
      const specs: InjectedSpec[] = []
      const dyingExtra = [Math.floor(dyingTicks / 3) - 1, Math.floor(dyingTicks / 3), Math.floor(dyingTicks / 3) + 1, Math.floor((2 * dyingTicks) / 3) - 1, Math.floor((2 * dyingTicks) / 3), Math.floor((2 * dyingTicks) / 3) + 1, dyingTicks - 1]
      specs.push({ state: 'idle', attackId: null, ticks: edges(art.clips.idle), clip: 'idle', variant: '' })
      if (cfg.kind === 'archer' && art.clips.shoot) {
        // Archers have no attack state: firing phases ride idle+thinkTick.
        const fi = 90
        const phases = edges(art.clips.shoot).filter((t) => t < fi)
        const thinkTicks = new Map(phases.map((ph) => [ph, (fi - (ph % fi)) % fi]))
        specs.push({ state: 'idle', attackId: null, ticks: phases, clip: 'shoot', variant: 'shoot', thinkTicks })
      }
      specs.push({ state: 'walk', attackId: null, ticks: edges(art.clips.walk), clip: 'walk', variant: '' })
      for (const attackId of cfg.attacks) {
        const clipName = boundClip(art, attackId) ?? '(unbound)'
        specs.push({ state: 'attack', attackId, ticks: attackEdges(art.clips[clipName], attackId), clip: clipName, variant: '' })
      }
      if (cfg.hero) {
        specs.push({ state: 'jump', attackId: null, ticks: edges(art.clips.jump), clip: 'jump', variant: '' })
        const jaTicks = [...new Set([...edges(art.clips.jumpattack), ...edges(art.clips.jump), ...(cfg.jumpAttack ? attackEdges(art.clips.jumpattack, cfg.jumpAttack) : [])])].sort((a, b) => a - b)
        specs.push({ state: 'jumpattack', attackId: cfg.jumpAttack, ticks: jaTicks, clip: 'jumpattack+jump', variant: '' })
        specs.push({ state: 'special', attackId: cfg.specialAttack, ticks: cfg.specialAttack ? attackEdges(art.clips.special, cfg.specialAttack) : edges(art.clips.special), clip: 'special', variant: '' })
      }
      specs.push({ state: 'hitstun', attackId: null, ticks: edges(art.clips.hurt), clip: 'hurt', variant: '' })
      specs.push({ state: 'knockdown', attackId: null, ticks: edges(art.clips.fall), clip: 'fall', variant: '' })
      specs.push({ state: 'getup', attackId: null, ticks: edges(art.clips.getup), clip: 'getup', variant: '' })
      specs.push({ state: 'grab', attackId: null, ticks: art.clips.grab ? edges(art.clips.grab) : [0, 1, 4, 5, 8], clip: art.clips.grab ? 'grab' : '(static)', variant: '' })
      specs.push({ state: 'grabbed', attackId: null, ticks: [0, 1, 8], clip: '(static)', variant: '' })
      specs.push({ state: 'thrown', attackId: null, ticks: [0, 1, 3, 4, 5, 9, 10, 13, 14, 15], clip: '(static thresholds)', variant: '' })
      specs.push({ state: 'dying', attackId: null, ticks: edges(art.clips.fall, dyingExtra).filter((t) => t < dyingTicks), clip: 'fall', variant: '' })
      specs.push({ state: 'dead', attackId: null, ticks: [0, 1], clip: '(static)', variant: '' })
      return specs
    }

    // ---- injected sweep ----------------------------------------------------
    for (const cfg of cfgs) {
      try {
        await ensureReady(cfg.kind, `injected:${cfg.kind}`)
        snapshotManifest(cfg.kind)
        const art = manifests[cfg.kind]
        if (!art) { sweepErrors.push(`no published manifest kind=${cfg.kind}`); continue }
        const specs = injectedSpecs(cfg, art)
        for (const facing of facings) for (const spec of specs) {
          for (const tick of spec.ticks) {
            plan.push({ kind: cfg.kind, facing, state: spec.state, stateTick: tick, attackId: spec.attackId, variant: spec.variant, clip: spec.clip })
            // Fresh entity id per row + deletion pass: no playback history.
            g.sim.entities = [p]
            resetPlayer(60, 'right')
            g.syncSprites()
            const e = makeCombatant(nextId++, cfg.kind, 'enemy', 240, 220, cfg.maxHp, cfg.speed, facing)
            const fields: Record<string, unknown> = { state: spec.state, stateTick: tick, attackId: spec.attackId, thinkTick: 999999, invulnerableTicks: 0 }
            if (spec.state === 'idle' && !spec.variant) fields.thinkTick = undefined
            if (spec.variant === 'shoot') fields.thinkTick = spec.thinkTicks?.get(tick)
            if (spec.state === 'jump' || spec.state === 'jumpattack') Object.assign(fields, { airTicks: tick, z: 40 })
            if (spec.state === 'thrown') Object.assign(fields, { z: 10, vx: 3.5, airTicks: tick, thrownFromX: 240 - 3.5 * tick })
            if (spec.state === 'dying' || spec.state === 'dead') fields.hp = 0
            if (spec.state === 'grabbed') fields.grabbedBy = p.id
            Object.assign(e, fields)
            g.sim.entities.push(e)
            sample({ origin: 'injected', chain: 'injected', seq: tick, variant: spec.variant }, [{ e, role: 'subject' }])
          }
        }
      } catch (err) { sweepErrors.push(`injected kind=${cfg.kind}: ${String(err)}`) }
    }

    // ---- natural chain: grab -> throw -> getup ----------------------------
    for (const cfg of cfgs.filter((c) => !c.hero)) for (const facing of facings) {
      const meta: ChainMeta = { chain: 'grab-throw-getup', kind: cfg.kind, facing, steps: 0, statesSeen: [], terminal: '', ok: false, note: '' }
      try {
        await ensureReady('guanyu', `grab:${cfg.kind}`); await ensureReady(cfg.kind, `grab:${cfg.kind}`)
        snapshotManifest('guanyu'); snapshotManifest(cfg.kind)
        const dir = facing === 'right' ? 1 : -1
        g.sim.entities = [p]; g.syncSprites()
        const victim = makeCombatant(nextId++, cfg.kind, 'enemy', 240, 220, cfg.maxHp, cfg.speed, facing === 'right' ? 'left' : 'right')
        victim.thinkTick = 999999
        g.sim.entities.push(victim)
        resetPlayer(240 - 12 * dir, facing)
        g.syncSprites()
        step({ ...neutral, right: dir === 1, left: dir === -1 })
        if (p.state !== 'grab' || victim.state !== 'grabbed') throw new Error(`grab not acquired holder=${p.state} victim=${victim.state}`)
        let seq = 0
        const seen = new Set<string>()
        const snapBoth = (): void => { sample({ origin: 'natural', chain: meta.chain, seq: seq++, variant: '' }, [{ e: p, role: 'holder' }, { e: victim, role: 'victim' }]); seen.add(victim.state) }
        snapBoth()
        for (let i = 0; i < 4; i++) { step(); snapBoth() }
        step({ ...neutral, attackPressed: true }); snapBoth()
        if ((victim.state as string) !== 'thrown') throw new Error(`throw did not start victim=${victim.state}`)
        let guard = 0, sawGetup = false
        const vState = (): string => victim.state
        while (guard++ < 400) {
          step(); snapBoth()
          if (vState() === 'getup') sawGetup = true
          if (!g.sim.entities.includes(victim)) { meta.terminal = 'removed'; break }
          if (sawGetup && (vState() === 'idle' || vState() === 'walk')) { meta.terminal = vState(); break }
          if (vState() === 'dying' || vState() === 'dead') { meta.terminal = vState(); break }
        }
        if (!meta.terminal) meta.terminal = `guard:${victim.state}`
        meta.steps = seq; meta.statesSeen = [...seen]
        meta.ok = seen.has('grabbed') && seen.has('thrown') && seen.has('knockdown') && sawGetup && (meta.terminal === 'idle' || meta.terminal === 'walk')
        meta.note = `holder=guanyu victimStates=${meta.statesSeen.join('>')}`
      } catch (err) { meta.note = String(err); sweepErrors.push(`chain grab-throw-getup kind=${cfg.kind} facing=${facing}: ${String(err)}`) }
      chains.push(meta)
    }

    // ---- natural chain: lethal hit -> dying -> dead/removal --------------
    // Enemies die as enemy dummies; heroes must die as the (mutated) player -
    // enemy AI rightfully rejects hero kinds as enemy-side combatants.
    const savePlayer = (): { kind: string; charId: string; maxHp: number; speed: number } => ({ kind: p.kind, charId: g.sim.charId, maxHp: p.maxHp, speed: p.speed })
    const restorePlayer = (s: { kind: string; charId: string; maxHp: number; speed: number }): void => {
      Object.assign(p, { kind: s.kind, maxHp: s.maxHp, speed: s.speed })
      g.sim.charId = s.charId
      resetPlayer(240, 'right')
      g.sim.entities = [p]
      g.syncSprites()
    }
    for (const cfg of cfgs) for (const facing of facings) {
      const meta: ChainMeta = { chain: 'lethal-dying-dead', kind: cfg.kind, facing, steps: 0, statesSeen: [], terminal: '', ok: false, note: '' }
      const saved = savePlayer()
      try {
        await ensureReady(cfg.kind, `lethal:${cfg.kind}`)
        snapshotManifest(cfg.kind)
        g.sim.entities = [p]; g.syncSprites()
        let victim: typeof p
        let attacker: typeof p
        if (cfg.hero) {
          Object.assign(p, { kind: cfg.kind, maxHp: cfg.maxHp, speed: cfg.speed })
          g.sim.charId = cfg.kind
          resetPlayer(240, facing)
          p.hp = 1
          victim = p
          attacker = makeCombatant(nextId++, 'soldier', 'enemy', 200, 220, 24, 0.9, 'right')
        } else {
          victim = makeCombatant(nextId++, cfg.kind, 'enemy', 240, 220, cfg.maxHp, cfg.speed, facing)
          victim.thinkTick = 999999
          victim.hp = 1
          g.sim.entities.push(victim)
          resetPlayer(200, 'right')
          attacker = p
        }
        g.syncSprites()
        applyHitWithAttack(attacker, victim, attackById('soldier.swing'), g.sim.events, g.sim.entities)
        let seq = 0
        const seen = new Set<string>([victim.state])
        sample({ origin: 'natural', chain: meta.chain, seq: seq++, variant: '' }, [{ e: victim, role: 'victim' }])
        let guard = 0
        const vState = (): string => victim.state
        while (guard++ < 160) {
          step()
          g.sim.phase = 'fight' // a dying mutated player flips gameover; keep rendering on the plain dying path
          if (!g.sim.entities.includes(victim)) { meta.terminal = 'removed-after-dying'; break }
          seen.add(vState())
          sample({ origin: 'natural', chain: meta.chain, seq: seq++, variant: '' }, [{ e: victim, role: 'victim' }])
          if (vState() === 'dead') { meta.terminal = 'dead'; break }
        }
        if (!meta.terminal) meta.terminal = `guard:${vState()}`
        meta.steps = seq; meta.statesSeen = [...seen]
        // Core removes dead non-hero entities in the same stepSim that flips
        // dying->dead, so 'removed-after-dying' is the honest terminal for
        // enemy dummies (dead FRAME covered by injected rows); the mutated
        // player stays in the list, so heroes must reach sampled 'dead'.
        meta.ok = seen.has('dying') && (cfg.hero ? meta.terminal === 'dead' : (meta.terminal === 'dead' || meta.terminal === 'removed-after-dying'))
        meta.note = `hp=1 + soldier.swing; victim=${cfg.hero ? 'mutated player' : 'enemy dummy'}; states=${meta.statesSeen.join('>')}`
      } catch (err) { meta.note = String(err); sweepErrors.push(`chain lethal kind=${cfg.kind} facing=${facing}: ${String(err)}`) }
      if (cfg.hero) restorePlayer(saved)
      chains.push(meta)
    }

    // ---- natural chains: jump / jumpattack -> land (heroes as player) ----
    const origPlayer = { kind: p.kind, charId: g.sim.charId, maxHp: p.maxHp, speed: p.speed }
    for (const cfg of cfgs.filter((c) => c.hero)) for (const facing of facings) for (const aerial of [false, true]) {
      const chainName = aerial ? 'jumpattack-land' : 'jump-land'
      const meta: ChainMeta = { chain: chainName, kind: cfg.kind, facing, steps: 0, statesSeen: [], terminal: '', ok: false, note: '' }
      try {
        await ensureReady(cfg.kind, `${chainName}:${cfg.kind}`)
        snapshotManifest(cfg.kind)
        g.sim.entities = [p]
        Object.assign(p, { kind: cfg.kind, maxHp: cfg.maxHp, speed: cfg.speed })
        g.sim.charId = cfg.kind
        resetPlayer(240, facing)
        g.syncSprites()
        let seq = 0
        const seen = new Set<string>()
        const snap = (): void => { sample({ origin: 'natural', chain: chainName, seq: seq++, variant: '' }, [{ e: p, role: 'player' }]); seen.add(p.state) }
        snap()
        step({ ...neutral, jumpPressed: true }); snap()
        let guard = 0, attacked = !aerial, landedAt = -1
        while (guard++ < 160) {
          const press = aerial && !attacked && p.state === 'jump' && p.airTicks >= 8
          if (press) attacked = true
          step(press ? { ...neutral, attackPressed: true } : neutral)
          snap()
          const airborne = seen.has('jump') || seen.has('jumpattack')
          if (airborne && p.z === 0 && (p.state === 'idle' || p.state === 'walk')) {
            if (landedAt < 0) landedAt = seq
            if (seq - landedAt >= 10) { meta.terminal = p.state; break } // landing-clip tail
          }
        }
        if (!meta.terminal) meta.terminal = `guard:${p.state}`
        meta.steps = seq; meta.statesSeen = [...seen]
        meta.ok = seen.has('jump') && (!aerial || seen.has('jumpattack')) && (meta.terminal === 'idle' || meta.terminal === 'walk')
        meta.note = `player mutated to ${cfg.kind} (charId+kind); states=${meta.statesSeen.join('>')}`
      } catch (err) { meta.note = String(err); sweepErrors.push(`chain ${chainName} kind=${cfg.kind} facing=${facing}: ${String(err)}`) }
      chains.push(meta)
    }
    Object.assign(p, { kind: origPlayer.kind, maxHp: origPlayer.maxHp, speed: origPlayer.speed })
    g.sim.charId = origPlayer.charId
    resetPlayer(240, 'right')
    g.sim.entities = [p]
    g.syncSprites()
    hud.scene.resume()

    const out: SweepResult = { rows, plan, chains, manifests, alphaFrames, preparedAll, reprepares, errors: sweepErrors }
    return out
  }, { cfgs: CFGS, facings: [...FACINGS], dyingTicks: DYING_TICKS })

  // ---- row-level exact checks ---------------------------------------------
  const failures: string[] = []
  const label = (r: Row): string => `kind=${r.kind} state=${r.state} tick=${r.stateTick} facing=${r.facing} origin=${r.origin}${r.origin === 'natural' ? ` chain=${r.chain} seq=${r.seq} role=${r.role}` : ''} attack=${r.attackId ?? '-'}${r.variant ? ` variant=${r.variant}` : ''}`
  const checkRow = (r: Row): void => {
    const at = label(r)
    const man = result.manifests[r.kind]
    if (!man) { failures.push(`FAIL ${at}: no published manifest`); return }
    const s = r.sprite
    if (!s) { failures.push(`FAIL ${at}: missing sprite (blank)`); return }
    if (!s.visible) failures.push(`FAIL ${at}: sprite not visible`)
    if (r.state === 'dead') {
      // Documented GameScene defeat-fade hold; frame/rect/pixel checks below
      // still prove this is the exact motion frame, not legacy/blank.
      if (s.alpha !== 0) failures.push(`FAIL ${at}: dead alpha=${s.alpha} expected 0 (defeat-fade hold)`)
    } else if (!(s.alpha > 0)) failures.push(`FAIL ${at}: alpha=${s.alpha} expected >0`)
    if (r.state === 'dying' && Math.abs(s.alpha - Math.max(0, 1 - r.stateTick / DYING_TICKS)) > 1e-9) {
      failures.push(`FAIL ${at}: dying alpha=${s.alpha} expected fade ${Math.max(0, 1 - r.stateTick / DYING_TICKS)}`)
    }
    const m = new RegExp(`^entity:${r.kind}:motion:(.+)$`).exec(s.frame)
    if (!m) { failures.push(`FAIL ${at}: legacy/non-motion frame='${s.frame}' texture='${s.texture}'`); return }
    const frameName = m[1]!
    const cell = man.frames[frameName]
    if (!cell) { failures.push(`FAIL ${at}: frame '${frameName}' not in pack manifest`); return }
    const expectedTex = cell.sheet === 'actions' ? man.actionsKey : man.sheetKey
    if (s.texture !== expectedTex) failures.push(`FAIL ${at}: texture='${s.texture}' expected pack key '${expectedTex}' for frame ${frameName}`)
    const srcW = cell.srcW ?? cell.w, srcH = cell.srcH ?? cell.h
    const exact: Array<[string, number, number]> = [
      ['cutX', s.cutX, cell.x], ['cutY', s.cutY, cell.y], ['cutWidth', s.cutWidth, cell.w], ['cutHeight', s.cutHeight, cell.h],
      ['frameX(trimX)', s.frameX, cell.trimX ?? 0], ['frameY(trimY)', s.frameY, cell.trimY ?? 0],
      ['frameW', s.frameW, cell.w], ['frameH', s.frameH, cell.h],
      ['realWidth(full-cell)', s.realWidth, srcW], ['realHeight(full-cell)', s.realHeight, srcH],
      ['sourceSize.w', s.sourceSize.w, srcW], ['sourceSize.h', s.sourceSize.h, srcH],
      ['spriteSourceSize.x', s.spriteSourceSize.x, cell.trimX ?? 0], ['spriteSourceSize.y', s.spriteSourceSize.y, cell.trimY ?? 0],
      ['spriteSourceSize.w', s.spriteSourceSize.w, cell.w], ['spriteSourceSize.h', s.spriteSourceSize.h, cell.h],
      ['fullCellW=box*density', srcW, man.box.width * man.density], ['fullCellH=box*density', srcH, man.box.height * man.density],
    ]
    for (const [name, got, want] of exact) if (got !== want) failures.push(`FAIL ${at}: frame ${frameName} ${name}=${got} expected ${want}`)
    const expectTrimmed = cell.srcW !== undefined || cell.srcH !== undefined
    if (s.trimmed !== expectTrimmed) failures.push(`FAIL ${at}: frame ${frameName} trimmed=${s.trimmed} expected ${expectTrimmed}`)
    // Ground registration: position, origin at box.groundY, fixed scale, flip, depth.
    if (s.x !== r.x) failures.push(`FAIL ${at}: sprite.x=${s.x} expected entity.x=${r.x}`)
    const wantY = r.y - r.z - r.lift
    if (Math.abs(s.y - wantY) > 1e-9) failures.push(`FAIL ${at}: sprite.y=${s.y} expected ground ${wantY} (y-z-lift)`)
    if (Math.abs(s.originX - 0.5) > 1e-12 || Math.abs(s.originY - man.box.groundY / man.box.height) > 1e-12) {
      failures.push(`FAIL ${at}: origin=(${s.originX},${s.originY}) expected (0.5,${man.box.groundY / man.box.height})`)
    }
    if (Math.abs(Math.abs(s.scaleX) - 1 / man.density) > 1e-12 || Math.abs(Math.abs(s.scaleY) - 1 / man.density) > 1e-12) {
      failures.push(`FAIL ${at}: scale=(${s.scaleX},${s.scaleY}) expected 1/density=${1 / man.density}`)
    }
    if (s.flipX !== (r.facing === 'left')) failures.push(`FAIL ${at}: flipX=${s.flipX} expected facing=${r.facing}`)
    if (s.depth !== r.y) failures.push(`FAIL ${at}: depth=${s.depth} expected entity.y=${r.y}`)
    const alpha = result.alphaFrames[s.frame]
    if (!alpha) failures.push(`FAIL ${at}: no alpha evidence for distinct frame ${s.frame}`)
    else if (alpha.alphaPixels < 1) failures.push(`FAIL ${at}: distinct frame ${s.frame} has ${alpha.alphaPixels} alpha pixels (blank)`)
  }
  for (const row of result.rows) checkRow(row)

  // Completeness: injected plan == injected rows, states/attacks per table.
  const planKey = (k: string, f: string, st: string, t: number, a: string | null, v: string): string => `${k}|${f}|${st}|${t}|${a ?? '-'}|${v}`
  const planned = new Map<string, number>()
  for (const p of result.plan) planned.set(planKey(p.kind, p.facing, p.state, p.stateTick, p.attackId, p.variant), (planned.get(planKey(p.kind, p.facing, p.state, p.stateTick, p.attackId, p.variant)) ?? 0) + 1)
  const seenInjected = new Map<string, number>()
  for (const r of result.rows.filter((x) => x.origin === 'injected')) {
    const k = planKey(r.kind, r.facing, r.state, r.stateTick, r.attackId, r.variant)
    seenInjected.set(k, (seenInjected.get(k) ?? 0) + 1)
  }
  for (const [k, n] of planned) if (seenInjected.get(k) !== n) failures.push(`FAIL completeness planned row ${k} x${n} seen x${seenInjected.get(k) ?? 0}`)
  for (const k of seenInjected.keys()) if (!planned.has(k)) failures.push(`FAIL completeness unplanned injected row ${k}`)
  for (const cfg of CFGS) {
    const wantStates = (cfg.hero ? HERO_STATES : ENEMY_STATES).filter((s) => cfg.kind !== 'archer' || s !== 'attack')
    for (const facing of FACINGS) {
      const gotStates = new Set(result.plan.filter((p) => p.kind === cfg.kind && p.facing === facing).map((p) => p.state))
      for (const st of wantStates) if (!gotStates.has(st)) failures.push(`FAIL completeness kind=${cfg.kind} facing=${facing}: state ${st} not swept`)
      const gotAttacks = new Set(result.plan.filter((p) => p.kind === cfg.kind && p.facing === facing && p.state === 'attack').map((p) => p.attackId))
      for (const a of cfg.attacks) if (!gotAttacks.has(a)) failures.push(`FAIL completeness kind=${cfg.kind} facing=${facing}: attackId ${a} not swept`)
      if (cfg.kind === 'archer' && !result.plan.some((p) => p.kind === 'archer' && p.facing === facing && p.variant === 'shoot')) {
        failures.push(`FAIL completeness kind=archer facing=${facing}: shoot variant not swept`)
      }
      // Every bound attack clip key tick +/-1 and startup/active boundary planned.
      const man = result.manifests[cfg.kind]
      if (man) for (const a of cfg.attacks) {
        const clipName = man.attackBindings?.[a] ?? (man.clips[a.slice(3)] ? a.slice(3) : undefined)
        const clip = clipName ? man.clips[clipName] : undefined
        const need = new Set<number>()
        clip?.keys.forEach((k) => { need.add(k.tick - 1); need.add(k.tick); need.add(k.tick + 1) })
        const def = attackById(a)
        ;[def.startup - 1, def.startup, def.startup + def.active - 1, def.startup + def.active].forEach((t) => need.add(t))
        const have = new Set(result.plan.filter((p) => p.kind === cfg.kind && p.facing === facing && p.attackId === a).map((p) => p.stateTick))
        for (const t of need) if (t >= 0 && !have.has(t)) failures.push(`FAIL completeness kind=${cfg.kind} facing=${facing} attack=${a}: edge tick ${t} not planned`)
      }
    }
  }
  for (const c of result.chains) if (!c.ok) failures.push(`FAIL chain=${c.chain} kind=${c.kind} facing=${c.facing}: terminal=${c.terminal} ${c.note}`)
  const wantChains = ENEMY_KINDS.length * 2 + ALL_KINDS.length * 2 + HEROES.length * 2 * 2
  if (result.chains.length !== wantChains) failures.push(`FAIL chains count=${result.chains.length} expected ${wantChains}`)
  for (const p of result.preparedAll) if (!p.ok) failures.push(`FAIL prepareKinds(all 11) outcome not ok kind=${p.kind}`)
  if (result.preparedAll.length !== 11) failures.push(`FAIL prepareKinds(all 11) returned ${result.preparedAll.length}`)
  for (const e of result.errors) failures.push(`FAIL sweep error: ${e}`)
  for (const e of errors) failures.push(`FAIL pageerror: ${e}`)

  const distinctFrames = Object.keys(result.alphaFrames).sort()
  const report = {
    renderer: 'canvas', url: '/?renderer=canvas&autopilot=1 (no motion param; default ON)',
    kinds: ALL_KINDS, facings: FACINGS,
    preparedAll: result.preparedAll, reprepares: result.reprepares,
    injectedPlanRows: result.plan.length,
    rows: { total: result.rows.length, injected: result.rows.filter((r) => r.origin === 'injected').length, natural: result.rows.filter((r) => r.origin === 'natural').length },
    distinctMotionFrames: distinctFrames.length,
    blankDistinctFrames: distinctFrames.filter((f) => (result.alphaFrames[f]?.alphaPixels ?? 0) < 1),
    chains: result.chains,
    failures,
    failureCount: failures.length,
    notes: [
      'dead rows: GameScene holds the completed defeat fade at alpha 0; exact motion frame/rect/alpha-pixel checks still apply (no legacy/blank escape).',
      'lethal chain terminal removed-after-dying: core removes dead non-hero entities in the same stepSim that flips dying->dead; dead frame covered by injected rows.',
      'archer has no attack state in its dispatcher; firing covered as idle+thinkTick shoot variant at shoot-clip phase edges.',
      'enemy kinds have no jump/jumpattack/special in their dispatchers (unreachable hero states); heroes cover all 14 states.',
    ],
  }
  mkdirSync(OUT, { recursive: true })
  writeFileSync(`${OUT}/trace.json`, `${JSON.stringify({ ...report, plan: result.plan, rows: result.rows, alphaFrames: result.alphaFrames, manifests: result.manifests }, null, 2)}\n`)
  writeFileSync(`${OUT}/report.json`, `${JSON.stringify(report, null, 2)}\n`)
  const md = [
    '# Default motion coverage (Canvas, full cast, no motion param)', '',
    `- kinds: ${ALL_KINDS.join(', ')}`,
    `- rows: ${report.rows.total} (injected ${report.rows.injected}, natural ${report.rows.natural}); injected plan ${report.injectedPlanRows}`,
    `- distinct motion frames with alpha evidence: ${report.distinctMotionFrames}; blank: ${report.blankDistinctFrames.length}`,
    `- chains ok: ${result.chains.filter((c) => c.ok).length}/${result.chains.length}`,
    `- reprepares (eviction recovery): ${result.reprepares.length}`,
    `- FAILURES: ${failures.length}`, '',
    ...(failures.length ? ['## Exact FAIL rows', '', ...failures.map((f) => `- ${f}`)] : ['All rows passed exact motion-frame/rect/ground/alpha checks.']),
    '', '## Notes', ...report.notes.map((n) => `- ${n}`), '',
  ].join('\n')
  writeFileSync(`${OUT}/REPORT.md`, md)

  expect(errors).toEqual([])
  expect(failures, failures.slice(0, 80).join('\n')).toEqual([])
})

// ---------------------------------------------------------------------------
// Reduced sweeps (WebGL + mobile viewport) + ?motion=0 discrimination. Same
// fresh-entity injected pattern and the same per-row exact motion/rect
// assertions as the Canvas full-cast test above, on a reduced state set.
// ---------------------------------------------------------------------------
interface ReducedResult {
  rows: Row[]; plan: PlanRow[]; chains: ChainMeta[]
  manifests: Record<string, Manifest>
  alphaFrames: SweepResult['alphaFrames']; errors: string[]
}
interface ReducedOpts { kinds: string[]; states: string[]; full: string[]; chain: { holder: string; victim: string } | null }

async function bootGame(page: Page, query: string, viewport: { width: number; height: number }): Promise<string[]> {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.setViewportSize(viewport)
  await page.goto(query)
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage1'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  const intro = (): Promise<boolean> => page.evaluate(() => !!window.__DW_GAME__?.scene.getScene('hud').children.list.some((o) => o.name === 'introCard'))
  await expect.poll(intro).toBe(true)
  await page.keyboard.press('Enter')
  await expect.poll(intro).toBe(false)
  return errors
}

async function runReducedSweep(page: Page, opts: ReducedOpts): Promise<ReducedResult> {
  return page.evaluate(async ({ cfgs, opts: o }) => {
    const simPath = '/src/core/sim.ts', attackPath = '/src/core/attacks.ts', entityPath = '/src/core/entities.ts', motionPath = '/src/game/adapters/motion-art.ts'
    const { stepSim } = await import(/* @vite-ignore */ simPath) as typeof import('../src/core/sim')
    const { attackById } = await import(/* @vite-ignore */ attackPath) as typeof import('../src/core/attacks')
    const { makeCombatant } = await import(/* @vite-ignore */ entityPath) as typeof import('../src/core/entities')
    const motion = await import(/* @vite-ignore */ motionPath) as typeof import('../src/game/adapters/motion-art')
    const engine = window.__DW_GAME__!
    const g = engine.scene.getScene('game') as unknown as Live
    const runtime = motion.motionRuntime() as unknown as {
      settle(): Promise<void>
      prepareKinds(scene: unknown, kinds: string[]): Promise<Array<{ kind: string; outcome: { ok: boolean } }>>
      kindReady(scene: unknown, kind: string): boolean
    }
    const rows: Row[] = [], plan: PlanRow[] = [], chains: ChainMeta[] = [], sweepErrors: string[] = []
    const alphaFrames: SweepResult['alphaFrames'] = {}, manifests: Record<string, Manifest> = {}
    await runtime.settle()
    const needKinds = [...new Set([...o.kinds, ...(o.chain ? [o.chain.holder, o.chain.victim] : [])])]
    await runtime.prepareKinds(g, needKinds)
    const ensureReady = async (kind: string, where: string): Promise<boolean> => {
      if (runtime.kindReady(g, kind)) return true
      const res = await runtime.prepareKinds(g, [kind])
      const ok = res[0]?.outcome.ok === true && runtime.kindReady(g, kind)
      if (!ok) sweepErrors.push(`prepare failed kind=${kind} where=${where}`)
      return ok
    }
    const snapshotManifest = (kind: string): void => {
      if (manifests[kind]) return
      const rec = g.registry.get('paintedHeroArt') as { motions?: Record<string, Manifest> } | undefined
      const art = rec?.motions?.[kind]
      if (!art) return
      const keys = motion.motionTextureKeys(kind)
      manifests[kind] = { density: art.density, box: art.box, frames: art.frames, clips: art.clips, attackBindings: art.attackBindings, collapseTail: art.collapseTail, sheetKey: keys.sheet, actionsKey: keys.actions }
    }
    g.paused = true
    g.sim.cameraLocked = false
    const hud = engine.scene.getScene('hud')
    hud.scene.pause()
    hud.children.list.forEach((obj) => { (obj as unknown as { visible: boolean }).visible = false })
    const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
    const neutral = { up: false, down: false, left: false, right: false, attackPressed: false, jumpPressed: false, specialPressed: false }
    let nextId = 920000 + Math.floor(Math.random() * 1000) * 100000
    const step = (input = neutral): void => { stepSim(g.sim, input, neutral); g.syncSprites() }
    const resetPlayer = (x: number, facing: 'right' | 'left'): void => {
      Object.assign(p, { x, y: 220, z: 0, state: 'idle', stateTick: 0, attackId: null, bufferedAttack: false, struck: [], hp: p.maxHp, invulnerableTicks: 0, facing, vx: 0, airTicks: 0, grabbedBy: null })
      g.sim.freezeTicks = 0; g.sim.events.length = 0; g.sim.phase = 'fight'
    }
    const alphaCv = document.createElement('canvas')
    const ensureAlpha = (s: SpriteLike): void => {
      const id = s.frame.name
      if (!id.includes(':motion:') || alphaFrames[id]) return
      try {
        const src = g.textures.get(s.texture.key).getSourceImage()
        const { cutX, cutY, cutWidth: w, cutHeight: h } = s.frame
        alphaCv.width = Math.max(1, w); alphaCv.height = Math.max(1, h)
        const ctx = alphaCv.getContext('2d', { willReadFrequently: true })!
        ctx.clearRect(0, 0, w, h); ctx.drawImage(src, cutX, cutY, w, h, 0, 0, w, h)
        const data = ctx.getImageData(0, 0, w, h).data
        let n = 0
        for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) n++
        alphaFrames[id] = { texture: s.texture.key, alphaPixels: n, w, h }
      } catch (err) { alphaFrames[id] = { texture: s.texture.key, alphaPixels: -1, w: s.frame.cutWidth, h: s.frame.cutHeight }; sweepErrors.push(`alpha read failed frame=${id}: ${String(err)}`) }
    }
    const sample = (meta: { origin: Row['origin']; chain: string; seq: number; variant: string }, actors: Array<{ e: typeof p; role: string }>): void => {
      g.syncSprites()
      for (const { e, role } of actors) {
        const s = g.sprites.get(e.id)
        if (s) ensureAlpha(s)
        rows.push({
          origin: meta.origin, chain: meta.chain, seq: meta.seq, role,
          kind: e.kind, facing: e.facing, state: e.state, stateTick: e.stateTick, simTick: g.sim.tick,
          attackId: e.attackId, variant: meta.variant,
          thinkTick: typeof e.thinkTick === 'number' && Number.isFinite(e.thinkTick) ? e.thinkTick : null,
          x: e.x, y: e.y, z: e.z, airTicks: e.airTicks, hp: e.hp,
          lift: motion.motionVisualLift(g as never, e as never),
          sprite: s ? {
            frame: s.frame.name, texture: s.texture.key, visible: s.visible, alpha: s.alpha,
            x: s.x, y: s.y, depth: s.depth, flipX: s.flipX, originX: s.originX, originY: s.originY, scaleX: s.scaleX, scaleY: s.scaleY,
            cutX: s.frame.cutX, cutY: s.frame.cutY, cutWidth: s.frame.cutWidth, cutHeight: s.frame.cutHeight,
            frameX: s.frame.x, frameY: s.frame.y, frameW: s.frame.width, frameH: s.frame.height,
            realWidth: s.frame.realWidth, realHeight: s.frame.realHeight, trimmed: s.frame.trimmed,
            sourceSize: s.frame.data?.sourceSize ?? { w: s.frame.cutWidth, h: s.frame.cutHeight },
            spriteSourceSize: s.frame.data?.spriteSourceSize ?? { x: 0, y: 0, w: s.frame.cutWidth, h: s.frame.cutHeight },
          } : null,
        })
      }
    }
    const edges = (clip: Clip | undefined, extra: number[] = []): number[] => {
      const set = new Set<number>([0, 1])
      if (clip) { for (const k of clip.keys) { set.add(k.tick - 1); set.add(k.tick); set.add(k.tick + 1) } set.add(clip.duration - 1); set.add(clip.duration); set.add(clip.duration + 1) }
      for (const t of extra) set.add(t)
      return [...set].filter((t) => t >= 0).sort((a, b) => a - b)
    }
    const attackEdges = (clip: Clip | undefined, attackId: string): number[] => {
      const a = attackById(attackId), total = a.startup + a.active + a.recover
      return edges(clip, [a.startup - 1, a.startup, a.startup + 1, a.startup + a.active - 1, a.startup + a.active, a.startup + a.active + 1, total - 1, total])
    }
    const boundClip = (art: Manifest, attackId: string): string | undefined => art.attackBindings?.[attackId] ?? (art.clips[attackId.slice(3)] ? attackId.slice(3) : undefined)

    interface Spec { state: string; attackId: string | null; ticks: number[]; clip: string; variant: string; thinkTicks?: Map<number, number> }
    const specsFor = (cfg: KindCfg, art: Manifest): Spec[] => {
      const specs: Spec[] = [], isFull = o.full.includes(cfg.kind)
      for (const st of o.states) {
        if (st === 'idle') specs.push({ state: 'idle', attackId: null, ticks: edges(art.clips.idle), clip: 'idle', variant: '' })
        else if (st === 'walk') specs.push({ state: 'walk', attackId: null, ticks: edges(art.clips.walk), clip: 'walk', variant: '' })
        else if (st === 'attack') {
          if (cfg.kind === 'archer' && art.clips.shoot) {
            const fi = 90, phases = edges(art.clips.shoot).filter((t) => t < fi)
            specs.push({ state: 'idle', attackId: null, ticks: phases, clip: 'shoot', variant: 'shoot', thinkTicks: new Map(phases.map((ph) => [ph, (fi - (ph % fi)) % fi])) })
          } else for (const attackId of (isFull ? cfg.attacks : cfg.attacks.slice(0, 1))) {
            const clipName = boundClip(art, attackId) ?? '(unbound)'
            specs.push({ state: 'attack', attackId, ticks: attackEdges(art.clips[clipName], attackId), clip: clipName, variant: '' })
          }
        } else if (st === 'fall') specs.push({ state: 'knockdown', attackId: null, ticks: edges(art.clips.fall), clip: 'fall', variant: '' })
        else if (st === 'dead') specs.push({ state: 'dead', attackId: null, ticks: [0, 1], clip: '(static)', variant: '' })
        else if (st === 'thrown' && isFull) specs.push({ state: 'thrown', attackId: null, ticks: [0, 1, 3, 4, 5, 9, 10, 13, 14, 15], clip: '(static thresholds)', variant: '' })
        else if (st === 'special' && isFull && cfg.hero) specs.push({ state: 'special', attackId: cfg.specialAttack, ticks: cfg.specialAttack ? attackEdges(art.clips.special, cfg.specialAttack) : edges(art.clips.special), clip: 'special', variant: '' })
        else if (st === 'jumpattack' && isFull && cfg.hero) specs.push({ state: 'jumpattack', attackId: cfg.jumpAttack, ticks: [...new Set([...edges(art.clips.jumpattack), ...(cfg.jumpAttack ? attackEdges(art.clips.jumpattack, cfg.jumpAttack) : [])])].sort((a, b) => a - b), clip: 'jumpattack', variant: '' })
      }
      return specs
    }
    for (const cfg of cfgs.filter((c) => o.kinds.includes(c.kind))) {
      try {
        await ensureReady(cfg.kind, `injected:${cfg.kind}`)
        snapshotManifest(cfg.kind)
        const art = manifests[cfg.kind]
        if (!art) { sweepErrors.push(`no published manifest kind=${cfg.kind}`); continue }
        for (const spec of specsFor(cfg, art)) for (const tick of spec.ticks) {
          plan.push({ kind: cfg.kind, facing: 'right', state: spec.state, stateTick: tick, attackId: spec.attackId, variant: spec.variant, clip: spec.clip })
          g.sim.entities = [p]; resetPlayer(60, 'right'); g.syncSprites()
          const e = makeCombatant(nextId++, cfg.kind, 'enemy', 240, 220, cfg.maxHp, cfg.speed, 'right')
          const fields: Record<string, unknown> = { state: spec.state, stateTick: tick, attackId: spec.attackId, thinkTick: 999999, invulnerableTicks: 0 }
          if (spec.state === 'idle' && !spec.variant) fields.thinkTick = undefined
          if (spec.variant === 'shoot') fields.thinkTick = spec.thinkTicks?.get(tick)
          if (spec.state === 'jumpattack') Object.assign(fields, { airTicks: tick, z: 40 })
          if (spec.state === 'thrown') Object.assign(fields, { z: 10, vx: 3.5, airTicks: tick, thrownFromX: 240 - 3.5 * tick })
          if (spec.state === 'dead') fields.hp = 0
          Object.assign(e, fields)
          g.sim.entities.push(e)
          sample({ origin: 'injected', chain: 'injected', seq: tick, variant: spec.variant }, [{ e, role: 'subject' }])
        }
      } catch (err) { sweepErrors.push(`injected kind=${cfg.kind}: ${String(err)}`) }
    }
    // Natural thrown chain (fuller sweep): holder hero grabs+throws victim.
    if (o.chain) {
      const { holder, victim: victimKind } = o.chain
      const vcfg = cfgs.find((c) => c.kind === victimKind)!
      const meta: ChainMeta = { chain: 'grab-throw-getup', kind: victimKind, facing: 'right', steps: 0, statesSeen: [], terminal: '', ok: false, note: '' }
      const saved = { kind: p.kind, charId: g.sim.charId, maxHp: p.maxHp, speed: p.speed }
      try {
        await ensureReady(holder, 'chain'); await ensureReady(victimKind, 'chain')
        snapshotManifest(holder); snapshotManifest(victimKind)
        const hcfg = cfgs.find((c) => c.kind === holder)!
        Object.assign(p, { kind: holder, maxHp: hcfg.maxHp, speed: hcfg.speed }); g.sim.charId = holder
        g.sim.entities = [p]; g.syncSprites()
        const victim = makeCombatant(nextId++, victimKind, 'enemy', 240, 220, vcfg.maxHp, vcfg.speed, 'left')
        victim.thinkTick = 999999
        g.sim.entities.push(victim)
        resetPlayer(228, 'right'); g.syncSprites()
        step({ ...neutral, right: true })
        if (p.state !== 'grab' || victim.state !== 'grabbed') throw new Error(`grab not acquired holder=${p.state} victim=${victim.state}`)
        let seq = 0; const seen = new Set<string>()
        const snapBoth = (): void => { sample({ origin: 'natural', chain: meta.chain, seq: seq++, variant: '' }, [{ e: p, role: 'holder' }, { e: victim, role: 'victim' }]); seen.add(victim.state) }
        snapBoth()
        for (let i = 0; i < 4; i++) { step(); snapBoth() }
        step({ ...neutral, attackPressed: true }); snapBoth()
        if ((victim.state as string) !== 'thrown') throw new Error(`throw did not start victim=${victim.state}`)
        let guard = 0, sawGetup = false
        const vState = (): string => victim.state
        while (guard++ < 400) {
          step(); snapBoth()
          if (vState() === 'getup') sawGetup = true
          if (!g.sim.entities.includes(victim)) { meta.terminal = 'removed'; break }
          if (sawGetup && (vState() === 'idle' || vState() === 'walk')) { meta.terminal = vState(); break }
          if (vState() === 'dying' || vState() === 'dead') { meta.terminal = vState(); break }
        }
        if (!meta.terminal) meta.terminal = `guard:${victim.state}`
        meta.steps = seq; meta.statesSeen = [...seen]
        meta.ok = seen.has('grabbed') && seen.has('thrown') && seen.has('knockdown') && sawGetup && (meta.terminal === 'idle' || meta.terminal === 'walk')
        meta.note = `holder=${holder} victimStates=${meta.statesSeen.join('>')}`
      } catch (err) { meta.note = String(err); sweepErrors.push(`chain grab-throw-getup: ${String(err)}`) }
      Object.assign(p, { kind: saved.kind, maxHp: saved.maxHp, speed: saved.speed }); g.sim.charId = saved.charId
      resetPlayer(240, 'right'); g.sim.entities = [p]; g.syncSprites()
      chains.push(meta)
    }
    hud.scene.resume()
    return { rows, plan, chains, manifests, alphaFrames, errors: sweepErrors }
  }, { cfgs: CFGS, opts })
}

/** Same per-row exact checks as the Canvas full-cast test (shared by reduced sweeps). */
function checkReducedRows(result: ReducedResult, failures: string[]): void {
  const label = (r: Row): string => `kind=${r.kind} state=${r.state} tick=${r.stateTick} facing=${r.facing} origin=${r.origin}${r.origin === 'natural' ? ` chain=${r.chain} seq=${r.seq} role=${r.role}` : ''} attack=${r.attackId ?? '-'}${r.variant ? ` variant=${r.variant}` : ''}`
  for (const r of result.rows) {
    const at = label(r)
    const man = result.manifests[r.kind]
    if (!man) { failures.push(`FAIL ${at}: no published manifest`); continue }
    const s = r.sprite
    if (!s) { failures.push(`FAIL ${at}: missing sprite (blank)`); continue }
    if (!s.visible) failures.push(`FAIL ${at}: sprite not visible`)
    if (r.state === 'dead') { if (s.alpha !== 0) failures.push(`FAIL ${at}: dead alpha=${s.alpha} expected 0 (defeat-fade hold)`) }
    else if (!(s.alpha > 0)) failures.push(`FAIL ${at}: alpha=${s.alpha} expected >0`)
    if (r.state === 'dying' && Math.abs(s.alpha - Math.max(0, 1 - r.stateTick / DYING_TICKS)) > 1e-9) failures.push(`FAIL ${at}: dying alpha=${s.alpha} expected fade`)
    const m = new RegExp(`^entity:${r.kind}:motion:(.+)$`).exec(s.frame)
    if (!m) { failures.push(`FAIL ${at}: legacy/non-motion frame='${s.frame}' texture='${s.texture}'`); continue }
    const frameName = m[1]!, cell = man.frames[frameName]
    if (!cell) { failures.push(`FAIL ${at}: frame '${frameName}' not in pack manifest`); continue }
    const expectedTex = cell.sheet === 'actions' ? man.actionsKey : man.sheetKey
    if (s.texture !== expectedTex) failures.push(`FAIL ${at}: texture='${s.texture}' expected '${expectedTex}'`)
    const srcW = cell.srcW ?? cell.w, srcH = cell.srcH ?? cell.h
    const exact: Array<[string, number, number]> = [
      ['cutX', s.cutX, cell.x], ['cutY', s.cutY, cell.y], ['cutWidth', s.cutWidth, cell.w], ['cutHeight', s.cutHeight, cell.h],
      ['frameX(trimX)', s.frameX, cell.trimX ?? 0], ['frameY(trimY)', s.frameY, cell.trimY ?? 0],
      ['frameW', s.frameW, cell.w], ['frameH', s.frameH, cell.h],
      ['realWidth(full-cell)', s.realWidth, srcW], ['realHeight(full-cell)', s.realHeight, srcH],
      ['sourceSize.w', s.sourceSize.w, srcW], ['sourceSize.h', s.sourceSize.h, srcH],
      ['spriteSourceSize.x', s.spriteSourceSize.x, cell.trimX ?? 0], ['spriteSourceSize.y', s.spriteSourceSize.y, cell.trimY ?? 0],
      ['spriteSourceSize.w', s.spriteSourceSize.w, cell.w], ['spriteSourceSize.h', s.spriteSourceSize.h, cell.h],
      ['fullCellW=box*density', srcW, man.box.width * man.density], ['fullCellH=box*density', srcH, man.box.height * man.density],
    ]
    for (const [name, got, want] of exact) if (got !== want) failures.push(`FAIL ${at}: frame ${frameName} ${name}=${got} expected ${want}`)
    if (s.trimmed !== (cell.srcW !== undefined || cell.srcH !== undefined)) failures.push(`FAIL ${at}: frame ${frameName} trimmed mismatch`)
    if (s.x !== r.x) failures.push(`FAIL ${at}: sprite.x=${s.x} expected ${r.x}`)
    if (Math.abs(s.y - (r.y - r.z - r.lift)) > 1e-9) failures.push(`FAIL ${at}: sprite.y=${s.y} expected ground ${r.y - r.z - r.lift}`)
    if (Math.abs(s.originX - 0.5) > 1e-12 || Math.abs(s.originY - man.box.groundY / man.box.height) > 1e-12) failures.push(`FAIL ${at}: origin mismatch`)
    if (Math.abs(Math.abs(s.scaleX) - 1 / man.density) > 1e-12 || Math.abs(Math.abs(s.scaleY) - 1 / man.density) > 1e-12) failures.push(`FAIL ${at}: scale mismatch`)
    if (s.flipX !== (r.facing === 'left')) failures.push(`FAIL ${at}: flipX mismatch`)
    if (s.depth !== r.y) failures.push(`FAIL ${at}: depth mismatch`)
    const alpha = result.alphaFrames[s.frame]
    if (!alpha) failures.push(`FAIL ${at}: no alpha evidence for ${s.frame}`)
    else if (alpha.alphaPixels < 1) failures.push(`FAIL ${at}: frame ${s.frame} has ${alpha.alphaPixels} alpha pixels (blank)`)
  }
  const key = (k: string, st: string, t: number, a: string | null, v: string): string => `${k}|right|${st}|${t}|${a ?? '-'}|${v}`
  const planned = new Map<string, number>(), seen = new Map<string, number>()
  for (const p of result.plan) planned.set(key(p.kind, p.state, p.stateTick, p.attackId, p.variant), (planned.get(key(p.kind, p.state, p.stateTick, p.attackId, p.variant)) ?? 0) + 1)
  for (const r of result.rows.filter((x) => x.origin === 'injected')) seen.set(key(r.kind, r.state, r.stateTick, r.attackId, r.variant), (seen.get(key(r.kind, r.state, r.stateTick, r.attackId, r.variant)) ?? 0) + 1)
  for (const [k, n] of planned) if (seen.get(k) !== n) failures.push(`FAIL completeness planned ${k} x${n} seen x${seen.get(k) ?? 0}`)
  for (const k of seen.keys()) if (!planned.has(k)) failures.push(`FAIL completeness unplanned injected ${k}`)
  for (const c of result.chains) if (!c.ok) failures.push(`FAIL chain=${c.chain} kind=${c.kind}: terminal=${c.terminal} ${c.note}`)
  for (const e of result.errors) failures.push(`FAIL sweep error: ${e}`)
}

const frameIdMap = (result: ReducedResult): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const r of result.rows.filter((x) => x.origin === 'injected')) out[`${r.kind}|${r.state}|${r.stateTick}|${r.attackId ?? '-'}|${r.variant}`] = r.sprite?.frame ?? '(missing)'
  return out
}

test('default motion coverage: WebGL reduced (per kind idle/one attack/fall/dead + hero & boss fuller sweep)', async ({ page }) => {
  test.setTimeout(600_000)
  const FULL = ['guanyu', 'lidian'] // one hero + one boss: full attack set + thrown
  const errors = await bootGame(page, '/?renderer=webgl&autopilot=1', { width: 960, height: 540 })
  expect(await page.evaluate(() => window.__DW_GAME__?.renderer.type)).toBe(2) // Phaser.WEBGL, no canvas fallback
  const result = await runReducedSweep(page, {
    kinds: ALL_KINDS, states: ['idle', 'attack', 'fall', 'dead', 'thrown', 'special', 'jumpattack'], full: FULL,
    chain: { holder: 'guanyu', victim: 'lidian' },
  })
  const failures: string[] = []
  checkReducedRows(result, failures)
  for (const cfg of CFGS) {
    for (const st of ['idle', 'knockdown', 'dead']) if (!result.plan.some((p) => p.kind === cfg.kind && p.state === st)) failures.push(`FAIL completeness kind=${cfg.kind}: ${st} not swept`)
    const wantAttacks = FULL.includes(cfg.kind) ? cfg.attacks : cfg.attacks.slice(0, 1)
    if (cfg.kind === 'archer') { if (!result.plan.some((p) => p.kind === 'archer' && p.variant === 'shoot')) failures.push('FAIL completeness archer shoot variant not swept') }
    else for (const a of wantAttacks) if (!result.plan.some((p) => p.kind === cfg.kind && p.attackId === a)) failures.push(`FAIL completeness kind=${cfg.kind}: attack ${a} not swept`)
  }
  for (const k of FULL) if (!result.plan.some((p) => p.kind === k && p.state === 'thrown')) failures.push(`FAIL completeness full kind=${k}: thrown not swept`)
  if (result.chains.length !== 1) failures.push(`FAIL chains count=${result.chains.length} expected 1`)
  for (const e of errors) failures.push(`FAIL pageerror: ${e}`)
  mkdirSync(OUT, { recursive: true })
  writeFileSync(`${OUT}/webgl-trace.json`, `${JSON.stringify({ renderer: 'webgl (type 2)', url: '/?renderer=webgl&autopilot=1 (no motion param)', full: FULL, rows: result.rows.length, plan: result.plan.length, chains: result.chains, failures, failureCount: failures.length, rowsDetail: result.rows, planDetail: result.plan, alphaFrames: result.alphaFrames }, null, 2)}\n`)
  writeFileSync(`${OUT}/webgl-report.json`, `${JSON.stringify({ renderer: 'webgl', rows: result.rows.length, injectedPlanRows: result.plan.length, chains: result.chains, failures, failureCount: failures.length }, null, 2)}\n`)
  expect(errors).toEqual([])
  expect(failures, failures.slice(0, 80).join('\n')).toEqual([])
})

test('default motion coverage: mobile landscape viewport smoke (frame ids identical to desktop Canvas)', async ({ page }) => {
  test.setTimeout(600_000)
  const vp = process.env.MOTION_VIEWPORT?.match(/^(\d+)x(\d+)$/)
  const mobile = vp ? { width: Number(vp[1]), height: Number(vp[2]) } : { width: 844, height: 390 }
  const errors = await bootGame(page, '/?renderer=canvas&autopilot=1', { width: 960, height: 540 })
  const opts: ReducedOpts = { kinds: ['guanyu', 'soldier'], states: ['idle', 'walk', 'attack'], full: [], chain: null }
  const desktop = await runReducedSweep(page, opts)
  await page.setViewportSize(mobile)
  const mobileRes = await runReducedSweep(page, opts)
  const failures: string[] = []
  checkReducedRows(desktop, failures)
  checkReducedRows(mobileRes, failures)
  for (const k of ['guanyu', 'soldier']) for (const st of ['idle', 'walk', 'attack']) {
    if (!mobileRes.plan.some((p) => p.kind === k && p.state === st)) failures.push(`FAIL completeness mobile kind=${k}: ${st} not swept`)
  }
  const deskFrames = frameIdMap(desktop), mobFrames = frameIdMap(mobileRes)
  const allKeys = [...new Set([...Object.keys(deskFrames), ...Object.keys(mobFrames)])].sort()
  const frameMismatches = allKeys.filter((k) => deskFrames[k] !== mobFrames[k]).map((k) => `${k}: desktop=${deskFrames[k]} mobile=${mobFrames[k]}`)
  for (const mm of frameMismatches) failures.push(`FAIL frame-id mismatch ${mm}`)
  for (const e of errors) failures.push(`FAIL pageerror: ${e}`)
  mkdirSync(OUT, { recursive: true })
  writeFileSync(`${OUT}/mobile-report.json`, `${JSON.stringify({ viewport: mobile, desktopRows: desktop.rows.length, mobileRows: mobileRes.rows.length, comparedFrameKeys: allKeys.length, frameMismatches, failures, failureCount: failures.length, deskFrames, mobFrames }, null, 2)}\n`)
  expect(errors).toEqual([])
  expect(frameMismatches).toEqual([])
  expect(failures, failures.slice(0, 80).join('\n')).toEqual([])
})

test('default motion coverage: ?motion=0 discrimination sample expects legacy frame', async ({ page }) => {
  test.setTimeout(120_000)
  const errors = await bootGame(page, '/?renderer=canvas&autopilot=1&motion=0', { width: 960, height: 540 })
  const sampleRec = await page.evaluate(() => {
    const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live
    g.paused = true
    const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
    Object.assign(p, { state: 'idle', stateTick: 0, attackId: null })
    g.syncSprites()
    const s = g.sprites.get(p.id)
    return s ? { kind: p.kind, state: p.state, frame: s.frame.name, texture: s.texture.key, visible: s.visible, alpha: s.alpha } : null
  })
  mkdirSync(OUT, { recursive: true })
  writeFileSync(`${OUT}/motion0-sample.json`, `${JSON.stringify({ url: '/?renderer=canvas&autopilot=1&motion=0', sample: sampleRec }, null, 2)}\n`)
  expect(errors).toEqual([])
  expect(sampleRec).not.toBeNull()
  expect(sampleRec!.visible).toBe(true)
  expect(sampleRec!.alpha).toBeGreaterThan(0)
  expect(sampleRec!.frame).toBeTruthy()
  expect(sampleRec!.frame).not.toContain(':motion:') // legacy path, discriminates from default-ON motion
})
