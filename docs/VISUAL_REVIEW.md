# Visual review: the art-director loop for every UI screen

The owner asked on 2026-09-26 for the loop to work as if a human were
guiding visual and art design. That means reviewing every screen, the HUD,
the overlays, and the characters' look and movement. Each detailed issue
gets a root cause. The review produces the next batch of tasks. The loop
repeats until every screen looks great.

This document holds the standing procedure. `docs/UI_REVIEW_LEDGER.md`
holds the dated results.

The review sits beside the existing gates and replaces none of them:

- `npm run vision` measures pixels and sprite metrics, and it must still pass.
- `docs/CHARACTER_REVIEW.md` is the per-movement character rubric, and it
  still governs BODY tasks.

This review covers the whole game as a player sees it.

## Why the older loop missed UI defects

- The vision gate is frame-global and metric-based. It proves that a screen
  is not empty, flat or broken. It cannot say whether a screen is ugly,
  cramped, misaligned or hard to read.
- The old instruction was "review screenshots at gameplay size". It named no
  screens, no rubric, no severity and no root-cause step. So a review could
  pass on "the flag is green". Nothing tied a seen defect to a filed task.
- Only seven core screens were captured. The intro cards, banners, overlays,
  the phone and WebGL builds, co-op, mounted play and the nine stage
  backdrops were never looked at together.
- Visual defects filed as "proactive" ideas were capped at one per pass. A
  real human review produces a batch of findings.
- The same iteration that implemented a fix graded it. No later pass
  re-checked it.

## 1. Capture (auto-test)

```
npm run review:capture
```

This runs `UI_REVIEW=1 playwright test --project=chromium e2e/ui-review.spec.ts`,
and takes about 3–5 minutes. It uses the GA browser port 5177, so it must
not run concurrently with another suite. It drives the real game through
the debug bridge. Each run renames the previous `artifacts/review/latest/`
to `artifacts/review/previous/`, which makes every capture a before/after
pair. The run writes:

| Output | Contents |
| --- | --- |
| `screens/<id>.png` | Every screen at gameplay size, 960x540 (the logical 480x270 at 2x). |
| `crops/<id>--<region>.png` | HUD plate, centre column, boss rail, banner, intro card and the player's actor, upscaled for detail. |
| `sheet-flow.png`, `sheet-stages.png`, `sheet-platform.png` | Contact sheets, for cross-screen consistency and quick regression glances. |
| `inventory/<id>.json` | The live scene graph of each capture. Records type, name, texture key, text, font, size, colour, logical bounds, depth, alpha and visibility. This maps a pixel to the object and the line that made it. |
| `manifest.json` | Screen id, file, state (scene, stage, hero, phase, hp), review focus, crops, renderer, viewport. Also holds automatic layout suspects and the capture timestamp and commit. |

Layout suspects are hints, not a gate. They cover text below 8 logical px,
visible objects extending off-screen, overlapping visible text boxes, and
fonts per screen. A suspect still needs eyes to become a finding.

The screens are listed by id in the manifest. Coverage is:

- **Menus:** title; select with the cursor on each of the five heroes.
- **Stage 1 flow:**
  - entry banner and intro card;
  - idle, live combat, low HP;
  - GO cue and pause;
  - boss WARNING banner and boss fight with rail;
  - CONTINUE? overlay, stage-clear beat, result.
- **End screens:** game over; the final result and game complete.
- **Co-op:** two plates; mounted horse play on stage 2.
- **All nine stages:** each stage's banner crop, intro-card crop and play frame.
- **Phone, touch device:** portrait title, select and game, plus landscape game.
- **WebGL, the shipped renderer:** title, select, combat, boss and result.

Characters' motion comes from the BODY generators:

- `npx vitest run test/game/movesheets.test.ts` produces `artifacts/look/moves/`.
- `MOTION_REVIEW=1 npx playwright test --project=chromium e2e/motion-review.spec.ts`
  produces `artifacts/look/motion/<hero>-sheet.png` and `.webm`.

Include them in a full review; do not duplicate them here.

## 2. Review (auto-human review)

Review like an art director who will put their name on the game. Do not
review like a pixel checker. Use the image tool on the actual PNGs. Never
review from the manifest or inventory alone.

1. **Blind first look.** Before reading the task or the code, open the
   contact sheets. Then open each screen at gameplay size and write the
   5-second impression a player would have. Note the focal point, whether it
   looks finished and what jumps out. Writing it first stops confirmation
   bias.
2. **Detail pass.** Open the crops and walk every dimension of the rubric
   below. Every verdict must cite at least one concrete visual detail from
   that image, such as "the 7px META row is a grey smear on the phone" or
   "STAGE 3 plaque text sits 2px low". "Looks good" is not a verdict. A
   review that names nothing specific did not happen.
