from PIL import Image, ImageDraw
import os
src = Image.open('art/motion/xuchu/closeout-campaign/07-charge/focused-fix/candidate-raw.png').convert('RGBA')
outdir = 'art/motion/xuchu/closeout-campaign/07-charge/focused-fix/gate/cells-native'
caps = {0: (90, 220), 1: (620, 250), 2: (1115, 222), 3: (170, 517), 4: (665, 557)}
tips = {0: (440, 85), 1: (930, 165), 2: (1430, 130), 3: (480, 460), 4: (920, 425)}
names = ['cell0-guard', 'cell1-crouch-coil-windup', 'cell2-launch', 'cell3-crushing-dash', 'cell4-brake']
for kind, pts in [('cap', caps), ('tip', tips)]:
    for i, (cx, cy) in pts.items():
        box = (cx - 55, cy - 55, cx + 55, cy + 55)
        crop = src.crop(box)
        bg = Image.new('RGBA', crop.size, (48, 44, 40, 255))
        bg.alpha_composite(crop)
        d = ImageDraw.Draw(bg)
        for gx in range(0, 110, 10):
            d.line([(gx, 0), (gx, 110)], fill=(90, 90, 90, 255))
            d.text((gx + 1, 1), str(box[0] + gx), fill=(255, 255, 0, 255))
        for gy in range(0, 110, 10):
            d.line([(0, gy), (110, gy)], fill=(90, 90, 90, 255))
            d.text((1, gy + 1), str(box[1] + gy), fill=(0, 255, 255, 255))
        bg = bg.resize((440, 440), Image.NEAREST)
        bg.save(f'{outdir}/{names[i]}-{kind}zoom.png')
        print(names[i], kind, box)
