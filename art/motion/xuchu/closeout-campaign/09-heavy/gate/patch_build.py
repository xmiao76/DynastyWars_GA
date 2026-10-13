import pathlib
p = pathlib.Path('art/motion/xuchu/closeout-campaign/09-heavy/gate/build.mjs')
s = p.read_text(encoding='utf-8')
def rep(old, new):
    global s
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new)

rep("""// CMR-15A combo FOCUSED-FIX gate (work cmr15a-combo-focused-fix-gates). Zero generation.
// Identical method to 08-combo/gate/build.mjs (copied + adapted): component-extracts
// focused-fix/candidate-raw.png (e3161283...), registers ALL 9 cells (keeps 0-4 + spares
// 5-8, spares gated for possible role substitution) with ONE uniform sheet scale from
// cell4 recover crown->sole = 459px, ground->500, canvas 1024x512; measures fresh raster
// weapon/body/ground/seam landmarks vs the frozen band; attempts deterministic shaft
// retouch FIRST for any OUT_HIGH length outlier, re-measures; emits final cells + marked
// (butt/tip/ground) + head/tip/soles zooms + contact sheets. Cell2 in this focused-fix
// sheet: complete round butt-cap ball fully visible left of the cape and complete blade
// tip inside frame (personally verified on cells-native/cell2-capzoom.png +
// cell2-tipzoom.png, zoom_probe.py), so BUTT_VISIBLE[2]=true and length is measurable.
// Banking/WAIVER_ELIGIBLE decided in gate-verdict.mjs. Deterministic reruns.""",
"""// CMR-15A Phase-3 HEAVY gate (work cmr15a-phase3-heavy-gates). Zero generation.
// Identical method to 08-combo/focused-fix/gate/build.mjs (copied + adapted):
// component-extracts 09-heavy/candidate-raw.png (37b72517...), registers ALL 9 cells
// (keeps 0-4 + spares 5-8, spares gated for possible role substitution) with ONE uniform
// sheet scale from cell4 recover crown->sole = 459px, sole->ground; measures fresh raster
// weapon/body/ground/seam landmarks vs the frozen band; attempts deterministic shaft
// retouch FIRST for any OUT_HIGH length outlier, re-measures; emits final cells + marked
// (butt/tip/ground) + head/tip/soles zooms + contact sheets.
// Adaptations (proved measurement corrections, band/scale unchanged):
//  (1) canvas height widened 512->768 (ground 756 = frozen 500 + 256 top pad), mirroring
//      the combo width widening 768->1024: heavy overhead tips legitimately extend above
//      the crown and a 512 canvas would artificially clip them before measurement.
//  (2) native butt landmark: axis min-projection band (as measureReg) instead of minX
//      band, because heavy overhead cells 1/5/6 carry the butt end on the RIGHT.
// Butt-cap visibility personally verified on gate/cells-native/*{butt,grip}zoom.png
// (zoom_probe.py): complete round cap balls on cells 0,1,4,5 only; cells 2,3,7,8 shaft
// ends flat at the grip and cell6 ends inside the far hand - no cap drawn, so
// BUTT_VISIBLE=false there and the measured value is the visible stub (lower bound).
// Banking/WAIVER_ELIGIBLE decided in gate-verdict.mjs. Deterministic reruns.""")

rep("const DIR = 'art/motion/xuchu/closeout-campaign/08-combo/focused-fix/'",
    "const DIR = 'art/motion/xuchu/closeout-campaign/09-heavy/'")
rep("const CANVAS_W = 1024, CANVAS_H = 512 // widened from charge 768: combo native spans up to 584px x scale ~1.49 overflow 768 and would clip tips",
    "const CANVAS_W = 1024, CANVAS_H = 768, PAD_TOP = 256 // height widened (see header); GROUND_Y = frozen 500 + PAD_TOP\nconst GROUND_Y = FROZEN.groundY + PAD_TOP")
# FROZEN defined before this line? order: FROZEN line precedes CANVAS line in source - ok
rep("if (!sheetSha.startsWith('e3161283'))", "if (!sheetSha.startsWith('37b72517'))")
rep("const ledgerState = { sha256: sha(ledgerBuf), xuchuUsed: ledger.fighters.xuchu.used, xuchuCombo: ledger.fighters.xuchu.sheetCandidates?.combo ?? null, globalUsed, expected: 'Xu Chu 17 (combo 2) / global 184', matches: ledger.fighters.xuchu.used === 17 && globalUsed === 184 }",
    "const ledgerState = { sha256: sha(ledgerBuf), xuchuUsed: ledger.fighters.xuchu.used, xuchuHeavy: ledger.fighters.xuchu.sheetCandidates?.heavy ?? null, globalUsed, expected: 'Xu Chu 18 (heavy 1) / global 185', matches: ledger.fighters.xuchu.used === 18 && globalUsed === 185 }")
