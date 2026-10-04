# Wei Yan provenance (CMR-11A)

- Authoring: 18/26 used (owner `Do A`: +10 to Wei Yan's original
  16-request cap; usage NOT reset). V1 ten sheets retained as pose
  refs but weapon-rejected. V2 walk, jab1/jab2 SHA-preserving
  splices, finisher/special cull derivatives source-accepted.
  Jump-v2 source NOT ACCEPTED (full-length weapon spread and
  grounding failure). Eight authoring requests remain; full pack
  unverified. Global 200/two whole sheets per sequence unchanged;
  walk/jab1/jab2/finisher/special/jump used both whole-sheet slots.
- Repair reserve: 3/3 untouched (shared with CMR-11B).
- Masters: body `ee0a0200…`, portrait `0fc579c1…` (inspected
  2026-10-03, required before authoring).

## Owner option A in progress (2026-10-04): correct long-handled dao

Owner explicitly chose A (`Do A`): extend Wei Yan's authoring cap
16 → 26 (+10), NOT reset the ten v1 requests. The durable budget
ledger now says 18/26, total 85/200; walk/jab1/jab2/finisher/
special/jump each consumed a second whole-sheet candidate (jab1/jab2 edits were
FOCUSED, not third whole-sheet candidates), and the separate repair reserve
stays 3/3.
`AUTHORING-PLAN-V2.md` and the authoritative v2 section in
`IDENTITY.md` re-brief every sequence from the actual legacy rig.
The v1 pack is NOT accepted or integrated; its source sheets stay
untouched and provide pose/identity reference only.

### jump-v2-candidate-1 — REJECTED as complete jump sequence 2026-10-04; sha `64470647…`

- Request 18/26, whole-sheet jump candidate 2/2; `reserve()`
  saved BEFORE one image call. Prompt `jump-v2-prompt.txt` records
  airborne kick and long-haft contract. Ordered refs legacy weapon
  `71c288d1`, body `ee0a0200`, portrait `0fc579c1`, walk guard
  `46546eca`, special prepared source `5040f1ea` for style only.
  Preferred ChatGPT image provider returned 1536×1024 source;
  original preserved untouched.
- Mechanical: 9/9 separate alpha≥96 components, 0 outer image
  border pixels, cleanAlpha removed 92,179 subthreshold glow and
  0 specks under 150k tolerance. Clean 3×3 contact and true
  endpoint overlay actually viewed. Purple turban/bronze shoulders/
  beard and full gold butt-red tassel-curved steel weapon remain
  visible across sheet; there are genuine crouch/ascent/tuck/kick/
  descent shapes, not nine static repeats.
- Whole-weapon pommel-to-tip raw lengths [541,491,475,579,485,
  439,506,469,457]px. Intended six core poses [0,1,2,3,4,5]
  have ~20.2% spread (579→439 across kick/landing), FAIL
  ≤10%. Kick cell3 is an exaggerated stretched body (bbox 583×
  278) with 579px weapon; it is not an occluded blade or invalid
  detector—the overlay's rings mark real fittings. Grounded
  takeoff cell0 is also 541px, long versus apex 475px.
- Explored ordered spare map [0 takeoff,1 ascent,2 apex,6 kick,
  4 descent,8 landing], inspected the actual six-pose contact:
  spare6 does have extended kicking boot and 506px full weapon,
  but cell8 is an ordinary LOW GROUNDED CROUCH (not a landing with
  one foot lowering), and this mapping leaves takeoff 541px vs
  landing 457px, ~17% gap; ≤10% still FAILS. The contact also
  shows ground-line inconsistency: source takeoff0 feet bleed
  below its nominal first-row ground (bbox y1=365) and source
  descent4 extends into the third-row ground zone (bbox y1=689);
  this can be legitimate cell straddle but requires registration
  measurement; do not claim ≤1.5u intended grounded error.
- NO source drawing is accepted yet for complete jump clip; do
  not cull by VALUE or use unrelated poses to fake compliance.
  One WHOLE-SHEET jump candidate remains impossible (2/2 spent).
  Next bounded turn: diagnose whether a single ordinary-authoring
  FOCUSED request can redraw named jump:0 (long takeoff),
  jump:3 (long kick) and jump:5 (short landing), or substitute
  grounded walk-v2 guard as shared bookend only if contract
  allows it without lying about jump landing; measure after
  and inspect pose continuity at gameplay size. Repair reserve
  3/3 stays acceptance-4-only. Budget 18/26 (8 remain) with
  four other v2 sheets planned (fall/getup/misc/rider) and
  therefore at most four ordinary focused requests spare.

### special-v2-candidate-1 — selected-cell source ACCEPTED 2026-10-04; sha `1826002e…`

