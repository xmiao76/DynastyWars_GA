import type { PortraitResources } from './hero-resources'

/** Shared select/HUD framing; source images are 432×480, textures stay 432×480. */
export const PORTRAIT_BOX = { width: 36, height: 40 } as const
export const PORTRAIT_SCALE = 6
export const PORTRAIT_TEXTURE = {
  width: PORTRAIT_BOX.width * PORTRAIT_SCALE,
  height: PORTRAIT_BOX.height * PORTRAIT_SCALE,
} as const

/** D0 painted-only: missing/rejected art produces no portrait, never a rig. */
export function drawKindPortrait(
  ctx: CanvasRenderingContext2D,
  kind: string,
  scale: number,
  resources?: PortraitResources,
): boolean {
  const painted = resources?.portraits?.[kind]
  if (!painted) return false
  ctx.drawImage(painted.portrait, 0, 0, PORTRAIT_BOX.width * scale, PORTRAIT_BOX.height * scale)
  return true
}
