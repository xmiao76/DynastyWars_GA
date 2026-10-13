# CMR-15A COMPLETION Phase B — gate for the ONE shared two-panel heavy fix
# candidate 2035a2d1 (work cmr15a-heavy-shared-fix-gates). ZERO generation.
# Split: deterministic by the recorded two-panel geometry (two-panel-ref.json:
# panels 704x528 at (32,248)/(800,248), pack scale 0.6875, clear separation
# column x in [736,800)) — panels are separated at the separation-column
# midpoint x=768 and each side's figure is taken as its largest alpha>=16
# component (the candidate enlarged both figures, soles spill below the
# recorded panel bottom 776, so a hard panel crop would clip; the separation
# column itself carries zero alpha>=16 px and neither component crosses it).
# Registration/measure/retouch reuse the phase-b cell2/cell3 gate method:
# ONE uniform scale+translate per panel onto the heavy 1024x768 canvas
# (groundY 756), scale = ORIGINAL registered crouched body / candidate body,
# deterministic shaft retouch (max feasible) BEFORE any length verdict.
# Accepted copies are written ONLY when VISUAL_PASS is set after the evidence
# images have been personally opened and every role passes (or cell4/shared
# cells under the recorded <=9u waiver, FAIL retained).
import json, math, hashlib, shutil
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

D = Path('art/motion/xuchu/closeout-campaign/09-heavy/phase-b-shared-fix')
HEAVY = Path('art/motion/xuchu/closeout-campaign/09-heavy')
def sha(b): return hashlib.sha256(b).hexdigest()
def fsha(p): return sha(Path(p).read_bytes())
U = 124/477
BAND = [124.40626991803302, 137.50166675151021]
TARGET_U = 132.0
CW, CH, GROUND = 1024, 768, 756
r2 = lambda v: round(float(v), 2)
VISUAL_PASS = True  # set only after personal inspection of all evidence (see VISUAL)
VISUAL = {
 'cell2': dict(
   identity='PASS (marked + head-zoom personally opened vs original cell1/selected cell4 on the continuity contacts: same helmeted blunt bearded face, ochre/dark lamellar, red-tassel glaive; no substitution/drift)',
   anatomy='PASS (connected anatomy, both hands visibly wrap the haft in grips-zoom, two legs/boots planted, no extra/floating limbs)',
   poseRole='PASS (crushing chop: coiled down-forward lunge, wide planted stance, glaive driven down-forward; matches the isolated cell2 candidate and the original cell2 pose)',
   buttCapDrawn='PASS (complete round metal butt-cap ball fully drawn in empty margin behind the back, cap-4x; butt marker sits on the true cap ball)',
   weaponCorridor='PASS (one straight rigid shaft butt->tip through both grips on marked + grips-zoom, no fork/bend; grip box-centroid perp values are whole-hand/forearm box centroids, not shaft offset)',
   seamsVisual='PASS (final shaft/body continuous at gameplay size; no retouch applied; no streak residue in the extracted final — raw alpha 1-15 streaks stay below the extraction threshold and reach no final pixel)',
   headEndpointRAW='RAW: beard merges into the collar, chin/beard-base endpoint concealed (head-zoom, 0px readable gap) — not a reject; batch-end UNVERIFIED_OWNER_ACCEPTED reserved only at batch end'),
 'cell3': dict(
   identity='PASS (marked + head-zoom personally opened vs original cell1/selected cell4 on the continuity contacts: same helmeted blunt bearded face, ochre/dark lamellar, red-tassel glaive; no substitution/drift)',
   anatomy='PASS (connected anatomy; front hand visibly wraps the haft in grips-zoom, shaft passes behind arm/torso exactly as the original follow-through, two legs/boots planted, no extra/floating limbs)',
   poseRole='PASS (follow-through: deeper low down-forward lunge after the chop, glaive driven low; matches the isolated cell3 candidate and the original cell3 pose, distinct from cell2)',
   buttCapDrawn='PASS (complete round metal butt-cap ball fully drawn in empty margin behind the back, cap-4x; butt marker sits on the true cap ball)',
   weaponCorridor='PASS (one straight rigid shaft butt->tip through the front grip and behind the torso on the same line on marked + grips-zoom, no fork/bend)',
   seamsVisual='PASS (final shaft/body continuous at gameplay size; deterministic retouch assessed first and applied 0px — final is byte-identical to the registered cell, so no joint exists; no streak residue in the extracted final)',
   headEndpointRAW='RAW: beard merges into the collar, chin/beard-base endpoint concealed (head-zoom, 0px readable gap) — not a reject; batch-end UNVERIFIED_OWNER_ACCEPTED reserved only at batch end'),
 'continuityVisual': 'PASS (both continuity contacts personally opened: cell0 raise -> cell1 overhead -> shared cell2 chop -> shared cell3 follow-through -> selected cell4 recover reads as one coherent crushing-chop arc; same identity/costume/grips, soles on one ground line, glaive blade/tassel consistent; the only continuity blemish is the recorded weapon-length progression 129.07/130.47/136.39/141.14/145.22u, which is the waived length/spread deviation, not a pose/identity break)',
}

