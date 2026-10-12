import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { emptyLedger, reserve, totalUsed } from '../../scripts/motion-budget.mjs'
import {
  COMBINED_CAP, DEFAULT_REPAIR_PATH, ELIGIBLE_FIGHTERS, REPAIR_RESERVE,
  emptyRepairLedger, grantOwnerRepairExtension, readRepairLedger, remainingRepairRounds, repairDecision,
  repairUsed, reserveRepairRound, saveRepairLedger, settleRepairRound,
} from '../../scripts/motion-acceptance4-repair.mjs'

const id = 'spearman', digest = 'a'.repeat(64)
const issue = { cells: ['thrust:3', 'fall-thrown:4'], failure: 'Blade shorter in these labelled source drawings', sourceSha256: digest }
const extension = {
  authorizationId: 'owner-2026-10-07-cmr14a-one-clean-redraw',
  reason: 'Owner approved one extra clean redraw; unchanged Acceptance-4 gate',
  cells: ['combo:0', 'combo:2', 'combo:3', 'combo:6', 'combo:7'],
}
function exhausted(fighter = 'xiahoudun') {
  let ledger = emptyRepairLedger()
  for (let number = 1; number <= 3; number++) {
    ledger = reserveRepairRound(ledger, emptyLedger(), fighter, issue)
    ledger = settleRepairRound(ledger, fighter, number, { status: 'rejected', evidence: `Original repair round ${number} failed unchanged acceptance` })
  }
  return ledger
}
const temps: string[] = []
afterAll(() => { for (const dir of temps) rmSync(dir, { recursive: true, force: true }) })
function path(): string { const dir = mkdtempSync(join(tmpdir(), 'a4-repair-')); temps.push(dir); return join(dir, 'ledger.json') }

