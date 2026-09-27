# UI review batches - ready-to-file task text

Committed so it survives artifact cleanup. The producer copies each PENDING
batch (see `docs/UI_REVIEW_LEDGER.md`) into TASKS.md Enhancements, adding the
Status/Source/Evidence lines from the `VISUAL_REVIEW.md` section 4 template, then
marks the batch FILED here and in the ledger. Do not edit a FILED batch.

## UIR batch 1 (FILED 2026-09-27) - ready-to-file tasks (UI review 2026-09-26 @ 3fd3b32)

Findings and evidence: docs/UI_REVIEW_LEDGER.md. File these into TASKS.md
Enhancements in this order, after the reproduce check. Shared acceptance for
every task (VISUAL_REVIEW.md section 4 template, criteria 2 and 3):
recapture with `npm run review:capture`, re-review the affected screens against
`previous/` citing the after-image detail, keep the contact sheets
regression-free, keep `npm run vision` and relevant specs green, and set the
ledger finding to `fixed <commit> (self-check)`.

#### UIR-1 - Separate the stage name from the SCORE readout
- Source: V-1 (S2). Root cause: LAYOUT, src/game/ui/hudlayout.ts:44-45.
- Affected: every in-game screen (45 captures), all stages, phone and WebGL.
- Requirement: re-space the HUD centre column (stage label, score, WAVE chip) so the three lines never share pixels, keeping them inside the 40px band.
- Acceptance: a unit test on hudlayout asserts that the STAGE_LABEL, SCORE and CHIP vertical extents (font size and origin) are disjoint with a gap of at least 1px. The kit suspect "overlapping text" is gone from every manifest entry.
- Non-goals: moving the plates, or changing font sizes except as needed.

#### UIR-2 - Boss WARNING banner must read above the boss rail
- Source: V-2 (S1). Root cause: DEPTH, src/game/scenes/HudScene.ts:670-679 against :325-326.
- Affected: stage1-boss-warning (every boss entry).
- Requirement: while the rail is visible, the banner title must be fully visible. Either raise it above the rail or offset it below the rail. Stage banners keep their current look.
- Acceptance: a spec or unit check shows that the WARNING title's bounds do not intersect the rail's bounds, or that the title's depth is greater than the rail's while both are visible. After the recapture, `stage1-boss-warning--banner` shows the word WARNING.
- Non-goals: the banner's art, or its hold duration.

#### UIR-3 - One stage announcement, not two at once
- Source: V-3 (S2). Root cause: TIMING, src/game/scenes/HudScene.ts:484 against the banner hold at :175.
- Affected: stage1-9 banner and intro.
- Requirement: the intro card must not be raised while the stage banner is visible. Sequence them, or drop the duplicate stage name from one of them.
- Acceptance: a spec shows that no frame has the introCard at alpha > 0 while stageBanner is at alpha > 0.05. Autopilot still dismisses the card by tick count, so `run()` never stalls.
- Non-goals: the lore text, or the card art.

#### UIR-4 - No 7px body-font labels
- Source: V-4 (S2). Root cause: TYPE, `liveStyle(7)` falls back to BODY_STACK. Callers: ResultScene.ts:186, SelectScene.ts:127-128, hudlayout.ts:21 (META_ROW).
- Affected: select-*, stage*-result, webgl-result, stage2/6-play (HORSE row), and the phone screens.
- Requirement: these labels use the display family at a size that is legible on a Pixel 7 (at least 7 CSS px there). Any new glyphs are added to the display string table and font subset.
- Acceptance: the kit suspect "small text <8px" is gone from the manifest, and a unit test asserts that no `liveStyle` caller in the scenes passes a size below the display minimum. The after-review of the result crop, the roster crop and the phone select describes the labels as legible and matching.
- Non-goals: re-laying out the roster cards.

#### UIR-5 - Continue and result panels: fit titles, centre chips, add contrast
- Source: V-5, V-6, V-7 (S2). Root causes: LAYOUT and COLOUR in HudScene.ts:440-448 and ResultScene.ts:98 and 114-116.
- Affected: stage1-continue, stage1-result, stage9-result, webgl-result.
- Requirement: the titles sit inside their card with the same inset as PAUSED. The chip row is centred on the panel and stays inside its frame. The CONTINUE? title and countdown get the dark stroke PAUSED uses.
- Acceptance: a unit or spec check shows that the title bounds lie within the card's panelRect inset by at least 4px, that the chip row's centre is within 1px of the panel's centre, and that no chip crosses the panel's frame.
- Non-goals: the panel textures, or the countdown logic.

#### UIR-6 - Point the touch d-pad chevrons outward
- Source: V-10 (S2). Root cause: ASSET, src/game/art/hudart.ts:487-492 against :498-501.
- Affected: phone-landscape-game, phone-portrait-game.
- Requirement: each arm's chevron points in the direction the arm moves.
- Acceptance: a unit test on the painted sheet shows that the up arm's chevron apex pixel is above its centre, and likewise for the other three arms. After the recapture, the phone crop shows outward arrows.
- Non-goals: the button layout, or the hit areas.

