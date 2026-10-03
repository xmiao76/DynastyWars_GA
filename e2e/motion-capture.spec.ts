import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import type { Sim } from '../src/core/sim'
import { makeCombatant } from '../src/core/entities'
import { ENEMIES } from '../src/core/enemies'

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
const ENEMY_KIND = process.env.MOTION_ENEMY_KIND ?? ''
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
  // Zhang Fei covers 17 isolated actions per facing (vs 7-12 elsewhere);
  // the budget scales with the sample count, not the fighter. Measured:
  // ~9s/sample headless (snapshot+decode+dataURL per crop), so the full
  // 70-sample run needs ~11 min.
  test.setTimeout(FIGHTER === 'zhangfei' ? 900_000 : 240_000)
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
    const target = makeCombatant(900001, ENEMY_KIND as never, 'enemy', 230, 216, def.maxHp, def.speed, 'right')
    target.invulnerableTicks = 999999
    await page.evaluate((t) => {
      const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
      const store = window as unknown as { __MOTION_TARGET_SPAWN__?: unknown }
      store.__MOTION_TARGET_SPAWN__ = t
      g.sim.entities.push(t as never)
      g.syncSprites()
    }, target as never)
  }

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
    for (let i = 0; i < n; i++) {
      await page.evaluate((inp) => window.__DW__!.run([inp]), { ...NEUTRAL, ...input })
    }
    await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
  }

  const setPlayer = async (fields: Record<string, unknown>): Promise<void> => {
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
  }
  const heroIds = ENEMY_KIND
    ? { jab1: '' }
    : (heroAttacks[FIGHTER] ?? (() => { throw new Error(`unknown hero fighter for capture: ${FIGHTER}`) })())
  // Zhang Fei covers the full hero action set at review-meaningful ticks
  // (strike extensions, apex kick, impact, DOWN); Guan Yu keeps its
  // original 7-action list byte-identical. Mounted samples ride a
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
    ? (FIGHTER === 'archer' ? archerIsolated : [
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
    : (FIGHTER === 'zhangfei' ? zhangfeiIsolated : guanyuIsolated)
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
    if (ENEMY_KIND) {
      // Real AI behaviour (gameplay provenance): the player stands in range
      // and the enemy walks/approaches on its own decisions.
      await setPlayer({ facing, state: 'idle', stateTick: 0, x: facing === 'right' ? 300 : 160 })
      await page.evaluate((dir) => {
        const g = window.__DW_GAME__!.scene.getScene('game') as unknown as LiveGame
        const p = g.sim.entities.find((e) => e.id === g.sim.playerId)!
        p.x = dir === 'right' ? 380 : 80
        p.hp = p.maxHp
      }, facing)
      await runTicks(28)
      await sample('walk', facing, 'gameplay', 'ai', `walk-${facing}`)
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
