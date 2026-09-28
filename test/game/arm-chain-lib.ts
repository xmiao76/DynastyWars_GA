import { createCanvas, type Canvas, type SKRSContext2D } from '@napi-rs/canvas'
import { BODY_PART_DEFS, bodyPainter, type BodyArt, type BodyPartName } from '../../src/game/art/body-parts'
import { DEFAULT_BANDS } from '../../src/game/art/draw'
import { ENEMY_FIGURES, HERO_FIGURES, type FigurePlan } from '../../src/game/art/figures'
import type { ArtResources, HeroArt } from '../../src/game/art/hero-resources'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'
import { applyBuild, FIG_H, FIG_W, type Pt, type Skeleton } from '../../src/game/art/rig'
import { weaponPose } from '../../src/game/art/weapons'

/**
 * Arm-chain detector (docs/VISUAL_REVIEW.md section 2a, step 3).
 *
 * Renders a fighter through the SHIPPING path (drawKindPose) three ways:
 *   plain    - exactly what the game draws;
 *   noShade  - the same art with the soft-shade gradients and cel bands
 *              swallowed (baseline for halo detection);
 *   ids      - every painted part recoloured to a flat ID colour, no shade,
 *              so each pixel's OWNER (which part is on top) is readable.
 * It also renders each arm part and hand cell ALONE (footprints) with the
 * same transform, then walks the shoulder-elbow-hand centreline to measure
 * joins and gaps in units. These are hints for the reviewer and a few hard
 * regression gates (test/game/arm-chain.test.ts); a metric never overrules
 * what the image shows.
 */

export const MOVES = Object.keys(POSE_TABLE) as PoseName[]
export const ID_NAMES = [
  'torso', 'upperArmN', 'foreArmN', 'upperArmF', 'foreArmF', 'gripN', 'gripF', 'wrapN', 'wrapF',
  'relaxN', 'relaxF', 'cloth', 'thighN', 'shinN', 'thighF', 'shinF', 'WEAPON', 'HEAD', 'BEARD', 'REAR',
] as const
export type IdName = (typeof ID_NAMES)[number]
export type Owner = IdName | 'BG' | 'mixed' | 'proc'
type RGB = [number, number, number]
/**
 * Hand-picked so the reviewer can tell parts apart by eye: near arm warm
 * (yellow upper, orange fore), far arm cool (cyan upper, blue fore), hands
 * red/magenta family, weapon white, beard brown. Every pair is >= 60 apart
 * (L1) so the classifier's 30 tolerance never confuses two parts.
 */
const PALETTE_RGB: Record<IdName, RGB> = {
  torso: [70, 70, 70], upperArmN: [255, 220, 0], foreArmN: [255, 130, 0],
  upperArmF: [0, 200, 255], foreArmF: [40, 90, 255], gripN: [230, 30, 30], gripF: [220, 0, 220],
  wrapN: [255, 150, 200], wrapF: [140, 60, 200], relaxN: [150, 90, 40], relaxF: [0, 150, 130],
  cloth: [120, 120, 40], thighN: [30, 110, 30], shinN: [60, 170, 60], thighF: [60, 80, 110],
  shinF: [90, 110, 140], WEAPON: [240, 240, 240], HEAD: [240, 200, 160], BEARD: [90, 50, 20], REAR: [120, 20, 20],
}
export const PALETTE: ReadonlyMap<IdName, RGB> = new Map(ID_NAMES.map((n): [IdName, RGB] => [n, PALETTE_RGB[n]]))
const rgbOf = (n: IdName): RGB => PALETTE.get(n) ?? [0, 0, 0]

export function planOf(id: string): FigurePlan {
  const plan = HERO_FIGURES[id] ?? ENEMY_FIGURES[id]
  if (!plan) throw new Error(`no figure plan for ${id}`)
  return plan
}

