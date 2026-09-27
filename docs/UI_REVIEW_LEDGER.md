# UI review ledger

The durable memory of the art-director review (`docs/VISUAL_REVIEW.md`).
Findings are `V-n`, never renumbered. Status is one of `open`, `batched UIR-n` (in a pending batch below), `filed UIR-n`,
`fixed <commit> (self-check)`, `verified <date>`, `reopened <date> -> V-m`,
`deferred <track>`, `intended`, `harness` or `owner`.

## Last full review

- Date: 2026-09-26. Commit: `3fd3b32`. Capture: `npm run review:capture`, 59 screens, canvas + WebGL + Pixel 7 portrait/landscape.
- Scope: everything (first review). Reviewer read all three contact sheets, then the screens and crops cited below, with the image tool at gameplay size.
- Next review due when `git rev-list --count 3fd3b32..HEAD -- src/game` >= 4.

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

### V-1 - Stage name is printed over the SCORE readout (S2, LAYOUT) - filed UIR-1
- Evidence: `crops/stage1-idle--centre.png`: 博望坡 sits on top of "SCORE 0"; the two lines share pixels. Kit suspect "overlapping text" on all 45 in-game screens, all 9 stages, phone and WebGL.
- Root cause: `src/game/ui/hudlayout.ts:44-45`: STAGE_LABEL y1 (9px, top origin, spans y1-11) and SCORE y12 (9px, centre origin, spans y7-17) overlap by ~4px; created at `src/game/scenes/HudScene.ts:387-395`.

### V-2 - Boss WARNING banner is drawn UNDER the boss rail (S1, DEPTH) - filed UIR-2
- Evidence: `crops/stage1-boss-warning--banner.png`: only the subtitle "Li Dian 李典" shows; the red rail covers the WARNING title completely.
- Root cause: `src/game/scenes/HudScene.ts:670-679` puts every banner at depth 9_800 "under the HUD plates", but the boss rail (`HudScene.ts:325-326`, depth 10_000, y40-58) appears in the same frame as the boss banner (y34-78), so the rail wins.

### V-3 - Stage banner and intro card announce the same thing at the same time (S2, TIMING) - filed UIR-3
- Evidence: `crops/stage1-intro--intro.png`: the banner's "Bowang Slope · 博望坡" still shows above the intro card, which repeats "STAGE 1" and "Bowang Slope · 博望坡". The same happens on all nine `stage*-intro` shots.
- Root cause: `src/game/scenes/HudScene.ts:484` raises the card 1_600 ms after build, while the banner (`HudScene.ts:175`, BANNER_HOLD_MS plus 180 ms in and out) is still up. Both carry stage number and name.

### V-4 - 7px body-font labels: unreadable, and a second typeface (S2, TYPE) - filed UIR-4
- Evidence: `screens/stage1-result.png`: LIVES / SCORE / TIME are thin grey Arial-style caps, unlike every other word on the panel. `crops/select-zhaoyun--roster.png`: LIFE / SPEED are the same sans. `screens/stage6-play.png`: "HORSE 20" is light grey sans on the gold plate. On a Pixel 7 this becomes about 6 CSS px.
- Root cause: `liveStyle()` (`src/game/ui/type.ts`) selects BODY_STACK below DISPLAY_MIN_SIZE. The callers pass 7: `src/game/scenes/ResultScene.ts:186` (chip label), `src/game/scenes/SelectScene.ts:127-128` (stat rows), and `src/game/ui/hudlayout.ts:21` META_ROW size 7.

### V-5 - Result chip row is not centred and the LIVES chip sits on the panel frame (S2, LAYOUT) - filed UIR-5
- Evidence: `screens/stage1-result.png`: the LIVES chip's left edge is on the parchment border. The gaps are 32 and 16 logical px, and the row spans x70-390 (centre 230, not 240).
- Root cause: `src/game/scenes/ResultScene.ts:114-116` hard-codes x offsets -170, -76 and +60 with widths 62, 120 and 90, rather than laying out from the panel rect.

### V-6 - Panel titles collide with their card's top frame (S2, LAYOUT) - filed UIR-5
- Evidence: `crops/stage1-continue--dialog.png`: CONTINUE? crosses the gold top rule. `screens/stage1-result.png`: STAGE CLEAR! touches the top bar. By contrast, PAUSED (`crops/stage1-pause--dialog.png`) sits properly inside its identical card.
- Root cause: `src/game/scenes/HudScene.ts:440` places CONTINUE? at y92 on a card centred at y123 (`HudScene.ts:351`), which is the card's top edge; PAUSED uses y120. `src/game/scenes/ResultScene.ts:98` places STAGE CLEAR! at y84 on the victory panel at y100.

