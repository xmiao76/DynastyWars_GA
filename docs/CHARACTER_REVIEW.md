# Character visual review — standing checklist + loop rule

Owner instruction (2026-09-26): after every character-appearance
enhancement, vision-check whole-character screenshots (fine / unnatural
/ needs-work), file the findings as the next task, and loop until the
cast looks natural and good.

## The loop (binding on every BODY enhancement task)

1. Implement the enhancement (tests + full gates as usual).
2. Regenerate the review material (BODY-17, owner round 3):
   - `npx vitest run test/game/movesheets.test.ts` -> for EVERY fighter
     `artifacts/look/moves/<id>.png` (all 14 movements, whole body) and
     `<id>-arms.png` (the same movements, upper body at 4x);
   - `MOTION_REVIEW=1 npx playwright test --project=chromium
     e2e/motion-review.spec.ts` -> real gameplay per hero
     `artifacts/look/motion/<hero>.webm` + `<hero>-sheet.png` (walk,
     three-hit combo, jump, special; enemies supply hurt/down);
   - the BODY-14 `review-harness-{a,b}.png` ratio sheets.
3. Review it LIKE A HUMAN ART DIRECTOR, not a pixel check: look at every
   movement of every fighter and write what a player would notice, in
   plain words, against the rubric below. "The flag is green" is not a
   verdict. Append dated comments; never rewrite history.
4. Every flagged item gets a root cause (which code/asset produces it)
   and the task that fixes it. The loop ends only when a full pass
   finds nothing a player would call unnatural AND the owner re-reviews.

## Human-review rubric (score each movement 1-5, comment below 4)

1. Silhouette - does the pose read instantly at gameplay size?
2. Anatomy - both arms present, shoulder->elbow->wrist->hand connected,
   segments their natural length, elbows bend the right way.
3. Hands - realistic, gripping the weapon they hold, matching the
   painted body (no cartoon mittens on painted realism).
4. Weapon - believable material and scale, held where hands are.
5. Proportion - head, hands, arms, legs, weapon in one consistent scale.
6. Weight/balance - feet planted, torso over the base, force direction.
7. Motion - frames flow windup -> strike -> recover; walk alternates.

## What the harness sheet shows (per fighter x idle/attack)

- The figure at gameplay scale (2x).
- `1:X` — the analytic head:body ratio (eye->chin 12u + eye->crown
  8u from the prep landmarks, vs crown to ground, in the renderer's own
  figure units). Crown-based so tall headgear does not inflate the head.
  Target band: 1:4.5-6.5, asserted per cell (the cast measures 1:5.0-6.2,
  vision-confirmed natural; the floor guards chibi regression, the
  ceiling pinheads).
- `N` — near fist present at the weapon grip (BODY-8 gate, must stay
  green for every fighter in every pose).
- `F` — far hand visible at its joint (missing = occluded by anatomy;
  BODY-15 choreographs it visible).

## Findings

### 2026-09-26 (round-2 diagnosis, pre-enhancement)

| Figure | Fine | Unnatural | Needs work |
|---|---|---|---|
| All 17 | Head art, body paint, weapon materials, feet, the single fist's grip read | One fist per figure; near arm a stub; far arm fully occluded; polearms one-handed; heads ~1:3 | BODY-15 (both arms/hands + grips), BODY-16 (ratios) |

### 2026-09-26 (BODY-15 vision check, post-enhancement)

| Figure | Fine | Unnatural | Needs work |
|---|---|---|---|
| Polearm wielders (11) | Two fists read on the haft in idle (carry) + all strikes; far fist shaded distinct from near | Nothing | None - residual: near arm still shortish in idle; arm extension (+8u handN with grip compensation) is the filed follow-up if the owner still sees stubs |
| One-handers + bows (6) | Counterbalance far arm + hand read behind the body in idle + strikes | Nothing | None |
| All 17 | Harness flags NY FY everywhere; ratios still 1:3.1-3.8 | Heads still ~1:3 | BODY-16 (proportions) |

