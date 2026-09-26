import { writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas } from '@napi-rs/canvas'

/**
 * BODY-21 painted weapons: one shared sheet of raster weapon cells drawn
 * over the EXACT procedural geometry (same length, grip math and rotation,
 * so sim reach and the ART-14/15 gates stay byte-stable), with painted
 * wood/steel/brass/cloth instead of flat cel fills + ink outlines (the
 * round-3 "clip-art" complaint: flat brown haft bars, red paper-block
 * tassels, grey-pill butts, bright-yellow ferrule bands).
 *
 * Layout: each hafted weapon is painted in ABSOLUTE weapon coords (butt at
 * x=0, socket at x=L) because the grip point moves per pose (0.28-0.5);
 * the draw-time painter offsets by -L*grip. The bow is symmetric about
 * the grip, so it is painted at reference half-length H0=26 and scaled
 * in x by fore/H0 at draw time (exactly what traceBow(fore) does
 * procedurally). The tassel hangs in the GRAVITY frame (figure +y,
 * unrotated), so it is its own cell, placed at the socket unrotated.
 *
 * Blade silhouettes duplicate the traceBlade/traceBow/jian/ji coordinates
 * in src/game/art/weapons.ts (a plain-node script cannot import TS). A
 * silhouette-conformance test (weaponparts.test.ts) rasterizes the TRUE
 * procedural paths and demands IoU>0.82 against every cell, so a changed
 * trace fails loudly instead of drifting apart from its paint.
 */
export const DENSITY = 4
/** Reference half-length the bow cell is painted at (draw scales x by fore/H0). */
export const BOW_REF_HALF = 26

/** Shared weapon lengths (must match WEAPONS in figures.ts - asserted by test). */
export const WEAPON_SPECS = {
  glaive: { length: 76, haft: 5.2, head: 'crescent', tassel: true },
  pike: { length: 82, haft: 5.0, head: 'serpent', tassel: true },
  spear: { length: 72, haft: 4.6, head: 'leaf', tassel: true },
  sword: { length: 46, haft: 4.8, head: 'jian', tassel: false },
  dao: { length: 69, haft: 5.2, head: 'dao', tassel: true },
  ji: { length: 78, haft: 5.0, head: 'ji', tassel: true },
  bow: { length: 42, haft: 4.0, head: 'bow', tassel: false },
}

/** Cell bounds in absolute weapon coords: [x0, y0, x1, y1], butt at (0,0). */
export const WEAPON_BOUNDS = {
  glaive: [-2, -11, 102, 8],
  pike: [-2, -7.5, 108, 7.5],
  spear: [-2, -5, 98, 5],
  sword: [-2, -7.5, 76, 7.5],
  dao: [-2, -8.5, 96, 9],
  ji: [-2, -13, 97, 13],
  bow: [-28, -12, 28, 8],
  tassel: [-5.5, 0, 5.5, 12],
}

const WOOD = { base: '#8a5f36', dark: '#5a3a20', light: '#c49a62' }
const STEEL = { base: '#aeb9c4', dark: '#55606e', deep: '#333c48', edge: '#eef4fa' }
const BRASS = { base: '#b08a3e', dark: '#6a5222', light: '#eed48a' }
const CLOTH = { base: '#a83c32', dark: '#6e231c', light: '#d4695e' }

function ell(c, cx, cy, rx, ry, rot = 0) {
  c.beginPath()
  c.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2)
  c.closePath()
}

/** Dark interior rim: keeps bright-steel silhouette edges readable against
 * bright skies (the sprite gate's outlineRatio) without an ink outline.
 * Clipped to the silhouette, so geometry/conformance are untouched. */
function rim(c, pathFn, color, width) {
  c.save()
  pathFn()
  c.clip()
  c.strokeStyle = color
  c.lineWidth = width
  pathFn()
  c.stroke()
  c.restore()
}

