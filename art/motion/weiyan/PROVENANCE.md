# Wei Yan provenance (CMR-11A)

- Authoring: 25/26 used (owner `Do A`: +10 to Wei Yan's original
  16-request cap; usage NOT reset). V1 ten sheets retained as pose
  refs but weapon-rejected. ALL TEN v2 sequences source-accepted.
  Pack re-solved with VERIFIED getup factor 0.837 (16MB-first
  fit, 9.8% margin). Acceptance-4 DIAGNOSED: weapon FULL-56
  31.3% FAIL (15-cell list), head auto VOID + consistency PASS,
  direction PASS. Repair campaign next. One authoring request
  remains. Global 200/two whole sheets/sequence unchanged; every
  sequence used both whole-sheet slots (only focused edits remain).
- Repair reserve: 3/3 untouched (shared with CMR-11B).
- Masters: body `ee0a0200…`, portrait `0fc579c1…` (inspected
  2026-10-03, required before authoring).

## Owner option A in progress (2026-10-04): correct long-handled dao

Owner explicitly chose A (`Do A`): extend Wei Yan's authoring cap
16 → 26 (+10), NOT reset the ten v1 requests. The durable budget
ledger now says 25/26, total 92/200; every consumed second
whole-sheet candidate stands; later jab1/jab2/jump/fall/rider
edits were FOCUSED, not third whole-sheet candidates; and the
separate repair reserve
stays 3/3.
`AUTHORING-PLAN-V2.md` and the authoritative v2 section in
`IDENTITY.md` re-brief every sequence from the actual legacy rig.
The v1 pack is NOT accepted or integrated; its source sheets stay
untouched and provide pose/identity reference only.

### acceptance-4 diagnosis — weapon FULL 31.3% FAIL, head VOID, direction PASS 2026-10-05; landmarks `landmarks-final.json`

- New `scripts/landmarks-final-weiyan-v2.mjs` (zhaoyun method):
  TRUE endpoints per kept cell (verbatim per-sequence code), raw
  cross-checked vs PROVENANCE record — all 56 match ±1px, ZERO
  mismatches; displayed = raw × sheet scale; face clusters +
  play-order direction steps. Wrote `landmarks-final.json`.
- WEAPON: per-sequence displayed ALL pass (5.7%–10.0%). FULL-56:
  248.3–343.5, mean 304.1, spread **31.3% FAIL**. Valid method
  (overlay-verified endpoints, zero drift) → REAL sheet-systematic
  variation (finisher long ~328, getup short ~261 after legitimate
  0.837 figure normalization, rest ~300–315). Exact 15-cell failing
  list vs mean band [288.9,319.3]: LOW getup×5 + jab2:3,4
  (extend); HIGH finisher×4 + jump:3 + rider:0,3 + special:4
  (shorten).
- HEAD: D0 71.3%, D1 71.8%, D2 upright 16.8% — auto face-cluster
  method VOID (verified on face contact: clusters on pauldrons/
  hands for jump:1, fall:2, misc:1, special:0, special:4 etc.;
  turban/beard crop inconsistently). 10A precedent applies.
  Consistency evidence PASSES: walk-only 3.7%, overlay-verified
  guard faces 13.01 vs 12.49 displayed (4.1%), visual uniformity.
- DIRECTION: max consecutive step 30° (finisher) ≤60 PASS
  everywhere (walk 4, jab1 27, jab2 8, finisher 30, jump 10,
  fall 10, getup 5, misc 20, special 21, rider 20).
- DECISION: bounded deterministic repair campaign (retouch, NO
  image requests, poses preserved) — NOT a waiver request yet
  (10A repaired R1 first; resources not exhausted). Getup room
  probed: 4/5 rear-extensions fit (29–77px needs), cell6 needs
  novel forward blade-assembly extension (400px clear space;
  method sound, unproven). Campaign: one multi-op script + seam
  reviews + re-measure; if ops fail gates/seams → STOP →
  BLOCKED + waiver request citing 09A/10A (weiyan 31.3% <
  zhaoyun waived 35–40%, all sheets pass, direction passes).
