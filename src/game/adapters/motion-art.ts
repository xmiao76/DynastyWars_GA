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
import { xiahoudunClips, validXiahoudunPack, motionFrameForXiahoudun, XIAHOUDUN_COLLAPSE_TAIL } from '../art/motion-clips-xiahoudun'
import { xuchuClips, validXuchuPack, motionFrameForXuchu, XUCHU_COLLAPSE_TAIL } from '../art/motion-clips-xuchu'
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
import { kindsDueByTick, stageMotionScope, type SpawnScheduleEntry, type StageMotionScope } from './motion-scope'
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
import xiahoudunPreparedJson from '../assets/motion/xiahoudun-prepared.json'
import xiahoudunSheetUrl from '../assets/motion/xiahoudun-motion-sheet.png'
import xuchuPreparedJson from '../assets/motion/xuchu-prepared.json'
import xuchuSheetUrl from '../assets/motion/xuchu-motion-sheet.png'

/** Mooks share the fall-thrown sequence; their fall clips end on these frames. */
export const MOOK_COLLAPSE_TAIL: [string, string] = ['fall-thrown:2', 'fall-thrown:3']
/** Per-kind collapse tail published on MotionArt (each pack's own fall-clip ending). */
export const COLLAPSE_TAIL_BY_KIND: Record<string, [string, string]> = {
  guanyu: ['fall:5', 'fall:6'],
  soldier: MOOK_COLLAPSE_TAIL,
  spearman: MOOK_COLLAPSE_TAIL,
  archer: MOOK_COLLAPSE_TAIL,
  zhangfei: ZHANGFEI_COLLAPSE_TAIL,
  zhaoyun: ZHAOYUN_COLLAPSE_TAIL,
  weiyan: WEIYAN_COLLAPSE_TAIL,
  huangzhong: HUANGZHONG_COLLAPSE_TAIL,
  lidian: LIDIAN_COLLAPSE_TAIL,
  xiahoudun: XIAHOUDUN_COLLAPSE_TAIL,
  xuchu: XUCHU_COLLAPSE_TAIL,
}

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
/** Pinned sha256 over the canonical clip serialization ({loop,duration,keys} per clip, JSON) of guanyuClips(). */
export const MOTION_CLIPS_HASH = 'cd926d062b86def8f6a309b480d4b9383a6a612985dbff920837e28fa06ec31f'

export function motionEnabled(search = typeof window === 'undefined' ? '' : window.location.search): boolean {
  // Temporary pre-deletion rollback: only the exact value 0 selects legacy.
  return new URLSearchParams(search).get('motion') !== '0'
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

/** Xiahou Dun: immutable CMR-14A provenance, one page, exact DOWN alias. */
export function xiahoudunPreparedRecord(): MotionPrepared {
  return xiahoudunPreparedJson as unknown as MotionPrepared
}

/** Xu Chu: immutable CMR-15A provenance, one page, no aliases. */
export function xuchuPreparedRecord(): MotionPrepared {
  return xuchuPreparedJson as unknown as MotionPrepared
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
  { name: 'actions', sourceKey: ACTION_SOURCE_KEY, bytes: 2125731, sha256: '43e8d08ff1378a5d1e1481cf97bab40f2758504bb809ff473e453bfe433c2038', width: 2027, height: 1055 },
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
  { name: 'actions', sourceKey: motionTextureKeys('zhangfei').actions, bytes: 516859, sha256: 'dcbbd34d8a4ce2d8631ab80ee1cf371ce1d2f3bdb52f5409703a6fbe38682181', width: 1693, height: 768 },
]

/** Zhao Yun regular + action atlas pages (CMR-10B; scripts/emit-zhaoyun-runtime.mjs). */
const ZHAOYUN_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: motionTextureKeys('zhaoyun').sheet, bytes: 3241974, sha256: 'b4f2f4666b29cae2ea35573a20bbff6c0e4742fbcb8fe457eddb951bae52e651', width: 2030, height: 1847 },
  { name: 'actions', sourceKey: motionTextureKeys('zhaoyun').actions, bytes: 593671, sha256: 'd8da062436189ff23b087b239d331304a7a369e58078a455bcba7ab823ce9bbc', width: 1845, height: 699 },
]

