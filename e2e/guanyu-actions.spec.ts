import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { Entity } from '../src/core/types'
import type { Sim } from '../src/core/sim'
import { neutralInput, type InputState } from '../src/core/types'

test.skip(process.env.GUANYU_ACTIONS !== '1', 'set GUANYU_ACTIONS=1 for action review')
test.describe.configure({ mode: 'serial' })
test.use({ video: 'on' })
const OUT = 'artifacts/wholeframe/actions'
interface LiveGame { sim: Sim; syncSprites(): void; sprites: Map<number, { texture: { key: string }; frame: { name: string }; y: number; displayHeight: number; alpha: number }> }
async function ticks(page: Page, inputs: InputState[]): Promise<void> {
  const before = await page.evaluate(() => window.__DW__!.getSnapshot().tick)
  await page.evaluate((i) => window.__DW__!.run(i), inputs)
  await expect.poll(() => page.evaluate(() => window.__DW__!.getSnapshot().tick)).toBeGreaterThanOrEqual(before + inputs.length)
}
for (const renderer of ['canvas', 'webgl'] as const) {
  test(`Guan Yu all normal actions and boundaries: ${renderer}`, async ({ page }) => {
    test.setTimeout(240_000); mkdirSync(OUT, { recursive: true }); mkdirSync(`${OUT}/frames`, { recursive: true })
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(String(e)))
    await page.setViewportSize({ width: 960, height: 540 })
    await page.goto(`/?renderer=${renderer}&autopilot=1&motion=1`)
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage1'))
    await expect.poll(() => page.evaluate(() => window.__DW__!.getSnapshot().scene)).toBe('game')
    const introUp = (): Promise<boolean> => page.evaluate(() => !!window.__DW_GAME__?.scene.getScene('hud').children.list.some((o) => o.name === 'introCard'))
    await expect.poll(introUp).toBe(true); await page.keyboard.press('Enter'); await expect.poll(introUp).toBe(false)
    await page.evaluate(() => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      g.sim.entities = g.sim.entities.filter((e) => e.id === g.sim.playerId)
      g.sim.cameraLocked = false; g.sim.waveIndex = 0
      const p = g.sim.entities[0]!; p.x = 230; p.y = 216; p.invulnerableTicks = 0
      g.syncSprites()
    })
    const records: unknown[] = []
    // Real input for jump/kick/special; controlled test-only state injection for
    // taking damage/getup so coverage does not depend on random enemy timing.
    for (const facing of ['right', 'left'] as const) {
      await page.evaluate((f) => {
        const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
        const p = g.sim.entities[0]!; p.facing = f; p.x = 230
      }, facing)
      for (const action of ['jump', 'jumpkick', 'hurt', 'knockdown', 'special', 'grab', 'mounted', 'dismount', 'airfall', 'ko'] as const) {
        await page.evaluate((name) => {
          const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
          const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
          p.state = 'idle'; p.stateTick = 0; p.airTicks = 0; p.z = 0; p.attackId = null; p.mountedOn = null; p.invulnerableTicks = 0; p.hp = p.maxHp
          g.sim.entities = [p]
          g.sim.player2Id = null; g.sim.char2Id = null; g.sim.phase = 'fight'
          if (name === 'hurt') p.state = 'hitstun'
          if (name === 'knockdown') p.state = 'knockdown'
          if (name === 'airfall' || name === 'ko') {
            p.state = 'jump'; p.stateTick = 18; p.airTicks = 18; p.z = 48
            g.syncSprites()
            p.state = name === 'ko' ? 'dying' : 'knockdown'; p.stateTick = 0; p.z = 0
            if (name === 'ko') {
              p.hp = 0
              const second = { ...structuredClone(p), id: 92, kind: 'zhaoyun', state: 'idle', hp: 100, x: 230, y: 181 } as Entity
              g.sim.entities.push(second); g.sim.player2Id = 92; g.sim.char2Id = 'zhaoyun'
            }
          }
          if (name === 'grab') {
            const enemy = { ...structuredClone(p), id: 90, kind: 'soldier', side: 'enemy', x: p.x + (p.facing === 'right' ? 16 : -16), grabbedBy: p.id, state: 'grabbed' } as Entity
            g.sim.entities.push(enemy); p.state = 'grab'
          }
          if (name === 'mounted' || name === 'dismount') {
            const horse = { ...structuredClone(p), id: 91, kind: 'horse', side: 'neutral', state: 'idle' } as Entity
            g.sim.entities.push(horse); p.mountedOn = horse.id
          }
          g.syncSprites()
        }, action)
        const frameCount = action === 'knockdown' || action === 'airfall' ? 40 : action === 'mounted' ? 28 : 26
        const trace = await page.evaluate(async ({ action, frameCount }) => {
          const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
          const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
          const out = []; const began = performance.now(); let next = g.sim.tick
          for (let i = 0; i < frameCount; i++) {
            const input = { up: false, down: false, left: false, right: false, attackPressed: false, jumpPressed: false, specialPressed: false }
            if ((action === 'jump' || action === 'jumpkick') && i === 0) input.jumpPressed = true
            if (action === 'jumpkick' && i === 4) input.attackPressed = true
            if (action === 'special' && i === 0) input.specialPressed = true
            if (action === 'grab' && i === 8) input.attackPressed = true
            if (action === 'mounted' && i < 8) input[p.facing] = true
            if (action === 'mounted' && i === 9) input.attackPressed = true
            if (action === 'dismount' && i === 4) { p.mountedOn = null; g.sim.entities = [p] }
            next += 2
            window.__DW__!.run([input, { ...input, jumpPressed: false, attackPressed: false, specialPressed: false }])
            while (g.sim.tick < next) await new Promise<void>((r) => requestAnimationFrame(() => r()))
            await new Promise<void>((r) => requestAnimationFrame(() => r()))
            const s = g.sprites.get(p.id)!
            out.push({ action, facing: p.facing, state: p.state, stateTick: p.stateTick, airTicks: p.airTicks, tick: g.sim.tick, key: s.frame.name === '__BASE' ? s.texture.key : s.frame.name, z: p.z, spriteY: s.y, elapsedMs: Math.round(performance.now() - began),
              image: window.__DW_GAME__!.renderer.type === 1 && p.facing === 'right' && [0, 2, 4, 6, 9, 12, 15, 18, 21, 26, 30, 34, 38].includes(i) ? window.__DW_GAME__!.canvas.toDataURL('image/png') : null })
            await new Promise<void>((r) => setTimeout(r, Math.max(0, (i + 1) * 1000 / 30 - (performance.now() - began))))
          }
          return out
        }, { action, frameCount })
        expect(trace.every((r) => r.key.startsWith('entity:guanyu:motion:')), `${facing}:${action} old art leaked`).toBe(true)
        for (const [index, r] of trace.entries()) {
          if (r.image) writeFileSync(`${OUT}/frames/${facing}-${action}-${String(index).padStart(2, '0')}.png`, Buffer.from(r.image.split(',')[1]!, 'base64'))
          const { image: _image, ...entry } = r
          void _image
          records.push(entry)
        }
        await page.screenshot({ path: `${OUT}/${renderer}-${facing}-${action}.png` })
      }
    }
    // Stress states include KO held/flying/fleeing; core never normally places
    // player in some of these, but rendering still must remain complete.
    const stress = await page.evaluate(() => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
      p.mountedOn = null
      const out = []
      for (const state of ['grabbed', 'thrown', 'fleeing', 'dying', 'dead'] as const) for (const stateTick of [0, 4, 8, 14, 23, 35]) {
        p.state = state; p.stateTick = stateTick; g.sim.tick++; g.syncSprites()
        out.push({ state, stateTick, key: g.sprites.get(p.id)!.frame.name === '__BASE' ? g.sprites.get(p.id)!.texture.key : g.sprites.get(p.id)!.frame.name, alpha: g.sprites.get(p.id)!.alpha })
      }
      return out
    })
    expect(stress.every((r) => r.key.includes(':motion:'))).toBe(true)
    expect(stress.filter((r) => r.state === 'dead').every((r) => r.alpha === 0)).toBe(true)
    writeFileSync(`${OUT}/${renderer}-all-actions.json`, `${JSON.stringify({ records, stress }, null, 2)}\n`)
    expect(errors).toEqual([])
    const video = page.video(); await page.close(); if (video) await video.saveAs(`${OUT}/${renderer}-all-actions.webm`)
  })
}

