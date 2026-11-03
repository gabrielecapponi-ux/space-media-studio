"""Original service cinema: paper/identity and layered responsive web.

Run in an isolated Blender process, never against an open user's scene.
Native renders/masters/metrics stay in outputs/motion-services/a; only compressed
films and posters are shipped. These are 3D-authored concept films, not clients.
"""
import argparse, bpy, hashlib, json, math, subprocess, sys, time
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'outputs/motion-services/a'
p=argparse.ArgumentParser();p.add_argument('--scene',choices=['brand','web'],required=True);p.add_argument('--mode',choices=['build','proof','render','encode'],default='proof');p.add_argument('--samples',type=int,default=48);p.add_argument('--frames',default='1:72')
a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
folder=OUT/a.scene;folder.mkdir(parents=True,exist_ok=True);N=72

def available_gib():
 try:
  raw=subprocess.check_output(['vm_stat'],text=True);page=int(raw.split('page size of ')[1].split(' bytes')[0]);counts={}
  for line in raw.splitlines()[1:]:
   if ':' in line:
    k,v=line.split(':',1)
    try:counts[k]=int(v.strip().strip('.'))
    except ValueError:pass
  return sum(counts.get(k,0) for k in ['Pages free','Pages inactive','Pages speculative'])*page/1024**3
 except Exception:return None

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
if a.mode=='encode':
 bpy.ops.wm.open_mainfile(filepath=str(folder/f'service-{a.scene}-master.blend'))
 s=bpy.context.scene;watched=[o for o in s.objects if o.animation_data]
 states={}
 for f in [1,19,37,55,73]:
  s.frame_set(f);bpy.context.view_layer.update();states[f]=[[v for row in o.matrix_world for v in row] for o in watched]
 delta=lambda one,two:max(abs(x-y) for mat1,mat2 in zip(states[one],states[two]) for x,y in zip(mat1,mat2))
 closure=delta(1,73);motion=max(delta(1,f) for f in [19,37,55]);assert closure<.0001 and motion>.03,(closure,motion)
 missing=[f for f in range(1,N+1) if not (folder/'frames'/f'{f:04d}.png').exists()];assert not missing,missing
 film=ROOT/'public/films'/f'service-{a.scene}.mp4';poster=ROOT/'public/images'/f'service-{a.scene}.jpg'
 subprocess.run(['ffmpeg','-v','error','-y','-framerate','24','-i',str(folder/'frames/%04d.png'),'-frames:v',str(N),'-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-c:v','libx264','-threads','4','-preset','slow','-crf','18','-profile:v','high','-level','4.1','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-g','48','-keyint_min','48','-movflags','+faststart','-an',str(film)],check=True)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(folder/'frames/0001.png'),'-q:v','2','-frames:v','1',str(poster)],check=True)
 subprocess.run(['ffmpeg','-v','error','-i',str(film),'-f','null','-'],check=True)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(film)],text=True))
 from bpy_extras.object_utils import world_to_camera_view
 geometry=[o for o in s.objects if o.type in {'MESH','FONT'} and o.name!='Photographic sweep']
 screen_bounds=[1.,1.,0.,0.]
 for f in range(1,N+1):
  s.frame_set(f);bpy.context.view_layer.update()
  for o in geometry:
   for corner in o.bound_box:
    v=world_to_camera_view(s,s.camera,o.matrix_world@Vector(corner));screen_bounds[0]=min(screen_bounds[0],v.x);screen_bounds[1]=min(screen_bounds[1],v.y);screen_bounds[2]=max(screen_bounds[2],v.x);screen_bounds[3]=max(screen_bounds[3],v.y)
 margins={'left':screen_bounds[0],'bottom':screen_bounds[1],'right':1-screen_bounds[2],'top':1-screen_bounds[3]}
 assert min(margins.values())>0, margins
 s.frame_set(1);bpy.context.view_layer.update()
 z_bounds=lambda ob:[(ob.matrix_world@Vector(corner)).z for corner in ob.bound_box]
 contacts={}
 if a.scene=='brand':
  floor_top=max(z_bounds(bpy.data.objects['Photographic sweep']))
  for name in ['Lower warm identity card','Cotton carton structure']:contacts[name]=min(z_bounds(bpy.data.objects[name]))-floor_top
  contacts['Foil to yellow board']=min(z_bounds(bpy.data.objects['F vertical foil']))-max(z_bounds(bpy.data.objects['Yellow cotton board']))
  assert max(abs(v) for v in contacts.values())<.00001, contacts
 info={'scene':a.scene,'ground_contact_gaps_scene_units':contacts,'reimport':'passed','animated_objects':[o.name for o in watched],'scene_objects':len(s.objects),'mesh_objects':sum(o.type=='MESH' for o in s.objects),'loop_transform_error':closure,'observed_transform_change':motion,'poses_checked':[1,19,37,55,73],'projected_safe_margins_all_72_poses':margins,'full_decode':'passed','film':{'path':str(film.relative_to(ROOT)),'bytes':film.stat().st_size,'sha256':sha(film)},'poster':{'path':str(poster.relative_to(ROOT)),'bytes':poster.stat().st_size,'sha256':sha(poster)},'ffprobe':probe}
 (folder/'validation.json').write_text(json.dumps(info,indent=2));print(json.dumps(info),flush=True);sys.exit(0)