/** Wei Yan regular + action atlas pages (CMR-11B; scripts/emit-weiyan-runtime.mjs). */
const WEIYAN_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: motionTextureKeys('weiyan').sheet, bytes: 2892771, sha256: 'b99fd67e99acb27214a10fdd58b3f7f5300b0b0c03614cd22de98f8d6f31ddf1', width: 1948, height: 1877 },
  { name: 'actions', sourceKey: motionTextureKeys('weiyan').actions, bytes: 556, sha256: '7eba7c25188be144167d986a113adb244f38faa146e95c36f03f8098da73b47c', width: 618, height: 199 },
]

/** Huang Zhong single atlas page (CMR-12B; scripts/emit-huangzhong-runtime.mjs). */
const HUANGZHONG_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: motionTextureKeys('huangzhong').sheet, bytes: 3156764, sha256: 'e4b2a58cf7dab05b633d428ece05d9d589be1008d41919da5c4caba25bfdb979', width: 1988, height: 1594 },
]

/** Li Dian single atlas page (CMR-13B; scripts/emit-lidian-runtime.mjs). */
const LIDIAN_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: motionTextureKeys('lidian').sheet, bytes: 2102566, sha256: 'fb5f026f919f2e6aa775939706b95deb892c7eb2f33b1626c1be23dcee0e81f7', width: 2011, height: 1646 },
]

/** Xiahou Dun single atlas page (CMR-14B; source bytes copied unchanged). */
const XIAHOUDUN_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: motionTextureKeys('xiahoudun').sheet, bytes: 2220630, sha256: 'e1fdf7e8ea2b4128e6c0380e407e79ca8c985ceb63b09a056097da6dd85af34f', width: 2044, height: 1589 },
]

