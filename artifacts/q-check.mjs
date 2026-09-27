import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
// Compare '?' contexts in a file against HEAD: new '?' would mean lost chars.
const f = process.argv[2]
const now = readFileSync(f, 'utf8')
const head = execFileSync('git', ['show', `HEAD:${f}`], { maxBuffer: 1 << 28 }).toString('utf8')
const ctx = (s) => [...s.matchAll(/.{0,12}\?.{0,12}/g)].map((m) => m[0])
const a = new Set(ctx(head))
const fresh = ctx(now).filter((c) => !a.has(c))
console.log(f, 'now ?-contexts', ctx(now).length, 'not in HEAD:', fresh.length)
for (const c of fresh.slice(0, 20)) console.log('  ', JSON.stringify(c))
