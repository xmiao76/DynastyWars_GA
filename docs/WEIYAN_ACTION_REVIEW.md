# Wei Yan action review (CMR-11B, self-check — producer verifies fresh)

- Captures: `artifacts/motion-review/weiyan-canvas/` and
  `artifacts/motion-review/weiyan-webgl/`, commit `06bb370`-dirty,
  73 trace rows each, 0 trace errors, 0 page errors, 0 hard
  integrity issues, 2 open landmark items each (contactU/
  weaponTipU — same standing OPENS as every fighter). Coverage 32
  captured / 6 unseen (stop/release/dismount × facings —
  transition clips, not sim states; sampled directly as frames,
  so no gap). All 146 rows motion art, zero legacy keys; all six
  attack IDs (wy.jab1/jab2/finisher/jumpkick/special,
  mounted.sweep) sampled both facings; coop + mixed gameplay
  included. WebGL matches canvas exactly (same rows/errors).
- Contact sheets (37 crops each, both facings) + enlarged crops
  reviewed with the image tool: jab1-right, jumpkick-right,
  special-right, knockdown-right (this pass), all actions at game
  size on both sheets. WebGL shows hit-flash tint applying
  correctly over motion art.

## Per-action verdicts (all self-check, fixed-unverified)

- idle/walk: guard + genuine 8-cycle, feet plant, no skate. PASS.
- jab1/jab2/finisher: distinct arcs (high drive / low chamber /
  heavy chop), strike on every active tick per unit tests; slower
  dao windings read weighty. PASS.
- jump/jumpkick/landing: crouch → rise → tuck → kick → descent →
  grounded landing; remapped kick spare reads naturally. Kick
  crop: full leg extension, braced dao, airborne. PASS.
- hurt/fall/getup: recoil → topple → airborne → tumble → impact →
  DOWN (flat) → push → kneel → crouch → half-rise → stand. R1
  elbow + splices/retouches blend. Knockdown crop: impact sprawl
  with grimace, correct grounding. PASS.
- special: raise → coil → pre-spin → strike → follow; zero effects
  paint. Strike crop: deep lunge, full extension, both hands. PASS.
- grab/hold/release + grabbed: clamp → hold (spare) → release;
  hurt fold doubles as grabbed. PASS.
- rider set: idle/trot/mount/windup/sweep/dismount, all seated, no
  horse parts; mount leg-raise reads. PASS.
- dying/dead: fall clip clamps on DOWN; dead holds DOWN. PASS.
- Both facings mirror correctly (weapon flips with body); no
  legacy blends, no blanks, no pops, identity locked throughout.

## Known limitation (not a new finding)

Ghost slivers (neighbor straddle pixels inside raw atlas trim rects)
show at some frame edges (e.g. jab1-right's left edge: blade bit;
jump:5/getup:4/rider:2 left-edge blade bits; a few floating gold
pommel dots). Small (single-digit px at game size) and
edge-confined. This is the shared pipeline defect documented in
[11A PROVENANCE](../art/motion/weiyan/PROVENANCE.md) (11 bounds-overlap
pairs post-campaign; fighter-local masking proven ineffective;
pipeline-level owner-masking needs owner direction) — filed for
producer triage, not a source-art defect, no repair triggered.

## Artifacts

- `artifacts/motion-review/weiyan-canvas/` and `weiyan-webgl/`:
  `{report,index,trace}.json`, `contact-sheet.png`,
  `weiyan-<renderer>.webm`, `frames/*.png` (37 each).
- Review core: `scripts/motion-review-core.mjs` (validateTrace +
  coverageMatrix + index integrity), same harness as 09B/10B.
- Next: vision/prodbuild/signal gates, then DONE.
