# UI review ledger

The durable memory of the art-director review (`docs/VISUAL_REVIEW.md`).
Findings are `V-n`, never renumbered. Status is one of `open`, `batched UIR-n` (in a pending batch below), `filed UIR-n`,
`fixed <commit> (unverified)` (legacy: `(self-check)`; set by the fixer, never final), `verified <date>` (only by a LATER producer pass on a fresh capture + pair sheet), `reopened <date> -> V-m`,
`deferred <track>`, `intended`, `harness` or `owner`.

## Last full review

- Date: 2026-10-03. Commit: `4b4671c`. Capture: full (flow + stages + platform + anatomy + V-15b pairs). Previous full review: 2026-10-02 at `e730034`.
- Scope: all three contact sheets + the changed screens/crops on the fresh capture, with the image tool; deep-dive rotation this pass = characters (movesheets and motion - all 4 triggering commits are motion-pack/runtime work, e3e70cf relevance precedent). Capture vs `e730034`: 382/488 files byte-identical; all 238 anatomy cells + every clean/x-ray/ids sheet byte-identical (grid carries); suspects identical (commit label only); inventories differ only in per-run Phaser object UUIDs (+ title tween-phase alpha/rounding, adjudicated); screen/crop diffs adjudicated by region analysis + reads: boss-warning 0.36% confined to the banner band (slide-tween phase, V-2 holding with title+subtitle visible), banner crop 1.84% same band at crop scale, select roster 0.07-0.21% confined to highlighted columns (cursor-glow phase; zhangfei/zhaoyun 0.00%), title 0.32% sparse animated-phase + AA (inventory-confirmed tween), stage5-intro 0.11% sub-visible AA band (visualized), everything else 0.00-0.03% AA noise. V-15b pairs unchanged on every fighter incl. archer + zhangfei (owner-blocked UIR-16, no re-open); zhangfei row opened cell-by-cell (matches incl. the A V-15b attack); down column re-checked on current pixels (caoren/guanyu V-16 cause GONE, UIR-17 fold present, A prone foreshortening stands). Motion deep dive: 09B zhangfei capture independently verified (73-row trace re-computed clean: all keys in pack, bookends hold, attack/group alignment, no mixing; money poses confirmed fresh-eyes; collapseTail fix reviewed); motion packs additive-only, default-legacy rendering untouched. Signals: selfplay 13/13 + vision 5/5, both negative controls failing correctly, no page errors/violations. No new findings; no UIR filings.
- Next review due when `git rev-list --count 4b4671c..HEAD -- src/game` >= 4.
- Handled 2026-09-28 at `9fd19c2`: full 238-cell grid re-judged fresh, V-15a/c/d/e verified, batch 3 filed. Follow-up pass 2026-09-28 at `ac59129`: V-9/V-11/V-10/V-13-sky/ridge verified on fresh pixels; grid carried on 289/289 identical pairs + 56 re-opened cells (figure renderer untouched); V-19 embers filed UIR-20, ground folded into UIR-11. Follow-up pass 2026-10-01 at `4bce5d8` (13 commits, count-triggered): signals 0/0 + capture 0; V-16/V-17/V-19 verified on fresh pixels (pairs/cells on stamped composites, G5-down + G7 + emberscale green, V-17 notes all >= 27%); grid carried (chain geometry untouched by the UIR-19 hand work); no new findings; queue owner-gated (UIR-16/UIR-19 BLOCKED). Follow-up pass 2026-09-29 at `ff03538`: V-13 + V-19-ground verified on fresh pixels; grid carried on 289/289 identical files vs the V-15b baseline + 28 re-opened cells (UIR-16 bends reverted pixel-exact); no new findings. Follow-up pass 2026-10-01 at `e3e70cf` (4 src/game commits, count-triggered; the CMR-03 motion runtime is opt-in and the capture runs default art): signals 0/0 + capture 0 new findings (logic 13 passed incl. co-op; vision 5 passed, both negative controls failing correctly); grid carried on 238/238 identical cells; down column re-checked on current pixels - caoren-down and guanyu-down both show the V-16 detached-hand cause GONE (UIR-17 fold present, far chain behind/on the body), leaving the recorded A-class prone foreshortening; zhangfei sheet opened cell-by-cell (matches its row incl. the A V-15b attack with R3's N dissent); V-15b cells unchanged (owner-blocked UIR-16, no re-open); V-16 unpinned after its verified state (`--unpin V-16`; its 448065f pin predates the capture-framework change, so its pair sheets compare old- and new-framing cells - the same limitation the V-15 post-vs-post pairs recorded); no new findings, no UIR batch, no proactive proposal (queue has ready CMR work). Follow-up pass 2026-10-02 at `e730034` (4 src/game commits, count-triggered; all motion-pack additive content): signals green (selfplay 13/13, vision 5/5) + capture 0 new; grid carried 238/238 identical; screen diffs adjudicated by region analysis (tween/cursor/jitter, V-2 holding); V-15b unchanged; no new findings, no UIR batch, no proactive proposal (queue has ready CMR work). Follow-up pass 2026-10-03 at `4b4671c` (4 src/game commits, count-triggered; all motion-pack/runtime additive content): signals green (selfplay 13/13, vision 5/5) + capture 0 new; grid carried 238/238 identical; screen diffs adjudicated by region analysis (tween/cursor/jitter + visualized stage5 band, V-2 holding); V-15b unchanged incl. archer/zhangfei; 09B motion evidence independently verified; no new findings, no UIR batch, no proactive proposal (queue has ready CMR work).

## Coverage (deep-dive rotation)

| Area | Last deep review |
| --- | --- |
| menus | 2026-10-03 (sheet level) |
| HUD & overlays | 2026-10-03 (sheet level; V-1..V-7 holding) |
| stage flow screens | 2026-10-03 (sheet level; boss-warning re-adjudicated tween-phase, V-2 holding) |
| all nine stages | 2026-10-03 (sheet level; embers on 7-9; V-13/V-19 holding) |
| characters (movesheets, motion) | 2026-10-03 deep pass at `4b4671c` (grid carried 238/238 identical; suspects identical; V-15b pairs unchanged incl. archer/zhangfei; down column re-checked; 09B motion evidence independently verified; motion packs additive-only, default-legacy rendering untouched) |
| phone | 2026-10-03 (sheet level; overlay + landscape holding) |
| WebGL | 2026-10-03 (sheet level; vision parity green) |

## Scoreboard (lowest applicable R1-R9, 1-5)

| Screen group | Score | Held down by |
| --- | --- | --- |
| title | 4 | - |
| select-* | 4 | - (V-4 verified 2026-09-28) |
| stage*-idle/play/combat (HUD) | 4 | - (V-1, V-11 verified) |
| stage1-boss-warning | 4 | - (V-2 verified 2026-09-28) |
| stage*-banner / stage*-intro | 4 | - (V-3 verified 2026-09-28) |
| stage1-pause | 4 | - |
| stage1-continue | 4 | - (V-6, V-7 verified 2026-09-28) |
| stage*-result | 4 | - (V-4, V-5, V-6 verified 2026-09-28) |
| gamecomplete, gameover | 3 | V-8 harness zeros; cramped footer |
| phone-portrait-* | 4 | - (V-9 verified: themed overlay) |
| phone-landscape-* | 4 | - (V-10 verified; V-13 backdrops complete) |
| webgl-* | 4 | - (fresh frames reviewed; parity green on re-run) |

## Findings

### V-1 - Stage name is printed over the SCORE readout (S2, LAYOUT) - verified 2026-09-28
- Evidence: `crops/stage1-idle--centre.png`: 博望坡 sits on top of "SCORE 0"; the two lines share pixels. Kit suspect "overlapping text" on all 45 in-game screens, all 9 stages, phone and WebGL.
- Root cause: `src/game/ui/hudlayout.ts:44-45`: STAGE_LABEL y1 (9px, top origin, spans y1-11) and SCORE y12 (9px, centre origin, spans y7-17) overlap by ~4px; created at `src/game/scenes/HudScene.ts:387-395`.

### V-2 - Boss WARNING banner is drawn UNDER the boss rail (S1, DEPTH) - verified 2026-09-28
- Evidence: `crops/stage1-boss-warning--banner.png`: only the subtitle "Li Dian 李典" shows; the red rail covers the WARNING title completely.
- Root cause: `src/game/scenes/HudScene.ts:670-679` puts every banner at depth 9_800 "under the HUD plates", but the boss rail (`HudScene.ts:325-326`, depth 10_000, y40-58) appears in the same frame as the boss banner (y34-78), so the rail wins.

### V-3 - Stage banner and intro card announce the same thing at the same time (S2, TIMING) - verified 2026-09-28
- Evidence: `crops/stage1-intro--intro.png`: the banner's "Bowang Slope · 博望坡" still shows above the intro card, which repeats "STAGE 1" and "Bowang Slope · 博望坡". The same happens on all nine `stage*-intro` shots.
- Root cause: `src/game/scenes/HudScene.ts:484` raises the card 1_600 ms after build, while the banner (`HudScene.ts:175`, BANNER_HOLD_MS plus 180 ms in and out) is still up. Both carry stage number and name.

### V-4 - 7px body-font labels: unreadable, and a second typeface (S2, TYPE) - verified 2026-09-28 (result + roster instances; HORSE row and webgl-result unseen - no phone/webgl frames, see capture note)
- Evidence: `screens/stage1-result.png`: LIVES / SCORE / TIME are thin grey Arial-style caps, unlike every other word on the panel. `crops/select-zhaoyun--roster.png`: LIFE / SPEED are the same sans. `screens/stage6-play.png`: "HORSE 20" is light grey sans on the gold plate. On a Pixel 7 this becomes about 6 CSS px.
- Root cause: `liveStyle()` (`src/game/ui/type.ts`) selects BODY_STACK below DISPLAY_MIN_SIZE. The callers pass 7: `src/game/scenes/ResultScene.ts:186` (chip label), `src/game/scenes/SelectScene.ts:127-128` (stat rows), and `src/game/ui/hudlayout.ts:21` META_ROW size 7.

### V-5 - Result chip row is not centred and the LIVES chip sits on the panel frame (S2, LAYOUT) - verified 2026-09-28
- Evidence: `screens/stage1-result.png`: the LIVES chip's left edge is on the parchment border. The gaps are 32 and 16 logical px, and the row spans x70-390 (centre 230, not 240).
- Root cause: `src/game/scenes/ResultScene.ts:114-116` hard-codes x offsets -170, -76 and +60 with widths 62, 120 and 90, rather than laying out from the panel rect.

### V-6 - Panel titles collide with their card's top frame (S2, LAYOUT) - verified 2026-09-28
- Evidence: `crops/stage1-continue--dialog.png`: CONTINUE? crosses the gold top rule. `screens/stage1-result.png`: STAGE CLEAR! touches the top bar. By contrast, PAUSED (`crops/stage1-pause--dialog.png`) sits properly inside its identical card.
- Root cause: `src/game/scenes/HudScene.ts:440` places CONTINUE? at y92 on a card centred at y123 (`HudScene.ts:351`), which is the card's top edge; PAUSED uses y120. `src/game/scenes/ResultScene.ts:98` places STAGE CLEAR! at y84 on the victory panel at y100.

### V-7 - CONTINUE? title and countdown have no contrast on parchment (S2, COLOUR) - verified 2026-09-28
- Evidence: `crops/stage1-continue--dialog.png`: flat #ffd700 title and a white "9" on cream. PAUSED on the same card has a dark stroke and reads cleanly.
- Root cause: `src/game/scenes/HudScene.ts:440-448`: `liveStyle(22, {color:'#ffd700'})` and `liveStyle(30, {color:'#ffffff'})` without the stroke used at `HudScene.ts:461`.

### V-8 - End screens show 0 score and 0.0s (harness)
- The capture forces the result, game-over and complete screens, so the stats are empty. Number formatting and long-score fit on these screens are unjudged. Next capture fix: seed stats (see Harness backlog).

### V-9 - Phone portrait shows a 412x232 game on an 839px-tall screen (S2, PLATFORM) - verified 2026-09-28
- Evidence: `screens/phone-portrait-game.png`: the game fills 28% of the height; the touch buttons are about 20 CSS px, and there is no hint to rotate.
- Root cause: `src/game/main.ts:31-32` (Scale.FIT, CENTER_BOTH) has no orientation handling in `index.html` or `src/style.css`. See Owner questions.

### V-10 - Touch d-pad chevrons point inward (S2, ASSET) - verified 2026-09-28 (all four OUTWARD on fresh phone-landscape frames)
- Evidence: `screens/phone-landscape-game.png`: the up arm shows a down-chevron, the left arm ">", the right arm "<" and the down arm "^". The same happens in portrait.
- Root cause: `src/game/art/hudart.ts:487-492`: the chevron path's apex is at +y, so at angle 0 it points DOWN, but `hudart.ts:498-501` assumes angle 0 points up.

### V-11 - Landmark strip uses flat untextured blocks (S2, ASSET) - owner-approved, verified 2026-09-28
- Evidence: `screens/stage1-idle.png`: a flat grey slab with a green lid (the gorge wall). `screens/stage6-play.png`: blank beige rectangles on posts (warship sails) with the hulls sunk below the horizon. `screens/stage7-play.png`: solid red slabs (the cliffs). Next to the painted heroes these read as placeholder art.
- Root cause: `src/game/art/backdrop.ts:324-326` (gorge), `:304-305` (sail 16x6 fillRect), `:444-446` (inferno cliffs) are `fillRect` blocks without tonal bands or ink. The hulls sit below `MARKS_ROOT_DEPTH` (`src/game/scenes/GameScene.ts:67`).
- Estimate: M (one painter, three kinds), with risk to the vision richness gate and the seam unit test.

### V-12 - Mook soldiers read as photo faces on small bodies (S2, ASSET) - deferred BODY track
- Evidence: `crops/stage1-boss--boss.png`: the grunt faces are photographic, flat-lit and large for the body, with no neck blend.
- Owned by the BODY track (BODY-24 and BODY-7 are open; see `CHARACTER_REVIEW.md`). No duplicate task is filed; re-check after BODY-7.

### V-13 - Backdrop layers are flat vector shapes behind painted heroes (S2, ASSET) - verified 2026-09-29 (sky UIR-9, ridges UIR-10, ground UIR-11; ground verified on fresh stage1/stage4 close-ups + all-nine sheet)
- Evidence: every `stage*-play`: the sky is a smooth two-colour gradient; the clouds are hard-edged, flat-filled lobes; the ridge is a single-colour hill with an ink line; the ground is one tint with a dot pattern. Against the painted heroes and the painted title key art (`screens/title.png`), the game looks like two different products (R5 art consistency).
- Root cause: `src/game/art/backdrop.ts` painters `paintSky` :63, `paintCloud` :199, `paintRidge` :110, `paintGround` :155 use flat fills and simple gradients, with no painted tonal masses, texture or atmospheric depth.

### V-14 - Arm, wrist, hand and grip joins look wrong on every fighter (S1/S2, ASSET+DEPTH+STATE) - filed UIR-12/UIR-13/UIR-14/UIR-15
- **reopened 2026-09-28 -> V-15, V-16, V-17, V-18.** Owner: the arm chains still do not connect. The 2026-09-27 "fully addressed" note was the fixers' self-check; no later pass judged the chains per move.
- Fix progress 2026-09-27 (self-check, superseded): J4/J8 by UIR-12, J5/J7 by UIR-13, J1/J3 by UIR-14, J6 by UIR-15.
- Owner report 2026-09-26: "every character's arm position, arm connection to the body, connection to the hand, and the hand's connection to the weapons are not right". The 2026-09-26 review missed it (see VISUAL_REVIEW.md "Why the first art-director review still missed the arms").
- Seed evidence (a spot check, not the full pass), from `anatomy/zhaoyun.png`, `anatomy/guanyu.png`, `anatomy/lubu.png` and the matching `-xray` sheets at `09d7d06`:
  - J4: the hands are flat cream or pink mitten icons with no fingers, unlike the painted face and sleeve on every fighter.
  - J3: in idle, walk and hurt, zhaoyun's near hand hangs at hip level on the haft with no visible forearm leading to it. The x-ray shows the elbow-to-hand segment passing over the torso, so the hand reads as floating.
  - J5/J7: in attack and thrust the haft lies ON TOP of the far fist and the cuff bands. The fists sit beside the haft rather than around it, and the weapon is drawn over the arm holding it.
  - J6: in attack, thrust and chop both arms run parallel under the haft like rails.
  - J1: the painted sleeve never meets the pauldron; the arm reads as pasted onto the torso.
- Likely root causes, to be confirmed by the pass:
  - Hand cells: `scripts/prepare-body-parts.mjs` (hand painter) and `src/game/art/hand-parts.ts`.
  - Weapon draw order against the near forearm: `src/game/art/draw.ts:686-880`, `weaponOrProcedural()` at `:880`.
  - Pose arm geometry: `src/game/art/poses.ts` and `weaponPose` in `src/game/art/weapons.ts:161`.
  - Cell caps at the joints: `src/game/art/body-parts.ts`.
- Pass 2026-09-27: section 2a run on 15 fighters (5 heroes + 9 bosses + soldier); spearman/archer carry pattern verdicts. Split by root cause and filed: UIR-12 hands (J4/J8), UIR-13 grip+layering (J5/J7), UIR-14 sleeves/wrists (J1/J3), UIR-15 strike poses (J6). CHARACTER_REVIEW.md BODY-7 DISMISSED entries are superseded by these verdicts. Previous DISMISSED entries in `docs/CHARACTER_REVIEW.md` ("rear fist floats", "detached off-hand", "off-hand gap") must be re-judged by pixels.

### V-15 - Arm chains do not connect shoulder -> upper arm -> forearm -> hand -> haft (S1, cast-wide, DEPTH+ASSET) - a/c/d/e verified 2026-09-28; b filed UIR-16
- Status 2026-09-28: **V-15a, V-15c, V-15d, V-15e: fixed e4872ce (unverified)** - pair sheets `anatomy/<id>-pair.png` (f3616f1 before, e4872ce after), gates G1-G5 in `test/game/arm-chain.test.ts`. Detector after: weapon over near arm 0 on all standing cells (was up to 92u^2); elbow overlap >= 4.1u (was -0.2u); cuff overlap >= 1.0u and overshoot <= -0.8u (was -1.1u / +2.0u); halo 0 px (was up to 2225); longest near-chain hole 1.25u (was 8.5u). **V-15b: batched UIR-16** (the far fist still sits on the near elbow in strikes: its cause is the strike grip placement, and hiding the fist broke the BODY-15 visible-far-hand gates, so it was not changed). The next producer pass verifies or reopens on its own capture.
- Verified 2026-09-28 on the fresh 9fd19c2 capture: (a) no weapon-over-near-arm off-grip in any ID map opened (zhangfei/guanyu full sheets, caocao-walk1 worst case) + G1 green; (c) no visible chain holes, worst residual 1.3u at a beard edge (legitimate occluder) + gates green; (d) elbows bend smoothly, cuffs flow to fists + gates green; (e) no halo discs on any sheet opened + detector 0px. Pairs are post-vs-post (see note above), so verification rests on fresh pixels + definitions + fresh gates, and shows no new break anywhere.
- Owner report 2026-09-28: every character's shoulder, upper arm, forearm, hand and weapon should connect; the inner side must be continuous (the outer line may be covered). Found by the reworked 2a pass at `f3616f1` (clean sheets `anatomy/<id>.png`, ID maps `anatomy/<id>-ids.png`, crops `anatomy/cells/<id>-<move>.png`, metrics `anatomy/suspects.json`). Five separate rendering causes, lettered so the grid can name them:
- **V-15a - the weapon is drawn over the near arm that holds it (draw order, J7/J9).** Standing moves, near-arm footprint covered by the weapon: caocao walk1 92u^2, weiyan thrust 78, caoren walk1 77, weiyan sweep 75, xuhuang walk1 75, caocao idle 73; 174 of 221 standing cells >= 30u^2 or near upper arm < 15% visible. Near upper arm visible: guanyu thrust 2% (weapon 24%, beard 22%), zhangfei attack 6% (weapon 41%). Crops: `cells/zhangfei-attack.png`, `cells/caocao-walk1.png`, `cells/guanyu-thrust.png`. Cause: `src/game/art/draw.ts` `figureShapes` emits `weaponOrProcedural()` LAST (:916), after the near arm (:856-876), so the haft crosses the upper arm and elbow.
- **V-15b - the far fist and far fingertips paint over the near arm (draw order).** Up to 847 px at 4x (lubu attack), 808 (lubu attack2), 794 (xuchu attack): the far hand reads as a second hand stuck on the near elbow. Crops: `cells/lubu-attack.png`, `cells/xuchu-attack.png`, `cells/guanyu-attack.png`. Cause: `draw.ts` `gripF` shape (:905-914) is emitted after the near arm, and the tail `wrapF` (:255-257) is drawn over everything.
- **V-15c - visible holes in the near chain (J9).** Longest run where no near-arm paint crosses the chain section and nothing legitimate covers it: zhangfei attack 8.5u, guanyu thrust 5.5u, guanyu chop 3.75u, weiyan chop 3.75u, guanyu sweep 3.5u. Mostly a consequence of V-15a/b plus V-15d.
- **V-15d - painted cells do not overlap at the elbow and the cuff (cell cut + mapping, J2/J3).** Elbow overlap (upper-arm paint past the elbow + forearm paint above it): guanyu -0.2u, huangzhong 0.1u, weiyan 0.8u (others 2.9-8.9u). Cuff to hand-back overlap: guanyu far -1.1u, zhangfei far -0.9u, huangzhong far -0.8u (a gap between cuff and hand). Cause: (1) BODY-19 wrist cut at `scripts/prepare-body-parts.mjs:740-752` cuts at a FIXED fraction of the master's elbow->palm span (0.58/0.75) instead of at the rig's hand joint, so on masters whose forearm is short relative to `BODY_PART_DEFS.naturalLen` the cuff stops short of the hand, and on long ones (lubu +2.0u) the painted fingers poke past it; (2) `src/game/art/body-parts.ts:140` maps every cell by `naturalLen`, but guanyu/huangzhong/weiyan upper-arm cells span only 8.8-9.0u of master arm (elbow landmarked high), so the painted sleeve ends ~4u before the elbow.
- **V-15e - soft-shade halos outside the art (shading halo, J8).** The BODY-11/UIR-14 shade ovals (`draw.ts` :812-817, :843-848, :860-865, :870-875) paint their radial gradient and cel bands through the oval's own clip only, not the paint underneath, so a grey disc shows on the background beside the shoulder and forearm: 258-2225 px per move at 4x (200 of 221 standing cells >= 600 px). Visible as dark rings in `anatomy/zhangfei.png` attack/thrust/sweep and `anatomy/xiahoudun.png` walk0. Cause: `paintWithHead` :589-600 does not composite `source-atop`.

### V-16 - Prone (down) far arm hangs below the body with a detached hand (S2, all 17, DEPTH) - verified 2026-10-01
- Every fighter's `down` window: the far forearm is invisible (it lies under the body/ground line) and the relaxed far hand sits alone under the chest; the near upper arm is mostly hidden by the beard or head. Far-chain holes: lubu 11.5u, guanyu 6.25u, zhaoyun 6.25u, spearman/huangzhong 5.25u. Crops: `cells/guanyu-down.png`, `cells/lubu-down.png`. Cause: `src/game/art/weapons.ts:191` solves the lying far arm with the pose-table hint, which picks the elbow branch BELOW the body (elbowF y 94-95 while the hip is at 82). Needs a pose decision (which way a prone far arm folds), so it is not part of the V-15 fix.

### V-17 - Relaxed rear hand floats off the torso edge (S2, huangzhong/weiyan/zhangfei, DEPTH) - verified 2026-10-01
- In idle, walk, hurt and special the relaxed far hand hangs beside the hip with 0-15% of the far forearm visible (hidden by the torso): huangzhong 9 moves, weiyan 2, zhangfei 1. Crops: `cells/huangzhong-idle.png`, `cells/weiyan-hurt.png`. Cause: `src/game/art/armik.ts:366` `swungFreeTarget` (called from `weapons.ts:235`) places the free far hand outside the torso silhouette while the far arm is drawn behind it (`draw.ts:748-753`), so only the hand shows. The x-ray shows the rig chain is continuous; the paint is not.

### V-18 - Painted hands are flat mittens next to the painted sleeves (S2, cast-wide, ASSET) - UIR-19 BLOCKED after 3 attempts (12/17 J4 ok; owner scope call) (V-14 J4 residue)
- The generated hand cells (`scripts/prepare-body-parts.mjs` `paintHandCell` :194) are flat skin shapes with bar fingers; beside the photographic sleeves they read as cream/pink mittens (every clean sheet; most visible on `anatomy/lubu.png`, `anatomy/caocao.png`). Needs new hand art, so it is not part of the V-15 renderer fix.


### V-19 - Every 2x-baked tileSprite layer displays only its texture's top half (S2, SYSTEM) - verified 2026-10-01 (all parts: sky UIR-9, ridge UIR-10, ground UIR-11, embers UIR-20)
- UIR-8 proved it for the marks strip and fixed it there: a 512x128 texture on a 1064x64 tileSprite with tileScale 1 shows texture rows 0..64 only (tile rows 0..32) - hulls, water, decks and banner bottoms were cut game-wide. Evidence: artifacts/marks-only.png (marks isolated: sails + upper masts only), the live texture readback (512x128, 21640 opaque px over rows 36..127), GameScene.ts tileSprite setup. The sky, ridge, ground and ember layers use the identical bake pattern (clouds were never affected - they are scaled images, not tileSprites; the sky was fixed under UIR-9) (bakeLayer at RENDER_SCALE + tileScale 1) and are therefore cut the same way - the sky's sun (tile y176) and lower haze, and the bottom halves of the other layers, never display. Same fix shape as marks (tileScale 0.5), but it changes every screen's look, so it needs its own task with a full re-review (not folded into UIR-8).

## UIR batch 4 - FILED (2026-09-28; V-19 embers remainder, filed same pass)

| Task | Findings | Size | Why this order |
| --- | --- | --- | --- |
| UIR-20 | V-19 (embers) | S | One-line tileScale with before/after ember counts; completes V-19 |

## UIR batch 3 - FILED (fixer's review 2026-09-28 at e4872ce; filed 2026-09-28)

Written by the pass that fixed V-15a/c/d/e, so the producer must re-confirm each finding on its OWN fresh capture before filing (drop any that do not reproduce), then set each status to `filed UIR-n` and this heading to FILED. Ready-to-file task text: `docs/UI_REVIEW_BATCHES.md` (batch 3).

| Task | Findings | Size | Why this order |
| --- | --- | --- | --- |
| UIR-16 | V-15b | M | S2 on every polearm strike; the last arm-chain overlap after e4872ce |
| UIR-17 | V-16 | M | S2 on all 17 down frames; needs an owner-visible pose choice |
| UIR-18 | V-17 | S | S2 on huangzhong idle/walk; three fighters |
| UIR-19 | V-18 | L | S2 cast-wide hand art; split per hand kind if needed |

## UIR batch 1 - FILED (reviewed 2026-09-26 at 3fd3b32; filed 2026-09-27)

The next producer pass files these into TASKS.md Enhancements verbatim, after first confirming on a fresh capture that each finding still reproduces (drop any that do not). Then it changes each finding's status to `filed UIR-n` and this heading to FILED.
Ready-to-file task text: `docs/UI_REVIEW_BATCHES.md` (batch 1).

| Task | Findings | Size | Why this order |
| --- | --- | --- | --- |
| UIR-1 | V-1 | S | S2 on every in-game frame; one constant |
| UIR-2 | V-2 | S | S1: the boss warning is unreadable |
| UIR-3 | V-3 | S | S2 on every stage entry; one timing |
| UIR-4 | V-4 | M | S2 type consistency on 3 scenes |
| UIR-5 | V-5, V-6, V-7 | M | S2 on continue and result panels |
| UIR-6 | V-10 | S | S2 touch controls |

## UIR batch 2 - FILED (owner-approved 2026-09-26; filed 2026-09-27)

These are owner decisions, not review findings, so they do not count toward the six-task cap. File them in the SAME producer pass as batch 1, after it and in this order. Before filing, confirm that V-9, V-11 and V-13 still reproduce on the fresh capture. Then set each status to `filed UIR-n` and this heading to FILED.
Ready-to-file task text: `docs/UI_REVIEW_BATCHES.md` (batch 2).

| Task | Findings | Size | Scope |
| --- | --- | --- | --- |
| UIR-7 | V-9 | M | "Rotate your phone" overlay in portrait, with gameplay paused behind it |
| UIR-8 | V-11 | M | Repaint the landmark strip (all nine kinds) in the painted style |
| UIR-9 | V-13 | M | Painted sky and clouds (day and ember) |
| UIR-10 | V-13 | M | Painted hill ridges with atmospheric depth |
| UIR-11 | V-13 | M | Painted ground per stage (grass, earth, river bank, deck) |

## Owner decisions

1. 2026-09-26, **portrait phones (V-9):** approved the "rotate your phone" overlay (not a portrait layout). -> UIR-7.
2. 2026-09-26, **backdrop art direction:** approved repainting the backdrop layers (sky, clouds, ridges, ground, landmarks) in the painted semi-realist style of the heroes and title key art. -> UIR-8..UIR-11.

## Owner questions

- (none open)

## Known blind spots (checked by every review)

1. 2026-09-26, owner: **arm, shoulder, wrist, hand and grip joins on every fighter** (V-14). The first review never opened a character sheet. Every review now runs the section 2a anatomy pass (J1-J9) on the `anatomy/` sheets, and no metric can dismiss what the image shows.
2. 2026-09-28, owner: **per-move arm-chain continuity** (V-15). The 2a pass rated fighters `ok` on 5 of 14 moves, the fixers' self-checks were accepted as verification, and the x-ray skeleton read as connected where the paint was not. Every review now fills the 17 x 14 gestalt grid from the clean sheets first, answers every `suspects.json` entry, and verifies fixes only on its own fresh capture and the pair sheets.

## Anatomy verdicts (section 2a grid; one row per fighter, one cell per move; rewritten each full review)

Cell = `N` natural, `A V-n` awkward, `B V-n` broken, `?` not looked at. Letters after V-15 name its sub-causes (a weapon over near arm, b far hand over near arm, c chain hole, d elbow/cuff overlap, e shade halo). A fighter is `ok` only when all 14 cells are N. Every cell must be backed by its tile in `anatomy/<id>.png` (and `cells/<id>-<move>.png` for A/B).

**Status of the rows below: JUDGED 2026-09-28 at `9fd19c2` (DUE NOW pass); carried + partially re-judged 2026-10-01 at `e3e70cf`.** Fresh capture made in this pass (flow + stages + full anatomy at 9fd19c2; the platform section aborted on the known phone-portrait harness issue, so no fresh phone/webgl frames). Every clean sheet opened; every A/B backed by its crop (3 missing down-cells - xiahoudun/caoren/xuhuang - judged from sheet+xray+ids). The pre-fix-vs-post-fix pair comparison was impossible: the previous capture (7b388dc-dirty) already contains the V-15 fix (all 235 cells byte-identical across e4872ce, with post-fix detector numbers in both), and the rotation deleted the f3616f1 pre-fix capture. V-15a/c/d/e are therefore verified against the finding definitions on fresh pixels + the fresh arm-chain gates (11/11 green), not on a visible before/after delta. Tally: 211 N, 14 A, 13 B of 238 (baseline was 1/147/90).

**2026-10-01 at `e3e70cf` (carried + partial re-judgement).** All 238 cells are byte-identical to the `4bce5d8` capture, so every row carries unchanged. The down column's `B V-16` labels predate UIR-17's fix: on current pixels `caoren-down` and `guanyu-down` were re-opened (`anatomy/cells/<id>-down.png`) and both show the V-16 cause gone - the far arm folds on/behind the body with no detached hand below it - leaving the recorded A-class prone foreshortening, so those two cells would read `A` on a fresh full judgement. The other five `B V-16` down cells (huangzhong, archer, lubu, caocao, lidian) keep their historical labels pending the next full grid re-judgement; their pixels are identical to the V-16-verified capture. V-15b letters unchanged (owner-blocked UIR-16, cells identical).

**2026-10-02 at `e730034` (carried, no re-judgement).** All 238 cells byte-identical to the `e3e70cf` capture; clean/x-ray/ids sheets identical; suspects identical (commit label only). V-15b pair sheets show no change on any fighter (zhangfei + spearman opened; owner-blocked UIR-16, no re-open). Rows carry unchanged.

Cell notes (reviewer of record owns every call; dissents recorded, not hidden):
- Down column is mixed: 7x B V-16 (detached far hand, multi-u BG gap: guanyu 6.3u, huangzhong 5.3u, lidian 4.8u, lubu 7.5u, archer 4.8u, caocao, caoren), 5x A (connected but awkward prone foreshortening, no V-number: xuhuang/zhangfei/zhanghe/zhangliao/zhaoyun per R3), 5x N (far chain continuous below: soldier/spearman/xiahoudun/xuchu/weiyan per R2). UIR-17's detector gate (runF <= 1.5u on down, all 17) scopes the fix objectively.
- V-15b letters rest on fresh ID-map grounds (far fist off the haft, on the near arm): lubu-attack (SELF, 398px), zhangfei-attack (SELF, 219px; R3 dissents N), caoren x6 (R1, B), xuhuang-attack2 (R3, A: open hand below haft). All other strikes read N (far fist on/adjacent to the haft, correct grip) - the footprint shrank vs the f3616f1 baseline, consistent with the a/c/d/e geometry changes.
- huangzhong-idle A V-17 is the reviewer of record's J3 call (hand outside the silhouette, ~0% forearm leading to it); R4 dissents N. weiyan's row was rewritten: R2's 14x B (duplicate-hands theory) is rejected - the ID map shows one hand; the two-tone paint is shading. weiyan idle/walk0/walk1/hurt/special = A V-17 (confirmed pattern), rest N.
- Rejected single-cell opinions (no V-number): xuchu-walk1 far/near tone step is the designed near/far shading; caocao attack2/windup/recover/jump 0%-visible far upper behind the torso is correct J7 layering, not a J1 break.

| Fighter | idle | walk0 | walk1 | attack | attack2 | thrust | chop | sweep | windup | recover | jump | down | hurt | special |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| guanyu | N | N | N | N | N | N | N | N | N | N | N | B V-16 | N | N |
| zhangfei | N | N | N | A V-15b | N | N | N | N | N | N | N | A | N | N |
| zhaoyun | N | N | N | N | N | N | N | N | N | N | N | A | N | N |
| huangzhong | A V-17 | N | N | N | N | N | N | N | N | N | N | B V-16 | N | N |
| weiyan | A V-17 | A V-17 | A V-17 | N | N | N | N | N | N | N | N | N | A V-17 | A V-17 |
| soldier | N | N | N | N | N | N | N | N | N | N | N | N | N | N |
| spearman | N | N | N | N | N | N | N | N | N | N | N | N | N | N |
| archer | N | N | N | N | N | N | N | N | N | N | N | B V-16 | N | N |
| lubu | N | N | N | A V-15b | N | N | N | N | N | N | N | B V-16 | N | N |
| caocao | N | N | N | N | N | N | N | N | N | N | N | B V-16 | N | N |
| xiahoudun | N | N | N | N | N | N | N | N | N | N | N | N | N | N |
| xuchu | N | N | N | N | N | N | N | N | N | N | N | N | N | N |
| zhangliao | N | N | N | N | N | N | N | N | N | N | N | A | N | N |
| caoren | N | N | N | B V-15b | B V-15b | B V-15b | B V-15b | B V-15b | N | N | N | B V-16 | N | B V-15b |
| xuhuang | N | N | N | N | A V-15b | N | N | N | N | N | N | A | N | N |
| zhanghe | N | N | N | N | N | N | N | N | N | N | N | A | N | N |
| lidian | N | N | N | N | N | N | N | N | N | N | N | B V-16 | N | N |

## Harness backlog

- 2026-09-28: the capture wrote no cells for 3 down moves (xiahoudun-down, caoren-down, xuhuang-down: 235 of 238 cells). Down verdicts for those fighters rest on sheet+xray+ids. **RESOLVED (framework change after 448065f):** a crop is now written for every move (238 of 238), with suspects and notes.
- 2026-09-28: the 7b388dc-dirty capture already contained the V-15 fix (all 235 cells byte-identical across e4872ce), and rotation deleted the f3616f1 pre-fix capture - this pass's pairs are post-vs-post. A verify pass needing pre-fix pixels must snapshot previous/ first; consider retaining two generations. **RESOLVED (same change):** `review:capture -- --pin V-n` keeps a pre-fix baseline under `artifacts/review/baselines/<V-n>/` across any number of captures, and every capture writes `artifacts/review/pairs/<V-n>/<id>-pair.png`. `anatomy/index.json` and the pair headers name the commit and every uncommitted `src/`/`scripts/` file. The suspect list was recalibrated against the 238-cell grid: 13 of 238 flagged (was 235), 9 of them A/B cells; the V-15b/V-17 heuristics are notes, not suspects (too many false alarms). VISUAL_REVIEW sections 1, 2a, 5 and 6 plus loop.md/eval-loop.md describe the flow. V-16 is pinned (baseline at 448065f).

- The boss crop cuts off the boss's head (`crops/stage1-boss--boss.png`). `actorBox` must size by the actor's kind, not a fixed 112px.
- Seed end-screen stats (score, time, lives) before forcing result, gameover and complete, so number formatting can be judged (V-8).
- Add a mid-combo HUD shot (combo counter) and a hit-flash still; neither is captured yet.
- 2026-09-28: `review:capture` aborted in `e2e/ui-review.spec.ts:288` (phone portrait) - RESOLVED by UIR-7 (the phone() step asserts the overlay in portrait instead of waiting for ticks; capture now completes): the sim tick stays 0 because UIR-7's `rotateBlocked()` (in-progress owner work at `f3616f1`, `src/game/ui/orientation.ts`) pauses GameScene on the Pixel 7 portrait profile, and the capture waits for 40 ticks. Reproduced on clean `7b388dc`. The capture must treat portrait as "overlay shown, sim paused" (UIR-7's own acceptance). Until then the anatomy sheets can be produced with `REVIEW_ANATOMY=1 npx vitest run test/game/anatomy-review.test.ts`.

- 2026-10-01: `npm run review:capture -- --unpin V-16` executed by the verifier (V-16 `verified 2026-10-01`). The V-16 pin at `448065f` predates the capture-framework change, so its pair sheets compare old- and new-framing cells (same limitation the V-15 post-vs-post pairs recorded) - the verification rested on fresh pixels + the G5-down gate. The `abc022f` V-15b pin stays: UIR-16 is owner-BLOCKED and its pre-fix baseline is still wanted.

## Owner notes

- (owner: add notes here or in `artifacts/vision/UX_REVIEW.md`)
