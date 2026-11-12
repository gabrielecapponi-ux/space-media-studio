"""CACAO cinema: original model, independent tablets, physical hinge, native loop."""
import argparse,bpy,hashlib,json,math,sys,time
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
P=Path(__file__).resolve().parents[2];O=P/'outputs/cacao-cinema-20261112';O.mkdir(exist_ok=True,parents=True)
p=argparse.ArgumentParser();p.add_argument('--profile',choices=['desktop','portrait'],default='desktop');p.add_argument('--mode',choices=['build','proof'],default='build');p.add_argument('--width',type=int,default=1280);p.add_argument('--samples',type=int,default=20);p.add_argument('--frames',default='1,181,301');p.add_argument('--macro',action='store_true');a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
source=P/'outputs/flagship-20261106/brand/desktop/brand-macro-desktop.blend';bpy.ops.wm.open_mainfile(filepath=str(source));s=bpy.context.scene
for ob in s.objects:ob.animation_data_clear()
s.animation_data_clear();U=.07;FPS=60 if a.profile=='desktop' else 30;N=FPS*8
s.render.engine='CYCLES';s.render.fps=FPS;s.frame_start=1;s.frame_end=N;s.render.resolution_x=a.width;s.render.resolution_y=round(a.width*9/16) if a.profile=='desktop' else round(a.width*5/4);s.render.resolution_percentage=100;s.unit_settings.system='METRIC';s.unit_settings.scale_length=1
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8';s.render.image_settings.compression=30;s.render.film_transparent=False;s.render.use_file_extension=True;s.render.use_persistent_data=True
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for dev in prefs.devices:dev.use=dev.type=='METAL'
s.cycles.device='GPU';s.cycles.samples=a.samples;s.cycles.seed=31;s.cycles.use_animated_seed=False;s.cycles.use_denoising=True;s.cycles.use_adaptive_sampling=True;s.cycles.adaptive_threshold=.035;s.cycles.max_bounces=7;s.cycles.diffuse_bounces=4;s.cycles.glossy_bounces=5;s.cycles.transmission_bounces=4;s.cycles.transparent_max_bounces=8
if hasattr(s.cycles,'denoising_use_gpu'):s.cycles.denoising_use_gpu=True
if hasattr(s.render,'use_motion_blur'):s.render.use_motion_blur=True;s.render.motion_blur_shutter=.22
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=.1
s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.25,.22,.19,1);s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.11

def rgb(h):
 v=[int(h[i:i+2],16)/255 for i in(1,3,5)];return tuple(x/12.92 if x<=.04045 else((x+.055)/1.055)**2.4 for x in v)+(1,)
def material(name,color=None,rough=None,metal=None):
 m=bpy.data.materials[name];b=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 if color:
  for link in list(b.inputs['Base Color'].links):m.node_tree.links.remove(link)
  b.inputs['Base Color'].default_value=rgb(color)
 if rough is not None:
  for link in list(b.inputs['Roughness'].links):m.node_tree.links.remove(link)
  b.inputs['Roughness'].default_value=rough
 if metal is not None:b.inputs['Metallic'].default_value=metal
 return m,b
material('Citron coated outer board','#713b2a',.47,0);material('Dense charcoal rigid paper','#48271e',.51,0);material('Satin champagne foil','#d7ba80',.24,.84)
material('Dense graphite printed ink','#17130f',.52,0);material('Moulded warm black tray','#15130f',.52,0);floor,_=material('Warm photographic cyclorama','#10100f',.58,0)
for name in ['Dark chocolate 78 percent','Milk chocolate 45 percent','Blond caramel chocolate']:
 m,b=material(name,rough=.34,metal=0);b.inputs['Coat Weight'].default_value=.055;b.inputs['Coat Roughness'].default_value=.26;b.inputs['Specular IOR Level'].default_value=.38
 # Restrained tempered-cocoa microstructure: broad roughness variance and micron relief.
 nt=m.node_tree;noise=nt.nodes.new('ShaderNodeTexNoise');noise.name='CINEMA cocoa temper roughness';noise.inputs['Scale'].default_value=55;noise.inputs['Detail'].default_value=2
 ramp=nt.nodes.new('ShaderNodeMapRange');ramp.inputs['From Min'].default_value=0;ramp.inputs['From Max'].default_value=1;ramp.inputs['To Min'].default_value=.30;ramp.inputs['To Max'].default_value=.39;nt.links.new(noise.outputs['Fac'],ramp.inputs['Value']);nt.links.new(ramp.outputs['Result'],b.inputs['Roughness'])
 for node in m.node_tree.nodes:
  if node.type=='BUMP':node.inputs['Strength'].default_value=.13;node.inputs['Distance'].default_value=.0006
