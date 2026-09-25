import { FACES, SCLERA } from './faces'
import { headPainter, type HeroArt, type HeadPainter, type HeadLayer } from './hero-resources'
import { bodyPainter, type BodyArt, type BodyPainter, type BodyPartName } from './body-parts'
import type { PoseName } from './poses'
import type { FigurePlan } from './figures'
import { addWeapon, weaponPose } from './weapons'
import { INK, SKIN, css, materials, tint, type Materials } from './palette'
import {
  BODY_X,
  FIG_H,
  FIG_W,
  GROUND,
  applyBuild,
  chainPath,
  limbPath,
  lerpPt,
  ovalPath,
  polyPath,
  type Pt,
  type Skeleton,
} from './rig'

/**
 * Cel-shaded figure drawing.
 *
 * Five passes over one ordered list of shapes, which is what separates this
 * from flat vector art:
 *
 *   1. INK      every shape stroked fat and filled in the ink colour, so the
 *               union of them is a solid silhouette slightly larger than the
 *               figure. This is what gives the whole cast one continuous
 *               outline instead of an outline per limb.
 *   2. FILL     each shape in its own flat colour, back to front.
 *   3. SHADOW   one hard-edged polygon over the unlit side, composited
 *               `source-atop` so it is clipped to the figure and follows its
 *               silhouette for free. A single terminator across the whole
 *               figure is what makes it read as one light rather than as
 *               per-part shading.
 *   4. LIGHT    a second polygon on the LIT side, same compositing, giving the
 *               three tones cel shading is built from: light, base, shadow.
 *   5. DETAIL   face, belt and seams, drawn normally on top.
 *
 * Everything is plain Canvas2D. No gradients through Phaser Graphics, no
 * blend modes, no shaders: the two renderers have disagreed twice in this
 * project's history and both times it was a WebGL-only drawing feature. A
 * texture built here is a finished bitmap by the time Phaser sees it.
 */

/**
 * Ink line half-width, in canonical figure units. Small relative to the limbs
 * on purpose: the ink is a stroke CENTRED on each shape's edge, so half of it
 * eats into the fill. At 1.15 against a 6-unit forearm it took most of the arm
 * and the cast read as black sticks.
 */
export const INK_W = 0.85
const LIGHT = 'rgba(255, 246, 228, 0.17)'
const SHADOW = 'rgba(22, 14, 30, 0.34)'

export interface Shape {
  trace: (c: CanvasRenderingContext2D) => void
  fill: string
  /** Interior material facets must not acquire a second black outline. */
  outline?: boolean
  /** A paint boundary, not a shape: cel groups on either side shade once. */
  headLayer?: HeadLayer
  /** A paper-doll body part marker: the raster painter draws here instead. */
  bodyPart?: BodyPartName
  /** Soft local transition on the painted head's near shoulder only. */
  shoulder?: { x: number; y: number; radius: number }
}

/**
 * The light is up and to the left, so the shadow falls down and to the right.
 * Both regions are one polygon each, crossing the whole drawing: cel shading
 * reads as a single light source only while the terminator is a single line,
 * and stops the moment each part shades itself.
 *
 * The first attempt at the lit side re-stroked every shape's outline offset
 * toward the light, clipped to the figure. That is a real technique, but it
 * only produces a rim where a shape's edge IS the figure's edge - and for a
 * torso or a head, which sit well inside the silhouette, the offset outline
 * lands entirely within it and draws a pale loop across the body. The cast came
 * out covered in rings. A band needs the union of every shape to be meaningful,
 * and a per-shape pass cannot see it.
 *
 * The splits are fractions of the width so the same light falls across a
 * fighter, a horse and a crate alike.
 */
export const SHADOW_SPLIT = [0.625, 0.375] as const
export const LIT_SPLIT = [0.458, 0.229] as const

function bandPath(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  split: readonly [number, number],
  toward: 1 | -1,
): void {
  const pad = 14
  const edge = toward === 1 ? w + pad : -pad
  polyPath(ctx, [
    { x: w * split[0], y: -pad },
    { x: edge, y: -pad },
    { x: edge, y: h + pad },
    { x: w * split[1], y: h + pad },
  ])
}

/**
 * The shared cel pipeline: ink silhouette, flat fills, one shadow band, one lit
 * band. Everything the game draws as a character or an object goes through it,
 * so a crate is lit from the same direction as the fighter standing next to it.
 */
/** One hard-edged tonal band: which side of the split line it covers, and in
 * what colour. Two of them are what makes the cel shading read as one light. */
export interface CelBand {
  split: readonly [number, number]
  toward: 1 | -1
  fill: string
}

/** The light every sprite is lit by. The portrait overrides it, because a
 * terminator tuned for a full figure puts the whole FACE in shadow - see
 * `portrait.ts`. */
export const DEFAULT_BANDS: readonly CelBand[] = [
  { split: SHADOW_SPLIT, toward: 1, fill: SHADOW },
  { split: LIT_SPLIT, toward: -1, fill: LIGHT },
]

export function paintCel(
  ctx: CanvasRenderingContext2D,
  shapes: readonly Shape[],
  w: number,
  h: number,
  bands: readonly CelBand[] = DEFAULT_BANDS,
): void {
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  for (const shape of shapes) {
    if (shape.outline === false) continue
    ctx.save()
    shape.trace(ctx)
    ctx.lineWidth = INK_W * 2
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.fillStyle = INK
    ctx.fill()
    ctx.restore()
  }
  for (const shape of shapes) {
    ctx.save()
    shape.trace(ctx)
    ctx.fillStyle = shape.fill
    ctx.fill()
    ctx.restore()
  }
  ctx.save()
  ctx.globalCompositeOperation = 'source-atop'
  for (const band of bands) {
    bandPath(ctx, w, h, band.split, band.toward)
    ctx.fillStyle = band.fill
    ctx.fill()
  }
  ctx.restore()
}

