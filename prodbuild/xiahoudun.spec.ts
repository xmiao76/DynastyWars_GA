import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { expect, test, type Page, type Request } from '@playwright/test'
import { PNG } from 'pngjs'
import { attackById } from '../src/core/attacks'
import { GETUP_TICKS, KNOCKDOWN_TICKS } from '../src/core/constants'
import { ENEMIES } from '../src/core/enemies'
import { makeCombatant } from '../src/core/entities'
import type { Sim } from '../src/core/sim'
import type { EntityState } from '../src/core/types'
import type { MotionArt } from '../src/game/art/motion-clips'
import { imageSignature, signatureMatches } from '../src/game/art/image-signature'
import { CONTRACT_CAPS } from '../src/game/adapters/motion-catalog'
import prepared from '../src/game/assets/motion/xiahoudun-prepared.json' with { type: 'json' }

// Stage2 GU/default-ZF downloads = these six committed pages (guanyu 2 +
// zhangfei 2 + xiahoudun 1 + soldier 1); expected bytes derive from the files.
const STAGE2_FILES = ['guanyu-motion-sheet.png', 'guanyu-actions-sheet.png', 'zhangfei-motion-sheet.png', 'zhangfei-actions-sheet.png', 'xiahoudun-motion-sheet.png', 'soldier-motion-sheet.png']
const EXPECTED_BYTES = STAGE2_FILES.reduce((n, f) => n + readFileSync(`src/game/assets/motion/${f}`).length, 0)

// Node-only imports construct complete fixtures and independent expectations.
// The browser executes the shipped minified bundle: never import /src there.
const PREVIEW = 'http://localhost:4321'
const HASH = 'e1fdf7e8ea2b4128e6c0380e407e79ca8c985ceb63b09a056097da6dd85af34f'
const hash = (body: Uint8Array): string => createHash('sha256').update(body).digest('hex')
const isMotionPNG = (r: Request): boolean => r.resourceType() !== 'script' &&
  ['fetch', 'image'].includes(r.resourceType()) && /\/(?:[\w]+)-(?:motion|actions)-sheet(?:-[\w-]+)?\.png(?:\?|$)/.test(r.url())
const isBossPNG = (url: string): boolean => /\/xiahoudun-motion-sheet-[\w-]+\.png(?:\?|$)/.test(url)
type Sprite = {
  frame: { name: string; x: number; y: number; width: number; height: number; realWidth: number; realHeight: number; cutX: number; cutY: number; cutWidth: number; cutHeight: number }
  texture: { key: string }; x: number; y: number; scaleX: number; scaleY: number; displayOriginX: number; displayOriginY: number
}
type Live = { sim: Sim; paused: boolean; syncSprites(): void; sprites: Map<number, Sprite> }
type Row = { state: EntityState; tick: number; attackId: string | null; expected: string }
const rows: Row[] = []
const add = (state: EntityState, tick: number, expected: string, attackId: string | null = null): void => { rows.push({ state, tick, expected, attackId }) }
add('idle', 0, 'walk:0')
for (let t = 0; t < 32; t++) add('walk', t, `walk:${1 + Math.floor(t / 4)}`)
for (const [id, action] of [['charge.dash.long', 'charge'], ['sword.combo', 'combo'], ['sword.heavy', 'heavy']] as const) {
  const a = attackById(id), end = a.startup + a.active, duration = end + a.recover
  const keys: Array<[number, string]> = action === 'charge'
    ? [[0, 'walk:0'], [Math.floor(a.startup / 3), 'charge:0'], [a.startup - 1, 'charge:1'], [a.startup, 'charge:2'], [a.startup + Math.floor(a.active / 2), 'charge:3'], [end, 'charge:4'], [end + Math.floor(a.recover / 2), 'walk:0']]
    : action === 'combo'
      ? [[0, 'walk:0'], [2, 'combo:0'], [a.startup, 'combo:1'], [a.startup + Math.floor(a.active / 2), 'combo:3'], [end, 'combo:2'], [end + Math.floor(a.recover / 3), 'combo:4'], [duration - 3, 'walk:0']]
      : [[0, 'walk:0'], [Math.floor(a.startup / 4), 'heavy:0'], [Math.floor(a.startup * 5 / 8), 'heavy:1'], [a.startup, 'heavy:2'], [end, 'heavy:3'], [end + Math.floor(a.recover / 3), 'heavy:4'], [duration - 3, 'walk:0']]
  for (let t = 0; t < duration; t++) add('attack', t, keys.filter(([at]) => at <= t).at(-1)![1], id)
}
for (let t = 0; t < ENEMIES.xiahoudun!.hitstunTicks; t++) add('hitstun', t, t < 4 ? 'misc:0' : t < ENEMIES.xiahoudun!.hitstunTicks - 1 ? 'misc:1' : 'walk:0')
for (let t = 0; t < KNOCKDOWN_TICKS; t++) add('knockdown', t, `fall:${Math.min(4, Math.floor(t / 7))}`)
for (let t = 0; t < GETUP_TICKS; t++) add('getup', t, t < 2 ? 'fall:4' : t < 5 ? 'getup:0' : t < 10 ? 'getup:1' : t < 14 ? 'getup:2' : t < 19 ? 'getup:3' : t < GETUP_TICKS - 1 ? 'getup:4' : 'walk:0')
add('grabbed', 0, 'misc:2'); add('grab', 4, 'misc:3')
const fixture = makeCombatant(900001, 'xiahoudun', 'enemy', 250, 232, ENEMIES.xiahoudun!.maxHp, ENEMIES.xiahoudun!.speed, 'right')

