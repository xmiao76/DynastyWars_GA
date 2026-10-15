import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { attackById, ATTACKS } from '../../src/core/attacks'
import { CHARACTERS } from '../../src/core/characters'
import { ENEMIES } from '../../src/core/enemies'
import {
  bossProfile,
  clipsForProfile,
  heroProfile,
  meleeProfile,
  shooterProfile,
  validateClipExposures,
  validateMotionProfile,
  type MotionProfile,
} from '../../src/game/art/motion-profiles'
import { guanyuClips, type MotionEntity } from '../../src/game/art/motion-clips'
import { advanceMotion as advance } from '../../src/game/art/motion-player'

/**
 * CMR-02: generic per-kind motion profiles. Core definitions are read-only;
 * every window/tick below is asserted against the exact source values.
 */

const HEROES = ['zhangfei', 'zhaoyun', 'huangzhong', 'weiyan'] as const

describe('fixture profiles validate and sample their actual capabilities', () => {
  it('every hero profile (non-Guan included) validates with its own id bindings', () => {
    for (const id of [...HEROES, 'guanyu'] as const) {
      const p = heroProfile(id)
      expect(validateMotionProfile(p), `${id} profile`).toEqual([])
      expect(p.role, id).toBe('hero')
      for (const atk of CHARACTERS[id]!.combo) expect(p.attackBindings[atk], `${id} ${atk} bound`).toBeTruthy()
      expect(p.jumpAttackId).toBe(CHARACTERS[id]!.jumpAttack)
      expect(p.attackBindings[CHARACTERS[id]!.specialAttack]).toBe('special')
    }
    // Non-Guan binding isolation: zhangfei binds only zf.* ids.
    const zf = heroProfile('zhangfei')
    expect(Object.keys(zf.attackBindings).every((id) => id.startsWith('zf.'))).toBe(true)
    expect(zf.attackBindings['gy.jab1']).toBeUndefined()
  })

  it('melee, boss and shooter fixtures validate', () => {
    expect(validateMotionProfile(meleeProfile('soldier'))).toEqual([])
    expect(validateMotionProfile(meleeProfile('spearman'))).toEqual([])
    expect(validateMotionProfile(bossProfile('lidian'))).toEqual([])
    expect(validateMotionProfile(bossProfile('xuchu'))).toEqual([])
    expect(validateMotionProfile(shooterProfile('archer'))).toEqual([])
  })

  it('capability matrix matches the kind (enemies carry no jump/special pages)', () => {
    const melee = meleeProfile('soldier')
    expect(melee.capabilities).toEqual({ jump: false, special: false, grabs: false })
    expect(melee.pages.actions, 'enemies need no action page').toBe(false)
    expect(melee.requiredClips).not.toContain('jumpattack')
    expect(melee.requiredClips).not.toContain('special')
    const boss = bossProfile('xuchu')
    expect(boss.capabilities.jump).toBe(false)
    const hero = heroProfile('zhaoyun')
    expect(hero.pages.actions).toBe(true)
    expect(hero.requiredClips).toContain('special')
  })

  it('generated clips satisfy the profile required set', () => {
    for (const p of [heroProfile('zhangfei'), meleeProfile('soldier'), bossProfile('lidian'), shooterProfile('archer')]) {
      const clips = clipsForProfile(p)
      for (const name of p.requiredClips) expect(clips[name as keyof typeof clips], `${p.id}:${name}`).toBeTruthy()
    }
  })
})

describe('every bound attack tick matches existing startup/active/recovery', () => {
  const checkBindings = (p: MotionProfile): void => {
    const clips = clipsForProfile(p)
    for (const [attackId, name] of Object.entries(p.attackBindings)) {
      const a = attackById(attackId as keyof typeof ATTACKS)
      const endActive = a.startup + a.active
      const clipDef = clips[name as keyof typeof clips]!
      expect(clipDef.duration, `${p.id}:${attackId} duration`).toBe(endActive + a.recover)
      if (a.active > 0) {
        // The strike step lands exactly at startup and the recovery step at endActive.
        const keys = clipDef.keys
        const strike = keys.find((k) => k.frame.endsWith(':4'))
        const rec = keys.find((k) => k.frame.endsWith(':5'))
        expect(strike?.tick, `${p.id}:${attackId} strike tick`).toBe(a.startup)
        expect(rec?.tick, `${p.id}:${attackId} recovery tick`).toBe(endActive)
      }
    }
  }
  it('heroes, melee and bosses bind exact windows', () => {
    for (const p of [heroProfile('zhangfei'), heroProfile('zhaoyun'), meleeProfile('soldier'), bossProfile('lidian'), bossProfile('xuchu')]) checkBindings(p)
  })

  it('zero-active special (Huang Zhong) invents no melee active window', () => {
    const p = heroProfile('huangzhong')
    expect(attackById('hz.special').active, 'source: zero active').toBe(0)
    expect(p.cues.zeroActiveSpecial).toBe(true)
    expect(p.cues.releaseFollowsProjectileSpawn).toBe(true)
    const clips = clipsForProfile(p)
    const a = attackById('hz.special')
    expect(clips.special!.duration).toBe(a.startup + a.active + a.recover)
    const strike = clips.special!.keys.find((k) => k.frame === 'special:4')
    expect(strike?.tick).toBe(a.startup)
    expect(clips.special!.keys.some((k) => k.frame === 'special:5' && k.tick === a.startup + a.active)).toBe(true)
  })

  it('shooter cues come from the source cadence with spawn-driven release', () => {
    const p = shooterProfile('archer')
    expect(p.cues.fireInterval).toBe(ENEMIES.archer!.fireInterval)
    expect(p.cues.fireInterval).toBe(90)
    expect(p.cues.releaseFollowsProjectileSpawn).toBe(true)
    expect(p.attackBindings, 'core AI has no attack state for archers').toEqual({})
  })
})

