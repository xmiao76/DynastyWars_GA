/**
 * CMR-02: per-fighter motion profile contract (presentation-only).
 *
 * The Guan Yu pilot hard-coded three things in motion-clips.ts: the pack id
 * (`meta.id !== 'guanyu'`), the attack-id prefix (`id?.slice(3)` -> `gy.*`)
 * and a uniform 9-cell action-page requirement. This module lifts those into
 * explicit per-kind profiles so heroes, melee enemies, bosses and projectile
 * shooters each declare their actual capabilities, bindings and timing.
 *
 * Core definitions (`src/core/*`) stay read-only and authoritative: windows,
 * hitstun and firing cadence below are DERIVED from them at construction, so
 * no profile can invent a capability the source does not have. Unknown
 * bindings fail validation - sole-motion has no substitute rendering, so a
 * kind without a pack is a blocking error at the adapters.
 */
import { CHARACTERS } from '../../core/characters'
import { ENEMIES } from '../../core/enemies'
import { ATTACKS, attackById } from '../../core/attacks'
import { PLAYER_HITSTUN_TICKS } from '../../core/constants'
import { ACTION_SHEETS, MOTION_ACTIONS, type MotionArt, type MotionClip } from './motion-clips'

export type CharacterId = keyof typeof CHARACTERS
export type EnemyKind = keyof typeof ENEMIES
export type AttackName = keyof typeof ATTACKS

export type MotionRole = 'hero' | 'melee' | 'boss' | 'shooter'

export interface MotionCues {
  /** Shooter cadence (ticks between shots), from EnemyDef.fireInterval. */
  fireInterval?: number
  /**
   * Shooter/special release presentation follows the projectile spawn event,
   * never an invented melee active window (CMR-02 bounded work).
   */
  releaseFollowsProjectileSpawn?: boolean
  /** Zero-active specials (Huang Zhong) release only via projectile spawn. */
  zeroActiveSpecial?: boolean
}

export interface MotionProfile {
  id: string
  role: MotionRole
  /** Exact attack-id -> clip-name bindings; validation rejects unknown ids. */
  attackBindings: Record<string, string>
  /** Airborne kick attack id (heroes only). */
  jumpAttackId?: string
  /** Clips this kind must be able to provide (capability matrix). */
  requiredClips: string[]
  /** Frame-name groups (prefixes before ':') this kind's pack must provide. */
  requiredFrameGroups: string[]
  /** Pages this kind needs. Enemies carry no action page (CMR-02). */
  pages: { regular: true; actions: boolean }
  /** Per-kind hitstun ticks (PLAYER_HITSTUN_TICKS for heroes). */
  hitstunTicks: number
  capabilities: {
    jump: boolean
    special: boolean
    grabs: boolean
  }
  cues: MotionCues
}

const GROUND_CLIPS = ['idle', 'walk', 'hurt', 'fall', 'getup']
const HERO_CLIPS = [
  ...GROUND_CLIPS, 'jump', 'jumpattack', 'landing', 'kicklanding', 'special',
  'grab', 'release',
]
const ALL_CLIPS = new Set<string>([
  ...MOTION_ACTIONS, 'idle', 'jump', 'jumpattack', 'landing', 'kicklanding',
  'hurt', 'fall', 'getup', 'special', 'grab', 'release',
])
/** Clips that may serve as an ATTACK binding (not locomotion/hurt/fall). */
const ATTACK_CLIPS = new Set<string>([
  ...MOTION_ACTIONS, 'special', 'jumpattack',
])

const comboIds = (c: { combo: string[] | string }): string[] =>
  (Array.isArray(c.combo) ? c.combo : [c.combo]) as string[]

const enemyDef = (kind: EnemyKind): (typeof ENEMIES)[EnemyKind] => {
  const def = ENEMIES[kind]
  if (!def) throw new Error(`unknown enemy kind: ${kind}`)
  return def
}

/** Hero profile from CHARACTERS; bindings derive from the character's own ids. */
export function heroProfile(id: CharacterId): MotionProfile {
  const c = CHARACTERS[id]
  if (!c) throw new Error(`unknown character: ${id}`)
  const map: Record<string, string> = {}
  for (const a of comboIds(c)) {
    map[a] = a.endsWith('.jab2') ? 'jab2' : a.endsWith('.finisher') ? 'finisher' : 'jab1'
  }
  map[c.specialAttack] = 'special'
  const special = attackById(c.specialAttack as AttackName)
  return {
    id,
    role: 'hero',
    attackBindings: map,
    jumpAttackId: c.jumpAttack,
    requiredClips: HERO_CLIPS,
    requiredFrameGroups: [...MOTION_ACTIONS, ...ACTION_SHEETS],
    pages: { regular: true, actions: true },
    hitstunTicks: PLAYER_HITSTUN_TICKS,
    capabilities: { jump: true, special: true, grabs: true },
    cues: c.specialFiresProjectile
      ? { releaseFollowsProjectileSpawn: true, zeroActiveSpecial: special.active === 0 }
      : {},
  }
}

