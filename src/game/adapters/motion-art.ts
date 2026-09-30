import type Phaser from 'phaser'
import type { Entity } from '../../core/types'
import type { ArtResources } from '../art/hero-resources'
import { imageSignature, signatureMatches } from '../art/image-signature'
import { guanyuClips, motionFrameForEntity, validMotionPack, type MotionArt } from '../art/motion-clips'
import { ART_RESOURCE_KEY, heroArtResources } from './hero-art'
import prepared from '../assets/motion/prepared.json'
import sheetUrl from '../assets/motion/guanyu-motion-sheet.png'

export interface MotionPrepared extends Omit<MotionArt, 'sheet' | 'clips'> {
  sheet: { width: number; height: number }
  signatures: { sheet: string }
}
export const MOTION_SOURCE_KEY = 'motion-source:guanyu'
export function motionEnabled(search = typeof window === 'undefined' ? '' : window.location.search): boolean {
  return new URLSearchParams(search).get('motion') === '1'
}
export function queueMotionArt(scene: Phaser.Scene): void {
  scene.load.image(MOTION_SOURCE_KEY, sheetUrl, { responseType: 'blob', timeout: 8000 })
}

/** Technical integrity is atomic; aesthetic acceptance is a separate review. */
export function publishMotionArtRecord(
  scene: Phaser.Scene,
  meta: MotionPrepared,
  makeCtx: (w: number, h: number) => CanvasRenderingContext2D | null = (w, h) => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h
    return cv.getContext('2d', { willReadFrequently: true })
  },
): MotionArt | undefined {
  const prev = (scene.registry.get(ART_RESOURCE_KEY) as ArtResources | undefined) ?? { heroes: {} }
  // Clear all pilot records on rejection, never publish a partially valid clip.
  const reject = (): undefined => { scene.registry.set(ART_RESOURCE_KEY, { ...prev, motions: {} }); return undefined }
  if (!validMotionPack(meta) || !scene.textures.exists(MOTION_SOURCE_KEY)) return reject()
  const src = scene.textures.get(MOTION_SOURCE_KEY).getSourceImage() as HTMLImageElement
  if (src.width !== meta.sheet.width || src.height !== meta.sheet.height) return reject()
  try {
    const g = makeCtx(src.width, src.height)
    if (!g) return reject()
    g.drawImage(src, 0, 0)
    if (!signatureMatches(imageSignature(g.getImageData(0, 0, src.width, src.height)), meta.signatures.sheet)) return reject()
  } catch { return reject() }
  const art: MotionArt = { ...meta, sheet: src, clips: guanyuClips() }
  scene.registry.set(ART_RESOURCE_KEY, { ...prev, motions: { guanyu: art } } satisfies ArtResources)
  return art
}
export function publishMotionArt(scene: Phaser.Scene): MotionArt | undefined {
  return publishMotionArtRecord(scene, { id: 'guanyu', ...prepared.guanyu })
}

/** Direct clip sampling; render callbacks never consume an animation queue. */
export function ensureMotionKey(scene: Phaser.Scene, entity: Entity): string | undefined {
  const art = heroArtResources(scene)?.motions?.[entity.kind]
  if (!art) return undefined
  const frame = motionFrameForEntity(art, entity)
  if (!frame) return undefined
  const key = `entity:${entity.kind}:motion:${frame}`
  if (!scene.textures.exists(key)) {
    const c = art.frames[frame]!
    const cv = document.createElement('canvas'); cv.width = c.w; cv.height = c.h
    const g = cv.getContext('2d')
    if (!g) return undefined
    g.drawImage(art.sheet, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h)
    scene.textures.addCanvas(key, cv)
  }
  return key
}
