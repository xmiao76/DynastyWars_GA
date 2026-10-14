import { describe, expect, it } from 'vitest'
import {
  ENEMY_ACTIONS,
  HERO_ACTIONS,
  ROLE_CAPABILITIES,
  actionsForRole,
  assertIndexIntegrity,
  buildIndex,
  coverageMatrix,
  pacingReport,
  resourceReport,
  validateTrace,
  type TraceRow,
} from '../../scripts/motion-review-core.mjs'

/**
 * CMR-05: capture/review core negative controls and reports. The trace
 * fixtures are synthetic rows shaped exactly like the live capture writes
 * them (actual runtime frame keys `entity:<kind>:motion:<clip>:<idx>`).
 */

const motionKey = (frame: string): string => `entity:guanyu:motion:${frame}`
const pack = { frames: { 'walk:0': {}, 'walk:1': {}, 'jab1:4': {} } }

function row(over: Partial<TraceRow> = {}): TraceRow {
  return {
    action: 'walk',
    facing: 'right',
    renderer: 'canvas',
    state: 'walk',
    stateTick: 0,
    tick: 100,
    key: motionKey('walk:0'),
    elapsedMs: 1000,
    source: 'player',
    commit: 'abc1234',
    ...over,
  }
}

describe('trace negative controls', () => {
  it('accepts a clean motion trace', () => {
    const rows = [row(), row({ stateTick: 2, tick: 102, key: motionKey('walk:1'), elapsedMs: 1033 })]
    const r = validateTrace(rows, { pack, expectedCommit: 'abc1234' })
    expect(r.errors).toEqual([])
    expect(r.checked).toEqual({ rows: 2, motionRows: 2, legacyRows: 0 })
  })

  it('rejects unknown frames', () => {
    const r = validateTrace([row({ key: motionKey('walk:9') })], { pack })
    expect(r.errors.join(' ')).toContain('unknown frame: row 0 key entity:guanyu:motion:walk:9')
  })

  it('rejects old/new texture mixing per fighter, not across a co-op pair', () => {
    const mixed = validateTrace([row(), row({ tick: 102, stateTick: 2, key: 'entity:guanyu:walk0', elapsedMs: 1033 })], { pack })
    expect(mixed.errors.join(' ')).toContain('old/new texture mixing: unknown shows 1 motion and 1 legacy rows')
    // Co-op: guanyu (motion pack) next to zhangfei (legacy) is NOT mixing.
    const coop = validateTrace([
      row({ kind: 'guanyu', actor: 1 }),
      row({ kind: 'zhangfei', actor: 2, key: 'entity:zhangfei:idle', state: 'idle', elapsedMs: 1010 }),
    ], { pack, subjectKind: 'guanyu' })
    expect(coop.errors).toEqual([])
    // But one fighter showing both still fails.
    const one = validateTrace([
      row({ kind: 'guanyu', actor: 1 }),
      row({ kind: 'guanyu', actor: 1, tick: 102, stateTick: 2, key: 'entity:guanyu:walk0', elapsedMs: 1033 }),
    ], { pack, subjectKind: 'guanyu' })
    expect(one.errors.join(' ')).toContain('old/new texture mixing: guanyu shows 1 motion and 1 legacy rows')
  })

  it('rejects a blank pack and a legacy capture that claims motion', () => {
    expect(validateTrace([], { pack }).errors.join(' ')).toContain('blank pack')
    const claimed = validateTrace([row({ key: 'entity:guanyu:walk0' })], { pack })
    expect(claimed.errors.join(' ')).toContain('capture claims motion for unknown but shows only legacy keys')
    const unclaimed = validateTrace([row()], { pack, claimsMotion: false })
    expect(unclaimed.errors.join(' ')).toContain('capture claims legacy for unknown but shows motion keys')
  })

  it('rejects residue over tolerance', () => {
    const r = validateTrace([row()], { pack, removedResiduePx: 5000, residueTolerancePx: 1000 })
    expect(r.errors.join(' ')).toContain('residue: 5000 cleaned pixels exceed the 1000 tolerance')
  })

  it('rejects missing bindings', () => {
    const rows = [row({ attackId: 'gy.jab2' }), row({ tick: 102, stateTick: 1, attackId: 'gy.jab2', elapsedMs: 1033 })]
    const r = validateTrace(rows, { pack, bindings: { 'gy.jab1': 'jab1' } })
    expect(r.errors.join(' ')).toContain('missing binding: row 0 attack gy.jab2 has no clip binding')
  })

  it('rejects stale provenance', () => {
    const r = validateTrace([row({ commit: '0ld0ld0' })], { pack, expectedCommit: 'abc1234' })
    expect(r.errors.join(' ')).toContain('stale provenance: row 0 commit 0ld0ld0 != abc1234')
  })

  it('rejects clock defects but allows freeze/pause', () => {
    const back = [row(), row({ tick: 90, stateTick: 2, elapsedMs: 1200 })]
    expect(validateTrace(back, { pack }).errors.join(' ')).toContain('clock defect: sim tick regressed')
    const stateBack = [row(), row({ tick: 102, stateTick: -1, elapsedMs: 1200 })]
    expect(validateTrace(stateBack, { pack }).errors.join(' ')).toContain('clock defect: stateTick regressed')
    const wallBack = [row(), row({ tick: 102, stateTick: 2, elapsedMs: 900 })]
    expect(validateTrace(wallBack, { pack }).errors.join(' ')).toContain('clock defect: elapsedMs regressed')
    // A freeze frame (hit-stop) legitimately holds stateTick.
    const frozen = [row(), row({ tick: 102, stateTick: 0, elapsedMs: 1200, frozen: true })]
    expect(validateTrace(frozen, { pack }).errors).toEqual([])
  })
})

