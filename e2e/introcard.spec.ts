import { expect, test } from '@playwright/test'
import type Phaser from 'phaser'
import { neutralInput } from '../src/core/types'

/**
 * UI-5 scene-intro card: the parchment card that names each stage must be a
 * transient overlay, never a gate. The autopilot contract is the load-bearing
 * one: selfplay and marathon drive the game through run() tick batches with
 * no wall-clock pacing, so the card must dismiss on TICK COUNT - if it ever
 * waited on real time alone, every marathon would stall on stage entry and
 * time out. Real play dismisses on Enter, a tap, or a 3s hold.
 */

async function boot(page: import('@playwright/test').Page, autopilot: boolean): Promise<void> {
  await page.goto(`/?renderer=canvas${autopilot ? '&autopilot=1' : ''}`)
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
}

test('the intro card shows at stage entry and never gates autopilot', async ({ page }) => {
  test.setTimeout(60_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await boot(page, true)
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage1'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')

  const cardVisible = (): Promise<boolean> =>
    page.evaluate(() => {
      const hud = window.__DW_GAME__?.scene.getScene('hud')
      const card = hud?.children.list.find((c) => c.name === 'introCard') as
        | Phaser.GameObjects.Container
        | undefined
      return card?.visible === true
    })

  // The card is up at stage entry, with its lore baked.
  await expect.poll(cardVisible).toBe(true)
  await page.screenshot({ path: 'artifacts/look/ui5-intro.png' })
  const intro = await page.evaluate(() => {
    const hud = window.__DW_GAME__?.scene.getScene('hud')
    const card = hud?.children.list.find((c) => c.name === 'introCard') as
      | Phaser.GameObjects.Container
      | undefined
    const texts: string[] = []
    for (const child of card?.list ?? []) {
      if (child.type === 'Text') texts.push((child as Phaser.GameObjects.Text).text)
    }
    return texts
  })
  expect(intro.some((t) => t.includes('Bowang Slope'))).toBe(true)

  // Thirty ticks of autopilot drain dismiss it - no wall-clock wait.
  const tickBefore = await page.evaluate(() => window.__DW__?.getSnapshot().tick)
  await page.evaluate(
    (inputs) => window.__DW__?.run(inputs),
    Array.from({ length: 40 }, () => neutralInput()),
  )
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().tick))
    .toBeGreaterThanOrEqual((tickBefore ?? 0) + 40)
  await expect.poll(cardVisible, { timeout: 2_000 }).toBe(false)

  // And the fight itself kept running under the card the whole time.
  const after = await page.evaluate(() => window.__DW__?.getSnapshot())
  expect(after?.sim?.phase).toBe('fight')
  expect(pageErrors).toEqual([])
})

test('real play dismisses the card on Enter', async ({ page }) => {
  test.setTimeout(60_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await boot(page, false)
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage2'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')

  const cardVisible = (): Promise<boolean> =>
    page.evaluate(() => {
      const hud = window.__DW_GAME__?.scene.getScene('hud')
      const card = hud?.children.list.find((c) => c.name === 'introCard') as
        | Phaser.GameObjects.Container
        | undefined
      return card?.visible === true
    })
  await expect.poll(cardVisible).toBe(true)
  await page.keyboard.press('Enter')
  await expect.poll(cardVisible, { timeout: 2_000 }).toBe(false)
  // The dismissal must not have paused or unpaused anything.
  const snap = await page.evaluate(() => window.__DW__?.getSnapshot())
  expect(snap?.sim?.phase).toBe('fight')
  expect(pageErrors).toEqual([])
})

test('a new stage entry raises a fresh card, once per stage', async ({ page }) => {
  test.setTimeout(90_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await boot(page, true)
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage1'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')

  // Let the first card dismiss on ticks.
  await page.evaluate(
    (inputs) => window.__DW__?.run(inputs),
    Array.from({ length: 40 }, () => neutralInput()),
  )
  await expect
    .poll(() =>
      page.evaluate(() => {
        const hud = window.__DW_GAME__?.scene.getScene('hud')
        return hud?.children.list.some((c) => c.name === 'introCard')
      }),
    )
    .toBe(false)

  // Force the stage clear -> result -> next stage; the new stage's card
  // appears exactly once, names Xinye Fields, and again dismisses on ticks.
  await page.evaluate(() => window.__DW__?.forceResult())
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('result')
  await page.screenshot({ path: 'artifacts/look/ui5-victory.png' })
  await page.keyboard.press('Enter')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')
  await expect
    .poll(() =>
      page.evaluate(() => {
        const hud = window.__DW_GAME__?.scene.getScene('hud')
        const cards = hud?.children.list.filter((c) => c.name === 'introCard') ?? []
        if (cards.length !== 1) return cards.length
        const texts: string[] = []
        for (const child of (cards[0] as Phaser.GameObjects.Container).list) {
          if (child.type === 'Text') texts.push((child as Phaser.GameObjects.Text).text)
        }
        return texts.some((t) => t.includes('Xinye Fields')) ? 1 : -1
      }),
    )
    .toBe(1)
  await page.evaluate(
    (inputs) => window.__DW__?.run(inputs),
    Array.from({ length: 40 }, () => neutralInput()),
  )
  await expect
    .poll(() =>
      page.evaluate(() => {
        const hud = window.__DW_GAME__?.scene.getScene('hud')
        return hud?.children.list.some((c) => c.name === 'introCard')
      }),
    )
    .toBe(false)
  expect(pageErrors).toEqual([])
})

