// CMR-04: generic fighter-parameterized motion preparation toolkit.
//
// Replaces the Guan Yu-hardcoded paths and "pick the nine largest components"
// heuristics of the pilot scripts with a spec-driven pipeline:
//
//   ordered source sheets -> validated figure extraction -> alpha-only
//   cleanup -> trim/dedup -> <=2048 page packing -> restored-pixel + pivot
//   hashes -> budget/provenance reports
//
// Rules baked in:
// - The fighter id selects separated source/output directories; a write can
//   never land in another fighter's tree.
// - Frame counts are PER SEQUENCE and explicit (variable across fighters and
//   sequences); there is no fixed 9-cell/90-frame assumption.
// - Order is explicit (`order` permutation and/or per-position identity
//   hashes); a swapped, missing, merged or clipped figure fails loudly
//   instead of being cropped across.
// - Cleanup keys on ALPHA and connectivity only: low-alpha halos, glow and
//   detached specks go, but an opaque near-black costume pixel is never
//   eaten just because it is dark.
// - Fixed scale/registration: every frame carries its untrimmed source size,
//   trim offset and pivot; no per-pose silhouette normalisation, no warps.
// - Deterministic: the same images and config produce the same frame pixels,
//   pages and metadata (hashes computed over restored pixels, not PNG bytes).
//
// Missing image/provider capability is a blocker elsewhere; nothing here
// calls an image tool or generates artwork.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createCanvas } from '@napi-rs/canvas'

export const PAGE_LIMIT = 2048
export const DECODED_CAP = 16 * 1024 * 1024
export const RETAINED_CAP = 128 * 1024 * 1024
export const STAGE_DOWNLOAD_CAP = 12 * 1024 * 1024
/** Contract density: art pixels per logical unit. */
export const DENSITY = 2
/** Trim padding (transparent), matching the accepted Guan Yu repack. */
export const TRIM_PAD = 2

const FIGHTER_ID = /^[a-z][a-z0-9-]*$/

// ---------------------------------------------------------------------------
// Fighter identity and separated directories
// ---------------------------------------------------------------------------

/**
 * Source/output directories for one fighter. Ids are validated and the paths
 * are strictly `.../<id>` so two fighters can never share a directory.
 */
export function fighterPaths(id, { sourceRoot = 'art/motion', outputRoot = 'artifacts/motion' } = {}) {
  if (typeof id !== 'string' || !FIGHTER_ID.test(id)) {
    throw new Error(`fighter id must match ${FIGHTER_ID}: ${JSON.stringify(id)}`)
  }
  return {
    id,
    source: join(sourceRoot, id),
    output: join(outputRoot, id),
    pages: join(outputRoot, id, 'pages'),
    report: join(outputRoot, id, 'report.json'),
  }
}

/** Refuse any write that would escape this fighter's own output directory. */
export function assertOwnOutput(id, path, opts) {
  const { output } = fighterPaths(id, opts)
  const normalized = path.replaceAll('\\', '/')
  const base = output.replaceAll('\\', '/')
  if (normalized !== base && !normalized.startsWith(`${base}/`)) {
    throw new Error(`fighter ${id}: refusing to write outside ${base}: ${path}`)
  }
  return path
}

// ---------------------------------------------------------------------------
// Figure extraction with explicit order/bounds validation
// ---------------------------------------------------------------------------

/** Alpha-connected components (8-way), with bounds and pixel indices. */
export function alphaComponents(im, alphaThreshold = 96) {
  const { width: w, height: h, data } = im
  const seen = new Uint8Array(w * h)
  const out = []
  for (let p = 0; p < seen.length; p++) {
    if (seen[p] || data[p * 4 + 3] < alphaThreshold) continue
    seen[p] = 1
    const stack = [p]
    const c = { area: 0, x0: w, y0: h, x1: -1, y1: -1, pixels: [] }
    while (stack.length) {
      const q = stack.pop()
      const x = q % w, y = Math.floor(q / w)
      c.area++
      c.pixels.push(q)
      if (x < c.x0) c.x0 = x
      if (x > c.x1) c.x1 = x
      if (y < c.y0) c.y0 = y
      if (y > c.y1) c.y1 = y
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]]) {
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
        const r = ny * w + nx
        if (!seen[r] && data[r * 4 + 3] >= alphaThreshold) {
          seen[r] = 1
          stack.push(r)
        }
      }
    }
    out.push(c)
  }
  return out
}

