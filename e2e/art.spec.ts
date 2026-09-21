import { expect, test } from '@playwright/test'
import { PNG } from 'pngjs'
import type Phaser from 'phaser'

/**
 * The baked-art pipeline: a manifest-covered kind loads its PNG under the
 * existing texture key, and anything the manifest does not cover falls back to
 * the pixel-map art.
 *
 * The art is served from the test rather than shipped in `public/`. The
 * stand-in PNGs that used to live there were axis-aligned boxes, and because
 * BootScene loads manifest art over the same keys they silently shadowed the
 * hand-authored pixel art for every kind in the game. A fixture keeps the
 * override path covered without letting placeholder art back into the build.
 */

const FRAME_W = 40
const FRAME_H = 60

function fixturePng(width: number, height: number): Buffer {
  const png = new PNG({ width, height })
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 200
    png.data[i + 1] = 40
    png.data[i + 2] = 180
    png.data[i + 3] = 255
  }
  return PNG.sync.write(png)
}

async function serveFixtureArt(page: import('@playwright/test').Page): Promise<void> {
  const poses = ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down']
  await page.route('**/assets/manifest.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sprites: { zhaoyun: poses }, portraits: [] }),
    }),
  )
  await page.route('**/assets/sprites/zhaoyun/*.png', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: fixturePng(FRAME_W, FRAME_H) }),
  )
}

async function textureSize(
  page: import('@playwright/test').Page,
  key: string,
): Promise<{ width: number; height: number }> {
  return page.evaluate((textureKey) => {
    const game = window.__DW_GAME__ as Phaser.Game | undefined
    if (!game) return { width: -1, height: -1 }
    const frame = game.textures.get(textureKey).get()
    return { width: frame.width as number, height: frame.height as number }
  }, key)
}

test('manifest-covered kinds load baked art; uncovered kinds keep the pixel art', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await serveFixtureArt(page)

  // ?bakedart=1 makes this build look for a manifest at all; no shipping
  // build does, so that a manifest stranded in a cache cannot resurrect
  // placeholder art.
  await page.goto('/?renderer=canvas&autopilot=1&bakedart=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')

  // Covered: the baked frame box wins over the pixel map.
  await expect
    .poll(() => textureSize(page, 'entity:zhaoyun:idle'), { timeout: 10_000 })
    .toEqual({ width: FRAME_W, height: FRAME_H })

  // Uncovered: still the pixel-map texture, at a different size.
  const soldier = await textureSize(page, 'entity:soldier:idle')
  expect(soldier.width).toBeGreaterThan(0)
  expect(soldier).not.toEqual({ width: FRAME_W, height: FRAME_H })

  expect(pageErrors).toEqual([])
})

test('a missing manifest boots cleanly on the pixel-art path', async ({ page }) => {
  // This is how the game actually ships: no baked art at all. A 404 here gets
  // the dev server's index.html fallback, which used to reach the JSON loader
  // and throw "Unexpected token '<'" as an uncaught page error.
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')

  const zhaoyun = await textureSize(page, 'entity:zhaoyun:idle')
  expect(zhaoyun.width).toBeGreaterThan(0)
  expect(pageErrors).toEqual([])
})

/**
 * THE REGRESSION GUARD for the local-vs-deployed split.
 *
 * `public/assets` was deleted, but Cloudflare's edge cache kept serving the
 * old `assets/manifest.json` and its placeholder sprites for days
 * (s-maxage 604800). The deployed game fetched that stale manifest and loaded
 * the old box art over the real art, while the byte-identical bundle looked
 * correct on localhost. A build must not decide how it looks by asking a
 * server what happens to still be lying around.
 */
test('a build with no baked art never requests a manifest', async ({ page }) => {
  const artRequests: string[] = []
  page.on('request', (req) => {
    const url = req.url()
    if (/assets\/(manifest\.json|sprites\/|portraits\/)/.test(url)) artRequests.push(url)
  })
  // A stale manifest is served anyway - as a cache or an old deployment would.
  await page.route('**/assets/manifest.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sprites: { zhaoyun: ['idle'] }, portraits: [] }),
    }),
  )

  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')

  expect(artRequests, 'the build went looking for baked art it does not ship').toEqual([])

  // And the pixel-map art is what rendered.
  const zhaoyun = await textureSize(page, 'entity:zhaoyun:idle')
  expect(zhaoyun.width).toBeGreaterThan(0)
  expect(zhaoyun).not.toEqual({ width: FRAME_W, height: FRAME_H })
})
