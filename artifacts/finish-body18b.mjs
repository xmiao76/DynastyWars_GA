import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

// Resume of finish-body18.mjs after TASKS.md was written: archive the
// overhaul UI-4 block (from HEAD) and prepend the PROGRESS entry.
const head = execFileSync('git', ['show', 'HEAD:TASKS.md'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
const start = head.indexOf('### UI-4 - In-game HUD')
const end = head.indexOf('### UI-5 - ')
if (start < 0 || end < start) throw new Error('UI-4 bounds')
const ui4 = head.slice(start, end)
let arch = readFileSync('TASKS-ARCHIVE.md', 'utf8')
if (arch.includes('### UI-4 - In-game HUD')) throw new Error('overhaul UI-4 already archived')
arch = arch.replace(/\n*$/, '\n\n') + ui4.replace(/\n*$/, '\n')
writeFileSync('TASKS-ARCHIVE.md', arch)

const src = readFileSync('artifacts/finish-body18.mjs', 'utf8')
const m = src.match(/const entry = `([\s\S]*?)`\n/)
if (!m) throw new Error('entry text')
const entry = m[1]
const prog = readFileSync('PROGRESS.md', 'utf8')
if (prog.includes('- BODY-18 (attempt 1')) throw new Error('entry already present')
const anchor = '## Entries\n\n'
const at = prog.indexOf(anchor)
if (at < 0) throw new Error('no Entries anchor')
const out = prog.slice(0, at + anchor.length) + entry + prog.slice(at + anchor.length)
writeFileSync('PROGRESS.md', out)
console.log('ok progress lines', out.split('\n').length)
