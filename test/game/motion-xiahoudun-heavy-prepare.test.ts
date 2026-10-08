import { describe, expect, it } from 'vitest'
import { CELLS, OUT_PATH, prepareHeavySource, SPLIT_X, SRC_SHA } from '../../scripts/prepare-xiahoudun-heavy.mjs'

describe('CMR-14A heavy prepared source', () => {
  it('pins the accepted source and the 3x3 play-order layout', () => {
    expect(SRC_SHA).toBe('21d44dcd4d4caae76d2a92467a25e396d051cca6b39420fac690dd52587bd4bf')
    expect(OUT_PATH).toBe('art/motion/xiahoudun/heavy-prepared-source.png')
    expect(CELLS).toEqual([0, 1, 2, 3, 4])
    expect(SPLIT_X).toBe(1360)
  })

  it('refuses while fig3|fig4 interleave with no clean cut (broad overlap, not fringe)', async () => {
    await expect(prepareHeavySource()).rejects.toThrow(/expected 5 drawings, found 6/)
  })
})
