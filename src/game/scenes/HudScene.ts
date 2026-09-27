import Phaser from 'phaser'
import { characterById } from '../../core/characters'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../core/constants'
import { isProjectile } from '../../core/entities'
import { enemyByKind } from '../../core/enemies'
import { playerOf, type Sim } from '../../core/sim'
import { RENDER_SCALE } from '../render'
import { audio } from '../audio/sfx'
import { hasTouch, TouchAdapter } from '../adapters/touch'
import { ensurePortraitTextures, portraitKeyFor } from '../adapters/sprites'
import { destroyAllChildren } from '../ui/display'
import { useLogicalViewport } from '../ui/viewport'
import { addVignette, ensureDisplayTextTexture, makeArcadeBar } from '../ui/panels'
import { liveStyle } from '../ui/theme'
import type { BridgeState } from '../debug/bridge'
import * as L from '../ui/hudlayout'
import { stageLore } from '../data/stagelore'
import {
  CARD_TEX,
  DIALOG_TEX,
  ensureFlowArt,
} from '../art/flowart'
import {
  BANNER_TEX,
  CHIP_TEX,
  GO_TEX,
  MEDAL_TEX,
  PEARL_TEX,
  PIP_TEX,
  PLATE_TEX,
  RAIL_TEX,
  paintBanner,
  paintChip,
  paintGoArrow,
  paintLivesPip,
  paintMedallion,
  paintPearl,
  paintPlate,
  paintRail,
} from '../art/hudart'

/**
 * The in-stage HUD (UI-4), restyled to the WoF top-band language: floating
 * player plates with medallion portraits, a segmented arcade HP bar with a
 * presentation-only damage ghost, a flaming-pearl special lamp, lives pips,
 * a WAVE chip, a "GO →" cue once the camera unlocks, and a full-width boss
 * rail that drops in while a boss is alive.
 *
 * Worth being accurate about WHY it is separate from `game`, because the
 * obvious reason is wrong: a zoomed camera does displace scrollFactor-0
 * objects, but only while its origin is the default centre, and
 * `useLogicalViewport` pins the origin to the top-left precisely so that
 * stops happening. The HUD would in fact render correctly inside `game`.
 *
 * It is separate for two reasons that do hold. GameScene was 951 lines, past
 * the 800 this project sets itself, and roughly a third of it was HUD that
 * touched nothing else. And the HUD is a pure function of the Sim, which is
 * much easier to keep true when it has no access to anything else - it cannot
 * quietly start owning game state if it never sees any. A side benefit: the
 * HUD no longer rides the camera shake, which is what an arcade HUD should
 * do.
 *
 * It PULLS rather than being pushed to. Everything it draws is derived from
 * the Sim, which it reads off the debug bridge in the registry - the same
 * object `game` publishes there - so there is no start-order dependency
 * between the two scenes and no second copy of any state. The one thing it
 * cannot derive is the continue countdown, which is wall-clock and owned by
 * `game`; it reads that field structurally rather than importing GameScene,
 * which would be a cycle.
 */

/** What this scene needs from `game`, named structurally to avoid a cycle. */
interface GameReadout {
  continueMsLeft: number
  paused: boolean
}

interface PendingBanner {
  title: string
  subtitle: string
  color: number
  holdMs: number
  /** UIR-2: the boss WARNING drops below the rail band (V-2). */
  belowRail?: boolean
}

type ArcadeBar = ReturnType<typeof makeArcadeBar>

const RED = 0xd33a3a
/** Banners: stage nameplate holds, boss warning holds the spec's 1.2s. */
const BANNER_HOLD_MS = 1_500
/** Banner sweep in/out (the tween's yoyo halves) - one source of truth. */
const BANNER_SWEEP_MS = 180
/**
 * UIR-3 (V-3): the intro card waits out the stage banner's whole life
 * (sweep in + hold + sweep out) plus slack, so the two stage
 * announcements never show at once. The old 1_600ms raised the card in
 * the banner's tail (~260ms of shared screen).
 */
const INTRO_CARD_DELAY_MS = BANNER_HOLD_MS + 2 * BANNER_SWEEP_MS + 120

export class HudScene extends Phaser.Scene {
  /** The Sim this HUD was built for; a different one means a new stage. */
  private boundSim: Sim | null = null
  /**
   * The on-screen touch controls, owned here because this scene owns - and
   * sweeps - the display list they are drawn on. `GameScene` only READS them.
   * Building them from there put objects on a list another scene was about to
   * clear, which is how they came to be invisible but still interactive.
   */
  readonly touch = new TouchAdapter()
  private banners: PendingBanner[] = []

