import Phaser from 'phaser'
import { characterById } from '../../core/characters'
import {
  MAX_CATCHUP_STEPS,
  SCREEN_HEIGHT,
  TICK_MS,
  DYING_TICKS,
} from '../../core/constants'
import {
  createSim,
  drainSimEvents,
  joinPlayer2,
  playerOf,
  stepSim,
  tryRevivePlayer,
  type Sim,
} from '../../core/sim'
import { enemyByKind, ENEMIES } from '../../core/enemies'
import { STAGE_ORDER } from '../../core/stage'
import { secondPlayerCharacter } from '../players'
import { audio, sfxForEvent } from '../audio/sfx'
import { GAME_THEME } from '../audio/music'
import type { SimEvent } from '../../core/events'
import type { Entity } from '../../core/types'
import { KeyboardAdapter, PLAYER_TWO_KEYS } from '../adapters/keyboard'
import { GamepadAdapter, mergeInputs, watchConfirmButton } from '../adapters/gamepad'
import { NO_TOUCH } from '../adapters/touch'
import { ensureBlendKey, ensureEntityTextures, isPropKind, poseForEntity, textureKeyFor, textureKeyForPose, type Pose } from '../adapters/sprites'
import { clearMotionPlayback, ensureMotionKey, forgetMotionEntity, motionVisualLift } from '../adapters/motion-art'
import { heroArtResources } from '../adapters/hero-art'
import { rotateBlocked } from '../ui/orientation'
import { artDisplayHeight } from '../art/registry'
import {
  EMBERS_H,
  GROUND_H,
  MARKS_H,
  RIDGE_H,
  SKY_H,
  TILE_W,
  CLOUD_H,
  CLOUD_W,
  paintCloud,
  paintEmbers,
  paintGround,
  paintMarks,
  paintRidge,
  paintSky,
} from '../art/backdrop'
import { stageBackdrop } from '../data/stagebackdrop'
import { RENDER_SCALE } from '../render'
import { destroyAllChildren } from '../ui/display'
import { useCrispText } from '../ui/viewport'
import { consumePendingStart, type BridgeState } from '../debug/bridge'
import type { HudScene } from './HudScene'

/** Cloud placements: [x, y, scale, alpha]. Fixed, so screenshots are stable. */
const CLOUDS: ReadonlyArray<readonly [number, number, number, number]> = [
  [300, 58, 1.1, 0.16],
  [110, 118, 0.8, 0.13],
  [392, 40, 0.7, 0.14],
  [44, 68, 0.9, 0.12],
  [232, 92, 0.6, 0.10],
]

/** Height of the distant-hill ridge texture, in logical px. */
const HILL_HEIGHT = RIDGE_H
/** How far the ridge sinks behind the ground strip, so there is no seam. */
const HILL_ROOT_DEPTH = 14
/** How far the landmark strip sinks behind the ground strip. */
const MARKS_ROOT_DEPTH = 8

/**
 * Every kind a stage can put on screen.
 *
 * Derived from the stage's own spawn tables rather than from "all enemies":
 * registering the whole cast for every stage generated 22 kinds x 8 poses of
 * texture when a stage uses five or six of them, and at a 424x232 figure box
 * that came to 52MB of textures - 89% of it transparent margin - on a game that
 * is meant to run on a phone.
 *
 * Loot is listed explicitly because it is not in the stage tables: `rollLoot`
 * can drop meat or a sword from any crate or enemy, and archers fire arrows.
 * `test/core/stages.test.ts` checks this list against every stage's own
 * declarations, so a stage that introduces a new enemy fails there rather than
 * silently spawning something invisible.
 */
export function stageArtKinds(sim: Sim): string[] {
  const stage = sim.stage
  return [
    ...new Set([
      ...sim.entities.map((e) => e.kind),
      ...stage.waves.flatMap((w) => w.spawns.map((sp) => sp.kind)),
      ...stage.props.map((sp) => sp.kind),
      stage.bossKind,
      sim.charId,
      ...(sim.char2Id ? [sim.char2Id] : []),
      // Droppable loot and archer fire, which no stage table mentions.
      'arrow',
      'meat',
      'sword',
      'crate',
    ]),
  ]
}

/** Whether a kind already has art registered, for either art shape. */
function hasArtFor(scene: Phaser.Scene, kind: string): boolean {
  return (
    scene.textures.exists(textureKeyFor(kind)) ||
    scene.textures.exists(textureKeyForPose(kind, 'idle'))
  )
}

export interface GameSceneData {
  seed?: number
  charId?: string
  stageId?: string
  lives?: number
  score?: number
  /** Sim ticks accumulated across earlier stages in this run. */
  totalTicks?: number
  /** Player two's hero, so a co-op run carries across stage transitions. */
  char2Id?: string | null
}

/**
 * The stage scene. Owns the Sim and steps it at a fixed 1/60s rate:
 * autopilot mode drains bridge-queued ticks, real play accumulates frame
 * delta. Rendering is a read-only binding from entity state to sprites.
 */
