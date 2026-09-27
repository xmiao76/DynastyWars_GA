import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
const source = 'C:/GitHub/DynastyWars_CX'
const root = process.cwd()
const manifest = JSON.parse(fs.readFileSync('artifacts/migration-ga/copy-manifest.json', 'utf8').replace(/^\ufeff/, ''))
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase()
let preserved = 0
for (const item of manifest) {
  const expected = item.sha256
  if (hash(path.join(source, item.path)) !== expected) throw new Error('Source snapshot changed: ' + item.path)
  const relative = item.path.replaceAll('\\', '/')
  if (/^(src|e2e|test|selfplay|vision|public|art)\//.test(relative) || ['TASKS.md', 'TASKS-ARCHIVE.md', 'PROGRESS-ARCHIVE.md'].includes(relative)) {
    if (hash(path.join(root, item.path)) !== expected) throw new Error('Unexpected preserved-file change: ' + relative)
    preserved++
  }
}
for (const file of ['.loop/config.local.json', 'artifacts/loop/state.json', 'artifacts/loop/run.lock']) {
  if (fs.existsSync(file)) throw new Error('Unexpected live owner/runtime configuration: ' + file)
}
const settings = JSON.parse(fs.readFileSync('.loop/config.json', 'utf8'))
if (settings.adapter !== null) throw new Error('Default model adapter must remain unset')
const result = { sourceFilesUnchanged: manifest.length, gameQueueAndArchivesUnchanged: preserved, activeAdapter: null, liveRunnerState: false, verifiedAt: new Date().toISOString() }
fs.writeFileSync('artifacts/migration-ga/final-integrity.json', JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
