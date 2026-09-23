/**
 * Attract-screen hi-score (UI-2): presentation-only persistence of the best
 * final score. The sim never reads it; GameOver/GameComplete write it,
 * Title reads it. Every access is guarded: private-mode storage throws on
 * access, and a title that crashes over a vanity number would be absurd.
 */

const KEY = 'dwga-hiscore-v1'

/** Injectable storage seam so the guards are unit-testable in Node. */
export interface ScoreStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

/** The browser store, or null when storage is unavailable or throws. */
export function browserStorage(): ScoreStorage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const store = window.localStorage
    // Probe: some browsers expose the object but throw on any use.
    store.getItem(KEY)
    return {
      getItem: (key: string) => store.getItem(key),
      setItem: (key: string, value: string) => store.setItem(key, value),
    }
  } catch {
    return null
  }
}

/** Best final score on record, or null when none (or storage is unusable). */
export function readHiScore(storage: ScoreStorage | null): number | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(KEY)
    if (raw === null) return null
    const value = Math.floor(Number(raw))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

/**
 * Record a final score, keeping the max. Returns the hi-score after the
 * write (the previous best when storage is unusable - callers display, never
 * branch on persistence).
 */
export function writeHiScore(storage: ScoreStorage | null, score: number): number | null {
  const best = readHiScore(storage)
  if (storage) {
    try {
      const next = Math.max(0, Math.floor(score))
      if (best === null || next > best) storage.setItem(KEY, String(next))
    } catch {
      // Vanity number; never worth an error.
    }
  }
  const after = readHiScore(storage)
  if (after !== null) return after
  return best ?? (Number.isFinite(score) && score > 0 ? Math.floor(score) : null)
}
