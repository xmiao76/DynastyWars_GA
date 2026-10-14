import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import type Phaser from 'phaser'
import { afterEach, describe, expect, it } from 'vitest'
import { attackById } from '../../src/core/attacks'
import { DYING_TICKS, GETUP_TICKS, KNOCKDOWN_TICKS } from '../../src/core/constants'
import { ENEMIES } from '../../src/core/enemies'
import { secondPlayerCharacter } from '../../src/game/players'
import { makeCombatant } from '../../src/core/entities'
import {
  clearMotionPlayback, ensureMotionFrame, motionEnabled, motionFrameId, motionPackManifest,
  motionStageRequest, motionTextureKeys, MOTION_PACKS, MotionRuntime,
  publishMotionArtRecord, xuchuPreparedRecord, type MotionIo, type MotionPrepared,
} from '../../src/game/adapters/motion-art'
import { ART_RESOURCE_KEY } from '../../src/game/adapters/hero-art'
import { CONTRACT_CAPS, validateManifest } from '../../src/game/adapters/motion-catalog'
import { stageMotionScope } from '../../src/game/adapters/motion-scope'
import { motionFrameForEntity, sampleClip, type MotionArt, type MotionEntity, type MotionFrameCell } from '../../src/game/art/motion-clips'
import { imageSignature } from '../../src/game/art/image-signature'
import { advanceMotion } from '../../src/game/art/motion-player'
import { bossProfile, validateClipExposures, validateMotionProfile } from '../../src/game/art/motion-profiles'
import {
  XUCHU_ATTACK_BINDINGS, XUCHU_COLLAPSE_TAIL, XUCHU_FRAMES,
  motionFrameForXuchu, xuchuClips, validXuchuPack,
} from '../../src/game/art/motion-clips-xuchu'

const meta = xuchuPreparedRecord()
const png = readFileSync('src/game/assets/motion/xuchu-motion-sheet.png')
const hash = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex')
const art: MotionArt = { ...meta, sheet: {} as CanvasImageSource, actionSheet: {} as CanvasImageSource,
  clips: xuchuClips(), frameDispatch: motionFrameForXuchu, collapseTail: XUCHU_COLLAPSE_TAIL }
const base: MotionEntity = { state: 'idle', stateTick: 0, attackId: null }
const frameAt = (e: Partial<MotionEntity>): string => motionFrameForEntity(art, { ...base, ...e })
const fresh = (): MotionPrepared => structuredClone(meta)
const keys = motionTextureKeys('xuchu')
const makeCtx = (w: number, h: number): CanvasRenderingContext2D => createCanvas(w, h).getContext('2d') as unknown as CanvasRenderingContext2D

interface FakeTexture { image: unknown; frames: Map<string, { cut: number[]; trim?: number[] }> }
function makeScene() {
  const textures = new Map<string, FakeTexture>()
  const registry = new Map<string, unknown>([[ART_RESOURCE_KEY, { heroes: {}, bodies: { retained: true }, motions: { xiahoudun: { id: 'xiahoudun', revision: 'kept' }, guanyu: { id: 'guanyu', revision: 'kept' } } }], ['bridge', { sim: { tick: 0 } }]])
  const scene = {
    registry: { get: (key: string) => registry.get(key), set: (key: string, value: unknown) => registry.set(key, value) },
    textures: {
      exists: (key: string) => textures.has(key),
      addImage: (key: string, image: unknown) => textures.set(key, { image, frames: new Map() }),
      remove: (key: string) => textures.delete(key),
      get: (key: string) => ({
        getSourceImage: () => textures.get(key)!.image,
        has: (id: string) => textures.get(key)!.frames.has(id),
        add: (id: string, _source: number, ...cut: number[]) => {
          const frame: { cut: number[]; trim?: number[] } = { cut }
          textures.get(key)!.frames.set(id, frame)
          return { setTrim: (...trim: number[]) => { frame.trim = trim } }
        },
      }),
    },
  } as unknown as Phaser.Scene
  const resources = () => registry.get(ART_RESOURCE_KEY) as { heroes: object; bodies: object; motions: Record<string, MotionArt> }
  return { scene, textures, registry, resources }
}
function makeIo(mode = 'ok') {
  const calls: string[] = []
  const io: MotionIo = {
    fetchBytes: async (url) => { calls.push(url); return mode === 'missing' ? new Uint8Array() : mode === 'sha' ? new Uint8Array([1, 2, 3]) : png },
    sha256: async (bytes) => hash(bytes),
    decode: async (bytes) => {
      if (mode === 'corrupt') throw new Error('corrupt: bad PNG')
      if (mode === 'dimensions') return { width: 1, height: 1 } as CanvasImageSource & { width: number; height: number }
      if (mode === 'pixels') return createCanvas(1979, 1186) as unknown as CanvasImageSource & { width: number; height: number }
      return await loadImage(Buffer.from(bytes)) as unknown as CanvasImageSource & { width: number; height: number }
    },
    makeCtx, pageTimeoutMs: 5000, stageTimeoutMs: 20000,
  }
  return { io, calls }
}

