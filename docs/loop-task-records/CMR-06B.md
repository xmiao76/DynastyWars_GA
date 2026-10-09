### CMR-06B - Wei Soldier: integrate/review in motion

- Status: DONE (attempt 1, 2026-10-02, verified). Full review report in
  [SOLDIER_ACTION_REVIEW.md](docs/SOLDIER_ACTION_REVIEW.md): canvas+webgl
  contact sheets + 8 enlarged crops reviewed (fingerprint-verified), all
  actions both facings on `motion-source:soldier` (76/76 rows), no legacy
  blends (early scare adjudicated as thumbnail misread), dead renders at
  alpha 0 by design, hitstun tint + i-frame blink verified on motion art,
  renderer parity confirmed. Full gate battery green: lint+tsc clean, unit
  822|1 known G6|6, captures self-check green both renderers, vision 5/5,
  prodbuild 8/8 (two-pack built-app assertions), signal 13/13 zero
  errors/violations. CMR-07A is unblocked; producer verifies independently
  on fresh captures per bounded work 6.
- Dependency: CMR-06A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-06B](docs/motion-tasks/CMR-06B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic soldier pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

