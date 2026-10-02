# Loop Engineering GA — model-neutral continuation

GA is this project's general-purpose template, not a vendor product/version or
a certification of every model. The durable workflow is ordinary Markdown;
Node orchestrates optional CLI execution. No mandatory API, subscription, model,
Codex installation, or PowerShell 7 dependency is introduced.

## Continue manually, including in this DSH GUI

1. Open `C:\GitHub\DynastyWars_GA` in any coding agent with file-editing, command,
   and test tools. Keep its normal sandbox and approval controls enabled.
2. Use Node 20.19+ (current LTS recommended), `npm ci`, and, if missing,
   `npx playwright install chromium`. Run a supervised local game/test check.
3. Provide `FIRST_RUN_PROMPT.md`, `AGENTS.md`, and `.loop/continue.md` explicitly
   if the host does not discover project instructions itself.
4. For later iterations say: **Read AGENTS.md and continue using
   .loop/continue.md for exactly one iteration.** The agent reads PROJECT,
   TASKS, and current PROGRESS afresh. It must not reopen completed scaffolding.

The queue copied on 2026-09-20 has no TODO/IN_PROGRESS work. ART-15 is DONE;
DIFF-1 is BLOCKED on an owner difficulty decision. Therefore Auto selects the
producer. A blocked task does not prevent independent work. Owner authorization
permits at most one evidence-backed proactive enhancement per producer pass
within PROJECT.md, implemented only by a later consumer. IDLE is still valid.

Changing models/hosts does not reset the queue, evidence, or three-attempt budget.
A model unable to edit files or run verification cannot complete an unattended
coding iteration just because it can read a prompt. It must report limitations.
Do not run an interactive writer alongside an automated runner.

## Configuration

Canonical files:

- `AGENTS.md`: shared behavior and boundaries.
- `.loop/continue.md`: IN_PROGRESS, then TODO, then producer selection.
- `.loop/loop.md`: one consumer task with acceptance checks and evidence.
- `.loop/eval-loop.md`: logic/visual judgment and bounded proactive proposals.
- `.loop/config.json`: versioned runner defaults, **adapter unset**.
- `.loop/config.schema.json`: documented configuration shape; runtime also validates.
- `.loop/config.local.json`: optional ignored owner override. Never put secrets here.

Defaults are one Auto iteration, no wait, 3600-second per-iteration timeout.
The local file shallowly replaces top-level fields of the checked-in config
(including the entire `adapters` object). With `--config PATH`, only that file
and built-in defaults are used; the local override is not loaded. Relative
config/executable paths resolve from this repository, not the caller's directory.
Unknown fields/options are errors. CLI options override effective config.

### Generic executable adapter — any supported coding host/model

The runner calls a **trusted wrapper** using an executable plus literal arguments,
with repository cwd and no shell interpolation. The wrapper adapts its particular
host's API/CLI, model routing, permission policy, and final-response extraction.
Use an actual native executable or JavaScript entry, not a Windows .cmd/.bat/.ps1
shim. Example `.loop/config.local.json` (replace paths/model before use):

```json
{
  "version": 1,
  "adapter": "myagent",
  "model": "YOUR_TOOL_CAPABLE_MODEL_ID",
  "adapters": {
    "myagent": {
      "executable": "C:/Program Files/nodejs/node.exe",
      "args": ["C:/path/to/my-agent-wrapper.mjs", "{requestFile}", "{resultFile}"],
      "inheritStdin": false
    }
  }
}
```

`.loop/adapter.example.json` and `scripts/adapters/example-wrapper.mjs` show the
contract without contacting a model. **The example deliberately returns BLOCKED;
it is not a working provider adapter.** Implement/audit your host integration
before selecting it. Test it supervised, including an intentional failure, before
scheduling. Switching a compatible model uses `--model` or the configuration;
the wrapper receives that selection and must honor or explicitly reject it.

Request JSON version 1 contains `repoRoot`, `mode`, nullable `model`, `runId`,
`iteration`, `scheduled`, `createdAt`, `reportPath`, `promptFile`,
`instructionsFile`, `inputFile`, `workspaceFiles`, and `policy`.
`inputFile` contains assembled AGENTS instructions and the selected loop prompt;
pass it to the agent, or explicitly supply BOTH instruction and prompt files.
The agent must read the live PROJECT/TASKS/PROGRESS, not a cached snapshot.

Wrapper obligations:

- Honor repository scope, fresh bounded sessions, actual host sandbox/permissions,
  and noninteractive failure when approval is unavailable. Request `policy` fields
  describe intent (workspace-write, no automatic approval, no tool network access);
  JSON/Markdown themselves enforce nothing. Provider communication/authentication
  remains the coding host's responsibility, distinct from tool network permission.
- Write UTF-8 **final assistant report only** at the allocated result path, then
  exit 0. Transport/model failures exit nonzero. Do not extract apparent success
  from streaming tool output or mixed transcripts. Missing/ambiguous reports stop.
- Optional `transientPatterns` (1–20 case-insensitive regexes): if the wrapper
  exits nonzero with no report and stderr matches one, the tick skips unpaused
  (exit 4) so hourly drivers retry after recovery — use it for your host's
  quota/rate-limit signatures. Without it, every transport failure pauses.
