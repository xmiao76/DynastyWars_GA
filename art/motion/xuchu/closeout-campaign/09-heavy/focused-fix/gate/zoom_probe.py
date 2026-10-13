from PIL import Image
import os
src = Image.open('art/motion/xuchu/closeout-campaign/09-heavy/focused-fix/candidate-raw.png').convert('RGBA')
outdir = 'art/motion/xuchu/closeout-campaign/09-heavy/focused-fix/gate/cells-native'
# (name, cx, cy, half) sheet coords, from the *-grid.png views
zooms = [
    ('cell0-buttzoom', 95, 147, 45),
    ('cell1-buttzoom', 820, 25, 50),
    ('cell2-buttzoom', 1095, 218, 55),
    ('cell2-gripzoom', 1350, 245, 55),
    ('cell3-gripzoom', 380, 580, 60),
    ('cell4-buttzoom', 635, 578, 45),
    ('cell5-buttzoom', 1465, 462, 45),
    ('cell6-buttzoom', 265, 790, 55),
    ('cell7-gripzoom', 885, 875, 55),
    ('cell8-gripzoom', 1330, 875, 55),
    ('cell2-tipzoom', 1505, 300, 45),
    ('cell5-tipzoom', 1170, 390, 45),
    ('cell6-tipzoom', 115, 700, 45),
]
for name, cx, cy, h in zooms:
    box = (max(0, cx - h), max(0, cy - h), min(src.width, cx + h), min(src.height, cy + h))
    crop = src.crop(box)
    bg = Image.new('RGBA', crop.size, (48, 44, 40, 255))
    bg.alpha_composite(crop)
    bg = bg.resize((bg.width * 4, bg.height * 4), Image.NEAREST)
    bg.save(f'{outdir}/{name}.png')
    print(name, box)
