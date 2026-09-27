import fs from 'node:fs'
import { makePlan, parseArgs, buildTaskXml, readOwnedTask } from '../../scripts/loop-schedule/core.mjs'
const [mode, sid] = process.argv.slice(2)
const repoRoot = process.cwd()
const directory = 'artifacts/migration-ga/'
if (mode === 'generate') {
  const plan = makePlan(parseArgs(['preview', '--delay-seconds', '3600', '--interval-minutes', '15', '--until', new Date(Date.now() + 7200000).toISOString()]), { repoRoot, nodePath: process.execPath })
  fs.writeFileSync(directory + 'scheduler-schema-input.xml', '\ufeff' + buildTaskXml(plan, sid), 'utf16le')
} else if (mode === 'validate') {
  const task = readOwnedTask(fs.readFileSync(directory + 'scheduler-schema-normalized.xml', 'utf16le'), { repoRoot, nodePath: process.execPath, sid })
  if (task.enabled || task.intervalMinutes !== 15) throw new Error('Unsafe or incorrect normalized task')
  console.log('Windows COM NewTask XML schema and normalized ownership parsing passed; no task registered.')
} else throw new Error('Expected generate|validate SID')
