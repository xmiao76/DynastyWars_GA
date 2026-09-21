import { INK, css, shade, tint } from './palette'

/**
 * Stage backdrops, painted to tiling textures.
 *
 * Canvas-2D rather than Phaser Graphics, which is what lets these use real
 * gradients: a `Graphics` gradient is a WebGL-only feature that silently draws
 * nothing under canvas, and the old painters had to work in flat bands to avoid
 * it. Baked into a texture, a gradient is just a bitmap and both renderers draw
 * the same pixels.
 *
 * Every silhouette is PERIODIC over the tile width. These are tileSprites, so a
 * ridge whose left edge does not meet its own right edge shows a vertical seam
 * marching across the screen as the stage scrolls - the kind of fault that is
 * invisible in a screenshot and obvious in motion.
 */

export const TILE_W = 256
export const SKY_H = 270
export const RIDGE_H = 96
export const GROUND_H = 116

type Ctx = CanvasRenderingContext2D

/** A periodic ridge line: three harmonics, so it never repeats too obviously. */
function ridgeY(x: number, base: number, amp: number, phase: number): number {
  const t = (x / TILE_W) * Math.PI * 2
  return (
    base -
    amp * 0.62 * Math.sin(t + phase) -
    amp * 0.26 * Math.sin(t * 2 + phase * 1.7) -
    amp * 0.12 * Math.sin(t * 4 + phase * 2.3)
  )
}

function ridgePath(ctx: Ctx, base: number, amp: number, phase: number, bottom: number): void {
  ctx.beginPath()
  ctx.moveTo(-2, bottom)
  for (let x = -2; x <= TILE_W + 2; x += 2) ctx.lineTo(x, ridgeY(x, base, amp, phase))
  ctx.lineTo(TILE_W + 2, bottom)
  ctx.closePath()
}

/** Sky: a graded field with a low sun and two haze bands. */
export function paintSky(ctx: Ctx, topColor: number, bottomColor: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, SKY_H)
  grad.addColorStop(0, css(shade(topColor, 0.25)))
  grad.addColorStop(0.55, css(topColor))
  grad.addColorStop(1, css(bottomColor))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, TILE_W, SKY_H)

  // Sun glow, low and warm. Drawn into the tile so it repeats with the sky
  // rather than sitting on a separate layer that has to be scrolled in step.
  const glow = ctx.createRadialGradient(198, 176, 4, 198, 176, 74)
  glow.addColorStop(0, 'rgba(255, 232, 160, 0.85)')
  glow.addColorStop(0.35, 'rgba(255, 208, 120, 0.28)')
  glow.addColorStop(1, 'rgba(255, 200, 110, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 60, TILE_W, SKY_H - 60)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)'
  ctx.fillRect(0, 74, TILE_W, 9)
  ctx.fillRect(0, 118, TILE_W, 5)
}

/**
 * A ridge of hills, ink-outlined like the cast.
 *
 * `far` draws a second, paler ridge behind the first: the depth cue that makes
 * a backdrop read as landscape instead of as a cut-out.
 */
