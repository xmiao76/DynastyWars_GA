# Wei Archer — motion action review (CMR-08B)

Concise fighter review report: actual in-game motion footage reviewed at
game size (contact sheets) and enlarged (4x crops), per action, both
facings, Canvas + WebGL. Consumer self-check; the producer verifies
independently on fresh captures.

## Evidence index (all under `artifacts/motion-review/`)

- `archer-canvas/`, `archer-webgl/`: trace.json (50 rows each),
  index.json (commit 80aed1d, dirty flag set - harness iteration in
  progress, pack revision archer-1), report.json (0 trace errors, 0 hard
  integrity, 2 opens, 0 blanks), frames/ (26 crops each: 13 actions x 2
  facings), contact-sheet.png (1280x2240, canvas da3b1f15 / webgl
  4a9298c3), archer-*.webm (video). No `pairs/` yet (first archer
  capture; rotation directory created for next run).
- Pack under review: `src/game/assets/motion/archer-motion-sheet.png`
  (1,830,948 B, sha256 96cc42fa…, 2045x924) + archer-prepared.json,
  manifest `f9348704…` (deterministic double-run from CMR-08A).
- Trace provenance: both runs record commit 80aed1d + dirty + source
  hashes + pivot (224,240) in index.json; all 100 sampled rows use
  texture `motion-source:archer`.

## Per-action findings (all states, both facings)

- **idle** (`locomotion:0` guard + live walk-on `locomotion:1`):
  idle-right.png shows the guard bookend, feet planted on the ground
  line, bow upright at the left side, green robe/brown belt/boots,
  headscarf, quiver at the back. The second idle sample per facing is
  `locomotion:1` (live AI walk-on, real behavior - the sim advances
  between the two samples). No drift vs the pack idle drawing.
- **walk** (`locomotion:4`, AI gameplay source): walk-right.png shows
  mid-stride with alternating legs (left forward, right back), bow at
  the side, plus the player bystander (armored hero with red plume/blue
  cape) at the right edge. Genuine gait, no skating at game size; the
  approach/retreat/hitstun/fall/down gameplay coverage cells stay
  `unseen` (injected coverage carries the actions, same as prior mooks).
- **shoot-release** (`shoot:4`, phase 0 = spawn tick): shoot-release-
  right.png shows the follow-through - bow vertical in the left hand,
  string slack, right hand open behind the head, legs wide, no arrow
  (correct: the arrow has spawned). The second sample per facing is
  `locomotion:1` (AI stepped out of firing position between samples).
- **shoot-reload** (`shoot:7`): shoot-reload-right.png shows nocking -
  arrow horizontal at chest height, both hands on bow/arrow, wide stance.
  Distinct from draw/aim/release.
- **shoot-draw** (`shoot:2`): shoot-draw-right.png shows the full draw -
  right elbow back, bow bent, arrow nocked, wide stance. Distinct phase.
- **shoot-aim** (`shoot:3`): shoot-aim-right.png shows the held aim -
  bow steady, arrow forward, legs wide. All four firing phases are
  visually distinct and match their trace keys on both facings.
- **hurt** (16-tick hitstun, `hitstun-held:1` at ticks 0/2):
  hurt-right.png (canvas b92815ac) shows recoil - head back, mouth open,
  right arm extended, bow gripped in the left. Canvas shows NO red tint;
  webgl hurt-right.png (097f5dc3) shows the SAME pose with a strong red
  tint over the whole figure. This canvas-absent/webgl-present split
  reproduces soldier exactly (soldier canvas 7b2e832c no tint, webgl
  4b34f268 red) - a pre-existing renderer tint-path difference, not a new
  archer defect. The motion art itself renders correctly under both.
- **knockdown / fall** (`fall-thrown:0` at tick 0): knockdown-right.png
  (a855dc4f) shows the diagonal topple - left leg up, right arm extended,
  bow gripped in the left hand. Painted art, no legacy blend.
- **getup** (`fall-thrown:3` down bookend at tick 0): getup-right.png
  (493c47d7) shows the prone shared down drawing - on the back, bow in
  the right hand, legs extended. Correct start (getup begins on the SAME
  down drawing as the fall sheet, byte-identical alias per the
  bookend units); the rise (getup-death:0/1/2 → guard) is unit-pinned
  per tick.
- **grabbed** (`hitstun-held:5`): grabbed-right.png (822b5190) shows the
  upright held/struggle - arms crossed/pinned, bow gripped, knees bent.
  Displays correctly.
- **thrown** (`fall-thrown:4` at tick 0): thrown-right.png (3197a12e)
  shows the curled airborne pose - knees tucked, head down, bow gripped
  vertically. The second thrown sample per facing is state knockdown at
  tick 0 with the same key (lowCollapse continuity index 0, see below).
- **dying** (trace `fall-thrown:4`, NOT `getup-death:4`): dying-right.png
  (f5759a5f) shows the curled collapse with bow gripped - the
  lowCollapse continuity frame carried from thrown→knockdown→dying
  injection order (index 0 at stateTick 0/1). This reproduces soldier
  and spearman EXACTLY (all three mooks show dying:dying:tick0/1 →
  fall-thrown:4 on all 4 rows). The true dying drawings (getup-death:
  4/5/6) are verified in the pack and unit-pinned per tick (dying 0 →
  :4, mid → :5, late → :6); no crop shows them in game because the
  harness injects dying immediately after thrown. Recorded honestly; the
  producer may inject dying from a neutral state for pixels.
