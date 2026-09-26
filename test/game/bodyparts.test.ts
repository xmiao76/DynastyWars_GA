import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { HERO_FIGURES, ENEMY_FIGURES } from '../../src/game/art/figures'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { applyBuild } from '../../src/game/art/rig'
import { weaponPose } from '../../src/game/art/weapons'
import { drawFigure } from '../../src/game/art/draw'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'
import {
  BODY_PART_DEFS,
  BODY_PART_ORDER,
  bodyPainter,
  PARITY_FLOOR,
  maskIou,
  type BodyArt,
  type BodyPartName,
  type MaskImage,
} from '../../src/game/art/body-parts'
import { imageSignature, signatureMatches } from '../../src/game/art/image-signature'
import { publishBodyArtRecords } from '../../src/game/adapters/body-art'
import { generateFixtures } from '../../scripts/make-body-fixtures.mjs'
import type { Skeleton } from '../../src/game/art/rig'
import fixturePrepared from '../../src/game/assets/body-fixtures/prepared.json'

type Ctx = CanvasRenderingContext2D
const SCALE = 2
const POSES = Object.keys(POSE_TABLE) as PoseName[]

const PART_COLORS: Record<BodyPartName, [number, number, number]> = {
  cloth: [0x80, 0x80, 0x80],
  upperArmF: [0x30, 0x60, 0xe0],
  foreArmF: [0x30, 0xc0, 0xe0],
  thighF: [0x30, 0xe0, 0x80],
  shinF: [0xa0, 0xe0, 0x30],
  torso: [0xe0, 0x30, 0x30],
  thighN: [0x80, 0x40, 0xe0],
  shinN: [0x40, 0xe0, 0xc0],
  upperArmN: [0xe0, 0xa0, 0x30],
  foreArmN: [0xe0, 0x30, 0xa0],
  // BODY-20 hand cells: the fixture sheet carries none (they are optional
  // per-part), but the record must stay exhaustive over the union.
  gripN: [0xe0, 0x60, 0x30],
  gripF: [0xe0, 0x60, 0x30],
  relaxN: [0xe0, 0x60, 0x30],
  relaxF: [0xe0, 0x60, 0x30],
  wrapF: [0xe0, 0x60, 0x30],
}

type FixtureMeta = {
  revision: string
  skin: string
  density: number
  sheet: { width: number; height: number }
  parts: BodyArt['parts']
  signatures: { sheet: string }
  sha256: { sheet: string }
}

function preparedFixture(): FixtureMeta {
  const meta = (fixturePrepared as unknown as Record<string, FixtureMeta>).fixture
  if (!meta) throw new Error('no fixture prepared entry')
  return meta
}

async function fixtureArt(): Promise<BodyArt> {
  const meta = preparedFixture()
  const sheet = (await loadImage(
    'src/game/assets/body-fixtures/fixture-sheet.png',
  )) as unknown as CanvasImageSource
  return {
    id: 'fixture',
    revision: meta.revision,
    sheet,
    density: meta.density,
    parts: meta.parts,
    skin: parseInt(meta.skin.slice(1), 16),
  }
}

function renderFigure(
  plan: (typeof HERO_FIGURES)[string],
  pose: PoseName,
  body?: BodyArt,
): { pixels: Uint8ClampedArray; w: number; h: number } {
  // Canonical units, no margins: tests map joints directly to pixels.
  const W = 120
  const H = 110
  const canvas = createCanvas(W * SCALE, H * SCALE)
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)
  drawFigure(ctx as unknown as Ctx, plan, POSE_TABLE[pose], body ? { poseName: pose, body } : undefined)
  return { pixels: ctx.getImageData(0, 0, W * SCALE, H * SCALE).data, w: W * SCALE, h: H * SCALE }
}

function countColor(r: { pixels: Uint8ClampedArray; w: number; h: number }, rgb: [number, number, number]): number {
  let n = 0
  for (let i = 0; i < r.pixels.length; i += 4) {
    if (r.pixels[i] === rgb[0] && r.pixels[i + 1] === rgb[1] && r.pixels[i + 2] === rgb[2]) n += 1
  }
  return n
}

