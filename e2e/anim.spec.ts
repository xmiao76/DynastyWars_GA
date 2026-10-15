import { expect, test } from '@playwright/test'
import type Phaser from 'phaser'
import { decideBotScript } from '../selfplay/bot'

// Motion animation (default ON): walk-clip frames cycle while walking, and
// a knocked down enemy renders its motion fall/down frames. A motion
// sprite's display identity is its shared-atlas FRAME name
// (`entity:<kind>:motion:<clip>:<idx>`), not the sheet texture key; legacy
// sprites keep the pose in the texture key with frame `__BASE`.
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
        .map((child) => (child.frame.name === '__BASE' ? child.texture.key : child.frame.name))
        .filter((key) => key.startsWith('entity:guanyu:'))
    })

  const seen = new Set<string>()
  await page.keyboard.down('ArrowRight')
  for (let i = 0; i < 8; i += 1) {
    for (const key of await playerTextureKeys()) seen.add(key)
    await page.waitForTimeout(150)
  }
  await page.keyboard.up('ArrowRight')
  // Guan Yu's walk clip cycles walk:1..walk:8 (guard walk:0 at rest): while
  // walking, at least two distinct motion walk frames must have rendered,
  // and nothing the player showed may be a legacy pose.
  const walkFrames = [...seen].filter((key) => /^entity:guanyu:motion:walk:[1-8]$/.test(key))
  expect(walkFrames.length, `walk frames seen: ${[...seen].join(', ')}`).toBeGreaterThanOrEqual(2)
  expect([...seen].every((key) => key.startsWith('entity:guanyu:motion:'))).toBe(true)
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
      // Identity-checked: the sprite OF a knocked-down/thrown enemy (via the
      // scene's entity->sprite map) must show that kind's motion fall clip
      // (mook fall-thrown:* ending on the DOWN frame, hero-style fall:*).
      const downFrames = await page.evaluate(() => {
        const scene = window.__DW_GAME__?.scene.getScene('game') as unknown as
          | {
              sim?: { entities: Array<{ id: number; kind: string; state: string }> }
              sprites?: Map<number, { frame: { name: string }; texture: { key: string } }>
              syncSprites?: () => void
            }
          | undefined
        if (!scene?.sim || !scene.sprites) return []
        scene.syncSprites?.()
        return scene.sim.entities
          .filter((e) => e.state === 'knockdown' || e.state === 'thrown')
          .map((e) => {
            const sprite = scene.sprites!.get(e.id)
            if (!sprite) return ''
            return sprite.frame.name === '__BASE' ? sprite.texture.key : sprite.frame.name
          })
      })
      sawDown = downFrames.some((key) => /:motion:(fall|fall-thrown):\d+$/.test(key))
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

// Part 3 (autopilot, tick-dense): mash attack one tick at a time and watch
// the player's motion frame. Every press either starts a swing or buffers
// the next combo link, so the frame must cycle windup -> strike -> recover
// with a withdrawn frame between consecutive strikes - the weapon visibly
// comes back instead of sitting extended through the whole combo.
// Motion mapping (motion-clips-zhaoyun.ts): each combo clip jab1/jab2/
// finisher exposes :0/:1 windup, :2 at the strike (startup tick), :3/:4
// follow/recover, bookended by the walk:0 guard - so all three strike
// frames plus a windup and a recover frame must appear.
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
        .map((child) => (child.frame.name === '__BASE' ? child.texture.key : child.frame.name))
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
  const frame = (clipFrame: string): string => `entity:zhaoyun:motion:${clipFrame}`
  const windupSeen = (): boolean => [...seen].some((k) => /:motion:(jab1|jab2|finisher):[01]$/.test(k))
  const recoverSeen = (): boolean => [...seen].some((k) => /:motion:(jab1|jab2|finisher):[34]$/.test(k))
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
    if (windupSeen() && seen.has(frame('jab1:2')) && seen.has(frame('jab2:2')) && seen.has(frame('finisher:2')) && recoverSeen()) {
      break
    }
  }

  expect(windupSeen(), 'a combo windup frame (:0/:1) renders').toBe(true)
  expect(seen.has(frame('jab1:2')), 'jab1 strike frame renders').toBe(true)
  expect(seen.has(frame('jab2:2')), 'jab2 strike frame renders').toBe(true)
  expect(seen.has(frame('finisher:2')), 'finisher strike frame renders').toBe(true)
  expect(recoverSeen(), 'a combo recover frame (:3/:4) renders').toBe(true)
  expect([...seen].every((k) => k.startsWith('entity:zhaoyun:motion:')), 'no legacy pose renders').toBe(true)

  // The combo-retract assertion: somewhere in the sampled order, two strike
  // frames are separated only by combo-clip frames including at least one
  // withdrawn frame (the next clip's windup :0/:1 or the walk:0 guard) -
  // one uninterrupted combo link where the weapon visibly comes back.
  // Interruptions (hurt misc:*, fall:*, locomotion) break the run and
  // simply do not count.
  const strike = (key: string): boolean => /:motion:(jab1|jab2|finisher):2$/.test(key)
  const withdrawn = (key: string): boolean => /:motion:(jab1|jab2|finisher):[01]$/.test(key) || key === frame('walk:0')
  const inCombo = (key: string): boolean => /:motion:(jab1|jab2|finisher):\d$/.test(key) || key === frame('walk:0')
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
      if (!inCombo(key)) break
      if (withdrawn(key)) sawWithdrawn = true
    }
  }
  expect(linked).toBe(true)
  expect(pageErrors).toEqual([])
})

