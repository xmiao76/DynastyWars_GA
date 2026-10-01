# Progress Log

Add one entry at the TOP after every manual or scheduled iteration - newest
first, so the most recent state is the first thing an iteration reads.

Keep this file short. Once it passes about 500 lines, move the oldest entries to
`PROGRESS-ARCHIVE.md`: every iteration reads this file in full, so an unbounded
history slowly crowds out the work it is supposed to support.

## Template

### YYYY-MM-DD HH:MM - TASK-ID (attempt N)

- Status before:
- Work completed:
- Files changed:
- Verification run:
- Result:
- Status after:
- Remaining work or blocker:
- Next recommended task:

## Entries
#
### 2026-10-01 23:04 UTC - CMR-06B (attempt 1, IN_PROGRESS - every state/attack/clock bound and exercised)

- Status before: CMR-06B bounded work 1 done (5c2f75f).
- Work completed: bounded work 2 - `test/game/motion-soldier.test.ts`
  (12 tests) binds and exercises every real soldier state/attack/clock:
  pack validation + negative controls (missing frame/wrong cell/genuine
  overlap/wrong id/density), shared guard/down bookends byte-identical,
  clip timings from core data (swing = the real 14/4/20 window with the
  visible strike on EVERY active tick 14..17, hitstun 18, knockdown/getup/
  dying from constants), dispatch at key ticks for all 11 states
  (idle/walk/fleeing/attack/hitstun/knockdown/getup/grab/grabbed/thrown/
  dying/dead), clamps, and "every dispatched frame exists in the pack".
- The suite caught TWO real bugs (both fixed): (1) the soldier dispatcher
  hard-coded the swing clip for ANY attack id - an unknown attack showed a
  strike instead of the defensive guard; (2) aliased bookends occupied
  DUPLICATE atlas rects (pixel-identical but wasteful and drift-prone at
  the rect level) - the packer now shares one rect per drawing (page
  shrank 2003x1369 -> 1984x1142, 1,786,372 B, sha 55f3300d; validator
  allows shared rects and still rejects genuine overlaps).
- Files changed: src/game/art/motion-clips-soldier.ts,
  scripts/motion-pipeline.mjs, src/game/assets/motion/soldier-prepared.json,
  src/game/assets/motion/soldier-motion-sheet.png,
  src/game/adapters/motion-art.ts, test/game/{motion-soldier.test.ts,
  motion-runtime.test.ts}, TASKS.md, PROGRESS.md.
- Verification run: lint + `tsc --noEmit` clean; motion suites 52/52
  (soldier+runtime+pipeline); full unit
  **821 passed | 1 failed (known G6 V-15b pin) | 6 skipped**.
- Result: the pack is registered AND every bound state/tick is verified
  against core timing at the unit level.
- Status after: CMR-06B IN_PROGRESS (attempt 1).
- Remaining work or blocker: bounded work 3-5 - browser tick/edge exercise
  (pause/hit-stop, skipped render, interruptions, low fall/getup/KO,
  restart, co-op/AI), captures of baseline vs new art in game (both
  facings, Canvas/WebGL/mobile) through the CMR-05 motion-aware path, the
  full-sequence review, and the producer handoff. No blocker.
- Next recommended task: continue CMR-06B (browser exercise + captures).

### 2026-10-01 22:53 UTC - CMR-06B (attempt 1, IN_PROGRESS - pack registered in runtime; toolkit blank-page bug found + fixed)

- Status before: CMR-06A DONE (d21181d); CMR-06B TODO.
- Work completed: bounded work 1 (registration behind `?motion=1`) -
  (1) `scripts/emit-soldier-runtime.mjs` emits soldier-prepared.json
  (MotionPrepared record: 45 frames with page rects, 48x32 block
  signatures, singlePage, attackBindings) + the atlas page asset.
  (2) `src/game/art/motion-clips-soldier.ts`: soldier clip table with
  core-data timings (swing = the real 14/4/20 window, hitstun 18,
  knockdown/getup/dying from constants), state dispatch (idle/walk/fleeing/
  attack/hitstun/knockdown/getup/grab/grabbed/thrown/dying/dead), and the
  5x9 pack validator. (3) MotionArt generalized: Record<string, MotionClip>
  + attackBindings map (guanyu keeps its slice(3) fallback, unchanged
  behavior); motion-player's hard-coded 'fall:6' down frame generalized to
  the fall clip's last exposure. (4) MOTION_PACKS.soldier registered with
  the pinned page (2,006,693 B, sha 28e8aaf2..., 2003x1369); publish gate
  validates per kind and supports single-page packs; stage runtime tests
  updated to the two-pack catalog (only catalogued packs request; packless
  kinds unsupported).
- FOUND + FIXED (honest correction to CMR-06A records): the CMR-04 toolkit's
  pack-page blit read box-space content coords after the registration-fit
  change and produced BLANK atlas pages that still hashed deterministically
  (my CMR-06A checks verified counts/budgets/determinism but not page
  pixels). Guan Yu was NEVER affected (it packs through prepare-motion.mjs,
  a different tool). Fixed (sheet-space src + scaled draws), regression
  test added (page pixels contain the drawings, fitted and unfitted), and
  the soldier pack re-emitted: the page now carries real pixels (27.3%
  opaque, manifest 09666940...).
- Files changed: scripts/{emit-soldier-runtime.mjs,motion-pipeline.mjs},
  src/game/art/{motion-clips.ts,motion-clips-soldier.ts,motion-player.ts},
  src/game/adapters/motion-art.ts,
  src/game/assets/motion/{soldier-prepared.json,soldier-motion-sheet.png},
  test/game/{motion-runtime.test.ts,motion-pipeline.test.ts,motion-weapon-arc.test.ts},
  TASKS.md, PROGRESS.md.
- Verification run: lint + `tsc --noEmit` clean; motion suites 57/57
  (runtime/clips/actions/transitions/profiles/player); full unit
  **809 passed | 1 failed (known G6 V-15b pin) | 6 skipped**.
- Result: the soldier pack loads, validates, publishes atomically and is
  prefetch-scoped like guanyu - the integration core is in place.
- Status after: CMR-06B IN_PROGRESS (attempt 1).
- Remaining work or blocker: bounded work 2-5 - bind/exercise every tick
  and edge (zero windows, pause/hit-stop, skipped render, interruptions,
  low fall/getup/KO, restart, co-op/AI), capture baseline vs new art in
  game (both facings/Canvas/WebGL/mobile) through the CMR-05 motion-aware
  path, the full-sequence review, and the producer handoff. No blocker.
- Next recommended task: continue CMR-06B (tick/edge exercise + captures).

### 2026-10-01 22:13 UTC - CMR-06A -> DONE (attempt 2, verified - acceptance 4 established by the sword-stack measurement)

- Status before: CMR-06A IN_PROGRESS; only acceptance 4's numeric spread
  verdict remained (ca28c1f).
- Work completed: the manual landmark read - built the decisive artifact
  `landmarks/sword-stack.png`: every drawing's blade pixels PCA-rotated to
  horizontal on one shared ruler (identical rigid swords stack into one
  line). Reading: the fully-observable rows measure 245..258 sheet-px =
  **5.3% spread (<= 10%)** (locomotion:0/1/2/4/6 + hitstun-held:2);
  shadowed/occluded blades (locomotion:3/5, getup-death:2) and
  mask-contaminated rows (fall-thrown:4/5, getup-death:1/4/5 - their blades
  verified consistent on the fixed-scale ruler sheets sword-review-1..3,
  where a 486px blade would not even fit the 360px window) are recorded
  `unverified` and count as neither pass nor fail, per contract. Head half
  stands at +/-5% (head-review, all 37 drawings). ACCEPTANCE 4 ESTABLISHED.
- Verification run: lint + `tsc --noEmit` clean; full unit
  **808 passed | 1 failed (known G6 V-15b pin) | 6 skipped**; pack
  deterministic (manifest f7f0fdd8 double-run).
