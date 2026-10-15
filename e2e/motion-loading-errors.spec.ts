import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, test, type Page, type Route } from '@playwright/test'
import type { Sim } from '../src/core/sim'
import type { MotionFailureState } from '../src/game/adapters/motion-art'

// Default-URL verification of the existing retry/error implementation.
// Network interception affects only fetch bytes, never Vite's PNG import modules.
const OUT = 'artifacts/motion/default-flip/loading-errors'
const SOLDIER = '**/*soldier-motion-sheet.png*'
const ARCHER = '**/*archer-motion-sheet.png*'
const SOLDIER_SHA = '55f3300dcb8acfcf602d08dd57d63d8d048c45b7beb5e96dbb4aa2cf369fd2f1'
const soldierBytes = readFileSync('src/game/assets/motion/soldier-motion-sheet.png')
const archerBytes = readFileSync('src/game/assets/motion/archer-motion-sheet.png')
type Live = {
  sim?: Sim
  built: boolean
  motionGatePending: boolean
  sprites: Map<number, { visible: boolean; texture: { key: string }; frame: { name: string } }>
  motionErrorState(): MotionFailureState | null
}

test.describe.configure({ mode: 'default', timeout: 60_000 })

function track(page: Page) {
  const requests: string[] = [], errors: string[] = []
  page.on('request', (r) => {
    if (r.resourceType() === 'fetch' && /-(motion|actions)-sheet\.png/.test(r.url())) requests.push(r.url())
  })
  page.on('pageerror', (e) => errors.push(String(e)))
  return { requests, errors, count: (kind: string) => requests.filter((url) => url.includes(`/${kind}-motion-sheet.png`)).length }
}

async function boot(page: Page, renderer = 'canvas') {
  await page.goto(`/?renderer=${renderer}&autopilot=1`)
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
}
async function start(page: Page) {
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage1'))
}
async function inspect(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/game/adapters/motion-art.ts'
    const { motionRuntime } = await import(/* @vite-ignore */ path) as typeof import('../src/game/adapters/motion-art')
    const engine = window.__DW_GAME__!, scene = engine.scene.getScene('game')
    const g = scene as unknown as Live, rt = motionRuntime()
    const objects = scene.children.list as unknown as Array<{ name: string; visible: boolean; text?: string; input?: { enabled: boolean }; getBounds(): { x: number; y: number; width: number; height: number } }>
    const ui = objects.filter((o) => o.name.startsWith('motionError')).map((o) => ({ name: o.name, visible: o.visible, text: o.text, interactive: o.input?.enabled, bounds: o.getBounds() }))
    const sprites = [...g.sprites.entries()].map(([id, s]) => ({ id, kind: g.sim?.entities.find((e) => e.id === id)?.kind, visible: s.visible, texture: s.texture.key, frame: s.frame.name }))
    return {
      snapshot: window.__DW__!.getSnapshot(), built: g.built, gatePending: g.motionGatePending,
      error: g.motionErrorState(), soldierState: rt.state('soldier'), soldierFailure: rt.failureState('soldier') ?? null,
      archerState: rt.state('archer'), published: Object.keys(engine.registry.get('paintedHeroArt')?.motions ?? {}).sort(),
      scope: rt.stageScope(scene), sprites, ui, renderer: engine.renderer.type,
      wave: g.built ? g.sim?.waveIndex : null,
      kinds: g.built ? g.sim?.entities.map((e) => e.kind) : [],
      soldierTexture: engine.textures.exists('motion-source:soldier'), touchPoints: navigator.maxTouchPoints,
    }
  })
}
async function settle(page: Page) {
  await page.evaluate(async () => {
    const path = '/src/game/adapters/motion-art.ts'
    const { motionRuntime } = await import(/* @vite-ignore */ path) as typeof import('../src/game/adapters/motion-art')
    await motionRuntime().settle()
  })
}
async function frames(page: Page, n = 30) {
  // Observe real scene updates without advancing a gated simulation ourselves.
  await page.evaluate(async (n) => {
    for (let i = 0; i < n; i++) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }, n)
}
function save(name: string, data: unknown) {
  mkdirSync(OUT, { recursive: true })
  writeFileSync(`${OUT}/${name}.json`, `${JSON.stringify(data, null, 2)}\n`)
}
function noLegacySoldier(state: Awaited<ReturnType<typeof inspect>>) {
  expect(state.sprites.filter((s) => s.kind === 'soldier' && s.visible && !s.frame.startsWith('entity:soldier:motion:'))).toEqual([])
}
function heldPage(page: Page, glob: string, bytes: Buffer) {
  let release!: () => void
  const barrier = new Promise<void>((resolve) => { release = resolve })
  const deliveries: string[] = []
  const handler = async (route: Route) => {
    if (route.request().resourceType() !== 'fetch') return route.continue()
    await barrier
    try {
      await route.fulfill({ status: 200, contentType: 'image/png', body: bytes })
      deliveries.push('fulfilled')
    } catch (error) {
      // A shutdown abort can dispose the intercepted fetch before release.
      deliveries.push(String(error))
    }
  }
  return { install: () => page.route(glob, handler), release: () => release(), deliveries }
}

