/**
 * Procedural character-select art (UI-3): the parchment ink-wash backdrop
 * with its faction-blue roster frame and lacquer command strip, the roster
 * card frame, the cursor halo and the player pennant.
 *
 * Every piece is painted once to a canvas and shown as a texture, so canvas
 * and WebGL draw identical pixels - Phaser Graphics gradients are WebGL-only
 * and silently blank under canvas. Deterministic: scatter uses a fixed-seed
 * LCG. All functions take LOGICAL coordinates and a device scale `s`.
 * Original work in the arcade select-screen idiom (framed portraits on a
 * lacquer field); nothing here is copied from Capcom art.
 */
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../core/constants'
import { CARD, FRAME, GLOW_PAD, STRIP } from '../ui/roster'

type Ctx = CanvasRenderingContext2D

function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/** One ink-wash mountain range: soft peaks fading into mist at their base. */
function range(
  ctx: Ctx,
  seed: number,
  base: number,
  top: number,
  ink: string,
  alpha: number,
  peaks: number,
): void {
  const r = lcg(seed)
  const w = SCREEN_WIDTH
  const pts: Array<[number, number]> = []
  for (let i = 0; i <= peaks; i += 1) {
    const x = (i / peaks) * w + (r() - 0.5) * (w / peaks) * 0.6
    const y = i % 2 === 0 ? top + r() * (base - top) * 0.45 : base - (base - top) * (0.2 + r() * 0.3)
    pts.push([x, y])
  }
  ctx.beginPath()
  ctx.moveTo(-20, base + 30)
  const first = pts[0]
  if (!first) return
  ctx.lineTo(-20, first[1])
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i]
    const b = pts[i + 1]
    if (!a || !b) continue
    const mx = (a[0] + b[0]) / 2
    const my = (a[1] + b[1]) / 2
    ctx.quadraticCurveTo(a[0], a[1], mx, my)
  }
  const last = pts[pts.length - 1]
  if (last) ctx.lineTo(w + 20, last[1])
  ctx.lineTo(w + 20, base + 30)
  ctx.closePath()
  const g = ctx.createLinearGradient(0, top, 0, base + 30)
  g.addColorStop(0, `rgba(${ink}, ${alpha})`)
  g.addColorStop(0.55, `rgba(${ink}, ${alpha * 0.7})`)
  g.addColorStop(1, `rgba(${ink}, 0)`)
  ctx.fillStyle = g
  ctx.fill()
  // Dry-brush ridge line: the wash is darkest where the brush first landed.
  ctx.strokeStyle = `rgba(${ink}, ${Math.min(1, alpha * 1.3)})`
  ctx.lineWidth = 0.8
  ctx.stroke()
}

/**
 * The whole static select backdrop at SCREEN_WIDTH x SCREEN_HEIGHT logical:
 * aged parchment, three ink-wash ranges with a vermilion sun, the lacquer
 * roster frame with a gold double rim and fretwork, and the command strip.
 */
