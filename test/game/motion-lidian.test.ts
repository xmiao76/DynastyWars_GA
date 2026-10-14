import { describe, expect, it } from 'vitest'
import { attackById } from '../../src/core/attacks'
import { DYING_TICKS, GETUP_TICKS, KNOCKDOWN_TICKS } from '../../src/core/constants'
import { ENEMIES } from '../../src/core/enemies'
import { lidianPreparedRecord, motionPackManifest, MOTION_PACKS } from '../../src/game/adapters/motion-art'
import type { MotionArt, MotionEntity } from '../../src/game/art/motion-clips'
import { sampleClip, motionFrameForEntity } from '../../src/game/art/motion-clips'
import { advanceMotion } from '../../src/game/art/motion-player'
import {
  LIDIAN_ATTACK_BINDINGS,
  LIDIAN_COLLAPSE_TAIL,
  LIDIAN_FRAMES,
  motionFrameForLidian,
  lidianClips,
  validLidianPack,
} from '../../src/game/art/motion-clips-lidian'
import { validateClipExposures, validateMotionProfile, bossProfile } from '../../src/game/art/motion-profiles'

/**
 * CMR-13B bounded work 2: every real state/attack/clock of Li Dian is
 * bound and exercised. Every dispatched frame must exist in the prepared
 * pack - an unknown frame would break the shared-atlas display.
 *
 * The pack uses compact positions (walk:0-8, charge/combo/heavy:0-4,
 * misc:0-4, fall:0-4, getup:0-4); the dispatch maps the boss states onto
 * these names. Bookends hold by clip convention (no alias records in the
 * culled layout): every guard point IS walk:0 and every down point IS
 * fall:4 - the same pattern as Guan Yu's clips.
 */

const meta = lidianPreparedRecord()
const art: MotionArt = {
  ...meta,
  sheet: {} as CanvasImageSource,
  actionSheet: {} as CanvasImageSource,
  clips: lidianClips(),
  attackBindings: LIDIAN_ATTACK_BINDINGS,
  // Production-faithful routing + collapse (as publishMotionArtRecord sets).
  frameDispatch: motionFrameForLidian,
  collapseTail: LIDIAN_COLLAPSE_TAIL,
}
const base: MotionEntity = { state: 'idle', stateTick: 0, attackId: null }

describe('lidian pack registration', () => {
  it('the prepared record validates as a lidian pack', () => {
    expect(validLidianPack(meta)).toBe(true)
    expect(meta.singlePage).toBe(true)
    expect(Object.keys(meta.frames)).toHaveLength(39)
    expect(meta.revision).toBe('lidian-1')
    expect(meta.sheet).toEqual({ width: 2011, height: 1646 })
    expect(meta.actionSheet).toEqual({ width: 2011, height: 1646 })
    // 16MB-first holds: the pack fits the contract cap, so there is NO
    // per-pack decoded exception.
    expect(meta.decodedCapBytes).toBeUndefined()
    expect(MOTION_PACKS['lidian']).toBeDefined()
    expect(MOTION_PACKS['lidian']!.pages).toHaveLength(1)
    expect(Object.values(LIDIAN_FRAMES).reduce((a, b) => a + b, 0)).toBe(39)
  })

  it('negative controls: missing frame / wrong cell / overlap / bad sheet fail the pack', () => {
    const frames = { ...meta.frames }
    delete frames['combo:2']
    expect(validLidianPack({ ...meta, frames })).toBe(false)
    const bad = { ...meta.frames }
    bad['walk:0'] = { ...bad['walk:0']!, srcW: 100, srcH: 100 }
    expect(validLidianPack({ ...meta, frames: bad })).toBe(false)
    // Overlap on the SAME page fails; find two frames sharing a texture.
    const names = Object.keys(meta.frames)
    const a = names.find((n) => (meta.frames[n]!.sheet ?? 'sheet') === 'sheet')!
    const b = names.find((n) => n !== a && (meta.frames[n]!.sheet ?? 'sheet') === 'sheet')!
    const overlap = { ...meta.frames }
    overlap[b] = { ...overlap[b]!, x: overlap[a]!.x, y: overlap[a]!.y }
    expect(validLidianPack({ ...meta, frames: overlap }), 'genuinely overlapping rects fail').toBe(false)
    const wrongSheet = { ...meta.frames }
    wrongSheet['walk:1'] = { ...wrongSheet['walk:1']!, sheet: 'bogus' as unknown as 'actions' }
    expect(validLidianPack({ ...meta, frames: wrongSheet })).toBe(false)
    expect(validLidianPack({ ...meta, id: 'guanyu' })).toBe(false)
    expect(validLidianPack({ ...meta, density: 0 })).toBe(false)
  })

  it('shared guard/down bookends by clip convention (walk:0 guard, fall:4 down)', () => {
    // The culled layout carries no alias records: every guard point IS
    // walk:0 and every down point IS fall:4, so the drawings can never
    // drift - the same pattern as Guan Yu's clips.
    expect(meta.frames['walk:0'], 'guard drawing exists').toBeDefined()
    expect(meta.frames['fall:4'], 'down drawing exists').toBeDefined()
    expect(art.clips.idle!.keys[0]!.frame).toBe('walk:0')
    expect(art.clips.getup!.keys[0]!.frame).toBe('fall:4')
    expect(motionFrameForLidian(art, { ...base, state: 'dead' })).toBe('fall:4')
  })
})

