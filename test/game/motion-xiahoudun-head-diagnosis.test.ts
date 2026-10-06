import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { repairDecision } from '../../scripts/motion-acceptance4-repair.mjs'

const audit = JSON.parse(readFileSync('art/motion/xiahoudun/head-diagnosis.json', 'utf8')) as {
  status: string
  headGate: string
  numericalHeadSpread: number | null
  anatomicalChin: number[] | null
  sourceScale: number
  zoom: number
  cropSize: number[]
  sources: Record<string, { file: string; sha256: string }>
  reviewedPairs: Array<{ id: number; frames: string[]; path: string; sha256: string }>
  requestsThisIteration: number
  consecutiveUnresolvedConsumerOutcomes: number
  weaponRepairPreserved: { acceptedSheetProjectionRecorded: boolean }
}

describe('CMR-14A head diagnosis never converts occlusion into a pass', () => {
  it('pins the two unchanged art sources with no size normalization', () => {
    expect(audit.sourceScale).toBe(1)
    expect(audit.zoom).toBe(4)
    expect(audit.cropSize).toEqual([112, 144])
    for (const source of Object.values(audit.sources)) {
      const bytes = readFileSync(`art/motion/xiahoudun/${source.file}`)
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256)
    }
  })

  it('retains five comparable pairs while leaving the hidden chin and numerical result null', () => {
    expect(audit.reviewedPairs.map(p => p.id)).toEqual([0, 1, 2, 3, 4])
    for (const p of audit.reviewedPairs) expect(p.frames).toEqual([`walk:${p.id}`, `charge:${p.id}`])
    expect(audit.headGate).toBe('UNVERIFIED')
    expect(audit.anatomicalChin).toBeNull()
    expect(audit.numericalHeadSpread).toBeNull()
    expect(audit.weaponRepairPreserved.acceptedSheetProjectionRecorded).toBe(false)
  })

  it('blocks after the documented third unresolved outcome despite remaining image funds', () => {
    expect(audit.consecutiveUnresolvedConsumerOutcomes).toBe(3)
    expect(audit.status).toBe('BLOCKED')
    expect(audit.requestsThisIteration).toBe(0)
    // Existing recovery classifier: even nominally passing measurements do
    // not establish acceptance while a full-head measurement is uncertain.
    expect(repairDecision({ measurements: 'pass', uncertain: true, artDefects: false, roundsLeft: 2 })).toBe('blocked')
    expect(repairDecision({ measurements: 'pass', uncertain: false, artDefects: false, roundsLeft: 2 })).toBe('pass')
  })
})
