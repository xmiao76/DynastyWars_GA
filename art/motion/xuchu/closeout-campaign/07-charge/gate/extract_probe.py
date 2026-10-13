from PIL import Image, ImageDraw
import numpy as np, os
from scipy import ndimage
src = Image.open('art/motion/xuchu/closeout-campaign/07-charge/candidate-raw.png').convert('RGBA')
im = np.array(src)
a = im[:, :, 3] >= 16
lab, n = ndimage.label(a, structure=np.ones((3, 3)))
objs = ndimage.find_objects(lab)
comps = []
for i, s in enumerate(objs, 1):
    ys, xs = np.nonzero(lab[s] == i)
    comps.append({'id': i, 's': s, 'cx': xs.mean() + s[1].start, 'cy': ys.mean() + s[0].start})
# row-major by centroid grid (cols at 512, rows at 341.33)
comps.sort(key=lambda c: (int(c['cy'] // 341.34), int(c['cx'] // 512)))
outdir = 'art/motion/xuchu/closeout-campaign/07-charge/gate/cells-native'
os.makedirs(outdir, exist_ok=True)
names = ['cell0-guard', 'cell1-crouch-coil-windup', 'cell2-launch', 'cell3-crushing-dash', 'cell4-brake',
         'cell5-spare-dash-alt', 'cell6-spare-brake-alt', 'cell7-spare-brake-alt2', 'cell8-spare-guard-alt']
for idx, c in enumerate(comps):
    s = c['s']
    crop = im[s].copy()
    crop[lab[s] != c['id']] = 0
    # on neutral dark bg for viewing
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
