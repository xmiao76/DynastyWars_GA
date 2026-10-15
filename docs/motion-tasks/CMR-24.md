# CMR-24 — Practical sole-motion final gate (pre-delete + post-delete)

- Initial queue status: TODO; live status/attempt history is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: CMR-23 terminal DONE (DEFERRED_BY_OWNER / SUPERSEDED gate), with all B packs transitively DONE. No unresolved strict-art dependency.
- **Owner practical amendment (2026-10-14, work `owner-practical-motion-contract-amendment`):** supersedes the earlier strict paired-art pre-flip prerequisite. Owner accepts/defer-repair of existing contact/occlusion flaws as migration visual debt, no additional image generation, mechanics unchanged. CMR-23's **2/60 passes, 58/60 failures** stay FAIL/deferred, not PASS. Its closure automatically passes **none** of this task's mechanical/coverage/resource checks.

## Authority and history

Read the authoritative [migration plan](../MOTION_SOLE_MODE_MIGRATION.md), [shared contract](../CAST_MOTION_ROLLOUT.md), [CMR-23 disposition/history](CMR-23.md), [durable checkpoint](CMR-23-STATUS-20261014.md), live queue/progress, provenance/budget/performance reports and individual review limitations. Preserve original attempts, failed runs, source hashes and ledger **197/200**; no reset, new spend or generation.

Wave/retry and epoch/decode fixes **pre-existed gated review** (`2fb279a`, `77d6d3e`, runtime `523684c`, production correction through `4bc0cdd`). Recorded targeted units 140, browser 8, vision 5 and production 14 passing are opt-in/implemented-code evidence, **not default-URL verification**. Do not retroactively phase-order that work or count it as this task's acceptance.

## Ordered bounded slices

1. **Phase 2: review existing loading work.** Verify per-wave ≤12 MiB scheduling, heroes/first-wave before entry, future kinds before spawn and join hero before core join. Review existing wave/retry/error implementation; fill only proven gaps under separately bounded scope. Required missing/corrupt/forged/hung/over-budget packs must retry boundedly then show a blocking error, never legacy or partial-pack substitution. Preserve atomic publication, cancellation and sibling/new-episode isolation.
2. **Phase 3: default flip, temporary rollback.** Normal URL uses motion; temporary `?motion=0` reaches complete legacy only for diagnosis/rollback. Verify exact-commit actual default and escape paths in the built bundle. No legacy deletion yet.
3. **Part A / Phase 4: practical pre-delete verification and independent review.** All checkboxes below green before deletion; known owner-deferred contact/occlusion debt remains transparent, not a strict-art pass prerequisite.
4. **Phase 5: legacy-only deletion.** Only after green Part A and independent review: inventory/remove legacy-only code, art, config, tests, scripts, switches/fallbacks and live requirements; preserve all assets/tools/config/tests shared with motion or other supported behavior. Record every retired gate as retired-by-deletion, not newly green. No pack-pixel or core/mechanics change; no archive/history/ledger rewrite.
5. **Part B / Phase 6: repeat essential checks and bundle exclusivity.** CMR-24 DONE only after post-delete evidence and independent review. Each slice is separately scoped/locally committed; no false implementation order for pre-existing fixes.

## Part A acceptance — all required before any deletion

- [ ] CMR-23 explicit terminal disposition recorded (not original acceptance); practical checks below independently evidenced at exact commits, no partial packs/placeholders.
- [ ] Actual **default URL, no motion parameter**, loads/publishes motion in production; explicit temporary `?motion=0` rollback works. Existing opt-in success is not substituted.
- [ ] All 11 fighters' applicable actions/states/transitions/ticks and both facings covered by loaded/published frame/texture traces and actual-game captures: no blank/missing frames, old rig leakage or mixed packs. Paired hold/release/throw/impact/getup, timeout, hit break, target death, co-op/multiple grabbers mechanically covered without demanding deferred contact-art repair.
- [ ] Title/select/menus/overlays/results/game-over, all three stages, solo/co-op/late join, KO/revive, pause/hit-stop/restart/exit, mobile portrait/landscape and Canvas/WebGL work. Timing, range, damage, speed, physics, grab pin and deterministic core unchanged.
- [ ] Every stage/hero/co-op wave split meets ≤12 MiB; decoded pixels ≤16 MiB/humanoid, retained cache ≤128 MiB, pages ≤2048²/density2. PNG/network/decode/GPU/cache and frame-time/performance evidence meet existing thresholds; no full-cast title preload, frame-canvas duplication, cache leak or silent required-kind omission. Prefetch/spawn/join/cancellation/eviction checks pass.
- [ ] Default-path negative controls (missing/corrupt/forged/hung/over-budget wave) demonstrate bounded retry then visible blocking error, zero legacy frames, no sibling corruption or stale-episode publication.
- [ ] Full serial lint, typecheck, unit, e2e, signal, vision, build, prodbuild pass or report exact existing owner-accepted baseline exceptions; no new failures hidden. Known contact/occlusion debt is specifically deferred, not permission to waive other visual or mechanical regressions.
- [ ] Fresh **independent pre-delete review** confirms practical gates and deletion inventory. Indexed owner review and `docs/CAST_MOTION_REVIEW.md` carry exact commits, coverage, provenance, resources/performance, captures and normal-paced real-input/AI clips; native video inspection or its absence explicit. Historical head/weapon/contact limitations and 58/60 strict contact failures remain visible. No new unrelated blocking defects.

## Part B acceptance — all required for DONE

- [ ] Separate Phase 5 deletion commit follows green Part A and independent review; legacy-only code/art/config/tests/scripts/live requirements, fallback and mode switch are absent; shared material preserved; mechanics/pack content unchanged.
- [ ] Repeat full serial gates and essential Part A coverage/loaded frames/resources/errors/menus/co-op/stages/mobile/Canvas-WebGL/performance on the exact post-delete tree, with fresh independent review and the same baseline honesty. List retired gates (including applicable G6/UIR-19/rig grids), never claim their old failures became green.
- [ ] Source/reference search **and actual built-bundle/network/runtime evidence** prove sole-motion exclusivity: no legacy renderer/fallback/legacy-only downloads; old URL mode parameters including `?motion=0` have no rendering effect; required-pack error semantics intact.
- [ ] Indexed owner review updated with pre/post-delete results, retirement inventory and remaining owner-deferred visual debt/inspection limits.

## Stop / rollback / completion

Any unpassed practical gate keeps IN_PROGRESS or concrete BLOCKED evidence; never delete on partial/failed Part A. Known CMR-23 contact/occlusion art is not re-opened or silently repaired. No additional image generation, budget/cap/attempt reset, core change, push/deploy, runner/lock/scheduling change. Before deletion use `?motion=0` or revert the flip slice; after deletion revert the separate deletion commit. After Part B verifies, scoped local report/verification commit and owner handoff only; deployment stays owner-manual.
