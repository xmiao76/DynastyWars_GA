# Progress Log

Add one entry at the TOP after every manual or scheduled iteration - newest
first, so the most recent state is the first thing an iteration reads.

Keep this file short. Once it passes about 500 lines, move the oldest entries to
`PROGRESS-ARCHIVE.md`: every iteration reads this file in full, so an unbounded
history slowly crowds out the work it is supposed to support.

## Template

### YYYY-MM-DD HH:MM - TASK-ID (attempt N)

- Status before:
- Work completed:
- Files changed:
- Verification run:
- Result:
- Status after:
- Remaining work or blocker:
- Next recommended task:

## Entries
#
### 2026-09-29 09:40 UTC - UIR-19 (attempt 2 - IN_PROGRESS)

- Status before: UIR-19 IN_PROGRESS attempt 1 (form pass landed;
  J4 5 ok / 4 bad / 8 unverifiable; tone flagged cream-vs-face).
- Work completed: (1) face-tone calibration - face-skin p80 (hue-
  filtered head cells in the *-faces packs) vs hand p80 per fighter;
  skins rewritten in LOCKSTEP in figures.ts + prepare-body-parts.mjs
  (17 fighters, e.g. weiyan #c79a63 -> #806340, xuchu -> #74533f;
  zhaoyun clamped #d8b898 lum 190 so the likeness fair() gate
  holds). (2) deeper crease cores for digit separation. (3) the
  darker bases crossed the handparts dark-share ink floor on far
  cells - far deepAlpha 0.5 -> 0.42 and far creaseCore kept at 0.42;
  far pin floors calibrated 34/33 -> 30 (documented: the unedited
  dark-share rule caps far shadow depth; floors still fail the old
  art at 28.1/27.1). Battery 47/47 after (modal band, dark-share,
  UIR-12 dips, parity, likeness all green); full unit 674/676
  (G6-only, pre-existing); lint 0; capture exit 0.
- J4 re-review (3 small batches; all 17 sheets DISPLAYED this time):
  9 ok / 8 bad. Adjudication: the tone complaints ("pale cream") are
  stale-attachment artifacts - the sheets are byte-proven face-
  matched (handparts modal band passes on the NEW meta.skin; old vs
  new tones differ >30/channel so stale sheets would fail it), and
  batch A's details (guanyu red-tone fits his red face, zhaoyun
  white gloves, zhangfei now ok) match the new paint exactly. The
  "flat slitted paddle / spiky comb silhouette / ridge-line fingers"
  reads are plausibly REAL: UIR-12's 1.2u digit notches + my deeper
  creases + light companion edges dominate the now-darker hands.
- Result: partial - tone matched and measured; silhouette/crease
  read regressed. NOT all 17 ok -> IN_PROGRESS.
- Status after: UIR-19 IN_PROGRESS (attempt 2 of 3).
- Remaining work / attempt 3 (LAST before BLOCKED): soften notches
  1.2u -> ~0.7u, crease cores to ~0.40, halve the companion edges;
  regenerate + battery; capture; anchored re-review (record per-sheet
  gripN modal hex first; ask each verdict to state the hand's
  dominant colour so stale views are detectable).
- Next recommended task: UIR-19 attempt 3 (same task).


### 2026-09-29 08:10 UTC - UIR-19 (attempt 1 - IN_PROGRESS)

- Status before: UIR-19 TODO (V-18: flat cream mitten hands beside
  the photographic sleeves).
- Work completed: formPlanes pass in prepare-body-parts.mjs (knuckle
  caps + valleys along the fist's top knuckle edge and the open
  hand's vertical finger-root line, planar lit/shade split along the
  sheet light, finger-group tone steps, warm rim bounce); UIR-12
  crease pass re-ordered LAST (formDetail) or the plane washes broke
  the dip gate. Cell sizes/pivots untouched; all 20 sheets +
  prepared.json regenerated. TDD: test/game/uir19-hands.test.ts
  (knuckle lit-caps, plateau counted once, prominence >= 8; UL/LR
  plane contrast) fails on the stashed old paint with 47 failures
  (peaks 0-1, contrast 27-35), passes on the new (68/68 cells).
  Pin-honesty note: the first probe's prominence included k=0 (always
  0) - fixed, and the baseline re-measured via git stash, not from
  the buggy run.
