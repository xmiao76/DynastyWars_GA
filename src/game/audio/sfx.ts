import type { SimEvent } from '../../core/events'
import type { MusicTheme } from './music'

/**
 * 100% programmatic audio: every sound is a WebAudio oscillator envelope
 * described by data. No audio files, no samples, nothing copyrighted.
 */

export interface SfxParams {
  /** Stable identifier, also used by tests and the debug bridge counter. */
  name: string
  type: OscillatorType
  /** Start frequency (Hz). */
  freq: number
  /** Optional pitch sweep target (Hz) at the end of the envelope. */
  freqEnd?: number
  /** Seconds. */
  duration: number
  /** Peak gain 0..1. */
  gain: number
}

/**
 * Deterministic mapping from sim events to sound parameters. Returns null
 * for silent events (spawns). Pure: same event in, same sound out.
 */
export function sfxForEvent(event: SimEvent): SfxParams | null {
  switch (event.type) {
    case 'swing':
      return { name: 'swing', type: 'square', freq: 220, freqEnd: 180, duration: 0.06, gain: 0.08 }
    case 'hit':
      return { name: 'hit', type: 'sawtooth', freq: 160, freqEnd: 90, duration: 0.08, gain: 0.15 }
    case 'ko':
      return { name: 'ko', type: 'sawtooth', freq: 200, freqEnd: 40, duration: 0.25, gain: 0.2 }
    case 'pickup':
      return { name: 'pickup', type: 'sine', freq: 520, freqEnd: 880, duration: 0.12, gain: 0.15 }
    case 'special':
      return { name: 'special', type: 'square', freq: 100, freqEnd: 440, duration: 0.3, gain: 0.2 }
    case 'throw':
      return { name: 'throw', type: 'triangle', freq: 300, freqEnd: 120, duration: 0.15, gain: 0.15 }
    case 'jump':
      return { name: 'jump', type: 'sine', freq: 300, freqEnd: 500, duration: 0.1, gain: 0.06 }
    case 'land':
      return { name: 'land', type: 'sine', freq: 140, freqEnd: 80, duration: 0.08, gain: 0.07 }
    case 'join':
      // Player two dropping in: the same rising note a revive gets.
      return { name: 'join', type: 'sine', freq: 440, freqEnd: 880, duration: 0.22, gain: 0.18 }
    case 'wave-cleared':
      return { name: 'wave-cleared', type: 'sine', freq: 440, freqEnd: 660, duration: 0.2, gain: 0.15 }
    case 'enrage':
      return { name: 'enrage', type: 'sawtooth', freq: 80, freqEnd: 160, duration: 0.4, gain: 0.25 }
    case 'stageclear':
      return { name: 'stageclear', type: 'triangle', freq: 523, freqEnd: 784, duration: 0.5, gain: 0.25 }
    case 'gameover':
      return { name: 'gameover', type: 'sawtooth', freq: 200, freqEnd: 50, duration: 0.8, gain: 0.2 }
    case 'revive':
      return { name: 'revive', type: 'sine', freq: 330, freqEnd: 660, duration: 0.2, gain: 0.15 }
    case 'extralife':
      return { name: 'extralife', type: 'sine', freq: 660, freqEnd: 990, duration: 0.25, gain: 0.2 }
    case 'mount':
      return { name: 'mount', type: 'triangle', freq: 240, freqEnd: 480, duration: 0.18, gain: 0.15 }
    case 'dismount':
      return { name: 'dismount', type: 'sawtooth', freq: 300, freqEnd: 90, duration: 0.2, gain: 0.18 }
    case 'spawn':
      return null
  }
}

/** WebAudio sfx/music player. The context is created lazily on unlock()
 * (first user gesture), so importing this module is safe anywhere. */
export class SfxPlayer {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicTimer: number | null = null
  private currentTheme: string | null = null
  private step = 0
  muted = false

  get unlocked(): boolean {
    return this.ctx !== null
  }

  unlock(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.3
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  play(params: SfxParams): void {
    if (!this.ctx || !this.master || this.muted) return
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = params.type
    osc.frequency.setValueAtTime(params.freq, t)
    if (params.freqEnd) osc.frequency.exponentialRampToValueAtTime(params.freqEnd, t + params.duration)
    gain.gain.setValueAtTime(params.gain, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + params.duration)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(t)
    osc.stop(t + params.duration)
  }

  /** Simple step sequencer: melody each step, bass every other step. */
  startMusic(theme: MusicTheme): void {
    if (!this.ctx || this.currentTheme === theme.name) return
    this.stopMusic()
    this.currentTheme = theme.name
    this.step = 0
    this.musicTimer = window.setInterval(() => this.playStep(theme), theme.noteMs)
  }

  stopMusic(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer)
    this.musicTimer = null
    this.currentTheme = null
  }

  private playStep(theme: MusicTheme): void {
    const melodyNote = theme.melody[this.step % theme.melody.length]
    const bassNote = theme.bass[Math.floor(this.step / 2) % theme.bass.length]
    this.step += 1
    if (melodyNote) this.playNote(melodyNote, 'square', theme.noteMs / 1000, 0.06)
    if (bassNote && this.step % 2 === 0) this.playNote(bassNote, 'triangle', theme.noteMs / 500, 0.05)
  }

  private playNote(midi: number, type: OscillatorType, duration: number, gain: number): void {
    this.play({ name: 'note', type, freq: midiToFreq(midi), duration, gain })
  }
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** Shared singleton. */
export const audio = new SfxPlayer()
