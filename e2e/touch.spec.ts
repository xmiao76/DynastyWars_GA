import { devices } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../src/core/constants'
import { CHARACTER_ORDER } from '../src/core/characters'

/**
 * Touch input, under real device emulation.
 *
 * Before this existed the game was a public URL that no phone could play: on
 * iPhone 13, Pixel 7 and iPad the canvas scaled correctly and nothing errored,
 * but a tap did nothing and the scene never left the title.
 */

test.use({ ...devices['Pixel 7'] })

/**
 * Map a point in the game's logical 480x270 space to a screen coordinate.
 * The canvas is letterboxed and centred by Phaser's FIT scaling, so tapping
 * raw viewport coordinates would hit the wrong control.
 */
async function tapGamePoint(
  page: import('@playwright/test').Page,
  gx: number,
  gy: number,
): Promise<{ x: number; y: number }> {
  const box = await page.evaluate(() => {
    const r = window.__DW_GAME__!.canvas.getBoundingClientRect()
    return { left: r.left, top: r.top, width: r.width, height: r.height }
  })
  return {
    x: Math.round(box.left + (gx / SCREEN_WIDTH) * box.width),
    y: Math.round(box.top + (gy / SCREEN_HEIGHT) * box.height),
  }
}

/** Which card the tap test picks. Not 0: that is where the cursor starts. */
const TAPPED_CARD = 3

async function reachGame(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/?renderer=canvas')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  const mid = await tapGamePoint(page, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2)
  await page.touchscreen.tap(mid.x, mid.y)
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 8_000 })
    .toBe('select')
  // Tap a SPECIFIC hero's card, asking the scene where that card is rather
  // than hard-coding a screen point. The point used to be the middle of the
  // screen, which silently stopped being the third card the moment the select
  // screen was relaid out - the test then failed for a layout reason while
  // reading like an input bug.
  const cards = await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('select')
    if (!scene) return []
    return scene.children.list
      .filter((c) => c.type === 'Zone')
      .map((c) => {
        const z = c as unknown as { x: number; y: number }
        return { x: z.x, y: z.y }
      })
      .sort((a, b) => a.x - b.x)
  })
  expect(cards.length, 'the select screen has no hero cards to tap').toBe(5)
  const target = cards[TAPPED_CARD]
  expect(target).toBeTruthy()
  const card = await tapGamePoint(page, target?.x ?? 0, target?.y ?? 0)
  await page.touchscreen.tap(card.x, card.y)
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 8_000 })
    .toBe('game')
}

test('a tap drives the menus, and picks the hero that was tapped', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await reachGame(page)
  // Deliberately NOT the first card: the cursor starts on that one, so tapping
  // it would pass whether or not the tap picked anything.
  const charId = await page.evaluate(() => window.__DW__?.getSnapshot().sim?.charId)
  expect(charId, 'tapping a card should pick that hero, not the default').toBe(
    CHARACTER_ORDER[TAPPED_CARD],
  )
  expect(pageErrors).toEqual([])
})

test('the on-screen controls move the player and reach the sim', async ({ page }) => {
  await reachGame(page)
  await page.waitForTimeout(500)

  // Hold the d-pad's right arm. `touchscreen.tap` is press+release in one go,
  // which yields at most a frame of movement; a sustained hold needs real
  // touch events, dispatched through CDP.
  const cdp = await page.context().newCDPSession(page)
  const right = await tapGamePoint(page, 63, SCREEN_HEIGHT - 46)
  const x0 = (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.x)) ?? 0
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: right.x, y: right.y }],
  })
  await page.waitForTimeout(800)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForTimeout(200)
  const x1 = (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.x)) ?? 0
  expect(x1, 'the d-pad did not move the player').toBeGreaterThan(x0)

  // The special button costs HP, so it proves the press reached the SIM rather
  // than only playing an animation.
  const special = await tapGamePoint(page, SCREEN_WIDTH - 56, SCREEN_HEIGHT - 74)
  const hpBefore = (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.hp)) ?? 0
  await page.touchscreen.tap(special.x, special.y)
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.stats.specialsUsed), { timeout: 5_000 })
    .toBeGreaterThanOrEqual(1)
  const hpAfter = (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.hp)) ?? 0
  expect(hpAfter).toBeLessThan(hpBefore)
})

