import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { emptyLedger, reserve, totalUsed } from '../../scripts/motion-budget.mjs'
import {
  COMBINED_CAP, DEFAULT_REPAIR_PATH, ELIGIBLE_FIGHTERS, REPAIR_RESERVE,
  emptyRepairLedger, readRepairLedger, remainingRepairRounds, repairDecision,
  repairUsed, reserveRepairRound, saveRepairLedger, settleRepairRound,
} from '../../scripts/motion-acceptance4-repair.mjs'

const id = 'spearman', digest = 'a'.repeat(64)
const issue = { cells: ['thrust:3', 'fall-thrown:4'], failure: 'Blade shorter in these labelled source drawings', sourceSha256: digest }
const temps: string[] = []
afterAll(() => { for (const dir of temps) rmSync(dir, { recursive: true, force: true }) })
function path(): string { const dir = mkdtempSync(join(tmpdir(), 'a4-repair-')); temps.push(dir); return join(dir, 'ledger.json') }

describe('owner-approved Acceptance-4 repair reserve', () => {
  it('caps 17 remaining characters at three focused rounds = 51 extra requests; Guan Yu stays locked', () => {
    expect(ELIGIBLE_FIGHTERS).toHaveLength(17)
    expect(new Set(ELIGIBLE_FIGHTERS).size).toBe(17)
    expect(REPAIR_RESERVE).toBe(51)
    expect(COMBINED_CAP).toBe(251)
    expect(remainingRepairRounds(emptyRepairLedger(), 'guanyu')).toBe(0)
    expect(() => reserveRepairRound(emptyRepairLedger(), emptyLedger(), 'guanyu', issue)).toThrow(/not in/)
  })

  it('permits measurement method correction without spending an image request or lowering the gate', () => {
    const initial = { measurements: 'method-invalid' as const, uncertain: true, artDefects: false, roundsLeft: 3 }
    expect(repairDecision(initial)).toBe('remeasure')
    expect(repairDecision({ measurements: 'pass', uncertain: false, artDefects: false, roundsLeft: 0 })).toBe('pass')
    expect(repairDecision({ measurements: 'pass', uncertain: true, artDefects: false, roundsLeft: 3 })).toBe('blocked')
    expect(repairDecision({ measurements: 'unknown', uncertain: true, artDefects: false, roundsLeft: 3 })).toBe('blocked')
    expect(repairDecision({ measurements: 'fail', uncertain: false, artDefects: true, roundsLeft: 3 })).toBe('targeted-redraw')
    expect(repairDecision({ measurements: 'fail', uncertain: false, artDefects: true, roundsLeft: 0 })).toBe('blocked')
  })

  it('reserves before tool use, persists a pending request across restart, rejects double-spend', () => {
    const ledger = emptyRepairLedger(), authoring = emptyLedger()
    const one = reserveRepairRound(ledger, authoring, id, issue)
    expect(repairUsed(ledger)).toBe(0)
    expect(repairUsed(one)).toBe(1)
    expect(remainingRepairRounds(one, id)).toBe(2)
    const file = path(); saveRepairLedger(one, file)
    const resumed = readRepairLedger(file)
    expect(resumed.fighters[id]?.rounds[0]?.status).toBe('pending')
    expect(() => reserveRepairRound(resumed, authoring, id, issue)).toThrow(/pending/)
    expect(readFileSync(file, 'utf8')).toContain('"sourceSha256"')
  })

  it('records accepted, rejected and tool-failed requests; three attempts cannot become four', () => {
    let ledger = emptyRepairLedger()
    const authoring = emptyLedger()
    for (let i = 1; i <= 3; i++) {
      ledger = reserveRepairRound(ledger, authoring, id, issue)
      ledger = settleRepairRound(ledger, id, i, {
        status: i === 1 ? 'accepted' : i === 2 ? 'rejected' : 'tool-failed',
        evidence: `Reviewed actual source and result after round ${i}`,
        ...(i === 1 ? { outputSha256: 'b'.repeat(64) } : {}),
      })
    }
    expect(remainingRepairRounds(ledger, id)).toBe(0)
    expect(() => reserveRepairRound(ledger, authoring, id, issue)).toThrow(/exhausted/)
    expect(() => settleRepairRound(ledger, id, 1, { status: 'accepted', evidence: 'Attempt to settle the same round again', outputSha256: digest })).toThrow(/only a pending/)
    expect(totalUsed(authoring)).toBe(0)
  })

  it('rejects broad redraws, absent evidence, missing source hash and more than nine cells without mutation', () => {
    const ledger = emptyRepairLedger(), authoring = emptyLedger()
    expect(() => reserveRepairRound(ledger, authoring, id, { ...issue, kind: 'sheet' })).toThrow(/whole-sheet/)
    expect(() => reserveRepairRound(ledger, authoring, id, { ...issue, sourceSha256: 'bad' })).toThrow(/SHA-256/)
    expect(() => reserveRepairRound(ledger, authoring, id, { ...issue, cells: [] })).toThrow(/1-9/)
    expect(() => reserveRepairRound(ledger, authoring, id, { ...issue, cells: Array.from({ length: 10 }, (_, i) => `thrust:${i}`) })).toThrow(/1-9/)
    expect(() => reserveRepairRound(ledger, authoring, id, { ...issue, cells: ['thrust:3', 'thrust:3'] })).toThrow(/unique/)
    expect(() => reserveRepairRound(ledger, authoring, id, { ...issue, failure: 'unclear' })).toThrow(/located defect/)
    expect(() => settleRepairRound(reserveRepairRound(ledger, authoring, id, issue), id, 1, { status: 'accepted', evidence: 'Painted shape inspected at native size' })).toThrow(/requires its output SHA-256/)
    expect(repairUsed(ledger)).toBe(0)
  })

  it('keeps the 200-request authoring ceiling independent and enforces the 251 combined ceiling', () => {
    const authoring = emptyLedger(), repairs = emptyRepairLedger()
    authoring.fighters['filled'] = { role: 'hero', cap: 200, used: 200, sheetCandidates: {} }
    expect(() => reserve(authoring, 'filled', { role: 'hero' })).toThrow(/over its cap/)
    const one = reserveRepairRound(repairs, authoring, id, issue)
    expect(repairUsed(one)).toBe(1)
    const tooMany = emptyRepairLedger()
    for (const fighter of ELIGIBLE_FIGHTERS) {
      tooMany.fighters[fighter] = { rounds: Array.from({ length: 3 }, (_, i) => ({ number: i + 1, status: 'rejected' as const, cells: ['walk:0'], failure: 'Measured bad geometry', sourceSha256: digest })) }
    }
    expect(repairUsed(tooMany)).toBe(51)
    expect(() => reserveRepairRound(tooMany, authoring, id, issue)).toThrow(/exhausted/)
    expect(COMBINED_CAP - totalUsed(authoring) - repairUsed(tooMany)).toBe(0)
  })

  it('committed reserve starts empty and does not silently include historical soldier or Guan Yu calls', () => {
    const ledger = readRepairLedger(DEFAULT_REPAIR_PATH)
    expect(repairUsed(ledger)).toBe(0)
    expect(remainingRepairRounds(ledger, 'soldier')).toBe(3)
  })
})
