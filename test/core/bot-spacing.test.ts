import { describe, expect, it } from 'vitest'
import { BOT_STEP_BATCH, decideBotScript } from '../../selfplay/bot'
import type { SimSnapshot } from '../../src/core/snapshot'
import type { GameSnapshot } from '../../src/game/debug/bridge'

/**
 * ENH-4: the self-play bot spaces swings off the DRIVEN hero's own opening
 * combo hit, not hard-coded Zhao Yun jab data. Guan Yu (reach 30) swings
 * where the old window (26) would have leapt; Huang Zhong (reach 22)
 * closes in where the old window would have swung at air.
 */

function baseSim(charId: string): SimSnapshot {
  return {
    tick: 100,
    scrollX: 0,
    cameraLocked: false,
    waveIndex: 0,
    stageLength: 1000,
    charId,
    stageId: 'stage1',
    phase: 'fight',
    lives: 3,
    player: {
      x: 100, y: 200, z: 0, hp: 120, maxHp: 120, state: 'idle', facing: 'right',
      invulnerable: false, weapon: 'sword', mounted: false, horseHp: null,
    },
    player2: null,
    char2Id: null,
    enemies: [],
    items: [],
    stats: { foodEaten: 0, specialsUsed: 0, score: 0, comboHits: 0, comboTicksLeft: 0 },
  }
}

function snapshotOf(sim: SimSnapshot): GameSnapshot {
  return { scene: 'game', tick: sim.tick, sim, sfxPlayed: 0, muted: false }
}

describe('bot spacing follows the driven hero', () => {
  it('swings at an enemy inside its own jab reach, not Zhao Yun range', () => {
    // 24px ahead: inside Guan Yu jab window (reach 30 - 4) but outside the
    // old shared window (26 - 4), so old code leaps instead of swinging.
    const enemy = { id: 7, kind: 'soldier', x: 124, y: 200, z: 0, hp: 24, state: 'idle' as const, vx: 0, boss: false }
    const gy = baseSim('guanyu')
    gy.enemies = [enemy]
    const script = decideBotScript(snapshotOf(gy))
    expect(script).toHaveLength(BOT_STEP_BATCH)
    expect(script[0]?.jumpPressed).toBe(false)
    expect(script[1]?.attackPressed).toBe(true)
    // Huang Zhong jab is shorter (reach 22 - 4): the same enemy is out of
    // range, so he closes in with a jump kick instead of whiffing a swing.
    const hz = baseSim('huangzhong')
    hz.enemies = [{ ...enemy }]
    const hzScript = decideBotScript(snapshotOf(hz))
    expect(hzScript[0]?.jumpPressed).toBe(true)
    expect(hzScript[1]?.attackPressed ?? false).toBe(false)
  })

  it('spaces crate swings off its own jab too', () => {
    const crate = { id: 9, kind: 'crate', x: 124, y: 200, state: 'idle' as const }
    const gy = baseSim('guanyu')
    gy.items = [crate]
    expect(decideBotScript(snapshotOf(gy))[1]?.attackPressed).toBe(true)
    const hz = baseSim('huangzhong')
    hz.items = [{ ...crate }]
    const hzScript = decideBotScript(snapshotOf(hz))
    expect(hzScript[1]?.attackPressed ?? false).toBe(false)
    expect(hzScript[0]?.right).toBe(true)
  })

  it('mounted riders still space off the long spear sweep', () => {
    // 30px ahead: inside the sweep (reach 38 - 4) but outside every hero jab.
    const sim = baseSim('huangzhong')
    sim.enemies = [{ id: 7, kind: 'soldier', x: 130, y: 200, z: 0, hp: 24, state: 'idle' as const, vx: 0, boss: false }]
    sim.player.mounted = true
    expect(decideBotScript(snapshotOf(sim))[1]?.attackPressed).toBe(true)
  })
})