3. **Compare.** Check each screen against its neighbours in the same flow
   and across stages. Human eyes catch inconsistency before they catch
   absolute flaws. Look at the menu vs in-game typography, the three overlay
   cards against each other, and whether each of the nine intro cards fits
   its text.
4. **Phone and WebGL.** Judge text at the CSS size a phone actually shows.
   At 412px wide the whole game renders at about 0.86x logical, so a 7px
   label is about 6 CSS px. Judge WebGL frames against their canvas twins.
5. **Motion.** When the change or the area touches movement or transitions,
   open the motion sheets or clips. Judge sequences of frames, not one still.

### Rubric: score every screen 1–5 on each dimension

| # | Dimension | What a human checks |
| --- | --- | --- |
| R1 | First impression | Does it look like a finished commercial arcade screen? Is there one clear focal point? Nothing looks placeholder. |
| R2 | Layout & alignment | Margins, centring and a consistent grid. Nothing clipped or off-screen, no accidental overlaps, balanced negative space. |
| R3 | Typography | Legible at gameplay size and on the phone. Consistent families, sizes and weights, with a clear hierarchy. English and 中文 pairs set together cleanly. No tofu or fallback fonts, no text overflowing its panel. |
| R4 | Colour & contrast | Stays within the THEME palette. Text contrast is enough on its real background, with no muddy or flat areas. Light comes from the upper left, per `BODY_STYLE_GUIDE.md`. |
| R5 | Art consistency | One style everywhere: restrained painted semi-realism, the same outline weight and detail density. No vector-looking or mismatched-resolution assets. Scale is consistent between characters, props, panels and backdrop. |
| R6 | Characters in scene | Appearance per `CHARACTER_REVIEW.md` (anatomy, hands, weapon, proportion). Characters read against the backdrop and are grounded, with feet on the ground and shadows. Facing and z-order are sane. |
| R7 | Motion & feedback | Tweens, banners, hits and state changes feel deliberate. Nothing pops, jitters, lingers or arrives too fast to read. |
| R8 | Information & usability | HP, lives, score, wave and what to press are obvious. Prompts match the device (keyboard, touch or gamepad). Pause, continue and low HP read instantly. |
| R9 | Platform | Phone portrait and landscape work: controls do not cover the action and text stays readable. WebGL matches canvas. |

A dimension that does not apply to a screen is marked `-`. A screen's score
is its lowest applicable dimension, because a player notices the worst thing.

### Severity

- **S1 Broken:** missing, wrong or unreadable content, or a clipped key
  readout. Also a wrong prompt for the device, a renderer parity break, or a
  broken character (missing limb, detached hand).
- **S2 Obvious:** a player notices it within the first minute. Examples are
  misalignment, overlap, an inconsistent style, poor contrast, an awkward
  pose, or jarring or unreadably fast motion.
- **S3 Polish:** visible on a close look. Examples are spacing a few px off,
  a slight palette drift, jaggies or an uneven stroke.
- **S4 Taste or idea:** not a defect. It may become the single proactive
  proposal (AGENTS.md rule 10) or an owner question.

## 3. Root cause (before any task is written)

Filing symptoms produces whack-a-mole. A human lead asks why before
assigning work.

1. Locate the object in `inventory/<id>.json` by name, texture key or text,
   and note its bounds, font, depth and alpha.
2. Find the line that creates it. Search the texture key, object name or
   text in `src/game`. Record `file:line`.
3. State the mechanism in one sentence. For example: "the plate NAME uses
   `liveStyle(9)` but the META row uses 7px sans-serif, so the plate mixes
   two families."
4. When unsure, confirm with a second state: another hero, stage, device or
   renderer. A defect seen once may be a capture artifact.
5. Find every screen sharing the cause. One cause is one task, listing all
   the screens it affects.

Classify each root cause into one of these categories:

| Category | Typical home |
| --- | --- |
| ASSET | Painter or baked texture: `src/game/art/*`, `scripts/prepare-*.mjs`, `src/game/assets/` |
| LAYOUT | Geometry constants and scene coordinates: `src/game/ui/hudlayout.ts`, `roster.ts`, scene `create()` |
| TYPE | Text style and fonts: `src/game/ui/theme.ts` `liveStyle`, `display.ts`, `type.ts` |
| DEPTH | z-order and depth constants, scene stacking |
| COLOUR | `THEME` palette, tints, alpha, vignette |
| TIMING | Tween durations, holds, delays, and wall-clock vs tick |
| STATE | Logic shows the wrong content: visibility conditions, prompt text, device detection |
| RENDERER | Canvas vs WebGL, `RENDER_SCALE`, filtering, text resolution |
| PLATFORM | Viewport and FIT scaling, touch layout |
| HARNESS | Exists only in the capture, not in real play. Fix the harness, never the game. |

