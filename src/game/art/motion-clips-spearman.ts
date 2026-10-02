import { attackById } from '../../core/attacks'
import { DYING_TICKS, GETUP_TICKS, KNOCKDOWN_TICKS } from '../../core/constants'
import { ENEMIES } from '../../core/enemies'
import type { MotionArt, MotionClip, MotionEntity } from './motion-clips'
import { sampleClip } from './motion-clips'

/**
 * Wei Spearman motion clips (CMR-07B). Frame names are the prepared pack's
 * `sequence:position` names: locomotion (idle, walk cycle, stop, retreat,
 * guard bookend), thrust (the 20/5/26 spear attack, both hands spaced on
 * the shaft), hitstun-held (14-tick hitstun, upright held, escape),
 * fall-thrown (topple, tumble, impacts, down), getup-death (rise, dying,
 * dead). Timings come from core data at call time - never invented here.
 */
export const SPEARMAN_FRAMES = [
  'locomotion', 'thrust', 'hitstun-held', 'fall-thrown', 'getup-death',
] as const

const IDLE = 'locomotion:0'
const DOWN = 'fall-thrown:3'
const clip = (duration: number, pairs: Array<[number, string]>, loop = false): MotionClip => ({
  duration,
  loop,
  keys: pairs.map(([tick, frame]) => ({ tick, frame })),
})

export function spearmanClips(): MotionArt['clips'] {
  const def = ENEMIES.spearman
  if (!def) throw new Error('unknown enemy kind: spearman')
  const a = attackById('spear.thrust')
  const endActive = a.startup + a.active
  const duration = endActive + a.recover
  return {
    idle: clip(1, [[0, IDLE]], true),
    // Approach cycle: the four genuinely distinct walk drawings.
    walk: { loop: true, duration: 16, keys: [1, 2, 3, 4].map((i) => ({ tick: (i - 1) * 4, frame: `locomotion:${i}` })) },
    // Retreating (fleeing) uses the two retreat drawings.
    flee: { loop: true, duration: 8, keys: [6, 7].map((i) => ({ tick: (i - 6) * 4, frame: `locomotion:${i}` })) },
    hurt: clip(def.hitstunTicks, [[0, 'hitstun-held:1'], [5, 'hitstun-held:2'], [9, 'hitstun-held:3'], [Math.max(10, def.hitstunTicks - 1), IDLE]]),
    fall: clip(KNOCKDOWN_TICKS, [[0, 'fall-thrown:0'], [4, 'fall-thrown:1'], [8, 'fall-thrown:2'], [12, DOWN]]),
    getup: clip(GETUP_TICKS, [[0, DOWN], [6, 'getup-death:0'], [12, 'getup-death:1'], [18, 'getup-death:2'], [GETUP_TICKS - 1, IDLE]]),
    // The bound attack's exact startup/active/recovery window.
    thrust: clip(duration, [
      [0, IDLE], [1, 'thrust:1'], [Math.max(2, Math.floor(a.startup * 0.5)), 'thrust:2'],
      [a.startup, 'thrust:3'], [Math.max(a.startup + 1, endActive - 1), 'thrust:4'],
      [endActive, 'thrust:5'], [endActive + Math.floor(a.recover * 0.35), 'thrust:6'],
      [endActive + Math.floor(a.recover * 0.7), 'thrust:7'], [duration - 1, IDLE],
    ]),
  } as MotionArt['clips']
}

/** Attack-id -> clip bindings (MotionArt.attackBindings). */
export const SPEARMAN_ATTACK_BINDINGS: Record<string, string> = { 'spear.thrust': 'thrust' }

/**
 * State dispatch for the spearman. Unreachable hero states (jump/special/
 * mounted) never occur for this kind; the defensive default stays on new
 * art (guard), never the legacy rig.
 */
export function motionFrameForSpearman(art: MotionArt, entity: MotionEntity): string {
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

/** Pack validation for the spearman's 5x9 layout (validMotionPack parity). */
export interface SpearmanPackGeometry {
  id: string
  density: number
  box: { width: number; height: number; groundY: number }
  sheet: { width: number; height: number }
  actionSheet: { width: number; height: number }
  frames: Record<string, { x: number; y: number; w: number; h: number; trimX?: number; trimY?: number; srcW?: number; srcH?: number; sheet?: string }>
}

export function validSpearmanPack(meta: SpearmanPackGeometry): boolean {
  if (meta.id !== 'spearman' || !Number.isFinite(meta.density) || meta.density <= 0) return false
  const { width, height, groundY } = meta.box
  if (![width, height, groundY, meta.sheet.width, meta.sheet.height].every(Number.isFinite)) return false
  if (width <= 0 || height <= 0 || groundY <= 0 || groundY >= height) return false
  const rects: Array<{ x: number; y: number; w: number; h: number }> = []
  for (const group of SPEARMAN_FRAMES) {
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
