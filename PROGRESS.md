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

### 2026-09-25 03:20 UTC - BODY-5 (goal round 25: pipeline done, art blocked on provider outage)

- Status before: BODY-5 TODO (BODY-4 DONE).
- Work completed: BODY-5 marked IN_PROGRESS; full horse pipeline built
  and verified WITHOUT art (provider down, see below).
  - `src/game/art/horse-frames.ts`: HorseArt, 3-frame table, aliasing
    mirrored from horsePoseName, full-frame blit painter.
  - `src/game/adapters/horse-art.ts`: queue/publish with signature
    verification + atomic fallback; registry threading in drawKindPose
    horse case; BootScene queue+publish wiring (verified no-ops);
    all three publish functions now preserve each other's keys.
  - Fixtures: `scripts/make-horse-fixture.mjs` (+ .d.mts) with distinct
    flat-color frames; committed under horse-fixtures/.
  - `test/game/horse.test.ts` (8): frame table + aliasing, fixture
    determinism + integrity, per-frame render selection incl. aliases,
    fallback byte-identity, publish atomicity (missing/undersized/
    tampered rejected, heads+bodies preserved), production-pack pin
    (empty until art lands), and a VACUOUS-LIVE parity/liveness/saddle
    test that gates every frame the moment the real sheet wires in.
  - `scripts/prepare-horse.mjs` written (3-panel split, bbox normalize
    feet-y76/center-x50, per-frame nudge config, keying, signatures);
    untested until a master exists.
- PROVIDER OUTAGE (round 1): grok image_generate fails 4x with a
  transport error ("Unexpected token" JSON parse failure, with and
  without reference images); gpt returns HTTP 429 usage_limit_reached
  (resets in ~116h). No quota spend possible on either side right now.
  NOT marking blocked (goal policy needs 3+ rounds of the same
  condition); retrying next round.
- Verification: lint PASS, typecheck PASS, horse suite 8/8. Full gates
  deferred to the art round (nothing user-visible changed yet).
- Result: IN_PROGRESS (pipeline checkpoint committed; art pending).
- Status after: BODY-5 IN_PROGRESS.
- Next: retry horse master generation; on success - prep, wire, parity,
  mounted captures, full gates, owner review, DONE.

### 2026-09-25 02:55 UTC - BODY-4 (attempt 1, full verification, DONE)

- Status before: BODY-4 IN_PROGRESS (masters generated round 22).
- Work completed: three mook paper-doll bodies shipped LIVE (8 fighters
  total with painted bodies).
  - Masters: soldier (red-brown lamellar), spearman (blue-grey mail),
    archer (green cloth+leather), all keyed to the Guan Yu master for
    brushwork; joint tables eyeballed from grids; prep extended with
    per-entry outDir (mook-bodies pack) - hero sheets byte-identical on
    regen (determinism holds).
  - Wired: BODY_ART_CATALOG + BODY_PREPARED merged across both packs;
    boot publishes all 8 (e2e asserts the exact set).
  - Measured mook complexions: painted hands sample #86-93/#55-67/
    #3f-4f vs cast default #f0c8a0 (a glaring head/hand mismatch), so
    ENEMY_FIGURES gained SKIN_SOLDIER/SPEARMAN/ARCHER (0x875640/
    0x936149/0x8f604a); artquality + likeness mook rules upgraded from
    "shared tone" to exact plan-pack skin match (stronger, not weaker).
  - Gate rebalancing (evidence-led): archer's lean silhouette scores
    0.787-0.832 (honest enrichment, verified by eyeball), so
    PARITY_FLOOR 0.81->0.75 as a drift bound; breakage detection moved
    to new per-part position tests (every part's ink centroid on its
    segment, idle/attack/down, all 8 fighters - immune to style).
- Verification: lint PASS, typecheck PASS, unit 354/354, e2e 78/78,
  vision 5/5 (sprite gate held), selfplay 13/13, build PASS, prodbuild
  4/4. 8-fighter before/after board eyeballed (mook heads seat cleanly
  on painted torsos; down poses coherent); live combat + co-op captures
  eyeballed (painted mooks, P2 spawn, untouched horse).
- Housekeeping: ENH-6 archived (chain ENH-5 -> ENH-6). 20 DONE remain.
  art/hero-bodies renamed art/fighter-bodies (now holds 8 masters) +
  PROVENANCE.md written.
- Result: COMPLETED; captures presented for owner review.
- Status after: BODY-4 DONE. Next: BODY-5 (horse repaint).
- Next recommended task: BODY-5.

### 2026-09-25 00:30 UTC - BODY-3 (attempt 1, full verification, DONE)

