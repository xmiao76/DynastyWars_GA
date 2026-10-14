import { describe, expect, it } from 'vitest'
import { CHARACTER_ORDER } from '../../src/core/characters'
import { STAGES, STAGE_ORDER } from '../../src/core/stage'
import { motionPackSourceBytes, motionStageRequest } from '../../src/game/adapters/motion-art'
import { CONTRACT_CAPS } from '../../src/game/adapters/motion-catalog'
import { kindsDueByTick, stageMotionScope } from '../../src/game/adapters/motion-scope'
import { secondPlayerCharacter } from '../../src/game/players'

/**
 * Wave-aware stage motion scope (sole-motion Phase 1A): the entry gate
 * awaits only the selected heroes plus the opening spawn window, charges
 * only NEW immediate bytes against the 12 MiB cap, and schedules every
 * later stage kind (later waves, then the boss) in first-spawn order.
 */

const packs = {
  guanyu: { sourceBytes: 4_328_499 }, // the repacked two-page pack
  zhangfei: { sourceBytes: 4_000_000 },
  soldier: { sourceBytes: 2_000_000 },
  spearman: { sourceBytes: 2_000_000 },
  xuchu: { sourceBytes: 4_500_000 },
}
const BUDGET = CONTRACT_CAPS.stageDownloads
const sum = (kinds: readonly string[], table: Record<string, { sourceBytes: number }>): number =>
  kinds.reduce((n, kind) => n + (table[kind]?.sourceBytes ?? 0), 0)

