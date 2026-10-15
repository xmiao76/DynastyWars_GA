import { expect, test } from '@playwright/test'
import { mkdirSync, appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../src/core/constants'
import { PNG } from 'pngjs'
import zhaoyun from '../src/game/assets/motion/zhaoyun-prepared.json' with { type: 'json' }
import { decideBotScript } from '../selfplay/bot'
import { assessFrame, regionLegibility, type FrameImage, type MetricResult } from './metrics'
import {
  assessSprite,
  type SpriteImage,
  type SpriteResult,
} from './sprite-metrics'
import {
  CHARACTER_SPRITE_THRESHOLDS,
  PROP_SPRITE_THRESHOLDS,
  thresholdsFor,
} from './thresholds'

// Character-legibility floor: a real hero should render with several distinct
// colors in its body window (armor, skin/helm, weapon, trim) - not a 1-color
// flat blob, and not 95% one dominant color.
// Exact expected inventory comes from source metadata, never the live registry.
const MOTION_KINDS = ['guanyu', 'soldier', 'spearman', 'archer', 'zhangfei', 'zhaoyun',
  'weiyan', 'huangzhong', 'lidian', 'xiahoudun', 'xuchu'] as const
const PROP_KINDS = ['arrow', 'crate', 'meat', 'sword'] as const
type ExpectedMotion = import('../src/game/adapters/motion-art').MotionPrepared
const expectedMotion = Object.fromEntries(MOTION_KINDS.map(kind => {
  const json = (name: string): ExpectedMotion => JSON.parse(readFileSync(
    new URL('../src/game/assets/motion/' + name, import.meta.url), 'utf8')) as ExpectedMotion
  if (kind !== 'guanyu') return [kind, json(kind + '-prepared.json')]
  const base = JSON.parse(readFileSync(new URL('../src/game/assets/motion/prepared.json', import.meta.url), 'utf8')) as { guanyu: ExpectedMotion }
  const actions = json('actions-prepared.json')
  return [kind, { ...base.guanyu, id: kind, revision: 'motion-2', actionSheet: actions.sheet,
    frames: { ...base.guanyu.frames, ...actions.frames },
    signatures: { sheet: base.guanyu.signatures.sheet, actions: actions.signatures.sheet } }]
})) as Record<string, ExpectedMotion>
export const EXPECTED_SPRITES = Object.values(expectedMotion).reduce((n, m) => n + Object.keys(m.frames).length, 0) + PROP_KINDS.length
const MIN_CHARACTER_COLORS = 4
export const MAX_CHARACTER_DOMINANCE = 0.9

// THE VISUAL PRODUCER SIGNAL. Drives the game through fixed screens, captures
// screenshots, measures objective visual-health metrics, asserts thresholds,
// and writes artifacts/vision/{report.json, findings.jsonl}. The eval-loop
// consumes findings.jsonl to file UI tasks when a render regresses.

const OUT_DIR = 'artifacts/vision'

/** Scene activation is not construction: motion packs publish asynchronously. */
async function waitForVisualScene(page: import('@playwright/test').Page, scene: string,
  hero = 'zhaoyun', stage = 'stage1', afterToken = -1): Promise<void> {
  expect(new URL(page.url()).searchParams.has('motion')).toBe(false)
  await expect.poll(() => page.evaluate(() => window.__DW_GAME__?.renderer.type)).toBe(1)
  await expect.poll(() => page.evaluate(async ({ scene, hero, stage, afterToken }) => {
    const game = window.__DW_GAME__
    if (!game || window.__DW__?.getSnapshot().scene !== scene || !game.scene.isActive(scene)) return false
    if (scene !== 'game') return true
    const live = game.scene.getScene('game') as unknown as {
      built: boolean; motionError: unknown; runToken: number;
      sim?: import('../src/core/sim').Sim; sprites: Map<number, Phaser.GameObjects.Sprite>;
      nextSpawnTick(): number
    }
    if (!live.built || live.motionError || live.runToken <= afterToken ||
      !live.sim || live.sim.charId !== hero || live.sim.stage.id !== stage) return false
    // @ts-expect-error Vite browser URL, evaluated in the page rather than Node.
    const { motionRuntime } = await import('/src/game/adapters/motion-art.ts')
    const runtime = motionRuntime()
    if (runtime.gateForTick(game.scene.getScene('game'), live.nextSpawnTick()).blocked) return false
    const art = game.registry.get('paintedHeroArt') as import('../src/game/art/hero-resources').ArtResources
    const verified = (id: number, kind: string): boolean => {
      const pack = art?.motions?.[kind], sprite = live.sprites.get(id)
      if (!pack || pack.id !== kind || !pack.revision || !runtime.kindReady(game.scene.getScene('game'), kind) ||
        !sprite?.visible || sprite.alpha <= 0 || !sprite.frame.name.startsWith(`entity:${kind}:motion:`)) return false
      const cell = pack.frames[sprite.frame.name.slice(`entity:${kind}:motion:`.length)]
      const f = sprite.frame
      return !!cell && sprite.texture.getSourceImage() === (cell.sheet === 'actions' ? pack.actionSheet : pack.sheet) &&
        f.cutX === cell.x && f.cutY === cell.y && f.cutWidth === cell.w && f.cutHeight === cell.h
    }
    if (!verified(live.sim.playerId, hero)) return false
    // Injected boss state must await its own pack, not merely the opening hero.
    return live.sim.entities.filter(e => !['crate', 'meat', 'sword', 'arrow'].includes(e.kind) &&
      e.state !== 'dead').every(e => verified(e.id, e.kind))
  }, { scene, hero, stage, afterToken }), { timeout: 15_000 }).toBe(true)
  await page.evaluate(() => new Promise<void>(resolve => {
    window.__DW_GAME__!.events.once('postrender', () => requestAnimationFrame(() => resolve()))
  }))
}

async function startReady(page: import('@playwright/test').Page, hero = 'zhaoyun', seed = 42,
  stage = 'stage1'): Promise<void> {
  const token = await page.evaluate(({ hero, seed, stage }) => {
    const live = window.__DW_GAME__?.scene.getScene('game') as unknown as { runToken?: number } | undefined
    const token = live?.runToken ?? -1
    window.__DW__!.startGame(hero, seed, stage)
    return token
  }, { hero, seed, stage })
  await waitForVisualScene(page, 'game', hero, stage, token)
}


let report: MetricResult[] = []

/** Record a gate failure for the eval-loop to turn into a UI-FIX task. */
function fileFinding(kind: string, detail: object): void {
  appendFileSync(join(OUT_DIR, 'findings.jsonl'), JSON.stringify({ kind, ...detail, ts: Date.now() }) + '\n')
}

// Findings are reset once for the whole file so every gate in it appends to
// one list; a stale entry from a previous run would re-file finished work.
test.beforeAll(() => {
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, 'findings.jsonl'), '')
})

