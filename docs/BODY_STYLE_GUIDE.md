# BODY-1 — paper-doll body style guide

## Authority and limits

Owner approved paper-doll raster bodies matching the ART-18 semi-realistic
painted heads (2026-09-24). Scope: 5 heroes + 3 mooks + horse (BODY-3/4/5);
boss bodies stay procedural (BODY-6 heads only). Original artwork only; no
copied Capcom sprites, TV actors, or modern costumes.

## Shared art direction

Bodies are painted to sit under ART-18 heads without a visible join:

- Same brushwork and contrast range as the heads: restrained semi-realism,
  light from upper left, no cel-band edges, no outline heavier than the
  heads' own ink.
- Skin matches each fighter's established complexion (`SKIN_*` for heroes,
  `ENEMY_FIGURES` skin for mooks, horse coat 0x8a5432) within half a shade
  at the neck, wrists and any bare limb — the neck seam is the first thing
  the review checks.
- Armor, robe and trim colors reuse `HERO_FIGURES` / `ENEMY_FIGURES`
  body/trim values, so select cards, HUD accents and figures keep agreeing.
- Muscle reads through cloth by shading, not by anatomy lines; cloth shows
  fold shadows at elbows, waist and knees; armor shows plate edges and
  rivets, never chrome mirror.
- Hands are mitten-plus-thumb at gameplay size with a thumb crease and two
  finger separations; the weapon grip must stay registered to the hand
  center in every strike pose.

## Joint conventions (what makes paper-doll believable)

- Every limb part carries a rounded cap extending ~20% past its joint
  center, so rotation never opens a gap; overlap order is fixed per side
  (far limbs under torso, near limbs over).
- Shoulders and hips are painted as part of the TORSO with socket shading;
  limb parts begin inside the socket, never edge-to-edge with it.
- Elbows and knees bend one way; the inside of the bend gets a compression
  fold, the outside stays smooth.
- Capes hang from the shoulders as one cloth part with painted folds; they
  never cover the head or the weapon hand.

## Per-hero body notes

- Guan Yu (TALL): long green robe with skirt split for the riding pose;
  gold trim at collar and cuffs; arms mostly sleeved, hands weathered.
- Zhang Fei (HEAVY): bare massive arms, dark ruddy skin; short dark vest,
  rope belt; legs thick, stance wide.
- Zhao Yun (LEAN): silver-blue plate over blue cloth; red collar accent;
  fair skin at neck and hands only; helmet strap meets the jaw cleanly.
- Huang Zhong (VETERAN): aged neck and hands (liver spots restrained);
  ochre robe, grey-white hair visible at the temples under the band.
- Wei Yan (SOLID): purple robe with light trim; date-red neck continuity
  with the head (the ART-18 complexion choice extends below the jaw);
  turban tails fall behind the shoulders.

## Mook bodies

- One shared part geometry; per-kind painted armor variants: Wei soldier
  (red-brown lamellar), spearman (blue-grey mail), archer (green cloth +
  leather). Heads stay procedural vector — necks recolored to the torso
  skin so the join reads as one fighter.

## Horse

- Full-frame painted horse per distinct pose in the 112x76 box: bay coat,
  black mane/tail, gold-tacked saddle tack matching HORSE_PLAN; legs in
  the same stride positions as the procedural frames so riders seat
  identically. Procedural fallback retained.