# ---- source verification (fresh hashes) ----
SOURCES = {
 'sharedCandidate': (D/'candidate-raw.png', '2035a2d18e4b9ad3779bc73fb62c666e581157f8e6260d0a80932d3ae211f54b'),
 'twoPanelRef': (D/'two-panel-ref.png', '7d2e8ff3da2505ee0e044c53822e1935673efe69be455915472ad93bcf7c9d20'),
 'isolatedCell2Final': (HEAVY/'phase-b/cell2-retouched.png', '1ce7855bed87b89fa514935f7ebf78a1ddef10a3a2d5a0a3c73089ab456a1d4c'),
 'isolatedCell3Final': (HEAVY/'phase-b-cell3/cell3-retouched.png', 'cf208444cd4faf7400861cee17a2cd4afad46225c198f729a63460d8291c4f44'),
 'originalCell0': (HEAVY/'gate/cells-registered/cell0-raise-registered.png', '7b416cd6a49055226390690ce4a6acb24cc30e4f92b0db56ac3e954c0d9bcfb7'),
 'originalCell1': (HEAVY/'gate/cells-registered/cell1-overhead-hold-registered.png', '26270b4c7837522a82587a124aaab8e5be7ccd681b5587be3f6cb7d47d6113b5'),
 'originalCell2Stub': (HEAVY/'gate/cells-registered/cell2-crushing-chop-registered.png', '6c59ba43f7fc04511f11be1bf202c252da3d49cc4bff49503f3ceee0a31d8ca1'),
 'originalCell3Stub': (HEAVY/'gate/cells-registered/cell3-follow-through-registered.png', '9d7a0c0230a3c8b94a53a8d0650ec9a28bdf84448bece2cd961adabd961c6ee6'),
 'fixCell2': (HEAVY/'focused-fix/gate/cells-registered/cell2-crushing-chop-retouched.png', 'ebe2d49c40995ce0e61513f44359b3143faefc68b40ebc0d68f2c60e7dca0ae0'),
 'fixCell3Stub': (HEAVY/'focused-fix/gate/cells-registered/cell3-follow-through-registered.png', '8b35c738092850499c71cb8bbcd72d0448fc54e1ba8258cb3d1f698cdb5abd02'),
 'fixCell4Selected': (HEAVY/'focused-fix/gate/cells-registered/cell4-recover-retouched.png', '57190b6f0d3e7b26b868ecb4e6d89a3ca6dad4b399e3db7104adcfb1861ae9a8'),
}
src_report = {}
for k, (p, exp) in SOURCES.items():
    got = fsha(p); assert got == exp, (k, got)
    src_report[k] = dict(path=str(p), sha256=got, verified=True)
ledger_path = Path('art/motion/generation-budget.json')
ledger_hash = fsha(ledger_path); assert ledger_hash.startswith('a35d7441'), ledger_hash
led = json.loads(ledger_path.read_text(encoding='utf-8'))
xu = led['fighters']['xuchu']; gsum = sum(f['used'] for f in led['fighters'].values())
ledger_report = dict(sha256=ledger_hash, xuchuUsed=xu['used'], xuchuHeavy=xu['sheetCandidates'].get('heavy'),
                     globalSummed=gsum, ceilings='32/199')

cand_path = D/'candidate-raw.png'
im = Image.open(cand_path).convert('RGBA'); W, H = im.size
arr = np.array(im); al = arr[:, :, 3]
raw_streaks = dict(alpha1to15Px=int(((al >= 1) & (al <= 15)).sum()),
                   alpha16to127Px=int(((al >= 16) & (al <= 127)).sum()),
                   gap736_800AlphaGe16=int((al[:, 736:800] >= 16).sum()),
                   gap736_800AlphaGe1=int((al[:, 736:800] >= 1).sum()),
                   note='raw candidate carries faint horizontal streak residue at alpha 1-15 (below the campaign alpha>=16 extraction threshold); extraction keeps only the two figure components, so no streak pixel reaches any final cell')

# ---- deterministic split by recorded geometry ----
mask_all = al >= 16
lab, ncomp = ndimage.label(mask_all, structure=np.ones((3, 3)))
comps = []
for i in range(1, ncomp+1):
    mm = lab == i; ys, xs = np.where(mm)
    comps.append(dict(id=i, n=int(mm.sum()), xmin=int(xs.min()), ymin=int(ys.min()), xmax=int(xs.max()), ymax=int(ys.max())))
comps.sort(key=lambda c: -c['n'])
assert len(comps) >= 2
two = sorted(comps[:2], key=lambda c: c['xmin'])
assert two[0]['xmax'] < 768 <= two[1]['xmin'], two
panel_masks = {'cell2': lab == two[0]['id'], 'cell3': lab == two[1]['id']}

CELLS = {
 'cell2': dict(role='crushing chop', side='LEFT', origBody=398.0, targetAng=10.29,
   BOX=dict(butt=[155,535,215,595], tip=[560,610,720,730], rearGrip=[425,575,495,650],
            frontGrip=[485,595,550,665], socket=[548,638], crownX=[390,470]),
   headNative=[430.,465.], gripsNative=[485.,620.]),
 'cell3': dict(role='follow-through', side='RIGHT', origBody=396.48, targetAng=15.66,
   BOX=dict(butt=[960,515,1020,575], tip=[1330,630,1500,740], rearGrip=[1075,535,1195,625],
            frontGrip=[1240,595,1330,670], socket=[1338,658], crownX=[1190,1270]),
   headNative=[1230.,465.], gripsNative=[1285.,632.]),
}

def pts(box, m):
    sub = m[box[1]:box[3]+1, box[0]:box[2]+1]
    yy, xx = np.where(sub)
    return np.stack([xx+box[0], yy+box[1]], axis=1).astype(float)