- Budget untouched (25/26, repair 3/3); no runtime activation.

### v2 guard measurement — getup factor 0.837 VERIFIED, pack re-solved 2026-10-05; manifest `2fef24a5…`

- New `scripts/measure-weiyan-v2.mjs` (v1 script untouched): same
  skin-cluster + bbox method over the ten v2 sources; guard-like
  cells walk:0 + getup:4 only (no other standing guards). Wrote
  `measurements-v2-raw.json` + `scale-compare-v2.json`.
- Guard faces VERIFIED on overlay (green boxes on true
  eyes/nose/cheeks bands, red centre lines, yellow ground lines):
  walk:0 face 24×27 area 423 f2g 276; getup:4 face 30×30 area
  556 f2g 332. Proxies: ground 276/332=0.831, height 319/378=
  0.844; spread 0.013 ≤0.05, mean → factor 0.837 APPLIED
  (getup visibly oversized in overlay, shrink genuine).
  Face-area proxy 0.872 recorded, unused by rule.
- Honest thin spot: walk face-size evidence n<3 (walk:0's own
  24px-wide face misses the w≥25 gate by 1px) → referenceFaceSize
  =26.46 rests on <3 faces and per-sheet face-size factors are
  informational JUNK; the applied rule uses only the two
  geometric proxies (verified above). No gate changes (would be
  cherry-picking).
- Re-solve: base 0.632606 (was 0.623906), getup scale 0.529491,
  all else factor 1 UNVERIFIED (correct — no guard cells).
  56/56 unique, deterministic manifest `2fef24a5`, pages ≤2048²,
  15,127,960 B = 14.43 MiB (9.8% margin), 0 step-downs, 9
  bounds-overlap suspects (same review-flag class). Guard 201.8px
  = 84.1% Guan Yu.
- Next: cross-sequence acceptance-4 landmarks + offline continuity
  review. No runtime activation.

### v2 pack first solve — FITS 16MB, factors UNVERIFIED 2026-10-05; manifest `007790c5…`

- New `scripts/prepare-weiyan-v2.mjs` (v1 script untouched for
  reproducibility) points at the ten accepted v2 sources with
  their proven keep maps; revision `weiyan-2`. V2 guard
  measurement files do not exist yet, so ALL per-sheet factors
  are honestly 1 UNVERIFIED (v1 factors NOT reused — different
  art). `registration.json` SUPERSEDED v1→v2 (v1 kept in git
  history; v1 numbers: base 0.663804, guard 225.7px).
- Solve: base 0.623906 (BUDGET-bound; fit bound 0.709), zero
  step-downs. 56 frames / 56 unique / 0 duplicates / 34 unused
  cells; deterministic double-run manifest `007790c5`.
  Pages 1939×1899 + 612×197 (both ≤2048²); page pixels
  15,210,900 B = 14.51 MiB ≤ 16MiB contract (9.3% margin).
  NO exception needed or requested — 16MB-first holds.
- 9 suspects, ALL `bounds overlap - review for merge` between
  adjacent figures (jab1×2, jab2, finisher, jump×2, fall,
  rider×2): expected bounding-box overlaps from straddling
  polearms, NOT merges — every sheet verified 9 (or 5)
  alpha-separated components and the pack built all 56 unique
  frames. Same review-flag class as prior packs.
- Honest scale note: walk guard 199.0px = 82.9% of Guan Yu 240
  (mook archer 223px) — v2 Wei Yan renders SMALLER than a mook,
  the price of the correct long dao under the cap (v1 short dao:
  225.7px). No acceptance criterion pins absolute scale; factors
  still UNVERIFIED (two-proxy measurement next); owner judges
  the rendered hierarchy at 11B captures. NOT a contradiction —
  no exception case.
- Next: v2 guard/height measurement (two-proxy factors),
  cross-sequence acceptance-4 landmarks, offline continuity
  review. No runtime activation.

