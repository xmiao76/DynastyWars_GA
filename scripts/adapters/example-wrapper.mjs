#!/usr/bin/env node
// Trusted-wrapper integration skeleton; deliberately never invokes a model.
// Copy/adapt this file and point a private .loop/config.local.json at your wrapper.
// argv is literal. Do not use shell:true, eval, or concatenate a shell command.
// Credentials belong in the owner's agent environment, not config/request files.
import fs from 'node:fs';
import path from 'node:path';

const [requestFile, resultFile] = process.argv.slice(2);
if (!requestFile || !resultFile) throw new Error('Usage: example-wrapper.mjs REQUEST_FILE RESULT_FILE');
const request = JSON.parse(fs.readFileSync(requestFile, 'utf8'));
if (request.version !== 1 || path.resolve(request.reportPath) !== path.resolve(resultFile) || process.cwd() !== request.repoRoot) {
  throw new Error('Invalid v1 request/result path or repository cwd');
}
// Request v1: repoRoot, mode, model (nullable), promptFile, instructionsFile,
// inputFile (assembled instructions + selected prompt), reportPath, runId,
// iteration, scheduled, createdAt, workspaceFiles, policy.
// Pass inputFile (or BOTH instructionsFile and promptFile) to your coding agent.
// The wrapper must enforce its actual host permissions and wait for its entire
// child tree. On errors return nonzero. Never derive the report from stdout or
// arbitrary transport transcripts: write ONLY the agent's final response here.
// policy requests workspace-write / approvals never / network disabled, but
// plain JSON and prompts are not a sandbox. No stronger fallback is authorized.
fs.writeFileSync(resultFile,
  'This example is an offline integration skeleton, not a configured coding agent. Implement and review your trusted wrapper before use. No model was called.\nLOOP_RESULT: BLOCKED\n',
  { encoding: 'utf8', flag: 'wx', mode: 0o600 });
