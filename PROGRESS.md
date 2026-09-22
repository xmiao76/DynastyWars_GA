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

### 2026-09-21 15:35 - ENH-4 (attempt 1)

- Status before: ENH-4 IN_PROGRESS (status flip plus new/updated tests were
  pre-existing uncommitted working-tree state; no prior ENH-4 PROGRESS entry,
  so this is attempt 1). src/ still on the old shared frame tables.
- Work completed: implemented the three ENH-4 source changes the staged tests
  pin down. (1) `src/core/attacks.ts`: replaced the shared-frame
  `defineHeroAttacks` (jabs 6/4/10, finisher 8/5/16) with per-hero
  weapon-true combo hits — gy slow wide 8/5/14 + 12/6/22 knockdown finisher,
  zf long narrow 5/4/9 thrusts (reach 32/34/36) + 10/6/18 sweep, zy fastest
  5/3/8 + 7/4/13, hz compact 6/4/10 + 8/5/14, wy heavy 9/5/14 + 13/6/18.
  Jump kicks, specials (incl. hz inert draw), mounted sweep and all enemy
  defs byte-identical. (2) `src/game/adapters/sprites.ts`: new exported
  `STRIKE_POSE` table keyed by full attack id (five jab2→attack2, matching
  old behavior); `poseForEntity` looks the table up instead of the
  `.jab2`-suffix test, enemies/mounted/unknown still fall back to attack.
  (3) `selfplay/bot.ts`: new `spacingDef(charId, mounted)` helper; both
  call sites (enemy + crate spacing) now use the DRIVEN hero's own
  `combo[0]` def instead of hard-coded `zy.jab1`; mounted still uses the
  spear sweep. Marked all six ENH-4 criteria [x] and the task DONE.
- Files changed: `src/core/attacks.ts`, `src/game/adapters/sprites.ts`,
  `selfplay/bot.ts`, `TASKS.md` (criteria + DONE), `PROGRESS.md`.
  Adopted (not authored here) the staged tests: new
  `test/core/movesets.test.ts` (6 tests incl. live ±10% DPS check),
  `test/core/bot-spacing.test.ts` (3), plus updated characters/items/
  mobility/sim/sprites expectations. No `sim.ts` changes (data only).
- Verification run:
  - Fail-proof on OLD src (before editing): new tests failed 5/9
    (movesets pin/chain/reach, bot guanyu/huangzhong spacing) and updated
    tests failed 7/32 (characters, items 12-vs-10, mobility [12,8]-vs-[10,10],
    sim 3-vs-4 hits, sprites phasing x2 + missing STRIKE_POSE) — every new
    assertion proven able to fail.
  - BASELINE `npm run signal` on old src, 13/13 ok, zero violations/errors:
    guanyu s1 2556t/0c s2 2964t/0c; zhangfei s1 2496t/0c s2 3240t/0c;
    huangzhong s1 3432t/0c s2 5472t/2c; weiyan s1 2544t/0c s2 3024t/0c;
    zhaoyun 9-stage ticks 3540,3756,5508,5400,4308,5172,5148,7956,6708 with
    continues 0,0,2,1,1,0,1,2,2 (total 9, the known DIFF-1 shape).
  - AFTER fix: `npx.cmd vitest run` 188/188 (26 files); `npm.cmd run
    lint` clean; `npm.cmd run typecheck` clean; `npm run signal` again
    13/13 ok, zero violations/errors: guanyu s1 2640t/0c s2 4944t/0c;
    zhangfei s1 2640t/0c s2 2832t/0c; huangzhong s1 3972t/1c s2 6588t/3c;
    weiyan s1 4056t/1c s2 2916t/0c; zhaoyun 9-stage ticks
    3324,3576,4224,8988,4956,4440,5136,8100,6672 with continues
    0,0,1,3,1,0,1,3,2 (total 11).
  - Balance deltas RECORDED, not chased (ENH-4 non-goal; ENH-6 owns the
    >15% gate): guanyu s2 +67% ticks, weiyan s1 +59% ticks +1c, huangzhong
    +1c/+1c, zhaoyun s4 5400→8988t (1→3c) but s3 faster 5508→4224t (2→1c).
    Every marathon still completes; bot viable with all five heroes.
  - Runner note: both signal runs' processes stayed alive after the 13th
    "ok" with no summary line (known host behavior); each was stopped with
    Ctrl-C to its own session only, after all results were observed. Port
    5177 afterwards shows TIME_WAIT only, no listener. npm run via
    `cmd /c npm.cmd` (PowerShell blocks npm.ps1 on this host).
  - Extra diligence (not in ENH-4 acceptance, which ENH-6 re-gates): e2e
    44/44 ok incl. the timing-sensitive anim combo test; the new frame
    data did not break combat timing gates. Vision/prodbuild left for ENH-6
    (no art, rendering, or build-config change here).
