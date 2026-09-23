import Phaser from 'phaser'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../core/constants'
import { audio } from '../audio/sfx'
import { addVignette, drawSlab } from '../ui/panels'
import { liveStyle } from '../ui/theme'
import { watchConfirmButton } from '../adapters/gamepad'
import { hasTouch } from '../adapters/touch'
import { consumePendingStart, type BridgeState } from '../debug/bridge'
import { useLogicalViewport } from '../ui/viewport'

export interface GameOverSceneData {
  score?: number
}

/**
 * Game over screen: a filled red "defeat" dialog with a fallen hero,
 * final score plate, then back to title.
 */
export class GameOverScene extends Phaser.Scene {
  private bridge!: BridgeState
  /** Per-frame poll so Start confirms as well as Enter. */
  private pollConfirm: () => void = () => {}

  constructor() {
    super('gameover')
  }

  create(data: GameOverSceneData): void {
    useLogicalViewport(this)
    this.bridge = this.registry.get('bridge') as BridgeState
    this.bridge.scene = 'gameover'
    this.bridge.sim = null
    audio.stopMusic()

    // Dark battlefield backdrop with a dying red glow.
    this.add.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT, 0x12080a)
    this.add.rectangle(SCREEN_WIDTH / 2, 110, SCREEN_WIDTH, 160, 0x7a1a1a, 0.4).setBlendMode('ADD')
    addVignette(this, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0.65)

    // The defeat dialog.
    // Depth 0, not a high one: Phaser draws equal-depth objects in insertion
    // order, and this panel is added BEFORE the content it frames. Hoisting it
    // to a high depth pulled it in front of every sprite and label in the scene
    // (all of which sit at the default depth 0), hiding them behind the slab.
    drawSlab(this, SCREEN_WIDTH / 2 - 150, 60, 300, 150, 0xd33a3a, 0)

    this.add
      .text(SCREEN_WIDTH / 2, 88, 'GAME OVER', {
        ...liveStyle(30, { color: '#ff6a5a', bold: true, stroke: '#4a0000', strokeThickness: 4 }),
      })
      .setOrigin(0.5)

    // Final score plate. The plate is CENTRED on the dialog: it was written
    // for a top-left origin (`x - 70`, then 140 wide) but `add.rectangle`
    // centres by default, so it rendered half a width to the left and cut
    // through the caption above it.
    this.add
      .text(SCREEN_WIDTH / 2, 126, 'FINAL SCORE', { ...liveStyle(8, { color: '#c8a0a0' }) })
      .setOrigin(0.5)
    this.add
      .rectangle(SCREEN_WIDTH / 2, 150, 140, 28, 0x0c0c14, 0.9)
      .setStrokeStyle(1, 0x7a3a3a)
    this.add
      .text(SCREEN_WIDTH / 2, 150, `${data.score ?? 0}`, {
        ...liveStyle(18, { color: '#ffffff', bold: true }),
      })
      .setOrigin(0.5)
    this.add
      .text(SCREEN_WIDTH / 2, 188, hasTouch() ? 'TAP TO CONTINUE' : 'PRESS ENTER', { ...liveStyle(10, { color: '#9ab0c0' }) })
      .setOrigin(0.5)

    const confirm = (): void => {
      this.scene.start('title')
    }
    this.pollConfirm = watchConfirmButton(confirm)
    // A tap anywhere confirms: without it a touch device could not get past
    // this screen at all.
    this.input.on('pointerdown', confirm)
    this.input.keyboard?.on('keydown-ENTER', confirm)
  }

  update(): void {
    this.pollConfirm()
    // A harness startGame() can arrive while this screen is up - jump into the
    // requested stage so the bridge's startGame is deterministic from any scene.
    const pending = consumePendingStart(this.bridge)
    if (pending) {
      this.scene.start('game', { seed: pending.seed, charId: pending.charId, stageId: pending.stageId })
    }
  }
}