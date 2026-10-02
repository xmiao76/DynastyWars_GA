import { describe, expect, it } from 'vitest'
import { attackById } from '../../src/core/attacks'
import { DYING_TICKS, GETUP_TICKS, KNOCKDOWN_TICKS } from '../../src/core/constants'
import { ENEMIES } from '../../src/core/enemies'
import { spearmanPreparedRecord, motionPackManifest, MOTION_PACKS } from '../../src/game/adapters/motion-art'
import type { MotionArt, MotionEntity } from '../../src/game/art/motion-clips'
import { sampleClip, motionFrameForEntity } from '../../src/game/art/motion-clips'
import {
  motionFrameForSpearman,
  spearmanClips,
  validSpearmanPack,
} from '../../src/game/art/motion-clips-spearman'
import { validateClipExposures, validateMotionProfile, meleeProfile } from '../../src/game/art/motion-profiles'

/**
 * CMR-07B bounded work 1-2: every real state/attack/clock of the Wei
 * Spearman is bound and exercised. Every dispatched frame must exist in
 * the prepared pack - an unknown frame would break the shared-atlas
 * display.
 */

const meta = spearmanPreparedRecord()
const art: MotionArt = {
  ...meta,
  sheet: {} as CanvasImageSource,
  actionSheet: {} as CanvasImageSource,
  clips: spearmanClips(),
  attackBindings: { 'spear.thrust': 'thrust' },
}
const base: MotionEntity = { state: 'idle', stateTick: 0, attackId: null, mountedOn: null }

describe('spearman pack registration', () => {
  it('the prepared record validates as a spearman pack', () => {
    expect(validSpearmanPack(meta)).toBe(true)
    expect(meta.singlePage).toBe(true)
    expect(Object.keys(meta.frames)).toHaveLength(45)
    expect(MOTION_PACKS['spearman']).toBeDefined()
  })

  it('negative controls: missing frame / wrong cell / overlap fail the pack', () => {
    const frames = { ...meta.frames }
    delete frames['thrust:4']
    expect(validSpearmanPack({ ...meta, frames })).toBe(false)
    const bad = { ...meta.frames }
    bad['locomotion:0'] = { ...bad['locomotion:0']!, srcW: 100, srcH: 100 }
    expect(validSpearmanPack({ ...meta, frames: bad })).toBe(false)
    const overlap = { ...meta.frames }
    overlap['locomotion:1'] = { ...overlap['locomotion:1']!, x: overlap['locomotion:0']!.x + 2, y: overlap['locomotion:0']!.y + 2 }
    expect(validSpearmanPack({ ...meta, frames: overlap }), 'genuinely overlapping rects fail').toBe(false)
    expect(validSpearmanPack({ ...meta, id: 'guanyu' })).toBe(false)
    expect(validSpearmanPack({ ...meta, density: 0 })).toBe(false)
  })

  it('shared guard/down bookends are byte-identical drawings (same atlas rect)', () => {
    // An aliased bookend reuses the target drawing's trimmed rect exactly -
    // the same atlas pixels are drawn, so the bookends can never drift.
    const f = meta.frames as Record<string, unknown>
    expect(f['locomotion:8'], 'locomotion guard bookend').toEqual(f['locomotion:0'])
    expect(f['thrust:0'], 'thrust guard entry').toEqual(f['locomotion:0'])
    expect(f['thrust:8'], 'thrust guard bookend').toEqual(f['locomotion:0'])
    expect(f['hitstun-held:0'], 'hitstun guard entry').toEqual(f['locomotion:0'])
    expect(f['hitstun-held:8'], 'hitstun guard bookend').toEqual(f['locomotion:0'])
    expect(f['fall-thrown:8'], 'fall down bookend').toEqual(f['fall-thrown:3'])
    expect(f['getup-death:3'], 'getup down bookend').toEqual(f['fall-thrown:3'])
    expect(f['getup-death:8'], 'getup guard bookend').toEqual(f['locomotion:0'])
  })
})

describe('spearman clips follow core timing', () => {
  it('clip exposures are strictly ordered and durations match core data', () => {
    expect(validateClipExposures(art.clips)).toEqual([])
    expect(validateMotionProfile(meleeProfile('spearman'))).toEqual([])
    const a = attackById('spear.thrust')
    expect(art.clips.thrust!.duration).toBe(a.startup + a.active + a.recover)
    expect(ENEMIES.spearman!.hitstunTicks).toBe(14)
    expect(art.clips.hurt!.duration).toBe(14)
    expect(art.clips.fall!.duration).toBe(KNOCKDOWN_TICKS)
    expect(art.clips.getup!.duration).toBe(GETUP_TICKS)
  })

  it('the manifest advertises the spearman clips and the pack loads only its page', () => {
    const manifest = motionPackManifest('spearman')
    expect(manifest?.requiredClips.sort()).toEqual(['flee', 'fall', 'getup', 'hurt', 'idle', 'thrust', 'walk'].sort())
    expect(manifest?.pages).toHaveLength(1)
    expect(manifest?.display).toBe('shared-atlas')
  })
})

