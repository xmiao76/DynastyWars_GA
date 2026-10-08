import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { CELLS, OUT_PATH, prepareHeavySource, SEAM_BOX, SEAM_SEED_3, SEAM_SEED_4, separateHeavyMerge, SRC_SHA } from '../../scripts/prepare-xiahoudun-heavy.mjs'

async function sourcePixels() {
  const bytes = readFileSync('art/motion/xiahoudun/heavy-candidate-2.png')
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(SRC_SHA)
  const img = await loadImage(bytes)
  const cv = createCanvas(img.width, img.height), g = cv.getContext('2d'); g.drawImage(img, 0, 0)
  return g.getImageData(0, 0, img.width, img.height)
}

describe('CMR-14A heavy prepared source', () => {
  it('pins the accepted source, the seam constants and the 3x3 play-order layout', () => {
    expect(SRC_SHA).toBe('21d44dcd4d4caae76d2a92467a25e396d051cca6b39420fac690dd52587bd4bf')
    expect(OUT_PATH).toBe('art/motion/xiahoudun/heavy-prepared-source.png')
    expect(CELLS).toEqual([0, 1, 2, 3, 4])
    expect(SEAM_BOX).toEqual([1765, 595, 1815, 650])
    expect(SEAM_SEED_3).toEqual([1414, 422])
    expect(SEAM_SEED_4).toEqual([1882, 422])
  })

  it('separates the fig3|fig4 merge with zero paint loss and the exact proven split', async () => {
    const px = await sourcePixels()
    const { figs, seam } = separateHeavyMerge({ width: px.width, height: px.height, data: px.data })
    expect(figs).toHaveLength(5)
    expect(seam).toEqual({ box: [1765, 595, 1815, 650], fig3Area: 67379, fig4Area: 76027, reattached: 40, twilight: 71 })
    // zero loss: separated areas sum to the merged comp area (143406, trial-proven)
    expect(figs[3]!.area + figs[4]!.area).toBe(143406)
    // neither figure stole the other's core: seeds stay inside their own figure
    const inFig = (fig: { pixels: number[] }, [x, y]: number[]) => fig.pixels.includes(y! * px.width + x!)
    expect(inFig(figs[3]!, SEAM_SEED_3)).toBe(true)
    expect(inFig(figs[4]!, SEAM_SEED_4)).toBe(true)
    expect(inFig(figs[3]!, SEAM_SEED_4)).toBe(false)
    expect(inFig(figs[4]!, SEAM_SEED_3)).toBe(false)
  })

  it('prepares 5 drawings into cells 0-4 with pinned placements, and repeats byte-identically', async () => {
    const a = await prepareHeavySource()
    expect(a.composition).toEqual({ drawings: 5 })
    expect(a.placements.map(p => [p.fig, p.cell])).toEqual([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]])
    expect(a.placements.map(p => p.srcBox)).toEqual([
      [9, 42, 405, 629], [437, 110, 472, 561], [827, 229, 512, 442], [1340, 301, 475, 370], [1735, 248, 427, 423],
    ])
    const b = await prepareHeavySource()
    expect(createHash('sha256').update(b.image.data)).toEqual(createHash('sha256').update(a.image.data))
  }, 20000)

  it('masked extraction never absorbs another figure fringe: every opaque output pixel traces to owned-or-transparent source', async () => {
    const px = await sourcePixels()
    const { figs } = separateHeavyMerge({ width: px.width, height: px.height, data: px.data })
    const owner = new Map<number, number>()
    figs.forEach((f, i) => { for (const p of f.pixels) owner.set(p, i) })
    const r = await prepareHeavySource()
    const W = 2172
    let checked = 0
    for (const p of r.placements) {
      const [sx, sy, sw, sh] = [p.srcBox[0]!, p.srcBox[1]!, p.srcBox[2]!, p.srcBox[3]!], [dx, dy] = [p.dst[0]!, p.dst[1]!]
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        const sp = (sy + y) * W + (sx + x)
        const dk = ((dy + y) * 1920 + (dx + x)) * 4
        if (r.image.data[dk + 3] === 0) continue
        checked++
        const o = owner.get(sp)
        // opaque output must come from own figure pixels or transparent dilation ring - never another figure
        expect(o === undefined || o === p.fig, `cell ${p.cell} pixel traces to fig ${o}`).toBe(true)
      }
    }
    expect(checked).toBeGreaterThan(300000)
  }, 20000)
})