## UIR batch 2 (FILED 2026-09-27) - owner-approved tasks (2026-09-26)

Findings: docs/UI_REVIEW_LEDGER.md (V-9, V-11, V-13); decisions are in its
"Owner decisions" section. File these after batch 1, in this order. The
shared acceptance from batch 1 applies to every task: recapture, review
against `previous/`, clean contact sheets, `npm run vision` green, and the
ledger updated.

Shared constraints for the backdrop tasks UIR-8 to UIR-11:
- Keep the frozen tile geometry, seamless wrapping, determinism and per-stage distinctness (`test/game/backdrop.test.ts` stays green, unedited).
- Paint once at bake time; the per-frame cost does not rise (`npm run signal` performance unchanged).
- Keep the actors reading first: the backdrop stays lower in contrast and saturation than the cast, with light from the upper left per `docs/BODY_STYLE_GUIDE.md`, and every `npm run vision` sprite, HUD and parity gate stays green.
- Use only original art: procedural painterly rendering in `src/game/art/backdrop.ts`, or original baked assets whose provenance is recorded like the hero art. No copyrighted references.
- Each task pins its layer with a texture test that FAILS on the current flat painter and passes on the new one (loop.md step 5). The metric is local tonal variance: the share of 16x16 opaque blocks whose luminance std-dev is at least a stated threshold. Record both values.
- Review criterion: after the recapture, the reviewer scores R5 (art consistency) at least 4 on the affected `stage*-play` screens against `screens/title.png`, citing brushwork, value masses or edges.

#### UIR-7 - Ask portrait phone players to rotate
- Source: V-9 (S2) plus owner decision 1. Root cause: PLATFORM, src/game/main.ts:31-32; there is no orientation handling.
- Affected: phone-portrait-title, -select, -game.
- Requirement: on a touch device in portrait (height greater than width), show a full-screen themed "rotate your phone" overlay (a phone icon plus the text, in the display font, on the letterbox gradient) over the game. Gameplay is paused while the overlay shows and resumes when the phone is rotated back. Desktop and landscape are unchanged.
- Acceptance: an e2e spec on a Pixel 7 portrait context shows the overlay visible and the sim tick not advancing. A landscape context shows no overlay, with ticks advancing. A desktop 960x540 context shows no overlay. The review capture's phone-portrait shots show the overlay, and the landscape shots do not.
- Non-goals: a portrait gameplay layout, or forcing orientation through the Screen Orientation API.

#### UIR-8 - Paint the landmark strip
- Source: V-11 (S2). Root cause: ASSET, `src/game/art/backdrop.ts:318-512` `paintMarks` fillRect blocks, and the hull sink against `MARKS_ROOT_DEPTH` (GameScene.ts:67).
- Affected: all `stage*-play` screens, especially stage1 (gorge), stage6 (warships) and stage7 (inferno).
- Requirement: repaint all nine landmark kinds with painted masses, tonal bands, lit and shadow sides and soft edges, so they recognisably stay the same place. The warship hulls must be visible above the waterline.
- Acceptance: the shared constraints, plus the stage6 after-image shows hulls, masts and sails that read as ships.
- Non-goals: new landmark kinds, or parallax factors.

#### UIR-9 - Paint the sky and clouds
- Source: V-13 (S2). Root cause: ASSET, `paintSky` :63 and `paintCloud` :199 (a flat gradient and hard flat lobes).
- Affected: all `stage*-play` and `stage*-banner` screens.
- Requirement: a painted sky (atmospheric gradient, subtle broken colour, soft light toward the sun side) and painted clouds (soft edges, a lit top and a shaded belly). The ember sky stays distinct.
- Acceptance: the shared constraints.
- Non-goals: weather, time of day, or animated sky.

#### UIR-10 - Paint the hill ridges with atmospheric depth
- Source: V-13 (S2). Root cause: ASSET, `paintRidge` :110 (single-colour hills with an ink line).
- Affected: all `stage*-play` screens.
- Requirement: painted far and near ridges (value falloff with distance, a lit crest and shaded flank, a soft haze join) instead of flat colour plus outline.
- Acceptance: the shared constraints.
- Non-goals: new ridge silhouettes per stage, beyond the existing colour table.

#### UIR-11 - Paint the ground per stage
- Source: V-13 (S2). Root cause: ASSET, `paintGround` :155 (one tint with a dot pattern).
- Affected: all `stage*-play` screens, plus the phone and WebGL shots.
- Requirement: a painted walkable ground (varied grass, earth or stone strokes, horizon-lit to foreground falloff) that stays calm enough for the actors' shadows and hit effects to read.
- Acceptance: the shared constraints, plus the actor ground shadows are still visible in the after-crops.
- Non-goals: collision, or the lane depth.
