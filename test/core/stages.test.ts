import { describe, expect, it } from 'vitest'
import { attackById } from '../../src/core/attacks'
import { enemyByKind } from '../../src/core/enemies'
import { createSim, snapshotSim } from '../../src/core/sim'
import { STAGE_ORDER, STAGES } from '../../src/core/stage'

describe('stage definitions', () => {
  it('stage-2 wave-1 spawns are deterministic from the seed and differ from stage 1', () => {
    const a = snapshotSim(createSim(42, { stageId: 'stage2' })).enemies.map(({ x, y }) => ({ x, y }))
    const b = snapshotSim(createSim(42, { stageId: 'stage2' })).enemies.map(({ x, y }) => ({ x, y }))
    expect(a).toEqual(b)
    expect(a).toHaveLength(4)
    const s1 = snapshotSim(createSim(42, { stageId: 'stage1' })).enemies.map(({ x, y }) => ({ x, y }))
    expect(a).not.toEqual(s1)
  })

  it('every stage boss has valid pattern data and resolvable attacks', () => {
    for (const stageId of STAGE_ORDER) {
      const stage = STAGES[stageId]
      expect(stage, `missing stage ${stageId}`).toBeDefined()
      const boss = enemyByKind(stage?.bossKind ?? '')
      expect(boss.boss, `boss field missing for ${boss.kind}`).toBeDefined()
      if (!boss.boss) throw new Error(`boss field missing for ${boss.kind}`)
      for (const attackId of [boss.boss.charge, boss.boss.combo, boss.boss.heavy]) {
        expect(attackById(attackId).damage).toBeGreaterThan(0)
      }
      expect(boss.boss.enrageRatio).toBeGreaterThan(0)
      expect(boss.boss.enrageRatio).toBeLessThanOrEqual(0.5)
      expect(boss.boss.thinkRange[0]).toBeLessThanOrEqual(boss.boss.thinkRange[1])
    }
  })

  it('Xiahou Dun is measurably tougher and faster-thinking than Li Dian', () => {
    const lidian = enemyByKind('lidian')
    const xiahou = enemyByKind('xiahoudun')
    expect(xiahou.maxHp).toBeGreaterThan(lidian.maxHp)
    expect(xiahou.boss?.charge).toBe('charge.dash.long')
    expect(lidian.boss?.charge).toBe('charge.dash')
    expect(xiahou.boss?.thinkRange[1]).toBeLessThan(lidian.boss?.thinkRange[1] ?? 0)
    expect(xiahou.boss?.enrageRatio).toBeGreaterThan(lidian.boss?.enrageRatio ?? 1)
  })

  it('carries score into a new sim for stage transitions', () => {
    expect(createSim(1, { stageId: 'stage2', score: 500 }).stats.score).toBe(500)
    expect(createSim(1, { stageId: 'stage2', lives: 2 }).lives).toBe(2)
  })

  it('all nine stages exist with deterministic wave-1 spawns within bounds', () => {
    expect(STAGE_ORDER).toHaveLength(9)
    for (const stageId of STAGE_ORDER) {
      const stage = STAGES[stageId]
      if (!stage) throw new Error(`missing stage ${stageId}`)
      const a = snapshotSim(createSim(42, { stageId })).enemies.map(({ x, y }) => ({ x, y }))
      const b = snapshotSim(createSim(42, { stageId })).enemies.map(({ x, y }) => ({ x, y }))
      expect(a).toEqual(b)
      expect(a.length).toBeGreaterThan(0)
      for (const spawn of a) {
        expect(spawn.x).toBeGreaterThan(0)
        expect(spawn.x).toBeLessThan(stage.length)
      }
    }
  })

  it('every boss has a distinct enrage ratio and signature attack data', () => {
    const ratios = STAGE_ORDER.map((stageId) => {
      const boss = enemyByKind(STAGES[stageId]?.bossKind ?? '')
      expect(boss.boss, `boss field missing for ${boss.kind}`).toBeDefined()
      return boss.boss?.enrageRatio ?? -1
    })
    expect(new Set(ratios).size).toBe(ratios.length)
    // Signature attacks resolve to real, distinct defs.
    const signatures = STAGE_ORDER.map((stageId) => {
      const boss = enemyByKind(STAGES[stageId]?.bossKind ?? '')
      return `${boss.boss?.charge}/${boss.boss?.combo}/${boss.boss?.heavy}`
    })
    expect(new Set(signatures).size).toBe(ratios.length)
  })

  it('Lu Bu outclasses every other boss in HP and heavy damage', () => {
    const lubu = enemyByKind('lubu')
    for (const stageId of STAGE_ORDER) {
      const stage = STAGES[stageId]
      if (!stage || stage.bossKind === 'lubu') continue
      const boss = enemyByKind(stage.bossKind)
      expect(lubu.maxHp).toBeGreaterThan(boss.maxHp)
      expect(attackById(lubu.boss?.heavy ?? '').damage).toBeGreaterThan(
        attackById(boss.boss?.heavy ?? '').damage,
      )
    }
  })
})
