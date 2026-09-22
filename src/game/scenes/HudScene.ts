import Phaser from 'phaser'
import { characterById } from '../../core/characters'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../core/constants'
import { isProjectile } from '../../core/entities'
import { enemyByKind } from '../../core/enemies'
import { playerOf, type Sim } from '../../core/sim'
import { audio } from '../audio/sfx'
import { hasTouch, TouchAdapter } from '../adapters/touch'
import { ensurePortraitTextures, portraitKeyFor } from '../adapters/sprites'
import { destroyAllChildren } from '../ui/display'
import { useLogicalViewport } from '../ui/viewport'
import { addVignette, drawSlab, makeBar } from '../ui/panels'
import type { BridgeState } from '../debug/bridge'

/**
 * The in-stage HUD, as a scene of its own running in parallel with `game`.
 *
 * Worth being accurate about WHY it is separate, because the obvious reason is
 * wrong: a zoomed camera does displace scrollFactor-0 objects, but only while
 * its origin is the default centre, and `useLogicalViewport` pins the origin to
 * the top-left precisely so that stops happening. The HUD would in fact render
 * correctly inside `game`.
 *
 * It is separate for two reasons that do hold. GameScene was 951 lines, past
 * the 800 this project sets itself, and roughly a third of it was HUD that
 * touched nothing else. And the HUD is a pure function of the Sim, which is
 * much easier to keep true when it has no access to anything else - it cannot
 * quietly start owning game state if it never sees any. A side benefit: the HUD
 * no longer rides the camera shake, which is what an arcade HUD should do.
 *
 * It PULLS rather than being pushed to. Everything it draws is derived from the
 * Sim, which it reads off the debug bridge in the registry - the same object
 * `game` publishes there - so there is no start-order dependency between the
 * two scenes and no second copy of any state. The one thing it cannot derive is
 * the continue countdown, which is wall-clock and owned by `game`; it reads
 * that field structurally rather than importing GameScene, which would be a
 * cycle.
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
}

type Bar = ReturnType<typeof makeBar>

const GOLD = 0xc8a828
const CYAN = 0x4a9ad8
const RED = 0xd33a3a

/**
 * Plate geometry. P2 and the boss are the same shape at other anchors.
 *
 * The widths are what leave the centre column its own lane: plates end at 174
 * and the boss plate starts at 306, so the stage name, score and objective have
 * 132px of clear screen between them. The first pass at this made the plates
 * 206 wide and the boss plate sat straight on top of the objective line.
 */
