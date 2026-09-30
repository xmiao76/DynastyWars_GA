import type { MotionArt, MotionEntity } from './motion-clips'
import { motionFrameForEntity, sampleClip } from './motion-clips'

/** Per-entity presentation history. Core simulation is never mutated. */
export interface MotionPlayback {
  state: MotionEntity['state']
  mountedOn: number | null
  tick: number
  stateTick: number
  frame: string
  z: number
  transition?: { action: 'landing' | 'release' | 'dismount'; since: number }
  fallLift?: { height: number; sinceStateTick: number }
  alreadyDown?: boolean
}
export interface MotionSample { frame: string; lift: number; playback: MotionPlayback }
export function advanceMotion(art: MotionArt, entity: MotionEntity, tick: number, prev?: MotionPlayback): MotionSample {
  const natural = motionFrameForEntity(art, entity)
  const clock = prev && prev.state === entity.state
    ? prev.tick + Math.max(0, entity.stateTick - prev.stateTick)
    : tick
  const out: MotionPlayback = { state: entity.state, mountedOn: entity.mountedOn, tick: clock, stateTick: entity.stateTick, frame: natural, z: entity.z ?? 0 }
  if (prev) {
    out.transition = prev.transition
    out.fallLift = prev.fallLift
    out.alreadyDown = prev.alreadyDown
    const grounded = entity.state === 'idle' || entity.state === 'walk'
    if (grounded && (prev.state === 'jump' || prev.state === 'jumpattack')) out.transition = { action: 'landing', since: tick - entity.stateTick }
    else if (grounded && prev.state === 'grab') out.transition = { action: 'release', since: tick - entity.stateTick }
    if (prev.mountedOn !== null && entity.mountedOn === null) out.transition = { action: 'dismount', since: tick }
    if (entity.state === 'dying' && prev.state !== 'dying') {
      out.alreadyDown = (prev.state === 'knockdown' && prev.frame === 'fall:6') || prev.state === 'dead'
    }
    if ((entity.state === 'knockdown' || entity.state === 'dying') && prev.state !== entity.state && prev.z > 0) {
      out.fallLift = { height: prev.z, sinceStateTick: entity.stateTick }
    }
    if (grounded && out.transition) {
      const elapsed = clock - out.transition.since
      if (elapsed < art.clips[out.transition.action].duration) out.frame = sampleClip(art, out.transition.action, elapsed)
      else out.transition = undefined
    } else if (entity.state !== 'idle' && entity.state !== 'walk') out.transition = undefined
    if (entity.state === 'dying' && out.alreadyDown) out.frame = 'fall:6'
  }
  let lift = 0
  if (out.fallLift && (entity.state === 'knockdown' || entity.state === 'dying')) {
    const age = entity.stateTick - out.fallLift.sinceStateTick
    if (age < 10) lift = out.fallLift.height * (1 - Math.max(0, age) / 10)
    else out.fallLift = undefined
  } else out.fallLift = undefined
  if (entity.state !== 'dying') out.alreadyDown = undefined
  return { frame: out.frame, lift, playback: out }
}
