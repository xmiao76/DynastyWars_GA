import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { BODY_PART_DEFS, type BodyPartName } from '../../src/game/art/body-parts'
import { ENEMY_FIGURES, HERO_FIGURES } from '../../src/game/art/figures'
import { ALL_FIGHTERS, CAST } from './cast-art'

/**
 * BODY-18 art-materials completeness audit (owner round 3, item d:
 * "review all art/image materials to ensure each part is completed and no
 * parts are missing").
 *
 * For every fighter, every part the renderer draws is classified by its
 * SOURCE - painted (a cut from the fighter's own master), procedural (vector
 * fallback drawn by code) or missing - and every file under art/ is matched
 * to the script that consumes it. The test fails if a fighter silently lacks
 * a painted part the pipeline is meant to provide (head pack files, the nine
 * body cells, a non-empty cell), or a master has no consumer / a consumer
 * has no master. Procedural parts are LISTED, not failed: they are the gaps
 * the round-3 tasks (BODY-19..21) replace, and docs/ART_AUDIT.md traces each.
 *
 * Writes artifacts/look/audit/<id>-cells.png (every painted cell on a grey
 * ground, labelled) for the visual pass, and artifacts/look/audit/inventory.json.
 */
const PAINTED_BODY: BodyPartName[] = [
  'torso', 'upperArmF', 'foreArmF', 'thighF', 'shinF', 'thighN', 'shinN', 'upperArmN', 'foreArmN',
  // BODY-20 painted hand cells ride the same sheets.
  'gripN', 'gripF', 'relaxN', 'relaxF', 'wrapF', 'wrapN',
]
const HEAD_FILES = ['portrait', 'head', 'front', 'rear'] as const
/**
 * Keyed cells: cut from the masters and run through the BODY-23 re-key.
 * The hole ceiling applies to these only. Hand cells are GENERATED
 * (no keying): wrapF's row spans legitimately cross the gaps between its
 * three fingertip pads (36% by design), and grip/relax cells are solid.
 */
const KEYED_CELLS: BodyPartName[] = [
  'torso', 'upperArmF', 'foreArmF', 'thighF', 'shinF', 'thighN', 'shinN', 'upperArmN', 'foreArmN',
]
/** Max interior keyed-hole share per keyed cell (BODY-23 ratchet closed). */
const HOLE_CEILING = 0.08
/** Drawn by code for every fighter today (draw.ts / weapons.ts). */
const PROCEDURAL_PARTS = [
  'boot overlays (drawBoot)',
  'procedural fists/mittens (emergency path only since BODY-20)',
  'procedural weapons (emergency path only since BODY-21)',
] as const

function packs(id: string): { face: string; body: string } {
  if ((CAST.heroes as readonly string[]).includes(id)) return { face: 'hero-faces', body: 'hero-bodies' }
  if ((CAST.mooks as readonly string[]).includes(id)) return { face: 'mook-faces', body: 'mook-bodies' }
  return { face: 'boss-faces', body: 'boss-bodies' }
}

interface Cell { x: number; y: number; w: number; h: number; pivotX: number; pivotY: number }

