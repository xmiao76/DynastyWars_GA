import { expect, test } from '@playwright/test'
import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../src/core/constants'
import { RENDER_SCALE } from '../src/game/render'
import { decideBotScript } from '../selfplay/bot'
import { assessFrame, regionLegibility, type FrameImage, type MetricResult } from './metrics'
import {
  assessSprite,
  assessWeaponReach,
  type SpriteImage,
  type SpriteResult,
} from './sprite-metrics'
import {
  CHARACTER_SPRITE_THRESHOLDS,
  MIN_WEAPON_REACH_PX,
  PROP_SPRITE_THRESHOLDS,
  thresholdsFor,
} from './thresholds'

// Character-legibility floor: a real hero should render with several distinct
// colors in its body window (armor, skin/helm, weapon, trim) - not a 1-color
// flat blob, and not 95% one dominant color.
export /**
 * Sprites the whole cast comes to: 11 posed characters x 14 poses, plus 4
 * pose-less props. Exact on purpose - see the note at the call site.
 */
const EXPECTED_SPRITES = 11 * 14 + 4
const MIN_CHARACTER_COLORS = 4
export const MAX_CHARACTER_DOMINANCE = 0.9

// THE VISUAL PRODUCER SIGNAL. Drives the game through fixed screens, captures
// screenshots, measures objective visual-health metrics, asserts thresholds,
// and writes artifacts/vision/{report.json, findings.jsonl}. The eval-loop
// consumes findings.jsonl to file UI tasks when a render regresses.

const OUT_DIR = 'artifacts/vision'

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
  page: import('@playwright/test').Page,
): Promise<{ width: number; height: number; data: number[] } | null> {
  return (await page.evaluate(
    ({ w, h }) => {
      const game = (window as unknown as {
        __DW_GAME__?: { renderer?: { snapshot: (cb: (img: HTMLImageElement) => void) => void } }
      }).__DW_GAME__
      if (!game?.renderer?.snapshot) return null
      return new Promise<{ width: number; height: number; data: number[] } | null>((resolve) => {
        game.renderer?.snapshot?.((img) => {
          const cv = document.createElement('canvas')
          cv.width = w
          cv.height = h
          const ctx = cv.getContext('2d')
          if (!ctx) return resolve(null)
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 0, 0, w, h)
          const d = ctx.getImageData(0, 0, cv.width, cv.height).data
          resolve({ width: cv.width, height: cv.height, data: Array.from(d) })
        })
      })
    },
    { w: SCREEN_WIDTH, h: SCREEN_HEIGHT },
  )) as { width: number; height: number; data: number[] } | null
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

/**
 * Wait until a game snapshot carries a live player (the scene settled past any
 * start/transition). Probes must never sample a mid-transition frame - that was
 * the source of a timing flake where the legibility guard saw sim=null and
 * reported 0 colors on an otherwise good render.
 */
async function waitForPlayer(page: import('@playwright/test').Page, timeoutMs = 5_000): Promise<void> {
  const ready = await page.evaluate(
    (timeout) => new Promise<boolean>((resolve) => {
      const t0 = Date.now()
      const poll = (): void => {
        const sim = (window as { __DW__?: { getSnapshot: () => { sim?: { player?: unknown } } } }).__DW__?.getSnapshot().sim
        if (sim?.player) return resolve(true)
        if (Date.now() - t0 >= timeout) return resolve(false)
        setTimeout(poll, 50)
      }
      poll()
    }),
    timeoutMs,
  )
  if (!ready) {
    const state = await page.evaluate(() => {
      const sn = (window as { __DW__?: { getSnapshot: () => { scene?: string; sim?: unknown } } }).__DW__?.getSnapshot()
      return { scene: sn?.scene, sim: sn?.sim ? 'present' : 'null' }
    })
    throw new Error(`game did not reach a playable state within timeout (scene=${state.scene}, sim=${state.sim})`)
  }
}

/**
 * Sample player-region legibility, retrying over a bounded window so a single
 * mid-animation frame never decides the verdict. Returns the best (settled)
 * sample found; a truly empty region still reports 0 colors as desired.
 */
