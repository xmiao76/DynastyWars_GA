import { expect, test } from '@playwright/test'
import type Phaser from 'phaser'
import { decideBotScript } from '../selfplay/bot'

// HUD overhaul: stage-entry banner on stage start, WARNING banner on boss
// spawn, glassy framed panels (Graphics panels) present.
test('stage banner, boss warning banner, and framed HUD bars', async ({ page }) => {
  test.setTimeout(180_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage3'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')

  /**
   * The modern HUD draws its frames with Graphics (drawSlab: a filled path
   * + strokeRoundedRect), not stroked Rectangle objects, so a "framed" check
   * must look for those Graphics panels and the HP-bar image, not stroked
   * Rectangle game objects.
   */
  const sceneTexts = () =>
    page.evaluate(() => {
      const game = window.__DW_GAME__
      const scene = game?.scene.getScene('hud')
      if (!scene) return { texts: [] as string[], framed: 0 }
      const collectTexts = (list: Phaser.GameObjects.GameObject[]): string[] =>
        list.flatMap((child) => {
          if (child.type === 'Text') return [(child as Phaser.GameObjects.Text).text]
          // Banner texts live inside containers.
          if (child.type === 'Container') {
            return collectTexts((child as Phaser.GameObjects.Container).list as Phaser.GameObjects.GameObject[])
          }
          return []
        })
      const texts = collectTexts(scene.children.list)
      // drawSlab() returns a Graphics child (type 'Graphics'); count those.
      const framed = scene.children.list.filter(
        (child) => child.type === 'Graphics',
      ).length
      return { texts, framed }
    })

  // Stage-entry banner.
  await expect
    .poll(async () => (await sceneTexts()).texts.some((t) => t.includes('White River Bank')))
    .toBe(true)
  // Framed panels exist among scene children (player panel + boss bar frame).
  const initial = await sceneTexts()
  expect(initial.framed).toBeGreaterThanOrEqual(1)

  // Drive until the boss spawns; the WARNING banner must appear while it is
  // up (the banner tweens away after ~2s, so check each batch).
  let warningSeen = false
  for (let i = 0; i < 600 && !warningSeen; i += 1) {
    const snapshot = await page.evaluate(() => window.__DW__?.getSnapshot())
    if (!snapshot?.sim) continue
    if (snapshot.sim.phase === 'gameover') {
      if (snapshot.sim.lives > 0) {
        await page.keyboard.press('Enter')
        await expect
          .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.phase), {
            timeout: 5000,
          })
          .toBe('fight')
        continue
      }
      break
    }
    if (snapshot.sim.enemies.some((e) => e.boss)) {
      const { texts } = await sceneTexts()
      if (texts.some((t) => t === 'WARNING')) warningSeen = true
      if (warningSeen) break
    }
    const script = decideBotScript(snapshot)
    const tickBefore = snapshot.tick
    await page.evaluate((inputs) => window.__DW__?.run(inputs), script)
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().tick), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(tickBefore + script.length)
  }
  expect(warningSeen).toBe(true)

  expect(pageErrors).toEqual([])
})
