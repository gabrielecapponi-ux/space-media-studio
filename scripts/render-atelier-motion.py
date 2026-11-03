"""Original kinetic typography film for Space. Run only on isolated Blender scenes.

blender --background --factory-startup --python scripts/render-atelier-motion.py -- --mode proof --variant desktop
The source .blend and numbered master PNGs are preserved under outputs/nov26/motion/.
"""
import bpy, math, json, time, sys, argparse, subprocess
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'outputs/nov26/motion'
parser=argparse.ArgumentParser();parser.add_argument('--mode',choices=['proof','render','build','encode'],default='proof');parser.add_argument('--variant',choices=['desktop','mobile'],default='desktop');parser.add_argument('--frames',default='1:120');parser.add_argument('--engine',choices=['BLENDER_EEVEE','CYCLES'],default='BLENDER_EEVEE');parser.add_argument('--samples',type=int,default=48)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--'in sys.argv else [])
OUT.mkdir(parents=True,exist_ok=True);folder=OUT/args.variant;folder.mkdir(exist_ok=True)

if args.mode=='encode':
 master=folder/'atelier-type-master.blend'
 bpy.ops.wm.open_mainfile(filepath=str(master))
 check_scene=bpy.context.scene
 watched=[bpy.data.objects['Cinematic lens'],bpy.data.objects['Moving photographic strip'],bpy.data.objects['SPACE kinetic type']]
 poses={}
 for frame in [1,41,81,121]:
  check_scene.frame_set(frame);bpy.context.view_layer.update()
  poses[frame]=[[value for row in ob.matrix_world for value in row] for ob in watched]
 loop_error=max(abs(a-b) for ma,mb in zip(poses[1],poses[121]) for a,b in zip(ma,mb))
 motion=max(abs(a-b) for ma,mb in zip(poses[1],poses[41]) for a,b in zip(ma,mb))
 if loop_error>.0001 or motion<.1:raise RuntimeError(f'Master animation validation failed: loop={loop_error}, motion={motion}')
 validation={'reimport':'passed','scene_objects':len(check_scene.objects),'mesh_objects':sum(ob.type=='MESH' for ob in check_scene.objects),'mesh_vertices':sum(len(ob.data.vertices) for ob in check_scene.objects if ob.type=='MESH'),'loop_transform_error':loop_error,'observed_transform_change':motion,'poses_checked':[1,41,81,121]}
 (folder/'master-validation.json').write_text(json.dumps(validation,indent=2))
 frames=folder/'frames'
 missing=[n for n in range(1,121) if not (frames/f'{n:04}.png').exists()]
 if missing:raise RuntimeError(f'Missing master frames: {missing}')
 films=ROOT/'public/films';images=ROOT/'public/images';films.mkdir(exist_ok=True);images.mkdir(exist_ok=True)
 film=films/f'atelier-type-{args.variant}.mp4';poster=images/f'atelier-type-{args.variant}.jpg'
 subprocess.run(['ffmpeg','-v','error','-y','-framerate','24','-start_number','1','-i',str(frames/'%04d.png'),'-frames:v','120','-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-c:v','libx264','-threads','4','-preset','slow','-crf','18','-profile:v','high','-level','4.1','-pix_fmt','yuv420p','-g','48','-keyint_min','48','-movflags','+faststart','-an',str(film)],check=True)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(frames/'0001.png'),'-q:v','2','-frames:v','1',str(poster)],check=True)
 subprocess.run(['ffmpeg','-v','error','-i',str(film),'-f','null','-'],check=True)
 print(json.dumps({'encoded':str(film),'poster':str(poster),'full_decode':'passed'}),flush=True)
 sys.exit(0)

def available_gib():
 try:
  report=subprocess.check_output(['vm_stat'],text=True);page=int(report.split('page size of ')[1].split(' bytes')[0]);counts={}
  for line in report.splitlines()[1:]:
   if ':'in line:
    k,v=line.split(':',1)
    try:counts[k]=int(v.strip().strip('.'))
    except ValueError:pass
  return sum(counts.get(k,0) for k in ['Pages free','Pages inactive','Pages speculative']) *page/(1024**3)
 except Exception:return None