rep("const NAMES = ['cell0-windup', 'cell1-rising-cut', 'cell2-follow-through', 'cell3-sweep', 'cell4-recover', 'cell5-spare-slash-a', 'cell6-spare-low-sweep', 'cell7-spare-rising', 'cell8-spare-guard-rising']",
    "const NAMES = ['cell0-raise', 'cell1-overhead-hold', 'cell2-crushing-chop', 'cell3-follow-through', 'cell4-recover', 'cell5-spare-overhead-a', 'cell6-spare-overhead-b', 'cell7-spare-chop-a', 'cell8-spare-chop-b']")
rep("const SCALE_CELL = 4 // recover = near-upright guard-link bookend (combo has no guard cell)",
    "const SCALE_CELL = 4 // recover = near-upright guard-link bookend (heavy has no guard cell)")
rep("const BUTT_VISIBLE = { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true }",
    "const BUTT_VISIBLE = { 0: true, 1: true, 2: false, 3: false, 4: true, 5: true, 6: false, 7: false, 8: false } // see header zooms")

rep("""// landmark boxes in SHEET coords, chosen from the focused-fix grid views
// (gate/cells-native/*-grid.png, recorded constants; all 9 grids personally opened.
//  cell2 butt box tightly covers the complete pommel ball left of the cape, excluding
//  cape pixels so the minX band lands on the cap)
const BOX = {
  0: { butt: [86, 200, 130, 232], tip: [340, 248, 440, 300], crownX: [260, 330], rearGrip: [110, 205, 175, 245], frontGrip: [250, 220, 315, 265], headX: [255, 335], socketPt: [340, 275] },
  1: { butt: [615, 210, 660, 245], tip: [860, 40, 970, 115], crownX: [695, 770], rearGrip: [700, 150, 785, 210], frontGrip: [795, 110, 865, 175], headX: [690, 775], socketPt: [865, 95] },
  2: { butt: [1090, 145, 1135, 185], tip: [1360, 38, 1450, 110], crownX: [1180, 1250], rearGrip: [1305, 90, 1380, 140], frontGrip: [1305, 90, 1380, 140], headX: [1175, 1255], socketPt: [1365, 90] },
  3: { butt: [120, 500, 165, 535], tip: [435, 460, 528, 525], crownX: [260, 325], rearGrip: [300, 485, 365, 535], frontGrip: [390, 485, 445, 530], headX: [255, 330], socketPt: [445, 505] },
  4: { butt: [615, 540, 660, 580], tip: [850, 420, 968, 490], crownX: [725, 795], rearGrip: [705, 495, 770, 550], frontGrip: [815, 465, 880, 520], headX: [720, 800], socketPt: [855, 475] },
  5: { butt: [1135, 530, 1180, 570], tip: [1360, 415, 1473, 490], crownX: [1215, 1285], rearGrip: [1240, 495, 1310, 540], frontGrip: [1300, 470, 1375, 525], headX: [1210, 1290], socketPt: [1370, 465] },
  6: { butt: [70, 820, 115, 860], tip: [390, 855, 487, 925], crownX: [260, 330], rearGrip: [240, 845, 300, 895], frontGrip: [360, 865, 420, 915], headX: [255, 335], socketPt: [395, 895] },
  7: { butt: [595, 830, 640, 870], tip: [825, 705, 936, 785], crownX: [700, 770], rearGrip: [690, 795, 755, 850], frontGrip: [775, 765, 840, 825], headX: [695, 775], socketPt: [835, 765] },
  8: { butt: [1105, 870, 1150, 910], tip: [1340, 720, 1449, 795], crownX: [1210, 1280], rearGrip: [1190, 840, 1255, 895], frontGrip: [1285, 805, 1350, 860], headX: [1205, 1285], socketPt: [1345, 805] },
}""",
"""// landmark boxes in SHEET coords, chosen from the heavy grid views
// (gate/cells-native/*-grid.png, recorded constants; all 9 grids + butt/grip/tip
// zooms personally opened. Butt boxes are tight on the cap ball (cells 0,1,4,5) or
// on the visible flat shaft terminus at the grip (stub cells 2,3,6,7,8).)
const BOX = {
  0: { butt: [78, 130, 115, 165], tip: [330, 5, 410, 80], crownX: [240, 300], rearGrip: [160, 100, 220, 155], frontGrip: [160, 100, 220, 155], headX: [240, 310], socketPt: [305, 62] },
  1: { butt: [795, 5, 845, 45], tip: [514, 80, 620, 145], crownX: [700, 760], rearGrip: [740, 20, 800, 75], frontGrip: [610, 70, 670, 125], headX: [690, 770], socketPt: [615, 105] },
  2: { butt: [1318, 225, 1350, 260], tip: [1420, 260, 1532, 340], crownX: [1260, 1330], rearGrip: [1310, 210, 1370, 270], frontGrip: [1360, 225, 1420, 285], headX: [1255, 1335], socketPt: [1415, 275] },
  3: { butt: [395, 555, 420, 590], tip: [500, 590, 592, 680], crownX: [300, 365], rearGrip: [380, 545, 440, 600], frontGrip: [380, 545, 440, 600], headX: [295, 370], socketPt: [495, 605] },
  4: { butt: [617, 560, 660, 600], tip: [900, 392, 987, 480], crownX: [740, 800], rearGrip: [705, 505, 765, 560], frontGrip: [815, 460, 875, 515], headX: [735, 805], socketPt: [875, 470] },
  5: { butt: [1445, 440, 1484, 480], tip: [1154, 371, 1250, 430], crownX: [1310, 1380], rearGrip: [1385, 430, 1445, 485], frontGrip: [1285, 385, 1345, 440], headX: [1305, 1385], socketPt: [1245, 405] },
  6: { butt: [275, 780, 315, 815], tip: [105, 686, 200, 760], crownX: [320, 385], rearGrip: [260, 770, 320, 825], frontGrip: [205, 745, 265, 800], headX: [315, 390], socketPt: [185, 735] },
  7: { butt: [865, 855, 895, 890], tip: [950, 890, 1050, 960], crownX: [760, 825], rearGrip: [845, 840, 905, 895], frontGrip: [845, 840, 905, 895], headX: [755, 830], socketPt: [945, 900] },
  8: { butt: [1300, 850, 1340, 890], tip: [1430, 880, 1531, 950], crownX: [1270, 1335], rearGrip: [1280, 840, 1360, 900], frontGrip: [1280, 840, 1360, 900], headX: [1265, 1340], socketPt: [1405, 885] },
}""")

