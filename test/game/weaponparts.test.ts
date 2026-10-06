import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { publishWeaponArtRecords } from '../../src/game/adapters/weapon-art'
import { drawKindPose, artBoxFor, vectorKinds, isVectorProp } from '../../src/game/art/registry'
import { ENEMY_FIGURES, HERO_FIGURES, WEAPONS } from '../../src/game/art/figures'
import { materials } from '../../src/game/art/palette'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { applyBuild, FIG_H, FIG_W, type Skeleton } from '../../src/game/art/rig'
import { addWeapon, traceBow } from '../../src/game/art/weapons'
import { BOW_REF_HALF, weaponCellPainter, type WeaponArt } from '../../src/game/art/weapon-parts'
import { BOW_REF_HALF as GEN_BOW_REF, DENSITY, WEAPON_BOUNDS, WEAPON_SPECS, paintWeaponSheet } from '../../scripts/prepare-weapon-cells.mjs'
import { loadCastArt } from './cast-art'
import { assessWeaponReach, opaqueBounds } from '../../vision/sprite-metrics'
import { MIN_WEAPON_REACH_PX } from '../../vision/thresholds'

/**
 * BODY-21 measurable acceptance: painted weapon cells on the EXACT
 * procedural geometry (same length, grip, rotation), one shared pack with
 * the usual signature gate, procedural fallback without it.
 */
type Ctx = CanvasRenderingContext2D
const SCALE = 2
const ARMED_KINDS = vectorKinds().filter((k) => !isVectorProp(k) && k !== 'horse')
const KINDS = Object.keys(WEAPON_SPECS)
const napiFactory = (w: number, h: number): Ctx | null => {
  const canvas = createCanvas(w, h)
  return canvas.getContext('2d') as unknown as Ctx
}

async function weaponArt(): Promise<WeaponArt> {
  const meta = (await import('../../src/game/assets/weapons/prepared.json')).default as Record<string, {
    revision: string; density: number; parts: WeaponArt['parts']
  }>
  const sheet = (await loadImage('src/game/assets/weapons/weapons-sheet.png')) as unknown as CanvasImageSource
  return { revision: meta.weapons!.revision, sheet, density: meta.weapons!.density, parts: meta.weapons!.parts }
}

function maskIouU8(a: Uint8Array | Uint8ClampedArray, b: Uint8Array | Uint8ClampedArray): number {
  let inter = 0
  let union = 0
  for (let i = 3; i < a.length; i += 4) {
    const ma = (a[i] ?? 0) > 128
    const mb = (b[i] ?? 0) > 128
    if (ma && mb) inter += 1
    if (ma || mb) union += 1
  }
  return union === 0 ? 1 : inter / union
}