def rgb(value):
 value=value.lstrip('#');vs=[int(value[i:i+2],16)/255 for i in (0,2,4)]
 return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in vs)+(1,)

def material(name,color,rough=.3,metal=.0,coat=.0):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=rgb(color);n.inputs['Roughness'].default_value=rough;n.inputs['Metallic'].default_value=metal;n.inputs['Coat Weight'].default_value=coat;n.inputs['Coat Roughness'].default_value=.18
 return m

def aim(obj,target):obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()

def area(name,pos,power,size,color,target=(0,0,2),shape='RECTANGLE',size_y=None):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape=shape;d.size=size
 if shape=='RECTANGLE':d.size_y=size_y or size
 d.color=rgb(color)[:3];o=bpy.data.objects.new(name,d);bpy.context.scene.collection.objects.link(o);o.location=pos;aim(o,target);return o

bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene
s.render.engine=args.engine;s.render.fps=24;s.frame_start=1;s.frame_end=120
if args.engine=='CYCLES':s.cycles.samples=args.samples;s.cycles.use_denoising=True;s.cycles.use_persistent_data=True;s.cycles.max_bounces=6
else:
 s.eevee.taa_render_samples=args.samples
 s.eevee.use_raytracing=True
 s.eevee.ray_tracing_options.resolution_scale='2'
s.render.resolution_x,s.render.resolution_y=(1920,1080) if args.variant=='desktop' else (720,900)
s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8';s.render.film_transparent=False
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=.2
s.world=bpy.data.worlds.new('Black photographic studio');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs['Color'].default_value=rgb('#151716');s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.3
white=material('Warm porcelain lettering','#eeeee6',.28,.18,.16)
yellow=material('Electric yellow lacquer','#dfff00',.3,.12,.28)
graphite=material('Satin graphite sides','#161c1b',.25,.82,.2)
floor_mat=material('Fine dark resin floor','#101615',.28,.2,.15)
nodes=floor_mat.node_tree.nodes;links=floor_mat.node_tree.links;noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=145;noise.inputs['Roughness'].default_value=.65;bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.1;bump.inputs['Distance'].default_value=.025;links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],nodes['Principled BSDF'].inputs['Normal'])
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.04));ground=bpy.context.object;ground.name='Grounded black sweep';ground.data.materials.append(floor_mat)
font_path='/System/Library/Fonts/Supplemental/Arial Bold.ttf';font=bpy.data.fonts.load(font_path)
root=bpy.data.objects.new('SPACE kinetic type',None);s.collection.objects.link(root)

def text_row(body,size,z,face):
 curve=bpy.data.curves.new('Letter outlines '+body,'FONT');curve.body=body;curve.font=font;curve.size=size;curve.extrude=.40;curve.bevel_depth=.028;curve.bevel_resolution=4;curve.resolution_u=12;curve.space_character=1.04
 ob=bpy.data.objects.new('Architectural typography / '+body,curve);s.collection.objects.link(ob)
 bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.convert(target='MESH');ob=bpy.context.object
 ob.data.materials.append(face);ob.data.materials.append(graphite)
 for p in ob.data.polygons:p.material_index=0 if p.normal.z>.72 else 1;p.use_smooth=False
 xs=[v.co.x for v in ob.data.vertices];ys=[v.co.y for v in ob.data.vertices];minx,maxx=min(xs),max(xs);miny=min(ys)
 # Center the glyphs, keep the first row's baseline resting on the studio floor.
 ob.location=(-.5*(minx+maxx),0,z-miny);ob.rotation_euler=(math.pi/2,0,0);ob.parent=root
 ob.select_set(False);return ob
if args.variant=='desktop':
 text_row('MAKE',2.9,2.28,white);text_row('IT MOVE.',2.1,.12,yellow)
else:
 text_row('MAKE',2.05,3.45,white);text_row('IT',1.7,2.02,white);text_row('MOVE.',2.05,.12,yellow)