def rgb(hex):
 h=hex.lstrip('#');v=[int(h[i:i+2],16)/255 for i in (0,2,4)]
 return tuple(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v)+(1,)

def mat(name,color,rough=.4,metal=0,coat=0,micro=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=rgb(color);n.inputs['Roughness'].default_value=rough;n.inputs['Metallic'].default_value=metal;n.inputs['Coat Weight'].default_value=coat;n.inputs['Coat Roughness'].default_value=.25
 if micro:
  nodes=m.node_tree.nodes;links=m.node_tree.links;noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=250;noise.inputs['Detail'].default_value=2;bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.17;bump.inputs['Distance'].default_value=.006;links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],n.inputs['Normal'])
 return m

def empty(name,loc=(0,0,0),rot=(0,0,0)):
 o=bpy.data.objects.new(name,None);s.collection.objects.link(o);o.location=loc;o.rotation_euler=rot;return o

def box(name,loc,scale,material,bevel=.02,parent=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0));o=bpy.context.object;o.name=name;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:
  m=o.modifiers.new('Precise edge radius','BEVEL');m.width=bevel;m.segments=4
  n=o.modifiers.new('Weighted face normals','WEIGHTED_NORMAL');n.keep_sharp=True
 o.location=loc
 if parent:o.parent=parent
 return o

def text(body,name,loc,size,material,parent=None,vertical=False,extrude=.001,font=None,align='LEFT'):
 c=bpy.data.curves.new(name,'FONT');c.body=body;c.font=font or regular;c.size=size;c.align_x=align;c.extrude=extrude;c.bevel_depth=.0007;c.bevel_resolution=2;c.resolution_u=12
 o=bpy.data.objects.new(name,c);s.collection.objects.link(o);o.location=loc
 if vertical:o.rotation_euler=(math.pi/2,0,0)
 o.data.materials.append(material)
 if parent:o.parent=parent
 return o

def aim(o,pt):o.rotation_euler=(Vector(pt)-o.location).to_track_quat('-Z','Y').to_euler()
def area(name,loc,power,size,size_y,target,color='#ffffff'):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='RECTANGLE';d.size=size;d.size_y=size_y;d.color=rgb(color)[:3];o=bpy.data.objects.new(name,d);s.collection.objects.link(o);o.location=loc;aim(o,target);return o

