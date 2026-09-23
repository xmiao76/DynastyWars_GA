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
  lockup + bone 赤壁之战 subtitle; new `ensureSheenStrip` bakes 12 glint
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

### 2026-09-23 02:00 - ART-17 (attempt 2, owner request: likeness)

- Status before: IN_PROGRESS (attempt 1: 3 of 7 criteria - Lu Bu, Zhang Fei,
  Cao Cao). Before sheets `artifacts/look/one-a17b.png`, `body-a17b.png`,
  `closeup-a17b.png`: Guan Yu's lips were toned from his skin, so on his
  date-red face they were LESS red than the cheek; his long sprite beard sat
  behind the pauldron and near arm (a chin patch); Zhao Yun shared `calm`
  (browWeight 1.18, below Guan Yu 1.32 / Huang Zhong 1.35) and the default
  head outline; Li Dian and Zhang He were the identical face (same helmet,
  build and `calm`), Zhang Liao/Zhang He differed by two brow angles.
- Work completed (the remaining 4 of 7 criteria):
  1. Guan Yu 唇若涂脂: plan field `lips` (0xc81e30), painted on both portrait
     lips instead of the skin tone. 髯长二尺: `addBeardFront` draws the long
     beard's front fall (27 units) after the near arm on the sprite, standing
     poses only; the portrait keeps its own face-pass beard.
  2. Zhao Yun 浓眉大眼, 阔面重颐: new face `bold` (browWeight 1.5, eyeW 1.18,
     eyeH 1.14, eyeAspect 2.0, level) and plan field `jaw` (1.1): `headOutline`
     widens only cheek/jaw-angle/jaw, so crown, temples, cheekbones and every
     headgear fit are unchanged.
  3. Bosses: Zhang He `sharp` (the shrewd tactician), Cao Ren `full` beard
     (0x2a2018), Zhang Liao `full` beard (0x1e1810); Li Dian stays the
     clean-shaven `calm` one, Zhang He the clean-shaven severe one.
  4. Troops untouched (plain face, shared skin, no lips/jaw), now asserted.
- Files changed: src/game/art/figures.ts (FigurePlan `lips`/`jaw`, FaceKind
  `bold`, guanyu/zhaoyun/caoren/zhangliao/zhanghe plans), faces.ts (`bold`),
  portrait.ts (`headOutline(jaw)`, plan lip colour), draw.ts
  (`addBeardFront`); test/game/likeness.test.ts (+4 gates, 7 total);
  TASKS.md (ART-17 DONE, ART-9 archived); TASKS-ARCHIVE.md; PROGRESS.md.
- Verification run (serial): lint 0, tsc 0, unit 207/207 (29 files), e2e 54
  passed, vision 5/5, selfplay 13 passed, prodbuild 4 passed,
  build ok.
  Falsified on the pre-attempt-2 data (figures.ts / draw.ts reverted in place,
  restored by copy, hashes checked): Guan Yu lip-minus-cheek redness -19.5
  (gate > 40; after +53.5); visible sprite beard 8.72 units below the chest
  joint (gate > 14; after 18.47); Zhao Yun brows 1.18 < Guan Yu 1.32, and with
  `bold` kept but `jaw` removed the jaw row is 1.014x Wei Yan's (gate > 1.06;
  after 1.108x); boss shape-only face-region difference lidian/zhanghe 0.00%
  (gate > 2.5%; after min pair 3.64%, zhangliao/zhanghe 1.39% -> 10.64%).
  Sheets reviewed by eye: one-a17c.png (crimson lips, Zhao Yun's brows and
  jaw), body-a17c.png (beard down the chest in idle and attack, Huang Zhong,
  Cao Cao and Xu Huang long beards also now in front), closeup-a17c.png
  (bosses, troops unchanged).
- Result: COMPLETED (ART-17; the owner request's two halves are ART-16 and
  ART-17, both now DONE).
