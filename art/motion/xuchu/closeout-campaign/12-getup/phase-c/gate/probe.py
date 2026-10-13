import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
import os, json
BASE="art/motion/xuchu/closeout-campaign/12-getup/"
for tag,path in [("orig",BASE+"candidate-raw.png"),("fix",BASE+"focused-fix/candidate-raw.png"),("phasec",BASE+"phase-c/candidate-raw.png")]:
    im=np.array(Image.open(path)); a=im[:,:,3]>=16; H,W=a.shape
    lab,n=ndimage.label(a,structure=np.ones((3,3))); objs=ndimage.find_objects(lab); comps=[]
    for i,s in enumerate(objs):
        cnt=int((lab[s]==i+1).sum())
        if cnt>5000:
            ys,xs=np.where(lab[s]==i+1)
            comps.append(dict(n=cnt,xmin=int(s[1].start),ymin=int(s[0].start),xmax=int(s[1].stop-1),ymax=int(s[0].stop-1),cx=float(xs.mean()+s[1].start),cy=float(ys.mean()+s[0].start),id=i+1))
    comps.sort(key=lambda c:(int(c["cy"]//(H/3)),c["cx"]))
    print(tag,len(comps))
    for i,c in enumerate(comps): print(i,c)
    if tag=="phasec":
        img=Image.open(path).convert("RGBA")
        names=['cell0-down','cell1-elbow','cell2-kneel','cell3-crouch','cell4-rise','cell5-spare-getup-a','cell6-spare-getup-b','cell7-spare-getup-c','cell8-spare-getup-d']
        out=BASE+"phase-c/gate/cells-native/"
        for i,c in enumerate(comps):
            pad=30; x0=max(0,c["xmin"]-pad); y0=max(0,c["ymin"]-pad); x1=min(W,c["xmax"]+pad+1); y1=min(H,c["ymax"]+pad+1)
            crop=img.crop((x0,y0,x1,y1))
            bg=Image.new("RGBA",crop.size,(40,40,46,255)); bg.alpha_composite(crop)
            bg.save(out+names[i]+".png")
            # grid version: lines every 50 sheet px, labels via ticks
            g=bg.copy(); d=ImageDraw.Draw(g)
            for gx in range((x0//50)*50,x1,50):
                d.line([(gx-x0,0),(gx-x0,g.height)],fill=(255,255,0,160),width=1); d.text((gx-x0+2,2),str(gx),fill=(255,255,0))
            for gy in range((y0//50)*50,y1,50):
                d.line([(0,gy-y0),(g.width,gy-y0)],fill=(0,255,255,160),width=1); d.text((2,gy-y0+2),str(gy),fill=(0,255,255))
            g.save(out+names[i]+"-grid.png")
        json.dump(comps,open(BASE+"phase-c/gate/probe-comps.json","w"),indent=1)