/** Blade silhouettes, socket at S (absolute), copied from traceBlade. */
function bladePath(c, head, S) {
  c.beginPath()
  switch (head) {
    case 'crescent':
      c.moveTo(S - 9, -1.8)
      c.lineTo(S - 5, -2)
      c.lineTo(S - 7, -5.8)
      c.lineTo(S - 2, -3.2)
      c.quadraticCurveTo(S + 12, -2, S + 22, -9)
      c.quadraticCurveTo(S + 18, 1, S + 8, 5)
      c.quadraticCurveTo(S - 1, 6, S - 9, 1.8)
      break
    case 'serpent': {
      // Ribbon around the S centerline; thickness must stay thin or the
      // waves vanish (see traceBlade's comment).
      c.moveTo(S - 7, -1.4)
      c.bezierCurveTo(S - 2, -1.4, S - 2, -5.5, S + 3, -5.5)
      c.bezierCurveTo(S + 8, -5.5, S + 8, 2.5, S + 12, 2.5)
      c.bezierCurveTo(S + 17, 2.5, S + 17, -2, S + 22, 0)
      c.bezierCurveTo(S + 17, 1, S + 17, 5.5, S + 12, 5.5)
      c.bezierCurveTo(S + 8, 5.5, S + 8, -2.5, S + 3, -2.5)
      c.bezierCurveTo(S - 2, -2.5, S - 2, 1.4, S - 7, 1.4)
      break
    }
    case 'leaf':
      c.moveTo(S - 5, 0)
      c.lineTo(S, -2.2)
      c.quadraticCurveTo(S + 8, -3, S + 22, 0)
      c.quadraticCurveTo(S + 8, 3, S, 2.2)
      break
    case 'dao':
      c.moveTo(S - 9, -2.4)
      c.lineTo(S + 16, -3.3)
      c.lineTo(S + 23, -6.3)
      c.lineTo(S + 20, 2.4)
      c.quadraticCurveTo(S + 7, 7, S - 9, 2.4)
      break
  }
  c.closePath()
}

