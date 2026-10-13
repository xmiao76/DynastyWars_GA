from PIL import Image, ImageDraw
src = Image.open('art/motion/xuchu/closeout-campaign/11-fall/candidate-raw.png').convert('RGBA')
regions = {
 'cell4-capgrid10': (630, 675, 705, 720),
 'cell7-capgrid10': (640, 940, 705, 995),
 'cell8-capgrid10': (1225, 955, 1290, 995),
}
out = 'art/motion/xuchu/closeout-campaign/11-fall/gate/cells-native/'
for name,(x0,y0,x1,y1) in regions.items():
    crop = src.crop((x0,y0,x1,y1))
    bg = Image.new('RGBA', crop.size, (48,44,40,255)); bg.alpha_composite(crop)
    bg = bg.resize((bg.width*8, bg.height*8), Image.NEAREST)
    d = ImageDraw.Draw(bg)
    for gx in range(x0, x1, 10):
        X=(gx-x0)*8; d.line([(X,0),(X,bg.height)], fill=(255,0,255,255)); d.text((X+2,2), str(gx), fill=(255,255,0,255))
    for gy in range(y0, y1, 10):
        Y=(gy-y0)*8; d.line([(0,Y),(bg.width,Y)], fill=(255,0,255,255)); d.text((2,Y+2), str(gy), fill=(0,255,255,255))
    bg.save(out+name+'.png'); print(name, bg.size)
