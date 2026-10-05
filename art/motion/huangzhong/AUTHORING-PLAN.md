# Huang Zhong authoring plan (CMR-12A, attempt 1)

Status: 10/10 ACCEPTED + pack huangzhong-1 built (57 frames, 12.1MiB, deterministic); 20/20 spent. Next: guard measurement + acceptance-4.

## Budget (authoritative ledger: `art/motion/generation-budget.json`)

- huangzhong cap 20 (owner +3 2026-10-05), used 20 (+rider
  sheet 1/2, LAST). Global 112/200. Two whole-sheet candidates
  per sequence, unchanged (rider 1/2 left, unusable — no budget).
- Plan: 10 whole sheets = 10 requests → 10/16, 6 spares for focused
  corrections before any repair need. Repair reserve 3/3 untouched
  (shared with CMR-12B, acceptance-4 only).
- Reserve BEFORE every image call (`reserve()` + `saveLedger`);
  record prompt + ordered reference hashes + verdict in PROVENANCE.md.

## Sequence order + keep maps (hero standard, 56 frames)

walk 9 (guard + 8-cycle) → jab1/jab2/finisher 5 → jump 6
(takeoff/ascent/apex/kick/descent/landing) → fall 5 (topple through
DOWN) → getup 5 (elbow through stand) → misc 5 (hurt-recoil/
hurt-fold/grab-clamp/grab-hold/release) → special 5 (raise/coil/
draw/release/follow — release follows the arrow spawn) → rider 6
(idle/trot/mount/windup/sweep/dismount, seated, NO horse parts).
Row-major keeps unless a reviewed spare remap wins (zhaoyun/
weiyan precedent); remaps recorded with pose justification, never
by value alone.

## Core data (read 2026-10-05, not prompt text)

- HUANG_ZHONG: hp 110, walk 1.5, combo hz.*, jumpkick, special
  (cost 12, fires projectile).
- hz.jab1: 7dmg/22 reach, startup 6, active 4, recover 10.
- hz.jab2: 7dmg/24 reach, startup 6, active 4, recover 10.
- hz.finisher: 10dmg/26 reach, startup 8, active 5, recover 14.
- hz.jumpkick: 9dmg/26 reach, startup 4, active 20.
- hz.special: INERT swing (startup 4, active 0, recover 14) +
  arrow projectile at special start.
- mounted.sweep: startup 8, active 6, recover 14.

## Method (carried from weiyan 11A — the expensive lessons)

- Before the FIRST image call: render + record a legacy-bow
  weapon-spec crop from the current procedural rig (same role as
  weiyan's `weapon-spec-reference.png`); the body master shows no
  weapon, so this crop + `IDENTITY.md` §Weapon is the only weapon
  authority. Never brief from memory (weiyan v1: ten wasted sheets).
- Bracketing refs on every call: weapon authority, body master,
  portrait master, walk-guard anchor (once walk exists), previous
  accepted source for body/style continuity only.
- Rigid bow every cell: 42u recurve, hand-centred riser, BOTH nocks
  + continuous string enclosing air; no detached limbs, no missing
  string, no arrows/effects painted.
- Split/straddle rule, no-vertical rule (limbs curve in-plane;
  foreshortened/occluded blades are excluded, never waived),
  grid-constrained focused redraws only (splice, never wholesale).
- TRUE endpoint measurement (nock-to-nock direct, overlay-verified);
  unknowns never pass; ≤10% spread, ≤60° steps.
- Prefer deterministic retouch over regeneration when poses are
  right (jump/fall/rider precedent: exact, pose-preserving, no
  requests); generator ignores pixel-length targets (proven 3×).
- 16MB-first pack fit (pages ≤2048², density 2, 16MiB cap, no
  presumed exception); shared guard/down bookends; uniform
  per-sheet scale with two-proxy guard verification.
