# Dynasty Wars CX migration

## Snapshot

- Source: `C:\GitHub\DynastyWars`.
- Destination: `C:\GitHub\DynastyWars_CX`; its existing independent Git repository
  and original .gitattributes were retained.
- Working files copied on 2026-09-20 at approximately 12:17 America/Los_Angeles.
- Source HEAD at copy time: `ba46b1458fbc2ba37841bb7485e63341e0e2493d`.
  This is provenance, not a claim that the copy contains only committed files.
- The source loop was active: the snapshot includes an uncommitted
  `src/game/art/draw.ts` edit timestamped 12:17:13, the unfinished ART-15 task,
  package-lock changes, and both `zz-*.test.ts` art probes. No source game file
  was edited by this migration. The original received more edits after copying;
  those later edits were not synchronized into CX.
- TASKS.md, TASKS-ARCHIVE.md and PROGRESS-ARCHIVE.md were copied unchanged.
  ART-15 remains IN_PROGRESS; DIFF-1 remains BLOCKED. The migration adds only a
  progress entry and does not complete, reset, reorder, or implement those tasks.
- All application source, tests, public assets, art workspace and local
  artifacts/evidence were copied. The ignored artifact/art workspace remains
  local and is not included in a Git checkpoint, as in the original.
- Excluded: source .git, Claude session/timer configuration, .wrangler,
  node_modules and node_modules.stuck, dist, browser report caches and secrets.
  Dependencies were installed from the copied lockfile. Build/test outputs are
  generated afresh. No global Codex settings or Cloudflare resources were changed.

## Framework changes

- CLAUDE.md became AGENTS.md. Claude settings and scheduled task files were
  replaced with a trusted-project Codex config and command rules.
- Consumer and producer prompts moved into .codex, with a single continuation
  entry point and explicit terminal result markers.
- The producer's contradictory instruction to both edit detectors and not edit
  source was resolved by filing detector-fix tasks for a later consumer.
- Added a manual, bounded Codex CLI runner with provider/model selection,
  stop-on-error/idle/blocked/regression behavior, per-run reports and an OS lock.
- Added a user-profile template for compatible Responses API providers and
  flags for Codex-supported Ollama/LM Studio models. No specific model is pinned.
- No scheduler or real model loop was started. The executable runner was tested
  offline with a fake CLI; external provider compatibility requires an owner's
  supervised run against their chosen endpoint.
- The installed Codex CLI was 0.153.1. Project config/rules require repository
  trust. The CLI policy checker successfully parsed and rejected direct push and
  Wrangler deployment examples. A --strict-config check is not supported by the
  execpolicy subcommand and was not used as evidence of full configuration loading.

## Local and deployment isolation

- Interactive dev server: port 5174, strict.
- Browser suites: dedicated port 5175, no reuse.
- Production preview gate: dedicated port 4320, no reuse.
- Hard-coded test URLs were made relative to Playwright's base URL. The art
  facesheet helper defaults to the CX interactive server.
- Package identity is dynasty-wars-cx; game title and behavior are preserved.
- deploy.bat accepts only an optional --check argument, verifies the local
  project, then targets Pages project dynasty-wars-cx / production branch main.
  It never inherits the source's deployment cache or permits a project override.
- Intended URL: https://dynasty-wars-cx.pages.dev/ (subject to Cloudflare name
  availability). No Cloudflare login, creation, deployment, DNS change or push
  was performed. The owner runs deploy.bat after local testing.

## Small inherited test fixes

The copied crescent art probe used an explicit any and failed the existing lint
rule. Its context now derives the canvas library's actual type. Both copied
probes create their artifacts output directory so a fresh checkout can run them.
Their art paths, assertions and rendering behavior remain unchanged.

## Validation

| Check | Result |
| --- | --- |
| Locked dependency install | Passed; 140 packages installed |
| Lint | Passed after fixing the copied probe's inherited explicit-any error |
| Type checking | Passed |
| Unit tests | 165 passed; the two adjusted probes also passed a targeted rerun |
| Browser end-to-end suite | 44 passed |
| Logic/self-play signal | 13 passed, including the full nine-stage marathon |
| Visual signal | 5 passed, including Canvas/WebGL parity and both negative controls |
| Production build and browser gate | Build succeeded; 4 passed |
| Offline loop runner | 15 cases passed; no live model call |
| Offline deployment script | 8 cases passed; fake npm/npx only, no Cloudflare call |
| Script syntax / staged diff whitespace | Passed |

The local snapshot is saved in Git after this record; it contains the copied
unfinished work as well as the migration, so future iterations have a restore
point. No remote push was performed.

Local logs and copy integrity details are in artifacts/migration/.
Runner and deployment harness fixtures are under artifacts/loop-tests/ and
artifacts/deploy-tests/ and use fake commands only.

During this migration, the Windows sandbox process could not start (error 1058).
Local checks ran through approved host execution. This does not prove that
unattended sandboxed execution is healthy; check a supervised Codex iteration
before starting the repeating runner. No full-access fallback was added.