describe('owner-approved Acceptance-4 repair reserve', () => {
  it('caps 11 remaining characters at three focused rounds = 33 extra requests; Guan Yu stays locked', () => {
    expect(ELIGIBLE_FIGHTERS).toHaveLength(11)
    expect(new Set(ELIGIBLE_FIGHTERS).size).toBe(11)
    expect(REPAIR_RESERVE).toBe(33)
    expect(COMBINED_CAP).toBe(233)
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

  it('keeps the 200-request authoring ceiling independent and enforces the 233 combined ceiling', () => {
    const authoring = emptyLedger(), repairs = emptyRepairLedger()
    authoring.fighters['filled'] = { role: 'hero', cap: 200, used: 200, sheetCandidates: {} }
    expect(() => reserve(authoring, 'filled', { role: 'hero' })).toThrow(/over its cap/)
    const one = reserveRepairRound(repairs, authoring, id, issue)
    expect(repairUsed(one)).toBe(1)
    const tooMany = emptyRepairLedger()
    for (const fighter of ELIGIBLE_FIGHTERS) {
      tooMany.fighters[fighter] = { rounds: Array.from({ length: 3 }, (_, i) => ({ number: i + 1, status: 'rejected' as const, cells: ['walk:0'], failure: 'Measured bad geometry', sourceSha256: digest })) }
    }
    expect(repairUsed(tooMany)).toBe(33)
    expect(() => reserveRepairRound(tooMany, authoring, id, issue)).toThrow(/exhausted/)
    expect(COMBINED_CAP - totalUsed(authoring) - repairUsed(tooMany)).toBe(0)
  })

  it('grants exactly one fighter-scoped owner round without changing original history or authoring', () => {
    const original = exhausted(), authoring = emptyLedger()
    const before = JSON.stringify(original), authoringBefore = JSON.stringify(authoring)
    const cells = [...extension.cells]
    const granted = grantOwnerRepairExtension(original, 'xiahoudun', { ...extension, cells })
    cells.push('combo:9')
    expect(JSON.stringify(original)).toBe(before)
    expect(granted.fighters['xiahoudun']!.rounds).toEqual(original.fighters['xiahoudun']!.rounds)
    expect(granted.fighters['xiahoudun']!.ownerExtension).toEqual({ additionalRounds: 1, ...extension })
    expect(granted.perFighterCap).toBe(3)
    expect(granted.combinedCap).toBe(233)
    expect(remainingRepairRounds(granted, 'xiahoudun')).toBe(1)
    expect(remainingRepairRounds(granted, id)).toBe(3)
    expect(() => grantOwnerRepairExtension(granted, 'xiahoudun', extension)).toThrow(/already/)
    const fourth = reserveRepairRound(granted, authoring, 'xiahoudun', { ...issue, cells: ['combo:0', 'combo:7'] })
    expect(fourth.fighters['xiahoudun']!.rounds[3]!.number).toBe(4)
    expect(fourth.fighters['xiahoudun']!.rounds.slice(0, 3)).toEqual(original.fighters['xiahoudun']!.rounds)
    const failed = settleRepairRound(fourth, 'xiahoudun', 4, { status: 'tool-failed', evidence: 'Provider failed; request remains spent, no retry or refund' })
    expect(remainingRepairRounds(failed, 'xiahoudun')).toBe(0)
    expect(() => reserveRepairRound(failed, authoring, 'xiahoudun', { ...issue, cells: extension.cells })).toThrow(/exhausted 4/)
    expect(() => settleRepairRound(failed, 'xiahoudun', 4, { status: 'accepted', evidence: 'Cannot refund or settle a failed round again', outputSha256: digest })).toThrow(/only a pending/)
    expect(() => grantOwnerRepairExtension(failed, 'xiahoudun', extension)).toThrow(/already/)
    expect(JSON.stringify(authoring)).toBe(authoringBefore)
    const other = exhausted(id)
    other.fighters['xiahoudun'] = granted.fighters['xiahoudun']!
    expect(remainingRepairRounds(other, id)).toBe(0)
    expect(() => reserveRepairRound(other, authoring, id, issue)).toThrow(/exhausted 3/)
    expect(repairDecision({ measurements: 'unknown', uncertain: true, artDefects: false, roundsLeft: 1 })).toBe('blocked')
  })

  it('rejects premature, pending, unauthenticated, malformed or larger owner extensions without mutation', () => {
    expect(() => grantOwnerRepairExtension(emptyRepairLedger(), 'xiahoudun', extension)).toThrow(/three original/)
    expect(() => grantOwnerRepairExtension(emptyRepairLedger(), 'guanyu', extension)).toThrow(/not in/)
    const pending = exhausted()
    pending.fighters['xiahoudun']!.rounds[2]!.status = 'pending'
    expect(() => grantOwnerRepairExtension(pending, 'xiahoudun', extension)).toThrow(/pending/)
    const original = exhausted(), before = JSON.stringify(original)
    for (const invalid of [
      { ...extension, authorizationId: ' ' }, { ...extension, reason: 'too short' },
      { ...extension, cells: [] }, { ...extension, cells: ['combo:0', 'combo:0'] },
      { ...extension, cells: ['not-a-cell'] },
      { ...extension, cells: Array.from({ length: 10 }, (_, i) => `combo:${i}`) },
    ]) expect(() => grantOwnerRepairExtension(original, 'xiahoudun', invalid)).toThrow(/owner extension/)
    const tampered = grantOwnerRepairExtension(original, 'xiahoudun', extension)
    Object.assign(tampered.fighters['xiahoudun']!.ownerExtension!, { additionalRounds: 2 })
    expect(() => repairUsed(tampered)).toThrow(/exactly one round/)
    expect(JSON.stringify(original)).toBe(before)
  })

  it('rejects unauthorized extension cells and reset/refund metadata; round four persists spent across restart', () => {
    const granted = grantOwnerRepairExtension(exhausted(), 'xiahoudun', extension)
    const before = JSON.stringify(granted)
    expect(() => reserveRepairRound(granted, emptyLedger(), 'xiahoudun', { ...issue, cells: ['combo:0', 'combo:1'] })).toThrow(/unauthorized/)
    expect(JSON.stringify(granted)).toBe(before)
    const fourth = reserveRepairRound(granted, emptyLedger(), 'xiahoudun', { ...issue, cells: extension.cells })
    const file = path(); saveRepairLedger(fourth, file)
    const resumed = readRepairLedger(file)
    expect(resumed).toEqual(fourth)
    expect(remainingRepairRounds(resumed, 'xiahoudun')).toBe(0)
    expect(() => reserveRepairRound(resumed, emptyLedger(), 'xiahoudun', { ...issue, cells: extension.cells })).toThrow(/pending/)
    const tampered = JSON.parse(JSON.stringify(resumed))
    tampered.fighters.xiahoudun.rounds[3].cells = ['combo:1']
    expect(() => repairUsed(tampered)).toThrow(/unauthorized/)
    const refunded = JSON.parse(JSON.stringify(granted))
    refunded.fighters.xiahoudun.rounds.pop()
    expect(() => remainingRepairRounds(refunded, 'xiahoudun')).toThrow(/no reset or refund/)
    const invalidCap = JSON.parse(JSON.stringify(granted)); invalidCap.perFighterCap = 4
    const invalidCombined = JSON.parse(JSON.stringify(granted)); invalidCombined.combinedCap = 234
    expect(() => repairUsed(invalidCap)).toThrow(/invalid budget/)
    expect(() => repairUsed(invalidCombined)).toThrow(/invalid budget/)
    const failed = settleRepairRound(resumed, 'xiahoudun', 4, { status: 'tool-failed', evidence: 'Image failure is still spent after restart; stop retries' })
    saveRepairLedger(failed, file)
    expect(remainingRepairRounds(readRepairLedger(file), 'xiahoudun')).toBe(0)
  })

  it('allows exactly 234 combined requests only with the explicit extension, without rollover', () => {
    const full = emptyRepairLedger(), authoring = emptyLedger()
    authoring.fighters['filled'] = { role: 'hero', cap: 200, used: 200, sheetCandidates: {} }
    for (const fighter of ELIGIBLE_FIGHTERS) full.fighters[fighter] = exhausted(fighter).fighters[fighter]!
    const granted = grantOwnerRepairExtension(full, 'xiahoudun', extension)
    expect(totalUsed(authoring) + repairUsed(granted)).toBe(233)
    const fourth = reserveRepairRound(granted, authoring, 'xiahoudun', { ...issue, cells: extension.cells })
    expect(totalUsed(authoring) + repairUsed(fourth)).toBe(234)
    expect(fourth.combinedCap).toBe(233)
    expect(() => reserveRepairRound(fourth, authoring, id, issue)).toThrow(/exhausted 3/)
    const failed = settleRepairRound(fourth, 'xiahoudun', 4, { status: 'rejected', evidence: 'Extra clean redraw failed unchanged acceptance; stop' })
    expect(() => reserveRepairRound(failed, authoring, 'xiahoudun', { ...issue, cells: extension.cells })).toThrow(/exhausted 4/)
    expect(totalUsed(authoring)).toBe(200)
    expect(COMBINED_CAP).toBe(233)
  })

  it('committed reserve never silently includes historical soldier or Guan Yu calls', () => {
    // The reserve legitimately accrues settled rounds through protocol use
    // (spearman rounds 1-3); the invariant is that soldier/Guan Yu - which
    // predate or close the reserve - are never charged, and every fighter
    // respects the per-fighter cap with well-formed round entries.
    const ledger = readRepairLedger(DEFAULT_REPAIR_PATH)
    expect(ledger.fighters['soldier']).toBeUndefined()
    expect(ledger.fighters['guanyu']).toBeUndefined()
    for (const [fighter, entry] of Object.entries(ledger.fighters)) {
      if (entry.ownerExtension) {
        expect(entry.ownerExtension.additionalRounds).toBe(1)
        expect(entry.ownerExtension.authorizationId.trim().length).toBeGreaterThan(0)
        expect(entry.ownerExtension.reason.trim().length).toBeGreaterThanOrEqual(16)
        expect(entry.ownerExtension.cells.length).toBeGreaterThanOrEqual(1)
        expect(entry.ownerExtension.cells.length).toBeLessThanOrEqual(9)
        expect(new Set(entry.ownerExtension.cells).size).toBe(entry.ownerExtension.cells.length)
        for (const cell of entry.ownerExtension.cells) expect(cell).toMatch(/^[a-z][a-z0-9-]*:\d+$/)
        expect(entry.rounds.length).toBeGreaterThanOrEqual(3)
        for (const round of entry.rounds.slice(0, 3)) expect(round.status).not.toBe('pending')
        for (const round of entry.rounds.slice(3)) for (const cell of round.cells) expect(entry.ownerExtension.cells).toContain(cell)
      }
      expect(entry.rounds.length, `${fighter} respects its explicitly authorized cap`).toBeLessThanOrEqual(3 + (entry.ownerExtension?.additionalRounds ?? 0))
      entry.rounds.forEach((round, i) => {
        expect(round.number).toBe(i + 1)
        expect(['pending', 'accepted', 'rejected', 'tool-failed']).toContain(round.status)
      })
    }
    expect(remainingRepairRounds(ledger, 'soldier')).toBe(3)
  })
})
