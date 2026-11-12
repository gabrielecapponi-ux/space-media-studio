"""Reopen each packed master and verify framing, continuity and dependencies."""
import bpy,json,hashlib,sys
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
P=Path(__file__).resolve().parents[2];O=P/'outputs/campaign-cinema-20261112';reports=[]
for profile in ['desktop','portrait']:
 master=O/f'campaign-cinema-{profile}.blend';bpy.ops.wm.open_mainfile(filepath=str(master));s=bpy.context.scene;N=s.frame_end;root=s.objects['CAMPAIGN / physical SHIFT sampler'];sampler=[o for o in root.children_recursive if o.type in {'MESH','FONT','CURVE'}];panels=[o for o in s.objects if o.name.endswith('physical plate')];subjects=sampler+panels;watched=[o for o in s.objects if o.animation_data]
 s.frame_set(1);bpy.context.view_layer.update();initial={o.name:o.matrix_world.copy()for o in watched};s.frame_set(N+1);bpy.context.view_layer.update();loop=max(abs(o.matrix_world[i][j]-initial[o.name][i][j])for o in watched for i in range(4)for j in range(4))
 rows=[]
 for f in list(range(1,N+1,8))+[N,N+1]:
  s.frame_set(f);bpy.context.view_layer.update()
  for name,objects in [('sampler',sampler)]+[(o.name,[o])for o in panels]:
   pts=[o.matrix_world@Vector(p)for o in objects for p in o.bound_box];projected=[world_to_camera_view(s,s.camera,p)for p in pts];box=[min(p.x for p in projected),max(p.x for p in projected),min(p.y for p in projected),max(p.y for p in projected)];rows.append({'frame':f,'object':name,'box':box,'min_z':min(p.z for p in pts)})
 bad=[r for r in rows if r['box'][0]<.015 or r['box'][1]>.985 or r['box'][2]<.015 or r['box'][3]>.985 or r['min_z']<=0]
 deps=[]
 for f in bpy.data.fonts:
  if f.filepath!='<builtin>':deps.append({'type':'font','name':f.name,'path':f.filepath,'packed':bool(f.packed_file),'packed_sha256':hashlib.sha256(f.packed_file.data).hexdigest()if f.packed_file else None})
 for i in bpy.data.images:
  if i.source=='FILE':deps.append({'type':'image','name':i.name,'path':i.filepath,'packed':bool(i.packed_file),'packed_sha256':hashlib.sha256(i.packed_file.data).hexdigest()if i.packed_file else None})
 material_ok=all(o.data.materials[0].name=='CAMPAIGN / graphite substrate and sides' and all(p.material_index==(1 if p.normal.y<-.5 else 0) for p in o.data.polygons) for o in panels)
 report={'profile':profile,'master':str(master.relative_to(P)),'sha256':hashlib.sha256(master.read_bytes()).hexdigest(),'frames':N,'fps':s.render.fps,'objects':len(s.objects),'framing_checks':len(rows),'framing_violations':bad,'screen_bounds':[min(r['box'][0]for r in rows),max(r['box'][1]for r in rows),min(r['box'][2]for r in rows),max(r['box'][3]for r in rows)],'minimum_floor_clearance':min(r['min_z']for r in rows),'loop_matrix_delta':loop,'all_edges_and_backs_graphite':material_ok,'dependencies':deps,'linked_libraries':[l.filepath for l in bpy.data.libraries]};reports.append(report)
 print('VALIDATION',profile,'bounds',report['screen_bounds'],'loop',loop,'bad',len(bad),flush=True)
 assert not bad and loop<1e-5 and material_ok and all(d['packed']for d in deps) and not bpy.data.libraries
(O/'geometry-validation.json').write_text(json.dumps(reports,indent=2)+'\n')
