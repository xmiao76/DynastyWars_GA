import { describe, expect, it } from 'vitest'
import { attackById } from '../../src/core/attacks'
import { DYING_TICKS, GETUP_TICKS, KNOCKDOWN_TICKS } from '../../src/core/constants'
import { ENEMIES } from '../../src/core/enemies'
import { soldierPreparedRecord, motionPackManifest, MOTION_PACKS } from '../../src/game/adapters/motion-art'
import type { MotionArt, MotionEntity } from '../../src/game/art/motion-clips'
import { sampleClip } from '../../src/game/art/motion-clips'
import {
  motionFrameForSoldier,
  soldierClips,
  validSoldierPack,
} from '../../src/game/art/motion-clips-soldier'
import { validateClipExposures, validateMotionProfile, meleeProfile } from '../../src/game/art/motion-profiles'

/**
 * CMR-06B bounded work 2: every real state/attack/clock of the Wei Soldier
 * is bound and exercised. Every dispatched frame must exist in the prepared
 * pack - an unknown frame would break the shared-atlas display.
 */

const meta = soldierPreparedRecord()
const art: MotionArt = {
  ...meta,
  sheet: {} as CanvasImageSource,
  actionSheet: {} as CanvasImageSource,
  clips: soldierClips(),
  attackBindings: { 'soldier.swing': 'swing' },
}
const base: MotionEntity = { state: 'idle', stateTick: 0, attackId: null, mountedOn: null }

describe('soldier pack registration', () => {
  it('the prepared record validates as a soldier pack', () => {
    expect(validSoldierPack(meta)).toBe(true)
    expect(meta.singlePage).toBe(true)
    expect(Object.keys(meta.frames)).toHaveLength(45)
    expect(MOTION_PACKS['soldier']).toBeDefined()
  })

  it('negative controls: missing frame / wrong cell / overlap fail the pack', () => {
    const frames = { ...meta.frames }
    delete frames['swing:4']
    expect(validSoldierPack({ ...meta, frames })).toBe(false)
    const bad = { ...meta.frames }
    bad['locomotion:0'] = { ...bad['locomotion:0']!, srcW: 100, srcH: 100 }
    expect(validSoldierPack({ ...meta, frames: bad })).toBe(false)
    const overlap = { ...meta.frames }
    overlap['locomotion:1'] = { ...overlap['locomotion:1']!, x: overlap['locomotion:0']!.x + 2, y: overlap['locomotion:0']!.y + 2 }
    expect(validSoldierPack({ ...meta, frames: overlap }), 'genuinely overlapping rects fail').toBe(false)
    expect(validSoldierPack({ ...meta, id: 'guanyu' })).toBe(false)
    expect(validSoldierPack({ ...meta, density: 0 })).toBe(false)
  })

  it('shared guard/down bookends are byte-identical drawings (same atlas rect)', () => {
    // An aliased bookend reuses the target drawing's trimmed rect exactly -
    // the same atlas pixels are drawn, so the bookends can never drift.
    const f = meta.frames as Record<string, unknown>
    expect(f['locomotion:8'], 'locomotion guard bookend').toEqual(f['locomotion:0'])
    expect(f['swing:0'], 'swing guard entry').toEqual(f['locomotion:0'])
    expect(f['swing:8'], 'swing guard bookend').toEqual(f['locomotion:0'])
    expect(f['hitstun-held:0'], 'hitstun guard entry').toEqual(f['locomotion:0'])
    expect(f['hitstun-held:8'], 'hitstun guard bookend').toEqual(f['locomotion:0'])
    expect(f['fall-thrown:8'], 'fall down bookend').toEqual(f['fall-thrown:3'])
    expect(f['getup-death:3'], 'getup down bookend').toEqual(f['fall-thrown:3'])
    expect(f['getup-death:8'], 'getup guard bookend').toEqual(f['locomotion:0'])
  })
})

