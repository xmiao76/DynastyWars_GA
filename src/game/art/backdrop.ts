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

export type MarksKind =
  | 'gorge'
  | 'village'
  | 'riverbank'

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
  // UIR-9 repaint: atmospheric five-stop grade (zenith depth, mid-sky body,
  // horizon warmth) instead of a flat two-colour ramp. X-uniform throughout.
  const grad = ctx.createLinearGradient(0, 0, 0, SKY_H)
  grad.addColorStop(0, css(shade(topColor, 0.3)))
  grad.addColorStop(0.38, css(topColor))
  grad.addColorStop(0.62, css(tint(topColor, 0.14)))
  grad.addColorStop(0.85, css(tint(bottomColor, 0.1)))
  grad.addColorStop(1, css(bottomColor))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, TILE_W, SKY_H)

  // Broken colour: soft mottled patches (warm/cool alternation) + whisper
  // striations. Strong enough to read as painted atmosphere next to the
  // cast, quiet enough to stay beneath it. Blobs sit mid-tile so neither
  // edge feels them and the seam stays clean.
  const mottle: Array<[number, number, number, string]> = [
    [52, 70, 42, 'rgba(255,244,220,0.3)'],
    [128, 140, 48, 'rgba(150,175,215,0.3)'],
    [204, 70, 40, 'rgba(255,244,220,0.27)'],
    [80, 210, 45, 'rgba(255,240,210,0.24)'],
    [176, 225, 42, 'rgba(160,185,220,0.27)'],
    [128, 40, 38, 'rgba(255,246,225,0.18)'],
  ]
  for (const [mx, my, mr, mc] of mottle) {
    const blob = ctx.createRadialGradient(mx, my, 2, mx, my, mr)
    blob.addColorStop(0, mc)
    blob.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = blob
    ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2)
  }
  // Thin cirrus streaks, full-width and x-uniform (seam-safe), each with a
  // soft three-row profile. Few and faint: they must read as high cloud,
  // not as ruled lines (an earlier five-line pass banded visibly).
  const cirrus: Array<[number, string]> = [
    [60, 'rgba(255,255,255,0.16)'],
    [140, 'rgba(255,255,255,0.13)'],
    [220, 'rgba(255,255,255,0.12)'],
  ]
  for (const [cy, cc] of cirrus) {
    ctx.fillStyle = cc.replace(/[\d.]+\)$/, (m) => `${parseFloat(m) * 0.35})`)
    ctx.fillRect(0, cy - 1, TILE_W, 1)
    ctx.fillStyle = cc
    ctx.fillRect(0, cy, TILE_W, 1)
    ctx.fillStyle = cc.replace(/[\d.]+\)$/, (m) => `${parseFloat(m) * 0.35})`)
    ctx.fillRect(0, cy + 1, TILE_W, 1)
  }
  // (No regular striations: an every-9px pass read as corduroy at gameplay
  // size. The grain below carries the fine tooth instead.)

  // Sun glow, low and warm. Drawn into the tile so it repeats with the sky
  // rather than sitting on a separate layer that has to be scrolled in step.
  // The off-centre sun would break the tile's periodicity (column 0 and
  // column 255 would meet different glow), so a wrapped copy at -58 keeps
  // both edges on the same falloff: the seam step is one pixel of gradient.
  for (const gx of [198, 198 - TILE_W]) {
    const glow = ctx.createRadialGradient(gx, 176, 4, gx, 176, 92)
    glow.addColorStop(0, 'rgba(255, 232, 160, 0.85)')
    glow.addColorStop(0.45, 'rgba(255, 208, 120, 0.36)')
    glow.addColorStop(1, 'rgba(255, 200, 110, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 60, TILE_W, SKY_H - 60)
    // Bright core: the day sun reads warm white.
    const core = ctx.createRadialGradient(gx, 176, 1, gx, 176, 20)
    core.addColorStop(0, 'rgba(255,246,220,0.95)')
    core.addColorStop(0.55, 'rgba(255,225,150,0.45)')
    core.addColorStop(1, 'rgba(255,210,130,0)')
    ctx.fillStyle = core
    ctx.fillRect(0, 60, TILE_W, SKY_H - 60)
  }

  // Haze bands with soft-falloff edges, x-uniform.
  const band = (y: number, h: number, color: string): void => {
    const g = ctx.createLinearGradient(0, y, 0, y + h)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(0.3, color)
    g.addColorStop(0.7, color)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, y, TILE_W, h)
  }
  band(74, 9, 'rgba(255, 255, 255, 0.09)')
  band(118, 5, 'rgba(255, 255, 255, 0.09)')
  band(196, 12, 'rgba(255, 255, 255, 0.06)')

  // Deterministic paint tooth: achromatic per-pixel grain, the pigment of
  // the sky. The 17-mod hash keeps the seam exact (255 = 15*17, so column
  // 255 and column 0 hash identically) and the pattern never repeats
  // visibly. Applied last so it grains the light too. This carries the
  // per-block tonal floor, so the cirrus above can stay faint.
  const img = ctx.getImageData(0, 0, TILE_W, SKY_H)
  const dd = img.data
  for (let y = 0; y < SKY_H; y += 1) {
    for (let x = 0; x < TILE_W; x += 1) {
      const v = (((x * 73 + y * 149) % 17) - 8) * 1.6
      const i = (y * TILE_W + x) * 4
      dd[i] = Math.max(0, Math.min(255, (dd[i] ?? 0) + v))
      dd[i + 1] = Math.max(0, Math.min(255, (dd[i + 1] ?? 0) + v))
      dd[i + 2] = Math.max(0, Math.min(255, (dd[i + 2] ?? 0) + v))
    }
  }
  ctx.putImageData(img, 0, 0)
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
  // UIR-10: aerial falloff (pale crown dissolving toward haze at the base).
  ctx.save()
  ridgePath(ctx, 36, 25, 0.8, RIDGE_H)
  ctx.clip()
  const far = ctx.createLinearGradient(0, 0, 0, RIDGE_H)
  far.addColorStop(0, css(tint(hillColor, 0.52)))
  far.addColorStop(0.45, css(tint(hillColor, 0.34)))
  far.addColorStop(1, css(hazeColor))
  ctx.fillStyle = far
  ctx.fillRect(0, 0, TILE_W, RIDGE_H)
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  for (const [mx, my, mr] of [[70, 30, 26], [150, 24, 30], [210, 34, 22]] as const) {
    const puff = ctx.createRadialGradient(mx, my, 1, mx, my, mr)
    puff.addColorStop(0, 'rgba(255,255,255,0.16)')
    puff.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = puff
    ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2)
  }
  ctx.restore()
  ridgePath(ctx, 36, 25, 0.8, RIDGE_H)
  ctx.strokeStyle = 'rgba(20, 15, 20, 0.35)'
  ctx.lineWidth = 1.6
  ctx.stroke()

  // Near ridge: the stage colour graded crest-to-base, with the ink line the
  // whole game shares. UIR-10: lit crown, rich mid, shaded flank dissolving
  // into the haze join.
  ctx.save()
  ridgePath(ctx, 62, 27, 2.6, RIDGE_H)
  ctx.clip()
  const near = ctx.createLinearGradient(0, 30, 0, RIDGE_H)
  near.addColorStop(0, css(tint(hillColor, 0.32)))
  near.addColorStop(0.35, css(hillColor))
  near.addColorStop(0.7, css(shade(hillColor, 0.22)))
  near.addColorStop(1, css(shade(hillColor, 0.38)))
  ctx.fillStyle = near
  ctx.fillRect(0, 30, TILE_W, RIDGE_H - 30)
  for (const [mx, my, mr, ma] of [[64, 72, 30, 0.2], [140, 66, 36, 0.18], [208, 74, 28, 0.2]] as const) {
    const shadeBlob = ctx.createRadialGradient(mx, my, 1, mx, my, mr)
    shadeBlob.addColorStop(0, `rgba(10, 12, 10, ${ma})`)
    shadeBlob.addColorStop(1, 'rgba(10, 12, 10, 0)')
    ctx.fillStyle = shadeBlob
    ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2)
  }
  ctx.restore()
  ridgePath(ctx, 62, 27, 2.6, RIDGE_H)
  ctx.strokeStyle = INK
  ctx.lineWidth = 2.2
  ctx.stroke()

  // Lit crest: sunward light fading down from the ridgeline, clipped to the
  // near ridge.
  ctx.save()
  ridgePath(ctx, 62, 27, 2.6, RIDGE_H)
  ctx.clip()
  for (let x = 0; x <= TILE_W; x += 2) {
    const y = ridgeY(x, 62, 27, 2.6)
    const crest = ctx.createLinearGradient(0, y, 0, y + 9)
    crest.addColorStop(0, css(tint(hillColor, 0.42)))
    crest.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = crest
    ctx.fillRect(x, y, 2, 9)
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

  // Paint tooth, same 17-mod hash as the sky (seam-exact), gentler: the
  // ridge sits closer than the sky but darker, so ±10 reads as pigment.
  const img = ctx.getImageData(0, 0, TILE_W, RIDGE_H)
  const dd = img.data
  for (let y = 0; y < RIDGE_H; y += 1) {
    for (let x = 0; x < TILE_W; x += 1) {
      const i = (y * TILE_W + x) * 4
      if ((dd[i + 3] ?? 0) < 128) continue
      const v = (((x * 73 + y * 149) % 17) - 8) * 1.25
      dd[i] = Math.max(0, Math.min(255, (dd[i] ?? 0) + v))
      dd[i + 1] = Math.max(0, Math.min(255, (dd[i + 1] ?? 0) + v))
      dd[i + 2] = Math.max(0, Math.min(255, (dd[i + 2] ?? 0) + v))
    }
  }
  ctx.putImageData(img, 0, 0)
}