export function figureBox(): { width: number; height: number } {
  return { width: FIG_W, height: FIG_H }
}

/**
 * Draw one figure into the current transform, in canonical figure space.
 * The caller is responsible for scaling to device pixels.
 */
export function drawFigure(
  ctx: CanvasRenderingContext2D,
  plan: FigurePlan,
  rawPose: Skeleton,
  painted?: { art?: HeroArt; poseName: PoseName; body?: BodyArt },
): void {
  const pose = weaponPose(plan, applyBuild(rawPose, plan.build))
  const m = materials(plan.body, plan.trim, plan.gear, plan.beardColor ?? 0x3a2a18, painted?.art?.skin ?? plan.skin)
  const head = painted?.art
  const body = painted?.body
  const shapes = figureShapes(plan, pose, m, head ? emptyHeadParts : spriteHeadParts, head !== undefined, body)
  if (head || body) {
    paintWithHead(ctx, shapes,
      head ? headPainter(head, painted?.poseName ?? 'idle', pose, plan.build.head) : undefined,
      body ? bodyPainter(body, pose as unknown as Record<string, Pt>, plan.build.bulk) : undefined,
      () => drawBodyDetails(ctx, plan, pose, m))
  } else {
    paintCel(ctx, shapes, FIG_W, GROUND)
  }

  // A painted head owns its face. Retain only the body details in that path.
  if (!head) drawDetails(ctx, plan, pose, m)
}

const emptyHeadParts: HeadParts = () => {}

/** Keep body cel shading inside each shape, never over painted raster.
 * All layers use the same global lighting bands and existing ordered
 * geometry. Either painter may be absent (procedural head under a painted
 * body, or vice versa); body details run at the front head marker when
 * there is one, otherwise just before the trailing group flushes. */
function paintWithHead(ctx: CanvasRenderingContext2D, shapes: Shape[], head: HeadPainter | undefined, body: BodyPainter | undefined, bodyDetails: () => void): void {
  let group: Shape[] = []
  let detailsDone = false
  const flush = (): void => {
    if (group.length === 0) return
    // Clip shading to the current group's paths; otherwise source-atop shades
    // every previously drawn pixel too. Fill each shape in ordered cel bands
    // using its own clip, with no overlay outside that shape.
    for (const shape of group) {
      ctx.save()
      shape.trace(ctx)
      if (shape.outline !== false) {
        ctx.lineWidth = INK_W * 2
        ctx.lineJoin = 'round'; ctx.lineCap = 'round'
        ctx.strokeStyle = INK; ctx.stroke()
      }
      ctx.fillStyle = shape.fill; ctx.fill()
      ctx.clip()
      if (shape.shoulder) {
        const { x, y, radius } = shape.shoulder
        const light = ctx.createRadialGradient(x - radius * 0.5, y - radius * 0.5, 0, x, y, radius * 1.2)
        light.addColorStop(0, 'rgba(255,237,195,0.32)')
        light.addColorStop(0.45, 'rgba(45,32,25,0.08)')
        light.addColorStop(1, 'rgba(22,19,22,0.6)')
        ctx.fillStyle = light; ctx.fillRect(x - radius * 2, y - radius * 2, radius * 4, radius * 4)
      }
      for (const band of DEFAULT_BANDS) {
        bandPath(ctx, FIG_W, GROUND, band.split, band.toward)
        ctx.fillStyle = band.fill; ctx.fill()
      }
      ctx.restore()
    }
    group = []
  }
  for (const shape of shapes) {
    if (shape.headLayer && head) {
      flush()
      if (shape.headLayer === 'front') {
        bodyDetails()
        detailsDone = true
      }
      head(ctx, shape.headLayer)
    } else if (shape.bodyPart && body) {
      flush()
      body(ctx, shape.bodyPart)
    }
    else group.push(shape)
  }
  if (!detailsDone) bodyDetails()
  flush()
}

/** The head's radius in canonical figure units. One definition, because the
 * face passes, the portrait and two gates all derive their landmarks from it. */
export function headRadius(plan: FigurePlan): number {
  return 10.4 * plan.build.head
}

/**
 * Head, hair, beard and headgear, as the FIGHTER wears them.
 *
 * Split out behind a parameter because the portrait needs its own: the sprite's
 * head is a plain ellipse and its helmet reaches +0.44R at the centre line,
 * which is BELOW the eyes - and NOT fine, which is what ART-7 measured: the
 * in-play head is 40-43 device pixels across, not the 20 this file claimed for
 * a long time (that figure is logical units, and RENDER_SCALE is 2). It is the
 * reason two heroes'
 * portraits had their brows painted on their hat. See `portrait.ts`.
 */
export type HeadParts = (
  add: (trace: Shape['trace'], fill: string) => void,
  plan: FigurePlan,
  p: Skeleton,
  m: Materials,
  headR: number,
) => void

