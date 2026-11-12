"""SPACE Blackbox: original studio rebuilt as a cinematic production set.
Reuses Space's editable architecture; new emblem, lighting and physical props.
The geometry and deterministic camera/assembly are shared by native film and GLB.
"""
import argparse, hashlib, json, math, sys, time
from pathlib import Path
import bpy
from mathutils import Vector
P=Path(__file__).resolve().parents[2]; O=P/'outputs/studio-cinema-20261112'; O.mkdir(exist_ok=True,parents=True)
a=argparse.ArgumentParser();a.add_argument('--profile',choices=['desktop','portrait'],default='desktop');a.add_argument('--mode',choices=['build','proof'],default='build');a.add_argument('--width',type=int,default=1280);a.add_argument('--frames',default='1,100,230');a.add_argument('--samples',type=int,default=24);args=a.parse_args(sys.argv[sys.argv.index('--')+1:])
source=P/'outputs/studio-blender-20261105/space-studio-master.blend';bpy.ops.wm.open_mainfile(filepath=str(source));s=bpy.context.scene;s.frame_set(103)
for ob in list(s.objects):
 ob.animation_data_clear()
 if ob.type in ['LIGHT','CAMERA']:bpy.data.objects.remove(ob,do_unlink=True)
s.animation_data_clear();root=bpy.data.objects['SPACE_Studio'];root['source']='Original SPACE Blackbox production set, 2026-11-12';root['entryEdition']='blackbox-20261112'
# The opening is a production set, without foreground chairs obscuring the work.
for name in ['Assembly_MainChair','Assembly_SecondChair']:
 ob=bpy.data.objects.get(name)
 if ob:
  for child in list(ob.children_recursive):bpy.data.objects.remove(child,do_unlink=True)
  bpy.data.objects.remove(ob,do_unlink=True)
def xyz(v):return Vector((v[0],-v[2],v[1]))
def rgb(h):
 v=[int(h[i:i+2],16)/255 for i in(1,3,5)];return tuple(x/12.92 if x<=.04045 else((x+.055)/1.055)**2.4 for x in v)+(1,)
def material(name,tint,rough=.4,metal=0,emission=0):
 m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF')
 for link in list(b.inputs['Base Color'].links):m.node_tree.links.remove(link)
 b.inputs['Base Color'].default_value=rgb(tint);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 b.inputs['Emission Color'].default_value=rgb(tint);b.inputs['Emission Strength'].default_value=emission
 return m
wall=material('Warm mineral plaster','#161a19',.76)
resin=material('Poured ivory resin','#202523',.28,.32)
stone=material('Charcoal cut stone plinth','#101312',.52)
felt=material('Graphite acoustic felt','#121512',.9)
fabric=material('Oat wool upholstery','#292d2a',.84)
black=material('Soft touch carbon','#111412',.28,.16)
metal=material('Brushed recycled aluminium','#6d7770',.23,.94)
yellow=material('SPACE enamel lime','#dfff00',.26,.38)
white=material('Warm architectural light','#fff8e5',.24,0,3)
signal=material('Lime edge light','#dfff00',.28,.08,2.5)
wood=material('Walnut veneer original grain','#1c211e',.31,.58)
chrome=material('Blackbox machined titanium','#7e8780',.19,.94)
# Keep microtexture subtle and physical in the native scene; GLB has the same base material.
for m in [wall,wood,fabric]:
 n=m.node_tree.nodes;links=m.node_tree.links;b=n.get('Principled BSDF');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=155;noise.inputs['Detail'].default_value=2
 bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.08;bump.inputs['Distance'].default_value=.004;links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],b.inputs['Normal'])
def group(name,pos=(0,0,0),start=None,end=None,offset=(0,.3,0)):
 ob=bpy.data.objects.new(name,None);s.collection.objects.link(ob);ob.parent=root;ob.location=xyz(pos)
 if start is not None:ob['entryFrom']=start;ob['entryTo']=end;ob['entryOffset']=list(offset)
 return ob
