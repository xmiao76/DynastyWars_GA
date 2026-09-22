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

### 2026-09-22 13:09 - PRODUCER PASS (input-parity review, attempt 1)

- Status before: queue holds only DIFF-1 (BLOCKED) + 20 DONE after
  ENH-9. Tree clean at 3cf53af. Run `2026-09-22T19-49-05Z-e88de4a6`.
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
  bytes. No UX_REVIEW.md.
- Frame sweep: SUBJECTED TO THE IMAGE-DISPLAY DEFECT, recorded as a
  limitation rather than a review. The read_image display served
  mismatched content in batched reads, in isolated reads, and in a
  set-based 9-frame batch (duplicates + foreign captures), while a
  pixel arbiter (@napi-rs/canvas signature scan) confirmed all nine
  files are correct and mutually distinct (title holds its 4029px gold
  logo band, game_over 0 gold, gameplay frames luma ~95, etc).
  PER EVAL-LOOP STEP 3: no reliable subjective image review was
  performed this pass. Partial unattributable views seen across the
  attempts showed no defects. Note for future passes: earlier sweeps'
  eye verdicts may have been partially mis-served too; programmatic
  evidence (vision metrics on the real pixels + arbiter) is the ground
  truth until the display pipeline is fixed.
- Opportunity review (ONE area: input parity of pause): pause shipped
  keyboard-only (ENH-7) and gained touch parity (ENH-8), but GAMEPAD
  players (first-class input per PROJECT.md) have no pause path at all,
  and Start (button 9) is provably inert during gameplay
  (watchConfirmButton -> confirmContinue no-ops outside game-over).
  Same evidential shape as ENH-8; fix is a binding to the shared
  togglePause(), testable with the existing synthetic-pad harness.
  Filed ENH-11 (TODO). One-area budget spent, no second area inspected.
- Rejected/not pursued: touch-mute parity (M keyboard-only is real but
  mitigated by device hardware volume - weaker than the pause cases);
  anything in the image-display tooling (harness-level, outside this
  repository).
- Files changed: TASKS.md (ENH-11 TODO), PROGRESS.md,
  artifacts/loop/proposals-gamepadpause-enh11.md (gitignored scratch).
- Verification run: both suites via direct node Playwright CLIs with
  full logs to artifacts/loop/signal-tick.log + vision-tick.log
  (gitignored). No game source touched in this pass.
- Result: COMPLETED - one accepted proactive proposal; the frame sweep
  is reported as unreviewed-by-eye with programmatic coverage instead.
- Status after: producer pass; queue now 20 DONE + DIFF-1 BLOCKED +
  ENH-11 TODO.
- Remaining work or blocker: DIFF-1 still BLOCKED on the owner;
  standing owner items unchanged (deploy).
- Next recommended task: ENH-11 (a later consumer implements it).

- Housekeeping (same iteration, rule 8): DONE count is 20 (at the
  bound, ENH-11 is TODO). PROGRESS.md crossed 500 lines with this
  entry, so the oldest entry (2026-09-21 20:38 producer pass, 58
  finished lines) moved to PROGRESS-ARCHIVE.md top; now 463 lines.
  Latest signal snapshot (this entry) and DIFF-1 evidence kept.

### 2026-09-22 12:35 - ENH-9 (attempt 1)

- Status before: ENH-9 TODO (no prior attempts); first TODO after the
  owner's ENH-10 took priority last iteration. Run
  `2026-09-22T18-52-08Z-2914ec9e`.
- Work completed: the stage-clear beat now counts in update() below the
  pause gate (`clearMsLeft`, the continue-countdown template) instead of
  `time.delayedCall(2000)`, which fired straight through a pause and
  moved to the result scene under the PAUSED overlay. Same 2000ms beat,
  armed at the same event drain, same payload read at fire time - only
  the clock source changed (Phaser time plugin -> update delta).
- Files changed: `src/game/scenes/GameScene.ts`, `e2e/pause.spec.ts`
  (+1 test), `TASKS.md`, `PROGRESS.md`.