export const spriteHeadParts: HeadParts = (add, plan, p, m, headR) => {
  add((c) => ovalPath(c, p.head, headR, headR * 1.14, p.headRot), m.skin)
  // Hair before the headgear. A band or a turban leaves the crown bare, and a
  // bare crown on a flat fill reads as a billiard ball rather than a head.
  if (
    plan.headgear === 'band' ||
    plan.headgear === 'turban' ||
    plan.headgear === 'crown' ||
    plan.headgear === 'plumed'
  ) {
    add(
      (c) =>
        ovalPath(
          c,
          { x: p.head.x - headR * 0.1, y: p.head.y - headR * 0.82 },
          headR * 1.0,
          headR * 0.54,
          p.headRot,
        ),
      m.hair,
    )
  }
  if (plan.beard !== 'none') addBeard(add, plan, p, m, headR)
  addHeadgear(add, plan, p, m, headR)
}

export function figureShapes(
  plan: FigurePlan,
  p: Skeleton,
  m: Materials,
  headParts: HeadParts = spriteHeadParts,
  painted = false,
  body?: BodyArt,
): Shape[] {
  const b = plan.build.bulk
  const shapes: Shape[] = []
  const add = (trace: Shape['trace'], fill: string, outline = true): void => {
    shapes.push({ trace, fill, outline })
  }
  const has = (part: BodyPartName): boolean => body?.parts[part] !== undefined
  // Procedural groups are replaced only when ALL of their parts are painted;
  // a missing part keeps its procedural shape in the same slot (e.g. heroes
  // whose masters show no cape keep the procedural cape).
  const farArm = has('upperArmF') && has('foreArmF')
  const farLeg = has('thighF') && has('shinF')
  const torso = has('torso')
  const nearLeg = has('thighN') && has('shinN')
  const nearArm = has('upperArmN') && has('foreArmN')
  const mark = (part: BodyPartName): void => {
    shapes.push({ trace: () => {}, fill: '', bodyPart: part })
  }

  // A dropped weapon rests behind the prone body, not across the eyes. Its
  // geometry/reach remains identical; only the painted down-pose occlusion changes.
  if (painted && p.lying) addWeapon(add, plan, p, m)

  // Cape first: it sits behind everything and is most of what makes a
  // silhouette recognisable at a distance.
  if (plan.cape) {
    if (has('cloth')) {
      mark('cloth')
    } else {
      const trail = p.lying === true ? 1 : -1
      add(
        (c) =>
          polyPath(c, [
            { x: p.shoulderF.x - 2, y: p.shoulderF.y - 4 },
            { x: p.shoulderN.x + 1, y: p.shoulderN.y - 4 },
            { x: p.hip.x + trail * 2, y: p.hip.y + 20 * plan.build.height },
            { x: p.hip.x + trail * 16, y: p.hip.y + 12 * plan.build.height },
          ]),
        m.clothShade,
      )
    }
  }

  if (painted) shapes.push({ trace: () => {}, fill: '', headLayer: 'rear' })

  // Far side of the body, drawn behind the torso.
  if (farArm) {
    mark('upperArmF')
    mark('foreArmF')
  } else {
    add(
      (c) => chainPath(c, [p.shoulderF, p.elbowF, p.handF], [9 * b, 7.2 * b, 5.4 * b]),
      m.clothShade,
    )
  }
  if (farLeg) {
    mark('thighF')
    mark('shinF')
  } else {
    add((c) => chainPath(c, [p.hipF, p.kneeF, p.footF], [12.5 * b, 9.5 * b, 7 * b]), m.clothShade)
    add((c) => bootShape(c, p.kneeF, p.footF, b), m.leatherShade)
    add((c) => footShape(c, p.footF, b), m.leatherShade)
  }

  // Torso, then the armour skirt over the hips. The paper-doll torso sheet
  // includes the skirt (rigid with the hips), so one marker replaces both.
  if (torso) {
    mark('torso')
  } else {
    add((c) => limbPath(c, p.chest, p.hip, 23.5 * b, 15.5 * b), m.cloth)
    add(
      (c) =>
        polyPath(c, [
          { x: p.hip.x - 8.5 * b, y: p.hip.y - 3 },
          { x: p.hip.x + 8.5 * b, y: p.hip.y - 3 },
          { x: p.hip.x + 11 * b, y: p.hip.y + 10 * plan.build.height },
          { x: p.hip.x - 11 * b, y: p.hip.y + 10 * plan.build.height },
        ]),
      m.trim,
    )
  }

  // Near leg, in front of the skirt.
  if (nearLeg) {
    mark('thighN')
    mark('shinN')
  } else {
    add((c) => chainPath(c, [p.hipN, p.kneeN, p.footN], [13 * b, 10 * b, 7.5 * b]), m.cloth)
    add((c) => bootShape(c, p.kneeN, p.footN, b), m.leather)
    add((c) => footShape(c, p.footN, b), m.leather)
  }

  // Neck and head.
  add((c) => limbPath(c, p.neck, p.chest, 9 * b, 14 * b), m.skinShade)
  headParts(add, plan, p, m, headRadius(plan))
  if (painted) shapes.push({ trace: () => {}, fill: '', headLayer: 'head' })

  // Pauldron, then the near arm over it. With a paper-doll near arm the
  // upper-arm part carries the shoulder, so the procedural pauldron (and
  // the painted-head shoulder cap below it) would double-draw.
  if (nearArm) {
    mark('upperArmN')
    mark('foreArmN')
  } else {
    add((c) => ovalPath(c, p.shoulderN, 7.8 * b, 6.4 * b, -0.2), m.trim)
    add((c) => chainPath(c, [p.shoulderN, p.elbowN, p.handN], [9.5 * b, 7.4 * b, 5.6 * b]), m.cloth)
  }
  if (painted && !nearArm) {
    // A fitted shoulder cap bridges the painted neck and the existing sleeve.
    // It does not alter the arm endpoints or any weapon/hand geometry.
    add(c => ovalPath(c, p.shoulderN, 6.8 * b, 5.4 * b, -0.2), m.cloth)
    shapes[shapes.length - 1]!.shoulder = { x: p.shoulderN.x, y: p.shoulderN.y, radius: 7 * b }
  }
  // 髯长二尺 - a long beard falls OVER the chest, in front of the pauldron and
  // sleeve. Drawn only in the head's place in the order, the pauldron and near
  // arm covered all of it below the jaw, and Guan Yu's beard - the thing he is
  // named for - showed as a chin patch. The portrait paints its own beard in
  // the face pass, and a lying figure's "down" is along the ground.
  if (plan.beard === 'long' && headParts === spriteHeadParts && p.lying !== true) {
    addBeardFront(add, p, m, headRadius(plan))
  }
  if (painted) shapes.push({ trace: () => {}, fill: '', headLayer: 'front' })
  // Forearm and hand in skin, over the sleeve, so the arm is not one tube.
  // Skipped when the paper-doll forearm (which includes the hand) is present.
  if (!has('foreArmN')) {
    add((c) => limbPath(c, lerpPt(p.elbowN, p.handN, 0.35), p.handN, 6.8 * b, 5.6 * b), m.skin)
  }

  if (!painted || !p.lying) addWeapon(add, plan, p, m)
  return shapes
}

