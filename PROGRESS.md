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

### 2026-09-21 20:38 - PRODUCER PASS (signals + pause-area review, attempt 1)

- Status before: queue holds only DIFF-1 (BLOCKED on an owner design
  decision) + 20 DONE. No IN_PROGRESS or TODO. Tree clean at 001fa42
  (owner committed ENH-6).
- LOGIC signal: `npm run signal` 13/13 ok, zero invariant violations and
  zero page errors. Every marathon tick/continue count identical to the
  ENH-6 snapshot: guanyu 2640/0c + 4944/0c; zhangfei 2640/0c + 2832/0c;
  huangzhong 3972/1c + 6588/3c; weiyan 4056/1c + 2916/0c; zhaoyun 9-stage
  3324,3576,4224,8988,4956,4440,5136,8100,6672 with continues
  0,0,1,3,1,0,1,3,2 (total 11). No regression; the DIFF-1 standing shape
  is unchanged (known blocked item, not a new finding).
- VISUAL signal: `npm run vision` 5/5. Frames 9/9 pass (game_combat
  colorRichness 1038, same as ART-15/ENH-6); sprites 256/256, weapons
  85/85, retracts 170/170; renderer parity clean on all 7 screens; both
  negative controls failing correctly (empty-backdrop on shape:
  silhouetteComplexity 0.031, appendageRatio 0; flat silhouette on
  shading: 1 color, 1 tonal band); HUD 1/1; findings.jsonl 0 bytes.
  No UX_REVIEW.md.
- Frame sweep: all 9 screens judged by eye at gameplay size (title,
  select, idle, both combats, boss night scene, result, game over,
  complete). NO DEFECT: the five ART-15 weapons read in situ, no
  clipping, no weapon over a face, HUD readable, portraits distinct.
- Opportunity review (ONE area: in-game pause, usability): evidence of a
  real gap. `pause` has zero matches in src/selfplay/test/e2e; the title
  screen's key list names no pause key; the only blur/suspend/hidden
  hits in src are touch-control naming, portrait shading alpha, and
  AudioContext resume - no gameplay handling. A full run is ~13 minutes
  of uninterrupted real-time action (47,416 zhaoyun ticks), so an
  unpausable session is a concrete gap. No prior pause task or rejection
  in TASKS.md/PROGRESS.md. Filed ENH-7 (TODO, P key + overlay +
  tick-neutral resume, full gates). Non-goals exclude a pause menu,
  auto-pause on tab blur (owner behavior decision), a touch button
  (stated follow-up), and any DIFF-1 impact.
- Rejected/not pursued: no defect proposals (signals green, frames
  clean); one-area budget spent, no second area inspected.
- Files changed: TASKS.md (ENH-7 TODO), PROGRESS.md,
  artifacts/loop/proposals-20260921-2038-pause.md (gitignored scratch).
- Commit: local commit denied - the host gives read-only access to .git
  (git add fails: Unable to create index.lock, Permission denied), same
  as the ENH-4/5/6 iterations. Both files verified and left uncommitted
  in the working tree; no permissions weakened, nothing pushed. Owner
  commits when ready.
- Verification run: both suites via cmd /c npm.cmd (PowerShell blocks
  npm.ps1 on this host). Both runners lingered after the final ok with
  no summary line (known host behavior); each stopped with Ctrl-C to its
  own session only after all results were observed. Port 5177 free
  afterwards (no listener). No game source touched in this pass.
- Result: COMPLETED - one accepted proactive proposal, no regression.
- Status after: producer pass; queue now 20 DONE + DIFF-1 BLOCKED +
  ENH-7 TODO.
- Remaining work or blocker: DIFF-1 still BLOCKED on the owner;
  standing owner items unchanged (visual/play test, deploy).
- Next recommended task: ENH-7 (a later consumer implements it).

- Housekeeping (same iteration, rule 8): none needed. DONE count is 20
  (at the bound, ENH-7 is TODO); PROGRESS.md was 432 lines, stays under
  500 with this entry.

### 2026-09-21 19:15 - ENH-6 (attempt 1)

- Status before: ENH-6 TODO, dependency satisfied (ENH-5 DONE). No prior
  ENH-6 attempts. Tree clean: owner committed ENH-4/5 as 956e0f4.
- Work completed: the ENH-6 validation slice in e2e/anim.spec.ts only (no
  src/, art, threshold, or config change). Part 3 now expects Zhao Yun's full
  triple (attack, attack2 AND thrust), the strike predicate covers all five
  strike suffixes (attack/attack2/thrust/chop/sweep) while withdrawn stays
  windup/recover (still shared), loop budget 200->300 ticks so the finisher
  is reached. New Part 4 per-hero combo test drives all five heroes
  tick-dense and asserts each renders its STRIKE_POSE triple (gy
  sweep/attack/chop, zf thrust/attack2/sweep, zy attack/attack2/thrust, hz
  thrust/chop/sweep, wy attack/sweep/chop), the five ordered triples pairwise
  distinct, plus the requirement in words: zhangfei shows thrust, guanyu
  shows sweep and chop. Marked all four ENH-6 criteria [x] and the task DONE.
