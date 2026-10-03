import { describe, expect, it } from 'vitest'
import { DYING_TICKS, GETUP_TICKS, JUMP_DURATION, KNOCKDOWN_TICKS, PLAYER_HITSTUN_TICKS } from '../../src/core/constants'
import { CHARACTERS } from '../../src/core/characters'
import { ATTACKS } from '../../src/core/attacks'
import zhangfeiPreparedJson from '../../src/game/assets/motion/zhangfei-prepared.json'
import type { MotionPrepared } from '../../src/game/adapters/motion-art'
import type { MotionArt, MotionEntity } from '../../src/game/art/motion-clips'
import { sampleClip, motionFrameForEntity } from '../../src/game/art/motion-clips'
import {
  ZHANGFEI_ATTACK_BINDINGS,
  ZHANGFEI_FRAMES,
  motionFrameForZhangfei,
  zhangfeiClips,
  validZhangfeiPack,
} from '../../src/game/art/motion-clips-zhangfei'
import { validateClipExposures, validateMotionProfile, heroProfile } from '../../src/game/art/motion-profiles'

/**
 * CMR-09B bounded work 2: every real state/attack/clock of Zhang Fei is
 * bound and exercised. Every dispatched frame must exist in the prepared
 * pack - an unknown frame would break the shared-atlas display.
 *
 * The pack uses compact positions (walk:0-8, jab1/jab2/finisher:0-4,
 * jump:0-5, fall:0-4, getup:0-4, misc:0-4, special:0-4, rider:0-5); the
 * dispatch maps the hero states onto these names. These tests read the
 * prepared record (scripts/emit-zhangfei-runtime.mjs output) directly:
 * catalog registration (MOTION_PACKS entry + publish wiring) lands with
 * the CMR-09B fix, once the owner resolves the decoded-cap blocker.
 * Bookends hold by clip convention (no alias records in the culled
 * layout): every guard point IS walk:0 and every down point IS fall:4 -
 * the same pattern as Guan Yu's clips.
 */

const meta = zhangfeiPreparedJson as unknown as MotionPrepared
const art: MotionArt = {
  ...meta,
  sheet: {} as CanvasImageSource,
  actionSheet: {} as CanvasImageSource,
  clips: zhangfeiClips(),
  attackBindings: ZHANGFEI_ATTACK_BINDINGS,
}
const base: MotionEntity = { state: 'idle', stateTick: 0, attackId: null, mountedOn: null }

describe('zhangfei pack registration', () => {
  it('the prepared record validates as a zhangfei pack', () => {
    expect(validZhangfeiPack(meta)).toBe(true)
    expect(meta.singlePage).toBeFalsy()
    expect(Object.keys(meta.frames)).toHaveLength(56)
    expect(meta.revision).toBe('zhangfei-1')
    expect(meta.sheet).toEqual({ width: 2004, height: 2026 })
    expect(meta.actionSheet).toEqual({ width: 1693, height: 768 })
    expect(Object.values(ZHANGFEI_FRAMES).reduce((a, b) => a + b, 0)).toBe(56)
  })

  it('negative controls: missing frame / wrong cell / overlap / bad sheet fail the pack', () => {
    const frames = { ...meta.frames }
    delete frames['jab1:2']
    expect(validZhangfeiPack({ ...meta, frames })).toBe(false)
    const bad = { ...meta.frames }
    bad['walk:0'] = { ...bad['walk:0']!, srcW: 100, srcH: 100 }
    expect(validZhangfeiPack({ ...meta, frames: bad })).toBe(false)
    // Overlap on the SAME page fails; find two frames sharing a texture.
    const names = Object.keys(meta.frames)
    const a = names.find((n) => (meta.frames[n]!.sheet ?? 'sheet') === 'sheet')!
    const b = names.find((n) => n !== a && (meta.frames[n]!.sheet ?? 'sheet') === 'sheet')!
    const overlap = { ...meta.frames }
    overlap[b] = { ...overlap[b]!, x: overlap[a]!.x, y: overlap[a]!.y }
    expect(validZhangfeiPack({ ...meta, frames: overlap }), 'genuinely overlapping rects fail').toBe(false)
    const wrongSheet = { ...meta.frames }
    wrongSheet['walk:1'] = { ...wrongSheet['walk:1']!, sheet: 'bogus' as unknown as 'actions' }
    expect(validZhangfeiPack({ ...meta, frames: wrongSheet })).toBe(false)
    expect(validZhangfeiPack({ ...meta, id: 'guanyu' })).toBe(false)
    expect(validZhangfeiPack({ ...meta, density: 0 })).toBe(false)
  })

  it('shared guard/down bookends by clip convention (walk:0 guard, fall:4 down)', () => {
    // The culled layout carries no alias records: every guard point IS
    // walk:0 and every down point IS fall:4, so the drawings can never
    // drift - the same pattern as Guan Yu's clips.
    expect(meta.frames['walk:0'], 'guard drawing exists').toBeDefined()
    expect(meta.frames['fall:4'], 'down drawing exists').toBeDefined()
    expect(art.clips.idle!.keys[0]!.frame).toBe('walk:0')
    expect(art.clips.getup!.keys[0]!.frame).toBe('fall:4')
    expect(motionFrameForZhangfei(art, { ...base, state: 'dead' })).toBe('fall:4')
  })
})

