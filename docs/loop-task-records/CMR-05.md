### CMR-05 - Actual-motion capture/review/test harness

- Status: DONE (attempt 1, 2026-10-01 UTC, verified same day) - capture/
  review harness for the actual `?motion=1` path: `scripts/motion-capture.mjs`
  + `e2e/motion-capture.spec.ts` + `scripts/motion-review-core.mjs` (negative
  controls, coverage with honest `unseen`, pacing/resource reports,
  before/after pairs across rotations); live Guan Yu captures on canvas+webgl
  validated clean; commands documented in
  [MOTION_CAPTURE.md](docs/motion-tasks/MOTION_CAPTURE.md)
- Dependency: CMR-04 DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-05](docs/motion-tasks/CMR-05.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: New runtime path in before/after capture and independent producer review; actual sequence/state/clock coverage and meaningful negative controls.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

