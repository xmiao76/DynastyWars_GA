import { describe, expect, it } from 'vitest'
import {
  CONTRACT_CAPS,
  MotionAtlasCache,
  validateManifest,
  type PackManifest,
  type PackPage,
} from '../../src/game/adapters/motion-catalog'
import { MOTION_PACKS, motionPackManifest } from '../../src/game/adapters/motion-art'

/**
 * CMR-03 attempt 1: atomic per-fighter publication, request dedup, scope
 * cancellation with stale-callback rejection, refcounted eviction and
 * separated budget accounting. Negative controls prove the rejection paths.
 */

const A = 'a'.repeat(64)
const B = 'b'.repeat(64)

const page = (name: string, over: Partial<PackPage> = {}): PackPage => ({
  name,
  sourceKey: `motion:${name}`,
  bytes: 1024,
  sha256: A,
  width: 512,
  height: 512,
  ...over,
})

const manifest = (id: string, pages: PackPage[], revision = 'r1'): PackManifest => ({
  id,
  revision,
  pages,
  requiredClips: ['idle', 'walk', 'hurt', 'fall', 'getup'],
  clipsHash: 'cd926d062b86def8f6a309b480d4b9383a6a612985dbff920837e28fa06ec31f',
})

const okLoader = async (p: PackPage): Promise<{ bytes: Uint8Array; sha256: string }> => ({
  bytes: new Uint8Array([1, 2, 3]),
  sha256: p.sha256,
})

describe('manifest validation', () => {
  it('accepts a well-formed pack and rejects the unsupported ones', () => {
    expect(validateManifest(manifest('soldier', [page('regular')]))).toEqual([])
    const oversized = validateManifest(manifest('big', [page('regular', { width: 2688, height: 2592 })]))
    expect(oversized.join(' ')).toContain('exceeds the 2048px page limit')
    // The pinned Guan Yu reference currently violates this rule (BASELINE.md);
    // the rule must DETECT it until the item-3 repack lands.
    expect(validateManifest(manifest('guanyu', [page('regular', { width: 1344, height: 3456 })])).join(' ')).toContain('exceeds the 2048px page limit')
    expect(validateManifest(manifest('x', [page('a'), page('a')])).join(' ')).toContain('duplicate/empty page name')
    expect(validateManifest(manifest('x', [page('a', { sha256: 'zz' })])).join(' ')).toContain('malformed signature')
    expect(validateManifest({ ...manifest('x', [page('a')]), pages: [] }).join(' ')).toContain('no pages')
  })

  it('a documented per-pack decoded exception replaces the default cap', () => {
    // 21.44 MB pages (the zhangfei shape): rejected by default...
    const pages = [page('sheet', { width: 2004, height: 2026 }), page('actions', { width: 1693, height: 768, sha256: B })]
    expect(validateManifest(manifest('big', pages)).join(' ')).toContain('per-fighter cap')
    // ...accepted with the owner exception recorded on the manifest.
    expect(validateManifest({ ...manifest('big', pages), decodedCap: 22 * 1024 * 1024 })).toEqual([])
  })
})

