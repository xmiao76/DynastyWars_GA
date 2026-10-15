import { devices, expect, test } from '@playwright/test'
import { readFile, readdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { PNG } from 'pngjs'
import type Phaser from 'phaser'
import type { Sim } from '../src/core/sim'
import { attackById } from '../src/core/attacks'
import zhaoyun from '../src/game/assets/motion/zhaoyun-prepared.json' with { type: 'json' }
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
 * The retired baked-art path once let a cached manifest replace shipped art.
 * Check the actual bundle and requests: even the former debug parameter must
 * be inert, regardless of what an old deployment or CDN can still serve.
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

  expect(new URL(page.url()).searchParams.has('motion')).toBe(false)
  // Scene activation precedes asynchronous stage construction. Require both
  // the stage and Zhao Yun's published pack/sprite, not just bridge.scene.
  await expect.poll(() => page.evaluate(() => {
    const engine = window.__DW_GAME__!
    const live = engine.scene.getScene('game') as unknown as {
      built: boolean; sim?: Sim; sprites: Map<number, Phaser.GameObjects.Sprite>
    }
    return !!(live.built && live.sim && engine.registry.get('paintedHeroArt')?.motions?.zhaoyun &&
      live.sprites.get(live.sim.playerId)?.frame.name.includes(':zhaoyun:motion:'))
  })).toBe(true)

  // zy.jab1's first active tick is 5; clip mapping commits jab1:2 for
  // [startup, startup+active). Legacy attack textures/ticks are NOT its oracle.
  // Read the actual sprite's selected atlas rect, then compare alpha bytes,
  // opaque colours and bounds with the independent PNG + full-cell metadata.
  const attackDef = attackById('zy.jab1')
  expect({ startup: attackDef.startup, active: attackDef.active }).toEqual({ startup: 5, active: 3 })
  const shots = await page.evaluate(({ startup, active }) => {
    const live = window.__DW_GAME__!.scene.getScene('game') as unknown as {
      sim: Sim; syncSprites(): void; sprites: Map<number, Phaser.GameObjects.Sprite>
    }
    const p = live.sim.entities.find((e) => e.id === live.sim.playerId)!
    const saved = { ...p }
    const capture = (state: 'idle' | 'attack', tick: number) => {
      Object.assign(p, { state, stateTick: tick, attackId: state === 'attack' ? 'zy.jab1' : null,
        facing: 'right', z: 0, invulnerableTicks: 0 })
      const before = JSON.stringify(live.sim)
      live.syncSprites()
      const s = live.sprites.get(p.id)!, f = s.frame
      const cv = document.createElement('canvas')
      cv.width = f.cutWidth; cv.height = f.cutHeight
      const ctx = cv.getContext('2d')!
      ctx.drawImage(s.texture.getSourceImage() as CanvasImageSource,
        f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, cv.width, cv.height)
      return { name: f.name, texture: s.texture.key, cut: [f.cutX, f.cutY, f.cutWidth, f.cutHeight],
        trim: [f.x, f.y], full: [f.realWidth, f.realHeight],
        scale: [s.scaleX, s.scaleY], origin: [s.displayOriginX, s.displayOriginY],
        ground: [s.x - p.x, s.y - p.y], visible: s.visible, alpha: s.alpha, flip: s.flipX,
        coreUnchanged: before === JSON.stringify(live.sim),
        data: Array.from(ctx.getImageData(0, 0, cv.width, cv.height).data) }
    }
    try {
      return [capture('idle', 0), capture('attack', 1), capture('attack', startup), capture('attack', startup + active - 1)]
    } finally { Object.assign(p, saved); live.syncSprites() }
  }, { startup: attackDef.startup, active: attackDef.active })
  const ids = ['walk:0', 'jab1:0', 'jab1:2', 'jab1:2'] as const
  const atlas = PNG.sync.read(readFileSync('src/game/assets/motion/zhaoyun-motion-sheet.png'))
  // Canvas unpremultiplication may round RGB at translucent edges. Preserve
  // every alpha byte and all opaque RGB; do not mistake that rounding for art.
  const hash = (data: Uint8Array) => {
    const canonical = Uint8Array.from(data)
    for (let i = 0; i < canonical.length; i += 4) {
      if (canonical[i + 3] !== 255) canonical.fill(0, i, i + 3)
    }
    return createHash('sha256').update(canonical).digest('hex')
  }
  const bounds = (data: Uint8Array, w: number, trimX: number, trimY: number) => {
    let left = Infinity, right = -Infinity, bottom = -Infinity, opaque = 0
    for (let i = 3; i < data.length; i += 4) {
      if (data[i]! < 16) continue
      const pixel = (i - 3) / 4, x = pixel % w + trimX, y = Math.floor(pixel / w) + trimY
      left = Math.min(left, x); right = Math.max(right, x); bottom = Math.max(bottom, y); opaque++
    }
    return { left, right, bottom, opaque, width: (right - left + 1) / zhaoyun.density,
      forward: (right - zhaoyun.box.width * zhaoyun.density / 2) / zhaoyun.density }
  }
  const measured = shots.map((shot, i) => {
    const id = ids[i]!, cell = zhaoyun.frames[id]
    const expected = Buffer.alloc(cell.w * cell.h * 4)
    for (let y = 0; y < cell.h; y++) {
      atlas.data.copy(expected, y * cell.w * 4,
        ((cell.y + y) * atlas.width + cell.x) * 4,
        ((cell.y + y) * atlas.width + cell.x + cell.w) * 4)
    }
    expect(shot.name).toBe(`entity:zhaoyun:motion:${id}`)
    expect(shot.texture).toBe('motion-source:zhaoyun')
    expect(shot.cut).toEqual([cell.x, cell.y, cell.w, cell.h])
    expect(shot.trim).toEqual([cell.trimX, cell.trimY])
    expect(shot.full).toEqual([cell.srcW, cell.srcH])
    expect(shot.scale).toEqual([1 / zhaoyun.density, 1 / zhaoyun.density])
    expect(shot.origin).toEqual([cell.srcW / 2, zhaoyun.box.groundY * zhaoyun.density])
    expect(shot.ground).toEqual([0, 0])
    expect([shot.visible, shot.alpha, shot.flip, shot.coreUnchanged]).toEqual([true, 1, false, true])
    // Exact source identity rejects blanks, placeholders and idle substitution.
    const actual = Uint8Array.from(shot.data)
    expect(hash(actual)).toBe(hash(expected))
    const observed = bounds(actual, cell.w, shot.trim[0]!, shot.trim[1]!)
    const independent = bounds(expected, cell.w, cell.trimX, cell.trimY)
    expect(observed).toEqual(independent)
    expect(observed.opaque).toBeGreaterThan(1000)
    expect(Math.abs((observed.bottom + 1) / zhaoyun.density - zhaoyun.box.groundY)).toBeLessThanOrEqual(1.5)
    return { ...observed, hash: hash(actual) }
  })
  expect(new Set(measured.slice(0, 3).map((m) => m.hash)).size, 'guard, windup and active must change drawings').toBe(3)
  expect(measured[3]).toEqual(measured[2]) // same active exposure, not a later legacy attack tick
  // This jab actually extends horizontally, so KEEP the strict original >4px
  // floor, in logical gameplay units, for both silhouette width and forward tip.
  // The exact extension is independently derived from source alpha + pivot;
  // full-cell padding alone cannot manufacture reach.
  expect(measured[2]!.width - measured[0]!.width).toBeGreaterThan(MIN_WEAPON_REACH_PX)
  expect(measured[2]!.forward - measured[0]!.forward).toBeGreaterThan(MIN_WEAPON_REACH_PX)
  expect(failedRequests, 'including asynchronous stage art requests').toEqual([])
  expect(pageErrors).toEqual([])
})

