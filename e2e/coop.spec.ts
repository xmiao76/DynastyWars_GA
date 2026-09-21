import { expect, test } from '@playwright/test'

/**
 * Two-player co-op, drop-in. Player two is ABSENT until they press one of
 * their own keys, which is what keeps every single-player guarantee - and the
 * whole existing suite - unchanged.
 */

async function startStage(page: import('@playwright/test').Page): Promise<void> {
  // Deliberately NOT autopilot: these tests are about real keyboard input, and
  // under autopilot the sim only advances on bridge ticks, so the keyboard
  // adapters are never read at all.
  await page.goto('/?renderer=canvas')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
}

test('player two is absent until they press a key', async ({ page }) => {
  await startStage(page)
  const before = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  expect(before?.player2).toBeNull()
  expect(before?.char2Id).toBeNull()

  // Player one's keys must not drag a second player in.
  await page.keyboard.press('z')
  await page.keyboard.press('x')
  await page.waitForTimeout(200)
  expect(await page.evaluate(() => window.__DW__?.getSnapshot().sim?.player2)).toBeNull()
})

test('pressing F drops player two in as a different hero', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await startStage(page)
  await page.keyboard.press('f')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.char2Id), { timeout: 5_000 })
    .not.toBeNull()

  const sim = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  // A drop-in join has no select screen, so it must not hand out the hero
  // player one is already using - two identical figures would be unreadable.
  expect(sim?.char2Id).not.toBe(sim?.charId)
  expect(sim?.player2?.hp).toBeGreaterThan(0)
  // Both heroes are on screen, each with its own sprite.
  const heroKeys = await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('game')
    const chars = [window.__DW__?.getSnapshot().sim?.charId, window.__DW__?.getSnapshot().sim?.char2Id]
    return (scene?.children.list ?? [])
      .filter((c) => c.type === 'Sprite')
      .map((c) => (c as unknown as { texture: { key: string } }).texture.key)
      .filter((k) => chars.some((c) => c && k.includes(c)))
  })
  expect(new Set(heroKeys).size, 'both players should render their own hero').toBe(2)
  expect(pageErrors).toEqual([])
})

test('each player is driven by their own keys', async ({ page }) => {
  await startStage(page)
  await page.keyboard.press('f')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.char2Id), { timeout: 5_000 })
    .not.toBeNull()
  const before = await page.evaluate(() => window.__DW__?.getSnapshot().sim)

  // Hold player two's right key only: player one must not move.
  await page.keyboard.down('d')
  await page.waitForTimeout(700)
  await page.keyboard.up('d')
  const after = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  expect(after?.player2?.x ?? 0).toBeGreaterThan(before?.player2?.x ?? 0)
  expect(after?.player.x).toBe(before?.player.x)
})

/**
 * A player who goes down while the other fights on must be able to get back
 * up. Before this, a downed co-op player was out for the rest of the stage:
 * the run carried on without them and their continues sat unspent, because the
 * continue overlay only appears once EVERYONE is down.
 */
test('a downed player spends a continue to rejoin', async ({ page }) => {
  await startStage(page)
  await page.keyboard.press('f')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.char2Id), { timeout: 5_000 })
    .not.toBeNull()

  // Put player two down, leaving player one fighting.
  await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('game') as unknown as {
      sim: { entities: Array<{ id: number; hp: number; state: string }>; player2Id: number | null }
    }
    const p2 = scene.sim.entities.find((e) => e.id === scene.sim.player2Id)
    if (p2) {
      p2.hp = 0
      p2.state = 'dead'
    }
  })
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.player2?.state), { timeout: 5_000 })
    .toBe('dead')
  // One player down does not end the run.
  expect(await page.evaluate(() => window.__DW__?.getSnapshot().sim?.phase)).toBe('fight')
  const livesBefore = (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.lives)) ?? 0

  await page.keyboard.press('f')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.player2?.state), { timeout: 5_000 })
    .not.toBe('dead')
  const after = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  expect(after?.lives, 'rejoining should cost a continue').toBe(livesBefore - 1)
  expect(after?.player2?.hp).toBeGreaterThan(0)
})

/**
 * A co-op game has to survive the stage break. Player two used to be dropped
 * at every transition - the next stage built a fresh sim that knew nothing
 * about them - so they had to rejoin each stage and lost their hero. The same
 * transition also CRASHED: the scene instance is reused, `children.removeAll`
 * destroys the HUD, and the stale references left behind were then used.
 */
test('co-op survives a stage transition, without crashing', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await startStage(page)
  await page.keyboard.press('f')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.char2Id), { timeout: 5_000 })
    .not.toBeNull()
  const char2 = await page.evaluate(() => window.__DW__?.getSnapshot().sim?.char2Id)

  await page.evaluate(() => window.__DW__?.forceResult())
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('result')
  await page.keyboard.press('Enter')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 8_000 })
    .toBe('game')
  await page.waitForTimeout(400)

  const next = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  expect(next?.stageId, 'should have advanced a stage').not.toBe('stage1')
  expect(next?.char2Id, 'player two should carry into the next stage').toBe(char2)
  expect(next?.player2?.hp).toBeGreaterThan(0)
  // The stale-HUD crash surfaced here as an uncaught TypeError.
  expect(pageErrors).toEqual([])
})

/**
 * A party wipe puts the continue prompt up for BOTH players. Whoever answers
 * it should be the one who comes back: the overlay's Enter/Start/tap revives
 * player one, and player two answering on their own keys has to revive player
 * two. It used to revive player one whoever asked.
 */
test('a party wipe revives whichever player answers the continue', async ({ page }) => {
  await startStage(page)
  await page.keyboard.press('f')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.char2Id), { timeout: 5_000 })
    .not.toBeNull()

  await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('game') as unknown as {
      sim: { entities: Array<{ side: string; hp: number; state: string }> }
    }
    for (const e of scene.sim.entities) {
      if (e.side === 'hero') {
        e.hp = 0
        e.state = 'dead'
      }
    }
  })
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.phase), { timeout: 5_000 })
    .toBe('gameover')
  const livesBefore = (await page.evaluate(() => window.__DW__?.getSnapshot().sim?.lives)) ?? 0

  // Player two answers on their key, so player two is who gets back up.
  await page.keyboard.press('f')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.player2?.state), { timeout: 5_000 })
    .not.toBe('dead')
  const after = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  expect(after?.player.state, 'player one did not ask, so should still be down').toBe('dead')
  expect(after?.lives).toBe(livesBefore - 1)
  expect(after?.phase).toBe('fight')
})