- **dead** (`getup-death:7`): dead-right.png (0aa31aeb) is empty stage -
  renders at alpha 0 BY DESIGN (`GameScene.syncSprites`: completed
  defeat fade must not reappear). The drawing is verified in the pack
  and the trace records the correct key on all 4 dead rows. Correct
  product behaviour, not a capture failure.

## Cross-cutting

- **No legacy blends**: all 100 sampled rows (50 per renderer) use
  texture `motion-source:archer` with pack frame names; 0 legacyRows, 0
  unknown frames, 0 missing bindings, 0 clock defects. The only non-
  archer pixels in any crop are the player bystander (a different
  entity, the hero) and the stage. Full-size crops confirm painted art
  in every action.
- **Stable scale/pivots/identity**: one pack scale (box 224x122,
  groundY 120, density 2), ground-anchored registration (groundErrorU 0
  in both indexes), shared guard/down bookends byte-identical (same
  atlas rect per the rect-identity units). No size pops across either
  contact sheet; the hooded/green-robe/brown-boot identity with quiver
  holds across all 26 crops per renderer.
- **Weapon trajectories**: one rigid bow, string drawn/slack per phase,
  arrow present in draw/aim/reload and correctly absent at release. No
  forks, detached limbs, or floating hands in any crop. Bow direction
  steps cohere across the shoot cycle (CMR-08A: direction coherent,
  eyeball max ~45°).
- **Head/weapon landmarks from A**: preserved by construction - the
  runtime registration is a uniform scale + recorded translation (no
  per-frame rescale), so the pack 4.8% bows / 6.1% heads spreads hold
  exactly after registration. `contactU`/`weaponTipU` stay `unverified`
  (the 2 open items on both captures; producer measures) - same 2 opens
  as soldier/spearman.
- **Shared lowCollapse literal defect** (documented, not refactored):
  `motion-player.ts` lowCollapse/getup-interrupt paths use guanyu frame
  literals (`fall:5/6`, `getup:N`) that do not exist in mook packs. A
  mook dying mid-throw falls back to legacy art for 2-4 ticks in live
  play at stateTick 2+ (captures sample 0/1 only, so they show index 0 =
  the thrown frame, never the missing literal). Pre-existing since 06B,
  affects all three mooks equally, recorded as a baseline exception per
  item 36; fix belongs to a shared-code task, flagged for producer/owner
  triage.
- **Renderer parity**: canvas and webgl contact sheets show the same
  poses/states crop for crop (26/26 match); 0 near-black crops on both
  (the CMR-05 snapshot fix holds for the shooter path). Trace key
  profiles agree across renderers (identical 50-row action/key splits).
  The ONLY pixel difference is the hitstun tint (present webgl, absent
  canvas) - pre-existing, reproduces soldier, not new.
- **Resources**: report.json resources - network/source 1,830,948 B,
  decoded/GPU 7,558,320 B (7.21 MiB <= 16 MiB per-fighter), 0 cloned
  canvas bytes (shared atlas frames), page 2045x924 <= 2048, withinCaps
  true. Stage-download/eviction/restart covered by the CMR-03 runtime
  units + the prodbuild 4-pack pilot (5 requests, sorted motions).

## Pace and native-video viewing limitations

- Clips run at sim tick rate (walk 16-tick loop, shoot 90-tick firing
  cycle, hurt 16, fall KNOCKDOWN_TICKS, getup GETUP_TICKS, dying
  DYING_TICKS); the .webm footage exists per renderer but was NOT viewed
  natively in this review (no video playback available) - the producer
  should spot-check motion smoothness on video.
- Capture subject renders dimmed (invulnerableTicks i-frame blink;
  needed to survive AI segments) - art fully legible but dimmer than
  real gameplay. Dead renders at alpha 0 by design (above).
- Airborne poses can clip at the crop top (box sized to the sprite
  anchor); walk crops include the player bystander at the right edge;
  dying crops show the lowCollapse continuity frame, not the dying
  drawings (covered instead by per-tick units + pack verification,
  above).
- Every preview cited here was fingerprint-verified against its file
  (dimensions + sha256 match; contact sheets 1280x2240, crops 896x488).

## Producer handoff

Re-run `node scripts/motion-capture.mjs --fighter archer --role mook
--enemy archer --renderer {canvas,webgl}` on a clean tree, re-verify the
trace (0 errors, 0 hard-integrity failures, same 2 opens), re-read the
contact sheets, spot-check the .webm files, and independently confirm:
no legacy blends, stable bookends, ground contacts, the four distinct
firing phases with release-arrowless correctness, and the open landmarks
(contactU, weaponTipU). Consider injecting dying from a neutral state so
a named crop shows getup-death:4/5/6 in game, and note the pre-existing
canvas/webgl hitstun-tint split (reproduces soldier). Consumer findings
above are self-check only.
