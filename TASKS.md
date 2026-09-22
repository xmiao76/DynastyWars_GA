# Work Queue

Statuses: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`.

The loop processes tasks from top to bottom and works on only one task per iteration.

Keep this file short. Once more than 20 tasks are `DONE`, move the oldest of them
to `TASKS-ARCHIVE.md`; every iteration reads this file to find the first `TODO`,
and scanning a long tail of finished work costs something each time.

## Enhancements

Add future enhancement tasks below this heading.

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

### ART-12 - The heroes' weapons do not read as their historical weapons

- Status: DONE
- Requirement:
  Each hero carries roughly the right KIND of weapon but the drawings do not
  read as the famous ones, and two assignments are wrong: Zhang Fei's pike (74)
  is SHORTER than Zhao Yun's spear (78) - backwards for 丈八蛇矛, the longest
  weapon in the novel - and Wei Yan carries a jian with a EUROPEAN CROSSGUARD.
  Guan Yu's glaive head is a chunky polygon, not a 月牙 crescent; the 蛇矛 head
  is a jagged zigzag, not a sinuous snake; the spear has no 红缨 tassel; the
  bow is a plain D-arc, not a recurve; Lu Bu holds a plain glaive instead of
  the 方天画戟. Owner decisions: novel/folk standard; Wei Yan gets the
  long-handled 大刀; Huang Zhong keeps the bow (reshaped recurve); Lu Bu's
  halberd included.
- Acceptance criteria:
  - [x] WEAPONS ladder pike 82 > ji 78 > glaive 76 > spear 72 > dao 69 >
        sword 46 > bow 42; weiyan -> dao, lubu -> ji; 'blade' renamed 'jian'
        with a disc guard
  - [x] Crescent, serpent, dao, ji, recurve-bow heads redrawn as quadratics;
        TASSEL tuft on all 11 polearm wielders. Tassel brightened
        0xb03028 -> 0xc43830 and ji wings fattened after the first sheet
        showed the tassel sinking into Zhang Fei's dark armour and the wings
        thin at display size
  - [x] POSE_REACH re-measured with a probe calibrated against HEAD first:
        EVERY pose came in at or under the old margins (the old attack/windup
        driver was the spear at 78; it is now 72, and the new envelopes are
        tighter than the angular polygons) - attack 55, attack2 39, windup 9,
        recover 19 (was a stale 26), jump 20, hurt 9, down 27, special 54
  - [x] Three new gates, each falsified by reverting its mechanism: named
        weapons + ladder (lubu->glaive and pike->74 both fail it), tassel
        presence at the socket (disabling the draw fails it 0-1 px vs floor
        30; measured 109-151; Zhao Yun's red trim excluded by tolerance),
        ART-8 head-cross made PERMANENT over steel AND tassel families
        (walk1 -1.5 fails it on 7+ kinds; per-kind idle baselines 0-441 -
        Zhao Yun's is his own steel helmet, which is why the gate keys on
        deltas)
  - [x] Weapon sheets at display size judged by eye, before AND after
        (artifacts/weaponsheet12.png, weaponsheet12-before.png): crescent
        reads as a moon blade, serpent undulates, tassels visible on all
        wielders, recurve reads, jian disc guard reads, portraits' weapon
        sliver intact
  - [x] lint, typecheck, unit 163/163 (+3 gates, durable suite), e2e 44/44,
        vision 5/5 (202/202 sprites, 34/34 weapons, 68/68 retracts, parity),
        prodbuild 4/4, signal 13/13, build
- Non-goals:
  - No pose, POSES-list, sprite-binding, scene, or core changes; no strict-Han
    weapons; no second weapon for Huang Zhong; the sword pickup prop untouched.

### ART-11 - Continuous attacks look static: the weapon never retracts between hits

- Status: DONE
- Requirement:
  When a hero attacks continuously, the weapon looks static - fully extended
  from the first tick, never retreated. Root cause, verified: one `attack`
  pose covers the whole startup+active+recover window; `poseForEntity` maps
  `attack` -> `'attack'` ignoring `stateTick`/`attackId`; and combo chaining
  keeps state `'attack'` across jab1 -> jab2 -> finisher, so the texture key
  never changes between hits. Phase every attack into windup / strike /
  recover selected by `stateTick` against the attack's own frame data, and
  give jab2 an alternate strike pose so consecutive hits differ.
- Acceptance criteria:
  - [x] `poses.ts` gains `WINDUP`, `ATTACK2` (jab2 high backhand), `RECOVER`;
        `attack` itself unchanged
  - [x] `POSE_REACH` gains 3 measured entries (windup 11, attack2 40,
        recover 26); `POSES` 8 -> 11
  - [x] `poseForEntity` phases `attack`/`jumpattack`/`special` by frame window,
        with fallback = today's rendering on null/unknown `attackId`
  - [x] Every combo boundary reads strike -> retract -> strike; jab2 shows the
        alternate strike; hz.special (active 0) skips the strike pose
  - [x] Reach gate covers both strikes; new retract gate proves windup/recover
        narrower than each strike; PAIRS extended; every gate falsified by
        reverting its mechanism (falsification log in PROGRESS.md)
  - [x] e2e Part 3 observes windup/attack/attack2/recover across one combo,
        with a withdrawn frame between consecutive strikes
  - [x] Combo strip at real display size judged by eye (hero 69 frames +
        soldier 38 + special 30 + jumpkick 36); windup checked for
        weapon-over-head; strips at artifacts/combo11.png, combo11b.png
        (gitignored, regenerated by nothing - the e2e + gates are the durable
        proof)
  - [x] lint, typecheck, unit 160/160, e2e 44/44, vision 5/5 (202/202 sprites,
        34/34 weapons, 68/68 retracts, renderer parity), prodbuild 4/4,
        signal 13/13, build
- Flagged scope (owner's decisions):
  Enemies ride free (their long startups become telegraphs). Jumpattack phases
  by the same generic rule, so a late landing leaves a recover tail of up to
  ~12 ticks - accepted at planning, eye-check on the strip. Finisher keeps the
  standard strike. No sim change, no kick poses, no position juice.
- Non-goals:
  - No `src/core` change of any kind.
  - The dormant bake pipeline's literal pose lists (`scripts/bake-core.mjs`,
    `scripts/make-sample.mjs`) stay as they are - that pipeline ships nothing.

### ART-10 - Guan Yu's defining brows were the second-lightest in the cast

- Status: DONE
- Requirement:
  The fourth of the four defects the owner confirmed in ART-9 was "they don't
  look like the specific heroes", and it is the one that round addressed least
  - it fixed the eye SHAPES but not much else. Auditing `FACES` against the
  standard descriptions found one clear error and one mismatch.

  关羽 Guan Yu is named for three things: 面如重枣 the date-red face, 美髯 the
  beard, and 卧蚕眉 - "reclining silkworm" brows, which means THICK and gently
  curved. The `phoenix` row gave him `browWeight: 0.95`, the SECOND LIGHTEST of
  the six face kinds. The one feature of his the sources name alongside the
  beard and the complexion was drawn backwards, and had been since ART-1.
- Acceptance criteria:
  - [x] `phoenix` brows made heavy and curved: `browWeight` 0.95 -> 1.32,
        `browArch` 0.14 -> 0.17, and the steep `browAngle` -0.55 -> -0.36,
        because a silkworm brow CURVES rather than slants. Guan Yu now reads
        with the heaviest brows in the cast bar one, which is what 卧蚕眉 means
  - [x] `sharp` brows 0.8 -> 1.06. STATED AS A JUDGEMENT CALL rather than a
        citation, unlike the above: no source describes Wei Yan's, Xu Huang's
        or Cao Cao's brow weight, but "severe and hard" carrying the LIGHTEST
        brow of the six read as delicate instead
  - [x] Checked the other three against the sources and left them alone:
        张飞 豹头环眼 has the round glare (`eyeAspect` 1.55) and the largest
        head (`build.head` 1.04); 赵云 浓眉大眼 has thick brows (1.18) and big
        eyes (`eyeW` 1.12); 黄忠 the old general has the heaviest brows (1.35)
        and hooded eyes. All three already matched
  - [x] `FACES` is shared, so this moves the IN-PLAY faces too - intended, and
        every sprite gate re-run
  - [x] lint, typecheck, 155 unit, 43 e2e, vision 5/5 including renderer parity
        and the sprite gate at 148/148, prodbuild 4/4, signal 13/13, build
- Flagged, unchanged, and the owner's call:
  魏延 WEI YAN IS 面如重枣 IN THE NOVEL - the same date-red face as Guan Yu
  (ch. 41, 面如重枣，目若朗星). This repo deliberately made him sallow instead,
  because Guan Yu's red face is his signature and the hero complexion-pair gate
  requires every pair to differ by more than 18 mean luma. Recorded here rather
  than changed, for the third time, so the deviation stays visible.
- Non-goals:
  - No new face kinds, no silhouette change, no complexion change.

### ART-9 - The faces were still not human: the portrait was a 3/4 view with the face squashed onto one side

- Status: DONE
- Requirement:
  The SEVENTH round of "the heroes do not look human". ART-6 rebuilt the
  portrait's head, headgear and lighting; ART-7 found the in-play face painted
  on the headgear. The owner looked again and said they were still weird, and
  they were.

  MY LAST TWO VERDICTS WERE WRONG IN A SPECIFIC WAY, worth recording because it
  is the reason this took seven rounds: I graded each round against THE STATE
  BEFORE IT ("the eyes are no longer discs", "the brow is on skin now") rather
  than against a human face. Every one of those statements was true and the
  faces were still not human.

  So this round the owner confirmed the defects and chose the look from
  rendered candidates BEFORE it was built out. All four of these are theirs,
  not mine:
    1. THE FACE WAS SQUASHED ONTO ONE SIDE. The portrait was a 3/4 view: both
       eyes in the right half, the nose protruding PAST the silhouette as a
       pointed beak (`HEAD_OUTLINE` put the tip at 1.16 HW against a head
       half-width of 1.02), and the whole left half empty skull.
    2. NO MOUTH, AND SPECKS ON THE CHEEKS. Three of five heroes had no visible
       mouth - the beard covered it. In play the two dark dashes were not the
       eyes at all but the NOSE (11.1px) and the NEAR BROW (10.4-12.1px), and
       every other feature was sub-2px and anti-aliased into a speck: mouth
       2.02-2.16px, the nose's narrow end 1.82-1.95px, two heroes' far eyes
       2.4-2.5px.
    3. THE STYLE WAS TOO FLAT AND GEOMETRIC. One straight cel-band edge cut
       every face. Measured: the band's light edge crosses the head at
       head-local x = +0.09 headR, within a tenth of a radius of dead centre.
    4. THEY WERE NOT RECOGNISABLY THE HISTORICAL FIGURES beyond complexion.
- Owner's decisions: SOFT SHADING allowed on portraits (in-play stays flat cel,
  so the game still reads as one piece); THREE CANDIDATES rendered and shown
  before anything was built out. They picked A - soft - and asked for a leaner
  head, smaller beards and less headgear.
- Acceptance criteria:
  - [x] The portrait head is FRONTAL and symmetric, authored as named landmarks
        of one side and mirrored. Height:width 1.47, the lean end of the human
        range. The six outline points that existed only to describe a profile -
        nasion, nose tip, nose base, upper lip, lip, mentolabial sulcus - are
        gone: a frontal nose is structure INSIDE the face
  - [x] Everything two-sided is MIRRORED rather than copied. `aperturePath`,
        the lash line, `eyeTilt` and `browAngle` were all applied with one sign
        to both sides - invisible on a 3/4 face, but on a frontal one that is
        two right eyes and a single raised brow
  - [x] Soft shading: gradients for the cheek/brow/jaw falloff, eye sockets and
        nose bridge, painted inside a clip of (skull, below the hairline). The
        clip is what removes the band seam, and it is the "face plate" ART-6
        rejected - right NOW for the reason it was wrong THEN, because the head
        path already supplies the jaw and chin
  - [x] A mouth that is always visible, with beards reshaped to frame it and to
        run off the bottom of the frame rather than ending in a flat line
        inside it, which read as a bib
  - [x] Every stray mark gone: the single nostril, the one-sided cheek streak,
        the single ear and the nose-on-the-silhouette streak are replaced by
        mirrored pairs that belong to named features
  - [x] In play: the nose shortened and thickened past the anti-alias floor,
        the mouth from 2.08px to ~2.9px, the far eye from 2.4px to ~2.9px.
        Silhouette untouched
  - [x] `artquality.test.ts`'s complexion-pair crop RE-REGISTERED onto the
        build-applied head. It took its centre from the raw pose, so Guan Yu's
        crop missed his eyes entirely and reached into his beard while Zhang
        Fei's and Huang Zhong's excluded the mouth - and it passed throughout,
        which is the point: it was comparing different parts of different faces
  - [x] Ten portrait gates, EVERY one proven able to fail by reverting the
        mechanism: hairline over the brow, sclera unpainted, the two historical
        eye shapes swapped, the cel band let back across the face, the skin
        painted flat, the lip line removed, the raw-pose anchor restored, the
        zoom pushed past the frame, both eyes nested under "has eyes", and the
        face pass skipped
  - [x] TWO METRICS DESIGNED, MEASURED AND DROPPED rather than shipped:
        - "count sclera directly above the iris" to catch the googly disc. On
          correct art it returns 2, 4, 6, 4, 2 - anti-aliasing along the lid on
          an eye 6.7px tall - so a disc would have to score below that to be
          rejected. What makes the disc impossible is structural instead: the
          iris is drawn inside a CLIP of the aperture.
        - "count tones across the face" for flatness. The eyes, brows, lips and
          age lines are all skin-family tones and carry the count on their own,
          so flattening the skin entirely still scored above any usable
          threshold. Replaced by the FOREHEAD luma range, the one sizeable
          patch with no feature on it, where the separation is absolute:
          10.3-12.3 with the gradient, exactly 0.0 flat
  - [x] lint, typecheck, 155 unit, 43 e2e, vision 5/5 including renderer
        parity, prodbuild 4/4, signal 13/13, build
- FOLLOW-UP, after the owner asked to continue with the in-play faces:
  - [x] The near eye gets a SCLERA. At a 41.6px head it is about 8x5 device
        pixels - enough for a dark iris with roughly 1.5px of white either
        side, which is what stops it reading as one more dark speck among the
        brow, nose and mouth. The iris fills the aperture's HEIGHT, so white
        can only show left and right of it: the same construction the portrait
        uses, and the reason neither is a googly disc. A first attempt sized it
        0.19 x 0.115 and reintroduced exactly the white ring ART-6 removed;
        pulled back to 0.17 x 0.098 so the white is a hint rather than a ring
  - [x] The far eye at 5x3 device px stays a plain dark mark. A 1px sliver of
        white there would be a flicker, not an eye
  - [x] The brows thinned from 0.16/0.13 to 0.125/0.10. They were the two
        longest and heaviest marks on the face and dominated the eyes, which is
        backwards - a face is read from its eyes
  - [x] `faceLayout`'s `browHalf` and `eyeRy` brought back into step with what
        is actually drawn, so the clearance it computes describes the real
        geometry
  - [x] Re-verified: lint, typecheck, 155 unit (including the complexion-pair
        gate, which the added white could have diluted), e2e 43/43, vision 5/5
        with the sprite gate 148/148 and both negative controls still failing
        correctly, prodbuild 4/4, signal 13/13, build
- Honest limit, stated rather than glossed:
  THE IN-PLAY FACE IS BETTER, NOT TRANSFORMED. The near eye now reads as an eye
  and the marks no longer scatter, but at a 41px head in flat cel it is still a
  handful of marks rather than a face. The portrait work cannot transfer: a
  fighter faces its direction of travel, so it cannot go frontal, and soft
  shading is scoped out of the sprites deliberately so the game reads as one
  piece.
- Non-goals:
  - No change to in-play head size, build or silhouette.
  - No gradients on the in-play sprites.
  - No change to `PORTRAIT_BOX`/`PORTRAIT_TEXTURE` or any scene's display sizes.

### ART-8 - The weapon crosses the head in the walk1 frame

- Status: DONE
- Requirement:
  Found by ART-7's face gate when it was briefly run over all eight poses. In
  `walk1` the weapon is rotated such that its blade passes ABOVE THE BROW and
  over the top of the head. Measured at the near-eye column, just above the
  brow, the probe lands on steel rather than skin for six kinds:

      guanyu     154,148,157      weiyan     140,143,156
      soldier    140,143,156      spearman    99, 86,127
      lidian     182,189,201      zhanghe    182,189,201
      caocao     140,143,156

  Rendered at 2x (`artifacts/look/guanyu-walk.png`), Guan Yu's glaive blade
  sits on top of his hood in `walk1` while clearing it entirely in `idle` and
  `walk0`. The weapon is drawn last in `figureShapes`, so it is in FRONT of the
  head rather than behind it.

  This matters more than a single frame sounds like: `walk1` is half the walk
  cycle, and walking is the state a player sees most.

  PRE-EXISTING. Nothing in ART-6 or ART-7 moved the weapon; those tasks only
  made it visible, because until then no gate looked at the area above the brow
  at all.
- CORRECTION to my own recommendation. I filed this saying it was a judgement
  call and recommended ACCEPTING it, on the reasoning that any fix would cost
  animation swing or risk the clipping gate, since walk poses carry
  `POSE_REACH` 0. Measuring says that was wrong, and the mistake was assuming
  the only lever was the swing's AMPLITUDE.

  The real driver is not the rotation alone but WHERE THE HAND IS. In `walk1`
  the near hand swings in to x=54 against a head at x=50, so a near-vertical
  weapon passes straight over it; in `walk0` the hand is out at x=60 and clears
  the head at any angle. So the fix is to move the vertical extreme to the
  half of the stride where the hand is out - a change of PHASE, not amplitude.
- Measured, before and after, as steel-coloured pixels inside the head oval:

      kind        before    after       (baseline in other poses)
      guanyu        1034        0                            0
      lidian        1072       48                           48
      caoren         649        0                           44
      lubu           657        0                           44
      xuchu          633        0                            0
      xuhuang        625        0                            0
      weiyan         604        0                            0
      soldier        591        0                            0
      zhanghe        603        0                           48
      zhangfei       436        0                           50
      caocao         317        0                            0
      zhangliao      201        0                            0

  Zhao Yun and Huang Zhong read high in EVERY pose and are not in this table:
  their own gear is silver, so they trip a steel probe wherever it looks. The
  signal that matters is the walk1 SPIKE against the same kind's other poses.
- Acceptance criteria:
  - [x] `walk0` -1.28 -> -1.44 and `walk1` -1.50 -> -1.22. The swing is
        unchanged in amplitude at 0.22 radians; only its phase moved
  - [x] No pose clips its frame box - checked across all 17 kinds and 8 poses,
        before and after, and the answer was none either way
  - [x] The walk still reads as a swing, judged by eye across the whole cycle
        rather than one frame (`artifacts/look/walkcycle.png`)
  - [x] Every sprite gate still green, including the two this could have
        broken: walk frames must differ by more than 0.008 of the frame, and
        the walk-cycle foot shift must stay under 2 units
  - [x] lint, typecheck, 155 unit, 43 e2e, vision 5/5 including renderer
        parity, prodbuild 4/4, signal 13/13, build
- Non-goals:
  - No change to the face pass. ART-7 is done and its gate stays scoped to
    `idle`, where the claim it makes is the one it can measure.

### ART-7 - The in-play face is the one the player looks at, and it has every defect ART-6 just fixed

- Status: DONE
- Requirement:
  ART-6 fixed the portraits. The fighter's face was left alone on a stated
  justification that is WRONG, and the error is repeated in eight places across
  the codebase and this file:

      "at a ~20px head a human eye is not drawable"

  20 is LOGICAL units. `RENDER_SCALE` is 2 and `GameScene.fitSprite` gives a
  hero scale of exactly 116/232 = 0.5 against a camera zoom of exactly 2, so
  the sprite is texel-for-pixel with the 960x540 backing store. Measured:

      guanyu      40.4 x 46.0 device px
      zhangfei    43.3 x 49.3
      zhaoyun     41.6 x 47.4
      huangzhong  42.4 x 48.4
      weiyan      41.2 x 46.9

  `Scale.FIT` then stretches that canvas to the window, so on a 1080p display
  the head a player watches for the entire game is about 83 REAL screen pixels
  across. That is not a face that cannot be drawn; the portrait's face window
  before ART-6 was not much bigger.

  Rendered at 6x (`artifacts/look/inplay-heads.png`), the in-play face has the
  same defects ART-6 found in the portrait:
    1. THE EYES ARE ON THE HEADGEAR, and worse here than in the portrait
       because the gear is a contrasting colour: the helmet's lower edge at the
       near-eye column is +0.342R and a turban's is +0.196R, while the eye sits
       at +0.20R. Zhao Yun's eyes are painted on grey steel, Wei Yan's on
       purple cloth.
    2. THE EYES ARE SOLID DOTS - `m.eye` ovals at roughly 1:1, no lid, no
       structure. The same "cartoon, not human" signal the portrait had.
    3. THE FACE IS CRAMMED INTO THE BOTTOM THIRD of the head.
    4. Stray `skinForm` marks read as dirt rather than structure.
- Constraint that shapes the whole fix: NO SILHOUETTE CHANGE. `drawDetails`
  runs after `paintCel` and draws inside the head, so face marks cannot move
  the outline - but RAISING THE HEADGEAR would, and the headgear is a `shapes`
  entry. So the face must come DOWN to meet the gear rather than the gear going
  up, and only by as much as each gear kind actually requires (helmet the most,
  band and hood not at all).
- CORRECTION to the non-goals as filed. I wrote "no change to any silhouette"
  and then changed one, deliberately: the face CANNOT duck under a helmet that
  reaches +0.342R without landing on the chin, so the brim had to come up. The
  change is bounded and measured rather than waved at - each bowl keeps its TOP
  (cy - ry) and its WIDTH (rx) exactly, so the two points that define its
  outline do not move, and only the vertical profile shallows:
      helmet  ry 0.86 -> 0.5197, cy -0.42 -> -0.7603, edge +0.342 -> -0.300
      crown   ry 0.70 -> 0.4796, cy -0.50 -> -0.7204, edge +0.114 -> -0.300
      turban  ry 0.82 -> 0.5604, cy -0.55 -> -0.8096, edge +0.196 -> -0.300
  Measured over all 176 sprite textures: 85 are silhouette-IDENTICAL and 91
  moved, the worst by 1.68% of its own area (soldier:down). The gates that care
  are thresholded at 10% (hero distinctness) and 15% (pose distinctness).
- Acceptance criteria:
  - [x] Every face mark lands on SKIN. `gearFaceEdge` computes each headgear's
        lower edge at the eye column from the same table `addHeadgear` draws
        from, and `faceLayout` moves the face down by exactly what that kind
        needs - which is now nothing for helmet, turban, crown and hood, and
        0.11R for a band
  - [x] The eye is an almond, not a dot: 0.17 x 0.095 against the old
        0.14 x 0.15. About 2:1, which reads even at seven pixels wide
  - [x] A gate that would have caught it, in `artquality.test.ts`: probe just
        above the brow in the near-eye column for all 17 humanoid kinds and
        require skin. Probed per kind, because the band of skin between brim
        and brow sits at a different height for every headgear - the position
        comes from `faceLayout`, not from a copy of its arithmetic. Proven able
        to fail by restoring the old bowls: "zhaoyun: the brow has 134,138,150
        above it, not skin - the face is painted on the headgear"
  - [x] The silhouette change measured, not assumed - see the correction above
  - [x] The hero complexion-pair gate still passes, as do silhouette
        complexity, appendage ratio, colorCount, dominantFraction, outlineRatio,
        tonalBands, weapon reach, clipping, centring, walk cycle, pose
        distinctness and boss weight
  - [x] The three stale "20px" comments in `src/game/art/` corrected to the
        measured 40-43 device px. The figure is logical units; RENDER_SCALE is 2
  - [x] Judged by eye magnified (`artifacts/look/inplay-heads.png` before,
        `inplay-after.png` after) and at play scale
        (`artifacts/vision/game_combat.png`)
  - [x] lint, typecheck, 154 unit, 43 e2e, vision 5/5, prodbuild 4/4,
        signal 13/13, build
- Non-goals:
  - No change to head SIZE or build. `fitSprite` derives one scale from the
    idle frame and the art gates bound both absolute height and the
    tallest-to-shortest ratio. The headgear PROFILE did change - see the
    correction above.
  - No portrait change. ART-6 is done and its gates stay as they are.
  - Not photorealism. Flat cel, same as everything else.

### ART-6 - The portrait face is built on the wrong geometry, not on too few marks

- Status: DONE
- Requirement:
  The owner has said five times that the heroes do not look human. Five prior
  attempts (ART-1, ART-1b, ART-3, ART-4, ART-4b, ART-5) each ADDED a mark or
  tuned a scalar - a second eye, a nostril, a catchlight, a lower lip, a curved
  brow, then the missing `fill()` for that brow. None changed the head shape,
  where the features sit on the head, the headgear occlusion, or the framing.
  The marks were never the problem. Measured causes:

  1. THE EYES ARE DISCS. `humanEye` (`src/game/art/draw.ts:566`) draws the
     sclera at `rx*1.2 x ry*1.14` where `rx = 0.14R*eyeW`, `ry = 0.15R*eyeH`.
     For Zhao Yun (`calm`) that is 0.188R x 0.180R - an aspect of 1.04:1, a
     CIRCLE - with a circular iris of `ry*0.6` floating inside it, so white
     shows above, below AND both sides. A human aperture is about 2:1 wide and
     the upper lid always cuts the top of the iris. This is the strongest
     remaining cartoon signal and it affects all five heroes.

  2. TWO HEROES HAVE THEIR FACE PAINTED ON THEIR HAT. Headgear is a `shapes`
     entry filled in `paintCel`; the face is painted after. At the near-eye
     column (x = 0.52R) the headgear's lower edge computes to:
       Zhao Yun  helmet  +0.342R   eye spans 0.02-0.38R   eyes AND brows on gear
       Wei Yan   turban  +0.196R   eye spans 0.055-0.345R brows + upper eyes
       Guan Yu   hood    -0.285R   clears - on skin
       Zhang Fei band    -0.165R   clears by 0.02R
       Huang Zhong band  -0.165R   clears by 0.02R
     Zhao Yun's visible skin is only y in [0.34R, 1.14R] - the bottom third of
     his head. He reads as a helmet with eyes stuck on it.

  3. THE HEAD IS ONE ELLIPSE WITH NO CHIN. `ovalPath(p.head, headR, headR*1.14)`
     (`draw.ts:219`) - no cranium/jaw split, no taper. ART-4's "jaw shading" is
     a single `limbPath` stroke laid on an egg, which is why the heads still
     read as eggs.

  4. A STRAIGHT CEL BAND CUTS A SEAM THROUGH EVERY FACE. `bandPath`
     (`draw.ts:83-101`) lays one straight-edged quad across the whole figure; on
     the head the shadow edge lands at x ~ 56.1 figure units, between the near
     eye (54.4) and the nose tip (58.9). At portrait size that reads as a
     rendering artifact, not as light.

  5. THE FRAMING IS A BUST. `PORTRAIT_ZOOM 1.3` / `PORTRAIT_HEAD_Y 18` put the
     head centre 45% down the box; the face is ~43% of frame height and the
     bottom ~30% is shoulder, robe and a large round shield.

  6. TWO HEROES HAVE NO HAIR AT ALL. The hair cap (`draw.ts:223-235`) is drawn
     only for `band`/`turban`/`crown`. Guan Yu (hood) and Zhao Yun (helmet) get
     no hair shape - no hairline, no sideburns, nothing framing the face.

  Owner's scope decisions for this round: PORTRAITS ONLY (in-play fighters
  untouched), REFRAME to a head close-up, FLAT CEL KEPT - fix the proportions,
  no gradients.
- CORRECTION to the fix as filed. This task was written around a portrait-only
  "face plate": clip a face-shaped mask over the head, refill it with skin to
  erase the cel seam and the coarse marks, and draw the features on that. A
  design review measured the idea against the real geometry and it does not
  work, for two reasons worth keeping:
    1. There is no room under the headgear to put a face. The gear's LOWEST
       point over the face is +0.44R for a helmet and +0.27R for a turban,
       while the eye line sat at +0.20R. A plate that stays below the gear
       starts below the eyes; a plate that does not is redrawing the headgear,
       and should say so.
    2. A plate cannot make a chin. The silhouette comes from the head PATH; a
       plate only repaints the interior. That is exactly what ART-4's "jaw and
       chin" shading already did across three commits, and the head's measured
       half-width still matched the bare ellipse to three decimals (0.887-0.897
       against a closed form of 0.889).
  So the plate would have been a sixth round of marks on unchanged structure.
  What shipped instead: the PORTRAIT GETS ITS OWN HEAD, headgear, hair and
  light, run through the same `paintCel` as everything else - so it is the same
  art style, drawn from the same `FigurePlan`, and the fighter is untouched.
- Also found by that review and fixed here, not in the original diagnosis:
    3. THE FACE WAS ON THE SHADOWED SIDE OF EVERY HEAD. The cel terminator sits
       at x~53.8 while a head spans 38.6..59.4 and the figure faces RIGHT, so
       every feature landed in the shadow band and the lit band (x < 38.7)
       never reached the head at all. Measured: the near cheek was 25-29%
       DARKER than the back of the skull on all five heroes. You cannot read
       form that is uniformly in shadow.
    4. THE PORTRAIT ANCHORED ON THE WRONG HEAD. `drawKindPortrait` translated
       by `POSE_TABLE.idle.head.y` - the RAW pose - while `applyBuild` moves
       the head by the hero's height (12.69 for Guan Yu, 18.08 for Zhang Fei).
       Each portrait was therefore slid by its own build: a 42px spread in a
       240px frame, with four of the five clipped at the top edge. Live since
       ART-1b and never noticed.
- Acceptance criteria:
  - [x] The portrait draws its own head: a jaw-tapered 3/4 outline with a nose
        profile, at a half-width of 0.82R so height:width is 1.39 (human) rather
        than the sprite ellipse's 1.14
  - [x] Headgear derived from that outline - "the top of this head, thickened" -
        so a helmet, turban, band, hood and crown all SIT on the head instead of
        overhanging it, with every brim raised to `L.gearEdge` = -0.58R, above
        the brow. Zhao Yun's forehead goes from 1.1% skin to a full brow's
        worth; Wei Yan's from 0.0%
  - [x] The portrait has its own light: shadow on the far side of the head,
        light on the face. Near cheek / far temple goes from 0.71-0.75 to >= 1.0
  - [x] The eye is an ALMOND aperture with the iris CLIPPED by the lid, so white
        can only show left and right of it. Measured sclera width:height goes
        from 0.92-1.24 (taller than wide) to 1.8-3.2. New `FACES.eyeAspect`
        carries the historical shapes: 2.9 for Guan Yu's 丹凤眼, 1.55 for Zhang
        Fei's 环眼
  - [x] Features on human canon: brow -0.22R, eye +0.04R, nose base +0.36R,
        mouth +0.58R, chin +1.12R - the eye line at the middle of the head
        rather than 58% down it
  - [x] Beards wrap the jaw and carry a moustache, painted in the face pass
        because `figureShapes` draws the arm and weapon after the head - as a
        shape, Guan Yu's 美髯 came out behind his own glaive
  - [x] Framing: anchored on the BUILT head, `PORTRAIT_ZOOM` 1.3 -> 1.33 and
        `PORTRAIT_HEAD_Y` 18 -> 21. Head-centre spread 42px -> 0px. 1.33 is a
        ceiling, not a preference: the tallest head-plus-headgear is 2.44 headR
        and the box holds no more
  - [x] `src/game/art/portrait.ts` (new) and `src/game/art/faces.ts` (new);
        `draw.ts` 893 -> 713 lines, back under the project's own 800
  - [x] Eight gates in `test/game/portrait.test.ts`, ALL of them proven able to
        fail by reverting the mechanism - never by moving a threshold:
          headgear back over the brow  -> "the face is painted on the headgear"
          aperture back to a disc      -> "the eye is a disc (w:h 0.60)"
          historical shapes swapped    -> 环眼 not rounder than 丹凤眼
          sprite bands on the portrait -> "the face is darker than the back"
          head back to an ellipse      -> "no nasion"
          raw-pose anchor restored     -> heads at different heights
          zoom past the frame          -> "the headgear is cropped"
          face pass traced, not filled -> "it is tracing without painting"
  - [x] A NINTH gate was designed, measured and DROPPED rather than shipped: a
        "no straight seam crosses the face" metric returned 0-15% on art a seam
        demonstrably ran through, because the per-row argmax is captured by the
        eye, brow and lip marks instead of the band. Any threshold that failed
        the old art would have failed correct art too. The lit-face gate covers
        the same defect, so this is recorded rather than shipped - the same
        judgement `artquality.test.ts` already records for five other metrics
  - [x] A gate that could not fail, caught and fixed DURING falsification: the
        first framing gate recomputed the expected head position with the same
        arithmetic the fixed code uses, so reverting the anchor bug moved the
        prediction along with the drawing. It now locates the head from the
        RENDERED eye line
  - [x] No sprite moved, PROVEN rather than argued: all 176 sprite textures
        rendered before and after digest to the same SHA-256,
        154bc54d7e152520d2284fa7e6d00b50f9529d57bc2163fdf4fd24de6155b975. Both
        new parameters (`paintCel` bands, `figureShapes` head parts) default to
        exactly the previous behaviour
  - [x] Five stale `art/raw/*-portrait.png` placeholders removed from this
        working copy. CORRECTED SCOPE: `art/raw/` is gitignored, so these were
        never committed and this is not a repo change - but on any checkout
        that has them, `scripts/bake-art.mjs` would bake them into
        `public/assets/portraits/` and `BootScene` prefers the manifest over
        procedural art, which would silently revert this entire fix. Worth
        knowing before anyone runs the bake pipeline
  - [x] `scripts/facesheet.mjs` (new, tracked): renders the five portraits at
        native size AND at all three display sizes, pulling the real textures
        out of the running game. Every earlier round judged the face at texture
        size while the game never shows one above 63% of it, and no sheet script
        survived in the tree
  - [x] FOLLOW-UP, found by a producer pass over my own commit: the portrait
        left 夏侯惇 Xiahou Dun with a socket and NO OTHER EYE. `drawDetails`
        draws the far eye before branching on `missingEye`; the portrait had
        both eyes inside the else, so losing one eye removed both. Pre-existing
        in `drawPortraitDetail` and faithfully carried over by me. This is the
        same branch mistake ART-4b caught when the lips and jaw were nested
        under "has eyes". Fixed, plus a ninth gate that renders him and
        requires sclera at the good eye and none at the socket - proven able to
        fail by restoring the nesting ("the good eye is missing"). Nothing
        displays a boss portrait, so that branch had no other exercise
  - [x] The five hero portraits are byte-identical across that follow-up
        (SHA-256 584e6145...c069), so only a figure no screen shows changed
  - [x] lint, typecheck, 153 unit, 43 e2e, vision 5/5 (incl. renderer parity),
        prodbuild 4/4, signal 13/13, build
- Non-goals:
  - No change to the in-play fighters, poses, silhouettes or builds. At a ~20px
    head a human eye is not drawable; that is a rig redesign, not a fix.
  - No gradients, no soft shading, no restyle. Flat cel throughout.
  - No change to `PORTRAIT_BOX`, `PORTRAIT_TEXTURE` or any scene's display
    sizes - those are fixed numbers in SelectScene/HudScene and changing the box
    aspect would distort every surface.
  - No boss portraits. None exist and none are asked for.


### ART-5 - The portrait's curved brows are traced and never filled, so no portrait shows them

- Status: DONE
- Requirement:
  ART-4b "wired the unused brow arch" - and built the path without painting it.
  `curvedBrow` in `drawPortraitDetail` (`src/game/art/draw.ts`) calls
  `chainPath` and never calls `ctx.fill()`. All four path helpers in
  `src/game/art/rig.ts` (`chainPath`, `limbPath`, `ovalPath`, `polyPath`) are
  trace-only - `beginPath` to `closePath`, no fill - and every other `chainPath`
  call site in `draw.ts` fills via `add()` or an explicit `ctx.fill()`. This is
  the only bare one. The next path operation (the eye's `ovalPath`) begins a
  new path and discards the brow, so every portrait shows the coarse STRAIGHT
  brows underneath while `browArch` is read to no effect.

  Proven by pixel, not just by reading: Guan Yu's near-brow arch-apex
  crescent, canvas (158, 81) - inside the curved shape (0.29 local units within
  its edge) and 0.45 units clear of the straight stroke's top edge - is pure
  skin (168,68,47, exactly his complexion) in BOTH the coarse-only render and
  the full `drawKindPortrait` render, and 0/81 pixels differ in the 9x9 around
  it. The curved pass paints nothing.

  Why nothing caught it: portrait art is deliberately invisible to the sprite
  gates (the isolation that protects them also blinds them), and the
  eye-verification passed because straight brows still look like brows - the
  arch is sub-half-width BY DESIGN, so the review compared "straight" against
  "straight" and called it arched.
- Acceptance criteria:
  - [x] The curved brow is filled: one `ctx.fill()` after the `chainPath`, or
        the trace routed through `add()` like every other site. No endpoint,
        width or arch value changes - the geometry was verified correct, only
        the paint is missing
  - [x] Re-rendered and judged by eye: all five hero portraits and Xiahou Dun,
        at the sizes the game shows (roster, panel, HUD plate)
  - [x] A gate that pins the paint, not the geometry: render `drawKindPortrait`
        against `drawFigure` with the identical transform and require the
        arch-apex crescent pixels (computed from the kind's FACES row, inside
        the curved shape and clear of the straight stroke) to differ.
        Proven able to fail: removing the fill makes the gate fail
  - [x] lint, typecheck, unit, e2e, vision, prodbuild, signal, build
- Non-goals:
  - No brow redesign. Same endpoints, same widths, same arch values.
  - No change to the coarse in-play face or to any other portrait mark.

### DIFF-1 - The measured difficulty curve is uneven in three places

- Status: BLOCKED
- Blocked reason:
  Awaiting an owner design decision. Balance is a design call: the measured
  data says where the curve is uneven, but nothing in the repository states
  what the intended curve IS, and smoothing it would change the game's
  difficulty - exactly the kind of change this loop must not make unasked.
  Reset to TODO once the owner has chosen a direction (smooth it, or accept
  the shape and close this).
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
  - [ ] Owner has chosen: smooth the three anomalies, or accept the shape and
        close this task
  - [ ] Any change re-measured with the same two-seed marathon, before and
        after, recorded here
  - [ ] `npm run signal` green throughout - stage data is sim data, so seeds
        and every seeded expectation change with it deliberately
- Non-goals:
  - No balance change without that owner decision.
  - No change to heroes, enemies' stats in isolation, or AI - stage content
    (`waves`, `bossKind`, mounts) is the lever this data points at.

### ART-4 - The portraits had nine times the pixels and the same cartoon eyes

- Status: DONE
- Requirement:
  The owner looked again after ART-1/1b/3 and said the heroes still do not look
  human. Right again, and the specific cause: ART-3 raised the portrait budget
  to roughly 84x72 pixels of face, but the detail pass layered refinements
  ON TOP of the old face instead of using the budget. The eyes were still
  solid near-black ovals with a catchlight - the single strongest "cartoon, not
  human" signal there is.
- Fix, in the portrait pass only:
  - A human eye replaces the dot: warm-white sclera large enough to swallow the
    coarse oval, a dark-brown iris offset toward the nose (a centred gaze reads
    as a stare), a pupil, a catchlight, and the lid line over the top. Eye
    colours are constants - warm whites and brown irises, because the cast is
    Chinese and paper-blue would read as a different art style
  - `FACES` gains `eyeTilt` (丹凤眼 slants, 环眼 stares straight, age droops)
    and `browArch` for portrait brow curvature
  - Lips: shadowed upper lip, lighter lower lip, over the coarse ink line
  - Jaw shading down both sides and a chin light, so the head tapers toward a
    chin instead of running on as an egg
- Acceptance criteria:
  - [x] The five heroes' portraits read as faces with real eyes - verified by
        eye against the render, `artifacts/look/faces-human.png`
  - [x] Xiahou Dun's socket keeps its scar and gains depth, and correctly gets
        NO sclera, iris or catchlight
  - [x] Portrait-only: the in-play coarse face is untouched, so no sprite gate
        is affected
  - [x] lint, typecheck, 144 unit, e2e, vision, prodbuild, signal, build
- Non-goals:
  - In-play fighters unchanged. At a 20px head a human eye is not drawable;
    that would need larger heads and is a design decision.

### ART-3 - The portraits were the in-play head magnified, so they had no detail to show

- Status: DONE
- Requirement:
  The owner looked at the game after ART-1 and ART-1b and said the faces were
  still not faces - "still just some shapes and objects". They were right, and
  the diagnosis is arithmetic rather than taste:

    `PORTRAIT_BOX` 36x40 logical at `RENDER_SCALE` 2 = a **72x80 texture**, in
    which the whole face was about **28x24 pixels**, then upscaled ~1.9x to the
    136x152 the portrait is displayed at.

  Four marks is all that fits in 28x24, which is why the portraits read as blobs
  with dots however carefully those marks were placed. And `drawKindPortrait`
  called the same `drawFigure` as the fighter, so the portrait was the in-play
  head MAGNIFIED - there was no portrait-specific art anywhere in the game.

  Worse, ART-1b had raised `PORTRAIT_ZOOM` 1.02 -> 1.3 and reported it as giving
  "the face more pixels to be seen in". That was wrong: zoom magnifies, it does
  not add resolution, so it made the same 28x24 of face bigger and softer.
- Acceptance criteria:
  - [x] Portraits render at their own scale, `PORTRAIT_SCALE = 6`, for a
        216x240 texture and a face of roughly 84x72 pixels - nine times the
        area. `PORTRAIT_TEXTURE` is exported so the canvas allocation and the
        drawing cannot disagree
  - [x] `drawPortraitDetail` draws the things that need those pixels and exist
        nowhere else: an ear with an inner curve, a cheekbone shade, an upper
        lid over each eye, a catchlight in each eye, a nostril, and a lower lip
  - [x] Called ONLY from `drawKindPortrait`, so the in-play sprites keep the
        coarse face and no sprite gate sees any of it
  - [x] Everything is a fraction of `headR` and shares the landmarks
        `drawDetails` uses, so the two face passes cannot drift apart
  - [x] Memory measured: 203KB per portrait, +0.9MB for the five heroes the
        select screen generates (113KB -> 1.0MB). The project's whole art budget
        is 23.7MB, so this is affordable and worth stating rather than assuming
  - [x] Verified by eye at the sizes the game actually shows: the select roster
        thumbnails, the big portrait panel, and the HUD plate
  - [x] lint, typecheck, 143 unit, e2e, vision, prodbuild, signal, build
- Non-goals:
  - No change to the in-play figures. At 20px a fighter's face still reads as
    two eyes and a mouth, and that is not fixable without larger heads, which
    would change every silhouette and is a design decision rather than a fix.
  - No change to the fight, the stats or the AI.

### ART-2 - The nine bosses are as famous as the heroes and have plainer faces

- Status: DONE
- Requirement:
  Optional follow-on to ART-1, not a defect. Rendering the whole cast at once
  to check the heroes' new faces had not left everyone else looking like a
  different game shows the cast IS coherent - the twelve non-heroes share the
  base complexion, which reads correctly as uniformed troops, and the bosses
  carry distinct headgear that separates them at a glance.

  What it also shows is that the mechanism is now sitting unused for nine
  characters who are as recognisable as the five heroes, and who the player
  fights at the end of every stage:

    ﹒吕布 Lu Bu - the strongest warrior in the story. Conventionally pale, with
      a red-plumed headdress and a sneer.
    ﹒曹操 Cao Cao - the villain of the piece. Conventionally sharp-featured and
      cold; often dark-browed.
    ﹒夏侯惇 Xiahou Dun - who lost an eye to an arrow and ate it. The single most
      recognisable facial feature in the entire cast, currently not drawn.
    ﹒典韦 Dian Wei, 許褚 Xu Chu, 曹仁 Cao Ren, 張遼 Zhang Liao, 徐晃 Xu Huang,
      張郃 Zhang He - the rest, each with a conventional look.

  ART-1 left every kind that says nothing about its face exactly as it was, which
  is why they are unchanged. This task gives them complexions and face kinds
  through the same `FigurePlan.skin` / `FigurePlan.face` path the heroes use.
- Acceptance criteria:
  - [x] Each of the nine bosses declares a complexion and a face kind:
        Li Dian calm, Xiahou Dun fierce, Xu Chu fierce, Cao Ren calm, Zhang
        Liao phoenix, Xu Huang sharp, Zhang He calm, Cao Cao sharp, Lu Bu
        fierce. The complexions are DELIBERATELY modest variations around the
        cast base, unlike the heroes' saturated choices - only Xiahou Dun has
        an iconic colour cue, so inventing strong tones for the rest would be
        colouring for its own sake
  - [x] The rank-and-file keep the shared tone, and a gate now enforces that
        as deliberate rather than accidental: soldier, spearman and archer must
        declare neither complexion nor face kind
  - [x] Xiahou Dun's missing eye, no eyepatch - his depictions show the empty
        socket, not a patch. Drawn in BOTH face passes: a hollow larger than an
        eye with a pale scar crossing it, where the scar must extend PAST the
        socket to read as a wound, because at 20px a plain dark oval reads as
        just another eye. The scar is tinted from the figure's own complexion,
        so it stays his on any skin. His portrait adds a darker core for depth
        and a second short scar
  - [x] A new gate: all nine bosses declare complexion and face kind, no two
        bosses share a complexion, the rank-and-file declare neither, and
        xiahoudun's missingEye is true while every other boss's is false.
        Falsified three ways: two bosses given one complexion fails ("lidian
        and caoren share a complexion"), removing the wound fails ("xiahoudun
        is the one-eyed general"), giving a soldier a complexion fails
        ("soldier is a uniformed troop and keeps the shared tone")
  - [x] The heroes' face gate untouched and still passing; no hero changed, and
        no height, build or silhouette changed
  - [x] lint, typecheck, 144 unit, e2e, vision, prodbuild, signal, build
- Non-goals:
  - Not required for correctness. The cast is coherent as it stands and this is
    an improvement, not a fix.
  - No change to the boss fights, their stats or their AI. Faces only.

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

- Status: TODO
- Requirement:
  A full run is ~13 minutes of uninterrupted real-time action (ENH-6
  zhaoyun marathon: 47,416 ticks) and the game has no way to stop the
  clock: zero matches for "pause" in src/selfplay/test/e2e, no pause key
  on the title screen's control list, no suspend/blur handling in
  gameplay. Add a gameplay pause: one key toggles it, the sim freezes,
  an overlay says so, and resume continues tick-neutrally.
- Acceptance criteria:
  - [ ] P pauses and resumes during stage gameplay, co-op included (both
        players' sim time freezes; nobody moves while paused).
  - [ ] While paused the sim advances zero ticks (pinned: tick count
        frozen across 120 wall frames) and no buffered press leaks through
        on resume.
  - [ ] A legible overlay (dim + PAUSED + resume hint) renders while
        paused; the title-screen control list documents the key.
  - [ ] Resume is neutral: pausing for any length of wall time then
        resuming changes nothing in the sim (pinned by comparing pre-pause
        and post-resume sim snapshots, or equal clear-tick counts
        with/without a mid-run pause).
  - [ ] Full gates green: lint, typecheck, unit, e2e, signal 13/13,
        vision 5/5 (overlay judged by eye at gameplay size, no other frame
        regressed).
- Non-goals:
  - No pause menu, settings, volume, or stage-select. No auto-pause on tab
    blur/hidden (a behavior decision for the owner). No touch pause button
    (stated follow-up if the owner wants mobile parity). No DIFF-1
    impact: pause changes no frame data, spawns, or tuning.
- Evidence:
  - artifacts/loop/proposals-20260921-2038-pause.md (this pass's review).
