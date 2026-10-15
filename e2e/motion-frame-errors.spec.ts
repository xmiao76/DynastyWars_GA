import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type Phaser from 'phaser'
import type { Sim } from '../src/core/sim'
import type { MotionArt } from '../src/game/art/motion-clips'
import type { MotionFailureState } from '../src/game/adapters/motion-art'

const OUT = 'artifacts/motion/legacy-cutover/browser'
type Live = { sim: Sim; built: boolean; sprites: Map<number, Phaser.GameObjects.Sprite>; motionErrorState(): MotionFailureState | null }

async function inspect(page: Page) {
  return page.evaluate(() => {
    const scene = window.__DW_GAME__!.scene.getScene('game'), g = scene as unknown as Live
    return {
      tick: g.sim.tick, error: g.motionErrorState(),
      sprites: [...g.sprites].map(([id, s]) => ({ id, kind: g.sim.entities.find((e) => e.id === id)?.kind, frame: s.frame.name, texture: s.texture.key, visible: s.visible })),
      legacy: window.__DW_GAME__!.textures.getTextureKeys().filter((k) => k === 'entity:guanyu' || (k.startsWith('entity:guanyu:') && !k.includes(':motion:'))),
      ui: scene.children.list.filter((o) => o.name.startsWith('motionError')).map((o) => ({ name: o.name, visible: (o as Phaser.GameObjects.Text).visible, text: (o as Phaser.GameObjects.Text).text })),
    }
  })
}

for (const damage of ['texture-frame', 'manifest-frame', 'uncatalogued'] as const) {
  test(`default published Guan Yu ${damage} blocks instead of legacy substitution`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto('/?renderer=canvas&autopilot=1')
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage1'))
    await expect.poll(() => page.evaluate(() => (window.__DW_GAME__!.scene.getScene('game') as unknown as Live).built)).toBe(true)
    await page.evaluate(async () => {
      const path = '/src/game/adapters/motion-art.ts'
      const { motionRuntime } = await import(/* @vite-ignore */ path) as typeof import('../src/game/adapters/motion-art')
      await motionRuntime().settle()
    })
    const before = await inspect(page)
    expect(before.error).toBeNull()
    expect(before.sprites.find((s) => s.kind === 'guanyu')?.frame).toBe('entity:guanyu:motion:walk:0')
    expect(before.legacy).toEqual([])
    const fixture = await page.evaluate(async (damage) => {
      const path = '/src/game/adapters/motion-art.ts'
      const { MOTION_PACKS } = await import(/* @vite-ignore */ path) as typeof import('../src/game/adapters/motion-art')
      const engine = window.__DW_GAME__!, scene = engine.scene.getScene('game'), g = scene as unknown as Live
      const motions = engine.registry.get('paintedHeroArt').motions as Record<string, MotionArt>
      const hero = g.sim.entities.find((e) => e.kind === 'guanyu')!, sprite = g.sprites.get(hero.id)!
      const sibling = motions.soldier!, siblingTexture = engine.textures.get('motion-source:soldier')
      // Isolated browser-only damage AFTER successful validation/publication.
      // The next normal GameScene.update invokes syncSprites; no private render call.
      const selected = { texture: sprite.texture.key, frame: sprite.frame.name }
      if (damage === 'texture-frame') engine.textures.get(selected.texture).remove(selected.frame)
      else if (damage === 'manifest-frame') delete motions.guanyu!.frames['walk:0']
      else { delete MOTION_PACKS.guanyu; delete motions.guanyu }
      ;(window as unknown as { frameSibling: unknown }).frameSibling = { sibling, siblingTexture }
      return selected
    }, damage)
    await expect.poll(async () => (await inspect(page)).error?.kind).toBe('guanyu')
    const failed = await inspect(page)
    await page.evaluate(() => window.__DW__!.step(600))
    await page.evaluate(async () => { for (let i = 0; i < 30; i++) await new Promise<void>((r) => requestAnimationFrame(() => r())) })
    const after = await inspect(page)
    const siblingUnchanged = await page.evaluate(() => {
      const engine = window.__DW_GAME__!
      const saved = (window as unknown as { frameSibling: { sibling: unknown; siblingTexture: unknown } }).frameSibling
      return engine.registry.get('paintedHeroArt').motions.soldier === saved.sibling && engine.textures.get('motion-source:soldier') === saved.siblingTexture
    })
    mkdirSync(OUT, { recursive: true })
    writeFileSync(`${OUT}/${damage}.json`, JSON.stringify({ before, fixture, failed, after, siblingUnchanged, errors }, null, 2))
    await page.screenshot({ path: `${OUT}/${damage}.png` })
    expect(after.tick).toBe(failed.tick)
    expect(after.tick).toBe(before.tick)
    expect(after.error).toMatchObject({ kind: 'guanyu', failure: damage === 'uncatalogued' ? 'unsupported' : 'corrupt', attempts: 0, final: true })
    expect(after.error?.detail).toContain(damage === 'texture-frame' ? `missing texture frame ${fixture.frame}` : damage === 'manifest-frame' ? 'missing manifest frame walk:0' : 'no motion pack catalog entry')
    expect(after.ui.find((o) => o.name === 'motionErrorTitle')).toMatchObject({ visible: true, text: 'MOTION ART FAILED TO LOAD' })
    expect(after.ui.find((o) => o.name === 'motionErrorDetail')?.text).toContain('no pack retry attempted')
    expect(after.ui.find((o) => o.name === 'motionErrorDetail')?.text).not.toContain('after one retry')
    expect(after.sprites.filter((s) => s.kind === 'guanyu')).toEqual([])
    expect(after.legacy).toEqual([])
    expect(siblingUnchanged).toBe(true)
    expect(after.sprites.filter((s) => s.kind === 'soldier')).toEqual(before.sprites.filter((s) => s.kind === 'soldier'))
    expect(errors).toEqual([])
  })
}

for (const query of ['', '&motion=0']) test(`sole motion${query || ' default'}: visible Guan Yu and shared props`, async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(String(error)))
  await page.goto(`/?renderer=canvas&autopilot=1${query}`)
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage1'))
  await expect.poll(() => page.evaluate(() => (window.__DW_GAME__!.scene.getScene('game') as unknown as Live).built)).toBe(true)
  const state = await inspect(page)
  expect(state.error).toBeNull()
  expect(state.sprites.find((s) => s.kind === 'guanyu')).toMatchObject({ frame: 'entity:guanyu:motion:walk:0', visible: true })
  expect(state.sprites.some((s) => s.kind === 'crate' && s.texture === 'entity:crate' && s.visible)).toBe(true)
  await page.evaluate(() => window.__DW__!.step(1))
  await expect.poll(() => page.evaluate(() => window.__DW__!.getSnapshot().tick)).toBe(1)
  mkdirSync(OUT, { recursive: true })
  expect(errors).toEqual([])
  const label = query ? 'zero-query' : 'default'
  writeFileSync(`${OUT}/${label}.json`, JSON.stringify(await inspect(page), null, 2))
  await page.screenshot({ path: `${OUT}/${label}.png` })
})
