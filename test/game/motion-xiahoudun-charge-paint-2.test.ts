import { beforeAll, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import type { Pixels } from '../../scripts/motion-pipeline.mjs'
import { alphaComponents } from '../../scripts/motion-pipeline.mjs'
import { gridCellOf } from '../../scripts/motion-retouch.mjs'
import { isProtectedChargeWeapon } from '../../scripts/harmonize-xiahoudun-charge-paint.mjs'
import { assertPass2Conservation, harmonizeChargePaint2 } from '../../scripts/harmonize-xiahoudun-charge-paint-2.mjs'

let pass1: Pixels, out: ReturnType<typeof harmonizeChargePaint2>
const hash = (d: Uint8ClampedArray) => createHash('sha256').update(d).digest('hex')
const cellOf = gridCellOf(3, 3)

function meanLuma(im: Pixels, cell: number): number {
  const c = alphaComponents(im, 96).filter(c => c.area > 64 && cellOf(c, im.width, im.height) === cell)[0]!
  let s = 0
  for (const p of c.pixels) s += 0.2126 * im.data[p * 4]! + 0.7152 * im.data[p * 4 + 1]! + 0.0722 * im.data[p * 4 + 2]!
  return s / c.pixels.length
}

beforeAll(async () => {
  const bytes = readFileSync('art/motion/xiahoudun/charge-paint-harmonized-source.png')
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('98e2531f1763bdb5a6b4ad045518e159987a51f8c264d7f4fb64f657a323c5fe')
  const img = await loadImage(bytes), cv = createCanvas(img.width, img.height), g = cv.getContext('2d'); g.drawImage(img, 0, 0)
  pass1 = g.getImageData(0, 0, img.width, img.height)
  out = harmonizeChargePaint2(pass1)
})

describe('CMR-14A paint pass 2 (reviewer item: charge:4 / charge:3 residual warmth)', () => {
  it('changes only named charge:3/4 RGB material pixels; alpha, weapons and every other drawing are exact', () => {
    expect(out.changedRgbPixels[3]).toBeGreaterThan(10000)
    expect(out.changedRgbPixels[4]).toBeGreaterThan(10000)
    expect(() => assertPass2Conservation(pass1, out.image)).not.toThrow()
    let alpha = 0, weapon = 0, otherCells = 0
    const comps = alphaComponents(pass1, 96).filter(c => c.area > 64)
    for (let p = 0; p < pass1.width * pass1.height; p++) if (pass1.data[p * 4 + 3] !== out.image.data[p * 4 + 3]) alpha++
    for (const c of comps) {
      const cell = cellOf(c, pass1.width, pass1.height)
      for (const p of c.pixels) {
        const x = p % pass1.width, y = Math.floor(p / pass1.width)
        for (let ch = 0; ch < 4; ch++) {
          const changed = pass1.data[p * 4 + ch] !== out.image.data[p * 4 + ch]
          if (changed && ![3, 4].includes(cell)) otherCells++
          if (changed && isProtectedChargeWeapon(cell, x, y)) weapon++
        }
      }
    }
    expect([alpha, weapon, otherCells]).toEqual([0, 0, 0])
    expect(out.composition).toEqual({ count: 9, cells: [0, 1, 2, 3, 4, 5, 6, 7, 8] })
  })

  it('actually reduces whole-figure brightness of charge:3/4 toward charge:1/2 without overshooting below it', () => {
    const ref = (meanLuma(pass1, 1) + meanLuma(pass1, 2)) / 2
    for (const cell of [3, 4]) {
      const before = meanLuma(pass1, cell), after = meanLuma(out.image, cell)
      expect(after).toBeLessThan(before - 1) // a no-op/old source fails here
      expect(after).toBeGreaterThan(ref) // residual gap is real and disclosed, never over-darkened past the reference
    }
    expect(meanLuma(out.image, 1)).toBe(meanLuma(pass1, 1))
    expect(meanLuma(out.image, 2)).toBe(meanLuma(pass1, 2))
  })

  it('negative controls reject silhouette damage and recoloring of cells that pass 2 must not touch', () => {
    const alphaBad = { ...out.image, data: new Uint8ClampedArray(out.image.data) }
    alphaBad.data[(164 * alphaBad.width + 423) * 4 + 3] = 0
    expect(() => assertPass2Conservation(pass1, alphaBad)).toThrow(/alpha\/silhouette changed/)
    // charge:0 is a pass-1 cell; pass 2 must leave it byte-exact.
    const c0 = alphaComponents(pass1, 96).filter(c => c.area > 64 && cellOf(c, pass1.width, pass1.height) === 0)[0]!
    const p0 = c0.pixels[Math.floor(c0.pixels.length / 2)]!
    const recolored = { ...out.image, data: new Uint8ClampedArray(out.image.data) }
    recolored.data[p0 * 4] = recolored.data[p0 * 4]! ^ 1
    expect(() => assertPass2Conservation(pass1, recolored)).toThrow(/protected\/untargeted pixel changed/)
  })

  it('is deterministic and copy-on-write; does not establish source, head or motion acceptance', () => {
    const before = hash(pass1.data), repeat = harmonizeChargePaint2(pass1)
    expect(hash(pass1.data)).toBe(before)
    expect(hash(repeat.image.data)).toBe(hash(out.image.data))
    const state = JSON.parse(readFileSync('art/motion/xiahoudun/independent-review.json', 'utf8'))
    expect(state.numericalHeadSpread).toBeNull()
    expect(state.acceptedChargeSheet).toBe(false)
  })
})