  private hpBar!: ArcadeBar
  private specialPip!: Phaser.GameObjects.Image
  private pips: Phaser.GameObjects.Image[] = []
  private nameText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private stageText!: Phaser.GameObjects.Text
  private waveText!: Phaser.GameObjects.Text
  private foesText!: Phaser.GameObjects.Text
  private metaText!: Phaser.GameObjects.Text
  private p1DownText!: Phaser.GameObjects.Text
  private continueDim!: Phaser.GameObjects.Rectangle
  private continueCard!: Phaser.GameObjects.Image
  private continueText!: Phaser.GameObjects.Text
  private continueCountdownText!: Phaser.GameObjects.Text
  private continueHintText!: Phaser.GameObjects.Text
  private pauseDim!: Phaser.GameObjects.Rectangle
  private pauseCard!: Phaser.GameObjects.Image
  private pauseText!: Phaser.GameObjects.Text
  private pauseHintText!: Phaser.GameObjects.Text
  private comboText!: Phaser.GameObjects.Text
  private comboTag!: Phaser.GameObjects.Image
  private comboShown = 0
  private rail!: Phaser.GameObjects.Image
  private bossNameText!: Phaser.GameObjects.Text
  private bossBar!: ArcadeBar
  private bossTag!: Phaser.GameObjects.Image
  private goCue!: Phaser.GameObjects.Container
  private goTween?: Phaser.Tweens.Tween
  private p1Ghost = 1
  private p2Plate?: Phaser.GameObjects.Image
  private p2Medal?: Phaser.GameObjects.Image
  private p2NameText?: Phaser.GameObjects.Text
  private p2Bar?: ArcadeBar
  private p2Pip?: Phaser.GameObjects.Image
  private p2Meta?: Phaser.GameObjects.Text
  private p2DownText?: Phaser.GameObjects.Text
  private p2Ghost = 1
  private bossGhost = 1
  /**
   * The scene-intro parchment card (UI-5). Shown once per stage entry; ticks
   * dismiss it under autopilot so run() batches can never stall on it, and
   * wall-clock plus Enter/tap dismiss it in real play. Materialization waits
   * 1.6s so the ~1.9s stage banner nearly clears before the card rises - the
   * two stacked on top of each other otherwise, STAGE n twice on the screen.
   */
  private introCard?: Phaser.GameObjects.Container
  private introTick = 0
  private introMs = 0
  private introShowAtMs = 0
  private introPending = false
  private introDismiss?: () => void

  constructor() {
    super('hud')
  }

  create(): void {
    useLogicalViewport(this)
    // The scene instance is reused across stages, exactly as `game` is.
    this.boundSim = null
    this.clearPlayerTwoHud()
    destroyAllChildren(this)
  }

  /**
   * Queue a banner. Safe to call before this scene's `create` has run - Phaser
   * instantiates scenes at boot, so the array exists from construction, and
   * `game` raises the stage banner from its own `create`. `holdMs` lets the
   * caller say how long the plate lingers: the stage nameplate hangs while
   * you read it; the boss warning snaps off at 1.2s so it cannot mask the
   * first exchange of the fight.
   */
  showBanner(title: string, subtitle: string, color: number, holdMs = BANNER_HOLD_MS, belowRail = false): void {
    this.banners.push({ title, subtitle, color, holdMs, belowRail })
  }

  update(): void {
    const bridge = this.registry.get('bridge') as BridgeState | undefined
    const sim = bridge?.sim
    if (!sim) return
    if (sim !== this.boundSim) this.build(sim)
    this.drainBanners()
    this.sync(sim, this.game.loop.delta)
    this.syncIntroCard(sim, bridge.autopilot === true)
  }

