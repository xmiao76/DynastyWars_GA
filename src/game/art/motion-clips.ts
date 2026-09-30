import { attackById } from '../../core/attacks'
import type { EntityState } from '../../core/types'
import type { WholeFrameCell } from './whole-frames'

/** Guan Yu motion experiment. Whole-character drawings, never rig blends. */
export const MOTION_ACTIONS = ['walk', 'jab1', 'jab2', 'finisher'] as const
export type MotionAction = (typeof MOTION_ACTIONS)[number]
export interface MotionClip {
  loop: boolean
  /** Inclusive tick at which a drawing starts; first is always zero. */
  keys: Array<{ tick: number; frame: string }>
  duration: number
}
export interface MotionArt {
  id: string
  revision: string
  density: number
  sheet: CanvasImageSource
  box: { width: number; height: number; groundY: number }
  frames: Record<string, WholeFrameCell>
  clips: Record<MotionAction | 'idle', MotionClip>
}

/** Explicit exposures keep the first active drawing on the actual hit tick. */
export function guanyuClips(): MotionArt['clips'] {
  const idleFrame = 'walk:0'
  const clips = {
    idle: { loop: true, duration: 1, keys: [{ tick: 0, frame: idleFrame }] },
    walk: { loop: true, duration: 32, keys: Array.from({ length: 8 }, (_, i) => ({ tick: i * 4, frame: `walk:${i + 1}` })) },
  } as MotionArt['clips']
  for (const action of ['jab1', 'jab2', 'finisher'] as const) {
    const a = attackById(`gy.${action}`)
    const endActive = a.startup + a.active
    const duration = endActive + a.recover
    const keys = [
      { tick: 0, frame: idleFrame },
      { tick: Math.max(1, Math.floor(a.startup * 0.25)), frame: `${action}:1` },
      { tick: Math.floor(a.startup * 0.5), frame: `${action}:2` },
      { tick: a.startup - 2, frame: `${action}:3` },
      { tick: a.startup, frame: `${action}:4` },
      { tick: endActive, frame: `${action}:5` },
      { tick: endActive + Math.floor(a.recover * 0.25), frame: `${action}:6` },
      { tick: endActive + Math.floor(a.recover * 0.55), frame: `${action}:7` },
      { tick: duration - 3, frame: idleFrame },
    ]
    clips[action] = { loop: false, duration, keys }
  }
  return clips
}

/** Reject incomplete/malformed candidate packs as a whole before publishing. */
export function validMotionPack(meta: Omit<MotionArt, 'sheet' | 'clips'> & { sheet: { width: number; height: number } }): boolean {
  if (meta.id !== 'guanyu' || !Number.isFinite(meta.density) || meta.density <= 0) return false
  const { width, height, groundY } = meta.box
  if (![width, height, groundY, meta.sheet.width, meta.sheet.height].every(Number.isFinite)) return false
  if (width <= 0 || height <= 0 || groundY <= 0 || groundY >= height) return false
  const cells: WholeFrameCell[] = []
  for (const action of MOTION_ACTIONS) for (let i = 0; i < 9; i++) {
    const c = meta.frames[`${action}:${i}`]
    if (!c || ![c.x, c.y, c.w, c.h].every(Number.isFinite)) return false
    if (c.x < 0 || c.y < 0 || c.w !== width * meta.density || c.h !== height * meta.density) return false
    if (c.x + c.w > meta.sheet.width || c.y + c.h > meta.sheet.height) return false
    if (cells.some((b) => c.x < b.x + b.w && c.x + c.w > b.x && c.y < b.y + b.h && c.y + c.h > b.y)) return false
    cells.push(c)
  }
  return true
}

export function motionFrameForEntity(art: MotionArt, entity: {
  state: EntityState; stateTick: number; attackId: string | null; mountedOn: number | null
}): string | undefined {
  if (entity.mountedOn !== null) return undefined
  let action: MotionAction | 'idle'
  if (entity.state === 'idle') action = 'idle'
  else if (entity.state === 'walk') action = 'walk'
  else if (entity.state === 'attack' && ['gy.jab1', 'gy.jab2', 'gy.finisher'].includes(entity.attackId ?? '')) {
    action = entity.attackId!.slice(3) as MotionAction
  } else return undefined // Jump/hurt/special etc are outside this bounded test.
  const clip = art.clips[action]
  const t0 = Math.max(0, Math.floor(entity.stateTick))
  const t = clip.loop ? t0 % clip.duration : Math.min(t0, clip.duration - 1)
  let frame = clip.keys[0]!.frame
  for (const key of clip.keys) { if (key.tick > t) break; frame = key.frame }
  return frame
}
