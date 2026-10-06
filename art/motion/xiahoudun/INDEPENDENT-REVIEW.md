# CMR-14A — owner-authorized independent review / conditional reset

## Current state

**Independent review PENDING; no verdict; reset not yet applied.**

Owner request in this session: `do " use one independent visual review to
resolve the head uncertainty, then explicitly reset the task"`.
This supersedes "owner decision absent" as the current blocker. It authorizes
one read-only independent review and a subsequent reset, not fabricated
visual/numerical acceptance, unlimited retries or source changes.

## Reviewer execution evidence

Three routes were attempted for the same review, not three art reviews:

| Reviewer session | Route | Outcome |
| --- | --- | --- |
| `41931e03-fc8a-45a9-9dba-5274c50d9e27` | `muse-subscription-2/muse-spark-1.3`, max | Failed before finishing; no closing message or verdict. |
| `6a5bed32-013e-46d6-8839-3d2934ebfe9a` | Same flagship, xhigh retry | Failed before finishing; no closing message or verdict. |
| `7fa6ad09-a0f8-4720-a618-e13c66571539` | Configured default reviewer fallback | Failed before finishing; no closing message or verdict. |

The tools reported only premature failure, not a verified quota,
authentication or image-access cause. No provider error explanation is
invented. No independent visual observations can be attributed to these
sessions. These are infrastructure failures, not new consumer/art attempts.
No second reviewer opinion was successfully obtained, and the parent agent's
previous self-checks are not relabelled independent.

## Prepared evidence

- [Walk source](walk-prepared-source.png): SHA
  `b395c867c027f837988c5f0fdb676154082d07a43ce9fcc5df8c73786f1bef6c`.
- [Charge override](charge-repair-1-spliced-source.png): SHA
  `b547809c352dd7b8828d20452c0e7f216caede83b1c143374a704a5d301014e4`.
- Existing fixed4x head pairs were regenerated with
  `node scripts/review-xiahoudun-heads.mjs`; all five PNG hashes reproduce
  [historical diagnosis](head-diagnosis.json) exactly.
- New fixture command: `node scripts/review-xiahoudun-charge-fixture.mjs`.
  It renders component-owned pixels without modifying any source,
  at ONE provisional scale0.66 raw-pixel→art-pixel and density2. Approximate
  belt/root and foot placement is ONLY for offline composition, not final
  registration or verified gameplay size.
- [Body pair0](../../../artifacts/motion/xiahoudun/independent-review/body-pair-0.png),
  [body pair1](../../../artifacts/motion/xiahoudun/independent-review/body-pair-1.png),
  [body pair2](../../../artifacts/motion/xiahoudun/independent-review/body-pair-2.png),
  [body pair3](../../../artifacts/motion/xiahoudun/independent-review/body-pair-3.png),
  [body pair4](../../../artifacts/motion/xiahoudun/independent-review/body-pair-4.png).
- [Guard/charge/guard ordered stills](../../../artifacts/motion/xiahoudun/independent-review/guard-charge-guard-stills.png).
  No tick exposures, playback, live game or native-video review claimed.
- [Fixed4x pair1](../../../artifacts/motion/xiahoudun/head-diagnosis/pair-1-fixed4x.png)
  is one quick entry into the existing five head comparisons.

## Required next step under this authorization

Obtain ONE completed independent, pixel-based verdict using these sources
and pairs. Keep anatomical head metrics **UNVERIFIED**, with numeric spread
null when crown/chin cannot be demonstrated. Reviewer must judge head/body
identity and proportions, pose versus actual scale drift, neck continuity,
hands/wrists/grips, coherent spear and transition size pops; list exact
frame IDs for any real defect. Do not supply the reviewer old verdict prose
or require a positive conclusion.

- If acceptable with disclosed occlusion: record scoped visual acceptance
  for the exact source hashes; then reset CMR-14A to TODO under this owner's
  authorization. No numerical head PASS, complete-pack DONE or runtime
  activation is implied. Remaining sheet/pack acceptance still applies.
- If a concrete defect is found: record named cells and required correction;
  the owner-authorized reset may reopen the task with that correction as
  its next bounded target, without accepting defective art.
- If inconclusive: report the uncertainty and ask for an owner judgement;
  do not claim resolution or reset as completed.

Until a completed review exists, CMR-14A stays BLOCKED with the conditional
reset authorization persisted. Image budgets, fixed projection, runtime,
historical retry evidence and scheduler settings are unchanged. No generation
request was made. The old "choose a route/reset" request need not be repeated;
the missing input is now a functioning reviewer or explicit owner-reviewed
fallback verdict, not a missing owner instruction.
