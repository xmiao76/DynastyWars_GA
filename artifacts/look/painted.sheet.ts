import { writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { it } from 'vitest'
import { artBoxFor, drawKindPose, drawKindPortrait } from '../../src/game/art/registry'
import type { ArtResources, HeroArt } from '../../src/game/art/hero-resources'
import prepared from '../../src/game/assets/hero-faces/prepared.json'

it('pilot sheet at native and enlarged scale', async () => {
  const resources: ArtResources = { heroes: {} }
  for (const id of ['guanyu','zhangfei','zhaoyun','huangzhong','weiyan'] as const) {
    const im = async (p: string) => await loadImage(`src/game/assets/hero-faces/${id}-${p}.png`) as unknown as CanvasImageSource
    const m=prepared[id]
    ;(resources.heroes as Record<string,HeroArt>)[id]={id,revision:m.revision,portrait:await im('portrait'),head:await im('head'),front:await im('front'),rear:await im('rear'),cell:m.cell,bounds:m.bounds,skin:parseInt(m.skin.slice(1),16)}
  }
  const cv=createCanvas(1300,2150), c=cv.getContext('2d')
  c.fillStyle='#333b39';c.fillRect(0,0,cv.width,cv.height)
  for (const [row,id] of (['guanyu','zhangfei','zhaoyun','huangzhong','weiyan'] as const).entries()) {
    c.fillStyle='#fff';c.font='18px sans-serif';c.fillText(`${id} — old / new portraits; idle / attack / down; native idle`,15,row*430+22)
    for(let i=0;i<2;i++) {
      const p=createCanvas(216,240);drawKindPortrait(p.getContext('2d') as unknown as CanvasRenderingContext2D,id,6,true,i?resources:undefined)
      c.drawImage(p,10+i*220,row*430+35)
    }
    for(const [i,pose] of (['idle','attack','down'] as const).entries()){
      const b=artBoxFor(id,pose)!;const p=createCanvas(b.width*2,b.height*2)
      drawKindPose(p.getContext('2d') as unknown as CanvasRenderingContext2D,id,pose,2,resources)
      c.drawImage(p,450+i*255,row*430+35)
      if(i===0)c.drawImage(p,1175,row*430+50,p.width/2,p.height/2)
      // Left-facing mirror, as the game draws it via setFlipX.
      const m=createCanvas(b.width*2,b.height*2);const mc=m.getContext('2d')
      mc.translate(m.width,0);mc.scale(-1,1);mc.drawImage(p,0,0)
      c.drawImage(m,450+i*255,row*430+195,m.width/2,m.height/2)
    }
  }
  writeFileSync('artifacts/look/art18-pilot-sheet.png',cv.toBuffer('image/png'))
})