async function start(page: Page, renderer: string, enabled: boolean): Promise<void> {
  await page.goto(`${PREVIEW}/?renderer=${renderer}&autopilot=1${enabled ? '&motion=1' : ''}`)
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
}
async function stage(page: Page): Promise<void> {
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage2'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
}
async function published(page: Page): Promise<string[]> {
  return page.evaluate(() => Object.keys(window.__DW_GAME__!.registry.get('paintedHeroArt')?.motions ?? {}).sort())
}

for (const renderer of ['canvas', 'webgl'] as const) for (const enabled of [false, true]) {
  test(`built Xiahou stage2 ${renderer}: ${enabled ? 'complete motion and real PNG budget' : 'default legacy, zero roster motion resources'}`, async ({ page }, info) => {
    const requests: string[] = [], errors: string[] = [], sourceRequests: string[] = []
    const downloads: Array<Promise<{ url: string; bytes: number; sha256: string; width: number; height: number; signature: boolean }>> = []
    page.on('pageerror', (e) => errors.push(String(e)))
    page.on('request', (r) => { if (isMotionPNG(r)) requests.push(r.url()); if (new URL(r.url()).pathname.startsWith('/src/')) sourceRequests.push(r.url()) })
    page.on('response', (r) => {
      if (!isMotionPNG(r.request())) return
      downloads.push((async () => {
        expect(r.status()).toBe(200)
        const body = await r.body(), png = PNG.sync.read(body)
        return { url: r.url(), bytes: body.length, sha256: hash(body), width: png.width, height: png.height,
          signature: !isBossPNG(r.url()) || signatureMatches(imageSignature(png), prepared.signatures.sheet) }
      })())
    })
    await page.setViewportSize({ width: 960, height: 540 })
    await start(page, renderer, enabled)
    expect(await published(page)).toEqual([])
    expect(requests, 'no all-cast motion preload, even opted in').toEqual([])
    await stage(page)
    await expect.poll(() => published(page)).toEqual(enabled ? ['guanyu', 'soldier', 'xiahoudun', 'zhangfei'] : [])
    if (enabled) await expect.poll(() => requests.length).toBe(STAGE2_FILES.length)
    else expect(requests).toEqual([])
    expect(await page.evaluate(() => window.__DW__!.joinP2())).toBe(true)
    expect(await page.evaluate(() => window.__DW__!.getSnapshot().sim?.char2Id)).toBe('zhangfei')
    const partner = await page.evaluate(() => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live; g.syncSprites()
      return g.sprites.get(g.sim.player2Id!)!.texture.key
    })
    if (enabled) expect(partner).toBe('motion-source:zhangfei')
    else expect(partner).not.toContain('motion-')
    const observed = await Promise.all(downloads)
    let pack: unknown = null
    if (enabled) {
      expect(observed).toHaveLength(STAGE2_FILES.length)
      expect(observed.reduce((n, r) => n + r.bytes, 0)).toBe(EXPECTED_BYTES)
      expect(observed.reduce((n, r) => n + r.bytes, 0)).toBeLessThanOrEqual(CONTRACT_CAPS.stageDownloads)
      const boss = observed.filter((r) => isBossPNG(r.url))
      expect(boss).toHaveLength(1)
      expect(boss[0]).toMatchObject({ bytes: 2220630, sha256: HASH, width: 2044, height: 1589, signature: true })
      expect(boss[0]!.width * boss[0]!.height * 4).toBe(12991664)
      expect(hash(readFileSync('src/game/assets/motion/xiahoudun-motion-sheet.png'))).toBe(HASH)
      const meta = await page.evaluate(async () => {
        const engine = window.__DW_GAME__!, art = engine.registry.get('paintedHeroArt').motions.xiahoudun as MotionArt & { source: unknown; singlePage: boolean; decodedCapBytes?: number; sha256: string }
        const aliasHashes: Record<string, string> = {}
        for (const name of ['fall:4', 'getup:0']) {
          const cell = art.frames[name]!, cv = document.createElement('canvas'); cv.width = cell.w; cv.height = cell.h
          const ctx = cv.getContext('2d')!; ctx.drawImage(art.sheet, cell.x, cell.y, cell.w, cell.h, 0, 0, cell.w, cell.h)
          const pixels = ctx.getImageData(0, 0, cell.w, cell.h).data
          aliasHashes[name] = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', pixels))).map((b) => b.toString(16).padStart(2, '0')).join('')
        }
        return { frames: art.frames, box: art.box, density: art.density, source: art.source, sha256: art.sha256, singlePage: art.singlePage, samePage: art.sheet === art.actionSheet, customCap: art.decodedCapBytes ?? null,
          dimensions: [(art.sheet as HTMLImageElement).width, (art.sheet as HTMLImageElement).height], texturePages: engine.textures.get('motion-source:xiahoudun').source.length, actionsTexture: engine.textures.exists('motion-actions:xiahoudun'), clips: art.clips, aliasHashes }
      })
      pack = meta
      expect(meta.frames).toEqual(prepared.frames)
      expect(Object.keys(meta.frames)).toHaveLength(39)
      expect(meta).toMatchObject({ box: { width: 260, height: 218, groundY: 210 }, density: 2, source: prepared.source, sha256: HASH, singlePage: true, samePage: true, customCap: null, dimensions: [2044, 1589], texturePages: 1, actionsTexture: false })
      const { aliasOf, ...alias } = prepared.frames['getup:0']
      expect(aliasOf).toBe('fall:4'); expect(alias).toEqual(prepared.frames['fall:4'])
      expect(meta.aliasHashes['getup:0']).toBe(meta.aliasHashes['fall:4'])
      expect(meta.aliasHashes['fall:4']).toMatch(/^[a-f0-9]{64}$/)
      for (const [action, id] of [['charge', 'charge.dash.long'], ['combo', 'sword.combo'], ['heavy', 'sword.heavy']]) {
        const a = attackById(id!); expect(meta.clips[action!]!.duration).toBe(a.startup + a.active + a.recover)
      }
      expect(meta.clips.hurt!.duration).toBe(12)
    }
    // Complete core fixtures are serialized from Node. syncSprites must leave
    // every core entity field and clock unchanged. Fresh IDs avoid stale history.
    const result = await page.evaluate(async ({ fixture, rows, enabled, renderer }) => {
      const engine = window.__DW_GAME__!, g = engine.scene.getScene('game') as unknown as Live
      if (engine.renderer.type !== (renderer === 'canvas' ? 1 : 2)) throw new Error('wrong actual renderer')
      g.paused = true
      const hud = engine.scene.getScene('hud'); hud.scene.pause(); hud.children.list.forEach((o) => { (o as unknown as { visible: boolean }).visible = false })
      const seen = new Set<string>(), samples: unknown[] = [], cuts: Record<string, unknown> = {}
      const montage = document.createElement('canvas'); montage.width = 260 * 8; montage.height = 218 * 5
      const mg = montage.getContext('2d')!; let index = 0
      const read = async (expected: string) => {
        const before = JSON.stringify(g.sim.entities), tick = g.sim.tick
        g.syncSprites()
        if (JSON.stringify(g.sim.entities) !== before || tick !== g.sim.tick) throw new Error('syncSprites mutated core entity/clock')
        const b = g.sim.entities.at(-1)!, s = g.sprites.get(b.id)!, f = s.frame
        const key = `entity:xiahoudun:motion:${expected}`
        if (enabled ? f.name !== key || s.texture.key !== 'motion-source:xiahoudun' : f.name.includes(':motion:') || s.texture.key.startsWith('motion-')) throw new Error(`wrong built sprite ${b.state}@${b.stateTick}: ${s.texture.key}/${f.name}, expected ${key}`)
        samples.push({ state: b.state, tick: b.stateTick, attackId: b.attackId, key: f.name, texture: s.texture.key })
        if (!enabled || seen.has(f.name)) return
        seen.add(f.name)
        if (f.realWidth !== 520 || f.realHeight !== 436 || s.scaleX !== 0.5 || s.displayOriginX !== 260 || s.displayOriginY !== 420) throw new Error(`wrong full-cell registration: ${f.name}`)
        cuts[expected] = { x: f.cutX, y: f.cutY, w: f.cutWidth, h: f.cutHeight, trimX: f.x, trimY: f.y, srcW: f.realWidth, srcH: f.realHeight }
        const snap = await new Promise<HTMLImageElement>((resolve) => engine.renderer.snapshot((image) => resolve(image as HTMLImageElement)))
        // Crop the actual framebuffer, not atlas/source art. All full boxes fit.
        const cam = (g as unknown as { cameras: { main: { scrollX: number; scrollY: number; zoom: number } } }).cameras.main
        const x = (s.x - s.displayOriginX * s.scaleX - cam.scrollX) * cam.zoom, y = (s.y - s.displayOriginY * s.scaleY - cam.scrollY) * cam.zoom
        const w = 520 * s.scaleX * cam.zoom, h = 436 * s.scaleY * cam.zoom
        if (x < 0 || y < 0 || x + w > snap.width || y + h > snap.height) throw new Error(`snapshot clipped ${f.name}`)
        mg.drawImage(snap, x, y, w, h, index % 8 * 260, Math.floor(index / 8) * 218, 260, 218)
        if (s.frame.name !== key) throw new Error('snapshot key drift')
        index++
      }
      for (const [i, row] of rows.entries()) {
        g.sim.entities = g.sim.entities.filter((e) => e.id === g.sim.playerId || e.id === g.sim.player2Id)
        g.sim.entities.push({ ...fixture, id: fixture.id + i, state: row.state, stateTick: row.tick, attackId: row.attackId, thinkTick: 999999 })
        g.sim.tick = 1000 + i
        await read(row.expected)
      }
      // Real adapter history: freed grabbed victim -> release (misc:4).
      const b = g.sim.entities.at(-1)!; b.state = 'grabbed'; b.stateTick = 0; b.grabbedBy = g.sim.playerId
      await read('misc:2'); b.state = 'idle'; b.stateTick = 0; b.grabbedBy = null; g.sim.tick++
      await read('misc:4')
      const art = engine.registry.get('paintedHeroArt')?.motions?.xiahoudun as MotionArt | undefined
      if (enabled && [...seen].sort().join('|') !== Object.keys(art!.frames).map((f) => `entity:xiahoudun:motion:${f}`).sort().join('|')) throw new Error('not all 39 records drawn')
      return { samples, cuts, drawn: seen.size, montage: enabled ? montage.toDataURL('image/png') : null,
        resources: engine.textures.getTextureKeys().filter((k) => k.startsWith('motion-source:') || k.startsWith('motion-actions:')) }
    }, { fixture, rows, enabled, renderer })
    expect(result.samples).toHaveLength(rows.length + 2)
    if (enabled) {
      expect(result.drawn).toBe(39)
      for (const [name, cell] of Object.entries(prepared.frames)) {
        const { aliasOf: _alias, ...rect } = cell as typeof prepared.frames['getup:0']; void _alias
        expect(result.cuts[name], name).toEqual(rect)
      }
      expect(result.cuts['getup:0']).toEqual(result.cuts['fall:4'])
      writeFileSync(info.outputPath('actual-framebuffer-39.png'), Buffer.from(result.montage!.split(',')[1]!, 'base64'))
    } else expect(result.resources).toEqual([])
    expect(sourceRequests, 'no browser source imports against production').toEqual([])
    expect(errors).toEqual([])
    writeFileSync(info.outputPath('evidence.json'), JSON.stringify({ renderer, enabled, requests, observed, pack, decodedAndGPUBytes: enabled ? 12991664 : 0, ...result, montage: undefined, errors, sourceRequests }, null, 2))
  })
}