export class GameScene extends Phaser.Scene {
  private sim!: Sim
  private bridge!: BridgeState
  private keyboardAdapter!: KeyboardAdapter
  private keyboard2Adapter!: KeyboardAdapter
  private hud!: HudScene
  private gamepadAdapter!: GamepadAdapter
  private gamepad2Adapter!: GamepadAdapter
  private touchAdapter: {
    poll: () => void
    read: (allow: boolean) => import('../../core/types').InputState
    clear: () => void
    onPauseRequest: (() => void) | null
  } = NO_TOUCH
  private pollStartButton!: () => void
  private sprites = new Map<number, Phaser.GameObjects.Sprite>()
  /** BODY-24: in-between frames queued per entity on a pose swap. */
  private blendQ = new Map<number, { steps: string[]; to: Pose }>()
  /** The last settled pose per entity - the blend's `from` side. */
  private lastPose = new Map<number, Pose>()
  /** Continue phase freezes core ticks; optional Guan Yu defeat can still finish. */
  private motionDefeat = new Map<number, { tick: number; remainder: number }>()
  private shadows = new Map<number, Phaser.GameObjects.Ellipse>()
  private accumulator = 0
  private cloudLayer!: Phaser.GameObjects.Container
  /**
   * Stage-clear beat: ms left before the result scene after the boss falls,
   * -1 = not counting. Counted in update() rather than a delayedCall so
   * pause freezes it: ENH-7's "no stage transitions until resume" promise
   * covers this transition too (ENH-9).
   */
  private clearMsLeft = -1
  /**
   * Wall-clock ms left on the continue countdown; -1 = not counting. Public
   * because HudScene draws it. The countdown is wall-clock and the revive it
   * gates is this scene's, so the state stays here and only the drawing moved.
   */
  continueMsLeft = -1
  /**
   * Gameplay pause (P key). Public because HudScene draws the overlay from it,
   * the same structural read as the continue countdown. While true, update()
   * polls adapters and clears their buffers but steps nothing: zero sim ticks,
   * frozen countdown, no joins.
   */
  paused = false
  /** Sim ticks accumulated across earlier stages in this run. */
  private runTotalTicks = 0
  private sparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter
  private koEmitter!: Phaser.GameObjects.Particles.ParticleEmitter
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter
  /** Per-frame burst budget so a busy frame can't spawn a particle storm. */
  private juiceBudget = 6

  constructor() {
    super('game')
  }

