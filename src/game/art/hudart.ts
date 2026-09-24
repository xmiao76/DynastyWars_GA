/**
 * Procedural HUD art (UI-4): the WoF-style top-band kit. Player plates with
 * medallion frames, the flaming-pearl special lamp, lives pips, the WAVE
 * chip, the "GO →" chevrons, the full-width boss rail, the nameplate banner
 * backing, and the bronze-lacquer touch controls.
 *
 * Every piece is painted once into a canvas texture, so canvas and WebGL
 * render identical pixels (Phaser Graphics gradients are WebGL-only and
 * silently blank under canvas). Everything takes LOGICAL coordinates and a
 * device scale `s`; nothing reads a Scene. Original work in the CPS-1
 * beat-'em-up HUD idiom; no Capcom art is copied.
 */
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../core/constants'
import { THEME, css } from '../ui/theme'

type Ctx = CanvasRenderingContext2D

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

/** One plate stud: an ink bezel with a bronze-gold rivet inside. */
function stud(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = css(THEME.ink)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x, y, r * 0.6, 0, Math.PI * 2)
  const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r * 0.6)
  g.addColorStop(0, '#ffe890')
  g.addColorStop(0.6, css(THEME.bronze))
  g.addColorStop(1, '#4a3312')
  ctx.fillStyle = g
  ctx.fill()
}

/* ------------------------------------------------------------------ */
/* Player plate                                                        */
/* ------------------------------------------------------------------ */

export const PLATE_TEX = { width: 186, height: 36 } as const

/**
 * A lacquer plate with accent rails (gold for P1, azure for P2), bronze
 * studs and a soft upper sheen. The centre-left is left empty: the medallion
 * sits over it in the scene.
 */
export function paintPlate(ctx: Ctx, s: number, variant: 'p1' | 'p2'): void {
  ctx.save()
  ctx.scale(s, s)
  const { width: w, height: h } = PLATE_TEX
  const accent = variant === 'p1' ? THEME.gold : THEME.lacquerLine
  const accentBright = variant === 'p1' ? THEME.goldBright : THEME.frost

  // Body: lacquer gradient, notched chevron ends.
  ctx.beginPath()
  ctx.moveTo(2, 0)
  ctx.lineTo(w - 6, 0)
  ctx.lineTo(w, h / 2)
  ctx.lineTo(w - 6, h)
  ctx.lineTo(2, h)
  ctx.closePath()
  const body = ctx.createLinearGradient(0, 0, 0, h)
  body.addColorStop(0, 'rgba(28, 22, 38, 0.96)')
  body.addColorStop(0.5, 'rgba(12, 10, 18, 0.94)')
  body.addColorStop(1, 'rgba(18, 12, 26, 0.96)')
  ctx.fillStyle = body
  ctx.fill()

  // Accent rails top and bottom.
  ctx.fillStyle = css(accent)
  ctx.fillRect(2, 0, w - 9, 1.6)
  ctx.fillRect(2, h - 1.6, w - 9, 1.6)
  ctx.fillStyle = css(accentBright)
  ctx.fillRect(2, 1.6, w - 9, 0.9)
  ctx.fillRect(2, h - 2.5, w - 9, 0.9)

  // Upper sheen.
  const sheen = ctx.createLinearGradient(0, 2, 0, 12)
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.10)')
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = sheen
  ctx.fillRect(2, 2, w - 9, 10)

  // Outer tip: accent chevron cap with an ink outline.
  ctx.beginPath()
  ctx.moveTo(w - 6, 0)
  ctx.lineTo(w, h / 2)
  ctx.lineTo(w - 6, h)
  ctx.closePath()
  ctx.fillStyle = css(accent)
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = css(THEME.ink)
  ctx.beginPath()
  ctx.moveTo(2, 0)
  ctx.lineTo(w - 6, 0)
  ctx.lineTo(w, h / 2)
  ctx.lineTo(w - 6, h)
  ctx.lineTo(2, h)
  ctx.closePath()
  ctx.stroke()

  stud(ctx, w - 13, h / 2, 2.2)
  ctx.restore()
}

/* ------------------------------------------------------------------ */
/* Medallion                                                           */
/* ------------------------------------------------------------------ */