describe('atomic publication and negative controls', () => {
  it('missing/corrupt/wrong-signature/timeout reject the whole fighter, never part of it', async () => {
    const cache = new MotionAtlasCache()
    const m = manifest('soldier', [page('regular'), page('actions', { sha256: B })])
    const missing = await cache.request(m, async (p) => (p.name === 'actions' ? { bytes: new Uint8Array(0), sha256: p.sha256 } : okLoader(p)))
    expect(missing.ok).toBe(false)
    expect(missing.failure).toBe('missing')
    expect(cache.state('soldier')).toBe('failed')

    const wrong = await cache.request(manifest('spearman', [page('regular')]), async () => ({ bytes: new Uint8Array([1]), sha256: B }))
    expect(wrong.failure).toBe('wrong-signature')
    expect(cache.record('spearman'), 'no partial record may exist').toBeUndefined()

    const corrupt = await cache.request(manifest('archer', [page('regular')]), async () => { throw new Error('decode blew up') })
    expect(corrupt.failure).toBe('corrupt')

    const timeout = await cache.request(manifest('xuchu', [page('regular')]), async () => { throw new Error('load timeout after 10s') })
    expect(timeout.failure).toBe('timeout')

    const unsupported = await cache.request(manifest('big', [page('regular', { width: 4096, height: 4096 })]), okLoader)
    expect(unsupported.failure).toBe('unsupported')
    expect(unsupported.detail).toContain('exceeds the 2048px page limit')
  })

  it('loader failure messages map to unsupported/missing, not corrupt', async () => {
    const cache = new MotionAtlasCache()
    const noSha = await cache.request(manifest('nosh', [page('regular')]), async () => {
      throw new Error('unsupported: SHA-256 requires a secure context')
    })
    expect(noSha.failure).toBe('unsupported')
    const net = await cache.request(manifest('net', [page('regular')]), async () => {
      throw new Error('missing: network error for x')
    })
    expect(net.failure).toBe('missing')
  })

  it('a failed slot exposes its failure class and a retry request may succeed', async () => {
    const cache = new MotionAtlasCache()
    const m = manifest('soldier', [page('regular')])
    let calls = 0
    const flaky = async (p: PackPage): Promise<{ bytes: Uint8Array; sha256: string }> => {
      calls += 1
      if (calls === 1) throw new Error('missing: network error')
      return { bytes: new Uint8Array([1]), sha256: p.sha256 }
    }
    expect((await cache.request(m, flaky)).failure).toBe('missing')
    expect(cache.state('soldier')).toBe('failed')
    expect(cache.failure('soldier'), 'structured failure class of the failed attempt').toBe('missing')
    // The runtime's single retry is a second request: a failed slot reloads.
    expect((await cache.request(m, flaky)).ok).toBe(true)
    expect(calls).toBe(2)
    expect(cache.failure('soldier'), 'a ready pack has no failure class').toBeUndefined()
    expect(cache.failure('never-loaded')).toBeUndefined()
  })

  it('invalidate drops a ready slot so a later request may reload it', async () => {
    const cache = new MotionAtlasCache()
    const m = manifest('soldier', [page('regular')])
    expect((await cache.request(m, okLoader)).ok).toBe(true)
    cache.invalidate('soldier')
    expect(cache.state('soldier')).toBe('absent')
    let calls = 0
    const r = await cache.request(m, async (p) => {
      calls += 1
      return { bytes: new Uint8Array([1]), sha256: p.sha256 }
    })
    expect(calls, 'an invalidated pack reloads').toBe(1)
    expect(r.ok).toBe(true)
  })

  it('a failing fighter never clears other valid art', async () => {
    const cache = new MotionAtlasCache()
    await cache.request(manifest('guanyu-ok', [page('regular')]), okLoader)
    expect(cache.state('guanyu-ok')).toBe('ready')
    await cache.request(manifest('soldier', [page('regular')]), async () => { throw new Error('bad') })
    expect(cache.state('soldier')).toBe('failed')
    expect(cache.state('guanyu-ok'), 'valid art survives a sibling failure').toBe('ready')
    expect(cache.record('guanyu-ok')).toBeDefined()
  })
})

describe('duplicate and concurrent requests', () => {
  it('concurrent requests share one load and one result', async () => {
    const cache = new MotionAtlasCache()
    let calls = 0
    const loader = async (p: PackPage): Promise<{ bytes: Uint8Array; sha256: string }> => {
      calls += 1
      await new Promise((r) => setTimeout(r, 5))
      return { bytes: new Uint8Array([9]), sha256: p.sha256 }
    }
    const m = manifest('soldier', [page('regular'), page('actions', { sha256: B })])
    const [r1, r2, r3] = await Promise.all([cache.request(m, loader), cache.request(m, loader), cache.request(m, loader)])
    expect(calls, 'each page loads exactly once').toBe(2)
    expect(r1.ok && r2.ok && r3.ok).toBe(true)
    expect(r1.record).toEqual(r2.record)
    // A later request short-circuits on the ready record without reloading.
    const r4 = await cache.request(m, loader)
    expect(calls).toBe(2)
    expect(r4.ok).toBe(true)
  })
})

