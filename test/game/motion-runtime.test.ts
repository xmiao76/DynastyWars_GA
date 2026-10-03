import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import type Phaser from 'phaser'
import { CONTRACT_CAPS, type BudgetCaps } from '../../src/game/adapters/motion-catalog'
import {
  MotionRuntime,
  MOTION_PACKS,
  motionFrameId,
  motionPackManifest,
  motionPreparedRecord,
  motionStageRequest,
  motionTextureKeys,
  type MotionIo,
} from '../../src/game/adapters/motion-art'

/**
 * CMR-03 attempt 3: the stage-aware runtime itself - fetch + SHA-256 +
 * decode + atomic publication + shared atlas frames. Every load outcome has
 * a negative control; the display registers frames with trim/pivot
 * restoration instead of cloning each cell to a canvas.
 */

const SHEET_BYTES = readFileSync('src/game/assets/motion/guanyu-motion-sheet.png')
const ACTION_BYTES = readFileSync('src/game/assets/motion/guanyu-actions-sheet.png')
const SOLDIER_BYTES = readFileSync('src/game/assets/motion/soldier-motion-sheet.png')
const SPEARMAN_BYTES = readFileSync('src/game/assets/motion/spearman-motion-sheet.png')
const ARCHER_BYTES = readFileSync('src/game/assets/motion/archer-motion-sheet.png')
const ZHANGFEI_SHEET_BYTES = readFileSync('src/game/assets/motion/zhangfei-motion-sheet.png')
const ZHANGFEI_ACTION_BYTES = readFileSync('src/game/assets/motion/zhangfei-actions-sheet.png')
const meta = motionPreparedRecord()
const keys = motionTextureKeys('guanyu')

// ---------------------------------------------------------------------------
// Fake scene: registry + texture manager (add/remove/exists/has/add + setTrim).
// ---------------------------------------------------------------------------

interface FakeFrame {
  cut: number[]
  trimArgs: number[] | null
}

interface FakeScene {
  scene: Phaser.Scene
  textures: Map<string, { image: unknown; frames: Map<string, FakeFrame> }>
  motions: () => Record<string, unknown>
  seedMotions: (motions: Record<string, unknown>) => void
}

function makeScene(): FakeScene {
  const textures = new Map<string, { image: unknown; frames: Map<string, FakeFrame> }>()
  let records: Record<string, unknown> = { heroes: {}, bodies: { retained: true } }
  const scene = {
    registry: {
      get: () => records,
      set: (_key: string, value: unknown) => {
        records = value as Record<string, unknown>
      },
    },
    textures: {
      exists: (key: string) => textures.has(key),
      get: (key: string) => ({
        getSourceImage: () => textures.get(key)!.image,
        has: (name: string) => textures.get(key)!.frames.has(name),
        add: (name: string, _sourceIndex: number, x: number, y: number, w: number, h: number) => {
          const frame: FakeFrame = { cut: [x, y, w, h], trimArgs: null }
          textures.get(key)!.frames.set(name, frame)
          return { setTrim: (...args: number[]) => { frame.trimArgs = args } }
        },
      }),
      addImage: (key: string, image: unknown) => {
        textures.set(key, { image, frames: new Map() })
      },
      remove: (key: string) => {
        textures.delete(key)
      },
    },
  } as unknown as Phaser.Scene
  return {
    scene,
    textures,
    motions: () => (records as { motions?: Record<string, unknown> }).motions ?? {},
    seedMotions: (motions) => {
      records = { ...records, motions }
    },
  }
}

// ---------------------------------------------------------------------------
// Fake I/O: per-page behaviors; sha256 is real (node crypto), decode is real
// for happy paths and injectable for the corrupt/unsupported controls.
// ---------------------------------------------------------------------------

type PageBehavior =
  | { kind: 'ok' }
  | { kind: 'missing' }
  | { kind: 'hang' }
  | { kind: 'garbage' }

interface TestIo extends MotionIo {
  calls: string[]
}

