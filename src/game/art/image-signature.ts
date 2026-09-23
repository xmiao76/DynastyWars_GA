/** Small premultiplied-RGBA block signatures detect wrong/blank/corrupted art
 * after decoding. Averaging original pixels avoids resampler differences. This
 * is asset identity/integrity validation, not an aesthetic or likeness score. */
export const SIGNATURE_COLS = 48
export const SIGNATURE_ROWS = 32
export interface ImagePixels { width: number; height: number; data: ArrayLike<number> }
export function imageSignature(im: ImagePixels): string {
  let hex = ''
  for (let by = 0; by < SIGNATURE_ROWS; by++) for (let bx = 0; bx < SIGNATURE_COLS; bx++) {
    const sums = [0, 0, 0, 0]
    let n = 0
    for (let y = Math.floor(by * im.height / SIGNATURE_ROWS); y < Math.floor((by + 1) * im.height / SIGNATURE_ROWS); y++) {
      for (let x = Math.floor(bx * im.width / SIGNATURE_COLS); x < Math.floor((bx + 1) * im.width / SIGNATURE_COLS); x++) {
        const k = (y * im.width + x) * 4, a = im.data[k + 3]! / 255
        for (let j = 0; j < 3; j++) sums[j]! += im.data[k + j]! * a
        sums[3]! += im.data[k + 3]!
        n++
      }
    }
    for (const sum of sums) hex += Math.round(sum / Math.max(1, n)).toString(16).padStart(2, '0')
  }
  return hex
}

export function signatureMatches(actual: string, expected: string): boolean {
  if (actual.length !== expected.length || actual.length !== SIGNATURE_COLS * SIGNATURE_ROWS * 8) return false
  let total = 0
  for (let i = 0; i < actual.length; i += 2) {
    const diff = Math.abs(parseInt(actual.slice(i, i + 2), 16) - parseInt(expected.slice(i, i + 2), 16))
    if (!Number.isFinite(diff) || diff > 8) return false
    total += diff
  }
  return total / (actual.length / 2) < 0.8
}
