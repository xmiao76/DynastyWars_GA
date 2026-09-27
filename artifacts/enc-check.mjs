import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
for (const f of process.argv.slice(2)) {
  const now = readFileSync(f)
  let head
  try { head = execFileSync('git', ['show', `HEAD:${f}`], { maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }) } catch { head = Buffer.alloc(0) }
  const stat = (b) => {
    let hi = 0, q = 0
    for (const x of b) { if (x >= 128) hi++; if (x === 63) q++ }
    const s = b.toString('utf8')
    return { bytes: b.length, hi, q, bom: b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf, bad: (s.match(/\uFFFD/g) ?? []).length, moj: (s.match(/Ã.|â€|Â/g) ?? []).length, crlf: (s.match(/\r\n/g) ?? []).length }
  }
  console.log(f, 'NOW', JSON.stringify(stat(now)), 'HEAD', JSON.stringify(stat(head)))
}
