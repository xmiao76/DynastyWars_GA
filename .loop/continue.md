Read `AGENTS.md`, `PROJECT.md`, `TASKS.md`, and `PROGRESS.md` from this repository.

Execute exactly ONE bounded iteration:
- If `docs/UI_REVIEW_LEDGER.md` has a batch marked PENDING FILING, or a UI
  review is due by `docs/VISUAL_REVIEW.md` section 7, follow `.loop/eval-loop.md`
  first, even when tasks are ready. The visual review is how the queue gets
  its UI work.
- If any task is IN_PROGRESS, follow `.loop/loop.md` for that task.
- Otherwise, if any task is TODO, follow `.loop/loop.md` for the first TODO.
- Otherwise, if PROJECT.md configures producer signals, follow `.loop/eval-loop.md`.
- Otherwise, report IDLE - NO READY WORK, list blocked tasks and their blockers,
  and finish with the IDLE result marker required by AGENTS.md.

Read and follow the selected prompt. Do not run both modes in one iteration.
The producer may propose at most one bounded proactive improvement when signals
are green and the queue has no ready work, as authorized in PROJECT.md. A later
consumer implements it; do not invent a defect or force a proposal to keep busy.

Never reopen a blocked task, start another agent/runner, schedule future work,
modify runner controls, push, deploy, or run deploy.bat. End with exactly one
standalone result marker on the final nonempty line as required by AGENTS.md.
