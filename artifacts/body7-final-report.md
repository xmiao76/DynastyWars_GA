# BODY-7 — final re-review sweep (plan + owner objections)

Date: 2026-09-26. Scope: BODY-1..7 as approved PLUS BODY-8..13, the six
fix tasks filed from the owner's final-cast objections (feet, hands,
weapon hold, whole-cast realism). This report is the closing sweep.

## Serial sweep (one run, artifacts/run-body7-gates.ps1)

| Gate | Result |
|---|---|
| eslint | PASS (clean) |
| tsc --noEmit | PASS |
| vitest | PASS - 605/605 |
| playwright chromium (e2e) | PASS - 78/78 |
| playwright vision (sprite gate, Canvas + WebGL) | PASS - 5/5 |
| playwright selfplay | PASS - 13/13 |
| vite build | PASS |
| playwright prodbuild | PASS - 4/4 |
| boot/memory probe | recorded below |

Logs: artifacts/body7-{lint,tsc,unit,e2e,vision,selfplay,build,prodbuild,mem}.log.

## Resource report (baseline -> first sweep -> final)

| Metric | Pre-overhaul | BODY-7 sweep | Final | Delta vs baseline |
|---|---|---|---|---|
| dist | 3,805 KB / 25 | 7,889 KB / 67 | 9,964 KB / 85 | +6.2 MB art |
| boot to title | 2,118 ms | 4,208 ms | 4,085 ms | +2.0 s (17 fighter packs + horse decode+verify) |
| textures | 337 | 382 | 403 | +66 |
| decoded RGBA | ~99.8 MB | ~122.6 MB | ~128.7 MB | +28.9 MB |

## What the objections changed (BODY-8..13)

- BODY-8 hands: grip fist + finger bands over the haft at handN, body-
  matched skin; 238/238 checks (17 x 14 poses, >= 24 skin px at grip).
- BODY-9 feet: boot overlays over hems/hafts, toe caps + sole lines;
  51/51 checks (17 x standing poses, tone + luminance).
- BODY-10 weapons: Shape.mat painted materials (wood/steel/metal/cloth)
  on the SAME paths (reach + ART-14/15 silhouettes byte-stable);
  pommel kills the foot-zone butt blob; 4/4 material gates.
- BODY-11 composition: procedural sash/belt bars off painted waists in
  BOTH call paths (the mook path was caught by the test); neck +
  shoulder seam shading; 9->18 waist runs clean.
- BODY-12 mook heads: 3-expression sheets + portraits keyed to the
  body masters; catalog 14->17; 50/50 suite mirroring bosses.
- BODY-13 boss bodies: 9 masters keyed to the painted heads; catalog
  8->17; parity/seating/waist/grip/foot gates on all 17; hero/mook
  sheets regenerate byte-identical (no drift).
- Incidental root-causes along the way: both legacy unit "flakes"
  (artquality, hero-faces signature test) were vitest 5s timeouts -
  explicit 30s on the four decode-heavy tests, assertions untouched.

## Whole-cast review artifacts

- artifacts/look/body7-cast.png - ALL 18 rows (5 heroes + 3 mooks +
  horse + 9 bosses) x all 14 poses x both facings, everything live.
- artifacts/look/body-beforeafter.png - 8 paper-doll fighters x
  idle/attack/down x procedural/painted.
- artifacts/look/boss-beforeafter.png - 9 bosses x idle/attack/down x
  procedural/painted (heads + bodies now).
- artifacts/look/obs-{full,feet,grip}-*.png - objection review sheets
  (hands, feet, weapons, seams, per fighter).
- artifacts/body-cells-*.png - all 17 body packs on checkers.

## Task ledger

- BODY-1..6 DONE (owner-approved / full-green).
- BODY-8..13 DONE (full-green, sheets presented per phase).
- BODY-7: every technical criterion met and verified twice (original
  sweep + this re-review); the owner's acceptance of the final cast is
  the one open item (objections stay open per the task's own criteria).
