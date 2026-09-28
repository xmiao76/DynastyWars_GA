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

### Why the first art-director review still missed the arms (owner catch, 2026-09-26)

The owner saw at once that every fighter's arm placement, shoulder, wrist and
hand-to-weapon joins look wrong. The 2026-09-26 review scored nothing about it.
The causes are in the process:

- **Out of scope by ownership.** The review marked characters "BODY track
  owns it" and never opened a character sheet. The BODY track itself reviewed
  shape, not joins. A defect that no review owns is never seen.
- **Wrong zoom.** Actors are about 55 logical px tall, and the hero crop was a
  2x frame with a crate over the legs. Joins are 2-4 px features there.
- **Wrong questions.** R6 said "anatomy, hands, weapon", which is one word each.
  A human checks a list of joins: does the sleeve meet the shoulder, the cuff
  the wrist, the fist the haft?
- **Accepted metrics over eyes.** Earlier character reviews DISMISSED "floating
  fist" and "detached off-hand" notes because `gripDist` was 0 or the hand
  overlapped the forearm. A geometric overlap is not a visual join. What
  counts is what the pixels show.
- **Blind to the house style.** Every pass compared the art only with the last
  pass. None asked whether the cream mitten hands, the flat haft over a painted
  sleeve, or a cuff that ends in mid-air ever looked right. Once an error is
  everywhere, it reads as the house style.
- **Arm-zoom windows cropped hands out.** The old movesheet window is
  chest-relative, so extended hands leave the frame and cannot be judged.

### Why the anatomy pass still missed broken arm chains (owner catch, 2026-09-28)

After the section 2a pass existed, UIR-12 to UIR-15 were marked `verified`
and every fighter's anatomy row read `ok`. The owner still saw arms that do
not connect from shoulder to upper arm, forearm, hand and weapon. The
process let this through in eight ways:

- **Self-grading.** The fixer wrote `fixed <commit> (self-check)`, and the
  next pass accepted that label instead of re-judging fresh pixels. Now the
  fixer writes `fixed <commit> (unverified)`, and only a LATER producer pass
  may write `verified`, on a fresh capture plus the before/after pair sheet.
- **Delegated review of labelled crops.** Subagents judged crops that came
  with the fixer's claim of what was fixed. A reviewer now gets the raw sheets
  and this rubric only, never the fix description.
- **`ok` with no evidence.** A table cell said `ok` without naming what was
  looked at. Every verdict now cites a sheet tile or crop; an uncited verdict
  is invalid.
- **Verdicts per fighter, not per move.** One `ok` covered 14 moves. The
  grid now has one verdict per fighter PER MOVE.
- **Five of fourteen moves.** Idle, attack, thrust, windup and special were
  checked; walk, chop, sweep, recover, jump, hurt, attack2 and down were not.
  All 14 are now checked.
- **Details before the gestalt.** The joins checklist came first, so a
  window that looks wrong as a whole could pass join by join. The first
  judgement is now one word per window: natural, awkward or broken.
- **The skeleton was trusted over the paint.** The x-ray shows the rig
  connected even where the painted cells leave a gap or the weapon covers the
  arm. The clean sheet is judged first; the x-ray and the ID map only locate
  causes.
- **Metrics blind to the defect.** Before/after checks measured seams and
  edge steps, not whether the arm's own paint crosses every section of the
  chain, what covers it, or whether cells overlap at the elbow and the cuff.
  The arm-chain detector (`test/game/arm-chain-lib.ts`) measures exactly
  those, and the pair sheets put before and after in the same window.

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
| `anatomy/<id>.png`, `anatomy/<id>-xray.png` | Every fighter in every movement, at 4x in windows centred on the arm chain. One is the clean art; the other is the art dimmed with the skeleton, joint markers and weapon axis on top (section 2a). Written by `test/game/anatomy-review.test.ts` as the second capture step. |

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
6. **Characters: the anatomy pass (section 2a).** It is mandatory in every
   full review, whoever owns the character code. Owning a fix does not exempt
   an area from being looked at.

### 2a. Anatomy pass: look at a fighter the way a figure-drawing teacher would

Material, one set per fighter, every movement, at 4x in windows centred on
the arm chain (`npm run review:capture` writes them under `anatomy/`):

- `<id>.png`: the clean sheet, exactly what the game draws.
- `<id>-xray.png`: the same art dimmed, with the skeleton on top (shoulder
  `o`, elbow `+`, hand `x`, far arm cyan, near arm yellow, weapon axis
  magenta).
