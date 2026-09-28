import { readFileSync, writeFileSync } from 'node:fs'

let s = readFileSync('artifacts/finish-ui5b.mjs', 'utf8')
s = s.split('VERDICT_LINE').join(
  'FIXED - continue title fully below the gold rule with the dark stroke (countdown too), result title clear of the top bar, chip row centred with even gaps and LIVES off the border; matches PAUSED (delegated, before state confirmed in previous/)',
)
s = s.split('VERDICT_TEXT').join(
  'V-5 FIXED (row centred, even gaps, chips inside frame) | V-6 FIXED (titles dropped clear of frames) | V-7 FIXED (title + countdown carry the dark stroke) - delegated review with the before state confirmed.',
)
writeFileSync('artifacts/finish-ui5b.mjs', s)
console.log('patched')
