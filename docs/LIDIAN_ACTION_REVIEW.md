# Li Dian action review (CMR-13B, self-check — producer verifies fresh)

- Captures: `artifacts/motion-review/lidian-canvas/` and
  `artifacts/motion-review/lidian-webgl/`, commit `76849ea`-dirty,
  46 trace rows each, 0 validation errors, 0 hard integrity issues,
  2 open landmark items each (contactU/weaponTipU — same standing
  OPENS as every fighter). Coverage 12 captured / 12 unseen:
  the matrix matches ENEMY_ACTIONS labels while the boss trace
  carries clip names (charge/combo/heavy/hurt/knockdown/grabbed),
  so the mismatch cells stay honestly unseen; every named action
  has trace rows + crops both facings (11 isolated actions × 2
  samples × 2 facings + AI walk × 2). All 92 rows motion art,
  zero legacy keys; all three boss attack IDs (charge.dash/
  sword.combo/sword.heavy) sampled both facings; AI walk
  included. WebGL matches canvas exactly (same rows/errors).
- Contact sheets (24 crops each, both facings) + enlarged crops
  reviewed with the image tool: charge-right, heavy-right,
  knockdown-right, combo-left, dead-right (this pass), all
  actions at game size on both sheets. All enemy crops render
  at 55% alpha: expected mercy i-frame blink
  (GameScene.ts:755 renders invulnerableTicks>0 at 0.55; the
  harness holds the target invulnerable), not an art defect —
  poses/registration read cleanly through it.

## Per-action verdicts (all self-check, fixed-unverified)

- idle/walk: guard + genuine 8-cycle, feet plant, no skate.
  AI-driven walk captured both facings. PASS.
- charge (10/18/20): coil → launch → dash → dash2 → brake;
  strike on every active tick per unit tests. Charge crop:
  full sprint lean, levelled glaive, planted rear foot.
  PASS.
- combo (9/4/12): windup → rising-cut + sweep across the
  4-tick active window → follow → recover → guard. Combo
  crop (left): sweep lunge mirrored correctly, blade left,
  feet planted. PASS.
- heavy (16/6/24): raise → hold → chop → follow → recover.
  Heavy crop: chop with braced stance, tassel + crescent
  clear. PASS.
- hurt/fall/getup: recoil → fold → topple → airborne →
  tuck → impact → DOWN → prop → kneel → crouch → rise →
  stand. Knockdown crop: impact dive with correct
  grounding + shadow. PASS.
- grabbed: held-clamp misc:2 (literal held pose). PASS.
- thrown: tumble → impact. PASS.
- dying/dead: fall clip runs; dead routes to fall:4 (trace
  key `entity:lidian:motion:fall:4`, zero fallbacks). The
  dead crop itself is an empty stage — harness-wide
  artifact (corpse cleanup before the screenshot, same as
  huangzhong/weiyan), not an art defect. PASS with note.
- Both facings mirror correctly (weapon flips with body);
  no legacy blends, no blanks, no pops, identity locked
  throughout. No enrage-specific art (faster think, same
  drawings — clock, not drawings, per 13A plan).

## DOWN handoff re-confirmation (binding, from 13A)

- fall:4 (flat DOWN bookend) re-confirmed ACCEPTABLE at
  integration: renders through the same pipeline, dead/
  getup[0] route to it with zero fallbacks (trace + unit
  tests), role-correct as the prone rest. getup:0 (own
  DOWN drawing) displays at getup tick 2-4 by design; the
  two prone drawings read as one settle. No repair
  triggered; acceptance-4 reserve stays exhausted (3/3
  spent in 13A on heavy — nothing left, nothing needed).

## Known limitations (not new findings)

- Ghost slivers: none observed at review scale (frames read
  clean; 11A's shared-pipeline note stands if the producer
  spots any at higher zoom). No other issues.
- Native video: `lidian-canvas.webm` / `lidian-webgl.webm`
  captured and indexed; this review judged contact sheets
  + 4x crops (still frames) — video playback is not
  available in this environment. Pace validated by trace
  (30fps, 2 ticks/frame) + unit-tested clip durations.

## Artifacts

- `artifacts/motion-review/lidian-canvas/` and `lidian-webgl/`:
  `{report,index,trace}.json`, `contact-sheet.png`,
  `lidian-<renderer>.webm`, `frames/*.png` (24 each).
- Review core: `scripts/motion-review-core.mjs` (validateTrace +
  coverageMatrix + index integrity), same harness as 09B–12B.
- Re-run `node scripts/motion-capture.mjs --fighter lidian --role boss
  --enemy lidian --renderer {canvas,webgl}` on a clean tree, re-verify the
  contact sheets, then DONE.