/** A foot, always set flat along the ground line it stands on. Exported for
 * the BODY-2 fixture generator, which paints paper-doll parts with the same
 * path functions so fixture silhouettes match procedural ones exactly. */
export function footShape(c: CanvasRenderingContext2D, foot: Pt, b: number): void {
  limbPath(c, { x: foot.x - 2, y: foot.y - 1.5 }, { x: foot.x + 6, y: foot.y - 1.5 }, 6.5 * b, 5 * b)
}

/** The boot cuff: the lower third of the shin, so a leg is not one flat tube.
 * Exported for the BODY-2 fixture generator (see footShape). */
export function bootShape(c: CanvasRenderingContext2D, knee: Pt, foot: Pt, b: number): void {
  const top = lerpPt(knee, foot, 0.62)
  limbPath(c, top, foot, 9 * b, 7.5 * b)
}

function addBeard(
  add: (t: Shape['trace'], f: string) => void,
  plan: FigurePlan,
  p: Skeleton,
  m: Materials,
  headR: number,
): void {
  const chin = { x: p.head.x + headR * 0.25, y: p.head.y + headR * 0.95 }
  // Guan Yu's beard is the one thing every depiction of him agrees on, so it
  // is long enough to change his silhouette rather than being a chin patch.
  const len = plan.beard === 'long' ? 20 : 11
  // It starts AT the jaw, not part-way up the face. Drawn higher, a dark beard
  // met the hair and Zhang Fei's head came out as one black mass with no face
  // in it - the same defect as the old cast, where the beard sat on the eyes.
  if (plan.beard === 'bristle') {
    add((c) => polyPath(c, bristleOutline(chin, headR)), m.hair)
    return
  }
  add(
    (c) =>
      polyPath(c, [
        { x: chin.x - headR * 0.72, y: chin.y - 1 },
        { x: chin.x + headR * 0.5, y: chin.y - 2 },
        { x: chin.x + headR * 0.2, y: chin.y + len },
        { x: chin.x - headR * 0.58, y: chin.y + len * 0.75 },
      ]),
    m.hair,
  )
}

/** The hanging length of a long beard below the jaw, in canonical units. */
const LONG_BEARD_FALL = 27

/** The front fall of a long beard: a tapering strand from the jaw down the chest. */
function addBeardFront(
  add: (t: Shape['trace'], f: string) => void,
  p: Skeleton,
  m: Materials,
  headR: number,
): void {
  const chin = { x: p.head.x + headR * 0.25, y: p.head.y + headR * 0.95 }
  add(
    (c) =>
      polyPath(c, [
        { x: chin.x - headR * 0.5, y: chin.y + 2 },
        { x: chin.x + headR * 0.42, y: chin.y + 1 },
        { x: chin.x + headR * 0.22, y: chin.y + LONG_BEARD_FALL * 0.8 },
        { x: chin.x - headR * 0.02, y: chin.y + LONG_BEARD_FALL },
        { x: chin.x - headR * 0.34, y: chin.y + LONG_BEARD_FALL * 0.7 },
      ]),
    m.hair,
  )
}

/**
 * 虎须 - Zhang Fei's "tiger whiskers", the beard of 燕颔虎须.
 *
 * The same top edge as the smooth `full` beard - along the jaw, clear of the
 * mouth - and the difference is all in the lower edge: the whiskers stand OUT
 * from the jaw in spikes, forward, down and back, where the wedge they replace
 * was a four-cornered block that read as the same beard Xu Chu wears. Exported
 * so the gate that checks the spikes reads the shape the sprite draws.
 */
export function bristleOutline(chin: Pt, headR: number): Pt[] {
  const r = headR
  const at = (dx: number, dy: number): Pt => ({ x: chin.x + dx * r, y: chin.y + dy * r })
  return [
    at(-0.72, -0.1), // jaw, behind
    at(0.5, -0.19), // jaw, front - the top edge the smooth beard has
    at(0.86, 0.08), // spike forward
    at(0.5, 0.36),
    at(0.64, 0.78), // spike forward and down
    at(0.26, 0.7),
    at(0.14, 1.22), // spike down, the longest
    at(-0.14, 0.82),
    at(-0.42, 1.1), // spike down and back
    at(-0.56, 0.66),
    at(-1.0, 0.72), // spike back
    at(-0.78, 0.28),
  ]
}

