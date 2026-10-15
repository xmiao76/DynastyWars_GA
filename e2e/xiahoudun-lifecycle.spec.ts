import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { devices, expect, test, type Page } from '@playwright/test'
import type { Sim } from '../src/core/sim'
import { ENEMIES } from '../src/core/enemies'
import { makeCombatant } from '../src/core/entities'

test.use({ video: 'on' })
const OUT = 'artifacts/CMR-14B/default-stage2'
// Staged stage2 GU/default-ZF derivation (matches prodbuild/xiahoudun.spec.ts
// partitions): opening = heroes + wave-0 soldier; deferred = later waves +
// boss, queued behind entry and NOT charged to the 12 MiB entry cap; the one
// admitted future kind (stage3 boss xuchu) IS entry-charged. After a full
// settle the published cast is the eventual roster: opening+deferred+future.
const bytesOf = (files: string[]): number => files.reduce((n, f) => n + statSync(`src/game/assets/motion/${f}`).size, 0)
const OPENING_FILES = ['guanyu-motion-sheet.png', 'guanyu-actions-sheet.png', 'zhangfei-motion-sheet.png', 'zhangfei-actions-sheet.png', 'soldier-motion-sheet.png']
const DEFERRED_FILES = ['spearman-motion-sheet.png', 'archer-motion-sheet.png', 'xiahoudun-motion-sheet.png']
const FUTURE_FILES = ['xuchu-motion-sheet.png']
const ENTRY_BYTES = bytesOf([...OPENING_FILES, ...FUTURE_FILES])
const EVENTUAL_BYTES = bytesOf([...OPENING_FILES, ...DEFERRED_FILES, ...FUTURE_FILES])
const EVENTUAL_ROSTER = ['archer', 'guanyu', 'soldier', 'spearman', 'xiahoudun', 'xuchu', 'zhangfei']
const PNG_HASH = 'e1fdf7e8ea2b4128e6c0380e407e79ca8c985ceb63b09a056097da6dd85af34f'
type Live = {
  sim: Sim; paused: boolean; syncSprites(): void
  sprites: Map<number, { frame: { name: string; realWidth: number; realHeight: number }; texture: { key: string }; x: number; y: number; scaleX: number; scaleY: number; displayOriginX: number; displayOriginY: number }>
}
function save(name: string, value: unknown): void {
  mkdirSync(OUT, { recursive: true })
  writeFileSync(`${OUT}/${name}.json`, `${JSON.stringify(value, null, 2)}\n`)
}
async function start(page: Page, renderer = 'canvas', seed = 42): Promise<void> {
  await page.goto(`/?renderer=${renderer}&autopilot=1&motion=1`)
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate((seed) => window.__DW__!.startGame('guanyu', seed, 'stage2'), seed)
  await expect.poll(() => page.evaluate(() => { const g = window.__DW_GAME__?.scene.getScene('game') as unknown as { sim?: Sim }; return window.__DW__?.getSnapshot().sim ? g?.sim?.seed : null }), { timeout: 30000 }).toBe(seed)
}
// Bounded waits (same pattern as motion-loader.spec.ts): never settle()/
// runtime() inside an expect.poll predicate - poll the cheap published-only
// roster, then call this bounded runtime once. The settle is bounded in-page
// by a 20s Promise.race that throws live diagnostic state instead of hanging.
const SETTLE_TIMEOUT_MS = 20_000
const bounded = async <T>(p: Promise<T>, label: string, ms = 10_000): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([p, new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error(`${label}-timeout after ${ms}ms`)), ms) })])
  } finally { if (timer !== undefined) clearTimeout(timer) }
}
const publishedKeys = (page: Page): Promise<string[]> =>
  page.evaluate(() => Object.keys(window.__DW_GAME__!.registry.get('paintedHeroArt')?.motions ?? {}).sort())
