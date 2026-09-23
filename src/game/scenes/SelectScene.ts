import Phaser from 'phaser'
import { CHARACTER_ORDER, characterById } from '../../core/characters'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../core/constants'
import { audio } from '../audio/sfx'
import { TITLE_THEME } from '../audio/music'
import {
  ensureEntityTextures,
  ensurePortraitTextures,
  paletteColorFor,
  portraitKeyFor,
} from '../adapters/sprites'
import { watchConfirmButton } from '../adapters/gamepad'
import { hasTouch } from '../adapters/touch'
import { consumePendingStart, type BridgeState } from '../debug/bridge'
import { addVignette, drawSlab } from '../ui/panels'
import { liveStyle } from '../ui/theme'
import { useLogicalViewport } from '../ui/viewport'

/**
 * Character select: the five Shu generals side by side, arcade order.
 * Left/right to move the cursor, Enter to confirm. A card shows the hero's
 * baked portrait when one exists, otherwise the hero's own idle sprite - the
 * palette block it used to fall back to told a player nothing about who they
 * were picking, which is the whole job of this screen.
 */
export class SelectScene extends Phaser.Scene {
  private bridge!: BridgeState
  /** Per-frame poll so Start confirms as well as Enter. */
  private pollConfirm: () => void = () => {}
  private cursor = 0
  private cursorFrame!: Phaser.GameObjects.Rectangle
  private heroArt!: Phaser.GameObjects.Image
  private heroNameEn!: Phaser.GameObjects.Text
  private heroNameZh!: Phaser.GameObjects.Text
  private statLabels: Phaser.GameObjects.Text[] = []
  private statBars!: Phaser.GameObjects.Graphics

  constructor() {
    super('select')
  }

  create(): void {
    useLogicalViewport(this)
    this.bridge = this.registry.get('bridge') as BridgeState
    this.bridge.scene = 'select'
    this.bridge.sim = null
    this.cursor = 0
    audio.startMusic(TITLE_THEME)

    this.add.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT, 0x0e151d)
    this.add.rectangle(SCREEN_WIDTH / 2, 20, SCREEN_WIDTH, 40, 0x16222f)
    this.add.rectangle(SCREEN_WIDTH / 2, 40, SCREEN_WIDTH, 2, 0x2a4a7a, 0.7)
    addVignette(this, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0.5)

    ensureEntityTextures(this, [...CHARACTER_ORDER])
    ensurePortraitTextures(this, [...CHARACTER_ORDER])

    // Plates first, then everything that sits on them. Equal-depth objects draw
    // in insertion order, which is the whole reason these stay at depth 0.
    // The card row sits to the right of the highlighted hero's plate. Both
    // plates are sized from the content they hold rather than by eye: the first
    // pass left Wei Yan's card hanging over the right edge of its own frame and
    // the stat bars below the bottom of theirs.
    const spacing = 68
    const startX = SCREEN_WIDTH / 2 - (spacing * (CHARACTER_ORDER.length - 1)) / 2 + 52
    drawSlab(this, startX - 34, 62, spacing * (CHARACTER_ORDER.length - 1) + 68, 120, 0x2a4a7a, 0, {
      skew: 16,
    })
    drawSlab(this, 10, 56, 108, 150, 0xc8a828, 0, { skew: 12 })

    this.add
      .text(SCREEN_WIDTH / 2, 18, 'CHOOSE YOUR WARRIOR', {
        ...liveStyle(15, { color: '#ffd700', bold: true, italic: true }),
      })
      .setOrigin(0.5)

    // The large portrait of whoever the cursor is on, with the two stats the
    // sim actually distinguishes the heroes by. The old screen drew flat
    // palette rectangles here, which is why the art gate had to be taught to
    // ask whether the five were "palette swaps" in the first place.
    this.heroArt = this.add.image(62, 62, portraitKeyFor(CHARACTER_ORDER[0] ?? 'guanyu')).setOrigin(0.5, 0)
    this.heroArt.setDisplaySize(68, 76)
    this.heroNameEn = this.add
      .text(62, 146, '', { ...liveStyle(10, { color: '#ffffff', bold: true }) })
      .setOrigin(0.5)
    this.heroNameZh = this.add
      .text(62, 161, '', { ...liveStyle(14, { color: '#f5e6c8' }) })
      .setOrigin(0.5)
    this.statLabels = ['POWER', 'SPEED'].map((label, i) =>
      this.add
        .text(20, 180 + i * 12, label, { ...liveStyle(7, { color: '#9ab0c0' }) })
        .setOrigin(0, 0.5),
    )
    this.statBars = this.add.graphics().setDepth(1)

