import type Phaser from 'phaser'
import type { BodyArt } from '../art/body-parts'
import type { ArtResources } from '../art/hero-resources'
import { imageSignature, signatureMatches } from '../art/image-signature'
import { ART_RESOURCE_KEY } from './hero-art'
import bodyPrepared from '../assets/hero-bodies/prepared.json'
import mookPrepared from '../assets/mook-bodies/prepared.json'
import bossBodyPrepared from '../assets/boss-bodies/prepared.json'
import guanyuSheet from '../assets/hero-bodies/guanyu-sheet.png'
import huangzhongSheet from '../assets/hero-bodies/huangzhong-sheet.png'
import weiyanSheet from '../assets/hero-bodies/weiyan-sheet.png'
import zhangfeiSheet from '../assets/hero-bodies/zhangfei-sheet.png'
import zhaoyunSheet from '../assets/hero-bodies/zhaoyun-sheet.png'
import soldierSheet from '../assets/mook-bodies/soldier-sheet.png'
import spearmanSheet from '../assets/mook-bodies/spearman-sheet.png'
import archerSheet from '../assets/mook-bodies/archer-sheet.png'
import xiahoudunSheet from '../assets/boss-bodies/xiahoudun-sheet.png'
import xuchuSheet from '../assets/boss-bodies/xuchu-sheet.png'
import lidianSheet from '../assets/boss-bodies/lidian-sheet.png'

/**
 * Paper-doll body art loading (BODY-2), mirroring the ART-18 head chain:
 * Vite-hashed URL imports, bounded boot preload, decode + signature
 * verification, atomic per-fighter procedural fallback.
 *
 * The production catalog is EMPTY until BODY-3+ ship real part sheets, so
 * boot is a verified no-op: every fighter keeps its procedural body and no
 * shipped pixel changes. Unit tests drive `publishBodyArtRecords` with a
 * fixture catalog instead of touching production state.
 */

export interface BodyCatalogEntry {
  sheet: string
}

export type BodyCatalog = Record<string, BodyCatalogEntry>

export interface BodyPreparedEntry {
  revision: string
  skin: string
  density: number
  sheet: { width: number; height: number }
  parts: Record<string, { x: number; y: number; w: number; h: number; pivotX: number; pivotY: number; len?: number }>
  signatures: { sheet: string }
  sha256: { sheet: string }
}

/** Production catalog: BODY-3's five hero sheets + BODY-4's three mooks
 * + BODY-13's three boss sheets. */
export const BODY_ART_CATALOG: BodyCatalog = {
  guanyu: { sheet: guanyuSheet },
  huangzhong: { sheet: huangzhongSheet },
  weiyan: { sheet: weiyanSheet },
  zhangfei: { sheet: zhangfeiSheet },
  zhaoyun: { sheet: zhaoyunSheet },
  soldier: { sheet: soldierSheet },
  spearman: { sheet: spearmanSheet },
  archer: { sheet: archerSheet },
  xiahoudun: { sheet: xiahoudunSheet },
  xuchu: { sheet: xuchuSheet },
  lidian: { sheet: lidianSheet },
}

/** Merged preparation records for every catalogued fighter. */
export const BODY_PREPARED: Record<string, BodyPreparedEntry> = {
  ...(bodyPrepared as Record<string, BodyPreparedEntry>),
  ...(mookPrepared as Record<string, BodyPreparedEntry>),
  ...(bossBodyPrepared as Record<string, BodyPreparedEntry>),
}

const keyFor = (id: string): string => `body-source:${id}`

export function queueBodyArtRecords(scene: Phaser.Scene, catalog: BodyCatalog): void {
  for (const [id, urls] of Object.entries(catalog)) {
    scene.load.image(keyFor(id), urls.sheet, { responseType: 'blob', timeout: 8000 })
  }
}

export function queueBodyArt(scene: Phaser.Scene): void {
  queueBodyArtRecords(scene, BODY_ART_CATALOG)
}

/** 2d-context factory, injectable so unit tests can decode with @napi-rs. */
export type CtxFactory = (w: number, h: number) => CanvasRenderingContext2D | null

const documentFactory: CtxFactory = (w, h) => {
  if (typeof document === 'undefined') return null
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  return cv.getContext('2d', { willReadFrequently: true })
}

function decodedSignature(
  src: CanvasImageSource & { width: number; height: number },
  makeCtx: CtxFactory,
): string | null {
  const ctx = makeCtx(src.width, src.height)
  if (!ctx) return null
  ctx.drawImage(src, 0, 0)
  try {
    return imageSignature(ctx.getImageData(0, 0, src.width, src.height))
  } catch {
    return null
  }
}

/**
 * Publish every catalog entry whose sheet decoded at its expected
 * dimensions AND whose content signature matches the committed preparation
 * record. Partial or corrupt art never produces half-painted fighters:
 * the entry is omitted and that fighter falls back whole.
 */
export function publishBodyArtRecords(
  scene: Phaser.Scene,
  catalog: BodyCatalog,
  prepared: Record<string, BodyPreparedEntry>,
  makeCtx: CtxFactory = documentFactory,
): Record<string, BodyArt> {
  const bodies: Record<string, BodyArt> = {}
  for (const id of Object.keys(catalog)) {
    const meta = prepared[id]
    if (!meta) continue
    const key = keyFor(id)
    if (!scene.textures.exists(key)) continue
    const src = scene.textures.get(key).getSourceImage() as HTMLImageElement
    if (src.width !== meta.sheet.width || src.height !== meta.sheet.height) continue
    const sig = decodedSignature(src, makeCtx)
    if (!sig || !signatureMatches(sig, meta.signatures.sheet)) continue
    bodies[id] = {
      id,
      revision: meta.revision,
      sheet: src,
      density: meta.density,
      parts: meta.parts as BodyArt['parts'],
      skin: parseInt(meta.skin.slice(1), 16),
    }
  }
  const prev = (scene.registry.get(ART_RESOURCE_KEY) as ArtResources | undefined) ?? { heroes: {} }
  scene.registry.set(ART_RESOURCE_KEY, { heroes: prev.heroes, bodies } satisfies ArtResources)
  return bodies
}

export function publishBodyArt(scene: Phaser.Scene): Record<string, BodyArt> {
  return publishBodyArtRecords(scene, BODY_ART_CATALOG, BODY_PREPARED)
}

export function bodyArtResources(scene: Phaser.Scene): ArtResources | undefined {
  return scene.registry.get(ART_RESOURCE_KEY) as ArtResources | undefined
}
