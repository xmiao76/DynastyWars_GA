import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import type { Sim } from '../src/core/sim'
import { makeCombatant } from '../src/core/entities'
import { ENEMIES } from '../src/core/enemies'
import { attackById } from '../src/core/attacks'
import { xiahoudunClips } from '../src/game/art/motion-clips-xiahoudun'

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
/** Enemy-kind captures drive a spawned enemy target instead of the player. */
const XIAHOU = FIGHTER === 'xiahoudun'
const ENEMY_KIND = process.env.MOTION_ENEMY_KIND || (XIAHOU ? 'xiahoudun' : '')
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
  /** Sprite texture key at sample time (distinguishes motion atlas vs legacy). */
  texKey?: string
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
  paused?: boolean
  syncSprites(): void
  sprites: Map<number, {
    texture: { key: string }
    frame: { name: string; realWidth: number; realHeight: number }
    x: number
    y: number
    scaleX: number
    scaleY: number
    displayOriginX: number
    displayOriginY: number
    flipX: boolean
    alpha: number
  }>
}

const NEUTRAL = { up: false, down: false, left: false, right: false, attackPressed: false, jumpPressed: false, specialPressed: false }

test(`motion capture: ${FIGHTER} (${RENDERER})`, async ({ page }) => {
  // Zhang Fei covers 17 isolated actions per facing (vs 7-12 elsewhere);
  // the budget scales with the sample count, not the fighter. Measured:
  // ~9s/sample headless (snapshot+decode+dataURL per crop), so the full
  // 70-sample run needs ~11 min.
  test.setTimeout(XIAHOU || FIGHTER === 'zhangfei' || FIGHTER === 'zhaoyun' || FIGHTER === 'weiyan' || FIGHTER === 'huangzhong' ? 900_000 : 240_000)
  mkdirSync(`${RUN}/frames`, { recursive: true })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  // CMR-14B: optional mobile-landscape viewport override (default unchanged).
  const viewport = process.env.MOTION_VIEWPORT?.match(/^(\d+)x(\d+)$/)
  await page.setViewportSize(viewport ? { width: Number(viewport[1]), height: Number(viewport[2]) } : { width: 960, height: 540 })
  await page.goto(`/?renderer=${RENDERER}&autopilot=1&motion=1`)
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 15_000 }).toBe('title')
  if (XIAHOU) {
    // Ordinary solo start prepares the actual default ZF drop-in partner.
    await page.evaluate(() => window.__DW__!.startGame('guanyu', 42, 'stage2'))
  } else await page.evaluate((fighter) => window.__DW__!.startGame(fighter, 42, 'stage1'), FIGHTER)
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene), { timeout: 30_000 }).toBe('game')
  const introUp = (): Promise<boolean> => page.evaluate(() => !!window.__DW_GAME__?.scene.getScene('hud').children.list.some((o) => o.name === 'introCard'))
  await expect.poll(introUp).toBe(true)
  await page.keyboard.press('Enter')
  await expect.poll(introUp).toBe(false)

  if (XIAHOU) {
    await expect.poll(() => page.evaluate(() => !!window.__DW_GAME__!.scene.getScene('game').registry.get('paintedHeroArt')?.motions?.xiahoudun), { timeout: 30_000 }).toBe(true)
  }

  // Isolate the subject on the real stage (test-page sim only).
  await page.evaluate((enemyKind) => {
    const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
    g.sim.entities = g.sim.entities.filter((e) => e.id === g.sim.playerId)
    g.sim.cameraLocked = false
    g.sim.waveIndex = 0
    const p = g.sim.entities[0]!
    if (enemyKind) {
      // Enemy captures: the player stands aside as the camera anchor; the
      // capture target enemy is spawned next (real combatant shape).
      ;(window as unknown as { __MOTION_ENEMY_KIND__?: string }).__MOTION_ENEMY_KIND__ = enemyKind
      p.x = 60
      p.y = 216
      p.invulnerableTicks = 999999
      g.syncSprites()
      return
    }
    p.x = 230
    p.y = 216
    p.invulnerableTicks = 0
    g.syncSprites()
  }, ENEMY_KIND)
  if (ENEMY_KIND) {
    const def = ENEMIES[ENEMY_KIND as keyof typeof ENEMIES]
    if (!def) throw new Error(`unknown enemy kind for capture: ${ENEMY_KIND}`)
    // Enemy-side subject: the enemy AI drives its states and the sim lets
    // stateTick progress. The sim's dead-entity cleanup removes dead
    // enemies, so setPlayer/sample respawn it from the last-set fields.
    const target = makeCombatant(900001, ENEMY_KIND as never, 'enemy', 230, XIAHOU ? 232 : 216, def.maxHp, def.speed, 'right')
    target.invulnerableTicks = 999999
    await page.evaluate((t) => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      const store = window as unknown as { __MOTION_TARGET_SPAWN__?: unknown }
      store.__MOTION_TARGET_SPAWN__ = t
      g.sim.entities.push(t as never)
      g.syncSprites()
    }, target as never)
  }

  let runtime: unknown = null
  if (XIAHOU) {
    await expect.poll(() => page.evaluate(() => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      g.syncSprites()
      return g.sprites.get(900001)?.frame.name.startsWith('entity:xiahoudun:motion:')
    })).toBe(true)
    runtime = await page.evaluate(async () => {
      const path = '/src/game/adapters/motion-art.ts'
      const mod = await import(/* @vite-ignore */ path) as typeof import('../src/game/adapters/motion-art')
      const engine = mod.motionRuntime()
      await engine.settle()
      const scene = window.__DW_GAME__!.scene.getScene('game')
      return { stage: 'stage2', hero: 'guanyu', requestedPartner: 'zhangfei', fixture: 'ordinary solo start; actual default GU+ZF preparation', published: Object.keys(scene.registry.get('paintedHeroArt')?.motions ?? {}).sort(), budget: engine.budget() }
    })
    writeFileSync(`${RUN}/runtime.json`, `${JSON.stringify(runtime, null, 2)}\n`)
  }

  const rows: Row[] = []
  const began = Date.now()

  // Sample the player's ACTUAL drawn frame + full untrimmed cell box, and
  // optionally keep a 4x-of-logical crop of that box (camera-scroll aware).
  const sample = async (action: string, facing: string, origin: 'gameplay' | 'injected', source: Row['source'], shot?: string): Promise<void> => {
    if (XIAHOU) {
      const captured = await page.evaluate(async ({ action, origin, source, shot, commit, renderer, elapsed }) => {
        const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
        const previousPause = g.paused
        g.paused = true // TEST PAGE ONLY: no AI step during async snapshot/decode.
        const hud = window.__DW_GAME__!.scene.getScene('hud')
        const kids = hud.children.list as unknown as Array<{ visible: boolean }>
        const visibility = kids.map((kid) => kid.visible)
        const hudWasActive = hud.scene.isActive()
        if (shot) {
          hud.scene.pause() // prevent HudScene.update from recreating pause/HUD
          kids.forEach((kid) => { kid.visible = false })
        }
        try {
          const p = g.sim.entities.find((e) => e.id === 900001)!
          if (!p) throw new Error('Xiahou target missing before capture')
          g.syncSprites()
          const sprite = g.sprites.get(p.id)!
          const key = sprite.frame.name
          if (!key.startsWith('entity:xiahoudun:motion:')) throw new Error(`legacy Xiahou capture: ${key}`)
          const camera = (g as unknown as { cameras: { main: { zoom: number; scrollX: number; scrollY: number } } }).cameras.main
          const sx = Math.abs(sprite.scaleX), sy = Math.abs(sprite.scaleY)
          const box = {
            x: Math.round((sprite.x - sprite.displayOriginX * sx - camera.scrollX) * camera.zoom),
            y: Math.round((sprite.y - sprite.displayOriginY * sy - camera.scrollY) * camera.zoom),
            w: Math.round(sprite.frame.realWidth * sx * camera.zoom),
            h: Math.round(sprite.frame.realHeight * sy * camera.zoom),
          }
          let crop: string | undefined
          if (shot) {
            const url = await new Promise<string>((resolve) => window.__DW_GAME__!.renderer.snapshot((snap) => resolve((snap as HTMLImageElement).src)))
            const image = new Image()
            image.src = url
            await image.decode()
            const cv = document.createElement('canvas')
            cv.width = box.w * 2
            cv.height = box.h * 2
            const ctx = cv.getContext('2d')!
            // Preserve the original crop origin; out-of-viewport area is blank
            // padding, NOT clamped/repositioned or stretched scene pixels.
            ctx.drawImage(image, -box.x * 2, -box.y * 2, image.width * 2, image.height * 2)
            crop = cv.toDataURL('image/png')
          }
          const snapshotKey = sprite.frame.name
          if (snapshotKey !== key) throw new Error(`snapshot key drift ${key} -> ${snapshotKey}`)
          return { crop, row: {
            action, facing: p.facing, origin, source, renderer, commit,
            state: p.state, stateTick: p.stateTick, tick: g.sim.tick, attackId: p.attackId,
            key, snapshotKey, texKey: sprite.texture.key, elapsedMs: elapsed,
            frozen: g.sim.freezeTicks > 0, paused: true, pauseMethod: 'test-page scene paused during snapshot',
            actor: p.id, kind: p.kind, box, flipX: sprite.flipX, alpha: sprite.alpha,
            entity: { x: p.x, y: p.y, z: p.z },
            padding: { left: Math.max(0, -box.x), top: Math.max(0, -box.y), right: Math.max(0, box.x + box.w - 960), bottom: Math.max(0, box.y + box.h - 540) },
          } }
        } finally {
          kids.forEach((kid, i) => { kid.visible = visibility[i]! })
          g.paused = previousPause
          if (shot && hudWasActive) hud.scene.resume()
        }
      }, { action, origin, source, shot, commit: COMMIT, renderer: RENDERER, elapsed: Date.now() - began })
      rows.push(captured.row as Row)
      if (shot && captured.crop) writeFileSync(`${RUN}/frames/${shot}.png`, Buffer.from(captured.crop.split(',')[1]!, 'base64'))
      if (errors.length) throw new Error(`capture page errors: ${errors.join('; ')}`)
      return
    }
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
      const enemyKind = (window as unknown as { __MOTION_ENEMY_KIND__?: string }).__MOTION_ENEMY_KIND__
      let p = enemyKind
        ? g.sim.entities.find((e) => e.id === 900001)
        : g.sim.entities.find((e) => e.id === g.sim.playerId)!
      if (enemyKind && !p) {
        // The sim removes dead enemies between ticks; respawn from the
        // last-set fields so the dead/dying shots still capture.
        const store = window as unknown as {
          __MOTION_TARGET_SPAWN__?: Record<string, unknown>
          __MOTION_TARGET_FIELDS__?: Record<string, unknown>
        }
        const fresh = { ...store.__MOTION_TARGET_SPAWN__! } as Record<string, unknown>
        g.sim.entities.push(fresh as never)
        p = g.sim.entities.find((e) => e.id === 900001)
        Object.assign(p!, { hp: p!.maxHp, invulnerableTicks: 999999 }, store.__MOTION_TARGET_FIELDS__ ?? {})
      }
      g.syncSprites()
      // Let the renderer repaint after syncSprites: the snapshot must see
      // the updated sprite, not the previous frame's pixels.
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
      const s = g.sprites.get(p!.id)!
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
        state: p!.state, stateTick: p!.stateTick, tick: g.sim.tick,
        attackId: p!.attackId,
        key: s.frame.name === '__BASE' ? s.texture.key : s.frame.name,
        texKey: s.texture.key,
        elapsedMs: elapsed,
        frozen: g.sim.freezeTicks > 0,
        paused: false,
        commit,
        actor: p!.id,
        kind: p!.kind,
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
    if (XIAHOU) {
      const tick = await page.evaluate(() => window.__DW__!.getSnapshot().tick)
      await page.evaluate(({ n, inp }) => window.__DW__!.run(Array.from({ length: n }, () => inp)), { n, inp: { ...NEUTRAL, ...input } })
      await expect.poll(() => page.evaluate(() => window.__DW__!.getSnapshot().tick)).toBe(tick + n)
    } else {
      for (let i = 0; i < n; i++) {
        await page.evaluate((inp) => window.__DW__!.run([inp]), { ...NEUTRAL, ...input })
      }
    }
    await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
  }

  const setPlayer = async (fields: Record<string, unknown>): Promise<void> => {
    if (XIAHOU) {
      // Fresh actor + removed sprite resets presentation history honestly; do
      // not carry low-collapse or release history across independent poses.
      const fresh = makeCombatant(900001, 'xiahoudun', 'enemy', 230, 232, ENEMIES.xiahoudun!.maxHp, ENEMIES.xiahoudun!.speed, 'right')
      await page.evaluate(({ fresh, fields }) => {
        const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
        g.sim.entities = g.sim.entities.filter((e) => e.id !== 900001)
        g.syncSprites() // forgetMotionEntity through the actual cleanup path
        g.sim.entities.push(Object.assign(fresh, fields))
        g.sim.scrollX = 0
        ;(g as unknown as { cameras: { main: { scrollX: number } } }).cameras.main.scrollX = 0
        g.syncSprites()
      }, { fresh, fields })
      return
    }
    if (ENEMY_KIND) {
      const def = ENEMIES[ENEMY_KIND as keyof typeof ENEMIES]!
      const fresh = makeCombatant(900001, ENEMY_KIND as never, 'enemy', 230, 216, def.maxHp, def.speed, 'right')
      await page.evaluate(({ t, f }) => {
        const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
        const store = window as unknown as { __MOTION_TARGET_SPAWN__?: unknown; __MOTION_TARGET_FIELDS__?: unknown }
        store.__MOTION_TARGET_SPAWN__ = t
        store.__MOTION_TARGET_FIELDS__ = f
        let p = g.sim.entities.find((e) => e.id === 900001)
        if (!p) {
          g.sim.entities.push(t as never)
          p = g.sim.entities.find((e) => e.id === 900001)
        }
        Object.assign(p!, { hp: p!.maxHp, airTicks: 0, z: 0, attackId: null, mountedOn: null, invulnerableTicks: 999999 }, f)
      }, { t: fresh as never, f: fields })
      return
    }
    await page.evaluate((f) => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      const enemyKind = (window as unknown as { __MOTION_ENEMY_KIND__?: string }).__MOTION_ENEMY_KIND__
      const p = enemyKind
        ? g.sim.entities.find((e) => e.id === 900001)!
        : g.sim.entities.find((e) => e.id === g.sim.playerId)!
      Object.assign(p, { hp: p.maxHp, airTicks: 0, z: 0, attackId: null, mountedOn: null }, f)
    }, fields)
  }

  // Isolated named actions (injected state control, labelled `injected`) and
  // real-input segments (labelled `gameplay`), both facings.
  // The enemy attack action is per fighter (fail loud on unknown kinds -
  // capturing the wrong attackId would silently record guard frames).
  const enemyAttack: Record<string, [string, string]> = {
    soldier: ['swing', 'soldier.swing'],
    spearman: ['thrust', 'spear.thrust'],
    lidian: ['charge', 'charge.dash'],
    xiahoudun: ['charge', 'charge.dash.long'],
  }
  const [attackAction, attackId] = ENEMY_KIND
    ? (FIGHTER === 'archer'
      ? (['', ''] as [string, string])
      : (enemyAttack[FIGHTER] ?? (() => { throw new Error(`unknown enemy fighter for capture: ${FIGHTER}`) })()))
    : ['', '']
  // Archers have no attack state: firing phases are sampled by injecting
  // thinkTick values (release 90, reload 70, draw 45, aim 10 - each with
  // margin from phase boundaries for the 2-tick AI drift). Plain idle
  // injects no countdown, recording the guard bookend deterministically.
  const archerIsolated: Array<[string, Record<string, unknown>]> = [
    ['idle', { state: 'idle', stateTick: 0, thinkTick: undefined }],
    ['shoot-release', { state: 'idle', stateTick: 0, thinkTick: 90 }],
    ['shoot-reload', { state: 'idle', stateTick: 0, thinkTick: 70 }],
    ['shoot-draw', { state: 'idle', stateTick: 0, thinkTick: 45 }],
    ['shoot-aim', { state: 'idle', stateTick: 0, thinkTick: 10 }],
    ['hurt', { state: 'hitstun', stateTick: 0 }],
    ['knockdown', { state: 'knockdown', stateTick: 0 }],
    ['getup', { state: 'getup', stateTick: 0 }],
    ['grabbed', { state: 'grabbed', stateTick: 0 }],
    ['thrown', { state: 'thrown', stateTick: 0 }],
    ['dying', { state: 'dying', stateTick: 0, hp: 0 }],
    ['dead', { state: 'dead', stateTick: 0, hp: 0 }],
  ]
  // Hero attack ids per fighter (capturing the wrong attackId would
  // silently record the wrong clip - fail loud on unknown fighters).
  const heroAttacks: Record<string, Record<string, string>> = {
    guanyu: { jab1: 'gy.jab1' },
    zhangfei: { jab1: 'zf.jab1', jab2: 'zf.jab2', finisher: 'zf.finisher' },
    zhaoyun: { jab1: 'zy.jab1', jab2: 'zy.jab2', finisher: 'zy.finisher' },
    weiyan: { jab1: 'wy.jab1', jab2: 'wy.jab2', finisher: 'wy.finisher' },
    huangzhong: { jab1: 'hz.jab1', jab2: 'hz.jab2', finisher: 'hz.finisher' },
  }
  const heroIds = ENEMY_KIND
    ? { jab1: '' }
    : (heroAttacks[FIGHTER] ?? (() => { throw new Error(`unknown hero fighter for capture: ${FIGHTER}`) })())
  // Zhang Fei covers the full hero action set at review-meaningful ticks
  // (strike extensions, apex kick, impact, DOWN); Guan Yu keeps its
  // original 7-action list byte-identical. Zhao Yun mirrors Zhang Fei's
  // list with zy.* ids, except the finisher samples tick 8 (zy.finisher
  // strikes 7-10; tick 12 would show the follow instead). Mounted samples ride a
  // stand-in horse id (the sim/display never dereference it). Attack-like
  // states carry their real attackIds: the sim fail-fasts otherwise
  // (requireAttackId), which wedges snapshotting for the rest of the run.
  // Adjacent actions never share a sim state: the trace clock check reads
  // same-state adjacency as continuity, so jab1->jab2 adjacency would
  // false-positive a stateTick regression (each injected action resets
  // the clock independently).
  const zhangfeiIsolated: Array<[string, Record<string, unknown>]> = [
    ['idle', { state: 'idle', stateTick: 0 }],
    ['jab1', { state: 'attack', attackId: 'zf.jab1', stateTick: 6 }],
    ['hurt', { state: 'hitstun', stateTick: 5 }],
    ['jab2', { state: 'attack', attackId: 'zf.jab2', stateTick: 6 }],
    ['knockdown', { state: 'knockdown', stateTick: 12 }],
    ['finisher', { state: 'attack', attackId: 'zf.finisher', stateTick: 12 }],
    ['getup', { state: 'getup', stateTick: 10 }],
    ['special', { state: 'special', attackId: 'zf.special', stateTick: 10 }],
    ['jump', { state: 'jump', stateTick: 18, airTicks: 18, z: 48 }],
    ['jumpkick', { state: 'jumpattack', attackId: 'zf.jumpkick', stateTick: 8, airTicks: 18, z: 48 }],
    ['grab', { state: 'grab', stateTick: 5 }],
    ['grabbed', { state: 'grabbed', stateTick: 0 }],
    ['thrown', { state: 'thrown', stateTick: 6, z: 10 }],
    ['mount', { mountedOn: 7, state: 'idle', stateTick: 0 }],
    ['mountedsweep', { mountedOn: 7, state: 'attack', attackId: 'mounted.sweep', stateTick: 10 }],
    ['dying', { state: 'dying', stateTick: 12, hp: 0 }],
    ['dead', { state: 'dead', stateTick: 0, hp: 0 }],
  ]
  const zhaoyunIsolated: Array<[string, Record<string, unknown>]> = [
    ['idle', { state: 'idle', stateTick: 0 }],
    ['jab1', { state: 'attack', attackId: 'zy.jab1', stateTick: 6 }],
    ['hurt', { state: 'hitstun', stateTick: 5 }],
    ['jab2', { state: 'attack', attackId: 'zy.jab2', stateTick: 6 }],
    ['knockdown', { state: 'knockdown', stateTick: 12 }],
    ['finisher', { state: 'attack', attackId: 'zy.finisher', stateTick: 8 }],
    ['getup', { state: 'getup', stateTick: 10 }],
    ['special', { state: 'special', attackId: 'zy.special', stateTick: 10 }],
    ['jump', { state: 'jump', stateTick: 18, airTicks: 18, z: 48 }],
    ['jumpkick', { state: 'jumpattack', attackId: 'zy.jumpkick', stateTick: 8, airTicks: 18, z: 48 }],
    ['grab', { state: 'grab', stateTick: 5 }],
    ['grabbed', { state: 'grabbed', stateTick: 0 }],
    ['thrown', { state: 'thrown', stateTick: 6, z: 10 }],
    ['mount', { mountedOn: 7, state: 'idle', stateTick: 0 }],
    ['mountedsweep', { mountedOn: 7, state: 'attack', attackId: 'mounted.sweep', stateTick: 10 }],
    ['dying', { state: 'dying', stateTick: 12, hp: 0 }],
    ['dead', { state: 'dead', stateTick: 0, hp: 0 }],
  ]
  // Wei Yan mirrors the Zhang Fei/Zhao Yun 17-action list with wy.* ids;
  // sample ticks sit mid-active-window of his slower dao windings (jab1/2
  // strike 9-13 -> tick 11; finisher strikes 13-18 -> tick 15; special
  // strikes 6-17 -> tick 10; jumpkick active 4-23 -> tick 8 airborne).
  const weiyanIsolated: Array<[string, Record<string, unknown>]> = [
    ['idle', { state: 'idle', stateTick: 0 }],
    ['jab1', { state: 'attack', attackId: 'wy.jab1', stateTick: 11 }],
    ['hurt', { state: 'hitstun', stateTick: 5 }],
    ['jab2', { state: 'attack', attackId: 'wy.jab2', stateTick: 11 }],
    ['knockdown', { state: 'knockdown', stateTick: 12 }],
    ['finisher', { state: 'attack', attackId: 'wy.finisher', stateTick: 15 }],
    ['getup', { state: 'getup', stateTick: 10 }],
    ['special', { state: 'special', attackId: 'wy.special', stateTick: 10 }],
    ['jump', { state: 'jump', stateTick: 18, airTicks: 18, z: 48 }],
    ['jumpkick', { state: 'jumpattack', attackId: 'wy.jumpkick', stateTick: 8, airTicks: 18, z: 48 }],
    ['grab', { state: 'grab', stateTick: 5 }],
    ['grabbed', { state: 'grabbed', stateTick: 0 }],
    ['thrown', { state: 'thrown', stateTick: 6, z: 10 }],
    ['mount', { mountedOn: 7, state: 'idle', stateTick: 0 }],
    ['mountedsweep', { mountedOn: 7, state: 'attack', attackId: 'mounted.sweep', stateTick: 10 }],
    ['dying', { state: 'dying', stateTick: 12, hp: 0 }],
    ['dead', { state: 'dead', stateTick: 0, hp: 0 }],
  ]
  // Huang Zhong mirrors the 17-action list with hz.* ids; sample ticks sit
  // mid-active-window of his compact bow windings (jab1/2 strike 6-9 ->
  // tick 8; finisher strikes 8-12 -> tick 10; special is inert with the
  // release AT spawn -> tick 1; jumpkick active 4-23 -> tick 8 airborne).
  const huangzhongIsolated: Array<[string, Record<string, unknown>]> = [
    ['idle', { state: 'idle', stateTick: 0 }],
    ['jab1', { state: 'attack', attackId: 'hz.jab1', stateTick: 8 }],
    ['hurt', { state: 'hitstun', stateTick: 5 }],
    ['jab2', { state: 'attack', attackId: 'hz.jab2', stateTick: 8 }],
    ['knockdown', { state: 'knockdown', stateTick: 12 }],
    ['finisher', { state: 'attack', attackId: 'hz.finisher', stateTick: 10 }],
    ['getup', { state: 'getup', stateTick: 10 }],
    ['special', { state: 'special', attackId: 'hz.special', stateTick: 1 }],
    ['jump', { state: 'jump', stateTick: 18, airTicks: 18, z: 48 }],
    ['jumpkick', { state: 'jumpattack', attackId: 'hz.jumpkick', stateTick: 8, airTicks: 18, z: 48 }],
    ['grab', { state: 'grab', stateTick: 5 }],
    ['grabbed', { state: 'grabbed', stateTick: 0 }],
    ['thrown', { state: 'thrown', stateTick: 6, z: 10 }],
    ['mount', { mountedOn: 7, state: 'idle', stateTick: 0 }],
    ['mountedsweep', { mountedOn: 7, state: 'attack', attackId: 'mounted.sweep', stateTick: 10 }],
    ['dying', { state: 'dying', stateTick: 12, hp: 0 }],
    ['dead', { state: 'dead', stateTick: 0, hp: 0 }],
  ]
  // Li Dian (boss) mirrors the interleaved hero shape with his own three
  // attacks: sample ticks sit mid-active-window (charge 10-27 -> 18,
  // combo 9-12 -> 10, heavy 16-21 -> 18). Adjacent actions never share a
  // sim state (trace clock check), and attack states carry real ids.
  const lidianIsolated: Array<[string, Record<string, unknown>]> = [
    ['idle', { state: 'idle', stateTick: 0 }],
    ['charge', { state: 'attack', attackId: 'charge.dash', stateTick: 18 }],
    ['hurt', { state: 'hitstun', stateTick: 5 }],
    ['combo', { state: 'attack', attackId: 'sword.combo', stateTick: 10 }],
    ['knockdown', { state: 'knockdown', stateTick: 21 }],
    ['heavy', { state: 'attack', attackId: 'sword.heavy', stateTick: 18 }],
    ['getup', { state: 'getup', stateTick: 10 }],
    ['grabbed', { state: 'grabbed', stateTick: 0 }],
    ['thrown', { state: 'thrown', stateTick: 6, z: 10 }],
    ['dying', { state: 'dying', stateTick: 25, hp: 0 }],
    ['dead', { state: 'dead', stateTick: 0, hp: 0 }],
  ]
  const charge = attackById('charge.dash.long')
  const xiahoudunIsolated: Array<[string, Record<string, unknown>]> = [
    ['idle', { state: 'idle', stateTick: 0 }],
    ['charge', { state: 'attack', attackId: 'charge.dash.long', stateTick: charge.startup + Math.floor(charge.active / 2) }],
    ['hurt', { state: 'hitstun', stateTick: Math.floor(ENEMIES.xiahoudun!.hitstunTicks / 2) }],
    ['combo', { state: 'attack', attackId: 'sword.combo', stateTick: attackById('sword.combo').startup + 1 }],
    ['knockdown', { state: 'knockdown', stateTick: 21 }],
    ['heavy', { state: 'attack', attackId: 'sword.heavy', stateTick: attackById('sword.heavy').startup + 2 }],
    ['getup', { state: 'getup', stateTick: 10 }],
    ['grabbed', { state: 'grabbed', stateTick: 0 }],
    ['thrown', { state: 'thrown', stateTick: 0, vx: 3.5, thrownFromX: 209, z: 10 }],
    ['dying', { state: 'dying', stateTick: 25, hp: 0 }],
    ['dead', { state: 'dead', stateTick: 0, hp: 0 }],
  ]
  const guanyuIsolated: Array<[string, Record<string, unknown>]> = [
    ['idle', { state: 'idle', stateTick: 0 }],
    ['jab1', { state: 'attack', attackId: heroIds.jab1, stateTick: 0 }],
    ['hurt', { state: 'hitstun', stateTick: 0 }],
    ['knockdown', { state: 'knockdown', stateTick: 0 }],
    ['getup', { state: 'getup', stateTick: 0 }],
    ['dying', { state: 'dying', stateTick: 0, hp: 0 }],
    ['dead', { state: 'dead', stateTick: 0, hp: 0 }],
  ]
  const isolated: Array<[string, Record<string, unknown>]> = ENEMY_KIND
    ? (XIAHOU ? xiahoudunIsolated : FIGHTER === 'archer' ? archerIsolated : FIGHTER === 'lidian' ? lidianIsolated : [
        ['idle', { state: 'idle', stateTick: 0 }],
        [attackAction, { state: 'attack', attackId, stateTick: 0 }],
        ['hurt', { state: 'hitstun', stateTick: 0 }],
        ['knockdown', { state: 'knockdown', stateTick: 0 }],
        ['getup', { state: 'getup', stateTick: 0 }],
        ['grabbed', { state: 'grabbed', stateTick: 0 }],
        ['thrown', { state: 'thrown', stateTick: 0 }],
        ['dying', { state: 'dying', stateTick: 0, hp: 0 }],
        ['dead', { state: 'dead', stateTick: 0, hp: 0 }],
      ])
    : (FIGHTER === 'zhangfei' ? zhangfeiIsolated : FIGHTER === 'zhaoyun' ? zhaoyunIsolated : FIGHTER === 'weiyan' ? weiyanIsolated : FIGHTER === 'huangzhong' ? huangzhongIsolated : guanyuIsolated)
  for (const facing of ['right', 'left'] as const) {
    if (XIAHOU) {
      // Every frame record is selected by actual state/clip dispatch, never by
      // forcing sprite.setFrame or drawing raw PNG cells. All are injected.
      const visited = new Set<string>()
      for (const [clip, data] of Object.entries(xiahoudunClips())) {
        for (const key of data.keys) {
          if (visited.has(key.frame)) continue
          visited.add(key.frame)
          const fields: Record<string, unknown> = { stateTick: key.tick }
          if (['charge', 'combo', 'heavy'].includes(clip)) Object.assign(fields, { state: 'attack', attackId: clip === 'charge' ? 'charge.dash.long' : `sword.${clip}` })
          else fields.state = ({ idle: 'idle', walk: 'walk', hurt: 'hitstun', fall: 'knockdown', getup: 'getup', grab: 'grab', release: 'idle' } as Record<string, string>)[clip]
          if (clip === 'release') {
            await setPlayer({ facing, state: 'grab', stateTick: 0 })
            await page.evaluate(() => {
              const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
              Object.assign(g.sim.entities.find((e) => e.id === 900001)!, { state: 'idle', stateTick: 0 })
              g.syncSprites()
            })
          } else await setPlayer({ facing, ...fields })
          await sample('all-keys', facing, 'injected', 'injected', `key-${key.frame.replace(':', '-')}-${facing}`)
          expect(rows.at(-1)!.key, `dispatch ${clip}@${key.tick}`).toBe(`entity:xiahoudun:motion:${key.frame}`)
        }
      }
      expect(visited.size).toBe(39)
    }
    for (const [action, fields] of isolated) {
      await setPlayer({ facing, ...fields })
      await sample(action, facing, 'injected', 'injected', `${action}-${facing}`)
      if (!XIAHOU || (action !== 'dead' && action !== 'dying')) await runTicks(2)
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
    if (ENEMY_KIND) {
      // Real AI behaviour (gameplay provenance): the player stands in range
      // and the enemy walks/approaches on its own decisions.
      await setPlayer({ facing, state: 'idle', stateTick: 0, x: XIAHOU ? 230 : facing === 'right' ? 300 : 160, ...(XIAHOU ? { thinkTick: 100 } : {}) })
      await page.evaluate((dir) => {
        const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
        const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
        p.x = dir === 'right' ? 380 : 80
        p.hp = p.maxHp
      }, facing)
      await runTicks(28)
      await sample('walk', facing, 'gameplay', 'ai', `walk-${facing}`)
      if (XIAHOU) {
        // Actual AI mixed run from a disclosed placement fixture, no pose or
        // attack injection. Poll each rendered sim step and retain wall pace.
        const startTick = await page.evaluate(() => window.__DW__!.getSnapshot().tick)
        const startWall = Date.now()
        for (let tick = 0; tick < 180; tick++) {
          await runTicks(1)
          await sample('mixed', facing, 'gameplay', 'ai')
        }
        writeFileSync(`${RUN}/pace-${facing}.json`, `${JSON.stringify({ ticks: 180, startTick, elapsedMs: Date.now() - startWall, mode: 'manual bridge step + renderer; not normal speed' }, null, 2)}\n`)
      }
    } else {
      // Real-input walk (gameplay provenance).
      await setPlayer({ facing, state: 'idle', stateTick: 0 })
      await runTicks(12, facing === 'right' ? { right: true } : { left: true })
      await sample('walk', facing, 'gameplay', 'player', `walk-${facing}`)
    }
  }

  // Mixed choreography and co-op observability are player-capture segments.
  let joined = false
  if (!ENEMY_KIND) {

  // Mixed choreography with real inputs (gameplay provenance).
  await setPlayer({ facing: 'right', state: 'idle', stateTick: 0 })
  await runTicks(8, { right: true })
  await runTicks(1, { right: true, attackPressed: true })
  await runTicks(10, { right: true })
  await sample('mixed', 'right', 'gameplay', 'player', 'mixed-right')

  // Co-op observability: drop player two in and sample every live sprite.
  joined = await page.evaluate(() => window.__DW__!.joinP2!())
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
  }

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
      viewport: page.viewportSize(),
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
  writeFileSync(`${RUN}/trace.json`, `${JSON.stringify({ rows, ...(XIAHOU ? { runtime, method: 'all-keys/isolated injected; mixed AI gameplay from placement fixture; scene paused only during snapshot' } : {}) }, null, 2)}\n`)
  writeFileSync(`${RUN}/index.json`, `${JSON.stringify(index, null, 2)}\n`)
  writeFileSync(`${RUN}/page-errors.json`, `${JSON.stringify(errors, null, 2)}\n`)
  expect(errors).toEqual([])
  const video = page.video()
  await page.close()
  if (video) await video.saveAs(index.evidence.videoPath)
})
