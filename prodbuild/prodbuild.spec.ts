import { devices, expect, test } from '@playwright/test'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type Phaser from 'phaser'
import { assessWeaponReach, drawnWidth, type SpriteImage } from '../vision/sprite-metrics'
import { MIN_WEAPON_REACH_PX } from '../vision/thresholds'

/**
 * THE PRODUCTION-BUILD GATE.
 *
 * Every other check drives the Vite DEV server, but `dist/` is what deploys.
 * That gap is the last of three that let broken builds ship this week, and it
 * is the one that matters most, because the dev server and the production
 * bundle genuinely differ: minification, `define` substitution, the relative
 * `base`, and how static files are served.
 *
 * The bug this closes lived in exactly that gap. `__HAS_BAKED_ART__` is a
 * build-time constant, so whether the game asks a server for art is decided by
 * the BUILD, and no dev-server test can tell you what the built bundle does.
 *
 * These tests run against `npm run preview`, serving the real `dist/`.
 */

const PREVIEW = 'http://localhost:4321'

test('the production build boots and renders the shipped art', async ({ page }) => {
  const pageErrors: string[] = []
  const failedRequests: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  page.on('response', (res) => {
    if (!res.ok() && !res.url().includes('favicon')) failedRequests.push(`${res.status()} ${res.url()}`)
  })

  await page.goto(`${PREVIEW}/?renderer=canvas&autopilot=1`, { waitUntil: 'networkidle' })
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')

  // The relative `base` has to resolve: a broken base shows up as 404s, not
  // as a crash, so assert on the requests rather than on the scene alone.
  expect(failedRequests, 'the built bundle failed to load something').toEqual([])
  expect(pageErrors).toEqual([])

  // Characters render, and the weapon reaches: the attack pose extends further
  // sideways than idle. The placeholder art that used to ship had an attack
  // frame NARROWER than its idle frame, which is what "the spear does not move"
  // looked like on the deployed site.
  //
  // This measures the DRAWN silhouette, not the frame box. The two are the same
  // thing only while every pose is cropped tight; the moment a pose is drawn
  // into a uniform box - the normal shape for a fighting-game sprite set - the
  // frame widths go equal and a frame-box comparison fails a build that is
  // perfectly fine, while empty padding could just as easily pass one that is
  // not. `assessWeaponReach` is imported rather than reimplemented so this gate
  // and the vision gate cannot drift apart.
  const shots = await page.evaluate(() => {
    const game = window.__DW_GAME__ as Phaser.Game | undefined
    if (!game) return null
    const read = (key: string): { width: number; height: number; data: number[] } | null => {
      const src = game.textures.get(key).getSourceImage() as CanvasImageSource & {
        width: number
        height: number
      }
      const cv = document.createElement('canvas')
      cv.width = src.width
      cv.height = src.height
      const ctx = cv.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(src, 0, 0)
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data
      return { width: cv.width, height: cv.height, data: Array.from(d) }
    }
    return { idle: read('entity:zhaoyun:idle'), attack: read('entity:zhaoyun:attack') }
  })
  expect(shots?.idle, 'the built bundle rendered no idle texture').toBeTruthy()
  expect(shots?.attack, 'the built bundle rendered no attack texture').toBeTruthy()
  if (!shots?.idle || !shots.attack) return

  const toImage = (s: { width: number; height: number; data: number[] }): SpriteImage => ({
    width: s.width,
    height: s.height,
    data: Uint8Array.from(s.data),
  })
  const idle = toImage(shots.idle)
  const attack = toImage(shots.attack)
  expect(drawnWidth(idle), 'the shipped idle sprite draws nothing').toBeGreaterThan(0)

  const reach = assessWeaponReach(idle, attack, 'zhaoyun', MIN_WEAPON_REACH_PX)
  expect(reach.failures, `the shipped art shows no weapon: ${JSON.stringify(reach)}`).toEqual([])
})

test('the production build never asks a server for baked art it does not ship', async ({ page }) => {
  const artRequests: string[] = []
  page.on('request', (req) => {
    if (/assets\/(manifest\.json|sprites\/|portraits\/)/.test(req.url())) artRequests.push(req.url())
  })
  // Serve a stale manifest, exactly as a CDN edge cache or an older
  // deployment would. The built bundle must not go looking for it.
  await page.route('**/assets/manifest.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sprites: { zhaoyun: ['idle'] }, portraits: [] }),
    }),
  )

  await page.goto(`${PREVIEW}/?renderer=canvas&autopilot=1`, { waitUntil: 'networkidle' })
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')

  expect(artRequests, 'the built bundle went looking for baked art it does not ship').toEqual([])
})

