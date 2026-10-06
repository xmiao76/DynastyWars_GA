// Owner-authorized Acceptance-4 repair reserve. This is separate from the
// existing 200-request authoring ledger; it NEVER resets or edits that ledger.
// One request per round, up to three rounds per remaining fighter/horse.
// Model/image tools are not invoked here: the consumer must reserve first,
// inspect the actual source art, and settle every request with evidence.
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs'
import { dirname } from 'node:path'
import { totalUsed } from './motion-budget.mjs'

export const REPAIR_ROUNDS = 3
export const ELIGIBLE_FIGHTERS = [
  'soldier', 'spearman', 'archer', 'zhangfei', 'zhaoyun', 'weiyan',
  'huangzhong', 'lidian', 'xiahoudun', 'xuchu', 'horse',
]
export const REPAIR_RESERVE = ELIGIBLE_FIGHTERS.length * REPAIR_ROUNDS
export const COMBINED_CAP = 200 + REPAIR_RESERVE
export const DEFAULT_REPAIR_PATH = 'art/motion/acceptance4-repair-budget.json'
const ids = new Set(ELIGIBLE_FIGHTERS)
const hash = /^[a-f0-9]{64}$/
const states = new Set(['accepted', 'rejected', 'tool-failed'])

export function emptyRepairLedger() {
  return { version: 1, perFighterCap: REPAIR_ROUNDS, combinedCap: COMBINED_CAP, fighters: {} }
}

export function readRepairLedger(path = DEFAULT_REPAIR_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function saveRepairLedger(ledger, path = DEFAULT_REPAIR_PATH) {
  validateLedger(ledger)
  mkdirSync(dirname(path), { recursive: true })
  const temp = `${path}.next`
  writeFileSync(temp, `${JSON.stringify(ledger, null, 2)}\n`, { flag: 'wx' })
  renameSync(temp, path)
}

function validateLedger(ledger) {
  if (!ledger || ledger.version !== 1 || ledger.perFighterCap !== REPAIR_ROUNDS || ledger.combinedCap !== COMBINED_CAP || !ledger.fighters || typeof ledger.fighters !== 'object') {
    throw new Error('repair: invalid budget ledger; do not reset or overwrite it')
  }
  for (const [fighter, entry] of Object.entries(ledger.fighters)) {
    if (!ids.has(fighter) || !Array.isArray(entry.rounds) || entry.rounds.length > REPAIR_ROUNDS) throw new Error(`repair: invalid round history for ${fighter}`)
    if (entry.rounds.some((round, i) => round.number !== i + 1 || !['pending', ...states].includes(round.status))) throw new Error(`repair: corrupt round history for ${fighter}`)
  }
}

export function repairUsed(ledger) {
  validateLedger(ledger)
  return Object.values(ledger.fighters).reduce((sum, entry) => sum + entry.rounds.length, 0)
}

/** A pending reservation counts as spent, even after a crash/restart. */
export function remainingRepairRounds(ledger, fighter) {
  validateLedger(ledger)
  if (!ids.has(fighter)) return 0 // Guan Yu is locked; no new generation.
  return REPAIR_ROUNDS - (ledger.fighters[fighter]?.rounds.length ?? 0)
}

/** Classify an Acceptance-4 result without rewriting the numerical gate. */
export function repairDecision({ measurements, uncertain, artDefects, roundsLeft }) {
  if (!Number.isInteger(roundsLeft) || roundsLeft < 0 || roundsLeft > REPAIR_ROUNDS) throw new Error('repair: invalid remaining rounds')
  if (measurements === 'pass' && !uncertain && !artDefects) return 'pass'
  if (measurements === 'method-invalid' && !artDefects) return 'remeasure' // no image request
  if (artDefects && roundsLeft > 0) return 'targeted-redraw'
  return 'blocked' // unknown is never passed by cosmetic redraw or a relaxed threshold
}

/** Reserves ONE focused request. Does not mutate either input on rejection. */
export function reserveRepairRound(ledger, authoringLedger, fighter, { cells, failure, sourceSha256, kind = 'focused' }) {
  validateLedger(ledger)
  if (!ids.has(fighter)) throw new Error(`repair: ${fighter} is not in the owner-approved remaining cast`)
  if (kind !== 'focused') throw new Error('repair: whole-sheet retries are not authorized by this reserve')
  if (!Array.isArray(cells) || cells.length < 1 || cells.length > 9 || new Set(cells).size !== cells.length || cells.some(c => !/^[a-z][a-z0-9-]*:\d+$/.test(c))) {
    throw new Error('repair: name 1-9 unique source drawing IDs in one targeted request')
  }
  if (typeof failure !== 'string' || failure.trim().length < 16 || !hash.test(sourceSha256)) throw new Error('repair: provide located defect and SHA-256 of the original source')
  const existing = ledger.fighters[fighter]?.rounds ?? []
  if (existing.some(r => r.status === 'pending')) throw new Error(`repair: ${fighter} has a pending request; reconcile its outcome before retrying`)
  if (existing.length >= REPAIR_ROUNDS) throw new Error(`repair: ${fighter} exhausted ${REPAIR_ROUNDS} targeted rounds`)
  const authoringCount = totalUsed(authoringLedger)
  if (!Number.isSafeInteger(authoringCount) || authoringCount < 0 || authoringCount > 200) throw new Error('repair: corrupt authoring ledger; cannot reserve')
  if (authoringCount + repairUsed(ledger) + 1 > COMBINED_CAP) throw new Error('repair: combined 233-request ceiling reached')
  // Copy-on-write: caller persists this BEFORE making the image request.
  const next = JSON.parse(JSON.stringify(ledger))
  const entry = next.fighters[fighter] ?? { rounds: [] }
  entry.rounds.push({ number: entry.rounds.length + 1, status: 'pending', cells, failure: failure.trim(), sourceSha256 })
  next.fighters[fighter] = entry
  return next
}

/** A failed provider call is still spent unless a separate owner reconciliation proves otherwise. */
export function settleRepairRound(ledger, fighter, number, { status, evidence, outputSha256 } = {}) {
  validateLedger(ledger)
  if (!states.has(status) || typeof evidence !== 'string' || evidence.trim().length < 16) throw new Error('repair: record an outcome and concrete evidence')
  if (status === 'accepted' && !hash.test(outputSha256)) throw new Error('repair: accepted art requires its output SHA-256')
  if (outputSha256 !== undefined && !hash.test(outputSha256)) throw new Error('repair: invalid output SHA-256')
  const original = ledger.fighters[fighter]?.rounds.find(r => r.number === number)
  if (!original || original.status !== 'pending') throw new Error('repair: only a pending exact round can settle')
  const next = JSON.parse(JSON.stringify(ledger))
  const round = next.fighters[fighter].rounds[number - 1]
  round.status = status
  round.evidence = evidence.trim()
  if (outputSha256) round.outputSha256 = outputSha256
  return next
}
