import { expect, test } from '@playwright/test'

/**
 * CMR-03 browser cases for the stage-aware pack loader:
 * - stage/hero/2P/prefetch scope (requests happen at stage entry only),
 * - measured stage-entry downloads inside the contract budget,
 * - restart and stage progression never re-download,
 * - co-op: default/cached heroes join immediately with motion,
 * - network negative controls (missing / wrong-signature / timeout) reject
 *   the whole fighter: sole-motion shows the reload overlay and halts entry
 *   (never a legacy/partial frame) without touching any other art.
 */
test.describe.configure({ mode: 'serial' })

const SHEET = /guanyu-(motion|actions)-sheet/

type LiveGame = {
  sim: { playerId: number; player2Id: number | null; entities: Array<{ id: number; kind: string }> }
  syncSprites(): void
  sprites: Map<number, { texture: { key: string }; frame: { name: string } }>
  motionErrorState(): { kind: string; failure: string; attempts: number; final: boolean } | null
}

const motionError = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame).motionErrorState())

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

// Staged loading queues deferred (later waves/boss) and admitted-future
// (next-stage prefetch inside the entry cap) packs BEHIND the opening set.
// Published-cast assertions therefore poll the cheap published-only roster
// (motionsKeys) and only then call this bounded runtime settle ONCE, comparing
// against the EVENTUAL roster (opening+deferred+admitted future, partitions
// pinned independently in prodbuild/motion.spec.ts) - never a fixed count
// sampled mid-queue, and never settle()/runtime() inside an expect.poll
// predicate (an unbounded in-predicate settle defeats the poll timeout).
// The settle itself is bounded in-page: a 20s Promise.race throws the live
// diagnostic state (published kinds, per-kind rt.state, budget, sim tick)
// instead of hanging the test until the global timeout.
const SETTLE_TIMEOUT_MS = 20_000
const settle = async (page: import('@playwright/test').Page): Promise<{ plannedBytes: number | undefined; deferredBytes: number | undefined; sourceBytes: number }> =>
  page.evaluate(async (timeoutMs) => {
    const path = '/src/game/adapters/motion-art.ts'
    const { motionRuntime } = await import(/* @vite-ignore */ path) as typeof import('../src/game/adapters/motion-art')
    const rt = motionRuntime()
    const scene = window.__DW_GAME__!.scene.getScene('game')
    const diagnostic = (): string => {
      const published = Object.keys(scene.registry.get('paintedHeroArt')?.motions ?? {}).sort()
      const scope = rt.stageScope(scene)
      const kinds = [...new Set([
        ...(scope?.immediate ?? []), ...(scope?.deferred ?? []), ...(scope?.prefetch ?? []),
        ...(scope?.schedule.map((s) => s.kind) ?? []), ...published,
      ])]
      const states = Object.fromEntries(kinds.map((kind) => [kind, rt.state(kind)]))
      const simTick = (scene as unknown as { sim?: { tick: number } }).sim?.tick ?? window.__DW__?.getSnapshot().tick ?? null
      return JSON.stringify({ published, states, budget: rt.budget(), simTick })
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([
        rt.settle(),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error(`settle-timeout after ${timeoutMs}ms: ${diagnostic()}`)), timeoutMs)
        }),
      ])
    } finally {
      if (timer !== undefined) clearTimeout(timer)
    }
    const scope = rt.stageScope(scene)
    return { plannedBytes: scope?.plannedBytes, deferredBytes: scope?.deferredBytes, sourceBytes: rt.budget().sourceBytes }
  }, SETTLE_TIMEOUT_MS)

