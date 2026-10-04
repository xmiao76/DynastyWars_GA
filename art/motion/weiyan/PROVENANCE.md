# Wei Yan provenance (CMR-11A)

- Authoring: 9/16 used (walk + jab1 + jab2 + finisher + jump + fall + getup + misc + special accepted). 7 spare.
- Repair reserve: 3/3 untouched (shared with CMR-11B).
- Masters: body `ee0a0200…`, portrait `0fc579c1…` (inspected
  2026-10-03, required before authoring).

## Attempts

### special-candidate-1 (ACCEPTED 2026-10-04) — sha `95c51b7e…`

- Request 9/16 (sheet special 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 whirlwind special + spares, zero
  effects paint. First image call failed with a transient fetch
  error (no image); retried under the SAME reservation (1 image
  for 1 slot, per the 10A 520 precedent).
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 96K, 0 specks).
- Review: keep [0,1,2,3,4] in play order (raise/coil/pre-spin/
  strike/follow) - zero effects paint anywhere (no speed lines
  or glows); dao full in all, clean anatomy, no forks/verticals
  (steepest blade ~45deg, within rule). Cull {5,6,7,8}.

### misc-candidate-1 (ACCEPTED 2026-10-04) — sha `69be09d1…`

- Request 8/16 (sheet misc 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 hurt/grab reactions + spares, dao
  gripped throughout.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 79K, 0 specks).
- Review: keep [0,1,2,3,4] in play order (hurt-recoil/hurt-
  fold/grab-clamp/grab-hold/release) - defined fingers on all
  extended hands, no mittens; dao full in all, clean anatomy,
  no forks/verticals. Cull {5,6,7,8} (clean spares).

### getup-candidate-1 (ACCEPTED 2026-10-04) — sha `78949e6b…`

- Request 7/16 (sheet getup 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 prone-to-stand arc + spares, dao
  gripped throughout.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 64K, 0 specks).
- Review: keep [0,1,2,3,4] in play order (elbow/kneel/crouch/
  half-rise/stand) - stand matches the guard reference; dao
  full in all, clean anatomy, no forks/verticals.
  Cull {5,6,7,8} (clean spares).

### fall-candidate-1 (ACCEPTED 2026-10-04) — sha `cd3d7414…`

- Request 6/16 (sheet fall 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 knockdown arc + spares, dao
  gripped/alongside throughout.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 89K, 0 specks); tumble compact (364x350, no fit risk).
- Review: keep [0,1,2,3,4] in play order (topple/airborne/
  tumble/impact/DOWN) - flat still DOWN bookend verified;
  dao full in all, clean anatomy, no forks/verticals.
  Cull {5,6,7,8} (clean spares).

### jump-candidate-1 (ACCEPTED 2026-10-04) — sha `f2961149…`

- Request 5/16 (sheet jump 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 airborne arc + spares, all feet off
  ground, dao gripped throughout.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 89K, 0 specks); cell bboxes incl. a tall 329x416 apex.
- Review: keep [0,1,6,3,5,7] in play order (takeoff/ascent/
  apex/kick/descent/landing). Cell 2's stretched apex (416px
  tall, steep blade) is CULLED for fit - it would cap base at
  0.644 (guard ~208px, below the hero floor); cell 6's tucked
  ball (303px, horizontal dao) subs as apex (gather-then-
  explode before the kick, same accepted pattern as zhaoyun).
  Cull {2,4,8}. All kept: full uniform dao, clean anatomy.

### finisher-candidate-1 (ACCEPTED 2026-10-04) — sha `8101c921…`

- Request 4/16 (sheet finisher 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 heavy diagonal chop + spares (weightier
  than slash/sweep), identity lock, dao length vs the anchor.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 102K, 0 specks); wide straddles (to 541px) but no merges.
- Review: keep [0,1,2,3,4] in play order (coil/launch/chop-
  extension/impact-follow/recover) - all heavy diagonals within
  the 50deg rule (extension ~35-40deg), clearly weightier than
  the jabs; full uniform dao, clean anatomy, no forks/verticals.
  Cull {5,6,7,8} (clean spares).

### jab2-candidate-1 (ACCEPTED 2026-10-04) — sha `74759595…`

- Request 3/16 (sheet jab2 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 low sweeping combo + spares (clearly
  crouching, distinct from jab1), identity lock, dao length vs
  the anchor.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 86K, 0 specks); wide straddles (up to 579px) but no
  merges (1 component per cell).
- Review: keep [0,1,2,3,4] in play order (low chamber/rising
  drive/full low extension/follow/recover) - all crouching, all
  blades within ~30deg of horizontal (no verticals anywhere),
  full uniform dao, clean anatomy, no forks. Clearly distinct
  from jab1's upright slashes. Cull {5,6,7,8} (clean spares).

### jab1-candidate-1 (ACCEPTED 2026-10-03) — sha `1cd3eb15…`

- Request 2/16 (sheet jab1 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 slash combo + spares, identity lock,
  dao length vs the anchor.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 81K, 0 specks); bboxes 285-550 x 242-339 (no merges).
- Review: keep [0,1,2,3,4] in play order (windup/drive/
  extension/follow/recover) - all read correctly with full
  uniform dao, clean anatomy, no forks. Cell 0 windup is the
  steepest blade (~65°, over the 50° guideline) but its
  component fits (339px) and spares 6/8 are steeper - accepted
  with a flag for the acceptance-4 direction re-check.
  Cull {5,6,7,8} (spares; 6/8 too steep for use).

### walk-candidate-1 (ACCEPTED 2026-10-03) — sha `78491237…`

- Request 1/16 (sheet walk 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`. Prompt: 3x3 guard +
  8-cycle, identity lock, dao low-diagonal, gutters.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 80K, 0 specks); bboxes 315-405 x 318-340 (no merges).
- Review: cell 0 standing guard (planted, dao low-diagonal);
  cells 1-8 genuine alternating 8-cycle; turban/bronze/purple/
  beard/dao-with-guard on all, uniform scale, clean anatomy, no
  forks/verticals/clips. Keep all 9 (guard + 8-cycle).
