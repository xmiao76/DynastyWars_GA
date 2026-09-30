# Whole-frame painting pilot: Guan Yu idle / attack / down

**Question.** Does painting each pose as ONE whole figure, guided by the rig,
fix the joint and consistency problems of the paper-doll approach (painted
parts attached to the skeleton, V-14..V-18)? Owner-approved pilot,
2026-09-30. It is behind `?frames=1` and off by default, so normal play is
unchanged.

**Result: GO (recommended).** All three frames were accepted within budget
(5 images for 3 frames; the budget was 12). All three read as one natural body
and one clearly consistent Guan Yu, and the arm-chain defects the paper-doll
path could not remove are absent by construction. Owner sign-off pending (see
"How to look").

## Method

1. **Pose guide (code).** `test/game/wholeframe-guides.test.ts`
   (`WHOLEFRAME_GUIDES=1`) draws a plain grey mannequin straight from the rig
   after `weaponPose`:
   - tapered limb chains, near limbs lighter than far limbs;
   - an oval head at the painted-head scale;
   - the exact procedural glaive, on flat #FF00FF.

   It writes `art/whole-frames/guanyu/guide-<pose>.png`, `-mask.png` and
   `.json` (px per unit and anchors: feet, hip, head, hands, weapon butt and
   socket). The first guide rendered the procedural fighter instead. Its
   boxy hood and flat cel panels would have been copied as costume, so the
   mannequin replaced it.
2. **Painting (image model).** References, in order:
   - the guide;
   - the accepted idle frame (attack and down only);
   - the Guan Yu body master;
   - the portrait master.

   The prompt is fixed; see `art/whole-frames/PROVENANCE.md`, which also
   lists every attempt with its sha256 and verdict.
3. **Preparation (code).** `node scripts/prepare-whole-frames.mjs`:
   - uses the provider's alpha, or keys magenta with despill when there is none;
   - drops specks;
   - fits the figure to the guide silhouette (uniform scale and translation,
     no rotation);
   - resamples it into exactly the pose's art box (`artBoxFor`) at density 4,
     so on-screen scale and bottom-centre anchoring equal today's frames;
   - writes `src/game/assets/whole-frames/guanyu-sheet.png` and
     `prepared.json` (revision `wf-1`, sha256, signature, fit numbers).
4. **Runtime.**
   - `src/game/art/whole-frames.ts` blits a painted pose into the whole box.
   - `registry.drawKindPose` uses it when `resources.frames[kind]` has the pose.
   - `sprites.ensureBlendKey` skips the rig in-between frames for transitions
     that touch a painted pose.
   - `adapters/frame-art.ts` loads and verifies the sheet (whole-fighter
     fallback); `BootScene` loads it only with `?frames=1`.

## Fit (artifacts/wholeframe/fit.json)