// Stage1 eventual roster for a guanyu hero (default 2P zhangfei): opening
// [guanyu, zhangfei, soldier] + deferred [spearman, archer, lidian] +
// admitted future [xiahoudun] (xuchu does not fit the remaining entry cap).
const STAGE1_EVENTUAL = ['archer', 'guanyu', 'lidian', 'soldier', 'spearman', 'xiahoudun', 'zhangfei']

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
  // Measured tracked (guanyu) stage-entry downloads.
  const bytes = (await Promise.all(responses.map(async (r) => (await r.body().catch(() => Buffer.alloc(0))).length))).reduce((a, b) => a + b, 0)
  expect(bytes).toBe(1_782_790 + 2_125_731)
  expect(bytes).toBeLessThanOrEqual(12 * 1024 * 1024)
  // The opening set publishes first (the hero renders motion), then the
  // deferred + admitted-future queues settle into the eventual roster.
  // Only planned (opening+future) bytes are charged to the 12 MiB cap.
  await expect.poll(() => spriteId(page, 'playerId'), { timeout: 15_000 }).toBe('entity:guanyu:motion:walk:0')
  // Poll the cheap published-only eventual roster first (settle() can resolve
  // before the queued prefetch publishes); call the bounded runtime once after.
  await expect.poll(async () => (await motionsKeys(page)).sort(), { timeout: 30_000 }).toEqual(STAGE1_EVENTUAL)
  const settled = await settle(page)
  expect(settled).toEqual({ plannedBytes: 11_440_295, deferredBytes: 5_286_177, sourceBytes: 16_726_472 })
  expect(settled.plannedBytes).toBeLessThanOrEqual(12 * 1024 * 1024)
  // Restart (a fresh stage run): zero re-downloads - the pack cache is warm.
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 43, 'stage1'))
  await expect.poll(() => page.evaluate(() => {
    const g = window.__DW_GAME__?.scene.getScene('game') as unknown as { sim?: { seed: number } }
    return g?.sim?.seed
  })).toBe(43)
  expect(requested, 'restart re-downloads nothing').toHaveLength(2)
  await expect.poll(() => spriteId(page, 'playerId'), { timeout: 15_000 }).toBe('entity:guanyu:motion:walk:0')
  // The entry cap charges only NEW (uncached) bytes, so a warm restart's
  // leftover budget also admits the second future kind (xuchu): the
  // re-settled roster is the cold eventual roster plus xuchu, still with
  // zero re-downloads.
  await expect.poll(async () => (await motionsKeys(page)).sort(), { message: 'restart re-settles from cache (warm budget also admits xuchu)', timeout: 30_000 }).toEqual([...STAGE1_EVENTUAL, 'xuchu'].sort())
  await settle(page)
  expect(requested, 'restart settle re-downloads nothing').toHaveLength(2)
  // Stage progression: the roster still resolves to the cached pack.
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 44, 'stage2'))
  await expect.poll(() => page.evaluate(() => {
    const g = window.__DW_GAME__?.scene.getScene('game') as unknown as { sim?: { seed: number } }
    return g?.sim?.seed
  })).toBe(44)
  expect(requested, 'stage progression re-downloads nothing').toHaveLength(2)
  // After a full settle the stage2 eventual roster (its deferred boss
  // xiahoudun and admitted-future xuchu included) is published; packs cached
  // from stage1 may legitimately remain alongside it.
  await expect.poll(async () => (await motionsKeys(page)).sort(), { timeout: 30_000 }).toEqual(expect.arrayContaining(['archer', 'guanyu', 'soldier', 'spearman', 'xiahoudun', 'xuchu', 'zhangfei']))
  await settle(page)
  expect(requested, 'stage2 settle re-downloads no guanyu page').toHaveLength(2)
  expect(errors).toEqual([])
})

