### CMR-10B - Zhao Yun: integrate/review in motion

- Status: DONE (attempt 1; 2026-10-03, verified). Pack registered
  behind ?motion=1 (56 frames, 21MB exception honored); 20-clip
  table + dispatch + validator from zy.* core windows (rider swap
  handled); 22 new unit tests; canvas+webgl captures green (73
  rows, 0 errors); all actions reviewed passing (self-check);
  gates: units 905+6 (G6 only), e2e motion 12/12, vision 5/5,
  prodbuild 8/8, signal 13/13, lint+tsc clean. Evidence:
  [review](docs/ZHAOYUN_ACTION_REVIEW.md). CMR-11A is unblocked.
- Dependency: CMR-10A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-10B](docs/motion-tasks/CMR-10B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic zhaoyun pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