- Tests (new, real play): drives the REAL clear path (forceBoss, boss
  down -> stageclear event -> 2s beat), pauses inside the window, then:
  scene still 'game' after 3 wall seconds + PAUSED caption visible
  (the old code flips to 'result' at ~2s); resume completes the trip to
  the result scene with no further input. Both mechanisms falsified by
  probe: restoring the old delayedCall -> "the result scene arrived
  under the PAUSED overlay"; suppressing the transition -> the resume
  assert fails. Restored green.
- Sweep (acceptance): every gameplay scene.start now pause-gated -
  pending-restart, gameover expiry, clear->result (this fix). Menu
  transitions run only after the game scene is gone (no pause exists
  there); bridge forceResult/forceGameOver are harness aids by design.
- Verification run: lint clean; typecheck clean; unit 196/196; e2e
  53/53 (+1; pause 4/4 and the bot-driven stageclear spec green on the
  unpaused path), signal 13/13 (marathons identical to the ENH-10
  post-arrow tables - zero sim impact, as expected for a scene-layer
  change), vision 5/5, prodbuild 4/4, build ok.
- Result: all acceptance criteria met. DIFF-1 stays BLOCKED.
- Status after: ENH-9 DONE. Queue holds 20 DONE + DIFF-1 BLOCKED; no
  TODO or IN_PROGRESS remains.
- Remaining work or blocker: none for this task.
- Next recommended task: none available without the owner (producer
  pass when driven; standing owner items: deploy).

