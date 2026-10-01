# CMR-01 — Freeze the reference and inventory the cast

- Queue status: DONE (attempt 1, 2026-10-01; verified same day) (live queue TASKS.md is authoritative).
- Dependencies: none. Due producer review still runs before consumer selection.
- Owner priority: first character-rollout consumer task, not new artwork production.

## Read first

[Shared rollout contract](../CAST_MOTION_ROLLOUT.md), [AGENTS](../../AGENTS.md), [PROJECT](../../PROJECT.md), live [queue](../../TASKS.md), current [progress](../../PROGRESS.md), [Guan Yu review](../GUANYU_ACTION_REVIEW.md). Inspect character/enemy/attack/AI definitions, figure registry, current motion assets and published provenance.

## Bounded work

1. Freeze the accepted Guan Yu reference at planning baseline540501c. Record file/page hashes and per-displayed-frame RGBA/pivot/exposure hashes, so later atlas repacking cannot silently change pixels or timing. Pin gameplay/action evidence before edits in future tasks.
2. Publish `docs/motion-tasks/CAST_INVENTORY.md`: all17humanoids plus horse, existing original body/portrait sources, identity/weapon/build, intended screen scale, roles, reachable states/attack IDs and timing/clock sources. List explicit not-applicable and defensive stress states rather than generating hero abilities for enemies.
3. Confirm Huang Zhong's zero-active projectile special, enemy archer cadence/spawn, boss normal/enraged attacks/charges, thrown clocks, held poses and co-op riders from exact source. Do not assume attack-ID words dictate weapon appearance.
4. Publish budgets/reference baseline report under `docs/motion-tasks/BASELINE.md`: Guan Yu byte/decode/canvas-copy costs, current load behavior, target16MiB/fighter/128MiBcache/12MiBstage/page2048 limits, cap ledger for200requests across roster.
5. Reproduce existing unitG6 and sixUIR19type errors. Capture latest baseline commands/results/commit, not previously narrated green results. Record independent review findings separately.

## Acceptance

- [x] Roster/state/attack/source matrix covers all17humanoids and horse with no invented reachable capability.
- [x] Guan Yu displayed pixels, pivots and exposures pinned and recoverable; original images preserved.
- [x] Resource and generation budgets from the shared contract recorded before any generation; no limits weakened.
- [x] Known baseline failures reproduced and exact evidence distinguished from new regressions.
- [x] Next specifications CMR-02…05 can retrieve the baseline/inventory without searching progress archives.
- [x] No new character frames, gameplay or runtime implementation in this task.

## Verification and handoff

Run current relevant unit/type checks and baseline action/capture commands available in package/spec files. State which command ran and what was actually inspected. Store bulky logs/captures under ignored artifacts; committed inventory/reference report includes reproducible metadata, not secrets. Scope source-art inspection to original repository files. Record attempt/progress; local commit only. Completion is reference/inventory readiness, not whole-cast acceptance.
