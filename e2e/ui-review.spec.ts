import { spawnSync } from 'node:child_process'
import { devices, expect, test, type Browser, type Page } from '@playwright/test'
import { STAGE_ORDER } from '../src/core/stage'
import { neutralInput } from '../src/core/types'
import { actorBox, assemble, CROPS, freezeWhen, prepare, rendered, shoot, snap, stepRender, tickOf, type Box } from './review/kit'

/**
 * UI review CAPTURE (docs/VISUAL_REVIEW.md section 1). A generator, not a
 * gate: it drives the real game to every screen a player sees and writes
 * screens, crops, scene inventories and contact sheets to
 * artifacts/review/latest/ for the art-director review. Run it through
 * `npm run review:capture`, which rotates the previous capture first.
 * Assertions only guarantee the capture happened; judging it is the review's job.
 */
test.describe.configure({ mode: 'serial' })
test.skip(process.env.UI_REVIEW !== '1', 'set UI_REVIEW=1 (npm run review:capture)')

const scene = (page: Page): Promise<string | undefined> => page.evaluate(() => window.__DW__?.getSnapshot().scene)
const errors = new Map<Page, string[]>()

async function boot(page: Page, url = '/?renderer=canvas&autopilot=1', size = true): Promise<void> {
  const list: string[] = []
  errors.set(page, list)
  page.on('pageerror', (e) => list.push(String(e)))
  if (size) await page.setViewportSize({ width: 960, height: 540 })
  await page.goto(url)
  await expect.poll(() => scene(page)).toBe('title')
  prepare()
}

async function start(page: Page, hero: string, stage: string): Promise<void> {
  await page.evaluate(([h, s]) => window.__DW__?.startGame(h as string, 42, s), [hero, stage])
  await expect.poll(() => scene(page)).toBe('game')
}

const introUp = (page: Page): Promise<boolean> =>
  page.evaluate(() => !!window.__DW_GAME__?.scene.getScene('hud')?.children.list.some((c) => c.name === 'introCard'))

/** Wait for the stage intro card, dismiss it with Enter and confirm it left. */
async function dismissIntro(page: Page): Promise<void> {
  await expect.poll(() => introUp(page)).toBe(true)
  await page.keyboard.press('Enter')
  await expect.poll(() => introUp(page)).toBe(false)
}

async function sim(page: Page) {
  const s = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  if (!s) throw new Error('no sim')
  return s
}

async function heroBox(page: Page): Promise<Box> {
  const s = await sim(page)
  return actorBox(s.player.x, s.player.y, s.player.z, s.scrollX)
}

/** Queue per-tick inputs and wait until they have rendered. */
async function run(page: Page, inputs: ReturnType<typeof neutralInput>[]): Promise<void> {
  const t = await tickOf(page)
  await page.evaluate((b) => window.__DW__?.run(b), inputs)
  await rendered(page, t + inputs.length)
}

const walk = (n: number) => Array.from({ length: n }, () => ({ ...neutralInput(), right: true }))

/** Advance toward enemies and fight until a blow visibly lands. */
async function fight(page: Page): Promise<boolean> {
  for (let i = 0; i < 30; i += 1) {
    const s = await sim(page)
    const near = s.enemies.some((e) => e.hp > 0 && Math.abs(e.x - s.player.x) < 60)
    const hit = s.enemies.some((e) => e.state === 'hitstun' || e.state === 'knockdown')
    if (near && hit && s.player.state === 'attack') return true
    await run(page, near
      ? Array.from({ length: 6 }, (_, k) => ({ ...neutralInput(), attackPressed: k === 0 }))
      : walk(12))
  }
  return false
}

