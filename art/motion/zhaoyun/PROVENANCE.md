# Zhao Yun motion pack — provenance (CMR-10A)

Every image request: reserved BEFORE the call, prompt + ordered
reference hashes + verdict recorded here. Budget: 16 shared across
10A/10B; repair reserve (3 rounds) separate, only for diagnosed
source-art defects after a failed acceptance 4.

## Repair round 1 — diagnosis (2026-10-03; execution next)

Method: TRUE endpoint lengths (gold-butt-cluster to steel-tip direct,
overlay-verified per cell) for all 15 uncertain cells (6 adjudicator
misfits + 9 low/borderline FULLs). The RANSAC axis fits are unreliable
on occluded shafts (6 proven misfits); the endpoint-direct lengths are
the diagnostic truth (all 15 overlays eyeball-verified).

- CONFIRMED FINE (no action; RANSAC understated): getup:0 (418),
  getup:2 (464), getup:3 (446), special:1 (422), finisher:3 (472).
- CONFIRMED SHORT (redraw in R1): getup:1 (338, kneel vertical),
  getup:4 (233, stand vertical), special:4 (393), finisher:4 (381),
  rider:5 (391), misc:1 (412), jab1:3 (416). All 12-50% under the
  ~470 raw mass with verified butt+blade endpoints.
- UNVERIFIED (butt occluded or endpoint ambiguous; excluded, not
  redrawn blind): jab2:1, jab2:2 (butt endpoints landed on boot
  buckles - true butts hidden behind torsos), misc:3 (butt
  endpoint suspect, needs manual locate). Revisit in round 2 if
  the comparable sample cannot establish compliance without them.
- ROUND 1 PLAN (7 cells, under the 9-max): getup:1, getup:4,
  special:4, finisher:4, rider:5, misc:1, jab1:3 - one grid-
  constrained redraw sheet (bracket anchors: walk:0 461 + a long
  cell; per-cell full-length targets; no-vertical rule for the
  getup verticals), composite into sheet copies, re-prepare,
  re-measure. Reserve + execute next turn. Manual frontal head
  measurement rides along.

## Acceptance-4 verdict (2026-10-03) — FAIL on weapon length; repair round 1 queued

Method: spear-line (RANSAC + tip-to-butt extension) + presence-based
endpoint adjudication + landmarks-final record (adapted from the 09A
scripts; largest-wins mapping throughout). Overlay + suspect strips +
face forensics reviewed with the image tool on fingerprinted files.

- WEAPON LENGTH: raw adjudicator FULL 39/56, spread 85.3% (140-397.6).
  Overlay verification PROVED 6 FULL cells are geometric misfits
  (fitted axis visibly off the shaft, locking onto body diagonals
  through boot-leather pixels: getup:1, special:1, special:4, jab2:1,
  jab2:2, finisher:3 - strip filed in ignored artifacts). CORRECTED
  FULL (misfits removed on geometric grounds, documented per cell):
  n=33, 233.1-397.6, spread 50.6% (min getup:4 stand, max
  finisher:1 drive). Walk family alone: 9/9, 9.4% PASS. VERDICT:
  FAIL - genuine short spears remain (getup verticals + mid-range
  cells), not measurement noise.
- DIRECTION: raw 3 violations >60deg; all invalid on review (2
  involve geometric misfit axes; getup:3->4 is a vertical sign-flip
  artifact, 37deg undirected). CORRECTED: 0 valid violations. PASS.
- HEAD: auto face-cluster method VOID for this fighter (proven:
  forensic strips show the "face" boxes on helmet trim + plume
  shadows, which pass the skin gate; even walk:0's box misses the
  face). Reported D0/D1/D2 spreads (100/48/58%) are meaningless.
  Indirect scale evidence is consistent (guard figures post-factor
  ~5%, trim blobs 5.5%, face-to-ground consistent) - no drift
  detected, but no valid direct head measurement either. VERDICT:
  UNVERIFIED - manual frontal brow-to-chin measurement queued
  alongside repair round 1.
- OVERALL: FAIL (weapon length) -> acceptance-4 repair protocol,
  round 1 next: diagnose true shorts per cell (incl. re-measuring
  the 6 misfits + the unexamined getup row), focused redraws,
  re-prepare, re-measure. Repair reserve 3/3 untouched; authoring
  15/16 (1 spare preserved, not spent on repairs).