export function poseOf(id: string, move: PoseName): Skeleton {
  const plan = planOf(id)
  return weaponPose(plan, applyBuild(POSE_TABLE[move], plan.build))
}

type Img = { width: number; height: number }
function flat(img: CanvasImageSource, rgb: RGB): CanvasImageSource {
  const src = img as unknown as Img
  const cv = createCanvas(src.width, src.height)
  const g = cv.getContext('2d')
  g.drawImage(img as unknown as Canvas, 0, 0)
  const d = g.getImageData(0, 0, cv.width, cv.height)
  for (let i = 0; i < d.data.length; i += 4) {
    d.data[i] = rgb[0]
    d.data[i + 1] = rgb[1]
    d.data[i + 2] = rgb[2]
  }
  g.putImageData(d, 0, 0)
  return cv as unknown as CanvasImageSource
}

/** The body art with every part rect filled with its ID colour (alpha kept). */
export function idBody(b: BodyArt): BodyArt {
  const src = b.sheet as unknown as Img
  const cv = createCanvas(src.width, src.height)
  const g = cv.getContext('2d')
  g.drawImage(b.sheet as unknown as Canvas, 0, 0)
  const d = g.getImageData(0, 0, cv.width, cv.height)
  for (let i = 0; i < d.data.length; i += 4) {
    d.data[i] = 1
    d.data[i + 1] = 1
    d.data[i + 2] = 1
  }
  for (const [name, c] of Object.entries(b.parts)) {
    const col = PALETTE.get(name as IdName)
    if (!col || !c) continue
    for (let y = c.y; y < c.y + c.h; y += 1) {
      for (let x = c.x; x < c.x + c.w; x += 1) {
        const i = (y * cv.width + x) * 4
        d.data[i] = col[0]
        d.data[i + 1] = col[1]
        d.data[i + 2] = col[2]
      }
    }
  }
  g.putImageData(d, 0, 0)
  return { ...b, sheet: cv as unknown as CanvasImageSource }
}

/** Resources with `id`'s body, head layers and the weapon pack in ID colours. */
export function idResources(res: ArtResources, id: string): ArtResources {
  const bodies: Record<string, BodyArt> = { ...(res.bodies as Record<string, BodyArt>) }
  const heroes: Record<string, HeroArt> = { ...(res.heroes as Record<string, HeroArt>) }
  const b = bodies[id]
  if (b) bodies[id] = idBody(b)
  const h = heroes[id]
  if (h) heroes[id] = { ...h, head: flat(h.head, rgbOf('HEAD')), front: flat(h.front, rgbOf('BEARD')), rear: flat(h.rear, rgbOf('REAR')) }
  const out: ArtResources = { heroes, bodies }
  if (res.weapons) out.weapons = { ...res.weapons, sheet: flat(res.weapons.sheet, rgbOf('WEAPON')) }
  return out
}

/** Nearest ID colour; BG below alpha 8, 'mixed' below 128, 'proc' if no ID is close. */
export function owner(d: Uint8ClampedArray, i: number): Owner {
  const a = d[i + 3] ?? 0
  if (a < 8) return 'BG'
  if (a < 128) return 'mixed'
  let best: Owner = 'proc'
  let bd = 30
  for (const [n, c] of PALETTE) {
    const e = Math.abs((d[i] ?? 0) - c[0]) + Math.abs((d[i + 1] ?? 0) - c[1]) + Math.abs((d[i + 2] ?? 0) - c[2])
    if (e < bd) {
      bd = e
      best = n
    }
  }
  return best
}

export interface ShadeOpts {
  /** Swallow the soft-shade radial gradients and the cel-band fills. */
  noShade?: boolean
  /** Negative control: turn every 'source-atop' into 'source-over'. */
  noSourceAtop?: boolean
}
const BANDS = new Set<string>(DEFAULT_BANDS.map((b) => b.fill))
const FAKE = Symbol('fake-gradient')

