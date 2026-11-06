"""Pinhole camera, software projection and original print plates for the SHIFT product."""
from math import sin, cos, sqrt, floor, ceil, dist
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'outputs/flagship-20261106/shift'
PUBLIC = ROOT / 'public'
SCENES = ('shift', 'vela', 'nude', 'basilico', 'oltre')


def dot(a,b):
    return sum(v*w for v,w in zip(a,b))


def sub(a,b):
    return tuple(v-w for v,w in zip(a,b))


def cross(a,b):
    return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])


def unit(v):
    size=sqrt(dot(v,v))
    return tuple(x/size for x in v)


def projection(size, eye, target, focal):
    w,h=size
    forward=unit(sub(target,eye))
    right=unit(cross(forward,(0,1,0)))
    up=cross(right,forward)
    def project(point):
        ray=sub(point,eye)
        z=dot(ray,forward)
        return (w*.5+focal*dot(right,ray)/z, h*.5-focal*dot(up,ray)/z)
    return project


def coefficients(quad,w,h):
    """Inverse projective map of destination pixel positions to source coordinates."""
    rows=[]
    for (x,y),(u,v) in zip(quad,((0,0),(w,0),(w,h),(0,h))):
        rows.extend(([x,y,1,0,0,0,-u*x,-u*y,u], [0,0,0,x,y,1,-v*x,-v*y,v]))
    for i in range(8):
        best=max(range(i,8),key=lambda r:abs(rows[r][i]))
        rows[i],rows[best]=rows[best],rows[i]
        pivot=rows[i][i]
        rows[i]=[c/pivot for c in rows[i]]
        for j in range(8):
            if j!=i:
                scale=rows[j][i]
                rows[j]=[v-scale*k for v,k in zip(rows[j],rows[i])]
    return tuple(row[-1] for row in rows)


def surface(center,w,h,yaw=0,pitch=0,depth=.10):
    x,y,z=center
    def at(dx,dy,dz):
        yp=dy*cos(pitch)-dz*sin(pitch)
        zp=dy*sin(pitch)+dz*cos(pitch)
        return (x+dx*cos(yaw)+zp*sin(yaw), y+yp,z-dx*sin(yaw)+zp*cos(yaw))
    def layer(d):
        return [at(a*w*.5,b*h*.5,d) for a,b in ((-1,1),(1,1),(1,-1),(-1,-1))]
    return (layer(0),layer(-depth))


def face(image,project,plane,texture,edge,back):
    front,rear=plane
    q=[project(pt) for pt in front]
    r=[project(pt) for pt in rear]
    pen=ImageDraw.Draw(image)
    # Only the perimeter between the rear and front hull is visible.
    pen.polygon(r,fill=back)
    for j,color in enumerate((edge,back,back,edge)):
        k=(j+1)%4
        pen.polygon((r[j],r[k],q[k],q[j]),fill=color)
    if isinstance(texture,tuple):
        pen.polygon(q,fill=texture)
        return
    x0=max(0,floor(min(p[0] for p in q))-1)
    y0=max(0,floor(min(p[1] for p in q))-1)
    x1=min(image.width,ceil(max(p[0] for p in q))+1)
    y1=min(image.height,ceil(max(p[1] for p in q))+1)
    if x1<=x0 or y1<=y0: return
    local=[(x-x0,y-y0) for x,y in q]
    projected_w=max(dist(q[0],q[1]),dist(q[2],q[3]))
    projected_h=max(dist(q[0],q[3]),dist(q[1],q[2]))
    # Spatial prefiltering keeps the encoder grooves and small type stable through an orbit.
    reduction=floor(min(texture.width/projected_w,texture.height/projected_h)*.96)
    if reduction>=2:
        texture=texture.reduce(reduction)
    coeff=coefficients(local,texture.width,texture.height)
    mapped=texture.transform((x1-x0,y1-y0),Image.Transform.PERSPECTIVE,coeff,Image.Resampling.BICUBIC,fillcolor=texture.getpixel((0,0)))
    # Supersampled 1.3 px silhouette, while the texture is reprojected at output resolution.
    scale=2
    mask=Image.new('L',((x1-x0)*scale,(y1-y0)*scale))
    ImageDraw.Draw(mask).polygon([(round(x*scale),round(y*scale)) for x,y in local],fill=255)
    mask=mask.resize((x1-x0,y1-y0),Image.Resampling.LANCZOS)
    image.paste(mapped,(x0,y0),mask)


