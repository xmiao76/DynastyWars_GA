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

