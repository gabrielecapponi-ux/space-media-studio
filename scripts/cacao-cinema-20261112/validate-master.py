"""Reopen CACAO masters; validate actual articulated geometry and dependencies."""
import bpy,json,hashlib,argparse,sys,math
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
p=argparse.ArgumentParser();p.add_argument('--profiles',default='desktop,portrait');a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []);P=Path(__file__).resolve().parents[2];O=P/'outputs/cacao-cinema-20261112'
def obb(ob):
 lo=Vector(tuple(min(v[i]for v in ob.bound_box)for i in range(3)));hi=Vector(tuple(max(v[i]for v in ob.bound_box)for i in range(3)));m=ob.matrix_world;axes=[m.to_3x3().col[i]for i in range(3)]
 return m@((lo+hi)*.5),[v.normalized()for v in axes],[(hi[i]-lo[i])*.5*axes[i].length for i in range(3)]
def overlap(a,b):
 ca,aa,ha=a;cb,ab,hb=b;delta=cb-ca
 for axis in aa+ab+[x.cross(y)for x in aa for y in ab]:
  if axis.length<1e-7:continue
  axis.normalize();radius=sum(h*abs(v.dot(axis))for h,v in zip(ha,aa))+sum(h*abs(v.dot(axis))for h,v in zip(hb,ab))
  if radius-abs(delta.dot(axis))<1e-7:return False
 return True
rows=[]
for profile in a.profiles.split(','):
 master=O/f'cacao-cinema-{profile}.blend';bpy.ops.wm.open_mainfile(filepath=str(master));s=bpy.context.scene;N=s.frame_end
 root=s.objects['CACAO rigid box assembly'];hinge=s.objects['Physical rear lid hinge'];tablets=[s.objects[f'Chocolate {r}-{c}']for r in range(2)for c in range(3)]
 walls=[s.objects[n]for n in ['Front wall','Rear wall','Left wall','Right wall']]
 tray=[o for o in s.objects if o.name.startswith('Tray ') or o.name=='Recessed tray bottom']
 lids=[s.objects[n]for n in ['Citron rigid lid','Charcoal interior liner']]
 groups=[[o for o in t.children_recursive if o.type=='MESH' and o.name.startswith(('Tablet foundation ','Section '))]for t in tablets]
 protected=[o for t in tablets for o in t.children_recursive if o.type in ['MESH','CURVE','FONT']]+[s.objects['Front foil wordmark'],s.objects['Front foil line']]
 watched=[root,hinge,s.camera]+tablets;snaps={};floor_min=1;min_protected=[1,1,1,1];motion={'hinge':[],'hero_z':[],'hero_rx':[],'body_rz':[]};tested=0
 for f in range(1,N+2):
  s.frame_set(f);bpy.context.view_layer.update();w=[obb(o)for o in walls];r=[obb(o)for o in tray];l=[obb(o)for o in lids];g=[[obb(o)for o in group]for group in groups]
  for lid in l:
   for box in w+[x for group in g for x in group]:assert not overlap(lid,box),('lid collision',profile,f)
  for gi,boxes in enumerate(g):
   for box in boxes:
    for wall in w:assert not overlap(box,wall),('tablet-wall collision',profile,f,gi)
    for divider in r:assert not overlap(box,divider),('tablet-tray collision',profile,f,gi)
    for other_group in g[gi+1:]:
     for other in other_group:assert not overlap(box,other),('tablet-tablet collision',profile,f,gi)
  for ob in [s.objects['Rigid base bottom']]:floor_min=min(floor_min,min((ob.matrix_world@Vector(v)).z for v in ob.bound_box))
  pts=[world_to_camera_view(s,s.camera,o.matrix_world@Vector(v))for o in protected for v in o.bound_box]
  # Closed lid intentionally occludes the chocolate, but geometry must still remain framed.
  margins=[min(p.x for p in pts),min(1-p.x for p in pts),min(p.y for p in pts),min(1-p.y for p in pts)]
  min_protected=[min(x,y)for x,y in zip(min_protected,margins)]
  for k,val in [('hinge',hinge.rotation_euler.x),('hero_z',tablets[1].location.z),('hero_rx',tablets[1].rotation_euler.x),('body_rz',root.rotation_euler.z)]:motion[k].append(float(val))
  if f in [1,N+1]:snaps[f]=[[float(v)for row in ob.matrix_world for v in row]for ob in watched]
  tested+=1
 loop=max(abs(x-y)for aa,bb in zip(snaps[1],snaps[N+1])for x,y in zip(aa,bb));assert loop<1e-6
 assert floor_min>=-1e-6;assert min(min_protected)>0
 assert max(motion['hinge'])-min(motion['hinge'])>math.radians(100)
 assert max(motion['hero_z'])-min(motion['hero_z'])>.95
 deps=[]
 for f in bpy.data.fonts:
  deps.append({'type':'font','name':f.name,'file':f.filepath,'packed':bool(f.packed_file),'packed_sha256':hashlib.sha256(f.packed_file.data).hexdigest()if f.packed_file else None})
 for img in bpy.data.images:
  if img.source=='FILE':deps.append({'type':'image','name':img.name,'file':img.filepath,'packed':bool(img.packed_file)})
 assert not bpy.data.libraries,'Linked libraries unexpectedly present'
 assert all(d['packed'] or d['file']=='<builtin>'for d in deps),'External dependency found'
 row={'profile':profile,'master':str(master.relative_to(P)),'master_sha256':hashlib.sha256(master.read_bytes()).hexdigest(),'frames_tested':tested,'loop_max_matrix_error':loop,'min_ground_z':floor_min,'protected_margins':min_protected,'motion_ranges':{k:[min(v),max(v)]for k,v in motion.items()},'lid_collisions':0,'tablet_collisions':0,'tray_collisions':0,'dependencies':deps,'linked_libraries':0,'pass':True};rows.append(row);print(json.dumps(row),flush=True)
(O/'geometry-validation.json').write_text(json.dumps(rows,indent=2)+'\n')
