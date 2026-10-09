### CMR-08B - Wei Archer: integrate/review in motion

- Status: DONE (attempt 1; 2026-10-02, verified). Full review report in
  [ARCHER_ACTION_REVIEW.md](docs/ARCHER_ACTION_REVIEW.md): canvas+webgl
  contact sheets (1280x2240, fingerprinted) + 15 enlarged crops reviewed,
  all 13 shooter actions both facings on `motion-source:archer` (100/100
  rows, 0 legacy), four distinct firing phases with release-arrowless
  correctness, no legacy blends, stable bookends/identity, renderer parity
  (only pixel delta is the pre-existing canvas-absent/webgl-present
  hitstun tint, reproduces soldier). Honest limits recorded: dying crops
  show lowCollapse continuity (true dying drawings unit-pinned), second
  shoot/idle samples show live AI walk-on. Full gate battery green:
  lint+tsc clean, units 858|1-known-G6|6 + targeted 16/16, captures
  self-check green both renderers (50 rows, 0 errors, 0 blanks, 2 same
  opens), vision 5/5, prodbuild 8/8 (4-pack pilot), signal 13/13 zero
  violations. CMR-09A is unblocked; producer verifies independently on
  fresh captures per bounded work 6.
- Dependency: CMR-08A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-08B](docs/motion-tasks/CMR-08B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic archer pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

