# CMR-15A charge spares 5–8 assessment (work cmr15a-charge-spares-assessment, 2026-10-13, ZERO generation)

Verdict: **NO coherent 5-cell set — NOT BANKED** (no `accepted` cells anywhere under
`07-charge/`). Spares 5–8 of sheet `11080736380132eb798b6b0636f03ab385cf287725be748fc4bc9189f4c189e5`
were registered at the keeps' ONE sheet scale 1.3540 (cell0 guard crown→sole 339 native px →
459px, sole→groundY500, 768×512; `build-spares.mjs`, rerun byte-identical) and gated against
the frozen band [124.41,137.50]u = 479–529px at that scale. Deterministic shaft retouch was
applied+saved only where measurably curable (clean-shaft availability ≥ removal to band-hi):
cell8 only; cells 5–7 carry an in-memory max-shortening proof measure. Ledger verified
unchanged `1fd2c67d…` Xu Chu 14 (charge 1)/global 181, ceilings 22/189.

Identity/anatomy/seams PASS all four spares (sheet + registered + marked + cell8-retouched +
contact sheet opened; greenPx=0, no canvas-edge alpha). Head RAW all (beard conceals the
endpoint; helmet-width proxy below vs keeps registered range 70.4–131.3px; batch-end ruling
reserved, not a reject). Angles recorded raw per the keeps anglePolicy.

| Spare | Registered SHA-256 | Weapon reg → max-retouch proof | Angle | Body crown→sole / groundErr / helmet proxy | Pose-role read |
|---|---|---|---|---|---|
| cell5 spare-dash-alt | `0e0a6447238838579077bce7573937ecc14c3f33325bdbb8bab05bad0cd917bc` | 632.33px = 164.38u → 614.62px = **159.77u FAIL** (+22.27u; avail 18px vs 104px to band-hi, deficit 86px; retouch not applied) | −15.16° | 362.87px / 0.26u / 132.69px; boots soleY 501 trailing toe + 482 tucked | Airborne tucked dash → launch/dash only |
| cell6 spare-brake-alt | `b57dc89a7ff89baffebab399324f840c734da343f28d3feb948d6b37b8b2e2ae` | 705.45px = 183.39u → 689.92px = **179.35u FAIL** (+41.85u; avail 15px vs 177px, deficit 162px; not applied) | −14.04° | 379.12px / 0.26u / 131.34px; boots 501 toe-off + 498 reaching | Forward reaching stride (weight forward) → launch/dash only; prompt brake-alt name not borne out |
| cell7 spare-brake-alt2 | `5f173d64188f803ec2ed8a5921a56b8b420b95d4ef2e147d2abd456595c66d4b` | 606.16px = 157.58u → 537.22px = **139.65u FAIL** (+2.15u; avail 69px vs 78px, deficit 9px; not applied) | −24.09° | 389.95px / 0.00u / 81.24px; boots 500/496 both flat | Genuine grounded brake (nearest miss) |
| cell8 spare-guard-alt | `6a709f4f0cb5f0565ef65c0c4caf99f757216add311a4211b35374259fb45ddd` | 566.07px = 147.15u → retouched `66c21b1a689f4c5c4c2ddba7c3b6ca72dec7f8349e8c9d52a2d8e401010d1c2b` 510.85px = **132.80u PASS** (avail 60px ≥ 38px; changedOutside=0; joint invisible at cell size) | −23.44° | 452.23px / 0.26u / 74.47px; boots 501/499 flat | Upright guard — duplicate of passing cell0 only |

## Substitution matrix vs failed keeps 1–4 (+ continuity with cell0)

| Failed keep | Spare candidates | Result |
|---|---|---|
| cell1 crouch-coil | none | No spare is a grounded crouch-coil (5 airborne, 6 extended stride, 7 brake settle, 8 upright guard) — role uncovered at any length |
| cell2 launch | cell5, cell6 (role fit) | Both FAIL length after max retouch (159.77u / 179.35u) |
| cell3 crushing dash | cell5, cell6 (role fit) | Same two spares as launch — one spare cannot cover both beats, and both FAIL length |
| cell4 brake | cell7 (role fit) | FAIL length by 9px clean-shaft deficit (139.65u proof); cell6 reads forward stride, not brake |
| cell0 guard (PASS 132.31u) | cell8 (role fit, length PASS) | Only passing spare duplicates the one passing keep; no gain |

Continuity: same scale/ground for all (groundErr ≤0.26u); angles cell0 −23.61° vs spares
−15.16°/−14.04°/−24.09°/−23.44° (all within the 30° family, no step >60°). The action
sequence guard→coil→launch→dash→brake still cannot be formed: coil uncovered, launch+dash
share two length-failed spares, brake spare length-failed. **Nothing banked; cell8's retouched
cell is retained as evidence only and does not replace cell0.**

## Single focused-fix brief (later package only — NOT executed here)

Grant basis: Alternative Completion Phase 3 allows at most one focused fix per sheet after
deterministic retouch (now exhausted for keeps 1–4 and spares 5–7; see
[spares-gate.json](spares-gate.json) `focusedFixBrief` for the machine-readable copy).

- **Cells/roles**: ONE focused sheet EDIT of keeps **cell1 crouch-coil, cell2 launch, cell3
  crushing dash, cell4 brake** with poses/identity/layout/ground exactly frozen (cell1's coil
  has no spare, so its pose must survive verbatim); cell0 unchanged if cell-scoped, else
  re-gated; optionally also spare cell7 (brake insurance).
- **Change only**: shorten the glaive per named cell — blade+socket toward the front grip,
  pommel cap toward the rear grip; grips/figure/ground unchanged; both ends stay in empty
  transparent space; no figure shrink or pose drift.
- **Required weapon pixel range at scale**: butt→tip **479–529px at the 459px-body registered
  scale** (target ≈508px = 132u) = **354–391px sheet-native** (target ≈375px; guard body
  339px native). Per cell (registered → target −508px): cell1 620.14 (−112), cell2 633.20
  (−125), cell3 675.40 (−167), cell4 585.02 (−77); spares if included: cell5 632.33 (−124),
  cell6 705.45 (−197), cell7 606.16 (−98).
- **Reference order**: (1) EDIT TARGET sheet `candidate-raw.png` `11080736…`; (2) banked
  walk:0 guard `2a4a415d…`; (3) banked walk:2 via `01-walk2/candidate-raw.jpg` `893c90d7…`;
  (4) body master `98c1847b…`; (5) portrait master `c663fd54…`. Provider gpt-preferred as the
  original sheet; reserve-before-call Xu Chu 14→15 / global 181→182 (ceilings 22/189);
  exactly one edit, no reroll; full re-gate after. A failed fix makes this sheet
  post-salvage unusable 1/2 (STOP at 2 not reached); consecutive count stays 0 while the fix
  is unspent.

CAMPAIGN.md fold-in (parent): charge sheet `11080736…` spares assessed — no substitution,
not banked; next step = the single focused fix briefed above.

Evidence: [spares-gate.json](spares-gate.json), [spares-measure.json](spares-measure.json),
`cells/*-registered.png` + `*-marked.png` (+ cell8 retouched), `contact-cell0-then-spares5-8.png`.
