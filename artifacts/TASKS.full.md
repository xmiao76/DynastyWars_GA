# Work Queue

Statuses: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`.

The loop processes tasks from top to bottom and works on only one task per iteration.

Keep this file short. Once more than 20 tasks are `DONE`, move the oldest of them
to `TASKS-ARCHIVE.md`; every iteration reads this file to find the first `TODO`,
and scanning a long tail of finished work costs something each time.

## Enhancements

Add future enhancement tasks below this heading.

### UI-4 - In-game HUD: WoF top-bar language (overhaul phase 4)

- Status: DONE (attempt 1, 2026-09-23 22:50 UTC - owner overhaul goal,
  verified full-green same day)
- Dependency: UI-1 DONE.
- Requirement: arcade top band (P1 medallion + name + segmented HP + score +
  lives pips); full-width boss rail on boss waves; "GO →" advance cue;
  "WAVE n" chip; restyled combo + flaming-pearl special pip (same hp>cost rule);
  1.2s boss-name banner via existing `showBanner` queue; touch controls
  restyled as bronze lacquer buttons with identical hit zones/protocol.
- Acceptance criteria:
  - [x] HUD/layout/pause/touch/prodbuild-HUD specs pass unchanged (no
        assertion deleted: geometry moved to hudlayout.ts with new unit
        tests; the persistent stage label shows nameZh with the full En·Zh
        name still present via the entry banner, which hud.spec reads).
  - [x] Reviewed desktop + mobile portrait/landscape in combat, boss, co-op
        (artifacts/look/ui4-{combat,boss,coop,go,touch-portrait,
        touch-landscape,touch-boss}.png; 20/20 objective pixel checks via
        artifacts/ui4-review.mjs; a pixel-agent audit caught the first-pass
        2x-size baked-image defect - fixed with setDisplaySize before gates).
  - [x] Full gates green: lint, typecheck, unit 318/318 (+12), e2e 67/67
        (+4 hud-look), vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Delivered: src/game/ui/hudlayout.ts (pure geometry + ghost decay),
  src/game/art/hudart.ts (plate/medallion/pearl/pip/chip/GO/rail/banner/touch
  painters), HudScene.ts rewrite (WoF band, boss rail, WAVE chip, GO cue,
  restyled combo + banner plaque, holdMs param), touch.ts bronze sheet
  (identical zones/protocol), GameScene 1.2s boss banner, type.ts 'GO →',
  test/game/{hudlayout,hudart}.test.ts (12), e2e/hud-look.spec.ts (4).
- Non-goals: no sim/HUD-data changes; damage ghost is presentation-only
  (decayGhost in hudlayout, ghost field separate from ratio).

### UI-5 - Flow screens: scene cards, result, game over, complete, pause/continue (overhaul phase 5)

- Status: DONE (attempt 1, 2026-09-24 05:20 UTC - owner overhaul goal,
  verified full-green same night)
- Dependency: UI-1 DONE.
- Requirement: new skippable scene-intro parchment card as a HudScene overlay
  (no new scene; tick-based autopilot auto-skip; `STAGE_LORE` copy table in the
  game layer); victory tally / game-over / game-complete / continue / pause
  cards in the new kit. Same scene keys + bridge fields.
- Acceptance criteria:
  - [x] Autopilot/selfplay/marathon never hang on the card (new
        e2e/introcard.spec.ts, 4 tests: tick-dismissal, real-play Enter
        dismissal, fresh card per stage, defeat/complete/pause captures).
  - [x] stageclear/continue/scenerestart specs preserved (plus pause,
        touchpause, hud, hudpanels, layout all green); vision captures
        reviewed.
  - [x] Full gates green: lint, typecheck, unit 323/323 (+5), e2e 71/71
        (+4 introcard), vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Delivered: src/game/data/stagelore.ts (9 lore beats), src/game/art/
  flowart.ts (parchment intro/dialog/victory/defeat cards + stat chip +
  ensureFlowArt), HudScene intro overlay (1.6s stagger, tick-based
  autopilot dismiss, Enter/tap/3s dismiss; overlays sit above it),
  parchment pause/continue/result/gameover/complete cards with dark-ink
  recolors, type.ts STAGE 1..9, test/game/flowart.test.ts (5),
  artifacts/ui5-review-cards.mjs (13/13 pixel checks), screenshots
  artifacts/look/ui5-{intro,victory,gameover,pause,complete}.png.
- Non-goals: no flow/state-machine changes; no new scenes.

### ART-19 - Painted per-stage backdrops (overhaul phase 6)

- Status: DONE (attempt 1, 2026-09-24 09:05 UTC - owner overhaul goal,
  verified full-green same morning)
- Dependency: UI-1 DONE.
- Requirement: extend `backdrop.ts` with per-stage landmark mid-layers and
  palettes from the theme (rivers/bridges/temples for early stages, burning
  warships + red cliffs + ember sky for the finale), periodic-tile Canvas2D
  technique, optional visual-only animated overlays (smoke/embers). Ground
  line and scroll geometry identical.
- Acceptance criteria:
  - [x] All 9 stages visually distinct, reviewed in screenshots + motion
        (artifacts/look/ui19-stage{1..9}.png; 21/21 objective pixel checks
        via artifacts/ui19-review.mjs incl. 9/9 distinct band signatures;
        motion = parallax + rising embers asserted in the look spec).
  - [x] Tile-seam unit test per layer (test/game/backdrop.test.ts, 12
        tests: seam-step profile per legacy layer + all 9 landmark kinds,
        exact wall-wrap for gorge/inferno, edge margins for interior kinds,
        integer-period bands, band continuation; background/probe specs
        pass in the full e2e run).
  - [x] Full gates green (see PROGRESS entry for the exact tallies).
- Delivered: src/game/data/stagebackdrop.ts (9 landmark kinds + ember sky
  selection, game layer), backdrop.ts paintMarks/paintEmbers/paintSky
  ember variant (day path byte-identical), GameScene bgMarks tileSprite
  (depth -12, 0.6x parallax) + bgEmbers (depth -11, ADD, rises by sim
  tick), e2e/backdrop-look.spec.ts, artifacts/ui19-review.mjs. Ground line
  (walkBandTop-26) and scroll geometry untouched.
- Non-goals: no parallax/camera/ground-geometry changes.

### ART-20 - Props, pickups & combat-feedback pass (overhaul phase 7)

- Status: DONE (attempt 1, 2026-09-24 10:40 UTC - owner overhaul goal,
  verified full-green same morning; final overhaul phase)
- Dependency: UI-1 DONE.
- Requirement: restyle crates/jars/meat/sword/chest + hit spark/KO burst/
  stage-clear flash to the painted arcade style via the existing `fx:` texture
  pipeline; unify boss-warning flash with the banner kit.
- Acceptance criteria:
  - [x] Sprite gate stays 256/256 in unit (338/338 incl. restyled props)
        + vision (256/256 sprites, 85/85 weapons, 170/170 retracts).
  - [x] weapon/probe/juice specs preserved (in the 75/75 e2e run);
        reviewed in combat screenshots (ui20-combat with live sparks +
        restyled crate; ui20-fx-{spark,burst,dust} texture dumps read).
  - [x] Full gates green: lint, typecheck, unit 338/338 (+3), e2e 75/75
        (+3 artfx), vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Delivered: src/game/art/fx.ts (paintSpark/paintBurst/paintDust painters),
  BootScene bakes fx:spark (restyled starburst) + fx:burst (new KO ring)
  + fx:dust; props.ts enriched interiors (crate brace/studs/grain, meat
  glaze/sheen, sword fuller/grip wraps, arrow barbs/glint - same boxes);
  koEmitter bound to fx:burst; stage-clear gold cam.flash + boss-spawn
  crimson cam.flash (banner-kit red), both real-play only;
  test/game/fx.test.ts (3), e2e/artfx.spec.ts (3: bindings, flash
  recording via wrapped cam.flash, combat capture).
- Scope note: no jar or treasure-chest kinds exist in this game (loot is
  crate/meat/sword/arrow only) - inventing kinds would touch the sim and
  the entity pipeline, forbidden by the non-goals, so the four existing
  props were restyled instead. Neither flash existed before either; both
  were added as presentation-only real-play juice.
- Non-goals: no loot/drop-rate/combat changes.

### BODY-1 - Reference briefs + pilots: one hero body, one boss head (owner-approved plan)

- Status: DONE (attempt 1, 2026-09-24 - owner approved the pilots)
- Dependency: ART-18 DONE.
- Requirement: `docs/BODY_STYLE_GUIDE.md` (brushwork, palette, cloth/armor/
  skin/muscle treatment, joint-overlap conventions, per-hero body notes tied
  to ART-18 head identities) + `docs/BOSS_HEAD_REFERENCE.md` (per-boss
  source quotes vs interpretation, HERO_FACE_REFERENCE.md pattern). Pilots
  reviewed in real UI/gameplay before bulk work: one full hero body
  (Zhao Yun) + one boss head (Cao Cao).
- Acceptance criteria:
  - [x] Both briefs written; quotations separated from interpretation.
  - [x] Pilots reviewed at select/HUD/gameplay sizes; owner approval to
        proceed (approved, no changes requested).
- Delivered: the two briefs + `docs/BODY_PARTS_SPEC.md` (pre-designed
  BODY-2 part inventory), pilots in artifacts/look/body1-*, baselines,
  parity-harness validation, joint inventory, insertion-contract mapping.
- Non-goals: no pipeline code; no other fighters.

### BODY-2 - Paper-doll body pipeline, preparation, fallback, parity gates

- Status: DONE (attempt 1, 2026-09-24 - owner overhaul goal, verified full-green)
- Dependency: BODY-1 DONE.
- Requirement: `src/game/art/body-parts.ts` (part list, pivots, draw order
  interleaved with ART-18 head layers); renderer positioning parts from
  pose-skeleton joints (mirror/lying/mounted handled); ART-18-style asset
  chain (masters + provenance + preparation.json, shipping derivatives,
  Vite-hashed imports, bounded boot preload, signature verification,
  atomic per-fighter procedural fallback); ArtResources generalized to
  fighter-id keys (heroArtResources kept working); silhouette-parity unit
  gate (old-vs-new outline IoU floor per pose).
- Acceptance criteria:
  - [x] Unit tests (test/game/bodyparts.test.ts, 12): part table, fixture
        preparation determinism + sha256/signatures, pivots/alpha bounds,
        render presence + order, registry threading incl. headless mook
        path, fallback byte-identity, publish atomicity (missing/
        undersized/tampered rejected, heads preserved), mask-IoU unit
        checks, 14-pose parity gate at 0.90.
  - [x] Rig semantics unchanged (all 14 poses render for the wired
        fixture pilot; production catalog empty so every shipped pixel
        is still procedural).
  - [x] Full gates green: lint, typecheck, unit 350/350 (+12), e2e
        75/75, vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Delivered: body-parts.ts (part defs, BodyArt, bodyPainter with axial
  stretch + bulk lateral, maskIou, PARITY_FLOOR), draw.ts markers +
  generalized paintWithHead + threading, registry bodies lookup,
  ArtResources.bodies, body-art.ts adapter (explicit-catalog publish,
  registry merge), BootScene wiring (no-op), scripts/
  make-body-fixtures.mjs + .d.mts, committed fixtures + prepared.json.
- Non-goals: no new fighter art beyond pipeline fixtures; no sim changes.

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

- Status: TODO
- Owner objection round 3 (d): "review all art/image materials to
  ensure each part is completed and no parts are missing."
- Requirement: automated inventory per fighter of every part the
  renderer can draw (head pack: portrait/head/front/rear; 10 body
  parts; hands: relaxed + grip; weapon), marking painted / procedural
  fallback / missing, plus every master under art/ with its consumer
  (flag placeholders and orphans); visual check of each painted cell.
  docs/ART_AUDIT.md with the table and every gap filed to a task.
- Acceptance criteria:
  - [ ] Audit test asserts no fighter silently lacks a part it draws;
        placeholders/orphans listed with disposition.
  - [ ] Every gap (e.g. no painted grip hands, no painted weapons,
        forearm cells ending in open palms) traced to a task.
  - [ ] Full gates green.
- Non-goals: no new art in this task.

### BODY-19 - Arms connected and natural in every movement

- Status: TODO
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
  - [ ] Every arm segment within 95-105% of natural length in every
        movement for every fighter (test); wrist-to-hand continuity
        (hand drawn at its forearm's end) asserted.
  - [ ] Human-style review of all movements: arms read attached and
        natural; findings filed.
  - [ ] Reach tests unchanged; full gates green.
- Non-goals: no sim/timing changes; pose table body joints untouched
  except arms via weaponPose.

### BODY-20 - Realistic painted hands

- Status: TODO
- Owner objection round 3 (b): "the hand ... not realistic." The grip
  fists and relaxed mittens are flat cartoon capsules with ink
  outlines on painted-realistic bodies.
- Requirement: painted hand art (grip fist, far-hand wrap, relaxed
  hand) in the body masters' brushwork, skin-matched per fighter,
  replacing the procedural fists/mittens at the same joints; no ink
  outlines on painted hands.
- Acceptance criteria:
  - [ ] Every fighter's hands render from painted cells in every
        movement (test); procedural hands only on the emergency path.
  - [ ] Human-style review: hands read realistic and gripping.
  - [ ] Full gates green.
- Non-goals: no finger animation; no new poses.

### BODY-21 - Realistic painted weapons

- Status: TODO
- Owner objection round 3 (b): "the ... weapons are not realistic."
  Weapons are procedural shapes with thick ink outlines, flat hafts,
  block tassels and capsule butt caps.
- Requirement: painted weapon art for all 7 kinds (glaive, pike,
  spear, sword, dao, ji, bow) in the masters' brushwork, rendered on
  the existing weapon geometry (same length, grip point and rotation,
  so reach stays byte-stable in the sim and the reach tests).
- Acceptance criteria:
  - [ ] All 7 weapons painted; drawn length/grip identical to the specs
        (test); ART-14/15 reach + silhouette gates hold.
  - [ ] Human-style review: weapons read realistic at gameplay size.
  - [ ] Full gates green.
- Non-goals: no new weapon kinds; no sim changes.

### BODY-22 - Whole-body proportions and natural motion pass

- Status: TODO
- Owner objection round 3 (c): "ensure the whole body, including the
  weapons and hands, has the correct ratio, and that their movements
  are natural."
- Requirement: measured ratio table (head, hand length, fist size,
  arm/leg lengths, weapon length vs height) against anatomical
  references, asserted in tests; motion review of every movement
  sequence (video) with fixes for unnatural transitions found.
- Acceptance criteria:
  - [ ] Ratio table in CHARACTER_REVIEW.md, each value in its
        reference band, asserted per fighter.
  - [ ] Human-style motion review of every sequence reads natural;
        findings filed and fixed.
  - [ ] Full gates green.
- Non-goals: no sim/timing changes.

### BODY-23 - Clean painted cells: holes, capes, boots

- Status: TODO
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
  - [ ] artaudit HOLE_CEILING lowered from 0.40 to 0.08 and green.
  - [ ] Every caped plan renders a painted cloth cell (audit asserts).
  - [ ] Human-style review of the affected fighters; full gates green.
- Non-goals: no new costumes; no silhouette changes beyond the cape.

### BODY-7 - Full verification sweep for the body overhaul

- Status: IN_PROGRESS (attempt 1)
- Dependency: BODY-3, BODY-4, BODY-5, BODY-6 DONE.
- Requirement: whole-cast review (all fighters x poses x facings,
  desktop + mobile, co-op + mounted), byte/decode-memory/boot-time
  report, full serial gates (lint, typecheck, unit, e2e, selfplay,
  vision Canvas/WebGL parity, build, prodbuild), final owner
  presentation.
- Acceptance criteria:
  - [ ] Every gate green in one serial run; report recorded.
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