- `<id>-ids.png`: the same windows as an ID map, with every part in a flat
  colour (legend at the bottom). Near arm warm (yellow upper, orange fore),
  far arm cool (cyan upper, blue fore), weapon white, beard brown, torso
  grey. It shows which part is on top at every pixel.
- `<id>-pair.png`: the previous capture above the latest, same windows. It
  exists when `artifacts/review/previous` has anatomy sheets.
- `suspects.json` and `cells/<id>-<move>.png`: detector hints with 6x
  plain + ID crops. Gap samples are ringed (red near, cyan far).

The standard is what a figure-drawing teacher expects: **every chain
shoulder -> upper arm -> elbow -> forearm -> wrist/cuff -> hand -> grip ->
haft is connected.** The INNER side of each arm (toward the torso or the
weapon) must be continuous. The outer contour may be covered by a
legitimate occluder: the beard, the head, a pauldron, or the near hand.

1. **Gestalt first, per move (all 14).** Open the clean sheet only. Give
   every window one verdict: **N** natural, **A** awkward (reads as a body
   but something is off), or **B** broken (a part is missing, detached,
   cut or pasted on). Do not open the x-ray, ID map or suspects yet.
2. **Locate every A and B.** Write one line with:
   - (a) the part: shoulder, upper arm, elbow, forearm, wrist/cuff, hand,
     grip or haft, near or far;
   - (b) the connection that fails (J1-J9 below);
   - (c) the rendering cause, from this list: *draw order* (name the
     occluder from the ID map), *cell cut*, *cell length or mapping*,
     *shading halo*, *pose or IK*, *missing or empty part*, or *other*
     (describe it);
   - (d) the crop path.
   Record the verdict in the ledger's anatomy grid (`N`, `A V-n`, `B V-n`).
3. **Then the join checklist,** J1-J9, on every A/B window and on any
   window step 1 was unsure about. Each join gets `ok` or a finding:
   - **J1 Shoulder:** the upper sleeve starts AT the shoulder, under the
     pauldron or collar. There is no gap, no step, and no arm growing out of
     the chest or back.
   - **J2 Elbow:** the upper arm and forearm meet as one limb. There is no
     visible seam, no width jump, and the joint does not bend backwards.
   - **J3 Wrist:** the cuff or forearm flows into the hand. There is no bare
     cut, no floating hand, and the hand is not rotated against the forearm.
   - **J4 Hand:** it looks like a hand in this art style. The skin tone and
     painting match the face, the size is about the face's length, and it has
     fingers, not a flat cream mitten or an icon.
   - **J5 Grip:** the fingers visibly wrap the haft. The haft passes THROUGH
     the fist and does not lie on top of it or beside it. Both hands sit on the
     haft line for two-handed weapons, and the weapon does not float.
   - **J6 Arm pose:** the placement is plausible for the move. The arms are
     not both parallel to the haft like rails, they do not cross the face, and
     the far arm is not hidden behind or passing through the torso.
   - **J7 Layering:** near-arm parts are over the torso and weapon where a real
     body would be, and far-arm parts are behind them. The weapon is not drawn
     over the forearm that holds it.
   - **J8 Same body:** the arm, hand and torso share one lighting direction,
     one level of detail and one resolution.
   - **J9 Inner side:** walking the inner edge of each arm from the armpit to
     the fist, the arm's own paint never stops. There is no background, torso
     or weapon showing through between two parts of the same arm. The outer
     edge may be covered.
4. **Only then the x-ray, the ID map and the suspects, for root cause.** The
   x-ray separates a pose problem (the joint markers are in the wrong place)
   from a cell problem (the markers are right but the paint does not cover or
   meet them). The ID map names the draw-order occluder. Answer every entry
   in `suspects.json` for the fighter with "confirmed -> V-n" or "dismissed:
   <what the crop shows>".
5. **Pixels overrule metrics, both ways.** A finding stands if the image shows
   it, even when a geometric check passes (for example `gripDist` 0 or a hand
   overlapping the forearm). A clean detector row never turns an A or B into
   N. Quote the image instead.
6. **Compare with a reference.** Hold the clean sheet next to
   `screens/title.png` and the hero's painted portrait. A cream mitten on a
   painted forearm is S2 even if every character has one. A defect common to
   all fighters is ONE finding with a cast-wide scope, not "house style".
7. **A fighter's anatomy is `ok` only when all 14 moves are N** on the
   current capture. Pattern verdicts ("same as its twin") are not allowed:
   every fighter's sheet is opened.

### Rubric: score every screen 1–5 on each dimension

