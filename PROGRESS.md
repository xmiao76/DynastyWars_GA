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

### 2026-09-20 13:56 - ART-15 (attempt 1, approved five-hero scope)

- Status before: IN_PROGRESS. The owner approved legend-faithful silhouettes
  within the existing character style for all five heroes.
- Work completed: extracted shared weapon paths; redrew guandao, serpent
  spear, spearhead, dao and recurve bow; added restrained blade facets and a
  continuous bowstring. Corrected bow/prone grips to keep weapons off faces.
  Raised shared headroom from 24 to 27 based on measured top reach, retaining
  standH, displayed character scale, combat data, assignments and timing.
- Regression evidence: four new checks failed on the original shapes. Exact
  pre-fix paths remain negative controls. A continuity check also caught and
  now rejects a disconnected bowstring. All 374 cast/pose/facing combinations
  keep weapons clear of faces, and existing clipping/reach/tassel gates pass.
- Visual review: matching baseline 1e5e3f4 and final sheets; all five heroes
  across 11 poses in both facings; desktop/phone idle and attack sequences.
  The guandao is pointed and asymmetric, the serpent narrow and undulating,
  the spear ridged, the dao elongated/angled, and the bow visibly strung.
  Evidence and reproducible capture commands: docs/WEAPON_ART.md.
- Verification: lint, typecheck and unit 178/178; e2e 44/44; signal 13/13;
  vision 5/5 including renderer parity and both negative controls; prodbuild
  4/4 including the production build. No thresholds weakened. An earlier
  exploratory browser run was interrupted by a Vite source reload; the full
  suite was rerun successfully with source held unchanged.
- Status after: ART-15 DONE. Older completed queue/history entries archived
  under the repository's size limits. DIFF-1 remains BLOCKED for the owner.
- Remaining work: owner local visual/play test. No deployment or push occurred.
- Next recommended action: npm run dev at http://localhost:5174; inspect
  artifacts/weapon-review/weapon-shapes-after.png and the matching before image.

### 2026-09-20 - MIGRATION-CX (owner-requested framework migration)

- Status before: copied working snapshot from DynastyWars on 2026-09-20 at
  approximately 12:17 America/Los_Angeles; ART-15 IN_PROGRESS, DIFF-1 BLOCKED.
- Work completed: replaced the Claude framework with AGENTS.md, Codex project
  configuration/rules, consumer/producer/continuation prompts, and a bounded
  manual CLI runner with model/provider options and overlap protection.
  Deployment remains owner-only through deploy.bat, fixed to dynasty-wars-cx
  on production branch main. Isolated dev/test/production ports are 5174/5175/4320.
- Preserved game source and unfinished queue from the copy snapshot. The source
  loop remained active and changed afterward; no later edits were synchronized.
  Two inherited temporary art probes received only a concrete context type and
  output-directory creation so lint and a clean checkout work.
- Verification: npm ci; lint and typecheck PASS; unit 165/165 (adjusted probes
  also 2/2 on rerun); e2e 44/44; signal 13/13; vision 5/5 including renderer
  parity and both negative controls; prodbuild 4/4 including the fresh build;
  offline runner 15/15 and deployment script 8/8; script syntax and diff checks.
- Result: copied project and Codex framework ready for owner local testing.
  A local migration checkpoint is saved after this entry. No push, cloud
  creation/deployment, scheduler activation, or real model iteration was run.
- Limitation: Windows sandbox startup returned error 1058 in this host session.
  Checks used approved host execution. Supervise the first real Codex run before
  starting repeated unattended iterations; no sandbox bypass was introduced.
- Status after: ART-15 remains IN_PROGRESS; DIFF-1 remains BLOCKED. Their task
  content/status and the historical archives are preserved.
- Next action: owner runs npm run dev and tests http://localhost:5174, then
  uses FIRST_RUN_PROMPT.md or .codex/continue.md. See docs/MIGRATION.md and
  docs/LOOP_ENGINEERING.md for provenance, provider setup and verification.

### 2026-09-20 13:05 - PRODUCER PASS (the redrawn silhouettes in situ)

- Status before: ART-14 committed and green. The plates were judged by eye and
  the swing captures taken, but the vision frames had not been swept since the
  silhouettes changed.
