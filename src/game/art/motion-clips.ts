import { attackById } from '../../core/attacks'
import { DYING_TICKS, GETUP_TICKS, JUMP_DURATION, KNOCKDOWN_TICKS, PLAYER_HITSTUN_TICKS } from '../../core/constants'
import type { EntityState } from '../../core/types'
/** Device-px rect of one frame's cell within its sheet. Extracted from
 * `whole-frames.ts` `WholeFrameCell` (B4) so motion clips no longer depend
 * on the whole-frame pilot module. */
export interface MotionCellRect {
  x: number
  y: number
  w: number
  h: number
}

export const MOTION_ACTIONS = ['walk', 'jab1', 'jab2', 'finisher'] as const
export const ACTION_SHEETS = ['jump', 'fall', 'getup', 'misc', 'special'] as const
export type MotionAction = (typeof MOTION_ACTIONS)[number]
export type ActionClip = 'jump' | 'jumpattack' | 'landing' | 'kicklanding' | 'hurt' | 'fall' | 'getup' | 'special' | 'grab' | 'release'
export interface MotionClip {
  loop: boolean
  /** Inclusive simulation tick at which a drawing starts. */
  keys: Array<{ tick: number; frame: string }>
  duration: number
}
export interface MotionFrameCell extends MotionCellRect {
  sheet?: 'actions'
  /** CMR-03 repack: trimmed content rect inside the full cell; the display
   *  restores it at (trimX, trimY) inside a srcW x srcH canvas so every
   *  displayed RGBA/registration is unchanged. Untrimmed cells omit these. */
  trimX?: number
  trimY?: number
  srcW?: number
  srcH?: number
}
export interface MotionArt {
  id: string
  revision: string
  density: number
  sheet: CanvasImageSource
  actionSheet: CanvasImageSource
  box: { width: number; height: number; groundY: number }
  frames: Record<string, MotionFrameCell>
  clips: Record<string, MotionClip>
  /** Exact attack-id -> clip-name bindings (hero packs derive their own). */
  attackBindings?: Record<string, string>
  /** Per-kind state dispatch (soldier frame names differ from the hero set). */
  frameDispatch?: (art: MotionArt, entity: MotionEntity) => string
  /**
   * Per-kind low-collapse tail (thrown/getup-interrupt continuity). Default
   * is Guan Yu's ['fall:5', 'fall:6']; packs whose inventory lacks those
   * frames MUST set their own impact-then-down pair, or the collapse shows
   * missing frames (a blocking frame error) instead of settling.
   */
  collapseTail?: [string, string]
}
const IDLE = 'walk:0'
const DOWN = 'fall:6'
const clip = (duration: number, pairs: Array<[number, string]>, loop = false): MotionClip => ({ duration, loop, keys: pairs.map(([tick, frame]) => ({ tick, frame })) })

/** Frame exposures, never a render-callback queue. Original regular motion unchanged. */
export function guanyuClips(): MotionArt['clips'] {
  const clips = {
    idle: clip(1, [[0, IDLE]], true),
    walk: { loop: true, duration: 32, keys: Array.from({ length: 8 }, (_, i) => ({ tick: i * 4, frame: `walk:${i + 1}` })) },
    jump: clip(JUMP_DURATION, [[0, IDLE], [1, 'jump:1'], [4, 'jump:2'], [9, 'jump:3'], [22, 'jump:5'], [28, 'jump:6'], [33, 'jump:6']]),
    jumpattack: clip(24, [[0, 'jump:3'], [4, 'jump:4'], [24 - 1, 'jump:4']]),
    landing: clip(8, [[0, 'jump:7'], [3, 'jump:1'], [6, IDLE]]),
    kicklanding: clip(9, [[0, 'jump:5'], [1, 'jump:7'], [4, 'jump:1'], [7, IDLE]]),
    hurt: clip(PLAYER_HITSTUN_TICKS, [[0, 'misc:1'], [3, 'misc:2'], [10, 'misc:3'], [17, IDLE]]),
    fall: clip(KNOCKDOWN_TICKS, [[0, 'fall:1'], [2, 'fall:2'], [4, 'fall:3'], [7, 'fall:4'], [10, 'fall:5'], [13, DOWN]]),
    getup: clip(GETUP_TICKS, [[0, DOWN], [2, 'getup:1'], [5, 'getup:2'], [8, 'getup:3'], [11, 'getup:4'], [14, 'getup:5'], [17, 'getup:6'], [20, 'getup:7'], [23, IDLE]]),
    grab: clip(8, [[0, 'misc:5'], [4, 'misc:6']]),
    release: clip(6, [[0, 'misc:7'], [4, IDLE]]),
  } as MotionArt['clips']
  for (const action of ['jab1', 'jab2', 'finisher', 'special'] as const) {
    const a = attackById(`gy.${action}`)
    const endActive = a.startup + a.active, duration = endActive + a.recover
    if (action === 'special') {
      // Existing forward poses avoid the painted backward-blade windup and
      // bridge the down-cut recovery without new character-design drift.
      clips[action] = clip(duration, [[0, IDLE], [1, 'special:7'], [3, 'special:2'], [4, 'special:3'],
        [a.startup, 'special:4'], [endActive, 'special:5'], [endActive + 2, 'special:3'],
        [endActive + 4, 'special:6'], [endActive + 7, 'special:7'], [duration - 3, IDLE]])
    } else {
      const drawings = action
      clips[action] = clip(duration, [
        [0, IDLE], [Math.max(1, Math.floor(a.startup * 0.25)), `${drawings}:1`],
        [Math.floor(a.startup * 0.5), `${drawings}:2`], [a.startup - 2, `${drawings}:3`],
        [a.startup, `${drawings}:4`], [endActive, `${drawings}:5`],
        [endActive + Math.floor(a.recover * 0.25), `${drawings}:6`],
        [endActive + Math.floor(a.recover * 0.55), `${drawings}:7`], [duration - 3, IDLE],
      ])
    }
  }
  return clips
}