def measure(a, butt_hint, tip_hint):
    m = a[:, :, 3] >= 16
    yy, xx = np.where(m)
    xmin, xmax, ymin, ymax = int(xx.min()), int(xx.max()), int(yy.min()), int(yy.max())
    green = int(((a[:, :, 1] > 150) & (a[:, :, 0] < 120) & (a[:, :, 2] < 120) & m).sum())
    magenta = int(((a[:, :, 0] > 180) & (a[:, :, 2] > 180) & (a[:, :, 1] < 100) & m).sum())
    edge = dict(l=int(m[:, 0].sum()), r=int(m[:, -1].sum()), t=int(m[0, :].sum()), b=int(m[-1, :].sum()))
    def near(hint, rad):
        x0, x1 = max(0, round(hint[0]-rad)), min(CW-1, round(hint[0]+rad))
        y0, y1 = max(0, round(hint[1]-rad)), min(CH-1, round(hint[1]+rad))
        sub = m[y0:y1+1, x0:x1+1]; sy, sx = np.where(sub)
        return np.stack([sx+x0, sy+y0], axis=1).astype(float)
    hu = tip_hint-butt_hint; hu /= np.linalg.norm(hu)
    bp2 = near(butt_hint, 16)
    bp2 = bp2[np.abs((bp2-butt_hint) @ np.array([-hu[1], hu[0]])) <= 18]
    tb = (bp2-butt_hint) @ hu; butt = bp2[tb < tb.min()+7].mean(axis=0)
    tp2 = near(tip_hint, 60); tc2 = tp2.mean(axis=0)
    uu = tc2-butt; uu /= np.linalg.norm(uu)
    tt2 = (tp2-butt) @ uu; tip = tp2[tt2.argmax()]
    pxlen = float(np.linalg.norm(tip-butt)); ang = math.degrees(math.atan2(tip[1]-butt[1], tip[0]-butt[0]))
    colr = np.array([(np.where(m[:, x])[0].max() if m[:, x].any() else -1) for x in range(CW)])
    boots = []; cur = None
    for x in range(CW):
        if colr[x] >= ymax-26:
            cur = [x, x, int(colr[x])] if cur is None else [cur[0], x, max(cur[2], int(colr[x]))]
        elif cur: boots.append(cur); cur = None
    if cur: boots.append(cur)
    merged = []
    for b in boots:
        if merged and b[0]-merged[-1][1] < 24:
            merged[-1][1] = b[1]; merged[-1][2] = max(merged[-1][2], b[2])
        else: merged.append(list(b))
    return dict(bounds=dict(xmin=xmin, ymin=ymin, xmax=xmax, ymax=ymax), greenPx=green, magentaPx=magenta,
                edge=edge, butt=[r2(butt[0]), r2(butt[1])], tip=[int(tip[0]), int(tip[1])],
                pxLen=r2(pxlen), u=r2(pxlen*U), angDeg=r2(ang),
                boots=[dict(x0=b[0], x1=b[1], soleY=b[2]) for b in merged],
                groundErrU=r2(abs(ymax-GROUND)*U), _butt=butt, _tip=tip)

def retouch(a, m, rearT, frontT, socketT):
    butt = m['_butt']; tip = m['_tip'].astype(float)
    uu = tip-butt; L = np.linalg.norm(uu); uu /= L; vv = np.array([-uu[1], uu[0]])
    remove = int(round(m['pxLen'] - TARGET_U/U))
    amask = a[:, :, 3] >= 16
    def extent(t):
        lo = hi = None; gaps = 0; prev = False
        for p in range(-56, 57):
            x = round(butt[0]+uu[0]*t+vv[0]*p); y = round(butt[1]+uu[1]*t+vv[1]*p)
            on = 0 <= x < CW and 0 <= y < CH and amask[y, x]
            if on:
                if lo is None: lo = p
                hi = p
                if not prev and lo != p: gaps += 1
            prev = on
        return None if lo is None else (lo, hi, hi-lo+1, gaps)
    def shaft_only(t):
        e = extent(t); return e is not None and e[2] <= 30 and e[3] == 0
    cap_end = None
    for t in range(8, 65, 2):
        if shaft_only(t): cap_end = t; break
    butt_clean_end = cap_end or 0
    if cap_end is not None:
        t = cap_end
        while t < rearT[0]:
            if shaft_only(t): butt_clean_end = t
            else: break
            t += 2
    blade_run = None; run_start = None
    t = math.ceil(frontT[1])
    while t <= math.floor(socketT):
        if shaft_only(t):
            if run_start is None: run_start = t
        elif run_start is not None:
            r = [run_start, t-2]
            if not blade_run or r[1]-r[0] > blade_run[1]-blade_run[0]: blade_run = r
            run_start = None
        t += 2
    if run_start is not None:
        r = [run_start, math.floor(socketT)]
        if not blade_run or r[1]-r[0] > blade_run[1]-blade_run[0]: blade_run = r
    cap_e = cap_end if cap_end is not None else 16
    butt_avail = 0 if cap_end is None else max(0, butt_clean_end-cap_e)
    blade_avail = max(0, blade_run[1]-blade_run[0]-8) if blade_run else 0
    butt_remove = min(remove, butt_avail); blade_remove = min(remove-butt_remove, blade_avail)
    width_profile = {}
    for _t in range(0, 560, 20):
        _e = extent(_t); width_profile[str(_t)] = (_e[2] if _e else 0)
    feas = dict(widthProfilePerpPxEvery20T=width_profile,
                widthProfileNote='perp extent >30px (or the 113px scan cap) along the whole butt run and from the front grip to the socket: the shaft lies across the back/skirt/torso silhouette and the blade socket follows the front grip immediately, so no clean shaft-only run exists (campaign shaft_only = width<=30, gaps 0)',
                capStartT=cap_end, buttCleanEndT=int(butt_clean_end), bladeRunT=blade_run,
                socketTReg=r2(socketT), buttAvailPx=int(butt_avail), bladeAvailPx=int(blade_avail),
                removeToTarget132Px=int(remove), removeToBandHiPx=int(math.ceil(m['pxLen']-BAND[1]/U)),
                totalAvailPx=int(butt_avail+blade_avail),
                reachesBand=bool(butt_avail+blade_avail >= math.ceil(m['pxLen']-BAND[1]/U)),
                reachesTarget=bool(butt_avail+blade_avail >= remove))
    out = a.copy()
    yy, xx = np.where(a[:, :, 3] >= 1)
    P = np.stack([xx, yy], axis=1).astype(float)
    tv = (P-butt) @ uu; pv = np.abs((P-butt) @ vv)
    ops = []; bcut = dcut = None
    if butt_remove > 0:
        bcut = [int(cap_e), int(cap_e+butt_remove)]
        sel = np.where((pv <= 20) & (tv < bcut[1]))[0]
        for i in sel: ops.append((i, 'buttSeg' if tv[i] < bcut[0] else 'drop'))
    if blade_remove > 0:
        t3 = blade_run[1]-4; t2 = t3-blade_remove; dcut = [int(t2), int(t3)]
        sel = np.where(tv >= t2)[0]
        for i in sel: ops.append((i, 'bladeSeg' if tv[i] >= t3 else 'drop'))
    def width_at(t):
        lo, hi = 10**9, -10**9
        for p in range(-56, 57):
            x = round(butt[0]+uu[0]*t+vv[0]*p); y = round(butt[1]+uu[1]*t+vv[1]*p)
            if 0 <= x < CW and 0 <= y < CH and amask[y, x]:
                lo = min(lo, p); hi = max(hi, p)
        return [lo, hi] if hi >= lo else None
    seam = {}
    if bcut: seam['buttJoint'] = dict(cutT=bcut, widthBeforeCut=width_at(bcut[0]-3), widthAfterJoint=width_at(bcut[1]+3))
    if dcut: seam['bladeJoint'] = dict(cutT=dcut, widthBeforeJoint=width_at(dcut[0]-3), widthAfterCut=width_at(dcut[1]+3))
    shB = np.round(uu*butt_remove).astype(int) if bcut else np.zeros(2, int)
    shD = np.round(-uu*blade_remove).astype(int) if dcut else np.zeros(2, int)
    moved = 0; copied = []
    for i, kind in ops:
        x, y = int(P[i][0]), int(P[i][1]); copied.append((x, y, a[y, x].copy(), kind))
        out[y, x] = 0
    for x, y, data, kind in copied:
        if kind == 'drop': continue
        sh = shB if kind == 'buttSeg' else shD
        nx, ny = x+int(sh[0]), y+int(sh[1])
        if 0 <= nx < CW and 0 <= ny < CH:
            out[ny, nx] = data; moved += 1
    fa = a.reshape(-1, 4); fo = out.reshape(-1, 4)
    allP = np.stack(np.where(np.ones((CH, CW))), axis=1)[:, ::-1].astype(float)
    tall = (allP-butt) @ uu; pall = np.abs((allP-butt) @ vv)
    inreg = ((pall <= 20) & (tall < rearT[0])) | (tall >= frontT[1])
    same = (fa == fo).all(axis=1)
    hB = hashlib.sha256(fa[~inreg].tobytes()).hexdigest(); hA = hashlib.sha256(fo[~inreg].tobytes()).hexdigest()
    proof = dict(hashBefore=hB, hashAfter=hA, changedOutside=int((~same & ~inreg).sum()), changedInside=int((~same & inreg).sum()))
    return out, dict(feasibility=feas, removeRequestedPx=int(remove), buttRemovePx=int(butt_remove),
                     bladeRemovePx=int(blade_remove), bCut=bcut, dCut=dcut, seam=seam, movedPx=int(moved),
                     outsideProof=proof)