function makeIo(
  pages: { sheet: PageBehavior; actions: PageBehavior },
  opts: {
    decodeThrows?: string
    decodeSize?: { width: number; height: number }
    shaThrows?: string
    pageTimeoutMs?: number
    stageTimeoutMs?: number
    gate?: Promise<void>
  } = {},
): TestIo {
  const calls: string[] = []
  const pick = (url: string): PageBehavior => (url.includes('actions-sheet') ? pages.actions : pages.sheet)
  return {
    calls,
    fetchBytes: async (url, signal) => {
      calls.push(url)
      const behavior = pick(url)
      if (behavior.kind === 'hang') {
        await new Promise<void>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error(`timeout: ${url}`)))
        })
      }
      if (opts.gate) await opts.gate
      if (behavior.kind === 'missing') return new Uint8Array(0)
      if (behavior.kind === 'garbage') return new Uint8Array([1, 2, 3, 4])
      return new Uint8Array(url.includes('zhangfei') ? (url.includes('actions-sheet') ? ZHANGFEI_ACTION_BYTES : ZHANGFEI_SHEET_BYTES) : url.includes('archer') ? ARCHER_BYTES : url.includes('spearman') ? SPEARMAN_BYTES : url.includes('soldier') ? SOLDIER_BYTES : url.includes('actions-sheet') ? ACTION_BYTES : SHEET_BYTES)
    },
    sha256: async (bytes) => {
      if (opts.shaThrows) throw new Error(opts.shaThrows)
      return createHash('sha256').update(bytes).digest('hex')
    },
    decode: async (bytes) => {
      if (opts.decodeThrows) throw new Error(opts.decodeThrows)
      if (opts.decodeSize) return opts.decodeSize as CanvasImageSource & { width: number; height: number }
      return (await loadImage(Buffer.from(bytes))) as unknown as CanvasImageSource & { width: number; height: number }
    },
    makeCtx: (w, h) => createCanvas(w, h).getContext('2d') as unknown as CanvasRenderingContext2D,
    pageTimeoutMs: opts.pageTimeoutMs ?? 5_000,
    stageTimeoutMs: opts.stageTimeoutMs ?? 20_000,
  }
}

const okPages = { sheet: { kind: 'ok' } as PageBehavior, actions: { kind: 'ok' } as PageBehavior }

// ---------------------------------------------------------------------------

