# Work Queue

Statuses: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`.

The loop processes tasks from top to bottom and works on only one task per iteration.

Keep this file short. Once more than 20 tasks are `DONE`, move the oldest of them
to `TASKS-ARCHIVE.md`; every iteration reads this file to find the first `TODO`,
and scanning a long tail of finished work costs something each time.

## Owner-prioritized whole-cast motion rollout

The owner accepts Guan Yu's enhancements and authorizes all characters through later loop threads. This main-thread handoff is planning only. Full contract: [CAST_MOTION_ROLLOUT.md](docs/CAST_MOTION_ROLLOUT.md). Remain opt-in until owner activation approval.

Selection: due producer review first, then the earliest ready CMR task; continue it while IN_PROGRESS. A failed prerequisite prevents later CMR tasks from starting. One repository writer/one task per iteration; do not bypass existing retry, verification or permission rules. Older active tracks below are owner-deferred with evidence intact. No runner/scheduler policy changes.

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

- Status: DONE (attempt 1, 2026-10-05, verified same day). Owner
  waived item 4 ("waive now, mark DONE"): weapons 47.22% FULL +
  head-void with documented limitation (07A 18.2% / 09A 88.3%
  precedent class). All other items verified: 57/57 unique frames,
  1 page, 12.1MiB, deterministic `0e8b5c49`; continuity PASS all
  11 sheets; zero 12A src/game changes; no runtime activation.
  Repair reserve 3/3 handed to 12B intact (+ fall-DOWN re-confirm
  handoff). CMR-12B unblocked. Prior: owner funded +3 2026-10-05
  for
  sequential single-cell getup fixes (cap 20); all three DONE
  (c3 266.2, c4 270.1, c5 270.2, poses kept); spliced
  (`0ea3732e`, deterministic) keep [0..5] = 7.45% robust PASS,
  direction 0.9° pass → getup ACCEPTED (5 requests). 7/10 done.
  Misc sheet 1/2 (`bad2eceb`, 9/9 verticals, poses pass): cell 4
  DETACHED bow (mechanical defect, 10 components) → release
  remapped to spare cell 8 (upright ward-off read); deterministic
  repair assessed + rejected (68px gap too large). Keep
  [0,1,2,3,8] = ~0% PASS overlay-verified, direction 0.2° pass →
  misc ACCEPTED (1 request). 8/10 done. Special sheet 1/2
  (`10607c60`, 9/9 clean verticals, ZERO arrows, poses pass):
  keep [0..4] = ~0% PASS overlay-verified, direction 0.4° pass →
  special ACCEPTED (1 request). 9/10 done. Rider sheet 1/2
  (`8f6b81db`, 9/9 seated riders, zero horse parts, poses pass):
  keep [0..5] = 1.34% PASS overlay-verified, direction 0.2° pass
  → rider ACCEPTED (LAST request, 20/20). **10/10 sequences
  done.** Pack huangzhong-1 BUILT (`prepare-huangzhong.mjs`,
  weiyan pattern): 57/57 unique frames, 1 page 1988×1594,
  12.1MiB ≤ 16MiB (0 step-downs), deterministic manifest
  `0e8b5c49`, registration.json committed; 6 suspects dismissed
  as bbox-overlap noise. Acceptance-4 measured: weapons 47.22%
  FAIL (N=57 verified chords, monotonic 191→300 provider drift)
  + head-void (face gate merges gold/beard — demonstrated);
  figures uniform (guards agree 2.7%) so factors correctly stay 1
  (re-prepare byte-identical). Repair infeasible (~40 cells vs 27
  capacity). → BLOCKED, WAIVER REQUESTED (07A 18.2% / 09A 88.3%
  precedents bracket 47.22%). Ledger 20/20; global 112/200.
  Prior waiver detail preserved below. Owner chose waiver (c)
  2026-10-05:
  fall ACCEPTED [0,1,2,3,4] 9.26% + diagonal-DOWN waiver recorded;
  12B handoff: re-confirm DOWN at integration, repair reserve as
  backstop. Prior BLOCKED detail preserved below. Fall verdict: best
  verified keep [0,1,2,3,4] = 9.29% marginal but DOWN is diagonal
  (flat-DOWN bookend broken); flat-DOWN sets fail at 11.8%; zero
  budget margin (4 left for 4 sheets) forbids unilateral fixes —
  options: accept diagonal DOWN, +1 budget, waive 9.3%, or re-brief
  DOWN. Prior IN_PROGRESS detail preserved below; identity locked
  from inspected
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
  Ledger 12/16, global 104/200; 4 left for 4 sheets. Width-
  profile tool v3 FAILED (0/6 verified). CORRECTION: prior "c3
  short+diagonal / kick spare" lines were jump findings
  copy-pasted into fall's record — struck; fall c3 measures
  ~260 in-band. Overlay round 2 verified all 12 rings on wood:
  best 5-set [0,1,2,3,4] = 9.29% marginal BUT its DOWN (c4) is
  diagonal, breaking the shared flat-DOWN bookend; flat-DOWN
  sets fail centrally (11.8%). No passing path within authority
  (c0/c2 bind 9.29%; zero budget margin forbids fixes). RESUMED
  2026-10-05: owner chose waiver (c) → fall ACCEPTED (script-exact
  9.26%, correcting 9.29% hand math; diagonal-DOWN waiver recorded;
  no splice). Next: getup sheet (reserve first). Ledger 12/16;
  4 left for 4 sheets (getup/misc/special/rider). Getup sheet 1/2
  (`735ab57a`, 9/9 clean verticals, observability obeyed, poses
  pass): LENGTH FAILS — overlay-verified [260.6,260.4,280.3,310.3,
  300.3,310.3] = 17.38%, pose-correlated tiers (prone/kneel vs
  crouch/stand); every 5-keep spans tiers (min ~14%+); spares
  cannot bridge (extremes locked). BLOCKED (owner options: fund
  +1 fix, waive 17.5%, re-brief, redirect). Ledger 13/16; 3 left
  for 3 sheets (misc/special/rider).
- Dependency: CMR-11B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-12A](docs/motion-tasks/CMR-12A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable huangzhong identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-12B - Huang Zhong: integrate/review in motion

- Status: DONE (attempt 1, 2026-10-05 UTC, verified same day;
  CMR-12A DONE with prepared pack rev huangzhong-1).
  Slice 1 DONE: emit runtime assets + clips/dispatch/validator +
  catalog wiring + 22 unit tests green (mirrors 11B; NO decoded
  exception). Slice 2 DONE: capture harness wired for huangzhong
  (17-action isolated lists, bindings, coverage, contract-cap
  resources); canvas + webgl captures green (73 rows each, 0
  errors, all motion art, both facings, coop/mixed covered);
  contacts (37 crops ×2) + 5 enlarged crops reviewed; per-action
  verdicts all PASS (self-check) in
  `docs/HUANGZHONG_ACTION_REVIEW.md`; diagonal-DOWN handoff
  re-confirmed acceptable (renders + routes correctly; 12A waiver
  referred, no repair). Slice 3 DONE: vision 5/5, prodbuild 8/8
  (motion pilot opt-in/out both renderers on built bundle),
  signal 13/13 (incl. huangzhong marathon, zero violations),
  motion-loader e2e 5/5, full unit 973+6 with only known G6.
  All 8 acceptance items verified; no gameplay changes; defaults
  legacy, opt-in only.
- Handoff from 12A (owner waiver (c) 2026-10-05, binding): fall keep
  [0,1,2,3,4] carries a WAIVED diagonal DOWN (~30°, cell 4) + 9.26%
  spread. At integration review, re-confirm DOWN acceptability
  (getup/dead start from it; cross-fighter bookend consistency);
  if it breaks registration or consistency, repair via the
  acceptance-4 reserve (3 rounds, separately tracked), NOT
  authoring budget. Do not silently re-waive.
- Dependency: CMR-12A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-12B](docs/motion-tasks/CMR-12B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic huangzhong pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-13A - Li Dian: author/prepare full motion pack

- Status: DONE (attempt 1; 7/7 sheets + pack `lidian-1`
  assembled + continuity reviewed 2026-10-06). Pack:
  39 frames (39 unique, 0 aliases), 1 page 2011×1646,
  deterministic (`1eadbbe0`), 13.2MB ≤ 16MB, walk guard
  90.7% of Guan Yu; registration.json committed; one
  suspect adjudicated benign (empty-space straddle).
  Continuity: all 7 sequences read from packed pages;
  guard + DOWN bookends stable. No runtime activation
  (13B). Ledger 14/14, global 126/200.
- Dependency: CMR-12B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-13A](docs/motion-tasks/CMR-13A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable lidian identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-13B - Li Dian: integrate/review in motion

- Status: DONE (attempt 1; capture review + vision +
  prodbuild green 2026-10-06). Captures: 46 rows × 2
  renderers, 0 errors, all motion keys, all 3 boss
  attacks both facings; review `LIDIAN_ACTION_REVIEW.md`
  (all actions PASS, DOWN stable, blink/dead-crop notes).
  Landmarks preserved by uniform scale; feet plant, no
  pops. Costs in contract; opt-in preserved.
- Dependency: CMR-13A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-13B](docs/motion-tasks/CMR-13B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic lidian pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-14A - Xiahou Dun: author/prepare full motion pack

- Owner authorization (owner-2026-10-07-cmr14a-one-clean-redraw, 2026-10-07): ONE extra focused
  clean-redraw request (round 4) for combo:0/2/3/6/7 ONLY. Repair extension is
  fighter-local; previous 3 rounds stay spent. Reserve through the normal repair
  API BEFORE image_generate; preserve original/hash-pinned references and output.
  Request at-scale separated figures with clear rear grips/butts, no guide lines
  or dotted construction artifacts; keep poses/identity/band/timing unchanged.
  No additional request, refund, waiver or new iteration budget is implicit.
  If provider/output/gate/splice fails, return BLOCKED and let the runner pause.
  If the source succeeds, only bounded downstream preparation/verification of
  that source is allowed; do not let green refusal tests justify more attempts.
  This does NOT mark CMR-14A DONE or authorize 14B/runtime activation. Other open
  acceptance items still need truthful closure under existing authorization.

- Owner waiver (owner-2026-10-08-cmr14a-combo-waiver, 2026-10-08, option (a) chosen by direct owner instruction "do (a)"): combo acceptance item 4 (≤10% fully-observable weapon spread) WAIVED with documented limitation. Limitation: true combo spread never validly measured (PCA/hull lock onto guide lines + body diagonals; hand axes too sloppy); eye-read spread ~45% with C0 ~125px short of band bottom (no retouch room, proven) and C2/C3/C7 borderline-over; round-4 sheet carries faint dotted construction lines. Ghost-cleared splice output 66ffaf39 accepted AS-IS as the combo source (keeps exact, 9 drawings, no fuse/edge per gate; overlay/pair review of it remains open like any source). Precedents: 07A (18.2%), 09A (88.3%), 12A (47.22%). Scope is combo item 4 ONLY: no other criterion waived, no ledger/budget change (repair stays 0/3 spent, authoring 3/12), no refund/rollover, no 14B/runtime activation. Remaining CMR-14A work (charge HELD items, heavy/misc/fall/getup sheets, heads, pack-prep, projection, continuity) still needs truthful closure; combo cap-slides are dropped as moot under this waiver.

- Owner authorization (owner-2026-10-08-cmr14a-heavy-3, 2026-10-08, option (b) chosen by direct owner instruction "do (b)"): ONE extra heavy whole-sheet candidate (sheet 3) as an exception to the 2-per-sequence contract cap (authoring cap and 200-total cap still enforced; ledger shows heavy:3 visibly). Reserve through the authoring ledger BEFORE image_generate; preserve original/hash-pinned output; brief carries measured scale anchors (heads ~65px, figs walk-matched, spears 404-447px). Scale-gate FIRST on arrival (mean head height within ±15% of walk 64.7px + no fig outside ±25%, else REJECT before any other work on it). No additional request, refund, waiver or new iteration budget is implicit. If provider/output fails or the scale gate rejects, return BLOCKED and let the runner pause. This does NOT mark CMR-14A DONE or authorize 14B/runtime activation.

- Owner authorization (owner-2026-10-08-cmr14a-heavy-bigboss, 2026-10-08, option (a′) chosen by direct owner instruction "do (a)" + explicit owner authorization to continue the previously authorized (a′) work now / reopen CMR-14A): accept cand-2 prepared source 041add30 at k=1 as intentional BIG boss + WAIVE head-cast-coherence for heavy + authorize ONE deterministic fig1 rear cap-slide retouch (script+tests+override+pair review). Scope is exactly this: no other waivers, no new image budget, no 14B/runtime activation; attempt and image-budget accounting unchanged. Fig1 slide-room measurement and retouch land in a later package; this package is record-only.

- Status: IN_PROGRESS (2026-10-08: owner-authorized (a′) continuation recorded + reset BLOCKED->IN_PROGRESS (manager-delegated record package); fig1 slide-room measurement then the authorized deterministic retouch next. Prior: BLOCKED 2026-10-08 (heavy-3 REJECTED on scale gate: marker-verified heads [95,80,112,109,104] mean 100.0 vs walk 64.7, gate 55-74, 4/5 figs fail per-fig; text scale anchors failed identically twice, cand-2 106.8 / cand-3 100.0; options (a′)/(b′)/(c)/(d)), funded-(b), mixed-scale BLOCK, waiver+reset 2026-10-08, rule-5 BLOCK, recovery-exhausted BLOCK, attempt2).
  Reviewer `6c8414d5` opened27 images: NEEDS_NAMED_REPAIR walk:0
  rear hand/shaft layering, NOT mandatory all-charge head rescale;
  anatomical head metric stays UNVERIFIED/null. Source not accepted.
  Original grip restore `fba82023` preserved in new corrected walk
  `0aff5a39`: isolated cap slides2/3/5/7/8, exact guard/body/cloth witnesses
  and off-corridor pixels intact; parent enlarged-pair self-check only.
  True-material walk spread3.38%/direction2.74°, fixed projection OK;
  historical11.36% STOP and invalid0.25% measurements kept in history.
  Hypothetical walk+charge6.89% OK NOT charge acceptance. Whole walk/
  charge HELD on registered consistency review; no runtime/14B yet.
  Registered candidate now built .66scale/density2, drawn sole anchors
  <=1.32u (airborne dash ground UNVERIFIED);53 ticks/52duration/83.2u
  trace checked against real AI both facings. Still not source acceptance.
  Paint override98e2531f reduces localized copper-magenta/skin warmth
  in0/3/4; all alpha/geometry/weapon RGBA and cells1/2/5..8 exact.
  Opened3 material4x pairs/logical before-after; reduced mismatch is
  a consumer self-check, not source/normal-speed acceptance.
  Spares5..8 inspected; spare6 alternate-dash2 TRIAL REJECTED (three
  isolated cap-slide masks: stub, detached robe/overpainted fist, or
  detached fragments; length-number passes not accepted). Not inserted.
  Li Dian precedent comparison (coarse silhouette-top envelope incl.
  weapon): Xiahou candidate max adjacent top change20.13u<Li Dian36.50u;
  dash->dash2 +5.94u vs Li +3.5u - NOT evidence of a defect; the earlier
  12.54u was a pelvis-landmark figure, a different metric. Not a pass.
  Next: normal-speed review by a working reviewer/owner judgement of the
  dash->dash2 boundary; only if confirmed a defect, one reserve-first
  focused charge:3 repair or no-art exposure re-timing; no head rescale.
  CHARGE REVIEW UPDATE (top-level independent fork reviewer, stills only):
  NEEDS_NAMED_REPAIR minor - charge:4 still warmer/brighter than walk and
  charge1-3, charge:3 mildly warmer than charge:2 (this CORRECTS the
  filmstrip self-check line "palette reads consistent"); tick20->21 pose
  cut BORDERLINE, 42->43 borderline mainly on palette; neither resolvable
  from stills. Paint pass2 `320e235a` (RGB only, charge3/4; alpha, weapons
  and all other cells exact; 4 tests) lowers whole-figure luma 56.2/57.0 ->
  54.8/54.7 (ref charge1/2 ~50.5, walk 44.0): gap REDUCED NOT CLOSED, kept
  disclosed; self-check only. No video encoder / in-game playback exists
  (14B not done) so the pose cut stays UNRESOLVED: needs owner judgement of
  the filmstrips or a playback-capable review; hitch => re-time or one
  reserve-first charge:3 repair. Head UNVERIFIED/null. Audit
  charge-paint-2-audit.json.
  COMBO candidate1 generated (reserve-first; authoring now3/12, global
  129/200, repair2left): `combo-candidate-1.png` c2c5fefc, 9 figures/0 edge,
  palette muted (charge warm-paint did not recur). Weapon FAILS: measured
  [470.1,340.3,472.8,467.7,487.7,475.7]32.6% vs fixed band -> STOP; thrust
  cells2/6/7 rear shaft occluded=UNKNOWN. Not accepted/not recorded.
  Retouch feasibility measured first: cap-slide room fits only cells4/5/8
  (5 marginal); cells0/3 (fist too close to butt) and occluded2/6/7 cannot
  be closed by retouch. Next: ONE reserve-first repair round for 0/2/3/6/7
  (+1 if needed; round 2 ACCEPTED 2026-10-07 after touch adjudication (k=0.7571 walk-height fit, NOT the 0.72 mass estimate which was spear-mass-biased; full splice refused (uncuttable overlaps) + cell0 k-splice refused (0.757x severs spearhead, both filters) 2026-10-07 - k-splice path CLOSED, round 3 (LAST) ACCEPTED 2026-10-07 (5 separated, k=0.8807; splice built but refuses severed fragments (3 resamples identical - frags proven touching gap-0, per-cell seating + bridges next; RULE-5 next attempt last before BLOCK)), then cap-slide 5/8 + cell1 extend (cell4 slide script+tests verified 5/5 on 2026-10-07, output ignored not spliced, enlarged-pair self-check PASS 2026-10-07); or 2nd combo candidate (BLOCKED 2026-10-07 rule 5: touch-join gate caught real new:3+new:6 cross-cell fusion + dotted guide-line artifacts; reserve 0/3. Owner options: (a) waive combo (07A/09A/12A precedent); (b) fund round-4 clean redraws; (c) cap-slide partial + waive 0/2/3/6/7; (d) redirect. Only owner resets to TODO). Audit combo-candidate-1-audit.json.
  HEAVY (authoring 5/12, heavy 2/2 cap reached): cand-2 ACCEPTED as source (5 clean single-head complete spears, muted palette, no guides); cand-1 UNREVIEWED (rejection withdrawn as wrong-grid). Cand-2 figs 0-2 clean+separated; fig3|fig4 merged. SEAM ADJUDICATED 2026-10-08: cand-2 pair wins over cand-1 (single localizable steel-tip-vs-boot contact in box x1770-1810/y600-645, proven by disconnection probes, vs cand-1 multi-element waist + second robe contact; same-sheet = no cross-sheet scale risk). Then (history): OWNER FUNDED (b) 2026-10-08 -> HEAVY-3 GENERATED (reserve-first, authoring 6/12, global 132/200): `heavy-candidate-3.png` c50fb26f, 2176x723, 5 distinct poses, 5 heads, muted-dark-ish palette (luma 40.6 vs cand-2 36.0, watch item), 0 edge, 2 trivial specks, no guides visible; figs 2+3+4 merged (separation AFTER scale gate only). Generation was TEXT-ONLY (no image refs attachable in this harness - disclosed in audit; identity to be checked). NOT accepted - REJECTED on scale gate 2026-10-08, do not prepare from it. Next (a′): reset recorded + IN_PROGRESS; fig1 slide-room measured + authorized deterministic fig1 rear cap-slide retouch DONE (script+tests+override 96e96297+pair review, Package 2/3) + projection record at scale=1 DONE (Package 5: override lengths [417.8,442.5,436.3,444.0,445.8] corridor-14, sheet spread 6.40% PASS, steps max 43.3 PASS, evaluation OK 6.42% over n=14, band exactly equal, continuity strip CLEAN self-check). Heavy ACCEPTED as source at k=1 (BIG-boss intent per (a′); head-cast-coherence WAIVED). Remaining: misc/fall/getup sheets; pack-prep honoring recorded scale=1; charge judgement still needs owner eye. No column cut exists in either merge (proven); head measurement UNVERIFIED/null stands as fact but the head-cast-coherence gate is WAIVED for heavy per the (a′) authorization above.
   MISC candidate 1 generated 2026-10-08 (reserve-first, authoring 7/12, global 133/200, misc 1/2 - cap untriggered, NO exception): `misc-candidate-1.png` e8923a7a, 1536x1024 3x3 (combo-precedent compact layout per canvas-area hypothesis), 9 separated figures + 3 trivial 1px specks, 0 edge, corners transparent, dark-muted palette (luma 0.165 in-family), 9 heads + 9 complete spears + clean identity at 1x self-check (blind-eye detail unverified at 1x). Design-audited on the asserted grid-matched strip (misc-gridstrip.png); SCALE GATE RUN 2026-10-08: REJECTED (marker-verified crown-beard heads [44,77,77,86,85,53,93,90,57] mean 73.56 vs walk 64.7 - mean passes by 0.85 but 5/9 figs outside per-fig 48.5-80.9: fig0 44, fig3 86, fig4 85, fig6 93, fig7 90; upright heads span 77-93 = non-uniform scale, no uniform k; ±10px slop cannot rescue fig6 93; finish corrected 2 floating crowns (fig5 +8x onto bun, fig8 +6y onto hair, overlay re-rendered + re-opened, all 18 on drawn pixels) with verdict unchanged; identity clean - no helmet/sword/second-eye; do NOT prepare from it). Task stays IN_PROGRESS. MISC candidate 2 generated 2026-10-08 (reserve-first, authoring 8/12, global 134/200, misc 2/2 - cap REACHED this tick, LAST within caps, NO exception): `misc-candidate-2.png` 9289ce22, 1536x1024 3x3 (compact layout kept), 9 separated figures + 1 trivial 1px speck, 0 edge, corners transparent, dark-muted palette (luma 0.178/sat 0.317 in-family), 9 heads + 9 complete spears + clean identity at 1x self-check (blind-eye detail unverified at 1x). Prompt-2 (`misc-prompt-2.txt`; `misc-prompt.txt` byte-intact as history) carries spec poses + anchors (figs 315-325, heads 63-68, spears 404-447) + BOTH named failures (heavy uniform overshoot 106.8/100.0; misc-1 scatter 44-93 mean 73.6) + NEW uniformity demand (all 9 heads SAME size, largest <=1.15x smallest). Design-audited on the asserted grid-matched strip (misc-gridstrip-cand2.png, opened); SCALE GATE RUN 2026-10-08: REJECTED (both p2 overlays opened, all 18 markers on drawn pixels - A1 alphas all >=106, A2 all finals >=101; marker-verified crown-beard heads [48,122,86,98,91,53,90,144,66] mean 88.67 vs walk 64.7 - mean FAILS band 55.0-74.4 by +14.3; per-fig band 48.5-80.9: 7/9 FAIL - fig0 48 (-0.5), fig1 122, fig2 86, fig3 98, fig4 91, fig6 90, fig7 144; pass only fig5 53 + fig8 66; max/min 3.0x so no uniform k rescues; slop note: fig0 48-vs-48.5 borderline flips on +/-1px but verdict robust - even +/-10px favorable slop leaves fig1/3/4/7 + mean failing; identity clean on head crops - no helmet/sword/second-eye; do NOT prepare from it). Misc 2/2 SPENT - next is fall candidate 1 (fall 0/2, within caps, no exception); any misc-3 would need an owner funding decision. Task stays IN_PROGRESS. Generation TEXT-ONLY (no refs attachable - disclosed; identity-must-pass-audit-or-reject). FALL candidate 1 generated 2026-10-08 (reserve-first, authoring 9/12, global 135/200, fall 1/2 - cap untriggered, NO exception): `fall-candidate-1.png` 5f6a6cce, 1536x1024 3x3, 9 separated figures + 7 trivial specks, 0 edge, corners transparent, dark-muted palette (luma 0.182/sat 0.32 in-family), 9 heads + 9 complete spears + clean identity at 1x self-check (blind-eye detail unverified at 1x). Design-audited on the asserted grid-matched strip (fall-gridstrip.png, opened) with verdict CLEAN (poses per spec incl. genuinely FLAT DOWN cell 4, 9 visible heads, 9 complete spears, no guides); SCALE GATE RUN 2026-10-08: REJECTED (all three overlays OPENED; A1 figs 0-4 H re-derived from CORRECT-RENDER SCRIPT coords [76,55,81,71,92], fig5 H=47 on A2-retry overlay; recomputed mean 70.33 passes 55.0-74.4 but per-fig band 48.5-80.9 fails 3/6 - fig2 81, fig4 92, fig5 47; figs 6-8 UNMEASURABLE after 3 honest attempts - fig6 beard-on-spear per overlay, fig7 dubious H=36 UNVERIFIED-caveated excluded from stats, fig8 no clean landmarks; ROBUST without unknowns: fig4 92 survives +/-10 slop (82 still fails), mean-even-if-6-8-perfect still leaves per-fig fails, UNMEASURABLEs can only add failures never rescue; borderlines fig2 (+0.1) + fig5 (-1.5) slop-noted as non-driving; identity clean - no helmet/sword/second-eye; do NOT prepare from it). Finish package 2026-10-08 (abort-recovery, zero re-spend): reservation + all 3 fall files verified as left (ledger diff exactly 8->9 + fall:1, PNG sha == audit hash, prompt spec-bearing), TASKS FALL line + PROGRESS entry completed here, committed with ledger + prompt + PNG + audit. SCALE-GATE verdict package 2026-10-08 (zero-cost: no measurement spend, no ledger change - 9/12, fall 1/2, global 135/200, repair 0/3): audit JSON scaleGate REJECTED + status REJECTED-do-not-prepare. Remaining: getup candidate 1 NEXT within caps (fall 1/2 spent); fall-2 + misc-3 need owner funding decisions (flagged, NOT taken); pack-prep honoring recorded scale=1; charge judgement still needs owner eye. Task stays IN_PROGRESS. GETUP candidate 1 generated 2026-10-08 (reserve-first, authoring 9->10/12, getup 0->1/2 - cap untriggered, global 135->136/200, NO exception): `getup-candidate-1.png` 2ffde22c, 1536x1024 3x3 (compact layout kept, explicitly justified vs 0-for-5 evidence), 9 separated figures + 1 trivial 3px speck, 0 edge, corners transparent, dark-muted palette (luma 0.168/sat 0.262 in-family), 9 heads + 9 complete spears + clean identity at 1x self-check (blind-eye detail unverified at 1x; Li Dian c0 buried-face mode did NOT recur at 1x). Prompt (`getup-prompt.txt`) carries spec poses/count/order (AUTHORING-PLAN getup 5 + shared contract + core-timing map + Li Dian precedent keep {0,1,2,3,8}) + anchors (figs 315-325, heads 63-68 vs walk 64.7, spears 404-447) + ALL FOUR named failures (heavy 106.8/100.0; misc-1 44-93; misc-2 48-144 + failed uniformity demand; fall-1 6 verified heads + figs 6-8 UNMEASURABLE) + restated uniformity demand + NEW head-measurability demand (unmeasurable head fails like missing spear) + 40px gaps + one-head-each/complete-spears/no-guides/identity/muted. Design-audited on the asserted grid-matched strip (getup-gridstrip.png, opened); generation TEXT-ONLY (no image refs attachable - disclosed in audit). SCALE GATE RUN 2026-10-08: REJECTED (all three overlays OPENED: A1 figs 0/3/4 markers confirmed on ink - H re-derived from script coords [79,79-nose,84]; R1b fig3 corrected beard-tip (342,486) scrutinized on opened overlay - sits on beard-tip ink below chin with scarf excluded, H=99 SUPERSEDES the A1 nose-placed 79; R1b figs 1/2 latches (108/150) proven INVALID - both beards sit ON the spear shaft; A2 figs 5-8 UNMEASURABLE with documented reasons - fig5 beard-to-mass merge, fig6 gap, figs 7/8 shaft-latch rejections with inset proof; recomputed from 3 verified values ONLY [79,99,84] sum 262 mean 87.33 FAILS 55.0-74.4, per-fig 48.5-80.9 fails 2/3 - fig3 99 + fig4 84, fig0 79 passes; ROBUST without unknowns: fig3 99 survives +/-10 slop (89 still fails), per-fig fails unremovable by unknowns, UNMEASURABLEs can only add failures; honest limit: mean-even-if-unknowns-perfect (72.24) would pass mean so verdict rests on the per-fig leg; fig4 +3.1 slop-fragile non-driving; identity clean - no helmet/sword/second-eye; do NOT prepare from it). Next: getup candidate 2 DONE this tick (see below); fall-2 + misc-3 need owner funding decisions (flagged, NOT taken); pack-prep honoring recorded scale=1; charge judgement still needs owner eye. GETUP candidate 2 generated 2026-10-08 (reserve-first, authoring 10->11/12, getup 1->2/2 - cap REACHED this tick, LAST within caps, global 136->137/200, NO exception): `getup-candidate-2.png` bab119b7, 1536x1024 3x3 (compact layout kept, explicitly justified vs 0-for-6 evidence), 9 separated figures + 11 trivial <=2px specks, 0 edge, corners transparent, dark-muted palette (luma 0.189/sat 0.304 in-family), 9 heads + 9 complete spears + clean identity at 1x self-check (blind-eye detail unverified at 1x; Li Dian c0 buried-face mode did NOT recur at 1x). Prompt-2 (`getup-prompt-2.txt`; `getup-prompt.txt` byte-intact as history, sha C51D9676 verified after) carries spec poses/count/order (AUTHORING-PLAN getup 5 + shared contract + Li Dian precedent keep {0,1,2,3,8}) + anchors (figs 315-325, heads 63-68 vs walk 64.7, spears 404-447) + ALL FIVE named failures (heavy 106.8/100.0; misc-1 44-93; misc-2 48-144 + failed <=1.15x demand; fall-1 prone unmeasurability; getup-1 [79,99,84] + 6 UNMEASURABLE from merged chimneys/shaft latches) + restated uniformity AND measurability demands + NEW beard-separation demand (beards hang free with VISIBLE GAPS from spear shafts and scarves). Design-audited on the asserted grid-matched strip (getup-gridstrip-cand2.png, opened) with verdict CLEAN self-check (poses per spec incl. genuinely FLAT DOWN cell 0; 9 profile-visible heads; 9 complete spears incl. beard-vs-shaft gaps visible at 1x, figs 0/6 tightest - flagged for gate zoom; squint warning figs 2/4 heads read large-ish - numbers over squints; no guides). Generation TEXT-ONLY (no refs attachable - disclosed; identity-must-pass-audit-or-reject). Audit JSON status REJECTED-do-not-prepare (scaleGate REJECTED; landmarks for all 9 figs incl. UNMEASURABLEs with reasons + evidence paths). SCALE GATE RUN 2026-10-08: REJECTED (BOTH marked overlays OPENED: getup-cand2-a1-marked2.png figs 0/2/4 markers confirmed on ink - H re-derived from script coords + overlay labels [91,94,90] (224-133/114-20/359-269); fig1 UNMEASURABLE (no crown solid run in corrected box); fig3 CORRECTED this tick - its H=86 beard latch (270,464) proven OFF-GOATEE on the magenta scarf (4x zoom + RGB 130,81,95 purple vs beard neutral-black + chin columns x295-305 dark unbroken y425-495 = goatee-to-collar merge with no clean break; H=86 was a chimney-bottom-edge artifact, NOT anatomy) -> UNMEASURABLE, exactly 1 correction via the existing correct script + re-opened; getup-cand2-a2-marked.png figs 5-8 UNMEASURABLE per recovered A2 JSON with merge/gap evidence (fig5 no dark snap in x+-6/y+-20; figs 6/7/8 goatee-to-mass merges 29/40/37 dark rows, widths 231/222/163>110); recomputed from 3 verified values ONLY [91,94,90] sum 275 mean 91.67 FAILS 55.0-74.4 by +17.27, per-fig 48.5-80.9 fails 3/3 (fig0 91, fig2 94, fig4 90); ROBUST without unknowns: fig0 91 + fig2 94 BOTH survive +/-10 favorable slop (81/84 still fail), mean-minus-10 (81.67) still fails, UNMEASURABLEs can only add failures - both legs fail robustly; identity clean - no helmet/sword/second-eye; do NOT prepare from it). Getup 2/2 SPENT - cap EXHAUSTED (misc 2/2, fall 1/2; xiahoudun 11/12, global 137/200): ONLY fall-2 + owner-funding-conversation + charge judgement left - COMING FUNDING CONVERSATION flagged, NOT taken; pack-prep honoring recorded scale=1; charge judgement still needs owner eye. Task stays IN_PROGRESS (NOT BLOCKED - fall-2 path exists within caps). FALL candidate 2 generated 2026-10-08 (reserve-first, authoring 11->12/12 - xiahoudun CAP REACHED this tick, LAST FUNDED SHEET anywhere, fall 1->2/2 - cap REACHED, global 137->138/200, NO exception): `fall-candidate-2.png` 27c06c1f, 1536x1024 3x3 (compact layout kept, explicitly justified vs 0-for-7 evidence), 9 separated figures + 7 trivial <=2px specks, 0 edge, corners transparent, dark-muted palette (luma 0.195/sat 0.285 in-family), 9 heads + 9 complete spears + clean identity at 1x self-check (blind-eye detail unverified at 1x). Prompt-2 (`fall-prompt-2.txt`; `fall-prompt.txt` byte-intact as history, 6262 B untouched - no diff) carries spec poses/count/order (AUTHORING-PLAN fall 5 + shared contract + Li Dian fall precedent: same 5-core + 4-spare 3x3 order, DOWN genuinely FLAT horizontal face-down, polearm gripped through every cell INCLUDING DOWN) + anchors (figs 315-325, heads 63-68 vs walk 64.7, spears 404-447) + ALL SIX named failures (heavy uniform overshoot 106.8/100.0; misc-1 scatter 44-93; misc-2 48-144 + failed <=1.15x demand; fall-1 prone [76,55,81,71,92,47] + figs 6-8 UNMEASURABLE; getup-1 mixed [79,99,84] + 6 UNMEASURABLE; getup-2 [91,94,90] + 6 UNMEASURABLE) + restated uniformity + measurability + beard-separation demands + 40px gaps + one-head-each/complete-spears/no-guides/identity/muted. Design-audited on the asserted grid-matched strip (fall-gridstrip-cand2.png, opened) with verdict CLEAN self-check (poses per spec incl. genuinely FLAT DOWN cell 4; 9 profile-visible heads with crown+beard unoccluded at 1x; 9 complete spears with beard-vs-shaft gaps visible at 1x, figs 2/7 tightest - flagged for gate zoom; no guides - magenta grid is strip overlay only). Generation TEXT-ONLY (no refs attachable - disclosed; identity-must-pass-audit-or-reject). Audit JSON status CANDIDATE_GENERATED_DESIGN_AUDITED_SCALE_GATE_PENDING (thresholds mean 55.0-74.4 / per-fig 48.5-80.9; NO scale verdict BY DESIGN). SCALE GATE RUN 2026-10-08: REJECTED (overlay-landmark ONLY, SAME ruler: BOTH cand2 marked overlays OPENED - a1 figs 0-4 + headsearch insets, a2 figs 5-8 + insets - + both headsearch strips opened + single verified H re-derived from script coords, never relayed: fig2 235-148=87, crown (1350,148) alpha 128 + beard (1357,235) alpha 139 with clean beard break below (runs 2, spread 41) Tier V; vs walk 64.7: per-fig band 48.5-80.9 FAIL +6.1, Tier-V ±3 favorable slop leaves 84>80.9 ROBUST; mean n=1 87.0 vs 55.0-74.4 FAIL +12.6; figs 0/1/3/4/5/6/7/8 UNMEASURABLE with documented evidence (figs 0/1/4/6 beard-to-mass merges 31-40 dark rows x 279-366 wide, no clean break; figs 3/5/7/8 no alpha>=96 dark-hair pixel within x±10/y±14 of bun estimates) - unknowns can only ADD failures, never rescue; ZERO marker corrections - sole relied-upon fig2 markers proven on ink, all UNMEASURABLEs honestly labeled; identity CONFIRMED on both overlays + strips: no helmet/sword/second-eye; do NOT prepare from it; MANAGER SLOP RULING applied + recorded in audit methods; prior-verdicts audit check: all six prior REJECTs stand under BOTH tiers - heavy-3 mean +25.6 + four >=91 fails, misc-1 fig6 93, misc-2 figs 122/144, fall-1 fig4 92, getup-1 fig3 99, getup-2 figs 91/94). Zero-cost tick: no image_generate, no ledger change (12/12, fall 2/2, global 138/200, repair 0/3 untouched). REJECT: fall 2/2 SPENT, cap exhausted; xiahoudun 12/12 + misc/fall/getup ALL capped - ONLY the owner-funding-conversation + charge judgement left; pack-prep honors recorded scale=1. Task stays IN_PROGRESS (NOT BLOCKED - the funding conversation IS the next action, recorded as pending owner decision).
  Evidence: [completed review](art/motion/xiahoudun/INDEPENDENT-REVIEW.md),
  [review state](art/motion/xiahoudun/independent-review.json),
  [grip audit](art/motion/xiahoudun/walk-guard-grip-audit.json),
  [weapon closure audit](art/motion/xiahoudun/walk-projection-repair-audit.json),
  [registered candidate review](art/motion/xiahoudun/REGISTERED-CHARGE-REVIEW.md),
  [paint correction audit](art/motion/xiahoudun/charge-paint-audit.json),
  [paint pass2 audit](art/motion/xiahoudun/charge-paint-2-audit.json).
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

### CMR-22 - Shared horse locomotion/rider composition

- Status: TODO
- Dependency: CMR-15B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-22](docs/motion-tasks/CMR-22.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete trot/run/fleeing, hoof/saddle registration, correct co-op rider association; preserve hero pixels and mount gameplay.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-23 - Paired grabs/throws and saddle integration

- Status: TODO
- Dependency: CMR-22 DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-23](docs/motion-tasks/CMR-23.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: 5 heroes x6enemykinds x2facings; upright held/contact/depth/release/impact alignment; presentation-only correction, core physics unchanged.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-24 - Full-cast verification and owner presentation

- Status: TODO
- Dependency: CMR-23 DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-24](docs/motion-tasks/CMR-24.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: All11humanoids+horse action coverage, full serial gates/independent review/resource report; indexed videos; opt-in until owner activation.
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
