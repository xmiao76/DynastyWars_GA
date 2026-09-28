import { readFileSync, writeFileSync } from 'node:fs'

const verdictShort = 'FIXED - result + roster labels legible and matching (pixel-measured 13px display caps vs 10px thin sans before). Caveat: the phone capture HORSE row was empty (player on foot) - that instance is code-confirmed at 9px and covered by the 92->0 suspect count, but was not visually exercised'
const verdictLong = 'V-4 FIXED (result-panel and roster labels verified before/after with pixel measurements; HORSE-row instance code-confirmed at 9px, unexercised in the phone frame).'

for (const f of ['TASKS.md', 'PROGRESS.md']) {
  let t = readFileSync(f, 'utf8')
  t = t.split('VERDICT_LINE').join(verdictShort)
  t = t.split('VERDICT_TEXT').join(verdictLong)
  writeFileSync(f, t)
}
console.log('verdicts written')
