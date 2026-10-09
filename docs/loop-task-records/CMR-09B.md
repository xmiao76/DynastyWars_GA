### CMR-09B - Zhang Fei: integrate/review in motion

- Status: DONE (attempt 1; 2026-10-03, verified). Zhangfei pack
  registered + published behind ?motion=1 (catalog entry, 20-clip
  table, dispatch, validator; 22 MiB owner exception with the
  pipeline gate now counting page pixels); captures green both
  renderers (73 rows, 0 errors, 37 crops each) with the fighter
  review in docs/ZHANGFEI_ACTION_REVIEW.md; per-kind collapseTail
  fixed a 34-tick legacy leak after throws (guanyu/mooks provably
  unchanged); gates green (units 883|1-known-G6|6, motion e2e,
  vision 5/5, prodbuild 8/8, signal 13/13; full e2e shows only the
  two known-intermittent flakes, green in isolation). Evidence:
  [review](docs/ZHANGFEI_ACTION_REVIEW.md) /
  [PROVENANCE.md](art/motion/zhangfei/PROVENANCE.md).
  CMR-10A is unblocked.
- Dependency: CMR-09A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-09B](docs/motion-tasks/CMR-09B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic zhangfei pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

