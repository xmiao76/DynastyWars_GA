# CMR-05 — Capture/review the actual whole-character motion path

- Queue status: DONE (attempt 1, 2026-10-01; verified same day) (live queue TASKS.md is authoritative).
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

- [x] Documented per-fighter/role capture command uses actual runtime frames and keys. (`node scripts/motion-capture.mjs --fighter <id> --role <role> --renderer <canvas|webgl>`, documented in [MOTION_CAPTURE.md](MOTION_CAPTURE.md); rows carry the actual runtime frame ids `entity:<kind>:motion:<clip>:<idx>` and the drawn cell boxes, per renderer/facing.)
- [x] Guan Yu's 33 existing technical controls (and foundation extensions) remain meaningful; real action/mixed and default legacy gates preserved. (No existing control was touched: the full unit suite is green minus the known G6 pin, the guanyu e2e suites and the default legacy co-op e2e (6/6) pass unchanged, and the capture adds evidence on top instead of replacing those gates.)
- [x] New path has indexed before/after review and every applicable action/interruption. No unseen pose silently labelled natural. (`index.json` + `report.json` per run; rotation to `previous/` with commit-labelled pair sheets; coverage matrix is `captured`/`unseen` only - the live Guan Yu capture honestly reports 16 captured / 22 unseen - and `assertIndexIntegrity` rejects an unseen pose graded natural.)
- [x] Shooter, charge/enrage, held/thrown, recovery/KO and co-op observability ready before first character integration. (`ROLE_CAPABILITIES` + `actionsForRole` cover shooter `projectile`, boss `charge`/`enrage`, and `held`/`thrown`/`recovery`/`ko`/`coop`/`interruptions` for the player-capable roles - unit-tested; co-op rows captured live from both players.)
- [x] Owner-playable videos, contact sheets and trace links; inspection limitations and actual playback pace stated. (Per-run `.webm`, `contact-sheet.png`, `trace.json` linked from `index.evidence`; `pacingReport` measures wall ms/sim-tick and states that headless pacing is not normal-speed evidence; all limitations recorded in MOTION_CAPTURE.md.)
- [x] Existing review policy intact; later consumer/producer evidence discoverable from queue/spec links. (No edit to VISUAL_REVIEW/ledger policy or cadence; MOTION_CAPTURE.md states consumers self-check and only mark `fixed (unverified)`; evidence lives under `artifacts/motion-review/` and is linked from this spec.)

## Verification record (attempt 1)

- New harness: `scripts/motion-review-core.mjs` (trace validation negative
  controls, coverage matrix, pacing/resource reports, index builder),
  `scripts/motion-capture.mjs` (runner: provenance + rotation + validation +
  contact sheets/pairs), `e2e/motion-capture.spec.ts` (parameterized live
  capture), `test/game/motion-review-core.test.ts` (16), docs `MOTION_CAPTURE.md`.
- Gates: lint + `tsc --noEmit` clean; targeted units 16/16; live Guan Yu
  captures on canvas (x2, exercising rotation/pairs) and WebGL: 33 rows each,
  0 trace errors, 0 hard integrity, 2 honest open items (unverified
  `contactU`/`weaponTipU`); default legacy co-op e2e 6/6; `npm run vision`
  5/5; `npm run prodbuild` 8/8. Signal intentionally not run: no
  observation adapter or `src/game` file changed (harness-only task).
- Self-check caught and fixed a real capture defect: the CONTINUE overlay
  occluded review crops (death segments spent `lives`, so the core re-emits
  `gameover`). Crops now capture with the HUD hidden and full state
  recovery; verified mechanically (0.0% card-parchment pixels) because
  reviewer image previews were unreliable this session (noted as an
  inspection limitation).
- Correction (owner-found, same day): the webgl capture's crops were 100%
  black - `drawImage(game.canvas)` reads a WebGL drawing buffer that is
  cleared outside the render frame (`preserveDrawingBuffer: false`), so the
  canvas renderer hid the bug. Fixed: crops come from
  `game.renderer.snapshot()` (post-render readback) and the runner now
  REJECTS blank/black crops as a capture-bug defect. Re-run verified:
  webgl frames mean-lum ~125 (was 0.0), webgl contact sheet 105 (was 3.6),
  matching canvas on both renderers. The 33-row traces/keys were never
  affected.

## Verification

Harness negative controls/targeted units, live Guan Yu/default e2e, lint/typecheck, vision/prodbuild; signal if observation adapters change. No production cast art, threshold relaxation, default activation, scheduler or loop-policy edits. Local commit; hand off to CMR-06A.
