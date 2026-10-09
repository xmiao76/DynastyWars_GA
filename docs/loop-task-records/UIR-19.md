### UIR-19 - Paint hands that match the painted sleeves

- Status: BLOCKED (3 attempts exhausted 2026-10-01 UTC - rule 5.
  Progress: form pass (knuckles/planes) + face-matched tones all
  landed and measured; J4 verdicts 5/17 -> 9/17 -> 12/17. Remaining
  5 need owner scope: zhangliao/huangzhong read lighter than the
  FACE IMPRESSION (the p80 reference overshoots perceived tone) and
  caocao/xiahoudun/weiyan read pale at 5px figure scale (the lit
  caps/bloom dominate the tiny hand) though their cells are
  byte-tan. NEEDS OWNER DECISION: (a) accept 12/17 as a partial
  V-18 fix and re-scope the finding; (b) authorise a 4th pass:
  small-scale read fix (cap/bloom downsizing) + face-impression
  matching; (c) authorise a per-hand-kind art remake (the task's
  original "split per hand kind" allowance); (d) revert the tone
  work, keep the form pass. Only the owner may reset to TODO.)
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