// Part 4 (autopilot, tick-dense): each hero's full combo renders its own
// motion strike triple end to end - the jab1 -> jab2 -> finisher strike
// frames of THAT hero's pack, in order - and no two heroes share the same
// ordered triple of frame ids (the kind segment is part of the identity).
test('each hero combo shows its own motion strike triple (jab1/jab2/finisher)', async ({
  page,
}) => {
  test.setTimeout(300_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  // Mirrors the per-hero clip tables in src/game/art/motion-clips*.ts: the
  // strike frame sits at each clip's startup tick - index :2 for the
  // compact packs, :4 for Guan Yu's 9-frame drawings. The dynamic part
  // below proves each triple actually renders in the game.
  const STRIKE_INDEX: Record<string, number> = {
    guanyu: 4,
    zhangfei: 2,
    zhaoyun: 2,
    huangzhong: 2,
    weiyan: 2,
  }
  const EXPECTED: Record<string, [string, string, string]> = Object.fromEntries(
    Object.entries(STRIKE_INDEX).map(([hero, idx]) => [
      hero,
      [`entity:${hero}:motion:jab1:${idx}`, `entity:${hero}:motion:jab2:${idx}`, `entity:${hero}:motion:finisher:${idx}`],
    ]),
  )
  // Never the same triple: five heroes, five ordered frame-id triples.
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
    const firstSeenAt = new Map<string, number>()
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
          .map((child) => (child.frame.name === '__BASE' ? child.texture.key : child.frame.name))
          .filter((key) => key.startsWith('entity:' + h + ':'))
      }, hero)
      for (const key of keys) {
        if (!firstSeenAt.has(key)) firstSeenAt.set(key, i)
        seen.add(key)
      }
      if (triple.every((id) => seen.has(id))) break
    }
    for (const id of triple) {
      expect(seen.has(id), hero + ' shows ' + id).toBe(true)
    }
    expect([...seen].every((k) => k.startsWith(`entity:${hero}:motion:`)), hero + ' renders no legacy pose').toBe(true)
    // Ordered triple: the combo reaches jab1's strike before jab2's before
    // the finisher's - first-appearance order in the sampled sequence.
    const order = triple.map((id) => firstSeenAt.get(id) ?? Number.POSITIVE_INFINITY)
    expect(order[0]! < order[1]! && order[1]! < order[2]!, `${hero} strikes land jab1 -> jab2 -> finisher (${order})`).toBe(true)
    observed[hero] = triple.filter((id) => seen.has(id))
  }

  // Requirement in words: every hero rendered its OWN pack's three strike
  // frames - Zhang Fei's triple is zhangfei-kind frames, Guan Yu's is his
  // :4-indexed drawings - and the five rendered triples are all distinct.
  expect(observed['zhangfei'] ?? []).toContain('entity:zhangfei:motion:jab1:2')
  expect(observed['guanyu'] ?? []).toContain('entity:guanyu:motion:jab1:4')
  expect(observed['guanyu'] ?? []).toContain('entity:guanyu:motion:finisher:4')
  expect(new Set(Object.values(observed).map((t) => t.join(','))).size).toBe(5)
  expect(pageErrors).toEqual([])
})
