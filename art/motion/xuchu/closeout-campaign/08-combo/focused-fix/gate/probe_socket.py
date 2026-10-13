from PIL import Image
src = Image.open('art/motion/xuchu/closeout-campaign/08-combo/focused-fix/candidate-raw.png').convert('RGBA')
bg = Image.new('RGBA', src.size, (48, 44, 40, 255)); bg.alpha_composite(src)
# front-grip -> socket -> blade-base regions (sheet coords) for OUT_HIGH cells 1,3,4,5
boxes = {'cell1': (780, 80, 920, 200), 'cell3': (380, 450, 500, 560), 'cell4': (800, 430, 930, 540), 'cell5': (1280, 430, 1420, 540)}
for name, box in boxes.items():
    c = bg.crop(box); c = c.resize((c.width * 3, c.height * 3), Image.NEAREST)
    c.save(f'art/motion/xuchu/closeout-campaign/08-combo/focused-fix/gate/cells-native/{name}-socketzoom.png')
    print(name, box)
