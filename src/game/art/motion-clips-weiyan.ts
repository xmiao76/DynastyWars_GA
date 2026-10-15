/**
 * CMR-11B: Wei Yan motion clips, state dispatch and pack validation.
 *
 * The hero clip table follows the Guan Yu structure (durations derived from
 * core `wy.*` windows and clocks at construction), but every exposure uses
 * Wei Yan's own compact frame names: walk:0-8 (guard + 8-cycle),
 * jab1/jab2/finisher:0-4 (strike poses), jump:0-5
 * (takeoff/ascent/apex/kick/descent/landing), fall:0-4 (topple through
 * DOWN), getup:0-4 (elbow through stand), misc:0-4
 * (hurt-recoil/hurt-fold/grab-clamp/grab-hold/release), special:0-4
 * (raise/coil/pre-spin/strike/follow).
 *
 * Bookends hold by clip convention (no alias records in the culled layout):
 * every guard point IS walk:0 and every down point IS fall:4 - the same
 * pattern as Guan Yu's clips.
 *
 * The shared motion-player lowCollapse/getup-interrupt paths use this
 * pack's collapseTail (below) plus its getup:N walkback, so a Wei Yan
 * dying mid-throw settles on pack frames; sole-motion has no substitute art.
 */
import { attackById } from '../../core/attacks'
import { DYING_TICKS, GETUP_TICKS, JUMP_DURATION, KNOCKDOWN_TICKS, PLAYER_HITSTUN_TICKS } from '../../core/constants'
import { sampleClip, type MotionArt, type MotionClip, type MotionEntity, type MotionFrameCell, type MotionPackGeometry } from './motion-clips'

const IDLE = 'walk:0'
const DOWN = 'fall:4'
const clip = (duration: number, pairs: Array<[number, string]>, loop = false): MotionClip => ({ duration, loop, keys: pairs.map(([tick, frame]) => ({ tick, frame })) })

/** Attack-id -> clip bindings (mirrors heroProfile('weiyan'); also emitted into the prepared record). */
export const WEIYAN_ATTACK_BINDINGS: Record<string, string> = {
  'wy.jab1': 'jab1',
  'wy.jab2': 'jab2',
  'wy.finisher': 'finisher',
  'wy.special': 'special',
}

/**
 * Low-collapse tail (thrown/getup-interrupt continuity): impact then DOWN.
 * Without it the shared player emits guanyu 'fall:5/6' literals that do not
 * exist in this pack (a blocking frame error instead of settling).
 */
export const WEIYAN_COLLAPSE_TAIL: [string, string] = ['fall:3', 'fall:4']

/** Frame exposures for the hero states; durations derive from core data. */
export function weiyanClips(): MotionArt['clips'] {
  const clips = {
    idle: clip(1, [[0, IDLE]], true),
    walk: { loop: true, duration: 32, keys: Array.from({ length: 8 }, (_, i) => ({ tick: i * 4, frame: `walk:${i + 1}` })) },
    jump: clip(JUMP_DURATION, [[0, IDLE], [1, 'jump:0'], [4, 'jump:1'], [9, 'jump:2'], [22, 'jump:4'], [28, 'jump:5'], [33, 'jump:5']]),
    jumpattack: clip(24, [[0, 'jump:2'], [4, 'jump:3'], [24 - 1, 'jump:3']]),
    landing: clip(8, [[0, 'jump:5'], [3, 'jump:0'], [6, IDLE]]),
    kicklanding: clip(9, [[0, 'jump:4'], [1, 'jump:5'], [4, 'jump:0'], [7, IDLE]]),
    hurt: clip(PLAYER_HITSTUN_TICKS, [[0, 'misc:0'], [10, 'misc:1'], [17, IDLE]]),
    fall: clip(KNOCKDOWN_TICKS, [[0, 'fall:0'], [3, 'fall:1'], [7, 'fall:2'], [11, 'fall:3'], [15, 'fall:4']]),
    getup: clip(GETUP_TICKS, [[0, DOWN], [2, 'getup:0'], [6, 'getup:1'], [10, 'getup:2'], [14, 'getup:3'], [18, 'getup:4'], [22, IDLE]]),
    grab: clip(8, [[0, 'misc:2'], [4, 'misc:3']]),
    release: clip(6, [[0, 'misc:4'], [4, IDLE]]),
  } as MotionArt['clips']
  for (const action of [
    'jab1', 'jab2', 'finisher', 'special',
  ] as const) {
    if (action === 'special') {
      const a = attackById('wy.special')
      const endActive = a.startup + a.active, duration = endActive + a.recover
      clips[action] = clip(duration, [[0, IDLE], [1, 'special:0'], [3, 'special:1'], [4, 'special:2'],
        [a.startup, 'special:3'], [endActive, 'special:4'], [duration - 3, IDLE]])
    } else {
      const a = attackById(`wy.${action}`)
      const endActive = a.startup + a.active, duration = endActive + a.recover
      const drawings = action
      clips[action] = clip(duration, [
        [0, IDLE], [Math.max(1, Math.floor(a.startup * 0.25)), `${drawings}:0`],
        [Math.floor(a.startup * 0.5), `${drawings}:1`], [a.startup, `${drawings}:2`],
        [endActive, `${drawings}:3`], [endActive + Math.floor(a.recover * 0.5), `${drawings}:4`],
        [duration - 3, IDLE],
      ])
    }
  }
  return clips
}

