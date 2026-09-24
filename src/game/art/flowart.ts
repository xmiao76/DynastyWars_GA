/**
 * Procedural flow-screen art (UI-5): parchment cards for the scene intro,
 * the pause/continue dialogs, and the victory/defeat/complete screens, plus
 * the stat chip plate the result screen uses.
 *
 * Same rules as the rest of the baked kit: painted once to a canvas texture
 * so canvas and WebGL render identical pixels, logical coordinates times a
 * device scale `s`, no Scene or DOM access inside the painters.
 * `ensureFlowArt(scene)` bakes the lot (idempotent, guarded by key).
 * Original work in the painted-scroll idiom; no Capcom art is copied.
 */
import type Phaser from 'phaser'
import { RENDER_SCALE } from '../render'
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

/** A deckled parchment edge: fibrous top and bottom rims with tiny tears. */
function deckle(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.beginPath()
  ctx.moveTo(x + 3, y + 6)
  const tears = 9
  for (let i = 0; i <= tears; i += 1) {
    const tx = x + 3 + ((w - 6) * i) / tears
    const bump = i % 2 === 0 ? 2.4 : 0.8
    ctx.lineTo(tx, y + 6 - bump)
  }
  ctx.lineTo(x + w - 3, y + 6)
  ctx.lineTo(x + w - 5, y + h - 6)
  for (let i = tears; i >= 0; i -= 1) {
    const tx = x + 3 + ((w - 6) * i) / tears
    const bump = i % 2 === 0 ? 2.4 : 0.8
    ctx.lineTo(tx, y + h - 6 + bump)
  }
  ctx.closePath()
}

/** Faint laid lines - the horizontal fibres of handmade paper. */
function laidLines(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.save()
  ctx.globalAlpha = 0.06
  ctx.strokeStyle = '#5a4a2a'
  ctx.lineWidth = 0.7
  for (let ly = y + 10; ly < y + h - 8; ly += 7) {
    ctx.beginPath()
    ctx.moveTo(x + 6, ly)
    ctx.lineTo(x + w - 6, ly)
    ctx.stroke()
  }
  ctx.restore()
}

/* ------------------------------------------------------------------ */
/* Parchment card                                                      */
/* ------------------------------------------------------------------ */

export const CARD_TEX = { width: 220, height: 132 } as const
/** Compact dialog size for the in-stage pause/continue cards. */
export const DIALOG_TEX = { width: 184, height: 96 } as const

/**
 * A parchment card with lacquer rails and rolled ends. `variant` tints the
 * rails: gold (victory/intro), crimson (defeat), jade (complete).
 */
function paintCard(
  ctx: Ctx,
  s: number,
  w: number,
  h: number,
  variant: 'gold' | 'crimson' | 'jade',
): void {
  ctx.save()
  ctx.scale(s, s)
  const accent =
    variant === 'gold' ? THEME.gold : variant === 'crimson' ? THEME.crimson : 0x3a9a6a
  const accentBright =
    variant === 'gold' ? THEME.goldBright : variant === 'crimson' ? 0xe85438 : 0x6ad39a

  // Drop shadow.
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = '#06040a'
  roundRect(ctx, 4, 5, w - 4, h - 4, 6)
  ctx.fill()
  ctx.restore()

  // Rolled ends: darker parchment dowels left and right.
  ctx.fillStyle = '#c8b088'
  roundRect(ctx, 0, 8, 7, h - 16, 3)
  ctx.fill()
  roundRect(ctx, w - 7, 8, 7, h - 16, 3)
  ctx.fill()
  ctx.fillStyle = css(THEME.ink)
  ctx.fillRect(2, 8, 1.4, h - 16)
  ctx.fillRect(w - 3.4, 8, 1.4, h - 16)

  // Parchment body with an aged vertical wash.
  deckle(ctx, 6, 0, w - 12, h)
  const body = ctx.createLinearGradient(0, 0, 0, h)
  body.addColorStop(0, '#e8d9b0')
  body.addColorStop(0.5, css(THEME.parchment))
  body.addColorStop(1, '#d8c090')
  ctx.fillStyle = body
  ctx.fill()
  ctx.save()
  deckle(ctx, 6, 0, w - 12, h)
  ctx.clip()
  // Aged blotches at the corners.
  for (const [bx, by, br] of [
    [16, 12, 18],
    [w - 20, h - 14, 22],
    [w - 26, 16, 12],
  ] as const) {
    const blot = ctx.createRadialGradient(bx, by, 1, bx, by, br)
    blot.addColorStop(0, 'rgba(150, 120, 70, 0.22)')
    blot.addColorStop(1, 'rgba(150, 120, 70, 0)')
    ctx.fillStyle = blot
    ctx.fillRect(bx - br, by - br, br * 2, br * 2)
  }
  laidLines(ctx, 6, 0, w - 12, h)
  ctx.restore()

  // Lacquer rails top and bottom, in the variant accent.
  ctx.fillStyle = css(THEME.ink)
  ctx.fillRect(6, 3, w - 12, 6)
  ctx.fillRect(6, h - 9, w - 12, 6)
  ctx.fillStyle = css(accent)
  ctx.fillRect(6, 4.2, w - 12, 3.6)
  ctx.fillRect(6, h - 7.8, w - 12, 3.6)
  ctx.fillStyle = css(accentBright)
  ctx.fillRect(6, 4.2, w - 12, 1.1)
  ctx.fillRect(6, h - 7.8, w - 12, 1.1)
  // Rail end caps.
  ctx.fillStyle = css(accentBright)
  ctx.fillRect(6, 3, 3, 6)
  ctx.fillRect(w - 9, 3, 3, 6)
  ctx.fillRect(6, h - 9, 3, 6)
  ctx.fillRect(w - 9, h - 9, 3, 6)
  ctx.restore()
}

