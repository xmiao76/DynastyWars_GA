# Probe: perp alpha extent along butt->tip axis for combo registered keeps/spares.
# Mirrors build.mjs extentAt (perp +-56, alpha>=16, clean = single run width<=30).
# Used to check whether buttAvail=0 is a scan artifact (pommel ball wider than the
# fixed capEnd=16 at combo scale 1.4903) or a genuine absence of clean shaft.
import json, math
import numpy as np
from PIL import Image
G = 'art/motion/xuchu/closeout-campaign/08-combo/gate/'
m = json.load(open(G + 'measure.json', encoding='utf-8'))
for r in m['all']:
    if not r['buttCapVisible']:
        print(r['name'], 'butt not visible - skipped'); continue
    im = np.array(Image.open(G + 'cells-registered/' + r['name'] + '-registered.png'))
    a = im[:, :, 3] >= 16
    rm = r['registeredMeasure']; butt = rm['butt']; tip = rm['tip']
    L = math.hypot(tip[0]-butt[0], tip[1]-butt[1]); ux, uy = (tip[0]-butt[0])/L, (tip[1]-butt[1])/L
    vx, vy = -uy, ux
    rear = r['nativeLandmarks']['rearGripTNative'][0] * m['sheetScale']
    rows = []
    t = 4
    while t < rear:
        on = []
        for p in range(-56, 57):
            x = round(butt[0]+ux*t+vx*p); y = round(butt[1]+uy*t+vy*p)
            on.append(bool(0 <= x < a.shape[1] and 0 <= y < a.shape[0] and a[y, x]))
        idx = [i for i, v in enumerate(on) if v]
        if not idx:
            rows.append((t, None, None))
        else:
            gaps = sum(1 for i in range(1, len(on)) if on[i] and not on[i-1]) - (1 if on[0] else 0)
            # gaps as in build.mjs: increments when a new run starts after the first pixel
            w = idx[-1]-idx[0]+1
            runs = 1 + sum(1 for i in range(idx[0]+1, idx[-1]+1) if on[i] and not on[i-1])
            rows.append((t, w, runs-1))
        t += 4
    clean = [t for t, w, g in rows if w is not None and w <= 30 and g == 0]
    first = clean[0] if clean else None
    # longest contiguous clean run (step 4)
    best = cur = 0
    prev = None
    for t in clean:
        cur = cur+4 if prev is not None and t == prev+4 else 4
        best = max(best, cur); prev = t
    print(f"{r['name']}: rearGripT={rear:.0f} firstCleanT={first} longestCleanRunPx~{best} widths@4..60:{[(t,w) for t,w,g in rows if t<=60]}")
