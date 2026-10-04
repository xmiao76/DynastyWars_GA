# Wei Yan provenance (CMR-11A)

- Authoring: 11/26 used (owner `Do A`: +10 to Wei Yan's original
  16-request cap; usage NOT reset). V1 ten sheets are retained as
  pose references but weapon-rejected; v2 walk is provisional
  (see its entry). 15 requests remain. Global 200 and the two
  whole-sheet candidates per sequence remain unchanged.
- Repair reserve: 3/3 untouched (shared with CMR-11B).
- Masters: body `ee0a0200…`, portrait `0fc579c1…` (inspected
  2026-10-03, required before authoring).

## Owner option A in progress (2026-10-04): correct long-handled dao

Owner explicitly chose A (`Do A`): extend Wei Yan's authoring cap
16 → 26 (+10), NOT reset the ten v1 requests. The durable budget
ledger now says 11/26, total 78/200; walk's second (last) sheet
candidate is consumed, and the separate repair reserve stays 3/3.
`AUTHORING-PLAN-V2.md` and the authoritative v2 section in
`IDENTITY.md` re-brief every sequence from the actual legacy rig.
The v1 pack is NOT accepted or integrated; its source sheets stay
untouched and provide pose/identity reference only.

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