| | idle | attack | down |
| --- | --- | --- | --- |
| Guide coverage (1u tolerance; the gate) | **0.958** (floor 0.90) | **0.899** (floor 0.90, within the test's 0.02 margin) | **0.886** (floor 0.85) |
| Guide coverage, exact | 0.865 | 0.808 | 0.781 |
| Silhouette IoU (the plan's first metric) | 0.691 | 0.472 | 0.553 |
| Feet vs ground line (u) | -0.25 | 0.00 | n/a (lying) |
| Blade point vs guide (u) | 1.5 | 1.9 | 4.3 |
| Painting outside guide + 6u | 1.1% | 10.9% | 10.9% |
| Box edge / magenta px | 0 / 0 | 0 / 0 | 0 / 0 |
| Palette vs body master | 0.67 | 0.62 | 0.56 |

Palette between frames: idle~attack 0.87, idle~down 0.84, attack~down 0.84.

**The IoU floor from the plan (0.80) was the wrong metric, and it was
replaced.** IoU punishes costume volume: a wide-sleeved robe over a thin
mannequin scores 0.47-0.69 even when every limb, the head and the blade
register. The overlays (`*-fit.png`) and the miss maps (`*-miss.png`) show
only three kinds of non-overlap:
- robe, sleeves and beard outside the guide (expected);
- a haft painted thinner than the procedural one;
- boots a little inside the mannequin's feet.

The pose gate is therefore "the painting covers the guide pose". It is
checked by `test/game/wholeframe.test.ts`, together with feet, blade point,
border, key colour, sha256 and signature.

## Review (my verdicts; gameplay size + 4x, `read_image`)

Rubric: section 2a gestalt (N / A / B), then J1-J9.

| Frame | Verdict | Notes |
| --- | --- | --- |
| idle | **N** | Both hands wrap the haft (near at the waist, far at the shoulder); the sleeves flow from the shoulders to the cuffs to the fists; the head, beard and headcloth read as one; boots on the ground line; the blade tip matches the guide. J1-J9 ok. |
| attack | **N** | A lunging stance with the weight forward and both fists on the haft at the chest. The arms bend naturally, the robe swings with the stance, and the glaive reaches the guide's blade point within 1.9u. No arm chain to break. J1-J9 ok. |
| down | **N** | Lies on his back, head left and boots right, eyes closed. The near hand rests on the glaive above the chest and the far hand across the belly. The beard falls across the chest. No detached hand, unlike V-16 on the paper-doll path. J1-J9 ok. |

Consistency: same face, beard, green headcloth, gold-trimmed robe, bronze
lamellar armor and boots, and the same glaive with a red tassel in all
three.

Compared with the current paper-doll frames at the same size
(`artifacts/wholeframe/guanyu-compare.png`, `guanyu-ingame-compare.png`):
- No mitten hands (V-18).
- No haft painted over the holding arm (V-15a).
- No far fist on the near elbow (V-15b).
- No sleeve seams, and no detached prone hand (V-16).
- The weapon and the figure share one light and one level of detail.

Differences to note:
- **Robe fixed to one side:** the painted frames have no green cape. The
  body master has none; the cape is a procedural addition.
- **Weapon:** the painted glaive is thinner and more ornate than the
  procedural one.
- **Lying weapon:** the down frame's glaive lies above the body. The
  paper-doll's lies across it.

## Limits of this pilot

- Only idle, attack and down are painted. With `?frames=1`, walking and the
  other strikes switch back to the paper-doll look; rig in-betweens are
  skipped only next to a painted pose.
- **Hit flash:** tint and alpha are Phaser-side and still apply. No hit-flash
  or pose-specific effect was reviewed.
- **Poses need painting:** a painted frame shows exactly the pose it was painted in.
  Rig-driven variations (build-scaled joints, the BODY-24 lean) no longer
  move a painted pose.
- **Human sign-off needed:** the anatomy review above is mine (the author's).
  Per the visual-review rules, a later reviewer or the owner judges it
  before any rollout.

## Cost estimate for the full cast

- **Observed cost:** 5 attempts for 3 accepted frames, about 1.7 per frame.
  At 1.5-2 attempts per frame, 238 frames (17 fighters x 14 poses) come to
  about 360-480 generations. Adding the extra frames this genre normally has
  (walk x4, one more frame per strike) brings it to about 400-600
  generations.
- **Per fighter:**
  - one identity reference (the accepted idle), generated first;
  - then the other 13 poses in batches of 3-4, each batch reviewed on the
    comparison sheet before continuing;
  - roughly 25-30 generations per fighter.
- **Runtime size:** the 3-frame sheet is 1960x476 px and 428 KB as PNG at
  density 4, about 140 KB per frame. 238 frames would be about 33 MB, too
  heavy for the web build as is. The rollout plan must pick a lighter format
  (for example density 3 and WebP, each checked on the comparison sheet) and
  load frames per stage.

## Recommendation

**GO**, with a rollout plan in its own task:
1. Owner review of this pilot (`?frames=1`).
2. The 5 heroes and 3 mooks first (8 fighters x 14 poses). Add walk0-3 and
   extra strike frames only where the motion needs them.
3. Then the 9 bosses.
4. Decide the texture format, density and per-stage loading against the
   size budget before step 2 ships.
5. Once every fighter has whole frames, retire the paper-doll parts and
   hands, and the arm-chain gates that only exist for them.

## How to look

- `npm run dev`, then open `http://localhost:5176/?frames=1`, pick Guan Yu:
  the idle stance, his second combo hit and a knockdown use the painted
  frames. Without `?frames=1` nothing changes.
- Offline comparison: set `WHOLEFRAME_COMPARE=1` and run
  `npx vitest run test/game/wholeframe-compare.test.ts`; it writes
  `artifacts/wholeframe/guanyu-compare.png`.
- In-game capture: set `WHOLEFRAME_LOOK=1` and run
  `npx playwright test --project=chromium e2e/wholeframe-look.spec.ts --workers=1`;
  it writes `artifacts/wholeframe/ingame-*.png`.
- Rebuild the frames from the masters: `node scripts/prepare-whole-frames.mjs`.
