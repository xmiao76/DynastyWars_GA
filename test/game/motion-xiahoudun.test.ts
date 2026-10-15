import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import type Phaser from 'phaser'
import { afterEach, describe, expect, it } from 'vitest'
import { attackById } from '../../src/core/attacks'
import { DYING_TICKS, GETUP_TICKS, KNOCKDOWN_TICKS } from '../../src/core/constants'
import { ENEMIES } from '../../src/core/enemies'
import { STAGES, STAGE_ORDER } from '../../src/core/stage'
import { secondPlayerCharacter } from '../../src/game/players'
import { makeCombatant } from '../../src/core/entities'
import {
  clearMotionPlayback, ensureMotionFrame, forgetMotionEntity, motionFrameId, motionPackManifest,
  motionPreparedRecord, motionStageRequest, motionTextureKeys, MOTION_PACKS, MotionRuntime,
  publishMotionArtRecord, xiahoudunPreparedRecord, type MotionIo, type MotionPrepared,
} from '../../src/game/adapters/motion-art'
import { ART_RESOURCE_KEY } from '../../src/game/adapters/hero-art'
import { CONTRACT_CAPS, validateManifest } from '../../src/game/adapters/motion-catalog'
import { stageMotionScope } from '../../src/game/adapters/motion-scope'
import { motionFrameForEntity, sampleClip, guanyuClips, type MotionArt, type MotionEntity, type MotionFrameCell } from '../../src/game/art/motion-clips'
import { imageSignature } from '../../src/game/art/image-signature'
import { advanceMotion } from '../../src/game/art/motion-player'
import { bossProfile, validateClipExposures, validateMotionProfile } from '../../src/game/art/motion-profiles'
import { lidianClips } from '../../src/game/art/motion-clips-lidian'
import {
  XIAHOUDUN_ATTACK_BINDINGS, XIAHOUDUN_COLLAPSE_TAIL, XIAHOUDUN_FRAMES,
  motionFrameForXiahoudun, xiahoudunClips, validXiahoudunPack,
} from '../../src/game/art/motion-clips-xiahoudun'

const meta = xiahoudunPreparedRecord()
const png = readFileSync('src/game/assets/motion/xiahoudun-motion-sheet.png')
const hash = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex')
const art: MotionArt = { ...meta, sheet: {} as CanvasImageSource, actionSheet: {} as CanvasImageSource,
  clips: xiahoudunClips(), frameDispatch: motionFrameForXiahoudun, collapseTail: XIAHOUDUN_COLLAPSE_TAIL }
const base: MotionEntity = { state: 'idle', stateTick: 0, attackId: null }
const frameAt = (e: Partial<MotionEntity>): string => motionFrameForEntity(art, { ...base, ...e })
const fresh = (): MotionPrepared => structuredClone(meta)
const keys = motionTextureKeys('xiahoudun')
const makeCtx = (w: number, h: number): CanvasRenderingContext2D => createCanvas(w, h).getContext('2d') as unknown as CanvasRenderingContext2D

