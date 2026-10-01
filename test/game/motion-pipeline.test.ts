import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { afterAll, describe, expect, it } from 'vitest'
import {
  DECODED_CAP,
  PAGE_LIMIT,
  assertOwnOutput,
  buildReport,
  cleanAlpha,
  extractSequence,
  fighterPaths,
  preparePack,
  restoredHash,
  trimCell,
  validateBudget,
  validateProvenance,
  writePackOutputs,
  type FighterSpec,
  type Pixels,
  type SequenceSpec,
} from '../../scripts/motion-pipeline.mjs'
import { motionPreparedRecord } from '../../src/game/adapters/motion-art'

/**
 * CMR-04: the generic fighter-parameterized preparation toolkit. Fixtures
 * cover hero/mook/boss/shooter with variable frame and page counts; negative
 * controls prove every failure is explicit; the Guan Yu displayed RGBA and
 * pivot round-trip runs through the generic restore unchanged.
 */

// ---------------------------------------------------------------------------
// Fixture pixel helpers (pure arrays; no provider, no generation)
// ---------------------------------------------------------------------------

function blank(w: number, h: number): Pixels {
  return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }
}

function fillRect(
  im: Pixels,
  x: number,
  y: number,
  w: number,
  h: number,
  rgba: [number, number, number, number],
): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (xx < 0 || yy < 0 || xx >= im.width || yy >= im.height) continue
      const k = (yy * im.width + xx) * 4
      im.data[k] = rgba[0]
      im.data[k + 1] = rgba[1]
      im.data[k + 2] = rgba[2]
      im.data[k + 3] = rgba[3]
    }
  }
}

interface FigureDraw {
  at: number
  size?: number
  rgba?: [number, number, number, number]
  dx?: number
  dy?: number
}

function sheetOf(cols: number, rows: number, cell: number, figures: FigureDraw[]): Pixels {
  const im = blank(cols * cell, rows * cell)
  for (const f of figures) {
    const size = f.size ?? 20
    const cx = (f.at % cols) * cell + cell / 2 + (f.dx ?? 0)
    const cy = Math.floor(f.at / cols) * cell + cell / 2 + (f.dy ?? 0)
    fillRect(im, Math.round(cx - size / 2), Math.round(cy - size / 2), size, size, f.rgba ?? [180, 60, 40, 255])
  }
  return im
}

function fighter(id: string, role: FighterSpec['role'], sequences: SequenceSpec[], extra: Partial<FighterSpec> = {}): FighterSpec {
  return { id, role, density: 2, box: { width: 48, height: 48, groundY: 46 }, sequences, ...extra }
}

const tmpRoots: string[] = []
function tmpRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), 'motion-pipeline-'))
  tmpRoots.push(dir)
  return dir
}
afterAll(() => {
  for (const dir of tmpRoots) rmSync(dir, { recursive: true, force: true })
})

// ---------------------------------------------------------------------------
// 1. Fighter id selects separated directories; no cross-fighter overwrite
// ---------------------------------------------------------------------------

describe('fighter identity and output separation', () => {
  it('gives every fighter its own source/output tree and refuses hostile ids', () => {
    const a = fighterPaths('hero-alpha')
    const b = fighterPaths('boss-beta')
    expect(a.source).toBe(join('art/motion', 'hero-alpha'))
    expect(a.output).toBe(join('artifacts/motion', 'hero-alpha'))
    expect(a.output).not.toBe(b.output)
    expect(a.source).not.toBe(b.source)
    for (const id of ['../evil', 'UPPER', 'has space', '', 'x/y']) {
      expect(() => fighterPaths(id), id).toThrow(/fighter id/)
    }
  })

  it('never writes outside the fighter own directory', () => {
    const root = tmpRoot()
    const opts = { sourceRoot: join(root, 'src'), outputRoot: join(root, 'out') }
    const b = fighterPaths('fighter-b', opts)
    expect(() => assertOwnOutput('fighter-a', join(b.output, 'manifest.json'), opts)).toThrow(/refusing to write outside/)
    // A real write lands in A's tree and leaves B's files untouched.
    mkdirSync(b.output, { recursive: true })
    writeFileSync(join(b.output, 'sentinel.txt'), 'keep')
    const pack = preparePack(fighter('fighter-a', 'hero', [{ name: 'walk', count: 2, rows: 1, cols: 2 }]), {
      walk: sheetOf(2, 1, 48, [{ at: 0 }, { at: 1 }]),
    })
    writePackOutputs(fighter('fighter-a', 'hero', []), pack, opts)
    expect(existsSync(join(root, 'out/fighter-a/manifest.json'))).toBe(true)
    expect(existsSync(join(root, 'out/fighter-a/report.json'))).toBe(true)
    expect(readFileSync(join(b.output, 'sentinel.txt'), 'utf8')).toBe('keep')
  })
})