    CHARACTER_ORDER.forEach((charId, i) => {
      const character = characterById(charId)
      const x = startX + i * spacing
      this.add
        .rectangle(x, 100, 46, 50, paletteColorFor(charId), 0.3)
        .setStrokeStyle(1, 0x9ab0c0, 0.5)
      const portraitKey = portraitKeyFor(charId)
      if (this.textures.exists(portraitKey)) {
        this.add.image(x, 100, portraitKey).setDisplaySize(44, 48)
      }
      this.add
        .text(x, 134, character.nameEn, { ...liveStyle(8, { color: '#ffffff' }) })
        .setOrigin(0.5)
      this.add
        .text(x, 148, character.nameZh, { ...liveStyle(12, { color: '#f5e6c8' }) })
        .setOrigin(0.5)
      // Tapping a card picks THAT hero. A blanket tap-to-confirm would just
      // lock in whoever the cursor happened to be on, which on a touch device
      // means you can never choose anyone but the first.
      this.add
        .zone(x, 114, spacing - 4, 104)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.cursor = i
          this.moveCursor(0)
          this.confirm()
        })
    })

    this.cursorFrame = this.add
      .rectangle(startX, 100, 52, 56)
      .setStrokeStyle(2, 0xffd700)
      .setFillStyle(0, 0)
    this.moveCursor(0)
    this.add
      .text(SCREEN_WIDTH / 2, 206, hasTouch() ? 'TAP A WARRIOR TO FIGHT' : 'LEFT / RIGHT to choose - ENTER to fight', {
        ...liveStyle(10, { color: '#9ab0c0' }),
      })
      .setOrigin(0.5)

    this.input.keyboard?.on('keydown-LEFT', () => this.moveCursor(-1))
    this.input.keyboard?.on('keydown-RIGHT', () => this.moveCursor(1))
    this.input.keyboard?.on('keydown-ENTER', () => this.confirm())
    this.pollConfirm = watchConfirmButton(() => this.confirm())
  }

  update(): void {
    this.pollConfirm()
    const pending = consumePendingStart(this.bridge)
    if (pending) {
      this.scene.start('game', { seed: pending.seed, charId: pending.charId, stageId: pending.stageId })
    }
  }

  private moveCursor(delta: number): void {
    const count = CHARACTER_ORDER.length
    this.cursor = (this.cursor + delta + count) % count
    const spacing = 68
    const startX = SCREEN_WIDTH / 2 - (spacing * (count - 1)) / 2 + 52
    this.cursorFrame.setX(startX + this.cursor * spacing)
    this.showHero(CHARACTER_ORDER[this.cursor] ?? 'zhaoyun')
  }

  /**
   * The big portrait and the stat read-out, for whoever the cursor is on.
   *
   * POWER and SPEED come straight from `CharacterDef` - the two numbers the sim
   * genuinely distinguishes the heroes by - rather than from invented ratings.
   * Normalised across the roster, so the bars compare the five to each other
   * instead of to an arbitrary maximum.
   */
  private showHero(charId: string): void {
    const character = characterById(charId)
    const key = portraitKeyFor(charId)
    if (this.textures.exists(key)) this.heroArt.setTexture(key).setDisplaySize(68, 76)
    this.heroNameEn.setText(character.nameEn)
    this.heroNameZh.setText(character.nameZh)
    const all = CHARACTER_ORDER.map((id) => characterById(id))
    const span = (values: number[], value: number): number => {
      const lo = Math.min(...values)
      const hi = Math.max(...values)
      return hi === lo ? 1 : 0.25 + (0.75 * (value - lo)) / (hi - lo)
    }
    const stats = [
      span(all.map((c) => c.maxHp), character.maxHp),
      span(all.map((c) => c.walkSpeed), character.walkSpeed),
    ]
    this.statBars.clear()
    stats.forEach((ratio, i) => {
      const y = 177 + i * 12
      this.statBars.fillStyle(0x08070c, 0.8)
      this.statBars.fillRect(52, y, 50, 6)
      this.statBars.fillStyle(0xffd700, 1)
      this.statBars.fillRect(52, y, Math.max(1, Math.round(50 * ratio)), 6)
    })
  }

  private confirm(): void {
    const charId = CHARACTER_ORDER[this.cursor] ?? 'zhaoyun'
    // Seed choice is presentation-side; the core sim stays deterministic
    // given any seed.
    this.scene.start('game', { seed: Date.now() >>> 0, charId })
  }
}
