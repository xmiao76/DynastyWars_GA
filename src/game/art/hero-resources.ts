import type { MotionArt } from './motion-clips'

/** Shared painted portrait identity; no rig/body resources are needed. */
export interface PortraitArt {
  id: string
  revision: string
  portrait: CanvasImageSource
}
export interface PortraitResources {
  portraits?: Readonly<Partial<Record<string, PortraitArt>>>
}
export interface ArtResources extends PortraitResources {
  motions?: Readonly<Partial<Record<string, MotionArt>>>
}