/**
 * Read one texture out of the live game as RGBA. Alpha is preserved, which is
 * the whole point: every sprite metric masks on it, so the backdrop cannot
 * contribute a single pixel to a character's score.
 */
async function readTexture(
  page: import('@playwright/test').Page,
  key: string,
): Promise<SpriteImage | null> {
  const raw = await page.evaluate((textureKey) => {
    const game = (window as unknown as { __DW_GAME__?: Phaser.Game }).__DW_GAME__
    if (!game?.textures.exists(textureKey)) return null
    const src = game.textures.get(textureKey).getSourceImage() as CanvasImageSource & {
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
    let bin = ''
    for (let i = 0; i < d.length; i += 1) bin += String.fromCharCode(d[i] ?? 0)
    return { width: cv.width, height: cv.height, b64: btoa(bin) }
  }, key)
  if (!raw) return null
  return { width: raw.width, height: raw.height, data: new Uint8Array(Buffer.from(raw.b64, 'base64')) }
}

/** Every `entity:*` texture key the running game has registered. */
async function entityTextureKeys(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const game = (window as unknown as { __DW_GAME__?: Phaser.Game }).__DW_GAME__
    return (game?.textures.getTextureKeys() ?? []).filter((k) => k.startsWith('entity:')).sort()
  })
}

/**
 * Grab the current Phaser render as raw RGBA, resampled to the LOGICAL screen
 * size.
 *
 * Two reasons it is measured at 480x270 rather than at whatever the canvas
 * happens to be. Correctness first: these metrics are about a frame's
 * composition, not its pixel count, and the probes that index into the frame -
 * the player-legibility window, the negative control's cutout - are positioned
 * from sim coordinates, which are logical. Measuring a 2x frame with logical
 * coordinates samples the wrong part of the picture, silently. It is the same
 * reason silhouetteComplexity is resampled onto a fixed grid: a ruler that
 * changes with the resolution is measuring itself.
 *
 * And cost: the pixels cross the CDP boundary as a JSON array, so a 2x canvas
 * is four times the data per screen, nine screens per run, twice over for
 * renderer parity. That alone pushed the suite past its timeout.
 *
 * Smoothing is off deliberately, so this is a straight subsample of the real
 * frame rather than a blurred average - blending would invent colours that were
 * never rendered and inflate colorRichness.
 */
