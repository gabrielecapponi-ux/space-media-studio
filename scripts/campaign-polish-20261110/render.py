"""SHIFT campaign: dark physical edges, three native print formats, continuous camera.

Reuses the original Cycles SHIFT photographs. No crop of the delivered film.
The scene is projected from 3D vertices with a pinhole camera, matching the
saved Blender master. Render to a streaming encoder; no large frame archive.
"""
from pathlib import Path
from math import sin, cos, pi, floor, ceil, dist
import argparse, hashlib, json, subprocess, sys, time
from PIL import Image, ImageDraw, ImageFilter
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs/campaign-web-revision-20261110/campaign'
sys.path.insert(0,str(ROOT/'scripts/director-shift'))
from plates import surface,projection,coefficients,face_font
from render import backdrop,ease,mix,shadow
TAU=2*pi
INK=(24,28,26);EDGE=(23,27,25);BACK=(17,21,19);ORANGE=(222,98,57);PAPER=(236,237,222)
SIZES={'desktop':(2560,1440),'mobile':(720,900)}

class Prints:
 def __init__(self):
  base=ROOT/'outputs/flagship-20261106/shift'
  self.photos={n:Image.open(base/f'phase-{n}.png').convert('RGB') for n in ['hero','overhead','detail']}
  self.layout={}
  for name,size in {'story':(1152,2048),'square':(2048,2048),'banner':(2048,1152)}.items():
   w,h=size;im=Image.new('RGB',size,INK);d=ImageDraw.Draw(im)
   if name=='story':
    slot=(0,600,w,1660);photo='overhead'
    d.text((64,64),'SHIFT AUDIO',font=face_font(49,True),fill=PAPER,anchor='lt')
    d.text((58,202),'PHASE',font=face_font(238,True),fill=PAPER,anchor='lt')
    d.text((61,424),'01',font=face_font(166,True),fill=ORANGE,anchor='lt')
    d.text((64,1740),'MAKE IT',font=face_font(117,True),fill=PAPER,anchor='lt')
    d.text((64,1852),'YOUR SOUND.',font=face_font(117,True),fill=ORANGE,anchor='lt')
   elif name=='square':
    slot=(0,462,w,1806);photo='hero'
    d.text((88,66),'SHIFT AUDIO',font=face_font(54,True),fill=PAPER,anchor='lt')
    d.text((w-88,73),'STEREO SAMPLER',font=face_font(36,mono=True),fill=ORANGE,anchor='rt')
    d.text((66,154),'PHASE 01',font=face_font(326,True),fill=PAPER,anchor='lt')
    d.text((88,1894),'16 PAD. INFINITE POSSIBILITÀ.',font=face_font(50,True),fill=ORANGE,anchor='lt')
   else:
    slot=(840,0,w,h);photo='detail'
    d.text((64,66),'SHIFT AUDIO',font=face_font(52,True),fill=PAPER,anchor='lt')
    d.text((52,328),'PHASE',font=face_font(224,True),fill=PAPER,anchor='lt')
    d.text((56,550),'01',font=face_font(302,True),fill=ORANGE,anchor='lt')
    d.text((64,1022),'MAKE IT YOUR SOUND.',font=face_font(42,mono=True),fill=PAPER,anchor='lt')
   self.layout[name]=(im,photo,slot)
 def at(self,name,theta):
  base,photo,box=self.layout[name];im=base.copy();src=self.photos[photo];x,y,r,b=box;w,h=r-x,b-y;ratio=w/h
  cw=min(src.width,src.height*ratio);ch=cw/ratio
  if name=='story':cw*=.94+.025*cos(theta);ch=cw/ratio;cx=.5+.085*sin(theta);cy=.5
  elif name=='banner':cw*=.95+.02*cos(theta+.4);ch=cw/ratio;cx=.53+.06*sin(theta-.3);cy=.5
  else:cw*=.985+.015*cos(theta);ch=cw/ratio;cx=.5+.035*sin(theta);cy=.56
  sx=(src.width-cw)*cx;sy=(src.height-ch)*cy
  patch=src.transform((w,h),Image.Transform.EXTENT,(sx,sy,sx+cw,sy+ch),Image.Resampling.BICUBIC)
  im.paste(patch,(x,y));return im

def face(image,project,plane,texture,edge=EDGE,back=BACK):
 front,rear=plane;q=[project(p) for p in front];r=[project(p) for p in rear]
 pen=ImageDraw.Draw(image);pen.polygon(r,fill=back)
 for j in range(4):k=(j+1)%4;pen.polygon((r[j],r[k],q[k],q[j]),fill=edge if j in [0,3] else back)
 if isinstance(texture,tuple):pen.polygon(q,fill=texture);return
 x0=max(0,floor(min(p[0] for p in q))-2);y0=max(0,floor(min(p[1] for p in q))-2)
 x1=min(image.width,ceil(max(p[0] for p in q))+2);y1=min(image.height,ceil(max(p[1] for p in q))+2)
 if x1<=x0 or y1<=y0:return
 local=[(x-x0,y-y0) for x,y in q]
 pw=max(dist(q[0],q[1]),dist(q[2],q[3]));ph=max(dist(q[0],q[3]),dist(q[1],q[2]));reduction=floor(min(texture.width/pw,texture.height/ph)*.96)
 if reduction>=2:texture=texture.reduce(reduction)
 # The front hull and the texture use exactly the same projective corners.
 # Smooth one physical silhouette; never draw a second bright outline beneath.
 mapped=texture.transform((x1-x0,y1-y0),Image.Transform.PERSPECTIVE,coefficients(local,texture.width,texture.height),Image.Resampling.BICUBIC,fillcolor=INK)
 scale=3;mask=Image.new('L',((x1-x0)*scale,(y1-y0)*scale));ImageDraw.Draw(mask).polygon([(round(x*scale),round(y*scale)) for x,y in local],fill=255)
 mask=mask.resize((x1-x0,y1-y0),Image.Resampling.LANCZOS);image.paste(mapped,(x0,y0),mask)

