# CMR-03 — Stage-aware bounded atlas loading and cache

- Queue status: DONE (attempts 1-3, 2026-10-01; attempt 3 verified same day) (live queue TASKS.md is authoritative).
- Dependencies: CMR-02 DONE; no dependent task starts after a failed prerequisite.

## Read first

[Shared contract](../CAST_MOTION_ROLLOUT.md), CMR-01 baseline/inventory, generic profiles, `src/game/adapters/motion-art.ts`, `src/game/scenes/{BootScene,GameScene}.ts`, resource publishers, texture lifecycle, co-op join and stage/restart code. Inspect Phaser's local atlas APIs; do not infer WebGL support from headless canvas alone.

## Bounded work

1. Catalog packs per kind with named atlas pages, content verification and cached request state. Publication is atomic per fighter: all required pages/clips valid, or whole legacy rendering for that fighter/stage. Other valid fighters remain published.
2. Load the selected hero, stage-immediate kinds and default second player. Prefetch future kinds within budget before first appearance. Do not preload the cast at the title. Preserve resource fields when body/face/horse/weapon/motion publishers run asynchronously.
3. Display shared atlas frames with trim-offset/pivot restoration instead of cloning every cell to a canvas. Repack Guan Yu as necessary, proving displayed RGBA, scale, pivots and exposures unchanged.
4. Implement reference counting/cache eviction, cancellation on scene exit/restart, stale-callback rejection and protection of in-use textures. No per-render retry; no changes to core clocks/AI. Prepare initial packs before introducing the stage/actor to simulation.
5. Co-op: cached/default heroes are ready for immediate join. Prepare an uncached optional/debug hero before core join; bounded failure settles on whole legacy rendering before join. Cover duplicate requests/joins, failure and near-capacity cache behavior.

## Hard acceptance

- [x] Pages ≤2048×2048, density 2; decoded motion ≤16 MiB/humanoid, retained motion cache ≤128 MiB; added stage-entry downloads ≤12 MiB. Separate network, source/decode, GPU and cloned-canvas estimates; do not hide legacy fallback cost. (Measured: 1,935×903 + 2,027×1,055 pages, density 2; network/source 4,328,499 B measured live; page RGBA decode 15,543,160 B = 14.82 MiB ≤ 16 MiB; GPU = one upload per page, 15,543,160 B; cloned-canvas 0 B for shared-atlas display; legacy fallback cost reported, never hidden.)
- [x] No all-cast boot downloads; fixture tests prove stage/hero/2P/prefetch scope. (BootScene queues nothing motion-related; `motion-scope` fixtures + `motion-runtime` fixtures + `e2e/motion-loader.spec.ts` + `prodbuild/motion.spec.ts` prove 0 requests at title and exactly 2 page fetches at stage entry.)
- [x] Missing/corrupt/wrong-signature/timeout/unsupported packs reject the whole fighter without clearing other valid art. Meaningful negative controls prove this. (All five classes unit-tested with sibling-art retention; missing/wrong-signature/timeout additionally exercised in-browser via route interception.)
- [x] Late callbacks, duplicate concurrent requests, failed loads, restart, co-op, stage progression and eviction covered. (Unit: stale-callback rejection, shared in-flight installs, retry-after-failure, refcounted LRU eviction with texture/registry uninstall; browser: restart + stage progression re-download nothing, co-op immediate and prepared-then-join paths.)
- [x] Trim/pivot round-trip matches original pixels/registration. No down-pose enlargement or foot/head shifts; Guan Yu reference unchanged. (Attempt 2: all 90 frames round-trip to the CMR-01 frozen RGBA. Attempt 3: shared atlas frames carry the trim rect at (trimX, trimY) in the full 448×288 cell with `Frame.setTrim`; `prodbuild/motion.spec.ts` pins the runtime frame geometry and pivots on Canvas and WebGL, identical to the old per-cell clone draw.)
- [x] Runtime remains opt-in. Flag/default/request behavior tested against actual dist and Canvas/WebGL. (`npm run prodbuild` runs the flag matrix on both renderers against the built bundle.)

## Verification record (attempt 3)

- Gates: lint + `tsc --noEmit` clean; unit `759 passed | 1 failed | 6 skipped`
  (the 1 failure is the known G6 V-15b arm-chain pin, UIR-16 BLOCKED);
  `npm run signal` 13 passed; `npm run vision` 5 passed; `npm run prodbuild`
  8 passed (4 motion cases across Canvas/WebGL); `e2e/motion-loader.spec.ts`
  5 passed; `guanyu-solo-ko` + `guanyu-transitions` 3 passed; the inline
  missing-pack negative controls in `guanyu-actions`/`motion-look` passed.
- Budgets re-measured at the stricter whole-page decode accounting (14.82 MiB
  ≤ 16 MiB); the earlier 12.72 MiB figure counted trimmed content area only.
  No ceiling was raised.

## Checks and limits

Run units, loader/stage/co-op/restart browser cases, lint/typecheck, signal, vision and prodbuild. Use GA ports owned by the suites. If a budget is not achievable, report measurements and block; do not raise ceilings or insert legacy parts into missing poses. No new cast generation or default activation. Local scoped commit; hand off to CMR-04.