export function paintSelectBackdrop(ctx: Ctx, s: number): void {
  const w = SCREEN_WIDTH
  const h = SCREEN_HEIGHT
  ctx.save()
  ctx.scale(s, s)

  // Parchment, warmer and deeper toward the foot.
  const paper = ctx.createLinearGradient(0, 0, 0, h)
  paper.addColorStop(0, '#f1dfb4')
  paper.addColorStop(0.55, '#e4c994')
  paper.addColorStop(1, '#c9a468')
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, w, h)

  // Vermilion sun, top right, beside the heading.
  const sun = ctx.createRadialGradient(404, 17, 2, 404, 17, 15)
  sun.addColorStop(0, 'rgba(214, 64, 36, 0.95)')
  sun.addColorStop(0.8, 'rgba(190, 44, 28, 0.85)')
  sun.addColorStop(1, 'rgba(190, 44, 28, 0)')
  ctx.fillStyle = sun
  ctx.beginPath()
  ctx.arc(404, 17, 15, 0, Math.PI * 2)
  ctx.fill()

  // Ink-wash ranges, far to near. Visible above the frame and between cards.
  range(ctx, 17, 96, 6, '70, 82, 104', 0.2, 9)
  range(ctx, 41, 150, 22, '44, 52, 70', 0.3, 7)
  range(ctx, 83, 250, 196, '26, 30, 42', 0.55, 6)

  // Mist bands across the foot of the ranges.
  for (const [y, a] of [
    [214, 0.35],
    [258, 0.25],
  ] as const) {
    const m = ctx.createLinearGradient(0, y - 8, 0, y + 8)
    m.addColorStop(0, 'rgba(241, 223, 180, 0)')
    m.addColorStop(0.5, `rgba(241, 223, 180, ${a})`)
    m.addColorStop(1, 'rgba(241, 223, 180, 0)')
    ctx.fillStyle = m
    ctx.fillRect(0, y - 8, w, 16)
  }

  // Paper grain and fibres.
  const gr = lcg(2207)
  for (let i = 0; i < 1400; i += 1) {
    ctx.fillStyle = `rgba(110, 72, 30, ${0.05 + gr() * 0.07})`
    ctx.fillRect(gr() * w, gr() * h, 0.6 + gr() * 0.8, 0.6)
  }
  ctx.strokeStyle = 'rgba(120, 80, 36, 0.08)'
  ctx.lineWidth = 0.5
  for (let i = 0; i < 60; i += 1) {
    const fx = gr() * w
    const fy = gr() * h
    ctx.beginPath()
    ctx.moveTo(fx, fy)
    ctx.lineTo(fx + (gr() - 0.5) * 18, fy + (gr() - 0.5) * 4)
    ctx.stroke()
  }

  // Burnt edge: the sheet darkens toward its corners.
  const edge = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.62)
  edge.addColorStop(0, 'rgba(90, 50, 20, 0)')
  edge.addColorStop(1, 'rgba(70, 36, 12, 0.5)')
  ctx.fillStyle = edge
  ctx.fillRect(0, 0, w, h)

  paintRosterFrame(ctx)
  paintCommandStrip(ctx)
  ctx.restore()
}