- Result: all acceptance criteria met. No new poses/art gates (ENH-5),
  no DIFF-1 retuning — DIFF-1 stays BLOCKED.
- Status after: ENH-4 DONE. ENH-5 dependency ("waiting on ENH-4") now
  satisfied; ENH-6 still waits on ENH-5.
- Remaining work or blocker: none for this task.
- Next recommended task: ENH-5 (first TODO; consumer implements the three
  strike poses + art gates in a later iteration).

- Housekeeping (same iteration, rule 8): 21 DONE exceeded the 20-task bound,
  so oldest DONE FIX-5 moved to TASKS-ARCHIVE.md (DONE now 20); PROGRESS.md
  exceeded 500 lines (584), so oldest three finished entries (ART-11, ART-10,
  Sep-19 producer pass) moved to PROGRESS-ARCHIVE.md top (now 474 lines).
  DIFF-1 stays BLOCKED in TASKS.md; the ART-10 "src/core unchanged" note is
  superseded by this task's attacks.ts data change and ENH-6 will re-measure.
  Commit: local commit denied — the host gives read-only access to .git
  (git add fails: Unable to create index.lock, Permission denied). All 14
  iteration files verified and left in the working tree uncommitted; no
  permissions weakened, nothing pushed. Owner commits when ready.

### 2026-09-21 02:55 - PRODUCER PASS (signals + frame sweep, attempt 1)

- Status before: queue holds only DIFF-1 (BLOCKED on an owner decision) + 20
  DONE. No IN_PROGRESS or TODO. First GA producer pass after MIGRATION-GA.
- LOGIC signal: 'npm run signal' observed 13/13 ok, zero invariant violations
  and zero page errors across idle, co-op, seeds, weapon, perf and all five
  marathons (incl. nine-stage zhaoyun: continues 0,0,2,1,1,0,1,2,2 - the known
  DIFF-1 standing shape, not a new finding). No regression.
- VISUAL signal: 'npm run vision' observed 5/5 ok. All 9 screens pass at the
  same levels as the ART-15 snapshot (game_combat colorRichness 1038, same as
  prior pass; static screens unchanged). Sprite gate 202/202, weapons 34/34,
  retracts 68/68, renderer parity clean on all 7 screens, both negative
  controls still failing correctly (empty-backdrop on shape, flat silhouette
  on shading), HUD 1/1. 'findings.jsonl' empty (0 bytes). No UX_REVIEW.md.
- Frame sweep, 8 images covering all 9 screens judged by eye: title lineup,
  select portraits, idle, both combats, boss night scene, result, game over,
  complete. NO DEFECT: the five ART-15 weapons read in situ, no clipping, no
  weapon over a face, HUD readable, portraits distinct. Bounded opportunity
  review (visual presentation) found no justified gap, so no proposal filed.
- Limitation, stated plainly: both suites' runner processes did not exit on
  their own after the last test passed (60-120s of silence, no summary line)
  and were stopped with Ctrl-C; every individual test result was observed
  passing first. PowerShell also refuses npm.ps1 under this host's execution
  policy, so both suites ran via cmd.exe. Neither affects the green verdict.
- Proposals: none. No scratch file written; TASKS.md untouched.
- Files changed: 'PROGRESS.md' (uncommitted: local commit denied - the host
  gives read-only access to '.git', so 'git add' cannot create 'index.lock'.
  Recorded without weakening host permissions; never pushed.)
- Result: IDLE - NO NEW FINDINGS. No game source touched.
- Status after: n/a - producer pass.
- Remaining work or blocker: DIFF-1 BLOCKED on an owner design decision;
  standing owner items unchanged (local visual/play test, deploy).
- Next recommended task: none available without the owner.

