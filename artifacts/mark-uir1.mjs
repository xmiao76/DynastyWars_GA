import { readFileSync, writeFileSync } from 'node:fs'
const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const old = '### UIR-1 - Separate the stage name from the SCORE readout\n\n- Status: TODO'
if (!tasks.includes(old)) throw new Error('anchor')
writeFileSync('TASKS.md', tasks.replace(old, '### UIR-1 - Separate the stage name from the SCORE readout\n\n- Status: IN_PROGRESS (attempt 1, 2026-09-27 UTC)'))
console.log('ok')
