import { expect, test } from '@playwright/test'
import type Phaser from 'phaser'

for (const renderer of ['canvas', 'webgl']) {
  test(`painted hero pilot loads matching portrait and rig heads (${renderer})`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(String(e)))
    await page.setViewportSize({ width: 960, height: 540 })
    await page.goto(`/?renderer=${renderer}&autopilot=1`)
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    const ready = await page.evaluate(() => {
      const game = window.__DW_GAME__ as Phaser.Game
      const r = game.registry.get('paintedHeroArt') as { heroes: Record<string, { revision: string }> }
      return Object.keys(r.heroes).sort()
    })
    // BODY-6: the catalog generalizes to boss ids - the exact set is the
    // five heroes plus the nine bosses, so nothing may silently drop.
    expect(ready).toEqual(['caocao', 'caoren', 'guanyu', 'huangzhong', 'lidian', 'lubu', 'weiyan', 'xiahoudun', 'xuchu', 'xuhuang', 'zhangfei', 'zhanghe', 'zhangliao', 'zhaoyun'])
    await page.keyboard.press('Enter')
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('select')
    const portraits = await page.evaluate(() => ['guanyu', 'zhaoyun'].map(id => {
      const f = window.__DW_GAME__!.textures.get(`portrait:${id}`).get()
      return { width: f.width, height: f.height }
    }))
    expect(portraits).toEqual([{ width: 432, height: 480 }, { width: 432, height: 480 }])
    await page.screenshot({ path: `artifacts/look/art18-${renderer}-select.png` })
    for (const id of ['guanyu', 'zhaoyun']) {
      await page.evaluate(hero => window.__DW__?.startGame(hero, 42), id)
      await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
      await page.waitForTimeout(300)
      await page.screenshot({ path: `artifacts/look/art18-${renderer}-${id}.png` })
    }
    expect(errors).toEqual([])
  })
}

test('one missing head layer falls back atomically for that hero', async ({ page }) => {
  await page.route('**/guanyu-front.png*', route =>
    route.request().resourceType() === 'script' ? route.continue() : route.abort())
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  const ready = await page.evaluate(() => {
    const r = window.__DW_GAME__!.registry.get('paintedHeroArt') as { heroes: Record<string, unknown> }
    return Object.keys(r.heroes)
  })
  expect(ready).not.toContain('guanyu')
  expect(ready).toContain('zhaoyun')
  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('select')
  const width = await page.evaluate(() => window.__DW_GAME__!.textures.get('portrait:guanyu').get().width)
  expect(width).toBe(216)
})
