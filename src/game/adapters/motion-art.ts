import type Phaser from 'phaser'
import type { Entity } from '../../core/types'
import { STAGES, STAGE_ORDER } from '../../core/stage'
import type { ArtResources } from '../art/hero-resources'
import { imageSignature, signatureMatches } from '../art/image-signature'
import { guanyuClips, validMotionPack, type MotionArt, type MotionFrameCell, type MotionPackGeometry } from '../art/motion-clips'
import { soldierClips, validSoldierPack, motionFrameForSoldier } from '../art/motion-clips-soldier'
import { spearmanClips, validSpearmanPack, motionFrameForSpearman } from '../art/motion-clips-spearman'
import { archerClips, validArcherPack, motionFrameForArcher } from '../art/motion-clips-archer'
import { zhangfeiClips, validZhangfeiPack, motionFrameForZhangfei, ZHANGFEI_COLLAPSE_TAIL } from '../art/motion-clips-zhangfei'
import { zhaoyunClips, validZhaoyunPack, motionFrameForZhaoyun, ZHAOYUN_COLLAPSE_TAIL } from '../art/motion-clips-zhaoyun'
import { weiyanClips, validWeiyanPack, motionFrameForWeiyan, WEIYAN_COLLAPSE_TAIL } from '../art/motion-clips-weiyan'
import { huangzhongClips, validHuangzhongPack, motionFrameForHuangzhong, HUANGZHONG_COLLAPSE_TAIL } from '../art/motion-clips-huangzhong'
import { lidianClips, validLidianPack, motionFrameForLidian, LIDIAN_COLLAPSE_TAIL } from '../art/motion-clips-lidian'
import { advanceMotion, type MotionPlayback } from '../art/motion-player'
import { ART_RESOURCE_KEY, heroArtResources } from './hero-art'
import {
  CONTRACT_CAPS,
  MotionAtlasCache,
  type BudgetCaps,
  type BudgetReport,
  type LoadFailure,
  type PackManifest,
  type PackPage,
  type PageLoader,
} from './motion-catalog'
import { stageMotionScope } from './motion-scope'
import prepared from '../assets/motion/prepared.json'
import actions from '../assets/motion/actions-prepared.json'
import sheetUrl from '../assets/motion/guanyu-motion-sheet.png'
import actionSheetUrl from '../assets/motion/guanyu-actions-sheet.png'
import soldierPreparedJson from '../assets/motion/soldier-prepared.json'
import soldierSheetUrl from '../assets/motion/soldier-motion-sheet.png'
import spearmanPreparedJson from '../assets/motion/spearman-prepared.json'
import spearmanSheetUrl from '../assets/motion/spearman-motion-sheet.png'
import archerPreparedJson from '../assets/motion/archer-prepared.json'
import archerSheetUrl from '../assets/motion/archer-motion-sheet.png'
import zhangfeiPreparedJson from '../assets/motion/zhangfei-prepared.json'
import zhangfeiSheetUrl from '../assets/motion/zhangfei-motion-sheet.png'
import zhangfeiActionsSheetUrl from '../assets/motion/zhangfei-actions-sheet.png'
import zhaoyunPreparedJson from '../assets/motion/zhaoyun-prepared.json'
import zhaoyunSheetUrl from '../assets/motion/zhaoyun-motion-sheet.png'
import zhaoyunActionsSheetUrl from '../assets/motion/zhaoyun-actions-sheet.png'
import weiyanPreparedJson from '../assets/motion/weiyan-prepared.json'
import weiyanSheetUrl from '../assets/motion/weiyan-motion-sheet.png'
import weiyanActionsSheetUrl from '../assets/motion/weiyan-actions-sheet.png'
import huangzhongPreparedJson from '../assets/motion/huangzhong-prepared.json'
import huangzhongSheetUrl from '../assets/motion/huangzhong-motion-sheet.png'
import lidianPreparedJson from '../assets/motion/lidian-prepared.json'
import lidianSheetUrl from '../assets/motion/lidian-motion-sheet.png'

export interface MotionPrepared extends MotionPackGeometry {
  signatures: { sheet: string; actions: string }
  /** Single-atlas packs (enemies) carry no separate action page. */
  singlePage?: boolean
}

/** Texture key of a fighter's regular motion atlas page (shared frames). */
export function motionTextureKeys(kind: string): { sheet: string; actions: string } {
  return { sheet: `motion-source:${kind}`, actions: `motion-actions:${kind}` }
}

/** Display identity of one motion frame: `entity:<kind>:motion:<clip>:<idx>`. */
export function motionFrameId(kind: string, frame: string): string {
  return `entity:${kind}:motion:${frame}`
}

