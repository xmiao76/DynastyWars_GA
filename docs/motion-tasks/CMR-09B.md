# CMR-09B — Zhang Fei: integrate and review all motion in game

- Queue status: DONE 2026-10-03 (attempt 1). Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: [CMR-09A](CMR-09A.md) DONE with a complete prepared pack.
- No other fighter implementation in this consumer iteration.

## Read first

[Shared rollout contract](../CAST_MOTION_ROLLOUT.md), live [queue](../../TASKS.md)/[progress](../../PROGRESS.md), CMR-01 inventory/baseline and CMR-02..05 documented interfaces. Inspect current `src/core/{characters,enemies,attacks,ai}.ts` and `src/game/art/figures.ts` read-only. Identity sources: [body master](../../art/fighter-bodies/zhangfei-body-master.jpg) and [portrait master](../../art/hero-faces/zhangfei-portrait-master.png); inspect those images before authoring. Use existing heads source as additional reference only when intended and provenance recorded.

## Character-specific inventory

- Fighter ID: `zhangfei`; role: hero; current weapon: pike.
- Heavy build, bristled dark beard, ruddy complexion, headband, serpent pike. Combo uses thrust -> attack2 -> sweep, not Guan Yu glaive cuts. Faster early jabs, heavy sweep finisher; all aerial/special/grab/rider actions.
- Attack bindings: `zf.jab1`, `zf.jab2`, `zf.finisher`, `zf.jumpkick`, `zf.special`, `mounted.sweep`
- Read exact timing/speed/reach/enrage/hitstun from core data at implementation time, not approximate prompt text.

## Bounded work

1. Register and verify the complete prepared pack behind `?motion=1`, through CMR-02/03 catalog/publication. Per-fighter atomic fallback and stage cache/prefetch; no partial-state publication.
2. Bind every real state/attack/clock from the profile. Required capabilities: Idle/walk/stop, all three combos with windup/strike/follow-through/recover, takeoff/ascent/apex/descent, aerial kick/retraction/contact/landing, hurt, fall/impact/down/getup, special, grab/hold/release, mount/rider move/sweep/dismount, dying/dead/revive and both facings/mixed interruptions.
3. Exercise every applicable tick, startup/active/recovery, zero windows, pause/hit-stop, skipped render, direction changes, attack interruption, low fall/getup/KO, restart and co-op/AI as applicable. Correct local frame registration/exposure defects only within this task's fighter and remaining 16-request combined budget. Shared architectural defects get documented as prerequisite blockers, not unrelated refactors.
4. Capture actual baseline vs new art in game, both facings/Canvas/WebGL/mobile landscape, isolated actions and normal input/AI mixed motion. Real damage/grab/projectile/charge/enrage checks supplement test-injected stress cases. CMR-05 motion-aware review path, not legacy-only rig sheets.
5. Review entire sequences at game size and enlarged, cite concrete after-frame details, inspect foot planting/weapon trajectories/size pops. Record pace and native-video viewing limitations. Publish indexed artifacts and per-action findings in a concise fighter review report.
6. Independent next producer verifies new path on fresh captures. Consumer findings are self-check/fixed-unverified; never write independently verified for its own fix.

## Acceptance

- [x] All required frames/bindings displayed in live runtime; no legacy texture or old rig blends inside this successfully published fighter. Bad/missing pack negative controls retain whole old fighter without affecting other valid packs. (73-row traces both renderers: every key a real pack frame on motion textures, no mixing; e2e negative controls green: missing/wrong-signature/hung pages reject only the failing fighter.)
- [x] Exact existing hit/projectile windows and movement/AI remain unchanged; visible strike/release matches simulation, no added input lock. (Per-tick unit tests pin the strike drawing on every active tick of all 6 attacks from core windows; signal 13/13 incl. co-op; no core/sim changes - presentation only.)
- [x] Stable scale/pivots/body identity; smooth applicable action boundaries and shared guard/down frames; no standing insertion into low collapse. (One pivot (260,272), grounded 0.0u; transitions unit-pinned incl. the per-kind collapseTail fix that closed a 34-tick legacy leak after throws; bookends by clip convention verified live.)
- [x] Genuine gait/ground contacts and head/weapon landmark criteria from A still pass after runtime registration. No drift dismissed just because global vision is green. (Walk cycle reviewed live mid-stride; feet plant; head 6.4%/weapon band unchanged from A - registration is translation-only; vision sprite gate 256/256.)
- [x] Actual motion footage and before/after contact/crop evidence for every applicable action/facing, including role-specific list above. Capture source commit/hash/dirty state known. (37 crops + contact sheet + video per renderer at 35edc53-dirty; report in docs/ZHANGFEI_ACTION_REVIEW.md; no pairs/ yet - first capture, rotation ready.)
- [x] Character load/decode/cache costs meet CMR-03 limits; unused kinds not all loaded at boot; restart/cancel/evict tested as relevant. (Per-fighter 21.44 MB under the documented 22 MB owner exception; stage scope defers archer past 12 MB by design; restart/evict/dedupe/cancel covered in runtime + e2e tests; boot downloads nothing.)
- [x] Earlier accepted fighters/Guan Yu reference remain unchanged; normal play remains opt-in and defaults legacy until owner activates. (Guanyu/mook behavior provably unchanged - defaults preserved, pre-existing tests green; ?motion=1 opt-in asserted on/off in pilot + loader tests; default catalog untouched.)
- [x] All applicable checks pass with documented baseline-only exceptions; unresolved task defects keep IN_PROGRESS/BLOCKED, not DONE. (Units 883|1-known-G6|6, lint/tsc clean, motion e2e green, vision 5/5, prodbuild 8/8, signal 13/13; full-e2e shows only the two known-intermittent flakes, green in isolation; repair reserve untouched this task - 1 round left shared.)

The three-round Acceptance-4 [repair-only reserve](../MOTION_ACCEPTANCE4_RECOVERY.md) is shared with this fighter’s A task. If runtime evidence reveals a *new* actual source-art defect, diagnose and reserve a focused repair; do not silently repurpose it for general polish, loosen checks or reset the task-iteration limit.

## Verification/handoff

Run targeted profile/pack/frame units, actual fighter action/mixed/interactions browser tests, lint/typecheck, vision/prodbuild. Run signal for timing adapter/AI observer/paired behavior changes; independent producer review follows existing cadence. Report known G6/UIR-19 failures separately and permit no new failures. Budget is shared with A. Local scoped commit; subsequent character waits for this task's DONE prerequisites, not partially loaded art.