def clean(m): return {k: v for k, v in m.items() if not k.startswith('_')}
def axis(a): return a-180 if a > 90 else (a+180 if a < -90 else a)
step = lambda a, b: r2(abs(axis(a)-axis(b)))
def on_dark(a):
    bg = Image.new('RGBA', (a.shape[1], a.shape[0]), (32, 32, 32, 255))
    bg.alpha_composite(Image.fromarray(a)); return bg

results = {}
finals = {}
for key, cfg in CELLS.items():
    mask = panel_masks[key]
    extracted = np.zeros_like(arr); extracted[mask] = arr[mask]
    Image.fromarray(extracted).save(D/f'{key}-extracted-native.png')
    comp = two[0] if key == 'cell2' else two[1]
    BOX = cfg['BOX']
    bp = pts(BOX['butt'], mask); tp = pts(BOX['tip'], mask)
    tc = tp.mean(axis=0); bc = np.array([(BOX['butt'][0]+BOX['butt'][2])/2, (BOX['butt'][1]+BOX['butt'][3])/2])
    u = tc-bc; u /= np.linalg.norm(u)
    t = (bp-bc) @ u; butt_n = bp[t < t.min()+6].mean(axis=0)
    u = tc-butt_n; u /= np.linalg.norm(u)
    tt = (tp-butt_n) @ u; tip_n = tp[tt.argmax()]
    len_n = float(np.linalg.norm(tip_n-butt_n)); ang_n = math.degrees(math.atan2(tip_n[1]-butt_n[1], tip_n[0]-butt_n[0]))
    sub = mask[:, BOX['crownX'][0]:BOX['crownX'][1]+1]
    crown_n = int(np.where(sub.any(axis=1))[0].min()); sole_n = int(comp['ymax'])
    body_n = sole_n - crown_n
    gripT_n = {}; cents = {}
    for k in ('rearGrip', 'frontGrip'):
        p = pts(BOX[k], mask); tv = (p-butt_n) @ u
        gripT_n[k] = [float(tv.min()), float(tv.max())]; cents[k] = p.mean(axis=0)
    socketT_n = float((np.array(BOX['socket'], float)-butt_n) @ u)
    v = np.array([-u[1], u[0]])
    grip_perp_n = {k: float(abs((cents[k]-butt_n) @ v)) for k in cents}
    col = np.array([(np.where(mask[:, x])[0].max() if mask[:, x].any() else -1) for x in range(W)])
    boots_n = []; cur = None
    for x in range(W):
        if col[x] >= sole_n-26:
            cur = [x, x, int(col[x])] if cur is None else [cur[0], x, max(cur[2], int(col[x]))]
        elif cur: boots_n.append(cur); cur = None
    if cur: boots_n.append(cur)
    # registration (campaign salvage step 1: whole-panel uniform scale+translate)
    S = cfg['origBody'] / body_n
    dx = round(CW/2 - ((comp['xmin']+comp['xmax'])/2)*S)
    dy = round(GROUND - sole_n*S)
    def register(src_arr, S=S, dx=dx, dy=dy):
        yy, xx = np.mgrid[0:CH, 0:CW]
        fx = (xx-dx)/S - 0.5; fy = (yy-dy)/S - 0.5
        x0 = np.floor(fx).astype(int); y0 = np.floor(fy).astype(int)
        tx = fx-x0; ty = fy-y0
        out = np.zeros((CH, CW, 4), float)
        src = src_arr.astype(float)
        for ox, oy, wgt in [(0,0,(1-tx)*(1-ty)), (1,0,tx*(1-ty)), (0,1,(1-tx)*ty), (1,1,tx*ty)]:
            px = np.clip(x0+ox, 0, W-1); py = np.clip(y0+oy, 0, H-1)
            valid = ((x0+ox) >= 0) & ((x0+ox) < W) & ((y0+oy) >= 0) & ((y0+oy) < H)
            samp = src[py, px]
            a_ = samp[:, :, 3:4]/255.0
            out[:, :, 0:3] += samp[:, :, 0:3]*a_*wgt[:, :, None]*valid[:, :, None]
            out[:, :, 3:4] += samp[:, :, 3:4]*wgt[:, :, None]*valid[:, :, None]
        av = out[:, :, 3]/255.0
        res = np.zeros((CH, CW, 4), np.uint8)
        m_ = out[:, :, 3] > 0.5
        for c in range(3):
            ch_ = np.zeros((CH, CW)); ch_[m_] = np.minimum(255, np.round(out[:, :, c][m_]/av[m_])); res[:, :, c] = ch_
        res[:, :, 3] = np.round(out[:, :, 3]).astype(np.uint8)
        return res
    reg = register(extracted)
    Image.fromarray(reg).save(D/f'{key}-registered.png')
    reg_hash = fsha(D/f'{key}-registered.png')
    tf = lambda p: np.array([p[0]*S+dx, p[1]*S+dy])
    m0 = measure(reg, tf(butt_n), tf(tip_n))
    rearT = [gripT_n['rearGrip'][0]*S, gripT_n['rearGrip'][1]*S]
    frontT = [gripT_n['frontGrip'][0]*S, gripT_n['frontGrip'][1]*S]
    rt = None; m1 = None; final = reg; final_name = f'{key}-registered.png'
    if m0['u'] > BAND[1]:
        rt_arr, rt = retouch(reg, m0, rearT, frontT, socketT_n*S)
        Image.fromarray(rt_arr).save(D/f'{key}-retouched.png')
        ax = (m0['_tip']-m0['_butt']); ax = ax/np.linalg.norm(ax)
        bh = tf(butt_n)+ax*rt['buttRemovePx']; th = tf(tip_n)-ax*rt['bladeRemovePx']
        m1 = measure(rt_arr, bh, th)
        final = rt_arr; final_name = f'{key}-retouched.png'
    mf = m1 or m0
    final_hash = fsha(D/final_name)
    finals[key] = (final, final_name, final_hash, mf)
    # evidence
    fin = on_dark(final)
    mk = fin.copy(); dr = ImageDraw.Draw(mk)
    dr.line([(0, GROUND), (CW, GROUND)], fill=(0, 255, 128), width=2)
    for p, lab_ in [(mf['butt'], 'BUTT'), (mf['tip'], 'TIP')]:
        dr.ellipse([p[0]-7, p[1]-7, p[0]+7, p[1]+7], outline=(255, 64, 64), width=3); dr.text((p[0]+10, p[1]-8), lab_, fill=(255, 64, 64))
    dr.line([tuple(mf['butt']), tuple(mf['tip'])], fill=(255, 64, 64), width=2)
    dr.text((10, 10), f"{key} shared-fix final {mf['pxLen']}px {mf['u']}u ang {mf['angDeg']} ground756", fill=(255, 255, 255))
    mk.save(D/f'{key}-final-marked.png')
    def zoom(center, half, name, scale=4):
        x0 = max(0, int(center[0]-half)); y0 = max(0, int(center[1]-half))
        c = fin.crop((x0, y0, min(CW, int(center[0]+half)), min(CH, int(center[1]+half))))
        c = c.resize((c.width*scale, c.height*scale), Image.NEAREST); c.save(D/name)
    zoom(mf['butt'], 45, f'{key}-final-cap-4x.png')
    zoom(mf['tip'], 55, f'{key}-final-tip-4x.png')
    zoom(tf(np.array(cfg['headNative'])), 95, f'{key}-final-head-zoom.png', 3)
    fin.crop((60, 640, 700, 768)).resize((640*2, 128*2), Image.NEAREST).save(D/f'{key}-final-soles-zoom.png')
    if rt and rt['bCut']:
        _ax = m0['_tip']-m0['_butt']; _ax = _ax/np.linalg.norm(_ax)
        zoom(m0['_butt']+_ax*rt['bCut'][1], 40, f'{key}-final-seam-buttjoint-4x.png')
    if rt and rt['dCut']:
        _ax = m0['_tip']-m0['_butt']; _ax = _ax/np.linalg.norm(_ax)
        zoom(m0['_butt']+_ax*rt['dCut'][0], 40, f'{key}-final-seam-bladejoint-4x.png')
    zoom(tf(np.array(cfg['gripsNative'])), 95, f'{key}-final-grips-zoom.png', 3)
    fin.resize((256, 192), Image.LANCZOS).save(D/f'{key}-final-gameplay.png')
    in_band = BAND[0] <= mf['u'] <= BAND[1]
    dev = r2(mf['u']-BAND[1]) if mf['u'] > BAND[1] else (r2(BAND[0]-mf['u']) if mf['u'] < BAND[0] else 0.0)
    results[key] = dict(
        role=cfg['role'], side=cfg['side'],
        split=dict(recordedPanel=dict(offset=[32, 248] if key == 'cell2' else [800, 248], size=[704, 528], packScale=0.6875),
                   separationColumn=[736, 800], splitX=768,
                   component=dict(n=comp['n'], bounds=[comp['xmin'], comp['ymin'], comp['xmax'], comp['ymax']]),
                   panelBottomRecorded=776, soleY=sole_n,
                   note='component lies wholly on its recorded side of the clear separation column; soles spill below the recorded panel bottom because the edit enlarged the figure (recorded raw)'),
        native=dict(butt=[r2(butt_n[0]), r2(butt_n[1])], tip=[int(tip_n[0]), int(tip_n[1])], pxLen=r2(len_n), angDeg=r2(ang_n),
                    crownY=crown_n, soleY=sole_n, crouchedCrownSolePx=int(body_n), boots=boots_n,
                    rearGripT=[r2(x) for x in gripT_n['rearGrip']], frontGripT=[r2(x) for x in gripT_n['frontGrip']],
                    socketT=r2(socketT_n), gripCentroidPerpPx={k: r2(v) for k, v in grip_perp_n.items()},
                    frameMarginsPx=dict(buttLeft=int(round(butt_n[0])), tipRight=int(W-1-tip_n[0]), top=int(comp['ymin']), bottom=int(H-1-sole_n)),
                    vsPanelTarget=dict(weaponNativePx=r2(len_n), briefedTargetNativePanelPx=345.89,
                                       bodyNativePx=int(body_n), panelBodyPx=r2(cfg['origBody']*0.6875),
                                       enlargementVsPanelPct=r2((body_n/(cfg['origBody']*0.6875)-1)*100),
                                       weaponBodyRatioNative=r2(len_n/body_n),
                                       ownPanelCheck=dict(panelX=[32, 736] if key == 'cell2' else [800, 1504],
                                                          buttX=r2(butt_n[0]), tipX=int(tip_n[0]),
                                                          buttInsideOwnPanel=bool((32 <= butt_n[0] < 736) if key == 'cell2' else (800 <= butt_n[0] < 1504)),
                                                          tipInsideOwnPanel=bool((32 <= tip_n[0] < 736) if key == 'cell2' else (800 <= tip_n[0] < 1504)),
                                                          tipMarginToPanelRightPx=int((736 if key == 'cell2' else 1504)-1-tip_n[0])))),
        registration=dict(scale=S, dx=int(dx), dy=int(dy), canvas=[CW, CH], groundY=GROUND,
                          rule=f"ONE uniform scale+translate: scale={cfg['origBody']}/candidate crouched crown-sole (original {key} registered body), soles->756, bounds centred horizontally (phase-b gate convention)",
                          hash=reg_hash, file=f'{key}-registered.png'),
        registeredMeasure=clean(m0),
        retouch=(dict(rt, retouchedHash=fsha(D/f'{key}-retouched.png'), retouchedMeasure=clean(m1)) if rt else None),
        final=dict(file=final_name, sha256=final_hash, measure=clean(mf), inBand=bool(in_band), deviationU=dev),
        evidence=dict(marked=f'{key}-final-marked.png', cap4x=f'{key}-final-cap-4x.png', tip4x=f'{key}-final-tip-4x.png',
                      headZoom=f'{key}-final-head-zoom.png', solesZoom=f'{key}-final-soles-zoom.png',
                      gripsZoom=f'{key}-final-grips-zoom.png', gameplay=f'{key}-final-gameplay.png',
                      probeGrid=f"probe-{'left-cell2' if key=='cell2' else 'right-cell3'}-grid.png"),
    )