describe('BODY-21 painted weapons', () => {
  it('regenerates the weapon sheet byte-identically (deterministic)', async () => {
    const { png, prepared } = paintWeaponSheet()
    expect(Buffer.from(png).equals(readFileSync('src/game/assets/weapons/weapons-sheet.png'))).toBe(true)
    expect(prepared).toEqual(JSON.parse(readFileSync('src/game/assets/weapons/prepared.json', 'utf8')))
  })

  it('generator specs match figures.ts WEAPONS', () => {
    expect(BOW_REF_HALF).toBe(GEN_BOW_REF)
    for (const [kind, spec] of Object.entries(WEAPON_SPECS)) {
      const w = WEAPONS[kind as keyof typeof WEAPONS]
      expect(spec.length, `${kind} length`).toBe(w.length)
      expect(spec.haft, `${kind} haft`).toBe(w.haft)
      expect(spec.head, `${kind} head`).toBe(w.head)
      expect(spec.tassel ?? false, `${kind} tassel`).toBe(w.tassel ?? false)
    }
  })

  it('every kind + the tassel ship non-empty with sane geometry', async () => {
    const art = await weaponArt()
    expect(Object.keys(art.parts).sort()).toEqual([...KINDS, 'tassel'].sort())
    for (const name of [...KINDS, 'tassel']) {
      const c = art.parts[name]!
      const cv = createCanvas(c.w, c.h)
      const cx = cv.getContext('2d')
      cx.drawImage(art.sheet as never, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h)
      const px = cx.getImageData(0, 0, c.w, c.h).data
      let opaque = 0
      for (let i = 3; i < px.length; i += 4) if ((px[i] ?? 0) > 128) opaque += 1
      expect(opaque, `${name} empty`).toBeGreaterThan(200)
      expect(opaque / (c.w * c.h), `${name} fill`).toBeGreaterThan(0.12)
      expect(c.originX, `${name} origin x`).toBeGreaterThanOrEqual(c.x)
      expect(c.originX, `${name} origin x`).toBeLessThanOrEqual(c.x + c.w)
      expect(c.originY, `${name} origin y`).toBeGreaterThanOrEqual(c.y)
      expect(c.originY, `${name} origin y`).toBeLessThanOrEqual(c.y + c.h)
    }
  })

  it('painted silhouettes match the procedural geometry (IoU)', async () => {
    // Same frame, same reference grip (0.34), fills only (no ink on either
    // side): the painted cell must cover the procedural paths. Tassel
    // included at rot 0, where weapon frame == figure frame.
    const art = await weaponArt()
    const failures: string[] = []
    for (const kind of KINDS) {
      if (kind === 'bow') continue
      const spec = WEAPONS[kind as keyof typeof WEAPONS]
      const cell = art.parts[kind]!
      const [x0, y0] = WEAPON_BOUNDS[kind]!
      const grip = 0.34
      // Painted side. Anchor at the absolute grip point (L*grip): the
      // painter lands the grip there, aligning with the procedural side.
      const pc = createCanvas(cell.w, cell.h)
      const pctx = pc.getContext('2d')
      pctx.scale(DENSITY, DENSITY)
      pctx.translate(-x0, -y0)
      weaponCellPainter(art, { anchor: { x: spec.length * grip, y: 0 }, rot: 0, grip, length: spec.length, tassel: spec.tassel ?? false })(pctx as unknown as Ctx, kind)
      const pdata = pctx.getImageData(0, 0, cell.w, cell.h).data
      // Procedural side: the TRUE addWeapon traces, filled, shifted to absolute.
      const qc = createCanvas(cell.w, cell.h)
      const qctx = qc.getContext('2d')
      qctx.scale(DENSITY, DENSITY)
      qctx.translate(-x0 + spec.length * grip, -y0)
      const plan = { weapon: kind, build: { height: 1, bulk: 1, shoulders: 1, head: 1 } } as never
      const pose = { handN: { x: 0, y: 0 }, weaponRot: 0, weaponGrip: grip } as Skeleton
      const traces: Array<(c: Ctx) => void> = []
      addWeapon((t) => traces.push(t as (c: Ctx) => void), plan, pose, materials(0, 0, 0))
      for (const t of traces) {
        qctx.save()
        t(qctx as unknown as Ctx)
        qctx.fillStyle = '#fff'
        qctx.fill()
        qctx.restore()
      }
      const qdata = qctx.getImageData(0, 0, cell.w, cell.h).data
      const iou = maskIouU8(pdata, qdata)
      if (iou < 0.8) failures.push(`${kind} IoU ${iou.toFixed(3)}`)
    }
    // Bow at three reference draws: the painter scales x by fore/H0.
    for (const fore of [21, 26, 30]) {
      const cell = art.parts.bow!
      const [x0, y0] = WEAPON_BOUNDS.bow!
      const pc = createCanvas(cell.w, cell.h)
      const pctx = pc.getContext('2d')
      pctx.scale(DENSITY, DENSITY)
      pctx.translate(-x0, -y0)
      weaponCellPainter(art, { anchor: { x: 0, y: 0 }, rot: 0, grip: 1 - fore / 42, length: 42, tassel: false })(pctx as unknown as Ctx, 'bow')
      const qc = createCanvas(cell.w, cell.h)
      const qctx = qc.getContext('2d')
      qctx.scale(DENSITY, DENSITY)
      qctx.translate(-x0, -y0)
      qctx.save()
      traceBow(qctx as unknown as CanvasRenderingContext2D, fore)
      qctx.fillStyle = '#fff'
      qctx.fill()
      // String + riser: part of the procedural bow silhouette too.
      qctx.fillRect(-fore, -10.55, fore * 2, 1.1)
      qctx.beginPath()
      qctx.ellipse(0, 0, 4.6, 1.6, 0, 0, Math.PI * 2)
      qctx.fill()
      qctx.restore()
      const iou = maskIouU8(
        pctx.getImageData(0, 0, cell.w, cell.h).data,
        qctx.getImageData(0, 0, cell.w, cell.h).data,
      )
      if (iou < 0.75) failures.push(`bow@${fore} IoU ${iou.toFixed(3)}`)
    }
    expect(failures).toEqual([])
  })

  it('reach gates hold on painted renders (strike wider than idle)', async () => {
    const resources = await loadCastArt()
    const failures: string[] = []
    const raster = (kind: string, pose: PoseName) => {
      const box = artBoxFor(kind, pose)
      if (!box) throw new Error(`no box ${kind}:${pose}`)
      const canvas = createCanvas(box.width * SCALE, box.height * SCALE)
      const ctx = canvas.getContext('2d')
      drawKindPose(ctx as unknown as Ctx, kind, pose, SCALE, resources)
      return {
        width: box.width * SCALE, height: box.height * SCALE,
        data: new Uint8Array(ctx.getImageData(0, 0, box.width * SCALE, box.height * SCALE).data),
      }
    }
    for (const kind of ARMED_KINDS) {
      const idle = raster(kind, 'idle')
      for (const strike of ['attack', 'attack2', 'thrust', 'chop', 'sweep'] as const) {
        const r = assessWeaponReach(idle, raster(kind, strike), `${kind}:${strike}`, MIN_WEAPON_REACH_PX * SCALE)
        if (!r.pass) failures.push(`${r.label}: ${r.failures.join('; ')}`)
      }
      for (const strike of ['attack', 'attack2', 'thrust', 'chop', 'sweep'] as const) {
        const strikeImg = raster(kind, strike)
        for (const withdrawn of ['windup', 'recover'] as const) {
          const r = assessWeaponReach(raster(kind, withdrawn), strikeImg,
            `${kind}:${withdrawn}-vs-${strike}`, MIN_WEAPON_REACH_PX * SCALE)
          if (!r.pass) failures.push(`${r.label}: ${r.failures.join('; ')}`)
        }
      }
    }
    expect(failures).toEqual([])
  }, 240_000)

  it('painted vs procedural drawn width agrees within 3u', async () => {
    // Reach byte-stability, directly: the same pose's silhouette width
    // must not move by more than the ink borders the paint drops.
    const resources = await loadCastArt()
    const failures: string[] = []
    const width = (kind: string, pose: PoseName, withWeapons: boolean): number => {
      const box = artBoxFor(kind, pose)
      if (!box) throw new Error(`no box ${kind}:${pose}`)
      const canvas = createCanvas(box.width * SCALE, box.height * SCALE)
      const ctx = canvas.getContext('2d')
      drawKindPose(ctx as unknown as Ctx, kind, pose, SCALE,
        withWeapons ? resources : { ...resources, weapons: undefined })
      const data = ctx.getImageData(0, 0, box.width * SCALE, box.height * SCALE).data
      const b = opaqueBounds({ width: box.width * SCALE, height: box.height * SCALE, data: new Uint8Array(data) })
      return b === null ? 0 : (b.x1 - b.x0 + 1) / SCALE
    }
    for (const kind of ARMED_KINDS) {
      for (const pose of Object.keys(POSE_TABLE) as PoseName[]) {
        const a = width(kind, pose, true)
        const b = width(kind, pose, false)
        if (Math.abs(a - b) > 3) failures.push(`${kind}:${pose} ${a.toFixed(1)} vs ${b.toFixed(1)}`)
      }
    }
    expect(failures).toEqual([])
  }, 240_000)

  it('tassels hang in the gravity frame on painted renders', async () => {
    const resources = await loadCastArt()
    const id = 'guanyu'
    const plan = HERO_FIGURES[id]!
    for (const poseName of ['idle', 'attack'] as PoseName[]) {
      const pose = (await import('../../src/game/art/weapons')).weaponPose(plan, applyBuild(POSE_TABLE[poseName], plan.build))
      const box = artBoxFor(id, poseName)
      if (!box) throw new Error('no box')
      const canvas = createCanvas(box.width * SCALE, box.height * SCALE)
      const ctx = canvas.getContext('2d')
      drawKindPose(ctx as unknown as Ctx, id, poseName, SCALE, resources)
      const data = ctx.getImageData(0, 0, box.width * SCALE, box.height * SCALE).data
      const spec = WEAPONS[plan.weapon]
      const anchor = pose.weaponAnchor ?? pose.handN
      const fore = spec.length * (1 - pose.weaponGrip)
      const sx = fore - 7.5
      const ox = (box.width - FIG_W) / 2
      const oy = box.height - FIG_H
      const sockX = (anchor.x + sx * Math.cos(pose.weaponRot) + ox) * SCALE
      const sockY = (anchor.y + sx * Math.sin(pose.weaponRot) + oy) * SCALE
      // Tassel red lives BELOW the socket in figure space, both poses.
      let below = 0
      let above = 0
      const W = box.width * SCALE
      const H = box.height * SCALE
      for (let y = Math.round(sockY - 11 * SCALE); y <= Math.round(sockY + 11 * SCALE); y += 1) {
        for (let x = Math.round(sockX - 4 * SCALE); x <= Math.round(sockX + 4 * SCALE); x += 1) {
          if (x < 0 || y < 0 || x >= W || y >= H) continue
          const p = (y * W + x) * 4
          if ((data[p + 3] ?? 0) < 128) continue
          const isRed = (data[p] ?? 0) > 120 && (data[p] ?? 0) - (data[p + 1] ?? 0) > 40 && (data[p] ?? 0) - (data[p + 2] ?? 0) > 40
          if (!isRed) continue
          if (y > sockY + 1 * SCALE) below += 1
          else if (y < sockY - 1 * SCALE) above += 1
        }
      }
      expect(below, `${poseName}: no tassel red below the socket`).toBeGreaterThanOrEqual(20)
      expect(above, `${poseName}: tassel red above the socket (rotated with weapon?)`).toBeLessThan(below)
    }
  })

  it('falls back to inked procedural weapons without the pack', async () => {
    // The procedural haft carries exact-INK edge pixels; the painted one
    // carries none. Sampled on bare haft 15-25u ahead of the grip (no hand).
    const resources = await loadCastArt()
    for (const [id, poseName] of [['guanyu', 'attack'], ['xuchu', 'attack']] as const) {
      const plan = (HERO_FIGURES[id] ?? ENEMY_FIGURES[id])!
      const { weaponPose } = await import('../../src/game/art/weapons')
      const pose = weaponPose(plan, applyBuild(POSE_TABLE[poseName], plan.build))
      const box = artBoxFor(id, poseName)
      if (!box) throw new Error('no box')
      const countInk = (withWeapons: boolean): number => {
        const canvas = createCanvas(box.width * SCALE, box.height * SCALE)
        const ctx = canvas.getContext('2d')
        drawKindPose(ctx as unknown as Ctx, id, poseName, SCALE,
          withWeapons ? resources : { ...resources, weapons: undefined })
        const data = ctx.getImageData(0, 0, box.width * SCALE, box.height * SCALE).data
        const anchor = pose.weaponAnchor ?? pose.handN
        const ox = (box.width - FIG_W) / 2
        const oy = box.height - FIG_H
        const c = Math.cos(pose.weaponRot)
        const s = Math.sin(pose.weaponRot)
        let n = 0
        const W = box.width * SCALE
        const H = box.height * SCALE
        for (let t = 15; t <= 25; t += 0.5) {
          for (let o = -3.5; o <= 3.5; o += 0.5) {
            const x = Math.round((anchor.x + t * c - o * s + ox) * SCALE)
            const y = Math.round((anchor.y + t * s + o * c + oy) * SCALE)
            if (x < 0 || y < 0 || x >= W || y >= H) continue
            const p = (y * W + x) * 4
            if (data[p] === 0x14 && data[p + 1] === 0x0f && data[p + 2] === 0x14) n += 1
          }
        }
        return n
      }
      const bare = countInk(false)
      const painted = countInk(true)
      expect(bare, `${id}: procedural haft lacks ink edges`).toBeGreaterThanOrEqual(30)
      expect(painted, `${id}: painted haft carries ink`).toBeLessThan(12)
    }
  })

  it('publishes a valid pack and rejects missing/dims/tampered sheets', async () => {
    const meta = (await import('../../src/game/assets/weapons/prepared.json')).default as Record<string, {
      revision: string; density: number; sheet: { width: number; height: number }
      parts: WeaponArt['parts']; signatures: { sheet: string }; sha256: { sheet: string }
    }>
    const img = await loadImage('src/game/assets/weapons/weapons-sheet.png')
    const cv = createCanvas(img.width, img.height)
    cv.getContext('2d').drawImage(img, 0, 0)
    const registry = new Map<string, unknown>()
    const scene = {
      textures: {
        exists: (k: string): boolean => k === 'weapon-source:weapons',
        get: (): { getSourceImage: () => unknown } => ({ getSourceImage: () => cv as unknown }),
      },
      registry: {
        get: (k: string): unknown => registry.get(k),
        set: (k: string, v: unknown): void => {
          registry.set(k, v)
        },
      },
    }
    const out = publishWeaponArtRecords(scene as never, meta, napiFactory)
    expect(out?.revision).toBe('weapon-1')
    expect(Object.keys(out?.parts ?? {}).sort()).toEqual([...KINDS, 'tassel'].sort())
    const stored = registry.get('paintedHeroArt') as { weapons: WeaponArt }
    expect(Object.keys(stored.weapons.parts)).toContain('glaive')
    // Missing texture.
    const missing = {
      textures: { exists: (): boolean => false, get: (): never => { throw new Error('no') } },
      registry: { get: (): unknown => undefined, set: (): void => {} },
    }
    expect(publishWeaponArtRecords(missing as never, meta, napiFactory)).toBeUndefined()
    // Wrong dimensions.
    const small = createCanvas(8, 8)
    const wrong = {
      textures: {
        exists: (): boolean => true,
        get: (): { getSourceImage: () => unknown } => ({ getSourceImage: () => small as unknown }),
      },
      registry: { get: (): unknown => undefined, set: (): void => {} },
    }
    expect(publishWeaponArtRecords(wrong as never, meta, napiFactory)).toBeUndefined()
    // Right size, wrong content.
    const sheetDims = meta.weapons!.sheet
    const tampered = createCanvas(sheetDims.width, sheetDims.height)
    tampered.getContext('2d').fillStyle = '#123456'
    tampered.getContext('2d').fillRect(0, 0, sheetDims.width, sheetDims.height)
    const bad = {
      textures: {
        exists: (): boolean => true,
        get: (): { getSourceImage: () => unknown } => ({ getSourceImage: () => tampered as unknown }),
      },
      registry: { get: (): unknown => undefined, set: (): void => {} },
    }
    expect(publishWeaponArtRecords(bad as never, meta, napiFactory)).toBeUndefined()
  })
})