async function runtime(page: Page) {
  return page.evaluate(async (timeoutMs) => {
    const path = '/src/game/adapters/motion-art.ts'
    const mod = await import(/* @vite-ignore */ path) as typeof import('../src/game/adapters/motion-art')
    const rt = mod.motionRuntime()
    const scene = window.__DW_GAME__!.scene.getScene('game')
    const diagnostic = (): string => {
      const published = Object.keys(window.__DW_GAME__!.registry.get('paintedHeroArt')?.motions ?? {}).sort()
      const scope = rt.stageScope(scene)
      const kinds = [...new Set([...(scope?.immediate ?? []), ...(scope?.deferred ?? []), ...(scope?.prefetch ?? []), ...(scope?.schedule.map((s) => s.kind) ?? []), ...published])]
      const states = Object.fromEntries(kinds.map((kind) => [kind, rt.state(kind)]))
      const simTick = (scene as unknown as { sim?: { tick: number } }).sim?.tick ?? window.__DW__?.getSnapshot().tick ?? null
      return JSON.stringify({ published, states, budget: rt.budget(), simTick })
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([rt.settle(), new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error(`settle-timeout after ${timeoutMs}ms: ${diagnostic()}`)), timeoutMs) })])
    } finally { if (timer !== undefined) clearTimeout(timer) }
    const g = scene as unknown as Live
    const scope = rt.stageScope(scene)
    return { budget: rt.budget(), bossState: rt.state('xiahoudun'), published: Object.keys(window.__DW_GAME__!.registry.get('paintedHeroArt')?.motions ?? {}).sort(), seed: g.sim.seed, partner: g.sim.player2Id, scope: scope ? { immediate: scope.immediate, deferred: scope.deferred, prefetch: scope.prefetch, plannedBytes: scope.plannedBytes, deferredBytes: scope.deferredBytes } : null }
  }, SETTLE_TIMEOUT_MS)
}
async function isolate(page: Page, ai = false): Promise<void> {
  const def = ENEMIES.xiahoudun!
  const boss = makeCombatant(900001, 'xiahoudun', 'enemy', 250, 232, def.maxHp, def.speed, 'right')
  if (!ai) boss.thinkTick = 999999
  await page.evaluate((boss) => {
    const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live
    g.sim.entities = g.sim.entities.filter((e) => e.id === g.sim.playerId || e.id === g.sim.player2Id)
    const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
    Object.assign(p, { x: 150, y: 232, hp: p.maxHp, invulnerableTicks: 999999 })
    g.sim.entities.push(boss)
    g.sim.cameraLocked = true
    g.syncSprites()
  }, boss)
}
async function sprite(page: Page, actor = 900001) {
  return page.evaluate((actor) => {
    const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live
    g.syncSprites()
    const s = g.sprites.get(actor)!
    return { key: s.frame.name, texture: s.texture.key, tick: g.sim.tick, entity: g.sim.entities.find((e) => e.id === actor)! }
  }, actor)
}

