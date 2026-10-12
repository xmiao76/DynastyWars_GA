// CMR-14B per-frame heavy feasibility (work cmr14b-perframe-feasibility).
// No generation, no ledger change. Reads the 5 original cells + metrics endpoints,
// computes A/B/C extensions to target length, fit + figure-overlap flags,
// minimal symmetric padding, feasibility.json and feasibility-overlay.png.
import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const MARGIN = 8;
const TARGET = 531.7901536732883; // cell px, from plan.json band_center_cell_px
const BAND = [505.2006459896238, 558.3796613569527];
const FIG_ALPHA = 25; // >= this (3x3 max) counts as figure occupancy

const KEYS = [
  { key: 0, name: 'RAISE',   file: 'heavy-k0-original-cell.png', rect: [0, 0, 512, 550],     buttN: [65, 201],   tipN: [404, 14] },
  { key: 1, name: 'HOLD',    file: 'heavy-k1-original-cell.png', rect: [512, 0, 512, 550],   buttN: [561, 127],  tipN: [971, 28] },
  { key: 2, name: 'CHOP',    file: 'heavy-k2-original-cell.png', rect: [1024, 0, 512, 550],  buttN: [1113, 279], tipN: [1514, 512] },
  { key: 3, name: 'FOLLOW',  file: 'heavy-k3-original-cell.png', rect: [0, 550, 570, 474],   buttN: [150, 759],  tipN: [556, 947] },
  { key: 4, name: 'RECOVER', file: 'heavy-k4-original-cell.png', rect: [570, 550, 550, 474], buttN: [600, 776],  tipN: [1067, 647] },
];

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, s) => [a[0] * s, a[1] * s];
const hypot = (a) => Math.hypot(a[0], a[1]);
const r2 = (x) => Math.round(x * 100) / 100;

// max alpha in 3x3 neighbourhood of (x,y)
function alpha3(data, W, H, x, y) {
  let m = 0;
  for (let dy = -1; dy <= 1; dy++) {
    const yy = Math.round(y) + dy;
    if (yy < 0 || yy >= H) continue;
    for (let dx = -1; dx <= 1; dx++) {
      const xx = Math.round(x) + dx;
      if (xx < 0 || xx >= W) continue;
      const a = data[(yy * W + xx) * 4 + 3];
      if (a > m) m = a;
    }
  }
  return m;
}

// fraction of 1px samples along segment p->q with figure occupancy;
// skip first skipPx (to leave the shaft width at the current endpoint)
function overlapFrac(data, W, H, p, q, skipPx) {
  const d = sub(q, p), len = hypot(d);
  if (len < 1e-9) return { frac: 0, n: 0, hits: 0 };
  const n = Math.max(1, Math.floor(len));
  let hits = 0, cnt = 0;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * len;
    if (t < skipPx) continue;
    const x = p[0] + (d[0] / len) * t, y = p[1] + (d[1] / len) * t;
    if (x < 0 || y < 0 || x >= W || y >= H) continue; // outside cell: no figure
    cnt++;
    if (alpha3(data, W, H, x, y) >= FIG_ALPHA) hits++;
  }
  return { frac: cnt ? hits / cnt : 0, n: cnt, hits };
}

function insideMargin(p, W, H) {
  return p[0] >= MARGIN && p[0] <= W - 1 - MARGIN && p[1] >= MARGIN && p[1] <= H - 1 - MARGIN;
}
function minMargin(p, W, H) {
  return Math.min(p[0] - 0, W - 1 - p[0], p[1] - 0, H - 1 - p[1]);
}
function padFor(butt, tip, W, H) {
  const need = Math.max(
    MARGIN - Math.min(butt[0], tip[0]),
    Math.max(butt[0], tip[0]) - (W - 1 - MARGIN),
    MARGIN - Math.min(butt[1], tip[1]),
    Math.max(butt[1], tip[1]) - (H - 1 - MARGIN),
    0
  );
  return Math.ceil(need - 1e-9);
}

