# Dynasty Wars GA — model-neutral loop engineering rules

Read `PROJECT.md`, `TASKS.md`, and the current `PROGRESS.md` before changing code.
This is the existing game copied from DynastyWars_CX, not an empty scaffold.
These instructions describe behavior, not a particular model, API, or agent host.

## Choosing an iteration

- When asked to continue or run the loop, follow `.loop/continue.md`.
- Consumer: `.loop/loop.md` implements one ready task.
- Producer: `.loop/eval-loop.md` judges logic and visual signals and files tasks.
- An explicit owner request takes priority over automatic queue selection.
- Give this file and the selected prompt explicitly to agents that do not load
  AGENTS.md automatically. Tools for repository editing and verification are required.

## Working rules

1. Work on only one task per consumer iteration. Continue `IN_PROGRESS` before
   choosing the first `TODO`. Never restart completed scaffolding.
2. Inspect existing code. Make the smallest coherent change within acceptance criteria.
3. Run the relevant `PROJECT.md` checks. Behavior changes need meaningful tests;
   UI changes also require `npm run vision`; shipping changes require `npm run prodbuild`.
4. Mark a task `DONE` only when acceptance criteria and relevant checks pass.
   Otherwise retain `IN_PROGRESS`, or record an exact blocker as `BLOCKED`.
5. Do not attempt the same task a fourth consecutive unsuccessful time. Count
   attempts from the newest `PROGRESS.md` entries; block after three failures.
   Only the owner may reset a blocked task to `TODO`.
6. For attempted work or new findings, prepend evidence, attempt number, remaining
   work and next action at the TOP of the Entries section in `PROGRESS.md`.
   Never claim an unrun check passed or an unseen screenshot was reviewed.
7. After successful verification, make a local Git commit containing only this
   iteration's changes. Inspect existing changes first; do not stage unrelated
   work, credentials, generated artifacts, or logs. If a local commit is denied,
   record that limitation without weakening host permissions. Never push.
8. Move the oldest finished tasks to `TASKS-ARCHIVE.md` above 20 DONE tasks, and
   old finished progress entries to `PROGRESS-ARCHIVE.md` above 500 lines. Preserve
   unfinished-task evidence and the latest signal snapshot. Do not read archives
   during ordinary iterations.
9. Run only one development writer in this repository at a time. During ordinary
   iterations do not start nested runners, background agents, timers, or scheduled
   tasks. Scheduling is an explicit owner action outside the model iteration.
10. When no ready task or new defect remains, the owner permits at most ONE
    evidence-backed proactive proposal per producer pass within PROJECT.md's
    existing vision. Set measurable acceptance criteria and non-goals. Implement
    only in a later consumer iteration. Never invent work just to avoid IDLE,
    reopen owner-blocked decisions, or expand major scope without asking.

## Boundaries

- Work only in this repository. Never modify `C:\GitHub\DynastyWars` or
  `C:\GitHub\DynastyWars_CX`.
- Never read, print, copy, or commit secrets (`.env*`, credentials, `secrets/`).
  Provider authentication belongs in the owner's existing agent/environment setup.
- Never push, deploy, run `deploy.bat`, change cloud resources, or modify DNS.
  Deployment is an owner-only manual action targeting `dynasty-wars-ga`.
- Never run destructive Git/filesystem commands or bypass sandbox/approval controls.
  Markdown and adapter JSON are not security boundaries: preserve the host's
  permissions. Missing tools/access require BLOCKED, not a full-access fallback.
- Never terminate processes you did not start. Scope test-server cleanup to
  ports/PIDs from your own runs; never Stop-Process/taskkill a broad PID list
  (a previous tick killed its own runner and agent this way, ending the loop).
- Never edit loop policy, adapters, lock/state files, or scheduler settings to
  circumvent a blocked iteration. Only an explicit owner infrastructure request
  authorizes changes to these controls.
- Never weaken verification merely to obtain a green result.
- Use GA ports: dev 5176, browser checks 5177, production checks 4321.
  Browser checks own their servers and must not reuse CX or other game servers.

## Runner result

End every loop iteration with exactly ONE standalone marker on its final
nonempty line, choosing one of:
`LOOP_RESULT: COMPLETED`, `LOOP_RESULT: IN_PROGRESS`, `LOOP_RESULT: IDLE`,
`LOOP_RESULT: BLOCKED`, or `LOOP_RESULT: REGRESSION`.
Do not wrap that line in a code fence or repeat it elsewhere in the report.

COMPLETED means a verified finished task or accepted producer proposals;
IN_PROGRESS means an unfinished attempted task; IDLE means no actionable work
or justified new finding; BLOCKED means missing inputs/access/tools or an
exhausted retry budget; REGRESSION means a previously passing signal now fails.
Explain evidence before the marker. The runner ends the batch on IDLE and pauses
on BLOCKED, REGRESSION, or technical/invalid outcomes until the owner reviews it.
Narrow exception: if the SOLE blocker is a provider quota/rate-limit error
likely to recover, end IDLE (not BLOCKED) with first line
`QUOTA-WAIT: <evidence>` — hourly drivers retry; anything else still BLOCKEDs.