export const MOTION_SOURCE_KEY = motionTextureKeys('guanyu').sheet
export const ACTION_SOURCE_KEY = motionTextureKeys('guanyu').actions
/** Pack revision for the current Guan Yu prepared data (attempt-2 repack). */
export const MOTION_REVISION = 'motion-2'
/** Pinned clip-timing hash (CMR-01 reference, re-pinned by the repack test). */
export const MOTION_CLIPS_HASH = '513e9ff07266556d02db8a8213c2c07e989547575400fd1423dc5f8b811765a7'

export function motionEnabled(search = typeof window === 'undefined' ? '' : window.location.search): boolean {
  return new URLSearchParams(search).get('motion') === '1'
}

export function motionPreparedRecord(): MotionPrepared {
  return { ...prepared.guanyu, id: 'guanyu', revision: MOTION_REVISION, actionSheet: actions.sheet,
    frames: { ...prepared.guanyu.frames, ...actions.frames } as MotionArt['frames'],
    signatures: { sheet: prepared.guanyu.signatures.sheet, actions: actions.signatures.sheet } }
}

/** Wei Soldier pack record (scripts/emit-soldier-runtime.mjs output). */
export function soldierPreparedRecord(): MotionPrepared {
  return soldierPreparedJson as unknown as MotionPrepared
}

/** Wei Spearman pack record (scripts/emit-spearman-runtime.mjs output). */
export function spearmanPreparedRecord(): MotionPrepared {
  return spearmanPreparedJson as unknown as MotionPrepared
}

/** Wei Archer pack record (scripts/emit-archer-runtime.mjs output). */
export function archerPreparedRecord(): MotionPrepared {
  return archerPreparedJson as unknown as MotionPrepared
}

/** Zhang Fei pack record (scripts/emit-zhangfei-runtime.mjs output). */
export function zhangfeiPreparedRecord(): MotionPrepared {
  return zhangfeiPreparedJson as unknown as MotionPrepared
}

/** Zhao Yun pack record (scripts/emit-zhaoyun-runtime.mjs output). */
export function zhaoyunPreparedRecord(): MotionPrepared {
  return zhaoyunPreparedJson as unknown as MotionPrepared
}

/** Wei Yan pack record (scripts/emit-weiyan-runtime.mjs output). */
export function weiyanPreparedRecord(): MotionPrepared {
  return weiyanPreparedJson as unknown as MotionPrepared
}

/** Huang Zhong pack record (scripts/emit-huangzhong-runtime.mjs output). */
export function huangzhongPreparedRecord(): MotionPrepared {
  return huangzhongPreparedJson as unknown as MotionPrepared
}

/** Li Dian pack record (scripts/emit-lidian-runtime.mjs output). */
export function lidianPreparedRecord(): MotionPrepared {
  return lidianPreparedJson as unknown as MotionPrepared
}

// ---------------------------------------------------------------------------
// Pack catalog. Every fighter with motion art is listed here; kinds outside
// the catalog never request anything (no all-cast downloads).
// ---------------------------------------------------------------------------

export interface MotionPackDef {
  id: string
  revision: string
  pages: PackPage[]
  /** Page name -> download URL (Vite asset URL). */
  url: Record<string, string>
  meta: () => MotionPrepared
  clips: () => MotionArt['clips']
}

const GUANYU_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: MOTION_SOURCE_KEY, bytes: 1782790, sha256: 'f15e3ac757eaa4ade2b2a0afca1a7e891f5272f58d3c82ee281eb50531bad3b2', width: 1935, height: 903 },
  { name: 'actions', sourceKey: ACTION_SOURCE_KEY, bytes: 2545709, sha256: 'ce7f7ca0c5157715c7c8a75d71ba13837d1cb96e65ebf7da933e8df4fbbe2cbd', width: 2027, height: 1055 },
]

/** Wei Soldier single atlas page (CMR-06B; scripts/emit-soldier-runtime.mjs). */
const SOLDIER_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: motionTextureKeys('soldier').sheet, bytes: 1786372, sha256: '55f3300dcb8acfcf602d08dd57d63d8d048c45b7beb5e96dbb4aa2cf369fd2f1', width: 1984, height: 1142 },
]

/** Wei Spearman single atlas page (CMR-07B; scripts/emit-spearman-runtime.mjs). */
const SPEARMAN_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: motionTextureKeys('spearman').sheet, bytes: 1352663, sha256: '5181a2d77a1d37ae519f4d8f9b752672769d0536c3c05f2d5f526856b0952ad4', width: 1835, height: 866 },
]

