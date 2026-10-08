import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { CELLS, OUT_PATH, prepareHeavySource, SPLIT_X, SRC_SHA } from '../../scripts/prepare-xiahoudun-heavy.mjs'

describe('CMR-14A heavy prepared source', () => {
  it('pins the accepted source and the 3x3 play-order layout', () => {
    expect(SRC_SHA).toBe('7c5de005ae47c239bdeeb0ece6d0c7d5dd4fdf742b74c41d54c3d1a182c0ffb2')
    expect(OUT_PATH).toBe('art/motion/xiahoudun/heavy-prepared-source.png')
    expect(CELLS).toEqual([0, 1, 2, 3, 4])
    expect(SPLIT_X).toBe(1479)
  })

  it('arranges 5 separated native-scale drawings with nothing lost or fused', async () => {
    const a = await prepareHeavySource()
    expect(a.composition.drawings).toBe(5)
    expect(a.placements.map(p => p.cell).sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4])
    for (const p of a.placements) {
      expect(p.dst[2]).toBe(p.srcBox[2])
      expect(p.dst[3]).toBe(p.srcBox[3])
    }
    const b = await prepareHeavySource()
    expect(createHash('sha256').update(b.image.data).digest('hex'))
      .toBe(createHash('sha256').update(a.image.data).digest('hex'))
  })
})
