### CMR-09A - Zhang Fei: author/prepare full motion pack

- Status: DONE (attempt 1; 2026-10-03, verified). Owner accepted the
  acceptance-4 waiver 2026-10-03 ("waive now") by direct instruction:
  item 4 closed with documented limitation (heads 6.4% thrust-pose /
  11.2% incl. finisher; weapons 88.3% FULL / 12.9% walk / 41.9% excl
  extremes; direction ≤36° PASS). Pack prepared deterministic
  (manifest 55e09318, re-verified byte-identical at close-out; 56
  frames, 2 pages ≤2048, 15.95MiB ≤ 16MiB; lint+tsc clean, units
  858|1-known-G6|6). Continuity reviewed
  frame-by-frame on the fresh display-scale sheet + 10 strips (all 56
  frames; guards ARE walk:0, down IS fall:4, by clip convention).
  Evidence: [PROVENANCE.md](art/motion/zhangfei/PROVENANCE.md) /
  [CONTINUITY](art/motion/zhangfei/PROVENANCE.md) /
  [IDENTITY.md](art/motion/zhangfei/IDENTITY.md).
  CMR-09B is unblocked.
- Dependency: CMR-08B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-09A](docs/motion-tasks/CMR-09A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable zhangfei identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

