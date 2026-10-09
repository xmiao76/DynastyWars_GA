# Progress Log

Record concrete new work/change evidence at the top. Unchanged waits are quiet: no repeated owner choices, checkpoint/hygiene commits or full-history concatenation. Read the compact queue + selected spec/detail record and the latest signal snapshot below. Exact earlier unfinished/retry evidence is retained in [pre-autonomy progress](docs/loop-task-records/PROGRESS-2026-10-09-before-autonomy.md), SHA-256 3e7be0219739f6a3a2817e0fc2ae5f227c62fdf8a9aa719e28efb4b32d289244; retrieve only relevant sections, not the whole 227KB on every tick.

## Entries

### 2026-10-09 — CMR-15A first-touch orientation (READY → IN_PROGRESS, plan only, no art)

- Verdict: READY (branch a). Requires CMR-05 DONE confirmed in TASKS.md (CMR-05 block Status: DONE). Record docs/loop-task-records/CMR-15A.md read FULLY (8 lines): owner exclusions none; attempt/recovery history 0 (TODO, zero failed consumer iterations). Spec docs/motion-tasks/CMR-15A.md read fully. Shared contract docs/CAST_MOTION_ROLLOUT.md, AGENTS.md, .loop/continue.md, .loop/loop.md, docs/LOOP_AUTONOMY.md read.
- Budgets: art/motion/generation-budget.json has NO xuchu row → 0 used, full spec cap 12 available (shared 15A/15B, ≤2 whole-sheet candidates per sequence). Global 141/200 used (17+8+8+7+12+15+25+20+14+15), 59 headroom. Repair reserve art/motion/acceptance4-repair-budget.json has no xuchu entry → 3/3 rounds intact. Budgets allow.
- Masters (glob): art/fighter-bodies/xuchu-body-master.jpg (git sha 2900dcb7efa85945b3b0d40014de776c617acbff) + art/boss-faces/xuchu-portrait-master.jpg (git sha 35a264c98d45e21b07776ddf8c1c1ed06d267fe5) present; extra art/boss-faces/xuchu-heads-master.jpg available as reference-only. art/motion/xuchu/ does NOT exist (expected: this task's output per spec step 4). No root IDENTITY.md; Xu Chu identity in docs/BOSS_HEAD_REFERENCE.md (Xu Chu / 許褚), docs/motion-tasks/CAST_INVENTORY.md (glaive, BOSS_HUGE, charge.crush/sword.combo/sword.heavy), spec inventory.
- Preflight: scripts/run-loop.mjs exists; read-only `node scripts/run-loop.mjs --preflight` selects consumer CMR-15A (fingerprint 4c285d17…). CMR-14A BLOCKED is task-local; independent authoring proceeds, no reset.
- PLAN (authoring, for the runner): Sheet 1 = locomotion/walk anchor — (1) lock identity/weapon reference from body+portrait masters, record size/camera/light/costume/cape/headgear + rigid glaive landmarks (never palette-swap Guan Yu; read exact timing from src/core + figures.ts at implementation time); (2) author walk sheet, fix ONE global brief band from it (head-size overlay-landmark + glaive spread ≤10% via scripts/pack-projection.mjs, direction steps ≤60°); (3) review at gameplay size + 4x, then charge → combo → heavy → misc → fall → getup in order with the projection gate after EACH sheet (WARN steers next brief inside window, STOP = repair/re-shoot now, never re-center band); deterministic shaft retouch (scripts/motion-retouch.mjs, zero-ledger) before any reserve round; (4) prepare pack under art/motion/xuchu/ via CMR-04 tooling (fixed registration, alpha cleanup, trimmed ≤2048²/density-2 pages, ≤16MiB decoded, guard/down bookends, hashes, exposure map), no catalog activation; offline continuity review + CMR-04/CMR-05 gates, lint/typecheck/units. Xiahou walk-first precedent applies (spec-compatible: anchor-sheet band per Acceptance-4).
- Status change: TASKS.md CMR-15A TODO→IN_PROGRESS (Requires-confirmed + plan pointer). Orientation only; 0 recovery iterations consumed. Next: runner begins Sheet 1 (walk anchor) under the standing envelope.

### 2026-10-09 — Owner-approved bounded-autonomy framework (attempt 1, verified handoff)

- Scope: framework only. Existing spending/image ledgers, source artwork, acceptance/waivers, main game code, writer locks and global pause are unchanged. Narrower owner authorizations remain binding. No consumer/delegation/scheduler launched.
- Added standing envelope + classified report policy: routine measure/correct/repair/prepare/test/close-out within existing caps; local owner/provider waits park the selected task, legacy unknown/safety/regression still globally pause. Real dependency planner; three total failed recoveries with per-strategy signatures, success/model/substep does not reset.
- Existing CMR-14A stays BLOCKED. Latest facts from prior snapshot: misc5 scale reject [42,88,73,64,64,76,71,72,70], mean68.89,7/9 in band; diagnostic spears 7.33% uniform-short,0/5 within fixedband. No refund/newfund/waiver/reset. CMR-15A independent authoring now requires completed CMR-05; horse needs completed hero riders, not unfinishedbosses. Pair/final still require all currentcast packs.
- Livequeue reduced105648→~19KB,32 exact task blocks moved verbatim with hashes into docs/loop-task-records; previous detailed authorization/attempt history is intact. This entry is current summary, not erased historical failed counts.
- Verification: runner offline40/40 (manual+automated local owner/provider waits, quiet fingerprint persistence, strict schema/fence/cycle/dependency/safety/lock negatives, no fourth retry); scheduler offline37/37; lint/typecheck green; fullunits954passed/1knownG6/6skipped. Actual read-only --preflight selects CMR-15A without reopeningCMR-14A. Exact32priorqueueblocks/statuses + entirepriorprogress bytes verified against baselineHEAD; changed code/policy/livequeue whitespace clean. Verbatim historical records retain their original trailingblanklines (diff--check reports only these preserved recordEOFs); records not normalized to erase byte hashes. No vision/prodbuild rerun (no UI/game shipping artifact changed); prior independent signal snapshot preserved verbatim.
- Versioned .loop/tick.md + --preflight + --checkpoint-wait suppress unchangedmodeltasks/repoedits/commits/options; clock alone orPROGRESSchurn isn't wake input. No new reminder. Current session schedule_list is empty; otherthread reminder not accessible here, exact replacementprompt in docs/SCHEDULING.md. No claim actualhostreminder updated.
- Handoff: localcommit onlyframework files; existing owner-extensionrepair changes remain unstaged. No liveworker/OSschedule launched and runtimewriter/state untouched. Scheduledthread must replace its embeddedoldprompt with the one-line .loop/tick.md reference; update in owningthread, preserve half-hourly cadence, do not duplicate. Ready future task: CMR-15A, then other actuallyready dependencies.

## Latest independent signal snapshot (verbatim, unchanged)

### 2026-10-06 - Producer visual-review pass (review due: 4 src/game commits)
- Status before: CMR-13A IN_PROGRESS; last full review 2026-10-03
  at `4b4671c`; cutover commit `82af82a` + owner `.gitignore`
  commit `6084ab4` landed since.
- Work completed: full producer pass per eval-loop. Signals:
  `npm run signal` 13/13 green, `npm run vision` 5/5 green, both
  negative controls failing correctly, no page errors/violations.
  Fresh `npm run review:capture` (41 screens, 11-fighter anatomy):
  254/326 files byte-identical vs previous; removed files exactly
  the cutover set; all 154 retained anatomy cells byte-identical;
  suspects identical (same 2, answered against existing letters).
  Image-reviewed: 3 contact sheets, stage3-result, gamecomplete
  (Xu Chu copy), roster/banner/GO/intro crops, boss-warning,
  phone portrait (intended rotate interstitial), xuchu clean
  sheet + V-15b pair (unchanged; owner-blocked, no re-open), both
  suspect cells. No new defects; no UIR filings. Ledger: new Last
  full review at `6084ab4`, coverage row retitled to all three
  stages, blind-spot grid 11x14, 6 boss rows retired (tally 141
  N / 9 A / 4 B of 154); historical notes kept intact.
- Files changed: `docs/UI_REVIEW_LEDGER.md`, `PROGRESS.md`
  (plus ignored `artifacts/review/` capture rotation).
- Verification run: signal 13/13, vision 5/5, review:capture
  green (3 e2e + anatomy). No game-source edits in this pass.
- Result/status after: IDLE - NO NEW FINDINGS.
- Remaining work or blocker: none from this pass. Handoff nits
  for a future touch (not filed): `docs/VISUAL_REVIEW.md`
  section 2 step 3 still says "nine intro cards"; producer pass
  may not edit outside the ledger.
- Next recommended task: resume CMR-13A (combo fix-2) per queue.
