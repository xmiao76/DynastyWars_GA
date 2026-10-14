import type { MetricThresholds } from './metrics'
import type { SpriteThresholds } from './sprite-metrics'

/**
 * Visual-health thresholds per screen. Tuned from the verified good renders
 * (the backgrounds are now bright skies + green field, so coverage is much
 * higher than when these were calibrated against dark renders). The gate
 * catches real regressions - a broken/empty/dark frame - while leaving slack
 * for normal variance.
 */
export const DEFAULT_THRESHOLDS: MetricThresholds = {
  coverage: 0.3,
  colorRichness: 40,
  saturation: 0.08,
  regionFill: 6,
}

export const THRESHOLDS: Record<string, Partial<MetricThresholds>> = {
  title: { coverage: 0.2, colorRichness: 40, saturation: 0.06, regionFill: 6 },
  select: { coverage: 0.2, colorRichness: 40, saturation: 0.05, regionFill: 6 },
  game_idle: { coverage: 0.5, colorRichness: 150, saturation: 0.25, regionFill: 8 },
  game_combat: { coverage: 0.5, colorRichness: 150, saturation: 0.25, regionFill: 8 },
  game_combat_zhangfei: { coverage: 0.5, colorRichness: 150, saturation: 0.25, regionFill: 8 },
  boss_fight: { coverage: 0.5, colorRichness: 150, saturation: 0.25, regionFill: 8 },
  result: { coverage: 0.35, colorRichness: 100, saturation: 0.15, regionFill: 7 },
  game_over: { coverage: 0.2, colorRichness: 60, saturation: 0.1, regionFill: 6 },
  game_complete: { coverage: 0.3, colorRichness: 80, saturation: 0.15, regionFill: 6 },
}

/**
 * Sprite-legibility thresholds, calibrated against the rectangle stand-in art
 * that shipped through the old gate. Those sprites measured:
 *
 *   silhouetteComplexity 0.047-0.141   (a torso box repeats one row profile)
 *   colorCount           9-51          (bosses were 9-10: a tinted slab)
 *   weapon reach         -1px          (every attack pose NARROWER than idle)
 *
 * so the floors below sit well clear of them. Readable figures - a head
 * narrower than the shoulders, arms clear of the torso, a weapon out to one
 * side - score 0.3+ on silhouette complexity. appendageRatio and outlineRatio
 * are sanity floors rather than discriminators (the boxes passed both); the
 * shape and reach numbers are what actually separate a character from a slab.
 *
 * minTonalBands is the discriminator that survives a move to smooth art, where
 * minColorCount cannot: anti-aliasing alone pushes colorCount into the hundreds,
 * so that floor stops being able to fail. A band must hold 2% of the drawn area,
 * so an anti-aliased ring cannot manufacture one. Measured over the 108 current
 * character sprites: 4-10, and nearly the whole population sits at
 * 6-10 (histogram 4:6, 6:6, 7:29, 8:27, 9:29, 10:11). The floor is placed just
 * ABOVE the failure mode rather than just below the population - a flat fill
 * scores 1 and a flat fill with an ink outline scores 2 - which is the same way
 * minSilhouetteComplexity sits above the box art's 0.156-0.250 rather than under
 * the real art's 0.375-0.469.
 */
export const CHARACTER_SPRITE_THRESHOLDS: SpriteThresholds = {
  minSilhouetteComplexity: 0.3,
  minAppendageRatio: 0.15,
  minColorCount: 12,
  maxDominantFraction: 0.6,
  minOutlineRatio: 0.8,
  minTonalBands: 3,
}

