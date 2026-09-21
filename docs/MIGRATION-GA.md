# Dynasty Wars GA migration

## Snapshot and provenance

- Source: `C:\GitHub\DynastyWars_CX`; destination: `C:\GitHub\DynastyWars_GA`.
- Copied 2026-09-20 at approximately 20:36 America/Los_Angeles (UTC-07:00).
- Source HEAD before and after copying: `707fecefeb90479a7b2f0678334bd3f34a9c61fe`.
  Source tracked/untracked working status was clean before and after the copy.
- GA's independent `.git`, branch, remotes and initial commit `5cbc51f` were
  retained. Its existing `.gitattributes` was extended, not replaced by CX's.
- 493 copied files were SHA-256 verified byte-for-byte against CX before edits:
  263 project/art files plus 183 weapon-review, 27 vision, and 20 self-play
  evidence files. The local initial manifest is
  `artifacts/migration-ga/copy-manifest.json`. Subsequent regenerated evidence
  is not the same snapshot; the manifest intentionally records the original copy.
- Included game source/tests, public assets, original raw art, task/history
  documents, and relevant non-secret before/after screenshots and signal data.
- Excluded source Git metadata, active `.codex` controls, dependencies, dist,
  browser report caches, old runner/deployment fixtures, old migration logs,
  live runner state, `.wrangler`, secrets/credential files, `.env*`, PEM/key files,
  and generated weapon baseline source/archive. Junctions were not followed.
- Dependencies were freshly installed from the copied lockfile (140 packages,
  npm reported zero vulnerabilities), not copied from CX.
- No CX or original DynastyWars files were edited. Historical commit IDs and
  `docs/MIGRATION.md` refer to CX/original history, not to GA's independent Git
  history. Preserved weapon screenshots can be compared directly without those
  old commits; `docs/WEAPON_ART.md` explains baseline reconstruction limitations.

## Queue and approved evolution

`TASKS.md`, `TASKS-ARCHIVE.md`, and `PROGRESS-ARCHIVE.md` remain unchanged from
the snapshot. ART-15 is DONE, DIFF-1 is owner-BLOCKED, and no TODO/IN_PROGRESS
task exists. No task was reset, completed, reordered or implemented by migration.
A GA progress entry is added after verification without rewriting earlier entries.

The owner explicitly selected bounded proactive improvements when no ready work
or new defect remains. The neutral producer can propose at most one evidence-backed
small enhancement within PROJECT.md per pass. A separate consumer implements it.
DIFF-1's difficulty policy and other major design choices remain owner decisions;
IDLE is legitimate when no justified proposal exists.

## Framework and isolation changes

- Canonical instructions are AGENTS.md and `.loop/` Markdown/configuration,
  independent of ChatGPT, Codex, DSH, or another model/host.
- A Node runner replaces the Codex-only PowerShell 7 implementation. Defaults
  are vendor-unset, one Auto iteration, 3600-second timeout. Generic trusted
  wrappers receive a versioned request; Codex is optional, not a dependency.
- Strict final-result parsing, persistent error pause, conservative crash locks,
  process-tree cleanup, bounded repetition, delayed start, and recovery commands.
- Optional owner-created Windows Task Scheduler jobs are disabled on install,
  non-overlapping, bounded by end time when recurring, and run as the current
  signed-in user with limited privilege. No schedule is installed by migration.
- Raw CLI transcripts are not accepted as final reports. The generic wrapper
  example is deliberately nonfunctional/BLOCKED until integrated with a host.
- DSH manual continuation works via shared prompts. No headless integration or
  host/global composition/permission/model configuration was changed.
- GA package identity is `dynasty-wars-ga`; the game behavior and original title
  remain unchanged. Ports: dev 5176, browser checks 5177, production gate 4321;
  servers use strict ports and no reuse. Review helper URLs match these ports;
  the face-sheet helper also creates its output folder for clean copies.
- Manual deployment targets only `dynasty-wars-ga` / `main`, intended URL
  `https://dynasty-wars-ga.pages.dev/` (not provisioned or availability-checked).
- Offline tooling tests now use Node; PowerShell entry points are compatibility
  wrappers, not a PowerShell 7 requirement. No new npm dependency was added.

## Verification in GA

This table is for checks performed in GA, not copied claims from CX.

| Check | Result |
| --- | --- |
| Initial copy integrity | 493/493 SHA-256 comparisons matched |
| Locked install | Passed; 140 packages; zero reported vulnerabilities |
| TypeScript | Passed |
| Game unit tests | 178 passed across 24 files |
| Offline deployment checks | 11 tests passed, including 9 stubbed batch cases |
| Lint | Passed after correcting atomic-write cleanup error handling |
| Browser end-to-end | 44 passed |
| Logic/self-play | 13 passed, including all five marathons and the nine-stage campaign |
| Visual signal | 5 passed: nine frames, 202 sprites, 34 weapons, 68 retracts, seven-screen Canvas/WebGL parity, both negative controls, HUD 1/1 |
| Production build/browser gate | Fresh build succeeded; 4 passed |
| Offline runner | 20 test groups passed; timeout/cancellation tree cleanup verified; all fake processes collected |
| Offline scheduler | 35 passed; only fake OS tasks and a stub executor |
| Windows scheduler XML | COM NewTask schema and normalized ownership round-trip passed in memory; no task registered |
| Runner/schedule preview | Passed with adapter unset; no model, task, or live state created |
| Final source/queue integrity | 493 source files still match snapshot; 229 game/queue/archive files unchanged in GA; source Git still clean at the same HEAD |
| Whitespace/history size | Tracked diff and current scripts/loop/docs checks passed; PROGRESS is 490 lines. Import remains intentionally untracked/uncommitted |

### Environment limitations and live-provider boundary

The initial sandboxed `npm ci` failed writing npm's existing user cache. The
exact command was retried with owner-approved broader access and passed.
Typechecking passed confined, but Vitest/Vite and Playwright startup encountered
`spawn EPERM` due to this harness's confined named-pipe restriction. Their exact
local verification commands were retried through approved execution; gates were
not weakened and no unsafe fallback was added to the unattended runner.
Later, the owner changed this session's file policy to full access with approvals
disabled. Final runner tests also verified the successful timeout/cancellation
cleanup paths and collected every mock process. Earlier confined cleanup-denial
cases correctly retained their locks rather than claiming successful termination.

Therefore successful migration checks do not establish that a chosen unattended
agent host can run these tools under its own sandbox. Install/authenticate and
verify permissions in a supervised session first. Missing access must stop or
block the loop, not silently elevate it. Offline adapter tests validate protocol
and orchestration, not universal model quality or live-provider compatibility.

No model API iteration, provider login, scheduler registration/activation,
Cloudflare creation/deployment, DNS change, Git push, or migration commit was
performed. Changes are left in GA's working tree for owner review. Future loop
commits must not sweep this pre-existing migration into an unrelated task.

## Continue

- Manual (any capable agent): provide `FIRST_RUN_PROMPT.md` and then request one
  iteration using `.loop/continue.md`.
- Automation: follow `docs/LOOP_ENGINEERING.md`, configure a reviewed adapter,
  inspect `npm run loop:check`, and run a supervised single iteration.
- Delayed/recurring execution: `docs/SCHEDULING.md` explains previews, explicit
  installation/enabling, status, pause/resume, stale-lock review, and removal.