test('co-op: the default hero is ready at stage entry and joins immediately with motion', async ({ page }) => {
  test.setTimeout(120_000)
  const { requested, errors } = track(page)
  await page.goto('/?renderer=webgl&autopilot=1&motion=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 15_000 }).toBe('title')
  // zhaoyun has a pack (CMR-10B); his default partner (guanyu) is in the stage scope.
  await page.evaluate(() => window.__DW__!.startGame('zhaoyun', 42, 'stage1'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  await expect.poll(() => requested.length, { timeout: 15_000 }).toBe(2)
  // Full settle: opening [zhaoyun, guanyu 2P, soldier] + deferred
  // [spearman, archer, lidian] + admitted future [xiahoudun].
  await expect.poll(async () => (await motionsKeys(page)).sort(), { timeout: 30_000 }).toEqual(['archer', 'guanyu', 'lidian', 'soldier', 'spearman', 'xiahoudun', 'zhaoyun'])
  const settled = await settle(page)
  expect(settled.plannedBytes).toBeLessThanOrEqual(12 * 1024 * 1024)
  expect(await spriteId(page, 'playerId'), 'the zhaoyun hero shows motion art').toContain(':motion:')
  expect(await page.evaluate(() => window.__DW__!.joinP2!())).toBe(true)
  await expect.poll(() => page.evaluate(() => {
    const game = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
    return game.sim.player2Id !== null
  })).toBe(true)
  expect(await spriteId(page, 'player2Id').then((k) => k.startsWith('entity:guanyu:motion:'))).toBe(true)
  expect(errors).toEqual([])
})

test('missing pack page rejects the fighter whole: reload overlay halts entry, siblings still publish', async ({ page }) => {
  test.setTimeout(120_000)
  await page.route('**/*guanyu-motion-sheet.png*', (route) =>
    new URL(route.request().url()).searchParams.has('import') ? route.continue() : route.abort())
  const { requested, errors } = track(page)
  await page.goto('/?renderer=canvas&autopilot=1&motion=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 15_000 }).toBe('title')
  // zhangfei's own pack loads here; his default partner (guanyu, an immediate
  // entry kind) fails both attempts. Sole-motion: entry HALTS on the reload
  // overlay instead of entering on legacy art (30s ceiling only covers the
  // aborted pack + its one retry under parallel workers).
  await page.evaluate(() => window.__DW__!.startGame('zhangfei', 42, 'stage1'))
  await expect.poll(async () => motionError(page), { timeout: 30_000 }).toEqual({ kind: 'guanyu', failure: 'missing', attempts: 2, final: true })
  expect(await page.evaluate(() => window.__DW__!.getSnapshot().sim), 'no sim ever builds on a failed required kind').toBeNull()
  // Atomic rejection: the first failed page stops the pack (no later pages).
  // After a full settle, guanyu has failed whole while every other staged
  // sibling (deferred mooks/boss-to-be and admitted future included)
  // publishes - the eventual roster minus guanyu, nothing partial.
  await expect.poll(() => requested.length, { timeout: 15_000 }).toBeGreaterThanOrEqual(1)
  await expect.poll(async () => (await motionsKeys(page)).sort(), { message: 'zhangfei publishes; guanyu rejected whole, nothing partial', timeout: 30_000 }).toEqual(STAGE1_EVENTUAL.filter((k) => k !== 'guanyu'))
  await settle(page)
  expect(await page.evaluate(() => window.__DW_GAME__!.textures.exists('motion-source:guanyu')), 'no guanyu texture is ever published').toBe(false)
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
  // Sole-motion: the hero's own garbage sheet halts entry on the reload
  // overlay (no sim, no legacy frame); after a full settle every other
  // staged sibling still publishes (eventual minus guanyu).
  await expect.poll(async () => motionError(page), { timeout: 30_000 }).toEqual({ kind: 'guanyu', failure: 'wrong-signature', attempts: 2, final: true })
  expect(await page.evaluate(() => window.__DW__!.getSnapshot().sim), 'no sim ever builds on a failed required kind').toBeNull()
  await expect.poll(async () => (await motionsKeys(page)).sort(), { timeout: 30_000 }).toEqual(STAGE1_EVENTUAL.filter((k) => k !== 'guanyu'))
  await settle(page)
  expect(await page.evaluate(() => window.__DW_GAME__!.textures.exists('motion-source:guanyu')), 'no guanyu texture is ever published').toBe(false)
  // Other valid art survives the rejection: portraits and sibling motions
  // stay published, and the retired heroes/bodies fields never reappear.
  expect(await page.evaluate(() => {
    const art = window.__DW_GAME__!.scene.getScene('game').registry.get('paintedHeroArt') as { portraits?: Record<string, unknown>; motions?: Record<string, unknown> }
    return {
      portraits: Object.keys(art.portraits ?? {}).length > 0,
      motions: Object.keys(art.motions ?? {}).length > 0,
      legacyFields: ['heroes', 'bodies'].filter((key) => Object.hasOwn(art, key)),
    }
  })).toEqual({ portraits: true, motions: true, legacyFields: [] })
  expect(errors).toEqual([])
})

test('a hung pack download times out within the bound and entry halts on the reload overlay', async ({ page }) => {
  test.setTimeout(120_000)
  // Held route barrier: each hung request parks its route here; the finally
  // below aborts every held route so a failure/timeout can never leave a
  // request (and the page/context teardown) hanging on this barrier.
  const heldReleases: Array<() => void> = []
  await page.route('**/*guanyu-actions-sheet.png*', (route) => {
    if (new URL(route.request().url()).searchParams.has('import')) return route.continue()
    return new Promise<void>((resolve) => {
      heldReleases.push(() => { void route.abort().catch(() => {}).finally(resolve) })
    })
  })
  try {
    const { requested, errors } = track(page)
    await page.goto('/?renderer=canvas&autopilot=1&motion=1')
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 15_000 }).toBe('title')
    const began = Date.now()
    await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage1'))
    // Sole-motion: the 8s page timeout fails attempt one and the 12s stage
    // deadline cuts its in-flight retry (recorded attempts stay 1 - the retry
    // never completed; its request is counted below), rejecting guanyu whole:
    // entry halts on the reload overlay, never a legacy/partial frame.
    await expect.poll(async () => motionError(page), { timeout: 30_000 }).toEqual({ kind: 'guanyu', failure: 'timeout', attempts: 1, final: true })
    expect(Date.now() - began, 'bounded: the final timeout lands without the hung page').toBeLessThan(25_000)
    expect(await page.evaluate(() => window.__DW__!.getSnapshot().sim), 'no sim ever builds on a failed required kind').toBeNull()
    // Guanyu is the FIRST immediate kind and the deadline aborts the whole
    // loading episode (no background queue is even started), so after settle
    // NOTHING has published - unlike a fast failure, where siblings continue.
    // The hung page is never attempted a third time.
    await expect.poll(async () => (await motionsKeys(page)).sort(), { timeout: 30_000 }).toEqual([])
    await settle(page)
    expect(await motionsKeys(page).then((keys) => keys.includes('guanyu')), 'whole fighter rejected, never partial').toBe(false)
    expect(requested.filter((u) => u.includes('guanyu-actions-sheet')), 'initial attempt + one retry, no third').toHaveLength(2)
    expect(errors).toEqual([])
  } finally {
    for (const release of heldReleases.splice(0)) release()
    await page.unroute('**/*guanyu-actions-sheet.png*').catch(() => {})
  }
})