async function snapshotFrame(
  page: import('@playwright/test').Page, name?: string,
): Promise<{ width: number; height: number; data: number[] } | null> {
  const raw = (await page.evaluate(
    ({ w, h }) => {
      const game = (window as unknown as {
        __DW_GAME__?: { renderer?: { snapshot: (cb: (img: HTMLImageElement) => void) => void } }
      }).__DW_GAME__
      if (!game?.renderer?.snapshot) return null
      return new Promise<{ width: number; height: number; data: number[]; png: string; evidence: unknown } | null>((resolve) => {
        game.renderer?.snapshot?.((img) => {
          const cv = document.createElement('canvas')
          cv.width = w
          cv.height = h
          const ctx = cv.getContext('2d')
          if (!ctx) return resolve(null)
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 0, 0, w, h)
          const d = ctx.getImageData(0, 0, cv.width, cv.height).data
          resolve({ width: cv.width, height: cv.height, data: Array.from(d), png: img.src, evidence: (() => {
            const live = window.__DW_GAME__?.scene.getScene('game') as unknown as { built: boolean; sim?: import('../src/core/sim').Sim; sprites: Map<number, Phaser.GameObjects.Sprite> }
            const sprite = live?.sim ? live.sprites.get(live.sim.playerId) : undefined
            return { snapshot: window.__DW__?.getSnapshot(), built: live?.built, frame: sprite?.frame.name, texture: sprite?.texture.key, visible: sprite?.visible, alpha: sprite?.alpha }
          })() })
        })
      })
    },
    { w: SCREEN_WIDTH, h: SCREEN_HEIGHT },
  )) as { width: number; height: number; data: number[]; png: string; evidence: unknown } | null
  if (raw && name) {
    writeFileSync(join(OUT_DIR, `${name}.png`), Buffer.from(raw.png.split(',')[1]!, 'base64'))
    writeFileSync(join(OUT_DIR, `${name}-state.json`), JSON.stringify(raw.evidence, null, 2))
  }
  return raw
}

function toFrame(raw: { width: number; height: number; data: number[] }): FrameImage {
  return { width: raw.width, height: raw.height, data: new Uint8Array(raw.data) }
}

/** At a game snapshot, screen position of the player in logical px. */
async function playerScreenPos(page: import('@playwright/test').Page): Promise<{ x: number; y: number } | null> {
  const sim = await page.evaluate(() => window.__DW__?.getSnapshot().sim ?? null)
  if (!sim) return null
  // Round to whole px: regionLegibility indexes a Uint8Array, and a fractional
  // index is not a canonical numeric key - every such read is undefined (black),
  // which made the window read as empty whenever the character stood on a
  // non-integer position (the source of the intermittent colorCount=0 flake).
  return { x: Math.round(sim.player.x - sim.scrollX), y: Math.round(sim.player.y) }
}

test('visual-health gate: every core screen renders acceptably', async ({ page }) => {
  test.setTimeout(180_000)
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(String(e)))
  await page.setViewportSize({ width: 960, height: 540 })

  await page.goto('/?renderer=canvas&autopilot=1&vision=1', {
    waitUntil: 'networkidle',
  })
  await waitForVisualScene(page, 'title')

  const screens: Array<{ name: string; frame: FrameImage | null }> = []

  // 1) Title
  await waitForVisualScene(page, 'title')
  screens.push({ name: 'title', frame: await snapFrame(page, 'title') })

  // 2) Select
  await page.keyboard.press('Enter')
  await waitForVisualScene(page, 'select')
  screens.push({ name: 'select', frame: await snapFrame(page, 'select') })

  // 3) Game idle
  await page.keyboard.press('Enter') // confirm Guan Yu, the first roster entry
  await waitForVisualScene(page, 'game', 'guanyu')
  screens.push({ name: 'game_idle', frame: await snapFrame(page, 'game_idle') })

  // 4) Game combat (bot fights a bit; frozen effects are gated off, but the
  // scene is live with characters + HUD).
  await startReady(page)
  for (let i = 0; i < 5; i += 1) {
    const sn = await page.evaluate(() => window.__DW__?.getSnapshot())
    if (!sn?.sim) break
    const script = decideBotScript(sn)
    const tb: number = sn.tick
    await page.evaluate((inputs) => window.__DW__?.run(inputs), script)
    await page.waitForFunction(
      (t) => t !== undefined && (window.__DW__?.getSnapshot()?.tick ?? -1) >= t,
      tb + script.length,
    )
  }
  await waitForVisualScene(page, 'game')
  const combatFrame = await snapFrame(page, 'game_combat')
  screens.push({ name: 'game_combat', frame: combatFrame })
  // Character-legibility guard: the player must render as a multi-color figure
  // (armor + skin + weapon), not a flat single-color blob, in this same ready frame.
  const pos = await playerScreenPos(page)
  const playerLeg = combatFrame && pos ? regionLegibility(combatFrame, pos.x, pos.y, 26) : { colorCount: 0, dominantFraction: 1 }
  console.log('PLAYER LEGIBILITY:', JSON.stringify(playerLeg))
  expect(playerLeg.colorCount).toBeGreaterThanOrEqual(MIN_CHARACTER_COLORS)
  expect(playerLeg.dominantFraction).toBeLessThanOrEqual(MAX_CHARACTER_DOMINANCE)

  // 5) Boss fight (forced via the bridge - fast and deterministic).
  await startReady(page, 'zhaoyun', 42, 'stage3')
  await page.evaluate(() => window.__DW__?.forceBoss())
  await waitForVisualScene(page, 'game', 'zhaoyun', 'stage3')
  screens.push({ name: 'boss_fight', frame: await snapFrame(page, 'boss_fight') })

  // 6) Second hero (Zhang Fei) into combat - per-hero rendering is watched.
  await startReady(page, 'zhangfei', 99)
  for (let i = 0; i < 5; i += 1) {
    const sn = await page.evaluate(() => window.__DW__?.getSnapshot())
    if (!sn?.sim) break
    const script = decideBotScript(sn)
    const tb: number = sn.tick
    await page.evaluate((inputs) => window.__DW__?.run(inputs), script)
    await page.waitForFunction(
      (t) => t !== undefined && (window.__DW__?.getSnapshot()?.tick ?? -1) >= t,
      tb + script.length,
    )
  }
  await waitForVisualScene(page, 'game', 'zhangfei')
  screens.push({ name: 'game_combat_zhangfei', frame: await snapFrame(page, 'game_combat_zhangfei') })

  // 7) Result screen (forced via the bridge - deterministic, no marathon).
  await startReady(page)
  await page.evaluate(() => window.__DW__?.forceResult())
  await waitForVisualScene(page, 'result')
  screens.push({ name: 'result', frame: await snapFrame(page, 'result') })

  // 8) Game-over screen (forced via the bridge).
  await startReady(page)
  await page.evaluate(() => window.__DW__?.forceGameOver())
  await waitForVisualScene(page, 'gameover')
  screens.push({ name: 'game_over', frame: await snapFrame(page, 'game_over') })

  // 9) Game-complete screen - the ending. Reached by clearing the LAST stage,
  // so forcing the result from stage 3 and confirming lands on it. It is the
  // final thing a player who finishes the game sees and nothing watched it.
  await startReady(page, 'zhaoyun', 42, 'stage3')
  await page.evaluate(() => window.__DW__?.forceResult())
  await waitForVisualScene(page, 'result')
  await page.keyboard.press('Enter')
  await waitForVisualScene(page, 'gamecomplete')
  screens.push({ name: 'game_complete', frame: await snapFrame(page, 'game_complete') })

  // Assess every screen.
  report = screens
    .map(({ name, frame }) => {
      if (!frame) return { screen: name, coverage: -1, colorRichness: 0, saturation: 0, regionFill: 0, pass: false, failures: ['no frame captured'] }
      return assessFrame(frame, name, thresholdsFor(name))
    })
    .map((r) => ({ ...r, coverage: round3(r.coverage), saturation: round3(r.saturation) }))

  writeFileSync(join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2))
  console.log('VISION REPORT:', JSON.stringify(report))

  // Append any failures to findings.jsonl for the eval-loop.
  for (const r of report) if (!r.pass) fileFinding('frame', r)

  expect(pageErrors).toEqual([])
  // Gate: all screens must render acceptably. On failure the eval-loop files
  // UI tasks from findings.jsonl; the consumer treats this as not-done.
  const failed = report.filter((r) => !r.pass)
  expect(failed, `visual gate failed: ${JSON.stringify(failed)}`).toEqual([])
})

