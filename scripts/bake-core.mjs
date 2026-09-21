/**
 * Pure image-processing core for the art bake pipeline. Operates on plain
 * RGBA buffers ({ width, height, data: Uint8Array }) - no fs, no PNG codec,
 * so vitest can exercise every step on synthetic pixels.
 */

export const KEY_COLORS = [
  { name: 'magenta', r: 255, g: 0, b: 255 },
  { name: 'green', r: 0, g: 255, b: 0 },
  { name: 'blue', r: 0, g: 0, b: 255 },
]

/** Sample the four corners and snap to the nearest pure key color. */
export function sniffKeyColor(image) {
  const { width, height, data } = image
  const patch = (cx, cy) => {
    let r = 0
    let g = 0
    let b = 0
    let n = 0
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        const px = Math.min(width - 1, cx + x)
        const py = Math.min(height - 1, cy + y)
        const i = (py * width + px) * 4
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
        n += 1
      }
    }
    return { r: r / n, g: g / n, b: b / n }
  }
  const corners = [
    patch(0, 0),
    patch(width - 4, 0),
    patch(0, height - 4),
    patch(width - 4, height - 4),
  ]
  const avg = {
    r: corners.reduce((s, c) => s + c.r, 0) / 4,
    g: corners.reduce((s, c) => s + c.g, 0) / 4,
    b: corners.reduce((s, c) => s + c.b, 0) / 4,
  }
  let best = KEY_COLORS[0]
  let bestDist = Number.POSITIVE_INFINITY
  for (const key of KEY_COLORS) {
    const dist = (avg.r - key.r) ** 2 + (avg.g - key.g) ** 2 + (avg.b - key.b) ** 2
    if (dist < bestDist) {
      bestDist = dist
      best = key
    }
  }
  return best
}

/**
 * Chroma-key to alpha with a soft ramp: fully transparent at or below
 * `tolerance`, fully opaque past `tolerance + softness`, linear between.
 * Mutates and returns the image.
 */
export function applyAlphaKey(image, key, tolerance = 90, softness = 60) {
  const { data } = image
  for (let i = 0; i < data.length; i += 4) {
    const dist = Math.sqrt(
      (data[i] - key.r) ** 2 + (data[i + 1] - key.g) ** 2 + (data[i + 2] - key.b) ** 2,
    )
    if (dist <= tolerance) {
      data[i + 3] = 0
    } else if (dist < tolerance + softness) {
      data[i + 3] = Math.round(((dist - tolerance) / softness) * 255)
    }
  }
  return image
}

/**
 * Remove key-color spill from visible texels: magenta -> pull R and B toward
 * G; green -> G toward max(R,B); blue -> B toward max(R,G). Mutates in place.
 */
export function despill(image, key) {
  const { data } = image
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    if (key.name === 'magenta') {
      data[i] = Math.min(data[i], data[i + 1])
      data[i + 2] = Math.min(data[i + 2], data[i + 1])
    } else if (key.name === 'green') {
      data[i + 1] = Math.min(data[i + 1], Math.max(data[i], data[i + 2]))
    } else {
      data[i + 2] = Math.min(data[i + 2], Math.max(data[i], data[i + 1]))
    }
  }
  return image
}

/** Bounding box of texels with alpha above the threshold; null if empty. */
export function trimBox(image, threshold = 8) {
  const { width, height, data } = image
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > threshold) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

/**
 * Downscale the source box into a fixed frame box (never upscale), centered
 * horizontally with feet on the box bottom. Alpha-aware box filter.
 * Returns a fresh { width, height, data } image of boxW x boxH.
 */
