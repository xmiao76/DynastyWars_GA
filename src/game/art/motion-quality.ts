/** Offline landmark gate. Unknown values are not passes; do not use it as a
 * replacement for reviewing the actual motion, footwork and design seams. */
export interface MotionLandmarks { headWidthU: number | null; weaponLengthU: number | null }
export function motionLandmarkFailures(frames: MotionLandmarks[]): string[] {
  const failures: string[] = []
  for (const field of ['headWidthU', 'weaponLengthU'] as const) {
    const known = frames.map((f) => f[field]).filter((v): v is number => v !== null && Number.isFinite(v) && v > 0)
    if (known.length !== frames.length) failures.push(`${field}: landmarks incomplete`)
    if (known.length >= 2 && (Math.max(...known) - Math.min(...known)) / Math.max(...known) > 0.1) {
      failures.push(`${field}: spread exceeds 10%`)
    }
  }
  return failures
}