/**
 * THE CHARACTER GATE. The frame metrics above are frame-global and ride on the
 * backdrop, so they stayed green through a cast of featureless rectangles.
 * This one reads the actual sprite textures - alpha-masked, so the backdrop
 * contributes nothing - and asks whether each one reads as a character: does
 * its silhouette change down its height, does anything stand clear of the
 * torso, does it carry more than a couple of tones, is it outlined?
 */
test('sprite gate: all published motion frames and shared props', async ({ page }) => {
  test.setTimeout(180_000)
  const pageErrors: string[] = []
  page.on('pageerror', e => pageErrors.push(String(e)))
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas&autopilot=1&vision=1', { waitUntil: 'networkidle' })
  await startReady(page)
  await page.evaluate(() => window.__DW__?.registerAllArt())
  expect(await entityTextureKeys(page)).toEqual(PROP_KINDS.map(k => 'entity:' + k))
  const props: SpriteResult[] = []
  for (const kind of PROP_KINDS) {
    const key = 'entity:' + kind, image = await readTexture(page, key)
    expect(image, key).not.toBeNull()
    if (image) props.push(assessSprite(image, key, PROP_SPRITE_THRESHOLDS))
  }

  // Inspect immediately after each bounded required load: no all-cast cache
  // assumption, no synthetic textures, no legacy fallback/pose inventory.
  const inventories = []
  for (const kind of MOTION_KINDS) {
    const result = await page.evaluate(async ({ kind, expected, standingThresholds, kinds }) => {
      // @ts-expect-error Vite browser modules, not Node imports.
      const adapter: typeof import('../src/game/adapters/motion-art') = await import('/src/game/adapters/motion-art.ts')
      // @ts-expect-error Vite browser modules, not Node imports.
      const metrics: typeof import('./sprite-metrics') = await import('/vision/sprite-metrics.ts')
      // @ts-expect-error Vite browser modules, not Node imports.
      const signature: typeof import('../src/game/art/image-signature') = await import('/src/game/art/image-signature.ts')
      // @ts-expect-error Vite browser modules, not Node imports.
      const player: typeof import('../src/game/art/motion-clips') = await import('/src/game/art/motion-clips.ts')
      const game = window.__DW_GAME__!, scene = game.scene.getScene('game')
      const failures: string[] = []
      const check = (ok: boolean, key: string, metric: string): void => {
        if (!ok) failures.push('FAIL ' + kind + '/' + key + '/' + metric)
      }
      check(JSON.stringify(Object.keys(adapter.MOTION_PACKS).sort()) === JSON.stringify([...kinds].sort()), 'pack', 'stable-11-kind-catalog')
      const runtime = adapter.motionRuntime()
      const loaded = await runtime.prepareKinds(scene, [kind])
      check(loaded.length === 1 && loaded[0]!.outcome.ok && runtime.kindReady(scene, kind), 'pack', 'required-publication')
      const art = (game.registry.get('paintedHeroArt') as import('../src/game/art/hero-resources').ArtResources).motions?.[kind]
      if (!art) return { kind, failures, frames: [], standing: [], clipRefs: 0, clips: 0 }
      check(art.id === kind && art.revision === expected.revision, 'pack', 'identity-revision')
      check(JSON.stringify(Object.keys(art.frames).sort()) === JSON.stringify(Object.keys(expected.frames).sort()), 'pack', 'exact-manifest-keys')
      const canonicalClips = adapter.MOTION_PACKS[kind]!.clips()
      check(JSON.stringify(art.clips) === JSON.stringify(canonicalClips), 'pack', 'canonical-clip-timing-framekeys')
      let clipRefs = 0
      for (const [name, clip] of Object.entries(canonicalClips)) {
        check(clip.duration > 0 && clip.keys.length > 0 && clip.keys[0]!.tick === 0, name, 'clip-duration-first-key')
        let previous = -1
        for (const key of clip.keys) {
          clipRefs++
          check(Number.isInteger(key.tick) && key.tick > previous && key.tick < clip.duration, name, 'phase-tick-' + key.tick)
          check(!!expected.frames[key.frame] && !!art.frames[key.frame], key.frame, 'clip-reference-' + name)
          check(player.sampleClip(art, name, key.tick) === key.frame, key.frame, 'phase-sample-' + name)
          previous = key.tick
        }
      }
      for (const p of adapter.MOTION_PACKS[kind]!.pages) {
        const texture = game.textures.exists(p.sourceKey) ? game.textures.get(p.sourceKey) : undefined
        const src = texture?.getSourceImage() as HTMLImageElement | undefined
        check(!!src && src.width === p.width && src.height === p.height, p.name, 'live-page-geometry')
        check(src === (p.name === 'actions' ? art.actionSheet : art.sheet), p.name, 'published-source-identity')
        if (src) {
          const cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height
          const ctx = cv.getContext('2d')!; ctx.drawImage(src, 0, 0)
          check(signature.signatureMatches(signature.imageSignature(ctx.getImageData(0, 0, cv.width, cv.height)),
            expected.signatures[p.name === 'actions' ? 'actions' : 'sheet']), p.name, 'live-drawing-signature')
        }
      }
      const standingKeys = new Set(canonicalClips.idle!.keys.map(k => k.frame))
      const standing: import('./sprite-metrics').SpriteResult[] = []
      const frames = []
      for (const [key, cell] of Object.entries(expected.frames)) {
        const actual = art.frames[key]
        check(JSON.stringify(actual) === JSON.stringify(cell), key, 'exact-manifest-rect')
        const textureKey = cell.sheet === 'actions' ? adapter.motionTextureKeys(kind).actions : adapter.motionTextureKeys(kind).sheet
        const tex = game.textures.exists(textureKey) ? game.textures.get(textureKey) : undefined
        const id = adapter.motionFrameId(kind, key), frame = tex?.has(id) ? tex.get(id) : undefined
        const source = tex?.getSourceImage() as CanvasImageSource
        const sw = cell.srcW ?? cell.w, sh = cell.srcH ?? cell.h, tx = cell.trimX ?? 0, ty = cell.trimY ?? 0
        check(!!frame && frame.name === id && frame.cutX === cell.x && frame.cutY === cell.y &&
          frame.cutWidth === cell.w && frame.cutHeight === cell.h && frame.realWidth === sw && frame.realHeight === sh &&
          frame.x === tx && frame.y === ty, key, 'live-frame-cut-trim-fullcell')
        check(source === (cell.sheet === 'actions' ? art.actionSheet : art.sheet), key, 'live-frame-source-identity')
        check(sw === expected.box.width * expected.density && sh === expected.box.height * expected.density &&
          tx >= 0 && ty >= 0 && tx + cell.w <= sw && ty + cell.h <= sh, key, 'fullcell-geometry')
        if (!frame || !source) continue
        const cv = document.createElement('canvas'); cv.width = sw; cv.height = sh
        const ctx = cv.getContext('2d')!
        // Restore the actual Phaser trim inside the full registration cell.
        ctx.drawImage(source, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
          frame.x, frame.y, frame.cutWidth, frame.cutHeight)
        const image = { width: sw, height: sh, data: new Uint8Array(ctx.getImageData(0, 0, sw, sh).data) }
        const bounds = metrics.opaqueBounds(image), colors = metrics.opaqueColorStats(image), bands = metrics.tonalBands(image)
        check(!!bounds && bounds.count > 0 && bounds.x1 > bounds.x0 && bounds.y1 > bounds.y0, key, 'nonempty-alpha-geometry')
        // Orientation-independent drawing/shading checks for every cell,
        // including prone/airborne drawings. No standing silhouette rubric there.
        check(colors.colorCount >= standingThresholds.minColorCount, key, 'colorCount ' + colors.colorCount)
        check(colors.dominantFraction <= standingThresholds.maxDominantFraction, key, 'dominantFraction ' + colors.dominantFraction)
        check(bands >= standingThresholds.minTonalBands, key, 'tonalBands ' + bands)
        if (standingKeys.has(key)) {
          const verdict = metrics.assessSprite(image, kind + '/' + key, standingThresholds)
          standing.push(verdict)
          for (const metric of verdict.failures) check(false, key, metric)
        }
        frames.push({ key, bounds, ...colors, tonalBands: bands, cut: [frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight],
          trim: [frame.x, frame.y], full: [sw, sh], texture: textureKey })
      }
      check(standing.length === standingKeys.size && standing.length > 0, 'idle', 'standing-guard-coverage')
      return { kind, failures, frames, standing, clipRefs, clips: Object.keys(canonicalClips).length }
    }, { kind, expected: expectedMotion[kind]!, standingThresholds: CHARACTER_SPRITE_THRESHOLDS, kinds: MOTION_KINDS })
    inventories.push(result)
    expect.soft(result.frames.length, kind + ' exact metadata frame count').toBe(Object.keys(expectedMotion[kind]!.frames).length)
  }
  const failures = [...inventories.flatMap(i => i.failures), ...props.flatMap(p => p.failures.map(f => 'FAIL ' + p.label + '/' + f))]
  const retirement = { status: 'RETIRED-NOT-PASS', legacySprites: 158, legacyReach: 55, legacyRetract: 110,
    reason: 'Deleted rig pose inventory; motion has per-kind clips, not five shared strike poses. Existing motion phase/frame-key/quality tests remain required; no timing or pixel changes.' }
  writeFileSync(join(OUT_DIR, 'sprite-report.json'), JSON.stringify({ expectedFrames: EXPECTED_SPRITES - 4,
    inventories, props, retirement, failures }, null, 2))
  for (const detail of failures) { console.log(detail); fileFinding('sprite', { detail }) }
  console.log('MOTION SPRITE GATE:', JSON.stringify({ kinds: inventories.length,
    frames: inventories.reduce((n, i) => n + i.frames.length, 0), props: props.length,
    clips: inventories.reduce((n, i) => n + i.clips, 0), clipRefs: inventories.reduce((n, i) => n + i.clipRefs, 0), failures }))
  expect(inventories).toHaveLength(11)
  expect(inventories.reduce((n, i) => n + i.frames.length, props.length)).toBe(EXPECTED_SPRITES)
  expect(props).toHaveLength(4)
  expect(pageErrors).toEqual([])
  expect(failures, 'published motion/prop quality failures (not waived)').toEqual([])
})

