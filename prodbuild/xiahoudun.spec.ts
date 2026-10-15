import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { expect, test, type Page, type Request } from '@playwright/test'
import { PNG } from 'pngjs'
import { attackById } from '../src/core/attacks'
import { STAGE_2, STAGE_3 } from '../src/core/stage'
import type { MotionFailureState } from '../src/game/adapters/motion-art'
import { GETUP_TICKS, KNOCKDOWN_TICKS } from '../src/core/constants'
import { ENEMIES } from '../src/core/enemies'
import { makeCombatant } from '../src/core/entities'
import type { Sim } from '../src/core/sim'
import type { EntityState } from '../src/core/types'
import type { MotionArt } from '../src/game/art/motion-clips'
import { imageSignature, signatureMatches } from '../src/game/art/image-signature'
import { CONTRACT_CAPS } from '../src/game/adapters/motion-catalog'
import prepared from '../src/game/assets/motion/xiahoudun-prepared.json' with { type: 'json' }

// Independent Node oracle: core spawn tables + committed file bytes, NOT the
// production scope result. Entry charges opening + admitted future, not deferred.
const unique = (kinds: string[]) => [...new Set(kinds)]
const OPENING = unique(['guanyu', 'zhangfei', ...STAGE_2.waves[0]!.spawns.map((s) => s.kind)])
const STAGE_KINDS = unique([...STAGE_2.waves.flatMap((w) => w.spawns.map((s) => s.kind)), STAGE_2.bossKind])
const DEFERRED = STAGE_KINDS.filter((k) => !OPENING.includes(k))
const FUTURE = unique([...STAGE_3.waves.flatMap((w) => w.spawns.map((s) => s.kind)), STAGE_3.bossKind]).filter((k) => !STAGE_KINDS.includes(k))
const filesFor = (kinds: string[]) => kinds.flatMap((k) => [`${k}-motion-sheet.png`, ...(['guanyu', 'zhangfei'].includes(k) ? [`${k}-actions-sheet.png`] : [])])
const OPENING_FILES = filesFor(OPENING), DEFERRED_FILES = filesFor(DEFERRED), FUTURE_FILES = filesFor(FUTURE)
const STAGE2_FILES = [...OPENING_FILES, ...DEFERRED_FILES, ...FUTURE_FILES]
const bytesFor = (files: string[]) => files.reduce((n, f) => n + readFileSync(`src/game/assets/motion/${f}`).length, 0)
const EXPECTED_BYTES = bytesFor(STAGE2_FILES)
const ALL_KINDS = [...OPENING, ...DEFERRED, ...FUTURE].sort()
const SIBLINGS = ALL_KINDS.filter((k) => k !== 'xiahoudun')
const textureKeys = (kinds: string[]) => kinds.flatMap((k) => [`motion-source:${k}`, ...(['guanyu', 'zhangfei'].includes(k) ? [`motion-actions:${k}`] : [])]).sort()
const fileForURL = (url: string) => new URL(url).pathname.split('/').at(-1)!.replace(/(-sheet)-[\w-]+\.png$/, '$1.png')
function assertPartitions(): void {
  expect(OPENING).toEqual(['guanyu', 'zhangfei', 'soldier'])
  expect(DEFERRED).toEqual(['spearman', 'archer', 'xiahoudun'])
  expect(FUTURE).toEqual(['xuchu'])
  expect([OPENING_FILES.length, DEFERRED_FILES.length, FUTURE_FILES.length]).toEqual([5, 3, 1])
  expect([bytesFor(OPENING_FILES), bytesFor(DEFERRED_FILES), bytesFor(FUTURE_FILES)]).toEqual([9_219_665, 5_404_241, 2_177_184])
  expect(bytesFor([...OPENING_FILES, ...FUTURE_FILES])).toBe(11_396_849)
  expect(CONTRACT_CAPS.stageDownloads).toBe(12 * 1024 * 1024)
  expect(bytesFor([...OPENING_FILES, ...FUTURE_FILES])).toBeLessThanOrEqual(CONTRACT_CAPS.stageDownloads)
  expect(EXPECTED_BYTES).toBe(16_801_090)
  expect(STAGE2_FILES).toHaveLength(9)
}

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
type Live = { sim: Sim; built: boolean; motionGatePending: boolean; motionErrorState(): MotionFailureState | null; paused: boolean; syncSprites(): void; sprites: Map<number, Sprite & { visible: boolean }> }
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
  await page.goto(`${PREVIEW}/?renderer=${renderer}&autopilot=1${enabled ? '' : '&motion=0'}`)
  expect(new URL(page.url()).searchParams.get('motion')).toBe(enabled ? null : '0')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
}
async function stage(page: Page): Promise<void> {
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage2'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
}
async function published(page: Page): Promise<string[]> {
  return page.evaluate(() => Object.keys(window.__DW_GAME__!.registry.get('paintedHeroArt')?.motions ?? {}).sort())
}