describe('lidian clips follow core timing', () => {
  it('clip exposures are strictly ordered and durations match core data', () => {
    expect(validateClipExposures(art.clips)).toEqual([])
    expect(validateMotionProfile(bossProfile('lidian'))).toEqual([])
    expect(ENEMIES.lidian!.boss).toEqual({
      charge: 'charge.dash',
      combo: 'sword.combo',
      heavy: 'sword.heavy',
      thinkRange: [18, 30],
      enragedThinkRange: [8, 16],
      enrageRatio: 0.3,
    })
    expect(LIDIAN_ATTACK_BINDINGS).toEqual({ 'charge.dash': 'charge', 'sword.combo': 'combo', 'sword.heavy': 'heavy' })
    expect(art.clips.charge!.duration).toBe(attackById('charge.dash').startup + attackById('charge.dash').active + attackById('charge.dash').recover)
    expect(art.clips.combo!.duration).toBe(attackById('sword.combo').startup + attackById('sword.combo').active + attackById('sword.combo').recover)
    expect(art.clips.heavy!.duration).toBe(attackById('sword.heavy').startup + attackById('sword.heavy').active + attackById('sword.heavy').recover)
    expect(ENEMIES.lidian!.hitstunTicks).toBe(10)
    expect(art.clips.hurt!.duration).toBe(10)
    expect(art.clips.fall!.duration).toBe(KNOCKDOWN_TICKS)
    expect(art.clips.getup!.duration).toBe(GETUP_TICKS)
  })

  it('the manifest advertises the boss clips and the single page under the contract cap', () => {
    const manifest = motionPackManifest('lidian')
    expect(manifest?.requiredClips.sort()).toEqual(['charge', 'combo', 'fall', 'getup', 'grab', 'heavy', 'hurt', 'idle', 'release', 'walk'].sort())
    expect(manifest?.pages).toHaveLength(1)
    expect(manifest?.display).toBe('shared-atlas')
    expect(manifest?.decodedCap, 'no per-pack exception: contract 16MB applies').toBeUndefined()
  })
})

describe('lidian strike windows (visible strike matches every active tick)', () => {
  const frameAt = (e: Partial<MotionEntity>): string => motionFrameForLidian(art, { ...base, ...e })

  it('charge.dash shows a dash drawing on every active tick', () => {
    const a = attackById('charge.dash')
    for (let t = a.startup; t < a.startup + a.active; t++) {
      expect(['charge:2', 'charge:3'], `charge.dash@${t}`).toContain(frameAt({ state: 'attack', attackId: 'charge.dash', stateTick: t }))
    }
    // Windup during startup, brake then guard in recover.
    expect(frameAt({ state: 'attack', attackId: 'charge.dash', stateTick: 0 })).toBe('walk:0')
    expect(frameAt({ state: 'attack', attackId: 'charge.dash', stateTick: a.startup + a.active + a.recover - 1 })).toBe('walk:0')
  })

  it('sword.combo shows both strikes across its 4-tick active window', () => {
    const a = attackById('sword.combo')
    // Rising-cut on active ticks 0-1, sweep on ticks 2-3: both authored
    // strikes visible, no invented frames.
    expect(frameAt({ state: 'attack', attackId: 'sword.combo', stateTick: 9 })).toBe('combo:1')
    expect(frameAt({ state: 'attack', attackId: 'sword.combo', stateTick: 10 })).toBe('combo:1')
    expect(frameAt({ state: 'attack', attackId: 'sword.combo', stateTick: 11 })).toBe('combo:3')
    expect(frameAt({ state: 'attack', attackId: 'sword.combo', stateTick: 12 })).toBe('combo:3')
    expect(frameAt({ state: 'attack', attackId: 'sword.combo', stateTick: 0 })).toBe('walk:0')
    expect(frameAt({ state: 'attack', attackId: 'sword.combo', stateTick: a.startup + a.active + a.recover - 1 })).toBe('walk:0')
  })

  it('sword.heavy shows the chop on every active tick', () => {
    const a = attackById('sword.heavy')
    for (let t = a.startup; t < a.startup + a.active; t++) {
      expect(frameAt({ state: 'attack', attackId: 'sword.heavy', stateTick: t }), `sword.heavy@${t}`).toBe('heavy:2')
    }
    expect(frameAt({ state: 'attack', attackId: 'sword.heavy', stateTick: 0 })).toBe('walk:0')
    expect(frameAt({ state: 'attack', attackId: 'sword.heavy', stateTick: a.startup + a.active + a.recover - 1 })).toBe('walk:0')
  })
})