# Original model was authored in large design units; use a physical34cm package.
for m in bpy.data.materials:
 if m.use_nodes:
  for node in m.node_tree.nodes:
   if node.type=='BUMP':node.inputs['Distance'].default_value*=U
# Keep the existing terracotta/champagne identity. Foil also makes the closed lid readable.
for name in ['Outer main wordmark','Outer secondary wordmark']:
 ob=s.objects[name];ob.data.materials.clear();ob.data.materials.append(bpy.data.materials['Satin champagne foil'])
s.objects['Infinite photographic floor'].hide_render=True
# One continuous studio floor/cove, without a visible cut or white horizon.
section=[(-100,0),(8,0)]+[(8+6*math.sin(math.pi*.5*j/48),6*(1-math.cos(math.pi*.5*j/48)))for j in range(1,49)]+[(14,50)]
verts=[]
for y,z in section:verts += [(-100*U,y*U,z*U),(100*U,y*U,z*U)]
faces=[(2*j,2*j+1,2*j+3,2*j+2)for j in range(len(section)-1)];mesh=bpy.data.meshes.new('CACAO continuous cove');mesh.from_pydata(verts,[],faces);mesh.update();cove=bpy.data.objects.new('CINEMA / continuous dark photographic cove',mesh);s.collection.objects.link(cove);mesh.materials.append(floor)
for face in mesh.polygons:face.use_smooth=True
for ob in list(s.objects):
 if ob.type=='LIGHT':bpy.data.objects.remove(ob,do_unlink=True)
def aim(ob,target):ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
def area(name,pos,power,w,h,target,color):
 d=bpy.data.lights.new(name,'AREA');d.shape='RECTANGLE';d.size=w*U;d.size_y=h*U;d.energy=power*U*U;d.color=color;o=bpy.data.objects.new(name,d);s.collection.objects.link(o);o.location=Vector(pos)*U;aim(o,Vector(target)*U);return o
