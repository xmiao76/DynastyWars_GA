import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { expect, type Page } from '@playwright/test'

/**
 * UI review capture kit (docs/VISUAL_REVIEW.md section 1). Helpers only; the
 * recipes live in e2e/ui-review.spec.ts.
 *
 * Freezing stops the Phaser loop itself (game.loop.sleep/wake), so the
 * screenshot, the scene inventory and the recorded state all describe ONE
 * rendered frame: tweens, clocks, wall-clock countdowns and autopilot draining
 * stop together. On wake the TimeStep clamps the long gap, so nothing jumps.
 */
export const OUT = 'artifacts/review/latest'
const SHOTS = join(OUT, 'shots.jsonl')

export type Group = 'flow' | 'stages' | 'platform'
export interface Box { x: number; y: number; w: number; h: number }

/** Named review regions in LOGICAL 480x270 units. */
export const CROPS = {
  plate: { x: 0, y: 0, w: 190, h: 40 },
  plate2: { x: 290, y: 0, w: 190, h: 40 },
  centre: { x: 150, y: 0, w: 180, h: 40 },
  rail: { x: 0, y: 38, w: 480, h: 22 },
  banner: { x: 80, y: 30, w: 320, h: 56 },
  intro: { x: 125, y: 65, w: 230, h: 142 },
  dialog: { x: 140, y: 70, w: 200, h: 110 },
  roster: { x: 6, y: 34, w: 468, h: 176 },
  strip: { x: 20, y: 222, w: 440, h: 26 },
} satisfies Record<string, Box>

export interface InvItem {
  scene: string; type: string; name: string; key: string
  text?: string; font?: string; size?: number; color?: string
  x: number; y: number; w: number; h: number
  depth: number; alpha: number; visible: boolean
}

interface ShotRecord {
  id: string; group: Group; file: string; focus: string; crops: string[]
  state: unknown; viewport: unknown; suspects: string[]
}

export function prepare(): void {
  for (const d of ['screens', 'crops', 'inventory']) mkdirSync(join(OUT, d), { recursive: true })
}

export function clampBox(b: Box): Box {
  const w = Math.min(b.w, 480)
  const h = Math.min(b.h, 270)
  return { x: Math.max(0, Math.min(480 - w, Math.round(b.x))), y: Math.max(0, Math.min(270 - h, Math.round(b.y))), w, h }
}

/** A box around an actor standing at sim (x, y) with height z. */
export function actorBox(x: number, y: number, z: number, scrollX: number): Box {
  return clampBox({ x: x - scrollX - 60, y: y - z - 100, w: 120, h: 112 })
}

export async function freeze(page: Page): Promise<void> {
  await page.evaluate(() => window.__DW_GAME__?.loop.sleep())
}

export async function thaw(page: Page): Promise<void> {
  await page.evaluate(() => window.__DW_GAME__?.loop.wake())
}

/** Poll a page-side predicate; the evaluation that sees it true also freezes. */
export async function freezeWhen(page: Page, probe: () => boolean, timeout = 15_000): Promise<void> {
  const src = `(() => { const ok = (${probe.toString()})(); if (ok) window.__DW_GAME__.loop.sleep(); return ok })()`
  await expect.poll(() => page.evaluate(src), { timeout }).toBe(true)
}

export async function tickOf(page: Page): Promise<number> {
  return page.evaluate(() => window.__DW__?.getSnapshot().tick ?? -1)
}

/** Wait until the sim reached `tick` and two more frames have been drawn. */
export async function rendered(page: Page, tick: number): Promise<void> {
  await expect.poll(() => tickOf(page)).toBeGreaterThanOrEqual(tick)
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
}

export async function stepRender(page: Page, n = 1): Promise<void> {
  const t = await tickOf(page)
  await page.evaluate((k) => window.__DW__?.step(k), n)
  await rendered(page, t + n)
}

