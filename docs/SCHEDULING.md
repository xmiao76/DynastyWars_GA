# Owner-controlled loop scheduling

Scheduling is **opt-in infrastructure**, not something a model iteration starts.
Nothing is installed or enabled by cloning the repository, running tests, or
using `preview`. The scheduler uses Node's standard library and the Windows
`System32\schtasks.exe`; its fixed identity helper uses the built-in Windows
PowerShell 5 (`WindowsPowerShell\v1.0\powershell.exe`), **not PowerShell 7/pwsh**.
Node must satisfy the repository's `engines` requirement.

An OS schedule can outlive the terminal that installed it. It still requires
**this user to be signed in and the machine to be awake**. Logging off, sleep,
hibernation, or shutdown can skip occurrences. This is deliberately not a
24/7 service, wake alarm, catch-up queue, or guaranteed exact-time execution.

## Before installing

1. Read `docs/LOOP_ENGINEERING.md` and select a trusted, noninteractive adapter.
   The checked-in `.loop/config.json` has `version: 1` and `adapter: null`, so
   real scheduling is refused until the owner configures it.
2. Prefer the ignored `.loop/config.local.json` for machine-specific selection.
   It shallowly overlays `.loop/config.json`: an `adapters` object replaces,
   rather than deep-merges, the base adapter map. The base config must itself
   be valid. `--config PATH` instead selects **only that JSON file**, with no
   local overlay; relative paths resolve against the repository root.
3. Generic adapter names select `adapters.NAME` with `executable`, `args`, and
   optional `inheritStdin: false`. Args must carry both `{requestFile}` and
   `{resultFile}`. `adapter: "codex"` explicitly selects the optional built-in
   Codex adapter; it is not a default or a dependency of generic wrappers.
   Scheduled execution refuses `inheritStdin: true`.
4. Remove config `startAt` and nonzero `delaySeconds`; set `intervalSeconds: 0`.
   The OS owns timing. Each trigger overrides config iterations to **one**.
   Configure credentials/tools in the existing signed-in user environment;
   never put credentials or shell commands in schedule arguments.
5. Inspect the executor before scheduling:

   ```text
   node scripts/run-loop.mjs --dry-run
   node scripts/run-loop.mjs --status
   ```

Install and enable independently recheck the effective configuration. This
preflight validates configuration, not model authentication, executable
availability of the selected adapter, permissions, or successful model work.
It does not launch any adapter. It also verifies that the saved Node executable
and `scripts/run-loop.mjs` exist before installation or activation.

## Commands

```text
npm run loop:schedule
npm run loop:schedule -- preview --delay-seconds 600
npm run loop:schedule -- install --delay-seconds 600
npm run loop:schedule -- status
npm run loop:schedule -- enable
npm run loop:schedule -- disable
npm run loop:schedule -- remove
```

- Bare invocation prints preview guidance without reading OS tasks or writing
  files. Omitting an action with timing options also means `preview`.
- `preview` prints the absolute paths, UTC start/end, adapter-preflight result,
  and a **disabled XML template**. `CURRENT_USER_SID` is a placeholder resolved
  to the actual current user only at install; do not manually import the
  preview template. Preview never invokes or queries Task Scheduler and works
  off Windows too. A blocked adapter is reported without concealing the plan.
- `install` is a deliberate OS mutation but creates a **DISABLED** task. It does
  not launch the executor. Allow sufficient time to review and enable it.
- `enable` is the separate activation action. It does not request an immediate
  run, clear a pause, or reset a blocked task. Expired one-shots and recurring
  schedules with no future occurrence are refused.
- `status` is read-only. It validates ownership, shows the task definition,
  current configuration readiness, the runner's pause/last-result summary,
  and localized OS task status/last exit information. An OS exit code is not a
  model result. Missing/inaccessible tasks are reported as **absent or
  unreadable**; localized `schtasks` errors cannot reliably distinguish these.
- `disable` stops future occurrences. `remove` deletes only this repository's
  validated task. Neither action terminates an already-running iteration,
  deletes artifacts, clears locks, nor changes the runner's paused state.
