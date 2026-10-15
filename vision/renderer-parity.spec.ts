import { expect, test } from '@playwright/test'
import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../src/core/constants'
import { neutralInput } from '../src/core/types'
import {
  colorRichness,
  coverage,
  meanLuminance,
  regionFill,
  saturation,
  type FrameImage,
} from './metrics'

/**
 * RENDERER PARITY.
 *
 * The game ships on `Phaser.AUTO`, which is WebGL in every real browser, but
 * every automated check runs `?renderer=canvas` to keep headless runs stable.
 * That means the whole visual gate was scoring a rendering path no player ever
 * sees, and it hid a class of bug twice over:
 *
 *  - `Graphics.fillGradientStyle` is WebGL-only. In canvas the fill draws
 *    NOTHING. The HUD bar textures were fully transparent, and the menu panels
 *    rendered as borders with nothing inside - so content behind them showed
 *    through in canvas and was covered by an opaque slab in WebGL.
 *
 * The same deterministic scene drawn by two renderers should look materially
 * the same. Where it does not, one of them is wrong, and the player only ever
 * sees the one the gate was not looking at. This test loads each core screen
 * under both renderers and requires their measurements to agree.
 */

const OUT_DIR = 'artifacts/vision'

/** Scene activation is not construction: motion packs publish asynchronously. */
async function waitForVisualScene(page: import('@playwright/test').Page, scene: string,
  hero = 'zhaoyun', stage = 'stage1', afterToken = -1): Promise<void> {
  expect(new URL(page.url()).searchParams.has('motion')).toBe(false)
  await expect.poll(() => page.evaluate(async ({ scene, hero, stage, afterToken }) => {
    const game = window.__DW_GAME__
    if (!game || window.__DW__?.getSnapshot().scene !== scene || !game.scene.isActive(scene)) return false
    if (scene !== 'game') return true
    const live = game.scene.getScene('game') as unknown as {
      built: boolean; motionOn: boolean; motionError: unknown; runToken: number;
      sim?: import('../src/core/sim').Sim; sprites: Map<number, Phaser.GameObjects.Sprite>;
      nextSpawnTick(): number
    }
    if (!live.built || !live.motionOn || live.motionError || live.runToken <= afterToken ||
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


/** How far the two renderers may drift before it counts as a real difference. */
export const PARITY_TOLERANCE = {
  coverage: 0.1,
  saturation: 0.12,
  regionFill: 1,
  meanLuminance: 22,
  /** colorRichness is a count, so compare as a ratio rather than a difference. */
  colorRichnessRatio: 2.0,
}

interface Shot {
  coverage: number
  colorRichness: number
  saturation: number
  regionFill: number
  meanLuminance: number
}

function measure(img: FrameImage): Shot {
  return {
    coverage: coverage(img),
    colorRichness: colorRichness(img),
    saturation: saturation(img),
    regionFill: regionFill(img),
    meanLuminance: meanLuminance(img),
  }
}

async function snapshot(page: import('@playwright/test').Page, name: string, renderer: string): Promise<FrameImage | null> {
  // Resampled to the logical screen size; see vision.spec.ts's snapshotFrame
  // for why the ruler must not scale with the canvas.
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
  if (raw) {
    writeFileSync(join(OUT_DIR, `parity-${renderer}-${name}.png`), Buffer.from(raw.png.split(',')[1]!, 'base64'))
    writeFileSync(join(OUT_DIR, `parity-${renderer}-${name}-state.json`), JSON.stringify(raw.evidence, null, 2))
  }
  return raw ? { width: raw.width, height: raw.height, data: new Uint8Array(raw.data) } : null
}

/** Drive one renderer through every core screen and measure each. */
async function captureScreens(
  page: import('@playwright/test').Page,
  renderer: 'canvas' | 'webgl',
): Promise<Record<string, Shot>> {
  const query = renderer === 'canvas' ? '?renderer=canvas&autopilot=1&vision=1' : '?autopilot=1&vision=1'
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto(`/${query}`, { waitUntil: 'networkidle' })
  await waitForVisualScene(page, 'title')

  expect(new URL(page.url()).searchParams.has('motion')).toBe(false)
  const actual = await page.evaluate(() => {
    const g = (window as unknown as { __DW_GAME__?: { renderer: { type: number } } }).__DW_GAME__
    return g?.renderer.type === 1 ? 'canvas' : 'webgl'
  })
  expect(actual, `asked for ${renderer} but the game booted ${actual}`).toBe(renderer)

  const out: Record<string, Shot> = {}
  const shoot = async (name: string): Promise<void> => {
    const frame = await snapshot(page, name, renderer)
    expect(frame, `no frame for ${name} under ${renderer}`).not.toBeNull()
    if (frame) out[name] = measure(frame)
  }

  await shoot('title')
  await page.keyboard.press('Enter')
  await waitForVisualScene(page, 'select')
  await shoot('select')
  await startReady(page)
  await shoot('game_idle')
  // The in-stage screens are where the HUD lives, and the HUD is the part
  // that manages depth by hand - exactly the thing that went wrong elsewhere.
  const walk = Array.from({ length: 120 }, () => ({ ...neutralInput(), right: true }))
  const before = await page.evaluate(() => window.__DW__!.getSnapshot().tick)
  await page.evaluate((inputs) => window.__DW__?.run(inputs), walk)
  await page.waitForFunction(t => window.__DW__!.getSnapshot().tick >= t, before + walk.length)
  await waitForVisualScene(page, 'game')
  await shoot('game_combat')
  await startReady(page, 'zhangfei', 42, 'stage3')
  await page.evaluate(() => window.__DW__?.forceBoss())
  await waitForVisualScene(page, 'game', 'zhangfei', 'stage3')
  await shoot('boss_fight')
  await startReady(page)
  await page.evaluate(() => window.__DW__?.forceResult())
  await waitForVisualScene(page, 'result')
  await shoot('result')
  await startReady(page)
  await page.evaluate(() => window.__DW__?.forceGameOver())
  await waitForVisualScene(page, 'gameover')
  await shoot('game_over')
  return out
}

test('renderer parity: canvas and WebGL render the same game', async ({ page }) => {
  // Measured at 1.8-2.0 minutes for the full two-renderer pass on this
  // machine, which was sitting against the old 180s budget - and one run died
  // as a timeout with no comparison failures and no findings entry, which is
  // what a stall in the headless WebGL pass looks like. The budget is a
  // ceiling, not a wait: nothing about the assertions changed.
  test.setTimeout(300_000)
  mkdirSync(OUT_DIR, { recursive: true })

  const canvas = await captureScreens(page, 'canvas')
  const webgl = await captureScreens(page, 'webgl')

  const report: Array<{ screen: string; canvas: Shot; webgl: Shot; failures: string[] }> = []
  for (const screen of Object.keys(canvas)) {
    const c = canvas[screen]
    const w = webgl[screen]
    const failures: string[] = []
    if (!c || !w) {
      failures.push('missing capture')
    } else {
      const diff = (a: number, b: number): number => Math.abs(a - b)
      if (diff(c.coverage, w.coverage) > PARITY_TOLERANCE.coverage) {
        failures.push(`coverage canvas ${c.coverage.toFixed(3)} vs webgl ${w.coverage.toFixed(3)}`)
      }
      if (diff(c.saturation, w.saturation) > PARITY_TOLERANCE.saturation) {
        failures.push(`saturation canvas ${c.saturation.toFixed(3)} vs webgl ${w.saturation.toFixed(3)}`)
      }
      if (diff(c.regionFill, w.regionFill) > PARITY_TOLERANCE.regionFill) {
        failures.push(`regionFill canvas ${c.regionFill} vs webgl ${w.regionFill}`)
      }
      if (diff(c.meanLuminance, w.meanLuminance) > PARITY_TOLERANCE.meanLuminance) {
        failures.push(
          `meanLuminance canvas ${c.meanLuminance.toFixed(1)} vs webgl ${w.meanLuminance.toFixed(1)}`,
        )
      }
      const hi = Math.max(c.colorRichness, w.colorRichness)
      const lo = Math.max(1, Math.min(c.colorRichness, w.colorRichness))
      if (hi / lo > PARITY_TOLERANCE.colorRichnessRatio) {
        failures.push(`colorRichness canvas ${c.colorRichness} vs webgl ${w.colorRichness}`)
      }
    }
    report.push({ screen, canvas: c as Shot, webgl: w as Shot, failures })
  }

  writeFileSync(join(OUT_DIR, 'parity-report.json'), JSON.stringify(report, null, 2))
  const failed = report.filter((r) => r.failures.length > 0)
  for (const r of failed) {
    appendFileSync(
      join(OUT_DIR, 'findings.jsonl'),
      JSON.stringify({ kind: 'parity', label: r.screen, failures: r.failures, ts: Date.now() }) + '\n',
    )
  }
  console.log('PARITY REPORT:', JSON.stringify(report))
  expect(
    failed.map((r) => `${r.screen}: ${r.failures.join('; ')}`),
    'the two renderers do not draw the same game - the player sees the WebGL one',
  ).toEqual([])
})
