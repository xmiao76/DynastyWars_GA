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
  transition?: { action: 'landing' | 'kicklanding' | 'release' | 'dismount'; since: number }
  fallLift?: { height: number; sinceStateTick: number }
  airborneFall?: { frame: string; sinceStateTick: number }
  alreadyDown?: boolean
}
export interface MotionSample { frame: string; lift: number; playback: MotionPlayback }
export function advanceMotion(art: MotionArt, entity: MotionEntity, tick: number, prev?: MotionPlayback): MotionSample {
  const natural = motionFrameForEntity(art, entity)
  // Core idle <-> walk does not reset stateTick. Keep its presentation clock
  // continuous across direction changes, including sim.tick-only hit-stop.
  const groundState = (state: MotionEntity['state']): boolean => state === 'idle' || state === 'walk'
  const sharedClock = prev && (prev.state === entity.state || (groundState(prev.state) && groundState(entity.state)))
  const clock = sharedClock
    ? prev.tick + Math.max(0, entity.stateTick - prev.stateTick)
    : tick
  const out: MotionPlayback = { state: entity.state, mountedOn: entity.mountedOn, tick: clock, stateTick: entity.stateTick, frame: natural, z: entity.z ?? 0 }
  if (prev) {
    out.transition = prev.transition
    out.fallLift = prev.fallLift
    out.airborneFall = prev.airborneFall
    out.alreadyDown = prev.alreadyDown
    const grounded = groundState(entity.state) && entity.mountedOn === null
    if (entity.mountedOn !== null) out.transition = undefined
    if (grounded && (prev.state === 'jump' || prev.state === 'jumpattack')) out.transition = { action: prev.frame === 'jump:4' ? 'kicklanding' : 'landing', since: tick - entity.stateTick }
    else if (grounded && prev.state === 'grab') out.transition = { action: 'release', since: tick - entity.stateTick }
    if (prev.mountedOn !== null && entity.mountedOn === null) out.transition = { action: 'dismount', since: clock }
    if (entity.state === 'dying' && prev.state !== 'dying') {
      out.alreadyDown = (prev.state === 'knockdown' && prev.frame === 'fall:6') || prev.state === 'dead'
    }
    if ((entity.state === 'knockdown' || entity.state === 'dying') && prev.state !== entity.state && prev.z > 0) {
      out.fallLift = { height: prev.z, sinceStateTick: 0 }
      if (prev.state === 'jump' || prev.state === 'jumpattack') out.airborneFall = { frame: prev.frame, sinceStateTick: 0 }
    }
    if (grounded && out.transition) {
      const elapsed = clock - out.transition.since
      if (elapsed < art.clips[out.transition.action].duration) out.frame = sampleClip(art, out.transition.action, elapsed)
      else out.transition = undefined
    } else if (entity.state !== 'idle' && entity.state !== 'walk') out.transition = undefined
    if (entity.state === 'dying' && out.alreadyDown) out.frame = 'fall:6'
  }
  if (out.airborneFall && (entity.state === 'knockdown' || entity.state === 'dying')) {
    const age = Math.max(0, entity.stateTick - out.airborneFall.sinceStateTick)
    // Keep the actual airborne silhouette for the impact beat, then continue
    // at the tipping drawings: never insert a straight-legged standing recoil.
    out.frame = age < 2 ? out.airborneFall.frame : sampleClip(art, 'fall', age + 3)
  } else out.airborneFall = undefined
  let lift = 0
  if (out.fallLift && (entity.state === 'knockdown' || entity.state === 'dying')) {
    const age = entity.stateTick - out.fallLift.sinceStateTick
    if (age < 10) lift = out.fallLift.height * (1 - Math.max(0, age) / 10)
    else out.fallLift = undefined
  } else out.fallLift = undefined
  if (entity.state !== 'dying') out.alreadyDown = undefined
  return { frame: out.frame, lift, playback: out }
}