for (const renderer of ['canvas', 'webgl']) {
  test(`fresh default GU/ZF stage2 ${renderer}: publication, full boxes, immediate join and warm restart`, async ({ page }, info) => {
    test.setTimeout(60000)
    const errors: string[] = [], requests: string[] = [], downloads: Array<Promise<{ url: string; bytes: number; hash: string }>> = []
    page.on('pageerror', (error) => errors.push(String(error)))
    page.on('request', (r) => { if (r.resourceType() === 'fetch' && /-sheet\.png/.test(r.url())) requests.push(r.url()) })
    // A body that becomes unavailable (cancelled/navigated-away response)
    // records a sentinel instead of an unhandled rejection: the exact
    // length/byte/hash assertions below still fail on it.
    page.on('response', (r) => { if (r.request().resourceType() === 'fetch' && /-sheet\.png/.test(r.url())) downloads.push(r.body().then((body) => ({ url: r.url(), bytes: body.length, hash: createHash('sha256').update(body).digest('hex') })).catch((e: unknown) => ({ url: r.url(), bytes: -1, hash: `unavailable:${String(e)}` }))) })
    await page.setViewportSize({ width: 960, height: 540 })
    await start(page, renderer)
    // Capture the intro card AT ENTRY: it auto-dismisses after a 3s wall-clock
    // hold, so by the time the staged settle below returns it is legitimately
    // gone - observing it only after settle races that dismissal.
    await expect.poll(() => page.evaluate(() => window.__DW_GAME__!.scene.getScene('hud').children.list.some((o) => o.name === 'introCard')), { timeout: 15_000 }).toBe(true)
    // settle() can resolve while the admitted-future prefetch is still
    // queued behind the deferred set, so poll (exact equality, bounded)
    // until the EVENTUAL roster is published before sampling budget/bytes.
    await expect.poll(() => publishedKeys(page), { timeout: 30_000 }).toEqual(EVENTUAL_ROSTER)
    const entry = await runtime(page)
    // runtime() awaits a full settle: published is the EVENTUAL roster
    // (opening + deferred + admitted future), never a mid-queue snapshot.
    expect(entry.scope).toEqual({ immediate: ['guanyu', 'zhangfei', 'soldier'], deferred: ['spearman', 'archer', 'xiahoudun'], prefetch: ['xuchu'], plannedBytes: ENTRY_BYTES, deferredBytes: bytesOf(DEFERRED_FILES) })
    expect(entry.published).toEqual(EVENTUAL_ROSTER)
    expect(entry.partner, 'ordinary solo start does not silently carry P2').toBeNull()
    expect(entry.budget.sourceBytes).toBe(EVENTUAL_BYTES)
    expect(entry.budget.networkBytes).toBe(EVENTUAL_BYTES)
    expect(entry.budget.caps.stageDownloads).toBe(12 * 1024 * 1024)
    // Only the entry-charged planned bytes sit under the cap; the eventual
    // total exceeds it precisely by the deferred queue.
    expect(ENTRY_BYTES).toBeLessThanOrEqual(entry.budget.caps.stageDownloads)
    expect(EVENTUAL_BYTES - ENTRY_BYTES).toBe(bytesOf(DEFERRED_FILES))
    expect(entry.budget.perFighterDecoded.xiahoudun).toBe(12991664)
    expect(entry.budget.clonedCanvasBytes).toBe(0)
    expect(entry.budget.retainedBytes).toBeLessThanOrEqual(entry.budget.caps.retainedCache)
    const observed = await bounded(Promise.all(downloads), 'response.body')
    expect(observed, 'every eventual page downloaded exactly once').toHaveLength(9)
    expect(observed.reduce((n, r) => n + r.bytes, 0)).toBe(EVENTUAL_BYTES)
    expect(observed.find((r) => r.url.includes('xiahoudun'))?.hash).toBe(PNG_HASH)
    expect(createHash('sha256').update(readFileSync('src/game/assets/motion/xiahoudun-motion-sheet.png')).digest('hex')).toBe(PNG_HASH)
    // Publication is observed before any sim tick (the intro card itself was
    // captured at entry above; its 3s auto-dismiss may already have run).
    expect(await page.evaluate(() => window.__DW__!.getSnapshot().tick)).toBe(0)
    await page.keyboard.press('Enter')
    await expect.poll(() => page.evaluate(() => window.__DW_GAME__!.scene.getScene('hud').children.list.some((o) => o.name === 'introCard'))).toBe(false)
    await isolate(page)
    expect((await sprite(page)).key).toBe('entity:xiahoudun:motion:walk:0')
    expect(await page.evaluate(() => window.__DW__!.joinP2())).toBe(true)
    const partner = await page.evaluate(() => (window.__DW_GAME__!.scene.getScene('game') as unknown as Live).sim.player2Id!)
    expect((await sprite(page, partner)).key).toBe('entity:zhangfei:motion:walk:0')
    const frames: unknown[] = []
    for (const [label, state, stateTick, attackId] of [['guard', 'idle', 0, null], ['heavy', 'attack', 20, 'sword.heavy'], ['prone', 'knockdown', 30, null]] as const) {
      const capture = await page.evaluate(async ({ state, stateTick, attackId }) => {
        const engine = window.__DW_GAME__!, g = engine.scene.getScene('game') as unknown as Live
        const oldPause = g.paused; g.paused = true
        const hud = engine.scene.getScene('hud'), kids = hud.children.list as unknown as Array<{ visible: boolean }>
        const visibility = kids.map((k) => k.visible); hud.scene.pause(); kids.forEach((k) => { k.visible = false })
        try {
          const b = g.sim.entities.find((e) => e.id === 900001)!
          Object.assign(b, { state, stateTick, attackId, x: 250, y: 232, z: 0 })
          g.syncSprites()
          const s = g.sprites.get(b.id)!, cam = (g as unknown as { cameras: { main: { zoom: number; scrollX: number; scrollY: number } } }).cameras.main
          const box = { x: Math.round((s.x - s.displayOriginX * Math.abs(s.scaleX) - cam.scrollX) * cam.zoom), y: Math.round((s.y - s.displayOriginY * Math.abs(s.scaleY) - cam.scrollY) * cam.zoom), w: Math.round(s.frame.realWidth * Math.abs(s.scaleX) * cam.zoom), h: Math.round(s.frame.realHeight * Math.abs(s.scaleY) * cam.zoom) }
          const key = s.frame.name
          // Phaser snapshots at postrender: actual stage pixels, never source PNG crops.
          const bounded10 = <T>(p: Promise<T>, label: string): Promise<T> => Promise.race([p, new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error(`${label}-timeout after 10000ms`)), 10_000))])
          const url = await bounded10(new Promise<string>((resolve) => engine.renderer.snapshot((snap) => resolve((snap as HTMLImageElement).src))), 'renderer.snapshot')
          const image = new Image(); image.src = url; await bounded10(image.decode(), 'image.decode')
          const cv = document.createElement('canvas'); cv.width = box.w * 2; cv.height = box.h * 2
          cv.getContext('2d')!.drawImage(image, -box.x * 2, -box.y * 2, image.width * 2, image.height * 2)
          return { key, snapshotKey: s.frame.name, texture: s.texture.key, box, crop: cv.toDataURL('image/png'), origin: 'injected representative pose, not natural contact', facing: b.facing, tick: g.sim.tick }
        } finally { kids.forEach((k, i) => { k.visible = visibility[i]! }); hud.scene.resume(); g.paused = oldPause }
      }, { state, stateTick, attackId })
      expect(capture.key).toBe(capture.snapshotKey)
      expect(capture.texture).toBe('motion-source:xiahoudun')
      expect(capture.box.x).toBeGreaterThanOrEqual(0); expect(capture.box.y).toBeGreaterThanOrEqual(0)
      expect(capture.box.x + capture.box.w).toBeLessThanOrEqual(960); expect(capture.box.y + capture.box.h).toBeLessThanOrEqual(540)
      mkdirSync(OUT, { recursive: true }); writeFileSync(`${OUT}/${renderer}-${label}.png`, Buffer.from(capture.crop.split(',')[1]!, 'base64'))
      frames.push({ ...capture, crop: undefined, label })
    }
    const before = requests.length
    await page.evaluate(() => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live
      ;(window as unknown as { __XIA_PAGE__: unknown }).__XIA_PAGE__ = window.__DW_GAME__!.registry.get('paintedHeroArt').motions.xiahoudun.sheet
      g.paused = false
      window.__DW__!.startGame('guanyu', 43, 'stage2')
    })
    await expect.poll(() => page.evaluate(() => { const g = window.__DW_GAME__?.scene.getScene('game') as unknown as { sim?: Sim }; return window.__DW__?.getSnapshot().sim ? g?.sim?.seed : null })).toBe(43)
    expect(requests).toHaveLength(before)
    expect(await page.evaluate(() => (window as unknown as { __XIA_PAGE__: unknown }).__XIA_PAGE__ === window.__DW_GAME__!.registry.get('paintedHeroArt').motions.xiahoudun.sheet)).toBe(true)
    expect((await runtime(page)).bossState).toBe('ready')
    expect(errors).toEqual([])
    save(`${renderer}-entry`, { entry, observed, requests, frames, restart: await runtime(page), videoDirectory: info.outputDir, ownerPlayableVideo: true, nativeVideoViewed: false })
  })
}