- Housekeeping (same iteration, rule 8): DONE count hit 21, so oldest
  DONE ART-5 spliced to TASKS-ARCHIVE.md (20 held). A splice mishap is
  recorded rather than hidden: the first attempt bounded the block by
  the ENH-9 header instead of the NEXT `### ` header and swept ART-5
  through ENH-8 (458 lines, including BLOCKED DIFF-1) into the archive.
  Uncommitted state only; fully repaired before any commit by reinserting
  the 10-entry block with content-anchored asserts, then re-splicing
  ART-5 alone (42 lines, bounded by DIFF-1's header). Verified after
  repair: DONE 20 / BLOCKED 1 / TODO 0, DIFF-1 back in TASKS.md,
  archive tail chronological (ART-3, ART-4, ART-5). PROGRESS.md passed
  500 lines, so the oldest two finished entries (ENH-5, ENH-6) moved to
  PROGRESS-ARCHIVE.md top (now 464 lines); latest signal snapshot and
  DIFF-1 evidence kept.

### 2026-09-22 11:49 - ENH-10 (attempt 1, explicit owner request)

- Status before: owner requested two arrow fixes (hit height + hanging
  arrows) and to continue the loop with the new model (mimo-v2.6-pro).
  Queue held ENH-9 (TODO) + DIFF-1 (BLOCKED) + 20 DONE; an explicit owner
  request takes priority over queue selection, so ENH-10 was filed and
  worked in this consumer iteration. ENH-9 stays TODO. Run
  `2026-09-22T17-39-18Z-bd9a78cf`.
- Root causes (the hang had THREE mechanisms, not one):
  1. both spawn sites flew arrows at z = 10 against a ~92-unit fighter -
     the legs. Measured in-game: 0.15 of body height (the owner's "lower
     body" verbatim).
  2. `updateDeaths` removed dead entities only when side !== 'hero' - a
     DEAD HERO ARROW survived the filter and rendered frozen forever.
  3. `applyPhysics` x-clamped every side === 'hero' entity to the screen,
     pinning hero arrows at the screen edge forever; projectiles also had
     no flight envelope (flat flight to the stage bound).
- Work completed: ARROW_Z = 40 (mid-body) on both spawn paths; hit test
  shifted to the target's CHEST (ARROW_CHEST_Z = 30) so ARROW_Z -
  ARROW_CHEST_Z = 10 reproduces the old feet-level hit/jump-dodge sets
  EXACTLY (by construction, then pinned); flight envelope - level 240px
  (beyond any fire range), then ARROW_FALL 2/tick to the ground, gone at
  contact, ARROW_MAX_TRAVEL 360 cap; dead projectiles removed on BOTH
  sides; hero arrows exempt from the screen clamp.
- Files changed: `src/core/constants.ts` (arrow flight block), `src/core/
  sim.ts` (spawn z, stepProjectiles envelope + chest hit, applyPhysics
  clamp exemption, updateDeaths), `src/core/ai.ts` (spawn z), `test/core/
  arrows.test.ts` (new, 8 tests), `e2e/arrows.spec.ts` (new, 3 tests),
  `TASKS.md`, `PROGRESS.md`.
- Tests: 8 unit (both spawn paths at ARROW_Z; level-then-fall envelope
  with exact boundary; fall-to-ground removal; max-travel cap; hero-arrow
  removal; screen-edge no-pin; grounded-hit and airborne-dodge identity
  with explicit constant-math preconditions) + 3 e2e in-situ (band pin
  0.3-0.7 of REAL sprite heights vs the display list; fall + removal;
  NPC archer AI in situ). Falsified 6 mechanisms by revert: z=10 (hit-set
  tests fail + e2e band reads 0.15), chest offset dropped (both identity
  tests fail), no fall (both fall tests fail), removal reverted (both
  hero tests fail), clamp restored (edge test fails). All restored green.
- Verification run: lint clean; typecheck clean; unit 196/196 (+8); e2e
  52/52 (+3; full suite with final src, arrows spec green repeatedly
  after); signal 13/13, zero violations/page errors; vision 5/5 (9/9
  frames, 256/256 sprites, 85/85 weapons, 170/170 retracts, parity
  clean, both negative controls correct, HUD 1/1); prodbuild 4/4; build
  ok. Marathon deltas RECORDED, not chased (the range change is the
  requested behavior; no tuning touched; all marathons still complete):
  guanyu s2 -37% ticks, zhaoyun s3 +59% / s4 -33%, huangzhong s2 -31%;
  zhangfei and weiyan identical. Long-range chip hits beyond 240px are
  gone by design. DIFF-1 measurement note: its stage-shape analysis
  predates this arrow behavior; the anomaly it tracks (stage 3 wall)
  remains the standing item.
- Eye review (captures at gameplay size, artifacts/arrows/): mid-flight
  frames show the arrow at chest/torso height for both hero and NPC
  shots; the fall frame shows the arrow low and descending before it
  vanishes at the ground. TWO TOOL CAVEATS recorded for future passes:
  (1) batched read_image calls can mis-associate images with paths, and
  an isolated read also glitched once - captures were verified with a
  pixel arbiter instead (@napi-rs/canvas HUD-plate hashes: tests 1+3
  (huangzhong) share one hash, test 2 (zhao yun) differs, exactly as
  designed). Verify eye-critical evidence programmatically when reads
  look contradictory; never trust a suspicious attachment over the
  asserts. (2) Never overlap Playwright runs: a timed-out invocation can
  leave orphaned suites that race later runs for port 5177 and artifact
  filenames. (An early 'orphan' theory for the image weirdness was
  WRONG and is retracted - the arbiter showed the files were always
  correct; the display pipeline was the gremlin.)
- Timing: overrun - ~70 min vs the 50-min timebox, spent on the
  read_image forensics. Work itself complete and verified.
- Result: all acceptance criteria met. DIFF-1 stays BLOCKED.
- Status after: ENH-10 DONE. Queue now 20 DONE + DIFF-1 BLOCKED +
  ENH-9 TODO.
- Remaining work or blocker: none for this task.
- Next recommended task: ENH-9 (pause vs stage-clear transition).

- Housekeeping (same iteration, rule 8): 21 DONE exceeded the bound, so
  oldest DONE ART-4 spliced to TASKS-ARCHIVE.md end (DONE now 20).
  PROGRESS.md was 470 lines, stays under 500 with this entry.

### 2026-09-22 03:14 - PRODUCER PASS (pause-completeness review, attempt 1)

- Status before: queue holds only DIFF-1 (BLOCKED) + 20 DONE after the
  ENH-8 trial. Tree clean at 64f1e73. Run `2026-09-22T07-49-14Z-d00c5eb7`.
- LOGIC signal: 13/13 ok, exit 0, zero invariant violations and zero page
  errors. Every marathon tick/continue count identical to the ENH-6
  snapshot: guanyu 2640/0c + 4944/0c; zhangfei 2640/0c + 2832/0c;
  huangzhong 3972/1c + 6588/3c; weiyan 4056/1c + 2916/0c; zhaoyun 9-stage
  3324,3576,4224,8988,4956,4440,5136,8100,6672 with continues
  0,0,1,3,1,0,1,3,2 (total 11). DIFF-1 standing shape unchanged (known
  blocked item). No regression.
- VISUAL signal: 5/5 ok, exit 0. Frames 9/9 pass (game_combat richness
  1038, exactly the snapshot); sprites 256/256, weapons 85/85, retracts
  170/170; renderer parity clean on all 7 screens; both negative
  controls failing correctly; HUD 1/1; findings.jsonl 0 bytes. No
  UX_REVIEW.md.
- Frame sweep: all 9 screens judged by eye at gameplay size. NO DEFECT.
- Opportunity review (ONE area: pause-feature completeness): audited
  every gameplay `scene.start` against ENH-7's documented "no stage
  transitions until resume" promise. Pending-start restart and the
  game-over countdown honor it (gated/frozen); the stage-clear path
  does not - its wall-clock `delayedCall(2000)` fires through a pause,
  changing scenes under the PAUSED overlay. Real defect, sole
  escapee, no duplicate task. Filed ENH-9 (TODO) with both-direction
  e2e pins. One-area budget spent, no second area inspected.
- Rejected/not pursued: no other defect proposals (signals green,
  frames clean).
- Files changed: TASKS.md (ENH-9 TODO), PROGRESS.md,
  artifacts/loop/proposals-clearpause-enh9.md (gitignored scratch).
- Verification run: both suites via direct node Playwright CLIs with
  full logs to artifacts/loop/signal-tick.log + vision-tick.log
  (gitignored). No game source touched in this pass.
- Result: COMPLETED - one accepted defect proposal, no regression.
- Status after: producer pass; queue now 20 DONE + DIFF-1 BLOCKED +
  ENH-9 TODO.
- Remaining work or blocker: DIFF-1 still BLOCKED on the owner;
  standing owner items unchanged (deploy).
- Next recommended task: ENH-9 (a later consumer implements it).

- Housekeeping (same iteration, rule 8): none needed. DONE count is 20
  (at the bound, ENH-9 is TODO); PROGRESS.md was 427 lines, stays under
  500 with this entry.

### 2026-09-22 00:13 - ENH-8 (attempt 1)

- Status before: ENH-8 TODO (no prior attempts). Consumer iteration under
  run `2026-09-22T06-49-10Z-e7ded175`.
- Work completed: touch pause button at bottom-centre (240,248), clear of
  plates/bars/banners/down-texts in all HUD states. Circled-II glyph drawn
  into the shared pad Graphics (no new named objects, so the pads==1 /
  labels==3 visibility assertions cover it unchanged); named `touchPause`
  zone on pointerup calling back into a shared `togglePause()` (P key
  refactored onto it). pointerup is load-bearing, not stylistic: within
  one input dispatch, game-object handlers run before scene-level
  pointerdown (verified in the Phaser bundle), so a pointerdown toggle
  could unpause and then immediately revive inside one tap during a
  paused countdown; separating down/up makes the order irrelevant.
  Overlay hint branches on `hasTouch()` (TAP TO RESUME vs PRESS P) -
  caught by eye review (below), mirroring the continue hint. Zone
  counts 7->8 in `TOUCH_ZONE_COUNT`, touch.spec and the prodbuild
  phone-fit gate (the pause button is the 8th control).
- Files changed: `src/game/adapters/touch.ts`,
  `src/game/scenes/GameScene.ts`, `src/game/scenes/HudScene.ts`,
  `e2e/touchpause.spec.ts` (new), `e2e/touch.spec.ts`,
  `prodbuild/prodbuild.spec.ts`, `TASKS.md`, `PROGRESS.md`.
- Tests (new, Pixel 7 emulation, real play): zone discovered by name
  (never hard-coded); tap freezes 60 wall frames with full-snapshot
  `toEqual`; PAUSED caption visibility pinned both directions; tap
  resumes with tick advance. Falsified: zone unwired -> test fails.
  Desktop absence (zero zones) covers the new zone with no change.
- Verification run: lint clean; typecheck clean; unit 188/188; e2e
  49/49 (48 + touchpause); signal 13/13 with marathons tick-identical
  to ENH-6 (no core changes); vision 5/5 (9/9 frames, 256/256 sprites,
  85/85 weapons, 170/170 retracts, parity clean, both negative
  controls correct, HUD 1/1); prodbuild 4/4 (8 zones, portrait +
  landscape on-screen); build ok. The one-line hint change landed
  after the full pass and was re-verified on every path it touches
  (pause/touchpause/touch/hud specs, 14/14); desktop vision, autopilot
  signal, zone-count prodbuild and unit cannot observe a touch-only
  text string, so those suites were not re-run (same reasoning as
  GATE-3's config-only change).
- Eye review (phone portrait capture): PAUSED slab + TAP TO RESUME
  legible, pause glyph visible bottom-centre, d-pad + A/B/C + HUD all
  clear, game fits the viewport. Desktop: vision metrics unchanged
  (hasTouch-gated) + pause.spec overlay pins green.
- Result: all acceptance criteria met. DIFF-1 stays BLOCKED.
- Status after: ENH-8 DONE. Queue holds 20 DONE + DIFF-1 BLOCKED; no
  TODO or IN_PROGRESS remains.
- Remaining work or blocker: none for this task.
- Next recommended task: none available without the owner (producer
  pass when driven; standing owner items: deploy).

- Housekeeping (same iteration, rule 8): 21 DONE exceeded the bound,
  so oldest DONE ART-3 (lowest number of the chronological ART arc)
  spliced to TASKS-ARCHIVE.md end (DONE now 20). PROGRESS.md reached
  594 lines, so the oldest four finished entries (ENH-4, 02:55 producer,
  MIGRATION-GA, 18:44 producer) moved to PROGRESS-ARCHIVE.md top (now
  424 lines). Latest signal snapshot (this entry) and DIFF-1 BLOCKED
  evidence kept.

### 2026-09-21 23:03 - PRODUCER PASS (first scheduled tick, attempt 1)

- Status before: queue holds only DIFF-1 (BLOCKED) + 20 DONE after the
  ENH-7 trial. Tree clean at 6f25535. First firing of schedule-2 (new
  DSH-session-worker runbook); run `2026-09-22T05-49-08Z-e0194047`.
- LOGIC signal: 13/13 ok, exit 0, zero invariant violations and zero page
  errors. Every marathon tick/continue count identical to the ENH-6/ENH-7
  snapshot: guanyu 2640/0c + 4944/0c; zhangfei 2640/0c + 2832/0c;
  huangzhong 3972/1c + 6588/3c; weiyan 4056/1c + 2916/0c; zhaoyun 9-stage
  3324,3576,4224,8988,4956,4440,5136,8100,6672 with continues
  0,0,1,3,1,0,1,3,2 (total 11). DIFF-1 standing shape unchanged (known
  blocked item, not a new finding). No regression.
- VISUAL signal: 5/5 ok, exit 0. Frames 9/9 pass (game_combat richness
  1021, within run-to-run jitter of 1038); sprites 256/256, weapons
  85/85, retracts 170/170; renderer parity clean on all 7 screens; both
  negative controls failing correctly (empty-backdrop on shape:
  silhouetteComplexity 0.031, appendageRatio 0; flat silhouette on
  shading: 1 color, 1 tonal band); HUD 1/1; findings.jsonl 0 bytes.
  No UX_REVIEW.md.
- Frame sweep: all 9 screens judged by eye at gameplay size (title with
  the P PAUSE line fitting its plate, select, idle, both combats incl.
  Zhang Fei's serpent pike, boss night scene, result, game over,
  complete). NO DEFECT.
- Opportunity review (ONE area: touch controls vs pause, usability):
  ENH-7 gave keyboard players P; a touch device has no P key and no
  other pause path, so a phone player cannot pause a ~13-minute run.
  Touch is first-class here (7 HUD-owned zones, 8 touch e2e tests,
  tapGamePoint patterns); the toggle writes the existing paused flag,
  so a zone inherits all semantics; free anchors exist. No duplicate
  task or rejection (ENH-7 named it as follow-up). Filed ENH-8 (TODO).
  Not filed: pause menu/volume (ENH-7 non-goals), auto-pause on blur
  (owner behavior decision), marathon-scale pause neutrality in the
  signal (test-only gap for a test-only mode - too weak).
- Rejected/not pursued: no defect proposals (signals green, frames
  clean); one-area budget spent, no second area inspected.
- Files changed: TASKS.md (ENH-8 TODO), PROGRESS.md,
  artifacts/loop/proposals-touchpause-enh8.md (gitignored scratch).
- Verification run: both suites via direct node Playwright CLIs with
  full logs to artifacts/loop/signal-tick.log + vision-tick.log
  (gitignored). Note: the first signal launch piped output through a
  tail and was restarted with file logging so marathon tables stay
  comparable - lesson recorded for future ticks. No game source
  touched in this pass.
- Result: COMPLETED - one accepted proactive proposal, no regression.
- Status after: producer pass; queue now 20 DONE + DIFF-1 BLOCKED +
  ENH-8 TODO.
- Remaining work or blocker: DIFF-1 still BLOCKED on the owner;
  standing owner items unchanged (deploy).
- Next recommended task: ENH-8 (a later consumer implements it).

- Housekeeping (same iteration, rule 8): none needed. DONE count is 20
  (at the bound, ENH-8 is TODO); PROGRESS.md was 486 lines, stays under
  500 with this entry.

### 2026-09-21 21:46 - ENH-7 (attempt 1, first manual-worker trial)

- Status before: ENH-7 TODO (no prior attempts), first iteration executed by
  the DSH session itself under the new `--begin-manual`/`--finish-manual`
  protocol (run `2026-09-22T04-19-16Z-2520ed20`).
- Work completed: P toggles gameplay pause in GameScene (repeats ignored,
  flag reset on scene create). While paused, update() polls adapters but
  steps nothing: zero sim ticks, frozen continue countdown, no joins, no
  stage transitions; confirmContinue (Enter/Start/tap) is pause-guarded.
  New `clear()` on all three input adapters (+ NO_TOUCH), called on both
  toggle edges and every frozen frame, so pause-time presses cannot leak as
  actions or co-op joins on resume. HUD pause overlay (dim + gold slab +
  PAUSED + PRESS P TO RESUME) mirrors the continue overlay's depths/alpha
  and reads `game.paused` structurally. Title desktop key line gains
  P PAUSE (touch line unchanged: keyboard-only, like mute).
- Files changed: `src/game/scenes/GameScene.ts`, `HudScene.ts`,
  `TitleScene.ts`, `src/game/adapters/{keyboard,gamepad,touch}.ts`,
  `e2e/pause.spec.ts` (new), `TASKS.md`, `PROGRESS.md`.
- Tests (new, all in e2e/pause.spec.ts, real play): (1) P freezes a live
  co-op game: full-sim-snapshot `toEqual` across 120 counted wall frames,
  then tick advance + P2 retained on resume. (2) Z/X/C/F mashed while
  paused: 10 post-resume samples show no input state, P2 never joins.
  (3) Overlay: paused mean luma < 85% of lit (lit floor guards vacuous
  black), 2707 gold caption pixels vs 0 unpaused/resumed (floor 500),
  resumed brightness restored. Falsified by revert: gate disabled -> tests
  1+2 fail; clearing stubbed -> test 2 alone fails; restored green.
- Verification run: lint clean; typecheck clean; unit 188/188 (first run
  flaked 187/188 on an unidentified test, green twice after - recorded,
  not chased); e2e 48/48 (45 + 3 new) incl. occlusion gates and title
  controls spec; signal 13/13, zero violations/page errors, every marathon
  tick-identical to the ENH-6 snapshot (zero sim impact, no core changes);
  vision 5/5 - frames 9/9 (game_combat richness 1038, as before), sprites
  256/256, weapons 85/85, retracts 170/170, parity clean all 7 screens,
  both negative controls failing correctly, HUD 1/1; prodbuild 4/4;
  build ok. Direct node CLIs used throughout (documented npm scripts are
  equivalent; earlier npm.ps1 notes are host-specific).
- Eye review (by me, image input restored mid-trial): paused.png (dim,
  slab, PAUSED + hint all legible), title.png (P PAUSE fits plate with
  margin; measured 250px vs 308px plate), game_combat.png + unpaused.png
  + resumed.png (no overlay when live, overlay fully cleared on resume,
  enemies advanced after resume, frozen while paused). No regressions.
- Result: all acceptance criteria met. DIFF-1 stays BLOCKED (untouched).
- Status after: ENH-7 DONE. Queue holds 20 DONE + DIFF-1 BLOCKED; no TODO
  or IN_PROGRESS remains.
- Remaining work or blocker: none for this task.
- Next recommended task: none available without the owner (producer pass
  when driven; standing owner items: deploy).

- Housekeeping (same iteration, rule 8): 21 DONE exceeded the bound, so
  oldest DONE ART-2 (lowest number of the chronological ART arc, same rule
  as the ART-1 move) spliced to TASKS-ARCHIVE.md end (DONE now 20).
  PROGRESS.md passed 500 lines, so oldest finished entries moved to
  PROGRESS-ARCHIVE.md top (below this entry's count). Latest signal
  snapshot (this entry's ENH-6-identical marathon tables) and DIFF-1
  BLOCKED evidence kept.

### 2026-09-21 21:19 - MANUAL-WORKER REDESIGN (owner-requested infrastructure, attempt 1)

- Status before: runner PAUSED (`UNKNOWN`: Codex worker died at startup, exit 1
  in 0.5s). Queue: ENH-7 TODO, DIFF-1 BLOCKED, 20 DONE. Tree clean.
- Root cause (proven, not guessed): the new DSH-schedule driver session runs
  under an OS-enforced file sandbox (writes allowed only under the repo
  workspace + session-private `%TEMP%\dsh-*`; token stripped to
  SeChangeNotifyPrivilege alone). Proof: workspace and session-TEMP writes
  succeed, while writes to `~\.codex\tmp\...` AND to the home root (whose ACL
  grants qiyu0 FullControl with zero denies) fail with raw os error 5 — so the
  denial is an external filter, not DACL-based. The runner spawns the worker
  as a child, the child inherits the sandbox, Codex cannot init `~/.codex`
  (PATH aliases + app-server client) and exits. The identical invocation
  worked 25 min earlier from an unsandboxed context (same binary v0.153.1,
  same 15 args). The 60-SID DENY wall on `.codex` has zero intersection with
  the session token and is a red herring; untouched.
- Owner decision: eliminate the Codex worker; the DSH driver session executes
  iterations itself (process gap, not a game defect: the schedule redesign
  replaced the TIMER, never the WORKER).
- Work completed: split-phase manual protocol in the runner. `--begin-manual`
  (no adapter resolution) guards paused/busy like auto mode, writes the same
  request/input/metadata artifacts, binds `run.lock` to the runId, prints run
  JSON, exits holding the lock. `--finish-manual` reuses `parseReport`
  byte-for-byte, records lastRun, applies the BLOCKED/REGRESSION pause
  policy, releases the lock; missing/invalid reports pause (worker ran),
  protocol errors (no begun run, foreign lock) change nothing. Timeouts move
  to the runbook (~50-min timebox, IN_PROGRESS fallback); crash posture
  unchanged (dead turn leaves lock+activeRun, ticks skip, owner recovers).
- Files changed: `scripts/loop/runner.mjs` (+131), `scripts/loop/config.mjs`
  (flags + HELP), `scripts/loop/storage.mjs` (lock binding + manual release),
  `scripts/test-loop.mjs` (+5 tests), `docs/SCHEDULING.md` (driver + bootstrap
  runbook rewritten), `docs/LOOP_ENGINEERING.md` (protocol section, exit row,
  DSH-limitation resolution), `PROJECT.md` (execution bullets).
  `config.local.json` keeps `adapter: codex` as the unsandboxed owner-terminal
  escape hatch; auto mode untouched.
- Verification run: `node scripts/test-loop.mjs` 28/28 (23 existing + 5 new),
  eslint on all touched script files clean. Full game gates untouched by this
  change (scripts/docs only); the trial iteration below is the end-to-end proof.
- Result: infra implemented and offline-green. Trial authorized next.
- Status after: runner still paused; resume authorized by the owner for one
  ENH-7 trial under the new protocol.
- Remaining work or blocker: trial tick (begin, implement ENH-7 as worker,
  finish), then swap schedule-1 to the new runbook, then verify + commit.
- Next recommended task: ENH-7 trial (same session).
