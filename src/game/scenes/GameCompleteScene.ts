import Phaser from 'phaser'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../core/constants'
import { audio } from '../audio/sfx'
import { TITLE_THEME } from '../audio/music'
import { watchConfirmButton } from '../adapters/gamepad'
import { hasTouch } from '../adapters/touch'
import { consumePendingStart, type BridgeState } from '../debug/bridge'
import { CHARACTER_ORDER } from '../../core/characters'
import { ensureEntityTextures } from '../adapters/sprites'
import { addVignette, drawSlab } from '../ui/panels'
import { useLogicalViewport } from '../ui/viewport'

export interface GameCompleteSceneData {
  score?: number
  totalTicks?: number
}

/** Game complete: the whole run's score and time, then back to title. */
export class GameCompleteScene extends Phaser.Scene {
  private bridge!: BridgeState
  /** Per-frame poll so Start confirms as well as Enter. */
  private pollConfirm: () => void = () => {}

  constructor() {
    super('gamecomplete')
  }

  create(data: GameCompleteSceneData): void {
    useLogicalViewport(this)
    this.bridge = this.registry.get('bridge') as BridgeState
    this.bridge.scene = 'gamecomplete'
    this.bridge.sim = null
    audio.startMusic(TITLE_THEME)

    const score = data.score ?? 0
    const totalSeconds = ((data.totalTicks ?? 0) / 60).toFixed(1)

    // The ending was the one screen that never got the framed treatment the
    // rest of the game uses: plain text on a near-black field. It is the last
    // thing a player who finishes all nine stages sees, so it now gets the
    // victory panel and the five heroes lined up beneath it.
    this.add.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT, 0x241a0a)
    this.add.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 52, SCREEN_WIDTH, 104, 0x3a2a12)
    addVignette(this, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0.7)

    // The victorious five, standing on the lower band.
    ensureEntityTextures(this, [...CHARACTER_ORDER])
    const spacing = 54
    const startX = SCREEN_WIDTH / 2 - (spacing * (CHARACTER_ORDER.length - 1)) / 2
    CHARACTER_ORDER.forEach((charId, i) => {
      const key = `entity:${charId}:idle`
      if (!this.textures.exists(key)) return
      const figure = this.add.sprite(startX + i * spacing, SCREEN_HEIGHT - 16, key).setOrigin(0.5, 1)
      const frame = figure.texture.get()
      const h = 62
      figure.setDisplaySize((frame.width / frame.height) * h, h)
    })

    drawSlab(this, SCREEN_WIDTH / 2 - 170, 30, 340, 140, 0xc8a828, 0)
    this.add
      .text(SCREEN_WIDTH / 2, 56, 'GAME COMPLETE!', {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        color: '#ffd700',
      })
      .setOrigin(0.5)
    this.add
      .text(SCREEN_WIDTH / 2, 84, 'Lu Bu has fallen - the land is at peace', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#f5e6c8',
      })
      .setOrigin(0.5)
    this.add
      .text(SCREEN_WIDTH / 2, 116, `FINAL SCORE  ${score}`, {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
    this.add
      .text(SCREEN_WIDTH / 2, 142, `TOTAL TIME  ${totalSeconds}s`, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#9ab0c0',
      })
      .setOrigin(0.5)
    this.add
      .text(SCREEN_WIDTH / 2, 158, hasTouch() ? 'TAP TO CONTINUE' : 'PRESS ENTER', { fontFamily: 'sans-serif', fontSize: '11px', color: '#ffffff' })
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
    // Harness startGame() must be honored from any scene (see ResultScene).
    const pending = consumePendingStart(this.bridge)
    if (pending) {
      this.scene.start('game', { seed: pending.seed, charId: pending.charId, stageId: pending.stageId })
    }
  }
}