test('retired baked-art ingress is absent from source and the actual dist bundle', async () => {
  const forbidden = /assets\/(?:manifest\.json|sprites\/|portraits\/)|bakedart|__HAS_BAKED_ART__|hasBakedArt|ArtManifest|loadManifest|startPreload/
  const source = await Promise.all(['src/game/scenes/BootScene.ts', 'vite.config.ts'].map(path => readFile(path, 'utf8')))
  for (const text of source) expect(text).not.toMatch(forbidden)
  const bundles = (await readdir(join('dist', 'assets'))).filter(file => file.endsWith('.js'))
  expect(bundles.length, 'check built JavaScript, not Vite dev source URLs').toBeGreaterThan(0)
  for (const file of bundles) expect(await readFile(join('dist', 'assets', file), 'utf8'), file).not.toMatch(forbidden)
})

for (const renderer of ['canvas', 'webgl']) for (const rollback of [false, true]) {
  test(`retired bakedart parameter cannot revive cached art (${renderer}, ${rollback ? 'rollback' : 'default'})`, async ({ page }) => {
    const artRequests: string[] = []
    const errors: string[] = []
    page.on('pageerror', error => errors.push(String(error)))
    page.on('request', request => {
      // Match only the exclusive old delivery paths, never shared portrait PNGs
      // or ordinary /src/game/adapters/sprites.ts Vite development requests.
      if (/\/assets\/(manifest\.json(?:[?#]|$)|sprites\/|portraits\/)/.test(new URL(request.url()).pathname)) artRequests.push(request.url())
    })
    await page.route('**/assets/manifest.json', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sprites: { zhaoyun: ['idle', 'attack'] }, portraits: ['zhaoyun'] }),
    }))
    await page.goto(`${PREVIEW}/?renderer=${renderer}&autopilot=1&bakedart=1${rollback ? '&motion=0' : ''}`, { waitUntil: 'networkidle' })
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    expect(new URL(page.url()).searchParams.get('motion')).toBe(rollback ? '0' : null)
    const boot = await page.evaluate(() => {
      const engine = window.__DW_GAME__!
      const resources = engine.registry.get('paintedHeroArt')
      return {
        renderer: engine.renderer.type,
        portraits: Object.keys(resources.portraits).length,
        heads: Object.keys(resources.heroes).length,
        bodies: Object.keys(resources.bodies).length,
        weapons: !!resources.weapons,
        textures: ['ui:keyart-photo', 'fx:spark', 'fx:burst', 'fx:dust'].map(key => engine.textures.exists(key)),
        font: document.fonts.check('16px DynastyDisplay'),
        motionKeys: engine.textures.getTextureKeys().filter(key => key.startsWith('motion-source:')),
      }
    })
    expect(boot).toEqual({ renderer: renderer === 'canvas' ? 1 : 2, portraits: 11, heads: 11, bodies: 11,
      weapons: true, textures: [true, true, true, true], font: true, motionKeys: [] })
    await page.evaluate(() => window.__DW__!.startGame('zhaoyun', 42))
    await expect.poll(() => page.evaluate(() => {
      const live = window.__DW_GAME__!.scene.getScene('game') as Phaser.Scene & {
        built: boolean; sim?: Sim; sprites: Map<number, Phaser.GameObjects.Sprite>
      }
      const sprite = live.sim && live.sprites.get(live.sim.playerId)
      if (!live.built || !sprite?.visible || sprite.alpha <= 0) return ''
      return sprite.frame.name === '__BASE' ? sprite.texture.key : String(sprite.frame.name)
    }), { timeout: 15_000 }).toMatch(rollback ? /^entity:zhaoyun:idle$/ : /^entity:zhaoyun:motion:/)
    expect(artRequests, 'bakedart=1 must be inert even with an available stale manifest').toEqual([])
    expect(errors).toEqual([])
  })
}

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
    // Eight since ENH-8: the d-pad, A/B/C, and the pause button.
    expect(report?.zoneCount, `${label}: the shipped build drew no on-screen controls`).toBe(8)
    expect(report?.overflows, `${label}: the shipped canvas does not fit - ${report?.note}`).toBe(false)
    expect(
      report?.offscreen,
      `${label}: shipped on-screen controls fall outside the viewport - ${report?.note}`,
    ).toBe(0)
    await ctx.close()
  }
})
