import { GROUND, type Skeleton } from './rig'

/**
 * The six poses, authored once in canonical figure space and shared by every
 * humanoid kind.
 *
 * Read the numbers as a side view of a fighter facing RIGHT, with the box 96
 * wide and 92 tall and the feet on GROUND. `F` joints are the far side of the
 * body and `N` the near side; keeping them apart is what stops a flat drawing
 * reading as a paper cut-out, and it is also what the gate's appendageRatio is
 * measuring when it asks whether anything stands clear of the torso.
 *
 * Two constraints the shapes are drawn to, both from the visual gate rather
 * than from taste:
 *
 *  - `attack` must reach measurably further sideways than `idle`, because that
 *    is the check that fails when a player says "I cannot see the weapon". Idle
 *    carries the weapon near-vertical; attack drives it out horizontally, which
 *    roughly doubles the drawn width.
 *  - `walk0` and `walk1` must differ, and must not change how many legs the
 *    figure appears to have. The stride is wide enough that the legs never
 *    merge into one mass at any point in the cycle.
 */

const NEAR_VERTICAL = -1.4

export const IDLE: Skeleton = {
  hip: { x: 48, y: 52 },
  chest: { x: 48, y: 30 },
  neck: { x: 48, y: 25 },
  head: { x: 49, y: 15 },
  shoulderF: { x: 43, y: 31 },
  elbowF: { x: 40, y: 43 },
  handF: { x: 42, y: 55 },
  shoulderN: { x: 53, y: 31 },
  elbowN: { x: 57, y: 43 },
  handN: { x: 58, y: 54 },
  hipF: { x: 44, y: 53 },
  kneeF: { x: 42, y: 71 },
  footF: { x: 40, y: GROUND },
  hipN: { x: 52, y: 53 },
  kneeN: { x: 55, y: 71 },
  footN: { x: 58, y: GROUND },
  weaponRot: NEAR_VERTICAL,
  weaponGrip: 0.34,
  headRot: 0,
}

/** Near leg forward, far leg trailing; arms counter-swing. */
export const WALK0: Skeleton = {
  ...IDLE,
  hip: { x: 48, y: 53 },
  chest: { x: 47, y: 31 },
  neck: { x: 47, y: 26 },
  head: { x: 48, y: 16 },
  shoulderF: { x: 43, y: 32 },
  elbowF: { x: 38, y: 42 },
  handF: { x: 37, y: 54 },
  shoulderN: { x: 53, y: 32 },
  elbowN: { x: 59, y: 42 },
  handN: { x: 60, y: 52 },
  hipF: { x: 45, y: 54 },
  kneeF: { x: 38, y: 70 },
  footF: { x: 33, y: GROUND },
  hipN: { x: 52, y: 54 },
  kneeN: { x: 60, y: 68 },
  footN: { x: 64, y: GROUND - 2 },
  weaponRot: -1.44,
}

/**
 * The mirrored half of the stride.
 *
 * ART-8. The weapon used to reach its most VERTICAL angle here (-1.5), and
 * this is the half where the near hand swings in to x=54 against a head at
 * x=50 - so the blade passed straight over the head for twelve of the
 * seventeen kinds. Measured as steel-coloured pixels inside the head oval:
 * Guan Yu 1034, Li Dian 1072, Wei Yan 604, a soldier 591, against roughly zero
 * in every other pose.
 *
 * The swing is unchanged in AMPLITUDE - still 0.22 radians between the two
 * halves - it is the phase that moved: the vertical extreme now falls on
 * WALK0, where the hand is out at x=60 and well clear of the head. Measured
 * after: every kind at its baseline, and no pose clips its frame box.
 */
export const WALK1: Skeleton = {
  ...IDLE,
  hip: { x: 48, y: 51 },
  chest: { x: 49, y: 29 },
  neck: { x: 49, y: 24 },
  head: { x: 50, y: 14 },
  shoulderF: { x: 44, y: 30 },
  elbowF: { x: 44, y: 42 },
  handF: { x: 47, y: 53 },
  shoulderN: { x: 54, y: 30 },
  elbowN: { x: 55, y: 42 },
  handN: { x: 54, y: 53 },
  hipF: { x: 45, y: 52 },
  kneeF: { x: 50, y: 69 },
  footF: { x: 56, y: GROUND - 2 },
  hipN: { x: 52, y: 52 },
  kneeN: { x: 47, y: 71 },
  footN: { x: 41, y: GROUND },
  weaponRot: -1.22,
}

