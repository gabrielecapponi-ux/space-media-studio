"""LUMA — original product-design CGI, authored geometry and periodic native motion.
Isolated Blender only. No downloaded model/texture. Silent rendered delivery.
"""
import bpy,sys,argparse,math,json,time,subprocess,hashlib
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
p=argparse.ArgumentParser();p.add_argument('--profile',choices=['desktop','mobile'],default='desktop');p.add_argument('--mode',choices=['proof','nativeproof','render','validate'],default='proof');p.add_argument('--frames',default='1:288');a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--'in sys.argv else [])
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'outputs/showcase-product-20261105'/a.profile;OUT.mkdir(parents=True,exist_ok=True)
W,H=(1920,1080)if a.profile=='desktop'else(720,900);FPS=48;N=288
bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.eevee.taa_render_samples=48;s.eevee.use_raytracing=True;s.eevee.ray_tracing_options.resolution_scale='2';s.eevee.use_fast_gi=True
s.render.resolution_x=W;s.render.resolution_y=H;s.render.resolution_percentage=100;s.render.fps=FPS;s.frame_start=1;s.frame_end=N;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8';s.render.film_transparent=False
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=-.2

def col(h):
 v=[int(h[i:i+2],16)/255 for i in(1,3,5)];return tuple(x/12.92 if x<=.04045 else((x+.055)/1.055)**2.4 for x in v)+(1,)
def mat(name,color,rough=.3,metal=0,coat=0,texture=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;b=n['Principled BSDF'];b.inputs['Base Color'].default_value=col(color);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal;b.inputs['Coat Weight'].default_value=coat
 if texture:
  q=n.new('ShaderNodeTexNoise');q.inputs['Scale'].default_value=150;u=n.new('ShaderNodeBump');u.inputs['Strength'].default_value=texture;u.inputs['Distance'].default_value=.014;m.node_tree.links.new(q.outputs['Fac'],u.inputs['Height']);m.node_tree.links.new(u.outputs['Normal'],b.inputs['Normal'])
 return m
def group(name,pos=(0,0,0),parent=None):
 ob=bpy.data.objects.new(name,None);s.collection.objects.link(ob);ob.location=pos;ob.parent=parent;return ob
def finish(ob,name,m,parent,pos):
 ob.name=name;ob.data.materials.append(m);ob.parent=parent;ob.location=pos;return ob
def box(name,dims,pos,m,parent=None,bevel=.04):
 bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Precision radii','BEVEL');mod.width=bevel;mod.segments=6;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
  for f in o.data.polygons:f.use_smooth=True
  o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
 return finish(o,name,m,parent,pos)
def cyl(name,r,d,pos,m,parent=None,axis='Y',bevel=.012,vertices=96):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d);o=bpy.context.object
 if axis=='Y':o.rotation_euler.x=math.pi/2
 b=o.modifiers.new('Machined lip','BEVEL');b.width=bevel;b.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 for f in o.data.polygons:f.use_smooth=True
 return finish(o,name,m,parent,pos)
def ring(name,r,minor,pos,m,parent=None):
 bpy.ops.mesh.primitive_torus_add(major_segments=96,minor_segments=12,major_radius=r,minor_radius=minor);o=bpy.context.object;o.rotation_euler.x=math.pi/2
 for f in o.data.polygons:f.use_smooth=True
 return finish(o,name,m,parent,pos)