/** Regular melee enemy profile from ENEMIES (single swing; regular page only). */
export function meleeProfile(kind: EnemyKind): MotionProfile {
  const def = enemyDef(kind)
  return {
    id: kind,
    role: 'melee',
    attackBindings: { [def.attackId]: 'jab1' },
    requiredClips: GROUND_CLIPS,
    requiredFrameGroups: [...MOTION_ACTIONS],
    pages: { regular: true, actions: false },
    hitstunTicks: def.hitstunTicks,
    capabilities: { jump: false, special: false, grabs: false },
    cues: {},
  }
}

/** Boss profile from ENEMIES[].boss (charge/combo/heavy bindings). */
export function bossProfile(kind: EnemyKind): MotionProfile {
  const def = enemyDef(kind)
  const b = def.boss
  if (!b) throw new Error(`no boss pattern for ${kind}`)
  return {
    id: kind,
    role: 'boss',
    attackBindings: {
      [def.attackId]: 'jab2',
      [b.combo]: 'jab1',
      [b.charge]: 'finisher',
    },
    requiredClips: [...GROUND_CLIPS, 'jab1', 'jab2', 'finisher'],
    requiredFrameGroups: [...MOTION_ACTIONS],
    pages: { regular: true, actions: false },
    hitstunTicks: def.hitstunTicks,
    capabilities: { jump: false, special: false, grabs: true },
    cues: {},
  }
}

/**
 * Projectile-shooter profile. Core AI has no attack state for archers, so a
 * shooter binds NO melee attacks and invents NO active windows: the firing
 * cadence and the projectile-spawn release are the only cues.
 */
export function shooterProfile(kind: EnemyKind): MotionProfile {
  const def = enemyDef(kind)
  return {
    id: kind,
    role: 'shooter',
    attackBindings: {},
    requiredClips: GROUND_CLIPS,
    requiredFrameGroups: [...MOTION_ACTIONS],
    pages: { regular: true, actions: false },
    hitstunTicks: def.hitstunTicks,
    capabilities: { jump: false, special: false, grabs: false },
    cues: { fireInterval: def.fireInterval, releaseFollowsProjectileSpawn: true },
  }
}

/**
 * Validate a profile. Returns human-readable errors; empty means valid.
 * Deliberately strict: a wrong binding fails here, never renders a supposedly
 * complete idle animation (CMR-02 acceptance).
 */
export function validateMotionProfile(p: MotionProfile): string[] {
  const errors: string[] = []
  const knownAttacks = new Set(Object.keys(ATTACKS))
  for (const [id, clip] of Object.entries(p.attackBindings)) {
    if (!knownAttacks.has(id)) errors.push(`unknown attack id: ${id}`)
    if (p.role === 'shooter') errors.push(`shooter ${p.id} must not bind melee attacks: ${id}`)
    if (!ALL_CLIPS.has(clip)) errors.push(`unknown clip for ${id}: ${clip}`)
    else if (!ATTACK_CLIPS.has(clip)) errors.push(`binding ${id} -> ${clip} is not an attack clip`)
  }
  for (const clip of p.requiredClips) {
    if (!ALL_CLIPS.has(clip)) errors.push(`unknown required clip: ${clip}`)
  }
  if (p.role === 'hero') {
    if (!p.jumpAttackId) errors.push(`hero ${p.id} lacks a jump attack binding`)
    if (p.jumpAttackId && !knownAttacks.has(p.jumpAttackId)) errors.push(`hero ${p.id} unknown jump attack id: ${p.jumpAttackId}`)
    if (!p.capabilities.jump || !p.capabilities.special) errors.push(`hero ${p.id} capability matrix incomplete`)
    if (!p.requiredClips.includes('jumpattack') || !p.requiredClips.includes('special')) errors.push(`hero ${p.id} missing hero clips`)
    if (p.cues.fireInterval) errors.push(`hero ${p.id} must not carry a shooter fire cadence`)
    if (p.cues.zeroActiveSpecial && !p.cues.releaseFollowsProjectileSpawn) errors.push(`hero ${p.id} zero-active special must release on projectile spawn`)
  }
  if (p.role === 'shooter') {
    if (!p.cues.fireInterval || p.cues.fireInterval <= 0) errors.push(`shooter ${p.id} lacks a firing cadence`)
    if (!p.cues.releaseFollowsProjectileSpawn) errors.push(`shooter ${p.id} must release on projectile spawn`)
  }
  if (p.role === 'melee' || p.role === 'boss') {
    if (Object.keys(p.attackBindings).length === 0) errors.push(`${p.role} ${p.id} binds no attacks`)
    if (p.cues.fireInterval) errors.push(`${p.role} ${p.id} must not carry a shooter fire cadence`)
    if (p.capabilities.jump || p.capabilities.special) errors.push(`${p.role} ${p.id} must not claim hero abilities`)
  }
  if (p.role === 'boss' && Object.keys(p.attackBindings).length < 3) errors.push(`boss ${p.id} must bind charge/combo/heavy`)
  if (!p.pages.regular) errors.push(`profile ${p.id} must provide a regular page`)
  if (p.pages.actions && !p.requiredFrameGroups.includes('special')) errors.push(`profile ${p.id} requests an action page without action groups`)
  if (!Number.isFinite(p.hitstunTicks) || p.hitstunTicks <= 0) errors.push(`profile ${p.id} hitstun must be positive`)
  return errors
}

