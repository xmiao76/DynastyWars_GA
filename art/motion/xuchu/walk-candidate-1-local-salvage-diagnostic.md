# CMR-15A candidate1: zero-request local salvage diagnosis

Parent writer run `2026-10-10T05-59-31-081Z-feca4e99-b1c9-488c-9c2a-a9c2fbd12901`. Diagnosis successful; **safe local salvage of the required alternating gait: NO**. Candidate1 remains NOT ACCEPTED / DO NOT PREPARE. Task remains IN_PROGRESS; prior recovery failure1 stands, diagnosis is not failure2. Zero requests/reservations/retouches; no economic receipts or takeover. Parent alone decides future execution.

## Evidence and endpoint semantics

Original [candidate1](walk-candidate-1.png) SHA256 `dfd7bd87e424c6a50621908eed5a0c950852ea61c033c932955b50e175eb92f7`. All13 [prior payload hashes](FILE_HASHES.json) re-derived and matched; immutable original, audit and provisional report unchanged. Inspected original, gameplay,4x, both landmark overlays/detail and both original masters. New source-coordinate [probes](walk-candidate-1-diagnostic-probes.json), [head crop](walk-candidate-1-diagnostic-head.png), [beard grid](walk-candidate-1-diagnostic-beard-grid.png) and [foot crops](walk-candidate-1-diagnostic-feet.png) opened. Coordinates zero-based original pixels; rectangles half-open, support bounds inclusive. No native video, runtime registration or motion-displacement acceptance claimed.

**Required head endpoint:** an anatomical crown-to-chin/head-size measure cannot be obtained here: helmet hides every crown and beard hides the anatomical chin. Do not substitute helmet crown. The previous forehead/brow→beard segment is an explicit *partial visible reference*, NOT the full head gate. Even that segment is unverified: its upper points (274,47),(800,47),(1314,47),(298,552),(809,552),(1311,552) sit on skin near the brow rather than consistently identifying the uppermost exposed forehead at the rim. Its lower points (276,95),(805,96),(1316,96),(300,602),(808,605),(1311,605) do not all share an isolated external beard endpoint. The beard grid shows collar/neck continuing underneath0/4; low alpha5 is edge transition, not proof of a free tip. Pixel continuity below0 y95→97 remains alpha249/249/251; below4 y605→607 alpha219/229/232;5 y603..607 alpha123/58/46/59/96 rises again toward collar. Alpha alone cannot label anatomy. No replacement point is declared exact where the contour merges.

Tolerance: at least±1 source pixel per independently identified endpoint (±2px segment height worst case); merge uncertainty is **not** bounded by that tolerance and stays unknown. Previously reported heights48/49/49/50/53/53 give9.9338% but are NOT PASS. Even allowing only±1px per *height*, independently varying endpoints can increase spread to13.91%; true per-endpoint±1 yields height uncertainty±2 and possible17.88%. These are sensitivity bounds, not a corrected measure. Helmet-inclusive4.888% remains secondary and cannot rescue the head result. No accepted anchor; fixedBand=null, no projection state or weaker definition introduced.

## Isolation and full drawing bounds

[Probe script](diagnose-walk-1.mjs) hash-pins original and probes alpha1/16/128 without editing source. Semantic ownership partitions are `[0,0,520,512]`, `[520,0,1026,512]`, `[1026,0,1536,512]` and same x ranges at y512..1024. They are DIAGNOSTIC ONLY, not validated extraction masks. Alpha≥16 full-support bounds:

| frame | inclusive xmin,ymin,xmax,ymax | width×height | footprint lowest rows, screen-left / screen-right (alpha≥128) |
|---|---|---|---|
| walk:0 |16,14,514,494|499×481|y493 x112..147 / y485 x311..339|
| walk:1 |525,15,1019,493|495×479|y482 x663..689 / y492 x803..814|
| walk:2 |1035,14,1528,486|494×473|y485 x1197..1213 / y481 x1342..1345|
| walk:3 |20,520,510,992|491×473|y991 x123..149 / y986 x316..323|
| walk:4 |524,520,1022,990|499×471|y979 x645..648 / y990 x848..849|
| walk:5 |1032,520,1526,990|495×471|y989 x1138..1167 / y983 x1355..1360|