export const MEDAL_TEX = { width: 34, height: 34 } as const

/**
 * A bronze ring medallion. The centre window shows the hero portrait when
 * one is passed in (aspect-cropped to the disc); standalone it stays dark.
 */
export function paintMedallion(ctx: Ctx, s: number, portrait?: CanvasImageSource): void {
  ctx.save()
  ctx.scale(s, s)
  const cx = MEDAL_TEX.width / 2
  const cy = MEDAL_TEX.height / 2
  const ringR = cx - 1

  // Bronze ring with a gold rim.
  ctx.beginPath()
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
  const ring = ctx.createLinearGradient(0, 0, 0, MEDAL_TEX.height)
  ring.addColorStop(0, '#ffd88a')
  ring.addColorStop(0.5, css(THEME.bronze))
  ring.addColorStop(1, '#4a3312')
  ctx.fillStyle = ring
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = css(THEME.ink)
  ctx.stroke()

  // Portrait window.
  const win = ringR - 3.5
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, win, 0, Math.PI * 2)
  ctx.clip()
  ctx.beginPath()
  ctx.arc(cx, cy, win, 0, Math.PI * 2)
  const winG = ctx.createLinearGradient(0, cy - win, 0, cy + win)
  winG.addColorStop(0, '#241a2e')
  winG.addColorStop(1, '#0e0a14')
  ctx.fillStyle = winG
  ctx.fill()
  if (portrait) {
    // Portrait boxes are ~0.9 aspect; crop for cover and show the face.
    const sw = 'width' in portrait ? (portrait.width as number) : win * 2
    const sh = 'height' in portrait ? (portrait.height as number) : win * 2
    const ar = sw / Math.max(1, sh)
    const dw = win * 2 * (ar >= 0.9 ? 1.05 : 1)
    const dh = dw / ar
    ctx.drawImage(portrait, cx - dw / 2, cy - win, dw, dh)
  }
  ctx.restore()

  // Inner rim shadows the window edge; rivets mark the compass points.
  ctx.beginPath()
  ctx.arc(cx, cy, win, 0, Math.PI * 2)
  ctx.lineWidth = 1.2
  ctx.strokeStyle = css(THEME.ink)
  ctx.stroke()
  for (const [x, y] of [
    [cx, 2.5],
    [cx, MEDAL_TEX.height - 2.5],
    [2.5, cy],
    [MEDAL_TEX.width - 2.5, cy],
  ] as const) {
    stud(ctx, x, y, 1.4)
  }
  ctx.restore()
}

/* ------------------------------------------------------------------ */
/* Flaming-pearl special lamp                                          */
/* ------------------------------------------------------------------ */

export const PEARL_TEX = { width: 10, height: 10 } as const

/** A pearl with flame curls above it: lit when the special is affordable. */
export function paintPearl(ctx: Ctx, s: number, lit: boolean): void {
  ctx.save()
  ctx.scale(s, s)
  const cx = PEARL_TEX.width / 2
  const cy = PEARL_TEX.height / 2 + 1

  // Flame curl above the pearl.
  ctx.beginPath()
  ctx.moveTo(cx, cy - 7)
  ctx.quadraticCurveTo(cx + 3.5, cy - 3.4, cx + 1.4, cy - 1.2)
  ctx.quadraticCurveTo(cx - 2.6, cy - 1.2, cx, cy - 7)
  ctx.closePath()
  if (lit) {
    const flame = ctx.createLinearGradient(0, cy - 7, 0, cy)
    flame.addColorStop(0, '#ffd76a')
    flame.addColorStop(1, '#e85418')
    ctx.fillStyle = flame
  } else {
    ctx.fillStyle = 'rgba(90, 80, 96, 0.9)'
  }
  ctx.fill()

  // The pearl itself: a radial glow when lit, dull brass when not.
  ctx.beginPath()
  ctx.arc(cx, cy, 3.2, 0, Math.PI * 2)
  const pearl = ctx.createRadialGradient(cx - 1, cy - 1.2, 0.4, cx, cy, 3.2)
  if (lit) {
    pearl.addColorStop(0, '#fff6c8')
    pearl.addColorStop(0.55, css(THEME.gold))
    pearl.addColorStop(1, '#7a4a10')
  } else {
    pearl.addColorStop(0, '#8a8088')
    pearl.addColorStop(1, '#3a3238')
  }
  ctx.fillStyle = pearl
  ctx.fill()
  ctx.lineWidth = 0.9
  ctx.strokeStyle = css(THEME.ink)
  ctx.stroke()
  ctx.restore()
}

