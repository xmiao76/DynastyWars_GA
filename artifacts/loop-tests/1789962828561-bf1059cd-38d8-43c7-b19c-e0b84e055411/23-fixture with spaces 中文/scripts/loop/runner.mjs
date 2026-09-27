import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseArgs, loadConfig, waitMilliseconds, HELP } from './config.mjs';
import { adapterDescription, prepareAdapter } from './adapters.mjs';
import { pathsFor, readState, saveState, inspectLock, acquireLock, recoverLock, LockBusy, atomicJson, parseReport } from './storage.mjs';
import { delay, execute } from './process.mjs';

const PROMPTS = { Auto: 'continue.md', Consumer: 'loop.md', Producer: 'eval-loop.md' };
function readInputs(repoRoot, mode) {
  const names = ['AGENTS.md', 'PROJECT.md', 'TASKS.md', 'PROGRESS.md', `.loop/${PROMPTS[mode]}`];
  for (const name of names) {
    if (!fs.statSync(path.join(repoRoot, name)).isFile()) throw new Error(`Required input is not a file: ${name}`);
  }
  const promptFile = path.join(repoRoot, names.at(-1));
  const instructionsFile = path.join(repoRoot, 'AGENTS.md');
  const input = `Repository: ${repoRoot}\nMode: ${mode}\nRead AGENTS.md, PROJECT.md, TASKS.md and PROGRESS.md before any work. Follow these repository instructions and selected loop prompt. Do not run nested loops or modify runner controls to bypass a pause.\n\n--- AGENTS.md ---\n${fs.readFileSync(instructionsFile, 'utf8')}\n\n--- ${names.at(-1)} ---\n${fs.readFileSync(promptFile, 'utf8')}\n`;
  return { promptFile, instructionsFile, input };
}
function runSummary(metadata) {
  return { runId: metadata.runId, mode: metadata.mode, startedAt: metadata.startedAt, endedAt: metadata.endedAt ?? null, result: metadata.result ?? null, reportPath: metadata.reportPath, metadataPath: metadata.metadataPath, pid: metadata.pid ?? null };
}
export async function main(argv, repoRoot, io = console) {
  let options;
  try { options = parseArgs(argv); } catch (error) { io.error(error.message); return 1; }
  if (options.help) { io.log(HELP); return 0; }
  const paths = pathsFor(repoRoot);
  if (options.status) {
    try {
      const state = readState(paths);
      io.log(JSON.stringify({ version: 1, repoRoot, state, lock: inspectLock(paths), recoveryGuard: fs.existsSync(paths.recovery) }, null, 2));
      return state.paused ? 2 : 0;
    } catch (error) { io.error(`Cannot read status: ${error.message}`); return 1; }
  }
  if (options.recoverLock) {
    try { io.log(JSON.stringify(recoverLock(paths), null, 2)); return 0; } catch (error) { io.error(error.message); return error instanceof LockBusy ? 3 : 1; }
  }
  if (options.dryRun) {
    try {
      const { config, configFile } = loadConfig(repoRoot, options);
      const inputs = readInputs(repoRoot, config.mode);
      const preview = {
        dryRun: true, repoRoot, configFile, mode: config.mode, iterations: config.iterations,
        scheduled: Boolean(options.scheduled), intervalSeconds: config.intervalSeconds,
        delaySeconds: waitMilliseconds(config) / 1000, timeoutSeconds: config.timeoutSeconds,
        adapter: adapterDescription(config), promptFile: inputs.promptFile, instructionsFile: inputs.instructionsFile,
        state: readState(paths), lock: inspectLock(paths),
        note: 'Inspection only: no files created, no lock acquired, no executable resolved/launched. Adapter settings are not a sandbox security boundary.',
      };
      io.log(JSON.stringify(preview, null, 2));
      return 0;
    } catch (error) { io.error(error.message); return 1; }
  }

  let lock;
  let state;
  let metadata;
  let cleanupCertain = true;
  let exitCode = 0;
  const controller = new globalThis.AbortController();
  const cancel = () => controller.abort();
  process.on('SIGINT', cancel);
  process.on('SIGTERM', cancel);
  try {
    let prepared;
    let preflightError;
    if (!options.resume) {
      try {
        const loaded = loadConfig(repoRoot, options);
        prepared = { ...loaded, inputs: readInputs(repoRoot, loaded.config.mode), makeCommand: prepareAdapter(loaded.config, repoRoot), initialDelay: waitMilliseconds(loaded.config) };
      } catch (error) { preflightError = error; }
      if (prepared?.initialDelay) {
        const beforeWait = readState(paths);
        if (beforeWait.paused || beforeWait.activeRun) { io.error('Runner paused or interrupted work remains; review --status before waiting'); return 2; }
        io.log(`Waiting ${prepared.initialDelay / 1000}s before starting; no writer lock held.`);
        await delay(prepared.initialDelay, controller.signal);
      }
      if (controller.signal.aborted) throw new Error('Runner cancelled before lock acquisition');
    }
    lock = acquireLock(paths, repoRoot);
    state = readState(paths);
    if (options.resume) {
      if (state.activeRun) state.lastRun = { ...state.activeRun, result: 'UNKNOWN', endedAt: new Date().toISOString() };
      state.activeRun = null;
      state.paused = false;
      state.pauseReason = null;
      saveState(paths, state);
      io.log('Runner pause cleared. No task status was reset and no adapter was launched.');
    } else {
      if (state.activeRun) {
        state.paused = true;
        state.pauseReason = 'Interrupted/unknown active run remains in state; review evidence and use --resume';
        saveState(paths, state);
      }
      if (state.paused) { io.error(`Runner paused: ${state.pauseReason}. Review evidence, then use --resume (does not reset tasks).`); exitCode = 2; }
      else {
        if (preflightError) throw preflightError;
        const { config, configFile, inputs, makeCommand } = prepared;
        for (let iteration = 1; iteration <= config.iterations; iteration++) {
          if (controller.signal.aborted) throw new Error('Runner cancelled');
          const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`;
          const base = path.join(paths.directory, runId);
          const requestFile = `${base}.request.json`;
          const reportPath = `${base}.report.md`;
          const inputFile = `${base}.input.md`;
          const request = {
            version: 1, repoRoot, mode: config.mode, model: config.model,
            promptFile: inputs.promptFile, instructionsFile: inputs.instructionsFile,
            inputFile, reportPath, runId, iteration, scheduled: Boolean(options.scheduled),
            createdAt: new Date().toISOString(),
            workspaceFiles: ['AGENTS.md', 'PROJECT.md', 'TASKS.md', 'PROGRESS.md'],
            policy: { sandbox: 'workspace-write', approvalPolicy: 'never', networkAccess: false },
          };
          // These policy fields are a request to the trusted wrapper, NOT enforcement.
          const command = makeCommand(request, requestFile, inputFile);
          metadata = {
            version: 1, runId, mode: config.mode, iteration, scheduled: Boolean(options.scheduled),
            adapter: config.adapter, model: config.model, configFile, startedAt: request.createdAt,
            status: 'starting', reportPath, requestFile, inputFile, metadataPath: `${base}.metadata.json`,
            stdoutPath: `${base}.stdout.log`, stderrPath: `${base}.stderr.log`,
            executable: command.executable, argumentCount: command.args.length, timeoutSeconds: config.timeoutSeconds,
          };
          state.activeRun = runSummary(metadata);
          saveState(paths, state);
          atomicJson(requestFile, request);
          fs.writeFileSync(inputFile, inputs.input, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
          atomicJson(metadata.metadataPath, metadata);
          io.log(`Iteration ${iteration}/${config.iterations} (${config.mode}); report: ${reportPath}`);
          const execution = await execute(command, {
            cwd: repoRoot, stdoutPath: metadata.stdoutPath, stderrPath: metadata.stderrPath,
            timeoutSeconds: config.timeoutSeconds, signal: controller.signal,
            onSpawn(pid) {
              metadata.pid = pid;
              metadata.status = 'running';
              atomicJson(metadata.metadataPath, metadata);
              state.activeRun = runSummary(metadata);
              saveState(paths, state);
            },
          });
          cleanupCertain = execution.cleanupCertain;
          metadata.execution = execution;
          if (!cleanupCertain) throw new Error(`${execution.error ?? 'Adapter cleanup failed'}; process-tree cleanup uncertain, retaining lock for manual recovery`);
          if (execution.error || execution.code !== 0) throw new Error(execution.error ?? `Adapter exited with code ${execution.code} (signal ${execution.signal ?? 'none'})`);
          if (controller.signal.aborted) throw new Error('Runner cancelled before result acceptance');
          const info = fs.statSync(reportPath);
          if (!info.isFile() || info.size > 16 * 1024 * 1024) throw new Error('Final report must be a regular file no larger than 16 MiB');
          // Never parse stdout, stderr, transport events or arbitrary adapter transcripts.
          const result = parseReport(fs.readFileSync(reportPath, 'utf8'));
          metadata.status = 'finished';
          metadata.result = result;
          metadata.endedAt = new Date().toISOString();
          atomicJson(metadata.metadataPath, metadata);
          state.lastRun = runSummary(metadata);
          state.activeRun = null;
          state.paused = ['BLOCKED', 'REGRESSION'].includes(result);
          state.pauseReason = state.paused ? result : null;
          saveState(paths, state);
          io.log(`Result: ${result}`);
          metadata = undefined;
          if (state.paused) { exitCode = 2; break; }
          if (result === 'IDLE') break;
          if (iteration < config.iterations && config.intervalSeconds) await delay(config.intervalSeconds * 1000, controller.signal);
        }
      }
    }
  } catch (error) {
    exitCode = error instanceof LockBusy ? 3 : 1;
    io.error(error.message);
    if (lock && state) {
      if (metadata) {
        metadata.status = 'error'; metadata.result = 'UNKNOWN'; metadata.error = error.message;
        metadata.endedAt = new Date().toISOString(); metadata.cleanupCertain = cleanupCertain;
        try { atomicJson(metadata.metadataPath, metadata); } catch (writeError) { io.error(`Metadata write failed: ${writeError.message}`); }
        state.lastRun = runSummary(metadata);
      }
      state.paused = true;
      state.pauseReason = error.message;
      // Preserve the active owner record if children may still write.
      if (cleanupCertain) state.activeRun = null;
      try { saveState(paths, state); } catch (writeError) {
        cleanupCertain = false; // Don't allow another writer after failure to persist the pause.
        io.error(`State write failed; retaining lock: ${writeError.message}`);
      }
    }
  } finally {
    process.off('SIGINT', cancel);
    process.off('SIGTERM', cancel);
    if (lock && cleanupCertain) {
      try { lock.release(); } catch (error) { io.error(error.message); exitCode = 1; }
    } else if (lock) io.error('Lock retained. Verify the whole adapter process tree has stopped before explicit --recover-lock --confirm-no-live-writers.');
  }
  return exitCode;
}
