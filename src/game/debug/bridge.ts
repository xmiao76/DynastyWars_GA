import { neutralInput, type InputState } from '../../core/types'
import { ensureEntityTextures } from '../adapters/sprites'
import { vectorKinds } from '../art/registry'
import type { Sim, SimSnapshot } from '../../core/sim'
import { snapshotSim, spawnBossNow, stepSim } from '../../core/sim'

/**
 * Debug bridge: the seam between the running game and automated drivers
 * (Playwright e2e tests and the self-play producer signal).
 *
 * The bridge exposes a read-only snapshot of game state and, in autopilot
 * mode (`?autopilot=1`), manual stepping: scenes stop advancing from rAF and
 * instead consume steps queued via `__DW__.step(n)`. This gives automated
 * runs exact, deterministic tick control over the identical code path used
 * in real play.
 */
export interface GameSnapshot {
  /** Key of the currently active scene, e.g. 'title' or 'game'. */
  scene: string
  /** Simulation ticks elapsed (sim ticks in game, bridge ticks otherwise). */
  tick: number
  /** Present only while a game scene is running. */
  sim: SimSnapshot | null
  /** Count of sound effects queued from sim events (asserts the audio
   * pipeline without touching the audio device). */
  sfxPlayed: number
  /** Audio mute state (M key). */
  muted: boolean
}

export interface PendingStart {
  charId: string
  seed: number
  stageId?: string
}

export interface DebugBridge {
  getSnapshot(): GameSnapshot
  /** Queue `n` manual ticks (autopilot mode only), fed the current input. */
  step(n: number): void
  /**
   * Queue one input per tick, applied in order (autopilot mode only).
   * Atomic per call: no other input can interleave between these ticks,
   * which is what makes scripted self-play runs exactly reproducible.
   */
  run(inputs: InputState[], inputs2?: InputState[]): void
  /** Set the input fed into every subsequent step() tick. */
  setInputs(input: InputState): void
  /** Request a scene transition into the game with a fixed character + seed. */
  startGame(charId: string, seed: number, stageId?: string): void
  /**
   * Step the sim n times synchronously with the current input and return the
   * wall-clock milliseconds elapsed. Perf probe; -1 when no sim is running.
   */
  bench(n: number): number
  /**
   * Register art for EVERY kind in the registry, not just the ones the running
   * stage can spawn.
   *
   * The visual sprite gate reads the live texture manager, so it can only
   * assess what has been generated. GameScene narrowed generation to the
   * stage's own spawn table to cut texture memory, and that silently halved the
   * gate's coverage - 148 sprites to 76 - without anything going red. This
   * exists so the gate can still see the whole cast.
   */
  registerAllArt(): number
  /** Force the stage boss to spawn immediately (visual-harness aid). */
  /** Drop player two into the running stage (co-op). Returns false if they
   * are already in, or no stage is running. */
  joinP2(charId?: string): boolean
  forceBoss(): void
  /** Jump straight to the result scene with the current score (visual aid). */
  forceResult(): void
  /** Jump straight to the game-over scene with the current score (visual aid). */
  forceGameOver(): void
}

/** Mutable shared state behind the bridge; updated by the active scene. */
export interface BridgeState {
  scene: string
  tick: number
  /** Ticks queued via __DW__.step, drained by the active scene's update. */
  pendingSteps: number
  /** Per-tick inputs queued via __DW__.run, drained in order. */
  pendingInputs: InputState[]
  /** Player two's queued inputs, so the harness can drive a co-op run. */
  pendingInputs2: InputState[]
  autopilot: boolean
  /** Latest harness-provided input, consumed by step() ticks. */
  currentInput: InputState
  /** Set via __DW__.startGame; the title scene consumes it. */
  pendingStart: PendingStart | null
  /** The running sim, while the game scene is active. */
  sim: Sim | null
  /** Cumulative count of sfx queued by the game scene. */
  sfxPlayed: number
  /** Mirror of the audio player's mute flag. */
  muted: boolean
}

declare global {
  interface Window {
    __DW__?: DebugBridge
  }
}

export function installBridge(state: BridgeState): void {
  window.__DW__ = {
    getSnapshot: () => ({
      scene: state.scene,
      tick: state.sim ? state.sim.tick : state.tick,
      sim: state.sim ? snapshotSim(state.sim) : null,
      sfxPlayed: state.sfxPlayed,
      muted: state.muted,
    }),
    step: (n: number) => {
      state.pendingSteps += n
    },
    run: (inputs: InputState[], inputs2?: InputState[]) => {
      state.pendingInputs.push(...inputs.map((i) => ({ ...i })))
      // Player two's stream is queued alongside, one entry per tick. Without
      // it the autopilot could only ever drive one player, so the logic signal
      // was structurally unable to exercise co-op at all.
      if (inputs2) state.pendingInputs2.push(...inputs2.map((i) => ({ ...i })))
    },
    joinP2: (charId?: string) => {
      const sim = state.sim
      const scene = window.__DW_GAME__?.scene.getScene('game') as unknown as
        | { joinSecondPlayer?: (id?: string) => boolean }
        | undefined
      if (!sim || !scene?.joinSecondPlayer) return false
      return scene.joinSecondPlayer(charId)
    },
    setInputs: (input: InputState) => {
      state.currentInput = { ...input }
    },
    startGame: (charId: string, seed: number, stageId?: string) => {
      state.pendingStart = { charId, seed, stageId }
    },
    bench: (n: number) => {
      if (!state.sim) return -1
      const sim = state.sim
      const t0 = performance.now()
      for (let i = 0; i < n; i += 1) stepSim(sim, state.currentInput)
      return performance.now() - t0
    },
    registerAllArt: (): number => {
      const scene = window.__DW_GAME__?.scene.getScene('game')
      if (!scene) return 0
      ensureEntityTextures(scene, vectorKinds())
      return scene.textures.getTextureKeys().filter((k) => k.startsWith('entity:')).length
    },
    forceBoss: () => {
      if (state.sim) spawnBossNow(state.sim)
    },
    forceResult: () => {
      const scene = window.__DW_GAME__?.scene.getScene('game')
      if (scene) {
        const sim = state.sim
        scene.scene.start('result', {
          score: sim?.stats.score ?? 0,
          ticks: sim?.tick ?? 0,
          charId: sim?.charId ?? 'zhaoyun',
          lives: sim?.lives ?? 3,
          stageId: sim?.stage.id ?? 'stage1',
          seed: sim?.seed ?? 42,
          totalTicks: sim?.tick ?? 0,
          // Mirror the real stage-clear payload, or the harness would exercise
          // a transition that silently differs from the one players take.
          char2Id: sim?.char2Id ?? null,
        })
      }
    },
    forceGameOver: () => {
      const scene = window.__DW_GAME__?.scene.getScene('game')
      if (scene) scene.scene.start('gameover', { score: state.sim?.stats.score ?? 0 })
    },
  }
}

export function initialBridgeState(autopilot: boolean): BridgeState {
  return {
    scene: 'boot',
    tick: 0,
    pendingSteps: 0,
    pendingInputs: [],
    pendingInputs2: [],
    autopilot,
    currentInput: neutralInput(),
    pendingStart: null,
    sim: null,
    sfxPlayed: 0,
    muted: false,
  }
}

/**
 * Consume a pending startGame request, if any. Menu scenes call this each
 * frame; the harness uses it to jump straight into a seeded game.
 */
export function consumePendingStart(state: BridgeState): PendingStart | null {
  const pending = state.pendingStart
  state.pendingStart = null
  return pending
}
