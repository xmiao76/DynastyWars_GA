/**
 * CMR-03: stage-aware bounded atlas loading and cache (core logic).
 *
 * Presentation-only. Phaser texture lifecycle and scene wiring sit above this
 * module (later attempts); everything here is loader-injected and unit-
 * testable without Phaser. Core clocks/AI are untouched.
 *
 * Guarantees:
 * - Publication is ATOMIC per fighter: all required pages load, verify and
 *   validate, or the whole fighter falls back to legacy rendering. A failure
 *   never clears other fighters' valid art.
 * - Concurrent requests for the same pack dedupe onto one in-flight load.
 * - Cancellation bumps a scope epoch; late callbacks from a cancelled scope
 *   are rejected as stale and cannot publish or mutate state.
 * - Reference counting protects in-use textures; eviction only takes released
 *   packs, least-recently-used first, and reports what it evicted.
 * - Budgets (contract caps, never raised here): pages <= 2048 on the long
 *   edge, decoded motion <= 16 MiB per humanoid, retained cache <= 128 MiB.
 *   The accounting separates network/source bytes, decoded RGBA, GPU and
 *   cloned-canvas estimates; legacy fallback cost is reported, not hidden.
 */

export interface PackPage {
  name: string
  sourceKey: string
  /** Source (download) bytes. */
  bytes: number
  /** Expected content signature (sha256 hex of the source bytes). */
  sha256: string
  width: number
  height: number
}

export type PackDisplay = 'shared-atlas' | 'cloned-cells'

export interface PackManifest {
  id: string
  revision: string
  pages: PackPage[]
  /** Clips this pack must cover (from the MotionProfile required set). */
  requiredClips: string[]
  /** Pinned clip-timing hash (e.g. the CMR-01 clipsHash). */
  clipsHash: string
  /**
   * Display strategy. CMR-03 shows shared atlas frames (trim/pivot restored
   * via the frame) instead of cloning every cell into its own canvas, so a
   * shared-atlas pack has ZERO cloned-canvas cost by construction.
   */
  display?: PackDisplay
  /**
   * Documented per-pack decoded-cap owner exception (bytes), replacing the
   * contract default for this pack at both enforcement points. Narrow:
   * packs without one use caps.decodedPerFighter unchanged.
   */
  decodedCap?: number
}

export interface PackRecord {
  id: string
  revision: string
  pages: PackPage[]
  decodedBytes: number
  /** Canvas memory held by per-cell display clones (0 for shared-atlas). */
  clonedCanvasBytes: number
  /** GPU texture bytes actually retained (pages + any display clones). */
  gpuBytes: number
  clipsHash: string
}

export type LoadFailure =
  | 'missing'
  | 'corrupt'
  | 'wrong-signature'
  | 'timeout'
  | 'unsupported'
  | 'cancelled'

export interface LoadResult {
  ok: boolean
  failure?: LoadFailure
  detail?: string
  record?: PackRecord
}

export type PageLoader = (page: PackPage) => Promise<{ bytes: Uint8Array; sha256: string }>

export interface BudgetCaps {
  pageLimit: number
  decodedPerFighter: number
  retainedCache: number
  stageDownloads: number
}

export const CONTRACT_CAPS: BudgetCaps = {
  pageLimit: 2048,
  decodedPerFighter: 16 * 1024 * 1024,
  retainedCache: 128 * 1024 * 1024,
  stageDownloads: 12 * 1024 * 1024,
}

/** Static manifest validation (no I/O). Errors name the exact violation. */
export function validateManifest(m: PackManifest, caps: BudgetCaps = CONTRACT_CAPS): string[] {
  const errors: string[] = []
  if (!m.id) errors.push('pack id missing')
  if (!m.revision) errors.push('pack revision missing')
  if (!m.clipsHash) errors.push('clips hash missing')
  if (m.requiredClips.length === 0) errors.push('pack provides no clips')
  const names = new Set<string>()
  let decoded = 0
  for (const p of m.pages) {
    if (!p.name || names.has(p.name)) errors.push(`duplicate/empty page name: ${p.name}`)
    names.add(p.name)
    if (!p.sourceKey) errors.push(`page ${p.name}: source key missing`)
    if (!Number.isFinite(p.bytes) || p.bytes <= 0) errors.push(`page ${p.name}: non-positive source bytes`)
    if (!/^[0-9a-f]{64}$/.test(p.sha256)) errors.push(`page ${p.name}: malformed signature`)
    if (!Number.isFinite(p.width) || !Number.isFinite(p.height) || p.width <= 0 || p.height <= 0) {
      errors.push(`page ${p.name}: invalid dimensions`)
      continue
    }
    if (p.width > caps.pageLimit || p.height > caps.pageLimit) {
      errors.push(`page ${p.name}: ${p.width}x${p.height} exceeds the ${caps.pageLimit}px page limit`)
    }
    decoded += p.width * p.height * 4
  }
  if (m.pages.length === 0) errors.push('pack has no pages')
  const cap = m.decodedCap ?? caps.decodedPerFighter
  if (decoded > cap) {
    errors.push(`pack ${m.id}: decoded ${decoded} bytes exceeds the per-fighter cap ${cap}`)
  }
  return errors
}