function wrapCtx(t: SKRSContext2D, o: ShadeOpts): CanvasRenderingContext2D {
  if (!o.noShade && !o.noSourceAtop) return t as unknown as CanvasRenderingContext2D
  let style: unknown = null
  const target = t as unknown as Record<string | symbol, unknown>
  return new Proxy(target, {
    get(obj, k) {
      if (o.noShade && k === 'createRadialGradient') return () => ({ addColorStop() {}, [FAKE]: true })
      if (o.noShade && k === 'fill') {
        return (...a: unknown[]): void => {
          if (typeof style === 'string' && BANDS.has(style)) return
          ;(obj.fill as (...x: unknown[]) => void).apply(obj, a)
        }
      }
      const v = obj[k]
      return typeof v === 'function' ? (v as (...x: unknown[]) => unknown).bind(obj) : v
    },
    set(obj, k, v) {
      if (k === 'fillStyle') {
        style = v
        if (v !== null && typeof v === 'object' && FAKE in (v as object)) {
          obj[k] = 'rgba(0,0,0,0)'
          return true
        }
      }
      if (o.noSourceAtop && k === 'globalCompositeOperation' && v === 'source-atop') {
        obj[k] = 'source-over'
        return true
      }
      obj[k] = v
      return true
    },
  }) as unknown as CanvasRenderingContext2D
}

export interface Frame {
  w: number
  h: number
  z: number
  /** Box margin and headroom in units: figure (x, y) -> px ((x + ox) z, (y + oy) z). */
  ox: number
  oy: number
}

export function frameOf(id: string, move: PoseName, z: number): Frame {
  const box = artBoxFor(id, move)
  if (!box) throw new Error(`no art box for ${id}:${move}`)
  return { w: Math.round(box.width * z), h: Math.round(box.height * z), z, ox: (box.width - FIG_W) / 2, oy: box.height - FIG_H }
}

export function renderMove(res: ArtResources, id: string, move: PoseName, z: number, o: ShadeOpts = {}): { cv: Canvas; data: Uint8ClampedArray } {
  const f = frameOf(id, move, z)
  const cv = createCanvas(f.w, f.h)
  const t = cv.getContext('2d')
  drawKindPose(wrapCtx(t, o), id, move, z, res)
  return { cv, data: t.getImageData(0, 0, f.w, f.h).data }
}

function footprint(f: Frame, draw: (g: CanvasRenderingContext2D) => void): Uint8ClampedArray {
  const cv = createCanvas(f.w, f.h)
  const g = cv.getContext('2d')
  g.scale(f.z, f.z)
  g.translate(f.ox, f.oy)
  draw(g as unknown as CanvasRenderingContext2D)
  return g.getImageData(0, 0, f.w, f.h).data
}

// ---------------------------------------------------------------- geometry

const CHAIN = {
  N: { upper: 'upperArmN', fore: 'foreArmN', shoulder: 'shoulderN', elbow: 'elbowN', hand: 'handN' },
  F: { upper: 'upperArmF', fore: 'foreArmF', shoulder: 'shoulderF', elbow: 'elbowF', hand: 'handF' },
} as const
export type Side = keyof typeof CHAIN
const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y)

/** Grip predicate, identical to figureShapes / drawFigure. */
export function farGripping(p: Skeleton): boolean {
  const gripDist = Math.abs((p.handF.x - p.handN.x) * Math.sin(p.weaponRot) - (p.handF.y - p.handN.y) * Math.cos(p.weaponRot))
  return gripDist < 3 && !p.lying
}

/** The hand cell drawn at each hand in this pose (mirrors drawFigure). */
export function handCellFor(p: Skeleton, side: Side): BodyPartName {
  if (side === 'N') return p.lying ? 'relaxN' : 'gripN'
  return farGripping(p) ? 'gripF' : 'relaxF'
}