const originalDef = MOTION_PACKS.xuchu!
afterEach(() => { MOTION_PACKS.xuchu = originalDef })

describe('Xu Chu immutable runtime pack', () => {
  it('has exactly 6 + 6*5 records, one native page, density2, contract dimensions and provenance', () => {
    expect(validXuchuPack(meta)).toBe(true)
    expect(Object.keys(meta.frames)).toHaveLength(36)
    expect(Object.values(XUCHU_FRAMES).reduce((a, b) => a + b)).toBe(36)
    expect(meta.box).toEqual({ width: 260, height: 144, groundY: 136 })
    expect(meta.sheet).toEqual({ width: 1979, height: 1186 })
    expect(meta.actionSheet).toEqual(meta.sheet)
    expect(meta.singlePage).toBe(true)
    expect(meta.decodedCapBytes).toBeUndefined()
    expect(readFileSync('artifacts/motion/xuchu/pages/xuchu-1.png').equals(png)).toBe(true)
    const sourceHash = hash(readFileSync('artifacts/motion/xuchu/manifest.json'))
    expect(sourceHash).toBe('d0545e8575a24704d9f923173af3de5656a213b907e8f35d57632f4197e27266')
    expect((meta as MotionPrepared & { source: { manifestSha256: string } }).source.manifestSha256).toBe(sourceHash)
    const manifest = motionPackManifest('xuchu')!
    expect(validateManifest(manifest)).toEqual([])
    expect(manifest.pages).toHaveLength(1)
    expect(manifest.pages[0]).toMatchObject({ bytes: png.length, sha256: hash(png), width: 1979, height: 1186 })
    expect(manifest.pages[0]!.bytes).toBe(2177184)
    expect(manifest.decodedCap).toBeUndefined()
    expect(manifest.display).toBe('shared-atlas')
    expect(originalDef.url.sheet).toBe(originalDef.url.actions)
    expect(meta.signatures.sheet).toBe(meta.signatures.actions)
    expect(meta.signatures.sheet).toHaveLength(48 * 32 * 8)
    expect(motionEnabled('')).toBe(false)
    expect(motionEnabled('?motion=1')).toBe(true)
  })

  it('keeps getup:0 a distinct DOWN drawing with no alias declaration anywhere', () => {
    expect(meta.frames['getup:0']).not.toEqual(meta.frames['fall:4'])
    for (const cell of Object.values(meta.frames)) {
      expect((cell as MotionFrameCell & { aliasOf?: string }).aliasOf).toBeUndefined()
    }
    expect(new Set(Object.values(meta.frames).map((c) => `${c.x},${c.y},${c.w},${c.h}`)).size).toBe(36)
    expect(art.clips.getup!.keys[0]!.frame).toBe('fall:4')
    expect(sampleClip(art, 'getup', 2)).toBe('getup:0')
  })

  it.each([
    ['wrong id', (m: MotionPrepared) => { m.id = 'xiahoudun' }],
    ['density1', (m: MotionPrepared) => { m.density = 1 }],
    ['non-single page', (m: MotionPrepared) => { m.singlePage = false }],
    ['page bound', (m: MotionPrepared) => { m.sheet.width = 2049 }],
    ['infinite page', (m: MotionPrepared) => { m.sheet.height = Infinity }],
    ['second page', (m: MotionPrepared) => { m.actionSheet.height++ }],
    ['invalid box', (m: MotionPrepared) => { m.box.groundY = m.box.height }],
    ['missing frame', (m: MotionPrepared) => { delete m.frames['combo:2'] }],
    ['extra frame', (m: MotionPrepared) => { m.frames['walk:6'] = { ...m.frames['walk:0']! } }],
    ['NaN trim', (m: MotionPrepared) => { m.frames['walk:0']!.trimX = NaN }],
    ['fractional coord', (m: MotionPrepared) => { m.frames['walk:0']!.x = 0.1 }],
    ['negative trim', (m: MotionPrepared) => { m.frames['walk:0']!.trimX = -1 }],
    ['outside page', (m: MotionPrepared) => { m.frames['walk:0']!.x = 1979 }],
    ['wrong source size', (m: MotionPrepared) => { m.frames['walk:0']!.srcW = 518 }],
    ['forged DOWN alias', (m: MotionPrepared) => { m.frames['getup:0'] = { ...m.frames['fall:4']! } }],
    ['alias declaration', (m: MotionPrepared) => { (m.frames['getup:0'] as MotionFrameCell & { aliasOf: string }).aliasOf = 'fall:4' }],
    ['foreign overlap', (m: MotionPrepared) => { m.frames['walk:1'] = { ...m.frames['walk:0']! } }],
    ['hidden page overlap', (m: MotionPrepared) => { m.frames['walk:1'] = { ...m.frames['walk:0']!, sheet: 'actions' } }],
    ['unknown field', (m: MotionPrepared) => { Object.assign(m.frames['walk:0']!, { page: 'fake' }) }],
    ['cap exception', (m: MotionPrepared) => { m.decodedCapBytes = 32 * 1024 * 1024 }],
    ['wrong charge binding', (m: MotionPrepared) => { m.attackBindings = { ...XUCHU_ATTACK_BINDINGS, 'charge.crush': 'combo' } }],
    ['xiahoudun charge binding', (m: MotionPrepared) => { m.attackBindings = { 'charge.dash.long': 'charge', 'sword.combo': 'combo', 'sword.heavy': 'heavy' } }],
  ] as const)('rejects %s without numeric false-passes', (_label, mutate) => {
    const m = fresh(); mutate(m); expect(validXuchuPack(m)).toBe(false)
  })
})