async function inventory(page: Page): Promise<InvItem[]> {
  return page.evaluate(() => {
    interface Obj {
      type: string; name: string; visible?: boolean; alpha?: number; depth?: number; scrollFactorX?: number
      list?: Obj[]; texture?: { key: string }; text?: string
      style?: { fontSize: string | number; color: string; fontFamily: string }
      getBounds?: () => { x: number; y: number; width: number; height: number }
    }
    const r1 = (v: number): number => Math.round(v * 10) / 10
    const out: InvItem[] = []
    for (const scene of window.__DW_GAME__?.scene.getScenes(true) ?? []) {
      const key = scene.scene.key
      const cam = scene.cameras.main
      const walk = (list: Obj[], parentVisible: boolean): void => {
        for (const o of list) {
          const visible = parentVisible && o.visible !== false
          let b: { x: number; y: number; width: number; height: number } | null
          try { b = o.getBounds ? o.getBounds() : null } catch { b = null }
          const sf = o.scrollFactorX ?? 1
          const isText = o.type === 'Text'
          out.push({
            scene: key, type: o.type, name: o.name ?? '', key: isText ? '' : (o.texture?.key ?? ''),
            text: isText ? o.text : undefined,
            font: isText ? o.style?.fontFamily : undefined,
            size: isText ? parseFloat(String(o.style?.fontSize ?? '')) || undefined : undefined,
            color: isText ? o.style?.color : undefined,
            x: b ? r1(b.x - cam.scrollX * sf) : 0, y: b ? r1(b.y - cam.scrollY * sf) : 0,
            w: b ? r1(b.width) : 0, h: b ? r1(b.height) : 0,
            depth: o.depth ?? 0, alpha: r1(o.alpha ?? 1), visible,
          })
          if (o.list) walk(o.list, visible)
        }
      }
      walk(scene.children.list as unknown as Obj[], true)
    }
    return out
  })
}

/** Automatic layout hints. Not a gate: a suspect still needs eyes. */
export function suspects(items: InvItem[]): string[] {
  const out: string[] = []
  const vis = items.filter((i) => i.visible && i.alpha > 0.05)
  const label = (o: InvItem): string => `${o.type} "${o.text ?? (o.name || o.key)}" (${o.scene})`
  for (const t of vis) {
    if (t.type === 'Text' && t.text?.trim() && t.size !== undefined && t.size < 8) out.push(`small text ${t.size}px: ${label(t)}`)
  }
  for (const o of vis) {
    if (o.scene === 'game' || o.w <= 0 || o.w >= 470 || o.h >= 265) continue
    if (o.x < -0.5 || o.y < -0.5 || o.x + o.w > 480.5 || o.y + o.h > 270.5) {
      out.push(`off-screen ${label(o)} at ${o.x},${o.y} ${o.w}x${o.h}`)
    }
  }
  const texts = vis.filter((t) => t.type === 'Text' && t.text?.trim() && t.w > 0 && t.h > 0)
  for (let i = 0; i < texts.length; i += 1) {
    for (let j = i + 1; j < texts.length; j += 1) {
      const a = texts[i]!
      const b = texts[j]!
      if (a.scene !== b.scene) continue
      const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
      const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
      if (ix > 0 && iy > 0 && ix * iy > 0.2 * Math.min(a.w * a.h, b.w * b.h)) out.push(`overlapping text: ${label(a)} / ${label(b)}`)
    }
  }
  const fonts = [...new Set(texts.map((t) => t.font ?? '?'))]
  if (fonts.length > 2) out.push(`${fonts.length} live-text fonts on one screen: ${fonts.join(' | ')}`)
  return out
}

export interface ShotOpts { group: Group; focus: string; crops?: Record<string, Box> }

