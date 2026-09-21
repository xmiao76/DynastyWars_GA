import { expect, test } from '@playwright/test'
import { decideBotScript } from '../selfplay/bot'

// Stage 3 boots and plays via the bridge: the bot fights through the first
// wave of Xinye-era enemies on the White River Bank.
test('stage 3 boots and the bot fights wave 1', async ({ page }) => {
  test.setTimeout(120_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage3'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.stageId))
    .toBe('stage3')

  // Drive the bot until wave 1 is cleared.
  let waveCleared = false
  for (let i = 0; i < 200 && !waveCleared; i += 1) {
    const snapshot = await page.evaluate(() => window.__DW__?.getSnapshot())
    if (!snapshot?.sim) continue
    if (snapshot.sim.waveIndex >= 1) {
      waveCleared = true
      break
    }
    const script = decideBotScript(snapshot)
    const tickBefore = snapshot.tick
    await page.evaluate((inputs) => window.__DW__?.run(inputs), script)
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().tick), { timeout: 5000 })
      .toBeGreaterThanOrEqual(tickBefore + script.length)
  }
  expect(waveCleared).toBe(true)
  expect(pageErrors).toEqual([])
})