describe('zhangfei clips follow core timing', () => {
  it('clip exposures are strictly ordered and durations match core data', () => {
    expect(validateClipExposures(art.clips)).toEqual([])
    expect(validateMotionProfile(heroProfile('zhangfei'))).toEqual([])
    expect(CHARACTERS.zhangfei!.combo).toEqual(['zf.jab1', 'zf.jab2', 'zf.finisher'])
    expect(CHARACTERS.zhangfei!.jumpAttack).toBe('zf.jumpkick')
    expect(CHARACTERS.zhangfei!.specialAttack).toBe('zf.special')
    expect(ZHANGFEI_ATTACK_BINDINGS).toEqual(heroProfile('zhangfei').attackBindings)
    expect(art.clips.jab1!.duration).toBe(ATTACKS['zf.jab1']!.startup + ATTACKS['zf.jab1']!.active + ATTACKS['zf.jab1']!.recover)
    expect(art.clips.jab2!.duration).toBe(ATTACKS['zf.jab2']!.startup + ATTACKS['zf.jab2']!.active + ATTACKS['zf.jab2']!.recover)
    expect(art.clips.finisher!.duration).toBe(ATTACKS['zf.finisher']!.startup + ATTACKS['zf.finisher']!.active + ATTACKS['zf.finisher']!.recover)
    expect(art.clips.special!.duration).toBe(ATTACKS['zf.special']!.startup + ATTACKS['zf.special']!.active + ATTACKS['zf.special']!.recover)
    expect(art.clips.mountedsweep!.duration).toBe(ATTACKS['mounted.sweep']!.startup + ATTACKS['mounted.sweep']!.active + ATTACKS['mounted.sweep']!.recover)
    expect(art.clips.dismountedsweep!.duration).toBe(ATTACKS['mounted.sweep']!.startup + ATTACKS['mounted.sweep']!.active + ATTACKS['mounted.sweep']!.recover)
    expect(art.clips.hurt!.duration).toBe(PLAYER_HITSTUN_TICKS)
    expect(art.clips.fall!.duration).toBe(KNOCKDOWN_TICKS)
    expect(art.clips.getup!.duration).toBe(GETUP_TICKS)
    expect(art.clips.jump!.duration).toBe(JUMP_DURATION)
  })

  it('the clip table carries the full hero set for the two-page pack', () => {
    expect(Object.keys(zhangfeiClips()).sort()).toEqual(['dismount', 'dismountedsweep', 'fall', 'finisher', 'getup', 'grab', 'hurt', 'idle', 'jab1', 'jab2', 'jump', 'jumpattack', 'kicklanding', 'landing', 'mounted', 'mountedsweep', 'mountedwalk', 'release', 'special', 'walk'].sort())
    expect(Object.keys(meta.frames).filter((n) => meta.frames[n]!.sheet === 'actions').length).toBeGreaterThan(0)
    expect(Object.keys(meta.frames).filter((n) => (meta.frames[n]!.sheet ?? 'sheet') === 'sheet').length).toBeGreaterThan(0)
  })
})