### V-7 - CONTINUE? title and countdown have no contrast on parchment (S2, COLOUR) - filed UIR-5
- Evidence: `crops/stage1-continue--dialog.png`: flat #ffd700 title and a white "9" on cream. PAUSED on the same card has a dark stroke and reads cleanly.
- Root cause: `src/game/scenes/HudScene.ts:440-448`: `liveStyle(22, {color:'#ffd700'})` and `liveStyle(30, {color:'#ffffff'})` without the stroke used at `HudScene.ts:461`.

### V-8 - End screens show 0 score and 0.0s (harness)
- The capture forces the result, game-over and complete screens, so the stats are empty. Number formatting and long-score fit on these screens are unjudged. Next capture fix: seed stats (see Harness backlog).

### V-9 - Phone portrait shows a 412x232 game on an 839px-tall screen (S2, PLATFORM) - owner-approved, filed UIR-7
- Evidence: `screens/phone-portrait-game.png`: the game fills 28% of the height; the touch buttons are about 20 CSS px, and there is no hint to rotate.
- Root cause: `src/game/main.ts:31-32` (Scale.FIT, CENTER_BOTH) has no orientation handling in `index.html` or `src/style.css`. See Owner questions.

### V-10 - Touch d-pad chevrons point inward (S2, ASSET) - filed UIR-6
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
- Fix progress 2026-09-27: **J4/J8 fixed by UIR-12**, **J5/J7 fixed by UIR-13**, **J1/J3 fixed by UIR-14** (feathered sleeve tops tuck under the pauldron; forearm edge-shade separates arm from torso). J6 open via UIR-15.
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

1. 2026-09-26, owner: **arm, shoulder, wrist, hand and grip joins on every fighter** (V-14). The first review never opened a character sheet. Every review now runs the section 2a anatomy pass (J1-J8) on the `anatomy/` sheets, and no metric can dismiss what the image shows.

## Anatomy verdicts (section 2a; one row per fighter, rewritten each full review)

Each join is `ok` or `V-n`. Moves checked: idle, attack, thrust, windup, special (plus any move where the clean-sheet first look flagged something).

| Fighter | J1 shoulder | J2 elbow | J3 wrist | J4 hand | J5 grip | J6 pose | J7 layering | J8 same body | Reviewed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| guanyu | ok | ok | ok | ok| ok| ok | ok| ok| 2026-09-27 |
| zhangfei | ok | ok | ok | ok| ok| V-14 | ok| ok| 2026-09-27 |
| zhaoyun | V-14 | ok | V-14 | ok| ok| V-14 | ok| ok| 2026-09-27 |
| huangzhong | ok | ok | ok | ok| ok| ok | ok| ok| 2026-09-27 |
| weiyan | ok | ok | ok | ok| ok| ok | ok| ok| 2026-09-27 |
| lubu | V-14 | ok | ok | ok| ok| V-14 | ok| ok| 2026-09-27 |
| caocao | V-14 | ok | ok | ok| ok| ok | ok| ok| 2026-09-27 |
| xiahoudun | V-14 | ok | ok | ok| ok| V-14 | ok| ok| 2026-09-27 |
| xuchu | V-14 | ok | ok | ok| ok| V-14 | ok| ok| 2026-09-27 |
| zhangliao | V-14 | ok | ok | ok| ok| V-14 | ok| ok| 2026-09-27 |
| caoren | V-14 | ok | ok | ok| ok| V-14 | ok| ok| 2026-09-27 |
| xuhuang | V-14 | ok | ok | ok| ok| V-14 | ok| ok| 2026-09-27 |
| zhanghe | V-14 | ok | ok | ok| ok| ok | ok| ok| 2026-09-27 |
| lidian | V-14 | ok | ok | ok| ok| V-14 | ok| ok| 2026-09-27 |
| soldier | V-14 | ok | ok | ok| ok| ok | ok| ok| 2026-09-27 |
| spearman | V-14* | ok* | ok* | ok*| ok*| V-14* | ok*| ok*| 2026-09-27 |
| archer | ok* | ok* | ok* | ok*| ok*| ok* | ok*| ok*| 2026-09-27 |
| * = pattern verdict from the reviewed twin (spearman: polearm pattern; archer: bow pattern) - confirm on the sheets next pass |

## Harness backlog

- The boss crop cuts off the boss's head (`crops/stage1-boss--boss.png`). `actorBox` must size by the actor's kind, not a fixed 112px.
- Seed end-screen stats (score, time, lives) before forcing result, gameover and complete, so number formatting can be judged (V-8).
- Add a mid-combo HUD shot (combo counter) and a hit-flash still; neither is captured yet.

## Owner notes

- (owner: add notes here or in `artifacts/vision/UX_REVIEW.md`)
