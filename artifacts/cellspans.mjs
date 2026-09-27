import { readFileSync } from 'node:fs'
// Painted A->B span of each cell (logical units) vs BODY_PART_DEFS.naturalLen,
// derived from cell height / density / (pre+1+post) as cut by the prep script.
const NAT = { upperArmF: 12.37, foreArmF: 12.17, thighF: 18.11, shinF: 21.1, torso: 22, thighN: 18.25, shinN: 21.21, upperArmN: 12.65, foreArmN: 11.05 }
const SPAN = { torso: 1.75, upperArmF: 1.5, foreArmF: 1.7, thighF: 1.4, shinF: 1.7, thighN: 1.4, shinN: 1.7, upperArmN: 1.5, foreArmN: 1.7 }
const rows = []
for (const pack of ['hero-bodies', 'mook-bodies', 'boss-bodies']) {
  const prep = JSON.parse(readFileSync(`src/game/assets/${pack}/prepared.json`, 'utf8'))
  for (const [id, m] of Object.entries(prep)) {
    const r = { id }
    for (const [part, c] of Object.entries(m.parts)) {
      const len = c.h / m.density / SPAN[part]
      r[part] = +(len / NAT[part]).toFixed(2)
    }
    rows.push(r)
  }
}
console.table(rows)
