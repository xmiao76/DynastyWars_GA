import { describe, expect, it } from 'vitest'
import { DYING_TICKS, GETUP_TICKS, JUMP_DURATION, KNOCKDOWN_TICKS, PLAYER_HITSTUN_TICKS } from '../../src/core/constants'
import { CHARACTERS } from '../../src/core/characters'
import { ATTACKS } from '../../src/core/attacks'
import { weiyanPreparedRecord, motionPackManifest, MOTION_PACKS } from '../../src/game/adapters/motion-art'
import type { MotionArt, MotionEntity } from '../../src/game/art/motion-clips'
import { sampleClip, motionFrameForEntity } from '../../src/game/art/motion-clips'
import { advanceMotion } from '../../src/game/art/motion-player'
import {
  WEIYAN_ATTACK_BINDINGS,
  WEIYAN_COLLAPSE_TAIL,
  WEIYAN_FRAMES,
  motionFrameForWeiyan,
  weiyanClips,
  validWeiyanPack,
} from '../../src/game/art/motion-clips-weiyan'
import { validateClipExposures, validateMotionProfile, heroProfile } from '../../src/game/art/motion-profiles'

/**
 * CMR-11B bounded work 2: every real state/attack/clock of Wei Yan is
 * bound and exercised. Every dispatched frame must exist in the prepared
 * pack - an unknown frame would break the shared-atlas display.
 *
 * The pack uses compact positions (walk:0-8, jab1/jab2/finisher:0-4,
 * jump:0-5, fall:0-4, getup:0-4, misc:0-4, special:0-4); the
 * dispatch maps the hero states onto these names. Bookends hold by clip
 * convention (no alias records in the culled layout): every guard point
 * IS walk:0 and every down point IS fall:4 - the same pattern as Guan
 * Yu's clips.
 */

const meta = weiyanPreparedRecord()
const art: MotionArt = {
  ...meta,
  sheet: {} as CanvasImageSource,
  actionSheet: {} as CanvasImageSource,
  clips: weiyanClips(),
  attackBindings: WEIYAN_ATTACK_BINDINGS,
  // Production-faithful routing + collapse (as publishMotionArtRecord sets).
  frameDispatch: motionFrameForWeiyan,
  collapseTail: WEIYAN_COLLAPSE_TAIL,
}
const base: MotionEntity = { state: 'idle', stateTick: 0, attackId: null }

describe('weiyan pack registration', () => {
  it('the prepared record validates as a weiyan pack', () => {
    expect(validWeiyanPack(meta)).toBe(true)
    expect(meta.singlePage).toBeFalsy()
    expect(Object.keys(meta.frames)).toHaveLength(56)
    expect(meta.revision).toBe('weiyan-2')
    expect(meta.sheet).toEqual({ width: 1948, height: 1877 })
    expect(meta.actionSheet).toEqual({ width: 618, height: 199 })
    // 16MB-first holds: the v2 pack fits the contract cap (14.42 MiB), so
    // unlike zhaoyun/zhangfei there is NO per-pack decoded exception.
    expect(meta.decodedCapBytes).toBeUndefined()
    expect(MOTION_PACKS['weiyan']).toBeDefined()
    expect(MOTION_PACKS['weiyan']!.pages).toHaveLength(2)
    expect(Object.values(WEIYAN_FRAMES).reduce((a, b) => a + b, 0)).toBe(50)
  })

  it('negative controls: missing frame / wrong cell / overlap / bad sheet fail the pack', () => {
    const frames = { ...meta.frames }
    delete frames['jab1:2']
    expect(validWeiyanPack({ ...meta, frames })).toBe(false)
    const bad = { ...meta.frames }
    bad['walk:0'] = { ...bad['walk:0']!, srcW: 100, srcH: 100 }
    expect(validWeiyanPack({ ...meta, frames: bad })).toBe(false)
    // Overlap on the SAME page fails; find two frames sharing a texture.
    const names = Object.keys(meta.frames)
    const a = names.find((n) => (meta.frames[n]!.sheet ?? 'sheet') === 'sheet')!
    const b = names.find((n) => n !== a && (meta.frames[n]!.sheet ?? 'sheet') === 'sheet')!
    const overlap = { ...meta.frames }
    overlap[b] = { ...overlap[b]!, x: overlap[a]!.x, y: overlap[a]!.y }
    expect(validWeiyanPack({ ...meta, frames: overlap }), 'genuinely overlapping rects fail').toBe(false)
    const wrongSheet = { ...meta.frames }
    wrongSheet['walk:1'] = { ...wrongSheet['walk:1']!, sheet: 'bogus' as unknown as 'actions' }
    expect(validWeiyanPack({ ...meta, frames: wrongSheet })).toBe(false)
    expect(validWeiyanPack({ ...meta, id: 'guanyu' })).toBe(false)
    expect(validWeiyanPack({ ...meta, density: 0 })).toBe(false)
  })

  it('shared guard/down bookends by clip convention (walk:0 guard, fall:4 down)', () => {
    // The culled layout carries no alias records: every guard point IS
    // walk:0 and every down point IS fall:4, so the drawings can never
    // drift - the same pattern as Guan Yu's clips.
    expect(meta.frames['walk:0'], 'guard drawing exists').toBeDefined()
    expect(meta.frames['fall:4'], 'down drawing exists').toBeDefined()
    expect(art.clips.idle!.keys[0]!.frame).toBe('walk:0')
    expect(art.clips.getup!.keys[0]!.frame).toBe('fall:4')
    expect(motionFrameForWeiyan(art, { ...base, state: 'dead' })).toBe('fall:4')
  })
})

