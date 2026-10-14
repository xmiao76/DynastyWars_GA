// CMR-05: capture/review core for the ACTUAL whole-character motion path.
//
// The legacy review capture drives default art and rig anatomy; this core
// validates evidence produced from the opt-in runtime path itself: actual
// decoded/drawn frame keys, per-tick traces, player/AI/projectile
// provenance, named actions, both facings, Canvas/WebGL, and paced
// recordings. Pure functions only - the runner and the e2e capture feed it.
//
// Hard rules:
// - A cell nobody captured is `unseen`, never `natural`.
// - Null/unseen landmarks cannot pass.
// - Negative controls reject unknown frames, old/new texture mixing,
//   blank/missing packs, residue over tolerance, missing bindings, stale
//   provenance and clock defects - each with its own explicit error.

// ---------------------------------------------------------------------------
// Role capabilities and action coverage
// ---------------------------------------------------------------------------

/** What each role must make observable BEFORE its first integration. */
export const ROLE_CAPABILITIES = {
  hero: ['isolated', 'mixed', 'held', 'thrown', 'recovery', 'ko', 'revive', 'coop', 'interruptions'],
  shooter: ['isolated', 'mixed', 'projectile', 'held', 'thrown', 'recovery', 'ko', 'coop', 'interruptions'],
  boss: ['isolated', 'mixed', 'charge', 'enrage', 'held', 'thrown', 'recovery', 'ko', 'interruptions'],
  mook: ['isolated', 'mixed', 'held', 'thrown', 'recovery', 'ko', 'interruptions'],
}

export const HERO_ACTIONS = [
  'idle', 'walk', 'stop', 'jab1', 'jab2', 'finisher', 'jump', 'jumpkick', 'hurt',
  'knockdown', 'getup', 'special', 'grab', 'release', 'dying', 'dead', 'revive',
]

export const ENEMY_ACTIONS = [
  'idle', 'walk', 'approach', 'retreat', 'hitstun', 'fall', 'down', 'getup',
  'held', 'thrown', 'dying', 'dead',
]

export function actionsForRole(role) {
  if (role === 'hero') return [...HERO_ACTIONS]
  return [...ENEMY_ACTIONS]
}

// ---------------------------------------------------------------------------
// Trace validation (the negative controls)
// ---------------------------------------------------------------------------

const MOTION_KEY = /^entity:[a-z0-9-]+:motion:(.+)$/

function isMotionKey(key) {
  return MOTION_KEY.test(key ?? '')
}

function frameOf(key) {
  const m = MOTION_KEY.exec(key ?? '')
  return m ? m[1] : undefined
}

/**
 * Validate one capture's rows against the pack, bindings and provenance.
 * Every failure names its class; passing means no defect of these classes
 * was found - never that an unseen pose is natural. Clock continuity is
 * per actor and texture mixing is per fighter, so co-op rows from two
 * fighters never false-positive.
 */
