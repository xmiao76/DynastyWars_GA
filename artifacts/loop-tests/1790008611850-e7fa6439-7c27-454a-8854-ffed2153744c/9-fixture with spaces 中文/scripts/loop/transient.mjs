import fs from 'node:fs';

/**
 * Transient provider-outage classification for adapter TRANSPORT failures.
 *
 * Narrow exception to the "never parse transcripts" rule, and only in one
 * direction: stderr may be scanned for provider quota/rate-limit signatures
 * AFTER the adapter already failed (nonzero exit, no usable report). It is
 * never used to derive a task result — a match means "no iteration happened,
 * skip this tick without pausing so an hourly driver retries later". Stdout
 * is never read here at all.
 *
 * Timeouts and cancellations are deliberately NOT classifiable: the agent may
 * have been mid-write, so the outcome is unknown and stays fail-closed.
 */

const TAIL_BYTES = 65536;
const EXCERPT_CHARS = 500;

/** Read up to the last TAIL_BYTES of a file. Missing/unreadable -> null. */
export function readTailSafe(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const size = fs.fstatSync(fd).size;
    const start = Math.max(0, size - TAIL_BYTES);
    const buffer = Buffer.alloc(Math.min(size, TAIL_BYTES));
    fs.readSync(fd, buffer, 0, buffer.length, start);
    return buffer.toString('utf8');
  } catch {
    return null;
  } finally {
    if (fd !== undefined) { try { fs.closeSync(fd); } catch { /* already closing */ } }
  }
}

/**
 * Test text against compiled patterns. Returns { source, line } for the first
 * match (line = the single matched log line, truncated), else null.
 */
export function matchTransient(text, patterns) {
  if (typeof text !== 'string' || text.length === 0) return null;
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const found = pattern.exec(text);
    if (!found) continue;
    const lineStart = text.lastIndexOf('\n', found.index) + 1;
    let lineEnd = text.indexOf('\n', found.index);
    if (lineEnd < 0) lineEnd = text.length;
    const line = text.slice(lineStart, lineEnd).trim().slice(0, EXCERPT_CHARS);
    return { source: pattern.source, line };
  }
  return null;
}
