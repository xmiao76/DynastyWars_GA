# CMR-12B — Huang Zhong: integrate and review all motion in game

- Queue status: IN_PROGRESS (attempt 1; slice 1 registration wired).
- Dependencies: [CMR-12A](CMR-12A.md) DONE with a complete prepared pack.
- No other fighter implementation in this consumer iteration.

## Read first

[Shared rollout contract](../CAST_MOTION_ROLLOUT.md), live [queue](../../TASKS.md)/[progress](../../PROGRESS.md), CMR-01 inventory/baseline and CMR-02..05 documented interfaces. Inspect current `src/core/{characters,enemies,attacks,ai}.ts` and `src/game/art/figures.ts` read-only. Identity sources: [body master](../../art/fighter-bodies/huangzhong-body-master.jpg) and [portrait master](../../art/hero-faces/huangzhong-portrait-master.png); inspect those images before authoring. Use existing heads source as additional reference only when intended and provenance recorded.

## Character-specific inventory

- Fighter ID: `huangzhong`; role: hero; current weapon: bow.
- Veteran bow user, grey long beard/headband, gold-brown costume. Short-range bow-as-staff combo thrust -> chop -> sweep. hz.special has startup4, active0, recovery14; arrow actually spawns at special start. Visible release follows spawn, not guessed melee active ticks. Full hero/rider coverage.
- Attack bindings: `hz.jab1`, `hz.jab2`, `hz.finisher`, `hz.jumpkick`, `hz.special`, `mounted.sweep`
- Read exact timing/speed/reach/enrage/hitstun from core data at implementation time, not approximate prompt text.

## Bounded work

1. Register and verify the complete prepared pack behind `?motion=1`, through CMR-02/03 catalog/publication. Per-fighter atomic fallback and stage cache/prefetch; no partial-state publication.
2. Bind every real state/attack/clock from the profile. Required capabilities: Idle/walk/stop, all three combos with windup/strike/follow-through/recover, takeoff/ascent/apex/descent, aerial kick/retraction/contact/landing, hurt, fall/impact/down/getup, special, grab/hold/release, mount/rider move/sweep/dismount, dying/dead/revive and both facings/mixed interruptions.
3. Exercise every applicable tick, startup/active/recovery, zero windows, pause/hit-stop, skipped render, direction changes, attack interruption, low fall/getup/KO, restart and co-op/AI as applicable. Correct local frame registration/exposure defects only within this task's fighter and remaining 16-request combined budget. Shared architectural defects get documented as prerequisite blockers, not unrelated refactors.
4. Capture actual baseline vs new art in game, both facings/Canvas/WebGL/mobile landscape, isolated actions and normal input/AI mixed motion. Real damage/grab/projectile/charge/enrage checks supplement test-injected stress cases. CMR-05 motion-aware review path, not legacy-only rig sheets.
5. Review entire sequences at game size and enlarged, cite concrete after-frame details, inspect foot planting/weapon trajectories/size pops. Record pace and native-video viewing limitations. Publish indexed artifacts and per-action findings in a concise fighter review report.
6. Independent next producer verifies new path on fresh captures. Consumer findings are self-check/fixed-unverified; never write independently verified for its own fix.

## Acceptance

- [ ] All required frames/bindings displayed in live runtime; no legacy texture or old rig blends inside this successfully published fighter. Bad/missing pack negative controls retain whole old fighter without affecting other valid packs.
- [ ] Exact existing hit/projectile windows and movement/AI remain unchanged; visible strike/release matches simulation, no added input lock.
- [ ] Stable scale/pivots/body identity; smooth applicable action boundaries and shared guard/down frames; no standing insertion into low collapse.
- [ ] Genuine gait/ground contacts and head/weapon landmark criteria from A still pass after runtime registration. No drift dismissed just because global vision is green.
- [ ] Actual motion footage and before/after contact/crop evidence for every applicable action/facing, including role-specific list above. Capture source commit/hash/dirty state known.
- [ ] Character load/decode/cache costs meet CMR-03 limits; unused kinds not all loaded at boot; restart/cancel/evict tested as relevant.
- [ ] Earlier accepted fighters/Guan Yu reference remain unchanged; normal play remains opt-in and defaults legacy until owner activates.
- [ ] All applicable checks pass with documented baseline-only exceptions; unresolved task defects keep IN_PROGRESS/BLOCKED, not DONE.

The three-round Acceptance-4 [repair-only reserve](../MOTION_ACCEPTANCE4_RECOVERY.md) is shared with this fighter’s A task. If runtime evidence reveals a *new* actual source-art defect, diagnose and reserve a focused repair; do not silently repurpose it for general polish, loosen checks or reset the task-iteration limit.

## Verification/handoff

Run targeted profile/pack/frame units, actual fighter action/mixed/interactions browser tests, lint/typecheck, vision/prodbuild. Run signal for timing adapter/AI observer/paired behavior changes; independent producer review follows existing cadence. Report known G6/UIR-19 failures separately and permit no new failures. Budget is shared with A. Local scoped commit; subsequent character waits for this task's DONE prerequisites, not partially loaded art.
