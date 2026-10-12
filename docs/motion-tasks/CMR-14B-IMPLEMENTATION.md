# CMR-14B runtime package — CMR-14B-integration-01

2026-10-11, single foreground writer, started 18:21:11Z; parent retains runner/lock authority. **Runtime package implemented; CMR-14B remains IN_PROGRESS. Parent manager critical-code acceptance review is required.** No independent review receipt is claimed.

## Delivered

- New [emitter](../../scripts/emit-xiahoudun-runtime.mjs) reads the direct prepared root, pins manifest SHA before emission, decodes the sole page to check actual dimensions/cap, copies PNG bytes unchanged and emits the existing 48×32 premultiplied-RGBA signature. Metadata retains source manifest provenance and exact `charge.dash.long`/`sword.combo`/`sword.heavy` bindings.
- New [clip/validator module](../../src/game/art/motion-clips-xiahoudun.ts): 39 exact keys (9 + 6×5), single page, density2, finite safe-integer rectangles/trims/full-cell registration, exact DOWN alias only, foreign overlaps/unknown cell fields/missing or extra frames rejected. All sheet labels use the canonical single texture; a second action-page label cannot hide collisions.
- Targeted [adapter additions](../../src/game/adapters/motion-art.ts) register catalog URLs/hash/bytes, atomic validator/publication/dispatch and collapse tail. Enemy thrown presentation observes x displacement divided by its actual constant vx, because enemy AI stops stateTick; unchanged x under hitstop adds no age, skipped renders account for displacement, no core clock/state mutation. Other fighter routes remain unchanged.
- [Runtime metadata](../../src/game/assets/motion/xiahoudun-prepared.json) and [PNG](../../src/game/assets/motion/xiahoudun-motion-sheet.png): one physical asset; actions share the same URL/image; 39 shared frames, 38 unique rectangles; `getup:0.aliasOf = fall:4` and all geometry identical.
- New [45 meaningful unit tests](../../test/game/motion-xiahoudun.test.ts) cover all frame records/states/ticks, every startup/active/recovery tick, alias/geometry controls, history/freeze/skip/low-collapse, real PNG/hash/signature/atomic fallback, resource caps, dynamic stage scope and preservation of valid sibling art. The only existing test change is the explicitly failed obsolete unsupported-kind expectation in [runtime tests](../../test/game/motion-runtime.test.ts#L269), now Xu Chu.

## Exact resources/provenance

| Item | Actual |
|---|---|
| Prepared source manifest SHA256 | `fe106479291229eb871ea68d01e3fb7f69c6a4e99fa52eadb0f49968bc4814f1` |
| PNG SHA256 | `e1fdf7e8ea2b4128e6c0380e407e79ca8c985ceb63b09a056097da6dd85af34f` |
| Source/download bytes | 2,220,630 |
| Actual decoded dimensions | 2044×1589, each ≤2048 |
| Decoded/GPU bytes | 12,991,664 / 16,777,216 cap |
| Cloned-cell canvas bytes | 0 |
| Full cell | 520×436 at density2; box260×218, groundY210 |

Source atlas equality is tested with Buffer.equals; source manifest hash is rechecked by emitter/test. No prepare rerun, source-art edit, generation, cap/budget edit, core gameplay edit, default activation, commit/push/deploy or runner/control write. Prior dirty changes and A art were not edited. No nested/background worker or intentional background shell started.

## Actual checks and corrections

- `node scripts/emit-xiahoudun-runtime.mjs`: PASS; [actual output](../../artifacts/CMR-14B/emit-runtime.log).
- BEFORE `npm run review:capture`: PASS **3 browser tests + 1 anatomy test**, 41 screens. Original output copied to [baseline index](../../artifacts/CMR-14B/before-review/anatomy/index.json), no new V finding assigned; [UTF-8 command log](../../artifacts/CMR-14B/before-review-command.utf8.log).
- First focused command below: **112 PASS / 3 FAIL**. Failures: obsolete xiahoudun-unsupported expectation; costly Vitest deep comparison of a 2.2MB Buffer timed out; mistaken expectation of stage1 future-prefetch budget. Same-package targeted fixes: unsupported Xu Chu; exact Buffer.equals comparison; assert actual cap-preserving deferral instead of raising budget. Runtime implementation did not require weakening a gate.
- Re-run `npm run test -- test/game/motion-xiahoudun.test.ts test/game/motion-lidian.test.ts test/game/motion-runtime.test.ts test/game/motion-catalog.test.ts test/game/motion-scope.test.ts test/game/motion-repack.test.ts test/game/motion-transitions.test.ts`: **115/115 PASS, 7/7 files**, 33.96s. New suite45, LiDian19, runtime13, catalog14, scope6, repack3, transitions15.
- `npm run lint`, `npm run typecheck`, `git diff --check`: PASS (existing CRLF advisories only).
- AFTER `npm run review:capture`: PASS **3 browser tests + 1 anatomy test**, 41 screens; [after index](../../artifacts/CMR-14B/after-review/anatomy/index.json), [command log](../../artifacts/CMR-14B/after-review-command.utf8.log). Opened before/after stage sheets and [Xiahou Dun legacy pair](../../artifacts/CMR-14B/after-review/anatomy/xiahoudun-pair.png): stage backgrounds/HUD/intro/horse and legacy 14-move sheet visibly retained. These are **legacy/default regression evidence only, NOT new motion verification**.
- Full unit, motion-browser e2e, vision, signal, build/prodbuild and genuinely independent fresh motion review: **UNRUN in this package**.

## Exact next required package / capture destinations

Do not run the unchanged motion capture runner and claim valid Xiahou provenance: [capture runner](../../scripts/motion-capture.mjs#L57-L64) currently lacks Xiahou Dun in its single-page provenance branch; [browser harness](../../e2e/motion-capture.spec.ts#L78) starts stage1, whose capped scope does **not** prefetch Xiahou Dun (stage1 current packs + 2,220,630B would exceed12MiB). Both require targeted next-package authorization to bind the correct prepared metadata and start/load the actual stage2 boss before sampling. This package intentionally did not edit capture tooling outside its write scope.

After those fixes, serialize actual-motion commands (test-owned5177, no overlapping browser suites):

```sh
node scripts/motion-capture.mjs --fighter xiahoudun --role boss --enemy xiahoudun --renderer canvas --out artifacts/CMR-14B/motion-review
node scripts/motion-capture.mjs --fighter xiahoudun --role boss --enemy xiahoudun --renderer webgl --out artifacts/CMR-14B/motion-review
```

Required intended destinations are `artifacts/CMR-14B/motion-review/xiahoudun-canvas/` and `artifacts/CMR-14B/motion-review/xiahoudun-webgl/` (NOT created yet): indexed traces/contact sheets/frame crops and owner-playable native clips, both facings/all applicable actions. Add real AI/enrage/charge/damage/grab/throw interaction and mobile-landscape verification, then relevant motion-loader/look e2e, vision/signal/prodbuild; fresh independent producer review remains mandatory.

Carry [CMR-14A limitations](../../art/motion/xiahoudun/closeout-campaign/FINAL-ACCEPTANCE.md#L19-L28) unchanged: measured weapon failures remain source-specific waived values, head anatomy UNVERIFIED owner-accepted, heavy/guard size mismatch and weaker fall:3 accepted, hidden3D/normal-speed continuity not certified by unit/legacy capture passes.
