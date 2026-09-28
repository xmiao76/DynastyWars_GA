import { devices, expect, test } from '@playwright/test'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../src/core/constants'

/**
 * ENH-8: the touch pause button. A phone has no P key, so the on-screen
 * pause control is its only way to stop the clock.
 *
 * Real play under Pixel 7 emulation, not autopilot: the freeze pin needs
 * wall-clock ticks advancing until the tap lands.
 */

test.use({ ...devices['Pixel 7 landscape'] })

async function tapGamePoint(
  page: import('@playwright/test').Page,
  gx: number,
  gy: number,
): Promise<{ x: number; y: number }> {
  const box = await page.evaluate(() => {
    const r = window.__DW_GAME__!.canvas.getBoundingClientRect()
    return { left: r.left, top: r.top, width: r.width, height: r.height }
  })
  return {
    x: Math.round(box.left + (gx / SCREEN_WIDTH) * box.width),
    y: Math.round(box.top + (gy / SCREEN_HEIGHT) * box.height),
  }
}

/** Resolve after n wall-clock animation frames have actually elapsed. */
async function waitFrames(page: import('@playwright/test').Page, n: number): Promise<void> {
  await page.evaluate(
    (count) =>
      new Promise<void>((resolve) => {
        let left = count
        const tick = (): void => {
          left -= 1
          if (left <= 0) resolve()
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }),
    n,
  )
}

/**
 * Logical centre of the pause zone, asked of the scene rather than
 * hard-coded - the point silently stops being the button the moment the
 * controls are relaid out.
 */
async function pauseZonePoint(page: import('@playwright/test').Page): Promise<{ x: number; y: number } | null> {
  return page.evaluate(() => {
    const hud = window.__DW_GAME__?.scene.getScene('hud')
    const zone = hud?.children.list.find((c) => c.name === 'touchPause') as unknown as
      | { x: number; y: number }
      | undefined
    return zone ? { x: zone.x, y: zone.y } : null
  })
}

async function pausedCaptionVisible(page: import('@playwright/test').Page): Promise<boolean> {
  return page.evaluate(() => {
    const hud = window.__DW_GAME__?.scene.getScene('hud')
    const caption = hud?.children.list.find(
      (c) => c.type === 'Text' && (c as unknown as { text: string }).text === 'PAUSED',
    ) as unknown as { visible?: boolean } | undefined
    return caption?.visible ?? false
  })
}

async function simSnapshot(page: import('@playwright/test').Page) {
  const sim = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  expect(sim).not.toBeNull()
  if (!sim) throw new Error('no sim snapshot')
  return sim
}

test('touch pause button freezes and resumes the game', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await page.goto('/?renderer=canvas')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.tick ?? 0))
    .toBeGreaterThan(30)

  const zone = await pauseZonePoint(page)
  expect(zone, 'pause zone is not mounted on the HUD display list').not.toBeNull()
  const tap = await tapGamePoint(page, zone?.x ?? 0, zone?.y ?? 0)

  await page.touchscreen.tap(tap.x, tap.y)
  await expect
    .poll(() => pausedCaptionVisible(page), { timeout: 5_000 })
    .toBe(true)
  const frozen = await simSnapshot(page)
  expect(frozen.tick).toBeGreaterThan(0)
  await waitFrames(page, 60)
  const still = await simSnapshot(page)
  expect(still.tick).toBe(frozen.tick)
  expect(still).toEqual(frozen)

  await page.screenshot({ path: 'artifacts/pause/touch-paused.png' })

  await page.touchscreen.tap(tap.x, tap.y)
  await expect
    .poll(() => pausedCaptionVisible(page), { timeout: 5_000 })
    .toBe(false)
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.tick ?? 0), { timeout: 5_000 })
    .toBeGreaterThan(still.tick)
  expect(pageErrors).toEqual([])
})
