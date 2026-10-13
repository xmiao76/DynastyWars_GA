from PIL import Image
import numpy as np
from scipy import ndimage
im = np.array(Image.open('art/motion/xuchu/closeout-campaign/07-charge/focused-fix/candidate-raw.png'))
a = im[:, :, 3] >= 16
lab, n = ndimage.label(a, structure=np.ones((3, 3)))
print('components total', n)
objs = ndimage.find_objects(lab)
comps = []
for i, s in enumerate(objs, 1):
    if s is None:
        continue
    cnt = int((lab[s] == i).sum())
    if cnt > 500:
        comps.append((i, cnt, s))
print('big comps', len(comps))
for i, cnt, s in comps:
    ys, xs = np.nonzero(lab[s] == i)
    xs = xs + s[1].start; ys = ys + s[0].start
    li = xs.argmin(); ri = xs.argmax()
    print(f"id{i} px={cnt} x[{xs.min()},{xs.max()}] y[{ys.min()},{ys.max()}] w={xs.max()-xs.min()+1} h={ys.max()-ys.min()+1} leftmost=({xs[li]},{ys[li]}) rightmost=({xs[ri]},{ys[ri]}) spanDist={np.hypot(xs[ri]-xs[li], ys[ri]-ys[li]):.1f}")
small = [(i, int((lab[s] == i).sum())) for i, s in enumerate(objs, 1) if s is not None and 0 < int((lab[s] == i).sum()) <= 500]
print('small comps (<=500px):', small)
