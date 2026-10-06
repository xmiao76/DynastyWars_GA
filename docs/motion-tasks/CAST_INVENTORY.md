# CMR-01 — Cast inventory (source-verified)

Published 2026-10-01 (CMR-01 attempt 1). Every column below was read from
source (`src/core/characters.ts`, `src/core/enemies.ts`, `src/core/attacks.ts`,
`src/core/ai.ts`, `src/core/events.ts`, `src/core/constants.ts`,
`src/game/art/figures.ts`, `src/game/art/poses.ts`,
`src/game/art/motion-clips.ts`) or the committed packs
(`src/game/assets/{hero,mook,boss}-bodies`, `*-faces`, `horse`). Weapon and
attack-ID columns are kept SEPARATE on purpose: attack ID words do not dictate
weapon appearance (contract); figure `weapon` is authoritative.

Roster: 11 humanoids (5 heroes + 3 regular enemies + 3 bosses) + the shared
horse. Screen scale: every fighter renders in figure space FIG_W 96 × FIG_H 92
logical units (body packs at 4x), composed in-world at gameplay scale
(`RENDER_SCALE 2`); the horse strip is 128×64 (8 frames).

## Heroes (PLAYABLE, `src/core/characters.ts` + figure plans)

| id | name | figure weapon | build | states/attacks (exact IDs) | clocks |
| --- | --- | --- | --- | --- | --- |
| guanyu | Guan Yu 關羽 | glaive | TALL | `gy.jab1`, `gy.jab2`, `gy.finisher`, `gy.jumpkick`, `gy.special` (aoe) | per-attack windows in ATTACKS (startup/active/recover ticks); combo cadence `CHARACTERS.combo` |
| zhangfei | Zhang Fei 張飛 | pike | HEAVY | `zf.jab1/2`, `zf.finisher`, `zf.jumpkick`, `zf.special` (aoe) | same |
| zhaoyun | Zhao Yun 趙雲 | spear | LEAN | `zy.jab1/2`, `zy.finisher`, `zy.jumpkick`, `zy.special` (aoe) | same |
| huangzhong | Huang Zhong 黃忠 | bow | VETERAN | `hz.jab1/2`, `hz.finisher`, `hz.jumpkick`, **`hz.special`: active 0, damage 0, aoe true — the special itself has NO active hitbox; `CHARACTERS.specialFiresProjectile` makes it a projectile** | `hz.special` startup 4 / active 0 / recover 14; projectile ticks from the special-event path (arrow clock below) |
| weiyan | Wei Yan 魏延 | dao | SOLID | `wy.jab1/2`, `wy.finisher`, `wy.jumpkick`, `wy.special` (aoe) | same |

Shared hero stats: `maxHp`, `walkSpeed`, `combo`, `jumpAttack`, `specialAttack`,
`specialCost` per character (source `CHARACTERS`). Reachable hero states (sim):
idle, walk, attack/attack2/thrust/chop/sweep/windup/recover (pose-mapped),
jump, jumpattack, hitstun, knockdown, getup, grabbing/grabbed/thrown (throws),
dying, dead; mounted variants when riding.

## Regular enemies (PLAYABLE OPPONENTS, `src/core/enemies.ts`)

| kind | name | figure weapon | build | attack ID | clocks |
| --- | --- | --- | --- | --- | --- |
| soldier | Wei Soldier 魏兵 | sword | GRUNT | `soldier.swing` | think 45, hitstun 18, speed 0.9, maxHp 24 |
| spearman | Wei Spearman 槍兵 | spear | GRUNT | `spear.thrust` | think 50, hitstun 14, speed 0.7, maxHp 32 |
| archer | Wei Archer 弓兵 | bow | GRUNT | (none — ranged) | **`fireInterval 90`** (arrow cadence), think 40, hitstun 16, speed 0.8, maxHp 18 |

## Bosses (`ENEMIES[].boss` is the authoritative pattern data)

| id | name | figure weapon | build | normal attacks (IDs) | charge | think (normal → enraged) | enrage ratio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| lidian | Li Dian 李典 | glaive | BOSS_LEAN | `sword.heavy`, `sword.combo` | `charge.dash` | 18-30 → 8-16 | 0.3 |
| xiahoudun | Xiahou Dun 夏侯惇 | spear | BOSS | `sword.heavy`, `sword.combo` | `charge.dash.long` | 16-26 → 8-14 | 0.3 |
| xuchu | Xu Chu 許褚 | glaive | BOSS_HUGE | `sword.heavy`, `sword.combo` | `charge.crush` | 12-20 → 5-10 | 0.4 |