/* ------------------------------------------------------------------ */
/* Lives pip                                                           */
/* ------------------------------------------------------------------ */

export const PIP_TEX = { width: 8, height: 8 } as const

/** A tiny helm bead: bronze dome with a gold rim and ink outline. */
export function paintLivesPip(ctx: Ctx, s: number): void {
  ctx.save()
  ctx.scale(s, s)
  const { width: w, height: h } = PIP_TEX
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, w / 2 - 0.6, Math.PI, 0)
  ctx.closePath()
  const dome = ctx.createLinearGradient(0, 0, 0, h)
  dome.addColorStop(0, '#d8a868')
  dome.addColorStop(0.7, css(THEME.bronze))
  dome.addColorStop(1, '#4a3312')
  ctx.fillStyle = dome
  ctx.fill()
  ctx.fillStyle = css(THEME.gold)
  ctx.fillRect(0.8, h / 2 - 0.6, w - 1.6, 1.6)
  ctx.lineWidth = 0.8
  ctx.strokeStyle = css(THEME.ink)
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, w / 2 - 0.6, Math.PI, 0)
  ctx.stroke()
  ctx.fillStyle = css(THEME.ink)
  ctx.fillRect(0, h / 2, w, 0.9)
  ctx.restore()
}

/* ------------------------------------------------------------------ */
/* WAVE chip                                                           */
/* ------------------------------------------------------------------ */

export const CHIP_TEX = { width: 56, height: 14 } as const

/** A small lacquer lozenge the WAVE n text sits on. */
export function paintChip(ctx: Ctx, s: number): void {
  ctx.save()
  ctx.scale(s, s)
  const { width: w, height: h } = CHIP_TEX
  roundRect(ctx, 0.5, 0.5, w - 1, h - 1, 4)
  const body = ctx.createLinearGradient(0, 0, 0, h)
  body.addColorStop(0, 'rgba(30, 24, 42, 0.95)')
  body.addColorStop(1, 'rgba(10, 8, 16, 0.95)')
  ctx.fillStyle = body
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = css(THEME.gold)
  roundRect(ctx, 0.5, 0.5, w - 1, h - 1, 4)
  ctx.stroke()
  ctx.fillStyle = css(THEME.gold)
  ctx.fillRect(0.5, 0.5, 2, 2)
  ctx.fillRect(w - 2.5, 0.5, 2, 2)
  ctx.fillRect(0.5, h - 2.5, 2, 2)
  ctx.fillRect(w - 2.5, h - 2.5, 2, 2)
  ctx.restore()
}

/* ------------------------------------------------------------------ */
/* GO → chevrons                                                       */
/* ------------------------------------------------------------------ */

export const GO_TEX = { width: 44, height: 14 } as const

/** Three bright chevrons, the classic beat-'em-up "advance" signal. */
export function paintGoArrow(ctx: Ctx, s: number): void {
  ctx.save()
  ctx.scale(s, s)
  const { height: h } = GO_TEX
  for (let i = 0; i < 3; i += 1) {
    const x = 4 + i * 13
    ctx.beginPath()
    ctx.moveTo(x, 1.5)
    ctx.lineTo(x + 8, h / 2)
    ctx.lineTo(x, h - 1.5)
    ctx.lineTo(x + 5.5, h / 2)
    ctx.closePath()
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#ffe46a')
    g.addColorStop(0.6, css(THEME.gold))
    g.addColorStop(1, '#b07812')
    ctx.fillStyle = g
    ctx.fill()
    ctx.lineWidth = 1.4
    ctx.lineJoin = 'round'
    ctx.strokeStyle = css(THEME.ink)
    ctx.stroke()
  }
  ctx.restore()
}

