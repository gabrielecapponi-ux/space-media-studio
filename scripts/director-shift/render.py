"""Optical pull-back + format rail, 60 sampled poses per second. Real website + Cycles plates."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps, ImageFilter
from math import sin,cos,pi,exp,log
import argparse,subprocess,json,hashlib,time
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs/director-20261106/shift'
OUT.mkdir(parents=True, exist_ok=True)
BASE=ROOT/'outputs/flagship-20261106/shift'
from plates import surface, projection, face, shadow, Posters, SCENES
PUBLIC=ROOT/'public'
TAU=2*pi
SIZES={'desktop':(1920,1080),'mobile':(720,900)}

def sat(t):
    return min(1.,max(0.,t))

def ease(t):
    u=sat(t)
    return u*u*u*(10+u*(6*u-15))

def mix(a,b,t):
    return a+(b-a)*t

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def backdrop(size, lights, dark, floor_color):
    """Fixed photographic cyc with a dark horizon, cool side key and warm floor bounce."""
    from math import exp
    sw,sh=240,150
    src=Image.new('RGB',(sw,sh)); data=[]
    for j in range(sh):
        v=j/(sh-1)
        for i in range(sw):
            u=i/(sw-1)
            c=[mix(dark[k],floor_color[k],ease((v-.35)/.69)) for k in range(3)]
            for cx,cy,sx,sy,rgb in lights:
                k=exp(-(((u-cx)/sx)**2+((v-cy)/sy)**2))
                c=[a+b*k for a,b in zip(c,rgb)]
            data.append(tuple(round(max(0,min(255,n))) for n in c))
    src.putdata(data)
    return src.resize(size,Image.Resampling.BICUBIC)

def screen_plate(kind):
    img=Image.open(BASE/'screens'/kind/'shift.jpg').convert('RGB')
    # Use enough source texels for the 3.18x jog macro. The other four plates keep
    # the real captured resolution and the print renderer mip-filters long shots.
    factor=2.6 if kind=='desktop' else 2.8
    w,h=img.size
    img=img.resize((round(w*factor),round(h*factor)),Image.Resampling.LANCZOS)
    slot=(768,96,1920,1080) if kind=='desktop' else (0,404,720,900)
    X,Y,R,B=[round(n*factor) for n in slot]
    orig=Image.open(BASE/'phase-hero.png').convert('RGB')
    # The Cycles border uses bottom-up coordinates. Align it back to the full optical field.
    neg=OUT/'jog-negative-3200-crop.png'
    if neg.exists():
        orig=orig.resize((3200,2400),Image.Resampling.LANCZOS)
        detail=Image.open(neg).convert('RGB')
        mask=Image.new('L',detail.size)
        ImageDraw.Draw(mask).rectangle((7,7,detail.width-8,detail.height-8),fill=255)
        mask=mask.filter(ImageFilter.GaussianBlur(3))
        orig.paste(detail,(800,360),mask)
    fitted=ImageOps.fit(orig,(R-X,B-Y),Image.Resampling.LANCZOS)
    img.paste(fitted,(X,Y))
    iw,ih=img.size;rw,rh=R-X,B-Y
    scale=max(rw/orig.width,rh/orig.height)
    # Centre of the large encoder, projected through the same CSS object-fit cover crop.
    du=(X+rw*.5+(.650-.5)*orig.width*scale)/iw
    dv=(Y+rh*.5+(.635-.5)*orig.height*scale)/ih
    return img,(du,dv)

class Reel:
    count=600
    def __init__(self,profile):
        self.mobile=profile=='mobile'; self.size=SIZES[profile]
        kind='mobile' if self.mobile else 'desktop'
        original,self.focus=screen_plate(kind)
        self.screens=[original]+[Image.open(BASE/'screens'/kind/(s+'.jpg')).convert('RGB') for s in SCENES[1:]]
        self.back=backdrop(self.size,[(.24,.24,.69,.72,(36,41,39)),(.98,.76,.35,.26,(29,22,13)),(.37,.94,.75,.22,(25,28,22))],(25,32,32),(54,61,57))
        self.wipes={}
    def shot(self,idx,local):
        w,h=self.size; a=w/h; phase=(idx*120+local)/600*TAU
        image=self.back.copy()
        if idx==0:
            pull=ease((local-8)/60)
            anchor=(mix(self.focus[0]+.008*sin(phase),.50,pull),mix(self.focus[1],.50,pull))
            scale=exp(mix(log(2.79 if self.mobile else 3.18),log(.887 if self.mobile else .885),pull))
            yaw=mix(.002,-.060,pull)+.006*sin(phase)
            pitch=mix(.002,.018,pull)
        else:
            anchor=(.50+.012*sin(phase+.42),.50+.008*cos(phase+.8))
            scale=(.902 if self.mobile else .887)+.028*sin(phase+.4)
            yaw=(.045+.022*idx)*cos(phase-.6)
            pitch=-.009+.032*sin(phase+.3)
        plane=surface((0,0,0),a,1,yaw,pitch,.012)
        corners=plane[0]
        tl,tr,br,bl=corners
        u,v=anchor
        focus=tuple(tl[j]+u*(tr[j]-tl[j])+v*(bl[j]-tl[j]) for j in range(3))
        eye=(focus[0],focus[1],focus[2]+1.62)
        project=projection(self.size,eye,focus,1.62*h*scale)
        # Editorial glass edge and a soft physically aligned contact shadow.
        if scale<1.18:
            q=[project(p) for p in corners]
            sh=Image.new('L',(w//3,h//3))
            ImageDraw.Draw(sh).polygon([((x+12)/3,(y+h*.031)/3) for x,y in q],fill=117)
            sh=sh.filter(ImageFilter.GaussianBlur(h*.011))
            image.paste((11,19,19),(0,0,w,h),sh.resize((w,h),Image.Resampling.BILINEAR))
        face(image,project,plane,self.screens[idx],(192,199,190),(31,34,32))
        return image
    def frame(self,n):
        f=n%600;idx=f//120;local=f%120
        result=self.shot(idx,local)
        if local>84:
            u=ease((local-84)/36)
            following=self.shot((idx+1)%5,local-120)
            # Straight optical wipe. Its central crossing at frame 102 matches the HTML chapter.
            w,h=self.size
            if local not in self.wipes:
                line=Image.new('L',(w,1)); feather=w*.035
                centre=w*(1-u)+feather*(.5-u)
                line.putdata([round(255*sat((i-centre)/feather+.5)) for i in range(w)])
                self.wipes[local]=line.resize((w,h))
            result.paste(following,(0,0),self.wipes[local])
        return result

class Campaign:
    count=600
    def __init__(self,profile):
        self.mobile=profile=='mobile'; self.size=SIZES[profile]
        self.posters=Posters()
        self.back=backdrop(self.size,[(.29,.24,.50,.42,(36,42,45)),(.93,.71,.40,.29,(48,33,21)),(.34,.86,.67,.13,(38,37,29))],(16,21,23),(65,64,58))
        self.nodes={
            'story':(-5.55,2.74,-.24,2.86,.055),
            'square':(-.26,2.54,.05,4.65,-.034),
            'banner':(5.95,2.23,-.32,6.15,-.105)
        }
        # Rig positions are authored separately for portrait: the complete 16:9 print
        # is pulled back, while the 9:16 print advances without sacrificing its footer.
        self.keys = [
            (0,'story'),(1.72,'story'),(2.63,'square'),(4.32,'square'),
            (5.24,'banner'),(6.98,'banner'),(7.96,'wide'),(8.59,'wide'),
            (9.78,'story'),(10.,'story')
        ]
    def pose(self,name,theta):
        mobile=self.mobile; w,h=self.size
        if name=='wide':
            # Portrait is a cut-in of the central print, flanked by the adjacent formats.
            target=(-.07,2.56,-.13);distance=13.3 if not mobile else 14.7
            focal=h*(1.19 if not mobile else 1.1)
        else:
            x,y,z,pw,angle=self.nodes[name]
            ph=pw*{'story':16/9,'square':1,'banner':9/16}[name]
            fillw=.87 if mobile else {'story':.46,'square':.59,'banner':.78}[name]
            # For each focus pose constrain width AND height of its actual-format sheet.
            focal=h*1.32
            safe_h=.78 if mobile else .845
            distance=max(pw*focal/(fillw*w),ph*focal/(safe_h*h))
            # Move the off-centre desktop angle towards the other formats without hiding the focal print.
            shift=({'story':.51,'square':.0,'banner':-.52}[name] if not mobile else 0)
            target=(x+shift,y+.019,z)
        dx=.145*sin(theta+.72); dy=.045*cos(theta-.26)
        eye=(target[0]+.18+dx,target[1]+.22+dy,target[2]+distance+.038*cos(theta))
        return eye,target,focal
    def frame(self,n):
        f=n%600;t=f/60;theta=TAU*t/10
        interval=next(i for i in range(len(self.keys)-1) if self.keys[i][0]<=t<self.keys[i+1][0])
        t0,first=self.keys[interval]; t1,second=self.keys[interval+1]
        weight=ease((t-t0)/(t1-t0))
        a,at,af=self.pose(first,theta);b,bt,bf=self.pose(second,theta)
        eye=tuple(mix(k,l,weight) for k,l in zip(a,b))
        target=tuple(mix(k,l,weight) for k,l in zip(at,bt))
        # Camera moves away from the prints during travel to reveal their physical spacing.
        arc=sin(pi*weight) if first!=second else 0
        eye=(eye[0],eye[1]+.32*arc,eye[2]+.74*arc)
        project=projection(self.size,eye,target,mix(af,bf,weight))
        image=self.back.copy(); w,h=self.size
        shapes=[]
        for name,(x,y,z,pw,angle) in self.nodes.items():
            ratio={'story':9/16,'square':1,'banner':16/9}[name];ph=pw/ratio
            plane=surface((x,y,z),pw,ph,angle,-.015,.085)
            quad=[project(v) for v in plane[0]]
            if max(p[0] for p in quad)<-w*.14 or min(p[0] for p in quad)>w*1.14:continue
            shapes.append((name,x,y,z,pw,ph,angle,plane))
            shadow(image,project,plane,130,h*.021)
        # Matte aluminium easels contact the sweep. Draw the farthest sheets first.
        for name,x,y,z,pw,ph,angle,plane in sorted(shapes,key=lambda a:a[3]):
            leg=y-ph/2
            if leg>.01:
                face(image,project,surface((x,leg/2,z-.11),pw*.145,leg,angle,0,.15),(65,69,65),(122,126,117),(47,49,45))
                face(image,project,surface((x,.035,z-.06),pw*.37,.07,angle,0,.43),(104,109,101),(152,155,145),(64,65,59))
            tex=self.posters.at(name,theta)
            face(image,project,plane,tex,(208,207,187),(43,43,38))
        return image

def stills(obj,name,profile,key):
    # Keep the resting image optically aligned with the first decoded frame. The
    # smaller index tile may instead display the shop destination / square campaign.
    obj.frame(0).save(PUBLIC/'images'/(key+'.jpg'),quality=91,subsampling=0,optimize=True)
    if profile=='desktop':
        thumb_frame=78 if name=='web' else 196
        thumb=obj.frame(thumb_frame).resize((320,180),Image.Resampling.LANCZOS)
        thumb.save(PUBLIC/'images'/(key+'-thumb.webp'),quality=85,method=6)

def render(name,profile,proof,stills_only=False):
    obj=Reel(profile) if name=='web' else Campaign(profile)
    key='director-'+name+('-mobile' if profile=='mobile' else '')
    if stills_only:
        stills(obj,name,profile,key)
        record=OUT/(key+'.json')
        if record.exists():
            values=json.loads(record.read_text())
            values['posterFrame']=0
            record.write_text(json.dumps(values,indent=2)+'\n')
        return
    if proof:
        frames=[0,21,46,75,142,266,393,511] if name=='web' else [20,102,172,218,319,393,477,516]
        sheet=Image.new('RGB',(1000,2*(250 if profile=='desktop' else 325)),(34,36,36))
        for j,n in enumerate(frames):
            img=obj.frame(n);img.thumbnail((248,225 if profile=='desktop' else 306))
            x=(j%4)*250;y=(j//4)*(250 if profile=='desktop' else 325)
            sheet.paste(img,(x,y));ImageDraw.Draw(sheet).text((x,y+img.height+2),f'{n/60:.2f} s')
        sheet.save(OUT/(key+'-proof.jpg'),quality=92);return
    assert (OUT/'jog-negative-3200-crop.png').exists() or name!='web'
    start=time.monotonic();w,h=obj.size
    # Identical authored timing and camera easing at both presentation rates. Sample
    # true half-rate poses directly on mobile to lower the iPhone decoder budget.
    fps=30 if profile=='mobile' else 60
    stride=60//fps
    frame_count=obj.count//stride
    route=OUT/(key+'-encoding.mp4')
    cmd=['ffmpeg','-v','error','-nostdin','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r',str(fps),'-i','-','-an','-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-c:v','libx264','-threads','3','-preset','fast','-crf','20','-profile:v','high','-level:v','3.1' if profile=='mobile' else '4.2','-g',str(fps),'-keyint_min',str(fps),'-sc_threshold','0','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',str(route)]
    enc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    try:
        for i in range(frame_count):
            enc.stdin.write(obj.frame(i*stride).tobytes())
            if (i+1)%(fps*2)==0:print(f'{key} {i+1}/{frame_count} {time.monotonic()-start:.1f}s',flush=True)
    finally:enc.stdin.close()
    if enc.wait():raise RuntimeError('encoder')
    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(route)]))['streams'][0]
    assert (info['width'],info['height'],info['nb_frames'],info['pix_fmt'],info['avg_frame_rate'])==(w,h,str(frame_count),'yuv420p',f'{fps}/1')
    data=subprocess.check_output(['ffmpeg','-v','error','-threads','2','-i',str(route),'-vf','scale=144:90,format=gray','-threads','1','-f','rawvideo','-'])
    frames=[data[i:i+12960] for i in range(0,len(data),12960)]
    assert len(frames)==frame_count
    dup=sum(a==b for a,b in zip(frames,frames[1:]))
    assert not dup,(key,dup)
    raw=route.read_bytes();assert raw.find(b'moov')<raw.find(b'mdat')
    target=PUBLIC/'films'/(key+'.mp4');route.replace(target)
    stills(obj,name,profile,key)
    record=dict(asset=name,profile=profile,file=target.name,size=[w,h],seconds=10,fps=fps,frames=frame_count,sha256=digest(target),bytes=target.stat().st_size,posterFrame=0,duplicateAdjacent144x90=dup,faststart=True,decode='pass',loopAverageDifference8bit=sum(abs(a-b) for a,b in zip(frames[-1],frames[0]))/12960,secondsRender=round(time.monotonic()-start,2))
    (OUT/(key+'.json')).write_text(json.dumps(record,indent=2)+'\n')
    print(json.dumps(record),flush=True)

if __name__=='__main__':
    args=argparse.ArgumentParser();args.add_argument('film',choices=('web','campaign'));args.add_argument('profile',choices=SIZES);args.add_argument('--proof',action='store_true');args.add_argument('--stills',action='store_true');a=args.parse_args();render(a.film,a.profile,a.proof,a.stills)