  create(data: GameSceneData): void {
    this.bridge = this.registry.get('bridge') as BridgeState
    this.bridge.scene = 'game'
    this.accumulator = 0
    this.clearMsLeft = -1
    // The scene instance is reused across stages: never inherit a pause.
    this.paused = false
    this.runTotalTicks = data.totalTicks ?? 0
    // Phaser reuses this scene instance across stage restarts: reset the
    // whole display list so backgrounds/HUD/sprites don't stack up.
    destroyAllChildren(this)
    this.sprites.clear()
    this.shadows.clear()
    clearMotionPlayback(this)
    this.motionDefeat.clear()
    const character = characterById(data.charId ?? 'zhaoyun')
    this.sim = createSim(data.seed ?? 1, {
      charId: character.id,
      stageId: data.stageId ?? 'stage1',
      lives: data.lives ?? 3,
      score: data.score ?? 0,
    })
    this.bridge.sim = this.sim

    const stage = this.sim.stage
    // The world stays 480x270 logical units and is drawn onto a 960x540 canvas
    // by zooming the camera, so every coordinate here - and every number in
    // src/core - keeps its meaning.
    //
    // The origin is pinned to the top-left rather than left at its default
    // centre, which makes the camera transform `(p - scrollX) * RENDER_SCALE`
    // and lets scrollX stay exactly the sim's. Camera BOUNDS are deliberately
    // not set with it: `clampX` computes its limits as if the origin were
    // centred (`bx = (displayWidth - width) / 2`), so it would clamp the far
    // end of every stage 240 units early. The sim already clamps scrollX and
    // the invariants assert it, so that was a duplicate source of truth.
    this.cameras.main.setOrigin(0, 0)
    this.cameras.main.setZoom(RENDER_SCALE)
    useCrispText(this)
    // The HUD lives in its own scene, running in parallel. It reads the sim off
    // the bridge, so nothing here has to wait for it to have started.
    this.scene.launch('hud')
    this.hud = this.scene.get('hud') as HudScene

    // Painted background: bright sky texture, sun, clouds, hills, ground.
    // Procedural and per-stage (no asset pipeline dependency). The sky and
    // ground use the same generate-texture -> tileSprite path so they render
    // identically (a raw Graphics fill at negative depth does not paint).
    const backdrop = stageBackdrop(this.sim.stage.id)
    const skyKey = this.bakeLayer(
      `bg-sky-${stage.bgSkyTop.toString(16)}-${stage.bgSkyBottom.toString(16)}-${backdrop.sky}`,
      TILE_W,
      SKY_H,
      (ctx) => paintSky(ctx, stage.bgSkyTop, stage.bgSkyBottom, backdrop.sky),
    )
    const sky = this.add.tileSprite(0, 0, stage.length + 64, SCREEN_HEIGHT, skyKey)
    sky.setOrigin(0, 0).setDepth(-20)
    // UIR-9 (V-13 + V-19 sky part): same half-texture display as the marks
    // strip had - the 2x-baked sky showed only its top half (the painted
    // sun at tile y176 never displayed). tileScale 0.5 maps it 1:1.
    sky.setTileScale(0.5, 0.5)
    sky.setName('bgSky')

    // Sun + glow, drifting with the camera on a scrollFactor-0 layer.
    // The sun is painted into the sky tile now, so this layer carries only the
    // clouds that parallax against it.
    this.cloudLayer = this.add.container(0, 0).setDepth(-19).setScrollFactor(0)
    // Clouds as overlapping lobes rather than bare rectangles - a horizontal
    // bar in the sky reads as a placeholder no matter what alpha it carries.
    const cloudKey = this.bakeLayer('bg-cloud', CLOUD_W, CLOUD_H, paintCloud)
    for (const [x, y, scale, alpha] of CLOUDS) {
      this.cloudLayer.add(
        this.add
          .image(x, y, cloudKey)
          .setDisplaySize(CLOUD_W * scale, CLOUD_H * scale)
          .setAlpha(Math.min(1, alpha * 3.4)),
      )
    }

    // Distant hills, parallaxed by tilePositionX. The ridge is anchored to the
    // HORIZON - the top of the ground strip - and roots a few pixels into it so
    // there is no seam. It used to be pinned to the bottom of the screen, which
    // put its whole silhouette below the viewport: the layer was tinted per
    // stage and scrolled every frame while drawing nothing the player could see.
    const groundTop = this.sim.stage.walkBandTop - 26
    const hillsY = groundTop - HILL_HEIGHT + HILL_ROOT_DEPTH
    const hillKey = this.bakeLayer(
      `bg-hills-${stage.bgHill.toString(16)}-${stage.bgSkyBottom.toString(16)}`,
      TILE_W,
      RIDGE_H,
      (ctx) => paintRidge(ctx, stage.bgHill, stage.bgSkyBottom),
    )
    const hills = this.add.tileSprite(0, hillsY, stage.length + 64, HILL_HEIGHT, hillKey)
    hills.setOrigin(0, 0).setDepth(-15)
    // UIR-10 (V-13 + V-19 ridge part): same half-texture display the marks
    // and sky had - without this only tile rows 0..48 show and the shaded
    // flank + haze join never display. tileScale 0.5 maps 1:1.
    hills.setTileScale(0.5, 0.5)
    hills.setName('bgHills')

    // Landmark mid-layer: the per-stage silhouette strip (gorge, village,
    // riverbank, bridge, palisade, warships, inferno, flagship, arena).
    // In front of the hills, behind the ground; scrolls at 0.6x between the
    // hills' 0.4x and the ground's 1x. Geometry mirrors the hills anchor so
    // the strip roots into the ground with no seam.
    const marksKey = this.bakeLayer(`bg-marks-${stage.id}`, TILE_W, MARKS_H, (ctx) =>
      paintMarks(ctx, backdrop.marks),
    )
    const marks = this.add.tileSprite(0, groundTop - MARKS_H + MARKS_ROOT_DEPTH, stage.length + 64, MARKS_H, marksKey)
    marks.setOrigin(0, 0).setDepth(-12)
    // UIR-8 (V-11): the baked texture is RENDER_SCALE times the logical
    // tile, so tileScale 0.5 maps it 1:1 onto logical pixels. At the
    // default 1 the sprite shows only the texture's top half (tile rows
    // 0..32) - every hull, water band and banner below row 32 was cut,
    // which is why the warship hulls read as sunk. The paint period stays
    // 256px either way, so scrolling is unchanged.
    marks.setTileScale(0.5, 0.5)
    marks.setName('bgMarks')

    // Fire strip: embers and smoke for the burning stages, additive so the
    // sparks read as light. Drifted by sim tick in update, which keeps it
    // deterministic across renderers.
    if (backdrop.embers) {
      const emberKey = this.bakeLayer('bg-embers', TILE_W, EMBERS_H, paintEmbers)
      const embers = this.add.tileSprite(
        0,
        groundTop - EMBERS_H + MARKS_ROOT_DEPTH,
        stage.length + 64,
        EMBERS_H,
        emberKey,
      )
      // UIR-20 (V-19 remainder): same half-texture display the marks, sky
      // and hills had - without this only the sheet's top half displayed and
      // half the sparks never appeared. tileScale 0.5 maps it 1:1; the
      // tick-driven drift and additive blend are untouched.
      embers.setTileScale(0.5, 0.5)
      embers.setOrigin(0, 0).setDepth(-11).setBlendMode('ADD')
      embers.setName('bgEmbers')
    }

    // Bright ground strip under the walkable band.
    const groundKey = this.bakeLayer(`bg-ground-${stage.bgGround.toString(16)}`, TILE_W, GROUND_H, (ctx) =>
      paintGround(ctx, stage.bgGround),
    )
    const ground = this.add.tileSprite(0, groundTop, stage.length + 64, GROUND_H, groundKey)
    ground.setOrigin(0, 0).setDepth(-8) // in front of hills, behind actors
    // UIR-11 (V-13 ground part + V-19 ground part): same half-texture
    // display the marks, sky and hills had - without this only tile rows
    // 0..58 show. tileScale 0.5 maps the repaint 1:1.
    ground.setTileScale(0.5, 0.5)
    ground.setName('bgGround')

    ensureEntityTextures(this, stageArtKinds(this.sim))

    this.keyboardAdapter = new KeyboardAdapter(this)
    this.keyboard2Adapter = new KeyboardAdapter(this, PLAYER_TWO_KEYS)
    // Carry a co-op game across the stage break. Player two used to be dropped
    // at every transition and had to re-join each stage, losing their hero.
    if (data.char2Id) joinPlayer2(this.sim, data.char2Id)
    this.gamepadAdapter = new GamepadAdapter(0)
    // A second controller drives player two, so two people with two pads can
    // play. Without this the gamepad merged into player one only.
    this.gamepad2Adapter = new GamepadAdapter(1)
    // The on-screen controls are screen furniture, so the HUD draws and owns
    // them; this scene only reads and merges their input. Building them from
    // here used to put objects onto a display list the HUD was about to sweep,
    // which left them alive and interactive but never drawn. An adapter the HUD
    // has not mounted - a device with no touchscreen - reports neutral, so
    // desktop play and every screenshot the vision gate takes are unchanged.
    this.touchAdapter = this.hud.touch
    // The touch pause button writes through here: one shared toggle, owned by
    // this scene, no matter which input asked for it.
    this.touchAdapter.onPauseRequest = () => this.togglePause()
    const confirmContinue = (): void => {
      if (this.paused) return
      if (this.sim.phase === 'gameover' && this.continueMsLeft > 0) {
        if (tryRevivePlayer(this.sim)) this.hideContinueOverlay()
      }
    }
    this.input.keyboard?.on('keydown-ENTER', confirmContinue)
    // Gameplay pause from the P key. Repeats ignored, or holding P would
    // strobe the game. The touch pause button shares togglePause below.
    this.input.keyboard?.on('keydown-P', (event: KeyboardEvent) => {
      if (event.repeat) return
      this.togglePause()
    })
    // Start is the GAMEPAD pause toggle on EITHER pad (ENH-11, the third
    // input class to get pause parity) - and still the game-over revive it
    // always was, routed here rather than stacked as a second pad-0 watcher
    // (two watchers on one button could resume AND revive in a single poll).
    // While paused the toggle RESUMES first so no revive can leak through the
    // freeze. Menus own their own Start watchers and are unchanged.
    const startAction = (): void => {
      if (this.paused) {
        this.togglePause()
        return
      }
      if (this.sim.phase === 'gameover') {
        confirmContinue()
        return
      }
      this.togglePause()
    }
    const pollPadOneStart = watchConfirmButton(startAction, 0)
    const pollPadTwoStart = watchConfirmButton(startAction, 1)
    this.pollStartButton = () => {
      pollPadOneStart()
      pollPadTwoStart()
    }
    // A tap continues too. Without this a touch player who died simply could
    // not carry on: the overlay says CONTINUE? and nothing on a phone can
    // answer it. `confirmContinue` already no-ops outside the game-over phase,
    // so a tap during play - including on the on-screen controls - is inert.
    this.input.on('pointerdown', confirmContinue)
    audio.startMusic(GAME_THEME)
    this.events.once('shutdown', () => {
      audio.stopMusic()
      // Without this the HUD would keep drawing over the result screen.
      this.scene.stop('hud')
    })

    // Stage-entry banner.
    const stageNumber = Math.max(1, STAGE_ORDER.indexOf(this.sim.stage.id as (typeof STAGE_ORDER)[number]) + 1)
    this.hud.showBanner(
      `STAGE ${stageNumber}`,
      `${this.sim.stage.nameEn} · ${this.sim.stage.nameZh}`,
      0xc8a828,
    )

    // Juice: particle emitters (procedural fx textures from BootScene).
    this.sparkEmitter = this.add
      .particles(0, 0, 'fx:spark', {
        speed: { min: 40, max: 90 },
        lifespan: 180,
        gravityY: 200,
        emitting: false,
      })
      .setDepth(9000)
    this.koEmitter = this.add
      .particles(0, 0, 'fx:burst', {
        speed: { min: 60, max: 140 },
        lifespan: 350,
        gravityY: 200,
        emitting: false,
      })
      .setDepth(9000)
    this.dustEmitter = this.add
      .particles(0, 0, 'fx:dust', {
        speed: { min: 15, max: 40 },
        lifespan: 250,
        emitting: false,
      })
      .setDepth(9000)
  }

