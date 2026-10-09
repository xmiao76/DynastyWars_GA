# Progress Log

Record concrete new work/change evidence at the top. Unchanged waits are quiet: no repeated owner choices, checkpoint/hygiene commits or full-history concatenation. Read the compact queue + selected spec/detail record and the latest signal snapshot below. Exact earlier unfinished/retry evidence is retained in [pre-autonomy progress](docs/loop-task-records/PROGRESS-2026-10-09-before-autonomy.md), SHA-256 3e7be0219739f6a3a2817e0fc2ae5f227c62fdf8a9aa719e28efb4b32d289244; retrieve only relevant sections, not the whole 227KB on every tick.

## Entries

### 2026-10-09 — CMR-14A fall-3 gate tick close-out: MEASURE-NEEDS-REDO, no verdict (stays IN_PROGRESS)

- This tick: B1 (figs 0–4) + B2 (figs 5–8) overlays produced but all labels UNUSABLE (SUPERSEDED per adjudication — no H table recorded as consumable); C aborted, never ran. NO VERDICT this tick.
- Manager zoom adjudication (on artifacts/motion/xiahoudun/fall-review/fall-cand3-fragile-zoom.png, recorded text-only): 3 PROVEN beard misplacements — fig2 beard in empty background, fig5 + fig6 beards on shaft wood — exceeds the ≤2 correction budget, so MEASURE-NEEDS-REDO per protocol. Fig2 crown marginal; fig7/8 beards suspect by same shaft pattern, unscutinized (not proven). Overlays listed only, never opened: artifacts/motion/xiahoudun/fall-review/fall-cand3-b1-marked2.png + fall-cand3-b2-marked2.png + fall-cand3-fragile-zoom.png.
- Verification (text-only; preconditions deviated): HEAD is 530485f, not 932e470 (one REJECTED-verdict commit ahead); audit art/motion/xiahoudun/fall-candidate-3-audit.json reads REJECTED-do-not-prepare, not PENDING (left untouched); 5 never-touch files (.loop/eval-loop.md, AGENTS.md, scripts/motion-acceptance4-repair.d.mts/.mjs, test/game/motion-acceptance4-repair.test.ts) unchanged/unstaged; zero image opens, zero measurement.
- Next: targeted beard re-measure for figs 2/5/6/7/8 + fig2-crown verify, then fresh C. Task stays IN_PROGRESS.

### 2026-10-09 — CMR-14A fall-3 scale gate VERDICT: REJECTED-do-not-prepare (stays IN_PROGRESS)

- Verdict: REJECT — do NOT prepare from fall candidate 3. Reported H (re-derived from both opened marked overlays + b1-mark2/b2-mark2 scripts) [67,61,54,75,62,80,89,68,66], mean 69.11 (IN 55.0–74.4). Verified: 8 measurable mean 71.00 (IN) BUT fig6 H=89 zoom-CONFIRMED out-of-band HIGH (+8.1 over 80.9 ceiling, +37.6% vs walk 64.7) AND fig2 UNMEASURABLE (reported H=54 VOID — crown (1018,75) + beard (1088,129) both RGB 0/9 background-proven floating on opened zoom; correction attempted via finder views but true beard-tip merges into torso/scarf with no gap boundary, dark continuous to box bottom y181–190 — placing a tip would be guessing; fall-1/2 UNMEASURABLE precedent; 0/≤2 correction allowance consumed). Fragile sheet (f2/f3/f5/f6) rendered + OPENED: f3=75 + f5=80 confirmed (2px tip-above-gap signatures; f5 0.9px below ceiling, fragile disclosed). Uniformity 89/61 = 1.46x verified (reported 1.65x incl voided f2).
- Robustness: Tier E ±10 stress — REJECT robust (f2 UNMEASURABLE alone sustains REJECT under every shift; mean 71±10 = 61–81 straddles ceiling, fragility disclosed). Eyeball ±2 — fig6 87–91 robustly out (needs −9, 4.5× eyeball); fig5 78–82 straddles (not load-bearing); fig3 73–77 in. Verdict follows verified measurements. Identity CONFIRMED on opened overlays (topknot+headband/dark beard/lamellar+magenta scarf/spears, all 9).
- Evidence: audit art/motion/xiahoudun/fall-candidate-3-audit.json (status REJECTED-do-not-prepare, scaleGate REJECTED, landmarks + 6 evidence paths incl zoom sheet, valid JSON single top-level status) + overlays fall-cand3-b1-marked2.png (88f8150e…) + fall-cand3-b2-marked2.png (a64dad38…) + fragile zoom fall-cand3-fragile-zoom.png (6f9cd833…, 440×3018, OPENED) + f2 find/find2 support. Commit holds ONLY audit JSON + TASKS.md + PROGRESS.md (diff --check clean; 5 pre-existing modified files untouched/unstaged; never push).
- Next: misc/fall/getup funding conversation; do NOT prepare from candidate 3. Task stays IN_PROGRESS.

