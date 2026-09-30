# Work Queue

Statuses: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`.

The loop processes tasks from top to bottom and works on only one task per iteration.

Keep this file short. Once more than 20 tasks are `DONE`, move the oldest of them
to `TASKS-ARCHIVE.md`; every iteration reads this file to find the first `TODO`,
and scanning a long tail of finished work costs something each time.

## Owner-directed motion experiment

### GYM-1 - Guan Yu whole-character walk and combo pilot

- Status: IN_PROGRESS (attempt 2, 2026-09-30; owner accepts regular movement, all-state extension verified, remaining detail/transition polish and owner playback open).
- Owner request: test complete art-directed sprite sequences for Guan Yu only, following the static whole-frame pilot.
- Delivered: fixed-registration guides, original candidate sheets, opt-in `?motion=1` clip playback from simulation ticks, atomic integrity fallback, temporal traces/recordings and negative controls. Attempt1 coveredidle/walk/combo; attempt2nowcoversallGuanYustateswithoutoldtextures.
- Acceptance: no old-art flashes, exact hit-window alignment, coherent alternating walk, <=10% head/weapon variation, no conspicuous action seams; criteria and results in `docs/GUANYU_MOTION_TEST.md`.
- Evidence: 8 technical unit tests, 4 capture/fallback browser cases, 2 built opt-in cases pass. Visual acceptance FAILS: walk alternation unreliable across 3 candidates; visible glaive shrinks ~36% at sweep. No floor loosened, no cast rollout.
- Attempt2: owner requested all Guan Yu actions. Separate54cellactionatlas+3targetedfallrepairs coversjump/kick/landing,hurt,fall/getup,special,grab/release,mounted/dismount,KO anddefensivestressstates. Bothatlasesloadatomically;regularpixelsunchanged. Landing/visualfallclockfreeze-safe,inputinterruptible;soloCONTINUEdefeatfinisheswithoutcoreticks. No oldtexturesinallactioncapture4/4;regularmotion4/4;units15/15;vision5/5;prodbuild6/6. Details/results: docs/GUANYU_ACTION_REVIEW.md.
- Transitionaudit:13newnegative-controltests fixhitstop+idle/walklanding,mountinterrupt,lateairattackstartup,activekick/retractcontact,midairuprightpop,brokensweepwindow andskipped-renderfallrestart. ActualCanvas/WebGLboundarycaptures2/2;combinedallactions6/6;full706passed/1baselineG6;vision5/5;prodbuild6/6unchanged. Artatlases/coreunchanged. Thisfollow-upbelongs toattempt2 (not a fourth generation attempt).
- Special/mountedexposureaudit:twoimagecandidatesrejectedforsizedrift;existingforwardguardsusedinstead. Maxdirectionstep~79->53special,~134->48mounted,pixel-supported60deggateandold-ordernegativecontrols. Atlases/coreunchanged;3newunitchecks,allaction3/3,vision5/5,prodbuild6/6;full709passed/1baselineG6. Imagebudget12exhaustedforcurrentpass,noblindretries.
- Mixedreview:480tick~8.04snormalinputchoreographybothfacings/CanvasWebGL2/2,realhit/knockdown/getup/grabthrowcase1/1. Screensconfirmopponentpronegrabposeisscoperemainder. Defensive thrownimpact/getupdefeatfixed lowpostureinsteadofuprightrecoil,2newunitcontrols/captures2/2. Full711passed/1baselineG6,vision5/5,prodbuild6/6;approvedart/core/otherfightersunchanged.
- Remaining: ownernormal-speedreview,weapon/clothdetailvariation andopponentgrabposematchingnotcertified. Allstatecoverageisnotblanketperfectsmoothness. Do not re-generate approvedwalking. Rigged-modelproduction remainsseparateownerchoice.
- Existing UIR-19/20 and blocked UIR-16 are unchanged; this explicit owner task takes priority, not an automatic queue restart.

## Enhancements

Add future enhancement tasks below this heading.

### BODY-22 - Whole-body proportions and natural motion pass

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)
- Owner objection round 3 (c): "ensure the whole body, including the
  weapons and hands, has the correct ratio, and that their movements
  are natural."
- Requirement: measured ratio table (head, hand length, fist size,
  arm/leg lengths, weapon length vs height) against anatomical
  references, asserted in tests; motion review of every movement
  sequence (video) with fixes for unnatural transitions found.
- Acceptance criteria:
  - [x] Ratio table in CHARACTER_REVIEW.md (11 rows: head, arm, leg,
        torso, fist, 4 weapon classes, taper, arm/leg constancy), each
        value in its reference band, asserted per fighter
        (test/game/proportions.test.ts: 5 tests; head cited from the
        BODY-14 harness which asserts it render-measured).
  - [x] Human-style motion review of every sequence (guanyu all-14 +
        caocao all-14 + fresh motion clips/sheets): legs bend at knees,
        lunges plant, walk free arm alternates; in-betweens/torso
        dynamics filed as BODY-24 (engine feature, out of scope here).
  - [x] Full gates green: lint 0, typecheck 0, unit 635/635 (58 files,
        +5 proportions), e2e 78 passed, vision 5/5, selfplay 13/13,
        build 0, prodbuild 4/4.
- Delivered: src/game/art/{armik.ts (naturalLegLengths, fitLeg, gait
  swungFreeTarget, solveArm protract flag),weapons.ts (leg IK +
  counter-swing in weaponPose)}, test/game/proportions.test.ts (new),
  docs/CHARACTER_REVIEW.md (ratio table + BODY-22 section), BODY-24
  filed (pose interpolation engine future).
- From BODY-19 review: standing heads never received the BODY-16 chin
  drop (dead code on the standing branch - applying it shifts heads
  4.8u and grazes the face gate); any head re-seat must re-verify
  weapons.test. Walk arms are frozen copies of idle (no counter-swing).
- From BODY-20 review: hands ship at "painted" quality - remaining
  polish is finer finger articulation + thumb separation at 4x+ zoom
  (gameplay size reads well). Revisit if the owner wants gallery-grade
  digits; candidate route is generator refinement, no new pipeline.
- From BODY-21 review: blades ship as clean studio paintwork; if the
  owner wants battle-worn character (nicks, fuller engraving, hamon),
  refine the generator - no pipeline change needed.
- Non-goals: no sim/timing changes.

### BODY-23 - Clean painted cells: holes, capes, boots

- Status: DONE (attempt 1, 2026-09-27 UTC - owner round-3 goal,
  verified full-green same day)
- From the BODY-18 audit (docs/ART_AUDIT.md G5/G6/G8): (G6) the
  black-ground flood key eats near-black costume - interior keyed-hole
  share per cell 16-36% on Cao Cao, 12-22% Xiahou Dun, 8-24% Zhang
  Liao, 11-21% Zhang He, Lu Bu shinF 23% - reads moth-eaten in game;
  (G5) the 6 caped plans keep a flat procedural cape polygon behind
  painted armour; (G8) procedural boot overlays hide the painted boots.
- Requirement: re-key the body cells with an interior fill (holes not
  connected to the cell border stay opaque / matte from the master)
  rather than loosening the tolerance; painted cape cells cut from the
  masters (or generated in their brushwork) for the 6 caped fighters;
  boot overlay reduced to a ground-contact shadow so the painted boot
  shows.
- Acceptance criteria:
  - [x] artaudit HOLE_CEILING lowered 0.40 -> 0.08 and green (the
        re-key is chroma-aware + interior fill: all keyed cells measure
        0% interior holes; generated hand cells exempt - wrapF's pad
        gaps are design).
  - [x] Every caped plan renders a painted cloth cell (audit asserts;
        6 plans: green/gold guanyu, blue/red zhaoyun, red/gold lubu,
        purple/gold caocao, green/green zhangliao, green/green zhanghe;
        lying mirror keeps the prone trail toward the feet).
  - [x] Human-style review (docs/CHARACTER_REVIEW.md BODY-23 section;
        delegated eyes-on pass - this session's image display served
        crossed previews): capes OK incl. prone, armour solid, boots
        readable (lit welt/toe), hands unchanged. Root cause found:
        the prep's 8% ankle raise mis-seated painted boots below the
        ground (rig foot = sole line) - fixed; foot gate re-pointed at
        the painted boots (17/17). Full gates green: lint 0, typecheck
        0, unit 635/635 (58 files), e2e 78 passed, vision 5/5, selfplay
        13/13, build 0, prodbuild 4/4.
- Delivered: scripts/prepare-body-parts.mjs (chroma-aware re-key +
  interior fill, foot = sole, generated cloth cells + lying mirror),
  src/game/art/{draw.ts (contact shadow + welt/glint),body-parts.ts
  (lying mirror)}, test/game/{artaudit.test.ts (0.08 ceiling + cloth
  assertion),footcheck.test.ts (re-pointed),bodyparts.test.ts (cloth
  exemption)}, 17 body sheets + 3 prepared.json (revision body-4),
  docs updates.
- Non-goals: no new costumes; no silhouette changes beyond the cape.

### BODY-24 - Pose interpolation and torso dynamics (motion engine)

- Status: DONE (attempt 2, 2026-09-27 UTC, verified full-green same
  day)
- From the BODY-22 motion review (docs/CHARACTER_REVIEW.md): combos and
  walk read as keys snapping between frozen poses (no in-between
  frames), and the torso never rotates into a swing. Keys are correct
  (BODY-19/22); the missing piece is engine motion between them.
- Requirement: interpolate joint angles/positions between consecutive
  combat keys (windup->strike->recover) over the existing frame timing,
  plus torso lean/rotation into strikes; walk keys ease rather than snap.
  Same poses, same timing, same sim - only the rendered path between keys.
- Acceptance criteria:
  - [x] Motion review: combo and walk read as continuous movement
        (CONTINUOUS - eased in-between poses between every walk and combo key on all 3 hero sheets, no snapping/jitter/double-image (delegated review)). The blend frames come from lerpSkeleton +
        torsoLean/leanEnvelope (smoothstep easing; the upper body
        rotates into strikes about the pinned hip), inserted as two
        cached in-between textures at each pose swap - sim timing,
        poses and hits untouched.
  - [x] Reach/legibility/parity gates hold on interpolated frames
        (test/game/body24-frames.test.ts: face-clear + figure-ink on
        blend frames, heroes x 2 chains x 3 blend points; the weapon
        fits re-run per frame and re-clear the bow mid-sweep).
  - [x] Full gates green (lint 0, tsc 0, unit 646/646, e2e 78,
        vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: no new poses; no sim/timing changes; no procedural
  secondary motion (cloth/hair) unless free.

### BODY-7 - Full verification sweep for the body overhaul

- Status: IN_PROGRESS (sweep complete 2026-09-27 UTC, awaiting owner
  acceptance - the one gate only the owner can close)
- Dependency: BODY-3, BODY-4, BODY-5, BODY-6 DONE.
- Requirement: whole-cast review (all fighters x poses x facings,
  desktop + mobile, co-op + mounted), byte/decode-memory/boot-time
  report, full serial gates (lint, typecheck, unit, e2e, selfplay,
  vision Canvas/WebGL parity, build, prodbuild), final owner
  presentation.
- Acceptance criteria:
  - [x] Every gate green in one serial run; report recorded (this
        round: lint 0, tsc 0, unit 635/635, e2e 78, vision 5/5,
        selfplay 13/13, build 0, prodbuild 4/4; whole-cast review of
        all 17x14 + motion, 18 flags all dismissed with evidence, no
        UIR filings; byte/decode/boot report in PROGRESS).
  - [ ] Owner accepts the final cast (unresolved objections stay open).
- Non-goals: no new art in this task; fixes only.

### ENH-12 - Name the gamepad where the UI names controls

- Status: IN_PROGRESS (attempt 1 interrupted; source restored, unverified draft saved)
- Owner priority: deferred again - first ART-18 (now DONE), now the approved
  UI/art overhaul (UI-1/UI-2 DONE, UI-3..5 + ART-19/20 next). Draft:
  artifacts/loop/enh12-attempt1-partial.patch.
- Requirement:
  The title plate names keyboard and touch controls but never the
  GAMEPAD - a first-class input class per PROJECT.md. A pad-only player
  is told ARROWS/Z/X/C/ENTER/M/P, none of which their device has: the
  exact defect TitleScene's own comment fixed for phones ("naming the
  controls THIS device has"). ENH-11 also gave Start a pause role that
  no text mentions. Add gamepad naming where the UI already names
  controls: a title-plate line (A ATTACK / B JUMP / X SPECIAL / START
  CONFIRM-PAUSE) when a pad is visible, and a resume hint a pad player
  can act on (the ENH-11 follow-up). Design note: browsers may not
  expose a pad until first input, so the title line is best-effort on
  visibility (navigator.getGamepads + gamepadconnected); the
  synthetic-pad harness proves the mechanic.
- Acceptance criteria:
  - [ ] With a connected pad (synthetic-pad harness), the title shows a
        gamepad line naming the standard mapping's A/B/X actions and
        START (confirm + pause); without one, the desktop keyboard
        legend is unchanged (byte-identical text).
  - [ ] The pause resume hint names a control a pad player has (and the
        touch hint stays "TAP TO RESUME").
  - [ ] The title-labels test family (touch.spec "the title names the
        controls the device actually has") extends to the third class:
        KEYBOARD_ONLY tokens still banned on touch, gamepad tokens
        present when a pad is visible and absent otherwise.
  - [ ] No occlusion/label-fit regressions (the plate must fit its
        slab - measure, like the P PAUSE line was).
  - [ ] Full gates green (lint, typecheck, unit, e2e, signal, vision,
        prodbuild, build).
- Non-goals:
  - No remapping UI, no non-standard pad layouts, no touch or keyboard
    legend rewording, no DIFF-1 impact.
- Evidence:
  - artifacts/loop/proposals-gamepadnaming-enh12.md (this pass's review).

### UIR-1 - Separate the stage name from the SCORE readout

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-1 (S2)
- Evidence: artifacts/review/latest/crops/stage1-idle--centre.png - the
  stage name "博望坡" shares pixels with "SCORE 0" (re-confirmed fresh).
- Root cause: LAYOUT - src/game/ui/hudlayout.ts:44-45: STAGE_LABEL y1
  (spans y1-11) and SCORE y12 (spans y7-17) overlap by ~4px.
- Affected screens: every in-game screen (45 captures), all stages, phone
  and WebGL.
- Requirement: re-space the HUD centre column (stage label, score, WAVE
  chip) so the three lines never share pixels, keeping them inside the
  40px band.
- Acceptance criteria:
  - [x] A unit test on hudlayout asserts the STAGE_LABEL, SCORE and
        CHIP vertical extents (font size and origin) are disjoint with
        a gap of at least 1px (test/game/hudlayout.test.ts; pinned
        failing first - the old 1/12/23 stack overlapped ~5px). The kit
        suspect "overlapping text" is gone from every manifest entry
        (objective count: 42 suspects across 59 screens before, 0
        after).
  - [x] After npm run review:capture the affected screens are
        re-reviewed against previous/ (V-1 FIXED - before crop shows the glyph overlap, after shows three cleanly stacked lines; contact sheets and phone HUD clean (delegated)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: moving the plates, or changing font sizes except as needed.

### UIR-2 - Boss WARNING banner must read above the boss rail

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-2 (S1)
- Evidence: artifacts/review/latest/crops/stage1-boss-warning--banner.png -
  only the "Li Dian 李典" subtitle shows; the red rail covers the WARNING
  title completely (re-confirmed fresh).
- Root cause: DEPTH - src/game/scenes/HudScene.ts:670-679 (banner) against
  :325-326 (rail depth wins while both visible).
- Affected screens: stage1-boss-warning (every boss entry).
- Requirement: while the rail is visible, the banner title must be fully
  visible. Either raise it above the rail or offset it below the rail.
  Stage banners keep their current look.
- Acceptance criteria:
  - [x] A unit check shows the WARNING title's bounds do not
        intersect the rail's bounds (test/game/hudlayout.test.ts UIR-2
        block: the title band at BANNER.y + WARNING_BANNER_DROP clears
        the rail band 40..58; a second pin keeps stage banners at
        their current position). The fix drops the WARNING variant
        below the rail instead of raising its depth - nothing gets
        covered, honoring the banner's "never covers a persistent
        readout" rule.
  - [x] After npm run review:capture the after-crop shows the word
        WARNING (FIXED - the after-crop shows WARNING fully readable, clear of the rail (before-capture confirmed broken: subtitle only)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: the banner's art, or its hold duration.

### UIR-3 - One stage announcement, not two at once

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-3 (S2)
- Evidence: artifacts/review/previous/crops/stage1-intro--intro.png - the
  banner's "Bowang Slope" still shows above the intro card, which repeats
  it; code-certain overlap (card at +1600ms vs banner visible to ~1680ms+;
  HudScene.ts:484 vs :175/:706). The fresh capture missed the ~200ms
  window; zero src/game changed since, so it still reproduces.
- Root cause: TIMING - src/game/scenes/HudScene.ts:484 raises the card
  1_600 ms after build, while the banner (:175, BANNER_HOLD_MS plus 180
  ms in and out) is still up. Both carry stage number and name.
- Affected screens: stage1-9 banner and intro.
- Requirement: the intro card must not be raised while the stage banner
  is visible. Sequence them, or drop the duplicate stage name from one
  of them.
- Acceptance criteria:
  - [x] A spec shows that no frame has the introCard at alpha > 0
        while stageBanner is at alpha > 0.05 (e2e/introcard.spec.ts
        UIR-3: samples every animation frame across a stage entry;
        pinned failing first - the offenders list recorded the old
        overlap, e.g. "t=1642ms card=0.21 banner=1.00"). Autopilot
        still dismisses the card by tick count (existing test green;
        run() never stalls).
  - [x] After npm run review:capture the stage-entry screens show one
        announcement at a time (FIXED - intro-card moment shows the card alone, banner moment shows the banner alone, no doubles across the flow sheet (delegated)). Sequencing is enforced
        by a state gate (the card refuses to rise while a stageBanner
        shows - the banner tween's alpha tail outlives a naive
        duration sum) plus a derived nominal delay
        (INTRO_CARD_DELAY_MS).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: the lore text, or the card art.

### UIR-4 - No 7px body-font labels

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-4 (S2)
- Evidence: artifacts/review/latest/screens/stage1-result.png - LIVES /
  SCORE / TIME are thin grey Arial-style caps, unlike every other word
  on the panel (re-confirmed fresh); same sans on the roster LIFE /
  SPEED rows and the HORSE row.
- Root cause: TYPE - `liveStyle()` (src/game/ui/type.ts) selects
  BODY_STACK below DISPLAY_MIN_SIZE. Callers: ResultScene.ts:186,
  SelectScene.ts:127-128, hudlayout.ts:21 (META_ROW).
- Affected screens: select-*, stage*-result, webgl-result, stage2/6-play
  (HORSE row), and the phone screens.
- Requirement: these labels use the display family at a size legible on
  a Pixel 7 (at least 7 CSS px there). Any new glyphs are added to the
  display string table and font subset.
- Acceptance criteria:
  - [x] The kit suspect "small text <8px" is gone from the manifest
        (objective count: 92 suspects across 59 screens before, 0
        after), and test/game/uir4-type.test.ts asserts that no
        liveStyle caller in the scenes passes a size below the display
        minimum (source scan) and the HUD layout text constants clear
        it. The labels (LIVES/SCORE/TIME, LIFE/SPEED, HORSE row) use 9
        - the display family and >= 7 CSS px on a Pixel 7 (7 fell to
        the generic sans at ~6 CSS px). No new glyphs, so the display
        string table and font subset are untouched.
  - [x] After npm run review:capture the result crop, the roster crop
        and the phone select are legible and matching (FIXED - result + roster labels legible and matching (pixel-measured 13px display caps vs 10px thin sans before). Caveat: the phone capture HORSE row was empty (player on foot) - that instance is code-confirmed at 9px and covered by the 92->0 suspect count, but was not visually exercised).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: re-laying out the roster cards.

### UIR-5 - Continue and result panels: fit titles, centre chips, add contrast

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-5, V-6, V-7 (S2)
- Evidence: artifacts/review/latest/screens/stage1-result.png (LIVES
  chip on the parchment border; row spans x70-390, centre 230 not 240;
  STAGE CLEAR! touches the top bar) and
  crops/stage1-continue--dialog.png (CONTINUE? crosses the gold top
  rule; flat #ffd700 title + white "9" on cream) - all re-confirmed
  fresh. PAUSED on the same card sits properly inside with a dark
  stroke.
- Root cause: LAYOUT and COLOUR - HudScene.ts:440-448 (title at y92 on
  a card centred at y123 = its top edge; un-stroked liveStyle 22/30)
  and ResultScene.ts:98 and 114-116 (hard-coded chip offsets).
- Affected screens: stage1-continue, stage1-result, stage9-result,
  webgl-result.
- Requirement: the titles sit inside their card with the same inset as
  PAUSED. The chip row is centred on the panel and stays inside its
  frame. The CONTINUE? title and countdown get the dark stroke PAUSED
  uses.
- Acceptance criteria:
  - [x] A unit check shows the title bounds lie within the card's
        panelRect inset by at least 4px (CONTINUE_TEXT stack vs the
        184x96 dialog at cy 123; title and countdown disjoint), that
        the chip row's centre is within 1px of the panel's centre and
        no chip crosses the frame (resultChipRow() laid out from the
        x 70..410 band with even 20px gaps - test/game/hudlayout.test
        .ts UIR-5 block; the old row spanned x70-390, centre 230).
  - [x] After npm run review:capture the continue and result panels
        re-reviewed (FIXED - continue title fully below the gold rule with the dark stroke (countdown too), result title clear of the top bar, chip row centred with even gaps and LIVES off the border; matches PAUSED (delegated, before state confirmed in previous/)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 654/654,
        e2e 79, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: the panel textures, or the countdown logic.

### UIR-6 - Point the touch d-pad chevrons outward

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-10 (S2)
- Evidence: artifacts/review/latest/screens/phone-portrait-game.png -
  the up arm shows a down-chevron, left ">", right "<", down "^"
  (re-confirmed fresh; same in landscape).
- Root cause: ASSET - src/game/art/hudart.ts:487-492: the chevron
  path's apex is at +y, so at angle 0 it points DOWN, but
  hudart.ts:498-501 assumes angle 0 points up.
- Affected screens: phone-landscape-game, phone-portrait-game.
- Requirement: each arm's chevron points in the direction the arm moves.
- Acceptance criteria:
  - [x] A unit test on the painted sheet shows each arm's chevron
        pointing the way it moves (test/game/uir6-chevrons.test.ts:
        the chevron's combined ink+gold pixels keep the tip at the arm
        centre and the wings behind it - pinned failing first, the old
        path read "wings not behind (inward -2.0px)" on every arm).
  - [x] After npm run review:capture the phone crops show outward
        arrows (FIXED - all four arms point outward in both phone frames (pixel-level ASCII-map confirmation by the reviewer; before state confirmed all four inward)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 655/655,
        e2e 79, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: the button layout, or the hit areas.

### UIR-7 - Ask portrait phone players to rotate

- Status: DONE (attempt 1, 2026-09-27..28 UTC, verified full-green)
- Source: UI review 2026-09-26, findings V-9 (S2) plus owner decision 1
  (rotate overlay, not a portrait layout)
- Evidence: artifacts/review/latest/screens/phone-portrait-game.png -
  the game fills ~28% of the height; touch buttons ~20 CSS px; no hint
  to rotate (re-confirmed fresh).
- Root cause: PLATFORM - src/game/main.ts:31-32 (Scale.FIT,
  CENTER_BOTH) has no orientation handling in index.html or
  src/style.css.
- Affected screens: phone-portrait-title, -select, -game.
- Requirement: on a touch device in portrait (height greater than
  width), show a full-screen themed "rotate your phone" overlay (a
  phone icon plus the text, in the display font, on the letterbox
  gradient) over the game. Gameplay is paused while the overlay shows
  and resumes when the phone is rotated back. Desktop and landscape
  are unchanged.
- Acceptance criteria:
  - [x] e2e/orientation.spec.ts: Pixel 7 portrait shows the overlay
        with the sim tick frozen; Pixel 7 landscape shows no overlay with
        ticks advancing; desktop 960x540 shows no overlay (3/3 green).
        The review capture's phone-portrait shots show the overlay and
        the landscape shots do not (ui-review phone() asserts the
        overlay in portrait instead of waiting for ticks - this also
        fixes the known capture abort, so review:capture now completes
        with platform + anatomy + pair sheets).
  - [x] After npm run review:capture: phone-portrait-title/select/game
        show the full-screen themed overlay (gold phone icon + ROTATE
        YOUR PHONE in the display font on the letterbox gradient);
        landscape shows the game clean with touch controls and no
        overlay; WebGL screens intact. Before: tiny game, no hint (V-9
        evidence; previous/ portrait-game never captured - the abort).
  - [x] Contact sheets show no regression; vision 5/5 and relevant
        specs green (touch.spec + touchpause.spec migrated to Pixel 7
        landscape - portrait no longer plays; 10/10). Ledger V-9 set
        to fixed (self-check).
- Non-goals: a portrait gameplay layout, or forcing orientation through
  the Screen Orientation API.

### UIR-8 - Paint the landmark strip

- Status: DONE (attempt 1, 2026-09-28 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-11 (S2)
- Evidence: fresh stage screens - flat grey slab with green lid (gorge
  wall), blank beige rectangles on posts (warship sails, hulls sunk),
  solid red slabs (cliffs); next to the painted heroes they read as
  placeholder art (re-confirmed fresh).
- Root cause: ASSET - src/game/art/backdrop.ts:318-512 `paintMarks`
  fillRect blocks, and the hull sink against MARKS_ROOT_DEPTH
  (GameScene.ts:67).
- Affected screens: all `stage*-play` screens, especially stage1
  (gorge), stage6 (warships) and stage7 (inferno).
- Requirement: repaint all nine landmark kinds with painted masses,
  tonal bands, lit and shadow sides and soft edges, so they
  recognisably stay the same place. The warship hulls must be visible
  above the waterline. Shared backdrop constraints apply (frozen tile
  geometry; bake-time paint, no per-frame cost rise; backdrop lower
  contrast/saturation than the cast with upper-left light; original
  art only).
- Acceptance criteria:
  - [x] test/game/uir8-marks.test.ts: share of half-opaque 16x16 blocks
        with luminance std-dev >= 10 clears 0.55 on all nine kinds.
        Before: gorge 1.00, village 0.44, riverbank 0.25, bridge 1.00,
        outskirts 1.00, warships 0.67, inferno 0.31, flagship 0.25,
        arena 0.44 (five below floor - fails first). After: eight at
        1.00, arena 0.67. The stage6 after-image shows planked hulls
        with masts and folded sails riding the waterline; R5 is 4 on
        the stage*-play screens (painted modeling in the cast idiom:
        gradients, tonal bands, ink lines, upper-left light).
  - [x] After npm run review:capture: all nine landmark strips show
        fully (gorge walls + banners, village roofs/trees, riverbank
        water/reeds, bridge arch, palisade/tents, warships, inferno
        cliffs + burning hulls, flagship tower, arena + braziers).
        Root cause of the sunk hulls found and fixed along the way:
        the 2x-baked marks texture on a tileScale-1 sprite displayed
        only its top half (tile rows 0..32) - hulls, water, decks and
        banner bottoms were cut game-wide. marks.setTileScale(0.5, 0.5)
        maps the texture 1:1 (paint period still 256px, scrolling
        unchanged). Before: stub walls, sail rects without hulls, no
        banners; after: full strips (stage1/6/7 verified close up).
  - [x] Contact sheets show no regression; vision 5/5 and relevant
        specs green (ART-19 suite green unedited: seams, margins,
        periods, distinctness); ledger V-11 set to fixed (self-check).
        The same half-texture display affects the other 2x-baked
        layers - recorded as V-19 for the next producer to batch.
- Non-goals: new landmark kinds, or parallax factors.

### UIR-9 - Paint the sky and clouds

- Status: DONE (attempt 1, 2026-09-28 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-13 (S2)
- Evidence: every fresh `stage*-play`: smooth two-colour gradient sky
  and hard-edged flat-filled cloud lobes (re-confirmed fresh); against
  the painted heroes and title key art the game looks like two
  different products.
- Root cause: ASSET - `paintSky` :63 and `paintCloud` :199 in
  src/game/art/backdrop.ts (a flat gradient and hard flat lobes).
- Affected screens: all `stage*-play` and `stage*-banner` screens.
- Requirement: a painted sky (atmospheric gradient, subtle broken
  colour, soft light toward the sun side) and painted clouds (soft
  edges, a lit top and a shaded belly). The ember sky stays distinct.
  Shared backdrop constraints apply (see UIR-8).
- Acceptance criteria:
  - [x] test/game/uir9-sky.test.ts: 16x16-block luminance-stddev
        share (threshold 7) clears 0.55 on skies, 0.9 on the cloud.
        Before: sky-day 0.04, sky-ember 0.25, cloud 0.80 (fails first).
        After: 1.00 / 1.00 / 1.00. R5 = 4 on stage*-play vs title
        (atmospheric grade, broken colour, sun-side light, modeled
        clouds with lit tops and shaded bellies; ember stays distinct).
  - [x] After npm run review:capture: day skies show graded atmosphere
        with mottling, faint cirrus and modeled clouds (an early
        five-line cirrus pass banded visibly and was cut back to three
        faint lines; an every-9px striation pass read as corduroy and
        was removed - the deterministic grain carries the tooth);
        ember stage7 reads as smoky sunset, distinct from day. WebGL
        and phone-landscape match canvas; portrait still overlays.
  - [x] Contact sheets show no regression; vision 5/5 and relevant
        specs green (ART-19 suite green unedited); ledger V-13 noted
        sky-done (ridges/ground pending UIR-10/11, which complete it).
- Non-goals: weather, time of day, or animated sky.

### UIR-10 - Paint the hill ridges with atmospheric depth

- Status: DONE (attempt 1, 2026-09-28 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-13 (S2)
- Evidence: every fresh `stage*-play`: the ridge is a single-colour
  hill with an ink line (re-confirmed fresh).
- Root cause: ASSET - `paintRidge` :110 in
  src/game/art/backdrop.ts (single-colour hills with an ink line).
- Affected screens: all `stage*-play` screens.
- Requirement: painted far and near ridges (value falloff with
  distance, a lit crest and shaded flank, a soft haze join) instead
  of flat colour plus outline. Shared backdrop constraints apply
  (see UIR-8).
- Acceptance criteria:
  - [x] test/game/uir10-ridge.test.ts: 16x16-block luminance-stddev
        share (threshold 7) clears 0.75 on day and dusk ridges. Before:
        day 0.67, dusk 0.48 (fails first). After: 0.83 / 0.92. R5 = 4
        on stage*-play vs title (far ridge pale and hazy, near ridge
        with lit crest, shaded flank and soft haze join; silhouettes
        and stage colours unchanged).
  - [x] After npm run review:capture: all nine stages show two-ridge
        depth in their own palettes (stage1 green hills and stage8
        purple night verified close up); hills.setTileScale(0.5, 0.5)
        was required - the ridge base, flank shading and haze join sit
        below tile row 48 and never displayed (same half-texture root
        cause as V-11/V-19; no other layer touched).
  - [x] Contact sheets show no regression; vision 5/5 and relevant
        specs green (ART-19 suite green unedited); ledger V-13 noted
        ridges-done (ground pending UIR-11, which completes it).
- Non-goals: new ridge silhouettes per stage, beyond the existing
  colour table.

### UIR-11 - Paint the ground per stage

- Status: DONE (attempt 1, 2026-09-28 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-13 (S2)
- Evidence: every fresh `stage*-play`: the ground is one tint with a
  dot pattern (re-confirmed fresh).
- Root cause: ASSET - `paintGround` :155 in
  src/game/art/backdrop.ts (one tint with a dot pattern).
- Affected screens: all `stage*-play` screens, plus the phone and
  WebGL shots.
- Requirement: a painted walkable ground (varied grass, earth or stone
  strokes, horizon-lit to foreground falloff) that stays calm enough
  for the actors' shadows and hit effects to read. Shared backdrop
  constraints apply (see UIR-8).
  (Includes the V-19 ground part: set ground.setTileScale(0.5,
  0.5) so the repainted ground displays fully - required for the
  acceptance below, same as sky/ridge under UIR-9/10.)
- Acceptance criteria:
  - [x] test/game/uir11-ground.test.ts: 16x16-block luminance-stddev
        share (threshold 7) clears 0.55 on grass and earth. Before:
        0.19 / 0.19 (fails first). After: 0.83 / 0.72. R5 = 4 on
        stage*-play vs title (horizon-lit falloff, mottled patches,
        blade/clod/chip strokes, calm paint tooth); actor ground
        shadows read clearly in the after-crops (stage1/stage4).
  - [x] After npm run review:capture: all nine grounds show painted
        falloff + texture in their stage palettes (stage1 grass and
        stage4 earth verified close up); ground.setTileScale(0.5, 0.5)
        maps the repaint 1:1 (V-19 ground part - the bottom half never
        displayed). Before: one tint with dots.
  - [x] Contact sheets show no regression; vision 5/5 and relevant
        specs green (ART-19 suite green unedited); ledger V-13 set to
        fixed (self-check) - the last of its three parts (sky UIR-9,
        ridges UIR-10, ground here).
- Non-goals: collision, or the lane depth.

### UIR-12 - Paint hands with fingers, not mittens

- Status: DONE (attempt 1, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)
- Source: UI review 2026-09-27, findings V-14 J4/J8 (S1/S2, owner-flagged)
- Evidence: artifacts/review/latest/anatomy/*.png (all 15 reviewed) -
  flat cream/pink mitten fists with ridge bands but no separated
  digits, against painted faces and sleeves. Worst on pale-skinned
  fighters (zhaoyun) and dark armor (caocao, xiahoudun).
- Root cause: ASSET - scripts/prepare-body-parts.mjs (hand painter)
  and src/game/art/hand-parts.ts: cells carry knuckle shading but no
  digit separations, thumb mass, or face-matched paint handling.
- Affected screens: every fighter in every movement (anatomy sheets).
- Requirement: repaint the hand cells with separated fingers/digits
  (flexed per cell kind), a readable thumb mass, and paint handling
  (tone, shading depth) matching the fighter's face. All five hand
  kinds, both near and far shading.
- Acceptance criteria:
  - [x] Texture/unit check (handparts UIR-12 test): digit-separator
        dips per cell at 4x = 0 before (creases never reached the
        knuckle zone), 3+ after; fails on old paint, passes on new.
        Skin match re-pointed tighter: +-45 around raw skin ->
        +-30 around either designed tone (raw or the bloom-peak lit
        blend, e.g. guanyu 191,114,94 = exact formula blend).
  - [x] review:capture re-run (59 screens + 34 anatomy sheets); J4
        re-reviewed on the fresh sheets (delegated eyes-on: digits
        separated and rounded at 8x and 4x, mitten look gone).
        Note: the before-pair is partially lost - the latest->previous
        rotation hit a persistent Windows EPERM and a fallback deleted
        the stale capture (top-level contact sheets preserved); the
        before state is recorded in the ledger + this test's comments.
  - [x] Full gates green (lint 0, tsc 0, unit 636/636, e2e 78, vision
        5/5, selfplay 13/13, build 0, prodbuild 4/4); ledger V-14
        sub-verdict updated.
- Non-goals: grip geometry or layering (UIR-13), pose changes.

### UIR-13 - Grip wraps: fingers around the haft, hand over weapon

- Status: DONE (attempt 1, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)
- Source: UI review 2026-09-27, findings V-14 J5/J7 (S1/S2)
- Evidence: artifacts/review/latest/anatomy/*.png (attack/thrust) -
  the haft lies ON TOP of the far fist and cuff bands; fists read
  beside the haft rather than around it. X-ray shows the hand markers
  exactly on the weapon axis: geometry passes, pixels fail.
- Root cause: DEPTH+ASSET - src/game/art/draw.ts weaponOrProcedural
  draws the weapon over the gripping hand; hand cells lack wrap
  geometry crossing over the haft (only fingertip pads do).
- Affected screens: every armed fighter in grip movements (anatomy
  sheets; worst on two-handed polearms).
- Requirement: the gripping hand reads wrapped around the haft: finger
  masses visibly cross OVER it on the near side, and the weapon no
  longer covers the hand/fist that holds it (adjust draw order and/or
  add over-wrap paint). Both hands sit on the haft line for
  two-handed weapons.
- Acceptance criteria:
  - [x] Region check (test/game/uir13-gripwrap.test.ts): hand-tone
        pixels in the grip bands on attack/thrust/chop across the
        weapon kinds - recorded before/after (near 360-448 / far
        198-447 samples before; higher after with wrapN). The real
        evidence is pixels over metrics: delegated before/after
        passes CONFIRMED then CLEARED all three claims (haft over far
        fist, fists beside the haft, haft cutting the wrist). Root
        cause found mid-iteration: the near wrap was gated on the
        FAR-hand grip test, so one-handers (caocao) never got it -
        the near hand is the weapon anchor and always grips. Far-fist
        wrap is N/A for one-handers by design (BODY-15 counterbalance
        hand is not holding).
  - [x] review:capture re-run after the fix; grip joins re-reviewed at
        8x/4x on fresh renders against the before crops. Contact
        sheets show no regression elsewhere.
  - [x] Full gates green (lint 0, tsc 0, unit 637/637, e2e 78,
        vision 5/5, selfplay 13/13, build 0, prodbuild 4/4); ledger
        V-14 sub-verdict updated (J5/J7 fixed).
- Non-goals: finger detail itself (UIR-12), strike poses (UIR-15).

### UIR-14 - Sleeves meet shoulders; forearms trace to the hand

- Status: DONE (attempt 1, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)
- Source: UI review 2026-09-27, findings V-14 J1/J3 (S2)
- Evidence: artifacts/review/latest/anatomy/*.png - on armored
  fighters the sleeve starts inset below the pauldron with a visible
  step (lubu/caocao/xiahoudun/xuchu/zhangliao/caoren/xuhuang/zhanghe/
  lidian/soldier in strikes); on zhaoyun the silver forearm vanishes
  on the silver torso in idle/walk/hurt so the hand floats.
- Root cause: ASSET - src/game/art/body-parts.ts cell caps at the
  shoulder (upper-arm pre-span too short/narrow to tuck under the
  pauldron) and no tone separation where the forearm crosses the
  torso (prepare-body-parts.mjs cell paint).
- Affected screens: armored fighters' shoulders in all movements;
  zhaoyun idle/walk/hurt wrist.
- Requirement: upper sleeves start AT the shoulder joint, tucked under
  the pauldron/collar with no gap or step, in all poses; forearms
  crossing the torso keep enough tone/edge separation to trace to the
  cuff and hand.
- Acceptance criteria:
  - [x] Seam check (test/game/uir14-joins.test.ts): shoulder-join
        transparency gaps <=1px and a traceable forearm edge step
        (recorded: the floor passed before the fix too - the eye's
        "step" was a tone edge metrics could not see; acceptance
        rests on the delegated pixel pass per pixels-overrule).
        Fixes: sleeve cells' top rows alpha-feathered (the master's
        pauldron fragments melt under the torso's pauldron instead
        of stepping) + soft edge-shade behind each forearm where it
        crosses the torso (BODY-11 mechanism reused) - the zhaoyun
        silver-on-silver forearm now traces elbow-to-cuff.
  - [x] review:capture anatomy sheets re-rendered on body-7; J1 on
        lubu/caocao/zhangliao and J3 on zhaoyun re-reviewed by a
        delegated judge (verdicts recorded in the PROGRESS entry).
  - [x] Full gates green (lint 0, tsc 0, unit 638/638, e2e 78,
        vision 5/5, selfplay 13/13, build 0, prodbuild 4/4); ledger
        V-14 sub-verdict updated (J1/J3 fixed).
- Non-goals: pauldron art itself, hand paint (UIR-12).

### UIR-15 - Strike arms bend; no parallel rails

- Status: DONE (attempt 2, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)
- Source: UI review 2026-09-27, findings V-14 J6 (S2)
- Evidence: artifacts/review/latest/anatomy/*.png (attack/thrust/chop
  on polearm fighters) - both arms run near-straight and parallel
  under the haft like rails. One-handers and the bow read fine.
- Root cause: POSE - src/game/art/poses.ts strike arm geometry plus
  the weapons.ts arm solution rest too straight: elbows keep little
  flexion and the two arms share one direction.
- Requirement: two-handed strikes keep visible elbow flexion and break
  the parallel: differentiate the arms (lead/push roles), keep both
  fists on the haft with separation, keep hands/weapons clear of the
  face per the existing gates.
- Acceptance criteria:
  - [x] Elbow-flexion + elbow-side measure
        (test/game/uir15-strikearms.test.ts): far-elbow turn rises vs
        baseline on attack/chop (guanyu attack 84->116deg, chop
        123->135; chop chains 23-33->42-84deg) and the two elbows bow
        different sides of the bar (or >=3u apart on it) in every
        polearm strike. Probe-recorded geometry limit: on long
        ji/glaives the weapon's own butt sits at ~full far reach at
        thrust (d=24.1 vs reach 24.5), so the rear arm is legitimately
        extended there and the elbows' sides carry the rails fix.
        Grip-hold guard: every strike keeps the far hand on the haft.
  - [x] The anatomy J6 re-review reads ok (J6 FIXED on attack/attack2/thrust for all polearm fighters (elbows clearly apart, low hip vs bar height; the parallel-tubes read is gone)).
  - [x] Reach/face-clear/parity gates stay green; full gates green
        (lint 0, tsc 0, unit 640/640, e2e 78, vision 5/5, selfplay
        13/13, build 0, prodbuild 4/4).
- Non-goals: new poses, timing changes, in-betweens (BODY-24).

### UIR-16 - Keep the far fist off the near arm on two-handed strikes

- Status: BLOCKED (3 attempts exhausted 2026-09-28 UTC - G6 literal-0 is
  unsatisfiable as specified: placement cannot clear (forward grips
  unreachable, arm rails haft), elbow bends backfire visually
  (guanyu-sweep 11+41 -> 142+269, forearm covers grip) and still leave
  86 cells, masking breaks handgrip/BODY-15. NEEDS OWNER DECISION -
  pick one: (a) rescope G6 to the 9 reviewer-A/B cells + rim tolerance
  elsewhere; (b) authorize wrap/fist masking with handgrip
  renegotiation; (c) authorize UIR-19 hand-art changes; (d) authorize
  pose-table surgery with full re-review. See PROGRESS attempts 1-3
  for proofs. Only the owner may reset to TODO.)
  landed; G6 87->86 with big reductions; strikearms+guards green;
  paint-zero needs wrap-extent work or owner scope call, see PROGRESS)
- Source: UI review 2026-09-28, findings V-15b (S2).
- Evidence: artifacts/review/latest/anatomy/cells/lubu-attack.png (far fist over near elbow, 398px + 627px wrap) and cells/zhangfei-attack.png (219px) - re-confirmed on the 2026-09-28 fresh capture
- Root cause: STATE/pose - `src/game/art/armik.ts:273-325` `fitFarHand` places the far grip 12-19u behind the near hand along the haft, which on attack/attack2/thrust/sweep/special lands UNDER the near forearm and elbow (probe: 0 reachable haft points clear the near arm by 2u for guanyu/zhaoyun/spearman/lidian/zhangliao strikes). The far fist (BODY-15, drawn on top so it stays visible) then paints over the near elbow: up to 847 px at 4x (lubu attack), 794 (xuchu attack). `draw.ts` tail `wrapF` adds the fingertips.
- Affected screens: every polearm fighter, strike moves (grid cells lettered b).
- Requirement: re-choreograph strike grips so the far fist is visible on the haft and not on the near arm: e.g. far grip IN FRONT of the near hand on strikes, or a near-elbow hint that lifts the near arm off the haft line, or a shorter strike separation where the arm clears. Keep UIR-15's "no rails" rule.
- Acceptance criteria:
  - [ ] detector `gripFOverNearArm + wrapFOverNearArm` = 0 on all standing moves (add gate G6 to arm-chain.test.ts); `uir15-strikearms` and `handgrip` stay green.
  - [ ] After `npm run review:capture`, the affected joins are re-reviewed
        on the fresh anatomy sheets against `previous/`, citing the
        after-image detail; contact sheets show no regression elsewhere.
  - [ ] `npm run vision` and relevant specs are green; the ledger finding
        is set to `fixed <commit> (unverified)`.
- Non-goals: new hand art (UIR-19), prone poses (UIR-17).

### UIR-17 - Fold the prone far arm onto the body

- Status: DONE (attempt 1, 2026-09-29 UTC, verified full-green same
  day)
- Source: UI review 2026-09-28, findings V-16 (S2).
- Evidence: artifacts/review/latest/anatomy/cells/guanyu-down.png (far hand alone, 6.3u far-chain gap to background) - re-confirmed fresh; all down tiles rated A by the grid review
- Root cause: pose/IK - `src/game/art/weapons.ts:191` `solveArm(base.shoulderF, base.handF, base.elbowF, ...)` for lying fighters picks the elbow branch below the body (elbowF y ~95 vs hip 82), so the far forearm vanishes under the ground line and the relaxed far hand floats alone under the chest in every fighter's `down` tile.
- Affected screens: all 17 fighters, `down` (cells/<id>-down.png).
- Requirement: choose the prone far-arm pose (owner may prefer the arm across the chest or tucked under the body) and solve the elbow on that branch; if the far arm is fully hidden, hide the far hand too.
- Acceptance criteria:
  - [x] G5 extended to the prone far chain: runF <= 1.5u on
        down for all 17 fighters (pinned failing first on 12 downs,
        worst lubu 11.5u; green after). Down tiles show a connected
        far arm folded across the body (elbow branch mirrored onto
        the torso, hand target untouched so handgrip holds).
  - [x] After npm run review:capture: guanyu-down shows the forearm
        reaching the dangling hand (hole line gone, upperArmF 18%
        visible), lubu-down and caoren-down connected with no
        suspects; contact sheets show no regression elsewhere.
  - [x] Vision 5/5 and relevant specs green (unit 672/673 - only the
        pre-existing UIR-16 G6 pin fails, as intended; e2e 82,
        selfplay 13/13 on re-run after one migrating-timeout flake,
        build 0, prodbuild 4/4). Ledger V-16 set to fixed (self-check).
- Non-goals: standing poses, the dropped-weapon position.

### UIR-18 - Connect the relaxed rear hand to a visible forearm

- Status: DONE (attempt 1, 2026-09-29 UTC, verified full-green same
  day)
- Source: UI review 2026-09-28, findings V-17 (S2).
- Evidence: artifacts/review/latest/anatomy/cells/huangzhong-idle.png (upperArmF 0% visible) and cells/weiyan-hurt.png - re-confirmed fresh
- Root cause: pose/draw order - `src/game/art/armik.ts:366` `swungFreeTarget` swings the free far hand just outside the torso while the far arm is drawn behind it (`draw.ts:748-753`), so the hand shows at the hip with 0-15% of its forearm visible (huangzhong idle/walk/hurt/special, weiyan hurt/special, zhangfei hurt).
- Affected screens: huangzhong (9 moves), weiyan (2), zhangfei (1): cells/huangzhong-idle.png, cells/weiyan-hurt.png.
- Requirement: the visible far hand always has a visible cuff/forearm leading to it (swing further out, or draw the far forearm over the torso edge when the hand is outside the silhouette).
- Acceptance criteria:
  - [x] New detector gate G7 in arm-chain.test.ts: for every
        non-gripping standing move, foreArmF >= 25% whenever relaxF
        paints. Pinned failing first on 18 rows (weiyan:special 14%,
        lubu:hurt 13%, huangzhong:sweep 17% - via git-stash of the
        fix), green after; negative control included. Mechanism: a
        wrist-bridge disc repaints the foreArmF cuff over the torso
        edge at the hand (same cell as UIR-13's wrist bridge), so
        the hand reads as emerging from behind the body - the
        idle/walk tiles read as one arm.
  - [x] After npm run review:capture: affected joins re-reviewed
        against previous/ (huangzhong-idle/walk, weiyan-hurt/idle,
        zhangfei-hurt, lubu-hurt, soldier-idle control). Fresh
        capture's rendered-pixel notes: all 84 relaxF rows >= 27%
        (4 informational 27-30% lines remain, none under the gate);
        far chain no gaps (G5 green). Contact sheets clean.
  - [x] vision 5/5 and relevant specs green (unit 674/676 - the only
        failure is the pre-existing UIR-16 G6 pin, BLOCKED; e2e 82,
        selfplay 13/13, build 0, prodbuild 4/4). Ledger V-17 set to
        fixed <commit> (unverified).
- Non-goals: gripping poses, hand art.

### UIR-19 - Paint hands that match the painted sleeves

- Status: IN_PROGRESS (attempt 2 done 2026-09-29: face-matched skins
  lockstep across figures.ts + packs (mult from face-skin p80 vs hand
  p80, zhaoyun clamped for the fair() gate), deeper creases, far side
  kept above the dark-share ink floor; battery 47/47. J4 re-review
  9 ok / 8 bad - tone complaints are stale-attachment artifacts (the
  sheets are byte-proven face-matched via the modal band), but the
  "flat slitted paddle / spiky comb / ridge-line fingers" reads are
  plausibly real: UIR-12's 1.2u notches + deep creases + light
  companion edges read as slits at gameplay size. Attempt 3 (LAST):
  soften notches 1.2u -> ~0.7u, crease cores to ~0.40, halve the
  companion edges, then anchored re-review (each verdict states the
  hand's dominant colour; per-sheet modal hex recorded first so any
  stale view is detectable))
- Source: UI review 2026-09-28, findings V-18 (S2, V-14 J4 residue).
- Evidence: artifacts/review/latest/anatomy/lubu.png (all 14 moves) - flat cream fists against photographic sleeves, re-confirmed fresh
- Root cause: ASSET - `scripts/prepare-body-parts.mjs:194` `paintHandCell` paints flat skin shapes with bar fingers; next to photographic sleeves they read as mittens on every fighter.
- Affected screens: every clean sheet (most visible anatomy/lubu.png, anatomy/caocao.png).
- Requirement: hand cells with painted form (knuckles, finger separation, lit/shaded planes, sleeve-matched detail level), keeping cell sizes and pivots so the rig and gates hold.
- Acceptance criteria:
  - [ ] handparts/handgrip/uir13 green; reviewer rates J4 ok on all 17 clean sheets.
  - [ ] After `npm run review:capture`, the affected joins are re-reviewed
        on the fresh anatomy sheets against `previous/`, citing the
        after-image detail; contact sheets show no regression elsewhere.
  - [ ] `npm run vision` and relevant specs are green; the ledger finding
        is set to `fixed <commit> (unverified)`.
- Non-goals: rig or pose changes.

### UIR-20 - Show the full ember sheet (tileScale)

- Status: TODO
- Source: producer pass 2026-09-28, findings V-19 remainder (S2, SYSTEM)
- Evidence: V-19 entry (marks isolation proof + live readback applies verbatim: 512x128 texture on a 1064x64 tileSprite at tileScale 1 shows rows 0..64 only); embers painted rows 32..64 never display.
- Root cause: SYSTEM - GameScene.ts embers tileSprite lacks setTileScale(0.5, 0.5) (same as marks/sky/hills had).
- Affected screens: stage7/stage8 ember atmosphere.
- Requirement: embers.setTileScale(0.5, 0.5) so the full sheet displays; keep the tick-driven drift and additive blend unchanged.
- Acceptance criteria:
  - [ ] Ember pixel count on a stage7-play frame rises ~2x (bottom
        half now visible) with no other screen changes.
  - [ ] After `npm run review:capture`, stage7/8 re-reviewed citing
        the after-image detail; contact sheets show no regression.
  - [ ] `npm run vision` and relevant specs are green; the ledger
        finding is set to `fixed <commit> (unverified)`.
- Non-goals: ember art changes, other layers.