for (const failure of ['missing', 'corrupt']) {
  test(`Xiahou ${failure} single-page fallback is whole-fighter, valid heroes untouched`, async ({ page }) => {
    test.setTimeout(60000)
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(String(e)))
    await page.route('**/*xiahoudun-motion-sheet.png*', (route) => {
      if (new URL(route.request().url()).searchParams.has('import')) return route.continue()
      return failure === 'missing' ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('not-a-png') })
    })
    await start(page)
    // Full settle: poll the exact eventual roster minus the rejected boss -
    // every other deferred/future sibling still publishes (settle() alone
    // can resolve before the queued prefetch lands).
    await expect.poll(() => publishedKeys(page), { timeout: 30_000 }).toEqual(EVENTUAL_ROSTER.filter((k) => k !== 'xiahoudun'))
    const entry = await runtime(page)
    expect(entry.published).toEqual(EVENTUAL_ROSTER.filter((k) => k !== 'xiahoudun'))
    expect(entry.bossState).toBe('failed')
    await page.keyboard.press('Enter'); await isolate(page)
    const rows = []
    for (const state of ['idle', 'walk', 'hitstun', 'knockdown', 'getup', 'grabbed', 'thrown', 'dying'] as const) {
      await page.evaluate((state) => { const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live; Object.assign(g.sim.entities.find((e) => e.id === 900001)!, { state, stateTick: 4 }); g.syncSprites() }, state)
      // Sole-motion whole-fighter rejection: an unpublished pack kind renders
      // NOTHING in any state - never a partial motion frame or legacy pose.
      const row = await page.evaluate(() => { const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live; g.syncSprites(); const s = g.sprites.get(900001); return s ? { key: s.frame.name, texture: s.texture.key } : null })
      expect(row, `no xiahoudun sprite renders while ${state}`).toBeNull(); rows.push({ state, sprite: row })
    }
    const hero = await page.evaluate(() => (window.__DW_GAME__!.scene.getScene('game') as unknown as Live).sim.playerId)
    expect((await sprite(page, hero)).key).toContain('entity:guanyu:motion:')
    expect(await page.evaluate(() => window.__DW_GAME__!.textures.exists('motion-source:xiahoudun'))).toBe(false)
    expect(errors).toEqual([]); save(`fallback-${failure}`, { entry, rows, errors })
  })
}