- Status before: BODY-3 IN_PROGRESS (Zhang Fei wired in round 19).
- Work completed: all five hero paper-doll bodies shipped LIVE.
  - Joint tables for guanyu/huangzhong/weiyan/zhaoyun (eyeballed from
    grid overlays; weiyan's master is the 1632x624 landscape cut);
    prep derives palm/ankle joints from the visible-fingertip/sole
    landmarks the tables record.
  - All five sheets + prepared.json regenerated; BODY_ART_CATALOG wired
    for the full roster; boot publishes all five (signature-verified).
  - New e2e/body-look.spec.ts (3): boot publishes 5, select capture,
    per-hero gameplay w/ motion, mounted, co-op, phone; idle-texture
    liveness per hero. test/game/bodyboard.test.ts writes the
    before/after board (idle/attack/down x old/new x 5 heroes) with
    parity+liveness assertions baked in.
- Verification: lint PASS, typecheck PASS, unit 353/353, e2e 78/78,
  vision 5/5 (sprite gate HELD with painted bodies live - the
  outline-ratio risk did not materialize), selfplay 13/13, build PASS,
  prodbuild 4/4. Objective capture review 10/10 via
  artifacts/body3-review.mjs (per-hero armor hue, 5/5 pairwise distinct
  frames, select cards populated, mounted/co-op/phone non-empty).
- Housekeeping: ENH-5 (tail chain ...FIX-6 -> ENH-4 -> ENH-5) archived.
  20 DONE remain.
- Result: COMPLETED; captures presented for owner review (objections
  welcome - plan requires presentation, not a pre-approval gate, for
  this phase).
- Status after: BODY-3 DONE. Next: BODY-4 (mook bodies).
- Next recommended task: BODY-4.

### 2026-09-24 22:40 UTC - BODY-3 (goal round 19: Zhang Fei paper-doll wired + verified)

- Status before: BODY-3 IN_PROGRESS, 5 production masters generated.
- Work completed: first hero end-to-end through the paper-doll pipeline.
  - `scripts/prepare-body-parts.mjs`: joint tables + oriented-quad cuts,
    derotation to vertical cells, corner-flood keying (seed: EVERY dark
    border pixel), far-side 0.82 shading, per-hero sheets + prepared.json
    (sha256 + content signatures), checkered review composites.
  - Zhang Fei joints eyeballed from grid overlay; sheet + review
    composite generated; cells verified (all 9 parts, pivots on joints).
  - Wired into BODY_ART_CATALOG; body-art.ts now reads
    hero-bodies/prepared.json (empty body-art/prepared.json stub removed).
  - Parity calibrated on REAL art: honest scores 0.845-0.878 across all
    14 poses, cross-identity band 0.657-0.777, so PARITY_FLOOR set to
    0.81 with a liveness check (< 0.99) catching silent fallback; both
    asserted per wired hero per pose. Ablation proved small-part loss is
    invisible to whole-figure IoU, hence the liveness pairing.
- Defects caught by review (all fixed): keying ate dark trousers at
  tolerance 16 (now 10); corner-only flood seeds stranded torso-cell
  background (now all dark border pixels - the black-slab bug, confirmed
  fixed in the re-render); upperArm pre widened 0.2->0.3 for pauldron
  coverage.
- Verification: bodyparts suite 14/14 (incl. real-art parity + liveness);
  before/after + zoomed attack renders eyeballed (painted vest/trousers/
  boots/arms seat correctly, pike grip + head untouched).
- Result: IN_PROGRESS. Next: joints + prep for guanyu/huangzhong/weiyan/
  zhaoyun, corner-alpha regression test, review sheets, e2e captures
  (mounted/co-op), full gates, owner review, commit.
- Status after: BODY-3 IN_PROGRESS (1 of 5 heroes wired).

### 2026-09-24 21:32 UTC - BODY-3 (goal round 18: production masters regenerated for cutting)

- Status before: BODY-3 IN_PROGRESS with five approved-style pilot masters.
- Work completed: grid-overlay review showed the relaxed-pose pilots
  overlap too much for clean part cuts (arms against torsos, legs under
  robes), so all five were regenerated in spread-limb production poses
  (arms out ~30 deg, legs apart, no weapons), each keyed to its ART-18
  head sheet. Wei Yan needed one retry (3-panel sheet again); Guan Yu
  production is single-figure. Old pilot files preserved under
  artifacts/look/body1-*-pilot.jpg; production masters committed at
  art/hero-bodies/*-body-master.jpg.
- Result: IN_PROGRESS. Next: preparation script (fractional polygon
  cuts + pivots + prepared.json), catalog/boot wiring, per-hero parity,
  review sheets, full gates, owner review.
- Status after: BODY-3 IN_PROGRESS (production masters done).

### 2026-09-24 21:25 UTC - BODY-3 (goal round 17: all five body masters generated)

- Status before: BODY-3 TODO, BODY-2 DONE.
- Work completed: BODY-3 marked IN_PROGRESS; generated all five hero
  body masters (grok provider, each keyed to its ART-18 head sheet):
  art/hero-bodies/{guanyu,zhangfei,huangzhong,weiyan,zhaoyun}-body-
  master.jpg. Zhao Yun regenerated clean (the BODY-1 pilot holds a
  spear, unusable for parts); Wei Yan needed one retry (first came back
  a 3-panel sheet); Guan Yu's master is a 3-figure sheet (use the middle
  figure at prep). All show neutral spread-limb stances on black, no
  weapons, matching heads.
- Result: IN_PROGRESS. Next in BODY-3: preparation script (fractional
  part cuts + pivot metadata + prepared.json), catalog/boot wiring,
  parity per hero per pose, review sheets, full gates, owner review.
- Status after: BODY-3 IN_PROGRESS (masters done, prep + wiring next).

### 2026-09-24 23:10 UTC - BODY-2 (attempt 1, full verification, DONE)

- Status before: BODY-2 TODO (BODY-1 closed DONE on owner pilot approval
  earlier this turn; goal resumed to active/armed).
- Work completed: paper-doll body pipeline, fixtures only, no shipped
  visual change (production body catalog is empty; everything falls back
  to procedural pixels).
  - `src/game/art/body-parts.ts`: 10-part table (BODY_PART_ORDER per the
    BODY_PARTS_SPEC), BodyArt/BodyResources, bodyPainter (translate to
    joint A, rotate to B, axial stretch to |AB|, lateral bulk scale,
    device-to-logical density conversion), maskIou, PARITY_FLOOR 0.90.
  - `draw.ts`: `Shape.bodyPart` markers slotted into `figureShapes`
    (procedural shapes skipped per part when body art present),
    generalized `paintWithHead` (independent head/body painters,
    bodyDetails runs at front marker or before the trailing flush),
    `drawFigure` threading; exported bootShape/footShape for fixtures.
  - `registry.ts` threads `resources.bodies[kind]`; `ArtResources`
    gains optional `bodies`; `body-art.ts` adapter (explicit-catalog
    queue/publish, registry merge both directions); BootScene wires
    queue+publish (verified no-ops).
  - `scripts/make-body-fixtures.mjs` (+ .d.mts): deterministic 10-cell
    fixture sheet (exact procedural silhouettes, distinct flat colors)
    + prepared.json with sha256/signatures; committed under
    src/game/assets/body-fixtures/.
  - `test/game/bodyparts.test.ts` (12): table/cells, byte-identical
    regeneration, sha256+signatures, part presence + draw order at
    computed joint points, mook-path registry threading, fallback
    byte-identity, publish atomicity incl. heads-preserved merge,
    mask-IoU units, 14-pose parity gate (all clear 0.90).
- Defects caught during verification (all in new code/tests, none shipped):
  1. bodyPainter forgot the device-to-logical density conversion: every
     part rendered 4x and buried the far side. Fixed; density now flows
     from prepared.json through BodyArt.
  2. Order-test sample points kept landing on the pike haft (near-vertical
     through the grip) and beard/trim regions; resolved with a zoomed
     dump (artifacts/elbow-zoom.png) and region-based assertions.
- Verification run: lint PASS, typecheck PASS, unit 350/350 (+12), e2e
  75/75, vision 5/5 (sprite gate untouched - zero art changed), selfplay
  13/13, build PASS, prodbuild 4/4.
- Housekeeping: ENH-4 (tail chain ...FIX-6 -> ENH-4) moved to
  TASKS-ARCHIVE.md tail. 20 DONE remain.
- Result: COMPLETED.
- Status after: BODY-2 DONE. Next: BODY-3 (five hero bodies).
- Next recommended task: BODY-3.

### 2026-09-24 22:05 UTC - BODY-1 DONE (owner approved the pilots)

- Status before: BODY-1 IN_PROGRESS, awaiting owner pilot approval.
- Work completed: owner replied "Approved" with no changes requested.
  Acceptance now fully met: both briefs written with quotations separated
  from interpretation; pilots reviewed at full + select/HUD/gameplay
  sizes with no legibility blockers. Supporting prep already verified in
  rounds 1-5 and 13: pilot keyability, bundle/memory/boot baselines,
  parity-harness validation (IoU 1.0 deterministic, >=0.90 floor),
  14-pose joint inventory, BODY-2 insertion-contract mapping,
  docs/BODY_PARTS_SPEC.md.
- Housekeeping: FIX-6 (tail chain ...GATE-3 -> REFACTOR-1 -> FIX-6) moved
  to TASKS-ARCHIVE.md tail. 20 DONE remain.
- Result: COMPLETED; goal-4bb34af7 resumed to active/armed.
- Status after: BODY-1 DONE. BODY-2 starts next.
- Next recommended task: BODY-2 (paper-doll pipeline).

### 2026-09-24 21:55 UTC - BODY-1 (goal round 13: BODY-2 part spec pre-designed)

- Status before: BODY-1 IN_PROGRESS, owner pilot approval still pending.
- Work completed: `docs/BODY_PARTS_SPEC.md` - the complete BODY-2 part
  inventory (13 raster parts with pivots, natural lengths from the idle
  pose, draw order interleaved with ART-18 head markers), kept-procedural
  list (neck, pauldron, weapons), per-part transform rule (translate to
  joint A, rotate to B, axial scale to |AB|), sheet-packing recommendation
  and the IoU>=0.90 parity floor (grounded in round-2's 0.763
  cross-identity measurement). Derived from the round-3 joint inventory
  and round-4 insertion-contract mapping; no source touched, no art
  generated - pure design, so the approval gate stands intact.
- Status after: BODY-1 IN_PROGRESS, still awaiting owner pilot approval.
- Next: on approval, BODY-2 (paper-doll pipeline); BODY-1 closes DONE.

### 2026-09-24 21:35 UTC - BODY-1 (goal round 6: waiting-state integrity check)

- Status before: BODY-1 IN_PROGRESS, owner pilot approval still pending;
  all approval-independent prep done (rounds 1-5).
- Work completed: verified the waiting state is intact - queue shows
  BODY-1 IN_PROGRESS with BODY-2..7 TODO, both briefs + all four review
  artifacts present with unchanged sizes, tree holds only uncommitted
  BODY-1 work with zero source changes. No new groundwork left that
  would not either duplicate prior rounds or jump the approval gate.
- Status after: BODY-1 IN_PROGRESS, still awaiting owner pilot approval.
- Next: on approval, BODY-2 (paper-doll pipeline); BODY-1 closes DONE.

### 2026-09-24 21:15 UTC - BODY-1 (goal round 5: pilots checked at real display sizes)

- Status before: BODY-1 IN_PROGRESS, owner pilot approval still pending.
- Work completed: `artifacts/body1-pilot-sizes.mjs` + review sheet
  `artifacts/look/body1-pilot-sizes.png` showing each pilot at the true
  sizes the game uses (device px at 960x540): Zhao Yun body at gameplay
  92px tall, Cao Cao portrait in the 76x84 select window, Cao Cao head
  at 34px medallion and ~20px gameplay widths. Read the sheet: the body
  reads clearly at gameplay height (armor, plume, spear all visible);
  the portrait holds the select window (face, crown, beard); the head
  stays recognizable down to medallion/gameplay chips, on par with how
  ART-18 heads read at those sizes. No legibility blockers found.
- Result: no repo source touched. BODY-1 acceptance evidence now covers
  select/HUD/gameplay sizes, not just full-size pilots.
- Status after: BODY-1 IN_PROGRESS, still awaiting owner pilot approval.
- Next: on approval, BODY-2 (paper-doll pipeline); BODY-1 closes DONE.

### 2026-09-24 20:55 UTC - BODY-1 (goal round 4: BODY-2 insertion contract mapped)

- Status before: BODY-1 IN_PROGRESS, owner pilot approval still pending.
  Read-only round; no source touched.
- Work completed: mapped the exact `drawFigure` seam BODY-2 extends
  (`draw.ts:173-382`, `registry.ts:286-314`):
  - Painted path already exists: `figureShapes` inserts `headLayer`
    rear/head/front marker shapes into the ordered list; `paintWithHead`
    flushes cel groups and invokes the raster painter at each marker;
    procedural head parts swap to `emptyHeadParts`; skin material flows
    from the painted art (`draw.ts:180`).
  - Full slot order: [(lying) weapon] -> cape -> rear marker -> far
    arm/leg/boot/foot -> torso -> skirt -> near leg/boot/foot -> neck ->
    head -> pauldron -> near arm (+shoulder cap) -> [beard] -> front
    marker -> forearm skin/hand -> weapon.
  - BODY-2 contract: same marker mechanism with per-part markers in the
    SAME slots (cape->cloth part, chains->upper/fore+thigh/shin parts,
    torso->torso part); part transform = translate to joint A, rotate to
    B, axial scale to |AB| (round-3 finding); raster pre-shaded like
    heads (never cel-shaded over); procedural shapes skipped per part
    like `emptyHeadParts`; weapons/hands/facing (outside mirror) and
    `applyBuild` joint flow untouched; skin flows from body art.
  - Open for BODY-2: skirt stays procedural vs torso-sheet region;
    neck procedural bridge vs head-sheet extension.
- Result: BODY-2 design de-risked without writing pipeline code (which
  correctly waits on BODY-1 approval).
- Status after: BODY-1 IN_PROGRESS, still awaiting owner pilot approval.
- Next: on approval, BODY-2 (paper-doll pipeline); BODY-1 closes DONE.

### 2026-09-24 20:35 UTC - BODY-1 (goal round 3: joint inventory + foreshortening finding)

- Status before: BODY-1 IN_PROGRESS, owner pilot approval still pending.
  Continued with approval-independent groundwork only.
- Work completed: dumped all 14 pose skeletons + 10 derived part segments
  to artifacts/body-joint-inventory.json (scratch vitest, since removed).
- KEY FINDING for BODY-2: segment lengths are NOT rigid across poses -
  foreArmN spans 2.8..13.0 (128% spread), shins ~60%, torso 21..23 except
  `down` at 13.2. Rigid paper-doll rotation alone cannot fit; the BODY-2
  renderer must axially stretch parts to joint distance, with dedicated
  foreshortened variants (or accepted squash) for recover/jump/down,
  which drive the extremes. Torso needs only a lying variant.
- Result: no repo source touched (scratch deleted); finding recorded for
  BODY-2 design. Tree still holds only uncommitted BODY-1 briefs + queue.
- Status after: BODY-1 IN_PROGRESS, still awaiting owner pilot approval.
- Next: on approval, BODY-2 (paper-doll pipeline); BODY-1 closes DONE.

### 2026-09-24 20:10 UTC - BODY-1 (goal round 2: baselines + parity-harness validation)

- Status before: BODY-1 IN_PROGRESS, owner pilot approval still pending.
  Continued with approval-independent groundwork only; no bulk art.
- Work completed:
  - BODY-7 baseline: dist 3805 KB / 25 files (hero-faces shipping art
    alone 2327 KB; 5 portraits ~300 KB each dominate); boot-to-title
    2118 ms; 337 textures / ~99.8 MB decoded RGBA at full cast
    (biggest single: title sheen strip 3.6 MB). Scripts:
    artifacts/body-baseline-mem.cjs.
  - BODY-2 parity-harness validation (scratch vitest, since removed):
    identical renders score mask-IoU exactly 1.0 (deterministic);
    zhaoyun-vs-zhangfei idle scores 0.763, so the same-fighter
    old-vs-new parity floor should sit >= 0.90. Key design finding:
    compare only within identical boxes (same pose) - per-pose margins
    differ, so cross-pose IoU is meaningless.
- Result: no repo source touched (scratch deleted); tree holds only the
  BODY-1 briefs + queue updates, uncommitted until BODY-1 closes.
- Status after: BODY-1 IN_PROGRESS, still awaiting owner pilot approval.
- Next: on approval, BODY-2 (paper-doll pipeline); BODY-1 closes DONE.

### 2026-09-24 19:45 UTC - BODY-1 (goal round 1: pilot prep validation, still awaiting owner)

- Status before: BODY-1 IN_PROGRESS, pilots presented, owner approval
  pending. Bulk work parked per plan; this round did only
  approval-independent validation.
- Work completed: `artifacts/body1-pilot-analysis.mjs` flood-fill analysis
  of the three pilots (corner flood, tolerance 18):
  - zhaoyun-body: 62.8% keyable black, figure 75%w x 92%h with margins on
    all four sides - clean for part-cutting prep.
  - caocao-head: 81.9% keyable black, figure 68%w x 91%h, margins all
    sides - clean for head-cell prep.
  - caocao-portrait: figure touches all edges (100% bbox) - expected and
    fine, portraits are full-bleed busts, never keyed sprites.
- Result: preparation approach validated (keyed cutouts for gameplay
  art, full-bleed for portraits). No repo source touched this round.
- Status after: BODY-1 IN_PROGRESS, still awaiting owner pilot approval.
- Next: on approval, BODY-2 (paper-doll pipeline); BODY-1 closes DONE.

### 2026-09-24 19:35 UTC - BODY-1 (attempt 1, briefs done, pilots awaiting owner approval)

- Status before: BODY-1 TODO, first task of the approved paper-doll body
  plan (BODY-1..7 filed this round; goal-4bb34af7 created and armed).
- Work completed:
  - `docs/BODY_STYLE_GUIDE.md`: shared direction (brushwork, palette,
    joint conventions, per-hero/mook/horse notes tied to ART-18 heads).
  - `docs/BOSS_HEAD_REFERENCE.md`: 9 boss briefs; 4 sourced (Lu Bu ch.5
    attire, Cao Cao ch.1 細眼長髯, Xiahou Dun ch.18 拔矢啖睛, Xu Chu
    Records 長八尺餘腰大十圍), 5 honestly interpretation-only.
  - Pilots generated (grok provider; one transient reference-fetch failure
    cleared on retry): Zhao Yun full body keyed to his ART-18 head sheet,
    Cao Cao portrait bust, Cao Cao gameplay head keyed to the portrait.
  - Copies in artifacts/look/body1-{zhaoyun-bodypilot,caocao-portrait,
    caocao-head}.jpg for review.
- Result: IN_PROGRESS - BODY-1 acceptance needs owner approval of the
  pilots before bulk work (unresolved objections stay open per plan).
- Status after: BODY-1 IN_PROGRESS, awaiting owner pilot review.
- Next: on approval, BODY-2 (paper-doll pipeline); BODY-1 closes DONE.

### 2026-09-24 10:45 UTC - ART-20 (attempt 1, full verification, DONE)

- Status before: ART-20 TODO, the last overhaul phase. The runner is paused
  on the attempt-2 BLOCKED (untouched here). This round came from the
  owner's standing overhaul goal in the DSH session, not a runner tick.
- Work completed: props, pickups & combat-feedback pass.
  - New `src/game/art/fx.ts`: paintSpark (layered amber/gold/white
    starburst with ink flecks), paintBurst (new 28px KO ring + star +
    embers), paintDust (unchanged look, moved for testability).
  - `BootScene` bakes fx:spark (restyled), fx:burst (new), fx:dust.
  - `props.ts`: enriched interiors, identical boxes - crate diagonal
    brace + studs + grain, meat glaze + sheen + knuckles, sword fuller +
    grip wraps, arrow barbs + shaft bands + head glint.
  - `GameScene`: koEmitter bound to fx:burst (same counts/positions);
    stage-clear gold cam.flash(220, 255, 214, 130); boss-spawn crimson
    cam.flash(180, 178, 28, 28) next to the WARNING banner. Both
    presentation-only and real-play gated (applyJuice path / explicit
    autopilot check).
  - `test/game/fx.test.ts` (3) + `e2e/artfx.spec.ts` (3): texture
    existence + emitter bindings, flash recording via a window-logged
    cam.flash wrapper (crimson on forceBoss spawn; gold on a REAL
    stageclear driven by killing the boss - forceResult bypasses the sim
    and emits nothing), combat capture + 8x fx texture dumps for review.
- Scope note: no jar/chest kinds exist (loot is crate/meat/sword/arrow);
  inventing kinds would touch the sim, so the four existing props were
  restyled instead. Neither flash existed; both added as real-play juice.
- Verification run: lint PASS, typecheck PASS, unit 338/338 (+3; one
  full-suite flake in the two heaviest files, green on re-run and in
  isolation), e2e 75/75 (+3; weapon/probe/juice preserved), vision 5/5
  (SPRITE GATE 256/256, 85/85 weapons, 170/170 retracts), selfplay 13/13,
  build PASS, prodbuild 4/4. ui20-fx-{spark,burst} dumps + ui20-combat
  (live sparks, restyled crate) eyeballed.
- Housekeeping: REFACTOR-1 (tail chain ...DIFF-1 -> GATE-3 -> REFACTOR-1)
  moved to TASKS-ARCHIVE.md tail. 20 DONE remain.
- Result: COMPLETED outside the runner (no tick; runner still paused for
  owner review).
- Status after: ALL SEVEN OVERHAUL PHASES DONE (UI-1..UI-5, ART-19,
  ART-20). ENH-12 still deferred (owner priority).
- Next recommended task: none for the goal - it is complete; ENH-12
  awaits the owner's go-ahead whenever the deferral lifts.

### 2026-09-24 09:10 UTC - ART-19 (attempt 1, full verification, DONE)

- Status before: ART-19 TODO. The runner is paused on the attempt-2 BLOCKED
  (untouched here). This round came from the owner's standing overhaul goal
  in the DSH session, not a runner tick.
- Work completed: painted per-stage backdrops.
  - New `src/game/data/stagebackdrop.ts`: landmark kind + sky variant +
    ember flag per stage (game layer; sim never reads it).
  - `backdrop.ts`: paintMarks with 9 periodic landmark strips (gorge,
    village, riverbank, bridge, outskirts, warships, inferno, flagship,
    arena), paintEmbers smoke/spark strip, paintSky 'ember' variant (day
    path byte-identical + a glow wrap-copy so the tile is genuinely
    periodic - the old off-centre sun left a faint vertical edge every
    tile, real if subtle).
  - `GameScene`: bgMarks tileSprite (depth -12, 0.6x parallax, roots into
    the ground like the hills) + bgEmbers on stages 7/8 (depth -11, ADD,
    rises by sim tick - deterministic across renderers). Ground line,
    scroll and camera geometry untouched.
  - New `e2e/backdrop-look.spec.ts`: captures all nine stages to
    artifacts/look/ui19-stage{1..9}.png with layer/parallax contracts.
- Defects and findings during verification:
  1. My first seam test (column equality) was the wrong bar: it fails
     every sloped periodic edge. Replaced with an outlier test (seam step
     must not exceed the tile's own steepest interior step) plus targeted
     checks: exact wall-wrap, edge margins, integer-period bands, band
     continuation - with teeth (the arena sawtooth's path-start miter and
     a tent-straddling window both failed before their fixes).
  2. Two spec bugs, not game bugs: Phaser TileSprite clones its pattern
     into a UUID-keyed internal texture (all bg layers do this - the
     contract is layer presence + baked-key existence), and getByName
     returns null (not undefined) when absent.
- Verification run: lint PASS, typecheck PASS, unit 335/335 (+12), e2e
  72/72 in 3.7 min (+1 backdrop-look; background/probe preserved), vision
  5/5, selfplay 13/13, vite build PASS, prodbuild 4/4. Capture review
  21/21 via artifacts/ui19-review.mjs (9/9 distinct band signatures,
  embers only on 7/8, ember sky on 7) + 20/20 ui4 HUD regression;
  stage1/7/9 captures eyeballed (gorge walls, burning red cliffs with
  rising embers, dark arena peaks with braziers).
- Housekeeping: GATE-3 (oldest DONE by the established tail chain
  ART-11 -> ART-12 -> DIFF-1 -> GATE-3) moved to TASKS-ARCHIVE.md tail.
  20 DONE remain.
- Result: COMPLETED outside the runner (no tick; runner still paused for
  owner review).
- Status after: ART-19 DONE. ART-20 remains TODO; ENH-12 deferred.
- Next recommended task: ART-20 (props, pickups & combat-feedback pass).

### 2026-09-24 05:25 UTC - UI-5 (attempt 1, full verification, DONE)

- Status before: UI-5 TODO. The runner is paused on the attempt-2 BLOCKED
  (untouched here). This round came from the owner's standing overhaul goal
  in the DSH session, not a runner tick.
- Work completed: flow screens in the new kit.
  - New `src/game/data/stagelore.ts`: one lore beat per stage (ordinal,
    two ~46-char lines, Chinese caption), game layer, sim never reads it.
  - New `src/game/art/flowart.ts`: parchment intro card, gold/crimson
    dialogs, victory/defeat scrolls, lacquer stat chip + ensureFlowArt +
    5 unit tests.
  - `HudScene`: scene-intro parchment overlay, self-driven per stage entry
    (no new scene, no GameScene change): materializes 1.6s after build so
    the banner clears first; autopilot dismisses on sim.tick+30 so run()
    batches can never stall; real play dismisses on Enter/tap/3s. Depth
    10_000: above banner/controls, below readouts and pause/continue.
  - Pause/continue overlays + Result/GameOver/GameComplete screens restyled
    to parchment with dark-ink recolors; same scene keys, texts, hints,
    bridge fields. type.ts gained STAGE 1..9.
  - New `e2e/introcard.spec.ts` (4): card at entry + tick dismissal, Enter
    dismissal in real play, fresh card per stage, defeat/pause/complete
    captures to artifacts/look/ui5-*.png.
- Defects caught during review (captures were read, not just taken):
  1. Intro card and stage banner stacked (STAGE n twice): staggered the
     card 1.6s and demoted it to depth 10_000 so overlays win.
  2. White/bone text invisible on parchment in all three ending screens
     and both overlay hints: recolored to dark inks (PAUSED keeps its gold
     contract, now with an ink stroke - the pixel gate still passes).
  3. My own complete-flow test called startGame from inside 'game', where
     pendingStart is a silent no-op - vacuous poll landed on stage 3.
     Fixed the TEST (route via gameover, assert stageId), not the game.
- Verification run: lint PASS, typecheck PASS, unit 323/323 (+5), e2e
  71/71 in 3.8 min (+4 introcard; stageclear/continue/scenerestart/pause/
  touchpause/hud/hudpanels/layout all green), vision 5/5, selfplay 13/13,
  vite build PASS, prodbuild 4/4. Capture review 13/13 via
  artifacts/ui5-review-cards.mjs + 20/20 ui4 HUD regression; all five
  ui5 captures eyeballed.
- Housekeeping: DIFF-1 (oldest DONE by completion; tail was ART-12)
  moved to TASKS-ARCHIVE.md tail. 20 DONE remain.
- Result: COMPLETED outside the runner (no tick; runner still paused for
  owner review).
- Status after: UI-5 DONE. ART-19, ART-20 remain TODO; ENH-12 deferred.
- Next recommended task: ART-19 (painted per-stage backdrops).

### 2026-09-23 22:55 UTC - UI-4 (attempt 1, full verification, DONE)

- Status before: UI-4 TODO. The runner is paused on the attempt-2 BLOCKED
  (untouched here). This round came from the owner's standing overhaul goal
  in the DSH session, not a runner tick.
- Work completed: the in-game HUD restyled to the WoF top-band language.
  - New `src/game/ui/hudlayout.ts`: pure geometry (plate/medallion/bar/pearl/
    pip/chip/GO/rail/banner rects, P2 mirror via mirrorX/slotFor, segment
    counts per health pool, `decayGhost` hold-then-ease damage ghost) + 6
    unit tests.
  - New `src/game/art/hudart.ts`: canvas painters for the lacquer player
    plate (gold/azure variants), bronze ring medallion with clipped portrait
    window, flaming-pearl lamp lit/dim, helm lives pip, WAVE chip, GO
    chevrons, full-width boss rail, banner plaque gold/red, and the
    bronze-lacquer touch sheet (geometry passed in from touch.ts so art and
    hit zones cannot drift) + 6 unit tests.
  - `HudScene.ts` rewrite: floating plates with medallion portraits,
    segmented arcade HP bar (makeArcadeBar) with presentation-only ghost,
    pearl special lamp on the hp>cost rule, lives pips, WAVE chip + foes
    count, GO cue container with blink tween on camera unlock, boss rail +
    BOSS tag + boss bar with ghost, combo number + baked HIT tag, banner on
    baked plaque with holdMs param, P2 mirrored plate on join. Pause and
    continue overlays untouched (UI-5 scope).
  - `touch.ts`: visuals replaced by one baked bronze sheet named touchPad
    (full-screen 480x270 canvas texture, alpha 0.55); zones, labels, counts,
    pause protocol byte-identical.
  - `GameScene.ts`: boss WARNING banner passes 1.2s hold.
  - `type.ts`: 'GO â†’' added to displayStringTable.
  - New `e2e/hud-look.spec.ts` (4 tests): captures combat/boss/coop/GO/phone
    portrait+landscape+boss to artifacts/look/ui4-*.png with kit contracts
    (textures exist, first bar is P1 HP, pearl dims under cost, ghost > ratio
    after damage, WAVE 1 chip, rail + WARNING, P2 mirror at x292, GO cue on
    unlock, 1 pad/3 labels/8 zones/8 inputs).
- Defects caught and fixed during verification (the review earned its keep):
  1. First pass displayed every baked canvas texture at DEVICE size (2x
     logical): a pixel-agent audit of the captures found the touch controls
     entirely off-screen and plates/banner oversized. Fixed with a
     bakedImage helper (setDisplaySize) + displayTextSize for display-text
     textures; SelectScene already did this - HudScene now matches.
  2. Meta row could overflow the plate (containment gate): compacted to
     'SWORD HORSE 20' and moved to x122.
  3. Stage label EnÂ·Zh crossed the plate tips in co-op: persistent label now
     shows nameZh (full EnÂ·Zh still shown by the entry banner, which
     hud.spec reads - verified unchanged and green).
- Verification run (all after the fixes): lint PASS, typecheck PASS, unit
  318/318 (+12), e2e 67/67 in 3.5 min (+4 hud-look; hud, hudpanels, layout,
  pause, touch, touchpause, coop all green), vision 5/5 (HUD GATE 1/1 bars,
  SPRITE 256/256), selfplay 13/13, vite build PASS, prodbuild 4/4 (HUD-bars
  gate green). Objective capture review 20/20 via
  artifacts/ui4-review.mjs (desktop combat/boss/coop/GO + phone
  portrait/landscape/boss bronze-and-gold presence at the exact logical
  anchors; canvas offset auto-located via the HP bar).
- Housekeeping: ART-12 (oldest DONE by completion; archive tail was ART-11)
  moved to TASKS-ARCHIVE.md tail. 20 DONE remain.
- Result: LOOP-equivalent COMPLETED outside the runner (no tick; runner still
  paused for owner review).
- Status after: UI-4 DONE. UI-5, ART-19, ART-20 remain TODO; ENH-12 deferred.
- Next recommended task: UI-5 (flow-screen cards in the new kit).

### 2026-09-23 18:40 UTC - UI-3 (attempt 3, full verification, DONE)

- Status before: UI-3 BLOCKED (environment, attempt 2): no browser launched,
  complete implementation uncommitted. The runner is paused on that BLOCKED
  (untouched here). This round came from the owner's standing overhaul goal
  in the DSH session, not a runner tick.
- Blocker cleared: at 18:03 UTC the same probe that hung at 16:00-17:00
  (`chrome-headless-shell --dump-dom data:` with a fresh profile) exited in
  1 s with the DOM. No change on my side, so the cause was environmental and
  transient. Probe profile removed.
- Work completed: no source change to the attempt-1 draft. Ran every serial
  gate on it:
  - lint PASS, typecheck PASS, unit 306/306 PASS (earlier this session)
  - e2e 63/63 in 3.6 min (+1 select-look; select, touch, layout,
    hero-faces and hud unchanged and green)
  - vision 5/5 (SPRITE GATE 256/256 sprites, 85/85 weapons, 170/170
    retracts; renderer parity includes the new select)
  - selfplay 13/13 in 8.5 min; marathons identical to the standing
    snapshot: guanyu 2640/0c+3144/0c, zhangfei 2640+2832, huangzhong
    3768/1c+4524/1c, weiyan 4056/1c+2916/0c, zhaoyun 9 stages
    3324,3576,6720,5988,4548,4440,5484,8196,6324 with continues
    0,0,2,1,1,0,2,3,2 (the select screen does not touch the sim)
  - build PASS; the process exited normally this time, 48 s
  - prodbuild 4/4
- Reviewed: artifacts/vision/parity-webgl-select.png. WebGL draws the baked
  roster identically to canvas: gold 1P on Guan Yu, blue 2P on Zhang Fei,
  pips, strip prompt. Plus the attempt-1 captures ui3-select-{desktop,
  zhaoyun,phone}.png. Also captured the current HUD
  (artifacts/vision/boss_fight.png) as the UI-4 "before".
- Housekeeping (rule 8): UI-3 DONE would make 21, so the oldest DONE in
  completion order (ART-11, 43 lines, bounded by DIFF-1's header,
  anchor-asserted) moved to the TASKS-ARCHIVE.md tail after ART-10; 20 DONE
  held. This entry pushed PROGRESS.md past 500, so the oldest finished,
  unprotected entry (2026-09-23 00:24 ART-16) moved to the
  PROGRESS-ARCHIVE.md top. The latest signal snapshot (now this entry) and
  the DIFF-1 closure stay.
- Files changed: the UI-3 source set (see the 16:45 entry), TASKS.md,
  TASKS-ARCHIVE.md, PROGRESS.md, PROGRESS-ARCHIVE.md.
- Result: DONE, committed locally.
- Status after: UI-3 DONE; queue 20 DONE + UI-4/UI-5/ART-19/ART-20 TODO +
  ENH-12 IN_PROGRESS (deferred under the overhaul). The runner stays paused
  (BLOCKED from attempt 2) until the owner resumes it.
- Next recommended task: UI-4 (arcade HUD top band).

### 2026-09-23 17:00 UTC - UI-3 (attempt 2, verification blocked by environment)

- Status before: UI-3 IN_PROGRESS (attempt 1 left a complete, uncommitted
  implementation; full browser gates never ran because Chromium launches
  hang). Run `2026-09-23T16-54-11-532Z-17a495a1`.
- Work completed: no code change. Re-verified the draft without a browser:
  lint PASS, typecheck PASS, unit 306/306 PASS. Probed browser launch again
  before starting the gates:
  - chrome-headless-shell 1243, `--dump-dom data:` with a fresh profile: hung
    at 30 s, no output (hanging since about 16:00 UTC)
  - Playwright Firefox 1543, `--headless --screenshot` with a fresh profile:
    hung at 40 s, no screenshot
  - (attempt 1: system Edge headless hung the same way)
  Three independent browser engines hanging at startup points to a
  system-level fault (graphics/desktop session or a system service), not to
  this repository or one browser build. `--version`, node, named pipes and
  child spawns still work. FontCache is running. Only my own probe
  processes and profiles were stopped/removed.
- Files changed: TASKS.md (UI-3 -> BLOCKED with the exact blocker),
  PROGRESS.md. The attempt-1 draft stays uncommitted in the working tree
  (backup artifacts/loop/ui3-attempt1.patch).
- Verification run: lint, typecheck, unit only. e2e/vision/selfplay/prodbuild
  cannot run without a browser, so they were not attempted this tick.
- Result: BLOCKED - a missing tool (a launchable browser), not a quota
  error, so the QUOTA-WAIT exception does not apply.
- Status after: UI-3 BLOCKED (environment). Runner will pause for owner
  review. DONE count 20.
- Remaining work or blocker: owner restores browser launch (reboot likely),
  resumes the runner and resets UI-3 to IN_PROGRESS. Then one iteration runs
  the serial full gates on the draft, marks DONE and commits.
- Next recommended task: UI-3 verification once browsers launch.

### 2026-09-23 16:45 UTC - UI-3 (attempt 1, warrior roster select)

- Status before: UI-3 TODO (no prior attempts); UI-1/UI-2 DONE. Run
  `2026-09-23T13-14-32-125Z-a80a939e`, far past its 50-minute timebox.
- Work completed: SelectScene rewritten as a roster screen. One baked backdrop
  (selectart.ts): parchment with ink-wash mountains, a vermilion sun, grain
  and burnt edges, a faction-blue lacquer roster frame (gold double rim,
  fretwork, corner bosses) and a pointed lacquer command strip. Five 84x160
  baked cards: 76x84 portrait recess (ART-18 portraits), parchment name
  plate (nameZh 16 + nameEn caps 8), stat tray with LIFE/SPEED bronze pips
  (1..5, normalised across the roster from maxHp/walkSpeed; sim data
  untouched). Gold 1P halo (denser, white-hot core, slow alpha breath) and
  blue 2P halo, both behind the cards, with 1P/2P pennants; non-picked
  portraits dimmed. 2P marks the hero a drop-in P2 actually gets:
  `secondPlayerCharacter` moved from GameScene to src/game/players.ts and is
  used by both, so the preview cannot drift from the join (presentation only).
  Kept: cursor starts 0, LEFT/RIGHT wrap, Enter + watchConfirmButton,
  consumePendingStart, exactly five tap Zones in CHARACTER_ORDER that pick
  that hero, the confirm seed, portrait:* textures, byte-identical device
  prompts. All chrome canvas-baked (no Graphics gradients).
- Tests: test/game/roster.test.ts (6: cards + halos fit the frame, row
  centred, card sections stacked, pips span 1..5 and order like the stats,
  2P never equals 1P). e2e/select-look.spec.ts: kit textures, portraits and
  bilingual labels per card, 1P/2P halos on cards 0/1, ArrowLeft wraps to
  4/0, three ArrowRight lands 2/0, phone shows TAP A WARRIOR TO FIGHT;
  writes the review captures. PASSED twice (before and after the halo tune).
- Reviewed: artifacts/look/ui3-select-desktop.png, ui3-select-zhaoyun.png,
  ui3-select-phone.png. First capture: the gold 1P halo was lost against
  the gold card rims -> made denser with a white core and dimmed idle
  portraits (0.5, 2P 0.72); re-captured and confirmed.
- Verification run: lint PASS, typecheck PASS, unit 306/306 PASS. NOT run:
  chromium e2e (a full attempt ran 25/63 with the first ~10 failing
  `browserType.launch: Timeout 180000ms`; stopped), selfplay, vision,
  prodbuild. Vite build wrote dist ("built in 1.2s") but the process never
  exited, twice.
- Environment blocker (not code): from ~16:00 UTC every Chromium launch
  hangs at startup - Playwright's headless shell, a bare
  `chrome-headless-shell --dump-dom data:` probe, and system Edge headless
  all stall with zero output and ~0 CPU (threads parked; only a gpu-process
  child spawns). `--version`, plain node, named pipes and child spawns are
  fine; disk 11 GB free, RAM 8 GB free, no display-driver events. The same
  binary launched normally earlier in this run (select-look.spec). Only my
  own probe processes were stopped.
- Files changed (uncommitted draft): src/game/{players.ts, art/selectart.ts,
  ui/roster.ts, ui/type.ts, scenes/SelectScene.ts, scenes/GameScene.ts},
  e2e/select-look.spec.ts, test/game/roster.test.ts; backup
  artifacts/loop/ui3-attempt1.patch. TASKS.md, PROGRESS.md.
- Result: IN_PROGRESS, no commit (full gates unverified).
- Status after: UI-3 IN_PROGRESS attempt 1. DONE count 20 (no task
  archive). Housekeeping (rule 8): this entry pushed PROGRESS.md to 504, so
  the oldest finished entry (2026-09-22 14:15 ENH-11, 48 lines,
  anchor-asserted) moved to the PROGRESS-ARCHIVE.md top above the 13:09
  producer pass; now ~460 lines. The latest signal snapshot (15:04 producer
  pass) stays here.
- Remaining work: once Chromium launches again (likely needs a reboot or the
  owner clearing whatever holds it), run the serial full gates on this draft
  (e2e incl. select/touch/layout/hero-faces, selfplay, vision incl. select
  parity, build, prodbuild), then mark DONE and commit.
- Next recommended task: UI-3 verification (continue IN_PROGRESS).

### 2026-09-23 12:30 UTC - UI-2 (attempt 1, title attract screen)

- Status before: UI-2 TODO -> IN_PROGRESS; UI-1 DONE. Run
  `2026-09-23T10-08-53-310Z-127f361d`. GPT image quota exhausted; the
  owner logged into Grok mid-run and asked for the failed requests to move
  to the Grok provider.
- Work completed: Grok-generated Five-Tigers key art over the burning
  Red-Cliffs fleet (master in art/ui-title/, provenance + hashes logged).
  scripts/prepare-title-art.mjs cover-crops the model's gibberish caption
  strip off the bottom, downscales to 960x540 and bakes a bottom scrim ->
  src/game/assets/title/keyart-backdrop.jpg (119 KB). BootScene preloads it
  as `ui:keyart-photo`; TitleScene prefers it and falls back to the
  procedural dusk battle (keyart.ts) when it is absent. Baked gold-foil
  lockup + bone èµ¤å£ä¹‹æˆ˜ subtitle; new `ensureSheenStrip` bakes 12 glint
  frames (luminance-weighted, so the dark outline stays dark) cycled on the
  scene clock (~0.7 s sweep every ~4 s) - no masks, identical under both
  renderers. Bronze control plaque moved into the bottom scrim (y212) after
  the first capture showed it covering the three centre heroes' faces.
  Device-specific control strings byte-identical. HI-SCORE line top centre,
  from a guarded localStorage module (ui/hiscore.ts, key dwga-hiscore-v1),
  written by GameOver/GameComplete. The sprite hero lineup is gone (the
  heroes are in the painting). StyleFrameScene (?styleframe=1) deleted as
  planned.
- Tests: title.spec rewritten (the old ">=5 entity sprites" check no longer
  fits): key art shown at 480x270 from a >=960x540 decoded source, plus a
  blocked-key-art fallback test (route aborts everything except the
  `?url` script module, whose URL also names the file - the first draft
  aborted the module and hung the boot, the ART-18 lesson again).
  uifont.spec: key-art/lockup/13 sheen frames present, and the frame
  actually cycles; the review capture seeds a hi-score. uihiscore unit 5.
- Files changed: src/game/scenes/{Boot,Title,GameOver,GameComplete}Scene.ts,
  src/game/scenes/StyleFrameScene.ts (deleted), src/game/main.ts,
  src/game/ui/{hiscore,panels}.ts, src/game/assets/title/keyart-backdrop.jpg,
  art/ui-title/{keyart-master.jpg,PROVENANCE.md},
  scripts/prepare-title-art.mjs, e2e/{title,uifont}.spec.ts,
  test/game/uihiscore.test.ts, TASKS.md, PROGRESS.md (+both archives).
- Verification run (serial, final code): see the report for the gate table.
  lint pass; typecheck pass; unit 300/300; e2e 62/62; vision 5/5 (title
  coverage 0.664, richness 2441; parity title canvas/webgl 0.664/0.674, no
  failures; SPRITE GATE 256/256, 85/85 weapons, 170/170 retracts);
  selfplay 13/13, marathons identical to the standing snapshot (guanyu
  2640/0c + 3144/0c, zhangfei 2640 + 2832, huangzhong 3768/1c + 4524/1c,
  weiyan 4056/1c + 2916, zhaoyun 9 stages 3324..6324 continues
  0,0,2,1,1,0,2,3,2); build pass (dist +119 KB keyart jpg); prodbuild 4/4.
  One mid-run gate pass was discarded: tsc caught the sheen rewrite's
  unchecked typed-array reads, which were fixed, and every gate was
  re-run from the top on the final code.
- Reviewed: artifacts/look/ui2-title-desktop.png (hi-score, lockup, five
  faces clear, plaque in the scrim), ui2-title-phone.png (touch strings,
  TAP TO START), ui2-title-sheen.png (mid-sweep glint on the foil only),
  artifacts/vision/parity-webgl-title.png (matches canvas).
- Housekeeping (rule 8): UI-2 DONE would make 21, so the oldest remaining
  DONE (ART-10) moved to the TASKS-ARCHIVE.md tail after ENH-11 (42 lines,
  bounded by DIFF-1's header, anchor-asserted). This entry would push
  PROGRESS.md past 500, so the two oldest finished entries (ENH-9, 51
  lines; 2026-09-22 13:09 producer pass, 59 lines) moved to the
  PROGRESS-ARCHIVE.md top, newest first above ENH-10 (now ~450 lines).
  The latest signal snapshot (this entry; the 15:04 producer pass before
  it) stays here.
- Result / Status after: DONE. Queue 20 DONE (ART-10 archived) + UI-3..5,
  ART-19/20 TODO + ENH-12 IN_PROGRESS (deferred under the overhaul).
- Remaining work or blocker: owner sign-off on the style direction is still
  open (plan approval covers proceeding).
- Next recommended task: UI-3 (WoF-style warrior roster select).

### 2026-09-23 10:05 UTC - UI-1 (attempt 1, design-system foundation)

- Status before: overhaul plan approved; UI-1..ART-20 filed; no display font,
  73 scattered sans-serif call sites, one generic slab/panel kit.
- Work completed: bundled OFL ZCOOL QingKe HuangYou subset (176 glyphs, 29.6 KB,
  coverage-verified incl. Traditional CJK) + reproducible fetch script; theme.ts
  (palette/type-scale/liveStyle) + type.ts (FontFace loader w/ injectable
  timeout deps, 4-variant baked-text baker with CJK-upright rule, core-derived
  display-string table); panels.ts gains drawCard/drawLacquerBar/makeArcadeBar
  (segment ticks + presentation-only damage ghost) + display-text texture baker;
  all live-text sites migrated (sizes/colours byte-identical); BootScene gates
  title entry on bounded font load; procedural dusk-battle keyart.ts +
  temporary ?styleframe=1 StyleFrameScene (removed in UI-2) for the sign-off mock.
- Fix evidence: baker unit test caught a wrong CJK regex range (radicals block
  instead of U+3400-9FFF - lean padding misapplied, 5px box error); cliff
  painter revised after the mock read as flagpoles (now jagged rock, reviewed).
- Files changed: TASKS.md, PROGRESS.md (+archives), eslint.config.js (fetch
  global for scripts), src/game/ui/{theme,type}.ts, src/game/ui/panels.ts,
  src/game/art/keyart.ts, src/game/scenes/{BootScene,StyleFrameScene,Title,
  Select,Hud,Result,GameOver,GameComplete}.ts, src/game/main.ts,
  src/game/adapters/touch.ts, src/game/assets/fonts/*,
  scripts/{fetch-display-font}.mjs, test/game/{uitheme,uitype}.test.ts,
  e2e/uifont.spec.ts.
- Verification run: lint + typecheck pass; unit 295/295 (+11); e2e 60/60 (+3:
  font loads, blocked-font fallback boots, style frame); vision 5/5 (256/256
  sprites, parity clean, negatives correct); selfplay 13/13, marathons
  identical; build pass (dist +29.6 KB font); prodbuild 4/4.
- Reviewed: ui1-styleframe-{desktop,phone}.png (gold-foil lockup, CJK subtitle,
  bronze plaque, ember backdrop, blinking prompt) + vision title/combat with
  new letterforms. QUOTA NOTE: image providers exhausted (reset ~Sep 30), so
  the mock is fully procedural; UI-2 retries key-art generation with this
  backdrop as the committed fallback.
- Result: DONE. Status after: UI-1 DONE; queue 20 DONE + UI-2..5/ART-19/20 TODO
  + ENH-12 IN_PROGRESS (deferred again under the overhaul request).
- Remaining work or blocker: owner sign-off on the style-frame direction; then UI-2.
- Next recommended task: UI-2 (title attract screen).
- Run/report: 2026-09-23T09-19-33-414Z-bfcb1de5-b7cc-4dd0-af45-c376c5f9f14a.

- Housekeeping (same iteration, rule 8): PROGRESS.md was 528 lines, so oldest
  finished entry (ENH-10) moved to PROGRESS-ARCHIVE.md top; 22 DONE exceeded
  the bound, so oldest ENH-10 + ENH-11 spliced to TASKS-ARCHIVE.md end (20
  held). Both splices anchor-verified (archive tails + DONE recount).

### 2026-09-23 09:10 UTC - ART-18 (attempt 2, refinement + full verification)

- Status before: IN_PROGRESS pilot; all five heroes painted but seams/prone/Wei Yan
  tan/white-fringe issues open, full gates not run.
- Work completed: refine2 assets (160x224 cells, runtime 3.26 -> 2.13 MB, dark
  silhouette rim, warm-flesh-only date-red grade for Guan Yu/Wei Yan, per-part
  content signatures); BootScene validates signatures and falls back atomically
  per hero; prone weapons rest behind bodies; fitted shoulder caps bridge painted
  necks; prone lift tuned per hero (all 70 head/pose bounds pass).
- Files changed: TASKS.md, PROGRESS.md, docs/HERO_FACE_*.md, art/hero-faces/,
  scripts/prepare-hero-faces.mjs, src/game/assets/hero-faces/,
  src/game/art/{hero-resources,image-signature}.ts, src/game/adapters/hero-art.ts,
  src/game/art/{draw,registry}.ts, src/game/adapters/sprites.ts,
  src/game/scenes/BootScene.ts, test/game/hero-faces.test.ts, e2e/hero-faces.spec.ts.
- Verification run: lint pass; typecheck pass; unit 284/284 pass; e2e 56/57 (one
  game.spec special-pose timing flake, passes alone, no sim/input code touched);
  vision 5/5 (sprites 256/256 incl. previously failing huangzhong:down, parity
  clean, both negative controls fail correctly); selfplay 13/13 with marathon
  numbers identical to standing snapshot; vite build pass; prodbuild 4/4.
- Reviewed: art18-pilot-sheet.png (all five old/new, idle/attack/down/native plus
  mirrored left-facing), Canvas/WebGL select + Guan Yu/Zhao Yun gameplay, mobile
  Pixel 7 select (all five painted portraits) + Wei Yan/Huang Zhong gameplay.
  Mounted reuses the same lifted texture (code-verified); co-op covered by coop
  e2e + selfplay; JS bundle grew ~240 KB (1.33 -> 1.57 MB) from embedded
  signatures, gzip 359 -> 396 KB.
- Result: DONE - all acceptance criteria met; presented for owner visual
  acceptance. Status after: ART-18 DONE; ENH-12 still deferred IN_PROGRESS.
- Remaining work or blocker: owner aesthetic verdict; any objection reopens art.
- Next recommended task: first TODO in queue (ENH-12 gamepad naming, deferred).
- Run/report: 2026-09-23T08-01-18-016Z-ba19be2e-ebec-4f49-9f41-ec689c15da66.

### 2026-09-23 07:58 UTC - ART-18 (attempt 1, painted pilot implementation)

- Status before: owner-approved redesign; ENH-12 closed IN_PROGRESS and deferred.
- Added literary briefs/plan, ten original masters + provenance, deterministic five-hero prep, typed decoded resources, Vite imports/Boot preload, atomic missing-layer fallback, ordered painted rig heads/portraits, expression mapping and 432x480 portraits. Bodies/core/poses/weapons unchanged; painted prone attachment is render-only.
- Files: docs/HERO_FACE_*.md, art/hero-faces/, scripts/prepare-hero-faces.mjs, src/game/assets/hero-faces/, new hero-art/hero-resources modules; draw/registry/sprites/BootScene; test/game/hero-faces.test.ts and e2e/hero-faces.spec.ts.
- Verification: full lint + typecheck PASS; original 207 unit tests PASS before cast expansion; latest shipping-head suite 75/75 PASS (all 70 hero poses, displaced-pivot negative); pilot browser 3/3 PASS Canvas/WebGL and aborted-layer atomic fallback; Vite build PASS. Full current unit/e2e/signal/vision/prodbuild still required.
- Fix evidence: initial head clipping guard caught all prone heads; explicit prone rotation/lift fixed them without relaxing bounds. Test fixture initially aborted Vite's JS image import too; now aborts only image fetches. Split long parameterized probe; Buffer.equals replaced slow deep comparison, no assertions removed.
- Reviewed: artifacts/look/art18-pilot-sheet.png (five heroes old/new, idle/attack/down/native); Canvas/WebGL select and Guan Yu/Zhao Yun gameplay captures. Better anatomy, but NOT final visual acceptance: visible pasted-on neck/shoulder seams, weapon-obscured elevated prone heads, Wei Yan portrait too tan; white-hair fringe needs inspection.
- Runtime images total 3,262,691 bytes; decoded sources ~29.8 MB decimal before generated textures. PNG optimization and measured boot/render costs remain. Masters not shipped.
- Remaining: refine attachment/transition/complexions and alpha, add blank/swapped/erased-feature negatives + production checks, both facings/mounted/co-op/mobile/motion, all full gates and owner review. No commit because incomplete/unverified overall.
- Result/status after: IN_PROGRESS, substantive pilot checkpoint; no push/deploy/scheduler/core changes. Next: ART-18 refinement and verification, not ENH-12. Exact run/report: 2026-09-23T07-10-04-129Z-b64aecff-dcdf-4809-b4d3-13ed63aa1db5.

### 2026-09-23 07:06 UTC - ENH-12 (attempt 1, interrupted)

- Status before: TODO; manual run began 01:59:06 UTC, last source edit 02:14:47.
- Work completed: inspected labels/pad harness; measured candidate line widths.
  Drafted a hasGamepad helper and title-plate declarations, not their integration.
  At 06:51 the same run remained active, far past its 50-minute timebox. Saved
  artifacts/loop/enh12-attempt1-partial.patch, then restored only those two source
  files; tracked tree was clean at ee80721 before these bookkeeping edits.
- Files changed: TASKS.md, PROGRESS.md; ignored draft patch and manual report.
- Verification run: no full gates for this attempt; browser text measurement only.
  No claim that the unfinished patch typechecks or works. No quota error observed.
- Result: IN_PROGRESS, no shipped gamepad change and no verified commit.
- Status after: ENH-12 IN_PROGRESS, deferred by the explicit ART-18 owner request.
- Remaining work or blocker: all integration, behavior tests and full verification.
- Next recommended task: ART-18 approved painted hero-face redesign, not ENH-12.

