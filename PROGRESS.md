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

### 2026-09-23 18:40 UTC - UI-3 (attempt 3, full verification, DONE)

- Status before: UI-3 BLOCKED (environment, attempt 2): no browser launched,
  complete implementation uncommitted. The runner is paused on that BLOCKED
  (untouched here). This round came from the owner's standing overhaul goal
  in the DSH session, not a runner tick.
- Blocker cleared: at 18:03 UTC the same probe that hung at 16:00-17:00
  (`chrome-headless-shell --dump-dom data:` with a fresh profile) exited in
  1 s with the DOM. No change on my side, so the cause was environmental and
  transient. Probe profile removed.
- Work completed: no source change to the attempt-1 draft. Ran every serial
  gate on it:
  - lint PASS, typecheck PASS, unit 306/306 PASS (earlier this session)
  - e2e 63/63 in 3.6 min (+1 select-look; select, touch, layout,
    hero-faces and hud unchanged and green)
  - vision 5/5 (SPRITE GATE 256/256 sprites, 85/85 weapons, 170/170
    retracts; renderer parity includes the new select)
  - selfplay 13/13 in 8.5 min; marathons identical to the standing
    snapshot: guanyu 2640/0c+3144/0c, zhangfei 2640+2832, huangzhong
    3768/1c+4524/1c, weiyan 4056/1c+2916/0c, zhaoyun 9 stages
    3324,3576,6720,5988,4548,4440,5484,8196,6324 with continues
    0,0,2,1,1,0,2,3,2 (the select screen does not touch the sim)
  - build PASS; the process exited normally this time, 48 s
  - prodbuild 4/4
- Reviewed: artifacts/vision/parity-webgl-select.png. WebGL draws the baked
  roster identically to canvas: gold 1P on Guan Yu, blue 2P on Zhang Fei,
  pips, strip prompt. Plus the attempt-1 captures ui3-select-{desktop,
  zhaoyun,phone}.png. Also captured the current HUD
  (artifacts/vision/boss_fight.png) as the UI-4 "before".
- Housekeeping (rule 8): UI-3 DONE would make 21, so the oldest DONE in
  completion order (ART-11, 43 lines, bounded by DIFF-1's header,
  anchor-asserted) moved to the TASKS-ARCHIVE.md tail after ART-10; 20 DONE
  held. This entry pushed PROGRESS.md past 500, so the oldest finished,
  unprotected entry (2026-09-23 00:24 ART-16) moved to the
  PROGRESS-ARCHIVE.md top. The latest signal snapshot (now this entry) and
  the DIFF-1 closure stay.
- Files changed: the UI-3 source set (see the 16:45 entry), TASKS.md,
  TASKS-ARCHIVE.md, PROGRESS.md, PROGRESS-ARCHIVE.md.
- Result: DONE, committed locally.
- Status after: UI-3 DONE; queue 20 DONE + UI-4/UI-5/ART-19/ART-20 TODO +
  ENH-12 IN_PROGRESS (deferred under the overhaul). The runner stays paused
  (BLOCKED from attempt 2) until the owner resumes it.
- Next recommended task: UI-4 (arcade HUD top band).

### 2026-09-23 17:00 UTC - UI-3 (attempt 2, verification blocked by environment)

- Status before: UI-3 IN_PROGRESS (attempt 1 left a complete, uncommitted
  implementation; full browser gates never ran because Chromium launches
  hang). Run `2026-09-23T16-54-11-532Z-17a495a1`.
- Work completed: no code change. Re-verified the draft without a browser:
  lint PASS, typecheck PASS, unit 306/306 PASS. Probed browser launch again
  before starting the gates:
  - chrome-headless-shell 1243, `--dump-dom data:` with a fresh profile: hung
    at 30 s, no output (hanging since about 16:00 UTC)
  - Playwright Firefox 1543, `--headless --screenshot` with a fresh profile:
    hung at 40 s, no screenshot
  - (attempt 1: system Edge headless hung the same way)
  Three independent browser engines hanging at startup points to a
  system-level fault (graphics/desktop session or a system service), not to
  this repository or one browser build. `--version`, node, named pipes and
  child spawns still work. FontCache is running. Only my own probe
  processes and profiles were stopped/removed.
- Files changed: TASKS.md (UI-3 -> BLOCKED with the exact blocker),
  PROGRESS.md. The attempt-1 draft stays uncommitted in the working tree
  (backup artifacts/loop/ui3-attempt1.patch).
- Verification run: lint, typecheck, unit only. e2e/vision/selfplay/prodbuild
  cannot run without a browser, so they were not attempted this tick.
- Result: BLOCKED - a missing tool (a launchable browser), not a quota
  error, so the QUOTA-WAIT exception does not apply.
- Status after: UI-3 BLOCKED (environment). Runner will pause for owner
  review. DONE count 20.