test('held late boss request: real scene exit/restart cancels old epoch without stale publication', async ({ page }) => {
  test.setTimeout(60000)
  let release = (): void => {}, held = false
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/*xiahoudun-motion-sheet.png*', async (route) => {
    if (new URL(route.request().url()).searchParams.has('import')) { await route.continue(); return }
    held = true; await gate
    await route.continue().catch(() => undefined) // only our cancelled, held request
  })
  try {
    await page.goto('/?renderer=canvas&autopilot=1&motion=1')
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    await page.evaluate(() => window.__DW__!.startGame('guanyu', 71, 'stage2'))
    await expect.poll(() => held).toBe(true)
    await page.evaluate(() => window.__DW_GAME__!.scene.getScene('game').scene.start('title'))
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    release()
    // Restart into stage3, whose staged scope contains xiahoudun NOWHERE (not
    // a stage kind, no later stage to prefetch): stage1 would now legitimately
    // prefetch him as admitted future, masking any stale publication. Any
    // xiahoudun art after this restart can only be the stale epoch leaking.
    await page.evaluate(() => window.__DW__!.startGame('guanyu', 72, 'stage3'))
    await expect.poll(() => page.evaluate(() => { const g = window.__DW_GAME__?.scene.getScene('game') as unknown as { sim?: Sim }; return window.__DW__?.getSnapshot().sim ? g?.sim?.seed : null }), { timeout: 30000 }).toBe(72)
    const restarted = await runtime(page)
    expect(restarted.published).not.toContain('xiahoudun')
    expect(await page.evaluate(() => window.__DW_GAME__!.textures.exists('motion-source:xiahoudun'))).toBe(false)
    save('late-cancel', { restarted, held, setup: 'real stage2 fetch held by own test route; scene exits before release; ordinary stage3 restart (xiahoudun outside its staged scope)', stalePublication: false })
  } finally { release(); await page.unroute('**/*xiahoudun-motion-sheet.png*').catch(() => {}) }
})