interface Slot {
  manifest: PackManifest
  state: 'idle' | 'loading' | 'ready' | 'failed'
  record?: PackRecord
  inFlight?: Promise<LoadResult>
  refcount: number
  lastUsed: number
  failure?: LoadFailure
  scope?: string
  startEpoch?: number
}

export interface BudgetReport {
  perFighterDecoded: Record<string, number>
  /** Bytes fetched over the network for published packs (== source bytes). */
  networkBytes: number
  retainedBytes: number
  /** Canvas memory held by per-cell display clones (0 for shared-atlas packs). */
  clonedCanvasBytes: number
  /** GPU texture memory retained: page uploads plus display clones. */
  gpuBytes: number
  sourceBytes: number
  legacyFallbackCost: number
  caps: BudgetCaps
}

/**
 * Bounded, reference-counted pack cache with atomic publication.
 */
export class MotionAtlasCache {
  private slots = new Map<string, Slot>()
  private epochs = new Map<string, number>()
  private clock = 0
  private legacyFallbackBytes = 0

  constructor(private caps: BudgetCaps = CONTRACT_CAPS) {}

  /** Current epoch for a scope (scene/stage); used to reject stale callbacks. */
  epoch(scope: string): number {
    return this.epochs.get(scope) ?? 0
  }

  /**
   * Cancel a scope: bump its epoch so late callbacks reject as 'cancelled',
   * and drop that scope's in-flight loads. Other scopes are untouched.
   */
  cancelScope(scope: string): void {
    const prev = this.epochs.get(scope) ?? 0
    this.epochs.set(scope, prev + 1)
    for (const slot of this.slots.values()) {
      if (slot.state === 'loading' && slot.scope === scope && slot.startEpoch === prev) {
        slot.state = 'idle'
        slot.inFlight = undefined
      }
    }
  }

  /** Register the legacy fallback cost so reports do not hide it. */
  noteLegacyFallback(sourceBytes: number): void {
    this.legacyFallbackBytes += sourceBytes
  }

  /**
   * Request a pack. Concurrent requests for the same id+revision share one
   * in-flight load (duplicate-safe). Publication is atomic: any page failure
   * rejects the whole fighter as legacy, leaving other fighters untouched.
   */
  request(manifest: PackManifest, load: PageLoader, scope = 'default'): Promise<LoadResult> {
    const key = `${manifest.id}@${manifest.revision}`
    const existing = this.slots.get(key)
    if (existing?.state === 'ready' && existing.record) {
      this.clock += 1
      existing.lastUsed = this.clock
      return Promise.resolve({ ok: true, record: existing.record })
    }
    if (existing?.state === 'loading' && existing.inFlight) return existing.inFlight

    const errors = validateManifest(manifest, this.caps)
    if (errors.length > 0) {
      this.slots.set(key, { manifest, state: 'failed', refcount: 0, lastUsed: 0, failure: 'unsupported' })
      return Promise.resolve({ ok: false, failure: 'unsupported', detail: errors.join('; ') })
    }

    const startEpoch = this.epoch(scope)
    const slot: Slot = { manifest, state: 'loading', refcount: existing?.refcount ?? 0, lastUsed: 0, scope, startEpoch }
    this.slots.set(key, slot)
    const run = (async (): Promise<LoadResult> => {
      try {
        const loaded: PackPage[] = []
        let decoded = 0
        let cloned = 0
        for (const page of manifest.pages) {
          const got = await load(page)
          if (this.epoch(scope) !== startEpoch) {
            slot.state = 'idle'
            return { ok: false, failure: 'cancelled', detail: `scope ${scope} cancelled during ${page.name}` }
          }
          if (!got || got.bytes.length === 0) {
            slot.state = 'failed'
            slot.failure = 'missing'
            return { ok: false, failure: 'missing', detail: `${manifest.id}:${page.name} missing` }
          }
          if (got.sha256 !== page.sha256) {
            slot.state = 'failed'
            slot.failure = 'wrong-signature'
            return { ok: false, failure: 'wrong-signature', detail: `${manifest.id}:${page.name} signature mismatch` }
          }
          decoded += page.width * page.height * 4
          // Shared-atlas display (CMR-03) holds NO per-cell display clones:
          // the frame's trim/pivot restores registration from the shared page.
          // The cloned-cells estimator (one page/9 cell per clip key) stays
          // for packs that still clone each displayed cell to its own canvas.
          if ((manifest.display ?? 'cloned-cells') === 'cloned-cells') {
            cloned += Math.ceil((page.width * page.height) / 9) * 4
          }
          loaded.push(page)
        }
        if (this.epoch(scope) !== startEpoch) {
          return { ok: false, failure: 'cancelled', detail: `scope ${scope} cancelled before publish` }
        }
        const cap = manifest.decodedCap ?? this.caps.decodedPerFighter
        if (decoded > cap) {
          slot.state = 'failed'
          slot.failure = 'unsupported'
          return { ok: false, failure: 'unsupported', detail: `${manifest.id} decoded ${decoded} exceeds cap` }
        }
        const record: PackRecord = {
          id: manifest.id,
          revision: manifest.revision,
          pages: loaded,
          decodedBytes: decoded,
          clonedCanvasBytes: cloned,
          // One GPU upload per page plus any display clones.
          gpuBytes: decoded + cloned,
          clipsHash: manifest.clipsHash,
        }
        slot.state = 'ready'
        slot.record = record
        this.clock += 1
        slot.lastUsed = this.clock
        return { ok: true, record }
      } catch (err) {
        if (this.epoch(scope) !== startEpoch) {
          return { ok: false, failure: 'cancelled', detail: `scope ${scope} cancelled` }
        }
        const msg = err instanceof Error ? err.message : String(err)
        // Loaders classify by message so the six LoadFailure classes stay
        // distinct: timeout, unsupported (no SHA-256/decoder), missing
        // (404/network), and everything else is corrupt content.
        const failure: LoadFailure = /timeout/i.test(msg)
          ? 'timeout'
          : /unsupported/i.test(msg)
            ? 'unsupported'
            : /missing/i.test(msg)
              ? 'missing'
              : 'corrupt'
        slot.state = 'failed'
        slot.failure = failure
        return { ok: false, failure, detail: msg }
      } finally {
        if (slot.inFlight !== undefined && this.epoch(scope) === startEpoch) slot.inFlight = undefined
      }
    })()
    slot.inFlight = run
    // Stale-result guard: a cancelled result must not leave the slot loading.
    return run.then((result) => {
      if (!result.ok && result.failure === 'cancelled' && slot.state === 'loading') {
        slot.state = 'idle'
      }
      return result
    })
  }