# ---- continuity cell1 -> shared cell2 -> shared cell3 -> selected cell4 (+cell0) ----
refs = {
 'cell0Original': dict(u=129.07, ang=-26.28, hash=SOURCES['originalCell0'][1], file=str(SOURCES['originalCell0'][0])),
 'cell1Original': dict(u=130.47, ang=162.02, hash=SOURCES['originalCell1'][1], file=str(SOURCES['originalCell1'][0])),
 'cell4SelectedWaived': dict(u=145.22, ang=-25.86, hash=SOURCES['fixCell4Selected'][1], file=str(SOURCES['fixCell4Selected'][0]),
                             note='Phase A selected under pre-authorized <=9u waiver, +7.72u FAIL retained NOT PASS'),
}
m2 = finals['cell2'][3]; m3 = finals['cell3'][3]
seq_us = [refs['cell0Original']['u'], refs['cell1Original']['u'], m2['u'], m3['u'], refs['cell4SelectedWaived']['u']]
seq_angs = [refs['cell0Original']['ang'], refs['cell1Original']['ang'], m2['angDeg'], m3['angDeg'], refs['cell4SelectedWaived']['ang']]
steps = [step(seq_angs[i], seq_angs[i+1]) for i in range(4)]
spread5 = r2((max(seq_us)-min(seq_us))/(sum(seq_us)/5)*100)
def thumb(img_rgba):
    bg = Image.new('RGBA', img_rgba.size, (32, 32, 32, 255)); bg.alpha_composite(img_rgba)
    return bg.resize((341, 256), Image.LANCZOS)