### rider-v2-retouched-source — ACCEPTED rider drawings 2026-10-05; sha `5c5cba35…`

- Deterministic authored retouch of the SPLICED dismount cell
  (450→480px): cap piece −29px along the measured 13.51° axis
  (1,132 px moved), gap median-filled with real shaft wood
  (626 px). Poses untouched; input hash-pinned to the splice
  output `c80ff854`. `scripts/retouch-weiyan-rider-v2.mjs`.
- Verified: only cell 5 differs (other 8 component-SHA identical
  to the splice input); output rebuilt byte-identically on rerun;
  4x seam crop reviewed (continuous shaft, matching highlight,
  neighboring blade and robe untouched); endpoint overlay re-read
  (blue ring on the shifted pommel, green on the complete tip).
- Final play order row-major [0..5], cull [6,7,8]:
  [512,491,485,516,481,480]px, mean 494.2, spread **7.29%**
  (≤10% source-level PASS); angles [-4,11,-9,-9,-5,11]°,
  steps 15,20,0,4,16 (≤60). Source-level only: scale/ground/
  16MiB/cross-sequence/continuity UNVERIFIED. No runtime
  activation, no waiver.

### rider-v2-focused-r1 — sweep fixed, dismount still short 2026-10-05; sha `9eb1726f…`

- Request 25/26, ordinary AUTHORING kind focused for named
  rider:4 + rider:5, RESERVED BEFORE call. Exact prompt in
  `rider-v2-focused-r1-prompt.txt`; refs: original rider
  `21bda51b`, walk `a8e44840`, weapon `71c288d1`, body
  `ee0a0200`, portrait `0fc579c1`. Preferred provider, one
  image, no fallback notice.
- Result: sweep cell4 554→481px FIXED (pose preserved);
  dismount cell5 blade completed clear of the edge but only
  450px (still short). Mechanical 9/9, 0 edge, 11 specks
  removed. `scripts/splice-weiyan-rider-v2.mjs` (SHA-pinned,
  component-owner collision + edge gates) spliced ONLY cells
  4/5 into the immutable original → `rider-v2-prepared-source`
  sha `c80ff854`, 9 separated figures. Dismount then retouched
  (above) instead of spending another request.

### rider-v2-candidate-1 — REJECTED as complete sequence 2026-10-05; sha `21bda51b…`

- Request 24/26, rider sheet candidate 2/2 (LAST whole-sheet
  slot), reserved/persisted BEFORE one image call. Preferred
  ChatGPT image returned a single 1536×1024 sheet, first try.
  Exact `rider-v2-prompt.txt`; ordered SHA refs legacy weapon
  `71c288d1`, body master `ee0a0200`, portrait `0fc579c1`,
  cleaned walk-v2 guard `46546eca`, accepted misc prepared
  source `84a23584` (body/style continuity only).
- Mechanical: 9/9 alpha-connected figures across all nine cells,
  but 25 alpha≥96 pixels ON the sheet's right border (dismount
  cell5's blade tip cut at x=1535 — pipeline FAIL). Standard
  cleanup removed 96,597 low-alpha halo pixels + zero specks
  (under 150k); cleaned contact inspected. All nine seated
  straddling with NO horse parts drawn; turban/beard/bronze/
  purple stable; idle/trot/mount/windup/sweep/dismount arc
  reads correctly; no forks/verticals.
- TRUE endpoint overlay actually read: source cells 0..8
  [512,491,485,516,554,406,507,487,469]px. Core six [0..5] =
  [512,491,485,516,554,406]px, mean 494.0, spread 148/494 =
  30.0%, FAIL. TWO genuine defects, both endpoint-verified:
  sweep cell4 LONG (554px, rings on true fittings) and
  dismount cell5 SHORT (406px) *because its blade is cut by
  the sheet edge* (green ring sits exactly on the border;
  steel mass only 1362px vs ~2000-2700 elsewhere). Angles
  [-4,11,-9,-9,-5,17]°, steps ≤22 (direction fine).