describe('stage-scoped motion runtime', () => {
  it('stage entry publishes the hero pack: two verified pages, shared frames with trim restoration', async () => {
    const { scene, textures, motions } = makeScene()
    const io = makeIo(okPages)
    const rt = new MotionRuntime(io)
    const report = await rt.prepareStage(scene, motionStageRequest('stage1', 'guanyu', null))
    // Request order varies run to run (fetch settlement); membership is exact.
    expect([...report.requested].sort()).toEqual(['archer', 'guanyu', 'soldier', 'spearman'])
    expect([...report.published].sort(), JSON.stringify(report.legacy)).toEqual(['archer', 'guanyu', 'soldier', 'spearman'])
    expect(report.legacy, JSON.stringify(report.legacy)).toEqual([])
    // Exactly the catalogued packs' pages (hero + the stage's soldier,
    // spearman and archer packs): no all-cast, no stage-adjacent extras.
    expect(io.calls).toHaveLength(5)
    expect(Object.keys(motions()).sort()).toEqual(['archer', 'guanyu', 'soldier', 'spearman'])
    // One texture per atlas page; every frame is a shared atlas frame.
    expect(textures.get(keys.sheet)!.frames.size).toBe(36)
    expect(textures.get(keys.actions)!.frames.size).toBe(54)
    for (const [name, cell] of Object.entries(meta.frames)) {
      const tex = textures.get(cell.sheet === 'actions' ? keys.actions : keys.sheet)!
      const frame = tex.frames.get(motionFrameId('guanyu', name))!
      expect(frame.cut, name).toEqual([cell.x, cell.y, cell.w, cell.h])
      // Trim/pivot restoration: the trimmed rect draws at (trimX, trimY)
      // inside the FULL 448x288 cell - exactly the old clone placement.
      expect(frame.trimArgs, name).toEqual([cell.srcW, cell.srcH, cell.trimX ?? 0, cell.trimY ?? 0, cell.w, cell.h])
    }
    // Budgets, kept separate and never raised.
    const rep = rt.budget()
    expect(rep.networkBytes).toBe(4_328_499 + 1_786_372 + 1_352_663 + 1_830_948)
    expect(rep.sourceBytes).toBe(4_328_499 + 1_786_372 + 1_352_663 + 1_830_948)
    expect(rep.perFighterDecoded['guanyu']).toBe(1935 * 903 * 4 + 2027 * 1055 * 4)
    expect(rep.perFighterDecoded['soldier']).toBe(1984 * 1142 * 4)
    expect(rep.perFighterDecoded['spearman']).toBe(1835 * 866 * 4)
    expect(rep.perFighterDecoded['archer']).toBe(2045 * 924 * 4)
    expect(rep.perFighterDecoded['guanyu']).toBeLessThanOrEqual(CONTRACT_CAPS.decodedPerFighter)
    expect(rep.perFighterDecoded['soldier']).toBeLessThanOrEqual(CONTRACT_CAPS.decodedPerFighter)
    expect(rep.perFighterDecoded['spearman']).toBeLessThanOrEqual(CONTRACT_CAPS.decodedPerFighter)
    expect(rep.perFighterDecoded['archer']).toBeLessThanOrEqual(CONTRACT_CAPS.decodedPerFighter)
    expect(rep.gpuBytes, 'one GPU upload per page, no display clones').toBe(rep.perFighterDecoded['guanyu']! + rep.perFighterDecoded['soldier']! + rep.perFighterDecoded['spearman']! + rep.perFighterDecoded['archer']!)
    expect(rep.clonedCanvasBytes).toBe(0)
    expect(rep.retainedBytes).toBeLessThanOrEqual(CONTRACT_CAPS.retainedCache)
    expect(rep.networkBytes, 'stage-entry downloads fit the 12 MiB cap').toBeLessThanOrEqual(CONTRACT_CAPS.stageDownloads)
    // The per-cell clone display this replaced would hold one full-cell canvas
    // per frame (and upload each): far past the per-fighter decode cap.
    const cloneBytes = Object.keys(meta.frames).length * 448 * 288 * 4
    expect(cloneBytes).toBeGreaterThan(CONTRACT_CAPS.decodedPerFighter)
    expect(cloneBytes).toBeGreaterThan(rep.gpuBytes)
  }, 60_000)

  it('co-op: the default/cached 2P hero is ready at stage entry, dedupe and restart never re-download, eviction uninstalls', async () => {
    const { scene, textures, motions } = makeScene()
    let gate: () => void = () => {}
    const gatePromise = new Promise<void>((r) => { gate = r })
    const io = makeIo(okPages, { gate: gatePromise })
    const rt = new MotionRuntime(io)
    const req = motionStageRequest('stage1', 'zhangfei', 'guanyu') // zhangfei's two-page pack loads as the hero
    const pending = rt.prepareStage(scene, req)
    void rt.loadKind(scene, 'guanyu') // concurrent join-side request
    gate()
    const report = await pending
    await rt.settle()
    expect([...report.requested].sort()).toEqual(['guanyu', 'soldier', 'spearman', 'zhangfei'])
    expect([...report.published].sort()).toEqual(['guanyu', 'soldier', 'spearman', 'zhangfei'])
    // The two heroes (4.04 + 4.33 MB) plus soldier and spearman reach 11.50
    // MB: the archer pack (1.83 MB) would push stage-entry downloads past
    // the 12 MiB cap, so the scope policy defers it to legacy art - the
    // designed priority order (hero, 2P, stage kinds), never raised ceilings.
    expect(io.calls, 'concurrent requests share one page load each').toHaveLength(6)
    expect(Object.keys(motions()).sort()).toEqual(['guanyu', 'soldier', 'spearman', 'zhangfei'])
    const rep = rt.budget()
    expect(rep.perFighterDecoded['zhangfei']).toBe(2004 * 2026 * 4 + 1693 * 768 * 4)
    expect(rep.perFighterDecoded['zhangfei']).toBeLessThanOrEqual(22 * 1024 * 1024)
    // Restart/stage progression: shutdown then a new stage entry reuses the
    // cache with ZERO downloads (textures + registry survive the restart).
    rt.cancelLoads()
    rt.releaseScene(scene)
    const again = await rt.prepareStage(scene, motionStageRequest('stage2', 'zhangfei', 'guanyu'))
    expect([...again.published].sort()).toEqual(['guanyu', 'soldier', 'spearman', 'zhangfei'])
    expect(io.calls, 'restart re-downloads nothing').toHaveLength(6)
    // Eviction: a tiny retained cap retires the released pack and uninstalls
    // its textures/registry entry; a later entry reloads it from the network.
    // Same scope as above (hero zhangfei), so this runtime holds every pack
    // the scene has and the release retires all of them.
    const evictIo = makeIo(okPages)
    const evicting = new MotionRuntime(evictIo, { ...CONTRACT_CAPS, retainedCache: 1 } satisfies BudgetCaps)
    const report2 = await evicting.prepareStage(scene, motionStageRequest('stage1', 'zhangfei', 'guanyu'))
    expect([...report2.published].sort()).toEqual(['guanyu', 'soldier', 'spearman', 'zhangfei'])
    evicting.releaseScene(scene)
    expect(motions(), 'evicted pack leaves the registry').toEqual({})
    expect(textures.has(keys.sheet), 'evicted pack removes its textures').toBe(false)
    expect(textures.has(keys.actions)).toBe(false)
    expect(evictIo.calls).toHaveLength(6)
  }, 60_000)

  it('only catalogued stage packs are requested - packless heroes/kinds never download', async () => {
    const { scene, motions } = makeScene()
    const io = makeIo(okPages)
    const rt = new MotionRuntime(io)
    const report = await rt.prepareStage(scene, motionStageRequest('stage1', 'zhaoyun', null))
    expect([...report.requested].sort()).toEqual(['archer', 'soldier', 'spearman'])
    expect([...report.published].sort()).toEqual(['archer', 'soldier', 'spearman'])
    expect(io.calls, 'only the catalogued pack pages download').toHaveLength(3)
    expect(Object.keys(motions()).sort()).toEqual(['archer', 'soldier', 'spearman'])
    // Kinds without packs are unsupported, never half-loaded.
    const unsupported = await rt.loadKind(scene, 'lidian')
    expect(unsupported).toEqual({ ok: false, failure: 'unsupported' })
    const unknown = await rt.loadKind(scene, 'caocao')
    expect(unknown).toEqual({ ok: false, failure: 'unsupported' })
    expect(io.calls).toHaveLength(3)
  }, 60_000)

  it('stage request derives hero/2P/stage kinds and disjoint future kinds', () => {
    const req = motionStageRequest('stage1', 'zhangfei', 'guanyu')
    expect(req.hero).toBe('zhangfei')
    expect(req.secondPlayer).toBe('guanyu')
    expect(req.stageKinds).toContain('arrow')
    expect(req.stageKinds).toContain('crate')
    expect(req.stageKinds.length).toBeGreaterThan(4)
    for (const kind of req.futureKinds) expect(req.stageKinds).not.toContain(kind)
    expect(motionPackManifest('guanyu')?.display).toBe('shared-atlas')
    expect(MOTION_PACKS['zhangfei'], 'CMR-09B registers the hero pack').toBeDefined()
  })
})