/** Weapon driven out horizontally: the pose the reach check measures. */
export const ATTACK: Skeleton = {
  ...IDLE,
  strike: true,
  hip: { x: 46, y: 53 },
  chest: { x: 48, y: 31 },
  neck: { x: 49, y: 26 },
  head: { x: 51, y: 16 },
  shoulderF: { x: 44, y: 32 },
  elbowF: { x: 50, y: 38 },
  handF: { x: 58, y: 36 },
  shoulderN: { x: 54, y: 31 },
  elbowN: { x: 64, y: 33 },
  handN: { x: 74, y: 34 },
  hipF: { x: 42, y: 54 },
  kneeF: { x: 36, y: 70 },
  footF: { x: 30, y: GROUND },
  hipN: { x: 51, y: 54 },
  kneeN: { x: 60, y: 70 },
  footN: { x: 66, y: GROUND },
  weaponRot: -0.12,
  weaponGrip: 0.3,
  headRot: 0.06,
}

/**
 * The windup: coiled back, weapon cocked up-forward, weight on the back foot.
 * The first phase of every attack - and, for enemies with long startups, a
 * visible telegraph (a soldier winds up for 14 ticks before its 4-tick strike).
 *
 * Drawn to satisfy three gates at once: strictly NARROWER than either strike
 * (the retract gate), clearly not `idle` (the windup/idle distinctness pair -
 * the weapon sits 0.6 radians off the idle carry and the hands are twenty
 * units higher), and inside the frame top (a raised 78-unit polearm against a
 * uniform HEADROOM of 24, so the weapon is held forward-diagonal rather than
 * overhead, the same compromise the jump pose makes). The blade rises forward
 * of the head, never over it - the ART-8 failure mode.
 */
export const WINDUP: Skeleton = {
  ...IDLE,
  hip: { x: 46, y: 54 },
  chest: { x: 45, y: 32 },
  neck: { x: 46, y: 27 },
  head: { x: 47, y: 17 },
  shoulderF: { x: 41, y: 33 },
  elbowF: { x: 37, y: 43 },
  handF: { x: 40, y: 52 },
  shoulderN: { x: 51, y: 32 },
  elbowN: { x: 60, y: 40 },
  handN: { x: 56, y: 34 },
  hipF: { x: 43, y: 55 },
  kneeF: { x: 39, y: 70 },
  footF: { x: 36, y: GROUND },
  hipN: { x: 51, y: 55 },
  kneeN: { x: 58, y: 70 },
  footN: { x: 62, y: GROUND },
  weaponRot: -0.8,
  weaponGrip: 0.4,
  headRot: -0.1,
}

/**
 * The alternate strike: a high-line thrust from a tall stance, for the second
 * hit of the hero combo. jab1 lunges low and level; jab2 answers upright and
 * high, so the two read as different swings rather than one swing repeated.
 *
 * A downward cut was the first sketch and it failed on paper: a cut's reach is
 * modest (~25 units past the pose space), and the retract gate requires the
 * recover to sit strictly narrower than EACH strike - there was no room. A
  * high thrust keeps strike-class reach (40 units past the pose space) while the body, the blade angle
  * and the hand height all differ from `attack`, which is what the
  * attack/attack2 distinctness pair measures. ENH-5 adds three further
  * strikes below; the shared table now holds fourteen poses.
  */
export const ATTACK2: Skeleton = {
  ...IDLE,
  strike: true,
  hip: { x: 48, y: 52 },
  chest: { x: 48, y: 30 },
  neck: { x: 49, y: 25 },
  head: { x: 50, y: 15 },
  shoulderF: { x: 44, y: 31 },
  elbowF: { x: 52, y: 35 },
  handF: { x: 60, y: 30 },
  shoulderN: { x: 54, y: 30 },
  elbowN: { x: 60, y: 32 },
  handN: { x: 66, y: 26 },
  hipF: { x: 44, y: 53 },
  kneeF: { x: 40, y: 70 },
  footF: { x: 36, y: GROUND },
  hipN: { x: 52, y: 53 },
  kneeN: { x: 58, y: 70 },
  footN: { x: 62, y: GROUND },
  weaponRot: -0.45,
  weaponGrip: 0.3,
  headRot: 0.02,
}

/**
 * The deep thrust: a full lunge with the weapon dead level, for pike and
 * spear jabs. Deeper than ATTACK in every joint - hips lower and further
 * forward, front foot planted a full stride out, both hands driving down the
 * weapon line - so the two level strikes read as different commits rather
 * than one pose repeated. The off hand sits on the haft line, as in ATTACK.
 */
export const THRUST: Skeleton = {
  ...IDLE,
  strike: true,
  hip: { x: 44, y: 56 },
  chest: { x: 47, y: 33 },
  neck: { x: 48, y: 28 },
  head: { x: 50, y: 18 },
  shoulderF: { x: 43, y: 34 },
  elbowF: { x: 51, y: 40 },
  handF: { x: 60, y: 38 },
  shoulderN: { x: 53, y: 33 },
  elbowN: { x: 64, y: 36 },
  handN: { x: 77, y: 36 },
  hipF: { x: 40, y: 57 },
  kneeF: { x: 33, y: 72 },
  footF: { x: 26, y: GROUND },
  hipN: { x: 49, y: 57 },
  kneeN: { x: 60, y: 71 },
  footN: { x: 70, y: GROUND },
  weaponRot: -0.05,
  weaponGrip: 0.3,
  headRot: 0.08,
}

