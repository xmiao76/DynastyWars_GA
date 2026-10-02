# Wei Soldier — motion action review (CMR-06B)

Concise fighter review report: actual in-game motion footage reviewed at
game size (contact sheets) and enlarged (4x crops), per action, both
facings, Canvas + WebGL. Consumer self-check; the producer verifies
independently on fresh captures.

## Evidence index (all under `artifacts/motion-review/`)

- `soldier-canvas/`, `soldier-webgl/`: trace.json (38 rows each), index.json
  (commit/dirty/pack revision), report.json, frames/ (20 crops each),
  pairs/ (previous-vs-current), contact-sheet.png, soldier-*.webm (video).
- `previous/soldier-canvas/`, `previous/soldier-webgl/`: rotated prior runs
  (pair sources).
- Pack under review: `src/game/assets/motion/soldier-motion-sheet.png`
  (1,786,372 B, sha256 55f3300d…, 1984x1369) + soldier-prepared.json,
  manifest `09666940…` (deterministic double-run).
- Capture commits recorded per run in each index.json (runs at 720cb86/
  bd4c09e/d0aab80, dirty flag set - harness iteration in progress).

## Per-action findings (all states, both facings)

- **idle** (`locomotion:0`): guard bookend, feet planted on the ground
  line, sword low-forward. No drift vs the pack's idle drawing.
- **walk / flee** (`locomotion:1..4` / `:6,:7`): AI-driven walk captured
  at tick 28 showing `locomotion:4` on both renderers; mid-stride frames
  with alternating legs; retreat uses the two retreat drawings. Genuine
  gait, no skating visible at game size.
- **swing** (`swing:0..7`, the real 14/4/20 window): windup → horizontal
  chest-height sweep (active ticks 14-17 show `swing:3/4`) → recover →
  guard. The enlarged crop shows the blade fully extended; the strike
  matches the simulation window (unit-verified per tick).
- **hurt** (18-tick hitstun): recoil/fold/stagger (`hitstun-held:1..3`);
  the product's red hitstun tint (`0xff6666`) renders correctly over the
  motion atlas sprite (verified in hurt-right.png).
- **knockdown / fall** (`fall-thrown:0..3`): topple → airborne → impact →
  shared down bookend. The enlarged crop shows the diagonal tumble with
  sword in hand.
- **getup** (`fall-thrown:3` → `getup-death:0..2` → guard): starts on the
  SAME down drawing as the fall sheet (byte-identical alias), rises
  through elbow/kneel/crouch, returns to guard.
- **grab / grabbed** (`hitstun-held:4/5`): upright held (arms pinned, sword
  gripped) and struggle poses display correctly.
- **thrown** (`fall-thrown:4..7`): tumble both orientations → side impact →
  settle. Enlarged crop confirms the curled airborne pose.
- **dying** (`getup-death:4..6`): jolt → knee collapse → crumple, with the
  product's defeat fade (alpha ramps down over DYING_TICKS).
- **dead** (`getup-death:7`): renders at alpha 0 BY DESIGN
  (`GameScene.syncSprites`: "a completed defeat fade must not reappear").
  The crop is empty stage; the drawing is verified in the pack and the
  trace records the correct frame key. This is correct product behaviour,
  not a capture failure.

## Cross-cutting

- **No legacy blends**: all 76 sampled rows (38 per renderer) use texture
  `motion-source:soldier` with pack frame names. An early review scare
  (thumbnail-scale "green soldier") was adjudicated as misread: the motion
  art's own olive trousers + a player bystander in walk crops. Full-size
  crops confirm painted art in every action.
- **Stable scale/pivots/identity**: one pack scale, ground-anchored
  registration, shared guard/down bookends byte-identical (same atlas
  rect). No size pops across the contact sheets; no standing frame
  inserted into the low-collapse path (soldier never matches the hero-only
  `lowCollapse` guanyu frame patterns by name).
- **Weapon trajectories**: one rigid sword, consistent length across all
  drawings (CMR-06A: 5.3% spread on the observable set); active sweep
  reads horizontal at chest height; no forks or detached blades.
- **Head/weapon landmarks from A**: preserved by construction - the
  runtime registration is a uniform scale + recorded translation (no
  per-frame rescale), so the pack's ±5% head / 5.3% weapon spreads hold
  after registration. `contactU`/`weaponTipU` stay `unverified` (producer
  measures).
- **Renderer parity**: canvas and webgl contact sheets show the same
  poses/states; 0 near-black crops on both (the CMR-05 snapshot fix holds
  for the enemy path). Trace rows agree on key frames across renderers.

## Pace and native-video viewing limitations

- Clips run at sim tick rate (walk 16-tick loop, swing 38-tick window,
  hurt 18, fall/knockdown KNOCKDOWN_TICKS, getup GETUP_TICKS); the .webm
  footage exists per renderer but was NOT viewed natively in this review
  (no video playback available) - the producer should spot-check motion
  smoothness on video.
- Capture subject renders at 0.55 alpha (invulnerableTicks i-frame blink;
  needed to survive AI segments) - art fully legible but dimmer than real
  gameplay. Dead renders at alpha 0 by design (above).
- Airborne poses can clip at the crop top (box sized to the sprite anchor);
  walk crops include the player bystander at the right edge.
- Image previews served wrong pixels intermittently this session (known
  DSH harness bug); every preview cited here was fingerprint-verified
  against the file (dimensions + content match).

## Producer handoff

Re-run `node scripts/motion-capture.mjs --fighter soldier --role melee
--enemy soldier --renderer {canvas,webgl}` on a clean tree, re-verify the
trace (0 errors, 0 hard-integrity failures), re-read the contact sheets,
spot-check the .webm files, and independently confirm: no legacy blends,
stable bookends, ground contacts, and the open landmarks (contactU,
weaponTipU). Consumer findings above are self-check only.