/** Mutate the live sim from the page (the debug bridge has no setter for these). */
async function mutate(page: Page, kind: 'lowhp' | 'unlock' | 'kill' | 'bossdown'): Promise<void> {
  await page.evaluate((k) => {
    type E = { id: number; kind: string; state: string; stateTick: number; hp: number; maxHp: number }
    const g = window.__DW_GAME__?.scene.getScene('game') as unknown as {
      sim: { entities: E[]; playerId: number; cameraLocked: boolean; stage: { bossKind: string } }
    }
    const p = g.sim.entities.find((e) => e.id === g.sim.playerId)
    if (!p) return
    if (k === 'lowhp') p.hp = Math.ceil(p.maxHp * 0.25)
    if (k === 'unlock') g.sim.cameraLocked = false
    if (k === 'kill') { p.hp = 0; p.state = 'dead'; p.stateTick = 0 }
    if (k === 'bossdown') {
      const b = g.sim.entities.find((e) => e.kind === g.sim.stage.bossKind)
      if (b) { b.hp = 0; b.state = 'dying'; b.stateTick = 0 }
    }
  }, kind)
}

/** The stage banner is fully raised (after its 180 ms scale-in). */
function bannerUp(): boolean {
  const b = window.__DW_GAME__?.scene.getScene('hud')?.children.list.find((c) => c.name === 'stageBanner') as unknown as
    | { alpha: number; scaleX: number }
    | undefined
  return !!b && b.alpha >= 0.95 && b.scaleX >= 0.99
}

function introRaised(): boolean {
  const c = window.__DW_GAME__?.scene.getScene('hud')?.children.list.find((o) => o.name === 'introCard') as unknown as
    | { alpha: number; scale: number }
    | undefined
  return !!c && c.alpha >= 0.95 && c.scale >= 0.99
}

function hudText(text: string): boolean {
  const list = window.__DW_GAME__?.scene.getScene('hud')?.children.list ?? []
  return list.some((o) => {
    const t = o as unknown as { text?: string; visible: boolean }
    return t.text === text && t.visible
  })
}

async function hudTextShown(page: Page, text: string): Promise<void> {
  await freezeWhen(page, new Function(`return (${hudText.toString()})(${JSON.stringify(text)})`) as () => boolean)
}

function goCueBright(): boolean {
  const list = window.__DW_GAME__?.scene.getScene('hud')?.children.list ?? []
  const cue = list.find((c) => c.type === 'Container'
    && (c as unknown as { list: { texture?: { key: string } }[] }).list.some((g) => g.texture?.key === 'hud:arrow')) as unknown as
    | { visible: boolean; alpha: number }
    | undefined
  return !!cue && cue.visible && cue.alpha >= 0.9
}

const settle = (page: Page, ms: number): Promise<void> => page.waitForTimeout(ms)

test.afterAll(async () => {
  const commit = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).stdout.trim()
  const n = await assemble(commit)
  console.log(`ui-review: ${n} screens in artifacts/review/latest`)
})