interface Extent { first: number; last: number; minCol: number; maxCol: number }
const extentCache = new WeakMap<object, Map<string, Extent>>()
/** Opaque extent of a cell in device px (rows with >= 3 px of alpha >= 128). */
export function cellExtent(art: BodyArt, part: BodyPartName): Extent {
  let m = extentCache.get(art.sheet as object)
  if (!m) {
    m = new Map()
    extentCache.set(art.sheet as object, m)
  }
  const c = art.parts[part]
  if (!c) throw new Error(`no cell ${part}`)
  const key = `${part}:${c.x},${c.y},${c.w},${c.h}`
  const hit = m.get(key)
  if (hit) return hit
  const cv = createCanvas(c.w, c.h)
  const g = cv.getContext('2d')
  g.drawImage(art.sheet as unknown as Canvas, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h)
  const d = g.getImageData(0, 0, c.w, c.h).data
  const e: Extent = { first: c.h, last: -1, minCol: c.w, maxCol: -1 }
  for (let y = 0; y < c.h; y += 1) {
    let n = 0
    for (let x = 0; x < c.w; x += 1) {
      if ((d[(y * c.w + x) * 4 + 3] ?? 0) >= 128) {
        n += 1
        e.minCol = Math.min(e.minCol, x)
        e.maxCol = Math.max(e.maxCol, x)
      }
    }
    if (n >= 3) {
      e.first = Math.min(e.first, y)
      e.last = Math.max(e.last, y)
    }
  }
  m.set(key, e)
  return e
}

/** Units per cell unit along the limb axis - MUST mirror bodyPainter. */
export function axialScale(art: BodyArt, part: BodyPartName, d: number): number {
  const c = art.parts[part] as { len?: number } | undefined
  const dens = art.density > 0 ? art.density : 1
  const len = c?.len
  return len !== undefined && len > 0 ? d / (len / dens) : d / BODY_PART_DEFS[part].naturalLen
}

export interface JoinGeom {
  /** Upper-arm paint past the elbow + forearm paint above it (units). */
  elbowOverlap: number
  /** Cuff end minus the start of the hand back (units; > 0 = tucked under the hand). */
  cuffOverlap: number
  /** Cuff end minus the hand joint (units; > 0 = painted forearm past the hand pivot). */
  cuffOvershoot: number
}

export function joinGeom(art: BodyArt, p: Skeleton, side: Side, bulk: number): JoinGeom {
  const k = CHAIN[side]
  const dens = art.density > 0 ? art.density : 1
  const du = dist(p[k.shoulder], p[k.elbow])
  const df = dist(p[k.elbow], p[k.hand])
  const cu = art.parts[k.upper]
  const cf = art.parts[k.fore]
  if (!cu || !cf) throw new Error(`missing ${k.upper}/${k.fore}`)
  const eu = cellExtent(art, k.upper)
  const ef = cellExtent(art, k.fore)
  const upperEnd = ((eu.last + 1 - cu.pivotY) / dens) * axialScale(art, k.upper, du)
  const foreAbove = ((cf.pivotY - ef.first) / dens) * axialScale(art, k.fore, df)
  const cuffEnd = ((ef.last + 1 - cf.pivotY) / dens) * axialScale(art, k.fore, df)
  const hand = handCellFor(p, side)
  const ch = art.parts[hand]
  const back = ch ? ((ch.pivotX - cellExtent(art, hand).minCol) / dens) * bulk : 0
  return {
    elbowOverlap: upperEnd - du + foreAbove,
    cuffOverlap: cuffEnd - (df - back),
    cuffOvershoot: cuffEnd - df,
  }
}

// ---------------------------------------------------------------- pixel metrics

