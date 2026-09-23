import type { FaceKind } from './figures'

/**
 * What separates one character's face from another's, as data.
 *
 * Split out of `draw.ts` because two passes need it and they now live in
 * different files: the coarse in-play face (`drawDetails`) and the portrait
 * face (`portrait.ts`). Keeping one table is the thing that stops the two
 * drifting apart - a hero whose portrait slants his eyes and whose fighter does
 * not is two characters.
 *
 * `FaceKind` itself stays in `figures.ts` with the rest of the cast data, so
 * nothing here imports a drawing module and there is no cycle.
 */

/**
 * Portrait eye colours. Warm whites and dark-brown irises: the cast is Chinese,
 * and paper-white sclera with blue irises would read as a different art style
 * from everything around it.
 */
export const SCLERA = '#f1ead9'
export const IRIS = '#43301e'
export const PUPIL = '#120d10'
export const CATCHLIGHT = 'rgba(255, 248, 236, 0.92)'

/**
 * The aperture width every portrait eye is derived from, as a fraction of
 * headR, before the kind's own `eyeW` scales it.
 */
export const EYE_BASE_W = 0.37

export interface FaceShape {
  /** Rotation of the whole brow stroke, in radians. */
  browAngle: number
  browWeight: number
  browLength: number
  /** Overall eye SIZE. Scales the aperture's width; the height follows from
   * `eyeAspect`, so size and shape are independent. */
  eyeW: number
  /** In-play eye height only. The portrait derives height from `eyeAspect`
   * instead. The in-play eye is smaller - a 40px head, not the portrait's
   * 160 - but it is not a dot: ART-7 gave it an almond about 2:1, because the
   * SHAPE reads even when the whole eye is seven pixels wide. */
  eyeH: number
  /** Rotation of the eye almond itself, in radians. 丹凤眼 slants; a round
   * glaring 环眼 does not; age droops the outer corner. */
  eyeTilt: number
  /**
   * Portrait aperture WIDTH : HEIGHT.
   *
   * The field that finally makes the historical eye shapes read. The portrait
   * used to draw every eye as a sclera oval at 1.2x/1.14x the coarse radii -
   * an aspect of 1.04:1, a circle, for everyone - so Zhang Fei's 环眼 and Guan
   * Yu's 丹凤眼 differed only by being slightly bigger or smaller discs. A
   * circular aperture with a circular iris floating inside it is the single
   * strongest "cartoon, not human" signal there is.
   *
   * A human aperture is roughly 2:1. Above that reads as narrow and slanted,
   * below it as a stare - which is exactly the distinction the sources draw.
   */
  eyeAspect: number
  /** Portrait-only brow arch: perpendicular lift of the brow's midpoint as a
   * fraction of its length. The coarse face keeps straight brows. */
  browArch: number
}

export const FACES: Record<FaceKind, FaceShape> = {
  plain: { browAngle: 0, browWeight: 1, browLength: 1, eyeW: 1, eyeH: 1, eyeTilt: 0, eyeAspect: 2.2, browArch: 0.06 },
  // 丹凤眼 and 卧蚕眉 - Guan Yu. The eyes long, narrow and slanted; the brows
  // "reclining silkworms", which means THICK and gently curved. The brow
  // weight used to be 0.95 - the second lightest of the six kinds - which had
  // the one feature the sources name alongside his beard and his red face
  // exactly backwards. Heavy now, and the steep 0.55 angle softened, because a
  // silkworm brow curves rather than slants.
  phoenix: { browAngle: -0.36, browWeight: 1.32, browLength: 1.25, eyeW: 0.82, eyeH: 0.85, eyeTilt: -0.2, eyeAspect: 2.9, browArch: 0.17 },
  // 环眼 - the round glare. Zhang Fei, and the one kind that should stay close
  // to round: this is the shape the sources name him for.
  fierce: { browAngle: -0.42, browWeight: 1.3, browLength: 1.05, eyeW: 1.2, eyeH: 1.25, eyeTilt: -0.06, eyeAspect: 1.55, browArch: 0.04 },
  // 浓眉大眼 - Zhao Yun: "thick brows, large eyes". The heaviest brow in the
  // cast and the largest eye short of Zhang Fei's round glare, level and open
  // rather than slanted. He shared `calm` with three bosses, whose brows were
  // lighter than Guan Yu's and Huang Zhong's - the one man the sources name for
  // his brows had neither the heaviest nor the largest-eyed face.
  bold: { browAngle: 0.02, browWeight: 1.5, browLength: 1.12, eyeW: 1.18, eyeH: 1.14, eyeTilt: 0, eyeAspect: 2.0, browArch: 0.07 },
  calm: { browAngle: 0.05, browWeight: 1.18, browLength: 1.05, eyeW: 1.12, eyeH: 1.05, eyeTilt: 0.02, eyeAspect: 2.15, browArch: 0.09 },
  // Hooded and drooping. Huang Zhong, the old general.
  aged: { browAngle: 0.3, browWeight: 1.35, browLength: 1, eyeW: 0.95, eyeH: 0.78, eyeTilt: 0.14, eyeAspect: 2.5, browArch: 0.02 },
  // Severe and hard: Wei Yan, Xu Huang, Cao Cao. 0.8 made this the LIGHTEST
  // brow of the six, which reads as delicate rather than severe - a judgement
  // call rather than a source citation, unlike the silkworm brows above.
  sharp: { browAngle: -0.5, browWeight: 1.06, browLength: 1.1, eyeW: 0.88, eyeH: 0.85, eyeTilt: -0.12, eyeAspect: 2.45, browArch: 0.12 },
  // 细眼 - Cao Cao, "narrow eyes", the one physical detail the novel gives him
  // besides his long beard and his modest height. He shared `sharp` with Wei
  // Yan and Xu Huang, whose eyes are wider than Guan Yu's phoenix eyes, so the
  // man the sources single out for narrow eyes had some of the widest in the
  // cast. The narrowest aperture of every kind, in both passes; brows level
  // and hard rather than scowling - he is cold, not hot-tempered.
  narrow: { browAngle: -0.26, browWeight: 1.08, browLength: 1.08, eyeW: 0.92, eyeH: 0.66, eyeTilt: -0.06, eyeAspect: 3.4, browArch: 0.08 },
}
