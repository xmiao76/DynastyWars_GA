// Owner-authorized Acceptance-4 repair reserve. This is separate from the
// existing 200-request authoring ledger; it NEVER resets or edits that ledger.
// One request per round, up to three rounds per remaining fighter/horse.
// A separately recorded owner extension can authorize exactly one focused round.
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

function validCells(cells) {
  return Array.isArray(cells) && cells.length >= 1 && cells.length <= 9 && new Set(cells).size === cells.length && cells.every(c => typeof c === 'string' && /^[a-z][a-z0-9-]*:\d+$/.test(c))
}

function validateOwnerExtension(extension) {
  if (!extension || extension.additionalRounds !== 1 || typeof extension.authorizationId !== 'string' || !extension.authorizationId.trim() || typeof extension.reason !== 'string' || extension.reason.trim().length < 16 || !validCells(extension.cells)) {
    throw new Error('repair: owner extension requires exactly one round, an authorization ID, a reason of at least 16 characters and 1-9 unique source drawing IDs')
  }
}

function fighterCap(entry) {
  return REPAIR_ROUNDS + (entry?.ownerExtension?.additionalRounds ?? 0)
}

function combinedCeiling(ledger) {
  return COMBINED_CAP + Object.values(ledger.fighters).reduce((sum, entry) => sum + (entry.ownerExtension?.additionalRounds ?? 0), 0)
}

function validateLedger(ledger) {
  if (!ledger || ledger.version !== 1 || ledger.perFighterCap !== REPAIR_ROUNDS || ledger.combinedCap !== COMBINED_CAP || !ledger.fighters || typeof ledger.fighters !== 'object' || Array.isArray(ledger.fighters)) {
    throw new Error('repair: invalid budget ledger; do not reset or overwrite it')
  }
  for (const [fighter, entry] of Object.entries(ledger.fighters)) {
    if (!ids.has(fighter) || !entry || !Array.isArray(entry.rounds)) throw new Error(`repair: invalid round history for ${fighter}`)
    if (entry.ownerExtension !== undefined) {
      validateOwnerExtension(entry.ownerExtension)
      if (entry.rounds.length < REPAIR_ROUNDS || entry.rounds.slice(0, REPAIR_ROUNDS).some(round => !round || !states.has(round.status))) {
        throw new Error(`repair: ${fighter} owner extension requires all three original rounds consumed and settled; no reset or refund`)
      }
      if (entry.rounds.slice(REPAIR_ROUNDS).some(round => !round || !validCells(round.cells) || round.cells.some(cell => !entry.ownerExtension.cells.includes(cell)))) {
        throw new Error(`repair: ${fighter} extension round contains unauthorized cells`)
      }
    }
    if (entry.rounds.length > fighterCap(entry)) throw new Error(`repair: invalid round history for ${fighter}`)
    if (entry.rounds.some((round, i) => !round || round.number !== i + 1 || !['pending', ...states].includes(round.status))) throw new Error(`repair: corrupt round history for ${fighter}`)
  }
}

/** Explicit owner authorization only; retains the three spent rounds and base caps. */
export function grantOwnerRepairExtension(ledger, fighter, { authorizationId, reason, cells } = {}) {
  validateLedger(ledger)
  if (!ids.has(fighter)) throw new Error(`repair: ${fighter} is not in the owner-approved remaining cast`)
  const entry = ledger.fighters[fighter]
  if (entry?.ownerExtension !== undefined) throw new Error(`repair: ${fighter} already has an owner extension; no additional grants`)
  if (entry?.rounds.some(round => round.status === 'pending')) throw new Error(`repair: ${fighter} has a pending request; reconcile its outcome before granting an extension`)
  if (entry?.rounds.length !== REPAIR_ROUNDS) throw new Error(`repair: ${fighter} owner extension requires all three original rounds consumed`)
  const extension = { additionalRounds: 1, authorizationId, reason, cells }
  validateOwnerExtension(extension)
  const next = JSON.parse(JSON.stringify(ledger))
  next.fighters[fighter].ownerExtension = { ...extension, authorizationId: authorizationId.trim(), reason: reason.trim(), cells: [...cells] }
  return next
}

export function repairUsed(ledger) {
  validateLedger(ledger)
  return Object.values(ledger.fighters).reduce((sum, entry) => sum + entry.rounds.length, 0)
}

/** A pending reservation counts as spent, even after a crash/restart. */
export function remainingRepairRounds(ledger, fighter) {
  validateLedger(ledger)
  if (!ids.has(fighter)) return 0 // Guan Yu is locked; no new generation.
  return fighterCap(ledger.fighters[fighter]) - (ledger.fighters[fighter]?.rounds.length ?? 0)
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
  if (!validCells(cells)) {
    throw new Error('repair: name 1-9 unique source drawing IDs in one targeted request')
  }
  if (typeof failure !== 'string' || failure.trim().length < 16 || !hash.test(sourceSha256)) throw new Error('repair: provide located defect and SHA-256 of the original source')
  const current = ledger.fighters[fighter]
  const existing = current?.rounds ?? []
  if (existing.some(r => r.status === 'pending')) throw new Error(`repair: ${fighter} has a pending request; reconcile its outcome before retrying`)
  const cap = fighterCap(current)
  if (existing.length >= cap) throw new Error(`repair: ${fighter} exhausted ${cap} targeted rounds`)
  if (existing.length >= REPAIR_ROUNDS && cells.some(cell => !current.ownerExtension.cells.includes(cell))) throw new Error(`repair: ${fighter} extension round contains unauthorized cells`)
  const authoringCount = totalUsed(authoringLedger)
  if (!Number.isSafeInteger(authoringCount) || authoringCount < 0 || authoringCount > 200) throw new Error('repair: corrupt authoring ledger; cannot reserve')
  const ceiling = combinedCeiling(ledger)
  if (authoringCount + repairUsed(ledger) + 1 > ceiling) throw new Error(`repair: combined ${ceiling}-request ceiling reached`)
  // Copy-on-write: caller persists this BEFORE making the image request.
  const next = JSON.parse(JSON.stringify(ledger))
  const entry = next.fighters[fighter] ?? { rounds: [] }
  entry.rounds.push({ number: entry.rounds.length + 1, status: 'pending', cells: [...cells], failure: failure.trim(), sourceSha256 })
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