- Request 17/26, special sheet candidate 2/2, reserved/persisted
  BEFORE one image call. Preferred ChatGPT image returned a single
  1536×1024 sheet. Exact `special-v2-prompt.txt`; ordered SHA refs
  legacy weapon `71c288d1`, body master `ee0a0200`, portrait
  `0fc579c1`, cleaned walk-v2 guard `46546eca`, accepted finisher
  prepared source `6f622f91`. Game core wy.special: damage 20,
  startup 6, active 12, recover 12, aoe; no painted VFX.
- Mechanical: 9/9 alpha-connected figures distributed across all
  nine cells, zero source-edge contact. Standard cleanup removed
  91,423 low-alpha halo pixels + one 1px speck (under 150k);
  cleaned contact inspected. Stable purple turban, short beard,
  bronze pauldrons, long wood shaft with gold butt/ferrule/red
  tassel and small silver curved blade; distinct grounded sweep.
- TRUE endpoint overlay actually read: source cells 0..8
  [483,495,439,503,510,451,INVALID,494,482]px; cell 6
  L=111px is ferrule-to-tip because gold butt is not visible.
  ORIGINAL first-five length spread (510−439)/486 = ~14.6%,
  FAIL; source cell 2's blade spans short relative to same-sheet
  ruler, so do not claim pass by omitting the discrepancy.
- Legitimate spare replacement: cell 8 is a full-polearm low
  pre-spin setup with pommel and steel tip visible, and makes a
  readable ordered action [0 raise,1 coil,8 pre-spin,3 strike,
  4 follow]. Checked play-order contact `5576dcbf` and endpoint
  overlay `c80f9add`: kept lengths [483,495,482,503,510], mean
  494.6, spread (510−482)/494.6 = **5.6611%**, directions
  [-22,-1,3,8,14] degrees; consecutive steps ≤21° (<60).
  Cull [2,5,6,7] including anomalous short pre-spin cell2 and
  missing-butt spare6; no extra request.
- `scripts/prepare-weiyan-special-v2-source.mjs` pins ORIGINAL SHA
  and culls only those four cells before alpha cleanup. Two runs
  produced the same `special-v2-prepared-source.png` sha
  `5040f1ea` with five separated figures [0,1,3,4,8], no
  outer-edge pixels, 50,500 halo pixels removed and zero specks.
  Actually viewed prepared transparent sheet: full gold butt /
  red tassel / blade on each of five kept poses, other four gone.
- ACCEPTED source drawings only. Full pack fit, consistent scale,
  cross-sequence 10% head/weapon spread, direction continuity and
  offline exposure remain UNVERIFIED. Ledger 17/26, nine left,
  repair reserve 3/3 untouched; no runtime activation or 16MiB
  exception assumed.

### finisher-v2-candidate-1 — selected-cell source ACCEPTED 2026-10-04; sha `ff69e72c…`

- Request 16/26, second (last) whole-sheet candidate for finisher,
  reserved in durable ledger BEFORE generation. Preferred ChatGPT
  image returned one sheet; exact `finisher-v2-prompt.txt`, ordered
  refs legacy weapon `71c288d1`, body `ee0a0200`, face `0fc579c1`,
  cleaned v2 guard `46546eca`, accepted jab2 prepared source
  `e61f9883` (body/pose continuity, legacy weapon remains authority).
- Mechanical: original 1536×1024 has 9 clean components, but one
  alpha≥96 pixel touches RIGHT SHEET EDGE on source cell 2 (bbox
  x1=1535). Therefore the RAW sheet CANNOT be accepted as-is.
  Standard cleanup removes 89,999 halo pixels plus 1 tiny speck.
  All nine long wooden poles, gold pommels/ferrules, red tassels,
  silver blade, bearded purple Wei Yan remain readable and all
  nine poses have distinct stances. Read full contact and actual
  pommel/tip overlay: source lengths [522,510,489,543,494,482,
  506,539,462] raw px; raw core cells 0..4 spread
  (543−489)/511.6 ≈10.6% => FAILS the ≤10% criterion.
- The sheet has clean SPARES. Use a *pose-reviewed* remap rather
  than another request: core play order [0 coil,1 launch,3 heavy
  extension/impact,6 follow,4 recover] draws a legible move with
  back/shoulder commitment beyond jab1/2, and all weapon tips /
  butts visible. TRUE endpoint overlay reviewed for kept 0/1/3/
  6/4: [522,510,543,506,494]px, mean 515, spread 49/515=
  **9.5146%** (marginal source-level pass); next-frame axis
  changes about 25,30,4,3 degrees (≤60). Culls [2,5,7,8] in
  memory; notably cell 2 was the clipped one. This may also
  ease future pack fitting, but no fit conclusion is drawn.
- `scripts/prepare-weiyan-finisher-v2-source.mjs` hashes/pins raw
  source, culls named drawings in memory, applies standard alpha
  cleanup, asserts exactly five separate kept components at
  [0,1,3,4,6] and no outer-edge touch. Resulting immutable-
  derived `finisher-v2-prepared-source.png` sha `6f622f91…`
  reproduced byte-identically twice. Actually opened cleaned
  output (full polearms/purple/beard visible, four culls gone).