async function frames(page: Page, count: number): Promise<void> {
  await page.evaluate(async (n) => {
    for (let i = 0; i < n; i++) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }, count)
}
function barrier() {
  let release!: () => void
  const held = new Promise<void>((resolve) => { release = resolve })
  return { held, release }
}
async function inspect(page: Page) {
  // Public scene/registry/texture observations only. No /src imports, runtime
  // access, private spawn gates, or waveIndex mutation in the browser.
  return page.evaluate(() => {
    const engine = window.__DW_GAME__!, scene = engine.scene.getScene('game'), g = scene as unknown as Live
    const motions = engine.registry.get('paintedHeroArt')?.motions ?? {}
    const objects = scene.children.list as unknown as Array<{ name: string; visible: boolean; text?: string; input?: { enabled: boolean }; getBounds(): { x: number; y: number; width: number; height: number } }>
    return { built: g.built, gatePending: g.motionGatePending, error: g.motionErrorState(), tick: g.sim.tick, wave: g.sim.waveIndex, bossSpawned: g.sim.bossSpawned,
      entities: JSON.stringify(g.sim.entities), published: Object.keys(motions).sort(),
      textures: engine.textures.getTextureKeys().filter((k) => k.startsWith('motion-source:') || k.startsWith('motion-actions:')).sort(),
      sprites: [...g.sprites].map(([id, s]) => ({ id, kind: g.sim.entities.find((e) => e.id === id)?.kind, visible: s.visible, texture: s.texture.key, frame: s.frame.name })),
      ui: objects.filter((o) => o.name.startsWith('motionError')).map((o) => ({ name: o.name, visible: o.visible, text: o.text, interactive: o.input?.enabled, bounds: o.getBounds() })),
    }
  })
}
async function pinSiblings(page: Page): Promise<void> {
  await page.evaluate((kinds) => {
    const engine = window.__DW_GAME__!, motions = engine.registry.get('paintedHeroArt').motions
    engine.registry.set('productionSiblingPins', kinds.map((kind) => ({ kind, art: motions[kind], texture: engine.textures.get(`motion-source:${kind}`), actions: engine.textures.exists(`motion-actions:${kind}`) ? engine.textures.get(`motion-actions:${kind}`) : null })))
  }, SIBLINGS)
}
async function siblingsIdentical(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const engine = window.__DW_GAME__!, motions = engine.registry.get('paintedHeroArt').motions
    const pins = engine.registry.get('productionSiblingPins') as Array<{ kind: string; art: unknown; texture: unknown; actions: unknown }>
    return pins.every((p) => motions[p.kind] === p.art && engine.textures.get(`motion-source:${p.kind}`) === p.texture && (p.actions === null ? !engine.textures.exists(`motion-actions:${p.kind}`) : engine.textures.get(`motion-actions:${p.kind}`) === p.actions))
  })
}
function assertNoBoss(state: Awaited<ReturnType<typeof inspect>>): void {
  expect(state.published).toEqual(SIBLINGS)
  expect(state.textures).toEqual(textureKeys(SIBLINGS))
  expect(state.textures.filter((k) => k.includes('xiahoudun'))).toEqual([])
  expect(state.sprites.filter((s) => s.kind === 'xiahoudun' && s.visible), 'no visible legacy/placeholder boss').toEqual([])
  expect(state.bossSpawned).toBe(false)
  for (const s of state.sprites.filter((s) => s.visible && SIBLINGS.includes(s.kind ?? ''))) {
    expect(s.texture).toBe(`motion-source:${s.kind}`)
    expect(s.frame).toContain(`entity:${s.kind}:motion:`)
  }
}

