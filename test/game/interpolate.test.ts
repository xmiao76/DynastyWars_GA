import { describe, expect, it } from 'vitest'
import { blendEase, leanEnvelope, lerpSkeleton, torsoLean } from '../../src/game/art/interpolate'
import { ATTACK, IDLE, THRUST, WALK0, WALK1, DOWN } from '../../src/game/art/poses'
import type { Skeleton } from '../../src/game/art/rig'

/**
 * BODY-24 core: interpolation between combat keys. Endpoints exact,
 * easing monotone, torso lean deterministic, flags from the nearer key.
 */
describe('BODY-24 pose interpolation', () => {
  it('endpoints are exact and the midpoint is the component mean', () => {
    const a = lerpSkeleton(IDLE, ATTACK, 0)
    for (const k of Object.keys(IDLE) as (keyof Skeleton)[]) {
      const av = IDLE[k]
      const bv = ATTACK[k]
      const cv = a[k]
      if (typeof av === 'object' && av && 'x' in av && typeof bv === 'object' && bv && 'x' in bv) {
        expect(cv, `t=0 ${String(k)}`).toEqual(av)
      }
    }
    const mid = lerpSkeleton(IDLE, ATTACK, 0.5)
    expect(mid.handN.x).toBeCloseTo((IDLE.handN.x + ATTACK.handN.x) / 2, 6)
    expect(mid.hip.y).toBeCloseTo((IDLE.hip.y + ATTACK.hip.y) / 2, 6)
  })

  it('blendEase is monotone and pinned at both ends', () => {
    expect(blendEase(0)).toBe(0)
    expect(blendEase(1)).toBe(1)
    let prev = -1
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = blendEase(t)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })

  it('angles take the short way round', () => {
    // weaponRot near +PI and -PI are close: the blend must not sweep the
    // whole circle.
    const a = { ...IDLE, weaponRot: Math.PI - 0.1 }
    const b = { ...IDLE, weaponRot: -Math.PI + 0.1 }
    const mid = lerpSkeleton(a as Skeleton, b as Skeleton, 0.5)
    expect(Math.abs(mid.weaponRot)).toBeGreaterThan(Math.PI - 0.2)
  })

  it('discrete flags come from the nearer key', () => {
    const s = lerpSkeleton(IDLE, ATTACK, 0.2)
    expect(s.strike).toBeUndefined()
    const s2 = lerpSkeleton(IDLE, ATTACK, 0.8)
    expect(s2.strike).toBe(true)
    const d = lerpSkeleton(THRUST, DOWN, 0.8)
    expect(d.lying).toBe(true)
  })

  it('torsoLean rotates the upper body about the pinned hip and leaves hands', () => {
    const leaned = torsoLean(IDLE, 0.1)
    expect(leaned.hip).toEqual(IDLE.hip)
    expect(leaned.handN).toEqual(IDLE.handN)
    expect(leaned.chest.x).not.toBeCloseTo(IDLE.chest.x, 6)
    // Deterministic round-trip at zero.
    expect(torsoLean(IDLE, 0)).toBe(IDLE)
  })

  it('lean envelope peaks mid-transition and signs by strike direction', () => {
    expect(leanEnvelope(WALK0, WALK1, 0.5)).toBe(0) // walk: no strike lean
    const into = leanEnvelope(IDLE, ATTACK, 0.5)
    expect(Math.abs(into)).toBeGreaterThan(0)
    expect(leanEnvelope(IDLE, ATTACK, 0)).toBeCloseTo(0, 6)
    expect(leanEnvelope(IDLE, ATTACK, 1)).toBeCloseTo(0, 6)
  })
})
