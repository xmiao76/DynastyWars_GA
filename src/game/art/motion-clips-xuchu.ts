/** CMR-15B: Xu Chu's complete single-page boss pack. No gameplay clocks change.
 *
 * Frame inventory (scripts/prepare-xuchu.mjs play order): walk:0-5
 * (guard/contact-A/passing-B/contact-B/passing-A/stop-settle),
 * charge:0-4 (guard/crouch-coil/launch/crushing-dash/brake),
 * combo:0-4 (windup/rising-cut/follow-through/sweep/recover),
 * heavy:0-4 (raise/overhead-hold/crushing-chop/follow-through/recover),
 * misc:0-4 (hurt-recoil/hurt-fold/held-clamp/held-struggle/release),
 * fall:0-4 (topple/airborne/tumble/impact/DOWN), getup:0-4
 * (DOWN/elbow/kneel/crouch/rise). Unlike Xiahou Dun, getup:0 is a DISTINCT
 * banked drawing - there is no atlas alias anywhere in this pack.
 *
 * The walk cycle stretches the five gait keys over the same 32-tick loop
 * the other bosses use (keys at round(i*32/5)); walk:5 (stop-settle) is
 * the closing key of that authoring cycle, so it plays as the last key.
 * Combo exposure follows the Li Dian/Xiahou convention: rising-cut on the
 * first active half, sweep on the second, follow-through in early recover.
 */
import { attackById } from '../../core/attacks'
import { DYING_TICKS, GETUP_TICKS, KNOCKDOWN_TICKS } from '../../core/constants'
import { ENEMIES } from '../../core/enemies'
import { sampleClip, type MotionArt, type MotionClip, type MotionEntity, type MotionPackGeometry } from './motion-clips'

const IDLE = 'walk:0'
const DOWN = 'fall:4'
const clip = (duration: number, pairs: Array<[number, string]>, loop = false): MotionClip => ({ duration, loop, keys: pairs.map(([tick, frame]) => ({ tick, frame })) })
export const XUCHU_ATTACK_BINDINGS: Record<string, string> = {
  'charge.crush': 'charge', 'sword.combo': 'combo', 'sword.heavy': 'heavy',
}
export const XUCHU_COLLAPSE_TAIL: [string, string] = ['fall:3', DOWN]
export const XUCHU_FRAMES: Record<string, number> = {
  walk: 6, charge: 5, combo: 5, heavy: 5, misc: 5, fall: 5, getup: 5,
}

/** Normal/enraged AI use the same poses; windows derive from actual boss data. */
export function xuchuClips(): MotionArt['clips'] {
  const def = ENEMIES.xuchu
  if (!def?.boss) throw new Error('missing xuchu boss definition')
  const charge = attackById(def.boss.charge)
  const combo = attackById(def.boss.combo)
  const heavy = attackById(def.boss.heavy)
  const chargeEnd = charge.startup + charge.active, chargeDur = chargeEnd + charge.recover
  const comboEnd = combo.startup + combo.active, comboDur = comboEnd + combo.recover
  const heavyEnd = heavy.startup + heavy.active, heavyDur = heavyEnd + heavy.recover
  return {
    idle: clip(1, [[0, IDLE]], true),
    walk: clip(32, Array.from({ length: 5 }, (_, i) => [Math.round(i * 32 / 5), `walk:${i + 1}`] as [number, string]), true),
    charge: clip(chargeDur, [
      [0, IDLE], [Math.floor(charge.startup / 3), 'charge:0'], [charge.startup - 1, 'charge:1'],
      [charge.startup, 'charge:2'], [charge.startup + Math.floor(charge.active / 2), 'charge:3'],
      [chargeEnd, 'charge:4'], [chargeEnd + Math.floor(charge.recover / 2), IDLE],
    ]),
    // Rising cut on the first two active ticks, sweep on the next two.
    combo: clip(comboDur, [
      [0, IDLE], [2, 'combo:0'], [combo.startup, 'combo:1'],
      [combo.startup + Math.floor(combo.active / 2), 'combo:3'], [comboEnd, 'combo:2'],
      [comboEnd + Math.floor(combo.recover / 3), 'combo:4'], [comboDur - 3, IDLE],
    ]),
    heavy: clip(heavyDur, [
      [0, IDLE], [Math.floor(heavy.startup / 4), 'heavy:0'], [Math.floor(heavy.startup * 5 / 8), 'heavy:1'],
      [heavy.startup, 'heavy:2'], [heavyEnd, 'heavy:3'],
      [heavyEnd + Math.floor(heavy.recover / 3), 'heavy:4'], [heavyDur - 3, IDLE],
    ]),
    hurt: clip(def.hitstunTicks, [[0, 'misc:0'], [4, 'misc:1'], [def.hitstunTicks - 1, IDLE]]),
    fall: clip(KNOCKDOWN_TICKS, [[0, 'fall:0'], [7, 'fall:1'], [14, 'fall:2'], [21, 'fall:3'], [28, DOWN]]),
    // getup:0 is its own DOWN drawing (no alias); the clip still opens on
    // the shared fall:4 DOWN bookend, then moves to the getup sequence.
    getup: clip(GETUP_TICKS, [[0, DOWN], [2, 'getup:0'], [5, 'getup:1'], [10, 'getup:2'], [14, 'getup:3'], [19, 'getup:4'], [GETUP_TICKS - 1, IDLE]]),
    grab: clip(8, [[0, 'misc:2'], [4, 'misc:3']]),
    release: clip(6, [[0, 'misc:4'], [4, IDLE]]),
  }
}

