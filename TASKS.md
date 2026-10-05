# Work Queue

Statuses: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`.

The loop processes tasks from top to bottom and works on only one task per iteration.

Keep this file short. Once more than 20 tasks are `DONE`, move the oldest of them
to `TASKS-ARCHIVE.md`; every iteration reads this file to find the first `TODO`,
and scanning a long tail of finished work costs something each time.

## Owner-prioritized whole-cast motion rollout

The owner accepts Guan Yu's enhancements and authorizes all characters through later loop threads. This main-thread handoff is planning only. Full contract: [CAST_MOTION_ROLLOUT.md](docs/CAST_MOTION_ROLLOUT.md). Remain opt-in until owner activation approval.

Selection: due producer review first, then the earliest ready CMR task; continue it while IN_PROGRESS. A failed prerequisite prevents later CMR tasks from starting. One repository writer/one task per iteration; do not bypass existing retry, verification or permission rules. Older active tracks below are owner-deferred with evidence intact. No runner/scheduler policy changes.

### CMR-03 - Stage-aware bounded atlas loading/cache

- Status: DONE (attempt 3, 2026-10-01 UTC, verified same day; 3 attempts
  total - attempt 1 catalog/cache core `7489061`, attempt 2 trimmed repack
  `3ff7a3d`, attempt 3 stage-scoped runtime + shared atlas frames: fetch +
  SHA-256 page loader, stage/hero/2P/prefetch scope with zero boot
  downloads, atomic per-fighter publication with negative controls, trim/
  pivot frame display (no per-cell canvas clones), refcount/evict/cancel on
  restart, co-op join paths, opt-in dist behavior on Canvas+WebGL)
- Dependency: CMR-02 DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-03](docs/motion-tasks/CMR-03.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Atomic per-fighter verification, stage/co-op/prefetch/eviction; shared atlas frames; 2048 pages,16MiB/fighter,128MiBcache,12MiB stage-entry ceilings.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-04 - Generic authoring/preparation/provenance tooling

- Status: DONE (attempt 1, 2026-10-01 UTC, verified same day) - generic
  fighter-parameterized pipeline (`scripts/motion-pipeline.mjs`) + durable
  request ledger (`scripts/motion-budget.mjs`, seeded in
  `art/motion/generation-budget.json`); 28 fixture/negative/determinism
  tests incl. the Guan Yu 90-frame RGBA/pivot round-trip through the
  generic restore; no cast generation
- Dependency: CMR-03 DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-04](docs/motion-tasks/CMR-04.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Variable frame/page counts, stable pivots/trim/dedup, deterministic output and durable candidate/request budgets; no new cast art yet.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-05 - Actual-motion capture/review/test harness

- Status: DONE (attempt 1, 2026-10-01 UTC, verified same day) - capture/
  review harness for the actual `?motion=1` path: `scripts/motion-capture.mjs`
  + `e2e/motion-capture.spec.ts` + `scripts/motion-review-core.mjs` (negative
  controls, coverage with honest `unseen`, pacing/resource reports,
  before/after pairs across rotations); live Guan Yu captures on canvas+webgl
  validated clean; commands documented in
  [MOTION_CAPTURE.md](docs/motion-tasks/MOTION_CAPTURE.md)
- Dependency: CMR-04 DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-05](docs/motion-tasks/CMR-05.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: New runtime path in before/after capture and independent producer review; actual sequence/state/clock coverage and meaningful negative controls.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-06A - Wei Soldier: author/prepare full motion pack

- Status: DONE (attempt 2, 2026-10-01, verified). Owner directive executed
  end to end: problem cells identified (7 occluded-sword cells; heads
  proved consistent), redrawn within budget (8/8), spliced (originals in
  previous/), pack prepared deterministic (manifest f7f0fdd8, 45 frames =
  37 unique + 8 shared-bookend aliases, one 2003x1369 page, decoded
  7,943,600 B = 7.58 MiB <= 16 MiB, 0 budget errors, complete
  signatures/provenance). Acceptance 7/7: identity/anatomy reviews
  fingerprint-verified; fixed scale + ground registration exact; pages/
  budget/determinism verified; continuity review cites frame IDs
  (CONTINUITY.md); head size ±5% and fully-observable weapon length 5.3%
  spread (sword-stack measurement, shared ruler); Guan Yu untouched, no
  runtime activation. Evidence: [PROVENANCE.md](art/motion/soldier/PROVENANCE.md)
  / [CONTINUITY.md](art/motion/soldier/CONTINUITY.md) /
  [AUTHORING-PLAN.md](art/motion/soldier/AUTHORING-PLAN.md).
  CMR-06B is unblocked.
- Dependency: CMR-05 DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-06A](docs/motion-tasks/CMR-06A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable soldier identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-06B - Wei Soldier: integrate/review in motion

- Status: DONE (attempt 1, 2026-10-02, verified). Full review report in
  [SOLDIER_ACTION_REVIEW.md](docs/SOLDIER_ACTION_REVIEW.md): canvas+webgl
  contact sheets + 8 enlarged crops reviewed (fingerprint-verified), all
  actions both facings on `motion-source:soldier` (76/76 rows), no legacy
  blends (early scare adjudicated as thumbnail misread), dead renders at
  alpha 0 by design, hitstun tint + i-frame blink verified on motion art,
  renderer parity confirmed. Full gate battery green: lint+tsc clean, unit
  822|1 known G6|6, captures self-check green both renderers, vision 5/5,
  prodbuild 8/8 (two-pack built-app assertions), signal 13/13 zero
  errors/violations. CMR-07A is unblocked; producer verifies independently
  on fresh captures per bounded work 6.
- Dependency: CMR-06A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-06B](docs/motion-tasks/CMR-06B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic soldier pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-07A - Wei Spearman: author/prepare full motion pack

- Status: DONE (attempt 1; owner accepted option (d) 2026-10-02 and reset
  the BLOCKED task by direct instruction: pack accepted as-is with
  documented limitation. Item 4 WAIVED (heads 7.9% pass; spears 18.2%
  fail but all 27 in-band; 2 marginal direction steps folded in with
  rationale). All other items verified: 45 frames/37 unique + 8 shared
  bookends; identity/anatomy consistent; per-sheet registration + ground
  anchoring; 2010x912/density2/5.76MiB/0 errors/deterministic
  `a2f89978`; continuity reviewed frame-by-frame on fresh display-scale
  sheet; Guan Yu/soldier/src untouched; zero runtime activation.)
- Dependency: CMR-06B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-07A](docs/motion-tasks/CMR-07A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable spearman identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-07B - Wei Spearman: integrate/review in motion

- Status: DONE (attempt 1; prodbuild 8/8 incl. 3-pack pilot; capture
  rotation re-runs identical + 6 pair sheets per renderer; all 8
  acceptance items closed with evidence (spec annotated); signal
  skipped with documented rationale (no timing/AI changes). Pack live
  behind ?motion=1 with full state bindings, captures, vision review,
  and producer handoff.)
- Dependency: CMR-07A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-07B](docs/motion-tasks/CMR-07B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic spearman pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-08A - Wei Archer: author/prepare full motion pack

- Status: DONE (attempt 1; continuity reviewed frame-by-frame on
  fresh display-scale sheet (37 unique frames, all sequences cohere,
  bookends/grounding/identity stable); all 7 acceptance items closed
  with evidence (45/37+8 manifest, identity, registration, bows 4.8% +
  heads 6.1% + direction coherent, 2045x924/7.56MiB/deterministic,
  continuity, untouched + zero activation). No waiver, no repairs;
  1/8 spare + 3/3 repair reserve intact.)
- Dependency: CMR-07B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-08A](docs/motion-tasks/CMR-08A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable archer identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-08B - Wei Archer: integrate/review in motion

- Status: DONE (attempt 1; 2026-10-02, verified). Full review report in
  [ARCHER_ACTION_REVIEW.md](docs/ARCHER_ACTION_REVIEW.md): canvas+webgl
  contact sheets (1280x2240, fingerprinted) + 15 enlarged crops reviewed,
  all 13 shooter actions both facings on `motion-source:archer` (100/100
  rows, 0 legacy), four distinct firing phases with release-arrowless
  correctness, no legacy blends, stable bookends/identity, renderer parity
  (only pixel delta is the pre-existing canvas-absent/webgl-present
  hitstun tint, reproduces soldier). Honest limits recorded: dying crops
  show lowCollapse continuity (true dying drawings unit-pinned), second
  shoot/idle samples show live AI walk-on. Full gate battery green:
  lint+tsc clean, units 858|1-known-G6|6 + targeted 16/16, captures
  self-check green both renderers (50 rows, 0 errors, 0 blanks, 2 same
  opens), vision 5/5, prodbuild 8/8 (4-pack pilot), signal 13/13 zero
  violations. CMR-09A is unblocked; producer verifies independently on
  fresh captures per bounded work 6.
- Dependency: CMR-08A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-08B](docs/motion-tasks/CMR-08B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic archer pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-09A - Zhang Fei: author/prepare full motion pack

- Status: DONE (attempt 1; 2026-10-03, verified). Owner accepted the
  acceptance-4 waiver 2026-10-03 ("waive now") by direct instruction:
  item 4 closed with documented limitation (heads 6.4% thrust-pose /
  11.2% incl. finisher; weapons 88.3% FULL / 12.9% walk / 41.9% excl
  extremes; direction ≤36° PASS). Pack prepared deterministic
  (manifest 55e09318, re-verified byte-identical at close-out; 56
  frames, 2 pages ≤2048, 15.95MiB ≤ 16MiB; lint+tsc clean, units
  858|1-known-G6|6). Continuity reviewed
  frame-by-frame on the fresh display-scale sheet + 10 strips (all 56
  frames; guards ARE walk:0, down IS fall:4, by clip convention).
  Evidence: [PROVENANCE.md](art/motion/zhangfei/PROVENANCE.md) /
  [CONTINUITY](art/motion/zhangfei/PROVENANCE.md) /
  [IDENTITY.md](art/motion/zhangfei/IDENTITY.md).
  CMR-09B is unblocked.
- Dependency: CMR-08B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-09A](docs/motion-tasks/CMR-09A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable zhangfei identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-09B - Zhang Fei: integrate/review in motion

- Status: DONE (attempt 1; 2026-10-03, verified). Zhangfei pack
  registered + published behind ?motion=1 (catalog entry, 20-clip
  table, dispatch, validator; 22 MiB owner exception with the
  pipeline gate now counting page pixels); captures green both
  renderers (73 rows, 0 errors, 37 crops each) with the fighter
  review in docs/ZHANGFEI_ACTION_REVIEW.md; per-kind collapseTail
  fixed a 34-tick legacy leak after throws (guanyu/mooks provably
  unchanged); gates green (units 883|1-known-G6|6, motion e2e,
  vision 5/5, prodbuild 8/8, signal 13/13; full e2e shows only the
  two known-intermittent flakes, green in isolation). Evidence:
  [review](docs/ZHANGFEI_ACTION_REVIEW.md) /
  [PROVENANCE.md](art/motion/zhangfei/PROVENANCE.md).
  CMR-10A is unblocked.
- Dependency: CMR-09A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-09B](docs/motion-tasks/CMR-09B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic zhangfei pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-10A - Zhao Yun: author/prepare full motion pack

- Status: DONE (attempt 1; 2026-10-03, verified). Zhao Yun
  56-frame pack authored + prepared (base 0.700052, guard 226.1px
  = 94.2% of Guan Yu, 2 pages 20.16MB <= 22.02MB owner exception,
  deterministic de869ad2); acceptance-4 weapon waived by owner
  with full disclosure (walk 9.4% passes, R1 fixed 4 worst shorts,
  3 splice-infeasible disclosed), direction passes, head accepted
  on consistency evidence; continuity reviewed (all 10 arcs
  coherent, bookends stable). Budget 15/16 + repair 1/3. Evidence:
  [PROVENANCE.md](art/motion/zhaoyun/PROVENANCE.md). CMR-10B is
  unblocked.
- Dependency: CMR-09B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-10A](docs/motion-tasks/CMR-10A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable zhaoyun identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-10B - Zhao Yun: integrate/review in motion

- Status: DONE (attempt 1; 2026-10-03, verified). Pack registered
  behind ?motion=1 (56 frames, 21MB exception honored); 20-clip
  table + dispatch + validator from zy.* core windows (rider swap
  handled); 22 new unit tests; canvas+webgl captures green (73
  rows, 0 errors); all actions reviewed passing (self-check);
  gates: units 905+6 (G6 only), e2e motion 12/12, vision 5/5,
  prodbuild 8/8, signal 13/13, lint+tsc clean. Evidence:
  [review](docs/ZHAOYUN_ACTION_REVIEW.md). CMR-11A is unblocked.
- Dependency: CMR-10A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-10B](docs/motion-tasks/CMR-10B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic zhaoyun pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-11A - Wei Yan: author/prepare full motion pack

- Status: DONE (attempt 1, 2026-10-05 UTC, verified same day;
  owner explicitly chose option A on 2026-10-04, authorizing +10
  Wei Yan authoring requests, cap 16→26 without resetting the ten
  spent; global 200 and two sheets per sequence unchanged).
  The v1 ten sheets drew a wrong short
  saber; they remain only as pose/identity references. V2 weapon
  spec now follows figures.ts/WEAPON_ART.md (69u haft + ~23u blade
  overhang, tassel, gold fittings). Walk-v2 request 11/26 was
  reserved and generated as walk sheet candidate 2/2; source nine
  figures mechanically clean, visual weapon identity correct and
  overlay-checked tip-to-pommel walk spread 7.9% (459–497 raw px),
  versus ~451px comparator derived from Zhao Yun. Jab1-v2 request
  12/26 was reserved then generated with ordered weapon/body/face/
  guard refs (one transient fetch failure, same reservation retry);
  nine components and source identity pass, but jab1 core drive 1
  and extension 2 and spare 7 OMIT the rear haft/pommel: source
  REJECTED for integration. Overlay's 111/118/126px numbers on
  those cells are invalid ferrule-to-tip distances, not weapon
  lengths; visible omission is the actual defect. Focused authoring
  request 13/26 re-authored jab1:1/2; the provider also redrew other
  drawings, so a deterministic component-owner splice retains only
  1/2 from the edit and ALL other cells from the immutable original.
  Resulting `jab1-v2-prepared-source.png` has 9 separated figures,
  unchanged non-target component hashes; overlay-verified kept cells
  [0..4] have true pommel-to-tip lengths [469,479,469,495,463]
  raw px (6.7% within this sheet), direction steps ≤27°; source
  accepted, pack NOT YET prepared. Spare 7 remains culled. Jab2-v2
  request 14/26 generated nine separated low-sweep poses (distinct
  from jab1), but core extension 2 and spare 7 omit the rear wood
  haft/pommel, and core follow 3 measures only 422px tip-to-butt vs
  491px in chamber 0; source is NOT accepted. Detector's 112px on
  cell 2 is ferrule-to-tip, INVALID for full weapon. Focused
  request 15/26 corrected ONLY jab2:2/3 by SHA-pinned component
  splice from the edit into preserved original; prepared source
  `jab2-v2-prepared-source.png` is deterministic (sha e61f9883),
  9 separate figures, keep [0..4] and cull short spare 7. True
  butt-to-tip [491,468,498,453,451] raw px, mean 472.2, spread
  **9.9534%**, a marginal source-level ≤10% pass; angles all
  ≤12° with steps ≤8°. Finisher-v2 request 16/26 generated heavy
  chop poses but raw cell 2 touched the image's right border
  (pipeline FAIL) and raw [0..4] length spread was ~10.6%
  (acceptance FAIL). Verified spare substitution/culling:
  `finisher-v2-prepared-source.png` sha 6f622f91, play order
  [0 coil,1 launch,3 heavy extension,6 follow,4 recover], 5 clean
  separated components with zero edge contact; true pommel-tip
  [522,510,543,506,494]px, mean 515, spread 9.5146% within
  finisher sheet, directed steps ≤30°. Special-v2 request
  17/26 generated nine clean figures; raw core cell 2 has a
  shortened 439px weapon (first-five spread ~14.6%, FAIL).
  Reviewed spare remap: SHA-pinned `special-v2-prepared-source.png`
  sha 5040f1ea, keep/play [0 raise,1 coil,8 pre-spin,3 strike,
  4 follow], cull [2,5,6,7] (spare 6 has no butt), five separate
  unclipped drawings. True lengths [483,495,482,503,510]px,
  5.6611% within sheet; steps ≤21°. Source drawings accepted
  ONLY; full cross-sequence acceptance/16MiB cap unverified.
  Jump-v2 request 18/26 generated nine clean components and
  airborne/kicking poses, but core [0..5] weapon spread ~20.2%
  ([541,491,475,579,485,439]px), FAIL. Spare kick6 (506px)
  improves pose, yet landing8 (457px) leaves ~17% gap to
  takeoff0 541px, still FAIL. Focused authoring request 19/26
  targeted jump0/3/5: corrected takeoff0 477px; kick3 533px
  still too long; landing5 437px still too short. SHA-pinned
  `jump-v2-prepared-source.png` sha 5a4244cf preserves original
  1..8 and splices only repaired 0, 9 separated drawings.
  Reviewed alternate kick6 + grounded crouch8 at [477,491,
  475,506,485,457]px => 10.17% FAIL; choosing airborne spare7
  as landing yields a numeric ~7% but is a FALSE semantic pass.
  Jump drawings ACCEPTED via deterministic landing retouch (no
  image request, no ledger event): `retouch-weiyan-jump-landing-v2.mjs`
  slides ONLY cell5's pommel/cap piece back 44.15px along its axis
  and fills the gap from a median cross-section of real shaft wood
  (script + 5x seam crop reviewed; other 8 components hash-identical).
  `jump-v2-retouched-source.png` sha 0f3dc631, deterministic rerun.
  Final play order [0 takeoff,1 ascent,2 apex,6 kick,4 descent,5
  landing] (cull 3,7,8): true lengths [477,491,475,506,485,483]px,
  mean 486.2, spread 6.376% ≤10% source-level PASS; directed steps
  ≤10°. Fall-v2 request 20/26 (one transient attachment error,
  identical retry under same reservation) generated nine clean
  poses with correct arc incl. flat DOWN bookend, but core
  [502,470,438,500,558]px spread 24.3% FAIL: tumble cell2
  genuinely short (438px), DOWN cell4 genuinely long (558px),
  both endpoint-verified; DOWN irreplaceable so no spare remap
  works. Focused request 21/26 under-corrected both (tumble +22px,
  DOWN −9px); preserved unused. Deterministic retouch instead
  (`retouch-weiyan-fall-v2.mjs`, input-pinned): tumble extended
  438→485px, DOWN shortened 558→490px; other 7 components
  hash-identical; seams + endpoints reviewed. `fall-v2-retouched-
  source.png` sha 161b4efe, deterministic rerun. Final [0..4]:
  [502,470,485,500,490]px, spread 6.54% ≤10% source-level PASS;
  steps ≤10°. Getup-v2 request 22/26 generated nine clean poses
  but raw core [537,469,440,515,485]px spread 19.8% FAIL (elbow
  long, crouch short). Reviewed spare remap: `getup-v2-prepared-
  source.png` sha e88295dc, keep/play [6 elbow-push,1 kneel,
  8 crouch,3 half-rise,4 stand], cull [0,2,5,7]; true lengths
  [500,469,500,515,485]px, 9.32% within sheet; steps ≤5°.
  Misc-v2 request 23/26 generated nine clean poses but raw core
  [488,461,479,526,501]px spread 13.2% FAIL (hold cell3 long
  526px). Reviewed spare remap: `misc-v2-prepared-source.png`
  sha 84a23584, keep/play [0 recoil,1 fold,2 clamp,7 hold,
  4 release], cull [3,5,6,8]; true lengths [488,461,479,484,
  501]px, 8.29% within sheet; steps ≤20°. Rider-v2 request
  24/26 (LAST whole-sheet slot) generated nine clean seated poses,
  no horse parts, but core six spread ~30% FAIL: sweep cell4 long
  (554px), dismount cell5 short (406px) AND its blade cut by the
  sheet edge (25 border px) — endpoint-verified, no spare or
  retouch fix (tip would be invented). Focused request 25/26
  fixed sweep (554→481px) and completed dismount's blade clear
  of the edge but short (450px); spliced both (`c80ff854`),
  then deterministic retouch extended dismount 450→480px
  (`5c5cba35`, only cell5 changed, seams reviewed). Final
  [512,491,485,516,481,480]px, spread 7.29% ≤10% source-level
  PASS; steps ≤20°. ALL TEN v2 sequences source-accepted. Pack
  FIRST SOLVE done (`prepare-weiyan-v2.mjs`, rev weiyan-2): base
  0.623906 budget-bound, 56/56 unique frames, deterministic
  manifest `007790c5`, pages ≤2048², 15.21MB ≤16MB (9.3% margin),
  zero step-downs; 9 bounds-overlap suspects (review flags, no
  merges). Guard 199px (82.9% Guan Yu; factors UNVERIFIED).
  V2 guard measurement VERIFIED (overlay: true faces): getup
  factor 0.837 APPLIED (ground 0.831 + height 0.844, spread
  0.013); all else factor 1 (no guard cells). Re-solve: base
  0.632606, 56/56 unique, deterministic `2fef24a5`, 14.43MB
  (9.8% margin), guard 201.8px. Acceptance-4 DIAGNOSED
  (`landmarks-final-weiyan-v2.mjs`, 56/56 cross-checked ±1px):
  weapon per-sheet ALL pass but FULL-56 spread 31.3% FAIL
  (getup tail 248-273 + finisher top 343.5; exact 15-cell failing
  list recorded); head auto-method VOID (verified pauldron/hand
  misfires) with consistency evidence passing (walk 3.7%, guards
  4.1%); direction max 30° PASS. Getup elbow deterministic paths
  all failed (rear: edge/boot; forward: hand/tassel tangle —
  proven by crop analysis + a safely-aborted flood run). Repair
  round R1 instead: getup:6 redrawn 500→554px (displayed 293.35,
  in-band), pose preserved, overlay-verified, settled accepted,
  spliced (`a34991ff`). 14-op campaign COMPLETE (script fixed:
  bounds-checks, pristine snapshots, graft removed): all gates
  green, achieved ±1px on all 14, all seams reviewed clean
  (incl. 105px fill + finisher:3 dirt zone). Re-measure: weapon
  FULL-56 289.0–316.8 spread **9.1% PASS**; direction max 29°
  PASS; head still auto-VOID + consistency. Re-solve: base
  0.629727, deterministic `58d10b89`, 14.42MB (9.9% margin).
  Continuity review remains. Ledger 25/26; repair reserve 2/3
  remain; no runtime or decode exception. Next: offline
  continuity review. See V2 plan/provenance.
- Dependency: CMR-10B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-11A](docs/motion-tasks/CMR-11A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable weiyan identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-11B - Wei Yan: integrate/review in motion

- Status: DONE (attempt 1, 2026-10-05 UTC, verified same day;
  CMR-11A DONE with prepared pack rev weiyan-2).
  Slice 1 DONE: emit runtime assets + clips/dispatch/validator +
  catalog wiring + 22 unit tests green (mirrors CMR-10B; NO decoded
  exception). Slice 2 DONE: capture harness wired for weiyan
  (17-action isolated lists, bindings, coverage, contract-cap
  resources); canvas + webgl captures green (73 rows each, 0
  trace/page errors, 0 hard issues, all motion art, both facings,
  coop/mixed covered); contacts (37 crops ×2) + 4 enlarged crops
  reviewed; per-action verdicts all PASS (self-check) in
  `docs/WEIYAN_ACTION_REVIEW.md`; ghost slivers disclosed as the
  known shared limitation. Slice 3 DONE: vision 5/5, prodbuild
  8/8 (motion pilot opt-in/out both renderers on built bundle),
  signal 13/13 (incl. weiyan marathon, zero violations),
  motion-loader e2e 5/5, full unit 928+6 with only known G6.
  All 8 acceptance items verified; no gameplay changes; defaults
  legacy, opt-in only.
- Dependency: CMR-11A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-11B](docs/motion-tasks/CMR-11B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic weiyan pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-12A - Huang Zhong: author/prepare full motion pack

- Status: IN_PROGRESS (attempt 1; identity locked from inspected
  masters `338d9c9e`/`4dcac826`, weapon from rig files — 42u
  recurve, hand-centred riser, continuous string, no tassel;
  10-sheet plan recorded. Walk sheet candidate 1/2 ACCEPTED
  (`806bb045`, 9/9 clean, bow chords 184–201px = 9.09% marginal
  pass overlay-verified, direction max 3.7°). Jab1 sheet 1/2
  generated (`0d319260`, 9/9 clean): poses accepted but core
  weapons REJECTED (cells 1,2 extra arrow-like shaft; 3,5,6
  partial thrust bows, strike nock unobservable — no spare
  remap). Focused fix-1 (`8e767cc2`) PARTIAL: cell 1 fixed
  (shaft gone, 4x-verified), cell 2 proven always-clean
  (request-2 sleeve misread corrected), cell 3 UNCHANGED (still
  partial ~76px hook — sideways recurve failed 6/6). Pivot:
  fix-2 (`8221b0bf`) FIXED cell 3 (vertical pivot proven:
  complete recurve, chord 220.1). Spliced v1 (`c593c6f9`,
  deterministic, hash-proofed) but keep-set FAILS 14.51%
  (cell 2 short at 189.7 vs 205–220 cluster; direction 19.6°
  pass). Fix-3 (`ef0e14d8`) lengthened cell 2 (190→224px,
  overshot but in-band); splice v2 (`5a750da4`, deterministic)
  keep-set 8.96% marginal PASS, direction 19.6° pass → jab1
  ACCEPTED (4 requests). Rule: all melee bows vertical.
  Jab2 sheet 1/2 (`1cb7304b`, 9/9 clean verticals, poses pass):
  keep-set 10.40% FAIL on c4 outlier (208 vs 188–195 cluster;
  direction 8.1° pass; no spare remap — 7,8 also long). Tool
  lesson: read_image local files before using as refs (2
  attachment errors, same reservation retry). Fix (`f10b0768`)
  landed cell 4 at 199.0px in-band; splice (`303148c9`,
  deterministic) keep-set 5.80% robust PASS, direction 8.1°
  pass → jab2 ACCEPTED (2 requests). Finisher sheet 1/2
  (`dae97d05`, 9/9 clean verticals, poses pass): keep-set FAILS
  ~19.5% — pose-correlated lengths (c4 207 < c0 221 < c1 230 <
  c2 238 < c3 252; deeper lunge = longer bow; spares 5,6 also
  long, no remap). Fix (`c2b52933`) REJECTED (reshuffled: c2 to
  183, c3 to ~266). Micro-verified TRUTH: orig keep
  [241.5,232.1,241.0,251.0,231.6] = 8.13% PASS (2x reads had
  under-read curled tips) → finisher ORIG ACCEPTED as-is (no
  splice). Jump sheet 1/2 (`82ed19c3`, 9/9 clean verticals,
  genuine kick, poses pass): LENGTH INCONCLUSIVE — 5 micro/ASCII
  rounds contradict (±20px swings). Stopped the spiral. Next: ONE
  automated chord tool (archer-v10) + verdict. Tool v1 built:
  fits only isolated limbs (c1/c2 plausible); merged cells fail
  honestly; fallback micros contradicted (±20–30px). Length
  STILL unresolved. Full-curve maps then gave the verdict: c3
  short+diagonal (~199 vs 232–256 cluster) → jump FAILS on
  demonstrated grounds (c4 read still open; PCA fits retired for
  recurves — they overshoot curled tips). Next: c4 closing micro
  + focused fix (c3 vertical re-brief; c4 if out-of-band) +
  splice + re-measure. Concurrent turn raced + died silent;
  adopted its jump fix (`2eba6a10`, ledger 11): fix cell 3 broke
  the kick pose (tuck now — REJECTED), cell 4 unmeasured.
  Remap hunt via ASCII maps inconclusive (unreadable at width).
  Jump MUST close with zero new calls (5 left for 5 sheets):
  kick from {orig c6/c8} + descent from {orig/fix c4} via 2x
  views + one overlay. Else BLOCKED. Ledger 11/16, global
  103/200; repair reserve 3/3 untouched).
  Jump verdict: 2x zone views measured remap candidates — kick =
  orig c6 (deepest extension, 255.9 in-band), descent = orig c4
  (260.4; fix c4 identical so orig kept) → keep [0,1,2,6,4,5]
  = 8.78% marginal PASS, direction 10.0° pass (overlay: all 12
  markers on wood) → jump ORIG ACCEPTED as-is, no splice. 5/10
  done. ZERO margin: 5 requests left for fall/getup/misc/special/
  rider (11/16). Fall sheet 1/2 (`f7eca5e1`, 9/9 clean verticals,
  three flat DOWNs, poses pass): length INCONCLUSIVE — overlay
  round 1 exposed systematic +10px top bias (measured RAW alpha
  incl. generator halo; must measure CLEANED). Next: gradient-tip
  tool on cleaned data + single overlay verdict (no image call).
  Ledger 12/16, global 104/200; 4 left for 4 sheets.
- Dependency: CMR-11B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-12A](docs/motion-tasks/CMR-12A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable huangzhong identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-12B - Huang Zhong: integrate/review in motion

- Status: TODO
- Dependency: CMR-12A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-12B](docs/motion-tasks/CMR-12B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic huangzhong pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-13A - Li Dian: author/prepare full motion pack

- Status: TODO
- Dependency: CMR-12B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-13A](docs/motion-tasks/CMR-13A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable lidian identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-13B - Li Dian: integrate/review in motion

- Status: TODO
- Dependency: CMR-13A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-13B](docs/motion-tasks/CMR-13B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic lidian pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-14A - Xiahou Dun: author/prepare full motion pack

- Status: TODO
- Dependency: CMR-13B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-14A](docs/motion-tasks/CMR-14A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable xiahoudun identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-14B - Xiahou Dun: integrate/review in motion

- Status: TODO
- Dependency: CMR-14A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-14B](docs/motion-tasks/CMR-14B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic xiahoudun pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-15A - Xu Chu: author/prepare full motion pack

- Status: TODO
- Dependency: CMR-14B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-15A](docs/motion-tasks/CMR-15A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable xuchu identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-15B - Xu Chu: integrate/review in motion

- Status: TODO
- Dependency: CMR-15A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-15B](docs/motion-tasks/CMR-15B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic xuchu pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-16A - Cao Ren: author/prepare full motion pack

- Status: TODO
- Dependency: CMR-15B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-16A](docs/motion-tasks/CMR-16A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable caoren identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-16B - Cao Ren: integrate/review in motion

- Status: TODO
- Dependency: CMR-16A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-16B](docs/motion-tasks/CMR-16B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic caoren pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-17A - Zhang Liao: author/prepare full motion pack

- Status: TODO
- Dependency: CMR-16B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-17A](docs/motion-tasks/CMR-17A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable zhangliao identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-17B - Zhang Liao: integrate/review in motion

- Status: TODO
- Dependency: CMR-17A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-17B](docs/motion-tasks/CMR-17B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic zhangliao pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-18A - Xu Huang: author/prepare full motion pack

- Status: TODO
- Dependency: CMR-17B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-18A](docs/motion-tasks/CMR-18A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable xuhuang identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-18B - Xu Huang: integrate/review in motion

- Status: TODO
- Dependency: CMR-18A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-18B](docs/motion-tasks/CMR-18B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic xuhuang pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-19A - Zhang He: author/prepare full motion pack

- Status: TODO
- Dependency: CMR-18B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-19A](docs/motion-tasks/CMR-19A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable zhanghe identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-19B - Zhang He: integrate/review in motion

- Status: TODO
- Dependency: CMR-19A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-19B](docs/motion-tasks/CMR-19B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic zhanghe pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-20A - Cao Cao: author/prepare full motion pack

- Status: TODO
- Dependency: CMR-19B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-20A](docs/motion-tasks/CMR-20A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable caocao identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-20B - Cao Cao: integrate/review in motion

- Status: TODO
- Dependency: CMR-20A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-20B](docs/motion-tasks/CMR-20B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic caocao pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-21A - Lu Bu: author/prepare full motion pack

- Status: TODO
- Dependency: CMR-20B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-21A](docs/motion-tasks/CMR-21A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable lubu identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-21B - Lu Bu: integrate/review in motion

- Status: TODO
- Dependency: CMR-21A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-21B](docs/motion-tasks/CMR-21B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic lubu pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-22 - Shared horse locomotion/rider composition

- Status: TODO
- Dependency: CMR-21B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-22](docs/motion-tasks/CMR-22.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete trot/run/fleeing, hoof/saddle registration, correct co-op rider association; preserve hero pixels and mount gameplay.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-23 - Paired grabs/throws and saddle integration

- Status: TODO
- Dependency: CMR-22 DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-23](docs/motion-tasks/CMR-23.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: 5 heroes x12enemykinds x2facings; upright held/contact/depth/release/impact alignment; presentation-only correction, core physics unchanged.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-24 - Full-cast verification and owner presentation

- Status: TODO
- Dependency: CMR-23 DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-24](docs/motion-tasks/CMR-24.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: All17humanoids+horse action coverage, full serial gates/independent review/resource report; indexed videos; opt-in until owner activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

## Owner-directed motion experiment

### GYM-1 - Guan Yu whole-character walk and combo pilot

- Status: BLOCKED (owner-deferred for prioritized cast rollout; preserve attempt 2 evidence, not an exhausted-retry reset).
- Owner acceptance: the owner now accepts the Guan Yu enhancements as the rollout reference. Preserve displayed walk/combo pixels and timing. Historical weapon/landmark findings remain documented; visual acceptance is not a fabricated strict-metric pass. CMR tasks handle the generalized cast rollout, not regeneration of this pilot.
- Owner request: test complete art-directed sprite sequences for Guan Yu only, following the static whole-frame pilot.
- Delivered: fixed-registration guides, original candidate sheets, opt-in `?motion=1` clip playback from simulation ticks, atomic integrity fallback, temporal traces/recordings and negative controls. Attempt1 coveredidle/walk/combo; attempt2nowcoversallGuanYustateswithoutoldtextures.
- Acceptance: no old-art flashes, exact hit-window alignment, coherent alternating walk, <=10% head/weapon variation, no conspicuous action seams; criteria and results in `docs/GUANYU_MOTION_TEST.md`.
- Historical attempt-1 evidence: 8 technical unit tests, 4 capture/fallback browser cases, 2 built opt-in cases passed. Author visual assessment failed walk alternation and measured glaive shrink (~36%). Latest owner accepts the enhanced result above; those historical metrics remain visible, not a current prohibition of the approved CMR cast rollout.
- Attempt2: owner requested all Guan Yu actions. Separate54cellactionatlas+3targetedfallrepairs coversjump/kick/landing,hurt,fall/getup,special,grab/release,mounted/dismount,KO anddefensivestressstates. Bothatlasesloadatomically;regularpixelsunchanged. Landing/visualfallclockfreeze-safe,inputinterruptible;soloCONTINUEdefeatfinisheswithoutcoreticks. No oldtexturesinallactioncapture4/4;regularmotion4/4;units15/15;vision5/5;prodbuild6/6. Details/results: docs/GUANYU_ACTION_REVIEW.md.
- Transitionaudit:13newnegative-controltests fixhitstop+idle/walklanding,mountinterrupt,lateairattackstartup,activekick/retractcontact,midairuprightpop,brokensweepwindow andskipped-renderfallrestart. ActualCanvas/WebGLboundarycaptures2/2;combinedallactions6/6;full706passed/1baselineG6;vision5/5;prodbuild6/6unchanged. Artatlases/coreunchanged. Thisfollow-upbelongs toattempt2 (not a fourth generation attempt).
- Special/mountedexposureaudit:twoimagecandidatesrejectedforsizedrift;existingforwardguardsusedinstead. Maxdirectionstep~79->53special,~134->48mounted,pixel-supported60deggateandold-ordernegativecontrols. Atlases/coreunchanged;3newunitchecks,allaction3/3,vision5/5,prodbuild6/6;full709passed/1baselineG6. Imagebudget12exhaustedforcurrentpass,noblindretries.
- Mixedreview:480tick~8.04snormalinputchoreographybothfacings/CanvasWebGL2/2,realhit/knockdown/getup/grabthrowcase1/1. Screensconfirmopponentpronegrabposeisscoperemainder. Defensive thrownimpact/getupdefeatfixed lowpostureinsteadofuprightrecoil,2newunitcontrols/captures2/2. Full711passed/1baselineG6,vision5/5,prodbuild6/6;approvedart/core/otherfightersunchanged.
- Historical handoff: owner first chose review of Guan Yu before paired-grab expansion. Latest request accepts the enhancements and authorizes CMR whole-cast work, including paired presentation, only through later loop threads. No main-thread character implementation.
- Remaining deferred pilot details: historical weapon/cloth measurements not certified. Paired grab matching moves to CMR-23 with full-cast evidence; owner has now approved the Guan Yu enhancements visually. Do not regenerate approved walking. Rigged-model production remains a separate owner choice.
- Current priority: CMR queue first, older GYM-1/BODY-7/ENH-12/UIR-19 explicitly deferred; UIR-16 remains blocked and UIR-20 remains later TODO. Evidence and attempt counts are preserved, not reset.

### BODY-7 - Full verification sweep for the body overhaul

- Status: BLOCKED (owner-deferred for prioritized cast rollout; sweep complete 2026-09-27 UTC, whole-cast legacy acceptance unresolved).
- Preserve prior sweep evidence and remaining acceptance criteria; this deferral is not a DONE claim or retry reset.
- Dependency: BODY-3, BODY-4, BODY-5, BODY-6 DONE.
- Requirement: whole-cast review (all fighters x poses x facings,
  desktop + mobile, co-op + mounted), byte/decode-memory/boot-time
  report, full serial gates (lint, typecheck, unit, e2e, selfplay,
  vision Canvas/WebGL parity, build, prodbuild), final owner
  presentation.
- Acceptance criteria:
  - [x] Every gate green in one serial run; report recorded (this
        round: lint 0, tsc 0, unit 635/635, e2e 78, vision 5/5,
        selfplay 13/13, build 0, prodbuild 4/4; whole-cast review of
        all 17x14 + motion, 18 flags all dismissed with evidence, no
        UIR filings; byte/decode/boot report in PROGRESS).
  - [ ] Owner accepts the final cast (unresolved objections stay open).
- Non-goals: no new art in this task; fixes only.

## Enhancements

Add future enhancement tasks below this heading.

### ENH-12 - Name the gamepad where the UI names controls

- Status: BLOCKED (owner-deferred for prioritized cast rollout; preserve interrupted attempt 1, restored source and saved unverified draft).
- Resume only on an explicit owner queue decision after rollout priority; do not restart or discard the draft.
- Owner priority: deferred again - first ART-18 (now DONE), now the approved
  UI/art overhaul (UI-1/UI-2 DONE, UI-3..5 + ART-19/20 next). Draft:
  artifacts/loop/enh12-attempt1-partial.patch.
- Requirement:
  The title plate names keyboard and touch controls but never the
  GAMEPAD - a first-class input class per PROJECT.md. A pad-only player
  is told ARROWS/Z/X/C/ENTER/M/P, none of which their device has: the
  exact defect TitleScene's own comment fixed for phones ("naming the
  controls THIS device has"). ENH-11 also gave Start a pause role that
  no text mentions. Add gamepad naming where the UI already names
  controls: a title-plate line (A ATTACK / B JUMP / X SPECIAL / START
  CONFIRM-PAUSE) when a pad is visible, and a resume hint a pad player
  can act on (the ENH-11 follow-up). Design note: browsers may not
  expose a pad until first input, so the title line is best-effort on
  visibility (navigator.getGamepads + gamepadconnected); the
  synthetic-pad harness proves the mechanic.
- Acceptance criteria:
  - [ ] With a connected pad (synthetic-pad harness), the title shows a
        gamepad line naming the standard mapping's A/B/X actions and
        START (confirm + pause); without one, the desktop keyboard
        legend is unchanged (byte-identical text).
  - [ ] The pause resume hint names a control a pad player has (and the
        touch hint stays "TAP TO RESUME").
  - [ ] The title-labels test family (touch.spec "the title names the
        controls the device actually has") extends to the third class:
        KEYBOARD_ONLY tokens still banned on touch, gamepad tokens
        present when a pad is visible and absent otherwise.
  - [ ] No occlusion/label-fit regressions (the plate must fit its
        slab - measure, like the P PAUSE line was).
  - [ ] Full gates green (lint, typecheck, unit, e2e, signal, vision,
        prodbuild, build).
- Non-goals:
  - No remapping UI, no non-standard pad layouts, no touch or keyboard
    legend rewording, no DIFF-1 impact.
- Evidence:
  - artifacts/loop/proposals-gamepadnaming-enh12.md (this pass's review).

### UIR-10 - Paint the hill ridges with atmospheric depth

- Status: DONE (attempt 1, 2026-09-28 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-13 (S2)
- Evidence: every fresh `stage*-play`: the ridge is a single-colour
  hill with an ink line (re-confirmed fresh).
- Root cause: ASSET - `paintRidge` :110 in
  src/game/art/backdrop.ts (single-colour hills with an ink line).
- Affected screens: all `stage*-play` screens.
- Requirement: painted far and near ridges (value falloff with
  distance, a lit crest and shaded flank, a soft haze join) instead
  of flat colour plus outline. Shared backdrop constraints apply
  (see UIR-8).
- Acceptance criteria:
  - [x] test/game/uir10-ridge.test.ts: 16x16-block luminance-stddev
        share (threshold 7) clears 0.75 on day and dusk ridges. Before:
        day 0.67, dusk 0.48 (fails first). After: 0.83 / 0.92. R5 = 4
        on stage*-play vs title (far ridge pale and hazy, near ridge
        with lit crest, shaded flank and soft haze join; silhouettes
        and stage colours unchanged).
  - [x] After npm run review:capture: all nine stages show two-ridge
        depth in their own palettes (stage1 green hills and stage8
        purple night verified close up); hills.setTileScale(0.5, 0.5)
        was required - the ridge base, flank shading and haze join sit
        below tile row 48 and never displayed (same half-texture root
        cause as V-11/V-19; no other layer touched).
  - [x] Contact sheets show no regression; vision 5/5 and relevant
        specs green (ART-19 suite green unedited); ledger V-13 noted
        ridges-done (ground pending UIR-11, which completes it).
- Non-goals: new ridge silhouettes per stage, beyond the existing
  colour table.

### UIR-11 - Paint the ground per stage

- Status: DONE (attempt 1, 2026-09-28 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-13 (S2)
- Evidence: every fresh `stage*-play`: the ground is one tint with a
  dot pattern (re-confirmed fresh).
- Root cause: ASSET - `paintGround` :155 in
  src/game/art/backdrop.ts (one tint with a dot pattern).
- Affected screens: all `stage*-play` screens, plus the phone and
  WebGL shots.
- Requirement: a painted walkable ground (varied grass, earth or stone
  strokes, horizon-lit to foreground falloff) that stays calm enough
  for the actors' shadows and hit effects to read. Shared backdrop
  constraints apply (see UIR-8).
  (Includes the V-19 ground part: set ground.setTileScale(0.5,
  0.5) so the repainted ground displays fully - required for the
  acceptance below, same as sky/ridge under UIR-9/10.)
- Acceptance criteria:
  - [x] test/game/uir11-ground.test.ts: 16x16-block luminance-stddev
        share (threshold 7) clears 0.55 on grass and earth. Before:
        0.19 / 0.19 (fails first). After: 0.83 / 0.72. R5 = 4 on
        stage*-play vs title (horizon-lit falloff, mottled patches,
        blade/clod/chip strokes, calm paint tooth); actor ground
        shadows read clearly in the after-crops (stage1/stage4).
  - [x] After npm run review:capture: all nine grounds show painted
        falloff + texture in their stage palettes (stage1 grass and
        stage4 earth verified close up); ground.setTileScale(0.5, 0.5)
        maps the repaint 1:1 (V-19 ground part - the bottom half never
        displayed). Before: one tint with dots.
  - [x] Contact sheets show no regression; vision 5/5 and relevant
        specs green (ART-19 suite green unedited); ledger V-13 set to
        fixed (self-check) - the last of its three parts (sky UIR-9,
        ridges UIR-10, ground here).
- Non-goals: collision, or the lane depth.

### UIR-16 - Keep the far fist off the near arm on two-handed strikes

- Status: BLOCKED (3 attempts exhausted 2026-09-28 UTC - G6 literal-0 is
  unsatisfiable as specified: placement cannot clear (forward grips
  unreachable, arm rails haft), elbow bends backfire visually
  (guanyu-sweep 11+41 -> 142+269, forearm covers grip) and still leave
  86 cells, masking breaks handgrip/BODY-15. NEEDS OWNER DECISION -
  pick one: (a) rescope G6 to the 9 reviewer-A/B cells + rim tolerance
  elsewhere; (b) authorize wrap/fist masking with handgrip
  renegotiation; (c) authorize UIR-19 hand-art changes; (d) authorize
  pose-table surgery with full re-review. See PROGRESS attempts 1-3
  for proofs. Only the owner may reset to TODO.)
  landed; G6 87->86 with big reductions; strikearms+guards green;
  paint-zero needs wrap-extent work or owner scope call, see PROGRESS)
- Source: UI review 2026-09-28, findings V-15b (S2).
- Evidence: artifacts/review/latest/anatomy/cells/lubu-attack.png (far fist over near elbow, 398px + 627px wrap) and cells/zhangfei-attack.png (219px) - re-confirmed on the 2026-09-28 fresh capture
- Root cause: STATE/pose - `src/game/art/armik.ts:273-325` `fitFarHand` places the far grip 12-19u behind the near hand along the haft, which on attack/attack2/thrust/sweep/special lands UNDER the near forearm and elbow (probe: 0 reachable haft points clear the near arm by 2u for guanyu/zhaoyun/spearman/lidian/zhangliao strikes). The far fist (BODY-15, drawn on top so it stays visible) then paints over the near elbow: up to 847 px at 4x (lubu attack), 794 (xuchu attack). `draw.ts` tail `wrapF` adds the fingertips.
- Affected screens: every polearm fighter, strike moves (grid cells lettered b).
- Requirement: re-choreograph strike grips so the far fist is visible on the haft and not on the near arm: e.g. far grip IN FRONT of the near hand on strikes, or a near-elbow hint that lifts the near arm off the haft line, or a shorter strike separation where the arm clears. Keep UIR-15's "no rails" rule.
- Acceptance criteria:
  - [ ] detector `gripFOverNearArm + wrapFOverNearArm` = 0 on all standing moves (add gate G6 to arm-chain.test.ts); `uir15-strikearms` and `handgrip` stay green.
  - [ ] After `npm run review:capture`, the affected joins are re-reviewed
        on the fresh anatomy sheets against `previous/`, citing the
        after-image detail; contact sheets show no regression elsewhere.
  - [ ] `npm run vision` and relevant specs are green; the ledger finding
        is set to `fixed <commit> (unverified)`.
- Non-goals: new hand art (UIR-19), prone poses (UIR-17).

### UIR-17 - Fold the prone far arm onto the body

- Status: DONE (attempt 1, 2026-09-29 UTC, verified full-green same
  day)
- Source: UI review 2026-09-28, findings V-16 (S2).
- Evidence: artifacts/review/latest/anatomy/cells/guanyu-down.png (far hand alone, 6.3u far-chain gap to background) - re-confirmed fresh; all down tiles rated A by the grid review
- Root cause: pose/IK - `src/game/art/weapons.ts:191` `solveArm(base.shoulderF, base.handF, base.elbowF, ...)` for lying fighters picks the elbow branch below the body (elbowF y ~95 vs hip 82), so the far forearm vanishes under the ground line and the relaxed far hand floats alone under the chest in every fighter's `down` tile.
- Affected screens: all 17 fighters, `down` (cells/<id>-down.png).
- Requirement: choose the prone far-arm pose (owner may prefer the arm across the chest or tucked under the body) and solve the elbow on that branch; if the far arm is fully hidden, hide the far hand too.
- Acceptance criteria:
  - [x] G5 extended to the prone far chain: runF <= 1.5u on
        down for all 17 fighters (pinned failing first on 12 downs,
        worst lubu 11.5u; green after). Down tiles show a connected
        far arm folded across the body (elbow branch mirrored onto
        the torso, hand target untouched so handgrip holds).
  - [x] After npm run review:capture: guanyu-down shows the forearm
        reaching the dangling hand (hole line gone, upperArmF 18%
        visible), lubu-down and caoren-down connected with no
        suspects; contact sheets show no regression elsewhere.
  - [x] Vision 5/5 and relevant specs green (unit 672/673 - only the
        pre-existing UIR-16 G6 pin fails, as intended; e2e 82,
        selfplay 13/13 on re-run after one migrating-timeout flake,
        build 0, prodbuild 4/4). Ledger V-16 set to fixed (self-check).
- Non-goals: standing poses, the dropped-weapon position.

### UIR-18 - Connect the relaxed rear hand to a visible forearm

- Status: DONE (attempt 1, 2026-09-29 UTC, verified full-green same
  day)
- Source: UI review 2026-09-28, findings V-17 (S2).
- Evidence: artifacts/review/latest/anatomy/cells/huangzhong-idle.png (upperArmF 0% visible) and cells/weiyan-hurt.png - re-confirmed fresh
- Root cause: pose/draw order - `src/game/art/armik.ts:366` `swungFreeTarget` swings the free far hand just outside the torso while the far arm is drawn behind it (`draw.ts:748-753`), so the hand shows at the hip with 0-15% of its forearm visible (huangzhong idle/walk/hurt/special, weiyan hurt/special, zhangfei hurt).
- Affected screens: huangzhong (9 moves), weiyan (2), zhangfei (1): cells/huangzhong-idle.png, cells/weiyan-hurt.png.
- Requirement: the visible far hand always has a visible cuff/forearm leading to it (swing further out, or draw the far forearm over the torso edge when the hand is outside the silhouette).
- Acceptance criteria:
  - [x] New detector gate G7 in arm-chain.test.ts: for every
        non-gripping standing move, foreArmF >= 25% whenever relaxF
        paints. Pinned failing first on 18 rows (weiyan:special 14%,
        lubu:hurt 13%, huangzhong:sweep 17% - via git-stash of the
        fix), green after; negative control included. Mechanism: a
        wrist-bridge disc repaints the foreArmF cuff over the torso
        edge at the hand (same cell as UIR-13's wrist bridge), so
        the hand reads as emerging from behind the body - the
        idle/walk tiles read as one arm.
  - [x] After npm run review:capture: affected joins re-reviewed
        against previous/ (huangzhong-idle/walk, weiyan-hurt/idle,
        zhangfei-hurt, lubu-hurt, soldier-idle control). Fresh
        capture's rendered-pixel notes: all 84 relaxF rows >= 27%
        (4 informational 27-30% lines remain, none under the gate);
        far chain no gaps (G5 green). Contact sheets clean.
  - [x] vision 5/5 and relevant specs green (unit 674/676 - the only
        failure is the pre-existing UIR-16 G6 pin, BLOCKED; e2e 82,
        selfplay 13/13, build 0, prodbuild 4/4). Ledger V-17 set to
        fixed <commit> (unverified).
- Non-goals: gripping poses, hand art.

### UIR-19 - Paint hands that match the painted sleeves

- Status: BLOCKED (3 attempts exhausted 2026-10-01 UTC - rule 5.
  Progress: form pass (knuckles/planes) + face-matched tones all
  landed and measured; J4 verdicts 5/17 -> 9/17 -> 12/17. Remaining
  5 need owner scope: zhangliao/huangzhong read lighter than the
  FACE IMPRESSION (the p80 reference overshoots perceived tone) and
  caocao/xiahoudun/weiyan read pale at 5px figure scale (the lit
  caps/bloom dominate the tiny hand) though their cells are
  byte-tan. NEEDS OWNER DECISION: (a) accept 12/17 as a partial
  V-18 fix and re-scope the finding; (b) authorise a 4th pass:
  small-scale read fix (cap/bloom downsizing) + face-impression
  matching; (c) authorise a per-hand-kind art remake (the task's
  original "split per hand kind" allowance); (d) revert the tone
  work, keep the form pass. Only the owner may reset to TODO.)
- Source: UI review 2026-09-28, findings V-18 (S2, V-14 J4 residue).
- Evidence: artifacts/review/latest/anatomy/lubu.png (all 14 moves) - flat cream fists against photographic sleeves, re-confirmed fresh
- Root cause: ASSET - `scripts/prepare-body-parts.mjs:194` `paintHandCell` paints flat skin shapes with bar fingers; next to photographic sleeves they read as mittens on every fighter.
- Affected screens: every clean sheet (most visible anatomy/lubu.png, anatomy/caocao.png).
- Requirement: hand cells with painted form (knuckles, finger separation, lit/shaded planes, sleeve-matched detail level), keeping cell sizes and pivots so the rig and gates hold.
- Acceptance criteria:
  - [ ] handparts/handgrip/uir13 green; reviewer rates J4 ok on all 17 clean sheets.
  - [ ] After `npm run review:capture`, the affected joins are re-reviewed
        on the fresh anatomy sheets against `previous/`, citing the
        after-image detail; contact sheets show no regression elsewhere.
  - [ ] `npm run vision` and relevant specs are green; the ledger finding
        is set to `fixed <commit> (unverified)`.
- Non-goals: rig or pose changes.

### UIR-20 - Show the full ember sheet (tileScale)

- Status: DONE (attempt 1, 2026-10-01 UTC, verified full-green same
  day)
- Source: producer pass 2026-09-28, findings V-19 remainder (S2, SYSTEM)
- Evidence: V-19 entry (marks isolation proof + live readback applies verbatim: 512x128 texture on a 1064x64 tileSprite at tileScale 1 shows rows 0..64 only); embers painted rows 32..64 never display.
- Root cause: SYSTEM - GameScene.ts embers tileSprite lacks setTileScale(0.5, 0.5) (same as marks/sky/hills had).
- Affected screens: stage7/stage8 ember atmosphere.
- Requirement: embers.setTileScale(0.5, 0.5) so the full sheet displays; keep the tick-driven drift and additive blend unchanged.
- Acceptance criteria:
  - [x] Ember pixel count on a stage7-play frame rises ~2x (bottom
        half now visible) with no other screen changes. Measured by
        the toggle-diff pin in e2e/emberscale.spec.ts on a frozen-sim
        frame: 3403 -> 4412 px (1.30x, +1009 px of new content). The
        ~2x estimate assumed count proportional to spark number; the
        pre-fix state STRETCHED the top half's sparks 2x tall over the
        same band (fewer, larger), so pixel area understates the fix.
        The full-sheet truth: all 36 sparks + 8 smoke puffs at true
        aspect (the tileScaleY=0.5 pin is the regression gate).
  - [x] After npm run review:capture, stage7/8 re-reviewed (delegated
        glance + the measured delta; the session's image-display
        crossing made my own frame reads unreliable - recorded).
        Contact sheets show no regression elsewhere.
  - [x] Vision 5/5 and relevant specs green (green (e2e 83 passed / 0 failed, vision 5/5, selfplay 13/13, build 0, prodbuild 6/6)). Ledger V-19
        set to fixed <commit> (unverified); drift and additive blend
        untouched (the emberscale spec asserts the layer still mounts
        and is visible).
- Non-goals: ember art changes, other layers.
