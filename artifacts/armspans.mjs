import { HEROES } from '../scripts/prepare-body-parts.mjs'
// Painted joint spans in logical units (torso chest->hip = 22u), per fighter.
const rows = []
for (const [id, s] of Object.entries(HEROES)) {
  const j = s.joints
  const d = (a, b) => Math.hypot(j[b][0] - j[a][0], j[b][1] - j[a][1])
  const ppu = d('chest', 'hip') / 22
  const r = (x) => +(x / ppu).toFixed(1)
  rows.push({
    id,
    upN: r(d('shoulderN', 'elbowN')), foreTipN: r(d('elbowN', 'handN')), upF: r(d('shoulderF', 'elbowF')), foreTipF: r(d('elbowF', 'handF')),
    thighN: r(d('hipN', 'kneeN')), shinN: r(d('kneeN', 'footN')),
    shoulderW: r(d('shoulderF', 'shoulderN')),
    // figure height: master soles to (unknown) head top - use shoulder->foot
    shToFoot: r(Math.abs(j.footN[1] - j.shoulderN[1])),
  })
}
console.table(rows)
const avg = (k) => (rows.reduce((a, r) => a + r[k], 0) / rows.length).toFixed(2)
console.log('avg upper', avg('upN'), avg('upF'), 'elbow->fingertip', avg('foreTipN'), avg('foreTipF'), 'thigh', avg('thighN'), 'shin', avg('shinN'))
