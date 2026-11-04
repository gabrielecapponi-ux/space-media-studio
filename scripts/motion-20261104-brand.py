"""Space / original cinematic branding and project-design studies.
Run only in an isolated background Blender process. Actual 3D typography,
geometry, light and periodic authored motion. No external model or texture.
"""
import argparse, bpy, hashlib, json, math, subprocess, sys, time, struct
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'outputs/motion-20261104'
p=argparse.ArgumentParser();p.add_argument('--scene',choices=['brand'],default='brand');p.add_argument('--mode',choices=['proof','nativeproof','render','encode','validate'],default='proof');p.add_argument('--frames',default='1:288');p.add_argument('--profile',choices=['desktop','mobile'],default='desktop');p.add_argument('--samples',type=int,default=48)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
folder=OUT/a.scene/a.profile;folder.mkdir(parents=True,exist_ok=True)
N=288;FPS=48
WIDTH,HEIGHT=(1920,1080)if a.profile=='desktop'else(720,900)
SUFFIX=''if a.profile=='desktop'else'-mobile'

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def rgb(h):
 v=[int(h.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]
 return tuple(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v)+(1,)
def material(name,color,rough=.4,metal=0,coat=0,micro=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;bs=m.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=rgb(color);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal;bs.inputs['Coat Weight'].default_value=coat
 if micro:
  n=m.node_tree.nodes;l=m.node_tree.links;noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=220
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=micro;bump.inputs['Distance'].default_value=.004;l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],bs.inputs['Normal'])
 return m
def empty(name,pos=(0,0,0),parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.scene.collection.objects.link(o);o.location=pos;o.parent=parent;return o
def box(name,dims,pos,m,parent=None,bevel=.02):
 bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.name=name;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  b=o.modifiers.new('Crafted edge','BEVEL');b.width=bevel;b.segments=5
  b.affect='EDGES';bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name)
  for f in o.data.polygons:f.use_smooth=True
  n=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');n.keep_sharp=True
 o.location=pos;o.parent=parent;o.data.materials.append(m);return o
def cylinder(name,radius,depth,pos,m,parent=None):
 bpy.ops.mesh.primitive_cylinder_add(vertices=128,radius=radius,depth=depth);o=bpy.context.object;o.name=name;o.location=pos;o.parent=parent;o.data.materials.append(m)
 b=o.modifiers.new('Rolled finished edge','BEVEL');b.width=.025;b.segments=4;n=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');n.keep_sharp=True
 for f in o.data.polygons:f.use_smooth=True
 return o
def hollow_tin(name,radius,height,bottom,m,parent):
 verts=[];count=128;thickness=.027
 rings=[(radius,bottom),(radius,bottom+height),(radius-thickness,bottom+height),(radius-thickness,bottom+.07)]
 for r,z in rings:
  for i in range(count):
   angle=2*math.pi*i/count;verts.append((r*math.cos(angle),r*math.sin(angle),z))
 faces=[];indices=[]
 for ring in range(3):
  for i in range(count):faces.append((ring*count+i,ring*count+(i+1)%count,(ring+1)*count+(i+1)%count,(ring+1)*count+i));indices.append(0 if ring==0 else 1 if ring==1 else 2)
 faces.append(tuple(reversed(range(3*count,4*count))));indices.append(2)
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new(name,me);s.collection.objects.link(ob);ob.parent=parent
 for mat in[m,silver,black]:ob.data.materials.append(mat)
 for face,idx in zip(ob.data.polygons,indices):face.material_index=idx;face.use_smooth=len(face.vertices)==4
 return ob

def torus(name,major,minor,pos,m,parent=None,rotation=(0,0,0)):
 bpy.ops.mesh.primitive_torus_add(major_segments=128,minor_segments=12,major_radius=major,minor_radius=minor,location=(0,0,0));o=bpy.context.object;o.name=name;o.location=pos;o.rotation_euler=rotation;o.parent=parent;o.data.materials.append(m)
 for f in o.data.polygons:f.use_smooth=True
 return o