- Wait for all child writers; never detach a process/background loop. Timeout or
  Ctrl+C is supervised by the parent, but no portable wrapper can make detached
  processes safe automatically. Child cleanup uncertainty retains the lock.
- Do not put secrets in executable arguments, config, requests, reports, or prompts.
  Use the owner's host authentication or environment. Adapter stdout/stderr may
  contain sensitive provider output; local ignored logs are not safe to publish.

### Optional existing Codex adapter

Codex remains one integration, not the framework. If already installed and
properly authenticated, select it for a supervised run:

```text
npm run loop:check -- --adapter codex
npm run loop -- --adapter codex --model YOUR_AVAILABLE_MODEL_ID
```

Or set `{"version":1,"adapter":"codex","model":null}` in the local config.
No `adapters.codex` entry is needed unless resolution needs an explicit native
or actual npm JS entry path (`{"executable":"C:/.../codex.js"}`). The adapter
resolves supported installed entries without executing a Windows shell shim.
It uses `codex exec`, workspace-write, approval_policy=never, tool network off,
UTF-8 stdin, and the CLI's final-message output file. There is no unsafe fallback.
Model/provider availability and safe policy loading still need a supervised check.
The inherited `docs/codex-compatible.example.toml` is an optional historical
provider example for user configuration; GA never loads it automatically.
Old `-Profile`/`-LocalProvider` PowerShell runner flags are no longer the core API;
configure routing in the chosen host or a reviewed adapter instead.

### DSH unattended limitation

Manual DSH use above works with the current selected model and shared prompts.
The inspected DSH 0.1.5-rc.2 headless interface only accepts a positional task;
it has no per-run model, safe-permission, prompt-file or final-output-file flags.
Saved permission settings can override defaults, and profile startup writes
configuration. Therefore this migration does **not** install a DSH headless/SDK
adapter, modify harness compositions, or assume this Web session's model is the
headless default. Future unattended integration requires separate provisioning,
protocol adaptation, and supervised permission/model validation.

Resolved for the hourly driver on 2026-09-22 without a headless adapter: the
manual protocol (`--begin-manual` / `--finish-manual`) made the driver session
itself the worker after sandboxed sessions proved unable to spawn the Codex
CLI (startup `Access is denied` outside the workspace). No DSH composition
change was needed; the runner still owns locks, state, validation and pause.

## Run and inspect

```text
npm run loop:check
npm run loop -- --mode Consumer
npm run loop -- --mode Producer
npm run loop -- --iterations 10 --interval-seconds 60
npm run loop -- --delay-seconds 3600 --iterations 3
npm run loop -- --start-at "2026-10-01T20:00:00-07:00"
npm run loop -- --timeout-seconds 5400
npm run loop -- --status
node scripts/run-loop.mjs --begin-manual   # DSH-session worker: open one run
node scripts/run-loop.mjs --finish-manual  # ... do the work ... then close it
```

Use a future timestamp within 24 hours for foreground `--start-at`; the date
above is illustrative, not a schedule to copy unchanged. `--delay-seconds` and
`--start-at` are mutually exclusive. Intervals are fixed delays after completion,
not wall-clock catch-up ticks. Iterations are finite (1–1000). Ctrl+C cancels.
Foreground delays require the terminal/process to remain alive; use the owner
Windows scheduler for persistence beyond terminal closure.

`run-loop.bat` forwards the same **double-dash Node options**. Former single-dash
PowerShell flags are not accepted. `loop:check` is nonmutating even without an
adapter: it reports execution disabled. It does not prove provider installation,
authentication, policy enforcement, or live model compatibility.

Each run gets unique request, input, report, metadata, stdout and stderr files
under ignored `artifacts/loop/`. `--status` reads state and lock without requiring
adapter configuration. The runner does not independently certify an agent's
claimed acceptance results; inspect its evidence and retain the project gates.

### CMR Acceptance-4 recovery (owner-approved)

When the selected cast-motion A task fails its head/weapon consistency check,
`.loop/loop.md` directs that same consumer to the [bounded recovery protocol](MOTION_ACCEPTANCE4_RECOVERY.md).
First separate an invalid measurement from a real drawing defect. For a located
art defect, reserve one focused image request before generation, redraw no more
than nine named drawings, preserve originals, rebuild only affected preparation,
and remeasure the entire pack at fixed scale. Up to three rounds per remaining
fighter/horse (51 requests across 17, separate from the original 200 authoring
requests; combined 251), no new Guan Yu generation. The durable repair ledger
rejects an unaccounted pending request and prevents a fourth request. Failed
measurement methods inside a single diagnostic iteration do not count as three
separate unsuccessful **consumer iterations**. Existing three-iteration task
stop, locked writer, provenance, quality thresholds, provider/sandbox and
blocked-task rules still apply; nothing auto-reopens a BLOCKED task or launches
a second runner. A real unresolved visual defect remains IN_PROGRESS/BLOCKED,
never a forced green pass.