/**
 * The chop: a high-to-low cut frozen on a steep forward diagonal. Steep, but
 * never truly overhead: a raised polearm leaves the top of the frame, and the
  * shared HEADROOM is 27 units for every pose. At -0.65 with the hands held
 * forward rather than up, the longest head in the cast stays inside it - the
 * first sketch gripped at 0.32 and touched the frame top at exactly 27.0 for
 * the tallest build, so the grip moved to 0.35 and the hands came down one
 * unit. The cut still reads as coming DOWN rather than across: the hands are
 * higher and further forward than the windup's, and the body lunges where the
 * windup coils back, which is what keeps the two apart for the distinctness
 * gate.
  */
export const CHOP: Skeleton = {
  ...IDLE,
  strike: true,
  hip: { x: 45, y: 55 },
  chest: { x: 46, y: 32 },
  neck: { x: 47, y: 27 },
  head: { x: 49, y: 17 },
  shoulderF: { x: 42, y: 33 },
  elbowF: { x: 45, y: 40 },
  handF: { x: 53, y: 36 },
  shoulderN: { x: 52, y: 32 },
  elbowN: { x: 58, y: 34 },
  handN: { x: 63, y: 29 },
  hipF: { x: 41, y: 56 },
  kneeF: { x: 35, y: 71 },
  footF: { x: 29, y: GROUND },
  hipN: { x: 50, y: 56 },
  kneeN: { x: 59, y: 71 },
  footN: { x: 66, y: GROUND },
  weaponRot: -0.65,
  weaponGrip: 0.35,
  headRot: 0.05,
}

/**
 * The sweep: a low crouched wide swing at knee height, for glaive and dao
 * work. Crouched lower than the special's dropped stance, with the feet wider
 * and the weapon level-low rather than angled down-forward, so the two low
 * poses read as different swings. Strike-class reach comes from the level
 * weapon and the forward hands, not from standing tall.
 */
export const SWEEP: Skeleton = {
  ...IDLE,
  hip: { x: 44, y: 61 },
  chest: { x: 45, y: 39 },
  neck: { x: 46, y: 34 },
  head: { x: 48, y: 24 },
  shoulderF: { x: 41, y: 40 },
  elbowF: { x: 49, y: 45 },
  handF: { x: 57, y: 43 },
  shoulderN: { x: 51, y: 39 },
  elbowN: { x: 62, y: 42 },
  handN: { x: 74, y: 44 },
  hipF: { x: 40, y: 62 },
  kneeF: { x: 32, y: 74 },
  footF: { x: 24, y: GROUND },
  hipN: { x: 49, y: 62 },
  kneeN: { x: 61, y: 74 },
  footN: { x: 72, y: GROUND },
  weaponRot: 0.1,
  weaponGrip: 0.3,
  headRot: 0.12,
}

/**
 * The recover: settling forward, weapon half-raised but no longer driven out.
 * The last phase of every swing and the reason consecutive hits read as
 * repeated strikes - each combo boundary is recover into windup, two withdrawn
 * frames between the extended ones.
 *
 * Narrower than either strike by design (the retract gate measures this), but
 * not idle: the torso is still forward, the hands are still out, and the
 * weapon sits halfway between the strike line and the carry.
 */
export const RECOVER: Skeleton = {
  ...IDLE,
  hip: { x: 47, y: 53 },
  chest: { x: 47, y: 31 },
  neck: { x: 48, y: 26 },
  head: { x: 50, y: 17 },
  shoulderF: { x: 43, y: 32 },
  elbowF: { x: 49, y: 39 },
  handF: { x: 55, y: 38 },
  shoulderN: { x: 53, y: 31 },
  elbowN: { x: 57, y: 37 },
  handN: { x: 59, y: 39 },
  hipF: { x: 43, y: 54 },
  kneeF: { x: 37, y: 70 },
  footF: { x: 32, y: GROUND },
  hipN: { x: 51, y: 54 },
  kneeN: { x: 59, y: 70 },
  footN: { x: 64, y: GROUND },
  weaponRot: -0.75,
  weaponGrip: 0.32,
  headRot: 0.04,
}

/** Knees tucked, weapon raised. Only a light tuck: the sim already lifts the
 * sprite by the jump's z, so a big one would read as hovering twice. */
