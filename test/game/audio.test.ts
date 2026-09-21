import { describe, expect, it } from 'vitest'
import type { SimEvent } from '../../src/core/events'
import { sfxForEvent, midiToFreq } from '../../src/game/audio/sfx'
import { GAME_THEME, TITLE_THEME } from '../../src/game/audio/music'

const ALL_EVENTS: SimEvent[] = [
  { type: 'spawn', id: 1, kind: 'soldier' },
  { type: 'swing', id: 1 },
  { type: 'jump', id: 1 },
  { type: 'land', id: 1 },
  { type: 'hit', attackerId: 1, targetId: 2, damage: 8 },
  { type: 'ko', id: 2 },
  { type: 'wave-cleared', waveIndex: 1 },
  { type: 'throw', id: 3 },
  { type: 'pickup', id: 4, kind: 'meat' },
  { type: 'special', id: 1 },
  { type: 'enrage', id: 5 },
  { type: 'stageclear' },
  { type: 'gameover' },
  { type: 'revive', id: 1 },
  { type: 'extralife' },
  { type: 'mount', id: 6 },
  { type: 'dismount', id: 1 },
]

describe('sfx mapping', () => {
  it('covers every event type; only spawn is silent', () => {
    for (const event of ALL_EVENTS) {
      const sfx = sfxForEvent(event)
      if (event.type === 'spawn') {
        expect(sfx).toBeNull()
        continue
      }
      expect(sfx, `no sfx for ${event.type}`).not.toBeNull()
      expect(sfx?.duration).toBeGreaterThan(0)
      expect(sfx?.gain).toBeGreaterThan(0)
      expect(sfx?.freq).toBeGreaterThan(0)
    }
  })

  it('is deterministic: same event in, same params out', () => {
    const hit: SimEvent = { type: 'hit', attackerId: 1, targetId: 2, damage: 8 }
    expect(sfxForEvent(hit)).toEqual(sfxForEvent(hit))
    expect(sfxForEvent({ type: 'ko', id: 9 })).toEqual(sfxForEvent({ type: 'ko', id: 9 }))
  })
})

describe('music themes', () => {
  it('themes are valid note tables with rests allowed', () => {
    for (const theme of [TITLE_THEME, GAME_THEME]) {
      expect(theme.noteMs).toBeGreaterThan(50)
      expect(theme.melody.length).toBeGreaterThanOrEqual(4)
      expect(theme.bass.length).toBeGreaterThanOrEqual(2)
      for (const note of [...theme.melody, ...theme.bass]) {
        expect(note).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('themes differ between title and game', () => {
    expect(TITLE_THEME.melody).not.toEqual(GAME_THEME.melody)
  })

  it('midiToFreq maps A4 to 440 and C4 an octave below A4-ish', () => {
    expect(midiToFreq(69)).toBeCloseTo(440)
    expect(midiToFreq(57)).toBeCloseTo(220)
  })
})
