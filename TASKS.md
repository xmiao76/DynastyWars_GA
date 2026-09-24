# Work Queue

Statuses: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`.

The loop processes tasks from top to bottom and works on only one task per iteration.

Keep this file short. Once more than 20 tasks are `DONE`, move the oldest of them
to `TASKS-ARCHIVE.md`; every iteration reads this file to find the first `TODO`,
and scanning a long tail of finished work costs something each time.

## Enhancements

Add future enhancement tasks below this heading.

### ART-18 - Natural painted hero faces faithful to the legend (renewed owner request)

- Status: DONE (attempt 2; approved redesign, owner priority over ENH-12)
- Requirement: replace the five heroes' mask-like portraits AND compressed
  gameplay heads with original semi-realistic painted warriors. Existing art
  geometry/shading is not a constraint. See docs/HERO_FACE_REFERENCE.md and
  docs/HERO_FACE_REDESIGN_PLAN.md. ART-16/17 were incremental fixes, not owner
  acceptance of convincing natural likeness.
- Confirmed owner choices (2026-09-23): semi-realistic painted warriors;
  Wei Yan follows the novel's 面如重枣, superseding the old tan exception.
- Acceptance criteria:
  - [x] Source-backed reference brief separating quotations from interpretations.
  - [x] Guan Yu/Zhao Yun pilot reviewed at real select/HUD/gameplay sizes.
  - [x] Original, coherent portraits and neutral/exertion/hurt gameplay heads
        for Guan Yu, Zhang Fei, Zhao Yun, Huang Zhong and Wei Yan; natural anatomy,
        distinct ages and identities, matching headgear, skin and facial hair.
  - [x] Typed, versioned assets, deterministic preparation, safe head/neck pivots,
        ordered rear/head/front-beard layers and unchanged 14-pose rig semantics.
  - [x] Atomic per-hero fallback; no legacy manifest/stale asset overwrite;
        optimized committed assets really load in production.
  - [x] Shipping-path tests plus negative controls (missing/blank/swapped faces,
        erased features, displaced pivots); no weakened regression gates.
  - [x] Native-size before/after sheets and motion review in both facings,
        including attacks/down/mounted/co-op, desktop and mobile.
  - [x] Full lint/typecheck/unit/e2e/signal/vision/prodbuild/build green; report
        size/memory/performance. Do not equate green tests with visual approval.
- Evidence: docs/HERO_FACE_REFERENCE.md, docs/HERO_FACE_REDESIGN_PLAN.md,
  art/hero-faces/ (10 masters + PROVENANCE.md + preparation.json),
  test/game/hero-faces.test.ts (77), e2e/hero-faces.spec.ts (3),
  artifacts/look/art18-pilot-sheet.png (5 heroes, both facings),
  artifacts/look/art18-mobile-{select,weiyan,huangzhong}.png.
  Full gates 2026-09-23: lint + typecheck pass; unit 284/284; e2e 56/57 with one
  timing flake (game.spec special-pose) passing alone; vision 5/5 incl. 256/256
  sprites and parity; selfplay 13/13, marathon numbers identical to the standing
  snapshot; prodbuild 4/4; vite build pass. Runtime images 2.13 MB; decoded
  sources ~10.6 MB transient; generated texture count unchanged.
  Presented to the owner for visual acceptance in the loop digest; any objection
  reopens this as a new iteration.
- Non-goals: no combat/balance/weapon/control/animation-state changes; no boss,
  NPC, environment or full-body redesign; no push/deploy/schedule/control edits.
- Checkpoints: pilot first, remaining heroes next, technical + visual verification
  last. If unfinished, retain IN_PROGRESS and exact evidence; don't auto-complete.

### ART-17 - Heroes and bosses do not yet look as the histories describe them (owner request, part 2)

- Status: DONE
- Requirement:
  Second half of the 2026-09-22 owner request ("for every hero and boss,
  enhance their appearance to make them look just like they were described in
  the legendary history"). ART-16 fixed what made every face unnatural; the
  per-character likeness is still mostly colour. Measured on
  `artifacts/look/faces-final-portraits.png` and `closeup-final.png`:
  lidian, caoren, zhangliao and zhanghe share one face and differ only in hat
  colour; Cao Cao and Lu Bu wear the identical `crown` shape; the in-play head
  shows every character the same brow/eye/mouth marks. Bosses have NO portrait
  in play, so boss likeness must land on the in-play sprite.
- Sources (三国演义 descriptions, to cite per change):
  Guan Yu 身长九尺, 髯长二尺, 面如重枣, 唇若涂脂, 丹凤眼, 卧蚕眉;
  Zhang Fei 身长八尺, 豹头环眼, 燕颔虎须; Zhao Yun 身长八尺, 浓眉大眼, 阔面重颐;
  Huang Zhong aged, white-haired; Cao Cao 身长七尺, 细眼长髯;
  Lu Bu 头戴三叉束发紫金冠 (with 雉尾 plumes), 西川红锦百花袍;
  Xu Chu 身长八尺余, 腰大十围; Xiahou Dun lost his left eye.
- Acceptance criteria (each a falsified gate or a before/after sheet):
  - [x] Lu Bu's headgear is its own shape (三叉紫金冠 with two plumes), and its
        portrait/sprite silhouette differs from Cao Cao's crown by a measured margin.
        (`plumed`; likeness.test.ts: sprite reach 2.08R -> 3.63R vs Cao Cao 2.05R, gate > 1R.)
  - [x] Zhang Fei's beard is bristling (虎须: jagged outline), not the smooth wedge.
        (`bristle`; likeness.test.ts: portrait beard edge reversals 0 -> >= 4.)
  - [x] Guan Yu's lips read red (唇若涂脂) and his beard reaches the chest.
        (plan `lips` 0xc81e30; portrait lip-minus-cheek redness -19.5 -> +53.5,
        gate > 40. Sprite long beard now also falls in front of the pauldron and
        arm: visible end 8.7 -> 18.5 units below the chest joint, gate > 14.)
  - [x] Zhao Yun's brows are the heaviest of the fair-skinned cast (浓眉) and his
        eyes the largest non-fierce eyes (大眼), with a broader jaw.
        (face `bold`: browWeight 1.5, the cast maximum; eye area 1.35 and eyeW
        1.18, largest short of `fierce`; plan `jaw` 1.1 widens the portrait's
        lower head: measured jaw row 1.014x -> 1.108x Wei Yan's, gate > 1.06.)
  - [x] Cao Cao's eyes are the narrowest in the cast (细眼, eyeAspect gate).
        (`narrow` face: eyeAspect 3.4 / eyeH 0.66, both extremes of the cast.)
  - [x] The four "generic" bosses are pairwise distinct on the in-play head by a
        measured face-region difference, not by hat colour alone.
        (Zhang He `sharp`, Cao Ren and Zhang Liao bearded. Shape-only face-region
        difference, every colour equalised: min pair 0.00% (lidian/zhanghe) ->
        3.64%, zhangliao/zhanghe 1.39% -> 10.64%; gate > 2.5% for all six pairs.)
  - [x] Troops keep the plain face and shared skin; all existing gates green.
        (likeness.test.ts asserts no face/skin/lips/jaw on the three troops.)
- Non-goals:
  - No combat, reach, damage, collision or timing change. No new animation states.
  - No PORTRAIT_BOX/TEXTURE or display-size change; no gradients on sprites.
  - Wei Yan's complexion stays owner-decided (see ART-16).

### ART-16 - Every face looked unnatural: hollow shapes and a grey smudge (owner request, part 1)

- Status: DONE
- Requirement:
  Owner request 2026-09-22: "Review all the character faces ... enhance them
  to make every face look natural." Reviewed every portrait and in-play head
  (17 kinds) against a human face rather than against the previous art. Two
  cast-wide ROOT CAUSES, both pre-existing since the first commit 7d574d2:
  1. `limbPath` and `chainPath` (rig.ts) traced their two sides CROSSED - the
     first arc ends at a - n*w/2, and the path then ran to b + n*w/2 - so every
     shape was a bow-tie and the nonzero fill left its middle empty. Measured on
     a 60->40 limb, the middle column filled 0 px (now 50); a bent chain 19/40/20
     (now 46/40/36). Every in-play brow, mouth and nose is a limb path, which is
     why they rendered as broken commas; it also hollowed torsos, limbs, sashes,
     belts, hafts and the horse. The ink stroke hid most of it.
  2. Every portrait gradient faded to 'rgba(0,0,0,0)'. Canvas interpolates
     stops unpremultiplied, so the fading edge of the bridge HIGHLIGHT and of
     both eye sockets was translucent near-black: a grey-brown ring round the
     eyes and down the nose on all 17 portraits. Bridge/forehead luma ratio was
     0.81-0.91 (a smudge); now 1.005-1.05.
- Changes:
  - rig.ts: the side lines fixed in both primitives.
  - portrait.ts: fades end in a transparent copy of their own colour; the socket
    moved up under the brow ridge and softened; a forehead-lift gradient (lit
    frontal bone) keeps the forehead from reading flat; the nose wings no longer
    run from eye level (they drew a paper triangle), plus a tip highlight.
  - poses.ts `DOWN.weaponRot` 0.16 -> -0.34: with SOLID hafts the dropped weapon
    lay across the prone body (caoren/caocao/lubu legibility 0.087-0.137 <
    0.15); now the weapon falls clear as the pose comment already said (0.372+).
  - figures.ts Guan Yu `TALL.height` 1.03 -> 1.06 (身长九尺, a head above
    Zhang Fei/Zhao Yun's 八尺). With filled bodies guanyu/weiyan silhouettes
    were only 9.4% apart (< 0.1 gate); the old 15.8% came from hollow torsos.
    Now 11.8%. Visual only: combat lives in src/core and is untouched.
- Acceptance criteria:
  - [x] New `test/game/rig.test.ts` fails on the original rig.ts (0, 0, 16 px)
        and passes with the fix.
  - [x] New portrait gate "keeps the bridge between the eyes lit" fails on HEAD
        portrait.ts (guanyu 0.914 < 0.96) and passes on all 17 kinds.
  - [x] No gate threshold weakened; forehead-range gate kept at 5 and met by
        real form (the smudge had been supplying its variation).
  - [x] Before/after sheets reviewed: `artifacts/look/faces-before-portraits.png`
        vs `faces-final-portraits.png`, `closeup-before*.png` vs `closeup-final.png`.
  - [x] lint, tsc, unit 200/200, e2e 54, vision 5/5 (256/256 sprites, 85/85
        weapons, 170/170 retracts), selfplay 13, prodbuild 4, build.
- Non-goals: per-character likeness (ART-17); no PORTRAIT_BOX/TEXTURE,
  display-size, in-play gradient, combat or troop-face change.

### ART-15 - Legend-faithful silhouettes for all five heroes

- Status: DONE
- Requirement:
  Implement the owner's approved five-hero weapon plan in the existing
  cel-shaded style. The captured baseline shows paddle-shaped guandao/dao
  blades, a thick curled serpent head, a weak spear ridge and an off-centre bow.
  This approved scope replaces the earlier two-blade-only ART-15 constraints.
- Acceptance criteria:
  - [x] Shared internal weapon paths support isolated silhouette tests.
  - [x] Guan Yu: elongated asymmetric crescent, sharp point, restrained rear spur.
  - [x] Zhang Fei: slender S-shaped spear blade; existing long shaft retained.
  - [x] Zhao Yun: narrow symmetrical point, central ridge and readable edge.
  - [x] Huang Zhong: slimmer recurve, distinct string, grip centred in his hand.
  - [x] Wei Yan: elongated dao, straighter spine, angled point and controlled belly.
  - [x] The old three malformed blades and off-hand bow fail regression controls.
  - [x] All 17 shared fighters, 11 poses and both facings keep weapons off faces.
  - [x] Matching before/after sheets, desktop/phone attacks and gameplay reviewed.
  - [x] Existing scale, clipping, reach, tassel, visual parity and full project gates pass.
- Non-goals:
  - No combat reach, damage, collision, timing, character-scale or assignment changes.
  - No new animation states; Huang Zhong keeps melee attacks and his arrow special.
  - No deployment or push. Existing jian/ji blade geometry is retained.
- Evidence:
  - artifacts/weapon-review/weapon-shapes-before.png and weapon-shapes-after.png.
  - Negative-control paths captured from local baseline commit 1e5e3f4.
  - References: https://anthony.sogang.ac.kr/ThreeKingdoms/bc001.htm
    and https://en.wikipedia.org/wiki/Guandao
### ART-14 - The weapon silhouettes are wrong: guandao, serpent spear, dao

- Status: DONE
- Requirement:
  Third round on weapons. Owner re-tested and says the SILHOUETTES are still
  wrong, naming 张飞's serpent spear, 关羽's crescent blade and 魏延's dao, plus
  "all of them roughly equally". Reference-checked (Wikipedia guandao) and
  confirmed three concrete errors in my own ART-12/13 paths:
    - crescent: I drew a SYMMETRIC two-pronged crescent (horn and flare both
      at fore+13, both pointing forward). The real 偃月 profile is a STRAIGHT
      back edge with a small spike pointing BACK toward the shaft, and a
      convex cutting edge sweeping forward to the point
    - serpent: a 25-unit blob with two gentle waves. The 蛇矛's whole identity
      is a long, clearly S-curved serpentine blade - amplitude was ~4x too
      small to read as a snake
    - dao: rounded dome tip and a circular belly, where a 大刀 has a straighter
      spine and an ANGLED point
- Acceptance criteria:
  - [x] New crescent: straight back, backward top spike, forward-swept point
  - [x] New serpent: long S-curve, amplitude +-10, pointed tip at fore+22
  - [x] New dao: straighter spine, angled corner point, deep belly
  - [x] Ji wings redrawn as forward crescents (family coherence)
  - [x] Calibrated POSE_REACH probe: attack 55->59, attack2 39->41, special
        54->59 (Zhang Fei's serpent now drives all three); windup 9->8,
        recover 19->18, jump 20->18, hurt 9->8 (the new crescent's horn is
        shallower than the old -20). Serpent tip drawn first to fore+25, which
        measured 26 above the pose space in walk0 against a 24-unit HEADROOM
        and clipped - pulled back to fore+22 so HEADROOM stays shared
  - [x] All 30 gates green; sheet + in-situ swing captures judged by eye;
        full PROJECT.md sequence green
- The honest remaining gap, stated rather than hidden:
  At in-game size the serpent reads as a clearly wavy blade and the guandao as
  an asymmetric crescent with a back spike, but both are still cel cutouts -
  the reference weapons have a butt counterweight, socket collar and rings that
  these do not. The owner identified silhouette rather than missing details, so
  those parts were deliberately NOT added this round.
- Non-goals:
  - No weapon-length changes, no butt counterweight/rings (owner identified
    silhouette, not missing details), no change to Zhao Yun's leaf, the bow,
    the jian, or the tassel; no shading work.

### ART-13 - The spear reads as a spoon and the dao as a paddle (owner re-test)

- Status: DONE
- Requirement:
  Owner re-tested ART-12: the spear and the big knife still do not read as
  real weapons. Diagnosed on the in-game screenshot: the spearhead is a
  symmetric pale OVAL (a spoon, no point) and its tip sits at the wielder's
  CHIN in idle, where a real spear towers; the dao head is a small rounded
  paddle where a 大刀 must be a big broad single-edged blade; and tassels point
  with the weapon instead of hanging under gravity.
- Acceptance criteria:
  - [x] Willow-leaf spearhead: pointed both ends, 26 long x 8 wide, midrib
        crease; tip towers ~10 units above the pose space in idle carry
  - [x] Dao blade broadened to crescent-class weight (26 span), flat spine,
        deep curved belly at the tip end; dao gained the 红缨 tassel (count 12)
  - [x] Tassel hangs world-down at every weapon angle (counter-rotated);
        verified hanging along the haft at idle and below the shaft at attack
  - [x] Calibrated POSE_REACH probe: table holds EXACTLY (55/39/9/19/20/
        27/9/54, tops unchanged) - the extensions fit inside existing margins
  - [x] Sheet + zoom plates judged by eye; falsified by disabling the tassel
        draw (gate fails 0-2 px vs floor 30); full PROJECT.md sequence green
- The gate that earned its keep:
  The first broadened dao put steel across Wei Yan's brow at idle - the spine
  curve's control point pulled the blade across the forehead - and the ART-7-era
  face-on-skin gate failed it ("the brow has 140,143,156 above it, not skin").
  Fixed by following the crescent's rule: keep the DEEP span at the tip end,
  where the shaft has already leaned clear of the head; shallow spine heel.
- Non-goals:
  - Crescent, serpent, ji, recurve untouched; no weapon-length changes; no
    pose or core changes.

### DIFF-1 - The measured difficulty curve is uneven in three places

- Status: DONE
- Owner decision, 2026-09-22: ACCEPT THE SHAPE AND CLOSE. The owner
  reviewed the re-scored evidence and chose to keep the curve as-is:
  stage 3's wall is the stage-2 mount reward ending plus intended enemy
  escalation (spearmen/archers) - design-shaped, hero-texture (the heavy
  build copes best), not a defect. No balance change was made. The
  review also re-scored the findings against TODAY's post-ENH-10
  marathon (the filed tables predate the arrow rework): the stage-3
  wall persisted (+88% over stage 2 in Zhao Yun's current table), and
  his stage-5-dip / stage-8-over-finale quirks persisted in his table
  only - the 2026-09-19 cross-hero verdicts stand unchanged (findings
  2 and 3 were Zhao-Yun artifacts).
- Requirement:
  Producer measurement, not a complaint: the self-play bot drove Zhao Yun
  through all nine stages at TWO seeds (42 and 7), and both runs agree on
  where the curve departs from the designed one. Designed content per stage
  (from `src/core/stage.ts`): mobs 12, 18, 19, 23, 27, 27, 28, 28, 29 across
  waves 3, 4, 4, 5, 5, 5, 5, 5, 5.

  Measured clear time and continues spent (mean of both seeds):

    stage   mobs   seed42   seed7   mean    vs previous stage
    1        12     59.0s     0      68.8s/1    -
    2        18     62.6s     0      64.4s/0   +0%
    3        19     91.8s/2   85.2s/1  88.5s   +40% time for +1 mob
    4        23     90.0s/1   93.4s/1  91.7s   +4%
    5        27     71.8s/1   64.2s/1  68.0s   -26% (a dip)
    6        27     86.2s/0  119.4s/2 102.8s   +51%
    7        28     85.8s/1  101.4s/2  93.6s    -9%
    8        28    132.6s/2  114.0s/2 123.3s   +32% (the peak)
    9        29     111.8s/2  98.8s/0 105.3s   -15% (finie easier than 8)

  Both seeds agree on three findings, so they are properties of the stages
  and not of one run:
    1. STAGE 3 IS A WALL. One more mob than stage 2 costs 40% more time and
       the most continues of the early game. The stage data explains it:
       stage 2 grants a horse, stage 3 does not, and adds spearmen and
       archers. The jump is carried by the mount withdrawal.
    2. STAGE 5 IS A DIP. 27 mobs - as many as stage 6 - but the fastest clear
       of stages 3-9 in both runs.
    3. STAGE 8 OUTLASTS THE FINALE. 123.3s mean against 105.3s for stage 9,
       the only place the curve descends at the end. The penultimate stage
       peaks instead of the last one.
  Caveat stated plainly: this is one bot at two seeds. A bot is not a
  player, and none of this says what the curve SHOULD be - only where it is
  uneven against itself.
- NEW EVIDENCE, 2026-09-19. The caveat this task filed itself with - "one bot
  at two seeds" - turned out to matter more than the findings. Two OTHER heroes
  driven through all nine stages at the SAME seed 42, so the runs are directly
  comparable:

      stage    Zhao Yun (filed)   Guan Yu   Zhang Fei
      1              59.0 / 0      42.6/0      41.6/0
      2              62.6 / 0      49.4/0      54.0/0
      3              91.8 / 2      85.4/0      63.8/0
      4              90.0 / 1      72.0/0      73.2/0
      5              71.8 / 1      67.8/0      85.6/1
      6              86.2 / 0      73.0/1      69.0/0
      7              85.8 / 1      85.6/1      83.0/1
      8             132.6 / 2      77.2/0      89.2/0
      9             111.8 / 2      99.8/1     101.4/1

  Against the three findings as filed:
    1. STAGE 3 IS A WALL - HOLDS, and is the only one that does. Stage 2 to 3
       costs +47% for Zhao Yun, +73% for Guan Yu, +18% for Zhang Fei. Two of
       three heroes take a large jump, which is consistent with the stated
       cause (stage 2 grants a horse, stage 3 does not, and adds spearmen and
       archers). Zhang Fei feeling it least is consistent with his being the
       HEAVY build.
    2. STAGE 5 IS A DIP - DOES NOT HOLD. Zhao Yun -20%, Guan Yu -6%, and Zhang
       Fei +17%, which is a RISE. This was a property of Zhao Yun, not of the
       stage.
    3. STAGE 8 OUTLASTS THE FINALE - DOES NOT HOLD. It is Zhao Yun only. For
       both other heroes stage 9 is the longest stage of the nine, which is
       the designed shape: Guan Yu 77.2 then 99.8, Zhang Fei 89.2 then 101.4.

  So the decision this task is waiting on is SMALLER than it looked: one
  anomaly to consider rather than three, and it is the one with a named cause
  already in the stage data.
- The measurements also still STAND: `git log src/core` since they were filed
  is empty, and the sim is deterministic, so nothing about the curve has moved
  in fifty-odd commits.
- Acceptance criteria (when unblocked):
  - [x] Owner has chosen: accept the shape and close this task
        (2026-09-22).
  - [x] No change was made (accepted as-is), so no before/after
        re-measurement applies; the standing signal snapshots stayed
        green throughout (13/13 across today's ticks, tables recorded
        in PROGRESS.md).
  - [x] `npm run signal` green throughout on the current build - and
        deliberately unchanged: no stage data was touched.
- Non-goals:
  - No balance change without that owner decision.
  - No change to heroes, enemies' stats in isolation, or AI - stage content
    (`waves`, `bossKind`, mounts) is the lever this data points at.

### GATE-3 - Determinism is documented everywhere and enforced nowhere

- Status: DONE
- Requirement:
  The sim's determinism is this project's load-bearing constraint. PROJECT.md:
  "The simulation must be deterministic: seeded RNG plus fixed 1/60s timestep;
  no `Math.random` or wall-clock time in core logic." `src/core/rng.ts:4`:
  "The simulation must never call Math.random". Every seeded test, the whole
  signal suite and the replay guarantee rest on it.

  Nothing enforces it. `eslint.config.js` restricts IMPORTS into `src/core`
  (phaser and `**/game/**`, which is how the "pure TypeScript core" half is
  kept true) and says nothing about randomness or the clock. `Math.random`,
  `Date.now` and `performance.now` are all live elsewhere in `src/`, so this is
  one careless line from being wrong, and the failure would not be a lint error
  or a crash - it would be a seeded run that quietly stops reproducing.
  `src/core` is clean today; the point is that nothing keeps it so.

  Found by checking whether the constraints PROJECT.md states are actually
  gated, after REFACTOR-1 moved core code between files.
- Acceptance criteria:
  - [x] `no-restricted-properties` for `Math.random`, `Date.now` and
        `performance.now`, plus `no-restricted-globals` for `Date` - which is
        what catches `new Date()` as well as `Date.now()`. Scoped to
        `src/core/**` only
  - [x] Messages name the alternative: "draw from the injected sim.rng
        instead" and "use sim.tick, not the wall clock"
  - [x] Proven able to fail ONCE PER API rather than once overall, because a
        single combined probe can pass on one rule while another does nothing:
          Math.random()        -> 'Math.random' is restricted from being used
          Date.now()           -> Unexpected use of 'Date'
          performance.now()    -> 'performance.now' is restricted from being used
          new Date().getTime() -> Unexpected use of 'Date'
  - [x] `src/` unchanged - confirmed by `git status` after the probes, so the
        falsification left nothing behind. The game layer keeps both APIs,
        which it legitimately needs for frame pacing and menu flourishes
  - [x] lint, typecheck, 142 unit, build. The browser suites were not re-run
        and did not need to be: only `eslint.config.js` changed, which cannot
        affect anything at runtime, and no file under `src/`, `test/`, `e2e/`,
        `vision/` or `prodbuild/` was touched - the tree is byte-identical to
        4626e8b, where all of them were green
- Non-goals:
  - No code changes to `src/core`. It is already clean; this is about keeping
    it that way.

### REFACTOR-1 - src/core/sim.ts is 978 lines against the project's own 800

- Status: DONE
- Requirement:
  `src/core/sim.ts` is 978 lines. This project sets itself 800 - it is why
  `GameScene` was split during UI-R2, at 951 - and sim.ts has been past it for
  some time. I recorded it as a known overage twice rather than acting on it,
  because it is the determinism-critical core and a line count is not by itself
  worth risk. Doing it now on the owner's say-so, as a PURE MOVE: no logic
  edits, and the seeded signal suite is the proof.
- Acceptance criteria:
  - [x] 978 -> 784 lines, and `git diff --stat` over `src/` shows exactly one
        modified file and three new ones: no caller changed, because `sim.ts`
        re-exports everything it moved
  - [x] Pure moves. `src/core/simtypes.ts` (66) holds the `Sim` shape,
        `src/core/snapshot.ts` (132) the JSON read model, `src/core/players.ts`
        (78) the pure queries
  - [x] No runtime cycle. Extracting `Sim` into its own module REMOVED a
        workaround rather than adding one: without it, `players.ts` and
        `snapshot.ts` each had to type-import `sim.ts`, which works only
        because the import is erased at runtime and stops working the moment
        anyone needs a value from it. All three now depend on the state, not
        the engine
  - [x] `joinPlayer2` and `tryRevivePlayer` deliberately stayed in `sim.ts`
        despite belonging with the other player functions by name. They need
        the engine-private `spawnEntity` and `enterState`, and exporting those
        to move two functions would have put a genuine runtime cycle through
        the code the sim's determinism rests on
  - [x] signal 13/13 - and stronger than that. "Passed" only proves the
        invariants held, so identity was measured directly: the same three
        seeds driven through 900 ticks of varied input (movement, attacks,
        jumps, specials), digesting the full entity list, positions, HP,
        states and stats, give byte-identical results before and after:
            zhaoyun/42/stage1  957686d7
            guanyu/7/stage4    bf2f2436
            weiyan/99/stage9   eed635ad
  - [x] lint, typecheck, 142 unit, 43 e2e, vision 5/5, prodbuild 4/4,
        signal 13/13, build
- Non-goals:
  - No behaviour change, no API change, no renaming. If a caller has to be
    edited, the split was wrong.

### FIX-6 - The production build strips the viewport-height fallback

- Status: DONE
- Requirement:
  FIX-4 gave `#game` a definite height as two declarations:

      height: 100vh;
      height: 100dvh;

  which is the standard way to say "use the dynamic viewport where it exists,
  otherwise the static one". The production CSS minifier treats the pair as a
  duplicate property and keeps only the last. Shipped output:

      #game{...;height:100dvh;display:flex}

  A browser without `dvh` - iOS Safari 15.3 and earlier - drops that
  declaration as invalid, and with no other height `#game` falls back to auto.
  That is exactly the state FIX-4 fixed: `Scale.FIT` measures a box that can
  grow, fits to width, and on a phone in landscape pushes the bottom of the
  game and its controls off screen.

  Every check of FIX-4 and FIX-5 so far ran against the DEV server. PROJECT.md
  is explicit that `dist/` is what deploys and that the two genuinely differ,
  which is the whole reason `npm run prodbuild` exists; this is that difference
  biting the most important fix of the session.
- Acceptance criteria:
  - [x] The `dvh` value moved into its own `@supports` rule. Shipped output now
        carries both: `#game{...height:100vh;display:flex}` and
        `@supports (height:100dvh){#game{height:100dvh}}`
  - [x] Verified against `dist/assets/*.css`, not the source
  - [x] The built site measured through `vite preview` at both orientations:
        portrait canvas 412x232 of 412x839, landscape 640x360 of 863x360, seven
        control zones on screen in each, nothing overflowing
  - [x] New prodbuild gate asserting both halves, because neither implies the
        other: the browser running these tests supports `dvh` and would pass
        the layout check on the enhancement alone
  - [x] Both halves proven able to fail INDEPENDENTLY:
          restoring the two-declaration form -> "the shipped CSS has no
            dvh-independent height for #game", with the received string showing
            `height:100dvh` alone
          `min-height: 100vh` with the @supports intact -> same failure
          `Scale.NONE` with the CSS untouched -> "portrait: the shipped canvas
            does not fit - viewport 549x1118, canvas 960x540"
  - [x] A flaw in my own first assertion, caught while falsifying it rather
        than after: `toContain('height:100vh')` also matches
        `min-height:100vh`, so the gate would have passed on the exact bug
        FIX-4 fixed. Anchored to a declaration boundary instead
  - [x] lint, typecheck, 142 unit, 43 e2e, vision 5/5, prodbuild 4/4,
        signal 13/13, build
- Non-goals:
  - No minifier configuration. The fix is to write CSS the minifier cannot
    misread, not to argue with it.

### ENH-4 - Per-weapon hero moveset data, strike mapping, and unit tests

- Status: DONE
- Requirement:
  All five heroes share identical frame data (`defineHeroAttacks` in
  `src/core/attacks.ts`: jabs 6/4/10, finisher 8/5/16 — only damage/reach
  numbers differ), so a pike thrust and a blade sweep feel identical. Give
  each hero weapon-true per-hit frame data (startup/active/recover,
  knockback/knockdown, reach/arc per jab1, jab2, finisher), keeping the
  3-hit chain, jumpkick, special, and all enemy defs unchanged:
    - Guan Yu, glaive (heavy sweeps): slowest chain, wide arc; e.g. jabs
      8/5/12 arc 12, finisher overhead chop 12/6/20 with knockdown.
    - Zhang Fei, serpent pike (longest, thrust-first): longest reach, narrow
      arc; quick thrusts 5/4/9, finisher wide sweeping knockdown 10/6/18.
    - Zhao Yun, spear (fast agile): fastest chain 5/3/8, lowest damage/hit.
    - Huang Zhong, bow (veteran archer): compact short-range melee, moderate
      speed; arrow special untouched.
    - Wei Yan, dao (chopping blade): slow heavy chops 9/5/14, high damage,
      long recover; finisher big knockdown chop.
  Exact numbers are the implementer's within these identities. Replace the
  `.jab2`-suffix pose rule in `poseForEntity` (`src/game/adapters/sprites.ts`)
  with a `STRIKE_POSE` table keyed by full attack id, initially mapping to
  current behavior (jab2→attack2, everything else→attack); per-hero triples
  land in ENH-5 with the new poses. Fix the self-play bot (`selfplay/bot.ts`,
  two call sites) to space off the DRIVEN hero's own `combo[0]` def instead
  of hard-coded `zy.jab1`.
- Acceptance criteria:
  - [x] Before editing, `npm run signal` is recorded in PROGRESS.md as the
        ENH-4 baseline marathon table (stage times/continues per hero).
  - [x] New `test/core` assertions: per-hero frame data differs as designed
        (e.g. zhaoyun chain total < guanyu; zf.jab1 longest reach); every def
        keeps `totalFrames > 0`; full-combo DPS per hero within ±10% of its
        current value, computed in-test (no hand-waving).
  - [x] `sprites.test.ts`: table-driven selection proven (mapping decides,
        not the suffix); phasing boundaries per new frame datum; fallback to
        `attack`/`special` for enemies, mounted sweep, unknown ids preserved.
  - [x] Bot own-def spacing covered by a targeted test; `npm run signal`
        still 13/13 (bot viable with every hero).
  - [x] Each new assertion proven able to fail against the old tables/data.
  - [x] lint, typecheck, unit green. No `sim.ts` logic changes (data only).
- Non-goals:
  - No new poses or art-gate changes (ENH-5). No jumpkick, special, enemy,
    or mounted-sweep changes. No DIFF-1 smoothing: record balance deltas,
    do not chase them.

### ENH-5 - Weapon-true strike poses (thrust/chop/sweep) and art gates

- Status: DONE
- Dependency: do not start until ENH-4 is DONE. If reached earlier, mark
  this BLOCKED with reason "waiting on ENH-4" and implement nothing.
- Requirement:
  Author at most three new shared strike poses in `src/game/art/poses.ts`:
  `thrust` (deep lunge, weapon level), `chop` (high-to-low cut on a steep
  forward diagonal, inside HEADROOM 27 — never truly overhead), `sweep`
  (low crouched wide swing). Repoint ENH-4's `STRIKE_POSE` table so each
  hero's (jab1, jab2, finisher) is three distinct poses and no two heroes
  share the same ordered triple. Register names in `sprites.ts` POSES,
  calibrate per-pose `POSE_REACH` by measurement (no 57 fallback), extend
  the hardcoded strike lists and distinctness PAIRS in
  `test/game/artquality.test.ts`.
- Acceptance criteria:
  - [x] Reach gate: every new strike beats idle by ≥ MIN_WEAPON_REACH_PX
        for every armed kind. Retract gate: windup/recover strictly narrower
        than EACH new strike. Distinctness: each new strike vs idle, windup,
        recover, and sibling strikes, all above the floor. No floor moved.
  - [x] Face-clearance (all kinds × poses × facings), no-clip, centering,
        portrait, tassel, and weapon-identity tests green unmodified in logic.
  - [x] `npm run vision` 5/5 including renderer parity and both negative
        controls; before/after combo sheets for all five heroes captured via
        the weapon-review/facesheet scripts and judged by eye at gameplay
        size (desktop + phone attacks); no clipping, no weapon over a face.
- Evidence:
  - Triples: gy (sweep,attack,chop), zf (thrust,attack2,sweep),
    zy (attack,attack2,thrust), hz (thrust,chop,sweep), wy (attack,sweep,chop).
  - artifacts/weapon-review/{pose-sweep,sequence-desktop,sequence-phone}-*-enh5after.png
    vs enh5before; geometry-enh5after.json (thrust 65, chop 30, sweep 61,
    headroom 25, zero face overlaps); artifacts/look/facesheet.png.
- Non-goals:
  - No frame-data changes (ENH-4 owns them). No threshold weakening — redraw
    the pose, never the floor. Enemies keep existing strike mapping.

### ENH-6 - Moveset validation: e2e, signals, balance comparison, eye review

- Status: DONE
- Dependency: do not start until ENH-5 is DONE. If reached earlier, mark
  this BLOCKED with reason "waiting on ENH-5" and implement nothing.
- Requirement:
  Prove the redesigned movesets end to end. Extend `e2e/anim.spec.ts`
  strike/withdrawn predicates to the new pose suffixes and add a per-hero
  combo texture test (Zhang Fei shows thrust-family keys, Guan Yu
  sweep/chop-family — never the same triple). Run the full gates and compare
  against the ENH-4 baseline marathon table.
- Acceptance criteria:
  - [x] e2e green including the new per-hero combo test; vision 5/5;
        prodbuild 4/4; signal 13/13 including all five marathons.
  - [x] Marathon before/after table recorded in PROGRESS.md. Any stage mean
        shifting >15% stops the task: flag to the owner, do not retune toward
        it. DIFF-1 stays BLOCKED regardless.
  - [x] All five heroes' full combos eye-reviewed at gameplay size (desktop +
        phone); masked attribution check: each combo reads as its weapon.
  - [x] lint, typecheck, unit green; no thresholds weakened.
- Non-goals:
  - No DIFF-1 smoothing and no new follow-up tasks invented. No deployment,
    push, or cloud changes.

### ENH-7 - Pause the game mid-stage (P key, overlay, deterministic resume)

- Status: DONE
- Requirement:
  A full run is ~13 minutes of uninterrupted real-time action (ENH-6
  zhaoyun marathon: 47,416 ticks) and the game has no way to stop the
  clock: zero matches for "pause" in src/selfplay/test/e2e, no pause key
  on the title screen's control list, no suspend/blur handling in
  gameplay. Add a gameplay pause: one key toggles it, the sim freezes,
  an overlay says so, and resume continues tick-neutrally.
- Acceptance criteria:
  - [x] P pauses and resumes during stage gameplay, co-op included (both
        players' sim time freezes; nobody moves while paused).
  - [x] While paused the sim advances zero ticks (pinned: tick count
        frozen across 120 wall frames) and no buffered press leaks through
        on resume.
  - [x] A legible overlay (dim + PAUSED + resume hint) renders while
        paused; the title-screen control list documents the key.
  - [x] Resume is neutral: pausing for any length of wall time then
        resuming changes nothing in the sim (pinned by comparing pre-pause
        and post-resume sim snapshots, or equal clear-tick counts
        with/without a mid-run pause).
  - [x] Full gates green: lint, typecheck, unit, e2e, signal 13/13,
        vision 5/5 (overlay judged by eye at gameplay size, no other frame
        regressed).
- Non-goals:
  - No pause menu, settings, volume, or stage-select. No auto-pause on tab
    blur/hidden (a behavior decision for the owner). No touch pause button
    (stated follow-up if the owner wants mobile parity). No DIFF-1
    impact: pause changes no frame data, spawns, or tuning.
- Evidence:
  - artifacts/loop/proposals-20260921-2038-pause.md (this pass's review).
  - Trial 2026-09-21: e2e/pause.spec.ts (3 tests: 120-frame freeze + full
    snapshot equality, no-leak/no-join, dim + gold-caption + undim), both
    mechanisms falsified by revert. Gates: lint/typecheck clean, unit
    188/188, e2e 48/48, signal 13/13 (marathons tick-identical to ENH-6),
    vision 5/5, prodbuild 4/4, build. Eye: artifacts/pause/{paused,
    unpaused,resumed}.png + artifacts/vision/title.png reviewed.

### ENH-8 - Touch pause button (mobile parity for the P key)

- Status: DONE
- Requirement:
  ENH-7 gave keyboard players P; a touch device has no P key and no other
  pause path, so a phone player cannot pause a ~13-minute run. Add one
  pause touch control, shown only on touch devices like the existing 7
  zones: tapping it toggles the same `GameScene.paused` flag (same freeze,
  overlay, buffer-clear and resume semantics - no new pause state). Anchor
  it clear of HUD plates, bars, banners, down-texts and the existing zones
  in every HUD state (boss plate and P2 plate included); legible glyph at
  phone size.
- Acceptance criteria:
  - [x] One new touch zone + visible glyph, HUD-owned and mounted with the
        existing controls (survives display-list rebuilds), shown only
        when `hasTouch()`.
  - [x] Tap pauses (sim tick frozen across 60 wall frames) and tap resumes
        (tick advances), pinned by a Pixel-7-emulation e2e reusing the
        `tapGamePoint` + `touchscreen.tap` patterns.
  - [x] The pause overlay shows/hides with touch toggles (dim pin or HUD
        visibility assertion).
  - [x] Occlusion and label-fit gates still green; desktop shows no new
        control (extend the desktop-absence coverage).
  - [x] Full gates green (lint, typecheck, unit, e2e, signal, vision,
        prodbuild, build); phone-size capture eye-reviewed.
- Non-goals:
  - No new pause semantics, menu, settings, or volume. No auto-pause on
    tab blur (owner behavior decision, unchanged). No desktop-visible
    change. No DIFF-1 impact.
- Evidence:
  - artifacts/loop/proposals-touchpause-enh8.md (this pass's review).
  - Trial: circled-II glyph in the shared pad Graphics + named touchPause
    zone (pointerup, Phaser order hazard documented); shared togglePause().
    e2e/touchpause.spec.ts (Pixel 7): tap freezes 60 frames with full
    snapshot equality, caption visibility both directions, tap resumes;
    falsified by unwiring the zone. Touch hint TAP TO RESUME (eye-caught).
    Gates: lint/typecheck clean, unit 188/188, e2e 49/49, signal 13/13
    (identical marathons), vision 5/5, prodbuild 4/4 (8 zones both
    orientations), build. Zone counts 7->8 in touch/prodbuild specs.

### ENH-9 - Pause does not freeze the stage-clear transition

- Status: DONE
- Requirement:
  ENH-7's pause gate promises "no stage transitions until resume", and
  the game-over countdown honors it (frozen while paused). The
  stage-clear path does not: once the `stageclear` event drains,
  GameScene arms a wall-clock `delayedCall(2000)` to the result scene,
  which fires straight through a pause - the scene changes under the
  PAUSED overlay when pause lands inside the 2s clear window. Freeze
  the clear countdown while paused (the continue countdown is the
  in-repo template: accumulate only on unpaused updates), so pause
  truly freezes every transition.
- Acceptance criteria:
  - [x] Pausing inside the clear window holds the game scene: e2e
        drives the REAL clear path (forceBoss + boss down -> stageclear
        event), pauses inside the 2s beat, and asserts scene is still
        'game' 3s later with the PAUSED caption showing.
  - [x] Resume completes the transition: the result scene appears
        after resume without further input (same test).
  - [x] Unpaused clear timing unchanged: the delayedCall became a
        delta-counted 2000ms beat armed at the same event drain (same
        payload read at fire time); existing stageclear e2e green
        (bot-driven full stage clear -> result -> stage 2); no DIFF-1
        impact (no frame data, spawn, or tuning change).
  - [x] Sweep done, every gameplay `scene.start` justified: GameScene
        pending-restart and gameover expiry sit below the pause gate;
        the clear->result transition now does too (this defect's fix).
        Menu-scene transitions (result/gameover/select/title) only run
        after the game scene is gone - no pause exists there. The
        bridge's forceResult/forceGameOver are harness test aids that
        deliberately bypass gameplay.
- Non-goals:
  - No pause menu, settings, or volume. No change to the 2s boss-fall
    beat length. No auto-pause on blur. No touch-input changes.
- Evidence:
  - artifacts/loop/proposals-clearpause-enh9.md (this pass's review).
  - Trial: `clearScheduled` + `time.delayedCall(2000)` -> `clearMsLeft`
    counted in update() below the pause gate (the continue-countdown
    template). e2e/pause.spec.ts gains the both-directions pin; both
    mechanisms falsified by probe (old delayedCall restored -> "the
    result scene arrived under the PAUSED overlay"; transition
    suppressed -> the resume assert fails). Gates: lint/typecheck
    clean, unit 196/196, e2e 53/53 (+1), signal 13/13, vision 5/5,
    prodbuild 4/4, build.

### UI-1 - Design-system foundation: theme, type, panel kit (overhaul phase 1)

- Status: DONE (attempt 1)
- Requirement: approved UI/art-overhaul plan phase 1 (owner request 2026-09-23,
  "not limited by current design"). Add `src/game/ui/theme.ts` (WoF-inspired
  palette, type scale, panel specs) and `src/game/ui/type.ts` (FontFace loader
  + baked display-text baker + live-text presets). Bundle an OFL arcade CJK
  display font (first choice ZCOOL QingKe HuangYou) under
  `src/game/assets/fonts/` with its license; BootScene loads it with a bounded
  timeout and sans-serif fallback. Extend `panels.ts` with `drawCard`,
  `drawLacquerBar`, `makeArcadeBar` (segmented HP + presentation-only white
  damage ghost); keep `drawSlab`/`makeBar` signatures and `panelRect`/`bar`
  data tags. Migrate all ~73 sans-serif call sites to theme presets.
  Produce a title style-frame mock for owner sign-off before UI-2..5 scale it.
- Acceptance criteria:
  - [x] theme.ts + type.ts exist; font + OFL license committed; boot loads font
        with timeout and falls back silently when blocked (e2e route-abort test).
  - [x] Baked-text baker handles every display string in the game (CJK + Latin)
        with no clipping (unit test over the string table); deterministic output.
  - [x] New panel builders emit `panelRect`/`bar` tags; layout/occlusion gates pass.
  - [x] Title style-frame screenshot reviewed at desktop + phone sizes.
  - [x] lint, typecheck, unit, e2e, signal, vision (incl. parity), prodbuild, build.
- Evidence: src/game/ui/{theme,type}.ts, src/game/assets/fonts/ (29.6 KB subset
  woff2 + OFL + subset + PROVENANCE.md), scripts/fetch-display-font.mjs,
  src/game/art/keyart.ts, StyleFrameScene (?styleframe=1, removed in UI-2),
  test/game/{uitheme,uitype}.test.ts (11), e2e/uifont.spec.ts (3),
  artifacts/look/ui1-styleframe-{desktop,phone}.png.
  Full gates 2026-09-23: lint + typecheck pass; unit 295/295; e2e 60/60;
  vision 5/5 (256/256 sprites, parity clean); selfplay 13/13, marathons
  identical; prodbuild 4/4; build pass (font +29.6 KB in dist).
  Image providers quota-exhausted during UI-1 (reset ~Sep 30): style frame is
  fully procedural; UI-2 carries the key-art generation retry + fallback.
- Non-goals: no scene restyles yet (UI-2..5); no sim/core changes; no push/deploy.

### UI-2 - Title screen: arcade attract screen (overhaul phase 2)

- Status: DONE (attempt 1)
- Dependency: UI-1 DONE + owner sign-off on the style frame.
- Requirement: title backdrop: generated key art preferred, procedural dusk
  battle (`src/game/art/keyart.ts`, UI-1 style frame) as the committed fallback.
  NOTE 2026-09-23: GPT image quota exhausted; owner logged into Grok the same
  day and the key art was generated with the grok provider.
  Original painted key art backdrop (Five-Tigers homage, Red-Cliff
  fire/ship motif, provenance-logged like ART-18); baked gold-foil logo lockup
  with 『赤壁之战』 subtitle; blinking PRESS START; presentation-only hi-score
  line (`localStorage`, guarded); control plate as bronze plaque with the same
  device-specific strings; ember-drift + logo-sheen animation (visual-only).
- Acceptance criteria:
  - [x] Title reads as an arcade attract screen at desktop + phone sizes (reviewed).
  - [x] Control-name assertions keep passing (touch.spec family, same strings).
  - [x] Hi-score hidden (not erroring) when storage unavailable.
  - [x] vision title frame + parity green; full gates green.
- Evidence: art/ui-title/{keyart-master.jpg,PROVENANCE.md} (grok provider,
  hashes logged), scripts/prepare-title-art.mjs ->
  src/game/assets/title/keyart-backdrop.jpg (960x540, 119 KB); BootScene
  preloads `ui:keyart-photo`, TitleScene falls back to keyart.ts when absent;
  `ensureSheenStrip` (panels.ts) 12 baked glint frames on the lockup;
  src/game/ui/hiscore.ts (+ GameOver/GameComplete writes), StyleFrameScene
  removed. Prompt kept as the device strings PRESS ENTER / TAP TO START
  (touch-parity wording) rather than a generic PRESS START.
  Tests: e2e/title.spec.ts (key art shown + blocked-art fallback),
  e2e/uifont.spec.ts (textures, sheen cycles, hi-score shown/denied),
  test/game/uihiscore.test.ts (5). Reviewed
  artifacts/look/ui2-title-{desktop,phone,sheen}.png +
  artifacts/vision/parity-webgl-title.png.
  Full gates 2026-09-23 (serial, final code): lint + typecheck pass; unit
  300/300; e2e 62/62; vision 5/5 (title coverage 0.664 / richness 2441,
  parity clean, sprites 256/256); selfplay 13/13, marathons identical to
  the standing snapshot; build pass (+119 KB jpg); prodbuild 4/4.
- Non-goals: no flow changes; no sim changes.

### UI-3 - Character select: WoF-style warrior roster (overhaul phase 3)

- Status: DONE (attempt 3, 2026-09-23 18:40 UTC - the attempt-2 environment
  block cleared itself: browsers launch again; the owner's standing overhaul
  goal drove this verification round)
- Dependency: UI-1 DONE.
- Requirement: parchment/ink-wash backdrop, faction-blue frame, five large baked
  portrait cards (ART-18 portraits) with display-type names + bronze stat pips,
  P1 gold / P2 blue cursors, bottom lacquer command strip. Keep tap-a-card,
  cursor wrap, autopilot skip.
- Acceptance criteria:
  - [x] Reviewed at desktop + phone sizes (artifacts/look/ui3-select-{desktop,
        zhaoyun,phone}.png, plus vision parity-webgl-select.png matching
        canvas); select, touch and layout specs pass unchanged.
  - [x] Full gates green: lint, typecheck, unit 306/306, e2e 63/63 (+1
        select-look), vision 5/5 (sprites 256/256), selfplay 13/13 with
        marathons identical, build, prodbuild 4/4.
- Delivered: src/game/art/selectart.ts (baked backdrop/frame/strip, card,
  cursor halos, pips, pennants), src/game/ui/roster.ts (shared geometry +
  statPips), src/game/players.ts (secondPlayerCharacter shared by the select
  2P preview and the in-game join), SelectScene.ts rewrite, type.ts strings,
  e2e/select-look.spec.ts, test/game/roster.test.ts (6).
- Non-goals: no roster/stat changes (sim data untouched).

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

- Status: TODO
- Dependency: UI-1 DONE.
- Requirement: new skippable scene-intro parchment card as a HudScene overlay
  (no new scene; tick-based autopilot auto-skip; `STAGE_LORE` copy table in the
  game layer); victory tally / game-over / game-complete / continue / pause
  cards in the new kit. Same scene keys + bridge fields.
- Acceptance criteria:
  - [ ] Autopilot/selfplay/marathon never hang on the card (new e2e test).
  - [ ] stageclear/continue/scenerestart specs preserved; vision captures reviewed.
  - [ ] Full gates green.
- Non-goals: no flow/state-machine changes; no new scenes.

### ART-19 - Painted per-stage backdrops (overhaul phase 6)

- Status: TODO
- Dependency: UI-1 DONE.
- Requirement: extend `backdrop.ts` with per-stage landmark mid-layers and
  palettes from the theme (rivers/bridges/temples for early stages, burning
  warships + red cliffs + ember sky for the finale), periodic-tile Canvas2D
  technique, optional visual-only animated overlays (smoke/embers). Ground
  line and scroll geometry identical.
- Acceptance criteria:
  - [ ] All 9 stages visually distinct, reviewed in screenshots + motion.
  - [ ] Tile-seam unit test per layer; background/probe specs pass.
  - [ ] Full gates green.
- Non-goals: no parallax/camera/ground-geometry changes.

### ART-20 - Props, pickups & combat-feedback pass (overhaul phase 7)

- Status: TODO
- Dependency: UI-1 DONE.
- Requirement: restyle crates/jars/meat/sword/chest + hit spark/KO burst/
  stage-clear flash to the painted arcade style via the existing `fx:` texture
  pipeline; unify boss-warning flash with the banner kit.
- Acceptance criteria:
  - [ ] Sprite gate stays 256/256 in unit + vision (regression = art defect).
  - [ ] weapon/probe/juice specs preserved; reviewed in combat screenshots.
  - [ ] Full gates green.
- Non-goals: no loot/drop-rate/combat changes.

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
