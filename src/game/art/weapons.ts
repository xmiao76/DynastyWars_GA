import { WEAPONS, type FigurePlan } from './figures'
import { HEAD_CHIN_DROP } from './hero-resources'
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
  // BODY-16 chin-anchored re-seat for the scaled painted heads: the chin
  // stays on the neck while the head art shrinks around the eye. Lying
  // heads shift along the head->chest axis (their eye->chin direction).
  const ldx = pose.chest.x - pose.head.x
  const ldy = pose.chest.y - pose.head.y
  const llen = Math.hypot(ldx, ldy) || 1
  const base = {
    ...pose,
    head: pose.lying
      ? { x: pose.head.x + (ldx / llen) * HEAD_CHIN_DROP, y: pose.head.y + (ldy / llen) * HEAD_CHIN_DROP }
      : { x: pose.head.x, y: pose.head.y + HEAD_CHIN_DROP },
  }
  if (pose.lying) {
    return {
      ...base,
      handN: { x: base.handN.x, y: base.handN.y - 9 },
      elbowN: { x: base.elbowN.x, y: base.elbowN.y - 4.5 },
    }
  }
  const adjusted = plan.weapon === 'bow'
    ? { ...pose, handN: { x: pose.handN.x + 14, y: pose.handN.y }, elbowN: { x: pose.elbowN.x + 7, y: pose.elbowN.y } }
    : pose
  // BODY-15 far-hand choreography: the far arm hung inside the torso span
  // in every pose, so only one hand ever read. Polearms get a true
  // two-handed grip (far fist on the haft behind the near fist);
  // one-handers and bows get a visible counterbalance arm swung out back.
  // The weapon anchor (handN) never moves, so tip reach is byte-stable.
  const twoHanded = ['crescent', 'serpent', 'leaf', 'ji'].includes(WEAPONS[plan.weapon].head)
  // 12u of separation: each fist spans ~4u along the haft and the near
  // fist's blob reaches ~6u, so 10u still buried the far fist under it
  // in extended strikes (measured 4px); 12u leaves a real gap while
  // staying on the haft (the butt is ~20u behind the grip).
  const handF = twoHanded
    ? {
        x: adjusted.handN.x - 12 * Math.cos(adjusted.weaponRot),
        y: adjusted.handN.y - 12 * Math.sin(adjusted.weaponRot),
      }
    : { x: adjusted.shoulderF.x - 14, y: adjusted.shoulderF.y + 12 }
  const mx = (adjusted.shoulderF.x + handF.x) / 2
  const my = (adjusted.shoulderF.y + handF.y) / 2
  const dx = mx - adjusted.chest.x
  const dy = my - adjusted.chest.y
  const len = Math.hypot(dx, dy) || 1
  const elbowF = { x: mx + (dx / len) * 3.5, y: my + (dy / len) * 3.5 }
  return { ...adjusted, handF, elbowF }
}
/**
 * BODY-10 painted materials. Each overlay runs inside its shape's clip, in
 * the weapon's own frame (x along the haft, grip at 0), after the cel
 * bands. Restrained brushwork - one gradient sweep and a few lines per
 * part: enough for wood, steel and cloth to read at gameplay size without
 * cartoon shine. Geometry is untouched: the ART-14/15 silhouettes and
 * reach stay byte-stable because the PATHS do.
 */
export function woodMat(back: number, fore: number, haft: number) {
  return (c: CanvasRenderingContext2D): void => {
    const g = c.createLinearGradient(0, -haft / 2, 0, haft / 2)
    g.addColorStop(0, 'rgba(255,226,180,0.30)')
    g.addColorStop(0.32, 'rgba(120,80,42,0.10)')
    g.addColorStop(0.72, 'rgba(32,18,8,0.34)')
    g.addColorStop(1, 'rgba(20,12,6,0.5)')
    c.fillStyle = g
    c.fillRect(back, -haft, fore - back, haft * 2)
    c.strokeStyle = 'rgba(38,22,10,0.38)'
    c.lineWidth = 0.7
    c.beginPath()
    c.moveTo(back + 1.5, -haft * 0.16)
    c.lineTo(fore - 1.5, -haft * 0.1)
    c.stroke()
    c.beginPath()
    c.moveTo(back + 2, haft * 0.2)
    c.lineTo(fore - 2, haft * 0.24)
    c.stroke()
    c.strokeStyle = 'rgba(255,230,190,0.24)'
    c.lineWidth = 0.55
    c.beginPath()
    c.moveTo(back + 1, -haft * 0.34)
    c.lineTo(fore - 1, -haft * 0.32)
    c.stroke()
  }
}

export function steelMat(fore: number): (c: CanvasRenderingContext2D) => void {
  return (c: CanvasRenderingContext2D): void => {
    // The sweep is anchored on the blade (x near fore), not the grip -
    // a fixed origin-left gradient painted nothing onto the blades.
    const g = c.createLinearGradient(fore - 30, -10, fore + 30, 10)
    g.addColorStop(0, 'rgba(36,46,62,0.34)')
    g.addColorStop(0.22, 'rgba(36,46,62,0)')
    g.addColorStop(0.45, 'rgba(255,255,255,0.24)')
    g.addColorStop(0.62, 'rgba(255,255,255,0)')
    g.addColorStop(0.88, 'rgba(255,255,255,0.34)')
    g.addColorStop(1, 'rgba(255,255,255,0.1)')
    c.fillStyle = g
    c.fillRect(fore - 44, -14, 88, 28)
  }
}

