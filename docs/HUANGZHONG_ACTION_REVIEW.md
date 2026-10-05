# Huang Zhong action review (CMR-12B, self-check — producer verifies fresh)

- Captures: `artifacts/motion-review/huangzhong-canvas/` and
  `artifacts/motion-review/huangzhong-webgl/`, commit `bdcd497`-dirty,
  73 trace rows each, 0 validation errors, 0 hard integrity issues,
  2 open landmark items each (contactU/weaponTipU — same standing
  OPENS as every fighter). Coverage 32 captured / 6 unseen
  (stop/release/dismount × facings — transition clips, not sim
  states; sampled directly as frames, so no gap). All 146 rows
  motion art, zero legacy keys; all six attack IDs (hz.jab1/jab2/
  finisher/jumpkick/special, mounted.sweep) sampled both facings;
  coop + mixed gameplay included. WebGL matches canvas exactly
  (same rows/errors).
- Contact sheets (37 crops each, both facings) + enlarged crops
  reviewed with the image tool: jab1-right, jumpkick-right,
  special-right, knockdown-right (this pass), all actions at game
  size on both sheets. WebGL shows hit-flash tint applying
  correctly over motion art.

## Per-action verdicts (all self-check, fixed-unverified)

- idle/walk: guard + genuine 8-cycle, feet plant, no skate. PASS.
- jab1/jab2/finisher: distinct arcs (thrust / chop / sweep), strike
  on every active tick per unit tests. Jab1 crop: full extension,
  both hands on the bow, planted feet. PASS.
- jump/jumpkick/landing: crouch → rise → apex → kick → descent →
  grounded landing; remapped kick spare reads naturally. Kick
  crop: full leg extension, braced bow, airborne. PASS.
- hurt/fall/getup: recoil → topple → airborne → tumble → impact →
  DOWN → push → kneel → crouch → rise → stand. Knockdown crop:
  impact sprawl with correct grounding. PASS.
- special: release AT spawn → follow → recover; zero arrows paint.
  Special crop: string hand flicked forward past the vertical bow.
  PASS.
- grab/hold/release + grabbed: clamp → hold → release; hurt fold
  doubles as grabbed. PASS.
- rider set: mount/move/move-alt/windup/sweep/follow, all seated,
  no horse parts; boots dangle (mounted, correct). PASS.
- dying/dead: fall clip runs; dead routes to fall:4 (trace key
  `entity:huangzhong:motion:fall:4`, zero fallbacks). The dead
  crop itself is an empty stage — harness-wide artifact, weiyan's
  dead-right crop is pixel-identical (corpse cleanup before the
  screenshot, not an art defect). PASS with note.
- Both facings mirror correctly (weapon flips with body); no
  legacy blends, no blanks, no pops, identity locked throughout.

## DOWN handoff re-confirmation (binding, from 12A)

- fall:4 (diagonal DOWN, 12A waiver (c)) re-confirmed ACCEPTABLE
  at integration: renders through the same pipeline (knockdown
  crop shows impact grounding clean), dead/getup[0] route to it
  with zero fallbacks (trace + unit tests), role-correct as the
  prone rest. Orientation variance vs flat bookends is covered by
  the 12A waiver — referred, NOT silently re-waived. No repair
  triggered; acceptance-4 reserve stays 3/3.

## Known limitation (not a new finding)

- Ghost slivers: none observed at review scale (frames read clean;
  11A's shared-pipeline note stands if the producer spots any at
  higher zoom). No other issues.

## Artifacts

- `artifacts/motion-review/huangzhong-canvas/` and `huangzhong-webgl/`:
  `{report,index,trace}.json`, `contact-sheet.png`,
  `huangzhong-<renderer>.webm`, `frames/*.png` (37 each).
- Review core: `scripts/motion-review-core.mjs` (validateTrace +
  coverageMatrix + index integrity), same harness as 09B/10B/11B.
- Next: vision/prodbuild/signal gates, then DONE.