- No spare fix: dismount is irreplaceable (only dismount pose;
  spares 6/7/8 are plain seated) and sweep is irreplaceable
  (only extended sweep). Retouch cannot invent the 25px of
  blade tip cut off at the border — that would be fabrication
  beyond the translate/duplicate precedent. Next: ONE focused
  ordinary-authoring edit of named rider:4 + rider:5 (→25/26),
  then source-preserving splice + re-measure. Poses are right;
  no third whole sheet exists.
- Source REJECTED as complete pack input. Budget 24/26 (2
  remain, focused-only), repair reserve 3/3 untouched; no
  runtime activation or 16MiB exception assumed.

### misc-v2-candidate-1 — selected-cell source ACCEPTED 2026-10-05; sha `b4b2f3eb…`

- Request 23/26, misc sheet candidate 2/2, reserved/persisted
  BEFORE one image call. Preferred ChatGPT image returned a single
  1536×1024 sheet, first try. Exact `misc-v2-prompt.txt`; ordered
  SHA refs legacy weapon `71c288d1`, body master `ee0a0200`,
  portrait `0fc579c1`, cleaned walk-v2 guard `46546eca`, accepted
  getup prepared source `e88295dc` (body/style continuity only).
- Mechanical: 9/9 alpha-connected figures distributed across all
  nine cells, zero source-edge contact. Standard cleanup removed
  94,893 low-alpha halo pixels + zero specks (under 150k);
  cleaned contact inspected. Stable purple turban, short beard,
  bronze pauldrons, long wood shaft with gold butt/ferrule/red
  tassel and small silver curved blade; distinct recoil/fold/
  brace/release reactions, defined fingers, no second figure.
- TRUE endpoint overlay actually read: source cells 0..8
  [488,461,479,526,501,464,507,484,488]px. Raw core [0..4] =
  [488,461,479,526,501]px, spread 65/491 = 13.2%, FAIL
  (grab-hold cell3 long at 526px; endpoint-verified, not a
  ferrule-hit).
- Legitimate spare replacement: cell 7 (lean-back braced hold,
  484px) subs for hold, giving play order [0 recoil,1 fold,
  2 clamp,7 hold,4 release] with lengths [488,461,479,484,
  501], mean 482.6, spread 40/482.6 = **8.29%**, directions
  [-14,6,1,-8,-5]°, steps ≤20 (sub-actions, no temporal arc).
  Ordered contact actually viewed: spare7 is a true same-phase
  hold pose, not a value-picked mismatch. Cull [3,5,6,8];
  no extra request.
- `scripts/prepare-weiyan-misc-v2-source.mjs` pins ORIGINAL SHA
  and culls only those four cells before alpha cleanup. Two runs
  produced the same `misc-v2-prepared-source.png` sha
  `84a23584` with five separated figures [0,1,2,4,7], no
  outer-edge pixels, 51,947 halo pixels removed and zero specks.
  Actually viewed prepared transparent sheet: full gold butt /
  red tassel / blade on each of five kept poses, other four gone.
- ACCEPTED source drawings only. Full pack fit, consistent scale,
  cross-sequence 10% head/weapon spread, direction continuity and
  offline exposure remain UNVERIFIED. Ledger 23/26, three left,
  repair reserve 3/3 untouched; no runtime activation or 16MiB
  exception assumed.

### getup-v2-candidate-1 — selected-cell source ACCEPTED 2026-10-05; sha `a2a361d4…`

- Request 22/26, getup sheet candidate 2/2, reserved/persisted
  BEFORE one image call. Preferred ChatGPT image returned a single
  1536×1024 sheet, first try. Exact `getup-v2-prompt.txt`; ordered
  SHA refs legacy weapon `71c288d1`, body master `ee0a0200`,
  portrait `0fc579c1`, cleaned walk-v2 guard `46546eca`, accepted
  fall retouched source `161b4efe` (body/style continuity only).
