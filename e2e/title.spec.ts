import { expect, test } from '@playwright/test'

// The title must show the heroes and the painted design - the visible
// "before vs after" check the owner asked about. Since UI-2 the five heroes
// are painted INTO the full-screen key art rather than stood in front of it
// as sprites, so the check is that the real key-art photo decoded and fills
// the logical screen (not a missing-texture box, not the procedural fallback).
test('title screen shows the painted hero key art', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  await page.goto('/?renderer=canvas')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')

  const backdrop = await page.evaluate(() => {
    const game = window.__DW_GAME__
    const scene = game?.scene.getScene('title')
    if (!game || !scene) return null
    const image = scene.children.list.find(
      (child) =>
        child.type === 'Image' &&
        (child as unknown as { texture: { key: string } }).texture.key === 'ui:keyart-photo',
    ) as unknown as { displayWidth: number; displayHeight: number } | undefined
    const source = game.textures.exists('ui:keyart-photo')
      ? game.textures.get('ui:keyart-photo').getSourceImage()
      : null
    return {
      shown: image !== undefined,
      displayWidth: image?.displayWidth ?? 0,
      displayHeight: image?.displayHeight ?? 0,
      sourceWidth: source ? source.width : 0,
      sourceHeight: source ? source.height : 0,
    }
  })

  expect(backdrop, 'title scene missing').not.toBeNull()
  expect(backdrop!.shown, 'key art is not on the title').toBe(true)
  // Fills the 480x270 logical screen...
  expect(backdrop!.displayWidth).toBe(480)
  expect(backdrop!.displayHeight).toBe(270)
  // ...from a real decoded painting at 2x logical resolution.
  expect(backdrop!.sourceWidth).toBeGreaterThanOrEqual(960)
  expect(backdrop!.sourceHeight).toBeGreaterThanOrEqual(540)

  expect(pageErrors).toEqual([])
})

// The key art is a ~120 KB download; if it is blocked the title must still
// boot onto the procedural dusk battle, never a flat field or an error.
test('title falls back to the procedural backdrop when the key art is blocked', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  // Abort only the image itself, never the module that references it: under
  // the dev server `keyart-backdrop.jpg?url` is a JS module whose URL also
  // names the file, and aborting it would stop the boot, proving nothing.
  // (Phaser's loader fetches images over XHR, so filter out scripts rather
  // than matching one image resource type.)
  await page.route('**/*keyart-backdrop*', (route) =>
    route.request().resourceType() === 'script' ? route.continue() : route.abort(),
  )
  await page.goto('/?renderer=canvas')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')

  const state = await page.evaluate(() => {
    const game = window.__DW_GAME__
    const scene = game?.scene.getScene('title')
    const keys = (scene?.children.list ?? [])
      .filter((child) => child.type === 'Image')
      .map((child) => (child as unknown as { texture: { key: string } }).texture.key)
    return { photo: keys.includes('ui:keyart-photo'), dusk: keys.includes('ui:keyart-dusk') }
  })
  expect(state).toEqual({ photo: false, dusk: true })
  expect(pageErrors).toEqual([])
})