At alpha≥16 no partition-edge pixels; retaining at least this support permits separate variable-width rectangles and uniform placement on a NEW canvas without clipping body/weapon cores. Cell0 must include x514 (not stop at511), and4 reaches1022. **This does not approve threshold cleanup.** All nonzero alpha support extends to x519 for0, x1025 for4, and sheet edge x1535 for2/5 (43/7 partition-edge pixels). Low-alpha fragments require explicit semantic masks/edge review, not silent discard. Full original nonzero support cannot yet be certified isolated/unclipped; prior statement of outer-edge margin applies only to visible blade core, not all alpha. Repacking can fix conceptual512 boundary failure, not missing articulation. No source pixels moved.

Foot coordinates are regional lowest opaque-enough rows, not automatically planted anatomical contact points. Different apparent sole y values and3/4 natural posture prevent a common ground/≤1.5u certification without accepted pivots; registration remains unknown. Original fixed scale124/477 is a review hypothesis only.

## Gait relationships and salvage verdict

- 0: two settled boots; plausible guard.
- 1: screen-right boot extends heel-low/toe-up; left boot trails.
- 2: SAME forward boot extension, greater reach; neither a planted under-hip support nor bent forward passing leg. Not a substitute for phase2.
- 3: wide stride with flatter forward boot. Side/near-far continuity from1 cannot prove opposite anatomical contact; do not assume anatomical alternation from screen position.
- 4: screen-left boot lifts **behind** hip; screen-right foot supports. This is backward recovery/heel lift, not requested forward passing leg.
- 5: settled guard-like feet; visible braking dynamics unestablished.

No reordering can supply TWO anatomically opposite forward passing keys: there are zero established forward-under-hip passing drawings and only one clear backward lift. Frame duplication/timing changes cannot create those silhouettes. Whole-body mirroring reverses face/weapon, boot-only reflection or splice requires changing knee/hip/armor overlap and inventing articulation; recoloring to label near/far legs is a forbidden palette trick. Whole-sheet or per-frame scaling leaves weapon/body ratio unchanged; per-frame normalization forbidden. Shaft-only retouch has no length-spread outlier (prior spread1.9901%, direction max0.6504° local diagnostic); it cannot repair gait or merged head. Therefore **NO safe local fix establishes all required distinct gait**, although layout alone is locally salvageable in principle after alpha-mask review.

## Changed next strategy, resources and checks

[Candidate2 prompt DRAFT](walk-prompt-2-DRAFT.txt) is materially changed: explicit alternating near/far planted UNDER-HIP supports and forward knee/boot recovery with≥20px lift, natural occlusion identity not palette labels;60px margins;360px body/292px whole weapon ratio0.81 versus candidate1~1.09;8px empty beard-tip notch; consistent exposed forehead reference with helmet/crown limitation disclosed. It neither guarantees success nor changes the head gate. Parent must reject unknown head evidence rather than consume prompt target40px as a pass. Future request references original body then portrait, not candidate1 gait.

Remaining: walk1/2 used => ONE whole-sheet candidate remains, Xu Chu1/12 used (11 remain), global144/200 (56 remain), repair requests this package0. No ledger changes. Parent subsequent tick decides whether to reserve/execute candidate2; no downstream sheets/preparation authorized by this diagnosis. Required whole-pack head/weapon gate, genuine gait, registration/alpha/pages/continuity and independent review remain pending.

Checks executed foreground: diagnostic script assertions PASS (13 hashes, dimensions,6 probes, fixedBand null), `npm run lint` PASS, `npm run typecheck` PASS, targeted budget/pipeline/projection/review tests64/64 PASS. No browser/vision/build/prodbuild run or claimed: no runtime/UI/shipping changes. Diff check recorded in progress/handoff. No task status edit, core/catalog/runtime changes, commit/push, runner/control/lock/schedule action, background/nested worker/job or fabricated manager receipt.