describe('stage motion scope (fixtures)', () => {
  it('partitions by first spawn: heroes + opening wave immediate, later waves and boss deferred in spawn order', () => {
    const s = stageMotionScope({
      hero: 'guanyu',
      secondPlayer: 'zhangfei',
      stageKinds: ['soldier', 'spearman', 'archer', 'xuchu'],
      spawnSchedule: [
        { kind: 'soldier', tick: 0 },
        { kind: 'spearman', tick: 1 },
        { kind: 'archer', tick: 2 },
        { kind: 'xuchu', tick: 3 }, // boss
      ],
      futureKinds: [],
      packs,
      budgetBytes: BUDGET,
    })
    expect(s.immediate).toEqual(['guanyu', 'zhangfei', 'soldier'])
    // Spearman + the boss no longer need to fit the entry cap alongside the
    // opening set: they are scheduled, in first-spawn order, not dropped.
    expect(s.deferred).toEqual(['spearman', 'xuchu'])
    expect(s.unsupported).toEqual(['archer']) // no pack -> never requested
    expect(s.immediateBytes).toBe(sum(s.immediate, packs))
    expect(s.immediateBytes).toBeLessThanOrEqual(BUDGET)
    expect(s.deferredBytes).toBe(sum(s.deferred, packs))
    expect(s.plannedBytes, 'entry plan charges immediate (+ future prefetch) only').toBe(s.immediateBytes)
    expect(s.entryOverBudget).toBe(false)
    expect(s.schedule.map((e) => [e.kind, e.firstSpawnTick, e.bucket])).toEqual([
      ['guanyu', 0, 'immediate'],
      ['zhangfei', 0, 'immediate'],
      ['soldier', 0, 'immediate'],
      ['spearman', 1, 'deferred'],
      ['archer', 2, 'unsupported'],
      ['xuchu', 3, 'deferred'],
    ])
    expect(kindsDueByTick(s, 0)).toEqual(s.immediate)
    expect(kindsDueByTick(s, 1)).toEqual([...s.immediate, 'spearman'])
    expect(kindsDueByTick(s, 3)).toEqual([...s.immediate, 'spearman', 'xuchu'])
    // Spawn-gate contract: a deferred kind is NOT due (its prefetch failure
    // is non-fatal) until its first-spawn tick, and an unsupported kind is
    // never due at any tick.
    expect(kindsDueByTick(s, 0)).not.toContain('spearman')
    expect(kindsDueByTick(s, 99)).not.toContain('archer')
  })

  it('never requests kinds outside the stage roster (no all-cast)', () => {
    const s = stageMotionScope({
      hero: 'zhaoyun', // no pack in this fixture table
      secondPlayer: null,
      stageKinds: ['soldier'],
      spawnSchedule: [{ kind: 'soldier', tick: 0 }],
      futureKinds: ['xuchu', 'lidian', 'zhaoyun', 'weiyan'],
      packs,
      budgetBytes: BUDGET,
    })
    expect(s.immediate).toEqual(['soldier'])
    expect(s.unsupported).toContain('zhaoyun')
    expect([...s.immediate, ...s.deferred]).not.toContain('lidian')
    expect([...s.immediate, ...s.deferred]).not.toContain('weiyan')
  })

  it('charges only uncached immediate bytes: a cached hero frees the opening window', () => {
    const base = {
      hero: 'guanyu',
      secondPlayer: null,
      stageKinds: ['soldier', 'spearman'],
      spawnSchedule: [
        { kind: 'soldier', tick: 0 },
        { kind: 'spearman', tick: 0 },
      ],
      futureKinds: [],
      packs,
      budgetBytes: 5_000_000,
    }
    const cold = stageMotionScope(base)
    // Cold: guanyu alone leaves < 2 MB, so both opening mooks are bumped.
    expect(cold.immediate).toEqual(['guanyu'])
    expect(cold.overBudget).toEqual(['soldier', 'spearman'])
    expect(cold.entryOverBudget).toBe(true)

    const warm = stageMotionScope({ ...base, cachedKinds: ['guanyu'] })
    // Warm: the cached hero costs no entry download, so the whole opening
    // window fits the same cap; cached bytes are reported separately.
    expect(warm.immediate).toEqual(['guanyu', 'soldier', 'spearman'])
    expect(warm.immediateBytes).toBe(sum(['soldier', 'spearman'], packs))
    expect(warm.cachedBytes).toBe(packs.guanyu.sourceBytes)
    expect(warm.entryOverBudget).toBe(false)
  })

  it('an opening kind past the cap is bumped to the front of deferred, heroes still outrank it', () => {
    const s = stageMotionScope({
      hero: 'guanyu',
      secondPlayer: 'xuchu',
      stageKinds: ['soldier', 'spearman'],
      spawnSchedule: [
        { kind: 'soldier', tick: 0 },
        { kind: 'spearman', tick: 1 },
      ],
      futureKinds: [],
      packs,
      budgetBytes: 9_000_000, // guanyu + xuchu = 8.83 MB; soldier cannot also fit
    })
    expect(s.immediate).toEqual(['guanyu', 'xuchu'])
    expect(s.deferred, 'bumped opening kind stays first in spawn order').toEqual(['soldier', 'spearman'])
    expect(s.overBudget).toEqual(['soldier'])
    expect(s.immediateBytes).toBeLessThanOrEqual(9_000_000)
  })

  it('future-stage prefetch stays inside the leftover entry budget and out of the stage partition', () => {
    const s = stageMotionScope({
      hero: 'guanyu',
      secondPlayer: null,
      stageKinds: ['soldier'],
      spawnSchedule: [{ kind: 'soldier', tick: 0 }],
      futureKinds: ['zhangfei', 'xuchu'],
      packs,
      budgetBytes: BUDGET,
    })
    expect(s.immediate).toEqual(['guanyu', 'soldier'])
    expect(s.prefetch, 'only one of the two future packs fits the leftover budget').toEqual(['zhangfei'])
    expect(s.deferred, 'future kinds are not stage-spawnable, so not scheduled here').toEqual([])
    expect([...s.immediate, ...s.deferred, ...s.prefetch]).not.toContain('xuchu')
    expect(s.plannedBytes).toBe(s.immediateBytes + sum(s.prefetch, packs))
    expect(s.plannedBytes).toBeLessThanOrEqual(BUDGET)
  })

  it('legacy callers without a schedule keep the all-opening greedy policy', () => {
    const s = stageMotionScope({
      hero: 'guanyu',
      secondPlayer: 'zhangfei',
      stageKinds: ['soldier', 'spearman', 'xuchu'],
      futureKinds: [],
      packs,
      budgetBytes: BUDGET,
    })
    // Every stage kind is an opening candidate in roster order, exactly as
    // before wave scheduling; the boss that overflows is now deferred
    // (scheduled) instead of silently never requested.
    expect(s.immediate).toEqual(['guanyu', 'zhangfei', 'soldier', 'spearman'])
    expect(s.deferred).toEqual(['xuchu'])
    expect(s.overBudget).toEqual(['xuchu'])
    expect(s.plannedBytes).toBe(sum(s.immediate, packs))
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
    expect(s.schedule).toHaveLength(1)
  })

  it('a stage with no catalogued packs requests nothing', () => {
    const s = stageMotionScope({
      hero: 'zhaoyun',
      secondPlayer: 'weiyan',
      stageKinds: ['soldier', 'archer'],
      spawnSchedule: [
        { kind: 'soldier', tick: 0 },
        { kind: 'archer', tick: 1 },
      ],
      futureKinds: ['lidian'],
      packs: {},
      budgetBytes: BUDGET,
    })
    expect(s.immediate).toEqual([])
    expect(s.deferred).toEqual([])
    expect(s.prefetch).toEqual([])
    expect(s.unsupported).toEqual(['zhaoyun', 'weiyan', 'soldier', 'archer'])
    expect(s.plannedBytes).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Exhaustive: every stage x hero x {solo, default pair, each co-op partner},
// all values derived from the core stage data and the real pack catalog.
// ---------------------------------------------------------------------------

const realPacks = motionPackSourceBytes()

/** First appearance per spawnable kind: wave index + flattened spawn order; boss after all waves. */
function firstSpawnOf(stageId: string): Map<string, { tick: number; seq: number }> {
  const stage = STAGES[stageId]!
  const first = new Map<string, { tick: number; seq: number }>()
  let seq = 0
  stage.waves.forEach((wave, tick) => {
    for (const spawn of wave.spawns) {
      if (!first.has(spawn.kind)) first.set(spawn.kind, { tick, seq })
      seq += 1
    }
  })
  if (!first.has(stage.bossKind)) first.set(stage.bossKind, { tick: stage.waves.length, seq })
  return first
}

const byFirstSpawn = (first: Map<string, { tick: number; seq: number }>) => (a: string, b: string): number =>
  first.get(a)!.tick - first.get(b)!.tick || first.get(a)!.seq - first.get(b)!.seq

describe('exhaustive wave scope over real stage data', () => {
  for (const stageId of STAGE_ORDER) {
    const stage = STAGES[stageId]!
    const first = firstSpawnOf(stageId)
    // Catalogued kinds this stage can spawn (waves + boss), spawn order.
    const spawnable = [...first.keys()].filter((kind) => realPacks[kind]).sort(byFirstSpawn(first))
    const openingKinds = [...new Set(stage.waves[0]!.spawns.map((s) => s.kind))].filter((kind) => realPacks[kind])

    for (const hero of CHARACTER_ORDER) {
      const selections: Array<{ label: string; second: string | null }> = [
        { label: 'solo', second: null },
        { label: 'default pair', second: secondPlayerCharacter(hero) },
        ...CHARACTER_ORDER.filter((id) => id !== hero && id !== secondPlayerCharacter(hero)).map((id) => ({
          label: `co-op ${id}`,
          second: id as string,
        })),
      ]

      for (const { label, second } of selections) {
        it(`${stageId} / ${hero} / ${label}`, () => {
          const heroes = [...new Set([hero, second].filter(Boolean) as string[])]
          const req = motionStageRequest(stageId, hero, second)
          const scope = stageMotionScope({ ...req, packs: realPacks, budgetBytes: BUDGET })

          // Immediate = selected heroes first, then the opening wave's
          // catalogued kinds in spawn order - nothing from later waves.
          const expectedImmediate = [...heroes, ...openingKinds.filter((k) => !heroes.includes(k))]
          expect(scope.immediate).toEqual(expectedImmediate)
          // Entry budget: only (all-uncached here) immediate bytes count.
          expect(scope.immediateBytes).toBe(sum(expectedImmediate, realPacks))
          expect(scope.immediateBytes).toBeLessThanOrEqual(BUDGET)
          expect(scope.entryOverBudget).toBe(false)
          expect(scope.overBudget).toEqual([])

          // Partition: every spawnable catalogued kind (plus the heroes)
          // appears exactly once across immediate + deferred.
          const partitioned = [...scope.immediate, ...scope.deferred]
          expect(new Set(partitioned).size).toBe(partitioned.length)
          expect([...partitioned].sort()).toEqual([...new Set([...heroes, ...spawnable])].sort())

          // Deferred order respects first spawn (later waves, boss last).
          const expectedDeferred = spawnable.filter((k) => !expectedImmediate.includes(k)).sort(byFirstSpawn(first))
          expect(scope.deferred).toEqual(expectedDeferred)
          const ticks = scope.deferred.map((k) => scope.schedule.find((e) => e.kind === k)!.firstSpawnTick)
          expect(ticks).toEqual([...ticks].sort((a, b) => a - b))
          for (const kind of spawnable) {
            const entry = scope.schedule.find((e) => e.kind === kind)!
            expect(entry.firstSpawnTick, `${kind} tick`).toBe(first.get(kind)!.tick)
          }
          if (realPacks[stage.bossKind]) {
            expect(scope.deferred[scope.deferred.length - 1], 'boss scheduled after every wave').toBe(stage.bossKind)
          }

          // Kinds without packs are never in the request partition.
          for (const kind of scope.unsupported) expect(realPacks[kind]).toBeUndefined()
          expect(scope.unsupported).toEqual(expect.arrayContaining(req.stageKinds.filter((k) => !realPacks[k])))
        })
      }

      it(`${stageId} / ${hero} / late co-op hero stays loadable after a solo entry`, () => {
        const solo = stageMotionScope({
          ...motionStageRequest(stageId, hero, null),
          packs: realPacks,
          budgetBytes: BUDGET,
        })
        const partner = secondPlayerCharacter(hero)
        expect([...solo.immediate, ...solo.deferred]).not.toContain(partner)
        // Joining late: everything the solo entry scheduled is now cached,
        // so the partner is an immediate candidate charged only its own
        // new bytes - always inside the unchanged cap.
        const joined = stageMotionScope({
          ...motionStageRequest(stageId, hero, partner),
          packs: realPacks,
          budgetBytes: BUDGET,
          cachedKinds: [...solo.immediate, ...solo.deferred],
        })
        expect(joined.immediate).toContain(partner)
        expect(joined.immediateBytes).toBe(realPacks[partner]!.sourceBytes)
        expect(joined.immediateBytes).toBeLessThanOrEqual(BUDGET)
        expect(joined.cachedBytes).toBe(sum(solo.immediate, realPacks))
        expect(joined.entryOverBudget).toBe(false)
      })
    }
  }
})
