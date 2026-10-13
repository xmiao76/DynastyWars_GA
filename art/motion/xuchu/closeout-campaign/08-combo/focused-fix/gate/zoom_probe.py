from PIL import Image
src = Image.open('art/motion/xuchu/closeout-campaign/08-combo/focused-fix/candidate-raw.png').convert('RGBA')
bg = Image.new('RGBA', src.size, (48, 44, 40, 255)); bg.alpha_composite(src)
# cell2 butt cap region and blade tip region, sheet coords
for name, box in [('cell2-capzoom', (1075, 130, 1185, 200)), ('cell2-tipzoom', (1345, 25, 1465, 130))]:
    c = bg.crop(box); c = c.resize((c.width * 4, c.height * 4), Image.NEAREST)
    c.save(f'art/motion/xuchu/closeout-campaign/08-combo/focused-fix/gate/cells-native/{name}.png')
    print(name, box)