export function metalMat(): (c: CanvasRenderingContext2D) => void {
  return (c: CanvasRenderingContext2D): void => {
    // Y-only gradient; the x extent covers any fitting (the shape's clip
    // confines the paint) - ferrules sit near fore, the pommel near back.
    const g = c.createLinearGradient(0, -6, 0, 6)
    g.addColorStop(0, 'rgba(255,255,255,0.3)')
    g.addColorStop(0.5, 'rgba(255,255,255,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.32)')
    c.fillStyle = g
    c.fillRect(-200, -8, 400, 16)
  }
}

export function clothMat(): (c: CanvasRenderingContext2D) => void {
  return (c: CanvasRenderingContext2D): void => {
    // Two folds and one highlight: the tassel reads as gathered cloth.
    c.strokeStyle = 'rgba(60,10,12,0.42)'
    c.lineWidth = 0.8
    c.beginPath()
    c.moveTo(-1.6, 3.2)
    c.quadraticCurveTo(-2.2, 6, -1.2, 9)
    c.stroke()
    c.beginPath()
    c.moveTo(1.8, 3)
    c.quadraticCurveTo(2.4, 6.2, 1.4, 9.2)
    c.stroke()
    c.strokeStyle = 'rgba(255,190,170,0.28)'
    c.lineWidth = 0.7
    c.beginPath()
    c.moveTo(-0.2, 2.8)
    c.quadraticCurveTo(-0.6, 6, 0.2, 9.4)
    c.stroke()
  }
}

export function addWeapon(
  add: (t: WeaponTrace, f: string, outline?: boolean, mat?: (c: CanvasRenderingContext2D) => void) => void,
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
    add(oriented((c) => traceBow(c, fore)), m.haft, true, (c: CanvasRenderingContext2D): void => {
      // The bow arcs across y -14..-2 in this frame; wood runs along it.
      const g = c.createLinearGradient(0, -16, 0, 2)
      g.addColorStop(0, 'rgba(255,226,180,0.3)')
      g.addColorStop(0.55, 'rgba(120,80,42,0.12)')
      g.addColorStop(1, 'rgba(24,14,8,0.5)')
      c.fillStyle = g
      c.fillRect(-fore - 4, -18, fore * 2 + 8, 22)
      c.strokeStyle = 'rgba(38,22,10,0.36)'
      c.lineWidth = 0.7
      c.beginPath()
      c.moveTo(-fore + 2, -11)
      c.quadraticCurveTo(0, -14, fore - 2, -11)
      c.stroke()
    })
    // A closed strip bridges both nocks. A crossed capsule fill left a gap
    // in the middle when drawn without ink, turning the bow into an open arc.
    add(
      oriented((c) => polyPath(c, [
        { x: -fore, y: -10.55 }, { x: fore, y: -10.55 },
        { x: fore, y: -9.45 }, { x: -fore, y: -9.45 },
      ])),
      '#d8c49a', true,
      (c: CanvasRenderingContext2D): void => {
        c.fillStyle = 'rgba(255,248,224,0.5)'
        c.fillRect(-fore, -10.55, fore * 2, 0.6)
        c.fillStyle = 'rgba(80,60,30,0.3)'
        c.fillRect(-fore, -9.85, fore * 2, 0.4)
      },
    )
    add(oriented((c) => limbPath(c, { x: -3, y: 0 }, { x: 3, y: 0 }, 3.2, 3.2)), m.leather, true, metalMat())
    return
  }

  // Haft.
  add(oriented((c) => limbPath(c, { x: back, y: 0 }, { x: fore, y: 0 }, spec.haft, spec.haft)), m.haft, true,
    woodMat(back, fore, spec.haft))
  // Metal pommel at the butt: a fitting, not a rounded brown blob (the
  // owner's foot-zone complaint pointed straight at this end).
  add(oriented((c) => limbPath(c, { x: back - 0.4, y: 0 }, { x: back + 2.6, y: 0 }, spec.haft * 0.62, spec.haft * 0.56)),
    m.steelShade, true, metalMat())
  // Ferrule where haft meets steel: without it a blade reads as a blob stuck
  // on a stick, which is exactly how the old swung weapons read.
  add(
    oriented((c) =>
      limbPath(c, { x: fore - 12, y: 0 }, { x: fore - 7, y: 0 }, spec.haft + 2.4, spec.haft + 2.4),
    ),
    m.trim, true, metalMat(),
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
      m.tassel, true, clothMat(),
    )
  }

  switch (spec.head) {
    case 'crescent':
      add(oriented((c) => traceBlade(c, 'crescent', fore)), m.steel, true, steelMat(fore))
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
      add(oriented((c) => traceBlade(c, 'serpent', fore)), m.steel, true, steelMat(fore))
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
      add(oriented((c) => traceBlade(c, 'leaf', fore)), m.steel, true, steelMat(fore))
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
        m.steel, true, steelMat(fore),
      )
      add(oriented((c) => ovalPath(c, { x: fore - 4.5, y: 0 }, 2.6, 5.2, 0)), m.trim, true, metalMat())
      break
    case 'dao':
      add(oriented((c) => traceBlade(c, 'dao', fore)), m.steel, true, steelMat(fore))
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
      add(oriented((c) => ovalPath(c, { x: fore + 4, y: 0 }, 11, 4.4, 0)), m.steel, true, steelMat(fore))
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
          m.steel, true, steelMat(fore),
        )
      }
      break
  }
}
