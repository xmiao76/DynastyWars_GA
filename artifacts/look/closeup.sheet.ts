import { writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { it } from 'vitest'
import { ENEMY_FIGURES, HERO_FIGURES } from '../../src/game/art/figures'
import { POSE_TABLE } from '../../src/game/art/poses'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'
import { FIG_H, FIG_W, applyBuild } from '../../src/game/art/rig'

const TAG = process.env.SHEET_TAG ?? 'now'
const KINDS = (process.env.SHEET_KINDS ?? [...Object.keys(HERO_FIGURES), ...Object.keys(ENEMY_FIGURES)].join(',')).split(',')

it('in-play head close-ups (device px, 6x nearest)', () => {
  const S = Number(process.env.SHEET_S ?? 2) // RENDER_SCALE
  const MAG = S >= 6 ? 1.5 : 6
  const half = 13 * S // device px either side of the head centre
  const cell = half * 2 * MAG
  const cols = Math.min(6, KINDS.length)
  const rows = Math.ceil(KINDS.length / cols)
  const pad = 10
  const sheet = createCanvas(cols * (cell + pad) + pad, rows * (cell + pad + 20) + pad)
  const ctx = sheet.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#6d7f5a'
  ctx.fillRect(0, 0, sheet.width, sheet.height)
  KINDS.forEach((kind, i) => {
    const plan = HERO_FIGURES[kind] ?? ENEMY_FIGURES[kind]
    const box = artBoxFor(kind, 'idle')
    if (!plan || !box) return
    const c = createCanvas(box.width * S, box.height * S)
    drawKindPose(c.getContext('2d') as unknown as CanvasRenderingContext2D, kind, 'idle', S)
    const built = applyBuild(POSE_TABLE.idle, plan.build)
    const hx = Math.round(((box.width - FIG_W) / 2 + built.head.x) * S)
    const hy = Math.round((box.height - FIG_H + built.head.y) * S)
    const x = pad + (i % cols) * (cell + pad)
    const y = pad + Math.floor(i / cols) * (cell + pad + 20)
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 15px sans-serif'
    ctx.fillText(kind, x, y + 14)
    ctx.drawImage(c as unknown as CanvasImageSource, hx - half, hy - half, half * 2, half * 2, x, y + 20, cell, cell)
  })
  writeFileSync(`artifacts/look/closeup-${TAG}.png`, sheet.toBuffer('image/png'))
})