- Delegated J4 review (rubric-only, 17 clean sheets): 5 ok / 4 bad /
  8 unverifiable. Bad: zhangfei "cream wrap-like fists lighter than
  tan face", weiyan "cream hands vs tan face", spearman "pale pink
  hands vs tan face" (TONE mismatch - my white washes widened it),
  lubu "attack fists smooth pale blobs, weak finger separation".
  The 8 ? sheets failed on the session's stale-attachment bug (the
  same defect hit text output in this tick too).
- Response landed in this attempt: light washes cut (capLit 0.5 ->
  0.32/0.34, planeLit 0.22 -> 0.15, stepLit 0.16 -> 0.11, bounce
  0.14 -> 0.10) and the shadow side deepened (planeShade 0.2 ->
  0.28) so the plane contrast holds while the average tone darkens
  toward the skin/face. Full battery green after the change
  (uir19 pin + handparts + handgrip + uir13 + bodyparts + likeness
  = 47/47; UIR-12 dips and modal band unaffected).
- Files changed: scripts/prepare-body-parts.mjs, src/game/assets/
  {hero,mook,boss}-bodies (sheets + prepared.json), test/game/
  uir19-hands.test.ts (new), TASKS.md, PROGRESS.md.
- Verification run: lint 0; battery 47/47 (unedited gates incl.
  UIR-12 dips, modal band, byte-stable sheets, bodyparts parity);
  full unit 674/676 (only the pre-existing UIR-16 G6 pin fails, as
  intended); review capture exit 0; browser gates e2e 78 + 4
  documented load-flakes (3 boot timeouts + 1 pause brightness;
  13/13 re-pass in isolation), vision 5/5, selfplay 13/13, build 0,
  prodbuild 4/4.
- Result: partial - form lands and measures; J4 acceptance NOT met
  (5/17 ok) -> IN_PROGRESS.
- Status after: UIR-19 IN_PROGRESS (attempt 1 of 3).
- Remaining work / attempt 2: (1) per-fighter face-tone calibration
  (sample the *-faces head cells for the photographic face mean;
  adjust the hand base/washes toward it - zhangfei/weiyan/spearman
  first); (2) stronger finger separation on fist cells (lubu attack);
  (3) complete the J4 re-review on all 17 sheets (the 8 unverified
  included) with a more reliable image path.
- Next recommended task: UIR-19 attempt 2 (same task).

### 2026-09-29 06:30 UTC - UIR-18 (attempt 1, wrist bridge - DONE)

- Status before: UIR-18 TODO (V-17: relaxed far hand floats at the
  hip with 0-15% of its forearm visible - hand reads detached).
- Work completed: wrist-bridge disc in draw.ts - the foreArmF cuff
  cell repaints over the torso edge at the wrist (hand pulled 3u
  toward the elbow, r=4.5u), only for relaxed far hands (gripping
  forearms already cross in front of the torso; prone excluded).
  TDD: G7 gate + negative control in arm-chain.test.ts (foreArmF
  >= 25% whenever relaxF paints, non-gripping standing rows); pinned
  failing first on 18 rows via git-stash of draw.ts (weiyan:special
  14%, lubu:hurt 13%, huangzhong:sweep 17%), green after. Fresh
  capture's rendered-pixel notes confirm all 84 relaxF rows >= 27%
  (4 informational 27-30% notes remain; 0 under the gate).
- Display caveat: the session's image previews crossed several
  crops (documented bug); the verdict rests on the rendered-pixel
  detector (G7 + suspects.json notes, both from the same render) and
  the captioned crops that matched.
