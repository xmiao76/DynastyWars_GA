# CMR-07B — Wei Spearman: integrate and review all motion in game

- Queue status: DONE 2026-10-02 (attempt 1). Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: [CMR-07A](CMR-07A.md) DONE with a complete prepared pack.
- No other fighter implementation in this consumer iteration.

## Read first

[Shared rollout contract](../CAST_MOTION_ROLLOUT.md), live [queue](../../TASKS.md)/[progress](../../PROGRESS.md), CMR-01 inventory/baseline and CMR-02..05 documented interfaces. Inspect current `src/core/{characters,enemies,attacks,ai}.ts` and `src/game/art/figures.ts` read-only. Identity sources: [body master](../../art/fighter-bodies/spearman-body-master.jpg) and [portrait master](../../art/mook-faces/spearman-portrait-master.jpg); inspect those images before authoring. Use existing heads source as additional reference only when intended and provenance recorded.

## Character-specific inventory

- Fighter ID: `spearman`; role: mook; current weapon: spear.
- Rank-and-file spear fighter. Rigid spear and spaced holding hands on thrust; 14-tick enemy hitstun; held/throw/impact/getup/death. Never shorten the spear for a strike.
- Attack bindings: `spear.thrust`
- Read exact timing/speed/reach/enrage/hitstun from core data at implementation time, not approximate prompt text.

## Bounded work

1. Register and verify the complete prepared pack behind `?motion=1`, through CMR-02/03 catalog/publication. Per-fighter atomic fallback and stage cache/prefetch; no partial-state publication.
2. Bind every real state/attack/clock from the profile. Required capabilities: Idle/approach/retreat/walk/stop, every actual attack or shooting cue, own hitstun, fall/impact/down/getup, upright held/escape, throw flight/ground impact, dying/dead; bosses additionally charge and normal/enraged movement. No hero-only jump/mounted/special pages unless reachable data demonstrates the capability.
3. Exercise every applicable tick, startup/active/recovery, zero windows, pause/hit-stop, skipped render, direction changes, attack interruption, low fall/getup/KO, restart and co-op/AI as applicable. Correct local frame registration/exposure defects only within this task's fighter and remaining 8-request combined budget. Shared architectural defects get documented as prerequisite blockers, not unrelated refactors.
4. Capture actual baseline vs new art in game, both facings/Canvas/WebGL/mobile landscape, isolated actions and normal input/AI mixed motion. Real damage/grab/projectile/charge/enrage checks supplement test-injected stress cases. CMR-05 motion-aware review path, not legacy-only rig sheets.
5. Review entire sequences at game size and enlarged, cite concrete after-frame details, inspect foot planting/weapon trajectories/size pops. Record pace and native-video viewing limitations. Publish indexed artifacts and per-action findings in a concise fighter review report.
6. Independent next producer verifies new path on fresh captures. Consumer findings are self-check/fixed-unverified; never write independently verified for its own fix.

## Acceptance

- [x] All required frames/bindings displayed in live runtime; no legacy texture or old rig blends inside this successfully published fighter. Bad/missing pack negative controls retain whole old fighter without affecting other valid packs. (76 capture rows all `motion-source:spearman`; per-state dispatch units + all-frames-exist sweep; runtime negative-control suite green incl. new pack.)
- [x] Exact existing hit/projectile windows and movement/AI remain unchanged; visible strike/release matches simulation, no added input lock. (Thrust clip duration 51 = 20/5/26 from core data; unit asserts EVERY active tick 20..24 dispatches `thrust:3/4`; zero core/sim changes; dispatch is display-only like soldier's.)
- [x] Stable scale/pivots/body identity; smooth applicable action boundaries and shared guard/down frames; no standing insertion into low collapse. (Contact sheets show no size pops; bookend rect-identity units; knockdown→fall / dying→dying dispatch pinned by units.)
- [x] Genuine gait/ground contacts and head/weapon landmark criteria from A still pass after runtime registration. No drift dismissed just because global vision is green. (Walk cycle captured mid-stride; registration is uniform scale + recorded translation so 07A's 7.9% heads / 18.2%-waived spears hold exactly; contactU/weaponTipU open for producer per precedent.)
- [x] Actual motion footage and before/after contact/crop evidence for every applicable action/facing, including role-specific list above. Capture source commit/hash/dirty state known. (Traces, 20 crops × facings × renderers, contact sheets, webms, 6 pair sheets per renderer after rotation re-run; index.json records 36b0a99-dirty then c30786f-clean.)
- [x] Character load/decode/cache costs meet CMR-03 limits; unused kinds not all loaded at boot; restart/cancel/evict tested as relevant. (Runtime units: spearman page bytes/decoded in budget sums, per-fighter caps, stage-download cap, dedupe + restart-no-redownload + eviction incl. spearman.)
- [x] Earlier accepted fighters/Guan Yu reference remain unchanged; normal play remains opt-in and defaults legacy until owner activates. (Prodbuild pilot 8/8: off-by-default asserts no downloads/motions/legacy frames; 3-pack opt-in loads; guanyu/soldier sources + soldier capture re-run identical.)
- [x] All applicable checks pass with documented baseline-only exceptions; unresolved task defects keep IN_PROGRESS/BLOCKED, not DONE. (lint+tsc clean; units 842|1-known G6 V-15b baseline; vision 5/5; captures green both renderers; prodbuild 8/8. Signal skipped with rationale: no timing/AI/shared-behavior changes - additive opt-in content only, windows verified per-tick by units. No defects remain.)

The three-round Acceptance-4 [repair-only reserve](../MOTION_ACCEPTANCE4_RECOVERY.md) is shared with this fighter’s A task. If runtime evidence reveals a *new* actual source-art defect, diagnose and reserve a focused repair; do not silently repurpose it for general polish, loosen checks or reset the task-iteration limit.

## Verification/handoff

Run targeted profile/pack/frame units, actual fighter action/mixed/interactions browser tests, lint/typecheck, vision/prodbuild. Run signal for timing adapter/AI observer/paired behavior changes; independent producer review follows existing cadence. Report known G6/UIR-19 failures separately and permit no new failures. Budget is shared with A. Local scoped commit; subsequent character waits for this task's DONE prerequisites, not partially loaded art.