describe('Xu Chu exact core windows and complete state inventory', () => {
  it('derives core boss windows, hitstun10, KD/getup clocks and no hero-only clips', () => {
    expect(validateClipExposures(art.clips)).toEqual([])
    expect(validateMotionProfile(bossProfile('xuchu'))).toEqual([])
    expect(meta.attackBindings).toEqual(XUCHU_ATTACK_BINDINGS)
    expect(ENEMIES.xuchu!.boss).toMatchObject({ charge: 'charge.crush', combo: 'sword.combo', heavy: 'sword.heavy', enrageRatio: 0.4 })
    expect([attackById('charge.crush').startup, attackById('charge.crush').active, attackById('charge.crush').recover]).toEqual([12, 22, 22])
    expect([art.clips.charge!.duration, art.clips.combo!.duration, art.clips.heavy!.duration]).toEqual([56, 25, 46])
    expect(art.clips.hurt!.duration).toBe(ENEMIES.xuchu!.hitstunTicks)
    expect(art.clips.hurt!.duration).toBe(10)
    expect([art.clips.fall!.duration, art.clips.getup!.duration]).toEqual([KNOCKDOWN_TICKS, GETUP_TICKS])
    expect(Object.keys(art.clips).sort()).toEqual(['charge', 'combo', 'fall', 'getup', 'grab', 'heavy', 'hurt', 'idle', 'release', 'walk'])
  })
  it.each(['charge.crush', 'sword.combo', 'sword.heavy'])('matches every startup/active/recover tick for %s', (id) => {
    const a = attackById(id), action = XUCHU_ATTACK_BINDINGS[id]!
    const strike = action === 'charge' ? ['charge:2', 'charge:3'] : action === 'combo' ? ['combo:1', 'combo:3'] : ['heavy:2']
    for (let t = 0; t < a.startup + a.active + a.recover; t++) {
      const f = frameAt({ state: 'attack', attackId: id, stateTick: t })
      expect(strike.includes(f), `${id}@${t}: ${f}`).toBe(t >= a.startup && t < a.startup + a.active)
    }
    expect([9, 10, 11, 12].map((t) => frameAt({ state: 'attack', attackId: 'sword.combo', stateTick: t }))).toEqual(['combo:1', 'combo:1', 'combo:3', 'combo:3'])
    expect(frameAt({ state: 'attack', attackId: 'sword.combo', stateTick: 13 })).toBe('combo:2')
    expect(frameAt({ state: 'attack', attackId: 'charge.crush', stateTick: 11 })).toBe('charge:1')
    expect(frameAt({ state: 'attack', attackId: 'charge.crush', stateTick: 34 })).toBe('charge:4')
  })
  it('dispatches every applicable state/tick to valid keys and reaches every authored record', () => {
    const seen = new Set<string>()
    for (const state of ['idle', 'walk', 'fleeing', 'hitstun', 'knockdown', 'getup', 'grab', 'grabbed', 'thrown', 'dying', 'dead'] as const) {
      for (let t = -5; t <= DYING_TICKS + 20; t++) seen.add(frameAt({ state, stateTick: t }))
    }
    for (const attackId of [...Object.keys(XUCHU_ATTACK_BINDINGS), null, 'arrow.hit', 'charge.dash.long', 'gy.special', 'invalid']) {
      for (let t = 0; t < 80; t++) seen.add(frameAt({ state: 'attack', attackId, stateTick: t }))
    }
    for (const action of Object.keys(art.clips)) for (let t = -5; t < 80; t++) seen.add(sampleClip(art, action, t))
    for (const frame of seen) expect(meta.frames[frame], frame).toBeDefined()
    expect([...seen].sort()).toEqual(Object.keys(meta.frames).sort())
    expect(frameAt({ state: 'grabbed', stateTick: 999 })).toBe('misc:2')
    expect(frameAt({ state: 'dead', stateTick: 999 })).toBe('fall:4')
    expect(frameAt({ state: 'dying', stateTick: 999 })).toBe('fall:4')
    for (const attackId of [null, 'arrow.hit', 'charge.dash.long', 'charge.dash', 'invalid']) expect(frameAt({ state: 'attack', attackId, stateTick: 12 })).toBe('walk:0')
    for (const state of ['jump', 'jumpattack', 'special'] as const) expect(frameAt({ state, stateTick: 12 })).toBe('walk:0')
    expect([0, 6, 13, 19, 26, 32].map((t) => frameAt({ state: 'walk', stateTick: t }))).toEqual(['walk:1', 'walk:2', 'walk:3', 'walk:4', 'walk:5', 'walk:1'])
  })
  it('preserves hitstop/pause and skipped rendering, without changing core-clock samples', () => {
    const e = { ...base, state: 'attack' as const, attackId: 'charge.crush', stateTick: 12 }
    const start = advanceMotion(art, e, 100)
    const frozen = advanceMotion(art, e, 150, start.playback)
    expect(frozen.frame).toBe(start.frame)
    expect(frozen.playback.tick).toBe(start.playback.tick)
    const skipped = advanceMotion(art, { ...e, stateTick: 34 }, 177, frozen.playback)
    expect(skipped.frame).toBe('charge:4')
  })
  it('low getup interruption and thrown impact never insert standing recoil or nonexistent hero frames', () => {
    for (const stateTick of [2, 5, 10, 14]) {
      const rising = advanceMotion(art, { ...base, state: 'getup', stateTick }, 50)
      let previous = rising.playback
      for (let t = 0; t < 12; t++) {
        const sample = advanceMotion(art, { ...base, state: 'dying', stateTick: t }, 51 + t, previous)
        expect(sample.frame).not.toBe('fall:0')
        expect(sample.frame).not.toBe('walk:0')
        expect(meta.frames[sample.frame]).toBeDefined()
        previous = sample.playback
      }
      expect(previous.frame).toBe('fall:4')
    }
    const flight = advanceMotion(art, { ...base, state: 'thrown', stateTick: 0, airTicks: 8, z: 10 }, 8)
    const impact = advanceMotion(art, { ...base, state: 'knockdown', stateTick: 0 }, 9, flight.playback)
    expect(impact.frame).toBe('fall:3')
    expect(advanceMotion(art, { ...base, state: 'knockdown', stateTick: 30 }, 39, impact.playback).frame).toBe('fall:4')
  })
})

