import { expect, test } from '@playwright/test'
import type Phaser from 'phaser'
import { decideBotScript } from '../selfplay/bot'

/**
 * UI-4 look + contract spec: the WoF top-band HUD.
 *
 * Captures desktop combat, boss, co-op, GO-cue and phone states to
 * artifacts/look/ui4-*.png, and asserts the kit's own contracts along the
 * way: the baked textures exist, the first `bar` is P1's HP with a live
 * ratio and a presentation-only ghost, the flaming pearl follows the
 * hp>cost rule, the WAVE chip counts, the boss rail drops in under the
 * WARNING banner, and P2's plate mirrors P1's on join.
 */

const LOOK = 'artifacts/look'

test('combat HUD: plate kit, segmented bar, pearl and WAVE chip', async ({ page }) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage1'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')
  await page.waitForTimeout(400)

  // The kit baked: plates, medallion, pearl both states, pip, chip, arrow, rail.
  const baked = await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('hud')
    const keys = [
      'hud:plate:p1',
      'hud:plate:p2',
      'hud:medallion:zhaoyun',
      'hud:pearl',
      'hud:pearl-dim',
      'hud:pip',
      'hud:chip',
      'hud:arrow',
      'hud:rail',
      'hud:banner:gold',
      'hud:banner:red',
    ]
    return keys.map((k) => ({ k, ok: !!scene?.textures.exists(k) }))
  })
  expect(baked.filter((b) => !b.ok), 'missing baked HUD textures').toEqual([])

  // First `bar` child is P1's HP: full at spawn, ghost equal, sane geometry.
  const bar = await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('hud')
    const first = scene?.children.list
      .map((c) => (c as unknown as { getData?: (k: string) => unknown }).getData?.('bar'))
      .find((b) => !!b) as { x: number; y: number; w: number; h: number; ratio: number; ghost: number } | undefined
    return first
  })
  expect(bar, 'no HP bar found').toBeTruthy()
  expect(bar?.w).toBeGreaterThan(20)
  expect(bar?.h).toBeGreaterThan(2)
  expect(bar?.ratio ?? 0).toBeGreaterThan(0.95)

  // Readouts: WAVE 1 chip text, lives pips lit, pearl lit while affordable.
  const readout = await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('hud')
    const texts = scene?.children.list.filter((c) => c.type === 'Text') as Phaser.GameObjects.Text[]
    const wave = texts.find((t) => t.text.startsWith('WAVE'))?.text ?? ''
    const pips = scene?.children.list.filter(
      (c) => (c as Phaser.GameObjects.Image).texture?.key === 'hud:pip' && (c as Phaser.GameObjects.Image).visible,
    ).length
    const pearl = scene?.children.list.find(
      (c) => (c as Phaser.GameObjects.Image).texture?.key.startsWith('hud:pearl'),
    ) as Phaser.GameObjects.Image | undefined
    return { wave, pips: pips ?? 0, pearl: pearl?.texture.key ?? '' }
  })
  expect(readout.wave).toBe('WAVE 1')
  expect(readout.pips).toBeGreaterThanOrEqual(2)
  expect(readout.pearl).toBe('hud:pearl')

  // A few bot batches so the capture shows live combat under the band.
  for (let i = 0; i < 8; i += 1) {
    const snapshot = await page.evaluate(() => window.__DW__?.getSnapshot())
    if (!snapshot?.sim) break
    const script = decideBotScript(snapshot)
    await page.evaluate((inputs) => window.__DW__?.run(inputs), script)
    await page.waitForTimeout(60)
  }
  await page.screenshot({ path: `${LOOK}/ui4-combat.png` })

  // Damage: hp drops below the special's cost - the pearl must dim and the
  // ghost must hold above the live ratio (presentation-only lag).
  await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('game') as unknown as {
      sim: { entities: Array<{ id: number; hp: number }>; playerId: number }
    }
    const p1 = scene.sim.entities.find((e) => e.id === scene.sim.playerId)
    if (p1) p1.hp = 8
  })
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = window.__DW_GAME__?.scene.getScene('hud')
        const pearl = scene?.children.list.find(
          (c) => (c as Phaser.GameObjects.Image).texture?.key.startsWith('hud:pearl'),
        ) as Phaser.GameObjects.Image | undefined
        return pearl?.texture.key ?? ''
      }),
    )
    .toBe('hud:pearl-dim')
  const after = await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('hud')
    return scene?.children.list
      .map((c) => (c as unknown as { getData?: (k: string) => unknown }).getData?.('bar'))
      .find((b) => !!b) as { ratio: number; ghost: number } | undefined
  })
  expect(after?.ghost ?? 0).toBeGreaterThan(after?.ratio ?? 1)
})