/** Wei Archer single atlas page (CMR-08B; scripts/emit-archer-runtime.mjs). */
const ARCHER_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: motionTextureKeys('archer').sheet, bytes: 1830948, sha256: '96cc42fa4f77b7f33c5b1de5ae04e3beaa6683184befb33649d472f10b948a4d', width: 2045, height: 924 },
]

/** Zhang Fei regular + action atlas pages (CMR-09B; scripts/emit-zhangfei-runtime.mjs). */
const ZHANGFEI_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: motionTextureKeys('zhangfei').sheet, bytes: 3007913, sha256: 'e296de06d6ca9f1b7d6615aaf267e3e16adf8b3f8d43625f833c11521bed92e3', width: 2004, height: 2026 },
  { name: 'actions', sourceKey: motionTextureKeys('zhangfei').actions, bytes: 1028932, sha256: 'ca8104eb1bdf977ace396d309053de2e881d92a12cf5b4faaf04a49de2ad114a', width: 1693, height: 768 },
]

/** Zhao Yun regular + action atlas pages (CMR-10B; scripts/emit-zhaoyun-runtime.mjs). */
const ZHAOYUN_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: motionTextureKeys('zhaoyun').sheet, bytes: 3241974, sha256: 'b4f2f4666b29cae2ea35573a20bbff6c0e4742fbcb8fe457eddb951bae52e651', width: 2030, height: 1847 },
  { name: 'actions', sourceKey: motionTextureKeys('zhaoyun').actions, bytes: 1092445, sha256: 'd3569980ad56922f4e76ac18bbecd9f17fa0fbd3c0a105cbcd3e640225077d4e', width: 1845, height: 699 },
]

/** Wei Yan regular + action atlas pages (CMR-11B; scripts/emit-weiyan-runtime.mjs). */
const WEIYAN_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: motionTextureKeys('weiyan').sheet, bytes: 3173250, sha256: '636c522290ae97d99631fac12fa387a306b7d60643bfb21c82da38dd47792a86', width: 1948, height: 1877 },
  { name: 'actions', sourceKey: motionTextureKeys('weiyan').actions, bytes: 146166, sha256: '5c841688f2977468e0d10ae19d57a72ce18db15a008aaa83ac0b3697781b4577', width: 618, height: 199 },
]

/** Huang Zhong single atlas page (CMR-12B; scripts/emit-huangzhong-runtime.mjs). */
const HUANGZHONG_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: motionTextureKeys('huangzhong').sheet, bytes: 3643905, sha256: '0087d9689cf80ccca2f2d723f48106b7af8d1b5b7ccff1884b9c7ed1c87c3cfb', width: 1988, height: 1594 },
]

/** Li Dian single atlas page (CMR-13B; scripts/emit-lidian-runtime.mjs). */
const LIDIAN_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: motionTextureKeys('lidian').sheet, bytes: 2102566, sha256: 'fb5f026f919f2e6aa775939706b95deb892c7eb2f33b1626c1be23dcee0e81f7', width: 2011, height: 1646 },
]

export const MOTION_PACKS: Record<string, MotionPackDef> = {
  guanyu: {
    id: 'guanyu',
    revision: MOTION_REVISION,
    pages: GUANYU_PAGES,
    url: { sheet: sheetUrl, actions: actionSheetUrl },
    meta: motionPreparedRecord,
    clips: guanyuClips,
  },
  soldier: {
    id: 'soldier',
    revision: 'soldier-1',
    pages: SOLDIER_PAGES,
    url: { sheet: soldierSheetUrl, actions: soldierSheetUrl },
    meta: soldierPreparedRecord,
    clips: soldierClips,
  },
  spearman: {
    id: 'spearman',
    revision: 'spearman-1',
    pages: SPEARMAN_PAGES,
    url: { sheet: spearmanSheetUrl, actions: spearmanSheetUrl },
    meta: spearmanPreparedRecord,
    clips: spearmanClips,
  },
  archer: {
    id: 'archer',
    revision: 'archer-1',
    pages: ARCHER_PAGES,
    url: { sheet: archerSheetUrl, actions: archerSheetUrl },
    meta: archerPreparedRecord,
    clips: archerClips,
  },
  zhangfei: {
    id: 'zhangfei',
    revision: 'zhangfei-1',
    pages: ZHANGFEI_PAGES,
    url: { sheet: zhangfeiSheetUrl, actions: zhangfeiActionsSheetUrl },
    meta: zhangfeiPreparedRecord,
    clips: zhangfeiClips,
  },
  zhaoyun: {
    id: 'zhaoyun',
    revision: 'zhaoyun-1',
    pages: ZHAOYUN_PAGES,
    url: { sheet: zhaoyunSheetUrl, actions: zhaoyunActionsSheetUrl },
    meta: zhaoyunPreparedRecord,
    clips: zhaoyunClips,
  },
  weiyan: {
    id: 'weiyan',
    revision: 'weiyan-2',
    pages: WEIYAN_PAGES,
    url: { sheet: weiyanSheetUrl, actions: weiyanActionsSheetUrl },
    meta: weiyanPreparedRecord,
    clips: weiyanClips,
  },
  huangzhong: {
    id: 'huangzhong',
    revision: 'huangzhong-1',
    pages: HUANGZHONG_PAGES,
    url: { sheet: huangzhongSheetUrl, actions: huangzhongSheetUrl },
    meta: huangzhongPreparedRecord,
    clips: huangzhongClips,
  },
  lidian: {
    id: 'lidian',
    revision: 'lidian-1',
    pages: LIDIAN_PAGES,
    url: { sheet: lidianSheetUrl, actions: lidianSheetUrl },
    meta: lidianPreparedRecord,
    clips: lidianClips,
  },
}

