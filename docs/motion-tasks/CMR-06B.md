# CMR-06B — Wei Soldier: integrate and review all motion in game

- Queue status: TODO; task attempts start at zero.
- Dependencies: [CMR-06A](CMR-06A.md) DONE with a complete prepared pack.
- No other fighter implementation in this consumer iteration.

## Read first

[Shared rollout contract](../CAST_MOTION_ROLLOUT.md), live [queue](../../TASKS.md)/[progress](../../PROGRESS.md), CMR-01 inventory/baseline and CMR-02..05 documented interfaces. Inspect current `src/core/{characters,enemies,attacks,ai}.ts` and `src/game/art/figures.ts` read-only. Identity sources: [body master](../../art/fighter-bodies/soldier-body-master.jpg) and [portrait master](../../art/mook-faces/soldier-portrait-master.jpg); inspect those images before authoring. Use existing heads source as additional reference only when intended and provenance recorded.

## Character-specific inventory

- Fighter ID: `soldier`; role: mook; current weapon: sword.
- Light rank-and-file helmeted build. Sword swing, approach/walk/stop, 18-tick enemy hitstun, fall/getup, upright held reaction, throw flight/impact and death.
- Attack bindings: `soldier.swing`
- Read exact timing/speed/reach/enrage/hitstun from core data at implementation time, not approximate prompt text.

## Bounded work

1. Register and verify the complete prepared pack behind `?motion=1`, through CMR-02/03 catalog/publication. Per-fighter atomic fallback and stage cache/prefetch; no partial-state publication.
2. Bind every real state/attack/clock from the profile. Required capabilities: Idle/approach/retreat/walk/stop, every actual attack or shooting cue, own hitstun, fall/impact/down/getup, upright held/escape, throw flight/ground impact, dying/dead; bosses additionally charge and normal/enraged movement. No hero-only jump/mounted/special pages unless reachable data demonstrates the capability.
3. Exercise every applicable tick, startup/active/recovery, zero windows, pause/hit-stop, skipped render, direction changes, attack interruption, low fall/getup/KO, restart and co-op/AI as applicable. Correct local frame registration/exposure defects only within this task's fighter and remaining 8-request combined budget. Shared architectural defects get documented as prerequisite blockers, not unrelated refactors.
4. Capture actual baseline vs new art in game, both facings/Canvas/WebGL/mobile landscape, isolated actions and normal input/AI mixed motion. Real damage/grab/projectile/charge/enrage checks supplement test-injected stress cases. CMR-05 motion-aware review path, not legacy-only rig sheets.
5. Review entire sequences at game size and enlarged, cite concrete after-frame details, inspect foot planting/weapon trajectories/size pops. Record pace and native-video viewing limitations. Publish indexed artifacts and per-action findings in a concise fighter review report.
6. Independent next producer verifies new path on fresh captures. Consumer findings are self-check/fixed-unverified; never write independently verified for its own fix.

## Acceptance

- [x] All required frames/bindings displayed in live runtime; no legacy texture or old rig blends inside this successfully published fighter. Bad/missing pack negative controls retain whole old fighter without affecting other valid packs. (All 76 sampled rows across canvas+webgl use texture `motion-source:soldier` with pack frame names; all 40 crops show painted art (8 enlarged + 2 contact sheets reviewed, fingerprint-verified). An early "legacy leak" read was adjudicated as misread (olive trousers + player bystander at thumbnail scale). Per-fighter atomic fallback verified by the motion-runtime negative controls: guanyu missing/garbage/corrupt/timeout/unsupported cases leave the sibling's art untouched.)
- [x] Exact existing hit/projectile windows and movement/AI remain unchanged; visible strike/release matches simulation, no added input lock. (Zero `src/core/` changes across the CMR-06B range — verified by diff; the soldier strike displays `swing:3/4` on exactly the real active ticks 14..17, unit-verified per tick; no input handling touched.)
- [x] Stable scale/pivots/body identity; smooth applicable action boundaries and shared guard/down frames; no standing insertion into low collapse. (One pack scale + ground-anchored registration; guard/down bookends share one atlas rect each, byte-identical; contact sheets show consistent sizes across all actions; the soldier never matches the hero-only `lowCollapse` guanyu patterns, and the fall clip opens on the topple drawing, never a standing frame.)
- [x] Genuine gait/ground contacts and head/weapon landmark criteria from A still pass after runtime registration. No drift dismissed just because global vision is green. (AI-driven walk captured at tick 28 showing `locomotion:4` on both renderers; feet planted on the ground line in idle/walk/swing crops; registration is uniform scale + recorded translation with no per-frame rescale, so the pack's ±5% head / 5.3% weapon spreads hold after registration; `contactU`/`weaponTipU` stay `unverified` for the producer.)
- [x] Actual motion footage and before/after contact/crop evidence for every applicable action/facing, including role-specific list above. Capture source commit/hash/dirty state known. (Soldier canvas pair + webgl pair: trace/index/report/frames/pairs/contact-sheet/video per renderer in `artifacts/motion-review/soldier-{canvas,webgl}/`, previous runs rotated under `previous/`; every melee action × both facings captured with gameplay/injected provenance separated; source commit + dirty flag recorded in each index.json.)
- [x] Character load/decode/cache costs meet CMR-03 limits; unused kinds not all loaded at boot; restart/cancel/evict tested as relevant. (Unit-verified: stage-entry network 6,335,192 B ≤ 12 MiB; soldier decoded 1984*1142*4 = 9,062,912 B ≤ 16 MiB; one GPU upload per page, 0 cloned-canvas bytes; retained cache within cap; restart re-downloads nothing; eviction uninstalls; packless kinds unsupported without requests. Mobile-landscape captures: the harness viewport is 960x540 landscape; a phone-scale viewport variant is not separately evidenced - noted for the producer.)
- [x] Earlier accepted fighters/Guan Yu reference remain unchanged; normal play remains opt-in and defaults legacy until owner activates. (No guanyu asset/record changes across the CMR-06B range - verified by diff; all guanyu motion suites green; `?motion=1` opt-in gate untouched, soldier loads only under the flag via the catalog.)
- [x] All applicable checks pass with documented baseline-only exceptions; unresolved task defects keep IN_PROGRESS/BLOCKED, not DONE. (lint + tsc clean; unit 822 passed / 1 failed = known G6 V-15b pin (UIR-16 BLOCKED) / 6 skipped; motion suites incl. 12 new soldier tests green; captures self-check green on both renderers with exit 0; vision 5/5 incl. negative controls; prodbuild 8/8 incl. two-pack built-app assertions; signal 13/13 with zero page errors/violations. One unit flake observed under load (second failure in one run, clean on re-run); final confirmation run uncontended.)

## Verification/handoff

Run targeted profile/pack/frame units, actual fighter action/mixed/interactions browser tests, lint/typecheck, vision/prodbuild. Run signal for timing adapter/AI observer/paired behavior changes; independent producer review follows existing cadence. Report known G6/UIR-19 failures separately and permit no new failures. Budget is shared with A. Local scoped commit; subsequent character waits for this task's DONE prerequisites, not partially loaded art.