/** Capture the CURRENT frame. The caller has frozen the loop; this thaws it. */
export async function shoot(page: Page, id: string, opts: ShotOpts): Promise<void> {
  const state = await page.evaluate(() => {
    const s = window.__DW__?.getSnapshot()
    const sim = s?.sim
    return {
      scene: s?.scene ?? '', tick: s?.tick ?? 0,
      renderer: window.__DW_GAME__?.renderer.type === 1 ? 'canvas' : 'webgl',
      sim: sim ? {
        stage: sim.stageId, hero: sim.charId, hero2: sim.char2Id, phase: sim.phase, lives: sim.lives,
        hp: sim.player.hp, maxHp: sim.player.maxHp, playerState: sim.player.state, mounted: sim.player.mounted,
        cameraLocked: sim.cameraLocked, wave: sim.waveIndex, enemies: sim.enemies.length, score: sim.stats.score,
      } : null,
    }
  })
  const file = join('screens', `${id}.png`)
  await page.screenshot({ path: join(OUT, file) })
  const rect = await page.evaluate(() => {
    const r = window.__DW_GAME__?.canvas.getBoundingClientRect()
    return r ? { x: r.left, y: r.top, s: r.width / 480 } : { x: 0, y: 0, s: 2 }
  })
  const crops: string[] = []
  for (const [region, raw] of Object.entries(opts.crops ?? {})) {
    const b = clampBox(raw)
    const buf = await page.screenshot({ clip: { x: rect.x + b.x * rect.s, y: rect.y + b.y * rect.s, width: b.w * rect.s, height: b.h * rect.s } })
    const img = await loadImage(buf)
    const c = createCanvas(img.width * 2, img.height * 2)
    const ctx = c.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, 0, 0, c.width, c.height)
    const f = join('crops', `${id}--${region}.png`)
    writeFileSync(join(OUT, f), c.toBuffer('image/png'))
    crops.push(f)
  }
  const items = await inventory(page)
  writeFileSync(join(OUT, 'inventory', `${id}.json`), JSON.stringify(items, null, 1))
  const record: ShotRecord = { id, group: opts.group, file, focus: opts.focus, crops, state, viewport: page.viewportSize(), suspects: suspects(items) }
  appendFileSync(SHOTS, JSON.stringify(record) + '\n')
  await thaw(page)
}

/** Freeze on the frame already drawn, then capture it. */
export async function snap(page: Page, id: string, opts: ShotOpts): Promise<void> {
  await freeze(page)
  await shoot(page, id, opts)
}

async function sheet(group: Group, shots: ShotRecord[]): Promise<void> {
  if (shots.length === 0) return
  const cols = 4, cw = 320, ch = 180, pad = 8, lh = 16
  const rows = Math.ceil(shots.length / cols)
  const c = createCanvas(cols * (cw + pad) + pad, rows * (ch + lh + pad) + pad)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#16131c'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.font = '11px sans-serif'
  for (const [i, s] of shots.entries()) {
    const img = await loadImage(readFileSync(join(OUT, s.file)))
    const k = Math.min(cw / img.width, ch / img.height)
    const x0 = pad + (i % cols) * (cw + pad)
    const y0 = pad + Math.floor(i / cols) * (ch + lh + pad)
    ctx.drawImage(img, x0 + (cw - img.width * k) / 2, y0 + (ch - img.height * k) / 2, img.width * k, img.height * k)
    ctx.fillStyle = '#f5e6c8'
    ctx.fillText(s.id, x0, y0 + ch + 12)
  }
  writeFileSync(join(OUT, `sheet-${group}.png`), c.toBuffer('image/png'))
}

/** Merge every recorded shot (last capture of an id wins) into the manifest and sheets. */
export async function assemble(commit: string): Promise<number> {
  const lines = existsSync(SHOTS) ? readFileSync(SHOTS, 'utf8').split('\n').filter(Boolean) : []
  const byId = new Map<string, ShotRecord>()
  for (const l of lines) {
    const r = JSON.parse(l) as ShotRecord
    byId.set(r.id, r)
  }
  const shots = [...byId.values()]
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({ capturedAt: new Date().toISOString(), commit, count: shots.length, shots }, null, 2))
  for (const g of ['flow', 'stages', 'platform'] as const) await sheet(g, shots.filter((s) => s.group === g))
  return shots.length
}