describe('negative controls reject the whole fighter, never other valid art', () => {
  const setup = (pages: { sheet: PageBehavior; actions: PageBehavior }, opts: Parameters<typeof makeIo>[1] = {}) => {
    const fake = makeScene()
    // A sibling fighter's valid art must survive every rejection below.
    fake.seedMotions({ zhangfei: { id: 'zhangfei', revision: 'kept' } })
    const io = makeIo(pages, opts)
    return { fake, io, rt: new MotionRuntime(io) }
  }
  const expectLegacyOnly = (fake: FakeScene, io: TestIo): void => {
    expect(io.calls.length, 'requests were attempted').toBeGreaterThan(0)
    const motions = fake.motions()
    expect(motions['guanyu'], 'failing fighter falls back to whole-legacy').toBeUndefined()
    expect(motions['zhangfei'], 'other valid art survives').toEqual({ id: 'zhangfei', revision: 'kept' })
    expect(fake.textures.has(keys.sheet), 'no partial textures may remain').toBe(false)
    expect(fake.textures.has(keys.actions)).toBe(false)
  }

  it('missing page -> missing, whole fighter legacy', async () => {
    const { fake, io, rt } = setup({ sheet: { kind: 'ok' }, actions: { kind: 'missing' } })
    const out = await rt.loadKind(fake.scene, 'guanyu')
    expect(out).toEqual({ ok: false, failure: 'missing' })
    expectLegacyOnly(fake, io) // missing
  })

  it('garbage bytes -> wrong-signature (SHA-256 mismatch)', async () => {
    const { fake, io, rt } = setup({ sheet: { kind: 'garbage' }, actions: { kind: 'ok' } })
    const out = await rt.loadKind(fake.scene, 'guanyu')
    expect(out).toEqual({ ok: false, failure: 'wrong-signature' })
    expectLegacyOnly(fake, io) // wrong-signature
  })

  it('undecodable page -> corrupt, whole fighter legacy', async () => {
    const { fake, io, rt } = setup(okPages, { decodeThrows: 'corrupt: bad png' })
    const out = await rt.loadKind(fake.scene, 'guanyu')
    expect(out).toEqual({ ok: false, failure: 'corrupt' })
    expectLegacyOnly(fake, io)
  })

  it('page decoding to the wrong size -> corrupt, whole fighter legacy', async () => {
    const { fake, io, rt } = setup(okPages, { decodeSize: { width: 8, height: 8 } })
    const out = await rt.loadKind(fake.scene, 'guanyu')
    expect(out).toEqual({ ok: false, failure: 'corrupt' })
    expectLegacyOnly(fake, io)
  })

  it('hung page -> timeout within the page deadline, whole fighter legacy', async () => {
    const { fake, io, rt } = setup({ sheet: { kind: 'hang' }, actions: { kind: 'ok' } }, { pageTimeoutMs: 40 })
    const out = await rt.loadKind(fake.scene, 'guanyu')
    expect(out).toEqual({ ok: false, failure: 'timeout' })
    expectLegacyOnly(fake, io) // timeout
  })

  it('no SHA-256 available -> unsupported, whole fighter legacy', async () => {
    const { fake, io, rt } = setup(okPages, { shaThrows: 'unsupported: SHA-256 requires a secure context' })
    const out = await rt.loadKind(fake.scene, 'guanyu')
    expect(out).toEqual({ ok: false, failure: 'unsupported' })
    expectLegacyOnly(fake, io) // unsupported
  })

  it('stage deadline falls back to legacy without hanging the stage', async () => {
    const { fake, io, rt } = setup({ sheet: { kind: 'hang' }, actions: { kind: 'hang' } }, { pageTimeoutMs: 5_000, stageTimeoutMs: 60 })
    const report = await rt.prepareStage(fake.scene, motionStageRequest('stage1', 'guanyu', null))
    expect(report.published).toEqual([])
    expect(report.legacy).toEqual([{ kind: 'guanyu', failure: 'timeout' }, { kind: 'soldier', failure: 'timeout' }, { kind: 'spearman', failure: 'timeout' }, { kind: 'archer', failure: 'timeout' }])
    expect(fake.motions()['guanyu']).toBeUndefined()
    await rt.settle()
    void io
  })
})

