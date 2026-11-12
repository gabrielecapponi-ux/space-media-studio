"""SHIFT campaign: physical sampler and three animated graphite campaign panels.
Original scene geometry, original campaign artwork; native Cycles sequence.
"""
import bpy, math, argparse, sys, json, hashlib, time
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
P=Path(__file__).resolve().parents[2]; O=P/'outputs/campaign-cinema-20261112'; O.mkdir(parents=True,exist_ok=True)
p=argparse.ArgumentParser();p.add_argument('--profile',choices=['desktop','portrait'],default='desktop');p.add_argument('--mode',choices=['build','proof'],default='build');p.add_argument('--width',type=int,default=1280);p.add_argument('--samples',type=int,default=20);p.add_argument('--frames',default='1,161,321');a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
source=P/'outputs/flagship-20261106/shift/phase-01.blend';bpy.ops.wm.open_mainfile(filepath=str(source));s=bpy.context.scene
for ob in list(s.objects):
 ob.animation_data_clear()
 if ob.type in {'LIGHT','CAMERA'} or ob.name=='Seamless studio sweep':bpy.data.objects.remove(ob,do_unlink=True)
for m in bpy.data.materials:m.animation_data_clear()
s.animation_data_clear();s.render.engine='CYCLES';s.render.use_persistent_data=True;s.render.threads_mode='FIXED';s.render.threads=3
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
s.cycles.device='GPU';s.cycles.samples=a.samples;s.cycles.max_bounces=6;s.cycles.transmission_bounces=4;s.cycles.use_denoising=True;s.cycles.use_adaptive_sampling=True;s.cycles.adaptive_threshold=.04;s.cycles.seed=23;s.cycles.use_animated_seed=False
if hasattr(s.cycles,'denoising_use_gpu'):s.cycles.denoising_use_gpu=True
s.render.use_motion_blur=True;s.render.motion_blur_shutter=.24
FPS=60 if a.profile=='desktop' else 30;N=FPS*8;s.render.fps=FPS;s.frame_start=1;s.frame_end=N
s.render.resolution_x=a.width;s.render.resolution_y=round(a.width*9/16) if a.profile=='desktop' else round(a.width*5/4);s.render.resolution_percentage=100
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8';s.render.image_settings.compression=30;s.render.film_transparent=False
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=.05
s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.22,.25,.28,1);s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.12

def empty(name,parent=None,loc=(0,0,0)):
 ob=bpy.data.objects.new(name,None);s.collection.objects.link(ob);ob.parent=parent;ob.location=loc;return ob

def parent_keep(ob,parent):
 world=ob.matrix_world.copy();ob.parent=parent;ob.matrix_world=world

def aim(ob,target):ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()

def color(h):
 c=[int(h[i:i+2],16)/255 for i in (0,2,4)];return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c)+(1,)

def material(name,h,metal=0,rough=.4):
 m=bpy.data.materials.new(name);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=color(h);bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough;return m

def box(name,loc,dim,mat,bevel=.02):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);ob=bpy.context.object;ob.name=name;ob.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);ob.data.materials.append(mat)
 if bevel:
  mod=ob.modifiers.new('Physical edge radius','BEVEL');mod.width=bevel;mod.segments=3;mod.affect='EDGES';mod=ob.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL');mod.keep_sharp=True
 return ob

products=[o for o in s.objects if o.type in {'MESH','CURVE','FONT'}];root=empty('CAMPAIGN / physical SHIFT sampler')
bpy.context.view_layer.update()
for o in products:parent_keep(o,root)
bpy.context.view_layer.update();wheel=empty('CAMPAIGN / main wheel pivot',root,(1.956,-.53,.763));bpy.context.view_layer.update()
for ob in list(root.children):
 if ob.name.startswith(('Inertial encoder wheel','Concentric dial machining','Wheel index insert')):parent_keep(ob,wheel)
pads=[]
for num in range(1,17):
 ob=s.objects['Performance pad %02d'%num];rig=empty('CAMPAIGN / pad pivot %02d'%num,root,ob.location.copy());bpy.context.view_layer.update();parent_keep(ob,rig)
 for text in list(root.children):
  if text.type=='FONT' and text.data.body=='%02d'%num and abs(text.location.x-rig.location.x)<.3 and abs(text.location.y-rig.location.y)<.3:parent_keep(text,rig)
 pads.append((rig,rig.location.copy()))
