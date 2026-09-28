import { readFileSync, writeFileSync } from 'node:fs'
const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const old = '### BODY-24 - Pose interpolation and torso dynamics (motion engine)\n\n- Status: TODO'
if (!tasks.includes(old)) throw new Error('anchor')
writeFileSync('TASKS.md', tasks.replace(old, '### BODY-24 - Pose interpolation and torso dynamics (motion engine)\n\n- Status: IN_PROGRESS (attempt 1, 2026-09-27 UTC)'))
console.log('ok')