/**
 * NEGATIVE CONTROL. A gate that cannot fail proves nothing, and that is
 * exactly how the rectangle cast shipped: the old character probe sampled a
 * screen box that included the backdrop, so a patch of empty sky scored 4-17
 * colors at 0.29-0.47 dominance and PASSED it. This test feeds the character
 * gate a patch of empty sky and requires it to say no.
 *
 * It carries a SECOND control, because the first one has a dependency worth
 * naming: the sky patch only fails the gate while the sky is flat. A painted,
 * cel-shaded backdrop splits rows and carries tones of its own, so that patch
 * would start PASSING and this proof would evaporate without anything going
 * red. The second control does not involve the background at all - it takes a
 * real sprite out of the running game and flattens it to a single colour, so
 * the silhouette is genuinely the game's own and only the shading is gone.
 */
test('negative control: the character gate rejects an empty backdrop and a flat silhouette', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas&autopilot=1&vision=1', { waitUntil: 'networkidle' })
  await startReady(page)
  const frame = await snapFrame(page)
  expect(frame, 'no frame captured').not.toBeNull()
  if (!frame) return

  // A window of sky well above the walk band, where no actor can stand.
  const patch = cutout(frame, Math.floor(frame.width * 0.62), Math.floor(frame.height * 0.2), 30)
  const verdict = assessSprite(patch, 'empty-backdrop', CHARACTER_SPRITE_THRESHOLDS)
  console.log('NEGATIVE CONTROL:', JSON.stringify(verdict))
  expect(
    verdict.pass,
    `the character gate accepted an empty backdrop patch - it is vacuous: ${JSON.stringify(verdict)}`,
  ).toBe(false)

  // And the specific hole that let the rectangles through: the old screen-box
  // probe is documented here as background-dominated, so nobody re-adopts it
  // as a character check.
  const old = regionLegibility(frame, Math.floor(frame.width * 0.62), Math.floor(frame.height * 0.2), 26)
  expect(
    old.colorCount,
    'sky should be rich - proving the old screen-box probe measured the backdrop, not the actor',
  ).toBeGreaterThanOrEqual(4)

  // Second control: the game's own hero, with every drawn pixel flattened to
  // one mid-tone. Shape metrics still pass - it is a real figure - so only the
  // shading metrics can catch it, which is exactly the job they were added for.
  const selected = await page.evaluate(() => {
    const game = window.__DW_GAME__!
    const live = game.scene.getScene('game') as unknown as {
      sim: import('../src/core/sim').Sim; sprites: Map<number, Phaser.GameObjects.Sprite>
    }
    const sprite = live.sprites.get(live.sim.playerId)!, f = sprite.frame
    const pack = (game.registry.get('paintedHeroArt') as import('../src/game/art/hero-resources').ArtResources).motions!.zhaoyun!
    const cv = document.createElement('canvas')
    cv.width = f.realWidth; cv.height = f.realHeight
    const ctx = cv.getContext('2d')!
    ctx.drawImage(sprite.texture.getSourceImage() as CanvasImageSource,
      f.cutX, f.cutY, f.cutWidth, f.cutHeight, f.x, f.y, f.cutWidth, f.cutHeight)
    return { name: f.name, texture: sprite.texture.key, cut: [f.cutX, f.cutY, f.cutWidth, f.cutHeight],
      trim: [f.x, f.y], full: [f.realWidth, f.realHeight], origin: [sprite.displayOriginX, sprite.displayOriginY],
      revision: pack.revision, sourceMatches: sprite.texture.getSourceImage() === pack.sheet,
      state: live.sim.entities.find(e => e.id === live.sim.playerId)!.state,
      width: cv.width, height: cv.height, data: Array.from(ctx.getImageData(0, 0, cv.width, cv.height).data) }
  })
  const cell = zhaoyun.frames['walk:0']
  expect(selected.name).toBe('entity:zhaoyun:motion:walk:0')
  expect(selected.texture).toBe('motion-source:zhaoyun')
  expect(selected.state).toBe('idle')
  expect(selected.revision).toBe(zhaoyun.revision)
  expect(selected.sourceMatches).toBe(true)
  expect(selected.cut).toEqual([cell.x, cell.y, cell.w, cell.h])
  expect(selected.trim).toEqual([cell.trimX, cell.trimY])
  expect(selected.full).toEqual([cell.srcW, cell.srcH])
  expect(selected.origin).toEqual([cell.srcW / 2, zhaoyun.box.groundY * zhaoyun.density])
  const hero: SpriteImage = { width: selected.width, height: selected.height, data: Uint8Array.from(selected.data) }
  expect(hero, 'no hero texture to build the flat-silhouette control from').not.toBeNull()
  if (!hero) return
  const real = assessSprite(hero, 'zhaoyun:idle', CHARACTER_SPRITE_THRESHOLDS)
  expect(real.pass, `the control is only meaningful if the real sprite passes: ${JSON.stringify(real)}`).toBe(true)

  const flat = flatten(hero, [96, 110, 150])
  const flatVerdict = assessSprite(flat, 'flat-silhouette', CHARACTER_SPRITE_THRESHOLDS)
  console.log('NEGATIVE CONTROL (flat silhouette):', JSON.stringify(flatVerdict))
  for (const [name, image] of [['real-motion-idle', hero], ['flat-motion-idle', flat], ['empty-backdrop', patch]] as const) {
    writeFileSync(join(OUT_DIR, name + '.png'), PNG.sync.write({ width: image.width, height: image.height, data: Buffer.from(image.data) } as PNG))
  }
  writeFileSync(join(OUT_DIR, 'negative-controls.json'), JSON.stringify({ selected: { ...selected, data: undefined }, real, flat: flatVerdict, empty: verdict }, null, 2))
  expect(flatVerdict.silhouetteComplexity).toBe(real.silhouetteComplexity)
  expect(flatVerdict.appendageRatio).toBe(real.appendageRatio)
  expect(flatVerdict.outlineRatio).toBeGreaterThanOrEqual(CHARACTER_SPRITE_THRESHOLDS.minOutlineRatio)
  expect(flatVerdict.failures.some(f => f.startsWith('colorCount'))).toBe(true)
  expect(
    flatVerdict.pass,
    `the character gate accepted an unshaded silhouette - it is vacuous: ${JSON.stringify(flatVerdict)}`,
  ).toBe(false)
  expect(
    flatVerdict.failures.some((f) => f.startsWith('tonalBands')),
    `the shading metric did not catch it: ${JSON.stringify(flatVerdict)}`,
  ).toBe(true)
})

