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
px on a 340px figure = 0.79 figure-heights; Zhao Yun's 72u spear is
461 on 323 = 1.43. At that unit scale the drawn weapon is ~40u,
~58% of its 69u contract, and SHORTER than the mooks' 46u sword.
The drawn blade also has no haft/tassel, so the silhouette identity
(long-handled dao) is missing, not just its length.

What this invalidates: the weapon identity of ALL ten accepted sheets
(poses, bodies, faces and turban remain on-model and are reusable as
pose/identity references). What it does not invalidate: the pack
mechanics (fit/budget/registration), which are weapon-agnostic.