describe('lidian state dispatch (every state, key ticks)', () => {
  const frameAt = (e: Partial<MotionEntity>): string => motionFrameForLidian(art, { ...base, ...e })
  const allFrames = new Set(Object.keys(meta.frames))

  it('idle is guard; walk/fleeing run the 8-cycle', () => {
    expect(frameAt({ state: 'idle', stateTick: 0 })).toBe('walk:0')
    const cycle = [0, 4, 8, 12, 16, 20, 24, 28].map((t) => frameAt({ state: 'walk', stateTick: t }))
    expect(cycle).toEqual(['walk:1', 'walk:2', 'walk:3', 'walk:4', 'walk:5', 'walk:6', 'walk:7', 'walk:8'])
    expect(frameAt({ state: 'walk', stateTick: 32 }), 'loop repeats').toBe('walk:1')
    expect(frameAt({ state: 'fleeing', stateTick: 8 })).toBe('walk:3')
  })

  it('unknown or missing attackId stays on new art (guard), never the legacy rig', () => {
    for (const attackId of [null, 'sword.nope', 'soldier.swing']) {
      expect(frameAt({ state: 'attack', attackId, stateTick: 3 }), `attackId ${attackId}`).toBe('walk:0')
    }
  })

  it('hitstun (10 ticks), knockdown, getup', () => {
    expect(frameAt({ state: 'hitstun', stateTick: 0 })).toBe('misc:0')
    expect(frameAt({ state: 'hitstun', stateTick: 6 })).toBe('misc:1')
    expect(frameAt({ state: 'hitstun', stateTick: 9 }), 'last hitstun tick returns to guard').toBe('walk:0')
    expect(frameAt({ state: 'knockdown', stateTick: 0 })).toBe('fall:0')
    expect(frameAt({ state: 'knockdown', stateTick: 8 })).toBe('fall:1')
    expect(frameAt({ state: 'knockdown', stateTick: 15 })).toBe('fall:2')
    expect(frameAt({ state: 'knockdown', stateTick: 22 })).toBe('fall:3')
    expect(frameAt({ state: 'knockdown', stateTick: 30 })).toBe('fall:4')
    expect(frameAt({ state: 'knockdown', stateTick: KNOCKDOWN_TICKS + 5 }), 'clamp, never out of range').toBe('fall:4')
    expect(frameAt({ state: 'getup', stateTick: 0 })).toBe('fall:4')
    expect(frameAt({ state: 'getup', stateTick: 6 })).toBe('getup:1')
    expect(frameAt({ state: 'getup', stateTick: GETUP_TICKS - 1 })).toBe('walk:0')
  })

  it('grab, grabbed, thrown flight/impact', () => {
    expect(frameAt({ state: 'grab', stateTick: 0 })).toBe('misc:2')
    expect(frameAt({ state: 'grab', stateTick: 6 })).toBe('misc:3')
    expect(frameAt({ state: 'grabbed', stateTick: 5 }), 'the held clamp is the grabbed pose').toBe('misc:2')
    expect(frameAt({ state: 'thrown', stateTick: 0 })).toBe('fall:2')
    expect(frameAt({ state: 'thrown', stateTick: 3 })).toBe('fall:2')
    expect(frameAt({ state: 'thrown', stateTick: 4 })).toBe('fall:3')
    expect(frameAt({ state: 'thrown', stateTick: 99 }), 'clamp').toBe('fall:3')
  })

  it('dying runs the fall clip and clamps on DOWN; dead holds DOWN', () => {
    expect(frameAt({ state: 'dying', stateTick: 0 })).toBe('fall:0')
    expect(frameAt({ state: 'dying', stateTick: 8 })).toBe('fall:1')
    expect(frameAt({ state: 'dying', stateTick: 20 })).toBe('fall:2')
    expect(frameAt({ state: 'dying', stateTick: DYING_TICKS + 10 }), 'clamp on DOWN').toBe('fall:4')
    expect(frameAt({ state: 'dead', stateTick: 0 })).toBe('fall:4')
    expect(frameAt({ state: 'dead', stateTick: 900 })).toBe('fall:4')
  })

  it('every dispatched frame exists in the pack; every drawing is reachable', () => {
    const seen = new Set<string>()
    const push = (e: Partial<MotionEntity>) => seen.add(frameAt(e))
    const ticks = [0, 1, 3, 4, 5, 6, 7, 8, 9, 12, 14, 16, 18, 20, 24, 28, 40]
    for (const state of ['idle', 'walk', 'fleeing', 'hitstun', 'knockdown', 'getup', 'grab', 'grabbed', 'thrown', 'dying', 'dead'] as const) {
      for (const t of ticks) push({ state, stateTick: t })
    }
    for (const attackId of ['charge.dash', 'sword.combo', 'sword.heavy', null, 'sword.nope']) {
      for (const t of ticks) push({ state: 'attack', attackId, stateTick: t })
    }
    for (const t of ticks) seen.add(sampleClip(art, 'release', t))
    for (const frame of seen) expect(allFrames.has(frame), `frame ${frame} must exist in the pack`).toBe(true)
    // Even the pack's own DOWN drawing (getup:0) displays: the getup clip
    // opens fall:4 then getup:0 (the shared bookend holds at every down
    // point; the two prone drawings read as one settle).
    expect([...allFrames].filter((f) => !seen.has(f)).sort()).toEqual([])
  })

  it('sampleClip clamps out-of-range ticks without ever returning an unknown frame', () => {
    for (const action of ['idle', 'walk', 'hurt', 'fall', 'getup', 'grab', 'release', 'charge', 'combo', 'heavy']) {
      for (const t of [-5, 0, 17, 500]) {
        const frame = sampleClip(art, action, t)
        expect(allFrames.has(frame), `${action}@${t} -> ${frame}`).toBe(true)
      }
    }
  })

  it('the shared dispatch routes lidian art to the lidian frame names', () => {
    // The render path calls motionFrameForEntity for EVERY kind; lidian art
    // must reach the lidian dispatch, never the guanyu clip names.
    const routed: MotionArt = { ...art, frameDispatch: motionFrameForLidian }
    for (const e of [
      { state: 'idle', stateTick: 0, attackId: null },
      { state: 'walk', stateTick: 8, attackId: null },
      { state: 'attack', stateTick: 8, attackId: 'sword.combo' },
      { state: 'knockdown', stateTick: 4, attackId: null },
      { state: 'dead', stateTick: 0, attackId: null },
    ] as MotionEntity[]) {
      const frame = motionFrameForEntity(routed, e)
      expect(allFrames.has(frame), `${e.state} -> ${frame} must be a pack frame`).toBe(true)
    }
    expect(motionFrameForEntity(routed, { state: 'idle', stateTick: 0, attackId: null })).toBe('walk:0')
  })
})

describe('lidian collapse continuity (per-kind lowCollapse tail)', () => {
  const packFrames = new Set(Object.keys(meta.frames))

  it('pins the impact-then-DOWN tail; every tail frame exists in the pack', () => {
    expect(LIDIAN_COLLAPSE_TAIL).toEqual(['fall:3', 'fall:4'])
    for (const f of LIDIAN_COLLAPSE_TAIL) expect(packFrames.has(f), `tail frame ${f} in pack`).toBe(true)
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
    // Elbow edge (getup:0): the walkback from the pack's own DOWN drawing
    // settles straight onto the shared fall:4 bookend.
    const elbow = advanceMotion(art, { ...base, state: 'getup', stateTick: 2 }, 60)
    expect(elbow.frame).toBe('getup:0')
    const defeat0 = advanceMotion(art, { ...base, state: 'dying', stateTick: 0 }, 61, elbow.playback)
    expect(defeat0.frame).toBe('getup:0')
    expect(advanceMotion(art, { ...base, state: 'dying', stateTick: 4 }, 65, defeat0.playback).frame).toBe('fall:4')
  })
})
