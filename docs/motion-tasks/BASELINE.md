# CMR-01 — Resource/generation budgets and baseline report

Published 2026-10-01 (CMR-01 attempt 1). Budget limits come from the shared
contract (`docs/CAST_MOTION_ROLLOUT.md`); measurements are from the committed
Guan Yu pack and current source. **These limits are caps, not promises** —
no limit may be raised to fit generated content.

## Guan Yu reference costs (measured 2026-10-01)

| Item | Value |
| --- | --- |
| regular atlas PNG | 1,827,406 bytes (1344×3456) |
| actions atlas PNG | 2,616,482 bytes (2688×2592) |
| combined download | 4,443,888 bytes (≈4.24 MiB) |
| combined decoded RGBA | 46,448,640 bytes (44.3 MiB) |
| per-frame cell | 448×288 device = 516,096 RGBA bytes × 90 frames |
| frame display | one `entity:<kind>:motion:<frame>` canvas key per sampled frame, blitted from the baked page rect (no per-frame decode) |
| canvas-copy cost | 1 blit (`drawImage` of the cell rect) per frame-display; page decode happens once per page at load |
| load behavior | `?motion=1` gate (`motionEnabled`); `queueMotionArt` requests the two pages + two prepared JSONs; `publishMotionArtRecord` composes `MotionPrepared` → per-frame keys on demand |

## Target limits (contract — caps to measure against, never raise)

| Scope | Cap | Current Guan Yu reference | Headroom |
| --- | --- | --- | --- |
| per fighter | 16 MiB download | 4.24 MiB | 11.76 MiB |
| per fighter | 128 MiB cache (decoded pages + keys) | 44.3 MiB decoded + frame-key canvases | ≥83 MiB |
| per stage | 12 MiB staged assets | motion is fighter-scoped (2 pages); stage bands keep sprites ≤256 | n/a for this pack |
| per page | 2048 px on the long edge | regular 3456 long edge — **the accepted reference EXCEEDS 2048**; repacks (CMR-21) must repack to ≤2048 pages while reproducing every pinned RGBA/exposure hash | record only |

## Generation cap ledger (contract: 200 requests total)

| Consumer class | Requests each | Count | Subtotal |
| --- | --- | --- | --- |
| heroes (4 remaining; Guan Yu frozen) | 16 | 4 | 64 |
| bosses | 12 | 9 | 108 |
| regular enemies | 8 | 3 | 24 |
| shared horse | 4 | 1 | 4 |
| **Total** | | **17 actors** | **200** |

Per-actor cap is a hard ceiling (contract): attempt ≤3 patches and ≤1 finalize
per window; a budget-exhausted actor stays unaccepted with evidence and an
owner decision — never pad missing sequences with old parts.

## Known baseline failures reproduced (2026-10-01, commit `ba9680c` tree)

Commands and what actually ran:

1. `node node_modules/vitest/vitest.mjs run` (full unit) →
   **`Tests 1 failed | 713 passed | 6 skipped (720)`**. The failure is exactly
   the known G6 pin: `test/game/arm-chain.test.ts › G6 the far fist never
   paints over the near arm (V-15b)` (14/15 arm-chain green). It is the
   UIR-16 BLOCKED pin and must stay failing until the owner's scope call.
2. `node node_modules/typescript/bin/tsc --noEmit` → **exit 0 (clean)**.
   The contract's "six possibly-undefined errors in the old UIR-19 hand test"
   do NOT reproduce on this tree: they were fixed in commit `4bce5d8`
   ("test: fix tsc index-access strictness in the UIR-19 hand pin") before
   this contract was consumed. Record kept as exact evidence — the blocker
   list is one item, not two.

Distinguishing rule recorded: G6 = known baseline failure (do not weaken,
do not fix as a side effect); anything NEW from rollout work = regression to
file separately (contract: a task is not DONE because generation booted).

## Reproduction and handoff

- Bulky probe output (per-frame hash JSON/TSV, unit logs) lives under ignored
  `artifacts/cmr01-*`; the committed records are `GUANYU_REFERENCE.md` +
  `guanyu-reference.json` + `guanyu-reference-frames.tsv`.
- Next specs (CMR-02..05) retrieve: the roster matrix from
  `CAST_INVENTORY.md`, pixels/timing from `GUANYU_REFERENCE.md`, budgets from
  this file — no progress-archive digging required (acceptance item 5).
