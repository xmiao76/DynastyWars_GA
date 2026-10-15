# Dynasty Wars GA

> **▶ Play the demo: https://dynasty-wars-ga.pages.dev/**

## An experiment in Loop Engineering

This repository is first of all an **experimental project built to test a
Loop Engineering framework** — a structured, file-driven way of developing
software with coding models in repeated, bounded iterations. The game is the
test subject, not the point on its own: it was not produced as a
conventionally hand-authored game in one sitting, but developed task by
task through the loop described below, with each iteration required to
leave evidence and pass explicit gates before its work counted as done.

Read it as a case study: what happens when the plan, the queue, the
acceptance criteria, and the verification results all live in the
repository as shared state that any capable model (or human) can pick up,
instead of living in one chat session?

The framework is intentionally generic and portable across capable code
agents and agent hosts. Its contracts are the repository files, the
bounded iterations, the editing and verification tools, and the
verification gates — not a specific vendor, model, or host. (Which
host and models were used to carry out *this* implementation is noted
under [Implementation used for this version](#implementation-used-for-this-version)
below; they are not requirements of the framework.)

## The game in brief

A browser beat'em up inspired by classic Three Kingdoms arcade games.
TypeScript + Phaser 3 + Vite; game logic lives in a pure, deterministic
core (`src/core/`, no Phaser imports — seeded RNG, fixed 1/60s timestep)
so it is unit-testable in Node, and characters are rendered from cast
motion packs. All art and audio is original or programmatically
generated. See [PROJECT.md](PROJECT.md) for the full definition,
constraints, and check list.

## How it was developed: the loop

The framework is ordinary Markdown plus a Node runner. No particular
model, API, or agent host is required by the design
([docs/LOOP_ENGINEERING.md](docs/LOOP_ENGINEERING.md)).

**Persistent files as shared state.** [PROJECT.md](PROJECT.md) defines the
product, constraints, and commands; [TASKS.md](TASKS.md) is the live task
queue (status, prerequisites, acceptance criteria); [PROGRESS.md](PROGRESS.md)
records evidence from each iteration; [AGENTS.md](AGENTS.md) carries the
standing working rules; and the prompts in `.loop/` select what a single
iteration does. A new session — or a different model — resumes by reading
these files afresh; nothing depends on one conversation's memory, and
switching models does not reset the queue, evidence, or retry budgets.

**Two roles, separated.** A *producer* iteration
([.loop/eval-loop.md](.loop/eval-loop.md)) runs the project's logic and
visual signals, judges the findings, and files evidence-backed tasks
with acceptance criteria (or, when no defect remains, at most one small
proactive proposal within the existing vision). A *consumer* iteration
([.loop/loop.md](.loop/loop.md)) implements **exactly one ready task**
at a time — the earliest in-progress task, otherwise the earliest
ready TODO whose prerequisites are done — making the smallest coherent
change within that task's stated scope. Proposing and implementing never
happen in the same iteration.

**Verification before "done".** A task is marked DONE only when its
acceptance criteria and the relevant [PROJECT.md](PROJECT.md) checks
pass. Depending on the change, that stack is: lint and typecheck, unit
tests, end-to-end browser tests, the self-play logic signal
(`npm run signal` — an autopilot plays the game and invariants are
checked, solo and co-op), the visual signal (`npm run vision` —
screenshot/frame and sprite-quality gates), and, for shipping changes,
the production-build gate (`npm run prodbuild`, which drives the real
`dist/` bundle rather than the dev server). UI work additionally goes
through screenshot review: captures of every player-visible screen are
judged against the rubric in [docs/VISUAL_REVIEW.md](docs/VISUAL_REVIEW.md),
findings are filed as tasks, and a later producer independently verifies
or reopens each fix. Unrun checks are never reported as passed, and an
unseen screenshot is never reported as reviewed.

**Scoped commits and an evidence trail.** After successful verification,
an iteration makes a local commit containing only its own changes and
prepends what it did, what it ran, and what remains to
[PROGRESS.md](PROGRESS.md). The runner itself does not certify claimed
results; the project gates and the recorded evidence do.

**Bounded retries, honest blocked states.** Recovery is capped at three
total failed consumer iterations per task; repeating one failed strategy
twice requires a genuinely different, evidence-backed approach, and a
model switch never resets the count. Exhausted tasks are parked as
BLOCKED waiting for the owner rather than retried indefinitely, and only
the owner can reset them ([docs/LOOP_AUTONOMY.md](docs/LOOP_AUTONOMY.md)
describes how task-local waits park one task without stopping
independent work, while regressions and safety stops pause everything).

**Owner decisions stay with the owner.** Irreversible or high-impact
choices are outside the loop's standing authority: pushing, deploying,
spending (for example new asset-generation budgets), core game-direction
changes, and waiving acceptance criteria all require the owner's explicit
decision. Within a ready task, routine steps proceed without asking.

**Economical work packages, reviewed.** Bounded packages of work can be
delegated to an economical worker model as the sole writer within an
assigned file scope, while the main (manager) agent records an
acceptance review of the actual diff and evidence. A first quality
failure gets one targeted correction under the same contract; repeated
failure follows the bounded takeover rules in
[docs/ECONOMIC_TAKEOVER.md](docs/ECONOMIC_TAKEOVER.md). Delegation never
resets task attempts or replaces independent producer verification.

## Implementation used for this version

The framework above is generic by design; this section records only the
stack used to carry out this particular implementation. That work was
done in **DeepSeek Harness** as the agent environment (host/runtime),
with **Muse Spark 1.3** and **Muse Wonder 1.0** as the primary models
operating within it — the main models, not necessarily the only ones.
Neither that host nor those models is required: GA means a
general-purpose, provider-neutral template, not a promise that every
model is equally capable, and any coding agent with repository-editing
and verification tools can run an iteration without a specific account,
CLI, or host.

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

## Running the loop yourself

**Continue here or in another agent:** open this repository, provide
`FIRST_RUN_PROMPT.md`, then say **“Read AGENTS.md and continue using
.loop/continue.md for one iteration.”** This works manually without CLI setup.

The live queue and history are in [TASKS.md](TASKS.md) and
[PROGRESS.md](PROGRESS.md); read them afresh each iteration rather than
trusting this README for current state. Selection automatically routes
to the consumer when ready work exists, otherwise to the producer. No
re-scaffolding.

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

The live demo is at https://dynasty-wars-ga.pages.dev/. Deploying remains
an owner-only manual step: run `deploy.bat` yourself when ready. Its fixed
target is the `dynasty-wars-ga` Pages project, production branch `main`.
It installs locked dependencies, lints, typechecks, runs unit tests and the
production-build gate before calling Wrangler. `deploy.bat --check` runs local
checks only; loop agents never invoke this script.

Authenticate yourself with `npx wrangler@4 login` if needed.
