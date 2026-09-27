import { writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

/**
 * BODY-3 preparation: cut paper-doll part cells from hero body masters.
 *
 * Per hero, joints are eyeballed master-pixel coords (see body-grid20
 * overlays). Each part derotates its joint span to vertical, scales to a
 * canonical cell, keys the black background by corner flood, and records
 * pivot + rect into prepared.json. Viewer-left limbs map to F parts,
 * viewer-right to N parts (documented convention; sleeves match).
 */
export const DENSITY = 4
/** Flood-key tolerance. 16 ate into near-black costume (trouser folds);
 * 10 keeps the key while sparing anything the painter actually painted. */
export const KEY_TOLERANCE = 10
/**
 * BODY-23 (G6) re-key. The old border flood crawled through the master's
 * dark OUTLINE into near-black costume and ate whole interior regions -
 * measured 16-36% interior-hole share on Cao Cao's lacquer armour. Two
 * changes, neither of them a looser tolerance:
 *
 * 1. Background is dark AND ACHROMATIC (chroma <= KEY_CHROMA): the flood's
 *    ground is true black, while costume carries hue even at near-black
 *    luminance. Chromatic dark pixels are costume and are NEVER keyed,
 *    so the key cannot leak through a blue-black or brown-black garment.
 * 2. Interior fill: transparent pixels NOT connected to the cell border
 *    stay opaque with the master's matte - "holes not connected to the
 *    cell border stay opaque / matte from the master".
 */
export const KEY_CHROMA = 6
export const FAR_SHADE = 0.82
/**
 * BODY-19 wrist cut: forearm cells end at the wrist (this fraction along
 * elbow-> fingertip), not at the open palm. The procedural fist/mitten is
 * drawn over the joint with its back reaching -3.2u, which swallows the cut
 * edge (~2.5u behind the palm joint). Without the cut, the painted splayed
 * fingers poke out around the fist - two hands, neither attached.
 */
export const WRIST_FRACTION = 0.58
/** Palm joint derivation (elbow->fingertip fraction); the rig's hand joint. */
export const PALM_FRACTION = 0.75

/**
 * BODY-20 painted hands. The masters are T-poses with open palms, so there
 * is no fist to cut from them; the fists/wraps/relaxed hands are PAINTED
 * here per fighter, skin-matched from the joints table, with soft form
 * shading and NO ink outline (the old procedural fists were flat cel
 * capsules with 1u ink borders - the round-3 "cartoon sticker" complaint).
 *
 * Five cells per fighter, each 12x10 logical units at density 4 (48x40
 * device px), pivot at the hand joint (local 6,5 -> device 24,20), painted
 * pointing +x along the forearm (wrapF: along the haft):
 *   gripN  near fist wrapping the haft      gripF  same, far-arm shaded
 *   relaxN near open relaxed hand           relaxF same, far-arm shaded
 *   wrapF  far fingertips crossing the haft (drawn over the weapon)
 * Device px per logical unit is exactly DENSITY for every fighter (the
 * body cells key off pxPerUnit and cancel out), so one paint routine
 * serves the whole cast and the recorded density stays truthful.
 */
export const HAND_CELL_W = 12
export const HAND_CELL_H = 10
export const HAND_CELLS = ['gripN', 'gripF', 'relaxN', 'relaxF', 'wrapF', 'wrapN']

const shadeC = (rgb, amount) => {
  const r = Math.round(((rgb >> 16) & 0xff) * (1 - amount))
  const g = Math.round(((rgb >> 8) & 0xff) * (1 - amount))
  const b = Math.round((rgb & 0xff) * (1 - amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/** Fist silhouette pointing +x: flat knuckle ridge, scalloped finger front. */
function fistPath(c) {
  c.beginPath()
  // Wrist end and the flatter back-of-hand top (a fist is not an egg).
  c.moveTo(-2.9, -2.1)
  c.bezierCurveTo(-1.0, -2.85, 1.2, -3.05, 2.7, -2.85)
  c.lineTo(3.5, -2.75)
  // Knuckle ridge into the finger block: three bumps, two DEEP notches
  // (1.2u, so digit grouping reads at 4x - UIR-12).
  c.quadraticCurveTo(4.7, -2.5, 5.3, -1.9)
  c.quadraticCurveTo(3.95, -1.2, 4.4, -0.65)
  c.quadraticCurveTo(5.5, -0.3, 5.55, 0.2)
  c.quadraticCurveTo(4.0, 0.7, 4.55, 1.25)
  c.quadraticCurveTo(5.35, 1.85, 4.85, 2.3)
  // Fingers back into the palm, then the palm bottom to the wrist.
  c.bezierCurveTo(4.1, 2.8, 3.0, 2.9, 1.8, 2.85)
  c.bezierCurveTo(0, 2.85, -1.4, 2.5, -2.9, 2.05)
  c.quadraticCurveTo(-3.5, 0, -2.9, -2.1)
  c.closePath()
}

/** Open relaxed hand: palm wedge into grouped fingers, scalloped tips. */
function relaxPath(c) {
  c.beginPath()
  c.moveTo(-2.9, -2.0)
  c.bezierCurveTo(-1.0, -2.65, 0.6, -2.8, 1.9, -2.7)
  c.lineTo(2.6, -2.6)
  // Finger group edge: three tips, two deep notches between them
  // (1.2u - UIR-12, matching the fist).
  c.quadraticCurveTo(4.15, -2.35, 5.15, -1.75)
  c.quadraticCurveTo(3.8, -1.0, 4.25, -0.5)
  c.quadraticCurveTo(5.35, -0.1, 5.45, 0.4)
  c.quadraticCurveTo(4.1, 0.9, 4.4, 1.4)
  c.quadraticCurveTo(5.15, 2.0, 4.55, 2.4)
  c.bezierCurveTo(3.4, 2.85, 1.6, 2.85, 0, 2.8)
  c.bezierCurveTo(-1.3, 2.75, -2.1, 2.45, -2.9, 2.0)
  c.quadraticCurveTo(-3.45, 0, -2.9, -2.0)
  c.closePath()
}

function ellipse(c, cx, cy, rx, ry, rot) {
  c.beginPath()
  c.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2)
  c.closePath()
}

/** Volume + creases shared by the fist and the open hand. */
function formShade(c, kind, colors) {
  // Clip to the silhouette for every overlay that follows.
  c.save()
  if (kind === 'grip') fistPath(c)
  else relaxPath(c)
  c.clip()
  // Light from up-left (the sheet-wide light), soft radial bloom.
  const lg = c.createRadialGradient(0.5, -1.5, 0.2, 0.5, -1.5, 6.2)
  lg.addColorStop(0, colors.lightAlpha)
  lg.addColorStop(1, 'rgba(255,255,255,0)')
  c.fillStyle = lg
  c.fillRect(-4, -4, 10, 9)
  // Form shadow on the lower half, deepest at the rim.
  const sg = c.createLinearGradient(0, 0.3, 0, 3.2)
  sg.addColorStop(0, 'rgba(0,0,0,0)')
  sg.addColorStop(0.75, colors.formAlpha)
  sg.addColorStop(1, colors.deepAlpha)
  c.fillStyle = sg
  c.fillRect(-4, 0, 10, 4)
  // Finger separators: LONG tapered creases from the knuckle zone to
  // the finger edge (UIR-12: the old 1.15u soft runs read as a mitten at
  // 4x). Two passes each - a wide soft bed plus a narrow dark core, both
  // alpha-blended, never ink. They run along the finger direction (+x);
  // long 45° diagonals still avoided (they read as claw scars).
  const xs = kind === 'grip' ? 2.2 : 1.2
  const xe = kind === 'grip' ? 4.6 : 3.6
  for (const pass of [
    { w: 0.55, style: colors.creaseAlpha },
    { w: 0.34, style: colors.creaseCore },
    // Light companion edge on the upper side of each separator, so the
    // digits read rounded rather than striped (UIR-12 polish). Kept
    // below the form bloom (creaseLight, not lightAlpha) so the modal
    // skin tone stays inside the handparts match band.
    { w: 0.3, style: colors.creaseLight, dy: -0.42 },
  ]) {
    c.strokeStyle = pass.style
    c.lineWidth = pass.w
    c.lineCap = 'round'
    for (const y of [-1.15, 0.05, 1.15]) {
      c.beginPath()
      c.moveTo(xs, y - 0.1 + (pass.dy ?? 0))
      c.quadraticCurveTo((xs + xe) / 2, y + 0.08 + (pass.dy ?? 0), xe, y + 0.24 + (pass.dy ?? 0))
      c.stroke()
    }
  }
  // Knuckle ridge line across the fist's top third (the curled fingers'
  // tops) and the fingertip highlights on the open hand.
  if (kind === 'grip') {
    c.strokeStyle = colors.creaseAlpha
    c.lineWidth = 0.5
    c.beginPath()
    c.moveTo(2.1, -2.35)
    c.quadraticCurveTo(3.2, -1.85, 3.75, -1.05)
    c.stroke()
    c.fillStyle = colors.lightAlpha
    ellipse(c, 3.35, -1.75, 1.15, 0.6, -0.22)
    c.fill()
  } else {
    c.fillStyle = colors.lightAlpha
    ellipse(c, 4.45, -1.35, 0.95, 0.5, -0.28)
    c.fill()
    ellipse(c, 4.9, 0.35, 0.7, 0.4, -0.2)
    c.fill()
  }
  // Wrist fold.
  c.strokeStyle = colors.creaseAlpha
  c.lineWidth = 0.38
  c.beginPath()
  c.moveTo(-2.25, -1.55)
  c.quadraticCurveTo(-1.8, 0, -2.2, 1.6)
  c.stroke()
  c.restore()
}

function paintHandCell(c, kind, skin) {
  const far = kind.endsWith('F')
  const base = far ? shadeC(skin, 1 - FAR_SHADE) : `#${skin.toString(16).padStart(6, '0')}`
  const colors = {
    formAlpha: far ? 'rgba(0,0,0,0.34)' : 'rgba(0,0,0,0.30)',
    deepAlpha: far ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.46)',
    lightAlpha: far ? 'rgba(255,244,224,0.16)' : 'rgba(255,246,228,0.26)',
    creaseAlpha: far ? 'rgba(0,0,0,0.26)' : 'rgba(0,0,0,0.22)',
    creaseCore: far ? 'rgba(0,0,0,0.44)' : 'rgba(0,0,0,0.38)',
    creaseLight: far ? 'rgba(255,244,224,0.12)' : 'rgba(255,246,228,0.18)',
    thumbShade: far ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.33)',
  }
  // Work in logical units, origin at the hand joint (cell center = pivot).
  c.translate((HAND_CELL_W * DENSITY) / 2, (HAND_CELL_H * DENSITY) / 2)
  c.scale(DENSITY, DENSITY)
  if (kind === 'wrapF' || kind === 'wrapN') {
    // Fingertips crossing the haft (x along the haft): three tapering pads
    // wrapping over the top of the weapon. wrapF is the far hand (under
    // shading), wrapN the near hand (UIR-13: BOTH grips show fingers
    // crossing the haft, so it passes through the fist rather than lying
    // on top of it). Pads widened 0.72->0.82 and lengthened 3.1->3.5
    // (UIR-13) so the wrap reads at gameplay size.
    const padBase = kind === 'wrapF'
      ? shadeC(skin, 1 - FAR_SHADE)
      : `#${skin.toString(16).padStart(6, '0')}`
    for (const [i, cx] of [-1.55, 0.65, 2.85].entries()) {
      const len = 3.5 + (i === 1 ? 0.55 : 0.15)
      c.fillStyle = padBase
      c.beginPath()
      c.moveTo(cx - 0.82, 2.35)
      c.lineTo(cx - 0.68, -len + 0.5)
      c.quadraticCurveTo(cx - 0.55, -len - 0.15, cx, -len - 0.2)
      c.quadraticCurveTo(cx + 0.55, -len - 0.15, cx + 0.68, -len + 0.5)
      c.lineTo(cx + 0.82, 2.35)
      c.quadraticCurveTo(cx, 2.75, cx - 0.82, 2.35)
      c.closePath()
      c.fill()
      // Underside shadow on the near half, tip highlight at the far end.
      c.save()
      c.clip()
      const sg = c.createLinearGradient(cx, 0.4, cx, 2.5)
      sg.addColorStop(0, 'rgba(0,0,0,0)')
      sg.addColorStop(1, 'rgba(0,0,0,0.42)')
      c.fillStyle = sg
      c.fillRect(cx - 1, 0.3, 2, 2.5)
      c.fillStyle = 'rgba(255,246,228,0.2)'
      ellipse(c, cx, -len + 0.35, 0.42, 0.3, 0)
      c.fill()
      c.restore()
    }
    return
  }
  const isGrip = kind.startsWith('grip')
  // Silhouette, then the thumb (over the top edge), then shared form work.
  c.fillStyle = base
  if (isGrip) fistPath(c)
  else relaxPath(c)
  c.fill()
  c.fillStyle = base
  ellipse(c, isGrip ? 1.7 : 0.3, isGrip ? -2.75 : -2.5, isGrip ? 1.8 : 1.55, isGrip ? 1.0 : 0.95, -0.32)
  c.fill()
  // Thumb's underside crease so it reads as a separate digit: a soft
  // bed plus a darker core along a longer arc (UIR-12), then a light cap
  // on the thumb's top.
  c.save()
  ellipse(c, isGrip ? 1.7 : 0.3, isGrip ? -2.75 : -2.5, isGrip ? 1.8 : 1.55, isGrip ? 1.0 : 0.95, -0.32)
  c.clip()
  c.strokeStyle = colors.thumbShade
  c.lineWidth = 0.5
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(-1.1, 0.3)
  c.quadraticCurveTo(0, 0.8, 1.1, 0.45)
  c.stroke()
  c.strokeStyle = colors.creaseCore
  c.lineWidth = 0.3
  c.beginPath()
  c.moveTo(-0.7, 0.38)
  c.quadraticCurveTo(0, 0.72, 0.75, 0.5)
  c.stroke()
  c.fillStyle = colors.lightAlpha
  ellipse(c, isGrip ? 1.7 : 0.3, isGrip ? -3.15 : -2.9, isGrip ? 1.2 : 1.0, 0.42, -0.3)
  c.fill()
  c.restore()
  formShade(c, isGrip ? 'grip' : 'relax', colors)
  // Soft shadow-side rim only (no ink outline anywhere).
  c.save()
  if (isGrip) fistPath(c)
  else relaxPath(c)
  c.clip()
  c.strokeStyle = colors.deepAlpha
  c.lineWidth = 0.55
  c.beginPath()
  c.moveTo(-2.7, 2.2)
  c.bezierCurveTo(-0.5, 2.8, 1.5, 2.9, 3.4, 2.6)
  c.stroke()
  c.restore()
}

/** joints, widths (logical, bulk 1.0) and span fractions per hero. */
export const HEROES = {
  zhangfei: {
    master: 'art/fighter-bodies/zhangfei-body-master.jpg',
    skin: '#8a5a3c',
    joints: {
      chest: [416, 400], hip: [416, 686],
      shoulderF: [250, 300], elbowF: [143, 460], handF: [62, 598],
      shoulderN: [566, 300], elbowN: [668, 460], handN: [770, 598],
      hipF: [316, 686], kneeF: [316, 898], footF: [300, 1160],
      hipN: [499, 686], kneeN: [499, 898], footN: [524, 1160],
    },
  },
  guanyu: {
    master: 'art/fighter-bodies/guanyu-body-master.jpg',
    skin: '#a8442f',
    cape: { body: '#2a7a2a', trim: '#d8c060' },
    joints: {
      chest: [416, 374], hip: [416, 686],
      shoulderF: [266, 300], elbowF: [188, 392], handF: [70, 546],
      shoulderN: [566, 300], elbowN: [646, 394], handN: [762, 546],
      hipF: [349, 699], kneeF: [333, 898], footF: [316, 1173],
      hipN: [482, 699], kneeN: [499, 898], footN: [516, 1173],
    },
  },
  huangzhong: {
    master: 'art/fighter-bodies/huangzhong-body-master.jpg',
    skin: '#d9ad86',
    joints: {
      chest: [416, 374], hip: [416, 686],
      shoulderF: [283, 312], elbowF: [199, 407], handF: [85, 558],
      shoulderN: [549, 312], elbowN: [633, 407], handN: [747, 558],
      hipF: [349, 699], kneeF: [333, 898], footF: [316, 1173],
      hipN: [482, 699], kneeN: [499, 898], footN: [516, 1173],
    },
  },
  weiyan: {
    master: 'art/fighter-bodies/weiyan-body-master.jpg',
    skin: '#c79a63',
    joints: {
      chest: [816, 187], hip: [816, 343],
      shoulderF: [734, 169], elbowF: [683, 207], handF: [557, 238],
      shoulderN: [898, 169], elbowN: [949, 207], handN: [1075, 238],
      hipF: [767, 350], kneeF: [751, 449], footF: [734, 593],
      hipN: [865, 350], kneeN: [881, 449], footN: [898, 593],
    },
  },
  zhaoyun: {
    master: 'art/fighter-bodies/zhaoyun-body-master.jpg',
    skin: '#f4d0ac',
    cape: { body: '#2f5fb3', trim: '#c84a4a' },
    joints: {
      chest: [360, 384], hip: [360, 602],
      shoulderF: [238, 333], elbowF: [165, 458], handF: [55, 613],
      shoulderN: [482, 333], elbowN: [555, 458], handN: [665, 613],
      hipF: [310, 640], kneeF: [302, 870], footF: [295, 1190],
      hipN: [410, 640], kneeN: [418, 870], footN: [425, 1190],
    },
  },
  soldier: {
    master: 'art/fighter-bodies/soldier-body-master.jpg',
    out: 'src/game/assets/mook-bodies',
    skin: '#875640',
    joints: {
      chest: [416, 349], hip: [416, 649],
      shoulderF: [275, 300], elbowF: [187, 427], handF: [62, 592],
      shoulderN: [557, 300], elbowN: [645, 427], handN: [770, 592],
      hipF: [358, 661], kneeF: [349, 898], footF: [341, 1198],
      hipN: [474, 661], kneeN: [482, 898], footN: [491, 1198],
    },
  },
  spearman: {
    master: 'art/fighter-bodies/spearman-body-master.jpg',
    out: 'src/game/assets/mook-bodies',
    skin: '#936149',
    joints: {
      chest: [416, 349], hip: [416, 624],
      shoulderF: [275, 312], elbowF: [195, 426], handF: [72, 588],
      shoulderN: [557, 312], elbowN: [637, 426], handN: [760, 588],
      hipF: [358, 649], kneeF: [349, 898], footF: [341, 1198],
      hipN: [474, 649], kneeN: [482, 898], footN: [491, 1198],
    },
  },
  archer: {
    master: 'art/fighter-bodies/archer-body-master.jpg',
    out: 'src/game/assets/mook-bodies',
    skin: '#8f604a',
    joints: {
      chest: [416, 349], hip: [416, 649],
      shoulderF: [275, 300], elbowF: [190, 427], handF: [62, 600],
      shoulderN: [557, 300], elbowN: [642, 427], handN: [770, 600],
      hipF: [366, 661], kneeF: [358, 911], footF: [349, 1198],
      hipN: [466, 661], kneeN: [474, 911], footN: [482, 1198],
    },
  },
  // BODY-13 bosses: eyeballed like the heroes; skins match the boss-faces
  // packs so necks/heads agree.
  lubu: {
    master: 'art/fighter-bodies/lubu-body-master.jpg',
    out: 'src/game/assets/boss-bodies',
    skin: '#f0c8a0',
    cape: { body: '#a82222', trim: '#e8c828' },
    joints: {
      chest: [416, 430], hip: [416, 640],
      shoulderF: [300, 360], elbowF: [212, 470], handF: [45, 600],
      shoulderN: [532, 360], elbowN: [620, 470], handN: [790, 600],
      hipF: [350, 660], kneeF: [340, 900], footF: [320, 1160],
      hipN: [482, 660], kneeN: [492, 900], footN: [512, 1160],
    },
  },
  caocao: {
    master: 'art/fighter-bodies/caocao-body-master.jpg',
    out: 'src/game/assets/boss-bodies',
    skin: '#d8b48c',
    cape: { body: '#452073', trim: '#c8a828' },
    joints: {
      chest: [416, 420], hip: [416, 640],
      shoulderF: [290, 360], elbowF: [202, 448], handF: [62, 577],
      shoulderN: [545, 360], elbowN: [633, 448], handN: [772, 577],
      hipF: [350, 655], kneeF: [345, 890], footF: [330, 1145],
      hipN: [480, 655], kneeN: [485, 890], footN: [500, 1145],
    },
  },
  xiahoudun: {
    master: 'art/fighter-bodies/xiahoudun-body-master.jpg',
    out: 'src/game/assets/boss-bodies',
    skin: '#cfa87e',
    joints: {
      chest: [416, 400], hip: [416, 640],
      shoulderF: [290, 350], elbowF: [199, 444], handF: [65, 582],
      shoulderN: [545, 350], elbowN: [636, 444], handN: [770, 582],
      hipF: [350, 650], kneeF: [340, 880], footF: [320, 1140],
      hipN: [480, 650], kneeN: [490, 880], footN: [510, 1140],
    },
  },
  xuchu: {
    master: 'art/fighter-bodies/xuchu-body-master.jpg',
    out: 'src/game/assets/boss-bodies',
    skin: '#c08a68',
    joints: {
      chest: [416, 380], hip: [416, 640],
      shoulderF: [270, 330], elbowF: [182, 443], handF: [50, 608],
      shoulderN: [560, 330], elbowN: [648, 443], handN: [780, 608],
      hipF: [340, 655], kneeF: [330, 880], footF: [310, 1140],
      hipN: [490, 655], kneeN: [500, 880], footN: [520, 1140],
    },
  },
  zhangliao: {
    master: 'art/fighter-bodies/zhangliao-body-master.jpg',
    out: 'src/game/assets/boss-bodies',
    skin: '#e0bc94',
    cape: { body: '#1f4a33', trim: '#5aa87e' },
    joints: {
      chest: [416, 400], hip: [416, 645],
      shoulderF: [290, 355], elbowF: [202, 457], handF: [55, 600],
      shoulderN: [545, 355], elbowN: [633, 457], handN: [780, 600],
      hipF: [350, 660], kneeF: [340, 890], footF: [320, 1150],
      hipN: [480, 660], kneeN: [490, 890], footN: [510, 1150],
    },
  },
  caoren: {
    master: 'art/fighter-bodies/caoren-body-master.jpg',
    out: 'src/game/assets/boss-bodies',
    skin: '#d4ac84',
    joints: {
      chest: [416, 400], hip: [416, 630],
      shoulderF: [290, 350], elbowF: [202, 449], handF: [55, 592],
      shoulderN: [545, 350], elbowN: [633, 449], handN: [780, 592],
      hipF: [350, 645], kneeF: [340, 880], footF: [320, 1140],
      hipN: [480, 645], kneeN: [490, 880], footN: [510, 1140],
    },
  },
  xuhuang: {
    master: 'art/fighter-bodies/xuhuang-body-master.jpg',
    out: 'src/game/assets/boss-bodies',
    skin: '#d2a87c',
    joints: {
      chest: [416, 400], hip: [416, 640],
      shoulderF: [290, 350], elbowF: [202, 449], handF: [58, 592],
      shoulderN: [545, 350], elbowN: [633, 449], handN: [777, 592],
      hipF: [350, 655], kneeF: [340, 885], footF: [320, 1150],
      hipN: [480, 655], kneeN: [490, 885], footN: [510, 1150],
    },
  },
  zhanghe: {
    master: 'art/fighter-bodies/zhanghe-body-master.jpg',
    out: 'src/game/assets/boss-bodies',
    skin: '#e8c4a0',
    cape: { body: '#2d5a49', trim: '#6ec0a0' },
    joints: {
      chest: [416, 410], hip: [416, 650],
      shoulderF: [290, 360], elbowF: [205, 451], handF: [62, 582],
      shoulderN: [545, 360], elbowN: [630, 451], handN: [773, 582],
      hipF: [350, 665], kneeF: [340, 890], footF: [320, 1150],
      hipN: [480, 665], kneeN: [490, 890], footN: [510, 1150],
    },
  },
  lidian: {
    master: 'art/fighter-bodies/lidian-body-master.jpg',
    out: 'src/game/assets/boss-bodies',
    skin: '#e4c09a',
    joints: {
      chest: [416, 400], hip: [416, 640],
      shoulderF: [290, 350], elbowF: [202, 449], handF: [58, 588],
      shoulderN: [545, 350], elbowN: [633, 449], handN: [777, 588],
      hipF: [350, 650], kneeF: [340, 880], footF: [320, 1140],
      hipN: [480, 650], kneeN: [490, 880], footN: [510, 1140],
    },
  },
}

const PARTS = [
  { name: 'torso', from: 'chest', to: 'hip', wA: 23.5, wB: 15.5, pre: 0.25, post: 0.5 },
  { name: 'upperArmF', from: 'shoulderF', to: 'elbowF', wA: 9, wB: 7.2, pre: 0.3, post: 0.2 },
  { name: 'foreArmF', from: 'elbowF', to: 'handF', wA: 7.2, wB: 5.6, pre: 0.2, post: 0.5 },
  { name: 'thighF', from: 'hipF', to: 'kneeF', wA: 12.5, wB: 9.5, pre: 0.2, post: 0.2 },
  { name: 'shinF', from: 'kneeF', to: 'footF', wA: 9.5, wB: 7, pre: 0.2, post: 0.5 },
  { name: 'thighN', from: 'hipN', to: 'kneeN', wA: 13, wB: 10, pre: 0.2, post: 0.2 },
  { name: 'shinN', from: 'kneeN', to: 'footN', wA: 10, wB: 7.5, pre: 0.2, post: 0.5 },
  { name: 'upperArmN', from: 'shoulderN', to: 'elbowN', wA: 9.5, wB: 7.4, pre: 0.3, post: 0.2 },
  { name: 'foreArmN', from: 'elbowN', to: 'handN', wA: 7.4, wB: 5.6, pre: 0.2, post: 0.5 },
]

/**
 * BODY-23 (G5) painted cape. The procedural cape is a flat quad
 * (figureShapes' clothShade polygon); the painted cell keeps that
 * silhouette - parity and appendage unchanged - and paints actual cloth:
 * fold fans, a lit shoulder band, a trim hem and a dark rim so the
 * silhouette holds against bright skies. Pivot at the shoulderN end, +y
 * toward the hip (the painter rotates there), trail side at -x (behind
 * the figure). A lying figure mirrors the cell in the painter, so the
 * cape trails toward the feet there too.
 */
function paintClothCell(cape) {
  const W = 26 * DENSITY
  const H = 48 * DENSITY
  const cell = createCanvas(W, H)
  const c = cell.getContext('2d')
  c.translate(22 * DENSITY, 5.5 * DENSITY)
  c.scale(DENSITY, DENSITY)
  const shape = () => {
    c.beginPath()
    c.moveTo(-12, -4)
    c.lineTo(1, -4)
    c.quadraticCurveTo(-2, 22, -7, 41)
    c.quadraticCurveTo(-13, 39, -21, 33)
    c.quadraticCurveTo(-18, 14, -12, -4)
    c.closePath()
  }
  c.fillStyle = cape.body
  shape()
  c.fill()
  c.save()
  shape()
  c.clip()
  // Depth: darker toward the trail edge, lit at the shoulder; darker hem.
  const across = c.createLinearGradient(-21, 0, 1, 0)
  across.addColorStop(0, 'rgba(0,0,0,0.38)')
  across.addColorStop(0.45, 'rgba(0,0,0,0.08)')
  across.addColorStop(0.8, 'rgba(255,246,228,0.12)')
  across.addColorStop(1, 'rgba(255,246,228,0.22)')
  c.fillStyle = across
  c.fillRect(-24, -6, 30, 50)
  const down = c.createLinearGradient(0, -4, 0, 42)
  down.addColorStop(0, 'rgba(255,246,228,0.16)')
  down.addColorStop(0.4, 'rgba(255,246,228,0)')
  down.addColorStop(1, 'rgba(0,0,0,0.32)')
  c.fillStyle = down
  c.fillRect(-24, -6, 30, 50)
  // Fold fan from the shoulder toward the hem.
  c.strokeStyle = 'rgba(0,0,0,0.16)'
  c.lineWidth = 1.6
  c.lineCap = 'round'
  for (const [x0, x1] of [[-3, -9], [-8, -15], [-12.5, -19]]) {
    c.beginPath()
    c.moveTo(x0, -1)
    c.quadraticCurveTo((x0 + x1) / 2 + 1, 20, x1, 36)
    c.stroke()
  }
  // Trim hem band along the hem edge (clipped to half its width).
  c.strokeStyle = cape.trim
  c.lineWidth = 3.2
  c.beginPath()
  c.moveTo(-7, 41)
  c.quadraticCurveTo(-13, 39, -21, 33)
  c.stroke()
  c.restore()
  // Dark interior rim: the painted body colours read dark already, but
  // the lit side must still hold an edge (BODY-21's outline-gate lesson).
  c.save()
  shape()
  c.clip()
  c.strokeStyle = 'rgba(26,18,10,0.85)'
  c.lineWidth = 0.8
  shape()
  c.stroke()
  c.restore()
  return { cell, cw: W, ch: H }
}

function signature(im) {
  let hex = ''
  for (let by = 0; by < 32; by++) for (let bx = 0; bx < 48; bx++) {
    const sums = [0, 0, 0, 0]; let n = 0
    for (let y = Math.floor(by * im.height / 32); y < Math.floor((by + 1) * im.height / 32); y++) {
      for (let x = Math.floor(bx * im.width / 48); x < Math.floor((bx + 1) * im.width / 48); x++) {
        const k = (y * im.width + x) * 4, a = im.data[k + 3] / 255
        for (let j = 0; j < 3; j++) sums[j] += im.data[k + j] * a
        sums[3] += im.data[k + 3]; n++
      }
    }
    for (const sum of sums) hex += Math.round(sum / Math.max(1, n)).toString(16).padStart(2, '0')
  }
  return hex
}

/**
 * BODY-23 (G6) re-key: dark + achromatic = background; chromatic dark =
 * costume, never keyed. Transparent pixels not connected to the cell
 * border are then restored to the master's matte (interior fill).
 */
function keyCell(ctx, w, h, tol) {
  const im = ctx.getImageData(0, 0, w, h)
  const d = im.data
  const bg = new Uint8Array(w * h)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x
      const p = i * 4
      const r = d[p]
      const g = d[p + 1]
      const b = d[p + 2]
      const lum = (r + g + b) / 3
      const chroma = Math.max(r, g, b) - Math.min(r, g, b)
      if (lum <= tol && chroma <= KEY_CHROMA) {
        bg[i] = 1
        d[p + 3] = 0
      }
    }
  }
  // Interior fill: flood the border-connected background, then restore
  // every transparent pixel the flood could NOT reach - those are interior
  // holes and keep the master's matte instead of punching through.
  const seen = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x += 1) stack.push([x, 0], [x, h - 1])
  for (let y = 0; y < h; y += 1) stack.push([0, y], [w - 1, y])
  while (stack.length > 0) {
    const [x, y] = stack.pop()
    if (x < 0 || y < 0 || x >= w || y >= h) continue
    const i = y * w + x
    if (seen[i]) continue
    if (!bg[i]) continue
    seen[i] = 1
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  for (let i = 0; i < w * h; i += 1) {
    if (bg[i] && !seen[i]) d[i * 4 + 3] = 255
  }
  // Interior fill part two: every transparent pixel INSIDE a row's painted
  // span (opaque on both sides of its row) is a hole by the audit's own
  // definition - the moth-eaten look, whatever flood path reaches it. Such
  // pixels keep the master's matte. Gaps that open to a cell edge before
  // the first or after the last opaque pixel (true silhouette, and the
  // continuation of neighbouring cells' separations) stay transparent.
  for (let y = 0; y < h; y += 1) {
    let x = 0
    while (x < w) {
      if (!bg[y * w + x]) { x += 1; continue }
      const x0 = x
      while (x < w && bg[y * w + x]) x += 1
      const x1 = x - 1
      if (x0 > 0 && x1 < w - 1) {
        for (let k = x0; k <= x1; k += 1) d[(y * w + k) * 4 + 3] = 255
      }
    }
  }
  ctx.putImageData(im, 0, 0)
}

