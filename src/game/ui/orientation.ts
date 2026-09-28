/**
 * UIR-7 (V-9, owner-approved 2026-09-26): portrait phones are asked to
 * rotate. A touch device held in portrait (height > width) gets the
 * rotate-your-phone overlay and gameplay pauses behind it; landscape and
 * desktop play unchanged. No Screen Orientation API forcing - the
 * decision was an overlay, not a portrait layout.
 */
import { hasTouch } from '../adapters/touch'

export function rotateBlocked(): boolean {
  return hasTouch() && typeof window !== 'undefined' && window.innerHeight > window.innerWidth
}