for (const failure of ['missing', 'corrupt'] as const) test(`built Xiahou ${failure}: whole-fighter legacy fallback, siblings intact`, async ({ page }, info) => {
  const intercepted: string[] = [], errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.route(/\/xiahoudun-motion-sheet-[\w-]+\.png(?:\?|$)/, (route) => {
    if (!isMotionPNG(route.request())) return route.continue()
    intercepted.push(route.request().url())
    return route.fulfill(failure === 'missing' ? { status: 404, body: '' } : { status: 200, contentType: 'image/png', body: Buffer.from('not-a-png') })
  })
  await start(page, 'canvas', true); await stage(page)
  await expect.poll(() => published(page)).toEqual(['guanyu', 'soldier', 'zhangfei'])
  expect(intercepted).toHaveLength(1)
  const result = await page.evaluate(({ fixture, rows }) => {
    const engine = window.__DW_GAME__!, g = engine.scene.getScene('game') as unknown as Live
    g.paused = true
    const samples: string[] = []
    for (const [i, row] of rows.entries()) {
      g.sim.entities = g.sim.entities.filter((e) => e.id === g.sim.playerId || e.id === g.sim.player2Id)
      g.sim.entities.push({ ...fixture, id: fixture.id + i, state: row.state, stateTick: row.tick, attackId: row.attackId })
      const before = JSON.stringify(g.sim.entities); g.syncSprites()
      if (JSON.stringify(g.sim.entities) !== before) throw new Error('fallback changed core fields')
      const s = g.sprites.get(fixture.id + i)!
      if (s.frame.name.includes(':motion:') || s.texture.key.startsWith('motion-')) throw new Error('partial boss motion fallback')
      samples.push(s.frame.name)
    }
    const hero = g.sprites.get(g.sim.playerId)!
    return { samples, hero: hero.texture.key, pageInstalled: engine.textures.exists('motion-source:xiahoudun'), bossPublished: !!engine.registry.get('paintedHeroArt').motions.xiahoudun }
  }, { fixture, rows })
  expect(result.samples).toHaveLength(rows.length)
  expect(result).toMatchObject({ hero: 'motion-source:guanyu', pageInstalled: false, bossPublished: false })
  expect(errors).toEqual([])
  writeFileSync(info.outputPath('fallback.json'), JSON.stringify({ failure, intercepted, result, errors }, null, 2))
})