def text(body,name,size,pos,m,parent=None,font=None,align='LEFT',rot=(0,0,0),extrude=.0008):
 c=bpy.data.curves.new(name,'FONT');c.body=body;c.font=font or font_regular;c.size=size;c.align_x=align;c.space_character=1;c.extrude=extrude;c.bevel_depth=.0003;c.bevel_resolution=2;c.resolution_u=16
 o=bpy.data.objects.new(name,c);s.collection.objects.link(o);o.location=pos;o.rotation_euler=rot;o.parent=parent;o.data.materials.append(m);return o
def curved(body,name,size,radius,z,m,parent,center=.25,font=None):
 widths=[]
 for ch in body:
  ob=text(ch,'Measure',size,(0,0,0),m,font=font);bpy.context.view_layer.update();widths.append(size*.40 if ch.isspace() else ob.dimensions.x+size*.085);bpy.data.objects.remove(ob,do_unlink=True)
 x=-sum(widths)/2
 for i,(ch,w) in enumerate(zip(body,widths)):
  angle=center+(x+w*.5)/radius
  text(ch,name+f' {i:02}',size,(radius*math.sin(angle),-radius*math.cos(angle),z),m,parent,font,align='CENTER',rot=(math.pi/2,0,angle));x+=w

def aim(o,point):o.rotation_euler=(Vector(point)-o.location).to_track_quat('-Z','Y').to_euler()
def area(name,pos,power,size,target,size_y=None,color='#ffffff'):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='RECTANGLE';d.size=size;d.size_y=size_y or size;d.color=rgb(color)[:3];o=bpy.data.objects.new(name,d);s.collection.objects.link(o);o.location=pos;aim(o,target);return o

