# Huang Zhong provenance (CMR-12A)

- Authoring: 3/16 used (walk ACCEPTED; jab1 fix-1: cell 1
  FIXED, cell 2 always-clean, cell 3 still partial — fix-2 next).
  Global 95/200; jab1 has 1 sheet left. Repair reserve 3/3
  untouched (shared with CMR-12B, acceptance-4 only).
- Masters (inspected 2026-10-05, before any request): body
  `338d9c9e…`, portrait `4dcac826…`. Identity locked in
  `IDENTITY.md`; weapon from rig files only
  (`WEAPONS.bow` 42u recurve, hand-centred riser, continuous
  string, no tassel).
- Attempt log starts below. Every image call records: request
  n/16, kind (sheet/focused) + sequence, reserve-before-call
  proof, exact prompt file, ordered reference hashes, provider,
  mechanical audit, overlay-verified verdict, remaining allowance.

## Attempt log

### Request 3/16 — jab1 focused fix cells 1,2,3: PARTIAL (cell 1 fixed, cell 3 failed) 2026-10-05

- Reserve-before-call: `reserve(..., focused/jab1)` → used 3,
  remaining 13, total 95 (guard: expected used=2, held). Focused
  edits don't consume sheet slots (jab1 still 1/2).
- Exact prompt: `jab1-fix-prompt.txt` (committed; sideways-recurve
  geometry spelled out). Ordered refs: jab1 orig `0d319260`
  (edit vehicle, FIRST), weapon-spec `398dfd56`, walk `806bb045`,
  body `338d9c9e`, portrait `4dcac826`. One image, no retry.
- Output: `jab1-fix-1.png` sha
  `8e767cc22f415c0d23834cf8129688c42a1813831a3be048f28f400d7c881194`
  (1536×1024). Mechanical: 9/9, 0 edge (audit read). Untargeted
  cells micro-redrawn (bboxes shifted) — will NOT be used.
- Cell 1: FIXED ✓ (4x before/after: extra shaft gone, clean robe,
  lunge + vertical bow intact).
- Cell 2: CORRECTION — was NEVER defective. My request-2 verdict
  misread the extended gold sleeve as a shaft at 1x/2x. Direct
  3x zone view of the ORIGINAL (`huangzhong-jab1-c2orig.png`,
  read) proves a clean single vertical bow, both hands on it.
  The error cost nothing (fix-all-3 still correct; fix cell 2
  also clean). Splice will use ORIGINAL cell 2 (immutable first).
- Cell 3: FAILED ✗ — before/after near-identical (4x pairs read):
  still one limb + partial string, no observable second nock
  (~76px hooked fragment vs the 185–200 band). The provider can
  NOT draw the sideways recurve (failed 6/6 thrust cells across
  both sheets). PIVOT (evidence-based): re-brief cell 3 as a
  VERTICAL-bow thrust — extended lunge pose kept, same proven
  vertical recurve (13/13 correct: walk 9 + jab1 0,4,7,8) punched
  forward at arm's length, full nocks + string + air. Play to
  demonstrated strength, not repetition.
- Next: request 4/16 focused fix of ONLY cell 3 (vertical-bow
  thrust), then ONE splice {1: fix-1, 3: fix-2} + {0,2,4: orig},
  then keep-set measure + verdict. Spares 5,6 stay culled.

### Request 2/16 — jab1 3x3 sheet candidate 1/2: core REJECTED (poses accepted, weapons rejected) 2026-10-05

- Reserve-before-call: `reserve(..., sheet/jab1)` → used 2,
  remaining 14, total 94 (guard: expected used=1, held).
- Exact prompt: `jab1-prompt.txt` (committed; briefs the MEASURED
  walk band 185–200px, mean 190.7). Ordered refs: weapon-spec
  `398dfd56`, body `338d9c9e`, portrait `4dcac826`, walk
  `806bb045`. Preferred provider, one image.
- Output: `jab1-candidate-1.png` sha
  `0d31926004827357f951b9c802c45dfb63a5a675890ff1f65aa160ffc50f577c`
  (1536×1024). No retry.
- Mechanical: 9/9 components, 0 edge, specks 10, glow 104855
  cleaned with no residue (clean review read). All separated.
- Identity/poses ACCEPTED: all 9 distinct, role-correct
  (ready/windup/drive/extension/recover + spares), lock match,
  connected anatomy, no extra limbs/horse/text. The lunges and
  guards are right; only the weapons fail.
