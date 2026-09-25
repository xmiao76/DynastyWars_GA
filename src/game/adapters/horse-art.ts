import type Phaser from 'phaser'
import type { HorseArt, HorseFrameName } from '../art/horse-frames'
import type { ArtResources } from '../art/hero-resources'
import { imageSignature, signatureMatches } from '../art/image-signature'
import { ART_RESOURCE_KEY } from './hero-art'
import horsePrepared from '../assets/horse/prepared.json'
import horseSheet from '../assets/horse/horse-sheet.png'

/**
 * Painted horse loading (BODY-5), same chain shape as heads and bodies:
 * Vite-hashed URL import, bounded boot preload, decode + signature
 * verification, atomic procedural fallback for the whole horse.
 *
 * Unit tests drive `publishHorseArtRecords` with a fixture catalog instead
 * of touching production state.
 */

export interface HorseCatalogEntry {
  sheet: string
}

export type HorseCatalog = Record<string, HorseCatalogEntry>

export interface HorsePreparedEntry {
  revision: string
  density: number
  sheet: { width: number; height: number }
  frames: Record<HorseFrameName, { x: number; y: number; w: number; h: number }>
  signatures: { sheet: string }
  sha256: { sheet: string }
}

/** Production catalog: the BODY-5 horse sheet. */
export const HORSE_ART_CATALOG: HorseCatalog = {
  horse: { sheet: horseSheet },
}

const keyFor = (id: string): string => `horse-source:${id}`

export function queueHorseArtRecords(scene: Phaser.Scene, catalog: HorseCatalog): void {
  for (const [id, urls] of Object.entries(catalog)) {
    scene.load.image(keyFor(id), urls.sheet, { responseType: 'blob', timeout: 8000 })
  }
}

export function queueHorseArt(scene: Phaser.Scene): void {
  queueHorseArtRecords(scene, HORSE_ART_CATALOG)
}

function decodedSignature(
  src: CanvasImageSource & { width: number; height: number },
  makeCtx: (w: number, h: number) => CanvasRenderingContext2D | null,
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
 * Publish the horse sheet when it decoded at its expected dimensions AND
 * its content signature matches the committed preparation record. Anything
 * else leaves the horse fully procedural - never a half-painted mount.
 */
export function publishHorseArtRecords(
  scene: Phaser.Scene,
  catalog: HorseCatalog,
  prepared: Record<string, HorsePreparedEntry>,
  makeCtx: (w: number, h: number) => CanvasRenderingContext2D | null = (w, h) => {
    if (typeof document === 'undefined') return null
    const cv = document.createElement('canvas')
    cv.width = w
    cv.height = h
    return cv.getContext('2d', { willReadFrequently: true })
  },
): HorseArt | undefined {
  let horse: HorseArt | undefined
  for (const id of Object.keys(catalog)) {
    const meta = prepared[id]
    if (!meta) continue
    const key = keyFor(id)
    if (!scene.textures.exists(key)) continue
    const src = scene.textures.get(key).getSourceImage() as HTMLImageElement
    if (src.width !== meta.sheet.width || src.height !== meta.sheet.height) continue
    const sig = decodedSignature(src, makeCtx)
    if (!sig || !signatureMatches(sig, meta.signatures.sheet)) continue
    horse = { id, revision: meta.revision, sheet: src, density: meta.density, frames: meta.frames }
  }
  const prev = (scene.registry.get(ART_RESOURCE_KEY) as ArtResources | undefined) ?? { heroes: {} }
  scene.registry.set(ART_RESOURCE_KEY, { heroes: prev.heroes, bodies: prev.bodies, horse } satisfies ArtResources)
  return horse
}

export function publishHorseArt(scene: Phaser.Scene): HorseArt | undefined {
  return publishHorseArtRecords(scene, HORSE_ART_CATALOG, horsePrepared as Record<string, HorsePreparedEntry>)
}
