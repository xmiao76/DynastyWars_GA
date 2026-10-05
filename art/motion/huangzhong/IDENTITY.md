# Huang Zhong identity lock (CMR-12A, attempt 1)

Inspected 2026-10-05, before any image request. No image request spent (0/16).

## Masters (only identity authorities)

- Body: `art/fighter-bodies/huangzhong-body-master.jpg`, sha `338d9c9e…`,
  832×1248. Elderly veteran general, gold-mustard cross-collar robe
  with embroidered trim, bronze beast pauldrons, mustard headband
  with trailing tails + grey topknot, LONG flowing white-grey beard
  to the waist, weathered tan skin, dark sash, brown boots. Neutral
  stance, arms slightly out, no weapon drawn.
- Portrait: `art/hero-faces/huangzhong-portrait-master.png`, sha
  `4dcac826…`, 1145×1374. Severe aged face: heavy white brows, deep
  wrinkles, long white beard + mustache, mustard headband, bronze
  dragon pauldron. Matches `figures.ts` exactly: headgear `band`,
  beard `long` grey `0xb0b0b0`, face `aged`, skin `0xb59170`.
- No other identity sources. Existing heads art is NOT referenced.

## Build / camera / light (locked for every sheet)

- Stocky veteran build, shorter than Guan Yu; upright Confucian-general
  bearing, never youthful or slender.
- Costume: gold-mustard robe (`0xb8860b` body, `0xe0c060` trim),
  dark-olive gear (`0x6a5a1a`), bronze pauldrons, dark sash,
  brown boots. No cape, no helmet, no armor skirt changes.
- Headgear: mustard headband with knot tails + grey topknot, always;
  white waist-length beard + mustache, always (it affects bbox
  heights and silhouette — consistent length matters).
- Camera: strict side view facing right; upper-left warm key light;
  painted semi-realism; uniform figure scale across sheets (guard
  anchor verifies).

## Weapon (from the actual rig files, NOT memory or the masters)

The body master draws NO weapon, so the rig is the sole authority
(weiyan v1 lesson: never brief a weapon from memory):

- `src/game/art/figures.ts` `WEAPONS.bow`: length **42u**, haft 4.0,
  head `'bow'`, NO tassel. A compact recurve — less than two thirds
  of the dao haft. Brief lengths in px must scale from this, not
  from any polearm comparator.
- `src/game/art/weapons.ts` `traceBow`: hand-centred riser (grip at
  the bow's middle), limbs curving both ways, bowstring as a
  continuous outlined closed strip nock-to-nock.
- `docs/WEAPON_ART.md`: slimmer recurve; string + limbs must enclose
  visible air (topology check — a disconnected string is a defect).
- Melee use: bow-as-staff thrust → chop → sweep (spec; reaches
  22–26, short). Special: the swing is INERT (startup 4, active 0,
  recover 14); the arrow projectile spawns at special start and the
  visible release follows the spawn. Paint NO arrow, NO string-draw
  effects, NO projectiles (zero-effects-paint rule, zhaoyun
  precedent).
- Rigid landmarks per drawing: riser grip point, both nocks, string
  line enclosing air. Acceptance adapts the polearm method:
  nock-to-nock span + string continuity instead of pommel-to-tip.