- ACCEPTED only the selected five source drawings, not the whole
  generated nine-cell original; full pack-scale hierarchy,
  cross-sequence length spread, ≤16MiB decode cap and offline
  continuity still UNVERIFIED. Budget 16/26, ten authoring left;
  separate acceptance-4 reserve 3/3 untouched. No runtime art
  activation and no page-cap exception assumed.

### jab2-v2-focused-r1 — ACCEPTED two-cell splice 2026-10-04; sha `6388c4e9…`

- Request 15/26, ordinary authoring `kind:'focused'` for named
  jab2:2 extension (missing butt) + jab2:3 follow (422px short).
  Reserved and persisted BEFORE one image call; repair reserve 3/3
  untouched. Exact prompt `jab2-v2-focused-r1-prompt.txt`, ordered
  refs source `fdfc74cf`, accepted walk `a8e44840`, legacy weapon
  `71c288d1`, body `ee0a0200`, portrait `0fc579c1` (all read
  with image tool before the call). Preferred ChatGPT image provider
  returned one focused output; original source retained unmodified.
- The generated output visibly repaired BOTH target drawings: cell
  2 now has a long brown rear haft ending in a gold pommel, cell 3
  rear shaft lengthened; both preserve two-handed grip, red tassel,
  curved steel blade and low crouching identities. Target tip-to-
  pommel: 498px (2) and 453px (3), confirmed by visible endpoint
  overlay on actual gold caps and steel tips. The model also
  redrew untargeted cells, so its entire sheet is NOT accepted.
- `scripts/splice-weiyan-jab2-v2.mjs` SHA-pins both original and
  focused inputs, cleans alpha at threshold 96, selects full
  component owner from repair only for [2,3] and original for
  [0,1,4,5,6,7,8]; collision, outer-edge and 9-component gates
  pass. Rebuild twice returned byte-identical
  `jab2-v2-prepared-source.png` sha `e61f9883` (9 separated,
  every non-target cell copied from immutable original). Keep
  [0,1,2,3,4]; CULL [5,6,7,8] including still-short spare 7.
- Source-level TRUE pommel-to-tip [491,468,498,453,451] raw px,
  mean 472.2; spread 47/472.2 = **9.9534%**, a very NARROW
  within-sheet pass of the ≤10% rule (rounded display says 10.0%:
  DO NOT round the threshold up to a robust pass). Direction angles
  [6,9,9,12,4]° and all adjacent steps ≤8°. Visually reviewed
  clean merged 3×3 and labeled endpoint overlay: blue rings on
  gold butts, green on steel tips for every KEPT cell. Whole-pack
  and cross-sheet acceptance are still UNVERIFIED; this marginal
  source pass needs scale-aware cross-sequence recheck.
- Budget now 15/26 (11 remaining); no third whole-sheet jab2,
  no decoded/page-cap exception and no runtime activation.

### jab2-v2-candidate-1 — REJECTED as full sequence 2026-10-04; sha `fdfc74cf…`

- Request 14/26, jab2 whole-sheet candidate 2/2; `reserve(ledger,
  'weiyan',{role:'hero',n:1,kind:'sheet',sequence:'jab2'})` saved
  BEFORE generating. Preferred ChatGPT image returned one sheet.
  Exact `jab2-v2-prompt.txt`; ordered refs and hashes: legacy weapon
  `71c288d1`, body `ee0a0200`, portrait `0fc579c1`, accepted
  walk guard anchor `46546eca`, accepted jab1 prepared source
  `b39a260b` (body/action continuity, NOT a weapon alternative).
- Mechanical: 1536×1024, 9/9 connected figure components in 9
  nominal cells, zero alpha≥96 outer-border hits. Standard cleanup
  removed 79,180 halo pixels under 150k and ONE 1px speck; clean
  contact reviewed. Core cells 0 chamber, 1 drive, 2 extension,
  3 follow, 4 recover are low, bent-knee sweeps distinct from jab1
  chest-height jabs; turban, beard, bronze shoulders, purple robe,
  gold ferrule, red tassel and curved silver blade remain on-model.
- TRUE endpoint overlay actually read: 0/1/3/4 have a gold rear
  pommel with blade-tip chord lengths [491,468,422,451] raw px.
  Core extension 2 has **NO REAR WOOD/POMMEL**, a genuine source-art
  defect, not just detector noise; the 112px automated chord starts
  at its FERRULE and is INVALID as full weapon length. Spare cell
  7 has the same missing butt and a bogus 125px chord; cull it.
  Further: intact follow cell 3 is only 422px versus 491px chamber,
  so even after extension repair the four unoccluded core values
  vary ~15%, over the ≤10% eventual acceptance item. Fix cell 3
  in the SAME focused batch as cell 2 if its long haft can be
  extended while preserving position/ground; do not lower the
  threshold or discard it merely for being shorter.
