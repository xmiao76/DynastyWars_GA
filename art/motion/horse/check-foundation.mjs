import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import path from 'node:path'
import assert from 'node:assert/strict'
import console from 'node:console'
import process from 'node:process'
import ts from 'typescript'
import { loadImage } from '@napi-rs/canvas'

// Offline diagnostic only: never imports Phaser, publishes art, reserves a
// request, or writes runtime/ledger/source files. --record writes ONLY this
// package's provenance snapshot; default mode checks its immutable inputs.
const nativeRequire = createRequire(import.meta.url)
const root = process.cwd()
const manifestPath = 'art/motion/horse/FOUNDATION_MANIFEST.json'
const text = p => readFileSync(p, 'utf8')
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const loaded = new Map()
function coreRequire(filename) {
  const absolute = path.resolve(root, filename)
  if (loaded.has(absolute)) return loaded.get(absolute).exports
  const module = { exports: {} }
  loaded.set(absolute, module)
  const compiled = ts.transpileModule(text(absolute), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText
  const localRequire = spec => spec.startsWith('.')
    ? coreRequire(path.resolve(path.dirname(absolute), `${spec}.ts`))
    : nativeRequire(spec)
  new Function('require', 'module', 'exports', compiled)(localRequire, module, module.exports)
  return module.exports
}

const sourcePaths = [
  'art/fighter-bodies/horse-master.jpg',
  'src/game/assets/horse/horse-sheet.png', 'src/game/assets/horse/prepared.json',
  'src/game/art/horse-frames.ts', 'src/game/art/registry.ts',
  'src/game/adapters/horse-art.ts', 'scripts/prepare-horse.mjs',
  'src/game/scenes/GameScene.ts', 'src/core/sim.ts', 'src/core/combat.ts',
  'src/core/attacks.ts', 'src/core/constants.ts',
  'src/game/adapters/motion-art.ts', 'src/game/adapters/motion-catalog.ts',
  'src/game/adapters/motion-scope.ts', 'src/game/art/motion-profiles.ts',
  'src/game/art/motion-clips.ts',
  ...['zhangfei', 'zhaoyun', 'weiyan', 'huangzhong'].map(id => `src/game/art/motion-clips-${id}.ts`),
  'test/game/horse.test.ts', 'test/core/horse.test.ts', 'test/core/coop.test.ts',
  'test/game/motion-catalog.test.ts', 'test/game/motion-scope.test.ts', 'e2e/horse.spec.ts',
  'docs/motion-tasks/CMR-22.md', 'docs/loop-task-records/CMR-22.md',
  'docs/CAST_MOTION_ROLLOUT.md',
  'art/motion/generation-budget.json', 'art/motion/acceptance4-repair-budget.json',
]
const unrelatedPaths = [
  '.loop/eval-loop.md', 'AGENTS.md', 'scripts/motion-acceptance4-repair.d.mts',
  'scripts/motion-acceptance4-repair.mjs', 'test/game/motion-acceptance4-repair.test.ts',
]
const heroPattern = /^(guanyu-(motion-sheet|actions-sheet)\.png|prepared\.json|actions-prepared\.json|(zhangfei|zhaoyun|weiyan|huangzhong)-(motion-sheet|actions-sheet)\.png|(zhangfei|zhaoyun|weiyan|huangzhong)-prepared\.json)$/
const heroPaths = readdirSync('src/game/assets/motion').filter(name => heroPattern.test(name))
  .sort().map(name => `src/game/assets/motion/${name}`)
assert.equal(heroPaths.length, 15, 'all five accepted hero packs must be indexed')
const fingerprint = p => { const bytes = readFileSync(p); return { path: p, bytes: bytes.length, sha256: digest(bytes) } }

const { createSim, playerOf, playersOf, joinPlayer2, stepSim } = coreRequire('src/core/sim.ts')
const { neutralInput } = coreRequire('src/core/types.ts')
const { makeCombatant } = coreRequire('src/core/entities.ts')
const { ATTACKS } = coreRequire('src/core/attacks.ts')
const sceneSource = text('src/game/scenes/GameScene.ts')
const helperMatch = sceneSource.match(/function horsePoseFor\(horse: Entity, player: Entity\): Pose \{[\s\S]*?\n\}/)
assert.ok(helperMatch, 'diagnostic requires the exact current legacy helper')
const helperJs = ts.transpileModule(`${helperMatch[0]}\nexports.horsePoseFor = horsePoseFor`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const helperExports = {}
new Function('exports', helperJs)(helperExports)
const pose = helperExports.horsePoseFor
const sandbox = () => {
  const sim = createSim(42, 'zhaoyun', 'stage2')
  sim.entities = sim.entities.filter(e => e.side === 'hero')
  sim.cameraLocked = false
  sim.events = []
  const p1 = playerOf(sim)
  const horse = makeCombatant(95, 'horse', 'neutral', 200, p1.y, 20, 0, 'right')
  sim.entities.push(horse)
  return { sim, p1, horse }
}
const flee = sandbox()
flee.horse.state = 'fleeing'
flee.horse.stateTick = 0
const x0 = flee.horse.x
const fleeingPoses = []
for (let i = 0; i < 12; i++) {
  stepSim(flee.sim, neutralInput())
  fleeingPoses.push(pose(flee.horse, flee.p1))
}
assert.equal(flee.horse.x - x0, 48)
assert.equal(flee.horse.stateTick, 0)
assert.deepEqual([...new Set(fleeingPoses)], ['walk0'])
const freeze = sandbox()
freeze.horse.state = 'fleeing'
freeze.sim.freezeTicks = 2
const fx = freeze.horse.x
for (let i = 0; i < 2; i++) stepSim(freeze.sim, neutralInput())
assert.equal(freeze.horse.x, fx)
stepSim(freeze.sim, neutralInput())
assert.equal(freeze.horse.x - fx, 4)
const coop = sandbox()
assert.equal(joinPlayer2(coop.sim, 'zhangfei'), true)
const p2 = playersOf(coop.sim).find(p => p.id !== coop.p1.id)
assert.ok(p2)
p2.mountedOn = coop.horse.id
p2.state = 'walk'
p2.stateTick = 10
assert.equal(pose(coop.horse, coop.p1), 'idle')
assert.equal(pose(coop.horse, p2), 'walk1')
const actualRider = playersOf(coop.sim).find(p => p.mountedOn === coop.horse.id)
assert.equal(actualRider.id, p2.id)

const budget = JSON.parse(text('art/motion/generation-budget.json'))
const repair = JSON.parse(text('art/motion/acceptance4-repair-budget.json'))
assert.equal(budget.fighters.horse, undefined)
assert.equal(repair.fighters.horse, undefined)
assert.equal(budget.roleCaps.horse, 4)
const globalUsed = Object.values(budget.fighters).reduce((sum, fighter) => sum + fighter.used, 0)
assert.equal(globalUsed, 145)
const master = await loadImage('art/fighter-bodies/horse-master.jpg')
const sheet = await loadImage('src/game/assets/horse/horse-sheet.png')
const meta = JSON.parse(text('src/game/assets/horse/prepared.json')).horse
assert.equal(meta.density, 4)
assert.equal(digest(readFileSync('src/game/assets/horse/horse-sheet.png')), meta.sha256.sheet)
assert.deepEqual([sheet.width, sheet.height], [1344, 304])
const observations = {
  evidenceClass: 'offline execution of actual current core and extracted legacy pose helper; NOT browser capture',
  master: { width: master.width, height: master.height },
  legacyPack: { density: meta.density, width: sheet.width, height: sheet.height,
    frames: Object.keys(meta.frames), sourceBytes: readFileSync('src/game/assets/horse/horse-sheet.png').length,
    decodedRgbaBytes: sheet.width * sheet.height * 4,
    gpuPageEstimateBytes: sheet.width * sheet.height * 4,
    includesLegacyGeneratedPoseTextures: false },
  fleeing: { ticksObserved: 12, deltaX: flee.horse.x - x0, stateTick: flee.horse.stateTick,
    selectedPoses: [...new Set(fleeingPoses)], unitsPerUnfrozenStep: 4 },
  hitStop: { frozenSteps: 2, frozenDeltaX: 0, firstUnfrozenDeltaX: freeze.horse.x - fx },
  coop: { actualRiderId: actualRider.id, p1Id: coop.p1.id,
    currentP1Selection: pose(coop.horse, coop.p1), actualRiderSelection: pose(coop.horse, actualRider) },
  mountedSweep: ATTACKS['mounted.sweep'],
  budgets: { horseAuthoringUsed: 0, horseCap: 4, horseRepairUsed: 0,
    horseRepairCap: repair.perFighterCap, globalAuthoringUsed: globalUsed,
    globalAuthoringCap: budget.totalCap, wholeSheetCandidatesPerSequence: budget.sheetCandidatesPerSequence,
    reservedOrSpentThisPackage: 0 },
}
const inputs = sourcePaths.map(fingerprint)
const acceptedHeroPayloads = heroPaths.map(fingerprint)
const unrelatedWorktreeFingerprints = unrelatedPaths.map(fingerprint)
if (process.argv.includes('--record')) {
  const queue = text('TASKS.md')
  const required = ['CMR-05', 'CMR-09B', 'CMR-10B', 'CMR-11B', 'CMR-12B']
  for (const id of required) {
    const block = queue.split(`### ${id} - `)[1]?.split('\n### ')[0]
    assert.ok(block?.includes('- Status: DONE'), `${id} must really be DONE`)
  }
  const state = JSON.parse(text('artifacts/loop/state.json'))
  const parentRunId = '2026-10-10T06-39-22-819Z-83426a3c-a16c-47fc-889c-89d02fde8f3b'
  assert.equal(state.activeRun.runId, parentRunId)
  assert.equal(state.recoveryFailures?.['CMR-22'], undefined)
  assert.equal(state.parkedTasks?.['CMR-22'], undefined)
  writeFileSync(manifestPath, `${JSON.stringify({ version: 1, taskId: 'CMR-22',
    status: 'FOUNDATION_ONLY_NOT_ARTWORK_ACCEPTANCE', parentRunId,
    readiness: { required, allDone: true, historicalFailedConsumers: 0, runtimeFailedConsumers: 0,
      historicalRecordOrderingDependency: 'CMR-15B (superseded by live Requires)', ownerExclusions: 'no narrower exclusion in selected record; opt-in/pixel/gameplay boundaries retained' },
    observations, inputs, acceptedHeroPayloads, unrelatedWorktreeFingerprints,
  }, null, 2)}\n`)
  console.log(`RECORDED ${manifestPath}; no ledger/source/runtime writes`)
} else {
  const saved = JSON.parse(text(manifestPath))
  assert.deepEqual(observations, saved.observations)
  assert.deepEqual(inputs, saved.inputs)
  assert.deepEqual(acceptedHeroPayloads, saved.acceptedHeroPayloads)
  assert.deepEqual(unrelatedWorktreeFingerprints, saved.unrelatedWorktreeFingerprints)
  console.log(`PASS: ${inputs.length} source/budget identities, ${acceptedHeroPayloads.length} accepted hero payloads, five unrelated fingerprints; actual fleeing/co-op/hit-stop probes reproduce snapshot`)
}