def hull2(points):
 points=sorted(set(points))
 def cross(a,b,c):return(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
 lower=[];upper=[]
 for point in points:
  while len(lower)>1 and cross(lower[-2],lower[-1],point)<=0:lower.pop()
  lower.append(point)
 for point in reversed(points):
  while len(upper)>1 and cross(upper[-2],upper[-1],point)<=0:upper.pop()
  upper.append(point)
 return lower[:-1]+upper[:-1]

def paper_clearance(scene):
 can=scene.objects.get('FORMA coffee tin')
 if can is None:return None
 inv=can.matrix_world.inverted();minimum=100
 for name in ['Lower white cotton card','Thick graphite card','Citron cotton card']:
  ob=scene.objects[name]
  if ob.hide_render:continue
  matrix=inv@ob.matrix_world;corners=[matrix@Vector(v)for v in ob.bound_box]
  if max(v.z for v in corners)<.075 or min(v.z for v in corners)>2.725:continue
  polygon=hull2([(v.x,v.y)for v in corners]);distances=[];crosses=[]
  for i,point in enumerate(polygon):
   other=polygon[(i+1)%len(polygon)];dx=other[0]-point[0];dy=other[1]-point[1];t=max(0,min(1,-(point[0]*dx+point[1]*dy)/(dx*dx+dy*dy)));distances.append(math.hypot(point[0]+t*dx,point[1]+t*dy));crosses.append(dx*(-point[1])-dy*(-point[0]))
  inside=all(v>=0 for v in crosses)or all(v<=0 for v in crosses)
  gap=(0 if inside else min(distances))-1.185;minimum=min(minimum,gap)
 return minimum


bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.eevee.taa_render_samples=a.samples;s.eevee.use_raytracing=True;s.eevee.ray_tracing_options.resolution_scale='2';s.eevee.use_fast_gi=True
s.render.resolution_x=WIDTH;s.render.resolution_y=HEIGHT;s.render.resolution_percentage=100;s.render.fps=FPS;s.frame_start=1;s.frame_end=N;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8';s.render.film_transparent=False
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=-.3
s.world=bpy.data.worlds.new('Calibrated photographic studio');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs['Color'].default_value=rgb('#bfc4bd');s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
font_regular=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial.ttf');font_bold=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial Bold.ttf');font_serif=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Times New Roman.ttf')
yellow=material('Citron yellow paper','#d3f600',.52,0,0,.05);black=material('Soft graphite pigment','#101511',.3,.1,.15,.035);ivory=material('Cotton white stock','#eeeee6',.61,0,0,.10);ink=material('Dense black ink','#030603',.83);foil=material('Anodised graphite foil','#151a15',.2,.85,.2);silver=material('Brushed aluminium','#b3b6ac',.22,.9,.15);floor=material('White cyclorama','#ddded5',.46,0,0,.025)
yellow.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=.17
ink.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=.08
graphite_paper=material('Uncoated graphite cover','#141a15',.73,0,0,.07)
graphite_paper.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=.16
box('Infinite photographic cyclorama',(200,200,.12),(0,0,-.06),floor,bevel=0)
root=empty('Cinematic assembly')
animated=[]
can=empty('FORMA coffee tin',(1.25,.48,-.005),root)
cylinder('Rolled aluminium base',1.21,.10,(0,0,.055),black,can)
hollow_tin('Open-walled coffee tin',1.185,2.65,.075,yellow,can)
torus('Bottom folded rim',1.181,.026,(0,0,.12),silver,can)
# Physical label printing conforms to cylindrical packaging rather than a flat billboard.
curved('FORMA','Can identity',.47,1.189,1.58,ink,can,center=.30,font=font_bold)
curved('COFFEE ROASTERS','Can descriptor',.071,1.190,1.26,ink,can,center=.30)
curved('PARMA / ITALIA','Origin',.060,1.191,.72,ink,can,center=.30)
curved('250 g','Package weight',.07,1.191,.52,ink,can,center=.30)
# Seam, lid lip, and recessed lid surface remain visibly distinct parts.
lid=empty('Precision lid assembly',(0,0,2.75),can);animated.append(lid)
cylinder('Graphite lid side',1.225,.14,(0,0,0),black,lid)
cylinder('Recessed lid top',1.175,.025,(0,0,.082),black,lid)
for j in range(4):torus(f'Spun lid ring {j}',1.16-j*.045,.006,(0,0,.100),silver if j==0 else black,lid)
text('f.','Lid foil signature',.93,(0,-.28,.104),silver,lid,font_serif,'CENTER',extrude=.002)
cards=empty('Printed identity cards',(-1.78,-.63,0),root)
lower=box('Lower white cotton card',(3.50,2.10,.045),(0,0,.0225),ivory,cards,.022);lower.rotation_euler.z=.10
for k in range(6):box(f'Visible stock edge {k}',(3.45,2.06,.006),(0,0,.048+k*.006),ivory,cards,.003)
card=empty('Hero graphite card',(0,-.06,.1085),cards);card.rotation_euler.z=-.08
box('Thick graphite card',(3.50,2.10,.055),(0,0,0),graphite_paper,card,.022)
text('FORMA','Card logotype',.53,(-1.46,.24,.030),yellow,card,font_bold,extrude=.001)
text('COFFEE ROASTERS','Card descriptor',.10,(-1.43,-.04,.031),ivory,card,font_regular)
text('UN’IDENTITÀ DA RICONOSCERE.','Card signature',.069,(-1.43,-.76,.031),ivory,card,font_regular)
text('01 / PARMA','Card index',.07,(1.42,-.76,.031),yellow,card,font_regular,'RIGHT')
# Embossed monogram card rises just enough to show thick stock and separates as a real item.
second=empty('Citron monogram card',(-1.65,1.60,.0325),root);animated.append(second)
box('Citron cotton card',(2.72,1.70,.065),(0,0,0),yellow,second,.02)
text('f.','Dimensional original signature',1.08,(0,-.36,.036),foil,second,font_serif,'CENTER',extrude=.026)
text('FORMA / IDENTITÀ','Monogram caption',.076,(0,-.65,.036),ink,second,font_regular,'CENTER')
if a.profile=='mobile':
 for ob in [second]+list(second.children_recursive):ob.hide_render=True