- Status: REJECT source as complete pack input; no third whole
  jab2 sheet available. Next: single source-preserving focused
  ordinary-authoring request for named jab2:2 + jab2:3, with the
  accepted walk guard and full jab2:0/1 as length anchors. Source
  original immutable; model may redraw untargeted drawings, so
  splice complete components only, check collisions and per-cell
  hashes. Budget 14/26 (12 remaining), repair reserve 3/3
  untouched. No partial pack build or runtime activation.

### jab1-v2-focused-r1 — ACCEPTED two-cell splice 2026-10-04; sha `64547d1a…`

- Request 13/26 from ordinary authoring ledger (kind `focused`,
  seq jab1), RESERVED/SAVED BEFORE the image call. Repair ledger
  3/3 untouched. Prompt `jab1-v2-focused-r1-prompt.txt` names ONLY
  jab1:1 drive + jab1:2 extension. Ordered refs: original v2
  jab1 `39223dc7`, accepted walk-v2 `a8e44840`, legacy weapon
  `71c288d1`, body `ee0a0200`, face `0fc579c1`. Actual result
  from preferred ChatGPT image subscription (no fallback notice).
- The model did NOT honor pixel-for-pixel preservation: all nine
  drawings changed (47–52k solid/changed pixels per untouched
  source cell). It DID add full rear wood shafts and gold pommels
  to named cells 1 and 2, with two hands on each shaft, gold
  ferrules, red tassels and single steel blades. The source has
  9 connected figures, zero alpha≥96 sheet-edge pixels, 0 specks;
  98,632 halo pixels cleaned by standard alpha gate under 150k.
  Raw output preserved, not treated as an accepted whole sheet.
- Reproducible, source-preserving local merge by
  `scripts/splice-weiyan-jab1-v2.mjs`: pin BOTH input hashes,
  copy complete cleaned alpha components ONLY from repair for
  named cells 1/2, complete ORIGINAL components for every other
  cell (0,3,4,5,6,7,8). Pixel-owner collision guard and
  post-splice 9-component/edge gates pass; per-component SHA-256
  recorded by script proves unchanged drawings really come from
  v2 original despite the provider's global redraw. Source
  `jab1-v2-prepared-source.png` sha `b39a260b…` (original and
  repair unmodified). Keep [0,1,2,3,4]; cull [5,6,7,8],
  especially spare 7 whose rear shaft remains missing.
- TRUE endpoint overlay actually reviewed: gold butt and silver tip
  land on fittings in all FIVE kept cells; tip-to-pommel raw px
  [469,479,469,495,463] with spread **6.7% of mean**, passing
  this sheet's 10% visible-weapon-length item. Directed axis
  angles [17,-1,-3,24,2]°; consecutive steps [18,2,27,22]°
  (all under 60°). Evidence is sheet-local at raw source scale;
  the full pack and cross-sheet acceptance remain UNVERIFIED.
- Remaining: 8 v2 whole-sheet sequences, page-aware solve and
  capture/landmark review. No v2 runtime activation, no 16MiB
  exception assumed; budget 13/26 (13 remaining).

### jab1-v2-candidate-1 — REJECTED as full sequence 2026-10-04; sha `39223dc7…`

- Request 12/26, jab1 sheet candidate 2/2, RESERVED BEFORE the image
  call via `reserve(ledger, 'weiyan', { role:'hero', n:1,
  kind:'sheet', sequence:'jab1' })`. First tool attempt returned
  transient `fetch failed` with no image; retried the IDENTICAL
  prompt/refs under that one reservation and received one image
  from preferred ChatGPT image provider (no fallback notice).
  Exact prompt is `jab1-v2-prompt.txt`; reference order/hash:
  `weapon-spec-reference.png` `71c288d1…` (only weapon authority),
  body master `ee0a0200…`, portrait master `0fc579c1…`, accepted
  cleaned walk-v2 guard anchor `46546eca…`. No v1 short-saber ref.
- Mechanical: 1536×1024, nine clean components, each nominal grid
  cell covered, no alpha≥96 on sheet edges, 0 detached specks;
  `cleanAlpha` removed 91,381 halo/glow pixels under the 150,000
  tolerance. Candidate kept immutable. Source has partially
  transparent paint (0 fully opaque, 517,495 partial pixels).
- Cleaned 3×3 contact actually inspected: cells 0..4 make a
  usable windup/drive/extension/low follow/recover arc; purple
  turban, black-grey beard, bronze pauldrons and long haft with
  red tassel/ferrule persist, both hands grip the pole, no obvious
  forks or clipped outer edges. Optional cells 5..8 are spares;
  their silhouettes differ enough for a backup pose.