  /** Bake one canvas texture; a no-op once the key exists. */
  private bake(key: string, w: number, h: number, paint: (ctx: CanvasRenderingContext2D, s: number) => void): void {
    if (this.textures.exists(key)) return
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(w * RENDER_SCALE))
    canvas.height = Math.max(1, Math.round(h * RENDER_SCALE))
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    paint(ctx, RENDER_SCALE)
    this.textures.addCanvas(key, canvas)
  }

  /** Bake the whole HUD kit; each key is guarded, so build() stays cheap. */
  private ensureHudArt(charId: string): void {
    this.bake('hud:plate:p1', PLATE_TEX.width, PLATE_TEX.height, (ctx, s) => paintPlate(ctx, s, 'p1'))
    this.bake('hud:plate:p2', PLATE_TEX.width, PLATE_TEX.height, (ctx, s) => paintPlate(ctx, s, 'p2'))
    this.bake('hud:pearl', PEARL_TEX.width, PEARL_TEX.height, (ctx, s) => paintPearl(ctx, s, true))
    this.bake('hud:pearl-dim', PEARL_TEX.width, PEARL_TEX.height, (ctx, s) => paintPearl(ctx, s, false))
    this.bake('hud:pip', PIP_TEX.width, PIP_TEX.height, (ctx, s) => paintLivesPip(ctx, s))
    this.bake('hud:chip', CHIP_TEX.width, CHIP_TEX.height, (ctx, s) => paintChip(ctx, s))
    this.bake('hud:arrow', GO_TEX.width, GO_TEX.height, (ctx, s) => paintGoArrow(ctx, s))
    this.bake('hud:rail', RAIL_TEX.width, RAIL_TEX.height, (ctx, s) => paintRail(ctx, s))
    this.bake('hud:banner:gold', BANNER_TEX.width, BANNER_TEX.height, (ctx, s) => paintBanner(ctx, s, 'gold'))
    this.bake('hud:banner:red', BANNER_TEX.width, BANNER_TEX.height, (ctx, s) => paintBanner(ctx, s, 'red'))
    this.ensureMedallion(charId)
  }

  /** One medallion per hero id the scene has met; textures persist per page. */
  private ensureMedallion(charId: string): void {
    const key = `hud:medallion:${charId}`
    if (this.textures.exists(key)) return
    const portraitKey = portraitKeyFor(charId)
    const source = this.textures.exists(portraitKey)
      ? (this.textures.get(portraitKey).getSourceImage() as unknown as CanvasImageSource)
      : undefined
    this.bake(key, MEDAL_TEX.width, MEDAL_TEX.height, (ctx, s) => paintMedallion(ctx, s, source))
  }

  /**
   * A baked canvas texture renders at its DEVICE pixel size unless told
   * otherwise - at RENDER_SCALE 2 that is twice its logical box, which pushed
   * the whole touch sheet off the bottom of the screen the first time this
   * shipped. Every baked image therefore goes through here to be shown at
   * logical size.
   */
  private bakedImage(x: number, y: number, key: string, w: number, h: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, key).setOrigin(0, 0).setDisplaySize(w, h)
  }

  /** Logical size of a baked display-text texture (frame px / RENDER_SCALE). */
  private displayTextSize(key: string): { w: number; h: number } {
    const frame = this.textures.get(key).get()
    return { w: frame.width / RENDER_SCALE, h: frame.height / RENDER_SCALE }
  }

  /** Tear down and rebuild for a new stage's Sim. */
  private build(sim: Sim): void {
    this.goTween?.stop()
    this.goTween = undefined
    destroyAllChildren(this)
    this.clearPlayerTwoHud()
    this.comboShown = 0
    this.p1Ghost = 1
    this.p2Ghost = 1
    this.bossGhost = 1
    this.boundSim = sim
    const character = characterById(sim.charId)
    const stage = sim.stage
    ensurePortraitTextures(this, [sim.charId])
    this.ensureHudArt(sim.charId)
    ensureFlowArt(this)

    // Cinematic vignette over the battlefield, under everything in the HUD.
    addVignette(this, SCREEN_WIDTH, SCREEN_HEIGHT, 9_000, 0.5)

    /**
     * Plates, badges and bars first, then labels, so nothing opaque that
     * arrives later can ever bury a label - the occlusion gate flags exactly
     * an opaque object drawn AFTER a label at the same or higher depth.
     */
    const g1 = L.slotFor('p1')
    this.bakedImage(g1.plate.x, g1.plate.y, 'hud:plate:p1', PLATE_TEX.width, PLATE_TEX.height)
      .setDepth(10_000)
      .setData('panelRect', { x: g1.plate.x, y: g1.plate.y, w: g1.plate.w, h: g1.plate.h })
    this.bakedImage(
      g1.medalX - MEDAL_TEX.width / 2,
      g1.medalY - MEDAL_TEX.height / 2,
      `hud:medallion:${sim.charId}`,
      MEDAL_TEX.width,
      MEDAL_TEX.height,
    ).setDepth(10_001)

    this.hpBar = makeArcadeBar(this, g1.hp.x, g1.hp.y, g1.hp.w, g1.hp.h, 10_001, L.playerSegments(character.maxHp))
    this.specialPip = this.bakedImage(
      g1.pearlX - PEARL_TEX.width / 2,
      g1.pearlY - PEARL_TEX.height / 2,
      'hud:pearl',
      PEARL_TEX.width,
      PEARL_TEX.height,
    ).setDepth(10_001)

    this.pips = []
    for (let i = 0; i < L.PIP_ROW.max; i += 1) {
      this.pips.push(
        this.bakedImage(g1.pipX0 + i * (L.PIP_ROW.d + L.PIP_ROW.gap), g1.pipY, 'hud:pip', PIP_TEX.width, PIP_TEX.height)
          .setDepth(10_001)
          .setVisible(false),
      )
    }

    // WAVE chip. Lives in the centre lane so it never fights the plates.
    this.bakedImage(L.CHIP.x - CHIP_TEX.width / 2, L.CHIP.y, 'hud:chip', CHIP_TEX.width, CHIP_TEX.height).setDepth(
      10_001,
    )

    // GO → cue: the baked display word plus baked chevrons, as one container.
    const goKey = ensureDisplayTextTexture(this, 'GO →', { variant: 'gold', size: 12 })
    const goSize = this.displayTextSize(goKey)
    this.goCue = this.add.container(L.GO.x - goSize.w - 4, L.GO.y).setDepth(10_001).setVisible(false)
    const goText = this.bakedImage(0, GO_TEX.height / 2, goKey, goSize.w, goSize.h)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
    const goArrow = this.bakedImage(goSize.w + 4, 0, 'hud:arrow', GO_TEX.width, GO_TEX.height)
      .setOrigin(0, 0)
      .setScrollFactor(0)
    this.goCue.add([goText, goArrow])
    this.goTween = this.tweens.add({
      targets: this.goCue,
      alpha: 0.3,
      duration: 400,
      yoyo: true,
      repeat: -1,
      paused: true,
    })

    // Boss rail, hidden until a boss steps out.
    this.rail = this.bakedImage(L.RAIL.x, L.RAIL.y, 'hud:rail', RAIL_TEX.width, RAIL_TEX.height)
      .setDepth(10_000)
      .setVisible(false)
    const bossDef = enemyByKind(stage.bossKind)
    this.bossBar = makeArcadeBar(
      this,
      L.RAIL_BAR.x,
      L.RAIL_BAR.y,
      L.RAIL_BAR.w,
      L.RAIL_BAR.h,
      10_001,
      L.bossSegments(bossDef.maxHp),
    )
    this.bossBar.graphics.setVisible(false)
    const bossKey = ensureDisplayTextTexture(this, 'BOSS', { variant: 'crimson', size: 12 })
    const bossSize = this.displayTextSize(bossKey)
    this.bossTag = this.bakedImage(L.RAIL_TAG.x, L.RAIL_TAG.y + RAIL_TEX.height / 2 - 2, bossKey, bossSize.w, bossSize.h)
      .setOrigin(0, 0.5)
      .setDepth(10_001)
      .setVisible(false)

    // The continue/pause overlays (UI-5): baked parchment dialogs on the dim.
    this.continueDim = this.add
      .rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT, 0x05040a, 0.62)
      .setDepth(10_001)
      .setVisible(false)
    this.continueCard = this.add
      .image(SCREEN_WIDTH / 2, 123, 'flow:dialog:gold')
      .setOrigin(0.5)
      .setDisplaySize(DIALOG_TEX.width, DIALOG_TEX.height)
      .setDepth(10_001)
      .setData('panelRect', {
        x: SCREEN_WIDTH / 2 - DIALOG_TEX.width / 2,
        y: 123 - DIALOG_TEX.height / 2,
        w: DIALOG_TEX.width,
        h: DIALOG_TEX.height,
      })
      .setVisible(false)
    this.pauseDim = this.add
      .rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT, 0x05040a, 0.62)
      .setDepth(10_001)
      .setVisible(false)
    this.pauseCard = this.add
      .image(SCREEN_WIDTH / 2, 123, 'flow:dialog:gold')
      .setOrigin(0.5)
      .setDisplaySize(DIALOG_TEX.width, DIALOG_TEX.height)
      .setDepth(10_001)
      .setData('panelRect', {
        x: SCREEN_WIDTH / 2 - DIALOG_TEX.width / 2,
        y: 123 - DIALOG_TEX.height / 2,
        w: DIALOG_TEX.width,
        h: DIALOG_TEX.height,
      })
      .setVisible(false)

    // --- Labels -----------------------------------------------------------
    this.nameText = this.add
      .text(g1.nameX, L.NAME.y, `${character.nameEn} ${character.nameZh}`, {
        ...liveStyle(9, { color: '#ffd700', bold: true }),
      })
      .setDepth(10_002)
    this.stageText = this.add
      .text(L.STAGE_LABEL.x, L.STAGE_LABEL.y, stage.nameZh, {
        ...liveStyle(L.STAGE_LABEL.size, { color: '#d8c8a0' }),
      })
      .setOrigin(0.5, 0)
      .setDepth(10_002)
    this.scoreText = this.add
      .text(L.SCORE.x, L.SCORE.y, 'SCORE 0', { ...liveStyle(L.SCORE.size, { color: '#ffd700' }) })
      .setOrigin(0.5)
      .setDepth(10_002)
    this.waveText = this.add
      .text(L.CHIP.x, L.CHIP.y + CHIP_TEX.height / 2, 'WAVE 1', {
        ...liveStyle(9, { color: '#f5e6c8', bold: true }),
      })
      .setOrigin(0.5)
      .setDepth(10_002)
    this.foesText = this.add
      .text(L.CHIP.x + CHIP_TEX.width / 2 + 4, L.CHIP.y + CHIP_TEX.height / 2, '', {
        ...liveStyle(9, { color: '#d8a860' }),
      })
      .setOrigin(0, 0.5)
      .setDepth(10_002)
    this.metaText = this.add
      .text(g1.metaX, L.META_ROW.y, '', { ...liveStyle(L.META_ROW.size, { color: '#c0b0a0' }) })
      .setDepth(10_002)
    this.bossNameText = this.add
      .text(L.RAIL_NAME.x, L.RAIL.y + RAIL_TEX.height / 2, '', {
        ...liveStyle(9, { color: '#ffb0a0', bold: true }),
      })
      .setOrigin(0, 0.5)
      .setVisible(false)
      .setDepth(10_002)

    this.comboText = this.add
      .text(L.COMBO.x - 4, L.COMBO.y, '', {
        ...liveStyle(17, { color: '#ffd700', bold: true, italic: true, stroke: '#5a3a00', strokeThickness: 3 }),
      })
      .setOrigin(1, 0.5)
      .setDepth(10_002)
    const hitKey = ensureDisplayTextTexture(this, 'HIT', { variant: 'gold', size: 14 })
    const hitSize = this.displayTextSize(hitKey)
    this.comboTag = this.bakedImage(L.COMBO.x + 4, L.COMBO.y, hitKey, hitSize.w, hitSize.h)
      .setOrigin(0, 0.5)
      .setDepth(10_001)
      .setVisible(false)

    this.p1DownText = this.add
      .text(SCREEN_WIDTH / 2, 100, '', {
        ...liveStyle(10, { color: '#ffd700', bold: true }),
      })
      .setOrigin(0.5)
      .setDepth(10_002)

    this.continueText = this.add
      .text(SCREEN_WIDTH / 2, 92, 'CONTINUE?', {
        ...liveStyle(22, { color: '#ffd700', bold: true }),
      })
      .setOrigin(0.5)
      .setDepth(10_002)
      .setVisible(false)
    this.continueCountdownText = this.add
      .text(SCREEN_WIDTH / 2, 126, '9', {
        ...liveStyle(30, { color: '#ffffff', bold: true }),
      })
      .setOrigin(0.5)
      .setDepth(10_002)
      .setVisible(false)
    this.continueHintText = this.add
      .text(SCREEN_WIDTH / 2, 154, hasTouch() ? 'TAP TO CONTINUE' : 'PRESS ENTER', {
        ...liveStyle(10, { color: '#4a3820', bold: true }),
      })
      .setOrigin(0.5)
      .setDepth(10_002)
      .setVisible(false)
    this.pauseText = this.add
      .text(SCREEN_WIDTH / 2, 120, 'PAUSED', {
        ...liveStyle(22, { color: '#ffd700', bold: true, stroke: '#5a3a00', strokeThickness: 2 }),
      })
      .setOrigin(0.5)
      .setDepth(10_002)
      .setVisible(false)
    this.pauseHintText = this.add
      .text(SCREEN_WIDTH / 2, 148, hasTouch() ? 'TAP TO RESUME' : 'PRESS P TO RESUME', {
        ...liveStyle(10, { color: '#4a3820', bold: true }),
      })
      .setOrigin(0.5)
      .setDepth(10_002)
      .setVisible(false)

    // The on-screen controls go on LAST so they sit over the HUD, and they are
    // re-mounted on every rebuild because the sweep at the top of this method
    // destroyed the previous set along with everything else.
    if (hasTouch()) this.touch.mount(this)

    // The scene-intro parchment card, once per stage entry - armed here,
    // materialized by syncIntroCard once the stage banner has had its beat.
    this.teardownIntro()
    this.introPending = true
    // UIR-3 (V-3): wait out the stage banner's whole life - INTRO_CARD_DELAY_MS
    // sequences them nominally, and syncIntroCard additionally refuses to rise
    // while any stageBanner is still showing (the banner tween's alpha tail
    // outlives a naive duration sum, so the state gate is the real contract).
    this.introShowAtMs = this.time.now + INTRO_CARD_DELAY_MS
  }

  /**
   * The scene-intro card (UI-5): a parchment scroll naming the stage and
   * setting its scene. It is a transient overlay like the banner - the sim
   * keeps running underneath it, and nothing about the flow waits on it:
   * autopilot batches dismiss it by TICK COUNT, so `run()` can never stall,
   * and real play dismisses on Enter, a tap, or a 3s wall-clock hold.
   * Depth 10_000: above the vignette, banner and touch controls, below the
   * readouts and the pause/continue overlays, so those always win.
   */
  private raiseIntroCard(sim: Sim): void {
    this.teardownIntro()
    const lore = stageLore(sim.stage.id)
    const stage = sim.stage
    const card = this.add.container(SCREEN_WIDTH / 2, 136).setDepth(10_000).setName('introCard')
    const parchment = this.add
      .image(0, 0, 'flow:intro')
      .setOrigin(0.5)
      .setDisplaySize(CARD_TEX.width, CARD_TEX.height)
      .setScrollFactor(0)
    const sealKey = ensureDisplayTextTexture(this, `STAGE ${lore.number}`, { variant: 'gold', size: 12 })
    const sealSize = this.displayTextSize(sealKey)
    const seal = this.add
      .image(0, -CARD_TEX.height / 2 + 16, sealKey)
      .setOrigin(0.5)
      .setDisplaySize(sealSize.w, sealSize.h)
      .setScrollFactor(0)
    const name = this.add
      .text(0, -22, `${stage.nameEn} · ${stage.nameZh}`, {
        ...liveStyle(10, { color: '#3a2a14', bold: true }),
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
    const rule = this.add
      .rectangle(0, -12, CARD_TEX.width - 56, 1, 0x8a6a3a, 0.8)
      .setScrollFactor(0)
    const lore1 = this.add
      .text(0, 0, lore.lines[0], { ...liveStyle(8, { color: '#4a3820' }) })
      .setOrigin(0.5)
      .setScrollFactor(0)
    const lore2 = this.add
      .text(0, 11, lore.lines[1], { ...liveStyle(8, { color: '#4a3820' }) })
      .setOrigin(0.5)
      .setScrollFactor(0)
    const caption = this.add
      .text(0, 28, lore.captionZh, { ...liveStyle(10, { color: '#8a2418', bold: true }) })
      .setOrigin(0.5)
      .setScrollFactor(0)
    const hint = this.add
      .text(0, CARD_TEX.height / 2 - 14, hasTouch() ? 'TAP TO FIGHT' : 'PRESS ENTER TO FIGHT', {
        ...liveStyle(8, { color: '#6a5230' }),
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
    this.tweens.add({ targets: hint, alpha: 0.25, duration: 500, yoyo: true, repeat: -1 })
    card.add([parchment, seal, name, rule, lore1, lore2, caption, hint])
    card.setScale(0.85).setAlpha(0)
    this.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 160, ease: 'Cubic.easeOut' })
    this.introCard = card
    this.introTick = sim.tick
    this.introMs = this.time.now
    this.introDismiss = (): void => this.dismissIntroCard()
    this.input.keyboard?.on('keydown-ENTER', this.introDismiss)
    this.input.on('pointerdown', this.introDismiss)
  }

  /** Remove the card and its input wiring; safe to call with nothing up. */
  private teardownIntro(): void {
    this.introPending = false
    if (this.introDismiss) {
      this.input.keyboard?.off('keydown-ENTER', this.introDismiss)
      this.input.off('pointerdown', this.introDismiss)
      this.introDismiss = undefined
    }
    this.introCard?.destroy()
    this.introCard = undefined
  }

  /** Dismiss with a quick roll-up; a no-op when the card is already gone. */
  private dismissIntroCard(): void {
    const card = this.introCard
    if (!card) return
    if (this.introDismiss) {
      this.input.keyboard?.off('keydown-ENTER', this.introDismiss)
      this.input.off('pointerdown', this.introDismiss)
      this.introDismiss = undefined
    }
    this.introCard = undefined
    this.tweens.add({
      targets: card,
      alpha: 0,
      scaleY: 0.1,
      duration: 140,
      ease: 'Cubic.easeIn',
      onComplete: () => card.destroy(),
    })
  }

  /**
   * Autopilot dismissal is TICK-based, not wall-clock: run() batches drain
   * hundreds of ticks in a frame and must never queue behind a real-time
   * hold. Real play gets the 3s fallback plus the Enter/tap dismissals.
   * Materialization itself is wall-clock - showing late can only shorten the
   * card's exposure, never block anything.
   */
  private syncIntroCard(sim: Sim, autopilot: boolean): void {
    if (!this.introCard && this.introPending && this.time.now >= this.introShowAtMs) {
      // UIR-3 (V-3): never raise the card while the stage banner still
      // shows - the two carry the same stage number and name.
      const banner = this.children.list.find((c) => c.name === 'stageBanner') as
        | { alpha?: number }
        | undefined
      if (banner && (banner.alpha ?? 0) > 0.05) return
      this.raiseIntroCard(sim)
      return
    }
    if (!this.introCard) return
    if (autopilot && sim.tick - this.introTick >= 30) {
      this.dismissIntroCard()
      return
    }
    if (this.time.now - this.introMs > 3_000) this.dismissIntroCard()
  }

  /**
   * The display-list sweep destroys these, and a destroyed object is still
   * truthy - which is how a stale plate reference once made the next stage
   * skip rebuilding player two's HUD and then call setData on a dead object.
   */
  private clearPlayerTwoHud(): void {
    this.p2Plate = undefined
    this.p2Medal = undefined
    this.p2NameText = undefined
    this.p2Bar = undefined
    this.p2Pip = undefined
    this.p2Meta = undefined
    this.p2DownText = undefined
  }

  /** Player two's plate, built the moment they join and not before. */
  private showPlayerTwoHud(charId: string): void {
    if (this.p2Plate) return
    const character = characterById(charId)
    ensurePortraitTextures(this, [charId])
    this.ensureMedallion(charId)
    const g2 = L.slotFor('p2')
    // Later than the P1 labels, but below them in depth - it can bury nothing.
    this.p2Plate = this.bakedImage(g2.plate.x, g2.plate.y, 'hud:plate:p2', PLATE_TEX.width, PLATE_TEX.height).setDepth(
      10_000,
    )
    this.p2Medal = this.bakedImage(
      g2.medalX - MEDAL_TEX.width / 2,
      g2.medalY - MEDAL_TEX.height / 2,
      `hud:medallion:${charId}`,
      MEDAL_TEX.width,
      MEDAL_TEX.height,
    ).setDepth(10_001)
    this.p2NameText = this.add
      .text(g2.nameX, L.NAME.y, `2P ${character.nameEn} ${character.nameZh}`, {
        ...liveStyle(9, { color: '#cfe8ff', bold: true }),
      })
      .setOrigin(1, 0)
      .setDepth(10_002)
    this.p2Bar = makeArcadeBar(this, g2.hp.x, g2.hp.y, g2.hp.w, g2.hp.h, 10_001, L.playerSegments(character.maxHp))
    this.p2Pip = this.bakedImage(
      g2.pearlX - PEARL_TEX.width / 2,
      g2.pearlY - PEARL_TEX.height / 2,
      'hud:pearl-dim',
      PEARL_TEX.width,
      PEARL_TEX.height,
    ).setDepth(10_001)
    this.p2Meta = this.add
      .text(g2.metaX, L.META_ROW.y, '', { ...liveStyle(L.META_ROW.size, { color: '#8ab0c0' }) })
      .setOrigin(1, 0)
      .setDepth(10_002)
    this.p2DownText = this.add
      .text(SCREEN_WIDTH / 2, 114, '', {
        ...liveStyle(10, { color: '#cfe8ff', bold: true }),
      })
      .setOrigin(0.5)
      .setDepth(10_002)
  }

  private drainBanners(): void {
    for (const b of this.banners.splice(0)) this.raiseBanner(b)
  }

  /**
   * Nameplate banner: sweeps in on its baked plaque, holds, sweeps out.
   *
   * Drawn UNDER the HUD plates, at 9_800, so a transient title card never
   * covers a persistent readout; above the vignette (9_000) and the touch
   * controls (9_500), it still reads as being over the battlefield.
   */
  private raiseBanner({ title, subtitle, color, holdMs, belowRail }: PendingBanner): void {
    const variant = color === RED ? 'red' : 'gold'
    const key = variant === 'red' ? 'hud:banner:red' : 'hud:banner:gold'
    // UIR-2 (V-2): the boss WARNING drops below the rail band so its
    // title reads while the rail is up - it used to hide behind the rail.
    const container = this.add
      .container(SCREEN_WIDTH / 2, L.BANNER.y + (belowRail === true ? L.WARNING_BANNER_DROP : 0))
      .setDepth(9_800)
      .setAlpha(0)
      .setName('stageBanner')
    const plaque = this.add
      .image(0, 0, key)
      .setOrigin(0.5)
      .setDisplaySize(BANNER_TEX.width, BANNER_TEX.height)
      .setScrollFactor(0)
    const titleText = this.add
      .text(0, -8, title, {
        ...liveStyle(16, {
          color: variant === 'red' ? '#ffb0a0' : '#ffd700',
          bold: true,
          italic: true,
        }),
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
    const subText = this.add
      .text(0, 10, subtitle, { ...liveStyle(9, { color: '#f5e6c8' }) })
      .setOrigin(0.5)
      .setScrollFactor(0)
    container.add([plaque, titleText, subText])
    container.setScale(0.3, 1).setX(SCREEN_WIDTH / 2)
    this.tweens.add({
      targets: container,
      scaleX: 1,
      duration: BANNER_SWEEP_MS,
      ease: 'Cubic.easeOut',
      hold: holdMs,
      yoyo: true,
      alpha: { from: 0, to: 1 },
      onComplete: () => container.destroy(),
    })
  }

  private sync(sim: Sim, deltaMs: number): void {
    const player = playerOf(sim)
    const character = characterById(sim.charId)
    const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp))
    this.p1Ghost = L.decayGhost(this.p1Ghost, hpRatio, deltaMs)
    this.hpBar.set(hpRatio, hpRatio <= 0.3, this.p1Ghost)

    // The flaming pearl lights while the special's health cost is payable.
    const ready = player.hp > character.specialCost
    this.specialPip.setTexture(ready ? 'hud:pearl' : 'hud:pearl-dim')

    // Lives as helm pips.
    for (let i = 0; i < this.pips.length; i += 1) {
      this.pips[i]?.setVisible(i < Math.min(sim.lives, L.PIP_ROW.max))
    }

    // Player two's plate appears the moment they join - derived from the sim,
    // so a drop-in join and a co-op run carried across a stage break are the
    // same code path rather than two call sites that can disagree.
    if (sim.player2Id !== null && sim.char2Id) this.showPlayerTwoHud(sim.char2Id)
    if (this.p2Bar) {
      const p2 = sim.player2Id !== null ? sim.entities.find((e) => e.id === sim.player2Id) : undefined
      const ratio = p2 ? Math.max(0, Math.min(1, p2.hp / p2.maxHp)) : 0
      this.p2Ghost = L.decayGhost(this.p2Ghost, ratio, deltaMs)
      this.p2Bar.set(ratio, ratio <= 0.3, this.p2Ghost)
      const down = p2?.state === 'dead' && sim.phase === 'fight' && sim.lives > 0
      this.p2DownText?.setText(down ? '2P DOWN - PRESS F TO REJOIN' : '')
      if (p2) {
        const cost = sim.char2Id ? characterById(sim.char2Id).specialCost : 0
        this.p2Pip?.setTexture(p2.hp > cost ? 'hud:pearl' : 'hud:pearl-dim')
        this.p2Meta?.setText(this.metaFor(sim, p2))
      }
    }

    const p1Down = player.state === 'dead' && sim.phase === 'fight' && sim.lives > 0
    this.p1DownText.setText(p1Down ? '1P DOWN - PRESS Z TO REJOIN' : '')
    this.scoreText.setText(`SCORE ${sim.stats.score}`)
    const meta = this.metaFor(sim, player)
    this.metaText.setText(audio.muted && meta ? `${meta}  M` : (audio.muted ? 'M' : meta))
    this.syncCombo(sim.stats.comboHits)

    // WAVE chip: the locked wave count, then the advance cue.
    const boss = sim.entities.find((e) => e.kind === sim.stage.bossKind)
    if (boss) {
      this.waveText.setText('BOSS').setColor('#e85438')
      this.foesText.setText('')
      this.goCue.setVisible(false)
      this.goTween?.pause()
      this.goCue.setAlpha(1)
    } else if (sim.cameraLocked) {
      const remaining = sim.entities.filter((e) => e.side === 'enemy' && !isProjectile(e)).length
      this.waveText.setText(`WAVE ${sim.waveIndex + 1}`).setColor('#f5e6c8')
      this.foesText.setText(`×${remaining}`)
      this.goCue.setVisible(false)
      this.goTween?.pause()
      this.goCue.setAlpha(1)
    } else {
      this.waveText.setText('GO!').setColor('#ffd700')
      this.foesText.setText('')
      if (!this.goCue.visible) {
        this.goCue.setVisible(true)
        this.goTween?.resume()
      }
    }

    this.syncContinueOverlay(sim)
    this.syncPauseOverlay()

    if (boss) {
      const def = enemyByKind(boss.kind)
      this.bossNameText.setText(`${def.nameEn} ${def.nameZh}`).setVisible(true)
      this.rail.setVisible(true)
      this.bossBar.graphics.setVisible(true)
      this.bossTag.setVisible(true)
      const ratio = Math.max(0, Math.min(1, boss.hp / boss.maxHp))
      this.bossGhost = L.decayGhost(this.bossGhost, ratio, deltaMs)
      this.bossBar.set(ratio, true, this.bossGhost)
    }
  }

  /**
   * The plate's third row: held weapon and mount health, kept compact
   * ('SWORD HORSE 20') so the longest line still fits inside the plate -
   * the containment gate fails a label that spills past its panel edge.
   */
  private metaFor(sim: Sim, entity: { weapon: string | null; mountedOn: number | null }): string {
    const parts: string[] = []
    if (entity.weapon) parts.push(entity.weapon.toUpperCase())
    if (entity.mountedOn !== null) {
      const horse = sim.entities.find((e) => e.id === entity.mountedOn)
      if (horse) parts.push(`HORSE ${horse.hp}`)
    }
    return parts.join(' ')
  }

  /** Combo readout: number pops while the baked HIT tag holds still. */
  private syncCombo(hits: number): void {
    if (hits === this.comboShown) return
    this.comboShown = hits
    const on = hits >= 2
    this.comboText.setText(on ? String(hits) : '')
    this.comboTag.setVisible(on)
    if (on) {
      this.comboText.setScale(1.45)
      this.tweens.add({ targets: this.comboText, scale: 1, duration: 140, ease: 'Back.easeOut' })
    }
  }

  /**
   * The countdown is wall-clock and belongs to `game`, which owns the revive.
   * Everything visible about it is derived from that one number, so there is
   * nothing to push and nothing that can fall out of step.
   */
  private syncContinueOverlay(sim: Sim): void {
    const owner = this.scene.get('game') as unknown as GameReadout | undefined
    const msLeft = owner?.continueMsLeft ?? -1
    const showing = msLeft > 0
    this.continueDim.setVisible(showing)
    this.continueCard.setVisible(showing)
    this.continueText.setVisible(showing)
    this.continueCountdownText.setVisible(showing)
    this.continueHintText.setVisible(showing && sim.lives > 0)
    if (showing) {
      this.continueCountdownText.setText(String(Math.max(0, Math.ceil(msLeft / 1000))))
    }
  }

  /**
   * The pause overlay, derived from `game`'s flag the same way the continue
   * overlay derives from its countdown: nothing to push, nothing to desync.
   */
  private syncPauseOverlay(): void {
    const owner = this.scene.get('game') as unknown as GameReadout | undefined
    const showing = owner?.paused === true
    this.pauseDim.setVisible(showing)
    this.pauseCard.setVisible(showing)
    this.pauseText.setVisible(showing)
    this.pauseHintText.setVisible(showing)
  }
}
