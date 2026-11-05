"""Original CACAO / ATELIER rigid chocolate box, materials and authored 48 fps motion.
Standalone Blender background renderer. No downloaded geometry or texture assets.
"""
import argparse,bpy,hashlib,json,math,subprocess,sys,time,struct
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'outputs/showcase-brand-20261105'
p=argparse.ArgumentParser();p.add_argument('--profile',choices=['desktop','mobile'],default='desktop');p.add_argument('--mode',choices=['proof','nativeproof','render','encode','validate'],default='proof');p.add_argument('--samples',type=int,default=48);p.add_argument('--frames',default='1:288');a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
folder=OUT/a.profile;folder.mkdir(parents=True,exist_ok=True);N=288;FPS=48
W,H=(1920,1080)if a.profile=='desktop'else(720,900);suffix=''if a.profile=='desktop'else'-mobile'
def sha(f):return hashlib.sha256(f.read_bytes()).hexdigest()
def rgb(v):
 q=[int(v.lstrip('#')[i:i+2],16)/255 for i in[0,2,4]]
 return tuple(x/12.92 if x<=.04045 else((x+.055)/1.055)**2.4 for x in q)+(1,)
def mat(name,color,rough=.4,metal=0,coat=0,micro=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;b=n['Principled BSDF'];b.inputs['Base Color'].default_value=rgb(color);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal;b.inputs['Coat Weight'].default_value=coat
 if micro:
  no=n.new('ShaderNodeTexNoise');no.inputs['Scale'].default_value=180;no.inputs['Detail'].default_value=2;bu=n.new('ShaderNodeBump');bu.inputs['Strength'].default_value=micro;bu.inputs['Distance'].default_value=.0025;l.new(no.outputs['Fac'],bu.inputs['Height']);l.new(bu.outputs['Normal'],b.inputs['Normal'])
 return m
def empty(name,pos=(0,0,0),parent=None):
 o=bpy.data.objects.new(name,None);s.collection.objects.link(o);o.location=pos;o.parent=parent;return o
def box(name,dims,pos,m,parent=None,bevel=.03):
 bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.name=name;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mo=o.modifiers.new('Crafted edge bevel','BEVEL');mo.width=bevel;mo.segments=5;mo.affect='EDGES';bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mo.name)
  for face in o.data.polygons:face.use_smooth=True
  mo=o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL');mo.keep_sharp=True
 o.location=pos;o.parent=parent;o.data.materials.append(m);return o
def line(name,points,radius,m,parent=None):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=12;c.bevel_depth=radius;c.bevel_resolution=3;sp=c.splines.new('POLY');sp.points.add(len(points)-1)
 for v,point in zip(sp.points,points):v.co=(*point,1)
 ob=bpy.data.objects.new(name,c);s.collection.objects.link(ob);ob.parent=parent;ob.data.materials.append(m);return ob
def txt(body,name,size,pos,m,parent=None,font=None,rot=(0,0,0),align='CENTER',extrude=.0007):
 c=bpy.data.curves.new(name,'FONT');c.body=body;c.font=font or regular;c.size=size;c.align_x=align;c.space_character=1.12;c.extrude=extrude;c.bevel_depth=.0002;c.bevel_resolution=2;c.resolution_u=12;o=bpy.data.objects.new(name,c);s.collection.objects.link(o);o.location=pos;o.rotation_euler=rot;o.parent=parent;o.data.materials.append(m);return o