export function motionPackManifest(kind: string): PackManifest | undefined {
  const def = MOTION_PACKS[kind]
  if (!def) return undefined
  const manifest: PackManifest = {
    id: def.id,
    revision: def.revision,
    pages: def.pages,
    requiredClips: Object.keys(def.clips()),
    clipsHash: MOTION_CLIPS_HASH,
    display: 'shared-atlas',
  }
  const cap = def.meta().decodedCapBytes
  if (cap !== undefined) manifest.decodedCap = cap
  return manifest
}

/** Catalogued packs keyed by kind for the stage-scope policy. */
export function motionPackSourceBytes(): Record<string, { sourceBytes: number }> {
  const out: Record<string, { sourceBytes: number }> = {}
  for (const [kind, def] of Object.entries(MOTION_PACKS)) {
    out[kind] = { sourceBytes: def.pages.reduce((a, p) => a + p.bytes, 0) }
  }
  return out
}

// ---------------------------------------------------------------------------
// I/O: page fetch + SHA-256 + decode. Injectable so every load outcome is
// unit-testable without a network.
// ---------------------------------------------------------------------------

export interface MotionIo {
  fetchBytes(url: string, signal: AbortSignal): Promise<Uint8Array>
  sha256(bytes: Uint8Array): Promise<string>
  decode(bytes: Uint8Array): Promise<CanvasImageSource & { width: number; height: number }>
  makeCtx?: (w: number, h: number) => CanvasRenderingContext2D | null
  /** Per-page deadline (contract: bounded). */
  pageTimeoutMs: number
  /** Whole stage-entry deadline; on expiry the stage continues on legacy. */
  stageTimeoutMs: number
}

export function browserMotionIo(): MotionIo {
  return {
    fetchBytes: async (url, signal) => {
      try {
        const res = await fetch(url, { signal })
        if (!res.ok) return new Uint8Array(0) // missing
        return new Uint8Array(await res.arrayBuffer())
      } catch (err) {
        if (signal.aborted) throw new Error(`timeout: ${url}`, { cause: err })
        throw new Error(`missing: network error for ${url}`, { cause: err })
      }
    },
    sha256: async (bytes) => {
      const subtle = globalThis.crypto?.subtle
      if (!subtle) throw new Error('unsupported: SHA-256 requires a secure context')
      const digest = await subtle.digest('SHA-256', bytes as unknown as BufferSource)
      return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
    },
    decode: (bytes) => createImageBitmap(new Blob([bytes as unknown as BlobPart], { type: 'image/png' })),
    pageTimeoutMs: 8000,
    stageTimeoutMs: 12000,
  }
}

function classifyError(err: unknown): LoadFailure {
  const msg = err instanceof Error ? err.message : String(err)
  return /timeout/i.test(msg) ? 'timeout'
    : /unsupported/i.test(msg) ? 'unsupported'
    : /missing/i.test(msg) ? 'missing'
    : /wrong-signature/i.test(msg) ? 'wrong-signature'
    : 'corrupt'
}

function byteKey(kind: string, page: string): string {
  return `${kind}:${page}`
}

// ---------------------------------------------------------------------------
// Runtime: stage-scoped, bounded, deduplicated loading with atomic per-fighter
// publication, refcounted release/eviction and stale-callback rejection.
// ---------------------------------------------------------------------------

export interface MotionStageRequest {
  hero: string
  secondPlayer?: string | null
  stageKinds: string[]
  futureKinds: string[]
}

