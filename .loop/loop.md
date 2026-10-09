Read `AGENTS.md`, `PROJECT.md`, `TASKS.md`, and `PROGRESS.md`.

Execute exactly one bounded CONSUMER iteration:

1. Follow runner-selected earliest READY IN_PROGRESS, otherwise first READY
   TODO whose Requires are DONE. Read `docs/LOOP_AUTONOMY.md`, selected spec
   and detail record; skip parked/unready branches without reopening them.
   No ready work: quiet wait, no repo edit/no-op commit/repeated owner question.
2. Confirm testable acceptance and the standing task envelope. Routine local
   diagnosis, proved measurement correction, scoped repair, preparation,
   testing and record close-out are authorized; no artificial per-command/
   render cap. Narrower existing owner exclusions remain binding. New spend,
   waiver, scope or permissions require one consolidated owner notice.
3. Count historical and runtime failed recovery iterations. Three TOTAL
   failures park this task WAITING_FOR_OWNER, not a fourth retry. Two repeated
   failures of one strategy require another viable evidence-backed strategy;
   success/new substep/model doesn't reset attempts. A bad measurement formula
   inside one diagnostic iteration is not itself a failed consumer iteration.
   Park locally using the disposition contract; a safety/regression/unknown
   active writer still globally pauses. Never waive an unknown result.
4. Inspect existing code and working changes. Implement one complete bounded
   work package (≤25min plus finish time): inspect→measure→correct proved
   errors→evaluate→persist evidence→applicable tests→report. No request for
   routine intermediate operations inside the envelope. Do not overwrite
   unrelated work. For one foreground worker, main yields all writes until
   the call settles, then verifies critical diff/evidence; no async continuation.
4a. For a CMR character AUTHORING task, run the Acceptance-4 projection
    gate after EACH sheet acceptance (`scripts/pack-projection.mjs`):
    fix ONE global brief band from the anchor sheet and never silently
    re-center it; steer WARNs inside the reported window; STOP means
    repair or re-shoot an accepted sheet now. When Acceptance 4 fails,
    follow `docs/MOTION_ACCEPTANCE4_RECOVERY.md` on THIS selected task:
    distinguish bad measurement from actual art first, attempt
    deterministic shaft retouch (`scripts/motion-retouch.mjs`, zero
    ledger cost) before image rounds, and only then reserve one focused
    request per round (three rounds per fighter, separately recorded
    51-request reserve), redraw only named cells, preserve originals,
    re-prepare the affected pack and remeasure. Keep the 10%/60-degree
    criteria, all other caps and AGENTS.md's three unsuccessful CONSUMER
    iterations. Unknown measurements are not passes. Never reopen a
    BLOCKED task or start another task, runner or writer to use this
    protocol.
5. Add meaningful tests for changed behavior. When pinning a defect, confirm
   the regression test fails without the fix, then passes with it. Record both.
6. Run relevant PROJECT.md checks. UI-related work also requires `npm run vision`
   and the capture-review cycle in `docs/VISUAL_REVIEW.md` section 5:
   - run `npm run review:capture` BEFORE editing and again after; for a
     character finding, the BEFORE run is `npm run review:capture -- --pin V-n`
     so its pre-fix pixels survive until the verifier has seen them;
   - review the affected screens and crops against `artifacts/review/previous/`
     with the image tool at gameplay size, citing concrete after-image details;
   - glance over the contact sheets for regressions; for character work open
     the before/after pair sheets `artifacts/review/pairs/<V-n>/<id>-pair.png`
     for every fighter the change can reach, all 14 moves;
   - set each listed ledger finding to `fixed <commit> (unverified)`, citing
     the pair sheet. Never write `verified` and never set anatomy-grid cells
     to `N`: only a later producer pass may, on a fresh capture.
   You may append newly noticed findings to `docs/UI_REVIEW_LEDGER.md` as
   `open` with a crop, but do not file tasks for them. If image tools are absent, record
   that limitation, never invent a review. Shipping changes require
   `npm run prodbuild`. A playable but broken or unattractive render is not a
   completed game task, and a task whose own after-review still shows its
   defect is not DONE. Do not weaken gates.
7. Mark DONE only when all acceptance/checks pass. Valid remaining recovery:
   IN_PROGRESS + RECOVERABLE disposition, with truthful recoveryFailed and
   failureSignature. New authority needed/exhausted: task BLOCKED +
   WAITING_FOR_OWNER disposition, independent queue can continue. Disclosed
   future provider recovery: IDLE + WAITING_FOR_PROVIDER with retryAt.
   Regression/safety/unknown: SAFETY_STOP and global pause. Exactly follow
   `docs/LOOP_AUTONOMY.md`; no marker manipulation to disguise a safety issue.
8. Prepend a concise entry at the TOP of PROGRESS.md's Entries section: task,
   attempt number, changes, exact commands/results, reviewed evidence, remaining
   work/blocker, and next action. Never claim an unrun check passed.
9. After successful verification, review the diff and make a local Git commit
   containing only this iteration's files. Do not stage prior migration/user
   changes, credentials, artifacts, or logs. If permissions prevent committing,
   report that limitation; never bypass the host. Never push.
10. Keep working history bounded: above 20 DONE tasks, move the oldest finished
    ones to TASKS-ARCHIVE.md; above 500 progress lines, archive oldest finished
    entries in PROGRESS-ARCHIVE.md. Keep current signal snapshot and unfinished
    evidence. Never archive TODO, IN_PROGRESS, or BLOCKED tasks. Do not read
    archives during an ordinary iteration.

Do not create new requirements, start a second task, invoke another runner,
schedule future work, modify loop control files, deploy, access credentials,
or perform unrelated refactoring. End with exactly one final standalone
LOOP_RESULT marker as specified by AGENTS.md.