export interface GapSample { x: number; y: number; owner: Owner; where: string }
export interface ChainWalk {
  /** Samples on the centreline or inner line with no arm paint and no legit occluder. */
  gaps: GapSample[]
  /** Longest contiguous gap along the chain (units). */
  runU: number
  /** Samples owned by the weapon / the far hand cells (reported separately). */
  weapon: number
  farHand: number
}
export interface MoveMetrics {
  id: string
  move: PoseName
  lying: boolean
  gripping: boolean
  /** Visible share (%) of each arm part's own footprint, with its top occluders. */
  vis: Record<string, { pct: number; top: string }>
  walk: { N: ChainWalk; F: ChainWalk }
  geom: { N: JoinGeom; F: JoinGeom }
  /** Weapon pixels over the near arm footprint (units^2). */
  weaponOverNearArm: number
  /** Far hand cells over the near arm footprint (px at z). */
  gripFOverNearArm: number
  wrapFOverNearArm: number
  /** Shade pixels painted where no art is, away from the foot shadows (px at z). */
  halo: number
  suspects: string[]
}


function whereOn(seg: 'upper' | 'fore', f: number): string {
  if (seg === 'upper') return f < 0.85 ? 'upper arm' : 'elbow'
  if (f < 0.15) return 'elbow'
  return f < 0.7 ? 'forearm' : 'wrist/cuff'
}

/**
 * Cross-section walk along shoulder -> elbow -> hand. At each 0.25u step it
 * scans the full width of the limb (+-1.6 half widths, both sides of the rig
 * line: the masters landmark some joints on the sleeve's OUTER contour, so
 * the paint can sit entirely on one side). A section is connected when at
 * least 0.5u of the chain's own paint (arm cells + its hand cell) crosses
 * it. Otherwise it is a gap unless a legitimate occluder covers the rig
 * line: beard/head over the near arm; anything opaque over the far arm
 * (it is behind the body) except over a gripping far forearm, which crosses
 * IN FRONT of the torso.
 */
function walkChain(ids: Uint8ClampedArray, fr: Frame, p: Skeleton, side: Side, bulk: number, gripping: boolean): ChainWalk {
  const k = CHAIN[side]
  const s = p[k.shoulder]
  const e = p[k.elbow]
  const h = p[k.hand]
  const lu = dist(s, e)
  const lf = dist(e, h)
  const total = lu + lf
  const step = 0.25
  const own = new Set<Owner>(side === 'N'
    ? ['upperArmN', 'foreArmN', 'gripN', 'wrapN', 'relaxN']
    : ['upperArmF', 'foreArmF', 'gripF', 'wrapF', 'relaxF'])
  const out: ChainWalk = { gaps: [], runU: 0, weapon: 0, farHand: 0 }
  const at = (x: number, y: number): Owner => {
    const px = Math.round((x + fr.ox) * fr.z)
    const py = Math.round((y + fr.oy) * fr.z)
    if (px < 0 || py < 0 || px >= fr.w || py >= fr.h) return 'BG'
    return owner(ids, (py * fr.w + px) * 4)
  }
  let run = 0
  for (let t = 2; t <= total - 1; t += step) {
    const seg = t < lu ? 'upper' : 'fore'
    const a = seg === 'upper' ? s : e
    const b = seg === 'upper' ? e : h
    const f = seg === 'upper' ? t / lu : (t - lu) / lf
    const q = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
    const len = dist(a, b) || 1
    const n = { x: -(b.y - a.y) / len, y: (b.x - a.x) / len }
    const half = ((seg === 'upper' ? 9.5 - 2.1 * f : 7.4 - 1.8 * f) / 2) * bulk
    let mine = 0
    let cover = 0
    for (let o = -1.6 * half; o <= 1.6 * half; o += step) {
      const w = at(q.x + n.x * o, q.y + n.y * o)
      if (own.has(w)) mine += 1
      else if (w === 'BEARD' || w === 'HEAD' || w === 'torso') cover += 1
    }
    if (mine >= 2) {
      run = 0
      continue
    }
    const axis = at(q.x, q.y)
    // Shoulder cap (first 45% of the upper arm): the torso cell paints its
    // own shoulder and the beard front layer is drawn OVER the near arm on
    // purpose (draw.ts headLayer 'front'), so torso/beard there - or their
    // translucent strand edges, which classify as blends - is the join, not
    // a hole. Background is still a hole.
    const capCovered = seg === 'upper' && f < 0.45 && cover > 0 && axis !== 'BG'
    let gap: boolean
    if (axis === 'WEAPON') {
      out.weapon += 1
      gap = side === 'N' && !capCovered
    } else if (side === 'N') {
      // The far fist/fingertips over the near arm are reported separately
      // (farHand, V-15b): an occluder, not background showing through.
      if (axis === 'gripF' || axis === 'wrapF' || axis === 'relaxF') {
        out.farHand += 1
        gap = false
      } else {
        gap = !(axis === 'BEARD' || axis === 'HEAD') && !capCovered
      }
    } else {
      gap = axis === 'BG' || axis === 'mixed' || (gripping && seg === 'fore' && axis === 'torso')
    }
    if (gap) out.gaps.push({ x: q.x, y: q.y, owner: axis, where: whereOn(seg, f) })
    run = gap ? run + step : 0
    out.runU = Math.max(out.runU, run)
  }
  return out
}
/**
 * `ctl` exists only for negative controls: `plain` render options (e.g.
 * { noSourceAtop: true }) and `footBody`, the art whose arm cells define the
 * footprints (default: the rendered art).
 */