describe('weiyan clips follow core timing', () => {
  it('clip exposures are strictly ordered and durations match core data', () => {
    expect(validateClipExposures(art.clips)).toEqual([])
    expect(validateMotionProfile(heroProfile('weiyan'))).toEqual([])
    expect(CHARACTERS.weiyan!.combo).toEqual(['wy.jab1', 'wy.jab2', 'wy.finisher'])
    expect(CHARACTERS.weiyan!.jumpAttack).toBe('wy.jumpkick')
    expect(CHARACTERS.weiyan!.specialAttack).toBe('wy.special')
    expect(WEIYAN_ATTACK_BINDINGS).toEqual(heroProfile('weiyan').attackBindings)
    expect(art.clips.jab1!.duration).toBe(ATTACKS['wy.jab1']!.startup + ATTACKS['wy.jab1']!.active + ATTACKS['wy.jab1']!.recover)
    expect(art.clips.jab2!.duration).toBe(ATTACKS['wy.jab2']!.startup + ATTACKS['wy.jab2']!.active + ATTACKS['wy.jab2']!.recover)
    expect(art.clips.finisher!.duration).toBe(ATTACKS['wy.finisher']!.startup + ATTACKS['wy.finisher']!.active + ATTACKS['wy.finisher']!.recover)
    expect(art.clips.special!.duration).toBe(ATTACKS['wy.special']!.startup + ATTACKS['wy.special']!.active + ATTACKS['wy.special']!.recover)
    expect(art.clips.hurt!.duration).toBe(PLAYER_HITSTUN_TICKS)
    expect(art.clips.fall!.duration).toBe(KNOCKDOWN_TICKS)
    expect(art.clips.getup!.duration).toBe(GETUP_TICKS)
    expect(art.clips.jump!.duration).toBe(JUMP_DURATION)
  })

  it('the manifest advertises the hero clips and both pages under the contract cap', () => {
    const manifest = motionPackManifest('weiyan')
    expect(manifest?.requiredClips.sort()).toEqual(['fall', 'finisher', 'getup', 'grab', 'hurt', 'idle', 'jab1', 'jab2', 'jump', 'jumpattack', 'kicklanding', 'landing', 'release', 'special', 'walk'].sort())
    expect(manifest?.pages).toHaveLength(2)
    expect(manifest?.display).toBe('shared-atlas')
    expect(manifest?.decodedCap, 'no per-pack exception: contract 16MB applies').toBeUndefined()
  })
})