for (const renderer of ['canvas', 'webgl']) {
  test(`normal entry publishes fighters and advances (${renderer})`, async ({ page }) => {
    const network = track(page)
    await boot(page, renderer)
    expect(network.requests).toEqual([])
    await start(page)
    await expect.poll(async () => (await inspect(page)).built).toBe(true)
    await settle(page)
    const entry = await inspect(page)
    expect(entry.renderer).toBe(renderer === 'canvas' ? 1 : 2)
    expect(entry.scope?.immediate).toEqual(['guanyu', 'zhangfei', 'soldier'])
    expect(entry.published).toEqual(expect.arrayContaining(entry.scope!.immediate))
    expect(entry.soldierState).toBe('ready')
    expect(entry.soldierTexture).toBe(true)
    expect(entry.sprites.filter((s) => s.kind === 'soldier')).toHaveLength(4)
    noLegacySoldier(entry)
    expect(entry.sprites.find((s) => s.kind === 'guanyu')?.frame).toContain('entity:guanyu:motion:')
    expect(entry.error).toBeNull()
    expect(entry.ui).toEqual([])
    await page.evaluate(() => window.__DW__!.step(60))
    await expect.poll(() => page.evaluate(() => window.__DW__!.getSnapshot().tick)).toBe(60)
    expect(network.count('soldier')).toBe(1)
    expect(network.errors).toEqual([])
    save(`normal-${renderer}`, { entry, advanced: await inspect(page), requests: network.requests, errors: network.errors })
  })
}

test('one failed required page retries once, publishes valid bytes and enters without legacy', async ({ page }) => {
  const network = track(page)
  let attempts = 0
  expect(createHash('sha256').update(soldierBytes).digest('hex')).toBe(SOLDIER_SHA)
  await page.route(SOLDIER, (route) => {
    if (route.request().resourceType() !== 'fetch') return route.continue()
    attempts++
    return attempts === 1 ? route.abort('failed') : route.fulfill({ status: 200, contentType: 'image/png', body: soldierBytes })
  })
  await boot(page)
  await start(page)
  await expect.poll(async () => (await inspect(page)).built).toBe(true)
  await settle(page)
  await page.evaluate(() => window.__DW__!.step(60))
  await expect.poll(() => page.evaluate(() => window.__DW__!.getSnapshot().tick)).toBe(60)
  await frames(page)
  const state = await inspect(page)
  save('transient-canvas', { state, attempts, requests: network.requests, errors: network.errors, servedBytes: soldierBytes.length, sha256: SOLDIER_SHA })
  expect(attempts).toBe(2)
  expect(network.count('soldier')).toBe(2)
  expect(state.soldierState).toBe('ready')
  expect(state.soldierFailure).toBeNull()
  expect(state.soldierTexture).toBe(true)
  expect(state.published).toContain('soldier')
  expect(state.error).toBeNull()
  expect(state.ui).toEqual([])
  expect(state.sprites.filter((s) => s.kind === 'soldier')).toHaveLength(4)
  noLegacySoldier(state)
  expect(network.errors).toEqual([])
})