function pixelAt(r: { pixels: Uint8ClampedArray; w: number }, x: number, y: number): [number, number, number] {
  const p = (Math.round(y) * r.w + Math.round(x)) * 4
  return [r.pixels[p] ?? 0, r.pixels[p + 1] ?? 0, r.pixels[p + 2] ?? 0]
}

describe('BODY-2 part table', () => {
  it('lists ten parts in spec draw order with sane geometry', () => {
    expect(BODY_PART_ORDER).toEqual([
      'cloth',
      'upperArmF',
      'foreArmF',
      'thighF',
      'shinF',
      'torso',
      'thighN',
      'shinN',
      'upperArmN',
      'foreArmN',
    ])
    for (const name of BODY_PART_ORDER) {
      const def = BODY_PART_DEFS[name]
      expect(def.naturalLen).toBeGreaterThan(0)
      expect(Number.isFinite(def.naturalLen)).toBe(true)
      expect(POSE_TABLE.idle[def.from as keyof Skeleton]).toBeTruthy()
      expect(POSE_TABLE.idle[def.to as keyof Skeleton]).toBeTruthy()
    }
    expect(PARITY_FLOOR).toBe(0.75)
  })

  it('keeps fixture cells inside the sheet with pivots on the joint line', () => {
    const meta = preparedFixture()
    for (const name of BODY_PART_ORDER) {
      const c = meta.parts[name]
      if (!c) throw new Error(`fixture lacks ${name}`)
      expect(c.x + c.w).toBeLessThanOrEqual(meta.sheet.width)
      expect(c.y + c.h).toBeLessThanOrEqual(meta.sheet.height)
      expect(c.pivotX).toBeGreaterThanOrEqual(0)
      expect(c.pivotY).toBeGreaterThanOrEqual(0)
      expect(c.pivotX).toBeLessThanOrEqual(c.w)
      expect(c.pivotY).toBeLessThanOrEqual(c.h)
    }
  })
})

describe('BODY-2 fixture preparation', () => {
  it('regenerates byte-identical fixtures (deterministic)', async () => {
    const { png, prepared } = generateFixtures()
    expect(Buffer.from(png).equals(readFileSync('src/game/assets/body-fixtures/fixture-sheet.png'))).toBe(true)
    expect(prepared).toEqual(JSON.parse(readFileSync('src/game/assets/body-fixtures/prepared.json', 'utf8')))
  })

  it('matches committed sha256 and content signatures', async () => {
    const data = readFileSync('src/game/assets/body-fixtures/fixture-sheet.png')
    const meta = preparedFixture()
    expect(createHash('sha256').update(data).digest('hex')).toBe(meta.sha256.sheet)
    const img = await loadImage('src/game/assets/body-fixtures/fixture-sheet.png')
    const cv = createCanvas(img.width, img.height)
    const ctx = cv.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const sig = imageSignature(ctx.getImageData(0, 0, img.width, img.height))
    expect(signatureMatches(sig, meta.signatures.sheet)).toBe(true)
  })
})

