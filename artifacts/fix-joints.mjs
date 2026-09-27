import { readFileSync, writeFileSync } from 'node:fs'
// BODY-19: re-landmark arm joints from the gridded arm crops
// (artifacts/look/joints/<id>-arms.png). Old elbows sat at ~75% (cuff/wrist);
// new elbows at the anatomical ~55% shoulder->wrist; hands at fingertips.
const FIX = {
  zhangfei: { elbowF: [143, 460], handF: [62, 598], elbowN: [668, 460], handN: [770, 598] },
  guanyu: { elbowF: [188, 392], handF: [70, 546], elbowN: [646, 394], handN: [762, 546] },
  huangzhong: { elbowF: [199, 407], handF: [85, 558], elbowN: [633, 407], handN: [747, 558] },
  weiyan: { elbowF: [683, 207], handF: [557, 238], elbowN: [949, 207], handN: [1075, 238] },
  zhaoyun: { elbowF: [165, 458], handF: [55, 613], elbowN: [555, 458], handN: [665, 613] },
  soldier: { elbowF: [187, 427], handF: [62, 592], elbowN: [645, 427], handN: [770, 592] },
  spearman: { elbowF: [195, 426], handF: [72, 588], elbowN: [637, 426], handN: [760, 588] },
  archer: { elbowF: [190, 427], handF: [62, 600], elbowN: [642, 427], handN: [770, 600] },
  lubu: { elbowF: [212, 470], handF: [45, 600], elbowN: [620, 470], handN: [790, 600] },
  caocao: { elbowF: [202, 448], handF: [62, 577], elbowN: [633, 448], handN: [772, 577] },
  xiahoudun: { elbowF: [199, 444], handF: [65, 582], elbowN: [636, 444], handN: [770, 582] },
  xuchu: { elbowF: [182, 443], handF: [50, 608], elbowN: [648, 443], handN: [780, 608] },
  zhangliao: { elbowF: [202, 457], handF: [55, 600], elbowN: [633, 457], handN: [780, 600] },
  caoren: { elbowF: [202, 449], handF: [55, 592], elbowN: [633, 449], handN: [780, 592] },
  xuhuang: { elbowF: [202, 449], handF: [58, 592], elbowN: [633, 449], handN: [777, 592] },
  zhanghe: { elbowF: [205, 451], handF: [62, 582], elbowN: [630, 451], handN: [773, 582] },
  lidian: { elbowF: [202, 449], handF: [58, 588], elbowN: [633, 449], handN: [777, 588] },
}
const file = 'scripts/prepare-body-parts.mjs'
const t = readFileSync(file, 'utf8')
// Split into fighter blocks at `  <id>: {` boundaries.
const parts = t.split(/^  (?=\w+: \{$)/m)
let n = 0
for (let i = 0; i < parts.length; i++) {
  const m = parts[i].match(/^(\w+): \{$/m)
  if (!m) continue
  const fix = FIX[m[1]]
  if (!fix) continue
  for (const [joint, pt] of Object.entries(fix)) {
    const re = new RegExp(`(${joint}: )\\[\\d+, \\d+\\]`, 'g')
    const matches = parts[i].match(re) ?? []
    if (matches.length !== 1) throw new Error(`${m[1]}.${joint}: ${matches.length} matches`)
    parts[i] = parts[i].replace(re, `$1[${pt[0]}, ${pt[1]}]`)
    n++
  }
}
if (n !== 68) throw new Error(`only ${n}/68 applied`)
writeFileSync(file, '  ' + parts.join('  ').slice(2))
console.log('joints fixed:', n)