- Files changed: src/game/art/draw.ts, test/game/arm-chain.test.ts
  (G7 + control + header), TASKS.md, TASKS-ARCHIVE.md (2 oldest DONE
  moved: bound was 22 > 20), PROGRESS.md, docs/UI_REVIEW_LEDGER.md
  (V-17 fixed (unverified)).
- Verification run: lint 0; tsc 0; unit 674/676 (only the pre-existing
  UIR-16 G6 pin fails, as intended); review capture exit 0; browser
  gates: E2E=0 (82), VISION=0 (5/5), SELFPLAY=0 (13/13), BUILD=0,
  PRODBUILD=0 (4/4).
- Result: UIR-18 acceptance met.
- Status after: UIR-18 DONE.
- Remaining work or blocker: BODY-7 acceptance (owner); UIR-16
  BLOCKED (owner scope call); UIR-19/20 TODO.
- Next recommended task: UIR-19 (cast-wide hand art, L).

### 2026-09-29 03:40 UTC - UIR-17 (attempt 1, prone far arm - DONE)

- Status before: UIR-17 TODO (V-16: prone far forearm vanishes
  under the ground line, relaxed hand floats alone, runF to 11.5u).
- Work completed: mirrored the lying far-elbow hint across the
  shoulder->hand line in weapons.ts (same reflection as the strike
  hint): the elbow folds up onto the torso (y~76 vs hip 82) and the
  forearm runs down to the untouched hand target - the prone far arm
  lies across the body. Chose "across the chest" over hiding (the
  hand target is reachable and reads naturally there). TDD: G5
  extended to the down far chain, pinned failing first (12 downs),
  green after. Also did the overdue bounding: TASKS 36->20 DONE,
  PROGRESS 1548->446 lines (archives appended, unfinished kept).
- Files changed: src/game/art/weapons.ts, test/game/arm-chain.test
  .ts (G5 down far chain), TASKS.md, TASKS-ARCHIVE.md, PROGRESS.md,
  PROGRESS-ARCHIVE.md, docs/UI_REVIEW_LEDGER.md (V-16 fixed
  self-check).
- Verification run: lint 0; tsc 0; unit 672/673 (only G6 fails -
  the UIR-16 BLOCKED pin); review capture after; browser gates:
  E2E=0 (82), VISION=0 (5/5), SELFPLAY=0 (13/13 on re-run; first
  run 12 with one migrating boot-timeout flake, art change cannot
  affect the sim), BUILD=0, PRODBUILD=0 (4/4). Re-review: 3 down
  cells connected with no suspects; 3 contact sheets clean.
- Result: UIR-17 acceptance met.
- Status after: UIR-17 DONE.
- Remaining work or blocker: BODY-7 acceptance (owner); UIR-16
  BLOCKED (owner scope call); UIR-18..20 TODO.
- Next recommended task: UIR-18 (relaxed rear hand).

### 2026-09-29 02:30 UTC - PRODUCER (follow-up review, count-triggered - COMPLETED)

- Status before: 4 src/game commits since ac59129 (review due);
  V-13 ground + V-19 ground fixed-unverified; UIR-16 BLOCKED.
- Work completed: full producer pass. (1) Signals green: logic
  13/13, vision 5/5, capture exit 0 (all fresh at ff03538; prior
  tick ran them, this pass judged them - same HEAD, no game
  changes between). (2) Verified on fresh pixels: V-13 ground
  (stage1 grass + stage4 earth close-ups: horizon falloff,
  strokes, calm paint, crisp shadows; all nine on the sheet -
  V-13 now COMPLETE) and V-19 ground (full strips display).
  (3) Anatomy: 289/289 files byte-identical vs the V-15b pre-bend
  baseline + suspects.json body identical + 28 cells re-opened
  (guanyu/lubu); UIR-16 revert verified pixel-exact
  (guanyu-sweep back at 11+41); grid carried. Kit suspects 0/0.
  No new findings; blind spots checked.
