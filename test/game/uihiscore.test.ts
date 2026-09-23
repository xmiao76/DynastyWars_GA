import { describe, expect, it } from 'vitest'
import { browserStorage, readHiScore, writeHiScore, type ScoreStorage } from '../../src/game/ui/hiscore'

function memoryStore(initial: Record<string, string> = {}): ScoreStorage {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value) },
  }
}

const throwingStore: ScoreStorage = {
  getItem: () => { throw new Error('denied') },
  setItem: () => { throw new Error('denied') },
}

describe('hi-score', () => {
  it('reads nothing when no score was recorded', () => {
    expect(readHiScore(memoryStore())).toBeNull()
    expect(readHiScore(null)).toBeNull()
  })

  it('keeps the max across writes and persists it', () => {
    const store = memoryStore()
    expect(writeHiScore(store, 3200)).toBe(3200)
    expect(writeHiScore(store, 1500)).toBe(3200)
    expect(writeHiScore(store, 9999)).toBe(9999)
    expect(readHiScore(store)).toBe(9999)
  })

  it('rejects garbage, zero and negatives without throwing', () => {
    expect(readHiScore(memoryStore({ 'dwga-hiscore-v1': 'not-a-number' }))).toBeNull()
    expect(readHiScore(memoryStore({ 'dwga-hiscore-v1': '0' }))).toBeNull()
    expect(readHiScore(memoryStore({ 'dwga-hiscore-v1': '-5' }))).toBeNull()
    expect(writeHiScore(memoryStore(), -10)).toBeNull()
  })

  it('survives denied storage on both paths', () => {
    expect(readHiScore(throwingStore)).toBeNull()
    expect(writeHiScore(throwingStore, 5000)).toBe(5000)
    expect(writeHiScore(null, 5000)).toBe(5000)
  })

  it('browserStorage reports null outside a browser', () => {
    expect(browserStorage()).toBeNull()
  })
})