- Status after: ART-17 DONE, ENH-12 TODO, 20 DONE (ART-9 moved to
  TASKS-ARCHIVE.md), 0 BLOCKED. Housekeeping: PROGRESS.md reached 510 lines
  with this entry; the oldest (2026-09-22 03:14 producer pass) moved to the
  top of PROGRESS-ARCHIVE.md (-> 469 lines).
- Remaining work or blocker: none for ART-17. Known, out of its criteria:
  Guan Yu's hood still covers his in-play forehead; the in-play marks are
  ~2px, so boss likeness at device scale is carried mostly by beard and brow
  silhouette.
- Next recommended task: ENH-12 (name the gamepad where the UI names controls).

### 2026-09-23 01:15 - ART-17 (attempt 1, owner request: likeness)

- Status before: TODO (second half of the 2026-09-22 owner request). Before
  sheet `artifacts/look/closeup-a17before.png`: Cao Cao and Lu Bu wore the
  identical `crown`; Zhang Fei's beard was the same smooth wedge as Xu Chu's;
  Cao Cao shared `sharp` (eyeAspect 2.45) with Wei Yan/Xu Huang, rounder than
  Guan Yu's phoenix eye (2.9).
- Work completed (3 of 7 criteria):
  1. Lu Bu 头戴三叉束发紫金冠 + 雉尾: new headgear `plumed` - three prongs (the
     middle tallest) on the crown's bowl, so the brim and face-on-skin probe
     are unchanged, plus two tapered pheasant plumes (PLUME 0xa8602c) sweeping
     up and back on the sprite and parting to either side on the portrait.
  2. Zhang Fei 燕颔虎须: new beard `bristle` - same upper edge as `full`, a
     spiked lower edge on the sprite (`bristleOutline`) and a mirrored spiked
     portrait beard with bristling moustache (`bristlePortraitOutline`).
  3. Cao Cao 细眼: new face `narrow` (eyeAspect 3.4, eyeH 0.66) - both the
     narrowest portrait aperture and the lowest in-play eye in the cast.
- Files changed: src/game/art/figures.ts (kinds + zhangfei/caocao/lubu plans),
  faces.ts (`narrow`), draw.ts (plumed/bristle sprite), portrait.ts
  (plumed/bristle portrait); test/game/likeness.test.ts (new, 3 gates);
  TASKS.md (ART-17 IN_PROGRESS, 3 boxes ticked); PROGRESS.md.
- Verification run (serial): lint 0, tsc 0, unit 203/203 (29 files), vision
  5/5 (SPRITE GATE 256/256 sprites, 85/85 weapons, 170/170 retracts), e2e 54
  passed, selfplay 13 passed, prodbuild 4 passed, build ok.
  Falsified on the pre-ART-17 cast data (figures.ts reverted in place, then
  restored): all 3 likeness gates fail - Lu Bu reach margin 0.03R (2.08R vs
  2.05R, gate > 1R), Zhang Fei beard-edge reversals 0 (gate >= 4), Cao Cao
  eyeAspect 2.45 < Guan Yu 2.9. After: 3.63R vs 2.05R, >= 4, 3.4 max.
  Sheets reviewed by eye: one-a17v3.png, closeup-a17v3.png, body-a17v1/v2.png.
- Result: IN_PROGRESS (ART-17).
- Status after: ART-17 IN_PROGRESS (3/7), ENH-12 TODO, 20 DONE, 0 BLOCKED.
  Housekeeping: PROGRESS.md reached 513 lines with this entry; the oldest
  entry (2026-09-22 00:13 ENH-8) moved to PROGRESS-ARCHIVE.md (-> 458 lines).