describe('two simultaneous actors cannot steal each other cues or history', () => {
  it('per-entity playback histories stay separate and idempotent per tick', () => {
    const clips = clipsForProfile(heroProfile('guanyu'))
    const art = { clips } as never as Parameters<typeof advance>[0]
    const one: MotionEntity = { state: 'attack', stateTick: 8, attackId: 'gy.jab1', airTicks: 0, z: 0 }
    const two: MotionEntity = { state: 'walk', stateTick: 3, attackId: null, airTicks: 0, z: 0 }
    const a1 = advance(art, one, 10)
    const b1 = advance(art, two, 10)
    // Render batching / extra sampling at the same tick cannot advance either.
    const a1again = advance(art, one, 10, a1.playback)
    const b1again = advance(art, two, 10, b1.playback)
    expect(a1again.frame).toBe(a1.frame)
    expect(b1again.frame).toBe(b1.frame)
    // Each actor continues its own timeline from its own history.
    const a2 = advance(art, { ...one, stateTick: 12 }, 11, a1.playback)
    const b2 = advance(art, { ...two, stateTick: 5 }, 11, b1.playback)
    expect(a2.frame, 'actor one keeps its jab1 timeline').toBe('jab1:4')
    expect(b2.frame, 'actor two keeps its walk timeline').toBe('walk:2')
  })
})

describe('Guan Yu reference is untouched by the profile layer', () => {
  it('guanyuClips hash equals the frozen reference (clipsHash cd926d06...)', () => {
    // Normalize exactly like the CMR-01 freeze probe ({loop,duration,keys}).
    const norm = Object.fromEntries(
      Object.entries(guanyuClips()).map(([k, v]) => [k, { loop: v.loop, duration: v.duration, keys: v.keys }]),
    )
    const hash = createHash('sha256').update(JSON.stringify(norm)).digest('hex')
    expect(hash).toBe('cd926d062b86def8f6a309b480d4b9383a6a612985dbff920837e28fa06ec31f')
  })
  it('guanyu profile validates and binds gy.* exactly', () => {
    const p = heroProfile('guanyu')
    expect(validateMotionProfile(p)).toEqual([])
    for (const atk of CHARACTERS.guanyu!.combo) expect(p.attackBindings[atk] === 'jab1' || p.attackBindings[atk] === 'jab2' || p.attackBindings[atk] === 'finisher').toBe(true)
  })
})

describe('negative controls reject malformed profiles', () => {
  it('unknown attack ids and unknown clips fail validation', () => {
    const p = heroProfile('zhangfei')
    expect(validateMotionProfile({ ...p, attackBindings: { ...p.attackBindings, 'gy.nope': 'jab1' } }).join(' ')).toContain('unknown attack id')
    expect(validateMotionProfile({ ...p, attackBindings: { ...p.attackBindings, 'zf.jab1': 'nosuchclip' } }).join(' ')).toContain('unknown clip')
    expect(validateMotionProfile({ ...p, requiredClips: [...p.requiredClips, 'wobble'] }).join(' ')).toContain('unknown required clip')
    expect(validateMotionProfile({ ...p, attackBindings: { ...p.attackBindings, 'zf.jab1': 'fall' } }).join(' ')).toContain('is not an attack clip')
  })

  it('wrong role bindings fail validation', () => {
    const shooter = shooterProfile('archer')
    expect(validateMotionProfile({ ...shooter, attackBindings: { 'spear.thrust': 'jab1' } }).join(' ')).toContain('must not bind melee attacks')
    const hero = heroProfile('zhangfei')
    expect(validateMotionProfile({ ...hero, jumpAttackId: undefined }).join(' ')).toContain('lacks a jump attack binding')
    expect(validateMotionProfile({ ...hero, cues: { fireInterval: 90 } }).join(' ')).toContain('must not carry a shooter fire cadence')
    expect(validateMotionProfile({ ...hero, capabilities: { ...hero.capabilities, special: false } }).join(' ')).toContain('capability matrix incomplete')
    const boss = bossProfile('lidian')
    const two = Object.fromEntries(Object.entries(boss.attackBindings).slice(0, 2))
    expect(validateMotionProfile({ ...boss, attackBindings: two }).join(' ')).toContain('must bind charge/combo/heavy')
    const melee = meleeProfile('soldier')
    expect(validateMotionProfile({ ...melee, capabilities: { ...melee.capabilities, special: true } }).join(' ')).toContain('must not claim hero abilities')
  })

  it('shooter without cadence or spawn-driven release fails', () => {
    const shooter = shooterProfile('archer')
    expect(validateMotionProfile({ ...shooter, cues: {} }).join(' ')).toContain('lacks a firing cadence')
    expect(validateMotionProfile({ ...shooter, cues: { fireInterval: 90 } }).join(' ')).toContain('must release on projectile spawn')
  })

  it('malformed exposure ordering fails', () => {
    expect(validateClipExposures({ w: { loop: false, duration: 10, keys: [{ tick: 0, frame: 'a' }, { tick: 4, frame: 'b' }, { tick: 4, frame: 'c' }] } }).join(' ')).toContain('not strictly increasing')
    expect(validateClipExposures({ w: { loop: false, duration: 10, keys: [{ tick: 0, frame: 'a' }, { tick: 10, frame: 'b' }] } }).join(' ')).toContain('beyond duration')
    expect(validateClipExposures({ w: { loop: false, duration: 0, keys: [] } }).join(' ')).toContain('non-positive duration')
    const clean = validateClipExposures(clipsForProfile(heroProfile('zhangfei')))
    expect(clean).toEqual([])
  })
})