def box(name,dims,pos,mat,parent,bevel=.025):
 bpy.ops.mesh.primitive_cube_add(size=1);ob=bpy.context.object;ob.name=name;ob.dimensions=(dims[0],dims[2],dims[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  b=ob.modifiers.new('Manufactured rounded edges','BEVEL');b.width=min(bevel,min(dims)*.38);b.segments=3;bpy.ops.object.modifier_apply(modifier=b.name)
  for f in ob.data.polygons:f.use_smooth=True
  w=ob.modifiers.new('Weighted normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=w.name)
 ob.data.materials.append(mat);ob.parent=parent;ob.location=xyz(pos);return ob
def cyl(name,radius,depth,pos,mat,parent):
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=radius,depth=depth);ob=bpy.context.object;ob.name=name;ob.data.materials.append(mat);ob.parent=parent;ob.location=xyz(pos)
 b=ob.modifiers.new('Machined rim','BEVEL');b.width=.009;b.segments=3;bpy.ops.object.modifier_apply(modifier=b.name)
 for f in ob.data.polygons:f.use_smooth=len(f.vertices)==4
 return ob
# Replace the floating display-model context with a full photographic stage floor.
stage=group('BlackboxInfinityFloor')
cove=[(50,-.36),(-8,-.36)]+[(-8-6*math.sin(i*math.pi/80),-.36+6*(1-math.cos(i*math.pi/80))) for i in range(1,41)]+[(-14,25)]
verts=[tuple(xyz((x,y,z))) for z,y in cove for x in [-70,70]];faces=[(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(cove)-1)]
mesh=bpy.data.meshes.new('Seamless photographic cove');mesh.from_pydata(verts,[],faces);mesh.update();ob=bpy.data.objects.new('Continuous charcoal stage',mesh);s.collection.objects.link(ob);ob.parent=stage;ob.data.materials.append(material('Blackbox studio floor','#101410',.39,.16))
for f in mesh.polygons:f.use_smooth=True
# Slim luminous gantry creates a large architectural frame around the two workstations.
gantry=group('Assembly_BlackboxGantry',start=.14,end=.56,offset=(0,1.4,-.3))
for x in [-4.35,4.35]:
 box('Titanium lighting upright',(.075,4.22,.09),(x,2.10,-1.9),chrome,gantry,.02)
 box('Yellow vertical rim',(.025,3.96,.025),(x-.044,2.10,-1.84),signal,gantry,.004)
box('Overhead titanium beam',(8.78,.085,.11),(0,4.20,-1.9),chrome,gantry,.02)
box('Overhead soft source',(8.40,.035,.08),(0,4.15,-1.82),white,gantry,.008)
# Production equipment: two detailed nearfield monitors, ribbed shells, cones and status light.
audio=group('Assembly_BlackboxAudio',start=.51,end=.77,offset=(0,.65,-.1))
for x in [.15,3.41]:
 box('Monitor speaker enclosure',(.44,.64,.36),(x,1.59,-.52),black,audio,.06)
 for yy,rr in [(1.48,.135),(1.78,.065)]:
  ob=cyl('Speaker milled driver',rr,.025,(x,yy,-.324),chrome,audio);ob.rotation_euler.x=math.pi/2
  ob=cyl('Speaker carbon diaphragm',rr*.84,.03,(x,yy,-.303),felt,audio);ob.rotation_euler.x=math.pi/2
 box('Speaker power indicator',(.027,.006,.006),(x,1.30,-.32),signal,audio,.002)
# Desk palette swatches and a CNC rotary console add creative-production detail.
props=group('Assembly_BlackboxTools',start=.61,end=.87,offset=(0,.38,.12))
box('Creative controller enclosure',(.55,.07,.44),(2.78,1.30,.33),chrome,props,.04)
cyl('Large rotary dial',.145,.066,(2.78,1.365,.33),black,props)
for i in range(24):
 an=i*math.tau/24;box('Knurled control detail',(.012,.038,.012),(2.78+math.sin(an)*.148,1.36,.33+math.cos(an)*.148),metal,props,.003)
for i,m in enumerate([yellow,white,black]):box('Material sample',(.34,.018,.48),(-.7+i*.25,1.27,.42+i*.06),m,props,.015)
# Original four-point SPACE mark, with a true aperture rather than a painted dot.
emblem=group('Assembly_SpaceEmblem',(-.72,2.65,-1.64),0,.69,(0,0,2.55));emblem['entryAlways']=True;emblem['entryRotationY']=.62;emblem['entryScaleFrom']=1.28
curve=bpy.data.curves.new('SPACE emblem outline with aperture','CURVE');curve.dimensions='2D';curve.fill_mode='BOTH';curve.resolution_u=12;curve.extrude=.11;curve.bevel_depth=.026;curve.bevel_resolution=4
outer=[(0,1.25),(.33,.33),(1.25,0),(.33,-.33),(0,-1.25),(-.33,-.33),(-1.25,0),(-.33,.33)]
for pts in [outer,[(.30*math.cos(i*math.tau/64),.30*math.sin(i*math.tau/64)) for i in range(64)]]:
 sp=curve.splines.new('POLY');sp.points.add(len(pts)-1)
 for p,v in zip(sp.points,pts):p.co=(v[0],v[1],0,1)
 sp.use_cyclic_u=True
ob=bpy.data.objects.new('Sculpted yellow SPACE emblem',curve);s.collection.objects.link(ob);ob.parent=emblem;ob.rotation_euler.x=math.pi/2;ob.data.materials.append(yellow);bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.convert(target='MESH');ob.select_set(False)
# Monitors show existing original artwork; live renderer replaces them with current DOM/brand.
for name,path in [('Screen_Hero','public/images/director-water-desktop.webp'),('Screen_Secondary','public/images/luma-mechanics-20261112-desktop.webp')]:
 ob=bpy.data.objects[name];m=bpy.data.materials.new(name+' native photographic display');m.use_nodes=True;n=m.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');em=n.new('ShaderNodeEmission');em.inputs['Strength'].default_value=.7;tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(P/path));tex.image.pack();m.node_tree.links.new(tex.outputs['Color'],em.inputs['Color']);m.node_tree.links.new(em.outputs[0],out.inputs[0]);ob.data.materials.clear();ob.data.materials.append(m)
# Join rigid parts within the three new assembly groups. Material slots and
# world transforms stay intact; fewer draw calls matter in the iPhone fallback.
for parent in [gantry,audio,props]:
 parts=[o for o in parent.children if o.type=='MESH']
 if len(parts)>1:
  bpy.ops.object.select_all(action='DESELECT')
  for part in parts:part.select_set(True)
  bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();parts[0].name=parent.name+' rigid manufactured parts'
# Static browser model before animation keyframes; named groups and extras remain editable.
if args.profile=='desktop':
 bpy.ops.object.select_all(action='DESELECT')
 for o in [root]+list(root.children_recursive):o.select_set(True)
 glb=P/'public/models/studio-blackbox-20261112.glb';bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False)
# Native path-traced stage. Large sources give real contact/reflection instead of uniform fill.
def aim(ob,target):ob.rotation_euler=(xyz(target)-ob.location).to_track_quat('-Z','Y').to_euler()
s.world.node_tree.nodes['Background'].inputs['Color'].default_value=rgb('#bcc7c0');s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.06
nt=s.world.node_tree;original=nt.nodes['Background'];output=next(n for n in nt.nodes if n.type=='OUTPUT_WORLD');dark=nt.nodes.new('ShaderNodeBackground');dark.inputs['Color'].default_value=(0,0,0,1);dark.inputs['Strength'].default_value=0;path=nt.nodes.new('ShaderNodeLightPath');mix=nt.nodes.new('ShaderNodeMixShader');nt.links.new(path.outputs['Is Camera Ray'],mix.inputs[0]);nt.links.new(original.outputs[0],mix.inputs[1]);nt.links.new(dark.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],output.inputs['Surface'])
for name,pos,energy,size,tint,target in [
 ('Large neutral silk',(-4.8,6.5,5),850,5.2,'#fff4df',(0,1.4,-.8)),
 ('Right edge strip',(5.4,4.2,-1),1100,3,'#f7f8ea',(1,1.5,0)),
 ('Backwall grazing source',(-3.6,3.6,-2.4),130,2.0,'#dfff72',(-.5,2,-2.6)),
 ('Front soft bounce',(1,3,8),160,5,'#e4e9e3',(0,1.8,-.2)),
 ('Emblem specular card',(-2,5.0,2),320,2.5,'#ffffff',(-.72,2.65,0))]:
 d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size;d.color=rgb(tint)[:3];o=bpy.data.objects.new(name,d);s.collection.objects.link(o);o.location=xyz(pos);aim(o,target)
