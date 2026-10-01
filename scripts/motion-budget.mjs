// CMR-04: durable per-character generation budget ledger.
//
// Counts every image request - whole-sheet candidates AND focused edits -
// across A/B tasks and continuation rounds. Task boundaries and model
// switches never reset an allowance. Nothing here calls an image tool: this
// is the enforcement gate that must be consulted BEFORE any tool call, and
// missing image capability is a blocker, never permission to substitute.
//
// Contract caps (docs/CAST_MOTION_ROLLOUT.md):
//   hero 16, boss 12, mook 8, horse 4 per character; 200 total;
//   at most 2 whole-sheet candidates per sequence;
//   Guan Yu generation is grandfathered and CLOSED (cap 0).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export const ROLE_CAPS = { hero: 16, boss: 12, mook: 8, horse: 4 }
export const TOTAL_CAP = 200
export const SHEET_CANDIDATES_PER_SEQUENCE = 2

export const DEFAULT_LEDGER_PATH = 'art/motion/generation-budget.json'

/** An empty ledger: every fighter starts unspent with its role cap. */
export function emptyLedger() {
  return {
    version: 1,
    totalCap: TOTAL_CAP,
    sheetCandidatesPerSequence: SHEET_CANDIDATES_PER_SEQUENCE,
    roleCaps: { ...ROLE_CAPS },
    fighters: {},
  }
}

export function loadLedger(path = DEFAULT_LEDGER_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function saveLedger(ledger, path = DEFAULT_LEDGER_PATH) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(ledger, null, 2)}\n`)
}

export function totalUsed(ledger) {
  return Object.values(ledger.fighters).reduce((a, f) => a + (f.used ?? 0), 0)
}

function fighterSlot(ledger, fighterId, role) {
  const existing = ledger.fighters[fighterId]
  if (existing) return existing
  if (!ledger.roleCaps[role]) throw new Error(`budget: unknown role ${role}`)
  ledger.fighters[fighterId] = {
    role,
    // A fighter may carry an explicit cap override (guanyu: 0, closed).
    cap: ledger.roleCaps[role],
    used: 0,
    sheetCandidates: {},
  }
  return ledger.fighters[fighterId]
}

/**
 * Reserve `n` requests for one fighter. Throws (and leaves the ledger
 * untouched) when the request would exceed the character cap, the 200-total
 * cap, or the two-whole-sheet-candidates-per-sequence rule.
 */
export function reserve(ledger, fighterId, { role = 'hero', n = 1, sequence, kind = 'focused' } = {}) {
  if (!ledger.roleCaps[role]) throw new Error(`budget: unknown role ${role}`)
  const slot = fighterSlot(ledger, fighterId, role)
  const cap = slot.cap ?? ledger.roleCaps[slot.role]
  if (n <= 0 || !Number.isInteger(n)) throw new Error(`budget: ${fighterId}: n must be a positive integer`)
  if (slot.used + n > cap) {
    throw new Error(`budget: ${fighterId} would reach ${slot.used + n} requests, over its cap ${cap}`)
  }
  if (totalUsed(ledger) + n > ledger.totalCap) {
    throw new Error(`budget: ${totalUsed(ledger) + n} requests would exceed the ${ledger.totalCap} total cap`)
  }
  if (kind === 'sheet') {
    if (!sequence) throw new Error(`budget: ${fighterId}: a whole-sheet request names its sequence`)
    const perSeq = slot.sheetCandidates[sequence] ?? 0
    if (perSeq + 1 > ledger.sheetCandidatesPerSequence) {
      throw new Error(`budget: ${fighterId}/${sequence} would request sheet candidate ${perSeq + 1}, over the ${ledger.sheetCandidatesPerSequence} limit`)
    }
  }
  slot.used += n
  if (kind === 'sheet') slot.sheetCandidates[sequence] = (slot.sheetCandidates[sequence] ?? 0) + 1
  return { fighterId, used: slot.used, cap, remaining: cap - slot.used, totalUsed: totalUsed(ledger) }
}

/** What one fighter may still request (never negative; does not mutate). */
export function remaining(ledger, fighterId, role = 'hero') {
  const slot = ledger.fighters[fighterId]
  const cap = slot?.cap ?? ledger.roleCaps[slot?.role ?? role] ?? ROLE_CAPS[role]
  const used = slot?.used ?? 0
  return Math.max(0, cap - used)
}