def photo(name,path,loc,w,h,parent):
 # Texture plane faces -Y. Explicit UVs keep source geometry separate from media.
 im=bpy.data.images.load(str(path),check_existing=True);im.pack();source_aspect=im.size[0]/im.size[1];target_aspect=w/h
 # A physical printed layout uses a cover crop, never stretches architecture.
 if target_aspect>source_aspect:
  span=source_aspect/target_aspect;u0,u1=0,1;v0,v1=(1-span)/2,(1+span)/2
 else:
  span=target_aspect/source_aspect;u0,u1=(1-span)/2,(1+span)/2;v0,v1=0,1
 mesh=bpy.data.meshes.new(name);mesh.from_pydata([(-w/2,0,-h/2),(w/2,0,-h/2),(w/2,0,h/2),(-w/2,0,h/2)],[],[(0,1,2,3)]);mesh.update();uv=mesh.uv_layers.new(name='Source UV')
 for li,coord in zip(mesh.polygons[0].loop_indices,[(u0,v0),(u1,v0),(u1,v1),(u0,v1)]):uv.data[li].uv=coord
 o=bpy.data.objects.new(name,mesh);s.collection.objects.link(o);o.parent=parent;o.location=loc
 m=mat(name+' matte ink','#ffffff',.6);tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;m.node_tree.links.new(tex.outputs['Color'],m.node_tree.nodes['Principled BSDF'].inputs['Base Color']);o.data.materials.append(m);return o

bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.eevee.taa_render_samples=a.samples;s.eevee.use_raytracing=True;s.eevee.ray_tracing_options.resolution_scale='2';s.eevee.use_fast_gi=True
s.render.resolution_x=1440;s.render.resolution_y=900;s.render.resolution_percentage=100;s.render.fps=24;s.frame_start=1;s.frame_end=N
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8';s.render.film_transparent=False
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=.2
s.world=bpy.data.worlds.new('Warm photographic studio');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs['Color'].default_value=rgb('#dad9cc');s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.4
ivory=mat('Warm uncoated stock','#eae8df',.58,micro=True);yellow=mat('Acid yellow ink on thick paper','#dfff00',.49,micro=True);ink=mat('Graphite pigment','#151a16',.36,coat=.08);muted=mat('Warm grey typography','#6e7468',.55);floor=mat('Seamless warm resin sweep','#d5d6ce',.48,micro=True);edge=mat('Paper edge fibres','#f5f0df',.67,micro=True)
regular=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial.ttf');bold=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial Bold.ttf')
box('Photographic sweep',(0,0,-.12),(200,200,.2),floor,0)
camdata=bpy.data.cameras.new('Cinematic 62mm lens');cam=bpy.data.objects.new('Cinematic camera',camdata);s.collection.objects.link(cam);s.camera=cam;camdata.lens=62;camdata.clip_start=.05;camdata.clip_end=300
camdata.dof.use_dof=True;camdata.dof.aperture_fstop=11;focus=empty('Focus plane');camdata.dof.focus_object=focus
key=area('Large silk key',(-5,-4,10),1800,7,5,(0,0,1),'#fff7df');area('Cool fill',(6,-1,7),1100,5,6,(0,0,1),'#edf4ff');sweep=area('Long reflected strip',(1,5,8),1500,3,7,(0,0,1),'#ffffff')
animated=[]
if a.scene=='brand':
 s.view_settings.exposure=0
 rig=empty('FORMA paper assembly',loc=(-.4,-.15,-.02),rot=(0,0,math.radians(-8)));animated.append(rig)
 box('Lower warm identity card',(-.24,.15,.025),(3.35,4.5,.05),ivory,.018,rig).rotation_euler.z=math.radians(15)
 base=box('Yellow cotton board',(0,0,.10),(3.35,4.5,.085),yellow,.025,rig)
 # Fine printer edge and a separate black foil monogram, assembled from three
 # typographic strokes. The lift follows assembly, not random orbital movement.
 marks=[]
 marks.append(box('F vertical foil',(-.67,.45,.18),(.38,1.75,.075),ink,.012,rig))
 marks.append(box('F upper foil',(.02,1.13,.18),(1.46,.38,.075),ink,.012,rig))
 marks.append(box('F middle foil',(-.12,.49,.18),(1.16,.32,.075),ink,.012,rig))
 text('FORMA','FORMA wordmark',(-1.27,-1.05,.145),.48,ink,rig,font=bold)
 text('TORREFAZIONE INDIPENDENTE','Small print',(-1.27,-1.40,.145),.097,ink,rig)
 text('PARMA   /   ITALIA','Regional imprint',(-1.27,-1.70,.145),.085,ink,rig)
 for x in [-1.27,1.27]:box('Registration crop', (x,1.86,.146),(.15,.012,.003),ink,.002,rig)
 # Tangible box with wrapped edges, foil lettering and tiny printed details.
 carton=empty('FORMA folding carton',(2.05,1.35,-.02),(0,0,math.radians(9)));animated.append(carton)
 box('Cotton carton structure',(0,0,1.38),(1.75,1.05,2.76),ink,.045,carton)
 box('Wrapped yellow front label',(0,-.533,1.58),(1.62,.012,1.98),yellow,.008,carton)
 text('FOR','Carton FOR',(-.66,-.548,1.88),.52,ink,carton,vertical=True,font=bold)
 text('MA.','Carton MA',(-.66,-.548,1.35),.52,ink,carton,vertical=True,font=bold)
 text('CAFFÈ / 250 G','Carton detail',(-.63,-.549,.85),.095,ink,carton,vertical=True)
 box('Carton upper fold',(0,0,2.769),(1.69,1.0,.018),ink,.012,carton)
 box('Gold seam line',(0,-.51,2.79),(1.5,.012,.008),yellow,.002,carton)
 focus.location=(.4,.4,.9)
 initial_marks=[o.location.copy() for o in marks]
 def pose(frame):
  phase=2*math.pi*(frame-1)/N;t=(1-math.cos(phase))/2;s.frame_set(frame)
  rig.location.z=-.02;rig.rotation_euler.z=math.radians(-8)
  for i,o in enumerate(marks):
   o.location=initial_marks[i]+Vector(([-.30,.30,.25][i]*t,[0,.22,-.24][i]*t,(.55+.075*i)*t));o.rotation_euler.z=math.radians([-6,7,-5][i])*t
  cam.location=(7.2+.35*math.sin(phase),-10.5,12.5+.15*math.cos(phase));aim(cam,(.45,.1,.9))
  sweep.location.x=1+.6*math.sin(phase);aim(sweep,(0,0,1))
 watched=[rig,*marks,cam,sweep]
