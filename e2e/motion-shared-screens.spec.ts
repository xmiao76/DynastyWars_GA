import { expect, test, type Page } from '@playwright/test'
import type Phaser from 'phaser'
import { mkdir, writeFile } from 'node:fs/promises'
import { PNG } from 'pngjs'
import { CHARACTER_ORDER } from '../src/core/characters'

const OUT = 'artifacts/motion/shared-screens'
const HERO = 'weiyan'

/** Read the real scene images, not just the presence of keys in the cache. */
async function readPortraits(page: Page, sceneKey: string) {
  return page.evaluate((key) => {
    const scene = window.__DW_GAME__!.scene.getScene(key)
    return scene.children.list.filter(child => child.type === 'Image').map(child => child as Phaser.GameObjects.Image)
      .filter(image => image.texture.key.startsWith('portrait:')).map(image => {
        const source = image.texture.getSourceImage() as HTMLCanvasElement
        const ctx = source.getContext('2d')!
        const rgba = ctx.getImageData(0, 0, source.width, source.height).data
        let opaque = 0
        const colors = new Set<number>()
        for (let i = 0; i < rgba.length; i += 4) {
          if (rgba[i + 3]! < 128) continue
          opaque += 1
          colors.add((rgba[i]! << 16) | (rgba[i + 1]! << 8) | rgba[i + 2]!)
        }
        const bounds = image.getBounds()
        return {
          key: image.texture.key, visible: image.visible, alpha: image.alpha,
          width: source.width, height: source.height, opaque, colors: colors.size,
          bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        }
      })
  }, sceneKey)
}

/** Assert real rendered portrait crops are nonblank too (backdrop cannot carry this check). */
async function capturePortraits(page: Page, sceneKey: string, suffix: string) {
  const portraits = await readPortraits(page, sceneKey)
  expect(portraits.map(p => p.key).sort()).toEqual(CHARACTER_ORDER.map(id => `portrait:${id}`).sort())
  const bytes = await page.locator('canvas').screenshot({ path: `${OUT}/${suffix}-${sceneKey}.png` })
  const png = PNG.sync.read(bytes)
  const crops = portraits.map(portrait => {
    expect(portrait.visible).toBe(true)
    expect(portrait.alpha).toBeGreaterThan(0)
    expect([portrait.width, portrait.height]).toEqual([432, 480])
    expect(portrait.opaque).toBeGreaterThan(1000)
    expect(portrait.colors).toBeGreaterThan(100)
    const b = portrait.bounds
    expect(b.x).toBeGreaterThanOrEqual(0)
    expect(b.y).toBeGreaterThanOrEqual(0)
    expect(b.width).toBeGreaterThan(20)
    expect(b.height).toBeGreaterThan(40)
    expect(b.x + b.width).toBeLessThanOrEqual(480)
    expect(b.y + b.height).toBeLessThanOrEqual(270)
    // Interior only: exclude the card/frame and its gold border.
    const colors = new Set<number>()
    for (let y = Math.ceil((b.y + b.height * 0.2) * png.height / 270); y < (b.y + b.height * 0.8) * png.height / 270; y += 1) {
      for (let x = Math.ceil((b.x + b.width * 0.2) * png.width / 480); x < (b.x + b.width * 0.8) * png.width / 480; x += 1) {
        const i = (y * png.width + x) * 4
        colors.add((png.data[i]! << 16) | (png.data[i + 1]! << 8) | png.data[i + 2]!)
      }
    }
    expect(colors.size, `${portrait.key} rendered interior is blank`).toBeGreaterThan(30)
    return { ...portrait, renderedColors: colors.size }
  })
  await writeFile(`${OUT}/${suffix}-${sceneKey}.json`, JSON.stringify(crops, null, 2))
  return crops
}