/** Bow outline at reference half-length, riser at (0,0); from traceBow. */
function bowPath(c, h) {
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

/** Wooden haft 0..L with grain; light from the -y side (soft rim on +y). */
function paintHaft(c, L, haft) {
  const w = haft / 2
  const path = () => {
    c.beginPath()
    c.moveTo(0, -w)
    c.lineTo(L, -w)
    c.quadraticCurveTo(L + w * 0.4, 0, L, w)
    c.lineTo(0, w)
    c.quadraticCurveTo(-w * 0.4, 0, 0, -w)
    c.closePath()
  }
  c.fillStyle = WOOD.base
  path()
  c.fill()
  c.save()
  c.clip()
  // Lengthwise light falloff + edge shading (top lit, bottom rim dark).
  const across = c.createLinearGradient(0, -w, 0, w)
  across.addColorStop(0, 'rgba(255,230,190,0.34)')
  across.addColorStop(0.45, 'rgba(255,230,190,0.05)')
  across.addColorStop(0.8, 'rgba(20,10,4,0.28)')
  across.addColorStop(1, 'rgba(20,10,4,0.5)')
  c.fillStyle = across
  c.fillRect(0, -w, L, w * 2)
  // Grain: long slightly wavy darker strokes, sparse enough to read as
  // wood rather than stripes.
  c.strokeStyle = 'rgba(70,44,22,0.4)'
  c.lineWidth = 0.5
  c.lineCap = 'round'
  const rows = [-0.55, 0.05, 0.6]
  for (const [i, f] of rows.entries()) {
    c.beginPath()
    c.moveTo(2, f * w)
    for (let x = 2; x < L - 2; x += 9) {
      c.quadraticCurveTo(x + 4.5, f * w + (i % 2 === 0 ? 0.45 : -0.45), x + 9, f * w)
    }
    c.stroke()
  }
  // Two ring bands near the socket end (wrapped cord under the ferrule).
  c.strokeStyle = 'rgba(46,28,14,0.55)'
  c.lineWidth = 0.9
  for (const bx of [L - 16.5, L - 14.5]) {
    c.beginPath()
    c.moveTo(bx, -w * 0.92)
    c.lineTo(bx, w * 0.92)
    c.stroke()
  }
  c.restore()
  // Dark the lit top edge so the long haft silhouette holds.
  rim(c, path, 'rgba(50,30,14,0.85)', 0.8)
}

/** Brass fitting: pommel cap or ferrule ring. `round` gives true arc
 * caps (the pommel's butt cap matches the procedural limbPath round cap
 * exactly: extreme at x0-halfW). */
function paintBrass(c, x0, x1, halfW, round = false) {
  c.fillStyle = BRASS.base
  const path = () => {
    c.beginPath()
    if (round) {
      c.moveTo(x0, -halfW)
      c.lineTo(x1, -halfW)
      c.arc(x1, 0, halfW, -Math.PI / 2, Math.PI / 2)
      c.lineTo(x0, halfW)
      c.arc(x0, 0, halfW, Math.PI / 2, Math.PI * 1.5)
    } else {
      c.moveTo(x0, -halfW)
      c.lineTo(x1, -halfW)
      c.quadraticCurveTo(x1 + halfW * 0.5, 0, x1, halfW)
      c.lineTo(x0, halfW)
      c.quadraticCurveTo(x0 - halfW * 0.5, 0, x0, -halfW)
    }
    c.closePath()
  }
  path()
  c.fill()
  c.save()
  path()
  c.clip()
  const g = c.createLinearGradient(0, -halfW, 0, halfW)
  g.addColorStop(0, 'rgba(255,244,210,0.5)')
  g.addColorStop(0.5, 'rgba(255,244,210,0.08)')
  g.addColorStop(1, 'rgba(40,26,8,0.5)')
  c.fillStyle = g
  c.fillRect(x0 - 1, -halfW, x1 - x0 + 2, halfW * 2)
  c.restore()
  rim(c, path, 'rgba(60,40,14,0.9)', 0.7)
}

/** Steel blade per head kind: base + spine/edge facets + a light sweep. */
function paintBlade(c, head, S) {
  const shade = (stops) => {
    const g = c.createLinearGradient(0, -9, 0, 8)
    for (const [o, col] of stops) g.addColorStop(o, col)
    c.fillStyle = g
    // Fill a generous box; the caller clips to the silhouette.
    c.fillRect(S - 12, -12, 42, 24)
  }
  c.fillStyle = STEEL.base
  if (head === 'crescent') {
    bladePath(c, 'crescent', S)
    c.fill()
    c.save()
    bladePath(c, 'crescent', S)
    c.clip()
    // Dark spine up top, bright cutting belly below (mirrors the facet/
    // edge split of the procedural blade).
    shade([[0, 'rgba(40,48,58,0.55)'], [0.45, 'rgba(40,48,58,0.05)'], [0.75, 'rgba(238,244,250,0.35)'], [1, 'rgba(238,244,250,0.1)']])
    // Bright belly edge following the curve.
    c.strokeStyle = 'rgba(238,244,250,0.85)'
    c.lineWidth = 1.1
    c.beginPath()
    c.moveTo(S - 4, 2.6)
    c.quadraticCurveTo(S + 8, 5.6, S + 20, -6.4)
    c.stroke()
    c.restore()
    rim(c, () => bladePath(c, 'crescent', S), 'rgba(52,60,72,0.92)', 0.9)
  } else if (head === 'serpent') {
    bladePath(c, 'serpent', S)
    c.fill()
    c.save()
    bladePath(c, 'serpent', S)
    c.clip()
    shade([[0, 'rgba(238,244,250,0.4)'], [0.5, 'rgba(40,48,58,0)'], [1, 'rgba(40,48,58,0.5)']])
    // Bright thread along the S crest.
    c.strokeStyle = 'rgba(238,244,250,0.7)'
    c.lineWidth = 0.9
    c.beginPath()
    c.moveTo(S - 6, -0.6)
    c.bezierCurveTo(S - 1, -0.6, S - 1, -4.2, S + 4, -4.2)
    c.bezierCurveTo(S + 9, -4.2, S + 9, 3.4, S + 13, 3.4)
    c.bezierCurveTo(S + 17, 3.4, S + 17, -1.0, S + 21, -0.2)
    c.stroke()
    c.restore()
    rim(c, () => bladePath(c, 'serpent', S), 'rgba(52,60,72,0.92)', 0.8)
  } else if (head === 'leaf') {
    bladePath(c, 'leaf', S)
    c.fill()
    c.save()
    bladePath(c, 'leaf', S)
    c.clip()
    shade([[0, 'rgba(238,244,250,0.45)'], [0.5, 'rgba(40,48,58,0)'], [1, 'rgba(40,48,58,0.55)']])
    // Center ridge: dark line with a bright line just above it.
    c.strokeStyle = 'rgba(40,48,58,0.5)'
    c.lineWidth = 0.6
    c.beginPath()
    c.moveTo(S - 3, 0.35)
    c.lineTo(S + 20, 0.1)
    c.stroke()
    c.strokeStyle = 'rgba(238,244,250,0.6)'
    c.lineWidth = 0.6
    c.beginPath()
    c.moveTo(S - 3, -0.9)
    c.quadraticCurveTo(S + 8, -1.6, S + 19, -0.4)
    c.stroke()
    c.restore()
    rim(c, () => bladePath(c, 'leaf', S), 'rgba(52,60,72,0.92)', 0.8)
  } else if (head === 'dao') {
    bladePath(c, 'dao', S)
    c.fill()
    c.save()
    bladePath(c, 'dao', S)
    c.clip()
    // Dark straight spine on top, bright cutting belly below.
    shade([[0, 'rgba(40,48,58,0.6)'], [0.4, 'rgba(40,48,58,0.05)'], [0.7, 'rgba(238,244,250,0.3)'], [1, 'rgba(238,244,250,0.08)']])
    c.strokeStyle = 'rgba(238,244,250,0.8)'
    c.lineWidth = 1.1
    c.beginPath()
    c.moveTo(S - 5, 1.9)
    c.quadraticCurveTo(S + 8, 6.0, S + 19, 1.4)
    c.stroke()
    c.restore()
    rim(c, () => bladePath(c, 'dao', S), 'rgba(52,60,72,0.92)', 0.9)
  } else if (head === 'jian') {
    // Straight double-edged blade: symmetric bevels, dark fuller center.
    const blade = () => {
      c.beginPath()
      c.moveTo(S - 5, -4.4)
      c.lineTo(S + 21, -2.6)
      c.lineTo(S + 26, 0)
      c.lineTo(S + 21, 2.6)
      c.lineTo(S - 5, 4.4)
      c.closePath()
    }
    blade()
    c.fill()
    c.save()
    c.clip()
    const g = c.createLinearGradient(0, -4.4, 0, 4.4)
    g.addColorStop(0, 'rgba(238,244,250,0.4)')
    g.addColorStop(0.32, 'rgba(40,48,58,0.05)')
    g.addColorStop(0.5, 'rgba(40,48,58,0.55)')
    g.addColorStop(0.68, 'rgba(40,48,58,0.05)')
    g.addColorStop(1, 'rgba(238,244,250,0.4)')
    c.fillStyle = g
    c.fillRect(S - 6, -5, 34, 10)
    // Bright tip.
    c.fillStyle = 'rgba(238,244,250,0.55)'
    c.beginPath()
    c.moveTo(S + 18, -1.8)
    c.lineTo(S + 25.4, 0)
    c.lineTo(S + 18, 1.8)
    c.closePath()
    c.fill()
    c.restore()
    rim(c, blade, 'rgba(52,60,72,0.92)', 0.8)
    // Brass disc guard (Chinese, not a crossguard).
    c.fillStyle = BRASS.base
    ell(c, S - 4.5, 0, 2.6, 5.2)
    c.fill()
    c.save()
    ell(c, S - 4.5, 0, 2.6, 5.2)
    c.clip()
    const gg = c.createLinearGradient(0, -5.2, 0, 5.2)
    gg.addColorStop(0, 'rgba(255,244,210,0.5)')
    gg.addColorStop(1, 'rgba(40,26,8,0.5)')
    c.fillStyle = gg
    c.fillRect(S - 8, -6, 8, 12)
    c.restore()
    rim(c, () => ell(c, S - 4.5, 0, 2.6, 5.2), 'rgba(60,40,14,0.9)', 0.7)
  } else if (head === 'ji') {
    // Central spearhead: oval with a ridge highlight, dark flanks.
    c.fillStyle = STEEL.base
    ell(c, S + 4, 0, 11, 4.4)
    c.fill()
    c.save()
    ell(c, S + 4, 0, 11, 4.4)
    c.clip()
    const g = c.createLinearGradient(0, -4.4, 0, 4.4)
    g.addColorStop(0, 'rgba(40,48,58,0.5)')
    g.addColorStop(0.42, 'rgba(40,48,58,0)')
    g.addColorStop(0.5, 'rgba(238,244,250,0.55)')
    g.addColorStop(0.58, 'rgba(40,48,58,0)')
    g.addColorStop(1, 'rgba(40,48,58,0.5)')
    c.fillStyle = g
    c.fillRect(S - 8, -5, 24, 10)
    c.restore()
    rim(c, () => ell(c, S + 4, 0, 11, 4.4), 'rgba(52,60,72,0.92)', 0.8)
    // Twin forward crescents with bright leading edges.
    for (const s of [1, -1]) {
      const wing = () => {
        c.beginPath()
        c.moveTo(S - 4, -3 * s)
        c.quadraticCurveTo(S + 2, -11 * s, S + 6, -10 * s)
        c.quadraticCurveTo(S + 4, -5 * s, S + 8, -2 * s)
        c.quadraticCurveTo(S + 3, 0, S - 4, 3 * s)
        c.closePath()
      }
      c.fillStyle = STEEL.base
      wing()
      c.fill()
      c.save()
      wing()
      c.clip()
      const wg = c.createLinearGradient(0, -11 * s, 0, 0)
      wg.addColorStop(0, 'rgba(238,244,250,0.5)')
      wg.addColorStop(1, 'rgba(40,48,58,0.45)')
      c.fillStyle = wg
      c.fillRect(S - 5, -12, 15, 13)
      c.restore()
      rim(c, wing, 'rgba(52,60,72,0.92)', 0.8)
    }
  }
}

/** Tassel tuft in gravity frame: tie at (0,0), hanging +y. */
function paintTassel(c) {
  // Knot at the tie.
  c.fillStyle = BRASS.dark
  ell(c, 0, 1.6, 1.7, 1.3)
  c.fill()
  // Fanning strands: base mass, then fold strokes, then lit strands.
  c.fillStyle = CLOTH.base
  c.beginPath()
  c.moveTo(-2.6, 2.4)
  c.quadraticCurveTo(-3.6, 6, -2.6, 9.6)
  c.quadraticCurveTo(-1.4, 9.9, -0.6, 8.8)
  c.quadraticCurveTo(0.2, 10.1, 1.4, 9.6)
  c.quadraticCurveTo(2.8, 9.2, 3.0, 6.4)
  c.quadraticCurveTo(3.1, 4.2, 2.6, 2.3)
  c.quadraticCurveTo(0, 1.6, -2.6, 2.4)
  c.closePath()
  c.fill()
  c.save()
  c.clip()
  // Fold shadows fanning from the knot.
  c.strokeStyle = 'rgba(70,20,16,0.5)'
  c.lineWidth = 0.8
  c.lineCap = 'round'
  for (const [x0, x1] of [[-1.6, -2.2], [-0.4, -0.7], [0.8, 0.9], [1.9, 2.4]]) {
    c.beginPath()
    c.moveTo(x0, 2.8)
    c.quadraticCurveTo((x0 + x1) / 2, 6, x1, 9.2)
    c.stroke()
  }
  // Lit strands between the folds.
  c.strokeStyle = 'rgba(224,120,110,0.55)'
  c.lineWidth = 0.7
  for (const [x0, x1] of [[-1.0, -1.4], [0.2, 0.1], [1.4, 1.7]]) {
    c.beginPath()
    c.moveTo(x0, 2.8)
    c.quadraticCurveTo((x0 + x1) / 2, 6, x1, 9.0)
    c.stroke()
  }
  // Soft bottom shade so the tuft ends in volume, not a cut.
  const g = c.createLinearGradient(0, 6, 0, 10)
  g.addColorStop(0, 'rgba(40,10,8,0)')
  g.addColorStop(1, 'rgba(40,10,8,0.45)')
  c.fillStyle = g
  c.fillRect(-4, 6, 8, 4.5)
  c.restore()
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

/** Paint one weapon cell; returns the canvas. Frame: absolute weapon coords. */
export function paintWeaponCell(kind) {
  const spec = WEAPON_SPECS[kind]
  if (!spec) throw new Error(`no spec for ${kind}`)
  const [x0, y0, x1, y1] = WEAPON_BOUNDS[kind]
  const cw = Math.round((x1 - x0) * DENSITY)
  const chh = Math.round((y1 - y0) * DENSITY)
  const cell = createCanvas(cw, chh)
  const c = cell.getContext('2d')
  c.translate(-x0 * DENSITY, -y0 * DENSITY)
  c.scale(DENSITY, DENSITY)
  if (spec.head === 'bow') {
    // Bow at reference half-length, riser at (0,0).
    const h = BOW_REF_HALF
    c.fillStyle = WOOD.base
    bowPath(c, h)
    c.fill()
    c.save()
    bowPath(c, h)
    c.clip()
    const g = c.createLinearGradient(0, -10, 0, 4)
    g.addColorStop(0, 'rgba(255,230,190,0.4)')
    g.addColorStop(0.5, 'rgba(70,44,22,0.1)')
    g.addColorStop(1, 'rgba(24,14,8,0.45)')
    c.fillStyle = g
    c.fillRect(-h - 1, -11, h * 2 + 2, 16)
    // Limb grain along the curve + wrapped riser.
    c.strokeStyle = 'rgba(70,44,22,0.45)'
    c.lineWidth = 0.6
    c.beginPath()
    c.moveTo(-h + 2, -8.6)
    c.quadraticCurveTo(-h * 0.5, -3, -4, 0.2)
    c.quadraticCurveTo(h * 0.5, -3, h - 2, -8.6)
    c.stroke()
    // Wrapped riser: matches the procedural limbPath capsule (-3..3 @ 3.2).
    c.fillStyle = '#4a3524'
    c.beginPath()
    c.moveTo(-3, -1.6)
    c.lineTo(3, -1.6)
    c.arc(3, 0, 1.6, -Math.PI / 2, Math.PI / 2)
    c.lineTo(-3, 1.6)
    c.arc(-3, 0, 1.6, Math.PI / 2, Math.PI * 1.5)
    c.closePath()
    c.fill()
    c.strokeStyle = 'rgba(20,12,6,0.5)'
    c.lineWidth = 0.5
    c.beginPath()
    c.moveTo(-3, -0.6)
    c.lineTo(3, -0.6)
    c.moveTo(-3, 0.6)
    c.lineTo(3, 0.6)
    c.stroke()
    c.restore()
    rim(c, () => bowPath(c, h), 'rgba(46,28,14,0.85)', 0.7)
    // String nock to nock + served center. Dark sinew, not pale linen:
    // the string spans the silhouette and must hold it like an edge.
    c.strokeStyle = '#5a4c38'
    c.lineWidth = 1.0
    c.beginPath()
    c.moveTo(-h, -10)
    c.lineTo(h, -10)
    c.stroke()
    c.strokeStyle = '#3a3226'
    c.lineWidth = 1.3
    c.beginPath()
    c.moveTo(-3.5, -10)
    c.lineTo(3.5, -10)
    c.stroke()
    return { cell, cw, ch: chh }
  }
  const L = spec.length
  paintHaft(c, L, spec.haft)
  paintBrass(c, -0.4, 2.6, (spec.haft * 0.62) / 2, true)
  paintBrass(c, L - 12, L - 7, (spec.haft + 2.4) / 2)
  // Ferrule ring grooves.
  c.strokeStyle = 'rgba(40,26,8,0.55)'
  c.lineWidth = 0.7
  for (const bx of [L - 10.6, L - 8.6]) {
    c.beginPath()
    c.moveTo(bx, -(spec.haft + 2.4) / 2 + 0.3)
    c.lineTo(bx, (spec.haft + 2.4) / 2 - 0.3)
    c.stroke()
  }
  paintBlade(c, spec.head, L)
  return { cell, cw, ch: chh }
}

export function paintTasselCell() {
  const [x0, y0, x1, y1] = WEAPON_BOUNDS.tassel
  const cw = Math.round((x1 - x0) * DENSITY)
  const chh = Math.round((y1 - y0) * DENSITY)
  const cell = createCanvas(cw, chh)
  const c = cell.getContext('2d')
  c.translate(-x0 * DENSITY, -y0 * DENSITY)
  c.scale(DENSITY, DENSITY)
  paintTassel(c)
  return { cell, cw, ch: chh }
}

/** Build the whole sheet in memory (deterministic; the test byte-compares). */
export function paintWeaponSheet() {
  const names = [...Object.keys(WEAPON_SPECS), 'tassel']
  const cells = []
  let sheetW = 0
  let sheetH = 0
  for (const name of names) {
    const { cell, cw, ch } = name === 'tassel' ? paintTasselCell() : paintWeaponCell(name)
    cells.push({ name, cell, cw, ch })
    sheetW += cw
    sheetH = Math.max(sheetH, ch)
  }
  const sheet = createCanvas(sheetW, sheetH)
  const sctx = sheet.getContext('2d')
  const parts = {}
  let ox = 0
  for (const { name, cell, cw, ch } of cells) {
    sctx.drawImage(cell, ox, 0)
    const [x0, y0] = WEAPON_BOUNDS[name]
    parts[name] = {
      x: ox, y: 0, w: cw, h: ch,
      // Device px of the absolute origin (butt / riser / tie) in the sheet.
      // The +0 normalizes -0 (tassel y0=0): JSON writes 0 but vitest's
      // toEqual distinguishes -0, failing the determinism test.
      originX: ox + Math.round(-x0 * DENSITY) + 0,
      originY: Math.round(-y0 * DENSITY) + 0,
    }
    ox += cw
  }
  const png = sheet.toBuffer('image/png')
  const im = sctx.getImageData(0, 0, sheetW, sheetH)
  const prepared = {
    weapons: {
      revision: 'weapon-1',
      density: DENSITY,
      sheet: { width: sheetW, height: sheetH },
      parts,
      signatures: { sheet: signature(im) },
      sha256: { sheet: createHash('sha256').update(png).digest('hex') },
    },
  }
  return { png, prepared, width: sheetW, height: sheetH }
}

export async function main() {
  const out = 'src/game/assets/weapons'
  mkdirSync(out, { recursive: true })
  const { png, prepared, width, height } = paintWeaponSheet()
  writeFileSync(`${out}/weapons-sheet.png`, png)
  writeFileSync(`${out}/prepared.json`, `${JSON.stringify(prepared, null, 2)}\n`)
  console.log(`weapons: sheet ${width}x${height}, ${png.length} bytes`)
}

if (process.argv[1]?.endsWith('prepare-weapon-cells.mjs')) await main()