- Mechanical: 9/9 alpha-connected figures distributed across all
  nine cells, zero source-edge contact (nearest bbox x0=9).
  Standard cleanup removed 78,190 low-alpha halo pixels + nine
  1px specks (under 150k); cleaned contact inspected. Stable
  purple turban, short beard, bronze pauldrons, long wood shaft
  with gold butt/ferrule/red tassel and small silver curved blade;
  distinct prone-push/kneel/crouch/rise/stand arc, no verticals.
- TRUE endpoint overlay actually read: source cells 0..8
  [537,469,440,515,485,437,500,483,500]px. Raw core [0..4] =
  [537,469,440,515,485]px, spread 97/489.2 = 19.8%, FAIL
  (elbow cell0 long at 537, crouch cell2 short at 440; both
  endpoint-verified, not ferrule-hits).
- Legitimate spare replacement: cell 6 (bent-over hand-on-ground
  push-up phase, 500px) subs for elbow, cell 8 (deep crouch,
  500px) subs for crouch, giving play order [6 elbow-push,
  1 kneel, 8 crouch, 3 half-rise, 4 stand] with lengths
  [500,469,500,515,485], mean 493.8, spread 46/493.8 =
  **9.32%**, directions [9,5,10,5,10]°, steps ≤5. Ordered
  contact actually viewed: low push → kneel → deep crouch →
  rising lunge → upright guard is a legible rise; both spares
  are true same-phase poses, not value-picked mismatches.
  Cull [0,2,5,7]; no extra request.
- `scripts/prepare-weiyan-getup-v2-source.mjs` pins ORIGINAL SHA
  and culls only those four cells before alpha cleanup. Two runs
  produced the same `getup-v2-prepared-source.png` sha
  `e88295dc` with five separated figures [1,3,4,6,8], no
  outer-edge pixels, 44,833 halo pixels removed and nine 1px
  specks. Actually viewed prepared transparent sheet: full gold
  butt / red tassel / blade on each of five kept poses, other
  four gone.
- ACCEPTED source drawings only. Full pack fit, consistent scale,
  cross-sequence 10% head/weapon spread, direction continuity and
  offline exposure remain UNVERIFIED. Ledger 22/26, four left,
  repair reserve 3/3 untouched; no runtime activation or 16MiB
  exception assumed.

### fall-v2-retouched-source — ACCEPTED fall drawings 2026-10-05; sha `161b4efe…`

- Deterministic authored retouch of BOTH outliers (jump-landing
  method, NO image request): tumble cell2 EXTENDED 438→485px
  (cap piece −47px along 1.93° axis, 985 px moved, 795 gap px
  median-filled; 6px clearance to neighbor verified + 9-component
  gate); DOWN cell4 SHORTENED 558→490px (cap piece +68px overlap,
  1,378 px, no fill invented). Poses untouched; input hash-pinned
  (`3516d964`). `scripts/retouch-weiyan-fall-v2.mjs`, eslint clean.
- Method notes (honest): color-gated head exclusion was tried and
  REMOVED after two false trips (cap gold (128,89,22) at h=37.9
  matched skin; shaft wood (128,86,65) at v=0.502 matched skin) —
  DOWN cap selection is flood-fill from the pommel centroid with a
  count gate (~1.1k expected; a head leak would add 10k+). A first
  extend run split cell2 (10 components) because the median slab
  was sampled post-clear; fixed by sampling pristine input. A gap-
  strip gate initially tripped on real turban pixels 6px from the
  cap; verified by RGB dump + 4x crop that a true transparent gap
  separates them. All failures encoded as gates, not silent.
- Verified: only cells 2,4 differ (other 7 component-SHA identical
  to input); output rebuilt byte-identically on rerun; 4x seam
  crops reviewed (tumble join continuous; DOWN cap intact, turban
  undamaged, cap/shaft join clean); endpoint overlay re-read
  (rings on true fittings, incl. shifted caps).
- Final play order row-major [0..4], cull [5..8]:
  [502,470,485,500,490]px, mean 489.4, spread **6.54%** (≤10%
  source-level PASS); angles [-16,-6,-1,-2,-2]°, steps 10,5,1,0.
  Source-level only: scale/ground/16MiB/cross-sequence/continuity
  UNVERIFIED. No runtime activation, no waiver.

