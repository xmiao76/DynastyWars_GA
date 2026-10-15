import { expect, test } from '@playwright/test'
import type Phaser from 'phaser'
import { mkdir, writeFile } from 'node:fs/promises'

const OUT = 'artifacts/motion/wholeframe-removal'

for (const renderer of ['canvas', 'webgl']) for (const rollback of [false, true]) {
  test(`retired frames switch is inert (${renderer}, ${rollback ? 'rollback' : 'default'})`, async ({ page }) => {
    const errors: string[] = []
    const pilotRequests: string[] = []
    page.on('pageerror', error => errors.push(String(error)))
    // Include module/JSON requests, not just PNGs: no retired source may load.
    page.on('request', request => {
      if (/whole-frames|frame-art/.test(request.url())) pilotRequests.push(request.url())
    })
    await mkdir(OUT, { recursive: true })
    await page.goto(`/?renderer=${renderer}&autopilot=1&frames=1${rollback ? '&motion=0' : ''}`)
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    expect(await page.evaluate(() => new URLSearchParams(location.search).get('motion'))).toBe(rollback ? '0' : null)

    const retiredState = () => page.evaluate(() => {
      const game = window.__DW_GAME__!
      const resources = game.scene.getScene('boot').registry.get('paintedHeroArt') as Record<string, unknown>
      return {
        framesField: Object.prototype.hasOwnProperty.call(resources, 'frames'),
        sourceKeys: game.textures.getTextureKeys().filter(key => key.startsWith('frame-source:')),
      }
    })
    expect(await retiredState()).toEqual({ framesField: false, sourceKeys: [] })
    await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage1'))
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
    const heroKey = () => page.evaluate(() => {
      const scene = window.__DW_GAME__!.scene.getScene('game') as Phaser.Scene & {
        sim: { playerId: number }; sprites: Map<number, Phaser.GameObjects.Sprite>
      }
      const sprite = scene.sprites.get(scene.sim.playerId)
      if (!sprite?.visible || sprite.alpha <= 0) return ''
      return sprite.frame.name === '__BASE' ? sprite.texture.key : String(sprite.frame.name)
    })
    if (rollback) {
      await expect.poll(heroKey).toBe('entity:guanyu:idle')
    } else {
      await expect.poll(heroKey).toMatch(/^entity:guanyu:motion:/)
    }
    expect(await retiredState()).toEqual({ framesField: false, sourceKeys: [] })
    expect(pilotRequests).toEqual([])
    expect(errors).toEqual([])
    const suffix = `${renderer}-${rollback ? 'rollback' : 'default'}`
    await page.locator('canvas').screenshot({ path: `${OUT}/${suffix}.png` })
    await writeFile(`${OUT}/${suffix}.json`, JSON.stringify({ heroKey: await heroKey(), retired: await retiredState(), pilotRequests, errors }, null, 2))
  })
}
