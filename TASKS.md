# Work Queue

Statuses: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`.

The loop processes tasks from top to bottom and works on only one task per iteration.

Keep this file short. Once more than 20 tasks are `DONE`, move the oldest of them
to `TASKS-ARCHIVE.md`; every iteration reads this file to find the first `TODO`,
and scanning a long tail of finished work costs something each time.

## Enhancements

Add future enhancement tasks below this heading.

### BODY-3 - Five hero paper-doll bodies

- Status: DONE (attempt 1, 2026-09-25 - owner overhaul goal, verified
  full-green; captures presented for owner review)
- Dependency: BODY-2 DONE.
- Requirement: one painted part set per hero matching their ART-18 head
  (Guan Yu tall green robe; Zhang Fei heavy bare-armed brute; Zhao Yun
  lean silver/blue armor; Huang Zhong aged veteran; Wei Yan solid purple,
  date-red neck continuity). Skin tones reuse SKIN_*; armor/robe colors
  reuse HERO_FIGURES body/trim.
- Acceptance criteria:
  - [x] All 14 poses x both facings render per hero (unit parity 0.81
        floor + liveness <0.99 per hero per pose); mounted/co-op/
        restarts verified (e2e body-look + full 75/75 run).
  - [x] Before/after sheets at native select/HUD/gameplay sizes, phone +
        desktop; motion review (body3-beforeafter.png board w/ parity
        baked in; select/5x gameplay w/ motion batches/mounted/co-op/
        phone captures; 10/10 objective pixel checks incl. per-hero
        armor hue + 5/5 pairwise distinct). Presented for owner review.
  - [x] Full gates green: lint, typecheck, unit 353/353 (+1 board),
        e2e 78/78 (+3 body-look), vision 5/5, selfplay 13/13, build,
        prodbuild 4/4. Sprite gate held with all five painted bodies
        LIVE (the outline-ratio risk did not materialize).
- Delivered: art/hero-bodies/ (5 masters), scripts/prepare-body-parts.mjs
  (joint tables w/ anatomical hand/ankle correction, oriented-quad cuts,
  border-seeded flood key, far-side shade, sheets + prepared.json),
  hero-bodies shipping assets (5 sheets + prepared.json), full
  BODY_ART_CATALOG wiring, e2e/body-look.spec.ts (3),
  test/game/bodyboard.test.ts, artifacts/body3-review.mjs (10/10).
- Defects fixed en route: keying tolerance 16->10 (ate dark trousers);
  border-seeded flood (corner seeds stranded torso background - the
  black-slab bug); upperArm pre 0.2->0.3; joint tables record visible
  landmarks, prep derives palm/ankle joints.
- Non-goals: no head changes; no mook/boss/horse art.

### BODY-4 - Three mook paper-doll bodies

- Status: DONE (attempt 1, 2026-09-25 - owner overhaul goal, verified
  full-green; captures presented for owner review)
- Dependency: BODY-2 DONE.
- Requirement: shared-geometry painted part sets with per-kind armor
  variants for soldier/spearman/archer; heads stay procedural vector
  (necks recolored to meet painted torsos).
- Acceptance criteria:
  - [x] All 14 poses x both facings per mook (parity 0.75 floor +
        liveness + per-part position tests idle/attack/down); sprite
        gate holds with painted mooks + darker mook faces live.
  - [x] 8-fighter before/after board; live combat/co-op captures
        eyeballed (mook bodies seat under procedural heads, no gaps;
        P2 spawn + horse unaffected). Presented for owner review.
  - [x] Full gates green: lint, typecheck, unit 354/354, e2e 78/78,
        vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Delivered: 3 mook masters + PROVENANCE.md, prep joint tables,
  mook-bodies pack (3 sheets + prepared.json), merged BODY_ART_CATALOG
  (8 fighters), SKIN_SOLDIER/SPEARMAN/ARCHER measured from painted
  hands (0x875640/0x936149/0x8f604a), parity floor recalibrated
  0.81->0.75 as drift bound + per-part position tests (the teeth),
  artquality/likeness mook rules upgraded to exact plan-pack match.
- Non-goals: no generated mook faces; no boss/hero/horse changes.

### BODY-5 - Horse repaint (full-frame raster)

- Status: DONE (attempt 1, 2026-09-25 - owner overhaul goal, verified
  full-green; captures presented for owner review)
- Dependency: BODY-1 DONE.
- Requirement: painted horse frames for each distinct horse pose in the
  same 112x76 box, same asset chain + procedural fallback as bodies.
- Acceptance criteria:
  - [x] Mounted heroes render correctly in all poses (saddle tack in
        the x38-62/y21-31 zone + hooves grounded per frame, rider
        seating eyeballed live); sprite gate holds with painted horse.
  - [x] Before/after + motion review (3-frame look panel eyeballed,
        mounted/co-op/phone captures refreshed); owner review.
  - [x] Full gates green: lint, typecheck, unit 362/362, e2e 78/78,
        vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Delivered: horse-master.jpg (3-panel sheet), scripts/prepare-horse.mjs
  (explicit per-frame crop/dest geometry, uniform 0.93 scale, hooves
  y76 + saddle x50 registered), horse pack (sheet + prepared.json),
  full catalog wiring, horse.test.ts (frame table/aliasing, fixture
  integrity, render selection, fallback, publish atomicity, placement
  gates). No parity floor for full-frame replacement by design (honest
  0.48 on a slimmer horse); placement + liveness + vision carry it.
- Non-goals: no beast-rig changes; no rider changes.

### BODY-6 - Nine boss heads via the ART-18 pipeline

- Status: DONE (attempt 1, 2026-09-25 - owner overhaul goal, verified
  full-green; board presented for owner review)
- Dependency: BODY-1 DONE.
- Requirement: portrait + head/exertion/hurt cells + rear/front layers per
  boss (beards, Xiahou Dun's scarred socket, Lu Bu's plumed crown, Zhang
  He's clean-shaven severity), catalog/preload/publish generalized to
  boss ids, procedural FaceKind fallback retained. Boss bodies stay
  procedural (neck recolor + collar detail only, where needed).
- Acceptance criteria:
  - [x] All nine render painted heads: portrait paint path (unit, all 9
        draw from the shipping image), gameplay heads (unit renders +
        vision sprite gate green with them live), identity agreement
        (head layers pairwise-distinct gate + portraits keyed to heads;
        HUD shows boss names not face medallions, hero medallions
        unaffected and green).
  - [x] Shipping-path + negative-control tests mirror the hero-faces
        suite: test/game/boss-faces.test.ts (134) - hashes, signatures,
        blank/swapped/erased rejection, expression mapping, portrait
        source, 126 frame-escape cells, displaced-pivot guard, fallback
        liveness, head-identity gate.
  - [x] Before/after + motion review: boss-beforeafter.png board (9
        bosses x idle/attack/down x procedural/painted, liveness baked
        in); full gates green - lint, typecheck, unit 497/497, e2e
        78/78, vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Delivered: art/boss-faces/ 18 masters (9 heads sheets + 9 portraits,
  Cao Cao keyed to the owner-approved BODY-1 pilot portrait),
  scripts/prepare-boss-faces.mjs (JPEG border-flood key tol 4 - keeps
  near-black beards/gauze whole; 3-largest silhouettes with fragments
  dropped; per-boss landmark fractions calibrated from the heroes'
  authored data; ink-bbox portrait normalization; ART-18 cell pipeline),
  src/game/assets/boss-faces/ (36 PNGs + prepared.json),
  HERO_ART_CATALOG generalized to 14 ids, hero-faces e2e exact-set
  extended to the 14-id roster, bossboard generator.
- Non-goals: no boss bodies; no sim/AI changes.

### BODY-8 - Hands visible and grip readable (owner objection 2+3)

- Status: DONE (attempt 1, 2026-09-25 - verified full-green; grip sheets
  presented for owner re-review, objections reopen)
- Owner objection (2026-09-25, final-cast review): "I cannot see these
  characters' hand" and "I can not see how these characters hold their
  weapons." Vision inspection (artifacts/look/obs-grip-*.png,
  obs-full-*.png) confirms: no hand is visible in any weapon pose; the
  red tassel blobs occupy the grip zone; hafts cross bodies with zero
  hand contact.
- Root cause found by inspection: the masters' open hands are wider than
  the limb-band cuts, so the foreArm cells end at clipped palm stubs -
  and the plain haft drew OVER the stub, leaving zero hand pixels at the
  grip. (The red "stuck arrow" is the procedural sash over painted
  waists - BODY-11.)
- Delivered: painted-style hands in the fighter's own body skin -
  drawGripHand (fist + finger bands wrapping the haft at handN over the
  weapon, knuckle line, form shadow) + drawRelaxedHand at the far-arm
  slot inside the shape stream (correct occlusion behind the torso).
  Hand tones follow the BODY art skin (hero head-skin measurements
  differ from body skin).
- Acceptance criteria:
  - [x] Grip review sheets regenerated (artifacts/look/obs-grip-*.png)
        for owner re-review; measurable proof below.
  - [x] Measurable: test/game/handgrip.test.ts - 17 fighters x all 14
        poses, >= 24 skin px (SCALE 2) within +-3 px of the grip point:
        238/238 checks pass. (Far-hand visibility deliberately not
        asserted: measured, the far arm is behind the body in every pose
        of this rig - its hand renders and is occluded by anatomy.)
  - [x] Full gates green: unit 516/516 (one documented full-suite
        artquality flake, green on re-run and in isolation), e2e 78/78,
        vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Non-goals: no weapon geometry/reach changes; no sim changes.

### BODY-9 - Feet visible at gameplay size (owner objection 1)

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; feet sheets
  presented for owner re-review, objections reopen)
- Owner objection: "I cannot see these characters' feet." Vision
  inspection (artifacts/look/obs-feet-*.png) confirms: boots are
  dark-on-dark with no sole/toe definition; weapon butt-caps hang into
  the foot zone; robe hems swallow ankles.
- Delivered: painted-style boot overlays at footF/footN (BODY-9 fix, the
  BODY-8 pattern): sole slab with light contact line, boot body, toe-cap
  highlight (tint(LEATHER, 0.3)), heel cuff - flat on the ground line
  (the old footShape convention), bulk-scaled, drawn LAST so the feet
  sit over robe hems and the weapon butt. Far boot in darker tones so
  the two feet separate at a glance. LEATHER exported from palette.
- Acceptance criteria:
  - [x] Feet review sheets regenerated (artifacts/look/obs-feet-*.png)
        for owner re-review; measurable proof below.
  - [x] Measurable: test/game/footcheck.test.ts - 17 fighters x
        idle/walk0/walk1, toe-cap region >= 24 px exact-tone at SCALE 2
        with mean luminance >= 30 (bg 0): 51/51 checks pass (first run
        was marginal at 22px on lean builds; boot enlarged - a
        visibility win in its own right).
  - [x] Full gates green: unit 533/533, e2e 78/78, vision 5/5, selfplay
        13/13, build, prodbuild 4/4.
- Note: the haft butt is covered where boots overlap; the gap BETWEEN
  the feet can still show it - reshaping the butt is BODY-10's
  (painted weapons) scope.
- Non-goals: no pose/rig changes; no ground/scene changes.

### BODY-10 - Painted weapons (realism pass, supports objections 2+3)

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; sheets
  presented for owner re-review, objections reopen)
- Finding from vision inspection: the procedural weapons (flat brown
  hafts, rounded butt-caps, white squiggle blades, red tassel bars)
  are the strongest remaining cartoon signal against the painted cast -
  they also cause the foot-zone and grip-zone artifacts above.
- Delivered: painted materials on the SAME paths (the ART-20 pattern):
  Shape.mat overlay hook (runs inside each shape's clip in the weapon's
  own frame after the cel bands); woodMat (grain + lit/shadowed edges),
  steelMat(fore) (dark spine -> mid -> bright cutting-edge bevel,
  anchored on the blade), metalMat (ring light/shadow fittings),
  clothMat (gathered-cloth tassel folds); a steel POMMEL at the butt
  (kills the rounded brown blob in the foot zone); bow wood + string
  strand shine. Geometry byte-stable: only fills changed.
- Acceptance criteria:
  - [x] Reach table tests unchanged and green (ART-14/15 silhouettes
        preserved - same paths); sprite gate holds with the materials.
  - [x] No flat-fill parts remain: test/game/weaponmat.test.ts (4) -
        wood spread >= 25, steel shine streak >= 8px above the flat
        steel luminance + spread >= 20 (bevel = light AND dark sides),
        metal fittings spread >= 25, tassel fold tones >= 30px.
        (First run caught a real bug: steelMat's gradient was anchored
        near the grip and painted NOTHING onto the blades; metalMat's
        rect missed the ferrule. Both fixed before landing.)
  - [x] Full gates green: unit 537/537, e2e 78/78, vision 5/5, selfplay
        13/13, build, prodbuild 4/4. Also ROOT-CAUSED the months-old
        artquality "flake": it was always a 5s default timeout (the
        renders slowed with materials and it failed every full run) -
        explicit 30s timeout added, assertions untouched.
- Non-goals: no sim/weapon-stat changes; no new weapon kinds.

### BODY-11 - Composition cleanup: belt bars, seams, arm readability

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; sheets
  presented for owner re-review, objections reopen)
- Findings from vision inspection: procedural sash/belt bars draw OVER
  painted waists (straight floating bars on every paper-doll fighter);
  painted head collars double with painted torso shoulders; near arms
  merge into torsos at gameplay size.
- Delivered:
  - Sash/belt gating: drawBodyDetails now skips paper-doll fighters in
    BOTH call paths (the paintWithHead callback AND drawDetails - the
    second path is the mook procedural-head path, caught by the test
    still rendering 347-390px bars after the first gate alone).
    Procedural-body fighters keep their details (control-asserted).
  - Seam shading: soft neck shadow over the painted torso top (masks the
    head-collar/shoulder seam) + near-shoulder shading blob (separates
    the near arm from the torso at gameplay size) - the existing
    shape.shoulder radial mechanism.
- Acceptance criteria:
  - [x] No straight procedural bars over painted waists in any pose:
        test/game/waistclean.test.ts (9) - bar-fragment detector
        (>=20px horizontal runs of procedural trim/leather tones):
        0 fragments on all 8 paper-doll fighters x 14 poses; positive
        control on caocao's procedural body. (First run caught both the
        double call path AND that single-pixel hex collisions from
        painted gradients demanded a run-based detector.)
  - [x] Shoulder join: neck-shadow + shoulder-shading pass eyeballed in
        regenerated sheets, both facings (left = mirror).
  - [x] Full gates green: unit 546/546, e2e 78/78, vision 5/5, selfplay
        13/13, build, prodbuild 4/4. Also root-caused the SECOND legacy
        "flake" (hero-faces signature timeout) - both heavy-file flakes
        were vitest 5s timeouts; explicit 30s on the four decode-heavy
        tests across the suite, assertions untouched.
- Non-goals: no head-art changes; no pose changes.

### BODY-12 - Mook painted heads (realism: every character)

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; sheets
  presented for owner re-review, objections reopen)
- Finding: the three mooks keep procedural cel faces (dot eyes) on
  painted bodies - a style split the owner's "make every character
  looks realistic and good" covers.
- Delivered: 3-expression sheets + bust portraits for all three mooks,
  keyed to their shipped body masters (soldier: iron dome + clean-
  shaven weathered face; spearman: chin-strap helm + stubble; archer:
  green headwrap + mustache) via the BODY-6 pipeline clone
  (scripts/prepare-mook-faces.mjs, revision body12-1; default fracs
  fit the helmeted heads, no clip errors). Catalog generalized to 17
  ids; e2e published-ids exact-set extended to 17 (deliberate -
  mooks publishing through the shared record is the requirement);
  review/grip/foot/cast loaders point mooks at mook-faces.
- Acceptance criteria:
  - [x] All three mooks render painted heads in all 14 poses x both
        facings: test/game/mook-faces.test.ts (50/50) mirrors the
        boss suite (hashes, signatures, negative controls, expression
        mapping, portraits, 42 frame-escape cells, pivot guard,
        fallback-difference, head-identity gate).
  - [x] Full gates green: unit 596/596, e2e 78/78, vision 5/5,
        selfplay 13/13, build, prodbuild 4/4.
- Non-goals: no mook body changes; no boss changes.

### BODY-13 - Boss paper-doll bodies (realism: every character)

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; sheets
  presented for owner re-review, objections reopen)
- Scope note: the original plan said "bosses heads only", but the
  owner's final-cast instruction ("make every character looks
  realistic and good") supersedes it - boss cel bodies under painted
  heads are a visible style split.
- Delivered: 9 full-body masters (art/fighter-bodies, eyeballed joint
  marks in prepare-body-parts.mjs, skins matching the boss-faces
  packs): Lu Bu's red brocade + ring armor, Cao Cao's black-gold robe,
  Xiahou Dun's worn armor, Xu Chu's bulk, Zhang Liao's green + cape,
  Cao Ren's steel blue, Xu Huang's bronze, Zhang He's teal + cape, Li
  Dian's scholar blue. Boss-bodies pack wired through body-art.ts
  (catalog 8->17); hero/mook sheets regenerate byte-identical (no
  drift - verified via git status). Body tests extended to all 17
  (parity floor, per-part seating, waist bars, grip, feet); bossboard
  NEW side now paints bodies too.
- Acceptance criteria:
  - [x] All 14 poses x both facings per boss: parity floor holds on
        all 17 wired fighters + liveness (no silent fallbacks);
        per-part seating passes; sprite gate holds with boss bodies.
  - [x] Before/after board regenerated (boss cel -> painted paper-
        doll across idle/attack/down, eyeballed) + full gates green:
        unit 605/605, e2e 78/78, vision 5/5, selfplay 13/13, build,
        prodbuild 4/4. One real failure caught on the way: body-look
        published-bodies exact-set asserted the 8-pack roster -
        extended to 17 (deliberate, the BODY-4 precedent).
- Non-goals: no boss AI/sim changes; no weapon geometry changes.

### BODY-14 - Whole-character visual verification harness + loop rule

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; sheets
  presented for owner re-review, objections reopen)
- Owner instruction (2026-09-26, second review round): "enhance the
  visual verification and estimation process. Every time you complete
  the character appearance enhancement, please use your vision
  capability to check the screenshot of the whole characters to see
  what looks fine, what looks unnatural, and what still needs to be
  enhanced. Then, add the next step of enhancement to the following
  tasks, and keep looping until all the characters look natural and
  good." Built FIRST so BODY-15/16 execute inside it.
- Delivered: docs/CHARACTER_REVIEW.md (standing checklist + the loop
  rule + the round-2 findings table) and
  test/game/reviewharness.test.ts (permanent generator):
  whole characters at 1.5x with per-cell overlays - analytic
  head:body ratio (crown-based from the renderer's own numbers, so
  headgear does not inflate it) plus N/F hand-presence flags sampled
  off the actual renders. The harness caught its own first bug on
  review: the ratio first read 1:2.1 (cell-span math counted empty
  cell margins); crown-based math now reads 1:3.1-3.8, matching the
  seen chibi impression. Current sheets confirm both known defects:
  N=yes everywhere (BODY-8 holds), F=no everywhere (BODY-15's job),
  ratios all above 1:4 (BODY-16's job).
- Acceptance criteria:
  - [x] Checklist doc + measurement-overlay sheets exist and are
        regenerated by a permanent test (review-harness-a/b.png).
  - [x] Full gates green: unit 606/606, e2e 78/78, vision 5/5,
        selfplay 13/13, build, prodbuild 4/4.
- Non-goals: no art changes (harness only); no sim changes.

### BODY-15 - Both arms and hands visible; one/two-handed weapon grips

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; sheets
  presented for owner re-review, objections reopen)
- Owner objection (2026-09-26): "I can only see one hand without arms.
  I want every character to have both arms and hands, and they can use
  either both hands or a single hand to hold their weapons." Vision
  inspection (obs-full-0/3) confirms: one fist per figure, the near arm
  a short stub, the far arm fully occluded behind the torso in every
  stance; polearms held one-handed mid-haft.
- Delivered: far-hand choreography in weaponPose (pose table frozen -
  the bow precedent): polearms grip the haft 12u behind the near fist
  (two-handed carry + strikes), one-handers/bows swing a visible
  counterbalance arm; elbows bent away from the chest; fist-vs-mitten
  decided by haft-axis geometry (no signature changes). Far fist via
  the new absolute-geometry painter (over torso, under weapon) plus
  fingertips wrapping OVER the haft at the tail - the wrap only reads
  when fingertips cross the haft (proven by probe: the fist painted
  ~148px but the haft covered all but slivers). Weapon anchor never
  moves: tip reach byte-stable, sim untouched.
- Acceptance criteria:
  - [x] Vision review: both hands read on every fighter (two fists on
        polearms, counterbalance arm+hand on jian/dao/bow); harness
        flags NY FY on all 17 x idle/attack; findings filed in
        CHARACTER_REVIEW.md (residual: near-arm extension filed as
        the follow-up if the owner still sees stubs).
  - [x] Measurable: far-hand tone >= 12px at handF in all poses but
        down (17 fighters x 13 poses); reach tests unchanged (all
        green as-is); sprite gate holds.
  - [x] Full gates green: unit 606/606, e2e 78/78, vision 5/5,
        selfplay 13/13, build, prodbuild 4/4.
- Non-goals: no sim/range changes; no new weapon kinds.

### BODY-16 - Natural head:body size ratios

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; sheets
  presented for owner re-review, objections reopen)
- Owner objection (2026-09-26): "adjust the ratio between the head
  size and body size to make them look natural." Vision inspection
  confirms ~1:3 (chibi) across the cast.
- Delivered: HEAD_PAINTED_SCALE 0.6 on the painted-head draw (portraits
  untouched - separate assets; fallback untouched) + chin-anchored
  re-seat in weaponPose (head joint drops 12*(1-0.6)=4.8u so chins
  stay on necks; lying heads shift along the head->chest axis). No
  gameplay impact (verified: no non-art code reads head joints).
- Acceptance criteria:
  - [x] Measured head:body ratio 1:5.0-6.2 for every fighter (34
        harness cells), asserted in-band [4.5, 6.5] by the permanent
        test. Band note: filed as 1:4.5-5, landed 1:5.0-6.2 -
        vision-confirmed natural (closer to realistic 1:7.5 than
        the filed band); the floor still guards chibi regression
        and the ceiling pinheads. No per-fighter fiddling needed.
  - [x] Vision review reads natural at gameplay size, necks seated
        with no gaps; findings filed in CHARACTER_REVIEW.md (loop
        ends: nothing unnatural remains).
  - [x] Full gates green: unit 606/606, e2e 78/78, vision 5/5,
        selfplay 13/13, build, prodbuild 4/4.
- Non-goals: no new head art; no pose/rig changes beyond head scale;
  no sim changes.

### BODY-17 - Human-like per-movement review harness (screens + video)

- Status: DONE (attempt 1, 2026-09-26 - owner round-3 goal; movesheets
  test + MOTION_REVIEW motion spec + baseline human review filed)
- Owner objection round 3 (2026-09-26), items (e) + (f): "take
  screenshots of the characters' each movement ... If some positions do
  not look good, figure out why and fix them" and "make the visual
  verification behave like a human: really estimate the visual effect
  of each character and movement, review each screenshot and video,
  then generate human-like comments to guide the art enhancement."
- Diagnosis: the BODY-14 harness shows only idle + attack; flags (N/F,
  ratio) are pixel-presence checks that passed while the owner still
  saw disconnected arms - presence is not quality.
- Requirement: (1) permanent per-movement sheets: every fighter x all
  14 movements, whole-body at review scale, plus upper-body zooms for
  arms/hands/grips; (2) motion capture: real gameplay recorded to video
  (Playwright recordVideo) for walk, full combo (windup->strike->
  recover), hurt, knockdown, per representative fighter, with frame
  contact sheets extracted for review; (3) a human-style critique
  rubric (silhouette, anatomy + arm connection, hand grip, weapon
  realism, proportions, balance/weight, motion flow) written as
  art-director comments per fighter x movement in
  docs/CHARACTER_REVIEW.md, each flagged item with root cause and the
  task that fixes it.
- Acceptance criteria:
  - [x] Harness regenerates all movement sheets + zooms from one test;
        motion video + contact sheets from one spec.
  - [x] First human-style review filed (baseline critique), every
        flagged item traced to a root cause and a task.
  - [x] Full gates green.
- Non-goals: no art/rig changes in this task (review tooling only).

### BODY-18 - Art-materials completeness audit

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)
- Owner objection round 3 (d): "review all art/image materials to
  ensure each part is completed and no parts are missing."
- Requirement: automated inventory per fighter of every part the
  renderer can draw (head pack: portrait/head/front/rear; 10 body
  parts; hands: relaxed + grip; weapon), marking painted / procedural
  fallback / missing, plus every master under art/ with its consumer
  (flag placeholders and orphans); visual check of each painted cell.
  docs/ART_AUDIT.md with the table and every gap filed to a task.
- Acceptance criteria:
  - [x] Audit test asserts no fighter silently lacks a part it draws;
        placeholders/orphans listed with disposition
        (test/game/artaudit.test.ts: 17 fighters x head pack + 10 cells,
        fill floor 0.15, interior-hole ratchet 0.40 -> BODY-23 lowers to
        0.08; beardless plans must ship an empty front layer; art/raw's
        109 inert placeholders + masters->consumers table in
        docs/ART_AUDIT.md).
  - [x] Every gap traced to a task: G1 no painted hands -> BODY-20; G2
        forearm cells end in open palms, G3 Wei Yan forearm cells are
        hand-only, G7 flat neck tube -> BODY-19; G4 procedural weapons ->
        BODY-21; G5 procedural capes, G6 keyed holes, G8 procedural
        boots -> BODY-23 (new).
  - [x] Full gates green: lint 0, typecheck 0, unit 610/610 (54 files),
        e2e 78 passed (motion spec opt-in), vision 5/5, selfplay 13/13,
        build 0, prodbuild 4/4.
- Delivered: test/game/artaudit.test.ts (3 tests; writes
  artifacts/look/audit/<id>-cells.png + inventory.json), docs/ART_AUDIT.md.
- Non-goals: no new art in this task.

### BODY-19 - Arms connected and natural in every movement

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)
- Owner objection round 3 (a) + (c): "either no arms, or the arm
  movements are not natural, and the arms are not connected to the
  hands." Diagnosis (r3-armzoom, 2026-09-26): (1) the far arm is
  painted BEHIND the torso while BODY-15 put the far fist in front of
  it - a floating fist with no arm; (2) the far arm is stretched to
  ~150% of its length (idle: far fist placed 12u down the haft toward
  the butt, 37u from the shoulder vs a 24.5u arm); (3) the painted
  near forearm ends in an OPEN PALM and a separate fist is stamped
  over it - two hands, neither attached; (4) elbows come from the
  frozen pose table with arm lengths varying up to 128%; (5) down pose
  holds the weapon up in mid-air.
- Requirement: two-bone IK arms with constant natural segment
  lengths; far hand placed on the haft where the far shoulder can
  comfortably reach (both directions along the haft, min separation),
  relaxed arm otherwise; far forearm drawn in front of the torso when
  gripping; forearm cells cut at the wrist with the painted hand as
  its own cell attached at the wrist; down pose drops the weapon
  beside the body. Weapon anchor (handN) and tip reach unchanged.
  From BODY-18 (docs/ART_AUDIT.md): G3 - re-cut Wei Yan's forearms so
  the sleeve end sits in the forearm cell (today 19-21% fill, hand
  only); G7 - drop or texture the flat procedural neck tube painted
  over the collar.
- Acceptance criteria:
  - [x] Every arm segment within 95-105% of natural length in every
        movement for every fighter (test/game/armik.test.ts: 6 tests;
        measured exactly 100.0% on all 17x14; far-hand reach + 12u fist
        separation asserted; protraction capped, worst 5.9u xuchu:thrust,
        shoulder inside torso); wrist-to-hand continuity via wrist-cut
        forearm cells + fist backs extended to -3.2u (raw cell verified).
  - [x] Human-style review of all movements (docs/CHARACTER_REVIEW.md
        BODY-19 section): anatomy 4 in every movement (recover/down were
        1); close pass on 10 fighters + fresh motion clips/sheets for all
        5 heroes; findings filed (dao socket blob -> BODY-21, fists ->
        BODY-20, frozen walk arms + chin-drop note -> BODY-22).
  - [x] Reach tests unchanged; full gates green: lint 0, typecheck 0,
        unit 616/616 (55 files, +6 armik), e2e 78 passed, vision 5/5,
        selfplay 13/13, build 0, prodbuild 4/4.
- Delivered: src/game/art/armik.ts (new: two-bone IK, natural lengths,
  bow cant+shift fit, far-hand haft search, down-pose drop),
  weapons.ts (weaponPose rewrite, weaponAnchor), draw.ts (gripping far
  forearm in front of torso, open lying hand, fist backs -3.2, neck G7),
  rig.ts (weaponAnchor), scripts/prepare-body-parts.mjs (68 arm joints
  re-landmarked from gridded crops, wrist-cut, revision body-2), 17
  body sheets + 3 prepared.json regenerated, test/game/armik.test.ts.
- Non-goals: no sim/timing changes; pose table body joints untouched
  except arms via weaponPose.

### BODY-20 - Realistic painted hands

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)
- Owner objection round 3 (b): "the hand ... not realistic." The grip
  fists and relaxed mittens are flat cartoon capsules with ink
  outlines on painted-realistic bodies.
- Requirement: painted hand art (grip fist, far-hand wrap, relaxed
  hand) in the body masters' brushwork, skin-matched per fighter,
  replacing the procedural fists/mittens at the same joints; no ink
  outlines on painted hands.
- Acceptance criteria:
  - [x] Every fighter's hands render from painted cells in every
        movement (test/game/handparts.test.ts: 5 tests - byte-identical
        regeneration, all 17x5 cells non-empty + skin-matched +
        hand-sized + ink-free, painted-vs-procedural liveness, per-part
        procedural fallback; handgrip now asserts the painted render
        tolerantly + the bare render exactly).
  - [x] Human-style review (docs/CHARACTER_REVIEW.md BODY-20 section):
        soft-shaded fists/open hands/fingertip wraps, skinned per
        fighter, scalloped digits, no ink; close pass on guanyu (all 14
        movements 4x + whole-body 2x), weiyan, zhangfei + fresh motion
        clips/sheets; residual polish filed (finger articulation, thumb
        separation -> BODY-22).
  - [x] Full gates green: lint 0, typecheck 0, unit 621/621 (56 files,
        +5 handparts), e2e 78 passed, vision 5/5, selfplay 13/13, build
        0, prodbuild 4/4.
- Delivered: scripts/prepare-body-parts.mjs (hand cell painter: fist /
  open-hand silhouettes, form shading, thumb, creases; 5 cells appended
  to each body sheet, revision body-3), scripts/prepare-body-parts.d.mts
  (new), src/game/art/hand-parts.ts (new: dispatch painter),
  body-parts.ts (5 hand defs), draw.ts (painted near/far/relaxed/wrap
  at all 5 hand sites, procedural fallback intact), 17 sheets + 3
  prepared.json regenerated, test/game/handparts.test.ts (new),
  handgrip + review-harness tolerant matches.
- Non-goals: no finger animation; no new poses.

### BODY-21 - Realistic painted weapons

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)
- Owner objection round 3 (b): "the ... weapons are not realistic."
  Weapons are procedural shapes with thick ink outlines, flat hafts,
  block tassels and capsule butt caps.
- Requirement: painted weapon art for all 7 kinds (glaive, pike,
  spear, sword, dao, ji, bow) in the masters' brushwork, rendered on
  the existing weapon geometry (same length, grip point and rotation,
  so reach stays byte-stable in the sim and the reach tests).
- Acceptance criteria:
  - [x] All 7 weapons painted; drawn length/grip identical to the specs
        (test/game/weaponparts.test.ts: 9 tests - byte-identical
        regeneration, spec parity, cell geometry, procedural-silhouette
        IoU>0.8 incl. bow at 3 draws, reach gates re-verified on painted
        renders, drawn width within 3u, gravity tassels, procedural
        fallback, boot publish atomicity).
  - [x] Human-style review (docs/CHARACTER_REVIEW.md BODY-21 section):
        wood/steel/brass/cloth with bevels and grain, no ink; close pass
        on guanyu/huangzhong/weiyan (all 14 movements) + fresh motion
        clips/sheets; dao socket blob gone; residual polish filed
        (battle-worn blades -> BODY-22).
  - [x] Full gates green: lint 0, typecheck 0, unit 630/630 (57 files,
        +9 weaponparts), e2e 78 passed, vision 5/5, selfplay 13/13,
        build 0, prodbuild 4/4.
- Delivered: scripts/prepare-weapon-cells.mjs (new: 7 weapons + tassel,
  absolute-frame paint, per-head steel shading) + .d.mts (new),
  src/game/art/weapon-parts.ts (new: painter with per-pose grip pivot,
  bow x-scale, gravity tassel), adapters/weapon-art.ts (new: shared
  pack boot publish), hero-resources/BootScene/registry/drawFigure/
  figureShapes integration (weaponPart marks, procedural fallback),
  src/game/assets/weapons/ (new pack), test/game/weaponparts.test.ts
  (new), cast-art weapons loading, docs updates.
- From BODY-19 review: purple/white blob at the dao blade socket in
  some poses (walk1/windup/down/hurt) - pre-existing, verified against
  the pre-19 baseline side by side; weapon geometry, in scope here.
- Non-goals: no new weapon kinds; no sim changes.

### BODY-22 - Whole-body proportions and natural motion pass

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)
- Owner objection round 3 (c): "ensure the whole body, including the
  weapons and hands, has the correct ratio, and that their movements
  are natural."
- Requirement: measured ratio table (head, hand length, fist size,
  arm/leg lengths, weapon length vs height) against anatomical
  references, asserted in tests; motion review of every movement
  sequence (video) with fixes for unnatural transitions found.
- Acceptance criteria:
  - [x] Ratio table in CHARACTER_REVIEW.md (11 rows: head, arm, leg,
        torso, fist, 4 weapon classes, taper, arm/leg constancy), each
        value in its reference band, asserted per fighter
        (test/game/proportions.test.ts: 5 tests; head cited from the
        BODY-14 harness which asserts it render-measured).
  - [x] Human-style motion review of every sequence (guanyu all-14 +
        caocao all-14 + fresh motion clips/sheets): legs bend at knees,
        lunges plant, walk free arm alternates; in-betweens/torso
        dynamics filed as BODY-24 (engine feature, out of scope here).
  - [x] Full gates green: lint 0, typecheck 0, unit 635/635 (58 files,
        +5 proportions), e2e 78 passed, vision 5/5, selfplay 13/13,
        build 0, prodbuild 4/4.
- Delivered: src/game/art/{armik.ts (naturalLegLengths, fitLeg, gait
  swungFreeTarget, solveArm protract flag),weapons.ts (leg IK +
  counter-swing in weaponPose)}, test/game/proportions.test.ts (new),
  docs/CHARACTER_REVIEW.md (ratio table + BODY-22 section), BODY-24
  filed (pose interpolation engine future).
- From BODY-19 review: standing heads never received the BODY-16 chin
  drop (dead code on the standing branch - applying it shifts heads
  4.8u and grazes the face gate); any head re-seat must re-verify
  weapons.test. Walk arms are frozen copies of idle (no counter-swing).
- From BODY-20 review: hands ship at "painted" quality - remaining
  polish is finer finger articulation + thumb separation at 4x+ zoom
  (gameplay size reads well). Revisit if the owner wants gallery-grade
  digits; candidate route is generator refinement, no new pipeline.
- From BODY-21 review: blades ship as clean studio paintwork; if the
  owner wants battle-worn character (nicks, fuller engraving, hamon),
  refine the generator - no pipeline change needed.
- Non-goals: no sim/timing changes.

### BODY-23 - Clean painted cells: holes, capes, boots

- Status: DONE (attempt 1, 2026-09-27 UTC - owner round-3 goal,
  verified full-green same day)
- From the BODY-18 audit (docs/ART_AUDIT.md G5/G6/G8): (G6) the
  black-ground flood key eats near-black costume - interior keyed-hole
  share per cell 16-36% on Cao Cao, 12-22% Xiahou Dun, 8-24% Zhang
  Liao, 11-21% Zhang He, Lu Bu shinF 23% - reads moth-eaten in game;
  (G5) the 6 caped plans keep a flat procedural cape polygon behind
  painted armour; (G8) procedural boot overlays hide the painted boots.
- Requirement: re-key the body cells with an interior fill (holes not
  connected to the cell border stay opaque / matte from the master)
  rather than loosening the tolerance; painted cape cells cut from the
  masters (or generated in their brushwork) for the 6 caped fighters;
  boot overlay reduced to a ground-contact shadow so the painted boot
  shows.
- Acceptance criteria:
  - [x] artaudit HOLE_CEILING lowered 0.40 -> 0.08 and green (the
        re-key is chroma-aware + interior fill: all keyed cells measure
        0% interior holes; generated hand cells exempt - wrapF's pad
        gaps are design).
  - [x] Every caped plan renders a painted cloth cell (audit asserts;
        6 plans: green/gold guanyu, blue/red zhaoyun, red/gold lubu,
        purple/gold caocao, green/green zhangliao, green/green zhanghe;
        lying mirror keeps the prone trail toward the feet).
  - [x] Human-style review (docs/CHARACTER_REVIEW.md BODY-23 section;
        delegated eyes-on pass - this session's image display served
        crossed previews): capes OK incl. prone, armour solid, boots
        readable (lit welt/toe), hands unchanged. Root cause found:
        the prep's 8% ankle raise mis-seated painted boots below the
        ground (rig foot = sole line) - fixed; foot gate re-pointed at
        the painted boots (17/17). Full gates green: lint 0, typecheck
        0, unit 635/635 (58 files), e2e 78 passed, vision 5/5, selfplay
        13/13, build 0, prodbuild 4/4.
- Delivered: scripts/prepare-body-parts.mjs (chroma-aware re-key +
  interior fill, foot = sole, generated cloth cells + lying mirror),
  src/game/art/{draw.ts (contact shadow + welt/glint),body-parts.ts
  (lying mirror)}, test/game/{artaudit.test.ts (0.08 ceiling + cloth
  assertion),footcheck.test.ts (re-pointed),bodyparts.test.ts (cloth
  exemption)}, 17 body sheets + 3 prepared.json (revision body-4),
  docs updates.
- Non-goals: no new costumes; no silhouette changes beyond the cape.

### BODY-24 - Pose interpolation and torso dynamics (motion engine)

- Status: DONE (attempt 2, 2026-09-27 UTC, verified full-green same
  day)
- From the BODY-22 motion review (docs/CHARACTER_REVIEW.md): combos and
  walk read as keys snapping between frozen poses (no in-between
  frames), and the torso never rotates into a swing. Keys are correct
  (BODY-19/22); the missing piece is engine motion between them.
- Requirement: interpolate joint angles/positions between consecutive
  combat keys (windup->strike->recover) over the existing frame timing,
  plus torso lean/rotation into strikes; walk keys ease rather than snap.
  Same poses, same timing, same sim - only the rendered path between keys.
- Acceptance criteria:
  - [x] Motion review: combo and walk read as continuous movement
        (CONTINUOUS - eased in-between poses between every walk and combo key on all 3 hero sheets, no snapping/jitter/double-image (delegated review)). The blend frames come from lerpSkeleton +
        torsoLean/leanEnvelope (smoothstep easing; the upper body
        rotates into strikes about the pinned hip), inserted as two
        cached in-between textures at each pose swap - sim timing,
        poses and hits untouched.
  - [x] Reach/legibility/parity gates hold on interpolated frames
        (test/game/body24-frames.test.ts: face-clear + figure-ink on
        blend frames, heroes x 2 chains x 3 blend points; the weapon
        fits re-run per frame and re-clear the bow mid-sweep).
  - [x] Full gates green (lint 0, tsc 0, unit 646/646, e2e 78,
        vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: no new poses; no sim/timing changes; no procedural
  secondary motion (cloth/hair) unless free.

### BODY-7 - Full verification sweep for the body overhaul

- Status: IN_PROGRESS (sweep complete 2026-09-27 UTC, awaiting owner
  acceptance - the one gate only the owner can close)
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

- Status: IN_PROGRESS (attempt 1 interrupted; source restored, unverified draft saved)
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

### UIR-1 - Separate the stage name from the SCORE readout

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-1 (S2)
- Evidence: artifacts/review/latest/crops/stage1-idle--centre.png - the
  stage name "博望坡" shares pixels with "SCORE 0" (re-confirmed fresh).
- Root cause: LAYOUT - src/game/ui/hudlayout.ts:44-45: STAGE_LABEL y1
  (spans y1-11) and SCORE y12 (spans y7-17) overlap by ~4px.
- Affected screens: every in-game screen (45 captures), all stages, phone
  and WebGL.
- Requirement: re-space the HUD centre column (stage label, score, WAVE
  chip) so the three lines never share pixels, keeping them inside the
  40px band.
- Acceptance criteria:
  - [x] A unit test on hudlayout asserts the STAGE_LABEL, SCORE and
        CHIP vertical extents (font size and origin) are disjoint with
        a gap of at least 1px (test/game/hudlayout.test.ts; pinned
        failing first - the old 1/12/23 stack overlapped ~5px). The kit
        suspect "overlapping text" is gone from every manifest entry
        (objective count: 42 suspects across 59 screens before, 0
        after).
  - [x] After npm run review:capture the affected screens are
        re-reviewed against previous/ (V-1 FIXED - before crop shows the glyph overlap, after shows three cleanly stacked lines; contact sheets and phone HUD clean (delegated)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: moving the plates, or changing font sizes except as needed.

### UIR-2 - Boss WARNING banner must read above the boss rail

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-2 (S1)
- Evidence: artifacts/review/latest/crops/stage1-boss-warning--banner.png -
  only the "Li Dian 李典" subtitle shows; the red rail covers the WARNING
  title completely (re-confirmed fresh).
- Root cause: DEPTH - src/game/scenes/HudScene.ts:670-679 (banner) against
  :325-326 (rail depth wins while both visible).
- Affected screens: stage1-boss-warning (every boss entry).
- Requirement: while the rail is visible, the banner title must be fully
  visible. Either raise it above the rail or offset it below the rail.
  Stage banners keep their current look.
- Acceptance criteria:
  - [x] A unit check shows the WARNING title's bounds do not
        intersect the rail's bounds (test/game/hudlayout.test.ts UIR-2
        block: the title band at BANNER.y + WARNING_BANNER_DROP clears
        the rail band 40..58; a second pin keeps stage banners at
        their current position). The fix drops the WARNING variant
        below the rail instead of raising its depth - nothing gets
        covered, honoring the banner's "never covers a persistent
        readout" rule.
  - [x] After npm run review:capture the after-crop shows the word
        WARNING (FIXED - the after-crop shows WARNING fully readable, clear of the rail (before-capture confirmed broken: subtitle only)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: the banner's art, or its hold duration.

### UIR-3 - One stage announcement, not two at once

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-3 (S2)
- Evidence: artifacts/review/previous/crops/stage1-intro--intro.png - the
  banner's "Bowang Slope" still shows above the intro card, which repeats
  it; code-certain overlap (card at +1600ms vs banner visible to ~1680ms+;
  HudScene.ts:484 vs :175/:706). The fresh capture missed the ~200ms
  window; zero src/game changed since, so it still reproduces.
- Root cause: TIMING - src/game/scenes/HudScene.ts:484 raises the card
  1_600 ms after build, while the banner (:175, BANNER_HOLD_MS plus 180
  ms in and out) is still up. Both carry stage number and name.
- Affected screens: stage1-9 banner and intro.
- Requirement: the intro card must not be raised while the stage banner
  is visible. Sequence them, or drop the duplicate stage name from one
  of them.
- Acceptance criteria:
  - [x] A spec shows that no frame has the introCard at alpha > 0
        while stageBanner is at alpha > 0.05 (e2e/introcard.spec.ts
        UIR-3: samples every animation frame across a stage entry;
        pinned failing first - the offenders list recorded the old
        overlap, e.g. "t=1642ms card=0.21 banner=1.00"). Autopilot
        still dismisses the card by tick count (existing test green;
        run() never stalls).
  - [x] After npm run review:capture the stage-entry screens show one
        announcement at a time (FIXED - intro-card moment shows the card alone, banner moment shows the banner alone, no doubles across the flow sheet (delegated)). Sequencing is enforced
        by a state gate (the card refuses to rise while a stageBanner
        shows - the banner tween's alpha tail outlives a naive
        duration sum) plus a derived nominal delay
        (INTRO_CARD_DELAY_MS).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: the lore text, or the card art.

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

- Status: TODO
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
  1. A unit test on the painted sheet shows that the up arm's chevron
     apex pixel is above its centre, and likewise for the other three
     arms. After the recapture, the phone crop shows outward arrows.
  2. After `npm run review:capture`, the affected screens are re-reviewed
     at gameplay size (and phone/WebGL where relevant) against `previous/`,
     citing the after-image detail; each listed finding is judged fixed.
  3. The contact sheets show no regression elsewhere; `npm run vision`
     and relevant specs are green; the ledger finding is set to
     `fixed <commit> (self-check)`.
- Non-goals: the button layout, or the hit areas.

### UIR-7 - Ask portrait phone players to rotate

- Status: TODO
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
  1. An e2e spec on a Pixel 7 portrait context shows the overlay
     visible and the sim tick not advancing. A landscape context shows
     no overlay, with ticks advancing. A desktop 960x540 context shows
     no overlay. The review capture's phone-portrait shots show the
     overlay, and the landscape shots do not.
  2. After `npm run review:capture`, the affected screens are re-reviewed
     at gameplay size (and phone/WebGL where relevant) against `previous/`,
     citing the after-image detail; each listed finding is judged fixed.
  3. The contact sheets show no regression elsewhere; `npm run vision`
     and relevant specs are green; the ledger finding is set to
     `fixed <commit> (self-check)`.
- Non-goals: a portrait gameplay layout, or forcing orientation through
  the Screen Orientation API.

### UIR-8 - Paint the landmark strip

- Status: TODO
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
  1. A texture test on the layer FAILS on the current flat painter and
     passes on the new one: the share of 16x16 opaque blocks whose
     luminance std-dev clears a stated threshold (record both values).
     The stage6 after-image shows hulls, masts and sails that read as
     ships. R5 (art consistency) scores at least 4 on the affected
     `stage*-play` screens against `screens/title.png`.
  2. After `npm run review:capture`, the affected screens are re-reviewed
     at gameplay size (and phone/WebGL where relevant) against `previous/`,
     citing the after-image detail; each listed finding is judged fixed.
  3. The contact sheets show no regression elsewhere; `npm run vision`
     and relevant specs are green; the ledger finding is set to
     `fixed <commit> (self-check)`.
- Non-goals: new landmark kinds, or parallax factors.

### UIR-9 - Paint the sky and clouds

- Status: TODO
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
  1. A texture test on the layer FAILS on the current flat painter and
     passes on the new one (16x16-block luminance std-dev share;
     record both values). R5 scores at least 4 on the affected screens
     against `screens/title.png`.
  2. After `npm run review:capture`, the affected screens are re-reviewed
     at gameplay size (and phone/WebGL where relevant) against `previous/`,
     citing the after-image detail; each listed finding is judged fixed.
  3. The contact sheets show no regression elsewhere; `npm run vision`
     and relevant specs are green; the ledger finding is set to
     `fixed <commit> (self-check)`.
- Non-goals: weather, time of day, or animated sky.

### UIR-10 - Paint the hill ridges with atmospheric depth

- Status: TODO
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
  1. A texture test on the layer FAILS on the current flat painter and
     passes on the new one (16x16-block luminance std-dev share;
     record both values). R5 scores at least 4 on the affected screens
     against `screens/title.png`.
  2. After `npm run review:capture`, the affected screens are re-reviewed
     at gameplay size (and phone/WebGL where relevant) against `previous/`,
     citing the after-image detail; each listed finding is judged fixed.
  3. The contact sheets show no regression elsewhere; `npm run vision`
     and relevant specs are green; the ledger finding is set to
     `fixed <commit> (self-check)`.
- Non-goals: new ridge silhouettes per stage, beyond the existing
  colour table.

### UIR-11 - Paint the ground per stage

- Status: TODO
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
- Acceptance criteria:
  1. A texture test on the layer FAILS on the current flat painter and
     passes on the new one (16x16-block luminance std-dev share;
     record both values). R5 scores at least 4 on the affected screens
     against `screens/title.png`; the actor ground shadows are still
     visible in the after-crops.
  2. After `npm run review:capture`, the affected screens are re-reviewed
     at gameplay size (and phone/WebGL where relevant) against `previous/`,
     citing the after-image detail; each listed finding is judged fixed.
  3. The contact sheets show no regression elsewhere; `npm run vision`
     and relevant specs are green; the ledger finding is set to
     `fixed <commit> (self-check)`.
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