export function measureMove(
  res: ArtResources, idRes: ArtResources, id: string, move: PoseName, z = 4,
  ctl: { plain?: ShadeOpts; footBody?: BodyArt } = {},
): MoveMetrics {
  const plan = planOf(id)
  const bulk = plan.build.bulk
  const p = poseOf(id, move)
  const fr = frameOf(id, move, z)
  const body = ctl.footBody ?? (res.bodies as Record<string, BodyArt>)[id]
  const idB = ctl.footBody ? idBody(ctl.footBody) : (idRes.bodies as Record<string, BodyArt>)[id]
  if (!body || !idB) throw new Error(`no body art for ${id}`)
  const gripping = farGripping(p)
  const ids = renderMove(idRes, id, move, z, { noShade: true }).data
  const plain = renderMove(res, id, move, z, ctl.plain ?? {}).data
  const bare = renderMove(res, id, move, z, { noShade: true }).data
  const limb = bodyPainter(idB, p as unknown as Record<string, Pt>, bulk, p.lying === true)
  const foot: Record<string, Uint8ClampedArray> = {}
  for (const part of ['upperArmN', 'foreArmN', 'upperArmF', 'foreArmF'] as const) {
    foot[part] = footprint(fr, (g) => limb(g, part))
  }
  const vis: MoveMetrics['vis'] = {}
  for (const [part, fd] of Object.entries(foot)) {
    let n = 0
    let own = 0
    const occ = new Map<string, number>()
    for (let i = 0; i < fd.length; i += 4) {
      if ((fd[i + 3] ?? 0) < 200) continue
      n += 1
      const o = owner(ids, i)
      if (o === part) own += 1
      else occ.set(o, (occ.get(o) ?? 0) + 1)
    }
    const top = [...occ.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([k2, v]) => `${k2} ${Math.round((100 * v) / Math.max(1, n))}%`).join(', ')
    vis[part] = { pct: Math.round((100 * own) / Math.max(1, n)), top }
  }
  let weapon = 0
  let gripF = 0
  let wrapF = 0
  let halo = 0
  const un = foot.upperArmN
  const fn = foot.foreArmN
  // Halo region: everywhere except the contact-shadow ellipses at the feet
  // (draw.ts drawContactShadow: radial 7.2*bulk from 1.6*bulk toe-forward,
  // deliberate ground contact, not an arm-chain halo).
  const nearFoot = (px: number, py: number): boolean => {
    const x = px / fr.z - fr.ox
    const y = py / fr.z - fr.oy
    const r = 7.2 * bulk + 1.6 * bulk + 1
    return Math.hypot(x - p.footN.x, y - p.footN.y) < r || Math.hypot(x - p.footF.x, y - p.footF.y) < r
  }
  for (let i = 0; i < ids.length; i += 4) {
    const inNear = ((un?.[i + 3] ?? 0) >= 200) || ((fn?.[i + 3] ?? 0) >= 200)
    if (inNear) {
      const o = owner(ids, i)
      if (o === 'WEAPON') weapon += 1
      else if (o === 'gripF') gripF += 1
      else if (o === 'wrapF') wrapF += 1
    }
    if ((plain[i + 3] ?? 0) >= 8 && (bare[i + 3] ?? 0) < 8) {
      const px = (i / 4) % fr.w
      if (!nearFoot(px, (i / 4 - px) / fr.w)) halo += 1
    }
  }
  const m: MoveMetrics = {
    id, move, lying: p.lying === true, gripping, vis,
    walk: { N: walkChain(ids, fr, p, 'N', bulk, gripping), F: walkChain(ids, fr, p, 'F', bulk, gripping) },
    geom: { N: joinGeom(body, p, 'N', bulk), F: joinGeom(body, p, 'F', bulk) },
    weaponOverNearArm: Math.round((weapon / (z * z)) * 10) / 10,
    gripFOverNearArm: gripF,
    wrapFOverNearArm: wrapF,
    halo,
    suspects: [],
  }
  m.suspects = suspectsOf(m)
  return m
}

