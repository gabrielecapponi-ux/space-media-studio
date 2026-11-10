"""Save the editable 3D staging and calibrated camera matching render.py.
Run with Blender --background --python-exit-code 1 --python this_file.
The final web film is made by the documented projective renderer, not Cycles.
"""
from pathlib import Path
import sys,importlib.util,json,math
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'outputs/campaign-web-revision-20261110/campaign'
from math import sin,cos,sqrt
from types import SimpleNamespace
scene_data=json.loads((OUT/'scene.json').read_text())
def surface(center,w,h,yaw=0,pitch=0,depth=.1):
 x,y,z=center
 def at(dx,dy,dz):
  yp=dy*cos(pitch)-dz*sin(pitch);zp=dy*sin(pitch)+dz*cos(pitch)
  return (x+dx*cos(yaw)+zp*sin(yaw),y+yp,z-dx*sin(yaw)+zp*cos(yaw))
 return tuple([at(a*w*.5,b*h*.5,d) for a,b in ((-1,1),(1,1),(1,-1),(-1,-1))] for d in [0,-depth])
def projection(size,eye,target,focal):
 dot=lambda a,b:sum(x*y for x,y in zip(a,b))
 sub=lambda a,b:tuple(x-y for x,y in zip(a,b))
 cross=lambda a,b:(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
 unit=lambda a:tuple(v/sqrt(dot(a,a)) for v in a)
 forward=unit(sub(target,eye));right=unit(cross(forward,(0,1,0)));up=cross(right,forward)
 def project(p):
  ray=sub(p,eye);z=dot(ray,forward);return(size[0]*.5+focal*dot(right,ray)/z,size[1]*.5-focal*dot(up,ray)/z)
 return project
module=SimpleNamespace(surface=surface,projection=projection)
def point(p):return (p[0],-p[2],p[1])
def material(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.68;return m
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12
edge=material('Graphite — no ivory edge',(.017,.021,.019));stand=material('Anodised dark supports',(.025,.031,.026));floor=material('Studio sweep',(.032,.040,.033))
for profile in ['desktop','mobile']:
 if profile=='mobile':
  bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 data=scene_data[profile];model=SimpleNamespace(nodes=data['nodes'],size=data['size'],scene=lambda n:data['poses'][n%600])
 for name,(x,y,z,w,angle) in model.nodes.items():
  h=w/{'story':9/16,'square':1,'banner':16/9}[name];front,rear=module.surface((x,y,z),w,h,angle,-.012,.055)
  vertices=[point(p) for p in front+rear];faces=[(3,2,1,0),(4,5,6,7)]+[(i,(i+1)%4,(i+1)%4+4,i+4) for i in range(4)]
  mesh=bpy.data.meshes.new(name+' solid print');mesh.from_pydata(vertices,[],faces);mesh.update();obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj)
  tex=bpy.data.materials.new(name+' print');tex.use_nodes=True;nodes=tex.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');im=nodes.new('ShaderNodeTexImage');im.image=bpy.data.images.load(str(OUT/'prints'/f'{name}.png'));im.image.pack();tex.node_tree.links.new(im.outputs['Color'],em.inputs['Color']);tex.node_tree.links.new(em.outputs[0],out.inputs['Surface']);mesh.materials.append(tex);mesh.materials.append(edge)
  for p in mesh.polygons:p.material_index=0 if p.index==0 else 1
  uv=mesh.uv_layers.new(name='Native print UV');corners=[(0,1),(1,1),(1,0),(0,0)]
  for poly in mesh.polygons:
   for index in poly.loop_indices:uv.data[index].uv=corners[mesh.loops[index].vertex_index%4]
  for kind,centre,ww,hh,depth in [('stem',(x,(y-h/2)/2,z-.11),w*.13,y-h/2,.15),('foot',(x,.035,z-.06),w*.36,.07,.4)]:
   f,r=module.surface(centre,ww,hh,angle,0,depth);m=bpy.data.meshes.new(name+kind);m.from_pydata([point(p) for p in f+r],[],faces);m.update();o=bpy.data.objects.new(name+' '+kind,m);scene.collection.objects.link(o);m.materials.append(stand)
 camera_data=bpy.data.cameras.new('Campaign camera');camera=bpy.data.objects.new('Campaign camera',camera_data);scene.collection.objects.link(camera);scene.camera=camera
 camera_data.sensor_fit='VERTICAL';camera_data.sensor_height=24;scene.render.resolution_x=model.size[0];scene.render.resolution_y=model.size[1];scene.render.resolution_percentage=100;scene.render.fps=60;scene.frame_start=1;scene.frame_end=600
 for frame in range(601):
  _,eye,target,focal=model.scene(frame);camera.location=point(eye);camera.rotation_euler=(Vector(point(target))-camera.location).to_track_quat('-Z','Y').to_euler();camera_data.lens=focal/model.size[1]*24
  camera.keyframe_insert('location',frame=frame+1);camera.keyframe_insert('rotation_euler',frame=frame+1);camera_data.keyframe_insert('lens',frame=frame+1)
 for action in bpy.data.actions:
  for layer in action.layers:
   for strip in layer.strips:
    if hasattr(strip,'channelbag'):
     for slot in action.slots:
      bag=strip.channelbag(slot)
      if bag:
       for curve in bag.fcurves:
        for k in curve.keyframe_points:k.interpolation='LINEAR'
 calibration=[]
 for n in [0,120,210,360,510,600]:
  scene.frame_set(n+1);_,eye,target,focal=model.scene(n);project=module.projection(model.size,eye,target,focal)
  for name,(x,y,z,w,angle) in model.nodes.items():
   h=w/{'story':9/16,'square':1,'banner':16/9}[name];front,_=module.surface((x,y,z),w,h,angle,-.012,.055)
   for q in front:
    p=world_to_camera_view(scene,camera,Vector(point(q)));real=(p.x*model.size[0],(1-p.y)*model.size[1]);expected=project(q);calibration.append(math.dist(real,expected))
 bpy.ops.mesh.primitive_plane_add(size=100,location=(0,0,-.03));bpy.context.object.data.materials.append(floor)
 scene.world=bpy.data.worlds.new('Dark studio');scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.04,.05,.045,1)
 for name,position,power,size in [('Soft key',(-4,-2,7),1700,8),('Warm rim',(6,1,5),1000,5)]:
  d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=position;o.rotation_euler=(Vector((0,0,2))-o.location).to_track_quat('-Z','Y').to_euler()
 scene.frame_set(211);scene['delivery_method']='Projective native QHD60 renderer matching this editable 3D staging. Cycles product photographs are the image sources.'
 scene['recipe']='scripts/campaign-polish-20261110/render.py';scene['no_white_edges']=True
 (OUT/('blender-calibration'+('-mobile' if profile=='mobile' else '')+'.json')).write_text(json.dumps({'maxProjectionErrorPixels':max(calibration),'vertexChecks':len(calibration),'objects':len(scene.objects),'frames':600,'texturesPacked':True},indent=2)+'\n')
 assert max(calibration)<.1,max(calibration)
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/('campaign-staging'+('-mobile' if profile=='mobile' else '')+'.blend')))
 print('MASTER',max(calibration),len(scene.objects))