export function motionFrameForXuchu(art: MotionArt, entity: MotionEntity): string {
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
    case 'grabbed': return 'misc:2'
    // The adapter observes unfrozen thrown displacement, since enemy AI stops stateTick.
    case 'thrown': return (entity.airTicks ?? t) < 4 ? 'fall:2' : 'fall:3'
    case 'dying': return sampleClip(art, 'fall', Math.min(t, DYING_TICKS))
    case 'dead': return DOWN
  }
  // Impossible hero-only states are defensive guard, not invented capabilities.
  return IDLE
}

type PackCell = MotionArt['frames'][string] & { aliasOf?: string }
type SinglePageGeometry = MotionPackGeometry & { singlePage?: boolean }
const cellFields = ['x', 'y', 'w', 'h', 'trimX', 'trimY', 'srcW', 'srcH'] as const

/** Strict single-page validation with NO legal overlap: Xu Chu's pack
 * declares no alias, so getup:0 sharing fall:4's rect (or any aliasOf
 * field at all) is a forgery. Both sheet labels are ONE physical page.
 */
export function validXuchuPack(meta: MotionPackGeometry): boolean {
  if (meta.id !== 'xuchu' || meta.density !== 2 || (meta as SinglePageGeometry).singlePage !== true || meta.decodedCapBytes !== undefined) return false
  if (!meta.attackBindings || Object.keys(meta.attackBindings).length !== 3 || Object.entries(XUCHU_ATTACK_BINDINGS).some(([id, action]) => meta.attackBindings?.[id] !== action)) return false
  const { width, height, groundY } = meta.box
  if (![width, height, groundY, meta.sheet.width, meta.sheet.height, meta.actionSheet.width, meta.actionSheet.height].every(Number.isSafeInteger)) return false
  if (width <= 0 || height <= 0 || groundY <= 0 || groundY >= height) return false
  if (meta.sheet.width <= 0 || meta.sheet.height <= 0 || meta.sheet.width > 2048 || meta.sheet.height > 2048 || meta.sheet.width * meta.sheet.height * 4 > 16 * 1024 * 1024) return false
  if (meta.actionSheet.width !== meta.sheet.width || meta.actionSheet.height !== meta.sheet.height) return false
  const names = Object.entries(XUCHU_FRAMES).flatMap(([group, count]) => Array.from({ length: count }, (_, i) => `${group}:${i}`))
  if (Object.keys(meta.frames).length !== names.length || Object.keys(meta.frames).some((name) => !names.includes(name))) return false
  const cells: PackCell[] = []
  for (const name of names) {
    const c = meta.frames[name] as PackCell | undefined
    if (!c || !cellFields.every((field) => Number.isSafeInteger(c[field]))) return false
    if (Object.keys(c).some((field) => !(cellFields as readonly string[]).includes(field))) return false
    if (c.x < 0 || c.y < 0 || c.w <= 0 || c.h <= 0 || c.x + c.w > meta.sheet.width || c.y + c.h > meta.sheet.height) return false
    if (c.srcW !== width * 2 || c.srcH !== height * 2 || c.trimX! < 0 || c.trimY! < 0 || c.trimX! + c.w > c.srcW || c.trimY! + c.h > c.srcH) return false
    for (const b of cells) {
      if (c.x < b.x + b.w && c.x + c.w > b.x && c.y < b.y + b.h && c.y + c.h > b.y) return false
    }
    cells.push(c)
  }
  return true
}
