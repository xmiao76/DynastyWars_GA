import Phaser from 'phaser'
import type { InputState } from '../../core/types'

/**
 * Keyboard adapter: Phaser keys -> core InputState.
 *
 * Player one uses the arrows with Z/X/C; player two shares the keyboard on
 * WASD with F/G/H, which is why the scheme is a parameter rather than being
 * hard-coded. Enter confirms (handled by scenes).
 *
 * Presses are captured by event into a buffer, not by polling JustDown: a
 * press that lands on a frame with zero sim steps (or an instant down/up
 * from an automated driver) must not be lost.
 */
/** Which physical keys drive one player. */
export interface KeyScheme {
  up: string
  down: string
  left: string
  right: string
  attack: string
  jump: string
  special: string
}

export const PLAYER_ONE_KEYS: KeyScheme = {
  up: 'UP',
  down: 'DOWN',
  left: 'LEFT',
  right: 'RIGHT',
  attack: 'Z',
  jump: 'X',
  special: 'C',
}

export const PLAYER_TWO_KEYS: KeyScheme = {
  up: 'W',
  down: 'S',
  left: 'A',
  right: 'D',
  attack: 'F',
  jump: 'G',
  special: 'H',
}

export class KeyboardAdapter {
  private keys: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key | undefined>
  private attackBuffered = false
  private jumpBuffered = false
  private specialBuffered = false

  constructor(scene: Phaser.Scene, scheme: KeyScheme = PLAYER_ONE_KEYS) {
    const keyboard = scene.input.keyboard
    const key = (name: string): Phaser.Input.Keyboard.Key | undefined => keyboard?.addKey(name)
    this.keys = {
      up: key(scheme.up),
      down: key(scheme.down),
      left: key(scheme.left),
      right: key(scheme.right),
    }
    keyboard?.on(`keydown-${scheme.attack}`, (event: KeyboardEvent) => {
      if (!event.repeat) this.attackBuffered = true
    })
    keyboard?.on(`keydown-${scheme.jump}`, (event: KeyboardEvent) => {
      if (!event.repeat) this.jumpBuffered = true
    })
    keyboard?.on(`keydown-${scheme.special}`, (event: KeyboardEvent) => {
      if (!event.repeat) this.specialBuffered = true
    })
  }

  /** Has this player pressed anything at all? Used for the co-op join prompt. */
  wantsToJoin(): boolean {
    return this.attackBuffered || this.jumpBuffered || this.specialBuffered
  }

  /**
   * Read current input. `allowPressed` is false for catch-up ticks within one
   * frame, so one physical press produces exactly one pressed tick.
   */
  read(allowPressed: boolean): InputState {
    const attackPressed = allowPressed && this.attackBuffered
    const jumpPressed = allowPressed && this.jumpBuffered
    const specialPressed = allowPressed && this.specialBuffered
    if (allowPressed) {
      this.attackBuffered = false
      this.jumpBuffered = false
      this.specialBuffered = false
    }
    return {
      up: this.keys.up?.isDown === true,
      down: this.keys.down?.isDown === true,
      left: this.keys.left?.isDown === true,
      right: this.keys.right?.isDown === true,
      attackPressed,
      jumpPressed,
      specialPressed,
    }
  }

  /**
   * Drop any buffered presses without reporting them. The pause gate calls
   * this every frozen frame (and on the toggle itself), so a press made while
   * paused - or still sitting in the buffer when pause lands - cannot leak
   * through as an action, jump, or co-op join on resume.
   */
  clear(): void {
    this.attackBuffered = false
    this.jumpBuffered = false
    this.specialBuffered = false
  }
}
