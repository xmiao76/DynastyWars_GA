import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  DEFAULT_LEDGER_PATH,
  ROLE_CAPS,
  SHEET_CANDIDATES_PER_SEQUENCE,
  TOTAL_CAP,
  emptyLedger,
  loadLedger,
  remaining,
  reserve,
  saveLedger,
  totalUsed,
} from '../../scripts/motion-budget.mjs'

/**
 * CMR-04: the durable generation budget ledger. Caps are ceilings that hold
 * across A/B tasks and continuation rounds; this task generates nothing.
 */

const tmpDirs: string[] = []
function tmpFile(): string {
  const dir = mkdtempSync(join(tmpdir(), 'motion-budget-'))
  tmpDirs.push(dir)
  return join(dir, 'ledger.json')
}
afterAll(() => {
  for (const dir of tmpDirs) rmSync(dir, { recursive: true, force: true })
})

describe('generation budget caps', () => {
  it('caps per role: hero 16, boss 12, mook 8, horse 4, total 200', () => {
    expect(ROLE_CAPS).toEqual({ hero: 16, boss: 12, mook: 8, horse: 4 })
    expect(TOTAL_CAP).toBe(200)
    expect(SHEET_CANDIDATES_PER_SEQUENCE).toBe(2)
    for (const [role, cap] of Object.entries(ROLE_CAPS)) {
      const ledger = emptyLedger()
      for (let i = 0; i < cap; i++) reserve(ledger, `fighter-${role}`, { role, n: 1 })
      expect(remaining(ledger, `fighter-${role}`, role)).toBe(0)
      expect(() => reserve(ledger, `fighter-${role}`, { role, n: 1 })).toThrow(/over its cap/)
    }
  })

  it('enforces the 200-request total across all characters', () => {
    const ledger = emptyLedger()
    ledger.fighters['a'] = { role: 'hero', cap: 120, used: 100, sheetCandidates: {} }
    ledger.fighters['b'] = { role: 'boss', cap: 120, used: 98, sheetCandidates: {} }
    expect(totalUsed(ledger)).toBe(198)
    expect(() => reserve(ledger, 'b', { role: 'boss', n: 3 })).toThrow(/total cap/)
    expect(reserve(ledger, 'b', { role: 'boss', n: 2 }).totalUsed).toBe(200)
  })

  it('caps whole-sheet candidates at two per sequence', () => {
    const ledger = emptyLedger()
    reserve(ledger, 'hero-x', { role: 'hero', kind: 'sheet', sequence: 'walk' })
    reserve(ledger, 'hero-x', { role: 'hero', kind: 'sheet', sequence: 'walk' })
    expect(() => reserve(ledger, 'hero-x', { role: 'hero', kind: 'sheet', sequence: 'walk' }))
      .toThrow(/sheet candidate 3/)
    // A different sequence has its own two.
    expect(() => reserve(ledger, 'hero-x', { role: 'hero', kind: 'sheet', sequence: 'jab' })).not.toThrow()
    // Focused edits count against the same character cap but are not sheets.
    expect(() => reserve(ledger, 'hero-x', { role: 'hero', kind: 'focused', sequence: 'walk', n: 2 })).not.toThrow()
  })

  it('ledgers persist across rounds (A/B tasks and model switches)', () => {
    const path = tmpFile()
    const ledger = emptyLedger()
    reserve(ledger, 'hero-round', { role: 'hero', kind: 'sheet', sequence: 'walk', n: 3 })
    saveLedger(ledger, path)
    const reloaded = loadLedger(path)
    expect(reloaded.fighters['hero-round']?.used).toBe(3)
    expect(reloaded.fighters['hero-round']?.sheetCandidates).toEqual({ walk: 1 })
    // A later round cannot spend beyond what remains.
    expect(remaining(reloaded, 'hero-round', 'hero')).toBe(13)
    expect(() => reserve(reloaded, 'hero-round', { role: 'hero', n: 14 })).toThrow(/over its cap/)
    expect(remaining(reloaded, 'hero-round', 'hero')).toBe(13)
  })

  it('the committed ledger closes Guan Yu and records its grandfathered usage', () => {
    const ledger = loadLedger(DEFAULT_LEDGER_PATH)
    expect(ledger.totalCap).toBe(200)
    const guanyu = ledger.fighters['guanyu']
    expect(guanyu?.cap).toBe(0)
    expect(guanyu?.used).toBe(17)
    expect(remaining(ledger, 'guanyu', 'hero')).toBe(0)
    expect(() => reserve(ledger, 'guanyu', { role: 'hero', n: 1 })).toThrow(/over its cap/)
    expect(guanyu?.note).toMatch(/No new Guan Yu generation/)
  })

  it('records the owner Wei Yan extension without resetting usage or touching the global rules', () => {
    // Owner "Do A" 2026-10-04: cap 16 -> 26 for the weapon re-brief. Usage
    // was 10 at that time and is never reset; the 200-total cap and the
    // two-whole-sheets-per-sequence rule are unchanged.
    const ledger = loadLedger(DEFAULT_LEDGER_PATH)
    const wy = ledger.fighters['weiyan']
    expect(ledger.totalCap).toBe(200)
    expect(ledger.sheetCandidatesPerSequence).toBe(2)
    expect(wy?.cap).toBe(26)
    expect(wy?.used).toBeGreaterThanOrEqual(10)
    expect(wy?.note).toMatch(/Owner extension 2026-10-04/)
    expect(wy?.note).toMatch(/NOT reset/)
    // Every sequence already holds its v1 candidate: a v2 whole sheet is the
    // last one allowed, so the per-sequence rule still bites.
    for (const seq of ['walk', 'jab1', 'jab2', 'finisher', 'jump', 'fall', 'getup', 'misc', 'special', 'rider']) {
      expect(wy?.sheetCandidates[seq], seq).toBeGreaterThanOrEqual(1)
      expect(wy?.sheetCandidates[seq], seq).toBeLessThanOrEqual(2)
    }
    // The newly spent v2 walk sheet is candidate 2/2; the ledger must
    // reject a third even though the owner increased the fighter cap.
    expect(wy?.sheetCandidates.walk).toBe(2)
    expect(wy?.sheetCandidates.jab1).toBe(2)
    for (const seq of ['walk', 'jab1']) {
      expect(() => reserve(ledger, 'weiyan', { role: 'hero', kind: 'sheet', sequence: seq }))
        .toThrow(/sheet candidate 3/)
    }
    expect(wy?.used).toBeGreaterThanOrEqual(12)
    // Other heroes' caps are untouched.
    expect(ledger.fighters['zhaoyun']?.cap).toBe(16)
    expect(ledger.fighters['zhangfei']?.cap).toBe(16)
  })

  it('records the owner Huang Zhong extension without resetting usage or touching the global rules', () => {
    // Owner "fund +1 targeted fix" 2026-10-05: cap 16 -> 17 for the
    // getup tier-gap fix (verified 17.38% pose-correlated spread).
    // Usage was 13 at that time and is never reset; the 200-total
    // cap and the two-whole-sheets-per-sequence rule are unchanged.
    const ledger = loadLedger(DEFAULT_LEDGER_PATH)
    const hz = ledger.fighters['huangzhong']
    expect(ledger.totalCap).toBe(200)
    expect(ledger.sheetCandidatesPerSequence).toBe(2)
    expect(hz?.cap).toBe(17)
    expect(hz?.used).toBeGreaterThanOrEqual(13)
    expect(hz?.note).toMatch(/Owner extension 2026-10-05/)
    expect(hz?.note).toMatch(/NOT reset/)
    // Seven sequences hold v1 candidates; none may exceed two sheets.
    for (const seq of ['walk', 'jab1', 'jab2', 'finisher', 'jump', 'fall', 'getup']) {
      expect(hz?.sheetCandidates[seq], seq).toBeGreaterThanOrEqual(1)
      expect(hz?.sheetCandidates[seq], seq).toBeLessThanOrEqual(2)
    }
  })

  it('rejects malformed requests', () => {
    const ledger = emptyLedger()
    expect(() => reserve(ledger, 'x', { role: 'hero', n: 0 })).toThrow(/positive integer/)
    expect(() => reserve(ledger, 'x', { role: 'hero', kind: 'sheet' })).toThrow(/names its sequence/)
    expect(() => reserve(ledger, 'x', { role: 'nobody' })).toThrow(/unknown role/)
  })

  it('a saved ledger round-trips byte-identically', () => {
    const path = tmpFile()
    const ledger = loadLedger(DEFAULT_LEDGER_PATH)
    saveLedger(ledger, path)
    expect(readFileSync(path, 'utf8')).toBe(readFileSync(DEFAULT_LEDGER_PATH, 'utf8'))
  })
})
