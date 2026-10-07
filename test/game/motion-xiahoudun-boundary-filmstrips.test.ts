import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { exposureBoundaries } from '../../scripts/render-xiahoudun-boundary-filmstrips.mjs'

const spec = JSON.parse(readFileSync('art/motion/xiahoudun/charge-registration-candidate.json', 'utf8')) as {
  exposures: Array<{ tick: number; frame: string }>
}

describe('CMR-14A boundary filmstrip selection', () => {
  it('pairs the tick before and after EVERY exposure change of the registered candidate (six hard cuts)', () => {
    const b = exposureBoundaries(spec.exposures)
    expect(b).toEqual([
      { before: 2, after: 3, from: 'walk:0', to: 'charge:0' },
      { before: 6, after: 7, from: 'charge:0', to: 'charge:1' },
      { before: 7, after: 8, from: 'charge:1', to: 'charge:2' },
      { before: 20, after: 21, from: 'charge:2', to: 'charge:3' },
      { before: 33, after: 34, from: 'charge:3', to: 'charge:4' },
      { before: 42, after: 43, from: 'charge:4', to: 'walk:0' },
    ])
  })

  it('negative control: a retimed exposure map moves the pairs, so stale filmstrips cannot hide a retime', () => {
    const retimed = spec.exposures.map(e => (e.tick === 21 ? { ...e, tick: 24 } : e))
    const b = exposureBoundaries(retimed)
    expect(b.find(x => x.to === 'charge:3')).toEqual({ before: 23, after: 24, from: 'charge:2', to: 'charge:3' })
    expect(b).not.toEqual(exposureBoundaries(spec.exposures))
    expect(exposureBoundaries([{ tick: 0, frame: 'walk:0' }])).toEqual([])
  })
})
