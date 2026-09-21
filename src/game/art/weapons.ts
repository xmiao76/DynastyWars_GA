import { WEAPONS, type FigurePlan } from './figures'
import type { Materials } from './palette'
import { limbPath, ovalPath, polyPath, type Skeleton } from './rig'

export type BladeHead = 'crescent' | 'serpent' | 'leaf' | 'dao'
export type WeaponTrace = (c: CanvasRenderingContext2D) => void
const STEEL_EDGE = '#eef4fa'

/**
 * Weapon-only paths. Local X follows the haft; fore is the socket end.
 * The guandao/serpent identities follow Romance/folk depictions, not a claim
 * about surviving weapons owned by the historical generals.
 * References: https://anthony.sogang.ac.kr/ThreeKingdoms/bc001.htm
 *             https://en.wikipedia.org/wiki/Guandao
 */
export function traceBlade(c: CanvasRenderingContext2D, head: BladeHead, fore = 0): void {
  c.beginPath()
  switch (head) {
    case 'crescent':
      // A long cutting belly and rising point; the small spur is on the BACK
      // near the socket, not a rounded hook replacing the cutting tip.
      c.moveTo(fore - 9, -1.8)
      c.lineTo(fore - 5, -2)
      c.lineTo(fore - 7, -5.8)
      c.lineTo(fore - 2, -3.2)
      c.quadraticCurveTo(fore + 12, -2, fore + 22, -9)
      c.quadraticCurveTo(fore + 18, 1, fore + 8, 5)
      c.quadraticCurveTo(fore - 1, 6, fore - 9, 1.8)
      break
    case 'serpent':
      // A thin ribbon around an S-shaped centreline. Increasing the ribbon's
      // thickness hides the waves and turns it into the old curled leaf.
      c.moveTo(fore - 7, -1.4)
      c.bezierCurveTo(fore - 2, -1.4, fore - 2, -5.5, fore + 3, -5.5)
      c.bezierCurveTo(fore + 8, -5.5, fore + 8, 2.5, fore + 12, 2.5)
      c.bezierCurveTo(fore + 17, 2.5, fore + 17, -2, fore + 22, 0)
      c.bezierCurveTo(fore + 17, 1, fore + 17, 5.5, fore + 12, 5.5)
      c.bezierCurveTo(fore + 8, 5.5, fore + 8, -2.5, fore + 3, -2.5)
      c.bezierCurveTo(fore - 2, -2.5, fore - 2, 1.4, fore - 7, 1.4)
      break
    case 'leaf':
      c.moveTo(fore - 5, 0)
      c.lineTo(fore, -2.2)
      c.quadraticCurveTo(fore + 8, -3, fore + 22, 0)
      c.quadraticCurveTo(fore + 8, 3, fore, 2.2)
      break
    case 'dao':
      // Wei Yan retains the game's long-handled dao: nearly straight spine,
      // angled point, one controlled cutting belly, no shovel-shaped dome.
      c.moveTo(fore - 9, -2.4)
      c.lineTo(fore + 16, -3.3)
      c.lineTo(fore + 23, -6.3)
      c.lineTo(fore + 20, 2.4)
      c.quadraticCurveTo(fore + 7, 7, fore - 9, 2.4)
      break
  }
  c.closePath()
}

/** Flat material facets, clipped to the blade by the caller and never inked. */
function traceBladeFacet(c: CanvasRenderingContext2D, head: BladeHead, fore: number): void {
  c.beginPath()
  switch (head) {
    case 'crescent':
      c.moveTo(fore - 7, -0.6)
      c.lineTo(fore - 2, -2)
      c.quadraticCurveTo(fore + 9, -0.8, fore + 19, -6.6)
      c.quadraticCurveTo(fore + 11, 0.6, fore + 3, 1.5)
      c.lineTo(fore - 7, 1.2)
      break
    case 'serpent':
      c.moveTo(fore - 6, 0.2)
      c.bezierCurveTo(fore - 2, 0.2, fore - 2, -3.8, fore + 3, -3.8)
      c.bezierCurveTo(fore + 8, -3.8, fore + 8, 4.2, fore + 12, 4.2)
      c.bezierCurveTo(fore + 17, 4.2, fore + 17, -0.3, fore + 20, -0.2)
      c.bezierCurveTo(fore + 17, 1.2, fore + 17, 5.1, fore + 12, 5.1)
      c.bezierCurveTo(fore + 8, 5.1, fore + 8, -2.9, fore + 3, -2.9)
      c.bezierCurveTo(fore - 2, -2.9, fore - 2, 1.1, fore - 6, 1.1)
      break
    case 'leaf':
      c.moveTo(fore - 5, 0)
      c.lineTo(fore + 22, 0)
      c.quadraticCurveTo(fore + 8, 3, fore, 2.2)
      break
    case 'dao':
      c.moveTo(fore - 8, -1.5)
      c.lineTo(fore + 16, -2.5)
      c.lineTo(fore + 21, -4.5)
      c.lineTo(fore + 16, -0.4)
      c.lineTo(fore - 8, 0.2)
      break
  }
  c.closePath()
}

