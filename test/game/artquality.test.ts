import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { CHARACTER_ORDER } from '../../src/core/characters'
import { ENEMIES } from '../../src/core/enemies'
import {
  ENEMY_FIGURES,
  HERO_FIGURES,
  WEAPONS,
  type FigurePlan,
  type WeaponKind,
} from '../../src/game/art/figures'
import { STAGES } from '../../src/core/stage'
import {
  VECTOR_ART,
  artBoxFor,
  drawKindPose,
  isVectorProp,
  vectorKinds,
} from '../../src/game/art/registry'
import { faceLayout, headRadius } from '../../src/game/art/draw'
import { SKIN, TASSEL, shade } from '../../src/game/art/palette'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { BODY_X, FIG_H, FIG_W, applyBuild } from '../../src/game/art/rig'
import { POSES } from '../../src/game/adapters/sprites'
import mookPrepared from '../../src/game/assets/mook-bodies/prepared.json'
import {
  assessSprite,
  assessWeaponReach,
  opaqueBounds,
  rowRuns,
  type SpriteImage,
} from '../../vision/sprite-metrics'
import {
  CHARACTER_SPRITE_THRESHOLDS,
  MIN_WEAPON_REACH_PX,
  PROP_SPRITE_THRESHOLDS,
} from '../../vision/thresholds'

/**
 * The same gate `npm run vision` runs against the live textures, applied here
 * to the source art. The browser gate is the backstop; this one fails in
 * milliseconds while the art is being drawn, which is where a legibility
 * problem is cheapest to catch.
 */

const ALL_KINDS = vectorKinds()
const PROP_KINDS = ALL_KINDS.filter((k) => isVectorProp(k))
const CHARACTER_KINDS = ALL_KINDS.filter((k) => !isVectorProp(k))
/**
 * Floor for how different two poses must look, as symmetric difference over
 * union of their silhouettes. A pose that reuses another's joint table scores
 * ~0; the weakest armed kind in the cast scores 0.31, and `idle` against
 * `walk0` - the pair everyone reads as visibly different - scores 0.395.
 */
const MIN_POSE_DIFFERENCE = 0.15

/**
 * Mean absolute luma difference between two heroes' rendered faces.
 *
 * Identical faces score 0 and the closest real pair is Guan Yu against Zhang
 * Fei at 26.9, both dark-complexioned. The negative control this was built
 * against - giving all five heroes one skin tone - drops the closest pair to
 * 11.2, so the floor sits between the failure mode and the population rather
 * than snug against either.
 */
const MIN_FACE_PAIR_DIFFERENCE = 18

/**
 * NO MARK-STRUCTURE METRIC HERE, and the reason is worth keeping.
 *
 * "The face has marks on it" was the obvious second half, and five pixel
 * metrics were tried against a deliberately faceless build: fraction of pixels
 * below the crop's own median (0.137-0.455 against a flat control of 0.000),
 * local 5x5 contrast, count of discrete dark blobs, an absolute luma
 * threshold, and a match against the exact eye colour. None separated a real
 * face from a blank one with enough margin to gate on - the best was Guan Yu
 * at 43 against 38.
 *
 * The cause is structural, not a tuning failure. The face window necessarily
 * contains the hood or band, the cel shadow band and the beard's edge, and in
 * a flat cel pipeline those are made of the same dark pixels the marks are. A
 * metric that cannot fail when the marks are actually removed is the exact
 * defect this repository has already removed two gates for, so it is better
 * to have no metric here and say so than to have one that passes anything.
 *
 * What covers the face instead is the pair-difference above, which does
 * discriminate; and the rendered result is judged by eye.
 */

/** The horse carries no weapon, and its attack pose aliases idle by design. */
const ARMED_KINDS = CHARACTER_KINDS.filter((k) => k !== 'horse')

/**
 * NON-VACUITY GUARD.
 *
 * Every test below iterates a derived list of kinds, so an empty list makes all
 * of them pass over zero iterations - green, silent, and proving nothing. That
 * is the precise failure UI-FIX-1 was written to remove, and converting the
 * cast between registries is exactly the kind of change that could bring it
 * back. These numbers are what the game ships; a kind added or removed should
 * fail here and be updated deliberately.
 */
describe('the art gate has art to judge', () => {
  it('covers the whole cast', () => {
    expect(CHARACTER_KINDS.length, 'characters including the horse').toBe(18)
    expect(PROP_KINDS.length, 'props').toBe(4)
    expect(POSES.length, 'poses per character').toBe(14)
    // Every kind the game can spawn must be drawable, or it renders nothing.
    for (const kind of [...CHARACTER_ORDER, ...Object.keys(ENEMIES), 'horse']) {
      expect(ALL_KINDS, `no art for ${kind}`).toContain(kind)
    }
  })

  it('every kind any stage can spawn has art', () => {
    // GameScene no longer registers the whole cast for every stage - it derives
    // the list from the stage's own spawn tables, which cut 52MB of textures to
    // a fraction. The risk that trades for is a stage introducing a kind with
    // no art and spawning something invisible, so it is checked here, where it
    // costs nothing.
    const declared = new Set<string>()
    const stages = Object.values(STAGES)
    expect(stages.length, 'no stages found').toBeGreaterThan(8)
    for (const stage of stages) {
      for (const wave of stage.waves) for (const sp of wave.spawns) declared.add(sp.kind)
      for (const sp of stage.props) declared.add(sp.kind)
      declared.add(stage.bossKind)
    }
    // Loot and archer fire appear without any stage mentioning them.
    for (const kind of ['arrow', 'meat', 'sword']) declared.add(kind)
    expect(declared.size, 'no stage spawn kinds found').toBeGreaterThan(8)
    for (const kind of [...declared].sort()) {
      expect(ALL_KINDS, `stages can spawn ${kind} but nothing draws it`).toContain(kind)
    }
  })
})