  update(_time: number, delta: number): void {
    // UIR-7 (V-9): a portrait phone shows the rotate overlay and gameplay
    // pauses behind it - no sim ticks while it is up.
    if (rotateBlocked()) return
    // Sample the pad once per FRAME, before any sim stepping: buttons are
    // edge-detected, and a frame can run zero or several steps, so polling
    // inside the step loop would miss or repeat a press.
    this.gamepadAdapter.poll()
    this.gamepad2Adapter.poll()
    this.touchAdapter.poll()
    this.pollStartButton()
    // Paused: adapters keep polling (so their edge state stays live) but every
    // buffered press is dropped and nothing steps - zero sim ticks, a frozen
    // countdown, no joins, no stage transitions until resume.
    if (this.paused) {
      this.clearInputBuffers()
      return
    }
    // Arcade drop-in: player two joins by pressing any of their own action
    // keys mid-stage. Nothing happens until they do, so a solo run is
    // completely unaffected.
    if (this.sim.player2Id === null && (this.keyboard2Adapter.wantsToJoin() || this.gamepad2Adapter.wantsToJoin())) {
      joinPlayer2(this.sim, secondPlayerCharacter(this.sim.charId))
    }
    this.pollRejoin()
    // A harness startGame() can arrive mid-stage (menu scenes consume these
    // too) - restart the stage with the requested character/seed/stage so the
    // bridge's startGame is deterministic from any scene.
    const pending = consumePendingStart(this.bridge)
    if (pending) {
      this.scene.start('game', { seed: pending.seed, charId: pending.charId, stageId: pending.stageId })
      return
    }
    // Stage-clear beat. Wall-clock like the continue countdown, but counted
    // HERE - below the pause gate - instead of in a time.delayedCall, which
    // fires straight through a pause and changed scenes under the overlay.
    if (this.clearMsLeft >= 0) {
      this.clearMsLeft -= delta
      if (this.clearMsLeft <= 0) {
        this.clearMsLeft = -1
        this.scene.start('result', {
          score: this.sim.stats.score,
          ticks: this.sim.tick,
          charId: this.sim.charId,
          lives: this.sim.lives,
          stageId: this.sim.stage.id,
          seed: this.sim.seed,
          totalTicks: this.runTotalTicks + this.sim.tick,
          char2Id: this.sim.char2Id,
        })
        return
      }
    }
    // Game-over phase: the sim freezes and the continue countdown runs on
    // wall-clock time (arcade style), independent of sim stepping.
    if (this.sim.phase === 'gameover') {
      this.bridge.pendingInputs.length = 0
      this.bridge.pendingSteps = 0
      if (this.continueMsLeft >= 0) {
        this.continueMsLeft -= delta
        if (this.continueMsLeft <= 0) {
          this.scene.start('gameover', { score: this.sim.stats.score })
          return
        }
      }
      for (const entity of this.sim.entities) {
        if (entity.state !== 'dying' || !heroArtResources(this)?.motions?.[entity.kind]) continue
        const clock = this.motionDefeat.get(entity.id) ?? { tick: entity.stateTick, remainder: 0 }
        clock.remainder += delta
        const steps = Math.floor(clock.remainder / TICK_MS)
        clock.remainder -= steps * TICK_MS
        clock.tick = Math.min(DYING_TICKS, clock.tick + steps)
        this.motionDefeat.set(entity.id, clock)
      }
      this.syncSprites()
      return
    }

    if (this.bridge.autopilot) {
      // Drain exact per-tick inputs first, then plain step() ticks fed by the
      // current input. Cap per frame so a huge queued batch can't stall rAF.
      let steps = 0
      while (steps < 600) {
        const queued = this.bridge.pendingInputs.shift()
        if (queued !== undefined) {
          // Player two's queue is drained in lockstep. It is normally empty,
          // and an empty queue yields undefined, which stepSim treats exactly
          // as "no second player input" - so solo harness runs are unchanged.
          stepSim(this.sim, queued, this.bridge.pendingInputs2.shift())
          steps += 1
          continue
        }
        if (this.bridge.pendingSteps > 0) {
          this.bridge.pendingSteps -= 1
          stepSim(this.sim, this.bridge.currentInput, this.bridge.pendingInputs2.shift())
          steps += 1
          continue
        }
        break
      }
      if (steps > 0) this.bridge.tick = this.sim.tick
    } else {
      this.accumulator += delta
      const steps = Math.min(Math.floor(this.accumulator / TICK_MS), MAX_CATCHUP_STEPS)
      this.accumulator -= steps * TICK_MS
      for (let i = 0; i < steps; i += 1) {
        const first = i === 0
        stepSim(
          this.sim,
          mergeInputs(
            this.keyboardAdapter.read(first),
            mergeInputs(this.gamepadAdapter.read(first), this.touchAdapter.read(first)),
          ),
          mergeInputs(this.keyboard2Adapter.read(first), this.gamepad2Adapter.read(first)),
        )
      }
    }
    const events = drainSimEvents(this.sim)
    this.juiceBudget = 6
    for (const event of events) {
      // Event -> sfx: counted on the bridge (the queue) whether or not the
      // audio device is unlocked yet.
      const sfx = sfxForEvent(event)
      if (sfx) {
        audio.play(sfx)
        this.bridge.sfxPlayed += 1
      }
      // Juice is real-play only: autopilot batches would spawn hundreds of
      // bursts per frame.
      if (!this.bridge.autopilot) this.applyJuice(event)
      // Boss-spawn warning banner: 1.2s, just long enough to read the name,
      // then hands the fight back before the first exchange. The crimson
      // flash answers the banner's red plaque (banner-kit red), real-play
      // only - autopilot keeps its deterministic frames.
      if (event.type === 'spawn' && event.kind === this.sim.stage.bossKind) {
        const bossDef = enemyByKind(event.kind)
        this.hud.showBanner('WARNING', `${bossDef.nameEn} ${bossDef.nameZh}`, 0xd33a3a, 1_200, true)
        if (!this.bridge.autopilot) this.cameras.main.flash(180, 178, 28, 28)
      }
      if (event.type === 'stageclear' && this.clearMsLeft < 0) {
        // Let the boss's fall play out, then show results: a 2s wall-clock
        // beat, frozen by pause (counted at the top of update).
        this.clearMsLeft = 2000
      }
      if (event.type === 'gameover') this.showContinueOverlay()
    }
    this.syncSprites()
    this.cameras.main.scrollX = this.sim.scrollX
    // Parallax the background hills at 0.4x camera speed; move the sun/clouds.
    const hills = this.children.getByName?.('bgHills') as Phaser.GameObjects.TileSprite | undefined
    if (hills) hills.tilePositionX = this.sim.scrollX * 0.4
    // Landmarks ride between hills and ground at 0.6x; embers ride with them
    // and rise by tick - both deterministic functions of the sim, so the two
    // renderers agree pixel for pixel.
    const marks = this.children.getByName?.('bgMarks') as Phaser.GameObjects.TileSprite | undefined
    if (marks) marks.tilePositionX = this.sim.scrollX * 0.6
    const embers = this.children.getByName?.('bgEmbers') as Phaser.GameObjects.TileSprite | undefined
    if (embers) {
      embers.tilePositionX = this.sim.scrollX * 0.6
      embers.tilePositionY = -((this.sim.tick * 0.25) % EMBERS_H)
    }
    if (this.cloudLayer) this.cloudLayer.setX(-this.sim.scrollX * 0.18)
  }

