# Probe: perp alpha extent along the DISTAL shaft (front grip -> blade) for focused-fix
# registered cells. Mirrors build.mjs shaftOnly (perp +-56, clean = single run width<=30).
# Checks whether bladeAvail=0 on OUT_HIGH cells is a socket/grip box artifact or genuine:
# prints grip/socket T (registered px), every clean run at t>=frontGripEnd, and widths.
import json, math
import numpy as np
from PIL import Image
G = 'art/motion/xuchu/closeout-campaign/08-combo/focused-fix/gate/'
m = json.load(open(G + 'measure.json', encoding='utf-8'))
S = m['sheetScale']
for r in m['all']:
    im = np.array(Image.open(G + 'cells-registered/' + r['name'] + '-registered.png'))
    a = im[:, :, 3] >= 16
    rm = r['registeredMeasure']; butt = rm['butt']; tip = rm['tip']
    L = math.hypot(tip[0]-butt[0], tip[1]-butt[1]); ux, uy = (tip[0]-butt[0])/L, (tip[1]-butt[1])/L
    vx, vy = -uy, ux
    fg = r['nativeLandmarks']['frontGripTNative'][1] * S
    # socketT as used by build.mjs retouch feasibility
    sock = r['retouch']['feasibility']['socketTReg'] if r['retouch'] else None
    clean = []
    t = int(fg)
    while t < L:
        on = []
        for p in range(-56, 57):
            x = round(butt[0]+ux*t+vx*p); y = round(butt[1]+uy*t+vy*p)
            on.append(bool(0 <= x < a.shape[1] and 0 <= y < a.shape[0] and a[y, x]))
        idx = [i for i, v in enumerate(on) if v]
        if idx:
            w = idx[-1]-idx[0]+1
            runs = 1 + sum(1 for i in range(idx[0]+1, idx[-1]+1) if on[i] and not on[i-1])
            if w <= 30 and runs == 1:
                clean.append(t)
        t += 2
    # contiguous runs (step 2)
    runs = []
    start = prev = None
    for t in clean:
        if prev is None or t != prev + 2:
            if start is not None: runs.append((start, prev))
            start = t
        prev = t
    if start is not None: runs.append((start, prev))
    print(f"{r['name']}: L={L:.0f} frontGripEndT={fg:.0f} socketTReg={sock} cleanRunsAfterFrontGrip={runs}")