interface FakeTexture { image: unknown; frames: Map<string, { cut: number[]; trim?: number[] }> }
function makeScene() {
  const textures = new Map<string, FakeTexture>()
  const registry = new Map<string, unknown>([[ART_RESOURCE_KEY, { heroes: {}, bodies: { retained: true }, motions: { lidian: { id: 'lidian', revision: 'kept' }, guanyu: { id: 'guanyu', revision: 'kept' } } }], ['bridge', { sim: { tick: 0 } }]])
  const scene = {
    registry: { get: (key: string) => registry.get(key), set: (key: string, value: unknown) => registry.set(key, value) },
    textures: {
      exists: (key: string) => textures.has(key),
      addImage: (key: string, image: unknown) => textures.set(key, { image, frames: new Map() }),
      remove: (key: string) => textures.delete(key),
      get: (key: string) => ({
        getSourceImage: () => textures.get(key)!.image,
        has: (id: string) => textures.get(key)!.frames.has(id),
        get: (id: string) => {
          const cut = textures.get(key)!.frames.get(id)!.cut
          return { cutX: cut[0], cutY: cut[1], cutWidth: cut[2], cutHeight: cut[3] }
        },
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
      if (mode === 'pixels') return createCanvas(2044, 1589) as unknown as CanvasImageSource & { width: number; height: number }
      return await loadImage(Buffer.from(bytes)) as unknown as CanvasImageSource & { width: number; height: number }
    },
    makeCtx, pageTimeoutMs: 5000, stageTimeoutMs: 20000,
  }
  return { io, calls }
}

// Changes to the catalog in negative controls are restored within the same test.
const originalDef = MOTION_PACKS.xiahoudun!
afterEach(() => { MOTION_PACKS.xiahoudun = originalDef })

describe('Xiahou Dun immutable runtime pack', () => {
  it('has exactly 9 + 6*5 records, one native page, density2, contract dimensions and provenance', () => {
    expect(validXiahoudunPack(meta)).toBe(true)
    expect(Object.keys(meta.frames)).toHaveLength(39)
    expect(Object.values(XIAHOUDUN_FRAMES).reduce((a, b) => a + b)).toBe(39)
    expect(meta.box).toEqual({ width: 260, height: 218, groundY: 210 })
    expect(meta.sheet).toEqual({ width: 2044, height: 1589 })
    expect(meta.actionSheet).toEqual(meta.sheet)
    expect(meta.singlePage).toBe(true)
    expect(meta.decodedCapBytes).toBeUndefined()
    expect(readFileSync('artifacts/motion/xiahoudun/pages/xiahoudun-1.png').equals(png)).toBe(true)
    const sourceHash = hash(readFileSync('artifacts/motion/xiahoudun/manifest.json'))
    expect(sourceHash).toBe('fe106479291229eb871ea68d01e3fb7f69c6a4e99fa52eadb0f49968bc4814f1')
    expect((meta as MotionPrepared & { source: { manifestSha256: string } }).source.manifestSha256).toBe(sourceHash)
    const manifest = motionPackManifest('xiahoudun')!
    expect(validateManifest(manifest)).toEqual([])
    expect(manifest.pages).toHaveLength(1)
    expect(manifest.pages[0]).toMatchObject({ bytes: png.length, sha256: hash(png), width: 2044, height: 1589 })
    expect(manifest.pages[0]!.bytes).toBe(2220630)
    expect(manifest.decodedCap).toBeUndefined()
    expect(manifest.display).toBe('shared-atlas')
    expect(originalDef.url.sheet).toBe(originalDef.url.actions)
    expect(meta.signatures.sheet).toBe(meta.signatures.actions)
    expect(meta.signatures.sheet).toHaveLength(48 * 32 * 8)
  })

  it('uses one identical DOWN rectangle and full-cell registration, with only one alias declaration', () => {
    const { aliasOf, ...downAlias } = meta.frames['getup:0']! as MotionFrameCell & { aliasOf: string }
    expect(aliasOf).toBe('fall:4')
    expect(downAlias).toEqual(meta.frames['fall:4'])
    expect(new Set(Object.values(meta.frames).map((c) => `${c.x},${c.y},${c.w},${c.h}`)).size).toBe(38)
    expect(art.clips.getup!.keys[0]!.frame).toBe('fall:4')
    expect(sampleClip(art, 'getup', 2)).toBe('getup:0')
  })

  it.each([
    ['wrong id', (m: MotionPrepared) => { m.id = 'lidian' }],
    ['density0', (m: MotionPrepared) => { m.density = 0 }],
    ['density1', (m: MotionPrepared) => { m.density = 1 }],
    ['non-single page', (m: MotionPrepared) => { m.singlePage = false }],
    ['zero page', (m: MotionPrepared) => { m.sheet.width = 0 }],
    ['page bound', (m: MotionPrepared) => { m.sheet.width = 2049 }],
    ['infinite page', (m: MotionPrepared) => { m.sheet.height = Infinity }],
    ['second page', (m: MotionPrepared) => { m.actionSheet.height++ }],
    ['invalid box', (m: MotionPrepared) => { m.box.groundY = m.box.height }],
    ['missing frame', (m: MotionPrepared) => { delete m.frames['combo:2'] }],
    ['extra frame', (m: MotionPrepared) => { m.frames['gy.jab:0'] = { ...m.frames['walk:0']! } }],
    ['NaN trim', (m: MotionPrepared) => { m.frames['walk:0']!.trimX = NaN }],
    ['infinite trim', (m: MotionPrepared) => { m.frames['walk:0']!.trimY = Infinity }],
    ['fractional coord', (m: MotionPrepared) => { m.frames['walk:0']!.x = 0.1 }],
    ['negative trim', (m: MotionPrepared) => { m.frames['walk:0']!.trimX = -1 }],
    ['outside page', (m: MotionPrepared) => { m.frames['walk:0']!.x = 2044 }],
    ['outside full cell', (m: MotionPrepared) => { m.frames['walk:0']!.trimY = 436 }],
    ['wrong source size', (m: MotionPrepared) => { m.frames['walk:0']!.srcW = 518 }],
    ['forged alias trim', (m: MotionPrepared) => { m.frames['getup:0']!.trimX!++ }],
    ['moved alias', (m: MotionPrepared) => { m.frames['getup:0']!.x = 1600 }],
    ['wrong alias target', (m: MotionPrepared) => { (m.frames['getup:0'] as MotionFrameCell & { aliasOf: string }).aliasOf = 'walk:0' }],
    ['foreign overlap', (m: MotionPrepared) => { m.frames['walk:1'] = { ...m.frames['walk:0']! } }],
    ['hidden page overlap', (m: MotionPrepared) => { m.frames['walk:1'] = { ...m.frames['walk:0']!, sheet: 'actions' } }],
    ['unknown field', (m: MotionPrepared) => { Object.assign(m.frames['walk:0']!, { page: 'fake' }) }],
    ['cap exception', (m: MotionPrepared) => { m.decodedCapBytes = 32 * 1024 * 1024 }],
    ['wrong charge binding', (m: MotionPrepared) => { m.attackBindings = { ...XIAHOUDUN_ATTACK_BINDINGS, 'charge.dash.long': 'combo' } }],
  ] as const)('rejects %s without numeric false-passes', (_label, mutate) => {
    const m = fresh(); mutate(m); expect(validXiahoudunPack(m)).toBe(false)
  })
})

describe('Xiahou Dun exact core windows and complete state inventory', () => {
  it('derives core boss windows, hitstun12, KD36/getup24 and no hero-only clips', () => {
    expect(validateClipExposures(art.clips)).toEqual([])
    expect(validateMotionProfile(bossProfile('xiahoudun'))).toEqual([])
    expect(meta.attackBindings).toEqual(XIAHOUDUN_ATTACK_BINDINGS)
    expect(ENEMIES.xiahoudun!.boss).toMatchObject({ charge: 'charge.dash.long', combo: 'sword.combo', heavy: 'sword.heavy', enrageRatio: 0.35 })
    expect([attackById('charge.dash.long').startup, attackById('charge.dash.long').active, attackById('charge.dash.long').recover]).toEqual([8, 26, 18])
    expect([art.clips.charge!.duration, art.clips.combo!.duration, art.clips.heavy!.duration]).toEqual([52, 25, 46])
    expect(art.clips.hurt!.duration).toBe(ENEMIES.xiahoudun!.hitstunTicks)
    expect(art.clips.hurt!.duration).toBe(12)
    expect([art.clips.fall!.duration, art.clips.getup!.duration]).toEqual([KNOCKDOWN_TICKS, GETUP_TICKS])
    expect(Object.keys(art.clips).sort()).toEqual(['charge', 'combo', 'fall', 'getup', 'grab', 'heavy', 'hurt', 'idle', 'release', 'walk'])
  })
  it.each(['charge.dash.long', 'sword.combo', 'sword.heavy'])('matches every startup/active/recover tick for %s', (id) => {
    const a = attackById(id), action = XIAHOUDUN_ATTACK_BINDINGS[id]!
    const strike = action === 'charge' ? ['charge:2', 'charge:3'] : action === 'combo' ? ['combo:1', 'combo:3'] : ['heavy:2']
    for (let t = 0; t < a.startup + a.active + a.recover; t++) {
      const f = frameAt({ state: 'attack', attackId: id, stateTick: t })
      expect(strike.includes(f), `${id}@${t}: ${f}`).toBe(t >= a.startup && t < a.startup + a.active)
    }
    expect([9, 10, 11, 12].map((t) => frameAt({ state: 'attack', attackId: 'sword.combo', stateTick: t }))).toEqual(['combo:1', 'combo:1', 'combo:3', 'combo:3'])
    expect(frameAt({ state: 'attack', attackId: 'sword.combo', stateTick: 13 })).toBe('combo:2')
    expect(frameAt({ state: 'attack', attackId: 'sword.combo', stateTick: 17 })).toBe('combo:4')
  })
  it('dispatches every applicable state/tick to valid keys and reaches every authored record', () => {
    const seen = new Set<string>()
    for (const state of ['idle', 'walk', 'fleeing', 'hitstun', 'knockdown', 'getup', 'grab', 'grabbed', 'thrown', 'dying', 'dead'] as const) {
      for (let t = -5; t <= DYING_TICKS + 20; t++) seen.add(frameAt({ state, stateTick: t }))
    }
    for (const attackId of [...Object.keys(XIAHOUDUN_ATTACK_BINDINGS), null, 'arrow.hit', 'throw.land', 'gy.special', 'invalid']) {
      for (let t = 0; t < 80; t++) seen.add(frameAt({ state: 'attack', attackId, stateTick: t }))
    }
    for (const action of Object.keys(art.clips)) for (let t = -5; t < 80; t++) seen.add(sampleClip(art, action, t))
    for (const frame of seen) expect(meta.frames[frame], frame).toBeDefined()
    expect([...seen].sort()).toEqual(Object.keys(meta.frames).sort())
    expect(frameAt({ state: 'grabbed', stateTick: 999 })).toBe('misc:2')
    expect(frameAt({ state: 'dead', stateTick: 999 })).toBe('fall:4')
    expect(frameAt({ state: 'dying', stateTick: 999 })).toBe('fall:4')
    for (const attackId of [null, 'arrow.hit', 'throw.body', 'gy.jab1', 'invalid']) expect(frameAt({ state: 'attack', attackId, stateTick: 12 })).toBe('walk:0')
    for (const state of ['jump', 'jumpattack', 'special'] as const) expect(frameAt({ state, stateTick: 12 })).toBe('walk:0')
    expect([0, 4, 8, 12, 16, 20, 24, 28, 32].map((t) => frameAt({ state: 'walk', stateTick: t }))).toEqual(['walk:1', 'walk:2', 'walk:3', 'walk:4', 'walk:5', 'walk:6', 'walk:7', 'walk:8', 'walk:1'])
  })
  it('preserves hitstop/pause and skipped rendering, without changing core-clock samples', () => {
    const e = { ...base, state: 'attack' as const, attackId: 'charge.dash.long', stateTick: 8 }
    const start = advanceMotion(art, e, 100)
    const frozen = advanceMotion(art, e, 150, start.playback)
    expect(frozen.frame).toBe(start.frame)
    expect(frozen.playback.tick).toBe(start.playback.tick)
    const skipped = advanceMotion(art, { ...e, stateTick: 35 }, 177, frozen.playback)
    expect(skipped.frame).toBe('charge:4')
    const walking = advanceMotion(art, { ...base, state: 'walk', stateTick: 12 }, 200)
    expect(advanceMotion(art, { ...base, state: 'walk', stateTick: 12 }, 300, walking.playback).frame).toBe('walk:4')
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
    const down = advanceMotion(art, { ...base, state: 'knockdown', stateTick: 30 }, 40)
    expect(advanceMotion(art, { ...base, state: 'dying', stateTick: 0 }, 41, down.playback).frame).toBe('fall:4')
  })
  it('production victim release uses misc4, freezes on world-only ticks, then clears and forgets actor history', () => {
    const fake = makeScene()
    fake.registry.set(ART_RESOURCE_KEY, { heroes: {}, motions: { xiahoudun: art } })
    fake.scene.textures.addImage(keys.sheet, {} as HTMLImageElement)
    for (const [name, c] of Object.entries(meta.frames)) fake.scene.textures.get(keys.sheet).add(motionFrameId('xiahoudun', name), 0, c.x, c.y, c.w, c.h)
    const e = makeCombatant(77, 'xiahoudun', 'enemy', 230, 232, 210, 1.2, 'right')
    const read = (tick: number) => { fake.registry.set('bridge', { sim: { tick } }); return ensureMotionFrame(fake.scene, e)?.frame }
    Object.assign(e, { state: 'grabbed', stateTick: 5, grabbedBy: 1 })
    expect(read(100)).toBe(motionFrameId('xiahoudun', 'misc:2'))
    Object.assign(e, { state: 'walk', stateTick: 0, grabbedBy: null })
    expect(read(101)).toBe(motionFrameId('xiahoudun', 'misc:4'))
    expect(read(501)).toBe(motionFrameId('xiahoudun', 'misc:4'))
    e.stateTick = 4
    expect(read(505)).toBe(motionFrameId('xiahoudun', 'walk:0'))
    e.stateTick = 6
    expect(read(507)).toBe(motionFrameId('xiahoudun', 'walk:2'))
    forgetMotionEntity(fake.scene, e.id)
    e.state = 'idle'; e.stateTick = 0
    expect(read(508)).toBe(motionFrameId('xiahoudun', 'walk:0'))
    Object.assign(e, { state: 'grabbed', grabbedBy: 1 })
    read(509)
    Object.assign(e, { state: 'idle', grabbedBy: null })
    expect(read(510)).toBe(motionFrameId('xiahoudun', 'misc:4'))
    for (const state of ['thrown', 'dying', 'attack'] as const) {
      forgetMotionEntity(fake.scene, e.id)
      Object.assign(e, { state: 'grabbed', stateTick: 0, grabbedBy: 1 }); read(600)
      Object.assign(e, { state, stateTick: 8, grabbedBy: null, attackId: 'charge.dash.long', vx: 3.5, thrownFromX: e.x, z: state === 'thrown' ? 10 : 0 })
      expect(read(601)).not.toBe(motionFrameId('xiahoudun', 'misc:4'))
    }
    clearMotionPlayback(fake.scene)
  })
  it('does not alter Guan Yu or Li Dian core exposure tables', () => {
    expect(guanyuClips().getup!.keys[0]!.frame).toBe('fall:6')
    expect(lidianClips().charge!.duration).toBe(48)
    expect(lidianClips().hurt!.duration).toBe(10)
    expect(motionPreparedRecord().id).toBe('guanyu')
  })
})

describe('Xiahou Dun real PNG atomic publication, routing and resource limits', () => {
  it('publishes one texture, shared alias frames, exact signature and production route; warm cache does not clone/reload', async () => {
    const fake = makeScene(), { io, calls } = makeIo(), rt = new MotionRuntime(io)
    expect(await rt.loadKind(fake.scene, 'xiahoudun')).toEqual({ ok: true })
    const published = fake.resources().motions.xiahoudun!
    expect(published.sheet).toBe(published.actionSheet)
    expect(published.frameDispatch).toBe(motionFrameForXiahoudun)
    expect(published.collapseTail).toEqual(['fall:3', 'fall:4'])
    const g = makeCtx(2044, 1589); g.drawImage(published.sheet, 0, 0)
    expect(imageSignature(g.getImageData(0, 0, 2044, 1589))).toBe(meta.signatures.sheet)
    expect(fake.textures.size).toBe(1)
    expect(fake.textures.get(keys.sheet)!.frames.size).toBe(39)
    for (const [name, c] of Object.entries(meta.frames)) {
      expect(fake.textures.get(keys.sheet)!.frames.get(motionFrameId('xiahoudun', name))).toEqual({ cut: [c.x, c.y, c.w, c.h], trim: [c.srcW, c.srcH, c.trimX, c.trimY, c.w, c.h] })
    }
    expect(await rt.loadKind(fake.scene, 'xiahoudun')).toEqual({ ok: true })
    expect(calls).toHaveLength(1)
    expect(rt.budget()).toMatchObject({ networkBytes: 2220630, sourceBytes: 2220630, gpuBytes: 12991664, clonedCanvasBytes: 0, perFighterDecoded: { xiahoudun: 12991664 } })
    expect(12991664).toBeLessThan(CONTRACT_CAPS.decodedPerFighter)
    expect(fake.resources().bodies).toEqual({ retained: true })
    expect(fake.resources().motions.lidian!.revision).toBe('kept')
    expect(fake.resources().motions.guanyu!.revision).toBe('kept')
    // Enemy AI leaves stateTick/airTicks frozen while physics advances x.
    const entity = makeCombatant(40, 'xiahoudun', 'enemy', 100, 200, 210, 1.2, 'right')
    Object.assign(entity, { state: 'thrown', stateTick: 0, airTicks: 0, thrownFromX: 100, vx: 3.5, z: 10 })
    expect(ensureMotionFrame(fake.scene, entity)?.frame).toBe(motionFrameId('xiahoudun', 'fall:2'))
    entity.x += 3.5 * 6 // skipped renders, six real physics steps
    expect(ensureMotionFrame(fake.scene, entity)?.frame).toBe(motionFrameId('xiahoudun', 'fall:3'))
    fake.registry.set('bridge', { sim: { tick: 900 } })
    expect(ensureMotionFrame(fake.scene, entity)?.frame, 'world-only hitstop must not add flight age').toBe(motionFrameId('xiahoudun', 'fall:3'))
    entity.state = 'knockdown'; entity.stateTick = 0; entity.z = 0
    expect(ensureMotionFrame(fake.scene, entity)?.frame).toBe(motionFrameId('xiahoudun', 'fall:3'))
    entity.stateTick = 4
    expect(ensureMotionFrame(fake.scene, entity)?.frame).toBe(motionFrameId('xiahoudun', 'fall:4'))
    clearMotionPlayback(fake.scene)
    entity.state = 'thrown'; entity.stateTick = 0; entity.x = 100
    expect(ensureMotionFrame(fake.scene, entity)?.frame).toBe(motionFrameId('xiahoudun', 'fall:2'))
    rt.releaseScene(fake.scene); await rt.settle()
  }, 30000)

  it.each([['missing', 'missing'], ['sha', 'wrong-signature'], ['corrupt', 'corrupt'], ['dimensions', 'corrupt'], ['pixels', 'wrong-signature']])('rejects %s with whole-fighter fallback and no partial textures', async (mode, failure) => {
    const fake = makeScene(), { io } = makeIo(mode), rt = new MotionRuntime(io)
    expect(await rt.loadKind(fake.scene, 'xiahoudun')).toEqual({ ok: false, failure })
    expect(fake.resources().motions.xiahoudun).toBeUndefined()
    expect(fake.resources().motions.lidian!.revision).toBe('kept')
    expect(fake.resources().motions.guanyu!.revision).toBe('kept')
    expect(fake.textures.has(keys.sheet)).toBe(false)
    expect(fake.textures.has(keys.actions)).toBe(false)
    await rt.settle()
  }, 30000)

  it('rejects forged geometry atomically even with correct PNG/hash and leaves valid siblings untouched', async () => {
    const fake = makeScene(), { io } = makeIo(), rt = new MotionRuntime(io)
    const forged = fresh(); forged.frames['getup:0']!.trimY!++
    MOTION_PACKS.xiahoudun = { ...originalDef, meta: () => forged }
    expect(await rt.loadKind(fake.scene, 'xiahoudun')).toEqual({ ok: false, failure: 'wrong-signature' })
    expect(fake.textures.size).toBe(0)
    expect(fake.resources().motions.xiahoudun).toBeUndefined()
    expect(fake.resources().motions.lidian!.revision).toBe('kept')
    expect(publishMotionArtRecord(fake.scene, forged, makeCtx)).toBeUndefined()
    await rt.settle()
  }, 30000)

  it('applies loader page and decoded caps before any fetch, without a pack exception', async () => {
    for (const caps of [{ ...CONTRACT_CAPS, decodedPerFighter: 12991663 }, { ...CONTRACT_CAPS, pageLimit: 2043 }]) {
      const fake = makeScene(), { io, calls } = makeIo(), rt = new MotionRuntime(io, caps)
      expect(await rt.loadKind(fake.scene, 'xiahoudun')).toEqual({ ok: false, failure: 'unsupported' })
      expect(calls).toHaveLength(0)
      expect(fake.resources().motions.xiahoudun).toBeUndefined()
      await rt.settle()
    }
  })
  it('real GU/default ZF stage2 awaits heroes + opening wave within the cap and schedules the boss last (wave scope)', () => {
    const packs = Object.fromEntries(Object.entries(MOTION_PACKS).map(([id, d]) => [id, { sourceBytes: d.pages.reduce((n, p) => n + p.bytes, 0) }]))
    const partner = secondPlayerCharacter('guanyu')
    expect(partner).toBe('zhangfei')
    const req = motionStageRequest('stage2', 'guanyu', partner)
    const scope = stageMotionScope({ ...req, packs, budgetBytes: CONTRACT_CAPS.stageDownloads })
    // Derived from core stage data: roster in encounter order (no boss-first
    // hoist), immediate = heroes + opening-wave kinds, boss last in deferred.
    const stage = STAGES['stage2']!
    const opening = [...new Set(stage.waves[0]!.spawns.map((s) => s.kind))].filter((k) => packs[k])
    expect(req.stageKinds).toEqual([...new Set([
      ...stage.waves.flatMap((w) => w.spawns.map((s) => s.kind)),
      ...stage.props.map((p) => p.kind), stage.bossKind, 'arrow', 'meat', 'sword', 'crate',
    ])])
    expect(scope.immediate).toEqual(['guanyu', 'zhangfei', ...opening])
    expect(scope.immediateBytes).toBe(scope.immediate.reduce((n, kind) => n + packs[kind]!.sourceBytes, 0))
    expect(CONTRACT_CAPS.stageDownloads).toBe(12 * 1024 * 1024)
    expect(scope.immediateBytes).toBeLessThanOrEqual(CONTRACT_CAPS.stageDownloads)
    expect(scope.entryOverBudget).toBe(false)
    expect(scope.deferred[scope.deferred.length - 1], 'boss is scheduled, not dropped').toBe('xiahoudun')
    // Negative control: the legacy all-opening policy (no schedule) cannot
    // fit heroes + every mook + the boss under the same cap - that whole-
    // roster charge is exactly what wave scheduling removes.
    const old = stageMotionScope({ ...req, spawnSchedule: undefined, packs, budgetBytes: CONTRACT_CAPS.stageDownloads })
    expect(old.immediate).not.toContain('xiahoudun')
    expect(old.overBudget).toContain('xiahoudun')
    expect(['soldier', 'spearman', 'archer', 'xiahoudun'].reduce((sum, kind) => sum + packs[kind]!.sourceBytes, packs.guanyu!.sourceBytes + packs.zhangfei!.sourceBytes)).toBeGreaterThan(CONTRACT_CAPS.stageDownloads)
    // Heroes still outrank every enemy; the boss never displaces them or
    // raises caps even under a tighter budget.
    const expensive = stageMotionScope({ ...motionStageRequest('stage2', 'zhaoyun', 'zhangfei'), packs, budgetBytes: 9000000 })
    expect(expensive.immediate.slice(0, 2)).toEqual(['zhaoyun', 'zhangfei'])
    expect(expensive.deferred).toContain('xiahoudun')
    expect(expensive.plannedBytes).toBeLessThanOrEqual(9000000)
  })
  it('stage1 request roster, future kinds and spawn schedule all derive from core stage data', () => {
    const kinds = (id: string): string[] => [...new Set([
      ...STAGES[id]!.waves.flatMap((wave) => wave.spawns.map((spawn) => spawn.kind)),
      ...STAGES[id]!.props.map((prop) => prop.kind), STAGES[id]!.bossKind, 'arrow', 'meat', 'sword', 'crate',
    ])]
    const scheduleOf = (id: string) => [
      ...STAGES[id]!.waves.flatMap((wave, tick) => wave.spawns.map((spawn) => ({ kind: spawn.kind, tick }))),
      ...STAGES[id]!.props.map((prop) => ({ kind: prop.kind, tick: 0 })),
      { kind: STAGES[id]!.bossKind, tick: STAGES[id]!.waves.length },
      ...['arrow', 'meat', 'sword', 'crate'].map((kind) => ({ kind, tick: 0 })),
    ]
    for (const id of ['stage1']) {
      const stageKinds = kinds(id)
      const futureKinds = [...new Set(STAGE_ORDER.slice(STAGE_ORDER.indexOf(id as 'stage1') + 1).flatMap(kinds))].filter((kind) => !stageKinds.includes(kind))
      expect(motionStageRequest(id, 'guanyu', 'zhangfei')).toEqual({ hero: 'guanyu', secondPlayer: 'zhangfei', stageKinds, futureKinds, spawnSchedule: scheduleOf(id) })
    }
  })
  it('stage2 schedules its boss after the waves; stage1 keeps Xiahou out of its stage partition', () => {
    const req = motionStageRequest('stage2', 'guanyu')
    expect(req.stageKinds).toContain('xiahoudun')
    const packs = Object.fromEntries(Object.entries(MOTION_PACKS).map(([id, d]) => [id, { sourceBytes: d.pages.reduce((n, p) => n + p.bytes, 0) }]))
    const scope2 = stageMotionScope({ ...req, secondPlayer: null, packs, budgetBytes: CONTRACT_CAPS.stageDownloads })
    expect(scope2.immediate).not.toContain('xiahoudun')
    expect(scope2.deferred[scope2.deferred.length - 1]).toBe('xiahoudun')
    const scope1 = stageMotionScope({ ...motionStageRequest('stage1', 'guanyu'), secondPlayer: null, packs, budgetBytes: CONTRACT_CAPS.stageDownloads })
    expect(scope1.immediate).not.toContain('xiahoudun')
    expect(scope1.deferred, 'a future-stage boss is not stage1-spawnable').not.toContain('xiahoudun')
    // As future prefetch he may only ride inside the leftover entry budget.
    expect(scope1.plannedBytes, 'no cap bypass').toBeLessThanOrEqual(CONTRACT_CAPS.stageDownloads)
    const futureScope = stageMotionScope({ hero: 'xiahoudun', stageKinds: [], futureKinds: ['lidian', 'xuchu'], secondPlayer: null, packs, budgetBytes: CONTRACT_CAPS.stageDownloads })
    expect(futureScope.prefetch).toEqual(['lidian', 'xuchu']) // Xu Chu catalogued by CMR-15B
  })
})