## Attempts

### tallcell-redraw-2 (ACCEPTED 2026-10-03) — sha `70372e0d…`

- Request 15/16 (focused). Refs in order: fall:0 original
  `6db22c11`, jump:2 original `a5d455d8`, body master `a1067c2a`.
  Prompt: 3x3 grid with ONLY 2 cells drawn (compact tucked topple
  at cell 0, compact apex with diagonal spear at cell 1, rest
  transparent, grid forces sheet-native scale).
- Mechanical: 2 survivors, glow 21K, specks 11px; bboxes 483x325
  (topple) + 598x342 (apex) - both WELL under the 380px target
  (vs 422/404 originals). Identity/poses verified: tucked
  backward topple + diagonal-spear apex, full spears, no forks.
- Composited (scripted, originals untouched) into
  fall-candidate-1b.png (cell 0) + jump-candidate-1b.png
  (cell 2), centred on the replaced bboxes with sheet-edge
  clamping (first paste overflowed past x1536 and tripped the
  clipped-figure gate - clamping fixed it); both composites
  census 9 clean, no merges. SHEETS now reads the -1b files.

### tallcell-redraw-1 (REJECTED 2026-10-03) — sha `023ca536…`

- Request 14/16 (focused). Same 3 refs; prompt: two compact
  redraws side by side on one free-form canvas. VERDICT: unusable
  - without a grid to constrain scale, both drawings came out
  HUGE (748x514 + 750x720 bboxes vs 467x446 / 509x428 originals;
  the apex is TALLER than the cell it replaces). Lesson: redraws
  must be grid-constrained (c2 proves it). File kept in ignored
  artifacts/tmpcheck (failed focused edit, not a source).

### rider-candidate-1 (ACCEPTED 2026-10-03) — sha `b6880a32…`

- Request 13/16 (rider sheet 1/2). Refs in order: body `a1067c2a`,
  portrait `dff59167`, walk-guard anchor `6aacc58c` (512x341 cell 0
  crop, as the length anchor per plan). Prompt: 3x3 mounted set
  (idle/trot/mount/windup/sweep/dismount + spares; invisible horse;
  NO horse/saddle/stirrups drawn) + identity + length contract +
  split rule + no-vertical rule.
- Mechanical: 1536x1024; opaque≥96 share 32.8%; sheet-edge 0px;
  28 components @96 -> 9 survivors, all cells covered, glow
  109422, specks 30px; gate green.
