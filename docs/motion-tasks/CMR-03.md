# CMR-03 — Stage-aware bounded atlas loading and cache

- Initial queue status: TODO; attempts start at zero. Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: CMR-02 DONE (and CMR-01 transitively).

## Read first

[Shared contract](../CAST_MOTION_ROLLOUT.md), CMR-01 baseline/inventory, generic profiles, `src/game/adapters/motion-art.ts`, `src/game/scenes/{BootScene,GameScene}.ts`, resource publishers, texture lifecycle, co-op join and stage/restart code. Inspect Phaser's local atlas APIs; do not infer WebGL support from headless canvas alone.

## Bounded work

1. Catalog packs per kind with named atlas pages, content verification and cached request state. Publication is atomic per fighter: all required pages/clips valid, or whole legacy rendering for that fighter/stage. Other valid fighters remain published.
2. Load the selected hero, stage-immediate kinds and default second player. Prefetch future kinds within budget before first appearance. Do not preload the cast at the title. Preserve resource fields when body/face/horse/weapon/motion publishers run asynchronously.
3. Display shared atlas frames with trim-offset/pivot restoration instead of cloning every cell to a canvas. Repack Guan Yu as necessary, proving displayed RGBA, scale, pivots and exposures unchanged.
4. Implement reference counting/cache eviction, cancellation on scene exit/restart, stale-callback rejection and protection of in-use textures. No per-render retry; no changes to core clocks/AI. Prepare initial packs before introducing the stage/actor to simulation.
5. Co-op: cached/default heroes are ready for immediate join. Prepare an uncached optional/debug hero before core join; bounded failure settles on whole legacy rendering before join. Cover duplicate requests/joins, failure and near-capacity cache behavior.

## Hard acceptance

- [ ] Pages ≤2048×2048, density 2; decoded motion ≤16 MiB/humanoid, retained motion cache ≤128 MiB; added stage-entry downloads ≤12 MiB. Separate network, source/decode, GPU and cloned-canvas estimates; do not hide legacy fallback cost.
- [ ] No all-cast boot downloads; fixture tests prove stage/hero/2P/prefetch scope.
- [ ] Missing/corrupt/wrong-signature/timeout/unsupported packs reject the whole fighter without clearing other valid art. Meaningful negative controls prove this.
- [ ] Late callbacks, duplicate concurrent requests, failed loads, restart, co-op, stage progression and eviction covered.
- [ ] Trim/pivot round-trip matches original pixels/registration. No down-pose enlargement or foot/head shifts; Guan Yu reference unchanged.
- [ ] Runtime remains opt-in. Flag/default/request behavior tested against actual dist and Canvas/WebGL.

## Checks and limits

Run units, loader/stage/co-op/restart browser cases, lint/typecheck, signal, vision and prodbuild. Use GA ports owned by the suites. If a budget is not achievable, report measurements and block; do not raise ceilings or insert legacy parts into missing poses. No new cast generation or default activation. Local scoped commit; hand off to CMR-04.
