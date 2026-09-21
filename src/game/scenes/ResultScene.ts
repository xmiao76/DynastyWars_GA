import Phaser from 'phaser'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../core/constants'
import { nextStageId, STAGES } from '../../core/stage'
import { audio } from '../audio/sfx'
import { TITLE_THEME } from '../audio/music'
import { addVignette, drawSlab } from '../ui/panels'
import { watchConfirmButton } from '../adapters/gamepad'
import { hasTouch } from '../adapters/touch'
import { consumePendingStart, type BridgeState } from '../debug/bridge'
import { useLogicalViewport } from '../ui/viewport'

export interface ResultSceneData {
  score?: number
  ticks?: number
  charId?: string
  lives?: number
  stageId?: string
  seed?: number
  totalTicks?: number
  /** Player two's hero, threaded through so co-op survives the stage break. */
  char2Id?: string | null
}

/**
 * Stage-clear result screen: a filled victory dialog with hero key art,
 * score/time/lives chips, then onward - Enter starts the next stage (or
 * returns to title / shows game-complete after the final stage).
 */
/** On-screen height of the flanking hero art, in logical px. */
const HERO_ART_HEIGHT = 129

export class ResultScene extends Phaser.Scene {
  private bridge!: BridgeState
  /** Per-frame poll so Start confirms as well as Enter. */
  private pollConfirm: () => void = () => {}

  constructor() {
    super('result')
  }

  create(data: ResultSceneData): void {
    useLogicalViewport(this)
    this.bridge = this.registry.get('bridge') as BridgeState
    this.bridge.scene = 'result'
    this.bridge.sim = null
    audio.startMusic(TITLE_THEME)

    const score = data.score ?? 0
    const seconds = ((data.ticks ?? 0) / 60).toFixed(1)
    const stageId = data.stageId ?? 'stage1'
    const stage = STAGES[stageId]
    const nextId = nextStageId(stageId)
    const nextStage = nextId ? STAGES[nextId] : undefined
    const charId = data.charId ?? 'zhaoyun'

    // Backdrop: warm celebration sky + huge gold panel that fills the frame.
    this.add.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT, 0x2a1a0a)
    const glow = this.add.rectangle(SCREEN_WIDTH / 2, 120, SCREEN_WIDTH, 180, 0x8a5a1a, 0.5)
    glow.setBlendMode('ADD')
    addVignette(this, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0.6)

    // Hero key art: the cleared hero stands proudly at screen left/right,
    // flanking the dialog. Falls back to a framed emblem if art is missing.
    const heroKey = `entity:${charId}:idle`
    if (this.textures.exists(heroKey)) {
      // Sized by DISPLAY height, never by a raw scale factor. A raw scale is a
      // multiplier on whatever the texture happens to measure, so the moment
      // sprite textures were rasterized at device density these heroes doubled
      // and swallowed the screen - while every metric stayed green, because a
      // frame full of hero is not dark, flat or empty. Every other scene sizes
      // its figures this way; this was the one place that did not.
      const frame = this.textures.get(heroKey).get()
      const w = (frame.width / Math.max(1, frame.height)) * HERO_ART_HEIGHT
      const left = this.add.sprite(84, SCREEN_HEIGHT - 30, heroKey)
      left.setOrigin(0.5, 1).setDisplaySize(w, HERO_ART_HEIGHT)
      const right = this.add.sprite(SCREEN_WIDTH - 84, SCREEN_HEIGHT - 30, heroKey)
      right.setOrigin(0.5, 1).setDisplaySize(w, HERO_ART_HEIGHT).setFlipX(true).setAlpha(0.6)
    } else {
      this.add.rectangle(84, SCREEN_HEIGHT - 50, 34, 60, 0xc8a828, 0.6).setOrigin(0.5, 1)
      this.add.rectangle(SCREEN_WIDTH - 84, SCREEN_HEIGHT - 50, 34, 60, 0xc8a828, 0.6).setOrigin(0.5, 1)
    }