- To change timing or configuration path, explicitly disable/remove the old
  task, then preview/install a new disabled task and enable it separately.
  There is no update/force/overwrite/task-name/run-now switch.

All commands also work directly as `node scripts/schedule-loop.mjs ...`.
Only `preview` and `install` accept schedule/configuration options; management
commands use the configuration path recorded in the owned task.

### One-shot, with timezone

Choose a **future** timestamp; replace these example dates as needed:

```text
npm run loop:schedule -- preview --start-at "2030-04-20T09:00:00-07:00"
npm run loop:schedule -- install --start-at "2030-04-20T09:00:00-07:00"
npm run loop:schedule -- enable
```

Use exactly one of `--start-at ISO` or `--delay-seconds N`. Delay is an integer
from 1 through 2,678,400 seconds (31 days), measured at each command invocation:
previewing a delay does not reserve its absolute time for a later install.
ISO dates require `Z` or an explicit `±HH:MM` offset; date-only, timezone-less,
impossible calendar dates, past starts, leap seconds, and unknown `-00:00`
offsets are rejected. Seconds are optional; fractional seconds use 1–3 digits.
Dates are normalized to UTC. A fixed offset represents an instant, not a
recurring local-time/DST rule.

### Finite recurring schedule

```text
npm run loop:schedule -- preview --start-at "2030-04-20T09:00:00-07:00" --interval-minutes 15 --until "2030-04-20T12:00:00-07:00"
npm run loop:schedule -- install --start-at "2030-04-20T09:00:00-07:00" --interval-minutes 15 --until "2030-04-20T12:00:00-07:00"
npm run loop:schedule -- status
npm run loop:schedule -- enable
```

`--interval-minutes` must be an integer from 1 through 44,640 (31 days, Windows'
repetition bound). It always requires `--until ISO`, strictly later than the
start and at least one interval away. There is no unbounded recurring mode.
The first occurrence is the start; subsequent occurrences are fixed elapsed
intervals **before** the finite end boundary. Work already running at the end
may finish under the executor's timeout. Repetition is not a queued backlog.

For an explicit configuration file, add it to preview and install only:

```text
npm run loop:schedule -- preview --delay-seconds 600 --config "C:\Owner Tools\loop-owner.json"
npm run loop:schedule -- install --delay-seconds 600 --config "C:\Owner Tools\loop-owner.json"
```

## Execution and safety contract

Each task uses these separate executable, arguments, and working-directory
fields (absolute paths are generated from this installation):

```text
Executable: process.execPath (the exact installed Node executable)
Arguments:  <repo>/scripts/run-loop.mjs --scheduled --iterations 1 [--config <absolutePath>]
Directory:  <repo>
```

The scheduler never imports executor modules, invokes npm inside a task,
interprets a shell command, or starts a model itself. XML content is escaped;
Windows argv quoting preserves spaces, Unicode, ampersands, and apostrophes.
Child helpers use `spawn` with `shell: false` and **file-descriptor output**,
not captured stdout/stderr pipes. Temporary XML/helper output is removed after
use. The task XML is UTF-16 with a BOM for Windows' importer.

The deterministic task name is `DynastyWars-Loop-<24 hex characters>` from the
canonical absolute repository path. Production resolves the actual repository
path, not the caller's working directory. Every management operation addresses
only that name and checks its ownership tag, repository/Node/executor paths,
arguments, current-user SID, principal, and trigger/safety settings. It refuses
unrelated or modified tasks. Installation never uses `/F` replacement; explicit
remove uses `/Delete /F` **only after** ownership validation. No arbitrary task
name is accepted. These checks prevent accidental cross-repository edits;
they are not a security boundary against someone who controls your account.
Task Scheduler's `/XML` export omits elements holding schema-default values
(observed live: `RunLevel`, `StartWhenAvailable`, `WakeToRun`, task/trigger
`Enabled`, `StopAtDurationEnd`); the reader interprets each omission as the
secure default the installer writes, and still rejects any present insecure value.

The XML principal is the **current user**, `InteractiveToken`, with limited
privileges (`LeastPrivilege` is XML's spelling of Task Scheduler's **Limited**).
No password is stored or requested, and no SYSTEM, service-account, elevation,
or administrator fallback is used. The XML explicitly chooses:

- `MultipleInstancesPolicy=IgnoreNew`: overlapping scheduled occurrences are
  skipped, not queued; the executor's repository lock also guards manual runs.
- `StartWhenAvailable=false`: missed occurrences are not replayed on wake/login.
- `WakeToRun=false`, no `RestartOnFailure`, no retry/backfill mechanism.
- `AllowStartOnDemand=false`; the scheduler never uses `/Run`.
- Disabled on installation; the time trigger itself is enabled for later use.
- No scheduler execution-time kill; the executor owns its bounded timeout and
  persistent error/pause policy.

Do not move the repository or replace its Node installation while the schedule
is active. Disable/remove it using the original installation first. Changed
paths or manually altered XML fail ownership validation rather than silently
editing a different task; resolve such cases deliberately in Task Scheduler.

## Session-bound alternative (no OS task)

For a loop that lives and dies with the DeepSeek Harness session instead of
Task Scheduler, run `scripts/run-session-loop.ps1` (Windows PowerShell 5.1,
no PowerShell 7 needed) as a foreground job from this repository:

```text
powershell.exe -NoProfile -File scripts\run-session-loop.ps1 -Iterations 24 -IntervalSeconds 3600 -DelaySeconds 3600
```

Each tick runs one `node scripts/run-loop.mjs --iterations 1` — the same
single-iteration contract as an OS trigger — with the lock released between
ticks. Before every tick the script verifies the Harness server process
recorded at startup is still the same live process (PID plus start time, so
PID reuse cannot fool it); if the server is gone it exits with no further
runs. Nothing is registered in the OS, so quitting the Harness ends future
ticks and nothing survives a reboot. Use `-ValidateOnly` to check the binding
without running anything, or `-ServerPid <pid>` if the server runs outside
this process tree. A tick that finds the runner paused (exit 2) ends the loop
for owner review; a busy lock (exit 3) skips to the next tick and stops after
3 in a row; a transient provider skip (exit 4, e.g. quota exhausted) continues
hourly so work resumes when the quota recovers; any other failure stops
immediately. Stopping mid-iteration kills only the wrapper — at most one
already-running iteration finishes on its own bounded timeout. Never combine
this with an OS scheduled task on the same repository; pick one driver so
ticks cannot collide.

## Pause, investigate, then resume

The executor owns `artifacts/loop/state.json`, run records, and the repository
writer lock (`artifacts/loop/run.lock`). Technical failures, invalid reports,
BLOCKED, REGRESSION, and interrupted/unknown work preserve evidence and pause
according to the executor's policy. IDLE ends that occurrence; it does not
promise that a later scheduled occurrence has new work. Schedule enablement
and executor pause are **independent**. Future ticks while paused must not
start new model work.

```text
npm run loop:schedule -- disable
node scripts/run-loop.mjs --status
```

Read the recorded report/logs, solve the actual cause, and get any required
owner decision. Do not mark blocked queue items ready merely to make scheduling
proceed. After the cause is genuinely resolved and no writer is active:

```text
node scripts/run-loop.mjs --resume
node scripts/run-loop.mjs --status
npm run loop:schedule -- status
npm run loop:schedule -- enable
```

If the schedule expired, explicitly remove/install a fresh disabled schedule
instead. Resume is an owner decision, not an automatic scheduler action.
Neither scheduler command auto-removes a stale-looking lock. A crashed lock
requires the executor's explicit recovery procedure **after independently
verifying all writers have stopped**; see `docs/LOOP_ENGINEERING.md`. Never
clear task BLOCKED statuses or locks on the basis of age/PID alone.

## Offline verification

```text
node scripts/test-schedule.mjs
npm run loop:schedule:test
```

The `node:test` suite uses a fake clock, injected fake `schtasks` runner, and a
stub executor. It tests the full disabled-install/enable/status/disable/remove
lifecycle, ownership rejection, config/local overrides, dates/timezones,
interval limits, XML escaping/quoting, and file-FD process execution. It never
installs, queries, enables, removes, or runs a real OS task and never calls a
model. Actual Task Scheduler registration remains an explicit owner action;
offline tests are not evidence of an on-machine registered-task smoke test.
