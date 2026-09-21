import { expect, test } from '@playwright/test'

// Audio pipeline: after the Enter gesture, game actions queue sfx through
// the sim event stream (asserted via the bridge counter, not the device).
test('sfx queue fills on combat actions after the Enter gesture', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  await page.goto('/?renderer=canvas')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')

  await page.keyboard.press('Enter') // title -> select, unlocks audio
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('select')
  await page.keyboard.press('Enter') // select -> game
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')

  const before = await page.evaluate(() => window.__DW__?.getSnapshot().sfxPlayed ?? 0)
  await page.keyboard.press('z') // swing

  // Wait for the STATE the next press needs, not for a duration.
  //
  // A jump is refused unless the player is idle or walking, so this has to
  // happen after the swing has finished - and sim ticks advance with FRAMES,
  // so a wall-clock wait buys however many ticks the machine felt like giving
  // it. This was `waitForTimeout(500)`, and it failed under three parallel
  // workers. Measured with the CPU throttled to reproduce that starvation:
  // 500ms bought 57 ticks unthrottled, 9 ticks at 10x and 4 ticks at 20x, and
  // at both throttled rates the player was still in `attack` when the jump was
  // pressed, so the jump was refused and one sfx fired where the test wants
  // two. Polling for the state passes at every rate.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = window.__DW__?.getSnapshot().sim?.player.state
        return state === 'idle' || state === 'walk'
      }),
    )
    .toBe(true)

  await page.keyboard.press('x') // jump
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sfxPlayed ?? 0))
    .toBeGreaterThanOrEqual(before + 2)

  // Mute toggle flips and restores via M.
  await page.keyboard.press('m')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().muted)).toBe(true)
  await page.keyboard.press('m')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().muted)).toBe(false)

  expect(pageErrors).toEqual([])
})
