"""Build OLTRE's original copper sculpture. Run Blender --background --python
this_file -- --output DIR --size 1200 --samples 128. Then cwebp -q 90 -alpha_q 100
render.png -o public/showcase/oltre/orbit.webp. No external assets or downloads.
"""
import bpy, math, sys, argparse, json
from pathlib import Path
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
p=argparse.ArgumentParser();p.add_argument('--output',required=True);p.add_argument('--size',type=int,default=1200);p.add_argument('--samples',type=int,default=128);a=p.parse_args(args);out=Path(a.output).resolve();out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
verts=[];faces=[];nu,nv=384,64
def centre(t):
 return Vector(((2+math.cos(3*t))*math.cos(2*t)*.62,(2+math.cos(3*t))*math.sin(2*t)*.62,math.sin(3*t)*.62))
for i in range(nu):
 u=math.tau*i/nu;c=centre(u);before=centre(u-.001);after=centre(u+.001)
 tangent=(after-before).normalized();normal=(after-2*c+before).normalized();binormal=tangent.cross(normal).normalized();normal=binormal.cross(tangent).normalized()
 for j in range(nv):
  v=math.tau*j/nv;p=c+.31*(normal*math.cos(v)+binormal*math.sin(v));verts.append(tuple(p))
for i in range(nu):
 for j in range(nv):faces.append((i*nv+j,((i+1)%nu)*nv+j,((i+1)%nu)*nv+(j+1)%nv,i*nv+(j+1)%nv))
mesh=bpy.data.meshes.new('Orbit continuous surface');mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new('OLTRE / Orbit',mesh);bpy.context.collection.objects.link(obj)
for poly in mesh.polygons:poly.use_smooth=True
obj.rotation_euler=(math.radians(20),math.radians(-22),math.radians(-35))
mat=bpy.data.materials.new('Satin copper');mat.use_nodes=True;bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(.64,.18,.047,1);bsdf.inputs['Metallic'].default_value=.88;bsdf.inputs['Roughness'].default_value=.28
obj.data.materials.append(mat)
world=bpy.data.worlds.new('Neutral studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.12,.14,.13,1);world.node_tree.nodes['Background'].inputs[1].default_value=.3;bpy.context.scene.world=world

def area(name,pos,power,color,size,size_y):
 light=bpy.data.lights.new(name,'AREA');light.energy=power;light.color=color;light.shape='RECTANGLE';light.size=size;light.size_y=size_y
 ob=bpy.data.objects.new(name,light);bpy.context.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(Vector((0,0,0))-ob.location).to_track_quat('-Z','Y').to_euler()
area('Long softbox / key',(-3,-4,5),950,(1,.9,.8),4,6)
area('Vertical rim',(4,1,3),1300,(.8,.9,1),2,5)
area('Front fill',(0,-5,.5),280,(1,1,1),5,2)
area('Top reflection',(-1,2,6),1000,(1,.72,.48),4,4)
camdata=bpy.data.cameras.new('Editorial camera');cam=bpy.data.objects.new('Editorial camera',camdata);bpy.context.collection.objects.link(cam);cam.location=(.5,-7.5,6.8);target=Vector((0,0,0));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=5.2;bpy.context.scene.camera=cam
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=a.samples;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.resolution_x=scene.render.resolution_y=a.size;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True;scene.render.filepath=str(out/'render.png');scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.render.image_settings.color_depth='8'
bpy.ops.wm.save_as_mainfile(filepath=str(out/'oltre-orbit.blend'));bpy.ops.render.render(write_still=True)
(out/'recipe.json').write_text(json.dumps({'version':bpy.app.version_string,'mesh':'original closed trefoil sculpture','vertices':len(verts),'quads':len(faces),'size':a.size,'samples':a.samples,'source':str(Path(__file__).name),'externalAssets':False},indent=2)+'\n')
