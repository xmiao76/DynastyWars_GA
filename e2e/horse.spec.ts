import { expect, test } from '@playwright/test'
import { neutralInput } from '../src/core/types'

// Horseback: stage 2 starts with a horse at x=200; walking right into it
// must mount (snapshot mounted=true, horseHp visible, faster movement).
test('player mounts the stage-2 horse by walking into it', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage2'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')

  // Walk right into the horse.
  for (let i = 0; i < 10; i += 1) {
    const mounted = await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.mounted)
    if (mounted) break
    const tickBefore = (await page.evaluate(() => window.__DW__?.getSnapshot().tick)) ?? 0
    await page.evaluate(
      (inputs) => window.__DW__?.run(inputs),
      Array.from({ length: 12 }, () => ({ ...neutralInput(), right: true })),
    )
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().tick), { timeout: 5000 })
      .toBeGreaterThanOrEqual(tickBefore + 12)
  }

  const snap = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  expect(snap?.player.mounted).toBe(true)
  expect(snap?.player.horseHp).toBe(20)

  // Mounted speed check: 60 ticks right must cover more than the on-foot max.
  const x0 = snap?.player.x ?? 0
  const tickBefore = snap?.tick ?? 0
  await page.evaluate(
    (inputs) => window.__DW__?.run(inputs),
    Array.from({ length: 60 }, () => ({ ...neutralInput(), right: true })),
  )
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().tick), { timeout: 5000 })
    .toBeGreaterThanOrEqual(tickBefore + 60)
  const x1 = await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.x ?? 0)
  expect(x1 - x0).toBeGreaterThan(1.6 * 60)

  expect(pageErrors).toEqual([])
})