const r1 = (v: number): string => v.toFixed(1)
export function suspectsOf(m: MoveMetrics): string[] {
  const s: string[] = []
  for (const side of ['N', 'F'] as const) {
    const w = m.walk[side]
    if (w.gaps.length > 0) {
      const at = [...new Set(w.gaps.map((g) => g.where))].join('/')
      const by = [...new Set(w.gaps.map((g) => g.owner))].join('/')
      s.push(`${side === 'N' ? 'near' : 'far'} chain gap at ${at}: ${w.gaps.length} samples, longest ${r1(w.runU)}u (shows ${by})`)
    }
    const g = m.geom[side]
    if (g.elbowOverlap < 2) s.push(`${side === 'N' ? 'near' : 'far'} elbow join thin: overlap ${r1(g.elbowOverlap)}u (cell length / mapping)`)
    if (g.cuffOverlap < 1) s.push(`${side === 'N' ? 'near' : 'far'} cuff stops short of the hand: overlap ${r1(g.cuffOverlap)}u (wrist cut)`)
    if (g.cuffOvershoot > -0.5) s.push(`${side === 'N' ? 'near' : 'far'} forearm paint reaches the hand pivot: ${r1(g.cuffOvershoot)}u (fingers may poke out)`)
  }
  if (m.weaponOverNearArm > 2) s.push(`weapon over the near arm: ${r1(m.weaponOverNearArm)}u^2 (draw order)`)
  if (m.gripFOverNearArm > 0) s.push(`far fist over the near arm: ${m.gripFOverNearArm}px (draw order)`)
  if (m.wrapFOverNearArm > 0) s.push(`far fingertips (wrapF) over the near arm: ${m.wrapFOverNearArm}px (tail draw order)`)
  if (m.halo > 0) s.push(`shade halo outside the art: ${m.halo}px (soft-shade oval not clipped to paint)`)
  for (const [part, v] of Object.entries(m.vis)) {
    if (v.pct < 25 && !(m.lying && part.endsWith('F'))) s.push(`${part} ${v.pct}% visible (hidden by ${v.top})`)
  }
  return s
}

// ---------------------------------------------------------------- review images

/** Window (units, figure space) centred on both arm chains. */
export function chainWindow(p: Skeleton, w: number, h: number): { x: number; y: number; w: number; h: number } {
  const pts = [p.shoulderF, p.elbowF, p.handF, p.shoulderN, p.elbowN, p.handN]
  const cx = (Math.min(...pts.map((q) => q.x)) + Math.max(...pts.map((q) => q.x))) / 2
  const cy = (Math.min(...pts.map((q) => q.y)) + Math.max(...pts.map((q) => q.y))) / 2
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}

