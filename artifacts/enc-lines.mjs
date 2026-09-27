import { readFileSync } from 'node:fs'
for (const f of process.argv.slice(2)) {
  const s = readFileSync(f, 'utf8')
  const lines = s.split(/\r?\n/)
  const big = []
  lines.forEach((l, i) => { if (l.length > 400) big.push([i + 1, l.length]) })
  console.log(f, 'lines', lines.length, 'long lines', big.length, JSON.stringify(big.slice(0, 12)))
  for (const [n] of big.slice(0, 3)) {
    const l = lines[n - 1]
    console.log('  L' + n, JSON.stringify(l.slice(0, 160)))
    // find first non-ascii run and show codepoints
    const m = l.match(/[^\x00-\x7f]{1,12}/)
    if (m) console.log('    first run', [...m[0]].map((c) => c.codePointAt(0).toString(16)).join(' '), 'at', m.index)
  }
}