else:
 camdata.lens=48
 # Every panel is a concrete page component with content and a paper-thin edge.
 # The same visual becomes a portrait layout, with no pretend device hardware.
 rig=empty('AVANT responsive assembly',loc=(-.45,.35,0),rot=(0,0,0));animated.append(rig)
 back=box('Project content back layer',(0,.35,2.55),(6.7,.055,4.25),ivory,.055,rig)
 body=box('Desktop page substrate',(0,0,2.4),(6.7,.085,4.25),ivory,.055,rig)
 text('AVANT','AVANT masthead',(-2.95,-.053,4.13),.20,ink,rig,vertical=True,font=bold)
 text('Progetti     Studio     Contatti','Navigation',(.90,-.053,4.15),.077,ink,rig,vertical=True)
 box('Navigation hairline',(0,-.057,3.98),(5.9,.006,.006),muted,.001,rig)
 text('Spazi da vivere.','Hero title',(-2.95,-.058,3.32),.47,ink,rig,vertical=True)
 text('ARCHITETTURA / LUCE / MATERIA','Hero small print',(-2.93,-.059,3.05),.068,muted,rig,vertical=True)
 art=photo('Desktop architectural photograph',ROOT/'public/images/launch-architecture.jpg',(0,-.064,1.86),5.90,1.98,rig)
 text('Casa nella luce / Progetto 01','Project caption',(-2.95,-.064,.62),.091,ink,rig,vertical=True)
 text('Esplora  +','Explore action',(2.10,-.064,.62),.085,ink,rig,vertical=True)
 phone=empty('AVANT portrait page',loc=(3.0,-.90,.12),rot=(0,0,math.radians(-3)))
 box('Portrait page substrate',(0,0,1.69),(1.76,.08,3.38),ivory,.047,phone)
 text('AVANT','Mobile masthead',(-.72,-.049,3.17),.145,ink,phone,vertical=True,font=bold)
 text('+','Mobile menu',(.61,-.049,3.16),.14,ink,phone,vertical=True)
 text('Luce.','Mobile title line1',(-.72,-.049,2.68),.29,ink,phone,vertical=True)
 text('Materia.','Mobile title line2',(-.72,-.049,2.37),.29,ink,phone,vertical=True)
 text('Spazio.','Mobile title line3',(-.72,-.049,2.06),.29,ink,phone,vertical=True)
 photo('Mobile architectural crop',ROOT/'public/images/launch-architecture.jpg',(0,-.054,1.22),1.42,1.18,phone)
 text('Casa nella luce','Mobile caption',(-.72,-.054,.46),.075,ink,phone,vertical=True)
 text('01 / PROGETTI','Mobile index',(-.72,-.054,.24),.059,muted,phone,vertical=True)
 # Subtle yellow axis on the back panel, the only accent in an ivory layout.
 box('Yellow responsive edge',(3.35,.34,2.54),(.016,.07,4.05),yellow,.004,rig)
 focus.location=(0,0,2.3)
 def pose(frame):
  phase=2*math.pi*(frame-1)/N;t=(1-math.cos(phase))/2;s.frame_set(frame)
  rig.rotation_euler.z=.018*math.sin(phase)
  back.location.y=.35+.60*t;back.location.z=2.55+.12*t
  art.location.y=-.064-.25*t
  phone.location.z=.12+.30*t;phone.location.x=3+.08*math.sin(phase);phone.rotation_euler.z=math.radians(-3)+.025*math.sin(phase)
  cam.location=(6.2+.40*math.sin(phase),-13.7,7.5+.12*math.cos(phase));aim(cam,(.45,0,2.20))
  sweep.location.x=1+.6*math.sin(phase);aim(sweep,(0,0,2))
 watched=[rig,back,art,phone,cam,sweep]

