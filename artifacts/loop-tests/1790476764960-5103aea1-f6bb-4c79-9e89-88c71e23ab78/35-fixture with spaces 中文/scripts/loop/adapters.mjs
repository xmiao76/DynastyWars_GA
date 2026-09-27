import fs from 'node:fs';
import path from 'node:path';

function file(candidate) { try { return fs.statSync(candidate).isFile(); } catch { return false; } }
function commandPath(executable, repoRoot) {
  if (path.isAbsolute(executable) || /[\\/]/.test(executable)) return path.resolve(repoRoot, executable);
  return executable;
}
function jsOrNative(executable, args = []) {
  if (/\.(?:cmd|bat|ps1)$/i.test(executable)) throw new Error('Shell shims are not supported: configure a native executable or the actual JavaScript entry file');
  return /\.(?:mjs|cjs|js)$/i.test(executable)
    ? { executable: process.execPath, args: [executable, ...args] }
    : { executable, args };
}
/**
 * Built-in transient-outage signatures for the Codex adapter (regex sources,
 * matched case-insensitively against adapter stderr AFTER a failed call with
 * no report). Grounded in a real failure:
 * `ERROR: exceeded retry limit, last status: 429 Too Many Requests`.
 * A bare "exceeded retry limit" is deliberately NOT matched: without a
 * quota/rate-limit token it may be a persistent 500-class failure, which must
 * stay fail-closed. A "quota" token anywhere (provider, billing, disk) skips:
 * every reading is either transient or self-healing, and skips are bounded by
 * the driver's finite budget.
 */
export const CODEX_TRANSIENT_PATTERNS = [
  '\\b429\\b',
  'too many requests',
  'rate.?limit',
  'quota',
  'insufficient.*(credit|balance|funds)',
];

/**
 * Compiled transient patterns for the SELECTED adapter. Codex merges builtins
 * with its optional custom list; generic adapters use only their declared
 * list (empty = today's behavior: every transport failure is fatal).
 */
export function transientPatternsFor(config) {
  const sources = config.adapter === 'codex' ? [...CODEX_TRANSIENT_PATTERNS] : [];
  const custom = config.adapter ? config.adapters?.[config.adapter]?.transientPatterns : undefined;
  if (Array.isArray(custom)) sources.push(...custom);
  return sources.map((source) => new RegExp(source, 'i'));
}
export function resolveCodex(repoRoot, configured, env = process.env) {
  if (configured) {
    const candidate = commandPath(configured, repoRoot);
    if (candidate === configured && !/[\\/]/.test(candidate) && !path.isAbsolute(candidate)) throw new Error('codex.executable must be an explicit path to the native executable or actual npm JavaScript entry');
    if (!file(candidate)) throw new Error(`Codex entry does not exist: ${candidate}`);
    return jsOrNative(candidate);
  }
  const directories = [path.join(repoRoot, 'node_modules/.bin'), ...(env.PATH ?? env.Path ?? '').split(path.delimiter).filter(Boolean)];
  for (const directory of directories) {
    const base = directory.replace(/^"|"$/g, '');
    const npmEntries = [
      path.join(base, 'node_modules/@openai/codex/bin/codex.js'),
      path.resolve(base, '../@openai/codex/bin/codex.js'),
      path.resolve(base, '../lib/node_modules/@openai/codex/bin/codex.js'),
    ];
    for (const candidate of npmEntries) if (file(candidate)) return jsOrNative(candidate);
    const native = path.join(base, process.platform === 'win32' ? 'codex.exe' : 'codex');
    if (file(native)) {
      const actual = fs.realpathSync(native);
      if (/\.(?:mjs|cjs|js)$/i.test(actual) || process.platform === 'win32') return jsOrNative(actual);
      // npm symlinks resolve to JS above. A Unix shebang script/native binary can exec directly.
      return { executable: actual, args: [] };
    }
  }
  throw new Error('Optional Codex adapter not found. Install it yourself or set adapters.codex.executable to its actual JS/native entry; no npm shell shim fallback.');
}
export function adapterDescription(config) {
  if (config.adapter === null) return { name: null, configured: false, message: 'Adapter not configured; execution disabled' };
  if (config.adapter === 'codex') return { name: 'codex', configured: true, sandbox: 'workspace-write', approvalPolicy: 'never', networkAccess: false, model: config.model, transientPatterns: transientPatternsFor(config).length };
  const adapter = config.adapters[config.adapter];
  if (!adapter) throw new Error(`Adapter ${config.adapter} has no definition in adapters`);
  return { name: config.adapter, configured: true, executable: adapter.executable, argumentCount: adapter.args.length, inheritStdin: adapter.inheritStdin ?? false, model: config.model, transientPatterns: transientPatternsFor(config).length };
}
export function prepareAdapter(config, repoRoot) {
  const description = adapterDescription(config);
  if (!description.configured) throw new Error(description.message);
  if (config.adapter === 'codex') {
    const entry = resolveCodex(repoRoot, config.adapters.codex?.executable);
    return (request, requestFile, inputFile) => ({
      executable: entry.executable,
      args: [...entry.args, 'exec', '--cd', repoRoot, '--sandbox', 'workspace-write',
        '--config', 'approval_policy="never"', '--config', 'sandbox_workspace_write.network_access=false',
        '--color', 'never', ...(config.model ? ['--model', config.model] : []),
        '--output-last-message', request.reportPath, '-'],
      inputFile,
    });
  }
  const adapter = config.adapters[config.adapter];
  return (request, requestFile) => ({
    ...jsOrNative(commandPath(adapter.executable, repoRoot), adapter.args.map((arg) => arg.replaceAll('{requestFile}', requestFile).replaceAll('{resultFile}', request.reportPath))),
    inheritStdin: adapter.inheritStdin ?? false,
  });
}
