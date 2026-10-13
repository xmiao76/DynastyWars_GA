# Probe (resume2): 4x zooms around the butt-cap region for cells 4/5 with the native-BOX
# hint (yellow cross) and the current measureReg butt (red cross) both marked, to verify
# whether the measured butt sits on the cap rim or on skirt pixels near the axis extension.
import json
from PIL import Image, ImageDraw
G = 'art/motion/xuchu/closeout-campaign/08-combo/focused-fix/gate/'
m = json.load(open(G + 'measure.json', encoding='utf-8'))
S = m['sheetScale']
for cell in (4, 5, 1, 3):
    c = [x for x in m['all'] if x['cell'] == cell][0]
    im = Image.open(G + 'cells-registered/' + c['name'] + '-registered.png').convert('RGBA')
    bg = Image.new('RGBA', im.size, (48, 44, 40, 255)); bg.alpha_composite(im)
    d = ImageDraw.Draw(bg)
    hint = [c['nativeLandmarks']['butt'][0]*S + c['registration']['dx'], c['nativeLandmarks']['butt'][1]*S + c['registration']['dy']]
    butt = c['registeredMeasure']['butt']
    for (x, y), col in ((hint, (255, 255, 0, 255)), (butt, (255, 0, 0, 255))):
        d.line([x-9, y, x+9, y], fill=col, width=2); d.line([x, y-9, x, y+9], fill=col, width=2)
    cx, cy = hint
    box = (int(cx-70), int(cy-70), int(cx+70), int(cy+70))
    crop = bg.crop(box); crop = crop.resize((crop.width*4, crop.height*4), Image.NEAREST)
    out = G + f"cells-native/cell{cell}-buttzoom.png"
    crop.save(out)
    print(cell, c['name'], 'hint', [round(v,1) for v in hint], 'butt', butt, 'box', box)