for f in range(1,N+2):
 pose(f)
 for o in watched:o.keyframe_insert('location',frame=f);o.keyframe_insert('rotation_euler',frame=f)
pose(1)
bpy.ops.wm.save_as_mainfile(filepath=str(folder/f'service-{a.scene}-master.blend'))
info={'scene':a.scene,'native_resolution':[1440,900],'fps':24,'frames':N,'duration_seconds':N/24,'blender':bpy.app.version_string,'engine':s.render.engine,'samples':a.samples,'source':'Original geometry, typography, PBR materials, lighting, camera and authored periodic animation; web includes an existing original AI architectural texture','font':'System Arial regular and bold rasterized in render, no font binaries distributed','master':str((folder/f'service-{a.scene}-master.blend').relative_to(ROOT)),'loop':'72 unique frames, 73rd transform matches first; no interpolation or reversed frames'}
(folder/'production.json').write_text(json.dumps(info,indent=2))
if a.mode=='build':sys.exit(0)
frames=[1,37,61] if a.mode=='proof' else range(int(a.frames.split(':')[0]),int(a.frames.split(':')[1])+1)
if a.mode=='proof':s.render.resolution_percentage=50
framesdir=folder/('proof' if a.mode=='proof' else 'frames');framesdir.mkdir(exist_ok=True)
started=time.monotonic();times=[]
for f in frames:
 path=framesdir/f'{f:04d}.png'
 if path.exists() and a.mode=='render':continue
 mem=available_gib()
 if mem is not None and mem<3:raise RuntimeError(f'Available memory below3GiB: {mem:.2f}')
 pose(f);s.render.filepath=str(path);begin=time.monotonic();bpy.ops.render.render(write_still=True);seconds=time.monotonic()-begin;times.append(seconds)
 print(json.dumps({'frame':f,'seconds':round(seconds,3),'available_gib_before':round(mem,2)if mem else None,'file':str(path)}),flush=True)
info.update(batch_seconds=round(time.monotonic()-started,3),rendered_frames=len(times),mean_frame_seconds=sum(times)/len(times) if times else None)
(folder/f'{a.mode}-metrics.json').write_text(json.dumps(info,indent=2))