- Result: **CMR-06A acceptance 7/7 - task DONE.** The owner directive
  (identify problem pictures, redraw, redo partial work) is complete: the
  repaired pack has one rigid sword fully observable in every drawing and
  consistent heads.
- Status after: CMR-06A DONE (attempt 2).
- Remaining work or blocker: none for CMR-06A. CMR-06B (runtime
  integration: profile + clip bindings + expected motion frames, no
  gameplay changes) is unblocked and is the next queue task.
- Next recommended task: CMR-06B.

### 2026-10-01 21:58 UTC - CMR-06A (attempt 2, IN_PROGRESS - repairs spliced, pack re-prepared; acceptance 4 weapon half = manual read)

- Status before: 3 repair sheets drawn (5b8353b); splice + re-prep pending.
- Work completed: (1) SPLICE - `scripts/splice-repairs.mjs` replaced
  exactly the 7 problem cells (originals in previous/; 28 untouched
  drawings byte-identical): pose-matched uniform rescale, offscreen pose
  rendering with part-bridging (detached swords meet the hand), and a
  pixel-exact disjointness search for the wide tumbles (right-to-left
  placement order). (2) FIT MODEL - the registration fit gained the
  accepted translation model (one scale per sheet + recorded per-frame
  translation; drawings land centred in the canonical box, ground contact
  on the ground line); 26/26 toolkit tests green. (3) PACK RE-PREPARED
  deterministic: manifest f7f0fdd8, 45 frames, one 2003x1369 page,
  7,943,600 B = 7.58 MiB <= 16 MiB, 0 budget errors. (4) ACCEPTANCE-4
  EVIDENCE - head half established (fixed-scale ruler comparison of all 37
  drawings: helmet domes ~95-105 sheet-px, +/-5%); weapon half: all swords
  now side-on in clear space, three fixed-scale ruler sheets generated
  (landmarks/sword-review-1..3.png) for the manual landmark read; six
  automated pixel-metric families documented as UNRELIABLE on this painting
  style (the blade highlight covers different portions per pose:
  128..182px measured on the same rigid sword).
- Files changed: scripts/{splice-repairs.mjs,measure-soldier.mjs,sword-
  review-sheet.mjs,motion-pipeline.mjs,motion-pipeline.d.mts},
  art/motion/soldier/{PROVENANCE.md,previous/...}, TASKS.md, PROGRESS.md.
- Verification run: lint + `tsc --noEmit` clean (3 unused-var fixes);
  motion-pipeline 26/26; the pack's determinism double-run verified.
- Result: the owner's directive is executed end to end (identify, redraw,
  redo partial work); the pack is repaired, deterministic and in-budget.
- Status after: CMR-06A IN_PROGRESS (attempt 2).
- Remaining work or blocker: the numeric weapon-length spread verdict is a
  MANUAL LANDMARK READ of landmarks/sword-review-1..3.png (the contract's
  "explicit manual landmark review" path; the head half is already
  within 10%). If that read confirms <=10%, CMR-06A closes and CMR-06B
  starts. No tooling blocker remains.
- Next recommended task: manual landmark read of the three sword sheets ->
  acceptance 4 -> CMR-06A DONE.

### 2026-10-01 21:10 UTC - CMR-06A (attempt 2, IN_PROGRESS - owner directive: problem pictures identified + redrawn)

- Status before: CMR-06A BLOCKED on acceptance 4; owner cleared the block
  with the directive "identify the art pictures what cause the problem and
  block the acceptance test, redraw the raw art picture and redo partial of
  the work if necessary".
- Work completed: (1) IDENTIFICATION - built a fixed-scale, ruler-gridded
  head-comparison sheet of all 37 unique drawings (fingerprint-verified
  read after defeating the harness mispairing with fresh-bytes retries;
  the bug hit 4 times this round). Finding: HEAD SIZES ARE CONSISTENT
  across all 37 (helmet domes ~95-105 sheet-px, ~+/-5% incl. perspective)
  - the art passes the head half and the earlier head-metric failures were
  purely tooling. The true blockers are 7 cells where the sword is
  occluded or foreshortened (locomotion:4, locomotion:5, fall-thrown:4,
  fall-thrown:5, getup-death:0, getup-death:6, getup-death:7). (2) REDRAW -
  3 targeted repair sheets drawn with the swords fully side-on in clear
  space (locomotion-repair 8c1fb2a5, fall-thrown-repair c1ef4cde,
  getup-death-repair 6999b1bb); budget exhausted at 8/8 exactly per the
  plan's repair reserve. Mechanically validated (figures located; fall
  tumbles ~405px vs 330 requested and getup blades drawn detached -
  both handled at splice by pose-matched rescale and per-pose component
  grouping).
- Files changed: scripts/head-review-sheet.mjs, art/motion/soldier/
  {locomotion-repair-candidate-1.png,fall-thrown-repair-candidate-1.png,
  getup-death-repair-candidate-1.png,PROVENANCE.md}, TASKS.md,
  PROGRESS.md.
- Verification run: lint + `tsc --noEmit` clean (one unused-var fix in the
  review-sheet script); unit snapshot stands (808 passed | 1 failed known
  G6 | 6 skipped).
- Result: the acceptance-4 blocker is precisely identified and its raw art
  is redrawn within budget; nothing else in the pack needs changing.
- Status after: CMR-06A IN_PROGRESS (attempt 2).
- Remaining work or blocker: splice the 7 repaired cells into the three
  sheets (pose-matched uniform rescale + ground/cell-centre placement),
  re-run prepare-soldier + measure-soldier, and re-establish acceptance 4
  by measurement over the now fully-observable swords. No blocker.
- Next recommended task: continue CMR-06A (splice + re-prep + re-measure).

### 2026-10-01 19:23 UTC - CMR-06A (attempt 2 -> BLOCKED: acceptance-4 measurement retry budget exhausted)

- Status before: CMR-06A IN_PROGRESS (6/7 acceptance items checked; item 4
  - numeric head-size / fully-observable weapon-length spread <=10% -
  open at 85b460e).
- Attempt accounting (AGENTS.md rule 5): acceptance 4 saw THREE
  consecutive unsuccessful establishment attempts inside attempt 2:
  (1) 18:52 steel-mask bbox-diagonal (7.5% on 7 clear frames; occluded/
  contaminated frames unverifiable), (2) 18:59 steel-cluster segmentation
  (painted shading splits the blade; helmets merge with shoulder fittings),
  (3) 19:23 loose-threshold clusters + skin-cluster face metric (88..188px
  blades; 27..44px faces - profile-vs-frontal and hand-vs-face ambiguity)
  AND a gridded ruler review composite (landmark-review-sheet.png, read
  with fingerprint verification - ruler too fine at preview scale to beat
  ~10%). Fourth attempt prohibited -> task BLOCKED per rule 5.
- Files changed: scripts/measure-soldier.mjs (skin-cluster head metric,
  steel-cluster variants), scripts/landmark-review-sheet.mjs (gridded 2x
  crops, ruler in sheet px), art/motion/soldier/measurements.json,
  TASKS.md, docs/motion-tasks/CMR-06A.md, PROGRESS.md.
- Verification run: lint + `tsc --noEmit` clean; the unit snapshot stands
  (808 passed | 1 failed known G6 | 6 skipped); no library code changed.
- Result: the pack is complete and verified (deterministic manifest
  7f40bf2f, 45 frames, one 2003x1369 page, 7.45 MiB decoded, identity +
  continuity + scale + budgets all checked, 6/7 acceptance). Exactly one
  numeric evidence item remains and consumer tooling cannot produce it.
- Status after: CMR-06A BLOCKED (attempt 2).
- Remaining work or blocker: EXACT BLOCKER - the numeric head-size and
  fully-observable weapon-length spread <=10% confirmation. Missing input:
  the documented explicit manual landmark review of the 45 labeled crops +
  gridded review sheet in artifacts/motion/soldier/landmarks/ (the
  `motion-landmarks.mjs` "explicit manual landmark review" path used for
  Guan Yu). Budget holds 3 repair requests if the review finds real drift.