### fall-v2-focused-r1 — under-corrected, preserved unused 2026-10-05; sha `41de76eb…`

- Request 21/26, ordinary AUTHORING kind focused for named fall:2
  + fall:4, RESERVED BEFORE call. Exact prompt in
  `fall-v2-focused-r1-prompt.txt`; refs: original fall `3516d964`,
  walk `a8e44840`, weapon `71c288d1`, body `ee0a0200`, portrait
  `0fc579c1`. Preferred provider, one image, no fallback notice.
- Result: tumble 438→460px (+22 of +47 needed), DOWN 558→549px
  (−9 of −68 needed) — movement in the right direction on both,
  but still outside any compliant band. Preserved immutable;
  NOT spliced (deterministic retouch on the original achieved
  full correction instead). Lesson (3rd data point after jump):
  the generator does not honor explicit pixel-length targets —
  prefer deterministic retouch whenever poses are already right.

### fall-v2-candidate-1 — REJECTED as complete sequence 2026-10-05; sha `3516d964…`

- Request 20/26, fall sheet candidate 2/2, RESERVED BEFORE the image
  call. First image attempt failed with `Attachment object is
  missing` (no image); all five refs were then re-read in the image
  tool and the IDENTICAL call retried under the SAME reservation
  (1 image for 1 slot, per precedent) — preferred ChatGPT image
  provider, no fallback notice. Exact prompt in
  `fall-v2-prompt.txt`; refs in order: legacy weapon `71c288d1…`
  (only weapon authority), body `ee0a0200…`, portrait `0fc579c1…`,
  walk-v2 guard anchor `46546eca…` (length ruler), jump retouched
  `0f3dc631…` (body/style continuity only). No v1 weapon ref.
- Mechanical gate: 9 alpha-connected figures, all 9 grid cells
  covered, zero edge contact, 0 specks; `cleanAlpha` removed 77,028
  low-alpha glow pixels within tolerance (original PNG untouched).
  Tumble compact (444x237, no fit risk); DOWN flat (563x169).
- Visual (cleaned 3x3 contact sha `12c91896`, actually reviewed):
  topple leans back off-balance, airborne/tumble genuinely off
  ground, impact sprawls, DOWN lies flat on back with eyes closed
  and weapon gripped alongside, spares distinct (twist/crouch/
  sprawl/prone). Turban/bronze/beard/purple stable, no forks,
  no verticals, full haft + gold pommel/ferrule + red tassel +
  curved steel blade visible in every cell.
- TRUE endpoints (overlay sha `a1ebec77`, actually read; blue on
  gold pommels, green on steel tips in all 9 cells): all cells
  [502,470,438,500,558,449,502,481,480]px, angles
  [-16,-6,-1,-2,-2,6,6,3,0]°. Core [0..4] = [502,470,438,500,
  558]px, mean 493.6, spread 120/493.6 = **24.3% FAIL**. TWO
  genuine opposite defects (both endpoint-verified, not
  ferrule-hits): tumble cell2 SHORT (438px) and DOWN cell4 LONG
  (558px). Spares cannot fix it: DOWN is irreplaceable (only
  flat-on-back drawing; spares are twist/crouch/sprawl/prone),
  and with DOWN at 558 no other cell reaches the compliant band
  (min would need ≥505px; next-best is 502px). Tumble spares
  (nearest: spare5 449px, wrong pose anyway) don't help either.
- DECISION: REJECT as complete pack input; no third whole-sheet
  fall permitted. Next: deterministic authored retouch (NO image
  request, jump-landing method) — EXTEND tumble cell2's rear shaft
  (~438→~485px) and SHORTEN DOWN cell4's (~558→~490px) by rigid
  axis translation, each verified by seam crop + endpoint overlay
  + component-hash proof that nothing else moved. Poses are
  correct; only rigid lengths are wrong, so no generative redraw
  is justified yet. If either retouch collides or reads unclean,
  fall back to one focused ordinary-authoring edit. No pack
  rebuild or runtime activation; 6 requests remain.

