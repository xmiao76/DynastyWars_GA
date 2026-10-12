# CMR-14B capture-01 — live runtime evidence, task IN_PROGRESS

Work ID `CMR-14B-capture-01`, sole foreground writer; parent retains runner/lock/control authority. Capture/test package only, not independent producer verification or whole-task acceptance. Existing integration/core/artwork were not edited. No generation, ledger change, commit, push, deployment, default activation or runner/control/state/schedule/policy writes.

## Delivered scope

- [Capture runner](../../scripts/motion-capture.mjs): Xiahou single-page revision/SHA/bindings; actual PNG hash/download bytes/decoded dimensions and manifest SHA verification; dirty implementation/capture source hashes. Xiahou retries retain timestamped previous runs rather than deleting failures. Absolute move targets are resolved and checked inside this repository before rotation.
- [Browser capture](../../e2e/motion-capture.spec.ts): correct boss/player identity and stage2; waits for registry publication and actual `entity:xiahoudun:motion:` selection before recording; all39 keys dispatched by real runtime state/clip selection, never forced sprite frames or raw source-image crops. Exact charge midpoint21 from `charge.dash.long`8/26/18; combo10 plus all-key second-strike11; heavy16/6/24; hitstun12. Independent poses remove/recreate the test target through normal sprite cleanup so history cannot carry across resets.
- Stable crop method: TEST PAGE scene paused during snapshot, HUD scene also paused/hidden so it cannot reintroduce pause UI. Original pause state and HUD visibility restored afterwards. Runtime rows truthfully carry `paused: true`, method and snapshotKey. Actual camera zoom/display-origin/absolute-scale/full untrimmed box used, camera reset for isolated samples; out-of-viewport crop areas retain blank padding, never clamp/reposition/stretch. Phaser renderer post-render snapshot works on WebGL. 4× logical enlarged scene crops are1040×872, full box260×218. Contact sheets use native logical-size260×218 cells with labels outside the scene pixels.
- [Four new interaction cases](../../e2e/xiahoudun-motion.spec.ts), Canvas/WebGL × both facings, viewport844×390 landscape, one worker: real Guan Yu attack damage/hit event; actual walking grab, input throw, flight/landing; AI long-charge startup/active displacement; AI threshold enrage flag/event; AI mixed combo/heavy. Initial idle/position/HP fixtures disclosed, outcomes never state-injected. This is a landscape viewport test, **not touch/hardware-device emulation**.

## Important actual default-loading finding — next integration correction

The first stage2 GU/default-ZF Canvas capture **FAILED before sampling**, because Xiahou never published. The existing stage2 unit assertion uses `secondPlayer: null` and therefore misses the actual default-partner cost. GU+ZF plus all stage2 migrated kinds needs15,555,957B >12,582,912B; current prioritization correctly defers archer/Xiahou. No loadKind/cap bypass was used.

For evidence only, this harness explicitly starts the existing scene with `charId: guanyu, char2Id: guanyu` (same-hero co-op request, shared pack), then isolates the test target. This uses the actual unchanged stage scope policy and permits five packs within cap. **It is not proof that default GU+ZF stage2 publishes Xiahou.** Parent must review a separately authorized integration-policy/priority correction and tests covering the real default partner. Capture package cannot edit integration code.

Failure screenshot/native video/error context preserved under [first default-loading failure](../../artifacts/CMR-14B/motion-review/previous/xiahoudun-canvas-1791744972241/failed-default-stage2/error-context.md).

## Actual successful outputs

| Renderer | Trace rows | Origin counts | Frame records observed | Scene crops | Final browser duration |
|---|---:|---|---|---:|---|
| Canvas |484|122 injected /362 gameplay AI|39/39 each facing; no missing keys|102|1.1min test /1.2min suite|
| WebGL |484|122 injected /362 gameplay AI|39/39 each facing; no missing keys|102|3.1min test /3.2min suite|

Each capture has0 trace errors,0 hard integrity errors,0 blank/black crops and0 snapshot-key mismatches;3 OPEN landmarks: actualground/contact/weaponTip. Coverage26 captured /8 unseen; the capture index still honestly leaves enrage/approach/retreat/stop cells unseen (separate interaction traces supplement enrage). Main mixed segment naturally observed combo; separate interaction cases observed both combo and heavy plus asserted AI charge.

- Canvas [index](../../artifacts/CMR-14B/motion-review/xiahoudun-canvas/index.json), [trace](../../artifacts/CMR-14B/motion-review/xiahoudun-canvas/trace.json), [report](../../artifacts/CMR-14B/motion-review/xiahoudun-canvas/report.json), [right39](../../artifacts/CMR-14B/motion-review/xiahoudun-canvas/all-39-right.png), [left39](../../artifacts/CMR-14B/motion-review/xiahoudun-canvas/all-39-left.png), [native video](../../artifacts/CMR-14B/motion-review/xiahoudun-canvas/xiahoudun-canvas.webm) (5,286,162B).
- WebGL [index](../../artifacts/CMR-14B/motion-review/xiahoudun-webgl/index.json), [trace](../../artifacts/CMR-14B/motion-review/xiahoudun-webgl/trace.json), [report](../../artifacts/CMR-14B/motion-review/xiahoudun-webgl/report.json), [right39](../../artifacts/CMR-14B/motion-review/xiahoudun-webgl/all-39-right.png), [left39](../../artifacts/CMR-14B/motion-review/xiahoudun-webgl/all-39-left.png), [native video](../../artifacts/CMR-14B/motion-review/xiahoudun-webgl/xiahoudun-webgl.webm) (11,395,932B).
- Landscape interaction128 rows/case + actual event receipts: [Canvas right](../../artifacts/CMR-14B/motion-review/interactions/canvas-right/trace.json), [Canvas left](../../artifacts/CMR-14B/motion-review/interactions/canvas-left/trace.json), [WebGL right](../../artifacts/CMR-14B/motion-review/interactions/webgl-right/trace.json), [WebGL left](../../artifacts/CMR-14B/motion-review/interactions/webgl-left/trace.json).
- [Combined actual summary](../../artifacts/CMR-14B/motion-review/summary.json).