export const JUMP: Skeleton = {
  ...IDLE,
  hip: { x: 48, y: 50 },
  chest: { x: 48, y: 29 },
  neck: { x: 48, y: 24 },
  head: { x: 49, y: 14 },
  shoulderF: { x: 43, y: 30 },
  elbowF: { x: 38, y: 36 },
  handF: { x: 36, y: 26 },
  shoulderN: { x: 53, y: 30 },
  elbowN: { x: 58, y: 36 },
  // Held forward rather than straight overhead: a raised polearm leaves the
  // top of the frame and gets its head cut off, and the box cannot grow to fit
  // one without shrinking every fighter inside it.
  handN: { x: 62, y: 36 },
  hipF: { x: 44, y: 51 },
  kneeF: { x: 38, y: 64 },
  footF: { x: 44, y: 76 },
  hipN: { x: 52, y: 51 },
  kneeN: { x: 60, y: 62 },
  footN: { x: 62, y: 76 },
  weaponRot: -0.75,
  weaponGrip: 0.38,
  headRot: -0.08,
}

/**
 * Floored, head to the left, with the weapon dropped clear of the body. The
 * gap between body and weapon is deliberate: for a prone figure nothing splits
 * a ROW, so appendageRatio is carried entirely by the columns that pass through
 * both, and a weapon tucked under the body would score it as a featureless
 * mass. That reading is the reason appendageRatio measures both axes at all.
 */
export const DOWN: Skeleton = {
  hip: { x: 50, y: 82 },
  chest: { x: 37, y: 80 },
  neck: { x: 32, y: 79 },
  head: { x: 25, y: 77 },
  shoulderF: { x: 37, y: 83 },
  elbowF: { x: 31, y: 87 },
  handF: { x: 24, y: 88 },
  shoulderN: { x: 37, y: 76 },
  elbowN: { x: 30, y: 71 },
  handN: { x: 22, y: 70 },
  hipF: { x: 50, y: 85 },
  kneeF: { x: 62, y: 87 },
  footF: { x: 74, y: 89 },
  hipN: { x: 50, y: 79 },
  kneeN: { x: 63, y: 78 },
  footN: { x: 75, y: 82 },
  weaponRot: -0.34,
  weaponGrip: 0.5,
  headRot: -0.5,
  lying: true,
}

/**
 * Taking a hit: head snapped back, weight on the back foot, guard broken.
 * Hitstun used to show only as a red tint over the idle pose, so a fighter
 * being beaten stood perfectly still and glowed.
 */
export const HURT: Skeleton = {
  ...IDLE,
  hip: { x: 50, y: 53 },
  chest: { x: 52, y: 32 },
  neck: { x: 53, y: 27 },
  head: { x: 56, y: 19 },
  shoulderF: { x: 48, y: 33 },
  elbowF: { x: 44, y: 43 },
  handF: { x: 41, y: 50 },
  shoulderN: { x: 58, y: 33 },
  elbowN: { x: 64, y: 41 },
  handN: { x: 66, y: 49 },
  hipF: { x: 46, y: 54 },
  kneeF: { x: 45, y: 71 },
  footF: { x: 42, y: GROUND },
  hipN: { x: 54, y: 54 },
  kneeN: { x: 59, y: 71 },
  footN: { x: 64, y: GROUND },
  weaponRot: -1.1,
  weaponGrip: 0.4,
  headRot: 0.3,
}

/**
 * The special: a committed downward sweep from a dropped stance. Distinct from
 * `attack` in body line as well as weapon angle - the special used to reuse the
 * attack pose outright, so the move that costs health looked exactly like the
 * one that does not.
 */
export const SPECIAL: Skeleton = {
  ...IDLE,
  hip: { x: 44, y: 56 },
  chest: { x: 47, y: 34 },
  neck: { x: 48, y: 29 },
  head: { x: 51, y: 20 },
  shoulderF: { x: 43, y: 35 },
  elbowF: { x: 52, y: 43 },
  handF: { x: 60, y: 45 },
  shoulderN: { x: 53, y: 34 },
  elbowN: { x: 64, y: 41 },
  handN: { x: 73, y: 45 },
  hipF: { x: 40, y: 57 },
  kneeF: { x: 33, y: 72 },
  footF: { x: 27, y: GROUND },
  hipN: { x: 50, y: 57 },
  kneeN: { x: 60, y: 72 },
  footN: { x: 68, y: GROUND },
  weaponRot: 0.3,
  weaponGrip: 0.28,
  headRot: 0.12,
}

export const POSE_TABLE = {
  idle: IDLE,
  walk0: WALK0,
  walk1: WALK1,
  attack: ATTACK,
  attack2: ATTACK2,
  thrust: THRUST,
  chop: CHOP,
  sweep: SWEEP,
  windup: WINDUP,
  recover: RECOVER,
  jump: JUMP,
  down: DOWN,
  hurt: HURT,
  special: SPECIAL,
} as const satisfies Record<string, Skeleton>

export type PoseName = keyof typeof POSE_TABLE