| Result | Batch/scheduled behavior | Exit |
| --- | --- | --- |
| COMPLETED / IN_PROGRESS | May continue within requested finite budget | 0 |
| IDLE | End current batch; a separately configured future occurrence may run | 0 |
| BLOCKED / REGRESSION | Persist pause; owner review required | 2 |
| Invalid/missing report, CLI failure, timeout, cancellation | No automatic retry; persist pause after attempted execution | 1 |
| Existing writer/recovery lock | Do not start a model or queue a backlog | 3 |
| Transient provider outage (quota/rate-limit signature, no report) | Skip tick unpaused; hourly drivers retry; consecutive skips counted in state | 4 |
| Manual finish with no begun run, or a foreign lock | No state change; fix the operator sequence | 1 |

The final nonempty line must contain exactly ONE standalone known LOOP_RESULT
marker; duplicates, unknown values, code-fenced markers and trailing prose fail.
A nonzero transport exit cannot be overridden by a report claiming COMPLETED.

### Manual protocol — the DSH session is the worker

`--begin-manual` opens one run without resolving or launching any adapter, so
it needs no adapter configuration: it refuses paused/busy state like auto
mode, writes the same request/input/metadata artifacts, records the active
run, binds `run.lock` to the runId, prints the run JSON, and exits holding the
lock. The driver session then executes `.loop/continue.md` itself with repo
tools only and writes the final report to the printed report path.
`--finish-manual` validates that report with the same strict parser, records
the result, applies the pause policy, and releases the lock. A missing or
invalid report pauses like any invalid auto result, because the worker ran;
a finish with no begun run (or a non-manual lock) changes nothing.

Preserved from auto mode: exclusive lock, active-run bookkeeping, the
BLOCKED/REGRESSION pause policy, exit codes, and crash posture (a dead turn
leaves lock plus active run; ticks skip; the owner verifies no live turn in
chat before explicit recovery). Not preserved: the runner cannot time-box an
agent turn, so the tick runbook carries a ~50-minute timebox instead, and a
worker that cannot finish records IN_PROGRESS honestly for the next tick.
`npm run loop:test` covers begin/finish paths without any provider.

UI iterations need an image-capable worker: the consumer prompt requires
screenshots judged by eye at gameplay size. A worker whose model cannot take
image input must record that limitation and leave eye review to the owner
(artifacts stay under `artifacts/` for inspection); it must never invent a
review. Gates still run in full either way.

## Scheduling and recovery

See [SCHEDULING.md](SCHEDULING.md) for preview/install-disabled/enable, recurring
end-time requirements, signed-in/awake prerequisites, disable/removal and examples.
Each native occurrence runs `--scheduled --iterations 1`; timing is scheduler-owned.
A persistent error pause suppresses subsequent model calls until explicit resume.

The writer lock is exclusive-create `artifacts/loop/run.lock`, not a native OS
flock. Crashes may leave it deliberately. Never delete it based on age/PID alone:
there may be orphan writers or PID reuse. Stop the relevant process tree and
inspect reports/status before `--recover-lock --confirm-no-live-writers`. Recovery
archives the lock and leaves execution paused. Review the unknown outcome, fix
the cause, then use `--resume`; neither command runs a model or resets task states.
A live recorded process or recovery guard prevents automatic recovery. Corrupted
state requires explicit investigation; do not discard evidence to force a run.

## Visual review: the human-in-the-loop art direction

Automated gates prove the game renders; they cannot say whether it looks good.
The visual review closes that gap with a lead-artist cycle:

1. `npm run review:capture` takes 59 screens covering the menus, HUD beats,
   overlays, the nine stages, the end screens, co-op, the horse, the phone and
   WebGL.
2. The reviewer does a blind first look at the contact sheets, then a rubric
   pass (R1–R9) over screens and crops.
3. Each finding gets a `file:line` root cause.
4. Findings are estimated and batched, at most six `UIR-n` tasks per pass.
5. The consumer fixes and self-checks against the `previous/` capture.
6. The next producer independently verifies or reopens each fix.

Owner notes calibrate the review and grow the "Known blind spots" list. The UI
is done after two consecutive reviews with every screen at 4 or above and no
open S1/S2 findings, followed by owner sign-off.

The procedure is in [VISUAL_REVIEW.md](VISUAL_REVIEW.md); the state is in
[UI_REVIEW_LEDGER.md](UI_REVIEW_LEDGER.md). `.loop/continue.md` routes to the
producer whenever a review is due or a batch awaits filing.

## Verification, checkpoints and publishing

`npm run loop:test` and `npm run loop:schedule:test` use isolated fake adapters,
clocks and scheduler calls, never actual providers/tasks. `npm run deploy:test`
uses fake npm/npx commands around a copy of deploy.bat. Full game gates remain
in PROJECT.md. Migration results and operational limitations are recorded in
[the GA migration record](MIGRATION-GA.md), not inferred from CX's historical logs.

Future verified consumer/producer iterations checkpoint only their own files.
The migration is intentionally left uncommitted for owner review; do not sweep
it into an unrelated task commit. Publishing remains owner-only via `deploy.bat`,
fixed to `dynasty-wars-ga` / `main`. No runner, scheduler, build or test deploys.
