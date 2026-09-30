import { attackById } from '../../core/attacks'
import { DYING_TICKS, GETUP_TICKS, JUMP_DURATION, KNOCKDOWN_TICKS, PLAYER_HITSTUN_TICKS } from '../../core/constants'
import type { EntityState } from '../../core/types'
import type { WholeFrameCell } from './whole-frames'

export const MOTION_ACTIONS = ['walk', 'jab1', 'jab2', 'finisher'] as const
export const ACTION_SHEETS = ['jump', 'fall', 'getup', 'misc', 'special', 'rider'] as const
export type MotionAction = (typeof MOTION_ACTIONS)[number]
export type ActionClip = 'jump' | 'jumpattack' | 'landing' | 'hurt' | 'fall' | 'getup' | 'special' | 'grab' | 'release' | 'mounted' | 'mountedwalk' | 'mountedsweep' | 'dismount'
export interface MotionClip {
  loop: boolean
  /** Inclusive simulation tick at which a drawing starts. */
  keys: Array<{ tick: number; frame: string }>
  duration: number
}
export interface MotionArt {
  id: string
  revision: string
  density: number
  sheet: CanvasImageSource
  actionSheet: CanvasImageSource
  box: { width: number; height: number; groundY: number }
  frames: Record<string, WholeFrameCell & { sheet?: 'actions' }>
  clips: Record<MotionAction | ActionClip | 'idle', MotionClip>
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
    hurt: clip(PLAYER_HITSTUN_TICKS, [[0, 'misc:1'], [3, 'misc:2'], [10, 'misc:3'], [17, IDLE]]),
    fall: clip(KNOCKDOWN_TICKS, [[0, 'fall:1'], [2, 'fall:2'], [4, 'fall:3'], [7, 'fall:4'], [10, 'fall:5'], [13, DOWN]]),
    getup: clip(GETUP_TICKS, [[0, DOWN], [2, 'getup:1'], [5, 'getup:2'], [8, 'getup:3'], [11, 'getup:4'], [14, 'getup:5'], [17, 'getup:6'], [20, 'getup:7'], [23, IDLE]]),
    grab: clip(8, [[0, 'misc:5'], [4, 'misc:6']]),
    release: clip(6, [[0, 'misc:7'], [4, IDLE]]),
    mounted: clip(1, [[0, 'rider:0']], true),
    mountedwalk: clip(24, [[0, 'rider:0'], [6, 'rider:1'], [12, 'rider:2'], [18, 'rider:1']], true),
    dismount: clip(8, [[0, 'rider:7'], [4, 'jump:1'], [7, IDLE]]),
  } as MotionArt['clips']
  for (const action of ['jab1', 'jab2', 'finisher', 'special', 'mountedsweep'] as const) {
    const a = attackById(action === 'mountedsweep' ? 'mounted.sweep' : `gy.${action}`)
    const endActive = a.startup + a.active, duration = endActive + a.recover
    if (action === 'mountedsweep') {
      clips[action] = clip(duration, [[0, 'rider:0'], [2, 'rider:3'], [a.startup, 'rider:4'], [endActive, 'rider:5'], [duration - 4, 'rider:6']])
    } else {
      clips[action] = clip(duration, [
        [0, IDLE], [Math.max(1, Math.floor(a.startup * 0.25)), `${action}:1`],
        [Math.floor(a.startup * 0.5), `${action}:2`], [a.startup - 2, `${action}:3`],
        [a.startup, `${action}:4`], [endActive, `${action}:5`],
        [endActive + Math.floor(a.recover * 0.25), `${action}:6`],
        [endActive + Math.floor(a.recover * 0.55), `${action}:7`], [duration - 3, IDLE],
      ])
    }
  }
  return clips
}

export interface MotionPackGeometry extends Omit<MotionArt, 'sheet' | 'actionSheet' | 'clips'> {
  sheet: { width: number; height: number }
  actionSheet: { width: number; height: number }
}
/** All normal AND unusual Guan Yu states must have a complete pack. */
export function validMotionPack(meta: MotionPackGeometry): boolean {
  if (meta.id !== 'guanyu' || !Number.isFinite(meta.density) || meta.density <= 0) return false
  const { width, height, groundY } = meta.box
  if (![width, height, groundY, meta.sheet.width, meta.sheet.height, meta.actionSheet.width, meta.actionSheet.height].every(Number.isFinite)) return false
  if (width <= 0 || height <= 0 || groundY <= 0 || groundY >= height) return false
  for (const [groups, image, sheet] of [[MOTION_ACTIONS, meta.sheet, undefined], [ACTION_SHEETS, meta.actionSheet, 'actions']] as const) {
    const cells: WholeFrameCell[] = []
    for (const action of groups) for (let i = 0; i < 9; i++) {
      const c = meta.frames[`${action}:${i}`]
      if (!c || c.sheet !== sheet || ![c.x, c.y, c.w, c.h].every(Number.isFinite)) return false
      if (c.x < 0 || c.y < 0 || c.w !== width * meta.density || c.h !== height * meta.density) return false
      if (c.x + c.w > image.width || c.y + c.h > image.height) return false
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
  mountedOn: number | null
  airTicks?: number
  z?: number
}
export function sampleClip(art: MotionArt, action: keyof MotionArt['clips'], tick: number): string {
  const c = art.clips[action]
  const t0 = Math.max(0, Math.floor(tick)), t = c.loop ? t0 % c.duration : Math.min(t0, c.duration - 1)
  let frame = c.keys[0]!.frame
  for (const key of c.keys) { if (key.tick > t) break; frame = key.frame }
  return frame
}
export function motionFrameForEntity(art: MotionArt, entity: MotionEntity): string {
  const t = entity.stateTick
  if (entity.mountedOn !== null) {
    if (entity.state === 'attack') return sampleClip(art, 'mountedsweep', t)
    return sampleClip(art, entity.state === 'walk' ? 'mountedwalk' : 'mounted', t)
  }
  switch (entity.state) {
    case 'idle': return IDLE
    case 'walk': case 'fleeing': return sampleClip(art, 'walk', t)
    case 'attack': {
      const id = entity.attackId
      if (id === 'mounted.sweep') return sampleClip(art, 'jab1', t) // dismount mid-swing
      const action = id?.slice(3)
      if (action === 'jab1' || action === 'jab2' || action === 'finisher') return sampleClip(art, action, t)
      return IDLE // Defensive unknown attack remains new art, not broken rig.
    }
    case 'jump': return sampleClip(art, 'jump', entity.airTicks ?? t)
    case 'jumpattack': {
      const a = attackById('gy.jumpkick'), air = entity.airTicks ?? t
      if (t < a.startup) return 'jump:3'
      if (t < a.startup + a.active && air < JUMP_DURATION - 5) return 'jump:4'
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