rep("""  const bp = boxAlphaPts(b.butt, c.id)
  const minX = Math.min(...bp.map(p => p[0]))
  const band = bp.filter(p => p[0] < minX + 6)
  const butt = [band.reduce((s, p) => s + p[0], 0) / band.length, band.reduce((s, p) => s + p[1], 0) / band.length]
  const tp = boxAlphaPts(b.tip, c.id)
  const tc = [tp.reduce((s, p) => s + p[0], 0) / tp.length, tp.reduce((s, p) => s + p[1], 0) / tp.length]""",
"""  const bp = boxAlphaPts(b.butt, c.id)
  const tp = boxAlphaPts(b.tip, c.id)
  const tc = [tp.reduce((s, p) => s + p[0], 0) / tp.length, tp.reduce((s, p) => s + p[1], 0) / tp.length]
  // axis min-projection band (heavy adaptation (2)): initial axis buttBoxCentre->tip
  // centroid; butt = centroid of the 6px minimal-projection band (outer cap surface).
  const bc = [(b.butt[0] + b.butt[2]) / 2, (b.butt[1] + b.butt[3]) / 2]
  let aux = tc[0] - bc[0], auy = tc[1] - bc[1]; const aul = Math.hypot(aux, auy); aux /= aul; auy /= aul
  const tOfB = (p) => (p[0] - bc[0]) * aux + (p[1] - bc[1]) * auy
  const tMinB = Math.min(...bp.map(tOfB))
  const band = bp.filter(p => tOfB(p) < tMinB + 6)
  const butt = [band.reduce((s, p) => s + p[0], 0) / band.length, band.reduce((s, p) => s + p[1], 0) / band.length]""")

rep("const dy = Math.round(FROZEN.groundY - lm.sole * S)", "const dy = Math.round(GROUND_Y - lm.sole * S)")
rep("return { bounds: { xmin, ymin, xmax, ymax }, greenPx: green, edge, butt, tip, pxLen, u: pxLen * U_PER_PX, angDeg, boots, groundErrU: Math.abs(ymax - FROZEN.groundY) * U_PER_PX }",
    "return { bounds: { xmin, ymin, xmax, ymax }, greenPx: green, edge, butt, tip, pxLen, u: pxLen * U_PER_PX, angDeg, boots, groundErrU: Math.abs(ymax - GROUND_Y) * U_PER_PX }")
rep("for (let x = 0; x < marked.width; x++) { setPx(marked, x, FROZEN.groundY, [255, 0, 255]); setPx(marked, x, FROZEN.groundY + 1, [255, 0, 255]) }",
    "for (let x = 0; x < marked.width; x++) { setPx(marked, x, GROUND_Y, [255, 0, 255]); setPx(marked, x, GROUND_Y + 1, [255, 0, 255]) }")
rep("writeFileSync(G + `cells-registered/${r.name}-soles-zoom.png`, PNG.sync.write(cropScale(bgr, fm.bounds.xmin - 8, 440, fm.bounds.xmax + 8, 511, 2)))",
    "writeFileSync(G + `cells-registered/${r.name}-soles-zoom.png`, PNG.sync.write(cropScale(bgr, fm.bounds.xmin - 8, GROUND_Y - 60, fm.bounds.xmax + 8, CANVAS_H - 1, 2)))")
rep("writeFileSync(G + 'measure.json', JSON.stringify({ work: 'cmr15a-combo-focused-fix-gates',",
    "writeFileSync(G + 'measure.json', JSON.stringify({ work: 'cmr15a-phase3-heavy-gates', canvas: [CANVAS_W, CANVAS_H], groundYCanvas: GROUND_Y, padTop: PAD_TOP,")

p.write_text(s, encoding='utf-8')
print('patched ok', len(s))
