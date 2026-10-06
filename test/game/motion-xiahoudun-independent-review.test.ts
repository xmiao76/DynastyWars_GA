import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const review = JSON.parse(readFileSync('art/motion/xiahoudun/independent-review.json', 'utf8')) as {
  status: string
  verdict: string | null
  reviewCompleted: boolean
  reviewerObservations: unknown[]
  resetAuthorizedAfterCompletedReview: boolean
  resetApplied: boolean
  taskStatus: string
  headGate: string
  numericalHeadSpread: number | null
  acceptedChargeSheet: boolean
  projectionRecordAdded: boolean
  reviewerRuns: Array<{ id: string; status: string }>
  sources: Record<string, { file: string; sha256: string }>
  imageRequestsThisAction: number
  fixture: { rawToArtScale: number; density: number; order: string[]; limitations: string }
}

describe('CMR-14A completed review preserves scoped owner reset and honest limits', () => {
  it('requires the completed independent verdict for reset and preserves all failed-run history', () => {
    expect(review.resetAuthorizedAfterCompletedReview).toBe(true)
    expect(review.reviewCompleted).toBe(true)
    expect(review.verdict).toBe('NEEDS_NAMED_REPAIR')
    expect(review.reviewerObservations.length).toBeGreaterThan(0)
    expect(review.resetApplied).toBe(true)
    expect(review.status).toBe('COMPLETED_NEEDS_NAMED_REPAIR')
    expect(review.taskStatus).toBe('IN_PROGRESS')
    expect(review.reviewerRuns).toHaveLength(4)
    expect(new Set(review.reviewerRuns.map(r => r.id)).size).toBe(4)
    expect(review.reviewerRuns.filter(r => r.status === 'failed-before-closing-message')).toHaveLength(3)
    expect(review.reviewerRuns.filter(r => r.status === 'completed-verdict')).toHaveLength(1)
  })

  it('keeps exact original artwork and occluded-head null measurements instead of numerical acceptance', () => {
    for (const source of Object.values(review.sources)) {
      const bytes = readFileSync(`art/motion/xiahoudun/${source.file}`)
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256)
    }
    expect(review.imageRequestsThisAction).toBe(0)
    expect(review.headGate).toBe('UNVERIFIED')
    expect(review.numericalHeadSpread).toBeNull()
    expect(review.acceptedChargeSheet).toBe(false)
    expect(review.projectionRecordAdded).toBe(false)
    const projection = JSON.parse(readFileSync('art/motion/xiahoudun/pack-projection.json', 'utf8')) as {
      band: { lo: number; hi: number }
      sheets: Array<{ name: string; min: number; max: number; mean: number; history: unknown[] }>
    }
    expect(projection.sheets.map(s => s.name)).toEqual(['walk'])
    expect(projection.band).toEqual({ lo: 404.1605167916991, hi: 446.70372908556226 })
    const walk = projection.sheets[0]!
    expect((walk.max - walk.min) / walk.mean).toBeGreaterThan(0.10)
    expect(walk.history.length).toBeGreaterThan(0) // old underestimated numbers remain audit history
  })

  it('labels a single-scale offline ordered-still fixture as provisional, not gameplay/native-video proof', () => {
    expect(review.fixture.rawToArtScale).toBe(0.66)
    expect(review.fixture.density).toBe(2)
    expect(review.fixture.order).toEqual(['walk:0', 'charge:0', 'charge:1', 'charge:2', 'charge:3', 'charge:4', 'walk:0'])
    expect(review.fixture.limitations).toMatch(/Provisional/)
    expect(review.fixture.limitations).toMatch(/no final registration/)
    expect(review.fixture.limitations).toMatch(/motion\/native-video/)
  })
})