export function paintRidge(ctx: Ctx, hillColor: number, hazeColor: number): void {
  ctx.clearRect(0, 0, TILE_W, RIDGE_H)
  ctx.lineJoin = 'round'

  // Far ridge: lighter, hazier, higher. The amplitudes are large enough that
  // the ridge line actually rises above the ground strip in front of it - the
  // first pass sat so low that only a 30px sliver was ever on screen, which is
  // the same way the old hills layer managed to be invisible entirely.
  ctx.fillStyle = css(tint(hillColor, 0.34))
  ridgePath(ctx, 36, 25, 0.8, RIDGE_H)
  ctx.fill()
  ctx.strokeStyle = 'rgba(20, 15, 20, 0.35)'
  ctx.lineWidth = 1.6
  ctx.stroke()

  // Near ridge: the stage colour, with the ink line the whole game shares.
  ctx.fillStyle = css(hillColor)
  ridgePath(ctx, 62, 27, 2.6, RIDGE_H)
  ctx.fill()
  ctx.strokeStyle = INK
  ctx.lineWidth = 2.2
  ctx.stroke()

  // Lit crest: a thin band of the sunward side, clipped to the near ridge.
  ctx.save()
  ridgePath(ctx, 62, 27, 2.6, RIDGE_H)
  ctx.clip()
  ctx.fillStyle = css(tint(hillColor, 0.24))
  for (let x = 0; x <= TILE_W; x += 2) {
    const y = ridgeY(x, 62, 27, 2.6)
    ctx.fillRect(x, y, 2, 5)
  }
  ctx.restore()

  // Haze where the ridge meets the ground, so there is no hard join.
  const haze = ctx.createLinearGradient(0, RIDGE_H - 22, 0, RIDGE_H)
  haze.addColorStop(0, 'rgba(0, 0, 0, 0)')
  haze.addColorStop(1, css(hazeColor))
  ctx.fillStyle = haze
  ctx.globalAlpha = 0.5
  ctx.fillRect(0, RIDGE_H - 22, TILE_W, 22)
  ctx.globalAlpha = 1
}

/** The walkable field: a lit band at the horizon falling to a richer floor. */
export function paintGround(ctx: Ctx, baseColor: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_H)
  grad.addColorStop(0, css(tint(baseColor, 0.3)))
  grad.addColorStop(0.18, css(tint(baseColor, 0.1)))
  grad.addColorStop(1, css(shade(baseColor, 0.28)))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, TILE_W, GROUND_H)

  // The horizon line: one ink rule, the same device as the figures' outline.
  ctx.fillStyle = INK
  ctx.globalAlpha = 0.45
  ctx.fillRect(0, 0, TILE_W, 2)
  ctx.globalAlpha = 1

  // Tufts and speckle. Positions are a fixed integer walk, not random, so the
  // texture is identical on every run and the vision gate's numbers are stable.
  ctx.fillStyle = css(tint(baseColor, 0.26))
  ctx.globalAlpha = 0.5
  for (let i = 0; i < 110; i += 1) {
    const x = (i * 47) % TILE_W
    const y = 10 + ((i * 61) % (GROUND_H - 14))
    ctx.beginPath()
    ctx.ellipse(x, y, 2.6, 1.4, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
  for (let i = 0; i < 48; i += 1) {
    const x = (i * 83) % TILE_W
    const y = 6 + ((i * 31) % (GROUND_H - 10))
    ctx.fillRect(x, y, 2, 1)
  }
  ctx.globalAlpha = 1
}

export const CLOUD_W = 76
export const CLOUD_H = 34

/**
 * A cloud, as overlapping lobes with a soft ink edge and a lit top.
 *
 * Drawn once into a texture and placed as Images, rather than built from Phaser
 * shapes per cloud: the lit band has to be clipped to the cloud's silhouette,
 * and clipping is something a canvas does and a stack of circles does not.
 */
export function paintCloud(ctx: Ctx): void {
  ctx.clearRect(0, 0, CLOUD_W, CLOUD_H)
  const lobes: Array<[number, number, number, number]> = [
    [24, 22, 22, 9],
    [40, 16, 17, 12],
    [55, 21, 14, 8],
    [12, 24, 12, 6],
  ]
  ctx.beginPath()
  for (const [x, y, rx, ry] of lobes) {
    ctx.moveTo(x + rx, y)
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'
  ctx.fill()
  // Deliberately NOT stroked. Stroking a path made of overlapping ellipses
  // outlines each one, including where they overlap, so the cloud comes out
  // with its own construction lines drawn across it. An outline would need the
  // UNION of the lobes, which a path of separate ellipses cannot give.
  // Lit tops, clipped to the cloud.
  ctx.save()
  ctx.clip()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
  ctx.fillRect(0, 0, CLOUD_W, 16)
  ctx.fillStyle = 'rgba(120, 140, 180, 0.22)'
  ctx.fillRect(0, 26, CLOUD_W, CLOUD_H - 26)
  ctx.restore()
}
