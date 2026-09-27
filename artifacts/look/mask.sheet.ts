import { writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { it } from 'vitest'
import { PORTRAIT_BOX, PORTRAIT_SCALE, drawKindPortrait } from '../../src/game/art/registry'
it('mask', () => {
  const W = PORTRAIT_BOX.width * PORTRAIT_SCALE, H = PORTRAIT_BOX.height * PORTRAIT_SCALE
  const c = createCanvas(W, H); const ctx = c.getContext('2d')
  drawKindPortrait(ctx as unknown as CanvasRenderingContext2D, process.env.K ?? 'zhangfei', PORTRAIT_SCALE)
  const img = ctx.getImageData(0, 0, W, H)
  const t = Number(process.env.T ?? 0x181410), lim = Number(process.env.L ?? 20)
  for (let i = 0; i < W * H; i++) {
    const d = Math.hypot(img.data[i*4]-((t>>16)&255), img.data[i*4+1]-((t>>8)&255), img.data[i*4+2]-(t&255))
    if (d < lim && img.data[i*4+3] >= 200) { img.data[i*4]=255; img.data[i*4+1]=0; img.data[i*4+2]=255 }
  }
  ctx.putImageData(img, 0, 0)
  writeFileSync('artifacts/look/mask.png', c.toBuffer('image/png'))
})
