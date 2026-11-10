"""Five actual destinations on a continuous, matte graphite camera rail.

2560×1440/60 master, true 30-pose/s portrait. Frames stream directly to FFmpeg.
The paper fronts are full-bleed; no bright trim and no invented browser chrome.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from math import sin, cos, pi, exp, log, floor, ceil, dist
import argparse, hashlib, json, subprocess, sys, time
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs/campaign-web-revision-20261110/web'
CAPTURES=OUT/'captures'
PUBLIC=ROOT/'public'
sys.path.insert(0,str(ROOT/'scripts/director-shift'))
from plates import surface,projection,coefficients
from render import backdrop
SCENES=['shift','vela','nude','basilico','oltre']
SIZE={'desktop':(2560,1440),'mobile':(720,900),'proof':(1280,720)}

def clamp(t):return min(1.,max(0.,t))
def ease(t):
 t=clamp(t);return t*t*t*(10+t*(6*t-15))
def mix(a,b,t):return a+(b-a)*t
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def extended_texture(texture,pad=4):
 """Replicate each edge, rather than using one corner colour around the sheet.
 The inverse homography still lands exactly on the original unpadded image.
 """
 w,h=texture.size;result=Image.new('RGB',(w+2*pad,h+2*pad));result.paste(texture,(pad,pad))
 result.paste(texture.crop((0,0,w,1)).resize((w,pad)),(pad,0))
 result.paste(texture.crop((0,h-1,w,h)).resize((w,pad)),(pad,h+pad))
 result.paste(texture.crop((0,0,1,h)).resize((pad,h)),(0,pad))
 result.paste(texture.crop((w-1,0,w,h)).resize((pad,h)),(w+pad,pad))
 for x,y,sx,sy in [(0,0,0,0),(w+pad,0,w-1,0),(0,h+pad,0,h-1),(w+pad,h+pad,w-1,h-1)]:
  result.paste(texture.getpixel((sx,sy)),(x,y,x+pad,y+pad))
 return result

class Front:
 def __init__(self,texture):self.original=texture;self.levels={}
 def at(self,reduction):
  if reduction not in self.levels:
   tex=self.original.reduce(reduction) if reduction>=2 else self.original
   self.levels[reduction]=(extended_texture(tex),tex.size)
  return self.levels[reduction]

def draw_sheet(image,project,plane,front):
 corners,rear=plane;q=[project(p) for p in corners];r=[project(p) for p in rear]
 pen=ImageDraw.Draw(image);pen.polygon(r,fill=(11,15,14))
 # The physical edge has the same dark material on all sides. Bright top-left
 # screenshot pixels never become the material of the right/bottom hull.
 for j in range(4):k=(j+1)%4;pen.polygon((r[j],r[k],q[k],q[j]),fill=(25,30,27))
 x0=max(0,floor(min(p[0] for p in q))-2);x1=min(image.width,ceil(max(p[0] for p in q))+2)
 y0=max(0,floor(min(p[1] for p in q))-2);y1=min(image.height,ceil(max(p[1] for p in q))+2)
 if x1<=x0 or y1<=y0:return
 local=[(x-x0,y-y0) for x,y in q]
 pw=max(dist(q[0],q[1]),dist(q[2],q[3]));ph=max(dist(q[0],q[3]),dist(q[1],q[2]))
 reduction=max(1,floor(min(front.original.width/pw,front.original.height/ph)*.94))
 texture,(tw,th)=front.at(reduction);c=list(coefficients(local,tw,th));pad=4
 c=[c[0]+pad*c[6],c[1]+pad*c[7],c[2]+pad,c[3]+pad*c[6],c[4]+pad*c[7],c[5]+pad,c[6],c[7]]
 mapped=texture.transform((x1-x0,y1-y0),Image.Transform.PERSPECTIVE,c,Image.Resampling.BICUBIC,fillcolor=(20,25,22))
 mask=Image.new('L',((x1-x0)*2,(y1-y0)*2));ImageDraw.Draw(mask).polygon([(round(x*2),round(y*2)) for x,y in local],fill=255)
 mask=mask.resize((x1-x0,y1-y0),Image.Resampling.LANCZOS)
 image.paste(mapped,(x0,y0),mask)

def phase_plate(profile):
 file=CAPTURES/profile/'shift.png';image=Image.open(file).convert('RGB')
 manifest=json.loads((CAPTURES/'manifest.json').read_text())
 record=next(r for r in manifest['records'] if r['profile']==profile and r['scene']=='shift')
 photo=record['geometry']['photo'];dpr=record['dpr'];r=photo['rect'];box=tuple(round(x*dpr) for x in (r['x'],r['y'],r['right'],r['bottom']))
 orig=Image.open(ROOT/'outputs/flagship-20261106/shift/phase-hero.png').convert('RGB').resize((3200,2400),Image.Resampling.LANCZOS)
 negative=Image.open(ROOT/'outputs/director-20261106/shift/jog-negative-3200-crop.png').convert('RGB')
 mask=Image.new('L',negative.size);ImageDraw.Draw(mask).rectangle((7,7,negative.width-8,negative.height-8),fill=255);mask=mask.filter(ImageFilter.GaussianBlur(3));orig.paste(negative,(800,360),mask)
 x,y,right,bottom=box;w,h=right-x,bottom-y
 assert photo['position'] in ['50% 50%','50% 50% 0px'], 'Recalculate the optical mapping for a different object-position.'
 if photo['fit']=='cover':
  fitted=ImageOps.fit(orig,(w,h),Image.Resampling.LANCZOS);image.paste(fitted,(x,y));scale=max(w/orig.width,h/orig.height)
 elif photo['fit']=='contain':
  fitted=ImageOps.contain(orig,(w,h),Image.Resampling.LANCZOS);x+=round((w-fitted.width)/2);y+=round((h-fitted.height)/2);w,h=fitted.size;image.paste(fitted,(x,y));scale=min(w/orig.width,h/orig.height)
 else:raise AssertionError('Unsupported photographic object-fit: '+photo['fit'])
 focus=((x+w*.5+(.650-.5)*orig.width*scale)/image.width,(y+h*.5+(.635-.5)*orig.height*scale)/image.height)
 return image,focus

class Reel:
 def __init__(self,profile):
  self.mobile=profile=='mobile';self.size=SIZE[profile];self.aspect=self.size[0]/self.size[1]
  kind='mobile' if self.mobile else 'desktop';phase,self.focus=phase_plate(kind)
  self.fronts=[Front(phase)]+[Front(Image.open(CAPTURES/kind/(s+'.png')).convert('RGB')) for s in SCENES[1:]]
  self.back=backdrop(self.size,[(.3,.19,.75,.75,(18,23,20)),(.86,.84,.55,.28,(17,13,7))],(12,17,15),(24,29,25))
  self.step=self.aspect+.06
 def pose(self,index,local):
  # A single authored timeline at 60Hz; the portrait samples exact alternate poses.
  theta=(index*120+local)/600*2*pi
  scale=.922+.008*sin(theta+.3);anchor=(.5+.006*sin(theta),.5+.004*cos(theta))
  if index%5==0:
   pull=ease((local-4)/66)
   scale=exp(mix(log(2.68 if self.mobile else 3.02),log(.922),pull))
   anchor=(mix(self.focus[0],.5,pull),mix(self.focus[1],.5,pull))
  cx=index*self.step+(anchor[0]-.5)*self.aspect
  cy=(.5-anchor[1]);return cx,cy,scale
 def held(self,index,local):
  return self.draw(index,local,*self.pose(index,local))
 def frame(self,n):
  f=n%600;idx=f//120;local=f%120;p=ease((local-84)/36)
  if idx==4 and local>84:
   # Match the ending back to the original optical macro without racing the
   # camera through a magnified empty gap. Only the closing cut uses a wipe.
   image=self.held(idx,local);following=self.held(0,local-120);w,h=self.size
   feather=w*.025;centre=w*(1-p)+feather*(.5-p)
   line=Image.new('L',(w,1));line.putdata([round(255*clamp((x-centre)/feather+.5)) for x in range(w)])
   image.paste(following,(0,0),line.resize((w,h)));return image
  a=self.pose(idx,local);b=self.pose(idx+1,local-120)
  x=mix(a[0],b[0],p);y=mix(a[1],b[1],p);scale=exp(mix(log(a[2]),log(b[2]),p))
  scale*=1-.045*sin(pi*p)
  return self.draw(idx,local,x,y,scale)
 def draw(self,idx,local,x,y,scale):
  theta=(idx*120+local)/600*2*pi;eye=(x+.012*sin(theta),y+.008*cos(theta),1.62)
  project=projection(self.size,eye,(x,y,0),1.62*self.size[1]*scale)
  image=self.back.copy();w,h=self.size
  for sheet in range(max(-1,idx-1),idx+3):
   angle=.034*sin((sheet%5)*1.15+.5)
   plane=surface((sheet*self.step,0,0),self.aspect,1,angle,.012,.005)
   quad=[project(c) for c in plane[0]]
   if max(v[0] for v in quad)<0 or min(v[0] for v in quad)>w:continue
   if scale<1.2:
    shadow=Image.new('L',(w//3,h//3));ImageDraw.Draw(shadow).polygon([((px+6)/3,(py+h*.025)/3) for px,py in quad],fill=65);shadow=shadow.filter(ImageFilter.GaussianBlur(h*.007))
    image.paste((4,8,6),(0,0,w,h),shadow.resize((w,h),Image.Resampling.BILINEAR))
   draw_sheet(image,project,plane,self.fronts[sheet%5])
  return image

def probe(path):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
def verify(path,size,fps):
 p=probe(path);v=p['streams'][0]
 assert (v['width'],v['height'],v['avg_frame_rate'],int(v['nb_frames']))==(*size,f'{fps}/1',10*fps)
 assert len(p['streams'])==1 and v['pix_fmt']=='yuv420p';raw=path.read_bytes();assert raw.find(b'moov')<raw.find(b'mdat')
 subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','null','-'],check=True)
 data=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-vf','scale=160:100,format=gray','-f','rawvideo','-'])
 frames=[data[i:i+16000] for i in range(0,len(data),16000)];assert len(frames)==fps*10
 return {'file':str(path.relative_to(ROOT)),'bytes':path.stat().st_size,'sha256':sha(path),'width':size[0],'height':size[1],'fps':fps,'frames':len(frames),'seconds':10,'faststart':True,'decoded':True,'duplicateAdjacent':sum(a==b for a,b in zip(frames,frames[1:])),'seamMeanGrayDifference':sum(abs(a-b) for a,b in zip(frames[-1],frames[0]))/16000}

def poster(reel,key):
 first=reel.frame(0);first.save(PUBLIC/'images'/(key+'.webp'),quality=91,method=6)
 first.save(OUT/(key+'-first-frame.png'))
 if not reel.mobile:reel.frame(78).resize((320,180),Image.Resampling.LANCZOS).save(PUBLIC/'images/cinematic-web-20261110-thumb.webp',quality=90,method=6)

def encode(profile,proof=False):
 reel=Reel(profile);w,h=reel.size;fps=30 if reel.mobile else 60;key='cinematic-web-20261110'+('-mobile' if reel.mobile else '')
 OUT.mkdir(parents=True,exist_ok=True)
 if proof:
  frames=[0,45,78,102,145,265,385,505,580,599];sheet=Image.new('RGB',(1500,2*(400 if reel.mobile else 200)),(12,17,15));d=ImageDraw.Draw(sheet)
  for i,n in enumerate(frames):
   im=reel.frame(n);im.thumbnail((298,370 if reel.mobile else 170));x=i%5*300;y=i//5*(400 if reel.mobile else 200);sheet.paste(im,(x,y));d.text((x+6,y+im.height+4),f'{n/60:.2f} s',fill=(240,240,225))
  sheet.save(OUT/(key+'-proof.jpg'),quality=94);return
 start=time.monotonic();target=OUT/(key+'-encoding.mp4')
 cmd=['ffmpeg','-v','error','-nostdin','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r',str(fps),'-i','-','-an','-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-c:v','libx264','-threads','3','-preset','slow','-crf','18','-profile:v','high','-level:v','3.1' if reel.mobile else '5.1','-g',str(fps),'-keyint_min',str(fps),'-sc_threshold','0','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',str(target)]
 enc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
 try:
  for n in range(0,600,60//fps):
   enc.stdin.write(reel.frame(n).tobytes())
   if n%120==0:print(key,n,round(time.monotonic()-start,2),flush=True)
 finally:enc.stdin.close()
 assert enc.wait()==0
 record=verify(target,(w,h),fps);assert not record['duplicateAdjacent'];final=PUBLIC/'films'/(key+'.mp4');target.replace(final);record['file']=str(final.relative_to(ROOT));poster(reel,key)
 record['renderSeconds']=time.monotonic()-start;(OUT/(key+'.json')).write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record),flush=True)
 if profile=='desktop':
  for suffix,size,rate,crf in [('hd',(1920,1080),60,'18'),('compact',(1280,720),30,'20')]:
   output=PUBLIC/'films'/f'cinematic-web-20261110-{suffix}.mp4';vf=('select=not(mod(n\\,2)),setpts=N/(30*TB),' if rate==30 else '')+f'scale={size[0]}:{size[1]}:flags=lanczos';subprocess.run(['ffmpeg','-v','error','-y','-i',str(final),'-an','-vf',vf,'-r',str(rate),'-c:v','libx264','-threads','3','-preset','slow','-crf',crf,'-profile:v','high','-level:v','4.2' if rate==60 else '3.1','-g',str(rate),'-keyint_min',str(rate),'-sc_threshold','0','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',str(output)],check=True)
   row=verify(output,size,rate);assert not row['duplicateAdjacent'];(OUT/f'cinematic-web-20261110-{suffix}.json').write_text(json.dumps(row,indent=2)+'\n');print(json.dumps(row),flush=True)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('profile',choices=['desktop','mobile']);parser.add_argument('--proof',action='store_true');a=parser.parse_args();encode(a.profile,a.proof)
