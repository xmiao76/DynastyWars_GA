# Zhang Fei — authoring plan (CMR-09A)

Core data (read 2026-10-02, never from prompt memory): HP 140, walkSpeed
1.3, combo `zf.jab1` (10dmg, reach 32, arc 8, 5/4/9) -> `zf.jab2` (10dmg,
reach 34, arc 8, 5/4/9) -> `zf.finisher` (15dmg, reach 36, arc 14,
10/6/18, knockdown). Jump kick `zf.jumpkick` (11dmg, 4/20/0, knockdown,
aerial). Special `zf.special` (24dmg - the hardest-hitting special on
the roster, reach 70, arc 26, 6/12/12, knockdown, melee AoE, NOT a
projectile; costs 18 HP). Mounted `mounted.sweep` (14dmg, reach 38,
8/6/14, knockdown). Combo is thrust -> thrust -> sweeping finisher, NOT
Guan Yu glaive cuts: faster early jabs, heavy sweep finisher.

## Sheet layouts (all 3x3, 1536x1024, pipeline-compatible)

Same scale/camera/ground line as the Guan Yu reference family,
transparent background, no glow/shadow/text/panels/effects, full figure
+ full pike inside every cell, painted semi-realism, upper-left key
light, 3/4 front-right. Ordered references per request: `[body master,
portrait master]` (hashes in IDENTITY.md). Hero inventory mirrors the
Guan Yu 10x9 layout (walk/jab1/jab2/finisher + jump/fall/getup/misc/
special/rider); 09B derives Zhang Fei's own clip table from the zf.*
data above. Unused-by-clip cells are guard/DOWN bookends (scale anchors,
never filler poses).

1. **walk** - idle guard (pike planted low at the side), walk 1..8
   (genuine alternating 8-cycle, 4 ticks each). NO retreat cells:
   heroes never flee; walk covers approach/reposition/stop.
2. **jab1** - guard, windup (pike cocked back), thrust drive, full
   extension (narrow arc 8 - the pike stays on the thrust line),
   follow-through, recover 1, recover 2, guard bookend, guard.
   Fast window (5/4/9): poses snap, no lazy loops.
3. **jab2** - guard, windup, thrust drive, full extension (second angle,
   still on-line), follow-through, recover 1, recover 2, guard
   bookend, guard. Must read distinct from jab1 (different chamber +
   extension), not a copy.
4. **finisher** - guard, windup (wide coil), sweep launch, full
   horizontal sweep at chest height (knockdown blow, pike at max
   extension), follow-through, recover 1, recover 2, guard bookend,
   guard. The mid-sweep direction step is the >60° risk: cell 4 must
   bridge visibly (motion-completing pose, not a jump cut).
5. **jump** - guard, takeoff (crouch-launch), ascent (tucked), apex
   (pike high), kick strike (extended leg + pike swept back, the
   20-tick active pose), descent/retract, ground contact, landing
   crouch, guard bookend.
6. **fall** - guard, topple, airborne, thrown-tumble, side impact,
   settle, DOWN (shared down bookend), DOWN bookend (= 6), guard
   bookend. Dying/dead reuse the fall clip (DOWN is the dead pose);
   the pike stays gripped through the whole arc.
7. **getup** - DOWN (shared with the fall sheet), elbow push-up, kneel,
   crouch, half-rise, stand, steady, guard-approach, guard bookend.
8. **misc** - guard, hurt recoil, hurt fold (ALSO the grabbed pose -
   shared cell by hero dispatch), hurt stagger, escape shove, grab
   clamp (both arms closing), grab hold, release, guard bookend.
   Hurt is PLAYER_HITSTUN ticks; grab is the hero DOING the grabbing.
9. **special** - guard, windup raise, coil, pre-spin, AoE STRIKE (wide
   two-handed sweep, full extension, the 12-tick active pose), follow-
   through, recover, bridge/recover, guard bookend. No projectile, no
   magic effects: the sweep IS the special.
10. **rider** - mounted idle (seated, pike upright), trot A, trot B,
    mount (climbing on), sweep strike (mounted.sweep active), sweep
    windup, sweep recover, dismount, idle bookend. Saddle contact must
    be drawable against the CMR-22 horse later: keep the seat/thigh
    contact poses clean and record the saddle landmark.

## Budget plan (16 total, shared with CMR-09B)

10 sequences x 1 candidate each, then 6 held for seconds/repairs.
At most two whole-sheet candidates per sequence. Reserve in the
generation ledger BEFORE every generation call. If cap exhaustion
blocks completion, record exact BLOCKED input (no partial set).

Suggested order (locomotion first - it sets the scale anchor every
later sheet registers against): walk -> jab1 -> jab2 -> finisher ->
jump -> misc -> fall -> getup -> special -> rider.

## Lessons applied from GYM-1 + CMR-06A/07A/08A (anti-drift prompt rules)

- Uniform-scale language IN EVERY prompt from the first sheet (the 07A
  root cause was per-pose scale-to-fill): "same head size in every
  cell", "do not enlarge small poses to fill their cells", plus the
  guard bookend as an in-sheet scale anchor. Zhang Fei's big head
  (1.04) is the canary: if heads shrink in action cells, reject.
- Heavy-build language IN EVERY prompt ("short heavy torso, bulky
  shoulders, big head") - the generator's default hero is tall/lean
  (that is Zhao Yun, not Zhang Fei).
- Bristle-beard language IN EVERY prompt ("beard stands out from the
  jaw in spikes") - the default smooth wedge reads as Xu Chu.
- NO armor / NO cape / NO helmet language IN EVERY prompt - the
  portrait master shows armor + cape and the generator will smuggle
  them in. Costume is vest + rope belt + trousers + boots only.
- Pike-length language IN EVERY prompt ("very long pike, serpent head,
  red tassel; never shortened") + >=15px edge-margin language for
  raised/extended pike cells (the 08A shoot-c1 root cause: edge-touch
  throws preparation, and no valid pixel repair exists).
- Detached props are UNREPRESENTABLE (08A pipeline limitation): every
  cell must be one connected figure + gripped/touching pike. Dead/drop
  poses show the pike TOUCHING the hand (contact, no gap).
- Per-cell factors are FORBIDDEN (pose-wise normalization); per-sheet
  uniform factors at registration absorb sheet-level offsets (proven
  0.883-1.0 mook range).
- Firing-pose rule does not apply (Zhang Fei is melee), but the
  grapple rule does: the pike stays gripped (or touching) in ALL
  cells incl. hurt/held/tumble/getup/dead.

## 09B handoff notes (recorded now, implemented there)

- Role `hero`, bindings `zf.jab1`/`zf.jab2`/`zf.finisher`/
  `zf.jumpkick`/`zf.special`/`mounted.sweep`. Derive the clip table
  from the core numbers above (NOT Guan Yu's windows): jabs 5/4/9,
  finisher 10/6/18, kick 4/20/0, special 6/12/12, sweep 8/6/14.
- Jump follows airTicks; landing/kicklanding transitions; hurt is
  PLAYER_HITSTUN ticks; fall/getup/dying on the shared KNOCKDOWN/
  GETUP/DYING clocks; thrown reuses fall:3/4; dead is DOWN.
- Rider clips need the CMR-22 horse contract for saddle composition;
  09B binds the rider drawings, CMR-22/23 compose and pair them.