### jump-v2-retouched-source — ACCEPTED jump drawings 2026-10-04; sha `0f3dc631…`

- NO image request and NO ledger event: the landing's only defect
  was a SHORT REAR HAFT (439px vs ~475–506px elsewhere). The shaft is
  a straight uniform wood cylinder, so lengthening it is a
  translation along its own axis, done by
  `scripts/retouch-weiyan-jump-landing-v2.mjs` (input hash-pinned to
  `jump-v2-prepared-source.png` `5a4244cf`): the pommel/cap piece
  (axis coordinate t<24, |o|≤40 → 1,106 px) slides back 44.15px
  along the measured 13.26° axis, and the gap (788 px) is filled
  from a per-row MEDIAN cross-section of the real shaft wood (t
  24–44, clean of robe/hand). Only landing cell5 changes.
- First fill variant tiled a 6px slab and the 5x seam crop showed a
  repeating dark grain dot every 6px (a dotted line); REJECTED and
  replaced by the median fill. Re-read the 5x before/after seam
  crop: continuous cylinder, lengthwise shading preserved, only a
  faint seam at the join. The retouched drawing at gameplay size
  and 2x reads as an unaltered grounded landing (both boots planted,
  knees bent, two-handed grip, gold butt/ferrule/red tassel/steel).
- Verified by script (`jump-retouch-verify`): cells 0,1,2,3,4,6,7,8
  component-SHA identical to the input; ONLY cell 5 differs.
  Output rebuilt byte-identically on rerun (sha `0f3dc631`), 9
  separated figures, no edge contact.
- TRUE endpoint measure of retouched cell5: **483px** (pommel
  ring on the gold cap, tip ring on steel; overlay re-read). Final
  play order [0 takeoff,1 ascent,2 apex,6 kick,4 descent,5
  landing] (cull 3,7,8): raw lengths [477,491,475,506,485,483],
  mean 486.2, spread **6.376%** (≤10% PASS at source level).
  Cell 3 (579px) is excluded as an over-stretched kick, spare
  cell6 (506px, full weapon, extended boot) is the kick. Directions
  [2,8,-2,6,12,9]° in play order (measured per cell), steps
  6,10,8,6,3 → ≤10°. Ordered contact sha `5c59d9a9`
  actually viewed: crouch → rise → tuck → kick → descent →
  grounded landing is a legible clip.
- Honest limits: the landing is an authored retouch of generator
  pixels (documented here, deterministic, reversible by re-running
  from the pinned input); 483px lands inside the sheet's own
  475–506px band. Source-level only: scale, ground registration
  (landing cell5 y1=700 vs takeoff0 y1=363 straddle their rows),
  16MiB fit, cross-sequence spread and offline continuity are
  UNVERIFIED. No runtime activation, no waiver, repair reserve 3/3.
- This method (axis translation + median fill of a uniform shaft)
  is reusable for other short-haft cells in remaining sheets when
  the drawing is otherwise correct; it never touches a cell that
  needs a new pose.

### Jump landing contract check (2026-10-04) — NO free guard substitution

