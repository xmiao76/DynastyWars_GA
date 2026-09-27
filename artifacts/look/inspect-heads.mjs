import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
for (const kind of ['guanyu','zhaoyun']) {
 for (const part of ['portrait','heads']) {
  const im=PNG.sync.read(readFileSync(`art/hero-faces/${kind}-${part}-master.png`));
  const seen=new Uint8Array(im.width*im.height); const comps=[];
  for(let k=0;k<seen.length;k++) {if(seen[k] || im.data[k*4+3]<32)continue;
   let q=[k], n=0,x0=im.width,x1=0,y0=im.height,y1=0;seen[k]=1;
   for(let h=0;h<q.length;h++){let t=q[h], x=t%im.width,y=Math.floor(t/im.width);n++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
    for(const s of [x>0?t-1:-1,x<im.width-1?t+1:-1,y>0?t-im.width:-1,y<im.height-1?t+im.width:-1]){if(s>=0&&!seen[s]&&im.data[s*4+3]>=32){seen[s]=1;q.push(s)}}
   }comps.push({n,x0,y0,x1,y1});
  }
  console.log(kind,part,im.width,im.height,'alpha',im.data[3], 'components', comps.sort((a,b)=>b.n-a.n).slice(0,6));
 }
}