/**
 * Alpha-only cleanup: drop low-alpha halo/glow pixels and detached specks.
 * Never inspects RGB - an opaque near-black costume pixel survives byte-exact
 * because cleanup never eats pixels for being dark, only for being alpha
 * residue or a detached speck.
 */
export function cleanAlpha(im, { alphaThreshold = 96, speckMaxPx = 64, residueTolerancePx = Infinity } = {}) {
  const { width: w, height: h, data } = im
  const comps = alphaComponents(im, alphaThreshold)
  const keep = new Uint8Array(w * h)
  const survivors = []
  let removedSpecks = 0
  for (const c of comps) {
    if (c.area <= speckMaxPx) {
      removedSpecks += c.area
      continue
    }
    survivors.push(c)
    for (const p of c.pixels) keep[p] = 1
  }
  let removedGlow = 0
  for (let p = 0; p < w * h; p++) {
    if (data[p * 4 + 3] > 0 && !keep[p]) {
      data[p * 4 + 3] = 0
      removedGlow++
    }
  }
  const removed = removedGlow + removedSpecks
  if (removed > residueTolerancePx) {
    throw new Error(`residue: ${removed} halo/speck pixels exceed the ${residueTolerancePx} tolerance`)
  }
  return { components: survivors, removedGlowPx: removedGlow, removedSpeckPx: removedSpecks }
}

/**
 * Extract one sequence's figures from one sheet. The expected count is
 * explicit; assignment is row-major unless `order` gives an explicit cell
 * permutation (pinned `identities` then validate the drawn order).
 */
export function extractSequence(im, fighter, sequence) {
  const { rows, cols, count, name } = sequence
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows * cols < count) {
    throw new Error(`${name}: grid ${rows}x${cols} cannot hold ${count} frames`)
  }
  const cleaned = cleanAlpha(im, fighter.cleanup)
  const comps = cleaned.components
  const cellW = Math.floor(im.width / cols)
  const cellH = Math.floor(im.height / rows)

  const cellOf = (c) => {
    const cx = Math.floor((c.x0 + c.x1 + 1) / 2 / cellW)
    const cy = Math.floor((c.y0 + c.y1 + 1) / 2 / cellH)
    return { cx: Math.min(cx, cols - 1), cy: Math.min(cy, rows - 1) }
  }

  // Figures MAY straddle nominal grid lines - accepted packs preserve whole
  // drawings across boundaries (boots dip past the nominal line; wide swings
  // cross into neighbouring territory). What FAILS is a figure cut by the
  // sheet edge or a merged drawing. Merges are caught by the component count
  // (two figures fused = one component); overlapping bounds are only a
  // SUSPECT hint for the reviewer, because a long blade legitimately
  // overlaps a neighbour's bounds without touching it.
  const suspects = []
  for (const c of comps) {
    const touchesEdge = c.x0 <= 0 || c.y0 <= 0 || c.x1 >= im.width - 1 || c.y1 >= im.height - 1
    if (touchesEdge) {
      throw new Error(`${name}: clipped figure (touches the sheet edge)`)
    }
  }
  for (let i = 0; i < comps.length; i++) {
    for (let j = i + 1; j < comps.length; j++) {
      const a = comps[i], b = comps[j]
      if (a.x0 <= b.x1 && a.x1 >= b.x0 && a.y0 <= b.y1 && a.y1 >= b.y0) {
        suspects.push(`${name}: figures ${i}/${j} bounds overlap - review for merge`)
      }
    }
  }

  if (comps.length < count) {
    throw new Error(`missing frames: ${name} expected ${count}, found ${comps.length} (merged or absent drawings)`)
  }
  if (comps.length > count) {
    throw new Error(`extra frames: ${name} expected ${count}, found ${comps.length} (unplanned drawings or residue)`)
  }

  // Explicit order: `order[i]` names the sheet cell (row-major index) that
  // provides drawing i. Without it the natural row-major order is used.
  const order = sequence.order ?? Array.from({ length: count }, (_, i) => i)
  if (order.length !== count || new Set(order).size !== count) {
    throw new Error(`${name}: order must be a permutation of ${count} positions`)
  }
  const byCell = new Map()
  for (const c of comps) {
    const { cx, cy } = cellOf(c)
    const idx = cy * cols + cx
    if (byCell.has(idx)) throw new Error(`${name}: two figures in cell ${idx} (merged sheet)`)
    byCell.set(idx, c)
  }
  const frames = []
  for (let i = 0; i < count; i++) {
    const cellIndex = order[i]
    const c = byCell.get(cellIndex)
    if (!c) throw new Error(`wrong order: ${name}[${i}] has no figure in declared cell ${cellIndex}`)
    frames.push({
      name: `${name}:${i}`,
      position: i,
      cellIndex,
      cell: { x: (cellIndex % cols) * cellW, y: Math.floor(cellIndex / cols) * cellH, w: cellW, h: cellH },
      content: { x: c.x0, y: c.y0, w: c.x1 - c.x0 + 1, h: c.y1 - c.y0 + 1 },
    })
  }
  return { frames, cleaned, suspects }
}