c0 = Image.open(SOURCES['originalCell0'][0]).convert('RGBA')
c1 = Image.open(SOURCES['originalCell1'][0]).convert('RGBA')
c4 = Image.open(SOURCES['fixCell4Selected'][0]).convert('RGBA')
contact = Image.new('RGBA', (341*5, 256+22), (32, 32, 32, 255))
for i, img_ in enumerate([c0, c1, Image.fromarray(finals['cell2'][0]), Image.fromarray(finals['cell3'][0]), c4]):
    contact.paste(thumb(img_), (341*i, 22))
dc = ImageDraw.Draw(contact)
labels = ['cell0 orig raise 129.07u PASS', 'cell1 orig overhead 130.47u PASS', f"cell2 SHARED {m2['u']}u", f"cell3 SHARED {m3['u']}u", 'cell4 fix recover 145.22u WAIVED']
for i, t_ in enumerate(labels): dc.text((341*i+6, 5), t_, fill=(255, 255, 0) if i in (2, 3) else (255, 255, 255))
contact.save(D/'continuity-cell0-cell1-shared2-shared3-cell4.png')
contact4 = Image.new('RGBA', (341*4, 256+22), (32, 32, 32, 255))
for i, img_ in enumerate([c1, Image.fromarray(finals['cell2'][0]), Image.fromarray(finals['cell3'][0]), c4]):
    contact4.paste(thumb(img_), (341*i, 22))