key=area('CINEMA / travelling warm silk',(-4.5,-4.2,7),1050,3.5,5,(0,0,1),(1,.88,.70))
area('CINEMA / graphite right rim',(5,2,6),1650,1.1,5,(0,0,1),(1,.96,.88))
area('CINEMA / broad top silk',(-1,4,7),1250,4.5,4.5,(0,0,1.8),(.92,.96,1))
area('CINEMA / frontal foil trace',(-.5,-6,3),250,.6,3,(0,0,1.8),(1,.93,.79))
area('CINEMA / soft frontal fill',(1,-7,5),130,4,4,(0,0,1),(.94,.96,1))
root=s.objects['CACAO rigid box assembly'];root.scale=(U,U,U);hinge=s.objects['Physical rear lid hinge'];tablets=[s.objects[f'Chocolate {row}-{col}']for row in range(2)for col in range(3)]
base_positions=[Vector(((i%3-1)*1.49,((i//3)-.5)*1.45,.315))for i in range(6)]
camera=s.objects['Flagship photographic close-up camera'];s.camera=camera;camera.data.lens=58;camera.data.clip_start=.005;camera.data.clip_end=300;camera.data.dof.use_dof=a.macro;camera.data.dof.aperture_fstop=8
focus=s.objects['Focus on chocolate and identity'];camera.data.dof.focus_object=focus
subject=[o for o in root.children_recursive if o.type in ['MESH','CURVE','FONT'] and not o.hide_render]
watched=[root,hinge,camera,focus,key]+tablets
protected=[o for ob in tablets for o in ob.children_recursive if o.type in ['MESH','CURVE','FONT']]+[s.objects['Front foil wordmark'],s.objects['Front foil line']]

def ease(x):
 x=max(0,min(1,x));return x*x*x*(10+x*(-15+6*x))
def window(t,start,rise,end,fall):return ease((t-start)/rise)*(1-ease((t-end)/fall))
def pose(frame,fit=1):
 t=((frame-1)/FPS)%8;ph=math.tau*t/8
 opening=window(t,.22,1.9,5.75,1.95)
 root.location=(0,0,0);root.rotation_euler=(0,0,math.radians(-9+11*math.sin(ph)))
 hinge.rotation_euler=(-math.radians(103)*opening,0,0)
 for i,ob in enumerate(tablets):
  row,col=divmod(i,3);lift=window(t,1.85+.12*col+.15*row,1.15,4.45+.08*(2-col)+.1*row,1.2)
  turn=window(t,2.3+.12*col+.15*row,1.0,4.3+.08*(2-col)+.1*row,.9)
  height=.98 if i==1 else (.55 if row==0 else .38)
  ob.location=base_positions[i]+Vector(((col-1)*.045*lift,(-.065 if row==0 else .065)*lift,height*lift))
  ob.rotation_euler=(math.radians((7 if row==0 else -5))*turn,math.radians((col-1)*6)*turn,math.radians((col-1)*4)*turn)
 # Continuous physical arc and dolly. Framing fit is computed once per profile.
 az=math.radians(-74+17*math.sin(ph-.2));el=math.radians(35+13*opening+4*math.sin(ph))
 target=Vector((0,.18+.30*opening,.55+1.45*opening));radius=(16.2 if a.profile=='desktop' else 19.3)*(1+.12*opening)*(1+(fit-1)*opening if a.macro else fit)
 macro=window(t,2.15,1.4,4.7,1.35) if a.macro else 0
 target=target.lerp(Vector((0,-.32,.85+.3*opening)),macro)
 radius*=1-(.50 if a.profile=='desktop' else .45)*macro
 el=el*(1-macro)+math.radians(25)*macro
 camera.location=(target+Vector((radius*math.cos(el)*math.cos(az),radius*math.cos(el)*math.sin(az),radius*math.sin(el))))*U;aim(camera,target*U);focus.location=Vector((0,-.45,.9+.55*opening))*U
 key.location=Vector((-4.5+1.3*math.sin(ph),-4.2,7+.2*math.sin(ph)))*U;aim(key,Vector((0,0,1.4))*U)
 bpy.context.view_layer.update()

def bounds(protected_only=False):
 pts=[world_to_camera_view(s,camera,ob.matrix_world@Vector(v))for ob in (protected if protected_only else subject) for v in ob.bound_box]
 return [min(p.x for p in pts),min(1-p.x for p in pts),min(p.y for p in pts),min(1-p.y for p in pts)]
fit=1
for attempt in range(20):
 margins=[1,1,1,1]
 for f in range(1,N+1,5):
  pose(f,fit);macro=window((f-1)/FPS,2.15,1.4,4.7,1.35)if a.macro else 0;margins=[min(x,y)for x,y in zip(margins,bounds(protected_only=macro>.03))]
 if min(margins)>.045:break
 fit*=1.035
else:raise RuntimeError('Failed full-product camera framing')
# Dense native animation, including guard frames for periodic motion blur.
snap={};framing=[]
for frame in range(0,N+3):
 pose(frame,fit)
 if frame%10==1:framing.append({'frame':frame,'margins':bounds(),'protected_margins':bounds(True)})
 for ob in watched:ob.keyframe_insert('location',frame=frame);ob.keyframe_insert('rotation_euler',frame=frame)
 if frame in [1,N+1]:snap[frame]=[[float(v)for row in ob.matrix_world for v in row]for ob in watched]
for ob in watched:
 for layer in ob.animation_data.action.layers:
  for strip in layer.strips:
   bag=strip.channelbag(ob.animation_data.action_slot)
   if bag:
    for curve in bag.fcurves:
     for k in curve.keyframe_points:k.interpolation='BEZIER';k.handle_left_type='AUTO';k.handle_right_type='AUTO'
loop=max(abs(x-y)for aa,bb in zip(snap[1],snap[N+1])for x,y in zip(aa,bb));assert loop<1e-6
s.frame_set(1);master=O/f'cacao-cinema-{a.profile}.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master),check_existing=False)
report={'profile':a.profile,'source':str(source.relative_to(P)),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'master':str(master.relative_to(P)),'master_sha256':hashlib.sha256(master.read_bytes()).hexdigest(),'engine':'CYCLES','samples':a.samples,'bounces':7,'denoise':'OIDN Metal','width':s.render.resolution_x,'height':s.render.resolution_y,'fps':FPS,'frames':N,'duration':8,'native_3d':True,'interpolation':False,'upscale':False,'camera_fit':fit,'macro_dolly':a.macro,'unit_scale':U,'intentional_crop':'Upper lid only during the central macro; tablets and front foil remain protected'if a.macro else None,'framing':framing,'loop_max_matrix_error':loop,'objects':len(s.objects),'vertices':sum(len(o.data.vertices)for o in s.objects if o.type=='MESH'),'font_dependencies':[{'name':f.name,'packed':bool(f.packed_file),'sha256':hashlib.sha256(f.packed_file.data).hexdigest()if f.packed_file else None}for f in bpy.data.fonts],'timings':[]}
if a.mode=='proof':
 out=O/f'proof-{a.profile}';out.mkdir(exist_ok=True)
 for f in [int(x)for x in a.frames.split(',')]:
  s.frame_set(f);s.render.filepath=str(out/f'{f:04d}.png');t=time.monotonic();bpy.ops.render.render(write_still=True);report['timings'].append({'frame':f,'seconds':round(time.monotonic()-t,3)});print('CACAO_PROOF',report['timings'][-1],flush=True)
(O/f'build-{a.profile}.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:report[k]for k in ['profile','objects','vertices','width','height','fps','frames','camera_fit','loop_max_matrix_error','timings']}),flush=True)