for (const renderer of ['canvas', 'webgl']) for (const rollback of [false, true]) {
  test(`shared select and final-stage ending (${renderer}, ${rollback ? 'rollback' : 'default'})`, async ({ page }) => {
    test.setTimeout(60_000)
    await mkdir(OUT, { recursive: true })
    const suffix = `${renderer}-${rollback ? 'rollback' : 'default'}`
    const errors: string[] = []
    const motionImages: string[] = []
    page.on('pageerror', error => errors.push(String(error)))
    page.on('request', request => {
      if (request.resourceType() === 'image' && /motion.*\.png/.test(request.url())) motionImages.push(request.url())
    })
    await page.setViewportSize({ width: 960, height: 540 })
    await page.goto(`/?renderer=${renderer}&autopilot=1${rollback ? '&motion=0' : ''}`)
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    expect(await page.evaluate(() => new URLSearchParams(location.search).get('motion'))).toBe(rollback ? '0' : null)
    await page.keyboard.press('Enter')
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('select')
    await page.keyboard.press('ArrowLeft') // Wrap to Wei Yan; verify selected portrait and real confirm.
    const select = await capturePortraits(page, 'select', suffix)
    expect(select.find(p => p.key === `portrait:${HERO}`)?.alpha).toBe(1)
    // Select must not pre-warm ANY of the unused legacy figure poses, even in rollback mode.
    expect(await page.evaluate(() => window.__DW_GAME__!.textures.getTextureKeys().filter(key => key.startsWith('entity:')))).toEqual([])
    expect(motionImages).toEqual([]) // Menus must not preload the motion cast.
    await page.keyboard.press('Enter')
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.charId)).toBe(HERO)

    // Focused screen/transition fixture: use the existing final-stage bridge payload,
    // not a combat-clear claim (finalstage.spec.ts separately covers the actual boss clear).
    await page.evaluate(() => window.__DW__!.startGame('weiyan', 42, 'stage3'))
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.stageId)).toBe('stage3')
    await expect.poll(() => page.evaluate(({ hero, motion }) => {
      return window.__DW_GAME__!.scene.getScene('game').children.list.some(child => {
        const sprite = child as Phaser.GameObjects.Sprite
        const key = sprite.frame?.name === '__BASE' ? sprite.texture?.key ?? '' : String(sprite.frame?.name ?? '')
        return sprite.visible && sprite.alpha > 0 && key.startsWith(`entity:${hero}:`) && key.includes(':motion:') === motion
      })
    }, { hero: HERO, motion: !rollback })).toBe(true)
    const beforeEnding = await page.evaluate(() => window.__DW_GAME__!.textures.getTextureKeys().filter(key => /^entity:[^:]+:idle$/.test(key)).sort())
    await page.evaluate(() => window.__DW__!.forceResult())
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('result')
    await page.locator('canvas').screenshot({ path: `${OUT}/${suffix}-result.png` })
    await page.keyboard.press('Enter')
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('gamecomplete')
    const ending = await capturePortraits(page, 'gamecomplete', suffix)
    expect(ending.find(p => p.key === `portrait:${HERO}`)?.alpha).toBe(1)
    // Framed cards fit the old lower band, in the original 54px-spaced row.
    const row = [...ending].sort((a, b) => a.bounds.x - b.bounds.x)
    for (let i = 0; i < row.length; i += 1) {
      const b = row[i]!.bounds
      expect(b.y).toBeGreaterThanOrEqual(192)
      expect(b.height).toBeLessThanOrEqual(62)
      if (i > 0) expect(b.x - (row[i - 1]!.bounds.x + row[i - 1]!.bounds.width)).toBeGreaterThanOrEqual(4)
    }
    expect(await page.evaluate(() => {
      const scene = window.__DW_GAME__!.scene.getScene('gamecomplete')
      return scene.children.list.some(child => (child as Phaser.GameObjects.Image).texture?.key.startsWith('entity:'))
    })).toBe(false)
    expect(await page.evaluate(() => window.__DW_GAME__!.textures.getTextureKeys().filter(key => /^entity:[^:]+:idle$/.test(key)).sort())).toEqual(beforeEnding)
    const labels = await page.evaluate(() => window.__DW_GAME__!.scene.getScene('gamecomplete').children.list
      .filter(child => child.type === 'Text').map(child => (child as Phaser.GameObjects.Text).text))
    expect(labels).toEqual(expect.arrayContaining(['GAME COMPLETE!', 'Xu Chu has fallen - the land is at peace', 'PRESS ENTER']))
    await page.keyboard.press('Enter')
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    expect(errors).toEqual([])
    await writeFile(`${OUT}/${suffix}-navigation.json`, JSON.stringify({ renderer, rollback, hero: HERO, beforeEnding, errors }, null, 2))
  })
}