def aim(o,t):o.rotation_euler=(Vector(t)-o.location).to_track_quat('-Z','Y').to_euler()
def area(name,pos,power,width,height,target,color):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='RECTANGLE';d.size=width;d.size_y=height;d.color=rgb(color)[:3];o=bpy.data.objects.new(name,d);s.collection.objects.link(o);o.location=pos;aim(o,target);return o
bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.eevee.taa_render_samples=a.samples;s.eevee.use_raytracing=True;s.eevee.ray_tracing_options.resolution_scale='2';s.eevee.use_fast_gi=True
s.render.resolution_x=W;s.render.resolution_y=H;s.render.resolution_percentage=100;s.render.fps=FPS;s.frame_start=1;s.frame_end=N;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8';s.render.film_transparent=False
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=-.15
s.world=bpy.data.worlds.new('Neutral product photography environment');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs['Color'].default_value=rgb('#d9d6c9');s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
regular=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial.ttf');bold=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial Bold.ttf')
yellow=mat('Citron coated outer board','#dfed25',.43,0,.12,.045);dark=mat('Dense charcoal rigid paper','#121714',.63,0,0,.09);ink=mat('Dense graphite printed ink','#101511',.74);gold=mat('Satin champagne foil','#bb9858',.29,.85,.16);warm=mat('Warm ivory cotton paper','#eee9d8',.62,0,0,.1);floor=mat('Warm photographic cyclorama','#deddd4',.48,0,0,.02)
chocolates=[mat('Dark chocolate 78 percent','#321b14',.28,0,.24,.025),mat('Milk chocolate 45 percent','#6c3b22',.31,0,.22,.025),mat('Blond caramel chocolate','#a66d36',.34,0,.20,.025)]
traymat=mat('Moulded warm black tray','#181710',.52,0,.12,.04)
box('Infinite photographic floor',(200,200,.10),(0,0,-.05),floor,bevel=0)
root=empty('CACAO rigid box assembly');root.rotation_euler.z=-.08
# The actual rigid box: bottom and separate walls, no monolithic solid obscuring contents.
box('Rigid base bottom',(4.84,3.34,.18),(0,0,.09),dark,root,.035)
for name,dims,pos in [('Front wall',(4.84,.13,.72),(0,-1.605,.54)),('Rear wall',(4.84,.13,.72),(0,1.605,.54)),('Left wall',(.13,3.08,.72),(-2.355,0,.54)),('Right wall',(.13,3.08,.72),(2.355,0,.54))]:box(name,dims,pos,dark,root,.022)
# Two hairline foil rules on front wall, product and brand immediately legible.
box('Front foil line',(4.40,.008,.012),(0,-1.674,.37),gold,root,.004)
txt('CACAO', 'Front foil wordmark',.29,(0,-1.674,.56),gold,root,bold,(math.pi/2,0,0),extrude=.0003)
# Tray under all six chocolates, fine cell separators are structural, not floating scenery.
box('Recessed tray bottom',(4.49,2.99,.09),(0,0,.225),traymat,root,.055)
for x in[-.76,.76]:box('Tray vertical divider',(.044,2.96,.28),(x,0,.41),traymat,root,.012)
box('Tray horizontal divider',(4.45,.044,.28),(0,0,.41),traymat,root,.012)
# Hero content: each piece is an actual four-section tablet with small glossy bevels.
hero=None;tablets=[]
for row in range(2):
 for col in range(3):
  x=(col-1)*1.49;y=(row-.5)*1.45;piece=empty(f'Chocolate {row}-{col}',(x,y,.315),root);tablets.append(piece);m=chocolates[(row+col)%3]
  box(f'Tablet foundation {row}-{col}',(1.31,1.25,.15),(0,0,.075),m,piece,.065)
  for iy in[-1,1]:
   for ix in[-1,1]:
    ox=ix*.31;oy=iy*.295;box(f'Section {row}-{col}-{ix}-{iy}',(.59,.56,.19),(ox,oy,.205),m,piece,.075)
    # Embossed cacao-leaf mark as restrained raised geometry on every pillow.
    for k in[-1,1]:line(f'Leaf detail {row}-{col}-{ix}-{iy}-{k}',[(ox,oy-.12,.305),(ox+k*.055,oy-.035,.307),(ox+k*.07,oy+.045,.307),(ox,oy+.13,.305)],.006,m,piece)
  if row==0 and col==1:hero=piece