// ---------------------------------------------------------------------------
// Trim, dedup, packing and hashing
// ---------------------------------------------------------------------------

/** Trim descriptor for one figure: full cell, content rect + pad inside it. */
export function trimCell(frame) {
  const sw = frame.cell.w, sh = frame.cell.h
  const x = Math.round(frame.content.x - frame.cell.x) - TRIM_PAD
  const y = Math.round(frame.content.y - frame.cell.y) - TRIM_PAD
  const w = Math.round(frame.content.w) + TRIM_PAD * 2
  const h = Math.round(frame.content.h) + TRIM_PAD * 2
  if (x < 0 || y < 0 || x + w > sw || y + h > sh) {
    throw new Error(`trim error: ${frame.name} content+pad (${x},${y} ${w}x${h}) leaves the ${sw}x${sh} cell`)
  }
  return { srcW: sw, srcH: sh, trimX: x, trimY: y, w, h }
}

/**
 * Registration fit: ONE uniform scale per sheet (never per-pose) plus a
 * recorded per-frame translation. Horizontal: the drawing lands centred in
 * the canonical box (translation only - the accepted "one scale per sheet
 * with translations" model). Vertical: the figure's ground contact lands on
 * the box's ground line. No silhouette-driven rescaling ever.
 */
export function fitOf(frame, registration, box) {
  const scale = registration.scale ?? 1
  const groundPx = box.groundY * DENSITY
  const targetCx = (box.width * DENSITY) / 2
  return {
    scale,
    tx: targetCx - scale * (frame.content.w / 2) - scale * (frame.content.x - frame.cell.x),
    ty: groundPx - scale * (frame.content.y - frame.cell.y + frame.content.h),
  }
}

/** Map a sheet-space content rect into the canonical box through a fit. */
export function fitContent(frame, fit) {
  return {
    x: fit.scale * (frame.content.x - frame.cell.x) + fit.tx,
    y: fit.scale * (frame.content.y - frame.cell.y) + fit.ty,
    w: fit.scale * frame.content.w,
    h: fit.scale * frame.content.h,
  }
}

/** Pivot in full-cell pixels: fixed registration, never silhouette-driven. */
export function pivotOf(trim, fighter) {
  return { x: trim.srcW / 2, y: fighter.box.groundY * fighter.density }
}

/**
 * Display-equivalent restore: the trimmed rect placed at its trim offset in
 * the untrimmed full cell (identical placement to the shared-atlas display).
 * `frame.src` is the sheet-space content rect when a registration fit is
 * applied; without a fit (scale 1) this is a pure pixel copy, so the hash
 * measures the bytes the display actually shows.
 */
export function restoreCellPixels(im, frame, trim, fit) {
  const src = frame.src ?? frame.content
  if (fit && fit.scale !== 1) {
    const from = createCanvas(im.width, im.height)
    const fg = from.getContext('2d')
    const id = fg.createImageData(im.width, im.height)
    id.data.set(im.data)
    fg.putImageData(id, 0, 0)
    const rt = createCanvas(trim.srcW, trim.srcH)
    const g = rt.getContext('2d')
    g.drawImage(from, src.x - TRIM_PAD, src.y - TRIM_PAD, src.w + TRIM_PAD * 2, src.h + TRIM_PAD * 2, trim.trimX, trim.trimY, trim.w, trim.h)
    return g.getImageData(0, 0, trim.srcW, trim.srcH).data
  }
  const out = new Uint8ClampedArray(trim.srcW * trim.srcH * 4)
  for (let y = 0; y < trim.h; y++) {
    for (let x = 0; x < trim.w; x++) {
      const sx = src.x - TRIM_PAD + x
      const sy = src.y - TRIM_PAD + y
      const dx = trim.trimX + x
      const dy = trim.trimY + y
      if (dx < 0 || dy < 0 || dx >= trim.srcW || dy >= trim.srcH) continue
      const o = (dy * trim.srcW + dx) * 4
      const inside = sx >= 0 && sy >= 0 && sx < im.width && sy < im.height
      const k = (sy * im.width + sx) * 4
      out[o] = inside ? im.data[k] : 0
      out[o + 1] = inside ? im.data[k + 1] : 0
      out[o + 2] = inside ? im.data[k + 2] : 0
      out[o + 3] = inside ? im.data[k + 3] : 0
    }
  }
  return out
}

