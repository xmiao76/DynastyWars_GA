# Producer proposal scratch: touch pause button (ENH-8)

Pass: run 2026-09-22T05-49-08Z-e0194047 (first scheduled tick on schedule-2).
Signals green (signal 13/13 with ENH-6-identical marathons; vision 5/5, all
9 frames pass, both negative controls correct, findings.jsonl empty), all 9
frames swept by eye with no defect, no UX_REVIEW.md, queue holds only
DIFF-1 (BLOCKED) + 20 DONE. One-area opportunity review below.

## Area inspected (ONE): touch controls vs the new pause feature

ENH-7 shipped P-key pause with the stated non-goal "No touch pause button
(stated follow-up if the owner wants mobile parity)". Fact check:

- The game supports touch as a first-class input: 7 on-screen zones
  (d-pad + A/B/C) in `src/game/adapters/touch.ts`, HUD-owned and mounted
  only when `hasTouch()`, with 8 dedicated touch e2e tests under Pixel 7
  emulation (`tapGamePoint` + `page.touchscreen.tap` patterns exist).
- A touch device has no P key and no other pause path: `keydown-P` is the
  sole toggle and scene keyboard events need physical keys. A phone player
  therefore cannot pause a ~13-minute uninterrupted run (47,416-tick
  zhaoyun marathon) that a desktop player now can.
- The pause mechanism itself needs no change: the toggle writes the existing
  `GameScene.paused` flag, so a touch zone tapping the same flag inherits
  freeze/overlay/clear/resume semantics, and the HUD overlay already renders
  device-independently.
- Feasibility of placement: HUD plates/bars/texts occupy the top band and
  left column; the existing 7 zones sit bottom-left/bottom-right. Free
  anchors exist (e.g. bottom-centre, clear of plates, bars, banners and
  down-texts in every HUD state); exact layout is the consumer's, pinned by
  the existing occlusion and label-fit gates.
- No duplicate: no touch-pause task or rejection in TASKS.md/PROGRESS.md;
  ENH-7 named it as follow-up, not as rejected.

## Verdict: REAL, WORTH FILING (proactive, within vision)

Mobile parity for a just-shipped usability feature; small, testable,
squarely inside PROJECT.md's touch-support scope. Filed as ENH-8 TODO;
a later consumer implements. One-proposal budget spent; no second area
inspected. Not filed: pause-menu/settings/volume (ENH-7 non-goals),
auto-pause on blur (owner behavior decision), marathon-scale pause
neutrality in the signal (autopilot has no pause path; e2e pins neutrality
at small scale - a test-only gap for a test-only mode, too weak to file).
