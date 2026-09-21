import { describe, expect, it } from 'vitest'
import { createRng } from '../../src/core/rng'

describe('createRng', () => {
  it('produces an identical sequence for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    const seqA = Array.from({ length: 1000 }, () => a.next())
    const seqB = Array.from({ length: 1000 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it('produces different sequences for different seeds', () => {
    const a = createRng(1)
    const b = createRng(2)
    const seqA = Array.from({ length: 16 }, () => a.next())
    const seqB = Array.from({ length: 16 }, () => b.next())
    expect(seqA).not.toEqual(seqB)
  })

  it('next() stays within [0, 1)', () => {
    const rng = createRng(123)
    for (let i = 0; i < 10_000; i += 1) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('range() stays within inclusive integer bounds and covers both ends', () => {
    const rng = createRng(7)
    let sawMin = false
    let sawMax = false
    for (let i = 0; i < 10_000; i += 1) {
      const v = rng.range(3, 9)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(3)
      expect(v).toBeLessThanOrEqual(9)
      if (v === 3) sawMin = true
      if (v === 9) sawMax = true
    }
    expect(sawMin).toBe(true)
    expect(sawMax).toBe(true)
  })
})
