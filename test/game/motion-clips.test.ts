import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { attackById, totalFrames } from '../../src/core/attacks'
import { imageSignature, signatureMatches } from '../../src/game/art/image-signature'
import { motionLandmarkFailures } from '../../src/game/art/motion-quality'
import { guanyuClips, motionFrameForEntity, validMotionPack, type MotionArt } from '../../src/game/art/motion-clips'
import { ACTION_SOURCE_KEY, MOTION_SOURCE_KEY, motionEnabled, motionPreparedRecord, publishMotionArtRecord } from '../../src/game/adapters/motion-art'
import type Phaser from 'phaser'
import prepared from '../../src/game/assets/motion/prepared.json'

const meta = motionPreparedRecord()
const art: MotionArt = { ...meta, sheet: {} as CanvasImageSource, actionSheet: {} as CanvasImageSource, clips: guanyuClips() }
const entity = { state: 'idle' as const, stateTick: 0, attackId: null, mountedOn: null }

describe('Guan Yu motion pilot technical gates (not aesthetic acceptance)', () => {
  it('requires explicit flag, never accidentally matches another flag value', () => {
    expect(motionEnabled('')).toBe(false)
    expect(motionEnabled('?frames=1')).toBe(false)
    expect(motionEnabled('?motion=0')).toBe(false)
    expect(motionEnabled('?motion=10')).toBe(false)
    expect(motionEnabled('?motion=1')).toBe(true)
  })

  it('rejects incomplete and malformed packs atomically (negative controls)', () => {
    expect(validMotionPack(meta)).toBe(true)
    const missing = structuredClone(meta)
    delete (missing.frames as Record<string, unknown>)['jab1:5']
    expect(validMotionPack(missing)).toBe(false)
    const outOfBounds = structuredClone(meta)
    outOfBounds.frames['walk:1']!.x = meta.sheet.width
    expect(validMotionPack(outOfBounds)).toBe(false)
    const duplicate = structuredClone(meta)
    duplicate.frames['walk:2'] = { ...duplicate.frames['walk:1']! }
    expect(validMotionPack(duplicate)).toBe(false)
    expect(validMotionPack({ ...meta, density: 0 })).toBe(false)
    expect(validMotionPack({ ...meta, box: { ...meta.box, groundY: NaN } })).toBe(false)
  })

  it('samples a full eight-drawing walk on sim ticks and preserves pause/loop seam', () => {
    const seen = new Set<string>()
    for (let t = 0; t < 64; t++) {
      const e = { ...entity, state: 'walk' as const, stateTick: t }
      const frame = motionFrameForEntity(art, e)!
      expect(frame).toBe(`walk:${Math.floor(t % 32 / 4) + 1}`)
      expect(motionFrameForEntity(art, e)).toBe(frame) // extra renders cannot advance
      expect(art.frames[frame]).toBeDefined()
      seen.add(frame)
    }
    expect(seen.size).toBe(8)
  })

  it('covers every combo tick, strike at first active tick, shared idle bookends', () => {
    for (const action of ['jab1', 'jab2', 'finisher'] as const) {
      const def = attackById(`gy.${action}`)
      const sample = (stateTick: number): string | undefined => motionFrameForEntity(art, { ...entity, state: 'attack', stateTick, attackId: def.id })
      for (let t = 0; t < totalFrames(def); t++) {
        const frame = sample(t)!
        expect(art.frames[frame], `${def.id}:${t}`).toBeDefined()
        if (t < def.startup) expect(frame).not.toBe(`${action}:4`)
        if (t >= def.startup && t < def.startup + def.active) expect(frame).toBe(`${action}:4`)
      }
      expect(sample(0)).toBe('walk:0')
      expect(sample(def.startup)).toBe(`${action}:4`) // skipped rendering still shows strike
      expect(sample(def.startup + def.active)).toBe(`${action}:5`)
      expect(sample(totalFrames(def) - 1)).toBe('walk:0')
      expect(sample(totalFrames(def) + 20)).toBe('walk:0')
    }
  })

  it('covers every Guan Yu state including mounted and defensive unknown attacks', () => {
    for (const state of ['idle', 'walk', 'attack', 'jump', 'jumpattack', 'special', 'hitstun', 'knockdown', 'getup', 'grab', 'grabbed', 'thrown', 'fleeing', 'dying', 'dead'] as const) {
      for (let stateTick = 0; stateTick < 100; stateTick++) {
        const frame = motionFrameForEntity(art, { ...entity, state, stateTick, airTicks: stateTick % 36 })
        expect(art.frames[frame], `${state}:${stateTick}`).toBeDefined()
        const mounted = motionFrameForEntity(art, { ...entity, state, stateTick, mountedOn: 12 })
        expect(art.frames[mounted]).toBeDefined()
      }
    }
    expect(motionFrameForEntity(art, { ...entity, state: 'attack', attackId: 'mounted.sweep' })).toBe('walk:0')
  })

  it('sheet bytes, signature, density and clear padded edges match preparation', async () => {
    const bytes = readFileSync('src/game/assets/motion/guanyu-motion-sheet.png')
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(prepared.guanyu.sha256.sheet)
    const img = await loadImage(bytes), cv = createCanvas(img.width, img.height), g = cv.getContext('2d')
    g.drawImage(img, 0, 0)
    expect(signatureMatches(imageSignature(g.getImageData(0, 0, cv.width, cv.height)), meta.signatures.sheet)).toBe(true)
    for (const [frame, c] of Object.entries(prepared.guanyu.frames)) {
      const im = g.getImageData(c.x, c.y, c.w, c.h)
      let edge = 0
      for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
        if (x !== 0 && y !== 0 && x !== c.w - 1 && y !== c.h - 1) continue
        if (im.data[(y * c.w + x) * 4 + 3]! >= 32) edge++
      }
      expect(edge, frame).toBe(0)
    }
  }, 20_000)

  it('publishes complete art, retains other resources, rejects corrupt/missing decode', async () => {
    const img = await loadImage('src/game/assets/motion/guanyu-motion-sheet.png')
    const actions = await loadImage('src/game/assets/motion/guanyu-actions-sheet.png')
    let records: unknown = { heroes: {}, bodies: { retained: true } }
    let exists = true
    const scene = { registry: { get: () => records, set: (_key: string, value: unknown) => { records = value } }, textures: {
      exists: (key: string) => exists && (key === MOTION_SOURCE_KEY || key === ACTION_SOURCE_KEY),
      get: (key: string) => ({ getSourceImage: () => key === ACTION_SOURCE_KEY ? actions : img }),
    } } as unknown as Phaser.Scene
    const ctx = (w: number, h: number): CanvasRenderingContext2D => createCanvas(w, h).getContext('2d') as unknown as CanvasRenderingContext2D
    expect(publishMotionArtRecord(scene, meta, ctx)?.id).toBe('guanyu')
    expect(records).toMatchObject({ bodies: { retained: true }, motions: { guanyu: { revision: 'motion-2' } } })
    // A second, already-valid fighter must survive every rejection below:
    // rejecting a fighter clears THAT fighter only (CMR-03 acceptance 3).
    const withSibling = { heroes: {}, bodies: { retained: true }, motions: { guanyu: { id: 'guanyu' }, zhangfei: { id: 'zhangfei' } } }
    const siblingOnly = { zhangfei: { id: 'zhangfei' } }
    records = withSibling
    expect(publishMotionArtRecord(scene, { ...meta, signatures: { ...meta.signatures, sheet: '00'.repeat(6144) } }, ctx)).toBeUndefined()
    expect((records as { motions: Record<string, unknown> }).motions).toEqual(siblingOnly)
    records = withSibling
    expect(publishMotionArtRecord(scene, { ...meta, signatures: { ...meta.signatures, actions: '00'.repeat(6144) } }, ctx)).toBeUndefined()
    expect((records as { motions: Record<string, unknown> }).motions).toEqual(siblingOnly)
    records = withSibling
    exists = false
    expect(publishMotionArtRecord(scene, meta, ctx)).toBeUndefined()
    expect((records as { motions: Record<string, unknown> }).motions).toEqual(siblingOnly)
  }, 40_000) // Two atlases and both corruption controls decode/scan ~11MP repeatedly.

  it('does NOT declare the diagnostic candidates quality-accepted', () => {
    // Two manually inspected full-resolution rigid-weapon landmarks already
    // exceed the predeclared 10% length spread. This proves the aesthetics
    // ruler can fail even though runtime/coverage gates above pass.
    const idleLength = prepared.guanyu.audit.walk[0]!.weaponLengthU!
    const sweepLength = prepared.guanyu.audit.jab1[4]!.weaponLengthU!
    const spread = Math.abs(idleLength - sweepLength) / idleLength
    expect(spread).toBeGreaterThan(0.1)
    // Unmeasured head/weapon landmarks cannot be treated as successful checks.
    const failures = motionLandmarkFailures(Object.values(prepared.guanyu.audit).flat())
    expect(failures).toContain('weaponLengthU: spread exceeds 10%')
    expect(failures).toContain('headWidthU: landmarks incomplete')
    expect(motionLandmarkFailures([{ headWidthU: 8, weaponLengthU: 100 }, { headWidthU: 8.5, weaponLengthU: 105 }])).toEqual([])
    expect(motionLandmarkFailures([{ headWidthU: 8, weaponLengthU: 100 }, { headWidthU: 10, weaponLengthU: 70 }])).toHaveLength(2)
  })
})