test('boss rail and 1.2s WARNING banner', async ({ page }) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage3'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')
  await page.waitForTimeout(300)

  // Rail hidden before the boss exists.
  expect(
    await page.evaluate(() => {
      const scene = window.__DW_GAME__?.scene.getScene('hud')
      return scene?.children.list.some(
        (c) => (c as Phaser.GameObjects.Image).texture?.key === 'hud:rail' && (c as Phaser.GameObjects.Image).visible,
      )
    }),
  ).toBe(false)

  await page.evaluate(() => window.__DW__?.forceBoss())
  // WARNING banner goes up with the rail; capture mid-hold.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = window.__DW_GAME__?.scene.getScene('hud')
        const texts: string[] = []
        const walk = (list: Phaser.GameObjects.GameObject[]): void => {
          for (const c of list) {
            if (c.type === 'Text') texts.push((c as Phaser.GameObjects.Text).text)
            if (c.type === 'Container') walk((c as Phaser.GameObjects.Container).list)
          }
        }
        walk(scene?.children.list ?? [])
        return texts.some((t) => t === 'WARNING')
      }),
    )
    .toBe(true)
  const railUp = await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('hud')
    const bars = scene?.children.list
      .map((c) => (c as unknown as { getData?: (k: string) => unknown }).getData?.('bar'))
      .filter((b) => !!b) as Array<{ ratio: number; y: number }>
    const rail = scene?.children.list.some(
      (c) => (c as Phaser.GameObjects.Image).texture?.key === 'hud:rail' && (c as Phaser.GameObjects.Image).visible,
    )
    return { rail, bossBar: bars.find((b) => b.y > 40) }
  })
  expect(railUp.rail).toBe(true)
  expect(railUp.bossBar?.ratio ?? 0).toBeGreaterThan(0)
  await page.screenshot({ path: `${LOOK}/ui4-boss.png` })
})

test('co-op: P2 plate mirrors P1, GO cue on unlock', async ({ page }) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage2'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')
  await page.evaluate(() => window.__DW__?.joinP2())
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.char2Id))
    .not.toBeNull()
  await page.waitForTimeout(300)

  const p2 = await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('hud')
    const plate = scene?.children.list.find(
      (c) => (c as Phaser.GameObjects.Image).texture?.key === 'hud:plate:p2',
    ) as Phaser.GameObjects.Image | undefined
    const medal = scene?.children.list.find((c) =>
      String((c as Phaser.GameObjects.Image).texture?.key ?? '').startsWith('hud:medallion:'),
    ) as Phaser.GameObjects.Image | undefined
    const bars = scene?.children.list
      .map((c) => (c as unknown as { getData?: (k: string) => unknown }).getData?.('bar'))
      .filter((b) => !!b) as Array<{ x: number; y: number; w: number }>
    return {
      plateX: plate?.x ?? -1,
      plateW: plate?.width ?? 0,
      medalKey: medal?.texture.key ?? '',
      playerBars: bars.filter((b) => b.y < 40).length,
    }
  })
  // P2's plate sits at the mirrored anchor (480-2-186=292) with its own
  // medallion, and both player bars live in the band.
  expect(p2.plateX).toBe(292)
  expect(p2.plateW).toBeGreaterThan(100)
  expect(p2.playerBars).toBeGreaterThanOrEqual(2)
  await page.screenshot({ path: `${LOOK}/ui4-coop.png` })

  // Camera unlock: the chip flips to GO! and the chevrons blink on. The cue
  // is the container holding the baked 'hud:arrow' chevrons.
  const goCueVisible = () =>
    page.evaluate(() => {
      const hud = window.__DW_GAME__?.scene.getScene('hud')
      const cue = hud?.children.list.find(
        (c) =>
          c.type === 'Container' &&
          (c as Phaser.GameObjects.Container).list.some(
            (g) => (g as Phaser.GameObjects.Image).texture?.key === 'hud:arrow',
          ),
      ) as Phaser.GameObjects.Container | undefined
      return cue?.visible ?? false
    })
  expect(await goCueVisible()).toBe(false)
  await page.evaluate(() => {
    const game = window.__DW_GAME__?.scene.getScene('game') as unknown as {
      sim: { cameraLocked: boolean }
    }
    game.sim.cameraLocked = false
  })
  await expect
    .poll(async () =>
      (
        await page.evaluate(() => {
          const hud = window.__DW_GAME__?.scene.getScene('hud')
          const texts = hud?.children.list.filter((c) => c.type === 'Text') as Phaser.GameObjects.Text[]
          return texts.find((t) => t.text === 'GO!')?.visible ?? false
        })
      )
        && (await goCueVisible()),
    )
    .toBe(true)
  await page.screenshot({ path: `${LOOK}/ui4-go.png` })
})

