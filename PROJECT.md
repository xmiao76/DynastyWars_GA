# Project Definition

## Summary

- Project name: `Dynasty Wars GA`
- Purpose: `Web browser game, one as similar as 吞食天地2：赤壁之战 as possible.`
- Primary users: `Web browser user`

## Technology

- Language/framework: `TypeScript + Phaser 3.90 (2D game framework) + Vite`
- Package manager: `npm (save-exact, committed lockfile)`
- Runtime/platform: `Static site (dist/) for modern desktop and mobile browsers; Cloudflare Pages target`

## Commands

Use only commands that actually exist in this repository.

- Install: `npm ci` (first time also: `npx playwright install chromium`)
- Development: `npm run dev`
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Unit tests: `npm run test`
- End-to-end tests: `npm run e2e`
- Production build: `npm run build`
- Production-build gate: `npm run prodbuild`
- Producer signal (logic): `npm run signal`
- Producer signal (visual): `npm run vision`

`npm run prodbuild` drives the real `dist/` through `vite preview`. Every
other suite drives the Vite DEV server, but `dist/` is what deploys, and the
two genuinely differ - minification, build-time `define` substitution, the
relative base, static file serving. Whether the game asks a server for baked
art is decided by a build-time constant, so no dev-server test can tell you
what the shipped bundle does. It runs on a dedicated port and never reuses an
existing server: a leftover preview would serve a stale `dist/`, which is the
exact thing this gate exists to catch.

The producer signals exercise the system on its own and report findings.
`npm run signal` is the LOGIC signal (self-play: stages clear, invariants,
perf, seeds, weapons) and covers CO-OP as well as solo - the autopilot drives
both players, and the invariants examine both. A signal that only ever drove
one player would have gone green through every co-op regression. `npm run vision` is the VISUAL signal, and it works at
two levels, because the frame level alone is not enough:

- FRAME: screenshots every core screen (title, select, game idle, combat,
  boss, result, game over) and asserts coverage, color richness, saturation
  and region fill. These catch a broken, empty, dark or flat frame. Frames are
  resampled to the LOGICAL screen size before being measured, so the ruler does
  not change with the render resolution and the probes that index into a frame
  from sim coordinates keep pointing at the right pixels.
- SPRITE + HUD: reads the actual textures out of the running game and asserts
  each one reads as a shape - silhouette complexity, appendage ratio, opaque
  color count and dominance, outline ratio, tonal bands - plus weapon reach
  (the attack pose must extend past idle) and visible pixels in every HUD bar.
  Tonal bands (luminance buckets each holding 2%+ of the drawn area) is the
  metric that survives a move to smooth art: anti-aliasing alone pushes the
  colour count into the hundreds, so that floor stops being able to fail, while
  a band has to hold real area and an anti-aliased ring cannot manufacture one.

The frame metrics are frame-GLOBAL, so a bright backdrop carries them no
matter what the characters look like: a cast of featureless rectangles once
scored 0.93 coverage and 730 colors and shipped. The sprite metrics are
alpha-masked to the sprite itself, so the backdrop cannot contribute. The
suite therefore includes TWO NEGATIVE CONTROLS - a gate that cannot fail proves
nothing, and that is the specific way this one failed before. The first asserts
the character gate REJECTS a patch of empty backdrop. The second exists because
the first has a dependency worth naming: the sky patch only fails while the sky
is flat, so a painted backdrop would make it start passing and the proof would
evaporate without anything going red. The second takes a real sprite out of the
running game and flattens it to one colour, so it does not involve the
background at all - the silhouette still passes every shape metric, and only the
shading metrics catch it.

Metrics cannot judge taste, so the loop also runs an art-director review:
`npm run review:capture` drives the real game to every screen a player sees:
menus, every HUD beat and overlay, all three stages, the end screens, co-op,
phone portrait and landscape, and the shipped WebGL renderer. It
writes screens, zoomed crops, scene inventories and contact sheets to
`artifacts/review/latest/`. A reviewer judges them with the image tool against
the rubric in `docs/VISUAL_REVIEW.md`, finds each root cause, and files UIR
batches. Findings and their verification live in `docs/UI_REVIEW_LEDGER.md`.

Screenshots land in `artifacts/vision/` for a human or model to judge;
failures land in `artifacts/vision/findings.jsonl` and become UI-FIX tasks in
the producer loop. The same sprite gate also runs as a unit test over the
source art (`test/game/artquality.test.ts`), which fails in milliseconds
while art is being drawn. Together these are the loop's way of requiring the
game be BOTH playable (logic) AND look right (visual).
`.loop/eval-loop.md` consumes both; leave it not-applicable and the producer
loop stays inert.

## Initial requirements

1. `Develop a web browser-based game. What is as same as possible with the game "吞食天地2：赤壁之战" ,make the game English user-friendly, with necessary Chinese characters for certain names.`
2. `The game will deploy to Cloudflare website and run in web browsers, but leave the deployment step for me to do manually.`
3. `Use a loop engineering way to develop, test,auto-evaluate and suggest enhancements. Keep looping to enhance the game.`

## Global acceptance criteria