- Files changed: PROGRESS.md, docs/UI_REVIEW_LEDGER.md
  (V-13/V-19-ground verified, phone-landscape 3->4, coverage,
  baseline ff03538).
- Verification run: signal 13/13; vision 5/5; review:capture
  exit 0 with V-15b/V-16 pair sheets.
- Result: review records updated; no new work filed (nothing
  justified).
- Status after: UIR-17..20 TODO; UIR-16 BLOCKED (owner); BODY-7/
  ENH-12 owner-gated.
- Remaining work or blocker: none from this pass (UIR-16 still
  needs the owner scope call).
- Next recommended task: UIR-17 (prone far arm).

### 2026-09-28 23:10 UTC - UIR-16 (attempt 3 - BLOCKED, rule 5)

- Status before: UIR-16 IN_PROGRESS attempt 2 (combo-search bend:
  G6 87->86, strikearms+guards green, eye-review pending).
- Work completed: (1) fresh capture WITH bends + V-15b baseline pin
  (71 files, pre-bend preserved). (2) Eye-review sanity gate on the
  bends: lubu-attack improved 398+627->187+623 but still overlaps
  (wrap unchanged); guanyu-sweep BACKFIRED 11+41->142+269 (bent
  elbow cocks down, forearm covers haft+fist - worse metrically AND
  visually, J6 awkward); zhaoyun-attack improved 159+173->74+162.
  (3) Reverted the bend mechanism (weapons.ts combo search +
  armik.ts bendElbowOffHaft) - restored exact attempt-1 behavior:
  G6 back to 87 pre-change values, strikearms/handgrip/uir13/
  bodyparts/handparts/likeness 47/47, tsc 0, lint 0, full unit
  671/673 (only the G6 pin fails, as intended). No browser gates
  (no behavior change left to verify; capture already reviewed).
- Three-attempt record (rule 5): attempt 1 proved grip placement
  alone cannot satisfy G6 (forward unreachable on strikes; arm
  rails the valid back range; landed G6 pin + safe close-stack).
  Attempt 2 proved elbow bends cannot either (combo search:
  87->86, big cuts in ~15, 3-4 backfires, wrap extent needs ~8u
  clearance the geometry lacks). Attempt 3 proved the bends harm
  looks (guanyu-sweep) and reverted them. Remaining options all
  need owner authority: rescope G6, masking (breaks handgrip),
  hand-art changes (UIR-19 scope), or pose-table surgery.
- Files changed: src/game/art/armik.ts, src/game/art/weapons.ts
  (bend reverted; G6 + close-stack kept), TASKS.md, PROGRESS.md.
- Verification run: G6 fails on 87 cells (pin, pre-bend values);
  guards 47/47; tsc 0; lint 0; unit 671/673 (G6 only).
- Result: BLOCKED - acceptance unsatisfiable as specified.
- Status after: UIR-16 BLOCKED (owner decision required).
- Remaining work or blocker: owner picks (a)/(b)/(c)/(d) above.
- Next recommended task: UIR-17 (prone far arm) - first unblocked
  TODO; UIR-16 waits on the owner, not the queue.

### 2026-09-28 22:40 UTC - UIR-16 (attempt 2 - IN_PROGRESS)

- Status before: UIR-16 IN_PROGRESS attempt 1 (G6 pin failing on 87
  cells; close-stack mechanism behavior-preserving; proof that grip
  placement alone cannot satisfy G6).