/** Hero state dispatch over Wei Yan's frame inventory (mirrors the generic hero branches). */
export function motionFrameForWeiyan(art: MotionArt, entity: MotionEntity): string {
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
      const a = attackById('wy.jumpkick'), air = entity.airTicks ?? t
      // Pressing attack does not restart the jump; follow the airborne pose
      // during startup, especially when input arrives on descent.
      if (t < a.startup) return sampleClip(art, 'jump', air)
      if (t < a.startup + a.active) return 'jump:3' // visible strike must match every airborne active tick
      return air < JUMP_DURATION - 1 ? 'jump:4' : 'jump:5'
    }
    case 'special': return sampleClip(art, 'special', t)
    case 'hitstun': return sampleClip(art, 'hurt', t)
    case 'knockdown': return sampleClip(art, 'fall', t)
    case 'getup': return sampleClip(art, 'getup', t)
    case 'grab': return sampleClip(art, 'grab', t)
    case 'grabbed': return 'misc:1' // the hurt fold doubles as the grabbed pose
    case 'thrown': return t < 4 ? 'fall:2' : 'fall:3'
    case 'dying': return sampleClip(art, 'fall', Math.min(t, DYING_TICKS))
    case 'dead': return DOWN
  }
}

/** Frame-name groups (prefixes before ':') the Wei Yan pack must provide, with compact position counts. */
export const WEIYAN_FRAMES: Record<string, number> = {
  walk: 9, jab1: 5, jab2: 5, finisher: 5, jump: 6, fall: 5, getup: 5, misc: 5, special: 5,
}

/** All Wei Yan states must have a complete pack across both atlas pages. */
export function validWeiyanPack(meta: MotionPackGeometry): boolean {
  if (meta.id !== 'weiyan' || !Number.isFinite(meta.density) || meta.density <= 0) return false
  const { width, height, groundY } = meta.box
  if (![width, height, groundY, meta.sheet.width, meta.sheet.height, meta.actionSheet.width, meta.actionSheet.height].every(Number.isFinite)) return false
  if (width <= 0 || height <= 0 || groundY <= 0 || groundY >= height) return false
  const cells: Record<string, MotionFrameCell[]> = { sheet: [], actions: [] }
  for (const [group, count] of Object.entries(WEIYAN_FRAMES)) {
    for (let i = 0; i < count; i += 1) {
      const c = meta.frames[`${group}:${i}`]
      if (!c || ![c.x, c.y, c.w, c.h].every(Number.isFinite)) return false
      if (c.sheet !== undefined && c.sheet !== 'actions') return false
      if (c.x < 0 || c.y < 0 || c.w <= 0 || c.h <= 0) return false
      // The FULL cell (srcW/srcH when trimmed) must match the art box; the
      // trimmed rect only needs to sit inside its page without overlapping.
      const sw = c.srcW ?? c.w
      const sh = c.srcH ?? c.h
      if (sw !== width * meta.density || sh !== height * meta.density) return false
      const image = c.sheet === 'actions' ? meta.actionSheet : meta.sheet
      if (c.x + c.w > image.width || c.y + c.h > image.height) return false
      if ((c.trimX ?? 0) < 0 || (c.trimY ?? 0) < 0 || (c.trimX ?? 0) + c.w > sw || (c.trimY ?? 0) + c.h > sh) return false
      // All 56 rects are unique drawings (the culled layout carries no
      // aliases), so any overlap within a page fails; pages differ, never overlap.
      const page = c.sheet === 'actions' ? 'actions' : 'sheet'
      if (cells[page]!.some((b) => c.x < b.x + b.w && c.x + c.w > b.x && c.y < b.y + b.h && c.y + c.h > b.y)) return false
      cells[page]!.push(c)
    }
  }
  return true
}
