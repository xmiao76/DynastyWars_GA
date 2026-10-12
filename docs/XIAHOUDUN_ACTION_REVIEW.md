# Xiahou Dun action review (CMR-14B, self-check — producer verifies fresh)

- Captures: `artifacts/motion/xiahoudun/precedent/captures/canvas/`,
  `.../webgl/` (960×540 spec default) and `.../canvas-mobile/`
  (`MOTION_VIEWPORT=844x390` requested; fresh-run
  `canvas-mobile/index.json` `capture.viewport` 844×390 — requested
  value, since wrapper `buildIndex` drops the spec's actual
  `page.viewportSize()` record (core fix pending, out of scope).
  Trace rows carry box-relative 2× crop boxes,
  uniform 520×436 on all 3 runs). Mobile is ONE coherent wrapper run
  (capturedAt 2026-10-12T09:23:18Z, HEAD `e7a89df`-dirty across
  index/report/trace; the prior mixed-provenance dir — `44c620a`
  report under an `e7a89df` index — now sits in
  `previous/canvas-mobile-superseded`); desktop/webgl `44c620a`-clean, 484 trace rows each, 0 validation errors, 0 hard
  integrity issues, 3 open landmark items each
  (groundErrorU/contactU/weaponTipU). Coverage 26 captured / 8 unseen
  (`enrage`/`approach`/`retreat`/`stop` × facings — dispositioned below,
  kept UNSEEN, never relabelled). All 484 rows motion art, zero legacy
  keys; all three boss attack IDs (`charge.dash.long`, `sword.combo`,
  `sword.heavy`) sampled both facings; AI walk + 180-tick AI mixed run
  per facing included. Frame coverage 39/39 packed frames observed both
  facings, missing `[]`, on all 3 runs. WebGL matches canvas exactly.
- Contact sheets (102 crops each: every `key-*` + action frame, both
  facings, harness `motion-capture.mjs` layout, built from the existing
  captures by `scripts/build-xiahoudun-contact-sheets.mjs` — no
  re-capture) + enlarged crops reviewed with the image tool this pass:
  charge-right, knockdown-right, combo-left, dead-right (canvas), plus
  heavy-left (canvas-mobile). Prior pass: webgl heavy-right / idle-left /
  key-heavy-2-left, mobile heavy-left / walk-right. No legacy-vs-motion
  pair sheets: all rows are motion art (zero legacy keys), so per the
  12B/13B practice the evidence is contact sheets + enlarged still
  crops, not legacy pairs. Motion footage IS present (CORRECTION
  2026-10-12 cmr14b-footage — the earlier "declared-but-absent" line
  was a truncated-listing error): `xiahoudun-canvas.webm` (4,866,047 B)
  in canvas, `xiahoudun-webgl.webm` (11,056,673 B) in webgl,
  `xiahoudun-canvas.webm` (3,963,009 B, single coherent mobile run
  capturedAt 2026-10-12T09:23:18Z) in canvas-mobile; all
  EBML-valid VP8 800x450, timestamps matching each run's `capturedAt`,
  every `index.json videoPath` resolves. This review still judged
  still frames only (no native-speed playback in this environment),
  same native-playback limitation as 14A.

## Per-action verdicts (all self-check, fixed-unverified)

- idle/walk: guard + genuine 8-cycle, feet plant, no skate. AI-driven
  walk both facings; all walk:0–8 render inside both AI mixed runs.
  PASS both facings.
- charge (`charge.dash.long`): coil → launch → dash → brake. Charge
  crop (right): full sprint lean, levelled spear, red tassel, planted
  drive foot, shadow. PASS both facings.
- combo (`sword.combo`): windup → cut + sweep across the active window
  → follow → recover. Combo crop (left): sweep lunge mirrored
  correctly, spear left, tassel clear, feet planted. PASS both facings.
- heavy (`sword.heavy`): raise → hold → chop → follow → recover. Heavy
  crop: two-hand chop, braced stance, tassel + spearhead clear. PASS
  both facings + TRANSFERRED big-boss size (heavy drawn larger,
  owner-2026-10-08 ruling).
- hurt (hitstun, misc:0/1): recoil → fold. PASS both facings.
- knockdown (fall): topple → airborne → tuck → impact → DOWN.
  Knockdown crop (right): prone impact with correct grounding + shadow,
  spear gripped, identity consistent. PASS both facings +
  TRANSFERRED fall:3-weak-vs-fall:2 (owner-accepted).