def aim(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
def area(name,pos,power,size,target,color='#ffffff',height=None):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='RECTANGLE';d.size=size;d.size_y=height or size;d.color=col(color)[:3];o=bpy.data.objects.new(name,d);s.collection.objects.link(o);o.location=pos;aim(o,target);return o
def txt(body,name,size,pos,m,parent,align='LEFT',font=None):
 c=bpy.data.curves.new(name,'FONT');c.body=body;c.font=font or regular;c.size=size;c.align_x=align;c.extrude=.0008;c.bevel_depth=.0002;c.resolution_u=12;o=bpy.data.objects.new(name,c);s.collection.objects.link(o);o.location=pos;o.rotation_euler=(math.pi/2,0,0);o.parent=parent;o.data.materials.append(m);return o
regular=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial.ttf');bold=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial Bold.ttf')
graphite=mat('Ceramic graphite anodised shell','#222a2b',.27,.72,.25,.02);rubber=mat('Fine rubber grip','#141c1c',.7,0,0,.27);silver=mat('Satin titanium machining','#a4b3b6',.26,.93,.15);black=mat('Lens anodised black','#101719',.23,.75,.25);yellow=mat('Signal yellow enamel','#dfff00',.25,.25,.4);white=mat('Laser white lettering','#dfe5df',.65);floor=mat('Warm photographic sweep','#e2e5df',.38);glass=mat('Coated optical glass','#153d48',.08,.7,.65)
glass.node_tree.nodes['Principled BSDF'].inputs['Coat Roughness'].default_value=.035
nodes=glass.node_tree.nodes;links=glass.node_tree.links;layer=nodes.new('ShaderNodeLayerWeight');layer.inputs['Blend'].default_value=.35;ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.1;ramp.color_ramp.elements[0].color=col('#193943');ramp.color_ramp.elements[1].position=.9;ramp.color_ramp.elements[1].color=col('#020b10');links.new(layer.outputs['Facing'],ramp.inputs['Fac']);links.new(ramp.outputs['Color'],nodes['Principled BSDF'].inputs['Base Color'])
s.world=bpy.data.worlds.new('Photographic studio');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs['Color'].default_value=col('#c6d3d3');s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.34
box('Cyclorama',(200,200,.12),(0,0,-.10),floor,bevel=0)
root=group('LUMA studio camera',(0,0,-.045));parts=[]
body=box('Unibody magnesium enclosure',(3.8,1.1,2.15),(0,0,1.18),graphite,root,.20)
box('Wrapped tactile handgrip',(.91,.20,1.73),(1.36,-.55,1.10),rubber,root,.16)
box('Front lens support plate',(2.12,.09,1.78),(-.20,-.575,1.08),black,root,.16)
box('Titanium top plate',(3.56,1.04,.19),(0,0,2.21),silver,root,.09)
box('Signal yellow shoulder',(.85,1.01,.20),(-1.27,0,2.22),yellow,root,.08)
# Real viewfinder glass and surround, with independent front lens highlights.
box('Viewfinder housing',(.56,.15,.35),(-1.28,-.597,1.81),black,root,.06)
box('Viewfinder coated glass',(.40,.025,.20),(-1.28,-.682,1.82),glass,root,.028)
txt('LUMA','Original LUMA logotype',.235,(-.86,-.636,1.84),white,root,font=bold)
txt('STUDIO EDITION','Edition engraving',.063,(-1.70,-.559,.34),white,root)
for i,x in enumerate([-.65,.33,1.18]):
 d=cyl('Tactile top dial '+str(i),.27 if i<2 else .18,.15,(x,0,2.38),black,root,axis='Z')
 for j in range(28):
  angle=j*2*math.pi/28;r=.274 if i<2 else .184
  q=box('Fine dial knurl '+str(i)+' '+str(j),(.025,.022,.115),(x+r*math.cos(angle),r*math.sin(angle),2.38),silver if i==2 else graphite,root,.004);q.rotation_euler.z=angle
 if i==2:cyl('Yellow shutter button',.115,.028,(x,0,2.468),yellow,root,axis='Z',bevel=.01)
# Strap anchors, screw recesses and lower feet anchor the scale.
for x in[-1.89,1.89]:box('Recessed strap lug',(.12,.29,.21),(x,.05,1.89),silver,root,.045)
for x in[-1.65,1.65]:
 cyl('Front torx screw',.034,.018,(x,-.557,.27),silver,root,vertices=32,bevel=.003)
 box('Grounded rubber foot',(.60,.64,.10),(x*.70,0,.055),rubber,root,.03)
def annulus(name,outer,inner,depth,m,parent):
 count=96;verts=[]
 for radius,y in[(outer,-depth/2),(outer,depth/2),(inner,-depth/2),(inner,depth/2)]:
  verts.extend((radius*math.cos(i*2*math.pi/count),y,radius*math.sin(i*2*math.pi/count))for i in range(count))
 faces=[]
 for aa,bb in[(0,1),(2,0),(1,3),(3,2)]:
  for i in range(count):faces.append((aa*count+i,aa*count+(i+1)%count,bb*count+(i+1)%count,bb*count+i))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();ob=bpy.data.objects.new(name,mesh);s.collection.objects.link(ob);ob.parent=parent;ob.data.materials.append(m)
 for f in mesh.polygons:f.use_smooth=True
 be=ob.modifiers.new('Machined barrel edges','BEVEL');be.width=.009;be.segments=3;ob.modifiers.new('Machined barrel normals','WEIGHTED_NORMAL');return ob
