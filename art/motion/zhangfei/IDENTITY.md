# Zhang Fei — identity lock (CMR-09A)

Locked 2026-10-02 from existing original sources only. All generation
prompts reference these two masters by hash; no Guan Yu palette-swap,
no figure-definition changes to fit generated pictures.

## Masters (inspected before authoring)

- Body: `art/fighter-bodies/zhangfei-body-master.jpg` (832x1248 JPEG,
  184617 B, sha256 `546fc302630f5ea9b4195afbdcebf49eac7f97b1c5ff36df63b39e95b17c6afa`).
  Full-figure reference stance, arms extended, facing 3/4 right.
  Sleeveless dark-red vest, rope belt, NO weapon, NO armor, NO cape.
- Portrait: `art/hero-faces/zhangfei-portrait-master.png` (1145x1374 PNG,
  2472904 B, sha256 `36b41443bfe1fe0d2d66975a7f83018e1709b420cbf365dec95f871b8ee84d38`).
  Head/shoulders 3/4 view. Same individual as the body master. USE FOR
  FACE/BEARD/HEADBAND ONLY: its dragon-pauldrons armor + red cape are
  EXCLUDED by the figure plan below (cape=false, no armor).

## Locked identity (figure plan is authoritative)

`figures.ts` zhangfei plan: body 0x8e3520, trim 0x3a3a3a, gear 0x1a1a1a,
headgear `band`, weapon `pike`, build HEAVY (height 0.96, bulk 1.18,
shoulders 1.14, head 1.04), beard `bristle` 0x181410, cape FALSE, skin
0x764d33, face `fierce`.

- Build: SHORT and HEAVY - the shortest hero (0.96), the bulkiest
  (1.18), the biggest head (1.04). Silhouette reads vs Guan Yu TALL
  (1.06/1.02/0.97) with colour stripped out. Prompts must name the
  heavy torso + big head in EVERY sheet or the generator drifts him
  tall.
- Head: topknot + red-and-black headband with knot tails; round fierce
  glare (NOT Guan Yu's slanted phoenix eyes); BRISTLED tiger-whisker
  beard that stands out from the jaw in spikes (NOT a smooth wedge -
  the smooth wedge reads as Xu Chu); dark ruddy skin, clear of the
  near-black beard so the face stays readable.
- Body: sleeveless dark-red/maroon vest (0x8e3520) with black trim,
  rope belt with hanging tassels, dark loose trousers, brown lace-up
  boots. Bare heavy arms. NO armor, NO cape, NO helmet - ever.
- Weapon (NOT in masters - authored per spec, recorded here): the
  丈八蛇矛 serpent pike, LONGEST weapon on the roster (82 figure units,
  serpent head, red tassel at the socket). One rigid pike; length is
  the identity. Never shortened for a strike, never forked, never
  swapped for a spear/glaive.
- Camera/light/palette: 3/4 front-right, upper-left key light, painted
  semi-realism, same camera family as the Guan Yu reference and the
  three mook packs. Transparent background, no glow/shadow/text/panels/
  effects, full figure + full weapon inside every cell.

## Rigid weapon landmarks (for acceptance 4)

- Pike tip-to-butt (carry/planted poses): straight-line distance from
  serpent-head tip to butt cap. Constant across all poses where the
  full shaft is visible by construction.
- Heads: face-cluster sqrt-area, same method as the mook packs (beard
  excluded by the face-cluster mask; the bristle edge is the known
  hard part - method crystallizes at measurement).
- Direction: pike angle per cell; steps >60° need a coherent bridge
  drawing (the finisher sweep is the risk - plan the mid-sweep cell).
- Unknowns/occluded/foreshortened cells stay unverified, never passes.