for (const profile of [
  { renderer: 'canvas', width: 960, height: 540, mobile: false },
  { renderer: 'webgl', width: 960, height: 540, mobile: false },
  { renderer: 'canvas', width: 844, height: 390, mobile: true },
]) {
  test.describe(`${profile.renderer} ${profile.width}x${profile.height}`, () => {
    test.use({ viewport: { width: profile.width, height: profile.height }, isMobile: profile.mobile, hasTouch: profile.mobile })
  test(`both required attempts fail: visible reload error, no sim`, async ({ page }) => {
    const { renderer, width, height } = profile, name = `permanent-${renderer}-${width}x${height}`
    const network = track(page)
    await page.setViewportSize({ width, height })
    await page.route(SOLDIER, (route) => route.request().resourceType() === 'fetch' ? route.abort('failed') : route.continue())
    await boot(page, renderer)
    await start(page)
    await expect.poll(async () => (await inspect(page)).error?.kind).toBe('soldier')
    await settle(page)
    const failed = await inspect(page)
    await page.evaluate(() => window.__DW__!.step(600))
    await frames(page, 60)
    const after = await inspect(page)
    await page.screenshot({ path: `${OUT}/${name}.png` })
    save(name, { viewport: page.viewportSize(), failed, after, requests: network.requests, errors: network.errors })
    expect(after.renderer).toBe(renderer === 'canvas' ? 1 : 2)
    if (profile.mobile) expect(after.touchPoints).toBeGreaterThan(0)
    expect(after.soldierFailure).toEqual({ kind: 'soldier', failure: 'missing', attempts: 2, final: true })
    expect(after.soldierState).toBe('failed')
    expect(network.count('soldier'), 'no third attempt after many real updates and queued steps').toBe(2)
    expect(after.error).toEqual(after.soldierFailure)
    expect(after.built).toBe(false)
    expect(failed.snapshot.sim).toBeNull()
    expect(after.snapshot.sim).toBeNull()
    expect(after.snapshot.tick).toBe(failed.snapshot.tick)
    expect(after.published).not.toContain('soldier')
    expect(after.soldierTexture).toBe(false)
    expect(after.sprites).toEqual([])
    noLegacySoldier(after)
    expect(after.ui.find((o) => o.name === 'motionErrorTitle')).toMatchObject({ visible: true, text: 'MOTION ART FAILED TO LOAD' })
    expect(after.ui.find((o) => o.name === 'motionErrorDetail')?.text).toContain('soldier: missing (after one retry)')
    const reload = after.ui.find((o) => o.name === 'motionErrorReload')!
    expect(reload).toMatchObject({ visible: true, text: '[ RELOAD ]', interactive: true })
    expect(reload.bounds.width).toBeGreaterThan(0)
    expect(reload.bounds.y).toBeGreaterThan(0)
    expect(reload.bounds.y + reload.bounds.height).toBeLessThanOrEqual(270)
    expect(network.errors).toEqual([])
    // Exercise the real pointer target; stub only the existing reload hook so
    // this does not reboot and erase the observed retry/failure evidence.
    await page.evaluate(() => {
      const g = window.__DW_GAME__!.scene.getScene('game')
      ;(g.constructor as unknown as { reloadPage: () => void }).reloadPage = () => { document.documentElement.dataset.motionReload = 'clicked' }
    })
    const canvas = await page.locator('canvas').boundingBox()
    expect(canvas).not.toBeNull()
    await page.mouse.click(canvas!.x + canvas!.width / 2, canvas!.y + canvas!.height * 168 / 270)
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motionReload)).toBe('clicked')
  })
  })
}

