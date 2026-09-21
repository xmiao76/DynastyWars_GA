import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'

// TEMPORARY probe: rasterize three candidate crescent-blade silhouettes to
// compact ASCII so they can be compared side by side without guessing.
// Socket at the left; blade extends right; up is -y.

type Ctx = ReturnType<ReturnType<typeof createCanvas>['getContext']>

function trace(c: Ctx, fore: number, v: 'now' | 'crescent' | 'elongated' | 'bold'): void {
  c.beginPath()
  if (v === 'now') {
    c.moveTo(fore - 9, -1)
    c.quadraticCurveTo(fore + 4, -12, fore + 8, -12)
    c.quadraticCurveTo(fore + 5, -16, fore + 0, -14)
    c.quadraticCurveTo(fore + 12, -8, fore + 19, -2)
    c.quadraticCurveTo(fore + 15, 8, fore + 5, 12)
    c.quadraticCurveTo(fore - 2, 8, fore - 9, -1)
  } else if (v === 'crescent') {
    // Bold classic crescent: sweeps up, curves over, sharp point at the front.
    c.moveTo(fore - 9, 4)
    c.quadraticCurveTo(fore - 2, -14, fore + 8, -18)
    c.quadraticCurveTo(fore + 16, -21, fore + 20, -14)
    c.quadraticCurveTo(fore + 22, -8, fore + 16, -3)
    c.quadraticCurveTo(fore + 10, 6, fore + 2, 8)
    c.quadraticCurveTo(fore - 6, 8, fore - 9, 4)
  } else if (v === 'elongated') {
    // Documented guandao: straight back, small sharp back spike, tapered tip.
    c.moveTo(fore - 9, 2)
    c.quadraticCurveTo(fore + 2, -6, fore + 12, -10)
    c.quadraticCurveTo(fore + 9, -13, fore + 6, -12)
    c.quadraticCurveTo(fore + 16, -9, fore + 23, -4)
    c.quadraticCurveTo(fore + 17, 3, fore + 9, 6)
    c.quadraticCurveTo(fore + 1, 7, fore - 9, 2)
  } else {
    // Crescent horn: the blade is a curved band that sweeps up, arcs over and
    // comes down to a point - the "reclining moon" the name means.
    c.moveTo(fore - 9, 1)
    c.quadraticCurveTo(fore + 0, -10, fore + 8, -14)
    c.quadraticCurveTo(fore + 16, -17, fore + 20, -10)
    c.quadraticCurveTo(fore + 22, -4, fore + 18, 1)
    c.quadraticCurveTo(fore + 10, 5, fore + 2, 6)
    c.quadraticCurveTo(fore - 6, 5, fore - 9, 1)
  }
  c.closePath()
}

function ascii(v: 'now' | 'crescent' | 'elongated' | 'bold'): string {
  const W = 46
  const H = 22
  const canvas = createCanvas(W * 2, H * 2)
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.clearRect(0, 0, W, H)
  ctx.save()
  ctx.translate(10, H / 2)
  trace(ctx, 30, v)
  ctx.fillStyle = '#000'
  ctx.fill()
  ctx.fillRect(-10, -0.8, 20, 1.6)
  ctx.restore()
  const img = ctx.getImageData(0, 0, W * 2, H * 2)
  const rows: string[] = []
  for (let y = 0; y < H; y += 1) {
    let line = ''
    for (let x = 0; x < W; x += 1) {
      const a = img.data[(y * 2 * W * 2 + x * 2) * 4 + 3] ?? 0
      line += a > 40 ? '#' : '.'
    }
    rows.push(line)
  }
  return rows.join('\n')
}

describe('crescent candidates', () => {
  it('writes artifacts/crescent-candidates.txt', () => {
    const names: Array<[string, 'now' | 'crescent' | 'elongated' | 'bold']> = [
      ['A - NOW (shipped, ART-14)', 'now'],
      ['B - BOLD CRESCENT (classic game look)', 'crescent'],
      ['C - ELONGATED (documented guandao)', 'elongated'],
      ['D - BOLD + ELONGATED (hybrid)', 'bold'],
    ]
    const out = names.map(([n, v]) => `${n}\n${ascii(v)}`).join('\n\n')
    mkdirSync('artifacts', { recursive: true })
    writeFileSync('artifacts/crescent-candidates.txt', out + '\n')
    expect(true).toBe(true)
  })
})