const P1 = { x: 6, y: 6, w: 168, h: 48 }
const P2 = { x: 6, y: 58, w: 168, h: 32 }
const BOSS = { x: SCREEN_WIDTH - 174, y: 6, w: 168, h: 42 }
const BAR_W = 104

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

  private hpBar!: Bar
  private specialPip!: Phaser.GameObjects.Graphics
  private scoreText!: Phaser.GameObjects.Text
  private objectiveText!: Phaser.GameObjects.Text
  private weaponText!: Phaser.GameObjects.Text
  private livesText!: Phaser.GameObjects.Text
  private horseText!: Phaser.GameObjects.Text
  private p1DownText!: Phaser.GameObjects.Text
  private continueDim!: Phaser.GameObjects.Rectangle
  private continueSlab!: Phaser.GameObjects.Graphics
  private continueText!: Phaser.GameObjects.Text
  private continueCountdownText!: Phaser.GameObjects.Text
  private continueHintText!: Phaser.GameObjects.Text
  private pauseDim!: Phaser.GameObjects.Rectangle
  private pauseSlab!: Phaser.GameObjects.Graphics
  private pauseText!: Phaser.GameObjects.Text
  private pauseHintText!: Phaser.GameObjects.Text
  private comboText!: Phaser.GameObjects.Text
  private comboShown = 0
  private bossSlab!: Phaser.GameObjects.Graphics
  private bossNameText!: Phaser.GameObjects.Text
  private bossBar!: Bar
  private p2Slab?: Phaser.GameObjects.Graphics
  private p2NameText?: Phaser.GameObjects.Text
  private p2Portrait?: Phaser.GameObjects.Image
  private p2Bar?: Bar
  private p2DownText?: Phaser.GameObjects.Text

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
   * `game` raises the stage banner from its own `create`.
   */
  showBanner(title: string, subtitle: string, color: number): void {
    this.banners.push({ title, subtitle, color })
  }

  update(): void {
    const bridge = this.registry.get('bridge') as BridgeState | undefined
    const sim = bridge?.sim
    if (!sim) return
    if (sim !== this.boundSim) this.build(sim)
    this.drainBanners()
    this.sync(sim)
  }

  /** Tear down and rebuild for a new stage's Sim. */
  private build(sim: Sim): void {
    destroyAllChildren(this)
    this.clearPlayerTwoHud()
    this.comboShown = 0
    this.boundSim = sim
    const character = characterById(sim.charId)
    const stage = sim.stage
    ensurePortraitTextures(this, [sim.charId])

    // Cinematic vignette over the battlefield, under everything in the HUD.
    addVignette(this, SCREEN_WIDTH, SCREEN_HEIGHT, 9_000, 0.5)

    // EVERY plate first, then the readouts, then the labels. The occlusion gate
    // flags an opaque object drawn AFTER a label at the same or higher depth,
    // and grouping the passes this way means no plate can ever land on top of
    // text - which is exactly what the boss plate did to the objective line
    // when it was created after it.
    drawSlab(this, P1.x, P1.y, P1.w, P1.h, GOLD, 10_000)
    this.bossSlab = drawSlab(this, BOSS.x, BOSS.y, BOSS.w, BOSS.h, RED, 10_000, { mirror: true })
    this.bossSlab.setVisible(false).setName('bossBarFrame')
    // The continue overlay's backdrop. Under 0.7 alpha, so the occlusion gate
    // reads it as a tint rather than as something burying the label - and it is
    // a backdrop the overlay simply did not have until now: CONTINUE? sat
    // straight on the frozen battlefield.
    this.continueDim = this.add
      .rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT, 0x05040a, 0.62)
      .setDepth(10_001)
      .setVisible(false)
    this.continueSlab = drawSlab(this, SCREEN_WIDTH / 2 - 92, 74, 184, 96, GOLD, 10_001)
    this.continueSlab.setVisible(false)
    // The pause overlay's backdrop and slab: same depths and dim alpha as the
    // continue overlay, created after it so a pause during the countdown reads
    // PAUSED first. Both hidden until their state shows.
    this.pauseDim = this.add
      .rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT, 0x05040a, 0.62)
      .setDepth(10_001)
      .setVisible(false)
    this.pauseSlab = drawSlab(this, SCREEN_WIDTH / 2 - 88, 100, 176, 70, GOLD, 10_001)
    this.pauseSlab.setVisible(false)

    this.addPortrait(sim.charId, P1.x + 4, P1.y + 4)
    this.hpBar = makeBar(this, P1.x + 38, P1.y + 19, BAR_W, 9, 10_001)
    this.specialPip = this.add.graphics().setDepth(10_001)
    this.bossBar = makeBar(this, BOSS.x + 34, BOSS.y + 20, 126, 9, 10_001)
    this.bossBar.graphics.setVisible(false)

    // --- Labels -----------------------------------------------------------
    this.add
      .text(P1.x + 36, P1.y + 4, `${character.nameEn} ${character.nameZh}`, {
        fontFamily: 'sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setDepth(10_002)
    this.weaponText = this.add
      .text(P1.x + 34, P1.y + 33, '', { fontFamily: 'sans-serif', fontSize: '7px', color: '#c0c0c0' })
      .setDepth(10_002)
    this.livesText = this.add
      .text(P1.x + 84, P1.y + 33, '', { fontFamily: 'sans-serif', fontSize: '7px', color: '#ffd700' })
      .setDepth(10_002)
    this.horseText = this.add
      .text(P1.x + 118, P1.y + 33, '', { fontFamily: 'sans-serif', fontSize: '7px', color: '#d8a868' })
      .setDepth(10_002)
    this.bossNameText = this.add
      .text(BOSS.x + 28, BOSS.y + 5, '', {
        fontFamily: 'sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#ffb0a0',
      })
      .setDepth(10_002)
      .setVisible(false)

    this.add
      .text(SCREEN_WIDTH / 2, 8, `${stage.nameEn} · ${stage.nameZh}`, {
        fontFamily: 'sans-serif',
        fontSize: '9px',
        color: '#d8c8a0',
      })
      .setOrigin(0.5, 0)
      .setDepth(10_000)
    this.scoreText = this.add
      .text(SCREEN_WIDTH / 2, 22, 'SCORE 0', { fontFamily: 'sans-serif', fontSize: '9px', color: '#ffd700' })
      .setOrigin(0.5)
      .setDepth(10_000)
    this.objectiveText = this.add
      .text(SCREEN_WIDTH / 2, 38, '', { fontFamily: 'sans-serif', fontSize: '10px', color: '#ffd700' })
      .setOrigin(0.5)
      .setDepth(10_000)
    this.comboText = this.add
      .text(SCREEN_WIDTH / 2, 60, '', {
        fontFamily: 'sans-serif',
        fontSize: '17px',
        fontStyle: 'bold italic',
        color: '#ffd700',
        stroke: '#5a3a00',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10_002)
    this.p1DownText = this.add
      .text(SCREEN_WIDTH / 2, 100, '', {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#ffd700',
      })
      .setOrigin(0.5)
      .setDepth(10_002)

    this.continueText = this.add
      .text(SCREEN_WIDTH / 2, 92, 'CONTINUE?', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffd700',
      })
      .setOrigin(0.5)
      .setDepth(10_002)
      .setVisible(false)
    this.continueCountdownText = this.add
      .text(SCREEN_WIDTH / 2, 126, '9', {
        fontFamily: 'sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(10_002)
      .setVisible(false)
    this.continueHintText = this.add
      .text(SCREEN_WIDTH / 2, 154, hasTouch() ? 'TAP TO CONTINUE' : 'PRESS ENTER', {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#9ab0c0',
      })
      .setOrigin(0.5)
      .setDepth(10_002)
      .setVisible(false)
    this.pauseText = this.add
      .text(SCREEN_WIDTH / 2, 120, 'PAUSED', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffd700',
      })
      .setOrigin(0.5)
      .setDepth(10_002)
      .setVisible(false)
    this.pauseHintText = this.add
      .text(SCREEN_WIDTH / 2, 148, 'PRESS P TO RESUME', {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#9ab0c0',
      })
      .setOrigin(0.5)
      .setDepth(10_002)
      .setVisible(false)

    // The on-screen controls go on LAST so they sit over the HUD, and they are
    // re-mounted on every rebuild because the sweep at the top of this method
    // destroyed the previous set along with everything else.
    if (hasTouch()) this.touch.mount(this)
  }

  private addPortrait(charId: string, x: number, y: number): Phaser.GameObjects.Image | undefined {
    const key = portraitKeyFor(charId)
    if (!this.textures.exists(key)) return undefined
    const frame = this.textures.get(key).get()
    const h = 30
    return this.add
      .image(x, y, key)
      .setOrigin(0, 0)
      .setDisplaySize((frame.width / Math.max(1, frame.height)) * h, h)
      .setDepth(10_001)
  }

  /**
   * The display-list sweep destroys these, and a destroyed object is still
   * truthy - which is how a stale panel reference once made the next stage skip
   * rebuilding player two's HUD and then call setDisplaySize on a dead object.
   */
  private clearPlayerTwoHud(): void {
    this.p2Slab = undefined
    this.p2NameText = undefined
    this.p2Portrait = undefined
    this.p2Bar = undefined
    this.p2DownText = undefined
  }

  /** Player two's plate, built the moment they join and not before. */
  private showPlayerTwoHud(charId: string): void {
    if (this.p2Slab) return
    const character = characterById(charId)
    ensurePortraitTextures(this, [charId])
    this.p2Slab = drawSlab(this, P2.x, P2.y, P2.w, P2.h, CYAN, 10_000)
    this.p2Portrait = this.addPortrait(charId, P2.x + 4, P2.y + 1)
    this.p2NameText = this.add
      .text(P2.x + 36, P2.y + 3, `2P ${character.nameEn} ${character.nameZh}`, {
        fontFamily: 'sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#cfe8ff',
      })
      .setDepth(10_002)
    // Same bar height as player one. They used to be 8px and 6px, which made
    // the second player's health look like a lesser kind of health.
    this.p2Bar = makeBar(this, P2.x + 38, P2.y + 17, BAR_W, 9, 10_001)
    this.p2DownText = this.add
      .text(SCREEN_WIDTH / 2, 114, '', {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#cfe8ff',
      })
      .setOrigin(0.5)
      .setDepth(10_002)
  }

  private drainBanners(): void {
    for (const b of this.banners.splice(0)) this.raiseBanner(b)
  }

  /**
   * Nameplate banner: sweeps in on a slab, holds, sweeps out.
   *
   * Drawn UNDER the plates, at 9_800. It used to sit at 11_000, the only object
   * in the game above the HUD's 10_000..10_002 band, and for the ~1.9s it holds
   * it covered 29% of player two's HP bar at the start of every co-op stage and
   * 64% of the CONTINUE? label whenever a death landed in that window. A
   * transient title card has no business covering a persistent readout; the HUD
   * is the top layer. Above the vignette (9_000) and the on-screen touch
   * controls (9_500), so it still reads as being over the battlefield.
   */
  private raiseBanner({ title, subtitle, color }: PendingBanner): void {
    const w = Math.round(SCREEN_WIDTH * 0.5)
    const container = this.add
      .container(SCREEN_WIDTH / 2, 70)
      .setDepth(9_800)
      .setAlpha(0)
      .setName('stageBanner')
    const bg = this.add.rectangle(0, 2, w, 44, 0x0d0d12)
    bg.setStrokeStyle(2, color)
    const railTop = this.add.rectangle(0, -22, w, 3, color)
    const railBot = this.add.rectangle(0, 24, w, 3, color)
    const capL = this.add.rectangle(-w / 2, 2, 4, 40, color)
    const capR = this.add.rectangle(w / 2, 2, 4, 32, color)
    const titleText = this.add
      .text(0, -7, title, {
        fontFamily: 'sans-serif',
        fontSize: '17px',
        fontStyle: 'bold italic',
        color: '#ffffff',
      })
      .setOrigin(0.5)
    const subText = this.add
      .text(0, 11, subtitle, { fontFamily: 'sans-serif', fontSize: '10px', color: '#f5e6c8' })
      .setOrigin(0.5)
    container.add([bg, railTop, railBot, capL, capR, titleText, subText])
    container.setScale(0.3, 1).setX(SCREEN_WIDTH / 2)
    this.tweens.add({
      targets: container,
      scaleX: 1,
      duration: 180,
      ease: 'Cubic.easeOut',
      hold: 1500,
      yoyo: true,
      alpha: { from: 0, to: 1 },
      onComplete: () => container.destroy(),
    })
  }

  private sync(sim: Sim): void {
    const player = playerOf(sim)
    const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp))
    this.hpBar.set(hpRatio, hpRatio <= 0.3)
    this.syncSpecialPip(sim, player.hp)

    // Player two's plate appears the moment they join - derived from the sim,
    // so a drop-in join and a co-op run carried across a stage break are the
    // same code path rather than two call sites that can disagree.
    if (sim.player2Id !== null && sim.char2Id) this.showPlayerTwoHud(sim.char2Id)
    if (this.p2Bar) {
      const p2 = sim.player2Id !== null ? sim.entities.find((e) => e.id === sim.player2Id) : undefined
      const ratio = p2 ? Math.max(0, Math.min(1, p2.hp / p2.maxHp)) : 0
      this.p2Bar.set(ratio, ratio <= 0.3)
      const down = p2?.state === 'dead' && sim.phase === 'fight' && sim.lives > 0
      this.p2DownText?.setText(down ? '2P DOWN - PRESS F TO REJOIN' : '')
    }

    const p1Down = player.state === 'dead' && sim.phase === 'fight' && sim.lives > 0
    this.p1DownText.setText(p1Down ? '1P DOWN - PRESS Z TO REJOIN' : '')
    this.scoreText.setText(`SCORE ${sim.stats.score}`)
    this.weaponText.setText(player.weapon ? `WEAPON ${player.weapon.toUpperCase()}` : '')
    this.livesText.setText(`LIVES ${sim.lives}${audio.muted ? ' [M]' : ''}`)
    this.syncCombo(sim.stats.comboHits)

    const horse =
      player.mountedOn !== null ? sim.entities.find((e) => e.id === player.mountedOn) : undefined
    this.horseText.setText(horse ? `HORSE ${horse.hp}/${horse.maxHp}` : '')
    if (sim.cameraLocked) {
      const remaining = sim.entities.filter((e) => e.side === 'enemy' && !isProjectile(e)).length
      this.objectiveText.setText(`Wave ${sim.waveIndex + 1} - enemies left: ${remaining}`)
    } else {
      this.objectiveText.setText('Area cleared - head right!')
    }

    this.syncContinueOverlay(sim)
    this.syncPauseOverlay()

    const boss = sim.entities.find((e) => e.kind === sim.stage.bossKind)
    if (boss) {
      const def = enemyByKind(boss.kind)
      this.bossNameText.setText(`${def.nameEn} ${def.nameZh}`).setVisible(true)
      this.bossSlab.setVisible(true)
      this.bossBar.graphics.setVisible(true)
      const ratio = Math.max(0, Math.min(1, boss.hp / boss.maxHp))
      this.bossBar.set(ratio, true)
    }
  }

  /**
   * The special-ready marker.
   *
   * Driven by the real cost of the move against current health, because the
   * special SPENDS HEALTH - there is no meter behind it. Drawing a meter would
   * look more like a fighting game and would be inventing a mechanic the sim
   * does not have.
   */
  private syncSpecialPip(sim: Sim, hp: number): void {
    const cost = characterById(sim.charId).specialCost
    const ready = hp > cost
    const x = P1.x + 38 + BAR_W + 10
    const y = P1.y + 23
    this.specialPip.clear()
    this.specialPip.fillStyle(ready ? 0xffd700 : 0x3a3038, 1)
    this.specialPip.beginPath()
    this.specialPip.moveTo(x, y - 6)
    this.specialPip.lineTo(x + 5, y)
    this.specialPip.lineTo(x, y + 6)
    this.specialPip.lineTo(x - 5, y)
    this.specialPip.closePath()
    this.specialPip.fillPath()
    this.specialPip.lineStyle(1, ready ? 0xfff2b0 : 0x1a161c, 0.9)
    this.specialPip.strokePath()
  }

  /** Combo readout, with a pop each time the count actually rises. */
  private syncCombo(hits: number): void {
    if (hits === this.comboShown) return
    this.comboShown = hits
    this.comboText.setText(hits >= 2 ? `${hits} HIT` : '')
    if (hits >= 2) {
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
    this.continueSlab.setVisible(showing)
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
    this.pauseSlab.setVisible(showing)
    this.pauseText.setVisible(showing)
    this.pauseHintText.setVisible(showing)
  }
}