test.describe('real-clock mobile (no autopilot or bridge steps)', () => {
  const { defaultBrowserType: _browser, ...pixel } = devices['Pixel 7 landscape']!
  void _browser
  test.use(pixel)
  test('touch pause freezes Xiahou, resumes, touch attack hits and rAF records five seconds of actual AI', async ({ page }, info) => {
    test.setTimeout(60000)
    const testWallBegan = Date.now(), videoAnchors: Array<{ phase: string; wallSinceTestStartMs: number }> = []
    const anchor = (phase: string): void => { videoAnchors.push({ phase, wallSinceTestStartMs: Date.now() - testWallBegan }) }
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto('/?renderer=webgl&motion=1')
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage2'))
    await expect.poll(() => page.evaluate(() => { const g = window.__DW_GAME__?.scene.getScene('game') as unknown as { sim?: Sim }; return window.__DW__?.getSnapshot().sim ? g?.sim?.seed : null }), { timeout: 30000 }).toBe(42)
    // Xiahou Dun is a DEFERRED (boss) pack: under sole-motion his kind renders
    // nothing until it publishes, so await the full settle (eventual roster)
    // before injecting him - never sample mid-queue.
    await expect.poll(() => publishedKeys(page), { timeout: 30_000 }).toEqual(EVENTUAL_ROSTER)
    const settled = await runtime(page)
    expect(settled.bossState).toBe('ready')
    expect(settled.published).toEqual(EVENTUAL_ROSTER)
    const point = async (name: string) => page.evaluate((name) => {
      const z = window.__DW_GAME__!.scene.getScene('hud').children.list.find((o) => o.name === name) as unknown as { x: number; y: number } | undefined
      if (!z) throw new Error(`missing touch zone ${name}`)
      const r = window.__DW_GAME__!.canvas.getBoundingClientRect()
      return { x: r.left + z.x / 480 * r.width, y: r.top + z.y / 270 * r.height }
    }, name)
    // Dismiss the real intro with touch, not a keyboard or sim-step helper.
    const mid = await page.evaluate(() => { const r = window.__DW_GAME__!.canvas.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
    await page.touchscreen.tap(mid.x, mid.y)
    await expect.poll(() => page.evaluate(() => window.__DW_GAME__!.scene.getScene('hud').children.list.some((o) => o.name === 'introCard'))).toBe(false)
    await isolate(page, true)
    const pause = await point('touchPause')
    await page.touchscreen.tap(pause.x, pause.y)
    await expect.poll(() => page.evaluate(() => (window.__DW_GAME__!.scene.getScene('game') as unknown as Live).paused)).toBe(true)
    const frozen = await sprite(page)
    anchor('touch-pause-frozen')
    await bounded(page.evaluate(() => new Promise<void>((resolve) => {
      const start = performance.now(); let paints = 0
      const sample = () => { paints++; if (paints >= 15 && performance.now() - start >= 250) resolve(); else requestAnimationFrame(sample) }; requestAnimationFrame(sample)
    })), 'rAF-pause-paints')
    const still = await sprite(page)
    expect(still.tick).toBe(frozen.tick); expect(still.key).toBe(frozen.key); expect(still.entity).toEqual(frozen.entity)
    await page.screenshot({ path: `${OUT}/mobile-touch-paused.png` })
    // Near-target idle/position fixture; the ensuing hit comes only from touch A.
    await page.evaluate(() => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live, p = g.sim.entities.find((e) => e.id === g.sim.playerId)!, b = g.sim.entities.find((e) => e.id === 900001)!
      Object.assign(p, { x: 230, y: 232, facing: 'right', state: 'idle', stateTick: 0, attackId: null })
      Object.assign(b, { x: 250, y: 232, state: 'idle', stateTick: 0, thinkTick: 999999, invulnerableTicks: 0 }); g.syncSprites()
    })
    await page.touchscreen.tap(pause.x, pause.y)
    await expect.poll(() => page.evaluate(() => window.__DW__!.getSnapshot().tick)).toBeGreaterThan(still.tick)
    const attack = await page.evaluate(async () => {
      const path = '/src/game/adapters/touch.ts'
      const mod = await import(/* @vite-ignore */ path) as typeof import('../src/game/adapters/touch')
      const a = mod.TOUCH_BUTTONS.find((b) => b.label === 'A')!, r = window.__DW_GAME__!.canvas.getBoundingClientRect()
      return { x: r.left + a.x / 480 * r.width, y: r.top + a.y / 270 * r.height }
    })
    await page.touchscreen.tap(attack.x, attack.y)
    await expect.poll(() => page.evaluate(() => (window.__DW_GAME__!.scene.getScene('game') as unknown as Live).sim.entities.find((e) => e.id === 900001)!.hp)).toBeLessThan(ENEMIES.xiahoudun!.maxHp)
    const hit = await sprite(page)
    anchor('actual-touch-hit')
    // Reset initial idle positions/HP only. Keep real AI think/cadence fields
    // from a newly constructed combatant, no AI tokens/attacks forced.
    await page.evaluate((boss) => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live
      g.sim.entities = g.sim.entities.filter((e) => e.id === g.sim.playerId)
      const p = g.sim.entities[0]!; Object.assign(p, { x: 100, y: 232, hp: p.maxHp, invulnerableTicks: 999999 })
      g.sim.entities.push(boss); g.sim.freezeTicks = 0; g.syncSprites()
    }, makeCombatant(900001, 'xiahoudun', 'enemy', 250, 232, ENEMIES.xiahoudun!.maxHp, ENEMIES.xiahoudun!.speed, 'left'))
    anchor('continuous-real-AI-start')
    const paced = await bounded(page.evaluate(() => new Promise<{ wallMs: number; simDelta: number; ratio: number; rows: unknown[] }>((resolve) => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live, began = performance.now(), tick = g.sim.tick, rows: unknown[] = []
      const sample = () => {
        const b = g.sim.entities.find((e) => e.id === 900001)!, s = g.sprites.get(b.id)!
        rows.push({ wallMs: performance.now() - began, tick: g.sim.tick, state: b.state, stateTick: b.stateTick, attackId: b.attackId, key: s.frame.name, texture: s.texture.key, x: b.x, y: b.y, vx: b.vx, z: b.z, paused: g.paused })
        const wallMs = performance.now() - began
        if (wallMs >= 5000) resolve({ wallMs, simDelta: g.sim.tick - tick, ratio: (g.sim.tick - tick) / 60 / (wallMs / 1000), rows }); else requestAnimationFrame(sample)
      }; requestAnimationFrame(sample)
    })), 'rAF-real-AI-5s')
    anchor('continuous-real-AI-end')
    expect(paced.wallMs).toBeGreaterThanOrEqual(5000); expect(paced.simDelta).toBeGreaterThan(0)
    const rows = paced.rows as Array<{ key: string; x: number; paused: boolean }>
    expect(rows.every((r) => r.key.startsWith('entity:xiahoudun:motion:') && !r.paused)).toBe(true)
    expect(new Set(rows.map((r) => r.key)).size).toBeGreaterThan(1)
    const geometry = await page.evaluate(() => { const game = window.__DW_GAME__!, r = game.canvas.getBoundingClientRect(); return { width: game.canvas.width, height: game.canvas.height, cssWidth: r.width, cssHeight: r.height, viewport: [innerWidth, innerHeight], touchPoints: navigator.maxTouchPoints, dpr: devicePixelRatio, renderer: game.renderer.type } })
    expect(geometry.width).toBe(960); expect(geometry.height).toBe(540); expect(geometry.touchPoints).toBeGreaterThan(0); expect(geometry.viewport[0]!).toBeGreaterThan(geometry.viewport[1]!); expect(geometry.renderer).toBe(2)
    expect(errors).toEqual([])
    save('mobile-real-clock', { frozen, still, hit, paced, videoAnchors, videoAnchorClock: 'elapsed wall since test began; approximate relative native-video timestamp, recorder start offset unmeasured', geometry, budget: (await runtime(page)).budget, errors, fixture: 'initial idle position/HP, invulnerable GU only; real AI/rAF, no manual stepping', clockFreezeResumePassed: true, normalPaceJudgment: 'measured ratio only; independent native-video review still required', videoDirectory: info.outputDir, ownerPlayableVideo: true, nativeVideoViewed: false })
    await page.screenshot({ path: `${OUT}/mobile-real-clock.png` })
  })
})