test('missing additional action atlas rejects both packs rather than mixing models', async ({ page }) => {
  await page.route('**/assets/motion/guanyu-actions-sheet.png*', (r) => new URL(r.request().url()).searchParams.has('import') ? r.continue() : r.abort())
  await page.goto('/?motion=1&renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  expect(await page.evaluate(() => Object.keys(window.__DW_GAME__?.scene.getScene('boot').registry.get('paintedHeroArt')?.motions ?? {}))).toEqual([])
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__!.getSnapshot().scene)).toBe('game')
  // Whole-fighter rejection: one missing page means guanyu publishes
  // NOTHING, and the hero renders legacy art rather than a mixed/partial
  // model - while catalogued siblings still publish (archer deferred by
  // the cap as usual).
  await expect.poll(async () => Object.keys(await page.evaluate(() => window.__DW_GAME__!.scene.getScene('game').registry.get('paintedHeroArt')?.motions ?? {})).sort(), { timeout: 15_000 }).toEqual(['soldier', 'spearman', 'zhangfei'])
  const legacyKey = await page.evaluate(() => {
    const game = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
    game.syncSprites()
    return game.sprites.get(game.sim.playerId)!.texture.key
  })
  expect(legacyKey.includes(':motion:')).toBe(false)
  await ticks(page, [neutralInput()])
})