test('shutdown while a required page is held cancels without stale error or publication', async ({ page }) => {
  const network = track(page), held = heldPage(page, SOLDIER, soldierBytes)
  await held.install()
  await boot(page)
  await start(page)
  await expect.poll(() => network.count('soldier')).toBe(1)
  const loading = await inspect(page)
  expect(loading.built).toBe(false)
  expect(loading.snapshot.sim).toBeNull()
  expect(loading.soldierState).toBe('loading')
  await page.evaluate(() => window.__DW_GAME__!.scene.getScene('game').scene.start('title'))
  await expect.poll(() => page.evaluate(() => window.__DW__!.getSnapshot().scene)).toBe('title')
  const nextScene = await inspect(page)
  held.release()
  await settle(page)
  await frames(page)
  const after = await inspect(page)
  save('shutdown-canvas', { loading, nextScene, after, requests: network.requests, deliveries: held.deliveries, errors: network.errors })
  expect(after.snapshot.scene).toBe('title')
  expect(after.snapshot.sim).toBeNull()
  expect(after.built).toBe(false)
  expect(after.error).toBeNull()
  expect(after.ui).toEqual([])
  expect(after.soldierFailure).toBeNull()
  expect(after.soldierTexture).toBe(false)
  expect(after.published, 'no stale async publication into the next scene').toEqual(nextScene.published)
  expect(after.published).not.toContain('soldier')
  expect(network.count('soldier'), 'cancellation is not retried').toBe(1)
  expect(network.errors).toEqual([])
})

test('deferred archer gates a real wave transition and resumes after valid publication', async ({ page }) => {
  const network = track(page), held = heldPage(page, ARCHER, archerBytes)
  await held.install()
  await boot(page)
  await start(page)
  await expect.poll(async () => (await inspect(page)).built).toBe(true)
  await expect.poll(() => network.count('archer')).toBe(1)
  const opening = await inspect(page)
  expect(opening.scope?.deferred).toContain('archer')
  expect(opening.published).toContain('spearman')
  // Fixture only the current wave's defeat, not waveIndex or the gate. The
  // actual GameScene.update -> stepSim -> updateWaveAndCamera spawns wave 1.
  await page.evaluate(() => {
    const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live
    for (const e of g.sim!.entities) if (e.side === 'enemy') e.state = 'dead'
    window.__DW__!.step(120)
  })
  await expect.poll(async () => (await inspect(page)).wave).toBe(1)
  await expect.poll(async () => (await inspect(page)).gatePending).toBe(true)
  const blocked = await inspect(page)
  await frames(page, 30)
  const stillBlocked = await inspect(page)
  save('deferred-blocked', { opening, blocked, stillBlocked, requests: network.requests })
  expect(blocked.snapshot.tick).toBe(1)
  expect(stillBlocked.snapshot.tick).toBe(1)
  expect(stillBlocked.archerState).toBe('loading')
  expect(stillBlocked.published).not.toContain('archer')
  expect(stillBlocked.kinds).not.toContain('archer')
  expect(stillBlocked.sprites.some((s) => s.kind === 'archer')).toBe(false)
  held.release()
  await expect.poll(() => page.evaluate(() => window.__DW__!.getSnapshot().tick)).toBe(120)
  await settle(page)
  const resumed = await inspect(page)
  expect(resumed.published).toContain('archer')
  expect(resumed.archerState).toBe('ready')
  expect(resumed.error).toBeNull()
  // Let the real core clear wave 1 and spawn the now-published archer in wave 2.
  await page.evaluate(() => {
    const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live
    for (const e of g.sim!.entities) if (e.side === 'enemy') e.state = 'dead'
    window.__DW__!.step(1)
  })
  await expect.poll(async () => (await inspect(page)).wave).toBe(2)
  const spawned = await inspect(page)
  save('deferred-resumed', { resumed, spawned, requests: network.requests, errors: network.errors })
  expect(spawned.kinds).toContain('archer')
  expect(spawned.sprites.find((s) => s.kind === 'archer')?.frame).toContain('entity:archer:motion:')
  expect(network.count('archer')).toBe(1)
  expect(network.errors).toEqual([])
})