/** sha256 of a figure restored into its untrimmed full cell (display pixels). */
export function restoredHash(im, frame, trim, fit) {
  return createHash('sha256').update(Buffer.from(restoreCellPixels(im, frame, trim, fit))).digest('hex')
}

/** Position-invariant content hash (dedup key): the trimmed content pixels. */
export function contentHash(im, frame, trim, fit) {
  const restored = restoreCellPixels(im, frame, trim, fit)
  const out = Buffer.alloc(trim.w * trim.h * 4)
  let o = 0
  for (let y = 0; y < trim.h; y++) {
    for (let x = 0; x < trim.w; x++) {
      const k = ((trim.trimY + y) * trim.srcW + (trim.trimX + x)) * 4
      out[o] = restored[k]
      out[o + 1] = restored[k + 1]
      out[o + 2] = restored[k + 2]
      out[o + 3] = restored[k + 3]
      o += 4
    }
  }
  return createHash('sha256').update(out).digest('hex')
}

/**
 * Shelf-pack trimmed rects into named pages (deterministic: first-occurrence
 * order of the frames list). Returns pages with composed pixel buffers.
 */
export function packFrames(items, { pageLimit = PAGE_LIMIT, pagePrefix = 'page' } = {}) {
  const pages = []
  let page = null
  let x = 0, y = 0, shelfH = 0
  const newPage = () => {
    page = { name: `${pagePrefix}${pages.length + 1}`, items: [] }
    pages.push(page)
    x = 0; y = 0; shelfH = 0
  }
  for (const item of items) {
    const { w, h } = item.trim
    if (w > pageLimit || h > pageLimit) {
      throw new Error(`budget: ${item.frame.name} trimmed ${w}x${h} exceeds the ${pageLimit}px page limit`)
    }
    if (!page) newPage()
    if (x + w > pageLimit) {
      y += shelfH
      x = 0
      shelfH = 0
    }
    if (y + h > pageLimit) newPage()
    if (x + w > pageLimit) {
      throw new Error(`budget: ${item.frame.name} cannot fit page ${page.name}`)
    }
    page.items.push({ ...item, x, y })
    x += w
    if (h > shelfH) shelfH = h
  }
  for (const p of pages) {
    let maxX = 0, maxY = 0
    for (const it of p.items) {
      maxX = Math.max(maxX, it.x + it.trim.w)
      maxY = Math.max(maxY, it.y + it.trim.h)
    }
    p.width = maxX
    p.height = maxY
    if (p.width > pageLimit || p.height > pageLimit) {
      throw new Error(`budget: page ${p.name} is ${p.width}x${p.height}, over the ${pageLimit}px limit`)
    }
    const cv = createCanvas(p.width, p.height)
    const g = cv.getContext('2d')
    for (const it of p.items) {
      const id = g.createImageData(it.trim.w, it.trim.h)
      let o = 0
      for (let yy = 0; yy < it.trim.h; yy++) {
        for (let xx = 0; xx < it.trim.w; xx++) {
          const sx = it.frame.content.x - TRIM_PAD + xx
          const sy = it.frame.content.y - TRIM_PAD + yy
          const inside = sx >= 0 && sy >= 0 && sx < it.source.width && sy < it.source.height
          const k = (sy * it.source.width + sx) * 4
          id.data[o] = inside ? it.source.data[k] : 0
          id.data[o + 1] = inside ? it.source.data[k + 1] : 0
          id.data[o + 2] = inside ? it.source.data[k + 2] : 0
          id.data[o + 3] = inside ? it.source.data[k + 3] : 0
          o += 4
        }
      }
      g.putImageData(id, it.x, it.y)
    }
    p.pixels = g.getImageData(0, 0, p.width, p.height)
  }
  return pages
}

// ---------------------------------------------------------------------------
// Budgets and reports
// ---------------------------------------------------------------------------