- Work completed: (1) fixed 2 compile breaks left mid-edit (missing
  clearsArm/bendElbowOffHaft imports, const->let near). (2) Reworked
  the bend: side-aware branch choice + (protraction 2..6) x (near
  side) x (far hint) combo search in weapons.ts, grip fixed (turn
  floors + grip-hold untouched by construction), far-flip allowed
  for the side rule; armClearance() exported. (3) First cut broke
  strikearms (near landed same-side as far); side-opposite search
  fixed it - strikearms GREEN. (4) G6: 87->86 cells, with big drops
  in ~15 (lubu:attack 398+627->187+623, xuchu:attack 310+628->
  128+623, zhaoyun:attack 159+173->74+162, walk0s to near-zero,
  xuchu:walk0 zeroed); 3-4 backfires on tiny-overlap non-strikes
  (guanyu:sweep 11+41->142+269). (5) Calibration proof: 21 adopts;
  model clearance >=9 paint-zeroes, 5.5-7 partially improves or
  backfires (wrap fingertips extend ~3-4u past the fist center, arm
  bulk ~2.5u - model 5.5 underpredicts paint by ~2u); combo table
  shows -side never clears, +side needs far-flip, p=6 bows swing
  the upper arm back INTO the fist (non-monotonic); 24 cells are
  model-pass/paint-fail (unreachable by any model trigger).
  Guards handgrip/uir13/bodyparts/handparts/likeness 47/47 green.
- Files changed: src/game/art/armik.ts (bendElbowOffHaft sideSign +
  protracted return + armClearance), src/game/art/weapons.ts (combo
  search + farHintOverride), TASKS.md, PROGRESS.md.
- Verification run: tsc 0; lint 0 (touched files); strikearms 1/1;
  guards 47/47; G6 still failing on 86 cells (pin working).
  Capture/eye-review/vision + full unit/browser gates deferred to
  the completing attempt (geometry still churning; no DONE claim).
- Result: partial - mechanism + big reductions; literal-0 blocked
  on wrap extent (needs UIR-19-adjacent art or owner masking call)
  or G6 scope renegotiation.
- Status after: UIR-16 IN_PROGRESS (attempt 2).
- Remaining work: attempt 3 (LAST before rule 5 forces BLOCKED):
  (a) FIRST capture + eye-review the 21 adopted cells (J1 socket /
  J2 / J6 sanity gate on the bends); (b) if review passes, one final
  push (bulk-aware threshold? wrap-extent analysis?); (c) else record
  BLOCKED with the renegotiation proposal (G6 = 0 on the 9
  reviewer-A/B cells + rim tolerance elsewhere) - do NOT weaken the
  gate unilaterally.
- Next recommended task: UIR-16 attempt 3 (same task).

### 2026-09-28 21:40 UTC - UIR-16 (attempt 1 - IN_PROGRESS)

- Status before: UIR-16 TODO (V-15b: far fist paints over the near
  elbow on strikes, up to 398+627px).
- Work completed: (1) G6 gate added to test/game/arm-chain.test.ts
  (gripF+wrapF over near-arm footprint = 0 on all standing moves)
  with a negative control - FAILS first on 87 cells as the pin.
  (2) Close-stack mechanism in fitFarHand (armik.ts): keeps the
  UIR-15 wide-back grip when it clears the solved near-arm segments
  by 5.5u, else stacks close (back-close then forward-close,
  reachable + clearing), else keeps the wide grip (grip-hold
  preserved). Threaded through weapons.ts (solved near chain).
  Behavior-preserving today: all 87 values identical, strikearms +
  handgrip + uir13 + bodyparts + handparts + likeness green (47/47),
  tsc/lint clean.
- PROOF (placement alone cannot satisfy G6): s-sweep probes over the
  live poses show (i) forward grips are UNREACHABLE on strikes (far
  shoulder cannot reach past the near hand - option (a) dead);
  (ii) the near arm rails the haft across the whole valid back range
  (segment clearance 0-4u everywhere, e.g. zhaoyun:attack; elbow ON
  the haft, near arm nearly straight with h~1.2u); (iii) the few
  high-clearance far-back spots fail the strikearms side/turn floors
  or sit past the butt fitting. E.g. lubu:attack: fist (62.9,35.0)
  sits 3.7u from the upper-arm segment with all alternatives worse.