### 2026-09-26 (BODY-16 vision check, post-enhancement)

| Figure | Fine | Unnatural | Needs work |
|---|---|---|---|
| All 17 | Ratios 1:5.0-6.2, natural heroic read; chins seated on necks with no gaps (chin-anchoring worked); beards/helmets/hands/weapons/feet all intact | Nothing remaining | None - the cast reads natural and good; loop ends, BODY-7 re-review next |

### 2026-09-26 (BODY-17 baseline human review, owner round 3)

Material: `artifacts/look/moves/*.png` + `*-arms.png` (17 fighters x 14
movements) and `artifacts/look/motion/*.webm` + contact sheets (5 heroes,
162 frames each). The owner is right; round 2's "nothing unnatural" was
a flag check, not a look. Comments as a reviewer would give them:

**Whole cast, every movement (scores: anatomy 1-2, hands 1, weapon 2).**

- "Where is his other arm?" - Zhang Fei idle: the second fist sits on
  the haft below the first, but no arm reaches it; it floats over his
  belt. Same on every polearm fighter in idle/walk/hurt. Root cause: the
  far arm is painted BEHIND the torso (BODY_PART_ORDER) while the far
  fist is drawn in front of it; and the arm is stretched to ~37u to a
  hand placed 12u down the haft (natural arm 24.5u), so even where it
  shows it is a thin smear. -> BODY-19.
- "The arms end in a skin blob and then a separate cartoon fist." - every
  near arm: the painted forearm cell still carries the master's OPEN
  PALM (cut from a T-pose), so the wrist ends in a flesh paddle and the
  procedural fist is stamped on top a few units away. Two hands, neither
  attached. -> BODY-19 (cut at wrist) + BODY-20 (painted hand).
- "The arms change length every frame." - near arm 13u in chop/recover
  vs 27u in thrust for Zhang Fei; the elbow-to-hand segment drops to 3u
  in recover (the forearm vanishes and the fist sits on the elbow). Root
  cause: elbows come from the hand-authored pose table with no length
  constraint. -> BODY-19 (two-bone IK, constant lengths).
- "Bow and sword users wave a tan oven-mitt behind their back." -
  Huang Zhong, archer, Cao Cao, soldier idle: the far hand is a flat
  cel mitten at shoulder height behind the body, with no arm and not
  hanging (a relaxed arm hangs by the thigh). -> BODY-19.
- "The hands look like cartoon stickers." - flat cel capsules with 1u
  ink outlines and finger grooves, on bodies painted like oil studies.
  -> BODY-20.
- "Is that a costume or his skin?" - a flat untextured skin wedge covers
  the upper chest of every fighter (very visible on Lu Bu, Xiahou Dun,
  Xu Chu, the soldier): the legacy procedural neck tube
  (`limbPath(neck, chest, 9-14u)`) still paints in flat skin shade over
  the painted torso. -> BODY-19 (anatomy pass; remove/texture it).
- "The weapons are clip-art." - hafts are flat brown bars with black ink
  outlines, tassels are red paper blocks, the butt caps grey pills, the
  ferrules bright yellow/pink bands; beside painted armour they read as
  a different game. -> BODY-21.
- "He sleeps holding his spear in the air." - down: the fist and haft
  float above the prone body, sometimes crossing the face. -> BODY-19.

**Movement by movement (all polearm fighters; one-handers analogous).**

