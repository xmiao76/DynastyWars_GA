import { writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { it } from 'vitest'
import { chainPath, limbPath } from '../../src/game/art/rig'

it('limbPath / chainPath probe', () => {
  const W = 420
  const H = 320
  const c = createCanvas(W, H)
  const ctx = c.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#d03030'
  limbPath(ctx, { x: 40, y: 80 }, { x: 380, y: 80 }, 60, 40)
  ctx.fill()
  ctx.fillStyle = '#3050d0'
  chainPath(ctx, [{ x: 40, y: 200 }, { x: 210, y: 250 }, { x: 380, y: 200 }], [50, 40, 30])
  ctx.fill()
  const img = ctx.getImageData(0, 0, W, H)
  const col = (x: number, y0: number, y1: number): number => {
    let n = 0
    for (let y = y0; y < y1; y += 1) if ((img.data[(y * W + x) * 4 + 1] ?? 255) < 128) n += 1
    return n
  }
  writeFileSync('artifacts/look/limb-probe.png', c.toBuffer('image/png'))
  console.log('LIMB_MID', col(210, 0, 160), 'CHAIN_Q1', col(125, 160, 320), 'CHAIN_MID', col(210, 160, 320), 'CHAIN_Q3', col(295, 160, 320))
})
