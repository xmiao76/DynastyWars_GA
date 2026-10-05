# Li Dian provenance (CMR-13A)

- Authoring: 3/12 used (1/7 ACCEPTED; charge 1/2 locally PASS
  but projection-STOP — retouch prescribed). Global 115/200;
  charge 1/2 left. Repair reserve 3/3 untouched (shared with
  CMR-13B, acceptance-4 only). Projection: band [399.7,441.8];
  walk recorded; charge HELD (not recorded — only accepted
  sheets record).
- Masters (inspected 2026-10-05, before any request): body
  `6e0636d6…`, portrait `c6ef3bfe…`. Identity locked in
  `IDENTITY.md`; weapon from rig files only
  (glaive 76u/haft 5.2/crescent/tassel — never the `sword.*`
  attack-id names).

## Attempt log

### Request 3/12 — charge 3x3 sheet candidate 1/2: locally PASS, projection STOP → HELD for retouch 2026-10-05

- Reserve-before-call: `reserve(..., sheet/charge)` → used 3,
  remaining 9, total 115 (guard: expected 2/12, held).
- Exact prompt: `charge-prompt.txt` (dash arc, levelled glaives,
  410–430px band-inside brief). Ordered refs: body, portrait,
  walk-prepared `1c715d29` (read_image'd first — first try, zero
  errors).
- Output: `charge-candidate-1.png` sha `a0cfe1b1…` (1536×1024).
  Mechanical: 9/9, 0 edge, 1 speck. Design: 9/9 levelled glaives
  with crescents + tassels, distinct dash arc, lock match, zero
  defects. Poses ACCEPTED.
- Length (overlay-verified, all 10 on wood): [441.5,437.9,474.4,
  448.9,468.3], within-sheet spread **8.03% PASS**; direction max
  6.3° PASS. BUT pack-level: walk [408.1..442.8] + charge
  [437.9..474.4] → global min 408.1, max 474.4, mean ~434.4 →
  **15.26% STOP** (provider overshot the brief by +10% on the
  extended dash poses; cells 2/4 exceed band hi 441.8 by 26–32px).
  The gate worked as designed (caught at sheet 2, budget intact).
- Verdict: NOT ACCEPTED as-is (not recorded — only accepted sheets
  record). Prescription (next turn): DETERMINISTIC shaft retouch
  (spec-mandated before image rounds): pommel-end shorten on cells
  2 (−49px), 3 (−24px), 4 (−43px) into ~425 (shorten = overlap, no
  fill fabrication; blades untouched). Free (not a ledger event).

### Request 2/12 — walk single-cell fix (cell 0: 324→412 diagonal) + splice + 8.21% PASS → ACCEPTED 2026-10-05

- Reserve-before-call: `reserve(..., focused/walk)` → used 2,
  remaining 10, total 114 (guard: expected 1/12, held).
- Exact prompt: `walk-fix1-prompt.txt` (ONLY cell 0, stance kept,
  upright→diagonal carry ~420px). Ordered refs: walk orig
  (vehicle, FIRST), body, portrait. One image, first try.
- Output: `walk-fix-1.png` sha `8edb5de3…` (1536×1024). 9/9, 0
  edge (layout obeyed — single-cell briefs 6/6 across fighters).
  3x zone: guard stance kept EXACTLY, single diagonal glaive +
  crescent + tassel, no extras; chord (433,18)-(108,272) =
  412.5px — IN WINDOW [400,450].
- Splice (`scripts/splice-lidian-walk.mjs`, committed): {0: fix}
  + rest orig, SHA-pinned, gates + hash proof, byte-identical
  rerun → `walk-prepared-source.png` sha `1c715d29`.
- Keep-set [0..8] on spliced (overlay read; all 18 on wood):
  [412.5,409.0,408.1,416.9,420.3,420.2,438.4,442.8,441.8], mean
  423.3, spread **8.21% PASS**; direction max 4.8° PASS.
- Projection (new process): fixed global band [399.69,441.76]
  from walk median 420.2 (`pack-projection.json`, committed);
  walk recorded (scale 1 pre-pack): WARN (8.20% within 2pp —
  expected, walk fills the band); steering window [400.5,441.8]
  for charge; no drift (1 sheet).
- Verdict: walk source ACCEPTED (2 requests). 1/7 sequences done.

### Request 1/12 — walk 3x3 sheet candidate 1/2: design PASS, LENGTH FAILS (guard shortfall) 2026-10-05

- Reserve-before-call: `reserve(..., sheet/walk)` → used 1,
  remaining 11, total 113 (guard: no lidian slot, created boss
  cap 12 — held).
- Exact prompt: `walk-prompt.txt` (guard + 8-cycle, crescent +
  tassel text spec, 440–460px band). Ordered refs: body, portrait
  (both read_image'd last turn — first try, zero errors; NO weapon
  ref exists for the glaive, text spec sufficed).
- Output: `walk-candidate-1.png` sha `2f364ede…` (1536×1024).
  Mechanical: 9/9, 0 edge, 0 specks. Design: 9/9 glaives with
  crescent blades + red tassels, guard + 8 distinct walk poses,
  lock match, zero defects. Poses ACCEPTED.
- Length (overlay-verified, all 18 markers on wood, chords track):
  [324.2,409.0,408.1,416.9,420.3,420.2,438.4,442.8,441.8],
  FULL-9 spread **28.69% FAIL**; direction max step 45.4° PASS.
  Root cause: POSE-FORCED — the upright guard glaive (324.2) is
  already maxed to its 341px cell height, while diagonal carries
  fit 408–443. The 8-cycle alone passes (8.17%).
- Prescription (next turn): SINGLE-CELL fix on cell 0
  (diagonal-carry guard, ~420px target matching cycle mean 424.6,
  stance kept; must land in [400,450]; ~70% odds) — 1 request.
  Re-brief rejected (would re-roll the passing 8-cycle).

### Setup (no image call): identity locked, 7-sheet plan, projection process armed 2026-10-05

- Read: CMR-13A spec, body + portrait masters (both viewed), rig
  (`figures.ts` glaive + BOSS_LEAN + lidian plan), core enemy def
  (hp 180, speed 1.1, hitstun 10), attack windows (charge
  10/18/20, combo 9/4/12, heavy 16/6/24), `pack-projection.mjs`
  (full read: fix-once band, per-sheet gate, drift check), and
  the heads overlay-landmark protocol in the recovery doc.
- Wrote IDENTITY.md (binding likeness/weapon terms), AUTHORING-
  PLAN.md (7 sheets, budget 12, process), this file. No ledger
  slot yet (first reserve creates it); no projection state yet
  (band fixes from the accepted walk median).
- Next: walk sheet 1/2 (reserve first, boss cap 12).
