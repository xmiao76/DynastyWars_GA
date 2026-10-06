import { expect, test } from '@playwright/test'
import type Phaser from 'phaser'
import { neutralInput } from '../src/core/types'
import { STAGE_ORDER } from '../src/core/stage'

/**
 * ART-19 look spec: all three stages captured with their landmark mid-layer,
 * plus the scene-side contract - the marks layer exists with the right
 * texture and rides the parallax (tilePositionX advances with the camera).
 * The intro card is dismissed through its tick rule first (40 neutral ticks)
 * so the captures show the backdrop, not the card.
 */

const LOOK = 'artifacts/look'

test('all three stages carry their landmark layer', async ({ page }) => {
  test.setTimeout(120_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')

  for (const stageId of STAGE_ORDER) {
    await page.evaluate((id) => window.__DW__?.startGame('zhaoyun', 42, id), stageId)
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.stageId))
      .toBe(stageId)
    // Dismiss the intro card via its tick rule and let the roll-up finish.
    await page.evaluate(
      (inputs) => window.__DW__?.run(inputs),
      Array.from({ length: 40 }, () => neutralInput()),
    )
    await page.waitForTimeout(350)

    const report = await page.evaluate((id) => {
      const game = window.__DW_GAME__
      const scene = game?.scene.getScene('game')
      // A TileSprite clones its pattern into an internal UUID-keyed texture
      // (every bg layer works this way), so the contract is: the LAYER exists
      // at the right depth, and the manager holds the baked key it was built
      // from - not `texture.key` equality.
      const marks = scene?.children.getByName('bgMarks') as Phaser.GameObjects.TileSprite | null
      return {
        marksBaked: game?.textures.exists(`bg-marks-${id}`) ?? false,
        marksDepth: marks?.depth ?? 0,
        marksTileX: marks?.tilePositionX ?? -1,
      }
    }, stageId)
    expect(report.marksBaked, `${stageId} landmark texture was not baked`).toBe(true)
    expect(report.marksDepth, `${stageId} has no landmark layer`).toBeGreaterThan(-15)
    expect(report.marksDepth).toBeLessThan(-8)
    await page.screenshot({ path: `${LOOK}/ui19-${stageId}.png` })
  }

  // Parallax: unlock the camera (the stage spawns locked, so walking right
  // alone would never move it), walk right, and the marks layer advances
  // with the camera at its 0.6x rate.
  await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('game') as unknown as {
      sim: { cameraLocked: boolean }
    }
    scene.sim.cameraLocked = false
  })
  const before = await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('game')
    return (scene?.children.getByName('bgMarks') as Phaser.GameObjects.TileSprite | null)?.tilePositionX ?? -1
  })
  await page.evaluate(
    (inputs) => window.__DW__?.run(inputs),
    Array.from({ length: 120 }, () => ({ ...neutralInput(), right: true })),
  )
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = window.__DW_GAME__?.scene.getScene('game')
        return (scene?.children.getByName('bgMarks') as Phaser.GameObjects.TileSprite | null)?.tilePositionX ?? -1
      }),
    )
    .toBeGreaterThan(before)
  expect(pageErrors).toEqual([])
})
