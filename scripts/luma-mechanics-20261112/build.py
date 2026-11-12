"""LUMA Mechanics — native 3D, deterministic 10 second loop.
Reuses original, editable LUMA geometry. Independently rigs iris blades, dials,
three helicoid optical groups, shutter and body. No photo projection/interpolation.
"""
import argparse, bpy, json, math, sys, time, hashlib, shutil
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
P=Path(__file__).resolve().parents[2]; O=P/'outputs/luma-mechanics-20261112'; O.mkdir(exist_ok=True,parents=True)
p=argparse.ArgumentParser();p.add_argument('--profile',default='desktop',choices=['desktop','portrait']);p.add_argument('--engine',default='CYCLES',choices=['CYCLES','BLENDER_EEVEE']);p.add_argument('--mode',default='proof',choices=['build','proof','render']);p.add_argument('--samples',type=int,default=24);p.add_argument('--bounces',type=int,default=7);p.add_argument('--transmission',type=int,default=6);p.add_argument('--frames',default='1,301,451');p.add_argument('--width',type=int,default=1280);p.add_argument('--start',type=int,default=1);p.add_argument('--end',type=int,default=0);a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
source=P/'outputs/flagship-20261106/luma/luma-optical-bench.blend';bpy.ops.wm.open_mainfile(filepath=str(source));s=bpy.context.scene
for ob in s.objects:ob.animation_data_clear()
s.animation_data_clear();root=s.objects['LUMA studio camera'];U=.035
FPS=60 if a.profile=='desktop' else 30;N=FPS*10
s.render.engine=a.engine;s.render.fps=FPS;s.frame_start=1;s.frame_end=N;s.render.resolution_x=a.width;s.render.resolution_y=round(a.width*9/16) if a.profile=='desktop' else round(a.width*5/4);s.render.resolution_percentage=100
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8';s.render.image_settings.compression=30
s.render.film_transparent=False;s.render.use_file_extension=True
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=.15
s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.09
s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.20,.22,.25,1)
if a.profile=='portrait':
 # Preserve environment lighting but use a seamless black photographic background.
 nt=s.world.node_tree;bg=nt.nodes.get('Background');out=next(n for n in nt.nodes if n.type=='OUTPUT_WORLD');black=nt.nodes.new('ShaderNodeBackground');black.inputs['Color'].default_value=(0,0,0,1);black.inputs['Strength'].default_value=0;lp=nt.nodes.new('ShaderNodeLightPath');mix=nt.nodes.new('ShaderNodeMixShader');nt.links.new(lp.outputs['Is Camera Ray'],mix.inputs[0]);nt.links.new(bg.outputs[0],mix.inputs[1]);nt.links.new(black.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],out.inputs['Surface'])
if a.engine=='CYCLES':
 prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
 for d in prefs.devices:d.use=d.type=='METAL'
 s.cycles.device='GPU';s.cycles.seed=23;s.cycles.use_animated_seed=False;s.cycles.samples=a.samples;s.cycles.use_denoising=True;s.cycles.use_adaptive_sampling=True;s.cycles.adaptive_threshold=.045;s.cycles.max_bounces=a.bounces;s.cycles.transmission_bounces=a.transmission;s.render.use_persistent_data=True;s.cycles.transparent_max_bounces=8
 if hasattr(s.cycles,'denoising_use_gpu'):s.cycles.denoising_use_gpu=True
else:
 s.eevee.taa_render_samples=a.samples;s.eevee.use_raytracing=True;s.eevee.ray_tracing_options.resolution_scale='1';s.eevee.use_fast_gi=True
if hasattr(s.render,'use_motion_blur'):s.render.use_motion_blur=True;s.render.motion_blur_shutter=.23

def aim(ob,pt):ob.rotation_euler=(Vector(pt)-ob.location).to_track_quat('-Z','Y').to_euler()
def rgb(h):
 v=[int(h[i:i+2],16)/255 for i in(1,3,5)];return tuple(x/12.92 if x<=.04045 else((x+.055)/1.055)**2.4 for x in v)+(1,)
def mat(n,col=None,rough=None,metal=None):
 m=bpy.data.materials[n];b=m.node_tree.nodes.get('Principled BSDF')
 if col:
  for link in list(b.inputs['Base Color'].links):m.node_tree.links.remove(link)
  b.inputs['Base Color'].default_value=rgb(col)
 if rough is not None:b.inputs['Roughness'].default_value=rough
 if metal is not None:b.inputs['Metallic'].default_value=metal
 return b
