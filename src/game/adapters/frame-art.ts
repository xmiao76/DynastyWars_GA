import type Phaser from 'phaser'
import type { ArtResources } from '../art/hero-resources'
import { imageSignature, signatureMatches } from '../art/image-signature'
import type { PoseName } from '../art/poses'
import type { WholeFrameArt, WholeFrameCell } from '../art/whole-frames'
import { ART_RESOURCE_KEY } from './hero-art'
import framesPrepared from '../assets/whole-frames/prepared.json'
import guanyuFrames from '../assets/whole-frames/guanyu-sheet.png'

/**
 * Whole-frame pilot loading (docs/WHOLE_FRAME_TEST.md). OFF by default: only
 * `?frames=1` (a debug switch in the same family as `?autopilot=1` and
 * `?bakedart=1`) queues or publishes anything, so normal play never requests
 * the sheet. Same chain as the other painted packs: Vite-hashed URL import,
 * bounded boot preload, decode + signature verification, and a whole-fighter
 * fallback to the existing art on any mismatch.
 */

export interface FrameCatalogEntry {
  sheet: string
}
export type FrameCatalog = Record<string, FrameCatalogEntry>

export interface FramePreparedEntry {
  revision: string
  density: number
  sheet: { width: number; height: number }
  frames: Partial<Record<PoseName, WholeFrameCell>>
  signatures: { sheet: string }
  sha256: { sheet: string }
}

export const FRAME_ART_CATALOG: FrameCatalog = {
  guanyu: { sheet: guanyuFrames },
}

export function framesEnabled(search: string = typeof window === 'undefined' ? '' : window.location.search): boolean {
  return new URLSearchParams(search).get('frames') === '1'
}

const keyFor = (id: string): string => `frame-source:${id}`

export function queueFrameArt(scene: Phaser.Scene, catalog: FrameCatalog = FRAME_ART_CATALOG): void {
  for (const [id, urls] of Object.entries(catalog)) {
    scene.load.image(keyFor(id), urls.sheet, { responseType: 'blob', timeout: 8000 })
  }
}

/**
 * Publish every decoded sheet whose dimensions and content signature match
 * its preparation record, keeping every other published art field.
 */
export function publishFrameArtRecords(
  scene: Phaser.Scene,
  catalog: FrameCatalog,
  prepared: Record<string, FramePreparedEntry>,
  makeCtx: (w: number, h: number) => CanvasRenderingContext2D | null = (w, h) => {
    if (typeof document === 'undefined') return null
    const cv = document.createElement('canvas')
    cv.width = w
    cv.height = h
    return cv.getContext('2d', { willReadFrequently: true })
  },
): Record<string, WholeFrameArt> {
  const frames: Record<string, WholeFrameArt> = {}
  for (const id of Object.keys(catalog)) {
    const meta = prepared[id]
    if (!meta) continue
    const key = keyFor(id)
    if (!scene.textures.exists(key)) continue
    const src = scene.textures.get(key).getSourceImage() as HTMLImageElement
    if (src.width !== meta.sheet.width || src.height !== meta.sheet.height) continue
    const ctx = makeCtx(src.width, src.height)
    if (!ctx) continue
    ctx.drawImage(src, 0, 0)
    let sig: string | null
    try {
      sig = imageSignature(ctx.getImageData(0, 0, src.width, src.height))
    } catch {
      sig = null
    }
    if (!sig || !signatureMatches(sig, meta.signatures.sheet)) continue
    frames[id] = { id, revision: meta.revision, sheet: src, density: meta.density, frames: meta.frames }
  }
  const prev = (scene.registry.get(ART_RESOURCE_KEY) as ArtResources | undefined) ?? { heroes: {} }
  scene.registry.set(ART_RESOURCE_KEY, { ...prev, frames } satisfies ArtResources)
  return frames
}

export function publishFrameArt(scene: Phaser.Scene): Record<string, WholeFrameArt> {
  return publishFrameArtRecords(scene, FRAME_ART_CATALOG, framesPrepared as unknown as Record<string, FramePreparedEntry>)
}
