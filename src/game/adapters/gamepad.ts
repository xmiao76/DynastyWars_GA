import { neutralInput, type InputState } from '../../core/types'

/**
 * Gamepad adapter: a connected pad -> core InputState, mirroring
 * KeyboardAdapter so the two can be merged without either taking priority.
 *
 * Presses are edge-detected here rather than read as "is down", for the same
 * reason the keyboard buffers them: the sim wants exactly one pressed tick per
 * physical press, and a frame can run zero or several sim steps.
 *
 * This reads `navigator.getGamepads()` directly rather than going through
 * Phaser's gamepad plugin. The Gamepad API is already a plain polling API, the
 * wrapper adds nothing on top of it here, and its cached snapshot updates on
 * its own schedule relative to scene `update` - which showed up as confirms
 * landing on the button RELEASE instead of the press.
 */

/**
 * The nth connected pad, or null. Pads are counted among the CONNECTED ones
 * rather than read at a raw slot, because browsers leave gaps in the array
 * when a controller is unplugged - reading slot 1 directly would hand player
 * two nothing while a perfectly good second pad sat in slot 2.
 */
function padAt(index: number): Gamepad | null {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null
  let seen = 0
  for (const pad of navigator.getGamepads()) {
    if (pad?.connected !== true) continue
    if (seen === index) return pad
    seen += 1
  }
  return null
}

function isPressed(pad: Gamepad, index: number): boolean {
  return pad.buttons[index]?.pressed === true
}

/** Standard-layout button indices (the mapping every common pad reports). */
const BUTTON = {
  a: 0,
  b: 1,
  x: 2,
  y: 3,
  start: 9,
  dpadUp: 12,
  dpadDown: 13,
  dpadLeft: 14,
  dpadRight: 15,
} as const

/** Stick deflection past this counts as a direction. */
export const STICK_DEADZONE = 0.5

export class GamepadAdapter {
  /** Which connected pad this adapter reads: 0 for player one, 1 for two. */
  private readonly padIndex: number

  /**
   * Whether each button has been seen released since this adapter started.
   * A press only counts after a release, so a button still held from the menu
   * that launched the stage cannot fire an action on the first frame of play -
   * the same carryover that let one tap of Start skip character select.
   */
  private attackReleased = false
  private jumpReleased = false
  private specialReleased = false
  private attackBuffered = false
  private jumpBuffered = false
  private specialBuffered = false

  constructor(padIndex = 0) {
    this.padIndex = padIndex
  }

  /**
   * Sample the pad and latch any new presses. Called once per frame, before
   * the sim steps, so a press is never missed between steps.
   */
  poll(): void {
    const pad = padAt(this.padIndex)
    if (!pad) {
      // No pad: everything counts as released, so plugging one in mid-game
      // does not immediately register whatever it happens to be holding.
      this.attackReleased = false
      this.jumpReleased = false
      this.specialReleased = false
      return
    }
    const edge = (down: boolean, released: boolean): { released: boolean; fired: boolean } => {
      if (!down) return { released: true, fired: false }
      if (released) return { released: false, fired: true }
      return { released, fired: false }
    }
    const a = edge(isPressed(pad, BUTTON.a), this.attackReleased)
    const b = edge(isPressed(pad, BUTTON.b), this.jumpReleased)
    const x = edge(isPressed(pad, BUTTON.x) || isPressed(pad, BUTTON.y), this.specialReleased)
    this.attackReleased = a.released
    this.jumpReleased = b.released
    this.specialReleased = x.released
    if (a.fired) this.attackBuffered = true
    if (b.fired) this.jumpBuffered = true
    if (x.fired) this.specialBuffered = true
  }

  /**
   * Has this pad pressed an action since the last read? Used for the co-op
   * join and rejoin prompts, mirroring the keyboard adapter.
   */
  wantsToJoin(): boolean {
    return this.attackBuffered || this.jumpBuffered || this.specialBuffered
  }

  /**
   * Read current input. `allowPressed` is false for catch-up ticks within one
   * frame, so one physical press produces exactly one pressed tick.
   */
  read(allowPressed: boolean): InputState {
    const pad = padAt(this.padIndex)
    if (!pad) return neutralInput()
    const axisX = pad.axes[0] ?? 0
    const axisY = pad.axes[1] ?? 0
    const attackPressed = allowPressed && this.attackBuffered
    const jumpPressed = allowPressed && this.jumpBuffered
    const specialPressed = allowPressed && this.specialBuffered
    if (allowPressed) {
      this.attackBuffered = false
      this.jumpBuffered = false
      this.specialBuffered = false
    }
    return {
      up: isPressed(pad, BUTTON.dpadUp) || axisY < -STICK_DEADZONE,
      down: isPressed(pad, BUTTON.dpadDown) || axisY > STICK_DEADZONE,
      left: isPressed(pad, BUTTON.dpadLeft) || axisX < -STICK_DEADZONE,
      right: isPressed(pad, BUTTON.dpadRight) || axisX > STICK_DEADZONE,
      attackPressed,
      jumpPressed,
      specialPressed,
    }
  }

  /**
   * Drop latched presses without reporting them. Called by the pause gate;
   * the release trackers are deliberately left alone, since polling continues
   * while paused and they still describe the physical pad.
   */
  clear(): void {
    this.attackBuffered = false
    this.jumpBuffered = false
    this.specialBuffered = false
  }
}

/** Either input source pressing a control counts as that control pressed. */
export function mergeInputs(a: InputState, b: InputState): InputState {
  return {
    up: a.up || b.up,
    down: a.down || b.down,
    left: a.left || b.left,
    right: a.right || b.right,
    attackPressed: a.attackPressed || b.attackPressed,
    jumpPressed: a.jumpPressed || b.jumpPressed,
    specialPressed: a.specialPressed || b.specialPressed,
  }
}

/**
 * Run `onConfirm` when Start is pressed, for menu scenes that otherwise only
 * listen for Enter. Returns a per-frame poll function the scene calls in
 * `update`; it edge-detects so holding Start does not retrigger. `padIndex`
 * selects which connected pad's Start it watches (0 = player one).
 */
export function watchConfirmButton(onConfirm: () => void, padIndex = 0): () => void {
  // The watcher must SEE A RELEASE before it accepts a press. Tracking only
  // "down and it wasn't last frame" is not enough across a scene change: the
  // confirm that leaves one menu starts the next one with the button still
  // held, the fresh watcher reads that as a new press, and a single tap of
  // Start walked straight from the title through character select and into the
  // game. Requiring a release makes a held button inert until it is let go.
  let seenRelease = false
  return () => {
    const pad = padAt(padIndex)
    const down = pad !== null && isPressed(pad, BUTTON.start)
    if (!down) {
      seenRelease = true
      return
    }
    if (seenRelease) {
      seenRelease = false
      onConfirm()
    }
  }
}