export function validateBudget(fighter, frames, pages) {
  const errors = []
  if (fighter.density !== DENSITY) errors.push(`${fighter.id}: density ${fighter.density} must be ${DENSITY}`)
  const decoded = frames.reduce((a, f) => a + f.trim.w * f.trim.h * 4, 0)
  if (decoded > DECODED_CAP) errors.push(`${fighter.id}: decoded ${decoded} exceeds the ${DECODED_CAP} per-fighter cap`)
  for (const p of pages) {
    if (p.width > PAGE_LIMIT || p.height > PAGE_LIMIT) {
      errors.push(`${fighter.id}: page ${p.name} ${p.width}x${p.height} exceeds ${PAGE_LIMIT}px`)
    }
  }
  // Shared-atlas display: one GPU upload per page, zero cloned canvases.
  return { errors, decodedBytes: decoded, gpuBytes: decoded, clonedCanvasBytes: 0, networkBytes: 0 }
}

/**
 * Ground/pivot/identity/landmark report: measured values come from pixels;
 * anything the pipeline cannot measure is literally `unverified`.
 */
export function buildReport(fighter, frames, pages, extra = {}) {
  return {
    fighter: fighter.id,
    role: fighter.role,
    density: fighter.density,
    box: { ...fighter.box },
    camera: extra.camera ?? 'unverified',
    ground: extra.groundErrorU ?? 'unverified',
    saddle: fighter.saddleY === undefined ? 'unverified' : fighter.saddleY,
    pivot: frames[0] ? { ...frames[0].pivot } : 'unverified',
    identity: frames.map((f) => ({ name: f.name, restoredSha256: f.restoredSha256, pinned: f.identityPinned === true })),
    landmarks: extra.landmarks ?? 'unverified',
    suspects: extra.suspects ?? [],
    counts: {
      sourceCells: extra.sourceCells ?? frames.length,
      displayedUniqueDrawings: extra.displayedUniqueDrawings ?? frames.length,
      duplicateSourceCells: extra.duplicateSourceCells ?? 0,
      unusedSourceCells: extra.unusedSourceCells ?? 0,
    },
    budgets: extra.budgets ?? {},
    pages: pages.map((p) => ({ name: p.name, width: p.width, height: p.height })),
  }
}

/**
 * Provenance completeness for USED candidates. Unknown values stay
 * `unverified`; a used candidate without prompt/provider/verdict is a hard
 * error so silent substitutions cannot slip through.
 */