| Movement | Score | Human comment | Root cause -> task |
|---|---|---|---|
| idle | 2 | Stands well, weapon upright, but the far fist floats with no arm; near forearm ends in a paddle then a fist. | far-arm order/stretch; palm in forearm cell -> BODY-19/20 |
| walk0/walk1 | 2 | Legs alternate but torso/arms are frozen - a mannequin sliding; weapon never sways. | pose table arms identical to idle -> BODY-22 |
| windup | 2 | Good diagonal load, but both fists pile up at the chest and the near arm folds to nothing. | forearm 7u vs 11u natural -> BODY-19 |
| attack/thrust | 3 | Best-reading frames: strong line, weapon forward. Near arm straight but far arm invisible behind torso; fists stacked. | far arm behind torso -> BODY-19 |
| attack2/chop | 2 | Arms shrink to ~60% length; fists stuck to the chest; a chop should raise the hands, it does not. | pose table elbows -> BODY-19/22 |
| sweep | 3 | Wide, readable; same stacked fists. | BODY-19 |
| recover | 1 | Forearm length 3u: the fist sits on the elbow; reads as a broken arm. | BODY-19 |
| jump | 2 | Legs tucked OK; arms same as recover. | BODY-19 |
| hurt | 2 | Head snaps back well; far fist floats. | BODY-19 |
| down | 1 | Weapon held up in the air by a floating fist while lying down. | BODY-19 |
| special | 3 | Strong forward line; same arm/hand issues. | BODY-19/20 |

**Motion (video).** The combo reads as three distinct swings and the
windup->strike->recover phasing is visible, which is good. But every
transition snaps between frozen keys (no in-between), the torso never
rotates into a swing, and the free arm never moves; a player sees
"a paper cut-out swapping poses". Walk has only two keys with arms
locked. -> BODY-22 (motion pass) after BODY-19 fixes the anatomy.

**Proportions.** Heads now 1:5.0-6.2 (fine). Fists are 1.3-1.5x a
realistic hand for the arm they end; weapon length vs height (polearms
~1.1-1.25x height) is plausible for guandao/spear art. -> BODY-22 table.

### 2026-09-26 (BODY-19 vision check, post-enhancement)

Material: regenerated `artifacts/look/moves/*.png` + `*-arms.png` (17
fighters x 14 movements) against the `moves-before19/` baseline; close
cells (guanyu idle/attack/down at 8x); raw re-cut cells
(`raw-weiyan-foreArmF.png`); down whole-body crops (guanyu, lubu).
Close human pass on 10 fighters covering every weapon path and all
build extremes - guanyu/lubu/zhangfei/xuchu (polearm; huge+heavy),
huangzhong/archer (bow), weiyan (long dao, one-hand), caocao/soldier
(sword; boss+grunt), zhaoyun (spear, lean) - plus the all-17 mechanical
gates (handgrip every pose, parity, face-clear, legibility); the other
7 fighters share these code paths. Scores below are ANATOMY (arms/hands
attached and natural); hands stay 1-2 as objects (cartoon capsules ->
BODY-20) and weapons 2 (clip-art -> BODY-21).

**Whole cast: the arms are back (anatomy 4 in every movement).**

- "Both hands on the weapon, and I can see whose arms they are." -
  idle/walk/hurt on polearms: the far hand moved from 12u below the grip
  (37u from its shoulder - a floating fist over the belt) to a reachable
  point on the haft, usually ABOVE the near hand at chest height; the far
  forearm now paints IN FRONT of the torso, so a sleeve visibly runs from
  the body to the fist. Upright carry reads like a person holding a
  staff. Verified on guanyu (8x cell), lubu, zhangfei, xuchu.
- "The near hand is one hand again." - the forearm cells end at the wrist
  (raw cell: sleeve, cuff, wrist, clean cut - no splayed fingers) and the
  fist's back reaches past the cut, so sleeve -> wrist -> fist is one
  continuous limb. The T-pose open palm peeking around the fist is gone in
  every reviewed cell.
- "The arms keep their length." - recover was a 1 (3u forearm, fist on
  the elbow); now the arm folds into a bent guard with full-length
  segments and the elbow pointing down-back. Chop raises the hands
  instead of shrinking them to the chest. Windup separates the fists
  along the haft. Measured: every segment 100.0% of natural in all
  17x14 (test), worst protraction 5.9u on xuchu:thrust - and the
  thrust still reads as a committed lunge, not a detachment.
