import { writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

/**
 * ART-20 combat-feedback contracts: the fx: textures exist and the emitters
 * are bound to them, the stage-clear gold flash and the boss-spawn crimson
 * flash fire in real play only, and the combat/prop captures land for
 * review. Flashes are recorded by wrapping the camera method - they are
 * 200ms transients no screenshot could reliably catch.
 */

const LOOK = 'artifacts/look'

test('fx textures bake and emitters bind to them', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage1'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')
  await page.waitForTimeout(300)

  const report = await page.evaluate(() => {
    const game = window.__DW_GAME__
    const scene = game?.scene.getScene('game')
    const emitters = (scene?.children.list ?? []).filter(
      (c): c is Phaser.GameObjects.Particles.ParticleEmitter => c.type === 'ParticleEmitter',
    )
    return {
      spark: game?.textures.exists('fx:spark') ?? false,
      burst: game?.textures.exists('fx:burst') ?? false,
      dust: game?.textures.exists('fx:dust') ?? false,
      bound: emitters.map((e) => (e as unknown as { texture?: { key?: string } }).texture?.key ?? ''),
    }
  })
  expect(report.spark && report.burst && report.dust).toBe(true)
  expect(report.bound).toContain('fx:spark')
  expect(report.bound).toContain('fx:burst')
  expect(report.bound).toContain('fx:dust')

  // Dump each fx texture at 8x for the review (deterministic, no timing).
  for (const key of ['fx:spark', 'fx:burst', 'fx:dust'] as const) {
    const dataUrl = await page.evaluate((k) => {
      const game = window.__DW_GAME__
      const src = game?.textures.get(k).getSourceImage() as HTMLCanvasElement
      const cv = document.createElement('canvas')
      cv.width = src.width * 4
      cv.height = src.height * 4
      const ctx = cv.getContext('2d')
      if (!ctx) return ''
      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = '#202028'
      ctx.fillRect(0, 0, cv.width, cv.height)
      ctx.drawImage(src, 0, 0, cv.width, cv.height)
      return cv.toDataURL('image/png')
    }, key)
    const name = key.slice('fx:'.length)
    writeFileSync(`${LOOK}/ui20-fx-${name}.png`, Buffer.from(dataUrl.split(',')[1] ?? '', 'base64'))
  }
})

test('stage-clear gold flash and boss-spawn crimson flash fire in real play', async ({ page }) => {
  test.setTimeout(90_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await page.setViewportSize({ width: 960, height: 540 })
  // Real play: no autopilot, so juice runs.
  await page.goto('/?renderer=canvas')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage3'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')

  // Record camera flashes from here on. The log lives on window, not on
  // the camera: the game scene (and its camera) is replaced by the result
  // scene halfway through this test.
  await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('game')
    const cam = scene?.cameras.main as unknown as {
      flash: (...args: unknown[]) => void
    }
    ;(window as unknown as { __flashes: unknown[][] }).__flashes = []
    const orig = cam.flash.bind(cam)
    cam.flash = (...args: unknown[]) => {
      ;(window as unknown as { __flashes: unknown[][] }).__flashes.push(args)
      return orig(...args)
    }
  })
  const flashes = (): Promise<unknown[][]> =>
    page.evaluate(() => (window as unknown as { __flashes: unknown[][] }).__flashes ?? [])

  // Boss spawn: crimson, matching the WARNING plaque.
  await page.evaluate(() => window.__DW__?.forceBoss())
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.enemies.some((e) => e.boss) ?? false))
    .toBe(true)
  await expect.poll(flashes).not.toEqual([])
  const bossFlash = (await flashes()).at(-1) as number[]
  expect(bossFlash?.[0]).toBe(180)
  expect([bossFlash?.[1], bossFlash?.[2], bossFlash?.[3]]).toEqual([178, 28, 28])

  // Stage clear: kill the spawned boss through the real event path (the
  // sim emits 'stageclear' when the boss is dying/dead) and the gold
  // celebration wash fires before the result scene lands.
  await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('game') as unknown as {
      sim: { entities: Array<{ kind: string; state: string; hp: number }>; stage: { bossKind: string } }
    }
    const boss = scene.sim.entities.find((e) => e.kind === scene.sim.stage.bossKind)
    if (boss) {
      boss.hp = 0
      boss.state = 'dead'
    }
  })
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 10_000 })
    .toBe('result')
  const clearFlash = (await flashes()).at(-1) as number[]
  expect(clearFlash?.[0]).toBe(220)
  expect([clearFlash?.[1], clearFlash?.[2], clearFlash?.[3]]).toEqual([255, 214, 130])
  expect(pageErrors).toEqual([])
})

test('combat and props render for review', async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage1'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')
  // Real play, idle: enemies close in and land hits, so sparks and dust fly
  // on their own - no staged timing, the review just needs live combat.
  await page.waitForTimeout(6_000)
  await page.screenshot({ path: `${LOOK}/ui20-combat.png` })
})
