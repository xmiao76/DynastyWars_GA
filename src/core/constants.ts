/**
 * Fixed simulation tick rate (Hz). All game logic advances in discrete
 * 1/TICK_RATE steps so runs replay exactly, frame rate independent.
 */
export const TICK_RATE = 60

/**
 * Logical screen size in pixels (16:9). Phaser scales this up to fit the
 * window. 480x270 gives modern 2D game framing: readable HUD and characters
 * instead of a tiny arcade window.
 */
export const SCREEN_WIDTH = 480
export const SCREEN_HEIGHT = 270

/** Milliseconds per simulation tick, for the fixed-step accumulator. */
export const TICK_MS = 1000 / TICK_RATE

/** Maximum sim ticks per rendered frame; a stalled tab must not burst-simulate. */
export const MAX_CATCHUP_STEPS = 5

/** Horizontal margin keeping entities visibly on screen / inside the stage. */
export const EDGE_MARGIN = 16

/** Ticks the player stays in hitstun after taking a hit. */
export const PLAYER_HITSTUN_TICKS = 20

/** Ticks a dying entity remains visible before removal. */
export const DYING_TICKS = 50

/** Jump arc: duration in ticks and peak height in px (z axis). */
export const JUMP_DURATION = 36
export const JUMP_HEIGHT = 48

/** Knockdown: ticks lying on the ground, then ticks getting up. Both are
 * invulnerable (i-frames) - classic beat'em up wake-up protection. */
export const KNOCKDOWN_TICKS = 36
export const GETUP_TICKS = 24

/** Ground attacks miss targets above this z height (jumping over swings). */
export const GROUND_ATTACK_MAX_Z = 24

/** Mercy i-frames after the player's hitstun or getup ends: breaks the
 * surround-stunlock loop that would otherwise chain-hit the player to death. */
export const PLAYER_MERCY_TICKS = 45

/** Grab: walking into an enemy within this box grabs it (arcade-style). */
export const GRAB_RANGE_X = 14
export const GRAB_RANGE_Y = 6
/** Ticks a grab holds before the enemy collapses free. */
export const GRAB_HOLD_TICKS = 90
/** Thrown body flight: speed (px/tick) and max travel distance (px). */
export const THROW_SPEED = 3.5
export const THROW_TRAVEL = 90
export const THROWN_Z = 10

/**
 * Arrow flight. An arrow crosses the fight at CHEST height - the middle of
 * a standing fighter (~92 units tall) - instead of at ankle height, and past
 * its level range it falls to the ground and is gone rather than hanging in
 * the air. The hit test measures against ARROW_CHEST_Z above the target's
 * feet, so level-flight hits and jump-dodges are EXACTLY the set the old
 * feet-level arrows (flying at z = 10, tested against target.z) had:
 * ARROW_Z - ARROW_CHEST_Z reproduces the old 10-unit offset.
 */
export const ARROW_Z = 40
export const ARROW_CHEST_Z = 30
/**
 * px of level flight before the arrow starts falling. Beyond every fire
 * range (ARCHER_FIRE_RANGE is 220 and arrows spawn 10 from the bow), so
 * combat at honest distance happens at chest height.
 */
export const ARROW_LEVEL_TRAVEL = 240
/** Height lost per tick while falling. */
export const ARROW_FALL = 2
/** Farthest range: an arrow still airborne here disappears. */
export const ARROW_MAX_TRAVEL = 360

/** Ground items despawn after this many ticks. */
export const ITEM_LIFETIME_TICKS = 600

/** The boss spawns when the player pushes within this distance of the stage end. */
export const BOSS_TRIGGER_DISTANCE = 280

/** Score per extra life (arcade 1UP milestone). */
export const SCORE_PER_EXTRA_LIFE = 2000

/** Combo window: a player hit within this many ticks keeps the chain. */
export const COMBO_WINDOW_TICKS = 45