export async function prepareHero(id) {
  const spec = HEROES[id]
  if (!spec) throw new Error(`no joints for ${id}`)
  const img = await loadImage(spec.master)
  // Anatomical correction: eyeballed tables mark VISIBLE landmarks
  // (fingertips, boot soles), but rig joints sit at the palm center and
  // the ankle. Derive joints so boots/hands land on the skeleton.
  const J = Object.fromEntries(Object.entries(spec.joints).map(([k, v]) => [k, [...v]]))
  for (const side of ['F', 'N']) {
    const e = J[`elbow${side}`]
    const t = J[`hand${side}`]
    J[`hand${side}`] = [e[0] + (t[0] - e[0]) * PALM_FRACTION, e[1] + (t[1] - e[1]) * PALM_FRACTION]
    // BODY-23 (G8): the foot joint STAYS at the master's boot sole - the rig
    // foot joint is the sole line (drawBoot draws its sole at the joint =
    // GROUND). The old 8% raise mapped the ANKLE to the ground, so the boot
    // hung below the frame and the boot overlay covered the gap.
  }
  const joints = J
  // Logical scale: master px per logical unit from the torso span.
  const ch = joints.chest
  const hp = joints.hip
  const torsoPx = Math.hypot(hp[0] - ch[0], hp[1] - ch[1])
  const pxPerUnit = torsoPx / 22
  const cells = []
  const parts = {}
  let sheetW = 0
  let sheetH = 0
  for (const p of PARTS) {
    const a = joints[p.from]
    const b = joints[p.to]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const lenPx = Math.hypot(dx, dy)
    const ang = Math.atan2(dy, dx)
    const spanPx = (p.pre + 1 + p.post) * lenPx
    const halfPx = (Math.max(p.wA, p.wB) / 2 + 2) * pxPerUnit
    // Logical cell sized so content maps 1:1 at density (no distortion).
    const cw = Math.ceil(halfPx * 2 * (DENSITY / pxPerUnit))
    const chh = Math.ceil(spanPx * (DENSITY / pxPerUnit))
    const cell = createCanvas(cw, chh)
    const c = cell.getContext('2d')
    const s = (chh / spanPx)
    // No clip: joint-zone neighbor pixels are few, move little (rotation is
    // about the pivot), and hide under draw-order overlap. Keying removes
    // the background; the review composite + motion review catch the rest.
    c.translate(cw / 2, (p.pre / (p.pre + 1 + p.post)) * chh)
    c.rotate(Math.PI / 2 - ang)
    c.scale(s, s)
    c.translate(-a[0], -a[1])
    c.drawImage(img, 0, 0)
    keyCell(c, cw, chh, KEY_TOLERANCE)
    if (p.name === 'foreArmF' || p.name === 'foreArmN') {
      // BODY-19 wrist cut: erase everything past the wrist row. The cell
      // axis runs elbow (A) at pre/(pre+1+post) to palm (B) one span later,
      // and the wrist sits at WRIST_FRACTION of elbow->fingertip, i.e.
      // WRIST_FRACTION/PALM_FRACTION along A->B.
      const f = WRIST_FRACTION / PALM_FRACTION
      const wristRow = Math.round(((p.pre + f) / (p.pre + 1 + p.post)) * chh)
      const im = c.getImageData(0, 0, cw, chh)
      for (let y = wristRow; y < chh; y += 1) {
        for (let x = 0; x < cw; x += 1) im.data[(y * cw + x) * 4 + 3] = 0
      }
      c.putImageData(im, 0, 0)
    }
    if (p.name.endsWith('F')) {
      c.save()
      c.globalCompositeOperation = 'source-atop'
      c.fillStyle = `rgba(0,0,0,${1 - FAR_SHADE})`
      c.fillRect(0, 0, cw, chh)
      c.restore()
    }
    cells.push({
      name: p.name, cell, cw, ch: chh,
      px: Math.round(cw / 2),
      py: Math.round((p.pre / (p.pre + 1 + p.post)) * chh),
    })
    sheetW += cw
    sheetH = Math.max(sheetH, chh)
  }
  // BODY-20 painted hands: five generated cells appended to the row.
  const skinNum = parseInt(spec.skin.slice(1), 16)
  for (const kind of HAND_CELLS) {
    const cw = HAND_CELL_W * DENSITY
    const chh = HAND_CELL_H * DENSITY
    const cell = createCanvas(cw, chh)
    paintHandCell(cell.getContext('2d'), kind, skinNum)
    cells.push({ name: kind, cell, cw, ch: chh, px: (cw / 2), py: (chh / 2) })
    sheetW += cw
    sheetH = Math.max(sheetH, chh)
  }
  // BODY-23 painted cape (G5): a generated cloth cell for caped fighters.
  if (spec.cape) {
    const { cell, cw, ch } = paintClothCell(spec.cape)
    cells.push({ name: 'cloth', cell, cw, ch, px: 22 * DENSITY, py: 5.5 * DENSITY })
    sheetW += cw
    sheetH = Math.max(sheetH, ch)
  }
  const sheet = createCanvas(sheetW, sheetH)
  const sctx = sheet.getContext('2d')
  let ox = 0
  for (const { name, cell, cw, ch, px, py } of cells) {
    sctx.drawImage(cell, ox, 0)
    parts[name] = {
      x: ox, y: 0, w: cw, h: ch,
      pivotX: Math.round(px), pivotY: Math.round(py),
    }
    ox += cw
  }
  return { sheet, parts, width: sheetW, height: sheetH }
}

