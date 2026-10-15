/**
 * Canvas path helpers for shared drawing such as props, standalone since the
 * sole-motion cutover removed the figure-rig module they were extracted from.
 */

export interface Pt {
  x: number
  y: number
}

/**
 * Trace a tapered limb from a to b as a closed path, with rounded ends.
 *
 * Rounded rather than square because the ink pass strokes these paths with a
 * fat line: square corners on a thin limb turn into spikes at the joints, and
 * a chain of them reads as a lightning bolt rather than an arm.
 *
 * The side lines run a-minus-normal to b-minus-normal and back on the plus
 * side, because that is where the first arc ENDS: angle+90deg to angle-90deg
 * leaves the pen at a - n*wA/2. From the first commit until ART-16 they ran to
 * b PLUS the normal instead, so each limb was a bow-tie: the two sides crossed
 * in the middle and the nonzero fill left the crossing empty. That hollowed
 * every torso, limb, sash, belt and haft, and it turned every
 * in-play brow, mouth and nose - all limb paths - into a broken comma.
 * `rig.test.ts` fills one and counts its middle.
 */
export function limbPath(
  ctx: CanvasRenderingContext2D,
  a: Pt,
  b: Pt,
  wA: number,
  wB: number,
): void {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const angle = Math.atan2(dy, dx)
  ctx.beginPath()
  ctx.arc(a.x, a.y, wA / 2, angle + Math.PI / 2, angle - Math.PI / 2)
  ctx.lineTo(b.x - nx * (wB / 2), b.y - ny * (wB / 2))
  ctx.arc(b.x, b.y, wB / 2, angle - Math.PI / 2, angle + Math.PI / 2)
  ctx.lineTo(a.x + nx * (wA / 2), a.y + ny * (wA / 2))
  ctx.closePath()
}

/** An ellipse path, for heads, shoulders and the like. */
export function ovalPath(
  ctx: CanvasRenderingContext2D,
  c: Pt,
  rx: number,
  ry: number,
  rot = 0,
): void {
  ctx.beginPath()
  ctx.ellipse(c.x, c.y, rx, ry, rot, 0, Math.PI * 2)
  ctx.closePath()
}

/** A closed polygon path through the given points. */
export function polyPath(ctx: CanvasRenderingContext2D, pts: readonly Pt[]): void {
  ctx.beginPath()
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.closePath()
}
