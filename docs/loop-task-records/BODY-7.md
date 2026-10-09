### BODY-7 - Full verification sweep for the body overhaul

- Status: BLOCKED (owner-deferred for prioritized cast rollout; sweep complete 2026-09-27 UTC, whole-cast legacy acceptance unresolved).
- Preserve prior sweep evidence and remaining acceptance criteria; this deferral is not a DONE claim or retry reset.
- Dependency: BODY-3, BODY-4, BODY-5, BODY-6 DONE.
- Requirement: whole-cast review (all fighters x poses x facings,
  desktop + mobile, co-op + mounted), byte/decode-memory/boot-time
  report, full serial gates (lint, typecheck, unit, e2e, selfplay,
  vision Canvas/WebGL parity, build, prodbuild), final owner
  presentation.
- Acceptance criteria:
  - [x] Every gate green in one serial run; report recorded (this
        round: lint 0, tsc 0, unit 635/635, e2e 78, vision 5/5,
        selfplay 13/13, build 0, prodbuild 4/4; whole-cast review of
        all 17x14 + motion, 18 flags all dismissed with evidence, no
        UIR filings; byte/decode/boot report in PROGRESS).
  - [ ] Owner accepts the final cast (unresolved objections stay open).
- Non-goals: no new art in this task; fixes only.

## Enhancements

Add future enhancement tasks below this heading.