/** Every drawn pixel repainted one colour; alpha, and so the shape, untouched. */
function flatten(img: SpriteImage, rgb: [number, number, number]): SpriteImage {
  const data = new Uint8Array(img.data)
  for (let i = 0; i < data.length; i += 4) {
    if ((data[i + 3] ?? 0) === 0) continue
    const x = (i / 4) % img.width, y = Math.floor(i / 4 / img.width)
    const edge = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dy]) => {
      const nx = x + dx!, ny = y + dy!
      return nx < 0 || ny < 0 || nx >= img.width || ny >= img.height || (img.data[(ny * img.width + nx) * 4 + 3] ?? 0) < 32
    })
    const ink = edge && ((data[i]! + data[i + 1]! + data[i + 2]!) / 3 <= 110)
    if (ink) { data[i] = 30; data[i + 1] = 30; data[i + 2] = 30; continue }
    data[i] = rgb[0]
    data[i + 1] = rgb[1]
    data[i + 2] = rgb[2]
  }
  return { width: img.width, height: img.height, data }
}

/**
 * HUD textures must actually contain pixels. `hudpanels.spec` asserts these
 * keys EXIST, which they did while being fully transparent: the bar textures
 * were built with `Graphics.fillGradientStyle` + `generateTexture`, and
 * generateTexture always renders through the canvas path, which ignores
 * gradient fills. Every HP bar in the game was invisible and every gate was
 * green.
 */