describe('zhangfei strike windows (visible strike matches every active tick)', () => {
  const frameAt = (e: Partial<MotionEntity>): string => motionFrameForZhangfei(art, { ...base, ...e })
  it.each([
    ['zf.jab1', 'jab1', 'jab1:2'],
    ['zf.jab2', 'jab2', 'jab2:2'],
    ['zf.finisher', 'finisher', 'finisher:2'],
  ] as const)('%s shows %s on every active tick', (attackId, _clip, strike) => {
    const a = ATTACKS[attackId]!
    for (let t = a.startup; t < a.startup + a.active; t++) {
      expect(frameAt({ state: 'attack', attackId, stateTick: t }), `${attackId}@${t}`).toBe(strike)
    }
    // Windup during startup, recover after, guard at the tail.
    expect(frameAt({ state: 'attack', attackId, stateTick: 0 })).toBe('walk:0')
    expect(frameAt({ state: 'attack', attackId, stateTick: a.startup + a.active + a.recover - 1 })).toBe('walk:0')
  })

  it('special, mounted sweep and dismounted sweep show the strike on every active tick', () => {
    const special = ATTACKS['zf.special']!
    for (let t = special.startup; t < special.startup + special.active; t++) {
      expect(frameAt({ state: 'special', stateTick: t }), `special@${t}`).toBe('special:3')
    }
    const sweep = ATTACKS['mounted.sweep']!
    for (let t = sweep.startup; t < sweep.startup + sweep.active; t++) {
      expect(frameAt({ state: 'attack', attackId: 'mounted.sweep', stateTick: t, mountedOn: 7 }), `mounted@${t}`).toBe('rider:3')
      expect(frameAt({ state: 'attack', attackId: 'mounted.sweep', stateTick: t }), `dismounted@${t}`).toBe('jab1:2')
    }
  })
})