### 2026-10-09 — CMR-14A fall-3 gate tick close-out (A1 unverified + A1R aborted, A2/C deferred, stays IN_PROGRESS)

- Attempted fall-3 scale gate this tick, measurement did NOT complete: A1 figs 0–4 honest FAILED criterion (spear-latch failure mode, UNVERIFIED best-effort, must not be consumed) + A1R redo aborted on deadline with misplaced crop windows (markers floating in background, numbers unusable, confirmed on opened overlay by manager) + A2/C never ran (timebox, deferred to next tick).
- Evidence (ignored, uncommitted, not consumed): artifacts/motion/xiahoudun/fall-review/fall-cand3-a1-marked2.png + artifacts/motion/xiahoudun/fall-review/fall-cand3-a1r-marked.png. Audit art/motion/xiahoudun/fall-candidate-3-audit.json stays CANDIDATE_GENERATED_DESIGN_AUDITED_SCALE_GATE_PENDING (scaleGate.status PENDING, verified, untouched).
- Next: re-measure 0–4 head-centered + A2 + C verdict, gate-FIRST on arrival else REJECT before any other work on it. No verdict this tick.

### 2026-10-09 — CMR-14A fall-3 finish (verify + log + commit, SCALE GATE PENDING, stays IN_PROGRESS)