- NO DEFECT:
    boss_fight       Xu Chu's crescent now shows the 偃月 profile at boss scale -
                     straight back edge, the back spike, the forward-swept
                     point, red tassel at the socket. The one frame that proves
                     the asymmetric silhouette reads at the size the game draws
                     a boss, not just on a plate
    title            all five heroes read: Guan Yu's asymmetric crescent,
                     Zhang Fei's serpent undulating above his head, Zhao Yun's
                     leaf, Huang Zhong's recurve, Wei Yan's broad dao
    game_combat_zf   the serpent's S-curve is unmistakable in the running game,
                     tassel hanging
  No clipping at any frame edge, no weapon over a face, no palette surprises.
- Files changed: `PROGRESS.md`.
- Verification run: the sweep itself. No code touched; tree unchanged from
  d28751c where every suite was green.
- Result: no defect. The reference silhouettes hold at every size the frames
  cover, including the boss scale no plate had shown them at.
- Status after: n/a - producer pass. ART-14 remains DONE.
- Remaining work or blocker: DIFF-1 BLOCKED on an owner decision; standing
  owner items unchanged (look at the game, delete node_modules.stuck/, deploy).
- Next recommended task: none available without the owner.

### 2026-09-20 12:30 - ART-14 (attempt 1)

- Status before: ART-13 committed. Owner's THIRD weapons report: the
  silhouettes are still wrong - naming 张飞's serpent, 关羽's crescent and
  魏延's dao, plus "all of them roughly equally". They did NOT flag Zhao Yun's
  spear or Huang Zhong's bow.
- Diagnosis from reference sources rather than from my own taste: fetched
  Wikipedia's guandao article and re-rendered all five heroes large plus a
  weapon-only extraction. Three errors, each a wrong assumption in my own
  ART-12/13 paths:
    - crescent: I drew a SYMMETRIC two-pronged crescent - horn and flare both
      at fore+13, both pointing forward. The reference is a STRAIGHT back edge
      with a small spike pointing BACK toward the shaft and a convex edge
      sweeping forward to the point; "a heavy blade with a spike at the back"
    - serpent: amplitude ~4.5, so it read as a leaf with a kink rather than a
      snake. Now +-10, and the blade runs fore-6..fore+22
    - dao: a rounded dome tip and a circular belly. Now a straighter spine to
      an ANGLED corner point (the first redraw of the tip still read round, so
      the wedge was sharpened with a straight back segment into the corner)
  Also redrew the ji's wings as FORWARD crescents (the classic orientation),
  for the "all of them" half of the report.
- Measured with the calibrated probe (per-kind dump, so the drivers are known
  rather than inferred): Zhang Fei's serpent now drives attack (59), attack2
  (41) and special (59); the others sit below. windup/recover/jump/hurt each
  came in 1-2 UNDER the previous table because the new crescent's horn is
  shallower than the old -20. The serpent tip was first drawn to fore+25 and
  measured 26 units above the pose space in walk0 against a 24-unit HEADROOM -
  it clipped, so the tip came back to fore+22 and HEADROOM stayed shared.
  Two clipping failures (zhangfei:attack, zhangfei:special) were exactly the
  stale-margin case, fixed by setting the table from the measurement.
- Files changed: src/game/art/draw.ts, registry.ts, TASKS.md, PROGRESS.md.
- Verification run: lint, typecheck, unit 163/163, e2e 44/44 (gamepad spec
  failed once under contention, passed 4/4 alone, full re-run clean), vision
  5/5 (202/202 sprites, 34/34 weapons, 68/68 retracts, parity), prodbuild 4/4,
  signal 13/13, build. In-situ swing captures at real render size for Guan Yu
  and Zhang Fei (artifacts/insitu14-*.png): the wavy serpent blade and the
  asymmetric crescent both read at game size with the tassel hanging. Both
  falsifications re-proven after the redraw: tassel draw off -> gate fails
  0-2 px; walk1 rot -1.5 -> head-cross fails on 5+ kinds.
- Result: all green. The three named silhouettes are redrawn to their
  reference profiles.
- Remaining work or blocker: DIFF-1 still BLOCKED on the owner's call. Stated
  plainly in the task entry rather than hidden: at in-game size these are
  still cel cutouts - the reference weapons also carry a butt counterweight, a
  socket collar and rings, which this round deliberately did not add because
  the owner identified silhouette, not missing details. If the report comes
  back a fourth time, the right move is a side-by-side reference-image
  comparison with the owner, not another guess.
- Next recommended task: none available without the owner.

### 2026-09-20 11:10 - PRODUCER PASS (the phased attacks, in situ)