describe('weiyan strike windows (visible strike matches every active tick)', () => {
  const frameAt = (e: Partial<MotionEntity>): string => motionFrameForWeiyan(art, { ...base, ...e })
  it.each([
    ['wy.jab1', 'jab1', 'jab1:2'],
    ['wy.jab2', 'jab2', 'jab2:2'],
    ['wy.finisher', 'finisher', 'finisher:2'],
  ] as const)('%s shows %s on every active tick', (attackId, _clip, strike) => {
    const a = ATTACKS[attackId]!
    for (let t = a.startup; t < a.startup + a.active; t++) {
      expect(frameAt({ state: 'attack', attackId, stateTick: t }), `${attackId}@${t}`).toBe(strike)
    }
    // Windup during startup, recover after, guard at the tail.
    expect(frameAt({ state: 'attack', attackId, stateTick: 0 })).toBe('walk:0')
    expect(frameAt({ state: 'attack', attackId, stateTick: a.startup + a.active + a.recover - 1 })).toBe('walk:0')
  })

  it('special shows the strike on every active tick', () => {
    const special = ATTACKS['wy.special']!
    for (let t = special.startup; t < special.startup + special.active; t++) {
      expect(frameAt({ state: 'special', stateTick: t }), `special@${t}`).toBe('special:3')
    }
  })
})

describe('weiyan state dispatch (every state, key ticks)', () => {
  const frameAt = (e: Partial<MotionEntity>): string => motionFrameForWeiyan(art, { ...base, ...e })
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
    // pack's own clip; anything else stays on guard. A weiyan entity only
    // ever carries wy.* ids in the sim.
    for (const attackId of [null, 'wy.nope', 'soldier.swing']) {
      expect(frameAt({ state: 'attack', attackId, stateTick: 3 }), `attackId ${attackId}`).toBe('walk:0')
    }
    // Wei Yan's slower jab1 startup (9 vs Zhao Yun's 5) puts the drive pose
    // at tick 4 rather than tick 3 - same fallback, own windows.
    expect(frameAt({ state: 'attack', attackId: 'gy.jab1', stateTick: 4 }), 'suffix fallback hits own clip').toBe('jab1:1')
  })

  it('jump follows airTicks; jumpattack strikes only inside the active window', () => {
    expect(frameAt({ state: 'jump', stateTick: 0, airTicks: 0 })).toBe('walk:0')
    expect(frameAt({ state: 'jump', stateTick: 9, airTicks: 9 })).toBe('jump:2')
    expect(frameAt({ state: 'jump', stateTick: 30, airTicks: 30 })).toBe('jump:5')
    expect(frameAt({ state: 'jump', stateTick: 9 }), 'missing airTicks falls back to stateTick').toBe('jump:2')
    const kick = ATTACKS['wy.jumpkick']!
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

  it('every dispatched frame exists in the pack; every drawing is reachable except undisplayed poses', () => {
    const seen = new Set<string>()
    const push = (e: Partial<MotionEntity>) => seen.add(frameAt(e))
    const ticks = [0, 1, 3, 4, 5, 6, 7, 8, 12, 14, 16, 20, 24, 28, 40]
    for (const state of ['idle', 'walk', 'fleeing', 'hitstun', 'knockdown', 'getup', 'grab', 'grabbed', 'thrown', 'dying', 'dead'] as const) {
      for (const t of ticks) push({ state, stateTick: t })
    }
    for (const attackId of ['wy.jab1', 'wy.jab2', 'wy.finisher', null, 'wy.nope']) {
      for (const t of ticks) push({ state: 'attack', attackId, stateTick: t })
    }
    for (const t of ticks) for (const airTicks of [undefined, 0, 10, 35]) {
      push({ state: 'jump', stateTick: t, airTicks })
      push({ state: 'jumpattack', stateTick: t, airTicks })
    }
    for (const t of ticks) push({ state: 'special', stateTick: t })
    // Player-sampled transition clips (landing/kicklanding/release)
    // are not sim states; sample them directly like the runtime player does.
    for (const action of ['landing', 'kicklanding', 'release']) {
      for (const t of ticks) seen.add(sampleClip(art, action, t))
    }
    for (const frame of seen) expect(allFrames.has(frame), `frame ${frame} must exist in the pack`).toBe(true)
    // The rider:* frames are unreachable leftovers in the prepared JSON,
    // removed by a separate prepared-data cleanup.
    expect([...allFrames].filter((f) => !seen.has(f)).sort()).toEqual(['rider:0', 'rider:1', 'rider:2', 'rider:3', 'rider:4', 'rider:5'])
  })

  it('sampleClip clamps out-of-range ticks without ever returning an unknown frame', () => {
    for (const action of ['idle', 'walk', 'jump', 'jumpattack', 'landing', 'kicklanding', 'hurt', 'fall', 'getup', 'grab', 'release', 'jab1', 'jab2', 'finisher', 'special']) {
      for (const t of [-5, 0, 17, 500]) {
        const frame = sampleClip(art, action, t)
        expect(allFrames.has(frame), `${action}@${t} -> ${frame}`).toBe(true)
      }
    }
  })

  it('the shared dispatch routes weiyan art to the weiyan frame names', () => {
    // The render path calls motionFrameForEntity for EVERY kind; weiyan art
    // must reach the weiyan dispatch, never the guanyu clip names.
    const routed: MotionArt = { ...art, frameDispatch: motionFrameForWeiyan }
    for (const e of [
      { state: 'idle', stateTick: 0, attackId: null },
      { state: 'walk', stateTick: 8, attackId: null },
      { state: 'attack', stateTick: 8, attackId: 'wy.jab1' },
      { state: 'knockdown', stateTick: 4, attackId: null },
      { state: 'dead', stateTick: 0, attackId: null },
    ] as MotionEntity[]) {
      const frame = motionFrameForEntity(routed, e)
      expect(allFrames.has(frame), `${e.state} -> ${frame} must be a pack frame`).toBe(true)
    }
    expect(motionFrameForEntity(routed, { state: 'idle', stateTick: 0, attackId: null })).toBe('walk:0')
  })
})