export interface MotionStageReport {
  /** Kinds the stage-entry policy asked for (immediate scope). */
  requested: string[]
  /** Kinds published with fully verified motion art. */
  published: string[]
  /** Kinds that fell back to legacy art, with the failure class. */
  legacy: Array<{ kind: string; failure: LoadFailure }>
  /** Best-effort prefetch kicked off after the stage entered simulation. */
  prefetch: string[]
}

export type MotionLoadOutcome = { ok: true } | { ok: false; failure: LoadFailure }

export class MotionRuntime {
  private cache: MotionAtlasCache
  private aborts = new Map<string, AbortController>()
  private held = new Map<Phaser.Scene, Set<string>>()
  private pendingBytes = new Map<string, Uint8Array>()
  private inflight = new Set<Promise<unknown>>()
  private installing = new Map<string, Promise<MotionLoadOutcome>>()

  constructor(private io: MotionIo = browserMotionIo(), caps?: BudgetCaps) {
    this.cache = new MotionAtlasCache(caps)
  }

  budget(): BudgetReport {
    return this.cache.budgetReport()
  }

  state(kind: string): 'idle' | 'loading' | 'ready' | 'failed' | 'absent' {
    return this.cache.state(kind)
  }

  /** Await every tracked load (including fire-and-forget prefetch). */
  async settle(): Promise<void> {
    while (this.inflight.size > 0) await Promise.allSettled([...this.inflight])
  }

  /**
   * Stage entry: prepare the immediate scope before the stage/actor enters
   * simulation, bounded by the stage deadline. A timeout cancels the loads and
   * the stage continues with legacy art - ceilings are never raised.
   */
  async prepareStage(scene: Phaser.Scene, req: MotionStageRequest): Promise<MotionStageReport> {
    const scope = stageMotionScope({
      hero: req.hero,
      secondPlayer: req.secondPlayer ?? null,
      stageKinds: req.stageKinds,
      futureKinds: req.futureKinds,
      packs: motionPackSourceBytes(),
      budgetBytes: CONTRACT_CAPS.stageDownloads,
    })
    const report: MotionStageReport = { requested: [...scope.immediate], published: [], legacy: [], prefetch: [...scope.prefetch] }
    let aborted = false
    const work = (async (): Promise<void> => {
      for (const kind of scope.immediate) {
        const outcome = await this.loadKind(scene, kind)
        if (aborted) return // the stage deadline fired: caller already reported
        if (outcome.ok) report.published.push(kind)
        else report.legacy.push({ kind, failure: outcome.failure })
      }
    })()
    const finished = await raceTimeout(this.track(work), this.io.stageTimeoutMs)
    if (!finished) {
      aborted = true
      this.cancelLoads()
      for (const kind of scope.immediate) {
        if (!report.published.includes(kind) && !report.legacy.some((l) => l.kind === kind)) {
          report.legacy.push({ kind, failure: 'timeout' })
        }
      }
    }
    // Prefetch is best effort: it never blocks the stage and its failure is
    // invisible to the stage (that kind simply renders legacy when it appears).
    for (const kind of scope.prefetch) {
      void this.track(this.loadKind(scene, kind)).catch(() => undefined)
    }
    return report
  }

  /**
   * Load + publish one kind's pack atomically. Any failure leaves that kind on
   * legacy art and never touches other fighters' published art. Concurrent
   * callers (stage entry + co-op join) share one install.
   */
  async loadKind(scene: Phaser.Scene, kind: string): Promise<MotionLoadOutcome> {
    const existing = this.installing.get(kind)
    if (existing) return existing
    const run = this.loadKindInner(scene, kind)
    this.installing.set(kind, run)
    try {
      return await run
    } finally {
      this.installing.delete(kind)
    }
  }

  private async loadKindInner(scene: Phaser.Scene, kind: string): Promise<MotionLoadOutcome> {
    const def = MOTION_PACKS[kind]
    const manifest = motionPackManifest(kind)
    if (!def || !manifest) return { ok: false, failure: 'unsupported' }
    if (motionKindReady(scene, kind) && this.cache.state(kind) === 'ready') {
      this.markHeld(scene, kind) // warm cache on a new stage entry re-acquires
      return { ok: true }
    }
    const startEpoch = this.cache.epoch('stage')
    const res = await this.track(this.cache.request(manifest, this.pageLoader(kind, def), 'stage'))
    if (!res.ok) return { ok: false, failure: res.failure ?? 'corrupt' }
    if (this.cache.epoch('stage') !== startEpoch) return { ok: false, failure: 'cancelled' }
    try {
      await this.install(scene, kind, def)
      const art = publishMotionArtRecord(scene, def.meta(), this.io.makeCtx, def.clips())
      if (!art) throw new Error(`wrong-signature: pixel signature mismatch for ${kind}`)
      this.markHeld(scene, kind)
      return { ok: true }
    } catch (err) {
      this.uninstall(scene, kind)
      this.cache.invalidate(kind)
      return { ok: false, failure: classifyError(err) }
    } finally {
      for (const page of def.pages) this.pendingBytes.delete(byteKey(kind, page.name))
    }
  }