test('flow: menus, stage 1 beats, end screens, co-op and horse', async ({ page }) => {
  test.setTimeout(600_000)
  await boot(page)
  await settle(page, 1500)
  await snap(page, 'title', { group: 'flow', focus: 'logo, embers, prompt legibility, composition' })

  await page.keyboard.press('Enter')
  await expect.poll(() => scene(page)).toBe('select')
  const heroes = ['guanyu', 'zhangfei', 'zhaoyun', 'huangzhong', 'weiyan']
  for (const [i, hero] of heroes.entries()) {
    if (i > 0) await page.keyboard.press('ArrowRight')
    await settle(page, 700)
    await snap(page, `select-${hero}`, {
      group: 'flow', focus: `roster card and portrait for ${hero}, cursor, info strip`,
      crops: { roster: CROPS.roster, strip: CROPS.strip },
    })
  }

  await start(page, 'zhaoyun', 'stage1')
  await dismissIntro(page)
  await stepRender(page, 1)
  await snap(page, 'stage1-idle', {
    group: 'flow', focus: 'HUD plate, centre chip, idle pose, backdrop',
    crops: { plate: CROPS.plate, centre: CROPS.centre, hero: await heroBox(page) },
  })

  const landed = await fight(page)
  await snap(page, 'stage1-combat', {
    group: 'flow', focus: `live combat${landed ? '' : ' (no landed blow found)'}: strike pose, enemy reaction, readability`,
    crops: { hero: await heroBox(page), centre: CROPS.centre },
  })

  await mutate(page, 'lowhp')
  await stepRender(page, 1)
  await settle(page, 300)
  await snap(page, 'stage1-lowhp', { group: 'flow', focus: 'low-HP warning on the plate', crops: { plate: CROPS.plate } })

  await mutate(page, 'unlock')
  await stepRender(page, 1)
  await freezeWhen(page, goCueBright)
  await shoot(page, 'stage1-go', { group: 'flow', focus: 'GO cue and chip after the wave', crops: { centre: CROPS.centre, go: { x: 340, y: 100, w: 140, h: 42 } } })

  await page.keyboard.press('p')
  await hudTextShown(page, 'PAUSED')
  await shoot(page, 'stage1-pause', { group: 'flow', focus: 'pause overlay card and hint', crops: { dialog: CROPS.dialog } })
  await page.keyboard.press('p')
  await expect.poll(() => page.evaluate(() => (window.__DW_GAME__?.scene.getScene('game') as unknown as { paused: boolean }).paused)).toBe(false)

  await page.evaluate(() => window.__DW__?.forceBoss())
  await stepRender(page, 1)
  await freezeWhen(page, bannerUp)
  await shoot(page, 'stage1-boss-warning', { group: 'flow', focus: 'boss WARNING banner', crops: { banner: CROPS.banner } })
  await settle(page, 1800)
  await stepRender(page, 40)
  const boss = (await sim(page)).enemies.find((e) => e.boss)
  const s1 = await sim(page)
  await snap(page, 'stage1-boss', {
    group: 'flow', focus: 'boss rail, boss sprite scale and menace',
    crops: { rail: CROPS.rail, ...(boss ? { boss: actorBox(boss.x, boss.y, boss.z, s1.scrollX) } : {}) },
  })

  await mutate(page, 'kill')
  await stepRender(page, 1)
  await hudTextShown(page, 'CONTINUE?')
  await shoot(page, 'stage1-continue', { group: 'flow', focus: 'CONTINUE? countdown overlay', crops: { dialog: CROPS.dialog } })
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await sim(page)).phase).toBe('fight')

  await mutate(page, 'bossdown')
  await stepRender(page, 1)
  await stepRender(page, 12)
  await snap(page, 'stage1-clear', { group: 'flow', focus: 'stage-clear beat, boss fall' })
  await expect.poll(() => scene(page)).toBe('result')
  await settle(page, 1200)
  await snap(page, 'stage1-result', { group: 'flow', focus: 'result panel, score count, typography' })

  await start(page, 'zhaoyun', 'stage9')
  await page.evaluate(() => window.__DW__?.forceResult())
  await expect.poll(() => scene(page)).toBe('result')
  await settle(page, 1200)
  await snap(page, 'stage9-result', { group: 'flow', focus: 'final-stage result panel' })
  await page.keyboard.press('Enter')
  await expect.poll(() => scene(page)).toBe('gamecomplete')
  await settle(page, 1200)
  await snap(page, 'gamecomplete', { group: 'flow', focus: 'ending screen' })

  await start(page, 'zhaoyun', 'stage1')
  await page.evaluate(() => window.__DW__?.forceGameOver())
  await expect.poll(() => scene(page)).toBe('gameover')
  await settle(page, 1200)
  await snap(page, 'gameover', { group: 'flow', focus: 'game-over screen' })

  await start(page, 'guanyu', 'stage1')
  await dismissIntro(page)
  await page.evaluate(() => window.__DW__?.joinP2('zhangfei'))
  await stepRender(page, 20)
  await snap(page, 'coop', { group: 'flow', focus: 'two plates, two heroes, overlap', crops: { plate: CROPS.plate, plate2: CROPS.plate2 } })

  await start(page, 'zhaoyun', 'stage2')
  await dismissIntro(page)
  for (let i = 0; i < 10 && !(await sim(page)).player.mounted; i += 1) await run(page, walk(12))
  await run(page, walk(20))
  await snap(page, 'stage2-horse', { group: 'flow', focus: 'mounted rider: seat, scale, gallop', crops: { hero: await heroBox(page), plate: CROPS.plate } })

  expect(errors.get(page)).toEqual([])
})