describe('scope cancellation and stale-callback rejection', () => {
  it('cancelled scope rejects the late result and never publishes', async () => {
    const cache = new MotionAtlasCache()
    let release: () => void = () => {}
    const gate = new Promise<void>((r) => { release = r })
    const loader = async (p: PackPage): Promise<{ bytes: Uint8Array; sha256: string }> => {
      await gate
      return { bytes: new Uint8Array([1]), sha256: p.sha256 }
    }
    const pending = cache.request(manifest('soldier', [page('regular')]), loader, 'stage2')
    cache.cancelScope('stage2')
    release()
    const result = await pending
    expect(result.ok).toBe(false)
    expect(result.failure).toBe('cancelled')
    expect(cache.state('soldier'), 'a stale callback cannot publish').not.toBe('ready')
  })

  it('cancelling one scope leaves other scopes loading', async () => {
    const cache = new MotionAtlasCache()
    let releaseA: () => void = () => {}
    const gateA = new Promise<void>((r) => { releaseA = r })
    const loaderA = async (p: PackPage): Promise<{ bytes: Uint8Array; sha256: string }> => { await gateA; return { bytes: new Uint8Array([1]), sha256: p.sha256 } }
    const pendingA = cache.request(manifest('soldier', [page('regular')]), loaderA, 'sceneA')
    const pendingB = cache.request(manifest('archer', [page('regular')]), okLoader, 'sceneB')
    cache.cancelScope('sceneA')
    releaseA()
    const [ra, rb] = await Promise.all([pendingA, pendingB])
    expect(ra.failure).toBe('cancelled')
    expect(rb.ok, 'sceneB unaffected by sceneA cancellation').toBe(true)
  })
})

