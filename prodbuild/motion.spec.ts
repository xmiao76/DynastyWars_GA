import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { expect, test, type Request } from '@playwright/test'
import { STAGES, STAGE_ORDER } from '../src/core/stage'
import type { Sim } from '../src/core/sim'
import { CONTRACT_CAPS } from '../src/game/adapters/motion-catalog'
// Independent Node oracle: stage tables and explicit committed PNG pages only;
// neither the runtime scope nor its partner selector supplies expectations.
const PACK_FILES: Record<string, string[]> = {
  guanyu: ['guanyu-motion-sheet.png', 'guanyu-actions-sheet.png'],
  soldier: ['soldier-motion-sheet.png'], spearman: ['spearman-motion-sheet.png'], archer: ['archer-motion-sheet.png'],
  zhangfei: ['zhangfei-motion-sheet.png', 'zhangfei-actions-sheet.png'],
  zhaoyun: ['zhaoyun-motion-sheet.png', 'zhaoyun-actions-sheet.png'],
  weiyan: ['weiyan-motion-sheet.png', 'weiyan-actions-sheet.png'],
  huangzhong: ['huangzhong-motion-sheet.png'], lidian: ['lidian-motion-sheet.png'],
  xiahoudun: ['xiahoudun-motion-sheet.png'], xuchu: ['xuchu-motion-sheet.png'],
}
const unique = (kinds: string[]) => [...new Set(kinds)]
const NON_MOTION = unique([...Object.values(STAGES).flatMap((s) => s.props.map((p) => p.kind)), 'arrow', 'meat', 'sword', 'crate', 'barrel'])
const fighters = (kinds: string[]) => unique(kinds).filter((k) => !NON_MOTION.includes(k) && Object.hasOwn(PACK_FILES, k))
const stageFighters = (id: string) => fighters([...STAGES[id]!.waves.flatMap((w) => w.spawns.map((s) => s.kind)), STAGES[id]!.bossKind])
const OPENING = fighters(['guanyu', 'zhangfei', ...STAGES.stage1!.waves[0]!.spawns.map((s) => s.kind)])
const STAGE_KINDS = stageFighters('stage1')
const DEFERRED = STAGE_KINDS.filter((k) => !OPENING.includes(k))
const FUTURE_CANDIDATES = fighters(STAGE_ORDER.slice(1).flatMap(stageFighters)).filter((k) => ![...OPENING, ...STAGE_KINDS].includes(k))
const filesFor = (kinds: string[]) => kinds.flatMap((k) => PACK_FILES[k]!)
const bytesFor = (files: string[]) => files.reduce((n, f) => n + statSync(`src/game/assets/motion/${f}`).size, 0)
const OPENING_FILES = filesFor(OPENING), DEFERRED_FILES = filesFor(DEFERRED)
let entryBytes = bytesFor(OPENING_FILES)
const FUTURE = FUTURE_CANDIDATES.filter((k) => {
  const bytes = bytesFor(filesFor([k]))
  if (entryBytes + bytes > 12 * 1024 * 1024) return false
  entryBytes += bytes
  return true
})
const FUTURE_FILES = filesFor(FUTURE)
const EXPECTED_FILES = [...OPENING_FILES, ...DEFERRED_FILES, ...FUTURE_FILES]
const EXPECTED_PUBLISHED = [...OPENING, ...DEFERRED, ...FUTURE].sort()
const fileForURL = (url: string) => new URL(url).pathname.split('/').at(-1)!.replace(/(-sheet)-[\w-]+\.png$/, '$1.png')
const isMotionPNG = (r: Request) => r.resourceType() !== 'script' && /\/(?:[\w]+)-(?:motion|actions)-sheet(?:-[\w-]+)?\.png(?:\?|$)/.test(r.url())
const hash = (body: Uint8Array) => createHash('sha256').update(body).digest('hex')
const EVIDENCE = 'artifacts/motion/default-flip/production'
function assertPartitions(): void {
  expect(OPENING).toEqual(['guanyu', 'zhangfei', 'soldier'])
  expect(DEFERRED).toEqual(['spearman', 'archer', 'lidian'])
  expect(FUTURE_CANDIDATES).toEqual(['xiahoudun', 'xuchu'])
  expect(FUTURE).toEqual(['xiahoudun']) // remaining 3,363,247 B admits 2,220,630 B, not another 2,177,184 B
  expect([OPENING_FILES.length, DEFERRED_FILES.length, FUTURE_FILES.length]).toEqual([5, 3, 1])
  expect([bytesFor(OPENING_FILES), bytesFor(DEFERRED_FILES), bytesFor(FUTURE_FILES)]).toEqual([9_219_665, 5_286_177, 2_220_630])
  expect(bytesFor(filesFor(FUTURE_CANDIDATES))).toBe(4_397_814)
  expect(entryBytes).toBe(11_440_295)
  expect(CONTRACT_CAPS.stageDownloads).toBe(12 * 1024 * 1024)
  expect(entryBytes).toBeLessThanOrEqual(CONTRACT_CAPS.stageDownloads)
  // Five opening + three eventual deferred + one bounded future = nine pages.
  // Eventual deferred network bytes are NOT charged to the stage-entry cap.
  expect(EXPECTED_FILES).toHaveLength(9)
  expect(bytesFor(EXPECTED_FILES)).toBe(16_726_472)
  expect(EXPECTED_PUBLISHED).toEqual(['archer', 'guanyu', 'lidian', 'soldier', 'spearman', 'xiahoudun', 'zhangfei'])
  expect(EXPECTED_PUBLISHED.some((k) => NON_MOTION.includes(k))).toBe(false)
}