test('defeat, complete and pause get the parchment kit too', async ({ page }) => {
  test.setTimeout(90_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await boot(page, true)

  // Defeat card.
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage1'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')
  await page.evaluate(() => window.__DW__?.forceGameOver())
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('gameover')
  await page.screenshot({ path: 'artifacts/look/ui5-gameover.png' })

  // Pause card over the fight.
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage2'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.stageId))
    .toBe('stage2')
  // Dismiss the intro card first so the pause capture shows the pause
  // card itself, not the intro card stacked in front of it.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const hud = window.__DW_GAME__?.scene.getScene('hud')
        return hud?.children.list.some((c) => c.name === 'introCard')
      }),
    )
    .toBe(true)
  await page.keyboard.press('Enter')
  await expect
    .poll(() =>
      page.evaluate(() => {
        const hud = window.__DW_GAME__?.scene.getScene('hud')
        return hud?.children.list.some((c) => c.name === 'introCard')
      }),
    )
    .toBe(false)
  await page.keyboard.press('p')
  await expect
    .poll(() =>
      page.evaluate(() => {
        const hud = window.__DW_GAME__?.scene.getScene('hud')
        const paused = hud?.children.list.find(
          (c) => c.type === 'Text' && (c as Phaser.GameObjects.Text).text === 'PAUSED',
        ) as Phaser.GameObjects.Text | undefined
        return paused?.visible === true
      }),
    )
    .toBe(true)
  await page.screenshot({ path: 'artifacts/look/ui5-pause.png' })
  await page.keyboard.press('p')

  // Complete card: leave the current game via game over (menu scenes are
  // what consume a pending startGame - calling it from inside 'game' is a
  // silent no-op, which is exactly how this test used to land on stage 3 and
  // assert 'gamecomplete' against it), then clear the final stage and step
  // through the result.
  await page.evaluate(() => window.__DW__?.forceGameOver())
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('gameover')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage3'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.stageId))
    .toBe('stage3')
  await page.evaluate(() => window.__DW__?.forceResult())
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('result')
  await page.keyboard.press('Enter')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('gamecomplete')
  await page.screenshot({ path: 'artifacts/look/ui5-complete.png' })
  expect(pageErrors).toEqual([])
})

/**
 * UIR-3 (V-3): the stage banner and the intro card both name the stage -
 * they used to overlap for ~260ms (the card rose at 1_600ms while the
 * banner's life ran to ~1_876ms). Contract: no frame may show the card
 * at alpha > 0 while the banner is at alpha > 0.05. Samples every
 * animation frame through a whole stage entry.
 */
test('UIR-3: the intro card and the stage banner never show at once', async ({ page }) => {
  test.setTimeout(60_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await boot(page, true)
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage1'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')

  const offenders = await page.evaluate(async () => {
    const hud = window.__DW_GAME__?.scene.getScene('hud')
    const bad: string[] = []
    const start = performance.now()
    while (performance.now() - start < 3_000) {
      await new Promise((r) => requestAnimationFrame(r))
      const find = (name: string): { alpha?: number; visible?: boolean } | undefined =>
        hud?.children.list.find((c) => c.name === name) as
          | { alpha?: number; visible?: boolean }
          | undefined
      const card = find('introCard')
      const banner = find('stageBanner')
      const ca = card?.visible === false ? 0 : (card?.alpha ?? 0)
      const ba = banner?.visible === false ? 0 : (banner?.alpha ?? 0)
      if (ca > 0 && ba > 0.05) {
        bad.push(`t=${(performance.now() - start).toFixed(0)}ms card=${ca.toFixed(2)} banner=${ba.toFixed(2)}`)
      }
    }
    return bad
  })
  expect(offenders, 'introCard and stageBanner shared the screen').toEqual([])
  expect(pageErrors).toEqual([])
})
