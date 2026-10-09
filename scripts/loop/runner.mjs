import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseArgs, loadConfig, waitMilliseconds, HELP } from './config.mjs';
import { adapterDescription, prepareAdapter, transientPatternsFor } from './adapters.mjs';
import { pathsFor, readState, saveState, inspectLock, acquireLock, releaseManualLock, recoverLock, LockBusy, atomicJson, parseReport, pidMayBeAlive } from './storage.mjs';
import { delay, execute } from './process.mjs';
import { matchTransient, readTailSafe } from './transient.mjs';
import { planIteration, rememberWait, applyOutcome } from './autonomy.mjs';

const PROMPTS = { Auto: 'continue.md', Consumer: 'loop.md', Producer: 'eval-loop.md' };
function readInputs(repoRoot, mode, plan) {
  const names = ['AGENTS.md', 'PROJECT.md', 'TASKS.md', 'PROGRESS.md', `.loop/${PROMPTS[mode]}`];
  for (const name of names) {
    if (!fs.statSync(path.join(repoRoot, name)).isFile()) throw new Error(`Required input is not a file: ${name}`);
  }
  const promptFile = path.join(repoRoot, names.at(-1));
  const instructionsFile = path.join(repoRoot, 'AGENTS.md');
  const input = `Repository: ${repoRoot}\nMode: ${mode}\nRead AGENTS.md, PROJECT.md, TASKS.md and PROGRESS.md before any work. Follow these repository instructions and selected loop prompt. Do not run nested loops or modify runner controls to bypass a pause.\n\n--- AGENTS.md ---\n${fs.readFileSync(instructionsFile, 'utf8')}\n\n--- ${names.at(-1)} ---\n${fs.readFileSync(promptFile, 'utf8')}\n`;
  const selection = plan && plan.kind !== 'legacy' ? `\n\n--- AUTHORITATIVE READY SELECTION ---\n${JSON.stringify(plan)}\nRead docs/LOOP_AUTONOMY.md. Do not reset parked tasks, exceed their envelopes or select an unmet prerequisite.\n` : '';
  return { promptFile, instructionsFile, input: input + selection };
}
function runSummary(metadata) {
  return { runId: metadata.runId, mode: metadata.mode, startedAt: metadata.startedAt, endedAt: metadata.endedAt ?? null, result: metadata.result ?? null, reportPath: metadata.reportPath, metadataPath: metadata.metadataPath, pid: metadata.pid ?? null, worker: metadata.worker ?? 'adapter' };
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
  if (options.preflight) {
    try {
      const state = readState(paths), lock = inspectLock(paths);
      const plan = state.paused || state.activeRun ? { kind: 'safety-paused', reason: state.pauseReason ?? 'unknown active run', notify: true }
        : lock || fs.existsSync(paths.recovery) ? { kind: 'busy', reason: 'writer/recovery lock present', notify: false }
        : planIteration(repoRoot, 'Auto', state);
      io.log(JSON.stringify({ ...plan, readOnly: true, runbook: '.loop/tick.md' }, null, 2));
      return plan.kind === 'safety-paused' ? 2 : plan.kind === 'busy' ? 3 : 0;
    } catch (error) { io.error(error.message); return 1; }
  }
  if (options.checkpointWait) {
    let waitLock;
    try {
      waitLock = acquireLock(paths, repoRoot);
      const state = readState(paths);
      if (state.paused || state.activeRun) { io.log(JSON.stringify({ kind: 'safety-paused', notify: true, reason: state.pauseReason ?? 'unknown active run' })); return 2; }
      const plan = planIteration(repoRoot, 'Auto', state);
      if (plan.kind === 'wait') {
        const remembered = rememberWait(state, plan);
        if (remembered !== state) saveState(paths, remembered);
      }
      io.log(JSON.stringify(plan, null, 2));
      return 0;
    } catch (error) { io.error(error.message); return error instanceof LockBusy ? 3 : 1; }
    finally { if (waitLock) waitLock.release(); }
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

  if (options.beginManual) {
    // Split-phase manual protocol: the DSH driver session itself is the worker.
    // No adapter is resolved or launched, so no adapter configuration is needed.
    // A begin failure never pauses: the worker has not started, so the repo is
    // untouched and the next tick can simply retry. Partial files are inert
    // without an active run; the lock is always unwound on failure.
    let lock;
    let state;
    let metadata;
    try {
      const { config, configFile } = loadConfig(repoRoot, options);
      // Readiness is checked under the writer lock, before creating a run.
      // Nothing reopens an owner-blocked task or clears a global pause.
      const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`;
      const base = path.join(paths.directory, runId);
      const requestFile = `${base}.request.json`;
      const reportPath = `${base}.report.md`;
      const inputFile = `${base}.input.md`;
      lock = acquireLock(paths, repoRoot, { runId });
      state = readState(paths);
      if (state.activeRun) {
        state.paused = true;
        state.pauseReason = 'Interrupted/unknown active run remains in state; review evidence and use --resume';
        saveState(paths, state);
        lock.release(); lock = undefined;
        io.error(`Runner paused: ${state.pauseReason}. Review evidence, then use --resume (does not reset tasks).`);
        return 2;
      }
      if (state.paused) {
        lock.release(); lock = undefined;
        io.error(`Runner paused: ${state.pauseReason}. Review evidence, then use --resume (does not reset tasks).`);
        return 2;
      }
      const plan = planIteration(repoRoot, config.mode, state);
      if (plan.kind === 'wait') {
        const remembered = rememberWait(state, plan);
        if (remembered !== state) saveState(paths, remembered);
        lock.release(); lock = undefined;
        io.log(JSON.stringify({ begun: false, ...plan }, null, 2));
        return 0;
      }
      const mode = plan.mode, inputs = readInputs(repoRoot, mode, plan);
      const request = {
        version: 1, repoRoot, mode, model: config.model, plan,
        promptFile: inputs.promptFile, instructionsFile: inputs.instructionsFile,
        inputFile, reportPath, runId, iteration: 1, scheduled: false,
        createdAt: new Date().toISOString(),
        workspaceFiles: ['AGENTS.md', 'PROJECT.md', 'TASKS.md', 'PROGRESS.md'],
        policy: { sandbox: 'workspace-write', approvalPolicy: 'never', networkAccess: false },
      };
      metadata = {
        version: 1, runId, mode, plan, iteration: 1, scheduled: false,
        adapter: 'manual', worker: 'manual', model: config.model, configFile, startedAt: request.createdAt,
        status: 'manual-begun', reportPath, requestFile, inputFile, metadataPath: `${base}.metadata.json`,
        stdoutPath: `${base}.stdout.log`, stderrPath: `${base}.stderr.log`,
        executable: null, argumentCount: 0, timeoutSeconds: null, pid: null,
      };
      state.activeRun = runSummary(metadata);
      saveState(paths, state);
      atomicJson(requestFile, request);
      fs.writeFileSync(inputFile, inputs.input, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
      fs.writeFileSync(metadata.stdoutPath, '', { encoding: 'utf8', flag: 'wx' });
      fs.writeFileSync(metadata.stderrPath, '', { encoding: 'utf8', flag: 'wx' });
      atomicJson(metadata.metadataPath, metadata);
      io.log(JSON.stringify({ begun: true, runId, mode, plan, reportPath, inputFile, requestFile, metadataPath: metadata.metadataPath }, null, 2));
      return 0;
    } catch (error) {
      io.error(error.message);
      if (lock) {
        try {
          if (state?.activeRun && metadata && state.activeRun.runId === metadata.runId) {
            state.activeRun = null;
            saveState(paths, state);
          }
        } catch (unwindError) { io.error(`State unwind failed; retaining lock: ${unwindError.message}`); return error instanceof LockBusy ? 3 : 1; }
        try { lock.release(); } catch (unwindError) { io.error(`Lock release failed: ${unwindError.message}`); }
      }
      return error instanceof LockBusy ? 3 : 1;
    }
  }
  if (options.finishManual) {
    // Close a begun manual run: validate the worker-written report with the
    // same strict parser, record the result, apply the pause policy, release
    // the lock. Protocol errors (no begun run, foreign lock) change nothing;
    // a missing/invalid report pauses like any invalid auto result, because
    // the worker ran and the repo may be half-written.
    try {
      const state = readState(paths);
      const inspected = inspectLock(paths);
      const runId = state.activeRun?.runId ?? inspected?.owner?.runId ?? null;
      if (!runId || !inspected?.owner || inspected.owner.worker !== 'manual' || inspected.owner.runId !== runId) {
        throw new Error('No begun manual run holds the lock; refusing to finish (no state changed)');
      }
      const metadataPath = state.activeRun?.metadataPath ?? path.join(paths.directory, `${runId}.metadata.json`);
      let metadata;
      try {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      } catch { throw new Error('Manual run metadata is missing or unreadable; refusing to finish (no state changed)'); }
      if (!metadata || metadata.runId !== runId || metadata.worker !== 'manual') throw new Error('Manual run metadata mismatch; refusing to finish (no state changed)');
      try {
        let info = null;
        try { info = fs.statSync(metadata.reportPath); } catch { info = null; }
        if (!info || !info.isFile() || info.size > 16 * 1024 * 1024) throw new Error(`Manual report missing or oversized at ${metadata.reportPath}; the worker must write the final report before --finish-manual`);
        const report = fs.readFileSync(metadata.reportPath, 'utf8');
        const result = parseReport(report);
        const outcome = applyOutcome(repoRoot, state, metadata, report, result);
        metadata.disposition = outcome.disposition;
        metadata.status = 'finished';
        metadata.result = result;
        metadata.endedAt = new Date().toISOString();
        atomicJson(metadata.metadataPath, metadata);
        const resolvedState = outcome.state;
        resolvedState.lastRun = runSummary(metadata);
        if (metadata.plan?.kind === 'producer' && result === 'IDLE') resolvedState.quietFingerprint = metadata.plan.fingerprint;
        saveState(paths, resolvedState);
        Object.assign(state, resolvedState);
        releaseManualLock(paths, runId);
        io.log(`Result: ${result}${outcome.disposition ? ` (${outcome.disposition.kind}; task=${outcome.disposition.taskId ?? 'global'})` : ''}`);
        return state.paused ? 2 : 0;
      } catch (reportError) {
        metadata.status = 'error'; metadata.result = 'UNKNOWN'; metadata.error = reportError.message;
        metadata.endedAt = new Date().toISOString();
        try { atomicJson(metadata.metadataPath, metadata); } catch (writeError) { io.error(`Metadata write failed: ${writeError.message}`); }
        state.lastRun = runSummary(metadata);
        state.activeRun = null;
        state.transientSkips = 0;
        state.paused = true;
        state.pauseReason = reportError.message;
        try { saveState(paths, state); } catch (writeError) {
          io.error(`State write failed; retaining lock: ${writeError.message}`);
          io.error(reportError.message);
          return 1;
        }
        try { releaseManualLock(paths, runId); } catch (writeError) { io.error(`Lock release failed: ${writeError.message}`); }
        io.error(reportError.message);
        return 1;
      }
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
        prepared = { ...loaded, initialDelay: waitMilliseconds(loaded.config) };
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
      if (pidMayBeAlive(state.activeRun?.pid)) { io.error('Recorded active adapter PID may still be live; refusing resume'); return 3; }
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
        const { config, configFile } = prepared;
        let makeCommand;
        for (let iteration = 1; iteration <= config.iterations; iteration++) {
          if (controller.signal.aborted) throw new Error('Runner cancelled');
          const plan = planIteration(repoRoot, config.mode, state);
          if (plan.kind === 'wait') {
            const remembered = rememberWait(state, plan);
            if (remembered !== state) { saveState(paths, remembered); state = remembered; }
            io.log(JSON.stringify({ begun: false, ...plan }, null, 2));
            break;
          }
          makeCommand ??= prepareAdapter(config, repoRoot);
          const mode = plan.mode, inputs = readInputs(repoRoot, mode, plan);
          const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`;
          const base = path.join(paths.directory, runId);
          const requestFile = `${base}.request.json`;
          const reportPath = `${base}.report.md`;
          const inputFile = `${base}.input.md`;
          const request = {
            version: 1, repoRoot, mode, model: config.model, plan,
            promptFile: inputs.promptFile, instructionsFile: inputs.instructionsFile,
            inputFile, reportPath, runId, iteration, scheduled: Boolean(options.scheduled),
            createdAt: new Date().toISOString(),
            workspaceFiles: ['AGENTS.md', 'PROJECT.md', 'TASKS.md', 'PROGRESS.md'],
            policy: { sandbox: 'workspace-write', approvalPolicy: 'never', networkAccess: false },
          };
          // These policy fields are a request to the trusted wrapper, NOT enforcement.
          const command = makeCommand(request, requestFile, inputFile);
          metadata = {
            version: 1, runId, mode, plan, iteration, scheduled: Boolean(options.scheduled),
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
          io.log(`Iteration ${iteration}/${config.iterations} (${mode}); report: ${reportPath}`);
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
          if (execution.error || execution.code !== 0) {
            // Transport failed. Timeouts/cancellations stay fatal (the agent may
            // have been mid-write); a present report with a failed transport is
            // contradictory and also stays fatal. Only a missing report plus a
            // quota/rate-limit signature in stderr skips the tick unpaused, so an
            // hourly driver retries after the quota recovers. The batch ends on
            // a skip: hammering a dead provider N times in a row helps nobody.
            let skip = null;
            if (!execution.timedOut && !execution.cancelled && !fs.existsSync(reportPath)) {
              skip = matchTransient(readTailSafe(metadata.stderrPath), transientPatternsFor(config));
            }
            if (skip) {
              const now = new Date().toISOString();
              metadata.status = 'skipped-transient';
              metadata.result = 'TRANSIENT_SKIP';
              metadata.endedAt = now;
              metadata.transientMatch = skip;
              atomicJson(metadata.metadataPath, metadata);
              state.lastRun = runSummary(metadata);
              state.activeRun = null;
              state.transientSkips = (state.transientSkips ?? 0) + 1;
              state.lastSkipAt = now;
              saveState(paths, state);
              io.log(`Skipped transient provider outage (${skip.source}); ${state.transientSkips} in a row without pausing. Next scheduled tick retries.`);
              metadata = undefined;
              exitCode = 4;
              break;
            }
            throw new Error(execution.error ?? `Adapter exited with code ${execution.code} (signal ${execution.signal ?? 'none'})`);
          }
          if (controller.signal.aborted) throw new Error('Runner cancelled before result acceptance');
          const info = fs.statSync(reportPath);
          if (!info.isFile() || info.size > 16 * 1024 * 1024) throw new Error('Final report must be a regular file no larger than 16 MiB');
          // Never parse stdout, transport events, or arbitrary adapter transcripts
          // for results. The sole exception is above: stderr is scanned for
          // provider-outage signatures only after a failed call with no report.
          const report = fs.readFileSync(reportPath, 'utf8');
          const result = parseReport(report);
          const outcome = applyOutcome(repoRoot, state, metadata, report, result);
          metadata.disposition = outcome.disposition;
          metadata.status = 'finished';
          metadata.result = result;
          metadata.endedAt = new Date().toISOString();
          atomicJson(metadata.metadataPath, metadata);
          state = outcome.state;
          state.lastRun = runSummary(metadata);
          if (plan.kind === 'producer' && result === 'IDLE') state.quietFingerprint = plan.fingerprint;
          saveState(paths, state);
          io.log(`Result: ${result}${outcome.disposition ? ` (${outcome.disposition.kind}; task=${outcome.disposition.taskId ?? 'global'})` : ''}`);
          metadata = undefined;
          if (state.paused) { exitCode = 2; break; }
          if (result === 'IDLE' && outcome.disposition?.kind !== 'WAITING_FOR_PROVIDER') break;
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
      state.transientSkips = 0;
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
