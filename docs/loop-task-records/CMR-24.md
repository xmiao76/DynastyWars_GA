### CMR-24 - Full-cast verification and owner presentation

- Status: TODO
- Dependency: CMR-23 DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-24](docs/motion-tasks/CMR-24.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: All 11 humanoids (solo + co-op) action coverage, full serial gates/independent review/resource report; indexed videos; opt-in until owner activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

## Sole-motion migration update (2026-10-14)

- CMR-24 is rewritten as the sole-motion final gate under the owner-approved [sole-motion migration](../MOTION_SOLE_MODE_MIGRATION.md): ordered Phase 2 (wave-split/retry-then-error) and Phase 3 (default flip, temporary `?motion=0`) slices, Part A default-flip evidence gate **before** any legacy deletion, Phase 5 deletion slice, then Part B post-delete verification; DONE only after Part B. The former "opt-in until owner activation / no default activation" acceptance and non-goals above are superseded prospectively by that staged owner decision and preserved here as history. Live specification: [CMR-24](../motion-tasks/CMR-24.md).

## Owner-directed motion experiment