- Endpoint-overlay diagnosis: cells 1, 2 and 7 have no visible
  pommel or rear haft beyond the leading fist—the long weapon is
  genuinely CUT SHORT, despite correct-looking ferrule/tassel and
  blade. The naive leftmost GOLD pixel finder therefore lands on
  their ferrules (111/118/126px blade-only chords); those lengths
  are NOT valid tip-to-pommel observations and may not be counted
  as short-weapon measurements or acceptance passes. The image
  itself independently shows the absent ~200px butt section in
  those three cells. Cells 0,3,4 (core poses with observable ends)
  measure 469,495,463px; other spares 5,6,8 read 445,450,417px.
  Core drive (1) and extension (2) remain missing the full weapon:
  three comparable core poses cannot establish five-pose acceptance.
- DECISION: REJECT this source as a full-sequence replacement;
  no third whole-sheet jab1 permitted. Next turn: reserve one
  **focused** authoring edit (ordinary ledger, NOT repair reserve
  until an assembled pack fails acceptance-4) to redraw only
  jab1:1 and jab1:2 against the intact jab1:0/3/4 and walk anchor;
  preserve the original source and review splice feasibility.
  No pack rebuild or runtime activation yet; 14 requests remain.

### walk-v2-candidate-1 — source ACCEPTED 2026-10-04; pack still UNVERIFIED; sha `a8e44840…`

- Request 11/26, walk sheet candidate 2/2, RESERVED BEFORE the image
  call; actual provider reported only as the preferred ChatGPT image
  subscription (no fallback notice). Exact prompt in
  `walk-v2-prompt.txt`; refs in order: game's own
  `weapon-spec-reference.png` sha `71c288d1…` (weapon authority),
  body master `ee0a0200…` (build/costume), portrait master
  `0fc579c1…` (face/beard); v1 short-saber walk NOT included, to
  prevent weapon contamination. All 3 refs were read in the image
  tool before this image request. Requested 1536×1024 high quality.
- Mechanical gate: 9 alpha-connected figures, all 9 grid cells
  covered, zero solid/alpha-threshold edge contact, 0 specks;
  `cleanAlpha` removed 107,380 low-alpha glow/residue pixels within
  the 150,000 tolerance (original PNG untouched). Source alpha
  is NOT strictly binary (0 fully opaque pixels, 484,389 partial),
  but the same cleanup approach as earlier sheets yields a clean
  nine-figure transparent contact for review; no drawn ground
  shadows remain after cleanup. Figure bboxes by cell are
  448–492px wide × 318–326px tall.
- Visual (source + cleaned 3×3 contact reviewed): correct LONG
  wooden haft with gold butt/ferrule, red tassel and curved steel
  blade in each drawing; both hands contact it, stocky purple
  turbaned identity and short beard persist; walk cycle alternates
  legs, guard cell 0 is planted. Blade remains angled ~13–17°
  below horizontal, no verticals. Some blades legitimately cross
  nominal gutters into empty adjacent space, without a merged
  component or a cut image border; keep [0..8] provisionally.
- Independent first-pass *walk-only* measurement tool:
  `node scripts/dao-v2-walk-measure.mjs` gives raw tip-to-pommel
  459–497px (mean 481px, 7.9% of mean spread) vs ~451px target
  estimated from Zhao Yun's spear/rigger ratio. The walk-family
  **length spread passes ≤10%**, but the ~7% absolute overshoot is
  only an estimate (Zhao Yun and Wei Yan share Build.height=1 but
  their sheet figure poses and headgear differ); do not use the
  target as a registration correction. The tool's tip/bronze
  extrema were CROSS-CHECKED by reading
  `artifacts/tmpcheck/weiyan-v2-walk-endpoints.png`: blue circles sit
  on the gold pommels and green circles on the steel tips in all
  nine cells, with a red chord following each visible haft/blade;
  this confirms the *walk* measurement rather than merely the
  color threshold. Cross-sheet acceptance remains UNKNOWN.
- Not yet packed, page-scaled or offline-continuity-reviewed; the
  previous v1 15.47MB pack is NOT evidence that v2 fits 16MiB.
  The accepted pose reference `weiyan-v2-guard-anchor.png` exists
  only in ignored diagnostics pending that check. The other nine
  v2 sequences and CMR-11B remain outstanding.

## ROOT CAUSE FOUND (2026-10-04): the sheets draw the WRONG WEAPON

Diagnosing the weapon-length failure below led back to the source
of truth, and the failure is not a registration or scatter problem:

- The game's contract (`src/game/art/figures.ts` WEAPONS.dao) is a
  LONG-HANDLED dao: length 69u, haft 5.2, red tassel - fifth-longest
  weapon, 3u under the spear (spear 72, glaive 76, ji 78, pike 82).
  `docs/WEAPON_ART.md`: "Wei Yan retains this game's long-handled
  dao." The legacy rig render shows a long pole with a small blade.