describe('cancellation, stale callbacks and late joins', () => {
  it('a late callback after scene exit cancels and cannot publish', async () => {
    const fake = makeScene()
    let gate: () => void = () => {}
    const gatePromise = new Promise<void>((r) => { gate = r })
    const io = makeIo({ sheet: { kind: 'hang' }, actions: { kind: 'ok' } }, { pageTimeoutMs: 5_000, gate: gatePromise })
    const rt = new MotionRuntime(io)
    const pending = rt.loadKind(fake.scene, 'guanyu')
    rt.cancelLoads() // scene exit/restart mid-load
    gate()
    const out = await pending
    expect(out).toEqual({ ok: false, failure: 'cancelled' })
    expect(fake.motions()).toEqual({})
    expect(fake.textures.has(keys.sheet)).toBe(false)
  })

  it('an uncached optional co-op hero joins whole-legacy on bounded failure', async () => {
    const fake = makeScene()
    const io = makeIo({ sheet: { kind: 'missing' }, actions: { kind: 'ok' } })
    const rt = new MotionRuntime(io)
    // The join-side prepare path is loadKind; on failure the hero joins with
    // legacy art (atomic per fighter - never half a fighter).
    const out = await rt.loadKind(fake.scene, 'guanyu')
    expect(out).toEqual({ ok: false, failure: 'missing' })
    expect(fake.motions()).toEqual({})
    // A retry after a transient failure may reload (failed slots are retried).
    const io2 = makeIo(okPages, { decodeThrows: 'corrupt: still bad' })
    const rt2 = new MotionRuntime(io2)
    expect(await rt2.loadKind(fake.scene, 'guanyu')).toEqual({ ok: false, failure: 'corrupt' })
    expect(rt2.state('guanyu'), 'a failed pack is not stuck ready').not.toBe('ready')
  })
})