- Status before: ART-11/12/13 all green, and the vision frames swept. But the
  one view nobody had taken was the ATTACK ANIMATION IN MOTION in the running
  game: ART-11's phases were verified by texture-key sampling plus static
  sheets, and the weapons changed shape afterwards - no frame had ever shown
  windup/strike/recover with the ART-13 spear and dao.
- Captured all four phases mid-swing in the live game (temp spec: mash attack
  one tick at a time, screenshot when the player's texture key reaches each
  new phase; deleted after). 8 frames, two heroes:
  NO DEFECT:
    zhaoyun  windup cocked with the point towering / attack driven forward /
             attack2 high thrust / recover visibly retracted - the whole
             ART-11 cycle readable in the game the owner plays
    weiyan   same cycle with the broad dao; the tassel hangs at the socket in
             every phase
  No clipping at any frame edge, no weapon over the face, no unreadable mass.
- Two selector notes from building the probe: the hero must be found by
  `entity:<hero>:` prefix - taking the first `entity:` sprite finds a soldier -
  and the pass had to be driven a tick at a time because `run()` queues every
  input before the frame renders.
- Files changed: `PROGRESS.md`.
- Verification run: the capture itself. No code touched, tree unchanged from
  00a682f where every suite was green.
- Result: no defect. The attack animation and the new weapons work together
  in situ.
- Status after: n/a - producer pass.
- Remaining work or blocker: DIFF-1 BLOCKED on an owner decision; standing
  owner items unchanged (look at the game, delete node_modules.stuck/, deploy).
- Next recommended task: none available without the owner.

### 2026-09-20 10:20 - PRODUCER PASS (the new weapons in situ)

- Status before: ART-13 committed and green. The weapon sheets were judged by
  eye, but no frame of the RUNNING game had been looked at since.
- Swept the fresh vision frames (all regenerated post-ART-13):
  NO DEFECT:
    title            all five heroes' new weapons read on the line-up
    game_combat      Zhao Yun's pointed leaf towers, tassel hanging - the exact
                     frame the owner's complaint screenshot came from, now
                     fixed in situ
    game_combat_zf   the serpent tip reads above Zhang Fei's head, tassel down
    boss_fight       Xu Chu's crescent + tassel reads at boss scale; soldier
                     jians' disc guards visible
  No clipping, no face overlap, no palette surprises in any frame.
- Files changed: `PROGRESS.md`.
- Verification run: the sweep itself; no code touched, tree unchanged from
  749fda9 where every suite was green.
- Result: no defect. The weapons work at every size the frames cover.
- Status after: n/a - producer pass. ART-13 remains DONE.
- Remaining work or blocker: DIFF-1 BLOCKED on an owner decision; standing
  owner items unchanged (look at the game, delete node_modules.stuck/, deploy).
- Next recommended task: none available without the owner.

### 2026-09-20 09:40 - ART-13 (attempt 1)

- Status before: ART-12 committed. Owner re-tested: the spear and the big
  knife STILL do not read as real weapons.
- Diagnosis on the owner's own evidence (the in-game combat frame): the
  spearhead was a symmetric pale OVAL - an ellipse has no point anywhere, so
  it read as a spoon on a stick - and its tip sat at Zhao Yun's CHIN in idle
  carry, where a real spear towers over its wielder. The dao was a small
  rounded paddle, under two thirds of the crescent's visual weight. And the
  tassels pointed wherever the weapon pointed, because they were drawn in the
  weapon's rotated frame - at idle carry the 红缨 stuck out sideways-forward.
- Work completed: Willow-leaf spearhead (pointed both ends, 26x8, midrib
  crease 2.6 wide because the ink stroke eats 0.85 per side), ending at
  fore+22 so the point towers ~10 units above the pose space in idle. Dao
  broadened to a 26-span single-edged blade. Dao gained the 红缨 (tassel gate
  count 11 -> 12; folk 大刀 carry it). Tassel now drawn in a gravity-aligned
  frame - translate to socket, counter-rotate by -weaponRot, hang +y - so it
  droops along the haft at idle and swings below the shaft at thrust, at every
  pose, mirror-safe under flipX.
- THE GATE THAT EARNED ITS KEEP: the first broadened dao failed the ART-7-era
  face-on-skin gate - "weiyan:idle: the brow has 140,143,156 above it, not
  skin". The spine curve's quadratic control point had pulled the blade
  across Wei Yan's forehead at idle carry. Fixed by the crescent's own rule
  (visible in its geometry all along): keep the DEEP span at the tip end,
  where the shaft has already leaned clear of the head; shallow spine heel.
  A rendering defect no eye pass had caught in ART-12's sheets, caught by a
  gate in 7 seconds.
