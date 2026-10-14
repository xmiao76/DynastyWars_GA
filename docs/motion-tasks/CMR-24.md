# CMR-24 — Full-cast verification and owner presentation

- Initial queue status: TODO; attempts start at zero. Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: CMR-23 DONE and every foundation/character task transitively.
- Normal-play activation remains owner-only approval. This task MUST NOT make motion default.

## Read first

[Shared contract](../CAST_MOTION_ROLLOUT.md), live queue/progress, inventory/provenance/budget/performance reports, all individual review statuses and independent producer findings. Existing visual-review rubric/cadence remains authoritative. One good hero is not whole-cast acceptance.

## Bounded work

- Final serial verification at the exact cast commit: lint, typecheck, units, e2e, signal, vision, build, prodbuild and fresh full motion-aware visual review.
- Review all 11 humanoids in actual game: applicable actions/attacks/states/transitions, both facings, three stages, co-op, desktop/mobile landscape, Canvas/WebGL and important before/after pairs.
- No old parts/rig in-betweens in any successfully published pack; no unmigrated cast. Missing/corrupt pack still falls back wholly for that fighter/stage without removing other packs.
- Check resource budgets, prefetch/cache/lazy join/restart/eviction, clocks, projectile/charge/enrage/KO/revive, pause and frozen simulation. Use normal-paced real-input/AI clips, not only injected pose grids.
- Publish `docs/CAST_MOTION_REVIEW.md` and an indexed owner review page with videos/crops, coverage, provenance, exact commits, independent review status, quality measures and download/decode/frame-time costs. Label all unchecked/unaccepted areas.
- Reconcile historical pilot/legacy findings carefully. Do not delete fallback/tests or claim old G6/UIR-19 failures became green. A defect outside the primary path may remain relevant to legacy fallback.

## Acceptance

- [ ] Preceding tasks DONE with evidence, not partial packs/placeholders.
- [ ] Every required cast action/facing/transition and paired matrix reviewed; no open new S1/S2 motion defects. Fresh producer review confirms results.
- [ ] Identity/weapon/head/body/foot/pivot criteria unchanged. Guan Yu reference preserved and historical limitations transparent.
- [ ] All serial gates pass or are exact documented owner-accepted baseline exceptions; no new failures or false full-green report.
- [ ] Measured resource ceilings met; no full-cast boot downloads, frame-canvas duplication or cache leaks.
- [ ] Owner can open complete indexed review/videos and understand limits; native video inspection or its absence documented.
- [ ] Runtime remains `?motion=1`; normal URL unchanged. Activation requires a separate owner instruction.

## Completion / stop

If acceptance fails, retain IN_PROGRESS or concrete BLOCKED evidence. Do not start another full-cast generation batch. Producers may file located defects under existing policy; this consumer does not invent tasks or reset budgets. When verified, make a scoped local report/verification commit, ask for cast sign-off/default activation, then stop. No push/deploy, scheduling changes or retirement of legacy rendering.