export interface MotionPackGeometry extends Omit<MotionArt, 'sheet' | 'actionSheet' | 'clips'> {
  sheet: { width: number; height: number }
  actionSheet: { width: number; height: number }
  /** Documented per-pack decoded-cap owner exception (bytes); default is the contract cap. */
  decodedCapBytes?: number
}
/** All normal AND unusual Guan Yu states must have a complete pack. */
export function validMotionPack(meta: MotionPackGeometry): boolean {
  if (meta.id !== 'guanyu' || !Number.isFinite(meta.density) || meta.density <= 0) return false
  const { width, height, groundY } = meta.box
  if (![width, height, groundY, meta.sheet.width, meta.sheet.height, meta.actionSheet.width, meta.actionSheet.height].every(Number.isFinite)) return false
  if (width <= 0 || height <= 0 || groundY <= 0 || groundY >= height) return false
  for (const [groups, image, sheet] of [[MOTION_ACTIONS, meta.sheet, undefined], [ACTION_SHEETS, meta.actionSheet, 'actions']] as const) {
    const cells: MotionCellRect[] = []
    for (const action of groups) for (let i = 0; i < 9; i += 1) {
      const c = meta.frames[`${action}:${i}`]
      if (!c || c.sheet !== sheet || ![c.x, c.y, c.w, c.h].every(Number.isFinite)) return false
      if (c.x < 0 || c.y < 0 || c.w <= 0 || c.h <= 0) return false
      // The FULL cell (srcW/srcH when trimmed) must match the art box; the
      // trimmed rect only needs to sit inside the page without overlapping.
      const sw = c.srcW ?? c.w
      const sh = c.srcH ?? c.h
      if (sw !== width * meta.density || sh !== height * meta.density) return false
      if (c.x + c.w > image.width || c.y + c.h > image.height) return false
      if ((c.trimX ?? 0) < 0 || (c.trimY ?? 0) < 0 || (c.trimX ?? 0) + c.w > sw || (c.trimY ?? 0) + c.h > sh) return false
      if (cells.some((b) => c.x < b.x + b.w && c.x + c.w > b.x && c.y < b.y + b.h && c.y + c.h > b.y)) return false
      cells.push(c)
    }
  }
  return true
}
export interface MotionEntity {
  state: EntityState
  stateTick: number
  attackId: string | null
  airTicks?: number
  z?: number
  /** AI think countdown (enemy shooters phase their firing cycle off it). */
  thinkTick?: number
}
export function sampleClip(art: MotionArt, action: string, tick: number): string {
  const c = art.clips[action] ?? art.clips.idle
  const first = c?.keys[0]?.frame ?? ''
  if (!c) return first
  const t0 = Math.max(0, Math.floor(tick)), t = c.loop ? t0 % c.duration : Math.min(t0, c.duration - 1)
  let frame = first
  for (const key of c.keys) { if (key.tick > t) break; frame = key.frame }
  return frame
}
export function motionFrameForEntity(art: MotionArt, entity: MotionEntity): string {
  if (art.frameDispatch) return art.frameDispatch(art, entity)
  const t = entity.stateTick
  switch (entity.state) {
    case 'idle': return IDLE
    case 'walk': case 'fleeing': return sampleClip(art, 'walk', t)
    case 'attack': {
      const id = entity.attackId
      const action = (id ? art.attackBindings?.[id] : undefined) ?? id?.slice(3)
      if (action && art.clips[action]) return sampleClip(art, action, t)
      return IDLE // Defensive unknown attack remains new art, not broken rig.
    }
    case 'jump': return sampleClip(art, 'jump', entity.airTicks ?? t)
    case 'jumpattack': {
      const a = attackById('gy.jumpkick'), air = entity.airTicks ?? t
      // Pressing attack does not restart the jump; follow the airborne pose
      // during startup, especially when input arrives on descent.
      if (t < a.startup) return sampleClip(art, 'jump', air)
      if (t < a.startup + a.active) return 'jump:4' // visible strike must match every airborne active tick
      return air < JUMP_DURATION - 1 ? 'jump:5' : 'jump:6'
    }
    case 'special': return sampleClip(art, 'special', t)
    case 'hitstun': return sampleClip(art, 'hurt', t)
    case 'knockdown': return sampleClip(art, 'fall', t)
    case 'getup': return sampleClip(art, 'getup', t)
    case 'grab': return sampleClip(art, 'grab', t)
    case 'grabbed': return 'misc:2'
    case 'thrown': return t < 4 ? 'fall:3' : 'fall:4'
    case 'dying': return sampleClip(art, 'fall', Math.min(t, DYING_TICKS))
    case 'dead': return DOWN
  }
}
