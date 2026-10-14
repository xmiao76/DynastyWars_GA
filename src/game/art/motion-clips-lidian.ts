/**
 * CMR-13B: Li Dian motion clips, state dispatch and pack validation.
 *
 * Boss clip table (durations derived from core windows and clocks at
 * construction) over the compact pack frame names: walk:0-8 (guard +
 * 8-cycle), charge:0-4 (crouch-coil/launch/dash/dash2/brake),
 * combo:0-4 (windup/rising-cut/follow-through/sweep/recover),
 * heavy:0-4 (raise/hold/chop/follow/recover), misc:0-4
 * (hurt-recoil/hurt-fold/held-clamp/held-struggle/release), fall:0-4
 * (topple/airborne/tumble/impact/DOWN), getup:0-4
 * (DOWN/elbow-prop/kneel/crouch/rise-stand).
 *
 * Two deliberate exposure choices: (1) sword.combo carries TWO strikes in
 * one 4-tick active window, so the rising-cut shows on active ticks 0-1
 * and the sweep on ticks 2-3 (both strikes visible, no invented frames);
 * the follow-through settles in early recover. (2) grabbed maps to the
 * literal held-clamp drawing (misc:2), matching the generic
 * motionFrameForEntity convention (Huang Zhong's fold doubling was a
 * hero-specific choice; the clamp IS the held pose here).
 *
 * Bookends hold by clip convention (no alias records in the culled layout):
 * every guard point IS walk:0 and every down point IS fall:4 - the same
 * pattern as Guan Yu's clips. The getup clip opens on fall:4; the pack's
 * own getup:0 DOWN drawing serves the collapse walkback below.
 *
 * Enrage needs no art path: faster think, same drawings (movement speed is
 * clock, not drawings - see the 13A authoring plan).
 */
import { attackById } from '../../core/attacks'
import { DYING_TICKS, GETUP_TICKS, KNOCKDOWN_TICKS } from '../../core/constants'
import { ENEMIES } from '../../core/enemies'
import { sampleClip, type MotionArt, type MotionClip, type MotionEntity, type MotionFrameCell, type MotionPackGeometry } from './motion-clips'

const IDLE = 'walk:0'
const DOWN = 'fall:4'
const clip = (duration: number, pairs: Array<[number, string]>, loop = false): MotionClip => ({ duration, loop, keys: pairs.map(([tick, frame]) => ({ tick, frame })) })

/** Attack-id -> clip bindings (also emitted into the prepared record). */
export const LIDIAN_ATTACK_BINDINGS: Record<string, string> = {
  'charge.dash': 'charge',
  'sword.combo': 'combo',
  'sword.heavy': 'heavy',
}

/**
 * Low-collapse tail (thrown/getup-interrupt continuity): impact then DOWN.
 * Without it the shared player emits guanyu 'fall:5/6' literals that do not
 * exist in this pack (legacy fallback instead of settling).
 */
export const LIDIAN_COLLAPSE_TAIL: [string, string] = ['fall:3', 'fall:4']

