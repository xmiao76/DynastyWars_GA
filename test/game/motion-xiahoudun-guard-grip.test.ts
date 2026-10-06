import { beforeAll, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { type Pixels } from '../../scripts/motion-pipeline.mjs'
import { GRIP_RECT, restoreGuardGrip } from '../../scripts/restore-xiahoudun-guard-grip.mjs'

const hash = (bytes: Uint8ClampedArray) => createHash('sha256').update(bytes).digest('hex')
let original: Pixels, prepared: Pixels, result: ReturnType<typeof restoreGuardGrip>
async function load(path: string): Promise<Pixels> {
  const img = await loadImage(path), cv = createCanvas(img.width, img.height), g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  return g.getImageData(0, 0, img.width, img.height)
}
function patchChannels(im: Pixels): Uint8ClampedArray {
  const [x0, y0, x1, y1] = GRIP_RECT, bytes = new Uint8ClampedArray((x1 - x0) * (y1 - y0) * 4)
  let q = 0
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const k = (y * im.width + x) * 4
    bytes.set(im.data.subarray(k, k + 4), q); q += 4
  }
  return bytes
}
beforeAll(async () => {
  original = await load('art/motion/xiahoudun/walk-candidate-1.png')
  prepared = await load('art/motion/xiahoudun/walk-prepared-source.png')
  result = restoreGuardGrip(original, prepared)
})

describe('independent walk:0 foreground-grip correction', () => {
  it('regression: the old prepared foreground fails original-hand equality; the restored override matches exactly', () => {
    expect(hash(patchChannels(prepared))).not.toBe(hash(patchChannels(original)))
    expect(hash(patchChannels(result.image))).toBe(hash(patchChannels(original)))
    expect(result.changedChannels).toBe(1704)
  })

  it('preserves every pixel outside the hand rectangle, including all other drawings and remote weapon endpoints', () => {
    const [x0, y0, x1, y1] = GRIP_RECT
    let changed = 0
    for (let y = 0; y < prepared.height; y++) for (let x = 0; x < prepared.width; x++) {
      if (x >= x0 && x < x1 && y >= y0 && y < y1) continue
      const k = (y * prepared.width + x) * 4
      for (let c = 0; c < 4; c++) if (result.image.data[k + c] !== prepared.data[k + c]) changed++
    }
    expect(changed).toBe(0)
    expect(result.composition).toEqual({ count: 9, cells: [0,1,2,3,4,5,6,7,8] })
  })

  it('is copy-on-write and deterministic from immutable sources', () => {
    const a = hash(original.data), b = hash(prepared.data), repeat = restoreGuardGrip(original, prepared)
    expect(hash(original.data)).toBe(a); expect(hash(prepared.data)).toBe(b)
    expect(hash(repeat.image.data)).toBe(hash(result.image.data))
    expect(() => restoreGuardGrip(original, { ...prepared, width: prepared.width + 1 })).toThrow(/dimensions differ/)
  })
})