- The requested behavior works as described.
- Existing supported behavior does not regress.
- Relevant tests pass.
- Lint, type checking, and build pass when applicable.
- No credentials, generated secrets, or unintended files are committed.
- For UI work: the visual signal (`npm run vision`) is green - the core
  screens render acceptably (no empty/dark/flat frames). "Passes" for a
  browser game means playable AND looks right.

## Non-goals

- No Capcom copyrighted assets: no original sprites, music, sound effects, or ROM data. All art and audio is original and programmatically generated.
- No backend, server code, accounts, or online multiplayer.
- No deployment automation: deploying to Cloudflare is done manually by the owner.
- Keyboard, gamepad and touch are all supported (ENH-1, ENH-2). On-screen
  controls appear only on devices that have a touchscreen.
- Local 2-player co-op is drop-in (ENH-3): player two joins mid-stage on
  their own keys. Online multiplayer remains out of scope.

## Constraints

- All assets original or programmatically generated; Three Kingdoms historical names are public domain and may be used.
- English UI text, with Chinese characters for proper nouns (character names, place names) only.
- Game logic lives in `src/core/` as pure TypeScript with zero Phaser imports (lint-enforced), so it is unit-testable in Node.
- `SCREEN_WIDTH`/`SCREEN_HEIGHT` (480x270) are WORLD units and the sim's
  geometry is expressed in them, so they never move. The canvas is
  `RENDER_SCALE` times that (`src/game/render.ts`) and every camera is zoomed to
  match, with its origin pinned top-left so the transform is
  `(p - scroll * scrollFactor) * RENDER_SCALE` and logical coordinates work
  unchanged. Anything sized by a raw `setScale` rather than a display size will
  silently change with the texture density; `e2e/artscale.spec.ts` guards that.
  Camera BOUNDS are not used: Phaser's `clampX` assumes a centred origin.
- The simulation must be deterministic: seeded RNG plus fixed 1/60s timestep; no `Math.random` or wall-clock time in core logic.
- Automated browser runs (e2e, producer signals) default to the canvas
  renderer (`?renderer=canvas`) and the autopilot debug bridge
  (`?autopilot=1`) for stability. The visual signal ALSO checks WebGL,
  because the game ships on `Phaser.AUTO` and every real browser gets WebGL:
  a canvas-only gate scores a rendering path no player ever sees. Phaser's
  `Graphics` gradient fills are WebGL-only and draw nothing under canvas, so
  the two renderers can disagree completely while every check stays green.
  `vision/renderer-parity.spec.ts` requires them to agree.

## GA execution and deployment

- Continuation entry point: `AGENTS.md` and `.loop/continue.md` in any capable agent.
- Local dev: http://localhost:5176 (strict port).
- Browser suites: http://localhost:5177, owned by Playwright; no server reuse.
- Production gate: http://localhost:4321, owned by Playwright; no server reuse.
- Runner runtime: Node 20.19+ (current LTS recommended); no PowerShell 7 requirement.
- Loop preview: `npm run loop:check`; configured execution: `npm run loop`.
- DSH-driver execution: `node scripts/run-loop.mjs --begin-manual`, do the
  `.loop/continue.md` iteration in-session, `node scripts/run-loop.mjs
  --finish-manual`. The session is the worker; no subprocess is spawned.
- Offline tooling: `npm run loop:test`, `npm run loop:schedule:test`, `npm run deploy:test`.
- Owner scheduling: `npm run loop:schedule -- preview --delay-seconds 3600`.
  Preview installs nothing. See `docs/SCHEDULING.md` for deliberate activation.
- Owner-only deployment: `deploy.bat`; local-only checks: `deploy.bat --check`.
- Cloudflare Pages project: `dynasty-wars-ga`; production branch: `main`.
- Intended production URL: https://dynasty-wars-ga.pages.dev/ (not provisioned).
- No automatic deployment, cloud creation, push, live model job, or scheduler activation.
- Preserve copied queue state. At migration ART-15 is DONE and DIFF-1 is BLOCKED;
  there is no IN_PROGRESS/TODO task. Auto therefore selects the producer, not scaffolding.
- See `docs/LOOP_ENGINEERING.md`, `docs/SCHEDULING.md`, and `docs/MIGRATION-GA.md`.
  `docs/MIGRATION.md` is the historical CX migration, not GA setup instructions.

## Owner-approved bounded evolution

When no ready task or new actionable defect remains, a producer may inspect ONE
area for a small evidence-backed improvement within this game's existing vision:
usability/accessibility, feedback, original art/audio consistency, robustness,
performance, or meaningful verification coverage. Accept at most ONE proactive
enhancement per producer pass, with a concrete benefit, objective acceptance
criteria, evidence, and non-goals. Check existing tasks/rejections for duplicates.
A later consumer implements the accepted TODO; proposal and implementation must
never happen in the same iteration. Actual regressions outrank enhancements.
Visual-review defects (S1-S3) are not proactive enhancements. The producer
files them as UIR batches of at most six per pass (`docs/VISUAL_REVIEW.md`).
A due review runs even when the queue has ready work.

This is not permission to rebalance DIFF-1, change core game direction, introduce
online/backend scope, acquire copyrighted assets, change deployment/loop controls,
or invent busywork. Owner-blocked decisions remain blocked. If there is no
justified improvement, return IDLE. Finite runner/schedule budgets and human
review govern continuation; the model never schedules its own future work.