mat('Signal yellow enamel','#bbae00',.48,.04);mat('Bayonet registration carmine','#f2e52e',.26,.2)
mat('Ceramic graphite anodised shell','#202327',.285,.74);mat('Satin titanium machining','#a9adb2',.23,.94);mat('Pale ceramic dial marks','#e5e6dc',.36,.35);mat('Warm laser etch','#d9dbd4',.37,.7)
mat('Warm photographic sweep','#111214',.62,0)
for name in ['Coated optical glass','Optical inner coating 0','Optical inner coating 1']:
 b=mat(name,'#f4f7f7',.025,0);b.inputs['IOR'].default_value=1.45;b.inputs['Transmission Weight'].default_value=1
 # Small glass surfaces need clean normals for a legible iris at every angle.
 for key in ['Normal','Coat Normal']:
  for link in list(b.inputs[key].links):b.id_data.links.remove(link)
if a.engine=='BLENDER_EEVEE':
 # Thin optical coating: true view-dependent Fresnel reflection over visible 3D
 # mechanisms. EEVEE screen tracing cannot resolve stacked solid glass volumes.
 # The editable Cycles recipe retains solid refractive optical elements.
 for name in ['Coated optical glass','Optical inner coating 0','Optical inner coating 1']:
  m=bpy.data.materials[name];nt=m.node_tree;nt.nodes.clear();out=nt.nodes.new('ShaderNodeOutputMaterial');mix=nt.nodes.new('ShaderNodeMixShader');glass=nt.nodes.new('ShaderNodeBsdfPrincipled');clear=nt.nodes.new('ShaderNodeBsdfTransparent');fres=nt.nodes.new('ShaderNodeFresnel');fres.inputs['IOR'].default_value=1.45
  glass.inputs['Base Color'].default_value=(.87,.93,.97,1);glass.inputs['Metallic'].default_value=1;glass.inputs['Roughness'].default_value=.025
  nt.links.new(fres.outputs[0],mix.inputs[0]);nt.links.new(clear.outputs[0],mix.inputs[1]);nt.links.new(glass.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],out.inputs['Surface']);m.surface_render_method='DITHERED'
for i in range(3):mat('Iris blade titanium '+str(i),['#252c33','#333b44','#20262d'][i],.34,.52)
# Neutral photographic lighting. Yellow belongs to the real enamel details.
for ob in list(s.objects):
 if ob.type=='LIGHT':bpy.data.objects.remove(ob,do_unlink=True)
def silk(n,pos,target,w,h,power,color):
 d=bpy.data.lights.new(n,'AREA');d.shape='RECTANGLE';d.size=w*U;d.size_y=h*U;d.energy=power*U*U;d.color=color;o=bpy.data.objects.new(n,d);s.collection.objects.link(o);o.location=Vector(pos)*U;aim(o,Vector(target)*U);return o
silk('Mechanics broad overhead silk',(-2,-1,6),(0,0,1),4.3,4,730,(1,1,1))
silk('Mechanics left titanium rim',(-4,1,3.5),(0,0,1.2),.75,4.5,940,(.92,.95,1))
silk('Mechanics right soft edge',(4,0,3),(0,0,1),.7,4.2,800,(1,.97,.88))
silk('Mechanics frontal softbox',(0,-5,2.8),(0,-1,1.2),2.6,3.8,115,(1,1,1))
silk('Mechanics lens tracing silk',(-1.7,-4.7,2.2),(-.2,-1.5,1.1),.18,2.3,100,(.90,.96,1))
silk('Mechanics top engraving light',(1,-1,5),(0,0,2.2),2,2,270,(1,1,.94))
if a.profile=='portrait':
 # Real seamless studio sweep: flat floor, quarter-circle cove, tall back wall.
 old=s.objects['Cyclorama'];old.hide_render=True
 z=-.0014;r=.22;begin=.14;section=[(-2,z),(begin,z)]
 section += [(begin+r*math.sin(math.pi*.5*j/64),z+r*(1-math.cos(math.pi*.5*j/64)))for j in range(1,65)]
 section.append((begin+r,1.5));verts=[]
 for y,zpos in section:verts.extend([(-4,y,zpos),(4,y,zpos)])
 faces=[(2*j,2*j+1,2*j+3,2*j+2)for j in range(len(section)-1)]
 mesh=bpy.data.meshes.new('Continuous portrait studio sweep');mesh.from_pydata(verts,[],faces);mesh.update();sweep=bpy.data.objects.new('MECH / seamless photographic cove',mesh);s.collection.objects.link(sweep);mesh.materials.append(bpy.data.materials['Warm photographic sweep'])
 for poly in mesh.polygons:poly.use_smooth=True