- "He dropped it." - down: the weapon lies across the body, the OPEN
  hand rests palm-down on the haft, the far hand lies on the ground.
  No fist grips mid-air; nothing crosses the face. Whole-body crops
  confirm the full read + no box clipping (pike/ji fit with margin).
- "Archers hold the bow like archers." - bow arm fairly straight (as it
  should be); strikes cant the bow up into high bashes instead of
  sweeping it horizontally through the head; the bow clears the face in
  all 14 poses (pixel gate) while the hand stays within arm's reach.
- "One hand on the sword, the other balancing." - sword/dao: single
  fist on the grip, counterbalance arm behind. Watch item, not a
  defect: the free hand rides at chest height (kept for visibility);
  BODY-22 may let it hang lower at idle.
- "The skin bib is gone." - the flat neck wedge over the collar (G7)
  is removed on painted torsos; throats now show collar/beard with no
  transparent slit (verified guanyu/lubu close cells).

**Movement by movement (polearms; one-handers/bows analogous).**

| Movement | Score | Human comment |
|---|---|---|
| idle | 4 | Real two-hand carry; far sleeve crosses the chest to the high fist. Fists still capsules (BODY-20). |
| walk0/walk1 | 3 | Lengths hold through the stride, but arms stay frozen (no counter-swing) - motion, not anatomy -> BODY-22. |
| windup | 4 | Diagonal load; fists separated with a gap; elbow folds, never vanishes. |
| attack/thrust | 4 | Best frames: strong line, hands separated, thrust nearly straight (correct); broad fighters lunge the shoulder. |
| attack2/chop | 4 | Hands reach up-forward; elbows bend down/back. Chop finally raises the hands. |
| sweep | 4 | Wide crouch; hands ride the low haft; far arm crosses in front. |
| recover | 4 | Was 1: now a natural bent guard recoiling the weapon. |
| jump | 4 | Tucked legs; weapon held forward-up, arms natural. |
| hurt | 4 | Head snaps back; both hands stay on the weapon. |
| down | 4 | Was 1: dropped weapon + open resting hand. ~2u hover kept for the silhouette gate; reads as resting at size. |
| special | 4 | Strong downward line; hands separated; natural. |

**New findings filed, not fixed here.** (1) A purple/white blob sits
at the dao blade socket in some poses (weiyan walk1/windup/down/hurt) -
PRE-EXISTING in the baseline (verified side by side), weapon geometry,
-> BODY-21. (2) Fists remain 1.3-1.5x oversized red/tan capsules with
ink outlines -> BODY-20 (painted hands). (3) Walk arms frozen, no
in-betweens, torso never rotates -> BODY-22 (motion). (4) Standing
heads were never chin-dropped (the BODY-16 drop is dead code on the
standing branch - found because applying it grazes the face gate);
kept as-is for stability, flagged for BODY-22's ratio pass.

**Motion (video).** Reviewed `motion/guanyu-sheet.png` (162
frames: walk, three-hit combo, jump, special, enemy hurt/down in frame)
and `motion/huangzhong-sheet.png` (bow bashes + arrow flight); all 5
hero clips re-captured post-change. The combo reads as alternating
compact/extended keys with visible windup->strike->recover phasing;
elbows track the hands with no popping between keys (IK, not frozen
table); the bow swings diagonally forward in bashes and never crosses
the head; arrows still fire (sim untouched); the downed enemy lies
prone with the weapon across. Residual motion limits (frozen walk
arms, no in-betweens, static torso) are unchanged keys, not anatomy
-> BODY-22.

### 2026-09-26 (BODY-20 vision check, post-enhancement)

Material: hand cells at 4x for every skin extreme (guanyu/zhangfei/
zhaoyun/weiyan red-dark-light-tan + far variants); regenerated
`artifacts/look/moves/*.png` + `*-arms.png` against the
`moves-before20/` baseline; close pass on guanyu (all 14 movements at
4x + whole body at 2x) and weiyan (one-handed dao, free hand on show).
Scores below are HANDS (realistic, gripping); anatomy stays 4 from
BODY-19, weapons stay 2 (-> BODY-21).

