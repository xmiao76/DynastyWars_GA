# CMR-23 — Paired grabs, throws and rider contact integration

- Initial queue status: TODO; attempts start at zero. Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: CMR-22 DONE and all per-character B tasks transitively.
- Scope explicitly includes both participants' presentation in paired actions; no core changes.

## Read first

[Shared contract](../CAST_MOTION_ROLLOUT.md), contact/held/throw manifests/reports, Guan Yu interaction evidence, core grab/throw routines read-only, motion history/composition and mounted tests.

## Bounded work

1. Capture/test **5 heroes × 6 current enemy kinds × 2 facings** holding, release, throw, impact and getup. Use real walking grab/input throw for representative normal cases; label injection for remaining combinations.
2. Use proper upright held animation, never a prone opponent underneath a standing collar reach. Compare differing heights, weapons and capes against contact neighborhoods.
3. Per-pack contact landmarks/pivots and presentation-only paired offsets/depth are allowed. Core grab pin stays 16 px; range/hitboxes/damage/physics unchanged. Do not distort/scale bodies or move core entities to fake alignment.
4. Cover co-op/multiple grabbers, timeout, grab broken by hit, target death, throw flight/low impact, scene exit and load fallback.
5. Recheck all hero/horse pairs after CMR-22, using actual rider ownership. Correct binding/registration, not accepted regular drawings.
6. If focused art repair is required, use only remaining per-character A/B budget. No reset; exhaustion requires owner input. Preserve each character's original acceptance/progress evidence.

## Acceptance

- [ ] Exhaustive pair matrix links real image/trace evidence and labels unreviewed cells. Required pairs accepted before DONE.
- [ ] Holder hand/collar-or-shoulder contact gap ≤3 logical units in supported comparable views; feet within 1.5 units of intended ground. No floating arms, prone held poses or unexplained weapon collisions.
- [ ] Both facings/body-height differences checked; occlusion and depth reported rather than dismissed by state names.
- [ ] Release/throw/impact/getup continuous with identical core physics. Pause/hit-stop/restart/co-op remain correct.
- [ ] Hero/horse interfaces accepted; pixels outside explicitly authorized focused fixes unchanged.
- [ ] Contact negative controls prove wrong pose/offset fails; runtime/resource checks pass.

## Checks

Contact units, exhaustive browser tick/texture coverage, representative real recordings/crops, lint/typecheck, signal, vision/prodbuild. Fresh independent producer pairs follow self-check. No default activation/push/deploy. Local commit; hand off to CMR-24. This integration task does not authorize unlimited generation.