for (const renderer of ['canvas', 'webgl'] as const) for (const enabled of [false, true]) {
  test(`built Xiahou stage2 ${renderer}: ${enabled ? 'default motion (no motion parameter) and real PNG budget' : 'motion=0 rollback, zero roster motion resources'}`, async ({ page }, info) => {
    assertPartitions()
    const requests: string[] = [], errors: string[] = [], sourceRequests: string[] = []
    const deferred = barrier(); let heldRequests = 0, completedDownloads = 0
    if (enabled) await page.route(/\/spearman-motion-sheet-[\w-]+\.png(?:\?|$)/, async (route) => {
      if (!isMotionPNG(route.request())) return route.continue()
      heldRequests++
      if (heldRequests === 1) await deferred.held
      await route.continue()
    })
    const downloads: Array<Promise<{ url: string; bytes: number; sha256: string; width: number; height: number; signature: boolean }>> = []
    page.on('pageerror', (e) => errors.push(String(e)))
    page.on('request', (r) => { if (isMotionPNG(r)) requests.push(r.url()); if (new URL(r.url()).pathname.startsWith('/src/')) sourceRequests.push(r.url()) })
    page.on('response', (r) => {
      if (!isMotionPNG(r.request())) return
      downloads.push((async () => {
        expect(r.status()).toBe(200)
        const body = await r.body(), png = PNG.sync.read(body)
        completedDownloads++
        return { url: r.url(), bytes: body.length, sha256: hash(body), width: png.width, height: png.height,
          signature: !isBossPNG(r.url()) || signatureMatches(imageSignature(png), prepared.signatures.sheet) }
      })())
    })
    await page.setViewportSize({ width: 960, height: 540 })
    await start(page, renderer, enabled)
    expect(await published(page)).toEqual([])
    expect(requests, 'no all-cast motion preload on default URL').toEqual([])
    await stage(page)
    let opening: unknown = null
    if (enabled) {
      await expect.poll(() => heldRequests).toBe(1)
      await expect.poll(() => completedDownloads).toBe(5)
      await expect.poll(() => published(page)).toEqual([...OPENING].sort())
      opening = await inspect(page)
      expect((opening as Awaited<ReturnType<typeof inspect>>).built).toBe(true)
      expect((opening as Awaited<ReturnType<typeof inspect>>).textures).toEqual(textureKeys(OPENING))
      // The sixth REQUEST is held spearman, NOT a sixth completed entry page.
      expect(requests.map(fileForURL)).toEqual([...OPENING_FILES, 'spearman-motion-sheet.png'])
      const entry = await Promise.all(downloads)
      expect(entry.map((r) => fileForURL(r.url))).toEqual(OPENING_FILES)
      expect(entry.reduce((n, r) => n + r.bytes, 0)).toBe(9_219_665)
      deferred.release()
      await expect.poll(() => completedDownloads).toBe(9)
      await expect.poll(() => published(page)).toEqual(ALL_KINDS)
      expect(heldRequests).toBe(1)
    } else {
      await frames(page, 30)
      expect(await published(page)).toEqual([])
      expect(requests).toEqual([])
    }
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
      expect(requests.map(fileForURL)).toEqual(STAGE2_FILES)
      expect(new Set(requests).size, 'one request per page, no dedupe regression').toBe(9)
      expect(observed.map((r) => fileForURL(r.url)).sort()).toEqual([...STAGE2_FILES].sort())
      for (const r of observed) {
        const committed = readFileSync(`src/game/assets/motion/${fileForURL(r.url)}`)
        expect(r.bytes).toBe(committed.length)
        expect(r.sha256).toBe(hash(committed))
      }
      expect(observed.filter((r) => [...OPENING_FILES, ...FUTURE_FILES].includes(fileForURL(r.url))).reduce((n, r) => n + r.bytes, 0)).toBe(11_396_849)
      expect(observed.filter((r) => DEFERRED_FILES.includes(fileForURL(r.url))).reduce((n, r) => n + r.bytes, 0)).toBe(5_404_241)
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
      expect(result.resources.sort()).toEqual(textureKeys(ALL_KINDS))
      const framebuffer = PNG.sync.read(Buffer.from(result.montage!.split(',')[1]!, 'base64'))
      expect([framebuffer.width, framebuffer.height]).toEqual([2080, 1090])
      // Actual renderer snapshots, not source atlas crops: every drawn cell
      // must contain visible non-flat pixels, including both alias records.
      for (let cell = 0; cell < 39; cell++) {
        const colors = new Set<number>()
        for (let y = Math.floor(cell / 8) * 218; y < Math.floor(cell / 8) * 218 + 218; y++) for (let x = cell % 8 * 260; x < cell % 8 * 260 + 260; x++) {
          const i = (y * framebuffer.width + x) * 4
          colors.add((framebuffer.data[i]! << 16) | (framebuffer.data[i + 1]! << 8) | framebuffer.data[i + 2]!)
        }
        expect(colors.size, `framebuffer cell ${cell} is not blank/flat`).toBeGreaterThan(16)
      }
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
    writeFileSync(info.outputPath('evidence.json'), JSON.stringify({ renderer, enabled, opening, partitions: { opening: OPENING_FILES, deferred: DEFERRED_FILES, future: FUTURE_FILES, capChargedBytes: 11_396_849, completedBytes: EXPECTED_BYTES }, requests, observed, pack, decodedAndGPUBytes: enabled ? 12991664 : 0, ...result, montage: undefined, errors, sourceRequests }, null, 2))
  })
}

