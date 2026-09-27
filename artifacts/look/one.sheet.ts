import { writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { it } from 'vitest'
import { PORTRAIT_SCALE, PORTRAIT_TEXTURE, drawKindPortrait } from '../../src/game/art/registry'

const KINDS = (process.env.SHEET_KINDS ?? 'soldier,zhaoyun,lubu').split(',')
const TAG = process.env.SHEET_TAG ?? 'now'

it('large portraits', () => {
  const W = PORTRAIT_TEXTURE.width
  const H = PORTRAIT_TEXTURE.height
  const Z = 2
  const sheet = createCanvas(KINDS.length * W * Z, H * Z)
  const ctx = sheet.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#1b1f27'
  ctx.fillRect(0, 0, sheet.width, sheet.height)
  KINDS.forEach((k, i) => {
    const c = createCanvas(W, H)
    drawKindPortrait(c.getContext('2d') as unknown as CanvasRenderingContext2D, k, PORTRAIT_SCALE)
    ctx.drawImage(c as unknown as CanvasImageSource, i * W * Z, 0, W * Z, H * Z)
  })
  writeFileSync(`artifacts/look/one-${TAG}.png`, sheet.toBuffer('image/png'))
})