- Files changed: src/game/art/draw.ts, figures.ts (one line),
  test/game/artquality.test.ts (count 12 + dao joins the tassel loop),
  TASKS.md, PROGRESS.md.
- Verification run: lint, typecheck, unit 163/163, e2e 44/44 (gamepad spec
  failed once under contention, 4/4 alone - the documented flake), vision 5/5
  (202/202 sprites, 34/34 weapons, 68/68 retracts, parity), prodbuild 4/4,
  signal 13/13 (weapon spec failed once under contention, passed alone, then
  the full suite re-run clean 13/13), build. Calibrated POSE_REACH probe: the
  ART-12 table holds EXACTLY (attack 55, attack2 39, windup 9, recover 19,
  jump 20, down 27, hurt 9, special 54; tops unchanged) - the spear tip and
  dao span extensions fit inside every existing margin, as computed. Sheets +
  zoom plates judged by eye (artifacts/weaponsheet13.png, zoom13.png): spear
  reads as a pointed blade towering over its wielder, dao reads single-edged,
  tassels hang, Guan Yu regression row unchanged, portrait slivers read as
  intentional framing. Falsified by disabling the tassel draw: gate fails
  0-2 px against the 30 floor.
- Result: all green. Queue: only DIFF-1 BLOCKED + 19 DONE.
- Remaining work or blocker: DIFF-1 still needs the owner's call; standing
  owner items unchanged (look at the game, delete node_modules.stuck/, deploy).
- Next recommended task: none available without the owner.

### 2026-09-20 06:40 - ART-12 (attempt 1)

- Status before: Queue held only DIFF-1 (BLOCKED). Owner: the heroes' weapons
  are not the weapons history describes.
- Work completed: Every weapon head redrawn to its novel/folk shape (owner
  chose the standard, and Wei Yan's 大刀, Huang Zhong keeping the bow, and Lu
  Bu's 方天画戟, by question). The old 'blade' head was a EUROPEAN CROSSGUARD -
  wrong for the setting on every wielder - now a jian with a Chinese disc
  guard. New kinds 'dao' (Wei Yan) and 'ji' (Lu Bu). Length ladder made
  story-true: the old table had Zhang Fei's pike (74) SHORTER than Zhao Yun's
  spear (78), backwards for 丈八蛇矛; now pike 82 > ji 78 > glaive 76 >
  spear 72 > dao 69 > sword 46 > bow 42. 红缨 tassels on all 11 polearm
  wielders, one fixed TASSEL red (per-character trim would have given Zhang
  Fei a gray tuft). Recurve bow with tips pinned at +/-fore - the bow carries
  the game's tightest retract margin (8.5u) and a tip drawn past the old arc
  would have shrunk it.
- The design agent's audit caught one error in my plan before any code:
  portraits DO show a weapon sliver (Guan Yu's crescent crosses his frame,
  and portrait.test.ts SAYS so), so portrait gates were in scope, not
  invisible. It also predicted hurt/down/special margins would grow ~3 from
  horn corners at positive weaponRot; measured, every pose came in at or
  UNDER the old margins instead - the old attack driver was the spear tip at
  length 78, and length 72 plus tighter envelopes beat the prediction. Also
  found recover's 26 was stale (measured before the ART-11 pose was
  finalised); now an honest 19.
- Sheets judged by eye (vision-analysed) before and after, at display size:
  after sheet v1 read well except Zhang Fei's tassel sank into his dark-red
  armour and Lu Bu's ji wings were thin - tassel brightened 0xb03028 ->
  0xc43830, wings fattened; v2 verified both fixes. Lu Bu's "asymmetric"
  wings are pose foreshortening of a mirror-symmetric local frame, not a
  defect. Sheets: artifacts/weaponsheet12.png (+ -before.png from HEAD).
- Files changed: src/game/art/figures.ts, draw.ts, palette.ts, registry.ts,
  test/game/artquality.test.ts (3 new gates), TASKS.md, PROGRESS.md.
- Verification run: lint, typecheck, unit 163/163 (the durable suite; a temp
  sheet probe briefly made it 164 and was deleted after judgment), e2e 44/44,
  vision 5/5
  (202/202 sprites, 34/34 weapons, 68/68 retracts, renderer parity),
  prodbuild 4/4, signal 13/13, build.