/** The walkable field: a lit band at the horizon falling to a richer floor.
 * UIR-11: steeper horizon-to-foreground falloff, mottled earth patches and
 * directional strokes (blades, clods, chips) instead of flat tint + dots.
 * Kept calm (low alphas) so actor shadows and hit effects still read. */
export function paintGround(ctx: Ctx, baseColor: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_H)
  grad.addColorStop(0, css(tint(baseColor, 0.38)))
  grad.addColorStop(0.22, css(tint(baseColor, 0.12)))
  grad.addColorStop(0.55, css(baseColor))
  grad.addColorStop(1, css(shade(baseColor, 0.32)))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, TILE_W, GROUND_H)

  // Mottled earth: large soft patches, darker hollows and lighter rises.
  // Mid-tile only, so the seam columns never feel them.
  const patch: Array<[number, number, number, string]> = [
    [52, 34, 34, 'rgba(0,0,0,0.1)'],
    [128, 62, 42, 'rgba(255,255,255,0.08)'],
    [204, 36, 32, 'rgba(0,0,0,0.1)'],
    [96, 92, 36, 'rgba(0,0,0,0.09)'],
    [176, 94, 30, 'rgba(255,255,255,0.07)'],
  ]
  for (const [mx, my, mr, mc] of patch) {
    const blob = ctx.createRadialGradient(mx, my, 1, mx, my, mr)
    blob.addColorStop(0, mc)
    blob.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = blob
    ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2)
  }

  // The horizon line: one ink rule, the same device as the figures' outline.
  ctx.fillStyle = INK
  ctx.globalAlpha = 0.45
  ctx.fillRect(0, 0, TILE_W, 2)
  ctx.globalAlpha = 1
  // Horizon spill: light caught just below the line.
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(0, 2, TILE_W, 3)

  // Strokes: grass blades (light, vertical), earth clods (dark, square),
  // stone chips (pale, flat). Fixed integer walks, not random, so the
  // texture is identical on every run and the vision gate's numbers stay
  // stable. All marks keep 2px clear of the tile edges for the seam test.
  const put = (x: number, y: number): [number, number] => [
    2 + (x % (TILE_W - 4)),
    4 + (y % (GROUND_H - 8)),
  ]
  ctx.fillStyle = css(tint(baseColor, 0.3))
  ctx.globalAlpha = 0.55
  for (let i = 0; i < 90; i += 1) {
    const [x, y] = put(i * 47, i * 61)
    ctx.fillRect(x, y - 2, 1, 4)
  }
  ctx.fillStyle = css(shade(baseColor, 0.32))
  ctx.globalAlpha = 0.5
  for (let i = 0; i < 70; i += 1) {
    const [x, y] = put(i * 83 + 11, i * 31 + 7)
    ctx.fillRect(x, y, 2, 2)
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)'
  ctx.globalAlpha = 1
  for (let i = 0; i < 40; i += 1) {
    const [x, y] = put(i * 53 + 5, i * 97 + 3)
    ctx.fillRect(x, y, 3, 1)
  }

  // Soil tooth: the same seam-exact 17-mod grain as sky and ridge, kept
  // gentle so the ground stays calm under the actors.
  const img = ctx.getImageData(0, 0, TILE_W, GROUND_H)
  const dd = img.data
  for (let y = 0; y < GROUND_H; y += 1) {
    for (let x = 0; x < TILE_W; x += 1) {
      const i = (y * TILE_W + x) * 4
      if ((dd[i + 3] ?? 0) < 128) continue
      const v = (((x * 73 + y * 149) % 17) - 8) * 1.2
      dd[i] = Math.max(0, Math.min(255, (dd[i] ?? 0) + v))
      dd[i + 1] = Math.max(0, Math.min(255, (dd[i + 1] ?? 0) + v))
      dd[i + 2] = Math.max(0, Math.min(255, (dd[i + 2] ?? 0) + v))
    }
  }
  ctx.putImageData(img, 0, 0)
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
  // UIR-9: each lobe is its own soft radial mass (white core fading to a
  // transparent rim), so edges dissolve instead of cutting, and overlaps
  // build density the way real cloud puffs do. Same geometry as before;
  // peaks differ per lobe (tall puffs brighter) so the core stays modeled.
  const peaks = [0.82, 0.92, 0.85, 0.74]
  lobes.forEach(([x, y, rx, ry], li) => {
    const peak = peaks[li] ?? 0.85
    const g = ctx.createRadialGradient(x, y - ry * 0.25, 1, x, y, Math.max(rx, ry))
    g.addColorStop(0, `rgba(255, 255, 255, ${peak})`)
    g.addColorStop(0.55, `rgba(244, 242, 248, ${peak * 0.7})`)
    g.addColorStop(1, 'rgba(232, 228, 240, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
  })
  // Deliberately NOT stroked. Stroking a path made of overlapping ellipses
  // outlines each one, including where they overlap, so the cloud comes out
  // with its own construction lines drawn across it. An outline would need the
  // UNION of the lobes, which a path of separate ellipses cannot give.
  // Lit top and shaded belly as soft gradient washes, clipped to the cloud.
  ctx.beginPath()
  for (const [x, y, rx, ry] of lobes) {
    ctx.moveTo(x + rx, y)
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  }
  ctx.save()
  ctx.clip()
  const lit = ctx.createLinearGradient(0, 0, 0, 18)
  lit.addColorStop(0, 'rgba(255, 252, 240, 0.75)')
  lit.addColorStop(1, 'rgba(255, 252, 240, 0)')
  ctx.fillStyle = lit
  ctx.fillRect(0, 0, CLOUD_W, 18)
  // Valley shading between the lobe crowns: the dips between puffs catch
  // less light. Fixed x (lobe junctions), soft falloff, clipped to cloud.
  for (const vx of [18, 32, 48]) {
    const dent = ctx.createLinearGradient(vx - 4, 0, vx + 4, 0)
    dent.addColorStop(0, 'rgba(140,155,190,0)')
    dent.addColorStop(0.5, 'rgba(140,155,190,0.3)')
    dent.addColorStop(1, 'rgba(140,155,190,0)')
    ctx.fillStyle = dent
    ctx.fillRect(vx - 4, 2, 8, 14)
  }
  const shade = ctx.createLinearGradient(0, 20, 0, CLOUD_H)
  shade.addColorStop(0, 'rgba(120, 140, 180, 0)')
  shade.addColorStop(1, 'rgba(105, 125, 170, 0.52)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 20, CLOUD_W, CLOUD_H - 20)
  ctx.restore()
}

/* ------------------------------------------------------------------ */
/* Landmark mid-layer (ART-19)                                         */
/* ------------------------------------------------------------------ */

/** X-uniform water: vertical grade, light shore line on top, dark base. Every
 * column identical, so full-width bands match exactly across the seam. */
function waterBand(ctx: Ctx, y0: number, shore: string, mid: string, deep: string): void {
  const g = ctx.createLinearGradient(0, y0, 0, MARKS_H)
  g.addColorStop(0, shore)
  g.addColorStop(0.3, mid)
  g.addColorStop(1, deep)
  ctx.fillStyle = g
  ctx.fillRect(0, y0, TILE_W, MARKS_H - y0)
  ctx.fillStyle = 'rgba(255,255,255,0.16)'
  ctx.fillRect(0, y0, TILE_W, 1)
}

/** Soft 64-periodic ripple glints inside a water band (4 full periods tile). */
function rippleBand(ctx: Ctx, y: number, h: number, color: string): void {
  const g = ctx.createLinearGradient(0, 0, TILE_W, 0)
  for (let i = 0; i < 4; i += 1) {
    const c = (i * 64 + 32) / TILE_W
    g.addColorStop(Math.max(0, c - 0.09), 'rgba(0,0,0,0)')
    g.addColorStop(c, color)
    g.addColorStop(Math.min(1, c + 0.09), 'rgba(0,0,0,0)')
  }
  ctx.fillStyle = g
  ctx.fillRect(0, y, TILE_W, h)
}

/** A war banner on a pole: shaded pole, folded pennant, crossbar and cords. */
function warBanner(ctx: Ctx, x: number, baseY: number, h: number, cloth: string): void {
  ctx.fillStyle = '#5a3a1e'
  ctx.fillRect(x - 1, baseY - h, 1, h)
  ctx.fillStyle = '#3a2412'
  ctx.fillRect(x, baseY - h, 1, h)
  ctx.fillStyle = '#6a4a2a'
  ctx.fillRect(x - 1, baseY - h, 11, 2)
  const g = ctx.createLinearGradient(0, baseY - h + 2, 0, baseY - h + 12)
  g.addColorStop(0, cloth)
  g.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(x, baseY - h + 2)
  ctx.lineTo(x + 10, baseY - h + 5)
  ctx.lineTo(x, baseY - h + 12)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = INK
  ctx.lineWidth = 0.8
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillRect(x + 1, baseY - h + 3, 5, 1)
}

/** A tiled rooftop: graded plaster, timber frame, shaded cap with courses. */
function rooftop(ctx: Ctx, x: number, baseY: number, w: number, h: number): void {
  const wall = ctx.createLinearGradient(0, baseY - h, 0, baseY)
  wall.addColorStop(0, '#d8c098')
  wall.addColorStop(1, '#a88868')
  ctx.fillStyle = wall
  ctx.fillRect(x + 4, baseY - h, w - 8, h)
  ctx.fillStyle = '#6a4a2c'
  ctx.fillRect(x + 8, baseY - h, 2, h)
  ctx.fillRect(x + w - 10, baseY - h, 2, h)
  ctx.fillRect(x + 4, baseY - 4, w - 8, 2)
  const roof = ctx.createLinearGradient(0, baseY - h - 10, 0, baseY - h)
  roof.addColorStop(0, '#a05a34')
  roof.addColorStop(1, '#6a3418')
  ctx.fillStyle = roof
  ctx.beginPath()
  ctx.moveTo(x - 2, baseY - h)
  ctx.lineTo(x + w / 2, baseY - h - 10)
  ctx.lineTo(x + w + 2, baseY - h)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = INK
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.save()
  ctx.clip()
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(x - 2, baseY - h - 4, w + 4, 1)
  ctx.fillRect(x - 2, baseY - h - 7, w + 4, 1)
  ctx.fillStyle = 'rgba(255,220,170,0.35)'
  ctx.fillRect(x - 2, baseY - h - 9, w + 4, 1)
  ctx.restore()
  ctx.fillStyle = '#5a2a1a'
  ctx.fillRect(x + w / 2 - 1, baseY - h - 10, 2, 5)
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
      // UIR-8: all wall paint is x-uniform (gradient + horizontal strata),
      // so the seam columns still match exactly.
      const wall = ctx.createLinearGradient(0, 18, 0, B)
      wall.addColorStop(0, '#7e7e88')
      wall.addColorStop(0.45, '#6a6a72')
      wall.addColorStop(1, '#4c4c55')
      ctx.fillStyle = wall
      ctx.fillRect(0, 18, 46, B - 18)
      ctx.fillRect(TILE_W - 46, 18, 46, B - 18)
      for (const y of [28, 40, 52]) {
        ctx.fillStyle = '#42424b'
        ctx.fillRect(0, y, 46, 2)
        ctx.fillRect(TILE_W - 46, y, 46, 2)
        ctx.fillStyle = 'rgba(255,255,255,0.14)'
        ctx.fillRect(0, y + 2, 46, 1)
        ctx.fillRect(TILE_W - 46, y + 2, 46, 1)
      }
      const lid = ctx.createLinearGradient(0, 14, 0, 18)
      lid.addColorStop(0, '#6a8a5a')
      lid.addColorStop(1, '#48663c')
      ctx.fillStyle = lid
      ctx.fillRect(0, 14, 46, 4)
      ctx.fillRect(TILE_W - 46, 14, 46, 4)
      const shadeL = ctx.createLinearGradient(43, 0, 46, 0)
      shadeL.addColorStop(0, 'rgba(0,0,0,0)')
      shadeL.addColorStop(1, 'rgba(0,0,0,0.35)')
      ctx.fillStyle = shadeL
      ctx.fillRect(43, 18, 3, B - 18)
      const shadeR = ctx.createLinearGradient(213, 0, 210, 0)
      shadeR.addColorStop(0, 'rgba(0,0,0,0)')
      shadeR.addColorStop(1, 'rgba(0,0,0,0.35)')
      ctx.fillStyle = shadeR
      ctx.fillRect(210, 18, 3, B - 18)
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
        // UIR-8: shaded trunk, radial canopy, soft ground shade (all clear
        // of the tile-edge margins).
        const shade = ctx.createRadialGradient(tx + 1.5, B - 1, 1, tx + 1.5, B - 1, 8)
        shade.addColorStop(0, 'rgba(0,0,0,0.3)')
        shade.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = shade
        ctx.fillRect(tx - 6, B - 6, 15, 6)
        ctx.fillStyle = '#5a4020'
        ctx.fillRect(tx, B - th, 1, th)
        ctx.fillStyle = '#3a2412'
        ctx.fillRect(tx + 1, B - th, 2, th)
        const crown = ctx.createRadialGradient(tx - 1, B - th - 5, 1, tx + 1.5, B - th - 3, 7)
        crown.addColorStop(0, '#4f8a3c')
        crown.addColorStop(0.6, '#3a6a2a')
        crown.addColorStop(1, '#26491e')
        ctx.fillStyle = crown
        ctx.beginPath()
        ctx.arc(tx + 1.5, B - th - 3, 7, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'riverbank': {
      // UIR-8: graded water with 64-periodic glints; reeds stay exactly
      // 32-periodic (shaded, not flat).
      waterBand(ctx, B - 22, '#7ab5d8', '#3a6a8a', '#22445c')
      rippleBand(ctx, B - 14, 2, 'rgba(207,232,255,0.75)')
      rippleBand(ctx, B - 6, 2, 'rgba(207,232,255,0.4)')
      const grass = ctx.createLinearGradient(0, B - 26, 0, B - 22)
      grass.addColorStop(0, '#3f7a49')
      grass.addColorStop(1, '#2a5232')
      ctx.fillStyle = grass
      ctx.fillRect(0, B - 26, TILE_W, 4)
      for (let i = 0; i < 8; i += 1) {
        const x = i * 32 + 10
        ctx.fillStyle = '#5a8a48'
        ctx.fillRect(x, B - 40, 1, 16)
        ctx.fillStyle = '#35662c'
        ctx.fillRect(x + 1, B - 40, 1, 16)
        const leaf = ctx.createLinearGradient(0, B - 38, 0, B - 36)
        leaf.addColorStop(0, '#5a8a48')
        leaf.addColorStop(1, '#2f5b28')
        ctx.fillStyle = leaf
        ctx.fillRect(x - 3, B - 38, 8, 2)
      }
      break
    }
  }
}