test('the production build draws its HUD bars', async ({ page }) => {
  await page.goto(`${PREVIEW}/?renderer=canvas&autopilot=1`, { waitUntil: 'networkidle' })
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  await page.waitForTimeout(600)

  // Read the bars' own record of what they drew, then sample the SHIPPED
  // canvas where they claim to be. The earlier version asked whether three bar
  // textures held any pixels; the bars are Graphics now, and in any case the
  // question worth asking of a production bundle is whether colour reaches the
  // screen, not whether an asset exists.
  const result = await page.evaluate(() => {
    const game = window.__DW_GAME__ as Phaser.Game | undefined
    const scene = game?.scene.getScene('hud')
    if (!game || !scene) return { bars: 0, coloured: 0, area: 0 }
    const bars = scene.children.list
      .filter((c) => (c as unknown as { visible: boolean }).visible)
      .map((c) => (c as unknown as { getData?: (k: string) => unknown }).getData?.('bar'))
      .filter((b): b is { x: number; y: number; w: number; h: number; ratio: number } => !!b)
    const canvas = game.canvas
    const ctx = canvas.getContext('2d')
    if (!ctx || bars.length === 0) return { bars: bars.length, coloured: 0, area: 0 }
    // The canvas is RENDER_SCALE times the logical space the HUD is authored
    // in; derive the factor rather than hard-coding it.
    const scale = canvas.width / 480
    let coloured = 0
    let area = 0
    for (const bar of bars) {
      const x0 = Math.round(bar.x * scale)
      const y0 = Math.round(bar.y * scale)
      const w = Math.max(1, Math.round(bar.w * bar.ratio * scale))
      const h = Math.max(1, Math.round(bar.h * scale))
      const d = ctx.getImageData(x0, y0, w, h).data
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i] ?? 0
        const g = d[i + 1] ?? 0
        const b = d[i + 2] ?? 0
        area += 1
        if (Math.max(r, g, b) - Math.min(r, g, b) > 50 && (r + g + b) / 3 > 40) coloured += 1
      }
    }
    return { bars: bars.length, coloured, area }
  })

  expect(result.bars, 'the built bundle drew no HUD bars').toBeGreaterThan(0)
  expect(result.area, 'the HUD bars have no area').toBeGreaterThan(0)
  expect(
    result.coloured / Math.max(1, result.area),
    `HUD bars are only ${Math.round((result.coloured / Math.max(1, result.area)) * 100)}% coloured in the built bundle`,
  ).toBeGreaterThan(0.3)
})

/**
 * The SHIPPED page fits a phone, and its viewport-height fallback survives
 * minification.
 *
 * FIX-4 gave `#game` a definite height, because `Scale.FIT` measures that
 * element and a box that can grow makes it fit to width and overflow downward
 * - which on a phone in landscape pushed the d-pad and two of the three action
 * buttons off the bottom of the screen. It was written the standard way:
 *
 *     height: 100vh;
 *     height: 100dvh;
 *
 * and the production minifier read that as a duplicate property and kept only
 * the last, so the shipped CSS carried `height:100dvh` alone. A browser
 * without `dvh` - iOS Safari 15.3 and earlier - drops that as invalid, is left
 * with no height, and gets the overflow back. Every check of that fix until
 * now ran against the dev server, where the source CSS is served as written.
 *
 * So this asserts both halves: the built page actually fits a phone, and the
 * non-dvh fallback is still present in what ships. The second is not implied
 * by the first, because the browser running these tests supports `dvh` and
 * would pass the layout check on the enhancement alone.
 */
test('the shipped page fits a phone, fallback included', async ({ browser }) => {
  const css = await readFile(
    (await readdir(join('dist', 'assets'))).map((f) => join('dist', 'assets', f)).find((f) => f.endsWith('.css')) ??
      '',
    'utf8',
  )
  // Anchored to a declaration boundary on purpose. A bare `toContain` here
  // also matches `min-height:100vh`, which is precisely the thing FIX-4
  // replaced - the gate would have passed on the bug it exists to catch.
  expect(
    /[{;]height:\s*100vh/.test(css),
    'the shipped CSS has no dvh-independent height for #game: a browser without dvh gets no height at all',
  ).toBe(true)
  expect(css, 'the dynamic-viewport enhancement is missing from the shipped CSS').toContain('100dvh')

  for (const [label, profile] of [
    ['portrait', devices['Pixel 7']],
    ['landscape', devices['Pixel 7 landscape']],
  ] as const) {
    const ctx = await browser.newContext({ ...profile })
    const page = await ctx.newPage()
    await page.goto(`${PREVIEW}/?renderer=canvas&autopilot=1`, { waitUntil: 'networkidle' })
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
      const unit = r.height / 270
      const zones = (hud.children.list as unknown as Array<{ type: string; x: number; y: number }>)
        .filter((c) => c.type === 'Zone')
        .map((z) => ({ x: r.left + z.x * unit, y: r.top + z.y * unit }))
      return {
        note: `viewport ${vw}x${vh}, canvas ${Math.round(r.width)}x${Math.round(r.height)}`,
        overflows: r.width > vw + 1 || r.height > vh + 1,
        zoneCount: zones.length,
        offscreen: zones.filter((z) => z.x < 0 || z.y < 0 || z.x > vw || z.y > vh).length,
      }
    })
    expect(report, `${label}: could not read the shipped game`).not.toBeNull()
    expect(report?.zoneCount, `${label}: the shipped build drew no on-screen controls`).toBe(7)
    expect(report?.overflows, `${label}: the shipped canvas does not fit - ${report?.note}`).toBe(false)
    expect(
      report?.offscreen,
      `${label}: shipped on-screen controls fall outside the viewport - ${report?.note}`,
    ).toBe(0)
    await ctx.close()
  }
})
