import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { headRadius } from '../../src/game/art/draw'
import { ENEMY_FIGURES, HERO_FIGURES, WEAPONS, type FigurePlan } from '../../src/game/art/figures'
import { HEAD_PAINTED_SCALE } from '../../src/game/art/hero-resources'
import { materials } from '../../src/game/art/palette'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { artBoxFor } from '../../src/game/art/registry'
import { applyBuild, chainPath, FIG_H, FIG_W, limbPath, ovalPath, polyPath, type Pt, type Skeleton } from '../../src/game/art/rig'
import { addWeapon, weaponPose } from '../../src/game/art/weapons'

/**
 * Whole-frame pilot (docs/WHOLE_FRAME_TEST.md), step 1: pose guides.
 *
 * Draws a plain MANNEQUIN straight from the rig (tapered limb chains, an
 * oval head at the painted head scale, a torso quad, the procedural weapon)
 * - exact joints, proportions and weapon placement, and no costume shapes
 * the image model could copy (the procedural fighter's boxy hood and flat
 * cel panels read as blocks). Near-side limbs are lighter than far-side
 * ones so depth order reads. Then writes:
 *   guide-<pose>.png       mannequin in greys on flat #FF00FF, cropped to
 *                          the silhouette + pad, scaled to fill the image size
 *                          the generator is asked for;
 *   guide-<pose>-mask.png  silhouette mask (white on black), same framing;
 *   guide-<pose>.json      px-per-unit, unit->px origin, and anchors (feet,
 *                          hip, head, hands, weapon butt/tip) in px and units.
 * Written only when WHOLEFRAME_GUIDES=1. Units are canonical figure space
 * after applyBuild (the space drawKindPose draws in after its box translate).
 */
const RUN = process.env.WHOLEFRAME_GUIDES === '1'
const ID = process.env.WHOLEFRAME_ID ?? 'guanyu'
const OUT = `art/whole-frames/${ID}`
const POSES: { pose: PoseName; w: number; h: number }[] = [
  { pose: 'idle', w: 1024, h: 1536 },
  { pose: 'attack', w: 1536, h: 1024 },
  { pose: 'down', w: 1536, h: 1024 },
]
const Z = 8
const PAD = 6

/** Mannequin in canonical figure space (after applyBuild + weaponPose). */
function drawMannequin(g: CanvasRenderingContext2D, plan: FigurePlan, p: Skeleton): void {
  const b = plan.build.bulk
  const far = '#5a5a5e'
  const mid = '#7c7c80'
  const near = '#a4a4a8'
  const ink = '#2e2e32'
  const fill = (trace: () => void, col: string): void => {
    trace()
    g.fillStyle = col
    g.fill()
    g.lineWidth = 0.7
    g.strokeStyle = ink
    g.stroke()
  }
  // Far leg and far arm (behind the torso).
  fill(() => chainPath(g, [p.hipF, p.kneeF, p.footF], [12 * b, 9.5 * b, 7 * b]), far)
  fill(() => ovalPath(g, { x: p.footF.x + 2.5 * b, y: p.footF.y - 1.6 }, 5 * b, 2 * b), far)
  fill(() => chainPath(g, [p.shoulderF, p.elbowF, p.handF], [8.5 * b, 7 * b, 5.4 * b]), far)
  fill(() => ovalPath(g, p.handF, 3.2 * b, 2.6 * b), far)
  // Torso (shoulders -> hips) and neck.
  fill(() => polyPath(g, [
    { x: p.shoulderF.x - 2, y: p.shoulderF.y - 2 }, { x: p.shoulderN.x + 2, y: p.shoulderN.y - 2 },
    { x: p.hipN.x + 3 * b, y: p.hipN.y + 2 }, { x: p.hipF.x - 3 * b, y: p.hipF.y + 2 },
  ]), mid)
  fill(() => limbPath(g, p.neck, p.chest, 7 * b, 9 * b), mid)
  // Near leg.
  fill(() => chainPath(g, [p.hipN, p.kneeN, p.footN], [12.5 * b, 10 * b, 7.5 * b]), near)
  fill(() => ovalPath(g, { x: p.footN.x + 2.5 * b, y: p.footN.y - 1.6 }, 5.2 * b, 2.1 * b), near)
  // Head at the painted scale, tilted with the pose.
  const r = headRadius(plan) * HEAD_PAINTED_SCALE * 1.15
  fill(() => ovalPath(g, p.head, r * 0.85, r, p.headRot), mid)
  // Weapon: the exact procedural geometry, flattened to one grey.
  const m = materials(0x909094, 0x909094, 0x909094, 0x909094, 0x909094)
  const shapes: Array<(c: CanvasRenderingContext2D) => void> = []
  addWeapon((t) => shapes.push(t), plan, p, m)
  for (const t of shapes) {
    g.save()
    t(g)
    g.fillStyle = '#c8c8cc'
    g.fill()
    g.lineWidth = 0.6
    g.strokeStyle = ink
    g.stroke()
    g.restore()
  }
  // Near arm over the torso and haft, near hand over the haft.
  fill(() => chainPath(g, [p.shoulderN, p.elbowN, p.handN], [9 * b, 7.4 * b, 5.6 * b]), near)
  fill(() => ovalPath(g, p.handN, 3.4 * b, 2.8 * b), near)
}