- Marathon before/after (ENH-4 baseline -> this run; ticks/continues):
  guanyu s1 2640/0c -> 2640/0c, s2 4944/0c -> 4944/0c; zhangfei s1 2640/0c ->
  2640/0c, s2 2832/0c -> 2832/0c; huangzhong s1 3972/1c -> 3972/1c, s2
  6588/3c -> 6588/3c; weiyan s1 4056/1c -> 4056/1c, s2 2916/0c -> 2916/0c;
  zhaoyun 9-stage 3324,3576,4224,8988,4956,4440,5136,8100,6672 with continues
  0,0,1,3,1,0,1,3,2 (total 11) -> identical. Every stage mean shifts 0%,
  no >15% flag. DIFF-1 stays BLOCKED.
- Verification run: lint clean; typecheck clean; unit 188/188 (26 files);
  e2e 45/45 (44 + new per-hero test: 27.4s standalone, 40.8s in full suite;
  Part 3 retitled, 4.9-6.5s); vision 5/5 - frames 9/9, sprites 256/256,
  weapons 85/85, retracts 170/170, parity clean all 7 screens, both negative
  controls failing correctly, HUD 1/1, findings.jsonl 0 bytes; prodbuild
  4/4; signal 13/13, zero violations/page errors, every marathon above.
  Runner note: browser suites lingered after the last ok with no summary
  (known behavior); each stopped with Ctrl-C to its own session only after
  results observed. Ports verified free afterwards. npm via cmd /c npm.cmd.
- Eye review (all judged by eye at 1:1 gameplay pixels): one-off capture
  script (artifacts/loop/enh6-combo-capture.mjs, gitignored) screenshotted
  each hero's three strikes in situ, desktop 1280x720 + phone 390x844 - 30
  frames, deterministic ticks identical across devices (e.g. gy 9/36/67, zf
  6/24/47). Contact sheets combo-sheet-desktop/phone-enh6combo.png tile 1:1
  crops (5 heroes x 3 strikes). Masked attribution: hiding names, row 1
  reads crescent glaive (low cut, level cut, overhead chop), row 2 wavy
  serpent pike (deep thrust-first lunge), row 3 straight spear
  (all-thrust family), row 4 recurve bow as staff (limbs+string in all
  three), row 5 broad dao (level, low, overhead chop). Phone size keeps
  every pose distinguishable, HUD readable. No clipping, no weapon over a
  face anywhere. Full frames also viewed (zf thrust desktop, gy chop phone).
- Result: all acceptance criteria met. No DIFF-1 impact - DIFF-1 stays
  BLOCKED. No thresholds weakened (git diff touches only the e2e spec).
- Status after: ENH-6 DONE. Queue holds 20 DONE + DIFF-1 BLOCKED; no TODO
  or IN_PROGRESS remains.
- Remaining work or blocker: none for this task.
- Next recommended task: none available without the owner (producer pass
  when driven; standing owner items: visual/play test, deploy).

- Housekeeping (same iteration, rule 8): 21 DONE exceeded the 20-task
  bound, so oldest DONE ART-1 (foundational face task, lowest number of the
  chronological ART series; completion order by content, archives unread)
  moved to TASKS-ARCHIVE.md end (DONE now 20); PROGRESS.md would pass 500
  lines, so oldest two finished entries (Sep-20 10:20 + 11:10 producer
  passes) moved to PROGRESS-ARCHIVE.md top (now ~460 lines). Latest signal
  snapshot (this entry) and DIFF-1 BLOCKED evidence (TASKS.md) kept.
  One-off capture/sheet scripts and 32 PNGs live under gitignored
  artifacts/ and are not committed.
  Commit: local commit denied - the host gives read-only access to .git
  (git add fails: Unable to create index.lock, Permission denied), same as
  the ENH-4/ENH-5 iterations. This iteration's 5 files verified and left in
  the working tree uncommitted; no permissions weakened, nothing pushed.
  Owner commits when ready.

### 2026-09-21 17:30 - ENH-5 (attempt 1)

- Status before: ENH-5 TODO with its ENH-4 dependency satisfied (no prior
  ENH-5 attempts). Tree holds ENH-4's still-uncommitted changes (commit denied
  last iteration, read-only .git) plus this task's work.