test('desktop gets no on-screen controls', async ({ browser }) => {
  // A separate, touchless context: the controls must not appear for mouse
  // users, and must not alter the frames the vision gate measures.
  const ctx = await browser.newContext({ hasTouch: false, isMobile: false })
  const page = await ctx.newPage()
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')

  const touchZones = await page.evaluate(() => {
    // The on-screen controls are drawn into the HUD scene; count Zones in both
    // so this cannot pass by looking at the wrong display list.
    const g = window.__DW_GAME__
    const scenes = [g?.scene.getScene('game'), g?.scene.getScene('hud')]
    if (scenes.some((s) => !s)) return -1
    return scenes.reduce((n, s) => n + (s?.children.list.filter((c) => c.type === 'Zone').length ?? 0), 0)
  })
  expect(touchZones, 'touch controls were built on a device with no touchscreen').toBe(0)
  await ctx.close()
})

/**
 * Dying on a phone must not be the end of the run. The continue overlay says
 * CONTINUE? and used to be answerable only with Enter or a gamepad's Start -
 * GameScene had no pointer handler at all - so a touch player who lost a life
 * simply could not carry on.
 */
test('a touch player can continue after dying', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')

  // Stand still until the stage kills the player.
  const neutral = {
    up: false, down: false, left: false, right: false,
    attackPressed: false, jumpPressed: false, specialPressed: false,
  }
  for (let i = 0; i < 100; i += 1) {
    const snap = await page.evaluate(() => window.__DW__?.getSnapshot())
    if (snap?.sim?.phase === 'gameover') break
    const before = snap?.tick ?? 0
    await page.evaluate(
      (inputs) => window.__DW__?.run(inputs),
      Array.from({ length: 60 }, () => neutral),
    )
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().tick), { timeout: 5_000 })
      .toBeGreaterThanOrEqual(before + 60)
  }
  expect(await page.evaluate(() => window.__DW__?.getSnapshot().sim?.phase)).toBe('gameover')
  const livesBefore = (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.lives)) ?? 0

  // A tap - the only thing a phone can offer - spends a life and revives.
  const mid = await tapGamePoint(page, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2)
  await page.touchscreen.tap(mid.x, mid.y)
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.phase), { timeout: 8_000 })
    .not.toBe('gameover')
  const livesAfter = (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.lives)) ?? 0
  expect(livesAfter).toBe(livesBefore - 1)
})

/**
 * Four directions plus three action buttons plus the pause button. Hard-coded
 * rather than imported from the adapter: that module imports Phaser at the top
 * level, which does not survive being loaded into the Node process the spec
 * runs in.
 */
const TOUCH_ZONES = 8

/** What the HUD scene is actually drawing of the on-screen controls. */
async function readControls(page: import('@playwright/test').Page): Promise<{
  drawnZones: number
  interactive: number
  pads: number
  labels: number
  padVisible: boolean
} | null> {
  return page.evaluate(() => {
    const hud = window.__DW_GAME__?.scene.getScene('hud')
    if (!hud) return null
    const list = hud.children.list as unknown as Array<{
      type: string
      name: string
      visible?: boolean
      alpha?: number
    }>
    const pad = list.find((c) => c.name === 'touchPad')
    return {
      drawnZones: list.filter((c) => c.type === 'Zone').length,
      // Phaser's own registry of what can receive a pointer, which is the half
      // that never broke.
      interactive: ((hud.input as unknown as { _list?: unknown[] })?._list ?? []).length,
      pads: list.filter((c) => c.name === 'touchPad').length,
      labels: list.filter((c) => c.name === 'touchLabel').length,
      padVisible: Boolean(pad?.visible) && (pad?.alpha ?? 0) > 0,
    }
  })
}