target=(-.1,.15,1.15)
key=area('Moving soft key',(-3,-6,8),1250,5,target,7,'#fff8e8');area('Long cool edge',(6,0,6),1100,2.5,(1,.4,1.8),5,'#f1f6ff');area('Top fill',(-1,5,8),1100,6,target,5)
# The only hero: an identity applied to a real package and thick printed stock.
cd=bpy.data.cameras.new('Cinematic 65mm lens');cam=bpy.data.objects.new('Cinematic camera',cd);s.collection.objects.link(cam);s.camera=cam
cd.lens=65;cd.clip_start=.05;cd.clip_end=300;cd.dof.use_dof=True;cd.dof.aperture_fstop=9.5
focus=empty('Focus plane',target);cd.dof.focus_object=focus
if 'Anisotropic IOR Level' in silver.node_tree.nodes['Principled BSDF'].inputs:
 silver.node_tree.nodes['Principled BSDF'].inputs['Anisotropic IOR Level'].default_value=.3
if hasattr(s.render,'use_motion_blur'):
 s.render.use_motion_blur=True;s.render.motion_blur_shutter=.25

# Quintic minimum-jerk timing: zero velocity and acceleration at each settled phase.
def smooth(x):
 x=max(0,min(1,x));return x*x*x*(10+x*(-15+6*x))
def window(t,start,rise,end,fall):return smooth((t-start)/rise)*(1-smooth((t-end)/fall))
def pose(frame):
 s.frame_set(frame);t=(frame-1)/FPS
 lid_reveal=window(t,.55,1.15,4.35,1.0)
 signature_reveal=window(t,1.60,.90,3.65,1.0)
 camera_arc=window(t,.25,2.0,3.70,1.80)
 reflection=window(t,.40,2.1,3.70,1.75)
 if a.profile=='mobile':
  can.location=(.53,1.12,-.005);cards.location=(-.10,-1.36,0)
  centre=Vector((-.02,.02,1.05));offset=Vector((5.9,-11.6,9.25))-centre;theta=.085*camera_arc
 else:
  centre=Vector(target)+Vector((0,0,.15));offset=Vector((7.8,-13.0,8.6))-centre;theta=.10*camera_arc
 cos,sin=math.cos(theta),math.sin(theta)
 cam.location=centre+Vector((offset.x*cos-offset.y*sin,offset.x*sin+offset.y*cos,offset.z+.10*camera_arc));aim(cam,centre)
 lid.location=(0,0,2.75+.72*lid_reveal);lid.rotation_euler=(.028*lid_reveal,0,.09*lid_reveal)
 second.location=(-1.65-.20*signature_reveal,1.6+.05*signature_reveal,.0325+.47*signature_reveal)
 second.rotation_euler=(.035*signature_reveal,-.06*signature_reveal,-.04+.04*signature_reveal)
 root.rotation_euler=(0,0,0)
 key.location=(-3.5+1.45*reflection,-6+.15*reflection,8);aim(key,target)

for f in range(1,N+2):
 pose(f)
 for ob in [cam,root,key]+animated:
  ob.keyframe_insert('location',frame=f);ob.keyframe_insert('rotation_euler',frame=f)
for ob in [cam,root,key]+animated:
 if ob.animation_data and ob.animation_data.action:
  for layer in ob.animation_data.action.layers:
   for strip in layer.strips:
    try:
     bag=strip.channelbag(ob.animation_data.action_slot)
     for fc in bag.fcurves:
      for k in fc.keyframe_points:k.interpolation='LINEAR'
    except Exception:pass
pose(1);master=folder/f'motion-brand{SUFFIX}.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master))

