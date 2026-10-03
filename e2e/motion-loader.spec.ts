import { expect, test } from '@playwright/test'

/**
 * CMR-03 browser cases for the stage-aware pack loader:
 * - stage/hero/2P/prefetch scope (requests happen at stage entry only),
 * - measured stage-entry downloads inside the contract budget,
 * - restart and stage progression never re-download,
 * - co-op: default/cached heroes join immediately, an uncached optional hero
 *   is prepared before the core join and a bounded failure joins whole-legacy,
 * - network negative controls (missing / wrong-signature / timeout) reject
 *   the whole fighter without touching any other art.
 */
test.describe.configure({ mode: 'serial' })

const SHEET = /guanyu-(motion|actions)-sheet/

type LiveGame = {
  sim: { playerId: number; player2Id: number | null; entities: Array<{ id: number; kind: string }> }
  syncSprites(): void
  sprites: Map<number, { texture: { key: string }; frame: { name: string } }>
}

function track(page: import('@playwright/test').Page): {
  requested: string[]
  responses: Array<{ url: string; body: () => Promise<Buffer> }>
  errors: string[]
} {
  const requested: string[] = []
  const responses: Array<{ url: string; body: () => Promise<Buffer> }> = []
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('request', (r) => { if (SHEET.test(r.url()) && r.resourceType() !== 'script') requested.push(r.url()) })
  page.on('response', (res) => {
    if (SHEET.test(res.url()) && res.request().resourceType() !== 'script') responses.push({ url: res.url(), body: () => res.body() })
  })
  return { requested, responses, errors }
}

const spriteId = (page: import('@playwright/test').Page, id: 'playerId' | 'player2Id'): Promise<string> =>
  page.evaluate((which) => {
    const game = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
    game.syncSprites()
    const s = game.sprites.get(game.sim[which]!)!
    return s.frame.name === '__BASE' ? s.texture.key : s.frame.name
  }, id)

const motionsKeys = (page: import('@playwright/test').Page): Promise<string[]> =>
  page.evaluate(() => Object.keys(window.__DW_GAME__!.scene.getScene('game').registry.get('paintedHeroArt')?.motions ?? {}))

test('stage-scoped loading: measured downloads, restart and stage progression never re-download', async ({ page }) => {
  test.setTimeout(120_000)
  const { requested, responses, errors } = track(page)
  await page.goto('/?renderer=canvas&autopilot=1&motion=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 15_000 }).toBe('title')
  expect(requested, 'no all-cast boot downloads').toEqual([])
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage1'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  await expect.poll(() => requested.length, { timeout: 15_000 }).toBe(2)
  await expect.poll(() => responses.length, { timeout: 15_000 }).toBe(2)
  expect(await motionsKeys(page)).toEqual(['guanyu'])
  expect(await spriteId(page, 'playerId')).toBe('entity:guanyu:motion:walk:0')
  // Measured stage-entry downloads (contract: <= 12 MiB).
  const bytes = (await Promise.all(responses.map(async (r) => (await r.body().catch(() => Buffer.alloc(0))).length))).reduce((a, b) => a + b, 0)
  expect(bytes).toBe(1_782_790 + 2_545_709)
  expect(bytes).toBeLessThanOrEqual(12 * 1024 * 1024)
  // Restart (a fresh stage run): zero re-downloads - the pack cache is warm.
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 43, 'stage1'))
  await expect.poll(() => page.evaluate(() => {
    const g = window.__DW_GAME__?.scene.getScene('game') as unknown as { sim?: { seed: number } }
    return g?.sim?.seed
  })).toBe(43)
  expect(requested, 'restart re-downloads nothing').toHaveLength(2)
  expect(await spriteId(page, 'playerId')).toBe('entity:guanyu:motion:walk:0')
  // Stage progression: the roster still resolves to the cached pack.
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 44, 'stage2'))
  await expect.poll(() => page.evaluate(() => {
    const g = window.__DW_GAME__?.scene.getScene('game') as unknown as { sim?: { seed: number } }
    return g?.sim?.seed
  })).toBe(44)
  expect(requested, 'stage progression re-downloads nothing').toHaveLength(2)
  expect(await motionsKeys(page)).toEqual(['guanyu'])
  expect(errors).toEqual([])
})

