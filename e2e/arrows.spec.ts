import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { neutralInput } from '../src/core/types'

/**
 * Arrows in the RUNNING game (owner request 2026-09-22):
 *  1. an arrow crosses the fight at the MIDDLE of the body (not the feet)
 *  2. an arrow falls to the ground and disappears - nothing hangs in the air
 *
 * The flight mechanics are pinned in test/core/arrows.test.ts; these pins are
 * the RENDERER side: the same numbers, real sprites, the real display list,
 * at gameplay size. Screenshots land in artifacts/arrows/ for the eye review.
 *
 * Fall captures fly in a spare lane (y offset): stage mobs converge on the
 * hero's lane and would consume the arrow before its fall, which is correct
 * behaviour and not what these frames are about.
 */

async function startGame(
  page: import('@playwright/test').Page,
  charId: string,
): Promise<void> {
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate((id) => window.__DW__?.startGame(id, 42, 'stage1'), charId)
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
}

interface FlightReading {
  arrowZ: number | null
  /** Arrow centre above the host's feet, as a fraction of its body height. */
  band: number | null
  arrowSprites: number
}

/** How high the arrow sprite rides relative to `who`'s sprite. Sprites are
 * found by ENTITY identity (kind -> id -> the scene's entity->sprite map):
 * with motion art the host's texture key is a shared atlas page
 * (`motion-source:<kind>`), so the old legacy `entity:<kind>:*` texture-key
 * search can no longer find it. */
async function readFlight(page: import('@playwright/test').Page, who: string): Promise<FlightReading> {
  return page.evaluate((needle) => {
    type Sprite = { texture: { key: string }; frame: { name: string }; y: number; displayHeight: number }
    const scene = window.__DW_GAME__?.scene.getScene('game') as unknown as
      | {
          sim?: { entities: Array<{ id: number; kind: string; z: number }> }
          sprites?: Map<number, Sprite>
          syncSprites?: () => void
          children: { list: unknown[] }
        }
      | undefined
    const sim = scene?.sim
    scene?.syncSprites?.()
    const spriteId = (s: Sprite): string => (s.frame.name === '__BASE' ? s.texture.key : s.frame.name)
    const arrowEntities = sim?.entities.filter((e) => e.kind === 'arrow') ?? []
    const arrow = arrowEntities[0] ?? null
    const arrowSprites = arrowEntities
      .map((e) => scene?.sprites?.get(e.id))
      .filter((s): s is Sprite => !!s && spriteId(s).startsWith('entity:arrow'))
    const arrowSprite = arrowSprites[0]
    const hostEntity = sim?.entities.find((e) => e.kind === needle)
    const host = hostEntity ? scene?.sprites?.get(hostEntity.id) : undefined
    let band: number | null = null
    if (arrowSprite && host) {
      const arrowCentre = arrowSprite.y - arrowSprite.displayHeight / 2
      band = (host.y - arrowCentre) / Math.max(1, host.displayHeight)
    }
    return { arrowZ: arrow ? arrow.z : null, band, arrowSprites: arrowSprites.length }
  }, who)
}

test('a hero arrow crosses at the middle of the body and leaves nothing behind', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  const dir = path.join(process.cwd(), 'artifacts/arrows')
  fs.mkdirSync(dir, { recursive: true })

  await startGame(page, 'huangzhong')
  // Huang Zhong's bow special: a real hero arrow from the real spawn path.
  // The input is built on the Node side and passed in - evaluate closures do
  // not carry module imports into the page.
  await page.evaluate(
    (input: ReturnType<typeof neutralInput>) => window.__DW__?.run([input]),
    { ...neutralInput(), specialPressed: true },
  )
  await page.evaluate(() => window.__DW__?.step(14))

  const mid = await readFlight(page, 'huangzhong')
  expect(mid.arrowZ, 'the hero arrow is in flight').not.toBeNull()
  expect(mid.arrowSprites, 'the arrow renders as a sprite').toBeGreaterThanOrEqual(1)
  // The claim itself: the arrow rides the MIDDLE of the fighter's body -
  // measured against the real sprite heights, not a hard-coded number.
  expect(mid.band, `arrow at ${(mid.band ?? 0).toFixed(2)} of body height`).toBeGreaterThan(0.3)
  expect(mid.band ?? 0).toBeLessThan(0.7)
  await page.screenshot({ path: path.join(dir, 'hero-midflight.png') })

  // However its flight ends (hit, fall or range), it must end GONE: entity
  // and sprite removed - the pre-fix hero arrow hung in the air forever.
  for (let i = 0; i < 80; i += 1) {
    await page.evaluate(() => window.__DW__?.step(4))
    const now = await readFlight(page, 'huangzhong')
    if (now.arrowZ === null) break
  }
  const end = await readFlight(page, 'huangzhong')
  expect(end.arrowZ, 'the hero arrow is removed, not hanging').toBeNull()
  expect(end.arrowSprites, 'no arrow sprite lingers').toBe(0)
  expect(pageErrors).toEqual([])
})