## 4. Estimate and batch (the human-like planning step)

A lead turns the findings into sized, ordered work:

- Group findings by root cause, not by screen.
- Estimate each group:
  - Size: S (one constant or style), M (one component or painter), or
    L (a cross-cutting restyle).
  - Risk: which gates and specs it can disturb.
  - Visual gain: which screen scores rise.
- Split an L into tasks that each fit ONE consumer iteration. Order by
  severity, then by visual gain per size.
- File a batch of at most SIX `UIR-n` tasks per producer pass (defined
  below). Unfiled open findings stay `open` in the ledger for the next pass.
  This is how a human review works: a full list is found, and a batch is
  worked.
- Visual-review findings rated S1–S3, with screenshot evidence and a located
  root cause, are DEFECTS. They are filed under this batch rule, not under
  AGENTS.md rule 10. S4 ideas stay under rule 10 (one proactive proposal per
  pass).
- Direction-level questions are owner decisions, not tasks. Examples are
  changing the art style, adding or removing a screen, or rebalancing
  DIFF-1. Record them under "Owner questions" in the ledger.

Use this task template in TASKS.md Enhancements, with the next free `UIR-n`:

```
### UIR-n - <imperative title>
- Status: TODO
- Source: UI review <date>, findings V-<n>[, V-<m>] (<severity>)
- Evidence: artifacts/review/latest/<screen or crop> - what a player sees.
- Root cause: <CATEGORY> - <file:line>: <one-sentence mechanism>.
- Affected screens: <ids from the manifest>
- Requirement: <the bounded change>
- Acceptance criteria:
  1. <objective, testable check: a spec assertion, a layout constant, a unit test>
  2. After `npm run review:capture`, the affected screens are re-reviewed
     at gameplay size (and phone/WebGL where relevant). Each listed finding
     is judged fixed, citing the after-image detail. Previous and latest
     are compared.
  3. The contact sheets show no regression elsewhere; `npm run vision`
     and relevant specs are green.
- Non-goals: <what not to touch>
```

## 5. Fix and verify (consumer)

For any UI, art or HUD task, the consumer (`.loop/loop.md`) does five things:

1. Captures before changing code. The capture becomes `previous` on the
   next run.
2. Implements the change and adds its objective test.
3. Recaptures and reviews the affected screens and crops against `previous`,
   per section 2. It glances over the contact sheets for regressions.
4. Updates each listed finding in the ledger to `fixed <commit> (self-check)`,
   citing the after-image detail. The consumer may APPEND newly noticed
   findings as `open` observations, but must not file tasks for them.
5. Never marks the task DONE while its own after-review still shows the
   defect. "Playable but ugly" is not done.

## 6. Independent verification (producer)

The implementer never has the last word on their own work. On the next
producer review, each `fixed` finding is re-inspected on fresh captures,
and the reviewer marks it one of two ways:

- `verified <date>`: the fix is confirmed.
- `reopened <date>`: a new finding is created that references the old one,
  plus the reason.

A finding reopened twice becomes an owner question.

## 7. Cadence and termination

- **Full review:** every producer pass runs sections 1–4. When the queue
  has TODO work, `.loop/continue.md` still starts a producer pass that runs
  only the visual review once it is due, before continuing the queue.
- **When a review is due:** a review is due when at least 4 commits touching
  `src/game` exist since the ledger's "Last full review" commit, checked
  with `git rev-list --count <commit>..HEAD -- src/game`, or when the ledger
  has no full review at all.
- **Deep-dive rotation:** every full review covers all contact sheets. In
  detail it covers at least one rotation area, choosing the one
  least-recently deep-reviewed in the ledger's coverage table:
  - menus;
  - HUD & overlays;
  - stage flow screens;
  - all nine stages;
  - characters (movesheets and motion);
  - phone;
  - WebGL.
  The first review, and any review after an owner note, covers everything.
- **Scoreboard:** the ledger keeps the latest R1–R9 score per screen.
- **Done:** the UI is done when two consecutive full reviews score every
  screen at 4 or above, with no open S1 or S2 findings. The producer then
  reports that in PROGRESS.md and asks the owner for sign-off. Reviews
  continue on cadence to catch regressions.

## 8. Calibrating against the owner

The owner's eye is ground truth. Owner notes can go in the ledger's "Owner
notes" section or in `artifacts/vision/UX_REVIEW.md`. When the owner flags
something a review passed, three things happen:

1. It is filed as a finding.
2. A line is added to the ledger's "Known blind spots" checklist. Every
   later review explicitly checks that list.
3. The capture gains a screen or crop if the defect was not visible in any
   capture.

The loop learns what this owner cares about instead of repeating the miss.
