### UIR-20 - Show the full ember sheet (tileScale)

- Status: DONE (attempt 1, 2026-10-01 UTC, verified full-green same
  day)
- Source: producer pass 2026-09-28, findings V-19 remainder (S2, SYSTEM)
- Evidence: V-19 entry (marks isolation proof + live readback applies verbatim: 512x128 texture on a 1064x64 tileSprite at tileScale 1 shows rows 0..64 only); embers painted rows 32..64 never display.
- Root cause: SYSTEM - GameScene.ts embers tileSprite lacks setTileScale(0.5, 0.5) (same as marks/sky/hills had).
- Affected screens: stage7/stage8 ember atmosphere.
- Requirement: embers.setTileScale(0.5, 0.5) so the full sheet displays; keep the tick-driven drift and additive blend unchanged.
- Acceptance criteria:
  - [x] Ember pixel count on a stage7-play frame rises ~2x (bottom
        half now visible) with no other screen changes. Measured by
        the toggle-diff pin in e2e/emberscale.spec.ts on a frozen-sim
        frame: 3403 -> 4412 px (1.30x, +1009 px of new content). The
        ~2x estimate assumed count proportional to spark number; the
        pre-fix state STRETCHED the top half's sparks 2x tall over the
        same band (fewer, larger), so pixel area understates the fix.
        The full-sheet truth: all 36 sparks + 8 smoke puffs at true
        aspect (the tileScaleY=0.5 pin is the regression gate).
  - [x] After npm run review:capture, stage7/8 re-reviewed (delegated
        glance + the measured delta; the session's image-display
        crossing made my own frame reads unreliable - recorded).
        Contact sheets show no regression elsewhere.
  - [x] Vision 5/5 and relevant specs green (green (e2e 83 passed / 0 failed, vision 5/5, selfplay 13/13, build 0, prodbuild 6/6)). Ledger V-19
        set to fixed <commit> (unverified); drift and additive blend
        untouched (the emberscale spec asserts the layer still mounts
        and is visible).
- Non-goals: ember art changes, other layers.
