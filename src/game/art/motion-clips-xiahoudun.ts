/** CMR-14B: Xiahou Dun's complete single-page boss pack. No gameplay clocks change. */
import { attackById } from '../../core/attacks'
import { DYING_TICKS, GETUP_TICKS, KNOCKDOWN_TICKS } from '../../core/constants'
import { ENEMIES } from '../../core/enemies'
import { sampleClip, type MotionArt, type MotionClip, type MotionEntity, type MotionFrameCell, type MotionPackGeometry } from './motion-clips'

const IDLE = 'walk:0'
const DOWN = 'fall:4'
const clip = (duration: number, pairs: Array<[number, string]>, loop = false): MotionClip => ({ duration, loop, keys: pairs.map(([tick, frame]) => ({ tick, frame })) })
export const XIAHOUDUN_ATTACK_BINDINGS: Record<string, string> = {
  'charge.dash.long': 'charge', 'sword.combo': 'combo', 'sword.heavy': 'heavy',
}
export const XIAHOUDUN_COLLAPSE_TAIL: [string, string] = ['fall:3', DOWN]
export const XIAHOUDUN_FRAMES: Record<string, number> = {
  walk: 9, charge: 5, combo: 5, heavy: 5, misc: 5, fall: 5, getup: 5,
}

/** Normal/enraged AI use the same poses; windows derive from actual boss data. */
export function xiahoudunClips(): MotionArt['clips'] {
  const def = ENEMIES.xiahoudun
  if (!def?.boss) throw new Error('missing xiahoudun boss definition')
  const charge = attackById(def.boss.charge)
  const combo = attackById(def.boss.combo)
  const heavy = attackById(def.boss.heavy)
  const chargeEnd = charge.startup + charge.active, chargeDur = chargeEnd + charge.recover
  const comboEnd = combo.startup + combo.active, comboDur = comboEnd + combo.recover
  const heavyEnd = heavy.startup + heavy.active, heavyDur = heavyEnd + heavy.recover
  return {
    idle: clip(1, [[0, IDLE]], true),
    walk: clip(32, Array.from({ length: 8 }, (_, i) => [i * 4, `walk:${i + 1}`]), true),
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
    // getup:0 is a literal atlas alias of fall:4, not another prone drawing.
    getup: clip(GETUP_TICKS, [[0, DOWN], [2, 'getup:0'], [5, 'getup:1'], [10, 'getup:2'], [14, 'getup:3'], [19, 'getup:4'], [GETUP_TICKS - 1, IDLE]]),
    grab: clip(8, [[0, 'misc:2'], [4, 'misc:3']]),
    release: clip(6, [[0, 'misc:4'], [4, IDLE]]),
  }
}

export function motionFrameForXiahoudun(art: MotionArt, entity: MotionEntity): string {
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

type AliasCell = MotionFrameCell & { aliasOf?: string }
type SinglePageGeometry = MotionPackGeometry & { singlePage?: boolean }
const cellFields = ['x', 'y', 'w', 'h', 'trimX', 'trimY', 'srcW', 'srcH'] as const

/** Exactly one legal overlap: getup:0 = fall:4, including full-cell registration.
 * Both sheet labels refer to ONE physical page; they cannot hide collisions.
 */
export function validXiahoudunPack(meta: MotionPackGeometry): boolean {
  if (meta.id !== 'xiahoudun' || meta.density !== 2 || (meta as SinglePageGeometry).singlePage !== true || meta.decodedCapBytes !== undefined) return false
  if (!meta.attackBindings || Object.keys(meta.attackBindings).length !== 3 || Object.entries(XIAHOUDUN_ATTACK_BINDINGS).some(([id, action]) => meta.attackBindings?.[id] !== action)) return false
  const { width, height, groundY } = meta.box
  if (![width, height, groundY, meta.sheet.width, meta.sheet.height, meta.actionSheet.width, meta.actionSheet.height].every(Number.isSafeInteger)) return false
  if (width <= 0 || height <= 0 || groundY <= 0 || groundY >= height) return false
  if (meta.sheet.width <= 0 || meta.sheet.height <= 0 || meta.sheet.width > 2048 || meta.sheet.height > 2048 || meta.sheet.width * meta.sheet.height * 4 > 16 * 1024 * 1024) return false
  if (meta.actionSheet.width !== meta.sheet.width || meta.actionSheet.height !== meta.sheet.height) return false
  const names = Object.entries(XIAHOUDUN_FRAMES).flatMap(([group, count]) => Array.from({ length: count }, (_, i) => `${group}:${i}`))
  if (Object.keys(meta.frames).length !== names.length || Object.keys(meta.frames).some((name) => !names.includes(name))) return false
  const cells: Array<[string, AliasCell]> = []
  for (const name of names) {
    const c = meta.frames[name] as AliasCell | undefined
    if (!c || !cellFields.every((field) => Number.isSafeInteger(c[field]))) return false
    if (Object.keys(c).some((field) => ![...cellFields, 'sheet', 'aliasOf'].includes(field))) return false
    if (c.sheet !== undefined) return false // canonical single texture; no second-page escape hatch
    if (c.aliasOf !== undefined && (name !== 'getup:0' || c.aliasOf !== DOWN)) return false
    if (c.x < 0 || c.y < 0 || c.w <= 0 || c.h <= 0 || c.x + c.w > meta.sheet.width || c.y + c.h > meta.sheet.height) return false
    if (c.srcW !== width * 2 || c.srcH !== height * 2 || c.trimX! < 0 || c.trimY! < 0 || c.trimX! + c.w > c.srcW || c.trimY! + c.h > c.srcH) return false
    for (const [otherName, b] of cells) {
      if (!(c.x < b.x + b.w && c.x + c.w > b.x && c.y < b.y + b.h && c.y + c.h > b.y)) continue
      if (name !== 'getup:0' || otherName !== DOWN || !cellFields.every((field) => c[field] === b[field])) return false
    }
    cells.push([name, c])
  }
  // Aliasing must exist even if a forged getup:0 was moved into unused page space.
  return cellFields.every((field) => meta.frames['getup:0']![field] === meta.frames[DOWN]![field])
}