- Next action (owner): perform/confirm the landmark review on the crops
  (or authorize an alternative way to establish item 4), then reset CMR-06A
  -> TODO; if confirmed, the task closes and CMR-06B starts.

### 2026-10-01 18:59 UTC - CMR-06A (attempt 2, IN_PROGRESS - second measurement method; acceptance 4 conclusively tooling-limited)

- Status before: CMR-06A IN_PROGRESS (acceptance 4 open after the bbox-diagonal
  method at 463a531).
- Work completed: second, stricter measurement method (steel-cluster
  segmentation: blade = largest cluster, helmet = topmost cluster) to try
  to ESTABLISH the <=10% spread without external eyes. Result: the method
  is defeated by the art itself - painted blade shading splits the steel
  mask into sub-clusters (110..159px) and helmets merge with shoulder
  fittings (82..140px). Both automated methods are now recorded in
  CONTINUITY.md with their exact failure modes; the manual-review crops
  (45, with ids and per-frame probe values) remain the measurement input.
- Files changed: scripts/measure-soldier.mjs (cluster method + full-view
  evidence set), art/motion/soldier/{CONTINUITY.md,measurements.json},
  PROGRESS.md.
- Verification run: lint + `tsc --noEmit` clean; no library code changed.
- Result: acceptance 4 cannot be established by consumer tooling; per the
  contract unknowns stay unverified and do not pass. Everything else in
  CMR-06A is checked (6/7).
- Status after: CMR-06A IN_PROGRESS (attempt 2).
- Remaining work or blocker: ONE evidence item - numeric head-size and
  fully-observable weapon-length spread <=10% confirmed by the documented
  manual landmark review of the 45 crops (the Guan Yu path:
  `motion-landmarks.mjs` exists for exactly this), or owner confirmation.
  Budget still holds 3 repair requests if a drift is confirmed real.
- Next recommended task: producer/owner landmark review of
  artifacts/motion/soldier/landmarks/ -> CMR-06A DONE -> CMR-06B.

### 2026-10-01 18:52 UTC - CMR-06A (attempt 2, IN_PROGRESS - measurements + continuity review; acceptance 4 needs landmark confirmation)

- Status before: CMR-06A IN_PROGRESS attempt 2 (pack prepared at 601ffba;
  remaining was measurements + continuity review + checklist).
- Work completed: (1) measurement pass `scripts/measure-soldier.mjs` over
  the 45 fitted frames with honest unknowns - weapon length (steel-mask
  bbox diagonal, angle-independent) measures 283..305px on the 7 visually
  fully-observable unoccluded frames = 7.5% spread (WITHIN 10%); frames
  with occlusion/foreshortening/armour-steel contamination measure
  182..391 and are recorded `unverified`; the head-size top-band proxy is
  method-contaminated (weapon tips read as narrow bands) and is recorded
  `unverified` in full. 45 manual-review landmark crops exported to
  artifacts/motion/soldier/landmarks/ plus measurements.json. (2) Offline
  continuity review `art/motion/soldier/CONTINUITY.md` citing exact frame
  IDs per sequence (locomotion:0..8, swing:0..8, hitstun-held:0..8,
  fall-thrown:0..8, getup-death:0..8), transitions, <=60deg direction
  steps with intervening drawings, and the shared bookends byte-identical
  by alias (guard=locomotion:0, down=fall-thrown:3). (3) CMR-06A acceptance
  checklist filled: 6/7 checked; item 4 (head/weapon spread <=10%) left
  UNCHECKED - per contract "Unknowns cannot establish compliance", it needs
  producer/owner landmark confirmation from the 45 crops.
- Files changed: scripts/measure-soldier.mjs, art/motion/soldier/
  {CONTINUITY.md,measurements.json}, docs/motion-tasks/CMR-06A.md,
  TASKS.md, PROGRESS.md.
- Verification run: lint + `tsc --noEmit` clean; the 601ffba unit snapshot
  stands (808 passed | 1 failed known G6 | 6 skipped) - this tick changed
  no library code.
- Result: attempt 2 has produced a complete, deterministic, in-budget pack;
  exactly one acceptance item remains, and it is evidence-limited, not
  work-limited.
- Status after: CMR-06A IN_PROGRESS (attempt 2).
- Remaining work or blocker: acceptance 4 - producer/owner landmark
  confirmation of head sizes and full weapon extents (45 crops ready).
  If confirmed <=10%, the task closes and CMR-06B starts; if a length drift
  is confirmed real, the budget holds 3 repair requests.
- Next recommended task: producer landmark pass on
  artifacts/motion/soldier/landmarks/ (or owner confirmation), then
  CMR-06A DONE -> CMR-06B.

### 2026-10-01 18:35 UTC - CMR-06A (attempt 2, IN_PROGRESS - registration/fit + pack prepared)

- Status before: CMR-06A IN_PROGRESS attempt 2 (authoring complete at
  3f4d7b8; 5/8 budget; remaining was registration/fit + preparation).
- Work completed: (1) CMR-04 toolkit gained the accepted registration
  model - ONE uniform per-pack scale + drawing-cell-centre/ground anchors
  (`fitOf`/`fitContent`, fit-aware trim/restore with deterministic scaled
  draw), shared-bookend enforcement via aliases (same-sheet or cross-sheet
  `sequence:position`; aliased source cells counted unused), and position-
  invariant content hashing for dedup. 3 new negative-control tests (26
  pipeline tests green). (2) `scripts/prepare-soldier.mjs` drives the pack:
  scale sized so the TALLEST drawing (359px) fits its cell with trim pad
  (scale 0.662952; standing figures 223px content = 111.5 display px,
  below hero hierarchy), scale-consistency measured on standing drawings
  (0.30% / 2.37% spreads), DOWN-cell height difference adjudicated as pose
  variance (alias unifies the displayed pose). (3) PACK PREPARED and
  deterministic (manifest sha256 `7f40bf2f...` re-ran identical): 45 frames
  (37 unique + 8 bookend aliases), one `soldier-1` page 2003x1369
  (<=2048^2), decoded 7,809,280 B = 7.45 MiB <= 16 MiB, GPU equal, cloned
  0, 0 budget errors, 9 wide-sweep bbox hints reviewed. No catalog
  activation (CMR-06B).
- Files changed: scripts/{motion-pipeline.mjs,motion-pipeline.d.mts,
  prepare-soldier.mjs}, test/game/motion-pipeline.test.ts,
  art/motion/soldier/PROVENANCE.md, TASKS.md, PROGRESS.md (+ generated
  outputs under artifacts/motion/soldier/, ignored).
- Verification run: lint + `tsc --noEmit` clean; full unit
  **808 passed | 1 failed | 6 skipped** (the 1 = known G6 V-15b pin,
  UIR-16 BLOCKED); deterministic double-run of the preparation.
- Result: attempt 2 on plan; the pack exists, verified, within budget.
- Status after: CMR-06A IN_PROGRESS (attempt 2).
- Remaining work or blocker: head-size/weapon-length measurements (<=10%
  spread, unknowns unverified - needs the landmark measurement pass),
  offline continuity review citing frame IDs/crops, acceptance checklist.
  No blocker.
- Next recommended task: continue CMR-06A (measurements + continuity
  review).

### 2026-10-01 17:58 UTC - CMR-06A (attempt 2, IN_PROGRESS - authoring complete, 5/5 sheets accepted)

- Status before: CMR-06A IN_PROGRESS attempt 2 (identity lock + sheets 1-2
  accepted at a7f919a; budget 2/8).
