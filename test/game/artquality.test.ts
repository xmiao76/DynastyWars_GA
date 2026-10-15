import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { artBoxFor, drawKindProp, propKinds } from '../../src/game/art/registry'
import { assessSprite } from '../../vision/sprite-metrics'
import { PROP_SPRITE_THRESHOLDS } from '../../vision/thresholds'
// Legacy figure/pose metrics RETIRED, not passing motion gates. Motion frames
// retain their pack-specific suites; browser inventory migration is still owed.
describe('shared prop quality', () => {
 it('checks all four props with unchanged quality thresholds', () => {
   expect(propKinds()).toHaveLength(4)
   for(const kind of propKinds()) {
     const box=artBoxFor(kind)!, cv=createCanvas(box.width*2,box.height*2)
     expect(drawKindProp(cv.getContext('2d') as unknown as CanvasRenderingContext2D,kind,2)).toBe(true)
     const image=cv.getContext('2d').getImageData(0,0,cv.width,cv.height)
     expect(assessSprite({width:cv.width,height:cv.height,data:new Uint8Array(image.data)},kind,PROP_SPRITE_THRESHOLDS).failures).toEqual([])
   }
 })
})