- Remaining work or blocker: owner restores browser launch (reboot likely),
  resumes the runner and resets UI-3 to IN_PROGRESS. Then one iteration runs
  the serial full gates on the draft, marks DONE and commits.
- Next recommended task: UI-3 verification once browsers launch.

### 2026-09-23 16:45 UTC - UI-3 (attempt 1, warrior roster select)

- Status before: UI-3 TODO (no prior attempts); UI-1/UI-2 DONE. Run
  `2026-09-23T13-14-32-125Z-a80a939e`, far past its 50-minute timebox.
- Work completed: SelectScene rewritten as a roster screen. One baked backdrop
  (selectart.ts): parchment with ink-wash mountains, a vermilion sun, grain
  and burnt edges, a faction-blue lacquer roster frame (gold double rim,
  fretwork, corner bosses) and a pointed lacquer command strip. Five 84x160
  baked cards: 76x84 portrait recess (ART-18 portraits), parchment name
  plate (nameZh 16 + nameEn caps 8), stat tray with LIFE/SPEED bronze pips
  (1..5, normalised across the roster from maxHp/walkSpeed; sim data
  untouched). Gold 1P halo (denser, white-hot core, slow alpha breath) and
  blue 2P halo, both behind the cards, with 1P/2P pennants; non-picked
  portraits dimmed. 2P marks the hero a drop-in P2 actually gets:
  `secondPlayerCharacter` moved from GameScene to src/game/players.ts and is
  used by both, so the preview cannot drift from the join (presentation only).
  Kept: cursor starts 0, LEFT/RIGHT wrap, Enter + watchConfirmButton,
  consumePendingStart, exactly five tap Zones in CHARACTER_ORDER that pick
  that hero, the confirm seed, portrait:* textures, byte-identical device
  prompts. All chrome canvas-baked (no Graphics gradients).
- Tests: test/game/roster.test.ts (6: cards + halos fit the frame, row
  centred, card sections stacked, pips span 1..5 and order like the stats,
  2P never equals 1P). e2e/select-look.spec.ts: kit textures, portraits and
  bilingual labels per card, 1P/2P halos on cards 0/1, ArrowLeft wraps to
  4/0, three ArrowRight lands 2/0, phone shows TAP A WARRIOR TO FIGHT;
  writes the review captures. PASSED twice (before and after the halo tune).
- Reviewed: artifacts/look/ui3-select-desktop.png, ui3-select-zhaoyun.png,
  ui3-select-phone.png. First capture: the gold 1P halo was lost against
  the gold card rims -> made denser with a white core and dimmed idle
  portraits (0.5, 2P 0.72); re-captured and confirmed.
- Verification run: lint PASS, typecheck PASS, unit 306/306 PASS. NOT run:
  chromium e2e (a full attempt ran 25/63 with the first ~10 failing
  `browserType.launch: Timeout 180000ms`; stopped), selfplay, vision,
  prodbuild. Vite build wrote dist ("built in 1.2s") but the process never
  exited, twice.
- Environment blocker (not code): from ~16:00 UTC every Chromium launch
  hangs at startup - Playwright's headless shell, a bare
  `chrome-headless-shell --dump-dom data:` probe, and system Edge headless
  all stall with zero output and ~0 CPU (threads parked; only a gpu-process
  child spawns). `--version`, plain node, named pipes and child spawns are
  fine; disk 11 GB free, RAM 8 GB free, no display-driver events. The same
  binary launched normally earlier in this run (select-look.spec). Only my
  own probe processes were stopped.
- Files changed (uncommitted draft): src/game/{players.ts, art/selectart.ts,
  ui/roster.ts, ui/type.ts, scenes/SelectScene.ts, scenes/GameScene.ts},
  e2e/select-look.spec.ts, test/game/roster.test.ts; backup
  artifacts/loop/ui3-attempt1.patch. TASKS.md, PROGRESS.md.
- Result: IN_PROGRESS, no commit (full gates unverified).
- Status after: UI-3 IN_PROGRESS attempt 1. DONE count 20 (no task
  archive). Housekeeping (rule 8): this entry pushed PROGRESS.md to 504, so
  the oldest finished entry (2026-09-22 14:15 ENH-11, 48 lines,
  anchor-asserted) moved to the PROGRESS-ARCHIVE.md top above the 13:09
  producer pass; now ~460 lines. The latest signal snapshot (15:04 producer
  pass) stays here.
- Remaining work: once Chromium launches again (likely needs a reboot or the
  owner clearing whatever holds it), run the serial full gates on this draft
  (e2e incl. select/touch/layout/hero-faces, selfplay, vision incl. select
  parity, build, prodbuild), then mark DONE and commit.
- Next recommended task: UI-3 verification (continue IN_PROGRESS).

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