describe('soldier clips follow core timing', () => {
  it('clip exposures are strictly ordered and durations match core data', () => {
    expect(validateClipExposures(art.clips)).toEqual([])
    expect(validateMotionProfile(meleeProfile('soldier'))).toEqual([])
    const a = attackById('soldier.swing')
    expect(art.clips.swing!.duration).toBe(a.startup + a.active + a.recover)
    expect(ENEMIES.soldier!.hitstunTicks).toBe(18)
    expect(art.clips.hurt!.duration).toBe(18)
    expect(art.clips.fall!.duration).toBe(KNOCKDOWN_TICKS)
    expect(art.clips.getup!.duration).toBe(GETUP_TICKS)
  })

  it('the manifest advertises the soldier clips and the pack loads only its page', () => {
    const manifest = motionPackManifest('soldier')
    expect(manifest?.requiredClips.sort()).toEqual(['flee', 'fall', 'getup', 'hurt', 'idle', 'swing', 'walk'].sort())
    expect(manifest?.pages).toHaveLength(1)
    expect(manifest?.display).toBe('shared-atlas')
  })
})

describe('soldier state dispatch (every state, key ticks)', () => {
  const frameAt = (e: Partial<MotionEntity>): string => motionFrameForSoldier(art, { ...base, ...e })
  const allFrames = new Set(Object.keys(meta.frames))

  it('idle / walk cycle / retreat', () => {
    expect(frameAt({ state: 'idle' })).toBe('locomotion:0')
    const cycle = [0, 4, 8, 12].map((t) => frameAt({ state: 'walk', stateTick: t }))
    expect(cycle).toEqual(['locomotion:1', 'locomotion:2', 'locomotion:3', 'locomotion:4'])
    expect(frameAt({ state: 'walk', stateTick: 16 }), 'loop repeats').toBe('locomotion:1')
    expect([frameAt({ state: 'fleeing', stateTick: 0 }), frameAt({ state: 'fleeing', stateTick: 4 })])
      .toEqual(['locomotion:6', 'locomotion:7'])
  })

  it('the visible strike matches every active tick of soldier.swing', () => {
    const a = attackById('soldier.swing')
    const endActive = a.startup + a.active
    // Startup shows the guard entry then windup drawings; EVERY active tick
    // shows an active drawing; recovery returns to guard by the last tick.
    expect(frameAt({ state: 'attack', attackId: 'soldier.swing', stateTick: 0 }), 'attacks start from the guard pose').toBe('locomotion:0')
    for (let t = 1; t < a.startup; t++) {
      expect(['swing:0', 'swing:1', 'swing:2'], `startup ${t}`).toContain(frameAt({ state: 'attack', attackId: 'soldier.swing', stateTick: t }))
    }
    for (let t = a.startup; t < endActive; t++) {
      expect(['swing:3', 'swing:4'], `active ${t}`).toContain(frameAt({ state: 'attack', attackId: 'soldier.swing', stateTick: t }))
    }
    for (let t = endActive; t < endActive + a.recover; t++) {
      expect(['swing:5', 'swing:6', 'swing:7', 'locomotion:0'], `recover ${t}`).toContain(frameAt({ state: 'attack', attackId: 'soldier.swing', stateTick: t }))
    }
    // The 4-tick active window is exactly ticks 14..17 inclusive.
    expect(a.startup).toBe(14)
    expect(a.active).toBe(4)
    expect(a.recover).toBe(20)
    expect(frameAt({ state: 'attack', attackId: 'soldier.swing', stateTick: 14 })).toBe('swing:3')
  })

  it('hitstun (18 ticks), knockdown, getup', () => {
    expect(frameAt({ state: 'hitstun', stateTick: 0 })).toBe('hitstun-held:1')
    expect(frameAt({ state: 'hitstun', stateTick: 12 })).toBe('hitstun-held:3')
    expect(frameAt({ state: 'hitstun', stateTick: 17 }), 'last hitstun tick returns to guard').toBe('locomotion:0')
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
    }
    for (let t = 0; t < 60; t++) push({ state: 'attack', attackId: 'soldier.swing', stateTick: t })
    for (const frame of seen) expect(allFrames.has(frame), `frame ${frame} must exist in the pack`).toBe(true)
    // An unknown attack stays on new art (guard), never the legacy rig.
    expect(frameAt({ state: 'attack', attackId: 'soldier.nope', stateTick: 3 })).toBe('locomotion:0')
  })

  it('sampleClip clamps out-of-range ticks without ever returning an unknown frame', () => {
    for (const action of ['idle', 'walk', 'flee', 'hurt', 'fall', 'getup', 'swing']) {
      for (const t of [-5, 0, 17, 500]) {
        const frame = sampleClip(art, action, t)
        expect(allFrames.has(frame), `${action}@${t} -> ${frame}`).toBe(true)
      }
    }
  })
})
