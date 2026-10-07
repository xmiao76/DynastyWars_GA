import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { compareChargeSilhouetteTops, topDeltas } from '../../scripts/compare-xiahoudun-lidian-charge-silhouette.mjs'

const lidian = JSON.parse(readFileSync('src/game/assets/motion/lidian-prepared.json', 'utf8'))

function candidate(overrides: Record<string, number> = {}) {
  // Self-contained fixture mirroring the registered candidate geometry
  // (bbox y in canonical art px; groundY136*density2=272), so the test does not
  // depend on gitignored generated artifacts.
  const y: Record<string, number> = { 'walk:0': 66.54, 'charge:0': 101.7, 'charge:1': 98.0, 'charge:2': 92.6, 'charge:3': 80.2, 'charge:4': 65.1 }
  return { box: { groundY: 136 }, density: 2, frames: Object.fromEntries(Object.entries({ ...y, ...overrides }).map(([k, v]) => [k, { bounds: { y: v } }])) }
}

describe('CMR-14A Li Dian vs Xiahou Dun adjacent silhouette-top envelope', () => {
  it('computes adjacent deltas along guard->charge0..4->guard and reproduces the Li Dian pack numbers', () => {
    const out = compareChargeSilhouetteTops(lidian, candidate())
    expect(out.sequence).toEqual(['walk:0', 'charge:0', 'charge:1', 'charge:2', 'charge:3', 'charge:4', 'walk:0'])
    expect(out.lidian.map(r => r.delta)).toEqual([-36.5, 16, -1.5, 3.5, 6.5, 12])
    expect(out.maxAdjacentAbsDelta.lidian).toBe(36.5)
    expect(out.dashToDash2.lidian).toBe(3.5)
    expect(out.limits).toMatch(/not head\/pelvis\/skull/i)
  })

  it('negative control: a genuine pop beyond the accepted precedent is visible, and missing frames fail loudly', () => {
    const popped = compareChargeSilhouetteTops(lidian, candidate({ 'charge:3': 0 }))
    expect(popped.maxAdjacentAbsDelta.xiahoudun).toBeGreaterThan(36.5)
    expect(() => compareChargeSilhouetteTops(lidian, { box: { groundY: 136 }, density: 2, frames: {} })).toThrow(/candidate frame missing/)
    expect(topDeltas(['a', 'b'], n => (n === 'a' ? 10 : 12.345))).toEqual([{ from: 'a', to: 'b', topFrom: 10, topTo: 12.35, delta: 2.35 }])
  })
})