describe('coverage: unseen is never natural', () => {
  it('marks captured cells and leaves gaps explicitly unseen', () => {
    const rows = [
      row({ action: 'walk', facing: 'right', renderer: 'canvas' }),
      row({ action: 'idle', facing: 'left', renderer: 'canvas' }),
    ]
    const cells = coverageMatrix(rows, { actions: ['walk', 'idle', 'jab1'], facings: ['right', 'left'], renderers: ['canvas'] })
    const at = (a: string, f: string): string | undefined => cells.find((c) => c.action === a && c.facing === f)?.status
    expect(at('walk', 'right')).toBe('captured')
    expect(at('idle', 'left')).toBe('captured')
    expect(at('walk', 'left')).toBe('unseen')
    expect(at('jab1', 'right')).toBe('unseen')
    expect(cells.every((c) => c.status === 'captured' || c.status === 'unseen')).toBe(true)
  })

  it('labels injected stress cases separately from gameplay', () => {
    const cells = coverageMatrix([row({ action: 'grabbed' })], {
      actions: ['walk', 'grabbed'], facings: ['right'], renderers: ['canvas'], injected: ['grabbed'],
    })
    expect(cells.find((c) => c.action === 'grabbed')?.source).toBe('injected')
    expect(cells.find((c) => c.action === 'walk')?.source).toBe('gameplay')
  })

  it('index integrity rejects unseen-labelled-natural and null landmarks', () => {
    const errors = assertIndexIntegrity({
      coverage: [
        { action: 'walk', facing: 'right', renderer: 'canvas', status: 'unseen', source: 'gameplay', grade: 'N' },
      ],
      landmarks: { groundErrorU: null, weaponTipU: 'unverified' },
    })
    expect(errors.join(' ')).toContain('unseen pose labelled natural: walk/right/canvas')
    expect(errors.join(' ')).toContain('unseen landmark cannot pass: groundErrorU')
    expect(errors.join(' ')).toContain('unseen landmark cannot pass: weaponTipU')
    // A fully measured, fully captured index passes.
    expect(assertIndexIntegrity({
      coverage: [{ action: 'walk', facing: 'right', renderer: 'canvas', status: 'captured', source: 'gameplay' }],
      landmarks: { groundErrorU: 0.4, weaponTipU: 1.2 },
    })).toEqual([])
  })
})