/**
 * The controls a player can touch must be controls they can SEE.
 *
 * This is the assertion the suite did not have, and its absence shipped: the
 * d-pad and the A/B/C buttons were built into the HUD scene by `GameScene`, the
 * HUD then swept its own display list, and `children.removeAll(true)` - whose
 * argument is `skipCallback`, not `destroyChild` - unlinked them without
 * destroying them. The Graphics and labels stopped being drawn; the Zones
 * stayed registered with the input plugin and kept working. Every existing
 * touch test drives the input system, so all of them stayed green while the
 * game was unplayable on a phone in the one way that matters: you could not see
 * what to press.
 *
 * So it asserts on the DISPLAY LIST, and requires the two counts to agree.
 */
test('every on-screen control a player can touch is one they can see', async ({ page }) => {
  await reachGame(page)
  await page.waitForTimeout(500)

  const c = await readControls(page)
  expect(c, 'there is no hud scene to inspect').not.toBeNull()
  expect(c?.pads, 'the d-pad is not on the HUD display list').toBe(1)
  expect(c?.padVisible, 'the d-pad is on the display list but not drawable').toBe(true)
  expect(c?.labels, 'the A/B/C button labels are not on the HUD display list').toBe(3)
  expect(c?.drawnZones, 'the hit zones are not on the HUD display list').toBe(TOUCH_ZONES)
  expect(
    c?.interactive,
    'there are hit zones the input system knows about that nothing draws',
  ).toBe(c?.drawnZones)
})

/**
 * And they have to come back for stage two. The HUD rebuilds its entire display
 * list per stage, so the controls are re-mounted rather than carried over - if
 * that ever stops happening the phone loses its controls one stage in, which is
 * worse than never having them because it looks like a crash.
 */
test('the on-screen controls survive a stage transition', async ({ page }) => {
  await reachGame(page)
  await page.waitForTimeout(400)
  await page.evaluate(() => window.__DW__?.forceResult())
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('result')
  const next = await tapGamePoint(page, SCREEN_WIDTH / 2, SCREEN_HEIGHT - 60)
  await page.touchscreen.tap(next.x, next.y)
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 10_000 })
    .toBe('game')
  await page.waitForTimeout(600)

  const c = await readControls(page)
  expect(c?.pads, 'stage two has no d-pad').toBe(1)
  expect(c?.labels, 'stage two has no button labels').toBe(3)
  expect(c?.drawnZones, 'stage two has no hit zones').toBe(TOUCH_ZONES)
  expect(c?.interactive, 'stage two draws controls the input system does not know about').toBe(
    TOUCH_ZONES,
  )
})

/** Read every visible, non-empty label on the title screen. */
async function titleLabels(page: import('@playwright/test').Page): Promise<string[]> {
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  return page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('title')
    if (!scene) return []
    return scene.children.list
      .filter((c) => c.type === 'Text')
      .map((c) => (c as unknown as { text: string; visible: boolean }))
      .filter((c) => c.visible && c.text.trim() !== '')
      .map((c) => c.text)
  })
}

/** Controls a touchscreen does not have, so must never be told to press. */
const KEYBOARD_ONLY = ['ARROWS', 'ENTER', 'WASD', 'PRESS F', 'F/G/H', 'M  MUTE', 'Z  ATTACK', 'X  JUMP']

/**
 * The title screen names the controls the device actually has.
 *
 * A phone was told "ARROWS MOVE / Z ATTACK / X JUMP", "ENTER CONFIRM / M MUTE"
 * and "2P: PRESS F TO JOIN" - none of which a touchscreen has - while the d-pad
 * and A/B/C buttons it is about to be handed went unmentioned. It is the first
 * screen every phone player sees. The screen already knew it was a touch device
 * (the prompt underneath said TAP TO START), so the control plate was the one
 * place that had not been told.
 *
 * Checked in BOTH directions on purpose. A test that only asserted "no keyboard
 * words on a phone" would be satisfied by deleting the plate outright, so the
 * desktop half requires the keyboard legend to still be there.
 */