class Campaign:
 def __init__(self,profile):
  self.mobile=profile=='mobile';self.size=SIZES[profile];self.posters=Prints()
  self.back=backdrop(self.size,[(.28,.17,.58,.48,(22,26,24)),(.92,.72,.37,.32,(40,22,10)),(.48,.95,.7,.18,(19,22,17))],(12,17,16),(42,45,39))
  self.nodes={'story':(-5.50,2.74,-.18,2.86,.07),'square':(-.24,2.54,.04,4.65,-.035),'banner':(5.95,2.23,-.22,6.15,-.075)}
  if self.mobile:self.nodes={'story':(-2.2,5.8,-.18,2.55,.055),'square':(1.35,5.5,.04,3.8,-.035),'banner':(0,1.75,.35,6.15,-.04)}
  self.keys=[(0,'story'),(1.65,'story'),(2.85,'square'),(4.35,'square'),(5.55,'banner'),(7.10,'banner'),(8.15,'wide'),(8.72,'wide'),(10,'story')]
 def pose(self,name,theta):
  w,h=self.size
  if name=='wide':target=(-.03,2.56,-.13) if not self.mobile else (-.05,4.1,.03);distance=13.6 if not self.mobile else 10.8;focal=h*(1.18 if not self.mobile else 1.08)
  else:
   x,y,z,pw,a=self.nodes[name];ph=pw*{'story':16/9,'square':1,'banner':9/16}[name];fillw=(.91 if name=='banner' else .86) if self.mobile else {'story':.45,'square':.59,'banner':.78}[name];focal=h*1.32;distance=max(pw*focal/(fillw*w),ph*focal/((.77 if self.mobile else .83)*h));shift=0 if self.mobile else {'story':.49,'square':0,'banner':-.50}[name];target=(x+shift,y+.019+(.65 if self.mobile and name=='banner' else 0),z)
  return (target[0]+.12+.07*sin(theta+.72),target[1]+.16+.025*cos(theta-.26),target[2]+distance+.025*cos(theta)),target,focal
 def scene(self,n):
  t=(n%600)/60;theta=TAU*t/10;i=next(i for i in range(len(self.keys)-1) if self.keys[i][0]<=t<self.keys[i+1][0]);a,first=self.keys[i];b,last=self.keys[i+1];u=ease((t-a)/(b-a));eye,target,focal=self.pose(first,theta);eye2,target2,focal2=self.pose(last,theta);arc=sin(pi*u) if first!=last else 0
  eye=tuple(mix(k,l,u) for k,l in zip(eye,eye2));target=tuple(mix(k,l,u) for k,l in zip(target,target2));eye=(eye[0],eye[1]+.20*arc,eye[2]+.6*arc)
  return theta,eye,target,mix(focal,focal2,u)
 def frame(self,n):
  theta,eye,target,focal=self.scene(n);project=projection(self.size,eye,target,focal);im=self.back.copy();w,h=self.size;shapes=[]
  for name,(x,y,z,pw,angle) in self.nodes.items():
   ph=pw/{'story':9/16,'square':1,'banner':16/9}[name];plane=surface((x,y,z),pw,ph,angle,-.012,.055);q=[project(v) for v in plane[0]]
   if max(p[0] for p in q)<-w*.1 or min(p[0] for p in q)>w*1.1:continue
   shapes.append((name,x,y,z,pw,ph,angle,plane));shadow(im,project,plane,115,h*.019)
  for name,x,y,z,pw,ph,angle,plane in sorted(shapes,key=lambda a:a[3]):
   leg=y-ph/2
   if leg>.01:
    face(im,project,surface((x,leg/2,z-.11),pw*.13,leg,angle,0,.15),(29,34,30),(39,44,38),(22,26,23))
    face(im,project,surface((x,.035,z-.06),pw*.36,.07,angle,0,.4),(39,44,38),(51,55,46),(23,27,24))
   face(im,project,plane,self.posters.at(name,theta))
  return im

def authoring():
 OUT.mkdir(parents=True,exist_ok=True)
 data={}
 for profile in SIZES:
  scene=Campaign(profile);data[profile]={'size':scene.size,'nodes':scene.nodes,'poses':[scene.scene(i) for i in range(601)]}
 (OUT/'scene.json').write_text(json.dumps(data)+'\n')
 (OUT/'prints').mkdir(exist_ok=True)
 scene=Campaign('desktop')
 for name in ['story','square','banner']:scene.posters.at(name,0).save(OUT/'prints'/f'{name}.png')

def proof():
 authoring()
 OUT.mkdir(parents=True,exist_ok=True)
 for profile in SIZES:
  scene=Campaign(profile);folder=OUT/'sample'/profile;folder.mkdir(parents=True,exist_ok=True)
  for frame in [0,120,210,360,510]:
   scene.frame(frame).save(folder/f'{frame:04d}.png')
  print(profile,'proof complete',flush=True)
 if not (OUT/'prints').exists():(OUT/'prints').mkdir()
 for name in ['story','square','banner']:Campaign('desktop').posters.at(name,0).save(OUT/'prints'/f'{name}.png')

if __name__=='__main__':proof()
