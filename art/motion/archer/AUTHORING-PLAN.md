# Wei Archer — authoring plan (CMR-08A)

Core data (read 2026-10-02, never from prompt memory): HP 18, speed 0.8,
`attackId: ''` (NONE - no melee attack state), hitstun 16 ticks, think 40,
fireInterval 90. AI holds range band 90-150, fires when |dy| <= 6 and
dist <= 220; arrows spawn instantly on think ticks (speed 3, chest height
z=40, spawn offset 10 from the bow). No windup/release states exist - the
motion design observes spawns (CMR-02 `shooterProfile`: no melee
bindings, `releaseFollowsProjectileSpawn`, 90-tick cadence).

## Sheet layouts (all 3x3, 1536x1024, cells 512x341)

Same scale/camera/ground line, transparent background, no glow/shadow/
text/panels/effects, full figure + full weapon inside every cell, painted
semi-realism, upper-left key light, 3/4 front-right. Ordered references
per request: `[body master, portrait master]` (hashes in IDENTITY.md).

1. **locomotion** - idle guard (bow held low at the side), walk/contact,
   walk/pass, walk far-leg, walk second pass, stop, retreat 1, retreat 2,
   idle bookend (cell 9 = cell 1, shared guard bookend). Retreat matters:
   the AI backs off inside min range constantly.
2. **shoot** - guard, draw 1 (bow rising), draw 2 (half draw, arrow
   nocking), full draw (anchor at cheek, arrow nocked, string taut),
   release (string loose, arrow GONE - absence is the cue), follow-
   through, reload 1 (fresh arrow to string), reload 2 (settle), guard
   bookend. Firing poses are planted/braced, NEVER mid-stride: idle
   firing must not read as walking in place.
3. **hitstun-held** - guard, recoil, fold, stagger (16 ticks), held
   upright x2 (arms pinned, BOW still gripped - never dropped), escape
   shove/reset, guard bookend.
4. **fall-thrown** - topple, airborne, impact, DOWN bookend, thrown
   tumble x2 (rotated both ways), side impacts x2, DOWN bookend
   (cell 9 = cell 4).
5. **getup-death** - elbow push-up, kneel, crouch, DOWN bookend (shared
   with the fall sheet), fatal jolt, knee collapse, crumple, dead on
   side (bow resting beside the hand), guard bookend.

## Budget plan (8 total, shared with CMR-08B)

5 sequences x 1 candidate each, then 3 held for targeted repairs/seconds.
At most two whole-sheet candidates per sequence. Reserve in the
generation ledger BEFORE every generation call. If cap exhaustion blocks
completion, record exact BLOCKED input (no partial set).

## Lessons applied from CMR-06A/07A (anti-drift prompt rules)

- Uniform-scale language IN EVERY prompt from the first sheet (the 07A
  root cause was per-pose scale-to-fill): "same head size in every cell",
  "do not enlarge small poses to fill their cells", plus the guard
  bookend as an in-sheet scale anchor.
- Witness-free grids (bookends serve as the scale reference); per-sheet
  uniform factors at registration absorb sheet-level offsets (proven
  0.883-1.0 range); per-cell factors are FORBIDDEN (pose-wise
  normalization), same rule as 07A.
- Landmark design (open item, crystallizes at measurement): weapon =
  undrawn-bow chord (carry poses) + nocked-arrow length (draw poses);
  each class measured against its own reference, then a normalized
  combined spread. Heads via face-cluster sqrt-area. Unknowns unverified.
- Bows bend; arrows don't. Prompts name which: drawn poses show a bent
  bow + straight nocked arrow; release shows a relaxed bow + NO arrow;
  carry poses show the relaxed bow alone. No forked strings, no bent
  arrows, no floating arrowheads.

## 08B handoff notes (recorded now, implemented there)

- Role `shooter` (`shooterProfile('archer')`): bind NO melee attacks;
  release presentation follows the arrow-spawn event on the 90-tick
  cadence. Clip table needs a shoot cycle driven by spawn observation,
  not an attack state clock.
- Locomotion covers approach/retreat/reposition (the AI's whole movement
  vocabulary); hitstun 16 ticks; shared KNOCKDOWN/GETUP/DYING clocks.