function traceBladeEdge(c: CanvasRenderingContext2D, head: BladeHead, fore: number): void {
  c.beginPath()
  switch (head) {
    case 'crescent':
      c.moveTo(fore - 4, 3.1)
      c.quadraticCurveTo(fore + 8, 6.5, fore + 21, -7.3)
      c.quadraticCurveTo(fore + 14, 3, fore + 7, 4)
      c.quadraticCurveTo(fore, 4, fore - 4, 3.1)
      break
    case 'serpent':
      c.moveTo(fore - 5, -0.3)
      c.bezierCurveTo(fore - 2, -0.3, fore - 2, -4.6, fore + 3, -4.6)
      c.bezierCurveTo(fore + 8, -4.6, fore + 8, 3.4, fore + 12, 3.4)
      c.bezierCurveTo(fore + 17, 3.4, fore + 17, -1.1, fore + 21, -0.1)
      c.bezierCurveTo(fore + 17, -0.5, fore + 17, 4, fore + 12, 4)
      c.bezierCurveTo(fore + 8, 4, fore + 8, -4, fore + 3, -4)
      c.bezierCurveTo(fore - 2, -4, fore - 2, 0.3, fore - 5, 0.3)
      break
    case 'leaf':
      c.moveTo(fore - 3, -0.3)
      c.lineTo(fore, -1.5)
      c.quadraticCurveTo(fore + 8, -2.1, fore + 20, -0.05)
      c.quadraticCurveTo(fore + 9, -1.1, fore, -0.55)
      break
    case 'dao':
      c.moveTo(fore - 5, 2.2)
      c.quadraticCurveTo(fore + 10, 5.6, fore + 20, 1.5)
      c.lineTo(fore + 22, -4.5)
      c.lineTo(fore + 21, 1.6)
      c.quadraticCurveTo(fore + 10, 6.2, fore - 5, 2.2)
      break
  }
  c.closePath()
}

/** Slim recurve limbs, with the riser's centre exactly at the holding hand. */
export function traceBow(c: CanvasRenderingContext2D, halfLength: number): void {
  const h = halfLength
  c.beginPath()
  c.moveTo(-h, -10)
  c.quadraticCurveTo(-h + 1, -4, -h * 0.73, 0)
  c.quadraticCurveTo(-h * 0.35, 5, -3, 1.4)
  c.lineTo(3, 1.4)
  c.quadraticCurveTo(h * 0.35, 5, h * 0.73, 0)
  c.quadraticCurveTo(h - 1, -4, h, -10)
  c.lineTo(h - 2, -9.5)
  c.quadraticCurveTo(h - 3, -5, h * 0.67, -2)
  c.quadraticCurveTo(h * 0.32, 1.6, 3, -1.4)
  c.lineTo(-3, -1.4)
  c.quadraticCurveTo(-h * 0.32, 1.6, -h * 0.67, -2)
  c.quadraticCurveTo(-h + 3, -5, -h + 2, -9.5)
  c.closePath()
}

/**
 * Art-only grip corrections. Keep the bow in front of the face and a dropped
 * weapon above the prone face; attacks, simulation geometry and timing do not
 * use these joints.
 */
