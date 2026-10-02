# Wei Spearman — identity lock (CMR-07A bounded work 1)

Locked 2026-10-02 from the two ORIGINAL masters only (never palette-swapped
Guan Yu or soldier). Both observations came from fingerprint-verified
`read_image` reads (mechanical fingerprint checked before trusting each
preview, per the mandatory protocol).

## Sources (ordered reference hashes)

| ref | file | bytes | sha256 |
| --- | --- | --- | --- |
| body | `art/fighter-bodies/spearman-body-master.jpg` | 183,176 | `ffd598a0c3ed7b039db2f9b99f0c1c4acafa5511f0ef2e9248d68b3b749f832c` |
| portrait | `art/mook-faces/spearman-portrait-master.jpg` | 237,435 | `e43581f2df1e38d53ed446552c57d023461927cbc8fba9c2188f3c986d30a99a` |

Fingerprints (mechanical): both 832x1248 opaque; body 84.9% near-black
(mean RGB 15,13,12), portrait 78.2% (23,18,14) - figure masters on black.

## Identity / costume

- Build: rank-and-file spear fighter (mook scale), adult male, weathered
  stern face with light chin stubble and thin mustache, black hair at the
  sides. Taller bearing than the soldier (32 HP line troop).
- Headgear: dark iron domed helmet - riveted band, small top knob, narrow
  brow band, chin straps tied under the chin. The PORTRAIT's detail is
  canonical for every drawn head: taller crown with central ridge, front
  brow plate with small emblem, wide lamellar neck/ear flaps to the
  shoulders. The body master's simpler dome is the same design at distance.
- Armor: dark blue-grey chainmail/scale short-sleeve vest with brown
  leather trim (collar, sleeve edges, hem) over a grey under-robe; brown
  leather belt/sash with hanging straps; dark grey trousers; brown leather
  boots. No cape.
- Camera: 3/4 front-right, full figure including boots. Light: upper-left
  key, restrained painted semi-realism (house style).

## Weapon: the rigid spear (author-defined, locked)

Neither master shows the weapon (the body master poses empty-handed), so
the design below is FIXED HERE and identical in every drawing - it is the
contract's rigid-weapon reference for all spearman sequences:

- Long straight ash-wood shaft, roughly 1.5x the figure's standing height.
- Leaf-shaped steel spearhead with a short socket, small round guard disc
  where head meets shaft, and a short red horsehair tassel tied below the
  head.
- Held with SPACED hands on every thrust (both hands on the shaft, never
  bunched); the spear is NEVER shortened, bent or foreshortened away -
  full shaft + head visible in every cell.

## Fixed registration for the pack

Same model as the accepted soldier pack: one uniform scale for the whole
pack (no per-pose normalisation), cell-centre/ground anchors, trim within
the canonical box, shared guard/down bookends enforced by alias. The
generation cells are 512x341 at density 2; the full figure plus the full
spear fits inside every cell.

## Observability landmark budget (acceptance 4)

Weapon-length measurement is only valid where the spear is FULLY observable
(unoccluded, unforeshortened); head-size comparison uses the helmet width.
Measured values land in the pack report; anything else is recorded
`unverified` and cannot establish compliance.
