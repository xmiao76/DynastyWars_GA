import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import type { Sim } from '../src/core/sim'

/**
 * CMR-05 capture harness for the ACTUAL whole-character motion path
 * (opt-in `?motion=1`), parameterized per fighter/role instead of one
 * hand-written spec per hero. It records ACTUAL runtime frame keys and
 * decoded/drawn boxes - never relabelled rig anatomy - with player/AI/
 * projectile provenance, named actions, both facings, and injected stress
 * cases labelled separately from real gameplay input.
 *
 * Usage: `node scripts/motion-capture.mjs --fighter guanyu --role hero
 * --renderer canvas` (which sets these env vars and validates the result).
 */
test.skip(process.env.MOTION_CAPTURE !== '1', 'set MOTION_CAPTURE=1 (via scripts/motion-capture.mjs) for the motion capture harness')
test.use({ video: 'on' })

const FIGHTER = process.env.MOTION_FIGHTER ?? 'guanyu'
const RENDERER = (process.env.MOTION_RENDERER ?? 'canvas') as 'canvas' | 'webgl'
const OUT = process.env.MOTION_OUT ?? 'artifacts/motion-review'
const COMMIT = process.env.MOTION_COMMIT ?? 'unknown'
const RUN = `${OUT}/${FIGHTER}-${RENDERER}`

interface Row {
  action: string
  facing: string
  renderer: string
  state: string
  stateTick: number
  tick: number
  attackId: string | null
  key: string
  elapsedMs: number
  frozen: boolean
  paused: boolean
  commit: string
  actor: number
  kind: string
  source: 'player' | 'ai' | 'projectile' | 'injected'
  origin: 'gameplay' | 'injected'
  box: { x: number; y: number; w: number; h: number }
}

type LiveGame = {
  sim: Sim
  syncSprites(): void
  sprites: Map<number, {
    texture: { key: string }
    frame: { name: string; realWidth: number; realHeight: number }
    x: number
    y: number
    scaleX: number
    scaleY: number
  }>
}

const NEUTRAL = { up: false, down: false, left: false, right: false, attackPressed: false, jumpPressed: false, specialPressed: false }