| # | Dimension | What a human checks |
| --- | --- | --- |
| R1 | First impression | Does it look like a finished commercial arcade screen? Is there one clear focal point? Nothing looks placeholder. |
| R2 | Layout & alignment | Margins, centring and a consistent grid. Nothing clipped or off-screen, no accidental overlaps, balanced negative space. |
| R3 | Typography | Legible at gameplay size and on the phone. Consistent families, sizes and weights, with a clear hierarchy. English and 中文 pairs set together cleanly. No tofu or fallback fonts, no text overflowing its panel. |
| R4 | Colour & contrast | Stays within the THEME palette. Text contrast is enough on its real background, with no muddy or flat areas. Light comes from the upper left, per `BODY_STYLE_GUIDE.md`. |
| R5 | Art consistency | One style everywhere: restrained painted semi-realism, the same outline weight and detail density. No vector-looking or mismatched-resolution assets. Scale is consistent between characters, props, panels and backdrop. |
| R6 | Characters in scene | The section 2a join checklist, J1-J8, is passed for the fighters on this screen. Characters read against the backdrop and are grounded, with feet on the ground and shadows. Facing and z-order are sane. A screen cannot score R6 above the lowest anatomy verdict of the fighters in it. |
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
4. Updates each listed finding in the ledger to `fixed <commit> (unverified)`,
   citing the after-image detail and the pair sheet
   (`anatomy/<id>-pair.png`) it looked at. The consumer never writes
   `verified` and never sets anatomy-grid cells to `N`: that is the next
   producer's job. It may APPEND newly noticed findings as `open`
   observations with a crop, but must not file tasks for them.
5. Never marks the task DONE while its own after-review still shows the
   defect. "Playable but ugly" is not done.

## 6. Independent verification (producer)

The implementer never has the last word on their own work. On the next
producer review, each `fixed ... (unverified)` finding (and each legacy
`fixed ... (self-check)`) is re-inspected on a FRESH capture made in that
pass. The reviewer looks at the pair sheet and the clean sheet, not at the
fixer's description, and marks it one of two ways:

- `verified <date>`: the defect is gone in every move it was reported in,
  and the pair sheet shows no new break in any other move.
- `reopened <date> -> V-m`: a new finding is created that references the
  old one, plus the reason.

If the images cannot be attached or viewed, nothing is verified: record the
limitation and end BLOCKED. A reviewer subagent gets the image paths and
this rubric only. A finding reopened twice becomes an owner question.

## 7. Cadence and termination

- **Full review:** every producer pass runs sections 1–4. When the queue
  has TODO work, `.loop/continue.md` still starts a producer pass that runs
  only the visual review once it is due, before continuing the queue.
- **When a review is due:** a review is due when at least 4 commits touching
  `src/game` exist since the ledger's "Last full review" commit, checked
  with `git rev-list --count <commit>..HEAD -- src/game`, or when the ledger
  has no full review at all. A review is also due at once when the ledger's
  "Last full review" section carries a **DUE NOW** line, which is added after
  an owner flag or a miss analysis. The review that handles that flag removes
  the line.
- **Characters every time:** the section 2a anatomy pass runs in EVERY full
  review for all 17 fighters and all 14 moves (the 238-cell grid). It is not
  part of the deep-dive rotation, and it cannot be skipped. A cell that was
  not looked at stays `?`, never `N`.
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
4. **Miss analysis.** Write down why the review missed it: out of scope,
   wrong zoom, wrong question, metric trusted over pixels, an error so
   common it read as house style, or a fixer grading its own fix. Then fix
   that cause in this document, not just the one defect. Every miss must
   leave this procedure harder to fool. The worked examples are "Why the
   first art-director review still missed the arms" and "Why the anatomy
   pass still missed broken arm chains" in the opening section.

The loop learns what this owner cares about instead of repeating the miss.

### Standing rules from past misses

- Ownership is not coverage. Every full review looks at every area, and an
  area owned by another track still gets findings, filed as `deferred
  <track>` with evidence.
- Pixels overrule metrics. A number never dismisses a defect the image shows.
- Something wrong everywhere is still a defect. Judge against a reference
  (the title key art, the portraits, how a real body looks), never only
  against the previous capture.
- Judge features at the size where they are visible. Joins, faces and small
  type need 4x crops. A 2x screen is only enough for layout.
- Nobody grades their own fix. `verified` comes only from a later pass, on a
  fresh capture and the before/after pair sheet.
- A verdict without a cited tile or crop is invalid, and `ok` for a fighter
  means all 14 moves were looked at and read natural.
- An arm chain is connected when its inner side is continuous from the
  shoulder to the fist on the haft. The outer contour may be covered.
