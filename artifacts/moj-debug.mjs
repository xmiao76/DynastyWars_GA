import { readFileSync } from 'node:fs'
const dec = new TextDecoder('windows-1252')
const toByte = new Map()
for (let b = 0; b < 256; b += 1) toByte.set(dec.decode(Uint8Array.of(b)), b)
const s = readFileSync('TASKS.md', 'utf8')
const lines = s.split(/\r?\n/)
const l = lines[27]
const m = l.match(/[^\x00-\x7f]+/)
const run = m[0]
console.log('run length', run.length, 'at', m.index, 'after', JSON.stringify(l.slice(m.index + run.length, m.index + run.length + 40)))
const set = new Map()
for (const c of run) set.set(c, (set.get(c) ?? 0) + 1)
const unmapped = [...set.keys()].filter((c) => !toByte.has(c))
console.log('distinct', set.size, 'unmapped', unmapped.map((c) => c.codePointAt(0).toString(16)))
// what follows the run: ascii then more runs?
const tail = l.slice(m.index)
const runs = tail.match(/[^\x00-\x7f]+|[\x00-\x7f]+/g).slice(0, 12).map((r) => (r.charCodeAt(0) < 128 ? JSON.stringify(r) : `<${r.length}>`))
console.log(runs.join(' '))
