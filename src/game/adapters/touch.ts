import Phaser from 'phaser'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../core/constants'
import { neutralInput, type InputState } from '../../core/types'

/**
 * Touch adapter: on-screen controls -> core InputState, mirroring the keyboard
 * and gamepad adapters so all three merge without any of them taking priority.
 *
 * The game is a public URL and had no input path at all on a phone: the canvas
 * scaled correctly and nothing errored, but a tap did nothing and the title
 * screen was as far as anyone got.
 *
 * Action presses are buffered in the `pointerdown` handler itself, exactly as
 * the keyboard adapter buffers `keydown`, rather than being derived from
 * polled button state. A tap that begins and ends inside one frame - which is
 * an ordinary, fast tap - would otherwise be set and cleared between two polls
 * and dropped completely. Directions stay polled, because holding is the point.
 *
 * STATE AND VIEW ARE SEPARATE, and that split is load-bearing rather than
 * tidiness. The controls are screen furniture, so they are drawn into the HUD -
 * but the HUD rebuilds its whole display list for each stage, and an adapter
 * that owned its objects would be reading dead ones after the first stage
 * break. So the held flags and press buffers live here for the lifetime of the
 * game while `mount` (re)builds the objects into whatever scene currently owns
 * the screen. The scene that READS this adapter never has to know.
 */

/** Does this device actually have a touchscreen? */
export function hasTouch(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
  return navigator.maxTouchPoints > 0 || 'ontouchstart' in window
}

const PAD_CX = 46
const PAD_CY = SCREEN_HEIGHT - 46
const PAD_ARM = 17
const BTN_R = 15
const FACE = 0xf0e6d2
const EDGE = 0x140f14

/** Names the visibility gate looks for. A control you can touch you can see. */
export const TOUCH_PAD_NAME = 'touchPad'
export const TOUCH_LABEL_NAME = 'touchLabel'
/** Four directions plus three action buttons. */
export const TOUCH_ZONE_COUNT = 7

interface Held {
  down: boolean
}

function noneHeld(): Record<'up' | 'down' | 'left' | 'right', Held> {
  return { up: { down: false }, down: { down: false }, left: { down: false }, right: { down: false } }
}

export class TouchAdapter {
  private dirs = noneHeld()
  private attackBuffered = false
  private jumpBuffered = false
  private specialBuffered = false

  /**
   * Draw the controls into `scene` and wire them to this adapter's state.
   *
   * Safe to call again after the scene has swept its display list: the old
   * objects are gone, so fresh `Held` records replace the ones they fed. That
   * also releases any direction that was down across the rebuild, which would
   * otherwise stick forever - nothing is left to receive its `pointerup`.
   */
  mount(scene: Phaser.Scene, depth = 9_500): void {
    this.dirs = noneHeld()
    this.attackBuffered = false
    this.jumpBuffered = false
    this.specialBuffered = false

    const g = scene.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0.32)
      .setName(TOUCH_PAD_NAME)

    const cross = (dx: number, dy: number): void => {
      g.fillStyle(FACE, 1)
      g.fillRoundedRect(PAD_CX + dx - PAD_ARM / 2, PAD_CY + dy - PAD_ARM / 2, PAD_ARM, PAD_ARM, 3)
      g.lineStyle(1, EDGE, 0.8)
      g.strokeRoundedRect(PAD_CX + dx - PAD_ARM / 2, PAD_CY + dy - PAD_ARM / 2, PAD_ARM, PAD_ARM, 3)
    }
    cross(0, -PAD_ARM)
    cross(0, PAD_ARM)
    cross(-PAD_ARM, 0)
    cross(PAD_ARM, 0)

    const face = (x: number, y: number, label: string): void => {
      g.fillStyle(FACE, 1)
      g.fillCircle(x, y, BTN_R)
      g.lineStyle(1, EDGE, 0.8)
      g.strokeCircle(x, y, BTN_R)
      scene.add
        .text(x, y, label, { fontFamily: 'sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#140f14' })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(depth)
        .setAlpha(0.42)
        .setName(TOUCH_LABEL_NAME)
    }
    const bx = SCREEN_WIDTH - 40
    const by = SCREEN_HEIGHT - 40
    face(bx, by, 'A')
    face(bx - 38, by + 4, 'B')
    face(bx - 16, by - 34, 'C')

    // Hit areas are generous - larger than the drawn control - because a thumb
    // is not a mouse pointer and a miss mid-fight reads as the game ignoring
    // you. They are Zones rather than the Graphics itself so the visual can
    // stay small and unobtrusive.
    const makeZone = (x: number, y: number, w: number, h: number): Phaser.GameObjects.Zone =>
      scene.add.zone(x, y, w, h).setScrollFactor(0).setDepth(depth).setInteractive({ useHandCursor: false })

    /** A direction: held state, because holding it is the whole point. */
    const holdZone = (x: number, y: number, w: number, h: number): Held => {
      const z = makeZone(x, y, w, h)
      const held: Held = { down: false }
      z.on('pointerdown', () => {
        held.down = true
      })
      const release = (): void => {
        held.down = false
      }
      z.on('pointerup', release)
      z.on('pointerout', release)
      z.on('pointerupoutside', release)
      return held
    }

    /** An action: latched the moment it is touched, so a fast tap is kept. */
    const tapZone = (x: number, y: number, w: number, h: number, latch: () => void): void => {
      makeZone(x, y, w, h).on('pointerdown', latch)
    }

    const arm = PAD_ARM * 1.6
    this.dirs = {
      up: holdZone(PAD_CX, PAD_CY - PAD_ARM, arm, arm),
      down: holdZone(PAD_CX, PAD_CY + PAD_ARM, arm, arm),
      left: holdZone(PAD_CX - PAD_ARM, PAD_CY, arm, arm),
      right: holdZone(PAD_CX + PAD_ARM, PAD_CY, arm, arm),
    }
    const r = BTN_R * 2.2
    tapZone(bx, by, r, r, () => {
      this.attackBuffered = true
    })
    tapZone(bx - 38, by + 4, r, r, () => {
      this.jumpBuffered = true
    })
    tapZone(bx - 16, by - 34, r, r, () => {
      this.specialBuffered = true
    })
  }

  /**
   * Nothing to sample: actions latch on their own pointerdown. Kept so the
   * three input adapters share one shape in GameScene's update.
   */
  poll(): void {}

  /**
   * Read current input. `allowPressed` is false for catch-up ticks within one
   * frame, so one tap produces exactly one pressed tick. An adapter that has
   * never been mounted reports neutral, which is what a device with no
   * touchscreen gets.
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
      up: this.dirs.up.down,
      down: this.dirs.down.down,
      left: this.dirs.left.down,
      right: this.dirs.right.down,
      attackPressed,
      jumpPressed,
      specialPressed,
    }
  }

  /**
   * Drop latched taps without reporting them. Called by the pause gate, so a
   * tap made while paused cannot fire on resume. Held directions are polled
   * live and need no clearing: a direction still held at resume keeps working.
   */
  clear(): void {
    this.attackBuffered = false
    this.jumpBuffered = false
    this.specialBuffered = false
  }
}

/** A neutral-input stand-in for devices with no touchscreen. */
export const NO_TOUCH = {
  poll(): void {},
  read(): InputState {
    return neutralInput()
  },
  clear(): void {},
}
