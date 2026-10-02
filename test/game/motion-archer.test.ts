import { describe, expect, it } from 'vitest'
import { DYING_TICKS, GETUP_TICKS, KNOCKDOWN_TICKS } from '../../src/core/constants'
import { ENEMIES } from '../../src/core/enemies'
import { archerPreparedRecord, motionPackManifest, MOTION_PACKS } from '../../src/game/adapters/motion-art'
import type { MotionArt, MotionEntity } from '../../src/game/art/motion-clips'
import { sampleClip, motionFrameForEntity } from '../../src/game/art/motion-clips'
import {
  archerFiringPhase,
  motionFrameForArcher,
  archerClips,
  validArcherPack,
} from '../../src/game/art/motion-clips-archer'
import { validateClipExposures, validateMotionProfile, shooterProfile } from '../../src/game/art/motion-profiles'

/**
 * CMR-08B bounded work 2: every real state/attack/clock of the Wei Archer
 * is bound and exercised. Every dispatched frame must exist in the prepared
 * pack - an unknown frame would break the shared-atlas display.
 *
 * Shooters have no attack state: the firing presentation runs off the AI
 * thinkTick countdown (release coincides with the spawn tick), and walk
 * shows locomotion (firing cues suppressed while maneuvering).
 */

const meta = archerPreparedRecord()
const art: MotionArt = {
  ...meta,
  sheet: {} as CanvasImageSource,
  actionSheet: {} as CanvasImageSource,
  clips: archerClips(),
  attackBindings: {},
}
const base: MotionEntity = { state: 'idle', stateTick: 0, attackId: null, mountedOn: null }

describe('archer pack registration', () => {
  it('the prepared record validates as an archer pack', () => {
    expect(validArcherPack(meta)).toBe(true)
    expect(meta.singlePage).toBe(true)
    expect(Object.keys(meta.frames)).toHaveLength(45)
    expect(MOTION_PACKS['archer']).toBeDefined()
  })

  it('negative controls: missing frame / wrong cell / overlap fail the pack', () => {
    const frames = { ...meta.frames }
    delete frames['shoot:4']
    expect(validArcherPack({ ...meta, frames })).toBe(false)
    const bad = { ...meta.frames }
    bad['locomotion:0'] = { ...bad['locomotion:0']!, srcW: 100, srcH: 100 }
    expect(validArcherPack({ ...meta, frames: bad })).toBe(false)
    const overlap = { ...meta.frames }
    overlap['locomotion:1'] = { ...overlap['locomotion:1']!, x: overlap['locomotion:0']!.x + 2, y: overlap['locomotion:0']!.y + 2 }
    expect(validArcherPack({ ...meta, frames: overlap }), 'genuinely overlapping rects fail').toBe(false)
    expect(validArcherPack({ ...meta, id: 'guanyu' })).toBe(false)
    expect(validArcherPack({ ...meta, density: 0 })).toBe(false)
  })

  it('shared guard/down bookends are byte-identical drawings (same atlas rect)', () => {
    // An aliased bookend reuses the target drawing's trimmed rect exactly -
    // the same atlas pixels are drawn, so the bookends can never drift.
    const f = meta.frames as Record<string, unknown>
    expect(f['locomotion:8'], 'locomotion guard bookend').toEqual(f['locomotion:0'])
    expect(f['shoot:0'], 'shoot guard entry').toEqual(f['locomotion:0'])
    expect(f['shoot:8'], 'shoot guard bookend').toEqual(f['locomotion:0'])
    expect(f['hitstun-held:0'], 'hitstun guard entry').toEqual(f['locomotion:0'])
    expect(f['hitstun-held:8'], 'hitstun guard bookend').toEqual(f['locomotion:0'])
    expect(f['fall-thrown:8'], 'fall down bookend').toEqual(f['fall-thrown:3'])
    expect(f['getup-death:3'], 'getup down bookend').toEqual(f['fall-thrown:3'])
    expect(f['getup-death:8'], 'getup guard bookend').toEqual(f['locomotion:0'])
  })
})

