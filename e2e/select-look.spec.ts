import { expect, test } from '@playwright/test'
import { CHARACTER_ORDER } from '../src/core/characters'
import { cardCenterX } from '../src/game/ui/roster'

/**
 * UI-3 roster select: the screen is built from the baked kit, the cursors
 * mark the right cards as they move, and review captures are written for
 * desktop and phone.
 */

interface Marks {
  p1: number | null
  p2: number | null
  cards: number[]
}

/** Card centres and where the 1P/2P halos currently sit, from the live scene. */
function readMarks(): Marks {
  const scene = window.__DW_GAME__?.scene.getScene('select')
  const list = scene?.children.list ?? []
  const cards = list
    .filter((c) => c.type === 'Zone')
    .map((c) => Math.round((c as unknown as { x: number }).x))
    .sort((a, b) => a - b)
  const glowX = (key: string): number | null => {
    const g = list.find(
      (c) => c.type === 'Image' && (c as unknown as { texture: { key: string } }).texture.key === key,
    ) as unknown as { x: number } | undefined
    return g ? Math.round(g.x) : null
  }
  return { p1: glowX('ui:roster-glow-p1'), p2: glowX('ui:roster-glow-p2'), cards }
}

test('UI-3 roster select renders through the baked kit and the cursors track', async ({ page, browser }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('select')
  await page.waitForTimeout(500)

  const kit = await page.evaluate(() => {
    const tex = window.__DW_GAME__?.textures
    return ['ui:select-backdrop', 'ui:roster-card', 'ui:roster-glow-p1', 'ui:roster-glow-p2', 'ui:pip-on', 'ui:pip-off'].filter(
      (k) => tex?.exists(k) !== true,
    )
  })
  expect(kit, 'select kit textures missing').toEqual([])

  // Every card carries its hero's painted portrait and bilingual name.
  const labels = await page.evaluate(() =>
    (window.__DW_GAME__?.scene.getScene('select')?.children.list ?? [])
      .filter((c) => c.type === 'Text')
      .map((c) => (c as unknown as { text: string }).text),
  )
  for (const id of CHARACTER_ORDER) {
    const portrait = await page.evaluate(
      (key) =>
        (window.__DW_GAME__?.scene.getScene('select')?.children.list ?? []).some(
          (c) => c.type === 'Image' && (c as unknown as { texture: { key: string } }).texture.key === key,
        ),
      `portrait:${id}`,
    )
    expect(portrait, `${id} card has no portrait`).toBe(true)
  }
  expect(labels).toEqual(expect.arrayContaining(['關羽', 'GUAN YU', '魏延', 'WEI YAN', '1P', '2P']))

  // 1P starts on card 0; 2P previews the drop-in rule (first hero 1P did not
  // pick), which is card 1. Moving left wraps 1P to the last card and 2P back
  // to card 0.
  const start = await page.evaluate(readMarks)
  expect(start.cards.length).toBe(5)
  // Live card centres must equal the scene's own geometry source:
  // cardCenterX(i, 5) = 480/2 - 92*2 + i*92, i.e. [56, 148, 240, 332, 424].
  expect(start.cards).toEqual(CHARACTER_ORDER.map((_, i) => cardCenterX(i, CHARACTER_ORDER.length)))
  expect(start.p1).toBe(start.cards[0])
  expect(start.p2).toBe(start.cards[1])
  await page.screenshot({ path: 'artifacts/look/ui3-select-desktop.png' })

  await page.keyboard.press('ArrowLeft')
  await expect.poll(() => page.evaluate(readMarks)).toMatchObject({ p1: start.cards[4], p2: start.cards[0] })
  // Step right to Zhao Yun (index 2), navigating by the observed card rather
  // than counting presses: SelectScene listens for 'keydown-RIGHT' without
  // registering a Key object, so Phaser does not suppress OS auto-repeat
  // keydowns, and under batch load a delayed keyup can add an extra step
  // (that lands on card 3 and a blind-count poll can never recover).
  const targetX = cardCenterX(2, CHARACTER_ORDER.length)
  for (let step = 0; step < 10 && (await page.evaluate(readMarks)).p1 !== targetX; step += 1) {
    const before = (await page.evaluate(readMarks)).p1
    await page.keyboard.press('ArrowRight')
    await expect.poll(async () => (await page.evaluate(readMarks)).p1).not.toBe(before)
  }
  await expect.poll(() => page.evaluate(readMarks)).toMatchObject({ p1: targetX, p2: start.cards[0] })
  await page.screenshot({ path: 'artifacts/look/ui3-select-zhaoyun.png' })
  expect(errors).toEqual([])

  const ctx = await browser.newContext({ viewport: { width: 412, height: 732 }, hasTouch: true })
  const phone = await ctx.newPage()
  await phone.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => phone.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await phone.keyboard.press('Enter')
  await expect.poll(() => phone.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('select')
  await phone.waitForTimeout(500)
  const hint = await phone.evaluate(() =>
    (window.__DW_GAME__?.scene.getScene('select')?.children.list ?? [])
      .filter((c) => c.type === 'Text')
      .map((c) => (c as unknown as { text: string }).text)
      .find((t) => t.includes('WARRIOR TO FIGHT') || t.includes('ENTER to fight')),
  )
  expect(hint).toBe('TAP A WARRIOR TO FIGHT')
  await phone.screenshot({ path: 'artifacts/look/ui3-select-phone.png' })
  await ctx.close()
})
