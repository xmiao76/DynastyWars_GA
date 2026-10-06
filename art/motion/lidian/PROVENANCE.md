# Li Dian provenance (CMR-13A)

- Authoring: 9/12 used (3/7 ACCEPTED; heavy 1/2 DESIGN
  PASS but LENGTH FAIL — overhead cells short/occluded;
  HELD for repair round 1). Global 121/200; heavy 1/2
  left. Repair reserve 3/3 untouched (round 1 prescribed:
  5 named cells). Projection: walk+charge+combo recorded,
  WARN (8.30%, N=19); heavy NOT recorded (held).
- Masters (inspected 2026-10-05, before any request): body
  `6e0636d6…`, portrait `c6ef3bfe…`. Identity locked in
  `IDENTITY.md`; weapon from rig files only
  (glaive 76u/haft 5.2/crescent/tassel — never the `sword.*`
  attack-id names).

## Attempt log

### Request 9/12 — heavy 3x3 sheet candidate 1/2: DESIGN PASS, LENGTH FAILS (overheads short/occluded) → HELD for repair round 2026-10-06

- Reserve-before-call: `reserve(..., sheet/heavy)` → used 9,
  remaining 3, total 121 (guard: expected 8/12, held).
- Exact prompt: `heavy-prompt.txt` (raise/hold/chop/follow/
  recover + spares; steep-diagonal family ≤30°, NO vertical
  with the 341px-height reason stated; 415–425px mid-low
  brief inside [400.8,441.8]; single glaive + crescent +
  tassel; 35px+ margins). Ordered refs: body, portrait,
  combo-prepared `654fd3a7` (read_image'd first).
- Output: `heavy-candidate-1.png` sha `031e72d5…` (1536×1024).
  Mechanical: 9/9, 0 edge, 0 specks. Design: arc reads
  (raise→hold→chop→follow→recover), identity clean, single
  glaives + crescents + tassels, no extras. Poses ACCEPTED.
- Length (overlay-verified endpoints on material): c0 292.5
  (tip (360,10), pommel (101,146)); c1 293.7 (tip (858,7),
  pommel (589,125)); c2 ~302 (tip (1524,323), pommel
  (1280,145)); c3/c4 pommels OCCLUDED (hafts disappear
  behind the torso; zone reads show no cap — farthest-gold
  hits were boot buckles, proven by zone overlays, not
  assumed). The provider drew every overhead glaive short
  (~260–330) and hid two butts. Spares c6/c7 also short
  (~297/~360) — no substitution.
- Retouch pre-assessment (loop.md 4a: retouch before reserve
  rounds): c0 extend +130 hits the SHEET EDGE (target x≈−14,
  proven by coordinates); c3/c4 have no endpoints (unknown,
  cannot run); c1/c2 unproven either way but batching all
  five named cells in ONE reserve round is coherent (same
  defect class, poses kept) and explicitly allowed (≤9
  cells/round) — a 130px median fill over 45% synthetic
  shaft would likely fail pair review anyway.
- Prescription (next turn): REPAIR round 1 (repair ledger,
  NOT authoring — Acceptance-4 failure per loop.md 4a +
  recovery doc): reserveRepairRound BEFORE the call naming
  cells 0–4 (poses kept, full-length ~415–425px glaives,
  VISIBLE pommel caps in empty margins); refs heavy orig +
  body + portrait; then splice/verify/project. Authoring
  stays 9/12 (3 left for misc/fall/getup — each must land
  first-try-or-retouch).

### Request 8/12 — combo fix-4 HORIZONTAL RECOMPOSE (494px) + 2 free retouches + splice → 4.25% PASS → ACCEPTED 2026-10-06

- Reserve-before-call: `reserve(..., focused/combo)` → used 8,
  remaining 4, total 120 (guard: expected 7/12, held). LAST
  image attempt on this cell per prior prescription.
- Exact prompt: `combo-fix4-prompt.txt` (ONLY cell 0; RECOMPOSE
  near-horizontal at chest height, span pinned tip≈45 AND
  pommel≈470 — the passing orientation on all sheets, after
  three diagonal failures). Ordered refs: combo orig (vehicle,
  FIRST), body, portrait. One image.
- Output: `combo-fix-4.png` sha `eb22ef71…` (1536×1024). 9/9, 0
  edge. Composition EXCELLENT: low windup coil, near-horizontal
  glaive at chest height in both fists, head fully above the
  haft, blade+tassel clear left, single glaive, no defects.
  Chord (18,196)-(512,213) = 494.3px — overshot again, BUT
  horizontal overshoot is charge-pattern retouchable (clear
  margins, no fist/boot in the slide path).
- Retouch (`scripts/retouch-lidian-combo.mjs`, committed, both
  ops gated): cell 0 pommel-end shorten −69.03px → 425.3 (band
  20→24 after an 8px rim sliver was caught by pair+speck scan;
  final speck scan 0); orig cell 1 pommel-end shorten −37.74px
  → 425.4 (the "steel at pommel" scare was blue robe trim
  off-axis, confirmed on the zone overlay; the 5 sub-3px dots
  are pre-existing in orig). Achieved-vs-predicted ±0.1px both;
  composition 9/9 both; before/after pairs clean both.
  Intermediates: `combo-fix-4-retouched.png` (`1f22af0c`),
  `combo-candidate-1-retouched.png` (`1e427357`). Free.
- Splice (`scripts/splice-lidian-combo.mjs`, committed):
  {0: fix} + rest orig-retouched → `combo-prepared-source.png`
  sha `654fd3a7`, 9 components, per-cell hash proof, no drift.
- Verify (overlay, all 10 markers on wood): keep-set
  [425.3,425.3,443.6,440.1,426.4], spread **4.25% PASS**;
  undirected axes max step 33.2° PASS (≤60); directed blade
  swing ~147° = the authored swing (same 13B readability flag
  as orig's 155°). Heads overlay-landmark read (fixed-scale
  4x crops, crown/chin rows): [81,78,75,78,76], spread
  **7.7% PASS** (≤10).
- Projection: combo recorded (scale 1): WARN (global 8.30%
  over N=19, min 408.1, max 442.8→443.6); steering window
  [400.8,441.8]; driftSuspected=true (means 423.3→430.9→
  432.1 rising) — band NOT touched (fixed); heavy briefed
  mid-low (~415–425) to bend the mean back. No ratchet:
  extremes stay inside the fixed band.
- Verdict: combo source ACCEPTED (1 request + free retouch).
  3/7 sequences done. Culls 5–8.

### Request 7/12 — combo single-cell fix-3: pinned span IGNORED (518px) + retouch PROVEN infeasible → REJECTED 2026-10-06

- Reserve-before-call: `reserve(..., focused/combo)` → used 7,
  remaining 5, total 119 (guard: expected 6/12, held).
- Exact prompt: `combo-fix3-prompt.txt` (ONLY cell 0; BOTH
  endpoints pinned as targets tip≈(75,68) AND pommel≈(425,300);
  history of all three prior lengths cited). Ordered refs:
  combo orig (vehicle, FIRST), body, portrait. One image.
- Output: `combo-fix-3.png` sha `c7d014f6…` (1536×1024). 9/9, 0
  edge, stance kept, single glaive + crescent + tassel — but
  chord (36,55)-(483,317) = 518.1px (tip x=36 violates even
  the x>60 bound). Pinned targets AND the cited history were
  both ignored: three consecutive provider failures on this
  diagonal cell (516/360/518) — diagonal length control here
  is beyond reliable prompting.
- Retouch-salvage workup (free, deterministic): pommel-end
  shorten needs s≥77px to reach the band, with piece t0 > cap
  end (31.2) and t0+s clear of obstacles. Finger flesh PROVEN
  at t≈106 ((388,269) = (155,111,96), r−b=59 vs haft ≤29 and
  steel ≤22 — a finger wrapping under the haft): t0 ≤ 29 <
  31.2, infeasible by ≥2px before margins. Secondary: cap
  needs ±15 band, boot intrudes at ±13. Trial driver REFUSED
  by its own achieved gate (483.4 vs 443.5 — the hook exposed
  unmoved haft, confirming the geometry); driver deleted, no
  output written. No run wasted beyond measurement.
- Verdict: fix-3 REJECTED, kept per precedent. Cell-0 score:
  orig 298 (pose-forced) / fix-1 516 (unsalvageable: fist in
  piece) / fix-2 360 (extension = fabrication + boot in path)
  / fix-3 518 (shorten blocked by finger + boot).
- Prescription (next turn, LAST image attempt on this cell):
  fix-4 (1 request) RECOMPOSES cell 0: low windup coil kept
  but glaive NEAR-HORIZONTAL at chest height spanning the
  full cell width (tip near x≈45, pommel near x≈470) — every
  passing cell on every sheet is horizontal-ish; the diagonal
  is the common factor in all three failures. Then the usual
  cell-1 retouch + splice + verify. If fix-4 also fails, STOP
  image attempts on cell 0 (would leave 4/12 for 4 sheets)
  and escalate: owner decision (waive / re-scope cell 0 /
  band exception) — recorded here in advance so no fourth
  same-shaped attempt happens.

### Request 6/12 — combo single-cell fix-2: bounds obeyed, LENGTH FAILS (360px, short) → REJECTED 2026-10-06

- Reserve-before-call: `reserve(..., focused/combo)` → used 6,
  remaining 6, total 118 (guard: expected 5/12, held).
- Exact prompt: `combo-fix2-prompt.txt` (ONLY cell 0; HARD
  endpoint bounds tip x>60 / pommel x<430 + compact 415–430px
  brief + example chord, to counter fix-1's max-diagonal bias).
  Ordered refs: combo orig (vehicle, FIRST), body, portrait.
  One image, first try (default image route).
- Output: `combo-fix-2.png` sha `b9f7f41e…` (1536×1024). 9/9, 0
  edge. 3x zone: coiled stance kept, single diagonal glaive +
  crescent + tassel, no extras. Bounds OBEYED (tip x=117,
  pommel x=398) — endpoint bounds control POSITION — but chord
  (117,71)-(398,296) = 360.0px, SHORT of the 415–430 brief by
  −15% (provider overcorrected from fix-1's 516; pixel/length
  targets ignored again, both directions now proven).
- Endpoints overlay-verified on material: steel topmost
  (117,71); gold pommel extreme read on the 4x zoom (cap rim
  ≈(398,296)); naive farthest-ink scan hit a boot pixel
  (444,329) and was discarded — endpoints must be read on
  wood/steel/gold, never blind extremes. Siblings differ from
  orig (0.14–0.18 frac) — irrelevant, splice takes cell 0 only.
- Salvage assessed + rejected: keep-set with 360 would spread
  ~20% FAIL (min 360 vs max 443.6); retouch-EXTEND (+65px) is
  fill fabrication (shorten-only precedent) and the extension
  path runs into the boot. REJECTED, kept per precedent.
- Prescription (next turn): (1) fix-3 re-shoot (1 request):
  pin the SPAN, not just limits — blade tip NEAR x≈85 AND
  pommel cap NEAR x≈425 (both endpoints as targets; bounds
  alone under-constrain length); (2) FREE retouch-shorten
  cell 1 (463.1→~425, −38px pommel-end, proven pattern).
  Then splice + re-verify + record. Budget warning: fix-3
  leaves 5/12 for 4 sheets — subsequent sheets must land
  near-first-try.

### Request 5/12 — combo single-cell fix-1: pose/orientation PASS, LENGTH FAILS (516px overshoot) → REJECTED 2026-10-05

- Reserve-before-call: `reserve(..., focused/combo)` → used 5,
  remaining 7, total 117 (guard: expected 4/12, held).
- Exact prompt: `combo-fix1-prompt.txt` (ONLY cell 0, diagonalize
  + lengthen to ~420–430). Ordered refs: combo orig (vehicle,
  FIRST), body, portrait. One image, first try.
- Output: `combo-fix-1.png` sha `1f8c8642…` (1536×1024). 9/9, 0
  edge (layout obeyed — single-cell briefs 7/7). 3x zone: coiled
  stance kept, single diagonal glaive + crescent + tassel, no
  extras — BUT chord (18,72)-(472,318) = 516.4px, overshooting
  the 420–430 brief by +22% (provider drew max-diagonal; the
  "generator ignores pixel targets" lesson re-proven).
- Salvage assessed + rejected: pommel-end retouch-shorten (−91px)
  is INFEASIBLE — the gripping fist sits at t≈76–116 inside any
  viable moving piece (t0>111 required), so the piece would split
  the fist (proven by coordinate analysis, no run wasted).
  Blade-end shorten infeasible (tassel detaches or piece exceeds
  maxShortenPx). REJECTED, kept per precedent.
- Prescription (next turn): (1) fix-2 re-shoot (1 request):
  EXPLICIT endpoint bounds (blade stays right of x=60, pommel
  left of x=430) + compact ~420px brief to counteract the
  max-diagonal bias; (2) FREE retouch-shorten cell 1 (463.1→~425,
  −38px pommel-end, proven pattern). Then splice + re-verify.

### Request 4/12 — combo 3x3 sheet candidate 1/2: design PASS, LENGTH FAILS (cell-0 short + cell-1 long) 2026-10-05

- Reserve-before-call: `reserve(..., sheet/combo)` → used 4,
  remaining 8, total 116 (guard: expected 3/12, held).
- Exact prompt: `combo-prompt.txt` (slash arc, in-band 410–430px
  brief). Ordered refs: body, portrait, charge-prepared
  `40054db9` (read_image'd first — first try, zero errors).
- Output: `combo-candidate-1.png` sha `bad5e220…` (1536×1024).
  Mechanical: 9/9, 0 edge (cell 0 x0=19, cell 3 w=569 — legal).
  Design: 9/9 crescents + tassels, distinct slash arc, lock
  match, zero defects. Poses ACCEPTED (windup coils blade-back).
- Length (overlay-verified, all 10 on wood — cell-0 gold butt cap
  confirmed VISIBLE at the fist, genuinely short not occluded):
  [297.5,463.1,443.6,440.1,426.4], spread **39.97% FAIL**.
  Direction: undirected axes cohere (max step ~25° PASS); blade
  heading rotates ~155° across windup→strike = the authored swing
  (flagged for 13B runtime readability verification, fall-DOWN
  style — not a silent pass).
- Prescription (next turn): (1) IMAGE fix cell 0 (diagonalize the
  coiled glaive + lengthen to ~425 — full-length blade-back can't
  fit horizontally; 1 request, ~55%); (2) FREE retouch-shorten
  cell 1 (463.1→~425, −38px pommel-end, proven pattern). Then
  splice {0: fix} + retouch → re-verify + record. Retouch-extend
  for cell 0 assessed + rejected (body blocks the extension path;
  gates would refuse).

### Retouch (no image call): 3-op pommel shorten on charge 2/3/4 → 3.84% PASS → ACCEPTED 2026-10-05

- Driver `scripts/retouch-lidian-charge.mjs` (committed): hash-pinned
  candidate in, 3 shorten ops (u = pommel→blade from verified
  endpoints; shifts (48,-12)/(23,-6)/(40,-16) px; t0 75/50/70),
  achieved-vs-predicted gates (±1px), composition gates, prepared
  source out. Method lessons (all gate- or visually-proven): (1)
  measure hook must use the NARROW haft strip (wide strips catch
  robe pixels behind the pommel and inflate t-range); (2) op band
  must cover the FULL flared pommel cap (band 10→14 left edge
  pixels; band 20 clean on 2/4; cell-3 flare needed 30 — a 30px
  leftover chunk, then a 5px dot, both caught by before/after
  visual pairs, NOT by gates); (3) measure band follows the op
  band so leftovers would trip the gate. Final: all 3 ops land
  ±0.1px, joints read clean at 4x, zero fragments.
- Output: `charge-prepared-source.png` sha `40054db9…` (9 figures,
  correct cells, no edge). Keep-set [0..4] overlay-verified (all
  10 on wood): [441.5,437.9,424.9,425.1,425.2], spread **3.84%
  PASS**; direction max 6.3° pass. Culls 5–8.
- Projection: charge recorded (scale 1): WARN (global 8.14% over
  N=14, min 408.1, max 442.8); steering window [400.2,441.8];
  no drift. Cost: ZERO requests (deterministic, not a ledger
  event).
- Verdict: charge source ACCEPTED (1 request + free retouch). 2/7
  sequences done.

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