    // The victory dialog: wide gold-framed panel.
    // Depth 0, not a high one: Phaser draws equal-depth objects in insertion
    // order, and this panel is added BEFORE the content it frames. Hoisting it
    // to a high depth pulled it in front of every sprite and label in the scene
    // (all of which sit at the default depth 0), hiding them behind the slab.
    drawSlab(this, SCREEN_WIDTH / 2 - 170, 66, 340, 150, 0xc8a828, 0)

    // Title with a second accent line.
    this.add
      .text(SCREEN_WIDTH / 2, 84, 'STAGE CLEAR!', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffd700',
        stroke: '#8b6a00',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
    if (stage) {
      this.add
        .text(SCREEN_WIDTH / 2, 116, `${stage.nameEn} · ${stage.nameZh}`, {
          fontFamily: 'sans-serif',
          fontSize: '12px',
          color: '#f5e6c8',
        })
        .setOrigin(0.5)
    }

    // Score / time / lives as filled chips. Each chip owns its caption, plate
    // and value, and the widths keep all three plates inside the dialog panel
    // (x 70..410) - the TIME plate used to run past its right edge.
    const chipY = 156
    drawChip(this, SCREEN_WIDTH / 2 - 170, chipY, 62, 30, 'LIVES', `${data.lives ?? 0}`)
    const scoreValue = drawChip(this, SCREEN_WIDTH / 2 - 76, chipY, 120, 30, 'SCORE', '0')
    drawChip(this, SCREEN_WIDTH / 2 + 60, chipY, 90, 30, 'TIME', `${seconds}s`)
    this.tweens.addCounter({
      from: 0,
      to: score,
      duration: 900,
      onUpdate: (tween) => scoreValue.setText(`${Math.floor(tween.getValue() ?? 0)}`),
    })

    this.add
      .text(
        SCREEN_WIDTH / 2,
        196,
        nextStage
          ? `${hasTouch() ? 'TAP' : 'PRESS ENTER'} - NEXT: ${nextStage.nameEn} ${nextStage.nameZh}`
          : hasTouch()
            ? 'TAP TO CONTINUE'
            : 'PRESS ENTER',
        { fontFamily: 'sans-serif', fontSize: '10px', color: '#ffffff' },
      )
      .setOrigin(0.5)

    const confirm = (): void => {
      if (nextStage) {
        this.scene.start('game', {
          seed: (data.seed ?? 1) + 1000,
          charId,
          stageId: nextStage.id,
          lives: data.lives ?? 3,
          score,
          totalTicks: data.totalTicks ?? 0,
          char2Id: data.char2Id ?? null,
        })
      } else {
        this.scene.start('gamecomplete', { score, totalTicks: data.totalTicks ?? 0 })
      }
    }
    this.pollConfirm = watchConfirmButton(confirm)
    this.input.on('pointerdown', confirm)
    this.input.keyboard?.on('keydown-ENTER', confirm)
  }

  update(): void {
    this.pollConfirm()
    // A harness startGame() can arrive while this screen is up - jump straight
    // into the requested stage so the bridge's startGame is deterministic from
    // any scene (this is what the vision producer relies on between sections).
    const pending = consumePendingStart(this.bridge)
    if (pending) {
      this.scene.start('game', { seed: pending.seed, charId: pending.charId, stageId: pending.stageId })
    }
  }
}

/**
 * One stat chip: caption above, plate, value centred in the plate. The chip
 * owns all three so they cannot drift apart - the caption used to be centred
 * on `x` while the plate spanned `x..x+w`, which put half of every caption
 * under its own plate's left edge, and the values were positioned by hand a
 * few pixels off their plate centres. Returns the value text so a caller can
 * animate it.
 */
function drawChip(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
): Phaser.GameObjects.Text {
  const cx = x + w / 2
  scene.add
    .text(cx, y - h / 2 - 10, label.toUpperCase(), {
      fontFamily: 'sans-serif',
      fontSize: '7px',
      color: '#c8b07a',
    })
    .setOrigin(0.5, 0)
  scene.add.rectangle(cx, y, w, h, 0x0c0c12, 0.85).setStrokeStyle(1, 0x9a7a2a)
  return scene.add
    .text(cx, y, value, {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
    })
    .setOrigin(0.5)
}