/**
 * 三叉束发紫金冠 with 雉尾 - Lu Bu's crown and pheasant-tail plumes.
 *
 * A small hair-binding crown with THREE prongs, the middle one tallest, and two
 * long tail feathers sweeping up and back from it. `crown`, which he wore
 * before, is Cao Cao's: a two-peaked zigzag on a bowl. In head-local units
 * (x forward, y down, headR), so both the sprite and the gate derive the same
 * shape; the plumes are centreline curves the drawing thickens.
 */
export const PLUMED = {
  prongs: [
    [-0.62, -1.02],
    [-0.52, -1.52], // back prong
    [-0.3, -1.12],
    [-0.1, -1.72], // middle prong, tallest
    [0.12, -1.12],
    [0.34, -1.5], // front prong
    [0.5, -1.0],
  ] as ReadonlyArray<readonly [number, number]>,
  /** base, control, tip of each plume's centreline. Near plume first. */
  plumes: [
    [[-0.26, -1.4], [-0.9, -3.4], [-2.6, -3.0]],
    [[-0.1, -1.5], [0.1, -3.6], [-1.5, -3.5]],
  ] as ReadonlyArray<readonly [readonly [number, number], readonly [number, number], readonly [number, number]]>,
  /** Plume width at the base, in headR. It tapers to a point at the tip. */
  plumeW: 0.3,
}

/** 雉尾 pheasant tail: rufous barred brown, fixed like the tassel red. */
export const PLUME = 0xa8602c

/** A tapered feather along a quadratic centreline, as a closed polygon.
 * Shared with the portrait, which draws the same feathers frontally. */
export function plumePolygon(base: Pt, ctrl: Pt, tip: Pt, w: number): Pt[] {
  const N = 10
  const left: Pt[] = []
  const right: Pt[] = []
  for (let i = 0; i <= N; i += 1) {
    const t = i / N
    const u = 1 - t
    const x = u * u * base.x + 2 * u * t * ctrl.x + t * t * tip.x
    const y = u * u * base.y + 2 * u * t * ctrl.y + t * t * tip.y
    const dx = 2 * u * (ctrl.x - base.x) + 2 * t * (tip.x - ctrl.x)
    const dy = 2 * u * (ctrl.y - base.y) + 2 * t * (tip.y - ctrl.y)
    const len = Math.hypot(dx, dy) || 1
    // Full width for the first third, then a taper to the point.
    const half = (w / 2) * Math.min(1, (1 - t) * 1.5)
    left.push({ x: x - (dy / len) * half, y: y + (dx / len) * half })
    right.push({ x: x + (dy / len) * half, y: y - (dx / len) * half })
  }
  return [...left, ...right.reverse()]
}

/**
 * The bowl each ellipse-shaped headgear is drawn from, in headR units.
 *
 * A table rather than literals inside `addHeadgear` because the FACE pass has
 * to know where the brim falls: the eyes and brows were being painted onto the
 * headgear, and the only way to place them on skin is to ask. Duplicating
 * these numbers in the face pass is exactly the drift that produced ART-5.
 */
const GEAR_BOWL: Record<string, { cy: number; rx: number; ry: number }> = {
  // Each bowl keeps the TOP (cy - ry) and the WIDTH (rx) it has always had, so
  // the two points that define its silhouette do not move; only the vertical
  // profile shallows, which lifts the brim off the face. Solved for a lower
  // edge of -0.21R at the eye column - just clear of the heaviest brow:
  //   helmet  ry 0.86 -> 0.5197, cy -0.42 -> -0.7603, edge +0.342 -> -0.300
  //   crown   ry 0.70 -> 0.4796, cy -0.50 -> -0.7204, edge +0.114 -> -0.300
  //   turban  ry 0.82 -> 0.5604, cy -0.55 -> -0.8096, edge +0.196 -> -0.300
  // -0.30 rather than a hair above the brow: the margin has to be thick enough
  // to MEASURE, and at a 40px head 0.09R of extra clearance is about 2 pixels.
  helmet: { cy: -0.7603, rx: 1.12, ry: 0.5197 },
  crown: { cy: -0.7204, rx: 1.08, ry: 0.4796 },
  // Lu Bu's crown binds the hair on the same bowl as Cao Cao's, so the brim -
  // and the face under it - do not move; what differs is everything above it.
  plumed: { cy: -0.7204, rx: 1.08, ry: 0.4796 },
  turban: { cy: -0.8096, rx: 1.25, ry: 0.5604 },
}

/** The column the near eye sits in, in headR units. */
const EYE_COLUMN = 0.52

/**
 * How far down the headgear reaches at the near-eye column, in headR units.
 *
 * Measured rather than assumed, and the numbers are the point of this
 * function: a helmet reaches +0.342R and a turban +0.196R, while the eye sat
 * at +0.20R and the brow at 0. Two of the five heroes had their whole brow and
 * most of an eye painted on steel or cloth. The comment this replaces claimed
 * "the hair or turban covers down to about -0.05R", which is wrong by 0.25R.
 */