- `IDENTITY.md` (mine) specified a ~58u single-handed saber with no
  tassel, from memory instead of from figures.ts, which the CMR-11A
  spec lists under "read first" and which I did not open. All ten
  sheets were then authored to that wrong weapon. See the
  CORRECTION section appended to IDENTITY.md.
- Measured: v1 tip-to-pommel 270 raw px on a 340px figure
  (0.79 figure-heights); Zhao Yun's spear ~461/323 = 1.43.
  CORRECTION 2026-10-04: 69u is the *haft*, and the blade extends
  about 23u more (`weapons.ts`); the total target is ~92u, versus
  Zhao Yun's ~94u. On that estimated comparator, v1 is ~60% of
  the correct drawn length (~55u equivalent), not "40u/58% of
  69u" or a proven ordering versus a mook sword. Independently,
  it has no long haft and no tassel.
- Acceptance impact: this is a design-identity defect that
  predates and dominates the spread failure. A dao that is the
  wrong weapon cannot pass identity ("consistent weapon design",
  "rigid weapon landmarks") however tightly its length clusters, and
  the repair-protocol "keep the same stable original" premise fails
  because the original is wrong, not drifting.
- Not fixable by the available levers (computed, not assumed):
  best 10%-spread window of the 45 comparable cells keeps 16 and
  needs 29 redrawn; the repair reserve is 3 rounds x 9 cells = 27
  slots at ~0.57 empirical splice yield (10A R1) = ~15 usable, and is
  shared with CMR-11B; remaining authoring is 6 whole-sheet
  candidates. And redrawing cells to a length target would still
  leave every cell the wrong weapon. The correct remedy is a re-brief
  of the weapon across the sequences (a long-handled dao with haft
  and tassel), which exceeds the 16-request authoring cap when added
  to the 10 already spent (6 left vs 9-10 sequences affected).
- This is therefore an OWNER DECISION, not a loop-reachable fix.
  Options and a recommendation are in the TASKS.md status.

## Acceptance-4 measurement (2026-10-04) — FAIL on weapon length (genuine, per-sheet)

(Superseded in importance by the root cause above; kept because the
measurements and method are valid for whatever weapon is finally
drawn, and because they are how the root cause was found.)

Method: `scripts/dao-true-weiyan.mjs` (committed). Largest steel
cluster = blade; PCA axis; tip = steel extreme; blade base = the
end with bronze (guard); pommel located by bronze within 14px of
the axis. A first RANSAC axis fit (copied from the 10A spear chain)
was DISCARDED: the overlay review showed its axes running through
the torso on short-gripped diagonals (jab2:2 517, jab1:4 448 read
as full-body lines), so its numbers are not evidence. All 56 cells
overlay-reviewed on the fingerprinted contact (green tip / orange
blade-base / cyan pommel); endpoints sit on the true fittings in all
but the exceptions listed below.

- BLADE length (tip to guard), displayed px at the applied scales:
  55/56 measured (special:1 UNVERIFIED - blade mostly hidden behind
  the head/arm, steel 555px). Spread **69.7%** (86.3-176.6) over all
  measured; walk family alone **5.2%** (n=9, 122.8-129.4) PASSES.
  Only 13/55 cells sit in the +/-5% band around the walk median
  124.1.
- The failure is STRUCTURAL PER SHEET, not scatter. Median blade vs
  walk: jab1 0.94, jab2 1.02, finisher 0.93, jump 0.87, special
  0.84, and fall 1.19, getup 1.17, misc 1.18, rider 1.17. Within-
  sheet spreads are small on getup (8.9%) and misc (8.0%) - the
  generator drew each sheet with a consistent but DIFFERENT dao
  size (getup/misc/rider/fall ~17-19% long; special/jump 13-16%
  short). Applying the guard-evidence factor to getup (0.916) moved
  it the right way but only the walk and getup sheets carry guard
  cells, so the other eight sheets stay at factor 1, UNVERIFIED.
- Foreshortening/occlusion floor: jab1:0 (88), fall:0 (86),
  special:0/2/4 (100-104), jump:1/2/3 (102-104) read short because
  the blade points toward/away from the camera or is occluded; they
  are comparable-set EXCLUSIONS per the recovery protocol, not
  proven art defects, and the long-side cells cannot be excluded on
  that ground.
- VERDICT: weapon-length spread FAILS the <=10% item.
- CORRECTION (same turn, measured): an earlier draft of this verdict
  said the fix was a per-sheet scale factor. The matched standing-
  guard cells (walk:0 vs getup:4, same pose) disprove that: the
  FIGURE is 1.094x walk (bboxH 372 vs 340) but the BLADE is 1.160x
  (raw 225 vs 194), i.e. the dao is drawn ~6% longer RELATIVE TO THE
  BODY on getup. One uniform scale per sheet can reconcile the body
  OR the blade, not both: the body-proxy factor (0.914, applied)
  leaves the blade ~6% long on that pose (and ~17% long across the
  sheet median, 1.17x walk even after the factor), while the blade-
  proxy factor (0.862) would shrink the figure to 94.3% of the walk
  guard. The two proxies DISAGREE by 0.052 (> the 0.05 agreement
  rule), so NO blade factor may be applied - the rule exists
  exactly for this case, and it is not bent here.