/*
 * MEASURED over the whole shipping cast - 144 character sprites (18 kinds x 8
 * poses) and 4 props - and, crucially, against the FAILURE MODE as well: the
 * same sprites with every drawn pixel flattened to one tone.
 *
 *                     real art        flattened      floor
 *   silhouette        0.563 - 1.000   unchanged      >= 0.3
 *   appendageRatio    0.442 - 0.913   unchanged      >= 0.15
 *   outlineRatio      0.865 - 1.000   0.000          >= 0.8
 *   tonalBands        6 - 12          1              >= 3
 *   colorCount        147 - 491       1              >= 12
 *   dominantFraction  0.083 - 0.248   1.000          <= 0.6
 *
 * Three conclusions, recorded so they are not re-derived - the first of which
 * CORRECTS what this comment used to say.
 *
 * 1. minColorCount and maxDominantFraction are NOT vacuous, and the earlier
 *    note claiming they had "gone unfailable on smooth art" was wrong. It
 *    reasoned from the margin on good art - 147 against a floor of 12 - when
 *    the question a floor has to answer is whether the FAILURE MODE trips it.
 *    Flattened art scores 1 and 1.000, so both fire. They stay. Had that note
 *    been acted on, two working metrics would have been deleted for passing
 *    comfortably, which is what a floor is supposed to do.
 * 2. outlineRatio works on anti-aliased ink, 0.865-1.000 against 0.000 when the
 *    ink is removed. That is the UI-R1 edge-alpha fix earning its place: under
 *    the old binary-alpha rule this art scored near zero and would have been
 *    rejected for having no outline.
 * 3. silhouetteComplexity was left at 0.3, which resolves the checkpoint UI-R3
 *    deferred to "once the cast is fully converted". It now could be raised -
 *    the population floor is 0.563 and there is no longer a pixel pipeline
 *    bottoming out at 0.344 - but it should not be. The box art this exists to
 *    reject scored 0.156-0.250, so 0.3 already sits above the failure mode;
 *    moving it up to hug the population would catch nothing new and would make
 *    the gate brittle against ordinary variation in a pose.
 */

/**
 * Props are not gated on SHAPE, and the reason has changed even though the
 * setting has not. It used to be resolution - the arrow was three source rows
 * tall, so the silhouette grid had nothing to work with. They are drawn as
 * vectors at full density now, and measure silhouette 0.156-0.75, appendage
 * 0.08-0.857. The floors stay at zero anyway, because flattening a prop leaves
 * both numbers IDENTICAL: shape is exactly the property that a flat fill does
 * not change, so for an object with no limbs it can never separate good art
 * from bad. Colour and edge do that work - measured 36-114 colours, dominance
 * 0.229-0.418, outlineRatio 1.0, against 1 / 1.000 / 0.0 when flattened - and
 * that is enough to catch what actually shipped: the sword pickup was a
 * single-colour grey rectangle with no outline, and the crate, meat and arrow
 * were the same.
 */
export const PROP_SPRITE_THRESHOLDS: SpriteThresholds = {
  minSilhouetteComplexity: 0,
  minAppendageRatio: 0,
  minColorCount: 3,
  maxDominantFraction: 0.8,
  minOutlineRatio: 0.5,
  // Measured: crate 5, meat 4, sword 4, arrow 3. Floored at 2 rather than at
  // the arrow's 3, so the smallest prop is not sitting exactly on the line -
  // and 2 still catches what actually shipped, a single-colour grey rectangle
  // with no outline, which scores 1.
  minTonalBands: 2,
}

/**
 * Extra sideways reach the attack pose must gain over idle, in idle-sprite
 * pixels. This is the "I cannot see the weapons" check: a held weapon swung
 * forward extends the silhouette. The stand-in art scored -1.
 */
export const MIN_WEAPON_REACH_PX = 4

export function thresholdsFor(screen: string): MetricThresholds {
  const t = THRESHOLDS[screen] ?? {}
  const base = { ...DEFAULT_THRESHOLDS }
  return {
    coverage: t.coverage ?? base.coverage,
    colorRichness: t.colorRichness ?? base.colorRichness,
    saturation: t.saturation ?? base.saturation,
    regionFill: t.regionFill ?? base.regionFill,
  }
}
