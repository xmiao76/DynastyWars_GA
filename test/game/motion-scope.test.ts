import { describe, expect, it } from 'vitest'
import { stageMotionScope } from '../../src/game/adapters/motion-scope'

/**
 * CMR-03 fixture tests for the request scope: stage/hero/2P/prefetch scope,
 * no all-cast downloads, and the stage-entry budget. The runtime only ever
 * requests what this policy returns.
 */

const packs = {
  guanyu: { sourceBytes: 4_328_499 }, // the repacked two-page pack
  zhangfei: { sourceBytes: 4_000_000 },
  soldier: { sourceBytes: 2_000_000 },
  spearman: { sourceBytes: 2_000_000 },
  lubu: { sourceBytes: 4_500_000 },
}
const BUDGET = 12 * 1024 * 1024

describe('stage motion scope', () => {
  it('requests hero + 2P + stage kinds with packs, nothing else', () => {
    const s = stageMotionScope({
      hero: 'guanyu',
      secondPlayer: 'zhangfei',
      stageKinds: ['soldier', 'spearman', 'archer'], // archer has no pack
      futureKinds: ['lubu', 'caocao'],
      packs,
      budgetBytes: BUDGET,
    })
    expect(s.immediate).toEqual(['guanyu', 'zhangfei', 'soldier', 'spearman'])
    // 12.33 MB already planned: the 4.5 MB lubu pack cannot fit the 12 MiB cap.
    expect(s.prefetch).toEqual([])
    expect(s.deferred).toContain('lubu')
    expect(s.deferred).toContain('caocao') // no pack -> never requested
    expect(s.deferred).toContain('archer')
  })

  it('never requests kinds outside the stage roster (no all-cast)', () => {
    const s = stageMotionScope({
      hero: 'zhaoyun', // no pack
      secondPlayer: null,
      stageKinds: ['soldier'],
      futureKinds: ['lubu', 'caocao', 'xuchu', 'zhangliao'],
      packs,
      budgetBytes: BUDGET,
    })
    expect(s.immediate).toEqual(['soldier'])
    // None of the never-appearing cast gets requested.
    expect([...s.prefetch, ...s.immediate]).not.toContain('caocao')
    expect([...s.prefetch, ...s.immediate]).not.toContain('xuchu')
  })

  it('prefetch stays inside the stage-entry budget', () => {
    const s = stageMotionScope({
      hero: 'guanyu',
      secondPlayer: null,
      stageKinds: ['soldier', 'spearman'],
      futureKinds: ['zhangfei', 'lubu'],
      packs,
      budgetBytes: BUDGET, // 4.33 + 2 + 2 = 8.33 immediate; only one more fits
    })
    expect(s.immediate).toEqual(['guanyu', 'soldier', 'spearman'])
    expect(s.prefetch, 'only one of the two future packs fits the budget').toEqual(['zhangfei'])
    expect(s.plannedBytes).toBeLessThanOrEqual(BUDGET)
  })

  it('2P counts even when identical to the hero, exactly once', () => {
    const s = stageMotionScope({
      hero: 'guanyu',
      secondPlayer: 'guanyu',
      stageKinds: [],
      futureKinds: [],
      packs,
      budgetBytes: BUDGET,
    })
    expect(s.immediate).toEqual(['guanyu'])
  })

  it('required packs past the cap fall back to legacy in priority order', () => {
    const s = stageMotionScope({
      hero: 'guanyu',
      secondPlayer: 'lubu',
      stageKinds: ['zhangfei', 'soldier'],
      futureKinds: [],
      packs,
      budgetBytes: BUDGET, // guanyu 4.33 + lubu 4.5 = 8.83; zhangfei 4.0 would reach 12.83
    })
    expect(s.immediate).toEqual(['guanyu', 'lubu', 'soldier'])
    expect(s.deferred).toContain('zhangfei')
    expect(s.plannedBytes).toBeLessThanOrEqual(BUDGET)
  })

  it('a stage with no catalogued packs requests nothing', () => {
    const s = stageMotionScope({
      hero: 'zhaoyun',
      secondPlayer: 'weiyan',
      stageKinds: ['soldier', 'archer'],
      futureKinds: ['caocao'],
      packs: {},
      budgetBytes: BUDGET,
    })
    expect(s.immediate).toEqual([])
    expect(s.prefetch).toEqual([])
    expect(s.plannedBytes).toBe(0)
  })
})
