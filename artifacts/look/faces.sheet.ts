import { writeFileSync, mkdirSync } from 'node:fs'
import { createCanvas, type Canvas } from '@napi-rs/canvas'
import { it } from 'vitest'
import { ENEMY_FIGURES, HERO_FIGURES } from '../../src/game/art/figures'
import { POSE_TABLE } from '../../src/game/art/poses'
import { PORTRAIT_TEXTURE, PORTRAIT_SCALE, artBoxFor, drawKindPortrait, drawKindPose } from '../../src/game/art/registry'
import { FIG_H, FIG_W, applyBuild } from '../../src/game/art/rig'

const TAG = process.env.SHEET_TAG ?? 'now'
const OUT = 'artifacts/look'
const KINDS = [...Object.keys(HERO_FIGURES), ...Object.keys(ENEMY_FIGURES)]

function portrait(kind: string): Canvas {
  const c = createCanvas(PORTRAIT_TEXTURE.width, PORTRAIT_TEXTURE.height)
  drawKindPortrait(c.getContext('2d') as unknown as CanvasRenderingContext2D, kind, PORTRAIT_SCALE)
  return c
}

/** The in-play idle sprite at the game's RENDER_SCALE (2), plus its head crop. */
function sprite(kind: string, scale = 2): { full: Canvas; head: [number, number, number] } {
  const plan = HERO_FIGURES[kind] ?? ENEMY_FIGURES[kind]
  const box = artBoxFor(kind, 'idle')
  if (!plan || !box) throw new Error(kind)
  const c = createCanvas(box.width * scale, box.height * scale)
  drawKindPose(c.getContext('2d') as unknown as CanvasRenderingContext2D, kind, 'idle', scale)
  const built = applyBuild(POSE_TABLE.idle, plan.build)
  const hx = ((box.width - FIG_W) / 2 + built.head.x) * scale
  const hy = (box.height - FIG_H + built.head.y) * scale
  return { full: c, head: [hx, hy, 10.4 * plan.build.head * scale] }
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 15px sans-serif'
  ctx.fillText(text, x, y)
}

it('control image', () => {
  const c = createCanvas(420, 160)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#203040'
  ctx.fillRect(0, 0, 420, 160)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 44px sans-serif'
  ctx.fillText('CTRL 5927', 20, 70)
  ctx.fillStyle = '#e02020'
  ctx.beginPath()
  ctx.arc(360, 110, 34, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#20c020'
  ctx.fillRect(20, 100, 120, 40)
  mkdirSync(OUT, { recursive: true })
  writeFileSync(`${OUT}/control.png`, c.toBuffer('image/png'))
})

it('portrait sheet', () => {
  const W = PORTRAIT_TEXTURE.width
  const H = PORTRAIT_TEXTURE.height
  const cols = 6
  const rows = Math.ceil(KINDS.length / cols)
  const pad = 12
  const sheet = createCanvas(cols * (W + pad) + pad, rows * (H + pad + 20) + pad)
  const ctx = sheet.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#1b1f27'
  ctx.fillRect(0, 0, sheet.width, sheet.height)
  KINDS.forEach((kind, i) => {
    const x = pad + (i % cols) * (W + pad)
    const y = pad + Math.floor(i / cols) * (H + pad + 20)
    label(ctx, kind, x, y + 14)
    ctx.drawImage(portrait(kind) as unknown as CanvasImageSource, x, y + 20)
  })
  writeFileSync(`${OUT}/faces-${TAG}-portraits.png`, sheet.toBuffer('image/png'))
})

it('in-play head sheet', () => {
  // Each head cropped at the game's device resolution, shown 1x (what the
  // player sees) and 4x nearest-neighbour (to read the marks).
  const MAG = 4
  const cell = 150
  const cols = 6
  const rows = Math.ceil(KINDS.length / cols)
  const pad = 12
  const sheet = createCanvas(cols * (cell + pad) + pad, rows * (cell + 70 + pad) + pad)
  const ctx = sheet.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#6d7f5a'
  ctx.fillRect(0, 0, sheet.width, sheet.height)
  KINDS.forEach((kind, i) => {
    const { full, head } = sprite(kind)
    const [hx, hy, r] = head
    const half = r * 1.9
    const x = pad + (i % cols) * (cell + pad)
    const y = pad + Math.floor(i / cols) * (cell + 70 + pad)
    label(ctx, kind, x, y + 14)
    const src = full as unknown as CanvasImageSource
    ctx.drawImage(src, hx - half, hy - half, half * 2, half * 2, x, y + 20, half * 2 * (cell / (half * 2)), cell)
    // 1x in the corner below
    ctx.drawImage(src, hx - half * 1.6, hy - half * 1.2, half * 3.2, half * 5.5, x, y + 20 + cell + 2, half * 3.2 * 0.5, half * 5.5 * 0.5)
  })
  void MAG
  writeFileSync(`${OUT}/faces-${TAG}-sprites.png`, sheet.toBuffer('image/png'))
})