# Back hinge: attached lid rotates out of the chocolate volume, with a deliberate clearance.
hinge=empty('Physical rear lid hinge',(0,1.67,1.025),root)
box('Citron rigid lid',(4.94,3.42,.19),(0,-1.71,.0),yellow,hinge,.045)
box('Charcoal interior liner',(4.70,3.18,.022),(0,-1.71,-.107),dark,hinge,.018)
# Outer wordmark, foil border and colour establish a complete restrained identity.
txt('CACAO','Outer main wordmark',.80,(0,-1.73,.103),ink,hinge,bold,extrude=.001)
txt('A T E L I E R','Outer secondary wordmark',.16,(0,-2.13,.103),ink,hinge,regular,extrude=.0003)

# Foil cartouche uses slender physical curves, not an image painted over the product.
for yy in[-.45,-3.0]:line('Lid foil horizontal', [(-2.12,yy,.103),(2.12,yy,.103)],.006,gold,hinge)
for xx in[-2.12,2.12]:line('Lid foil vertical', [(xx,-.45,.103),(xx,-3.,.103)],.006,gold,hinge)
# Interior imprint faces the camera when open. Embossed radiating cacao leaf above the name.
txt('CACAO','Inner main wordmark',.54,(0,-1.50,-.123),gold,hinge,bold,(math.pi,0,0),extrude=.001)
txt('ATELIER','Inner signature',.14,(0,-1.16,-.123),gold,hinge,regular,(math.pi,0,0))
for side in[-1,1]:
 for j in range(4):
  y=-2.6+j*.22;line(f'Inside cacao vein {side}-{j}',[(0,y-.13,-.123),(side*.28,y+.0,-.123),(side*.46,y+.28,-.123)],.007,gold,hinge)
line('Inside central leaf vein',[(0,-2.79,-.123),(0,-1.72,-.123)],.009,gold,hinge)
key=area('Travelling tall softbox',(-4,-5,8),1400,4,7,(0,0,1),'#fff5dc');area('Cool right strip',(5,2,6),950,2,6,(0,0,1),'#e8f0ff');area('Top bounce',(-2,6,8),1100,5,5,(0,0,1),'#ffffff')
cd=bpy.data.cameras.new('Calibrated product photography lens');cam=bpy.data.objects.new('Slow photographic camera',cd);s.collection.objects.link(cam);s.camera=cam;cd.lens=55 if a.profile=='desktop' else 70;cd.clip_start=.05;cd.clip_end=300;cd.dof.use_dof=True;cd.dof.aperture_fstop=11
focus=empty('Focus on chocolate and identity',(0,0,.9));cd.dof.focus_object=focus
if hasattr(s.render,'use_motion_blur'):s.render.use_motion_blur=True;s.render.motion_blur_shutter=.22

def smooth(v):
 v=max(0,min(1,v));return v*v*v*(10+v*(-15+6*v))
def window(t,start,rise,end,fall):return smooth((t-start)/rise)*(1-smooth((t-end)/fall))
def pose(f):
 s.frame_set(f);t=(f-1)/FPS;opening=window(t,.40,1.40,4.15,1.25);detail=window(t,1.92,.8,3.25,.75);arc=window(t,.20,2.0,3.70,1.8)
 hinge.rotation_euler.x=-math.radians(106)*opening
 hero.location=(0,-.725,.315+.50*detail);hero.rotation_euler=(math.radians(8)*detail,math.radians(-9)*detail,math.radians(-5)*detail)
 centre=Vector((0,.2,1.0+.85*opening))
 offset=Vector((8.0,-15.4,12.1))if a.profile=='desktop'else Vector((7.02,-14.30,11.635))
 theta=.065*arc;co,si=math.cos(theta),math.sin(theta);cam.location=centre+Vector((offset.x*co-offset.y*si,offset.x*si+offset.y*co,offset.z));aim(cam,centre)
 key.location=(-4+1.2*arc,-5,8);aim(key,(0,0,1))
for f in range(1,N+2):
 pose(f)
 for ob in[hinge,hero,cam,key]:ob.keyframe_insert('location',frame=f);ob.keyframe_insert('rotation_euler',frame=f)