- Falsifications, each by reverting the mechanism: tassel draw disabled ->
  gate fails 0-1 px against floor 30 (measured 109-151 when drawn; Zhao Yun's
  red trim 0xc84a4a sits 32 from the tassel, outside the 24 tolerance, so his
  sash cannot satisfy it). walk1 weaponRot back to -1.5 -> head-cross gate
  fails on 7+ kinds (guanyu 420 vs idle 148). lubu -> 'glaive' and pike -> 74
  each fail the named-weapons gate. Probe coordinates were validated by
  printing counts before trusting the gates - the first draft probed 120px
  left of the socket (ignored the box margin/headroom translate) and PASSED
  over empty pixels; fixed and re-proven before keeping it.
- The head-cross gate is ART-8 made permanent and EXTENDED: the tassel is red,
  not steel, and a red tuft over the face is the same defect the old
  steel-only probe was blind to. Per-kind idle baselines (0-441; Zhao Yun's is
  his own steel helmet) are why it keys on each kind's own delta, and the 60px
  slack covers pose noise, not defects.
- Result: all green. Queue: only DIFF-1 BLOCKED + 18 DONE.
- Remaining work or blocker: DIFF-1 still needs the owner's call; standing
  owner items unchanged (look at the game, delete node_modules.stuck/, deploy).
- Next recommended task: none available without the owner.

### 2026-09-19 19:30 - ART-11 (attempt 1)

- Status before: Queue held only DIFF-1 (BLOCKED, owner decision). Owner
  reported continuous attacks look static - the weapon never retracts.
- Work completed: Phased every attack into windup / strike / recover, selected
  by `stateTick` against the attack's own frame data; jab2 strikes with a new
  alternate pose. Root cause was threefold: one `attack` pose covered the whole
  20-tick jab, `poseForEntity` ignored `stateTick`/`attackId`, and combo
  chaining never leaves state `'attack'`, so the texture key never changed
  between hits. New poses: WINDUP (cocked -0.8, grip 0.4), ATTACK2 (jab2 high
  thrust -0.45), RECOVER (settling -0.75, pulled in from the -0.7 sketch after
  the margin probe showed recover-vs-attack2 at 5.0u against a 4u floor; now
  8.5u). POSE_REACH measured across all 17 figure kinds: windup 11, attack2
  40, recover 26; windup top 20 vs headroom 24. A downward-cut sketch for
  ATTACK2 was rejected on paper (reach ~25 left no room for the retract gate).
  Jumpattack and special phase by the same generic rule (hz.special's
  zero-active window skips the strike with no special-casing); enemies ride
  free and their long startups read as telegraphs. No `src/core` change.
- Files changed: src/game/art/poses.ts, src/game/art/registry.ts,
  src/game/adapters/sprites.ts, test/game/sprites.test.ts,
  test/game/artquality.test.ts, e2e/anim.spec.ts, vision/vision.spec.ts,
  TASKS.md.
- Verification run: lint, typecheck, unit 160/160, e2e 44/44 (new combo Part 3
  observes all four poses + a withdrawn frame between strikes), vision 5/5
  (202/202 sprites, 34/34 weapons over both strikes, 68/68 retracts, renderer
  parity), prodbuild 4/4, signal 13/13, build. Combo strips judged by eye at
  artifacts/combo11.png (display size) and combo11b.png (2x boundary + Guan Yu
  / Huang Zhong plates): retract visible, no head occlusion, no clipping.
  Falsification, each by reverting the mechanism: RECOVER=ATTACK fails the
  retract gate (19 hits); WINDUP=ATTACK and ATTACK2=ATTACK fail distinctness
  (0.001 vs 0.15); attack=IDLE and attack2=IDLE fail reach on all 17 kinds
  (the planned handN-20 narrowing did NOT fail - reach min is 40u, so it was
  replaced, not the threshold); stubbed selection fails 5 selection tests and
  the new e2e. Live texture count 148 -> 202 (+3 poses x 18 chars; stage-scoped
  in real play, no suite slowed).
- Result: All green. Code-reviewer agent failed to launch (API 400, model
  group error); did a careful self-review of the diff instead - one comment
  nit fixed (attack2 reach 37 -> measured 40), no findings.
- Status after: ART-11 DONE. Queue holds only DIFF-1 (BLOCKED) + 17 DONE.
- Remaining work or blocker: DIFF-1 still needs the owner's smooth-vs-accept
  call; standing owner items (look at faces, delete node_modules.stuck/,
  deploy) unchanged.
