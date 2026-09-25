import type { PoseName } from './poses'
import type { Skeleton } from './rig'
import type { BodyArt } from './body-parts'
import type { HorseArt } from './horse-frames'

/** Decoded, complete per-hero art. Pure renderers receive this explicitly. */
export interface HeroArt {
  id: string
  revision: string
  portrait: CanvasImageSource
  head: CanvasImageSource
  front: CanvasImageSource
  rear: CanvasImageSource
  cell: { width: number; height: number }
  bounds: { x: number; y: number; width: number; height: number }
  skin: number
}

export interface ArtResources {
  heroes: Readonly<Partial<Record<string, HeroArt>>>
  /** Paper-doll bodies (BODY-2), keyed by fighter id like heads. Absent
   * entries render fully procedural - the atomic fallback is per fighter. */
  bodies?: Readonly<Partial<Record<string, BodyArt>>>
  /** Painted horse frames (BODY-5). Absent (or missing a frame) renders
   * the procedural horse. */
  horse?: HorseArt
}

export type HeadLayer = 'rear' | 'head' | 'front'
export type HeadPainter = (ctx: CanvasRenderingContext2D, layer: HeadLayer) => void

/** BODY-16 natural proportions: painted heads render at 60% (the cast
 * measured ~1:3.1-3.8, chibi; this lands every fighter in 1:4.5-5).
 * Portraits are separate assets and stay full-size; the procedural
 * fallback keeps build.head (emergency path only). */
export const HEAD_PAINTED_SCALE = 0.6
/** Chin-anchored re-seat: eye->chin is 12 art units, so shrinking the
 * head lifts the chin 12*(1-0.6) units off the neck unless the head
 * joint drops by exactly that. */
export const HEAD_CHIN_DROP = 12 * (1 - HEAD_PAINTED_SCALE)

export function expressionFor(pose: PoseName): number {
  if (pose === 'hurt' || pose === 'down') return 2
  if (['attack', 'attack2', 'thrust', 'chop', 'sweep', 'special'].includes(pose)) return 1
  return 0
}

/** The eye-line pivot follows the head joint, with all beard/cloth layers in
 * the same local coordinates. No independent rescaling per expression. */
export function headPainter(art: HeroArt, poseName: PoseName, pose: Skeleton, headScale: number): HeadPainter {
  return (ctx, layer) => {
    const b = art.bounds
    ctx.save()
    // Prone face sits above the floor, not centered on the old near-ground
    // ellipse. Standing attachment is unchanged; this is a render-only offset.
    ctx.translate(pose.head.x - (pose.lying ? 6 : 0), pose.head.y - (pose.lying ? (art.id === 'zhangfei' ? 20 : art.id === 'huangzhong' ? 14.5 : 13.5) * headScale : 0))
    // The old elliptical head tolerated DOWN's small tilt; an anatomical neck
    // and long beard must lie along the chest axis rather than below the floor.
    const rotation = pose.lying
      ? Math.atan2(pose.chest.y - pose.head.y, pose.chest.x - pose.head.x) - Math.PI / 2
      : pose.headRot
    ctx.rotate(rotation)
    ctx.scale(headScale, headScale)
    ctx.drawImage(art[layer], expressionFor(poseName) * art.cell.width, 0, art.cell.width, art.cell.height,
      b.x, b.y, b.width, b.height)
    ctx.restore()
  }
}