for (const failure of ['missing', 'corrupt'] as const) test(`built Xiahou deferred ${failure}: one required retry, terminal error, siblings intact`, async ({ page }, info) => {
  assertPartitions()
  const intercepted: string[] = [], requests: string[] = [], errors: string[] = [], sourceRequests: string[] = []
  // Corrupt transport bytes fail the committed SHA check before PNG decode.
  const failureClass = failure === 'missing' ? 'missing' : 'wrong-signature'
  const completed: string[] = [], bossResponses: number[] = [], retry = barrier(); let firstDelivered = false
  page.on('response', (response) => {
    if (isMotionPNG(response.request()) && isBossPNG(response.url())) bossResponses.push(response.status())
  })
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('request', (r) => {
    if (isMotionPNG(r)) requests.push(r.url())
    if (new URL(r.url()).pathname.startsWith('/src/')) sourceRequests.push(r.url())
  })
  page.on('requestfinished', (r) => { if (isMotionPNG(r)) completed.push(r.url()) })
  await page.route(/\/xiahoudun-motion-sheet-[\w-]+\.png(?:\?|$)/, async (route) => {
    if (!isMotionPNG(route.request())) return route.continue()
    intercepted.push(route.request().url())
    if (intercepted.length === 2) await retry.held
    await route.fulfill(failure === 'missing' ? { status: 404, body: '' } : { status: 200, contentType: 'image/png', body: Buffer.from('not-a-png') })
    firstDelivered = true
  })
  await start(page, 'canvas', true)
  expect(requests).toEqual([])
  await stage(page)
  await expect.poll(() => firstDelivered).toBe(true)
  // Xu Chu is queued AFTER the failed boss attempt. Its publication proves
  // background attempt one settled (not a race against sequential prefetch).
  await expect.poll(() => published(page)).toEqual(SIBLINGS)
  await expect.poll(() => bossResponses.length).toBe(1)
  await expect.poll(() => completed.filter((url) => !isBossPNG(url)).length).toBe(8)
  expect(bossResponses).toEqual([failure === 'missing' ? 404 : 200])
  expect(intercepted).toHaveLength(1)
  expect(requests.map(fileForURL)).toEqual(STAGE2_FILES)
  expect(new Set(requests).size).toBe(9)
  const opening = await inspect(page)
  expect(opening).toMatchObject({ built: true, tick: 0, wave: 0, error: null })
  assertNoBoss(opening)
  await pinSiblings(page)
  const progression = [opening]
  // Defeat only current enemies, then consume exactly one real queued step.
  // Do not set waveIndex, forceBoss, or call private gates/runtime. The existing
  // nextSpawnTick is one-wave-ahead: it gates at wave 3 with enemies still alive,
  // not only after they die. Preserve/report that limitation rather than mask it.
  for (let wave = 1; wave < STAGE_2.waves.length; wave++) {
    await page.evaluate(() => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as Live
      for (const e of g.sim.entities) if (e.side === 'enemy') e.state = 'dead'
      window.__DW__!.step(1)
    })
    await expect.poll(async () => (await inspect(page)).wave).toBe(wave)
    const state = await inspect(page)
    expect(state.tick).toBe(wave)
    progression.push(state)
  }
  await expect.poll(() => intercepted.length).toBe(2)
  await expect.poll(async () => (await inspect(page)).gatePending).toBe(true)
  const held = await inspect(page)
  expect(held.error).toBeNull()
  expect(held.wave).toBe(3)
  assertNoBoss(held)
  await page.evaluate(() => window.__DW__!.step(600))
  await frames(page, 60)
  const stillHeld = await inspect(page)
  expect([stillHeld.tick, stillHeld.wave, stillHeld.entities]).toEqual([held.tick, held.wave, held.entities])
  expect(intercepted).toHaveLength(2)
  expect(await siblingsIdentical(page)).toBe(true)
  retry.release()
  await expect.poll(async () => (await inspect(page)).error).toEqual({ kind: 'xiahoudun', failure: failureClass, attempts: 2, final: true })
  await expect.poll(() => bossResponses.length).toBe(2)
  expect(bossResponses[1]).toEqual(bossResponses[0])
  const failed = await inspect(page)
  await page.screenshot({ path: info.outputPath('terminal-error.png') })
  expect([failed.tick, failed.wave, failed.entities]).toEqual([held.tick, held.wave, held.entities])
  assertNoBoss(failed)
  expect(failed.ui.find((o) => o.name === 'motionErrorTitle')).toMatchObject({ visible: true, text: 'MOTION ART FAILED TO LOAD' })
  expect(failed.ui.find((o) => o.name === 'motionErrorDetail')?.text).toContain(`xiahoudun: ${failureClass} (after one retry)`)
  const reload = failed.ui.find((o) => o.name === 'motionErrorReload')!
  expect(reload).toMatchObject({ visible: true, text: '[ RELOAD ]', interactive: true })
  expect(reload.bounds.width).toBeGreaterThan(0)
  expect(reload.bounds.y).toBeGreaterThan(0)
  expect(reload.bounds.y + reload.bounds.height).toBeLessThanOrEqual(270)
  await page.evaluate(() => window.__DW__!.step(600))
  await frames(page, 60)
  const after = await inspect(page)
  expect([after.tick, after.wave, after.entities, after.error]).toEqual([failed.tick, failed.wave, failed.entities, failed.error])
  assertNoBoss(after)
  expect(after.textures).toEqual(opening.textures)
  expect(await siblingsIdentical(page), 'same published art and texture objects, not reinstalled siblings').toBe(true)
  expect(intercepted, 'no third boss request after 600 queued ticks and 60 real RAFs').toHaveLength(2)
  expect(requests.map(fileForURL)).toEqual([...STAGE2_FILES, 'xiahoudun-motion-sheet.png'])
  expect(errors).toEqual([])
  expect(sourceRequests, 'shipped bundle only, no source-import escape hatch').toEqual([])
  writeFileSync(info.outputPath('retry-error.json'), JSON.stringify({ failure, failureClass, intercepted, requests, completed, bossResponses, opening, progression, held, stillHeld, failed, after, errors, sourceRequests, limitation: 'nextSpawnTick gates one wave ahead even while preceding-wave enemies are alive' }, null, 2))
})