  /**
   * Size a sprite for its kind. Every pose is scaled by the SAME factor - the
   * one that makes the kind's idle frame the right height on screen - rather
   * than each pose being stretched to that height itself. Poses are not all
   * the same shape: `down` is a figure lying on the ground, wider than it is
   * tall, and forcing it to standing height blows it up into a smear several
   * times the size of the fighter it belongs to.
   */
  private fitSprite(sprite: Phaser.GameObjects.Sprite, kind: string): void {
    const motion = heroArtResources(this)?.motions?.[kind]
    if (motion && sprite.texture.key.includes(':motion:')) {
      // Motion boxes share a fixed art-unit scale; extra margins never resize
      // the fighter. Ground registration is inside the padded cell.
      sprite.setScale(1 / motion.density)
      sprite.setOrigin(0.5, motion.box.groundY / motion.box.height)
      return
    }
    sprite.setOrigin(0.5, 1)
    const isBoss = ENEMIES[kind]?.boss !== undefined
    const onScreenH = kind === 'horse' ? 70 : isBoss ? 124 : kind === 'crate' ? 52 : 92
    // An art-engine box is deliberately larger than the subject in it - margin
    // for a thrust weapon, headroom for a crest - so fitting the BOX to the
    // fighter's height would scale the margins in and leave the fighter short.
    // Props carry their own on-screen size: a dropped sword is not 92px tall.
    const standingH = artDisplayHeight(kind, onScreenH) ?? onScreenH
    const idleKey = isPropKind(kind) ? textureKeyFor(kind) : textureKeyForPose(kind, 'idle')
    const idleTex = this.textures.exists(idleKey) ? this.textures.get(idleKey).get() : sprite.texture.get()
    const scale = standingH / Math.max(1, idleTex.height)
    const tex = sprite.texture.get()
    sprite.setDisplaySize(Math.max(1, tex.width * scale), Math.max(1, tex.height * scale))
  }

