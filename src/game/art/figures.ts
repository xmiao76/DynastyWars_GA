import type { Build } from './rig'

/**
 * Who each fighter is, as data.
 *
 * Everything that makes one figure a different PERSON from another lives here:
 * build, three colours, headgear, facial hair, cape and weapon. The poses and
 * the drawing are shared, so adding a fighter is an entry in this table rather
 * than a new set of drawings.
 *
 * Build is doing as much work as colour. The old pixel cast was distinguished
 * by palette and a hat, which is why the gate had to be taught to ask whether
 * the five heroes were "pairwise distinct, not palette swaps" - a question it
 * should not have had to ask. Zhang Fei is short and heavy, Zhao Yun is lean,
 * Guan Yu is tall: you can tell them apart in silhouette with the colour
 * stripped out, which is the standard a fighting-game roster is held to.
 */

export type HeadgearKind = 'helmet' | 'hood' | 'crown' | 'band' | 'turban'
/**
 * `dao` (Wei Yan's 大刀) and `ji` (Lu Bu's 方天画戟) joined the original five.
 * The ladder is story-true and monotonic - see WEAPONS.
 */
export type WeaponKind = 'glaive' | 'pike' | 'spear' | 'sword' | 'dao' | 'ji' | 'bow'
export type BeardKind = 'long' | 'full' | 'none'
/**
 * Brow and eye shaping. Colour alone makes five faces distinguishable; this is
 * what makes each one read as THAT character - Guan Yu's slanted phoenix eyes,
 * Zhang Fei's round glare, Huang Zhong's hooded age.
 */
export type FaceKind = 'plain' | 'phoenix' | 'fierce' | 'calm' | 'aged' | 'sharp'

export interface FigurePlan {
  build: Build
  /** Armour and robe colour - the one that reads first. */
  body: number
  /** Trim: sash, edging, the accent that keeps a flat fill from being flat. */
  trim: number
  /** Helmet, hood or crown. */
  gear: number
  headgear: HeadgearKind
  weapon: WeaponKind
  beard: BeardKind
  beardColor?: number
  /**
   * Complexion. Optional, and the default is the tone the rest of the cast
   * uses, so a figure that says nothing about its face is unchanged. The five
   * heroes all say something: it is most of what makes them recognisable.
   */
  skin?: number
  /** Brow and eye shaping. Absent means the plain face the whole cast shares. */
  face?: FaceKind
  /**
   * Xiahou Dun only, and a named field rather than a face kind on purpose: a
   * missing eye is a WOUND, not a temperament. Drawn as a hollow socket with a
   * scar crossing it, in both face passes.
   */
  missingEye?: boolean
  /** A cape widens the silhouette and reads at any distance. */
  cape: boolean
}

interface WeaponSpec {
  /** Overall length in canonical figure units. */
  length: number
  /** Haft thickness. */
  haft: number
  head: 'crescent' | 'serpent' | 'leaf' | 'jian' | 'dao' | 'ji' | 'bow'
  /** 红缨: the red tassel at the socket, on the polearms that carry one. */
  tassel?: boolean
}

/*
 * Hafts are thick for their length on purpose. The ink pass strokes every shape
 * with a line centred on its edge, so a haft loses INK_W from each side: at 3.6
 * units a glaive had under two units of wood left and read as a black stick
 * with something on the end. "I can't see the shape of the weapons" is the
 * report that started this redesign, and a haft the ink can swallow is the same
 * defect in a new pipeline.
 */
/*
 * The ladder is story-true: 丈八蛇矛 is the longest weapon in the novel (a
 * zhang eight), so the pike leads and the spear sits 10 units under it - the
 * old table had the spear (78) LONGER than the pike (74), backwards. Tip
 * extents in the attack pose are held at or under the old spear's 74.6 so the
 * shared POSE_REACH margins do not move: pike 74.4, ji 71.2, glaive ~74,
 * spear 70.4, dao 63.3, jian 58.2.
 */
