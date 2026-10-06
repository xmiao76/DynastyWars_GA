import { expect, test } from '@playwright/test'

/**
 * Scene restarts must not accumulate scene-event listeners.
 *
 * Phaser reuses a scene INSTANCE across restarts and its event emitter survives
 * a shutdown, so anything that subscribes in `create` without unsubscribing on
 * shutdown adds another listener every single time that scene starts. That is
 * how `useCrispText` was first written, and after six stage cycles `game`,
 * `hud` and `result` each carried six copies: every object added did six times
 * the work and every label re-rendered its canvas six times.
 *
 * It is worth a test rather than a one-off check because of how it fails. It
 * never throws and nothing looks wrong - the game just gets slower the longer
 * it is played, and the only thing that went red was the visual suite running
 * out of time, which reads like flake. A player would have felt it as a run
 * that degrades over three stages.
 *
 * `addedtoscene` is the specific listener that bit us; the assertion is written
 * against the general property, so any future subscribe-without-unsubscribe in
 * a scene's `create` is caught by the same test.
 */

const CYCLES = 6
const WATCHED_SCENES = ['title', 'game', 'hud', 'result'] as const

test('restarting scenes does not accumulate event listeners', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')

  const listenerCounts = (): Promise<Record<string, number>> =>
    page.evaluate((keys) => {
      const game = window.__DW_GAME__
      const out: Record<string, number> = {}
      for (const key of keys) {
        const scene = game?.scene.getScene(key)
        out[key] = scene ? scene.events.listenerCount('addedtoscene') : -1
      }
      return out
    }, WATCHED_SCENES as unknown as string[])

  for (let i = 0; i < CYCLES; i += 1) {
    await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
    await page.evaluate(() => window.__DW__?.forceResult())
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('result')
  }

  const counts = await listenerCounts()
  // At most one: the scene that is currently running holds its own listener,
  // and every scene that has shut down must have given its listener back.
  for (const [key, n] of Object.entries(counts)) {
    expect(n, `${key} kept ${n} 'addedtoscene' listeners after ${CYCLES} restarts`).toBeLessThanOrEqual(1)
  }
  expect(pageErrors).toEqual([])
})