/** The faction-blue lacquer field the five cards stand in. */
function paintRosterFrame(ctx: Ctx): void {
  const { x, y, w, h } = FRAME
  // Drop shadow onto the parchment.
  ctx.fillStyle = 'rgba(30, 16, 6, 0.45)'
  roundRect(ctx, x + 2, y + 3, w, h, 4)
  ctx.fill()
  // Lacquer field: deep blue with a lighter band under the top rail.
  const field = ctx.createLinearGradient(0, y, 0, y + h)
  field.addColorStop(0, '#1d3f94')
  field.addColorStop(0.18, '#12296a')
  field.addColorStop(1, '#0a173e')
  ctx.fillStyle = field
  roundRect(ctx, x, y, w, h, 4)
  ctx.fill()
  // Key-fret lattice, faint, so the field has a surface rather than a fill.
  ctx.save()
  roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 2)
  ctx.clip()
  ctx.strokeStyle = 'rgba(106, 150, 230, 0.12)'
  ctx.lineWidth = 0.8
  const step = 12
  for (let gx = x; gx < x + w; gx += step) {
    for (let gy = y; gy < y + h; gy += step) {
      ctx.beginPath()
      ctx.moveTo(gx + 2, gy + 2)
      ctx.lineTo(gx + 10, gy + 2)
      ctx.lineTo(gx + 10, gy + 10)
      ctx.lineTo(gx + 5, gy + 10)
      ctx.lineTo(gx + 5, gy + 6)
      ctx.stroke()
    }
  }
  ctx.restore()
  // Gold double rim: bright outer, bronze inner rule.
  const rim = ctx.createLinearGradient(0, y, 0, y + h)
  rim.addColorStop(0, '#fff0a0')
  rim.addColorStop(0.5, '#e8b820')
  rim.addColorStop(1, '#8a5a1a')
  ctx.strokeStyle = rim
  ctx.lineWidth = 2.4
  roundRect(ctx, x, y, w, h, 4)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(216, 168, 104, 0.8)'
  ctx.lineWidth = 0.8
  roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 2)
  ctx.stroke()
  // Corner bosses.
  for (const [cx, cy] of [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ] as const) {
    ctx.fillStyle = '#8a5a1a'
    ctx.beginPath()
    ctx.arc(cx, cy, 4.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffd23c'
    ctx.beginPath()
    ctx.arc(cx - 0.6, cy - 0.6, 2.6, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** The lacquer command strip with pointed end caps. */
function paintCommandStrip(ctx: Ctx): void {
  const { x, y, w, h } = STRIP
  const cap = h / 2
  const path = (): void => {
    ctx.beginPath()
    ctx.moveTo(x, y + h / 2)
    ctx.lineTo(x + cap, y)
    ctx.lineTo(x + w - cap, y)
    ctx.lineTo(x + w, y + h / 2)
    ctx.lineTo(x + w - cap, y + h)
    ctx.lineTo(x + cap, y + h)
    ctx.closePath()
  }
  ctx.fillStyle = 'rgba(30, 16, 6, 0.4)'
  ctx.save()
  ctx.translate(1.5, 2.5)
  path()
  ctx.fill()
  ctx.restore()
  const g = ctx.createLinearGradient(0, y, 0, y + h)
  g.addColorStop(0, '#24305e')
  g.addColorStop(0.4, '#101a3e')
  g.addColorStop(1, '#070c22')
  ctx.fillStyle = g
  path()
  ctx.fill()
  ctx.strokeStyle = '#e8b820'
  ctx.lineWidth = 1.4
  path()
  ctx.stroke()
  // Inner hairline.
  ctx.strokeStyle = 'rgba(216, 168, 104, 0.55)'
  ctx.lineWidth = 0.6
  ctx.beginPath()
  ctx.moveTo(x + cap + 2, y + 3)
  ctx.lineTo(x + w - cap - 2, y + 3)
  ctx.moveTo(x + cap + 2, y + h - 3)
  ctx.lineTo(x + w - cap - 2, y + h - 3)
  ctx.stroke()
}

/** Card texture size in logical px (its canvas is this times the scale). */
export const CARD_TEXTURE = { width: CARD.w, height: CARD.h } as const

/**
 * The roster card frame: gold rim, dark body, bronze-lined portrait recess,
 * parchment name plate and a lacquer stat tray. The portrait and the labels
 * are live objects laid over it at the same CARD offsets.
 */
export function paintRosterCard(ctx: Ctx, s: number): void {
  const { w, h } = CARD
  ctx.save()
  ctx.scale(s, s)
  // Gold rim.
  const rim = ctx.createLinearGradient(0, 0, w, h)
  rim.addColorStop(0, '#fff0a0')
  rim.addColorStop(0.35, '#e8b820')
  rim.addColorStop(0.7, '#8a5a1a')
  rim.addColorStop(1, '#e8b820')
  ctx.fillStyle = rim
  roundRect(ctx, 0, 0, w, h, 3)
  ctx.fill()
  // Body.
  ctx.fillStyle = '#16121c'
  roundRect(ctx, 1.6, 1.6, w - 3.2, h - 3.2, 2)
  ctx.fill()
  // Portrait recess with a bronze line around it.
  const win = CARD.window
  ctx.fillStyle = '#0b0910'
  ctx.fillRect(win.x, win.y, win.w, win.h)
  ctx.strokeStyle = '#d8a868'
  ctx.lineWidth = 0.8
  ctx.strokeRect(win.x - 0.6, win.y - 0.6, win.w + 1.2, win.h + 1.2)
  // Parchment name plate.
  const pl = CARD.plate
  const paper = ctx.createLinearGradient(0, pl.y, 0, pl.y + pl.h)
  paper.addColorStop(0, '#f6e6c0')
  paper.addColorStop(1, '#dcc190')
  ctx.fillStyle = paper
  ctx.fillRect(pl.x, pl.y, pl.w, pl.h)
  ctx.strokeStyle = '#8a6a2a'
  ctx.lineWidth = 0.8
  ctx.strokeRect(pl.x + 1.5, pl.y + 1.5, pl.w - 3, pl.h - 3)
  ctx.fillStyle = '#8a6a2a'
  for (const [rx, ry] of [
    [pl.x + 3.5, pl.y + 3.5],
    [pl.x + pl.w - 3.5, pl.y + 3.5],
    [pl.x + 3.5, pl.y + pl.h - 3.5],
    [pl.x + pl.w - 3.5, pl.y + pl.h - 3.5],
  ] as const) {
    ctx.beginPath()
    ctx.arc(rx, ry, 1, 0, Math.PI * 2)
    ctx.fill()
  }
  // Stat tray.
  const tr = CARD.tray
  const tray = ctx.createLinearGradient(0, tr.y, 0, tr.y + tr.h)
  tray.addColorStop(0, '#162a66')
  tray.addColorStop(1, '#0a1433')
  ctx.fillStyle = tray
  ctx.fillRect(tr.x, tr.y, tr.w, tr.h)
  ctx.fillStyle = 'rgba(216, 168, 104, 0.7)'
  ctx.fillRect(tr.x, tr.y, tr.w, 0.8)
  ctx.restore()
}

/** Halo canvas size in logical px: the card plus GLOW_PAD on every side. */
export const GLOW_TEXTURE = { width: CARD.w + GLOW_PAD * 2, height: CARD.h + GLOW_PAD * 2 } as const

/**
 * A cursor halo: a bright rim at the card's edge whose glow spills outward.
 * Drawn BEHIND the card, so only the outer spill and the rim show.
 */
export function paintCursorGlow(ctx: Ctx, s: number, rgb: string, strength: 'primary' | 'secondary'): void {
  ctx.save()
  ctx.scale(s, s)
  const x = GLOW_PAD - 1.5
  const y = GLOW_PAD - 1.5
  const w = CARD.w + 3
  const h = CARD.h + 3
  const primary = strength === 'primary'
  // Stacked soft strokes stand in for a blur so no canvas filter is needed.
  // The primary (1P) halo is denser: gold on a gold-rimmed card needs more
  // light than blue does to read as "this one".
  const base = primary ? 0.2 : 0.08
  const rise = primary ? 0.1 : 0.05
  for (let i = GLOW_PAD; i >= 1; i -= 1) {
    ctx.strokeStyle = `rgba(${rgb}, ${Math.min(1, base + (GLOW_PAD - i) * rise)})`
    ctx.lineWidth = i * 2
    roundRect(ctx, x, y, w, h, 4)
    ctx.stroke()
  }
  ctx.strokeStyle = `rgba(${rgb}, 1)`
  ctx.lineWidth = primary ? 3 : 1.6
  roundRect(ctx, x, y, w, h, 4)
  ctx.stroke()
  if (primary) {
    // White-hot core line, so the rim reads as lit rather than as more gold.
    ctx.strokeStyle = 'rgba(255, 252, 236, 0.95)'
    ctx.lineWidth = 1
    roundRect(ctx, x, y, w, h, 4)
    ctx.stroke()
  }
  ctx.restore()
}

/** Stat pip size in logical px. */
export const PIP = { width: 7, height: 7 } as const

/** A bronze stat pip: a lit gold bead when `on`, an empty socket when not. */
export function paintPip(ctx: Ctx, s: number, on: boolean): void {
  const c = PIP.width / 2
  ctx.save()
  ctx.scale(s, s)
  ctx.fillStyle = '#3a2a10'
  ctx.beginPath()
  ctx.arc(c, c, 3.2, 0, Math.PI * 2)
  ctx.fill()
  if (on) {
    const g = ctx.createRadialGradient(c - 0.9, c - 0.9, 0.3, c, c, 2.6)
    g.addColorStop(0, '#fff3b0')
    g.addColorStop(0.45, '#ffc830')
    g.addColorStop(1, '#8a5a1a')
    ctx.fillStyle = g
  } else {
    ctx.fillStyle = '#0a1024'
  }
  ctx.beginPath()
  ctx.arc(c, c, 2.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = on ? 'rgba(255, 240, 180, 0.6)' : 'rgba(216, 168, 104, 0.45)'
  ctx.lineWidth = 0.5
  ctx.stroke()
  ctx.restore()
}

/** Pennant size in logical px. */
export const PENNANT = { width: 24, height: 14 } as const

/** A small player pennant: dark lacquer with a coloured rim and a point. */
export function paintPennant(ctx: Ctx, s: number, rgb: string): void {
  const { width: w, height: h } = PENNANT
  ctx.save()
  ctx.scale(s, s)
  const path = (): void => {
    ctx.beginPath()
    ctx.moveTo(1, 1)
    ctx.lineTo(w - 1, 1)
    ctx.lineTo(w - 1, h - 5)
    ctx.lineTo(w / 2, h - 1)
    ctx.lineTo(1, h - 5)
    ctx.closePath()
  }
  ctx.fillStyle = '#0e0b14'
  path()
  ctx.fill()
  ctx.strokeStyle = `rgba(${rgb}, 1)`
  ctx.lineWidth = 1.4
  path()
  ctx.stroke()
  ctx.restore()
}
