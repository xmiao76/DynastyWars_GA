import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import type { Entity } from '../src/core/types'
import type { Sim } from '../src/core/sim'

test.skip(process.env.GUANYU_ACTIONS !== '1', 'set GUANYU_ACTIONS=1 for action review')
test.describe.configure({ mode: 'serial' })
test.use({ video: 'on' })
const OUT = 'artifacts/wholeframe/actions'
interface LiveGame { sim: Sim; syncSprites(): void; motionErrorState(): { kind: string; failure: string; attempts: number; final: boolean } | null; sprites: Map<number, { texture: { key: string }; frame: { name: string }; y: number; displayHeight: number; alpha: number; visible: boolean }> }

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
      for (const action of ['jump', 'jumpkick', 'hurt', 'knockdown', 'special', 'grab', 'airfall', 'ko'] as const) {
        await page.evaluate((name) => {
          const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
          const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
          p.state = 'idle'; p.stateTick = 0; p.airTicks = 0; p.z = 0; p.attackId = null; p.invulnerableTicks = 0; p.hp = p.maxHp
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
          g.syncSprites()
        }, action)
        const frameCount = action === 'knockdown' || action === 'airfall' ? 40 : 26
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

test('missing additional action atlas halts Guan Yu entry on the reload error, no legacy hero', async ({ page }) => {
  test.setTimeout(120_000)
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(String(e)))
  let actionFetches = 0
  page.on('request', (r) => { if (r.resourceType() === 'fetch' && r.url().includes('guanyu-actions-sheet.png')) actionFetches++ })
  await page.route('**/assets/motion/guanyu-actions-sheet.png*', (r) => new URL(r.request().url()).searchParams.has('import') ? r.continue() : r.abort())
  await page.goto('/?motion=1&renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 15_000 }).toBe('title')
  expect(await page.evaluate(() => Object.keys(window.__DW_GAME__?.scene.getScene('boot').registry.get('paintedHeroArt')?.motions ?? {}))).toEqual([])
  // Sole-motion: one missing Guan Yu page rejects both packs whole. Entry
  // halts on the reload overlay (one retry, then final) instead of starting
  // the sim on legacy/partial art; siblings still publish.
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage1'))
  await expect.poll(() => page.evaluate(() => (window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame).motionErrorState()), { timeout: 30_000 }).toEqual({ kind: 'guanyu', failure: 'missing', attempts: 2, final: true })
  expect(await page.evaluate(() => window.__DW__!.getSnapshot().sim), 'no sim ever builds on a failed required kind').toBeNull()
  expect(actionFetches, 'initial attempt + exactly one retry, no third').toBe(2)
  const halted = await page.evaluate(() => {
    const scene = window.__DW_GAME__!.scene.getScene('game')
    const game = scene as unknown as LiveGame
    const objects = scene.children.list as unknown as Array<{ name: string; visible: boolean; text?: string; input?: { enabled: boolean } }>
    return {
      ui: objects.filter((o) => o.name.startsWith('motionError')).map((o) => ({ name: o.name, visible: o.visible, text: o.text, interactive: o.input?.enabled })),
      sprites: [...game.sprites.values()].filter((s) => s.visible).map((s) => s.frame.name === '__BASE' ? s.texture.key : s.frame.name),
      motions: Object.keys(scene.registry.get('paintedHeroArt')?.motions ?? {}),
      guanyuTexture: window.__DW_GAME__!.textures.exists('motion-source:guanyu'),
    }
  })
  expect(halted.ui.find((o) => o.name === 'motionErrorTitle')).toMatchObject({ visible: true, text: 'MOTION ART FAILED TO LOAD' })
  expect(halted.ui.find((o) => o.name === 'motionErrorDetail')?.text).toContain('guanyu: missing (after one retry)')
  expect(halted.ui.find((o) => o.name === 'motionErrorReload')).toMatchObject({ visible: true, text: '[ RELOAD ]', interactive: true })
  expect(halted.sprites, 'no legacy (or any) hero rendered while halted').toEqual([])
  expect(halted.motions).not.toContain('guanyu')
  expect(halted.guanyuTexture, 'no guanyu texture is ever published').toBe(false)
  await expect.poll(async () => Object.keys(await page.evaluate(() => window.__DW_GAME__!.scene.getScene('game').registry.get('paintedHeroArt')?.motions ?? {})).sort(), { timeout: 30_000 }).toEqual(expect.arrayContaining(['soldier', 'zhangfei']))
  expect((await page.evaluate(() => Object.keys(window.__DW_GAME__!.scene.getScene('game').registry.get('paintedHeroArt')?.motions ?? {})))).not.toContain('guanyu')
  expect(errors).toEqual([])
})
