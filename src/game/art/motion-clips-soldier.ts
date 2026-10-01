import { attackById } from '../../core/attacks'
import { DYING_TICKS, GETUP_TICKS, KNOCKDOWN_TICKS } from '../../core/constants'
import { ENEMIES } from '../../core/enemies'
import type { MotionArt, MotionClip, MotionEntity } from './motion-clips'
import { sampleClip } from './motion-clips'

/**
 * Wei Soldier motion clips (CMR-06B). Frame names are the prepared pack's
 * `sequence:position` names: locomotion (idle, walk cycle, stop, retreat,
 * guard bookend), swing (the 14/4/20 sword attack), hitstun-held (18-tick
 * hitstun, upright held, escape), fall-thrown (topple, tumble, impacts,
 * down), getup-death (rise, dying, dead). Timings come from core data at
 * call time - never invented here.
 */
export const SOLDIER_FRAMES = [
  'locomotion', 'swing', 'hitstun-held', 'fall-thrown', 'getup-death',
] as const

const IDLE = 'locomotion:0'
const DOWN = 'fall-thrown:3'
const clip = (duration: number, pairs: Array<[number, string]>, loop = false): MotionClip => ({
  duration,
  loop,
  keys: pairs.map(([tick, frame]) => ({ tick, frame })),
})

export function soldierClips(): MotionArt['clips'] {
  const def = ENEMIES.soldier
  if (!def) throw new Error('unknown enemy kind: soldier')
  const a = attackById('soldier.swing')
  const endActive = a.startup + a.active
  const duration = endActive + a.recover
  return {
    idle: clip(1, [[0, IDLE]], true),
    // Approach cycle: the four genuinely distinct walk drawings.
    walk: { loop: true, duration: 16, keys: [1, 2, 3, 4].map((i) => ({ tick: (i - 1) * 4, frame: `locomotion:${i}` })) },
    // Retreating (fleeing) uses the two retreat drawings.
    flee: { loop: true, duration: 8, keys: [6, 7].map((i) => ({ tick: (i - 6) * 4, frame: `locomotion:${i}` })) },
    hurt: clip(def.hitstunTicks, [[0, 'hitstun-held:1'], [6, 'hitstun-held:2'], [12, 'hitstun-held:3'], [Math.max(13, def.hitstunTicks - 1), IDLE]]),
    fall: clip(KNOCKDOWN_TICKS, [[0, 'fall-thrown:0'], [4, 'fall-thrown:1'], [8, 'fall-thrown:2'], [12, DOWN]]),
    getup: clip(GETUP_TICKS, [[0, DOWN], [6, 'getup-death:0'], [12, 'getup-death:1'], [18, 'getup-death:2'], [GETUP_TICKS - 1, IDLE]]),
    // The bound attack's exact startup/active/recovery window.
    swing: clip(duration, [
      [0, IDLE], [1, 'swing:1'], [Math.max(2, Math.floor(a.startup * 0.5)), 'swing:2'],
      [a.startup, 'swing:3'], [Math.max(a.startup + 1, endActive - 1), 'swing:4'],
      [endActive, 'swing:5'], [endActive + Math.floor(a.recover * 0.35), 'swing:6'],
      [endActive + Math.floor(a.recover * 0.7), 'swing:7'], [duration - 1, IDLE],
    ]),
  } as MotionArt['clips']
}

/** Attack-id -> clip bindings (MotionArt.attackBindings). */
export const SOLDIER_ATTACK_BINDINGS: Record<string, string> = { 'soldier.swing': 'swing' }

/**
 * State dispatch for the soldier. Unreachable hero states (jump/special/
 * mounted) never occur for this kind; the defensive default stays on new
 * art (guard), never the legacy rig.
 */
export function motionFrameForSoldier(art: MotionArt, entity: MotionEntity): string {
  const t = entity.stateTick
  switch (entity.state) {
    case 'idle': return IDLE
    case 'walk': return sampleClip(art, 'walk', t)
    case 'fleeing': return sampleClip(art, 'flee', t)
    case 'attack': {
      const bound = entity.attackId ? art.attackBindings?.[entity.attackId] : undefined
      return bound && art.clips[bound] ? sampleClip(art, bound, t) : IDLE
    }
    case 'hitstun': return sampleClip(art, 'hurt', t)
    case 'knockdown': return sampleClip(art, 'fall', t)
    case 'getup': return sampleClip(art, 'getup', t)
    case 'grab': return 'hitstun-held:4'
    case 'grabbed': return 'hitstun-held:5'
    case 'thrown': return t < 4 ? 'fall-thrown:4' : t < 10 ? 'fall-thrown:5' : t < 14 ? 'fall-thrown:6' : 'fall-thrown:7'
    case 'dying': return t < DYING_TICKS / 3 ? 'getup-death:4' : t < (DYING_TICKS * 2) / 3 ? 'getup-death:5' : 'getup-death:6'
    case 'dead': return 'getup-death:7'
  }
  // Unreachable hero states (jump/special/mounted) stay on new art.
  return IDLE
}

/** Pack validation for the soldier's 5x9 layout (validMotionPack parity). */
export interface SoldierPackGeometry {
  id: string
  density: number
  box: { width: number; height: number; groundY: number }
  sheet: { width: number; height: number }
  actionSheet: { width: number; height: number }
  frames: Record<string, { x: number; y: number; w: number; h: number; trimX?: number; trimY?: number; srcW?: number; srcH?: number; sheet?: string }>
}

export function validSoldierPack(meta: SoldierPackGeometry): boolean {
  if (meta.id !== 'soldier' || !Number.isFinite(meta.density) || meta.density <= 0) return false
  const { width, height, groundY } = meta.box
  if (![width, height, groundY, meta.sheet.width, meta.sheet.height].every(Number.isFinite)) return false
  if (width <= 0 || height <= 0 || groundY <= 0 || groundY >= height) return false
  const rects: Array<{ x: number; y: number; w: number; h: number }> = []
  for (const group of SOLDIER_FRAMES) {
    for (let i = 0; i < 9; i += 1) {
      const c = meta.frames[`${group}:${i}`]
      if (!c || ![c.x, c.y, c.w, c.h].every(Number.isFinite)) return false
      if (c.x < 0 || c.y < 0 || c.w <= 0 || c.h <= 0) return false
      const sw = c.srcW ?? c.w
      const sh = c.srcH ?? c.h
      if (sw !== width * meta.density || sh !== height * meta.density) return false
      if (c.x + c.w > meta.sheet.width || c.y + c.h > meta.sheet.height) return false
      if ((c.trimX ?? 0) < 0 || (c.trimY ?? 0) < 0 || (c.trimX ?? 0) + c.w > sw || (c.trimY ?? 0) + c.h > sh) return false
      // Aliased bookends share their target's atlas rect (byte-identical
      // drawings); anything else overlapping is a packing defect.
      const shared = (b: { x: number; y: number; w: number; h: number }) => b.x === c.x && b.y === c.y && b.w === c.w && b.h === c.h
      if (rects.some((b) => !shared(b) && c.x < b.x + b.w && c.x + c.w > b.x && c.y < b.y + b.h && c.y + c.h > b.y)) return false
      if (!rects.some(shared)) rects.push({ x: c.x, y: c.y, w: c.w, h: c.h })
    }
  }
  return true
}
