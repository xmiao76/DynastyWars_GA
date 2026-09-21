import { expect, test } from '@playwright/test'

/**
 * Gamepad support, driven by a synthetic pad.
 *
 * Playwright cannot attach a real controller, so the page gets a stub
 * `navigator.getGamepads` plus a `gamepadconnected` event - exactly the surface
 * the adapter reads, so the fake and a real pad go through one code path.
 * Nothing about the game is aware it is being faked.
 */

/** Standard-layout indices, matching src/game/adapters/gamepad.ts. */
const BTN = { a: 0, b: 1, x: 2, start: 9, dpadRight: 15 } as const

/** Install the stub before any page script runs. `pads` is how many to fake. */
async function attachGamepad(page: import('@playwright/test').Page, pads = 1): Promise<void> {
  await page.addInitScript((padCount) => {
    const state = { buttons: new Array<number>(17).fill(0), axes: [0, 0, 0, 0] }
    const state2 = { buttons: new Array<number>(17).fill(0), axes: [0, 0, 0, 0] }
    ;(window as unknown as { __PAD__: typeof state }).__PAD__ = state
    ;(window as unknown as { __PAD2__: typeof state2 }).__PAD2__ = state2
    const make = (s: typeof state, index: number): Gamepad =>
      ({
        id: `Synthetic Pad ${index} (STANDARD GAMEPAD)`,
        index,
        connected: true,
        mapping: 'standard',
        timestamp: performance.now(),
        axes: s.axes,
        buttons: s.buttons.map((v) => ({ pressed: v > 0.5, touched: v > 0, value: v })),
        vibrationActuator: null,
      }) as unknown as Gamepad
    navigator.getGamepads = () =>
      (padCount > 1
        ? [make(state, 0), make(state2, 1)]
        : [make(state, 0), null, null, null]) as unknown as ReturnType<
        typeof navigator.getGamepads
      >
    window.addEventListener('load', () => {
      window.dispatchEvent(new Event('gamepadconnected'))
    })
  }, pads)
}

/** Hold a button for a few frames, then release - one physical press. */
async function tapButton(page: import('@playwright/test').Page, index: number): Promise<void> {
  await page.evaluate((i) => {
    ;(window as unknown as { __PAD__: { buttons: number[] } }).__PAD__.buttons[i] = 1
  }, index)
  await page.waitForTimeout(140)
  await page.evaluate((i) => {
    ;(window as unknown as { __PAD__: { buttons: number[] } }).__PAD__.buttons[i] = 0
  }, index)
  await page.waitForTimeout(90)
}

test('a gamepad alone drives the menus and the game', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await attachGamepad(page)
  // No autopilot: the sim runs on real frames, so the pad is the only input.
  await page.goto('/?renderer=canvas')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')

  // Start confirms through the menus, with no keyboard involved at all.
  await tapButton(page, BTN.start)
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 8_000 })
    .toBe('select')
  await tapButton(page, BTN.start)
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 8_000 })
    .toBe('game')

  expect(pageErrors).toEqual([])
})

test('gamepad buttons reach the sim as attack, jump and special', async ({ page }) => {
  await attachGamepad(page)
  await page.goto('/?renderer=canvas')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await tapButton(page, BTN.start)
  await tapButton(page, BTN.start)
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 8_000 })
    .toBe('game')
  await page.waitForTimeout(400)

  const state = async (): Promise<string | undefined> =>
    page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.state)

  // A: attack.
  await page.evaluate(() => {
    ;(window as unknown as { __PAD__: { buttons: number[] } }).__PAD__.buttons[0] = 1
  })
  await expect.poll(state, { timeout: 4_000 }).toBe('attack')
  await page.evaluate(() => {
    ;(window as unknown as { __PAD__: { buttons: number[] } }).__PAD__.buttons[0] = 0
  })
  await expect.poll(state, { timeout: 4_000 }).not.toBe('attack')

  // X: the desperation special, which also costs HP - a second, independent
  // signal that the press reached the sim rather than only the animation.
  const hpBefore = (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.hp)) ?? 0
  await tapButton(page, BTN.x)
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.stats.specialsUsed), { timeout: 4_000 })
    .toBeGreaterThanOrEqual(1)
  const hpAfter = (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.hp)) ?? 0
  expect(hpAfter).toBeLessThan(hpBefore)
})

test('the stick moves the player, and holding a button does not re-fire it', async ({ page }) => {
  await attachGamepad(page)
  await page.goto('/?renderer=canvas')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await tapButton(page, BTN.start)
  await tapButton(page, BTN.start)
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 8_000 })
    .toBe('game')
  await page.waitForTimeout(400)

  // Left stick right: the player walks.
  const x0 = (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.x)) ?? 0
  await page.evaluate(() => {
    ;(window as unknown as { __PAD__: { axes: number[] } }).__PAD__.axes[0] = 1
  })
  await page.waitForTimeout(600)
  await page.evaluate(() => {
    ;(window as unknown as { __PAD__: { axes: number[] } }).__PAD__.axes[0] = 0
  })
  const x1 = (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.x)) ?? 0
  expect(x1, 'the stick did not move the player').toBeGreaterThan(x0)

  // Attack is edge-triggered: holding A must not spend a second special or
  // stack attacks the way a held key never does on the keyboard path.
  await page.waitForTimeout(300)
  const specialsBefore =
    (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.stats.specialsUsed)) ?? 0
  await page.evaluate(() => {
    ;(window as unknown as { __PAD__: { buttons: number[] } }).__PAD__.buttons[2] = 1
  })
  await page.waitForTimeout(1200) // held for many frames
  await page.evaluate(() => {
    ;(window as unknown as { __PAD__: { buttons: number[] } }).__PAD__.buttons[2] = 0
  })
  const specialsAfter =
    (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.stats.specialsUsed)) ?? 0
  expect(specialsAfter - specialsBefore, 'holding the button fired the special more than once').toBe(1)
})

/**
 * Two pads, two players. Gamepad support and co-op were built separately, and
 * at first they did not compose at all: every pad merged into player one, so
 * two people with two controllers could not play.
 */
test('a second controller drives player two', async ({ page }) => {
  await attachGamepad(page, 2)
  await page.goto('/?renderer=canvas')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')

  // Pad two presses attack: that alone should bring player two into the game.
  await page.evaluate(() => {
    ;(window as unknown as { __PAD2__: { buttons: number[] } }).__PAD2__.buttons[0] = 1
  })
  await page.waitForTimeout(160)
  await page.evaluate(() => {
    ;(window as unknown as { __PAD2__: { buttons: number[] } }).__PAD2__.buttons[0] = 0
  })
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.char2Id), { timeout: 6_000 })
    .not.toBeNull()

  // And pad two's stick moves player two, not player one.
  const before = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  await page.evaluate(() => {
    ;(window as unknown as { __PAD2__: { axes: number[] } }).__PAD2__.axes[0] = 1
  })
  await page.waitForTimeout(700)
  await page.evaluate(() => {
    ;(window as unknown as { __PAD2__: { axes: number[] } }).__PAD2__.axes[0] = 0
  })
  const after = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  expect(after?.player2?.x ?? 0).toBeGreaterThan(before?.player2?.x ?? 0)
  expect(after?.player.x).toBe(before?.player.x)
})