export const WEAPONS: Record<WeaponKind, WeaponSpec> = {
  glaive: { length: 76, haft: 5.2, head: 'crescent', tassel: true },
  pike: { length: 82, haft: 5.0, head: 'serpent', tassel: true },
  spear: { length: 72, haft: 4.6, head: 'leaf', tassel: true },
  sword: { length: 46, haft: 4.8, head: 'jian' },
  dao: { length: 69, haft: 5.2, head: 'dao', tassel: true },
  ji: { length: 78, haft: 5.0, head: 'ji', tassel: true },
  bow: { length: 42, haft: 4.0, head: 'bow' },
}

function plan(
  body: number,
  trim: number,
  gear: number,
  headgear: HeadgearKind,
  weapon: WeaponKind,
  build: Build,
  beard: BeardKind = 'none',
  beardColor?: number,
  cape = false,
  skin?: number,
  face?: FaceKind,
  missingEye = false,
): FigurePlan {
  return {
    build, body, trim, gear, headgear, weapon, beard, beardColor, cape, skin, face, missingEye,
  }
}

/*
 * The five heroes' complexions, from the standard descriptions of them.
 *
 * Zhang Fei's is worth a note. He is 黑脸, the black-faced general, and the
 * obvious reading of that is a near-black skin - except his beard is already
 * near-black (0x181410) and `drawBeard` says in its own comment that a dark
 * beard meeting a dark head once "came out as one black mass with no face in
 * it". So his tone is dark and ruddy and stays clear of the beard, which keeps
 * the face readable while still reading as the darkest of the five.
 */
const SKIN_GUANYU = 0xa8442f      // 面如重枣 - "face like a dark red date"
const SKIN_ZHANGFEI = 0x8a5a3c    // 黑脸, lifted clear of a near-black beard
const SKIN_ZHAOYUN = 0xf4d0ac     // young and fair
const SKIN_HUANGZHONG = 0xd9ad86  // the old general, weathered
const SKIN_WEIYAN = 0xc79a63      // sallow and hard

// 身长九尺 - Guan Yu is the one hero the novel makes a head taller than the
// rest (Zhang Fei and Zhao Yun are 八尺). 1.03 was barely taller than Wei Yan's
// 1.0, and it only read as different while `limbPath` was hollowing every
// torso: with filled bodies the two silhouettes were 9% apart. 1.06 is the
// story's proportion within what the frames and weapon-reach margins allow.
const TALL: Build = { height: 1.06, bulk: 1.02, shoulders: 1.03, head: 0.97 }
const HEAVY: Build = { height: 0.96, bulk: 1.18, shoulders: 1.14, head: 1.04 }
const LEAN: Build = { height: 1.0, bulk: 0.93, shoulders: 0.97, head: 1 }
const VETERAN: Build = { height: 0.96, bulk: 1.0, shoulders: 1.0, head: 1.02 }
const SOLID: Build = { height: 1.0, bulk: 1.06, shoulders: 1.05, head: 0.99 }

/** Rank and file: lighter than a hero, and no cape - they are not the story. */
const GRUNT: Build = { height: 0.94, bulk: 0.95, shoulders: 0.96, head: 1 }
/**
 * Bosses. These are scaled up again by GameScene (124px on screen against a
 * hero's 92), so the build here is about PROPORTION, not size - a boss should
 * read as heavier and squarer, not merely as a hero standing closer.
 */
const BOSS: Build = { height: 1.0, bulk: 1.22, shoulders: 1.18, head: 0.94 }
const BOSS_LEAN: Build = { height: 1.04, bulk: 1.08, shoulders: 1.08, head: 0.94 }
const BOSS_HUGE: Build = { height: 1.02, bulk: 1.34, shoulders: 1.26, head: 0.9 }

/**
 * The five playable heroes. Colours carried over from the pixel cast so the
 * character-select cards, the HUD accents and the figures still agree about
 * who is green and who is purple.
 */
