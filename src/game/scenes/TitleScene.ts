import Phaser from 'phaser'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../core/constants'
import { audio } from '../audio/sfx'
import { TITLE_THEME } from '../audio/music'
import { watchConfirmButton } from '../adapters/gamepad'
import { hasTouch } from '../adapters/touch'
import { paintDuskBattle } from '../art/keyart'
import { RENDER_SCALE } from '../render'
import { useLogicalViewport } from '../ui/viewport'
import { addVignette, drawSlab, ensureDisplayTextTexture, ensureSheenStrip } from '../ui/panels'
import { THEME, css, liveStyle } from '../ui/theme'
import { browserStorage, readHiScore } from '../ui/hiscore'
import { consumePendingStart, type BridgeState } from '../debug/bridge'

/**
 * Title screen: the arcade attract screen (UI-2).
 *
 * Painted Five-Tigers key art over the burning Red-Cliffs fleet, baked
 * gold-foil lockup, a bronze control plaque naming the controls THIS device
 * has, the persisted hi-score, and a blinking prompt over drifting embers.
 * The procedural dusk battle remains as the fallback backdrop when the photo
 * texture is absent - the title never boots onto a flat field.
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

    // Backdrop: the painted key art when BootScene decoded it, else the
    // procedural dusk battle baked once (deterministic paint, same sky).
    if (this.textures.exists('ui:keyart-photo')) {
      this.add
        .image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 'ui:keyart-photo')
        .setDisplaySize(SCREEN_WIDTH, SCREEN_HEIGHT)
    } else {
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
    }
    // With the backdrop, not over the content (see the module comment in the
    // pre-UI-2 version: the occlusion gate judges the whole vignette object).
    addVignette(this, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0.45)

    // The baked lockup, and the subtitle under it.
    const logoKey = ensureDisplayTextTexture(this, 'DYNASTY WARS', { variant: 'gold', size: 40 })
    const logoFrame = this.textures.get(logoKey).get()
    const logoH = 44
    // A glint sweeps the foil every few seconds: baked frames, cycled on the
    // scene clock (visual only; the sim never sees it).
    const sheenFrames = 12
    const sheenKey = ensureSheenStrip(this, logoKey, sheenFrames)
    const hasSheen = this.textures.exists(sheenKey)
    const logo = this.add
      .image(SCREEN_WIDTH / 2, 44, hasSheen ? sheenKey : logoKey, hasSheen ? 'f0' : undefined)
      .setOrigin(0.5)
      .setDisplaySize((logoFrame.width / Math.max(1, logoFrame.height)) * logoH, logoH)
    if (hasSheen) {
      let step = 0
      this.time.addEvent({
        delay: 55,
        loop: true,
        callback: () => {
          // 12 lit frames, then ~3.3 s of plain foil before the next pass.
          step = (step + 1) % (sheenFrames + 60)
          logo.setFrame(step >= 1 && step <= sheenFrames ? `f${step}` : 'f0', false, false)
        },
      })
    }
    const subKey = ensureDisplayTextTexture(this, ' Battle of Red Cliffs · 赤壁之战 ', {
      variant: 'bone',
      size: 13,
    })
    const subFrame = this.textures.get(subKey).get()
    const subH = 15
    this.add
      .image(SCREEN_WIDTH / 2, 76, subKey)
      .setOrigin(0.5)
      .setDisplaySize((subFrame.width / Math.max(1, subFrame.height)) * subH, subH)

    // Controls, on a bronze plaque - naming the controls THIS device has.
    //
    // A phone was told ARROWS / Z / X / ENTER / M and "2P: PRESS F", none of
    // which it has, while the d-pad and A/B/C buttons it is about to be given
    // went unmentioned. This screen already knew it was a touch device - the
    // prompt underneath says TAP TO START - so the plate was the one place
    // that had not been told. Mute is keyboard-only and is simply not
    // advertised here rather than invented; co-op needs a keyboard or a second
    // gamepad, and saying so is more use to a phone player than "PRESS F".
    //
    // It sits in the baked bottom scrim, below the heroes' faces: the arcade
    // attract layout (lockup top, cast middle, prompt and credits bottom). At
    // y108 it had covered the three centre heroes from the brow down.
    const touch = hasTouch()
    drawSlab(this, 86, 212, 308, 50, THEME.bronze, 0, { skew: 14 })
    const keyLine = liveStyle(9, { color: '#f5e6c8' })
    this.add
      .text(
        SCREEN_WIDTH / 2,
        223,
        touch
          ? 'D-PAD  MOVE      A  ATTACK      B  JUMP'
          : 'ARROWS  MOVE      Z  ATTACK      X  JUMP',
        { ...keyLine },
      )
      .setOrigin(0.5)
    this.add
      .text(
        SCREEN_WIDTH / 2,
        236,
        touch ? 'C  SPECIAL      TAP  CONFIRM' : 'C  SPECIAL      ENTER  CONFIRM      M  MUTE      P  PAUSE',
        { ...keyLine },
      )
      .setOrigin(0.5)
    this.add
      .text(SCREEN_WIDTH / 2, 250, touch
        ? '2P NEEDS A KEYBOARD OR A SECOND GAMEPAD'
        : '2P: PRESS F TO JOIN ANY TIME  -  WASD  F/G/H', {
        ...liveStyle(8, { color: css(THEME.frost) }),
      })
      .setOrigin(0.5)

    // The persisted best, top centre where an arcade cabinet keeps it. Absent
    // (never played, or storage denied) leaves the sky clear - never an error.
    const hi = readHiScore(browserStorage())
    if (hi !== null) {
      this.add
        .text(SCREEN_WIDTH / 2, 11, `HI-SCORE  ${hi}`, {
          ...liveStyle(8, { color: css(THEME.goldBright), stroke: '#000000', strokeThickness: 3 }),
        })
        .setOrigin(0.5)
    }

    const prompt = this.add
      .text(SCREEN_WIDTH / 2, 198, hasTouch() ? 'TAP TO START' : 'PRESS ENTER', {
        ...liveStyle(13, { color: '#ffffff', bold: true, stroke: '#1a0c06', strokeThickness: 4 }),
      })
      .setOrigin(0.5)
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 })

    // Drifting embers over the middle band: purely visual tweens.
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
