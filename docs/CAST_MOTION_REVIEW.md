# Cast motion review — indexed pre-delete evidence (CMR-24 Part A)

Work `cmr24-cast-review-resources` (correction of receipt
`call_01a13ebb54cc76f8a3328c3ae790958f`). Written 2026-10-15 at HEAD
`475fe4d6a64524c83aa1b2f498d8ece34c139a37`. No partial
`docs/CAST_MOTION_REVIEW.md` or uncommitted `PROGRESS.md` edit existed when
checked (file absent, `git status` clean); nothing was reused because there
was nothing to reuse. This document **indexes and computes from existing
committed/local evidence only** — no generation, no new captures, no new test
runs. It is a worker evidence index, **not** the fresh independent producer
pre-delete review that [CMR-24](motion-tasks/CMR-24.md) Part A still requires,
and it does not accept Part A or authorize deletion.

Authoritative contracts: [sole-motion migration](MOTION_SOLE_MODE_MIGRATION.md),
[CMR-24 spec](motion-tasks/CMR-24.md), [CMR-24 record](loop-task-records/CMR-24.md),
[shared contract](CAST_MOTION_ROLLOUT.md). Caps (never raised):
[CONTRACT_CAPS](../src/game/adapters/motion-catalog.ts#L94-L99) — stage-entry
downloads ≤12 MiB (12,582,912 B) charged on **new immediate bytes only**,
decoded ≤16 MiB (16,777,216 B)/humanoid unless a pack carries a documented
`decodedCapBytes` exception, retained cache ≤128 MiB (134,217,728 B), page
edge ≤2048 px.

## 1. Wave resource table (computed from committed catalog/page bytes)

Method: pack source bytes and page dimensions are the committed pins in
[motion-art.ts:174–230](../src/game/adapters/motion-art.ts#L174-L230)
(verified byte-equal to the files under `src/game/assets/motion/`); decoded
bytes = Σ width×height×4 per pack (the cache's own accounting,
[motion-catalog.ts:123](../src/game/adapters/motion-catalog.ts#L123)). Stage
waves/bosses are core data ([stage.ts](../src/core/stage.ts)); first-spawn
tick = wave index, boss = wave count
([stageSpawnSchedule](../src/game/adapters/motion-art.ts#L914-L925)). The
split replicates [stageMotionScope](../src/game/adapters/motion-scope.ts#L110-L218)
cold-cache with `openingTick 0`: heroes first (P1 + second player — the
runtime always charges a second hero: actual `char2Id` or
[secondPlayerCharacter](../src/game/players.ts#L12-L14), first
[CHARACTER_ORDER](../src/core/characters.ts#L87) hero ≠ P1), then opening-wave
kinds; everything else deferred in first-spawn order; future-stage kinds
prefetched only inside leftover entry budget. Cross-check: the computed
stage1 Guan Yu+Zhang Fei row reproduces the independent production oracle
exactly (opening 5 pages / 9,219,665 B, deferred 3 pages / 5,286,177 B,
prefetch Xiahou Dun 2,220,630 B, planned 11,440,295 B — `4bc0cdd`), as does
the stage2 deferred total (5,404,241 B). **No hero pair on any stage bumps an
opening kind over the entry cap** (`overBudget` empty for all 20 ordered
pairs × 3 stages, cold cache).

### 1a. Per-pack bytes and decoded vs 16 MiB

| kind (revision) | pages | source B | decoded B | decoded MiB | vs 16 MiB |
| --- | ---: | ---: | ---: | ---: | --- |
| guanyu (revision `motion-2`) | 2 | 3,908,521 | 15,543,160 | 14.82 | within |
| zhangfei-1 | 2 | 3,524,772 | 21,441,312 | 20.45 | **over by 4,664,096 B — documented exception** `decodedCapBytes 23,068,672` in [zhangfei-prepared.json](../src/game/assets/motion/zhangfei-prepared.json); within that exception cap |
| zhaoyun-1 | 2 | 3,835,645 | 20,156,260 | 19.22 | **over by 3,379,044 B — documented exception** `decodedCapBytes 22,020,096` in [zhaoyun-prepared.json](../src/game/assets/motion/zhaoyun-prepared.json); within that exception cap |
| huangzhong-1 | 1 | 3,156,764 | 12,675,488 | 12.09 | within |
| weiyan-2 | 2 | 2,893,327 | 15,117,512 | 14.42 | within |
| soldier-1 | 1 | 1,786,372 | 9,062,912 | 8.64 | within |
| spearman-1 | 1 | 1,352,663 | 6,356,440 | 6.06 | within |
| archer-1 | 1 | 1,830,948 | 7,558,320 | 7.21 | within |
| lidian-1 | 1 | 2,102,566 | 13,240,424 | 12.63 | within |
| xiahoudun-1 | 1 | 2,220,630 | 12,991,664 | 12.39 | within |
| xuchu-1 | 1 | 2,177,184 | 9,388,376 | 8.95 | within |
| **all 11** | **15** | **28,789,392** | **143,531,868** | **136.88** | see retained note |

Every page edge ≤2048 px (largest: archer 2045×924, xiahoudun 2044×1589).
All packs display `shared-atlas`, so cloned-canvas cost is 0 by construction
and GPU bytes = decoded bytes per retained pack
([motion-art.ts:332](../src/game/adapters/motion-art.ts#L332),
[motion-catalog.ts:259–268](../src/game/adapters/motion-catalog.ts#L259-L268)).

**Retained vs 128 MiB — honest split.** The all-11 decoded sum
(143,531,868 B = 136.88 MiB) **exceeds the 128 MiB retained cap by
9,314,140 B**. No single stage needs all 11: the worst per-stage eventual
working set (heaviest hero pair Zhang Fei+Zhao Yun + every stage kind incl.
boss) is stage1 77,815,668 B (74.21 MiB), stage2 77,566,908 B (73.97 MiB),
stage3 73,963,620 B (70.54 MiB); adding the admitted future prefetch gives
stage1 90,807,332 B (86.60 MiB, +Xiahou Dun) and stage2 86,955,284 B
(82.93 MiB, +Xu Chu), same heaviest-decoded pair. A full-campaign cold
accumulation for that pair (every distinct enemy/boss across stages 1–3) is
100,195,708 B (95.55 MiB), still under the cap. The cache evicts only released
(refcount 0) packs LRU when `evict()` runs
([motion-catalog.ts:332–348](../src/game/adapters/motion-catalog.ts#L332-L348));
the full-cast coverage run (§2) prepared all 11 kinds in one episode with 0
reprepares, i.e. eviction did not force a reload there — that is an
observation about that run, **not** proof the all-11 resident set satisfies
the retained cap. It does not; it relies on per-stage working sets fitting
and on released-pack eviction between stages.

### 1b. Per-stage × default hero-pair wave split (cold cache, opening charged vs deferred)

"Default pair" = P1 + `secondPlayerCharacter(P1)`. Opening charged =
immediate new bytes counted against the 12 MiB entry cap; deferred bytes are
never charged to entry. Entry headroom = 12,582,912 − opening charged.
Planned = opening charged + admitted future prefetch (also ≤ cap).

**Stage 1 博望坡** — opening wave: soldier. Deferred order: spearman (wave 2)
→ archer (wave 3) → lidian (boss). Deferred total **5,286,177 B / 3 pages**
for every pair. Future candidates: xiahoudun, xuchu; only xiahoudun admitted.

| P1 + default P2 | opening kinds | opening charged B (pages) | entry headroom B | prefetch admitted | planned B |
| --- | --- | ---: | ---: | --- | ---: |
| guanyu + zhangfei | guanyu, zhangfei, soldier | 9,219,665 (5) | 3,363,247 | xiahoudun 2,220,630 | 11,440,295 |
| zhangfei + guanyu | zhangfei, guanyu, soldier | 9,219,665 (5) | 3,363,247 | xiahoudun | 11,440,295 |
| zhaoyun + guanyu | zhaoyun, guanyu, soldier | 9,530,538 (5) | 3,052,374 | xiahoudun | 11,751,168 |
| huangzhong + guanyu | huangzhong, guanyu, soldier | 8,851,657 (4) | 3,731,255 | xiahoudun | 11,072,287 |
| weiyan + guanyu | weiyan, guanyu, soldier | 8,588,220 (5) | 3,994,692 | xiahoudun | 10,808,850 |

Worst of all 20 ordered pairs: guanyu+zhaoyun **9,530,538 B** (headroom
3,052,374 B — too little for Xu Chu's 2,177,184 B after xiahoudun prefetch:
planned leaves 831,744 B). Lightest: huangzhong+weiyan 7,836,463 B.

**Stage 2 新野** — opening wave: soldier. Deferred: spearman → archer (both
wave 2) → xiahoudun (boss), **5,404,241 B / 3 pages** every pair. Future:
xuchu admitted for every default pair.

| P1 + default P2 | opening charged B (pages) | entry headroom B | prefetch | planned B |
| --- | ---: | ---: | --- | ---: |
| guanyu + zhangfei | 9,219,665 (5) | 3,363,247 | xuchu 2,177,184 | 11,396,849 |
| zhangfei + guanyu | 9,219,665 (5) | 3,363,247 | xuchu | 11,396,849 |
| zhaoyun + guanyu | 9,530,538 (5) | 3,052,374 | xuchu | 11,707,722 |
| huangzhong + guanyu | 8,851,657 (4) | 3,731,255 | xuchu | 11,028,841 |
| weiyan + guanyu | 8,588,220 (5) | 3,994,692 | xuchu | 10,765,404 |

Worst pair again guanyu+zhaoyun 9,530,538 B; lightest huangzhong+weiyan
7,836,463 B. Warm-cache note: kinds already `ready` from stage 1 (soldier,
spearman, archer, both heroes, prefetched xiahoudun) charge 0 new entry
bytes, so real stage-2 entry downloads are lower than this cold table.

**Stage 3 白河** — opening wave: soldier **+ archer** (archer spawns in
wave 1 here, so it is entry-charged). Deferred: spearman (wave 2) → xuchu
(boss), **3,529,847 B / 2 pages** every pair. No future stage, no prefetch.

| P1 + default P2 | opening kinds | opening charged B (pages) | entry headroom B |
| --- | --- | ---: | ---: |
| guanyu + zhangfei | guanyu, zhangfei, soldier, archer | 11,050,613 (6) | 1,532,299 |
| zhangfei + guanyu | zhangfei, guanyu, soldier, archer | 11,050,613 (6) | 1,532,299 |
| zhaoyun + guanyu | zhaoyun, guanyu, soldier, archer | 11,361,486 (6) | 1,221,426 |
| huangzhong + guanyu | huangzhong, guanyu, soldier, archer | 10,682,605 (5) | 1,900,307 |
| weiyan + guanyu | weiyan, guanyu, soldier, archer | 10,419,168 (6) | 2,163,744 |

Worst pair guanyu+zhaoyun **11,361,486 B** — the tightest entry in the game,
still 1,221,426 B under the cap with nothing bumped. Lightest
huangzhong+weiyan 9,667,411 B. Stage-3 eventual total download (cold) for
the guanyu+zhangfei pair = 11,050,613 + 3,529,847 = 14,580,460 B across the
stage, of which only the opening portion is entry-charged.

Non-pack stage kinds (`crate`, `arrow`, `meat`, `sword`) have no motion pack
and are `unsupported` in scope (never requested); they are shared props /
projectiles / pickups, not humanoids — see §4 preservation list.

## 2. Existing evidence index (exact commits and counts; nothing rerun here)

| Gate / slice | Exact commit(s) | Count / outcome | Evidence |
| --- | --- | --- | --- |
| Default flip (motion ON unless exact `motion=0`) | `da3cde96c15cfc74982d9d73c668ccc4866873d6` (`da3cde9`), baseline `689ef71` | default-path browser **8/8, 53.4s**; initial focused units 57/60, vision 2/5, prodbuild 13/14 (failures retained, later corrected) | [CMR-24 record §Phase 3](loop-task-records/CMR-24.md), `artifacts/motion/default-flip/` |
| Reader corrections (units/production) | `6ed29bcc18119b7432d94640b1cc9c4965fefb29` | runtime-file **27/27, 102.42s**; Xiahou+Xu Chu units **89/89, 10.35s** (scoped suites, **not** full-repo units) | `artifacts/motion/default-flip/reader-fixes/` |
| Vision readiness correction | `2c3260a97819068892ac68ca114baca485c416b7` | — | `artifacts/motion/default-flip/vision-fixes/report.md` |
| Stable Phase 3 verification (docs `7563a2a`) | source `2c3260a` | **vision 5/5 exit0 2.7m; prodbuild 14/14 exit0 1.4m; lint+typecheck exit0**, one run each, no rerun | `artifacts/motion/default-flip/stable-verification/{results.json,vision,prodbuild,lint,typecheck logs}` |
| Pre-flip loader/opt-in evidence (not default-URL proof) | `2fb279a`, `77d6d3e`, runtime `523684c`, production `dd61749`→`4bc0cdd` | targeted units **140/140**; loader browser **8/8**; vision **5/5**; prodbuild **14/14** (opt-in era) | [CMR-23 checkpoint](motion-tasks/CMR-23-STATUS-20261014.md) |
| Full-cast default coverage spec | `49216c6`, fix `57f3f5e07e797cdee69f38e3114772b7706fcbb6`, ext. `31e929825be270f396282fb36dda5a501e0c799b`, hash re-pin `5d0f511` | Canvas no-param default: **8,650 rows** (4,324 injected + 4,326 natural), **464 distinct motion frames, 0 blank, chains 54/54, reprepares 0, failures 0**; WebGL reduced: **801 rows** (613 injected), 1 grab chain ok, 0 failures; mobile 844×390: **94/94 frame keys match desktop, 0 mismatches**; `motion=0` sample renders legacy `entity:guanyu:idle` (rollback proven, not motion) | `artifacts/motion/default-coverage/{REPORT.md,report.json,webgl-report.json,mobile-report.json,motion0-sample.json}` (runs 2026-10-15 00:04–00:05, source through `5d0f511`) |
| Coverage catch + runtime fix | spec `49216c6` → fix `57f3f5e` | coverage caught mook `fall-thrown` collapseTail legacy fallback; fix publishes collapse tails (thrown→knockdown stays on motion frames) + clips unit; `5d0f511` re-pins clipsHash `cd926d06` (timing unchanged) | commit messages/diffs |
| Full e2e single invocation | at `5d0f511`, 2026-10-15 00:01 | **NOT GREEN, did not finish**: 137 tests, killed at 8-min limit (job `pwsh-728`); reported 116/137 = **79 ok / 13 failed / 24 skipped, 21 unreported**, no final Playwright summary. Failures: anim×3, arrows×2, artscale×1, coop×1, motion-loader×1, xiahoudun-paced-review×3, xiahoudun-lifecycle×2 | `artifacts/motion/default-flip/full-e2e/e2e-full.log` |
| Motion-aware e2e spec updates | `e16857a319779932d7b2db23f879809b77ca05dd` (anim, arrows, artscale, motion-loader, xiahoudun-lifecycle, xiahoudun-paced-review) | spec-only; bounded settle waits | commit diff |
| e2e tail batch (after `e16857a`) | run 2026-10-15 01:19–01:22 | 23 tests: **7 passed / 7 failed / 9 skipped (3.0m)** — coop×3, xiahoudun-transitions×4 (fixed-roster oracle vs staged eventual roster) | `artifacts/motion/default-flip/e2e-tail/{run.log,results.json}` |
| Tail spec corrections | `1973a71a14b53ed9f22f790c0a26a42d3ca7c620` (coop semantic waits, Xiahou staged eventual roster) | **no preserved rerun log on disk for these two specs** — do not claim them green from this index | commit diff only |
| Guan Yu spec batch | `475fe4d6a64524c83aa1b2f498d8ece34c139a37` (missing action atlas → sole-motion reload halt) | last recorded Playwright batch 01:39–01:42 (7 result dirs: guanyu-actions canvas/webgl, missing-atlas, guanyu-mixed canvas/webgl, guanyu-transitions canvas/webgl); `test-results/.last-run.json` = **status passed, 0 failedTests** — no summary log preserved | `test-results/` (local, ignored) |
| Signal | last recorded at `1ec8478-dirty` (2026-10-14 producer pass, **pre-flip**) | selfplay **13/13** then; **not rerun on the default-motion tree** in any preserved log | [PROGRESS producer entry](../PROGRESS.md), [UI ledger](UI_REVIEW_LEDGER.md) |
| Full-repo units | latest full count on record **693 passed / 1 failed / 6 skipped** (pre-flip era, [Guan Yu action review](GUANYU_ACTION_REVIEW.md)); post-flip only scoped suites above (27/27, 89/89, 140/140 opt-in era) | sole full-suite failure = pre-existing arm-chain G6 (§3) | docs cited; **no post-flip full-unit log preserved** |
| Vision legacy inventory caveat | `2c3260a` run | inside the 5/5: **158 sprites / 55 reach / 110 retract still measure the legacy `registerAllArt` inventory**, not all-11 motion coverage | [CMR-24 spec §Stable Phase 3](motion-tasks/CMR-24.md) |

Staleness note, stated plainly: vision 5/5 and prodbuild 14/14 were verified
at `2c3260a`; the runtime changed after that (`57f3f5e` collapse-tail
publication, `5d0f511` clipsHash re-pin). Coverage at `5d0f511` post-dates
those changes, but **vision/prodbuild/signal/full-units have no preserved
rerun after `57f3f5e`** in this index.

## 3. Limitations — verbatim-honest residual gaps

1. **Strict paired contact art: 58/60 FAIL, owner-deferred, not repaired.**
   CMR-23 closed DONE (DEFERRED_BY_OWNER / SUPERSEDED gate) at `689ef71`;
   the original criterion result stands at **2/60 ≤3u passes (Guan Yu→Li Dian
   both facings), 58/60 strict failures** (0/60 at the stricter ≤2u
   diagnostic; 60/60 control rows fail as designed). Contact/occlusion flaws
   in paired grabs/throws are known migration visual debt. Generation ledger
   **197/200** unchanged; no repair is authorized or claimed.
2. **No native-speed video review.** All default-motion visual evidence in
   this index is stills, frame traces and metrics. Real-clock paced-review
   captures exist as test fixtures, but the preserved full-e2e log shows the
   xiahoudun-paced-review cases still failing at `5d0f511` (WebGL segment
   ratios as low as 0.13–0.49 under load), and no indexed normal-paced
   real-input/AI clip set has been human-reviewed for CMR-24 Part A. Stills
   are not native video inspection.
3. **`nextSpawnTick` gates one wave ahead**
   ([GameScene.ts:986–1004](../src/game/scenes/GameScene.ts#L986-L1004)):
   stepping halts until kinds due by the *next* wave boundary (boss once the
   last wave is fighting) are published, because one sim step can clear the
   current wave and spawn the next. This is safe (no spawn can outrun its
   pack) but conservative: a slow/failed deferred pack can stall play a wave
   earlier than its first visible spawn, and the gate is only as precise as
   the wave-index schedule — it is not a per-spawn-tick gate.
4. **Full single-invocation e2e is not yet green.** The only preserved full
   run (137 tests at `5d0f511`) was killed at its 8-minute limit with
   79 ok / 13 failed / 24 skipped / 21 unreported and no final summary.
   Follow-up batches were partial: `e16857a` spec updates, a 23-test tail at
   7/7/9, corrections `1973a71`/`475fe4d` whose reruns have no preserved
   summary log (one `.last-run.json` = passed for the final Guan Yu batch).
   Nobody may cite a green full e2e from this evidence.
5. **Arm-chain pre-existing failure.** `test/game/arm-chain.test.ts` gate G6
   (UIR-16 legacy paper-doll arm chain) is the documented sole failure of the
   last recorded full unit run (693/1/6) and predates the motion migration
   ([CAST_MOTION_ROLLOUT §known blockers](CAST_MOTION_ROLLOUT.md)). It tests
   the legacy rig, is not caused by the flip, must not be described as fixed,
   and is a deletion-retirement candidate only (§4).
6. Further open Part A items this index does **not** close: post-`57f3f5e`
   vision/prodbuild/signal/full-unit reruns; a completed full e2e; frame-time/
   performance evidence on the default path; every negative-control variant
   on every stage (proven: production missing/corrupt deferred Xiahou Dun,
   loading-errors suite 8/8 at `da3cde9`, coverage-era missing-atlas halt);
   the all-11 resident set exceeding the 128 MiB retained cap if nothing is
   evicted (§1a); and a fresh **independent** pre-delete review (this worker
   index is not it). Known per-fighter historical waivers remain as recorded
   (e.g. Xu Chu head UNVERIFIED_OWNER_ACCEPTED, 9 exact-hash weapon waivers
   FAIL-retained) — none becomes a pass here. CMR-24 stays IN_PROGRESS; all
   Part A group checkboxes and Part B remain unchecked; **no legacy deletion
   is authorized by this document**.

## 4. Deletion candidate inventory (category level) + shared preservation

Category-level only, for the future separately-scoped Phase 5 slice; every
file must be re-verified legacy-only at deletion time. Nothing below is
deleted by this document.

**Legacy-only deletion candidates:**

- **Mode switch + fallback plumbing**: `motionEnabled` `?motion=0` rollback
  branch, whole-fighter legacy fallback paths in the motion runtime/catalog
  (incl. `canRenderLegacyFrame` legacy allowance and `noteLegacyFallback`
  accounting), and any scene wiring that selects legacy rendering per kind.
- **Legacy figure renderer code** (paper-doll/rig pipeline in `src/game/art/`):
  rig/draw/poses/figures, body-/hand-/weapon-parts, weapons, arm IK,
  pose interpolation, whole-frames registration, and the legacy
  `VECTOR_ART`/`registerAllArt` portions of the registry — only the parts no
  motion/menu/prop path references.
- **Legacy baked character assets** under `src/game/assets/`: hero-bodies
  (6 files, 654,992 B), mook-bodies (4, 350,937 B), boss-bodies (4, 397,052 B),
  whole-frames (2, 441,942 B), body-fixtures (2, 30,397 B), weapons sheets
  (2, 61,548 B); hero-/mook-/boss-faces **only if** proven rig-exclusive
  (portrait/HUD reuse must be checked first — see preservation).
- **Legacy-only tests and gates**: arm-chain G6 and the UIR-15/16/19 hand-grip
  family, body-look / wholeframe-look legacy-texture specs, baked-art e2e
  fixtures, motion-look legacy-vs-motion comparison cases, vision's legacy
  inventory gates (158 sprites / 55 reach / 110 retract via
  `registerAllArt`), rig anatomy grids. Each retires as
  **retired-by-deletion**, never as newly green.
- **Legacy-only scripts and live requirements**: rig bake/emit scripts and
  body-overhaul tooling with no motion consumer; live-doc requirements that
  mandate the legacy renderer (BODY_* gate text, opt-in-only wording).
  Archives, task records, provenance and budget ledgers are **history, not
  candidates**.

**Shared-assets preservation list (must survive any deletion):**

- Deterministic core and data: `src/core/` (sim, stage tables, characters),
  timing/hitboxes/physics/grab pinning — mechanics unchanged.
- The whole motion path: `src/game/assets/motion/` pages + prepared records,
  `motion-clips*.ts`, motion profiles/player, adapters
  (motion-art runtime, motion-catalog, motion-scope), atlas cache and error
  semantics.
- Presentation shared with motion/menus/other behavior: painted backdrops and
  stage backgrounds, props (`crate`), projectiles (`arrow`), pickups
  (`meat`/`sword`), fx, HUD/select/title art (hudart, selectart, keyart,
  logo, flowart, title key-art asset), fonts, portrait assets/code wherever
  HUD/select still consume them, audio, scenes/UI shell, palette code shared
  by backdrop/UI.
- Tooling and evidence shared with motion: motion capture/review scripts,
  emit-*-runtime pack emitters, coverage/loading/production specs, and all
  provenance/budget/action-review records under `art/motion/` and `docs/`.
- Rollback until Part B proves exclusivity: the separate deletion commit
  itself (revert restores legacy whole); `?motion=0` remains functional
  until that commit lands.

## Verdict of this index

Resources: every stage × hero-pair opening fits the 12 MiB entry cap cold
(worst 11,361,486 B, stage 3 guanyu+zhaoyun), deferred splits are exact and
uncharged, decoded fits 16 MiB except the two documented Zhang Fei/Zhao Yun
exceptions, and per-stage retained working sets fit 128 MiB while the
all-11 sum (136.88 MiB) does not. Evidence: default flip, stable
vision/prodbuild at `2c3260a`, and full-cast Canvas/WebGL/mobile coverage at
`5d0f511` are real; signal, full units, a completed full e2e, post-fix
vision/prodbuild reruns, native-speed review and independent pre-delete
review are **not** established. Part A is therefore **not green** and legacy
deletion remains forbidden until those gaps close under CMR-24.

## 5. Audited e2e batch ledger (appended 2026-10-15, work `cmr24-e2e-batch-ledger`)

Every `e2e/*.spec.ts` file (52, enumerated by glob + `playwright test
--project=chromium --list` = 137 tests) appears exactly once below with its
post-flip passing invocation, or is marked gated-skip / NOT-RUN-POST-FLIP.
Post-flip = at or after the default flip `da3cde9`. This disjoint batch
ledger is the reviewer-accepted alternative to one full invocation; it does
**not** retroactively make the §2 full run green, and §2/§3 statements about
that run stand as written.

**Batches (defined once; rows cite the batch id):**

| id | invocation | commit | result | evidence |
| --- | --- | --- | --- | --- |
| SB | `playwright test --project=chromium --workers=1` (full suite attempt), 2026-10-15 02:11, killed ~8 min after test #64 | `77035d7767919529844580c8b7a0038c4d8c35c2` | reported 64: 61 ok / 1 x (gamepad #33) / 2 gated-skip; no exit code (killed) | `artifacts/motion/default-flip/final-serial-b/e2e.log` |
| SC | remaining 26 files / 74 tests, `--workers=2`, 2026-10-15 02:20–02:26 | `77035d7767919529844580c8b7a0038c4d8c35c2` | 55 passed / 1 failed (paced webgl/right) / 18 skipped, exit 1 | `artifacts/motion/default-flip/final-serial-c/e2e-remaining.log` |
| PR | `xiahoudun-paced-review` solo, 2026-10-15 02:37 | `168963eea57104e7cfc24c6f1b84d43f6754b5a5` | passed (4/4 result dirs, `.last-run.json` status passed, 0 failedTests); no summary log preserved | `test-results/` (local, ignored) |
| GY | Guan Yu batch with `GUANYU_ACTIONS=1`, 2026-10-15 01:39–01:42 | `475fe4d6a64524c83aa1b2f498d8ece34c139a37` | passed (`.last-run.json` status passed, 0 failedTests; §2 row) — `test-results/` has since been overwritten by PR, so this rests on the §2 record made while the dirs existed | `test-results/` at the time (local, ignored) |
| GP | `npx playwright test e2e/gamepad.spec.ts --project=chromium --workers=1`, 2026-10-15 03:14 (this work; the only not-run file, run once to close the gap) | `5830c8d7d6f6e419f703932096772ac3130089c7` | **5 passed (31.5s), exit 0** | `artifacts/motion/default-flip/e2e-ledger/gamepad.log` |

Disjointness: SB and SC are disjoint by file except
`motion-loading-errors` (SB reported only its first test before the kill;
counted once here via SC's complete 8/8) and the five Guan Yu files
(gated-skipped in SB/SC, counted once via GY). Earlier partial batches
(full run at `5d0f511`, tail batch after `e16857a`, §2) are superseded
history for every file they touched and are not double-counted. Per-file
test totals are the `--list` counts at `5830c8d`; a row's `ok` count equals
its total unless marked otherwise.

| # | file | tests | batch | result |
| ---: | --- | ---: | --- | --- |
| 1 | anim.spec.ts | 3 | SB | 3 ok |
| 2 | arrows.spec.ts | 3 | SB | 3 ok |
| 3 | art.spec.ts | 3 | SB | 3 ok |
| 4 | artfx.spec.ts | 3 | SB | 3 ok |
| 5 | artscale.spec.ts | 1 | SB | 1 ok |
| 6 | audio.spec.ts | 1 | SB | 1 ok |
| 7 | backdrop-look.spec.ts | 1 | SB | 1 ok |
| 8 | background.spec.ts | 1 | SB | 1 ok |
| 9 | body-look.spec.ts | 3 | SB | 3 ok |
| 10 | boot.spec.ts | 1 | SB | 1 ok |
| 11 | continue.spec.ts | 1 | SB | 1 ok |
| 12 | coop.spec.ts | 6 | SB | 6 ok |
| 13 | finalstage.spec.ts | 1 | SB | 1 ok |
| 14 | game.spec.ts | 1 | SB | 1 ok |
| 15 | gamepad.spec.ts | 5 | GP | 5 ok at `5830c8d` after fix `168963e`; retained failures at `77035d7`: SB #33 + solo 4p/1f (`final-serial-c/gamepad.log`, player2.x 96 not >96) |
| 16 | guanyu-actions.spec.ts | 3 | GY | gate `GUANYU_ACTIONS=1`: run enabled, passed; gated-skip in SC |
| 17 | guanyu-interactions.spec.ts | 1 | GY | gate `GUANYU_ACTIONS=1`: run enabled, passed (GY batch); gated-skip in SB |
| 18 | guanyu-mixed-motion.spec.ts | 2 | GY | gate `GUANYU_ACTIONS=1`: run enabled, passed; gated-skip in SC |
| 19 | guanyu-solo-ko.spec.ts | 1 | GY | gate `GUANYU_ACTIONS=1`: run enabled, passed (GY batch); gated-skip in SB |
| 20 | guanyu-transitions.spec.ts | 2 | GY | gate `GUANYU_ACTIONS=1`: run enabled, passed; gated-skip in SC |
| 21 | hero-faces.spec.ts | 3 | SB | 3 ok |
| 22 | hud.spec.ts | 1 | SB | 1 ok |
| 23 | hud-look.spec.ts | 4 | SB | 4 ok |
| 24 | hudpanels.spec.ts | 1 | SB | 1 ok |
| 25 | introcard.spec.ts | 5 | SB | 5 ok |
| 26 | juice.spec.ts | 1 | SB | 1 ok |
| 27 | layout.spec.ts | 3 | SB | 3 ok |
| 28 | motion-capture.spec.ts | 1 | SC | gate `MOTION_CAPTURE=1` (via `scripts/motion-capture.mjs`): **gated-skip, enabled run NOT-RUN-POST-FLIP** |
| 29 | motion-default-coverage.spec.ts | 4 | SB | 4 ok |
| 30 | motion-loader.spec.ts | 5 | SB | 5 ok |
| 31 | motion-loading-errors.spec.ts | 8 | SC | 8 ok (SB partial 1 ok superseded) |
| 32 | motion-look.spec.ts | 4 | SC | gate `MOTION_LOOK=1`: **gated-skip, enabled run NOT-RUN-POST-FLIP** |
| 33 | motion-review.spec.ts | 1 | SC | gate `MOTION_REVIEW=1`: **gated-skip, enabled run NOT-RUN-POST-FLIP** |
| 34 | orientation.spec.ts | 3 | SC | 3 ok |
| 35 | paired-grab-capture.spec.ts | 1 | SC | 1 ok (env selects hero/kinds, no skip gate) |
| 36 | pause.spec.ts | 4 | SC | 4 ok |
| 37 | probe.spec.ts | 1 | SC | 1 ok |
| 38 | scenerestart.spec.ts | 1 | SC | 1 ok |
| 39 | select.spec.ts | 1 | SC | 1 ok |
| 40 | select-look.spec.ts | 1 | SC | 1 ok |
| 41 | stage3.spec.ts | 1 | SC | 1 ok |
| 42 | stageclear.spec.ts | 1 | SC | 1 ok |
| 43 | title.spec.ts | 2 | SC | 2 ok |
| 44 | touch.spec.ts | 9 | SC | 9 ok |
| 45 | touchpause.spec.ts | 1 | SC | 1 ok |
| 46 | uifont.spec.ts | 4 | SC | 4 ok |
| 47 | ui-review.spec.ts | 3 | SC | gate `UI_REVIEW=1`: **gated-skip, enabled run NOT-RUN-POST-FLIP** |
| 48 | wholeframe-look.spec.ts | 2 | SC | gate `WHOLEFRAME_LOOK=1`: **gated-skip, enabled run NOT-RUN-POST-FLIP** |
| 49 | xiahoudun-lifecycle.spec.ts | 6 | SC | 6 ok |
| 50 | xiahoudun-motion.spec.ts | 4 | SC | 4 ok |
| 51 | xiahoudun-paced-review.spec.ts | 4 | PR | 4 passed at `168963e`; retained SC failure at `77035d7`: 3 ok / 1 x (webgl/right) |
| 52 | xiahoudun-transitions.spec.ts | 4 | SC | 4 ok |

**Ledger tally:** 52 files / 137 tests accounted exactly once — 42
non-gated files with a complete post-flip passing invocation (SB 23 files,
SC 17 files, PR 1, GP 1), 5 Guan Yu files passed with their gate enabled
(GY), and 5 env-gated harness/look files (`motion-capture`, `motion-look`,
`motion-review`, `ui-review`, `wholeframe-look`) recorded as gated-skip
with **no enabled post-flip run** — accepted as recorded gated-skips, not
passes. Test-level arithmetic: non-gated passed = SB 56 + SC 52 (SC's
55 minus paced's 3 ok, superseded by PR) + PR 4 + GP 5 = **117** = every
non-gated test; GY enabled passed = **9**; gated-skip-only = 1+4+1+3+2 =
**11**; 117 + 9 + 11 = **137** ✓. Cross-checks: SB's reported 61 ok =
56 (its 23 passed files) + gamepad 4 ok + `motion-loading-errors` 1 ok
(partial, superseded by SC); SC's 18 skipped = 7 Guan Yu tests in its file
set + the 11 gated-skip-only tests.

Residual honesty: two batch evidences rest on `test-results/.last-run.json`
without a preserved summary log (GY, PR); SB was killed with no exit code
(its 23 listed files were fully reported before the kill — counts above
match `--list` totals per file); the 5 gated harness/look files have no
enabled post-flip run. Nothing here claims a single-invocation full-suite
green, closes §3 item 4 as originally worded, or authorizes deletion; it
supplies the disjoint per-file ledger the reviewer accepted in its place.