- Weapon verdicts (clean review + 2x thrust grid + 2× 4x zooms,
  all read): cells 0,4,7,8 carry CORRECT vertical recurves
  (string + air, walk-matching). Cells 1,2 show the correct bow
  PLUS an extra horizontal arrow-like shaft from the off-hand
  (4x: thin straight uniform wood ~140px, no nocks — forbidden
  either as a painted arrow or a second weapon; verdict is
  interpretation-proof). [CORRECTION logged at request 3: the 4x
  proof covered cell 1 only; cell 2 never had the shaft (gold
  sleeve misread at 1x/2x) and was always clean.] Cells 3,5,6
  thrust bows are PARTIAL:
  cell-3 4x shows one limb + partial string only, lower nock
  unobservable (staff-with-hook read) — length UNVERIFIABLE,
  and as the extension core cell this alone fails [0..4].
- Consequence: NO spare remap (all thrust cells defective; only
  guards survive). Repair path = ONE focused edit redrawing ONLY
  cells 1,2,3 (poses preserved) with explicit sideways-recurve
  geometry (both tips + full string + air in-plane), then
  SHA-pinned splice + re-measure — the weiyan-jab1 precedent.
  NOT a whole-sheet re-roll (conceptual defect needs isolation,
  not repetition). Cells 5,6 culled unused.
- Remaining: 14/16, jab1 sheet 1/2 left.

### Request 1/16 — walk 3x3 sheet candidate 1/2: ACCEPTED 2026-10-05

- Reserve-before-call: `reserve(huangzhong, hero, sheet/walk)`
  → used 1, cap 16, remaining 15, total 93 (slot auto-created;
  ledger saved BEFORE the call; verified in
  `generation-budget.json` diff).
- Exact prompt: `walk-prompt.txt` (committed). Ordered refs:
  (1) `weapon-spec-reference.png` sha `398dfd56…` (legacy rig
  crop: idle+walk0 windows from `artifacts/review/latest/anatomy/
  huangzhong.png` sha `1c22d358…`, rendered by
  `artifacts/tmpcheck/huangzhong-weapon-crop.mjs`; crop sha
  recorded at render time), (2) body master `338d9c9e…`,
  (3) portrait master `4dcac826…`. Preferred provider, one image.
- Output: `walk-candidate-1.png` sha
  `806bb0457c65e95259974dad23295ca1fad0936d390ae8076050adec8fe83ae4`
  (1536×1024). No second image, no retry.
- Mechanical audit (`huangzhong-walk-audit.mjs`, cleanAlpha ≥96):
  9/9 components, 0 outer-edge pixels, 0 specks; glow-halo
  83851px removed (reviewed: no key residue in
  `huangzhong-walk-clean-review.png`, read this turn). Bboxes
  heights 329–335 (uniform figure scale); all figures separated.
- Identity/poses (clean review + 2x bow grid, both read):
  cell0 planted guard + 8 distinct alternating walk phases,
  upright elderly bearing; gold-mustard robe, bronze beast
  pauldrons, headband + topknot, waist beard, aged face — all
  match the lock. Hands grip the riser with defined fingers; no
  mitten/extra/floating hands, no second fighter/horse/arrows/
  quiver/text/panels. No verticals (carry pose), no forks.
- Weapon design: compact recurve, hand-centred riser, BOTH nocks
  + continuous string enclosing visible air in all 9 (cell0
  proven at 4x + string-column runs; all 9 show string + air gap
  at 2x; isolation scan found the thin-run/air-gap/limb pattern
  in 5/9 rows). No arrows painted, no effects. Matches the
  legacy authority (same chest-to-shin proportion).
- Weapon length (nock-to-nock, overlay-verified):
  [194.1,184.0,185.2,201.4,189.0,188.1,186.0,192.0,196.2] raw
  px, mean 190.7, spread **9.09% — marginal source-level PASS**
  (≤10%). Method: uppers via right-edge walk-up (programmatic,
  ±1px), lowers eye-read from 5x micro-crops (±2–3px; alpha
  CANNOT separate the merged limb/robe silhouette — proven by
  2D hood map + failed color/string/detector variants v1–v5,
  documented in tmpcheck scripts). All 18 endpoints verified on
  wood in `huangzhong-bow-endpoints.png` (read). Mean lands
  inside the brief's 190–210 estimate. Direction: all chords
  within 3.5° of vertical, max consecutive step 3.72° PASS.
- Verdict: source ACCEPTED, keep [0..8] provisionally. Pack NOT
  prepared; cross-sheet acceptance + gameplay continuity come at
  pack time. Remaining: 15/16, walk 1/2 left.