- Next recommended task: None available - BLOCKED DIFF-1 needs a person.

### 2026-09-19 15:10 - ART-10 (attempt 1) + a DIFF-1 finding

- Status before: only DIFF-1 in the queue, blocked. Rather than make an unasked
  balance change, went back to the fourth defect the owner confirmed in ART-9 -
  "they don't look like the specific heroes" - which is the one that round
  addressed least.
- ONE CLEAR ERROR, live since ART-1: 关羽 Guan Yu is named for 面如重枣, 美髯
  and 卧蚕眉 - "reclining silkworm" brows, meaning THICK and curved. The
  `phoenix` row gave him `browWeight: 0.95`, the SECOND LIGHTEST of the six
  face kinds. One of the three features the sources name him for was drawn
  backwards. Now 1.32, with the steep -0.55 angle softened to -0.36 because a
  silkworm brow curves rather than slants.
- One mismatch, and labelled honestly as a judgement call rather than a
  citation: `sharp` - severe and hard - carried the lightest brow of the six at
  0.8, which reads as delicate. Now 1.06. No source describes those brows.
- Checked the other three and LEFT THEM ALONE, which is worth recording because
  the temptation was to tune all five: 张飞's 豹头环眼 already has the round
  glare and the largest head, 赵云's 浓眉大眼 already has thick brows and big
  eyes, and 黄忠 already has the heaviest brows and hooded eyes.
- A DIFF-1 FINDING, free and worth having: `git log src/core` since the
  measurements were filed is EMPTY. The sim is deterministic and nothing under
  it has changed in fifty-odd commits, so the difficulty numbers in DIFF-1
  still stand exactly as measured - the owner's decision rests on current data
  and does not need re-measuring first.
- Files changed: `src/game/art/faces.ts`, `TASKS.md`, `PROGRESS.md`.
- Verification: lint, typecheck, unit 155/155, e2e 43/43, vision 5/5 with the
  sprite gate 148/148 and renderer parity, prodbuild 4/4, signal 13/13, build.
  `FACES` is shared with the in-play face, so the sprite gates were the ones
  that mattered here. One signal contention flake (guanyu's 2-stage marathon),
  which passed alone in 36s with no violations and then passed in a full
  re-run - signal guards this project's load-bearing property, so it was
  re-run rather than reasoned away.
- Result: the five read as five specific people rather than five complexions.
- Status after: ART-10 DONE. Queue has only DIFF-1 BLOCKED.
- Remaining work or blocker: DIFF-1 needs a person. Nothing else is ready.
- Next recommended task: none exists.

### 2026-09-19 14:25 - PRODUCER PASS (verifying ART-9 where I had not looked)

- Status before: ART-9 rewrote the portrait system wholesale and ART-8 moved
  the walk poses. Two verification gaps left over from that: I had eyeballed
  only 7 of the 17 figure kinds, and had not looked at the new portraits on a
  phone at all - a surface this project has had four separate defects on
  (FIX-3, FIX-4, FIX-5 and the landscape crop).
- Swept all 17 figure kinds as portraits. NO DEFECT: every one renders, Xiahou
  Dun keeps one good eye beside his socket, the crown kinds (Cao Cao, Lu Bu)
  draw correctly, and the three grunts read as plain uniformed troops - which
  is ART-2's deliberate design rather than an oversight.
  `artifacts/look/art9-cast.png`.
- Swept both phone orientations under Pixel 7 emulation. NO DEFECT: portrait
  canvas 412x232, landscape 732x412, no page errors in either, and all five
  faces stay readable and distinguishable at the ~58px the select panel gets
  there. `artifacts/look/phone-select-{portrait,landscape}.png`.
- Recorded because the whole series keeps turning on "judged it bigger than the
  game shows it", and a frontal face with soft shading had not been checked at
  the smallest size it ships at.
- Files changed: `PROGRESS.md`.
- Verification run: the sweeps themselves. No code touched, so the tree is
  unchanged from e1558ee where all eight suites were green.
- Result: no defect. The face work holds at every size and on every device the
  game runs on.
- Status after: n/a - producer pass.
- Remaining work or blocker: DIFF-1 is the ONLY item left in the queue and it
  is blocked on an owner design decision, not on anything measurable. The live
  build is behind by the owner's manual deploy, and `node_modules.stuck/` still
  needs deleting from Windows.
- Next recommended task: none exists. DIFF-1 needs a person.