export function weaponPose(plan: FigurePlan, pose: Skeleton): Skeleton {
  if (pose.lying) {
    return {
      ...pose,
      handN: { x: pose.handN.x, y: pose.handN.y - 9 },
      elbowN: { x: pose.elbowN.x, y: pose.elbowN.y - 4.5 },
    }
  }
  if (plan.weapon !== 'bow') return pose
  return {
    ...pose,
    handN: { x: pose.handN.x + 14, y: pose.handN.y },
    elbowN: { x: pose.elbowN.x + 7, y: pose.elbowN.y },
  }
}
export function addWeapon(
  add: (t: WeaponTrace, f: string, outline?: boolean) => void,
  plan: FigurePlan,
  p: Skeleton,
  m: Materials,
): void {
  const spec = WEAPONS[plan.weapon]
  const hand = p.handN
  const back = -spec.length * p.weaponGrip
  const fore = spec.length * (1 - p.weaponGrip)
  const oriented = (trace: (c: CanvasRenderingContext2D) => void) => (c: CanvasRenderingContext2D) => {
    c.translate(hand.x, hand.y)
    c.rotate(p.weaponRot)
    trace(c)
  }

  if (spec.head === 'bow') {
    add(oriented((c) => traceBow(c, fore)), m.haft)
    // A closed strip bridges both nocks. A crossed capsule fill left a gap
    // in the middle when drawn without ink, turning the bow into an open arc.
    add(
      oriented((c) => polyPath(c, [
        { x: -fore, y: -10.55 }, { x: fore, y: -10.55 },
        { x: fore, y: -9.45 }, { x: -fore, y: -9.45 },
      ])),
      '#d8c49a',
    )
    add(oriented((c) => limbPath(c, { x: -3, y: 0 }, { x: 3, y: 0 }, 3.2, 3.2)), m.leather, false)
    return
  }

  // Haft.
  add(oriented((c) => limbPath(c, { x: back, y: 0 }, { x: fore, y: 0 }, spec.haft, spec.haft)), m.haft)
  // Ferrule where haft meets steel: without it a blade reads as a blob stuck
  // on a stick, which is exactly how the old swung weapons read.
  add(
    oriented((c) =>
      limbPath(c, { x: fore - 12, y: 0 }, { x: fore - 7, y: 0 }, spec.haft + 2.4, spec.haft + 2.4),
    ),
    m.trim,
  )
  // 红缨: the red tassel at the socket. Cloth hangs DOWN, whatever the weapon
  // is doing - so the tuft is drawn in a gravity-aligned frame: translate to
  // the socket, then UNDO the weapon's rotation before drawing it hanging +y.
  // Rotating with the weapon instead had it sticking sideways-forward at idle
  // carry, where a spear is near-vertical and a real tassel droops along the
  // haft. Wide enough at every point that the ink pass cannot swallow it.
  if (spec.tassel) {
    add(
      oriented((c) => {
        c.translate(fore - 7.5, 0)
        c.rotate(-p.weaponRot)
        polyPath(c, [
          { x: -3.5, y: 2.4 },
          { x: 3.5, y: 2.0 },
          { x: 3, y: 9 },
          { x: 0.5, y: 10 },
          { x: -2, y: 7.5 },
        ])
      }),
      m.tassel,
    )
  }

  switch (spec.head) {
    case 'crescent':
      add(oriented((c) => traceBlade(c, 'crescent', fore)), m.steel)
      add(oriented((c) => {
        traceBlade(c, 'crescent', fore)
        c.clip()
        traceBladeFacet(c, 'crescent', fore)
      }), m.steelShade, false)
      add(oriented((c) => {
        traceBlade(c, 'crescent', fore)
        c.clip()
        traceBladeEdge(c, 'crescent', fore)
      }), STEEL_EDGE, false)
      break
    case 'serpent':
      add(oriented((c) => traceBlade(c, 'serpent', fore)), m.steel)
      add(oriented((c) => {
        traceBlade(c, 'serpent', fore)
        c.clip()
        traceBladeFacet(c, 'serpent', fore)
      }), m.steelShade, false)
      add(oriented((c) => {
        traceBlade(c, 'serpent', fore)
        c.clip()
        traceBladeEdge(c, 'serpent', fore)
      }), STEEL_EDGE, false)
      break
    case 'leaf':
      add(oriented((c) => traceBlade(c, 'leaf', fore)), m.steel)
      add(oriented((c) => {
        traceBlade(c, 'leaf', fore)
        c.clip()
        traceBladeFacet(c, 'leaf', fore)
      }), m.steelShade, false)
      add(oriented((c) => {
        traceBlade(c, 'leaf', fore)
        c.clip()
        traceBladeEdge(c, 'leaf', fore)
      }), STEEL_EDGE, false)
      break
    case 'jian':
      // A straight double-edged jian - right for Cao Cao's 倚天剑 - with a
      // Chinese DISC guard. The old crossguard was European and wrong for the
      // setting on every wielder.
      add(
        oriented((c) =>
          polyPath(c, [
            { x: fore - 5, y: -4.4 },
            { x: fore + 21, y: -2.6 },
            { x: fore + 26, y: 0 },
            { x: fore + 21, y: 2.6 },
            { x: fore - 5, y: 4.4 },
          ]),
        ),
        m.steel,
      )
      add(oriented((c) => ovalPath(c, { x: fore - 4.5, y: 0 }, 2.6, 5.2, 0)), m.trim)
      break
    case 'dao':
      add(oriented((c) => traceBlade(c, 'dao', fore)), m.steel)
      add(oriented((c) => {
        traceBlade(c, 'dao', fore)
        c.clip()
        traceBladeFacet(c, 'dao', fore)
      }), m.steelShade, false)
      add(oriented((c) => {
        traceBlade(c, 'dao', fore)
        c.clip()
        traceBladeEdge(c, 'dao', fore)
      }), STEEL_EDGE, false)
      break
    case 'ji':
      // 方天画戟 - the central spearhead plus the PAIR of crescent wings that
      // give the halberd its name (方天 = the double wing). The classic weapon
      // carries them pointing FORWARD past the spearhead's base, not curled
      // back over it, so they are drawn as forward crescents here.
      add(oriented((c) => ovalPath(c, { x: fore + 4, y: 0 }, 11, 4.4, 0)), m.steel)
      for (const s of [1, -1]) {
        add(
          oriented((c) => {
            c.beginPath()
            c.moveTo(fore - 4, -3 * s)
            c.quadraticCurveTo(fore + 2, -11 * s, fore + 6, -10 * s)
            c.quadraticCurveTo(fore + 4, -5 * s, fore + 8, -2 * s)
            c.quadraticCurveTo(fore + 3, 0, fore - 4, 3 * s)
            c.closePath()
          }),
          m.steel,
        )
      }
      break
  }
}
