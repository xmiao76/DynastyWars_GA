import { INK } from './palette'
import { polyPath } from './paths'

/**
 * The shared cel pipeline (props, portrait drawing), standalone since the
 * sole-motion cutover removed the figure-rig renderer it was extracted from.
 */

/**
 * Ink line half-width, in canonical figure units. Small relative to the limbs
 * on purpose: the ink is a stroke CENTRED on each shape's edge, so half of it
 * eats into the fill. At 1.15 against a 6-unit forearm it took most of the arm
 * and the cast read as black sticks.
 */
export const INK_W = 0.85
const LIGHT = 'rgba(255, 246, 228, 0.17)'
const SHADOW = 'rgba(22, 14, 30, 0.34)'

export interface Shape {
  trace: (c: CanvasRenderingContext2D) => void
  fill: string
  /** Interior material facets must not acquire a second black outline. */
  outline?: boolean
  /** A paint boundary, not a shape: cel groups on either side shade once. */
  /** A paper-doll body part marker: the raster painter draws here instead. */
  /** A painted weapon marker (BODY-21): the weapon painter draws here instead. */
  weaponPart?: string
  /** Painted-material overlay (BODY-10): runs inside this shape's clip, in
   * the trace's own frame, after the cel bands - wood grain, steel bevels,
   * cloth folds. Restrained: a shape may carry one overlay only. */
  mat?: (c: CanvasRenderingContext2D) => void
  /** Soft local transition on the painted head's near shoulder only. */
  shoulder?: { x: number; y: number; radius: number }
  /** With `bodyPart`: draw the part only inside this path (UIR-13 cuff disc). */
  bodyClip?: (c: CanvasRenderingContext2D) => void
}

/**
 * The light is up and to the left, so the shadow falls down and to the right.
 * Both regions are one polygon each, crossing the whole drawing: cel shading
 * reads as a single light source only while the terminator is a single line,
 * and stops the moment each part shades itself.
 *
 * The first attempt at the lit side re-stroked every shape's outline offset
 * toward the light, clipped to the figure. That is a real technique, but it
 * only produces a rim where a shape's edge IS the figure's edge - and for a
 * torso or a head, which sit well inside the silhouette, the offset outline
 * lands entirely within it and draws a pale loop across the body. The cast came
 * out covered in rings. A band needs the union of every shape to be meaningful,
 * and a per-shape pass cannot see it.
 *
 * The splits are fractions of the width so the same light falls across a
 * fighter and a crate alike.
 */
export const SHADOW_SPLIT = [0.625, 0.375] as const
export const LIT_SPLIT = [0.458, 0.229] as const

export function bandPath(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  split: readonly [number, number],
  toward: 1 | -1,
): void {
  const pad = 14
  const edge = toward === 1 ? w + pad : -pad
  polyPath(ctx, [
    { x: w * split[0], y: -pad },
    { x: edge, y: -pad },
    { x: edge, y: h + pad },
    { x: w * split[1], y: h + pad },
  ])
}

/**
 * The shared cel pipeline: ink silhouette, flat fills, one shadow band, one lit
 * band. Everything the game draws as a character or an object goes through it,
 * so a crate is lit from the same direction as the fighter standing next to it.
 */
/** One hard-edged tonal band: which side of the split line it covers, and in
 * what colour. Two of them are what makes the cel shading read as one light. */
export interface CelBand {
  split: readonly [number, number]
  toward: 1 | -1
  fill: string
}

/** The light every sprite is lit by. The portrait overrides it, because a
 * terminator tuned for a full figure puts the whole FACE in shadow - see
 * `portrait.ts`. */
export const DEFAULT_BANDS: readonly CelBand[] = [
  { split: SHADOW_SPLIT, toward: 1, fill: SHADOW },
  { split: LIT_SPLIT, toward: -1, fill: LIGHT },
]

export function paintCel(
  ctx: CanvasRenderingContext2D,
  shapes: readonly Shape[],
  w: number,
  h: number,
  bands: readonly CelBand[] = DEFAULT_BANDS,
): void {
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  for (const shape of shapes) {
    if (shape.outline === false) continue
    ctx.save()
    shape.trace(ctx)
    ctx.lineWidth = INK_W * 2
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.fillStyle = INK
    ctx.fill()
    ctx.restore()
  }
  for (const shape of shapes) {
    ctx.save()
    shape.trace(ctx)
    ctx.fillStyle = shape.fill
    ctx.fill()
    ctx.restore()
  }
  ctx.save()
  ctx.globalCompositeOperation = 'source-atop'
  for (const band of bands) {
    bandPath(ctx, w, h, band.split, band.toward)
    ctx.fillStyle = band.fill
    ctx.fill()
  }
  ctx.restore()
}
