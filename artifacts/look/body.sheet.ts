import { writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { it } from 'vitest'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'
import type { PoseName } from '../../src/game/art/poses'

const TAG = process.env.SHEET_TAG ?? 'now'
// kind or kind:pose
const ITEMS = (process.env.SHEET_KINDS ?? 'zhaoyun,soldier,xuchu').split(',')
const S = Number(process.env.SHEET_S ?? 5)

it('full-body at vector resolution', () => {
  const pad = 10
  const parsed = ITEMS.map((it) => {
    const [kind, pose = 'idle'] = it.split(':') as [string, string?]
    return { kind, pose: pose as PoseName, box: artBoxFor(kind, pose as PoseName) }
  })
  const w = parsed.reduce((s, p) => s + (p.box?.width ?? 0) * S + pad, pad)
  const h = Math.max(...parsed.map((p) => (p.box?.height ?? 0) * S)) + pad * 2 + 20
  const sheet = createCanvas(w, h)
  const ctx = sheet.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#6d7f5a'
  ctx.fillRect(0, 0, w, h)
  let x = pad
  for (const { kind, pose, box } of parsed) {
    if (!box) continue
    const c = createCanvas(box.width * S, box.height * S)
    drawKindPose(c.getContext('2d') as unknown as CanvasRenderingContext2D, kind, pose, S)
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 15px sans-serif'
    ctx.fillText(`${kind}:${pose}`, x, pad + 12)
    ctx.drawImage(c as unknown as CanvasImageSource, x, pad + 20)
    x += box.width * S + pad
  }
  writeFileSync(`artifacts/look/body-${TAG}.png`, sheet.toBuffer('image/png'))
})
