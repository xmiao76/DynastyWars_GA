# CMR-24 — Sole-motion final gate (default-flip evidence + post-delete verification)

- Initial queue status: TODO; attempts start at zero. Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: CMR-23 DONE (the pre-flip validation gate) and every foundation/character task transitively.
- **Rewritten 2026-10-14** under the owner-approved [sole-motion migration](../MOTION_SOLE_MODE_MIGRATION.md). This task supersedes its former "full-cast verification and owner presentation; MUST NOT make motion default" form: that prohibition belonged to the opt-in era and is replaced by the staged sequence below. The former verification/presentation content is preserved inside Parts A and B; nothing is deleted early and no gate is weakened.

## Role and ordering

CMR-24 is the sole-motion final gate and carries migration Phases 2–6 as bounded, separately committed slices, in this exact order. One slice per consumer iteration; a slice starts only on the previous slice's recorded exit evidence.

1. **Phase 2 slice — wave-split loading + retry-then-error (still opt-in).** Per-spawn-wave stage scope under the unchanged ≤12 MiB cap (heroes + first-wave kinds ready before entry; later-wave/boss kinds published before their first spawn; pending co-op join waits for its pack). Missing/corrupt/timed-out/over-budget required packs get bounded retries then a visible blocking error — never silent legacy, partial packs or old poses in a new pack. Convert the opt-in fallback tests to error-path negative controls (missing, corrupt, forged, hung, over-budget wave). The default legacy URL is behaviorally unchanged by this slice.
2. **Phase 3 slice — default flip.** Motion on for the normal URL; temporary `?motion=0` is the only escape to the still-present legacy renderer, for diagnosis/rollback only. Re-point off-by-default expectations. No legacy deletion in this slice.
3. **Part A gate (Phase 4) — default-flip evidence, before any deletion.** Full verification at the exact Phase 3 commit (below). Legacy deletion is forbidden until Part A acceptance is fully checked; on failure retain IN_PROGRESS/BLOCKED and roll back via `?motion=0` or reverting the flip slice.
4. **Phase 5 slice — legacy deletion (final slice).** Only after Part A passes: delete the legacy paper-doll/rig renderer and its exclusive assets/tests, the whole-fighter fallback paths, `?motion=0` and the mode switch. Core simulation, gameplay timing and pack pixels do not change. Every retired legacy-only gate (e.g. G6 arm-chain, UIR-19 hand test) is listed as retired-by-deletion, never reported as newly green.
5. **Part B gate (Phase 6) — post-delete verification.** Full serial gates and fresh whole-cast review on the post-delete tree; prove the built bundle is sole-motion only. CMR-24 is DONE only after Part B.

## Read first

[Sole-motion migration plan](../MOTION_SOLE_MODE_MIGRATION.md) (authoritative for this task), [shared contract](../CAST_MOTION_ROLLOUT.md), CMR-23's DONE evidence including its per-wave ≤12 MiB feasibility report, live queue/progress, inventory/provenance/budget/performance reports, all individual review statuses and independent producer findings. Existing visual-review rubric/cadence remains authoritative. One good hero is not whole-cast acceptance.

## Bounded work — Part A (at the Phase 3 flip commit)

- Final serial verification: lint, typecheck, units, e2e, signal, vision, build, prodbuild and fresh full motion-aware visual review — on the **default URL** (no `motion` parameter), plus one explicit `?motion=0` pass proving the temporary escape still works pre-deletion.
- Review all 11 humanoids in actual game: applicable actions/attacks/states/transitions, both facings, three stages, co-op, desktop/mobile landscape, Canvas/WebGL and important before/after pairs. No old parts/rig in-betweens in any published pack; no unmigrated cast.
- Prove failure semantics on the default path: each negative control (missing/corrupt/forged/hung/over-budget-wave pack) ends in bounded retry then the visible blocking error, with zero legacy frames rendered and other fighters' packs uncorrupted.
- Check resource budgets as wave-split: per-stage/per-hero wave-0 and later-wave bytes ≤12 MiB, decoded/cache ceilings, prefetch-before-spawn, late join, restart/eviction, clocks, projectile/charge/enrage/KO/revive, pause and frozen simulation. Use normal-paced real-input/AI clips, not only injected pose grids.
- Publish `docs/CAST_MOTION_REVIEW.md` and an indexed owner review page with videos/crops, coverage, provenance, exact commits, independent review status, quality measures and per-wave download/decode/frame-time costs. Label all unchecked/unaccepted areas.

## Bounded work — Part B (on the post-delete tree)

- Repeat the full serial gate set and a fresh whole-cast motion review after the Phase 5 deletion slice, at its exact commit.
- Prove sole-mode exclusivity: no legacy renderer/fallback code path remains (grep + runtime evidence), URL mode parameters have no rendering effect, `?motion=0` is gone, the built bundle downloads no legacy fighter art, and the retry-then-error controls still fire.
- Reconcile historical pilot/legacy findings carefully. List every gate/test retired by deletion and every documented baseline exception it replaced; never claim the old G6/UIR-19 failures "became green". Update `docs/CAST_MOTION_REVIEW.md` and the indexed review with pre/post-delete results.

## Acceptance

Part A (all required before Phase 5 may start):

- [ ] CMR-23 DONE with evidence; Phases 2–3 slices committed in order with their exit evidence; no partial packs/placeholders.
- [ ] Every required cast action/facing/transition and the paired matrix reviewed on the default URL; no open new S1/S2 motion defects. Fresh producer review confirms results.
- [ ] Identity/weapon/head/body/foot/pivot criteria unchanged. Guan Yu reference preserved and historical limitations transparent.
- [ ] All serial gates pass or are exact documented owner-accepted baseline exceptions; no new failures or false full-green report.
- [ ] Wave-split budgets measured and met; no full-cast boot downloads, frame-canvas duplication or cache leaks. Retry-then-error negative controls pass with zero legacy frames.
- [ ] Owner can open the complete indexed review/videos and understand limits; native video inspection or its absence documented.

Part B (all required for DONE):

- [ ] Phase 5 deletion slice committed after Part A; legacy renderer, fallback paths, `?motion=0` and the mode switch verifiably absent; core/pack content unchanged by that slice.
- [ ] Full serial gates + fresh whole-cast review pass on the post-delete tree (same baseline honesty; retired gates listed, not hidden).
- [ ] Built bundle proven sole-motion only; error path intact; indexed review updated with post-delete evidence and remaining limitations.

## Completion / stop

If any acceptance item fails, retain IN_PROGRESS or concrete BLOCKED evidence at the exact phase reached — never skip ahead (in particular, never delete legacy on a failed or partial Part A). Do not start another full-cast generation batch, invent tasks, reset budgets, raise caps or weaken a gate to pass. Rollback per the migration plan: `?motion=0`/revert of the flip slice pre-deletion, revert of the deletion slice after it. When Part B verifies, make the scoped local report/verification commit and hand off to the owner; deployment remains owner-manual. No push/deploy or scheduling changes.