  private syncSprites(): void {
    const seen = new Set<number>()
    for (const entity of this.sim.entities) {
      const defeat = entity.state === 'dying' && this.sim.phase === 'gameover' ? this.motionDefeat.get(entity.id) : undefined
      const renderEntity = defeat ? { ...entity, stateTick: defeat.tick } : entity
      if (entity.state !== 'dying') this.motionDefeat.delete(entity.id)
      seen.add(entity.id)
      let sprite = this.sprites.get(entity.id)
      if (!sprite) {
        // Belt and braces for the narrowed registration above: anything that
        // reaches the screen without art gets it here rather than rendering
        // blank. `ensureEntityTextures` is idempotent, so the cost is one map
        // lookup per spawn once a kind is known.
        if (!hasArtFor(this, entity.kind)) ensureEntityTextures(this, [entity.kind])
        sprite = this.add.sprite(entity.x, entity.y, textureKeyFor(entity.kind))
        sprite.setOrigin(0.5, 1)
        this.fitSprite(sprite, entity.kind)
        this.sprites.set(entity.id, sprite)
      }
      // Pose binding: combatants get a pose texture per state; props keep
      // their single static texture. The horse animates from its rider's
      // state while mounted (or runs when fleeing).
      if (!isPropKind(entity.kind)) {
        const pose =
          entity.kind === 'horse'
            ? horsePoseFor(entity, playerOf(this.sim))
            : poseForEntity(entity)
        const motionKey = ensureMotionKey(this, renderEntity)
        if (motionKey) {
          this.blendQ.delete(entity.id)
          this.lastPose.delete(entity.id)
          if (sprite.texture.key !== motionKey) {
            sprite.setTexture(motionKey)
            this.fitSprite(sprite, entity.kind)
          }
        } else {
          const key = textureKeyForPose(entity.kind, pose)
          const q = this.blendQ.get(entity.id)
          if (q && q.to !== pose) this.blendQ.delete(entity.id) // re-target mid-blend
          const blending = this.blendQ.has(entity.id)
          if (sprite.texture.key !== key && !blending) {
            // BODY-24 is retained only for the original renderer. Authored
            // motion frames above never visit this render-callback queue.
            const from = this.lastPose.get(entity.id)
            const steps =
              entity.kind !== 'horse' && entity.state !== 'dying' && from && from !== pose
                ? [
                    ensureBlendKey(this, entity.kind, from, pose, 1),
                    ensureBlendKey(this, entity.kind, from, pose, 2),
                  ].filter((k): k is string => k !== undefined)
                : []
            if (steps.length === 2) {
              this.blendQ.set(entity.id, { steps: [...steps, key], to: pose })
              sprite.setTexture(steps[0]!)
            } else {
              sprite.setTexture(key)
            }
            this.fitSprite(sprite, entity.kind)
            this.lastPose.set(entity.id, pose)
          } else if (blending) {
            const qq = this.blendQ.get(entity.id)!
            qq.steps.shift()
            const show = qq.steps[0] ?? key
            if (qq.steps.length <= 1) this.blendQ.delete(entity.id)
            if (sprite.texture.key !== show) {
              sprite.setTexture(show)
              this.fitSprite(sprite, entity.kind)
            }
          }
        }
      }
      // The rider sits on the horse: raised sprite offset while mounted.
      const riderLift = entity.mountedOn !== null ? 18 : 0
      sprite.setPosition(entity.x, entity.y - entity.z - riderLift - motionVisualLift(this, renderEntity))
      sprite.setDepth(entity.y)
      sprite.setFlipX(entity.facing === 'left')
      if (entity.state === 'hitstun') sprite.setTint(0xff6666)
      else if (entity.enraged) sprite.setTint(0xffa040)
      else sprite.clearTint()
      if (entity.state === 'dying') {
        sprite.setAlpha(Math.max(0, 1 - renderEntity.stateTick / DYING_TICKS))
      } else if (entity.state === 'dead' && heroArtResources(this)?.motions?.[entity.kind]) {
        // A completed defeat fade must not reappear at full alpha on dead.
        sprite.setAlpha(0)
      } else {
        // Mercy i-frames render as a blink.
        sprite.setAlpha(entity.invulnerableTicks > 0 ? 0.55 : 1)
      }

      // Ground shadow: stays on the floor plane, shrinks with jump height,
      // sized by kind (bosses are bigger).
      let shadow = this.shadows.get(entity.id)
      if (!shadow) {
        const isBoss = ENEMIES[entity.kind]?.boss !== undefined
        const [sw, sh] =
          entity.kind === 'horse' ? [34, 10] : isBoss ? [34, 9] : [26, 8]
        shadow = this.add.ellipse(entity.x, entity.y, sw, sh, 0x000000, 0.35)
        this.shadows.set(entity.id, shadow)
      }
      shadow.setPosition(entity.x, entity.y)
      shadow.setDepth(entity.y - 1)
      const shrink = 1 - Math.min(entity.z / 96, 0.4)
      shadow.setScale(shrink)
      shadow.setAlpha(entity.state === 'dying' || (entity.state === 'dead' && heroArtResources(this)?.motions?.[entity.kind]) ? sprite.alpha * 0.35 : 0.35)
      shadow.setVisible(!isPropKind(entity.kind))
    }
    for (const [id, sprite] of this.sprites) {
      if (!seen.has(id)) {
        sprite.destroy()
        this.sprites.delete(id)
        forgetMotionEntity(this, id)
        this.motionDefeat.delete(id)
        this.shadows.get(id)?.destroy()
        this.shadows.delete(id)
      }
    }
  }