# Dial components are now a mechanical hierarchy; engraving and knurling rotate together.
def empty(n,parent,loc):
 o=bpy.data.objects.new(n,None);s.collection.objects.link(o);o.parent=parent;o.location=loc;return o
def attach_keep_world(o,p):
 m=o.matrix_world.copy();o.parent=p;o.matrix_world=m
bpy.context.view_layer.update();dials=[]
for i,x in enumerate([-.65,.33,1.18]):
 rig=empty('MECH / dial pivot '+str(i),root,(x,0,2.38));bpy.context.view_layer.update()
 for ob in list(root.children):
  belongs=ob.name==f'Tactile top dial {i}' or ob.name.startswith(f'Fine dial knurl {i} ')
  if ob.name.startswith(('Dial engraved value','Dial machined graduation')):belongs=abs(ob.location.x-x)<.30
  if belongs:attach_keep_world(ob,rig)
 dials.append(rig)
# Pivoted overlapping aperture blades replace the static quadrilateral illustration.
parts=[s.objects['Optical group '+str(i)]for i in range(3)]
s.objects['Curved multi-coated optical element'].scale.y=.16
for ob in list(s.objects):
 if ob.name.startswith('Nine-leaf optical diaphragm'):bpy.data.objects.remove(ob,do_unlink=True)
iris=[]
for i in range(9):
 angle=i*math.tau/9;rad=.48;pivot=Vector((rad*math.cos(angle),.096+i*.00065,rad*math.sin(angle)))
 rig=empty('MECH / iris pivot '+str(i),parts[2],pivot);rig.rotation_euler.y=-angle
 # Generous overlapping leaf, with a slightly curved inner cut and hidden outer tail.
 pts=[(.48,0),(.47,.14),(.38,.29),(.22,.36),(.03,.27),(.05,.14),(.13,.045),(.28,-.025)]
 mesh=bpy.data.meshes.new('Precision iris leaf '+str(i));mesh.from_pydata([(x-rad,0,z)for x,z in pts],[],[list(range(len(pts)))]);mesh.update()
 ob=bpy.data.objects.new('MECH / titanium iris leaf '+str(i),mesh);s.collection.objects.link(ob);ob.parent=rig;ob.data.materials.append(bpy.data.materials['Iris blade titanium '+str(i%3)])
 sol=ob.modifiers.new('Etched metal thickness','SOLIDIFY');sol.thickness=.0005
 bevel=ob.modifiers.new('Optical edge bevel','BEVEL');bevel.width=.0015;bevel.segments=2
 iris.append((rig,angle))
# A real control collar provides context for the front-group rotation.
shutter=s.objects['Yellow shutter button'];shutter_z=shutter.location.z
camera=s.objects['desktop hero plate camera'];s.camera=camera;camera.data.lens=60;camera.data.clip_start=.001;camera.data.clip_end=20;camera.data.dof.use_dof=False
focus=empty('MECH / focus target',None,(0,0,0))
subject=[o for o in root.children_recursive if o.type in {'MESH','FONT','CURVE'}]
basepositions=[o.location.copy() for o in parts]
watched=[root,camera,focus,shutter]+parts+dials+[o for o,_ in iris]