test('hud gate: every HUD bar actually paints colour on the screen', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas&autopilot=1&vision=1', { waitUntil: 'networkidle' })
  await startReady(page)

  // The bars are drawn with Graphics and record what they drew, so this can
  // sample the FRAME where a bar claims to be. The previous version asked
  // whether three bar textures contained pixels - a question that only existed
  // because those textures had once been entirely transparent. Reading the
  // rendered frame answers the thing that was actually wanted: is there a
  // coloured bar on the screen where the HUD says there is one.
  const bars = await page.evaluate(() => {
    const scene = (window as unknown as { __DW_GAME__?: Phaser.Game }).__DW_GAME__?.scene.getScene('hud')
    if (!scene) return []
    return scene.children.list
      .filter((c) => (c as unknown as { visible: boolean }).visible)
      .map((c) => (c as unknown as { getData?: (k: string) => unknown }).getData?.('bar'))
      .filter((b): b is { x: number; y: number; w: number; h: number; ratio: number } => !!b)
  })
  expect(bars.length, 'the HUD drew no bars at all').toBeGreaterThan(0)

  const frame = await snapFrame(page)
  expect(frame, 'no frame captured').not.toBeNull()
  if (!frame) return

  const blank: string[] = []
  bars.forEach((bar, i) => {
    let coloured = 0
    const x1 = Math.min(frame.width - 1, Math.round(bar.x + bar.w * bar.ratio))
    const y1 = Math.min(frame.height - 1, Math.round(bar.y + bar.h))
    for (let y = Math.max(0, Math.round(bar.y)); y < y1; y += 1) {
      for (let x = Math.max(0, Math.round(bar.x)); x < x1; x += 1) {
        const p = (y * frame.width + x) * 4
        const r = frame.data[p] ?? 0
        const g = frame.data[p + 1] ?? 0
        const b = frame.data[p + 2] ?? 0
        const sat = Math.max(r, g, b) - Math.min(r, g, b)
        if (sat > 50 && (r + g + b) / 3 > 40) coloured += 1
      }
    }
    const area = Math.max(1, (x1 - Math.round(bar.x)) * (y1 - Math.round(bar.y)))
    if (coloured / area < 0.3) blank.push(`bar ${i} at ${bar.x},${bar.y}: only ${Math.round((coloured / area) * 100)}% coloured`)
  })
  for (const detail of blank) fileFinding('hud', { label: 'hud-bar', failures: [detail] })
  console.log(`HUD GATE: ${bars.length - blank.length}/${bars.length} bars painting colour`)
  expect(blank, 'HUD bars render nothing where they claim to be').toEqual([])
})

/** Crop a square window out of a frame as an opaque sprite image. */
function cutout(frame: FrameImage, cx: number, cy: number, radius: number): SpriteImage {
  const x0 = Math.max(0, cx - radius)
  const y0 = Math.max(0, cy - radius)
  const x1 = Math.min(frame.width - 1, cx + radius)
  const y1 = Math.min(frame.height - 1, cy + radius)
  const w = x1 - x0 + 1
  const h = y1 - y0 + 1
  const data = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const s = ((y0 + y) * frame.width + (x0 + x)) * 4
      const d = (y * w + x) * 4
      data[d] = frame.data[s] ?? 0
      data[d + 1] = frame.data[s + 1] ?? 0
      data[d + 2] = frame.data[s + 2] ?? 0
      data[d + 3] = 255
    }
  }
  return { width: w, height: h, data }
}

/** One snapshot only: readiness is semantic, never a retry-until-nonblank loop. */
async function snapFrame(page: import('@playwright/test').Page, name?: string): Promise<FrameImage | null> {
  const raw = await snapshotFrame(page, name)
  return raw ? toFrame(raw) : null
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000
}