  private showContinueOverlay(): void {
    this.continueMsLeft = 9000
  }

  private hideContinueOverlay(): void {
    this.continueMsLeft = -1
  }

  /**
   * Flip the pause flag. Shared by the P key and the touch pause button.
   * Clears on both edges: pausing drops anything buffered but unconsumed,
   * and resuming drops anything pressed since the last frozen frame cleared -
   * either one would otherwise fire on the next step.
   */
  private togglePause(): void {
    this.paused = !this.paused
    this.clearInputBuffers()
  }

  /** Drop all buffered action presses; the pause gate's no-leak guarantee. */
  private clearInputBuffers(): void {
    this.keyboardAdapter.clear()
    this.keyboard2Adapter.clear()
    this.gamepadAdapter.clear()
    this.gamepad2Adapter.clear()
    this.touchAdapter.clear()
  }

  /** Presentation-only effects driven by sim events (never in autopilot). */
  private applyJuice(event: SimEvent): void {    if (this.juiceBudget <= 0) return
    const cam = this.cameras.main
    switch (event.type) {
      case 'hit': {
        const target = this.sim.entities.find((e) => e.id === event.targetId)
        if (target) {
          this.sparkEmitter.explode(8, target.x, target.y - 20)
          this.juiceBudget -= 1
        }
        if (event.damage >= 12) cam.shake(80, 0.0035)
        break
      }
      case 'ko': {
        const downed = this.sim.entities.find((e) => e.id === event.id)
        if (downed) {
          this.koEmitter.explode(18, downed.x, downed.y - 24)
          this.juiceBudget -= 1
        }
        const isBoss = downed?.kind === this.sim.stage.bossKind
        cam.shake(isBoss ? 200 : 120, isBoss ? 0.006 : 0.005)
        break
      }
      case 'land': {
        const who = this.sim.entities.find((e) => e.id === event.id)
        if (who) {
          this.dustEmitter.explode(5, who.x, who.y)
          this.juiceBudget -= 1
        }
        break
      }
      case 'stageclear':
        cam.shake(200, 0.004)
        // Gold celebration wash. Real-play only like every other juice call:
        // autopilot never sees it, so harnesses and their screenshots agree.
        cam.flash(220, 255, 214, 130)
        break
      case 'enrage':
        cam.shake(150, 0.006)
        break
      default:
        break
    }
  }

