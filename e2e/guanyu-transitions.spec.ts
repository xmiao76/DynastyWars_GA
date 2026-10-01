import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import type { Sim } from '../src/core/sim'
import type { Entity } from '../src/core/types'

// Adversarial boundary capture, distinct from normal-input action recordings.
test.skip(process.env.GUANYU_ACTIONS !== '1', 'set GUANYU_ACTIONS=1')
test.use({ video: 'on' })
const OUT = 'artifacts/wholeframe/actions/transitions'
interface LiveGame { sim: Sim; syncSprites(): void; sprites: Map<number, { texture: { key: string }; frame: { name: string }; y: number; alpha: number }> }
for (const renderer of ['canvas', 'webgl'] as const) {
  test(`Guan Yu interrupted action boundaries: ${renderer}`, async ({ page }) => {
    test.setTimeout(120_000); mkdirSync(OUT, { recursive: true })
    await page.setViewportSize({ width: 960, height: 540 })
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(`/?renderer=${renderer}&autopilot=1&motion=1`)
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    await page.evaluate(() => window.__DW__!.startGame('guanyu', 42))
    await expect.poll(() => page.evaluate(() => window.__DW__!.getSnapshot().scene)).toBe('game')
    const intro = (): Promise<boolean> => page.evaluate(() => !!window.__DW_GAME__?.scene.getScene('hud').children.list.some((o) => o.name === 'introCard'))
    await expect.poll(intro).toBe(true); await page.keyboard.press('Enter'); await expect.poll(intro).toBe(false)
    await page.evaluate(() => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      g.sim.entities = g.sim.entities.filter((e) => e.id === g.sim.playerId)
      g.sim.cameraLocked = false; g.sim.waveIndex = 0
    })
    const scenarios: Array<{ name: string; steps: Array<{ ticks: number; values: Partial<Entity>; expected: string }> }> = [
      { name: 'late-kick', steps: [
        { ticks: 1, values: { state: 'jump', stateTick: 30, airTicks: 30, z: 26 }, expected: 'jump:6' },
        { ticks: 1, values: { state: 'jumpattack', attackId: 'gy.jumpkick', stateTick: 0, airTicks: 30, z: 26 }, expected: 'jump:6' },
        { ticks: 4, values: { stateTick: 4, airTicks: 34, z: 10 }, expected: 'jump:4' },
        { ticks: 2, values: { state: 'idle', stateTick: 0, z: 0 }, expected: 'jump:5' },
        { ticks: 1, values: { stateTick: 1 }, expected: 'jump:7' },
      ] },
      { name: 'air-hit', steps: [
        { ticks: 1, values: { state: 'jump', stateTick: 18, airTicks: 18, z: 48 }, expected: 'jump:3' },
        { ticks: 1, values: { state: 'knockdown', stateTick: 0, z: 0 }, expected: 'jump:3' },
        { ticks: 6, values: { stateTick: 0 }, expected: 'jump:3' }, // sim.tick hit-stop only
        { ticks: 2, values: { stateTick: 2 }, expected: 'fall:3' },
        { ticks: 5, values: { stateTick: 7 }, expected: 'fall:5' },
        { ticks: 3, values: { stateTick: 10 }, expected: 'fall:6' },
      ] },
      { name: 'landing-walk', steps: [
        { ticks: 1, values: { state: 'jump', stateTick: 35, airTicks: 35, z: 5 }, expected: 'jump:6' },
        { ticks: 1, values: { state: 'idle', stateTick: 0, z: 0 }, expected: 'jump:7' },
        { ticks: 10, values: { stateTick: 0 }, expected: 'jump:7' },
        { ticks: 1, values: { state: 'walk', stateTick: 1 }, expected: 'jump:7' },
        { ticks: 2, values: { stateTick: 3 }, expected: 'jump:1' },
        { ticks: 5, values: { stateTick: 8 }, expected: 'walk:3' },
      ] },
      { name: 'landing-mount', steps: [
        { ticks: 1, values: { state: 'jump', stateTick: 35, airTicks: 35, z: 5 }, expected: 'jump:6' },
        { ticks: 1, values: { state: 'idle', stateTick: 0, z: 0 }, expected: 'jump:7' },
        { ticks: 1, values: { state: 'walk', stateTick: 1, mountedOn: 91 }, expected: 'rider:0' },
      ] },
      { name: 'thrown-impact', steps: [
        { ticks: 1, values: { state: 'thrown', stateTick: 8, z: 10 }, expected: 'fall:4' },
        { ticks: 1, values: { state: 'knockdown', stateTick: 0, z: 0 }, expected: 'fall:4' },
        { ticks: 2, values: { stateTick: 2 }, expected: 'fall:5' },
        { ticks: 3, values: { stateTick: 5 }, expected: 'fall:6' },
      ] },
      { name: 'getup-defeat', steps: [
        { ticks: 1, values: { state: 'getup', stateTick: 5, z: 0 }, expected: 'getup:2' },
        { ticks: 1, values: { state: 'dying', stateTick: 0 }, expected: 'getup:2' },
        { ticks: 2, values: { stateTick: 2 }, expected: 'getup:1' },
        { ticks: 3, values: { stateTick: 5 }, expected: 'fall:6' },
      ] },
      { name: 'mount-break-strike', steps: [
        { ticks: 1, values: { state: 'attack', attackId: 'mounted.sweep', stateTick: 12, mountedOn: 91 }, expected: 'rider:4' },
        { ticks: 1, values: { stateTick: 13, mountedOn: null }, expected: 'jab1:4' },
        { ticks: 1, values: { stateTick: 14 }, expected: 'jab1:5' },
      ] },
    ]
    const traces: unknown[] = []
    for (const scenario of scenarios) {
      await page.evaluate(() => {
        const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
        const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
        Object.assign(p, { x: 230, y: 216, facing: 'right', state: 'attack', attackId: 'gy.jab1', stateTick: 26, mountedOn: null, z: 0 })
        g.sim.tick++; g.syncSprites() // interruption clears any prior boundary
        p.state = 'idle'; p.attackId = null; p.stateTick = 0; g.sim.tick++; g.syncSprites()
      })
      for (const [i, step] of scenario.steps.entries()) {
        const state = await page.evaluate(({ ticks, values }) => {
          const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
          const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
          Object.assign(p, values); g.sim.tick += ticks; g.syncSprites()
          const sprite = g.sprites.get(p.id)!
          return { key: sprite.frame.name === '__BASE' ? sprite.texture.key : sprite.frame.name, y: sprite.y, z: p.z, stateTick: p.stateTick, tick: g.sim.tick }
        }, step)
        expect(state.key, `${scenario.name}:${i}`).toBe(`entity:guanyu:motion:${step.expected}`)
        // Wait for the actual Phaser renderer to display the selected frame.
        await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
        await page.screenshot({ path: `${OUT}/${renderer}-${scenario.name}-${i}.png` })
        traces.push({ scenario: scenario.name, index: i, ...state })
      }
    }
    // Restart is a genuine scene transition, not an entity-state injection.
    await page.evaluate(() => window.__DW__!.startGame('guanyu', 43))
    await expect.poll(() => page.evaluate(() => {
      const g = window.__DW_GAME__?.scene.getScene('game') as unknown as LiveGame
      return g?.sim?.seed
    })).toBe(43)
    const reset = await page.evaluate(() => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      return g.sprites.get(g.sim.playerId)!.frame.name === '__BASE' ? g.sprites.get(g.sim.playerId)!.texture.key : g.sprites.get(g.sim.playerId)!.frame.name
    })
    expect(reset).toBe('entity:guanyu:motion:walk:0')
    writeFileSync(`${OUT}/${renderer}-trace.json`, `${JSON.stringify(traces, null, 2)}\n`)
    expect(errors).toEqual([])
    const video = page.video(); await page.close(); if (video) await video.saveAs(`${OUT}/${renderer}-boundaries.webm`)
  })
}