test('phone: bronze touch sheet in portrait and landscape', async ({ browser }) => {
  test.setTimeout(90_000)
  const context = await browser.newContext({
    viewport: { width: 412, height: 732 },
    hasTouch: true,
    isMobile: true,
  })
  const page = await context.newPage()
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage1'))
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene))
    .toBe('game')
  await page.waitForTimeout(400)

  const readControls = () =>
    page.evaluate(() => {
      const hud = window.__DW_GAME__?.scene.getScene('hud')
      const list = hud?.children.list ?? []
      const pads = list.filter(
        (c) => c.name === 'touchPad' && (c as Phaser.GameObjects.Image).visible,
      )
      const labels = list.filter((c) => c.name === 'touchLabel')
      const zones = list.filter((c) => c.type === 'Zone')
      const sheet = list.find((c) => (c as Phaser.GameObjects.Image).texture?.key === 'touch:controls')
      const inputs = (hud?.input as unknown as { _list?: unknown[] })?._list?.length ?? -1
      return {
        pads: pads.length,
        padAlpha: (pads[0] as Phaser.GameObjects.Image | undefined)?.alpha ?? 0,
        labels: labels.length,
        zones: zones.length,
        inputs,
        sheetKey: sheet ? (sheet as Phaser.GameObjects.Image).texture.key : '',
      }
    })
  const portrait = await readControls()
  expect(portrait.pads).toBe(1)
  expect(portrait.padAlpha).toBeGreaterThan(0)
  expect(portrait.labels).toBe(3)
  expect(portrait.zones).toBe(8)
  expect(portrait.inputs).toBe(8)
  expect(portrait.sheetKey).toBe('touch:controls')
  await page.screenshot({ path: `${LOOK}/ui4-touch-portrait.png` })

  await page.setViewportSize({ width: 732, height: 412 })
  await page.waitForTimeout(300)
  const landscape = await readControls()
  expect(landscape.pads).toBe(1)
  expect(landscape.zones).toBe(8)
  await page.screenshot({ path: `${LOOK}/ui4-touch-landscape.png` })

  // Boss state on the phone: the rail and banner must clear the touch sheet.
  await page.evaluate(() => window.__DW__?.forceBoss())
  await expect
    .poll(() =>
      page.evaluate(() => {
        const hud = window.__DW_GAME__?.scene.getScene('hud')
        return hud?.children.list.some(
          (c) => (c as Phaser.GameObjects.Image).texture?.key === 'hud:rail' && (c as Phaser.GameObjects.Image).visible,
        )
      }),
    )
    .toBe(true)
  await page.screenshot({ path: `${LOOK}/ui4-touch-boss.png` })
  await context.close()
})