describe('BODY-2 paper-doll rendering', () => {
  it('paints every part at its joints', async () => {
    const art = await fixtureArt()
    const plan = HERO_FIGURES['huangzhong']
    if (!plan) throw new Error('no huangzhong plan')
    const r = renderFigure(plan, 'idle', art)
    // Presence only - far limbs are mostly tucked behind the torso by
    // design (upperArmF shows single-digit pixels). Placement correctness
    // is enforced by the order test below and the parity gate.
    for (const name of BODY_PART_ORDER) {
      if (name === 'cloth') continue // huangzhong wears no cape
      expect(countColor(r, PART_COLORS[name]), `${name} paints nothing`).toBeGreaterThan(0)
    }
  })

  it('orders parts near-over-far and limbs-over-torso at the joints', async () => {
    const art = await fixtureArt()
    // Zhang Fei: bristle beard, so no long procedural beard covers the
    // sample points (huangzhong's beard falls over the shoulder sample).
    const plan = HERO_FIGURES['zhangfei']
    if (!plan) throw new Error('no zhangfei plan')
    const r = renderFigure(plan, 'idle', art)
    const pose = applyBuild(POSE_TABLE.idle, plan.build)
    const at = (x: number, y: number): [number, number, number] => pixelAt(r, x * SCALE, y * SCALE)
    // 15% down the near upper arm: inside the torso span, must show arm.
    const ax = pose.shoulderN.x + (pose.elbowN.x - pose.shoulderN.x) * 0.15
    const ay = pose.shoulderN.y + (pose.elbowN.y - pose.shoulderN.y) * 0.15
    expect(at(ax, ay)).toEqual(PART_COLORS.upperArmN)
    // Forearm over upper arm: the elbow neighborhood must show the
    // forearm's color well clear of single-pixel antialiasing - the pike
    // haft passes through the grip, so no single pixel there is robust.
    // (Verified against a zoomed dump: the magenta forearm band runs left
    // of the brown haft; see artifacts/elbow-zoom.png.)
    const ex0 = Math.round((pose.elbowN.x - 6) * SCALE)
    const ey0 = Math.round((pose.elbowN.y - 6) * SCALE)
    const ex1 = Math.round((pose.elbowN.x + 6) * SCALE)
    const ey1 = Math.round((pose.elbowN.y + 6) * SCALE)
    let elbowFore = 0
    for (let y = ey0; y < ey1; y += 1) {
      for (let x = ex0; x < ex1; x += 1) {
        const [pr, pg, pb] = pixelAt(r, x, y)
        if (pr === PART_COLORS.foreArmN[0] && pg === PART_COLORS.foreArmN[1] && pb === PART_COLORS.foreArmN[2]) {
          elbowFore += 1
        }
      }
    }
    expect(elbowFore).toBeGreaterThan(30)
    // Knee: shin covers thigh. Sampled on the far leg: the near-vertical
    // pike runs the full height through the near side (grip to ground),
    // so only far-side pixels are clean here.
    const kx = pose.kneeF.x + (pose.footF.x - pose.kneeF.x) * 0.25
    const ky = pose.kneeF.y + (pose.footF.y - pose.kneeF.y) * 0.25
    expect(at(kx, ky)).toEqual(PART_COLORS.shinF)
    // Hip: torso covers the far thigh root.
    const hx = pose.hipF.x + (pose.kneeF.x - pose.hipF.x) * 0.1
    const hy = pose.hipF.y + (pose.kneeF.y - pose.hipF.y) * 0.1
    expect(at(hx, hy)).toEqual(PART_COLORS.torso)
  })

  it('threads through the registry for headless kinds (mook path)', async () => {
    const art = await fixtureArt()
    const box = artBoxFor('soldier', 'idle')
    if (!box) throw new Error('no art box')
    const canvas = createCanvas(box.width * SCALE, box.height * SCALE)
    const ctx = canvas.getContext('2d')
    const ok = drawKindPose(ctx as unknown as Ctx, 'soldier', 'idle', SCALE, {
      heroes: {},
      bodies: { soldier: art },
    })
    expect(ok).toBe(true)
    const pixels = ctx.getImageData(0, 0, box.width * SCALE, box.height * SCALE).data
    const r = { pixels, w: box.width * SCALE, h: box.height * SCALE }
    expect(countColor(r, PART_COLORS.torso)).toBeGreaterThan(40)
  })

  it('falls back per part: a missing cloth keeps its procedural cape', async () => {
    const art = await fixtureArt()
    const plan = HERO_FIGURES['zhaoyun']
    if (!plan) throw new Error('no zhaoyun plan')
    const full = renderFigure(plan, 'idle', art)
    const rest = { ...art.parts }
    delete rest.cloth
    const partial: BodyArt = { ...art, parts: rest }
    const r = renderFigure(plan, 'idle', partial)
    // Paper-doll torso still paints...
    expect(countColor(r, PART_COLORS.torso)).toBeGreaterThan(40)
    // ...but the render differs exactly where the procedural cape returns.
    let diff = 0
    for (let i = 0; i < r.pixels.length; i += 4) {
      if (
        r.pixels[i] !== full.pixels[i] ||
        r.pixels[i + 1] !== full.pixels[i + 1] ||
        r.pixels[i + 2] !== full.pixels[i + 2] ||
        r.pixels[i + 3] !== full.pixels[i + 3]
      ) {
        diff += 1
      }
    }
    expect(diff).toBeGreaterThan(0)
  })

  it('falls back to fully procedural art without body resources', () => {
    const box = artBoxFor('soldier', 'idle')
    if (!box) throw new Error('no art box')
    const render = (resources?: import('../../src/game/art/hero-resources').ArtResources): Uint8ClampedArray => {
      const canvas = createCanvas(box.width * SCALE, box.height * SCALE)
      const ctx = canvas.getContext('2d')
      drawKindPose(
        ctx as unknown as Ctx,
        'soldier',
        'idle',
        SCALE,
        resources,
      )
      return ctx.getImageData(0, 0, box.width * SCALE, box.height * SCALE).data
    }
    const plain = render(undefined)
    const empty = render({ heroes: {}, bodies: {} })
    expect(Buffer.from(empty).equals(Buffer.from(plain))).toBe(true)
  })
})