  /** Scene exit: drop references, reject late loads, evict released packs. */
  releaseScene(scene: Phaser.Scene): void {
    const held = this.held.get(scene)
    if (held) {
      for (const kind of held) this.cache.release(kind)
      this.held.delete(scene)
    }
    for (const id of this.cache.evict()) this.uninstall(scene, id)
  }

  /** Cancel every in-flight load (scene exit/restart); stale callbacks reject. */
  cancelLoads(): void {
    for (const ac of this.aborts.values()) ac.abort()
    this.aborts.clear()
    this.pendingBytes.clear()
    this.cache.cancelScope('stage')
  }

  private track<T>(work: Promise<T>): Promise<T> {
    this.inflight.add(work)
    void work.finally(() => this.inflight.delete(work)).catch(() => undefined)
    return work
  }

  /** Take/refresh a scene reference on a pack so eviction cannot retire it. */
  private markHeld(scene: Phaser.Scene, kind: string): void {
    let held = this.held.get(scene)
    if (!held) { held = new Set(); this.held.set(scene, held) }
    if (!held.has(kind)) {
      this.cache.acquire(kind)
      held.add(kind)
    }
  }

  private pageLoader(kind: string, def: MotionPackDef): PageLoader {
    return async (page) => {
      const key = byteKey(kind, page.name)
      const ac = new AbortController()
      this.aborts.set(key, ac)
      const timer = setTimeout(() => ac.abort(), this.io.pageTimeoutMs)
      try {
        const bytes = await this.io.fetchBytes(def.url[page.name] ?? '', ac.signal)
        const sha256 = await this.io.sha256(bytes)
        if (bytes.length > 0) this.pendingBytes.set(key, bytes)
        return { bytes, sha256 }
      } finally {
        clearTimeout(timer)
        this.aborts.delete(key)
      }
    }
  }

  private async install(scene: Phaser.Scene, kind: string, def: MotionPackDef): Promise<void> {
    for (const page of def.pages) {
      const bytes = this.pendingBytes.get(byteKey(kind, page.name))
      if (!bytes?.length) throw new Error(`missing: no bytes for ${page.name}`)
      const image = await this.io.decode(bytes)
      if (image.width !== page.width || image.height !== page.height) {
        throw new Error(`corrupt: ${page.name} decoded ${image.width}x${image.height}, expected ${page.width}x${page.height}`)
      }
      if (scene.textures.exists(page.sourceKey)) scene.textures.remove(page.sourceKey)
      scene.textures.addImage(page.sourceKey, image as unknown as HTMLImageElement)
    }
    installMotionFrames(scene, kind, def.meta())
  }

  private uninstall(scene: Phaser.Scene, kind: string): void {
    for (const key of Object.values(motionTextureKeys(kind))) {
      if (scene.textures.exists(key)) scene.textures.remove(key)
    }
    unpublishMotionKind(scene, kind)
  }
}

function raceTimeout(work: Promise<void>, ms: number): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), ms)
  })
  const done = work.then(() => true)
  return Promise.race([done, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer)
  })
}

let sharedRuntime: MotionRuntime | undefined

/** Process-wide runtime (GameScene); tests construct their own instances. */
export function motionRuntime(io?: MotionIo): MotionRuntime {
  if (!sharedRuntime || io) sharedRuntime = new MotionRuntime(io)
  return sharedRuntime
}

// ---------------------------------------------------------------------------
// Stage request derivation (pre-sim): which kinds may request packs here.
// ---------------------------------------------------------------------------

function stageSpawnKinds(stageId: string): string[] {
  const stage = STAGES[stageId]
  if (!stage) return []
  const kinds: string[] = []
  const push = (kind: string | undefined | null): void => {
    if (kind && !kinds.includes(kind)) kinds.push(kind)
  }
  for (const wave of stage.waves) for (const spawn of wave.spawns) push(spawn.kind)
  for (const prop of stage.props) push(prop.kind)
  push(stage.bossKind)
  for (const kind of ['arrow', 'meat', 'sword', 'crate']) push(kind)
  return kinds
}