export function paintIntroCard(ctx: Ctx, s: number): void {
  paintCard(ctx, s, CARD_TEX.width, CARD_TEX.height, 'gold')
}

export function paintDialogCard(ctx: Ctx, s: number, variant: 'gold' | 'crimson'): void {
  paintCard(ctx, s, DIALOG_TEX.width, DIALOG_TEX.height, variant)
}

/** The result screen's wide victory scroll. */
export const VICTORY_TEX = { width: 340, height: 150 } as const
/** The game-over screen's defeat scroll. */
export const DEFEAT_TEX = { width: 300, height: 150 } as const

export function paintVictoryCard(ctx: Ctx, s: number): void {
  paintCard(ctx, s, VICTORY_TEX.width, VICTORY_TEX.height, 'gold')
}

export function paintDefeatCard(ctx: Ctx, s: number): void {
  paintCard(ctx, s, DEFEAT_TEX.width, DEFEAT_TEX.height, 'crimson')
}

/* ------------------------------------------------------------------ */
/* Stat chip                                                           */
/* ------------------------------------------------------------------ */

export const CHIP_PLATE_TEX = { width: 84, height: 26 } as const

/** A lacquer chip plate for result-screen stats (LIVES / SCORE / TIME). */
export function paintStatChip(ctx: Ctx, s: number): void {
  ctx.save()
  ctx.scale(s, s)
  const { width: w, height: h } = CHIP_PLATE_TEX
  ctx.save()
  ctx.globalAlpha = 0.45
  ctx.fillStyle = '#06040a'
  roundRect(ctx, 2, 2.5, w - 2, h - 2, 4)
  ctx.fill()
  ctx.restore()
  roundRect(ctx, 0.5, 0.5, w - 1, h - 1, 4)
  const body = ctx.createLinearGradient(0, 0, 0, h)
  body.addColorStop(0, '#241c30')
  body.addColorStop(1, '#100c18')
  ctx.fillStyle = body
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = css(THEME.gold)
  roundRect(ctx, 0.5, 0.5, w - 1, h - 1, 4)
  ctx.stroke()
  ctx.fillStyle = css(THEME.gold)
  ctx.fillRect(2, 1, 2, 2)
  ctx.fillRect(w - 4, 1, 2, 2)
  ctx.fillRect(2, h - 3, 2, 2)
  ctx.fillRect(w - 4, h - 3, 2, 2)
  ctx.restore()
}

/* ------------------------------------------------------------------ */
/* Scene-side bake helper                                              */
/* ------------------------------------------------------------------ */

function bake(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  paint: (ctx: Ctx, s: number) => void,
): void {
  if (scene.textures.exists(key)) return
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * RENDER_SCALE))
  canvas.height = Math.max(1, Math.round(h * RENDER_SCALE))
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  paint(ctx, RENDER_SCALE)
  scene.textures.addCanvas(key, canvas)
}

/** Bake the flow-card kit into a scene; a no-op once the keys exist. */
export function ensureFlowArt(scene: Phaser.Scene): void {
  bake(scene, 'flow:intro', CARD_TEX.width, CARD_TEX.height, paintIntroCard)
  bake(scene, 'flow:dialog:gold', DIALOG_TEX.width, DIALOG_TEX.height, (ctx, s) =>
    paintDialogCard(ctx, s, 'gold'),
  )
  bake(scene, 'flow:dialog:crimson', DIALOG_TEX.width, DIALOG_TEX.height, (ctx, s) =>
    paintDialogCard(ctx, s, 'crimson'),
  )
  bake(scene, 'flow:chip', CHIP_PLATE_TEX.width, CHIP_PLATE_TEX.height, paintStatChip)
  bake(scene, 'flow:victory', VICTORY_TEX.width, VICTORY_TEX.height, paintVictoryCard)
  bake(scene, 'flow:defeat', DEFEAT_TEX.width, DEFEAT_TEX.height, paintDefeatCard)
}
