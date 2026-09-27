import { readFileSync, writeFileSync } from 'node:fs'

// Reverse cp1252 map: char -> byte, for all 256 byte values.
// Explicit cp1252 table (this Node build's TextDecoder treats the label as
// latin1). 0x80-0x9f specials; everything else maps 1:1; undefined slots
// (81 8D 8F 90 9D) round-trip as C1 controls.
const CP1252_HI = [0x20ac, 0x81, 0x201a, 0x192, 0x201e, 0x2026, 0x2020, 0x2021, 0x2c6, 0x2030, 0x160, 0x2039, 0x152, 0x8d, 0x17d, 0x8f,
  0x90, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x2dc, 0x2122, 0x161, 0x203a, 0x153, 0x9d, 0x17e, 0x178]
const toByte = new Map()
for (let b = 0; b < 256; b += 1) toByte.set(String.fromCharCode(b >= 0x80 && b < 0xa0 ? CP1252_HI[b - 0x80] : b), b)
for (const b of [0x81, 0x8d, 0x8f, 0x90, 0x9d]) toByte.set(String.fromCharCode(b), b)
const utf8 = new TextDecoder('utf-8', { fatal: true })

/** One unwrap: treat each char as a cp1252 byte, decode as UTF-8. */
function unwrap(s) {
  const bytes = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i += 1) {
    const b = toByte.get(s[i])
    if (b === undefined) return null
    bytes[i] = b
  }
  try { return utf8.decode(bytes) } catch { return null }
}

const MOJI = /[\u0080-\u00ff\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2013\u2014\u2018-\u201e\u2020-\u2022\u2026\u2030\u2039\u203a\u20ac\u2122]{2,}/g

const write = process.argv.includes('--write')
for (const f of process.argv.slice(2).filter((a) => !a.startsWith('--'))) {
  const raw = readFileSync(f)
  const bom = raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf
  const src = raw.toString('utf8', bom ? 3 : 0)
  const fixes = new Map()
  const out = src.replace(MOJI, (run) => {
    let cur = run
    let depth = 0
    for (;;) {
      const next = unwrap(cur)
      if (next === null || next === cur || next.length >= cur.length) break
      cur = next
      depth += 1
    }
    if (depth === 0) return run
    const key = `${JSON.stringify(cur)} (x${depth}, ${run.length} chars)`
    fixes.set(key, (fixes.get(key) ?? 0) + 1)
    return cur
  })
  console.log(f, 'bytes', raw.length, '->', Buffer.byteLength(out) + (bom ? 3 : 0))
  for (const [k, n] of fixes) console.log('  ', n, 'x', k)
  if (write) writeFileSync(f, (bom ? '\ufeff' : '') + out.replace(/\r\n/g, '\n'))
}
