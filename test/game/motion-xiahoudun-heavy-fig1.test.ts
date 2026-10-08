import { beforeAll, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import type { Pixels } from '../../scripts/motion-pipeline.mjs'
import { alphaComponents } from '../../scripts/motion-pipeline.mjs'
import { gridCellOf } from '../../scripts/motion-retouch.mjs'
import { assertHeavyFig1Protected, FIG1, FIST_T, HEAVY_FIG1_WITNESSES, measureHeavyFig1Weapon, slideHeavyFig1 } from '../../scripts/retouch-xiahoudun-heavy-fig1.mjs'

const BAND = { lo: 404.1605167916991, hi: 446.70372908556226 }
let raw: Pixels, out: ReturnType<typeof slideHeavyFig1>
const hash = (d: Uint8ClampedArray) => createHash('sha256').update(d).digest('hex')
const cellOf = gridCellOf(3, 3)

async function load(path: string): Promise<Pixels> {
  const img = await loadImage(path), cv = createCanvas(img.width, img.height), g = cv.getContext('2d'); g.drawImage(img, 0, 0)
  return g.getImageData(0, 0, img.width, img.height)
}
beforeAll(async () => {
  const bytes = readFileSync('art/motion/xiahoudun/heavy-prepared-source.png')
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('041add3022773ff905b62cb7b5ba648d9423ec8d494b0a2976388ec2ef926129')
  raw = await load('art/motion/xiahoudun/heavy-prepared-source.png')
  out = slideHeavyFig1(raw)
})

describe('CMR-14A heavy fig1 deterministic rear-cap slide', () => {
  it('pins the measured axis, the slide vector and the protected witnesses', () => {
    expect(FIG1).toEqual({ cell: 1, cap: [727, 155], tip: [1195, 51], band: 14, t0: 40, shift: [36, -8] })
    expect(FIST_T).toBe(86)
    expect(HEAVY_FIG1_WITNESSES).toEqual([['rear fist', [800, 100, 875, 165]], ['cuff/bracer under shaft', [795, 165, 875, 230]]])
    // slide-room facts re-measured on the pinned source: cap steel ends t=22,
    // first fist skin on the axis t=88, so t0=40 + 36.9px slide clears the fist
    expect(out.pre.butt).toEqual([727, 155])
    expect(out.pre.tip).toEqual([1195, 51])
  })

  it('regression: the raw cell is over the fixed band; the slid cell lands inside it with the tip unmoved', () => {
    expect(measureHeavyFig1Weapon(raw).length).toBeGreaterThan(BAND.hi)
    expect(out.post.length).toBeGreaterThanOrEqual(BAND.lo)
    expect(out.post.length).toBeLessThanOrEqual(BAND.hi)
    expect(out.post.tip).toEqual(out.pre.tip)
    expect(out.report.achieved).toBeCloseTo(out.report.achieved, 6)
    expect(out.composition).toEqual({ count: 5, cells: [0, 1, 2, 3, 4] })
  })

  it('corridor endpoints do not move with the wider band: the band carries the flared cap, not new endpoints', () => {
    expect(measureHeavyFig1Weapon(raw, 10).length).toBeCloseTo(measureHeavyFig1Weapon(raw, 14).length, 6)
    expect(measureHeavyFig1Weapon(raw, 14).butt).toEqual([727, 155])
    expect(measureHeavyFig1Weapon(raw, 14).tip).toEqual([1195, 51])
  })

  it('changes pixels only in the moved shaft corridor, leaves fist/cuff/bracer and every other drawing exact', () => {
    expect(() => assertHeavyFig1Protected(raw, out.image)).not.toThrow()
    const comps = alphaComponents(raw, 96).filter(c => c.area > 64)
    let otherCells = 0
    for (const c of comps) {
      if (cellOf(c, raw.width, raw.height) === FIG1.cell) continue
      for (const p of c.pixels) for (let ch = 0; ch < 4; ch++) if (raw.data[p * 4 + ch] !== out.image.data[p * 4 + ch]) otherCells++
    }
    expect(otherCells).toBe(0)
  })

  it('negative control A: damaging the rear fist is rejected even though the length gate still passes', () => {
    const hurt = { ...out.image, data: new Uint8ClampedArray(out.image.data) }
    const k = (145 * hurt.width + 835) * 4 // inside the protected rear fist (skin 191,151,120; t=107.6 >= FIST_T so the witness guards it)
    hurt.data[k] = hurt.data[k]! ^ 1
    expect(measureHeavyFig1Weapon(hurt).length).toBeLessThanOrEqual(BAND.hi)
    expect(() => assertHeavyFig1Protected(raw, hurt)).toThrow(/rear fist changed/)
  })

  it('negative control B: the translucent-edge seam (shaft body left at partial alpha) is detectable and absent in the output', () => {
    const solidBefore = (im: Pixels, ref: Pixels) => {
      const dx = FIG1.tip[0]! - FIG1.cap[0]!, dy = FIG1.tip[1]! - FIG1.cap[1]!, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L
      let n = 0
      for (let y = 90; y < 200; y++) for (let x = 700; x < 920; x++) {
        const t = (x - FIG1.cap[0]!) * ux + (y - FIG1.cap[1]!) * uy, o = -(x - FIG1.cap[0]!) * uy + (y - FIG1.cap[1]!) * ux
        if (t < FIG1.t0 || Math.abs(o) > FIG1.band + 2) continue
        const k = (y * im.width + x) * 4
        if (ref.data[k + 3]! >= 96 && im.data[k + 3]! < ref.data[k + 3]!) n++
      }
      return n
    }
    expect(solidBefore(out.image, raw)).toBe(0)
    expect(out.alphaRestored).toBeGreaterThan(10) // the fix did real work; without it the seam appears
  })

  it('is deterministic and copy-on-write; it does not record the sheet as accepted', () => {
    const before = hash(raw.data), repeat = slideHeavyFig1(raw)
    expect(hash(raw.data)).toBe(before)
    expect(hash(repeat.image.data)).toBe(hash(out.image.data))
    const projection = JSON.parse(readFileSync('art/motion/xiahoudun/pack-projection.json', 'utf8')) as { sheets: Array<{ name: string }> }
    expect(projection.sheets.map(s => s.name)).toEqual(['walk'])
  })
})