export async function main() {
  const byOut = new Map()
  for (const id of Object.keys(HEROES)) {
    const out = HEROES[id].out ?? 'src/game/assets/hero-bodies'
    if (!byOut.has(out)) byOut.set(out, [])
    byOut.get(out).push(id)
  }
  const preparedByOut = new Map()
  for (const [out, ids] of byOut) {
    mkdirSync(out, { recursive: true })
    const prepared = {}
    preparedByOut.set(out, prepared)
    for (const id of ids) {
      const { sheet, parts, width, height } = await prepareHero(id)
      const sctx = sheet.getContext('2d')
      const png = sheet.toBuffer('image/png')
      const im = sctx.getImageData(0, 0, width, height)
      writeFileSync(`${out}/${id}-sheet.png`, png)
      prepared[id] = {
        revision: 'body-6',
        skin: HEROES[id].skin,
        density: DENSITY,
        sheet: { width, height },
        parts,
        signatures: { sheet: signature(im) },
        sha256: { sheet: createHash('sha256').update(png).digest('hex') },
      }
      console.log(`${id}: sheet ${width}x${height}, ${png.length} bytes`)
    }
    writeFileSync(`${out}/prepared.json`, `${JSON.stringify(prepared, null, 2)}\n`)
  }
  // Review composite: every cell on checkers with its pivot marked.
  for (const id of Object.keys(HEROES)) {
    const out = HEROES[id].out ?? 'src/game/assets/hero-bodies'
    const img = await loadImage(`${out}/${id}-sheet.png`)
    const comp = createCanvas(img.width, img.height + 24)
    const g = comp.getContext('2d')
    for (let y = 0; y < img.height; y += 16) {
      for (let x = 0; x < img.width; x += 16) {
        g.fillStyle = ((x + y) / 16) % 2 === 0 ? '#ff00ff' : '#ffffff'
        g.fillRect(x, y, 16, 16)
      }
    }
    g.drawImage(img, 0, 0)
    g.fillStyle = '#00ff00'
    g.font = '13px sans-serif'
    for (const [name, c] of Object.entries(preparedByOut.get(out)[id].parts)) {
      g.fillRect(c.x + c.pivotX - 1, c.y + c.pivotY - 1, 3, 3)
      g.fillStyle = '#000000'
      g.fillText(name, c.x + 3, img.height + 18)
      g.fillStyle = '#00ff00'
    }
    writeFileSync(`artifacts/body-cells-${id}.png`, comp.toBuffer('image/png'))
    console.log(`review: artifacts/body-cells-${id}.png`)
  }
}

if (process.argv[1]?.endsWith('prepare-body-parts.mjs')) await main()
