# CMR-05 — Capture/review the actual whole-character motion path

- Initial queue status: TODO; attempts start at zero. Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: CMR-04 DONE.

## Read first

[Shared contract](../CAST_MOTION_ROLLOUT.md), [visual review](../VISUAL_REVIEW.md), [ledger](../UI_REVIEW_LEDGER.md), existing capture runner/anatomy generation, Guan Yu action/transition/mixed/interaction tests and vision sprite gates. Current review capture mostly drives legacy URLs/rigs; do not call that whole-motion verification.

## Bounded work

1. Parameterize per-kind/role captures from the inventory: actual state/attack/tick traces and player/AI/projectile provenance, named actions, both facings, Canvas/WebGL and mobile landscape.
2. Extend existing capture to include opt-in motion and actual decoded/drawn frames, not old rig anatomy relabelled as new evidence. Preserve legacy coverage, ledger cadence/pinning/rubric and independent verification.
3. Capture isolated actions plus real mixed choreography. Prefer real hit/grab/throw/projectile/charge/enrage paths. Label injected defensive stress cases separately from normal gameplay.
4. Keep before/after pairs across rotations with commit/dirty/source hashes, pack versions and ground/contact/weapon landmarks. Gameplay-size/4x crops account for camera scroll and contain full boots/head/blade.
5. Add pacing/resource reports and new-path quality gates. Producers independently verify fresh captures; consumers only self-check or mark fixed-unverified.
6. Negative controls reject unknown frames, old/new texture mixing, blank/missing packs, residue, missing bindings, stale provenance and clock defects. Null/unseen landmarks cannot pass.

## Acceptance

- [ ] Documented per-fighter/role capture command uses actual runtime frames and keys.
- [ ] Guan Yu's 33 existing technical controls (and foundation extensions) remain meaningful; real action/mixed and default legacy gates preserved.
- [ ] New path has indexed before/after review and every applicable action/interruption. No unseen pose silently labelled natural.
- [ ] Shooter, charge/enrage, held/thrown, recovery/KO and co-op observability ready before first character integration.
- [ ] Owner-playable videos, contact sheets and trace links; inspection limitations and actual playback pace stated.
- [ ] Existing review policy intact; later consumer/producer evidence discoverable from queue/spec links.

## Verification

Harness negative controls/targeted units, live Guan Yu/default e2e, lint/typecheck, vision/prodbuild; signal if observation adapters change. No production cast art, threshold relaxation, default activation, scheduler or loop-policy edits. Local commit; hand off to CMR-06A.
