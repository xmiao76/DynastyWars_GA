import Phaser from 'phaser'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../core/constants'
import { hasTouch } from '../adapters/touch'
import { paintDuskBattle } from '../art/keyart'
import { RENDER_SCALE } from '../render'
import { addVignette, drawSlab, ensureDisplayTextTexture } from '../ui/panels'
import { THEME, css, liveStyle } from '../ui/theme'
import { useLogicalViewport } from '../ui/viewport'
import type { BridgeState } from '../debug/bridge'

/**
 * TEMPORARY UI-1 style frame, removed in UI-2. Reached only via ?styleframe=1:
 * a mock of the new title direction (painted dusk backdrop, baked gold-foil
 * lockup, bronze control plaque) rendered through the real theme/baker/panel
 * code paths, so the owner judges the actual kit rather than a picture of it.
 */
export class StyleFrameScene extends Phaser.Scene {
  constructor() {
    super('styleframe')
  }

  create(): void {
    useLogicalViewport(this)
    const bridge = this.registry.get('bridge') as BridgeState
    bridge.scene = 'styleframe'
    bridge.sim = null

    const key = 'ui:keyart-dusk'
    if (!this.textures.exists(key)) {
      const canvas = document.createElement('canvas')
      canvas.width = SCREEN_WIDTH * RENDER_SCALE
      canvas.height = SCREEN_HEIGHT * RENDER_SCALE
      const ctx = canvas.getContext('2d')
      if (ctx) paintDuskBattle(ctx, canvas.width, canvas.height)
      this.textures.addCanvas(key, canvas)
    }
    this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, key).setDisplaySize(SCREEN_WIDTH, SCREEN_HEIGHT)
    addVignette(this, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0.45)

    // Baked lockup: gold-foil wordmark over a bone subtitle.
    const logoKey = ensureDisplayTextTexture(this, 'DYNASTY WARS', { variant: 'gold', size: 40 })
    const logoFrame = this.textures.get(logoKey).get()
    const logoH = 44
    this.add
      .image(SCREEN_WIDTH / 2, 44, logoKey)
      .setDisplaySize((logoFrame.width / Math.max(1, logoFrame.height)) * logoH, logoH)
    const subKey = ensureDisplayTextTexture(this, ' Battle of Red Cliffs · 赤壁之战 ', {
      variant: 'bone',
      size: 13,
    })
    const subFrame = this.textures.get(subKey).get()
    const subH = 15
    this.add
      .image(SCREEN_WIDTH / 2, 76, subKey)
      .setDisplaySize((subFrame.width / Math.max(1, subFrame.height)) * subH, subH)

    // Bronze control plaque: the same device-specific strings as the title.
    const touch = hasTouch()
    drawSlab(this, 86, 112, 308, 52, THEME.bronze, 0, { skew: 14 })
    const keyLine = liveStyle(9, { color: '#f5e6c8' })
    this.add
      .text(
        SCREEN_WIDTH / 2,
        124,
        touch ? 'D-PAD  MOVE      A  ATTACK      B  JUMP' : 'ARROWS  MOVE      Z  ATTACK      X  JUMP',
        { ...keyLine },
      )
      .setOrigin(0.5)
    this.add
      .text(
        SCREEN_WIDTH / 2,
        138,
        touch ? 'C  SPECIAL      TAP  CONFIRM' : 'C  SPECIAL      ENTER  CONFIRM      M  MUTE      P  PAUSE',
        { ...keyLine },
      )
      .setOrigin(0.5)
    this.add
      .text(
        SCREEN_WIDTH / 2,
        153,
        touch ? '2P NEEDS A KEYBOARD OR A SECOND GAMEPAD' : '2P: PRESS F TO JOIN ANY TIME  -  WASD  F/G/H',
        { ...liveStyle(8, { color: css(THEME.frost) }) },
      )
      .setOrigin(0.5)

    const prompt = this.add
      .text(SCREEN_WIDTH / 2, 178, touch ? 'TAP TO START' : 'PRESS START', {
        ...liveStyle(13, { color: '#ffffff', bold: true }),
      })
      .setOrigin(0.5)
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 })

    // Drifting embers: purely visual tweens over the middle band.
    for (let i = 0; i < 14; i += 1) {
      const x = 20 + ((i * 173) % 440)
      const dot = this.add.circle(x, 150 + ((i * 97) % 60), 1.4, 0xffb060, 0.85)
      dot.setBlendMode('ADD')
      this.tweens.add({
        targets: dot,
        y: dot.y - 40 - (i % 5) * 8,
        x: x + 18,
        alpha: 0,
        duration: 2200 + (i % 7) * 300,
        repeat: -1,
        delay: (i % 9) * 260,
        onRepeat: () => dot.setAlpha(0.85),
      })
    }

    this.input.keyboard?.on('keydown-ENTER', () => this.scene.start('select'))
    this.input.on('pointerdown', () => this.scene.start('select'))
  }
}