/** ID-map render of one move as a canvas (flat part colours, no shading). */
export function idTile(idRes: ArtResources, id: string, move: PoseName, z: number): Canvas {
  return renderMove(idRes, id, move, z, { noShade: true }).cv
}

/** Legend strip for the ID colours. */
export function idLegend(width: number): Canvas {
  const cols = 5
  const rows = Math.ceil(ID_NAMES.length / cols)
  const cv = createCanvas(width, rows * 18 + 4)
  const g = cv.getContext('2d')
  g.fillStyle = '#1c1820'
  g.fillRect(0, 0, cv.width, cv.height)
  g.font = '12px sans-serif'
  ID_NAMES.forEach((n, i) => {
    const [r, gg, b] = rgbOf(n)
    const x = (i % cols) * (width / cols) + 4
    const y = Math.floor(i / cols) * 18 + 4
    g.fillStyle = `rgb(${r},${gg},${b})`
    g.fillRect(x, y, 14, 12)
    g.fillStyle = '#f5e6c8'
    g.fillText(n, x + 18, y + 11)
  })
  return cv
}

/**
 * Annotated crop for a flagged move: plain render on the left, ID map on the
 * right, both at `z`, with gap samples ringed (red near, cyan far) and the
 * joints dotted. Written only for moves with suspects.
 */
export function suspectCrop(res: ArtResources, idRes: ArtResources, m: MoveMetrics, z = 6): Canvas {
  const p = poseOf(m.id, m.move)
  const fr = frameOf(m.id, m.move, z)
  const win = chainWindow(p, 60, 54)
  const plain = renderMove(res, m.id, m.move, z).cv
  const ids = idTile(idRes, m.id, m.move, z)
  const W = win.w * z
  const H = win.h * z
  const lines = m.suspects.length
  const cv = createCanvas(W * 2 + 8, H + 20 + lines * 15 + 6)
  const g = cv.getContext('2d')
  g.fillStyle = '#3a3440'
  g.fillRect(0, 0, cv.width, cv.height)
  const sx = (win.x + fr.ox) * z
  const sy = (win.y + fr.oy) * z
  g.drawImage(plain, sx, sy, W, H, 0, 20, W, H)
  g.drawImage(ids, sx, sy, W, H, W + 8, 20, W, H)
  const map = (q: Pt, dx: number): [number, number] => [dx + (q.x - win.x) * z, 20 + (q.y - win.y) * z]
  for (const dx of [0, W + 8]) {
    for (const [side, col] of [['N', 'rgba(255,60,60,0.9)'], ['F', 'rgba(60,220,255,0.9)']] as const) {
      g.strokeStyle = col
      g.lineWidth = 1.5
      for (const gs of m.walk[side].gaps) {
        const [x, y] = map(gs, dx)
        g.beginPath()
        g.arc(x, y, 3, 0, Math.PI * 2)
        g.stroke()
      }
    }
    for (const j of ['shoulderN', 'elbowN', 'handN', 'shoulderF', 'elbowF', 'handF'] as const) {
      const [x, y] = map(p[j], dx)
      g.fillStyle = j.endsWith('N') ? '#ffe14f' : '#4fd8ff'
      g.fillRect(x - 2, y - 2, 4, 4)
    }
  }
  g.fillStyle = '#f5e6c8'
  g.font = 'bold 13px sans-serif'
  g.fillText(`${m.id} ${m.move}   plain | ID map   (red o = near gap, cyan o = far gap)`, 4, 14)
  g.font = '12px sans-serif'
  m.suspects.forEach((s, i) => g.fillText(`- ${s}`, 4, H + 20 + 15 * (i + 1)))
  return cv
}