describe.runIf(RUN)('whole-frame pose guides (WHOLEFRAME_GUIDES=1 only)', () => {
  it('writes guide, mask and anchors per pose', () => {
    mkdirSync(OUT, { recursive: true })
    const plan = HERO_FIGURES[ID] ?? ENEMY_FIGURES[ID]
    if (!plan) throw new Error(`no plan ${ID}`)
    const spec = WEAPONS[plan.weapon]
    for (const { pose, w, h } of POSES) {
      const box = artBoxFor(ID, pose)
      if (!box) throw new Error(`no box ${ID}:${pose}`)
      // Mannequin render of the whole box at Z (same box convention as
      // drawKindPose: margin left, headroom top).
      const ox0 = (box.width - FIG_W) / 2
      const oy0 = box.height - FIG_H
      const p0 = weaponPose(plan, applyBuild(POSE_TABLE[pose], plan.build))
      const src = createCanvas(Math.round(box.width * Z), Math.round(box.height * Z))
      const sg = src.getContext('2d')
      sg.scale(Z, Z)
      sg.translate(ox0, oy0)
      drawMannequin(sg as unknown as CanvasRenderingContext2D, plan, p0)
      const sd = sg.getImageData(0, 0, src.width, src.height).data
      let x0 = src.width
      let y0 = src.height
      let x1 = -1
      let y1 = -1
      for (let y = 0; y < src.height; y += 1) {
        for (let x = 0; x < src.width; x += 1) {
          if ((sd[(y * src.width + x) * 4 + 3] ?? 0) < 32) continue
          if (x < x0) x0 = x
          if (x > x1) x1 = x
          if (y < y0) y0 = y
          if (y > y1) y1 = y
        }
      }
      // Crop (box px at Z) padded, then uniform scale to fit w x h, centred.
      const pad = PAD * Z
      const cx0 = Math.max(0, x0 - pad)
      const cy0 = Math.max(0, y0 - pad)
      const cw = Math.min(src.width, x1 + pad) - cx0
      const ch = Math.min(src.height, y1 + pad) - cy0
      const s = Math.min(w / cw, h / ch)
      const dx = (w - cw * s) / 2
      const dy = (h - ch * s) / 2
      // unit (figure space) -> guide px. Box px = (u + ox) * Z; guide = (box - c0) * s + d.
      const ox = (box.width - FIG_W) / 2
      const oy = box.height - FIG_H
      const toPx = (q: Pt): { x: number; y: number } => ({
        x: Math.round((((q.x + ox) * Z - cx0) * s + dx) * 10) / 10,
        y: Math.round((((q.y + oy) * Z - cy0) * s + dy) * 10) / 10,
      })
      // The mannequin is already neutral grey; the mask is its alpha.
      const grey = src
      const gg = grey.getContext('2d')
      const md = gg.createImageData(src.width, src.height)
      for (let i = 0; i < sd.length; i += 4) {
        const a = sd[i + 3] ?? 0
        const on = a >= 128 ? 255 : 0
        md.data[i] = on
        md.data[i + 1] = on
        md.data[i + 2] = on
        md.data[i + 3] = 255
      }
      const maskSrc = createCanvas(src.width, src.height)
      maskSrc.getContext('2d').putImageData(md, 0, 0)
      const guide = createCanvas(w, h)
      const g = guide.getContext('2d')
      g.fillStyle = '#ff00ff'
      g.fillRect(0, 0, w, h)
      g.imageSmoothingEnabled = true
      g.drawImage(grey, cx0, cy0, cw, ch, dx, dy, cw * s, ch * s)
      const mask = createCanvas(w, h)
      const mg = mask.getContext('2d')
      mg.fillStyle = '#000000'
      mg.fillRect(0, 0, w, h)
      mg.drawImage(maskSrc, cx0, cy0, cw, ch, dx, dy, cw * s, ch * s)
      writeFileSync(`${OUT}/guide-${pose}.png`, guide.toBuffer('image/png'))
      writeFileSync(`${OUT}/guide-${pose}-mask.png`, mask.toBuffer('image/png'))
      // Anchors: rig joints after weaponPose (what drawFigure draws).
      const p = p0
      const anchorAt = p.weaponAnchor ?? p.handN
      const back = -spec.length * p.weaponGrip
      const fore = spec.length * (1 - p.weaponGrip)
      const along = (d: number): Pt => ({ x: anchorAt.x + Math.cos(p.weaponRot) * d, y: anchorAt.y + Math.sin(p.weaponRot) * d })
      const units: Record<string, Pt> = {
        footN: p.footN, footF: p.footF, hip: p.hip, head: p.head,
        handN: p.handN, handF: p.handF, weaponButt: along(back), weaponTip: along(fore),
      }
      const anchors = Object.fromEntries(Object.entries(units).map(([k, q]) => [k, { px: toPx(q), u: { x: Math.round(q.x * 100) / 100, y: Math.round(q.y * 100) / 100 } }]))
      writeFileSync(`${OUT}/guide-${pose}.json`, `${JSON.stringify({
        id: ID, pose, image: { width: w, height: h },
        box: { width: box.width, height: box.height, ox, oy },
        pxPerUnit: Math.round(Z * s * 1000) / 1000,
        origin: { note: 'guide px = (u + ox) * Z - crop0) * s + d', Z, crop: { x: cx0, y: cy0, w: cw, h: ch }, s: Math.round(s * 1e6) / 1e6, d: { x: dx, y: dy } },
        groundY: toPx({ x: 0, y: FIG_H }).y,
        lying: p.lying === true,
        anchors,
      }, null, 2)}\n`)
      expect(x1).toBeGreaterThan(x0)
    }
  })
})