describe('weiyan collapse continuity (per-kind lowCollapse tail)', () => {
  const packFrames = new Set(Object.keys(meta.frames))

  it('pins the impact-then-DOWN tail; every tail frame exists in the pack', () => {
    expect(WEIYAN_COLLAPSE_TAIL).toEqual(['fall:3', 'fall:4'])
    for (const f of WEIYAN_COLLAPSE_TAIL) expect(packFrames.has(f), `tail frame ${f} in pack`).toBe(true)
  })

  it('thrown -> knockdown settles through impact onto DOWN, never a missing frame', () => {
    const flight = advanceMotion(art, { ...base, state: 'thrown', stateTick: 6, z: 10 }, 6)
    expect(flight.frame).toBe('fall:3')
    const impact = advanceMotion(art, { ...base, state: 'knockdown', stateTick: 0 }, 7, flight.playback)
    expect(impact.frame).toBe('fall:3')
    const t2 = advanceMotion(art, { ...base, state: 'knockdown', stateTick: 2 }, 9, impact.playback)
    expect(t2.frame).toBe('fall:3')
    const t4 = advanceMotion(art, { ...base, state: 'knockdown', stateTick: 4 }, 11, t2.playback)
    expect(t4.frame).toBe('fall:4')
    const held = advanceMotion(art, { ...base, state: 'knockdown', stateTick: 30 }, 37, t4.playback)
    expect(held.frame, 'DOWN holds through the knockdown').toBe('fall:4')
    for (const f of [flight.frame, impact.frame, t2.frame, t4.frame, held.frame]) {
      expect(packFrames.has(f), `${f} in pack`).toBe(true)
    }
  })

  it('getup interrupted by dying walks back down the poses onto DOWN', () => {
    const seated = advanceMotion(art, { ...base, state: 'getup', stateTick: 10 }, 45)
    expect(seated.frame).toBe('getup:2')
    const defeat = advanceMotion(art, { ...base, state: 'dying', stateTick: 0 }, 46, seated.playback)
    expect(defeat.frame).toBe('getup:2')
    expect(advanceMotion(art, { ...base, state: 'dying', stateTick: 2 }, 48, defeat.playback).frame).toBe('getup:1')
    expect(advanceMotion(art, { ...base, state: 'dying', stateTick: 6 }, 52, defeat.playback).frame).toBe('fall:4')
    // Elbow edge (getup:0): the [0-7] class covers compact packs.
    const elbow = advanceMotion(art, { ...base, state: 'getup', stateTick: 2 }, 60)
    expect(elbow.frame).toBe('getup:0')
    const defeat0 = advanceMotion(art, { ...base, state: 'dying', stateTick: 0 }, 61, elbow.playback)
    expect(defeat0.frame).toBe('getup:0')
    expect(advanceMotion(art, { ...base, state: 'dying', stateTick: 4 }, 65, defeat0.playback).frame).toBe('fall:4')
  })
})