export function motionStageRequest(stageId: string, hero: string, secondPlayer?: string | null): MotionStageRequest {
  const stageKinds = stageSpawnKinds(stageId)
  const futureKinds: string[] = []
  const order = STAGE_ORDER as readonly string[]
  const at = order.indexOf(stageId)
  for (const later of order.slice(at < 0 ? 0 : at + 1)) {
    for (const kind of stageSpawnKinds(later)) {
      if (!stageKinds.includes(kind) && !futureKinds.includes(kind)) futureKinds.push(kind)
    }
  }
  return { hero, secondPlayer: secondPlayer ?? null, stageKinds, futureKinds }
}

// ---------------------------------------------------------------------------
// Verification + publication (atomic per fighter).
// ---------------------------------------------------------------------------

function defaultCtx(w: number, h: number): CanvasRenderingContext2D | null {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  return cv.getContext('2d', { willReadFrequently: true })
}

/** Register shared atlas frames with trim/pivot restoration (CMR-03). */
export function installMotionFrames(scene: Phaser.Scene, kind: string, meta: MotionPrepared): void {
  const keys = motionTextureKeys(kind)
  for (const [name, cell] of Object.entries(meta.frames) as Array<[string, MotionFrameCell]>) {
    const textureKey = cell.sheet === 'actions' ? keys.actions : keys.sheet
    const tex = scene.textures.exists(textureKey) ? scene.textures.get(textureKey) : undefined
    if (!tex) continue
    const id = motionFrameId(kind, name)
    if (tex.has(id)) continue
    const frame = tex.add(id, 0, cell.x, cell.y, cell.w, cell.h)
    if (!frame) continue
    const sw = cell.srcW ?? cell.w
    const sh = cell.srcH ?? cell.h
    // The frame draws at (trimX, trimY) inside the full srcW x srcH cell -
    // exactly where the old per-cell clone painted the trimmed rect - so
    // displayed RGBA, scale, pivots and registration are unchanged.
    if (cell.srcW !== undefined || cell.srcH !== undefined) {
      frame.setTrim(sw, sh, cell.trimX ?? 0, cell.trimY ?? 0, cell.w, cell.h)
    }
  }
}

/** Remove a kind's motion art from the registry (other kinds untouched). */
export function unpublishMotionKind(scene: Phaser.Scene, kind: string): void {
  const prev = scene.registry.get(ART_RESOURCE_KEY) as ArtResources | undefined
  if (!prev?.motions?.[kind]) return
  const motions: Partial<Record<string, MotionArt>> = { ...prev.motions }
  delete motions[kind]
  scene.registry.set(ART_RESOURCE_KEY, { ...prev, motions })
}

/** Both atlases (or the single atlas of an enemy pack) and all states are
 *  verified before any fighter motion publishes. */