Boss states: approach → charge at range / combo+heavy up close
(`src/core/ai.ts` stepBoss), enrage below `maxHp * enrageRatio`
(`ENRAGE_HP_RATIO 0.3` is the fallback; the per-boss `enrageRatio` above is
what the defs use). All attack windows (startup/active/recover, damage, reach,
arc, knockback, knockdown, aerial, aoe) live in `src/core/attacks.ts` (37
entries); do not restate them here.

## Horse (SHARED ANIMATED CHARACTER)

- Pack `src/game/assets/horse/` (+ `horse-fixtures/`); 8-frame strip 128×64.
- Composes with ALL riders: `mount`/`dismount` sim events
  (`src/core/events.ts`); motion ActionClips `mounted`, `mountedwalk`,
  `mountedsweep`, `dismountedsweep`, `dismount`.
- Co-op riders: two-player co-op (`join` event) can ride; mounted attack state
  reachable per the ActionClip set; dismounted sweep/dismount recoveries are
  shared clocks.

## Shared motion/pose system (applies to every humanoid)

- 14 poses (`src/game/art/poses.ts` POSE_TABLE): `idle, walk0, walk1, attack,
  attack2, thrust, chop, sweep, windup, recover, jump, down, hurt, special`.
- Held poses & cues (`src/core/ai.ts` + `src/core/constants.ts`): melee windup
  hold `HOLD_MID`, commit `HOLD_END` per attack windows; grab `GRAB_HOLD_TICKS
  90`; `THROWN_Z 10` thrown launch; `KNOCKDOWN_TICKS 36`, `GETUP_TICKS 24`;
  arrows `ARROW_Z 40`, `ARCHER_FIRE_RANGE 220`, spawn 10 from the bow.
- Sim event clocks (`src/core/events.ts` SimEvent): spawn/join/swing/jump/land/
  hit/ko/wave-cleared/throw/pickup/special/enrage/stageclear/gameover/revive/
  extralife/mount/dismount.
- Motion clips (Guan Yu accepted set): `walk, jab1, jab2, finisher` +
  `jump, jumpattack, landing, kicklanding, hurt, fall, getup, special, grab,
  release, mounted, mountedwalk, mountedsweep, dismountedsweep, dismount`
  (20 clips; timings pinned in `GUANYU_REFERENCE.md`).

## Explicit not-applicable / defensive stress states

- NOT APPLICABLE (do not invent): hero abilities for enemies (no enemy has
  `specialAttack`, `specialCost`, `jumpAttack` combos or `specialFiresProjectile`);
  ranged/melee swaps (archer is the only regular ranged; bosses are melee with
  charges); shields; new states, weapons,
  damage, timing, AI or projectile behavior of any kind (contract non-goals).
- DEFENSIVE/STRESS states that DO exist and must render: hitstun, knockdown
  (36t), getup (24t), grabbed (held 90t), thrown (THROWN_Z 10 launch →
  `fall:*`), dying, dead (held `fall:6`), low-collapse recovery
  (`getup:*` reversed), airborne fall (jump/jumpattack at hit → `fall:*`),
  mount/dismount edge states, co-op join mid-stage.
- Vulnerable moments pinned by source:
  xiahoudun `charge.dash.long` recover 26, huangzhong special recover 14
  (zero-active special). Thrown is NOT tick-fixed: the body flies at
  `THROWN_Z 10` until `traveled >= THROW_TRAVEL` or a stage edge
  (`src/core/sim.ts` ~442-461), hitting bystanders with `throw.body` and
  ending in a `throw.land` impact → knockdown (36t) → getup (24t).

## Provenance

Original sources: `art/fighter-bodies/*.jpg`, `art/fighter-faces/*` (committed);
prepared packs `src/game/assets/*-bodies|*-faces` (BODY-1..15); motion pack
`src/game/assets/motion` (Guan Yu, frozen — see `GUANYU_REFERENCE.md`);
horse pack `src/game/assets/horse`. No other image sources are authorized.
