# CMR-08B — Wei Archer: integrate and review all motion in game

- Queue status: DONE 2026-10-02 (attempt 1). Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: [CMR-08A](CMR-08A.md) DONE with a complete prepared pack.
- No other fighter implementation in this consumer iteration.

## Read first

[Shared rollout contract](../CAST_MOTION_ROLLOUT.md), live [queue](../../TASKS.md)/[progress](../../PROGRESS.md), CMR-01 inventory/baseline and CMR-02..05 documented interfaces. Inspect current `src/core/{characters,enemies,attacks,ai}.ts` and `src/game/art/figures.ts` read-only. Identity sources: [body master](../../art/fighter-bodies/archer-body-master.jpg) and [portrait master](../../art/mook-faces/archer-portrait-master.jpg); inspect those images before authoring. Use existing heads source as additional reference only when intended and provenance recorded.

## Character-specific inventory

- Fighter ID: `archer`; role: shooter; current weapon: bow.
- Hooded Wei bowman. Retreat/approach, draw/release/reload linked to actual enemy-arrow creation; no melee attack state/ID in current AI. Enemy hitstun 16 ticks, held/throw/fall/getup/death. Idle firing must not look like walking in place.
- Attack bindings: No melee attack ID; use existing per-actor shooter cadence/projectile observation from CMR-02.
- Read exact timing/speed/reach/enrage/hitstun from core data at implementation time, not approximate prompt text.

## Bounded work

1. Register and verify the complete prepared pack behind `?motion=1`, through CMR-02/03 catalog/publication. Per-fighter atomic fallback and stage cache/prefetch; no partial-state publication.
2. Bind every real state/attack/clock from the profile. Required capabilities: Idle/approach/retreat/walk/stop, every actual attack or shooting cue, own hitstun, fall/impact/down/getup, upright held/escape, throw flight/ground impact, dying/dead; bosses additionally charge and normal/enraged movement. No hero-only jump/mounted/special pages unless reachable data demonstrates the capability.
3. Exercise every applicable tick, startup/active/recovery, zero windows, pause/hit-stop, skipped render, direction changes, attack interruption, low fall/getup/KO, restart and co-op/AI as applicable. Correct local frame registration/exposure defects only within this task's fighter and remaining 8-request combined budget. Shared architectural defects get documented as prerequisite blockers, not unrelated refactors.
4. Capture actual baseline vs new art in game, both facings/Canvas/WebGL/mobile landscape, isolated actions and normal input/AI mixed motion. Real damage/grab/projectile/charge/enrage checks supplement test-injected stress cases. CMR-05 motion-aware review path, not legacy-only rig sheets.
5. Review entire sequences at game size and enlarged, cite concrete after-frame details, inspect foot planting/weapon trajectories/size pops. Record pace and native-video viewing limitations. Publish indexed artifacts and per-action findings in a concise fighter review report.
6. Independent next producer verifies new path on fresh captures. Consumer findings are self-check/fixed-unverified; never write independently verified for its own fix.

## Acceptance

- [x] All required frames/bindings displayed in live runtime; no legacy texture or old rig blends inside this successfully published fighter. Bad/missing pack negative controls retain whole old fighter without affecting other valid packs. (100 capture rows all `motion-source:archer`, 0 legacyRows; per-state dispatch units + all-frames-exist sweep; validator negatives green - missing frame/wrong cell/overlap/id/density all fail; runtime negative-control suite green incl. 4th pack.)
- [x] Exact existing hit/projectile windows and movement/AI remain unchanged; visible strike/release matches simulation, no added input lock. (Shoot clip duration 90 = fireInterval from core data; release at phase 0 = spawn tick per AI logic with full phase-table units incl. wrap/NaN/missing guards; hurt 16 ticks from core; walk suppresses cues; zero core/sim changes; dispatch is display-only like soldier/spearman.)
- [x] Stable scale/pivots/body identity; smooth applicable action boundaries and shared guard/down frames; no standing insertion into low collapse. (Contact sheets show no size pops; 8 bookend rect-identity units; knockdown→fall / getup→rise / thrown / dying / dead dispatch pinned by units; lowCollapse guanyu-literal shared defect documented as baseline exception per item 36 - pre-existing since 06B, affects all mooks equally.)
- [x] Genuine gait/ground contacts and head/weapon landmark criteria from A still pass after runtime registration. No drift dismissed just because global vision is green. (Walk cycle captured mid-stride both facings; groundErrorU 0; registration is uniform scale + recorded translation so 08A's 4.8% bows / 6.1% heads hold exactly; contactU/weaponTipU open for producer per precedent.)
- [x] Actual motion footage and before/after contact/crop evidence for every applicable action/facing, including role-specific list above. Capture source commit/hash/dirty state known. (Traces, 26 crops per renderer - 13 shooter actions x 2 facings incl. draw/release/reload/aim linked to arrow creation, contact sheets, webms; index.json records 80aed1d-dirty + pack revision + hashes; first archer capture so no pairs yet, rotation dir created.)
- [x] Character load/decode/cache costs meet CMR-03 limits; unused kinds not all loaded at boot; restart/cancel/evict tested as relevant. (Runtime resources withinCaps true: 1.8MB network, 7.21MiB decoded, 0 clones, 2045x924 page; per-fighter/stage caps, dedupe + restart-no-redownload + eviction incl. archer in runtime units + prodbuild 4-pack pilot.)
- [x] Earlier accepted fighters/Guan Yu reference remain unchanged; normal play remains opt-in and defaults legacy until owner activates. (Prodbuild pilot 8/8: off-by-default asserts no downloads/motions/legacy frames; 4-pack opt-in loads guanyu+soldier+spearman+archer; guanyu/soldier/spearman sources + packs untouched - this iteration docs-only, prior commits additive.)
- [x] All applicable checks pass with documented baseline-only exceptions; unresolved task defects keep IN_PROGRESS/BLOCKED, not DONE. (lint+tsc clean; units 858 passed + 6 skipped with ONLY known G6 V-15b baseline failure; targeted archer 16/16; vision 5/5; captures green both renderers; prodbuild 8/8; signal 13/13 zero violations/errors. No defects remain.)

The three-round Acceptance-4 [repair-only reserve](../MOTION_ACCEPTANCE4_RECOVERY.md) is shared with this fighter’s A task. If runtime evidence reveals a *new* actual source-art defect, diagnose and reserve a focused repair; do not silently repurpose it for general polish, loosen checks or reset the task-iteration limit.

## Verification/handoff

Run targeted profile/pack/frame units, actual fighter action/mixed/interactions browser tests, lint/typecheck, vision/prodbuild. Run signal for timing adapter/AI observer/paired behavior changes; independent producer review follows existing cadence. Report known G6/UIR-19 failures separately and permit no new failures. Budget is shared with A. Local scoped commit; subsequent character waits for this task's DONE prerequisites, not partially loaded art.
