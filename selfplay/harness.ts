import { expect, type Page } from '@playwright/test'
import { neutralInput } from '../src/core/types'
import { decideBotScript } from './bot'
import { checkInvariants, type Violation } from './invariants'

/** Outcome of one self-play stage run. */
export interface SelfplayResult {
  hero: string
  stageId: string
  cleared: boolean
  /** Lives spent on deaths followed by a continue. */
  continuesUsed: number
  ticksElapsed: number
  finalPlayerHp: number
  /** Sfx queued from sim events over the whole run (audio pipeline probe). */
  sfxPlayed: number
  /** Wall-clock ms per 1000 sim ticks (perf probe). -1 if not measured. */
  msPerKTick: number
  stats: { foodEaten: number; specialsUsed: number; score: number }
  violations: Violation[]
  pageErrors: string[]
}

export async function bootGame(page: Page, hero: string, seed: number, stageId?: string): Promise<string[]> {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
  await page.evaluate(
    ({ hero, seed, stageId }) => window.__DW__?.startGame(hero, seed, stageId),
    { hero, seed, stageId },
  )
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')
  return pageErrors
}

/**
 * Drive the greedy bot through the CURRENT game scene until stage clear,
 * death, or budget exhaustion. Assumes the game scene is already active.
 */
export async function driveCurrentStage(
  page: Page,
  hero: string,
  pageErrors: string[],
  maxIterations = 800,
): Promise<SelfplayResult> {
  const violations: Violation[] = []
  let cleared = false
  let stageId = 'unknown'
  let lastWaveIndex = 0
  let ticksElapsed = 0
  let finalPlayerHp = 0
  let stats = { foodEaten: 0, specialsUsed: 0, score: 0 }
  let continuesUsed = 0
  let sfxPlayed = 0
  const wallStart = Date.now()
  const tickStart = await page.evaluate(() => window.__DW__?.getSnapshot().tick ?? 0)

  for (let i = 0; i < maxIterations && !cleared && violations.length === 0; i += 1) {
    const snapshot = await page.evaluate(() => window.__DW__?.getSnapshot())
    if (!snapshot) {
      violations.push({ check: 'bridge', detail: 'debug bridge missing from window' })
      break
    }
    violations.push(...checkInvariants(snapshot))
    sfxPlayed = snapshot.sfxPlayed

    const sim = snapshot.sim
    if (sim) {
      stageId = sim.stageId
      if (sim.waveIndex < lastWaveIndex) {
        violations.push({
          check: 'wave-monotonic',
          detail: `waveIndex went ${lastWaveIndex} -> ${sim.waveIndex}`,
        })
      }
      lastWaveIndex = Math.max(lastWaveIndex, sim.waveIndex)
      stats = sim.stats
      if (sim.phase === 'clear') {
        cleared = true
        ticksElapsed = sim.tick
        finalPlayerHp = sim.player.hp
        break
      }
      if (sim.phase === 'gameover') {
        // Arcade credits: spend a life and continue. Only running out of
        // lives is a player-survives failure.
        if (sim.lives > 0) {
          continuesUsed += 1
          await page.keyboard.press('Enter')
          await expect
            .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.phase), {
              timeout: 5000,
            })
            .toBe('fight')
          continue
        }
        violations.push({
          check: 'player-survives',
          detail: `${hero} ran out of lives on ${sim.stageId} wave ${sim.waveIndex + 1} at tick ${sim.tick}`,
        })
        break
      }
    }

    const script = decideBotScript(snapshot)
    const tickBefore = snapshot.tick
    await page.evaluate((inputs) => window.__DW__?.run(inputs), script)
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().tick), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(tickBefore + script.length)
  }

  const lastTick = await page.evaluate(() => window.__DW__?.getSnapshot().tick ?? 0)
  const msPerKTick = ticksElapsed > 0 ? ((Date.now() - wallStart) / Math.max(1, lastTick - tickStart)) * 1000 : -1
  return {
    hero,
    stageId,
    cleared,
    continuesUsed,
    ticksElapsed,
    finalPlayerHp,
    sfxPlayed,
    msPerKTick: Math.round(msPerKTick),
    stats,
    violations,
    pageErrors,
  }
}

/** Boot and clear a single stage (the canonical probe). */
export async function driveStageClear(
  page: Page,
  hero: string,
  seed: number,
  maxIterations = 800,
): Promise<SelfplayResult> {
  const pageErrors = await bootGame(page, hero, seed)
  return driveCurrentStage(page, hero, pageErrors, maxIterations)
}

export interface MarathonResult {
  hero: string
  completed: boolean
  stages: SelfplayResult[]
  pageErrors: string[]
}

/**
 * Marathon: clear `stageCount` stages back to back. Between stages the run
 * goes through the result scene (real Enter keypress), so progression and
 * carry-over are exercised too.
 */
export async function driveMarathon(
  page: Page,
  hero: string,
  seed: number,
  stageCount: number,
): Promise<MarathonResult> {
  const pageErrors = await bootGame(page, hero, seed)
  const stages: SelfplayResult[] = []
  let completed = true

  for (let stageIndex = 0; stageIndex < stageCount; stageIndex += 1) {
    const result = await driveCurrentStage(page, hero, pageErrors)
    stages.push(result)
    if (!result.cleared) {
      completed = false
      break
    }
    if (stageIndex < stageCount - 1) {
      // Result scene after the celebration, then Enter to the next stage.
      await expect
        .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 10_000 })
        .toBe('result')
      await page.keyboard.press('Enter')
      await expect
        .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 10_000 })
        .toBe('game')
    }
  }

  return { hero, completed, stages, pageErrors }
}

/** Drive an idle (never-acting) player until death. Proves the death path. */
export async function driveIdleToGameover(
  page: Page,
  hero: string,
  seed: number,
  maxIterations = 100,
): Promise<{ gameover: boolean; ticksElapsed: number; pageErrors: string[] }> {
  const pageErrors = await bootGame(page, hero, seed)
  for (let i = 0; i < maxIterations; i += 1) {
    const snapshot = await page.evaluate(() => window.__DW__?.getSnapshot())
    if (snapshot?.sim?.phase === 'gameover') {
      return { gameover: true, ticksElapsed: snapshot.sim.tick, pageErrors }
    }
    const tickBefore = snapshot?.tick ?? 0
    await page.evaluate(
      (inputs) => window.__DW__?.run(inputs),
      Array.from({ length: 60 }, () => neutralInput()),
    )
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().tick), { timeout: 5000 })
      .toBeGreaterThanOrEqual(tickBefore + 60)
  }
  const last = await page.evaluate(() => window.__DW__?.getSnapshot())
  return {
    gameover: last?.sim?.phase === 'gameover',
    ticksElapsed: last?.sim?.tick ?? 0,
    pageErrors,
  }
}
