import fs from 'node:fs';
import path from 'node:path';

export const DEFAULTS = Object.freeze({ version: 1, adapter: null, model: null, mode: 'Auto', iterations: 1, intervalSeconds: 0, timeoutSeconds: 3600, adapters: {} });
const valueFlags = new Map([
  ['--mode', 'mode'], ['--config', 'config'], ['--adapter', 'adapter'], ['--model', 'model'],
  ['--iterations', 'iterations'], ['--interval-seconds', 'intervalSeconds'],
  ['--delay-seconds', 'delaySeconds'], ['--start-at', 'startAt'], ['--timeout-seconds', 'timeoutSeconds'],
]);
const boolFlags = new Map([
  ['--dry-run', 'dryRun'], ['--scheduled', 'scheduled'], ['--status', 'status'],
  ['--resume', 'resume'], ['--recover-lock', 'recoverLock'], ['--confirm-no-live-writers', 'confirmNoLiveWriters'],
  ['--help', 'help'],
]);
const configKeys = new Set([...Object.keys(DEFAULTS), 'delaySeconds', 'startAt']);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
function text(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.includes('\0')) throw new Error(`${label} must be a nonempty string without NUL`);
}
function number(value, label, min, max, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new Error(`${label} must be ${integer ? 'an integer' : 'a number'} from ${min} to ${max}`);
  }
}
export function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const key = valueFlags.get(flag) ?? boolFlags.get(flag);
    if (!key) throw new Error(`Unknown argument: ${flag}`);
    if (Object.hasOwn(options, key)) throw new Error(`Duplicate argument: ${flag}`);
    if (boolFlags.has(flag)) options[key] = true;
    else {
      const value = argv[++i];
      if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
      options[key] = ['iterations', 'intervalSeconds', 'delaySeconds', 'timeoutSeconds'].includes(key)
        ? (/^(?:\d+\.?\d*|\.\d+)$/.test(value) ? Number(value) : NaN) : value;
    }
  }
  const admin = ['status', 'resume', 'recoverLock'].filter((key) => options[key]);
  if (admin.length > 1) throw new Error('Choose only one of --status, --resume, --recover-lock');
  if (admin.length && Object.keys(options).some((key) => ![...admin, 'config', 'confirmNoLiveWriters'].includes(key))) {
    throw new Error('Administrative commands cannot be combined with execution options');
  }
  if (options.confirmNoLiveWriters && !options.recoverLock) throw new Error('--confirm-no-live-writers requires --recover-lock');
  if (options.recoverLock && !options.confirmNoLiveWriters) throw new Error('Recovery requires --recover-lock --confirm-no-live-writers after independently verifying no live repository writers');
  if (options.delaySeconds !== undefined && options.startAt !== undefined) throw new Error('Choose --delay-seconds OR --start-at');
  if (options.scheduled && ((options.iterations !== undefined && options.iterations !== 1) || ['intervalSeconds', 'delaySeconds', 'startAt'].some((key) => options[key] !== undefined))) {
    throw new Error('--scheduled requires one iteration and no CLI interval/delay/start-at');
  }
  return options;
}
export function validateConfig(raw) {
  if (!object(raw) || raw.version !== 1) throw new Error('Configuration must be an object with version: 1');
  for (const key of Object.keys(raw)) if (!configKeys.has(key)) throw new Error(`Unknown configuration field: ${key}`);
  const config = { ...DEFAULTS, ...raw };
  if (config.adapter !== null) { text(config.adapter, 'adapter'); if (!/^[a-zA-Z][\w-]*$/.test(config.adapter)) throw new Error('Invalid adapter name'); }
  if (config.model !== null) text(config.model, 'model');
  if (typeof config.mode !== 'string' || !/^(auto|consumer|producer)$/i.test(config.mode)) throw new Error('mode must be Auto, Consumer, or Producer');
  config.mode = config.mode[0].toUpperCase() + config.mode.slice(1).toLowerCase();
  number(config.iterations, 'iterations', 1, 1000, true);
  number(config.intervalSeconds, 'intervalSeconds', 0, 86400);
  number(config.timeoutSeconds, 'timeoutSeconds', 0.001, 86400);
  if (config.delaySeconds !== undefined) number(config.delaySeconds, 'delaySeconds', 0, 86400);
  if (config.startAt !== undefined) {
    text(config.startAt, 'startAt');
    const parts = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:\.\d{1,3})?(?:Z|[+-](\d\d):(\d\d))$/.exec(config.startAt);
    if (!parts || !Number.isFinite(Date.parse(config.startAt))) throw new Error('startAt must be an ISO timestamp with an explicit UTC offset or Z');
    const [, year, month, day, hour, minute, second, offsetHour = '0', offsetMinute = '0'] = parts;
    const days = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
    if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > days || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59 || Number(offsetHour) > 23 || Number(offsetMinute) > 59) {
      throw new Error('startAt contains an invalid calendar date, time, or UTC offset');
    }
  }
  if (config.delaySeconds !== undefined && config.startAt !== undefined) throw new Error('Choose delaySeconds OR startAt');
  if (!object(config.adapters)) throw new Error('adapters must be an object');
  for (const [name, adapter] of Object.entries(config.adapters)) {
    if (!/^[a-zA-Z][\w-]*$/.test(name) || !object(adapter)) throw new Error(`Invalid adapter definition: ${name}`);
    const keys = name === 'codex' ? ['executable'] : ['executable', 'args', 'inheritStdin'];
    for (const key of Object.keys(adapter)) if (!keys.includes(key)) throw new Error(`Unknown adapter field ${name}.${key}`);
    if (name === 'codex') { if (adapter.executable !== undefined) text(adapter.executable, 'codex.executable'); continue; }
    text(adapter.executable, `${name}.executable`);
    if (!Array.isArray(adapter.args) || adapter.args.some((arg) => typeof arg !== 'string' || arg.includes('\0'))) throw new Error(`${name}.args must be an array of strings`);
    for (const placeholder of ['{requestFile}', '{resultFile}']) {
      if (!adapter.args.some((arg) => arg.includes(placeholder))) throw new Error(`${name}.args must include ${placeholder}`);
    }
    for (const arg of adapter.args) {
      if (/\{[^{}]*\}/.test(arg.replaceAll('{requestFile}', '').replaceAll('{resultFile}', ''))) throw new Error(`Unsupported placeholder in ${name}.args`);
    }
    if (adapter.inheritStdin !== undefined && typeof adapter.inheritStdin !== 'boolean') throw new Error(`${name}.inheritStdin must be boolean`);
  }
  return config;
}
export function loadConfig(repoRoot, options) {
  const file = options.config ? path.resolve(repoRoot, options.config) : path.join(repoRoot, '.loop/config.json');
  let raw = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  // Validate each effective config: CLI overrides must not hide malformed settings.
  validateConfig(raw);
  const localFile = path.join(repoRoot, '.loop/config.local.json');
  if (!options.config && fs.existsSync(localFile)) {
    const local = JSON.parse(fs.readFileSync(localFile, 'utf8').replace(/^\uFEFF/, ''));
    if (!object(local)) throw new Error('Local configuration must be an object');
    raw = { ...raw, ...local };
    validateConfig(raw);
  }
  const overrides = Object.fromEntries(Object.entries(options).filter(([key]) => configKeys.has(key)));
  if (options.delaySeconds !== undefined) delete raw.startAt;
  if (options.startAt !== undefined) delete raw.delaySeconds;
  const config = validateConfig({ ...raw, ...overrides });
  if (options.scheduled) {
    if (config.adapter && config.adapters[config.adapter]?.inheritStdin) throw new Error('--scheduled cannot use an adapter with inheritStdin:true');
    config.iterations = 1;
    config.intervalSeconds = 0;
    delete config.delaySeconds;
    delete config.startAt;
  }
  return { config, configFile: file };
}
export function waitMilliseconds(config, now = Date.now()) {
  if (config.startAt !== undefined) {
    const remaining = Date.parse(config.startAt) - now;
    if (!Number.isFinite(remaining) || remaining <= 0) throw new Error('startAt must be in the future');
    if (remaining > 86400000) throw new Error('startAt must be no more than 24 hours ahead');
    return remaining;
  }
  return (config.delaySeconds ?? 0) * 1000;
}
export const HELP = `Usage: node scripts/run-loop.mjs [options]
  --mode Auto|Consumer|Producer  (case insensitive; default Auto)
  --config PATH                 default .loop/config.json; relative to repository
  --adapter NAME                configured trusted wrapper, or optional codex
  --model TEXT                  optional, forwarded without a vendor default
  --iterations 1..1000           default 1
  --interval-seconds 0..86400    default 0; between successful iterations
  --delay-seconds 0..86400       OR --start-at ISO_WITH_OFFSET (within 24h)
  --timeout-seconds .001..86400  default 3600 per adapter call
  --scheduled                   one occurrence (schedulers should use --iterations 1)
  --dry-run                     inspect only; no writes or adapter launch
  --status                      read state/lock, no adapter or configuration needed
  --resume                      clear pause only; never edit/reset tasks or run a model
  --recover-lock --confirm-no-live-writers
                                explicit recovery only; verify ALL writers stopped
Exit codes: 0 normal/IDLE; 1 error/unknown; 2 blocked/regression/paused; 3 lock busy.
Wrapper settings describe intent, not sandbox enforcement. Trust your configured wrapper.`;