type MotionSprite = {
  frame: { name: string; x: number; y: number; width: number; height: number; realWidth: number; realHeight: number }
  scaleX: number
  displayOriginX: number
  displayOriginY: number
}
type LiveGame = { sim: Sim; syncSprites(): void; sprites: Map<number, MotionSprite> }
const PREVIEW = 'http://localhost:4321'

/**
 * CMR-03 acceptance 6 against the ACTUAL dist build (extended by CMR-06B,
 * CMR-07B, CMR-09B): motion is unconditional, including motion=0; nothing downloads or publishes at
 * boot, entry completes the opening pages, then deferred and bounded future
 * pages complete (only opening + future count against 12 MiB), and both renderers display
 * shared atlas frames whose trim/pivot restores the old per-cell registration.
 */
for (const renderer of ['canvas', 'webgl'] as const) {
  for (const defaultURL of [false, true]) {
    test(`built motion pilot is ${defaultURL ? 'default motion (no motion parameter)' : 'motion=0 has no effect'} (${renderer})`, async ({ page }) => {
      assertPartitions()
      mkdirSync(EVIDENCE, { recursive: true })
      const requests: string[] = [], errors: string[] = [], sourceRequests: string[] = []
      let release!: () => void, heldRequests = 0, completedDownloads = 0
      const held = new Promise<void>((resolve) => { release = resolve })
      await page.route(/\/spearman-motion-sheet-[\w-]+\.png(?:\?|$)/, async (route) => {
        if (!isMotionPNG(route.request())) return route.continue()
        heldRequests++
        if (heldRequests === 1) await held
        await route.continue()
      })
      const downloads: Array<Promise<{ file: string; bytes: number; sha256: string }>> = []
      page.on('response', (r) => {
        if (!isMotionPNG(r.request())) return
        downloads.push((async () => {
          expect(r.status()).toBe(200)
          const body = await r.body()
          completedDownloads++
          return { file: fileForURL(r.url()), bytes: body.length, sha256: hash(body) }
        })())
      })
      page.on('request', (r) => {
        if (isMotionPNG(r)) requests.push(r.url())
        if (new URL(r.url()).pathname.startsWith('/src/')) sourceRequests.push(r.url())
      })
      page.on('pageerror', (e) => errors.push(String(e)))
      await page.goto(`${PREVIEW}/?renderer=${renderer}&autopilot=1${defaultURL ? '' : '&motion=0'}`)
      expect(new URL(page.url()).searchParams.get('motion')).toBe(defaultURL ? null : '0')
      await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 15_000 }).toBe('title')
      // Stage-scoped packs: at title there is NO motion download and NO
      // published motion art - even on the default motion path.
      expect(await page.evaluate(() => Object.keys(window.__DW_GAME__?.scene.getScene('boot').registry.get('paintedHeroArt')?.motions ?? {}))).toEqual([])
      expect(requests, 'no all-cast boot downloads').toEqual([])
      await page.evaluate(() => window.__DW__?.startGame('guanyu', 42, 'stage1'))
      await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
      const published = () => page.evaluate(() => Object.keys(window.__DW_GAME__!.registry.get('paintedHeroArt')?.motions ?? {}).sort())
      let entry: Awaited<(typeof downloads)[number]>[]
      {
        // Hold the first deferred response: game entry must be complete without
        // a later-wave page, and no intermediate final-count match can pass.
        await expect.poll(() => heldRequests).toBe(1)
        await expect.poll(() => completedDownloads).toBe(OPENING_FILES.length)
        await expect.poll(published).toEqual([...OPENING].sort())
        expect(requests.map(fileForURL)).toEqual([...OPENING_FILES, DEFERRED_FILES[0]])
        entry = await Promise.all(downloads)
        expect(entry.map((r) => r.file)).toEqual(OPENING_FILES)
        expect(entry.reduce((n, r) => n + r.bytes, 0)).toBe(bytesFor(OPENING_FILES))
        expect(await page.evaluate(() => {
          const engine = window.__DW_GAME__!
          return engine.textures.getTextureKeys().filter((k) => k.startsWith('motion-source:') || k.startsWith('motion-actions:')).sort()
        })).toEqual(['motion-actions:guanyu', 'motion-actions:zhangfei', 'motion-source:guanyu', 'motion-source:soldier', 'motion-source:zhangfei'])
        await page.screenshot({ path: `${EVIDENCE}/${renderer}-opening.png` })
        release()
        await expect.poll(() => completedDownloads, { timeout: 15_000 }).toBe(EXPECTED_FILES.length)
        await expect.poll(published, { timeout: 15_000 }).toEqual(EXPECTED_PUBLISHED)
        expect(heldRequests).toBe(1)
      }
      const observed = await Promise.all(downloads)
      {
        expect(requests.map(fileForURL)).toEqual(EXPECTED_FILES)
        expect(new Set(requests.map(fileForURL)).size, 'exactly one request per page').toBe(EXPECTED_FILES.length)
        expect(observed.map((r) => r.file).sort()).toEqual([...EXPECTED_FILES].sort())
        expect(observed.reduce((n, r) => n + r.bytes, 0)).toBe(16_726_472)
        for (const r of observed) {
          const committed = readFileSync(`src/game/assets/motion/${r.file}`)
          expect(r.bytes).toBe(committed.length)
          expect(r.sha256).toBe(hash(committed))
        }
        expect(observed.filter((r) => [...OPENING_FILES, ...FUTURE_FILES].includes(r.file)).reduce((n, r) => n + r.bytes, 0)).toBe(entryBytes)
        expect(observed.filter((r) => DEFERRED_FILES.includes(r.file)).reduce((n, r) => n + r.bytes, 0)).toBe(5_286_177)
      }
      const keys = await page.evaluate(() => {
        const game = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
        const p = game.sim.entities.find((e) => e.id === game.sim.playerId)!
        const read = (): string => { game.syncSprites(); return game.sprites.get(p.id)!.frame.name }
        p.state = 'idle'; p.stateTick = 0; p.attackId = null
        const idle = read()
        p.state = 'walk'; p.stateTick = 4
        const walk = read()
        p.state = 'attack'; p.attackId = 'gy.jab1'; p.stateTick = 8
        const strike = read()
        p.state = 'jump'; p.airTicks = 18; p.stateTick = 18; p.z = 48
        const jump = read()
        p.state = 'knockdown'; p.stateTick = 14; p.z = 0
        const down = read()
        p.state = 'getup'; p.stateTick = 11
        const getup = read()
        return { idle, walk, strike, jump, down, getup }
      })
      expect(keys).toEqual({ idle: 'entity:guanyu:motion:walk:0', walk: 'entity:guanyu:motion:walk:2', strike: 'entity:guanyu:motion:jab1:4', jump: 'entity:guanyu:motion:jump:3', down: 'entity:guanyu:motion:fall:6', getup: 'entity:guanyu:motion:getup:4' })
      {
        // Shared atlas frame with trim restoration: the trimmed rect draws at
        // (trimX, trimY) inside the FULL 448x288 art cell (repaint of
        // walk:0), and display origin/scale equal the old per-cell clone's -
        // so every displayed pixel and registration is unchanged here.
        const geo = await page.evaluate(() => {
          const game = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
          const p = game.sim.entities.find((e) => e.id === game.sim.playerId)!
          Object.assign(p, { state: 'idle', stateTick: 0, attackId: null })
          game.syncSprites()
          const s = game.sprites.get(p.id)!
          const f = s.frame
          return {
            name: f.name, x: f.x, y: f.y, w: f.width, h: f.height,
            realW: f.realWidth, realH: f.realHeight,
            scale: s.scaleX, ox: s.displayOriginX, oy: s.displayOriginY,
          }
        })
        expect(geo).toEqual({
          name: 'entity:guanyu:motion:walk:0',
          x: 169, y: 36, w: 113, h: 240, // trimmed content rect restored in place
          realW: 448, realH: 288, // full art cell (box 224x144 at density 2)
          // Pivots equal the old per-cell clone's (origin x full cell, unscaled):
          // draw rect [-224+169, +113] and its flip both match the clone path.
          scale: 0.5, ox: 224, oy: 272,
        })
      }
      expect(await page.evaluate(() => window.__DW_GAME__!.renderer.type)).toBe(renderer === 'canvas' ? 1 : 2)
      expect(sourceRequests, 'browser uses dist, never /src imports').toEqual([])
      expect(errors).toEqual([])
      await page.screenshot({ path: `${EVIDENCE}/${renderer}-${defaultURL ? 'default' : 'zero-query'}-final.png` })
      writeFileSync(`${EVIDENCE}/${renderer}-${defaultURL ? 'default' : 'zero-query'}.json`, JSON.stringify({ opening: OPENING, deferred: DEFERRED, futureCandidates: FUTURE_CANDIDATES, future: FUTURE, entryBytes, eventualBytes: bytesFor(EXPECTED_FILES), requests: requests.map(fileForURL), entry, observed, published: await published(), keys, sourceRequests, errors }, null, 2))
    })
  }
}