/* ------------------------------------------------------------------ */
/* Boss rail                                                           */
/* ------------------------------------------------------------------ */

export const RAIL_TEX = { width: 480, height: 18 } as const

/**
 * The full-width boss rail: a crimson-lacquer strip with gold top/bottom
 * rails and an ink divider where the name meets the bar lane.
 */
export function paintRail(ctx: Ctx, s: number): void {
  ctx.save()
  ctx.scale(s, s)
  const { width: w, height: h } = RAIL_TEX
  const body = ctx.createLinearGradient(0, 0, 0, h)
  body.addColorStop(0, 'rgba(52, 18, 24, 0.94)')
  body.addColorStop(0.55, 'rgba(32, 10, 16, 0.94)')
  body.addColorStop(1, 'rgba(20, 8, 12, 0.94)')
  ctx.fillStyle = body
  ctx.fillRect(0, 0, w, h)
  // Gold rails with a crimson inner line.
  ctx.fillStyle = css(THEME.gold)
  ctx.fillRect(0, 0, w, 1.4)
  ctx.fillRect(0, h - 1.4, w, 1.4)
  ctx.fillStyle = css(THEME.crimson)
  ctx.fillRect(0, 1.4, w, 0.8)
  ctx.fillRect(0, h - 2.2, w, 0.8)
  // Divider between name lane and bar lane at x=104.
  ctx.fillStyle = css(THEME.ink)
  ctx.fillRect(104, 0, 1, h)
  ctx.fillStyle = 'rgba(232, 184, 32, 0.5)'
  ctx.fillRect(105, 0, 0.8, h)
  ctx.restore()
}

/* ------------------------------------------------------------------ */
/* Nameplate banner                                                    */
/* ------------------------------------------------------------------ */

export const BANNER_TEX = { width: 320, height: 44 } as const

/**
 * The stage/boss nameplate backing: a plaque with accent rails and end
 * caps. `gold` for stage entry, `red` for boss warning.
 */
export function paintBanner(ctx: Ctx, s: number, variant: 'gold' | 'red'): void {
  ctx.save()
  ctx.scale(s, s)
  const { width: w, height: h } = BANNER_TEX
  const accent = variant === 'gold' ? THEME.gold : THEME.crimson
  const accentDeep = variant === 'gold' ? THEME.goldDeep : THEME.dangerDeep

  const body = ctx.createLinearGradient(0, 0, 0, h)
  body.addColorStop(0, 'rgba(20, 15, 26, 0.96)')
  body.addColorStop(0.5, 'rgba(12, 10, 18, 0.94)')
  body.addColorStop(1, 'rgba(16, 12, 22, 0.96)')
  ctx.fillStyle = body
  ctx.fillRect(8, 4, w - 16, h - 8)

  // Accent rails above and below the plaque.
  ctx.fillStyle = css(accent)
  ctx.fillRect(0, 0, w, 3)
  ctx.fillRect(0, h - 3, w, 3)
  ctx.fillStyle = css(accentDeep)
  ctx.fillRect(0, 3, w, 1)
  ctx.fillRect(0, h - 4, w, 1)

  // End caps with diamond inlays.
  for (const side of [0, 1] as const) {
    const x = side === 0 ? 0 : w - 8
    ctx.fillStyle = css(accentDeep)
    ctx.fillRect(x, 2, 8, h - 4)
    ctx.lineWidth = 1
    ctx.strokeStyle = css(THEME.ink)
    ctx.strokeRect(x + 0.5, 2.5, 7, h - 5)
    ctx.beginPath()
    ctx.moveTo(x + 4, h / 2 - 4)
    ctx.lineTo(x + 7, h / 2)
    ctx.lineTo(x + 4, h / 2 + 4)
    ctx.lineTo(x + 1, h / 2)
    ctx.closePath()
    ctx.fillStyle = css(accent)
    ctx.fill()
  }

  // Faint crown sheen over the body.
  const sheen = ctx.createLinearGradient(0, 4, 0, 14)
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.08)')
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = sheen
  ctx.fillRect(8, 4, w - 16, 10)
  ctx.restore()
}

/* ------------------------------------------------------------------ */
/* Touch controls (full-screen sheet at the same hit-zone coordinates) */
/* ------------------------------------------------------------------ */