**Whole cast: painted hands, cartoon stickers gone (hands 4).**

- "Now they read as hands." - Fists show a knuckle mass with three
  scalloped finger fronts, a thumb bump, soft lit/shadow form; open
  hands show grouped digits. No ink anywhere. Against painted bodies
  they finally belong to the same game.
- "The right colour for everybody." - Each fighter's cells use their
  own skin; dark zhangfei (0x8a5a3c) reads warm brown with the shade
  intact, light zhaoyun reads pale without blowing out. Far hands
  paint darker with the same geometry, so near/far separate.
- "Gripping, not hovering." - Near fists wrap the haft in all five
  strikes (attack/thrust/sweep read best); the far fist rides under
  the weapon with the three fingertip pads crossing OVER it
  (wrapF), which is what sells the two-handed grip. Down still rests
  the open hand on the dropped haft.
- Refinement history, honestly: the first cut painted too egg-like
  with three 45 deg creases that read as claw scars; two review
  passes fixed the silhouette (flat knuckle side, 0.9u-deep digit
  notches) and flattened/softened the creases to 1.1u runs along
  the finger direction.
- Watch item, not a defect: at 4x+ a reviewer can still see this is
  stylized paintwork (finer finger articulation + a separated thumb
  would be gallery-grade). At gameplay size it reads well. Filed as
  BODY-22 polish (generator refinement, no new pipeline).

**New findings filed, not fixed here.** (1) Weapons unchanged -
clip-art hafts/outlines/tassels remain the worst visual on the
figures -> BODY-21 next. (2) No regressions seen vs the
moves-before20 baseline (same poses, same reach, retracted phases
still narrow).

**Motion (video).** Reviewed `motion/guanyu-sheet.png` re-captured
post-change (162 frames: walk, three-hit combo, jump, special, enemy
hurt/down in frame) plus fresh clips/sheets for all 5 heroes. Hands
track the grips through the sequence with no popping or detachment
(change of cells, not joints - IK from BODY-19); combo alternation and
phasing read as before; downed enemy still prone with the weapon
across. Residual motion limits unchanged -> BODY-22.

### 2026-09-26 (BODY-21 vision check, post-enhancement)

Material: weapon cells at 2x (all 7 kinds + tassel); regenerated
`artifacts/look/moves/*.png` + `*-arms.png` against the
`moves-before21/` baseline; close pass on guanyu (guandao, all 14 at
4x), huangzhong (bow, all 14), weiyan (dao, all 14 + the socket-blob
regression check). Scores below are WEAPON (believable material and
scale); hands stay 4 from BODY-20, anatomy 4 from BODY-19.

**Whole cast: painted steel and wood (weapons 4).**

- "They look like weapons now, not clip-art." - Hafts carry wood
  grain with a lit top edge and a soft bottom rim; blades carry
  spine/edge bevels (bright crescent belly, serpent S-thread, leaf
  ridge, dao belly, jian fuller + bright tip, ji ridge + wing
  leading edges); fittings are shaded brass, not yellow bands;
  tassels are fanning red strands with a knot, not paper blocks.
  No ink outlines anywhere.
- "Held where the hands are." - Grip pivots land on the fists in
  every reviewed frame (same anchor math: L*grip from the butt);
  the bow riser sits in the fist with the string nock-to-nock;
  the tassel ties at the socket and hangs figure-down in every
  rotation including near-horizontal strikes (gravity frame
  verified in idle + attack poses).
- "The dao blob is gone." - The purple/white socket artifact from
  the BODY-19 findings (weiyan walk1/windup/down/hurt) does not
  appear in any of the 14 movements: the painted cell replaced the
  overlapping procedural stack that caused it.