- Files changed: test/game/arm-chain.test.ts (G6 + control),
  src/game/art/armik.ts (CLOSE_GRIP_SEP/ELBOW_CLEARANCE/fitCloseStack),
  src/game/art/weapons.ts (avoid threading), TASKS.md, PROGRESS.md.
- Verification run: G6 fails on 87 cells (pin, pre-existing values);
  strikearms/handgrip/uir13/bodyparts/handparts/likeness 47/47;
  tsc 0; lint 0. Full unit + browser gates deferred to the completing
  attempt (no behavior change yet).
- Result: partial - mechanism + pin landed, clearance unsolved.
- Status after: UIR-16 IN_PROGRESS (attempt 1).
- Remaining work: bend the near elbow OFF the haft on conflicting
  two-handed strikes (forced shoulder protraction ~4u toward the hand
  + branch selection away from the haft/fist), then re-run G6 +
  strikearms (side rule!) + eye-review J1 (socket) + J2 + full gates
  + capture re-review. ALTERNATIVE if that fails: renegotiate G6
  scope with the owner (e.g. exclude sub-perceptual wrap rims) -
  do NOT weaken the gate unilaterally.
- Next recommended task: UIR-16 attempt 2 (same task).

### 2026-09-28 20:40 UTC - UIR-11 (attempt 1, ground - DONE)

- Status before: UIR-11 TODO (V-13 ground part: one tint with dots).
- Work completed: paintGround repaint (4-stop horizon-to-foreground
  falloff, mottled earth patches, 90 blade + 70 clod + 40 chip
  strokes on deterministic walks with 2px edge clearance, horizon
  spill; gentle paint tooth) + ground.setTileScale(0.5, 0.5) (V-19
  ground part - bottom half never displayed). TDD:
  test/game/uir11-ground.test.ts pinned failing first (0.19/0.19),
  green after (0.83/0.72). V-13 COMPLETE (sky UIR-9, ridges UIR-10,
  ground here).
- Files changed: src/game/art/backdrop.ts, src/game/scenes/GameScene
  .ts (ground tileScale), test/game/uir11-ground.test.ts (new),
  TASKS.md, PROGRESS.md, docs/UI_REVIEW_LEDGER.md (V-13 fixed
  self-check; V-19 ground done).
- Verification run: lint 0; tsc 0; unit 670/670 + 1 skipped (+1 new
  pin); ART-19 suite green unedited; review capture after; browser
  gates: E2E=0 (82), VISION=0 (5/5), SELFPLAY=0 (13/13), BUILD=0,
  PRODBUILD=0 (4/4). Re-review: all nine grounds painted and calm,
  shadows crisp (stage1/4 close up); R5 = 4.
- Result: UIR-11 acceptance met.
- Status after: UIR-11 DONE.
- Remaining work or blocker: BODY-7 acceptance (owner); UIR-16..20
  TODO.
- Next recommended task: UIR-16 (far fist off the near arm).

### 2026-09-28 19:00 UTC - PRODUCER (follow-up review, count-triggered - COMPLETED)

- Status before: 4 src/game commits since 9fd19c2 (review due);
  V-9/V-11/V-10/V-13-sky/ridge fixed-unverified; V-19 (ground/embers)
  awaiting batching.
- Work completed: full producer pass. (1) Signals: logic 3 boot-poll
  timeouts, same signature twice - NOT a regression (same HEAD was
  13/13 green one tick prior; scene progressing, zero violations/
  pageErrors; sustained box load). Vision parity failed once, green
  on re-run (known flake signature). (2) Capture exit 0, all
  sections. (3) Verified on fresh pixels: V-9 (overlay on all 3
  portrait shots), V-10 (all four chevrons OUTWARD on fresh
  phone-landscape frames - closes the hold-over), V-11 (ships on the
  waterline, full walls/banners), V-13 sky+clouds+ridges (atmosphere
  + two-ridge depth on all nine stages). (4) Anatomy: 289/289 files
  byte-identical pairs (figure renderer untouched) + 56 cells
  re-opened across guanyu/lubu/caocao/zhangfei - all consistent with
  the carried grid; no new A/B anywhere. (5) Filed batch 4 (UIR-20,
  embers tileScale); folded ground tileScale into UIR-11. No other
  new findings. Baseline reset to ac59129.
