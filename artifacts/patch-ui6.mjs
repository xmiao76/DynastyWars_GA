import { readFileSync, writeFileSync } from 'node:fs'

let s = readFileSync('artifacts/finish-ui6.mjs', 'utf8')
s = s.split('VERDICT_LINE').join(
  'FIXED - all four arms point outward in both phone frames (pixel-level ASCII-map confirmation by the reviewer; before state confirmed all four inward)',
)
s = s.split('VERDICT_TEXT').join(
  'V-10 FIXED (up/down/left/right all OUTWARD in landscape + portrait; before state confirmed all four INWARD; one non-defect note: the down caret is slightly skewed at AA scale).',
)
writeFileSync('artifacts/finish-ui6.mjs', s)

const runner = readFileSync('artifacts/finish-ui6.mjs', 'utf8')
if (runner.includes('VERDICT')) throw new Error('placeholder left')
console.log('patched')
