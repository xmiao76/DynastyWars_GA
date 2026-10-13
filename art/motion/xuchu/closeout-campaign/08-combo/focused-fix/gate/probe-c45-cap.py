# Probe (resume2): locate the TRUE pommel-ball rim for cells 4/5 in sheet coords.
# Eyeball estimates from cell4/5-buttzoom.png (registered coords): c4 rim ~(325,316),
# ball centre ~(343,314); c5 rim ~(370,297), centre ~(387,296). Inverse-transform to
# sheet coords ((reg-d)/S), print current BOX.butt, and save 3x sheet crops centred on
# the predicted ball with a cross at the predicted rim for visual confirmation.
import json
from PIL import Image, ImageDraw
G = 'art/motion/xuchu/closeout-campaign/08-combo/focused-fix/gate/'
D = 'art/motion/xuchu/closeout-campaign/08-combo/focused-fix/'
m = json.load(open(G + 'measure.json', encoding='utf-8'))
S = m['sheetScale']
sheet = Image.open(D + 'candidate-raw.png').convert('RGBA')
bg = Image.new('RGBA', sheet.size, (48, 44, 40, 255)); bg.alpha_composite(sheet)
EST = {4: {'rimReg': (325, 316), 'cenReg': (343, 314)}, 5: {'rimReg': (370, 297), 'cenReg': (387, 296)}}
for cell, est in EST.items():
    c = [x for x in m['all'] if x['cell'] == cell][0]
    dx, dy = c['registration']['dx'], c['registration']['dy']
    toSheet = lambda p: ((p[0]-dx)/S, (p[1]-dy)/S)
    rimS, cenS = toSheet(est['rimReg']), toSheet(est['cenReg'])
    print(f"cell{cell}: dx={dx} dy={dy} rimSheet=({rimS[0]:.1f},{rimS[1]:.1f}) cenSheet=({cenS[0]:.1f},{cenS[1]:.1f}) nativeButtNow={c['nativeLandmarks']['butt']}")
    crop = bg.crop((int(cenS[0]-55), int(cenS[1]-45), int(cenS[0]+55), int(cenS[1]+45)))
    crop = crop.resize((crop.width*4, crop.height*4), Image.NEAREST)
    d = ImageDraw.Draw(crop)
    rx, ry = (rimS[0]-(cenS[0]-55))*4, (rimS[1]-(cenS[1]-45))*4
    d.line([rx-14, ry, rx+14, ry], fill=(255, 0, 0, 255), width=3); d.line([rx, ry-14, rx, ry+14], fill=(255, 0, 0, 255), width=3)
    cx, cy = 55*4, 45*4
    d.line([cx-10, cy, cx+10, cy], fill=(255, 255, 0, 255), width=2); d.line([cx, cy-10, cx, cy+10], fill=(255, 255, 0, 255), width=2)
    crop.save(G + f"cells-native/cell{cell}-cap-sheetzoom.png")
    print('  saved', f"cells-native/cell{cell}-cap-sheetzoom.png", 'cropSheetOrigin', (int(cenS[0]-55), int(cenS[1]-45)))
