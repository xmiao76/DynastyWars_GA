import { writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'
import type { ArtResources, HeroArt } from '../../src/game/art/hero-resources'
import type { BodyArt } from '../../src/game/art/body-parts'
import { ENEMY_FIGURES, HERO_FIGURES, type FigurePlan } from '../../src/game/art/figures'
import { shade } from '../../src/game/art/palette'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { applyBuild, FIG_H, FIG_W } from '../../src/game/art/rig'
import { weaponPose } from '../../src/game/art/weapons'

/**
 * BODY-14 visual verification harness (permanent generator): whole
 * characters at 1.5x with measurement overlays per cell - the analytic
 * head:body ratio plus both-hands presence flags. Writes
 * artifacts/look/review-harness-{a,b}.png. The vision loop in
 * docs/CHARACTER_REVIEW.md reads these sheets every enhancement round.
 *
 * Assertions are harness invariants, not art verdicts: the near-hand
 * flags must stay green (BODY-8 regression guard) and every ratio must
 * compute. The VALUES are what BODY-15/16 move - vision judges them.
 */
type Ctx = CanvasRenderingContext2D
const SCALE = 1.5
const GROUND = 76
const GROUPS = [
  ['guanyu', 'zhangfei', 'zhaoyun', 'huangzhong', 'weiyan', 'soldier', 'spearman', 'archer'],
  ['lubu', 'caocao', 'xiahoudun', 'xuchu', 'zhangliao', 'caoren', 'xuhuang', 'zhanghe', 'lidian'],
] as const
const FACE_DIR: Record<string, string> = {
  guanyu: 'hero-faces', zhangfei: 'hero-faces', zhaoyun: 'hero-faces', huangzhong: 'hero-faces', weiyan: 'hero-faces',
  soldier: 'mook-faces', spearman: 'mook-faces', archer: 'mook-faces',
  lubu: 'boss-faces', caocao: 'boss-faces', xiahoudun: 'boss-faces', xuchu: 'boss-faces', zhangliao: 'boss-faces',
  caoren: 'boss-faces', xuhuang: 'boss-faces', zhanghe: 'boss-faces', lidian: 'boss-faces',
}
const BODY_DIR: Record<string, string> = {
  guanyu: 'hero-bodies', zhangfei: 'hero-bodies', zhaoyun: 'hero-bodies', huangzhong: 'hero-bodies', weiyan: 'hero-bodies',
  soldier: 'mook-bodies', spearman: 'mook-bodies', archer: 'mook-bodies',
  lubu: 'boss-bodies', caocao: 'boss-bodies', xiahoudun: 'boss-bodies', xuchu: 'boss-bodies', zhangliao: 'boss-bodies',
  caoren: 'boss-bodies', xuhuang: 'boss-bodies', zhanghe: 'boss-bodies', lidian: 'boss-bodies',
}

function rgb(n: number): [number, number, number] {
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

describe('BODY-14 review harness sheets (permanent generator)', () => {
  it('writes measured whole-character sheets for both groups', async () => {
    const resources: ArtResources = { heroes: {}, bodies: {} }
    const plans: Record<string, FigurePlan> = {}
    for (const group of GROUPS) {
      for (const id of group) {
        const fdir = FACE_DIR[id]!
        const fm = (await import(`../../src/game/assets/${fdir}/prepared.json`)).default as Record<string, {
          revision: string; skin: string; cell: { width: number; height: number }
          bounds: { x: number; y: number; width: number; height: number }
        }>
        const fmeta = fm[id]
        if (fmeta) {
          const image = async (part: string) => await loadImage(`src/game/assets/${fdir}/${id}-${part}.png`) as unknown as CanvasImageSource
          ;(resources.heroes as Record<string, HeroArt>)[id] = {
            id, revision: fmeta.revision, portrait: await image('portrait'), head: await image('head'),
            front: await image('front'), rear: await image('rear'), cell: fmeta.cell, bounds: fmeta.bounds,
            skin: parseInt(fmeta.skin.slice(1), 16),
          }
        }
        const bdir = BODY_DIR[id]!
        const bm = (await import(`../../src/game/assets/${bdir}/prepared.json`)).default as Record<string, {
          revision: string; skin: string; density: number; parts: BodyArt['parts']
        }>
        const bmeta = bm[id]
        if (bmeta) {
          const sheet = (await loadImage(`src/game/assets/${bdir}/${id}-sheet.png`)) as unknown as CanvasImageSource
          ;(resources.bodies as Record<string, BodyArt>)[id] = {
            id, revision: bmeta.revision, sheet, density: bmeta.density, parts: bmeta.parts,
            skin: parseInt(bmeta.skin.slice(1), 16),
          }
        }
        plans[id] = (HERO_FIGURES[id] ?? ENEMY_FIGURES[id])!
      }
    }
    let nearMissing = 0
    let ratios = 0
    for (const [gi, group] of GROUPS.entries()) {
      const poses: PoseName[] = ['idle', 'attack']
      const cells = group.map((id) => poses.map((pose) => {
        const b = artBoxFor(id, pose) ?? artBoxFor(id, 'idle')
        if (!b) throw new Error(`no box for ${id}:${pose}`)
        const cv = createCanvas(b.width * SCALE, b.height * SCALE)
        const ctx = cv.getContext('2d')
        drawKindPose(ctx as unknown as Ctx, id, pose, SCALE, resources)
        return { id, pose, cv, w: b.width * SCALE, h: b.height * SCALE }
      }))
      const cw = Math.max(...cells.flat().map((c) => c.w))
      const chh = Math.max(...cells.flat().map((c) => c.h))
      const sheet = createCanvas(cw * 2 + 30, (chh + 44) * group.length + 10)
      const g = sheet.getContext('2d')
      g.fillStyle = '#181420'
      g.fillRect(0, 0, sheet.width, sheet.height)
      g.font = '13px sans-serif'
      cells.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          const plan = plans[cell.id]!
          const pose = weaponPose(plan, applyBuild(POSE_TABLE[cell.pose], plan.build))
          const head = (resources.heroes as Record<string, HeroArt>)[cell.id]
          // Analytic ratio from the renderer's own numbers: the prep maps
          // eye->chin to 12 art units with the eye at the pose head joint,
          // and the cells measure eye->crown ~8 units (anatomical, so tall
          // headgear like Lu Bu's plumes does not inflate the head).
          let ratio = '1:?'
          if (head) {
            const hs = plan.build.head
            const headTop = pose.head.y - 8 * hs
            const headH = 20 * hs
            const total = GROUND - headTop
            ratio = `1:${(total / headH).toFixed(1)}`
            ratios += 1
          }
          // Hands presence on the actual render (box coords).
          const b = artBoxFor(cell.id, cell.pose) ?? artBoxFor(cell.id, 'idle')
          if (!b) throw new Error('no box')
          const ox = (b.width - FIG_W) / 2
          const oy = b.height - FIG_H
          const im = (cell.cv.getContext('2d') as unknown as Ctx).getImageData(0, 0, cell.w, cell.h).data
          const skinNum = (resources.bodies as Record<string, BodyArt>)[cell.id]?.skin
            ?? head?.skin ?? plan.skin ?? 0xf0c8a0
          const near = rgb(skinNum)
          const farT = rgb(shade(skinNum, 0.22))
          const count = (cx: number, cy: number, tone: [number, number, number]): number => {
            let n = 0
            for (let y = Math.round((cy + oy - 3) * SCALE); y <= Math.round((cy + oy + 3) * SCALE); y += 1) {
              for (let x = Math.round((cx + ox - 3) * SCALE); x <= Math.round((cx + ox + 3) * SCALE); x += 1) {
                if (x < 0 || y < 0 || x >= cell.w || y >= cell.h) continue
                const p = (y * cell.w + x) * 4
                if ((im[p + 3] ?? 0) < 128) continue
                if (im[p] === tone[0] && im[p + 1] === tone[1] && im[p + 2] === tone[2]) n += 1
              }
            }
            return n
          }
          const nOk = count(pose.handN.x, pose.handN.y, near) >= 24
          const fOk = count(pose.handF.x, pose.handF.y, farT) >= 12
          if (!nOk) nearMissing += 1
          const y = 10 + ri * (chh + 44)
          const dx = ci === 0 ? 5 : cw + 20
          g.drawImage(cell.cv, dx, y + 22)
          g.fillStyle = '#f5e6c8'
          g.fillText(`${cell.id} ${cell.pose} ${ratio} N${nOk ? 'Y' : 'n'} F${fOk ? 'Y' : 'n'}`, dx + 2, y + 15)
        })
      })
      writeFileSync(`artifacts/look/review-harness-${gi === 0 ? 'a' : 'b'}.png`, sheet.toBuffer('image/png'))
    }
    expect(nearMissing, 'near-hand regression (BODY-8 must hold)').toBe(0)
    expect(ratios, 'ratio readout missing').toBe(GROUPS[0].length * 2 + GROUPS[1].length * 2)
  }, 120_000)
})