dc4 = ImageDraw.Draw(contact4)
for i, t_ in enumerate(labels[1:]): dc4.text((341*i+6, 5), t_, fill=(255, 255, 0) if i in (1, 2) else (255, 255, 255))
contact4.save(D/'continuity-cell1-shared2-shared3-cell4.png')

# ---- per-cell verdicts ----
for key in ('cell2', 'cell3'):
    R = results[key]; mf = finals[key][3]; m0u = R['registeredMeasure']['u']
    in_band = R['final']['inBand']; dev = R['final']['deviationU']; rt = R['retouch']
    waiver = bool(not in_band and dev <= 9.0)
    length_v = (f"PASS (registered {m0u}u; final {mf['u']}u in band [124.41,137.50]u" +
                (f" after deterministic shaft retouch butt {rt['buttRemovePx']}px + blade {rt['bladeRemovePx']}px, changedOutside {rt['outsideProof']['changedOutside']})" if rt else ", no retouch needed)")
                if in_band else
                (f"FAIL retained, WAIVER-CANDIDATE <=9u (registered {m0u}u; max retouch avail {rt['feasibility']['totalAvailPx'] if rt else 0}px; final {mf['u']}u, deviation {dev}u, fully measurable cap+tip) — selectable ONLY under the pre-authorized exact-hash small waiver if every other gate passes; FAIL NOT PASS" if waiver else
                 f"FAIL (registered {m0u}u; final {mf['u']}u, deviation {dev}u exceeds the <=9u waiver; FAIL retained, NOT selected)"))
    R['verdicts'] = dict(
        identity=VISUAL[key]['identity'], anatomy=VISUAL[key]['anatomy'], poseRole=VISUAL[key]['poseRole'],
        buttCapComplete=VISUAL[key]['buttCapDrawn'],
        wholeWeaponInFrame=f"PASS by raster (native margins buttLeft {R['native']['frameMarginsPx']['buttLeft']}px, tipRight {R['native']['frameMarginsPx']['tipRight']}px, top {R['native']['frameMarginsPx']['top']}px, bottom {R['native']['frameMarginsPx']['bottom']}px on the shared canvas; final canvas edge alpha {mf['edge']})" if max(mf['edge'].values()) == 0 else f"FAIL edge alpha {mf['edge']}",
        weaponLength=length_v,
        weaponDirection=f"axis {mf['angDeg']}deg vs prior-final target {CELLS[key]['targetAng']}deg (delta {r2(mf['angDeg']-CELLS[key]['targetAng'])}deg); family steps in continuity (all <=60 required)",
        weaponCorridor=VISUAL[key]['weaponCorridor'],
        bodyGround=f"registered groundErr {mf['groundErrU']}u (<=1.5u required), boots {[b['soleY'] for b in mf['boots']]}; RAW enlargement vs recorded panel {R['native']['vsPanelTarget']['enlargementVsPanelPct']}% recorded (candidate enlarged both figures on the two-panel canvas, as in the isolated gates; uniform registration restores the original crouched body {CELLS[key]['origBody']}px)",
        seams=f"raster greenPx {mf['greenPx']}, magentaPx {mf['magentaPx']}, edge {mf['edge']}" + (f"; retouch changedOutside {rt['outsideProof']['changedOutside']}, seam widths {rt['seam']}" if rt else '; no retouch') + f"; visual: {VISUAL[key]['seamsVisual']}",
        headEndpointRAW=VISUAL[key]['headEndpointRAW'],
        lengthPass=bool(in_band), waiverCandidate=waiver,
        overall=('PASS' if in_band else ('WAIVER_CANDIDATE' if waiver else 'FAIL')) + ('_PENDING_VISUAL' if not VISUAL_PASS else ''),
    )

sel2 = VISUAL_PASS and (results['cell2']['verdicts']['lengthPass'] or results['cell2']['verdicts']['waiverCandidate'])
sel3 = VISUAL_PASS and (results['cell3']['verdicts']['lengthPass'] or results['cell3']['verdicts']['waiverCandidate'])
heavy_bankable = bool(sel2 and sel3 and all(s <= 60 for s in steps))
accepted = None
if VISUAL_PASS:
    for key, sel in (('cell2', sel2), ('cell3', sel3)):
        sf = D/f'{key}-selected.png'
        if sel:
            Image.fromarray(finals[key][0]).save(sf)
            results[key]['verdicts'].update(selected=True, selectedFile=sf.name, selectedSha256=fsha(sf))
        else:
            if sf.exists(): sf.unlink()
            results[key]['verdicts'].update(selected=False, selectedFile=None)
    if heavy_bankable:
        adir = D/'accepted'; adir.mkdir(exist_ok=True)
        plan = [('cell0-raise.png', SOURCES['originalCell0'][0], 'original heavy sheet 37b72517', 129.07, 'PASS'),
                ('cell1-overhead-hold.png', SOURCES['originalCell1'][0], 'original heavy sheet 37b72517', 130.47, 'PASS'),
                ('cell2-crushing-chop.png', D/finals['cell2'][1], 'shared two-panel fix 2035a2d1 LEFT', m2['u'], 'PASS' if results['cell2']['verdicts']['lengthPass'] else 'FAIL-waived-<=9u'),
                ('cell3-follow-through.png', D/finals['cell3'][1], 'shared two-panel fix 2035a2d1 RIGHT', m3['u'], 'PASS' if results['cell3']['verdicts']['lengthPass'] else 'FAIL-waived-<=9u'),
                ('cell4-recover.png', SOURCES['fixCell4Selected'][0], 'focused-fix sheet 593ea8e4 (Phase A waiver-selected)', 145.22, 'FAIL NOT PASS waived exact hash only +7.72u')]
        accepted = []
        for name, srcp, srcdesc, uu_, status in plan:
            shutil.copyfile(srcp, adir/name)
            accepted.append(dict(file=f'accepted/{name}', sourceFile=str(srcp), source=srcdesc,
                                 sha256=fsha(adir/name), finalU=uu_, status=status, byteCopyVerified=fsha(adir/name) == fsha(srcp)))