export function composeIntoBox(image, box, boxW, boxH) {
  const { data, width } = image
  const scale = Math.min(boxW / box.w, boxH / box.h, 1)
  const scaledW = Math.max(1, Math.round(box.w * scale))
  const scaledH = Math.max(1, Math.round(box.h * scale))
  const dx = Math.round((boxW - scaledW) / 2)
  const dy = boxH - scaledH
  const out = new Uint8Array(boxW * boxH * 4)

  for (let y = 0; y < scaledH; y += 1) {
    for (let x = 0; x < scaledW; x += 1) {
      // Source region covered by this output pixel (box filter).
      const sx0 = box.x + Math.floor(x / scale)
      const sx1 = Math.min(box.x + box.w, box.x + Math.ceil((x + 1) / scale))
      const sy0 = box.y + Math.floor(y / scale)
      const sy1 = Math.min(box.y + box.h, box.y + Math.ceil((y + 1) / scale))
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      let wSum = 0
      for (let sy = sy0; sy < sy1; sy += 1) {
        for (let sx = sx0; sx < sx1; sx += 1) {
          const si = (sy * width + sx) * 4
          const alpha = data[si + 3] / 255
          r += data[si] * alpha
          g += data[si + 1] * alpha
          b += data[si + 2] * alpha
          a += data[si + 3]
          wSum += 1
        }
      }
      const oi = ((y + dy) * boxW + (x + dx)) * 4
      const coverage = wSum > 0 ? a / (wSum * 255) : 0
      if (a > 0) {
        out[oi] = Math.round(r / (a / 255) || 0)
        out[oi + 1] = Math.round(g / (a / 255) || 0)
        out[oi + 2] = Math.round(b / (a / 255) || 0)
      }
      out[oi + 3] = Math.round(coverage * 255)
    }
  }
  return { width: boxW, height: boxH, data: out }
}

/**
 * Per-kind frame boxes (display size in logical px) and required poses.
 * A kind ships in the manifest only when every required pose exists.
 */
export const FRAME_BOXES = {
  // Heroes
  guanyu: { w: 72, h: 92, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  zhangfei: { w: 72, h: 92, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  zhaoyun: { w: 72, h: 92, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  huangzhong: { w: 72, h: 92, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  weiyan: { w: 72, h: 92, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  // Grunts
  soldier: { w: 64, h: 88, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  spearman: { w: 64, h: 88, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  archer: { w: 64, h: 88, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  // Bosses
  lidian: { w: 96, h: 128, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  xiahoudun: { w: 96, h: 128, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  xuchu: { w: 96, h: 128, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  caoren: { w: 96, h: 128, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  zhangliao: { w: 96, h: 128, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  xuhuang: { w: 96, h: 128, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  zhanghe: { w: 96, h: 128, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  caocao: { w: 96, h: 128, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  lubu: { w: 96, h: 128, poses: ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down'] },
  // Horse + props
  horse: { w: 96, h: 64, poses: ['idle', 'walk0', 'walk1'] },
  crate: { w: 52, h: 44, poses: ['idle'] },
  meat: { w: 36, h: 28, poses: ['idle'] },
  sword: { w: 44, h: 20, poses: ['idle'] },
  arrow: { w: 40, h: 12, poses: ['idle'] },
}

/**
 * Build the manifest from the list of successfully baked `<kind>-<pose>`
 * file names. Per-kind atomic: incomplete kinds are dropped entirely (a
 * half-swapped sprite set pops violently between frame sizes).
 */
export function buildManifest(bakedNames) {
  const byKind = new Map()
  for (const name of bakedNames) {
    const dash = name.lastIndexOf('-')
    if (dash < 0) continue
    const kind = name.slice(0, dash)
    const pose = name.slice(dash + 1)
    if (!byKind.has(kind)) byKind.set(kind, new Set())
    byKind.get(kind).add(pose)
  }
  const sprites = {}
  for (const [kind, poses] of byKind) {
    const box = FRAME_BOXES[kind]
    if (!box) continue
    if (box.poses.every((pose) => poses.has(pose))) {
      sprites[kind] = [...box.poses]
    }
  }
  const portraits = bakedNames
    .filter((name) => name.endsWith('-portrait'))
    .map((name) => name.slice(0, -'-portrait'.length))
    .filter((charId) => FRAME_BOXES[charId])
  return { sprites, portraits }
}
