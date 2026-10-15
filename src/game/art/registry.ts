import { PROPS, drawProp } from './props'

/** Shared prop registry. Humanoids are exclusively published motion packs. */
const PROP_PAD = 4
export function propKinds(): string[] { return Object.keys(PROPS) }
export function isVectorProp(kind: string): boolean { return PROPS[kind] !== undefined }
export function artBoxFor(kind: string): { width: number; height: number; standH: number } | undefined {
  const plan = PROPS[kind]
  return plan ? { width: plan.width + PROP_PAD * 2, height: plan.height + PROP_PAD * 2, standH: plan.height } : undefined
}
export function artDisplayHeight(kind: string): number | undefined {
  const box = artBoxFor(kind), plan = PROPS[kind]
  return box && plan ? plan.onScreenH * box.height / box.standH : undefined
}
export function drawKindProp(ctx: CanvasRenderingContext2D, kind: string, scale: number): boolean {
  if (!isVectorProp(kind)) return false
  ctx.save()
  ctx.scale(scale, scale)
  ctx.translate(PROP_PAD, PROP_PAD)
  const drawn = drawProp(ctx, kind)
  ctx.restore()
  return drawn
}
export { PORTRAIT_BOX, PORTRAIT_SCALE, PORTRAIT_TEXTURE, drawKindPortrait } from './painted-portraits'