def pose(frame):
 t=(frame-1)/FPS;ph=math.tau*t/10
 front=((1-math.cos(ph))/2)**3
 high=((1+math.cos(ph-1.5*math.pi))/2)**10
 extension=(.5-.5*math.cos(ph))**1.4
 # Smooth forty-degree turn makes the body and lens read as physical objects.
 root.rotation_euler=(math.radians(2.8)*math.sin(ph),math.radians(1.6)*math.sin(ph*2),math.radians(18)*math.sin(ph))
 root.location=(.004*math.sin(ph),0,.001425+.002*(.5-.5*math.cos(ph*2)))
 for i,ob in enumerate(parts):
  ob.location=basepositions[i]+Vector((0,-[.11,.23,.38][i]*extension,0));ob.rotation_euler=(0,[.04,-.12,.30][i]*math.sin(ph),0)
 for i,rig in enumerate(dials):rig.rotation_euler.z=[.68,-.92,.34][i]*(1-math.cos(ph))
 shutter.location.z=shutter_z-.012*high
 # Outer pins stay attached; the nine independent blades rotate around their pins.
 opening=(.5-.5*math.cos(ph*2+.2))
 for rig,ang in iris:rig.rotation_euler.y=-ang+math.radians(34)*opening
 target=Vector((0,-.42,1.2)).lerp(Vector((-.2,-1.4,1.16)),front*.65).lerp(Vector((-.05,-.15,1.72)),high*.60)
 pos=Vector((-5.2,-12.0,5.0)).lerp(Vector((.1,-8.0,2.5)),front*.8).lerp(Vector((4.1,-7.7,9.0)),high*.75)
 if a.profile=='portrait':
  # A dedicated composition, not a crop. Entire device retains safe margins.
  pos=target+(pos-target)*.97
 pos=target+(pos-target)*(1+.14*front)
 camera.location=pos*U;aim(camera,target*U);focus.location=target*U
 bpy.context.view_layer.update()

bounds=[];snap={}
for f in range(0,N+3):
 pose(f)
 if f%5==1:
  pts=[world_to_camera_view(s,camera,o.matrix_world@Vector(v))for o in subject for v in o.bound_box]
  bounds.append({'frame':f,'left':min(p.x for p in pts),'right':1-max(p.x for p in pts),'bottom':min(p.y for p in pts),'top':1-max(p.y for p in pts)})
 for ob in watched:ob.keyframe_insert('location',frame=f);ob.keyframe_insert('rotation_euler',frame=f)
 if f in [1,2,N,N+1]:snap[f]=[[float(v)for row in ob.matrix_world for v in row]for ob in watched]
# Dense native samples plus smooth evaluated subframes for real motion blur.
for ob in watched:
 for layer in ob.animation_data.action.layers:
  for strip in layer.strips:
   bag=strip.channelbag(ob.animation_data.action_slot)
   if bag:
    for curve in bag.fcurves:
     for key in curve.keyframe_points:key.interpolation='BEZIER';key.handle_left_type='AUTO';key.handle_right_type='AUTO'
loop=max(abs(x-y)for rowsA,rowsB in zip(snap[1],snap[N+1])for x,y in zip(rowsA,rowsB))
report={'profile':a.profile,'engine':a.engine,'samples':a.samples,'bounces':a.bounces,'transmission_bounces':a.transmission,'persistent_data':True,'width':s.render.resolution_x,'height':s.render.resolution_y,'fps':FPS,'duration':10,'frames':N,'native_3d':True,'interpolation':False,'source':str(source.relative_to(P)),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'loop_matrix_max_error':loop,'framing':bounds,'mechanisms':['body turn and bank','three coaxial helicoid groups','nine individually pivoted overlapping metal iris leaves','three engraved dials','shutter depression'],'timings':[]}
pose(1);master=O/f'luma-mechanics-{a.profile}.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master),check_existing=False)
if a.mode!='build':
 folder=O/(f'proof-{a.profile}-{a.engine}-s{a.samples}-b{a.bounces}'if a.mode=='proof'else f'frames-{a.profile}');folder.mkdir(exist_ok=True)
 frames=[int(f)for f in a.frames.split(',')]if a.mode=='proof'else range(a.start,(a.end or N)+1)
 for f in frames:
  assert shutil.disk_usage(P).free>500*1024**2,'Less than500MiB available'
  s.frame_set(f);s.render.filepath=str(folder/f'{f:04d}.png')
  if a.mode=='render' and Path(s.render.filepath).exists():continue
  start=time.monotonic();bpy.ops.render.render(write_still=True);elapsed=time.monotonic()-start
  report['timings'].append({'frame':f,'seconds':round(elapsed,3)});print('MECHANICS_FRAME',f,round(elapsed,3),flush=True)
  (O/f'report-{a.profile}-{a.engine}-{a.mode}-s{a.samples}-b{a.bounces}.json').write_text(json.dumps(report,indent=2))
(O/f'report-{a.profile}-{a.engine}-{a.mode}-s{a.samples}-b{a.bounces}.json').write_text(json.dumps(report,indent=2));print('MECHANICS_COMPLETE',report['timings'],flush=True)