describe('BODY-2 publish atomicity', () => {
  const napiFactory = (w: number, h: number): Ctx | null => {
    const canvas = createCanvas(w, h)
    return canvas.getContext('2d') as unknown as Ctx
  }

  function fakeScene(images: Record<string, { width: number; height: number }>): {
    scene: unknown
    registry: Map<string, unknown>
  } {
    const registry = new Map<string, unknown>()
    const scene = {
      textures: {
        exists: (k: string): boolean => k in images,
        get: (k: string): { getSourceImage: () => { width: number; height: number } } => ({
          getSourceImage: () => {
            const img = images[k]
            if (!img) throw new Error(`missing ${k}`)
            return { width: img.width, height: img.height }
          },
        }),
      },
      registry: {
        get: (k: string): unknown => registry.get(k),
        set: (k: string, v: unknown): void => {
          registry.set(k, v)
        },
      },
    }
    return { scene, registry }
  }

  it('publishes a valid sheet and preserves already-published heads', async () => {
    const img = await loadImage('src/game/assets/body-fixtures/fixture-sheet.png')
    const meta = preparedFixture()
    // Canvas-backed source: napi drawImage accepts canvases, like the DOM
    // path accepts decoded images.
    const cv = createCanvas(img.width, img.height)
    cv.getContext('2d').drawImage(img, 0, 0)
    const registry = new Map<string, unknown>()
    const scene = {
      textures: {
        exists: (k: string): boolean => k === 'body-source:fixture',
        get: (): { getSourceImage: () => unknown } => ({ getSourceImage: () => cv as unknown }),
      },
      registry: {
        get: (k: string): unknown => registry.get(k),
        set: (k: string, v: unknown): void => {
          registry.set(k, v)
        },
      },
    }
    registry.set('paintedHeroArt', { heroes: { zhaoyun: { id: 'zhaoyun' } } })
    const out = publishBodyArtRecords(
      scene as never,
      { fixture: { sheet: 'fixture-sheet.png' } },
      { fixture: meta },
      napiFactory,
    )
    expect(Object.keys(out)).toEqual(['fixture'])
    expect(out.fixture?.revision).toBe('fixture-1')
    expect(out.fixture?.skin).toBe(parseInt('c08060', 16))
    const stored = registry.get('paintedHeroArt') as { heroes: object; bodies: object }
    expect(Object.keys(stored.heroes)).toEqual(['zhaoyun'])
    expect(Object.keys(stored.bodies)).toEqual(['fixture'])
  })

  it('rejects missing, undersized and tampered sheets', async () => {
    const meta = preparedFixture()
    // Missing texture.
    const missing = fakeScene({})
    expect(
      publishBodyArtRecords(missing.scene as never, { fixture: { sheet: 'x' } }, { fixture: meta }, napiFactory),
    ).toEqual({})
    // Wrong dimensions.
    const small = createCanvas(8, 8)
    const wrong = {
      textures: {
        exists: (): boolean => true,
        get: (): { getSourceImage: () => unknown } => ({ getSourceImage: () => small as unknown }),
      },
      registry: { get: (): unknown => undefined, set: (): void => {} },
    }
    expect(
      publishBodyArtRecords(wrong as never, { fixture: { sheet: 'x' } }, { fixture: meta }, napiFactory),
    ).toEqual({})
    // Right size, wrong content.
    const tampered = createCanvas(meta.sheet.width, meta.sheet.height)
    const tctx = tampered.getContext('2d')
    tctx.fillStyle = '#123456'
    tctx.fillRect(0, 0, meta.sheet.width, meta.sheet.height)
    const bad = {
      textures: {
        exists: (): boolean => true,
        get: (): { getSourceImage: () => unknown } => ({ getSourceImage: () => tampered as unknown }),
      },
      registry: { get: (): unknown => undefined, set: (): void => {} },
    }
    expect(
      publishBodyArtRecords(bad as never, { fixture: { sheet: 'x' } }, { fixture: meta }, napiFactory),
    ).toEqual({})
  })
})