export function validateTrace(rows, opts = {}) {
  const errors = []
  const pack = opts.pack
  const bindings = opts.bindings ?? {}
  const claimsMotion = opts.claimsMotion !== false

  if (!Array.isArray(rows) || rows.length === 0) {
    errors.push('blank pack: the capture contains no trace rows')
    return { errors, checked: { rows: 0, motionRows: 0, legacyRows: 0 } }
  }

  let motionRows = 0
  let legacyRows = 0
  const lastByActor = new Map()
  const byKind = new Map()
  for (const [i, row] of rows.entries()) {
    const kind = row.kind ?? 'unknown'
    const counts = byKind.get(kind) ?? { motion: 0, legacy: 0 }
    // Stale provenance: rows must come from the capture they claim.
    if (opts.expectedCommit && row.commit && row.commit !== opts.expectedCommit) {
      errors.push(`stale provenance: row ${i} commit ${row.commit} != ${opts.expectedCommit}`)
    }
    if (isMotionKey(row.key)) {
      motionRows += 1
      counts.motion += 1
      // Unknown frames: the key must name a real packed frame.
      const frame = frameOf(row.key)
      if (pack && (!pack.frames || pack.frames[frame] === undefined)) {
        errors.push(`unknown frame: row ${i} key ${row.key} is not in the pack`)
      }
    } else {
      legacyRows += 1
      counts.legacy += 1
    }
    byKind.set(kind, counts)
    // Missing bindings: an observed attack must have a clip binding.
    if (row.attackId && bindings && Object.keys(bindings).length > 0 && bindings[row.attackId] === undefined) {
      errors.push(`missing binding: row ${i} attack ${row.attackId} has no clip binding`)
    }
    // Clock defects: per actor, sim tick and stateTick never walk backwards
    // outside freeze/pause; wall pacing never goes negative.
    const prev = lastByActor.get(row.actor ?? 'unknown')
    if (prev && !row.frozen && !row.paused) {
      if (row.tick < prev.tick) errors.push(`clock defect: sim tick regressed at row ${i} (${prev.tick} -> ${row.tick})`)
      if (row.state === prev.state && row.stateTick < prev.stateTick) {
        errors.push(`clock defect: stateTick regressed at row ${i} (${prev.stateTick} -> ${row.stateTick})`)
      }
      if (row.elapsedMs !== undefined && prev.elapsedMs !== undefined && row.elapsedMs < prev.elapsedMs) {
        errors.push(`clock defect: elapsedMs regressed at row ${i}`)
      }
    }
    if (!row.frozen && !row.paused) lastByActor.set(row.actor ?? 'unknown', row)
  }

  // Old/new texture mixing: ONE fighter never shows motion and legacy art in
  // the same capture - publication is whole-fighter or nothing.
  for (const [kind, counts] of byKind) {
    if (counts.motion > 0 && counts.legacy > 0) {
      errors.push(`old/new texture mixing: ${kind} shows ${counts.motion} motion and ${counts.legacy} legacy rows`)
    }
  }
  const subject = opts.subjectKind ?? rows[0]?.kind ?? 'unknown'
  const subjectCounts = byKind.get(subject) ?? { motion: 0, legacy: 0 }
  if (claimsMotion && subjectCounts.motion === 0) {
    errors.push(`blank pack: capture claims motion for ${subject} but shows only legacy keys`)
  }
  if (!claimsMotion && subjectCounts.motion > 0) {
    errors.push(`old/new texture mixing: capture claims legacy for ${subject} but shows motion keys`)
  }

  // Residue: the preparation report's cleanup counts must be in tolerance.
  if (typeof opts.removedResiduePx === 'number' && typeof opts.residueTolerancePx === 'number'
      && opts.removedResiduePx > opts.residueTolerancePx) {
    errors.push(`residue: ${opts.removedResiduePx} cleaned pixels exceed the ${opts.residueTolerancePx} tolerance`)
  }

  return { errors, checked: { rows: rows.length, motionRows, legacyRows } }
}

// ---------------------------------------------------------------------------
// Coverage: unseen is not natural
// ---------------------------------------------------------------------------

/**
 * Coverage matrix over action x facing x renderer. A cell with no captured
 * rows is `unseen` - it can never be graded `natural` (N).
 */
export function coverageMatrix(rows, { actions = [], facings = ['right', 'left'], renderers = ['canvas'], injected = [] } = {}) {
  const cells = []
  for (const action of actions) {
    for (const facing of facings) {
      for (const renderer of renderers) {
        const hit = rows.some((r) => r.action === action && r.facing === facing && r.renderer === renderer)
        const wasInjected = injected.includes(action)
        cells.push({ action, facing, renderer, status: hit ? 'captured' : 'unseen', source: wasInjected ? 'injected' : 'gameplay' })
      }
    }
  }
  return cells
}

/** An index may never grade an unseen cell natural. */
export function assertIndexIntegrity(index) {
  const errors = []
  for (const cell of index.coverage ?? []) {
    if (cell.status === 'unseen' && (cell.grade === 'N' || cell.grade === 'natural')) {
      errors.push(`unseen pose labelled natural: ${cell.action}/${cell.facing}/${cell.renderer}`)
    }
    if (cell.status === 'unseen' && cell.grade !== undefined && cell.grade !== 'unseen') {
      errors.push(`unseen pose graded ${cell.grade}: ${cell.action}/${cell.facing}/${cell.renderer}`)
    }
  }
  for (const [name, value] of Object.entries(index.landmarks ?? {})) {
    if (value === null || value === undefined || value === 'unverified') {
      errors.push(`unseen landmark cannot pass: ${name}`)
    }
  }
  return errors
}

