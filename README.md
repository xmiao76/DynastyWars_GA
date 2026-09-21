# Dynasty Wars GA

A browser beat'em up inspired by classic Three Kingdoms arcade games, built
with the loop-engineering template below. TypeScript + Phaser 3 + Vite, pure
deterministic game core (`src/core/`), fully self-verifying (unit tests, e2e,
self-play producer signal).

## Play locally

```bash
npm ci
npm run dev    # http://localhost:5176
```

Controls: arrows move, Z attack, X jump, C desperation special, M mute.
Gamepad: left stick or D-pad moves, A attacks, B jumps, X/Y fires the special,
Start confirms. Touch: tap to confirm a menu or pick a hero; in a stage an
on-screen pad and A/B/C buttons appear. Keyboard, pad and touch all work at
the same time.
Walk into an enemy to grab, Z to throw.
2-player co-op: player two presses F to drop in at any time, then plays on
WASD with F attack, G jump, H special. They get whichever hero player one did
not pick, and both share the pool of continues. A player who goes down while
the other fights on presses their own attack key to spend a continue and get
back up, and after a party wipe whoever answers the prompt is who returns.
Two controllers also work: pad one drives player one, pad two drives player two.

## Model-neutral loop engineering

GA means a general-purpose, provider-neutral template, not a promise that every
model is equally capable. Use any coding agent with repository and verification
tools; no ChatGPT account, Codex CLI, or PowerShell 7 is required by the framework.

**Continue here or in another agent:** open `C:\GitHub\DynastyWars_GA`, provide
`FIRST_RUN_PROMPT.md`, then say **“Read AGENTS.md and continue using
.loop/continue.md for one iteration.”** This works manually without CLI setup.

The copied queue/history is preserved. There are currently no ready tasks;
`DIFF-1` remains owner-blocked. Auto runs the producer, which may propose one
small evidence-backed enhancement within the existing vision. A separate
consumer implements it, with tests and progress evidence. No re-scaffolding.

For automation, choose/configure a trusted adapter first (none is selected by
default). See [the loop guide](docs/LOOP_ENGINEERING.md) for the generic contract,
optional Codex integration, permissions, and model selection.

```text
npm run loop:check                              # preview; no model call
npm run loop                                   # one iteration, once configured
npm run loop -- --iterations 10 --interval-seconds 60
npm run loop -- --delay-seconds 3600             # one iteration in an hour
npm run loop -- --status
```

### Schedule continuation

```text
npm run loop:schedule -- preview --delay-seconds 3600
npm run loop:schedule -- install --delay-seconds 3600
npm run loop:schedule -- enable
npm run loop:schedule -- status
npm run loop:schedule -- disable
```

Preview installs nothing. Install creates a **disabled**, current-user Windows
task after adapter preflight; enabling is deliberate. Recurring schedules require
an explicit end time. Errors pause model execution until owner review; jobs never
self-schedule. See [scheduling and recovery](docs/SCHEDULING.md) before activation.
No live model job or schedule was started by the migration.
Prefer no OS persistence? `docs/SCHEDULING.md` also documents a session-bound
alternative (`scripts/run-session-loop.ps1`) that ends when the Harness quits.

## Verification

Use Node 20.19+ (current LTS recommended), npm, and Chromium:

```text
npm run lint
npm run typecheck
npm test
npm run e2e
npm run signal
npm run vision
npm run prodbuild
npm run loop:test
npm run loop:schedule:test
npm run deploy:test
```

Install Chromium with `npx playwright install chromium` if missing. Browser
suites own port 5177; production checks use 4321. Dev uses 5176, separate from CX.
Infrastructure tests use stubs and never call models, create tasks, or deploy.
[The GA migration record](docs/MIGRATION-GA.md) distinguishes copied evidence
from verification performed here. `docs/MIGRATION.md` is historical CX provenance.

## Deploy to Cloudflare Pages (owner-only manual step)

Run `deploy.bat` yourself when ready. Its fixed target is `dynasty-wars-ga`,
production branch `main`, intended URL https://dynasty-wars-ga.pages.dev/.
It installs locked dependencies, lints, typechecks, runs unit tests and the
production-build gate before calling Wrangler. `deploy.bat --check` runs local
checks only; loop agents never invoke this script.

Authenticate yourself with `npx wrangler@4 login` if needed. On first deployment,
create a Pages **Direct Upload** project `dynasty-wars-ga` with branch `main`.
Name availability is not guaranteed. No project, deployment, DNS change, push,
or Git auto-deploy connection was created by this migration.