export function validateProvenance(record, usedCandidates) {
  const errors = []
  const entries = []
  for (const name of usedCandidates) {
    const c = record?.candidates?.[name]
    if (!c) {
      errors.push(`provenance: used candidate ${name} has no record`)
      continue
    }
    const missing = ['sha256', 'prompt', 'references', 'providerPreference', 'providerActual', 'verdict']
      .filter((k) => c[k] === undefined || c[k] === null || c[k] === '')
    if (missing.length > 0) errors.push(`provenance: ${name} missing ${missing.join(', ')}`)
    entries.push({
      name,
      sha256: c.sha256 ?? 'unverified',
      prompt: c.prompt ?? 'unverified',
      references: c.references ?? 'unverified',
      providerPreference: c.providerPreference ?? 'unverified',
      providerActual: c.providerActual ?? 'unverified',
      verdict: c.verdict ?? 'unverified',
    })
  }
  return { errors, entries }
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Prepare one fighter's pack from per-sequence sheet images (ImageData-like).
 * Deterministic in and out: the same images/spec give identical frame hashes,
 * page pixels and manifest bytes.
 */
export function preparePack(fighter, sheets) {
  const sequences = fighter.sequences ?? []
  const frames = []
  let sourceCells = 0
  let duplicateCount = 0
  let unused = 0
  const seenContent = new Set()
  const suspects = []
  let aliasedCells = 0
  const extractedBySeq = new Map()
  for (const seq of sequences) {
    const im = sheets[seq.name]
    if (!im) throw new Error(`${fighter.id}: missing sheet for sequence ${seq.name}`)
    const extracted = extractSequence(im, fighter, seq)
    suspects.push(...extracted.suspects)
    sourceCells += seq.rows * seq.cols
    unused += seq.rows * seq.cols - seq.count
    extractedBySeq.set(seq.name, { im, extracted })
  }
  const builtByName = new Map()
  const aliasOf = (seq, pos) => (seq.alias ? seq.alias[pos] : undefined)
  for (const seq of sequences) {
    const { im, extracted } = extractedBySeq.get(seq.name)
    const boxCell = { x: 0, y: 0, w: fighter.box.width * DENSITY, h: fighter.box.height * DENSITY }
    // Non-aliased positions first so shared bookends can alias them.
    const ordered = [...extracted.frames].sort((a, b) => Number(aliasOf(seq, a.position) !== undefined) - Number(aliasOf(seq, b.position) !== undefined))
    for (const frame of ordered) {
      const name = `${seq.name}:${frame.position}`
      const aliasPos = aliasOf(seq, frame.position)
      if (aliasPos !== undefined) {
        // Shared-bookend enforcement: the alias position draws the target's
        // pixels exactly; its own sheet drawing counts as an unused source
        // cell rather than a subtly different "shared" pose.
        const targetName = typeof aliasPos === 'number' ? `${seq.name}:${aliasPos}` : aliasPos
        const target = builtByName.get(targetName)
        if (!target) throw new Error(`${seq.name}: alias target ${targetName} not built`)
        if (seenContent.has(target.contentSha256)) duplicateCount++
        seenContent.add(target.contentSha256)
        builtByName.set(name, { ...target, name, position: frame.position, cellIndex: frame.cellIndex })
        frames.push({ ...target, name, position: frame.position, cellIndex: frame.cellIndex })
        aliasedCells++
        continue
      }
      const fit = seq.registration ? fitOf(frame, seq.registration, fighter.box) : undefined
      const fitted = fit
        ? { ...frame, cell: boxCell, content: fitContent(frame, fit), src: frame.content, fit }
        : frame
      const trim = trimCell(fitted)
      const pivot = pivotOf(trim, fighter)
      const restoredSha256 = restoredHash(im, fitted, trim, fit)
      const contentSha256 = contentHash(im, fitted, trim, fit)
      const pinned = seq.identities ? seq.identities[fitted.position] : undefined
      if (pinned !== undefined && pinned !== restoredSha256) {
        throw new Error(`wrong order: ${name} restored identity ${restoredSha256} != pinned ${pinned}`)
      }
      if (seenContent.has(contentSha256)) duplicateCount++
      seenContent.add(contentSha256)
      const built = { ...fitted, name, trim, pivot, restoredSha256, contentSha256, source: im, identityPinned: seq.identities ? true : undefined }
      builtByName.set(name, built)
      frames.push(built)
    }
  }
  const packed = packFrames(frames.map((frame) => ({ frame, trim: frame.trim, source: frame.source })), { pagePrefix: `${fighter.id}-` })
  const budget = validateBudget(fighter, frames, packed)
  if (budget.errors.length > 0) throw new Error(`budget: ${budget.errors.join('; ')}`)
  const manifest = {
    id: fighter.id,
    revision: fighter.revision ?? 'motion-1',
    role: fighter.role,
    density: fighter.density,
    box: fighter.box,
    frames: frames.map((f) => ({
      name: f.name,
      trim: f.trim,
      pivot: f.pivot,
      restoredSha256: f.restoredSha256,
      contentSha256: f.contentSha256,
    })),
    pages: packed.map((p) => ({ name: p.name, width: p.width, height: p.height })),
  }
  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`
  const report = buildReport(fighter, frames, packed, {
    sourceCells,
    displayedUniqueDrawings: seenContent.size,
    duplicateSourceCells: duplicateCount,
    unusedSourceCells: unused + aliasedCells,
    suspects,
    budgets: budget,
  })
  return {
    frames,
    pages: packed,
    manifest,
    manifestJson,
    manifestSha256: createHash('sha256').update(manifestJson).digest('hex'),
    report,
    budget,
  }
}

/** Write one pack's outputs, strictly inside the fighter's own directory. */
export function writePackOutputs(fighter, pack, opts) {
  const paths = fighterPaths(fighter.id, opts)
  mkdirSync(paths.pages, { recursive: true })
  writeFileSync(assertOwnOutput(fighter.id, paths.report, opts), `${JSON.stringify(pack.report, null, 2)}\n`)
  writeFileSync(assertOwnOutput(fighter.id, join(paths.output, 'manifest.json'), opts), pack.manifestJson)
  for (const page of pack.pages) {
    const cv = createCanvas(page.width, page.height)
    cv.getContext('2d').putImageData(page.pixels, 0, 0)
    writeFileSync(assertOwnOutput(fighter.id, join(paths.pages, `${page.name}.png`), opts), cv.toBuffer('image/png'))
  }
  return paths
}

/** Files a fighter's output directory currently holds. */
export function listFighterOutputs(id, opts) {
  const paths = fighterPaths(id, opts)
  return existsSync(paths.output)
    ? readdirSync(paths.output).filter((f) => statSync(join(paths.output, f)).isFile()).sort()
    : []
}
