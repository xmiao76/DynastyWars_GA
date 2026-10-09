### CMR-11B - Wei Yan: integrate/review in motion

- Status: DONE (attempt 1, 2026-10-05 UTC, verified same day;
  CMR-11A DONE with prepared pack rev weiyan-2).
  Slice 1 DONE: emit runtime assets + clips/dispatch/validator +
  catalog wiring + 22 unit tests green (mirrors CMR-10B; NO decoded
  exception). Slice 2 DONE: capture harness wired for weiyan
  (17-action isolated lists, bindings, coverage, contract-cap
  resources); canvas + webgl captures green (73 rows each, 0
  trace/page errors, 0 hard issues, all motion art, both facings,
  coop/mixed covered); contacts (37 crops ×2) + 4 enlarged crops
  reviewed; per-action verdicts all PASS (self-check) in
  `docs/WEIYAN_ACTION_REVIEW.md`; ghost slivers disclosed as the
  known shared limitation. Slice 3 DONE: vision 5/5, prodbuild
  8/8 (motion pilot opt-in/out both renderers on built bundle),
  signal 13/13 (incl. weiyan marathon, zero violations),
  motion-loader e2e 5/5, full unit 928+6 with only known G6.
  All 8 acceptance items verified; no gameplay changes; defaults
  legacy, opt-in only.
- Dependency: CMR-11A DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-11B](docs/motion-tasks/CMR-11B.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Verified atomic weiyan pack, exact windows, no old-art leaks, actual isolated/mixed/interaction captures both facings/renderers; no gameplay changes.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