report = dict(
    work='cmr15a-heavy-shared-fix-gates', zeroGeneration=True, visualPass=VISUAL_PASS,
    sourcesVerified=src_report, ledgerVerified=ledger_report, rawCandidateStreaks=raw_streaks,
    split=dict(componentsTotal=ncomp, keptTwo=two, otherComponents=[c for c in comps[2:]],
               method='recorded separation column [736,800) midpoint x=768 + largest alpha>=16 component per side (two-panel-ref.json geometry)'),
    cell2=results['cell2'], cell3=results['cell3'],
    continuity=dict(refs=refs, sequenceUCell0to4=seq_us, sequenceAngCell0to4=seq_angs,
                    axisStepsDeg=dict(cell0to1=steps[0], cell1to2=steps[1], cell2to3=steps[2], cell3to4=steps[3]),
                    allStepsLe60=bool(all(s <= 60 for s in steps)), spreadPctCell0to4=spread5,
                    spreadNote='spread reported; waived only as resulting spread of the exact selected set if banked under the recorded waivers',
                    contact5='continuity-cell0-cell1-shared2-shared3-cell4.png',
                    contact4='continuity-cell1-shared2-shared3-cell4.png',
                    visual=VISUAL['continuityVisual']),
    selection=dict(
        method='best passing source per role across original sheet 37b72517 / focused-fix 593ea8e4 / isolated Phase B candidates / shared two-panel fix 2035a2d1',
        cell0=dict(selected='original', hash=SOURCES['originalCell0'][1], u=129.07, status='PASS'),
        cell1=dict(selected='original', hash=SOURCES['originalCell1'][1], u=130.47, status='PASS'),
        cell2=dict(sources=dict(originalStub=dict(u=92.10, hash=SOURCES['originalCell2Stub'][1], status='FAIL cap not drawn, no waiver'),
                                focusedFix=dict(u=163.30, hash=SOURCES['fixCell2'][1], status='FAIL +25.80u'),
                                isolated=dict(u=161.23, hash=SOURCES['isolatedCell2Final'][1], status='FAIL +23.73u'),
                                sharedFix=dict(u=m2['u'], hash=finals['cell2'][2], status=results['cell2']['verdicts']['overall'])),
                   selected=('sharedFix' if sel2 else None)),
        cell3=dict(sources=dict(originalStub=dict(u=86.68, hash=SOURCES['originalCell3Stub'][1], status='FAIL cap not drawn, no waiver'),
                                focusedFixStub=dict(u=97.74, hash=SOURCES['fixCell3Stub'][1], status='FAIL cap not drawn, no waiver'),
                                isolated=dict(u=157.70, hash=SOURCES['isolatedCell3Final'][1], status='FAIL +20.20u'),
                                sharedFix=dict(u=m3['u'], hash=finals['cell3'][2], status=results['cell3']['verdicts']['overall'])),
                   selected=('sharedFix' if sel3 else None)),
        cell4=dict(selected='focusedFix under recorded waiver (Phase A)', hash=SOURCES['fixCell4Selected'][1], u=145.22,
                   status='FAIL NOT PASS waived exact hash only +7.72u (fully measurable, every other gate PASS)'),
    ),
    heavyBanked=bool(heavy_bankable and VISUAL_PASS), accepted=accepted,
    postFixAccounting=('PENDING_VISUAL' if not VISUAL_PASS else
        ('heavy BANKED as a coherent selected 5 (cells0/1 PASS originals, shared cells2/3 PASS/waived, cell4 waived exact hash) => banked family resets the prospective post-salvage count to 0 under the COMPLETION CAMPAIGN grant' if heavy_bankable else
         'heavy incomplete after the shared fix (salvage + isolated candidates + ONE shared fix exhausted) => heavy = prospective post-fix unusable #1 under the COMPLETION CAMPAIGN count (from 0); STOP at 2 not reached; CMR-15A IN_PROGRESS')),
    generation='zero in this package (no image call, ledger unchanged)',
)
(D/'gate.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print(json.dumps(dict(cell2=dict(regU=results['cell2']['registeredMeasure']['u'], finalU=m2['u'], final=finals['cell2'][1], hash=finals['cell2'][2][:8],
                                 retouch=(results['cell2']['retouch'] or {}).get('feasibility')),
                      cell3=dict(regU=results['cell3']['registeredMeasure']['u'], finalU=m3['u'], final=finals['cell3'][1], hash=finals['cell3'][2][:8],
                                 retouch=(results['cell3']['retouch'] or {}).get('feasibility')),
                      steps=steps, spread5=spread5, bankableLen=bool((results['cell2']['verdicts']['lengthPass'] or results['cell2']['verdicts']['waiverCandidate']) and (results['cell3']['verdicts']['lengthPass'] or results['cell3']['verdicts']['waiverCandidate']))), indent=1))
