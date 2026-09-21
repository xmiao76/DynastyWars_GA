import { expect, test } from '@playwright/test'
import type Phaser from 'phaser'

// The redesigned title screen must show hero figures (baked sprites) and the
// painted design - the visible "before vs after" check the owner asked about.
test('title screen shows hero figures and the painted design', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  await page.goto('/?renderer=canvas')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')

  // Baked art loads in the background; wait for the hero figures to appear.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const game = window.__DW_GAME__
          const scene = game?.scene.getScene('title')
          if (!scene) return -1
          return scene.children.list.filter(
            (child) =>
              child.type === 'Sprite' &&
              (child as Phaser.GameObjects.Sprite).texture.key.startsWith('entity:'),
          ).length
        }),
      { timeout: 10_000 },
    )
    .toBeGreaterThanOrEqual(5)

  expect(pageErrors).toEqual([])
})
