import { beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { stepEnemy } from '../../src/core/ai'
import { attackById } from '../../src/core/attacks'
import { makeCombatant } from '../../src/core/entities'
import { playerOf } from '../../src/core/sim'
import { makeSandbox } from '../core/helpers'
import type { Pixels } from '../../scripts/motion-pipeline.mjs'
import { chargeExposureForTick, chargeMotionTrace, registeredTransform, validateCandidateAnchors, type ChargeCandidateSpec } from '../../scripts/review-xiahoudun-registered-charge.mjs'

const spec = JSON.parse(readFileSync('art/motion/xiahoudun/charge-registration-candidate.json', 'utf8')) as ChargeCandidateSpec
const images: Record<string, Pixels> = {}
beforeAll(async () => {
 for (const [name, source] of Object.entries(spec.sources)) {
  const bytes = readFileSync(`art/motion/xiahoudun/${source.file}`)
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256)
  const img = await loadImage(bytes), cv = createCanvas(img.width, img.height), g = cv.getContext('2d'); g.drawImage(img,0,0)
  images[name] = g.getImageData(0,0,img.width,img.height)
 }
})

describe('CMR-14A registered offline charge candidate', () => {
 it('matches every core stateTick and displacement from the actual enemy AI, both facings', () => {
  const motion = chargeMotionTrace(), atk = attackById('charge.dash.long')
  expect([motion.startup,motion.active,motion.recover]).toEqual([atk.startup,atk.active,atk.recover])
  for (const facing of ['left','right'] as const) {
   const sim = makeSandbox(), player = playerOf(sim), enemy = makeCombatant(99,'xiahoudun','enemy',300,player.y,210,1.2,facing)
   enemy.state='attack'; enemy.attackId='charge.dash.long'
   const start=enemy.x, sign=facing==='right'?1:-1
   for (const t of motion.trace) {
    if(t.tick>0) stepEnemy(sim,enemy,player)
    expect((enemy.x-start)*sign).toBeCloseTo(t.x,8)
    expect(enemy.stateTick).toBe(t.stateTick); expect(enemy.state).toBe(t.state)
   }
  }
  expect(motion.trace.filter(t=>t.moving)).toHaveLength(26)
  expect(motion.trace.at(-1)!.x).toBeCloseTo(83.2)
 })

 it('samples exact startup/active/recover boundaries and reuses the same corrected guard bookend', () => {
  const expected: Record<number,string> = {0:'walk:0',2:'walk:0',3:'charge:0',6:'charge:0',7:'charge:1',8:'charge:2',20:'charge:2',21:'charge:3',33:'charge:3',34:'charge:4',42:'charge:4',43:'walk:0',51:'walk:0',52:'walk:0'}
  for(const[t,frame]of Object.entries(expected))expect(chargeExposureForTick(spec,Number(t))).toBe(frame)
  expect(()=>chargeExposureForTick(spec,-1)).toThrow(/nonnegative integer/)
  expect(spec.sources.walk!.file).toBe('walk-projection-corrected-source.png')
 })

 it('uses one immutable scale with translation-only drawn-sole anchors; virtual dash contact stays unverified', () => {
  const report=validateCandidateAnchors(spec,images)
  for(const r of report){expect(r.fit.scale).toBe(.66);expect(r.pelvisArt[0]).toBeCloseTo(260);for(const e of r.contactErrorsU)expect(e).toBeLessThanOrEqual(1.5)}
  const airborne=report.find(r=>r.id==='charge:2')!
  expect(airborne.contactErrorsU).toEqual([]);expect(airborne.groundEvidence).toMatch(/UNVERIFIED virtual/)
  expect(registeredTransform(spec,'walk:0').scale).toBe(registeredTransform(spec,'charge:4').scale)
  expect(spec.limits).toMatch(/head metric UNVERIFIED\/null/)
 })

 it('negative control rejects sole marks on empty pixels and a real sole moved beyond1.5u', () => {
  const bad=structuredClone(spec);bad.anchors['charge:4']!.secondarySole=[932,690]
  expect(()=>validateCandidateAnchors(bad,images)).toThrow(/sole off ink/)
  const floating=structuredClone(spec);floating.anchors['charge:4']!.groundY+=10
  expect(()=>validateCandidateAnchors(floating,images)).toThrow(/planted-foot error/)
 })
})
