# Zhao Yun action review (CMR-10B, self-check — producer verifies fresh)

- Capture: `artifacts/motion-review/zhaoyun-canvas/` (canvas renderer),
  commit `198513c`-dirty, 73 trace rows, 0 trace errors, 0 page errors,
  0 hard integrity issues, 2 open landmark items (contactU/weaponTipU —
  same standing OPENS as every fighter). Coverage 32 captured / 6 unseen
  (stop/release/dismount × facings — transition clips, not sim states;
  sampled directly as frames, so no gap).
- Contact sheet (37 crops, both facings) + enlarged crops reviewed with
  the image tool: jab1-right, jumpkick-right, special-right,
  knockdown-right (this pass), all actions at game size on the sheet.

## Per-action verdicts (all self-check, fixed-unverified)

- idle/walk: guard + genuine 8-cycle, feet plant, no skate. PASS.
- jab1/jab2/finisher: distinct arcs (high coil / low chamber / heavy
  finisher), strike on every active tick per unit tests; remapped
  finisher drive reads naturally. PASS.
- jump/jumpkick/landing: tuck → stretch → kick → fold → land; the
  tucked apex gathers before the kick explodes. Kick crop: full leg
  extension, braced spear, airborne. PASS.
- hurt/fall/getup: recoil → topple → airborne → tumble → impact →
  DOWN (flat) → elbow → kneel → crouch → half-rise → stand. R1
  splices (kneel/stand) blend. Knockdown crop: impact sprawl with
  grimace, correct grounding. PASS.
- special: raise → coil → pre-spin → strike → follow; zero effects
  paint. Strike crop: full horizontal extension, both hands. PASS.
- grab/hold/release + grabbed: clamp → hold → release; hurt fold
  doubles as grabbed. PASS.
- rider set: idle/trot/mount/windup/sweep/dismount, all seated, no
  horse parts; mount leg-raise reads. PASS.
- dying/dead: fall clip clamps on DOWN; dead holds DOWN. PASS.
- Both facings mirror correctly; no legacy blends, no blanks, no
  pops, identity locked throughout.

## Known limitation (not a new finding)

Ghost slivers (neighbor straddle pixels inside raw atlas trim rects)
show at some frame edges (e.g. jab1-right's right edge: blue cape bit;
several contact tiles). Small (tens of px at full scale) and
edge-confined. This is the shared pipeline defect documented in
[10A PROVENANCE](../art/motion/zhaoyun/PROVENANCE.md) (14/56 zhaoyun +
17/56 zhangfei frames; fighter-local masking proven ineffective;
pipeline-level owner-masking needs owner direction) — filed for
producer triage, not a source-art defect, no repair triggered.

## Artifacts

- `artifacts/motion-review/zhaoyun-canvas/{report,index,trace}.json`,
  `contact-sheet.png`, `zhaoyun-canvas.webm`, `frames/*.png` (37).
- Review core: `scripts/motion-review-core.mjs` (validateTrace +
  coverageMatrix + index integrity), same harness as 09B.
- Next: webgl capture + vision/prodbuild/signal gates, then DONE.