test('stages: every stage banner, intro card and play frame', async ({ page }) => {
  test.setTimeout(600_000)
  await boot(page)
  for (const [i, stage] of STAGE_ORDER.entries()) {
    const n = i + 1
    await start(page, 'zhaoyun', stage)
    await freezeWhen(page, bannerUp)
    await shoot(page, `stage${n}-banner`, { group: 'stages', focus: `stage ${n} entry banner`, crops: { banner: CROPS.banner } })
    await freezeWhen(page, introRaised)
    await shoot(page, `stage${n}-intro`, { group: 'stages', focus: `stage ${n} intro card lore and seal`, crops: { intro: CROPS.intro } })
    await page.keyboard.press('Enter')
    await expect.poll(() => introUp(page)).toBe(false)
    await run(page, walk(60))
    await snap(page, `stage${n}-play`, { group: 'stages', focus: `stage ${n} backdrop, ground, enemies`, crops: { hero: await heroBox(page) } })
  }
  expect(errors.get(page)).toEqual([])
})

async function phone(browser: Browser, label: string, profile: (typeof devices)[string]): Promise<void> {
  const ctx = await browser.newContext({ ...profile })
  const page = await ctx.newPage()
  await boot(page, '/?renderer=canvas&autopilot=1', false)
  await settle(page, 1500)
  await snap(page, `phone-${label}-title`, { group: 'platform', focus: `${label} phone title fit` })
  await page.keyboard.press('Enter')
  await expect.poll(() => scene(page)).toBe('select')
  await settle(page, 700)
  await snap(page, `phone-${label}-select`, { group: 'platform', focus: `${label} phone roster fit` })
  await start(page, 'zhaoyun', 'stage1')
  await dismissIntro(page)
  if (label === 'portrait') {
    // UIR-7 (V-9): portrait shows the rotate overlay with the sim paused -
    // no ticks will ever render, so assert the overlay instead of walking.
    await expect(page.locator('#rotate-overlay')).toBeVisible()
  } else {
    await run(page, walk(40))
  }
  await snap(page, `phone-${label}-game`, { group: 'platform', focus: `${label} touch controls vs HUD and action` })
  expect(errors.get(page)).toEqual([])
  await ctx.close()
}

test('platform: phone portrait and landscape, and the shipped WebGL renderer', async ({ browser, page }) => {
  test.setTimeout(600_000)
  await phone(browser, 'portrait', devices['Pixel 7'])
  await phone(browser, 'landscape', devices['Pixel 7 landscape'])

  await boot(page, '/?autopilot=1')
  expect.soft(await page.evaluate(() => window.__DW_GAME__?.renderer.type), 'WebGL renderer').not.toBe(1)
  await settle(page, 1500)
  await snap(page, 'webgl-title', { group: 'platform', focus: 'WebGL title vs canvas' })
  await page.keyboard.press('Enter')
  await expect.poll(() => scene(page)).toBe('select')
  await settle(page, 700)
  await snap(page, 'webgl-select', { group: 'platform', focus: 'WebGL roster vs canvas' })
  await start(page, 'zhaoyun', 'stage1')
  await dismissIntro(page)
  await fight(page)
  await snap(page, 'webgl-combat', { group: 'platform', focus: 'WebGL combat vs canvas', crops: { hero: await heroBox(page), plate: CROPS.plate } })
  await page.evaluate(() => window.__DW__?.forceBoss())
  await settle(page, 1800)
  await stepRender(page, 40)
  await snap(page, 'webgl-boss', { group: 'platform', focus: 'WebGL boss and rail', crops: { rail: CROPS.rail } })
  await page.evaluate(() => window.__DW__?.forceResult())
  await expect.poll(() => scene(page)).toBe('result')
  await settle(page, 1200)
  await snap(page, 'webgl-result', { group: 'platform', focus: 'WebGL result panel' })
  expect(errors.get(page)).toEqual([])
})