- Remaining work or blocker: Guan Yu 唇若涂脂 red lips + chest-length beard;
  Zhao Yun 浓眉大眼 heaviest brows / largest non-fierce eyes / broader jaw;
  lidian/caoren/zhangliao/zhanghe pairwise distinct in-play faces (measured
  face-region difference); final full-gate pass. The in-play sprite still draws
  one mark set per face kind at ~2px scale - at device resolution the bristle
  beard mostly sits behind Zhang Fei's near arm (the portrait carries it).
- Next recommended task: ART-17 attempt 2 (Guan Yu lips/beard, Zhao Yun).

### 2026-09-23 00:24 - ART-16 (attempt 1, owner request: natural faces)

- Status before: owner request (takes priority over ENH-12): review every
  hero and NPC face, make each look natural, and make heroes/bosses look as
  the histories describe. Filed as ART-16 (natural faces) + ART-17 (likeness).
- Work completed: reviewed all 17 portraits and in-play heads at device and
  vector resolution against a human face. Found two cast-wide root causes,
  both present since the first commit:
  1. rig.ts `limbPath`/`chainPath` traced crossed sides (bow-tie paths, empty
     middles): every in-play brow/mouth/nose rendered as a broken comma, and
     torsos, limbs, hafts and the horse were hollow under the ink. Fixed.
  2. portrait.ts gradients faded to transparent BLACK (unpremultiplied
     interpolation), so the bridge highlight drew a grey ring round the eyes
     and down the nose on every portrait. Fixed (own-colour fades), socket
     moved under the brow, forehead lift added, nose wings shortened.
  Two gates had been calibrated on the hollow art and failed honestly after
  the fix; resolved by art, not thresholds: DOWN.weaponRot 0.16 -> -0.34 (the
  now-solid weapon lay across the prone body) and Guan Yu height 1.03 -> 1.06
  (身长九尺; guanyu/weiyan silhouettes 0.094 -> 0.118 > 0.1).
- Files changed: src/game/art/rig.ts, portrait.ts, poses.ts, figures.ts;
  test/game/rig.test.ts (new), test/game/portrait.test.ts (bridge gate);
  TASKS.md (ART-16 DONE, ART-17 TODO, ART-8 archived), TASKS-ARCHIVE.md,
  PROGRESS.md, PROGRESS-ARCHIVE.md.
