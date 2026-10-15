import { expect, test } from '@playwright/test'
import type Phaser from 'phaser'

const IDS = ['archer', 'guanyu', 'huangzhong', 'lidian', 'soldier', 'spearman', 'weiyan', 'xiahoudun', 'xuchu', 'zhangfei', 'zhaoyun']

for (const renderer of ['canvas', 'webgl']) for (const rollback of [false, true]) {
  test(`painted portraits preserve select and gameplay (${renderer}, ${rollback ? 'rollback' : 'default'})`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(String(e)))
    await page.setViewportSize({ width: 960, height: 540 })
    await page.goto(`/?renderer=${renderer}&autopilot=1${rollback ? '&motion=0' : ''}`)
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    const ready = await page.evaluate(() => {
      const r = window.__DW_GAME__!.registry.get('paintedHeroArt') as { portraits: Record<string, unknown>; heroes: Record<string, unknown> }
      return { portraits: Object.keys(r.portraits).sort(), heads: Object.keys(r.heroes).sort() }
    })
    expect(ready).toEqual({ portraits: IDS, heads: IDS })
    await page.keyboard.press('Enter')
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('select')
    const portraits = await page.evaluate(() => ['guanyu', 'zhaoyun'].map(id => {
      const f = window.__DW_GAME__!.textures.get(`portrait:${id}`).get()
      return { width: f.width, height: f.height }
    }))
    expect(portraits).toEqual([{ width: 432, height: 480 }, { width: 432, height: 480 }])
    const suffix = `${renderer}-${rollback ? 'rollback' : 'default'}`
    await page.screenshot({ path: `artifacts/motion/portrait-slim/${suffix}-select.png` })
    for (const id of ['guanyu', 'zhaoyun']) {
      await page.evaluate(hero => window.__DW__?.startGame(hero, 42), id)
      await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
      await expect.poll(() => page.evaluate(({ hero, motion }) => {
        const scene = window.__DW_GAME__!.scene.getScene('game')
        return scene.children.list.some(child => {
          const sprite = child as Phaser.GameObjects.Sprite
          const key = sprite.frame?.name === '__BASE' ? sprite.texture?.key ?? '' : String(sprite.frame?.name ?? '')
          return key.startsWith(`entity:${hero}:`) && key.includes(':motion:') === motion
        })
      }, { hero: id, motion: !rollback })).toBe(true)
      await page.screenshot({ path: `artifacts/motion/portrait-slim/${suffix}-${id}.png` })
    }
    expect(errors).toEqual([])
  })
}

test('a missing rollback head layer does not suppress its painted portrait', async ({ page }) => {
  await page.route('**/guanyu-front.png*', route =>
    route.request().resourceType() === 'script' ? route.continue() : route.abort())
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  const ready = await page.evaluate(() => {
    const r = window.__DW_GAME__!.registry.get('paintedHeroArt') as { heroes: Record<string, unknown>; portraits: Record<string, unknown> }
    return { heads: Object.keys(r.heroes), portraits: Object.keys(r.portraits) }
  })
  expect(ready.heads).not.toContain('guanyu')
  expect(ready.heads).toContain('zhaoyun')
  expect(ready.portraits).toContain('guanyu')
  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('select')
  expect(await page.evaluate(() => window.__DW_GAME__!.textures.get('portrait:guanyu').get().width)).toBe(432)
})

test('missing painted portrait creates no procedural substitute and keeps siblings', async ({ page }) => {
  await page.route('**/guanyu-portrait.png*', route =>
    route.request().resourceType() === 'script' ? route.continue() : route.abort())
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('select')
  expect(await page.evaluate(() => ({
    missing: window.__DW_GAME__!.textures.exists('portrait:guanyu'),
    sibling: window.__DW_GAME__!.textures.exists('portrait:zhaoyun'),
  }))).toEqual({ missing: false, sibling: true })
})