- Length spot-check: 396-627 raw, strong inliers (151-238) except
  the foreshortened dismount (101). The long ends (cell 4: 627,
  cell 7: 593) are full spans INCLUDING clean straddle (bboxW
  662/597), not over-long drawings. No shorts anywhere - the
  guard-anchor bracketing + no-vertical rule held on the hardest
  sheet (compare 09A rider's 348px failures).
- Visual (gameplay + 2x zooms cells 3/4/5): windup twisted with
  spear back; sweep at full horizontal max reach straddling
  cleanly; dismount leaning with complete diagonal spear. All
  riders seated straddling (thighs/knees/dangling feet), no horse
  parts drawn. Identity locked; wrapped fingers; single full
  spears; uniform heads; cape behind; no clipping, drift, extra
  limbs, forks, panels, or text.
- Keep/cull (provisional, finalized at prepare): keep IN PLAY
  ORDER [1,6,2,3,4,5] (idle, trot, mount, windup, sweep,
  dismount); cull {0,7,8} in memory.
- ALL 10 SEQUENCES now accepted. Remaining: prepare, landmark
  acceptance, continuity review.

### special-candidate-1 (ACCEPTED 2026-10-03) — sha `604252d3…`

- Request 12/16 (special sheet 1/2). Refs: body `a1067c2a`,
  portrait `dff59167`. Prompt: 3x3 whirlwind sweep per
  AUTHORING-PLAN (raise/coil/pre-spin/strike/follow + spares;
  sweep IS the special, no effects) + identity + length contract
  + split rule + no-vertical rule.
- Mechanical: 1536x1024; opaque≥96 share 26.5%; sheet-edge 0px;
  20 components @96 -> 9 survivors, all cells covered, glow
  115210, specks 19px; gate green.
- Length spot-check: quick-RANSAC numbers (243-634, inliers
  64-190, one no-axis) are MEANINGLESS on this sheet - sweep
  poses wrap body/hands around the shafts, fragmenting the wood
  mask (cell 1 measured 243 yet its bbox crop shows a complete
  butt-to-blade spear). Full-bbox crops PROVE cells 0+1 whole;
  2x zooms PROVE cells 2/3/4 whole (butt + blade + tassel each).
  All 9 spears visually full-length; no shorts. Standing lesson:
  on occluded poses only the endpoint-adjudicated acceptance-4
  method counts; the quick tool is a no-axis/gross-gap screen.
- Visual (gameplay + 2x zooms + bbox crops): raise/coil/pre-spin/
  strike/follow arc genuine; no projectiles/glow/effects (sweep
  IS the special, as briefed); identity locked; wrapped fingers;
  single full spears; uniform heads; cape flares correctly; no
  clipping, drift, extra limbs, forks, panels, or text.
- Keep/cull (provisional, finalized at prepare): the generator
  placed the arc at cells 0-4, so keep [0,1,2,3,4]; cull
  {5,6,7,8} in memory.

### misc-candidate-2 (ACCEPTED 2026-10-03) — sha `4cfc8b14…`

- Request 11/16 (misc sheet 2/2; first tool call 520'd with no
  image, retried under the same reservation - 1 image for 1 slot).
  Refs: body `a1067c2a`, portrait `dff59167`. Prompt: same 3x3
  misc with the NO-VERTICAL rule (every spear diagonal or near-
  horizontal, straddle allowed).
- Mechanical: 1536x1024; opaque≥96 share 35.6%; sheet-edge 0px;
  21 components @96 -> 9 survivors, all cells covered, glow
  101472, specks 37px; gate green.
- Length spot-check: 403-532 raw, ALL axes near-horizontal
  (+/-23deg), inliers 108-154 - no misfits, no verticals, no
  shorts. The no-vertical rule fixed the defect class.
- Visual (gameplay + 2x zooms cells 1/3/4 and 0/5/7): all five
  slots verified - recoil (rocked back, hand up), fold (doubled
  clutching; the 412 measurement is occlusion, the full spear is
  visible butt-to-blade), clamp (reaching snatch), hold (locked
  lunge), release (arm opening sideways). Identity locked;
  wrapped fingers; single full spears; uniform heads; no second
  figure anywhere; no clipping, drift, extra limbs, forks,
  panels, or text.
- Keep/cull (provisional, finalized at prepare): keep IN PLAY
  ORDER [0,1,7,3,4] (recoil, fold, clamp, hold, release); cull
  {2,5,6,8} in memory (all clean, surplus).

### misc-candidate-1 (REJECTED 2026-10-03) — sha `352774b4…`

- Request 10/16 (misc sheet 1/2). Same refs + misc brief WITHOUT
  the no-vertical rule. VERDICT: systematic short vertical spears
  (5+ cells): a full 470px spear cannot stand vertically in a
  341px cell, so the generator drew contained ~300px spears
  instead of straddling (proven: every component bboxH <= 341, no
  vertical straddle anywhere; RANSAC 178-337, meaningless on
  verticals). No remap possible (fold/clamp/hold have no diagonal
  alternatives on this sheet). File kept as
  misc-candidate-1-REJECTED.png for the record. Lesson: poses must
  never brief vertical spears (see AUTHORING-PLAN rule, now
  confirmed by c2's success).

### getup-candidate-2 (ACCEPTED WITH FLAG 2026-10-03) — sha `40aaac55…`

- Request 8/16 (getup sheet 2/2). Refs: body `a1067c2a`,
  portrait `dff59167`. Prompt: same 3x3 getup with the CRITICAL
  LAYOUT RULE (25px gutters, figures compact, spears angled to fit
  inside - no straddling).
- Mechanical: 1536x1024; opaque≥96 share 25.9%; sheet-edge 0px;
  19 components @96 -> 9 survivors, all 9 cells covered, glow
  79137, specks 13px; gate green. Separation fixed.
- DEFECT (diagnosed, not fatal): the no-straddle rule forced the
  two VERTICAL spears short - kneel (cell 1) and stand (cell 4)
  measure ~300px vs the ~470 mass (~65%, RANSAC corroborates the
  visual). My brief's overcorrection (same conflict class as 09A's
  fit-vs-length failure, inverted). These two cells are FLAGGED
  for the acceptance-4 repair protocol (redraw with full-length
  diagonal spears that may straddle); repair reserve untouched
  (3/3). Arc/identity/anatomy verified (elbow/kneel/crouch/half-
  rise/stand all present; keep [0,1,2,8,4], cull {3,5,6,7}).
- The gutter-for-figures + straddle-for-spears split rule is now
  explicit in AUTHORING-PLAN (edit below).

### getup focused edit (REJECTED 2026-10-03) — sha `24d32106…`

- Request 9/16 (focused, no sequence cap). Refs: getup-candidate-2
  `40aaac55` alone. Prompt: surgical - lengthen ONLY the kneel +
  stand spears to full 72-unit diagonal, keep everything else
  identical. VERDICT: failed doubly - spears unchanged AND the
  background repainted dense (757728 residue px vs 150000
  tolerance -> pipeline gate throws). File kept in ignored
  artifacts/tmpcheck (failed edit, not a source). Lesson: this
  edit path cannot do surgical spear fixes; the repair protocol
  (fresh cells, not in-place edits) is the right backstop.

### getup-candidate-1 (REJECTED 2026-10-03) — sha `591007b5…`

- Request 7/16 (getup sheet 1/2). Gate showed 7 survivors, not 9:
  TWO MERGES proven by component mapping - kneel+stand (cells 1+4,
  one 530x699 component spanning the row line) and prone-spare+
  oath (cells 5+8). Four cells unusable incl. two key poses, no
  stand substitute anywhere -> sheet rejected (file kept as
  getup-candidate-1-REJECTED.png for the record).

### fall-candidate-1 (ACCEPTED 2026-10-03) — sha `bc1ee39a…`

- Request 6/16 (fall sheet 1/2). Refs in order: body master
  `a1067c2a`, portrait master `dff59167`. Prompt: 3x3 knockdown
  per AUTHORING-PLAN (topple/airborne/tumble/impact/DOWN + spares)
  + identity lock + length contract + cape rule.
- Mechanical: 1536x1024; opaque≥96 share 33.1%; sheet-edge 0px;
  27 components @96 -> 9 survivors after cleanup (glow 103044,
  specks 25px, within tolerance); gate green.
- Length spot-check: 415-592 raw, all axes sane with strong
  inliers (171-369, no misfits). The DOWN reads longest (592 -
  full flat span, spear + body inline) and the tumble shortest
  (415 - steep diagonal foreshortening): POSE geometry, not drawn
  drift - both spears visually complete with butt + blade + tassel.
  No shortened cells.
- Visual (gameplay + 2x zooms cells 2/3/4): tumble curled upside-
  down with spear diagonal; impact side-lying on the shoulder;
  DOWN flat on back, motionless, eyes closed, spear gripped
  loosely alongside - the shared bookend, clean and still.
  Identity locked (helmet/plume readable even prone); no extra
  limbs, forks, clipping, drift, panels, or text. Neighbor slivers
  at tile edges are clean straddles (9 survivors, no merges).
- Keep/cull (provisional, finalized at prepare): the generator
  placed the arc at cells 0-4, so keep [0,1,2,3,4]
  (topple/airborne/tumble/impact/DOWN); cull {5,6,7,8} in memory.

### jump-candidate-1 (ACCEPTED 2026-10-03) — sha `31340a8e…`

- Request 5/16 (jump sheet 1/2). Refs in order: body master
  `a1067c2a`, portrait master `dff59167`. Prompt: 3x3 jump + aerial
  kick per AUTHORING-PLAN (takeoff/tuck/apex/kick/fold/landing +
  spares) + identity lock + length contract + cape rule.
- Mechanical: 1536x1024; opaque≥96 share 29.6%; sheet-edge 0px;
  25 components @96 -> 9 survivors after cleanup (glow 108130,
  specks 30px, within tolerance); gate green.
- Length spot-check: tip-to-butt 432-544 raw, all axes near-
  horizontal with strong inliers (128-241) - no misfits this time.
  The apex cell (2) reads ~10-15% under the mass both measured
  (432 vs ~470-500) and visually (diagonal overhead carry):
  FLAGGED as an acceptance-4 watch item (repair nudge if the pack
  band demands it), not a reject - well above the 09A gross-
  shortening failures. Everything else in-band.
- Visual (gameplay + 2x zooms cells 2/3/7): apex stretched tall
  with spear high; kick money pose (extended leg, tucked other,
  spear swept back, airborne); landing deep crouch braced. Identity
  locked; wrapped fingers; single shafts; uniform heads; cape
  streams correctly; no clipping, drift, extra limbs, forks,
  panels, or text. Neighbor slivers at tile edges are clean
  straddles (9 survivors, no merges).
- Keep/cull (provisional, finalized at prepare): the generator
  placed kick at 3 (not 4), so keep IN PLAY ORDER [1,0,2,3,5,7]
  (takeoff, ascent-spare, apex, kick, descent, landing); cull
  {4,6,8} in memory. Order matters - prepare must map positions
  in this sequence, not sorted.

### finisher-candidate-1 (ACCEPTED WITH REMAP 2026-10-03) — sha `9fe37b20…`

- Request 4/16 (finisher sheet 1/2). Refs in order: body master
  `a1067c2a`, portrait master `dff59167`. Prompt: 3x3 heavy sweep
  per AUTHORING-PLAN (cells 1-5 = coil/launch/bridge/impact/follow;
  0/6/7/8 spares) + identity lock + length contract + cape rule.
- Mechanical: 1536x1024; opaque≥96 share 33.0%; sheet-edge 0px;
  28 components @96 -> 9 survivors after cleanup (glow 112812,
  specks 33px, within tolerance); gate green.
- DEFECT FOUND + RESOLVED WITHOUT NEW REQUESTS: cell 2 (drive)
  carries an EXTRA blade-like shaft at bottom-center. Flood ownership
  proof: all 17 probe pixels belong to cell 2's own component
  (area 64640) - not a neighbor straddle. Verdict: forked/duplicated
  weapon element -> cell 2 REJECTED per the no-forks rule. Salvage:
  spare cell 6 (mid-lunge, horizontal spear) reads naturally between
  coil (cell 1) and extension (cell 3) - verified side-by-side in
  play order. Final map: keep {1,6,3,4,5}, cull {0,2,7,8}.
- Length spot-check: quick-RANSAC numbers (221-566) are method noise
  on this sheet (occluded/diagonal poses fragment the mask; steep-
  axis misfits on cells 4/5/7/8). Full-bbox crops PROVE cells 4+5
  whole (butt + blade + tassel each, straddling cleanly, no merges).
  No shortened spears observed anywhere; rigorous endpoint
  adjudication lands after all sheets.
- Visual (gameplay + 2x zooms + bbox crops): sweep arc reads
  coil -> drive -> extension -> follow -> recover; identity locked;
  wrapped fingers; single shafts (except rejected cell 2); uniform
  heads; cape behind; no clipping, drift, extra limbs, panels, text.

### jab2-candidate-1 (ACCEPTED 2026-10-03) — sha `3dc80660…`

- Request 3/16 (jab2 sheet 1/2). Refs in order: body master
  `a1067c2a`, portrait master `dff59167`. Prompt: 3x3 low second
  hit per AUTHORING-PLAN (cells 1-5 = chamber-low/drive/extension/
  follow/recover with the LOW chamber differentiator; 0/6/7/8
  spares) + identity lock + length contract + cape rule.
- Mechanical: 1536x1024; opaque≥96 share 31.6%; sheet-edge 0px;
  18 components @96 -> 9 survivors after cleanup (glow 102426,
  specks 12px, within tolerance); gate green.
- Length spot-check: the quick RANSAC tool misfit cells 2/3
  (279 @ -66deg, 302 @ -32deg - steep-axis lock onto the diagonal
  lunge + fragmented shaft mask). Full-bbox crops PROVE both spears
  whole (butt cap + leaf blade + tassel, straddling cleanly with no
  merges: bboxes 627/605px vs 512 cells). All 9 spears visually
  full-length; no shortened cells. Lesson recorded: the quick tool
  is a gross-shortening screen only - occluded/diagonal poses need
  the bbox check or the full adjudicator.
- Visual (gameplay + 2x zooms cells 1/2/3 + bbox crops 2/3): low
  chamber reads DISTINCT from jab1's high coil; drive/extension arc
  genuine; identity locked; wrapped fingers; single shafts; uniform
  heads; cape behind; no clipping, drift, extra limbs, forks,
  panels, or text.
- Keep/cull (provisional, finalized at prepare): keep cells 1-5,
  cull 0/6/7/8 in memory.

### jab1-candidate-1 (ACCEPTED 2026-10-03) — sha `e90fb80b…`

- Request 2/16 (jab1 sheet 1/2). Refs in order: body master
  `a1067c2a`, portrait master `dff59167`. Prompt: 3x3 combo opener
  per AUTHORING-PLAN (cells 1-5 = windup/drive/extension/follow/
  recover; 0/6/7/8 alternate takes as cull spares) + identity lock
  + length contract + cape rule.
- Mechanical: 1536x1024; opaque≥96 share 29.9%; sheet-edge 0px;
  28 components @96 -> 9 survivors after cleanup (glow 104129,
  specks 34px, within tolerance); gate green.
- Length spot-check (same RANSAC method): tip-to-butt 382-560 raw.
  The wide spread is METHOD noise, not drawn variance: the low-
  inlier cells (106-155 vs 157-262 elsewhere) are arm-occluded
  thrusts where the shaft mask fragments, and angled poses project
  shorter in 2D. Visually all 9 spears span full length (no
  09A-style shortened outliers). Rigorous endpoint-adjudicated
  measurement lands after all 10 sheets, per the plan.
- Visual (gameplay + 2x zooms cells 1/2/3): thrust arc reads
  coil -> drive -> full extension; identity locked (helmet/plume,
  fair beardless face, silver armor, blue robe + red sash, cape
  behind, boots); wrapped fingers, single shafts with leaf blade +
  gold collar/butt + red tassel; uniform heads; no clipping,
  drift, extra limbs, forks, panels, or text.
- Keep/cull (provisional, finalized at prepare): keep cells 1-5,
  cull 0/6/7/8 in memory.

### walk-candidate-1 (ACCEPTED 2026-10-03) — sha `ee9cc74d…`

- Request 1/16 (walk sheet 1/2). Refs in order: body master
  `a1067c2a` (jpg 720x1280), portrait master `dff59167` (png
  1145x1374). Prompt: 3x3 guard + 8-cycle per AUTHORING-PLAN (identity
  lock, 72-unit rigid spear with the length contract, cape rule,
  helmet headroom, transparent bg).
- Mechanical: 1536x1024; opaque≥96 share 26.6%; sheet-edge 0px;
  20 components @96 -> 9 survivors after cleanup (glow 103103,
  specks 17px, within the 150000 tolerance); gate green.
- Length spot-check (tip-to-butt RANSAC + both-end extension, same
  method as zhangfei): 430-474 raw across 9 cells (9.7% spread,
  axes -5..-15deg, inliers 163-204) - no shortened outliers; the
  length contract holds on sheet 1.
- Visual (gameplay + 2x zooms cells 0/4/8): identity locked in all
  cells (helmet + red plume, fair beardless bold face, silver
  armor, blue robe + red sash, cape behind, boots); genuine
  alternating strides (guard/stride/kick-back all distinct); hands
  wrap with defined fingers; single spear shafts with leaf blade +
  gold collar/butt + red tassel; uniform head size; no clipping,
  drift, extra limbs, forks, panels, or text.
- Note: the preview composite shows a dark backdrop, but pixel
  measurement proves it is sub-96 haze (stripped by cleanup) over
  transparency - file verified, not eyeballed.

## Budgets

- Authoring: 15/16 used (10 sequence sheets + getup c1 + misc c1 + getup edit + 2 tallcell redraws). 1 spare.
- Repair reserve: 3/3 untouched. Shared with CMR-10B.