describe('zhangfei state dispatch (every state, key ticks)', () => {
  const frameAt = (e: Partial<MotionEntity>): string => motionFrameForZhangfei(art, { ...base, ...e })
  const allFrames = new Set(Object.keys(meta.frames))

  it('idle is guard; walk/fleeing run the 8-cycle', () => {
    expect(frameAt({ state: 'idle', stateTick: 0 })).toBe('walk:0')
    const cycle = [0, 4, 8, 12, 16, 20, 24, 28].map((t) => frameAt({ state: 'walk', stateTick: t }))
    expect(cycle).toEqual(['walk:1', 'walk:2', 'walk:3', 'walk:4', 'walk:5', 'walk:6', 'walk:7', 'walk:8'])
    expect(frameAt({ state: 'walk', stateTick: 32 }), 'loop repeats').toBe('walk:1')
    expect(frameAt({ state: 'fleeing', stateTick: 8 })).toBe('walk:3')
  })

  it('unknown or missing attackId stays on new art (guard), never the legacy rig', () => {
    // The slice(3) fallback mirrors the generic hero dispatch: an id whose
    // suffix names a real clip (e.g. 'gy.jab1' -> 'jab1') resolves to this
    // pack's own clip; anything else stays on guard. A zhangfei entity only
    // ever carries zf.* ids in the sim.
    for (const attackId of [null, 'zf.nope', 'soldier.swing']) {
      expect(frameAt({ state: 'attack', attackId, stateTick: 3 }), `attackId ${attackId}`).toBe('walk:0')
    }
    expect(frameAt({ state: 'attack', attackId: 'gy.jab1', stateTick: 3 }), 'suffix fallback hits own clip').toBe('jab1:1')
  })

  it('jump follows airTicks; jumpattack strikes only inside the active window', () => {
    expect(frameAt({ state: 'jump', stateTick: 0, airTicks: 0 })).toBe('walk:0')
    expect(frameAt({ state: 'jump', stateTick: 9, airTicks: 9 })).toBe('jump:2')
    expect(frameAt({ state: 'jump', stateTick: 30, airTicks: 30 })).toBe('jump:5')
    expect(frameAt({ state: 'jump', stateTick: 9 }), 'missing airTicks falls back to stateTick').toBe('jump:2')
    const kick = ATTACKS['zf.jumpkick']!
    expect(frameAt({ state: 'jumpattack', stateTick: 0, airTicks: 9 }), 'startup follows the airborne pose').toBe('jump:2')
    for (let t = kick.startup; t < kick.startup + kick.active; t++) {
      expect(frameAt({ state: 'jumpattack', stateTick: t, airTicks: 10 }), `active@${t}`).toBe('jump:3')
    }
    expect(frameAt({ state: 'jumpattack', stateTick: 30, airTicks: 30 }), 'retract on descent').toBe('jump:4')
    expect(frameAt({ state: 'jumpattack', stateTick: 30, airTicks: 35 }), 'landing at the arc end').toBe('jump:5')
  })

  it('hitstun (20 ticks), knockdown, getup', () => {
    expect(frameAt({ state: 'hitstun', stateTick: 0 })).toBe('misc:0')
    expect(frameAt({ state: 'hitstun', stateTick: 12 })).toBe('misc:1')
    expect(frameAt({ state: 'hitstun', stateTick: 19 }), 'last hitstun tick returns to guard').toBe('walk:0')
    expect(frameAt({ state: 'knockdown', stateTick: 0 })).toBe('fall:0')
    expect(frameAt({ state: 'knockdown', stateTick: 8 })).toBe('fall:2')
    expect(frameAt({ state: 'knockdown', stateTick: 20 })).toBe('fall:4')
    expect(frameAt({ state: 'knockdown', stateTick: KNOCKDOWN_TICKS + 5 }), 'clamp, never out of range').toBe('fall:4')
    expect(frameAt({ state: 'getup', stateTick: 0 })).toBe('fall:4')
    expect(frameAt({ state: 'getup', stateTick: 6 })).toBe('getup:1')
    expect(frameAt({ state: 'getup', stateTick: GETUP_TICKS - 1 })).toBe('walk:0')
  })

  it('grab, grabbed, thrown flight/impact', () => {
    expect(frameAt({ state: 'grab', stateTick: 0 })).toBe('misc:2')
    expect(frameAt({ state: 'grab', stateTick: 6 })).toBe('misc:3')
    expect(frameAt({ state: 'grabbed', stateTick: 5 }), 'the hurt fold doubles as grabbed').toBe('misc:1')
    expect(frameAt({ state: 'thrown', stateTick: 0 })).toBe('fall:2')
    expect(frameAt({ state: 'thrown', stateTick: 3 })).toBe('fall:2')
    expect(frameAt({ state: 'thrown', stateTick: 4 })).toBe('fall:3')
    expect(frameAt({ state: 'thrown', stateTick: 99 }), 'clamp').toBe('fall:3')
  })

  it('dying runs the fall clip and clamps on DOWN; dead holds DOWN', () => {
    expect(frameAt({ state: 'dying', stateTick: 0 })).toBe('fall:0')
    expect(frameAt({ state: 'dying', stateTick: 8 })).toBe('fall:2')
    expect(frameAt({ state: 'dying', stateTick: 20 })).toBe('fall:4')
    expect(frameAt({ state: 'dying', stateTick: DYING_TICKS + 10 }), 'clamp on DOWN').toBe('fall:4')
    expect(frameAt({ state: 'dead', stateTick: 0 })).toBe('fall:4')
    expect(frameAt({ state: 'dead', stateTick: 900 })).toBe('fall:4')
  })

  it('mounted states ride; only the attack swings', () => {
    expect(frameAt({ state: 'idle', mountedOn: 7 })).toBe('rider:0')
    expect(frameAt({ state: 'walk', stateTick: 0, mountedOn: 7 })).toBe('rider:0')
    expect(frameAt({ state: 'walk', stateTick: 12, mountedOn: 7 })).toBe('rider:1')
    expect(frameAt({ state: 'walk', stateTick: 24, mountedOn: 7 }), 'trot loops').toBe('rider:0')
    expect(frameAt({ state: 'attack', attackId: 'mounted.sweep', stateTick: 0, mountedOn: 7 })).toBe('rider:0')
    expect(frameAt({ state: 'attack', attackId: 'mounted.sweep', stateTick: 10, mountedOn: 7 })).toBe('rider:3')
    expect(frameAt({ state: 'hitstun', stateTick: 5, mountedOn: 7 }), 'mounted non-attack states stay seated').toBe('rider:0')
  })

  it('every dispatched frame exists in the pack; every drawing is reachable except the mount pose', () => {
    const seen = new Set<string>()
    const push = (e: Partial<MotionEntity>) => seen.add(frameAt(e))
    const ticks = [0, 1, 3, 4, 8, 12, 14, 16, 20, 24, 28, 40]
    for (const state of ['idle', 'walk', 'fleeing', 'hitstun', 'knockdown', 'getup', 'grab', 'grabbed', 'thrown', 'dying', 'dead'] as const) {
      for (const t of ticks) {
        push({ state, stateTick: t })
        push({ state, stateTick: t, mountedOn: 7 })
      }
    }
    for (const attackId of ['zf.jab1', 'zf.jab2', 'zf.finisher', 'mounted.sweep', null, 'zf.nope']) {
      for (const t of ticks) {
        push({ state: 'attack', attackId, stateTick: t })
        push({ state: 'attack', attackId, stateTick: t, mountedOn: 7 })
      }
    }
    for (const t of ticks) for (const airTicks of [undefined, 0, 10, 35]) {
      push({ state: 'jump', stateTick: t, airTicks })
      push({ state: 'jumpattack', stateTick: t, airTicks })
    }
    for (const t of ticks) push({ state: 'special', stateTick: t })
    // Player-sampled transition clips (landing/kicklanding/release/dismount)
    // are not sim states; sample them directly like the runtime player does.
    for (const action of ['landing', 'kicklanding', 'release', 'dismount', 'mountedwalk']) {
      for (const t of ticks) seen.add(sampleClip(art, action, t))
    }
    for (const frame of seen) expect(allFrames.has(frame), `frame ${frame} must exist in the pack`).toBe(true)
    // The mount pose (climbing on) has no sim state - mounting is instant -
    // so it is the only drawing no clip references (Guan Yu's rider:3 same).
    expect([...allFrames].filter((f) => !seen.has(f)).sort()).toEqual(['rider:2'])
  })

  it('sampleClip clamps out-of-range ticks without ever returning an unknown frame', () => {
    for (const action of ['idle', 'walk', 'jump', 'jumpattack', 'landing', 'kicklanding', 'hurt', 'fall', 'getup', 'grab', 'release', 'mounted', 'mountedwalk', 'dismount', 'jab1', 'jab2', 'finisher', 'special', 'mountedsweep', 'dismountedsweep']) {
      for (const t of [-5, 0, 17, 500]) {
        const frame = sampleClip(art, action, t)
        expect(allFrames.has(frame), `${action}@${t} -> ${frame}`).toBe(true)
      }
    }
  })

  it('the shared dispatch routes zhangfei art to the zhangfei frame names', () => {
    // The render path calls motionFrameForEntity for EVERY kind; zhangfei art
    // must reach the zhangfei dispatch, never the guanyu clip names.
    const routed: MotionArt = { ...art, frameDispatch: motionFrameForZhangfei }
    for (const e of [
      { state: 'idle', stateTick: 0, attackId: null, mountedOn: null },
      { state: 'walk', stateTick: 8, attackId: null, mountedOn: null },
      { state: 'attack', stateTick: 8, attackId: 'zf.jab1', mountedOn: null },
      { state: 'knockdown', stateTick: 4, attackId: null, mountedOn: null },
      { state: 'dead', stateTick: 0, attackId: null, mountedOn: null },
    ] as MotionEntity[]) {
      const frame = motionFrameForEntity(routed, e)
      expect(allFrames.has(frame), `${e.state} -> ${frame} must be a pack frame`).toBe(true)
    }
    expect(motionFrameForEntity(routed, { state: 'idle', stateTick: 0, attackId: null, mountedOn: null })).toBe('walk:0')
  })
})