describe('reference counting, eviction and budgets', () => {
  it('evicts released packs LRU-first and never evicts in-use ones', async () => {
    const caps = { ...CONTRACT_CAPS, retainedCache: 2 * 512 * 512 * 4 } // room for 2 packs
    const cache = new MotionAtlasCache(caps)
    const mk = async (id: string): Promise<void> => {
      const r = await cache.request(manifest(id, [page('regular')]), okLoader)
      expect(r.ok).toBe(true)
    }
    await mk('soldier')
    await mk('archer')
    await mk('xuchu')
    cache.acquire('soldier') // in use
    const evicted = cache.evict()
    expect(evicted, 'LRU released first (archer), in-use soldier kept').toEqual(['archer'])
    expect(cache.state('soldier')).toBe('ready')
    expect(cache.state('archer')).toBe('absent')
    cache.release('soldier')
    await mk('zhangfei') // 3 packs retained again -> evict the LRU released
    const evicted2 = cache.evict()
    // acquire() bumped soldier's recency earlier, so xuchu is the true LRU.
    expect(evicted2, 'LRU semantics: xuchu evicted, recently-used soldier kept').toEqual(['xuchu'])
    expect(cache.state('soldier'), 'recently-used released pack survives').toBe('ready')
    expect(cache.state('zhangfei')).toBe('ready')
  })

  it('all-11 real catalog: stage-transition eviction keeps retained <=128MiB, LRU unheld first, held stage survives', async () => {
    const cache = new MotionAtlasCache() // real CONTRACT_CAPS: 128 MiB retained
    const cap = CONTRACT_CAPS.retainedCache
    const retained = (): number => cache.budgetReport().retainedBytes
    const decodedOf = (kind: string): number => MOTION_PACKS[kind]!.pages.reduce((n, p) => n + p.width * p.height * 4, 0)
    const kinds = Object.keys(MOTION_PACKS)
    expect(kinds).toHaveLength(11)
    // The reviewer blocker is real pressure: every committed pack at its real
    // decoded size (page w*h*4 from the catalog) sums PAST the retained cap.
    const all11 = kinds.reduce((n, k) => n + decodedOf(k), 0)
    expect(all11).toBe(143_531_868)
    expect(all11).toBeGreaterThan(cap)
    // Real stage rosters (heroes rotate across runs so all 11 eventually
    // load; mooks + that stage's boss each time). Each held stage set alone
    // fits the cap, so eviction can always restore the bound.
    const stageA = ['guanyu', 'zhangfei', 'soldier', 'spearman', 'archer', 'lidian'] // stage1
    const stageB = ['zhaoyun', 'weiyan', 'soldier', 'spearman', 'archer', 'xiahoudun'] // stage2
    const stageC = ['huangzhong', 'guanyu', 'soldier', 'spearman', 'archer', 'xuchu'] // stage3
    for (const set of [stageA, stageB, stageC]) {
      expect(set.reduce((n, k) => n + decodedOf(k), 0), 'per-stage held set fits the cap').toBeLessThanOrEqual(cap)
    }
    // Runtime lifecycle at catalog level: entering a stage requests (warm
    // hits bump recency) and acquires a scene reference per pack; leaving
    // releases that scene's references and evicts (releaseScene). The
    // incoming scene already holds its packs when the outgoing release
    // evicts, so shared packs keep refcount > 0 across the transition.
    const enter = async (set: string[]): Promise<void> => {
      for (const kind of set) {
        expect((await cache.request(motionPackManifest(kind)!, okLoader)).ok, kind).toBe(true)
        cache.acquire(kind)
        expect(cache.record(kind)?.decodedBytes, `${kind} real decoded bytes`).toBe(decodedOf(kind))
      }
    }
    const exit = (set: string[]): string[] => {
      for (const kind of set) cache.release(kind)
      return cache.evict()
    }
    await enter(stageA)
    expect(retained()).toBeLessThanOrEqual(cap)
    await enter(stageB)
    expect(exit(stageA), 'A+B union still fits: nothing evicted yet').toEqual([])
    expect(retained()).toBe([...new Set([...stageA, ...stageB])].reduce((n, k) => n + decodedOf(k), 0))
    expect(retained()).toBeLessThanOrEqual(cap)
    await enter(stageC)
    expect(retained(), 'all-11 peak before the transition eviction').toBe(all11)
    // Outgoing B releases; eviction must drop >= all11-cap from UNHELD packs
    // LRU-first. Zhangfei is the LRU unheld pack (untouched since stage A;
    // mooks/guanyu were re-touched by B/C, B-only packs are newer), and his
    // 21,441,312 B alone restores the bound, so eviction stops there.
    expect(exit(stageB)).toEqual(['zhangfei'])
    expect(retained()).toBe(all11 - decodedOf('zhangfei'))
    expect(retained(), 'retained restored under the 128 MiB cap').toBeLessThanOrEqual(cap)
    expect(cache.state('zhangfei')).toBe('absent')
    for (const kind of stageC) expect(cache.state(kind), `held current-stage pack ${kind} survives`).toBe('ready')
    for (const kind of ['lidian', 'zhaoyun', 'weiyan', 'xiahoudun']) {
      expect(cache.state(kind), `newer unheld ${kind} survives: eviction stops at the cap`).toBe('ready')
    }
  })

  it('budget report separates network/source/decoded/GPU/cloned-canvas costs', async () => {
    const cache = new MotionAtlasCache()
    await cache.request(manifest('soldier', [page('regular', { bytes: 2048 })]), okLoader)
    const rep = cache.budgetReport()
    expect(rep.perFighterDecoded['soldier']).toBe(512 * 512 * 4)
    expect(rep.sourceBytes).toBe(2048)
    expect(rep.networkBytes).toBe(2048)
    expect(rep.clonedCanvasBytes).toBeGreaterThan(0)
    expect(rep.gpuBytes, 'one GPU upload per page plus display clones').toBe(512 * 512 * 4 + rep.clonedCanvasBytes)
    expect(rep.caps.decodedPerFighter).toBe(16 * 1024 * 1024)
    expect(rep.caps.retainedCache).toBe(128 * 1024 * 1024)
    expect(rep.caps.stageDownloads).toBe(12 * 1024 * 1024)
  })

  it('shared-atlas display pays zero cloned-canvas bytes and one GPU upload per page', async () => {
    const cache = new MotionAtlasCache()
    const m = { ...manifest('guanyu', [page('regular', { bytes: 2048 }), page('actions', { bytes: 2048, sha256: B })]), display: 'shared-atlas' as const }
    expect((await cache.request(m, okLoader)).ok).toBe(true)
    const rep = cache.budgetReport()
    expect(rep.clonedCanvasBytes, 'shared frames never clone a cell canvas').toBe(0)
    expect(rep.gpuBytes).toBe(2 * 512 * 512 * 4)
    expect(rep.networkBytes).toBe(2 * 2048)
    expect(rep.perFighterDecoded['guanyu']).toBe(2 * 512 * 512 * 4)
  })

  it('per-fighter decoded cap rejects an oversized pack at load', async () => {
    const cache = new MotionAtlasCache()
    const big = manifest('huge', [page('regular', { width: 2048, height: 2048 }), page('actions', { width: 2048, height: 2048, sha256: B })])
    const r = await cache.request(big, okLoader)
    expect(r.ok).toBe(false)
    expect(r.failure).toBe('unsupported')
    expect(r.detail).toContain('exceeds the per-fighter cap')
  })

  it('the load path honors a documented per-pack decoded exception', async () => {
    const cache = new MotionAtlasCache()
    const pages = [page('sheet', { width: 2004, height: 2026 }), page('actions', { width: 1693, height: 768, sha256: B })]
    const denied = await cache.request(manifest('big', pages), okLoader)
    expect(denied.ok).toBe(false)
    const cache2 = new MotionAtlasCache()
    const allowed = await cache2.request({ ...manifest('big', pages), decodedCap: 22 * 1024 * 1024 }, okLoader)
    expect(allowed.ok).toBe(true)
    expect(allowed.record?.decodedBytes).toBe(2004 * 2026 * 4 + 1693 * 768 * 4)
  })
})
