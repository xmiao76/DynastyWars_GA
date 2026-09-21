import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import type { PoseName } from '../../src/game/art/poses'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'

// TEMPORARY probe: Guan Yu's weapon alone, very large, so the silhouette can
// be studied in detail. The figure is drawn then masked to steel+tassel.
const SCALE = 6

const isSteel = (r: number, g: number, b: number): boolean =>
  r > 110 && g > 110 && b > 110 && Math.max(r, g, b) - Math.min(r, g, b) < 40
const isTassel = (r: number, g: number, b: number): boolean =>
  r > 110 && r - g > 45 && r - b > 35

function weaponOnly(kind: string, pose: PoseName) {
  const box = artBoxFor(kind, pose)
  if (!box) throw new Error('no box')
  const canvas = createCanvas(box.width * SCALE, box.height * SCALE)
  const ctx = canvas.getContext('2d')
  drawKindPose(ctx as unknown as CanvasRenderingContext2D, kind, pose, SCALE)
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let x0 = canvas.width, y0 = canvas.height, x1 = -1, y1 = -1
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const i = (y * canvas.width + x) * 4
      const a = img.data[i + 3] ?? 0
      const r = img.data[i] ?? 0, g = img.data[i + 1] ?? 0, b = img.data[i + 2] ?? 0
      const keep = a >= 200 && (isSteel(r, g, b) || isTassel(r, g, b))
      if (keep) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  if (x1 < 0) return { canvas: createCanvas(1, 1), w: 1, h: 1 }
  // Crop tight around the BLADE only: the top half of the weapon in a vertical
  // carry is the head. Use the full bounds but keep the aspect readable.
  const pad = 8
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad)
  const w = Math.min(canvas.width - x0, x1 - x0 + 1 + pad * 2)
  const h = Math.min(canvas.height - y0, y1 - y0 + 1 + pad * 2)
  const out = createCanvas(w, h)
  out.getContext('2d').drawImage(canvas, x0, y0, w, h, 0, 0, w, h)
  return { canvas: out, w, h }
}

describe('render Guan Yu weapon study', () => {
  it('writes artifacts/guanyu-blade.png', () => {
    const poses: PoseName[] = ['idle', 'attack', 'windup']
    const cells = poses.map((pose) => ({ pose, ...weaponOnly('guanyu', pose) }))
    const GAP = 40
    const rowH = Math.max(...cells.map((c) => c.h))
    const width = 40 + cells.reduce((s, c) => s + c.w + GAP, 0)
    const height = rowH + 90
    const sheet = createCanvas(Math.ceil(width), Math.ceil(height))
    const ctx = sheet.getContext('2d')
    ctx.fillStyle = '#f4f4f0'
    ctx.fillRect(0, 0, sheet.width, sheet.height)
    ctx.fillStyle = '#202028'
    ctx.font = 'bold 26px sans-serif'
    let x = 40
    for (const c of cells) {
      ctx.fillText(c.pose, x, 34)
      ctx.drawImage(c.canvas, x, 50 + (rowH - c.h), c.w, c.h)
      x += c.w + GAP
    }
    mkdirSync('artifacts', { recursive: true })
    writeFileSync('artifacts/guanyu-blade.png', sheet.encodeSync('png'))
    expect(true).toBe(true)
  })
})
