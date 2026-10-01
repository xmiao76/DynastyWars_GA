# Wei Soldier — offline continuity review (CMR-06A)

Frame IDs below are the prepared pack's `sequence:position` names. The
pack is `artifacts/motion/soldier/soldier/` (manifest sha256
`7f40bf2fbbf7b326f02dc065dd0be3eb7c30b67612f66602db15094790a2564b`,
deterministic across runs).

## Source manifest

| sequence | source sheet | sha256 (in PROVENANCE.md) | frames |
| --- | --- | --- | --- |
| locomotion | locomotion-candidate-1.png | `cf731091...` | locomotion:0..8 |
| swing | swing-candidate-1.png | `7c9c01a7...` | swing:0..8 |
| hitstun-held | hitstun-held-candidate-1.png | `626255b0...` | hitstun-held:0..8 |
| fall-thrown | fall-thrown-candidate-1.png | `99b596d3...` | fall-thrown:0..8 |
| getup-death | getup-death-candidate-1.png | `9571e790...` | getup-death:0..8 |

## Shared bookends (stable by construction)

Aliased to ONE drawing each, so the displayed pixels are byte-identical
(restored hashes equal, verified by the preparation's dedup counts):

- guard bookend = `locomotion:0` (also `locomotion:8`, `swing:0`,
  `swing:8`, `hitstun-held:0`, `hitstun-held:8`, `getup-death:8`).
- down bookend = `fall-thrown:3` (also `fall-thrown:8`, `getup-death:3`).

## Sequences and transitions (reviewed at preview size, fingerprint-checked)

- **locomotion** `locomotion:0..8`: idle -> walk contact/pass/far-leg/pass2
  (`locomotion:1..4`) -> stop (`:5`) -> retreat `:6,:7` -> guard bookend.
  Legs genuinely alternate (1 vs 3 mirrored, 2 vs 4 mirrored); no repeated
  stance passed as motion. Direction changes are single-step.
- **swing** `swing:0..8`: guard -> windup (`:1`, blade back over the right
  shoulder) -> startup (`:2`) -> active `:3,:4` (chest-height horizontal
  sweep) -> recover `:5,:6,:7` -> guard. Blade direction steps are <= 60
  degrees per adjacent pair with a coherent intervening drawing at the big
  shoulder-to-sweep turn (cell 2 exists between them).
- **hitstun-held** `hitstun-held:0..8`: guard -> recoil/fold/stagger
  (`:1..3`) -> upright held `:4,:5` (both arms pinned, sword still gripped)
  -> escape `:6,:7` (shove then reset) -> guard. One interruption family,
  no cross-family jumps.
- **fall-thrown** `fall-thrown:0..8`: topple (`:0`) -> airborne (`:1`) ->
  impact (`:2`) -> down (`:3`) | thrown tumble `:4,:5` (rotated both ways)
  -> side impacts `:6,:7` -> down bookend (`:8` = `:3`). Fall and thrown
  branches share the down bookend exactly.
- **getup-death** `getup-death:0..8`: elbow push (`:0`) -> kneel (`:1`) ->
  crouch (`:2`) -> down bookend (`:3` = `fall-thrown:3`) | dying jolt (`:4`)
  -> knee collapse (`:5`) -> crumple (`:6`) -> dead (`:7`) -> guard bookend.
  The getup branch returns to the shared guard; the dying branch terminates
  in `:7`.

No crossfade/ghost frames, double limbs or forked blades were seen in the
45 displayed drawings (37 unique + 8 aliases); identity (helmet, oxblood
lamellar, boots) and the rigid straight sword hold across every sheet.
Registration: every figure's ground contact is anchored to the box ground
line by construction (intended grounded error 0; no clipped helmet finial,
boots or blade in any cell - mechanical edge-cut check = 0).

## Landmark evidence (acceptance 4) - PARTIAL, honest unknowns remain

Automated pixel proxies over the 45 frames (artifacts land in
`artifacts/motion/soldier/landmarks/` as manual-review crops):

- weapon length (steel-mask bbox diagonal, angle-independent for a straight
  blade): the 7 visually fully-observable, unoccluded frames measure
  283..305px = **7.5% spread (within 10%)**. Frames where the blade is
  occluded, foreshortened or the mask mixes armour steel measure 182..391
  and are recorded `unverified` (unknowns cannot establish compliance).
- head-size proxy (top-band width of upright figures) is method-
  contaminated (stray weapon tips read as narrow bands): recorded
  `unverified` pending manual landmark review.

Therefore acceptance item 4 is NOT YET ESTABLISHED: the <=10% claim rests
on 7 observable weapon frames and needs producer/owner landmark
confirmation (head sizes + full weapon extents at 4x) before the pack is
called compliant. The manual-review crops are the input for that review.