// ---------------------------------------------------------------------------
// 2. Hero/mook/boss/shooter fixtures with variable frames and pages
// ---------------------------------------------------------------------------

describe('variable frame and page counts per fighter role', () => {
  it('hero: two sequences, 8 + 5 frames, explicit order on the second', () => {
    const hero = fighter('hero-one', 'hero', [
      { name: 'walk', count: 8, rows: 2, cols: 4 },
      { name: 'jab', count: 5, rows: 2, cols: 3, order: [2, 0, 1, 4, 3] },
    ])
    const pack = preparePack(hero, {
      walk: sheetOf(4, 2, 48, Array.from({ length: 8 }, (_, i) => ({ at: i }))),
      jab: sheetOf(3, 2, 48, Array.from({ length: 5 }, (_, i) => ({ at: i, size: 16 + i }))),
    })
    expect(pack.frames.map((f) => f.name)).toEqual([
      'walk:0', 'walk:1', 'walk:2', 'walk:3', 'walk:4', 'walk:5', 'walk:6', 'walk:7',
      'jab:0', 'jab:1', 'jab:2', 'jab:3', 'jab:4',
    ])
    // Explicit order: jab:0 comes from sheet cell 2 (distinct pixel size).
    const jab0 = pack.frames[8]!
    expect(jab0.cellIndex).toBe(2)
    expect(pack.report.counts.sourceCells).toBe(2 * 4 + 2 * 3)
    expect(pack.pages.length).toBeGreaterThanOrEqual(1)
    expect((pack.manifest as { frames: unknown[] }).frames.length).toBe(13)
  })

  it('mook: 6 frames on one page; boss: 20 frames across two sequences; shooter: 4 frames', () => {
    const mook = preparePack(fighter('mook-one', 'mook', [{ name: 'walk', count: 6, rows: 2, cols: 3 }]), {
      walk: sheetOf(3, 2, 48, Array.from({ length: 6 }, (_, i) => ({ at: i }))),
    })
    expect(mook.frames).toHaveLength(6)
    expect(mook.pages).toHaveLength(1)
    const boss = preparePack(fighter('boss-one', 'boss', [
      { name: 'idle', count: 12, rows: 3, cols: 4 },
      { name: 'charge', count: 8, rows: 2, cols: 4 },
    ]), {
      idle: sheetOf(4, 3, 48, Array.from({ length: 12 }, (_, i) => ({ at: i }))),
      charge: sheetOf(4, 2, 48, Array.from({ length: 8 }, (_, i) => ({ at: i }))),
    })
    expect(boss.frames).toHaveLength(20)
    expect(boss.pages.length).toBeGreaterThanOrEqual(1)
    const shooter = preparePack(fighter('shooter-one', 'shooter', [{ name: 'shoot', count: 4, rows: 1, cols: 4 }]), {
      shoot: sheetOf(4, 1, 48, Array.from({ length: 4 }, (_, i) => ({ at: i }))),
    })
    expect(shooter.frames).toHaveLength(4)
    // Variable scales/pages across the four fixtures.
    expect(new Set([mook.frames.length, boss.frames.length, shooter.frames.length]).size).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// 3. Determinism + Guan Yu round-trip
// ---------------------------------------------------------------------------

describe('determinism and the accepted Guan Yu reference', () => {
  const hero = fighter('hero-det', 'hero', [
    { name: 'walk', count: 4, rows: 1, cols: 4 },
    { name: 'hurt', count: 3, rows: 1, cols: 3 },
  ])
  const sheets = {
    walk: sheetOf(4, 1, 48, Array.from({ length: 4 }, (_, i) => ({ at: i }))),
    hurt: sheetOf(3, 1, 48, Array.from({ length: 3 }, (_, i) => ({ at: i }))),
  }

  it('repeated preparation produces identical hashes', () => {
    const a = preparePack(hero, sheets)
    const b = preparePack(hero, sheets)
    expect(b.manifestSha256).toBe(a.manifestSha256)
    expect(b.frames.map((f) => f.restoredSha256)).toEqual(a.frames.map((f) => f.restoredSha256))
    expect(b.frames.map((f) => f.contentSha256)).toEqual(a.frames.map((f) => f.contentSha256))
    for (let i = 0; i < a.pages.length; i++) {
      expect(createHash('sha256').update(Buffer.from(b.pages[i]!.pixels.data)).digest('hex'))
        .toBe(createHash('sha256').update(Buffer.from(a.pages[i]!.pixels.data)).digest('hex'))
    }
  })

  it('Guan Yu displayed RGBA and pivot round-trip unchanged through the generic restore', async () => {
    const meta = motionPreparedRecord()
    const reference = JSON.parse(readFileSync('docs/motion-tasks/guanyu-reference.json', 'utf8')) as {
      frames: Record<string, { rgba: string }>
    }
    const readPixels = async (path: string): Promise<Pixels> => {
      const img = await loadImage(path)
      const cv = createCanvas(img.width, img.height)
      const g = cv.getContext('2d')
      g.drawImage(img, 0, 0)
      const d = g.getImageData(0, 0, img.width, img.height)
      return { width: d.width, height: d.height, data: d.data }
    }
    const sheet = await readPixels('src/game/assets/motion/guanyu-motion-sheet.png')
    const actions = await readPixels('src/game/assets/motion/guanyu-actions-sheet.png')
    for (const [name, c] of Object.entries(meta.frames)) {
      const im = c.sheet === 'actions' ? actions : sheet
      // The stored rect includes the 2px transparent pad; the toolkit's
      // content bbox is the padless figure inside it.
      const frame = {
        name,
        position: 0,
        cellIndex: 0,
        cell: { x: c.x - (c.trimX ?? 0), y: c.y - (c.trimY ?? 0), w: c.srcW ?? c.w, h: c.srcH ?? c.h },
        content: { x: c.x + 2, y: c.y + 2, w: c.w - 4, h: c.h - 4 },
      }
      const trim = trimCell(frame)
      expect(trim, name).toEqual({ srcW: c.srcW, srcH: c.srcH, trimX: c.trimX ?? 0, trimY: c.trimY ?? 0, w: c.w, h: c.h })
      expect(restoredHash(im, frame, trim), `${name} displayed RGBA`).toBe(reference.frames[name]!.rgba)
    }
    // Fixed registration: every cell's pivot is the box centre over the
    // ground line at density 2 - never silhouette-driven.
    const guanyu = fighter('guanyu', 'hero', [], { density: meta.density, box: meta.box })
    const pivot = { x: (meta.frames['walk:0']!.srcW ?? 0) / 2, y: meta.box.groundY * meta.density }
    expect(pivot).toEqual({ x: 224, y: 272 })
    expect(meta.box).toEqual({ width: 224, height: 144, groundY: 136 })
    expect(guanyu.density).toBe(2)
  }, 120_000)
})

// ---------------------------------------------------------------------------
// 4. Negative controls: every failure is explicit
// ---------------------------------------------------------------------------

describe('negative controls fail explicitly', () => {
  it('missing frames', () => {
    expect(() => preparePack(fighter('neg-missing', 'mook', [{ name: 'walk', count: 5, rows: 2, cols: 3 }]), {
      walk: sheetOf(3, 2, 48, Array.from({ length: 4 }, (_, i) => ({ at: i }))),
    })).toThrow(/missing frames: walk expected 5, found 4/)
  })

  it('extra frames', () => {
    expect(() => preparePack(fighter('neg-extra', 'mook', [{ name: 'walk', count: 2, rows: 1, cols: 3 }]), {
      walk: sheetOf(3, 1, 48, [{ at: 0 }, { at: 1 }, { at: 2 }]),
    })).toThrow(/extra frames: walk expected 2, found 3/)
  })

  it('merged figures fail the count check and are never cropped across', () => {
    // Two figures drawn touching across a cell boundary read as one
    // component: the count check fails explicitly instead of cropping.
    const im = sheetOf(2, 1, 48, [{ at: 0, size: 20 }, { at: 1, size: 20 }])
    fillRect(im, 30, 22, 34, 6, [180, 60, 40, 255]) // bridge figure 0 to figure 1
    expect(() => preparePack(fighter('neg-merged', 'mook', [{ name: 'walk', count: 2, rows: 1, cols: 2 }]), { walk: im }))
      .toThrow(/missing frames: walk expected 2, found 1 \(merged or absent drawings\)/)
  })

  it('figures may straddle nominal cell lines (accepted pack practice)', () => {
    // Boots dip past the nominal grid line: whole drawings are preserved
    // and assigned by centre, never cropped (extraction level).
    const im = sheetOf(2, 1, 48, [{ at: 0, size: 28, dx: 14 }, { at: 1, size: 28 }])
    const r = extractSequence(im, fighter('neg-straddle', 'mook', []), { name: 'walk', count: 2, rows: 1, cols: 2 })
    expect(r.frames.map((f) => f.cellIndex)).toEqual([0, 1])
  })

  it('overlapping figure bounds are a review hint, not an automatic failure', () => {
    // A long blade legitimately crosses into a neighbour's territory: the
    // bounds overlap while the drawings stay separate (ring vs inner square).
    const im = blank(200, 100)
    fillRect(im, 20, 10, 120, 80, [180, 60, 40, 255]) // ring outer
    fillRect(im, 26, 16, 108, 68, [0, 0, 0, 0]) // ring hole
    fillRect(im, 105, 30, 20, 20, [60, 120, 200, 255]) // separate figure inside the hole
    const r = extractSequence(im, fighter('neg-hint', 'mook', []), { name: 'walk', count: 2, rows: 1, cols: 2 })
    expect(r.frames).toHaveLength(2)
    expect(r.suspects.join(' ')).toContain('bounds overlap - review for merge')
  })

  it('clipped figures at the sheet edge', () => {
    const im = sheetOf(2, 1, 48, [{ at: 0, size: 20, dx: -20 }, { at: 1, size: 20 }])
    expect(() => preparePack(fighter('neg-clipped', 'mook', [{ name: 'walk', count: 2, rows: 1, cols: 2 }]), { walk: im }))
      .toThrow(/clipped figure/)
  })

  it('wrong order: a swapped sheet fails its pinned identities', () => {
    const good = sheetOf(3, 1, 48, [{ at: 0, size: 12 }, { at: 1, size: 18 }, { at: 2, size: 24 }])
    const seq: SequenceSpec = { name: 'walk', count: 3, rows: 1, cols: 3 }
    const ref = preparePack(fighter('neg-order', 'mook', [seq]), { walk: good })
    const identities: Record<number, string> = {}
    ref.frames.forEach((f, i) => { identities[i] = f.restoredSha256 })
    // A provider that draws the sequence out of order.
    const swapped = sheetOf(3, 1, 48, [{ at: 0, size: 24 }, { at: 1, size: 18 }, { at: 2, size: 12 }])
    expect(() => preparePack(fighter('neg-order', 'mook', [{ ...seq, identities }]), { walk: swapped }))
      .toThrow(/wrong order: walk:\d restored identity/)
    // An explicit order pointing at an empty cell is wrong order too.
    expect(() => preparePack(fighter('neg-order', 'mook', [{ ...seq, order: [0, 1, 5] }]), { walk: good }))
      .toThrow(/wrong order: walk\[2\] has no figure/)
  })

  it('residue: glow and specks are cleaned up, beyond tolerance they fail', () => {
    const im = blank(48, 48)
    fillRect(im, 12, 12, 24, 24, [200, 80, 40, 255]) // figure
    fillRect(im, 8, 8, 32, 32, [255, 255, 255, 40]) // halo ring around it
    fillRect(im, 2, 2, 3, 3, [255, 0, 0, 220]) // detached speck
    expect(() => cleanAlpha(im, { residueTolerancePx: 0 })).toThrow(/residue: \d+ halo\/speck pixels/)
    const cleaned = cleanAlpha(blank(48, 48), {})
    expect(cleaned.removedGlowPx).toBe(0)
    const im2 = blank(48, 48)
    fillRect(im2, 12, 12, 24, 24, [200, 80, 40, 255])
    fillRect(im2, 8, 8, 32, 32, [255, 255, 255, 40])
    fillRect(im2, 2, 2, 3, 3, [255, 0, 0, 220])
    const ok = cleanAlpha(im2, { residueTolerancePx: 10_000 })
    expect(ok.removedSpeckPx).toBe(9)
    expect(ok.removedGlowPx).toBeGreaterThan(0)
  })

  it('cleanup never eats near-black costume', () => {
    const im = blank(48, 48)
    const black: [number, number, number, number] = [10, 10, 10, 255]
    fillRect(im, 8, 8, 32, 32, [255, 255, 255, 40]) // glow under the figure
    fillRect(im, 12, 12, 24, 24, black) // opaque near-black costume on top
    const ok = cleanAlpha(im, { residueTolerancePx: 10_000 })
    expect(ok.components).toHaveLength(1)
    expect(ok.removedGlowPx).toBeGreaterThan(0)
    // Every opaque near-black pixel is byte-identical after cleanup.
    for (let y = 12; y < 36; y++) {
      for (let x = 12; x < 36; x++) {
        const k = (y * 48 + x) * 4
        expect([im.data[k], im.data[k + 1], im.data[k + 2], im.data[k + 3]]).toEqual(black)
      }
    }
  })

  it('trim errors', () => {
    // Content sits 1px inside its cell: content+pad leaves the cell rect.
    const im = sheetOf(1, 1, 48, [{ at: 0, size: 24, dx: -11 }])
    expect(() => preparePack(fighter('neg-trim', 'mook', [{ name: 'walk', count: 1, rows: 1, cols: 1 }]), { walk: im }))
      .toThrow(/trim error/)
  })

  it('budget violations: page limit and per-fighter decode cap', () => {
    const big = fighter('neg-budget', 'boss', [{ name: 'walk', count: 2, rows: 1, cols: 2 }])
    const frames = [
      { trim: { srcW: 3000, srcH: 3000, trimX: 0, trimY: 0, w: 3000, h: 3000 } },
      { trim: { srcW: 3000, srcH: 3000, trimX: 0, trimY: 0, w: 3000, h: 3000 } },
    ]
    const report = validateBudget(big, frames, [{ name: 'page1', width: PAGE_LIMIT + 1, height: 100 }])
    expect(report.errors.join(' ')).toContain('exceeds 2048px')
    expect(report.errors.join(' ')).toContain('per-fighter cap')
    expect(DECODED_CAP).toBe(16 * 1024 * 1024)
  })

  it('the orchestrator refuses a pack over the per-fighter decode cap', () => {
    // Two 2044px trimmed frames decode to ~33.5 MB: over the 16 MiB cap.
    expect(() => preparePack(fighter('neg-budget2', 'boss', [{ name: 'walk', count: 2, rows: 1, cols: 2 }], {
      box: { width: 2048, height: 2048, groundY: 2000 },
    }), { walk: sheetOf(2, 1, 2048, [{ at: 0, size: 2040 }, { at: 1, size: 2040 }]) })).toThrow(/per-fighter cap/)
  }, 30_000)
})

// ---------------------------------------------------------------------------
// 5-6. Reports: measured pixels, unverified unknowns, budget separation
// ---------------------------------------------------------------------------

describe('reports measure pixels and separate budgets', () => {
  it('unknown values stay unverified; measured values are numbers', () => {
    const f = fighter('rep-one', 'hero', [{ name: 'walk', count: 2, rows: 1, cols: 2 }])
    const pack = preparePack(f, { walk: sheetOf(2, 1, 48, [{ at: 0 }, { at: 1 }]) })
    expect(pack.report.ground).toBe('unverified')
    expect(pack.report.camera).toBe('unverified')
    expect(pack.report.landmarks).toBe('unverified')
    expect(pack.report.saddle).toBe('unverified')
    expect(pack.report.pivot).toEqual({ x: 24, y: 92 })
    const measured = buildReport(f, pack.frames, pack.pages, {
      groundErrorU: 0.6,
      landmarks: { weaponTipU: 'unverified', feetGroundU: 0.6 },
    })
    expect(measured.ground).toBe(0.6)
    expect(measured.landmarks).toEqual({ weaponTipU: 'unverified', feetGroundU: 0.6 })
  })

  it('distinguishes displayed unique drawings from unused/duplicate source cells', () => {
    const seq: SequenceSpec = { name: 'walk', count: 7, rows: 2, cols: 5 }
    // 10 cells: 5 distinct drawings + 2 duplicates + 3 empty cells.
    const im = sheetOf(5, 2, 48, [
      { at: 0, size: 12 }, { at: 1, size: 12 }, // duplicate pair (same pixels)
      { at: 2, size: 16 }, { at: 3, size: 20 }, { at: 4, size: 24 },
      { at: 5, size: 28 }, { at: 6, size: 28 }, // duplicate pair
    ])
    const pack = preparePack(fighter('rep-two', 'mook', [seq]), { walk: im })
    expect(pack.report.counts).toEqual({
      sourceCells: 10,
      displayedUniqueDrawings: 5,
      duplicateSourceCells: 2,
      unusedSourceCells: 3,
    })
    expect(pack.budget.clonedCanvasBytes).toBe(0) // shared-atlas display
    expect(pack.budget.gpuBytes).toBe(pack.budget.decodedBytes)
    expect(pack.budget.decodedBytes).toBeLessThanOrEqual(DECODED_CAP)
  })
})

// ---------------------------------------------------------------------------
// 5. Provenance completeness
// ---------------------------------------------------------------------------

describe('provenance records what was used', () => {
  const complete = {
    candidates: {
      walk1: {
        sha256: 'a'.repeat(64),
        prompt: 'exact 3x3 guide layout',
        references: ['walk-guide', 'walk1'],
        providerPreference: 'gpt-image',
        providerActual: 'undisclosed',
        verdict: 'accepted',
      },
    },
  }

  it('accepts a complete record and leaves unknown fields unverified', () => {
    const { errors, entries } = validateProvenance(complete, ['walk1'])
    expect(errors).toEqual([])
    expect(entries[0]).toMatchObject({ name: 'walk1', verdict: 'accepted', providerActual: 'undisclosed' })
    const partial = { candidates: { walk1: { sha256: 'a'.repeat(64) } } }
    const r = validateProvenance(partial, ['walk1'])
    expect(r.errors.join(' ')).toContain('missing prompt, references, providerPreference, providerActual, verdict')
    expect(r.entries[0]!.prompt).toBe('unverified')
  })

  it('fails when a used candidate has no record at all', () => {
    expect(validateProvenance(complete, ['ghost']).errors.join(' ')).toContain('has no record')
    expect(validateProvenance(undefined, ['walk1']).errors.join(' ')).toContain('has no record')
  })
})

// ---------------------------------------------------------------------------
// Deterministic file outputs land per fighter
// ---------------------------------------------------------------------------

describe('pack outputs', () => {
  it('writes pages, manifest and report under the fighter id only', () => {
    const root = tmpRoot()
    const opts = { sourceRoot: join(root, 'src'), outputRoot: join(root, 'out') }
    const f = fighter('writer-one', 'mook', [{ name: 'walk', count: 2, rows: 1, cols: 2 }])
    const pack = preparePack(f, { walk: sheetOf(2, 1, 48, [{ at: 0 }, { at: 1 }]) })
    writePackOutputs(f, pack, opts)
    const paths = fighterPaths('writer-one', opts)
    expect(existsSync(join(paths.output, 'manifest.json'))).toBe(true)
    expect(existsSync(join(paths.output, 'report.json'))).toBe(true)
    expect(existsSync(join(paths.pages, `${pack.pages[0]!.name}.png`))).toBe(true)
    const manifest = JSON.parse(readFileSync(join(paths.output, 'manifest.json'), 'utf8')) as { frames: unknown[] }
    expect(manifest.frames).toHaveLength(2)
  })
})