describe('archer clips follow core timing', () => {
  it('clip exposures are strictly ordered and durations match core data', () => {
    expect(validateClipExposures(art.clips)).toEqual([])
    expect(validateMotionProfile(shooterProfile('archer'))).toEqual([])
    expect(ENEMIES.archer!.attackId).toBe('')
    expect(ENEMIES.archer!.fireInterval).toBe(90)
    expect(art.clips.shoot!.duration).toBe(90)
    expect(ENEMIES.archer!.hitstunTicks).toBe(16)
    expect(art.clips.hurt!.duration).toBe(16)
    expect(art.clips.fall!.duration).toBe(KNOCKDOWN_TICKS)
    expect(art.clips.getup!.duration).toBe(GETUP_TICKS)
  })

  it('the manifest advertises the archer clips and the pack loads only its page', () => {
    const manifest = motionPackManifest('archer')
    expect(manifest?.requiredClips.sort()).toEqual(['flee', 'fall', 'getup', 'hurt', 'idle', 'shoot', 'walk'].sort())
    expect(manifest?.pages).toHaveLength(1)
    expect(manifest?.display).toBe('shared-atlas')
  })
})

describe('archer firing phase (thinkTick countdown, release at spawn)', () => {
  it('phase runs 0 at the spawn tick through the full cycle and wraps', () => {
    const at = (thinkTick: number): string | null => {
      const p = archerFiringPhase({ ...base, thinkTick })
      return p === null ? null : sampleClip(art, 'shoot', p)
    }
    // thinkTick 90 = just fired (reset): release shows on the spawn tick.
    expect(at(90)).toBe('shoot:4')
    expect(at(89)).toBe('shoot:4')
    expect(at(86)).toBe('shoot:5')
    expect(at(79)).toBe('shoot:6')
    expect(at(70)).toBe('shoot:7')
    expect(at(59)).toBe('shoot:1')
    expect(at(45)).toBe('shoot:2')
    expect(at(29)).toBe('shoot:3')
    expect(at(1)).toBe('shoot:3')
    expect(at(0), 'degenerate zero wraps to release').toBe('shoot:4')
  })

  it('missing or unusable countdown falls back to guard, never a wrong frame', () => {
    expect(archerFiringPhase({ ...base })).toBeNull()
    expect(archerFiringPhase({ ...base, thinkTick: Number.NaN })).toBeNull()
  })
})

