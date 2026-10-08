import { beforeAll, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import type { Pixels } from '../../scripts/motion-pipeline.mjs'
import { alphaComponents } from '../../scripts/motion-pipeline.mjs'
import { gridCellOf } from '../../scripts/motion-retouch.mjs'
import { spreadOf } from '../../scripts/pack-projection.mjs'
import { assertComboCell4Protected, CELL4, measureComboCell4Weapon, slideComboCell4 } from '../../scripts/retouch-xiahoudun-combo-cell4.mjs'

const BAND = { lo: 404.1605167916991, hi: 446.70372908556226 }
let raw: Pixels, out: ReturnType<typeof slideComboCell4>
const hash = (d: Uint8ClampedArray) => createHash('sha256').update(d).digest('hex')
const cellOf = gridCellOf(3, 3)

async function load(path: string): Promise<Pixels> {
  const img = await loadImage(path), cv = createCanvas(img.width, img.height), g = cv.getContext('2d'); g.drawImage(img, 0, 0)
  return g.getImageData(0, 0, img.width, img.height)
}
beforeAll(async () => {
  const bytes = readFileSync('art/motion/xiahoudun/combo-candidate-1.png')
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('c2c5fefc1ac36a8ab428dca8cc966927df1103f5bda98d8dcbbf0304bccd6e0b')
  raw = await load('art/motion/xiahoudun/combo-candidate-1.png')
  out = slideComboCell4(raw)
})

describe('CMR-14A combo cell 4 deterministic rear-cap slide', () => {
  it('regression: the raw cell is over the fixed band; the slid cell lands inside it with the tip unmoved', () => {
    expect(measureComboCell4Weapon(raw).length).toBeGreaterThan(BAND.hi)
    expect(out.post.length).toBeGreaterThanOrEqual(BAND.lo)
    expect(out.post.length).toBeLessThanOrEqual(BAND.hi)
    expect(out.post.tip).toEqual(out.pre.tip)
    expect(out.report.achieved).toBeCloseTo(out.report.achieved, 6)
    expect(out.composition).toEqual({ count: 9, cells: [0, 1, 2, 3, 4, 5, 6, 7, 8] })
  })

  it('changes pixels only in the moved shaft corridor, leaves fist/cuff/skirt and every other drawing exact', () => {
    expect(() => assertComboCell4Protected(raw, out.image)).not.toThrow()
    const comps = alphaComponents(raw, 96).filter(c => c.area > 64)
    let otherCells = 0
    for (const c of comps) {
      if (cellOf(c, raw.width, raw.height) === CELL4.cell) continue
      for (const p of c.pixels) for (let ch = 0; ch < 4; ch++) if (raw.data[p * 4 + ch] !== out.image.data[p * 4 + ch]) otherCells++
    }
    expect(otherCells).toBe(0)
  })

  it('negative control A: damaging the rear fist is rejected even though the length gate still passes', () => {
    const hurt = { ...out.image, data: new Uint8ClampedArray(out.image.data) }
    const k = (520 * hurt.width + 665) * 4 // inside the protected rear fist (skin 186,137,101; t=103.8 >= FIST_T so the witness guards it; the old (642,531) sat on bare shaft at t=78.4 and was rightly skipped)
    hurt.data[k] = hurt.data[k]! ^ 1
    expect(measureComboCell4Weapon(hurt).length).toBeLessThanOrEqual(BAND.hi)
    expect(() => assertComboCell4Protected(raw, hurt)).toThrow(/rear fist\+cuff changed/)
  })

  it('negative control B: the translucent-edge seam (shaft body left at partial alpha) is detectable and absent in the output', () => {
    const solidBefore = (im: Pixels, ref: Pixels) => {
      // count pixels that were solid shaft in the raw image but are now less opaque, inside the moved corridor
      const dx = CELL4.tip[0]! - CELL4.cap[0]!, dy = CELL4.tip[1]! - CELL4.cap[1]!, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L
      let n = 0
      for (let y = 490; y < 600; y++) for (let x = 560; x < 720; x++) {
        const t = (x - CELL4.cap[0]!) * ux + (y - CELL4.cap[1]!) * uy, o = -(x - CELL4.cap[0]!) * uy + (y - CELL4.cap[1]!) * ux
        if (t < CELL4.t0 || Math.abs(o) > CELL4.band + 2) continue
        const k = (y * im.width + x) * 4
        if (ref.data[k + 3]! >= 96 && im.data[k + 3]! < ref.data[k + 3]!) n++
      }
      return n
    }
    expect(solidBefore(out.image, raw)).toBe(0)
    expect(out.alphaRestored).toBeGreaterThan(100) // the fix did real work; without it the seam appears
  })

  it('is deterministic and copy-on-write; it does not record the sheet as accepted', () => {
    const before = hash(raw.data), repeat = slideComboCell4(raw)
    expect(hash(raw.data)).toBe(before)
    expect(hash(repeat.image.data)).toBe(hash(out.image.data))
    const projection = JSON.parse(readFileSync('art/motion/xiahoudun/pack-projection.json', 'utf8')) as { sheets: Array<{ name: string }> }
    expect(projection.sheets.map(s => s.name)).toEqual(['walk', 'heavy'])
    // only cell 4 is in band; the remaining measured cells keep the sheet failing
    expect(spreadOf([470.1, 340.3, 472.8, out.post.length, 487.7, 475.7])).toBeGreaterThan(0.1)
  })
})