  /**
   * Bake one backdrop layer to a tiling texture.
   *
   * Canvas-2D rather than Phaser Graphics, which is what lets these use real
   * gradients: a Graphics gradient is WebGL-only and silently draws nothing
   * under canvas, so the old painters had to work in flat bands to stay honest
   * between the two renderers. Baked to a texture, a gradient is a bitmap.
   */
  private bakeLayer(
    key: string,
    w: number,
    h: number,
    paint: (ctx: CanvasRenderingContext2D) => void,
  ): string {
    if (this.textures.exists(key)) return key
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * RENDER_SCALE)
    canvas.height = Math.round(h * RENDER_SCALE)
    const ctx = canvas.getContext('2d')
    if (!ctx) return key
    ctx.scale(RENDER_SCALE, RENDER_SCALE)
    paint(ctx)
    this.textures.addCanvas(key, canvas)
    return key
  }

  /**
   * A player who goes down while the other is still fighting spends a continue
   * and gets back up on their own action key. Without this a downed co-op
   * player was simply out for the rest of the stage - the run carried on
   * without them and their continues sat unspent, because the continue overlay
   * only appears once EVERYONE is down.
   */
  /** Bridge entry point: drop player two in from the harness. */
  joinSecondPlayer(charId?: string): boolean {
    if (this.sim.player2Id !== null) return false
    const id = charId ?? secondPlayerCharacter(this.sim.charId)
    return joinPlayer2(this.sim, id)
  }

  private pollRejoin(): void {
    // Runs during the continue countdown too. When the whole party is down,
    // the overlay's Enter/Start/tap revives player one; player two answering
    // on THEIR keys has to bring back player two, not player one.
    const counting = this.sim.phase === 'gameover' && this.continueMsLeft > 0
    if ((this.sim.phase !== 'fight' && !counting) || this.sim.lives <= 0) return
    const p1 = playerOf(this.sim)
    if (p1.state === 'dead' && this.keyboardAdapter.wantsToJoin()) {
      if (tryRevivePlayer(this.sim, p1.id) && counting) this.hideContinueOverlay()
      return
    }
    if (this.sim.player2Id === null) return
    const p2 = this.sim.entities.find((e) => e.id === this.sim.player2Id)
    if (p2?.state === 'dead' && (this.keyboard2Adapter.wantsToJoin() || this.gamepad2Adapter.wantsToJoin())) {
      if (tryRevivePlayer(this.sim, p2.id) && counting) this.hideContinueOverlay()
    }
  }

}

/** Horse animation: driven by the rider while mounted, runs when fleeing. */
function horsePoseFor(horse: Entity, player: Entity): Pose {
  if (player.mountedOn === horse.id) {
    return player.state === 'walk'
      ? Math.floor(player.stateTick / 10) % 2 === 0
        ? 'walk0'
        : 'walk1'
      : 'idle'
  }
  if (horse.state === 'fleeing') {
    return Math.floor(horse.stateTick / 6) % 2 === 0 ? 'walk0' : 'walk1'
  }
  return 'idle'
}