- Consequence: the long sheets (getup, misc, rider, fall; ~17-19%
  over walk) carry a proportion drift in the drawings themselves.
  That is a source-art defect class, so the acceptance-4 recovery
  protocol applies (reserve-before-call focused redraws, repair
  ledger 0/3 used), OR an owner waiver on the 09A/10A precedent.
  The short sheets (special 0.84, jump 0.87) are mostly the
  foreshortening exclusions above and need the comparable-set
  review before anything is redrawn. No image request this turn.

## Direction (2026-10-04) — marginal 2/44, authored-bridge candidates

- Chord (tip-vs-base) UNDIRECTED step check, 44 steps: 2 exceed
  60deg: jab1:3 -> jab1:4 (61.7) and jump:0 -> jump:1 (60.5) - both
  within 1.7deg of the limit. The directed (+up, 0=right) angles
  show the drawings genuinely swing the blade through ~170deg
  between the specials' coil/strike and the rider windup/sweep
  (e.g. jab2:0 -167deg -> jab2:1 +25deg), but those are 180deg
  flips of the SAME blade axis (undirected equivalent is the
  precedent method from 09A/10A) - not a pose discontinuity.
- VERDICT: PASS-marginal (undirected precedent method, 2 cells at
  60.5-61.7 by chord) pending the registration-level re-check after
  any sheet scale change (angles are scale-invariant, so a scale
  fix cannot cure them; an authored bridge or one focused redraw
  of jab1:4 would). Not blocking while the weapon item is open.

## Head (2026-10-04) — auto face-cluster method VOID again (turban/beard/hand/steel/pauldron hits)

- D0/D1/D2: 55.3% / 54.7% / 43.7% (n=56/49/19); walk alone 9.7%.
  These are NOT head measurements. Forensic strip (12 cells,
  fingerprinted read) proves the "face" clusters land on a HAND
  (jab1:0, fall:0), a bronze PAULDRON (misc:1), BLADE STEEL (jump:2:
  59x18 steel read as skin) and a foreshortened prone face (fall:4),
  while the upright faces (walk:0/4, getup:4, jab2:2, finisher:2,
  rider:0, special:3) are the lower-right cheek/mouth band only -
  turban crops the forehead, beard crops the jaw - so the cluster is
  a fraction of the head even when it is on the face.
- Same treatment as 10A: no direct number is claimed. Indirect
  evidence only: upright cluster displayed sizes cluster at
  13.7-17.7 across walk/getup/finisher/rider/special with no
  drift pattern, but the getup/finisher/rider faces read ~10-25%
  larger than walk:0 in the strip - CONSISTENT with the blade
  evidence (those sheets were drawn larger), so the sheet-scale
  offsets above are the same defect seen twice, not two defects.
- Head UNVERIFIED by direct measurement. The getup/finisher/rider
  faces reading larger than walk:0 fits the same per-sheet drawing-
  size drift as the blade evidence, but that is an inference from a
  contaminated detector, not a measurement - it stays UNVERIFIED and
  rides with the weapon-length decision (redraw round or waiver).

## Attempts

### rider-candidate-1 (ACCEPTED 2026-10-04) — sha `1d80450d…`

- Request 10/16 (sheet rider 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 seated rider set + spares, no horse
  parts anywhere.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 87K, 0 specks).
- Review: keep [0,1,2,3,4,5] in play order (idle/trot/mount/
  windup/sweep/dismount) - all seated straddling with NO horse
  parts drawn; dao full in all, clean anatomy, no forks/
  verticals. Cull {6,7,8} (clean spares).

### special-candidate-1 (ACCEPTED 2026-10-04) — sha `95c51b7e…`

- Request 9/16 (sheet special 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 whirlwind special + spares, zero
  effects paint. First image call failed with a transient fetch
  error (no image); retried under the SAME reservation (1 image
  for 1 slot, per the 10A 520 precedent).
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 96K, 0 specks).
- Review: keep [0,1,2,3,4] in play order (raise/coil/pre-spin/
  strike/follow) - zero effects paint anywhere (no speed lines
  or glows); dao full in all, clean anatomy, no forks/verticals
  (steepest blade ~45deg, within rule). Cull {5,6,7,8}.

### misc-candidate-1 (ACCEPTED 2026-10-04) — sha `69be09d1…`

- Request 8/16 (sheet misc 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 hurt/grab reactions + spares, dao
  gripped throughout.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 79K, 0 specks).