describe('BODY-2 mask IoU', () => {
  function mask(w: number, h: number, fill: (x: number, y: number) => boolean): MaskImage {
    const data = new Uint8Array(w * h * 4)
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        if (fill(x, y)) data[(y * w + x) * 4 + 3] = 255
      }
    }
    return { width: w, height: h, data }
  }

  it('scores identical, half and disjoint masks', () => {
    const full = mask(8, 8, () => true)
    const half = mask(8, 8, (x) => x < 4)
    const empty = mask(8, 8, () => false)
    expect(maskIou(full, full)).toBe(1)
    expect(maskIou(half, full)).toBeCloseTo(0.5, 6)
    expect(maskIou(half, empty)).toBe(0)
    expect(maskIou(full, mask(9, 8, () => true))).toBeNaN()
  })

  it('holds the parity floor on every pose of the wired pilot', async () => {
    const art = await fixtureArt()
    const plan = HERO_FIGURES['huangzhong']
    if (!plan) throw new Error('no huangzhong plan')
    const box = (pose: PoseName): { width: number; height: number } => {
      const b = artBoxFor('huangzhong', pose)
      if (!b) throw new Error(`no box for ${pose}`)
      return b
    }
    const render = (pose: PoseName, body?: BodyArt): MaskImage => {
      const b = box(pose)
      const canvas = createCanvas(b.width * SCALE, b.height * SCALE)
      const ctx = canvas.getContext('2d')
      drawKindPose(ctx as unknown as Ctx, 'huangzhong', pose, SCALE, {
        heroes: {},
        bodies: body ? { huangzhong: body } : {},
      })
      return {
        width: b.width * SCALE,
        height: b.height * SCALE,
        data: new Uint8Array(ctx.getImageData(0, 0, b.width * SCALE, b.height * SCALE).data),
      }
    }
    for (const pose of POSES) {
      const iou = maskIou(render(pose), render(pose, art))
      expect(iou, `${pose} parity ${iou.toFixed(3)}`).toBeGreaterThanOrEqual(PARITY_FLOOR)
    }
  })

  it('holds the parity floor on every wired production fighter', async () => {
    const packs = ['hero-bodies', 'mook-bodies', 'boss-bodies'] as const
    let covered = 0
    for (const pack of packs) {
      const prepared = (await import(`../../src/game/assets/${pack}/prepared.json`)).default as Record<
        string,
        { revision: string; skin: string; density: number; parts: BodyArt['parts'] }
      >
      for (const id of Object.keys(prepared)) {
        covered += 1
        const meta = prepared[id]
        if (!meta) continue
        const sheet = (await loadImage(
          `src/game/assets/${pack}/${id}-sheet.png`,
        )) as unknown as CanvasImageSource
      const art: BodyArt = {
        id,
        revision: meta.revision,
        sheet,
        density: meta.density,
        parts: meta.parts,
        skin: parseInt(meta.skin.slice(1), 16),
      }
      for (const pose of POSES) {
        const b = artBoxFor(id, pose)
        if (!b) throw new Error(`no box for ${id}:${pose}`)
        const render = (body?: BodyArt): MaskImage => {
          const canvas = createCanvas(b.width * SCALE, b.height * SCALE)
          const ctx = canvas.getContext('2d')
          drawKindPose(ctx as unknown as Ctx, id, pose, SCALE, {
            heroes: {},
            bodies: body ? { [id]: body } : {},
          })
          return {
            width: b.width * SCALE,
            height: b.height * SCALE,
            data: new Uint8Array(ctx.getImageData(0, 0, b.width * SCALE, b.height * SCALE).data),
          }
        }
        const iou = maskIou(render(undefined), render(art))
        expect(iou, `${id}:${pose} parity ${iou.toFixed(3)}`).toBeGreaterThanOrEqual(PARITY_FLOOR)
        // Liveness: the paper-doll render must DIFFER from procedural, or a
        // silent whole-fighter fallback (which renders procedurally, IoU 1.0)
        // would pass the parity gate above.
        expect(iou, `${id}:${pose} looks fallen back`).toBeLessThan(0.99)
        }
      }
    }
    expect(covered, 'production packs must cover heroes + mooks + bosses').toBe(17)
    // 17 fighters x 14 poses x 2 renders: ~3.3 s alone, and the 5 s default
    // was exceeded under full-suite contention (BODY-17 added the per-movement
    // sheet generator). A budget, not a relaxed assertion.
  }, 60_000)

  it('seats every painted part on its own joint segment', async () => {
    // The precise breakage test whole-figure IoU cannot be: render each
    // part alone through the real painter and demand ink near its segment.
    // Enrichment never moves a part off its joints, so this is immune to
    // style changes and trips only on missing/misseated parts.
    const packs = [
      { dir: 'hero-bodies', plans: HERO_FIGURES },
      { dir: 'mook-bodies', plans: ENEMY_FIGURES },
      { dir: 'boss-bodies', plans: ENEMY_FIGURES },
    ] as const
    for (const { dir, plans } of packs) {
      const prepared = (await import(`../../src/game/assets/${dir}/prepared.json`)).default as Record<
        string,
        { revision: string; skin: string; density: number; parts: BodyArt['parts'] }
      >
      for (const id of Object.keys(prepared)) {
        const meta = prepared[id]
        if (!meta) continue
        const sheet = (await loadImage(`src/game/assets/${dir}/${id}-sheet.png`)) as unknown as CanvasImageSource
        const art: BodyArt = {
          id,
          revision: meta.revision,
          sheet,
          density: meta.density,
          parts: meta.parts,
          skin: parseInt(meta.skin.slice(1), 16),
        }
        const plan = plans[id] as (typeof HERO_FIGURES)[string] | undefined
        if (!plan) throw new Error(`no plan for ${id}`)
        for (const poseName of ['idle', 'attack', 'down'] as PoseName[]) {
          const pose = weaponPose(plan, applyBuild(POSE_TABLE[poseName], plan.build))
          const joints = pose as unknown as Record<string, { x: number; y: number }>
          const paint = bodyPainter(art, joints, plan.build.bulk)
          for (const part of Object.keys(meta.parts) as BodyPartName[]) {
            const def = BODY_PART_DEFS[part]
            const a = joints[def.from]
            const b = joints[def.to]
            if (!a || !b) throw new Error(`no joints for ${part}`)
            const canvas = createCanvas(120 * SCALE, 110 * SCALE)
            const ctx = canvas.getContext('2d')
            ctx.scale(SCALE, SCALE)
            paint(ctx as unknown as Ctx, part)
            const data = ctx.getImageData(0, 0, 120 * SCALE, 110 * SCALE).data
            let n = 0
            let sx = 0
            let sy = 0
            for (let y = 0; y < 110 * SCALE; y += 1) {
              for (let x = 0; x < 120 * SCALE; x += 1) {
                if ((data[(y * 120 * SCALE + x) * 4 + 3] ?? 0) > 128) {
                  n += 1
                  sx += x
                  sy += y
                }
              }
            }
            expect(n, `${id}:${poseName}:${part} paints nothing`).toBeGreaterThan(20)
            const cx = sx / n / SCALE
            const cy = sy / n / SCALE
            const mx = (a.x + b.x) / 2
            const my = (a.y + b.y) / 2
            const segLen = Math.hypot(b.x - a.x, b.y - a.y)
            const drift = Math.hypot(cx - mx, cy - my)
            expect(drift, `${id}:${poseName}:${part} centroid off-segment`).toBeLessThan(segLen * 0.35 + 3)
          }
        }
      }
    }
  })
})