### 2026-09-20 21:04 - MIGRATION-GA (owner-requested infrastructure, attempt 1)

- Status before: copied CX HEAD 707fece; ART-15 DONE, DIFF-1 BLOCKED, no ready task.
- Work completed: verified 493 copied files; preserved independent GA Git and
  unchanged game/queue/archives. Moved canonical instructions to AGENTS.md/.loop;
  added model-neutral Node adapters/runner, strict final results, crash locks,
  persistent error pause, bounded delays, and opt-in finite Windows scheduling.
- Owner approved at most one evidence-backed proactive enhancement per producer
  pass within PROJECT.md; separate consumers implement it. DIFF-1 remains blocked.
- Isolation: GA dev/browser/production ports 5176/5177/4321; owner-only deployment
  targets dynasty-wars-ga/main. No source project, game behavior, or gate weakened.
- Verification: npm ci PASS (140 packages), lint/typecheck PASS, unit 178/178,
  e2e 44/44, logic signal 13/13 (all five marathons including nine-stage Zhao Yun),
  visual 5/5 (nine frames, sprites 202/202, weapons 34/34, retracts 68/68,
  seven-screen Canvas/WebGL parity, both negative controls, HUD 1/1), prodbuild 4/4.
- Offline tooling: runner 20/20, scheduler 35/35, deployment 11/11; runner timeout
  and cancellation tree cleanup verified; all fake processes collected. Windows
  COM accepted scheduler XML and normalized ownership parsing in memory only.
- Reviewed regenerated WebGL title/combat screenshots: content and HUD visible;
  this is a limited migration spot-check, not a new all-frame gameplay review.
- Limitations: confined npm-cache and Vite/Playwright process access needed approved
  execution. Unattended provider/host permissions require supervised validation.
- Result: GA migration verified. No real model job, schedule installation, cloud
  action, deployment, push, or migration commit. Default adapter remains unset.
- Status after: original task statuses unchanged; 229 game/queue/archive files
  hash-identical; source 493-file snapshot and HEAD unchanged. Details:
  docs/MIGRATION-GA.md; setup docs/LOOP_ENGINEERING.md; docs/SCHEDULING.md.
- Next action: owner reviews/checkpoints migration, then manual .loop/continue.md
  or configures a trusted adapter and supervises one iteration before scheduling.

### 2026-09-20 18:44 - PRODUCER PASS (post-ART-15 signals + frame sweep)

- Status before: queue holds only DIFF-1 (BLOCKED on an owner decision) + 20
  DONE. ART-15 committed and green.
- LOGIC signal: `npm run signal` 13/13 green, zero invariant violations and
  zero page errors across idle, co-op, seeds, weapon, perf and all five
  marathons. No regression. The zhaoyun 9-stage marathon (continues
  0,0,2,1,1,0,1,2,2) reproduces DIFF-1's standing shape, which is the known
  blocked item, not a new finding.
- VISUAL signal: `npm run vision` 5/5 green. All 9 screens pass at the same
  levels as the ART-15 snapshot (static screens byte-identical; combat/idle
  colorRichness within run-to-run jitter, e.g. game_combat 1021->1038).
  Sprite gate 202/202, weapons 34/34, retracts 68/68, renderer parity clean
  on all 7 screens, both negative controls still failing correctly
  (empty-backdrop on shape, flat silhouette on shading), HUD 1/1.
  `findings.jsonl` empty (0 bytes). No UX_REVIEW.md note on file.
- Frame sweep, all 9 judged by eye: title lineup, select portraits, idle,
  both combats, boss night scene, result, game over, complete. NO DEFECT:
  the five ART-15 weapons read in situ (crescent asymmetric, serpent
  S-curved with hanging tassel, spear towering, dao broad, bow strung), no
  clipping, no weapon over a face, no palette surprises.
- Proposals: none. No scratch file written; TASKS.md untouched.
- Files changed: `PROGRESS.md`.
- Result: IDLE - NO NEW FINDINGS. No code touched; tree unchanged from
  c2b3753 where every suite was green.
- Status after: n/a - producer pass.
- Remaining work or blocker: DIFF-1 BLOCKED on an owner design decision;
  standing owner items unchanged (local visual/play test, deploy).
- Next recommended task: none available without the owner.