export function gearFaceEdge(headgear: string): number {
  const bowl = GEAR_BOWL[headgear]
  if (bowl) {
    const t = EYE_COLUMN / bowl.rx
    return bowl.cy + bowl.ry * Math.sqrt(Math.max(0, 1 - t * t))
  }
  // The band's lower edge runs (1.02,-0.18) to (-1.02,-0.12); the hood's front
  // edge runs (1.15,-0.10) to (0.30,-0.35).
  if (headgear === 'band') return -0.18 + ((1.02 - EYE_COLUMN) / 2.04) * 0.06
  if (headgear === 'hood') return -0.1 + ((1.15 - EYE_COLUMN) / 0.85) * -0.25
  return -1
}

/**
 * Where the face sits, given what the figure is wearing.
 *
 * Exported because the gate that checks the face lands on SKIN has to know
 * where to look, and the skin band is at a different height for every headgear
 * kind - so a single fixed probe position cannot work. It reads this rather
 * than copying the arithmetic.
 */
export function faceLayout(plan: FigurePlan): {
  drop: number
  showBrow: boolean
  browTop: number
} {
  const face = FACES[plan.face ?? 'plain']
  const gear = gearFaceEdge(plan.headgear)
  // Models the NEAR brow, which is the heavier of the two and so the one
  // that decides how far the face has to clear the brim.
  const browHalf = (0.125 * face.browWeight) / 2 + 0.05
  const eyeRy = 0.098 * face.eyeH
  const CLEAR = 0.12
  const MAX_DROP = 0.42
  let drop = Math.max(0, gear + CLEAR + browHalf)
  let showBrow = true
  if (drop > MAX_DROP) {
    // A deep helmet genuinely covers the brow. Drawing one on steel is what
    // the old face did; leaving it out is both truer and what makes room for
    // the eyes to sit on skin.
    //
    // CURRENTLY UNREACHABLE, and kept deliberately: ART-7 raised every brim
    // until the largest drop in the cast fell to 0.113 against this 0.42. It
    // is the fallback that keeps the face on skin if a gear shape is ever
    // lowered again, and the gate that would catch that is the one probing
    // above the brow.
    showBrow = false
    drop = Math.min(MAX_DROP, Math.max(0, gear + CLEAR + eyeRy - 0.2))
  }
  return { drop, showBrow, browTop: drop - browHalf }
}

function addHeadgear(
  add: (t: Shape['trace'], f: string) => void,
  plan: FigurePlan,
  p: Skeleton,
  m: Materials,
  headR: number,
): void {
  const h = p.head
  const top = h.y - headR * 1.14
  const addBowl = (kind: string): void => {
    const b = GEAR_BOWL[kind]
    if (!b) return
    add((c) => ovalPath(c, { x: h.x, y: h.y + headR * b.cy }, headR * b.rx, headR * b.ry, p.headRot), m.gear)
  }
  switch (plan.headgear) {
    case 'helmet':
      addBowl('helmet')
      // Crest: a blade of plume straight up, so the silhouette has a spike.
      add(
        (c) =>
          polyPath(c, [
            { x: h.x - 2.5, y: top + 2 },
            { x: h.x + 2.5, y: top + 2 },
            { x: h.x + 1, y: top - 12 },
            { x: h.x - 3, y: top - 10 },
          ]),
        m.trim,
      )
      break
    case 'hood':
      add(
        (c) =>
          polyPath(c, [
            { x: h.x - headR * 1.2, y: h.y + headR * 0.5 },
            { x: h.x - headR * 0.9, y: top - 3 },
            { x: h.x + headR * 0.9, y: top - 2 },
            { x: h.x + headR * 1.15, y: h.y - headR * 0.1 },
            { x: h.x + headR * 0.3, y: h.y - headR * 0.35 },
            { x: h.x - headR * 0.8, y: h.y + headR * 0.6 },
          ]),
        m.gear,
      )
      break
    case 'crown':
      addBowl('crown')
      add(
        (c) =>
          polyPath(c, [
            { x: h.x - headR, y: top + 1 },
            { x: h.x - headR * 0.55, y: top - 8 },
            { x: h.x - headR * 0.1, y: top + 1 },
            { x: h.x + headR * 0.35, y: top - 8 },
            { x: h.x + headR * 0.85, y: top + 2 },
          ]),
        m.trim,
      )
      break
    case 'plumed': {
      const cos = Math.cos(p.headRot)
      const sin = Math.sin(p.headRot)
      const at = ([lx, ly]: readonly [number, number]): Pt => ({
        x: h.x + headR * (lx * cos - ly * sin),
        y: h.y + headR * (lx * sin + ly * cos),
      })
      // Plumes first, so the crown's prongs sit over their roots.
      for (const [b, c0, t] of [...PLUMED.plumes].reverse()) {
        add((c) => polyPath(c, plumePolygon(at(b), at(c0), at(t), headR * PLUMED.plumeW)), css(PLUME))
      }
      addBowl('plumed')
      add((c) => polyPath(c, PLUMED.prongs.map(at)), m.trim)
      break
    }
    case 'band':
      add(
        (c) =>
          polyPath(c, [
            { x: h.x - headR * 1.08, y: h.y - headR * 0.62 },
            { x: h.x + headR * 1.08, y: h.y - headR * 0.68 },
            { x: h.x + headR * 1.02, y: h.y - headR * 0.18 },
            { x: h.x - headR * 1.02, y: h.y - headR * 0.12 },
          ]),
        m.gear,
      )
      // Trailing tie, so a headband still changes the outline.
      add(
        (c) =>
          polyPath(c, [
            { x: h.x - headR * 0.95, y: h.y - headR * 0.55 },
            { x: h.x - headR * 2.0, y: h.y + headR * 0.35 },
            { x: h.x - headR * 1.7, y: h.y + headR * 0.75 },
            { x: h.x - headR * 0.9, y: h.y - headR * 0.1 },
          ]),
        m.trim,
      )
      break
    case 'turban':
      addBowl('turban')
      add((c) => ovalPath(c, { x: h.x + headR * 0.55, y: h.y - headR * 0.95 }, headR * 0.5, headR * 0.4, 0.3), m.trim)
      break
  }
}