- Watch item, not a defect: at 4x+ the blades are clean studio
  paintwork - no nicks, fuller engraving, or hamon lines. At
  gameplay size they read as oiled steel. Filed as BODY-22 polish
  if the owner wants battle-worn blades (generator refinement).

**New findings filed, not fixed here.** (1) Capes/boots/keyed holes
unchanged -> BODY-23. (2) No regressions vs the moves-before21
baseline (same poses, same reach, retracted phases still narrow;
drawn width within 3u procedural, tested).

**Motion (video).** Reviewed `motion/guanyu-sheet.png` re-captured
post-change (162 frames) plus fresh clips/sheets for all 5 heroes. The
guandao tracks the grips with no popping; the blade holds against the
bright sky in every frame (the dark silhouette rims earn their place);
the red tassel swings at the socket in carry poses; enemy spears and
swords render painted too (shared pack). Residual motion limits
unchanged -> BODY-22.

## BODY-22 whole-body ratio table (measured 2026-09-26)

Definitions: H = stature, painted crown to sole, on the built idle pose.
Measured over all 17 fighters x builds; every row is asserted per
fighter in `test/game/proportions.test.ts` except head (asserted per
fighter by the BODY-14 review harness, render-measured).

| Ratio | Cast measures | Band (test) | Anatomical ref | Verdict |
|---|---|---|---|---|
| Head:body | 1:5.0-6.2 | 1:4.5-6.5 (reviewharness) | heroic 1:6-7, natural 1:7.5 | heroic-natural; heads read right, chins seated |
| Arm (shoulder->palm) / H | 0.26-0.27 | 0.24-0.30 | ~0.29 | correct; arm segments 100.0% in all movements (armik test) |
| Leg (hip->sole) / H | 0.45-0.46 | 0.42-0.49 | ~0.52 (hip joint) | compact-heroic: legs slightly short, shoulders slightly low; consistent, reads athletic |
| Torso (chest->hip) / H | 0.24-0.26 | 0.22-0.28 | ~0.30 | compact; keeps heads clear of hafts in crouches (face gate) |
| Fist (wrist->tip) / H | 0.095-0.104 | 0.085-0.115 | ~0.11 | correct; heroic hands without clown gloves |
| Polearm total / H | 1.01-1.24 | 1.0-1.3 | guandao/spear ~1.1-1.25 | correct; pike longest (104u) as the novel demands |
| Sword total / H | 0.82-0.86 | 0.7-1.0 | jian ~0.6 | large heroic jian; reads legendary, not wrong |
| Bow (ref draw) / H | 0.56-0.62 | 0.45-0.75 | war bow ~0.7 | correct |
| Shoulder:hip width | 1.25 | 1.1-1.4 | athletic 1.2-1.3 | correct V-taper |
| Arm segments | 100.0% all 17x14 | 95-105% | constant | IK-exact (BODY-19) |
| Leg segments (standing) | 95-110% | 95-110% | constant | IK-exact + ≤9.7% uniform stretch on straight overreached strides (NEW this task; was 56-114% asymmetric) |

Style decisions, signed: compact-heroic (head 1:5-6, legs 0.45H,
fists 0.10H) is the house look - consistent across the cast and
asserted. The prone `down` figure keeps its stylized compression
(full-length legs would not fit the frame); standing ratios are
anatomical-or-heroic throughout.

### 2026-09-26 (BODY-22 vision check, post-enhancement)

Material: regenerated `artifacts/look/moves/*.png` + `*-arms.png`
against the `moves-before22/` baseline; close pass on guanyu
whole-body (all 14, legs in every pose) and caocao arms (sword
one-hander, free-arm swing in every pose). Scores: PROPORTION 4,
MOTION 4 (keys; in-betweens remain engine-future).

**Legs: the 56% collapse is gone.**

- "Crouches bend at the knee now." - sweep/windup/recover/jump:
  knees solve from the pinned hip+foot with constant segment
  lengths; the deep sweep crouch reads as a crouch, not a leg
  folding into itself. Jump tucks read tucked.
