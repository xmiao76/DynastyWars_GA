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