  /** Mark a pack in use; eviction skips refcount > 0. */
  acquire(id: string): void {
    const slot = this.find(id)
    if (slot) {
      slot.refcount += 1
      this.clock += 1
      slot.lastUsed = this.clock
    }
  }

  release(id: string): void {
    const slot = this.find(id)
    if (slot && slot.refcount > 0) slot.refcount -= 1
  }

  /**
   * Drop a pack's slot entirely so a later request may retry it. Used when
   * post-load publication rejects (corrupt decode/pixel signature): the pack
   * must not stay 'ready' with nothing installed.
   */
  invalidate(id: string): void {
    for (const [key, slot] of [...this.slots.entries()]) {
      if (slot.manifest.id === id) this.slots.delete(key)
    }
  }

  /** Evict released packs least-recently-used first until under the cap. */
  evict(): string[] {
    const evicted: string[] = []
    let retained = 0
    for (const slot of this.slots.values()) if (slot.state === 'ready') retained += slot.record?.decodedBytes ?? 0
    if (retained <= this.caps.retainedCache) return evicted
    const candidates = [...this.slots.entries()]
      .filter(([, s]) => s.state === 'ready' && s.refcount === 0)
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed)
    for (const [key, slot] of candidates) {
      if (retained <= this.caps.retainedCache) break
      retained -= slot.record?.decodedBytes ?? 0
      this.slots.delete(key)
      evicted.push(slot.manifest.id)
    }
    return evicted
  }

  state(id: string): 'idle' | 'loading' | 'ready' | 'failed' | 'absent' {
    return this.find(id)?.state ?? 'absent'
  }

  record(id: string): PackRecord | undefined {
    return this.find(id)?.record
  }

  budgetReport(): BudgetReport {
    const perFighterDecoded: Record<string, number> = {}
    let retained = 0
    let cloned = 0
    let gpu = 0
    let source = 0
    for (const slot of this.slots.values()) {
      if (slot.state === 'ready' && slot.record) {
        perFighterDecoded[slot.record.id] = slot.record.decodedBytes
        retained += slot.record.decodedBytes
        cloned += slot.record.clonedCanvasBytes
        gpu += slot.record.gpuBytes
        source += slot.manifest.pages.reduce((a, p) => a + p.bytes, 0)
      }
    }
    return {
      perFighterDecoded,
      // Network/source/decoded/GPU/cloned-canvas stay separate estimates: the
      // download is compressed source, decode is page RGBA, GPU is the single
      // per-page upload plus display clones, and cloned-canvas is the
      // per-cell clone memory a shared-atlas pack never pays.
      networkBytes: source,
      retainedBytes: retained,
      clonedCanvasBytes: cloned,
      gpuBytes: gpu,
      sourceBytes: source,
      legacyFallbackCost: this.legacyFallbackBytes,
      caps: this.caps,
    }
  }

  private find(id: string): Slot | undefined {
    for (const slot of this.slots.values()) if (slot.manifest.id === id) return slot
    return undefined
  }
}