- Read `src/game/art/motion-clips-zhaoyun.ts` and
  `motion-clips-zhangfei.ts`: BOTH count jump:0..5 explicitly as
  takeoff/ascent/apex/kick/descent/**landing**, with jump arc
  exposure `jump:5` at airTick28 and `landing`/`kicklanding`
  transition clips starting on jump:5 BEFORE returning through
  jump:0 to `walk:0`. The contract in
  `docs/CAST_MOTION_ROLLOUT.md` requires kick retraction/contact/
  landing. `walk:0` is only the LAST guard bookend, not a valid
  substitute for the first contact frame. We cannot call the
  still-airborne spare7 a landing or silently omit jump:5.
- Natural candidates: source jump:5 (standing leading boot with
  knee bend, 439px polearm), source spare8 (two boots braced low
  crouch, 457px; source0 already serves crouched takeoff). Their
  geometry is legible but weapon short. With real grounded spare8
  and spare kick6, even after the improved takeoff0 477px,
  intact ascent1 491px, apex2 475px and descent4 485px,
  [477,491,475,506,485,457]px has **10.1695%** spread:
  still FAILS ≤10%, not roundable down. Using spare7 469px
  gives a 7.65% NUMERIC spread but its boot is airborne—invalid.
- Next actionable repair: ordinary AUTHORING focused edit of
  named jump:5 ONLY, retaining its grounded landing pose and
  extending its WOODEN rear haft/pommel from 439px to about
  480–490px without shortening blade; must be SHA-preserving
  splice and real endpoint/ground review. Once that works,
  source play map can use [repaired takeoff0, original ascent1,
  original apex2, original spare6 kick, original descent4,
  newly repaired landing5]. This is a PREDICTION, not a pass;
  if edited source stays short or drifts, leave jump unaccepted.
  Four remaining whole-sheet sequences need four of the seven
  authoring requests; only three focused requests remain. No
  request was spent on this diagnosis; ledger stays 19/26.

### jump-v2-focused-r1 — PARTIAL salvage only; source still UNACCEPTED 2026-10-04; sha `513b3b4e…`

- Request 19/26, ordinary AUTHORING `kind:'focused'`, targeting
  jump:0 takeoff (541px long), jump:3 kick (579px long), jump:5
  landing (439px short). Reserved/persisted BEFORE one image call;
  repair-only 3/3 ledger untouched. Exact
  `jump-v2-focused-r1-prompt.txt`; ordered refs original jump
  `64470647`, accepted walk `a8e44840`, legacy weapon `71c288d1`,
  body master `ee0a0200`, portrait `0fc579c1` (all read by image
  tool). Preferred ChatGPT image returned 1536×1024; original
  source kept immutable.
- Focused output has 9 separate alpha-connected drawings, no sheet
  edge touch; standard cleanup removes 97,047 low-alpha pixels
  plus four 1px specks. Model again repainted UNTARGETED poses
  despite explicit preservation request; full edited sheet is NOT
  a replacement. True endpoint overlay read: repaired candidates
  cell0 477px (good crouch, gold pommel/steel tip on fittings),
  cell3 533px (still too long for kick), cell5 437px (still too
  SHORT for landing). Kick and landing cannot be accepted just
  because generator returned output. Original spare kick6 has
  506px, but value-selected substitution with a false landing
  violates semantic and rigid-length acceptance.
- Hash-pinned `scripts/splice-weiyan-jump-v2.mjs` salvages ONLY
  repaired cell0, keeps original full alpha component for other
  eight; asserts collision, 9 figures and no edge touch. Rebuilt
  `jump-v2-prepared-source.png` sha `5a4244cf` byte-identically
  twice. Actually opened merged PNG: cell0 takeoff still crouched
  with two hands and complete 477px dao; other source poses intact.
  This derivative is PROVISIONAL, NOT a source-accepted jump clip.
- Examined alternate first-six play order [focused0 takeoff 477,
  original1 ascent491, original2 apex475, original6 kick506,
  original4 descent485, original8 crouch/landing457] ⇒ 10.17%
  spread, still over 10%; original8 is a deep crouch rather than
  leg-lowering landing. Substituting original7 469px makes a
  numeric 7.03% window, but visual ordered contact shows BOTH
  boots still airborne in cell7, so labelling it landing would be
  a FALSE semantic pass. No compliant six-pose sequence proven.
- Next: read the clip contract and check whether landing can be
  a legitimate guard-bookend handoff, or whether focused cell5
  needs a separate deterministic polearm-only edit; hold any
  second image request until the method and remaining budget are
  analyzed. Four v2 whole sheets fall/getup/misc/rider still
  planned, leaving at most 3 ordinary authoring focused calls
  (19/26 used, 7 left). Cross-sheet acceptance and 16MiB fit
  remain unverified; no runtime activation or waiver.

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
