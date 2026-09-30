import { describe, expect, it } from 'vitest'
import { motionPreparedRecord } from '../../src/game/adapters/motion-art'
import { guanyuClips, motionFrameForEntity, type MotionArt, type MotionEntity } from '../../src/game/art/motion-clips'
import { advanceMotion } from '../../src/game/art/motion-player'

const art: MotionArt = { ...motionPreparedRecord(), sheet: {} as CanvasImageSource, actionSheet: {} as CanvasImageSource, clips: guanyuClips() }
const idle: MotionEntity = { state: 'idle', stateTick: 0, attackId: null, mountedOn: null, airTicks: 0, z: 0 }
const airborne = (): ReturnType<typeof advanceMotion> => advanceMotion(art, { ...idle, state: 'jump', stateTick: 35, airTicks: 35, z: 5 }, 35)

describe('Guan Yu action boundary negative controls', () => {
  it('landing cannot fast-forward when hit-stop ends with idle -> walk', () => {
    const land = advanceMotion(art, idle, 36, airborne().playback)
    const frozen = advanceMotion(art, idle, 46, land.playback)
    const firstWalk = advanceMotion(art, { ...idle, state: 'walk', stateTick: 1 }, 47, frozen.playback)
    expect(firstWalk.frame).toBe('jump:7')
    const third = advanceMotion(art, { ...idle, state: 'walk', stateTick: 3 }, 49, firstWalk.playback)
    expect(third.frame).toBe('jump:1')
    const finished = advanceMotion(art, { ...idle, state: 'walk', stateTick: 8 }, 54, third.playback)
    expect(finished.frame).toBe(motionFrameForEntity(art, { ...idle, state: 'walk', stateTick: 8 }))
  })

  it('landing stays paused on a direction-state change without a simulation step', () => {
    const land = advanceMotion(art, idle, 36, airborne().playback)
    const directionChanged = advanceMotion(art, { ...idle, state: 'walk' }, 36, land.playback)
    expect(directionChanged.frame).toBe('jump:7')
  })

  it('mounting interrupts grounded landing rather than drawing a crouching rider', () => {
    const land = advanceMotion(art, idle, 36, airborne().playback)
    const mounted = advanceMotion(art, { ...idle, state: 'walk', stateTick: 1, mountedOn: 91 }, 37, land.playback)
    expect(mounted.frame).toBe('rider:0')
    expect(mounted.playback.transition).toBeUndefined()
  })

  it('mounting interrupts grab release instead of showing a standing reach on horseback', () => {
    const held = advanceMotion(art, { ...idle, state: 'grab', stateTick: 16 }, 16)
    const release = advanceMotion(art, idle, 17, held.playback)
    const mounted = advanceMotion(art, { ...idle, mountedOn: 91, stateTick: 1 }, 18, release.playback)
    expect(mounted.frame).toBe('rider:0')
  })

  it('late aerial input keeps the descent pose during startup, not a sudden apex tuck', () => {
    for (const airTicks of [1, 5, 18, 28, 32]) {
      const jumping = { ...idle, state: 'jump' as const, stateTick: airTicks, airTicks }
      expect(motionFrameForEntity(art, { ...jumping, state: 'jumpattack', stateTick: 0, attackId: 'gy.jumpkick' }))
        .toBe(motionFrameForEntity(art, jumping))
    }
  })

  it('late airborne kick still shows the strike on its actual active ticks', () => {
    for (const airTicks of [31, 32, 34, 35]) {
      expect(motionFrameForEntity(art, { ...idle, state: 'jumpattack', stateTick: 4, airTicks, attackId: 'gy.jumpkick' })).toBe('jump:4')
    }
  })

  it('a kick active until contact retracts on the first landing tick, then compresses', () => {
    const kick = advanceMotion(art, { ...idle, state: 'jumpattack', stateTick: 6, airTicks: 35, z: 5, attackId: 'gy.jumpkick' }, 35)
    const contact = advanceMotion(art, idle, 36, kick.playback)
    expect(contact.frame).toBe('jump:5')
    expect(advanceMotion(art, { ...idle, stateTick: 1 }, 37, contact.playback).frame).toBe('jump:7')
    expect(advanceMotion(art, { ...idle, stateTick: 9 }, 45, contact.playback).frame).toBe('walk:0')
  })

  it('direct early and late attack interruptions always sample their real strike tick', () => {
    const land = advanceMotion(art, idle, 36, airborne().playback)
    for (const stateTick of [0, 2, 8, 13, 26]) {
      const e = { ...idle, state: 'attack' as const, stateTick, attackId: 'gy.jab1' }
      const actual = advanceMotion(art, e, 40 + stateTick, land.playback)
      expect(actual.frame).toBe(motionFrameForEntity(art, e))
      expect(actual.playback.transition).toBeUndefined()
    }
  })

  it('airborne knockdown begins from the visible air pose rather than straightening upright', () => {
    const air = advanceMotion(art, { ...idle, state: 'jump', stateTick: 18, airTicks: 18, z: 48 }, 18)
    const hit = advanceMotion(art, { ...idle, state: 'knockdown' }, 19, air.playback)
    expect(hit.frame).toBe(air.frame)
    expect(advanceMotion(art, { ...idle, state: 'knockdown', stateTick: 2 }, 21, hit.playback).frame).toBe('fall:3')
    expect(advanceMotion(art, { ...idle, state: 'knockdown', stateTick: 10 }, 29, hit.playback).frame).toBe('fall:6')
  })

  it('skipped rendering cannot replay the first impact pose after the fall is already settled', () => {
    const air = advanceMotion(art, { ...idle, state: 'jump', stateTick: 18, airTicks: 18, z: 48 }, 18)
    const later = advanceMotion(art, { ...idle, state: 'knockdown', stateTick: 14 }, 33, air.playback)
    expect(later.frame).toBe('fall:6')
    expect(later.lift).toBe(0)
  })

  it('dismount uses the freeze-safe presentation clock, not delayed world time', () => {
    const rider = advanceMotion(art, { ...idle, mountedOn: 91, stateTick: 20 }, 20)
    const frozen = advanceMotion(art, { ...idle, mountedOn: 91, stateTick: 20 }, 30, rider.playback)
    const dropped = advanceMotion(art, { ...idle, stateTick: 21 }, 31, frozen.playback)
    expect(dropped.frame).toBe('rider:7')
    expect(advanceMotion(art, { ...idle, stateTick: 25 }, 35, dropped.playback).frame).toBe('jump:1')
    expect(advanceMotion(art, { ...idle, stateTick: 29 }, 39, dropped.playback).frame).toBe('walk:0')
  })

  it('a broken mount keeps the mounted attack hit window rather than shortening it to jab1', () => {
    const dropped = { ...idle, state: 'attack' as const, attackId: 'mounted.sweep', stateTick: 13 }
    expect(motionFrameForEntity(art, dropped)).toBe('jab1:4') // mounted active is ticks 8..13 inclusive
    expect(motionFrameForEntity(art, { ...dropped, stateTick: 14 })).toBe('jab1:5')
  })

  it('thrown body impact cannot restart an upright fall', () => {
    const flight = advanceMotion(art, { ...idle, state: 'thrown', stateTick: 8, z: 10 }, 8)
    const impact = advanceMotion(art, { ...idle, state: 'knockdown' }, 9, flight.playback)
    expect(impact.frame).toBe(flight.frame)
    expect(advanceMotion(art, { ...idle, state: 'knockdown', stateTick: 2 }, 11, impact.playback).frame).toBe('fall:5')
    expect(advanceMotion(art, { ...idle, state: 'knockdown', stateTick: 5 }, 14, impact.playback).frame).toBe('fall:6')
  })

  it('defeat interrupting seated getup keeps low posture instead of replaying standing recoil', () => {
    const seated = advanceMotion(art, { ...idle, state: 'getup', stateTick: 5 }, 45)
    const defeat = advanceMotion(art, { ...idle, state: 'dying' }, 46, seated.playback)
    expect(defeat.frame).toBe(seated.frame)
    expect(advanceMotion(art, { ...idle, state: 'dying', stateTick: 2 }, 48, defeat.playback).frame).toBe('getup:1')
    expect(advanceMotion(art, { ...idle, state: 'dying', stateTick: 5 }, 51, defeat.playback).frame).toBe('fall:6')
  })

  it('fall lift is presentation-only, advances on state ticks and expires on getup', () => {
    const air = advanceMotion(art, { ...idle, state: 'jump', stateTick: 18, airTicks: 18, z: 48 }, 18)
    const e = { ...idle, state: 'knockdown' as const }
    const hit = advanceMotion(art, e, 19, air.playback)
    expect(advanceMotion(art, e, 25, hit.playback).lift).toBe(48)
    const dropped = advanceMotion(art, { ...e, stateTick: 5 }, 30, hit.playback)
    expect(dropped.lift).toBe(24)
    const rise = advanceMotion(art, { ...idle, state: 'getup' }, 60, dropped.playback)
    expect(rise.lift).toBe(0)
    expect(rise.playback.fallLift).toBeUndefined()
    expect(e.z).toBe(0)
  })
})
