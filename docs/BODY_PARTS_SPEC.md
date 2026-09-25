# BODY-2 — paper-doll part specification

Pre-designed during BODY-1 (goal rounds 3-4 findings) so implementation can
start the moment the pilots are approved. All coordinates are canonical
figure units under the caller's existing transform; facing comes from the
outside sprite mirror, exactly like ART-18 heads.

## Poses (14, all must render)

idle, walk0, walk1, attack, attack2, thrust, chop, sweep, windup, recover,
jump, down, hurt, special.

## Part inventory (13 raster parts per fighter)

Painted pointing DOWN (+Y) with the pivot at top-center = joint A, plus a
rounded cap extending ~20% past each joint so rotation never opens a gap.

| # | Part | From → To | Natural len (idle) | Notes |
|---|------|-----------|--------------------|-------|
| 1 | cloth (cape) | mid-shoulder, hangs | — | Only if plan.cape; painted folds |
| 2 | upperArmF | shoulderF → elbowF | 12.37 | Far side, under torso |
| 3 | foreArmF | elbowF → handF | 12.17 | Incl. far hand |
| 4 | thighF | hipF → kneeF | 18.11 | |
| 5 | shinF | kneeF → footF | 21.10 | Incl. boot + foot |
| 6 | torso | hip → chest, skirt to hip.y+10 | 22.00 | Skirt rigid with hips |
| 7 | thighN | hipN → kneeN | 18.25 | |
| 8 | shinN | kneeN → footN | 21.21 | Incl. boot + foot |
| 9 | upperArmN | shoulderN → elbowN | 12.65 | |
| 10 | foreArmN | elbowN → handN | 11.05 | Incl. hand; grip centered on hand joint |
| 11-13 | (head layers: existing ART-18 rear/head/front, untouched) | | | |

## Kept procedural (deliberate)

- Neck (`limbPath` neck→chest, skin-matched): short, hidden under the
  painted head sheet; a raster neck would add a seam for no gain.
- Pauldron trim oval + fitted shoulder cap: small trim-colored shapes
  already matched to sleeves.
- Armor skirt: folded INTO the torso sheet (rigid with hips), not separate.
- Weapons, hands' grip point, horse: unchanged procedural.

## Draw order (slots in the existing `figureShapes` list)

[(lying) weapon] → cloth part → `rear` marker → far parts (2-5) →
torso part → near leg parts (7-8) → procedural neck → `head` marker →
procedural pauldron → near arm parts (9-10) → [beard if procedural] →
`front` marker → weapon. Raster parts are pre-shaded and never cel-shaded
over, exactly like heads; procedural shapes for replaced parts are skipped
per part (the `emptyHeadParts` pattern).

## Transform per part

`translate(A) · rotate(angle(B−A) − 90°) · scale(|AB| / naturalLen)` on the
axial (Y) axis only; lateral scale stays 1. Segment lengths vary across
poses (foreshortening up to 128% on foreArmN in recover/jump/down), so
axial stretch is mandatory, not optional. Torso needs only a lying
variant (21–23 everywhere except `down` at 13.2). Full per-pose tables:
`artifacts/body-joint-inventory.json`.

## Sheet packing + preparation (recommendation for BODY-2)

- One sheet per fighter, grid cells + `preparation.json` rects, mirroring
  the ART-18 head-cell convention (cell origin = part pivot, tight alpha
  bounds recorded).
- Same asset chain: tracked masters + provenance → shipping derivatives
  under `src/game/assets/` → Vite-hashed imports → bounded boot preload
  → signature verification → atomic per-fighter procedural fallback.
- Parity: same-pose old-vs-new mask IoU ≥ 0.75 drift bound (honest art
  scores 0.787-0.878: heroes 0.845+, the lean archer reshapes most at
  0.787; cross-identity 0.657-0.777). Precise breakage detection is the
  per-part position test (every painted part's ink centroid must sit on
  its joint segment in idle/attack/down - immune to enrichment), silent
  fallback is caught by liveness (IoU < 0.99), and readability by the
  vision sprite gate.