- Work completed: three new shared strikes in src/game/art/poses.ts - THRUST
  (deep lunge, weapon dead level, rot -0.05), CHOP (high-to-low cut on a steep
  -0.65 diagonal, grip 0.35, hands forward), SWEEP (low crouch, weapon
  level-low, rot +0.1). STRIKE_POSE repointed to 15 explicit entries; triples:
  gy (sweep,attack,chop), zf (thrust,attack2,sweep), zy (attack,attack2,thrust),
  hz (thrust,chop,sweep), wy (attack,sweep,chop) - each internally distinct,
  all five ordered triples pairwise different. Zhaoyun keeps attack+attack2 so
  the e2e combo test (which ENH-6 owns, not this task) still observes both.
  POSE_REACH calibrated by measurement, no fallback: thrust 65, chop 30,
  sweep 61 (ceil of 64.5/29.5/61.0, Zhang Fei's pike driving all three).
  Registered in POSES; strike lists extended in artquality AND the vision live
  gate; 18 new distinctness PAIRS (each new strike vs idle, windup, recover,
  both historical strikes, both new siblings); counts 11->14 poses
  (artquality, weapons 17*14*2=476 face cases, vision 18*14+4=256 sprites,
  reach (18-1)*5, retract (18-1)*5*2). weapon-review pose-sweep covers 14.
  No frame-data, threshold, floor, HEADROOM, or enemy-mapping change.
- Calibration story: first run 42/43 focused - zhangfei:thrust clipped right
  (reach 64.5 vs margin 65, bound pixel exactly on the edge) and lidian:chop
  touched the frame top at exactly 27.0. Thrust margin set to ceiling 65;
  chop redrawn (grip 0.32->0.35, hands down 1u) to top 24.5, reach 29.5,
  margin 30. In-browser geometry confirms: thrust 65, chop 30, sweep 61,
  headroom 25 (lidian:chop), faceOverlaps [], old reaches byte-identical.
- Falsification (both reverted after): THRUST aliased to ATTACK joints fails
  distinctness with "guanyu: the thrust pose is the attack pose again" (0 vs
  floor 0.15); gy.jab1 pointed at attack fails the triple test. Both gates
  proven able to fail.
- Verification run: lint clean; typecheck clean; unit 188/188 (26 files);
  e2e 44/44 incl. anim Part 3 over the remapped strikes; vision 5/5 -
  frames 9/9, sprites 256/256, weapons 85/85, retracts 170/170, parity clean
  all 7 screens, both negative controls failing correctly, HUD 1/1,
  findings.jsonl 0 bytes; prodbuild 4/4; signal 13/13 with every marathon
  tick-identical to the ENH-4 table (zero sim impact: guanyu 2640/4944,
  zhangfei 2640/2832, huangzhong 3972+1c/6588+3c, weiyan 4056+1c/2916,
  zhaoyun 9-stage as recorded); build ok. Runner note: browser suites' host
  processes lingered after the last ok with no summary (known behavior);
  each stopped with Ctrl-C to its own session only after results observed.
  Ports 5176/5177/4321 verified free afterwards. npm via cmd /c npm.cmd.
- Eye review (all judged by eye at gameplay size): pose-sweep right+left
  (5 heroes x 14 poses, both facings), chop zoom plate (all five read as a
  steep high-to-low cut), desktop sequence + full-size strikes (zf thrust,
  gy sweep, hz thrust, zf before-vs-after showing the deeper lunge),
  phone sequence + full-size phone strike, facesheet (portraits unchanged at
  all sizes). No clipping, no weapon over a face anywhere. Untouched poses
  render byte-identically (idle/windup/recover/title before/after sizes
  equal; zy/wy jab1 strikes identical since their mapping keeps attack).
- Result: all acceptance criteria met. No DIFF-1 impact - DIFF-1 stays BLOCKED.
- Status after: ENH-5 DONE. ENH-6 dependency ("waiting on ENH-5") now satisfied.
- Remaining work or blocker: none for this task.
- Next recommended task: ENH-6 (last TODO; validates the movesets end to end).

- Housekeeping (same iteration, rule 8): 21 DONE exceeded the 20-task bound,
  so oldest DONE FLAKE-2 (completed 2026-09-16 10:30, oldest by PROGRESS
  dates) moved to TASKS-ARCHIVE.md end (DONE now 20); PROGRESS.md passed 500
  lines, so oldest two finished entries (ART-13, ART-12) moved to
  PROGRESS-ARCHIVE.md top (now 408 lines). Latest signal snapshot (this
  entry's ENH-4-identical marathon tables) and DIFF-1 BLOCKED evidence kept.
  Commit: local commit denied - the host gives read-only access to .git
  (git add fails: Unable to create index.lock, Permission denied), same as
  the ENH-4 iteration. ENH-5's 12 files verified and left in the working
  tree uncommitted alongside ENH-4's; no permissions weakened, nothing
  pushed. Owner commits when ready.