describe('archer state dispatch (every state, key ticks)', () => {
  const frameAt = (e: Partial<MotionEntity>): string => motionFrameForArcher(art, { ...base, ...e })
  const allFrames = new Set(Object.keys(meta.frames))

  it('idle shows the firing cycle when the countdown is observable, guard otherwise', () => {
    // thinkTick 90 (just fired) -> release; mid-countdown -> draw; no
    // countdown (non-AI contexts) -> guard bookend, never a stale frame.
    expect(frameAt({ state: 'idle', thinkTick: 90 })).toBe('shoot:4')
    expect(frameAt({ state: 'idle', thinkTick: 45 })).toBe('shoot:2')
    expect(frameAt({ state: 'idle', thinkTick: 10 })).toBe('shoot:3')
    expect(frameAt({ state: 'idle' })).toBe('locomotion:0')
    expect(frameAt({ state: 'idle', thinkTick: undefined })).toBe('locomotion:0')
  })

  it('walk cycle / retreat show locomotion (firing suppressed while maneuvering)', () => {
    const cycle = [0, 4, 8, 12].map((t) => frameAt({ state: 'walk', stateTick: t, thinkTick: 90 }))
    expect(cycle).toEqual(['locomotion:1', 'locomotion:2', 'locomotion:3', 'locomotion:4'])
    expect(frameAt({ state: 'walk', stateTick: 16, thinkTick: 90 }), 'loop repeats').toBe('locomotion:1')
    expect([frameAt({ state: 'fleeing', stateTick: 0 }), frameAt({ state: 'fleeing', stateTick: 4 })])
      .toEqual(['locomotion:6', 'locomotion:7'])
  })

  it('archers never take an attack state; any attackId stays on guard', () => {
    expect(ENEMIES.archer!.attackId).toBe('')
    for (const attackId of [null, 'archer.swing', 'spear.thrust', 'soldier.swing']) {
      expect(frameAt({ state: 'attack', attackId, stateTick: 3 }), `attackId ${attackId}`).toBe('locomotion:0')
    }
  })

  it('hitstun (16 ticks), knockdown, getup', () => {
    expect(frameAt({ state: 'hitstun', stateTick: 0 })).toBe('hitstun-held:1')
    expect(frameAt({ state: 'hitstun', stateTick: 10 })).toBe('hitstun-held:3')
    expect(frameAt({ state: 'hitstun', stateTick: 15 }), 'last hitstun tick returns to guard').toBe('locomotion:0')
    expect(frameAt({ state: 'knockdown', stateTick: 0 })).toBe('fall-thrown:0')
    expect(frameAt({ state: 'knockdown', stateTick: 12 })).toBe('fall-thrown:3')
    expect(frameAt({ state: 'knockdown', stateTick: KNOCKDOWN_TICKS + 5 }), 'clamp, never out of range').toBe('fall-thrown:3')
    expect(frameAt({ state: 'getup', stateTick: 0 })).toBe('fall-thrown:3')
    expect(frameAt({ state: 'getup', stateTick: 6 })).toBe('getup-death:0')
    expect(frameAt({ state: 'getup', stateTick: GETUP_TICKS - 1 })).toBe('locomotion:0')
  })

  it('upright held/escape and throw flight/impact', () => {
    expect(frameAt({ state: 'grab', stateTick: 0 })).toBe('hitstun-held:4')
    expect(frameAt({ state: 'grabbed', stateTick: 5 })).toBe('hitstun-held:5')
    expect(frameAt({ state: 'thrown', stateTick: 0 })).toBe('fall-thrown:4')
    expect(frameAt({ state: 'thrown', stateTick: 5 })).toBe('fall-thrown:5')
    expect(frameAt({ state: 'thrown', stateTick: 11 })).toBe('fall-thrown:6')
    expect(frameAt({ state: 'thrown', stateTick: 14 })).toBe('fall-thrown:7')
    expect(frameAt({ state: 'thrown', stateTick: 99 }), 'clamp').toBe('fall-thrown:7')
  })

  it('dying and dead terminate on the drawn dead pose', () => {
    expect(frameAt({ state: 'dying', stateTick: 0 })).toBe('getup-death:4')
    expect(frameAt({ state: 'dying', stateTick: Math.floor(DYING_TICKS / 2) })).toBe('getup-death:5')
    expect(frameAt({ state: 'dying', stateTick: DYING_TICKS + 10 })).toBe('getup-death:6')
    expect(frameAt({ state: 'dead', stateTick: 0 })).toBe('getup-death:7')
    expect(frameAt({ state: 'dead', stateTick: 900 })).toBe('getup-death:7')
  })

  it('every dispatched frame exists in the pack (no legacy fallback, no unknowns)', () => {
    const seen = new Set<string>()
    const push = (e: Partial<MotionEntity>) => seen.add(frameAt(e))
    for (const state of ['idle', 'walk', 'fleeing', 'hitstun', 'knockdown', 'getup', 'grab', 'grabbed', 'thrown', 'dying', 'dead'] as const) {
      for (const t of [0, 1, 4, 8, 14, 20, 40]) push({ state, stateTick: t })
      for (const thinkTick of [0, 1, 45, 89, 90]) push({ state, stateTick: 0, thinkTick })
    }
    for (const thinkTick of [0, 30, 60, 89, 90]) push({ state: 'attack', attackId: 'archer.swing', stateTick: 3, thinkTick })
    for (const frame of seen) expect(allFrames.has(frame), `frame ${frame} must exist in the pack`).toBe(true)
    // An unknown attack stays on new art (guard), never the legacy rig.
    expect(frameAt({ state: 'attack', attackId: 'archer.nope', stateTick: 3 })).toBe('locomotion:0')
  })

  it('sampleClip clamps out-of-range ticks without ever returning an unknown frame', () => {
    for (const action of ['idle', 'walk', 'flee', 'hurt', 'fall', 'getup', 'shoot']) {
      for (const t of [-5, 0, 17, 500]) {
        const frame = sampleClip(art, action, t)
        expect(allFrames.has(frame), `${action}@${t} -> ${frame}`).toBe(true)
      }
    }
  })

  it('the shared dispatch routes archer art to the archer frame names', () => {
    // The render path calls motionFrameForEntity for EVERY kind; archer art
    // must reach the archer dispatch, never the hero clip names.
    const routed: MotionArt = { ...art, frameDispatch: motionFrameForArcher }
    for (const e of [
      { state: 'idle', stateTick: 0, attackId: null, mountedOn: null, thinkTick: 90 },
      { state: 'idle', stateTick: 0, attackId: null, mountedOn: null },
      { state: 'knockdown', stateTick: 4, attackId: null, mountedOn: null },
      { state: 'dead', stateTick: 0, attackId: null, mountedOn: null },
    ] as MotionEntity[]) {
      const frame = motionFrameForEntity(routed, e)
      expect(allFrames.has(frame), `${e.state} -> ${frame} must be a pack frame`).toBe(true)
    }
    expect(motionFrameForEntity(routed, { state: 'idle', stateTick: 0, attackId: null, mountedOn: null })).toBe('locomotion:0')
  })
})
