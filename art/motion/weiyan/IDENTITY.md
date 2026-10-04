# Wei Yan identity (CMR-11A, locked from masters)

Inspected 2026-10-03 with the image tool: body master
(`art/fighter-bodies/weiyan-body-master.jpg`, sha `ee0a0200…`),
portrait master (`art/hero-faces/weiyan-portrait-master.png`, sha
`0fc579c1…`). Heads master (`weiyan-heads-master.png`) available as
an additional reference when needed (provenance-recorded per use).

## Build and face

- SOLID middle-aged stocky build (broader than Zhao Yun's lean;
  near Zhang Fei's heavy). Hero height band: guard target ~226px
  fitted (between zhangfei 224 and zhaoyun 226.1).
- Severe glare: heavy black brows, deep-set glaring eyes, lined
  weathered TAN skin (darker than Zhao Yun's fair).
- SHORT SEVERE BEARD: black-grey chin/jaw beard + mustache + soul
  patch (NOT clean-shaven, NOT a flowing Guan Yu beard).

## Headgear and costume (no cape)

- Purple TURBAN with bronze cloud-plaques (forehead + crown) and a
  long tail flowing back-left. Turban is the signature - never a
  helmet, never bare hair.
- Purple cross-collar robe with bronze-patterned trim, wide
  sleeves; dark sash belt with bronze buckle; dark trousers;
  brown boots.
- Bronze armor: beast-face PAULDRONS (prominent, left shoulder in
  portrait) + lamellar hints under the robe collar.
- No cape, no plume, no helmet. Hands: defined fingers, weathered.

## The rigid dao (SUPERSEDED - see CORRECTION at the end; "~58u saber" was WRONG)

- Single-edged saber: broad steel blade with clipped tip, bronze
  disc guard, dark wood grip with bronze pommel. No tassel.
- SHORTER than spear/pike (~58u vs 72u/82u): ~380px raw at sheet
  scale. Fittings at both ends on every drawing (guard + tip).
- Length contract (same as spears): identical full length in EVERY
  cell, never shortened/foreshortened/cut. Straddle rule: the dao
  may cross cell gutters only into empty space, never touching
  another drawing. No-vertical rule, DAO-ADAPTED: blades stay
  within ~50° of horizontal (diagonal chops, never straight-up) -
  a vertical 380px dao + figure caps base at ~0.60 (guard ~192px),
  breaking the fit exactly like the zhaoyun verticals did.

## Spec-text discrepancy (recorded)

- The task spec says "no beard/cape". The masters SHOW a short
  severe beard (body + portrait agree). Per bounded work 1 ("lock
  from existing original sources"), the SOURCES win: beard YES
  (short, as shown), cape NO (both agree). If the owner wanted
  clean-shaven Wei Yan, the masters would need re-authoring first.

## Palette anchors

- Robe purple ~0x5b3a8c, trim bronze ~0x8c6f3f, sash/trousers dark
  ~0x2a2430, boots brown ~0x5a4030, skin weathered tan ~0xb98a5e,
  beard black-grey ~0x2a2a2e, blade steel ~0xb9c2cc.
- Light: upper-left key (matches the cast). Camera: strict side
  view for all sheets. Transparent backgrounds, no effects, no grids.

## CORRECTION (2026-10-04) - the weapon was specified wrong

Found while diagnosing the acceptance-4 weapon failure, by reading the
sources the CMR-11A spec lists under "read first" (`figures.ts`) that I
did NOT read when I wrote this file. I took "~58u" from memory of the
sword/jian row and described a short single-handed saber with no
tassel. The game's own definition says otherwise:

- `src/game/art/figures.ts` WEAPONS.dao = `{ length: 69, haft: 5.2,
  head: 'dao', tassel: true }` - a LONG-HANDLED polearm with a haft
  and a red tassel at the socket. Contract ladder (units): pike 82, ji
  78, glaive 76, spear 72, **dao 69**, sword 46, bow 42. The dao is
  the fifth-longest weapon, 3u under the spear - NOT a short blade.
- `docs/WEAPON_ART.md`: "Wei Yan retains this game's long-handled
  dao" (owner-selected silhouette, ART-15: near-straight spine, angled
  point, single cutting edge - on a long haft).
- The legacy rig render (artifacts/review/latest/anatomy/weiyan.png)
  shows exactly that: a long wooden pole, small blade at the top,
  red tassel.
- CMR-11A bounded work 1: lock identity from existing original
  sources and never change figure definitions to fit a generated
  picture. The ten accepted sheets do the opposite.

Measured consequence (walk cells, same-figure-height scale: Wei Yan
and Zhao Yun are both Build.height 1.0): drawn tip-to-pommel 270 raw
px on a 340px figure = 0.79 figure-heights; Zhao Yun's spear is
461 on 323 = 1.43. CORRECTED arithmetic: `WEAPONS.length` is the
HAFT length, not tip-to-butt: Zhao Yun's spear spans about 72+22=94u
with its blade overhang; the dao spans 69+23=92u. Hence the v1
weapon's equivalent is about 55u (270/451*92), ~60% of the
92u tip-to-butt target, NOT the previously stated ~40u/58% of
69u or a proven ordering against the sword. The silhouette defect
is unchanged: the v1 drawing has no long haft/tassel.

What this invalidates: the weapon identity of ALL ten accepted sheets
(poses, bodies, faces and turban remain on-model and are reusable as
pose/identity references). What it does not invalidate: the pack
mechanics (fit/budget/registration), which are weapon-agnostic.

## v2 WEAPON SPECIFICATION (2026-10-04, owner "Do A") - AUTHORITATIVE

Derived from sources, not memory (figures.ts WEAPONS.dao + weapons.ts
traceBlade('dao') + the legacy render crop `weapon-spec-reference.png`,
sha `71c288d1`, which shows the carried and the horizontal pose):

- LONG-HANDLED DAO: a straight dark-wood HAFT with fine ring-grooves
  (legacy render), a gold/bronze FERRULE ring where haft meets steel,
  a RED TASSEL (cloth tuft) hanging at the socket, and a single-
  edged steel blade at the far end: near-straight spine, ONE
  controlled cutting belly, an angled point (clipped, rising tip).
  Gold/bronze pommel cap at the butt end. NO disc guard, NO short
  grip - the v1 sabre's disc guard and 8cm grip were wrong.
- Proportions (estimate, not a pixel-exact art contract): rig haft
  length 69u and `traceBlade('dao')` tip at `fore+23`, so the
  tip-to-butt span is about 92u; Zhao Yun's 72u haft plus 22u blade
  overhang spans about 94u. Using Zhao Yun's walk spear ~461 raw px
  yields ~4.90px/u and a ~451px dao tip-to-butt comparator (0.98x
  the spear), with a long wooden haft and a short blade at its end.
  The v1 short saber measured ~270px (~60% of that comparator).
  Shaft thickness is stylistic, NOT a separately enforced 26px
  raw-sheet target: the legacy figure and actual v2 art are visual
  authorities for the haft/tassel/blade design.
- Carries: two hands on the haft (near hand at the grip, far hand
  forward along it); the long haft passes the body, so the poses are
  hold-at-guard-diagonal, level thrust, high diagonal chop, low sweep.
- Rules carried from the spear sheets, unchanged and now binding
  again: the weapon is RIGID and NEVER shortened to fit a cell; it
  angles diagonally and may straddle cell lines into EMPTY space,
  never touching another drawing or the sheet border; NO-VERTICAL
  (stay within ~45deg of horizontal - a 450px weapon cannot stand
  in a 341px cell and the generator shortens instead of
  straddling); figures keep gutters (bodies never touch across
  lines); haft, tassel and blade visible on EVERY drawing.
- The v1 sheets are still POSE/IDENTITY references (body, face,
  turban, robe, bronze). They are NOT weapon references: every
  v2 prompt names the legacy render as the ONLY weapon authority and
  says to ignore the short sabre in any other reference image.
- Face/head: unchanged from the v1 identity above (turban, short
  black-grey beard, weathered tan skin).

