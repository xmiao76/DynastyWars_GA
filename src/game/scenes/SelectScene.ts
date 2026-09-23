import Phaser from 'phaser'
import { CHARACTER_ORDER, characterById } from '../../core/characters'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../core/constants'
import { audio } from '../audio/sfx'
import { TITLE_THEME } from '../audio/music'
import { ensureEntityTextures, ensurePortraitTextures, portraitKeyFor } from '../adapters/sprites'
import { watchConfirmButton } from '../adapters/gamepad'
import { hasTouch } from '../adapters/touch'
import {
  CARD_TEXTURE,
  GLOW_TEXTURE,
  PENNANT,
  PIP,
  paintCursorGlow,
  paintPennant,
  paintPip,
  paintRosterCard,
  paintSelectBackdrop,
} from '../art/selectart'
import { consumePendingStart, type BridgeState } from '../debug/bridge'
import { secondPlayerCharacter } from '../players'
import { RENDER_SCALE } from '../render'
import { ensureDisplayTextTexture } from '../ui/panels'
import { CARD, CARD_TOP, STAT_PIPS, STRIP, cardCenterX, cardCenterY, statPips } from '../ui/roster'
import { liveStyle } from '../ui/theme'
import { useLogicalViewport } from '../ui/viewport'

/** Portrait alpha by role: the pick, player two's preview, everyone else. */
const PORTRAIT_ALPHA = { p1: 1, p2: 0.72, idle: 0.5 } as const

/** Cursor colours (rgb triplets for the canvas painters). */
const P1_RGB = '255, 210, 60'
const P2_RGB = '90, 160, 255'

interface CardView {
  portrait: Phaser.GameObjects.Image | null
}

interface Tag {
  setX: (x: number) => void
}

/**
 * Character select (UI-3): the five Shu generals as framed portrait cards on
 * a lacquer roster field over an ink-wash parchment, in the arcade
 * select-screen idiom.
 *
 * Left/right moves the gold 1P cursor (wrapping), Enter or Start confirms,
 * and tapping a card picks THAT hero. The blue 2P tag previews who a
 * drop-in second player becomes - the same `secondPlayerCharacter` rule the
 * game applies on join, so the preview cannot disagree with what happens.
 *
 * All chrome is painted once to canvas textures (selectart.ts): Phaser
 * Graphics gradients are WebGL-only and draw nothing under canvas. Plates are
 * added before the content they frame and stay at depth 0, so insertion order
 * keeps every label on top of its own plate.
 */
export class SelectScene extends Phaser.Scene {
  private bridge!: BridgeState
  /** Per-frame poll so Start confirms as well as Enter. */
  private pollConfirm: () => void = () => {}
  private cursor = 0
  private cards: CardView[] = []
  private p1Glow!: Phaser.GameObjects.Image
  private p2Glow!: Phaser.GameObjects.Image
  private p1Tag!: Tag
  private p2Tag!: Tag

  constructor() {
    super('select')
  }