# Three physically separate optical groups travel along one optical axis.
optical_x=-.20;optical_z=1.09
sensor=box('Sensor visible within lens mount',(.86,.024,.62),(optical_x,-.66,optical_z),glass,root,.03)
mount=cyl('Fixed bayonet mount',.79,.16,(optical_x,-.65,optical_z),silver,root)
# A black diaphragm conceals the mount centre when assembled.
cyl('Rear dark optical cavity',.70,.02,(optical_x,-.741,optical_z),black,root)
for index,(y,r,depth)in enumerate([(-.93,.76,.31),(-1.255,.715,.32),(-1.55,.675,.24)]):
 parent=group('Optical group '+str(index),(optical_x,y,optical_z),root);parts.append((parent,y,index))
 annulus('Precision hollow barrel '+str(index),r,r-.12,depth,black,parent)
 ring('Titanium edge '+str(index),r-.005,.012,(0,-depth*.5+.012,0),silver,parent)
 ring('Optic rubber focus ring '+str(index),r+.007,.021,(0,.015,0),rubber,parent)
 for j in range(64):
  angle=2*math.pi*j/64
  ob=box('Barrel focus ridge '+str(index)+' '+str(j),(.014,.085,.028),((r+.005)*math.cos(angle),.005,(r+.005)*math.sin(angle)),graphite,parent,.003);ob.rotation_euler.y=math.pi/2-angle
 if index==2:
  bpy.ops.mesh.primitive_uv_sphere_add(segments=96,ring_count=48,radius=.553);lens=bpy.context.object;lens.scale=(1,.22,1);finish(lens,'Curved multi-coated optical element',glass,parent,(0,-.015,0))
  for polygon in lens.data.polygons:polygon.use_smooth=True
  ring('Front optical perimeter',.59,.025,(0,-.145,0),black,parent)
  # Concentric anti-reflection layers provide a real optical read, not a flat screen.
  for j in range(2):ring('Optical internal reflection '+str(j),.28+j*.12,.0035,(0,-.110,0),black,parent)
  ring('Yellow lens index',.663,.012,(0,-.092,0),yellow,parent)
light=area('Travelling softbox',(-4,-5,7),1200,4.3,(0,0,1.3),'#fff4d8',6)
area('Cool narrow edge',(4,2,6),1100,2.6,(0,0,1.4),'#e6f4ff',6)
area('Front card reflection',(-1,-7,4),650,2.2,(0,-1,1.3),'#ffffff',4)
area('Overhead broad fill',(0,4,8),1100,5,(0,0,1))
d=bpy.data.cameras.new('Cinematic 65mm');camera=bpy.data.objects.new('LUMA camera',d);s.collection.objects.link(camera);s.camera=camera;d.lens=65;d.clip_start=.1;d.clip_end=300;d.dof.use_dof=True;d.dof.aperture_fstop=10;focus=group('Focus plane',(0,-.45,1.35));d.dof.focus_object=focus

def ease(x):
 x=max(0,min(1,x));return x*x*x*(10+x*(-15+6*x))
def window(t,start,rise,end,fall):return ease((t-start)/rise)*(1-ease((t-end)/fall))
def pose(frame):
 s.frame_set(frame);t=(frame-1)/FPS;open=window(t,.45,1.6,3.65,1.7);orbit=window(t,.15,2.5,3.1,2.5)
 for ob,y,i in parts:ob.location=(optical_x,y-(i+1)*.44*open,optical_z);ob.rotation_euler=(0,-.065*(i+1)*open,0)
 root.rotation_euler.z=-.055*orbit
 target=Vector((0,-.55-.38*open,1.32));base=Vector((7.4,-13.6,7.1)) if a.profile=='desktop' else Vector((5.8,-10.8,5.9));theta=.09*orbit
 camera.location=Vector((base.x*math.cos(theta)-base.y*math.sin(theta),base.x*math.sin(theta)+base.y*math.cos(theta),base.z));aim(camera,target)
 light.location=(-4+2*orbit,-5,7);aim(light,(0,0,1.3))
