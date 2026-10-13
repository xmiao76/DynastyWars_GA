# Probe (resume2): distal shaft width profile for cell6 spare-low-sweep on the CORRECTED
# registered axis. build.mjs reported bladeAvail=0 because socketTReg (439) < frontGripEndT
# (481): the hand-picked native socketPt [395,895] lies INSIDE the frontGrip box
# [360,865,420,915], so the [frontGripEnd, socketT] search interval is empty by construction.
# Print perp alpha width/runs per t from t=340 to the blade, and save a 3x zoom of the
# front-grip -> collar -> blade region so the true socket location can be verified visually.
import json, math
import numpy as np
from PIL import Image
G = 'art/motion/xuchu/closeout-campaign/08-combo/focused-fix/gate/'
m = json.load(open(G + 'measure.json', encoding='utf-8'))
S = m['sheetScale']
r = [c for c in m['all'] if c['cell'] == 6][0]
im = Image.open(G + 'cells-registered/cell6-spare-low-sweep-registered.png').convert('RGBA')
a = np.array(im)[:, :, 3] >= 16
rm = r['registeredMeasure']; butt = rm['butt']; tip = rm['tip']
L = math.hypot(tip[0]-butt[0], tip[1]-butt[1]); ux, uy = (tip[0]-butt[0])/L, (tip[1]-butt[1])/L
vx, vy = -uy, ux
print(f"L={L:.1f} butt={butt} tip={tip}")
print(f"rearGripTReg={[round(v*S,1) for v in r['nativeLandmarks']['rearGripTNative']]} frontGripTReg={[round(v*S,1) for v in r['nativeLandmarks']['frontGripTNative']]} socketTReg={r['retouch']['feasibility']['socketTReg']}")
for t in range(340, 561, 4):
    on = []
    for p in range(-56, 57):
        x = round(butt[0]+ux*t+vx*p); y = round(butt[1]+uy*t+vy*p)
        on.append(bool(0 <= x < a.shape[1] and 0 <= y < a.shape[0] and a[y, x]))
    idx = [i for i, v in enumerate(on) if v]
    if not idx:
        print(t, 'none'); continue
    w = idx[-1]-idx[0]+1
    runs = 1 + sum(1 for i in range(idx[0]+1, idx[-1]+1) if on[i] and not on[i-1])
    lo, hi = idx[0]-56, idx[-1]-56
    print(f"t={t} w={w} runs={runs} perp=[{lo},{hi}] clean={w<=30 and runs==1}")
bg = Image.new('RGBA', im.size, (48, 44, 40, 255)); bg.alpha_composite(im)
# axis point at t=430 registered coords -> crop around front grip/collar/blade base
cx, cy = butt[0]+ux*430, butt[1]+uy*430
box = (int(cx-150), int(cy-110), int(cx+170), int(cy+110))
c = bg.crop(box); c = c.resize((c.width*3, c.height*3), Image.NEAREST)
c.save(G + 'cells-native/cell6-distalzoom.png')
print('zoom box', box, 'saved cells-native/cell6-distalzoom.png')
