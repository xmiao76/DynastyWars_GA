# Wei Spearman — authoring plan (CMR-07A)

## Exact core-data manifest (read at implementation time, 2026-10-02)

From `src/core/enemies.ts` (`spearman`) and `src/core/attacks.ts`
(`spear.thrust`); these numbers drive every clip - never prompt-text
approximations:

- Fighter: id `spearman`, role mook, name 槍兵 (Wei Spearman).
- maxHp 32, speed 0.7, thinkInterval 50, hitstunTicks **14**.
- `spear.thrust`: damage 10, reach 36, arc 8, **startup 20 / active 5 /
  recover 26** (duration 51), knockback 3, knockdown **true**.

Capability coverage (CMR-07B's clip table will bind): idle, approach/
retreat/walk cycle, stop, spear.thrust, 14-tick hitstun, upright held +
escape, fall/impact/down/getup, throw flight/impact, dying/dead. No
hero-only jump/mounted/special (no reachable data).

## Sheet plan (5 whole-sheet candidates, budget 5 of 8)

All sheets: 3x3 grid, 1536x1024 (cells 512x341), same scale/camera/ground
line, transparent background, no glow/shadow/text/panels/effects, full
figure + full spear inside every cell, painted semi-realism, upper-left
key light, 3/4 front-right. Ordered references per request: `[body
master, portrait master]` (hashes in IDENTITY.md).

1. **locomotion** - idle guard (spear upright at the side), walk/contact,
   walk/pass, walk far-leg, walk second pass, stop, retreat 1, retreat 2,
   idle bookend (cell 9 = cell 1, shared guard bookend).
2. **thrust** - guard, draw-back/windup, thrust startup, active 1
   (full extension), active 2 (held extension), recover 1-3, guard
   bookend. Both hands SPACED on the shaft in every thrust drawing; the
   spear at full length, never shortened or foreshortened.
3. **hitstun-held** - guard, hitstun recoil/fold/stagger (14 ticks),
   held upright x2 (arms pinned, spear still held), escape shove/reset,
   guard bookend.
4. **fall-thrown** - topple, airborne, impact, DOWN bookend, thrown tumble
   x2 (rotated both ways), side impacts x2, DOWN bookend (cell 9 = cell 4).
5. **getup-death** - elbow push-up, kneel, crouch, DOWN bookend (shared
   with the fall sheet), fatal jolt, knee collapse, crumple, dead on
   side (spear resting beside the hand), guard bookend.

3 requests remain after the five candidates, reserved for targeted
repairs / second candidates during preparation and review.

## Review + budget discipline (mandatory, learned from CMR-06A)

- Reserve in the generation ledger BEFORE every generation call; the
  ledger (`art/motion/generation-budget.json`) is authoritative; the
  spearman allowance is 8, shared across CMR-07A/CMR-07B.
- Review each sheet (full-figure, 4x-equivalent, and neighbouring poses)
  BEFORE requesting the next: reject drift, extra limbs, forked spearheads,
  mitten hands, clipped finial/boots/blade, inconsistent spear length.
- FINGERPRINT-VERIFIED READS ONLY: before trusting any preview, check it
  against a mechanical fingerprint of the requested file (dimensions,
  aspect, palette/alpha share). The DSH image-association bug serves wrong
  pixels intermittently with correct metadata; on mismatch, discard and
  re-read (correct reads occur).
- Mechanical grid validation per sheet (9 figures / 9 cells / no
  sheet-edge cuts) before the visual verdict.
- Preparation reuses the accepted pipeline verbatim: `prepare-soldier.mjs`
  pattern (per-sheet registration: one uniform scale + cell-centre/ground
  anchors, shared bookends by alias, trim in the box), deterministic
  double-run, page-pixel regression guard, budget caps unchanged.
- Landmark protocol: measure head-size and fully-observable weapon-length
  spreads (<=10%); occluded/foreshortened/unknown stays unverified and
  cannot pass. The manual landmark review sheets (head/sword comparison at
  one scale with rulers) are the fallback the contract endorses.
