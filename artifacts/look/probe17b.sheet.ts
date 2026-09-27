import { createCanvas } from '@napi-rs/canvas'
import { it } from 'vitest'
import { drawFigure } from '../../src/game/art/draw'
import { HERO_FIGURES } from '../../src/game/art/figures'
import { POSE_TABLE } from '../../src/game/art/poses'
import { applyBuild } from '../../src/game/art/rig'
it('beard reach', () => {
  for (const k of ['guanyu', 'huangzhong']) {
    const pl = HERO_FIGURES[k]!
    const S = 4, W = 120, H = 130, oy = 20
    const draw = (beard: string) => { const c = createCanvas(W*S, H*S); const x = c.getContext('2d') as unknown as CanvasRenderingContext2D; x.scale(S,S); x.translate(10, oy); drawFigure(x, { ...pl, beard: beard as never }, POSE_TABLE.idle); return (c.getContext('2d')).getImageData(0,0,W*S,H*S).data }
    const a = draw(pl.beard), b = draw('none')
    let maxY = -1, n = 0
    for (let i = 0; i < W*S*H*S; i++) { const d = Math.abs(a[i*4]-b[i*4])+Math.abs(a[i*4+1]-b[i*4+1])+Math.abs(a[i*4+2]-b[i*4+2]); if (d > 40) { n++; const y = Math.floor(i/(W*S)); if (y > maxY) maxY = y } }
    const p = applyBuild(POSE_TABLE.idle, pl.build)
    console.log(k, 'visible beard px', n, 'lowest y', (maxY/S - oy).toFixed(1), 'chin', (p.head.y + 10.4*pl.build.head*0.95).toFixed(1), 'chest', p.chest.y.toFixed(1), 'shoulderN', p.shoulderN.y.toFixed(1), 'hip', p.hip.y.toFixed(1))
  }
})