test('co-op: the default hero is ready at stage entry and joins immediately with motion', async ({ page }) => {
  test.setTimeout(120_000)
  const { requested, errors } = track(page)
  await page.goto('/?renderer=webgl&autopilot=1&motion=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 15_000 }).toBe('title')
  // zhaoyun has no pack; his default partner (guanyu) is in the stage scope.
  await page.evaluate(() => window.__DW__!.startGame('zhaoyun', 42, 'stage1'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  await expect.poll(() => requested.length, { timeout: 15_000 }).toBe(2)
  expect(await motionsKeys(page)).toEqual(['guanyu'])
  expect(await page.evaluate(() => window.__DW__!.joinP2!())).toBe(true)
  await expect.poll(() => page.evaluate(() => {
    const game = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
    return game.sim.player2Id !== null
  })).toBe(true)
  expect(await spriteId(page, 'player2Id').then((k) => k.startsWith('entity:guanyu:motion:'))).toBe(true)
  expect(errors).toEqual([])
})

test('missing pack page rejects the fighter and a co-op join falls back whole-legacy', async ({ page }) => {
  test.setTimeout(120_000)
  await page.route('**/*guanyu-motion-sheet.png*', (route) =>
    new URL(route.request().url()).searchParams.has('import') ? route.continue() : route.abort())
  const { requested, errors } = track(page)
  await page.goto('/?renderer=canvas&autopilot=1&motion=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 15_000 }).toBe('title')
  // zhangfei's own pack loads here; his default partner (guanyu) fails to load.
  await page.evaluate(() => window.__DW__!.startGame('zhangfei', 42, 'stage1'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  // Atomic rejection: the first failed page stops the pack (no later pages).
  await expect.poll(() => requested.length, { timeout: 15_000 }).toBeGreaterThanOrEqual(1)
  await expect.poll(() => motionsKeys(page), { message: 'zhangfei publishes; guanyu falls back whole, nothing partial', timeout: 15_000 }).toEqual(['zhangfei'])
  // Uncached optional hero: the join prepares the pack first (bounded); the
  // bounded failure joins the hero with whole-legacy art.
  expect(await page.evaluate(() => window.__DW__!.joinP2!())).toBe(true)
  await expect.poll(() => page.evaluate(() => {
    const game = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
    return game.sim.player2Id !== null
  })).toBe(true)
  expect(await spriteId(page, 'player2Id').then((k) => k.includes(':motion:'))).toBe(false)
  expect(await spriteId(page, 'playerId').then((k) => k.includes(':motion:')), 'the hero with a valid pack shows motion art').toBe(true)
  expect(await motionsKeys(page)).toEqual(['zhangfei'])
  expect(errors).toEqual([])
})

test('wrong-signature bytes reject the fighter (SHA-256 mismatch), other art untouched', async ({ page }) => {
  test.setTimeout(120_000)
  await page.route('**/*guanyu-motion-sheet.png*', (route) =>
    new URL(route.request().url()).searchParams.has('import')
      ? route.continue()
      : route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('not-a-png') }))
  const { errors } = track(page)
  await page.goto('/?renderer=canvas&autopilot=1&motion=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 15_000 }).toBe('title')
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage1'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  expect(await motionsKeys(page)).toEqual([])
  expect(await spriteId(page, 'playerId').then((k) => k.includes(':motion:'))).toBe(false)
  // Hero/body art (the fighter's other valid art) survives the rejection.
  expect(await page.evaluate(() => {
    const art = window.__DW_GAME__!.scene.getScene('game').registry.get('paintedHeroArt') as { heroes?: Record<string, unknown>; bodies?: unknown }
    return { heroes: Object.keys(art.heroes ?? {}).length > 0, bodies: art.bodies !== undefined }
  })).toEqual({ heroes: true, bodies: true })
  expect(errors).toEqual([])
})

test('a hung pack download times out within the bound and the stage falls back to legacy', async ({ page }) => {
  test.setTimeout(120_000)
  await page.route('**/*guanyu-actions-sheet.png*', (route) =>
    new URL(route.request().url()).searchParams.has('import') ? route.continue() : new Promise<void>(() => {}))
  const { requested, errors } = track(page)
  await page.goto('/?renderer=canvas&autopilot=1&motion=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 15_000 }).toBe('title')
  const began = Date.now()
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage1'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 30_000 }).toBe('game')
  expect(Date.now() - began, 'bounded: the stage enters without the hung page').toBeLessThan(25_000)
  await expect.poll(() => requested.length, { timeout: 15_000 }).toBe(2)
  expect(await motionsKeys(page), 'whole fighter legacy, never partial').toEqual([])
  expect(await spriteId(page, 'playerId').then((k) => k.includes(':motion:'))).toBe(false)
  expect(errors).toEqual([])
})
