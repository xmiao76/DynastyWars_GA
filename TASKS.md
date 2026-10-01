# Work Queue

Statuses: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`.

The loop processes tasks from top to bottom and works on only one task per iteration.

Keep this file short. Once more than 20 tasks are `DONE`, move the oldest of them
to `TASKS-ARCHIVE.md`; every iteration reads this file to find the first `TODO`,
and scanning a long tail of finished work costs something each time.

## Owner-prioritized whole-cast motion rollout

The owner accepts Guan Yu's enhancements and authorizes all characters through later loop threads. This main-thread handoff is planning only. Full contract: [CAST_MOTION_ROLLOUT.md](docs/CAST_MOTION_ROLLOUT.md). Remain opt-in until owner activation approval.

Selection: due producer review first, then the earliest ready CMR task; continue it while IN_PROGRESS. A failed prerequisite prevents later CMR tasks from starting. One repository writer/one task per iteration; do not bypass existing retry, verification or permission rules. Older active tracks below are owner-deferred with evidence intact. No runner/scheduler policy changes.

### CMR-01 - Reference, roster/action inventory and budgets

- Status: DONE (attempt 1, 2026-10-01 UTC, verified same day)
- Dependency: None; due producer review still precedes consumer selection
- Specification: [CMR-01](docs/motion-tasks/CMR-01.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Pin Guan Yu displayed pixels/pivots/exposures; inventory 17 humanoids and horse; reproduce baseline failures and record resource/generation budgets.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-02 - Generic per-kind motion profiles/playback

- Status: DONE (attempt 1, 2026-10-01 UTC, verified same day)
- Dependency: CMR-01 DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-02](docs/motion-tasks/CMR-02.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Non-Guan hero/melee/boss/archer fixtures; exact per-actor windows/cues and interruption tests; preserve Guan Yu output and core schemas.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

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

- Status: IN_PROGRESS (attempt 2 - owner directive executed: problem
  pictures identified (7 occluded-sword cells; heads proved consistent
  ~+/-5%), 3 repair sheets drawn (budget 8/8), repairs spliced in
  (originals in previous/; 28 untouched drawings byte-identical), pack
  RE-PREPARED deterministic (manifest f7f0fdd8, 45 frames, one 2003x1369
  page, 7.58 MiB decoded, 0 budget errors; toolkit 26/26). Acceptance 4:
  head half established (fixed-scale ruler comparison, +/-5%); weapon half
  awaits the manual landmark READ of landmarks/sword-review-1..3.png (six
  automated pixel-metric families documented unreliable on this painting
  style). If that read confirms <=10%, CMR-06A closes.
  Evidence: [PROVENANCE.md](art/motion/soldier/PROVENANCE.md) /
  [CONTINUITY.md](art/motion/soldier/CONTINUITY.md) /
  [AUTHORING-PLAN.md](art/motion/soldier/AUTHORING-PLAN.md))
- Dependency: CMR-05 DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-06A](docs/motion-tasks/CMR-06A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable soldier identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-06B - Wei Soldier: integrate/review in motion

- Status: TODO
- Dependency: CMR-06A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-06B](docs/motion-tasks/CMR-06B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic soldier pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-07A - Wei Spearman: author/prepare full motion pack

- Status: TODO
- Dependency: CMR-06B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-07A](docs/motion-tasks/CMR-07A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable spearman identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-07B - Wei Spearman: integrate/review in motion

- Status: TODO
- Dependency: CMR-07A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-07B](docs/motion-tasks/CMR-07B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic spearman pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-08A - Wei Archer: author/prepare full motion pack

- Status: TODO
- Dependency: CMR-07B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-08A](docs/motion-tasks/CMR-08A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable archer identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-08B - Wei Archer: integrate/review in motion

- Status: TODO
- Dependency: CMR-08A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-08B](docs/motion-tasks/CMR-08B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic archer pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-09A - Zhang Fei: author/prepare full motion pack

- Status: TODO
- Dependency: CMR-08B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-09A](docs/motion-tasks/CMR-09A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable zhangfei identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-09B - Zhang Fei: integrate/review in motion

- Status: TODO
- Dependency: CMR-09A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-09B](docs/motion-tasks/CMR-09B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic zhangfei pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-10A - Zhao Yun: author/prepare full motion pack

- Status: TODO
- Dependency: CMR-09B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-10A](docs/motion-tasks/CMR-10A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable zhaoyun identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-10B - Zhao Yun: integrate/review in motion

- Status: TODO
- Dependency: CMR-10A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-10B](docs/motion-tasks/CMR-10B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic zhaoyun pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-11A - Wei Yan: author/prepare full motion pack

- Status: TODO
- Dependency: CMR-10B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-11A](docs/motion-tasks/CMR-11A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable weiyan identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-11B - Wei Yan: integrate/review in motion

- Status: TODO
- Dependency: CMR-11A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-11B](docs/motion-tasks/CMR-11B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic weiyan pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

### CMR-12A - Huang Zhong: author/prepare full motion pack

- Status: TODO
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

## Enhancements

Add future enhancement tasks below this heading.

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

### UIR-4 - No 7px body-font labels

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-4 (S2)
- Evidence: artifacts/review/latest/screens/stage1-result.png - LIVES /
  SCORE / TIME are thin grey Arial-style caps, unlike every other word
  on the panel (re-confirmed fresh); same sans on the roster LIFE /
  SPEED rows and the HORSE row.
- Root cause: TYPE - `liveStyle()` (src/game/ui/type.ts) selects
  BODY_STACK below DISPLAY_MIN_SIZE. Callers: ResultScene.ts:186,
  SelectScene.ts:127-128, hudlayout.ts:21 (META_ROW).
- Affected screens: select-*, stage*-result, webgl-result, stage2/6-play
  (HORSE row), and the phone screens.
- Requirement: these labels use the display family at a size legible on
  a Pixel 7 (at least 7 CSS px there). Any new glyphs are added to the
  display string table and font subset.
- Acceptance criteria:
  - [x] The kit suspect "small text <8px" is gone from the manifest
        (objective count: 92 suspects across 59 screens before, 0
        after), and test/game/uir4-type.test.ts asserts that no
        liveStyle caller in the scenes passes a size below the display
        minimum (source scan) and the HUD layout text constants clear
        it. The labels (LIVES/SCORE/TIME, LIFE/SPEED, HORSE row) use 9
        - the display family and >= 7 CSS px on a Pixel 7 (7 fell to
        the generic sans at ~6 CSS px). No new glyphs, so the display
        string table and font subset are untouched.
  - [x] After npm run review:capture the result crop, the roster crop
        and the phone select are legible and matching (FIXED - result + roster labels legible and matching (pixel-measured 13px display caps vs 10px thin sans before). Caveat: the phone capture HORSE row was empty (player on foot) - that instance is code-confirmed at 9px and covered by the 92->0 suspect count, but was not visually exercised).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: re-laying out the roster cards.

### UIR-5 - Continue and result panels: fit titles, centre chips, add contrast

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-5, V-6, V-7 (S2)
- Evidence: artifacts/review/latest/screens/stage1-result.png (LIVES
  chip on the parchment border; row spans x70-390, centre 230 not 240;
  STAGE CLEAR! touches the top bar) and
  crops/stage1-continue--dialog.png (CONTINUE? crosses the gold top
  rule; flat #ffd700 title + white "9" on cream) - all re-confirmed
  fresh. PAUSED on the same card sits properly inside with a dark
  stroke.
- Root cause: LAYOUT and COLOUR - HudScene.ts:440-448 (title at y92 on
  a card centred at y123 = its top edge; un-stroked liveStyle 22/30)
  and ResultScene.ts:98 and 114-116 (hard-coded chip offsets).
- Affected screens: stage1-continue, stage1-result, stage9-result,
  webgl-result.
- Requirement: the titles sit inside their card with the same inset as
  PAUSED. The chip row is centred on the panel and stays inside its
  frame. The CONTINUE? title and countdown get the dark stroke PAUSED
  uses.
- Acceptance criteria:
  - [x] A unit check shows the title bounds lie within the card's
        panelRect inset by at least 4px (CONTINUE_TEXT stack vs the
        184x96 dialog at cy 123; title and countdown disjoint), that
        the chip row's centre is within 1px of the panel's centre and
        no chip crosses the frame (resultChipRow() laid out from the
        x 70..410 band with even 20px gaps - test/game/hudlayout.test
        .ts UIR-5 block; the old row spanned x70-390, centre 230).
  - [x] After npm run review:capture the continue and result panels
        re-reviewed (FIXED - continue title fully below the gold rule with the dark stroke (countdown too), result title clear of the top bar, chip row centred with even gaps and LIVES off the border; matches PAUSED (delegated, before state confirmed in previous/)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 654/654,
        e2e 79, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: the panel textures, or the countdown logic.

### UIR-6 - Point the touch d-pad chevrons outward

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-10 (S2)
- Evidence: artifacts/review/latest/screens/phone-portrait-game.png -
  the up arm shows a down-chevron, left ">", right "<", down "^"
  (re-confirmed fresh; same in landscape).
- Root cause: ASSET - src/game/art/hudart.ts:487-492: the chevron
  path's apex is at +y, so at angle 0 it points DOWN, but
  hudart.ts:498-501 assumes angle 0 points up.
- Affected screens: phone-landscape-game, phone-portrait-game.
- Requirement: each arm's chevron points in the direction the arm moves.
- Acceptance criteria:
  - [x] A unit test on the painted sheet shows each arm's chevron
        pointing the way it moves (test/game/uir6-chevrons.test.ts:
        the chevron's combined ink+gold pixels keep the tip at the arm
        centre and the wings behind it - pinned failing first, the old
        path read "wings not behind (inward -2.0px)" on every arm).
  - [x] After npm run review:capture the phone crops show outward
        arrows (FIXED - all four arms point outward in both phone frames (pixel-level ASCII-map confirmation by the reviewer; before state confirmed all four inward)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 655/655,
        e2e 79, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: the button layout, or the hit areas.

### UIR-7 - Ask portrait phone players to rotate

- Status: DONE (attempt 1, 2026-09-27..28 UTC, verified full-green)
- Source: UI review 2026-09-26, findings V-9 (S2) plus owner decision 1
  (rotate overlay, not a portrait layout)
- Evidence: artifacts/review/latest/screens/phone-portrait-game.png -
  the game fills ~28% of the height; touch buttons ~20 CSS px; no hint
  to rotate (re-confirmed fresh).
- Root cause: PLATFORM - src/game/main.ts:31-32 (Scale.FIT,
  CENTER_BOTH) has no orientation handling in index.html or
  src/style.css.
- Affected screens: phone-portrait-title, -select, -game.
- Requirement: on a touch device in portrait (height greater than
  width), show a full-screen themed "rotate your phone" overlay (a
  phone icon plus the text, in the display font, on the letterbox
  gradient) over the game. Gameplay is paused while the overlay shows
  and resumes when the phone is rotated back. Desktop and landscape
  are unchanged.
- Acceptance criteria:
  - [x] e2e/orientation.spec.ts: Pixel 7 portrait shows the overlay
        with the sim tick frozen; Pixel 7 landscape shows no overlay with
        ticks advancing; desktop 960x540 shows no overlay (3/3 green).
        The review capture's phone-portrait shots show the overlay and
        the landscape shots do not (ui-review phone() asserts the
        overlay in portrait instead of waiting for ticks - this also
        fixes the known capture abort, so review:capture now completes
        with platform + anatomy + pair sheets).
  - [x] After npm run review:capture: phone-portrait-title/select/game
        show the full-screen themed overlay (gold phone icon + ROTATE
        YOUR PHONE in the display font on the letterbox gradient);
        landscape shows the game clean with touch controls and no
        overlay; WebGL screens intact. Before: tiny game, no hint (V-9
        evidence; previous/ portrait-game never captured - the abort).
  - [x] Contact sheets show no regression; vision 5/5 and relevant
        specs green (touch.spec + touchpause.spec migrated to Pixel 7
        landscape - portrait no longer plays; 10/10). Ledger V-9 set
        to fixed (self-check).
- Non-goals: a portrait gameplay layout, or forcing orientation through
  the Screen Orientation API.

### UIR-8 - Paint the landmark strip

- Status: DONE (attempt 1, 2026-09-28 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-11 (S2)
- Evidence: fresh stage screens - flat grey slab with green lid (gorge
  wall), blank beige rectangles on posts (warship sails, hulls sunk),
  solid red slabs (cliffs); next to the painted heroes they read as
  placeholder art (re-confirmed fresh).
- Root cause: ASSET - src/game/art/backdrop.ts:318-512 `paintMarks`
  fillRect blocks, and the hull sink against MARKS_ROOT_DEPTH
  (GameScene.ts:67).
- Affected screens: all `stage*-play` screens, especially stage1
  (gorge), stage6 (warships) and stage7 (inferno).
- Requirement: repaint all nine landmark kinds with painted masses,
  tonal bands, lit and shadow sides and soft edges, so they
  recognisably stay the same place. The warship hulls must be visible
  above the waterline. Shared backdrop constraints apply (frozen tile
  geometry; bake-time paint, no per-frame cost rise; backdrop lower
  contrast/saturation than the cast with upper-left light; original
  art only).
- Acceptance criteria:
  - [x] test/game/uir8-marks.test.ts: share of half-opaque 16x16 blocks
        with luminance std-dev >= 10 clears 0.55 on all nine kinds.
        Before: gorge 1.00, village 0.44, riverbank 0.25, bridge 1.00,
        outskirts 1.00, warships 0.67, inferno 0.31, flagship 0.25,
        arena 0.44 (five below floor - fails first). After: eight at
        1.00, arena 0.67. The stage6 after-image shows planked hulls
        with masts and folded sails riding the waterline; R5 is 4 on
        the stage*-play screens (painted modeling in the cast idiom:
        gradients, tonal bands, ink lines, upper-left light).
  - [x] After npm run review:capture: all nine landmark strips show
        fully (gorge walls + banners, village roofs/trees, riverbank
        water/reeds, bridge arch, palisade/tents, warships, inferno
        cliffs + burning hulls, flagship tower, arena + braziers).
        Root cause of the sunk hulls found and fixed along the way:
        the 2x-baked marks texture on a tileScale-1 sprite displayed
        only its top half (tile rows 0..32) - hulls, water, decks and
        banner bottoms were cut game-wide. marks.setTileScale(0.5, 0.5)
        maps the texture 1:1 (paint period still 256px, scrolling
        unchanged). Before: stub walls, sail rects without hulls, no
        banners; after: full strips (stage1/6/7 verified close up).
  - [x] Contact sheets show no regression; vision 5/5 and relevant
        specs green (ART-19 suite green unedited: seams, margins,
        periods, distinctness); ledger V-11 set to fixed (self-check).
        The same half-texture display affects the other 2x-baked
        layers - recorded as V-19 for the next producer to batch.
- Non-goals: new landmark kinds, or parallax factors.

### UIR-9 - Paint the sky and clouds

- Status: DONE (attempt 1, 2026-09-28 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-13 (S2)
- Evidence: every fresh `stage*-play`: smooth two-colour gradient sky
  and hard-edged flat-filled cloud lobes (re-confirmed fresh); against
  the painted heroes and title key art the game looks like two
  different products.
- Root cause: ASSET - `paintSky` :63 and `paintCloud` :199 in
  src/game/art/backdrop.ts (a flat gradient and hard flat lobes).
- Affected screens: all `stage*-play` and `stage*-banner` screens.
- Requirement: a painted sky (atmospheric gradient, subtle broken
  colour, soft light toward the sun side) and painted clouds (soft
  edges, a lit top and a shaded belly). The ember sky stays distinct.
  Shared backdrop constraints apply (see UIR-8).
- Acceptance criteria:
  - [x] test/game/uir9-sky.test.ts: 16x16-block luminance-stddev
        share (threshold 7) clears 0.55 on skies, 0.9 on the cloud.
        Before: sky-day 0.04, sky-ember 0.25, cloud 0.80 (fails first).
        After: 1.00 / 1.00 / 1.00. R5 = 4 on stage*-play vs title
        (atmospheric grade, broken colour, sun-side light, modeled
        clouds with lit tops and shaded bellies; ember stays distinct).
  - [x] After npm run review:capture: day skies show graded atmosphere
        with mottling, faint cirrus and modeled clouds (an early
        five-line cirrus pass banded visibly and was cut back to three
        faint lines; an every-9px striation pass read as corduroy and
        was removed - the deterministic grain carries the tooth);
        ember stage7 reads as smoky sunset, distinct from day. WebGL
        and phone-landscape match canvas; portrait still overlays.
  - [x] Contact sheets show no regression; vision 5/5 and relevant
        specs green (ART-19 suite green unedited); ledger V-13 noted
        sky-done (ridges/ground pending UIR-10/11, which complete it).
- Non-goals: weather, time of day, or animated sky.

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

### UIR-12 - Paint hands with fingers, not mittens

- Status: DONE (attempt 1, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)
- Source: UI review 2026-09-27, findings V-14 J4/J8 (S1/S2, owner-flagged)
- Evidence: artifacts/review/latest/anatomy/*.png (all 15 reviewed) -
  flat cream/pink mitten fists with ridge bands but no separated
  digits, against painted faces and sleeves. Worst on pale-skinned
  fighters (zhaoyun) and dark armor (caocao, xiahoudun).
- Root cause: ASSET - scripts/prepare-body-parts.mjs (hand painter)
  and src/game/art/hand-parts.ts: cells carry knuckle shading but no
  digit separations, thumb mass, or face-matched paint handling.
- Affected screens: every fighter in every movement (anatomy sheets).
- Requirement: repaint the hand cells with separated fingers/digits
  (flexed per cell kind), a readable thumb mass, and paint handling
  (tone, shading depth) matching the fighter's face. All five hand
  kinds, both near and far shading.
- Acceptance criteria:
  - [x] Texture/unit check (handparts UIR-12 test): digit-separator
        dips per cell at 4x = 0 before (creases never reached the
        knuckle zone), 3+ after; fails on old paint, passes on new.
        Skin match re-pointed tighter: +-45 around raw skin ->
        +-30 around either designed tone (raw or the bloom-peak lit
        blend, e.g. guanyu 191,114,94 = exact formula blend).
  - [x] review:capture re-run (59 screens + 34 anatomy sheets); J4
        re-reviewed on the fresh sheets (delegated eyes-on: digits
        separated and rounded at 8x and 4x, mitten look gone).
        Note: the before-pair is partially lost - the latest->previous
        rotation hit a persistent Windows EPERM and a fallback deleted
        the stale capture (top-level contact sheets preserved); the
        before state is recorded in the ledger + this test's comments.
  - [x] Full gates green (lint 0, tsc 0, unit 636/636, e2e 78, vision
        5/5, selfplay 13/13, build 0, prodbuild 4/4); ledger V-14
        sub-verdict updated.
- Non-goals: grip geometry or layering (UIR-13), pose changes.

### UIR-13 - Grip wraps: fingers around the haft, hand over weapon

- Status: DONE (attempt 1, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)
- Source: UI review 2026-09-27, findings V-14 J5/J7 (S1/S2)
- Evidence: artifacts/review/latest/anatomy/*.png (attack/thrust) -
  the haft lies ON TOP of the far fist and cuff bands; fists read
  beside the haft rather than around it. X-ray shows the hand markers
  exactly on the weapon axis: geometry passes, pixels fail.
- Root cause: DEPTH+ASSET - src/game/art/draw.ts weaponOrProcedural
  draws the weapon over the gripping hand; hand cells lack wrap
  geometry crossing over the haft (only fingertip pads do).
- Affected screens: every armed fighter in grip movements (anatomy
  sheets; worst on two-handed polearms).
- Requirement: the gripping hand reads wrapped around the haft: finger
  masses visibly cross OVER it on the near side, and the weapon no
  longer covers the hand/fist that holds it (adjust draw order and/or
  add over-wrap paint). Both hands sit on the haft line for
  two-handed weapons.
- Acceptance criteria:
  - [x] Region check (test/game/uir13-gripwrap.test.ts): hand-tone
        pixels in the grip bands on attack/thrust/chop across the
        weapon kinds - recorded before/after (near 360-448 / far
        198-447 samples before; higher after with wrapN). The real
        evidence is pixels over metrics: delegated before/after
        passes CONFIRMED then CLEARED all three claims (haft over far
        fist, fists beside the haft, haft cutting the wrist). Root
        cause found mid-iteration: the near wrap was gated on the
        FAR-hand grip test, so one-handers (caocao) never got it -
        the near hand is the weapon anchor and always grips. Far-fist
        wrap is N/A for one-handers by design (BODY-15 counterbalance
        hand is not holding).
  - [x] review:capture re-run after the fix; grip joins re-reviewed at
        8x/4x on fresh renders against the before crops. Contact
        sheets show no regression elsewhere.
  - [x] Full gates green (lint 0, tsc 0, unit 637/637, e2e 78,
        vision 5/5, selfplay 13/13, build 0, prodbuild 4/4); ledger
        V-14 sub-verdict updated (J5/J7 fixed).
- Non-goals: finger detail itself (UIR-12), strike poses (UIR-15).

### UIR-14 - Sleeves meet shoulders; forearms trace to the hand

- Status: DONE (attempt 1, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)
- Source: UI review 2026-09-27, findings V-14 J1/J3 (S2)
- Evidence: artifacts/review/latest/anatomy/*.png - on armored
  fighters the sleeve starts inset below the pauldron with a visible
  step (lubu/caocao/xiahoudun/xuchu/zhangliao/caoren/xuhuang/zhanghe/
  lidian/soldier in strikes); on zhaoyun the silver forearm vanishes
  on the silver torso in idle/walk/hurt so the hand floats.
- Root cause: ASSET - src/game/art/body-parts.ts cell caps at the
  shoulder (upper-arm pre-span too short/narrow to tuck under the
  pauldron) and no tone separation where the forearm crosses the
  torso (prepare-body-parts.mjs cell paint).
- Affected screens: armored fighters' shoulders in all movements;
  zhaoyun idle/walk/hurt wrist.
- Requirement: upper sleeves start AT the shoulder joint, tucked under
  the pauldron/collar with no gap or step, in all poses; forearms
  crossing the torso keep enough tone/edge separation to trace to the
  cuff and hand.
- Acceptance criteria:
  - [x] Seam check (test/game/uir14-joins.test.ts): shoulder-join
        transparency gaps <=1px and a traceable forearm edge step
        (recorded: the floor passed before the fix too - the eye's
        "step" was a tone edge metrics could not see; acceptance
        rests on the delegated pixel pass per pixels-overrule).
        Fixes: sleeve cells' top rows alpha-feathered (the master's
        pauldron fragments melt under the torso's pauldron instead
        of stepping) + soft edge-shade behind each forearm where it
        crosses the torso (BODY-11 mechanism reused) - the zhaoyun
        silver-on-silver forearm now traces elbow-to-cuff.
  - [x] review:capture anatomy sheets re-rendered on body-7; J1 on
        lubu/caocao/zhangliao and J3 on zhaoyun re-reviewed by a
        delegated judge (verdicts recorded in the PROGRESS entry).
  - [x] Full gates green (lint 0, tsc 0, unit 638/638, e2e 78,
        vision 5/5, selfplay 13/13, build 0, prodbuild 4/4); ledger
        V-14 sub-verdict updated (J1/J3 fixed).
- Non-goals: pauldron art itself, hand paint (UIR-12).

### UIR-15 - Strike arms bend; no parallel rails

- Status: DONE (attempt 2, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)
- Source: UI review 2026-09-27, findings V-14 J6 (S2)
- Evidence: artifacts/review/latest/anatomy/*.png (attack/thrust/chop
  on polearm fighters) - both arms run near-straight and parallel
  under the haft like rails. One-handers and the bow read fine.
- Root cause: POSE - src/game/art/poses.ts strike arm geometry plus
  the weapons.ts arm solution rest too straight: elbows keep little
  flexion and the two arms share one direction.
- Requirement: two-handed strikes keep visible elbow flexion and break
  the parallel: differentiate the arms (lead/push roles), keep both
  fists on the haft with separation, keep hands/weapons clear of the
  face per the existing gates.
- Acceptance criteria:
  - [x] Elbow-flexion + elbow-side measure
        (test/game/uir15-strikearms.test.ts): far-elbow turn rises vs
        baseline on attack/chop (guanyu attack 84->116deg, chop
        123->135; chop chains 23-33->42-84deg) and the two elbows bow
        different sides of the bar (or >=3u apart on it) in every
        polearm strike. Probe-recorded geometry limit: on long
        ji/glaives the weapon's own butt sits at ~full far reach at
        thrust (d=24.1 vs reach 24.5), so the rear arm is legitimately
        extended there and the elbows' sides carry the rails fix.
        Grip-hold guard: every strike keeps the far hand on the haft.
  - [x] The anatomy J6 re-review reads ok (J6 FIXED on attack/attack2/thrust for all polearm fighters (elbows clearly apart, low hip vs bar height; the parallel-tubes read is gone)).
  - [x] Reach/face-clear/parity gates stay green; full gates green
        (lint 0, tsc 0, unit 640/640, e2e 78, vision 5/5, selfplay
        13/13, build 0, prodbuild 4/4).
- Non-goals: new poses, timing changes, in-betweens (BODY-24).

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
