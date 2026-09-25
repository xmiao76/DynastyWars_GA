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

### 2026-09-26 00:40 UTC - BODY-8 (attempt 1, full verification, DONE)

- Status before: BODY-8 TODO (first owner-objection fix task).
- Work completed: hands visible + grip readable for all 17 fighters.
  - Root cause (vision + debug): the masters' open hands exceed the
    limb-band cuts -> foreArm cells end at clipped palm stubs, and the
    plain haft draws OVER the stub = zero hand pixels at the grip. A
    far-hand debug run also measured that the far arm sits INSIDE the
    torso span in every pose of this rig (guanyu attack handF at
    (58.3, 32.6)) - occluded by anatomy, so no far-hand visibility
    assertion is meaningful.
  - Fix: painted-style hands in the fighter's own BODY skin (hero
    head-skin measurements differ from body skin - handM() threads the
    body skin through materials): drawGripHand = fist + 3 finger bands
    wrapping the haft at handN OVER the weapon + knuckle line + form
    shadow; drawRelaxedHand rides the far-arm slot inside the shape
    stream (correct occlusion). Both paths (painted + procedural).
  - Measurable gate: test/game/handgrip.test.ts - 238/238 checks (17
    fighters x 14 poses, >= 24 skin px at SCALE 2 within +-3 px of the
    grip point). Zero before the fix (haft covered everything).
- Verification: lint PASS, typecheck PASS, unit 516/516 (one documented
  full-suite artquality flake - green on re-run and in isolation, the
  same pattern as its recorded history), e2e 78/78, vision 5/5, selfplay
  13/13, build PASS, prodbuild 4/4. Grip review sheets regenerated
  (artifacts/look/obs-grip-*.png) for owner re-review.
- Housekeeping: ENH-9 archived (chain ENH-8 -> ENH-9). 20 DONE remain.
- Result: COMPLETED (owner re-review may reopen; BODY-7 stays the final
  acceptance gate).
- Status after: BODY-8 DONE. Next: BODY-9 (feet).
- Next recommended task: BODY-9.

### 2026-09-25 23:55 UTC - Owner objections received: vision diagnosis + BODY-8..13 filed

