import { describe, expect, it } from 'vitest'
import {
  CONTRACT_CAPS,
  MotionAtlasCache,
  validateManifest,
  type PackManifest,
  type PackPage,
} from '../../src/game/adapters/motion-catalog'

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
  clipsHash: '513e9ff07266556d02db8a8213c2c07e989547575400fd1423dc5f8b811765a7',
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

    const timeout = await cache.request(manifest('lubu', [page('regular')]), async () => { throw new Error('load timeout after 10s') })
    expect(timeout.failure).toBe('timeout')

    const unsupported = await cache.request(manifest('big', [page('regular', { width: 4096, height: 4096 })]), okLoader)
    expect(unsupported.failure).toBe('unsupported')
    expect(unsupported.detail).toContain('exceeds the 2048px page limit')
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
    const pending = cache.request(manifest('soldier', [page('regular')]), loader, 'stage7')
    cache.cancelScope('stage7')
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
    await mk('lubu')
    cache.acquire('soldier') // in use
    const evicted = cache.evict()
    expect(evicted, 'LRU released first (archer), in-use soldier kept').toEqual(['archer'])
    expect(cache.state('soldier')).toBe('ready')
    expect(cache.state('archer')).toBe('absent')
    cache.release('soldier')
    await mk('zhangfei') // 3 packs retained again -> evict the LRU released
    const evicted2 = cache.evict()
    // acquire() bumped soldier's recency earlier, so lubu is the true LRU.
    expect(evicted2, 'LRU semantics: lubu evicted, recently-used soldier kept').toEqual(['lubu'])
    expect(cache.state('soldier'), 'recently-used released pack survives').toBe('ready')
    expect(cache.state('zhangfei')).toBe('ready')
  })

  it('budget report separates source, decoded, cloned-canvas and legacy costs', async () => {
    const cache = new MotionAtlasCache()
    await cache.request(manifest('soldier', [page('regular', { bytes: 2048 })]), okLoader)
    cache.noteLegacyFallback(4096)
    const rep = cache.budgetReport()
    expect(rep.perFighterDecoded['soldier']).toBe(512 * 512 * 4)
    expect(rep.sourceBytes).toBe(2048)
    expect(rep.clonedCanvasBytes).toBeGreaterThan(0)
    expect(rep.legacyFallbackCost, 'legacy fallback cost must not hide').toBe(4096)
    expect(rep.caps.decodedPerFighter).toBe(16 * 1024 * 1024)
    expect(rep.caps.retainedCache).toBe(128 * 1024 * 1024)
    expect(rep.caps.stageDownloads).toBe(12 * 1024 * 1024)
  })

  it('per-fighter decoded cap rejects an oversized pack at load', async () => {
    const cache = new MotionAtlasCache()
    const big = manifest('huge', [page('regular', { width: 2048, height: 2048 }), page('actions', { width: 2048, height: 2048, sha256: B })])
    const r = await cache.request(big, okLoader)
    expect(r.ok).toBe(false)
    expect(r.failure).toBe('unsupported')
    expect(r.detail).toContain('exceeds the per-fighter cap')
  })
})