export const TOUCH_TEX = { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } as const

export interface TouchGeometry {
  padCx: number
  padCy: number
  padArm: number
  btnR: number
  buttons: ReadonlyArray<{ x: number; y: number }>
  pauseCx: number
  pauseCy: number
  pauseR: number
}

/**
 * The on-screen controls as bronze-lacquer buttons: a cross pad with gold
 * chevrons, three face buttons, and the pause coin. Positions come from the
 * touch adapter's constant geometry so art and hit zones can never drift.
 */
export function paintTouchControls(ctx: Ctx, s: number, geo: TouchGeometry): void {
  ctx.save()
  ctx.scale(s, s)
  const { padCx, padCy, padArm, btnR, buttons, pauseCx, pauseCy, pauseR } = geo

  const armPath = (dx: number, dy: number): void => {
    roundRect(ctx, padCx + dx - padArm / 2, padCy + dy - padArm / 2, padArm, padArm, 4)
  }
  const lacquerFace = (): void => {
    const g = ctx.createLinearGradient(0, padCy - padArm * 2, 0, padCy + padArm * 2)
    g.addColorStop(0, '#3a2a44')
    g.addColorStop(1, '#161020')
    ctx.fillStyle = g
    ctx.fill()
    ctx.lineWidth = 1.2
    ctx.strokeStyle = css(THEME.bronze)
    ctx.stroke()
  }

  // D-pad cross.
  for (const [dx, dy] of [
    [0, -padArm],
    [0, padArm],
    [-padArm, 0],
    [padArm, 0],
  ] as const) {
    armPath(dx, dy)
    lacquerFace()
  }
  // Gold chevron inside each arm, pointing the way it moves.
  ctx.fillStyle = css(THEME.gold)
  ctx.strokeStyle = css(THEME.ink)
  ctx.lineWidth = 0.8
  const chevron = (cx: number, cy: number, angle: number): void => {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(-2.4, -3.4)
    ctx.lineTo(0, -1)
    ctx.lineTo(2.4, -3.4)
    ctx.lineTo(2.4, -2.4)
    ctx.lineTo(0, 0)
    ctx.lineTo(-2.4, -2.4)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }
  chevron(padCx, padCy - padArm, 0)
  chevron(padCx, padCy + padArm, Math.PI)
  chevron(padCx - padArm, padCy, -Math.PI / 2)
  chevron(padCx + padArm, padCy, Math.PI / 2)

  // Face buttons (the three attack/jump/special discs).
  for (const b of buttons) {
    ctx.beginPath()
    ctx.arc(b.x, b.y, btnR, 0, Math.PI * 2)
    const ring = ctx.createRadialGradient(b.x, b.y, btnR * 0.5, b.x, b.y, btnR)
    ring.addColorStop(0, 'rgba(138, 106, 42, 0.15)')
    ring.addColorStop(0.78, css(THEME.bronze))
    ring.addColorStop(1, '#4a3312')
    ctx.fillStyle = ring
    ctx.fill()
    ctx.lineWidth = 1
    ctx.strokeStyle = css(THEME.ink)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(b.x, b.y, btnR - 3, 0, Math.PI * 2)
    const face = ctx.createRadialGradient(b.x - 2, b.y - 3, 1, b.x, b.y, btnR - 3)
    face.addColorStop(0, '#4a3858')
    face.addColorStop(1, '#1a1226')
    ctx.fillStyle = face
    ctx.fill()
  }

  // Pause coin with twin gold bars.
  ctx.beginPath()
  ctx.arc(pauseCx, pauseCy, pauseR, 0, Math.PI * 2)
  ctx.fillStyle = css(THEME.bronze)
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = css(THEME.ink)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(pauseCx, pauseCy, pauseR - 2.4, 0, Math.PI * 2)
  ctx.fillStyle = '#1a1226'
  ctx.fill()
  ctx.fillStyle = css(THEME.gold)
  ctx.fillRect(pauseCx - 4.4, pauseCy - 5.5, 3, 11)
  ctx.fillRect(pauseCx + 1.4, pauseCy - 5.5, 3, 11)
  ctx.restore()
}