export const HERO_FIGURES: Record<string, FigurePlan> = {
  guanyu: plan(0x2a7a2a, 0xd8c060, 0x1a5a1a, 'hood', 'glaive', TALL, 'long', 0x3a2a18, true, SKIN_GUANYU, 'phoenix'),
  zhangfei: plan(0x8e3520, 0x3a3a3a, 0x1a1a1a, 'band', 'pike', HEAVY, 'full', 0x181410, false, SKIN_ZHANGFEI, 'fierce'),
  zhaoyun: plan(0x2f5fb3, 0xc84a4a, 0xc0c8d4, 'helmet', 'spear', LEAN, 'none', undefined, true, SKIN_ZHAOYUN, 'calm'),
  huangzhong: plan(0xb8860b, 0xe0c060, 0x6a5a1a, 'band', 'bow', VETERAN, 'long', 0xb0b0b0, false, SKIN_HUANGZHONG, 'aged'),
  weiyan: plan(0x6a3a8b, 0xb080d0, 0x4a2a6a, 'turban', 'dao', SOLID, 'none', undefined, false, SKIN_WEIYAN, 'sharp'),
}

/** Wei's rank and file, and the nine bosses. Colours from the pixel cast. */
export const ENEMY_FIGURES: Record<string, FigurePlan> = {
  soldier: plan(0x8b3a2a, 0x5a2a1a, 0x6a5a4a, 'helmet', 'sword', GRUNT),
  spearman: plan(0x5b4a8b, 0x8a7ab0, 0x4a4a6a, 'helmet', 'spear', GRUNT),
  archer: plan(0x3a6b3a, 0x6a9a5a, 0x2a4a2a, 'hood', 'bow', GRUNT),

  /*
   * The nine bosses, given the same treatment as the heroes. Their complexions
   * are DELIBERATELY modest variations around the cast base rather than the
   * heroes' saturated choices: only Xiahou Dun has an iconic complexion cue
   * (the scar), so inventing strong tones for the rest would be colouring for
   * its own sake. What carries them is the face kind and the gear they already
   * had.
   *
   *   李典 Li Dian      the literate, reserved one        calm
   *   夏侯惇 Xiahou Dun hot-tempered, lost an eye         fierce, scarred
   *   許褚 Xu Chu       the "tiger fool", a blunt mass    fierce
   *   曹仁 Cao Ren      the defender of Fan               calm
   *   張遼 Zhang Liao   the dashing awe-inspiring one     phoenix
   *   徐晃 Xu Huang     the disciplined veteran           sharp
   *   張郃 Zhang He     the refined one                   calm
   *   曹操 Cao Cao      the cold, suspicious villain      sharp
   *   呂布 Lu Bu        the mightiest, and the baseline   fierce
   */
  lidian: plan(0x27275e, 0x6a6ab0, 0x14143a, 'helmet', 'glaive', BOSS_LEAN, 'none', undefined, false, 0xe4c09a, 'calm'),
  xiahoudun: plan(0x5e2247, 0xb05a8a, 0x2a0a1a, 'band', 'spear', BOSS, 'full', 0x201018, false, 0xcfa87e, 'fierce', true),
  xuchu: plan(0x6e5a1e, 0xd8bc50, 0x3a2a0a, 'helmet', 'glaive', BOSS_HUGE, 'full', 0x3a2a12, false, 0xc08a68, 'fierce'),
  caoren: plan(0x2f4459, 0x7aa0c0, 0x1a2a3a, 'turban', 'glaive', BOSS, 'none', undefined, false, 0xd4ac84, 'calm'),
  zhangliao: plan(0x1f4a33, 0x5aa87e, 0x0a2a1a, 'helmet', 'spear', BOSS_LEAN, 'none', undefined, true, 0xe0bc94, 'phoenix'),
  xuhuang: plan(0x5e3620, 0xb8864a, 0x2a1a0a, 'band', 'glaive', BOSS, 'long', 0x2a1a10, false, 0xd2a87c, 'sharp'),
  zhanghe: plan(0x2d5a49, 0x6ec0a0, 0x1a2a2a, 'helmet', 'sword', BOSS_LEAN, 'none', undefined, true, 0xe8c4a0, 'calm'),
  caocao: plan(0x452073, 0xc8a828, 0xb8860b, 'crown', 'sword', BOSS, 'long', 0x241a18, true, 0xd8b48c, 'sharp'),
  lubu: plan(0xa82222, 0xe8c828, 0xd0b01a, 'crown', 'ji', BOSS_HUGE, 'none', undefined, true, 0xf0c8a0, 'fierce'),
}