async function regionLegibilityRace(
  page: import('@playwright/test').Page,
  windowMs = 3_000,
): Promise<{ colorCount: number; dominantFraction: number }> {
  const t0 = Date.now()
  let best: { colorCount: number; dominantFraction: number } = { colorCount: 0, dominantFraction: 1 }
  while (Date.now() - t0 < windowMs) {
    const frame = await snapFrame(page)
    if (frame) {
      const pos = await playerScreenPos(page)
      const leg = pos ? regionLegibility(frame, pos.x, pos.y, 26) : { colorCount: 0, dominantFraction: 1 }
      if (leg.colorCount > 0) return leg // settled, non-empty sample
      best = leg
    }
    await page.waitForTimeout(150)
  }
  return best
}

test('visual-health gate: every core screen renders acceptably', async ({ page }) => {
  test.setTimeout(180_000)
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(String(e)))
  await page.setViewportSize({ width: 960, height: 540 })

  await page.goto('/?renderer=canvas&autopilot=1&vision=1', {
    waitUntil: 'networkidle',
  })
  await page.waitForTimeout(700)

  const screens: Array<{ name: string; frame: FrameImage | null }> = []

  // 1) Title
  await page.waitForTimeout(300)
  screens.push({ name: 'title', frame: await snapFrame(page) })
  await page.screenshot({ path: join(OUT_DIR, 'title.png') })

  // 2) Select
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)
  screens.push({ name: 'select', frame: await snapFrame(page) })
  await page.screenshot({ path: join(OUT_DIR, 'select.png') })

  // 3) Game idle
  await page.keyboard.press('Enter') // confirm Zhao Yun
  await page.waitForTimeout(500)
  screens.push({ name: 'game_idle', frame: await snapFrame(page) })
  await page.screenshot({ path: join(OUT_DIR, 'game_idle.png') })

  // 4) Game combat (bot fights a bit; frozen effects are gated off, but the
  // scene is live with characters + HUD).
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await waitForPlayer(page)
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
  await page.waitForTimeout(250)
  const combatFrame = await snapFrame(page)
  screens.push({ name: 'game_combat', frame: combatFrame })
  await page.screenshot({ path: join(OUT_DIR, 'game_combat.png') })
  // Character-legibility guard: the player must render as a multi-color figure
  // (armor + skin + weapon), not a flat single-color blob. Sampled as a race so
  // one mid-animation frame cannot cause a false failure.
  const playerLeg = await regionLegibilityRace(page)
  console.log('PLAYER LEGIBILITY:', JSON.stringify(playerLeg))
  expect(playerLeg.colorCount).toBeGreaterThanOrEqual(MIN_CHARACTER_COLORS)
  expect(playerLeg.dominantFraction).toBeLessThanOrEqual(MAX_CHARACTER_DOMINANCE)

  // 5) Boss fight (forced via the bridge - fast and deterministic).
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage3'))
  await waitForPlayer(page)
  await page.evaluate(() => window.__DW__?.forceBoss())
  await page.waitForTimeout(250) // let the boss spawn + render
  screens.push({ name: 'boss_fight', frame: await snapFrame(page) })
  await page.screenshot({ path: join(OUT_DIR, 'boss_fight.png') })

  // 6) Second hero (Zhang Fei) into combat - per-hero rendering is watched.
  await page.evaluate(() => window.__DW__?.startGame('zhangfei', 99))
  await waitForPlayer(page)
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
  await page.waitForTimeout(250)
  screens.push({ name: 'game_combat_zhangfei', frame: await snapFrame(page) })
  await page.screenshot({ path: join(OUT_DIR, 'game_combat_zhangfei.png') })

  // 7) Result screen (forced via the bridge - deterministic, no marathon).
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await waitForPlayer(page)
  await page.evaluate(() => window.__DW__?.forceResult())
  await page.waitForTimeout(500)
  screens.push({ name: 'result', frame: await snapFrame(page) })
  await page.screenshot({ path: join(OUT_DIR, 'result.png') })

  // 8) Game-over screen (forced via the bridge).
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await waitForPlayer(page)
  await page.evaluate(() => window.__DW__?.forceGameOver())
  await page.waitForTimeout(500)
  screens.push({ name: 'game_over', frame: await snapFrame(page) })
  await page.screenshot({ path: join(OUT_DIR, 'game_over.png') })

  // 9) Game-complete screen - the ending. Reached by clearing the LAST stage,
  // so forcing the result from stage 3 and confirming lands on it. It is the
  // final thing a player who finishes the game sees and nothing watched it.
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage3'))
  await waitForPlayer(page)
  await page.evaluate(() => window.__DW__?.forceResult())
  await page.waitForTimeout(500)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(700)
  screens.push({ name: 'game_complete', frame: await snapFrame(page) })
  await page.screenshot({ path: join(OUT_DIR, 'game_complete.png') })

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
test('sprite gate: every rendered character and prop reads as a shape', async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas&autopilot=1&vision=1', { waitUntil: 'networkidle' })
  // Entering a stage registers every kind that can appear (all enemies, all
  // heroes and props), so one startGame exposes the whole cast.
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await waitForPlayer(page)
  // Register the WHOLE cast, not just what this stage spawns. GameScene
  // deliberately generates only the kinds a stage can use - it cut 52MB of
  // textures - and that quietly took this gate from 148 sprites to 76 without
  // anything going red. The count below is exact for the same reason: a floor
  // of "more than 20" is what let a halving go unnoticed.
  await page.evaluate(() => window.__DW__?.registerAllArt())

  const keys = await entityTextureKeys(page)
  expect(keys.length, `expected the whole cast, got ${keys.length} textures`).toBe(EXPECTED_SPRITES)

  // Texture-key convention: props register pose-less as `entity:<kind>`, while
  // combatants register `entity:<kind>:<pose>`. Derive prop-ness from the kind,
  // not from the key shape - a prop that also has baked pose keys is still a
  // prop, and holding it to the character bar would demand limbs of a crate.
  const propKinds = new Set(
    keys.filter((k) => k.split(':').length === 2).map((k) => k.split(':')[1] ?? ''),
  )

  const results: SpriteResult[] = []
  const byKindPose = new Map<string, SpriteImage>()
  for (const key of keys) {
    const img = await readTexture(page, key)
    if (!img) {
      results.push({
        label: key,
        silhouetteComplexity: 0,
        appendageRatio: 0,
        colorCount: 0,
        dominantFraction: 1,
        outlineRatio: 0,
        tonalBands: 0,
        pass: false,
        failures: ['texture missing from the running game'],
      })
      continue
    }
    byKindPose.set(key, img)
    const isProp = propKinds.has(key.split(':')[1] ?? '')
    results.push(assessSprite(img, key, isProp ? PROP_SPRITE_THRESHOLDS : CHARACTER_SPRITE_THRESHOLDS))
  }

  // Weapons have to be visible as reach: swinging extends the silhouette.
  //
  // Scaled by RENDER_SCALE, because these are the LIVE textures and the game
  // rasterizes them at device density. The threshold is expressed in logical
  // pixels - as it is in the unit gate, which measures source art - so applying
  // it raw here would have quietly made the browser check half as strict as the
  // one it is meant to back up.
  const combatantKinds = [
    ...new Set(keys.filter((k) => k.endsWith(':idle')).map((k) => k.split(':')[1] ?? '')),
  ].filter((kind) => kind !== '' && !propKinds.has(kind) && byKindPose.has(`entity:${kind}:attack`))
  // All five strike poses reach: the historical attack/attack2 plus the ENH-5
  // thrust, chop and sweep. Mirrors the unit reach gate.
  const STRIKE_POSES = ['attack', 'attack2', 'thrust', 'chop', 'sweep'] as const
  const reach = combatantKinds
    .flatMap((kind) => {
      const idle = byKindPose.get(`entity:${kind}:idle`)
      if (!idle) return []
      return STRIKE_POSES.flatMap((strike) => {
        const img = byKindPose.get(`entity:${kind}:${strike}`)
        if (!img) return []
        return [assessWeaponReach(idle, img, `${kind}:${strike}`, MIN_WEAPON_REACH_PX * RENDER_SCALE)]
      })
    })
  // The anti-static check, mirroring the unit retract gate: the withdrawn
  // phases sit narrower than EACH strike by the same threshold reach demands
  // the other way, or consecutive hits read as one held pose.
  const WITHDRAWN_POSES = ['windup', 'recover'] as const
  const retract = combatantKinds
    .flatMap((kind) => {
      const withdrawn = WITHDRAWN_POSES.map((pose) => byKindPose.get(`entity:${kind}:${pose}`))
      const strikes = STRIKE_POSES.map((pose) => byKindPose.get(`entity:${kind}:${pose}`))
      if (withdrawn.some((img) => !img) || strikes.some((img) => !img)) return []
      return STRIKE_POSES.flatMap((strike, si) =>
        WITHDRAWN_POSES.map(
          (pose, wi) =>
            assessWeaponReach(
              withdrawn[wi]!,
              strikes[si]!,
              `${kind}:${pose}-vs-${strike}`,
              MIN_WEAPON_REACH_PX * RENDER_SCALE,
            ),
        ),
      )
    })
  // Exact counts, same reasoning as EXPECTED_SPRITES above: an emptied list
  // would otherwise pass over zero comparisons.
  expect(reach.length, 'strike reach comparisons').toBe(11 * 5)
  expect(retract.length, 'retract comparisons').toBe(11 * 5 * 2)

  writeFileSync(
    join(OUT_DIR, 'sprite-report.json'),
    JSON.stringify({ sprites: results, weaponReach: reach, retract }, null, 2),
  )
  const badSprites = results.filter((r) => !r.pass)
  const badReach = reach.filter((r) => !r.pass)
  const badRetract = retract.filter((r) => !r.pass)
  for (const r of badSprites) fileFinding('sprite', r)
  for (const r of badReach) fileFinding('weapon', r)
  for (const r of badRetract) fileFinding('weapon', r)
  console.log(`SPRITE GATE: ${results.length - badSprites.length}/${results.length} sprites, ${reach.length - badReach.length}/${reach.length} weapons, ${retract.length - badRetract.length}/${retract.length} retracts`)

  expect(
    badSprites.map((r) => `${r.label}: ${r.failures.join('; ')}`),
    'sprites do not read as characters',
  ).toEqual([])
  expect(
    badReach.map((r) => `${r.label}: ${r.failures.join('; ')}`),
    'weapons are not visible in the attack pose',
  ).toEqual([])
  expect(
    badRetract.map((r) => `${r.label}: ${r.failures.join('; ')}`),
    'windup and recover are not narrower than the strikes',
  ).toEqual([])
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
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await waitForPlayer(page)
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
  const hero = await readTexture(page, 'entity:zhaoyun:idle')
  expect(hero, 'no hero texture to build the flat-silhouette control from').not.toBeNull()
  if (!hero) return
  const real = assessSprite(hero, 'zhaoyun:idle', CHARACTER_SPRITE_THRESHOLDS)
  expect(real.pass, `the control is only meaningful if the real sprite passes: ${JSON.stringify(real)}`).toBe(true)

  const flat = flatten(hero, [96, 110, 150])
  const flatVerdict = assessSprite(flat, 'flat-silhouette', CHARACTER_SPRITE_THRESHOLDS)
  console.log('NEGATIVE CONTROL (flat silhouette):', JSON.stringify(flatVerdict))
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
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await waitForPlayer(page)

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

/** Snapshot wrapper that tolerates the one-frame render delay. */
async function snapFrame(page: import('@playwright/test').Page): Promise<FrameImage | null> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const raw = await snapshotFrame(page)
    if (raw && raw.width > 0) return toFrame(raw)
    await page.waitForTimeout(120)
  }
  return null
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000
}