test('an NPC arrow flies at body height and leaves nothing behind', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  const dir = path.join(process.cwd(), 'artifacts/arrows')
  fs.mkdirSync(dir, { recursive: true })

  await startGame(page, 'zhaoyun')
  await page.evaluate(() => window.__DW__?.step(60))

  // Drop a real archer into bow range: cloned from a live wave enemy so it
  // carries the exact entity shape, driven afterwards by the real archer AI.
  await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('game') as unknown as
      | { sim: { entities: Array<Record<string, unknown>>; playerId: number } }
      | undefined
    const sim = scene?.sim
    if (!sim) return
    const donor = sim.entities.find((e) => e.side === 'enemy')
    const player = sim.entities.find((e) => e.id === sim.playerId)
    if (!donor || !player) return
    sim.entities.push({
      ...donor,
      id: 9999,
      kind: 'archer',
      x: (player.x as number) + 150,
      y: player.y,
      z: 0,
      hp: 18,
      maxHp: 18,
      state: 'idle',
      stateTick: 0,
      attackId: null,
      struck: [],
      thinkTick: 0,
      grabbedBy: null,
      invulnerableTicks: 0,
    })
  })

  let flight = await readFlight(page, 'archer')
  for (let i = 0; i < 40 && flight.arrowZ === null; i += 1) {
    await page.evaluate(() => window.__DW__?.step(4))
    flight = await readFlight(page, 'archer')
  }
  expect(flight.arrowZ, 'the NPC arrow is in flight').not.toBeNull()
  expect(flight.band, `NPC arrow at ${(flight.band ?? 0).toFixed(2)} of body height`).toBeGreaterThan(0.3)
  expect(flight.band ?? 0).toBeLessThan(0.7)
  // A few more ticks so the shot frames the arrow clear of the bow.
  await page.evaluate(() => window.__DW__?.step(8))
  await page.screenshot({ path: path.join(dir, 'npc-midflight.png') })

  for (let i = 0; i < 40; i += 1) {
    await page.evaluate(() => window.__DW__?.step(4))
    const now = await readFlight(page, 'archer')
    if (now.arrowZ === null) break
  }
  const end = await readFlight(page, 'archer')
  expect(end.arrowZ, 'the NPC arrow is gone, not hanging').toBeNull()
  expect(end.arrowSprites, 'no arrow sprite lingers').toBe(0)
  expect(pageErrors).toEqual([])
})

test('an arrow falls to the ground and disappears there', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  const dir = path.join(process.cwd(), 'artifacts/arrows')
  fs.mkdirSync(dir, { recursive: true })

  await startGame(page, 'huangzhong')
  // Clear the lane and close the waves (test-driven, no new mechanics): the
  // fall must be OBSERVABLE - a mob consuming the arrow first is correct
  // behaviour but not what this frame is about.
  await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('game') as unknown as
      | { sim: { entities: Array<Record<string, unknown>>; waveIndex: number } }
      | undefined
    const sim = scene?.sim
    if (!sim) return
    sim.entities = sim.entities.filter((e) => e.side !== 'enemy')
    sim.waveIndex = 3 // stage 1 has 3 waves: no further spawns
  })
  // A hero arrow in a spare lane (the real mechanics, the real renderer -
  // only the spawn is test-driven, exactly like the archer above), kept
  // on screen: it descends at x ~ 370 and lands at ~ 450 of the 480 view.
  await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('game') as unknown as
      | { sim: { entities: Array<Record<string, unknown>>; playerId: number; nextEntityId: number } }
      | undefined
    const sim = scene?.sim
    if (!sim) return
    const player = sim.entities.find((e) => e.id === sim.playerId)
    if (!player) return
    sim.entities.push({
      ...player,
      id: 9999,
      kind: 'arrow',
      side: 'hero',
      x: (player.x as number) + 10,
      y: (player.y as number) + 45,
      z: 40,
      vx: 4,
      state: 'walk',
      stateTick: 0,
      hp: 1,
      maxHp: 1,
      invulnerableTicks: 0,
      grabbedBy: null,
    })
  })

  // Level flight first - it must NOT be low at the start.
  await page.evaluate(() => window.__DW__?.step(10))
  const level = await readFlight(page, 'huangzhong')
  expect(level.arrowZ, 'the arrow is in flight').not.toBeNull()
  expect(level.arrowZ ?? 0).toBeGreaterThanOrEqual(38)

  // Then it descends - catch it visibly low, still mid-air.
  let falling = await readFlight(page, 'huangzhong')
  for (let i = 0; i < 60 && falling.arrowZ !== null && (falling.arrowZ ?? 99) >= 26; i += 1) {
    await page.evaluate(() => window.__DW__?.step(2))
    falling = await readFlight(page, 'huangzhong')
  }
  expect(falling.arrowZ, 'the arrow descends toward the ground').toBeLessThan(26)
  await page.screenshot({ path: path.join(dir, 'hero-falling.png') })

  // And disappears at the ground - entity AND sprite gone.
  for (let i = 0; i < 60; i += 1) {
    await page.evaluate(() => window.__DW__?.step(4))
    const now = await readFlight(page, 'huangzhong')
    if (now.arrowZ === null) break
  }
  const end = await readFlight(page, 'huangzhong')
  expect(end.arrowZ, 'the landed arrow is removed').toBeNull()
  expect(end.arrowSprites, 'no arrow sprite lingers').toBe(0)
  expect(pageErrors).toEqual([])
})