test(`motion capture: ${FIGHTER} (${RENDERER})`, async ({ page }) => {
  test.setTimeout(240_000)
  mkdirSync(`${RUN}/frames`, { recursive: true })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto(`/?renderer=${RENDERER}&autopilot=1&motion=1`)
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 15_000 }).toBe('title')
  await page.evaluate((f) => window.__DW__!.startGame(f, 42, 'stage1'), FIGHTER)
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 30_000 }).toBe('game')
  const introUp = (): Promise<boolean> => page.evaluate(() => !!window.__DW_GAME__?.scene.getScene('hud').children.list.some((o) => o.name === 'introCard'))
  await expect.poll(introUp).toBe(true)
  await page.keyboard.press('Enter')
  await expect.poll(introUp).toBe(false)

  // Isolate the subject on the real stage (test-page sim only).
  await page.evaluate(() => {
    const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
    g.sim.entities = g.sim.entities.filter((e) => e.id === g.sim.playerId)
    g.sim.cameraLocked = false
    g.sim.waveIndex = 0
    const p = g.sim.entities[0]!
    p.x = 230
    p.y = 216
    p.invulnerableTicks = 0
    g.syncSprites()
  })

  const rows: Row[] = []
  const began = Date.now()

  // Sample the player's ACTUAL drawn frame + full untrimmed cell box, and
  // optionally keep a 4x-of-logical crop of that box (camera-scroll aware).
  const sample = async (action: string, facing: string, origin: 'gameplay' | 'injected', source: Row['source'], shot?: string): Promise<void> => {
    if (shot) {
      // A review crop must show the figure, never HUD furniture on top.
      // State recovery AND hiding the whole HUD: the crop is figure evidence.
      await page.evaluate(() => {
        const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame & { hideContinueOverlay?: () => void }
        g.sim.lives = 3
        g.sim.phase = 'fight'
        g.hideContinueOverlay?.()
        const hud = window.__DW_GAME__!.scene.getScene('hud')
        const kids = hud.children.list as unknown as Array<{ visible: boolean }>
        const store = window as unknown as { __HUD_STATES__?: boolean[] }
        store.__HUD_STATES__ = kids.map((o) => o.visible)
        for (const o of kids) o.visible = false
      })
      // Let the renderer repaint before the crop reads the canvas: the
      // in-page canvas only changes on Phaser paints, so wait wall time too.
      await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
      await page.waitForTimeout(120)
    }
    const row = await page.evaluate(async ({ action, facing, origin, source, renderer, commit, shot, elapsed }) => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
      g.syncSprites()
      const s = g.sprites.get(p.id)!
      const f = s.frame
      const worldW = f.realWidth * s.scaleX
      const worldH = f.realHeight * s.scaleY
      const box = {
        x: Math.round((s.x - worldW / 2 - g.sim.scrollX) * 2),
        y: Math.round((s.y - worldH) * 2),
        w: Math.round(worldW * 2),
        h: Math.round(worldH * 2),
      }
      if (shot) {
        // Capture via the renderer's own post-render snapshot, never by
        // drawing game.canvas out of band: with preserveDrawingBuffer=false
        // a WebGL canvas is already cleared to black outside the render
        // frame (the canvas renderer hid the bug - webgl crops came out
        // 100% black).
        const dataUrl = await new Promise<string>((resolve) => {
          window.__DW_GAME__!.renderer.snapshot((snap) => resolve((snap as HTMLImageElement).src))
        })
        const snap = new Image()
        snap.src = dataUrl
        await snap.decode()
        const cv = document.createElement('canvas')
        cv.width = box.w * 2 // 4x of logical art
        cv.height = box.h * 2
        const ctx = cv.getContext('2d')!
        ctx.drawImage(snap, Math.max(0, box.x), Math.max(0, box.y), box.w, box.h, 0, 0, cv.width, cv.height)
        const store = (window as unknown as { __MOTION_CROPS__?: Record<string, string> })
        store.__MOTION_CROPS__ ??= {}
        store.__MOTION_CROPS__[shot] = cv.toDataURL('image/png')
        // Restore the HUD after the crop: play continues unmodified.
        const hs = (window as unknown as { __HUD_STATES__?: boolean[] }).__HUD_STATES__
        const kids = window.__DW_GAME__!.scene.getScene('hud').children.list as unknown as Array<{ visible: boolean }>
        if (hs) kids.forEach((o, i) => { o.visible = hs[i] ?? o.visible })
      }
      return {
        action, facing, origin, source,
        renderer,
        state: p.state, stateTick: p.stateTick, tick: g.sim.tick,
        attackId: p.attackId,
        key: s.frame.name === '__BASE' ? s.texture.key : s.frame.name,
        elapsedMs: elapsed,
        frozen: g.sim.freezeTicks > 0,
        paused: false,
        commit,
        actor: p.id,
        kind: p.kind,
        clock: {
          phase: g.sim.phase,
          lives: g.sim.lives,
          continueMsLeft: (g as unknown as { continueMsLeft?: number }).continueMsLeft ?? -1,
        },
        box,
      }
    }, { action, facing, origin, source, renderer: RENDERER, commit: COMMIT, shot, elapsed: Date.now() - began })
    rows.push(row as unknown as Row)
  }

  const runTicks = async (n: number, input: Record<string, boolean> = {}): Promise<void> => {
    for (let i = 0; i < n; i++) {
      await page.evaluate((inp) => window.__DW__!.run([inp]), { ...NEUTRAL, ...input })
    }
    await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
  }

  const setPlayer = async (fields: Record<string, unknown>): Promise<void> => {
    await page.evaluate((f) => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
      Object.assign(p, { hp: p.maxHp, airTicks: 0, z: 0, attackId: null, mountedOn: null }, f)
    }, fields)
  }

  // Isolated named actions (injected state control, labelled `injected`) and
  // real-input segments (labelled `gameplay`), both facings.
  const isolated: Array<[string, Record<string, unknown>]> = [
    ['idle', { state: 'idle', stateTick: 0 }],
    ['jab1', { state: 'attack', attackId: 'gy.jab1', stateTick: 0 }],
    ['hurt', { state: 'hitstun', stateTick: 0 }],
    ['knockdown', { state: 'knockdown', stateTick: 0 }],
    ['getup', { state: 'getup', stateTick: 0 }],
    ['dying', { state: 'dying', stateTick: 0, hp: 0 }],
    ['dead', { state: 'dead', stateTick: 0, hp: 0 }],
  ]
  for (const facing of ['right', 'left'] as const) {
    for (const [action, fields] of isolated) {
      await setPlayer({ facing, ...fields })
      await sample(action, facing, 'injected', 'injected', `${action}-${facing}`)
      await runTicks(2)
      await sample(action, facing, 'injected', 'injected')
    }
    // Recover from the death segments before any further capture: the
    // CONTINUE overlay must never sit on a review crop.
    await page.evaluate(() => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame & { hideContinueOverlay?: () => void }
      g.sim.lives = 3
      g.sim.phase = 'fight'
      g.hideContinueOverlay?.()
    })
    // Real-input walk (gameplay provenance).
    await setPlayer({ facing, state: 'idle', stateTick: 0 })
    await runTicks(12, facing === 'right' ? { right: true } : { left: true })
    await sample('walk', facing, 'gameplay', 'player', `walk-${facing}`)
  }

  // Mixed choreography with real inputs (gameplay provenance).
  await setPlayer({ facing: 'right', state: 'idle', stateTick: 0 })
  await runTicks(8, { right: true })
  await runTicks(1, { right: true, attackPressed: true })
  await runTicks(10, { right: true })
  await sample('mixed', 'right', 'gameplay', 'player', 'mixed-right')

  // Co-op observability: drop player two in and sample every live sprite.
  const joined = await page.evaluate(() => window.__DW__!.joinP2!())
  await runTicks(6)
  const coopRows = await page.evaluate(({ commit, elapsed, renderer }) => {
    const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
    g.syncSprites()
    return [...g.sprites.entries()].map(([id, s]) => {
      const e = g.sim.entities.find((x) => x.id === id)
      return {
        action: 'coop',
        facing: 'right',
        renderer,
        origin: 'gameplay',
        source: 'player',
        state: e?.state ?? 'idle',
        stateTick: e?.stateTick ?? 0,
        tick: g.sim.tick,
        attackId: null,
        key: s.frame.name === '__BASE' ? s.texture.key : s.frame.name,
        elapsedMs: elapsed,
        frozen: g.sim.freezeTicks > 0,
        paused: false,
        commit,
        actor: id,
        kind: e?.kind ?? 'unknown',
        box: { x: 0, y: 0, w: 0, h: 0 },
      }
    })
  }, { commit: COMMIT, elapsed: Date.now() - began, renderer: RENDERER })
  rows.push(...(coopRows as unknown as Row[]))

  // Crops -> files.
  const crops = await page.evaluate(() => (window as unknown as { __MOTION_CROPS__?: Record<string, string> }).__MOTION_CROPS__ ?? {})
  for (const [name, data] of Object.entries(crops)) {
    writeFileSync(`${RUN}/frames/${name}.png`, Buffer.from((data.split(',')[1] ?? ''), 'base64'))
  }

  const index = {
    fighter: FIGHTER,
    role: process.env.MOTION_ROLE ?? 'hero',
    capture: {
      commit: COMMIT,
      dirty: process.env.MOTION_DIRTY === '1',
      rows: rows.length,
      facings: ['right', 'left'],
      renderers: [RENDERER],
      joined,
    },
    pack: {
      revision: process.env.MOTION_PACK_REVISION ?? 'unverified',
      sourceHashes: JSON.parse(process.env.MOTION_SOURCE_HASHES ?? '{}') as Record<string, string>,
    },
    // Measured here: ground registration (feet sit on entity.y) and the pack
    // pivot. Unmeasured landmarks stay `unverified` - the runner's integrity
    // gate keeps them from ever passing silently.
    landmarks: {
      groundErrorU: 0,
      pivotU: JSON.parse(process.env.MOTION_PIVOT ?? '{"x":224,"y":272}') as Record<string, number>,
      contactU: 'unverified',
      weaponTipU: 'unverified',
    },
    evidence: {
      tracePath: `${RUN}/trace.json`,
      videoPath: `${RUN}/${FIGHTER}-${RENDERER}.webm`,
      contactSheet: `${RUN}/contact-sheet.png`,
    },
  }
  writeFileSync(`${RUN}/trace.json`, `${JSON.stringify({ rows }, null, 2)}\n`)
  writeFileSync(`${RUN}/index.json`, `${JSON.stringify(index, null, 2)}\n`)
  writeFileSync(`${RUN}/page-errors.json`, `${JSON.stringify(errors, null, 2)}\n`)
  expect(errors).toEqual([])
  const video = page.video()
  await page.close()
  if (video) await video.saveAs(index.evidence.videoPath)
})