(async () => {
  const results = [];
  const tiles = [];
  for (const k of KEYS) {
    const img = await loadImage(path.join(DIR, k.file));
    const W = img.width, H = img.height;
    const c = createCanvas(W, H);
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, W, H).data;

    // background probe: corners
    const corners = [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3]]
      .map(([x, y]) => Array.from(data.slice((y * W + x) * 4, (y * W + x) * 4 + 4)));
    const bgTransparent = corners.every(px => px[3] === 0);

    const butt = sub(k.buttN, [k.rect[0], k.rect[1]]);
    const tip = sub(k.tipN, [k.rect[0], k.rect[1]]);
    const L = hypot(sub(tip, butt));
    const ext = TARGET - L;
    const u = mul(sub(tip, butt), 1 / L);

    const opts = {
      A: { butt, tip: add(tip, mul(u, ext)) },                    // tip only
      B: { butt: sub(butt, mul(u, ext)), tip },                   // butt only
      C: { butt: sub(butt, mul(u, ext / 2)), tip: add(tip, mul(u, ext / 2)) }, // split
    };
    const optOut = {};
    for (const [name, o] of Object.entries(opts)) {
      const segs = [];
      if (name === 'A') segs.push([tip, o.tip]);
      else if (name === 'B') segs.push([butt, o.butt]);
      else { segs.push([tip, o.tip], [butt, o.butt]); }
      let hits = 0, n = 0;
      for (const [p, q] of segs) {
        const r = overlapFrac(data, W, H, p, q, 8);
        hits += r.hits; n += r.n;
      }
      const fit = insideMargin(o.butt, W, H) && insideMargin(o.tip, W, H);
      optOut[name] = {
        new_butt_cell: [r2(o.butt[0]), r2(o.butt[1])],
        new_tip_cell: [r2(o.tip[0]), r2(o.tip[1])],
        length_cell_px: r2(hypot(sub(o.tip, o.butt))),
        fits_with_8px_margin: fit,
        min_endpoint_margin_px: r2(Math.min(minMargin(o.butt, W, H), minMargin(o.tip, W, H))),
        extension_crosses_figure: (n ? hits / n : 0) > 0.05,
        extension_figure_hit_frac: r2(n ? hits / n : 0),
        extension_samples: n,
        symmetric_padding_needed_px: padFor(o.butt, o.tip, W, H),
      };
    }

    // spear-axis occupancy of the CURRENT spear: confirms endpoints sit on paint
    const axis = overlapFrac(data, W, H, butt, tip, 0);

    // best option: no figure crossing first, then least padding, then C > A > B
    const rank = { C: 0, A: 1, B: 2 };
    const best = ['A', 'B', 'C'].sort((a, b) =>
      (optOut[a].extension_crosses_figure - optOut[b].extension_crosses_figure) ||
      (optOut[a].symmetric_padding_needed_px - optOut[b].symmetric_padding_needed_px) ||
      (rank[a] - rank[b]))[0];
    const pad = optOut[best].symmetric_padding_needed_px;

    results.push({
      key: k.key, name: k.name, cell_file: k.file, cell_size: [W, H],
      crop_rect_source: k.rect,
      butt_native_source: k.buttN, tip_native_source: k.tipN,
      butt_cell: [r2(butt[0]), r2(butt[1])], tip_cell: [r2(tip[0]), r2(tip[1])],
      current_length_cell_px: r2(L),
      target_length_cell_px: r2(TARGET),
      band_cell_px: [BAND[0], BAND[1]],
      extend_by_cell_px: r2(ext),
      background_all_corners_transparent: bgTransparent,
      corner_rgba: corners[0],
      current_axis_figure_occupancy_frac: r2(axis.frac),
      current_axis_samples: axis.n,
      endpoints_on_painted_spear: axis.frac > 0.5,
      options: optOut,
      best_option: best,
      best_option_reason: 'no-figure-crossing first, then least symmetric padding, then C>A>B',
      minimal_symmetric_padding_px_each_side: pad,
      padding_fill: bgTransparent ? 'transparent (cell corners alpha 0; use white or cell bg)' : `rgba(${corners[0].join(',')})`,
      padded_canvas_size: [W + 2 * pad, H + 2 * pad],
    });

    // build padded tile for overlay (white backing so transparent pad reads)
    const PW = W + 2 * pad, PH = H + 2 * pad;
    const t = createCanvas(PW, PH + 34);
    const g = t.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, PW, PH + 34);
    g.drawImage(img, pad, pad + 34);
    const X = (p) => p[0] + pad, Y = (p) => p[1] + pad + 34;
    // best-option target in red (under), current spear in green (over)
    const bo = opts[best];
    g.strokeStyle = '#ff0000'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(X(bo.butt), Y(bo.butt)); g.lineTo(X(bo.tip), Y(bo.tip)); g.stroke();
    g.strokeStyle = '#00b400'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(X(butt), Y(butt)); g.lineTo(X(tip), Y(tip)); g.stroke();
    for (const p of [butt, tip]) { g.fillStyle = '#00b400'; g.beginPath(); g.arc(X(p), Y(p), 5, 0, 7); g.fill(); }
    for (const p of [bo.butt, bo.tip]) { g.fillStyle = '#ff0000'; g.beginPath(); g.arc(X(p), Y(p), 5, 0, 7); g.fill(); }
    g.fillStyle = '#000000'; g.font = 'bold 20px sans-serif';
    g.fillText(`k${k.key} ${k.name} best=${best} pad=${pad} ${PW}x${PH}`, 8, 24);
    tiles.push(t);
  }

  const GAP = 12;
  const OW = tiles.reduce((s, t) => s + t.width, 0) + GAP * (tiles.length - 1) + 16;
  const OH = Math.max(...tiles.map(t => t.height)) + 16;
  const out = createCanvas(OW, OH);
  const og = out.getContext('2d');
  og.fillStyle = '#666666'; og.fillRect(0, 0, OW, OH);
  og.fillStyle = '#ffffff'; og.font = 'bold 20px sans-serif';
  og.fillText('green=current spear   red=best-option 532px target (padded tiles, white backing)', 10, 4 + 18);
  let ox = 8;
  const TOP = 8 + 30;
  for (const t of tiles) { og.drawImage(t, ox, TOP); ox += t.width + GAP; }

  fs.writeFileSync(path.join(DIR, 'feasibility-overlay.png'), out.toBuffer('image/png'));
  fs.writeFileSync(path.join(DIR, 'feasibility.json'),
    JSON.stringify({ work_id: 'cmr14b-perframe-feasibility', generated_by: 'feasibility.mjs (measurement only, no image generation)', target_length_cell_px: TARGET, band_cell_px: BAND, margin_px: MARGIN, figure_alpha_threshold_3x3: FIG_ALPHA, keys: results }, null, 2));
  for (const r of results) {
    console.log(`k${r.key} ${r.name} L=${r.current_length_cell_px} ext=${r.extend_by_cell_px} axis_occ=${r.current_axis_figure_occupancy_frac} ` +
      `A:fit=${r.options.A.fits_with_8px_margin} x=${r.options.A.extension_crosses_figure} pad=${r.options.A.symmetric_padding_needed_px} ` +
      `B:fit=${r.options.B.fits_with_8px_margin} x=${r.options.B.extension_crosses_figure} pad=${r.options.B.symmetric_padding_needed_px} ` +
      `C:fit=${r.options.C.fits_with_8px_margin} x=${r.options.C.extension_crosses_figure} pad=${r.options.C.symmetric_padding_needed_px} ` +
      `=> best=${r.best_option} pad=${r.minimal_symmetric_padding_px_each_side} canvas=${r.padded_canvas_size}`);
  }
})().catch(e => { console.error('FAIL', e); process.exit(1); });
