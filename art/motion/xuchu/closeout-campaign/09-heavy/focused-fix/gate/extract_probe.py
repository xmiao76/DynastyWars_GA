from PIL import Image, ImageDraw
import numpy as np, os
from scipy import ndimage
src = Image.open('art/motion/xuchu/closeout-campaign/09-heavy/focused-fix/candidate-raw.png').convert('RGBA')
im = np.array(src)
a = im[:, :, 3] >= 16
lab, n = ndimage.label(a, structure=np.ones((3, 3)))
objs = ndimage.find_objects(lab)
comps = []
for i, s in enumerate(objs, 1):
    ys, xs = np.nonzero(lab[s] == i)
    if len(xs) <= 5000:
        continue
    comps.append({'id': i, 's': s, 'cx': xs.mean() + s[1].start, 'cy': ys.mean() + s[0].start})
comps.sort(key=lambda c: (int(c['cy'] // 341.34), int(c['cx'] // 512)))
outdir = 'art/motion/xuchu/closeout-campaign/09-heavy/focused-fix/gate/cells-native'
os.makedirs(outdir, exist_ok=True)
names = ['cell0-raise', 'cell1-overhead-hold', 'cell2-crushing-chop', 'cell3-follow-through', 'cell4-recover',
         'cell5-spare-overhead-a', 'cell6-spare-overhead-b', 'cell7-spare-chop-a', 'cell8-spare-chop-b']
print('sorted comps', len(comps))
for idx, c in enumerate(comps):
    s = c['s']
    crop = im[s].copy()
    crop[lab[s] != c['id']] = 0
    bg = Image.new('RGBA', (crop.shape[1], crop.shape[0]), (48, 44, 40, 255))
    fg = Image.fromarray(crop)
    bg.alpha_composite(fg)
    d = ImageDraw.Draw(bg)
    for gx in range(0, crop.shape[1], 50):
        d.line([(gx, 0), (gx, crop.shape[0])], fill=(90, 90, 90, 255))
        d.text((gx + 2, 2), str(gx + s[1].start), fill=(255, 255, 0, 255))
    for gy in range(0, crop.shape[0], 50):
        d.line([(0, gy), (crop.shape[1], gy)], fill=(90, 90, 90, 255))
        d.text((2, gy + 2), str(gy + s[0].start), fill=(0, 255, 255, 255))
    bg = bg.resize((bg.width * 2, bg.height * 2), Image.NEAREST)
    bg.save(f'{outdir}/{names[idx]}-grid.png')
    Image.fromarray(crop).save(f'{outdir}/{names[idx]}.png')
    print(idx, names[idx], 'comp', c['id'], 'bounds x', s[1].start, s[1].stop - 1, 'y', s[0].start, s[0].stop - 1)
