import { readFileSync, writeFileSync, appendFileSync } from 'node:fs'

/** Archive oldest PROGRESS entries to PROGRESS-ARCHIVE.md (AGENTS.md rule 8:
 * cap 500 lines, preserve unfinished-task evidence - which lives in the
 * newest entries and stays). Entries are newest-first: find the largest
 * entry boundary at or below the cap and archive everything below it. */
const src = 'PROGRESS.md'
const dst = 'PROGRESS-ARCHIVE.md'
const CAP = 500
const text = readFileSync(src, 'utf8')
const lines = text.split('\n')
const entryStarts = []
for (let i = 0; i < lines.length; i += 1) {
  if (lines[i].startsWith('### ')) entryStarts.push(i)
}
// Largest entry start <= CAP: everything from there down is the older tail.
let splitAt = 0
for (const start of entryStarts) {
  if (start <= CAP) splitAt = start
}
if (splitAt === 0) {
  console.log('no archiving needed (first entry beyond cap?)')
} else {
  const archived = lines.slice(splitAt).join('\n')
  const kept = lines.slice(0, splitAt).join('\n')
  appendFileSync(dst, `\n${archived}`)
  writeFileSync(src, kept)
  console.log(`archived ${lines.length - splitAt} lines; PROGRESS now ${kept.split('\n').length} lines`)
}