def shadow(image,project,plane,opacity,blur):
    w,h=image.size
    # One area source from upper left, with two penumbra lobes for the visible contact.
    front,_=plane
    for radius,alpha in ((blur,opacity),(.42*blur,.48*opacity)):
        soft=Image.new('L',(w//3,h//3))
        poly=[project((x+.47*y,-.025,z-.69*y)) for x,y,z in front]
        ImageDraw.Draw(soft).polygon([(x/3,y/3) for x,y in poly],fill=round(alpha))
        soft=soft.filter(ImageFilter.GaussianBlur(radius/3))
        image.paste((13,20,20), (0,0,w,h), soft.resize((w,h),Image.Resampling.BILINEAR))


def face_font(size,bold=False,mono=False):
    f=ImageFont.truetype(str(PUBLIC/'fonts'/('DMMono-Regular.ttf' if mono else 'SpaceGrotesk-Variable.woff2')),size)
    if not mono:
        f.set_variation_by_axes([660 if bold else 480])
    return f


class Posters:
    """Three genuinely different layouts for native 9:16, 1:1 and 16:9 artwork."""
    def __init__(self):
        self.photos={name:Image.open(OUT/('phase-'+name+'.png')).convert('RGB') for name in ('hero','overhead','detail')}
        self.layout={}
        for name,size in {'story':(576,1024),'square':(1024,1024),'banner':(1024,576)}.items():
            w,h=size
            if name=='square':
                bg=(233,232,222);ink=(28,31,28); photo='hero'; slot=(0,224,w,916)
            elif name=='story':
                bg=(28,31,29);ink=(239,241,225);photo='overhead';slot=(0,283,w,831)
            else:
                bg=(210,94,58);ink=(33,37,31);photo='detail';slot=(410,0,w,h)
            base=Image.new('RGB',size,bg);d=ImageDraw.Draw(base)
            if name=='square':
                d.text((44,28),'SHIFT AUDIO',font=face_font(27,True),fill=ink,anchor='lt')
                d.text((w-44,34),'STEREO SAMPLER',font=face_font(19,mono=True),fill=ink,anchor='rt')
                d.text((36,76),'PHASE 01',font=face_font(163,True),fill=ink,anchor='lt',stroke_width=0)
                d.rectangle((0,916,w,h),fill=(215,99,57))
                d.text((42,952),'16 PAD  /  4 ENCODER',font=face_font(24,mono=True),fill=ink,anchor='lt')
            elif name=='story':
                d.text((29,31),'SHIFT AUDIO',font=face_font(26,True),fill=ink,anchor='lt')
                d.text((27,100),'PHASE',font=face_font(115,True),fill=ink,anchor='lt')
                d.text((29,205),'01',font=face_font(86,True),fill=(230,112,65),anchor='lt')
                d.text((30,874),'CAMPIONATORE',font=face_font(39,True),fill=ink,anchor='lt')
                d.text((30,920),'STEREO',font=face_font(39,True),fill=ink,anchor='lt')
            else:
                d.text((32,32),'SHIFT AUDIO',font=face_font(28,True),fill=ink,anchor='lt')
                d.text((27,179),'PHASE',font=face_font(108,True),fill=ink,anchor='lt')
                d.text((26,281),'01',font=face_font(144,True),fill=ink,anchor='lt')
                d.text((32,510),'STEREO SAMPLER',font=face_font(22,mono=True),fill=ink,anchor='lt')
            self.layout[name]=(base,photo,slot)

    def at(self,name,theta):
        base,photo,box=self.layout[name];im=base.copy()
        src=self.photos[photo];x,y,r,b=box;w,h=r-x,b-y
        ratio=w/h
        cw=min(src.width,src.height*ratio)
        ch=cw/ratio
        if name=='story':
            # Vertical social spot scans along the panel from the pads to the main wheel.
            cw*=.91+.05*cos(theta);ch=cw/ratio;cx=.50+.18*sin(theta);cy=.50
        elif name=='banner':
            cw*=.91+.035*cos(theta+.4);ch=cw/ratio;cx=.54+.13*sin(theta-.3);cy=.50
        else:
            cw*=.98+.02*cos(theta);ch=cw/ratio;cx=.50+.06*sin(theta);cy=.56
        sx=(src.width-cw)*cx;sy=(src.height-ch)*cy
        patch=src.transform((w,h),Image.Transform.EXTENT,(sx,sy,sx+cw,sy+ch),Image.Resampling.BICUBIC)
        im.paste(patch,(x,y))
        return im