describe('BODY-18 art-materials audit', () => {
  it('every fighter has every painted part the pipeline provides, and nothing is empty', async () => {
    mkdirSync('artifacts/look/audit', { recursive: true })
    const gaps: string[] = []
    const inventory: Record<string, Record<string, string>> = {}
    for (const id of ALL_FIGHTERS) {
      const plan = HERO_FIGURES[id] ?? ENEMY_FIGURES[id]
      if (!plan) { gaps.push(`${id}: no figure plan`); continue }
      const d = packs(id)
      const row: Record<string, string> = {}
      // Head pack: four painted images + prepared metadata.
      const fm = JSON.parse(readFileSync(`src/game/assets/${d.face}/prepared.json`, 'utf8')) as Record<string, unknown>
      if (!fm[id]) gaps.push(`${id}: no head metadata in ${d.face}`)
      for (const f of HEAD_FILES) {
        const p = `src/game/assets/${d.face}/${id}-${f}.png`
        if (!existsSync(p)) { gaps.push(`${id}: head ${f} missing`); continue }
        // The 'front' layer is the beard split that falls over the chest;
        // beardless fighters ship it as an intentionally empty image.
        const empty = statSync(p).size < 1024
        if (f === 'front' && plan.beard === 'none') {
          if (!empty) gaps.push(`${id}: beardless fighter ships a non-empty front layer`)
          row[`head.${f}`] = 'n/a (beardless, empty by design)'
          continue
        }
        if (empty) gaps.push(`${id}: head ${f} empty`)
        row[`head.${f}`] = 'painted'
      }
      // Body: nine painted cells, each with real (non-transparent) paint.
      const bm = JSON.parse(readFileSync(`src/game/assets/${d.body}/prepared.json`, 'utf8')) as Record<
        string, { parts: Partial<Record<BodyPartName, Cell>> }
      >
      const parts = bm[id]?.parts ?? {}
      const sheet = await loadImage(`src/game/assets/${d.body}/${id}-sheet.png`)
      const cols = 5
      const cw = 150
      const chh = 220
      const rows = Math.ceil(PAINTED_BODY.length / cols)
      const board = createCanvas(cols * cw, rows * (chh + 18))
      const g = board.getContext('2d')
      g.fillStyle = '#6a6470'
      g.fillRect(0, 0, board.width, board.height)
      g.font = '12px sans-serif'
      for (const [i, name] of PAINTED_BODY.entries()) {
        const c = parts[name]
        if (!c) { gaps.push(`${id}: body cell ${name} missing`); row[`body.${name}`] = 'MISSING'; continue }
        const cv = createCanvas(c.w, c.h)
        const cx = cv.getContext('2d')
        cx.drawImage(sheet, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h)
        const px = cx.getImageData(0, 0, c.w, c.h).data
        // Fill = opaque share of the cell; holes = transparent pixels INSIDE
        // the painted span of each row (the black-ground key eating
        // near-black costume - reads "moth-eaten" in game).
        let opaque = 0
        let inner = 0
        let holes = 0
        for (let y = 0; y < c.h; y += 1) {
          let a = -1
          let z = -1
          for (let x = 0; x < c.w; x += 1) if ((px[(y * c.w + x) * 4 + 3] ?? 0) > 200) { if (a < 0) a = x; z = x }
          if (a < 0) continue
          for (let x = a; x <= z; x += 1) {
            inner += 1
            if ((px[(y * c.w + x) * 4 + 3] ?? 0) > 200) opaque += 1
            else holes += 1
          }
        }
        const fill = opaque / (c.w * c.h)
        const holeFrac = holes / Math.max(1, inner)
        // Floor: a cell under 15% is effectively missing (this caught Wei
        // Yan's hand-only forearm cells - gap G3, fixed in BODY-19).
        if (fill < 0.15) gaps.push(`${id}: body cell ${name} nearly empty (${(fill * 100).toFixed(0)}% opaque)`)
        // Ratchet closed (BODY-23): keyed cells hold 0% interior holes -
        // the re-key restores every row-span hole to the master's matte.
        // Generated hand cells are exempt (wrapF's pad gaps are design).
        if (KEYED_CELLS.includes(name) && holeFrac > HOLE_CEILING) {
          gaps.push(`${id}: body cell ${name} ${(holeFrac * 100).toFixed(0)}% keyed holes`)
        }
        row[`body.${name}`] = `painted (${(fill * 100).toFixed(0)}% fill, ${(holeFrac * 100).toFixed(0)}% holes)`
        const s = Math.min((cw - 10) / c.w, (chh - 10) / c.h)
        const ox = (i % cols) * cw
        const oy = Math.floor(i / cols) * (chh + 18)
        g.drawImage(cv, ox + (cw - c.w * s) / 2, oy + 18, c.w * s, c.h * s)
        g.fillStyle = '#f5e6c8'
        g.fillText(`${name}`, ox + 4, oy + 13)
      }
      writeFileSync(`artifacts/look/audit/${id}-cells.png`, board.toBuffer('image/png'))
      // Cloth/cape: BODY-23 paints cloth cells for every caped plan (G5),
      // so a caped plan WITHOUT one is a gap, not a disposition note.
      if (plan.cape) {
        if (parts.cloth) {
          row['body.cloth'] = 'painted'
        } else {
          row['body.cloth'] = 'MISSING'
          gaps.push(`${id}: caped plan lacks a painted cloth cell`)
        }
      } else {
        row['body.cloth'] = 'n/a (no cape)'
      }
      for (const p of PROCEDURAL_PARTS) row[p] = 'procedural'
      row.weaponKind = plan.weapon
      inventory[id] = row
    }
    writeFileSync('artifacts/look/audit/inventory.json', JSON.stringify(inventory, null, 2))
    expect(gaps, 'painted parts missing or empty').toEqual([])
    // The part table itself must still list every painted slot we audit.
    for (const p of PAINTED_BODY) expect(BODY_PART_DEFS[p], `part def ${p}`).toBeDefined()
  }, 120_000)

  it('every master under art/ has a consumer, and every consumer has its master', () => {
    const scripts = readdirSync('scripts').filter((f) => f.endsWith('.mjs'))
      .map((f) => readFileSync(`scripts/${f}`, 'utf8')).join('\n')
    const orphans: string[] = []
    const dirs = ['fighter-bodies', 'hero-faces', 'mook-faces', 'boss-faces', 'ui-title']
    for (const dir of dirs) {
      for (const f of readdirSync(`art/${dir}`)) {
        if (!/\.(png|jpe?g)$/i.test(f)) continue
        // hero-faces is consumed by directory walk (prepare-hero-faces.mjs
        // reads art/hero-faces/<id>-{heads,portrait}-master.png by id).
        const byWalk = dir === 'hero-faces' && scripts.includes("'art/hero-faces'")
        if (!byWalk && !scripts.includes(f)) orphans.push(`art/${dir}/${f}`)
      }
    }
    expect(orphans, 'masters no script consumes').toEqual([])
    // Every fighter has a body master and both face masters.
    for (const id of ALL_FIGHTERS) {
      expect(existsSync(`art/fighter-bodies/${id}-body-master.jpg`), `${id} body master`).toBe(true)
      const faceDir = packs(id).face
      const ext = faceDir === 'hero-faces' ? 'png' : 'jpg'
      expect(existsSync(`art/${faceDir}/${id}-heads-master.${ext}`), `${id} heads master`).toBe(true)
      expect(existsSync(`art/${faceDir}/${id}-portrait-master.${ext}`), `${id} portrait master`).toBe(true)
    }
    expect(existsSync('art/fighter-bodies/horse-master.jpg'), 'horse master').toBe(true)
  })

  it('art/raw holds only legacy sample-pipeline placeholders the shipping build never reads', () => {
    // scripts/bake-art.mjs + make-sample.mjs read art/raw into public/assets;
    // the shipping build ships no public/assets manifest (vite hasBakedArt
    // false), so art/raw is inert. Guard that it stays placeholder-sized and
    // that the build still ships no baked manifest.
    const raw = readdirSync('art/raw')
    const big = raw.filter((f) => statSync(`art/raw/${f}`).size > 4096)
    expect(big, 'art/raw now holds real art - wire or remove it').toEqual([])
    expect(existsSync('public/assets/manifest.json'), 'baked manifest would activate art/raw').toBe(false)
  })
})
