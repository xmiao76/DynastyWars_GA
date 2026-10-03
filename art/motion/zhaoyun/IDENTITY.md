# Zhao Yun motion pack — identity lock (CMR-10A)

Fighter ID: `zhaoyun`; role: hero; weapon: spear. This file is the
single identity reference every sequence brief points at. Nothing here
may drift without a new review.

## Sources (read before authoring, per spec)

- Body master: `art/fighter-bodies/zhaoyun-body-master.jpg`
  (sha256 `a1067c2a…`, 720x1280). Lean young warrior, silver lamellar
  helmet with red horsehair plume, silver pauldrons/cuirass with beast
  motifs, royal-blue robe with red trim, red sash belt with medallion,
  lamellar tassets, dark trousers, black boots. Fair skin, no beard.
- Portrait master: `art/hero-faces/zhaoyun-portrait-master.png`
  (sha256 `dff59167…`, 1145x1374). Broad fair face, fierce eyes, black
  brows, helmet + plume, blue cloak over the shoulder with round
  brooch + red cord tassels, scale armor.
- Figure plan: `src/game/art/figures.ts` HERO_FIGURES.zhaoyun —
  LEAN build `{height 1.0, bulk 0.93, shoulders 0.97, head 1}`,
  body `0x2f5fb3` (royal blue), trim `0xc84a4a` (red), gear
  `0xc0c8d4` (silver), headgear `helmet`, weapon `spear`, beard
  `none`, cape true, skin `0xd8b898` (young and fair), face `bold`,
  jaw `1.1` (broad face, full jaw).

## Locked look

- Young, fair, clean-shaven, broad-faced and bold-eyed; black hair in
  a topknot under the helmet; NO beard, NO headband (those belong to
  Guan Yu / Zhang Fei - a headband here is an identity break).
- Silver helmet with beast medallion + red horsehair plume; silver
  pauldrons, cuirass and tassets with beast/scale motifs; royal-blue
  robe with red trim; red sash belt with medallion; dark trousers;
  black boots. Blue cloak with round brooch + red cords in poses
  where it shows (see cape rule).
- Camera: strict side view, feet on the ground line, upper-left key
  light, painted semi-realism, transparent background. Same framing
  and scale in every cell of every sequence.

## Rigid weapon landmarks (measured at acceptance, never eyeballed)

- Straight war spear, ONE rigid length everywhere: **72 units**
  (`figures.ts` WeaponSpec: length 72, haft 4.6, leaf head, red
  tassel). Pale steel leaf-shaped blade, dark wood shaft, gold collar
  + gold butt cap, red tassel cord below the head.
- THE LENGTH CONTRACT (the Zhang Fei lesson): the briefs' old "fit
  the whole weapon inside every cell" fought "never shorten it" and
  the generator resolved it by drawing short weapons - the pack-wide
  defect that sank acceptance-4. For Zhao Yun the contract is
  one-sided and explicit in EVERY brief: the spear NEVER shortens to
  fit; when long, it angles diagonally and may cross nominal cell
  lines into empty space, never touching a neighboring drawing or the
  sheet border. Length is verified tip-to-butt per cell.
- Direction changes ≤60° between play neighbors, else an authored
  bridge cell (same rule as Zhang Fei).

## Cape rule (new for this fighter)

- The blue cloak + brooch appear in every standing/walking/fighting
  pose, flowing BEHIND the figure (screen-left when facing right).
- It never covers the weapon arm, the hands, or the spear shaft; in
  low poses (crouch, landing, fall, getup) it pools/folds behind the
  body; in the air it streams. If a cell breaks the rule, the cell is
  rejected (targeted edit, not a new sheet while budget allows).
- The brooch + red cords stay visible whenever the chest is visible.

## Scale target

- Walk-guard fitted height ~228px (95% of Guan Yu's 240), hard floor
  224px: heroes stay above the mook archer (223). Guard height is the
  cross-pack ruler; per-sheet uniform factors absorb sheet-level drift
  (two-proxy evidence, never per-cell).