/** Xu Chu single atlas page (CMR-15B; source bytes copied unchanged). */
const XUCHU_PAGES: PackPage[] = [
  { name: 'sheet', sourceKey: motionTextureKeys('xuchu').sheet, bytes: 2177184, sha256: '6e49fd2749fcde3813185d8520af36db5ec796baecb3285359215cf45fc49348', width: 1979, height: 1186 },
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
  xiahoudun: {
    id: 'xiahoudun',
    revision: 'xiahoudun-1',
    pages: XIAHOUDUN_PAGES,
    url: { sheet: xiahoudunSheetUrl, actions: xiahoudunSheetUrl },
    meta: xiahoudunPreparedRecord,
    clips: xiahoudunClips,
  },
  xuchu: {
    id: 'xuchu',
    revision: 'xuchu-1',
    pages: XUCHU_PAGES,
    url: { sheet: xuchuSheetUrl, actions: xuchuSheetUrl },
    meta: xuchuPreparedRecord,
    clips: xuchuClips,
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
  /**
   * First-spawn schedule (wave boundary tick per kind) partitioning the
   * stage roster into the awaited opening set and spawn-ordered deferred
   * kinds. Omit only for legacy all-opening requests.
   */
  spawnSchedule?: SpawnScheduleEntry[]
  /** Opening window tick; defaults to the opening wave (0). */
  openingTick?: number
}

export interface MotionStageReport {
  /** Kinds the stage-entry policy asked for (immediate scope). */
  requested: string[]
  /** Kinds published with fully verified motion art. */
  published: string[]
  /** Kinds that fell back to legacy art, with the failure class. */
  legacy: Array<{ kind: string; failure: LoadFailure }>
  /** Structured FINAL failures (retry exhausted) among the immediate set. */
  failed: MotionFailureState[]
  /**
   * Best-effort background loads kicked off after the stage entered, in
   * load order: spawn-ordered deferred stage kinds, then future prefetch.
   */
  prefetch: string[]
  /** Later-spawning stage kinds queued behind the entry gate (spawn order). */
  deferred: string[]
  /** The full wave-aware scope this entry planned (spawn gates read it). */
  scope: StageMotionScope
}

export type MotionLoadOutcome = { ok: true } | { ok: false; failure: LoadFailure }

/**
 * Structured failure state for one pack. `final` is true only once a
 * REQUIRED load (stage-entry immediate, a due deferred kind, or a co-op
 * join) has exhausted its single retry; a prefetch failure is recorded
 * with `final: false` and stays non-fatal until the kind becomes due.
 * Cancellation (scene shutdown) is never recorded here.
 */
export interface MotionFailureState {
  kind: string
  failure: LoadFailure
  /** Load attempts made so far (required loads stop at 2: try + one retry). */
  attempts: number
  final: boolean
  /** Runtime frame validation detail; attempts is 0 when no pack retry ran. */
  detail?: string
}

/** Decision a spawn gate makes for the kinds due by a schedule tick. */
export interface MotionGateDecision {
  /** True while any due kind is unpublished (loading) or final-failed. */
  blocked: boolean
  /** Due catalogued kinds not yet published. */
  missing: string[]
  /** First final failure among the due kinds, if any. */
  failure?: MotionFailureState
}

/** Whether `kind` has a catalogued motion pack (a "motion kind"). */
export function isMotionPackKind(kind: string): boolean {
  return MOTION_PACKS[kind] !== undefined
}

/** Only explicit rollback and shared props may use legacy textures.
 * Publication/catalog membership never authorizes a humanoid fallback.
 */
export function canRenderLegacyFrame(motionOn: boolean, prop: boolean): boolean {
  return !motionOn || prop
}

export class MotionRuntime {
  private cache: MotionAtlasCache
  private aborts = new Map<string, AbortController>()
  private held = new Map<Phaser.Scene, Set<string>>()
  private pendingBytes = new Map<string, Uint8Array>()
  private inflight = new Set<Promise<unknown>>()
  private installing = new Map<string, Promise<MotionLoadOutcome>>()
  private scopes = new WeakMap<Phaser.Scene, StageMotionScope>()
  /** Attempts per kind since the last stage entry / success. */
  private attempts = new Map<string, number>()
  /** Last recorded failure per kind (never for cancellation). */
  private failures = new Map<string, MotionFailureState>()

  constructor(private io: MotionIo = browserMotionIo(), caps?: BudgetCaps) {
    this.cache = new MotionAtlasCache(caps)
  }

  budget(): BudgetReport {
    return this.cache.budgetReport()
  }

  state(kind: string): 'idle' | 'loading' | 'ready' | 'failed' | 'absent' {
    return this.cache.state(kind)
  }

  /** Structured failure state for a kind (a copy), if any attempt failed. */
  failureState(kind: string): MotionFailureState | undefined {
    const f = this.failures.get(kind)
    return f ? { ...f } : undefined
  }

  /** The kind's failure state only once its required retry is exhausted. */
  finalFailure(kind: string): MotionFailureState | undefined {
    const f = this.failures.get(kind)
    return f?.final ? { ...f } : undefined
  }

  /**
   * Spawn-gate decision for the kinds due by `tick`: blocked while a due
   * kind is still loading/unpublished or has final-failed. Prefetch-only
   * failures (not yet due, `final: false`) never appear here as failures.
   */
  gateForTick(scene: Phaser.Scene, tick: number): MotionGateDecision {
    const due = this.dueKinds(scene, tick)
    const missing = due.filter((kind) => !this.kindReady(scene, kind))
    const decision: MotionGateDecision = { blocked: missing.length > 0, missing }
    for (const kind of due) {
      const failure = this.finalFailure(kind)
      if (failure) { decision.failure = failure; break }
    }
    return decision
  }

  /** Forget a kind's failure/attempt history (a fresh stage entry retries). */
  private resetFailure(kind: string): void {
    this.attempts.delete(kind)
    this.failures.delete(kind)
  }

  /** Mark a kind final-failed (e.g. the stage deadline fired mid-load). */
  private markFinalFailure(kind: string, failure: LoadFailure): MotionFailureState {
    const state: MotionFailureState = {
      kind,
      failure,
      attempts: Math.max(this.attempts.get(kind) ?? 0, 1),
      final: true,
    }
    this.attempts.set(kind, state.attempts)
    this.failures.set(kind, state)
    return state
  }

  /** The wave-aware scope planned for this scene's current stage entry. */
  stageScope(scene: Phaser.Scene): StageMotionScope | undefined {
    return this.scopes.get(scene)
  }

  /** Whether a kind's verified pack is published AND cache-ready here. */
  kindReady(scene: Phaser.Scene, kind: string): boolean {
    return motionKindReady(scene, kind) && this.cache.state(kind) === 'ready'
  }

  /** Whether every kind in a scheduled set is published and ready. */
  kindsReady(scene: Phaser.Scene, kinds: readonly string[]): boolean {
    return kinds.every((kind) => this.kindReady(scene, kind))
  }

  /**
   * Catalogued kinds whose first spawn falls at or before `tick` in this
   * scene's planned scope - the set a spawn gate awaits before that tick.
   */
  dueKinds(scene: Phaser.Scene, tick: number): string[] {
    const scope = this.scopes.get(scene)
    return scope ? kindsDueByTick(scope, tick) : []
  }

  /**
   * Await a scheduled set (e.g. the kinds due by the next spawn tick, or a
   * late co-op hero). These are REQUIRED loads: each kind gets exactly one
   * retry after its first failure (a prior prefetch failure counts as that
   * first attempt), then a structured final failure - never a cancellation.
   */
  async prepareKinds(scene: Phaser.Scene, kinds: readonly string[]): Promise<Array<{ kind: string; outcome: MotionLoadOutcome }>> {
    const results: Array<{ kind: string; outcome: MotionLoadOutcome }> = []
    for (const kind of kinds) results.push({ kind, outcome: await this.loadKind(scene, kind, { required: true }) })
    return results
  }

  /** Await every tracked load (including fire-and-forget prefetch). */
  async settle(): Promise<void> {
    while (this.inflight.size > 0) await Promise.allSettled([...this.inflight])
  }

  /**
   * Stage entry: prepare the immediate scope before the stage/actor enters
   * simulation, bounded by the stage deadline. A timeout cancels the loads and
   * returns a structured final timeout; required-stage entry displays an error.
   * Ceilings are never raised.
   */
  async prepareStage(scene: Phaser.Scene, req: MotionStageRequest): Promise<MotionStageReport> {
    // All continuations belong to this entry's originating epoch, including
    // background work that has not started when shutdown/deadline cancels it.
    const stageEpoch = this.cache.epoch('stage')
    // Entry budget charges only NEW downloads: kinds this cache already
    // holds ready (previous stage / restart) are free at the gate.
    const candidates = [req.hero, req.secondPlayer ?? '', ...req.stageKinds, ...req.futureKinds]
    const cachedKinds = candidates.filter((kind) => kind && this.cache.state(kind) === 'ready')
    const scope = stageMotionScope({
      hero: req.hero,
      secondPlayer: req.secondPlayer ?? null,
      stageKinds: req.stageKinds,
      futureKinds: req.futureKinds,
      packs: motionPackSourceBytes(),
      budgetBytes: CONTRACT_CAPS.stageDownloads,
      spawnSchedule: req.spawnSchedule,
      openingTick: req.openingTick,
      cachedKinds,
    })
    this.scopes.set(scene, scope)
    // A fresh stage entry is a fresh requirement episode: a kind that
    // final-failed in an earlier stage may be attempted (try + one retry)
    // again here. Within THIS entry the retry budget is exactly one.
    for (const kind of [...scope.immediate, ...scope.deferred, ...scope.prefetch]) this.resetFailure(kind)
    const background = [...scope.deferred, ...scope.prefetch]
    const report: MotionStageReport = {
      requested: [...scope.immediate],
      published: [],
      legacy: [],
      failed: [],
      prefetch: background,
      deferred: [...scope.deferred],
      scope,
    }
    let aborted = false
    const work = (async (): Promise<void> => {
      for (const kind of scope.immediate) {
        // Required: exactly one retry, inside the SAME stage deadline
        // (the race below bounds the retry as well as the first attempt).
        const outcome = await this.loadKind(scene, kind, { required: true })
        if (aborted || this.cache.epoch('stage') !== stageEpoch) return // deadline/shutdown: no continuation
        if (outcome.ok) report.published.push(kind)
        else {
          report.legacy.push({ kind, failure: outcome.failure })
          const failed = this.finalFailure(kind)
          if (failed) report.failed.push(failed)
        }
      }
    })()
    const finished = await raceTimeout(this.track(work), this.io.stageTimeoutMs)
    if (this.cache.epoch('stage') !== stageEpoch) return report // shutdown stays silent, even at the deadline
    if (!finished) {
      aborted = true
      this.cancelLoads()
      for (const kind of scope.immediate) {
        if (!report.published.includes(kind) && !report.legacy.some((l) => l.kind === kind)) {
          // The deadline, not shutdown, cut this load (possibly its retry):
          // that is a final timeout, never a silent cancellation.
          report.legacy.push({ kind, failure: 'timeout' })
          report.failed.push(this.markFinalFailure(kind, 'timeout'))
        }
      }
    }
    // Deferred stage kinds, then future prefetch, load in the background in
    // first-spawn order (sequential, so the next wave's packs land before
    // later ones compete for bandwidth). These are PREFETCH attempts: one
    // try, non-fatal on failure. When a kind becomes due, the spawn gate's
    // required `prepareKinds` spends the single retry and only then can
    // the kind final-fail.
    if (!aborted && background.length > 0) {
      const queue = (async (): Promise<void> => {
        for (const kind of background) {
          // A scene exit/restart cancels the originating scope epoch: stop
          // queueing further kinds into a dead scene instead of loading on.
          if (this.cache.epoch('stage') !== stageEpoch) break
          await this.loadKind(scene, kind, { required: false })
        }
      })()
      void this.track(queue).catch(() => undefined)
    }
    return report
  }

  /**
   * Load + publish one kind's pack atomically; a failure never touches other
   * fighters' published art. Concurrent callers share one install attempt.
   *
   * Retry semantics (sole-motion): a REQUIRED load (the default - stage
   * entry, due kinds, co-op joins) gets exactly ONE retry after its first
   * failure, then a structured final failure (`finalFailure(kind)`). A
   * non-required prefetch makes a single attempt and stays non-final. A
   * prior prefetch failure counts as the first attempt, so a kind becoming
   * due spends its one retry in the required load. Cancellation (scene
   * shutdown) is never retried and never recorded as a failure.
   */
  async loadKind(
    scene: Phaser.Scene,
    kind: string,
    opts: { required?: boolean } = {},
  ): Promise<MotionLoadOutcome> {
    if (!MOTION_PACKS[kind]) return { ok: false, failure: 'unsupported' } // not a motion kind: no state
    const required = opts.required ?? true
    for (;;) {
      const prior = this.failures.get(kind)
      if (prior?.final) return { ok: false, failure: prior.failure }
      // A prefetch never consumes the retry of a kind that already failed
      // once; only the required (due) load may spend it.
      if (!required && prior && !this.installing.has(kind)) return { ok: false, failure: prior.failure }
      const outcome = await this.attemptKind(scene, kind)
      if (outcome.ok) return outcome
      if (outcome.failure === 'cancelled') return outcome // shutdown: no retry, no error state
      if (!required) return outcome
      const attempts = this.attempts.get(kind) ?? 1
      if (attempts >= 2) {
        this.markFinalFailure(kind, outcome.failure)
        return outcome
      }
      // attempts === 1: loop for the single retry (deduped for joiners).
    }
  }

  /** One deduped install attempt; records its outcome (except cancelled). */
  private async attemptKind(scene: Phaser.Scene, kind: string): Promise<MotionLoadOutcome> {
    const existing = this.installing.get(kind)
    if (existing) return existing
    const startEpoch = this.cache.epoch('stage')
    const run = (async (): Promise<MotionLoadOutcome> => {
      const outcome = await this.loadKindInner(scene, kind)
      if (this.cache.epoch('stage') !== startEpoch) return { ok: false, failure: 'cancelled' }
      if (outcome.ok) {
        this.resetFailure(kind)
      } else if (outcome.failure !== 'cancelled') {
        const attempts = (this.attempts.get(kind) ?? 0) + 1
        this.attempts.set(kind, attempts)
        // Preserve a final flag set concurrently (stage-deadline timeout).
        const final = this.failures.get(kind)?.final ?? false
        this.failures.set(kind, { kind, failure: outcome.failure, attempts, final })
      }
      return outcome
    })()
    this.installing.set(kind, run)
    try {
      return await run
    } finally {
      if (this.installing.get(kind) === run) this.installing.delete(kind)
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
    const pendingBytes = this.pendingBytes // this episode owns its bytes and cleanup
    const res = await this.track(this.cache.request(manifest, this.pageLoader(kind, def, pendingBytes, startEpoch), 'stage'))
    if (!res.ok) return { ok: false, failure: res.failure ?? 'corrupt' }
    if (this.cache.epoch('stage') !== startEpoch) return { ok: false, failure: 'cancelled' }
    try {
      const decoded = await this.install(kind, def, pendingBytes, startEpoch)
      if (!decoded || this.cache.epoch('stage') !== startEpoch) return { ok: false, failure: 'cancelled' }
      // No await between the epoch check and the entire publication commit.
      for (const { page, image } of decoded) {
        if (scene.textures.exists(page.sourceKey)) scene.textures.remove(page.sourceKey)
        scene.textures.addImage(page.sourceKey, image as unknown as HTMLImageElement)
      }
      installMotionFrames(scene, kind, def.meta())
      const art = publishMotionArtRecord(scene, def.meta(), this.io.makeCtx, def.clips())
      if (!art) throw new Error(`wrong-signature: pixel signature mismatch for ${kind}`)
      this.markHeld(scene, kind)
      return { ok: true }
    } catch (err) {
      // A stale decode (including a rejection) owns no current textures or slot.
      if (this.cache.epoch('stage') !== startEpoch) return { ok: false, failure: 'cancelled' }
      this.uninstall(scene, kind)
      this.cache.invalidate(kind)
      return { ok: false, failure: classifyError(err) }
    } finally {
      for (const page of def.pages) pendingBytes.delete(byteKey(kind, page.name))
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
    this.pendingBytes = new Map()
    this.installing.clear() // a new episode must not join an old held decode
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

  private pageLoader(kind: string, def: MotionPackDef, pendingBytes: Map<string, Uint8Array>, startEpoch: number): PageLoader {
    return async (page) => {
      const key = byteKey(kind, page.name)
      const ac = new AbortController()
      this.aborts.set(key, ac)
      const timer = setTimeout(() => ac.abort(), this.io.pageTimeoutMs)
      try {
        const bytes = await this.io.fetchBytes(def.url[page.name] ?? '', ac.signal)
        const sha256 = await this.io.sha256(bytes)
        if (bytes.length > 0 && this.cache.epoch('stage') === startEpoch) pendingBytes.set(key, bytes)
        return { bytes, sha256 }
      } finally {
        clearTimeout(timer)
        if (this.aborts.get(key) === ac) this.aborts.delete(key)
      }
    }
  }

  private async install(
    kind: string, def: MotionPackDef, pendingBytes: Map<string, Uint8Array>, startEpoch: number,
  ): Promise<Array<{ page: PackPage; image: CanvasImageSource }> | undefined> {
    const decoded: Array<{ page: PackPage; image: CanvasImageSource }> = []
    for (const page of def.pages) {
      const bytes = pendingBytes.get(byteKey(kind, page.name))
      if (!bytes?.length) throw new Error(`missing: no bytes for ${page.name}`)
      const image = await this.io.decode(bytes)
      if (this.cache.epoch('stage') !== startEpoch) return undefined
      if (image.width !== page.width || image.height !== page.height) {
        throw new Error(`corrupt: ${page.name} decoded ${image.width}x${image.height}, expected ${page.width}x${page.height}`)
      }
      decoded.push({ page, image })
    }
    // The caller rechecks after awaiting this staging operation, then commits
    // every page/frame/registry/reference change without another await.
    return decoded
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

/**
 * First-spawn schedule derived from the core stage data. The tick is the
 * wave boundary index - the core spawns wave 0 at sim creation, each later
 * wave when the previous one clears, props beside wave 0, and the boss only
 * after every wave - so tick order is first-possible-spawn order.
 */
export function stageSpawnSchedule(stageId: string): SpawnScheduleEntry[] {
  const stage = STAGES[stageId]
  if (!stage) return []
  const schedule: SpawnScheduleEntry[] = []
  stage.waves.forEach((wave, tick) => {
    for (const spawn of wave.spawns) schedule.push({ kind: spawn.kind, tick })
  })
  for (const prop of stage.props) schedule.push({ kind: prop.kind, tick: 0 })
  schedule.push({ kind: stage.bossKind, tick: stage.waves.length })
  for (const kind of ['arrow', 'meat', 'sword', 'crate']) schedule.push({ kind, tick: 0 })
  return schedule
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
  return { hero, secondPlayer: secondPlayer ?? null, stageKinds, futureKinds, spawnSchedule: stageSpawnSchedule(stageId) }
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
  const valid = meta.id === 'soldier' ? validSoldierPack(meta) : meta.id === 'spearman' ? validSpearmanPack(meta) : meta.id === 'archer' ? validArcherPack(meta) : meta.id === 'zhangfei' ? validZhangfeiPack(meta) : meta.id === 'zhaoyun' ? validZhaoyunPack(meta) : meta.id === 'weiyan' ? validWeiyanPack(meta) : meta.id === 'huangzhong' ? validHuangzhongPack(meta) : meta.id === 'lidian' ? validLidianPack(meta) : meta.id === 'xiahoudun' ? validXiahoudunPack(meta) : meta.id === 'xuchu' ? validXuchuPack(meta) : validMotionPack(meta)
  if (!valid) return reject()
  const clipTable = clips ?? (meta.id === 'soldier' ? soldierClips() : meta.id === 'spearman' ? spearmanClips() : meta.id === 'archer' ? archerClips() : meta.id === 'zhangfei' ? zhangfeiClips() : meta.id === 'zhaoyun' ? zhaoyunClips() : meta.id === 'weiyan' ? weiyanClips() : meta.id === 'huangzhong' ? huangzhongClips() : meta.id === 'lidian' ? lidianClips() : meta.id === 'xiahoudun' ? xiahoudunClips() : meta.id === 'xuchu' ? xuchuClips() : guanyuClips())
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
  const art: MotionArt = { ...meta, sheet: images[0]!, actionSheet: images[1] ?? images[0]!, clips: clipTable, frameDispatch: meta.id === 'soldier' ? motionFrameForSoldier : meta.id === 'spearman' ? motionFrameForSpearman : meta.id === 'archer' ? motionFrameForArcher : meta.id === 'zhangfei' ? motionFrameForZhangfei : meta.id === 'zhaoyun' ? motionFrameForZhaoyun : meta.id === 'weiyan' ? motionFrameForWeiyan : meta.id === 'huangzhong' ? motionFrameForHuangzhong : meta.id === 'lidian' ? motionFrameForLidian : meta.id === 'xiahoudun' ? motionFrameForXiahoudun : meta.id === 'xuchu' ? motionFrameForXuchu : undefined, ...(COLLAPSE_TAIL_BY_KIND[meta.id] ? { collapseTail: COLLAPSE_TAIL_BY_KIND[meta.id] } : {}) }
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
// Boss AI stateTick stops in flight (Xiahou Dun CMR-14B, Xu Chu CMR-15B).
// Track observed displacement in the existing per-entity presentation
// history; frozen renders add zero age.
const OBSERVED_THROWN_KINDS = new Set(['xiahoudun', 'xuchu'])
type RuntimePlayback = MotionPlayback & { thrownX?: number; thrownAge?: number }
const playback = new WeakMap<Phaser.Scene, Map<number, RuntimePlayback>>()
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
 * Unpublished art waits for the load gate. Invalid published art is reported
 * to the caller for a blocking error, NEVER authorization for legacy art.
 */
export function ensureMotionFrame(scene: Phaser.Scene, entity: Entity, onInvalid?: (detail: string) => void): MotionFrameRef | undefined {
  const art = heroArtResources(scene)?.motions?.[entity.kind]
  if (!art) return undefined
  let state = playback.get(scene)
  if (!state) { state = new Map(); playback.set(scene, state) }
  const bridge = scene.registry.get('bridge') as { sim?: { tick: number } } | undefined
  const tick = bridge?.sim?.tick ?? entity.stateTick
  const prev = state.get(entity.id)
  let observed: Entity = entity
  let thrownAge: number | undefined
  if (OBSERVED_THROWN_KINDS.has(entity.kind) && entity.state === 'thrown') {
    const moved = prev?.state === 'thrown' && prev.thrownX !== undefined ? Math.abs(entity.x - prev.thrownX) : 0
    const speed = Math.abs(entity.vx)
    thrownAge = prev?.state === 'thrown'
      ? (prev.thrownAge ?? 0) + (speed > 0 ? moved / speed : 0)
      : (speed > 0 ? Math.abs(entity.x - entity.thrownFromX) / speed : 0)
    observed = { ...entity, airTicks: thrownAge }
  }
  // Core victims are `grabbed`, unlike the holder's `grab`. Bridge only a
  // genuinely freed, grounded boss victim into the existing release history.
  // Throws, death and attacks retain their current binding and clocks.
  const releasePrev = OBSERVED_THROWN_KINDS.has(entity.kind) && prev?.state === 'grabbed'
    && (entity.state === 'idle' || entity.state === 'walk') && entity.grabbedBy === null
    && entity.z === 0 ? { ...prev, state: 'grab' as const } : prev
  const invalid = (detail: string): undefined => { onInvalid?.(detail); return undefined }
  try {
    const sample = advanceMotion(art, observed, tick, releasePrev)
    state.set(entity.id, { ...sample.playback, ...(thrownAge !== undefined ? { thrownX: entity.x, thrownAge } : {}) })
    const cell = art.frames[sample.frame]
    if (!cell) return invalid(`missing manifest frame ${sample.frame}`)
    const page = cell.sheet === 'actions' ? art.actionSheet : art.sheet
    const size = page as { width: number; height: number }
    if (![cell.x, cell.y, cell.w, cell.h].every(Number.isInteger) || cell.x < 0 || cell.y < 0 || cell.w <= 0 || cell.h <= 0
      || cell.x + cell.w > size.width || cell.y + cell.h > size.height) return invalid(`invalid manifest frame ${sample.frame}`)
    const keys = motionTextureKeys(entity.kind)
    const texture = cell.sheet === 'actions' ? keys.actions : keys.sheet
    const frame = motionFrameId(entity.kind, sample.frame)
    const tex = scene.textures.exists(texture) ? scene.textures.get(texture) : undefined
    if (!tex) return invalid(`missing texture ${texture} for ${sample.frame}`)
    if (!tex.has(frame)) return invalid(`missing texture frame ${frame}`)
    const atlasFrame = tex.get(frame)
    if (atlasFrame.cutX !== cell.x || atlasFrame.cutY !== cell.y || atlasFrame.cutWidth !== cell.w || atlasFrame.cutHeight !== cell.h) {
      return invalid(`corrupt texture frame ${frame}`)
    }
    return { texture, frame }
  } catch {
    return invalid(`invalid published frame data (${entity.state}:${entity.stateTick})`)
  }
}
