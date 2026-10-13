from PIL import Image, ImageDraw
import json
B="art/motion/xuchu/closeout-campaign/12-getup/phase-c/"
img=Image.open(B+"candidate-raw.png").convert("RGBA")
m=json.load(open(B+"gate/measure.json"))
for r in m["all"]:
    bx,by=r["nativeLandmarks"]["butt"]
    x0=int(bx-70); y0=int(by-45); x1=int(bx+70); y1=int(by+45)
    crop=img.crop((x0,y0,x1,y1)); bg=Image.new("RGBA",crop.size,(40,40,46,255)); bg.alpha_composite(crop)
    bg=bg.resize((bg.width*4,bg.height*4),Image.NEAREST)
    d=ImageDraw.Draw(bg)
    for gx in range(x0,x1,10):
        X=(gx-x0)*4; d.line([(X,0),(X,bg.height)],fill=(255,255,0),width=1)
        if gx%20==0: d.text((X+2,2),str(gx),fill=(255,255,0))
    for gy in range(y0,y1,10):
        Y=(gy-y0)*4; d.line([(0,Y),(bg.width,Y)],fill=(0,255,255),width=1)
        if gy%20==0: d.text((2,Y+2),str(gy),fill=(0,255,255))
    # current butt cross
    X=int((bx-x0)*4); Y=int((by-y0)*4); d.line([(X-12,Y),(X+12,Y)],fill=(255,0,0),width=3); d.line([(X,Y-12),(X,Y+12)],fill=(255,0,0),width=3)
    bg.save(B+f"gate/cells-native/{r['name']}-butt-grid10.png")
print("ok")