export function publishMotionArtRecord(
  scene: Phaser.Scene,
  meta: MotionPrepared,
  makeCtx: (w: number, h: number) => CanvasRenderingContext2D | null = defaultCtx,
  clips?: MotionArt['clips'],
): MotionArt | undefined {
  const prev = (scene.registry.get(ART_RESOURCE_KEY) as ArtResources | undefined) ?? { heroes: {} }
  // A rejection drops ONLY this fighter's motion art: other fighters' valid
  // art (and the hero/body art) must survive untouched.
  const reject = (): undefined => {
    const motions: Partial<Record<string, MotionArt>> = { ...prev.motions }
    delete motions[meta.id]
    scene.registry.set(ART_RESOURCE_KEY, { ...prev, motions })
    return undefined
  }
  const valid = meta.id === 'soldier' ? validSoldierPack(meta) : meta.id === 'spearman' ? validSpearmanPack(meta) : meta.id === 'archer' ? validArcherPack(meta) : meta.id === 'zhangfei' ? validZhangfeiPack(meta) : meta.id === 'zhaoyun' ? validZhaoyunPack(meta) : meta.id === 'weiyan' ? validWeiyanPack(meta) : meta.id === 'huangzhong' ? validHuangzhongPack(meta) : meta.id === 'lidian' ? validLidianPack(meta) : validMotionPack(meta)
  if (!valid) return reject()
  const clipTable = clips ?? (meta.id === 'soldier' ? soldierClips() : meta.id === 'spearman' ? spearmanClips() : meta.id === 'archer' ? archerClips() : meta.id === 'zhangfei' ? zhangfeiClips() : meta.id === 'zhaoyun' ? zhaoyunClips() : meta.id === 'weiyan' ? weiyanClips() : meta.id === 'huangzhong' ? huangzhongClips() : meta.id === 'lidian' ? lidianClips() : guanyuClips())
  const keys = motionTextureKeys(meta.id)
  const images: CanvasImageSource[] = []
  const pageChecks: Array<[string, { width: number; height: number }, string]> = [[keys.sheet, meta.sheet, meta.signatures.sheet]]
  if (!meta.singlePage) pageChecks.push([keys.actions, meta.actionSheet, meta.signatures.actions])
  for (const [key, size, signature] of pageChecks) {
    if (!scene.textures.exists(key)) return reject()
    const src = scene.textures.get(key).getSourceImage() as unknown as CanvasImageSource & { width: number; height: number }
    if (src.width !== size.width || src.height !== size.height) return reject()
    try {
      const g = makeCtx(src.width, src.height)
      if (!g) return reject()
      g.drawImage(src, 0, 0)
      if (!signatureMatches(imageSignature(g.getImageData(0, 0, src.width, src.height)), signature)) return reject()
    } catch { return reject() }
    images.push(src)
  }
  const art: MotionArt = { ...meta, sheet: images[0]!, actionSheet: images[1] ?? images[0]!, clips: clipTable, frameDispatch: meta.id === 'soldier' ? motionFrameForSoldier : meta.id === 'spearman' ? motionFrameForSpearman : meta.id === 'archer' ? motionFrameForArcher : meta.id === 'zhangfei' ? motionFrameForZhangfei : meta.id === 'zhaoyun' ? motionFrameForZhaoyun : meta.id === 'weiyan' ? motionFrameForWeiyan : meta.id === 'huangzhong' ? motionFrameForHuangzhong : meta.id === 'lidian' ? motionFrameForLidian : undefined, ...(meta.id === 'zhangfei' ? { collapseTail: ZHANGFEI_COLLAPSE_TAIL } : {}), ...(meta.id === 'zhaoyun' ? { collapseTail: ZHAOYUN_COLLAPSE_TAIL } : {}), ...(meta.id === 'weiyan' ? { collapseTail: WEIYAN_COLLAPSE_TAIL } : {}), ...(meta.id === 'huangzhong' ? { collapseTail: HUANGZHONG_COLLAPSE_TAIL } : {}), ...(meta.id === 'lidian' ? { collapseTail: LIDIAN_COLLAPSE_TAIL } : {}) }
  scene.registry.set(ART_RESOURCE_KEY, { ...prev, motions: { ...prev.motions, [meta.id]: art } } satisfies ArtResources)
  return art
}

/** Whether a kind's motion art is published and ready for display. */
export function motionKindReady(scene: Phaser.Scene, kind: string): boolean {
  return heroArtResources(scene)?.motions?.[kind] !== undefined
}

// ---------------------------------------------------------------------------
// Display: shared atlas frames (no per-cell canvas clones).
// ---------------------------------------------------------------------------

export interface MotionFrameRef {
  texture: string
  frame: string
}

/** Presentation history stays per scene/entity; no wall-clock frame queue. */
const playback = new WeakMap<Phaser.Scene, Map<number, MotionPlayback>>()
export function clearMotionPlayback(scene: Phaser.Scene): void { playback.delete(scene) }
export function forgetMotionEntity(scene: Phaser.Scene, id: number): void { playback.get(scene)?.delete(id) }
export function motionVisualLift(scene: Phaser.Scene, entity: Entity): number {
  const art = heroArtResources(scene)?.motions?.[entity.kind], prev = playback.get(scene)?.get(entity.id)
  if (!art || !prev?.fallLift) return 0
  return prev.fallLift.height * Math.max(0, 1 - (entity.stateTick - prev.fallLift.sinceStateTick) / 10)
}

/**
 * Resolve the entity's current motion frame as a shared atlas frame reference.
 * The frame's trim/pivot restores the old per-cell clone placement exactly;
 * when anything is missing the caller falls back to legacy art.
 */
export function ensureMotionFrame(scene: Phaser.Scene, entity: Entity): MotionFrameRef | undefined {
  const art = heroArtResources(scene)?.motions?.[entity.kind]
  if (!art) return undefined
  let state = playback.get(scene)
  if (!state) { state = new Map(); playback.set(scene, state) }
  const bridge = scene.registry.get('bridge') as { sim?: { tick: number } } | undefined
  const tick = bridge?.sim?.tick ?? entity.stateTick
  const sample = advanceMotion(art, entity, tick, state.get(entity.id))
  state.set(entity.id, sample.playback)
  const cell = art.frames[sample.frame]
  if (!cell) return undefined
  const keys = motionTextureKeys(entity.kind)
  const texture = cell.sheet === 'actions' ? keys.actions : keys.sheet
  const frame = motionFrameId(entity.kind, sample.frame)
  const tex = scene.textures.exists(texture) ? scene.textures.get(texture) : undefined
  if (!tex || !tex.has(frame)) return undefined
  return { texture, frame }
}