/**
 * Per-character face shaping.
 *
 * Colour and complexion make five faces DISTINGUISHABLE; this is what makes
 * each one read as the character it belongs to. Every value is a multiple of
 * headR, so a big-headed figure keeps its proportions.
 *
 * `browAngle` rotates each brow about its own midpoint, negative raising the
 * OUTER end. Raising the outer end is what reads as a scowl, and it is worth
 * being precise about why the rotation is about the midpoint rather than the
 * inner end: the brows sit immediately under the hairline, and swinging them
 * up from the inner end pushed the outer tip onto the headband, where it read
 * as a chip in the helmet rather than as a brow.
 *
 * Reference points, so a later change knows what it is changing:
 *   ﹒关羽 Guan Yu  丹凤眼 - the phoenix eye, long and swept up, light brows
 *   ﹒张飞 Zhang Fei 环眼 - round glaring eyes under thick angry brows
 *   ﹒赵云 Zhao Yun 浓眉大眼 - heavy LEVEL brows over large eyes
 *   ﹒黄忠 Huang Zhong the old general - heavily drooping brows, hooded eyes
 *   ﹒魏延 Wei Yan    thin steep brows, narrow eyes
 */


/**
 * The last pass. A face is two marks and a brow, but without them a head is a
 * ball: the old cast had a beard drawn over the eye row and read as faceless.
 */
function drawDetails(
  ctx: CanvasRenderingContext2D,
  plan: FigurePlan,
  p: Skeleton,
  m: Materials,
  includeFace = true,
): void {
  if (includeFace) drawFaceDetails(ctx, plan, p, m)
  drawBodyDetails(ctx, plan, p, m)
}

