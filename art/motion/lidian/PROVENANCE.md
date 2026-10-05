# Li Dian provenance (CMR-13A)

- Authoring: 1/12 used (walk 1/2: design PASS, length FAILS on
  guard shortfall — fix prescribed). Global 113/200; walk 1/2
  left. Repair reserve 3/3 untouched (shared with CMR-13B,
  acceptance-4 only). No projection state yet (band fixes from
  the ACCEPTED walk median).
- Masters (inspected 2026-10-05, before any request): body
  `6e0636d6…`, portrait `c6ef3bfe…`. Identity locked in
  `IDENTITY.md`; weapon from rig files only
  (glaive 76u/haft 5.2/crescent/tassel — never the `sword.*`
  attack-id names).

## Attempt log

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
