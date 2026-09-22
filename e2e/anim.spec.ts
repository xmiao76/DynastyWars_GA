import { expect, test } from '@playwright/test'
import type Phaser from 'phaser'
import { decideBotScript } from '../selfplay/bot'

// Placeholder animation: walk frames alternate while walking, and a knocked
// down enemy renders the lying pose.
test('walk cycle alternates frames and knockdown renders the down pose', async ({ page }) => {
  test.setTimeout(120_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  // Part 1 (real time): walk right and sample the player texture key.
  await page.goto('/?renderer=canvas')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('select')
  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')

  const playerTextureKeys = async (): Promise<string[]> =>
    page.evaluate(() => {
      const game = window.__DW_GAME__
      const scene = game?.scene.getScene('game')
      if (!scene) return []
      return scene.children.list
        .filter((child): child is Phaser.GameObjects.Sprite => child.type === 'Sprite')
        .map((child) => child.texture.key)
        .filter((key) => key.startsWith('entity:guanyu:'))
    })

  const seen = new Set<string>()
  await page.keyboard.down('ArrowRight')
  for (let i = 0; i < 6; i += 1) {
    for (const key of await playerTextureKeys()) seen.add(key)
    await page.waitForTimeout(180)
  }
  await page.keyboard.up('ArrowRight')
  expect(seen.has('entity:guanyu:walk0')).toBe(true)
  expect(seen.has('entity:guanyu:walk1')).toBe(true)
  await page.screenshot({ path: 'artifacts/anim-walk.png' })

  // Part 2 (autopilot): drive the bot until an enemy is knocked down, then
  // check its texture is the lying pose.
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')

  let sawDown = false
  for (let i = 0; i < 200 && !sawDown; i += 1) {
    const snapshot = await page.evaluate(() => window.__DW__?.getSnapshot())
    if (!snapshot?.sim) continue
    if (snapshot.sim.enemies.some((e) => e.state === 'knockdown' || e.state === 'thrown')) {
      const keys = await page.evaluate(() => {
        const game = window.__DW_GAME__
        const scene = game?.scene.getScene('game')
        if (!scene) return []
        return scene.children.list
          .filter((child): child is Phaser.GameObjects.Sprite => child.type === 'Sprite')
          .map((child) => child.texture.key)
      })
      sawDown = keys.some((key) => key.endsWith(':down'))
      if (sawDown) break
    }
    const script = decideBotScript(snapshot)
    const tickBefore = snapshot.tick
    await page.evaluate((inputs) => window.__DW__?.run(inputs), script)
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().tick), { timeout: 5000 })
      .toBeGreaterThanOrEqual(tickBefore + script.length)
  }
  expect(sawDown).toBe(true)
  expect(pageErrors).toEqual([])
})

// Part 3 (autopilot, tick-dense): mash attack one tick at a time and watch the
// player's texture. Every press either starts a swing or buffers the next
// combo link, so the texture must cycle windup -> strike -> recover with a
// withdrawn frame between consecutive strikes - the weapon visibly comes back
// instead of sitting extended through the whole combo.
// ENH-6: Zhao Yun's triple is attack -> attack2 -> thrust, so all three
// strikes must appear; the strike predicate covers the ENH-5 poses too.
test('a ground combo cycles windup, all three strikes and recover with a retract between hits', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')

  const playerKeys = async (): Promise<string[]> =>
    page.evaluate(() => {
      const game = window.__DW_GAME__
      const scene = game?.scene.getScene('game')
      if (!scene) return []
      return scene.children.list
        .filter((child): child is Phaser.GameObjects.Sprite => child.type === 'Sprite')
        .map((child) => child.texture.key)
        .filter((key) => key.startsWith('entity:zhaoyun:'))
    })

  const press = {
    up: false,
    down: false,
    left: false,
    right: false,
    attackPressed: true,
    jumpPressed: false,
    specialPressed: false,
  }
  const seen = new Set<string>()
  const seq: string[] = []
  for (let i = 0; i < 300; i += 1) {
    const before = await page.evaluate(() => window.__DW__?.getSnapshot()?.tick ?? -1)
    await page.evaluate((input) => window.__DW__?.run([input]), press)
    await expect
      .poll(() => page.evaluate(() => window.__DW__?.getSnapshot()?.tick ?? -1), { timeout: 5000 })
      .toBeGreaterThan(before)
    const snap = await page.evaluate(() => window.__DW__?.getSnapshot())
    if (!snap?.sim || snap.sim.player.hp <= 0) break
    for (const key of await playerKeys()) {
      seen.add(key)
      if (seq[seq.length - 1] !== key) seq.push(key)
    }
    if (
      seen.has('entity:zhaoyun:windup') &&
      seen.has('entity:zhaoyun:attack') &&
      seen.has('entity:zhaoyun:attack2') &&
      seen.has('entity:zhaoyun:thrust') &&
      seen.has('entity:zhaoyun:recover')
    ) {
      break
    }
  }

  expect(seen.has('entity:zhaoyun:windup')).toBe(true)
  expect(seen.has('entity:zhaoyun:attack')).toBe(true)
  expect(seen.has('entity:zhaoyun:attack2')).toBe(true)
  expect(seen.has('entity:zhaoyun:thrust')).toBe(true)
  expect(seen.has('entity:zhaoyun:recover')).toBe(true)

  // The combo-retract assertion: somewhere in the sampled order, two strikes
  // are separated by withdrawn frames and nothing else - one uninterrupted
  // combo link. Interruptions (hurt, down, idle between combos) break the
  // run and simply do not count. Withdrawn is still windup/recover (shared);
  // strike covers both historical poses and the ENH-5 thrust/chop/sweep.
  const strike = (key: string): boolean =>
    key.endsWith(':attack') ||
    key.endsWith(':attack2') ||
    key.endsWith(':thrust') ||
    key.endsWith(':chop') ||
    key.endsWith(':sweep')
  const withdrawn = (key: string): boolean => key.endsWith(':windup') || key.endsWith(':recover')
  let linked = false
  for (let i = 0; i < seq.length && !linked; i += 1) {
    if (!strike(seq[i] ?? '')) continue
    let sawWithdrawn = false
    for (let j = i + 1; j < seq.length; j += 1) {
      const key = seq[j] ?? ''
      if (strike(key)) {
        if (sawWithdrawn) linked = true
        break
      }
      if (!withdrawn(key)) break
      sawWithdrawn = true
    }
  }
  expect(linked).toBe(true)
  expect(pageErrors).toEqual([])
})