for ob in[hinge,hero,cam,key]:
 if ob.animation_data and ob.animation_data.action:
  for layer in ob.animation_data.action.layers:
   for strip in layer.strips:
    try:
     for fc in strip.channelbag(ob.animation_data.action_slot).fcurves:
      for keyframe in fc.keyframe_points:keyframe.interpolation='LINEAR'
    except Exception:pass
pose(1);master=folder/f'showcase-brand{suffix}.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master))
def obb_overlap(ca,aa,ha,cb,ab,hb):
 delta=cb-ca
 for ax in aa+ab+[x.cross(y)for x in aa for y in ab]:
  if ax.length<.000001:continue
  ax.normalize();r=sum(h*abs(v.dot(ax))for h,v in zip(ha,aa))+sum(h*abs(v.dot(ax))for h,v in zip(hb,ab))
  if r-abs(delta.dot(ax))<.00001:return False
 return True
def box_obb(ob):
 lo=Vector(tuple(min(v[i]for v in ob.bound_box)for i in range(3)));hi=Vector(tuple(max(v[i]for v in ob.bound_box)for i in range(3)));matrix=ob.matrix_world
 return matrix@((lo+hi)*.5),[matrix.to_3x3().col[i].normalized()for i in range(3)],[(hi[i]-lo[i])*.5*matrix.to_3x3().col[i].length for i in range(3)]
def tablet_obb(ob):
 matrix=ob.matrix_world
 return matrix@Vector((0,0,.15)),[matrix.to_3x3().col[i].normalized()for i in range(3)],[.655,.625,.15]
def preflight(scene):
 cam=scene.camera;hinge=scene.objects['Physical rear lid hinge'];hero=scene.objects['Chocolate 0-1'];key=scene.objects['Travelling tall softbox'];tablets=[scene.objects[f'Chocolate {row}-{col}']for row in range(2)for col in range(3)]
 bounds=[1,1,1,1];saved={};watched=[hinge,hero,cam,key]
 for f in range(1,N+2):
  scene.frame_set(f);bpy.context.view_layer.update()
  if f in[1,145,N+1]:saved[f]=[[v for row in ob.matrix_world for v in row]for ob in watched]
  for ob in scene.objects:
   if ob.type not in{'MESH','FONT','CURVE'}or ob.hide_render or ob.name=='Infinite photographic floor':continue
   pts=[world_to_camera_view(scene,cam,ob.matrix_world@Vector(c))for c in ob.bound_box]
   margins=[min(v.x for v in pts),min(1-v.x for v in pts),min(v.y for v in pts),min(1-v.y for v in pts)];bounds=[min(x,y)for x,y in zip(bounds,margins)]
  for lidname in['Citron rigid lid','Charcoal interior liner']:
   for wallname in['Front wall','Rear wall','Left wall','Right wall']:
    assert not obb_overlap(*box_obb(scene.objects[lidname]),*box_obb(scene.objects[wallname])),('Lid/wall overlap',f,lidname,wallname)
  for i,first in enumerate(tablets):
   for second in tablets[i+1:]:assert not obb_overlap(*tablet_obb(first),*tablet_obb(second)),('Tablet collision',f,first.name,second.name)
  # Lifted front-centre tablet is kept within its own cell; never contacts lid or neighbours.
  assert hero.location.z>=.315-1e-6 and abs(hero.location.x)<1e-7
  assert abs(hero.rotation_euler.x)<=math.radians(8)+1e-6 and abs(hero.rotation_euler.y)<=math.radians(9)+1e-6
 def delta(x,y):return max(abs(m-n)for u,v in zip(saved[x],saved[y])for m,n in zip(u,v))
 assert min(bounds)>.018,('Framing margin',bounds)
 assert delta(1,N+1)<1e-5 and delta(1,145)>.4
 # Grounded physical box; non-zero air gaps are not used to hide intersections.
 scene.frame_set(1);bpy.context.view_layer.update();base=scene.objects['Rigid base bottom'];ground=min((base.matrix_world@Vector(c)).z for c in base.bound_box)
 assert abs(ground)<1e-6
 report={'passed':True,'all_poses':N+1,'safe_margins':bounds,'loop_transform_error':delta(1,N+1),'transform_change':delta(1,145),'base_ground_contact':ground,'lid_wall_obb_intersections':0,'tablet_tablet_obb_intersections':0,'construction':'Separate rigid walls, bottom, hinged lid and six moulded tablets with foil typography; hero lift stays in its own front-centre cell. Intentional container/tray structural contacts.'}
 (folder/'scene-check.json').write_text(json.dumps(report,indent=2)+'\n');scene.frame_set(1);return report