for f in range(1,N+2):
 pose(f)
 for ob in[camera,root,light]+[x[0]for x in parts]:ob.keyframe_insert('location',frame=f);ob.keyframe_insert('rotation_euler',frame=f)
for ob in[camera,root,light]+[x[0]for x in parts]:
 if ob.animation_data and ob.animation_data.action:
  for layer in ob.animation_data.action.layers:
   for strip in layer.strips:
    bag=strip.channelbag(ob.animation_data.action_slot)
    for fc in bag.fcurves:
     for k in fc.keyframe_points:k.interpolation='LINEAR'
pose(1);master=OUT/'showcase-product.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master))
# Every object and moving part is checked through the full native cycle.
bounds=[1.,1.,1.,1.];optical_gaps=[];transforms={}
for f in range(1,N+2):
 s.frame_set(f);bpy.context.view_layer.update()
 if f in[1,145,289]:transforms[f]=[[float(v)for row in o.matrix_world for v in row]for o in[camera,root,light]+[q[0]for q in parts]]
 for ob in s.objects:
  if ob.type not in{'MESH','FONT'}or ob.name=='Cyclorama':continue
  coords=[world_to_camera_view(s,camera,ob.matrix_world@Vector(v))for v in ob.bound_box];margins=[min(v.x for v in coords),min(1-v.x for v in coords),min(v.y for v in coords),min(1-v.y for v in coords)];bounds=[min(v,q)for v,q in zip(bounds,margins)]
 # Optical groups stay in the same order, with non-intersecting barrel bodies.
 front=[(ob.location.y,depth)for(ob,_,_),depth in zip(parts,[.31,.32,.24])]
 optical_gaps.extend(front[i][0]-front[i][1]/2-(front[i+1][0]+front[i+1][1]/2)for i in range(2))
err=max(abs(x-y)for v,w in zip(transforms[1],transforms[289])for x,y in zip(v,w));change=max(abs(x-y)for v,w in zip(transforms[1],transforms[145])for x,y in zip(v,w));assert min(bounds)>.025,(bounds,a.profile);assert min(optical_gaps)>=-.0001,min(optical_gaps);assert err<1e-5 and change>.4,(err,change)
s.frame_set(1);bpy.context.view_layer.update();feet=[o for o in s.objects if o.name.startswith('Grounded rubber foot')];ground_gaps=[min((o.matrix_world@Vector(v)).z for v in o.bound_box)+.04 for o in feet];assert max(abs(x)for x in ground_gaps)<.00001,ground_gaps
report={'ground_contact_gaps':ground_gaps,'all_pose_count':289,'safe_frame_margins':bounds,'optical_group_minimum_gap':min(optical_gaps),'periodic_transform_error':err,'observed_transform_change':change,'objects':len(s.objects),'meshes':len([o for o in s.objects if o.type=='MESH']),'engine':s.render.engine,'blender':bpy.app.version_string,'samples':48,'native':[W,H],'fps':FPS,'frames':N,'passed':True};(OUT/'scene-check.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True)
if a.mode=='validate':sys.exit(0)
frames=[1,145,288]if a.mode in['proof','nativeproof']else range(int(a.frames.split(':')[0]),int(a.frames.split(':')[1])+1)
folder=OUT/('frames'if a.mode=='render'else'native-proof');folder.mkdir(exist_ok=True)
if a.mode=='proof':s.render.resolution_percentage=50
if a.mode=='render':
 # Keep one native animation render context. The keyed scene is identical to
 # the inspected stills; a resumed render begins at the first missing PNG.
 pending=[f for f in frames if not(folder/f'{f:04}.png').exists()]
 if pending:
  s.frame_start=min(pending);s.frame_end=max(frames);s.render.filepath=str(folder)+'/'
  s.render.use_file_extension=True;s.render.use_overwrite=False
  start=time.monotonic();bpy.ops.render.render(animation=True)
  print(json.dumps({'native_animation_range':[s.frame_start,s.frame_end],'seconds':time.monotonic()-start}),flush=True)
 sys.exit(0)
for f in frames:
 file=folder/f'{f:04}.png'
 if file.exists()and a.mode=='render':continue
 s.frame_set(f);bpy.context.view_layer.update();s.render.filepath=str(file);start=time.monotonic();bpy.ops.render.render(write_still=True);print(json.dumps({'frame':f,'seconds':time.monotonic()-start}),flush=True)
