import { mkdirSync, writeFileSync } from 'node:fs'
import type { Sim } from '../src/core/sim'
import { expect, test } from '@playwright/test'

// Diagnostic capture: still gated because these candidate drawings are NOT
// aesthetically accepted. Real gameplay updates select actual sprite textures.
test.skip(process.env.MOTION_LOOK !== '1', 'set MOTION_LOOK=1 for the motion experiment')
test.describe.configure({ mode: 'serial' })
test.use({ video: 'on' })
const OUT = 'artifacts/wholeframe/motion'

type LiveGame = {
  sim: Sim
  syncSprites(): void
  sprites: Map<number, { texture: { key: string }; originY: number }>
}

for (const [variant, query, renderer] of [
  ['current', '', 'canvas'], ['motion', '&motion=1', 'canvas'], ['motion-webgl', '&motion=1', 'webgl'],
] as const) {
  test(`moving Guan Yu diagnostic: ${variant}`, async ({ page }, testInfo) => {
    test.setTimeout(180_000)
    mkdirSync(OUT, { recursive: true })
    const errors: string[] = []
    const requested: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))
    page.on('request', (r) => { if (r.url().includes('/motion/guanyu-motion-sheet') && !new URL(r.url()).searchParams.has('import')) requested.push(r.url()) })
    await page.setViewportSize({ width: 960, height: 540 })
    await page.goto(`/?renderer=${renderer}&autopilot=1${query}`)
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    const published = await page.evaluate(() => Object.keys(window.__DW_GAME__?.scene.getScene('boot').registry.get('paintedHeroArt')?.motions ?? {}))
    expect(published).toEqual(variant === 'current' ? [] : ['guanyu'])
    if (variant === 'current') expect(requested).toEqual([])
    if (renderer === 'webgl') expect(await page.evaluate(() => window.__DW_GAME__?.renderer.type)).toBe(2)
    await page.evaluate(() => window.__DW__?.startGame('guanyu', 42, 'stage1'))
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
    const introUp = (): Promise<boolean> => page.evaluate(() => !!window.__DW_GAME__?.scene.getScene('hud')?.children.list.some((o) => o.name === 'introCard'))
    await expect.poll(introUp).toBe(true) // Enter before it exists does nothing.
    await page.keyboard.press('Enter')
    await expect.poll(introUp).toBe(false)
    // Isolate a controlled motion review on the real stage; do not pretend this
    // is combat AI coverage. Remove enemies/props only in this test page's sim.
    await page.evaluate(() => {
      const game = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      game.sim.entities = game.sim.entities.filter((e) => e.id === game.sim.playerId)
      game.sim.cameraLocked = false // otherwise clearing enemies starts next wave
      game.sim.waveIndex = 0 // do not trigger the final boss in this movement capture
      const p = game.sim.entities[0]!
      p.x = 160; p.y = 205; p.state = 'idle'; p.stateTick = 0; p.attackId = null
      game.syncSprites()
    })
    const timeline = await page.evaluate(async (isMotion) => {
      const game = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      const p = game.sim.entities[0]!
      const shots: Array<{ tick: number; elapsedMs: number; state: string; stateTick: number; attackId: string | null; key: string; facing: string }> = []
      const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
      const began = performance.now()
      const neutral = { up: false, down: false, left: false, right: false, attackPressed: false, jumpPressed: false, specialPressed: false }
      let expected = game.sim.tick
      // 30 simulated frames/s during capture, 2 ticks/frame = real-time 60Hz.
      // This is page-side controlled input, NOT generated/interpolated video.
      for (let i = 0; i < 210; i++) {
        const input = { ...neutral }
        if (i >= 15 && i < 47) input.right = true
        if (i === 62 || i === 67 || i === 79) input.attackPressed = true
        if (i >= 126 && i < 158) input.left = true
        if (i === 173 || i === 178 || i === 190) input.attackPressed = true
        expected += 2
        window.__DW__!.run([input, { ...input, attackPressed: false }])
        while (game.sim.tick < expected) await new Promise<void>((r) => requestAnimationFrame(() => r()))
        await new Promise<void>((r) => requestAnimationFrame(() => r()))
        const key = game.sprites.get(p.id)!.texture.key
        shots.push({ tick: game.sim.tick, elapsedMs: Math.round(performance.now() - began), state: p.state, stateTick: p.stateTick, attackId: p.attackId, key, facing: p.facing })
        // Remaining time approximates normal speed; recorded timestamps and
        // tick trace make any recording pace drift visible, not hidden.
        await wait(Math.max(0, (i + 1) * 1000 / 30 - (performance.now() - began)))
      }
      if (isMotion && shots.some((s) => !s.key.includes(':motion:'))) throw new Error(`old art leaked: ${JSON.stringify(shots.filter((s) => !s.key.includes(':motion:')).slice(0, 4))}`)
      return shots
    }, variant !== 'current')
    writeFileSync(`${OUT}/${variant}-timeline.json`, `${JSON.stringify(timeline, null, 2)}\n`)
    expect(new Set(timeline.map((s) => s.attackId))).toEqual(new Set([null, 'gy.jab1', 'gy.jab2', 'gy.finisher']))
    if (variant !== 'current') {
      expect(timeline.every((s) => s.key.startsWith('entity:guanyu:motion:'))).toBe(true)
      const paused = await page.evaluate(() => {
        const game = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
        const p = game.sim.entities[0]!
        p.state = 'walk'; p.stateTick = 7
        game.syncSprites(); const before = game.sprites.get(p.id)!.texture.key
        for (let i = 0; i < 20; i++) game.syncSprites()
        return [before, game.sprites.get(p.id)!.texture.key]
      })
      expect(paused[0]).toBe(paused[1])
    }
    await page.screenshot({ path: `${OUT}/${variant}-final.png` })
    expect(errors).toEqual([])
    await testInfo.attach(`${variant} temporal trace`, { path: `${OUT}/${variant}-timeline.json`, contentType: 'application/json' })
    const video = page.video()
    await page.close()
    if (video) await video.saveAs(`${OUT}/${variant}-ingame.webm`)
  })
}

test('missing sheet rejects motion pack and keeps original character art', async ({ page }) => {
  await page.route('**/assets/motion/guanyu-motion-sheet.png*', (route) => new URL(route.request().url()).searchParams.has('import') ? route.continue() : route.abort())
  await page.goto('/?renderer=canvas&autopilot=1&motion=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  expect(await page.evaluate(() => Object.keys(window.__DW_GAME__?.scene.getScene('boot').registry.get('paintedHeroArt')?.motions ?? {}))).toEqual([])
  await page.evaluate(() => window.__DW__?.startGame('guanyu', 42, 'stage1'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  expect(await page.evaluate(() => {
    const game = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
    return game.sprites.get(game.sim.playerId)!.texture.key
  })).toBe('entity:guanyu:idle')
})