- Review: keep [0,1,2,3,4] in play order (hurt-recoil/hurt-
  fold/grab-clamp/grab-hold/release) - defined fingers on all
  extended hands, no mittens; dao full in all, clean anatomy,
  no forks/verticals. Cull {5,6,7,8} (clean spares).

### getup-candidate-1 (ACCEPTED 2026-10-04) — sha `78949e6b…`

- Request 7/16 (sheet getup 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 prone-to-stand arc + spares, dao
  gripped throughout.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 64K, 0 specks).
- Review: keep [0,1,2,3,4] in play order (elbow/kneel/crouch/
  half-rise/stand) - stand matches the guard reference; dao
  full in all, clean anatomy, no forks/verticals.
  Cull {5,6,7,8} (clean spares).

### fall-candidate-1 (ACCEPTED 2026-10-04) — sha `cd3d7414…`

- Request 6/16 (sheet fall 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 knockdown arc + spares, dao
  gripped/alongside throughout.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 89K, 0 specks); tumble compact (364x350, no fit risk).
- Review: keep [0,1,2,3,4] in play order (topple/airborne/
  tumble/impact/DOWN) - flat still DOWN bookend verified;
  dao full in all, clean anatomy, no forks/verticals.
  Cull {5,6,7,8} (clean spares).

### jump-candidate-1 (ACCEPTED 2026-10-04) — sha `f2961149…`

- Request 5/16 (sheet jump 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 airborne arc + spares, all feet off
  ground, dao gripped throughout.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 89K, 0 specks); cell bboxes incl. a tall 329x416 apex.
- Review: keep [0,1,6,3,5,7] in play order (takeoff/ascent/
  apex/kick/descent/landing). Cell 2's stretched apex (416px
  tall, steep blade) is CULLED for fit - it would cap base at
  0.644 (guard ~208px, below the hero floor); cell 6's tucked
  ball (303px, horizontal dao) subs as apex (gather-then-
  explode before the kick, same accepted pattern as zhaoyun).
  Cull {2,4,8}. All kept: full uniform dao, clean anatomy.

### finisher-candidate-1 (ACCEPTED 2026-10-04) — sha `8101c921…`

- Request 4/16 (sheet finisher 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 heavy diagonal chop + spares (weightier
  than slash/sweep), identity lock, dao length vs the anchor.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 102K, 0 specks); wide straddles (to 541px) but no merges.
- Review: keep [0,1,2,3,4] in play order (coil/launch/chop-
  extension/impact-follow/recover) - all heavy diagonals within
  the 50deg rule (extension ~35-40deg), clearly weightier than
  the jabs; full uniform dao, clean anatomy, no forks/verticals.
  Cull {5,6,7,8} (clean spares).

### jab2-candidate-1 (ACCEPTED 2026-10-04) — sha `74759595…`

- Request 3/16 (sheet jab2 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 low sweeping combo + spares (clearly
  crouching, distinct from jab1), identity lock, dao length vs
  the anchor.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 86K, 0 specks); wide straddles (up to 579px) but no
  merges (1 component per cell).
- Review: keep [0,1,2,3,4] in play order (low chamber/rising
  drive/full low extension/follow/recover) - all crouching, all
  blades within ~30deg of horizontal (no verticals anywhere),
  full uniform dao, clean anatomy, no forks. Clearly distinct
  from jab1's upright slashes. Cull {5,6,7,8} (clean spares).

### jab1-candidate-1 (ACCEPTED 2026-10-03) — sha `1cd3eb15…`

- Request 2/16 (sheet jab1 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`, walk-guard anchor
  `2a3635ca`. Prompt: 3x3 slash combo + spares, identity lock,
  dao length vs the anchor.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 81K, 0 specks); bboxes 285-550 x 242-339 (no merges).
- Review: keep [0,1,2,3,4] in play order (windup/drive/
  extension/follow/recover) - all read correctly with full
  uniform dao, clean anatomy, no forks. Cell 0 windup is the
  steepest blade (~65°, over the 50° guideline) but its
  component fits (339px) and spares 6/8 are steeper - accepted
  with a flag for the acceptance-4 direction re-check.
  Cull {5,6,7,8} (spares; 6/8 too steep for use).

### walk-candidate-1 (ACCEPTED 2026-10-03) — sha `78491237…`

- Request 1/16 (sheet walk 1/2). Refs in order: body master
  `ee0a0200`, portrait master `0fc579c1`. Prompt: 3x3 guard +
  8-cycle, identity lock, dao low-diagonal, gutters.
- Mechanical: 9/9 clean, all cells covered, 0 edge, gate green
  (glow 80K, 0 specks); bboxes 315-405 x 318-340 (no merges).
- Review: cell 0 standing guard (planted, dao low-diagonal);
  cells 1-8 genuine alternating 8-cycle; turban/bronze/purple/
  beard/dao-with-guard on all, uniform scale, clean anatomy, no
  forks/verticals/clips. Keep all 9 (guard + 8-cycle).
