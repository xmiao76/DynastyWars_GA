# BODY-7 — final verification sweep (body overhaul)

Date: 2026-09-25. Scope: BODY-1..BODY-7 executed under the owner-approved
plan; this report is the serial sweep + whole-cast review + resource report.

## Serial sweep (one run, artifacts/run-body7-gates.ps1)

| Gate | Result |
|---|---|
| eslint | PASS (clean) |
| tsc --noEmit | PASS |
| vitest | PASS - 498/498 |
| playwright chromium (e2e) | PASS - 78/78 |
| playwright vision (sprite gate, Canvas + WebGL) | PASS - 5/5 |
| playwright selfplay | PASS - 13/13 |
| vite build | PASS |
| playwright prodbuild | PASS - 4/4 |
| boot/memory probe | recorded below |

Logs: artifacts/body7-{lint,tsc,unit,e2e,vision,selfplay,build,prodbuild,mem}.log.

## Resource report vs BODY-1 baseline (pre-overhaul)

| Metric | Baseline (BODY-1) | Now (BODY-7) | Delta |
|---|---|---|---|
| dist | 3,805 KB / 25 files | 7,889 KB / 67 files | +4.1 MB art |
| boot to title | 2,118 ms | 4,208 ms | +2.1 s (14 fighter packs + horse decode+verify at boot) |
| textures | 337 | 382 | +45 |
| decoded RGBA | ~99.8 MB | ~122.6 MB | +22.8 MB |

All packs are signature-verified at boot; boot cost is decode+verify of the
14 fighter packs + horse sheet. No gameplay-path allocation changes.

## Whole-cast review artifacts

- artifacts/look/body7-cast.png - ALL 18 rows (5 heroes + 3 mooks + horse +
  9 bosses) x all 14 poses x both facings (left = the sprite adapter's
  texture mirror), zero empty cells.
- artifacts/look/body-beforeafter.png - 8 paper-doll fighters x idle/attack/
  down x procedural/painted (parity + liveness baked in).
- artifacts/look/boss-beforeafter.png - 9 bosses x idle/attack/down x
  procedural/painted heads (liveness baked in).
- e2e captures: select (5 cards), per-hero gameplay with motion, mounted
  (rider on painted saddle), co-op (P2 painted), phone (412x732).
- Per-phase review sheets: body3-*, body-cells-* (8 packs), boss-faces-review.

## Task ledger

- BODY-1 DONE (owner-approved pilots) ... BODY-6 DONE (owner review open).
- BODY-7: every technical criterion met and verified; the owner's
  acceptance of the final cast is the one open item (objections stay
  open per the task's own acceptance criteria).