test('the title names the controls the device actually has', async ({ page, browser }) => {
  await page.goto('/?renderer=canvas')
  const touchLines = await titleLabels(page)
  expect(touchLines.length, 'the title screen has no labels to inspect').toBeGreaterThan(3)

  const wrong = touchLines.filter((l) => KEYBOARD_ONLY.some((k) => l.includes(k)))
  expect(wrong, 'the title tells a touchscreen to press keys it does not have').toEqual([])
  const joined = touchLines.join(' | ')
  expect(joined, 'the title never mentions the d-pad the player is about to be given').toContain(
    'D-PAD',
  )
  expect(joined, 'the title never names the A button').toContain('A  ATTACK')
  expect(joined, 'the title never names the B button').toContain('B  JUMP')

  // The other direction: a mouse-and-keyboard player must still be told the keys.
  const ctx = await browser.newContext({ hasTouch: false, isMobile: false })
  const desktop = await ctx.newPage()
  await desktop.goto('/?renderer=canvas')
  const deskLines = (await titleLabels(desktop)).join(' | ')
  expect(deskLines, 'the keyboard legend went missing on desktop').toContain('ARROWS')
  expect(deskLines, 'the keyboard legend went missing on desktop').toContain('ENTER  CONFIRM')
  expect(deskLines, 'the co-op line went missing on desktop').toContain('PRESS F TO JOIN')
  await ctx.close()
})

/**
 * The game fits the screen, and its controls stay reachable, in EITHER
 * orientation.
 *
 * `#game` carried `min-height: 100vh` and no definite height. Phaser's
 * `Scale.FIT` measures that element to decide how big the canvas may be, and
 * given a box that can grow it satisfied the width and let the height run: on a
 * Pixel 7 in landscape (863x360) the canvas came out 863x485 anchored at the
 * top, so a quarter of the game sat below the fold. What was down there was the
 * on-screen controls - the d-pad at viewport y=403 and two of the three buttons
 * at 414 and 421, against a 360px window. Only C could be pressed.
 *
 * Every touch test in this file runs Pixel 7 PORTRAIT, where fitting to width
 * is the right answer, so four of them passed over a game that could not be
 * played in the orientation anybody would hold it in. This one checks both, and
 * checks the zones rather than the drawing, because reachability is a property
 * of the hit area.
 */
test('the game fits the screen and keeps its controls reachable in any orientation', async ({
  browser,
}) => {
  for (const [label, profile] of [
    ['portrait', devices['Pixel 7']],
    ['landscape', devices['Pixel 7 landscape']],
  ] as const) {
    const ctx = await browser.newContext({ ...profile })
    const page = await ctx.newPage()
    await page.goto('/?renderer=canvas&autopilot=1')
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
    await page.waitForTimeout(500)

    const report = await page.evaluate(() => {
      const game = window.__DW_GAME__
      const hud = game?.scene.getScene('hud')
      if (!game || !hud) return null
      const r = game.canvas.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      // One logical unit in CSS pixels. The game is authored 480x270.
      const unit = r.height / 270
      const zones = (hud.children.list as unknown as Array<{ type: string; x: number; y: number }>)
        .filter((c) => c.type === 'Zone')
        .map((z) => ({ x: r.left + z.x * unit, y: r.top + z.y * unit }))
      return {
        vw,
        vh,
        canvas: { top: r.top, left: r.left, width: r.width, height: r.height },
        zoneCount: zones.length,
        // 1px of rounding slack; anything past that is real overflow.
        overflows: [
          r.width > vw + 1 ? `canvas is ${Math.round(r.width)}px wide in a ${vw}px viewport` : '',
          r.height > vh + 1 ? `canvas is ${Math.round(r.height)}px tall in a ${vh}px viewport` : '',
        ].filter(Boolean),
        unreachable: zones
          .filter((z) => z.x < 0 || z.y < 0 || z.x > vw || z.y > vh)
          .map((z) => `a control sits at (${Math.round(z.x)}, ${Math.round(z.y)})`),
      }
    })

    expect(report, `${label}: could not read the game`).not.toBeNull()
    expect(report?.zoneCount, `${label}: no on-screen controls to check`).toBe(TOUCH_ZONES)
    expect(
      report?.overflows,
      `${label}: the canvas does not fit the screen (viewport ${report?.vw}x${report?.vh})`,
    ).toEqual([])
    expect(
      report?.unreachable,
      `${label}: on-screen controls fall outside the ${report?.vw}x${report?.vh} viewport`,
    ).toEqual([])
    await ctx.close()
  }
})

