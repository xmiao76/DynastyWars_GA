import type Phaser from 'phaser'
import type { Entity } from '../../core/types'
import type { ArtResources } from '../art/hero-resources'
import { imageSignature, signatureMatches } from '../art/image-signature'
import { guanyuClips, validMotionPack, type MotionArt, type MotionPackGeometry } from '../art/motion-clips'
import { advanceMotion, type MotionPlayback } from '../art/motion-player'
import { ART_RESOURCE_KEY, heroArtResources } from './hero-art'
import prepared from '../assets/motion/prepared.json'
import actions from '../assets/motion/actions-prepared.json'
import sheetUrl from '../assets/motion/guanyu-motion-sheet.png'
import actionSheetUrl from '../assets/motion/guanyu-actions-sheet.png'

export interface MotionPrepared extends MotionPackGeometry {
  signatures: { sheet: string; actions: string }
}
export const MOTION_SOURCE_KEY = 'motion-source:guanyu'
export const ACTION_SOURCE_KEY = 'motion-actions:guanyu'
export function motionEnabled(search = typeof window === 'undefined' ? '' : window.location.search): boolean {
  return new URLSearchParams(search).get('motion') === '1'
}
export function queueMotionArt(scene: Phaser.Scene): void {
  scene.load.image(MOTION_SOURCE_KEY, sheetUrl, { responseType: 'blob', timeout: 8000 })
  scene.load.image(ACTION_SOURCE_KEY, actionSheetUrl, { responseType: 'blob', timeout: 8000 })
}
export function motionPreparedRecord(): MotionPrepared {
  return { ...prepared.guanyu, id: 'guanyu', revision: 'motion-2', actionSheet: actions.sheet,
    frames: { ...prepared.guanyu.frames, ...actions.frames } as MotionArt['frames'],
    signatures: { sheet: prepared.guanyu.signatures.sheet, actions: actions.signatures.sheet } }
}
/** Both atlases and all states are verified before any Guan Yu motion publishes. */
export function publishMotionArtRecord(
  scene: Phaser.Scene,
  meta: MotionPrepared,
  makeCtx: (w: number, h: number) => CanvasRenderingContext2D | null = (w, h) => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h
    return cv.getContext('2d', { willReadFrequently: true })
  },
): MotionArt | undefined {
  const prev = (scene.registry.get(ART_RESOURCE_KEY) as ArtResources | undefined) ?? { heroes: {} }
  const reject = (): undefined => { scene.registry.set(ART_RESOURCE_KEY, { ...prev, motions: {} }); return undefined }
  if (!validMotionPack(meta)) return reject()
  const images: HTMLImageElement[] = []
  for (const [key, size, signature] of [[MOTION_SOURCE_KEY, meta.sheet, meta.signatures.sheet], [ACTION_SOURCE_KEY, meta.actionSheet, meta.signatures.actions]] as const) {
    if (!scene.textures.exists(key)) return reject()
    const src = scene.textures.get(key).getSourceImage() as HTMLImageElement
    if (src.width !== size.width || src.height !== size.height) return reject()
    try {
      const g = makeCtx(src.width, src.height)
      if (!g) return reject()
      g.drawImage(src, 0, 0)
      if (!signatureMatches(imageSignature(g.getImageData(0, 0, src.width, src.height)), signature)) return reject()
    } catch { return reject() }
    images.push(src)
  }
  const art: MotionArt = { ...meta, sheet: images[0]!, actionSheet: images[1]!, clips: guanyuClips() }
  scene.registry.set(ART_RESOURCE_KEY, { ...prev, motions: { guanyu: art } } satisfies ArtResources)
  return art
}
export function publishMotionArt(scene: Phaser.Scene): MotionArt | undefined { return publishMotionArtRecord(scene, motionPreparedRecord()) }

/** Presentation history stays per scene/entity; no wall-clock frame queue. */
const playback = new WeakMap<Phaser.Scene, Map<number, MotionPlayback>>()
export function clearMotionPlayback(scene: Phaser.Scene): void { playback.delete(scene) }
export function forgetMotionEntity(scene: Phaser.Scene, id: number): void { playback.get(scene)?.delete(id) }
export function motionVisualLift(scene: Phaser.Scene, entity: Entity): number {
  const art = heroArtResources(scene)?.motions?.[entity.kind], prev = playback.get(scene)?.get(entity.id)
  if (!art || !prev?.fallLift) return 0
  return prev.fallLift.height * Math.max(0, 1 - (entity.stateTick - prev.fallLift.sinceStateTick) / 10)
}
export function ensureMotionKey(scene: Phaser.Scene, entity: Entity): string | undefined {
  const art = heroArtResources(scene)?.motions?.[entity.kind]
  if (!art) return undefined
  let state = playback.get(scene)
  if (!state) { state = new Map(); playback.set(scene, state) }
  const bridge = scene.registry.get('bridge') as { sim?: { tick: number } } | undefined
  const tick = bridge?.sim?.tick ?? entity.stateTick
  const sample = advanceMotion(art, entity, tick, state.get(entity.id))
  state.set(entity.id, sample.playback)
  const key = `entity:${entity.kind}:motion:${sample.frame}`
  if (!scene.textures.exists(key)) {
    const c = art.frames[sample.frame]!
    // CMR-03 repack: trimmed cells restore at (trimX, trimY) inside the full
    // srcW x srcH cell so displayed pixels/registration are unchanged.
    const w = c.srcW ?? c.w
    const h = c.srcH ?? c.h
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h
    const g = cv.getContext('2d')
    if (!g) return undefined
    g.drawImage(c.sheet === 'actions' ? art.actionSheet : art.sheet, c.x, c.y, c.w, c.h, c.trimX ?? 0, c.trimY ?? 0, c.w, c.h)
    scene.textures.addCanvas(key, cv)
  }
  return key
}
