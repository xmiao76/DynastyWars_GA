# CMR-23 — Paired grabs/throws (on foot); sole-motion pre-flip validation gate

- Initial queue status: TODO; attempts start at zero. Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: all per-character B tasks DONE (see live Requires in TASKS.md).
- Scope explicitly includes both participants' presentation in paired actions; no core changes.
- **Migration role (2026-10-14, [sole-motion migration](../MOTION_SOLE_MODE_MIGRATION.md) Phase 1):** this task is the pre-flip validation gate. The default flip, wave-split loading changes and any legacy deletion are **not** part of this task and must not start before CMR-23 is DONE. CMR-23 itself remains validation work on the current opt-in (`?motion=1`) path; passing it authorizes the later CMR-24 phase slices, it does not itself flip anything.

## Read first

[Shared contract](../CAST_MOTION_ROLLOUT.md), contact/held/throw manifests/reports, Guan Yu interaction evidence, core grab/throw routines read-only, motion history/composition and grab/throw tests.

## Bounded work

1. Capture/test **5 heroes × 6 current enemy kinds × 2 facings** holding, release, throw, impact and getup. Use real walking grab/input throw for representative normal cases; label injection for remaining combinations.
2. Use proper upright held animation, never a prone opponent underneath a standing collar reach. Compare differing heights, weapons and capes against contact neighborhoods.
3. Per-pack contact landmarks/pivots and presentation-only paired offsets/depth are allowed. Core grab pin stays 16 px; range/hitboxes/damage/physics unchanged. Do not distort/scale bodies or move core entities to fake alignment.
4. Cover co-op/multiple grabbers, timeout, grab broken by hit, target death, throw flight/low impact, scene exit and load fallback (current opt-in-era fallback behavior is what gets validated here; retry-then-error arrives in migration Phase 2 under CMR-24).
5. If focused art repair is required, use only remaining per-character A/B budget. No reset; exhaustion requires owner input. Preserve each character's original acceptance/progress evidence.
6. Report sole-motion loading feasibility at current pack sizes: per stage and hero/co-op combination, the per-spawn-wave download split (heroes + first-wave kinds = wave 0) against the unchanged ≤12 MiB cap, naming any wave that cannot fit. This is measurement/reporting only — no loader, budget or default changes in this task.

## Acceptance

- [ ] Exhaustive pair matrix links real image/trace evidence and labels unreviewed cells. Required pairs accepted before DONE.
- [ ] Holder hand/collar-or-shoulder contact gap ≤3 logical units in supported comparable views; feet within 1.5 units of intended ground. No floating arms, prone held poses or unexplained weapon collisions.
- [ ] Both facings/body-height differences checked; occlusion and depth reported rather than dismissed by state names.
- [ ] Release/throw/impact/getup continuous with identical core physics. Pause/hit-stop/restart/co-op remain correct.
- [ ] Pixels outside explicitly authorized focused fixes unchanged.
- [ ] Contact negative controls prove wrong pose/offset fails; runtime/resource checks pass.
- [ ] Per-wave ≤12 MiB feasibility report published for every stage/hero combination (migration Phase 1 exit evidence); any non-fitting wave is named as a Phase 3 blocker, not waived or cap-raised.

## Checks

Contact units, exhaustive browser tick/texture coverage, representative real recordings/crops, lint/typecheck, signal, vision/prodbuild. Fresh independent producer pairs follow self-check. No default flip, loader-semantics change, legacy deletion, push or deploy in this task — those are CMR-24's ordered migration slices after this gate passes. Local commit; hand off to CMR-24. This integration task does not authorize unlimited generation.