# A real curved cove prevents a visible floor/horizon edge in both aspect ratios.
floor=material('CAMPAIGN / charcoal photographic cove','101514',.08,.46)
section=[(-35,0),(7,0)];radius=5
section += [(7+radius*math.sin(math.pi*.5*j/48),radius*(1-math.cos(math.pi*.5*j/48)))for j in range(1,49)];section.append((12,30))
vertices=[]
for y,z in section:vertices.extend([(-40,y,z),(40,y,z)])
faces=[(2*j,2*j+1,2*j+3,2*j+2)for j in range(len(section)-1)];mesh=bpy.data.meshes.new('Campaign studio cove');mesh.from_pydata(vertices,[],faces);mesh.update();cove=bpy.data.objects.new('CAMPAIGN / seamless studio',mesh);s.collection.objects.link(cove);mesh.materials.append(floor)
for f in mesh.polygons:f.use_smooth=True
graphite=material('CAMPAIGN / graphite substrate and sides','121715',.42,.36)
prints=P/'outputs/campaign-web-revision-20261110/campaign/prints';panels=[];art=[]
for name,w,h in [('story',1.8,3.2),('square',2.8,2.8),('banner',4.1,2.30625)]:
 path=prints/(name+'.png');m=material('CAMPAIGN / '+name+' printed face','ffffff',0,.5);bs=m.node_tree.nodes.get('Principled BSDF');tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(path));tex.image.pack();tex.extension='EXTEND';m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color']);bs.inputs['Specular IOR Level'].default_value=.22;bs.inputs['Coat Weight'].default_value=.08;bs.inputs['Coat Roughness'].default_value=.4
 # Printing extends over the complete front; every side and back is graphite.
 ob=box('CAMPAIGN / '+name+' physical plate',(0,0,0),(w,.055,h),graphite,.012);ob.data.materials.append(m)
 uv=ob.data.uv_layers.active or ob.data.uv_layers.new(name='Print UV')
 for poly in ob.data.polygons:
  poly.material_index=1 if poly.normal.y<-.5 else 0
  for li in poly.loop_indices:
   v=ob.data.vertices[ob.data.loops[li].vertex_index].co;uv.data[li].uv=(v.x/w+.5,v.z/h+.5)
 ob.modifiers['Physical edge radius'].material=0
 panels.append(ob);art.append({'file':str(path.relative_to(P)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
# Broad studio silks and a restrained orange rim reveal machined metal and black sides.
def light(name,pos,target,w,h,power,tint):
 d=bpy.data.lights.new(name,'AREA');d.shape='RECTANGLE';d.size=w;d.size_y=h;d.energy=power;d.color=tint;ob=bpy.data.objects.new(name,d);s.collection.objects.link(ob);ob.location=pos;aim(ob,target)
light('CAMPAIGN / overhead silk',(-3,-4,10),(0,0,1.3),7,5,1700,(1,.97,.90))
light('CAMPAIGN / cool edge',(6,3,7),(0,0,2),4,7,1400,(.78,.88,1))
light('CAMPAIGN / warm rim',(-7,3,6),(0,0,2),2,6,1100,(1,.62,.38))
light('CAMPAIGN / printed face fill',(0,-8,5),(0,2,3),6,5,550,(1,1,1))
light('CAMPAIGN / low strip',(1,-5,2),(0,0,1),5,.7,220,(1,.90,.72))
data=bpy.data.cameras.new('CAMPAIGN / cinema camera');cam=bpy.data.objects.new('CAMPAIGN / cinema camera',data);s.collection.objects.link(cam);s.camera=cam;data.lens=46;data.sensor_width=36;data.clip_start=.05;data.clip_end=200;data.dof.use_dof=False
playhead=s.objects['Display playhead'];playhead_base=playhead.location.copy()
watched=[root,wheel,cam,playhead]+panels+[r for r,_ in pads]

def pose(f):
 ph=math.tau*(f-1)/N;breath=.5-.5*math.cos(ph);arc=math.sin(ph)
 # Every animation is analytic and periodic, including the extra blur guard frames.
 if a.profile=='desktop':
  root.location=(.18*arc,-.65,1.13+.08*math.sin(ph*2));root.scale=(.72,)*3;root.rotation_euler=(math.radians(20+3*math.sin(ph)),math.radians(3*math.sin(ph*2)),math.radians(-7-13*arc))
  targets=[(-3.5-.35*breath,2.1,2.25+.1*math.sin(ph)),(3.2+.35*breath,2.35,2.35+.14*math.sin(ph+.8)),(0,3.65,4.15+.1*math.sin(ph+1.5))]
  turns=[math.radians(-10-20*breath),math.radians(10+17*breath),math.radians(-3+10*arc)]
  cam.location=(2.6*math.sin(ph-.35),-13.4+.45*breath,8.0-.55*breath);aim(cam,(0,.9,2.28));data.lens=38.5+1.5*breath
 else:
  root.location=(.12*arc,-1.2,1.25+.075*math.sin(ph*2));root.scale=(.66,)*3;root.rotation_euler=(math.radians(28+3*math.sin(ph)),math.radians(2*math.sin(ph*2)),math.radians(-7-11*arc))
  targets=[(-2.2-.15*breath,1.9,3.45+.10*math.sin(ph)),(1.65+.15*breath,2.15,3.25+.12*math.sin(ph+.8)),(0,3.3,5.8+.09*math.sin(ph+1.5))]
  turns=[math.radians(-10-15*breath),math.radians(13+15*breath),math.radians(-2+8*arc)]
  cam.location=(1.2*math.sin(ph-.35),-14.0+.25*breath,8.2-.35*breath);aim(cam,(0,1.05,2.7));data.lens=52.5+1.5*breath
 for i,ob in enumerate(panels):ob.location=targets[i];ob.rotation_euler=(math.radians(-6+2*math.sin(ph+i)),0,turns[i])
 wheel.rotation_euler.z=math.radians(150)*math.sin(ph)
 playhead.location=playhead_base+Vector((1.25*math.sin(ph),0,0))
 for i,(rig,base) in enumerate(pads):rig.location=base+Vector((0,0,-.032*(.5+.5*math.cos(ph*2-i*.62))**12))
 return ph

for f in range(-1,N+4):
 pose(f)
 for ob in watched:
  ob.keyframe_insert('location',frame=f);ob.keyframe_insert('rotation_euler',frame=f);ob.keyframe_insert('scale',frame=f)
 data.keyframe_insert('lens',frame=f)
for action in bpy.data.actions:
 for layer in action.layers:
  for strip in layer.strips:
   if hasattr(strip,'channelbag'):
    for slot in action.slots:
     bag=strip.channelbag(slot)
     if bag:
      for fc in bag.fcurves:
       for k in fc.keyframe_points:k.interpolation='LINEAR'
s.frame_set(1);bpy.ops.file.pack_all();master=O/('campaign-cinema-'+a.profile+'.blend');bpy.ops.wm.save_as_mainfile(filepath=str(master))
# Geometry and projected framing are measured independently of the render.
framing=[]
for f in [1,1+N//4,1+N//2,1+3*N//4,N+1]:
 s.frame_set(f);bpy.context.view_layer.update()
 for group,obs in [('sampler',products)]+[(o.name,[o])for o in panels]:
  pts=[o.matrix_world@Vector(p)for o in obs for p in o.bound_box];q=[world_to_camera_view(s,cam,v)for v in pts];framing.append({'frame':f,'group':group,'screen':[min(v.x for v in q),max(v.x for v in q),min(v.y for v in q),max(v.y for v in q)],'min_world_z':min(v.z for v in pts)})
report={'source':str(source.relative_to(P)),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'master':str(master.relative_to(P)),'master_sha256':hashlib.sha256(master.read_bytes()).hexdigest(),'profile':a.profile,'frames':N,'fps':FPS,'native':True,'method':'True Blender Cycles geometry for sampler and physical printed boards; packed original campaign art.','objects':len(s.objects),'geometry_vertices':sum(len(o.data.vertices)for o in s.objects if o.type=='MESH'),'artwork':art,'framing':framing,'samples':a.samples,'engine':'CYCLES','timings':[]}
if a.mode=='proof':
 folder=O/('proof-'+a.profile);folder.mkdir(exist_ok=True)
 for f in [int(x)for x in a.frames.split(',')]:
  s.frame_set(f);s.render.filepath=str(folder/f'{f:04d}.png');tick=time.monotonic();bpy.ops.render.render(write_still=True);report['timings'].append({'frame':f,'seconds':time.monotonic()-tick})
(O/('build-'+a.profile+'.json')).write_text(json.dumps(report,indent=2)+'\n');print('CAMPAIGN_BUILT',a.profile,len(s.objects),a.mode,flush=True)
