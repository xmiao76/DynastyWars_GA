import { beforeAll, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import type { Pixels } from '../../scripts/motion-pipeline.mjs'
import { alphaComponents } from '../../scripts/motion-pipeline.mjs'
import { gridCellOf } from '../../scripts/motion-retouch.mjs'
import { assertChargePaintConservation, harmonizeChargePaint, isProtectedChargeWeapon } from '../../scripts/harmonize-xiahoudun-charge-paint.mjs'

let source: Pixels, output: ReturnType<typeof harmonizeChargePaint>
const hash=(d:Uint8ClampedArray)=>createHash('sha256').update(d).digest('hex')
beforeAll(async()=>{
 const bytes=readFileSync('art/motion/xiahoudun/charge-repair-1-spliced-source.png')
 expect(createHash('sha256').update(bytes).digest('hex')).toBe('b547809c352dd7b8828d20452c0e7f216caede83b1c143374a704a5d301014e4')
 const img=await loadImage(bytes),cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0)
 source=g.getImageData(0,0,img.width,img.height);output=harmonizeChargePaint(source)
})

describe('CMR-14A localized charge paint correction',()=>{
 it('changes only named0/3/4 RGB material regions; all alpha/silhouette and nontarget drawings are exact',()=>{
  expect(output.changedRgbPixels).toEqual({0:22097,3:23178,4:24331})
  // A no-op/old RGB source must fail the actual muted-paint check, not
  // merely a report counter. Geometry tests alone cannot prove correction.
  const k=(125*source.width+154)*4
  const oldLuma=source.data[k]!+source.data[k+1]!+source.data[k+2]!
  const newLuma=output.image.data[k]!+output.image.data[k+1]!+output.image.data[k+2]!
  expect(oldLuma).toBeGreaterThan(0);expect(newLuma).toBeLessThan(oldLuma)
  expect(()=>assertChargePaintConservation(source,output.image)).not.toThrow()
  const cellOf=gridCellOf(3,3),comps=alphaComponents(source,96).filter(c=>c.area>64)
  let alphaDiff=0,otherDiff=0,weaponDiff=0
  for(let p=0;p<source.width*source.height;p++)if(source.data[p*4+3]!==output.image.data[p*4+3])alphaDiff++
  for(const c of comps){const cell=cellOf(c,source.width,source.height);for(const p of c.pixels){const x=p%source.width,y=Math.floor(p/source.width),k=p*4;if(![0,3,4].includes(cell))for(let channel=0;channel<4;channel++)if(source.data[k+channel]!==output.image.data[k+channel])otherDiff++;if(isProtectedChargeWeapon(cell,x,y))for(let channel=0;channel<4;channel++)if(source.data[k+channel]!==output.image.data[k+channel])weaponDiff++}}
  expect(alphaDiff).toBe(0);expect(otherDiff).toBe(0);expect(weaponDiff).toBe(0)
  expect(output.composition).toEqual({count:9,cells:[0,1,2,3,4,5,6,7,8]})
 })

 it('negative controls reject silhouette damage and protected shaft recoloring even with matching overall dimensions',()=>{
  const damaged={...output.image,data:new Uint8ClampedArray(output.image.data)}
  damaged.data[(164*damaged.width+423)*4+3]=0
  expect(()=>assertChargePaintConservation(source,damaged)).toThrow(/alpha\/silhouette changed/)
  const weapon={...output.image,data:new Uint8ClampedArray(output.image.data)},k=(187*weapon.width+210)*4
  weapon.data[k]=weapon.data[k]!^1
  expect(()=>assertChargePaintConservation(source,weapon)).toThrow(/protected\/untargeted pixel changed/)
 })

 it('is deterministic and copy-on-write; localized paint does not establish source/head/motion acceptance',()=>{
  const before=hash(source.data),repeat=harmonizeChargePaint(source)
  expect(hash(source.data)).toBe(before);expect(hash(repeat.image.data)).toBe(hash(output.image.data))
  const state=JSON.parse(readFileSync('art/motion/xiahoudun/independent-review.json','utf8'))
  expect(state.numericalHeadSpread).toBeNull();expect(state.acceptedChargeSheet).toBe(false)
 })
})
