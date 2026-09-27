import { it } from 'vitest'
import { HERO_FIGURES } from '../../src/game/art/figures'
import { POSE_TABLE } from '../../src/game/art/poses'
import { applyBuild } from '../../src/game/art/rig'
import { FACES } from '../../src/game/art/faces'
it('probe', () => {
  for (const k of ['guanyu','zhaoyun','zhangfei','huangzhong','weiyan']) {
    const pl = HERO_FIGURES[k]; if (!pl) continue
    const p = applyBuild(POSE_TABLE.idle, pl.build)
    const R = 10.4 * pl.build.head
    const chinY = p.head.y + R * 0.95
    console.log(k, 'build', JSON.stringify(pl.build), 'R', R.toFixed(2), 'head.y', p.head.y.toFixed(1), 'neck.y', p.neck.y.toFixed(1), 'chest.y', p.chest.y.toFixed(1), 'chin.y', chinY.toFixed(1), 'beard', pl.beard, 'tipLong', (chinY + 20).toFixed(1), 'skin', (pl.skin ?? 0).toString(16), 'face', pl.face, 'bw', FACES[pl.face ?? 'plain'].browWeight)
  }
})
