Read `AGENTS.md`, `PROJECT.md`, `TASKS.md`, and `PROGRESS.md`.

Execute exactly one bounded CONSUMER iteration:

1. Continue the first `IN_PROGRESS` task, otherwise choose the first `TODO`.
   If neither exists, report IDLE - NO READY WORK without code changes. List
   blocked tasks and what the owner must decide. Do not reopen them. A later
   producer pass may find new work; do not run it in this iteration.
2. Confirm testable acceptance criteria. If information is missing, mark the
   task `BLOCKED` and state exactly what is needed.
3. Count consecutive unsuccessful attempts at this task from current progress.
   If this would be a fourth, mark it `BLOCKED`; record prior approaches and
   why they failed rather than repeating them.
4. Inspect existing code and working changes. Implement the smallest coherent
   change that advances the selected task. Do not overwrite unrelated work.
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
7. Mark `DONE` only when all acceptance criteria and applicable checks pass.
   Otherwise retain `IN_PROGRESS`, or mark a concrete unresolved prerequisite
   `BLOCKED`. If a previously passing signal regresses, prioritize it and report
   REGRESSION rather than claiming completion.
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