- Finish package for the fall-3 stacked generation (owner-2026-10-09-cmr14a-fall3-stacked, FUND-FALL-STACKED dual exception, 14A first). Gen worker COMPLETED, no abort: reservation RECORDED, all 3 fall-3 files present, TASKS auth+reset edits verified accurate, PROGRESS written this tick. ZERO image_generate calls, ZERO re-reservation, ledger values untouched.
- Ledger verified EXACT: art/motion/generation-budget.json diff is exactly the exception increment (xiahoudun used 15->16, fall 2->3; cap stays 12, exception visible in audit). Per-fighter sum 17+8+8+7+12+15+25+20+14+16 = 142/200 global. No other ledger change.
- Files verified present + matching: fall-prompt-3.txt (15947B, sha256 73feef90e913826666d03944df57153d2d31aeaf88a6033b8cde50f6bb70f7c3 == audit prompt.fileSha256); fall-candidate-3.png (442315B non-zero, 1248x832 == audit dims/bytes, sha256 b2ea48772587530efbd7ed4b9e0d47fae4b95f958a1cec238b927bcb1fb5aceb == audit output.sha256, recomputed + compared); fall-candidate-3-audit.json (10999B, valid JSON). Priors byte-intact: git diff scope holds no fall-1/2, prompt-1/2, or audit-1/2 change.
- PNG alpha cross-check: Format24bppRgb, no alpha channel, corner samples gray-scale — confirms audit alphaNote (JPEG-class provider bytes fully opaque; separation is visual self-check only). No incoherence, no fix.
- Audit coherence: status CANDIDATE_GENERATED_DESIGN_AUDITED_SCALE_GATE_PENDING with scaleGate.status PENDING - NO verdict this tick BY DESIGN; thresholds mean 55.0-74.4 (walk 64.7 +/-15%) + per-fig 48.5-80.9 (+/-25%); providerServed grok (requested grok EXPLICIT, no fallback notice — per pattern); refs NONE ATTACHED text-only by harness limitation, disclosed, with 3 masters re-read + hash-verified (body a57630a2… / portrait 01bb7271… / walk-corrected 0aff5a39…). Prompt-3 spec-bearing verified by content scan: 4-layer stacked core (SPEAR-FIXED + FULL-SPAN 97%+ + POSE-MODERATION + GROK SCALE), all 11 named failures with numeric markers (106.8 / 100.0 / 73.56 / 88.67 / UNMEASURABLEs / 7.33% / 404.16-446.70 / 425-442 / 63-68px / 64.7), 3x3 row-major layout, strict-side-profile head demand, auth scope + scale-gate-FIRST + NOT DONE.
- Strip: artifacts/motion/xiahoudun/fall-review/fall-gridstrip-cand3.png exists (1082278B, sha256 19e1afa9d8090249a4016a93ec716d0d3eeede44077b6b3883bd5bdbc65e96976 == audit evidence sha) and OPENED for independent design verdict: CLEAN self-check. Poses/spec: 0 stagger-back topple (arm flailing up, spear LEVEL) / 1 airborne (feet off ground, twisting lean) / 2 kneel-turn tumble (grounded knee) / 3 kneel impact / 4 DOWN grounded-extended (legs back, head in strict side profile clear of ground, MEASURABLE-looking, never buried); spares 5-8 in-family stagger/seated, no extra flat-prone. Spear-level + full-span eyeball: all 9 LEVEL near-horizontal same-grip, edge-to-edge, eyeball-similar (numbers deferred to gate). Heads: all 9 visible in profile facing right, crown + beard unoccluded, beards free of shafts. Spears: 9/9 complete butt-cap-to-tip with leaf head + tassel, one per drawing, no floaters. Identity: headband+topknot / full dark beard / dark lamellar + magenta-purple scarf / dark robe+boots, all nine; no helmet/sword/extra limbs; blind-eye+scar not verifiable at 1x (deferred to gate crops, disclosed). Guides: none (magenta grid is strip overlay only). Stacked-core read: spear-fixed + full-span + pose-moderation all visible. Variety watch (recorded honestly, NOT a reject): cells 2/3/6 read as same-family kneel variants, 7/8 seated similar — design audit is pose-identity-separation-guides, not a variety gate.
- TASKS verified accurate: CMR-14A auth block quotes the dual exception scope correctly (ONE fall sheet 3, fall 2->3 AND 15->16, 141->142/200, scale-gate FIRST, NOT DONE/14B, CMR-14B stays TODO); status BLOCKED -> IN_PROGRESS with full prior BLOCKED line preserved in docs/loop-task-records/CMR-14A.md:32; Requires/Acceptance/record-hash lines unchanged.
- Checks: motion-budget suite (test/game/motion-budget.test.ts) 9/9 green; git diff --check clean. Commit contains ONLY the ledger + prompt-3 + PNG + audit + TASKS + PROGRESS (-f limited to the 3 ignored xiahoudun paths; tmpcheck scripts + review strips stay ignored/uncommitted under artifacts/; 5 unrelated modified files left untouched/unstaged; never push).
- Next: SCALE GATE runs NEXT tick, gate-FIRST on arrival else REJECT before any other work on it (bands 55.0-74.4 / 48.5-80.9, overlay-landmark ruler, walk 64.7). Do NOT prepare from this candidate until the gate passes. Task stays IN_PROGRESS.

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
