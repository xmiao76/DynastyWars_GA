# Zhang Fei — motion action review (CMR-09B)

Concise fighter review report: actual in-game motion footage reviewed at
game size (contact sheets) and enlarged (4x crops), per action, both
facings, Canvas + WebGL. Consumer self-check; the producer verifies
independently on fresh captures.

## Evidence index (all under `artifacts/motion-review/`)

- `zhangfei-canvas/`, `zhangfei-webgl/`: trace.json (73 rows each),
  index.json (commit 35edc53, dirty flag set - harness iteration in
  progress, pack revision zhangfei-1, pivot (260,272)), report.json (0
  trace errors, 0 hard integrity, 2 opens, 0 blanks), frames/ (37 crops
  each: 17 isolated actions + walk, x2 facings, + mixed-right),
  contact-sheet.png (1280x3200, canvas b00e842a / webgl 190b2e7c),
  zhangfei-*.webm (video: canvas 2.29 MB, webgl 4.06 MB). No `pairs/`
  yet (first zhangfei capture; rotation directory created for next run).
- Pack under review: `src/game/assets/motion/zhangfei-motion-sheet.png`
  (3,007,913 B, sha256 e296de06…, 2004x2026) +
  `zhangfei-actions-sheet.png` (1,028,932 B, sha256 ca8104eb…,
  1693x768) + zhangfei-prepared.json, manifest `8a185a11…`
  (deterministic double-run; re-prepared for the 22 MiB decoded
  exception, pages/frames byte-identical to the 09A pack).
- Trace provenance: both runs record commit + dirty + source hashes +
  pivot (260,272) in index.json; all 73 subject rows per run use
  textures `motion-source:zhangfei` / `motion-actions:zhangfei` (no
  legacy rows for the subject, no texture mixing).

## Per-action findings (all states, both facings)

Keys below are the recorded trace keys (crop sample +2-tick sample);
both facings agree on every action unless noted.

- **idle** (`walk:0` guard): feet planted on the ground line, pike held
  low horizontal, headband/beard/vest/tassels/boots. No drift vs the
  pack guard drawing.
- **jab1 / jab2** (`jab1:2` / `jab2:2` at ticks 6/8, inside the 5-8
  active window): full extension lunges, both arms extended, pike dead
  horizontal on the thrust line. jab1-right.png (c516ef12) shows
  defined fingers wrapping the shaft, gold butt cap + socket, red
  tassel, serpent blade; front foot planted, back leg extended. The
  two jabs read distinct (high coil vs low chamber entries in the
  pack). No forked shafts.
- **hurt** (`misc:0` recoil at ticks 5/7): rocked back, left hand up
  with spread fingers, head turned, pike gripped. Canvas shows NO red
  tint; webgl shows the SAME pose with a strong red tint over the
  whole figure (hurt-right.png canvas ad417fa4 vs webgl 9f8f3587).
  This canvas-absent/webgl-present split reproduces soldier and archer
  exactly - a pre-existing renderer tint-path difference, not a new
  zhangfei defect. The motion art itself renders correctly under both.
- **knockdown** (`fall:3` impact at ticks 12/14): side-lying slam,
  shoulder down, pike gripped. Correct mid-fall read.
- **finisher** (`finisher:2` bridge at ticks 12/14, inside the 10-15
  active window): the diagonal mid-sweep pose shows on every active
  tick (the sweep passes THROUGH during the window; the horizontal
  impact/follow at ticks 16+ are recovery, verified in the pack
  sheets + unit-pinned per tick). Crops show the twisted torso, pike
  diagonal across the body. No jump cut at the bridge.
- **getup** (`getup:2` crouch at ticks 10/12): low balanced crouch
  rising. The DOWN bookend (fall:4, key 0 of the clip) is
  trace-verified on all 4 dead rows + unit-pinned, though no live row
  samples getup@0 (same as the guanyu capture shape).
- **special** (`special:3` strike at ticks 10/12, inside the 6-17
  active window): full-spin extension, pike horizontal at max reach.
  No projectile/glow/effects - the sweep IS the special.
- **jump** (`jump:2` apex at air 18/20): stretched tall, pike raised
  high overhead both hands, clear air under the boots, ground shadow
  on the floor plane below. Toes pointed, no clipping.
- **jumpkick** (`jump:3` at active ticks 8/10, air 18/20):
  jumpkick-right.png (59bd27a0) shows the money pose - one leg
  extended straight forward with a detailed boot, other leg tucked,
  pike swept back over the shoulder, airborne. Matches the pack apex
  kick exactly.
- **grab** (`misc:3` hold at ticks 5/7): arms locked around the
  invisible captive, pike gripped. No second figure drawn (correct).
- **grabbed** (`misc:1` fold): doubled forward clutching - the shared
  grabbed drawing reads correctly under the grabbed state.