camdata=bpy.data.cameras.new('Blackbox cinematic lens');camdata.lens=40 if args.profile=='desktop' else 38;camdata.sensor_fit='HORIZONTAL' if args.profile=='desktop' else 'VERTICAL';camdata.sensor_height=32;cam=bpy.data.objects.new('Blackbox camera',camdata);s.collection.objects.link(cam);s.camera=cam
s.render.engine='CYCLES';prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
s.cycles.device='GPU';s.cycles.samples=args.samples;s.cycles.use_denoising=True;s.cycles.denoising_use_gpu=True;s.cycles.use_adaptive_sampling=True;s.cycles.adaptive_threshold=.04;s.cycles.max_bounces=6;s.cycles.transmission_bounces=4;s.cycles.seed=19;s.cycles.use_animated_seed=False;s.render.use_persistent_data=True
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=-.25;s.render.film_transparent=False
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8';s.render.image_settings.compression=30
s.render.resolution_x=args.width;s.render.resolution_y=round(args.width*9/16) if args.profile=='desktop' else round(args.width*16/9);s.render.resolution_percentage=100
s.render.fps=60 if args.profile=='desktop' else 30;N=round(s.render.fps*4.8);s.frame_start=1;s.frame_end=N;s.render.use_motion_blur=True;s.render.motion_blur_shutter=.20
tracks=[(o,o.location.copy(),o.scale.copy()) for o in s.objects if 'entryFrom'in o]
def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
def lerp(a,b,t):return Vector(a).lerp(Vector(b),t)
for f in range(-1,N+3):
 p=max(0,min(1,(f-1)/(N-1)))
 for o,location,scale in tracks:
  t=smooth((p-o['entryFrom'])/(o['entryTo']-o['entryFrom']));o.location=location+xyz(o['entryOffset'])*(1-t);o.scale=scale.copy();o.rotation_euler=(0,0,0)
  if o.get('entryAlways'):
   o.scale*=1+(o.get('entryScaleFrom',1)-1)*(1-t);o.rotation_euler.z=o.get('entryRotationY',0)*(1-t)
  elif t<=.0001:o.scale*=.0001
  elif o.get('entryScaleAxis'):o.scale[{'x':0,'y':2,'z':1}[o['entryScaleAxis']]]*=max(.001,t)
  for k in ['location','scale','rotation_euler']:o.keyframe_insert(k,frame=f)
 q=smooth(p/.73);close=smooth((p-.73)/.27)
 if args.profile=='desktop':
  pos=lerp((-3.8,3.4,7.5),(4.8,3.50,9.1),q);pos=pos.lerp(Vector((3.5,2.65,6.4)),close)
  target=lerp((-.72,2.65,.85),(.30,1.85,-.9),q);target=target.lerp(Vector((1.15,1.90,-.6)),close)
 else:
  pos=lerp((-3.2,3.3,8.1),(5.1,3.55,10.8),q);pos=pos.lerp(Vector((4.4,3.0,9.9)),close)
  target=lerp((-.72,2.65,.85),(.55,1.95,-.7),q);target=target.lerp(Vector((1.55,1.90,-.6)),close)
 cam.location=xyz(pos);aim(cam,target);cam.keyframe_insert('location',frame=f);cam.keyframe_insert('rotation_euler',frame=f)
# Linear interpolation between densely sampled native frames; no easing resampled by exporters.
for action in bpy.data.actions:
 for layer in action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for fc in bag.fcurves:
     for k in fc.keyframe_points:k.interpolation='LINEAR'
s.frame_set(1);master=O/f'studio-cinema-{args.profile}.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master))
report={'source':str(source.relative_to(P)),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'master':str(master.relative_to(P)),'master_sha256':hashlib.sha256(master.read_bytes()).hexdigest(),'profile':args.profile,'resolution':[s.render.resolution_x,s.render.resolution_y],'fps':s.render.fps,'frames':N,'objects':len(s.objects),'meshes':sum(o.type=='MESH'for o in s.objects),'tracks':len(tracks),'samples':args.samples,'native':True,'proofs':[]}
if args.mode=='proof':
 out=O/f'proof-{args.profile}';out.mkdir(exist_ok=True)
 for f in map(int,args.frames.split(',')):
  s.frame_set(f);s.render.filepath=str(out/f'{f:04d}.png');start=time.monotonic();bpy.ops.render.render(write_still=True);report['proofs'].append({'frame':f,'seconds':time.monotonic()-start,'file':str(Path(s.render.filepath).relative_to(P))})
(O/f'build-{args.profile}.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True)