/** Exposure-ordering check for a clip table (malformed ordering fails). */
export function validateClipExposures(clips: Partial<Record<string, MotionClip>>): string[] {
  const errors: string[] = []
  for (const [name, c] of Object.entries(clips)) {
    if (!c) continue
    if (!Number.isFinite(c.duration) || c.duration <= 0) {
      errors.push(`${name}: non-positive duration`)
      continue
    }
    let prev = -1
    for (const k of c.keys) {
      if (!Number.isFinite(k.tick) || k.tick < 0) errors.push(`${name}: negative/NaN exposure tick`)
      else if (k.tick <= prev) errors.push(`${name}: exposures not strictly increasing at tick ${k.tick}`)
      else if (k.tick >= c.duration) errors.push(`${name}: exposure ${k.tick} beyond duration ${c.duration}`)
      prev = k.tick
    }
  }
  return errors
}

const clip = (duration: number, pairs: Array<[number, string]>, loop = false): MotionClip => ({
  duration,
  loop,
  keys: pairs.map(([tick, frame]) => ({ tick, frame })),
})

/**
 * Build the clip table for a profile from the EXACT attack windows of its
 * bound attacks (CMR-02: "every bound attack tick matches existing
 * startup/active/recovery"). Same key layout guanyuClips uses, so sampleClip
 * and the existing playback consume it unchanged. Zero-active specials
 * (Huang Zhong) keep a zero-length active step and cue the release on
 * projectile spawn - no melee active window is invented.
 */
export function clipsForProfile(p: MotionProfile): MotionArt['clips'] {
  const IDLE = 'walk:0'
  const DOWN = 'fall:6'
  const clips = {
    idle: clip(1, [[0, IDLE]], true),
    walk: { loop: true, duration: 32, keys: Array.from({ length: 8 }, (_, i) => ({ tick: i * 4, frame: `walk:${i + 1}` })) },
    hurt: clip(p.hitstunTicks, [[0, 'misc:1'], [3, 'misc:2'], [10, 'misc:3'], [Math.max(11, p.hitstunTicks - 1), IDLE]]),
    fall: clip(36, [[0, 'fall:1'], [2, 'fall:2'], [4, 'fall:3'], [7, 'fall:4'], [10, 'fall:5'], [13, DOWN]]),
    getup: clip(24, [[0, DOWN], [2, 'getup:1'], [5, 'getup:2'], [8, 'getup:3'], [11, 'getup:4'], [14, 'getup:5'], [17, 'getup:6'], [20, 'getup:7'], [23, IDLE]]),
  } as MotionArt['clips']
  if (p.capabilities.jump) {
    clips.jump = clip(36, [[0, IDLE], [1, 'jump:1'], [4, 'jump:2'], [9, 'jump:3'], [22, 'jump:5'], [28, 'jump:6'], [33, 'jump:6']])
    clips.jumpattack = clip(24, [[0, 'jump:3'], [4, 'jump:4'], [23, 'jump:4']])
    clips.landing = clip(8, [[0, 'jump:7'], [3, 'jump:1'], [6, IDLE]])
    clips.kicklanding = clip(9, [[0, 'jump:5'], [1, 'jump:7'], [4, 'jump:1'], [7, IDLE]])
  }
  if (p.capabilities.grabs) {
    clips.grab = clip(8, [[0, 'misc:5'], [4, 'misc:6']])
    clips.release = clip(6, [[0, 'misc:7'], [4, IDLE]])
  }
  // Attack clips: every key step derived from the bound attack's real window.
  for (const [attackId, name] of Object.entries(p.attackBindings)) {
    const a = attackById(attackId as AttackName)
    const endActive = a.startup + a.active
    const duration = endActive + a.recover
    if (name === 'special') {
      // Existing forward poses avoid the painted backward-blade windup and
      // bridge the down-cut recovery without new character-design drift.
      clips[name as keyof MotionArt['clips']] = clip(duration, [[0, IDLE], [1, 'special:7'], [3, 'special:2'], [4, 'special:3'],
        [a.startup, 'special:4'], [endActive, 'special:5'], [endActive + 2, 'special:3'],
        [endActive + 4, 'special:6'], [endActive + 7, 'special:7'], [duration - 3, IDLE]])
    } else {
      const drawings = name
      clips[name as keyof MotionArt['clips']] = clip(duration, [
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