- **thrown** (`fall:2`→`fall:3`): thrown@6 shows the curled tumble;
  the second sample caught the knockdown@0 transition showing fall:3
  via the lowCollapse continuity (prev frame carried). With the
  per-kind collapse tail fixed this turn, ticks 2+ settle
  impact→DOWN instead of the legacy fallback (see below).
- **mount** (`rider:0` seated): straddle pose, pike across the lap.
  Renders at the rider lift offset; no horse drawn (CMR-22 composes).
- **mountedsweep** (`rider:3` at ticks 10/12, inside the 8-13 active
  window): twisted-in-saddle full extension, pike horizontal.
- **dying** (`fall:3` at ticks 12/14, fading): side-lying impact at
  alpha ~0.76, pike gripped. The fade progresses to invisible.
- **dead** (`fall:4` on all 4 rows): crops are empty stage - renders
  at alpha 0 BY DESIGN (`GameScene.syncSprites`: completed defeat
  fade must not reappear), the documented archer precedent. The DOWN
  drawing is verified in the pack and the trace records the correct
  key. Correct.
- **walk** (`walk:4` at tick 12, real-input gameplay): mid-stride,
  alternating legs, pike carried at the side. Genuine gait, feet
  plant; no skating at game size.
- **mixed** (`jab1:3` follow at attack@10, real inputs): the follow-
  through after a real jab1 - proves the live attack path (not just
  injected states) drives the new art.
- **coop**: P1 attack@16 shows walk:0 (jab1 tail guard, duration 18 -
  correct), P2 guanyu idle shows guanyu walk:0. Both fighters on
  motion keys simultaneously; no cross-fighter leakage, no mixing.

## Renderer parity (canvas vs webgl)

Identical poses, keys, boxes and bookends on all 37 crops except the
two known pre-existing splits, both reproduced exactly and neither a
zhangfei defect: (1) the hurt red-tint canvas-absent/webgl-present
split above; (2) dead renders alpha 0 (empty crops) on both. No blank
crops on either renderer (0 blanks both runs).

## Coverage and open items

- Coverage 32 captured / 6 unseen per renderer. Unseen: stop, release,
  dismount (x2 facings) - transition clips with no driving sim state,
  unit-covered (my zhangfei test samples landing/kicklanding/release/
  dismount directly); unseen stays unseen per the core rule. The 'stop'
  cell has no hero sim state (guanyu precedent also leaves it unseen).
- Open landmarks contactU/weaponTipU (standard opens on every capture;
  producer verifies on fresh pixels). groundErrorU 0 as recorded by
  the harness; pivotU (260,272) matches the prepared pivot exactly.
- Videos are owner-playable evidence; wall pacing is reported per tick
  in report.json, never assumed (standard headless limitation).
- Stray background enemies wander into a few crop edges (live waves
  spawn during the long capture; the subject stays centered and the
  trace samples only the player) - cosmetic, same as prior captures.

## Defects found and fixed this turn

- **lowCollapse guanyu literals (FIXED, shared player, backward
  compatible):** the shared `motion-player.ts` collapse paths emitted
  hardcoded `fall:5/6` + `getup:N` countdown frames that do not exist
  in the zhangfei pack (nor any mook pack). For zhangfei this meant
  ~34 ticks of legacy-rig fallback after every throw (ticks 2-35 of
  the knockdown) - a center-screen violation of acceptance 1, far
  beyond the mooks' documented 2-4-tick edge. Fixed with an optional
  per-kind `collapseTail` (default preserves guanyu/mook behavior
  byte-identically; zhangfei sets impact-then-DOWN); getup countdown
  class widened [1-7]→[0-7] (provably dead code for guanyu, required
  for compact packs). Covered by 3 new unit tests + a publish-wiring
  pin; all pre-existing transition tests green unchanged. Mooks keep
  their documented behavior (their tasks are DONE; changing their
  rendering is out of scope here). Scope note: bounded work 3 routes
  shared defects to blockers rather than refactors, but a defect
  that directly violates this task's acceptance 1 with a 10-line
  backward-compatible fix is the smallest coherent change, not an
  unrelated refactor; the full reasoning is in the PROGRESS entry.
- **Harness, not game (fixed in spec):** (1) injected special/
  jumpattack states must carry their real attackIds - the sim
  fail-fasts otherwise (`requireAttackId`), which wedged all later
  snapshots; (2) adjacent isolated actions must not share a sim state
  at decreasing ticks (the trace clock check reads that as a
  regression); the list is ordered accordingly with comments.

## Verdict

Self-check: PASS with the standard opens. All 73 rows per renderer use
real pack frames on the motion textures; every hero state/attack/clock
binds and displays; bookends hold by clip convention; no legacy blends
in any captured row; both renderers agree. Remaining for DONE: vision,
prodbuild, signal per the spec handoff (next turn).
