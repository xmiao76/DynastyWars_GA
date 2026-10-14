import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { attackById } from '../../src/core/attacks'
import { guanyuClips, motionFrameForEntity, validMotionPack, type MotionArt, type MotionEntity } from '../../src/game/art/motion-clips'
import { advanceMotion } from '../../src/game/art/motion-player'
import { motionPreparedRecord } from '../../src/game/adapters/motion-art'
import actions from '../../src/game/assets/motion/actions-prepared.json'
import { imageSignature, signatureMatches } from '../../src/game/art/image-signature'
const meta = motionPreparedRecord()
const art: MotionArt = { ...meta, sheet: {} as CanvasImageSource, actionSheet: {} as CanvasImageSource, clips: guanyuClips() }
const base: MotionEntity = { state: 'idle', stateTick: 0, attackId: null, airTicks: 0, z: 0 }

describe('all-action Guan Yu coverage and continuity', () => {
  it('rejects a missing action cell or wrong atlas assignment', () => {
    const missing = structuredClone(meta); delete missing.frames['getup:4']
    expect(validMotionPack(missing)).toBe(false)
    const wrong = structuredClone(meta); wrong.frames['jump:4']!.sheet = undefined
    expect(validMotionPack(wrong)).toBe(false)
  })
  it('uses airborne clock independently of attack reset and respects aerial active window', () => {
    expect(motionFrameForEntity(art, { ...base, state: 'jump', stateTick: 3, airTicks: 18 })).toBe('jump:3')
    const a = attackById('gy.jumpkick')
    for (let t = 0; t < a.startup + a.active; t++) {
      const frame = motionFrameForEntity(art, { ...base, state: 'jumpattack', stateTick: t, airTicks: t + 4 })
      expect(frame).toBe(t < a.startup ? motionFrameForEntity(art, { ...base, state: 'jump', airTicks: t + 4 }) : 'jump:4')
    }
    expect(motionFrameForEntity(art, { ...base, state: 'jumpattack', stateTick: 24, airTicks: 30 })).toBe('jump:5')
  })
  it('shows landing compression, settles and allows immediate interruption without input locks', () => {
    const before = advanceMotion(art, { ...base, state: 'jump', airTicks: 35, z: 5 }, 35)
    const land = advanceMotion(art, base, 36, before.playback)
    expect(land.frame).toBe('jump:7')
    expect(advanceMotion(art, base, 36, land.playback).frame).toBe('jump:7') // paused
    const hitStop = advanceMotion(art, base, 42, land.playback)
    expect(hitStop.frame).toBe('jump:7')
    expect(advanceMotion(art, { ...base, stateTick: 1 }, 43, hitStop.playback).frame).toBe('jump:7') // first unfrozen tick cannot fast-forward
    expect(advanceMotion(art, { ...base, stateTick: 8 }, 44, land.playback).frame).toBe('walk:0')
    expect(advanceMotion(art, { ...base, state: 'attack', attackId: 'gy.jab1', stateTick: 8 }, 37, land.playback).frame).toBe('jab1:4')
  })
  it('falls continuously from midair without mutating collision height', () => {
    const e = { ...base, state: 'knockdown' as const, z: 0 }
    const prev = advanceMotion(art, { ...base, state: 'jump', z: 40 }, 10)
    const fall = advanceMotion(art, e, 11, prev.playback)
    expect(fall.lift).toBe(40); expect(e.z).toBe(0)
    expect(advanceMotion(art, e, 15, fall.playback).lift).toBe(40) // hit-stop advances sim.tick, not stateTick
    expect(advanceMotion(art, { ...e, stateTick: 5 }, 16, fall.playback).lift).toBe(20)
    expect(advanceMotion(art, { ...e, stateTick: 13 }, 24, fall.playback).frame).toBe('fall:6')
    expect(advanceMotion(art, { ...e, stateTick: 13 }, 24, fall.playback).lift).toBe(0)
  })
  it('shares exact down/getup bookend and exact final idle, no standing corpse restart', () => {
    const down = advanceMotion(art, { ...base, state: 'knockdown', stateTick: 35 }, 35)
    expect(down.frame).toBe('fall:6')
    expect(motionFrameForEntity(art, { ...base, state: 'getup' })).toBe(down.frame)
    expect(motionFrameForEntity(art, { ...base, state: 'getup', stateTick: 23 })).toBe('walk:0')
    expect(advanceMotion(art, { ...base, state: 'dying' }, 36, down.playback).frame).toBe('fall:6')
  })
  it('special attacks show strike on exact active tick', () => {
    for (const [id, state, expected] of [['gy.special', 'special', 'special:4']] as const) {
      const a = attackById(id)
      expect(motionFrameForEntity(art, { ...base, state, attackId: id, stateTick: a.startup })).toBe(expected)
      expect(motionFrameForEntity(art, { ...base, state, attackId: id, stateTick: a.startup - 1 })).not.toBe(expected)
    }
  })
  it('action atlas hash signature and every cell have clear padded edges', async () => {
    const buf = readFileSync('src/game/assets/motion/guanyu-actions-sheet.png')
    expect(createHash('sha256').update(buf).digest('hex')).toBe(actions.sha256.sheet)
    const img = await loadImage(buf), cv = createCanvas(img.width, img.height), g = cv.getContext('2d'); g.drawImage(img, 0, 0)
    expect(signatureMatches(imageSignature(g.getImageData(0, 0, cv.width, cv.height)), actions.signatures.sheet)).toBe(true)
    for (const [id, c] of Object.entries(actions.frames)) {
      const d = g.getImageData(c.x, c.y, c.w, c.h).data
      let edge = 0
      for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
        if (x > 0 && x < c.w - 1 && y > 0 && y < c.h - 1) continue
        if (d[(y * c.w + x) * 4 + 3]! >= 32) edge++
      }
      expect(edge, id).toBe(0)
    }
  }, 30_000)
})
