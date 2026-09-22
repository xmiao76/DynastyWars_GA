import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

/**
 * ENH-7: P pauses stage gameplay (co-op included) and resumes tick-neutrally.
 *
 * Deliberately NOT autopilot: pause is real-play input, and the pins count
 * real wall-clock animation frames against frozen sim ticks.
 */

async function startStage(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/?renderer=canvas')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
}

async function joinCoop(page: import('@playwright/test').Page): Promise<void> {
  await page.keyboard.press('f')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.char2Id), { timeout: 5_000 })
    .not.toBeNull()
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

async function simSnapshot(page: import('@playwright/test').Page) {
  const sim = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  expect(sim).not.toBeNull()
  if (!sim) throw new Error('no sim snapshot')
  return sim
}

/**
 * Count near-gold pixels in a screenshot band. The 1280x720 capture is the
 * 960x540 canvas FIT-scaled by exactly 4/3, so logical (x, y) lands on device
 * (x*8/3, y*8/3): the PAUSED caption at logical (240, 120) centres on device
 * (640, 320). Calibrated: 2707 in the paused band vs 0 unpaused/resumed.
 */
function goldInBand(file: string, x0: number, x1: number, y0: number, y1: number): number {
  const png = PNG.sync.read(fs.readFileSync(file))
  let gold = 0
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * png.width + x) * 4
      if ((png.data[i] ?? 0) > 200 && (png.data[i + 1] ?? 0) > 150 && (png.data[i + 2] ?? 0) < 130) gold += 1
    }
  }
  return gold
}

/** Mean frame luma (0-255) of a screenshot file. */
function meanLuma(file: string): number {
  const png = PNG.sync.read(fs.readFileSync(file))
  let sum = 0
  for (let i = 0; i < png.data.length; i += 4) {
    sum += ((png.data[i] ?? 0) + (png.data[i + 1] ?? 0) + (png.data[i + 2] ?? 0)) / 3
  }
  return sum / (png.width * png.height)
}

test('P freezes both players for 120 wall frames and resumes', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await startStage(page)
  await joinCoop(page)
  // Let the fight get underway so the freeze pins a live game, not tick 0.
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.tick ?? 0)).toBeGreaterThan(30)

  await page.keyboard.press('p')
  const frozen = await simSnapshot(page)
  expect(frozen.tick).toBeGreaterThan(0)
  expect(frozen.player2, 'co-op partner must be in before the freeze').not.toBeNull()
  await waitFrames(page, 120)
  const still = await simSnapshot(page)
  // Zero ticks AND zero drift anywhere in the read model: positions, hp,
  // states, waves, scroll, stats. No steps ran, so every read is identical.
  expect(still.tick).toBe(frozen.tick)
  expect(still).toEqual(frozen)

  await page.keyboard.press('p')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.tick ?? 0), { timeout: 5_000 })
    .toBeGreaterThan(still.tick)
  const resumed = await simSnapshot(page)
  expect(resumed.tick).toBeGreaterThan(still.tick)
  expect(resumed.player2, 'resume must not drop the co-op partner').not.toBeNull()
  expect(pageErrors).toEqual([])
})

test('no buffered press leaks through on resume, and pause blocks joins', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await startStage(page)
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.tick ?? 0)).toBeGreaterThan(30)

  await page.keyboard.press('p')
  const frozenTick = (await simSnapshot(page)).tick
  // Mash every buffered input while paused: P1 attack/jump/special plus the
  // P2 join key on a solo run.
  await page.keyboard.press('z')
  await page.keyboard.press('x')
  await page.keyboard.press('c')
  await page.keyboard.press('f')
  await waitFrames(page, 30)
  expect((await simSnapshot(page)).tick).toBe(frozenTick)
  expect(await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player2)).toBeNull()

  await page.keyboard.press('p')
  // An attack lasts ~10+ ticks and a jump far longer; sampling across a full
  // second cannot miss one if a buffered press leaked onto the first step.
  const inputStates = new Set(['attack', 'jump', 'jumpattack', 'special'])
  for (let i = 0; i < 10; i += 1) {
    await page.waitForTimeout(100)
    const state = await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.state)
    expect(inputStates.has(state ?? ''), `leaked press fired ${state} after resume`).toBe(false)
  }
  expect(await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player2)).toBeNull()
  expect(await page.evaluate(() => window.__DW__?.getSnapshot().sim?.char2Id)).toBeNull()
  expect(pageErrors).toEqual([])
})

test('pause overlay dims the frame and clears on resume', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await startStage(page)
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.tick ?? 0)).toBeGreaterThan(60)

  const dir = path.join(process.cwd(), 'artifacts/pause')
  fs.mkdirSync(dir, { recursive: true })
  const unpausedFile = path.join(dir, 'unpaused.png')
  const pausedFile = path.join(dir, 'paused.png')
  const resumedFile = path.join(dir, 'resumed.png')
  await page.screenshot({ path: unpausedFile })
  const lit = meanLuma(unpausedFile)
  // Guards a vacuous pass: the dim assertion means nothing on a black frame.
  expect(lit, 'unpaused frame must actually render').toBeGreaterThan(20)

  await page.keyboard.press('p')
  await waitFrames(page, 30)
  await page.screenshot({ path: pausedFile })
  const dimmed = meanLuma(pausedFile)
  expect(dimmed, 'pause overlay must visibly dim the frame').toBeLessThan(lit * 0.85)
  expect(
    goldInBand(pausedFile, 560, 720, 300, 340),
    'PAUSED caption must render in gold over the dimmed frame',
  ).toBeGreaterThan(500)

  await page.keyboard.press('p')
  await waitFrames(page, 30)
  await page.screenshot({ path: resumedFile })
  const relit = meanLuma(resumedFile)
  expect(relit, 'resumed frame must undim').toBeGreaterThan(dimmed * 1.1)
  expect(Math.abs(relit - lit) / lit, 'resumed frame must match live brightness').toBeLessThan(0.15)
  expect(pageErrors).toEqual([])
})