describe('pacing and resource reports', () => {
  it('reports measured wall pacing and states its limitations', () => {
    const rows = [
      row({ action: 'walk', tick: 100, elapsedMs: 0 }),
      row({ action: 'walk', tick: 110, elapsedMs: 165 }),
      row({ action: 'walk', tick: 120, elapsedMs: 330 }),
    ]
    const report = pacingReport(rows)
    expect(report.actions['walk']?.samples).toBe(3)
    expect(report.actions['walk']?.msPerTickMedian).toBeCloseTo(16.5, 1)
    expect(report.playbackPace).toContain('sim-timed')
    expect(report.limitations.join(' ')).toContain('NOT normal-speed playback evidence')
  })

  it('separates network/source/decoded/GPU/cloned costs against the caps', () => {
    const report = resourceReport({
      networkBytes: 4_328_499, sourceBytes: 4_328_499,
      decodedBytes: 15_543_160, gpuBytes: 15_543_160, clonedCanvasBytes: 0,
    })
    expect(report.withinCaps).toBe(true)
    expect(report.clonedCanvasBytes).toBe(0)
    expect(report.caps.decodedPerFighter).toBe(16 * 1024 * 1024)
    expect(resourceReport({ networkBytes: 13 * 1024 * 1024 }).withinCaps).toBe(false)
    expect(resourceReport({ decodedBytes: 17 * 1024 * 1024 }).withinCaps).toBe(false)
    // A documented per-pack exception flows through the caps it carries.
    expect(resourceReport({ decodedBytes: 21441312, caps: { decodedPerFighter: 22 * 1024 * 1024 } }).withinCaps).toBe(true)
    expect(resourceReport({ decodedBytes: 21441312 }).withinCaps).toBe(false)
  })
})

describe('role capability observability (ready before first integration)', () => {
  it('covers shooter projectiles, boss charge/enrage and the shared paths', () => {
    expect(ROLE_CAPABILITIES['shooter']).toContain('projectile')
    expect(ROLE_CAPABILITIES['boss']).toContain('charge')
    expect(ROLE_CAPABILITIES['boss']).toContain('enrage')
    for (const role of ['hero', 'shooter', 'boss', 'mook']) {
      for (const cap of ['held', 'thrown', 'recovery', 'ko', 'isolated', 'mixed', 'interruptions']) {
        expect(ROLE_CAPABILITIES[role], role).toContain(cap)
      }
    }
    expect(ROLE_CAPABILITIES['hero']).toContain('revive')
    expect(ROLE_CAPABILITIES['hero']).toContain('coop')
  })

  it('derives per-role action lists from the inventory shape', () => {
    expect(actionsForRole('hero')).toEqual(HERO_ACTIONS)
    expect(actionsForRole('soldier')).toEqual(ENEMY_ACTIONS)
    expect(actionsForRole('archer')).toContain('approach')
  })
})

describe('capture index', () => {
  it('records commit/dirty/source hashes, pack revision and unverified landmarks', () => {
    const index = buildIndex({
      fighter: 'guanyu', role: 'hero', commit: 'abc1234', dirty: true,
      packRevision: 'motion-2',
      sourceHashes: { sheet: 'f'.repeat(64) },
      coverage: coverageMatrix([row()], { actions: ['walk'], facings: ['right'], renderers: ['canvas'] }),
      rows: 1, facings: ['right'], renderers: ['canvas'],
      tracePath: 'trace.json', videoPath: 'capture.webm', contactSheet: 'sheet.png',
    })
    expect(index.capture).toMatchObject({ commit: 'abc1234', dirty: true, rows: 1 })
    expect(index.pack).toEqual({ revision: 'motion-2', sourceHashes: { sheet: 'f'.repeat(64) } })
    expect(index.landmarks.groundErrorU).toBe('unverified') // required, never silent
    expect(index.capabilities).toContain('coop')
    expect(index.evidence.tracePath).toBe('trace.json')
    // Unverified landmarks fail the integrity gate by design.
    expect(assertIndexIntegrity(index).join(' ')).toContain('unseen landmark cannot pass: groundErrorU')
  })
})