describe('spearman state dispatch (every state, key ticks)', () => {
  const frameAt = (e: Partial<MotionEntity>): string => motionFrameForSpearman(art, { ...base, ...e })
  const allFrames = new Set(Object.keys(meta.frames))

  it('idle / walk cycle / retreat', () => {
    expect(frameAt({ state: 'idle' })).toBe('locomotion:0')
    const cycle = [0, 4, 8, 12].map((t) => frameAt({ state: 'walk', stateTick: t }))
    expect(cycle).toEqual(['locomotion:1', 'locomotion:2', 'locomotion:3', 'locomotion:4'])
    expect(frameAt({ state: 'walk', stateTick: 16 }), 'loop repeats').toBe('locomotion:1')
    expect([frameAt({ state: 'fleeing', stateTick: 0 }), frameAt({ state: 'fleeing', stateTick: 4 })])
      .toEqual(['locomotion:6', 'locomotion:7'])
  })

  it('the visible strike matches every active tick of spear.thrust', () => {
    const a = attackById('spear.thrust')
    const endActive = a.startup + a.active
    // Startup shows the guard entry then windup drawings; EVERY active tick
    // shows an active drawing; recovery returns to guard by the last tick.
    expect(frameAt({ state: 'attack', attackId: 'spear.thrust', stateTick: 0 }), 'attacks start from the guard pose').toBe('locomotion:0')
    for (let t = 1; t < a.startup; t++) {
      expect(['thrust:1', 'thrust:2'], `startup ${t}`).toContain(frameAt({ state: 'attack', attackId: 'spear.thrust', stateTick: t }))
    }
    for (let t = a.startup; t < endActive; t++) {
      expect(['thrust:3', 'thrust:4'], `active ${t}`).toContain(frameAt({ state: 'attack', attackId: 'spear.thrust', stateTick: t }))
    }
    for (let t = endActive; t < endActive + a.recover; t++) {
      expect(['thrust:5', 'thrust:6', 'thrust:7', 'locomotion:0'], `recover ${t}`).toContain(frameAt({ state: 'attack', attackId: 'spear.thrust', stateTick: t }))
    }
    // The 5-tick active window is exactly ticks 20..24 inclusive.
    expect(a.startup).toBe(20)
    expect(a.active).toBe(5)
    expect(a.recover).toBe(26)
    expect(frameAt({ state: 'attack', attackId: 'spear.thrust', stateTick: 20 })).toBe('thrust:3')
  })

  it('hitstun (14 ticks), knockdown, getup', () => {
    expect(frameAt({ state: 'hitstun', stateTick: 0 })).toBe('hitstun-held:1')
    expect(frameAt({ state: 'hitstun', stateTick: 9 })).toBe('hitstun-held:3')
    expect(frameAt({ state: 'hitstun', stateTick: 13 }), 'last hitstun tick returns to guard').toBe('locomotion:0')
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
    for (let t = 0; t < 60; t++) push({ state: 'attack', attackId: 'spear.thrust', stateTick: t })
    for (const frame of seen) expect(allFrames.has(frame), `frame ${frame} must exist in the pack`).toBe(true)
    // An unknown attack stays on new art (guard), never the legacy rig.
    expect(frameAt({ state: 'attack', attackId: 'spear.nope', stateTick: 3 })).toBe('locomotion:0')
  })

  it('sampleClip clamps out-of-range ticks without ever returning an unknown frame', () => {
    for (const action of ['idle', 'walk', 'flee', 'hurt', 'fall', 'getup', 'thrust']) {
      for (const t of [-5, 0, 17, 500]) {
        const frame = sampleClip(art, action, t)
        expect(allFrames.has(frame), `${action}@${t} -> ${frame}`).toBe(true)
      }
    }
  })

  it('the shared dispatch routes spearman art to the spearman frame names', () => {
    // The render path calls motionFrameForEntity for EVERY kind; spearman art
    // must reach the spearman dispatch, never the hero clip names.
    const routed: MotionArt = { ...art, frameDispatch: motionFrameForSpearman }
    for (const e of [
      { state: 'idle', stateTick: 0, attackId: null, mountedOn: null },
      { state: 'attack', stateTick: 21, attackId: 'spear.thrust', mountedOn: null },
      { state: 'knockdown', stateTick: 4, attackId: null, mountedOn: null },
      { state: 'dead', stateTick: 0, attackId: null, mountedOn: null },
    ] as MotionEntity[]) {
      const frame = motionFrameForEntity(routed, e)
      expect(allFrames.has(frame), `${e.state} -> ${frame} must be a pack frame`).toBe(true)
    }
    expect(motionFrameForEntity(routed, { state: 'idle', stateTick: 0, attackId: null, mountedOn: null })).toBe('locomotion:0')
  })
})