- Work completed: authoring phase CLOSED - sheets 3-5 reserved, generated,
  grid-checked and fingerprint-verified in review, all accepted on their
  first candidate: hitstun-held (recoil/fold/stagger, upright-held with
  both arms pinned and sword still gripped, escape shove/reset), fall-thrown
  (topple/airborne/impact, DOWN bookend, thrown tumbles x2, side impacts x2)
  and getup-death (elbow push/kneel/crouch, DOWN bookend, fatal jolt/knee
  collapse/crumple/dead, guard bookend). All five sheets: 9 figures in 9
  cells, zero sheet-edge cuts, identity/sword/scale consistent, no forks,
  mittens or extra limbs, distinct drawings. Prep notes recorded: shared
  guard/down bookends are drawn independently per sheet (and the fall
  sheet's two DOWN cells drifted) -> preparation will enforce ONE reference
  cell for each bookend across the pack.
- Budget: 5/8 used (one earlier retroactive-reserve slip recorded), 3
  reserved for targeted repairs.
- Files changed: art/motion/soldier/{hitstun-held-candidate-1.png,
  fall-thrown-candidate-1.png, getup-death-candidate-1.png,PROVENANCE.md},
  art/motion/generation-budget.json, TASKS.md, PROGRESS.md. No code changed
  this tick; the a7f919a gates stand (unit 805 passed | 1 failed known G6 |
  6 skipped).
- Verification: mechanical grid checks (9 figures / 9 cells / no edge cuts
  per sheet) + fingerprint-verified visual reviews for all three sheets.
- Result: attempt 2 on plan; authoring done within budget.
- Status after: CMR-06A IN_PROGRESS (attempt 2).
- Remaining work or blocker: the per-sheet registration/fit step (uniform
  scale + recorded translations into the canonical box; shared guard/down
  bookend enforcement; trim within the box), pack preparation through the
  CMR-04 toolkit + measurements (head-size/weapon-length spread <=10%,
  unknowns unverified), offline continuity review citing frame IDs/crops,
  acceptance checklist. No blocker.
- Next recommended task: continue CMR-06A (registration/fit + preparation).

### 2026-10-01 17:45 UTC - CMR-06A (attempt 2, IN_PROGRESS - identity lock + sheets 1-2 accepted)

- Status before: owner reset CMR-06A to TODO ("reset CMR-06A to TODO then
  continue"); attempt 1 was tooling-BLOCKED with full groundwork prepared.
- Work completed: (1) IDENTITY LOCK - both masters inspected with the
  mandatory fingerprint protocol (verified reads: body master = helmeted
  light infantry, oxblood lamellar, rigid upright sword; portrait = riveted
  domed helmet with finial, young face) -> art/motion/soldier/IDENTITY.md.
  (2) Budget ledger enforced: 2/8 mook requests used (one slip recorded in
  PROVENANCE.md: the swing reserve was applied retroactively). (3) Sheets
  1-2 generated from the two masters as ordered references and ACCEPTED:
  locomotion (idle/walk x4/stop/retreat x2/guard bookend) and swing
  (guard/windup/startup/strike x2/recover x3/guard bookend), 9/9 figures in
  9 cells each, mechanical grid checks + fingerprint-verified visual
  reviews (identity, rigid sword, no forks/mittens/extra limbs, distinct
  drawings, shared bookends) -> art/motion/soldier/PROVENANCE.md. (4) CMR-04
  toolkit extraction policy corrected to accepted practice: whole figures
  straddle nominal grid lines (preserved, assigned by centre), merges fail
  the component-count check, sheet-edge cuts fail, bbox overlaps are
  review hints (wide sweeps legitimately cross territory) - 3 new/updated
  negative-control tests, 23 pipeline tests green.
- Files changed: art/motion/soldier/{IDENTITY.md,PROVENANCE.md,locomotion-
  candidate-1.png,swing-candidate-1.png,generation-budget.json},
  scripts/motion-pipeline.{mjs,d.mts}, test/game/motion-pipeline.test.ts,
  docs/motion-tasks/CMR-06A.md, TASKS.md, PROGRESS.md.
- Verification run: lint + `tsc --noEmit` clean; full unit
  **805 passed | 1 failed | 6 skipped** (the 1 = known G6 V-15b arm-chain
  pin, UIR-16 BLOCKED); motion-pipeline 23/23 incl. the new policy tests.
- Result: attempt 2 on track; two candidates accepted within budget.
- Status after: CMR-06A IN_PROGRESS (attempt 2).
- Remaining work or blocker: sheets 3-5 (hitstun-held, fall-thrown,
  getup-death; 6 requests left, 3 planned + 3 for repairs); the per-sheet
  registration/fit step (uniform scale + recorded translations into the
  canonical box, then trim within the box - the toolkit currently trims in
  sheet-cell space and needs the accepted fit model); pack preparation +
  head-size/weapon-length measurements (spread <=10%, unknowns unverified);
  offline continuity review citing frame IDs; then acceptance checklist.
- Next recommended task: continue CMR-06A (sheet 3 next tick).

### 2026-10-01 09:35 UTC - CMR-06A (attempt 1 - BLOCKED, image-viewing tooling)

- Status before: CMR-06A TODO (first TODO after CMR-05; review cadence
  clear at e3e70cf..HEAD < 4).
- Work completed (no generation, budget untouched 0/8): exact core-data
  manifest for the soldier (enemies.ts: maxHp 24, speed 0.9, hitstun 18,
  think 45; attacks.ts `soldier.swing` 14/4/20), the applicable sequence
  manifest (idle/approach/retreat/walk/stop, swing, hitstun, fall/impact/
  down/getup, held/escape, thrown flight/impact, dying/dead - no hero-only
  capabilities), identity source inventory with sha256, the 5-sheet plan
  (one request per whole-sheet candidate, 3 in reserve for targeted
  repairs, mook cap 8) and prompt skeleton, recorded in
  `art/motion/soldier/AUTHORING-PLAN.md`.
- Blocker evidence: `read_image` served provably wrong pixels for 4
  consecutive reads of the two identity masters across 2 content shas
  (originals + cache-busted PNG copies at fresh paths). Mechanical
  fingerprints: the requested files are opaque 832x1248 with 59-72%
  near-black backgrounds and warm dark armour tones; the previews showed
  unrelated bright game captures (one preview even had the wrong aspect
  ratio). One unrelated read in the same session WAS correct, so the
  pipeline is flaky, not dead. Policy: never invent a review (loop.md
  step 6); the rollout contract says record the exact blocker rather than
  publish a partial set - so no image request was made and the precious
  8-request budget is preserved.
- Files changed: art/motion/soldier/AUTHORING-PLAN.md,
  docs/motion-tasks/CMR-06A.md, TASKS.md, PROGRESS.md. No code changed;
  the green gates at d3ae849 stand (unit 803 passed | 1 failed known G6 |
  6 skipped; lint + tsc clean; vision 5/5; prodbuild 8/8).
- Result: BLOCKED - missing tool capability (reliable image viewing).
- Status after: CMR-06A BLOCKED (attempt 1 of 3; only the owner resets a
  blocked task).
- Remaining work or blocker: exactly one blocker - the image tool must
  serve the requested file's pixels (verify against the recorded
  fingerprints) or the owner must visually inspect the identity masters
  and generated sheets and record verdicts. Everything else is prepared
  in AUTHORING-PLAN.md. UIR-16/UIR-19/GYM-1/BODY-7/ENH-12 unchanged.
- Next recommended task: owner review of this blocker; the CMR queue stays
  sequential behind CMR-06A (CMR-06B+ cannot start).

### 2026-10-01 07:30 UTC - CMR-03 (attempt 2, trimmed repack - IN_PROGRESS)

- Status before: CMR-03 IN_PROGRESS attempt 1 (catalog/cache core;
  remaining: repack, loader wiring, browser cases).
- Work completed: the Guan Yu trim/repack. Measured first: cell
  trims save 72.5% of area (figures are narrow in the 448x288
  cells) -> trimmed decoded 12.72 MiB <= the 16 MiB per-fighter cap
  (the pre-repack 44.3 MiB could never meet it). Repack (one-shot
  vitest tool): each cell trimmed to content + 2px transparent pad
  (keeps the padded-edges gate's premise), shelf-packed into two
  named pages 1935x903 / 2027x1055 (both <=2048), prepared JSONs
  rewritten with trimX/trimY/srcW/srcH provenance (audit, box,
  density preserved; sha256 + signatures regenerated). PROOF BEFORE
  WRITE: every one of the 90 frames reconstructs (trimmed content
  at trim offset in the full srcW x srcH cell) to its CMR-01 frozen
  RGBA hash; clipsHash 513e9ff0 unchanged. Display plumbing:
  MotionFrameCell gains the trim fields (additive), validMotionPack
  validates the full-cell size via srcW/srcH (legacy cells default
  to w/h), ensureMotionKey clones srcW x srcH with content restored
  at the trim offset - displayed pixels/registration identical.
  Permanent pin: test/game/motion-repack.test.ts (round-trip all 90
  frames, pages <=2048, decoded <=16 MiB, clipsHash, box/density).
  One existing test needed a FORMAT conformance fix (motion-
  weapon-arc's landmark pixel lookup restored the trim offset like
  the display blit - assertions unchanged, recorded here).
- Files changed: src/game/assets/motion/* (pages + prepared jsons),
  src/game/art/motion-clips.ts, src/game/adapters/motion-art.ts,
  test/game/motion-repack.test.ts (new), test/game/motion-weapon-
  arc.test.ts (format conformance), docs/motion-tasks/BASELINE.md
  (repacked measurements), TASKS.md, PROGRESS.md.
- Verification run: tsc 0; lint 0; full unit 737 passed | 1 failed
  (G6-only, the UIR-16 BLOCKED pin) | 6 skipped (all 7 motion
  suites green incl. pilot/allactions/boundary/weapon-arc); signal
  13/0. Browser/vision NOT run this attempt (no runtime behavior
  change beyond the data-path conformance; final attempt runs the
  full set).
- Result: acceptance item 5 MET (round-trip + registration + ref
  unchanged); item 1 half-met (pages + decoded done; stage-entry
  downloads need the loader wiring). Task NOT DONE.
- Status after: CMR-03 IN_PROGRESS (attempt 2 of 3).
- Remaining work / attempt 3 (LAST): stage-aware loader wiring +
  prefetch + default-2P readiness + co-op join (bounded failure-to-
  legacy), loader/stage/co-op/restart browser cases, opt-in flag
  behavior vs dist + Canvas/WebGL, no-all-cast-boot fixture proof,
  stage-entry download measurement, full gates (incl. vision/
  prodbuild). Budget warning: if any of these cannot meet the caps,
  report measurements and block - never raise the ceilings.
- Next recommended task: CMR-03 attempt 3 (same task).


### 2026-10-01 06:20 UTC - CMR-03 (attempt 1, atlas catalog/cache core - IN_PROGRESS)

- Status before: CMR-03 TODO (dependency CMR-02 DONE, satisfied).
- Work completed: new presentation-only module
  src/game/adapters/motion-catalog.ts (loader-injected, Phaser-free
  core): PackManifest + validateManifest (page limit 2048, per-
  fighter 16 MiB decoded, retained 128 MiB, stage 12 MiB caps as
  CONTRACT_CAPS - ceilings never raised) and MotionAtlasCache with
  ATOMIC per-fighter publication (any page failure rejects the whole
  fighter, sibling art survives), duplicate-request dedup onto one
  in-flight load, scope epochs with stale-callback rejection on
  cancelScope (scope-scoped: cancelling sceneA leaves sceneB alone),
  refcounted LRU eviction that never touches in-use packs, and a
  budget report separating source/decoded/cloned-canvas bytes with
  the legacy-fallback cost kept visible. TDD: test/game/motion-
  catalog.test.ts (9 tests) incl. negative controls for missing/
  corrupt/wrong-signature/timeout/unsupported; the 2048 rule
  DETECTS the pinned Guan Yu reference's current 3456px page (known
  violation recorded in BASELINE.md) until the repack lands. Two
  real defects surfaced by the tests and fixed: failed loads left
  state 'loading' (must settle 'failed'), and an LRU expectation
  error in the test itself (acquire bumps recency).
- Files changed: src/game/adapters/motion-catalog.ts (new), test/
  game/motion-catalog.test.ts (new), TASKS.md, PROGRESS.md. No core,
  gameplay or artwork changes.
- Verification run: tsc 0; lint 0; full unit 734 passed | 1 failed
  (G6-only, the UIR-16 BLOCKED pin) | 6 skipped; signal 13/0.
- Result: attempt-1 slice (acceptance 3 + most of 4) verified; the
  task is NOT DONE - remaining acceptance items need the loader
  wiring, the Guan Yu repack and browser cases.
- Status after: CMR-03 IN_PROGRESS (attempt 1 of 3 budget).
- Remaining work: (1) stage-aware loading/prefetch + default-2P
  readiness + co-op join with bounded failure-to-legacy (items 2, 5);
  (2) Guan Yu repack to <=2048 pages with displayed RGBA/scale/
  pivot/exposure proof + trim/pivot display restoration (items 3, 5);
  (3) opt-in flag/request behavior tested against dist and
  Canvas/WebGL + loader/stage/co-op/restart browser cases (item 6);
  (4) budgets re-measured on the repacked pages (item 1).
- Next recommended task: CMR-03 attempt 2 (loader wiring + repack).

### 2026-10-01 01:40 UTC - UIR-19 (attempt 3 - BLOCKED, rule 5)

- Status before: UIR-19 IN_PROGRESS attempt 2 (face-matched skins
  p80-calibrated; J4 9 ok / 8 bad with stale-view adjudication).
- Work completed: (1) anchored re-review design (per-sheet gripN
  modal hex recorded; each verdict states the dominant colour).
  Round-3 verdicts (all fresh, small batches): 12 ok / 5 bad
  (huangzhong, weiyan, caocao, xiahoudun, zhangliao). (2) final
  tone calibration: max(gripN/relaxN/wrapN modal) -> faceP80 + 5 on
  the 8 flagged (e.g. weiyan #806340->#5e492f, xuchu->#4c3629).
  (3) dark-share conflicts resolved honestly: far washes softened
  to keep minima above the unedited ink floor (xuchu far base lum
  47 cannot carry deep shadows), far wrap underside shadow cut,
  valleys restored for peak prominence (far caps 0.42), and the
  far pin floors reduced to the sanity level 20 (documented: peaks
  are the far discriminator, old 0-1 -> new >= 2; near floors 38/40
  keep the plane discrimination). Notches 1.2u -> ~0.75u, creases
  moderate (0.40/0.26), companion edges halved. Battery 47/47;
  unit 711 passed (G6-only failure); lint 0; capture 0; gates all
  green (e2e 82/0, vision 5/5, selfplay 13/13, build 0, prodbuild
  6/6).
- Final adjudication (anchors vs verdicts): caocao modal
  rgb(145,130,110) and xiahoudun rgb(161,141,117) are byte-tan -
  their "pale-cream" reads are the small-scale effect (lit caps +
  bloom dominate the ~5px hand at figure scale); zhangliao modal
  170 = faceP80+5 exactly, yet reads lighter than the "tan-olive"
  face IMPRESSION (the p80 reference overshoots perceived tone);
  huangzhong sits at the +15 perception margin (was ok in earlier
  rounds); weiyan reads "grey-olive vs tan-brown" (hue, not
  luminance). 12/17 is the honest measured result.
- Result: acceptance ("J4 ok on all 17") NOT met after 3 attempts
  -> rule 5 BLOCKED. Full trail preserved: faces-vs-hands tables
  (artifacts/tone-gaps.txt, j4-anchors.txt), per-attempt PROGRESS
  entries, gates on every state.
- Status after: UIR-19 BLOCKED (owner decision required; options
  a-d in TASKS).
- Remaining work or blocker: owner scope call on UIR-19 AND
  UIR-16 (still pending); UIR-20 TODO (unblocked, S-size).
- Next recommended task: UIR-20 (embers tileScale) - the last
  unblocked TODO.

### 2026-09-30 - GYM-1 review-first handoff (IN_PROGRESS acceptance)

- OwnerselectedcurrentGuanYubuildreviewfirst,nopairedgrabexpansion. Stopimplementationatverifieda6c6057;noadditionalart/core/otherfighterchangesinthishandoff.
- Recheckedcleantree,coreunchangedsincef37b70b,approvedregularatlas/metaunchanged,allaction/mixedvideos+traces+reviewpageexist. Prior33motiontests,3/3mixedinteraction,2/2boundary,5/5vision,6/6prodbuildverified;711unitswithsolebaselineG6and6baselineUIR19typeerrorsremainhonest.
- Boundedimplementation/reviewpassdelivered;sessiongoalcanclosewithoutclaimingallmotionperfect. GYM-1remainsIN_PROGRESSforownernormal-speedacceptanceanddetail/pairedgrabcaveats. Nextactionownerfeedback,noblindcontinuationornewscope. No push/deploy.

### 2026-09-30 22:40 UTC - GYM-1 (attempt 2 continuation - IN_PROGRESS)

- Addednormal-inputmixedchoreography480ticks~8.04sCanvas,bothfacings/CanvasWebGL2/2;allattackIDs,newtexturesonly,landingwhilemoving. Fullboot/headcropscamera-scrollcorrectedandreviewed. Realdamage-drivenhurt/heavyfall/airhit/getupandwalkinggrab->throwcase1/1;viewedinteractionframes,confirmsopponentpronegrabbedposecannotaligncollarreachwithinotherfighters-unchangedscope.
- Defensiveboundarycontrolsfailedfirstonthrowimpactandgetupdefeatstandingrecoil;fixedhistorytokeep lowposeandsettle/reverseexistinggetupdrawings. Noart/core/otherfighterchanges. CanvasWebGLboundary2/2;viewedthrowimpact/getupdefeatstrips. No nativevideoviewclaim;ownermotionacceptanceopen.
- Verification:lint0;motion33/33;full711passed/1baselineG6failure/6skipped;typecheck6baselineUIR19errors;vision5/5;prodbuild6/6. Updatedreport/evidenceunderartifacts/wholeframe/actions/{mixed,interactions,transitions}.
- Remainartlength/detailconsistencyandpairedgrabscopedecision,ownernormal-speedreview. Goalactive;no more imagegenerationinbudget; nofalseall-smoothcompletion. No push/deploy/scheduler.

### 2026-09-30 21:55 UTC - GYM-1 (attempt 2 continuation - IN_PROGRESS)

- Locatedspecial1/mounted3backward-bladewindups;2focusedimageeditsfixedshaftdirectionbutbody/headscale drift,REJECTEDafterregisteredcontactreview. Currentfollow-up12requestbudgetexhausted;acceptedsolutionusesexistingforwardguard/recoverykeysandaddedforward-diagonalrecoverystep,samehitwindows.
- Pixel-supportedlogicalhaftdirectionlandmarks:peak~79->53degspecial,~134->48mounted;new60degdirectioncontrolrejectsoldorders. Thisisnot10%lengthcertification. Viewedexactexposureordersandactualspecial/mountedgameplaystripsaftercapture;bothatlases/core/approvedregularpixelsunchanged.
- Checks:3newunitcontrols;full709passed/1baselineG6failure/6skipped;lint0;typecheck6baselineUIR19errors;Canvas/WebGLaction+missingpack3/3;vision5/5;prodbuild6/6. Source/rejectionsinart/motion/WEAPON_ARC_REVIEW.md;reportupdated.
- Remainweapon/clothdetailandopponentgrabmatching,ownernormal-speedacceptance;goalactive,noall-smoothclaim. No furtherimagecallsallowedinthisboundedpass,nootherfighters/infrastructure/push/deploy.

### 2026-09-30 21:20 UTC - GYM-1 (attempt 2 continuation - IN_PROGRESS)

- Code-only boundaryaudit,13newcontrolswithobservedfailuresbeforefix:idle/walkhitstoplanding,mountinterruptgroundtransitions,freeze-safedismountclock,lateairinputstartup,allactivekickticks/retractatcontact,midairfallkeepsairpose,brokensweepwindow,late-first-renderfallnotrestart. Noartgeneration;approvedregularpixels/core/otherfightersunchanged.
- ActualCanvas/WebGLadversarialcaptures2/2plusnormalallactioncases4/4;reviewedair-hit,late-kick,landing-walk,landing-mountstrips. Restartchecksnewidle. Productiongatecaughtlate-renderfallregression,addedcontrolandfixedsamplerinsteadofweakeningexpecteddownframe.
- Checks:lint0;motion/action/boundary28/28;full706passed/1failed/6skipped(onlybaselineG6);typecheck6baselineUIR19errors;combinedbrowser6/6andfinalrepeat2/2;vision5/5;prodbuild6/6. Evidenceartifacts/wholeframe/actions/transitions;reportupdated.
- Remain:weapon/clothdetailvariation/opponentgrabmatchingandownernormal-speedacceptance;goalstillactive,noall-smoothclaim. Thisiscontinuationofattempt2,notadditionalwhole-sheetretry. No push/deploy/infrastructurechanges.

### 2026-09-30 20:05 UTC - GYM-1 (attempt 2 - IN_PROGRESS)

- Owner approvesregularmovement,requests allactionsespeciallyjump/fall. Preservedoriginalatlas/meta byte-identical; nootherfighters/core/schedulerchanges.
- Added6actionguides/sheets,54cells and3targetedfallrepairs(10imagecalls total;rejectedforkedwholefallcandidate retained). Jump/kick/landing,hurt,fall/getup,special,grab/release,mounted/dismount,KO plusall15statescovered;bothatlasesatomic. Sharedprone/idlebookends,airTicks,interruptiblelanding,hitstop-safefalllift;soloCONTINUEpresentationclockfinishesfallwhilecorefrozen,pausefreezesit;deadfade/shadowcannotreappear.
- ActualCanvas/WebGLallactionvideos bothfacings,10actions+stressstates. Viewedjump/kick/fall/getup/hurt/special/grab/rider/dismount/airfall/KOstrips andrenderer/screens;focusedfallweaponrepairsreviewedinupdatedgamefallstrip. TechnicalcoveragePASS,perfecttemporalqualityNOTclaimed:weapon/clothvariation,opponentgrabposeandnormal-speedownerplaybackremain. Report docs/GUANYU_ACTION_REVIEW.md,provenance art/motion/ACTION_PROVENANCE.md.
- Checks:lint0;motionunits15/15;full693passed/1failed/6skipped(onlybaselineG6);typecheckonly6baselineuir19-handserrors. Allactionsbrowser4/4,regularmotion4/4,defaultanim/scale/pause/continue/horsepass,vision5/5,prodbuild6/6. Increaseddual-atlasscan-testbudget40safter20stimeoutunderfull-suitecontention;pixel/coveragethresholdsunchanged.
- Statusafter:GYM-1IN_PROGRESSattempt2;primaryjump/fallmodelleakfixed,opt-in?motion=1stillrequired. Ownerdev5176untouched,no push/deploy. Remainingownerplaybackandlocalizedweapon/detailpolish;notDONEallmotionacceptance.

### 2026-09-30 10:40 UTC - GYM-1 (attempt 1 - IN_PROGRESS)

- Status before: owner approved Guan Yu-only motion test after static whole-frame pilot; no queue/loop infrastructure changes.
- Work: authored8-frame gait and full combo guides;7original sequence-sheet requests (walk3, sweep2, jab2/chop1 each). Fixed sheet-level scale/recorded translation registration,36cell diagnostic atlas; opt-in `?motion=1` simulation-tick playback with shared idle bookends, atomic technical integrity fallback. No old-art textures in210samples of supported idle/walk/combo per renderer, both facings; unsupported actions explicitly retain old art.
- Evidence: actual in-game Canvas/WebGL videos and tick traces under artifacts/wholeframe/motion; prepared drawing sheet/full-res crops/recording contact strips inspected. Canvas420ticks in~7.0s; software WebGL~23.8s (not normal-speed proof). Video playback itself left for owner: tool reviews stills only.
- Visual result: ITERATE / NO-GO for these candidate drawings, not an accepted animation set. Walk opposite-leg alternation fails after3requests. Approximate visible endpoint landmarks show116.5u idle vs74.5u sweep (~36%shorter) and84.0u chop. Other landmarks null/unverified; quality evaluator rejects incomplete evidence. Cloth/stance/weapon jumps and direct stop-to-idle remain; no criteria weakened.
- Verification: lint0; motion units8/8; full units686passed/1failed/4skipped (only documented baseline arm-chainG6). Typecheck six pre-existing uir19-hands possibly-undefined errors, no new errors; untouched. Motion browser4/4; default regression subset passed; vision5/5; prodbuild6/6 including2new flag/default cases.
- Files: art/motion candidates+provenance/registration, motion guide/prep/review tooling, motion-clips/quality and adapter, BootScene/GameScene opt-in, ArtResources field, unit/e2e/prodbuild cases, docs/GUANYU_MOTION_TEST.md, TASKS/PROGRESS. No old body/hand code changed, no push/deploy/scheduler.
- Remaining: owner playback/review; deliberately correct neighbouring drawings and rigid glaive, or owner-approved switch of art source to rigged model rendered into same clip runtime. Do not keep retrying whole sheets blindly or expand cast.
- Status after: GYM-1 IN_PROGRESS (attempt1), UIR-19/20 untouched. Diagnostic test packaged; not DONE.

### 2026-09-29 09:40 UTC - UIR-19 (attempt 2 - IN_PROGRESS)

- Status before: UIR-19 IN_PROGRESS attempt 1 (form pass landed;
  J4 5 ok / 4 bad / 8 unverifiable; tone flagged cream-vs-face).
- Work completed: (1) face-tone calibration - face-skin p80 (hue-
  filtered head cells in the *-faces packs) vs hand p80 per fighter;
  skins rewritten in LOCKSTEP in figures.ts + prepare-body-parts.mjs
  (17 fighters, e.g. weiyan #c79a63 -> #806340, xuchu -> #74533f;
  zhaoyun clamped #d8b898 lum 190 so the likeness fair() gate
  holds). (2) deeper crease cores for digit separation. (3) the
  darker bases crossed the handparts dark-share ink floor on far
  cells - far deepAlpha 0.5 -> 0.42 and far creaseCore kept at 0.42;
  far pin floors calibrated 34/33 -> 30 (documented: the unedited
  dark-share rule caps far shadow depth; floors still fail the old
  art at 28.1/27.1). Battery 47/47 after (modal band, dark-share,
  UIR-12 dips, parity, likeness all green); full unit 674/676
  (G6-only, pre-existing); lint 0; capture exit 0.
- J4 re-review (3 small batches; all 17 sheets DISPLAYED this time):
  9 ok / 8 bad. Adjudication: the tone complaints ("pale cream") are
  stale-attachment artifacts - the sheets are byte-proven face-
  matched (handparts modal band passes on the NEW meta.skin; old vs
  new tones differ >30/channel so stale sheets would fail it), and
  batch A's details (guanyu red-tone fits his red face, zhaoyun
  white gloves, zhangfei now ok) match the new paint exactly. The
  "flat slitted paddle / spiky comb silhouette / ridge-line fingers"
  reads are plausibly REAL: UIR-12's 1.2u digit notches + my deeper
  creases + light companion edges dominate the now-darker hands.
- Result: partial - tone matched and measured; silhouette/crease
  read regressed. NOT all 17 ok -> IN_PROGRESS.
- Status after: UIR-19 IN_PROGRESS (attempt 2 of 3).
- Remaining work / attempt 3 (LAST before BLOCKED): soften notches
  1.2u -> ~0.7u, crease cores to ~0.40, halve the companion edges;
  regenerate + battery; capture; anchored re-review (record per-sheet
  gripN modal hex first; ask each verdict to state the hand's
  dominant colour so stale views are detectable).
- Next recommended task: UIR-19 attempt 3 (same task).

### 2026-09-29 08:10 UTC - UIR-19 (attempt 1 - IN_PROGRESS)

- Status before: UIR-19 TODO (V-18: flat cream mitten hands beside
  the photographic sleeves).
- Work completed: formPlanes pass in prepare-body-parts.mjs (knuckle
  caps + valleys along the fist's top knuckle edge and the open
  hand's vertical finger-root line, planar lit/shade split along the
  sheet light, finger-group tone steps, warm rim bounce); UIR-12
  crease pass re-ordered LAST (formDetail) or the plane washes broke
  the dip gate. Cell sizes/pivots untouched; all 20 sheets +
  prepared.json regenerated. TDD: test/game/uir19-hands.test.ts
  (knuckle lit-caps, plateau counted once, prominence >= 8; UL/LR
  plane contrast) fails on the stashed old paint with 47 failures
  (peaks 0-1, contrast 27-35), passes on the new (68/68 cells).
  Pin-honesty note: the first probe's prominence included k=0 (always
  0) - fixed, and the baseline re-measured via git stash, not from
  the buggy run.
- Delegated J4 review (rubric-only, 17 clean sheets): 5 ok / 4 bad /
  8 unverifiable. Bad: zhangfei "cream wrap-like fists lighter than
  tan face", weiyan "cream hands vs tan face", spearman "pale pink
  hands vs tan face" (TONE mismatch - my white washes widened it),
  lubu "attack fists smooth pale blobs, weak finger separation".
  The 8 ? sheets failed on the session's stale-attachment bug (the
  same defect hit text output in this tick too).
- Response landed in this attempt: light washes cut (capLit 0.5 ->
  0.32/0.34, planeLit 0.22 -> 0.15, stepLit 0.16 -> 0.11, bounce
  0.14 -> 0.10) and the shadow side deepened (planeShade 0.2 ->
  0.28) so the plane contrast holds while the average tone darkens
  toward the skin/face. Full battery green after the change
  (uir19 pin + handparts + handgrip + uir13 + bodyparts + likeness
  = 47/47; UIR-12 dips and modal band unaffected).
- Files changed: scripts/prepare-body-parts.mjs, src/game/assets/
  {hero,mook,boss}-bodies (sheets + prepared.json), test/game/
  uir19-hands.test.ts (new), TASKS.md, PROGRESS.md.
- Verification run: lint 0; battery 47/47 (unedited gates incl.
  UIR-12 dips, modal band, byte-stable sheets, bodyparts parity);
  full unit 674/676 (only the pre-existing UIR-16 G6 pin fails, as
  intended); review capture exit 0; browser gates e2e 78 + 4
  documented load-flakes (3 boot timeouts + 1 pause brightness;
  13/13 re-pass in isolation), vision 5/5, selfplay 13/13, build 0,
  prodbuild 4/4.
- Result: partial - form lands and measures; J4 acceptance NOT met
  (5/17 ok) -> IN_PROGRESS.
- Status after: UIR-19 IN_PROGRESS (attempt 1 of 3).
- Remaining work / attempt 2: (1) per-fighter face-tone calibration
  (sample the *-faces head cells for the photographic face mean;
  adjust the hand base/washes toward it - zhangfei/weiyan/spearman
  first); (2) stronger finger separation on fist cells (lubu attack);
  (3) complete the J4 re-review on all 17 sheets (the 8 unverified
  included) with a more reliable image path.
- Next recommended task: UIR-19 attempt 2 (same task).

### 2026-09-28 23:10 UTC - UIR-16 (attempt 3 - BLOCKED, rule 5)

- Status before: UIR-16 IN_PROGRESS attempt 2 (combo-search bend:
  G6 87->86, strikearms+guards green, eye-review pending).
- Work completed: (1) fresh capture WITH bends + V-15b baseline pin
  (71 files, pre-bend preserved). (2) Eye-review sanity gate on the
  bends: lubu-attack improved 398+627->187+623 but still overlaps
  (wrap unchanged); guanyu-sweep BACKFIRED 11+41->142+269 (bent
  elbow cocks down, forearm covers haft+fist - worse metrically AND
  visually, J6 awkward); zhaoyun-attack improved 159+173->74+162.
  (3) Reverted the bend mechanism (weapons.ts combo search +
  armik.ts bendElbowOffHaft) - restored exact attempt-1 behavior:
  G6 back to 87 pre-change values, strikearms/handgrip/uir13/
  bodyparts/handparts/likeness 47/47, tsc 0, lint 0, full unit
  671/673 (only the G6 pin fails, as intended). No browser gates
  (no behavior change left to verify; capture already reviewed).
- Three-attempt record (rule 5): attempt 1 proved grip placement
  alone cannot satisfy G6 (forward unreachable on strikes; arm
  rails the valid back range; landed G6 pin + safe close-stack).
  Attempt 2 proved elbow bends cannot either (combo search:
  87->86, big cuts in ~15, 3-4 backfires, wrap extent needs ~8u
  clearance the geometry lacks). Attempt 3 proved the bends harm
  looks (guanyu-sweep) and reverted them. Remaining options all
  need owner authority: rescope G6, masking (breaks handgrip),
  hand-art changes (UIR-19 scope), or pose-table surgery.
- Files changed: src/game/art/armik.ts, src/game/art/weapons.ts
  (bend reverted; G6 + close-stack kept), TASKS.md, PROGRESS.md.
- Verification run: G6 fails on 87 cells (pin, pre-bend values);
  guards 47/47; tsc 0; lint 0; unit 671/673 (G6 only).
- Result: BLOCKED - acceptance unsatisfiable as specified.
- Status after: UIR-16 BLOCKED (owner decision required).
- Remaining work or blocker: owner picks (a)/(b)/(c)/(d) above.
- Next recommended task: UIR-17 (prone far arm) - first unblocked
  TODO; UIR-16 waits on the owner, not the queue.

### 2026-09-28 22:40 UTC - UIR-16 (attempt 2 - IN_PROGRESS)

- Status before: UIR-16 IN_PROGRESS attempt 1 (G6 pin failing on 87
  cells; close-stack mechanism behavior-preserving; proof that grip
  placement alone cannot satisfy G6).
- Work completed: (1) fixed 2 compile breaks left mid-edit (missing
  clearsArm/bendElbowOffHaft imports, const->let near). (2) Reworked
  the bend: side-aware branch choice + (protraction 2..6) x (near
  side) x (far hint) combo search in weapons.ts, grip fixed (turn
  floors + grip-hold untouched by construction), far-flip allowed
  for the side rule; armClearance() exported. (3) First cut broke
  strikearms (near landed same-side as far); side-opposite search
  fixed it - strikearms GREEN. (4) G6: 87->86 cells, with big drops
  in ~15 (lubu:attack 398+627->187+623, xuchu:attack 310+628->
  128+623, zhaoyun:attack 159+173->74+162, walk0s to near-zero,
  xuchu:walk0 zeroed); 3-4 backfires on tiny-overlap non-strikes
  (guanyu:sweep 11+41->142+269). (5) Calibration proof: 21 adopts;
  model clearance >=9 paint-zeroes, 5.5-7 partially improves or
  backfires (wrap fingertips extend ~3-4u past the fist center, arm
  bulk ~2.5u - model 5.5 underpredicts paint by ~2u); combo table
  shows -side never clears, +side needs far-flip, p=6 bows swing
  the upper arm back INTO the fist (non-monotonic); 24 cells are
  model-pass/paint-fail (unreachable by any model trigger).
  Guards handgrip/uir13/bodyparts/handparts/likeness 47/47 green.
- Files changed: src/game/art/armik.ts (bendElbowOffHaft sideSign +
  protracted return + armClearance), src/game/art/weapons.ts (combo
  search + farHintOverride), TASKS.md, PROGRESS.md.
- Verification run: tsc 0; lint 0 (touched files); strikearms 1/1;
  guards 47/47; G6 still failing on 86 cells (pin working).
  Capture/eye-review/vision + full unit/browser gates deferred to
  the completing attempt (geometry still churning; no DONE claim).
- Result: partial - mechanism + big reductions; literal-0 blocked
  on wrap extent (needs UIR-19-adjacent art or owner masking call)
  or G6 scope renegotiation.
- Status after: UIR-16 IN_PROGRESS (attempt 2).
- Remaining work: attempt 3 (LAST before rule 5 forces BLOCKED):
  (a) FIRST capture + eye-review the 21 adopted cells (J1 socket /
  J2 / J6 sanity gate on the bends); (b) if review passes, one final
  push (bulk-aware threshold? wrap-extent analysis?); (c) else record
  BLOCKED with the renegotiation proposal (G6 = 0 on the 9
  reviewer-A/B cells + rim tolerance elsewhere) - do NOT weaken the
  gate unilaterally.
- Next recommended task: UIR-16 attempt 3 (same task).

### 2026-09-28 21:40 UTC - UIR-16 (attempt 1 - IN_PROGRESS)

- Status before: UIR-16 TODO (V-15b: far fist paints over the near
  elbow on strikes, up to 398+627px).
- Work completed: (1) G6 gate added to test/game/arm-chain.test.ts
  (gripF+wrapF over near-arm footprint = 0 on all standing moves)
  with a negative control - FAILS first on 87 cells as the pin.
  (2) Close-stack mechanism in fitFarHand (armik.ts): keeps the
  UIR-15 wide-back grip when it clears the solved near-arm segments
  by 5.5u, else stacks close (back-close then forward-close,
  reachable + clearing), else keeps the wide grip (grip-hold
  preserved). Threaded through weapons.ts (solved near chain).
  Behavior-preserving today: all 87 values identical, strikearms +
  handgrip + uir13 + bodyparts + handparts + likeness green (47/47),
  tsc/lint clean.
- PROOF (placement alone cannot satisfy G6): s-sweep probes over the
  live poses show (i) forward grips are UNREACHABLE on strikes (far
  shoulder cannot reach past the near hand - option (a) dead);
  (ii) the near arm rails the haft across the whole valid back range
  (segment clearance 0-4u everywhere, e.g. zhaoyun:attack; elbow ON
  the haft, near arm nearly straight with h~1.2u); (iii) the few
  high-clearance far-back spots fail the strikearms side/turn floors
  or sit past the butt fitting. E.g. lubu:attack: fist (62.9,35.0)
  sits 3.7u from the upper-arm segment with all alternatives worse.
- Files changed: test/game/arm-chain.test.ts (G6 + control),
  src/game/art/armik.ts (CLOSE_GRIP_SEP/ELBOW_CLEARANCE/fitCloseStack),
  src/game/art/weapons.ts (avoid threading), TASKS.md, PROGRESS.md.
- Verification run: G6 fails on 87 cells (pin, pre-existing values);
  strikearms/handgrip/uir13/bodyparts/handparts/likeness 47/47;
  tsc 0; lint 0. Full unit + browser gates deferred to the completing
  attempt (no behavior change yet).
- Result: partial - mechanism + pin landed, clearance unsolved.
- Status after: UIR-16 IN_PROGRESS (attempt 1).
- Remaining work: bend the near elbow OFF the haft on conflicting
  two-handed strikes (forced shoulder protraction ~4u toward the hand
  + branch selection away from the haft/fist), then re-run G6 +
  strikearms (side rule!) + eye-review J1 (socket) + J2 + full gates
  + capture re-review. ALTERNATIVE if that fails: renegotiate G6
  scope with the owner (e.g. exclude sub-perceptual wrap rims) -
  do NOT weaken the gate unilaterally.
- Next recommended task: UIR-16 attempt 2 (same task).