- Verification run (serial, logs artifacts/loop/*-tick.log): lint 0, tsc 0,
  unit 200/200 (28 files), e2e 54 passed, vision 5/5 (SPRITE GATE 256/256
  sprites, 85/85 weapons, 170/170 retracts), selfplay 13 passed, prodbuild 4
  passed, build ok. Falsified: rig.test.ts 3/3 fail on the original rig.ts
  (0/0/16 px); the bridge gate fails on HEAD portrait.ts (guanyu 0.914).
  Sheets reviewed by eye: faces-before-portraits.png vs
  faces-final-portraits.png, closeup-before.png vs closeup-final.png.
- Result: COMPLETED (ART-16). The smudge is gone and in-play features are
  solid; faces now read as clean skin with a lit forehead and nose.
- Status after: 20 DONE, ART-17 + ENH-12 TODO, 0 BLOCKED. Housekeeping:
  ART-8 archived (21 -> 20 DONE); the 2026-09-21 23:03 producer entry moved to
  PROGRESS-ARCHIVE.md (487 -> 433 lines before this entry).
- Remaining work or blocker: ART-17, the per-character likeness (Lu Bu's
  紫金冠 vs Cao Cao's identical crown, Zhang Fei's 虎须, four same-faced
  bosses, Zhao Yun's 浓眉大眼, Cao Cao's 细眼). Guan Yu's hood still covers
  his in-play forehead (hood shape is ART-15 silhouette territory).
- Next recommended task: ART-17 (continues the owner request), then ENH-12.

### 2026-09-22 15:15 - DIFF-1 CLOSED (owner decision: accept the curve)

- Status before: DIFF-1 BLOCKED on the owner's design decision (the
  only blocked item in the queue).
- Work completed (owner review + decision, no code): presented the
  re-scored evidence - the 2026-09-19 cross-hero check (findings 2 and
  3 were Zhao-Yun artifacts; only the stage-3 wall survived) and a
  fresh re-score against today's post-ENH-10 zhaoyun marathon (wall
  persists at +88% over stage 2; his dip/finale quirks persist in his
  table only; cause confirmed in source: stage 2 grants a horse at
  stage.ts:133, stage 3 withdraws it and adds spearmen/archers). The
  owner chose ACCEPT AND CLOSE: the wall is design-shaped (mount
  reward ending + intended escalation), hero-texture, not a defect.
  DIFF-1 -> DONE with the decision recorded; no balance change made.
- Files changed: TASKS.md (DIFF-1 DONE + decision record), PROGRESS.md.
- Verification run: none needed (markdown-only owner decision on top
  of standing green signals: 13/13 logic + 5/5 vision this morning).
- Result: owner decision recorded; DIFF-1 closed. No task work.
- Status after: queue holds 20 DONE + ENH-12 TODO; ZERO blocked items
  remain. Housekeeping (rule 8): 21 DONE -> oldest ART-7 archived (88
  lines); PROGRESS under 500 with this entry (490).
- Remaining work or blocker: none. Standing owner items unchanged
  (deploy is owner-only).
- Next recommended task: ENH-12 (consumer), then producer passes.

### 2026-09-22 15:04 - PRODUCER PASS (control-naming review, attempt 1)

- Status before: queue holds only DIFF-1 (BLOCKED) + 20 DONE after
  ENH-11. Tree clean at 6308fed. Run `2026-09-22T21-49-44Z-2650b0df`.
- LOGIC signal: 13/13 ok, exit 0, zero invariant violations and zero
  page errors. Marathons identical to the standing post-arrow snapshot:
  guanyu 2640/0c + 3144/0c; zhangfei 2640/0c + 2832/0c; huangzhong
  3768/1c + 4524/1c; weiyan 4056/1c + 2916/0c; zhaoyun 9-stage
  3324,3576,6720,5988,4548,4440,5484,8196,6324 with continues
  0,0,2,1,1,0,2,3,2. DIFF-1 shape unchanged (known blocked item). No
  regression.
- VISUAL signal: 5/5 ok, exit 0. Frames 9/9 pass; sprites 256/256,
  weapons 85/85, retracts 170/170; renderer parity clean all 7 screens;
  both negative controls failing correctly; HUD 1/1; findings.jsonl 0
  bytes. No UX_REVIEW.md. Frame signatures (pixel arbiter) identical to
  the standing profiles - no drift. Subjective eye review NOT performed
  (the image-display defect stands, as recorded 13:09); programmatic
  coverage is the ground truth.
- Opportunity review (ONE area: control naming per input class): the
  title plate names keyboard and touch controls but never the GAMEPAD -
  a first-class input class per PROJECT.md. A pad-only player is told
  ARROWS/Z/X/C/ENTER/M/P, the exact defect TitleScene's own comment
  fixed for phones ("naming the controls THIS device has"). ENH-11
  compounded it (Start gained pause, unnamed) and left the hint gap as
  an intended follow-up. Precedent gate exists (touch.spec "the title
  names the controls the device actually has"). Filed ENH-12 (TODO):
  title gamepad line + pad-actionable pause hint + the title-labels
  test family extended to the third class. One-area budget spent, no
  second area inspected.
- Rejected/not pursued: none beyond the standing list (touch-mute: see
  13:09; image tooling: harness-level, out of repo).
- Files changed: TASKS.md (ENH-12 TODO), PROGRESS.md,
  artifacts/loop/proposals-gamepadnaming-enh12.md (gitignored scratch).
- Verification run: both suites via direct node Playwright CLIs with
  full logs to artifacts/loop/signal-tick.log + vision-tick.log
  (gitignored). No game source touched in this pass.
- Result: COMPLETED - one accepted proactive proposal, no regression.
- Status after: producer pass; queue now 20 DONE + DIFF-1 BLOCKED +
  ENH-12 TODO.
- Remaining work or blocker: DIFF-1 still BLOCKED on the owner;
  standing owner items unchanged (deploy).
- Next recommended task: ENH-12 (a later consumer implements it).

- Housekeeping (same iteration, rule 8): DONE count is 20 (at the
  bound, ENH-12 is TODO). PROGRESS.md crossed 500 lines with this
  entry, so the oldest entry (2026-09-21 21:46 ENH-7, 55 finished
  lines) moved to PROGRESS-ARCHIVE.md top; now 465 lines. Latest
  signal snapshot (this entry) and DIFF-1 evidence kept.

### 2026-09-22 14:15 - ENH-11 (attempt 1)

- Status before: ENH-11 TODO (no prior attempts), first TODO in the
  queue. Run `2026-09-22T20-49-50Z-9a20eaba`.
- Work completed: Start (button 9) is now the gamepad pause toggle on
  EITHER pad (pads 0 and 1) via the shared togglePause() - the third
  input class to get pause parity (P: ENH-7, touch button: ENH-8).
  watchConfirmButton gained a padIndex (default 0: every menu call site
  is byte-identical); GameScene routes ONE watcher per pad through an
  action: paused -> resume first (no revive can leak through the
  freeze), game-over countdown -> the existing confirmContinue revive,
  otherwise -> toggle. Self-review caught and removed a composed
  double-watcher on pad 0 (it could resume AND revive in a single
  poll - exactly the leak class ENH-7 forbids).
- Files changed: `src/game/adapters/gamepad.ts` (pad-indexed watcher;
  firstPad removed as unused), `src/game/scenes/GameScene.ts` (routed
  Start action on both pads; pollContinueButton renamed
  pollStartButton), `e2e/gamepad.spec.ts` (+1 test), `TASKS.md`,
  `PROGRESS.md`.
- Tests (new, synthetic-pad harness): pad 1 Start freezes (tick flat
  across ~60 wall frames), pad 2 Start resumes (either pad toggles),
  held Start does not strobe (paused sampled 6x across a 600ms hold),
  and Start keeps its game-over revive role (party down -> countdown ->
  Start revives, and the revive is not a toggle). Both mechanisms
  falsified by probe: binding removed -> the pause pins fail; game-over
  routed to toggle -> the revive pin fails (".not.toBe('dead')").
  Restored green.
- Verification run: lint clean; typecheck clean; unit 196/196; e2e
  54/54 (+1; menus/continue/pause specs green untouched - the routing
  kept those roles); signal 13/13, marathons identical to the standing
  post-arrow snapshot (input-layer change only, zero sim impact);
  vision 5/5, prodbuild 4/4, build ok.
- Known cosmetic gap, consciously out of scope: the pause overlay hint
  still names "PRESS P TO RESUME" (which does resume) and does not
  mention Start. No remapping UI per non-goals.
- Result: all acceptance criteria met. DIFF-1 stays BLOCKED.
- Status after: ENH-11 DONE. Queue holds 20 DONE + DIFF-1 BLOCKED; no
  TODO or IN_PROGRESS remains.
- Remaining work or blocker: none for this task.
- Next recommended task: none available without the owner (producer
  pass when driven; standing owner items: deploy).

- Housekeeping (same iteration, rule 8): 21 DONE exceeded the bound, so
  oldest DONE ART-6 spliced to TASKS-ARCHIVE.md end (DONE now 20).
  PROGRESS.md crossed 500 lines with this entry, so the oldest entry
  (2026-09-21 21:19 MANUAL-WORKER REDESIGN, 44 finished lines) moved to
  PROGRESS-ARCHIVE.md top. Latest signal snapshot
  (this entry) and DIFF-1 evidence kept.