# Architectural shadows are anchored; no floating decorative primitives.
key=area('Large upper-left softbox',(-5,-4,8),1800,7,'#fff8e6',size_y=4)
fill=area('Cool broad edge',(5,-1,5.6),1700,5,'#dfeeff',size_y=4)
sweep=area('Moving photographic strip',(-4,1.4,5),2200,2,'#ffffff',size_y=6)
area('Low warm reflector',(0,-7,1.5),450,5,'#dfffaa',target=(0,0,1.4),size_y=2)
camdata=bpy.data.cameras.new('Cinematic lens');cam=bpy.data.objects.new('Cinematic lens',camdata);s.collection.objects.link(cam);s.camera=cam
camdata.lens=42 if args.variant=='desktop' else 47
camdata.sensor_width=36;camdata.clip_start=.05;camdata.clip_end=250
camdata.dof.use_dof=True;camdata.dof.aperture_fstop=8
focus=bpy.data.objects.new('Focus plane',None);focus.location=(0,0,2.0 if args.variant=='desktop'else 2.55);s.collection.objects.link(focus);camdata.dof.focus_object=focus

def pose(frame):
 s.frame_set(frame)
 phase=2*math.pi*(frame-1)/120
 centerz=2.12 if args.variant=='desktop'else 2.7
 cam.location=(1.15+2.2*math.sin(phase),-12.1+.5*math.cos(phase),centerz+1.8+.3*math.sin(phase))
 aim(cam,(0,-.15,centerz))
 sweep.location=(-3.8+2.0*math.sin(phase),1.4,5.5+.3*math.cos(phase));aim(sweep,(0,0,2))
 # The letters keep one grounded assembly. A controlled perspective drift and
 # reflected strip provide physical motion without aimless spinning objects.
 root.rotation_euler.z=.06*math.sin(phase)

for frame in range(1,122):
 pose(frame)
 cam.keyframe_insert('location',frame=frame);cam.keyframe_insert('rotation_euler',frame=frame)
 sweep.keyframe_insert('location',frame=frame);sweep.keyframe_insert('rotation_euler',frame=frame);root.keyframe_insert('rotation_euler',frame=frame)
for ob in (cam,sweep,root):
 if ob.animation_data:
  for fc in ob.animation_data.action.fcurves if hasattr(ob.animation_data.action,'fcurves') else []:
   for keyframe in fc.keyframe_points:keyframe.interpolation='LINEAR'
pose(1)
bpy.ops.wm.save_as_mainfile(filepath=str(folder/'atelier-type-master.blend'))
info={'variant':args.variant,'engine':args.engine,'blender':bpy.app.version_string,'samples':args.samples,'resolution':[s.render.resolution_x,s.render.resolution_y],'fps':24,'frames':120,'duration_seconds':5,'source':'Original authored 3D text geometry, materials, lighting, animation and camera','font':'System Arial Bold rendered as glyph outlines; no font file distributed','loop':'120 periodic poses; pose121 equals pose1; chronological forward motion, no interpolation, no reverse','master':str(folder/'atelier-type-master.blend')}
(folder/'production.json').write_text(json.dumps(info,indent=2))
if args.mode=='build':sys.exit(0)
frames=[1,41,81] if args.mode=='proof' else list(range(int(args.frames.split(':')[0]),int(args.frames.split(':')[1])+1))
if args.mode=='proof':s.render.resolution_percentage=50
framesdir=folder/('proof'if args.mode=='proof'else'frames');framesdir.mkdir(exist_ok=True)
started=time.monotonic();timings=[]
for frame in frames:
 mem=available_gib()
 if mem is not None and mem<3:raise RuntimeError(f'Available memory {mem:.2f} GiB below 3 GiB floor; outputs preserved')
 path=framesdir/f'{frame:04}.png'
 if path.exists() and args.mode=='render':continue
 pose(frame);s.render.filepath=str(path);begin=time.monotonic();bpy.ops.render.render(write_still=True);elapsed=time.monotonic()-begin;timings.append(elapsed)
 print(json.dumps({'frame':frame,'seconds':round(elapsed,3),'available_gib_before':round(mem,2)if mem else None,'file':str(path)}),flush=True)
info['batch_seconds']=round(time.monotonic()-started,3);info['rendered_frames']=len(timings);info['mean_frame_seconds']=sum(timings)/max(1,len(timings));(folder/(args.mode+'-metrics.json')).write_text(json.dumps(info,indent=2))