// Part 4 (ENH-6, autopilot, tick-dense): each hero's full combo renders its
// own STRIKE_POSE triple end to end - Zhang Fei thrust-first, Guan Yu
// sweep/chop - and no two heroes share the same ordered triple.
test('each hero combo shows its own strike triple (ZF thrust, GY sweep/chop)', async ({
  page,
}) => {
  test.setTimeout(300_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  // Mirrors STRIKE_POSE in src/game/adapters/sprites.ts (unit-pinned); the
  // dynamic part below proves each triple actually renders in the game.
  const EXPECTED: Record<string, [string, string, string]> = {
    guanyu: ['sweep', 'attack', 'chop'],
    zhangfei: ['thrust', 'attack2', 'sweep'],
    zhaoyun: ['attack', 'attack2', 'thrust'],
    huangzhong: ['thrust', 'chop', 'sweep'],
    weiyan: ['attack', 'sweep', 'chop'],
  }
  // Never the same triple: five heroes, five ordered triples.
  expect(new Set(Object.values(EXPECTED).map((t) => t.join(','))).size).toBe(5)

  const press = {
    up: false,
    down: false,
    left: false,
    right: false,
    attackPressed: true,
    jumpPressed: false,
    specialPressed: false,
  }

  const observed: Record<string, string[]> = {}
  for (const [hero, triple] of Object.entries(EXPECTED)) {
    await page.goto('/?renderer=canvas&autopilot=1')
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    await page.evaluate((id) => window.__DW__?.startGame(id, 42), hero)
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')

    const seen = new Set<string>()
    for (let i = 0; i < 350; i += 1) {
      const before = await page.evaluate(() => window.__DW__?.getSnapshot()?.tick ?? -1)
      await page.evaluate((input) => window.__DW__?.run([input]), press)
      await expect
        .poll(() => page.evaluate(() => window.__DW__?.getSnapshot()?.tick ?? -1), { timeout: 5000 })
        .toBeGreaterThan(before)
      const snap = await page.evaluate(() => window.__DW__?.getSnapshot())
      if (!snap?.sim || snap.sim.player.hp <= 0) break
      const keys: string[] = await page.evaluate((h) => {
        const game = window.__DW_GAME__
        const scene = game?.scene.getScene('game')
        if (!scene) return []
        return scene.children.list
          .filter((child): child is Phaser.GameObjects.Sprite => child.type === 'Sprite')
          .map((child) => child.texture.key)
          .filter((key) => key.startsWith('entity:' + h + ':'))
      }, hero)
      for (const key of keys) seen.add(key)
      if (triple.every((pose) => seen.has('entity:' + hero + ':' + pose))) break
    }
    for (const pose of triple) {
      expect(seen.has('entity:' + hero + ':' + pose), hero + ' shows ' + pose).toBe(true)
    }
    observed[hero] = triple.filter((pose) => seen.has('entity:' + hero + ':' + pose))
  }

  // Requirement in words: Zhang Fei shows thrust-family keys, Guan Yu
  // sweep/chop-family - and the five rendered triples are all distinct.
  expect(observed['zhangfei'] ?? []).toContain('thrust')
  expect(observed['guanyu'] ?? []).toContain('sweep')
  expect(observed['guanyu'] ?? []).toContain('chop')
  expect(new Set(Object.values(observed).map((t) => t.join(','))).size).toBe(5)
  expect(pageErrors).toEqual([])
})