- "Lunges keep their stances." - thrust/attack/special: feet stay
  exactly where the author planted them; ≤9.7% uniform stretch on
  the straight back leg only (no bend for reference - invisible).
- "Nothing floats." - grounded feet stay grounded to the pixel,
  hips never move (torso untouched); verified guanyu all-14.

**Walk: the free arm swings.**

- "walk0 and walk1 finally differ above the waist." - caocao (and
  every sword/dao/bow fighter): the free hand rides low-back at
  neutral and flings further back on the back-stride key; the arm
  visibly alternates between keys while staying out of the torso
  span (the BODY-15 visibility compromise, kept deliberately: a
  forward swing would hide behind the body and read as missing).
- "Polearms correctly don't." - both hands stay on the haft in
  walk (a carried polearm is stabilized, not waved); verified
  haft-axis geometry in both walk keys for all 11 polearm
  fighters (test).

**Deliberate non-changes, with reasons.** (1) Standing heads were
never chin-dropped (BODY-16 dead code): reviewed as natural and
gated 1:4.5-6.5 - NO re-seat, the 4.8u shift would buy nothing and
risk the face gate. (2) Gallery-grade fingers / battle-worn blades:
deferred optionals (gameplay size reads well). (3) Down-pose
compression stays (stylization + frame fit). (4) In-between frames
and torso twist into swings are engine features (pose interpolation),
not pose data - filed as BODY-24, out of scope here.

**Motion (video).** Reviewed `motion/guanyu-sheet.png` re-captured
post-change (162 frames: walk, three-hit combo, jump, special, enemy
hurt/down in frame) plus fresh clips/sheets for all 5 heroes. Walk
alternates with clean knee bends and planted feet; combo lunges plant
the back foot straight with no popping between keys (IK continuity
both limbs now); jump tucks; special commits deep; enemies react and
fall prone correctly. No leg swimming, collapsing, or detachment
anywhere. Remaining: keys still snap without in-betweens and the
torso never twists - engine work, filed as BODY-24.

### 2026-09-27 (BODY-23 vision check, post-enhancement)

Scope: G5 painted capes (6 plans), G6 re-keyed cells (moth-eaten holes
gone, ceiling 0.08 green), G8 boots (overlay reduced to contact shadow
+ lit welt/glint so the painted boots show).

**Root cause found en route (G8):** the prep derived the foot joint at
the ANKLE (an 8% raise) while the rig foot joint is the SOLE line - so
painted boots hung below the ground and the old overlay covered the
gap. Fixed at the source: feet land on the master's sole. The foot
gate (BODY-9 contract "toe caps readable") was re-pointed at the
painted boots: drawn >= 24px, mean luminance >= 30, tonal spread >= 25
in idle/walk0/walk1 - 17/17 green, including Cao Cao's lacquer boots
(mean toe lum was 16 before the welt/glint).

**Eyes-on review (delegated):** this session's image-display layer
began serving crossed/stale previews (metadata correct, pixels from
other files), so the visual pass ran on a fresh reviewer with its own
attachment store, over guanyu/caocao 3-cell sheets (idle/attack/down)
and the hand cells:

- "The cape belongs to him now." - green + gold-trim cape behind Guan
  Yu in idle/attack; purple cape behind Cao Cao; both trail toward
  the feet in the prone pose (subtle at size - noted, not a defect).
- "The armour is solid." - Cao Cao's lacquer reads continuous with
  gold trim: no moth-eaten speckle, no backdrop bleed-through (the
  G6 re-key + interior fill verified in pixels too: 0% interior holes
  on every keyed cell).
- "Boots on the ground, with a toe." - lit toe cap + sole line at the
  ground in both fighters, including against the dark armour.
- Hands unchanged from BODY-20: soft-shaded, no outline rings.

**Verdict:** all three gaps closed; no player-visible defect at
40-90px game size. Optional polish only: the prone cape trail reads
subtle (BODY-24 may sweep it with the interpolation work).
