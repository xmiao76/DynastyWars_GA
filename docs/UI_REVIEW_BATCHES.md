# UI review batches - ready-to-file task text

Committed so it survives artifact cleanup. The producer copies each PENDING
batch (see `docs/UI_REVIEW_LEDGER.md`) into TASKS.md Enhancements, adding the
Status/Source/Evidence lines from the `VISUAL_REVIEW.md` section 4 template, then
marks the batch FILED here and in the ledger. Do not edit a FILED batch.
From batch 3 on, acceptance for character tasks says the consumer sets its
findings to `fixed <commit> (unverified)` with the pair sheet cited; only a
later producer pass marks them `verified` (VISUAL_REVIEW sections 5-6).

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

## UIR batch 3 (FILED 2026-09-28) - arm-chain residue (fixer's review 2026-09-28 @ e4872ce)

Findings: docs/UI_REVIEW_LEDGER.md V-15b, V-16, V-17, V-18. Evidence paths are
`artifacts/review/latest/anatomy/...` from `npm run review:capture`. Before
filing, the producer re-confirms each on its OWN fresh capture (these were
written by the pass that fixed V-15a/c/d/e, which is not an independent
review). Shared acceptance for every task:
- `test/game/arm-chain.test.ts` stays green, unedited except to ADD a gate
  for the task's own metric (with a negative control).
- `npm run review:capture`; the fixer reviews every affected fighter's
  `anatomy/<id>-pair.png` for all 14 moves and sets the finding to
  `fixed <commit> (unverified)`. Only a later producer pass verifies it.
- `npm run vision` green; handgrip, uir13-gripwrap, bodyparts, handparts,
  likeness and uir15-strikearms stay green unedited.

#### UIR-16 - Keep the far fist off the near arm on two-handed strikes
- Source: V-15b (S2). Root cause: STATE/pose - `src/game/art/armik.ts:273-325` `fitFarHand` places the far grip 12-19u behind the near hand along the haft, which on attack/attack2/thrust/sweep/special lands UNDER the near forearm and elbow (probe: 0 reachable haft points clear the near arm by 2u for guanyu/zhaoyun/spearman/lidian/zhangliao strikes). The far fist (BODY-15, drawn on top so it stays visible) then paints over the near elbow: up to 847 px at 4x (lubu attack), 794 (xuchu attack). `draw.ts` tail `wrapF` adds the fingertips.
- Affected: every polearm fighter, strike moves (grid cells lettered b).
- Requirement: re-choreograph strike grips so the far fist is visible on the haft and not on the near arm: e.g. far grip IN FRONT of the near hand on strikes, or a near-elbow hint that lifts the near arm off the haft line, or a shorter strike separation where the arm clears. Keep UIR-15's "no rails" rule.
- Acceptance: detector `gripFOverNearArm + wrapFOverNearArm` = 0 on all standing moves (add gate G6 to arm-chain.test.ts); `uir15-strikearms` and `handgrip` stay green.
- Non-goals: new hand art (UIR-19), prone poses (UIR-17).

#### UIR-17 - Fold the prone far arm onto the body
- Source: V-16 (S2). Root cause: pose/IK - `src/game/art/weapons.ts:191` `solveArm(base.shoulderF, base.handF, base.elbowF, ...)` for lying fighters picks the elbow branch below the body (elbowF y ~95 vs hip 82), so the far forearm vanishes under the ground line and the relaxed far hand floats alone under the chest in every fighter's `down` tile.
- Affected: all 17 fighters, `down` (cells/<id>-down.png).
- Requirement: choose the prone far-arm pose (owner may prefer the arm across the chest or tucked under the body) and solve the elbow on that branch; if the far arm is fully hidden, hide the far hand too.
- Acceptance: far-chain hole (detector `runF`) <= 1.5u on `down` for all 17 fighters (extend G5 to down); the down tiles show either a connected far arm or no far hand.
- Non-goals: standing poses, the dropped-weapon position.

#### UIR-18 - Connect the relaxed rear hand to a visible forearm
- Source: V-17 (S2). Root cause: pose/draw order - `src/game/art/armik.ts:366` `swungFreeTarget` swings the free far hand just outside the torso while the far arm is drawn behind it (`draw.ts:748-753`), so the hand shows at the hip with 0-15% of its forearm visible (huangzhong idle/walk/hurt/special, weiyan hurt/special, zhangfei hurt).
- Affected: huangzhong (9 moves), weiyan (2), zhangfei (1): cells/huangzhong-idle.png, cells/weiyan-hurt.png.
- Requirement: the visible far hand always has a visible cuff/forearm leading to it (swing further out, or draw the far forearm over the torso edge when the hand is outside the silhouette).
- Acceptance: for every non-gripping standing move, foreArmF visibility >= 25% whenever relaxF is visible (new detector gate); the idle/walk tiles read as one arm.
- Non-goals: gripping poses, hand art.

#### UIR-19 - Paint hands that match the painted sleeves
- Source: V-18 (S2, V-14 J4 residue). Root cause: ASSET - `scripts/prepare-body-parts.mjs:194` `paintHandCell` paints flat skin shapes with bar fingers; next to photographic sleeves they read as mittens on every fighter.
- Affected: every clean sheet (most visible anatomy/lubu.png, anatomy/caocao.png).
- Requirement: hand cells with painted form (knuckles, finger separation, lit/shaded planes, sleeve-matched detail level), keeping cell sizes and pivots so the rig and gates hold.
- Acceptance: handparts/handgrip/uir13 green; reviewer rates J4 ok on all 17 clean sheets.
- Non-goals: rig or pose changes.

## UIR batch 4 (FILED 2026-09-28) - V-19 embers remainder

#### UIR-20 - Show the full ember sheet (tileScale)
- Source: V-19 remainder (S2, SYSTEM). Root cause: the bgEmbers tileSprite shows only texture rows 0..64 of its 512x128 bake (tileScale 1) - the bottom half of the sparks never displays on stage7/8 (proven for marks/sky/hills under UIR-8/9/10; embers share the identical bake pattern).
- Affected: stage7/stage8 ember atmosphere.
- Requirement: embers.setTileScale(0.5, 0.5) so the full sheet displays; keep the tick-driven drift and additive blend unchanged.
- Acceptance: ember pixel count on a stage7-play frame rises ~2x (bottom half now visible) with no other screen changes; review:capture + re-review of stage7/8; vision and relevant specs green; V-19 set to fixed.
- Non-goals: ember art changes, other layers.
