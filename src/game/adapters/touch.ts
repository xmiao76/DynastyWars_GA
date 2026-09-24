import Phaser from 'phaser'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../core/constants'
import { neutralInput, type InputState } from '../../core/types'
import { liveStyle } from '../ui/theme'
import { RENDER_SCALE } from '../render'
import { TOUCH_TEX, paintTouchControls, type TouchGeometry } from '../art/hudart'

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
/**
 * Pause button anchor, bottom-centre. Clear of the plates, bars, banners and
 * down-texts in every HUD state (boss and P2 plates included) and of the
 * d-pad and face buttons; the pause slab ends 58px above it.
 */
const PAUSE_CX = SCREEN_WIDTH / 2
const PAUSE_CY = SCREEN_HEIGHT - 22
const PAUSE_R = 12
/**
 * Face-button layout, shared by the hit zones and the painted sheet so art
 * and input can never drift apart. A = attack, B = jump, C = special.
 */
export const TOUCH_BUTTONS = [
  { label: 'A', x: SCREEN_WIDTH - 40, y: SCREEN_HEIGHT - 40 },
  { label: 'B', x: SCREEN_WIDTH - 78, y: SCREEN_HEIGHT - 36 },
  { label: 'C', x: SCREEN_WIDTH - 56, y: SCREEN_HEIGHT - 74 },
] as const

/** The painter's copy of the hit-zone geometry. */
function touchGeometry(): TouchGeometry {
  return {
    padCx: PAD_CX,
    padCy: PAD_CY,
    padArm: PAD_ARM,
    btnR: BTN_R,
    buttons: TOUCH_BUTTONS,
    pauseCx: PAUSE_CX,
    pauseCy: PAUSE_CY,
    pauseR: PAUSE_R,
  }
}

/** Names the visibility gate looks for. A control you can touch you can see. */
export const TOUCH_PAD_NAME = 'touchPad'
export const TOUCH_LABEL_NAME = 'touchLabel'
/** Four directions plus three action buttons plus the pause button. */
export const TOUCH_ZONE_COUNT = 8

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
   * Pause requests from the touch pause button. Wiring, not state: set by the
   * scene that owns the pause flag (GameScene) and never cleared by mount, so
   * HUD rebuilds keep working without re-registration.
   */
  onPauseRequest: (() => void) | null = null

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

    // The controls are one baked bronze-lacquer sheet: cross pad with gold
    // chevrons, three face buttons, the pause coin. Painted to a canvas
    // texture so canvas and WebGL render identical pixels, and named as a
    // single 'touchPad' object so the visibility gate's count is unchanged.
    const sheetKey = 'touch:controls'
    if (!scene.textures.exists(sheetKey)) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(TOUCH_TEX.width * RENDER_SCALE))
      canvas.height = Math.max(1, Math.round(TOUCH_TEX.height * RENDER_SCALE))
      const ctx = canvas.getContext('2d')
      if (ctx) {
        paintTouchControls(ctx, RENDER_SCALE, touchGeometry())
        scene.textures.addCanvas(sheetKey, canvas)
      }
    }
    scene.add
      .image(0, 0, sheetKey)
      .setOrigin(0, 0)
      // The sheet bakes at RENDER_SCALE; show it at logical size or the
      // controls land off the bottom of the screen.
      .setDisplaySize(SCREEN_WIDTH, SCREEN_HEIGHT)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0.55)
      .setName(TOUCH_PAD_NAME)

    for (const b of TOUCH_BUTTONS) {
      scene.add
        .text(b.x, b.y, b.label, { ...liveStyle(10, { color: '#f5e6c8', bold: true, stroke: '#140f14', strokeThickness: 2 }) })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(depth)
        .setAlpha(0.8)
        .setName(TOUCH_LABEL_NAME)
    }

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
    const [btnA, btnB, btnC] = TOUCH_BUTTONS
    if (btnA) tapZone(btnA.x, btnA.y, r, r, () => {
      this.attackBuffered = true
    })
    if (btnB) tapZone(btnB.x, btnB.y, r, r, () => {
      this.jumpBuffered = true
    })
    if (btnC) tapZone(btnC.x, btnC.y, r, r, () => {
      this.specialBuffered = true
    })
    // The pause button's zone, named so tests tap where the scene put it
    // rather than hard-coding a screen point.
    //
    // pointerup, not pointerdown: within one input dispatch, game-object
    // handlers run before the scene-level 'pointerdown' that drives
    // tap-to-continue, and HUD and game scenes each dispatch the same tap. A
    // pointerdown toggle could unpause and then immediately revive inside one
    // tap during a paused countdown. Separating the phases (down sees paused,
    // up toggles) makes the order irrelevant; ~100ms of tap latency is
    // nothing on a pause button.
    makeZone(PAUSE_CX, PAUSE_CY, 44, 44)
      .setName('touchPause')
      .on('pointerup', () => {
        this.onPauseRequest?.()
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
  onPauseRequest: null as (() => void) | null,
}
