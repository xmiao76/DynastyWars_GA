/**
 * Deterministic seeded RNG (mulberry32).
 *
 * The simulation must never call Math.random: all randomness flows through
 * this interface so that a seed plus a sequence of inputs replays exactly.
 */
export interface Rng {
  /** Next float in [0, 1). */
  next(): number
  /** Integer in [min, max], inclusive on both ends. */
  range(min: number, max: number): number
  /** Pick one element. Returns undefined only for an empty array. */
  pick<T>(items: readonly T[]): T | undefined
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    range: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length)],
  }
}