/** Frame exposures for the boss states; durations derive from core data. */
export function lidianClips(): MotionArt['clips'] {
  const def = ENEMIES.lidian
  if (!def) throw new Error('unknown enemy kind: lidian')
  const charge = attackById('charge.dash')
  const combo = attackById('sword.combo')
  const heavy = attackById('sword.heavy')
  const chargeEnd = charge.startup + charge.active
  const chargeDur = chargeEnd + charge.recover
  const comboEnd = combo.startup + combo.active
  const comboDur = comboEnd + combo.recover
  const heavyEnd = heavy.startup + heavy.active
  const heavyDur = heavyEnd + heavy.recover
  return {
    idle: clip(1, [[0, IDLE]], true),
    walk: { loop: true, duration: 32, keys: Array.from({ length: 8 }, (_, i) => ({ tick: i * 4, frame: `walk:${i + 1}` })) },
    // Dash: coil/launch over startup, both dash drawings across the long
    // active window, brake then guard over recover.
    charge: clip(chargeDur, [
      [0, IDLE], [3, 'charge:0'], [7, 'charge:1'], [charge.startup, 'charge:2'],
      [charge.startup + Math.floor(charge.active / 2), 'charge:3'],
      [chargeEnd, 'charge:4'], [chargeEnd + Math.floor(charge.recover / 2), IDLE],
    ]),
    // Combo: windup over startup, rising-cut then sweep across the 4-tick
    // active window, follow-through settling in early recover.
    combo: clip(comboDur, [
      [0, IDLE], [2, 'combo:0'], [combo.startup, 'combo:1'],
      [combo.startup + 2, 'combo:3'], [comboEnd, 'combo:2'],
      [comboEnd + Math.floor(combo.recover / 3), 'combo:4'],
      [comboDur - 3, IDLE],
    ]),
    // Heavy: raise/hold over startup, chop on every active tick, follow
    // then recover, guard at the tail.
    heavy: clip(heavyDur, [
      [0, IDLE], [4, 'heavy:0'], [10, 'heavy:1'], [heavy.startup, 'heavy:2'],
      [heavyEnd, 'heavy:3'], [heavyEnd + Math.floor(heavy.recover / 3), 'heavy:4'],
      [heavyDur - 3, IDLE],
    ]),
    hurt: clip(def.hitstunTicks, [[0, 'misc:0'], [4, 'misc:1'], [def.hitstunTicks - 1, IDLE]]),
    fall: clip(KNOCKDOWN_TICKS, [[0, 'fall:0'], [7, 'fall:1'], [14, 'fall:2'], [21, 'fall:3'], [28, DOWN]]),
    getup: clip(GETUP_TICKS, [[0, DOWN], [2, 'getup:0'], [5, 'getup:1'], [10, 'getup:2'], [14, 'getup:3'], [19, 'getup:4'], [GETUP_TICKS - 1, IDLE]]),
    grab: clip(8, [[0, 'misc:2'], [4, 'misc:3']]),
    release: clip(6, [[0, 'misc:4'], [4, IDLE]]),
  } as MotionArt['clips']
}

/** Boss state dispatch over Li Dian's frame inventory (enemy-shaped: no jump/special). */
export function motionFrameForLidian(art: MotionArt, entity: MotionEntity): string {
  const t = entity.stateTick
  switch (entity.state) {
    case 'idle': return IDLE
    case 'walk': case 'fleeing': return sampleClip(art, 'walk', t)
    case 'attack': {
      const bound = entity.attackId ? art.attackBindings?.[entity.attackId] : undefined
      return bound && art.clips[bound] ? sampleClip(art, bound, t) : IDLE
    }
    case 'hitstun': return sampleClip(art, 'hurt', t)
    case 'knockdown': return sampleClip(art, 'fall', t)
    case 'getup': return sampleClip(art, 'getup', t)
    case 'grab': return sampleClip(art, 'grab', t)
    case 'grabbed': return 'misc:2' // the held-clamp IS the grabbed pose
    case 'thrown': return t < 4 ? 'fall:2' : 'fall:3'
    case 'dying': return sampleClip(art, 'fall', Math.min(t, DYING_TICKS))
    case 'dead': return DOWN
  }
  // Unreachable hero states (jump/special) stay on new art.
  return IDLE
}

/** Frame-name groups (prefixes before ':') the Li Dian pack must provide, with compact position counts. */
export const LIDIAN_FRAMES: Record<string, number> = {
  walk: 9, charge: 5, combo: 5, heavy: 5, misc: 5, fall: 5, getup: 5,
}

/** All Li Dian states must have a complete pack on the single atlas page. */
export function validLidianPack(meta: MotionPackGeometry): boolean {
  if (meta.id !== 'lidian' || !Number.isFinite(meta.density) || meta.density <= 0) return false
  const { width, height, groundY } = meta.box
  if (![width, height, groundY, meta.sheet.width, meta.sheet.height, meta.actionSheet.width, meta.actionSheet.height].every(Number.isFinite)) return false
  if (width <= 0 || height <= 0 || groundY <= 0 || groundY >= height) return false
  const cells: Record<string, MotionFrameCell[]> = { sheet: [], actions: [] }
  for (const [group, count] of Object.entries(LIDIAN_FRAMES)) {
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
      // All 39 rects are unique drawings (the culled layout carries no
      // aliases), so any overlap within a page fails; pages differ, never overlap.
      const page = c.sheet === 'actions' ? 'actions' : 'sheet'
      if (cells[page]!.some((b) => c.x < b.x + b.w && c.x + c.w > b.x && c.y < b.y + b.h && c.y + c.h > b.y)) return false
      cells[page]!.push(c)
    }
  }
  return true
}