def box_overlap(a,b):
 def obb(o):
  lo=Vector(tuple(min(v[i]for v in o.bound_box)for i in range(3)));hi=Vector(tuple(max(v[i]for v in o.bound_box)for i in range(3)))
  basis=[o.matrix_world.to_3x3().col[i].normalized()for i in range(3)];half=[(hi[i]-lo[i])*.5*o.matrix_world.to_3x3().col[i].length for i in range(3)]
  return o.matrix_world@((hi+lo)*.5),basis,half
 ca,aa,ha=obb(a);cb,ab,hb=obb(b);delta=cb-ca
 axes=aa+ab+[x.cross(y)for x in aa for y in ab];minimum=100
 for axis in axes:
  if axis.length<.000001:continue
  axis.normalize();extent=sum(h*abs(v.dot(axis))for h,v in zip(ha,aa))+sum(h*abs(v.dot(axis))for h,v in zip(hb,ab));margin=extent-abs(delta.dot(axis))
  if margin<-.00001:return False
  minimum=min(minimum,margin)
 return minimum>.00005

# Every native pose must keep the package, lid and paper inside the camera and separate.
def preflight(scene):
 watched=[o for o in scene.objects if o.animation_data]
 poses={};bounds=[1.,1.,1.,1.];clearance=100
 for f in range(1,N+2):
  scene.frame_set(f);bpy.context.view_layer.update()
  if f in [1,49,145,241,N+1]:poses[f]=[[v for row in o.matrix_world for v in row]for o in watched]
  if f>N:continue
  clearance=min(clearance,paper_clearance(scene))
  if a.profile=='desktop':
   secondary=scene.objects['Citron cotton card']
   for name in ['Lower white cotton card','Thick graphite card']+[f'Visible stock edge {i}'for i in range(6)]:assert not box_overlap(secondary,scene.objects[name]),('Paper-paper intersection',f,name)
  for ob in scene.objects:
   if ob.type not in {'MESH','FONT'}or ob.name=='Infinite photographic cyclorama'or ob.hide_render or(ob.type=='FONT'and not ob.data.body.strip()):continue
   points=[world_to_camera_view(scene,scene.camera,ob.matrix_world@Vector(c))for c in ob.bound_box]
   margins=[min(v.x for v in points),min(1-v.x for v in points),min(v.y for v in points),min(1-v.y for v in points)]
   if min(margins)<.025:
    ev=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh();points=[world_to_camera_view(scene,scene.camera,ev.matrix_world@v.co)for v in me.vertices]
    margins=[min(v.x for v in points),min(1-v.x for v in points),min(v.y for v in points),min(1-v.y for v in points)];ev.to_mesh_clear()
   bounds=[min(x,y)for x,y in zip(bounds,margins)]
 delta=lambda u,v:max(abs(x-y)for m,n in zip(poses[u],poses[v])for x,y in zip(m,n))
 closure=delta(1,N+1);change=max(delta(1,f)for f in[49,145,241])
 assert min(bounds)>.015,('Unsafe framing',bounds)
 assert clearance>=0,('Paper/tin collision',clearance)
 assert closure<.0001 and change>.3,('Motion failure',closure,change)
 scene.frame_set(1);bpy.context.view_layer.update()
 floor=scene.objects['Infinite photographic cyclorama'];top=max((floor.matrix_world@Vector(v)).z for v in floor.bound_box)
 contacts={name:min((scene.objects[name].matrix_world@Vector(v)).z for v in scene.objects[name].bound_box)-top for name in['Rolled aluminium base','Lower white cotton card']+(['Citron cotton card']if a.profile=='desktop'else[])}
 assert max(abs(v)for v in contacts.values())<.0001,contacts
 # Paper stock is physically stacked at the first held pose, not levitating.
 paper=scene.objects['Thick graphite card'];under=scene.objects['Visible stock edge 5']
 gap=min((paper.matrix_world@Vector(v)).z for v in paper.bound_box)-max((under.matrix_world@Vector(v)).z for v in under.bound_box)
 assert abs(gap)<.0001,('Unseated graphite card',gap)
 report={'all_pose_count':N,'safe_margins':bounds,'minimum_paper_to_tin_clearance':clearance,'periodic_transform_error':closure,'observed_transform_change':change,'ground_contact_gaps':contacts,'graphite_card_to_stock_gap':gap,'paper_paper_intersections':0,'passed':True}
 (folder/'scene-check.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True);return report

check=preflight(s)
if a.mode=='validate':sys.exit(0)
if a.mode in ['proof','nativeproof']:
 frames=[1,145,288];out=folder/'native-proof';out.mkdir(exist_ok=True)
 if a.mode=='proof':s.render.resolution_percentage=50
else:
 frames=range(int(a.frames.split(':')[0]),int(a.frames.split(':')[1])+1);out=folder/'frames';out.mkdir(exist_ok=True)
if a.mode=='encode':
 # Reimport the saved editable master before looking at final frame pixels.
 bpy.ops.wm.open_mainfile(filepath=str(master));s=bpy.context.scene;check=preflight(s)
 final_film=ROOT/'public/films'/f'motion-brand{SUFFIX}.mp4';final_poster=ROOT/'public/images'/f'motion-brand{SUFFIX}.jpg'
 film=folder/f'motion-brand{SUFFIX}-checked.mp4';poster=folder/f'motion-brand{SUFFIX}-poster.jpg'
 subprocess.run(['ffmpeg','-v','error','-y','-framerate',str(FPS),'-i',str(folder/'frames/%04d.png'),'-frames:v',str(N),'-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-c:v','libx264','-threads','4','-preset','slow','-crf','18','-profile:v','high','-level','4.2'if a.profile=='desktop'else'4.1','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-g','96','-movflags','+faststart','-an',str(film)],check=True)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(folder/'frames/0001.png'),'-frames:v','1','-q:v','2',str(poster)],check=True)
 subprocess.run(['ffmpeg','-v','error','-i',str(film),'-f','null','-'],check=True)
 pixels=json.loads(subprocess.check_output(['python3',str(ROOT/'scripts/motion-20261104-pixels.py'),str(folder),str(film)],text=True))
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(film)],text=True));probe['format']['filename']=str(final_film.relative_to(ROOT));v=probe['streams'][0]
 assert(v['width'],v['height'])==(WIDTH,HEIGHT)and v['r_frame_rate']=='48/1'and int(v['nb_frames'])==N and float(probe['format']['duration'])==6
 data=film.read_bytes();atoms={};pos=0
 while pos+8<=len(data):
  size,typ=struct.unpack('>I4s',data[pos:pos+8]);atoms[typ.decode('ascii',errors='replace')]=pos
  if size==1:size=struct.unpack('>Q',data[pos+8:pos+16])[0]
  if size<8:break
  pos+=size
 assert atoms['moov']<atoms['mdat']
 film.replace(final_film);poster.replace(final_poster);film=final_film;poster=final_poster
 report={'profile':a.profile,'master':str(master.relative_to(ROOT)),'master_sha256':sha(master),'master_reimport':'passed','native':[WIDTH,HEIGHT],'fps':FPS,'frames':N,'duration':6,'upscaled':False,'optical_interpolation':False,'motion':'Authored minimum-jerk lid/card sequence, slow camera arc and photographic reflection sweep; deliberate assembled holds','engine':s.render.engine,'blender':bpy.app.version_string,'samples':a.samples,'gi_ray_resolution_scale':s.eevee.ray_tracing_options.resolution_scale,'preflight':check,'pixels':pixels,'full_decode':'passed','faststart':atoms,'probe':probe,'assets':[{'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':sha(p)}for p in[film,poster]]}
 (folder/'validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True);sys.exit(0)
metrics=[]
for f in frames:
 path=out/f'{f:04}.png'
 if path.exists()and a.mode=='render':continue
 s.frame_set(f);bpy.context.view_layer.update();s.render.filepath=str(path);started=time.monotonic();bpy.ops.render.render(write_still=True);record={'frame':f,'seconds':time.monotonic()-started};metrics.append(record);print(json.dumps(record),flush=True)
(folder/f'{a.mode}-metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