describe('Xu Chu real PNG atomic publication, routing and resource limits', () => {
  it('publishes one texture, exact signature and production route; warm cache does not clone/reload', async () => {
    const fake = makeScene(), { io, calls } = makeIo(), rt = new MotionRuntime(io)
    expect(await rt.loadKind(fake.scene, 'xuchu')).toEqual({ ok: true })
    const published = fake.resources().motions.xuchu!
    expect(published.sheet).toBe(published.actionSheet)
    expect(published.frameDispatch).toBe(motionFrameForXuchu)
    expect(published.collapseTail).toEqual(['fall:3', 'fall:4'])
    const g = makeCtx(1979, 1186); g.drawImage(published.sheet, 0, 0)
    expect(imageSignature(g.getImageData(0, 0, 1979, 1186))).toBe(meta.signatures.sheet)
    expect(fake.textures.size).toBe(1)
    expect(fake.textures.get(keys.sheet)!.frames.size).toBe(36)
    for (const [name, c] of Object.entries(meta.frames)) {
      expect(fake.textures.get(keys.sheet)!.frames.get(motionFrameId('xuchu', name))).toEqual({ cut: [c.x, c.y, c.w, c.h], trim: [c.srcW, c.srcH, c.trimX, c.trimY, c.w, c.h] })
    }
    expect(await rt.loadKind(fake.scene, 'xuchu')).toEqual({ ok: true })
    expect(calls).toHaveLength(1)
    expect(rt.budget()).toMatchObject({ networkBytes: 2177184, sourceBytes: 2177184, gpuBytes: 9388376, clonedCanvasBytes: 0, perFighterDecoded: { xuchu: 9388376 } })
    expect(9388376).toBeLessThan(CONTRACT_CAPS.decodedPerFighter)
    expect(fake.resources().bodies).toEqual({ retained: true })
    expect(fake.resources().motions.xiahoudun!.revision).toBe('kept')
    expect(fake.resources().motions.guanyu!.revision).toBe('kept')
    // Enemy AI leaves stateTick/airTicks frozen while physics advances x;
    // the adapter's observed-displacement path covers Xu Chu like Xiahou.
    const entity = makeCombatant(40, 'xuchu', 'enemy', 100, 200, 260, 1.0, 'right')
    Object.assign(entity, { state: 'thrown', stateTick: 0, airTicks: 0, thrownFromX: 100, vx: 3.5, z: 10 })
    expect(ensureMotionFrame(fake.scene, entity)?.frame).toBe(motionFrameId('xuchu', 'fall:2'))
    entity.x += 3.5 * 6
    expect(ensureMotionFrame(fake.scene, entity)?.frame).toBe(motionFrameId('xuchu', 'fall:3'))
    fake.registry.set('bridge', { sim: { tick: 900 } })
    expect(ensureMotionFrame(fake.scene, entity)?.frame, 'world-only hitstop must not add flight age').toBe(motionFrameId('xuchu', 'fall:3'))
    entity.state = 'knockdown'; entity.stateTick = 0; entity.z = 0
    expect(ensureMotionFrame(fake.scene, entity)?.frame).toBe(motionFrameId('xuchu', 'fall:3'))
    entity.stateTick = 4
    expect(ensureMotionFrame(fake.scene, entity)?.frame).toBe(motionFrameId('xuchu', 'fall:4'))
    // Grabbed victim release bridges into misc:4, like Xiahou Dun.
    clearMotionPlayback(fake.scene)
    const victim = makeCombatant(77, 'xuchu', 'enemy', 230, 232, 260, 1.0, 'right')
    Object.assign(victim, { state: 'grabbed', stateTick: 5, grabbedBy: 1 })
    fake.registry.set('bridge', { sim: { tick: 100 } })
    expect(ensureMotionFrame(fake.scene, victim)?.frame).toBe(motionFrameId('xuchu', 'misc:2'))
    Object.assign(victim, { state: 'walk', stateTick: 0, grabbedBy: null })
    fake.registry.set('bridge', { sim: { tick: 101 } })
    expect(ensureMotionFrame(fake.scene, victim)?.frame).toBe(motionFrameId('xuchu', 'misc:4'))
    clearMotionPlayback(fake.scene)
    rt.releaseScene(fake.scene); await rt.settle()
  }, 30000)

  it.each([['missing', 'missing'], ['sha', 'wrong-signature'], ['corrupt', 'corrupt'], ['dimensions', 'corrupt'], ['pixels', 'wrong-signature']])('rejects %s with whole-fighter fallback and no partial textures', async (mode, failure) => {
    const fake = makeScene(), { io } = makeIo(mode), rt = new MotionRuntime(io)
    expect(await rt.loadKind(fake.scene, 'xuchu')).toEqual({ ok: false, failure })
    expect(fake.resources().motions.xuchu).toBeUndefined()
    expect(fake.resources().motions.xiahoudun!.revision).toBe('kept')
    expect(fake.resources().motions.guanyu!.revision).toBe('kept')
    expect(fake.textures.has(keys.sheet)).toBe(false)
    expect(fake.textures.has(keys.actions)).toBe(false)
    await rt.settle()
  }, 30000)

  it('rejects forged geometry atomically even with correct PNG/hash and leaves valid siblings untouched', async () => {
    const fake = makeScene(), { io } = makeIo(), rt = new MotionRuntime(io)
    const forged = fresh(); forged.frames['getup:0'] = { ...forged.frames['fall:4']! }
    MOTION_PACKS.xuchu = { ...originalDef, meta: () => forged }
    expect(await rt.loadKind(fake.scene, 'xuchu')).toEqual({ ok: false, failure: 'wrong-signature' })
    expect(fake.textures.size).toBe(0)
    expect(fake.resources().motions.xuchu).toBeUndefined()
    expect(fake.resources().motions.xiahoudun!.revision).toBe('kept')
    expect(publishMotionArtRecord(fake.scene, forged, makeCtx)).toBeUndefined()
    await rt.settle()
  }, 30000)

  it('applies loader page and decoded caps before any fetch, without a pack exception', async () => {
    for (const caps of [{ ...CONTRACT_CAPS, decodedPerFighter: 9388375 }, { ...CONTRACT_CAPS, pageLimit: 1978 }]) {
      const fake = makeScene(), { io, calls } = makeIo(), rt = new MotionRuntime(io, caps)
      expect(await rt.loadKind(fake.scene, 'xuchu')).toEqual({ ok: false, failure: 'unsupported' })
      expect(calls).toHaveLength(0)
      expect(fake.resources().motions.xuchu).toBeUndefined()
      await rt.settle()
    }
  })
  it('real GU/default ZF stage3 prioritizes the boss after both heroes within the unchanged cap', () => {
    const packs = Object.fromEntries(Object.entries(MOTION_PACKS).map(([id, d]) => [id, { sourceBytes: d.pages.reduce((n, p) => n + p.bytes, 0) }]))
    const partner = secondPlayerCharacter('guanyu')
    expect(partner).toBe('zhangfei')
    const req = motionStageRequest('stage3', 'guanyu', partner)
    const scope = stageMotionScope({ ...req, packs, budgetBytes: CONTRACT_CAPS.stageDownloads })
    expect(scope.immediate).toEqual(['guanyu', 'zhangfei', 'xuchu', 'soldier'])
    expect(req.stageKinds).toEqual(['xuchu', 'soldier', 'archer', 'spearman', 'crate', 'arrow', 'meat', 'sword'])
    expect(scope.plannedBytes).toBe(12328900)
    expect(CONTRACT_CAPS.stageDownloads).toBe(12582912)
    expect(scope.plannedBytes).toBeLessThan(CONTRACT_CAPS.stageDownloads)
    expect(scope.deferred).toEqual(expect.arrayContaining(['archer', 'spearman']))
    // Negative control: the pure policy on the old encounter-order roster
    // still defers the boss; no cap is raised to fit it.
    const old = stageMotionScope({ ...req, stageKinds: [...req.stageKinds.slice(1), 'xuchu'], packs, budgetBytes: CONTRACT_CAPS.stageDownloads })
    expect(old.immediate).toEqual(['guanyu', 'zhangfei', 'soldier', 'archer'])
    expect(old.deferred).toContain('xuchu')
  })
  it('stage3 includes its boss dynamically and stage1 does not publish Xu Chu', () => {
    const req = motionStageRequest('stage3', 'guanyu')
    expect(req.stageKinds).toContain('xuchu')
    const packs = Object.fromEntries(Object.entries(MOTION_PACKS).map(([id, d]) => [id, { sourceBytes: d.pages.reduce((n, p) => n + p.bytes, 0) }]))
    const scope3 = stageMotionScope({ ...req, secondPlayer: null, packs, budgetBytes: CONTRACT_CAPS.stageDownloads })
    expect(scope3.immediate).toContain('xuchu')
    const scope1 = stageMotionScope({ ...motionStageRequest('stage1', 'guanyu'), secondPlayer: null, packs, budgetBytes: CONTRACT_CAPS.stageDownloads })
    expect(scope1.immediate).not.toContain('xuchu')
  })
})
