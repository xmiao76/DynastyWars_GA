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
export const MARKS_H = 64
export const EMBERS_H = 64

export type MarksKind =
  | 'gorge'
  | 'village'
  | 'riverbank'
  | 'bridge'
  | 'outskirts'
  | 'warships'
  | 'inferno'
  | 'flagship'
  | 'arena'

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

/** Sky: a graded field with a low sun and two haze bands.
 *
 * `ember` is the Red Cliff finale variant: a blood-red sun and smoke
 * bands over the same gradient structure. The default path is untouched,
 * byte for byte, so every other stage renders exactly what it rendered.
 */
export function paintSky(ctx: Ctx, topColor: number, bottomColor: number, variant: 'day' | 'ember' = 'day'): void {
  const grad = ctx.createLinearGradient(0, 0, 0, SKY_H)
  grad.addColorStop(0, css(shade(topColor, 0.25)))
  grad.addColorStop(0.55, css(topColor))
  grad.addColorStop(1, css(bottomColor))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, TILE_W, SKY_H)

  // Sun glow, low and warm. Drawn into the tile so it repeats with the sky
  // rather than sitting on a separate layer that has to be scrolled in step.
  // The off-centre sun would break the tile's periodicity (column 0 and
  // column 255 would meet different glow), so a wrapped copy at -58 keeps
  // both edges on the same falloff: the seam step is one pixel of gradient.
  const ember = variant === 'ember'
  for (const gx of [198, 198 - TILE_W]) {
    const glow = ctx.createRadialGradient(gx, 176, 4, gx, 176, ember ? 104 : 74)
    if (ember) {
      glow.addColorStop(0, 'rgba(255, 150, 80, 0.9)')
      glow.addColorStop(0.4, 'rgba(255, 96, 48, 0.32)')
      glow.addColorStop(1, 'rgba(255, 80, 40, 0)')
    } else {
      glow.addColorStop(0, 'rgba(255, 232, 160, 0.85)')
      glow.addColorStop(0.35, 'rgba(255, 208, 120, 0.28)')
      glow.addColorStop(1, 'rgba(255, 200, 110, 0)')
    }
    ctx.fillStyle = glow
    ctx.fillRect(0, 60, TILE_W, SKY_H - 60)
  }

  if (ember) {
    ctx.fillStyle = 'rgba(48, 22, 16, 0.28)'
    ctx.fillRect(0, 66, TILE_W, 12)
    ctx.fillRect(0, 104, TILE_W, 7)
    ctx.fillRect(0, 142, TILE_W, 5)
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)'
    ctx.fillRect(0, 74, TILE_W, 9)
    ctx.fillRect(0, 118, TILE_W, 5)
  }
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

/* ------------------------------------------------------------------ */
/* Landmark mid-layer (ART-19)                                         */
/* ------------------------------------------------------------------ */

/**
 * One flame tongue: a leaning curl, drawn from fixed geometry (no random),
 * so the inferno and the braziers are identical on every run.
 */
function flameTongue(ctx: Ctx, x: number, baseY: number, w: number, h: number): void {
  ctx.beginPath()
  ctx.moveTo(x - w / 2, baseY)
  ctx.quadraticCurveTo(x - w / 2, baseY - h * 0.6, x + w * 0.1, baseY - h)
  ctx.quadraticCurveTo(x + w * 0.15, baseY - h * 0.45, x + w / 2, baseY)
  ctx.closePath()
  const g = ctx.createLinearGradient(0, baseY - h, 0, baseY)
  g.addColorStop(0, '#ffd76a')
  g.addColorStop(0.55, '#e85418')
  g.addColorStop(1, '#a01818')
  ctx.fillStyle = g
  ctx.fill()
  ctx.fillStyle = '#fff2c0'
  ctx.fillRect(x - 1, baseY - h * 0.32, 2, h * 0.3)
}

/** A war banner on a pole: pennant, crossbar and cords. */
function warBanner(ctx: Ctx, x: number, baseY: number, h: number, cloth: string): void {
  ctx.fillStyle = '#4a3018'
  ctx.fillRect(x - 1, baseY - h, 2, h)
  ctx.fillStyle = '#6a4a2a'
  ctx.fillRect(x - 1, baseY - h, 11, 2)
  ctx.fillStyle = cloth
  ctx.beginPath()
  ctx.moveTo(x, baseY - h + 2)
  ctx.lineTo(x + 10, baseY - h + 5)
  ctx.lineTo(x, baseY - h + 12)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = INK
  ctx.lineWidth = 0.8
  ctx.stroke()
}

/** A tiled rooftop: trapezoid cap with a ridge line and upturned eaves. */
function rooftop(ctx: Ctx, x: number, baseY: number, w: number, h: number): void {
  ctx.fillStyle = '#c8b088'
  ctx.fillRect(x + 4, baseY - h, w - 8, h)
  ctx.fillStyle = '#8a4a2a'
  ctx.beginPath()
  ctx.moveTo(x - 2, baseY - h)
  ctx.lineTo(x + w / 2, baseY - h - 10)
  ctx.lineTo(x + w + 2, baseY - h)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = INK
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = '#5a2a1a'
  ctx.fillRect(x + w / 2 - 1, baseY - h - 10, 2, 5)
}

