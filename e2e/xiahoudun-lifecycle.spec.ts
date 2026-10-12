import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { devices, expect, test, type Page } from '@playwright/test'
import type { Sim } from '../src/core/sim'
import { ENEMIES } from '../src/core/enemies'
import { makeCombatant } from '../src/core/entities'

test.use({ video: 'on' })
const OUT = 'artifacts/CMR-14B/default-stage2'
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
async function runtime(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/game/adapters/motion-art.ts'
    const mod = await import(/* @vite-ignore */ path) as typeof import('../src/game/adapters/motion-art')
    const rt = mod.motionRuntime()
    await rt.settle()
    const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live
    return { budget: rt.budget(), bossState: rt.state('xiahoudun'), published: Object.keys(window.__DW_GAME__!.registry.get('paintedHeroArt')?.motions ?? {}).sort(), seed: g.sim.seed, partner: g.sim.player2Id }
  })
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
    page.on('response', (r) => { if (r.request().resourceType() === 'fetch' && /-sheet\.png/.test(r.url())) downloads.push(r.body().then((body) => ({ url: r.url(), bytes: body.length, hash: createHash('sha256').update(body).digest('hex') }))) })
    await page.setViewportSize({ width: 960, height: 540 })
    await start(page, renderer)
    const entry = await runtime(page)
    expect(entry.published).toEqual(['guanyu', 'soldier', 'xiahoudun', 'zhangfei'])
    expect(entry.partner, 'ordinary solo start does not silently carry P2').toBeNull()
    expect(entry.budget.sourceBytes).toBe(12372346)
    expect(entry.budget.networkBytes).toBe(12372346)
    expect(entry.budget.caps.stageDownloads).toBe(12582912)
    expect(entry.budget.sourceBytes).toBeLessThan(entry.budget.caps.stageDownloads)
    expect(entry.budget.perFighterDecoded.xiahoudun).toBe(12991664)
    expect(entry.budget.clonedCanvasBytes).toBe(0)
    expect(entry.budget.retainedBytes).toBeLessThanOrEqual(entry.budget.caps.retainedCache)
    const observed = await Promise.all(downloads)
    expect(observed.reduce((n, r) => n + r.bytes, 0)).toBe(12372346)
    expect(observed.find((r) => r.url.includes('xiahoudun'))?.hash).toBe(PNG_HASH)
    expect(createHash('sha256').update(readFileSync('src/game/assets/motion/xiahoudun-motion-sheet.png')).digest('hex')).toBe(PNG_HASH)
    // Publication is observed while the untouched intro still prevents any sim tick.
    expect(await page.evaluate(() => window.__DW__!.getSnapshot().tick)).toBe(0)
    await expect.poll(() => page.evaluate(() => window.__DW_GAME__!.scene.getScene('hud').children.list.some((o) => o.name === 'introCard'))).toBe(true)
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
          const url = await new Promise<string>((resolve) => engine.renderer.snapshot((snap) => resolve((snap as HTMLImageElement).src)))
          const image = new Image(); image.src = url; await image.decode()
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
    const entry = await runtime(page)
    expect(entry.published).toEqual(['guanyu', 'soldier', 'zhangfei'])
    expect(entry.bossState).toBe('failed')
    await page.keyboard.press('Enter'); await isolate(page)
    const rows = []
    for (const state of ['idle', 'walk', 'hitstun', 'knockdown', 'getup', 'grabbed', 'thrown', 'dying'] as const) {
      await page.evaluate((state) => { const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live; Object.assign(g.sim.entities.find((e) => e.id === 900001)!, { state, stateTick: 4 }); g.syncSprites() }, state)
      const row = await sprite(page); expect(row.key).not.toContain(':motion:'); expect(row.texture).not.toContain('motion-source:xiahoudun'); rows.push(row)
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
    await page.evaluate(() => window.__DW__!.startGame('guanyu', 72, 'stage1'))
    await expect.poll(() => page.evaluate(() => { const g = window.__DW_GAME__?.scene.getScene('game') as unknown as { sim?: Sim }; return window.__DW__?.getSnapshot().sim ? g?.sim?.seed : null }), { timeout: 30000 }).toBe(72)
    const restarted = await runtime(page)
    expect(restarted.published).not.toContain('xiahoudun')
    expect(await page.evaluate(() => window.__DW_GAME__!.textures.exists('motion-source:xiahoudun'))).toBe(false)
    save('late-cancel', { restarted, held, setup: 'real stage2 fetch held by own test route; scene exits before release; ordinary stage1 restart', stalePublication: false })
  } finally { release() }
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
    await page.evaluate(() => new Promise<void>((resolve) => {
      const start = performance.now(); let paints = 0
      const sample = () => { paints++; if (paints >= 15 && performance.now() - start >= 250) resolve(); else requestAnimationFrame(sample) }; requestAnimationFrame(sample)
    }))
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
    const paced = await page.evaluate(() => new Promise<{ wallMs: number; simDelta: number; ratio: number; rows: unknown[] }>((resolve) => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live, began = performance.now(), tick = g.sim.tick, rows: unknown[] = []
      const sample = () => {
        const b = g.sim.entities.find((e) => e.id === 900001)!, s = g.sprites.get(b.id)!
        rows.push({ wallMs: performance.now() - began, tick: g.sim.tick, state: b.state, stateTick: b.stateTick, attackId: b.attackId, key: s.frame.name, texture: s.texture.key, x: b.x, y: b.y, vx: b.vx, z: b.z, paused: g.paused })
        const wallMs = performance.now() - began
        if (wallMs >= 5000) resolve({ wallMs, simDelta: g.sim.tick - tick, ratio: (g.sim.tick - tick) / 60 / (wallMs / 1000), rows }); else requestAnimationFrame(sample)
      }; requestAnimationFrame(sample)
    }))
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