Main mixed180 ticks per facing measured Canvas19,373/20,304ms and WebGL65,173/68,186ms. Manual bridge stepping/render waits are **not normal-speed gameplay**. Native videos retained owner-playable; no native video viewing tool used, no normal-pace continuity acceptance claimed. Most `paddingRows` occur after gameplay camera/actor displacement;140 trace rows/renderer report some viewport padding, not a hidden clamp. The isolated all39 sheets are complete scene crops; no claim that every mixed position remains wholly on-screen. Dead samples select new DOWN key but alpha0 is the actual defeat behavior, not a visible corpse proof.

## Actual provenance/resources

Capture commit `6617b8e`, dirty true. Both final indexes include exact source-file hashes at capture time, including capture harness/runner and existing dirty integration modules.

- Prepared manifest SHA256 `fe106479291229eb871ea68d01e3fb7f69c6a4e99fa52eadb0f49968bc4814f1` (actual rechecked).
- Runtime PNG SHA256 `e1fdf7e8ea2b4128e6c0380e407e79ca8c985ceb63b09a056097da6dd85af34f`, actual2,220,630B;2044×1589 decoded12,991,664B,0 clones, single page/revision`xiahoudun-1`.
- [Actual runtime budget](../../artifacts/CMR-14B/motion-review/xiahoudun-canvas/runtime.json): published archer/GU/soldier/spearman/Xiahou, total network/source11,519,112B ≤12MiB, retained/GPU51,512,496B ≤128MiB, Xiahou decoded≤16MiB; no cap increase.
- Image ledger Xiahou31/nominal12, summed global161/200 unchanged; no image requests. A originals, source-specific waivers and headUNVERIFIED acceptance remain unchanged.
- Ground metadata registration0 is separately labelled, **actual feet/contact remain unverified**, not groundPASS.

## Self-visual inspection and preserved corrections

Opened all four complete39-key scene sheets with image tools (both facings/both renderers), plus enlarged [Canvas heavy1 right](../../artifacts/CMR-14B/motion-review/xiahoudun-canvas/frames/key-heavy-1-right.png) and [WebGL heavy1 left](../../artifacts/CMR-14B/motion-review/xiahoudun-webgl/frames/key-heavy-1-left.png). Final sheets show unobstructed full spear tips/boots/headgear, opposite facings, separate stride silhouettes, overhead heavy arc, prone DOWN/getup0 alias and recovery levels. Heavy body remains visibly larger than guard/new reactions (already owner-carried mismatch); no new automatic scale/head/weapon waiver. WebGL hurt rows show actual red hitstun tint unlike Canvas; this renderer tint difference is disclosed, not a full parity pass. Still inspection does not certify foot planting versus displacement, hidden3D, head anatomy, weapon length gates or normal-speed transition quality.

Earlier technically green sheets had the **HUD pause card obstructing the subject**: image inspection rejected them. Root cause HudScene.update re-enabled visibility while scene was paused. Capture-only correction pauses HUD scene updates and camera reset; previous obstructed runs retained [Canvas rejected sheet](../../artifacts/CMR-14B/motion-review/previous/xiahoudun-canvas-1791745264138/all-39-right.png) and [WebGL rejected sheet](../../artifacts/CMR-14B/motion-review/previous/xiahoudun-webgl-1791745354614/all-39-right.png). This was a capture-method failure, not source-art failure/waiver.

First four landscape interaction tests failed the damage assertion because the NEW test waited only6 ticks for GU jab1 startup8. Corrected NEW test to derive startup from actual attackById; failed videos/screens retained under [failed short-windup context](../../artifacts/CMR-14B/motion-review/interactions/failed-short-windup/xiahoudun-motion-Xiahou-in-5c4c8-nvas-right-mobile-landscape-chromium/error-context.md). All four corrected cases pass; no gameplay edit or weakened assertion.

## Checks and handoff

- Serialized exact Canvas/WebGL CLI commands from the work order: final1/1 browser test each PASS and capture self-check PASS with explicit OPEN landmarks. Prior fail/obstructed versions retained.
- `npx playwright test --project=chromium e2e/xiahoudun-motion.spec.ts --workers=1`: final4/4 PASS in2.0min (after disclosed initial0/4 timing-test failure).
- `npm run test -- test/game/motion-review-core.test.ts test/game/motion-xiahoudun.test.ts`:61/61 PASS (16 review-core +45 Xiahou),2/2 files.
- Final `npm run lint`, `npm run typecheck`, `git diff --check`: PASS, existing CRLF advisories only. No source-text regex tests added.
- All autopromoted shell jobs were serialized and collected; none still running or foreign process killed.
- UNRUN here: full units/e2e, vision/signal/build/prodbuild, default partner correction, touch/device checks, interruption/restart/co-op outcome extension, independent fresh producer review and native normal-speed viewing. No unnecessary legacy BEFORE/AFTER rerun.

Next package: prioritize actual default GU+ZF stage2 scope/publication defect without cap raising, strengthen scope test with real default partner; then real normal-pace/touch/interruptions/restart evidence, landmark/contact review, whole-task gates and fresh independent producer. Parent handles TASKS/PROGRESS/runner. CMR-14B remains IN_PROGRESS; no fake Host/independent receipt.
