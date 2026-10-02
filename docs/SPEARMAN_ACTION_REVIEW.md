# Wei Spearman — motion action review (CMR-07B)

Concise fighter review report: actual in-game motion footage reviewed at
game size (contact sheets) and enlarged (4x crops), per action, both
facings, Canvas + WebGL. Consumer self-check; the producer verifies
independently on fresh captures.

## Evidence index (all under `artifacts/motion-review/`)

- `spearman-canvas/`, `spearman-webgl/`: trace.json (38 rows each),
  index.json (commit/dirty/pack revision), report.json, frames/ (20 crops
  each), contact-sheet.png, spearman-*.webm (video). No `pairs/` yet
  (first spearman capture; rotation directory created for next run).
- Pack under review: `src/game/assets/motion/spearman-motion-sheet.png`
  (1,352,663 B, sha256 5181a2d7…, 1835x866) + spearman-prepared.json,
  manifest `a2f89978…` (deterministic double-run).
- Capture commits recorded per run in each index.json (runs at 36b0a99,
  dirty flag set - harness iteration in progress).

## Per-action findings (all states, both facings)

- **idle** (`locomotion:0`): guard bookend, feet planted on the ground
  line, spear upright at the side. No drift vs the pack's idle drawing.
- **walk / flee** (`locomotion:1..4` / `:6,:7`): AI-driven walk captured
  at tick 28 showing `locomotion:4` on canvas; mid-stride frames with
  alternating legs; retreat uses the two retreat drawings. During one
  approach segment the AI attacked mid-walk (trace shows a `thrust:5`
  key inside a walk segment) - authentic AI behaviour, and the recovery
  frame renders correctly. Genuine gait, no skating visible at game size.
- **thrust** (`thrust:0..7`, the real 20/5/26 window): the named
  `thrust-{left,right}.png` crops show the tick-0 guard entry (correct
  per the clip, which starts from guard). The extension itself
  (`thrust:3` at tick 20 through `thrust:4` at tick 24, full horizontal
  extension, both hands spaced on the shaft) is covered three ways, none
  of them a named crop: the unit test asserts EVERY active tick 20..24
  dispatches `thrust:3/4` (stronger than a screenshot for timing); the
  CMR-07A zoom verification confirmed the repair art tip-to-butt
  (B:1/B:2, endpoints correct); the shared atlas renderer already proves
  out on the other 37 sampled rows. No screenshot shows the extension in
  game (harness samples injected attacks at ticks 0-2 only) - recorded
  honestly here; the producer may extend sampling if it wants pixels.
- **hurt** (14-tick hitstun): recoil/fold/stagger (`hitstun-held:1..3`)
  across ticks 0/5/9 with guard restored at tick 13; the product's red
  hitstun tint (`0xff6666`) renders clearly over the motion atlas sprite
  (visible in both contact sheets' hurt cells + hurt crops).
- **knockdown / fall** (`fall-thrown:0..3`): topple → airborne → impact →
  shared down bookend. Enlarged crops show the diagonal tumble with the
  spear gripped throughout.
- **getup** (`fall-thrown:3` → `getup-death:0..2` → guard): starts on the
  SAME down drawing as the fall sheet (byte-identical alias), rises
  through elbow/kneel/crouch, returns to guard at the last tick.
- **grab / grabbed** (`hitstun-held:4/5`): upright held (arms pinned, spear
  gripped) and struggle poses display correctly.
- **thrown** (`fall-thrown:4..7`): tumble both orientations → side impact →
  settle, clamped correctly at high ticks.
- **dying** (`getup-death:4..6`): jolt → knee collapse → crumple, with the
  product's defeat fade (alpha ramps down over DYING_TICKS).
- **dead** (`getup-death:7`): renders at alpha 0 BY DESIGN
  (`GameScene.syncSprites`: "a completed defeat finish must not linger").
  The crop is empty stage; the drawing is verified in the pack and the
  trace records the correct frame key on all 4 dead rows. This is correct
  product behaviour, not a capture failure.

## Cross-cutting

- **No legacy blends**: all 76 sampled rows (38 per renderer) use texture
  `motion-source:spearman` with pack frame names. The only non-new-art
  pixels in any crop are the player bystander (a different entity, the
  hero) and the stage. Full-size crops confirm painted art in every
  action.
- **Stable scale/pivots/identity**: one pack scale, ground-anchored
  registration, shared guard/down bookends byte-identical (same atlas
  rect). No size pops across the contact sheets; no standing frame
  inserted into the low-collapse path (dispatch units pin knockdown→fall
  clip and dying→dying clip; thrust/hitstun never route to legacy).
- **Weapon trajectories**: one rigid spear; horizontal thrust extension at
  chest height per the pack art; no forks or detached blades in any crop.
  Runtime lengths INHERIT the CMR-07A accepted limitation (18.2% spread
  across fully-observable poses, owner-waived option (d)): the same spear
  reads up to ±9% longer/shorter between poses (e.g. full-extension vs
  upright carry). Nothing in the runtime changes lengths
  (registration is uniform scale + recorded translation), so the pack's
  measured numbers hold exactly in game.
- **Head/weapon landmarks from A**: preserved by construction (uniform
  scale + recorded translation, no per-frame rescale), so the pack's
  7.9% head spread holds after registration. `contactU`/`weaponTipU`
  stay `unverified` (the 2 open items on both captures; producer
  measures).
- **Renderer parity**: canvas and webgl contact sheets show the same
  poses/states crop for crop; 0 near-black crops on both (the CMR-05
  snapshot fix holds for the enemy path). Trace rows agree on key frames
  across renderers (identical 38-row profiles).

## Pace and native-video viewing limitations

- Clips run at sim tick rate (walk 16-tick loop, thrust 51-tick window,
  hurt 14, fall/knockdown KNOCKDOWN_TICKS, getup GETUP_TICKS); the .webm
  footage exists per renderer but was NOT viewed natively in this review
  (no video playback available) - the producer should spot-check motion
  smoothness on video.
- Capture subject renders dimmed (invulnerableTicks i-frame blink;
  needed to survive AI segments) - art fully legible but dimmer than real
  gameplay. Dead renders at alpha 0 by design (above).
- Airborne poses can clip at the crop top (box sized to the sprite
  anchor); walk crops include the player bystander at the right edge;
  named thrust crops show the tick-0 guard entry, not the extension
  (covered instead by per-tick units + pack zoom verification, above).
- Every preview cited here was fingerprint-verified against its file
  (dimensions + content match).

## Producer handoff

Re-run `node scripts/motion-capture.mjs --fighter spearman --role melee
--enemy spearman --renderer {canvas,webgl}` on a clean tree, re-verify the
trace (0 errors, 0 hard-integrity failures), re-read the contact sheets,
spot-check the .webm files, and independently confirm: no legacy blends,
stable bookends, ground contacts, and the open landmarks (contactU,
weaponTipU). Consider extending injected-attack sampling past tick 2 so a
named crop shows the thrust extension in game. Consumer findings above are
self-check only.
