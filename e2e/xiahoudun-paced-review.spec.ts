import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { ENEMIES } from '../src/core/enemies'
import { makeCombatant } from '../src/core/entities'
import type { Sim } from '../src/core/sim'

type Live = { sim: Sim; paused: boolean; syncSprites(): void; sprites: Map<number, { frame: { name: string }; texture: { key: string }; x: number; y: number; displayOriginX: number; displayOriginY: number; scaleX: number; scaleY: number }>; cameras: { main: { zoom: number; scrollX: number; scrollY: number } } }
for (const renderer of ['canvas', 'webgl'] as const) for (const facing of ['right', 'left'] as const) {
  test(`native real-clock Xiahou ${renderer}/${facing}`, async ({ page }, info) => {
    test.setTimeout(60000)
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(String(e)))
    await page.setViewportSize({ width: 960, height: 540 })
    await page.goto(`/?renderer=${renderer}&motion=1`)
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
    await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage2'))
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
    await page.keyboard.press('Enter')
    const boss = makeCombatant(901101, 'xiahoudun', 'enemy', 230, 232, ENEMIES.xiahoudun!.maxHp, ENEMIES.xiahoudun!.speed, facing)
    const result = await page.evaluate(async ({ boss, facing }) => {
      const game = window.__DW_GAME__!, g = game.scene.getScene('game') as unknown as Live
      const path = '/src/game/adapters/motion-art.ts'
      const { motionRuntime } = await import(/* @vite-ignore */ path) as typeof import('../src/game/adapters/motion-art')
      await motionRuntime().settle()
      g.paused = true; g.sim.cameraLocked = true
      const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
      const direction = facing === 'right' ? 1 : -1
      const hud = game.scene.getScene('hud'); hud.scene.pause(); hud.children.list.forEach((o) => { (o as unknown as { visible: boolean }).visible = false })
      const stream = game.canvas.captureStream(60)
      const mime = 'video/webm;codecs=vp8'
      if (!MediaRecorder.isTypeSupported(mime)) throw new Error('Native VP8 recorder unavailable')
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8000000 })
      const chunks: Blob[] = []; recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
      const ended = new Promise<void>((resolve) => { recorder.onstop = () => resolve() })
      const rows: Array<{ videoMs: number; segmentMs: number; segment: string; tick: number; key: string; texture: string; x: number; y: number; state: string; stateTick: number; scaleX: number; scaleY: number; box: { x: number; y: number } }> = []
      const segments: Array<{ name: string; startMs: number; endMs: number; wallMs: number; simDelta: number; ratio: number; fixture: string }> = []
      const began = performance.now(); recorder.start(100)
      // Bounded method correction: warm the native recorder and real renderer
      // on an isolated default-AI actor before the measured fixture segments.
      Object.assign(p, { x: 100, y: 232, state: 'idle', invulnerableTicks: 999999 })
      g.sim.entities = [p, boss]; g.syncSprites(); g.paused = false
      await new Promise<void>((resolve) => { const warmStart = performance.now(); const warm = () => { if (performance.now() - warmStart >= 2500) resolve(); else requestAnimationFrame(warm) }; requestAnimationFrame(warm) })
      for (const name of ['walk', 'heavy', 'held-release', 'real-AI']) {
        g.paused = true; g.sim.entities = [p]; g.syncSprites()
        Object.assign(p, { x: 230 + 150 * direction, y: 232, z: 0, state: 'idle', stateTick: 0, attackId: null, hp: p.maxHp, invulnerableTicks: 999999, vx: 0, facing })
        Object.assign(boss, { x: 230, y: 232, z: 0, vx: 0, hp: boss.maxHp, state: 'walk', stateTick: 0, attackId: null, grabbedBy: null, thinkTick: name === 'real-AI' ? 0 : 999999, facing, enraged: false })
        if (name === 'heavy') Object.assign(boss, { state: 'attack', attackId: 'sword.heavy' })
        if (name === 'held-release') { Object.assign(p, { x: 230 - 16 * direction, state: 'grab', stateTick: 0 }); Object.assign(boss, { state: 'grabbed', grabbedBy: p.id }) }
        g.sim.entities.push(boss); g.sim.freezeTicks = 0; g.syncSprites()
        const start = performance.now(), firstTick = g.sim.tick; let released = false
        const duration = name === 'real-AI' ? 2200 : name === 'held-release' ? 650 : 1000
        g.paused = false
        await new Promise<void>((resolve) => {
          const sample = () => {
            const now = performance.now(), segmentMs = now - start
            // One disclosed holder-hit-style state fixture releases the victim;
            // stepGrab performs the actual victim release on the next normal tick.
            if (name === 'held-release' && segmentMs >= 250 && !released) { p.state = 'hitstun'; p.stateTick = 0; released = true }
            const s = g.sprites.get(boss.id)!, c = g.cameras.main
            rows.push({ videoMs: now - began, segmentMs, segment: name, tick: g.sim.tick, key: s.frame.name.replace('entity:xiahoudun:motion:', ''), texture: s.texture.key, x: boss.x, y: boss.y, state: boss.state, stateTick: boss.stateTick, scaleX: s.scaleX, scaleY: s.scaleY, box: { x: (s.x - c.scrollX - s.displayOriginX * s.scaleX) * c.zoom, y: (s.y - c.scrollY - s.displayOriginY * s.scaleY) * c.zoom } })
            if (segmentMs >= duration) resolve(); else requestAnimationFrame(sample)
          }; requestAnimationFrame(sample)
        })
        const end = performance.now(), wallMs = end - start, simDelta = g.sim.tick - firstTick
        segments.push({ name, startMs: start - began, endMs: end - began, wallMs, simDelta, ratio: simDelta / 60 / (wallMs / 1000), fixture: name === 'walk' ? 'Initial walking state + thinkTick999999: real core 1.2u/tick approach, normal clock; decision cadence intentionally suppressed for one gait cycle' : name === 'heavy' ? 'Injected attack entry at tick0; unmodified core attack progression and ensuing default decisions' : name === 'held-release' ? 'Injected real holder/victim relation; one holder hitstun state fixture at250ms; core releases victim, no victim clock/frame forcing' : 'Fresh default boss decision fields; initial positions and invulnerable player only' })
      }
      g.paused = true; recorder.stop(); await ended; stream.getTracks().forEach((track) => track.stop())
      const blob = new Blob(chunks, { type: mime })
      const base64 = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve((reader.result as string).split(',')[1]!); reader.readAsDataURL(blob) })
      return { base64, rows, segments, geometry: { width: game.canvas.width, height: game.canvas.height, renderer: game.renderer.type }, budget: motionRuntime().budget(), method: 'Native canvas.captureStream60 / Chromium VP8 MediaRecorder, no stepping/autopilot/manual frame selection, no source-art rescale. HUD hidden fixture; segment setups paused. Wall-relative recorder start labels approximate codec timestamps.' }
    }, { boss, facing })
    const { base64, ...trace } = result
    const video = Buffer.from(base64, 'base64')
    const videoPath = info.outputPath('paced-native.webm'), tracePath = info.outputPath('paced-trace.json')
    if (existsSync(videoPath) || existsSync(tracePath)) throw new Error('Refuse existing evidence')
    mkdirSync(info.outputDir, { recursive: true }); writeFileSync(videoPath, video, { flag: 'wx' }); writeFileSync(tracePath, `${JSON.stringify({ ...trace, sourceSha256: createHash('sha256').update(video).digest('hex'), renderer, facing, errors }, null, 2)}\n`, { flag: 'wx' })
    console.log('PACED_NATIVE', JSON.stringify({ renderer, facing, videoPath, tracePath, segments: result.segments }))
    expect(result.rows.every((r) => r.texture === 'motion-source:xiahoudun')).toBe(true)
    expect(result.segments.every((s) => s.simDelta > 0)).toBe(true)
    expect(result.rows.some((r) => r.segment === 'heavy' && r.key.startsWith('heavy:'))).toBe(true)
    expect(result.rows.some((r) => r.segment === 'held-release' && r.key === 'misc:4')).toBe(true)
    expect(result.rows.some((r) => r.segment === 'held-release' && r.key.startsWith('walk:'))).toBe(true)
    expect(result.budget.sourceBytes).toBe(12372346); expect(result.budget.sourceBytes).toBeLessThanOrEqual(result.budget.caps.stageDownloads)
    expect(errors).toEqual([])
  })
}
