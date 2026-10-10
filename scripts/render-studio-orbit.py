"""Original Space motion study. No external models, textures or paid generation."""
import bpy, math, json, os, sys
from mathutils import Vector, Euler, Quaternion
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
out=Path(args[0] if args else 'outputs/studio-orbit').resolve(); out.mkdir(parents=True, exist_ok=True)
preview='--preview' in args
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=32; scene.cycles.use_denoising=True
scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.denoising_use_gpu=True;scene.cycles.denoising_quality='HIGH';scene.cycles.denoising_prefilter='ACCURATE'
scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.045
scene.cycles.max_bounces=6;scene.cycles.diffuse_bounces=2;scene.cycles.glossy_bounces=4;scene.cycles.transmission_bounces=2
scene.render.use_persistent_data=True
prefs=bpy.context.preferences.addons['cycles'].preferences
try:
 prefs.compute_device_type='METAL'; prefs.get_devices()
 for d in prefs.devices: d.use=d.type=='METAL'
 scene.cycles.device='GPU'
except Exception: scene.cycles.device='CPU'
scene.render.resolution_x=960 if preview else 1920; scene.render.resolution_y=540 if preview else 1080; scene.render.resolution_percentage=100
scene.render.fps=24; scene.frame_start=1; scene.frame_end=144; scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGB'
scene.render.film_transparent=False; scene.render.use_motion_blur=True; scene.render.motion_blur_shutter=.25
scene.view_settings.view_transform='Khronos PBR Neutral'; scene.view_settings.exposure=-.35; scene.world.color=(.02,.025,.03)
scene.world.use_nodes=True; scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.009,.012,.016,1); scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35

def material(name,color,metal=0,rough=.25):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Metallic'].default_value=metal;n.inputs['Roughness'].default_value=rough;n.inputs['Coat Weight'].default_value=.3;return m
chrome=material('Brushed polished platinum',(.68,.72,.77),1,.17)
lime=material('Space lime enamel',(.56,.81,.001),.08,.3)
graphite=material('Graphite lacquer',(.009,.012,.018),.45,.24)
floorMat=material('Obsidian stage',(.007,.009,.012),0,.58)
floorMat.node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value=0

def look(obj,point): obj.rotation_euler=(Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()
def light(name,loc,energy,color,size,target=(0,0,1),size_y=None):
 data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.color=color;data.shape='RECTANGLE';data.size=size;data.size_y=size_y or size
 ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=loc;look(ob,target);return ob
light('Large left silk',(-5,-3,7),1500,(1,.98,.94),5,size_y=7)
light('Right strip',(4,-.5,4.2),1100,(.86,.92,1),1.1,size_y=5)
light('Top softbox',(0,1,7),1800,(1,1,1),4,size_y=3)
light('Back edge',(0,4,3),850,(.93,1,.77),3,size_y=4)
light('Front long reflection',(-.5,-7,2),550,(1,1,1),5,size_y=.7)
# Reused sculpted hollow arc, with a softened elliptical cross-section.
verts=[];faces=[];majorSteps=64;minorSteps=12
for i in range(majorSteps+1):
 a=math.radians(2)+i/majorSteps*math.radians(41)
 for j in range(minorSteps):
  b=j/minorSteps*2*math.pi;r=1.65+math.cos(b)*.19
  verts.append((r*math.cos(a),r*math.sin(a),math.sin(b)*.16))
for i in range(majorSteps):
 for j in range(minorSteps):
  k=i*minorSteps+j;jn=(j+1)%minorSteps
  faces.append((k,i*minorSteps+jn,(i+1)*minorSteps+jn,k+minorSteps))
faces.append(tuple(reversed(range(minorSteps))));faces.append(tuple(majorSteps*minorSteps+j for j in range(minorSteps)))
mesh=bpy.data.meshes.new('One authored curved segment');mesh.from_pydata(verts,[],faces);mesh.update()
parts=[]
for i in range(8):
 ob=bpy.data.objects.new('Orbit segment %02d'%i,mesh.copy());scene.collection.objects.link(ob);ob.data.materials.append(lime if i in (1,4,6) else chrome if i%2==0 else graphite)
 for p in ob.data.polygons:p.use_smooth=True
 bevel=ob.modifiers.new('Fine machined ends','BEVEL');bevel.width=.035;bevel.segments=3
 ob.rotation_mode='QUATERNION'; parts.append(ob)
bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=32,radius=.52,location=(0,0,1.9));core=bpy.context.object;core.name='Lime nucleus';core.data.materials.append(lime)
for p in core.data.polygons:p.use_smooth=True
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.34));floor=bpy.context.object;floor.data.materials.append(floorMat)
camData=bpy.data.cameras.new('Cinema lens');camera=bpy.data.objects.new('Cinema lens',camData);scene.collection.objects.link(camera);scene.camera=camera;camData.lens=44;camData.dof.use_dof=True;camData.dof.aperture_fstop=6.3
focus=bpy.data.objects.new('Focus',None);scene.collection.objects.link(focus);focus.location=(0,0,1.8);camData.dof.focus_object=focus
# Closed periodic gesture: one complete sculpture/assembly passage in six seconds.
base = Euler((math.radians(68),math.radians(16),math.radians(-12))).to_quaternion()
for frame in range(1,146):
 t=(frame-1)/144*2*math.pi
 bloom=(1-math.cos(t))*.5
 for i,ob in enumerate(parts):
  angle=i/8*2*math.pi
  mid = angle + math.radians(22.5)
  offset = base @ Vector((math.cos(mid)*bloom*.92,math.sin(mid)*bloom*.92,math.sin(angle*2)*bloom*.32))
  ob.location = Vector((0,0,1.9)) + offset
  ob.rotation_quaternion = base @ Quaternion((0,0,1),angle + math.sin(t)*.14) @ Quaternion((1,0,0),bloom*.48*(-1 if i%2 else 1))
  ob.scale=(1,1,1)
  for path in ('location','rotation_quaternion','scale'):ob.keyframe_insert(data_path=path,frame=frame)
 core.scale=(1-bloom*.35,)*3;core.keyframe_insert(data_path='scale',frame=frame)
 camera.location=(8.4+math.sin(t)*.28,-11,6.7+math.sin(t)*.15);look(camera,(0,0,1.65));camera.keyframe_insert(data_path='location',frame=frame);camera.keyframe_insert(data_path='rotation_euler',frame=frame)
# Exact matching loop boundaries, with smooth periodic motion (no time-reversed video).
scene.frame_set(1); bpy.ops.wm.save_as_mainfile(filepath=str(out/'studio-orbit.blend'))
manifest={'title':'Space / Motion study 02','source':'Original procedural Blender geometry, materials, lighting and camera','blender':bpy.app.version_string,'engine':'CYCLES','samples':32,'device':scene.cycles.device,'fps':24,'frames':144,'width':scene.render.resolution_x,'height':scene.render.resolution_y,'preview':preview,'loop':'Periodically authored absolute poses; six seconds, no reversed footage'}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
if preview:
 for frame in (1,37,73,109):
  scene.frame_set(frame);scene.render.filepath=str(out/('preview-%03d.png'%frame));bpy.ops.render.render(write_still=True)
else:
 (out/'frames').mkdir(exist_ok=True)
 scene.render.filepath=str(out/'frames'/'orbit_');bpy.ops.render.render(animation=True)
print('STUDIO_ORBIT',json.dumps(manifest))
