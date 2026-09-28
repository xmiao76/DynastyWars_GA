# UI review ledger

The durable memory of the art-director review (`docs/VISUAL_REVIEW.md`).
Findings are `V-n`, never renumbered. Status is one of `open`, `batched UIR-n` (in a pending batch below), `filed UIR-n`,
`fixed <commit> (unverified)` (legacy: `(self-check)`; set by the fixer, never final), `verified <date>` (only by a LATER producer pass on a fresh capture + pair sheet), `reopened <date> -> V-m`,
`deferred <track>`, `intended`, `harness` or `owner`.

## Last full review

- Date: 2026-09-26. Commit: `3fd3b32`. Capture: `npm run review:capture`, 59 screens, canvas + WebGL + Pixel 7 portrait/landscape.
- Scope: everything (first review). Reviewer read all three contact sheets, then the screens and crops cited below, with the image tool at gameplay size.
- Next review due when `git rev-list --count 3fd3b32..HEAD -- src/game` >= 4.
- **DUE NOW** (owner flag 2026-09-28, arm chains; see VISUAL_REVIEW "Why the anatomy pass still missed broken arm chains"): full section 2a per-move pass, all 17 fighters x 14 moves, on a fresh capture. Re-judge the anatomy grid below from the images (it holds the fixer's pre-fix baseline, not verdicts) and verify or reopen V-15..V-18 on the pair sheets.

## Coverage (deep-dive rotation)

| Area | Last deep review |
| --- | --- |
| menus | 2026-09-26 |
| HUD & overlays | 2026-09-26 |
| stage flow screens | 2026-09-26 |
| all nine stages | 2026-09-26 |
| characters (movesheets, motion) | 2026-09-27 (first anatomy pass: 15 fighters judged, table filled; V-14 split into UIR-12..15) |
| phone | 2026-09-26 |
| WebGL | 2026-09-26 (sheet level only) |

## Scoreboard (lowest applicable R1-R9, 1-5)

| Screen group | Score | Held down by |
| --- | --- | --- |
| title | 4 | - |
| select-* | 3 | V-4 7px sans labels |
| stage*-idle/play/combat (HUD) | 2 | V-1 name over SCORE; V-11 flat landmark blocks |
| stage1-boss-warning | 1 | V-2 WARNING hidden |
| stage*-banner / stage*-intro | 3 | V-3 double announcement |
| stage1-pause | 4 | - |
| stage1-continue | 2 | V-6, V-7 |
| stage*-result | 3 | V-4, V-5, V-6 |
| gamecomplete, gameover | 3 | V-8 harness zeros; cramped footer |
| phone-portrait-* | 1 | V-9 |
| phone-landscape-* | 2 | V-10 |
| webgl-* | 3 | same defects as canvas; no parity break seen |

## Findings

### V-1 - Stage name is printed over the SCORE readout (S2, LAYOUT) - fixed (self-check)
- Evidence: `crops/stage1-idle--centre.png`: 博望坡 sits on top of "SCORE 0"; the two lines share pixels. Kit suspect "overlapping text" on all 45 in-game screens, all 9 stages, phone and WebGL.
- Root cause: `src/game/ui/hudlayout.ts:44-45`: STAGE_LABEL y1 (9px, top origin, spans y1-11) and SCORE y12 (9px, centre origin, spans y7-17) overlap by ~4px; created at `src/game/scenes/HudScene.ts:387-395`.

### V-2 - Boss WARNING banner is drawn UNDER the boss rail (S1, DEPTH) - fixed (self-check)
- Evidence: `crops/stage1-boss-warning--banner.png`: only the subtitle "Li Dian 李典" shows; the red rail covers the WARNING title completely.
- Root cause: `src/game/scenes/HudScene.ts:670-679` puts every banner at depth 9_800 "under the HUD plates", but the boss rail (`HudScene.ts:325-326`, depth 10_000, y40-58) appears in the same frame as the boss banner (y34-78), so the rail wins.

### V-3 - Stage banner and intro card announce the same thing at the same time (S2, TIMING) - fixed (self-check)
- Evidence: `crops/stage1-intro--intro.png`: the banner's "Bowang Slope · 博望坡" still shows above the intro card, which repeats "STAGE 1" and "Bowang Slope · 博望坡". The same happens on all nine `stage*-intro` shots.
- Root cause: `src/game/scenes/HudScene.ts:484` raises the card 1_600 ms after build, while the banner (`HudScene.ts:175`, BANNER_HOLD_MS plus 180 ms in and out) is still up. Both carry stage number and name.

### V-4 - 7px body-font labels: unreadable, and a second typeface (S2, TYPE) - fixed (self-check)
- Evidence: `screens/stage1-result.png`: LIVES / SCORE / TIME are thin grey Arial-style caps, unlike every other word on the panel. `crops/select-zhaoyun--roster.png`: LIFE / SPEED are the same sans. `screens/stage6-play.png`: "HORSE 20" is light grey sans on the gold plate. On a Pixel 7 this becomes about 6 CSS px.
- Root cause: `liveStyle()` (`src/game/ui/type.ts`) selects BODY_STACK below DISPLAY_MIN_SIZE. The callers pass 7: `src/game/scenes/ResultScene.ts:186` (chip label), `src/game/scenes/SelectScene.ts:127-128` (stat rows), and `src/game/ui/hudlayout.ts:21` META_ROW size 7.

### V-5 - Result chip row is not centred and the LIVES chip sits on the panel frame (S2, LAYOUT) - fixed (self-check)
- Evidence: `screens/stage1-result.png`: the LIVES chip's left edge is on the parchment border. The gaps are 32 and 16 logical px, and the row spans x70-390 (centre 230, not 240).
- Root cause: `src/game/scenes/ResultScene.ts:114-116` hard-codes x offsets -170, -76 and +60 with widths 62, 120 and 90, rather than laying out from the panel rect.

### V-6 - Panel titles collide with their card's top frame (S2, LAYOUT) - fixed (self-check)
- Evidence: `crops/stage1-continue--dialog.png`: CONTINUE? crosses the gold top rule. `screens/stage1-result.png`: STAGE CLEAR! touches the top bar. By contrast, PAUSED (`crops/stage1-pause--dialog.png`) sits properly inside its identical card.
- Root cause: `src/game/scenes/HudScene.ts:440` places CONTINUE? at y92 on a card centred at y123 (`HudScene.ts:351`), which is the card's top edge; PAUSED uses y120. `src/game/scenes/ResultScene.ts:98` places STAGE CLEAR! at y84 on the victory panel at y100.

### V-7 - CONTINUE? title and countdown have no contrast on parchment (S2, COLOUR) - fixed (self-check)
- Evidence: `crops/stage1-continue--dialog.png`: flat #ffd700 title and a white "9" on cream. PAUSED on the same card has a dark stroke and reads cleanly.
- Root cause: `src/game/scenes/HudScene.ts:440-448`: `liveStyle(22, {color:'#ffd700'})` and `liveStyle(30, {color:'#ffffff'})` without the stroke used at `HudScene.ts:461`.

### V-8 - End screens show 0 score and 0.0s (harness)
- The capture forces the result, game-over and complete screens, so the stats are empty. Number formatting and long-score fit on these screens are unjudged. Next capture fix: seed stats (see Harness backlog).

### V-9 - Phone portrait shows a 412x232 game on an 839px-tall screen (S2, PLATFORM) - owner-approved, filed UIR-7
- Evidence: `screens/phone-portrait-game.png`: the game fills 28% of the height; the touch buttons are about 20 CSS px, and there is no hint to rotate.
- Root cause: `src/game/main.ts:31-32` (Scale.FIT, CENTER_BOTH) has no orientation handling in `index.html` or `src/style.css`. See Owner questions.

### V-10 - Touch d-pad chevrons point inward (S2, ASSET) - fixed (self-check)
- Evidence: `screens/phone-landscape-game.png`: the up arm shows a down-chevron, the left arm ">", the right arm "<" and the down arm "^". The same happens in portrait.
- Root cause: `src/game/art/hudart.ts:487-492`: the chevron path's apex is at +y, so at angle 0 it points DOWN, but `hudart.ts:498-501` assumes angle 0 points up.

### V-11 - Landmark strip uses flat untextured blocks (S2, ASSET) - owner-approved, filed UIR-8
- Evidence: `screens/stage1-idle.png`: a flat grey slab with a green lid (the gorge wall). `screens/stage6-play.png`: blank beige rectangles on posts (warship sails) with the hulls sunk below the horizon. `screens/stage7-play.png`: solid red slabs (the cliffs). Next to the painted heroes these read as placeholder art.
- Root cause: `src/game/art/backdrop.ts:324-326` (gorge), `:304-305` (sail 16x6 fillRect), `:444-446` (inferno cliffs) are `fillRect` blocks without tonal bands or ink. The hulls sit below `MARKS_ROOT_DEPTH` (`src/game/scenes/GameScene.ts:67`).
- Estimate: M (one painter, three kinds), with risk to the vision richness gate and the seam unit test.

### V-12 - Mook soldiers read as photo faces on small bodies (S2, ASSET) - deferred BODY track
- Evidence: `crops/stage1-boss--boss.png`: the grunt faces are photographic, flat-lit and large for the body, with no neck blend.
- Owned by the BODY track (BODY-24 and BODY-7 are open; see `CHARACTER_REVIEW.md`). No duplicate task is filed; re-check after BODY-7.

### V-13 - Backdrop layers are flat vector shapes behind painted heroes (S2, ASSET) - owner-approved, batched UIR-9..UIR-11
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

### V-15 - Arm chains do not connect shoulder -> upper arm -> forearm -> hand -> haft (S1, cast-wide, DEPTH+ASSET) - open
- Owner report 2026-09-28: every character's shoulder, upper arm, forearm, hand and weapon should connect; the inner side must be continuous (the outer line may be covered). Found by the reworked 2a pass at `f3616f1` (clean sheets `anatomy/<id>.png`, ID maps `anatomy/<id>-ids.png`, crops `anatomy/cells/<id>-<move>.png`, metrics `anatomy/suspects.json`). Five separate rendering causes, lettered so the grid can name them:
- **V-15a - the weapon is drawn over the near arm that holds it (draw order, J7/J9).** Standing moves, near-arm footprint covered by the weapon: caocao walk1 92u^2, weiyan thrust 78, caoren walk1 77, weiyan sweep 75, xuhuang walk1 75, caocao idle 73; 174 of 221 standing cells >= 30u^2 or near upper arm < 15% visible. Near upper arm visible: guanyu thrust 2% (weapon 24%, beard 22%), zhangfei attack 6% (weapon 41%). Crops: `cells/zhangfei-attack.png`, `cells/caocao-walk1.png`, `cells/guanyu-thrust.png`. Cause: `src/game/art/draw.ts` `figureShapes` emits `weaponOrProcedural()` LAST (:916), after the near arm (:856-876), so the haft crosses the upper arm and elbow.
- **V-15b - the far fist and far fingertips paint over the near arm (draw order).** Up to 847 px at 4x (lubu attack), 808 (lubu attack2), 794 (xuchu attack): the far hand reads as a second hand stuck on the near elbow. Crops: `cells/lubu-attack.png`, `cells/xuchu-attack.png`, `cells/guanyu-attack.png`. Cause: `draw.ts` `gripF` shape (:905-914) is emitted after the near arm, and the tail `wrapF` (:255-257) is drawn over everything.
- **V-15c - visible holes in the near chain (J9).** Longest run where no near-arm paint crosses the chain section and nothing legitimate covers it: zhangfei attack 8.5u, guanyu thrust 5.5u, guanyu chop 3.75u, weiyan chop 3.75u, guanyu sweep 3.5u. Mostly a consequence of V-15a/b plus V-15d.
- **V-15d - painted cells do not overlap at the elbow and the cuff (cell cut + mapping, J2/J3).** Elbow overlap (upper-arm paint past the elbow + forearm paint above it): guanyu -0.2u, huangzhong 0.1u, weiyan 0.8u (others 2.9-8.9u). Cuff to hand-back overlap: guanyu far -1.1u, zhangfei far -0.9u, huangzhong far -0.8u (a gap between cuff and hand). Cause: (1) BODY-19 wrist cut at `scripts/prepare-body-parts.mjs:740-752` cuts at a FIXED fraction of the master's elbow->palm span (0.58/0.75) instead of at the rig's hand joint, so on masters whose forearm is short relative to `BODY_PART_DEFS.naturalLen` the cuff stops short of the hand, and on long ones (lubu +2.0u) the painted fingers poke past it; (2) `src/game/art/body-parts.ts:140` maps every cell by `naturalLen`, but guanyu/huangzhong/weiyan upper-arm cells span only 8.8-9.0u of master arm (elbow landmarked high), so the painted sleeve ends ~4u before the elbow.
- **V-15e - soft-shade halos outside the art (shading halo, J8).** The BODY-11/UIR-14 shade ovals (`draw.ts` :812-817, :843-848, :860-865, :870-875) paint their radial gradient and cel bands through the oval's own clip only, not the paint underneath, so a grey disc shows on the background beside the shoulder and forearm: 258-2225 px per move at 4x (200 of 221 standing cells >= 600 px). Visible as dark rings in `anatomy/zhangfei.png` attack/thrust/sweep and `anatomy/xiahoudun.png` walk0. Cause: `paintWithHead` :589-600 does not composite `source-atop`.

### V-16 - Prone (down) far arm hangs below the body with a detached hand (S2, all 17, DEPTH) - open
- Every fighter's `down` window: the far forearm is invisible (it lies under the body/ground line) and the relaxed far hand sits alone under the chest; the near upper arm is mostly hidden by the beard or head. Far-chain holes: lubu 11.5u, guanyu 6.25u, zhaoyun 6.25u, spearman/huangzhong 5.25u. Crops: `cells/guanyu-down.png`, `cells/lubu-down.png`. Cause: `src/game/art/weapons.ts:191` solves the lying far arm with the pose-table hint, which picks the elbow branch BELOW the body (elbowF y 94-95 while the hip is at 82). Needs a pose decision (which way a prone far arm folds), so it is not part of the V-15 fix.

### V-17 - Relaxed rear hand floats off the torso edge (S2, huangzhong/weiyan/zhangfei, DEPTH) - open
- In idle, walk, hurt and special the relaxed far hand hangs beside the hip with 0-15% of the far forearm visible (hidden by the torso): huangzhong 9 moves, weiyan 2, zhangfei 1. Crops: `cells/huangzhong-idle.png`, `cells/weiyan-hurt.png`. Cause: `src/game/art/armik.ts:366` `swungFreeTarget` (called from `weapons.ts:235`) places the free far hand outside the torso silhouette while the far arm is drawn behind it (`draw.ts:748-753`), so only the hand shows. The x-ray shows the rig chain is continuous; the paint is not.

### V-18 - Painted hands are flat mittens next to the painted sleeves (S2, cast-wide, ASSET) - open (V-14 J4 residue)
- The generated hand cells (`scripts/prepare-body-parts.mjs` `paintHandCell` :194) are flat skin shapes with bar fingers; beside the photographic sleeves they read as cream/pink mittens (every clean sheet; most visible on `anatomy/lubu.png`, `anatomy/caocao.png`). Needs new hand art, so it is not part of the V-15 renderer fix.

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

**Status of the rows below: PRE-FIX BASELINE, NOT VERIFIED.** Written 2026-09-28 at `f3616f1` by the fixer (who then worked on V-15), from all 17 clean sheets plus the detector split per move; that is exactly the self-grading this ledger forbids, so the next producer pass must re-judge every cell from its own fresh capture (DUE NOW above). The 2026-09-27 per-fighter `ok` table was withdrawn: it covered 5 of 14 moves and rated guanyu, zhangfei, huangzhong and weiyan `ok` everywhere while V-15 was visible in them.

| Fighter | idle | walk0 | walk1 | attack | attack2 | thrust | chop | sweep | windup | recover | jump | down | hurt | special |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| guanyu | A V-15de | A V-15de | A V-15de | B V-15abcde | B V-15abde | B V-15abcde | A V-15cde | A V-15abcde | A V-15de | A V-15ad | A V-15acde | B V-16 | A V-15bde | B V-15abde |
| zhangfei | A V-15de | A V-15ade | A V-15de | B V-15abcde | B V-15abcde | B V-15abcde | B V-15abcde | B V-15abde | A V-15ade | A V-15abde | B V-15abde | B V-16 | A V-15ade V-17 | B V-15abde |
| zhaoyun | A V-15e | A V-15ae | A V-15ae | B V-15abe | B V-15abe | B V-15abe | A V-15ace | B V-15abe | A V-15ae | N | A V-15ae | B V-16 | B V-15abe | B V-15abe |
| huangzhong | A V-15de V-17 | A V-15de V-17 | A V-15de | A V-15ade V-17 | A V-15ade | A V-15ade V-17 | A V-15acde | A V-15ade V-17 | A V-15de V-17 | B V-15ade V-17 | A V-15de | B V-16 | A V-15de V-17 | A V-15de V-17 |
| weiyan | A V-15de | A V-15ade | A V-15ade | A V-15ade | A V-15ade | A V-15ade | A V-15acde | A V-15ade | A V-15ade | A V-15ade | A V-15ade | B V-16 | A V-15de V-17 | A V-15ade V-17 |
| soldier | A V-15e | A V-15e | A V-15e | A V-15e | A V-15e | A V-15ae | A V-15ce | A V-15ae | A V-15ae | A V-15ae | A V-15ae | B V-16 | A V-15e | A V-15e |
| spearman | A V-15e | A V-15e | A V-15e | B V-15abce | B V-15abe | B V-15abe | A V-15ce | B V-15abe | A V-15ae | A V-15ae | A V-15ae | B V-16 | A V-15e | B V-15abe |
| archer | A V-15e | A V-15e | A V-15e | A V-15ae | A V-15ae | A V-15ae | A V-15ae | A V-15ae | A V-15ae | A V-15e | A V-15e | B V-16 | A V-15e | A V-15e |
| lubu | A V-15abe | B V-15abe | A V-15abe | B V-15abe | B V-15abc | B V-15abe | B V-15ab | B V-15abe | A V-15ae | A V-15abe | B V-15abe | B V-16 | A V-15ae | B V-15abe |
| caocao | A V-15ae | A V-15ae | A V-15ae | A V-15a | A V-15a | A V-15a | A V-15a | A V-15a | A V-15a | A V-15a | A V-15ae | B V-16 | A V-15a | A V-15a |
| xiahoudun | A V-15be | A V-15be | A V-15abe | B V-15abce | B V-15abe | B V-15abe | B V-15abce | B V-15abe | A V-15ae | A V-15abe | A V-15abe | B V-16 | A V-15e | B V-15abe |
| xuchu | A V-15be | B V-15abe | A V-15abe | B V-15abe | B V-15abce | B V-15abe | B V-15abe | B V-15abe | A V-15ae | A V-15abe | B V-15abe | B V-16 | A V-15e | B V-15abe |
| zhangliao | A V-15e | A V-15ae | A V-15ae | B V-15abe | B V-15ab | B V-15abe | B V-15abc | B V-15abe | A V-15a | A V-15a | A V-15ae | B V-16 | A V-15e | B V-15abe |
| caoren | B V-15abe | B V-15abe | A V-15abe | B V-15abe | B V-15abe | B V-15abe | B V-15abe | B V-15abe | A V-15ae | A V-15ae | A V-15ae | B V-16 | A V-15ae | B V-15abe |
| xuhuang | B V-15abe | B V-15abe | A V-15abe | B V-15abe | B V-15abe | B V-15abe | B V-15abe | B V-15abe | A V-15ae | A V-15ae | A V-15ae | B V-16 | A V-15ae | B V-15abe |
| zhanghe | A V-15ae | A V-15ae | A V-15a | A V-15ae | A V-15ae | A V-15ae | A V-15ae | A V-15ae | A V-15a | A V-15a | A V-15ae | B V-16 | A V-15ae | A V-15ae |
| lidian | A V-15e | A V-15ae | A V-15ae | B V-15abce | B V-15abe | B V-15abe | B V-15abe | B V-15abe | A V-15ae | A V-15a | A V-15ae | B V-16 | A V-15ae | B V-15abe |

Baseline tally: 1 N, 147 A, 90 B of 238.

## Harness backlog

- The boss crop cuts off the boss's head (`crops/stage1-boss--boss.png`). `actorBox` must size by the actor's kind, not a fixed 112px.
- Seed end-screen stats (score, time, lives) before forcing result, gameover and complete, so number formatting can be judged (V-8).
- Add a mid-combo HUD shot (combo counter) and a hit-flash still; neither is captured yet.

## Owner notes

- (owner: add notes here or in `artifacts/vision/UX_REVIEW.md`)
