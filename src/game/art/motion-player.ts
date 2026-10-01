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
  lowCollapse?: { frames: string[] }
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
    out.lowCollapse = prev.lowCollapse
    out.alreadyDown = prev.alreadyDown
    const grounded = groundState(entity.state) && entity.mountedOn === null
    if (entity.mountedOn !== null) out.transition = undefined
    if (grounded && (prev.state === 'jump' || prev.state === 'jumpattack')) out.transition = { action: prev.frame === 'jump:4' ? 'kicklanding' : 'landing', since: tick - entity.stateTick }
    else if (grounded && prev.state === 'grab') out.transition = { action: 'release', since: tick - entity.stateTick }
    if (prev.mountedOn !== null && entity.mountedOn === null) out.transition = { action: 'dismount', since: clock }
    if (entity.state === 'dying' && prev.state !== 'dying') {
      out.alreadyDown = (prev.state === 'knockdown' && prev.frame === 'fall:6') || prev.state === 'dead'
    }
    const enteringFall = (entity.state === 'knockdown' || entity.state === 'dying') && prev.state !== entity.state
    if (enteringFall && prev.state === 'thrown') out.lowCollapse = { frames: [prev.frame, 'fall:5', 'fall:6'] }
    if (enteringFall && (prev.state === 'getup' || prev.state === 'knockdown')) {
      const low = /^getup:([1-7])$/.exec(prev.frame)
      if (low) out.lowCollapse = { frames: [prev.frame, ...Array.from({ length: Number(low[1]) - 1 }, (_, i) => `getup:${Number(low[1]) - i - 1}`), 'fall:6'] }
      else if (prev.frame === 'fall:6') out.lowCollapse = { frames: ['fall:6'] }
    }
    if (enteringFall && prev.z > 0) {
      out.fallLift = { height: prev.z, sinceStateTick: 0 }
      if (prev.state === 'jump' || prev.state === 'jumpattack') out.airborneFall = { frame: prev.frame, sinceStateTick: 0 }
    }
    if (grounded && out.transition) {
      const elapsed = clock - out.transition.since
      if (elapsed < (art.clips[out.transition.action]?.duration ?? 0)) out.frame = sampleClip(art, out.transition.action, elapsed)
      else out.transition = undefined
    } else if (entity.state !== 'idle' && entity.state !== 'walk') out.transition = undefined
    if (entity.state === 'dying' && out.alreadyDown) {
      // The down drawing is the fall clip's last exposure (guanyu fall:6,
      // soldier fall-thrown:3) - never a hard-coded frame name.
      const fallClip = art.clips.fall
      out.frame = fallClip?.keys[fallClip.keys.length - 1]?.frame ?? out.frame
    }
  }
  if (out.airborneFall && (entity.state === 'knockdown' || entity.state === 'dying')) {
    const age = Math.max(0, entity.stateTick - out.airborneFall.sinceStateTick)
    // Keep the actual airborne silhouette for the impact beat, then continue
    // at the tipping drawings: never insert a straight-legged standing recoil.
    out.frame = age < 2 ? out.airborneFall.frame : sampleClip(art, 'fall', age + 3)
  } else out.airborneFall = undefined
  if (out.lowCollapse && (entity.state === 'knockdown' || entity.state === 'dying')) {
    const index = Math.min(out.lowCollapse.frames.length - 1, Math.floor(Math.max(0, entity.stateTick) / 2))
    out.frame = out.lowCollapse.frames[index]!
  } else out.lowCollapse = undefined
  let lift = 0
  if (out.fallLift && (entity.state === 'knockdown' || entity.state === 'dying')) {
    const age = entity.stateTick - out.fallLift.sinceStateTick
    if (age < 10) lift = out.fallLift.height * (1 - Math.max(0, age) / 10)
    else out.fallLift = undefined
  } else out.fallLift = undefined
  if (entity.state !== 'dying') out.alreadyDown = undefined
  return { frame: out.frame, lift, playback: out }
}
