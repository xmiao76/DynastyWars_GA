import { expect, test } from '@playwright/test'
import { decideBotScript } from '../selfplay/bot'

// Game-feel: the combo counter must register chained hits (visible in the
// HUD as "n HITS"), and autopilot runs must spawn zero particles.
test('combo counter ticks up during bot combat; autopilot spawns no particles', async ({ page }) => {
  test.setTimeout(120_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')

  let maxCombo = 0
  for (let i = 0; i < 300; i += 1) {
    const snapshot = await page.evaluate(() => window.__DW__?.getSnapshot())
    if (!snapshot?.sim) continue
    maxCombo = Math.max(maxCombo, snapshot.sim.stats.comboHits)
    if (maxCombo >= 2) break
    const script = decideBotScript(snapshot)
    const tickBefore = snapshot.tick
    await page.evaluate((inputs) => window.__DW__?.run(inputs), script)
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().tick), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(tickBefore + script.length)
  }
  expect(maxCombo).toBeGreaterThanOrEqual(2)

  // Juice is gated off in autopilot: emitters exist but hold zero live
  // particles.
  const aliveParticles = await page.evaluate(() => {
    const game = window.__DW_GAME__
    const scene = game?.scene.getScene('game')
    if (!scene) return -1
    return scene.children.list
      .filter(
        (child): child is Phaser.GameObjects.Particles.ParticleEmitter =>
          child.type === 'ParticleEmitter',
      )
      .reduce((sum, emitter) => sum + emitter.getAliveParticleCount(), 0)
  })
  expect(aliveParticles).toBe(0)

  expect(pageErrors).toEqual([])
})