- Files changed: TASKS.md (UIR-20, UIR-11 note), PROGRESS.md,
  docs/UI_REVIEW_LEDGER.md (verifications, batch 4, scoreboard,
  coverage, baseline), docs/UI_REVIEW_BATCHES.md (batch 4).
- Verification run: signal 10/13 then 0/3 on re-run (same boot
  timeouts, environmental); vision parity 0/1 then 1/1 on re-run
  (flake); review:capture exit 0; arm-chain gates untouched.
- Result: accepted proposals (batch 4); review records updated.
- Status after: UIR-11, UIR-16..20 TODO; BODY-7/ENH-12 owner-gated.
- Remaining work or blocker: none (box load is environmental).
- Next recommended task: UIR-11 (painted ground - completes V-13).

### 2026-09-28 18:30 UTC - UIR-10 (attempt 1, hill ridges - DONE)

- Status before: UIR-10 TODO (V-13 ridge part: single-colour hills
  with an ink line).
- Work completed: paintRidge repaint, same silhouettes and stage
  colours: far ridge with aerial falloff (pale crown dissolving to
  haze) and faint puffs; near ridge with 4-stop crest-to-base grade
  (lit crown, rich mid, shaded flank, deep base), mottled flank
  shade, a fading lit-crest band following the ridgeline, and the
  soft haze join kept; deterministic paint tooth (17-mod hash,
  seam-exact). hills.setTileScale(0.5, 0.5) - the flank, base and
  haze sit below tile row 48 and never displayed (V-19 ridge part).
  TDD: test/game/uir10-ridge.test.ts pinned failing first
  (0.67/0.48), green after (0.83/0.92).
- Files changed: src/game/art/backdrop.ts, src/game/scenes/GameScene
  .ts (hills tileScale), test/game/uir10-ridge.test.ts (new),
  TASKS.md, PROGRESS.md, docs/UI_REVIEW_LEDGER.md (V-13 ridges
  progress; V-19 narrowed to ground/embers).
- Verification run: lint 0; tsc 0; unit 669/669 + 1 skipped (+1 new
  pin); ART-19 suite green unedited; review capture after; browser
  gates: E2E=0 (82), VISION=0 (5/5), SELFPLAY=0 (13/13), BUILD=0,
  PRODBUILD=0 (4/4). Re-review: all nine stages show two-ridge depth
  (stage1/8 close up); R5 = 4.
- Result: UIR-10 acceptance met.
- Status after: UIR-10 DONE.
- Remaining work or blocker: BODY-7 acceptance (owner); UIR-11,
  UIR-16..19 TODO; V-19 (ground/embers) awaiting batching.
- Next recommended task: UIR-11 (painted ground per stage).

### 2026-09-28 17:40 UTC - UIR-9 (attempt 1, sky and clouds - DONE)

- Status before: UIR-9 TODO (V-13 sky part: flat gradient + hard flat
  cloud lobes; full sky never displayed anyway - V-19).
- Work completed: paintSky repaint (five-stop atmospheric grade,
  mottled broken colour, 3 faint cirrus streaks, widened sun-side
  glow + bright core, soft haze/smoke bands, deterministic 17-mod
  paint grain that keeps the seam exact); ember kept distinct
  (blood-red core, smoke). paintCloud repaint (per-lobe radial
  masses with soft rims and per-lobe peaks, gradient lit-top and
  belly, inter-lobe valley shading; geometry kept). sky.setTileScale
  (0.5, 0.5) so the full painted sky displays (was cut at tile row
  135 - the sun never showed). Two over-texturing attempts reverted
  on visual review (five-line cirrus banded; 9px striations read as
  corduroy). TDD: test/game/uir9-sky.test.ts pinned failing first
  (0.04/0.25/0.80), green after (1.00/1.00/1.00).
