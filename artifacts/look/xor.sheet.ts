import { writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { it } from 'vitest'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'

const [A, B] = (process.env.XOR ?? 'guanyu,weiyan').split(',') as [string, string]

it('silhouette xor', () => {
  const S = 2
  const box = artBoxFor(A, 'idle')
  if (!box) throw new Error('box')
  const W = box.width * S
  const H = box.height * S
  const r = (k: string): Uint8ClampedArray => {
    const c = createCanvas(W, H)
    const ctx = c.getContext('2d')
    drawKindPose(ctx as unknown as CanvasRenderingContext2D, k, 'idle', S)
    return ctx.getImageData(0, 0, W, H).data as unknown as Uint8ClampedArray
  }
  const a = r(A)
  const b = r(B)
  const out = createCanvas(W, H)
  const o = out.getContext('2d')
  const img = o.createImageData(W, H)
  let d = 0
  let t = 0
  for (let i = 0; i < W * H; i += 1) {
    const x = (a[i * 4 + 3] ?? 0) >= 128
    const y = (b[i * 4 + 3] ?? 0) >= 128
    const px = i * 4
    img.data[px + 3] = 255
    if (x && y) { img.data[px] = 120; img.data[px + 1] = 120; img.data[px + 2] = 120 }
    else if (x) { img.data[px] = 230; img.data[px + 1] = 40; img.data[px + 2] = 40 }
    else if (y) { img.data[px] = 40; img.data[px + 1] = 80; img.data[px + 2] = 230 }
    else { img.data[px] = 255; img.data[px + 1] = 255; img.data[px + 2] = 255 }
    if (x || y) t += 1
    if (x !== y) d += 1
  }
  o.putImageData(img, 0, 0)
  const big = createCanvas(W * 4, H * 4)
  const bctx = big.getContext('2d')
  bctx.imageSmoothingEnabled = false
  bctx.drawImage(out, 0, 0, W * 4, H * 4)
  writeFileSync(`artifacts/look/xor-${A}-${B}.png`, big.toBuffer('image/png'))
  console.log('XOR', A, B, (d / t).toFixed(3))
})