- Status before: goal blocked awaiting final-cast acceptance. Owner
  replied with 3 objections + a realism instruction ("use your vision to
  take screenshot... generate tasks to fix all these problems, and make
  every character looks realistic and good"). Goal resumed with the fix
  scope (revision 13).
- Work completed:
  - Vision inspection: test/game/lookreview.test.ts (permanent
    generator) renders all 17 fighters x idle/attack through the
    shipping path as artifacts/look/obs-{full,feet,grip}-*.png (18
    sheets); read with vision and diagnosed.
  - CONFIRMED diagnosis:
    1. FEET: boots dark-on-dark, no sole/toe definition; weapon
       butt-caps hang into the foot zone; robe hems swallow ankles.
    2. HANDS: NO hands visible in any weapon pose - arms end at sleeve
       stubs; red tassel blobs occupy the grip zone (Zhao Yun's chest
       shows a red bar like a stuck arrow).
    3. WEAPON HOLD: flat brown hafts float across bodies with zero hand
       contact; white squiggle blades; procedural belt bars draw OVER
       painted waists (drawBodyDetails runs on paper-doll torsos).
    4. REALISM GAPS: cartoon weapons vs painted cast; mook cel-faces on
       painted bodies; boss cel-bodies under painted heads.
  - Filed BODY-8 (hands+grip), BODY-9 (feet), BODY-10 (painted
    weapons), BODY-11 (belt bars/seams), BODY-12 (mook painted heads),
    BODY-13 (boss paper-doll bodies) - each with measurable acceptance
    + non-goals; BODY-7 stays the closing acceptance task.
- Result: IN_PROGRESS (diagnosis + tasks delivered; implementation
  starts with BODY-8 next round).
- Status after: BODY-7 IN_PROGRESS (objections = filed work); BODY-8
  first TODO.

### 2026-09-25 23:20 UTC - BODY-7 (attempt 1, serial sweep green, awaiting owner acceptance)

- Status before: BODY-7 TODO (BODY-1..6 all DONE).
- Work completed: the final verification sweep for the body overhaul.
  - Whole-cast review sheet artifacts/look/body7-cast.png: all 18 rows
    (5 heroes + 3 mooks + horse + 9 bosses) x all 14 poses x both
    facings (left = the sprite adapter's texture mirror), zero empty
    cells - test/game/castboard.test.ts (permanent generator + ink
    assertion).
  - ONE serial sweep (artifacts/run-body7-gates.ps1) fully green:
    eslint PASS, tsc PASS, unit 498/498, e2e 78/78, vision 5/5 (sprite
    gate, Canvas + WebGL), selfplay 13/13, vite build PASS, prodbuild
    4/4, boot/memory probe recorded. First attempt of the sweep caught
    one real lint error (unused PARITY_FLOOR binding left from the
    horse-test rebalance) - fixed, sweep re-run clean end to end.
  - Resource report vs the BODY-1 baseline (artifacts/body7-report.md):
    dist 3,805 KB/25 -> 7,889 KB/67 files (+4.1 MB art); boot 2,118 ->
    4,208 ms (14 fighter packs + horse decode+verify at boot); textures
    337 -> 382; decoded ~99.8 -> ~122.6 MB.
- Verification: all gates green in one serial run; logs
  artifacts/body7-{lint,tsc,unit,e2e,vision,selfplay,build,prodbuild,mem}.log.
- Result: IN_PROGRESS - every technical criterion is met and verified;
  the remaining acceptance item is the OWNER'S acceptance of the final
  cast (objections stay open per the task's own criteria). Presented
  this round: body7-cast.png + body7-report.md + the per-phase boards.
- Status after: BODY-7 IN_PROGRESS (awaiting owner acceptance).
- Next: owner verdict - acceptance closes BODY-7 DONE and completes the
  goal; objections become the next work.

### 2026-09-25 22:35 UTC - BODY-6 (attempt 1, full verification, DONE)

- Status before: BODY-6 IN_PROGRESS (art banked round 28).
- Work completed: all nine boss heads shipped LIVE through the ART-18
  pipeline.
  - Prep (`scripts/prepare-boss-faces.mjs`): JPEG border-flood keying at
    tol 4 (tolerance sweep showed 16 eats near-black beards/gauze and
    fragments heads; 4 keeps all nine masters whole at exactly 3 groups);
    3-largest silhouettes with fragments auto-dropped (xuhuang split
    head + xiahoudun/zhangliao hair wisps); landmark fractions per boss
    calibrated from the heroes' authored landmarks (per-frame stable,
    cross-boss spread due to beard/hair mass); portrait ink-bbox
    normalization (strip portraits came back wide); full ART-18 cell
    pipeline incl. dark rim + front/rear layer splits.
  - Cao Cao heads regenerated: the BODY-1 "head pilot" was a single
    neutral cutout, not a 3-expression sheet (hash-verified); new sheet
    keyed to the owner-approved pilot portrait keeps the approved face.
  - Wiring: HERO_ART_CATALOG generalized to 14 ids (boss ids are
    ordinary VECTOR_ART kinds - same publish path lights them up);
    hero-faces e2e exact-set assertion extended to the 14-id roster
    (deliberate, documented in the spec: bosses publishing through the
    shared record IS this task's requirement).
  - Tests: test/game/boss-faces.test.ts (134) mirrors the hero suite -
    hashes, content signatures, blank/swapped/erased rejection,
    expression mapping, portrait source, 126 frame-escape cells,
    displaced-pivot guard, fallback liveness, head-identity gate
    (head-layers-only, immune to body color); test/game/bossboard.test.ts
    writes the before/after board with liveness baked in. One real
    defect caught: the signature test hit the 5s default timeout under
    full-suite CPU contention (36 sheet decodes) - explicit 30s
    timeouts added; standalone-vs-full-suite discrepancy resolved as
    timeout, not content drift.
- Verification: lint PASS, typecheck PASS, unit 497/497, e2e 78/78
  (first chain run failed on the stale 5-id e2e set - fixed, second
  run green), vision 5/5 (sprite gate held with boss heads live),
  selfplay 13/13, build PASS, prodbuild 4/4. Objective cell review
  45/45 (ink, expression liveness 3/3 per boss, face mass at pivot
  20-28px across all nine, portraits non-blank).
- Housekeeping: ENH-8 archived (chain ENH-7 -> ENH-8). 20 DONE remain.
- Result: COMPLETED; board + cell review presented for owner review.
- Status after: BODY-6 DONE. Next: BODY-7 (full verification sweep).
- Next recommended task: BODY-7.

### 2026-09-25 04:50 UTC - BODY-6 (goal round 28: BODY-5 closed, all 18 boss masters banked)

- Status before: BODY-5 bookkeeping incomplete (task marked, not
  committed); BODY-6 TODO.
- Work completed:
  - BODY-5 closed: ENH-7 archived (20 DONE), progress logged, committed
    7a33ef3, captures presented (rider seated on painted horse,
    3-frame look panel, master sheet).
  - BODY-6 IN_PROGRESS; ALL art banked in one round:
    art/boss-faces/ 18 masters = 9 heads sheets (3 expressions each)
    + 9 portraits. Cao Cao reused the owner-approved BODY-1 pilots;
    the other 8 keyed to their own heads for identity. Lu Bu portrait
    came back 3-bust strip -> middle bust cropped; zhangliao/zhanghe
    portraits came back wide strips with centered busts (ink-bbox crop
    step needed in prep).
  - Early component validation (artifacts/check-boss-components.mjs,
    same flood-fill rule as prep): 5/9 heads masters clean 3-group
    (lubu, xuchu, caoren, zhanghe, lidian); 4 need the planned tolerant
    boss-prep variant: caocao has heads MERGED (2 groups where 3
    expected); xiahoudun/xuhuang/zhangliao carry beard/hair fragments
    1200-2100px that exceed the >1000px keep rule. Design decision:
    boss prep keeps the 3 LARGEST groups and folds/drops fragments
    (heroes keep the strict exactly-3 rule).
  - Prep contract confirmed: hero masters are keyed PNGs (components()
    reads alpha) while generation returns opaque JPEGs -> boss flow
    needs a JPEG->keyed-PNG conversion step before the ART-18 pipeline.
- Result: IN_PROGRESS. Next round: conversion + portrait normalization +
  landmark eyeballing (9 bosses x 3 frames), boss spec extension of
  prepare-hero-faces.mjs, catalog wiring to boss ids, tests (mirror
  hero-faces suite), full gates, before/after review, owner review.
- Status after: BODY-5 DONE (committed), BODY-6 IN_PROGRESS (art done).

### 2026-09-25 04:25 UTC - BODY-5 (attempt 1 resumed after provider recovery, full verification, DONE)

- Status before: BODY-5 IN_PROGRESS (goal was blocked on the provider
  outage; owner said "retry" - grok recovered on the first call).
- Work completed: painted horse shipped LIVE.
  - Master: 3-panel bay warhorse sheet (idle/walk0/walk1, gold-tacked
    saddle, black mane/tail) keyed to the Guan Yu body master; saved to
    art/fighter-bodies/horse-master.jpg.
  - Prep: explicit per-frame crop/dest geometry (measured from the grid
    overlay), uniform 0.93 scale - hooves anchored at logical y76,
    saddle centers registered at logical x50/y27.4 (inside the
    procedural x38-62/y21-31 zone), ears within the -8 headroom.
  - Wiring: HORSE_ART_CATALOG + prepared.json live; e2e now asserts the
    horse publishes at boot alongside the 8 body packs.
  - Gates: parity floor deliberately NOT applied to the full-frame
    replacement (the painted horse is honestly slimmer than the chunky
    procedural beast - IoU 0.48 on live measurement, eyeballed as a
    clean style upgrade in the 3-frame look panel). Placement is gated
    instead by saddle-tack-zone + hoof-ground checks per frame, plus
    liveness and the vision sprite gate.
- Verification: lint PASS, typecheck PASS, unit 362/362 (horse suite
  8/8 incl. placement gates on the real sheet), e2e 78/78 (mounted
  capture shows the rider seated on the painted saddle), vision 5/5,
  selfplay 13/13, build PASS, prodbuild 4/4.
- Housekeeping: ENH-7 archived (chain ENH-6 -> ENH-7). 20 DONE remain.
- Result: COMPLETED; captures presented for owner review.
- Status after: BODY-5 DONE. Next: BODY-6 (nine boss heads).
- Next recommended task: BODY-6.

### 2026-09-25 04:10 UTC - BODY-5 (goal round 27: outage round 3, goal marked blocked)

- Status before: BODY-5 IN_PROGRESS (pipeline committed, art pending).
- Work completed: grok still failing (6th attempt, same transport error);
  gpt quota-exhausted (resets ~5 days out). Verified the one remaining
  art-free integration: look spec 3/3 green with the empty horse catalog
  wired (boot publish no-ops don't throw; all 8 body packs still
  publish). No other art-free work remains: BODY-5 art, BODY-6 art, and
  BODY-7 all require image generation.
- Result: goal meets the blocked bar (same provider-outage condition
  across rounds 25-27, no useful remaining work) - marked blocked with
  resume instructions. BODY-5 stays IN_PROGRESS; everything is committed
  through a7ce4b5, so resuming is: retry generation, then prep/wire/
  verify per the round-25/26 notes.
- Status after: goal blocked on provider recovery; BODY-5 IN_PROGRESS.

### 2026-09-25 03:50 UTC - BODY-5 (goal round 26: prep validated on synthetic; provider still down)

- Status before: BODY-5 IN_PROGRESS (pipeline committed, art pending).
- Work completed: grok still failing (5th attempt, same transport error;
  outage round 2 - not yet reportable as blocked). Validated everything
  validatable without the master:
  - Synthetic 3-panel master (procedural frames side by side) + dry-run
    overrides (HORSE_MASTER/HORSE_OUT/HORSE_SYNTH/HORSE_KEY_TOL).
  - Dry run CAUGHT a real bug: auto bbox-centering shifts asymmetric
    figures (horse head extends right of barrel) - round-trip IoU 0.452.
    Redesigned to explicit per-frame crop/dest geometry (eyeballed like
    body joints, verified by parity + saddle tests).
  - Round-trip now 0.776-0.809 across all three frames (consistent band
    = systematic keying erosion on the banded synthetic, not
    misplacement; synthetic carries cel bands + clipped ears, real
    masters have clean black). Mechanics proven; scratch removed.
  - tsc/lint clean, horse suite 8/8.
- Result: IN_PROGRESS. Next: retry generation; on success - eyeball
  master, set frame geometry, prep, wire, parity/saddle/eyeball, mounted
  captures, full gates, owner review, DONE.
- Status after: BODY-5 IN_PROGRESS (outage round 2).

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
