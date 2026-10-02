# Wei Archer — identity lock (CMR-08A)

Locked 2026-10-02 from existing original sources only. All generation
prompts reference these two masters by hash; no Guan Yu palette-swap,
no figure-definition changes to fit generated pictures.

## Masters (inspected before authoring)

- Body: `art/fighter-bodies/archer-body-master.jpg` (832x1248 JPEG,
  162807 B, sha256 `4b16934736a302b98b7373b694eac35a2788d4b05b1ac08fd9ecf24494dad40b`).
  Full-figure reference stance, arms slightly extended, facing 3/4 right.
- Portrait: `art/mook-faces/archer-portrait-master.jpg` (832x1248 JPEG,
  253655 B, sha256 `bace27aff57484cf21b500f26554babe94c33cf67e3e0973103c611711ee52e7`).
  Head/shoulders 3/4 view. Same individual as the body master.

## Locked identity

- Head: dark moss-green cloth headwrap with knot tails at the back-left;
  stern weathered East Asian face, thick straight brows, thin mustache +
  light chin stubble; NO helmet (deliberate contrast with the spearman's
  iron helm - prompts must name the wrap, never a helmet).
- Body: dark moss-green long robe with side slits; brown leather
  cross-chest straps + wide tooled belt with hanging strap ends; brown
  segmented bracers; dark grey-green trousers; brown leather boots.
- Weapon (NOT in masters - authored per spec, recorded here): recurve
  bow of brown wood with a light string, plus straight arrows (wooden
  shaft, steel head, fletching). Undrawn bow in carry poses; drawn with
  nocked arrow only in draw/release poses. The bow bends when drawn; the
  arrow never bends.
- Camera/light/palette: 3/4 front-right, upper-left key light, painted
  semi-realism, restrained palette matching legacy (`hood` green +
  `bow`, GRUNT body per `figures.ts` archer plan). Transparent
  background, no glow/shadow/text/panels/effects, full figure + full
  weapon inside every cell.

## Rigid weapon landmarks (for acceptance 4)

- Undrawn-bow chord (carry poses): tip-to-tip straight distance of the
  relaxed bow. Constant across all non-draw poses by construction.
- Nocked-arrow length (draw poses): tip-to-nock straight shaft length.
  Rigid; only present while an arrow is nocked.
- Heads: face-cluster sqrt-area, same method as soldier/spearman.
- Method detail (two weapon classes, each internally consistent, then a
  normalized combined spread) is designed in AUTHORING-PLAN.md; it
  crystallizes at measurement time. Unknowns stay unverified.
