import Phaser from 'phaser'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../core/constants'
import { audio } from '../audio/sfx'
import { TITLE_THEME } from '../audio/music'
import { watchConfirmButton } from '../adapters/gamepad'
import { hasTouch } from '../adapters/touch'
import { ensureEntityTextures } from '../adapters/sprites'
import { useLogicalViewport } from '../ui/viewport'
import { addVignette, drawSlab, ensureLogoTexture } from '../ui/panels'
import { liveStyle } from '../ui/theme'
import { consumePendingStart, type BridgeState } from '../debug/bridge'

/**
 * Title screen.
 *
 * Plates are added BEFORE the content they frame and left at depth 0. Phaser
 * draws equal-depth objects in insertion order, so that is what keeps them
 * underneath; hoisting one to a high depth is what once pulled every panel in
 * front of its own text and left the title unreadable in WebGL.
 */
export class TitleScene extends Phaser.Scene {
  private bridge!: BridgeState
  /** Per-frame poll so Start confirms as well as Enter. */
  private pollConfirm: () => void = () => {}

  constructor() {
    super('title')
  }

  create(): void {
    useLogicalViewport(this)
    this.bridge = this.registry.get('bridge') as BridgeState
    this.bridge.scene = 'title'
    this.bridge.sim = null
    audio.startMusic(TITLE_THEME)

    // Backdrop: a deep field with a lit band behind the wordmark, so the logo
    // has something to sit against rather than floating on flat colour.
    this.add.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT, 0x1d0a10)
    this.add.rectangle(SCREEN_WIDTH / 2, 62, SCREEN_WIDTH, 78, 0x3a1016)
    this.add.rectangle(SCREEN_WIDTH / 2, 100, SCREEN_WIDTH, 3, 0xc8a828, 0.5)
    this.add.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 44, SCREEN_WIDTH, 88, 0x140609)
    // With the backdrop, not over the content. A vignette added last sits above
    // every label - and although its centre is transparent, the occlusion gate
    // judges the OBJECT, which is fully opaque and covers the whole screen. It
    // was right to flag it: nothing should be able to assert "the middle of my
    // texture happens to be see-through" as a reason to cover text.
    addVignette(this, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0.5)

    // The hero line-up, on a plinth. Textures are generated here rather than
    // assumed: the title runs before any stage does, and relying on a preload
    // once left this screen with no heroes on it at all.
    const heroes = ['guanyu', 'zhangfei', 'zhaoyun', 'huangzhong', 'weiyan']
    ensureEntityTextures(this, heroes)
    const spacing = 62
    const startX = SCREEN_WIDTH / 2 - (spacing * (heroes.length - 1)) / 2
    drawSlab(this, 28, SCREEN_HEIGHT - 76, SCREEN_WIDTH - 56, 68, 0x8a3030, 0, { skew: 16 })
    for (const [i, hero] of heroes.entries()) {
      const key = `entity:${hero}:idle`
      if (!this.textures.exists(key)) continue
      const sprite = this.add.sprite(startX + i * spacing, SCREEN_HEIGHT - 12, key)
      sprite.setOrigin(0.5, 1)
      const frame = sprite.texture.get()
      const h = 74
      sprite.setDisplaySize((frame.width / frame.height) * h, h)
    }

    // The wordmark, and the subtitle under it.
    const logoKey = ensureLogoTexture(this)
    const logoFrame = this.textures.get(logoKey).get()
    const logoH = 52
    this.add
      .image(SCREEN_WIDTH / 2, 56, logoKey)
      .setOrigin(0.5)
      .setDisplaySize((logoFrame.width / Math.max(1, logoFrame.height)) * logoH, logoH)
    this.add
      .text(SCREEN_WIDTH / 2, 88, 'Battle of Red Cliffs · 赤壁之战', {
        ...liveStyle(13, { color: '#f0d8a8' }),
      })
      .setOrigin(0.5)

    // Controls, on their own plate - naming the controls THIS device has.
    //
    // A phone was told ARROWS / Z / X / ENTER / M and "2P: PRESS F", none of
    // which it has, while the d-pad and A/B/C buttons it is about to be given
    // went unmentioned. This screen already knew it was a touch device - the
    // prompt underneath says TAP TO START - so the plate was the one place
    // that had not been told. Mute is keyboard-only and is simply not
    // advertised here rather than invented; co-op needs a keyboard or a second
    // gamepad, and saying so is more use to a phone player than "PRESS F".
    const touch = hasTouch()
    drawSlab(this, 86, 112, 308, 52, 0x8a3030, 0, { skew: 14 })
    const keyLine = liveStyle(9, { color: '#f5e6c8' })
    this.add
      .text(
        SCREEN_WIDTH / 2,
        124,
        touch
          ? 'D-PAD  MOVE      A  ATTACK      B  JUMP'
          : 'ARROWS  MOVE      Z  ATTACK      X  JUMP',
        keyLine,
      )
      .setOrigin(0.5)
    this.add
      .text(
        SCREEN_WIDTH / 2,
        138,
        touch ? 'C  SPECIAL      TAP  CONFIRM' : 'C  SPECIAL      ENTER  CONFIRM      M  MUTE      P  PAUSE',
        keyLine,
      )
      .setOrigin(0.5)
    this.add
      .text(SCREEN_WIDTH / 2, 153, touch
        ? '2P NEEDS A KEYBOARD OR A SECOND GAMEPAD'
        : '2P: PRESS F TO JOIN ANY TIME  -  WASD  F/G/H', {
        ...liveStyle(8, { color: '#cfe8ff' }),
      })
      .setOrigin(0.5)

    const prompt = this.add
      .text(SCREEN_WIDTH / 2, 176, hasTouch() ? 'TAP TO START' : 'PRESS ENTER', {
        ...liveStyle(13, { color: '#ffffff', bold: true }),
      })
      .setOrigin(0.5)
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 })

    this.input.keyboard?.on('keydown-ENTER', () => this.start())
    this.input.on('pointerdown', () => this.start())
    this.pollConfirm = watchConfirmButton(() => this.start())
  }

  update(): void {
    this.pollConfirm()
    const pending = consumePendingStart(this.bridge)
    if (pending) {
      this.scene.start('game', { seed: pending.seed, charId: pending.charId, stageId: pending.stageId })
      return
    }
    if (this.bridge.autopilot) {
      // Autopilot: ticks advance only when the harness queues them.
      while (this.bridge.pendingSteps > 0) {
        this.bridge.pendingSteps -= 1
        this.bridge.tick += 1
      }
    } else {
      this.bridge.tick += 1
    }
  }

  private start(): void {
    // First user gesture unlocks WebAudio (browser autoplay policy).
    audio.unlock()
    audio.startMusic(TITLE_THEME)
    this.scene.start('select')
  }
}
