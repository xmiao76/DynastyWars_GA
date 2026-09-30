import { mkdirSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { neutralInput } from '../src/core/types'
import { actorBox, rendered, tickOf } from './review/kit'

/**
 * Whole-frame pilot IN-GAME capture (docs/WHOLE_FRAME_TEST.md). A generator,
 * not a gate (WHOLEFRAME_LOOK=1 only). Boots the real game twice as Guan Yu
 * on stage 1 - without and with `?frames=1` - and captures the idle frame and
 * the `attack` strike frame (his second combo hit) as a full screen plus a
 * 4x crop around the hero, to artifacts/wholeframe/ingame-<variant>-<pose>.png.
 */
test.skip(process.env.WHOLEFRAME_LOOK !== '1', 'set WHOLEFRAME_LOOK=1')
test.describe.configure({ mode: 'serial' })

const OUT = 'artifacts/wholeframe'

/** Texture key of the player's sprite (entity:<kind>:<pose>[...]). */
async function playerKey(page: Page): Promise<string> {
  return page.evaluate(() => {
    type S = { texture: { key: string } }
    const g = window.__DW_GAME__?.scene.getScene('game') as unknown as {
      sim: { playerId: number }
      sprites: Map<number, S>
    }
    return g.sprites.get(g.sim.playerId)?.texture.key ?? ''
  })
}

async function capture(page: Page, variant: string, pose: string): Promise<void> {
  const s = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  if (!s) throw new Error('no sim')
  // actorBox is 120 wide (for the body); widen to the right so the glaive's
  // full reach on a strike (up to ~100 logical px) is inside the crop.
  const b0 = actorBox(s.player.x, s.player.y, s.player.z, s.scrollX)
  const x = Math.max(0, b0.x - 20)
  const box = { x, y: b0.y, w: Math.min(480 - x, 200), h: b0.h }
  // Logical 480x270 at 2x device px in a 960x540 viewport.
  await page.screenshot({ path: `${OUT}/ingame-${variant}-${pose}.png` })
  await page.screenshot({
    path: `${OUT}/ingame-${variant}-${pose}-crop.png`,
    clip: { x: box.x * 2, y: box.y * 2, width: box.w * 2, height: box.h * 2 },
    scale: 'device',
  })
}

for (const [variant, query] of [['current', ''], ['frames', '&frames=1']] as const) {
  test(`Guan Yu in-game: ${variant}`, async ({ page }) => {
    test.setTimeout(120_000)
    mkdirSync(OUT, { recursive: true })
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.setViewportSize({ width: 960, height: 540 })
    await page.goto(`/?renderer=canvas&autopilot=1${query}`)
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    const published = await page.evaluate(() => {
      const r = window.__DW_GAME__?.scene.getScene('boot')?.registry.get('paintedHeroArt') as { frames?: Record<string, unknown> } | undefined
      return Object.keys(r?.frames ?? {})
    })
    expect(published).toEqual(variant === 'frames' ? ['guanyu'] : [])
    await page.evaluate(() => window.__DW__?.startGame('guanyu', 42, 'stage1'))
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
    // Dismiss the stage intro card (as ui-review.spec does) so it cannot
    // cover the captures, then let a few frames settle.
    const introUp = (): Promise<boolean> =>
      page.evaluate(() => !!window.__DW_GAME__?.scene.getScene('hud')?.children.list.some((c) => c.name === 'introCard'))
    await expect.poll(introUp).toBe(true)
    await page.keyboard.press('Enter')
    await expect.poll(introUp).toBe(false)
    const t0 = await tickOf(page)
    await page.evaluate((b) => window.__DW__?.run(b), Array.from({ length: 20 }, () => neutralInput()))
    await rendered(page, t0 + 20)
    await expect.poll(() => playerKey(page)).toBe('entity:guanyu:idle')
    await capture(page, variant, 'idle')
    // Combo: jab1 (sweep) -> jab2 (attack). Step one tick at a time until the
    // strike frame of jab2 is on screen.
    let seen = false
    for (let i = 0; i < 400 && !seen; i += 1) {
      const press = i % 12 === 0
      const t = await tickOf(page)
      await page.evaluate((inp) => window.__DW__?.run([inp]), { ...neutralInput(), attackPressed: press })
      await rendered(page, t + 1)
      if ((await playerKey(page)) === 'entity:guanyu:attack') seen = true
    }
    expect(seen, 'attack frame shown').toBe(true)
    await capture(page, variant, 'attack')
    expect(errors).toEqual([])
  })
}