  create(): void {
    useLogicalViewport(this)
    this.bridge = this.registry.get('bridge') as BridgeState
    this.bridge.scene = 'select'
    this.bridge.sim = null
    this.cursor = 0
    this.cards = []
    audio.startMusic(TITLE_THEME)

    ensureEntityTextures(this, [...CHARACTER_ORDER])
    ensurePortraitTextures(this, [...CHARACTER_ORDER])

    // Backdrop: parchment, ink-wash ranges, the roster frame and the command
    // strip, all in one baked texture.
    this.add
      .image(0, 0, this.bake('ui:select-backdrop', SCREEN_WIDTH, SCREEN_HEIGHT, (c, s) => paintSelectBackdrop(c, s)))
      .setOrigin(0, 0)
      .setDisplaySize(SCREEN_WIDTH, SCREEN_HEIGHT)

    const headingKey = ensureDisplayTextTexture(this, 'CHOOSE YOUR WARRIOR', { variant: 'gold', size: 20 })
    const heading = this.textures.get(headingKey).get()
    const headingH = 24
    this.add
      .image(SCREEN_WIDTH / 2, 17, headingKey)
      .setOrigin(0.5)
      .setDisplaySize((heading.width / Math.max(1, heading.height)) * headingH, headingH)

    // Cursor halos sit BEHIND the cards, so only the rim and the outward
    // spill show. They are added before every card for that reason.
    const cy = cardCenterY()
    this.p2Glow = this.add
      .image(
        0,
        cy,
        this.bake('ui:roster-glow-p2', GLOW_TEXTURE.width, GLOW_TEXTURE.height, (c, s) =>
          paintCursorGlow(c, s, P2_RGB, 'secondary'),
        ),
      )
      .setDisplaySize(GLOW_TEXTURE.width, GLOW_TEXTURE.height)
    this.p1Glow = this.add
      .image(
        0,
        cy,
        this.bake('ui:roster-glow-p1', GLOW_TEXTURE.width, GLOW_TEXTURE.height, (c, s) =>
          paintCursorGlow(c, s, P1_RGB, 'primary'),
        ),
      )
      .setDisplaySize(GLOW_TEXTURE.width, GLOW_TEXTURE.height)

    const cardKey = this.bake('ui:roster-card', CARD_TEXTURE.width, CARD_TEXTURE.height, (c, s) => paintRosterCard(c, s))
    const pipOn = this.bake('ui:pip-on', PIP.width, PIP.height, (c, s) => paintPip(c, s, true))
    const pipOff = this.bake('ui:pip-off', PIP.width, PIP.height, (c, s) => paintPip(c, s, false))
    const roster = CHARACTER_ORDER.map((id) => characterById(id))
    const stats = [
      { label: 'LIFE', values: roster.map((c) => c.maxHp) },
      { label: 'SPEED', values: roster.map((c) => c.walkSpeed) },
    ]

    CHARACTER_ORDER.forEach((charId, i) => {
      const character = characterById(charId)
      const cx = cardCenterX(i, CHARACTER_ORDER.length)
      const left = cx - CARD.w / 2
      this.add.image(cx, cy, cardKey).setDisplaySize(CARD.w, CARD.h)

      const win = CARD.window
      const portraitKey = portraitKeyFor(charId)
      const portrait = this.textures.exists(portraitKey)
        ? this.add
            .image(left + win.x + win.w / 2, CARD_TOP + win.y + win.h / 2, portraitKey)
            .setDisplaySize(win.w, win.h)
        : null
      this.cards.push({ portrait })

      const plate = CARD.plate
      this.add
        .text(cx, CARD_TOP + plate.y + 13, character.nameZh, { ...liveStyle(16, { color: '#2a1a0a' }) })
        .setOrigin(0.5)
      this.add
        .text(cx, CARD_TOP + plate.y + 27, character.nameEn.toUpperCase(), {
          ...liveStyle(8, { color: '#7a3a14' }),
        })
        .setOrigin(0.5)

      const tray = CARD.tray
      stats.forEach((stat, row) => {
        const y = CARD_TOP + tray.y + 7 + row * 12
        this.add.text(left + 9, y, stat.label, { ...liveStyle(7, { color: '#d8c090' }) }).setOrigin(0, 0.5)
        const lit = statPips(stat.values, stat.values[i] ?? 0)
        for (let p = 0; p < STAT_PIPS; p += 1) {
          this.add
            .image(left + 44 + p * 8, y, p < lit ? pipOn : pipOff)
            .setDisplaySize(PIP.width, PIP.height)
        }
      })

      // Tapping a card picks THAT hero. A blanket tap-to-confirm would just
      // lock in whoever the cursor happened to be on, which on a touch device
      // means you can never choose anyone but the first.
      this.add
        .zone(cx, cy, CARD.w, CARD.h)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.cursor = i
          this.moveCursor(0)
          this.confirm()
        })
    })

    // Player tags hang from the top rail over the card they mark.
    this.p2Tag = this.makeTag('ui:pennant-p2', P2_RGB, '2P', '#8ec0ff')
    this.p1Tag = this.makeTag('ui:pennant-p1', P1_RGB, '1P', '#ffd23c')

    // Command strip. The strings are the device-specific ones the old screen
    // shipped, byte for byte.
    this.add
      .text(
        SCREEN_WIDTH / 2,
        STRIP.y + STRIP.h / 2,
        hasTouch() ? 'TAP A WARRIOR TO FIGHT' : 'LEFT / RIGHT to choose - ENTER to fight',
        { ...liveStyle(10, { color: '#f5e6c8' }) },
      )
      .setOrigin(0.5)

    // A slow breath on the 1P halo. Visual only; alpha renders the same under
    // both renderers.
    this.tweens.add({ targets: this.p1Glow, alpha: 0.78, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    this.moveCursor(0)

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

  /** Paint once into a canvas texture at device density; idempotent per key. */
  private bake(key: string, w: number, h: number, paint: (ctx: CanvasRenderingContext2D, s: number) => void): string {
    if (this.textures.exists(key)) return key
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * RENDER_SCALE)
    canvas.height = Math.round(h * RENDER_SCALE)
    const ctx = canvas.getContext('2d')
    if (ctx) paint(ctx, RENDER_SCALE)
    this.textures.addCanvas(key, canvas)
    return key
  }

  /**
   * A pennant plus its label, as two top-level objects rather than a
   * Container: the layout gates read the scene's own display list, and a
   * Container would hide the label from them.
   */
  private makeTag(key: string, rgb: string, label: string, color: string): Tag {
    const y = CARD_TOP - 1
    const pennant = this.add
      .image(0, y, this.bake(key, PENNANT.width, PENNANT.height, (c, s) => paintPennant(c, s, rgb)))
      .setDisplaySize(PENNANT.width, PENNANT.height)
    const text = this.add.text(0, y - 2, label, { ...liveStyle(9, { color }) }).setOrigin(0.5)
    return { setX: (x: number) => (pennant.setX(x), text.setX(x)) }
  }

  private moveCursor(delta: number): void {
    const count = CHARACTER_ORDER.length
    this.cursor = (this.cursor + delta + count) % count
    const p1Id = CHARACTER_ORDER[this.cursor] ?? 'zhaoyun'
    const p2Index = CHARACTER_ORDER.indexOf(secondPlayerCharacter(p1Id) as (typeof CHARACTER_ORDER)[number])
    const p1X = cardCenterX(this.cursor, count)
    const p2X = cardCenterX(Math.max(0, p2Index), count)
    this.p1Glow.setX(p1X)
    this.p1Tag.setX(p1X)
    this.p2Glow.setX(p2X)
    this.p2Tag.setX(p2X)
    this.cards.forEach((card, i) => {
      const role = i === this.cursor ? 'p1' : i === p2Index ? 'p2' : 'idle'
      card.portrait?.setAlpha(PORTRAIT_ALPHA[role])
    })
  }

  private confirm(): void {
    const charId = CHARACTER_ORDER[this.cursor] ?? 'zhaoyun'
    // Seed choice is presentation-side; the core sim stays deterministic
    // given any seed.
    this.scene.start('game', { seed: Date.now() >>> 0, charId })
  }
}