/** Rasterize one pose at the density the game ships. */
const SCALE = 2
function raster(kind: string, pose: PoseName): SpriteImage {
  const box = artBoxFor(kind, pose)
  if (!box) throw new Error(`no art box for ${kind}`)
  const width = box.width * SCALE
  const height = box.height * SCALE
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  drawKindPose(ctx as unknown as CanvasRenderingContext2D, kind, pose, SCALE)
  return { width, height, data: new Uint8Array(ctx.getImageData(0, 0, width, height).data) }
}

/** Horizontal centre of a figure's lowest drawn rows, relative to its box
 * centre - where the character appears to stand. Null if nothing is drawn. */
function footOffset(kind: string, pose: PoseName): number | null {
  const box = artBoxFor(kind, pose)
  if (!box) return null
  const img = raster(kind, pose)
  const b = opaqueBounds(img)
  if (!b) return null
  let lo = img.width
  let hi = -1
  for (let y = Math.max(b.y0, b.y1 - 6); y <= b.y1; y += 1) {
    for (const [a, c] of rowRuns(img, y)) {
      if (a < lo) lo = a
      if (c > hi) hi = c
    }
  }
  if (hi < 0) return null
  return (lo + hi) / 2 / SCALE - box.width / 2
}

describe('character art reads as characters', () => {
  it('every character pose passes the sprite legibility gate', () => {
    const failures: string[] = []
    for (const kind of CHARACTER_KINDS) {
      for (const pose of POSES) {
        const r = assessSprite(raster(kind, pose as PoseName), `${kind}:${pose}`, CHARACTER_SPRITE_THRESHOLDS)
        if (!r.pass) failures.push(`${r.label}: ${r.failures.join('; ')}`)
      }
    }
    expect(failures).toEqual([])
  })

  it('every prop passes the prop legibility gate', () => {
    const failures: string[] = []
    for (const kind of PROP_KINDS) {
      const r = assessSprite(raster(kind, 'idle'), `${kind}:idle`, PROP_SPRITE_THRESHOLDS)
      if (!r.pass) failures.push(`${r.label}: ${r.failures.join('; ')}`)
    }
    expect(failures).toEqual([])
  })

  it('every armed character shows its weapon in the attack pose', () => {
    // ALL FIVE strike poses reach: the historical `attack`/`attack2` plus the
    // ENH-5 thrust, chop and sweep. `windup` and `recover` are retracted BY
    // DESIGN and must never be added here - they are gated the other way
    // (strictly narrower than the strikes) in the test below, and a reach
    // floor on them would forbid the retract this task exists for.
    const failures: string[] = []
    for (const kind of ARMED_KINDS) {
      for (const strike of ['attack', 'attack2', 'thrust', 'chop', 'sweep'] as const) {
        const r = assessWeaponReach(
          raster(kind, 'idle'),
          raster(kind, strike),
          `${kind}:${strike}`,
          MIN_WEAPON_REACH_PX * SCALE,
        )
        if (!r.pass) failures.push(`${r.label}: ${r.failures.join('; ')}`)
      }
    }
    expect(failures).toEqual([])
  })

  it('windup and recover sit visibly narrower than either strike', () => {
    // THE ANTI-STATIC GATE. A swing that never retracts is the defect ART-11
    // removes, so the withdrawn phases must be narrower than EACH strike by at
    // least the same threshold the reach gate demands the other way - the
    // retract has to be the same order of visibility as the reach, or
    // consecutive hits still read as one held pose.
    const failures: string[] = []
    for (const kind of ARMED_KINDS) {
      for (const strike of ['attack', 'attack2', 'thrust', 'chop', 'sweep'] as const) {
        const strikeImg = raster(kind, strike)
        for (const withdrawn of ['windup', 'recover'] as const) {
          const r = assessWeaponReach(
            raster(kind, withdrawn),
            strikeImg,
            `${kind}:${withdrawn}-vs-${strike}`,
            MIN_WEAPON_REACH_PX * SCALE,
          )
          if (!r.pass) failures.push(`${r.label}: ${r.failures.join('; ')}`)
        }
      }
    }
    expect(failures).toEqual([])
  })

  it('every hero carries the weapon history gave them', () => {
    // The novel/folk standard the owner chose for ART-12. The assignments are
    // data, so this gate is data too - it exists so a future rebalance cannot
    // silently hand Zhang Fei a jian.
    expect(HERO_FIGURES.guanyu?.weapon, '关羽 青龙偃月刀').toBe('glaive')
    expect(HERO_FIGURES.zhangfei?.weapon, '张飞 丈八蛇矛').toBe('pike')
    expect(HERO_FIGURES.zhaoyun?.weapon, '赵云 亮银枪').toBe('spear')
    expect(HERO_FIGURES.huangzhong?.weapon, '黄忠 the archer').toBe('bow')
    expect(HERO_FIGURES.weiyan?.weapon, '魏延 folk 大刀').toBe('dao')
    expect(ENEMY_FIGURES.lubu?.weapon, '呂布 方天画戟').toBe('ji')
    expect(ENEMY_FIGURES.caocao?.weapon, '曹操 倚天剑 stays a jian').toBe('sword')
    // The length ladder, longest first: 丈八蛇矛 is the longest weapon in the
    // novel - a zhang eight - and the spear sits a clear 10 units under it.
    // The old table had the spear (78) LONGER than the pike (74), backwards.
    const ladder = ['bow', 'sword', 'dao', 'spear', 'glaive', 'ji', 'pike'] as const
    for (let i = 1; i < ladder.length; i += 1) {
      const upper = WEAPONS[ladder[i] as WeaponKind]
      const lower = WEAPONS[ladder[i - 1] as WeaponKind]
      expect(upper.length, `${ladder[i]} broke the length ladder`).toBeGreaterThan(lower.length)
    }
    expect(WEAPONS.pike.length - WEAPONS.spear.length, '丈八 must lead by a clear gap').toBeGreaterThanOrEqual(10)
    // 红缨 on every polearm that carries one, and never on the sidearms.
    for (const kind of ['glaive', 'pike', 'spear', 'ji', 'dao'] as const) {
      expect(WEAPONS[kind].tassel, `${kind} carries the red tassel`).toBe(true)
    }
    expect(WEAPONS.sword.tassel, 'a jian carries no tassel').toBeUndefined()
  })

  it('the red tassel is visible at the socket of every polearm', () => {
    // 红缨 is the one signature mark this task added, and the cheapest to lose
    // to a future edit: a deleted `if (spec.tassel)` draws nothing and every
    // shape gate stays green. So it gets its own probe - rendered pixels in
    // the tassel's own colours, inside the window the socket must occupy in
    // the attack pose, where the weapon lies horizontal and clear of the body.
    const tasselFam = [TASSEL, shade(TASSEL, 0.3), shade(TASSEL, 0.34)]
    const near = (r: number, g: number, b: number, target: number): boolean => {
      const tr = (target >> 16) & 0xff
      const tg = (target >> 8) & 0xff
      const tb = target & 0xff
      return Math.hypot(r - tr, g - tg, b - tb) < 24
    }
    const failures: string[] = []
    const counted: string[] = []
    for (const kind of ARMED_KINDS) {
      const entry = VECTOR_ART[kind]
      if (!entry || entry.type !== 'figure') continue
      if (!WEAPONS[entry.plan.weapon].tassel) continue
      const posed = applyBuild(POSE_TABLE.attack, entry.plan.build)
      const spec = WEAPONS[entry.plan.weapon]
      const socketDist = spec.length * (1 - posed.weaponGrip) - 7.5
      const cx = posed.handN.x + socketDist * Math.cos(posed.weaponRot)
      const cy = posed.handN.y + socketDist * Math.sin(posed.weaponRot)
      const img = raster(kind, 'attack')
      const box = artBoxFor(kind, 'attack')
      if (!box) continue
      // Raster coords: the box is symmetric about the figure, and the pose
      // space sits under a HEADROOM band - both recoverable from the box.
      const px = Math.round((img.width / SCALE / 2 + (cx - BODY_X)) * SCALE)
      const py = Math.round((cy + box.height - FIG_H) * SCALE)
      let hits = 0
      for (let y = Math.max(0, py - 18); y <= Math.min(img.height - 1, py + 18); y += 1) {
        for (let x = Math.max(0, px - 20); x <= Math.min(img.width - 1, px + 20); x += 1) {
          const i = (y * img.width + x) * 4
          const a = img.data[i + 3] ?? 0
          if (a < 200) continue
          const r = img.data[i] ?? 0
          const g = img.data[i + 1] ?? 0
          const b = img.data[i + 2] ?? 0
          if (tasselFam.some((t) => near(r, g, b, t))) hits += 1
        }
      }
      counted.push(`${kind}:${hits}`)
      // The tuft is ~5x8 pose units = ~100 device px lit, less the ink edges.
      // Zhao Yun's red TRIM (0xc84a4a) sits 32 away from the tassel - outside
      // the 24 tolerance - so this cannot be satisfied by his sash instead.
      if (hits < 30) failures.push(`${kind}: only ${hits} tassel pixels at the socket`)
    }
    // Non-vacuity: twelve kinds carry a tassel (three heroes + nine enemies,
    // Wei Yan's 大刀 joined at ART-13).
    expect(counted.length, 'no tasseled kinds found').toBe(12)
    expect(failures).toEqual([])
  })

  it('no weapon crosses the head in the walk cycle', () => {
    // ART-8 caught the walk1 blade passing over the head as a one-off
    // measurement; this makes it permanent, because ART-12 just changed every
    // weapon's envelope. The tassel counts too: a red tuft over the face is
    // the same defect, and a steel-only probe would be blind to it. Each kind
    // is compared against ITS OWN idle baseline so helmet steel that
    // legitimately sits in the head oval does not fail the walk.
    const fam = [0xc8d0dc, shade(0xc8d0dc, 0.3), TASSEL, shade(TASSEL, 0.3), shade(TASSEL, 0.34)]
    const near = (r: number, g: number, b: number, target: number): boolean => {
      const tr = (target >> 16) & 0xff
      const tg = (target >> 8) & 0xff
      const tb = target & 0xff
      return Math.hypot(r - tr, g - tg, b - tb) < 24
    }
    const crossings = (kind: string, pose: PoseName): number => {
      const entry = VECTOR_ART[kind]
      if (!entry || entry.type !== 'figure') return 0
      const posed = applyBuild(POSE_TABLE[pose], entry.plan.build)
      const rx = headRadius(entry.plan) * SCALE
      const img = raster(kind, pose)
      const box = artBoxFor(kind, pose)
      if (!box) return 0
      const hcx = (img.width / SCALE / 2 + (posed.head.x - BODY_X)) * SCALE
      const hcy = (posed.head.y + box.height - FIG_H) * SCALE
      let hits = 0
      for (let y = 0; y < img.height; y += 1) {
        for (let x = 0; x < img.width; x += 1) {
          const dx = x - hcx
          const dy = (y - hcy) / 1.14
          if (dx * dx + dy * dy > rx * rx) continue
          const i = (y * img.width + x) * 4
          if ((img.data[i + 3] ?? 0) < 200) continue
          const r = img.data[i] ?? 0
          const g = img.data[i + 1] ?? 0
          const b = img.data[i + 2] ?? 0
          if (fam.some((t) => near(r, g, b, t))) hits += 1
        }
      }
      return hits
    }
    const failures: string[] = []
    const measured: string[] = []
    for (const kind of ARMED_KINDS) {
      const idle = crossings(kind, 'idle')
      for (const pose of ['walk0', 'walk1'] as const) {
        const n = crossings(kind, pose)
        measured.push(`${kind}:${pose}=${n}(idle ${idle})`)
        // ART-8's broken state measured ~1000px over the head and its fixed
        // baseline sat at 0-50; the slack covers pose noise, not defects.
        if (n > idle + 60) failures.push(`${kind}:${pose} crosses the head (${n} vs idle ${idle})`)
      }
    }
    expect(measured.length, 'no walks measured').toBe(ARMED_KINDS.length * 2)
    expect(failures).toEqual([])
  })

  it('no art is clipped by its own frame', () => {
    // The check `assessWeaponReach` cannot make. It compares drawn widths, so a
    // blade cut off at the border still widens the silhouette and reads as
    // reach - which is exactly what happened: every attack pose lost its weapon
    // head to the frame edge and the reach gate passed them all, by 56 pixels.
    // Truncation and reach look identical from outside the frame; the
    // difference is whether ink is sitting ON the border.
    const failures: string[] = []
    for (const kind of ALL_KINDS) {
      const poses: readonly string[] = isVectorProp(kind) ? ['idle'] : POSES
      for (const pose of poses) {
        const img = raster(kind, pose as PoseName)
        const b = opaqueBounds(img)
        if (!b) {
          failures.push(`${kind}:${pose} draws nothing`)
          continue
        }
        const bad: string[] = []
        if (b.x0 <= 0) bad.push('left')
        if (b.y0 <= 0) bad.push('top')
        if (b.x1 >= img.width - 1) bad.push('right')
        // The feet are meant to sit on the bottom edge; nothing else may touch.
        if (bad.length > 0) failures.push(`${kind}:${pose} is clipped at ${bad.join(', ')}`)
      }
    }
    expect(failures).toEqual([])
  })

  it('every figure stands where its box says it does', () => {
    // Sprites are anchored bottom-CENTRE, so where a figure's feet sit inside
    // its box is where the character appears to stand. Nothing checked this,
    // and the boxes carry a lot of margin - a pose drawn off-centre would make
    // the fighter jump sideways for one frame of the walk cycle, which reads as
    // a glitch and which no shape or colour metric can see.
    //
    // Measured: -5.5 to +7.5 units, the extremes all on `hurt`, where the body
    // deliberately recoils. The bound is set clear of that rather than on it.
    const MAX_FOOT_OFFSET = 12
    const offenders: string[] = []
    for (const kind of CHARACTER_KINDS) {
      for (const pose of POSES) {
        // A floored figure lies across its box; "feet" means nothing there.
        if (pose === 'down') continue
        const offset = footOffset(kind, pose as PoseName)
        if (offset !== null && Math.abs(offset) > MAX_FOOT_OFFSET) {
          offenders.push(`${kind}:${pose} stands ${Math.round(offset * 10) / 10} units off centre`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('the walk cycle does not shift the figure sideways', () => {
    // Tighter than the centring bound above, and aimed at a different failure.
    // idle, walk0 and walk1 alternate three times a second during play, so a
    // few units of disagreement between them reads as a fighter vibrating -
    // where the same offset in a one-off pose like `hurt` reads as recoil.
    //
    // This matters most for the per-pose box widths: those three poses now sit
    // in a narrower box than `attack` does, and getting the centring wrong
    // would show up here first. Measured 0.8 units, which is sub-pixel on
    // screen; the bound is 2.
    const MAX_CYCLE_SHIFT = 2
    const offenders: string[] = []
    for (const kind of CHARACTER_KINDS) {
      const centres = (['idle', 'walk0', 'walk1'] as const)
        .map((pose) => footOffset(kind, pose))
        .filter((v): v is number => v !== null)
      if (centres.length < 3) continue
      const spread = Math.max(...centres) - Math.min(...centres)
      if (spread > MAX_CYCLE_SHIFT) {
        offenders.push(`${kind} shifts ${Math.round(spread * 10) / 10} units across its walk cycle`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('the five heroes are pairwise distinct, not palette swaps', () => {
    // Compared on the ALPHA MASK, so colour cannot contribute at all: two
    // fighters who differ only in palette score zero here. The old version
    // compared palette-indexed ASCII maps, where a recoloured copy WOULD have
    // looked different - it was measuring the art's storage format rather than
    // the picture.
    const masks = new Map<string, SpriteImage>(CHARACTER_ORDER.map((k) => [k, raster(k, 'idle')]))
    for (let i = 0; i < CHARACTER_ORDER.length; i += 1) {
      for (let j = i + 1; j < CHARACTER_ORDER.length; j += 1) {
        const a = CHARACTER_ORDER[i] as string
        const b = CHARACTER_ORDER[j] as string
        const ia = masks.get(a)
        const ib = masks.get(b)
        if (!ia || !ib) throw new Error('missing hero art')
        let differing = 0
        let total = 0
        for (let px = 0; px < ia.width * ia.height; px += 1) {
          const alphaA = (ia.data[px * 4 + 3] ?? 0) >= 128
          const alphaB = (ib.data[px * 4 + 3] ?? 0) >= 128
          if (!alphaA && !alphaB) continue
          total += 1
          if (alphaA !== alphaB) differing += 1
        }
        const frac = total === 0 ? 0 : differing / total
        expect(frac, `${a} vs ${b} silhouettes only ${Math.round(frac * 100)}% different`).toBeGreaterThan(0.1)
      }
    }
  })

  it('legs never merge into a single mass during a walk cycle', () => {
    // The horse's walk1 frame once placed its paired legs two pixels apart and
    // the outline pass closed the gap, so four legs rendered as two blobs for
    // one frame of every cycle.
    //
    // The original form of this test compared the leg count against idle. That
    // worked while every foot was planted, and stopped meaning anything once
    // the rig had a real stride: a lifted foot legitimately leaves the sample
    // row, so the count changes for a good reason and the test fires for a bad
    // one. What it was actually protecting is that the legs stay SEPARATE, so
    // that is what it asserts - scanning the lower third rather than one row,
    // since which row crosses all the legs depends on the pose.
    const maxRuns = (img: SpriteImage): number => {
      const b = opaqueBounds(img)
      if (!b) return 0
      let best = 0
      const from = Math.round(b.y0 + (b.y1 - b.y0) * 0.66)
      for (let y = from; y <= b.y1; y += 1) {
        const runs = rowRuns(img, y).length
        if (runs > best) best = runs
      }
      return best
    }
    for (const kind of CHARACTER_KINDS) {
      // A horse has four legs in two pairs, so at some row it shows at least
      // three masses unless a pair has merged. A biped shows two.
      const floor = kind === 'horse' ? 3 : 2
      for (const pose of ['idle', 'walk0', 'walk1'] as const) {
        expect(maxRuns(raster(kind, pose)), `${kind}:${pose} legs have merged`).toBeGreaterThanOrEqual(floor)
      }
    }
  })

  it('walk frames differ from each other so the cycle animates', () => {
    for (const kind of CHARACTER_KINDS) {
      const w0 = raster(kind, 'walk0')
      const w1 = raster(kind, 'walk1')
      let differing = 0
      for (let px = 0; px < w0.width * w0.height; px += 1) {
        if ((w0.data[px * 4 + 3] ?? 0) !== (w1.data[px * 4 + 3] ?? 0)) differing += 1
      }
      // A meaningful stride, not a one-pixel nudge: the frames alternate every
      // ten ticks, so a cycle that barely moves reads as a figure vibrating.
      expect(differing, `${kind} walk frames barely differ`).toBeGreaterThan(w0.width * w0.height * 0.008)
    }
  })

  /**
   * A pose has to LOOK like the state it stands for.
   *
   * `hurt` and `special` were added as distinct poses, and a pose that quietly
   * reuses another's joint table still produces a texture, still gets a key,
   * and still passes every count, legibility and clipping check in this file -
   * it just tells the player nothing. Recoil that looks like standing still,
   * or a special that looks like an ordinary swing, is a readability failure
   * of exactly the kind this gate exists to catch, and nothing here covered it:
   * the walk-cycle test above is the only pose comparison, and it compares the
   * one pair that already differs by construction.
   *
   * Scored as symmetric difference over union of the two alpha masks, so it is
   * a shape comparison rather than a pixel-for-pixel one. The reference point
   * is the pair everyone accepts as visibly different: `idle` against `walk0`
   * scores 0.395 on average. The pairs below score 0.539 and 0.464.
   */
  it('poses that could be confused with each other are visibly different', () => {
    // Boxes differ in WIDTH per pose - a thrust is given margin a stand is not
    // - and every box is symmetric about the figure, so aligning box centres
    // aligns the figures inside them. Heights are uniform by design.
    const shapeDifference = (kind: string, a: PoseName, bPose: PoseName): number => {
      const ia = raster(kind, a)
      const ib = raster(kind, bPose)
      expect(ia.height, `${kind}: ${a} and ${bPose} boxes differ in height`).toBe(ib.height)
      const half = Math.round((ia.width - ib.width) / 2)
      let inter = 0
      let union = 0
      for (let y = 0; y < ia.height; y += 1) {
        for (let x = 0; x < ia.width; x += 1) {
          const onA = (ia.data[(y * ia.width + x) * 4 + 3] ?? 0) >= 32
          const bx = x - half
          const onB =
            bx >= 0 && bx < ib.width && (ib.data[(y * ib.width + bx) * 4 + 3] ?? 0) >= 32
          if (onA && onB) inter += 1
          if (onA || onB) union += 1
        }
      }
      return union === 0 ? 0 : 1 - inter / union
    }

    // The pairs a player is most likely to mistake for one another: a recoil
    // against standing still, and a special against the ordinary attack - plus
    // every boundary of the phased swing, which must read as motion rather
    // than as one held pose. `windup` against `idle` is the dangerous pair
    // (both withdrawn): if the pose does not clear the floor, the POSE is
    // redrawn, never the floor.
    //
    // ENH-5 extends the strike family to five. Each new strike is paired
    // against idle, both withdrawn phases, both historical strikes, and its
    // new siblings: a thrust that is the attack again, or a chop the windup
    // again, tells the player nothing and fails here.
    const PAIRS: Array<[PoseName, PoseName]> = [
      ['idle', 'hurt'],
      ['attack', 'special'],
      ['windup', 'attack'],
      ['attack', 'recover'],
      ['windup', 'recover'],
      ['attack', 'attack2'],
      ['windup', 'idle'],
      ['idle', 'thrust'],
      ['idle', 'chop'],
      ['idle', 'sweep'],
      ['windup', 'thrust'],
      ['windup', 'chop'],
      ['windup', 'sweep'],
      ['thrust', 'recover'],
      ['chop', 'recover'],
      ['sweep', 'recover'],
      ['attack', 'thrust'],
      ['attack', 'chop'],
      ['attack', 'sweep'],
      ['attack2', 'thrust'],
      ['attack2', 'chop'],
      ['attack2', 'sweep'],
      ['thrust', 'chop'],
      ['thrust', 'sweep'],
      ['chop', 'sweep'],
    ]
    const scores: string[] = []
    for (const kind of ARMED_KINDS) {
      for (const [a, bPose] of PAIRS) {
        const d = shapeDifference(kind, a, bPose)
        scores.push(`${kind} ${a}/${bPose} ${d.toFixed(3)}`)
        // The failure mode is a pose table reused verbatim, which scores ~0.
        // The floor sits just above that rather than just under the measured
        // population, whose weakest armed kind is 0.31.
        expect(d, `${kind}: the ${bPose} pose is the ${a} pose again`).toBeGreaterThan(
          MIN_POSE_DIFFERENCE,
        )
      }
    }
    expect(scores.length, 'no poses compared').toBe(ARMED_KINDS.length * PAIRS.length)
    // Heavy: ARMED_KINDS x 22 pairs x 2 rasters; the painted materials push
    // it past the 5s default under full-suite contention (documented as a
    // "flake" for months - it was always this timeout).
  }, 30_000)

  /**
   * The five heroes have their own faces.
   *
   * Before this the whole cast had ONE skin tone - `SKIN` was a module
   * constant that `materials()` hard-coded, and `FigurePlan` had no complexion
   * field at all - so Guan Yu's 面如重枣 and Zhang Fei's 黑脸 were not merely
   * missing, they were inexpressible. None of that is visible to any other
   * check in this file: a figure with a blank face still has a silhouette,
   * still has limbs, still stands where its box says, and still shows weapon
   * reach.
   */
  it('the five heroes have their own faces', () => {
    // 1. The structure. Each hero declares a complexion, and no two agree.
    const skins = CHARACTER_ORDER.map((k) => HERO_FIGURES[k]?.skin)
    for (const [i, kind] of CHARACTER_ORDER.entries()) {
      expect(skins[i], `${kind} declares no complexion, so it gets the cast default`).toBeDefined()
    }
    for (let i = 0; i < skins.length; i += 1) {
      for (let j = i + 1; j < skins.length; j += 1) {
        expect(
          skins[i],
          `${CHARACTER_ORDER[i]} and ${CHARACTER_ORDER[j]} were given the same complexion`,
        ).not.toBe(skins[j])
      }
    }

    // 2. And it reaches the art. Rendered face crops, compared as luminance.
    const faceCrop = (kind: string): number[] => {
      const img = raster(kind, 'idle')
      const box = artBoxFor(kind, 'idle')
      if (!box) throw new Error(`no art box for ${kind}`)
      // Margin and headroom are private to the registry but both fall out of
      // the box: width is FIG_W + margin*2, height is FIG_H + headroom.
      const margin = (box.width - FIG_W) / 2
      const headroom = box.height - FIG_H
      const r = 10.4 * (HERO_FIGURES[kind]?.build.head ?? 1) * SCALE
      // The BUILD-APPLIED head, not the raw pose. `applyBuild` moves the head by
    // the hero's height - 12.69 for Guan Yu against 18.08 for Zhang Fei - so a
    // crop anchored on the raw 15 lands somewhere different on every face:
    // Guan Yu's missed his eyes entirely and reached into his beard, while
    // Zhang Fei's and Huang Zhong's excluded the mouth. The gate passed
    // throughout, which is the point - it was comparing different parts of
    // different faces.
    const plan = HERO_FIGURES[kind]
    if (!plan) throw new Error(`no hero ${kind}`)
    const built = applyBuild(POSE_TABLE.idle, plan.build)
    const cx = (margin + built.head.x) * SCALE
      const cy = (headroom + built.head.y) * SCALE
      // Clear of the beard, whose top edge sits at about +0.85R. A crop that
      // reached +0.8R clipped into it and every dark-complexioned hero then
      // had non-face dark pixels in the window.
      const out: number[] = []
      for (let y = Math.round(cy + r * 0.05); y < Math.round(cy + r * 0.66); y += 1) {
        for (let x = Math.round(cx - r * 0.7); x < Math.round(cx + r * 1.0); x += 1) {
          const i = (y * img.width + x) * 4
          out.push(
            0.299 * (img.data[i] ?? 0) + 0.587 * (img.data[i + 1] ?? 0) + 0.114 * (img.data[i + 2] ?? 0),
          )
        }
      }
      return out
    }
    const crops: Record<string, number[]> = {}
    for (const kind of CHARACTER_ORDER) crops[kind] = faceCrop(kind)

    // Identical faces score 0; the closest real pair is Guan Yu against Zhang
    // Fei at 26.9, both dark-complexioned. Giving all five one tone - the
    // negative control this was built against - drops the closest pair to
    // 11.2, so the floor sits between the failure mode and the population
    // rather than at either end.
    for (let i = 0; i < CHARACTER_ORDER.length; i += 1) {
      for (let j = i + 1; j < CHARACTER_ORDER.length; j += 1) {
        const a = crops[CHARACTER_ORDER[i] ?? ''] ?? []
        const b = crops[CHARACTER_ORDER[j] ?? ''] ?? []
        expect(a.length, 'empty face crop').toBeGreaterThan(0)
        let sum = 0
        for (let n = 0; n < a.length; n += 1) sum += Math.abs((a[n] ?? 0) - (b[n] ?? 0))
        expect(
          sum / a.length,
          `${CHARACTER_ORDER[i]} and ${CHARACTER_ORDER[j]} have the same face`,
        ).toBeGreaterThan(MIN_FACE_PAIR_DIFFERENCE)
      }
    }
  })


  /**
   * The nine bosses get the same treatment as the heroes, and the rank and
   * file deliberately does not.
   *
   * The bosses are as famous as the playable five and the player fights one at
   * the end of every stage. The rank-and-file keep the shared tone ON PURPOSE:
   * they are uniformed troops, and a shared complexion is what makes the
   * player read as an individual against them.
   */
  it('the nine bosses have their own faces, and the rank and file does not', () => {
    const bosses = Object.keys(ENEMIES).filter((k) => ENEMIES[k]?.boss !== undefined)
    expect(
      bosses.length,
      'nine bosses are expected - a new one should be given a face deliberately',
    ).toBe(9)
    const skins = bosses.map((k) => ENEMY_FIGURES[k]?.skin)
    const faces = bosses.map((k) => ENEMY_FIGURES[k]?.face)
    for (const [i, kind] of bosses.entries()) {
      expect(skins[i], kind + ' declares no complexion').toBeDefined()
      expect(faces[i], kind + ' declares no face kind').toBeDefined()
    }
    // Two bosses never share a complexion. The player meets them one stage at
    // a time, but the cast renders side by side, and a shared tone over a
    // shared face kind is how the old cast ended up reading as one man.
    for (let i = 0; i < bosses.length; i += 1) {
      for (let j = i + 1; j < bosses.length; j += 1) {
        expect(skins[i], bosses[i] + ' and ' + bosses[j] + ' share a complexion').not.toBe(skins[j])
      }
    }
    // The rank and file keeps the plain face - but since BODY-4 each mook
    // carries a MEASURED complexion, sampled from its painted hands, so the
    // procedural face meets the painted body. The committed plan tone must
    // equal the pack's recorded skin exactly: drift either side reopens the
    // head/hand mismatch the measurement closed.
    for (const kind of ['soldier', 'spearman', 'archer'] as const) {
      expect(
        ENEMY_FIGURES[kind]?.skin,
        kind + ' declares no measured complexion',
      ).toBeDefined()
      const recorded = (mookPrepared as Record<string, { skin: string }>)[kind]?.skin
      expect(
        ENEMY_FIGURES[kind]?.skin,
        kind + ' plan tone drifted from its painted pack',
      ).toBe(recorded ? parseInt(recorded.slice(1), 16) : undefined)
      expect(
        ENEMY_FIGURES[kind]?.face,
        kind + ' is a uniformed troop and keeps the plain face',
      ).toBeUndefined()
    }
    // Xiahou Dun's missing eye is DECLARED, not implied by his face kind - two
    // other bosses are also fierce, and only he has the wound.
    expect(ENEMY_FIGURES['xiahoudun']?.missingEye, 'xiahoudun is the one-eyed general').toBe(true)
    for (const kind of bosses.filter((k) => k !== 'xiahoudun')) {
      expect(ENEMY_FIGURES[kind]?.missingEye, kind + ' is not the one-eyed general').toBeFalsy()
    }
  })

  it('bosses are drawn heavier than the grunts they lead', () => {
    // The old gate compared map width times scale, which is a property of the
    // frame. This counts drawn pixels, which is a property of the fighter.
    const bulk = (kind: string): number => {
      const img = raster(kind, 'idle')
      let opaque = 0
      for (let px = 0; px < img.width * img.height; px += 1) {
        if ((img.data[px * 4 + 3] ?? 0) >= 128) opaque += 1
      }
      return opaque
    }
    const soldier = bulk('soldier')
    const bosses = Object.keys(ENEMIES).filter((k) => ENEMIES[k]?.boss !== undefined)
    expect(bosses.length, 'no bosses found to compare').toBeGreaterThan(0)
    for (const kind of bosses) {
      expect(bulk(kind), `${kind} is no heavier than a soldier`).toBeGreaterThan(soldier)
    }
  })
  /**
   * The face is painted on SKIN, not on the headgear.
   *
   * ART-7. A helmet's lower edge reaches +0.342R at the near-eye column and a
   * turban's +0.196R, while the brow sat at 0 and the eye at +0.20R - so two
   * of the five heroes, and most of the cast, had their brow and much of an
   * eye painted onto steel or cloth. It was never caught because every sprite
   * gate here is about SHAPE, and the face does not change the silhouette.
   *
   * Probed per kind rather than at one fixed height, because the band of skin
   * between brim and brow sits somewhere different for every headgear; the
   * position comes from `faceLayout`, the same thing the drawing uses.
   */
  it('paints the face on skin rather than on the headgear', () => {
    const SKIN_TONES = (skin: number): number[][] => {
      const bands: Array<[number[], number]> = [
        [[22, 14, 30], 0.34],
        [[255, 246, 228], 0.17],
      ]
      const out: number[][] = []
      for (const step of [skin, shade(skin, 0.22), shade(skin, 0.45)]) {
        const c = [(step >> 16) & 255, (step >> 8) & 255, step & 255]
        out.push(c)
        for (const [o, a] of bands) {
          out.push(c.map((v, i) => Math.round(a * (o[i] ?? 0) + (1 - a) * v)))
        }
      }
      return out
    }
    const plans: Array<[string, FigurePlan]> = [
      ...Object.entries(HERO_FIGURES),
      ...Object.entries(ENEMY_FIGURES),
    ]
    let checked = 0
    for (const [kind, plan] of plans) {
      // IDLE only, and that is a measured choice rather than laziness. The face
      // and the headgear both hang off `p.head` and `p.headRot`, so their
      // geometry RELATIVE TO EACH OTHER is invariant under the head turning -
      // which is the whole of what this gate claims. Running it over all eight
      // poses was tried and reports twenty more failures that are nothing to do
      // with headgear: `down` is prone, so thirteen kinds hit their own body
      // colour, and in `walk1` the weapon crosses above the brow for six. Those
      // are occlusion by other parts, a different property, and folding them in
      // here would make the gate fail for reasons it cannot describe.
      for (const pose of ['idle'] as const) {
        const box = artBoxFor(kind, pose)
        const posed = POSE_TABLE[pose]
        if (!box || !posed) continue
        const canvas = createCanvas(box.width * SCALE, box.height * SCALE)
        const ctx = canvas.getContext('2d')
        if (!drawKindPose(ctx as unknown as CanvasRenderingContext2D, kind, pose, SCALE)) continue
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const headR = 10.4 * plan.build.head
        const built = applyBuild(posed, plan.build)
        const { browTop } = faceLayout(plan)
        // Just above the brow, in the near-eye column: skin if the brim clears
        // the face, headgear if it does not. Rotated with the head.
        const lx = 0.52 * headR
        const ly = (browTop - 0.05) * headR
        const cos = Math.cos(built.headRot)
        const sin = Math.sin(built.headRot)
        const px = Math.round(
          ((box.width - FIG_W) / 2 + built.head.x + lx * cos - ly * sin) * SCALE,
        )
        const py = Math.round((box.height - FIG_H + built.head.y + lx * sin + ly * cos) * SCALE)
        if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue
        const i = (py * img.width + px) * 4
        const hit = [img.data[i] ?? 0, img.data[i + 1] ?? 0, img.data[i + 2] ?? 0]
        const near = SKIN_TONES(plan.skin ?? SKIN).some(
          (t) => Math.hypot((hit[0] ?? 0) - (t[0] ?? 0), (hit[1] ?? 0) - (t[1] ?? 0), (hit[2] ?? 0) - (t[2] ?? 0)) < 26,
        )
        expect(
          near,
          `${kind}:${pose}: the brow has ${hit.join(',')} above it, not skin - the face is painted on the headgear`,
        ).toBe(true)
        checked += 1
      }
    }
    expect(checked, 'too few probes to mean anything').toBeGreaterThan(15)
  })

})
