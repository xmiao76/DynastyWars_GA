import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import type { Sim } from '../src/core/sim'

// Final real-input choreography. Only initial actor/stage isolation is injected;
// every subsequent action/transition is produced by the ordinary sim inputs.
test.skip(process.env.GUANYU_ACTIONS !== '1', 'set GUANYU_ACTIONS=1')
test.use({ video: 'on' })
const OUT = 'artifacts/wholeframe/actions/mixed'
interface LiveGame { sim: Sim; syncSprites(): void; sprites: Map<number, { texture: { key: string }; y: number; x: number }> }

for (const renderer of ['canvas', 'webgl'] as const) {
  test(`Guan Yu mixed real-input motion: ${renderer}`, async ({ page }) => {
    test.setTimeout(150_000); mkdirSync(OUT, { recursive: true }); mkdirSync(`${OUT}/frames`, { recursive: true })
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(String(e)))
    await page.setViewportSize({ width: 960, height: 540 })
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
      const p = g.sim.entities[0]!; p.x = 180; p.y = 216; p.invulnerableTicks = 0
      g.syncSprites()
    })
    const frames = await page.evaluate(async () => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
      const out = []; let target = g.sim.tick; const began = performance.now()
      const snapshots = new Set([0, 8, 12, 16, 20, 22, 25, 30, 33, 36, 39, 45, 50, 54, 60, 65, 70, 75, 82, 88, 95, 110, 114, 118, 122, 128, 136, 140, 144, 145, 148, 150, 154, 157, 160, 164, 167, 170, 174, 178, 182, 188, 194, 202, 210, 220, 230, 239])
      for (let i = 0; i < 240; i++) {
        const input = { up: false, down: false, left: false, right: false, attackPressed: false, jumpPressed: false, specialPressed: false }
        // Rightward walk into jump; kick at apex; keep moving through landing.
        if (i >= 5 && i < 45) input.right = true
        if (i === 20) input.jumpPressed = true
        if (i === 27) input.attackPressed = true
        // Full combo then special from the settled guard.
        if (i === 52 || i === 58 || i === 71) input.attackPressed = true
        if (i === 110) input.specialPressed = true
        // Mirrored walk into a late aerial kick and immediate ground combo.
        if (i >= 132 && i < 178) input.left = true
        if (i === 145) input.jumpPressed = true
        if (i === 159) input.attackPressed = true
        if (i === 170 || i === 176 || i === 189) input.attackPressed = true
        if (i === 220) input.specialPressed = true
        target += 2
        window.__DW__!.run([input, { ...input, jumpPressed: false, attackPressed: false, specialPressed: false }])
        while (g.sim.tick < target) await new Promise<void>((r) => requestAnimationFrame(() => r()))
        await new Promise<void>((r) => requestAnimationFrame(() => r()))
        const sprite = g.sprites.get(p.id)!
        out.push({ i, tick: g.sim.tick, elapsedMs: Math.round(performance.now() - began), state: p.state, stateTick: p.stateTick,
          airTicks: p.airTicks, z: p.z, facing: p.facing, attackId: p.attackId, x: p.x, scrollX: g.sim.scrollX, y: sprite.y, key: sprite.texture.key,
          image: rendererIsCanvas() && snapshots.has(i) ? window.__DW_GAME__!.canvas.toDataURL('image/png') : null })
        await new Promise<void>((r) => setTimeout(r, Math.max(0, (i + 1) * 1000 / 30 - (performance.now() - began))))
      }
      function rendererIsCanvas(): boolean { return window.__DW_GAME__!.renderer.type === 1 }
      return out
    })
    expect(frames.every((f) => f.key.startsWith('entity:guanyu:motion:'))).toBe(true)
    expect(new Set(frames.map((f) => f.attackId))).toEqual(new Set([null, 'gy.jumpkick', 'gy.jab1', 'gy.jab2', 'gy.finisher', 'gy.special']))
    expect(new Set(frames.map((f) => f.facing))).toEqual(new Set(['right', 'left']))
    const transitions = frames.flatMap((f, i) => i && f.state !== frames[i - 1]!.state ? [{ from: frames[i - 1]!.state, to: f.state, i, frame: f.key }] : [])
    writeFileSync(`${OUT}/${renderer}-sampled-transitions.json`, `${JSON.stringify(transitions, null, 2)}\n`)
    expect(transitions.some((t) => t.from === 'walk' && t.to === 'jump')).toBe(true)
    expect(transitions.some((t) => t.from === 'jumpattack' && (t.to === 'idle' || t.to === 'walk'))).toBe(true) // two-tick capture may skip the one-tick idle at contact
    expect(frames.some((f) => f.key.endsWith(':jump:7'))).toBe(true)
    for (const f of frames.filter((f) => f.attackId === 'gy.jumpkick')) {
      if (f.stateTick >= 4 && f.stateTick < 24) expect(f.key).toBe('entity:guanyu:motion:jump:4')
    }
    const trace = frames.map(({ image, ...f }) => {
      if (image) writeFileSync(`${OUT}/frames/${String(f.i).padStart(3, '0')}.png`, Buffer.from(image.split(',')[1]!, 'base64'))
      return f
    })
    writeFileSync(`${OUT}/${renderer}-trace.json`, `${JSON.stringify({ frames: trace, transitions }, null, 2)}\n`)
    expect(errors).toEqual([])
    const video = page.video(); await page.close(); if (video) await video.saveAs(`${OUT}/${renderer}-choreography.webm`)
  })
}