- getup: DOWN → prop → kneel → crouch → rise → stand (getup:0 aliases
  fall:4 cell-identical). PASS both facings.
- grabbed: held-clamp misc:2 (literal held pose). PASS both facings.
- thrown: tumble → impact (fall reuse per the Li Dian boss clip
  layout). PASS both facings.
- dying/dead: fall clip runs; dead routes to fall:4 (captured dead
  rows, 0 validation errors, fall:4 observed both facings). The dead
  crop itself is an empty stage — harness-wide artifact (corpse cleanup
  before the screenshot, same as huangzhong/weiyan/lidian), not an art
  defect. PASS with note, both facings.
- mixed: 180-tick real-AI run both facings (14 distinct xiahoudun keys
  each, incl. full walk cycle). PASS both facings.
- Both facings mirror correctly (spear flips with body); no legacy
  blends, no blanks, no pops, identity locked throughout.

## Unseen-8 disposition (honest, per 12B/13B precedent)

- `enrage` × 2 facings — UNSEEN, no gap: enrage has no drawings.
  Normal/enraged AI use the same poses
  (`src/game/art/motion-clips-xiahoudun.ts:18`); enrage is faster think
  cadence + 1.4× speed (`src/core/ai.ts:132-150`) plus an orange tint
  (`src/game/scenes/GameScene.ts:753`) — clock/tint, not drawings, the
  exact Li Dian 13B precedent ("No enrage-specific art").
- `approach`/`retreat`/`stop` × 2 facings — UNSEEN, no drawing gap:
  `ENEMY_ACTIONS` matrix labels with no distinct injected states in the
  autopilot window (same class as Huang Zhong 12B's stop/release
  transition clips). Their rendered frames are already covered:
  approach/retreat locomotion draws walk frames (all walk:0–8 appear in
  the AI mixed rows both facings) and stop draws the idle guard
  (captured both facings); frameCoverage is 39/39 observed, missing
  `[]`, both facings on all 3 runs. Cells stay UNSEEN in
  `index.json` — not relabelled, not graded natural.

## DOWN handoff re-confirmation (binding, from 14A)

- fall:4 (flat DOWN bookend; getup:0 aliases it cell-identical)
  re-confirmed ACCEPTABLE at integration: dead/getup[0] route to it
  with zero validation errors (trace + `report.json`), role-correct as
  the prone rest; knockdown crop shows impact grounding clean through
  the same pipeline. No repair triggered; the Acceptance-4 reserve
  belongs to 14A (31 requests, ceiling reached — nothing spent here,
  nothing available).

## Transferred limitations (from 14A, not new findings)

- Per `art/motion/xiahoudun/closeout-campaign/FINAL-ACCEPTANCE.md`:
  heavy-large + heavy head-cast coherence waiver; spear-length jumps
  between keys (largest fall:3 → DOWN); head metrics UNVERIFIED (beard
  conceals chin); hidden 3D ground/camera unverified; upright
  misc/getup read ~15% shorter than walk guard (not measured);
  presentation 260×218/groundY 210; no normal-speed playback reviewed.
- Per `artifacts/motion/xiahoudun/precedent/crit4/CRIT4-SUMMARY.md`:
  criterion 4 PASS WITH TRANSFERRED WAIVERS (uniform-scale
  construction + pack measurement, same shape as 12B/13B);
  contactU/weaponTipU stay standing OPENs for the producer.
- Ghost slivers: none observed at review scale (frames read clean).

## Artifacts

- `artifacts/motion/xiahoudun/precedent/captures/{canvas,webgl,canvas-mobile}/`:
  `{runtime,report,index,trace,page-errors,pace-left,pace-right}.json`,
  `contact-sheet.png` (102 crops), `crops/enlarged-*.png` (6 key
  poses), `frames/*.png` (102 each), plus one Playwright `.webm`
  recording per run dir (`xiahoudun-canvas.webm` canvas 4,866,047 B,
  `xiahoudun-webgl.webm` webgl 11,056,673 B, `xiahoudun-canvas.webm`
  canvas-mobile 3,963,009 B — EBML-valid VP8 800x450 (Playwright
  recording default, non-probative for viewport), matching
  `capturedAt`).
- Review core: `scripts/motion-review-core.mjs` (validateTrace +
  coverageMatrix + index integrity), same harness as 09B–13B; sheet
  builder: `scripts/build-xiahoudun-contact-sheets.mjs` (layout copied
  from `scripts/motion-capture.mjs`, existing captures only).
- Next: producer verifies fresh on these artifacts, then rules DONE.