check=preflight(s)
if a.mode=='validate':print(json.dumps(check));sys.exit(0)
if a.mode in['proof','nativeproof']:
 frames=[1,145,288];output=folder/'native-proof';output.mkdir(exist_ok=True)
 if a.mode=='proof':s.render.resolution_percentage=50
else:
 output=folder/'frames';output.mkdir(exist_ok=True);frames=range(int(a.frames.split(':')[0]),int(a.frames.split(':')[1])+1)
if a.mode=='encode':
 bpy.ops.wm.open_mainfile(filepath=str(master));s=bpy.context.scene;check=preflight(s)
 film=folder/f'showcase-brand{suffix}-checked.mp4';poster=folder/f'showcase-brand{suffix}-poster.jpg'
 subprocess.run(['ffmpeg','-v','error','-y','-framerate',str(FPS),'-i',str(folder/'frames/%04d.png'),'-frames:v',str(N),'-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-c:v','libx264','-threads','4','-preset','slow','-crf','18','-profile:v','high','-level','4.2'if a.profile=='desktop'else'4.1','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-g','96','-movflags','+faststart','-an',str(film)],check=True)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(folder/'frames/0145.png'),'-frames:v','1','-q:v','2',str(poster)],check=True)
 subprocess.run(['ffmpeg','-v','error','-i',str(film),'-f','null','-'],check=True)
 pixels=json.loads(subprocess.check_output(['python3',str(ROOT/'scripts/showcase-brand-20261105-pixels.py'),str(folder),str(film)],text=True));probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(film)],text=True));v=probe['streams'][0]
 assert(v['width'],v['height'])==(W,H)and v['r_frame_rate']=='48/1'and int(v['nb_frames'])==N and float(probe['format']['duration'])==6
 data=film.read_bytes();atoms={};pos=0
 while pos+8<=len(data):
  size,typ=struct.unpack('>I4s',data[pos:pos+8]);atoms[typ.decode('ascii',errors='replace')]=pos
  if size==1:size=struct.unpack('>Q',data[pos+8:pos+16])[0]
  if size<8:break
  pos+=size
 assert atoms['moov']<atoms['mdat']
 final=ROOT/'public/films'/f'showcase-brand{suffix}.mp4';finalposter=ROOT/'public/images'/f'showcase-brand{suffix}.jpg';film.replace(final);poster.replace(finalposter);probe['format']['filename']=str(final.relative_to(ROOT))
 report={'profile':a.profile,'master':str(master.relative_to(ROOT)),'master_sha256':sha(master),'master_reimport':'passed','native_dimensions':[W,H],'fps':FPS,'frames':N,'duration_seconds':6,'upscaled':False,'synthetic_interpolation':False,'engine':s.render.engine,'blender':bpy.app.version_string,'samples':a.samples,'gi_ray_resolution_scale':s.eevee.ray_tracing_options.resolution_scale,'preflight':check,'pixel_validation':pixels,'full_decode':'passed','atoms':atoms,'probe':probe,'assets':[{'path':str(f.relative_to(ROOT)),'bytes':f.stat().st_size,'sha256':sha(f)}for f in[final,finalposter]]};(folder/'validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));sys.exit(0)
metrics=[]
for f in frames:
 path=output/f'{f:04}.png'
 if path.exists()and a.mode=='render':continue
 s.frame_set(f);bpy.context.view_layer.update();s.render.filepath=str(path);started=time.monotonic();bpy.ops.render.render(write_still=True);record={'frame':f,'seconds':time.monotonic()-started};metrics.append(record);print(json.dumps(record),flush=True)
(folder/f'{a.mode}-metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