// ---------------------------------------------------------------------------
// Pacing and resource reports
// ---------------------------------------------------------------------------

function median(xs) {
  const s = [...xs].sort((a, b) => a - b)
  return s.length === 0 ? 0 : s[Math.floor(s.length / 2)]
}

/**
 * Pacing report: wall ms per sim tick per action. Reports what was measured
 * and states the inspection limitation instead of implying normal-speed
 * playback evidence.
 */
export function pacingReport(rows, { limitation } = {}) {
  const byAction = new Map()
  for (const row of rows) {
    if (row.elapsedMs === undefined || row.tick === undefined) continue
    const list = byAction.get(row.action ?? 'unknown') ?? []
    list.push(row)
    byAction.set(row.action ?? 'unknown', list)
  }
  const actions = {}
  for (const [action, list] of byAction) {
    const deltas = []
    for (let i = 1; i < list.length; i++) {
      const dt = list[i].elapsedMs - list[i - 1].elapsedMs
      const dticks = list[i].tick - list[i - 1].tick
      if (dticks > 0) deltas.push(dt / dticks)
    }
    actions[action] = {
      samples: list.length,
      msPerTickMedian: Math.round(median(deltas) * 100) / 100,
      msPerTickMax: deltas.length > 0 ? Math.round(Math.max(...deltas) * 100) / 100 : 0,
    }
  }
  return {
    actions,
    playbackPace: 'sim-timed; wall pacing measured per tick, never assumed',
    limitations: [
      limitation ?? 'headless WebGL capture pace is NOT normal-speed playback evidence',
      'videos are owner-playable evidence; wall pacing is reported, not smoothed',
    ],
  }
}

/** Resource report in the CMR-03 budget vocabulary, with caps kept separate. */
export function resourceReport(budget = {}) {
  const caps = budget.caps ?? {
    pageLimit: 2048,
    decodedPerFighter: 16 * 1024 * 1024,
    retainedCache: 128 * 1024 * 1024,
    stageDownloads: 12 * 1024 * 1024,
  }
  return {
    networkBytes: budget.networkBytes ?? 0,
    sourceBytes: budget.sourceBytes ?? 0,
    decodedBytes: budget.decodedBytes ?? 0,
    gpuBytes: budget.gpuBytes ?? 0,
    clonedCanvasBytes: budget.clonedCanvasBytes ?? 0,
    caps,
    withinCaps: (budget.decodedBytes ?? 0) <= (caps.decodedPerFighter ?? 16 * 1024 * 1024)
      && (budget.networkBytes ?? 0) <= (caps.stageDownloads ?? 12 * 1024 * 1024),
  }
}

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

/**
 * The capture index: commit/dirty/source hashes, pack version, landmarks,
 * coverage and capability readiness. Landmarks default to `unverified` -
 * they never silently pass (see assertIndexIntegrity).
 */
export function buildIndex({ fighter, role, commit, dirty = false, packRevision = 'unverified', sourceHashes = {}, landmarks = {}, coverage = [], rows = 0, facings = [], renderers = [], tracePath = '', videoPath = '', contactSheet = '' }) {
  const required = ['groundErrorU', 'contactU', 'weaponTipU', 'pivotU']
  const landmarkReport = {}
  for (const name of required) landmarkReport[name] = landmarks[name] ?? 'unverified'
  for (const [name, value] of Object.entries(landmarks)) landmarkReport[name] = value
  return {
    fighter,
    role,
    capture: {
      commit,
      dirty,
      capturedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
      rows,
      facings: [...facings],
      renderers: [...renderers],
    },
    pack: { revision: packRevision, sourceHashes },
    landmarks: landmarkReport,
    capabilities: ROLE_CAPABILITIES[role] ?? [],
    coverage,
    evidence: { tracePath, videoPath, contactSheet },
  }
}