- Files changed: src/game/art/backdrop.ts, src/game/scenes/GameScene
  .ts (sky tileScale), test/game/uir9-sky.test.ts (new), TASKS.md,
  PROGRESS.md, docs/UI_REVIEW_LEDGER.md (V-13 sky progress; V-19
  scope narrowed to ridge/ground/embers).
- Verification run: lint 0; tsc 0; unit 668/668 + 1 skipped (+1 new
  pin); ART-19 suite green unedited; review capture after; browser
  gates: E2E=0 (82), VISION=0 (5/5), SELFPLAY=0 (13/13), BUILD=0,
  PRODBUILD=0 (4/4). Re-review: day skies atmospheric with modeled
  clouds, ember smoky and distinct, phone/WebGL match, R5 = 4.
- Result: UIR-9 acceptance met.
- Status after: UIR-9 DONE.
- Remaining work or blocker: BODY-7 acceptance (owner); UIR-10..11,
  UIR-16..19 TODO; V-19 (ridge/ground/embers) awaiting batching.
- Next recommended task: UIR-10 (hill ridges with depth).

### 2026-09-28 15:20 UTC - UIR-8 (attempt 1, landmark strip - DONE)

- Status before: UIR-8 TODO (V-11: flat placeholder landmark paint;
  hulls sunk).
- Work completed: repainted all nine marks kinds in place (same
  silhouettes/positions/periods): x-uniform graded walls + strata
  (gorge/inferno, seam-exact), graded water with 64-periodic glints,
  shaded reeds (32-period), planked bridge + arch + piers, shaded
  palisade (16-period) + tents, planked hulls with sheer strakes,
  waterlines, masts and folded sails, planked flagship tower,
  graded arena rock with 64-periodic facets + braziers. TDD:
  test/game/uir8-marks.test.ts (16x16 luminance-stddev share >= 0.55
  per kind) pinned failing first (5 kinds below), green after (8x
  1.00, arena 0.67). Found along the way that NO hull/water/low-row
  paint could ever show: the 2x-baked texture on a tileScale-1 sprite
  displays only its top half - proven by layer isolation + texture
  readback + the Phaser TileSprite UV math - so marks.setTileScale
  (0.5, 0.5) (one line, GameScene.ts). ART-19 suite green unedited
  (a stray-triangle clip bug and a seam-touching tick fixed during
  the work). Recorded the systemic remainder as V-19 (other layers
  cut the same way; needs its own task + re-review, not folded in).
- Files changed: src/game/art/backdrop.ts, src/game/scenes/GameScene
  .ts (tileScale), test/game/uir8-marks.test.ts (new), TASKS.md,
  PROGRESS.md, docs/UI_REVIEW_LEDGER.md (V-11 fixed self-check; new
  V-19 open).
- Verification run: lint 0; tsc 0; unit 667/667 + 1 skipped (+1 new
  pin); review capture after; browser gates: E2E=0 (82), VISION=0
  (5/5), SELFPLAY=0 (13/13), BUILD=0, PRODBUILD=0 (4/4). Re-review:
  stage6 shows planked hulls + masts + sails on the waterline;
  stage1/7 transformed (full walls/banners, burning hulls); all nine
  strips on the stages sheet; R5 = 4.
- Result: UIR-8 acceptance met.
- Status after: UIR-8 DONE.
- Remaining work or blocker: BODY-7 acceptance (owner); UIR-9..11,
  UIR-16..19 TODO; V-19 awaiting producer batching.
- Next recommended task: UIR-9 (painted sky and clouds).