/** A ship hull with a mast and furled sail; `burning` adds flame tongues. */
function warship(ctx: Ctx, x: number, waterY: number, w: number, burning: boolean): void {
  const hullH = 12
  ctx.fillStyle = burning ? '#2a1a12' : '#4a3220'
  ctx.beginPath()
  ctx.moveTo(x, waterY - hullH)
  ctx.lineTo(x + w, waterY - hullH)
  ctx.lineTo(x + w - 8, waterY)
  ctx.lineTo(x + 8, waterY)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = INK
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = burning ? '#4a2418' : '#6a4a2a'
  ctx.fillRect(x + w / 2 - 1, waterY - hullH - 22, 2, 22)
  ctx.fillStyle = burning ? '#5a3a28' : '#c8b890'
  ctx.fillRect(x + w / 2 - 8, waterY - hullH - 20, 16, 6)
  if (burning) {
    flameTongue(ctx, x + w * 0.3, waterY - hullH, 7, 13)
    flameTongue(ctx, x + w * 0.55, waterY - hullH, 9, 17)
    flameTongue(ctx, x + w * 0.78, waterY - hullH, 6, 11)
  }
}

/**
 * The per-stage landmark strip, bottom-rooted at MARKS_H. Every shape either
 * sits fully interior (margins at both tile edges) or wraps as one continuous
 * wall across the seam - the unit suite checks each kind for a seam column.
 */