function drawFaceDetails(ctx: CanvasRenderingContext2D, plan: FigurePlan, p: Skeleton, m: Materials): void {
  const headR = 10.4 * plan.build.head
  const hidden = plan.headgear === 'hood' ? 0.06 : 0
  ctx.save()
  ctx.translate(p.head.x, p.head.y)
  ctx.rotate(p.headRot)

  // --- Face
  //
  // Two eyes, a pair of brows, a nose, a mouth, an ear and a jaw step. Before
  // this a face was ONE brow stroke and ONE eye dot, which is what "the
  // characters have no real faces" meant: a head was a ball with a mark on it.
  //
  // Every landmark is a fraction of headR, so a HEAVY figure with a bigger
  // head keeps the same proportions instead of a face that drifts to one side.
  // The heads are small - headR is about 10 units on a 92-unit figure, so the
  // face is roughly 14 by 12 units - and that drives the whole design: at this
  // size a thin line either vanishes or smears, so every mark is deliberately
  // bold and there are only seven of them.
  //
  // Placed clear of the two things drawn UNDER this pass. The beard's top edge
  // sits at about +0.85R, so the mouth at +0.55R clears it - important, because
  // a mouth drawn over a beard reads as a mouth on a beard. And the hair or
  // turban covers down to about -0.05R, so the brows sit just below it at
  // -0.14R, where they cannot disappear into headgear.
  ctx.globalAlpha = 1 - hidden

  const face = FACES[plan.face ?? 'plain']

  // WHERE THE FACE SITS, which is a function of the headgear rather than a
  // constant. The comment this replaces said "the hair or turban covers down
  // to about -0.05R, so the brows sit just below it at -0.14R, where they
  // cannot disappear into headgear". That was wrong by a quarter of a head: a
  // helmet reaches +0.342R at the eye column and a turban +0.196R, while the
  // brow sat at 0 and the eye at +0.20R. Zhao Yun's eyes were painted on steel
  // and Wei Yan's on cloth.
  //
  // The face comes DOWN to meet the brim rather than the brim going up,
  // because headgear is a `shapes` entry and raising it would move the
  // silhouette - which `fitSprite` and six art gates are built on.
  const { drop, showBrow } = faceLayout(plan)

  // The nose is the one form mark worth drawing, and it has to REACH THE
  // SILHOUETTE to read as a nose in three-quarter view rather than as a spot
  // on a cheek. Small disconnected marks - an ear, a separate jaw shadow -
  // were tried and removed: at this size they rendered as blemishes.
  //
  // Measured in device pixels, because that is what decides whether a mark
  // reads: at a 41.6px head this used to run 11.1px long and taper to 1.87px,
  // which anti-aliases into a smudge. It was one of the two long dark dashes
  // the owner saw. Shorter, and no thinner than ~2.7px at either end.
  ctx.fillStyle = m.skinForm
  limbPath(
    ctx,
    { x: headR * 0.72, y: headR * (0.06 + drop) },
    { x: headR * 0.95, y: headR * (0.3 + drop) },
    headR * 0.15,
    headR * 0.13,
  )
  ctx.fill()

  // Both eyes. A three-quarter view shows the far one compressed against the
  // silhouette, and drawing it is most of what says the head is TURNED rather
  // than a flat disc with one dot on it.
  // Wider than tall. The old eye was 0.14 x 0.15 - a round DOT - and at a head
  // 40 device pixels across that is the same "cartoon, not human" signal the
  // portrait had. A human aperture is about 2:1, and the shape reads even when
  // the whole eye is seven pixels wide.
  ctx.fillStyle = m.eye
  ovalPath(
    ctx,
    { x: headR * 0.16, y: headR * (0.22 + drop) },
    headR * 0.12 * face.eyeW,
    headR * 0.085 * face.eyeH,
    0,
  )
  ctx.fill()
  if (plan.missingEye) {
    // Xiahou Dun, who lost an eye to an arrow and is said to have swallowed it
    // with wine. A hollow rather than an eye - a shade larger, no catchlight -
    // and the scar must CROSS it and keep going, because at this size a plain
    // dark oval reads as just another eye and it is the extension past the
    // socket that says WOUND. The scar is pale scar tissue, tinted from the
    // figure's own complexion so it stays his on every skin.
    ovalPath(
      ctx,
      { x: headR * 0.52, y: headR * (0.2 + drop) },
      headR * 0.15 * face.eyeW,
      headR * 0.13 * face.eyeH,
      0,
    )
    ctx.fill()
    ctx.fillStyle = css(tint(plan.skin ?? SKIN, 0.35))
    limbPath(
      ctx,
      { x: headR * 0.66, y: headR * (-0.04 + drop) },
      { x: headR * 0.36, y: headR * (0.48 + drop) },
      headR * 0.06,
      headR * 0.05,
    )
    ctx.fill()
  } else {
    // The near eye carries a SCLERA. At a 41.6px head it is about 8 x 5 device
    // pixels - enough for a dark iris with roughly 1.5px of white either side,
    // which is what stops it reading as one more dark speck among the brow,
    // nose and mouth. The far eye at 5 x 3 is not enough and stays a plain
    // dark mark; a 1px sliver of white there would be a flicker, not an eye.
    const nearRx = headR * 0.17 * face.eyeW
    const nearRy = headR * 0.098 * face.eyeH
    const nearC = { x: headR * 0.52, y: headR * (0.2 + drop) }
    ctx.fillStyle = SCLERA
    ovalPath(ctx, nearC, nearRx, nearRy, 0)
    ctx.fill()
    ctx.fillStyle = m.eye
    ovalPath(ctx, { x: nearC.x + nearRx * 0.12, y: nearC.y }, nearRy, nearRy, 0)
    ctx.fill()
  }

  // Brows in HAIR colour rather than ink, so they belong to the character -
  // Zhang Fei's near-black, Huang Zhong's grey - and shaped by the face kind,
  // because the angle reads as a temperament before anything else does.
  ctx.fillStyle = m.hair
  const brow = (
    innerX: number,
    innerY: number,
    reach: number,
    w: number,
  ): void => {
    const midX = headR * (innerX + (reach * face.browLength) / 2)
    const midY = headR * (innerY + 0.06 + drop)
    const halfX = (headR * reach * face.browLength) / 2
    const halfY = headR * 0.05
    const cos = Math.cos(face.browAngle)
    const sin = Math.sin(face.browAngle)
    limbPath(
      ctx,
      { x: midX - (halfX * cos - halfY * sin), y: midY - (halfX * sin + halfY * cos) },
      { x: midX + (halfX * cos - halfY * sin), y: midY + (halfX * sin + halfY * cos) },
      headR * w * face.browWeight,
      headR * w * 0.82 * face.browWeight,
    )
    ctx.fill()
  }
  // Far brow, then the near one, which is longer and heavier.
  if (showBrow) {
    brow(0.06, -0.02, 0.2, 0.1)
    brow(0.36, -0.06, 0.34, 0.125)
  }

  // Mouth.
  // The mouth moves with the rest, but stops short of the beard: a mouth drawn
  // over a beard reads as a mouth ON a beard.
  const mouthY = Math.min(0.56 + drop, plan.beard === 'none' ? 0.95 : 0.78)
  ctx.fillStyle = INK
  limbPath(
    ctx,
    { x: headR * 0.42, y: headR * mouthY },
    { x: headR * 0.72, y: headR * (mouthY - 0.04) },
    headR * 0.14,
    headR * 0.14,
  )
  ctx.fill()
  ctx.restore()

}

function drawBodyDetails(ctx: CanvasRenderingContext2D, plan: FigurePlan, p: Skeleton, m: Materials): void {
  // Sash across the chest: the accent that keeps the torso from being one flat
  // field, and the thing that tells two similarly-coloured fighters apart.
  const a = lerpPt(p.chest, p.hip, 0.18)
  const bPt = lerpPt(p.chest, p.hip, 0.62)
  ctx.save()
  ctx.fillStyle = m.trim
  limbPath(ctx, { x: a.x - 10, y: a.y }, { x: bPt.x + 9, y: bPt.y }, 4, 4)
  ctx.fill()
  ctx.fillStyle = m.trimShade
  limbPath(ctx, { x: a.x - 10, y: a.y + 1.6 }, { x: bPt.x + 9, y: bPt.y + 1.6 }, 1.3, 1.3)
  ctx.fill()
  ctx.restore()

  // Belt.
  ctx.save()
  ctx.fillStyle = m.leather
  limbPath(
    ctx,
    { x: p.hip.x - 11 * plan.build.bulk, y: p.hip.y - 2 },
    { x: p.hip.x + 11 * plan.build.bulk, y: p.hip.y - 2 },
    5,
    5,
  )
  ctx.fill()
  ctx.restore()
}

export { BODY_X, FIG_H, FIG_W, GROUND }
