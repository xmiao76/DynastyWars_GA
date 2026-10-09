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