export function paintMarks(ctx: Ctx, kind: MarksKind): void {
  ctx.clearRect(0, 0, TILE_W, MARKS_H)
  const B = MARKS_H
  switch (kind) {
    case 'gorge': {
      // Flanking cliff walls that meet across the seam as one gorge wall.
      ctx.fillStyle = '#6a6a72'
      ctx.fillRect(0, 18, 46, B - 18)
      ctx.fillRect(TILE_W - 46, 18, 46, B - 18)
      ctx.fillStyle = '#4a4a52'
      for (const y of [28, 40, 52]) {
        ctx.fillRect(0, y, 46, 2)
        ctx.fillRect(TILE_W - 46, y, 46, 2)
      }
      ctx.fillStyle = '#5a7a4a'
      ctx.fillRect(0, 14, 46, 4)
      ctx.fillRect(TILE_W - 46, 14, 46, 4)
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(46, 18)
      ctx.lineTo(46, B)
      ctx.moveTo(TILE_W - 46, 18)
      ctx.lineTo(TILE_W - 46, B)
      ctx.stroke()
      warBanner(ctx, 96, B, 30, '#a01818')
      warBanner(ctx, 160, B, 30, '#1a3a8f')
      break
    }
    case 'village': {
      rooftop(ctx, 24, B, 56, 22)
      rooftop(ctx, 104, B, 64, 26)
      rooftop(ctx, 192, B, 48, 20)
      for (const [tx, th] of [
        [16, 16],
        [92, 12],
        [176, 14],
      ] as const) {
        ctx.fillStyle = '#4a3018'
        ctx.fillRect(tx, B - th, 3, th)
        ctx.fillStyle = '#3a6a2a'
        ctx.beginPath()
        ctx.arc(tx + 1.5, B - th - 3, 7, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'riverbank': {
      ctx.fillStyle = '#3a6a8a'
      ctx.fillRect(0, B - 22, TILE_W, 22)
      ctx.fillStyle = 'rgba(207, 232, 255, 0.75)'
      for (let i = 0; i < 4; i += 1) ctx.fillRect(i * 64 + 12, B - 14, 18, 2)
      ctx.fillStyle = '#2f5b39'
      ctx.fillRect(0, B - 26, TILE_W, 4)
      for (let i = 0; i < 8; i += 1) {
        const x = i * 32 + 10
        ctx.fillStyle = '#4a7a3a'
        ctx.fillRect(x, B - 40, 2, 16)
        ctx.fillRect(x - 3, B - 38, 8, 2)
      }
      break
    }
    case 'bridge': {
      // One arch period over the tile: periodic by construction.
      ctx.fillStyle = '#6a5a4a'
      ctx.fillRect(0, B - 10, TILE_W, 10)
      for (const px of [32, 96, 160, 224]) {
        ctx.fillStyle = '#8a8a8a'
        ctx.fillRect(px - 3, 28, 6, B - 28)
      }
      ctx.fillStyle = '#7a5230'
      ctx.beginPath()
      ctx.moveTo(0, B - 10)
      for (let x = 0; x <= TILE_W; x += 4) {
        ctx.lineTo(x, B - 22 - 8 * Math.cos(((x / TILE_W) * Math.PI * 2)))
      }
      ctx.lineTo(TILE_W, B - 10)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.4
      ctx.stroke()
      for (let x = 8; x < TILE_W; x += 16) {
        const y = B - 22 - 8 * Math.cos(((x / TILE_W) * Math.PI * 2))
        ctx.fillStyle = '#5a3a20'
        ctx.fillRect(x, y - 8, 2, 8)
      }
      break
    }
    case 'outskirts': {
      for (let x = 0; x < TILE_W; x += 16) {
        ctx.fillStyle = '#5a4028'
        ctx.beginPath()
        ctx.moveTo(x, B)
        ctx.lineTo(x + 4, B - 26)
        ctx.lineTo(x + 8, B)
        ctx.closePath()
        ctx.fill()
      }
      for (const tx of [56, 168]) {
        ctx.fillStyle = '#a89878'
        ctx.beginPath()
        ctx.moveTo(tx, B)
        ctx.lineTo(tx + 20, B - 20)
        ctx.lineTo(tx + 40, B)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = INK
        ctx.lineWidth = 1
        ctx.stroke()
      }
      warBanner(ctx, 128, B, 34, '#a01818')
      warBanner(ctx, 224, B, 30, '#c8a828')
      break
    }
    case 'warships': {
      ctx.fillStyle = '#2a4a5a'
      ctx.fillRect(0, B - 12, TILE_W, 12)
      ctx.fillStyle = 'rgba(207, 232, 255, 0.5)'
      for (let i = 0; i < 4; i += 1) ctx.fillRect(i * 64 + 8, B - 8, 22, 1.6)
      warship(ctx, 24, B - 12, 88, false)
      warship(ctx, 152, B - 12, 88, false)
      break
    }
    case 'inferno': {
      // Red cliff walls wrapping the seam, burning hulls mid-tile.
      ctx.fillStyle = '#8a2a1a'
      ctx.fillRect(0, 12, 42, B - 12)
      ctx.fillRect(TILE_W - 42, 12, 42, B - 12)
      ctx.fillStyle = '#5a1a10'
      for (const y of [26, 40, 54]) {
        ctx.fillRect(0, y, 42, 2)
        ctx.fillRect(TILE_W - 42, y, 42, 2)
      }
      ctx.fillStyle = '#2a4a5a'
      ctx.fillRect(42, B - 12, TILE_W - 84, 12)
      warship(ctx, 88, B - 12, 80, true)
      flameTongue(ctx, 60, B - 12, 8, 15)
      flameTongue(ctx, 196, B - 12, 8, 15)
      break
    }
    case 'flagship': {
      ctx.fillStyle = '#2a3a5a'
      ctx.fillRect(0, B - 12, TILE_W, 12)
      warship(ctx, 72, B - 12, 112, false)
      // Command tower with gold trim.
      ctx.fillStyle = '#5a4a6a'
      ctx.fillRect(116, B - 40, 24, 28)
      ctx.fillStyle = '#c8a828'
      ctx.fillRect(116, B - 40, 24, 2)
      ctx.fillRect(116, B - 28, 24, 2)
      ctx.strokeStyle = INK
      ctx.lineWidth = 1
      ctx.strokeRect(116, B - 40, 24, 28)
      warBanner(ctx, 96, B - 12, 26, '#3a2a4a')
      warBanner(ctx, 168, B - 12, 26, '#3a2a4a')
      break
    }
    case 'arena': {
      // Four sawtooth periods with a brazier on each: the strip repeats
      // every 64px, so the seam falls mid-pattern, not on a shape. The path
      // runs a full period past each edge so every peak - including the one
      // the seam cuts - has identical incoming and outgoing joints; a path
      // that STARTED at x=0 would miter that peak differently from the rest.
      ctx.fillStyle = '#241a26'
      ctx.beginPath()
      ctx.moveTo(-64, B)
      for (let x = -64; x <= TILE_W + 64; x += 2) {
        const u = (x / TILE_W) * 4
        const tri = Math.abs((((u % 1) + 1) % 1)) * 2 - 1
        ctx.lineTo(x, 30 + tri * 12)
      }
      ctx.lineTo(TILE_W + 64, B)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.4
      ctx.stroke()
      for (const bx of [32, 96, 160, 224]) {
        ctx.fillStyle = '#8a6a2a'
        ctx.fillRect(bx - 4, B - 12, 8, 4)
        ctx.fillRect(bx - 1, B - 8, 2, 8)
        flameTongue(ctx, bx, B - 12, 9, 14)
      }
      break
    }
  }
}

/**
 * The fire strip: sparse embers and smoke puffs on a transparent tile. The
 * scene drifts it upward by sim tick, so embers rise deterministically and
 * identically on both renderers. Point sprites may clip at the seam; the
 * suite allows a sub-percent mismatch for this layer only.
 */
export function paintEmbers(ctx: Ctx): void {
  ctx.clearRect(0, 0, TILE_W, EMBERS_H)
  for (let i = 0; i < 8; i += 1) {
    const x = (i * 97 + 13) % TILE_W
    const y = (i * 53 + 19) % EMBERS_H
    const r = 3 + (i % 3)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(120, 110, 110, 0.2)')
    g.addColorStop(1, 'rgba(120, 110, 110, 0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  for (let i = 0; i < 36; i += 1) {
    const x = (i * 53 + 7) % TILE_W
    const y = (i * 37 + 5) % EMBERS_H
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 215, 106, 0.9)' : 'rgba(232, 84, 24, 0.85)'
    ctx.fillRect(x, y, 2, 2)
  }
}
