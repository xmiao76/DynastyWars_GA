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
export const FAR_SHADE = 0.82

/** joints, widths (logical, bulk 1.0) and span fractions per hero. */
export const HEROES = {
  zhangfei: {
    master: 'art/fighter-bodies/zhangfei-body-master.jpg',
    skin: '#8a5a3c',
    joints: {
      chest: [416, 400], hip: [416, 686],
      shoulderF: [250, 300], elbowF: [141, 462], handF: [67, 586],
      shoulderN: [566, 300], elbowN: [666, 462], handN: [749, 586],
      hipF: [316, 686], kneeF: [316, 898], footF: [300, 1160],
      hipN: [499, 686], kneeN: [499, 898], footN: [524, 1160],
    },
  },
  guanyu: {
    master: 'art/fighter-bodies/guanyu-body-master.jpg',
    skin: '#a8442f',
    joints: {
      chest: [416, 374], hip: [416, 686],
      shoulderF: [266, 300], elbowF: [150, 437], handF: [67, 537],
      shoulderN: [566, 300], elbowN: [682, 437], handN: [765, 537],
      hipF: [349, 699], kneeF: [333, 898], footF: [316, 1173],
      hipN: [482, 699], kneeN: [499, 898], footN: [516, 1173],
    },
  },
  huangzhong: {
    master: 'art/fighter-bodies/huangzhong-body-master.jpg',
    skin: '#d9ad86',
    joints: {
      chest: [416, 374], hip: [416, 686],
      shoulderF: [283, 312], elbowF: [166, 437], handF: [92, 549],
      shoulderN: [549, 312], elbowN: [666, 437], handN: [740, 549],
      hipF: [349, 699], kneeF: [333, 898], footF: [316, 1173],
      hipN: [482, 699], kneeN: [499, 898], footN: [516, 1173],
    },
  },
  weiyan: {
    master: 'art/fighter-bodies/weiyan-body-master.jpg',
    skin: '#c79a63',
    joints: {
      chest: [816, 187], hip: [816, 343],
      shoulderF: [734, 169], elbowF: [637, 225], handF: [555, 256],
      shoulderN: [898, 169], elbowN: [996, 225], handN: [1077, 256],
      hipF: [767, 350], kneeF: [751, 449], footF: [734, 593],
      hipN: [865, 350], kneeN: [881, 449], footN: [898, 593],
    },
  },
  zhaoyun: {
    master: 'art/fighter-bodies/zhaoyun-body-master.jpg',
    skin: '#f4d0ac',
    joints: {
      chest: [360, 384], hip: [360, 602],
      shoulderF: [238, 333], elbowF: [130, 474], handF: [50, 602],
      shoulderN: [482, 333], elbowN: [590, 474], handN: [670, 602],
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
      shoulderF: [275, 300], elbowF: [158, 449], handF: [67, 574],
      shoulderN: [557, 300], elbowN: [674, 449], handN: [765, 574],
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
      shoulderF: [275, 312], elbowF: [166, 449], handF: [75, 574],
      shoulderN: [557, 312], elbowN: [666, 449], handN: [757, 574],
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
      shoulderF: [275, 300], elbowF: [158, 449], handF: [67, 586],
      shoulderN: [557, 300], elbowN: [674, 449], handN: [765, 586],
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
    joints: {
      chest: [416, 430], hip: [416, 640],
      shoulderF: [300, 360], elbowF: [180, 470], handF: [80, 570],
      shoulderN: [532, 360], elbowN: [652, 470], handN: [752, 570],
      hipF: [350, 660], kneeF: [340, 900], footF: [320, 1160],
      hipN: [482, 660], kneeN: [492, 900], footN: [512, 1160],
    },
  },
  caocao: {
    master: 'art/fighter-bodies/caocao-body-master.jpg',
    out: 'src/game/assets/boss-bodies',
    skin: '#d8b48c',
    joints: {
      chest: [416, 420], hip: [416, 640],
      shoulderF: [290, 360], elbowF: [170, 470], handF: [75, 570],
      shoulderN: [545, 360], elbowN: [665, 470], handN: [755, 570],
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
      shoulderF: [290, 350], elbowF: [175, 460], handF: [75, 560],
      shoulderN: [545, 350], elbowN: [660, 460], handN: [755, 560],
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
      shoulderF: [270, 330], elbowF: [165, 450], handF: [70, 555],
      shoulderN: [560, 330], elbowN: [665, 450], handN: [760, 555],
      hipF: [340, 655], kneeF: [330, 880], footF: [310, 1140],
      hipN: [490, 655], kneeN: [500, 880], footN: [520, 1140],
    },
  },
  zhangliao: {
    master: 'art/fighter-bodies/zhangliao-body-master.jpg',
    out: 'src/game/assets/boss-bodies',
    skin: '#e0bc94',
    joints: {
      chest: [416, 400], hip: [416, 645],
      shoulderF: [290, 355], elbowF: [175, 465], handF: [75, 565],
      shoulderN: [545, 355], elbowN: [655, 465], handN: [755, 565],
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
      shoulderF: [290, 350], elbowF: [175, 460], handF: [75, 560],
      shoulderN: [545, 350], elbowN: [655, 460], handN: [755, 560],
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
      shoulderF: [290, 350], elbowF: [175, 460], handF: [75, 560],
      shoulderN: [545, 350], elbowN: [655, 460], handN: [755, 560],
      hipF: [350, 655], kneeF: [340, 885], footF: [320, 1150],
      hipN: [480, 655], kneeN: [490, 885], footN: [510, 1150],
    },
  },
  zhanghe: {
    master: 'art/fighter-bodies/zhanghe-body-master.jpg',
    out: 'src/game/assets/boss-bodies',
    skin: '#e8c4a0',
    joints: {
      chest: [416, 410], hip: [416, 650],
      shoulderF: [290, 360], elbowF: [175, 470], handF: [75, 570],
      shoulderN: [545, 360], elbowN: [655, 470], handN: [755, 570],
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
      shoulderF: [290, 350], elbowF: [175, 460], handF: [75, 560],
      shoulderN: [545, 350], elbowN: [655, 460], handN: [755, 560],
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

function floodKey(ctx, w, h, tol) {
  const im = ctx.getImageData(0, 0, w, h)
  const d = im.data
  const lum = (x, y) => {
    const p = (y * w + x) * 4
    return (d[p] + d[p + 1] + d[p + 2]) / 3
  }
  // Seed EVERY dark border pixel, not just the corners: figure content may
  // touch an edge (torso shoulders span nearly the full cell width), and
  // corner-only seeding then strands whole background regions unkeyed.
  const seen = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x += 1) {
    stack.push([x, 0], [x, h - 1])
  }
  for (let y = 0; y < h; y += 1) {
    stack.push([0, y], [w - 1, y])
  }
  while (stack.length > 0) {
    const [x, y] = stack.pop()
    if (x < 0 || y < 0 || x >= w || y >= h) continue
    const i = y * w + x
    if (seen[i]) continue
    if (lum(x, y) > tol) continue
    seen[i] = 1
    d[i * 4 + 3] = 0
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
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
    J[`hand${side}`] = [e[0] + (t[0] - e[0]) * 0.75, e[1] + (t[1] - e[1]) * 0.75]
    J[`foot${side}`][1] -= img.height * 0.08
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
    floodKey(c, cw, chh, KEY_TOLERANCE)
    if (p.name.endsWith('F')) {
      c.save()
      c.globalCompositeOperation = 'source-atop'
      c.fillStyle = `rgba(0,0,0,${1 - FAR_SHADE})`
      c.fillRect(0, 0, cw, chh)
      c.restore()
    }
    cells.push({ name: p.name, cell, cw, ch: chh })
    sheetW += cw
    sheetH = Math.max(sheetH, chh)
  }
  const sheet = createCanvas(sheetW, sheetH)
  const sctx = sheet.getContext('2d')
  let ox = 0
  for (const { name, cell, cw, ch } of cells) {
    sctx.drawImage(cell, ox, 0)
    const p = PARTS.find((q) => q.name === name)
    parts[name] = {
      x: ox, y: 0, w: cw, h: ch,
      pivotX: Math.round(cw / 2),
      pivotY: Math.round((p.pre / (p.pre + 1 + p.post)) * ch),
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
        revision: 'body-1',
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