/**
 * Turning the handset re-fits the game.
 *
 * Phaser polls its parent for size changes and refits when they differ, which
 * is why a desktop window resize has always worked. An orientation change does
 * not reach that path: `ScaleManager`'s resize listener calls `updateBounds()`
 * and THEN marks itself dirty, so the poll that follows asks
 * `getParentBounds()` again, finds the recorded bounds already equal, returns
 * false, and never refreshes. Measured before the fix, turning a Pixel 7:
 * `scale.parentSize` read a correct 915x412 while `scale.displaySize` was
 * still the portrait 412x232. Rotating back then left a landscape-sized canvas
 * overflowing a portrait viewport with four of the seven controls off the edge
 * - and the overflow itself dragged the reported viewport out to 492x1093.
 *
 * Rotation is the one viewport event a phone is guaranteed to produce, and a
 * player in portrait has every reason to turn the device, so this is the state
 * the game is most likely to be put into.
 */
test('turning the phone re-fits the game and keeps the controls on screen', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page)
  type Orientation = 'portraitPrimary' | 'landscapePrimary'
  const rotate = (
    width: number,
    height: number,
    type: Orientation,
    angle: number,
  ): Promise<unknown> =>
    cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2.625,
      mobile: true,
      screenOrientation: { type, angle },
    })

  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  await page.waitForTimeout(500)

  const fitReport = (): Promise<{ note: string; stale: boolean; offscreen: number } | null> =>
    page.evaluate(() => {
      const game = window.__DW_GAME__
      const hud = game?.scene.getScene('hud')
      if (!game || !hud) return null
      const r = game.canvas.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      // Scale.FIT: the largest whole-canvas scale that fits both axes.
      const fit = Math.min(vw / 960, vh / 540)
      const unit = r.height / 270
      const zones = (hud.children.list as unknown as Array<{ type: string; x: number; y: number }>)
        .filter((c) => c.type === 'Zone')
        .map((z) => ({ x: r.left + z.x * unit, y: r.top + z.y * unit }))
      return {
        note:
          `viewport ${vw}x${vh}, canvas ${Math.round(r.width)}x${Math.round(r.height)}, ` +
          `expected ${Math.round(960 * fit)}x${Math.round(540 * fit)}`,
        stale: Math.abs(r.width - 960 * fit) > 2 || Math.abs(r.height - 540 * fit) > 2,
        offscreen: zones.filter((z) => z.x < 0 || z.y < 0 || z.x > vw || z.y > vh).length,
      }
    })

  for (const [label, w, h, type, angle] of [
    ['landscape', 915, 412, 'landscapePrimary', 90],
    ['back to portrait', 412, 915, 'portraitPrimary', 0],
  ] as const) {
    await rotate(w, h, type, angle)
    // A frame for the deferred refit, and room for the poll behind it.
    await page.waitForTimeout(700)
    const report = await fitReport()
    expect(report, `${label}: could not read the game`).not.toBeNull()
    expect(report?.stale, `${label}: the canvas kept the previous orientation's size - ${report?.note}`).toBe(
      false,
    )
    expect(
      report?.offscreen,
      `${label}: on-screen controls left the viewport - ${report?.note}`,
    ).toBe(0)
  }
})
