import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import type Phaser from 'phaser'
import { STAGES } from '../../src/core/stage'
import { CONTRACT_CAPS, type BudgetCaps } from '../../src/game/adapters/motion-catalog'
import type { MotionArt } from '../../src/game/art/motion-clips'
import {
  MotionRuntime,
  MOTION_PACKS,
  canRenderLegacyFrame,
  isMotionPackKind,
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
const HUANGZHONG_BYTES = readFileSync('src/game/assets/motion/huangzhong-motion-sheet.png')
const LIDIAN_BYTES = readFileSync('src/game/assets/motion/lidian-motion-sheet.png')
const XIAHOUDUN_BYTES = readFileSync('src/game/assets/motion/xiahoudun-motion-sheet.png')
const XUCHU_BYTES = readFileSync('src/game/assets/motion/xuchu-motion-sheet.png')
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
      return new Uint8Array(url.includes('zhangfei') ? (url.includes('actions-sheet') ? ZHANGFEI_ACTION_BYTES : ZHANGFEI_SHEET_BYTES) : url.includes('huangzhong') ? HUANGZHONG_BYTES : url.includes('lidian') ? LIDIAN_BYTES : url.includes('xiahoudun') ? XIAHOUDUN_BYTES : url.includes('xuchu') ? XUCHU_BYTES : url.includes('archer') ? ARCHER_BYTES : url.includes('spearman') ? SPEARMAN_BYTES : url.includes('soldier') ? SOLDIER_BYTES : url.includes('actions-sheet') ? ACTION_BYTES : SHEET_BYTES)
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

// Wave partition derived from the core stage data + the real catalog (the
// same derivation the exhaustive scope tests pin): immediate = heroes +
// opening-wave kinds, deferred = later kinds in first-spawn order, boss last.
const packBytes = (kind: string): number => MOTION_PACKS[kind]!.pages.reduce((n, p) => n + p.bytes, 0)
const packPages = (kind: string): number => MOTION_PACKS[kind]!.pages.length
const packDecoded = (kind: string): number => MOTION_PACKS[kind]!.pages.reduce((n, p) => n + p.width * p.height * 4, 0)
const sumBy = (kinds: readonly string[], f: (kind: string) => number): number => kinds.reduce((n, k) => n + f(k), 0)
function spawnPartition(stageId: string, heroes: string[]): { immediate: string[]; deferred: string[] } {
  const stage = STAGES[stageId]!
  const first = new Map<string, { tick: number; seq: number }>()
  let seq = 0
  stage.waves.forEach((wave, tick) => {
    for (const spawn of wave.spawns) {
      if (!first.has(spawn.kind)) first.set(spawn.kind, { tick, seq })
      seq += 1
    }
  })
  if (!first.has(stage.bossKind)) first.set(stage.bossKind, { tick: stage.waves.length, seq })
  const spawnable = [...first.keys()]
    .filter((kind) => MOTION_PACKS[kind])
    .sort((a, b) => first.get(a)!.tick - first.get(b)!.tick || first.get(a)!.seq - first.get(b)!.seq)
  const opening = [...new Set(stage.waves[0]!.spawns.map((s) => s.kind))].filter((kind) => MOTION_PACKS[kind])
  const immediate = [...new Set([...heroes, ...opening])]
  return { immediate, deferred: spawnable.filter((kind) => !immediate.includes(kind)) }
}
/** Kind sequence of the recorded page fetches (one entry per fetched page). */
const fetchedKinds = (calls: string[]): string[] =>
  calls.map((url) => Object.keys(MOTION_PACKS).find((kind) => url.includes(kind)) ?? url)
const pageSequence = (kinds: readonly string[]): string[] => kinds.flatMap((kind) => Array<string>(packPages(kind)).fill(kind))

// ---------------------------------------------------------------------------

describe('stage-scoped motion runtime', () => {
  it('stage entry publishes the hero pack: two verified pages, shared frames with trim restoration', async () => {
    const { scene, textures, motions } = makeScene()
    const io = makeIo(okPages)
    const rt = new MotionRuntime(io)
    const { immediate, deferred } = spawnPartition('stage1', ['guanyu'])
    const report = await rt.prepareStage(scene, motionStageRequest('stage1', 'guanyu', null))
    // The entry gate awaits ONLY the opening set (hero + opening wave);
    // later waves and the boss are scheduled behind it in spawn order.
    expect(report.requested).toEqual(immediate)
    expect(report.published, JSON.stringify(report.legacy)).toEqual(immediate)
    expect(report.deferred).toEqual(deferred)
    expect(report.legacy, JSON.stringify(report.legacy)).toEqual([])
    expect(report.scope.immediateBytes, 'entry downloads are the new immediate bytes').toBe(sumBy(immediate, packBytes))
    expect(report.scope.immediateBytes).toBeLessThanOrEqual(CONTRACT_CAPS.stageDownloads)
    expect(rt.dueKinds(scene, 0)).toEqual(immediate)
    expect(rt.kindsReady(scene, immediate)).toBe(true)
    // Background loads then land deferred kinds in first-spawn order, then
    // the budget-admitted future-stage prefetch - no all-cast extras.
    await rt.settle()
    const settled = [...immediate, ...deferred, ...report.scope.prefetch]
    expect(Object.keys(motions()).sort()).toEqual([...settled].sort())
    expect(io.calls).toHaveLength(sumBy(settled, packPages))
    expect(fetchedKinds(io.calls), 'pages fetch in immediate, deferred, prefetch order').toEqual(pageSequence(settled))
    expect(rt.kindsReady(scene, deferred)).toBe(true)
    // One texture per atlas page; every frame is a shared atlas frame.
    expect(textures.get(keys.sheet)!.frames.size).toBe(36)
    expect(textures.get(keys.actions)!.frames.size).toBe(45)
    for (const [name, cell] of Object.entries(meta.frames)) {
      const tex = textures.get(cell.sheet === 'actions' ? keys.actions : keys.sheet)!
      const frame = tex.frames.get(motionFrameId('guanyu', name))!
      expect(frame.cut, name).toEqual([cell.x, cell.y, cell.w, cell.h])
      // Trim/pivot restoration: the trimmed rect draws at (trimX, trimY)
      // inside the FULL 448x288 cell - exactly the old clone placement.
      expect(frame.trimArgs, name).toEqual([cell.srcW, cell.srcH, cell.trimX ?? 0, cell.trimY ?? 0, cell.w, cell.h])
    }
    // Budgets, kept separate and never raised. After settle the cache holds
    // every settled pack, so network/decoded totals derive from the catalog;
    // the 12 MiB cap itself charges only the entry (immediate) downloads.
    const rep = rt.budget()
    expect(rep.networkBytes).toBe(sumBy(settled, packBytes))
    expect(rep.sourceBytes).toBe(sumBy(settled, packBytes))
    for (const kind of settled) {
      expect(rep.perFighterDecoded[kind], kind).toBe(packDecoded(kind))
      const cap = MOTION_PACKS[kind]!.meta().decodedCapBytes ?? CONTRACT_CAPS.decodedPerFighter
      expect(rep.perFighterDecoded[kind], kind).toBeLessThanOrEqual(cap)
    }
    expect(rep.gpuBytes, 'one GPU upload per page, no display clones').toBe(sumBy(settled, packDecoded))
    expect(rep.clonedCanvasBytes).toBe(0)
    expect(rep.retainedBytes).toBeLessThanOrEqual(CONTRACT_CAPS.retainedCache)
    expect(report.scope.plannedBytes, 'planned entry downloads fit the 12 MiB cap').toBeLessThanOrEqual(CONTRACT_CAPS.stageDownloads)
    // The per-cell clone display this replaced would hold one full-cell canvas
    // per frame (and upload each): far past the per-fighter decode cap.
    const cloneBytes = Object.keys(meta.frames).length * 448 * 288 * 4
    expect(cloneBytes).toBeGreaterThan(CONTRACT_CAPS.decodedPerFighter)
    expect(cloneBytes, 'guanyu clones alone exceed his shared-atlas upload').toBeGreaterThan(rep.perFighterDecoded['guanyu']!)
    // A late co-op hero who was never in the solo scope still loads on
    // demand through the scheduled-set query path.
    const callsBefore = io.calls.length
    expect(rt.kindReady(scene, 'zhangfei')).toBe(false)
    expect(await rt.prepareKinds(scene, ['zhangfei'])).toEqual([{ kind: 'zhangfei', outcome: { ok: true } }])
    expect(rt.kindReady(scene, 'zhangfei')).toBe(true)
    expect(io.calls).toHaveLength(callsBefore + packPages('zhangfei'))
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
    const part1 = spawnPartition('stage1', ['zhangfei', 'guanyu'])
    // Entry awaited only heroes + opening wave; every later kind (the
    // lidian boss included) was scheduled, not dropped to legacy by the cap.
    expect(report.requested).toEqual(part1.immediate)
    expect(report.published).toEqual(part1.immediate)
    expect(report.deferred).toEqual(part1.deferred)
    const settled1 = [...part1.immediate, ...part1.deferred, ...report.scope.prefetch]
    expect(io.calls, 'concurrent requests share one page load each').toHaveLength(sumBy(settled1, packPages))
    // The concurrent join load may interleave its pages with the hero's, so
    // pin the exact page multiset (dedupe), not fetch order, here.
    expect([...fetchedKinds(io.calls)].sort()).toEqual([...pageSequence(settled1)].sort())
    expect(Object.keys(motions()).sort()).toEqual([...settled1].sort())
    const rep = rt.budget()
    expect(rep.perFighterDecoded['zhangfei']).toBe(packDecoded('zhangfei'))
    expect(rep.perFighterDecoded['zhangfei']).toBeLessThanOrEqual(MOTION_PACKS['zhangfei']!.meta().decodedCapBytes ?? CONTRACT_CAPS.decodedPerFighter)
    expect((motions()['zhangfei'] as MotionArt).collapseTail, 'published art carries the per-kind collapse tail').toEqual(['fall:3', 'fall:4'])
    // Same-stage restart reuses every held page (never re-downloads one),
    // and the cached opening set charges ZERO new entry bytes. The freed
    // entry budget may admit one more FUTURE prefetch than the cold entry
    // did; that is new optional work, not a re-download.
    rt.cancelLoads()
    rt.releaseScene(scene)
    const restart = await rt.prepareStage(scene, req)
    expect(restart.published).toEqual(part1.immediate)
    expect(restart.scope.immediateBytes, 'fully cached immediate set is free at the gate').toBe(0)
    expect(restart.scope.cachedBytes).toBe(sumBy(part1.immediate, packBytes))
    await rt.settle()
    const settledRestart = [...new Set([...settled1, ...restart.scope.prefetch])]
    expect(io.calls, 'restart re-downloads no held page').toHaveLength(sumBy(settledRestart, packPages))
    expect([...fetchedKinds(io.calls)].sort()).toEqual([...pageSequence(settledRestart)].sort())
    // Stage2: its opening set is already warm and its deferred kinds
    // (mooks, then the xiahoudun boss stage1 already prefetched) need no
    // new download; only newly admitted future prefetch may fetch.
    rt.cancelLoads()
    rt.releaseScene(scene)
    const part2 = spawnPartition('stage2', ['zhangfei', 'guanyu'])
    const again = await rt.prepareStage(scene, motionStageRequest('stage2', 'zhangfei', 'guanyu'))
    expect(again.requested).toEqual(part2.immediate)
    expect(again.published).toEqual(part2.immediate)
    expect(again.deferred).toEqual(part2.deferred)
    expect(again.scope.immediateBytes).toBe(0)
    await rt.settle()
    expect(rt.kindsReady(scene, [...part2.immediate, ...part2.deferred])).toBe(true)
    const settled2 = [...new Set([...settledRestart, ...part2.immediate, ...part2.deferred, ...again.scope.prefetch])]
    expect(Object.keys(motions()).sort()).toEqual([...settled2].sort())
    expect(io.calls, 'warm roster kinds never re-download').toHaveLength(sumBy(settled2, packPages))
    expect([...fetchedKinds(io.calls)].sort()).toEqual([...pageSequence(settled2)].sort())
    expect(rt.budget().networkBytes).toBe(sumBy(settled2, packBytes))
    expect(rt.budget().clonedCanvasBytes).toBe(0)
    rt.cancelLoads()
    rt.releaseScene(scene)
    // Eviction: a tiny retained cap retires the released pack and uninstalls
    // its textures/registry entry; a later entry reloads it from the network.
    // Same scope as above (hero zhangfei), so this runtime holds every pack
    // the scene has and the release retires all of them.
    const evictIo = makeIo(okPages)
    const evicting = new MotionRuntime(evictIo, { ...CONTRACT_CAPS, retainedCache: 1 } satisfies BudgetCaps)
    // A separate cache owns a separate scene; it must not evict Xiahou held
    // by the prior runtime simply because that runtime is not under test here.
    const evictScene = makeScene()
    const report2 = await evicting.prepareStage(evictScene.scene, motionStageRequest('stage1', 'zhangfei', 'guanyu'))
    expect(report2.published).toEqual(part1.immediate)
    await evicting.settle()
    const evictSettled = [...part1.immediate, ...part1.deferred, ...report2.scope.prefetch]
    expect(Object.keys(evictScene.motions()).sort()).toEqual([...evictSettled].sort())
    evicting.releaseScene(evictScene.scene)
    expect(evictScene.motions(), 'evicted pack leaves the registry').toEqual({})
    expect(evictScene.textures.has(keys.sheet), 'evicted pack removes its textures').toBe(false)
    expect(evictScene.textures.has(keys.actions)).toBe(false)
    expect(motions().xiahoudun, 'other runtime retains its valid boss').toBeDefined()
    expect(textures.has(motionTextureKeys('xiahoudun').sheet)).toBe(true)
    expect(evictIo.calls).toHaveLength(sumBy(evictSettled, packPages))
  }, 60_000)

  it('fresh GU/default ZF stage2 awaits heroes + opening wave, then prefetches later mooks and the boss in spawn order', async () => {
    const { scene, textures, motions } = makeScene(), io = makeIo(okPages), rt = new MotionRuntime(io)
    const { immediate, deferred } = spawnPartition('stage2', ['guanyu', 'zhangfei'])
    const report = await rt.prepareStage(scene, motionStageRequest('stage2', 'guanyu', 'zhangfei'))
    expect(report.requested).toEqual(immediate)
    expect(report.published).toEqual(immediate)
    expect(report.deferred, 'later-wave mooks first, boss last').toEqual(deferred)
    expect(report.legacy).toEqual([])
    expect(report.scope.immediateBytes).toBe(sumBy(immediate, packBytes))
    expect(report.scope.immediateBytes, 'entry downloads fit the unchanged cap').toBeLessThan(CONTRACT_CAPS.stageDownloads)
    expect(report.scope.entryOverBudget).toBe(false)
    await rt.settle()
    const settled = [...immediate, ...deferred, ...report.scope.prefetch]
    expect(Object.keys(motions()).sort()).toEqual([...settled].sort())
    expect(fetchedKinds(io.calls), 'background pages fetch in first-spawn order').toEqual(pageSequence(settled))
    expect(rt.kindReady(scene, 'xiahoudun')).toBe(true)
    expect(textures.get(motionTextureKeys('xiahoudun').sheet)!.frames.size).toBe(39)
    expect(rt.budget()).toMatchObject({
      networkBytes: sumBy(settled, packBytes),
      sourceBytes: sumBy(settled, packBytes),
      clonedCanvasBytes: 0,
      perFighterDecoded: { xiahoudun: packDecoded('xiahoudun') },
    })
    rt.cancelLoads(); rt.releaseScene(scene); await rt.settle()
  }, 60000)

  it('only catalogued stage packs are requested - unpacked kinds never download', async () => {
    const { scene, motions } = makeScene()
    const io = makeIo(okPages)
    const rt = new MotionRuntime(io)
    // Huang Zhong (CMR-12B) is a catalogued single-page hero pack: entry
    // awaits him plus the opening wave. Li Dian (CMR-13B), the stage-1
    // boss, is scheduled last behind the later-wave mooks.
    const { immediate, deferred } = spawnPartition('stage1', ['huangzhong'])
    const report = await rt.prepareStage(scene, motionStageRequest('stage1', 'huangzhong', null))
    expect(report.requested).toEqual(immediate)
    expect(report.published).toEqual(immediate)
    expect(report.deferred).toEqual(deferred)
    expect(deferred[deferred.length - 1]).toBe('lidian')
    await rt.settle()
    const settled = [...immediate, ...deferred, ...report.scope.prefetch]
    expect(io.calls, 'only the catalogued pack pages download').toHaveLength(sumBy(settled, packPages))
    expect(fetchedKinds(io.calls)).toEqual(pageSequence(settled))
    expect(Object.keys(motions()).sort()).toEqual([...settled].sort())
    // The stage boss pack loads whole; kinds without packs are unsupported,
    // never half-loaded. Neither path re-downloads (boss cached, unknown skipped).
    const boss = await rt.loadKind(scene, 'lidian')
    expect(boss).toEqual({ ok: true })
    const unknown = await rt.loadKind(scene, 'crate') // Xu Chu is catalogued by CMR-15B; props remain unsupported.
    expect(unknown).toEqual({ ok: false, failure: 'unsupported' })
    expect(io.calls).toHaveLength(sumBy(settled, packPages))
  }, 60_000)

  it('stage request derives hero/2P/stage kinds and disjoint future kinds', () => {
    const req = motionStageRequest('stage1', 'zhangfei', 'guanyu')
    expect(req.hero).toBe('zhangfei')
    expect(req.secondPlayer).toBe('guanyu')
    expect(req.stageKinds).toContain('arrow')
    expect(req.stageKinds).toContain('crate')
    expect(req.stageKinds.length).toBeGreaterThan(4)
    for (const kind of req.futureKinds) expect(req.stageKinds).not.toContain(kind)
    // The spawn schedule's first tick per kind derives from the stage's
    // waves (boss after the final wave), matching the core spawn order.
    const firstTick = new Map<string, number>()
    for (const entry of req.spawnSchedule ?? []) if (!firstTick.has(entry.kind)) firstTick.set(entry.kind, entry.tick)
    const stage = STAGES['stage1']!
    stage.waves.forEach((wave, tick) => {
      for (const spawn of wave.spawns) expect(firstTick.get(spawn.kind)).toBeLessThanOrEqual(tick)
    })
    for (const spawn of stage.waves[0]!.spawns) expect(firstTick.get(spawn.kind)).toBe(0)
    expect(firstTick.get(stage.bossKind)).toBe(stage.waves.length)
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
    // Only the awaited opening set reports legacy at the deadline; the
    // deferred kinds were never blocking the stage in the first place. The
    // retry lives inside the same deadline, so a deadline cut is a FINAL
    // timeout for every unpublished immediate kind (overlay, not a stage).
    const { immediate, deferred } = spawnPartition('stage1', ['guanyu'])
    expect(report.legacy).toEqual(immediate.map((kind) => ({ kind, failure: 'timeout' })))
    expect(report.failed).toEqual(immediate.map((kind) => ({ kind, failure: 'timeout', attempts: 1, final: true })))
    expect(rt.finalFailure('guanyu')).toEqual({ kind: 'guanyu', failure: 'timeout', attempts: 1, final: true })
    expect(report.deferred).toEqual(deferred)
    expect(fake.motions()['guanyu']).toBeUndefined()
    rt.cancelLoads() // stop the background queue's hung pages
    await rt.settle()
    void io
  })
})

describe('sole-motion retry-once failure semantics', () => {
  const setup = (pages: { sheet: PageBehavior; actions: PageBehavior }, opts: Parameters<typeof makeIo>[1] = {}) => {
    const fake = makeScene()
    fake.seedMotions({ zhangfei: { id: 'zhangfei', revision: 'kept' } })
    const io = makeIo(pages, opts)
    return { fake, io, rt: new MotionRuntime(io) }
  }

  it('retry success: one transient failure, then the single retry publishes', async () => {
    const { fake, io, rt } = setup(okPages)
    let decodes = 0
    const decode = io.decode
    io.decode = async (bytes) => {
      decodes += 1
      if (decodes === 1) throw new Error('corrupt: transient decode')
      return decode(bytes)
    }
    const out = await rt.loadKind(fake.scene, 'guanyu')
    expect(out).toEqual({ ok: true })
    expect(decodes, 'first attempt dies on decode #1; the retry decodes both pages').toBe(3)
    expect(io.calls, 'the retry re-fetches both pages exactly once').toHaveLength(4)
    expect(fake.motions()['guanyu']).toBeDefined()
    expect(rt.failureState('guanyu'), 'success clears the failure state').toBeUndefined()
    expect(rt.finalFailure('guanyu')).toBeUndefined()
    expect(rt.kindReady(fake.scene, 'guanyu')).toBe(true)
  })

  // Retry exhausted per failure class: exactly two attempts, a structured
  // final failure, and no third attempt on a later required load.
  const exhausted: Array<{
    name: string
    pages: { sheet: PageBehavior; actions: PageBehavior }
    opts: Parameters<typeof makeIo>[1]
    failure: string
    fetches: number
  }> = [
    { name: 'missing', pages: { sheet: { kind: 'ok' }, actions: { kind: 'missing' } }, opts: {}, failure: 'missing', fetches: 4 },
    { name: 'wrong-signature', pages: { sheet: { kind: 'garbage' }, actions: { kind: 'ok' } }, opts: {}, failure: 'wrong-signature', fetches: 2 },
    { name: 'corrupt', pages: okPages, opts: { decodeThrows: 'corrupt: bad png' }, failure: 'corrupt', fetches: 4 },
    { name: 'unsupported crypto', pages: okPages, opts: { shaThrows: 'unsupported: SHA-256 requires a secure context' }, failure: 'unsupported', fetches: 2 },
    { name: 'timeout', pages: { sheet: { kind: 'hang' }, actions: { kind: 'ok' } }, opts: { pageTimeoutMs: 40 }, failure: 'timeout', fetches: 2 },
  ]
  for (const c of exhausted) {
    it(`retry exhausted: ${c.name} final-fails after exactly one retry`, async () => {
      const { fake, io, rt } = setup(c.pages, c.opts)
      const out = await rt.loadKind(fake.scene, 'guanyu')
      expect(out).toEqual({ ok: false, failure: c.failure })
      expect(io.calls, `${c.name}: try + one retry, no more`).toHaveLength(c.fetches)
      expect(rt.failureState('guanyu')).toEqual({ kind: 'guanyu', failure: c.failure, attempts: 2, final: true })
      expect(rt.finalFailure('guanyu')).toEqual({ kind: 'guanyu', failure: c.failure, attempts: 2, final: true })
      expect(fake.motions()['guanyu'], 'no legacy/placeholder publication on failure').toBeUndefined()
      expect(fake.motions()['zhangfei'], 'other valid art survives').toEqual({ id: 'zhangfei', revision: 'kept' })
      expect(fake.textures.has(keys.sheet)).toBe(false)
      expect(fake.textures.has(keys.actions)).toBe(false)
      // A later required load reports the final failure without a 3rd attempt.
      expect(await rt.loadKind(fake.scene, 'guanyu')).toEqual({ ok: false, failure: c.failure })
      expect(io.calls).toHaveLength(c.fetches)
    })
  }

  it('no legacy frame rule: motion on + unpublished motion kind renders nothing', () => {
    expect(isMotionPackKind('guanyu')).toBe(true)
    expect(isMotionPackKind('crate')).toBe(false)
    expect(canRenderLegacyFrame(true, 'guanyu', false), 'sole-motion: never legacy for an UNPUBLISHED motion kind').toBe(false)
    expect(canRenderLegacyFrame(true, 'guanyu', true), 'a published pack keeps the per-frame legacy fallback').toBe(true)
    expect(canRenderLegacyFrame(true, 'crate', false), 'non-motion props keep their art').toBe(true)
    expect(canRenderLegacyFrame(false, 'guanyu', false), 'legacy mode (motion off) is unchanged').toBe(true)
  })

  it('deferred due gating: a prefetch failure is non-fatal until due, then the retry can publish', async () => {
    const fake = makeScene()
    const io = makeIo(okPages)
    const { immediate, deferred } = spawnPartition('stage1', ['guanyu'])
    const dueKind = deferred[0]!
    // Poison ONLY the first (prefetch) fetch of the first deferred kind.
    let poisoned = false
    const fetchBytes = io.fetchBytes
    io.fetchBytes = async (url, signal) => {
      if (!poisoned && url.includes(dueKind)) {
        poisoned = true
        io.calls.push(url)
        return new Uint8Array([1, 2, 3, 4]) // -> wrong-signature
      }
      return fetchBytes(url, signal)
    }
    const rt = new MotionRuntime(io)
    const report = await rt.prepareStage(fake.scene, motionStageRequest('stage1', 'guanyu', null))
    expect(report.published).toEqual(immediate)
    expect(report.failed, 'a background prefetch failure never fails stage entry').toEqual([])
    await rt.settle()
    expect(rt.failureState(dueKind)).toEqual({ kind: dueKind, failure: 'wrong-signature', attempts: 1, final: false })
    expect(rt.finalFailure(dueKind), 'not due yet: non-fatal').toBeUndefined()
    expect(rt.gateForTick(fake.scene, 0), 'opening gate stays open').toEqual({ blocked: false, missing: [] })
    const tick = report.scope.schedule.find((e) => e.kind === dueKind)!.firstSpawnTick
    const gate = rt.gateForTick(fake.scene, tick)
    expect(gate.blocked, 'due now: the spawn gate halts').toBe(true)
    expect(gate.missing).toContain(dueKind)
    expect(gate.failure, 'the retry has not been spent yet').toBeUndefined()
    // Becoming due spends the single retry; here it succeeds and unblocks.
    expect(await rt.prepareKinds(fake.scene, gate.missing)).toEqual(gate.missing.map((kind) => ({ kind, outcome: { ok: true } })))
    expect(rt.kindReady(fake.scene, dueKind)).toBe(true)
    expect(rt.failureState(dueKind)).toBeUndefined()
    expect(rt.gateForTick(fake.scene, tick).blocked).toBe(false)
  }, 60_000)

  it('deferred due gating: when the due retry also fails the kind final-fails at the gate', async () => {
    const fake = makeScene()
    const io = makeIo(okPages)
    const { deferred } = spawnPartition('stage1', ['guanyu'])
    const dueKind = deferred[0]!
    const fetchBytes = io.fetchBytes
    io.fetchBytes = async (url, signal) => {
      if (url.includes(dueKind)) {
        io.calls.push(url)
        return new Uint8Array([1, 2, 3, 4])
      }
      return fetchBytes(url, signal)
    }
    const rt = new MotionRuntime(io)
    const report = await rt.prepareStage(fake.scene, motionStageRequest('stage1', 'guanyu', null))
    await rt.settle()
    expect(rt.failureState(dueKind)).toEqual({ kind: dueKind, failure: 'wrong-signature', attempts: 1, final: false })
    const tick = report.scope.schedule.find((e) => e.kind === dueKind)!.firstSpawnTick
    const before = io.calls.filter((u) => u.includes(dueKind)).length
    const results = await rt.prepareKinds(fake.scene, [dueKind])
    expect(results).toEqual([{ kind: dueKind, outcome: { ok: false, failure: 'wrong-signature' } }])
    expect(io.calls.filter((u) => u.includes(dueKind)).length, 'due load = the one retry only').toBe(before + 1)
    const failed = { kind: dueKind, failure: 'wrong-signature', attempts: 2, final: true }
    expect(rt.finalFailure(dueKind)).toEqual(failed)
    const gate = rt.gateForTick(fake.scene, tick)
    expect(gate.blocked).toBe(true)
    expect(gate.failure, 'the gate now reports the structured final failure (overlay)').toEqual(failed)
    expect(fake.motions()[dueKind]).toBeUndefined()
  }, 60_000)
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
    // Shutdown cancellation is not an error and consumes no retry.
    expect(rt.failureState('guanyu')).toBeUndefined()
    expect(rt.finalFailure('guanyu')).toBeUndefined()
    expect(io.calls, 'a cancelled load is never retried').toHaveLength(1)
  })

  it('co-op join failure: the required prepare final-fails after one retry and publishes nothing', async () => {
    const fake = makeScene()
    const io = makeIo({ sheet: { kind: 'missing' }, actions: { kind: 'ok' } })
    const rt = new MotionRuntime(io)
    // GameScene's join path is prepareKinds([hero]): sole-motion joins only
    // on success - a final failure shows the overlay instead of joining on
    // legacy art, so nothing may be published for the hero here.
    const results = await rt.prepareKinds(fake.scene, ['guanyu'])
    expect(results).toEqual([{ kind: 'guanyu', outcome: { ok: false, failure: 'missing' } }])
    expect(io.calls, 'sheet fetched on the try and on the one retry').toHaveLength(2)
    expect(rt.finalFailure('guanyu')).toEqual({ kind: 'guanyu', failure: 'missing', attempts: 2, final: true })
    expect(fake.motions()).toEqual({})
    expect(fake.textures.has(keys.sheet)).toBe(false)
    const io2 = makeIo(okPages, { decodeThrows: 'corrupt: still bad' })
    const rt2 = new MotionRuntime(io2)
    expect(await rt2.loadKind(fake.scene, 'guanyu')).toEqual({ ok: false, failure: 'corrupt' })
    expect(rt2.state('guanyu'), 'a failed pack is not stuck ready').not.toBe('ready')
    expect(rt2.finalFailure('guanyu')?.attempts).toBe(2)
  })
})
