/**
 * Original procedural music: hand-written note loops (MIDI note numbers,
 * 0 = rest), sequenced by SfxPlayer. Slow solemn title theme, brisker
 * battle theme. Composed for this project - no external material.
 */
export interface MusicTheme {
  name: string
  /** Ms per sequencer step. */
  noteMs: number
  melody: number[]
  bass: number[]
}

export const TITLE_THEME: MusicTheme = {
  name: 'title',
  noteMs: 400,
  // A minor pentacolor: A3 C4 D4 E4 | D4 C4 A3 G3
  melody: [57, 60, 62, 64, 62, 60, 57, 55],
  bass: [45, 45, 48, 43],
}

export const GAME_THEME: MusicTheme = {
  name: 'game',
  noteMs: 180,
  // Driving E minor loop.
  melody: [64, 67, 69, 67, 64, 62, 64, 69, 67, 64, 62, 60, 62, 0, 64, 0],
  bass: [40, 40, 43, 45],
}
